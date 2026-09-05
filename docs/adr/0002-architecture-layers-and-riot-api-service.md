# [ADR-0002] アーキテクチャレイヤリングと外部API Service層の責務設計

- **ステータス**: Accepted
- **決定日**: 2026-09-05
- **決定者**: 開発者

## コンテキスト（背景・課題）
Riot Games API への接続テストが成功し、以下の仕様が確認された：
1. サモナー特定には `Account-V1`（Riot IDからPUUID取得）が必要
2. サモナー詳細（レベル・アイコン）には `Summoner-V4` が必要
3. 戦績取得には `Match-V5`（試合IDリスト取得 ➔ 各試合詳細取得）が必要

これらの複雑なREST API呼び出しを GraphQL の各レイヤー（Controller, Query, Mutation, Type, Model）のどこに配置し、どのように責務を分離すべきかというアーキテクチャ設計を明確にする必要がある。

## 検討した選択肢

### 1. 外部API呼び出しの配置場所
- **選択肢A (Query / Resolver 内にベタ書き)**:
  - クエリ実行時に直接 Faraday 等で Riot API を呼び出す。
  - *問題点*: テストが書きにくく、GraphQLスキーマ層と外部HTTP通信が密結合し、コードが肥大化する。
- **選択肢B (Model (ActiveRecord) 内に書く)**:
  - `Summoner` モデルのメソッドとして外部API呼び出しを実装する。
  - *問題点*: 外部APIレスポンスの一時的な参照（まだDBに保存していないデータ）と永続化データの境界が曖昧になる。
- **選択肢C (Service層 `app/services/` にカプセル化する)** 【採用】:
  - `RiotApiClient` という純粋な Ruby クラス（Service）を設け、HTTP通信・リージョン解決・エラーハンドリングを一手に引き受ける。
  - Query や Resolver は Service から構造化されたデータ（Hash / Struct / Model）を受け取るだけにする。

### 2. データ表現とGraphQL Typeへの受け渡し
- **選択肢A (純粋なPORO/HashをTypeに渡す)**:
  - DB保存なしで、Serviceが返したHashやStructを直接 GraphQL Type に渡して描画する。
- **選択肢B (BFFキャッシュとしてActiveRecordに保存してTypeに渡す)**:
  - 外部APIから取得したデータをローカルDB（SQLite）にUpsert（保存・更新）し、ActiveRecordオブジェクトを Type に渡す。
- **ハイブリッド方針** 【採用】:
  - まずは Service層が取得したデータを即座に GraphQL Type でシリアライズして返せる設計（PORO/Struct対応）とし、次のステップでローカルDBへのキャッシュ・メモ機能を追加する。

## 決定事項 (Decision)

以下のレイヤリングルールをプロジェクト標準とする：

```text
[HTTP Request]
       │
       ▼
① Controller (GraphqlController)
   - HTTP/Header 境界。スキーマの execute を呼ぶだけ。
       │
       ▼
② Query / Resolver (QueryType, Resolvers)
   - 引数のバリデーション、認可チェック、Service層の呼び出し。
       │
       ▼
③ Service (RiotApiClient)
   - 外部REST API通信、エラーハンドリング、データの集約。
       │
       ▼
④ Model (ActiveRecord)
   - データの永続化・キャッシュ・ビジネスロジック。
       │
       ▼
⑤ Type (SummonerType, MatchType)
   - GraphQLクライアントへ公開するフィールドの定義、計算フィールド（KDA等）の整形。
```

## 結果と影響 (Consequences)

### ポジティブな影響（メリット）
- **関心の分離**: GraphQL の構文定義（Type/Query）と、外部REST通信の詳細（HTTP/Faraday）が綺麗に分離され、コードの見通しが極めて良くなる。
- **テスタビリティ・モック化**: Service層のモックを作れば、GraphQLのレイヤーを外部API制限なしで単体テストできる。
- **段階的な成長**: まず「Service ➔ Type」でリアルタイム検索を動かし、その後に「Service ➔ Model (DB) ➔ Type」とキャッシュ機能を追加するリファクタリングが容易。

### ネガティブな影響 / トレードオフ
- クラスやファイル数が増える（Service, Type, Query）。ただし、保守性と可読性は大幅に向上する。

### 今後のアクション項目
- [ ] `app/services/riot_api_client.rb` の作成
- [ ] `app/graphql/types/objects/match_type.rb`, `summoner_type.rb` の作成
- [ ] `QueryType` に `search_summoner` フィールドを実装
- [ ] 動作確認（GraphQLクエリでのサモナー・戦績取得）
