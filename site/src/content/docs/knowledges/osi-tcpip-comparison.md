---
title: OSI参照モデルとTCP/IPモデルの違い
---

ネットワークの学習において、**OSI参照モデル**と**TCP/IPモデル**は最も基本的かつ重要な概念です。この記事では両モデルの構造、対応関係、そして実務での使い分けについて解説します。

## 全体像：2つのモデルの位置づけ

```mermaid
graph TB
    subgraph 理論モデル
        OSI[OSI参照モデル<br/>7層構造]
    end

    subgraph 実装モデル
        TCPIP[TCP/IPモデル<br/>4層構造]
    end

    OSI -->|理論的な指針| 標準化[プロトコル設計の<br/>標準化に貢献]
    TCPIP -->|実際に動作| インターネット[現在の<br/>インターネット]

    標準化 -.->|影響| インターネット

    style OSI fill:#e3f2fd
    style TCPIP fill:#e8f5e9
    style 標準化 fill:#fff3e0
    style インターネット fill:#fce4ec
```

- **OSI参照モデル**: ISO（国際標準化機構）が策定した理論的な参照モデル
- **TCP/IPモデル**: 実際のインターネットで使われている実装ベースのモデル

---

## OSI参照モデル（7層）

```mermaid
graph TB
    subgraph OSI参照モデル
        L7[第7層: アプリケーション層]
        L6[第6層: プレゼンテーション層]
        L5[第5層: セッション層]
        L4[第4層: トランスポート層]
        L3[第3層: ネットワーク層]
        L2[第2層: データリンク層]
        L1[第1層: 物理層]
    end

    L7 --> L6 --> L5 --> L4 --> L3 --> L2 --> L1

    style L7 fill:#e1f5fe
    style L6 fill:#e1f5fe
    style L5 fill:#e1f5fe
    style L4 fill:#fff3e0
    style L3 fill:#e8f5e9
    style L2 fill:#fce4ec
    style L1 fill:#f3e5f5
```

| 層 | 名称 | 役割 | 代表的なプロトコル/機器 |
|:---:|:---|:---|:---|
| 7 | アプリケーション層 | ユーザーに直接サービスを提供 | HTTP, FTP, SMTP, DNS |
| 6 | プレゼンテーション層 | データ形式の変換・暗号化 | JPEG, MPEG, SSL/TLS |
| 5 | セッション層 | 通信の開始・維持・終了の管理 | NetBIOS, RPC |
| 4 | トランスポート層 | エンドツーエンドの信頼性確保 | TCP, UDP |
| 3 | ネットワーク層 | 論理アドレスによる経路選択 | IP, ICMP, ARP |
| 2 | データリンク層 | 物理アドレスによる隣接ノード間通信 | Ethernet, PPP, スイッチ |
| 1 | 物理層 | ビット列の電気信号への変換 | ケーブル, ハブ, リピータ |

---

## TCP/IPモデル（4層）

```mermaid
graph TB
    subgraph TCP/IPモデル
        T4[アプリケーション層]
        T3[トランスポート層]
        T2[インターネット層]
        T1[ネットワークインターフェース層]
    end

    T4 --> T3 --> T2 --> T1

    style T4 fill:#e1f5fe
    style T3 fill:#fff3e0
    style T2 fill:#e8f5e9
    style T1 fill:#f3e5f5
```

| 層 | 名称 | 役割 | 代表的なプロトコル |
|:---:|:---|:---|:---|
| 4 | アプリケーション層 | アプリケーション間の通信 | HTTP, FTP, SMTP, DNS, SSH |
| 3 | トランスポート層 | ホスト間の通信制御 | TCP, UDP |
| 2 | インターネット層 | ネットワーク間のルーティング | IP, ICMP, ARP |
| 1 | ネットワークインターフェース層 | 物理的なデータ転送 | Ethernet, Wi-Fi |

---

## 両モデルの対応関係

```mermaid
graph TB
    subgraph app["アプリケーション層グループ"]
        direction TB
        O7["OSI 7層<br/>アプリケーション層"]
        O6["OSI 6層<br/>プレゼンテーション層"]
        O5["OSI 5層<br/>セッション層"]
        T4["TCP/IP<br/>アプリケーション層"]
    end

    subgraph trans["トランスポート層グループ"]
        direction TB
        O4["OSI 4層<br/>トランスポート層"]
        T3["TCP/IP<br/>トランスポート層"]
    end

    subgraph net["ネットワーク層グループ"]
        direction TB
        O3["OSI 3層<br/>ネットワーク層"]
        T2["TCP/IP<br/>インターネット層"]
    end

    subgraph phys["物理層グループ"]
        direction TB
        O2["OSI 2層<br/>データリンク層"]
        O1["OSI 1層<br/>物理層"]
        T1["TCP/IP<br/>ネットワークIF層"]
    end

    app --> trans --> net --> phys

    style O7 fill:#e1f5fe
    style O6 fill:#e1f5fe
    style O5 fill:#e1f5fe
    style T4 fill:#bbdefb
    style O4 fill:#fff3e0
    style T3 fill:#ffe0b2
    style O3 fill:#e8f5e9
    style T2 fill:#c8e6c9
    style O2 fill:#f3e5f5
    style O1 fill:#f3e5f5
    style T1 fill:#e1bee7
```

### 対応のポイント

1. **OSIの上位3層（5〜7層）→ TCP/IPのアプリケーション層**
   - TCP/IPでは機能ごとの細分化を行わず、1つの層にまとめている

2. **トランスポート層は1対1対応**
   - 両モデルで同じ役割・同じプロトコル（TCP/UDP）

3. **OSIのネットワーク層 → TCP/IPのインターネット層**
   - 名称は異なるが、IPによるルーティングという役割は同一

4. **OSIの下位2層（1〜2層）→ TCP/IPのネットワークインターフェース層**
   - TCP/IPでは物理的な実装詳細を1つの層として抽象化

---

## データのカプセル化

データが送信される際、各層でヘッダが付加されていきます。

```mermaid
graph TB
    subgraph 送信側
        direction TB
        D[データ]
        S1[セグメント<br/>TCPヘッダ + データ]
        P1[パケット<br/>IPヘッダ + セグメント]
        F1[フレーム<br/>Ethernetヘッダ + パケット + FCS]
        B1[ビット列<br/>電気信号に変換]
    end

    D -->|トランスポート層| S1
    S1 -->|インターネット層| P1
    P1 -->|ネットワークIF層| F1
    F1 -->|物理媒体| B1
```

```mermaid
graph TB
    subgraph frame["フレーム構造（上から順に付加）"]
        EH["Ethernetヘッダ<br/>（MACアドレス）"]
        IH["IPヘッダ<br/>（IPアドレス）"]
        TH["TCPヘッダ<br/>（ポート番号）"]
        DATA["データ<br/>（ペイロード）"]
        FCS["FCS<br/>（誤り検出）"]
    end

    EH --> IH --> TH --> DATA --> FCS

    style EH fill:#f3e5f5
    style IH fill:#e8f5e9
    style TH fill:#fff3e0
    style DATA fill:#e1f5fe
    style FCS fill:#f3e5f5
```

| PDU名 | 層 | 付加情報 |
|:---|:---|:---|
| データ | アプリケーション層 | - |
| セグメント | トランスポート層 | ポート番号、シーケンス番号など |
| パケット | インターネット層 | 送信元/宛先IPアドレスなど |
| フレーム | ネットワークIF層 | MACアドレス、FCS（誤り検出）など |

---

## 通信の流れ

Webページを閲覧する例で、両モデルでの通信の流れを見てみましょう。

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant DNS as DNSサーバー
    participant Web as Webサーバー

    Note over Client,Web: アプリケーション層
    Client->>DNS: DNSクエリ（example.comのIP?）
    DNS-->>Client: DNSレスポンス（93.184.216.34）

    Note over Client,Web: トランスポート層（TCP 3ウェイハンドシェイク）
    Client->>Web: SYN
    Web-->>Client: SYN+ACK
    Client->>Web: ACK

    Note over Client,Web: アプリケーション層（HTTP）
    Client->>Web: HTTP GET /index.html
    Web-->>Client: HTTP 200 OK + HTMLデータ

    Note over Client,Web: トランスポート層（コネクション終了）
    Client->>Web: FIN
    Web-->>Client: FIN+ACK
    Client->>Web: ACK
```

---

## 主な違いのまとめ

```mermaid
graph TB
    subgraph org["策定組織"]
        O1["OSI: ISO<br/>（国際標準化機構）"]
        T1["TCP/IP: DARPA→IETF"]
    end

    subgraph layers["層の数"]
        O2["OSI: 7層"]
        T2["TCP/IP: 4層"]
    end

    subgraph purpose["目的"]
        O3["OSI: 理論・教育<br/>標準化"]
        T3["TCP/IP: 実用<br/>実装"]
    end

    subgraph usage["実用性"]
        O4["OSI: 実装が少ない"]
        T4["TCP/IP: インターネット<br/>の基盤"]
    end

    org --> layers --> purpose --> usage

    style O1 fill:#e3f2fd
    style O2 fill:#e3f2fd
    style O3 fill:#e3f2fd
    style O4 fill:#e3f2fd
    style T1 fill:#e8f5e9
    style T2 fill:#e8f5e9
    style T3 fill:#e8f5e9
    style T4 fill:#e8f5e9
```

| 比較項目 | OSI参照モデル | TCP/IPモデル |
|:---|:---|:---|
| 策定組織 | ISO（国際標準化機構） | DARPA → IETF |
| 層の数 | 7層 | 4層 |
| 策定時期 | 1984年 | 1970年代 |
| 目的 | 理論的な参照モデル | 実際に動作する実装 |
| 現在の利用 | 教育・ベンダー間の共通言語 | インターネットの実装基盤 |
| 層間の独立性 | 厳密に分離 | 実装を優先し柔軟 |

---

## 試験対策のポイント

1. **各層の名称と番号を正確に覚える**
   - 特にOSI参照モデルの7層は頻出

2. **代表的なプロトコルと対応する層を把握する**
   - HTTP/DNS → アプリケーション層
   - TCP/UDP → トランスポート層
   - IP/ICMP → ネットワーク層（インターネット層）
   - Ethernet → データリンク層

3. **PDU（Protocol Data Unit）の名称を覚える**
   - セグメント、パケット、フレームの違い

4. **両モデルの対応関係を理解する**
   - OSIの上位3層がTCP/IPの1層に対応することがポイント

```mermaid
mindmap
  root((試験の<br/>頻出ポイント))
    OSI 7層
      各層の名称
      各層の役割
      対応するプロトコル
    TCP/IP 4層
      実装ベース
      現在のインターネット
    対応関係
      上位3層→1層
      下位2層→1層
    PDU
      セグメント
      パケット
      フレーム
```
