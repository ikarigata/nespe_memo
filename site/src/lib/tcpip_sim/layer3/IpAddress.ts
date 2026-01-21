/**
 * IpAddress - IPv4アドレスとサブネット計算
 *
 * Utils.tsのIP関連関数を活用しつつ、L3特有の機能を提供。
 */

import {
  isValidIpAddress,
  ipToNumber,
  numberToIp,
  isSameNetwork,
} from '../Utils';

// ========================================
// 型定義
// ========================================

/**
 * IPv4アドレス（文字列形式）
 * 例: "192.168.1.1"
 */
export type IpAddressString = string;

/**
 * サブネットマスク（文字列形式）
 * 例: "255.255.255.0"
 */
export type SubnetMaskString = string;

/**
 * CIDR表記
 * 例: "192.168.1.0/24"
 */
export type CidrNotation = string;

/**
 * サブネット情報
 */
export interface SubnetInfo {
  /** ネットワークアドレス */
  networkAddress: IpAddressString;
  /** ブロードキャストアドレス */
  broadcastAddress: IpAddressString;
  /** サブネットマスク */
  subnetMask: SubnetMaskString;
  /** プレフィックス長 (0-32) */
  prefixLength: number;
  /** 使用可能なホスト数 */
  hostCount: number;
}

// ========================================
// 定数
// ========================================

/** デフォルトのサブネットマスク（クラスC） */
export const DEFAULT_SUBNET_MASK = '255.255.255.0';

/** ブロードキャストアドレス（限定ブロードキャスト） */
export const IP_BROADCAST = '255.255.255.255';

/** ループバックアドレス */
export const IP_LOOPBACK = '127.0.0.1';

// ========================================
// 関数（Utils.tsから再エクスポート）
// ========================================

export { isValidIpAddress, ipToNumber, numberToIp, isSameNetwork };

// ========================================
// サブネット計算関数
// ========================================

/**
 * プレフィックス長からサブネットマスクを計算
 *
 * @param prefixLength プレフィックス長 (0-32)
 * @returns サブネットマスク文字列
 *
 * @example
 * prefixToSubnetMask(24) // "255.255.255.0"
 * prefixToSubnetMask(16) // "255.255.0.0"
 */
export function prefixToSubnetMask(prefixLength: number): SubnetMaskString {
  if (prefixLength < 0 || prefixLength > 32) {
    throw new Error(`Invalid prefix length: ${prefixLength}`);
  }

  // プレフィックス長分の1を左詰めで作成
  // 例: /24 → 11111111.11111111.11111111.00000000
  const mask = prefixLength === 0 ? 0 : (~0 << (32 - prefixLength)) >>> 0;
  return numberToIp(mask);
}

/**
 * サブネットマスクからプレフィックス長を計算
 *
 * @param subnetMask サブネットマスク
 * @returns プレフィックス長 (0-32)
 *
 * @example
 * subnetMaskToPrefix("255.255.255.0") // 24
 * subnetMaskToPrefix("255.255.0.0")   // 16
 */
export function subnetMaskToPrefix(subnetMask: SubnetMaskString): number {
  const maskNum = ipToNumber(subnetMask) >>> 0;

  // 1のビット数を数える
  let count = 0;
  let m = maskNum;
  while (m !== 0) {
    count += m & 1;
    m >>>= 1;
  }
  return count;
}

/**
 * ネットワークアドレスを計算
 *
 * @param ip IPアドレス
 * @param subnetMask サブネットマスク
 * @returns ネットワークアドレス
 *
 * @example
 * getNetworkAddress("192.168.1.100", "255.255.255.0") // "192.168.1.0"
 */
export function getNetworkAddress(
  ip: IpAddressString,
  subnetMask: SubnetMaskString
): IpAddressString {
  const ipNum = ipToNumber(ip);
  const maskNum = ipToNumber(subnetMask);
  return numberToIp((ipNum & maskNum) >>> 0);
}

/**
 * ブロードキャストアドレスを計算
 *
 * @param ip IPアドレス
 * @param subnetMask サブネットマスク
 * @returns ブロードキャストアドレス
 *
 * @example
 * getBroadcastAddress("192.168.1.100", "255.255.255.0") // "192.168.1.255"
 */
export function getBroadcastAddress(
  ip: IpAddressString,
  subnetMask: SubnetMaskString
): IpAddressString {
  const ipNum = ipToNumber(ip);
  const maskNum = ipToNumber(subnetMask);
  // ネットワーク部 | ホスト部を全て1
  const broadcast = (ipNum & maskNum) | (~maskNum >>> 0);
  return numberToIp(broadcast >>> 0);
}

/**
 * サブネット情報を取得
 *
 * @param ip IPアドレス
 * @param subnetMask サブネットマスク
 * @returns サブネット情報
 */
export function getSubnetInfo(
  ip: IpAddressString,
  subnetMask: SubnetMaskString
): SubnetInfo {
  const prefixLength = subnetMaskToPrefix(subnetMask);
  const hostBits = 32 - prefixLength;
  // ホスト数 = 2^hostBits - 2（ネットワークアドレスとブロードキャストを除く）
  const hostCount = hostBits >= 2 ? Math.pow(2, hostBits) - 2 : 0;

  return {
    networkAddress: getNetworkAddress(ip, subnetMask),
    broadcastAddress: getBroadcastAddress(ip, subnetMask),
    subnetMask,
    prefixLength,
    hostCount,
  };
}

/**
 * CIDR表記をパース
 *
 * @param cidr CIDR表記 (例: "192.168.1.0/24")
 * @returns [IPアドレス, プレフィックス長]
 */
export function parseCidr(cidr: CidrNotation): [IpAddressString, number] {
  const [ip, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);

  if (!isValidIpAddress(ip) || isNaN(prefix) || prefix < 0 || prefix > 32) {
    throw new Error(`Invalid CIDR notation: ${cidr}`);
  }

  return [ip, prefix];
}

/**
 * CIDR表記からサブネット情報を取得
 *
 * @param cidr CIDR表記
 * @returns サブネット情報
 */
export function getSubnetInfoFromCidr(cidr: CidrNotation): SubnetInfo {
  const [ip, prefix] = parseCidr(cidr);
  const subnetMask = prefixToSubnetMask(prefix);
  return getSubnetInfo(ip, subnetMask);
}

/**
 * IPアドレスがサブネット内に含まれるか判定
 *
 * @param ip 判定するIPアドレス
 * @param networkAddress ネットワークアドレス
 * @param subnetMask サブネットマスク
 * @returns サブネット内に含まれるか
 */
export function isInSubnet(
  ip: IpAddressString,
  networkAddress: IpAddressString,
  subnetMask: SubnetMaskString
): boolean {
  return getNetworkAddress(ip, subnetMask) === networkAddress;
}
