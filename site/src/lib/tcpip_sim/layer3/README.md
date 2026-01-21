# Layer 3（ネットワーク層）実装TODO

## 概要

このドキュメントはレイヤー3（ネットワーク層）に追加すべき概念・機器の一覧と実装状況を管理する。

## 現在の状況

| 項目 | 状態 |
|------|------|
| 完成度 | 0% |
| 依存関係 | Layer 2 完了（ARP実装済み） |
| 前提 | `Utils.ts` にIP関連ユーティリティあり |

---

## 実装対象一覧

### 1. 基本データ構造

| ファイル名 | 概念 | 説明 | 状態 |
|------------|------|------|------|
| `IpAddress.ts` | IpAddress | IPv4アドレスの型定義・操作 | [ ] 未実装 |
| `IpPacket.ts` | IpPacket / IpHeader | IPパケット構造（ヘッダ + ペイロード） | [ ] 未実装 |
| `Subnet.ts` | SubnetMask / CIDR | サブネット計算、ネットワーク部/ホスト部 | [ ] 未実装 |

#### IpPacket 構造（RFC 791準拠）

```typescript
interface IpHeader {
  version: 4;                    // IPv4固定
  headerLength: number;          // 通常は5（20バイト）
  ttl: number;                   // Time To Live
  protocol: IpProtocol;          // 1=ICMP, 6=TCP, 17=UDP
  sourceIp: string;              // 送信元IPアドレス
  destinationIp: string;         // 宛先IPアドレス
  // 以下は簡略化のため省略可
  // tos, totalLength, identification, flags, fragmentOffset, checksum, options
}

interface IpPacket {
  header: IpHeader;
  payload: L3Payload;            // ICMP, TCP, UDP等
}

// プロトコル番号
const enum IpProtocol {
  ICMP = 1,
  TCP = 6,
  UDP = 17,
}
```

---

### 2. ルーティング関連

| ファイル名 | 概念 | 説明 | 状態 |
|------------|------|------|------|
| `RoutingTable.ts` | RoutingTable | ルーティングテーブル管理 | [ ] 未実装 |
| `RoutingEntry.ts` | RoutingEntry | 個々のルートエントリ | [ ] 未実装 |
| `Router.ts` | Router | ルーター（複数NIC、パケット転送） | [ ] 未実装 |

#### RoutingEntry 構造

```typescript
interface RoutingEntry {
  destination: string;           // 宛先ネットワーク (e.g., "192.168.1.0")
  subnetMask: string;            // サブネットマスク (e.g., "255.255.255.0")
  nextHop: string | null;        // 次のルーター（直接接続の場合はnull）
  interfaceId: string;           // 出力インターフェースID
  metric: number;                // メトリック（コスト）
  type: 'connected' | 'static' | 'dynamic';
}
```

#### RoutingTable 機能

```typescript
class RoutingTable {
  // ルート追加
  addRoute(entry: RoutingEntry): void;

  // ルート削除
  removeRoute(destination: string, mask: string): boolean;

  // 最長一致検索（Longest Prefix Match）
  lookup(destinationIp: string): RoutingEntry | null;

  // デフォルトルート設定
  setDefaultGateway(nextHop: string, interfaceId: string): void;

  // テーブル表示
  getEntries(): RoutingEntry[];
}
```

---

### 3. ICMP関連

| ファイル名 | 概念 | 説明 | 状態 |
|------------|------|------|------|
| `IcmpPacket.ts` | IcmpPacket / IcmpType | ICMPメッセージ構造 | [ ] 未実装 |
| `IcmpHandler.ts` | IcmpHandler | ICMP処理ロジック | [ ] 未実装 |

#### IcmpPacket 構造（RFC 792準拠）

```typescript
const enum IcmpType {
  ECHO_REPLY = 0,                // Ping応答
  DESTINATION_UNREACHABLE = 3,   // 到達不能
  ECHO_REQUEST = 8,              // Ping要求
  TIME_EXCEEDED = 11,            // TTL超過
}

interface IcmpPacket {
  type: IcmpType;
  code: number;                  // サブタイプ
  // checksum は省略可

  // Echo Request/Reply用
  identifier?: number;
  sequenceNumber?: number;
  data?: string;
}
```

---

### 4. ホスト/ノード

| ファイル名 | 概念 | 説明 | 状態 |
|------------|------|------|------|
| `IpStack.ts` | IpStack | IP層処理（INetworkLayer実装） | [ ] 未実装 |
| `Host.ts` | Host / Node | IPスタックを持つエンドノード | [ ] 未実装 |

#### IpStack 責務

```typescript
class IpStack implements INetworkLayer {
  // L2からのフレーム受信時に呼ばれる
  onReceivePacket(packet: IpPacket): void;

  // 上位層からのパケット送信
  sendPacket(destinationIp: string, protocol: IpProtocol, payload: L3Payload): void;

  // 自分宛かどうか判定
  isLocalAddress(ip: string): boolean;

  // 転送すべきか判定（ルーターの場合）
  shouldForward(packet: IpPacket): boolean;
}
```

---

### 5. 発展的な概念（後回し）

| ファイル名 | 概念 | 説明 | 優先度 |
|------------|------|------|--------|
| `Nat.ts` | NAT | ネットワークアドレス変換 | 低 |
| `Dhcp.ts` | DHCP | 動的IP割当 | 低 |
| `Ipv6Packet.ts` | IPv6 | IPv6サポート | 低 |
| `IpFragment.ts` | フラグメント | MTUによる分割・再構築 | 低 |

---

## 推奨実装順序

```
1. IpAddress / Subnet          ← 基本型定義
2. IpPacket / IpHeader         ← パケット構造
3. RoutingTable / RoutingEntry ← ルーティング基盤
4. IpStack                     ← L2との接続（INetworkLayer実装）
5. Host                        ← エンドポイント
6. Router                      ← パケット転送
7. IcmpPacket / IcmpHandler    ← Pingで動作確認
```

---

## 既存コードとの接続点

### L2との接続

```typescript
// NetworkInterface.ts で定義済み
interface INetworkLayer {
  onReceivePacket(payload: L2Payload, frame: EthernetFrame): void;
}
```

- `IpStack` は `INetworkLayer` を実装する
- `NetworkInterface.setNetworkLayer(ipStack)` で接続

### Utils.ts（既存）

以下の関数は実装済み：

- `isValidIpAddress(ip)` - IPアドレス検証
- `ipToNumber(ip)` - IP→32bit整数
- `numberToIp(num)` - 32bit整数→IP
- `isSameNetwork(ip1, ip2, mask)` - 同一ネットワーク判定

### EtherType（既存）

```typescript
// EthernetFrame.ts で定義済み
export const ETHER_TYPE_IPV4 = 0x0800;
export const ETHER_TYPE_IPV6 = 0x86DD;
```

---

## 参考資料

- RFC 791 - Internet Protocol (IPv4)
- RFC 792 - Internet Control Message Protocol (ICMP)
- RFC 1812 - Requirements for IP Version 4 Routers
