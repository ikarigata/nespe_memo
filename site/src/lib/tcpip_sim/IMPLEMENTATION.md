# TCP/IP シミュレータ 実装ドキュメント

このドキュメントでは、TCP/IPシミュレータの実装済み機能と使用方法を記述します。
設計方針については `doc.md`、今後の改善点については `TODO.md` を参照してください。

---

## 目次

1. [ディレクトリ構造](#ディレクトリ構造)
2. [実装済みレイヤー](#実装済みレイヤー)
3. [Layer 1: 物理層](#layer-1-物理層)
4. [Layer 2: データリンク層](#layer-2-データリンク層)
5. [ARP (Address Resolution Protocol)](#arp-address-resolution-protocol)
6. [使用例](#使用例)
7. [更新履歴](#更新履歴)

---

## ディレクトリ構造

```
site/src/lib/tcpip_sim/
├── index.ts               # バレルファイル（一括エクスポート）
├── doc.md                 # 設計ドキュメント
├── TODO.md                # 改善点・今後のTODO
├── IMPLEMENTATION.md      # 実装ドキュメント（本ファイル）
├── Utils.ts               # ユーティリティ関数
├── layer1/                # 物理層
│   ├── index.ts           # L1バレルファイル
│   ├── Signal.ts          # 物理信号
│   ├── Port.ts            # 物理ポート
│   ├── LanCable.ts        # LANケーブル
│   └── RepeaterHub.ts     # リピータハブ
└── layer2/                # データリンク層
    ├── index.ts           # L2バレルファイル
    ├── EthernetFrame.ts   # Ethernetフレーム定義
    ├── NetworkInterface.ts # NIC (ネットワークインターフェース)
    ├── L2Switch.ts        # L2スイッチ
    ├── ArpPacket.ts       # ARPパケット定義
    ├── ArpTable.ts        # ARPテーブル
    └── ArpHandler.ts      # ARPハンドラ
```

---

## 実装済みレイヤー

| レイヤー | 完成度 | 主要コンポーネント |
|----------|--------|-------------------|
| L1 (物理層) | 80% | Signal, Port, LanCable, RepeaterHub |
| L2 (データリンク層) | 80% | EthernetFrame, NetworkInterface, L2Switch, ARP |
| L3 (ネットワーク層) | 0% | 未実装 |
| L4 (トランスポート層) | 0% | 未実装 |

---

## Layer 1: 物理層

### Signal<T> (`layer1/Signal.ts`)

物理信号を表すジェネリックコンテナ。L1は信号の中身を知らない（型パラメータで抽象化）。

```typescript
const signal = new Signal<EthernetFrame>(frame);
console.log(signal.payload);      // フレームデータ
console.log(signal.isCorrupted);  // 破損フラグ（将来用）
```

### Port (`layer1/Port.ts`)

物理ポート。ケーブル接続と信号の送受信を担当。

```typescript
const port = new Port('eth0');

// 受信コールバックを設定
port.onReceive = (signal) => console.log('Received:', signal);

// ケーブル接続
port.connect(cable);

// 信号送信
await port.send(signal);
```

### LanCable (`layer1/LanCable.ts`)

2つのポート間を接続するケーブル。伝送遅延をシミュレート。

```typescript
const cable = new LanCable(portA, portB, 100); // 100ms遅延
```

### RepeaterHub (`layer1/RepeaterHub.ts`)

L1リピータハブ。受信した信号を他の全ポートにフラッディング。

```typescript
const hub = new RepeaterHub('hub1', 4); // 4ポートのハブ
```

---

## Layer 2: データリンク層

### EthernetFrame (`layer2/EthernetFrame.ts`)

Ethernetフレームの型定義と関連定数。

```typescript
interface EthernetFrame {
  destinationMac: MacAddress;  // 宛先MAC
  sourceMac: MacAddress;       // 送信元MAC
  type: EtherType;            // 0x0800=IPv4, 0x0806=ARP
  payload: L2Payload;         // ペイロード
}

// 定数
ETHER_TYPE_IPV4  // 0x0800
ETHER_TYPE_ARP   // 0x0806
MAC_BROADCAST    // 'FF:FF:FF:FF:FF:FF'
```

### NetworkInterface (`layer2/NetworkInterface.ts`)

NIC（ネットワークインターフェースカード）。L2処理の中核。

```typescript
// NIC作成
const nic = new NetworkInterface('AA:BB:CC:DD:EE:FF', 'eth0');

// IPアドレス設定（ARP機能有効化）
nic.setIpAddress('192.168.1.1');

// 上位層（L3）を接続
nic.upperLayer = myNetworkLayer;

// フレーム送信
await nic.sendFrame(destMac, ETHER_TYPE_IPV4, payload);

// IP指定で送信（ARP自動解決）
await nic.sendToIp('192.168.1.10', ETHER_TYPE_IPV4, payload);

// MACアドレス解決
const mac = await nic.resolveIpToMac('192.168.1.10');
```

### L2Switch (`layer2/L2Switch.ts`)

L2スイッチ。MACアドレス学習とフォワーディング。

```typescript
const sw = new L2Switch('switch1', 8); // 8ポートスイッチ

// MACテーブル参照
console.log(sw.macTable);
```

---

## ARP (Address Resolution Protocol)

### 概要

ARPはIPアドレスからMACアドレスを解決するプロトコル。
EtherType=0x0806 でEthernetフレームに格納される。

### ArpPacket (`layer2/ArpPacket.ts`)

ARPパケットの型定義とファクトリ関数。

```typescript
// ARP Request作成
const request = createArpRequest(
  'AA:BB:CC:DD:EE:FF',  // 送信者MAC
  '192.168.1.1',        // 送信者IP
  '192.168.1.10'        // 解決したいIP
);

// ARP Reply作成
const reply = createArpReply(
  'AA:BB:CC:DD:EE:FF', '192.168.1.10',  // 応答者
  '11:22:33:44:55:66', '192.168.1.1'    // リクエスト元
);
```

### ArpTable (`layer2/ArpTable.ts`)

ARPテーブル管理。エージング（タイムアウト）対応。

```typescript
const arpTable = new ArpTable({
  timeout: 300000,          // 5分
  incompleteTimeout: 3000,  // 3秒
  maxEntries: 512
});

// エントリ追加/更新
arpTable.update('192.168.1.10', 'AA:BB:CC:DD:EE:FF');

// 検索
const mac = arpTable.lookup('192.168.1.10');

// INCOMPLETEエントリ作成（Request送信後）
arpTable.setIncomplete('192.168.1.10');

// 期限切れエントリ削除
arpTable.purgeExpired();

// テーブル表示
console.log(arpTable.toString());
```

**ARPエントリの状態:**

| 状態 | 説明 |
|------|------|
| INCOMPLETE | ARP Request送信済み、Reply待ち |
| REACHABLE | MACアドレス解決済み、通信可能 |
| STALE | 期限切れ（将来用） |

### ArpHandler (`layer2/ArpHandler.ts`)

ARP Request/Replyの送受信を管理。

```typescript
const arpHandler = new ArpHandler(nic, '192.168.1.1', {
  requestTimeout: 3000,  // タイムアウト
  maxRetries: 3,         // リトライ回数
  retryInterval: 1000    // リトライ間隔
});

// MACアドレス解決（自動でRequest送信）
const mac = await arpHandler.resolve('192.168.1.10');

// 手動でRequest送信
arpHandler.sendArpRequest('192.168.1.10');

// ARPテーブル参照
console.log(arpHandler.arpTable.toString());
```

### ARP動作フロー

```
┌─────────────────────────────────────────────────────────────┐
│  Host A (192.168.1.1) → Host B (192.168.1.10) へ通信したい   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. ARPテーブルを確認 → エントリなし                         │
│  2. ARPテーブルに INCOMPLETE エントリ作成                    │
│  3. ARP Request をブロードキャスト送信                       │
│     ┌───────────────────────────────────────────┐           │
│     │ Dst MAC: FF:FF:FF:FF:FF:FF (Broadcast)    │           │
│     │ Src MAC: AA:BB:CC:DD:EE:FF               │           │
│     │ EtherType: 0x0806 (ARP)                  │           │
│     │ Operation: REQUEST                        │           │
│     │ Sender: 192.168.1.1 / AA:BB:CC:DD:EE:FF  │           │
│     │ Target: 192.168.1.10 / 00:00:00:00:00:00 │           │
│     └───────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Host B が ARP Request を受信                               │
│  1. 送信元情報をARPテーブルに学習                            │
│  2. Target IP が自分 → ARP Reply を返信                      │
│     ┌───────────────────────────────────────────┐           │
│     │ Dst MAC: AA:BB:CC:DD:EE:FF (Unicast)     │           │
│     │ Src MAC: 11:22:33:44:55:66               │           │
│     │ EtherType: 0x0806 (ARP)                  │           │
│     │ Operation: REPLY                          │           │
│     │ Sender: 192.168.1.10 / 11:22:33:44:55:66 │           │
│     │ Target: 192.168.1.1 / AA:BB:CC:DD:EE:FF  │           │
│     └───────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Host A が ARP Reply を受信                                 │
│  1. ARPテーブルを REACHABLE に更新                          │
│  2. 待機中の Promise を解決（MACアドレス返却）               │
│  3. 以降の通信は解決済みMACアドレスを使用                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 使用例

### 基本的なNIC間通信

```typescript
// バレルファイルから一括インポート
import { NetworkInterface, LanCable, ETHER_TYPE_IPV4 } from './lib/tcpip_sim';

// 2つのNICを作成
const nicA = new NetworkInterface('AA:AA:AA:AA:AA:AA', 'eth0');
const nicB = new NetworkInterface('BB:BB:BB:BB:BB:BB', 'eth0');

// IPアドレス設定
nicA.setIpAddress('192.168.1.1');
nicB.setIpAddress('192.168.1.10');

// ケーブルで接続
const cable = new LanCable(nicA.port, nicB.port, 100);

// NIC B の上位層を設定（受信処理）
nicB.upperLayer = {
  receive(payload, type, sourceMac) {
    console.log(`Received from ${sourceMac}: ${payload}`);
  }
};

// NIC A から NIC B へパケット送信（ARP自動解決）
await nicA.sendToIp('192.168.1.10', ETHER_TYPE_IPV4, 'Hello!');
```

### L2スイッチ経由の通信

```typescript
import { NetworkInterface, L2Switch, LanCable, ETHER_TYPE_IPV4 } from './lib/tcpip_sim';

// スイッチと3台のホスト
const sw = new L2Switch('switch1', 4);
const hostA = new NetworkInterface('AA:AA:AA:AA:AA:AA', 'eth0');
const hostB = new NetworkInterface('BB:BB:BB:BB:BB:BB', 'eth0');
const hostC = new NetworkInterface('CC:CC:CC:CC:CC:CC', 'eth0');

// スイッチに接続
new LanCable(hostA.port, sw.ports[0], 10);
new LanCable(hostB.port, sw.ports[1], 10);
new LanCable(hostC.port, sw.ports[2], 10);

// IPアドレス設定
hostA.setIpAddress('192.168.1.1');
hostB.setIpAddress('192.168.1.2');
hostC.setIpAddress('192.168.1.3');

// 通信（スイッチがMACアドレスを学習してフォワーディング）
await hostA.sendToIp('192.168.1.2', ETHER_TYPE_IPV4, 'Hello B!');
```

---

## ユーティリティ関数 (`Utils.ts`)

```typescript
import {
  simulateCableDelay,
  generateMacAddress,
  isValidIpAddress,
  ipToNumber,
  numberToIp,
  isSameNetwork
} from './lib/tcpip_sim';

// 遅延シミュレーション
await simulateCableDelay(100); // 100ms待機

// ランダムMACアドレス生成
const mac = generateMacAddress(); // 'A1:B2:C3:D4:E5:F6'

// IPアドレス検証
isValidIpAddress('192.168.1.1');   // true
isValidIpAddress('999.999.999.999'); // false

// IP⇔数値変換
ipToNumber('192.168.1.1');  // 3232235777
numberToIp(3232235777);     // '192.168.1.1'

// 同一ネットワーク判定
isSameNetwork('192.168.1.1', '192.168.1.100', '255.255.255.0'); // true
```

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-01-21 | **コード品質改善**: バレルファイル（index.ts）追加でインポートを簡素化 |
| 2026-01-21 | **型安全性の向上**: `Signal<any>` → `Signal<unknown>` に変更（Port, RepeaterHub, L2Switch） |
| 2026-01-21 | **型安全性の向上**: ArpHandler.handleArpPacketをisArpPacket型ガードで検証 |
| 2026-01-21 | **型安全性の向上**: ARPでJSON.stringify/parseを廃止、ArpPacketオブジェクトを直接送受信 |
| 2026-01-21 | **コード品質改善**: 定数の重複定義を解消（ArpPacket.ts → EthernetFrame.tsから再エクスポート） |
| 2026-01-21 | **コード品質改善**: ファイル名タイポ修正（ReperterHub.ts → RepeaterHub.ts） |
| 2026-01-21 | **コード品質改善**: LanCable.tsの重複delay関数を削除、Utils.tsの関数を使用 |
| 2026-01-21 | **型安全性の向上**: L2PayloadをUnion型に変更（`ArpPacket \| string`） |
| 2026-01-21 | **型安全性の向上**: LanCable.transmitの型を`any`→`Signal<unknown>`に修正 |
| 2026-01-21 | **型安全性の向上**: ArpHandler.handleArpPacketをUnion型対応 |
| 2026-01-21 | **コード品質改善**: L2SwitchのハードコードMAC_BROADCASTを定数に統一 |
| 2026-01-21 | **パフォーマンス改善**: LanCableのlatencyデフォルト値を1000ms→1msに変更 |
| 2026-01-21 | **ドキュメント**: LanCableクラスにJSDocコメント追加 |
| 2026-01-20 | ARP実装（ArpPacket, ArpTable, ArpHandler） |
| 2026-01-20 | NetworkInterfaceにARP機能統合 |
| 2026-01-20 | EthernetFrame.tsにEtherType定数追加 |
| 2026-01-20 | Utils.ts実装（遅延、MACアドレス生成、IP操作） |
| 2026-01-20 | 初版作成（L1, L2実装状況の文書化） |
