# lol-analysis

League of Legends (LoL) の戦績分析・振り返り支援アプリケーション。
Ruby on Rails 8 による GraphQL BFF (Backend For Frontend) と、モダンフロントエンドで構成されます。

## ディレクトリ構成

- [`docs/adr/`](./docs/adr/): アーキテクチャ決定記録 (Architecture Decision Records)
- [`backend/`](./backend/): Rails 8 API + GraphQL-Ruby (SQLite)
- `frontend/`: クライアントアプリケーション（予定）

## クイックスタート (Backend)

```bash
cd backend

# 依存パッケージのインストール
bundle install

# データベース初期化 (SQLite)
bin/rails db:create

# サーバー起動 (ポート3001)
bin/rails s -p 3001
```

### GraphQL エンドポイント検証

```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ testField }"}'
# => {"data":{"testField":"Hello World!"}}
```
