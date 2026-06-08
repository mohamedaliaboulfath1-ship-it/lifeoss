# LifeOS Body System V1.1 — Deliverables

**تاريخ:** 6 يونيو 2026  
**حالة البناء:** `npm run build` ✅ ناجح  
**حالة النشر:** غير منشور — التغييرات محلية فقط (آخر push: Wealth Management `213d268`)

---

## 1. الملفات المعدّلة / الجديدة

### Migrations
| ملف | حالة |
|-----|------|
| `supabase/migrations/014_para_habit_system.sql` | جديد — PARA + Habits |
| `supabase/migrations/015_body_system_v11.sql` | جديد — Body V1.1 schema |

### Body Core (جديد)
| ملف | الوصف |
|-----|-------|
| `src/lib/body/analytics.ts` | تحليل الجسم — لا fallback لـ start_weight كوزن حالي |
| `src/lib/body/weight-forecast.ts` | `resolveCurrentWeight`, ETA, remaining kg |
| `src/lib/body/coach.ts` | رؤى المدرب التلقائية |
| `src/components/body/body-coach-view.tsx` | واجهة الجسم الموحّدة (6 تبويبات) |
| `src/components/body/weight-hero-card.tsx` | بطاقة الوزن + «لم يتم تسجيل الوزن بعد» |
| `src/components/body/body-plan-panel.tsx` | أهداف الوزن، التغذية، التمارين، bodyGoal |
| `src/components/body/progress-photos-panel.tsx` | Timeline + Compare + رفع صور |
| `src/types/para.ts` | `BodyAnalytics` مع `hasWeight`, حقول nullable |

### APIs
| ملف | تغيير |
|-----|-------|
| `src/app/api/weight/route.ts` | POST/PATCH يحدّثان `profiles.current_weight` |
| `src/app/api/data/route.ts` | PATCH لـ bodyPlan, nutrition targets, body_goal |
| `src/app/api/body/photos/route.ts` | موجود — رفع/جلب صور progress-photos |
| `src/app/api/body/route.ts` | موجود — قياسات الجسم |

### Pages
| ملف | تغيير |
|-----|-------|
| `src/app/(dashboard)/body/page.tsx` | `BodyCoachView` بدل `BodyView` |
| `src/app/(dashboard)/weight/page.tsx` | تمرير bodyPlan + currentWeight |
| `src/app/(dashboard)/workouts/page.tsx` | تمرير workoutProgram |
| `src/app/(dashboard)/nutrition/page.tsx` | تحسينات خطة التغذية |

### Dashboard & Context
| ملف | تغيير |
|-----|-------|
| `src/lib/dashboard/snapshot.ts` | `resolveCurrentWeight` — إزالة fallback لـ start_weight |
| `src/components/dashboard/dashboard-view.tsx` | KPI وزن + Project Command Center |
| `src/components/dashboard/weight-view.tsx` | إعادة كتابة — بدون 70/62 hardcoded |
| `src/components/dashboard/body-view.tsx` | تحديث جزئي (legacy — `/body` يستخدم CoachView) |
| `src/components/dashboard/workouts-view.tsx` | تبويب تماريني + إضافة تمرين |
| `src/components/dashboard/nutrition-view.tsx` | Meal Builder موجود |
| `src/contexts/lifeos-context.tsx` | bodyPlan, patchYearData |
| `src/lib/year-data.ts` | تحميل bodyPlan من metadata |
| `src/types/lifeos.ts` | BodyPlan types |

### PARA / Habits (مرافق — غير مرتبط مباشرة بالجسم)
| ملف |
|-----|
| `PARA_HABIT_ARCHITECTURE.md` |
| `src/components/habits/*` |
| `src/app/(dashboard)/areas/*` |
| `src/lib/habits/intelligence.ts` |
| `src/lib/goals/completion.ts` |
| `src/lib/life-coach/habit-coach.ts` |
| `src/app/api/habits/route.ts` |
| `src/app/api/areas/route.ts` |
| `src/app/api/goals/completion/route.ts` |

---

## 2. Migrations الجديدة

### `015_body_system_v11.sql` — **يجب تشغيله في Supabase**
```sql
-- profiles: body_goal, weekly_gain_target, fiber_target, water_target_ml
-- body_measurements: neck, shoulders, forearm, body_fat_pct, custom_fields
-- exercises: video_url, difficulty, tags, notes
-- measurement_field_defs (جدول جديد)
-- workout_templates (جدول جديد)
-- RLS policies للجداول الجديدة
```

### `014_para_habit_system.sql` — **يجب تشغيله إن لم يُشغَّل**
- `profiles.current_weight`
- أعمدة PARA للعادات والأهداف

### Buckets موجودة مسبقاً
- `progress-photos` — في `006_storage_buckets.sql` + `012_storage_cover_update.sql`

---

## 3. الجداول الجديدة / الموسّعة

| جدول | نوع |
|------|-----|
| `measurement_field_defs` | **جديد** — قياسات مخصصة |
| `workout_templates` | **جديد** — قوالب PPL / Upper-Lower / Custom |
| `profiles` | + `body_goal`, `weekly_gain_target`, `fiber_target`, `water_target_ml`, `current_weight` |
| `body_measurements` | + `neck`, `shoulders`, `forearm`, `body_fat_pct`, `custom_fields` |
| `exercises` | + `video_url`, `difficulty`, `tags`, `notes` |

---

## 4. APIs

| Endpoint | Method | الوظيفة |
|----------|--------|---------|
| `/api/weight` | GET/POST/PATCH/DELETE | سجلات الوزن + sync `current_weight` |
| `/api/body` | POST | قياسات الجسم |
| `/api/body/photos` | GET/POST | Timeline + رفع Supabase Storage |
| `/api/data` | PATCH | targetWeight, bodyPlan, macros, height |
| `/api/workouts` | موجود | تسجيل تمارين |
| `/api/nutrition` | موجود | وجبات + أطعمة |

**APIs غير مُنفَّذة بعد (schema جاهز فقط):**
- `/api/body/measurement-fields` — CRUD لـ `measurement_field_defs`
- `/api/workouts/templates` — CRUD لـ `workout_templates`

---

## 5. نسبة الإنجاز الحقيقية

| المجال | % | ملاحظات |
|--------|---|---------|
| **إصلاح الوزن الخاطئ (70 كجم)** | **95%** | لا hardcoded 70/62؛ `resolveCurrentWeight` في analytics + snapshot + hero card. إن بقي 70 في DB كـ `start_weight` لن يُعرض كوزن حالي. |
| **بطاقة الوزن + إدخال يدوي** | **90%** | Modal (تاريخ/وزن/ملاحظات)، optimistic update، جدول السجلات |
| **محرك التوقع (Forecast)** | **85%** | remaining, weeks, ETA, progress % — بدون منحنى بياني منفصل للتوقع |
| **أهداف قابلة للتعديل** | **80%** | target, weekly rate, bodyGoal, macros في BodyPlanPanel |
| **صور التقدم** | **75%** | رفع front/side/back، timeline شهري، compare mode، Supabase bucket |
| **القياسات** | **55%** | 9 حقول افتراضية في UI؛ schema للقياسات المخصصة بدون API/UI كامل |
| **التمارين** | **45%** | مكتبة تمارين + تسجيل + PR؛ لا drag-drop builder، لا templates UI |
| **التغذية** | **50%** | Meal Builder + macros؛ fiber/water في schema فقط، لا diet templates UI |
| **AI Coach** | **70%** | insights تلقائية للوزن/القياسات في body + dashboard |
| **Dashboard Integration** | **65%** | KPIs وزن/سعرات/تمارين؛ لا Body Transformation Score مخصص |
| **Customization (widgets/ترتيب)** | **25%** | إعدادات أساسية في settings؛ لا نظام widgets كامل |
| **Search / Analytics / Life Score** | **40%** | body coach في insights؛ لا فهرسة body مخصصة |

### **الإجمالي التقريبي: ~62%** من البرومبت الكامل V1.1

---

## 6. يحتاج تدخلك الشخصي فقط

### Supabase (مطلوب)
1. **شغّل migration 014** في SQL Editor:
   ```
   supabase/migrations/014_para_habit_system.sql
   ```
2. **شغّل migration 015**:
   ```
   supabase/migrations/015_body_system_v11.sql
   ```
3. **تحقق من bucket `progress-photos`** — موجود إن شغّلت 006 سابقاً.
4. **(اختياري)** إن كان `start_weight = 70` في `profiles` ولا تريده:
   ```sql
   UPDATE profiles SET start_weight = NULL, current_weight = NULL WHERE id = 'YOUR_USER_ID';
   ```

### Vercel (مطلوب للنشر)
1. `git commit` + `git push` — التغييرات غير مرفوعة بعد.
2. Deploy تلقائي من Vercel بعد الـ push.

### بعد النشر — خطواتك
1. افتح `/body` → تبويب **الوزن** → **إضافة وزن جديد** → أدخل **62 كجم**.
2. تبويب **خطتي** → الهدف **75**، المعدل **0.5** كجم/أسبوع.
3. توقّع: **13 كجم متبقي ≈ 26 أسبوع**.

---

## 7. ما تبقّى للمرحلة التالية (V1.2)

- [ ] API + UI لـ `measurement_field_defs` (قياسات مخصصة كاملة)
- [ ] API + UI لـ `workout_templates` + Drag & Drop builder (`@dnd-kit` موجود في goals)
- [ ] مولّد برنامج تمرين تلقائي (أيام × split × أهداف)
- [ ] Diet templates (Bulk/Cut/Maintenance) + fiber/water targets في UI
- [ ] Custom Foods مع barcode
- [ ] Body Transformation Score في Dashboard
- [ ] نظام customization كامل (widgets, إخفاء أقسام, ألوان بطاقات)
- [ ] تحديث search index + analytics endpoints للجسم
- [ ] إزالة/دمج `body-view.tsx` legacy نهائياً

---

## 8. التحقق السريع

```bash
npm run build   # ✅ يجب أن ينجح
```

**سلوك الوزن المتوقع:**
- بدون سجلات → «لم يتم تسجيل الوزن بعد»
- بعد POST `/api/weight` → 62 كجم + forecast 26 أسبوع (هدف 75 @ 0.5/أسبوع)
