---
title: Zenn記法テスト
---

# Zenn記法のテスト

このページでは、Zenn風のカスタムディレクティブをテストします。

## Message（情報ボックス）

:::message
これは情報メッセージです。重要な情報やTipsを表示する際に使用します。

複数行のテキストも表示できます。
:::

通常のテキストもここに書けます。

## Message Alert（警告ボックス）

:::message alert
これは警告メッセージです。注意が必要な情報や、避けるべき行動などを表示する際に使用します。

ユーザーの注意を引くために赤色で表示されます。
:::

## Details（折りたたみ）

:::details クリックして詳細を表示
これは折りたたみ可能なセクションです。

デフォルトでは非表示になっており、タイトルをクリックすると内容が表示されます。

長い説明や、補足情報、技術的な詳細などを格納するのに便利です。
:::

## 複雑な使用例

:::message
**TCP/IPの階層モデル**について学習する際は、以下の点に注意してください：

- 各層の役割を理解すること
- データの [[カプセル化]] プロセスを把握すること
- プロトコルの動作を理解すること
:::

:::details OSI参照モデルとTCP/IPモデルの比較

| OSI参照モデル | TCP/IPモデル |
|--------------|-------------|
| アプリケーション層 | アプリケーション層 |
| プレゼンテーション層 | ↑ |
| セッション層 | ↑ |
| トランスポート層 | トランスポート層 |
| ネットワーク層 | インターネット層 |
| データリンク層 | ネットワークインターフェース層 |
| 物理層 | ↑ |

:::

:::message alert
**セキュリティの注意点**

パスワードは必ず暗号化して保存してください。平文での保存は絶対に避けましょう。
:::

## コードブロックとの組み合わせ

:::message
以下のコードは、TypeScriptでの型定義の例です：

```typescript
interface NetworkInterface {
  name: string;
  ipAddress: string;
  macAddress: string;
}
```
:::

:::details Pythonでのソケット通信の例

```python
import socket

# サーバーの作成
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.bind(('localhost', 8080))
server_socket.listen(5)

print("サーバーが起動しました")

while True:
    client_socket, address = server_socket.accept()
    print(f"接続: {address}")
    client_socket.close()
```

このコードは基本的なTCPサーバーの実装例です。
:::
