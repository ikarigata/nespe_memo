type MacAddress = string; // MACアドレスを表す型エイリアス

// データリンク層を行き来するデータの単位
export interface EthernetFrame {
  
  preamble: string; // プリアンブル（同期用ビット列）
  // ヘッダ情報
  destinationMac: MacAddress; // 宛先MACアドレス
  sourceMac: MacAddress;      // 送信元MACアドレス
  type: number;           // EtherType
  // ペイロード（中身）
  payload: string; 
  fcs: string; // フレームチェックシーケンス（エラーチェック用）
}