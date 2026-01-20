// L2_DataLink.ts
import { Port } from '../layer1/Port';
import { Signal } from '../layer1/Signal';
import type { EthernetFrame, EtherType, L2Payload } from './EthernetFrame';


/**
 * ■ 上位層 (L3: NetworkLayer) のためのインターフェース
 * 依存関係の逆転 (DIP) を実現するために定義します。
 * NICは「具体的なIP層の実装」を知りませんが、「このメソッドを持つ誰か」であることは知っています。
 */
export interface INetworkLayer {
  // L2ヘッダを剥がした後、中身(パケット)とタイプ(IPv4/ARP)を受け取るメソッド
  receive(payload: L2Payload, type: EtherType): void;
}

export class NetworkInterface {
  // NIC固有の情報
  readonly macAddress: string;
  readonly port: Port; // NICは物理ポートを1つ持っている (Has-a)

  // 上位層への参照 (OSのIPスタックなど)
  // 初期化後に「このNICはこのOSに刺さっている」と設定される
  upperLayer?: INetworkLayer;

  // プロミスキャスモード (自分宛て以外も受信するか)
  // パケットキャプチャ等の実験用フラグ
  isPromiscuous: boolean = false;

  constructor(mac: string, portId: string) {
    this.macAddress = mac;
    
    // NICとポートは1対1対応
    this.port = new Port(portId);

    // 2. 物理層からの「割り込み」を配線 (Wiring)
    // ポートに電気が流れてきたら、自分の handleSignal メソッドを起動させる
    this.port.onReceive = (signal) => this.handleSignal(signal);
  }

  /**
   * ■ 受信処理 (Demultiplexing & Decapsulation)
   * L1(Signal) -> L2(Frame) -> L3(Packet)
   */
  private handleSignal(signal: Signal<any>) {
    // 1. 信号からフレームを取り出す (L1 -> L2)
    // L1は中身を知らない(any)ので、ここで「これはEthernetFrameだ」と解釈する
    const frame = signal.payload as EthernetFrame;

    // 2. MACアドレスフィルタリング (L2の仕事)
    const isMyPacket = (frame.destinationMac === this.macAddress);
    const isBroadcast = (frame.destinationMac === "FF:FF:FF:FF:FF:FF");

    // 自分宛て or ブロードキャスト or プロミスキャスモード なら受信
    if (isMyPacket || isBroadcast || this.isPromiscuous) {
      console.log(`[NIC:${this.macAddress}] 受信成功 (Dst: ${frame.destinationMac}, Type: 0x${frame.type.toString(16)})`);
      
      // 3. 上位層 (IP層) へ渡す
      if (this.upperLayer) {
        // Ethernetヘッダを剥がして、ペイロードだけを渡す
        this.upperLayer.receive(frame.payload, frame.type);
      } else {
        console.warn(`  ⚠️ 受信しましたが、上位層(OS)が接続されていません (Drop)`);
      }

    } else {
      // 4. 破棄 (Drop)
      // CPUには通知せず、ここで捨てる
      // console.log(`  -> 破棄 (宛先違い: ${frame.destMac})`);
    }
  }

  /**
   * ■ 送信処理 (Encapsulation)
   * L3(Packet) -> L2(Frame) -> L1(Signal)
   * * @param destMac 宛先MACアドレス (ARPで解決済みか、Broadcast)
   * @param type    中身のタイプ (IPv4=0x0800, ARP=0x0806)
   * @param payload 中身のデータ (IPパケットなど)
   */
  async sendFrame(destMac: string, type: EtherType, payload: L2Payload) {
    
    // 1. L2ヘッダの付与 (Ethernet Frame作成)
    const frame: EthernetFrame = {
      destinationMac: destMac,
      sourceMac: this.macAddress, // 送信元は必ず自分
      type: type,
      payload: payload
    };

    console.log(`[NIC:${this.macAddress}] 送信開始 (To: ${destMac})`);

    // 2. 電気信号に変換 (L1用の箱に入れる)
    const signal = new Signal<EthernetFrame>(frame);

    // 3. 物理ポートへ流す
    await this.port.send(signal);
  }
}