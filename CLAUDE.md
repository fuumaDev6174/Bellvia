# Salon SaaS — 美容サロン管理システム

## プロジェクト概要
3店舗を管理する美容サロン会社向けの統合管理システム。
ホットペッパービューティー脱却を前提に、LP集客→自社予約→顧客管理→売上管理を一気通貫で実現する。

- クライアント: 3店舗運営の美容サロン会社（大阪）
- 開発者: 颯馬（フルスタック / A.I.M Inc.）
- 現在フェーズ: Phase 1（LP + Web予約 + 管理画面）

## 技術スタック
- Frontend: React + TypeScript + Vite
- Backend: Hono (TypeScript) — API サーバー + 静的ファイル配信
- Database: Supabase (PostgreSQL + Auth + RLS)
- Hosting: Render (Docker) — Hono が API + SPA を1コンテナで配信
- Styling: Tailwind CSS
- 状態管理: React Query (サーバー) + Zustand (クライアント)
- テスト: Vitest + Testing Library
- 外部連携: LINE Messaging API, Google Business API, Instagram Graph API

## アーキテクチャ
```
Browser → Hono (Node.js on Render)
            ├── /api/auth/*     → Supabase Auth (httpOnly cookie認証)
            ├── /api/public/*   → Supabase DB (公開データ)
            ├── /api/admin/*    → Supabase DB (認証必須)
            └── /*              → React SPA (静的ファイル配信)
```

- フロントエンドは `/api/*` 経由でのみバックエンドにアクセス
- Supabase はバックエンド(Hono)からのみ叩く（フロントから直接アクセスしない）
- 認証は httpOnly cookie 方式（JWT をブラウザの JS に露出させない）

## ディレクトリ構成
```
/
├── server/                  # Hono バックエンド
│   ├── src/
│   │   ├── index.ts         # エントリポイント（API + 静的配信）
│   │   ├── routes/          # auth.ts, public.ts, admin.ts
│   │   ├── middleware/       # auth.ts（cookie JWT検証）
│   │   └── lib/             # supabase.ts（admin client）
│   ├── package.json
│   └── tsconfig.json
├── src/                     # React フロントエンド
│   ├── lib/api.ts           # fetch wrapper（credentials: 'include'）
│   ├── features/            # 機能別モジュール
│   ├── hooks/               # 共通hooks
│   ├── stores/              # Zustand stores
│   └── types/               # 型定義（サーバーと共有）
├── package.json             # workspaces: ["server"]
├── Dockerfile               # multi-stage: client build + server build + node runtime
└── render.yaml
```

## マルチテナント構造
- company → stores → staff の3階層
- 全テーブルに company_id, store_id を持たせ RLS で権限制御
- ロール: company_admin / store_manager / stylist / customer / guest
- Hono middleware + Supabase RLS の2段階で権限チェック

## 環境変数
### サーバー側（.env / Render 環境変数）
- `SUPABASE_URL` — Supabase プロジェクト URL
- `SUPABASE_SERVICE_ROLE_KEY` — service_role キー（秘匿）
- `SUPABASE_ANON_KEY` — anon キー
- `PORT` — サーバーポート（デフォルト: 3001 dev / 3000 prod）
- `NODE_ENV` — development / production
- `APP_URL` — デプロイ先URL（CORS / cookie 用）

### フロントエンドには環境変数不要
フロントは `/api/*` を叩くだけ。Supabase の URL やキーはフロントに露出しない。

## 開発コマンド
- `npm run dev` — Vite + Hono を concurrently で同時起動
- `npm run build` — フロントエンドビルド
- `npm run build:server` — サーバービルド
- `npm run build:all` — 両方ビルド
- `npm run start` — 本番サーバー起動
- `npm run test` — テスト実行

## 開発フェーズ
- **Phase 1: LP + Web予約 + 管理画面（最小構成）** ← いまここ
- Phase 2: 顧客カルテ + シフト + 売上管理 + 在庫管理
- Phase 3: SNS・口コミ統合 + LINE活用強化 + マーケティング
- Phase 4: 経営分析BI + SaaS展開準備

## 開発優先順位
1. ウェブ集客（LP→予約の導線構築）
2. バラバラなツールの統合（業務効率化）
3. 会社⇔店舗の管理体制の整備
4. ホットペッパー脱却（自社予約への移行）

※ 優先度1と4は表裏一体。自社予約の受け皿がないとLP集客しても意味がない。

## 詳細ドキュメント
各ドキュメントは @docs/ファイル名.md で参照:
- @docs/architecture.md — システム全体構成（To-Be）
- @docs/features.md — フェーズ別機能一覧（詳細）
- @docs/db-design.md — テーブル設計
- @docs/current-state.md — 現状ツールマップ（As-Is）+ 課題
- @docs/roles.md — ロール・権限設計
- @docs/hearing-notes.md — ヒアリング記録（随時更新）
- @docs/decisions.md — 設計判断ログ（ADR）

## コーディング規約
- コンポーネント: 関数コンポーネント + hooks, PascalCase
- ファイル名: コンポーネントは PascalCase.tsx, その他は camelCase.ts
- フロントエンド API 呼び出し: `src/lib/api.ts` の `api()` 関数を使用
- バックエンド: Hono ルートハンドラ — `server/src/routes/` に配置
- 型: strict モード, unknown 推奨
- コミット: Conventional Commits (feat/fix/docs/refactor)
- ディレクトリ: feature-based (src/features/reservation/, src/features/customer/ 等)

## 禁止事項
- NEVER use `any` type — use `unknown` or specific types
- NEVER call Supabase directly from frontend — always go through Hono API (`/api/*`)
- NEVER expose SUPABASE_SERVICE_ROLE_KEY to frontend
- NEVER bypass RLS — all queries must respect tenant isolation
- NEVER hardcode store_id or company_id — always derive from auth context
- NEVER commit .env files or API keys
- NEVER modify migration files after they've been applied
- NEVER use console.log in production — use proper logging
- NEVER skip error handling on Supabase queries — always check `.error`
