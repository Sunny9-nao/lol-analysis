# プロジェクト課題・タスクリスト (TODO)

## 優先度: 高 (今すぐ解消すべきもの)
- [x] **Data Dragonのバージョンハードコード解消**
  - 対象: `backend/db/seeds.rb`
  - 内容: チャンピオンマスタ取得用のAPIバージョンがハードコードされているため、最新バージョンを動的に取得するように修正する。
  - 状況: 完了
- [x] **対面分析（Matchup Analysis）GraphQL APIの構築**
  - 対象: `backend/app/services/matchup_analysis_service.rb`, `SummonerType` 等
  - 内容: 自チャンピオン選択、対面別サマリ（勝率・KDA・CS/分・タグ比率・最新メモ）、特定対面の全試合詳細クエリを実装。取得試合数を15件に拡張。
  - 状況: 完了 (ADR-0007 策定)
- [x] **フロントエンドの構築 (Next.js MVP UI)**
  - 対象: `frontend/`
  - 内容: Next.js App Router + TypeScript + Tailwind CSS による Google 風クリーン UI（サモナー検索・直近戦績カード・対面分析インライン展開・メモ編集モーダル）を構築。
  - 状況: 完了 (ADR-0008 策定)
- [ ] **認証・認可の導入**
  - 対象: `backend/app/graphql/mutations/save_match_note.rb` 他
  - 内容: 他人の戦績メモを上書きできないよう、ユーザー管理やセッショントークン検証を実装する。
- [ ] **GraphQL::Dataloaderの本格導入**
  - 対象: `backend/app/graphql/types/objects/summoner_type.rb` 等
  - 内容: ActiveRecordの `includes` に依存している N+1 対策を、GraphQL Dataloaderに置き換えてより柔軟にスケールできるようにする。
- [ ] **試合同期の非同期化 (ActiveJob / Solid Queue)**
  - 対象: `backend/app/services/summoner_sync_service.rb`, `app/jobs/`
  - 内容: 15件の試合取得をバックグラウンド化し、APIレートリミットを平準化し検索レスポンスを高速化する。
