---
title: VPN技術の比較と使い分け
---

VPN（Virtual Private Network）は、インターネットなどの公衆ネットワーク上に仮想的な専用線を構築する技術です。この記事では、IPsec-VPN、SSL-VPN、IP-VPN、広域イーサネットの違いと使い分けを整理します。

## VPN技術の全体像

```mermaid
graph TB
    subgraph vpn["VPN技術の分類"]
        subgraph internet["インターネットVPN"]
            IPSEC["IPsec-VPN"]
            SSL["SSL-VPN"]
        end

        subgraph carrier["閉域網VPN"]
            IPVPN["IP-VPN<br/>（MPLS利用）"]
            WAN["広域イーサネット<br/>（VLAN利用）"]
        end
    end

    IPSEC --> USE1["拠点間接続<br/>（Site-to-Site）"]
    SSL --> USE2["リモートアクセス<br/>（クライアント接続）"]
    IPVPN --> USE3["企業WAN<br/>（L3接続）"]
    WAN --> USE4["企業WAN<br/>（L2接続）"]

    style IPSEC fill:#e3f2fd
    style SSL fill:#e3f2fd
    style IPVPN fill:#e8f5e9
    style WAN fill:#e8f5e9
    style USE1 fill:#fff3e0
    style USE2 fill:#fff3e0
    style USE3 fill:#fff3e0
    style USE4 fill:#fff3e0
```

---

## インターネットVPN vs 閉域網VPN

```mermaid
graph TB
    subgraph compare["比較"]
        subgraph internet["インターネットVPN"]
            I1["低コスト"]
            I2["導入が容易"]
            I3["品質は<br/>ベストエフォート"]
        end

        subgraph closed["閉域網VPN"]
            C1["高コスト"]
            C2["通信事業者と契約"]
            C3["品質保証<br/>（SLA）"]
        end
    end

    internet -->|"暗号化で<br/>セキュリティ確保"| NET1["インターネット<br/>（公衆網）"]
    closed -->|"物理的に<br/>分離"| NET2["通信事業者の<br/>閉域網"]

    style I1 fill:#e3f2fd
    style I2 fill:#e3f2fd
    style I3 fill:#e3f2fd
    style C1 fill:#e8f5e9
    style C2 fill:#e8f5e9
    style C3 fill:#e8f5e9
```

| 項目 | インターネットVPN | 閉域網VPN |
|:---|:---|:---|
| 回線 | インターネット | 通信事業者の専用網 |
| コスト | 低い | 高い |
| 品質 | ベストエフォート | SLAで保証 |
| セキュリティ | 暗号化で確保 | 網分離で確保 |
| 導入期間 | 短い | 長い |

---

## IPsec-VPN

IPsecはネットワーク層（L3）で動作するセキュリティプロトコルです。

### IPsecの構成要素

```mermaid
graph TB
    subgraph ipsec["IPsecの主要プロトコル"]
        IKE["IKE<br/>（鍵交換）"]
        ESP["ESP<br/>（暗号化+認証）"]
        AH["AH<br/>（認証のみ）"]
    end

    IKE -->|"SAの確立"| SA["セキュリティ<br/>アソシエーション<br/>（SA）"]
    SA --> ESP
    SA --> AH

    style IKE fill:#ffcdd2
    style ESP fill:#c8e6c9
    style AH fill:#bbdefb
    style SA fill:#fff3e0
```

| プロトコル | 役割 | 説明 |
|:---|:---|:---|
| IKE | 鍵交換 | SA（セキュリティアソシエーション）の確立 |
| ESP | 暗号化+認証 | データの暗号化と改ざん検知（プロトコル番号50） |
| AH | 認証のみ | 改ざん検知のみ（プロトコル番号51） |

### IKEのフェーズ

```mermaid
sequenceDiagram
    participant A as 拠点A
    participant B as 拠点B

    Note over A,B: フェーズ1（ISAKMP SA）
    A->>B: 暗号アルゴリズム提案
    B-->>A: アルゴリズム決定
    A->>B: 鍵交換（DH）
    B-->>A: 鍵交換（DH）
    A->>B: 認証
    B-->>A: 認証
    Note over A,B: ISAKMP SA確立

    Note over A,B: フェーズ2（IPsec SA）
    A->>B: IPsecパラメータ提案
    B-->>A: パラメータ決定
    Note over A,B: IPsec SA確立

    Note over A,B: データ通信開始
    A->>B: 暗号化データ
    B-->>A: 暗号化データ
```

### メインモード vs アグレッシブモード

```mermaid
graph TB
    subgraph main["メインモード"]
        M1["6回のメッセージ交換"]
        M2["IDを暗号化"]
        M3["高セキュリティ"]
        M4["固定IPが必要"]
    end

    subgraph aggressive["アグレッシブモード"]
        A1["3回のメッセージ交換"]
        A2["IDが平文"]
        A3["低セキュリティ"]
        A4["動的IPでも可"]
    end

    main -->|"推奨"| USE1["拠点間接続"]
    aggressive -->|"利用可"| USE2["リモートアクセス"]

    style M1 fill:#c8e6c9
    style M2 fill:#c8e6c9
    style M3 fill:#c8e6c9
    style M4 fill:#c8e6c9
    style A1 fill:#ffcdd2
    style A2 fill:#ffcdd2
    style A3 fill:#ffcdd2
    style A4 fill:#ffcdd2
```

### トンネルモード vs トランスポートモード

```mermaid
graph TB
    subgraph tunnel["トンネルモード"]
        T1["元のIPヘッダも暗号化"]
        T2["新しいIPヘッダを付加"]
        T3["拠点間接続向け"]
    end

    subgraph transport["トランスポートモード"]
        TR1["IPヘッダは暗号化しない"]
        TR2["ペイロードのみ暗号化"]
        TR3["エンドツーエンド向け"]
    end

    style T1 fill:#e3f2fd
    style T2 fill:#e3f2fd
    style T3 fill:#e3f2fd
    style TR1 fill:#fff3e0
    style TR2 fill:#fff3e0
    style TR3 fill:#fff3e0
```

```mermaid
graph TB
    subgraph original["元のパケット"]
        O_IP["IPヘッダ"]
        O_DATA["データ"]
    end

    subgraph tunnel_pkt["トンネルモード"]
        NEW_IP["新IPヘッダ"]
        ESP_H["ESPヘッダ"]
        ENC1["暗号化部分"]
        T_IP["元IPヘッダ"]
        T_DATA["データ"]
    end

    subgraph transport_pkt["トランスポートモード"]
        TR_IP["IPヘッダ<br/>（そのまま）"]
        ESP_H2["ESPヘッダ"]
        ENC2["暗号化部分"]
        TR_DATA["データ"]
    end

    style NEW_IP fill:#c8e6c9
    style ESP_H fill:#bbdefb
    style ENC1 fill:#ffcdd2
    style T_IP fill:#ffcdd2
    style T_DATA fill:#ffcdd2
    style TR_IP fill:#fff3e0
    style ESP_H2 fill:#bbdefb
    style ENC2 fill:#ffcdd2
    style TR_DATA fill:#ffcdd2
```

---

## SSL-VPN

SSL/TLSを利用したVPNで、主にリモートアクセス用途で使用されます。

### SSL-VPNの種類

```mermaid
graph TB
    subgraph ssl["SSL-VPNの種類"]
        REVERSE["リバースプロキシ方式"]
        PORT["ポートフォワーディング方式"]
        L2["L2フォワーディング方式"]
    end

    REVERSE --> R1["Webアプリのみ<br/>ブラウザで利用"]
    PORT --> P1["特定アプリ<br/>専用クライアント"]
    L2 --> L1["全アプリ対応<br/>仮想NIC"]

    style REVERSE fill:#e3f2fd
    style PORT fill:#fff3e0
    style L2 fill:#e8f5e9
    style R1 fill:#e3f2fd
    style P1 fill:#fff3e0
    style L1 fill:#e8f5e9
```

| 方式 | 対応アプリ | クライアント | 特徴 |
|:---|:---|:---|:---|
| リバースプロキシ | Webのみ | ブラウザ | 導入が最も容易 |
| ポートフォワーディング | 特定アプリ | 専用ソフト | TCP/UDPアプリ対応 |
| L2フォワーディング | 全アプリ | 仮想NIC | IPsec相当の機能 |

### IPsec-VPN vs SSL-VPN

```mermaid
graph TB
    subgraph ipsec["IPsec-VPN"]
        I1["L3で動作"]
        I2["専用クライアント必須"]
        I3["拠点間接続に最適"]
        I4["NATトラバーサル<br/>が必要な場合あり"]
    end

    subgraph ssl["SSL-VPN"]
        S1["L4-L7で動作"]
        S2["ブラウザでも可"]
        S3["リモートアクセスに最適"]
        S4["HTTPS（443）で<br/>FW通過が容易"]
    end

    style I1 fill:#e3f2fd
    style I2 fill:#e3f2fd
    style I3 fill:#e3f2fd
    style I4 fill:#e3f2fd
    style S1 fill:#e8f5e9
    style S2 fill:#e8f5e9
    style S3 fill:#e8f5e9
    style S4 fill:#e8f5e9
```

---

## IP-VPN（MPLS-VPN）

通信事業者のMPLS網を利用した閉域網VPNです。

### IP-VPNの仕組み

```mermaid
graph TB
    subgraph ipvpn["IP-VPN構成"]
        subgraph customer_a["企業A"]
            CE_A1["CE<br/>拠点1"]
            CE_A2["CE<br/>拠点2"]
        end

        subgraph mpls["通信事業者MPLS網"]
            PE1["PE"]
            PE2["PE"]
            PE3["PE"]
            P1["P"]
            P2["P"]
        end

        subgraph customer_b["企業B"]
            CE_B1["CE<br/>拠点1"]
        end
    end

    CE_A1 --> PE1
    CE_A2 --> PE2
    CE_B1 --> PE3
    PE1 --> P1
    PE2 --> P1
    PE1 --> P2
    PE3 --> P2
    P1 <--> P2

    style CE_A1 fill:#e3f2fd
    style CE_A2 fill:#e3f2fd
    style CE_B1 fill:#fff3e0
    style PE1 fill:#c8e6c9
    style PE2 fill:#c8e6c9
    style PE3 fill:#c8e6c9
    style P1 fill:#f3e5f5
    style P2 fill:#f3e5f5
```

| 機器 | 役割 |
|:---|:---|
| CE（Customer Edge） | 顧客側のルーター |
| PE（Provider Edge） | 事業者網の入口ルーター |
| P（Provider） | 事業者網内部のルーター |

### MPLSラベル

```mermaid
graph TB
    subgraph mpls_label["MPLSによる転送"]
        PKT1["IPパケット"]
        PKT2["ラベル + IPパケット"]
        PKT3["IPパケット"]
    end

    PKT1 -->|"ラベル付与<br/>（Push）"| PKT2
    PKT2 -->|"ラベル除去<br/>（Pop）"| PKT3

    subgraph flow["転送の流れ"]
        CE1["CE"] --> PE_IN["PE<br/>（入口）"]
        PE_IN -->|"ラベルで<br/>高速転送"| P["P"]
        P --> PE_OUT["PE<br/>（出口）"]
        PE_OUT --> CE2["CE"]
    end

    style PKT1 fill:#fff3e0
    style PKT2 fill:#c8e6c9
    style PKT3 fill:#fff3e0
```

---

## 広域イーサネット

通信事業者のL2網を利用したサービスで、拠点間をL2で接続します。

### 広域イーサネットの仕組み

```mermaid
graph TB
    subgraph wan_eth["広域イーサネット構成"]
        subgraph site1["拠点1"]
            SW1["L2スイッチ"]
        end

        subgraph carrier["通信事業者網"]
            VLAN["VLAN/VPLSで<br/>論理分離"]
        end

        subgraph site2["拠点2"]
            SW2["L2スイッチ"]
        end
    end

    SW1 -->|"同一VLAN"| VLAN
    VLAN -->|"同一VLAN"| SW2

    NOTE["拠点間が同一<br/>ブロードキャスト<br/>ドメイン"]

    style SW1 fill:#e3f2fd
    style SW2 fill:#e3f2fd
    style VLAN fill:#c8e6c9
    style NOTE fill:#fff3e0
```

### IP-VPN vs 広域イーサネット

```mermaid
graph TB
    subgraph ipvpn["IP-VPN"]
        IP1["L3接続"]
        IP2["ルーティングは<br/>事業者網で実施"]
        IP3["拠点ごとに<br/>異なるセグメント"]
    end

    subgraph wan["広域イーサネット"]
        W1["L2接続"]
        W2["ルーティングは<br/>自社で実施"]
        W3["拠点間で<br/>同一セグメント可"]
    end

    style IP1 fill:#e3f2fd
    style IP2 fill:#e3f2fd
    style IP3 fill:#e3f2fd
    style W1 fill:#e8f5e9
    style W2 fill:#e8f5e9
    style W3 fill:#e8f5e9
```

| 項目 | IP-VPN | 広域イーサネット |
|:---|:---|:---|
| 接続レイヤー | L3（ネットワーク層） | L2（データリンク層） |
| ルーティング | 事業者が管理 | 自社で管理 |
| プロトコル | IP限定 | 任意（IPX等も可） |
| 拡張性 | 高い | 中程度 |
| 自由度 | 低い | 高い |

---

## GRE over IPsec

GRE（Generic Routing Encapsulation）とIPsecを組み合わせた構成です。

### GREの役割

```mermaid
graph TB
    subgraph gre["GREの特徴"]
        G1["マルチキャスト対応"]
        G2["動的ルーティング<br/>プロトコル対応"]
        G3["非IPプロトコル<br/>のカプセル化"]
    end

    subgraph ipsec_limit["IPsecの制限"]
        I1["ユニキャストのみ"]
        I2["IPのみ対応"]
    end

    ipsec_limit -->|"GREで解決"| gre

    style G1 fill:#c8e6c9
    style G2 fill:#c8e6c9
    style G3 fill:#c8e6c9
    style I1 fill:#ffcdd2
    style I2 fill:#ffcdd2
```

### GRE over IPsecの構造

```mermaid
graph TB
    subgraph packet["パケット構造"]
        NEW_IP["新IPヘッダ"]
        ESP["ESPヘッダ"]
        GRE["GREヘッダ"]
        ORIG_IP["元IPヘッダ"]
        DATA["データ"]
    end

    subgraph enc["暗号化範囲"]
        ENC["IPsecで暗号化"]
    end

    NEW_IP --> ESP
    ESP --> GRE
    GRE --> ORIG_IP
    ORIG_IP --> DATA

    style NEW_IP fill:#e3f2fd
    style ESP fill:#bbdefb
    style GRE fill:#fff3e0
    style ORIG_IP fill:#ffcdd2
    style DATA fill:#ffcdd2
```

---

## ローカルブレイクアウト

クラウドサービス向けの通信を、本社データセンターを経由せず直接インターネットへ出す構成です。

### 従来構成 vs ローカルブレイクアウト

```mermaid
graph TB
    subgraph traditional["従来構成"]
        B1["拠点"]
        DC1["データセンター"]
        CLOUD1["クラウド"]

        B1 -->|"VPN"| DC1
        DC1 -->|"インターネット"| CLOUD1
    end

    subgraph lbo["ローカルブレイクアウト"]
        B2["拠点"]
        DC2["データセンター"]
        CLOUD2["クラウド"]

        B2 -->|"VPN<br/>社内通信"| DC2
        B2 -->|"直接接続<br/>クラウド向け"| CLOUD2
    end

    style B1 fill:#e3f2fd
    style DC1 fill:#fff3e0
    style CLOUD1 fill:#e8f5e9
    style B2 fill:#e3f2fd
    style DC2 fill:#fff3e0
    style CLOUD2 fill:#e8f5e9
```

**メリット:**
- データセンターの回線負荷軽減
- クラウドサービスへの遅延低減
- 回線コストの削減

**注意点:**
- 各拠点でのセキュリティ対策が必要
- 通信経路の可視化が複雑化

---

## VPN技術の選定フロー

```mermaid
graph TB
    START["VPN選定開始"]

    Q1{"通信品質の<br/>保証が必要?"}
    Q2{"L2接続が<br/>必要?"}
    Q3{"拠点間接続?<br/>リモートアクセス?"}

    START --> Q1
    Q1 -->|"はい"| Q2
    Q1 -->|"いいえ"| Q3

    Q2 -->|"はい"| WAN["広域イーサネット"]
    Q2 -->|"いいえ"| IPVPN["IP-VPN"]

    Q3 -->|"拠点間"| IPSEC["IPsec-VPN"]
    Q3 -->|"リモート"| SSL["SSL-VPN"]

    style START fill:#f3e5f5
    style WAN fill:#e8f5e9
    style IPVPN fill:#e8f5e9
    style IPSEC fill:#e3f2fd
    style SSL fill:#e3f2fd
```

---

## VPN技術比較表

| 項目 | IPsec-VPN | SSL-VPN | IP-VPN | 広域イーサネット |
|:---|:---|:---|:---|:---|
| 動作層 | L3 | L4-L7 | L3 | L2 |
| 回線 | インターネット | インターネット | 閉域網 | 閉域網 |
| コスト | 低 | 低 | 高 | 高 |
| 品質 | ベストエフォート | ベストエフォート | SLA保証 | SLA保証 |
| 主な用途 | 拠点間接続 | リモートアクセス | 企業WAN | 企業WAN |
| 暗号化 | 必須 | 必須 | オプション | オプション |

---

## 試験対策のポイント

```mermaid
mindmap
  root((VPN技術<br/>の要点))
    IPsec
      IKEフェーズ1/2
      メインモード<br/>アグレッシブモード
      トンネルモード<br/>トランスポートモード
      ESP/AH
    SSL-VPN
      3つの方式
      リモートアクセス向け
      443ポート
    閉域網VPN
      IP-VPN（L3）
      広域イーサネット（L2）
      MPLS
    設計
      ローカルブレイクアウト
      GRE over IPsec
```

1. **IPsecの動作を理解する**
   - フェーズ1でISAKMP SA、フェーズ2でIPsec SAを確立
   - ESPは暗号化+認証、AHは認証のみ

2. **モードの違いを把握する**
   - メインモード: 6往復、IDを暗号化、固定IP向け
   - アグレッシブモード: 3往復、IDが平文、動的IP可

3. **閉域網VPNの使い分け**
   - IP-VPN: L3接続、ルーティングは事業者任せ
   - 広域イーサネット: L2接続、自由度が高い

4. **最新トレンド**
   - ローカルブレイクアウトによるクラウド最適化
   - SD-WANとの組み合わせ
