// L2_NIC.ts
import { Port } from '../layer1/Port';
import type { EthernetFrame } from './EthernetFrame';

// ⭕️ L2が「私の上の人は、こういうメソッドを持っててね」と定義する
export interface UpperLayerReceiver {
  receive(payload: any, type: number): void;
}

export class NetworkInterface {
  // 具体的なクラスではなく、インターフェースに依存する
  upperLayer?: UpperLayerReceiver;

  receive(frame: EthernetFrame) {
    if (this.upperLayer) {
      // 相手がIPv4かIPv6か知らないが、とにかく渡す
      this.upperLayer.receive(frame.payload, frame.type);
    }
  }
}