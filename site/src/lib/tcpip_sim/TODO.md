# TCP/IP シミュレータ 改善点・TODOリスト

## 現状の実装状況サマリー

| レイヤー | 完成度 | 状態 |
|---------|--------|------|
| L1 (物理層) | 80% | Signal, Port, LanCable, RepeaterHub 実装済み |
| L2 (データリンク層) | 70% | EthernetFrame, NetworkInterface, L2Switch 実装済み |
| L3 (ネットワーク層) | 0% | 未実装（設計ドキュメントのみ） |
| L4 (トランスポート層) | 0% | 未実装（設計ドキュメントのみ） |

---

## 改善点

### 1. 型定義の改善

**現状の問題:**
```typescript
// EthernetFrame.ts
type L2Payload = string;  // 文字列のみ
```

**改善案:**
```typescript
type L2Payload = IPv4Packet | ARPPacket | ICMPPacket | string;
```

L2ペイロードが文字列のみの定義になっているため、L3パケットを適切に格納できない。L3実装時に型安全性を確保するため、Union型への変更が必要。

---

### 2. エラーハンドリングの強化

**現状の問題:**
- `Signal.isCorrupted` フラグが定義されているが未活用
- フレームロス・遅延変動のシミュレーションがない

**改善案:**
- `isCorrupted` フラグのチェックロジックを追加
- パケットロス率を設定可能にする
- ランダム遅延（ジッター）の実装

```typescript
// LanCable.ts に追加
interface CableConfig {
  latency: number;
  jitter: number;        // 遅延のブレ幅
  packetLossRate: number; // パケットロス率 (0.0-1.0)
  corruptionRate: number; // 破損率
}
```

---

### 3. ポート状態管理の追加

**現状の問題:**
- `Port` クラスにリンク状態（up/down）の概念がない
- link-down 状態をシミュレートできない

**改善案:**
```typescript
// Port.ts
class Port {
  id: string;
  link: LanCable | null;
  isUp: boolean;  // 追加
  // ...

  setLinkState(up: boolean): void;
  getLinkState(): boolean;
}
```

---

### 4. Utils.ts の実装

**現状の問題:**
```typescript
export { simulateCableDelay };  // 関数本体が未定義
```

**改善案:**
```typescript
export function simulateCableDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateMacAddress(): string {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(':');
}
```

---

### 5. マルチスレッド競合対策

**現状の問題:**
- 複数パケット同時送信時の動作が不確実
- キューイング機構がない

**改善案:**
- 送信キュー（FIFO）の実装
- 同時送信時のコリジョン検出（CSMA/CD シミュレーション）

---

### 6. MACテーブルのエージング

**現状の問題:**
- L2Switch の MAC テーブルエントリが永続的
- 実際のスイッチではエージングタイム後に削除される

**改善案:**
```typescript
interface MacTableEntry {
  port: Port;
  timestamp: number;
}

// 定期的にエージングタイム超過エントリを削除
private ageOutEntries(): void {
  const now = Date.now();
  for (const [mac, entry] of this.macTable) {
    if (now - entry.timestamp > this.agingTime) {
      this.macTable.delete(mac);
    }
  }
}
```

---

## TODO リスト

### Phase 1: L2 層の完成（優先度: 高）

- [ ] **ARP プロトコルの実装**
  - [ ] `ARPPacket` インターフェース定義
  - [ ] ARP Request/Reply のハンドリング
  - [ ] ARP テーブル（IP→MAC マッピング）管理
  - [ ] ARP キャッシュのタイムアウト処理

- [ ] **FCS（Frame Check Sequence）の実装**
  - [ ] CRC計算ロジック
  - [ ] 受信時のFCS検証

- [ ] **MACテーブルのエージング機能**

---

### Phase 2: L3 層の実装（優先度: 高）

- [ ] **IPv4 パケット構造の実装**
  ```typescript
  interface IPv4Packet {
    version: 4;
    headerLength: number;
    ttl: number;
    protocol: number;  // 1=ICMP, 6=TCP, 17=UDP
    sourceIP: string;
    destinationIP: string;
    payload: L3Payload;
  }
  ```

- [ ] **ICMP の実装**
  - [ ] Echo Request / Echo Reply（ping）
  - [ ] Destination Unreachable
  - [ ] TTL Exceeded

- [ ] **IP層処理ロジック**
  - [ ] TTL 減算と TTL=0 時のパケット破棄
  - [ ] ルーティングテーブル
  - [ ] 静的ルーティング
  - [ ] デフォルトゲートウェイ

- [ ] **Router クラスの実装**
  - [ ] 複数 NetworkInterface の管理
  - [ ] パケット転送ロジック
  - [ ] ルーティングテーブル参照

---

### Phase 3: L4 層の実装（優先度: 中）

- [ ] **UDP セグメントの実装**
  ```typescript
  interface UDPSegment {
    sourcePort: number;
    destinationPort: number;
    length: number;
    checksum: number;
    payload: Buffer;
  }
  ```

- [ ] **TCP セグメントの実装**
  ```typescript
  interface TCPSegment {
    sourcePort: number;
    destinationPort: number;
    sequenceNumber: number;
    acknowledgmentNumber: number;
    flags: TCPFlags;  // SYN, ACK, FIN, RST, etc.
    windowSize: number;
    payload: Buffer;
  }
  ```

- [ ] **TCP ステートマシン**
  - [ ] 3-way ハンドシェイク（SYN → SYN-ACK → ACK）
  - [ ] データ転送
  - [ ] 4-way ハンドシェイク（FIN）
  - [ ] 再送制御（タイムアウトベース）

---

### Phase 4: デバイスモデルの拡張（優先度: 中）

- [ ] **PC クラスの実装**
  - [ ] NetworkInterface の保持
  - [ ] IP アドレス設定
  - [ ] アプリケーション層インターフェース

- [ ] **Router クラスの実装**
  - [ ] 複数インターフェース
  - [ ] ルーティングテーブル
  - [ ] NAT（オプション）

- [ ] **L3 Switch の実装**
  - [ ] VLAN 対応
  - [ ] Inter-VLAN ルーティング

---

### Phase 5: 高度な機能（優先度: 低）

- [ ] **VLAN 対応**
  - [ ] 802.1Q タグ付きフレーム
  - [ ] トランクポート / アクセスポート

- [ ] **STP（Spanning Tree Protocol）**
  - [ ] ループ検出
  - [ ] ポートブロッキング

- [ ] **DHCP シミュレーション**
  - [ ] DHCP Discover/Offer/Request/Ack

- [ ] **DNS シミュレーション**
  - [ ] 名前解決のシミュレーション

---

### インフラ・品質向上（優先度: 中）

- [ ] **テストコードの追加**
  - [ ] 各クラスのユニットテスト
  - [ ] 統合テスト（エンドツーエンド通信）
  - [ ] パケットキャプチャ検証

- [ ] **ロギング機能**
  - [ ] パケット送受信ログ
  - [ ] デバッグ用トレース

- [ ] **可視化連携**
  - [ ] React Flow との統合
  - [ ] パケットアニメーション
  - [ ] リアルタイムパケットキャプチャ表示

---

## 推奨実装順序

```
1. ARP → 2. IPv4Packet → 3. ICMP (ping) → 4. Router
   → 5. UDP → 6. TCP基本 → 7. TCP再送制御
```

**理由:**
- ARP がないと IP→MAC 解決ができず、L3 通信が成立しない
- ICMP (ping) は最もシンプルな L3 通信でテストに最適
- UDP は TCP より単純で、L4 実装の足掛かりになる

---

## アーキテクチャ上の検討事項

### イベント駆動 vs ポーリング

現在はコールバック（イベント駆動）方式を採用。
将来的に複雑なシミュレーションを行う場合、離散イベントシミュレーション（DES）パターンへの移行も検討。

### シリアライズ

パケットキャプチャ機能やセーブ/ロード機能のため、各パケット型の JSON シリアライズ/デシリアライズを検討。

---

## 参考資料

- RFC 791 - Internet Protocol (IPv4)
- RFC 792 - Internet Control Message Protocol (ICMP)
- RFC 793 - Transmission Control Protocol (TCP)
- RFC 768 - User Datagram Protocol (UDP)
- RFC 826 - Address Resolution Protocol (ARP)
- IEEE 802.3 - Ethernet
