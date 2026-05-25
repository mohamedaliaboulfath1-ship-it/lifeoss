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
| `life_years` | بيانات JSON سنوية (كتب، مالية، هوية…) |
| `goals` | الأهداف |
| `habits` + `habit_logs` | العادات وسجل الإنجاز |
| `weight_logs` | تتبع الوزن |
| `workouts` | التمارين |
| `meals` | الوجبات / التغذية |

## الإعداد المحلي

### 1. Supabase

1. افتح [Supabase Dashboard](https://supabase.com/dashboard) → مشروعك.
2. **SQL Editor** → الصق محتوى `supabase/migrations/001_initial_schema.sql` → **Run**.
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

1. **Authentication** → **URL Configuration**:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/auth/callback`
2. تأكد أن migration SQL مُنفَّذ على مشروع الإنتاج.

## API

| المسار | الوصف |
|--------|--------|
| `GET /api/data` | الملف + بيانات السنة |
| `GET/PUT /api/year` | بيانات سنة |
| `GET/POST/DELETE /api/goals` | الأهداف |
| `GET/POST/PATCH/DELETE /api/habits` | العادات |
| `POST /api/import` | استيراد JSON من HTML |

## استيراد من HTML

DevTools → Application → Local Storage → `lifeos_v3` → الصق في **استيراد** من لوحة التحكم.
