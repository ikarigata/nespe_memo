export class Signal<T> {
  // 中身が何かは知らないが、とりあえず T 型のデータを持つ
  // 物理層ではレイヤー2を意識しない
  payload: T;
  isCorrupted: boolean = false;

  constructor(payload: T) {
    this.payload = payload;
  }
}