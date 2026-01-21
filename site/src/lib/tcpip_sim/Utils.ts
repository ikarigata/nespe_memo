/**
 * TCP/IP シミュレータ用ユーティリティ関数
 */

// ========================================
// 遅延シミュレーション
// ========================================

/**
 * ケーブルの遅延を表現するユーティリティ
 * これを挟むことで、UI上でパケットが移動するアニメーションの時間を稼ぐ
 *
 * @param ms 遅延時間（ミリ秒）
 * @returns Promise<void>
 */
export function simulateCableDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ========================================
// MACアドレス生成
// ========================================

/**
 * ランダムなMACアドレスを生成
 *
 * @returns MACアドレス文字列 (例: "AA:BB:CC:DD:EE:FF")
 */
export function generateMacAddress(): string {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  ).join(':');
}

// ========================================
// IPアドレスユーティリティ
// ========================================

/**
 * IPアドレスの形式を検証
 *
 * @param ip 検証するIPアドレス文字列
 * @returns 有効なIPv4アドレスかどうか
 */
export function isValidIpAddress(ip: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;

  const octets = ip.split('.').map(Number);
  return octets.every((octet) => octet >= 0 && octet <= 255);
}

/**
 * IPアドレスを数値に変換
 *
 * @param ip IPアドレス文字列
 * @returns 32bit整数
 */
export function ipToNumber(ip: string): number {
  const octets = ip.split('.').map(Number);
  return (octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3];
}

/**
 * 数値をIPアドレスに変換
 *
 * @param num 32bit整数
 * @returns IPアドレス文字列
 */
export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

/**
 * 同一ネットワークかどうかを判定
 *
 * @param ip1 IPアドレス1
 * @param ip2 IPアドレス2
 * @param subnetMask サブネットマスク
 * @returns 同一ネットワークかどうか
 */
export function isSameNetwork(
  ip1: string,
  ip2: string,
  subnetMask: string
): boolean {
  const ip1Num = ipToNumber(ip1);
  const ip2Num = ipToNumber(ip2);
  const maskNum = ipToNumber(subnetMask);

  return (ip1Num & maskNum) === (ip2Num & maskNum);
}