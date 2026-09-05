# lol-analysis

League of Legends (LoL) の戦績分析・振り返り支援アプリケーション。
Ruby on Rails 8 による GraphQL BFF (Backend For Frontend) と、モダンフロントエンドで構成されます。

## ディレクトリ構成

- [`docs/adr/`](./docs/adr/): アーキテクチャ決定記録 (Architecture Decision Records)
- [`backend/`](./backend/): Rails 8 API + GraphQL-Ruby (SQLite)
- [`frontend/`](./frontend/): Next.js 16 (React 19) + Tailwind CSS クライアント

## クイックスタート

### 1. Backend (Rails 8 API)

```bash
cd backend

# 依存パッケージのインストール
bundle install

# データベース初期化 (SQLite)
bin/rails db:create db:migrate db:seed

# サーバー起動 (ポート3001)
bin/rails s -p 3001
```

### 2. Frontend (Next.js App)

```bash
cd frontend

# 依存パッケージのインストール
npm install

# 開発サーバー起動 (ポート3000)
npm run dev
```

ブラウザで `http://localhost:3000` を開き、Riot ID（例: `Sunny9#hono`）を入力してサモナー検索・対面分析・反省メモ編集を利用できます。
