---
title: ルーティングプロトコル（OSPF・BGP）
---

動的ルーティングプロトコルは、ネットワークの経路情報を自動的に交換・学習する仕組みです。この記事では、企業ネットワークで頻出のOSPFとBGPを中心に、設計ポイントを整理します。

## ルーティングプロトコルの分類

```mermaid
graph TB
    subgraph routing["ルーティングプロトコルの分類"]
        subgraph igp["IGP（内部ゲートウェイ）"]
            subgraph dv["ディスタンスベクタ型"]
                RIP["RIP"]
            end
            subgraph ls["リンクステート型"]
                OSPF["OSPF"]
                ISIS["IS-IS"]
            end
            subgraph hybrid["ハイブリッド型"]
                EIGRP["EIGRP<br/>（Cisco独自）"]
            end
        end

        subgraph egp["EGP（外部ゲートウェイ）"]
            subgraph pv["パスベクトル型"]
                BGP["BGP"]
            end
        end
    end

    style RIP fill:#ffcdd2
    style OSPF fill:#c8e6c9
    style ISIS fill:#c8e6c9
    style EIGRP fill:#fff3e0
    style BGP fill:#bbdefb
```

| 種別 | プロトコル | アルゴリズム | 用途 |
|:---|:---|:---|:---|
| IGP | RIP | ベルマンフォード | 小規模ネットワーク |
| IGP | OSPF | ダイクストラ（SPF） | 企業ネットワーク |
| IGP | IS-IS | ダイクストラ | ISP内部 |
| EGP | BGP | パスベクトル | ISP間接続 |

---

## OSPF（Open Shortest Path First）

OSPFはリンクステート型のIGPで、企業ネットワークで最も広く使われています。

### OSPFの基本動作

```mermaid
sequenceDiagram
    participant R1 as ルーターA
    participant R2 as ルーターB

    Note over R1,R2: ネイバー確立
    R1->>R2: Hello（10秒間隔）
    R2-->>R1: Hello

    Note over R1,R2: 隣接関係確立（Adjacency）
    R1->>R2: DBD（データベース記述）
    R2-->>R1: DBD
    R1->>R2: LSR（リンクステート要求）
    R2-->>R1: LSU（リンクステート更新）
    R1->>R2: LSAck

    Note over R1,R2: SPF計算・経路決定
```

### OSPFの状態遷移

```mermaid
graph TB
    DOWN["Down"]
    INIT["Init"]
    TWOWAY["2-Way"]
    EXSTART["ExStart"]
    EXCHANGE["Exchange"]
    LOADING["Loading"]
    FULL["Full"]

    DOWN -->|"Hello受信"| INIT
    INIT -->|"Hello応答受信"| TWOWAY
    TWOWAY -->|"DR/BDR選出後"| EXSTART
    EXSTART -->|"マスター/スレーブ決定"| EXCHANGE
    EXCHANGE -->|"DBD交換完了"| LOADING
    LOADING -->|"LSA交換完了"| FULL

    style DOWN fill:#ffcdd2
    style INIT fill:#fff3e0
    style TWOWAY fill:#fff3e0
    style EXSTART fill:#bbdefb
    style EXCHANGE fill:#bbdefb
    style LOADING fill:#bbdefb
    style FULL fill:#c8e6c9
```

| 状態 | 説明 |
|:---|:---|
| Down | 初期状態 |
| Init | Helloを受信したがまだ双方向ではない |
| 2-Way | 双方向通信を確認、DR/BDR選出 |
| ExStart | マスター/スレーブを決定 |
| Exchange | DBDを交換 |
| Loading | 不足しているLSAを要求・受信 |
| Full | 隣接関係が完全に確立 |

### DR/BDRの選出

マルチアクセスネットワークでは、LSA交換の効率化のためDR（Designated Router）とBDR（Backup DR）を選出します。

```mermaid
graph TB
    subgraph multi["マルチアクセスネットワーク"]
        DR["DR<br/>（代表ルーター）<br/>優先度: 最高"]
        BDR["BDR<br/>（バックアップ）<br/>優先度: 2番目"]
        OTHER1["DROther<br/>ルーター1"]
        OTHER2["DROther<br/>ルーター2"]
        OTHER3["DROther<br/>ルーター3"]
    end

    OTHER1 -->|"LSA"| DR
    OTHER2 -->|"LSA"| DR
    OTHER3 -->|"LSA"| DR
    DR -->|"LSA配布"| BDR
    DR -->|"LSA配布"| OTHER1
    DR -->|"LSA配布"| OTHER2
    DR -->|"LSA配布"| OTHER3

    style DR fill:#ffcdd2
    style BDR fill:#fff3e0
    style OTHER1 fill:#e3f2fd
    style OTHER2 fill:#e3f2fd
    style OTHER3 fill:#e3f2fd
```

**DR選出の優先順位:**
1. プライオリティ値が最大（0は選出対象外）
2. ルーターIDが最大

### OSPFエリア設計

```mermaid
graph TB
    subgraph ospf_area["OSPFエリア構成"]
        subgraph area0["エリア0（バックボーン）"]
            ABR1["ABR"]
            ABR2["ABR"]
            R0["内部ルーター"]
        end

        subgraph area1["エリア1"]
            R1["内部ルーター"]
            R2["内部ルーター"]
        end

        subgraph area2["エリア2<br/>（スタブエリア）"]
            R3["内部ルーター"]
        end

        subgraph external["外部AS"]
            ASBR["ASBR"]
            EXT["外部ネットワーク"]
        end
    end

    ABR1 --> R1
    ABR1 --> R2
    ABR2 --> R3
    R0 --> ABR1
    R0 --> ABR2
    R0 --> ASBR
    ASBR --> EXT

    style ABR1 fill:#fff3e0
    style ABR2 fill:#fff3e0
    style ASBR fill:#ffcdd2
    style R0 fill:#c8e6c9
    style R1 fill:#e3f2fd
    style R2 fill:#e3f2fd
    style R3 fill:#bbdefb
```

| ルーター種別 | 役割 |
|:---|:---|
| 内部ルーター | 1つのエリア内のみに所属 |
| ABR | 複数エリアに所属、エリア間の経路情報を中継 |
| ASBR | 外部ASとの境界、外部経路を再配布 |
| バックボーンルーター | エリア0に所属 |

### LSAタイプ

```mermaid
graph TB
    subgraph lsa["LSAタイプ"]
        LSA1["タイプ1<br/>ルーターLSA"]
        LSA2["タイプ2<br/>ネットワークLSA"]
        LSA3["タイプ3<br/>サマリーLSA"]
        LSA4["タイプ4<br/>ASBRサマリーLSA"]
        LSA5["タイプ5<br/>AS外部LSA"]
        LSA7["タイプ7<br/>NSSA外部LSA"]
    end

    LSA1 -->|"エリア内"| SCOPE1["同一エリア内"]
    LSA2 -->|"エリア内"| SCOPE1
    LSA3 -->|"エリア間"| SCOPE2["ABRが生成"]
    LSA4 -->|"エリア間"| SCOPE2
    LSA5 -->|"AS全体"| SCOPE3["ASBRが生成"]
    LSA7 -->|"NSSA内"| SCOPE4["NSSAのASBRが生成"]

    style LSA1 fill:#e3f2fd
    style LSA2 fill:#e3f2fd
    style LSA3 fill:#c8e6c9
    style LSA4 fill:#c8e6c9
    style LSA5 fill:#ffcdd2
    style LSA7 fill:#fff3e0
```

| タイプ | 名称 | 生成元 | 伝播範囲 |
|:---|:---|:---|:---|
| 1 | ルーターLSA | 全ルーター | エリア内 |
| 2 | ネットワークLSA | DR | エリア内 |
| 3 | サマリーLSA | ABR | 他エリアへ |
| 4 | ASBRサマリーLSA | ABR | ASBRの位置情報 |
| 5 | AS外部LSA | ASBR | AS全体 |
| 7 | NSSA外部LSA | NSSA内ASBR | NSSA内 |

### スタブエリアの種類

```mermaid
graph TB
    subgraph stub["スタブエリアの種類"]
        STUB["スタブエリア"]
        TSTUB["トータリースタブ"]
        NSSA["NSSA"]
        TNSSA["トータリーNSSA"]
    end

    STUB --> S1["タイプ5 LSAを<br/>受け取らない"]
    TSTUB --> S2["タイプ3,4,5 LSAを<br/>受け取らない"]
    NSSA --> S3["タイプ5の代わりに<br/>タイプ7を使用"]
    TNSSA --> S4["タイプ3,4,5を受け取らず<br/>タイプ7を使用"]

    style STUB fill:#e3f2fd
    style TSTUB fill:#c8e6c9
    style NSSA fill:#fff3e0
    style TNSSA fill:#ffcdd2
```

---

## BGP（Border Gateway Protocol）

BGPはAS（自律システム）間の経路交換に使用されるEGPです。

### BGPの基本概念

```mermaid
graph TB
    subgraph bgp_concept["BGPの概念"]
        subgraph as1["AS 65001"]
            R1["ルーター1"]
            R2["ルーター2"]
        end

        subgraph as2["AS 65002"]
            R3["ルーター3"]
            R4["ルーター4"]
        end

        subgraph as3["AS 65003"]
            R5["ルーター5"]
        end
    end

    R1 <-->|"iBGP"| R2
    R3 <-->|"iBGP"| R4
    R2 <-->|"eBGP"| R3
    R4 <-->|"eBGP"| R5

    style R1 fill:#e3f2fd
    style R2 fill:#e3f2fd
    style R3 fill:#c8e6c9
    style R4 fill:#c8e6c9
    style R5 fill:#fff3e0
```

| 用語 | 説明 |
|:---|:---|
| AS | 自律システム。同一管理下のネットワーク群 |
| eBGP | 異なるAS間のBGPセッション |
| iBGP | 同一AS内のBGPセッション |
| AS番号 | ASを識別する番号（2バイトまたは4バイト） |

### BGPメッセージタイプ

```mermaid
sequenceDiagram
    participant R1 as BGPピア1
    participant R2 as BGPピア2

    Note over R1,R2: 接続確立（TCP 179）
    R1->>R2: OPEN
    R2-->>R1: OPEN

    Note over R1,R2: 経路交換
    R1->>R2: UPDATE（経路情報）
    R2-->>R1: UPDATE（経路情報）

    Note over R1,R2: 接続維持
    R1->>R2: KEEPALIVE（60秒間隔）
    R2-->>R1: KEEPALIVE

    Note over R1,R2: エラー時
    R1->>R2: NOTIFICATION
```

| メッセージ | 役割 |
|:---|:---|
| OPEN | セッション確立、パラメータ交換 |
| UPDATE | 経路情報の広告・取り消し |
| KEEPALIVE | 接続維持（デフォルト60秒） |
| NOTIFICATION | エラー通知、セッション切断 |

### BGPパス属性

```mermaid
graph TB
    subgraph attr["BGPパス属性"]
        subgraph wellknown["Well-known（必須）"]
            ORIGIN["ORIGIN<br/>経路の起源"]
            ASPATH["AS_PATH<br/>経由AS一覧"]
            NEXTHOP["NEXT_HOP<br/>次のホップ"]
        end

        subgraph optional["Optional（オプション）"]
            LOCPREF["LOCAL_PREF<br/>ローカル優先度"]
            MED["MED<br/>外部メトリック"]
            COMMUNITY["COMMUNITY<br/>経路のグループ化"]
        end
    end

    style ORIGIN fill:#ffcdd2
    style ASPATH fill:#ffcdd2
    style NEXTHOP fill:#ffcdd2
    style LOCPREF fill:#c8e6c9
    style MED fill:#fff3e0
    style COMMUNITY fill:#bbdefb
```

| 属性 | 種別 | 説明 | 経路選択での優先度 |
|:---|:---|:---|:---|
| ORIGIN | 必須 | 経路の起源（i, e, ?） | 7番目 |
| AS_PATH | 必須 | 経由したASの一覧 | 3番目 |
| NEXT_HOP | 必須 | パケットの転送先 | - |
| LOCAL_PREF | オプション | AS内での優先度（大きいほど優先） | 2番目 |
| MED | オプション | 他ASへの優先度指示（小さいほど優先） | 6番目 |

### BGP経路選択アルゴリズム

```mermaid
graph TB
    START["経路選択開始"]

    Q1{"1. WEIGHT<br/>（Cisco独自）<br/>大きい方"}
    Q2{"2. LOCAL_PREF<br/>大きい方"}
    Q3{"3. ローカル生成<br/>経路優先"}
    Q4{"4. AS_PATH<br/>短い方"}
    Q5{"5. ORIGIN<br/>i > e > ?"}
    Q6{"6. MED<br/>小さい方"}
    Q7{"7. eBGP > iBGP"}
    Q8{"8. IGPメトリック<br/>小さい方"}
    BEST["最適経路決定"]

    START --> Q1
    Q1 -->|"同じ"| Q2
    Q2 -->|"同じ"| Q3
    Q3 -->|"同じ"| Q4
    Q4 -->|"同じ"| Q5
    Q5 -->|"同じ"| Q6
    Q6 -->|"同じ"| Q7
    Q7 -->|"同じ"| Q8
    Q8 --> BEST

    Q1 -->|"決定"| BEST
    Q2 -->|"決定"| BEST
    Q3 -->|"決定"| BEST
    Q4 -->|"決定"| BEST
    Q5 -->|"決定"| BEST
    Q6 -->|"決定"| BEST
    Q7 -->|"決定"| BEST

    style START fill:#f3e5f5
    style BEST fill:#c8e6c9
```

### iBGPのフルメッシュ問題

```mermaid
graph TB
    subgraph problem["iBGPフルメッシュ問題"]
        subgraph full["フルメッシュ必要"]
            F1["ルーター1"]
            F2["ルーター2"]
            F3["ルーター3"]
            F4["ルーター4"]
        end
    end

    F1 <--> F2
    F1 <--> F3
    F1 <--> F4
    F2 <--> F3
    F2 <--> F4
    F3 <--> F4

    NOTE["n台のルーターで<br/>n(n-1)/2本の<br/>セッションが必要"]

    style F1 fill:#ffcdd2
    style F2 fill:#ffcdd2
    style F3 fill:#ffcdd2
    style F4 fill:#ffcdd2
    style NOTE fill:#fff3e0
```

### ルートリフレクタ

```mermaid
graph TB
    subgraph rr["ルートリフレクタ構成"]
        RR["ルートリフレクタ<br/>（RR）"]

        subgraph clients["RRクライアント"]
            C1["クライアント1"]
            C2["クライアント2"]
            C3["クライアント3"]
        end

        NON["非クライアント"]
    end

    C1 --> RR
    C2 --> RR
    C3 --> RR
    RR <--> NON

    NOTE["クライアント間は<br/>RRが経路を反映"]

    style RR fill:#ffcdd2
    style C1 fill:#e3f2fd
    style C2 fill:#e3f2fd
    style C3 fill:#e3f2fd
    style NON fill:#c8e6c9
```

**ルートリフレクタの動作:**
- クライアントから受信した経路 → 他のクライアント・非クライアントへ反映
- 非クライアントから受信した経路 → クライアントへのみ反映

---

## BFD（Bidirectional Forwarding Detection）

障害検知を高速化するプロトコルです。

```mermaid
graph TB
    subgraph bfd["BFDによる高速検知"]
        subgraph without["BFDなし"]
            W1["OSPF Hello<br/>10秒間隔"]
            W2["Dead Interval<br/>40秒で検知"]
        end

        subgraph with["BFDあり"]
            B1["BFD<br/>ミリ秒間隔"]
            B2["数十ミリ秒で<br/>検知"]
        end
    end

    without -->|"遅い"| FAILOVER1["40秒後に<br/>フェイルオーバー"]
    with -->|"高速"| FAILOVER2["即座に<br/>フェイルオーバー"]

    style W1 fill:#ffcdd2
    style W2 fill:#ffcdd2
    style B1 fill:#c8e6c9
    style B2 fill:#c8e6c9
```

| 項目 | BFDなし | BFDあり |
|:---|:---|:---|
| 検知間隔 | 秒単位 | ミリ秒単位 |
| OSPF障害検知 | 約40秒 | 50ms〜数秒 |
| BGP障害検知 | 約180秒 | 50ms〜数秒 |

---

## 経路再配布

異なるルーティングプロトコル間で経路情報を交換します。

```mermaid
graph TB
    subgraph redist["経路再配布"]
        subgraph ospf_domain["OSPF領域"]
            OSPF_R["OSPFルーター"]
        end

        ASBR["ASBR<br/>（再配布ポイント）"]

        subgraph bgp_domain["BGP領域"]
            BGP_R["BGPルーター"]
        end
    end

    OSPF_R -->|"OSPF経路"| ASBR
    ASBR -->|"再配布"| BGP_R
    BGP_R -->|"BGP経路"| ASBR
    ASBR -->|"再配布"| OSPF_R

    style OSPF_R fill:#e3f2fd
    style ASBR fill:#ffcdd2
    style BGP_R fill:#c8e6c9
```

**再配布時の注意点:**
- ルーティングループの可能性
- メトリックの変換が必要
- フィルタリングの検討

---

## OSPF vs BGP 比較表

| 項目 | OSPF | BGP |
|:---|:---|:---|
| 種別 | IGP | EGP |
| アルゴリズム | SPF（ダイクストラ） | パスベクトル |
| メトリック | コスト | パス属性 |
| 収束速度 | 高速 | 比較的遅い |
| スケーラビリティ | 中規模 | 大規模 |
| 使用場面 | 企業ネットワーク内 | ISP間、大規模ネットワーク |
| プロトコル | IP（プロトコル番号89） | TCP（ポート179） |

---

## 試験対策のポイント

```mermaid
mindmap
  root((ルーティング<br/>の要点))
    OSPF
      状態遷移
        Down→Full
      DR/BDR選出
        プライオリティ
        ルーターID
      エリア設計
        バックボーン
        スタブエリア
      LSAタイプ
        1〜5, 7
    BGP
      eBGP/iBGP
      パス属性
        AS_PATH
        LOCAL_PREF
        MED
      経路選択
        8つの基準
      スケーリング
        ルートリフレクタ
    共通
      BFD
      経路再配布
```

1. **OSPFの状態遷移を理解する**
   - Down → Init → 2-Way → ExStart → Exchange → Loading → Full
   - 2-WayでDR/BDR選出が行われる

2. **LSAタイプを把握する**
   - タイプ1, 2: エリア内
   - タイプ3, 4: エリア間（ABR生成）
   - タイプ5: AS外部（ASBR生成）

3. **BGP経路選択の優先順位**
   - LOCAL_PREF（大） → AS_PATH（短） → MED（小）
   - 覚え方: 「ローカルで短いパスが低コスト」

4. **iBGPのスケーリング**
   - フルメッシュの問題点
   - ルートリフレクタによる解決

5. **BFDの効果**
   - 障害検知を秒単位からミリ秒単位へ高速化
