# Salon SaaS — 美容サロン管理システム

## プロジェクト概要
3店舗を管理する美容サロン会社向けの統合管理システム。
ホットペッパービューティー脱却を前提に、LP集客→自社予約→顧客管理→売上管理を一気通貫で実現する。

- クライアント: 3店舗運営の美容サロン会社（大阪）
- 開発者: 颯馬（フルスタック / A.I.M Inc.）
- 現在フェーズ: Phase 1（LP + Web予約 + 管理画面）

## 技術スタック
- Frontend: React + TypeScript + Vite
- Backend: Supabase (PostgreSQL + Auth + Storage + RLS)
- Hosting: Vercel（フロント） / Supabase（API + DB）
- Styling: Tailwind CSS
- 状態管理: React Query (サーバー) + Zustand (クライアント)
- テスト: Vitest + Testing Library
- 外部連携: LINE Messaging API, Google Business API, Instagram Graph API

## マルチテナント構造
- company → stores → staff の3階層
- 全テーブルに company_id, store_id を持たせ RLS で権限制御
- ロール: company_admin / store_manager / stylist / customer / guest
- Supabase RLS で company_id → store_id → user_id のチェーンで権限分離

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
- API: Supabase Client 直接 or Edge Functions
- 型: strict モード, unknown 推奨
- コミット: Conventional Commits (feat/fix/docs/refactor)
- ディレクトリ: feature-based (src/features/reservation/, src/features/customer/ 等)

## 禁止事項
- NEVER use `any` type — use `unknown` or specific types
- NEVER bypass RLS — all queries must respect tenant isolation
- NEVER hardcode store_id or company_id — always derive from auth context
- NEVER commit .env files or API keys
- NEVER modify migration files after they've been applied
- NEVER use console.log in production — use proper logging
- NEVER skip error handling on Supabase queries — always check `.error`
