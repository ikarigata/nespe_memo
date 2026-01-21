// LanCable.ts
import { Port } from './Port';
import type { Signal } from './Signal';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * LANケーブル（物理層デバイス）
 *
 * 2つのポートを接続し、信号を伝送する。
 * L1デバイスなので、信号の中身（EthernetFrame等）は知らない。
 */
export class LanCable {
  portA: Port;
  portB: Port;
  latency: number;

  /**
   * LANケーブルを作成
   *
   * @param portA 接続先ポートA
   * @param portB 接続先ポートB
   * @param latency 伝送遅延（ミリ秒）。デフォルト: 1ms
   *
   * @remarks
   * 現実のLANケーブルは数マイクロ秒だが、シミュレーション上は1msが適切。
   * 1000ms（旧デフォルト値）だとデモが非常に遅い。
   */
  constructor(portA: Port, portB: Port, latency: number = 1) {
    this.portA = portA;
    this.portB = portB;
    this.latency = latency;

    // ポートに「このLANケーブルが刺さったよ」と教える
    portA.connect(this);
    portB.connect(this);
  }

  /**
   * 信号を伝送する
   *
   * L1デバイスとして、信号の中身を知らずに伝える。
   * 伝送遅延をシミュレートした後、対向ポートに信号を渡す。
   *
   * @param fromPort 送信元ポート
   * @param signal 伝送する信号（中身は不明: Signal<unknown>）
   */
  async transmit(fromPort: Port, signal: Signal<unknown>): Promise<void> {
    const targetPort = (fromPort === this.portA) ? this.portB : this.portA;

    await delay(this.latency);

    targetPort.receive(signal);
  }
}