// L1_RepeaterHub.ts
import { Port } from '../layer1/Port';
import { Signal } from './Signal';

export class RepeaterHub {
  name: string;
  // ハブが持つ全ポート
  ports: Port[] = [];

  constructor(name: string, portCount: number) {
    this.name = name;

    // 指定された数のポートを用意する
    for (let i = 0; i < portCount; i++) {
      const port = new Port(`${name}-port${i}`);

      // 【配線】
      // ポートに信号が来たら、このハブの handleSignal を呼び出す
      // ※「どのポートから来たか(ingressPort)」を引数に渡すのがポイント
      port.onReceive = (signal) => this.handleSignal(signal, port);
      this.ports.push(port);
    }
  }

  /**
   * 中身(Frame)は見ず、Signalとして扱う
   */
  private handleSignal(signal: Signal<any>, ingressPort: Port) {
    console.log(`[Hub:${this.name}] 信号を受信 (Port: ${ingressPort.id})`);
    console.log(`  -> 増幅して全ポートへ拡散します...`);

    // 全ポートをループして、受信ポート以外に送信する
    this.ports.forEach(outPort => {
      if (outPort !== ingressPort) {
        outPort.send(signal);
      }
    });
  }
}