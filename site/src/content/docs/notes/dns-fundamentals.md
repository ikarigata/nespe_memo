---
title: DNSの仕組みと設計
---

DNS（Domain Name System）は、ドメイン名とIPアドレスを相互に変換する分散データベースシステムです。この記事では、DNSの動作原理から設計・セキュリティまでを整理します。

## DNSの役割

```mermaid
graph TB
    subgraph dns_role["DNSの役割"]
        USER["ユーザー"]
        BROWSER["www.example.com<br/>にアクセスしたい"]
        DNS["DNSサーバー"]
        IP["93.184.216.34"]
        WEB["Webサーバー"]
    end

    USER --> BROWSER
    BROWSER -->|"名前解決要求"| DNS
    DNS -->|"IPアドレス応答"| BROWSER
    BROWSER -->|"HTTP通信"| WEB

    style USER fill:#e3f2fd
    style DNS fill:#c8e6c9
    style WEB fill:#fff3e0
```

---

## DNSの階層構造

```mermaid
graph TB
    ROOT["ルートDNS<br/>（.）"]

    subgraph tld["TLD（トップレベルドメイン）"]
        COM[".com"]
        JP[".jp"]
        ORG[".org"]
    end

    subgraph sld["SLD（セカンドレベル）"]
        EXAMPLE["example.com"]
        COJP["co.jp"]
    end

    subgraph host["ホスト名"]
        WWW["www.example.com"]
        MAIL["mail.example.com"]
    end

    ROOT --> COM
    ROOT --> JP
    ROOT --> ORG
    COM --> EXAMPLE
    JP --> COJP
    EXAMPLE --> WWW
    EXAMPLE --> MAIL

    style ROOT fill:#ffcdd2
    style COM fill:#fff3e0
    style JP fill:#fff3e0
    style ORG fill:#fff3e0
    style EXAMPLE fill:#c8e6c9
    style WWW fill:#e3f2fd
    style MAIL fill:#e3f2fd
```

| レベル | 説明 | 例 |
|:---|:---|:---|
| ルート | 最上位、「.」で表記 | . |
| TLD | トップレベルドメイン | .com, .jp, .org |
| SLD | セカンドレベルドメイン | example.com |
| ホスト名 | 個別のホスト | www.example.com |

---

## DNSサーバーの種類

```mermaid
graph TB
    subgraph dns_types["DNSサーバーの種類"]
        subgraph auth["権威DNSサーバー"]
            PRIMARY["プライマリ<br/>（マスター）"]
            SECONDARY["セカンダリ<br/>（スレーブ）"]
        end

        subgraph cache["キャッシュDNSサーバー"]
            RESOLVER["フルリゾルバ<br/>（再帰問い合わせ）"]
            FORWARDER["フォワーダ<br/>（転送のみ）"]
        end
    end

    PRIMARY -->|"ゾーン転送"| SECONDARY
    RESOLVER -->|"問い合わせ"| PRIMARY
    RESOLVER -->|"問い合わせ"| SECONDARY

    style PRIMARY fill:#ffcdd2
    style SECONDARY fill:#fff3e0
    style RESOLVER fill:#c8e6c9
    style FORWARDER fill:#e3f2fd
```

| 種類 | 役割 | 特徴 |
|:---|:---|:---|
| プライマリ | ゾーン情報の原本を保持 | ゾーンファイルを直接管理 |
| セカンダリ | プライマリのコピーを保持 | ゾーン転送で同期 |
| フルリゾルバ | 再帰問い合わせを処理 | キャッシュ機能あり |
| フォワーダ | 他のDNSへ転送 | 自身では解決しない |

---

## 名前解決の流れ

### 再帰クエリと反復クエリ

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Cache as キャッシュDNS
    participant Root as ルートDNS
    participant TLD as TLD DNS
    participant Auth as 権威DNS

    Note over Client,Auth: 再帰クエリ（クライアント→キャッシュDNS）
    Client->>Cache: www.example.comは?

    Note over Cache,Auth: 反復クエリ（キャッシュDNS→各サーバー）
    Cache->>Root: www.example.comは?
    Root-->>Cache: .comはこのサーバー

    Cache->>TLD: www.example.comは?
    TLD-->>Cache: example.comはこのサーバー

    Cache->>Auth: www.example.comは?
    Auth-->>Cache: 93.184.216.34

    Note over Client,Auth: 結果をキャッシュして応答
    Cache-->>Client: 93.184.216.34
```

```mermaid
graph TB
    subgraph query_types["クエリの種類"]
        subgraph recursive["再帰クエリ"]
            R1["クライアントが送信"]
            R2["完全な回答を要求"]
            R3["キャッシュDNSが<br/>代わりに解決"]
        end

        subgraph iterative["反復クエリ"]
            I1["キャッシュDNSが送信"]
            I2["参照先を返してもよい"]
            I3["次の問い合わせ先を<br/>段階的に辿る"]
        end
    end

    style R1 fill:#e3f2fd
    style R2 fill:#e3f2fd
    style R3 fill:#e3f2fd
    style I1 fill:#c8e6c9
    style I2 fill:#c8e6c9
    style I3 fill:#c8e6c9
```

---

## DNSレコードタイプ

```mermaid
graph TB
    subgraph records["主要なDNSレコード"]
        A["Aレコード<br/>IPv4アドレス"]
        AAAA["AAAAレコード<br/>IPv6アドレス"]
        CNAME["CNAMEレコード<br/>エイリアス"]
        MX["MXレコード<br/>メールサーバー"]
        NS["NSレコード<br/>ネームサーバー"]
        TXT["TXTレコード<br/>テキスト情報"]
        PTR["PTRレコード<br/>逆引き"]
        SOA["SOAレコード<br/>ゾーン管理情報"]
        SRV["SRVレコード<br/>サービス場所"]
    end

    style A fill:#ffcdd2
    style AAAA fill:#ffcdd2
    style CNAME fill:#c8e6c9
    style MX fill:#fff3e0
    style NS fill:#e3f2fd
    style TXT fill:#bbdefb
    style PTR fill:#f3e5f5
    style SOA fill:#fce4ec
    style SRV fill:#e8f5e9
```

| レコード | 用途 | 例 |
|:---|:---|:---|
| A | ホスト名→IPv4 | www IN A 192.168.1.1 |
| AAAA | ホスト名→IPv6 | www IN AAAA 2001:db8::1 |
| CNAME | 別名の定義 | blog IN CNAME www |
| MX | メールサーバー指定 | @ IN MX 10 mail.example.com |
| NS | ネームサーバー指定 | @ IN NS ns1.example.com |
| TXT | テキスト情報 | @ IN TXT "v=spf1 ..." |
| PTR | 逆引き（IP→名前） | 1 IN PTR www.example.com |
| SOA | ゾーンの管理情報 | シリアル番号、更新間隔など |
| SRV | サービスの場所 | _ldap._tcp IN SRV ... |

### MXレコードの優先度

```mermaid
graph TB
    subgraph mx["MXレコードの優先度"]
        SENDER["送信サーバー"]

        MX1["MXレコード<br/>優先度: 10<br/>mail1.example.com"]
        MX2["MXレコード<br/>優先度: 20<br/>mail2.example.com"]
        MX3["MXレコード<br/>優先度: 30<br/>mail3.example.com"]
    end

    SENDER -->|"1. 最優先"| MX1
    SENDER -.->|"2. 障害時"| MX2
    SENDER -.->|"3. 最後の手段"| MX3

    style SENDER fill:#e3f2fd
    style MX1 fill:#c8e6c9
    style MX2 fill:#fff3e0
    style MX3 fill:#ffcdd2
```

**ポイント:** 優先度の数値が小さいほど優先される

---

## ゾーン転送

### AXFR と IXFR

```mermaid
graph TB
    subgraph zone_transfer["ゾーン転送の種類"]
        subgraph axfr["AXFR（フル転送）"]
            A1["ゾーン全体を転送"]
            A2["初回同期に使用"]
            A3["データ量が大きい"]
        end

        subgraph ixfr["IXFR（差分転送）"]
            I1["変更分のみ転送"]
            I2["定期同期に使用"]
            I3["効率的"]
        end
    end

    PRIMARY["プライマリ"]
    SECONDARY["セカンダリ"]

    PRIMARY -->|"AXFR/IXFR"| SECONDARY

    style A1 fill:#ffcdd2
    style A2 fill:#ffcdd2
    style A3 fill:#ffcdd2
    style I1 fill:#c8e6c9
    style I2 fill:#c8e6c9
    style I3 fill:#c8e6c9
```

### ゾーン転送のトリガー

```mermaid
sequenceDiagram
    participant P as プライマリ
    participant S as セカンダリ

    Note over P,S: 方法1: NOTIFYによる通知
    P->>S: NOTIFY（変更通知）
    S->>P: SOAクエリ
    P-->>S: SOA応答
    S->>P: IXFR要求
    P-->>S: 差分データ

    Note over P,S: 方法2: リフレッシュ間隔
    Note over S: リフレッシュ時間経過
    S->>P: SOAクエリ
    P-->>S: SOA応答
    Note over S: シリアル番号を比較
    S->>P: IXFR要求
    P-->>S: 差分データ
```

### SOAレコードの構成

```mermaid
graph TB
    subgraph soa["SOAレコードの要素"]
        MNAME["MNAME<br/>プライマリサーバー名"]
        RNAME["RNAME<br/>管理者メールアドレス"]
        SERIAL["SERIAL<br/>シリアル番号"]
        REFRESH["REFRESH<br/>更新間隔"]
        RETRY["RETRY<br/>再試行間隔"]
        EXPIRE["EXPIRE<br/>有効期限"]
        MINIMUM["MINIMUM<br/>ネガティブキャッシュTTL"]
    end

    style SERIAL fill:#ffcdd2
    style REFRESH fill:#c8e6c9
    style RETRY fill:#c8e6c9
    style EXPIRE fill:#fff3e0
```

| フィールド | 説明 | 典型値 |
|:---|:---|:---|
| SERIAL | 変更を示す番号（増加させる） | YYYYMMDDnn |
| REFRESH | セカンダリの確認間隔 | 3600（1時間） |
| RETRY | 確認失敗時の再試行間隔 | 600（10分） |
| EXPIRE | プライマリ不達時の有効期限 | 604800（1週間） |
| MINIMUM | ネガティブキャッシュのTTL | 3600（1時間） |

---

## DNSキャッシュとTTL

```mermaid
graph TB
    subgraph ttl["TTL（Time To Live）の動作"]
        QUERY["クエリ"]
        CACHE["キャッシュDNS"]
        STORED["キャッシュに保存<br/>TTL: 3600秒"]
        EXPIRED["TTL期限切れ"]
        REQUERY["再問い合わせ"]
    end

    QUERY --> CACHE
    CACHE -->|"キャッシュなし"| AUTH["権威DNS"]
    AUTH --> STORED
    STORED -->|"3600秒経過"| EXPIRED
    EXPIRED --> REQUERY
    REQUERY --> AUTH

    style CACHE fill:#c8e6c9
    style STORED fill:#e3f2fd
    style EXPIRED fill:#ffcdd2
```

**TTL設計のポイント:**
- 長いTTL: キャッシュ効果大、変更反映が遅い
- 短いTTL: 変更反映が速い、問い合わせ負荷増大
- 切り替え前はTTLを短くしておく

---

## DNSセキュリティ

### キャッシュポイズニング

```mermaid
graph TB
    subgraph poisoning["キャッシュポイズニング攻撃"]
        CLIENT["クライアント"]
        CACHE["キャッシュDNS"]
        AUTH["正規の権威DNS"]
        ATTACKER["攻撃者"]
    end

    CLIENT -->|"1. クエリ"| CACHE
    CACHE -->|"2. 問い合わせ"| AUTH
    ATTACKER -->|"3. 偽の応答<br/>（先に到達）"| CACHE
    AUTH -.->|"4. 正規応答<br/>（後から到達）"| CACHE
    CACHE -->|"5. 偽のIPを返答"| CLIENT

    style CLIENT fill:#e3f2fd
    style CACHE fill:#ffcdd2
    style AUTH fill:#c8e6c9
    style ATTACKER fill:#ff8a80
```

### 対策

```mermaid
graph TB
    subgraph countermeasures["キャッシュポイズニング対策"]
        PORT["ソースポート<br/>ランダム化"]
        TXID["トランザクションID<br/>ランダム化"]
        DNSSEC["DNSSEC<br/>（電子署名）"]
        RATE["レートリミット"]
    end

    PORT --> EFFECT1["予測困難に"]
    TXID --> EFFECT1
    DNSSEC --> EFFECT2["応答の検証"]
    RATE --> EFFECT3["攻撃の抑制"]

    style PORT fill:#c8e6c9
    style TXID fill:#c8e6c9
    style DNSSEC fill:#e3f2fd
    style RATE fill:#fff3e0
```

### DNSSEC

```mermaid
graph TB
    subgraph dnssec["DNSSECの仕組み"]
        subgraph keys["鍵の種類"]
            ZSK["ZSK<br/>ゾーン署名鍵"]
            KSK["KSK<br/>鍵署名鍵"]
        end

        subgraph records["関連レコード"]
            DNSKEY["DNSKEYレコード<br/>公開鍵"]
            RRSIG["RRSIGレコード<br/>署名"]
            DS["DSレコード<br/>親への委任"]
            NSEC["NSEC/NSEC3<br/>不存在証明"]
        end
    end

    ZSK -->|"署名"| RRSIG
    KSK -->|"署名"| DNSKEY
    KSK -->|"ハッシュ"| DS

    style ZSK fill:#c8e6c9
    style KSK fill:#ffcdd2
    style RRSIG fill:#e3f2fd
    style DS fill:#fff3e0
```

| レコード | 役割 |
|:---|:---|
| DNSKEY | 公開鍵を格納 |
| RRSIG | レコードの電子署名 |
| DS | 親ゾーンへの委任情報（KSKのハッシュ） |
| NSEC/NSEC3 | レコードが存在しないことの証明 |

---

## DNS設計のベストプラクティス

### 冗長構成

```mermaid
graph TB
    subgraph redundancy["DNS冗長構成"]
        subgraph primary_site["プライマリサイト"]
            PRIMARY["プライマリDNS"]
        end

        subgraph secondary_site["セカンダリサイト"]
            SECONDARY1["セカンダリDNS 1"]
            SECONDARY2["セカンダリDNS 2"]
        end

        subgraph client_side["クライアント側"]
            RESOLVER["リゾルバ"]
        end
    end

    PRIMARY -->|"ゾーン転送"| SECONDARY1
    PRIMARY -->|"ゾーン転送"| SECONDARY2
    RESOLVER -->|"問い合わせ"| PRIMARY
    RESOLVER -.->|"フェイルオーバー"| SECONDARY1

    style PRIMARY fill:#ffcdd2
    style SECONDARY1 fill:#c8e6c9
    style SECONDARY2 fill:#c8e6c9
```

### 内部DNS/外部DNS分離

```mermaid
graph TB
    subgraph split["スプリットDNS構成"]
        subgraph external["外部ゾーン"]
            EXT_DNS["外部DNS"]
            EXT_REC["公開サーバーのみ<br/>www, mail"]
        end

        subgraph internal["内部ゾーン"]
            INT_DNS["内部DNS"]
            INT_REC["全サーバー<br/>www, mail, app, db"]
        end

        INTERNET["インターネット"]
        INTRANET["社内ネットワーク"]
    end

    INTERNET -->|"問い合わせ"| EXT_DNS
    INTRANET -->|"問い合わせ"| INT_DNS

    style EXT_DNS fill:#fff3e0
    style INT_DNS fill:#c8e6c9
    style EXT_REC fill:#fff3e0
    style INT_REC fill:#c8e6c9
```

**スプリットDNSのメリット:**
- 内部サーバー情報を外部に公開しない
- 内部では詳細な名前解決が可能
- セキュリティの向上

---

## DNSレコード設計例

```
; SOAレコード
example.com. IN SOA ns1.example.com. admin.example.com. (
    2024011801 ; シリアル番号
    3600       ; リフレッシュ（1時間）
    600        ; リトライ（10分）
    604800     ; 有効期限（1週間）
    3600       ; ネガティブキャッシュTTL
)

; NSレコード
example.com. IN NS ns1.example.com.
example.com. IN NS ns2.example.com.

; Aレコード
ns1     IN A     192.168.1.10
ns2     IN A     192.168.1.11
www     IN A     192.168.1.100
mail    IN A     192.168.1.50

; MXレコード
@       IN MX 10 mail.example.com.
@       IN MX 20 mail2.example.com.

; CNAMEレコード
blog    IN CNAME www

; TXTレコード（SPF）
@       IN TXT   "v=spf1 mx ip4:192.168.1.0/24 -all"
```

---

## 試験対策のポイント

```mermaid
mindmap
  root((DNS<br/>の要点))
    名前解決
      再帰クエリ
      反復クエリ
      キャッシュ
    レコード
      A/AAAA
      CNAME
      MX
      NS
      TXT
      PTR
      SOA
    ゾーン転送
      AXFR
      IXFR
      NOTIFY
      シリアル番号
    セキュリティ
      キャッシュポイズニング
      DNSSEC
      スプリットDNS
```

1. **クエリの種類を理解する**
   - 再帰クエリ: クライアント→キャッシュDNS
   - 反復クエリ: キャッシュDNS→各権威DNS

2. **レコードタイプを正確に覚える**
   - A: IPv4、AAAA: IPv6
   - MX: メール（優先度は小さいほど優先）
   - CNAME: 他のAレコードのエイリアス

3. **ゾーン転送の仕組み**
   - AXFR: 全体転送、IXFR: 差分転送
   - NOTIFYによるプッシュ通知

4. **セキュリティ対策**
   - DNSSECの仕組み（ZSK, KSK, RRSIG, DS）
   - キャッシュポイズニングの原理と対策

5. **設計パターン**
   - プライマリ/セカンダリの冗長構成
   - スプリットDNSによる内外分離
