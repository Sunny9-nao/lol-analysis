# Architecture Decision Records (ADR)
本ディレクトリでは、当プロジェクトにおける主要なアーキテクチャおよび技術的な意思決定を記録・管理します。

## ADR とは
ADR（Architecture Decision Record）は、ソフトウェア開発において「なぜその技術・設計・構造を選んだのか」という背景（Context）、決定事項（Decision）、およびその結果（Consequences）を記録する手法です。

## 運用ルール
1. **起票ルール**:
   - アーキテクチャの変更、技術選定、APIスキーマ設計方針、認証認可方針などの意思決定を行う際は、[template.md](./template.md) をもとに新しいADRを作成します。
   - ファイル名規則: `[4桁の連番]-[kebab-case-title].md` (例: `0001-project-structure-and-tech-stack.md`)
2. **ステータス**:
   - `Proposed`（提案中）: 検討中・合意形成中
   - `Accepted`（採択）: 承認され採用された決定
   - `Superseded`（後続により廃止）: 後の決定によって置き換えられたもの（後続のADR番号をリンク）
3. **不可逆性**:
   - 一度 `Accepted` になったADRは原則として本文を書き換えません。方針転換がある場合は、新しいADRを作成し、古いADRのステータスを `Superseded by 000X` とします。

## ADR インデックス

| 番号 | タイトル | ステータス | 決定日 | 概要 |
| :--- | :--- | :--- | :--- | :--- |
| [0001](./0001-project-structure-and-tech-stack.md) | プロジェクト構成と初期技術スタックの選定 | Accepted | 2026-09-05 | lol-analysis配下にBE/FE/docsを配置、Rails 8 API + SQLite + GraphQLを採用 |
| [0002](./0002-architecture-layers-and-riot-api-service.md) | アーキテクチャレイヤリングと外部API Service層の責務設計 | Accepted | 2026-09-05 | Controller, Query, Service, Model, Type の責務分離とRiotApiClient設計 |
| [0003](./0003-raw-json-storage-and-normalized-data-modeling.md) | 生データ(Raw JSON)保持と正規化テーブルのハイブリッド設計 | Accepted | 2026-09-05 | 全スタッツ生JSONの保持と、対面分析に特化した正規化テーブルの設計 |
| [0004](./0004-tdd-and-testing-strategy.md) | TDD (テスト駆動開発) とテスト戦略の策定 | Accepted | 2026-09-05 | RSpec, FactoryBot, WebMockによるGraphQL/Service/Modelテスト方針 |
| [0005](./0005-n-plus-one-query-mitigation.md) | GraphQLにおけるN+1クエリ対策方針 | Accepted | 2026-09-05 | includesとDataloaderによるバッチ取得とクエリ数監視テストの導入 |
| [0006](./0006-champion-master-data-sync.md) | Data Dragonからのチャンピオンマスタデータ同期とリレーション設計 | Accepted | 2026-09-05 | db:seedによる全チャンピオン自動インポートとGraphQLへのマッピング |
| [0007](./0007-matchup-analysis-design.md) | 対面分析（Matchup Analysis）機能の設計とGraphQLスキーマ策定 | Accepted | 2026-09-05 | 個人特化の対面勝率・CS/分・メモ集計クエリ設計と同期試合数の拡張 |
| [0008](./0008-frontend-tech-stack-and-ui-design.md) | フロントエンド基盤の技術選定とGoogle風クリーンデザインUIの策定 | Accepted | 2026-09-05 | Next.js App Router + TypeScript + Tailwind CSSとタブ・アコーディオンUIの導入 |
| [0009](./0009-scope-to-ranked-matches-and-queue-id.md) | 分析スコープのランクマッチ（Ranked Solo/Duo & Flex）への限定とqueue_id管理 | Accepted | 2026-09-05 | ランク向上に特化するためノーマル戦を除外しランク戦のみを集計対象化 |
| [0010](./0010-usecase-driven-architecture-and-ui-design.md) | ソロランク向上ユースケースの実現方針と全体UI/情報設計アーキテクチャ | Accepted | 2026-09-05 | 逆引き・カンペ・直前反省・ギャップ分析等のユースケース別実現方針と3層3タブ情報設計 |
