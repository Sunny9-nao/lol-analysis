# 品質評価レポート（2026-09-05）

## 結論

**一般公開判定: No-Go**

ローカルMVPとしては、サモナー検索、対面分析、反省メモ、試合詳細、ギャップ分析の主要フローが動作している。一方で、他者メモの改ざんを防ぐ認可、Riot APIおよび自APIの負荷制御、個人データのライフサイクル、本番デプロイと監視の運用条件が未整備である。この状態での外部公開、公開alpha、公開betaは行わない。

評価対象は2026-09-05時点のローカルワークツリーであり、クラウド環境の実設定、Riot Gamesによる製品承認、実運用データでの負荷試験は確認対象外である。

| 評価軸 | 評価 | 根拠 |
| --- | --- | --- |
| MVP機能 | 3.5 / 5 | 主要な分析・入力・詳細表示のE2Eフローが動作 |
| 自動検証 | 3 / 5 | RSpecとE2Eは通るが、CIが本リポジトリ直下に存在せず、障害・認可系の検証が不足 |
| コード衛生 | 2 / 5 | RuboCopが失敗し、ESLint警告が残る |
| セキュリティとプライバシー | 1 / 5 | 認証認可、公開APIの防御、保持期限、本人要求対応が未実装 |
| 運用とデプロイ | 1 / 5 | 本番インフラ、監視、復元訓練、ロールバック手順が未整備 |
| UXとアクセシビリティ | 2.5 / 5 | 主な画面フローは動くが、最小モバイル幅の横あふれとモーダル操作の改善余地がある |

目安として、MVP完成度は約65%、一般公開準備度は約20-25%と評価する。

## 実行した検証

| 検証 | 結果 | 補足 |
| --- | --- | --- |
| `bundle exec rspec` | 成功 | 26 examples, 0 failures |
| `bundle exec rails zeitwerk:check` | 成功 | eager load可能 |
| `bundle exec brakeman --quiet --no-pager` | 成功 | Security Warnings: 0 |
| `bundle exec bundler-audit check` | 成功 | 既知のGem脆弱性なし |
| `npm run build` | 成功 | Next.js production build成功 |
| `npm run test:e2e` | 成功 | Playwright 11件成功、ローカル起動済みサービスに接続 |
| `npm run lint` | 警告あり | 0 errors, 26 warnings。未使用コードと`<img>`利用が中心 |
| `bundle exec rubocop --format simple` | 失敗 | 368 offenses、190件は自動修正可能 |
| `npm audit` / `npm audit --omit=dev` | 成功 | 既知のnpm脆弱性なし |

Brakemanと依存脆弱性監査の成功は有用だが、認可不備、レート制限、データ保持、クラウド設定のような設計・運用上のリスクを検出しない。そのため、これらの結果だけを公開判定の根拠にはしない。

## 公開を阻害する主要事項

### P0: データ所有権と認可

[GraphQLコントローラ](../backend/app/controllers/graphql_controller.rb#L8-L18)は認証済みユーザーをコンテキストに渡しておらず、[メモ保存Mutation](../backend/app/graphql/mutations/save_match_note.rb#L15-L26)は`matchParticipantId`だけで対象を特定して保存する。

そのため、IDを知る利用者は他者の反省メモを更新できる。公開前に認証方式を一つ選定し、`User -> Summoner -> MatchParticipant -> MatchNote` の所有権を定義した上で、すべての読み書きに認可を適用する必要がある。認可拒否、別ユーザー、セッション失効、CSRFを含むテストも必須とする。

### P0: Riot API準拠、耐障害性、負荷制御

[Riot APIクライアント](../backend/app/services/riot_api_client.rb#L119-L137)は429を例外として返すだけで、`Retry-After`、共有レート制御、タイムアウト、指数バックオフ、ジッター、停止期間中の再実行抑止を実装していない。[同期処理](../backend/app/services/summoner_sync_service.rb#L44-L91)は検索リクエスト中に最大40試合とタイムラインを逐次取得するため、利用者増加時にRiot APIの制限とアプリの応答待ちが直結する。

Riot Gamesの現行ポリシー上、公開製品はDeveloper Portalで登録・監査を受け、Production API Keyを使う必要がある。Personal API Keyによる公開alpha/betaを含む一般公開は許可されない。また、429を受けた場合は`Retry-After`に従って呼び出しを停止する必要がある。

### P0: 公開APIと本番通信の防御

[CORS設定](../backend/config/initializers/cors.rb#L8-L15)はlocalhostのみを許可し、本番originを環境変数で管理していない。[本番設定](../backend/config/environments/production.rb#L25-L28)ではTLS強制が無効で、Host許可設定も未設定である。自API側のレート制限、GraphQLのクエリコスト・ページサイズ・リクエスト本文上限もない。

本番ではHTTPS/HSTS、Host許可、必要最小限のCORS、セキュリティヘッダ、IPおよびアカウント単位のレート制限、GraphQLの複雑さ・深さ・入力サイズの制限を設定する。Introspection無効化は補助策であり、認可やレート制限の代替にはしない。

### P0: 秘密情報、法務、個人データ

Riot APIキーは即時ローテーション可能なSecret Manager経由にし、リポジトリ・ログ・ビルド成果物への混入を防ぐ。秘密情報スキャンと漏えい時の失効手順も必要である。

[スキーマ](../backend/db/schema.rb#L49-L85)には試合・参加者・タイムラインの生JSONが保存されるが、[データ保持方針](./DATA_RETENTION_AND_SEARCH.md#L20-L30)にあるゲストデータの削除や生JSONの退避・削除は、[定期ジョブ設定](../backend/config/recurring.yml#L13-L16)に接続されていない。プライバシーポリシー、利用規約、Riotの免責文、削除・エクスポート要求、保持期間、ログの個人情報マスキングを公開前に整備する。

### P1: 本番基盤、デプロイ、復旧

本番DBはSQLiteのままであり、PostgreSQLへの移行、バックアップ暗号化、定期復元テスト、RPO/RTO、デプロイ失敗時のロールバックが必要である。[デプロイ設定](../backend/config/deploy.yml#L8-L30)にはプレースホルダーのホストとローカルregistryが残っているため、そのまま公開できない。

Dockerfileの非root実行は良い土台だが、ステージング、本番環境変数、TLS終端、DB移行、ジョブワーカー分離、ヘルスチェック、監視、アラート、障害対応手順までを運用可能な形で確認する。

### P1: スケーラビリティと継続的品質保証

[対面分析サービス](../backend/app/services/matchup_analysis_service.rb#L12-L87)は集計・詳細取得で対象レコードを全件メモリへ読み込む。全期間保存を開始する前に、カーソルページング、最大取得件数、集計キャッシュ、インデックス、同期ジョブの冪等性と重複排除を実装する。

CI定義は[backend/.github/workflows/ci.yml](../backend/.github/workflows/ci.yml)にあるが、Gitリポジトリのルートはその親ディレクトリであるため、GitHub Actionsには認識されない配置である。さらに、[ローカルCI定義](../backend/config/ci.rb#L3-L10)と既存workflowにはRSpec、フロントエンドLint/build/E2Eが含まれていない。ルートの`.github/workflows`に移し、すべての必須ゲートをPR保護に接続する。

### P2: UI、共有、分析、公開リポジトリ運用

最小モバイル表示で横あふれが再現しており、対面表示の詳細キャッシュは対戦相手名だけをキーにしているため、サモナー・自チャンピオン・ロールの切替をまたぐ誤表示を防ぐ必要がある。モーダルのフォーカス移動、アクセシブルな名前、キーボード操作、エラー時の再試行導線を含めてWCAG観点で確認する。

[Next.jsメタデータ](../frontend/src/app/layout.tsx#L3-L7)は基本title/descriptionのみであり、OGP、Xカード、共有画像、robots/sitemap、動的メタデータは未実装である。サモナーやメモを共有対象にする場合は、本人の明示操作と公開範囲を先に設計する。計測導入時は、対象地域に応じた同意、最小化、オプトアウトを実装する。

## 次の行動

実装・公開判定のタスクは[一般公開に向けたタスクリスト](./PUBLIC_RELEASE_TASKS.md)に集約した。まずP0の認証認可、秘密情報ローテーション、Riot API制御、公開通信設定、法務・データ保持方針を完了させる。その後、P1の本番基盤・CI・復旧・監視をステージングで検証する。

## 未検証の範囲

- Riot Gamesの製品登録、Production API Key発行、機能変更の審査状況
- 本番クラウドのIAM、Secret Manager、ネットワーク、TLS、DNS、CDN/WAF設定
- 実データ量・同時アクセスでの負荷、429/5xx、外部API停止、バックアップ復元
- 対象地域の法令、計測同意、データ主体要求への法務レビュー
- 第三者ライセンス、公開リポジトリのLICENSE・SECURITY.md・問い合わせ窓口