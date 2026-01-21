import { Port } from '../layer1/Port';
import { Signal } from '../layer1/Signal';
import type { EthernetFrame } from './EthernetFrame';
import { MAC_BROADCAST } from './EthernetFrame';

export class L2Switch {
  name: string;
  ports: Port[] = [];

  // MACアドレステーブル
  // Key: MACアドレス, Value: そのMACがいるポート
  macTable: Map<string, Port> = new Map();

  constructor(name: string, portCount: number) {
    this.name = name;

    // 指定された数のポートを用意する
    for (let i = 0; i < portCount; i++) {
      const port = new Port(`${name}-p${i}`);
      // ポートから信号が来たら handleSignal を呼ぶ
      // どのポートから来たか(ingressPort)を知る必要がある
      port.onReceive = (signal) => this.handleSignal(signal, port);
      this.ports.push(port);
    }
  }

  /**
   * ■ スイッチング処理 (Store & Forward)
   * 信号を受け取り、中身を見て、適切なポートへ転送する
   */
  private async handleSignal(signal: Signal<unknown>, ingressPort: Port) {
    
    // 信号の中身をEthernetFrameとして扱う
    const frame = signal.payload as EthernetFrame;

    console.log(`[Switch:${this.name}] Port[${ingressPort.id}]受信: ${frame.sourceMac} -> ${frame.destinationMac}`);

    // ====================================================
    // ① 学習プロセス (Source MAC Learning)
    // ====================================================
    // 「このポートの先には、このMACアドレスの人がいるんだな」と覚える
    if (!this.macTable.has(frame.sourceMac)) {
        console.log(`  ★学習: ${frame.sourceMac} は Port[${ingressPort.id}] に割り当て`);
    }
    // 常に最新の情報に更新する（移動対応）
    this.macTable.set(frame.sourceMac, ingressPort);

    // ====================================================
    // ② 転送プロセス (Forwarding Decision)
    // ====================================================
    const targetPort = this.macTable.get(frame.destinationMac);

    // ケースA: ブロードキャスト (全員へ)
    if (frame.destinationMac === MAC_BROADCAST) {
      console.log(`  -> Broadcast: フラッディング`);
      this.flood(signal, ingressPort);
    }
    // ケースB: 知っている宛先 (Unicast -> フィルタリング)
    else if (targetPort) {
      // 自分のいるポートに戻す必要はない
      if (targetPort !== ingressPort) {
        console.log(`  -> Unicast: Port[${targetPort.id}] へ転送`);
        // スイッチング処理の遅延（レイテンシ）を表現してもOK
        await targetPort.send(signal);
      }
    }
    // ケースC: 知らない宛先 (Unknown Unicast -> フラッディング)
    else {
      console.log(`  -> Unknown MAC: フラッディング（学習してないので全員に聞く）`);
      this.flood(signal, ingressPort);
    }
  }

  /**
   * フラッディング
   * 受信ポート以外の全ポートに送信する（ハブと同じ動き）
   */
  private flood(signal: Signal<unknown>, ingressPort: Port) {
    this.ports.forEach(p => {
      if (p !== ingressPort) {
        p.send(signal);
      }
    });
  }
}