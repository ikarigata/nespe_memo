/**
 * IpStack - IP層処理スタック
 *
 * L2（NetworkInterface）とL3を接続する中心的なクラス。
 * INetworkLayerインターフェースを実装し、IPパケットの送受信を処理する。
 *
 * ## 責務
 * - IPパケットの受信処理（L2 → L3）
 * - IPパケットの送信処理（L3 → L2）
 * - ローカル配送 vs 転送の判断
 * - TTL処理
 * - ルーティングテーブル参照
 */

import type { INetworkLayer } from '../layer2/NetworkInterface';
import { NetworkInterface } from '../layer2/NetworkInterface';
import type { EtherType, L2Payload } from '../layer2/EthernetFrame';
import { ETHER_TYPE_IPV4 } from '../layer2/EthernetFrame';
import type { IpAddressString, SubnetMaskString } from './IpAddress';
import type { IpPacket, L3Payload } from './IpPacket';
import {
  IpProtocol,
  isIpPacket,
  formatIpPacket,
  decrementTtl,
  createIpPacket,
} from './IpPacket';
import { RoutingTable } from './RoutingTable';

// ========================================
// 型定義
// ========================================

/**
 * L4（トランスポート層）へのコールバック
 */
export interface ITransportLayer {
  /**
   * L3からパケットを受信
   *
   * @param packet IPパケット
   */
  onReceive(packet: IpPacket): void;
}

/**
 * インターフェース設定
 */
export interface InterfaceConfig {
  /** インターフェースID（内部管理用） */
  id: string;
  /** NetworkInterfaceインスタンス */
  nic: NetworkInterface;
  /** IPアドレス */
  ipAddress: IpAddressString;
  /** サブネットマスク */
  subnetMask: SubnetMaskString;
}

// ========================================
// IpStack クラス
// ========================================

/**
 * IP層処理スタック
 *
 * @example
 * // ホスト（エンドノード）として使用
 * const nic = new NetworkInterface('AA:BB:CC:DD:EE:FF', 'eth0');
 * const ipStack = new IpStack();
 * ipStack.addInterface('eth0', nic, '192.168.1.10', '255.255.255.0');
 * ipStack.setDefaultGateway('192.168.1.1', 'eth0');
 *
 * // パケット送信
 * await ipStack.sendPacket('192.168.2.100', IpProtocol.ICMP, icmpPayload);
 *
 * @example
 * // ルーターとして使用
 * const ipStack = new IpStack({ enableForwarding: true });
 * ipStack.addInterface('eth0', nic1, '192.168.1.1', '255.255.255.0');
 * ipStack.addInterface('eth1', nic2, '192.168.2.1', '255.255.255.0');
 */
export class IpStack implements INetworkLayer {
  // ========================================
  // プロパティ
  // ========================================

  /** インターフェース一覧（ID → 設定） */
  private interfaces: Map<string, InterfaceConfig> = new Map();

  /** ルーティングテーブル */
  readonly routingTable: RoutingTable = new RoutingTable();

  /** IP転送を有効にするか（ルーターとして動作） */
  private enableForwarding: boolean;

  /** L4層への参照 */
  private transportLayer?: ITransportLayer;

  /** 受信コールバック（テスト・デバッグ用） */
  onReceivePacket?: (packet: IpPacket, interfaceId: string) => void;

  // ========================================
  // コンストラクタ
  // ========================================

  constructor(options?: { enableForwarding?: boolean }) {
    this.enableForwarding = options?.enableForwarding ?? false;

    if (this.enableForwarding) {
      console.log('[IpStack] IP転送が有効（ルーターモード）');
    }
  }

  // ========================================
  // インターフェース管理
  // ========================================

  /**
   * インターフェースを追加
   *
   * @param id インターフェースID
   * @param nic NetworkInterfaceインスタンス
   * @param ipAddress IPアドレス
   * @param subnetMask サブネットマスク
   */
  addInterface(
    id: string,
    nic: NetworkInterface,
    ipAddress: IpAddressString,
    subnetMask: SubnetMaskString
  ): void {
    // NICにIPアドレスを設定（ARP有効化）
    nic.setIpAddress(ipAddress);

    // NICの上位層として自分を設定
    nic.upperLayer = this;

    // インターフェース設定を保存
    const config: InterfaceConfig = {
      id,
      nic,
      ipAddress,
      subnetMask,
    };
    this.interfaces.set(id, config);

    // 直接接続ルートを自動追加
    this.routingTable.addConnectedRoute(ipAddress, subnetMask, id);

    console.log(
      `[IpStack] インターフェース追加: ${id} = ${ipAddress}/${subnetMask}`
    );
  }

  /**
   * インターフェース設定を取得
   */
  getInterface(id: string): InterfaceConfig | undefined {
    return this.interfaces.get(id);
  }

  /**
   * 全インターフェースを取得
   */
  getAllInterfaces(): InterfaceConfig[] {
    return Array.from(this.interfaces.values());
  }

  /**
   * デフォルトゲートウェイを設定
   *
   * @param gateway ゲートウェイIPアドレス
   * @param interfaceId 出力インターフェースID
   */
  setDefaultGateway(gateway: IpAddressString, interfaceId: string): void {
    this.routingTable.setDefaultGateway(gateway, interfaceId);
  }

  // ========================================
  // L4層との接続
  // ========================================

  /**
   * トランスポート層を設定
   */
  setTransportLayer(layer: ITransportLayer): void {
    this.transportLayer = layer;
  }

  // ========================================
  // 受信処理（INetworkLayer実装）
  // ========================================

  /**
   * L2からのフレーム受信
   *
   * NetworkInterfaceから呼び出される。
   */
  receive(payload: L2Payload, type: EtherType, sourceMac?: string): void {
    // IPv4パケット以外は無視
    if (type !== ETHER_TYPE_IPV4) {
      console.log(`[IpStack] 非IPv4パケットを受信 (EtherType=0x${type.toString(16)}), 破棄`);
      return;
    }

    // ペイロードがIpPacketかチェック
    if (!isIpPacket(payload)) {
      console.warn('[IpStack] 不正なIPパケット形式, 破棄');
      return;
    }

    const packet = payload;
    console.log(`[IpStack] 受信: ${formatIpPacket(packet)}`);

    // 受信インターフェースを特定
    const receivedInterface = this.findInterfaceBySourceMac(sourceMac);

    // コールバック通知
    if (this.onReceivePacket) {
      this.onReceivePacket(packet, receivedInterface?.id ?? 'unknown');
    }

    // 自分宛てか判定
    if (this.isLocalAddress(packet.header.destinationIp)) {
      // ローカル配送
      this.deliverLocally(packet);
    } else if (this.enableForwarding) {
      // 転送
      this.forwardPacket(packet);
    } else {
      console.log(
        `[IpStack] 自分宛てでないパケット (Dst: ${packet.header.destinationIp}), 転送無効のため破棄`
      );
    }
  }

  /**
   * MACアドレスからインターフェースを逆引き
   * TODO: 受信インターフェースの特定を実装
   */
  private findInterfaceBySourceMac(
    _sourceMac?: string
  ): InterfaceConfig | undefined {
    // 簡易実装: 現状は未実装
    return undefined;
  }

  // ========================================
  // アドレス判定
  // ========================================

  /**
   * 自分のIPアドレスかどうか判定
   */
  isLocalAddress(ip: IpAddressString): boolean {
    for (const config of this.interfaces.values()) {
      if (config.ipAddress === ip) {
        return true;
      }
    }
    return false;
  }

  /**
   * ブロードキャストアドレスか判定
   * TODO: サブネットブロードキャストの判定を実装
   */
  private _isBroadcast(ip: IpAddressString): boolean {
    // 限定ブロードキャスト
    if (ip === '255.255.255.255') return true;

    // TODO: 各インターフェースのサブネットブロードキャストを判定
    return false;
  }

  // ========================================
  // ローカル配送
  // ========================================

  /**
   * 自分宛てのパケットをL4層に配送
   */
  private deliverLocally(packet: IpPacket): void {
    console.log(
      `[IpStack] ローカル配送: Proto=${packet.header.protocol}`
    );

    if (this.transportLayer) {
      this.transportLayer.onReceive(packet);
    } else {
      console.log('[IpStack] L4層未接続, パケット破棄');
    }
  }

  // ========================================
  // 転送処理
  // ========================================

  /**
   * パケットを転送
   */
  private async forwardPacket(packet: IpPacket): Promise<void> {
    // TTLチェック
    if (packet.header.ttl <= 1) {
      console.log('[IpStack] TTL超過, パケット破棄 (ICMP Time Exceeded送信は未実装)');
      // TODO: ICMP Time Exceeded送信
      return;
    }

    // TTL減算
    const forwardedPacket = decrementTtl(packet);

    console.log(
      `[IpStack] 転送: ${formatIpPacket(forwardedPacket)}`
    );

    // ルーティングテーブル検索
    const routeResult = this.routingTable.lookup(
      forwardedPacket.header.destinationIp
    );

    if (!routeResult) {
      console.log(
        `[IpStack] ルートなし: ${forwardedPacket.header.destinationIp}, 破棄 (ICMP Destination Unreachable送信は未実装)`
      );
      // TODO: ICMP Destination Unreachable送信
      return;
    }

    // 出力インターフェースを取得
    const outInterface = this.interfaces.get(routeResult.entry.interfaceId);
    if (!outInterface) {
      console.error(
        `[IpStack] インターフェース ${routeResult.entry.interfaceId} が見つからない`
      );
      return;
    }

    // 送信
    try {
      await outInterface.nic.sendToIp(
        routeResult.forwardTo,
        ETHER_TYPE_IPV4,
        forwardedPacket as unknown as L2Payload
      );
    } catch (error) {
      console.error(`[IpStack] 転送失敗: ${error}`);
    }
  }

  // ========================================
  // 送信処理
  // ========================================

  /**
   * IPパケットを送信
   *
   * @param destinationIp 宛先IPアドレス
   * @param protocol プロトコル番号
   * @param payload ペイロード
   * @param sourceIp 送信元IP（省略時は自動選択）
   */
  async sendPacket(
    destinationIp: IpAddressString,
    protocol: IpProtocol,
    payload: L3Payload,
    sourceIp?: IpAddressString
  ): Promise<void> {
    // ルーティングテーブル検索
    const routeResult = this.routingTable.lookup(destinationIp);

    if (!routeResult) {
      throw new Error(`No route to host: ${destinationIp}`);
    }

    // 出力インターフェースを取得
    const outInterface = this.interfaces.get(routeResult.entry.interfaceId);
    if (!outInterface) {
      throw new Error(
        `Interface ${routeResult.entry.interfaceId} not found`
      );
    }

    // 送信元IPを決定
    const srcIp = sourceIp ?? outInterface.ipAddress;

    // IPパケット作成
    const packet = createIpPacket(srcIp, destinationIp, protocol, payload);

    console.log(`[IpStack] 送信: ${formatIpPacket(packet)}`);

    // 送信
    await outInterface.nic.sendToIp(
      routeResult.forwardTo,
      ETHER_TYPE_IPV4,
      packet as unknown as L2Payload
    );
  }
}
