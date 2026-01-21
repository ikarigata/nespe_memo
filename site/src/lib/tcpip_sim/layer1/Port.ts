// Port.ts (Layer 1)
import { LanCable } from './LanCable';
import type { Signal } from './Signal';

export class Port {
  id: string;
  link: LanCable | null = null;
  
  // 上位層（NIC）へデータを渡すためのコールバック
  onReceive?: (signal: Signal<any>) => void;

  constructor(id: string) {
    this.id = id;
  }

  // ケーブルを挿す
  connect(link: LanCable) {
    this.link = link;
  }

  // L1: 物理的に送り出すだけ
  async send(signal: Signal<any>) {
    if (this.link) {
      await this.link.transmit(this, signal);
    }
  }

  // L1: 物理的に受け取って、上位層(NIC)に丸投げ
  receive(signal: Signal<any>) {
    if (this.onReceive) {
      this.onReceive(signal);
    }
  }
}