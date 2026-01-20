/**
 * NetworkInterface (NIC) - ネットワークインターフェースカード
 *
 * L2（データリンク層）の処理を担当するクラス。
 * 物理ポート（L1）と上位層（L3）の間でフレームの送受信を行う。
 *
 * ## 責務
 * - Ethernetフレームの送受信
 * - MACアドレスフィルタリング
 * - ARP処理（IPアドレス → MACアドレス解決）
 * - 上位層（L3）へのデマルチプレクシング
 */

import { Port } from '../layer1/Port';
import { Signal } from '../layer1/Signal';
import type { EthernetFrame, EtherType, L2Payload } from './EthernetFrame';
import {
  ETHER_TYPE_ARP,
  ETHER_TYPE_IPV4,
  MAC_BROADCAST,
  etherTypeToString,
} from './EthernetFrame';
import { ArpHandler } from './ArpHandler';

// ========================================
// 上位層インターフェース
// ========================================

/**
 * 上位層 (L3: NetworkLayer) のためのインターフェース
 *
 * 依存関係の逆転 (DIP) を実現するために定義。
 * NICは「具体的なIP層の実装」を知らないが、「このメソッドを持つ誰か」であることは知っている。
 */
export interface INetworkLayer {
  /**
   * L2ヘッダを剥がした後、中身(パケット)とタイプ(IPv4/ARP)を受け取るメソッド
   *
   * @param payload L2ペイロード（IPパケット等）
   * @param type EtherType
   * @param sourceMac 送信元MACアドレス（L3で必要になる場合用）
   */
  receive(payload: L2Payload, type: EtherType, sourceMac?: string): void;
}

// ========================================
// NetworkInterface クラス
// ========================================

/**
 * ネットワークインターフェース（NIC）
 *
 * @example
 * // NICを作成
 * const nic = new NetworkInterface('AA:BB:CC:DD:EE:FF', 'eth0');
 *
 * // IPアドレスを設定してARP機能を有効化
 * nic.setIpAddress('192.168.1.1');
 *
 * // フレームを送信
 * await nic.sendFrame('11:22:33:44:55:66', ETHER_TYPE_IPV4, payload);
 *
 * // MACアドレス解決（ARP経由）
 * const mac = await nic.resolveIpToMac('192.168.1.10');
 */
export class NetworkInterface {
  // ========================================
  // プロパティ
  // ========================================

  /** NIC固有のMACアドレス */
  readonly macAddress: string;

  /** NICは物理ポートを1つ持っている (Has-a) */
  readonly port: Port;

  /**
   * 上位層への参照 (OSのIPスタックなど)
   * 初期化後に「このNICはこのOSに刺さっている」と設定される
   */
  upperLayer?: INetworkLayer;

  /**
   * プロミスキャスモード (自分宛て以外も受信するか)
   * パケットキャプチャ等の実験用フラグ
   */
  isPromiscuous: boolean = false;

  /**
   * ARPハンドラ
   * IPアドレスが設定されている場合のみ有効
   */
  private arpHandler?: ArpHandler;

  // ========================================
  // コンストラクタ
  // ========================================

  constructor(mac: string, portId: string) {
    this.macAddress = mac;

    // NICとポートは1対1対応
    this.port = new Port(portId);

    // 物理層からの「割り込み」を配線 (Wiring)
    // ポートに電気が流れてきたら、自分の handleSignal メソッドを起動させる
    this.port.onReceive = (signal) => this.handleSignal(signal);
  }

  // ========================================
  // IPアドレス設定（ARP有効化）
  // ========================================

  /**
   * IPアドレスを設定し、ARPハンドラを初期化
   *
   * @param ipAddress このインターフェースのIPアドレス
   */
  setIpAddress(ipAddress: string): void {
    if (this.arpHandler) {
      this.arpHandler.setIpAddress(ipAddress);
    } else {
      this.arpHandler = new ArpHandler(this, ipAddress);
    }
    console.log(`[NIC:${this.macAddress}] IP address set: ${ipAddress}`);
  }

  /**
   * IPアドレスを取得
   */
  getIpAddress(): string | undefined {
    return this.arpHandler?.getIpAddress();
  }

  /**
   * ARPハンドラを取得（外部からARPテーブルにアクセスする場合等）
   */
  getArpHandler(): ArpHandler | undefined {
    return this.arpHandler;
  }

  // ========================================
  // MACアドレス解決（ARP）
  // ========================================

  /**
   * IPアドレスからMACアドレスを解決
   *
   * ARPテーブルにエントリがあればそれを返し、
   * なければARP Requestを送信して応答を待つ。
   *
   * @param targetIp 解決したいIPアドレス
   * @returns MACアドレス
   * @throws ARPハンドラが初期化されていない、または解決に失敗した場合
   */
  async resolveIpToMac(targetIp: string): Promise<string> {
    if (!this.arpHandler) {
      throw new Error('ARP not available: IP address not configured');
    }
    return this.arpHandler.resolve(targetIp);
  }

  /**
   * IPアドレスに対してパケットを送信（ARP解決付き）
   *
   * MACアドレスが不明な場合は自動的にARP解決を行う。
   *
   * @param destIp 宛先IPアドレス
   * @param type EtherType
   * @param payload ペイロード
   */
  async sendToIp(destIp: string, type: EtherType, payload: L2Payload): Promise<void> {
    const destMac = await this.resolveIpToMac(destIp);
    await this.sendFrame(destMac, type, payload);
  }

  // ========================================
  // 受信処理
  // ========================================

  /**
   * 受信処理 (Demultiplexing & Decapsulation)
   * L1(Signal) -> L2(Frame) -> L3(Packet) または ARP処理
   */
  private handleSignal(signal: Signal<unknown>): void {
    // 1. 信号からフレームを取り出す (L1 -> L2)
    // L1は中身を知らないので、ここで「これはEthernetFrameだ」と解釈する
    const frame = signal.payload as EthernetFrame;

    // 2. MACアドレスフィルタリング (L2の仕事)
    const isMyPacket = frame.destinationMac === this.macAddress;
    const isBroadcast = frame.destinationMac === MAC_BROADCAST;

    // 自分宛て or ブロードキャスト or プロミスキャスモード なら受信
    if (!isMyPacket && !isBroadcast && !this.isPromiscuous) {
      // 破棄 (Drop) - CPUには通知せず、ここで捨てる
      return;
    }

    console.log(
      `[NIC:${this.macAddress}] 受信成功 (Dst: ${frame.destinationMac}, Type: ${etherTypeToString(frame.type)})`
    );

    // 3. EtherTypeに基づいてデマルチプレクシング
    switch (frame.type) {
      case ETHER_TYPE_ARP:
        // ARP処理
        this.handleArpFrame(frame);
        break;

      case ETHER_TYPE_IPV4:
      default:
        // 上位層 (IP層) へ渡す
        this.handleUpperLayerFrame(frame);
        break;
    }
  }

  /**
   * ARPフレームを処理
   */
  private handleArpFrame(frame: EthernetFrame): void {
    if (!this.arpHandler) {
      console.warn(`[NIC:${this.macAddress}] ARP received but no IP configured (Drop)`);
      return;
    }
    this.arpHandler.handleArpPacket(frame.payload);
  }

  /**
   * 上位層（L3）へフレームを渡す
   */
  private handleUpperLayerFrame(frame: EthernetFrame): void {
    if (this.upperLayer) {
      // Ethernetヘッダを剥がして、ペイロードだけを渡す
      this.upperLayer.receive(frame.payload, frame.type, frame.sourceMac);
    } else {
      console.warn(`[NIC:${this.macAddress}] 受信しましたが、上位層(OS)が接続されていません (Drop)`);
    }
  }

  // ========================================
  // 送信処理
  // ========================================

  /**
   * 送信処理 (Encapsulation)
   * L3(Packet) -> L2(Frame) -> L1(Signal)
   *
   * @param destMac 宛先MACアドレス (ARPで解決済みか、Broadcast)
   * @param type 中身のタイプ (IPv4=0x0800, ARP=0x0806)
   * @param payload 中身のデータ (IPパケットなど)
   */
  async sendFrame(destMac: string, type: EtherType, payload: L2Payload): Promise<void> {
    // 1. L2ヘッダの付与 (Ethernet Frame作成)
    const frame: EthernetFrame = {
      destinationMac: destMac,
      sourceMac: this.macAddress, // 送信元は必ず自分
      type: type,
      payload: payload,
    };

    console.log(
      `[NIC:${this.macAddress}] 送信開始 (To: ${destMac}, Type: ${etherTypeToString(type)})`
    );

    // 2. 電気信号に変換 (L1用の箱に入れる)
    const signal = new Signal<EthernetFrame>(frame);

    // 3. 物理ポートへ流す
    await this.port.send(signal);
  }
}