---
title: SDN・NFVとネットワーク仮想化
---
import { MermaidBox } from '../../../components/MermaidBox';


ネットワークの仮想化・ソフトウェア化は現代のネットワーク設計に欠かせない技術です。この記事では、SDN、NFV、SD-WANの概念と仕組みを整理します。

## ネットワーク仮想化の全体像


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph virtualization["ネットワーク仮想化技術"]
        SDN["SDN<br/>ソフトウェア定義<br/>ネットワーク"]
        NFV["NFV<br/>ネットワーク機能<br/>仮想化"]
        SDWAN["SD-WAN<br/>ソフトウェア定義<br/>WAN"]
    end

    SDN --> USE1["制御と転送の分離<br/>集中管理"]
    NFV --> USE2["専用機器の<br/>汎用サーバー化"]
    SDWAN --> USE3["WANの<br/>最適化・自動化"]

    style SDN fill:#e3f2fd
    style NFV fill:#c8e6c9
    style SDWAN fill:#fff3e0
```

</MermaidBox>


---

## SDN（Software-Defined Networking）

### 従来のネットワーク vs SDN


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph traditional["従来のネットワーク"]
        subgraph device1["ネットワーク機器"]
            CP1["コントロール<br/>プレーン"]
            DP1["データ<br/>プレーン"]
        end
        subgraph device2["ネットワーク機器"]
            CP2["コントロール<br/>プレーン"]
            DP2["データ<br/>プレーン"]
        end
    end

    subgraph sdn["SDN"]
        CONTROLLER["SDNコントローラー<br/>（集中制御）"]

        subgraph switch1["スイッチ"]
            DP3["データ<br/>プレーン"]
        end
        subgraph switch2["スイッチ"]
            DP4["データ<br/>プレーン"]
        end

        CONTROLLER -->|"制御"| DP3
        CONTROLLER -->|"制御"| DP4
    end

    style CP1 fill:#ffcdd2
    style CP2 fill:#ffcdd2
    style DP1 fill:#c8e6c9
    style DP2 fill:#c8e6c9
    style CONTROLLER fill:#e3f2fd
    style DP3 fill:#c8e6c9
    style DP4 fill:#c8e6c9
```

</MermaidBox>


| 項目 | 従来 | SDN |
|:---|:---|:---|
| 制御 | 各機器が個別に判断 | コントローラーが集中制御 |
| 設定変更 | 機器ごとに個別設定 | コントローラーから一括 |
| 柔軟性 | 低い | 高い |
| 運用コスト | 高い | 低い |

### SDNの3層アーキテクチャ


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph sdn_arch["SDNアーキテクチャ"]
        subgraph app_layer["アプリケーション層"]
            APP1["ネットワーク<br/>監視アプリ"]
            APP2["トラフィック<br/>制御アプリ"]
            APP3["セキュリティ<br/>アプリ"]
        end

        subgraph control_layer["コントロール層"]
            CONTROLLER["SDNコントローラー"]
            NBI["ノースバウンドAPI<br/>（REST API等）"]
            SBI["サウスバウンドAPI<br/>（OpenFlow等）"]
        end

        subgraph infra_layer["インフラ層"]
            SW1["スイッチ"]
            SW2["スイッチ"]
            SW3["スイッチ"]
        end
    end

    APP1 --> NBI
    APP2 --> NBI
    APP3 --> NBI
    NBI --> CONTROLLER
    CONTROLLER --> SBI
    SBI --> SW1
    SBI --> SW2
    SBI --> SW3

    style APP1 fill:#e3f2fd
    style APP2 fill:#e3f2fd
    style APP3 fill:#e3f2fd
    style CONTROLLER fill:#fff3e0
    style SW1 fill:#c8e6c9
    style SW2 fill:#c8e6c9
    style SW3 fill:#c8e6c9
```

</MermaidBox>


| 層 | 役割 | 例 |
|:---|:---|:---|
| アプリケーション層 | ネットワーク機能の実装 | 監視、QoS、セキュリティ |
| コントロール層 | ネットワーク全体の制御 | SDNコントローラー |
| インフラ層 | パケット転送 | OpenFlowスイッチ |

### API


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph apis["SDNのAPI"]
        subgraph northbound["ノースバウンドAPI"]
            NB1["REST API"]
            NB2["Python SDK"]
        end

        CONTROLLER["SDNコントローラー"]

        subgraph southbound["サウスバウンドAPI"]
            SB1["OpenFlow"]
            SB2["NETCONF"]
            SB3["gRPC"]
        end
    end

    northbound --> CONTROLLER
    CONTROLLER --> southbound

    style NB1 fill:#e3f2fd
    style NB2 fill:#e3f2fd
    style CONTROLLER fill:#fff3e0
    style SB1 fill:#c8e6c9
    style SB2 fill:#c8e6c9
    style SB3 fill:#c8e6c9
```

</MermaidBox>


---

## OpenFlow

SDNを実現するための代表的なプロトコルです。

### OpenFlowの構成要素


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph openflow["OpenFlowの構成"]
        CONTROLLER["OpenFlow<br/>コントローラー"]

        subgraph switch["OpenFlowスイッチ"]
            FLOW_TABLE["フローテーブル"]
            GROUP_TABLE["グループテーブル"]
            METER_TABLE["メーターテーブル"]
        end

        SECURE["セキュア<br/>チャネル<br/>（TLS）"]
    end

    CONTROLLER <-->|"OpenFlowプロトコル"| SECURE
    SECURE <--> FLOW_TABLE

    style CONTROLLER fill:#e3f2fd
    style FLOW_TABLE fill:#c8e6c9
    style GROUP_TABLE fill:#fff3e0
    style METER_TABLE fill:#f3e5f5
```

</MermaidBox>


### フローテーブル


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph flow_entry["フローエントリの構成"]
        MATCH["マッチフィールド<br/>条件（宛先IP等）"]
        PRIORITY["優先度"]
        COUNTER["カウンター"]
        INSTRUCTION["インストラクション<br/>（アクション）"]
        TIMEOUT["タイムアウト"]
        COOKIE["Cookie"]
    end

    MATCH --> FLOW["フローエントリ"]
    PRIORITY --> FLOW
    COUNTER --> FLOW
    INSTRUCTION --> FLOW
    TIMEOUT --> FLOW
    COOKIE --> FLOW

    style MATCH fill:#ffcdd2
    style INSTRUCTION fill:#c8e6c9
```

</MermaidBox>


### パケット処理の流れ


<MermaidBox client:visible>

```mermaid
sequenceDiagram
    participant Packet as パケット
    participant Switch as OFスイッチ
    participant Controller as OFコントローラー

    Packet->>Switch: パケット到着

    alt フローエントリに一致
        Switch->>Switch: アクション実行<br/>（転送/破棄等）
    else 一致なし（テーブルミス）
        Switch->>Controller: Packet-In<br/>（パケット転送）
        Controller->>Controller: 処理を決定
        Controller->>Switch: Flow-Mod<br/>（フロー追加）
        Controller->>Switch: Packet-Out<br/>（パケット転送指示）
        Switch->>Switch: アクション実行
    end
```

</MermaidBox>


### OpenFlowメッセージ


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph messages["OpenFlowメッセージタイプ"]
        subgraph controller_to_switch["コントローラー→スイッチ"]
            FLOW_MOD["Flow-Mod<br/>フロー追加/削除"]
            PACKET_OUT["Packet-Out<br/>パケット送出指示"]
            BARRIER["Barrier<br/>同期"]
        end

        subgraph switch_to_controller["スイッチ→コントローラー"]
            PACKET_IN["Packet-In<br/>パケット通知"]
            FLOW_REMOVED["Flow-Removed<br/>フロー削除通知"]
            PORT_STATUS["Port-Status<br/>ポート状態変化"]
        end

        subgraph symmetric["対称（双方向）"]
            HELLO["Hello<br/>接続開始"]
            ECHO["Echo<br/>死活監視"]
        end
    end

    style FLOW_MOD fill:#e3f2fd
    style PACKET_OUT fill:#e3f2fd
    style PACKET_IN fill:#c8e6c9
    style FLOW_REMOVED fill:#c8e6c9
    style HELLO fill:#fff3e0
    style ECHO fill:#fff3e0
```

</MermaidBox>


---

## NFV（Network Functions Virtualization）

### NFVの概念


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph comparison["従来 vs NFV"]
        subgraph traditional["従来"]
            HW1["専用FW"]
            HW2["専用LB"]
            HW3["専用ルーター"]
        end

        subgraph nfv["NFV"]
            subgraph server["汎用サーバー"]
                VM1["仮想FW"]
                VM2["仮想LB"]
                VM3["仮想ルーター"]
            end
        end
    end

    style HW1 fill:#ffcdd2
    style HW2 fill:#ffcdd2
    style HW3 fill:#ffcdd2
    style VM1 fill:#c8e6c9
    style VM2 fill:#c8e6c9
    style VM3 fill:#c8e6c9
```

</MermaidBox>


| 項目 | 従来（専用機器） | NFV |
|:---|:---|:---|
| ハードウェア | ベンダー専用 | 汎用サーバー |
| 導入コスト | 高い | 低い |
| スケーリング | 機器追加が必要 | VM追加で対応 |
| 導入期間 | 長い | 短い |
| 柔軟性 | 低い | 高い |

### NFVアーキテクチャ


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph nfv_arch["NFVアーキテクチャ（ETSI）"]
        subgraph vnf_layer["VNF（仮想ネットワーク機能）"]
            VNF1["vFW"]
            VNF2["vLB"]
            VNF3["vRouter"]
        end

        subgraph nfvi["NFVI（NFVインフラ）"]
            subgraph virtual["仮想化層"]
                HYPERVISOR["ハイパーバイザー"]
            end
            subgraph physical["物理層"]
                COMPUTE["コンピュート"]
                STORAGE["ストレージ"]
                NETWORK["ネットワーク"]
            end
        end

        MANO["NFV MANO<br/>（管理・オーケストレーション）"]
    end

    VNF1 --> HYPERVISOR
    VNF2 --> HYPERVISOR
    VNF3 --> HYPERVISOR
    HYPERVISOR --> COMPUTE
    HYPERVISOR --> STORAGE
    HYPERVISOR --> NETWORK
    MANO --> vnf_layer
    MANO --> nfvi

    style VNF1 fill:#e3f2fd
    style VNF2 fill:#e3f2fd
    style VNF3 fill:#e3f2fd
    style HYPERVISOR fill:#fff3e0
    style MANO fill:#ffcdd2
```

</MermaidBox>


### NFV MANOの構成


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph mano["NFV MANO"]
        NFVO["NFVO<br/>（オーケストレーター）"]
        VNFM["VNFM<br/>（VNFマネージャー）"]
        VIM["VIM<br/>（仮想化基盤マネージャー）"]
    end

    NFVO -->|"VNFの配置<br/>サービス構成"| VNFM
    VNFM -->|"VNFの<br/>ライフサイクル管理"| VIM
    VIM -->|"仮想リソースの<br/>割り当て"| NFVI["NFVI"]

    style NFVO fill:#ffcdd2
    style VNFM fill:#fff3e0
    style VIM fill:#c8e6c9
```

</MermaidBox>


| コンポーネント | 役割 |
|:---|:---|
| NFVO | ネットワークサービスのオーケストレーション |
| VNFM | VNFのライフサイクル管理（起動、停止、スケール） |
| VIM | 仮想化基盤のリソース管理 |

---

## SDN と NFV の関係


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph relationship["SDNとNFVの関係"]
        subgraph sdn_area["SDN"]
            SDN_CTRL["集中制御"]
            SDN_PROG["プログラマブル"]
        end

        subgraph nfv_area["NFV"]
            NFV_VIRT["機能の仮想化"]
            NFV_HW["汎用ハードウェア"]
        end

        SYNERGY["相乗効果"]
    end

    SDN_CTRL --> SYNERGY
    SDN_PROG --> SYNERGY
    NFV_VIRT --> SYNERGY
    NFV_HW --> SYNERGY
    SYNERGY --> RESULT["柔軟で効率的な<br/>ネットワーク"]

    style SDN_CTRL fill:#e3f2fd
    style SDN_PROG fill:#e3f2fd
    style NFV_VIRT fill:#c8e6c9
    style NFV_HW fill:#c8e6c9
    style SYNERGY fill:#fff3e0
```

</MermaidBox>


| 観点 | SDN | NFV |
|:---|:---|:---|
| 対象 | ネットワーク制御 | ネットワーク機能 |
| アプローチ | 制御と転送の分離 | 専用機器の仮想化 |
| 標準化団体 | ONF | ETSI |
| 関係 | 補完的（組み合わせ可能） | 補完的（組み合わせ可能） |

---

## SD-WAN（Software-Defined WAN）

### SD-WANの概要


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph sdwan["SD-WANの構成"]
        subgraph central["中央管理"]
            ORCH["オーケストレーター"]
            CTRL["コントローラー"]
        end

        subgraph edges["エッジデバイス"]
            EDGE1["拠点A<br/>SD-WANエッジ"]
            EDGE2["拠点B<br/>SD-WANエッジ"]
            EDGE3["拠点C<br/>SD-WANエッジ"]
        end

        subgraph wan["WAN回線"]
            MPLS["MPLS"]
            INET["インターネット"]
            LTE["LTE/5G"]
        end
    end

    ORCH --> CTRL
    CTRL --> EDGE1
    CTRL --> EDGE2
    CTRL --> EDGE3
    EDGE1 --> MPLS
    EDGE1 --> INET
    EDGE2 --> MPLS
    EDGE2 --> INET
    EDGE3 --> INET
    EDGE3 --> LTE

    style ORCH fill:#ffcdd2
    style CTRL fill:#fff3e0
    style EDGE1 fill:#c8e6c9
    style EDGE2 fill:#c8e6c9
    style EDGE3 fill:#c8e6c9
```

</MermaidBox>


### SD-WANの主要機能


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph features["SD-WANの機能"]
        AUTO["自動回線選択<br/>アプリケーション別"]
        QOS["QoS制御<br/>帯域制御"]
        VPN["暗号化VPN<br/>自動構築"]
        MONITOR["可視化・監視<br/>集中管理"]
        LBO["ローカル<br/>ブレイクアウト"]
        ZTP["ゼロタッチ<br/>プロビジョニング"]
    end

    style AUTO fill:#e3f2fd
    style QOS fill:#e3f2fd
    style VPN fill:#c8e6c9
    style MONITOR fill:#c8e6c9
    style LBO fill:#fff3e0
    style ZTP fill:#fff3e0
```

</MermaidBox>


### ローカルブレイクアウト


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph lbo["ローカルブレイクアウト"]
        subgraph branch["拠点"]
            EDGE["SD-WAN<br/>エッジ"]
        end

        DC["データセンター"]
        CLOUD["クラウド<br/>（SaaS）"]
    end

    EDGE -->|"社内システム<br/>MPLS経由"| DC
    EDGE -->|"クラウド向け<br/>直接インターネット"| CLOUD

    NOTE["アプリケーションを識別し<br/>最適な経路を自動選択"]

    style EDGE fill:#c8e6c9
    style DC fill:#e3f2fd
    style CLOUD fill:#fff3e0
    style NOTE fill:#f3e5f5
```

</MermaidBox>


**メリット:**
- データセンターの回線負荷軽減
- クラウドサービスへの遅延低減
- コスト削減

### 従来のWAN vs SD-WAN


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph comparison["従来WAN vs SD-WAN"]
        subgraph traditional["従来のWAN"]
            T1["高価なMPLS依存"]
            T2["手動設定"]
            T3["変更に時間"]
            T4["回線固定"]
        end

        subgraph sdwan_adv["SD-WAN"]
            S1["複数回線を併用"]
            S2["集中管理・自動化"]
            S3["迅速な変更"]
            S4["動的な回線選択"]
        end
    end

    style T1 fill:#ffcdd2
    style T2 fill:#ffcdd2
    style T3 fill:#ffcdd2
    style T4 fill:#ffcdd2
    style S1 fill:#c8e6c9
    style S2 fill:#c8e6c9
    style S3 fill:#c8e6c9
    style S4 fill:#c8e6c9
```

</MermaidBox>


| 項目 | 従来WAN | SD-WAN |
|:---|:---|:---|
| 回線 | MPLS主体 | MPLS + インターネット + LTE |
| コスト | 高い | 削減可能 |
| 設定 | 機器ごと手動 | 集中管理・自動化 |
| 可視性 | 限定的 | アプリケーションレベル |
| 冗長性 | 回線ごとに設計 | 自動フェイルオーバー |

---

## VXLAN（Virtual Extensible LAN）

### VXLANの概要


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph vxlan["VXLANの構成"]
        subgraph underlay["アンダーレイ（物理）"]
            VTEP1["VTEP"]
            VTEP2["VTEP"]
            L3["L3ネットワーク"]
        end

        subgraph overlay["オーバーレイ（論理）"]
            VNI1["VNI: 10001"]
            VNI2["VNI: 10002"]
        end

        VM1["VM1"]
        VM2["VM2"]
        VM3["VM3"]
        VM4["VM4"]
    end

    VM1 --> VTEP1
    VM2 --> VTEP1
    VM3 --> VTEP2
    VM4 --> VTEP2
    VTEP1 <-->|"UDPカプセル化"| L3
    L3 <--> VTEP2
    VM1 -.->|"VNI: 10001"| VM3
    VM2 -.->|"VNI: 10002"| VM4

    style VTEP1 fill:#c8e6c9
    style VTEP2 fill:#c8e6c9
    style VNI1 fill:#e3f2fd
    style VNI2 fill:#fff3e0
```

</MermaidBox>


### VXLANヘッダ構造


<MermaidBox client:visible>

```mermaid
graph TB
    subgraph vxlan_packet["VXLANパケット構造"]
        OUTER_ETH["外部Ethernetヘッダ"]
        OUTER_IP["外部IPヘッダ"]
        OUTER_UDP["外部UDPヘッダ<br/>宛先ポート: 4789"]
        VXLAN_HDR["VXLANヘッダ<br/>VNI（24bit）"]
        INNER_ETH["内部Ethernetヘッダ"]
        INNER_IP["内部IPヘッダ"]
        PAYLOAD["ペイロード"]
    end

    OUTER_ETH --> OUTER_IP
    OUTER_IP --> OUTER_UDP
    OUTER_UDP --> VXLAN_HDR
    VXLAN_HDR --> INNER_ETH
    INNER_ETH --> INNER_IP
    INNER_IP --> PAYLOAD

    style OUTER_ETH fill:#f3e5f5
    style OUTER_IP fill:#f3e5f5
    style OUTER_UDP fill:#f3e5f5
    style VXLAN_HDR fill:#ffcdd2
    style INNER_ETH fill:#c8e6c9
    style INNER_IP fill:#c8e6c9
```

</MermaidBox>


| 特徴 | 説明 |
|:---|:---|
| VNI | 24ビット（約1600万のネットワーク識別子） |
| カプセル化 | UDP（ポート4789） |
| VTEP | VXLANトンネルエンドポイント |
| 用途 | データセンター内L2延伸、マルチテナント |

---

## 技術比較表

| 技術 | 目的 | 標準化 | 主な用途 |
|:---|:---|:---|:---|
| SDN | ネットワーク制御の集中化 | ONF | データセンター、キャンパス |
| OpenFlow | SDNプロトコル | ONF | SDN実装 |
| NFV | 機能の仮想化 | ETSI | 通信事業者、企業 |
| SD-WAN | WAN最適化 | - | 企業WAN |
| VXLAN | L2オーバーレイ | RFC 7348 | データセンター |

---

## 試験対策のポイント


<MermaidBox client:visible>

```mermaid
mindmap
  root((SDN/NFV<br/>の要点))
    SDN
      コントロール/データ<br/>プレーン分離
      集中管理
      OpenFlow
        フローテーブル
        Packet-In/Out
      ノースバウンド/<br/>サウスバウンドAPI
    NFV
      専用機器→汎用サーバー
      VNF
      NFVI
      MANO
        NFVO
        VNFM
        VIM
    SD-WAN
      複数回線の活用
      ローカルブレイクアウト
      ゼロタッチ<br/>プロビジョニング
      アプリ識別
    VXLAN
      24bit VNI
      UDPカプセル化
      VTEP
```

</MermaidBox>


1. **SDNの3層を理解する**
   - アプリケーション層、コントロール層、インフラ層
   - ノースバウンド/サウスバウンドAPI

2. **OpenFlowの動作を把握する**
   - フローテーブルによるパケット処理
   - Packet-In/Packet-Out/Flow-Modメッセージ

3. **NFVの構成要素を覚える**
   - VNF: 仮想化されたネットワーク機能
   - NFVI: NFVインフラ
   - MANO: 管理・オーケストレーション

4. **SD-WANの特徴**
   - ローカルブレイクアウトの概念
   - 複数回線の動的選択
   - ゼロタッチプロビジョニング

5. **VXLANの仕組み**
   - 24ビットVNI（VLAN 12ビットの制限を解消）
   - UDPカプセル化（ポート4789）