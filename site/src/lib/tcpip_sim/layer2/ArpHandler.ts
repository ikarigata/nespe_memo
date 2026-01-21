/**
 * ARPハンドラ
 *
 * ARP Request/Replyの送受信を管理するクラス。
 * NetworkInterfaceと連携して、IPアドレスからMACアドレスを解決する。
 *
 * ## ARP解決フロー
 *
 * ### 送信時（MACアドレスが不明な場合）
 * 1. resolve(targetIp) を呼び出す
 * 2. ARPテーブルを確認
 * 3. エントリがなければ ARP Request をブロードキャスト
 * 4. ARP Reply を待機（Promise）
 * 5. Reply受信後、MACアドレスを返却
 *
 * ### 受信時
 * - ARP Request: 自分のIPなら ARP Reply を返す
 * - ARP Reply: ARPテーブルを更新、待機中のPromiseを解決
 */

import type { ArpPacket } from './ArpPacket';
import {
  ArpOperation,
  createArpRequest,
  createArpReply,
  ETHER_TYPE_ARP,
  MAC_BROADCAST,
  formatArpPacket,
  isArpPacket,
} from './ArpPacket';
import { ArpTable } from './ArpTable';
import type { NetworkInterface } from './NetworkInterface';

// ========================================
// 設定
// ========================================

/**
 * ARPハンドラの設定
 */
export interface ArpHandlerConfig {
  /** ARP Request のタイムアウト（ミリ秒）。デフォルト: 3000ms */
  requestTimeout: number;
  /** ARP Request の最大リトライ回数。デフォルト: 3 */
  maxRetries: number;
}

const DEFAULT_CONFIG: ArpHandlerConfig = {
  requestTimeout: 3000,
  maxRetries: 3,
};

// ========================================
// ARPハンドラ クラス
// ========================================

/**
 * ARPハンドラ
 *
 * @example
 * const arpHandler = new ArpHandler(networkInterface, '192.168.1.1');
 *
 * // MACアドレスを解決
 * const mac = await arpHandler.resolve('192.168.1.10');
 * console.log(mac); // 'AA:BB:CC:DD:EE:FF'
 */
export class ArpHandler {
  /** このハンドラが紐づくNetworkInterface */
  private nic: NetworkInterface;

  /** このインターフェースのIPアドレス */
  private ipAddress: string;

  /** ARPテーブル */
  readonly arpTable: ArpTable;

  /** 設定 */
  private config: ArpHandlerConfig;

  /** ARP Reply受信時のコールバック（IP -> callback） */
  private replyCallbacks: Map<string, (mac: string) => void> = new Map();

  constructor(
    nic: NetworkInterface,
    ipAddress: string,
    config: Partial<ArpHandlerConfig> = {}
  ) {
    this.nic = nic;
    this.ipAddress = ipAddress;
    this.arpTable = new ArpTable();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ========================================
  // IPアドレスの設定/取得
  // ========================================

  /**
   * IPアドレスを取得
   */
  getIpAddress(): string {
    return this.ipAddress;
  }

  /**
   * IPアドレスを設定
   */
  setIpAddress(ip: string): void {
    this.ipAddress = ip;
  }

  // ========================================
  // MACアドレス解決
  // ========================================

  /**
   * IPアドレスからMACアドレスを解決
   *
   * ARPテーブルにエントリがあればそれを返し、
   * なければARP Requestを送信して応答を待つ。
   *
   * @param targetIp 解決したいIPアドレス
   * @returns MACアドレス
   * @throws ARP解決に失敗した場合
   *
   * @example
   * try {
   *   const mac = await arpHandler.resolve('192.168.1.10');
   *   console.log(`Resolved: ${mac}`);
   * } catch (e) {
   *   console.error('ARP resolution failed');
   * }
   */
  async resolve(targetIp: string): Promise<string> {
    // ARPテーブルを確認
    const cachedMac = this.arpTable.lookup(targetIp);
    if (cachedMac) {
      console.log(`[ARP] Cache hit: ${targetIp} -> ${cachedMac}`);
      return cachedMac;
    }

    // NOTE: 同時リクエストの相乗り（request deduplication）は未実装
    // 教育用シミュレータのため、シンプルさを優先
    // 本番実装では inflight Map で重複排除すべき

    // ARP解決を実行
    return this.doResolve(targetIp);
  }

  /**
   * ARP解決を実行（内部メソッド）
   *
   * リトライ付きでARP Requestを送信し、Replyを待つ。
   */
  private async doResolve(targetIp: string): Promise<string> {
    const { maxRetries, requestTimeout } = this.config;

    // ARPテーブルにINCOMPLETEエントリを作成
    this.arpTable.setIncomplete(targetIp);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // ARP Requestを送信
      this.sendArpRequest(targetIp);

      try {
        // Replyを待機
        return await this.waitForReply(targetIp, requestTimeout);
      } catch {
        // タイムアウト、リトライ
        if (attempt < maxRetries - 1) {
          console.log(`[ARP] Retry ${attempt + 1}/${maxRetries} for ${targetIp}`);
        }
      }
    }

    console.log(`[ARP] Resolution failed: ${targetIp} (max retries exceeded)`);
    throw new Error(`ARP resolution failed for ${targetIp} after ${maxRetries} retries`);
  }

  /**
   * ARP Replyを待機
   */
  private waitForReply(targetIp: string, timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.replyCallbacks.delete(targetIp);
        reject(new Error('ARP request timeout'));
      }, timeout);

      this.replyCallbacks.set(targetIp, (mac: string) => {
        clearTimeout(timer);
        this.replyCallbacks.delete(targetIp);
        resolve(mac);
      });
    });
  }

  // ========================================
  // ARP Request送信
  // ========================================

  /**
   * ARP Requestをブロードキャスト送信
   *
   * @param targetIp 解決したいIPアドレス
   */
  sendArpRequest(targetIp: string): void {
    const arpPacket = createArpRequest(
      this.nic.macAddress,
      this.ipAddress,
      targetIp
    );

    console.log(`[ARP] Sending Request: Who has ${targetIp}? Tell ${this.ipAddress}`);

    // ARPパケットをEthernetフレームとしてブロードキャスト
    this.nic.sendFrame(MAC_BROADCAST, ETHER_TYPE_ARP, arpPacket);
  }

  // ========================================
  // ARP Reply送信
  // ========================================

  /**
   * ARP Replyを送信
   *
   * @param targetMac 宛先MACアドレス
   * @param targetIp 宛先IPアドレス
   */
  sendArpReply(targetMac: string, targetIp: string): void {
    const arpPacket = createArpReply(
      this.nic.macAddress,
      this.ipAddress,
      targetMac,
      targetIp
    );

    console.log(`[ARP] Sending Reply: ${this.ipAddress} is at ${this.nic.macAddress}`);

    // ユニキャストで返信
    this.nic.sendFrame(targetMac, ETHER_TYPE_ARP, arpPacket);
  }

  // ========================================
  // ARP受信処理
  // ========================================

  /**
   * ARPパケットを受信処理
   *
   * NetworkInterfaceから呼び出される。
   *
   * @param payload 受信したARPパケット（L2Payload型）
   */
  handleArpPacket(payload: unknown): void {
    // 型ガードを使って安全にArpPacketか判定
    if (!isArpPacket(payload)) {
      console.warn('[ARP] Received invalid ARP packet:', payload);
      return;
    }

    const arpPacket = payload;
    console.log(`[ARP] Received: ${formatArpPacket(arpPacket)}`);

    // 送信元情報をARPテーブルに学習（常に行う）
    this.arpTable.update(arpPacket.senderIp, arpPacket.senderMac);

    if (arpPacket.operation === ArpOperation.REQUEST) {
      this.handleArpRequest(arpPacket);
    } else if (arpPacket.operation === ArpOperation.REPLY) {
      this.handleArpReply(arpPacket);
    }
  }

  /**
   * ARP Requestを処理
   */
  private handleArpRequest(packet: ArpPacket): void {
    // 自分のIPアドレス宛てか確認
    if (packet.targetIp !== this.ipAddress) {
      console.log(`[ARP] Request not for me (target: ${packet.targetIp}, my IP: ${this.ipAddress})`);
      return;
    }

    // ARP Replyを返す
    console.log(`[ARP] Request is for me! Sending reply...`);
    this.sendArpReply(packet.senderMac, packet.senderIp);
  }

  /**
   * ARP Replyを処理
   */
  private handleArpReply(packet: ArpPacket): void {
    // 待機中のコールバックがあれば実行
    const callback = this.replyCallbacks.get(packet.senderIp);
    if (callback) {
      console.log(`[ARP] Resolved: ${packet.senderIp} -> ${packet.senderMac}`);
      callback(packet.senderMac);
    }
  }

  // ========================================
  // デバッグ・ユーティリティ
  // ========================================

  /**
   * 待機中のリクエスト数
   */
  getPendingCount(): number {
    return this.replyCallbacks.size;
  }

  /**
   * 全てのリソースをクリーンアップ
   */
  cleanup(): void {
    this.replyCallbacks.clear();
    this.arpTable.clear();
  }
}
