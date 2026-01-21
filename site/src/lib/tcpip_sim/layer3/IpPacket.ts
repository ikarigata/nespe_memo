/**
 * IpPacket - IPv4パケット構造
 *
 * RFC 791準拠のIPv4パケットを表現。
 * 教育目的のため、一部のフィールドは簡略化。
 *
 * ## 実際のIPv4ヘッダ構造（参考）
 * ```
 *  0                   1                   2                   3
 *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |Version|  IHL  |Type of Service|          Total Length         |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |         Identification        |Flags|      Fragment Offset    |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |  Time to Live |    Protocol   |         Header Checksum       |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |                       Source Address                          |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |                    Destination Address                        |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |                    Options                    |    Padding    |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * ```
 *
 * ## 簡略化した部分
 * - IHL（ヘッダ長）: オプション非対応のため固定値5（20バイト）とみなす
 * - Type of Service: 省略
 * - Total Length: 自動計算
 * - Identification, Flags, Fragment Offset: フラグメント非対応のため省略
 * - Header Checksum: 省略（シミュレーション上は不要）
 * - Options: 非対応
 */

import type { IpAddressString } from './IpAddress';

// ========================================
// プロトコル番号（RFC 790）
// ========================================

/**
 * IPプロトコル番号
 *
 * IANAにより定義されている主要なプロトコル番号。
 * https://www.iana.org/assignments/protocol-numbers/
 */
export const enum IpProtocol {
  /** ICMP (Internet Control Message Protocol) */
  ICMP = 1,
  /** TCP (Transmission Control Protocol) */
  TCP = 6,
  /** UDP (User Datagram Protocol) */
  UDP = 17,
}

/**
 * プロトコル番号を文字列に変換
 */
export function ipProtocolToString(protocol: IpProtocol): string {
  switch (protocol) {
    case IpProtocol.ICMP:
      return 'ICMP';
    case IpProtocol.TCP:
      return 'TCP';
    case IpProtocol.UDP:
      return 'UDP';
    default:
      return `Unknown(${protocol})`;
  }
}

// ========================================
// L3ペイロード型
// ========================================

/**
 * L3ペイロード（IPパケットの中身）
 *
 * Phase 1: ICMP, 文字列（テスト用）
 * Phase 2: TCP, UDPセグメントを追加予定
 */
export type L3Payload = IcmpPacketData | string;

/**
 * ICMPパケットデータ（仮定義、IcmpPacket.tsで詳細定義予定）
 */
export interface IcmpPacketData {
  readonly _brand: 'IcmpPacket';
  type: number;
  code: number;
  data?: unknown;
}

/**
 * ICMPパケットかどうか判定
 */
export function isIcmpPacket(payload: L3Payload): payload is IcmpPacketData {
  return typeof payload === 'object' && payload !== null && '_brand' in payload && payload._brand === 'IcmpPacket';
}

// ========================================
// IPパケット構造
// ========================================

/**
 * IPv4ヘッダ
 */
export interface IpHeader {
  /**
   * IPバージョン（IPv4固定）
   * 実際のIPv4ヘッダでは4bit
   */
  readonly version: 4;

  /**
   * TTL (Time To Live)
   * パケットが転送される最大ホップ数。
   * ルーターを通過するたびに1減少し、0になると破棄される。
   * 一般的な初期値: 64, 128, 255
   */
  ttl: number;

  /**
   * プロトコル番号
   * ペイロードのプロトコルを示す。
   * 1=ICMP, 6=TCP, 17=UDP
   */
  protocol: IpProtocol;

  /**
   * 送信元IPアドレス
   */
  sourceIp: IpAddressString;

  /**
   * 宛先IPアドレス
   */
  destinationIp: IpAddressString;
}

/**
 * IPv4パケット
 */
export interface IpPacket {
  /** IPヘッダ */
  header: IpHeader;

  /** ペイロード（ICMP, TCP, UDP等） */
  payload: L3Payload;
}

// ========================================
// デフォルト値
// ========================================

/** デフォルトTTL値 */
export const DEFAULT_TTL = 64;

// ========================================
// パケット生成ヘルパー
// ========================================

/**
 * IPパケットを生成
 *
 * @param sourceIp 送信元IPアドレス
 * @param destinationIp 宛先IPアドレス
 * @param protocol プロトコル番号
 * @param payload ペイロード
 * @param ttl TTL（デフォルト: 64）
 * @returns IPパケット
 *
 * @example
 * const packet = createIpPacket(
 *   '192.168.1.1',
 *   '192.168.1.2',
 *   IpProtocol.ICMP,
 *   icmpPayload
 * );
 */
export function createIpPacket(
  sourceIp: IpAddressString,
  destinationIp: IpAddressString,
  protocol: IpProtocol,
  payload: L3Payload,
  ttl: number = DEFAULT_TTL
): IpPacket {
  return {
    header: {
      version: 4,
      ttl,
      protocol,
      sourceIp,
      destinationIp,
    },
    payload,
  };
}

/**
 * IPパケットかどうか判定（型ガード）
 *
 * L2Payloadから受け取ったデータがIPパケットかどうかを判定する。
 */
export function isIpPacket(data: unknown): data is IpPacket {
  if (typeof data !== 'object' || data === null) return false;

  const packet = data as IpPacket;
  return (
    typeof packet.header === 'object' &&
    packet.header !== null &&
    packet.header.version === 4 &&
    typeof packet.header.ttl === 'number' &&
    typeof packet.header.protocol === 'number' &&
    typeof packet.header.sourceIp === 'string' &&
    typeof packet.header.destinationIp === 'string'
  );
}

/**
 * IPパケットの概要を文字列で返す
 */
export function formatIpPacket(packet: IpPacket): string {
  const { header } = packet;
  return `IPv4 [${header.sourceIp} → ${header.destinationIp}] TTL=${header.ttl} Proto=${ipProtocolToString(header.protocol)}`;
}

/**
 * TTLを減少させた新しいパケットを返す
 *
 * ルーター転送時に使用。元のパケットは変更しない（イミュータブル）。
 *
 * @param packet 元のパケット
 * @returns TTLを1減少させた新しいパケット
 */
export function decrementTtl(packet: IpPacket): IpPacket {
  return {
    header: {
      ...packet.header,
      ttl: packet.header.ttl - 1,
    },
    payload: packet.payload,
  };
}
