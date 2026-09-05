# [ADR-0006] Data Dragonからのチャンピオンマスタデータ同期とリレーション設計

- **ステータス**: Accepted
- **決定日**: 2026-09-05
- **決定者**: 開発者

## コンテキスト（背景・課題）
試合詳細（MatchParticipant）にはチャンピオン名（"Jax", "Yorick" 等）のみが記録されている。
UI表示や分析画面で、日本語名（"ジャックス"）、称号（"武器の達人"）、公式アイコン画像URLなどを豊かに表示するため、チャンピオンマスタ（Championテーブル）を整備する必要がある。

## 検討した選択肢
1. **選択肢A (都度外部APIを叩く)**: 画面描画のたびにData Dragonを叩くと遅延が発生する。
2. **選択肢B (ローカルDBにマスタ化し `db:seed` で一括投入)** 【採用】:
   - Riot Games 公式 CDN（Data Dragon）の `champion.json`（日本語版: `ja_JP`）から全チャンピオン（160体以上）を取得し、`Champion` テーブルに Upsert する。
   - `MatchParticipant` から `champion_name` を外部キーとして `belongs_to :champion` を結ぶ。

## 決定事項 (Decision)
1. `Champion` モデルに `champion_name` (英名キー), `name` (日本語名), `title` (称号), `image_url` を保持する。
2. `db/seeds.rb` に自動シード処理を実装し、コマンド一発で全チャンピオンを同期可能にする。
3. `MatchParticipantType` に `champion` フィールドを追加し、GraphQL クエリからマスタ情報をネスト取得できるようにする。

## 結果と影響 (Consequences)
### ポジティブな影響（メリット）
- フロントエンドは画像URLの構築ロジックを持たず、GraphQLからそのままアイコン画像や日本語名を表示できる。
- オフライン環境でもマスタデータがDB内に完備される。
