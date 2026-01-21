/**
 * Ethernet フレーム定義
 *
 * データリンク層（L2）で送受信されるフレームの構造を定義する。
 */

// ========================================
// 型定義
// ========================================

/** MACアドレスを表す型エイリアス (例: "AA:BB:CC:DD:EE:FF") */
export type MacAddress = string;

// ArpPacketのインポート（循環参照を避けるためtype-only import）
import type { ArpPacket } from './ArpPacket';
import type { IpPacket } from '../layer3/IpPacket';

/**
 * L2のペイロード（中身）の型エイリアス
 *
 * Phase 2: ARPパケットとIPv4パケットを型安全化
 *
 * stringは移行期の互換性のため残している:
 * - まだ型定義されていないプロトコル用
 * - Phase 3（L3完成後）で string を削除し完全型安全化
 */
export type L2Payload = ArpPacket | IpPacket | string;

/** EtherTypeの型エイリアス */
export type EtherType = number;

// ========================================
// EtherType 定数
// ========================================

/** EtherType: IPv4 = 0x0800 */
export const ETHER_TYPE_IPV4 = 0x0800;

/** EtherType: ARP = 0x0806 */
export const ETHER_TYPE_ARP = 0x0806;

/** EtherType: IPv6 = 0x86DD (将来用) */
export const ETHER_TYPE_IPV6 = 0x86dd;

/** EtherType: 802.1Q VLAN = 0x8100 (将来用) */
export const ETHER_TYPE_VLAN = 0x8100;

// ========================================
// 定数
// ========================================

/** ブロードキャストMACアドレス */
export const MAC_BROADCAST = 'FF:FF:FF:FF:FF:FF';

/** 不明/未設定のMACアドレス */
export const MAC_UNKNOWN = '00:00:00:00:00:00';

// ========================================
// Ethernet フレーム構造
// ========================================

/**
 * データリンク層を行き来するデータの単位
 *
 * 実際のEthernetフレーム構造:
 * +-------------------+
 * | Preamble (7 bytes)|  ※シミュレータでは省略
 * | SFD (1 byte)      |  ※シミュレータでは省略
 * +-------------------+
 * | Dst MAC (6 bytes) |
 * | Src MAC (6 bytes) |
 * | EtherType (2 bytes)|
 * +-------------------+
 * | Payload           |
 * | (46-1500 bytes)   |
 * +-------------------+
 * | FCS (4 bytes)     |  ※シミュレータでは省略
 * +-------------------+
 */
export interface EthernetFrame {
  // preamble: string; // プリアンブル（同期用ビット列）※省略
  // sfd: number;      // Start Frame Delimiter ※省略

  // ヘッダ情報
  /** 宛先MACアドレス */
  destinationMac: MacAddress;
  /** 送信元MACアドレス */
  sourceMac: MacAddress;
  /** EtherType (0x0800=IPv4, 0x0806=ARP) */
  type: EtherType;

  // ペイロード（中身）
  /** L3以上のデータ（IPパケット, ARPパケット等） */
  payload: L2Payload;

  // fcs: string; // フレームチェックシーケンス（エラーチェック用）※省略
}

// ========================================
// ユーティリティ関数
// ========================================

/**
 * EtherTypeを人間が読みやすい名前に変換
 */
export function etherTypeToString(type: EtherType): string {
  switch (type) {
    case ETHER_TYPE_IPV4:
      return 'IPv4';
    case ETHER_TYPE_ARP:
      return 'ARP';
    case ETHER_TYPE_IPV6:
      return 'IPv6';
    case ETHER_TYPE_VLAN:
      return '802.1Q';
    default:
      return `0x${type.toString(16).padStart(4, '0')}`;
  }
}

/**
 * MACアドレスがブロードキャストかどうか
 */
export function isBroadcastMac(mac: MacAddress): boolean {
  return mac.toUpperCase() === MAC_BROADCAST;
}

/**
 * MACアドレスの形式を検証
 */
export function isValidMacAddress(mac: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
  return macRegex.test(mac);
}