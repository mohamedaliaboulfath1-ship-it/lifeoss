# LifeOS — البيانات الأولية العربية لمحمد

**الغرض:** نقطة بداية تعليمية كاملة بالعربية — PARA + ربط المجالات — **قابلة للتعديل والحذف بالكامل من الواجهة**.

---

## التشغيل التلقائي (بعد النشر)

عند تسجيل دخول **mohamedaliaboulfath1@gmail.com** لأول مرة، يُنشَأ المحتوى تلقائياً عبر `GET /api/data` إذا لم يكن موجوداً.

## التشغيل اليدوي

```bash
# 1. عيّن مفاتيح Supabase (service role)
export NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# 2. (اختياري) بريد مستخدم آخر
export SEED_USER_EMAIL="mohamedaliaboulfath1@gmail.com"

# 3. تشغيل البذر
npm run seed:mohamed

# إعادة البذر (استبدال البيانات السابقة)
npm run seed:mohamed -- --force

# بديل: كلمة مرور الحساب (بدون service role)
export SEED_USER_PASSWORD="your-password"
npm run seed:mohamed

# من الواجهة (بعد تسجيل الدخول)
curl -X POST https://lifeoss-nine.vercel.app/api/seed/mohamed-arabic

# معاينة بدون كتابة
node scripts/seed-mohamed-arabic.mjs --dry-run
```

> **مهم:** يجب أن يكون المستخدم مسجّلاً مسبقاً في التطبيق (حساب Auth موجود).

---

## ما يُنشأ

| القسم | المحتوى |
|-------|---------|
| **PARA** | 3 رؤى · 6 أهداف · 5 مشاريع مرتبطة |
| **مهام** | 18 مهمة مربوطة بهدف + مشروع |
| **عادات** | 13 عادة بجداول ذكية (جيم، وزن، قراءة، مراجعات…) |
| **كتب** | 4 كتب عربية/إنجليزية مربوطة بالمجالات |
| **جسم** | وزن 62 كجم · هدف 75 · طول 182 · خطة زيادة عضلية |
| **مهنة** | محاسب → محلل مالي · 6 مهارات · FMVA/CMA · 4 مراحل |
| **ثروة** | فئات مصروفات · صندوق طوارئ · خط أساس صافي الثروة · أقسام فارغة جاهزة |
| **وقت** | أحد–خميس 8:30–16:30 · سبت 11:00–16:00 · جمعة إجازة |

---

## الملفات

| ملف | الوصف |
|-----|-------|
| `scripts/seed-mohamed-arabic.mjs` | سكربت التنفيذ (service role) |
| `scripts/mohamed-arabic-data.mjs` | البيانات العربية + معرّفات `seed_*` |

---

## المعرّفات

جميع السجلات تبدأ بـ `seed_` — يمكن حذفها أو تعديلها بأمان. إعادة التشغيل مع `--force` يحذف `seed_*` فقط.

---

## المجالات (8)

النظام يستخدم المجالات المدمجة:

| المجال | ID |
|--------|-----|
| الجسد والصحة | `domain_body` |
| المال والثروة | `domain_finance` |
| المهنة | `domain_career` |
| التعلم | `domain_learning` |
| التطوير الذاتي | `domain_self_dev` |
| الانضباط | `domain_discipline` |
| العلاقات | `domain_relationships` |
| الجانب الروحي | `domain_spiritual` |

---

## بعد البذر

1. سجّل الدخول بحساب محمد
2. افتح `/` — Dashboard مع Today's Habits
3. افتح `/areas` — كل مجال يعرض أهدافه وعاداته
4. افتح `/career` — المسار والمهارات
5. افتح `/weight` — الوزن 62 → 75
6. عدّل أي عنصر كما تشاء — لا شيء مغلق
