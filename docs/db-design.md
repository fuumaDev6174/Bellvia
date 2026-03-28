# テーブル設計

Phase 1 で必要な最小テーブル構成。ヒアリング後に拡張予定。

## ER概要

```
companies ─┬── stores ─┬── staff
            │           ├── menus
            │           ├── reservations ── sales
            │           └── shifts
            └── customers
```

## テーブル定義

### companies（会社）
| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid PK | |
| name | text NOT NULL | 会社名 |
| logo_url | text | ロゴ画像URL |
| contact_email | text | 連絡先メール |
| phone | text | 電話番号 |
| plan | text | プラン（将来のSaaS化用） |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

### stores（店舗）
| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid PK | |
| company_id | uuid FK → companies | |
| name | text NOT NULL | 店舗名 |
| slug | text UNIQUE | URL用スラッグ（例: shinsaibashi） |
| address | text | 住所 |
| phone | text | 電話番号 |
| business_hours | jsonb | 営業時間（曜日別） |
| description | text | 店舗紹介文 |
| image_url | text | 店舗画像 |
| is_active | boolean DEFAULT true | 公開フラグ |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### staff（スタッフ）
| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid PK | |
| user_id | uuid FK → auth.users | Supabase Auth のユーザーID |
| store_id | uuid FK → stores | 所属店舗 |
| company_id | uuid FK → companies | 所属会社（RLS用） |
| display_name | text NOT NULL | 表示名 |
| role | text NOT NULL | company_admin / store_manager / stylist |
| bio | text | 自己紹介 |
| photo_url | text | プロフィール画像 |
| specialties | text[] | 得意スタイル（タグ配列） |
| position | text | 役職名（表示用） |
| sort_order | int | 表示順 |
| is_active | boolean DEFAULT true | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### menus（メニュー）
| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid PK | |
| store_id | uuid FK → stores | |
| company_id | uuid FK → companies | RLS用 |
| name | text NOT NULL | メニュー名 |
| category | text | カテゴリ（カット、カラー、パーマ等） |
| description | text | 説明 |
| price | int NOT NULL | 税込価格（円） |
| duration_min | int NOT NULL | 所要時間（分） |
| image_url | text | メニュー画像 |
| is_public | boolean DEFAULT true | LP公開フラグ |
| sort_order | int | 表示順 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### customers（顧客）
| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid PK | |
| company_id | uuid FK → companies | 会社単位で顧客管理 |
| name | text NOT NULL | 氏名 |
| name_kana | text | フリガナ |
| phone | text | 電話番号 |
| email | text | メールアドレス |
| line_id | text | LINE UID |
| gender | text | 性別 |
| birthday | date | 生年月日 |
| notes | text | メモ |
| first_visit_at | timestamptz | 初回来店日 |
| last_visit_at | timestamptz | 最終来店日 |
| visit_count | int DEFAULT 0 | 来店回数 |
| source | text | 流入元（web/line/hotpepper/walk-in/referral） |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### reservations（予約）
| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid PK | |
| store_id | uuid FK → stores | |
| company_id | uuid FK → companies | RLS用 |
| staff_id | uuid FK → staff | 担当スタイリスト |
| customer_id | uuid FK → customers | NULL可（ゲスト予約） |
| menu_id | uuid FK → menus | |
| start_at | timestamptz NOT NULL | 予約開始日時 |
| end_at | timestamptz NOT NULL | 予約終了日時（start_at + duration） |
| status | text NOT NULL | confirmed / completed / cancelled / no_show |
| source | text | 予約経路（web/phone/line/walk-in） |
| guest_name | text | ゲスト予約時の名前 |
| guest_phone | text | ゲスト予約時の電話番号 |
| guest_email | text | ゲスト予約時のメール |
| notes | text | 備考 |
| cancelled_at | timestamptz | キャンセル日時 |
| cancel_reason | text | キャンセル理由 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### shifts（シフト）— Phase 2 で本格実装、Phase 1 では簡易版
| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid PK | |
| staff_id | uuid FK → staff | |
| store_id | uuid FK → stores | |
| company_id | uuid FK → companies | RLS用 |
| date | date NOT NULL | 勤務日 |
| start_time | time NOT NULL | 出勤時間 |
| end_time | time NOT NULL | 退勤時間 |
| break_start | time | 休憩開始 |
| break_end | time | 休憩終了 |
| status | text | draft / published / confirmed |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### sales（売上）— Phase 2 で実装
| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid PK | |
| reservation_id | uuid FK → reservations | |
| store_id | uuid FK → stores | |
| company_id | uuid FK → companies | RLS用 |
| staff_id | uuid FK → staff | |
| amount | int NOT NULL | 売上金額（円） |
| payment_method | text | cash / paypay / card / other |
| discount_amount | int DEFAULT 0 | 割引額 |
| notes | text | |
| paid_at | timestamptz | 決済日時 |
| created_at | timestamptz | |

## RLS ポリシー方針

全テーブル共通:
- company_id ベースで会社間のデータ分離
- store_id ベースで店舗間のアクセス制御
- role に応じた CRUD 権限

```sql
-- 例: stores テーブルの SELECT ポリシー
CREATE POLICY "staff can view own company stores"
ON stores FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM staff WHERE user_id = auth.uid()
  )
);
```

## インデックス方針
- 全テーブルの company_id, store_id にインデックス
- reservations: (store_id, start_at) の複合インデックス（カレンダー表示用）
- reservations: (staff_id, start_at) の複合インデックス（スタイリスト別表示用）
- customers: (company_id, phone) のユニーク制約検討
- shifts: (staff_id, date) のユニーク制約
