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
  /** リトライ間隔（ミリ秒）。デフォルト: 1000ms */
  retryInterval: number;
}

const DEFAULT_CONFIG: ArpHandlerConfig = {
  requestTimeout: 3000,
  maxRetries: 3,
  retryInterval: 1000,
};

// ========================================
// 待機中のリクエスト管理
// ========================================

/**
 * 待機中のARP解決リクエスト
 */
interface PendingRequest {
  targetIp: string;
  resolve: (mac: string) => void;
  reject: (error: Error) => void;
  retryCount: number;
  timeoutId: ReturnType<typeof setTimeout>;
}

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

  /** 待機中のリクエスト（IP -> PendingRequest） */
  private pendingRequests: Map<string, PendingRequest> = new Map();

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
    // 1. ARPテーブルを確認
    const cachedMac = this.arpTable.lookup(targetIp);
    if (cachedMac) {
      console.log(`[ARP] Cache hit: ${targetIp} -> ${cachedMac}`);
      return cachedMac;
    }

    // 2. 既に同じIPへのリクエストが進行中なら、そのPromiseを共有
    const existing = this.pendingRequests.get(targetIp);
    if (existing) {
      console.log(`[ARP] Request already pending for ${targetIp}`);
      return new Promise((resolve, reject) => {
        // 既存のpendingに追加のコールバックを設定
        const originalResolve = existing.resolve;
        const originalReject = existing.reject;
        existing.resolve = (mac: string) => {
          originalResolve(mac);
          resolve(mac);
        };
        existing.reject = (error: Error) => {
          originalReject(error);
          reject(error);
        };
      });
    }

    // 3. 新規リクエストを開始
    return this.startArpResolution(targetIp);
  }

  /**
   * ARP解決を開始（内部メソッド）
   */
  private startArpResolution(targetIp: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const pending: PendingRequest = {
        targetIp,
        resolve,
        reject,
        retryCount: 0,
        timeoutId: setTimeout(() => {}, 0), // プレースホルダー
      };

      this.pendingRequests.set(targetIp, pending);

      // 最初のリクエストを送信
      this.sendArpRequestWithRetry(pending);
    });
  }

  /**
   * ARP Requestをリトライ付きで送信
   */
  private sendArpRequestWithRetry(pending: PendingRequest): void {
    const { targetIp, retryCount } = pending;

    if (retryCount >= this.config.maxRetries) {
      // リトライ上限に達した
      this.pendingRequests.delete(targetIp);
      pending.reject(new Error(`ARP resolution failed for ${targetIp} after ${retryCount} retries`));
      console.log(`[ARP] Resolution failed: ${targetIp} (max retries exceeded)`);
      return;
    }

    // ARPテーブルにINCOMPLETEエントリを作成
    this.arpTable.setIncomplete(targetIp);

    // ARP Requestを送信
    this.sendArpRequest(targetIp);

    // タイムアウト設定
    pending.timeoutId = setTimeout(() => {
      pending.retryCount++;
      console.log(`[ARP] Retry ${pending.retryCount}/${this.config.maxRetries} for ${targetIp}`);
      this.sendArpRequestWithRetry(pending);
    }, this.config.requestTimeout);
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
    // ArpPacketオブジェクトをそのまま渡す（型安全）
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

    // ユニキャストで返信（ArpPacketオブジェクトをそのまま渡す）
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
    // 待機中のリクエストがあれば解決
    const pending = this.pendingRequests.get(packet.senderIp);
    if (pending) {
      clearTimeout(pending.timeoutId);
      this.pendingRequests.delete(packet.senderIp);
      console.log(`[ARP] Resolved: ${packet.senderIp} -> ${packet.senderMac}`);
      pending.resolve(packet.senderMac);
    }
  }

  // ========================================
  // デバッグ・ユーティリティ
  // ========================================

  /**
   * 待機中のリクエスト数
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * 全てのリソースをクリーンアップ
   */
  cleanup(): void {
    // 全ての待機中リクエストをキャンセル
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('ARP handler cleanup'));
    }
    this.pendingRequests.clear();
    this.arpTable.clear();
  }
}
