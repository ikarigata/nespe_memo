/**
 * RoutingTable - ルーティングテーブル
 *
 * IPパケットの転送先を決定するためのルーティングテーブル。
 * 最長プレフィックス一致（Longest Prefix Match）アルゴリズムを使用。
 *
 * ## 実際のルーティングテーブル例（参考）
 * ```
 * Destination     Gateway         Genmask         Flags   Iface
 * 0.0.0.0         192.168.1.1     0.0.0.0         UG      eth0   ← デフォルトルート
 * 192.168.1.0     0.0.0.0         255.255.255.0   U       eth0   ← 直接接続
 * 10.0.0.0        192.168.1.254   255.0.0.0       UG      eth0   ← スタティックルート
 * ```
 */

import type { IpAddressString, SubnetMaskString } from './IpAddress';
import {
  ipToNumber,
  getNetworkAddress,
  subnetMaskToPrefix,
} from './IpAddress';

// ========================================
// 型定義
// ========================================

/**
 * ルートの種類
 */
export type RouteType =
  /** 直接接続（同一セグメント） */
  | 'connected'
  /** 静的ルート（手動設定） */
  | 'static';

/**
 * ルーティングエントリ
 */
export interface RoutingEntry {
  /**
   * 宛先ネットワークアドレス
   * 例: "192.168.1.0"
   */
  destination: IpAddressString;

  /**
   * サブネットマスク
   * 例: "255.255.255.0"
   */
  subnetMask: SubnetMaskString;

  /**
   * 次のルーター（ネクストホップ）
   * 直接接続の場合はnull
   */
  nextHop: IpAddressString | null;

  /**
   * 出力インターフェースID
   * 例: "eth0"
   */
  interfaceId: string;

  /**
   * メトリック（コスト）
   * 低いほど優先される
   */
  metric: number;

  /**
   * ルートの種類
   */
  type: RouteType;
}

/**
 * ルート検索結果
 */
export interface RouteResult {
  /** マッチしたルーティングエントリ */
  entry: RoutingEntry;

  /**
   * 実際の転送先IPアドレス
   * - nextHopがあればnextHop
   * - 直接接続なら宛先IP（引数のdestinationIp）
   */
  forwardTo: IpAddressString;
}

// ========================================
// 定数
// ========================================

/** デフォルトルートの宛先 */
export const DEFAULT_ROUTE_DESTINATION = '0.0.0.0';

/** デフォルトルートのマスク */
export const DEFAULT_ROUTE_MASK = '0.0.0.0';

// ========================================
// RoutingTable クラス
// ========================================

/**
 * ルーティングテーブル
 *
 * @example
 * const rt = new RoutingTable();
 *
 * // 直接接続ルートを追加
 * rt.addConnectedRoute('192.168.1.0', '255.255.255.0', 'eth0');
 *
 * // スタティックルートを追加
 * rt.addStaticRoute('10.0.0.0', '255.0.0.0', '192.168.1.254', 'eth0');
 *
 * // デフォルトゲートウェイを設定
 * rt.setDefaultGateway('192.168.1.1', 'eth0');
 *
 * // ルート検索
 * const result = rt.lookup('10.0.1.100');
 * // → { entry: {...}, forwardTo: '192.168.1.254' }
 */
export class RoutingTable {
  /** ルーティングエントリのリスト */
  private entries: RoutingEntry[] = [];

  // ========================================
  // ルート追加
  // ========================================

  /**
   * ルーティングエントリを追加
   *
   * @param entry ルーティングエントリ
   */
  addRoute(entry: RoutingEntry): void {
    // 重複チェック（同じdestination/maskのエントリは上書き）
    const existingIndex = this.entries.findIndex(
      (e) =>
        e.destination === entry.destination && e.subnetMask === entry.subnetMask
    );

    if (existingIndex >= 0) {
      this.entries[existingIndex] = entry;
    } else {
      this.entries.push(entry);
    }

    console.log(
      `[RoutingTable] ルート追加: ${entry.destination}/${subnetMaskToPrefix(entry.subnetMask)} → ${entry.nextHop ?? 'directly connected'} (${entry.interfaceId})`
    );
  }

  /**
   * 直接接続ルートを追加
   *
   * インターフェースにIPアドレスを設定した際に自動的に追加されるルート。
   *
   * @param network ネットワークアドレス
   * @param subnetMask サブネットマスク
   * @param interfaceId インターフェースID
   */
  addConnectedRoute(
    network: IpAddressString,
    subnetMask: SubnetMaskString,
    interfaceId: string
  ): void {
    this.addRoute({
      destination: getNetworkAddress(network, subnetMask),
      subnetMask,
      nextHop: null,
      interfaceId,
      metric: 0, // 直接接続は最高優先度
      type: 'connected',
    });
  }

  /**
   * スタティックルートを追加
   *
   * @param destination 宛先ネットワーク
   * @param subnetMask サブネットマスク
   * @param nextHop ネクストホップ
   * @param interfaceId 出力インターフェースID
   * @param metric メトリック（デフォルト: 1）
   */
  addStaticRoute(
    destination: IpAddressString,
    subnetMask: SubnetMaskString,
    nextHop: IpAddressString,
    interfaceId: string,
    metric: number = 1
  ): void {
    this.addRoute({
      destination: getNetworkAddress(destination, subnetMask),
      subnetMask,
      nextHop,
      interfaceId,
      metric,
      type: 'static',
    });
  }

  /**
   * デフォルトゲートウェイを設定
   *
   * @param gateway デフォルトゲートウェイのIPアドレス
   * @param interfaceId 出力インターフェースID
   */
  setDefaultGateway(gateway: IpAddressString, interfaceId: string): void {
    this.addStaticRoute(
      DEFAULT_ROUTE_DESTINATION,
      DEFAULT_ROUTE_MASK,
      gateway,
      interfaceId,
      // デフォルトルートは最低優先度
      1000
    );
    console.log(`[RoutingTable] デフォルトゲートウェイ設定: ${gateway}`);
  }

  // ========================================
  // ルート削除
  // ========================================

  /**
   * ルートを削除
   *
   * @param destination 宛先ネットワーク
   * @param subnetMask サブネットマスク
   * @returns 削除に成功したか
   */
  removeRoute(
    destination: IpAddressString,
    subnetMask: SubnetMaskString
  ): boolean {
    const index = this.entries.findIndex(
      (e) => e.destination === destination && e.subnetMask === subnetMask
    );

    if (index >= 0) {
      this.entries.splice(index, 1);
      console.log(
        `[RoutingTable] ルート削除: ${destination}/${subnetMaskToPrefix(subnetMask)}`
      );
      return true;
    }
    return false;
  }

  /**
   * 全ルートをクリア
   */
  clear(): void {
    this.entries = [];
  }

  // ========================================
  // ルート検索
  // ========================================

  /**
   * 宛先IPアドレスに対するルートを検索（Longest Prefix Match）
   *
   * 最長一致するルートを返す。
   * 複数のルートが同じプレフィックス長でマッチする場合はメトリックが低いものを優先。
   *
   * @param destinationIp 宛先IPアドレス
   * @returns ルート検索結果、見つからなければnull
   */
  lookup(destinationIp: IpAddressString): RouteResult | null {
    const destNum = ipToNumber(destinationIp);
    let bestMatch: RoutingEntry | null = null;
    let bestPrefixLength = -1;

    for (const entry of this.entries) {
      const maskNum = ipToNumber(entry.subnetMask);
      const networkNum = ipToNumber(entry.destination);
      const prefixLength = subnetMaskToPrefix(entry.subnetMask);

      // 宛先IPがこのルートにマッチするか
      if ((destNum & maskNum) === networkNum) {
        // より長いプレフィックスを優先（Longest Prefix Match）
        if (prefixLength > bestPrefixLength) {
          bestMatch = entry;
          bestPrefixLength = prefixLength;
        } else if (prefixLength === bestPrefixLength) {
          // 同じプレフィックス長ならメトリックで比較
          if (bestMatch && entry.metric < bestMatch.metric) {
            bestMatch = entry;
          }
        }
      }
    }

    if (!bestMatch) {
      return null;
    }

    // 転送先を決定
    const forwardTo = bestMatch.nextHop ?? destinationIp;

    return {
      entry: bestMatch,
      forwardTo,
    };
  }

  /**
   * 宛先が直接接続されているか判定
   *
   * @param destinationIp 宛先IPアドレス
   * @returns 直接接続されているか
   */
  isDirectlyConnected(destinationIp: IpAddressString): boolean {
    const result = this.lookup(destinationIp);
    return result !== null && result.entry.type === 'connected';
  }

  // ========================================
  // テーブル参照
  // ========================================

  /**
   * 全ルーティングエントリを取得
   *
   * プレフィックス長の降順（長いものが先）でソートして返す。
   */
  getEntries(): RoutingEntry[] {
    return [...this.entries].sort((a, b) => {
      const prefixA = subnetMaskToPrefix(a.subnetMask);
      const prefixB = subnetMaskToPrefix(b.subnetMask);
      return prefixB - prefixA; // 降順
    });
  }

  /**
   * ルーティングテーブルを文字列で表示
   */
  toString(): string {
    const lines = ['Destination     Gateway         Mask            Iface   Metric  Type'];
    lines.push('-'.repeat(75));

    for (const entry of this.getEntries()) {
      const dest = entry.destination.padEnd(15);
      const gw = (entry.nextHop ?? '*').padEnd(15);
      const mask = entry.subnetMask.padEnd(15);
      const iface = entry.interfaceId.padEnd(7);
      const metric = entry.metric.toString().padEnd(7);
      const type = entry.type;
      lines.push(`${dest} ${gw} ${mask} ${iface} ${metric} ${type}`);
    }

    return lines.join('\n');
  }
}
