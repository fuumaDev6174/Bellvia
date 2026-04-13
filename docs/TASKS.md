# Supabase → NeonDB + Drizzle + Auth.js 移行タスク

## 概要
SupabaseからNeonDB + Drizzle ORM + Auth.jsへの全面移行。
- 移行対象: 59箇所（auth 6 + クエリ 51 + RPC 2）

---

## Step 1: パッケージ + Drizzleスキーマ + DB接続 ✅
- [x] パッケージインストール（drizzle-orm, @neondatabase/serverless, @hono/auth-js, bcryptjs等）
- [x] `server/src/db/schema.ts` — 全17テーブルのDrizzle定義
- [x] `server/src/db/index.ts` — Neon接続 + Drizzleインスタンス
- [x] `drizzle.config.ts` — Drizzle Kit設定

## Step 2: NeonDBにスキーマ作成 ✅
- [x] `drizzle-kit push` で全17テーブル作成
- [x] RPC関数（get_available_slots, create_guest_reservation）をNeonに作成
- [x] customer_stats ビュー作成

## Step 3: Auth.js 導入 ✅
- [x] `server/src/lib/auth.ts` — 認証ロジック（bcrypt + JWT）
- [x] `server/src/lib/jwt.ts` — JWT sign/verify（HS256）
- [x] `server/src/routes/auth.ts` — Drizzleベースに全面書き換え
- [x] `server/src/middleware/auth.ts` — JWTセッションベースに書き換え

## Step 4: 全クエリをDrizzle ORMに書き換え ✅
- [x] `server/src/routes/admin.ts` — 全47クエリ書き換え完了
- [x] `server/src/routes/public.ts` — 全4クエリ + 2 RPC書き換え完了

## Step 5: Supabase依存の除去 ✅
- [x] `server/src/lib/supabase.ts` 削除
- [x] `@supabase/supabase-js` アンインストール
- [x] `.env` 更新（SUPABASE_* 削除済み、DATABASE_URL + AUTH_SECRET設定済み）

## Step 6: フロントエンド調整 + ビルド確認 ✅
- [x] フロントエンド変更不要（APIレスポンス形式を維持）
- [x] サーバービルド: `npx tsc --noEmit` 成功
- [x] フロントビルド: `npm run build` 成功

---

## 進捗ログ
| 日付 | ステップ | 状態 |
|------|---------|------|
| 2026-04-13 | Step 1 | ✅ パッケージ + Drizzleスキーマ + DB接続 |
| 2026-04-13 | Step 2 | ✅ NeonDB全17テーブル + RPC + ビュー作成 |
| 2026-04-13 | Step 3 | ✅ 認証をJWT + bcrypt方式に書き換え |
| 2026-04-13 | Step 4 | ✅ 全51クエリをDrizzle ORMに移行 |
| 2026-04-13 | Step 5 | ✅ Supabase完全除去 |
| 2026-04-13 | Step 6 | ✅ ビルド確認完了 |
