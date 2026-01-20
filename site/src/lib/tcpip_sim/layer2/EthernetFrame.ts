type MacAddress = string; // MACアドレスを表す型エイリアス

export type L2Payload = string; // L2のペイロード（中身）の型エイリアス

export type EtherType = number; // EtherTypeの型エイリアス

// データリンク層を行き来するデータの単位
export interface EthernetFrame {
  
  // preamble: string; // プリアンブル（同期用ビット列）
  // ヘッダ情報
  destinationMac: MacAddress; // 宛先MACアドレス
  sourceMac: MacAddress;      // 送信元MACアドレス
  type: EtherType;           // EtherType
  // ペイロード（中身）
  payload: L2Payload;
  // fcs: string; // フレームチェックシーケンス（エラーチェック用）
}