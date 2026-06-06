# LifeOS Premium — Next.js SaaS

نظام تشغيل الحياة — تطبيق **Next.js 15** مع **Supabase** (PostgreSQL + Auth).

## البنية

```
src/
├── app/
│   ├── (auth)/           # login, register
│   ├── (dashboard)/      # لوحة التحكم والأقسام
│   ├── api/              # REST API
│   └── auth/callback/    # Supabase OAuth / email confirm
├── components/
├── lib/
│   ├── supabase.ts       # عميل المتصفح
│   └── supabase/         # server + middleware
└── types/
supabase/migrations/      # SQL schema + RLS
```

## قاعدة البيانات (Supabase)

| الجدول | الوصف |
|--------|--------|
| `profiles` | ملف المستخدم (مرتبط بـ `auth.users`) |
| `life_years` | سجل السنة (بدون payload — البيانات في جداول علائقية) |
| `life_domains` | 8 مناطق حياة (seed نظامي) |
| `life_tasks` | المهام |
| `books`, `transactions`, `debts` | قراءة، مالية، وغيرها |
| `goals` | الأهداف |
| `habits` + `habit_logs` | العادات وسجل الإنجاز |
| `weight_logs` | تتبع الوزن |
| `workouts` | التمارين |
| `meals` | الوجبات / التغذية |

## الإعداد المحلي

### 1. Supabase

1. افتح [Supabase Dashboard](https://supabase.com/dashboard) → مشروعك.
2. **SQL Editor** → شغّل migrations بالترتيب: `001` → `007` من `supabase/migrations/`.
3. **Authentication** → **Providers** → فعّل **Email**.
4. (موصى به للتطوير) **Authentication** → **Email** → عطّل **Confirm email** لتسجيل فوري.
5. **Project Settings** → **API** → انسخ `URL` و `anon public` key.

### 2. المتغيرات

```bash
cp .env.local.example .env.local
```

عدّل `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### 3. التشغيل

```bash
npm install
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000).

## النشر على Vercel

### 1. المستودع

```bash
git init
git add .
git commit -m "LifeOS Supabase SaaS"
git remote add origin https://github.com/YOU/lifeos.git
git push -u origin main
```

### 2. Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → استورد المستودع.
2. **Environment Variables** (Production + Preview):

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | من Supabase API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | من Supabase API |

3. **Deploy**.

### 3. Supabase بعد النشر

1. **Authentication** → [URL Configuration](https://supabase.com/dashboard/project/zxwsbjrqggjpqhtwjvby/auth/url-configuration):
   - **Site URL**: `https://lifeoss-nine.vercel.app`
   - **Redirect URLs** (أضف الكل):
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/**`
     - `https://lifeoss-nine.vercel.app/auth/callback`
     - `https://lifeoss-nine.vercel.app/**`
2. تأكد أن migrations `001`–`007` مُنفَّذة على مشروع Supabase.

**الإنتاج:** https://lifeoss-nine.vercel.app

## API

| المسار | الوصف |
|--------|--------|
| `GET /api/data` | الملف + تجميع بيانات السنة (علائقي) |
| `GET /api/v1/dashboard` | لقطة Dashboard |
| `GET/POST/PATCH/DELETE /api/goals` | الأهداف |
| `GET/POST/PATCH/DELETE /api/habits` | العادات |
| `GET/POST/PATCH/DELETE /api/tasks` | المهام |
| `GET/POST/PATCH/DELETE /api/body` | الوزن والقياسات |
| `GET/POST/PATCH/DELETE /api/workouts` | التمارين |
| `GET/POST/PATCH/DELETE /api/nutrition` | التغذية |
| `GET/POST/PATCH/DELETE /api/finance` | المالية |
| `GET/POST/PATCH/DELETE /api/books` | القراءة |
| `GET/POST/PATCH/DELETE /api/career` | المهنة |
| `GET/POST/PATCH/DELETE /api/learning` | التعلم |
| `POST /api/v1/import/lifeos-v1` | استيراد نسخة احتياطية v1 |

`PUT /api/year` و `POST /api/import` **مهملان** — استخدم entity APIs أعلاه.

## استيراد البيانات

من `/settings/import` — ارفع ملف JSON (مثل `scripts/test-backup.json`).
