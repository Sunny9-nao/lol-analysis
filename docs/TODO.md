# プロジェクト課題・タスクリスト (TODO)

## 優先度: 高 (今すぐ解消すべきもの)
- [x] **Data Dragonのバージョンハードコード解消**
  - 対象: `backend/db/seeds.rb`
  - 内容: チャンピオンマスタ取得用のAPIバージョンがハードコードされているため、最新バージョンを動的に取得するように修正する。
  - 状況: 完了

## 優先度: 中 (今後の開発に向けて)
- [ ] **認証・認可の導入**
  - 対象: `backend/app/graphql/mutations/save_match_note.rb` 他
  - 内容: 他人の戦績メモを上書きできないよう、ユーザー管理やセッショントークン検証を実装する。
- [ ] **GraphQL::Dataloaderの本格導入**
  - 対象: `backend/app/graphql/types/objects/summoner_type.rb` 等
  - 内容: ActiveRecordの `includes` に依存している N+1 対策を、GraphQL Dataloaderに置き換えてより柔軟にスケールできるようにする。

## 優先度: 低 (中長期的なマイルストーン)
- [ ] **フロントエンドの構築**
  - 対象: `frontend/` (新規)
  - 内容: Next.js + Apollo Client / GraphQL Code Generator を用いて、ユーザーが利用できるUIを開発する。
