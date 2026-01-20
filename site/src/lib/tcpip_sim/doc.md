# Network Simulator Design Document

## 1. プロジェクト概要

**Cisco Packet Tracer** のような、ブラウザ上で動作するネットワークシミュレータを開発する。
ユーザーはGUI（React Flow）を用いてノードを配置・結線し、パケットがネットワーク上を流れる様子を視覚的かつ論理的にシミュレーションできる。

### 技術スタック方針

* **Frontend:** React + TypeScript + Vite
* **GUI Library:** React Flow (XYFlow)
* **State Management:** Zustand
* **Logic:** Pure TypeScript Classes (将来的なGo/Wasm移行を考慮し、ViewとLogicを分離)

---

## 2. データモデリング：パケットとフレーム (Encapsulation)

物理世界における「カプセル化（マトリョーシカ構造）」を忠実に再現します。上位レイヤーは下位レイヤーの `payload` として格納されます。

### 2.1. 定数・Enum定義

パケットヘッダに含まれる「中身の識別子」です。

```typescript
// L2: EtherType (イーサネットフレームの中身を識別)
export enum EtherType {
  IPv4 = 0x0800,
  ARP  = 0x0806,
}

// L3: IP Protocol (IPパケットの中身を識別)
export enum IPProtocol {
  ICMP = 1,
  TCP  = 6,
  UDP  = 17,
}

// L4: Port Number (アプリケーションの識別)
export enum PortNumber {
  HTTP = 80,
  DNS  = 53,
}

```

### 2.2. レイヤー定義

下位レイヤーから順に定義します。

#### Layer 4: トランスポート層 (TCP/UDP)

データがどのアプリケーションに届くべきかを制御します。

```typescript
type L4Payload = string | object | Uint8Array; // アプリケーションデータ (L7)

export interface TCPSegment {
  sourcePort: number;
  destinationPort: number;
  sequenceNumber: number;
  ackNumber: number;
  flags: {
    syn: boolean; ack: boolean; fin: boolean; rst: boolean;
  };
  payload: L4Payload;
}

export interface UDPSegment {
  sourcePort: number;
  destinationPort: number;
  payload: L4Payload;
}

```

#### Layer 3: ネットワーク層 (IP / ICMP)

IPアドレスによる経路制御（ルーティング）を担当します。

```typescript
// ICMP (Pingなどで使用)
export interface ICMPPacket {
  type: 'ECHO_REQUEST' | 'ECHO_REPLY' | 'DEST_UNREACHABLE';
  id: number;
  sequence: number;
  data?: string;
}

// IPv4 Packet
// L4セグメントまたはICMPをペイロードとして持つ
type L3Payload = TCPSegment | UDPSegment | ICMPPacket;

export interface IPv4Packet {
  version: 4;
  ttl: number;          // Time To Live (ルータ通過ごとに減算)
  protocol: IPProtocol; // 中身がTCPかICMPかなどを識別
  sourceIp: string;
  destinationIp: string;
  payload: L3Payload;
}

```

#### Layer 2: データリンク層 (Ethernet / ARP)

物理的なケーブル上の隣接機器間での通信を担当します。
**ARP** はIPアドレスからMACアドレスを知るための特殊なプロトコルで、イーサネットフレームに直接格納されます。

```typescript
// ARP Packet (MACアドレス解決プロトコル)
export interface ArpPacket {
  operation: 'REQUEST' | 'REPLY';
  senderMac: string;
  senderIp: string;
  targetMac: string; // REQUEST時は不明(00:00...)、REPLYで埋まる
  targetIp: string;
}

// Ethernet Frame (物理層に乗る最終形態)
type L2Payload = IPv4Packet | ArpPacket;

export interface EthernetFrame {
  destinationMac: string; // 宛先MAC (Broadcastは FF:FF:FF:FF:FF:FF)
  sourceMac: string;      // 送信元MAC
  etherType: EtherType;   // 中身がIPv4かARPかを識別
  payload: L2Payload;
}

```

---

## 3. インフラモデリング：物理層 (Physical Layer)

「線（ケーブル）」と「穴（ポート）」の関係を定義します。ここは論理的なIPアドレスなどとは無関係な、純粋な電気信号の通り道です。

```typescript
/**
 * 物理ポート (Physical Port)
 * デバイスに物理的に存在する差込口。
 */
class Port {
  id: string;
  parentDevice: Device;       // このポートが属する機器
  connectedLink: Link | null = null; // 接続されているケーブル
  isUp: boolean = true;       // リンクアップ状態か

  constructor(id: string, device: Device) {
    this.id = id;
    this.parentDevice = device;
  }

  // ケーブルを接続する
  connect(link: Link) {
    this.connectedLink = link;
  }

  // 物理的にデータを受信 (Inbound)
  receive(frame: EthernetFrame) {
    if (!this.isUp) return;
    // 親デバイスの論理処理へ渡す
    this.parentDevice.onReceive(this, frame);
  }

  // 物理的にデータを送信 (Outbound)
  send(frame: EthernetFrame) {
    if (this.connectedLink && this.isUp) {
      this.connectedLink.transmit(this, frame);
    }
  }
}

/**
 * リンク / ケーブル (Physical Link)
 * 2つのポートを繋ぐ存在。React FlowのEdgeと対応する。
 */
class Link {
  id: string;
  endpointA: Port;
  endpointB: Port;

  constructor(id: string, portA: Port, portB: Port) {
    this.id = id;
    this.endpointA = portA;
    this.endpointB = portB;
    
    // 相互参照のためにポート側にも自身を登録
    portA.connect(this);
    portB.connect(this);
  }

  // 信号の伝達
  transmit(fromPort: Port, frame: EthernetFrame) {
    // 送信元ではない方のポートへデータを渡す
    const target = fromPort === this.endpointA ? this.endpointB : this.endpointA;
    
    // ここで遅延(Latency)やパケットロスをシミュレート可能
    setTimeout(() => {
        target.receive(frame);
    }, 10); // 10ms delay example
  }
}

```

---

## 4. デバイスモデリング：論理層 (Logical Layer)

ハードウェアとしての「デバイス」と、その上で動く「論理（OS/ファームウェア）」を定義します。

### 4.1. 共通基底クラス

```typescript
abstract class Device {
  id: string;
  hostname: string;
  ports: Port[] = []; // 物理ポートのリスト

  constructor(id: string, hostname: string) {
    this.id = id;
    this.hostname = hostname;
  }

  addPort(portId: string) {
    this.ports.push(new Port(portId, this));
  }

  // デバイスごとに実装が異なる受信処理
  abstract onReceive(ingressPort: Port, frame: EthernetFrame): void;
}

```

### 4.2. リピータハブ (L1 Device)

**役割:** 受信した信号を整形・増幅し、受信ポート以外の全ポートへ送出する（バカ正直なコピー）。
MACアドレスもIPアドレスも理解しません。

```typescript
class Hub extends Device {
  onReceive(ingressPort: Port, frame: EthernetFrame) {
    // フラッディング: 入ってきたポート以外の全ポートから出す
    this.ports.forEach(port => {
      if (port !== ingressPort) {
        port.send(frame);
      }
    });
  }
}

```

### 4.3. L2スイッチ (L2 Device)

**役割:** MACアドレスを学習し、適切なポートへのみ転送する。

```typescript
class L2Switch extends Device {
  // MACアドレステーブル: [MACアドレス] -> [ポート]
  macTable: Map<string, Port> = new Map();

  onReceive(ingressPort: Port, frame: EthernetFrame) {
    // 1. 学習 (Source MAC Learning)
    // 「送信元MAC AAA は ポート1 の先にいる」と覚える
    this.macTable.set(frame.sourceMac, ingressPort);

    // 2. 転送判断 (Forwarding Decision)
    const targetPort = this.macTable.get(frame.destinationMac);

    if (frame.destinationMac === 'FF:FF:FF:FF:FF:FF') {
      // ブロードキャストは全員へ
      this.flood(ingressPort, frame);
    } else if (targetPort) {
      // 知っている宛先なら、そのポートへだけ送る (Unicast)
      targetPort.send(frame);
    } else {
      // 知らない宛先なら、全員へ聞いてみる (Unknown Unicast Flooding)
      this.flood(ingressPort, frame);
    }
  }

  private flood(ingressPort: Port, frame: EthernetFrame) {
    this.ports.forEach(p => {
      if (p !== ingressPort) p.send(frame);
    });
  }
}

```

### 4.4. エンドポイント / PC (L3 Device)

**役割:** アプリケーションを持ち、IPスタック（ARP/Routing）を処理する。
物理ポートとIPアドレスを結びつける「インターフェース」の概念が必要になります。

```typescript
/**
 * ネットワークインターフェース (NICの論理設定)
 * 物理ポートにIPアドレスなどの意味を与えるもの。
 */
class NetworkInterface {
  macAddress: string;
  ipAddress: string;
  subnetMask: string;
  gatewayIp?: string;
  bindPort: Port; // どの物理ポートを使っているか

  constructor(mac: string, ip: string, port: Port) {
    this.macAddress = mac;
    this.ipAddress = ip;
    this.bindPort = port;
  }
}

class PC extends Device {
  nic: NetworkInterface; 
  arpTable: Map<string, string> = new Map(); // IP -> MAC

  onReceive(ingressPort: Port, frame: EthernetFrame) {
    // 1. 自分宛てか確認 (L2 check)
    if (frame.destinationMac !== this.nic.macAddress && 
        frame.destinationMac !== 'FF:FF:FF:FF:FF:FF') {
      return; // 無視
    }

    // 2. EtherTypeを見て分岐
    if (frame.etherType === EtherType.ARP) {
      this.handleArp(frame.payload as ArpPacket);
    } else if (frame.etherType === EtherType.IPv4) {
      this.handleIp(frame.payload as IPv4Packet);
    }
  }

  // パケット送信のエントリーポイント
  // アプリ層からの要求をカプセル化していく
  async sendData(dstIp: string, data: any) {
    // 1. 宛先MACの解決 (ARP)
    let dstMac = this.arpTable.get(dstIp);
    
    if (!dstMac) {
      // ARPリクエストを送信して解決を待つ処理が必要
      // (シミュレータ実装の難所。Promiseなどで待機させる実装などが考えられる)
      console.log("ARP解決が必要です");
      return; 
    }

    // 2. L3パケット作成
    const packet: IPv4Packet = {
      /* ...省略... */,
      sourceIp: this.nic.ipAddress,
      destinationIp: dstIp,
      payload: data
    };

    // 3. L2フレーム作成
    const frame: EthernetFrame = {
      destinationMac: dstMac,
      sourceMac: this.nic.macAddress,
      etherType: EtherType.IPv4,
      payload: packet
    };

    // 4. 物理ポートから射出
    this.nic.bindPort.send(frame);
  }

  private handleArp(packet: ArpPacket) {
    // ARP Requestに対し、自分のIPならReplyを返すなどの処理
  }

  private handleIp(packet: IPv4Packet) {
    // ICMP Echo RequestならReplyを返すなどの処理
  }
}

```

---

## 5. 開発ロードマップ (推奨)

この設計に基づき、以下の順序で実装を進めることで、着実に機能を積み上げることができます。

1. **Phase 1: 物理層の確立**
* 2台の `PC` クラスと `Link` クラスを作る。
* IPアドレス等は無視し、`Link.transmit()` を呼ぶと相手の `Port.receive()` が発火することを `console.log` で確認する。


2. **Phase 2: L2通信 (ハブ)**
* 間に `Hub` クラスを挟む。
* PC A -> Hub -> PC B と信号が伝わることを確認する。


3. **Phase 3: カプセル化の実装**
* `EthernetFrame` や `IPv4Packet` の構造体を作る。
* ダミーのARPテーブルを持たせ、Ping (ICMP) オブジェクトを送受信させる。


4. **Phase 4: ARPの実装**
* ダミーテーブルを廃止。
* 「宛先MAC不明」→「ARP Request送信」→「ARP Reply受信」→「テーブル更新」→「ICMP送信」のフローを実装する。


5. **Phase 5: スイッチング**
* `Hub` を `L2Switch` に置き換え、MACアドレステーブルの学習挙動を実装する。