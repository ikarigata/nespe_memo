// LanCable.ts
import { Port } from './Port';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class LanCable {
  portA: Port;
  portB: Port;
  latency: number;

  constructor(portA: Port, portB: Port, latency: number = 1000) {
    this.portA = portA;
    this.portB = portB;
    this.latency = latency;

    // ポートに「このLANケーブルが刺さったよ」と教える
    portA.connect(this);
    portB.connect(this);
  }

  // 「送信」というより「信号を伝える」イメージ
  async transmit(fromPort: Port, frame: any) {
    const targetPort = (fromPort === this.portA) ? this.portB : this.portA;

    await delay(this.latency);
    
    targetPort.receive(frame);
  }
}