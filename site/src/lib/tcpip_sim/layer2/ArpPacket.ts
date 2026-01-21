/**
 * ARP (Address Resolution Protocol) パケット定義
 *
 * ARPはIPアドレスからMACアドレスを解決するためのプロトコル。
 * L2(Ethernet)とL3(IP)の間に位置し、EthernetフレームのペイロードとしてEtherType=0x0806で送受信される。
 *
 * 実際のARPパケット構造:
 * +----------------+----------------+
 * | Hardware Type  | Protocol Type  |  (2bytes each)
 * +----------------+----------------+
 * | HW Addr Len | Proto Addr Len |  (1byte each)
 * +----------------+----------------+
 * |         Operation              |  (2bytes: 1=Request, 2=Reply)
 * +----------------+----------------+
 * |     Sender Hardware Address    |  (6bytes for Ethernet)
 * +----------------+----------------+
 * |     Sender Protocol Address    |  (4bytes for IPv4)
 * +----------------+----------------+
 * |     Target Hardware Address    |  (6bytes for Ethernet)
 * +----------------+----------------+
 * |     Target Protocol Address    |  (4bytes for IPv4)
 * +----------------+----------------+
 */

// 定数はEthernetFrame.tsからインポート（重複定義を避ける）
import {
  ETHER_TYPE_ARP,
  ETHER_TYPE_IPV4,
  MAC_BROADCAST,
  MAC_UNKNOWN,
} from './EthernetFrame';

// 再エクスポート（外部から ArpPacket 経由でも使用可能に）
export { ETHER_TYPE_ARP, ETHER_TYPE_IPV4, MAC_BROADCAST, MAC_UNKNOWN };

// ========================================
// ARPオペレーション
// ========================================

/**
 * ARPオペレーションタイプ
 */
export enum ArpOperation {
  /** ARP Request: 「このIPを持っている人、MACアドレスを教えて」 */
  REQUEST = 1,
  /** ARP Reply: 「そのIPは私です。MACアドレスはこれです」 */
  REPLY = 2,
}

// ========================================
// ARPパケット構造
// ========================================

/**
 * ARPパケット
 *
 * Ethernetフレームのペイロードとして格納される。
 * シミュレータでは簡略化のため、HardwareType/ProtocolType/Lengthフィールドは省略。
 */
export interface ArpPacket {
  /** オペレーション: REQUEST(1) または REPLY(2) */
  operation: ArpOperation;

  /** 送信者のMACアドレス */
  senderMac: string;

  /** 送信者のIPアドレス */
  senderIp: string;

  /** ターゲットのMACアドレス (REQUEST時は 00:00:00:00:00:00) */
  targetMac: string;

  /** ターゲットのIPアドレス (解決したいIPアドレス) */
  targetIp: string;
}

// ========================================
// ファクトリ関数
// ========================================

/**
 * ARP Requestパケットを作成
 *
 * @param senderMac 送信者のMACアドレス
 * @param senderIp 送信者のIPアドレス
 * @param targetIp 解決したいIPアドレス
 * @returns ARP Requestパケット
 *
 * @example
 * // 192.168.1.10 のMACアドレスを知りたい場合
 * const request = createArpRequest('AA:BB:CC:DD:EE:FF', '192.168.1.1', '192.168.1.10');
 */
export function createArpRequest(
  senderMac: string,
  senderIp: string,
  targetIp: string
): ArpPacket {
  return {
    operation: ArpOperation.REQUEST,
    senderMac,
    senderIp,
    targetMac: MAC_UNKNOWN, // REQUEST時はターゲットMACは不明
    targetIp,
  };
}

/**
 * ARP Replyパケットを作成
 *
 * @param senderMac 送信者のMACアドレス（応答する側）
 * @param senderIp 送信者のIPアドレス（応答する側）
 * @param targetMac 宛先のMACアドレス（リクエストを送ってきた側）
 * @param targetIp 宛先のIPアドレス（リクエストを送ってきた側）
 * @returns ARP Replyパケット
 *
 * @example
 * // ARP Requestに対する応答
 * const reply = createArpReply(
 *   'AA:BB:CC:DD:EE:FF', '192.168.1.10',  // 自分（応答者）
 *   '11:22:33:44:55:66', '192.168.1.1'    // リクエスト元
 * );
 */
export function createArpReply(
  senderMac: string,
  senderIp: string,
  targetMac: string,
  targetIp: string
): ArpPacket {
  return {
    operation: ArpOperation.REPLY,
    senderMac,
    senderIp,
    targetMac,
    targetIp,
  };
}

// ========================================
// ユーティリティ関数
// ========================================

/**
 * ARPパケットかどうかを判定する型ガード
 */
export function isArpPacket(payload: unknown): payload is ArpPacket {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.operation === 'number' &&
    (p.operation === ArpOperation.REQUEST || p.operation === ArpOperation.REPLY) &&
    typeof p.senderMac === 'string' &&
    typeof p.senderIp === 'string' &&
    typeof p.targetMac === 'string' &&
    typeof p.targetIp === 'string'
  );
}

/**
 * ARPパケットを人間が読みやすい形式で表示
 */
export function formatArpPacket(packet: ArpPacket): string {
  const opName = packet.operation === ArpOperation.REQUEST ? 'REQUEST' : 'REPLY';
  return `ARP ${opName}: Who has ${packet.targetIp}? Tell ${packet.senderIp} (${packet.senderMac})`;
}
