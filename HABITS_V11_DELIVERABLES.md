# LifeOS Pro — Habit Scheduling + UI Overhaul V1.1 — Deliverables

**تاريخ:** 6 يونيو 2026  
**حالة البناء:** `npm run build` ✅  
**حالة Lint:** `npm run lint` ✅ (تحذيرات قديمة فقط)  
**حالة الاختبارات:** `npm run test:smoke` ✅ · `npm run test:backup` ✅  

---

## 1. Smart Habit Scheduling System

### Migration — **يجب تشغيله في Supabase**
| ملف | الوصف |
|-----|-------|
| `supabase/migrations/018_habit_scheduling.sql` | `frequency_type`, `frequency_value` + backfill من `active_days` |

### أنواع التكرار المدعومة
| النوع | مثال |
|-------|------|
| `daily` | قراءة كتاب — يومي |
| `weekly` | الجيم — أحد/إثنين/أربعاء/خميس/سبت |
| `monthly` | قياس الجسم — يوم 1 · مراجعة مالية — آخر يوم |
| `interval` | تسجيل الوزن — كل 7 أيام |
| `custom` | جدول مخصص عبر JSON |

### Core Engine
| ملف | الوصف |
|-----|-------|
| `src/lib/habits/schedule.ts` | `isHabitDueOnDate`, `getMissedHabits`, `formatScheduleLabel`, presets |
| `src/lib/habits/intelligence.ts` | `scheduleLabel`, `dueToday`, adherence حسب الجدول |
| `src/lib/dashboard/snapshot.ts` | Today's Habits + Missed Habits في الـ snapshot |

### UI
| ملف | الوصف |
|-----|-------|
| `src/components/habits/habit-schedule-picker.tsx` | اختيار الجدول في نموذج العادة |
| `src/components/habits/habits-para-view.tsx` | تبويب اليوم يعرض `dueToday` فقط |
| `src/components/habits/habit-card.tsx` | عرض الجدول · toggle عند الاستحقاق فقط |
| `src/components/dashboard/command-center/habits-today.tsx` | Today's Habits |
| `src/components/dashboard/command-center/missed-habits.tsx` | Missed Habits مع تنبيه |

### API & Types
| ملف | تغيير |
|-----|-------|
| `src/app/api/habits/route.ts` | POST/PATCH لـ `frequencyType`, `frequencyValue` · PATCH جزئي آمن |
| `src/types/para.ts` | `scheduleLabel`, `dueToday`, `frequencyValue` |
| `src/types/lifeos.ts` | `frequencyType`, `frequencyValue` على Habit |
| `src/types/lifeos-pro.ts` | `missedHabits`, `habitsMissed` في Dashboard |
| `src/lib/year-data.ts` | تحميل حقول الجدول |

---

## 2. Weight Tracking Enhancement

| ملف | الوصف |
|-----|-------|
| `src/components/body/weight-hero-card.tsx` | تعديل الوزن الحالي يدوياً + BMI + المتبقي + التوقع |
| `src/components/body/weight-trend-panel.tsx` | اتجاه الوزن 7 / 30 / 90 يوم |
| `src/lib/body/weight-trends.ts` | فلترة السجلات وحساب المعدل |
| `src/components/body/body-coach-view.tsx` | تكامل التعديل اليدوي + PATCH `/api/weight` |

عند تسجيل أو تعديل الوزن يُحدَّث تلقائياً: Current Weight · BMI · Remaining · Progress % · ETA.

---

## 3. Modern Premium UI

| ملف | تغيير |
|-----|-------|
| `src/components/ui/card.tsx` | `rounded-2xl` · hover lift |
| `src/app/globals.css` | `.glass-premium` utility |
| `src/components/dashboard/dashboard-view.tsx` | Executive Command Center layout |

---

## 4. تشغيل Migration 018

```sql
-- في Supabase SQL Editor
-- انسخ محتوى: supabase/migrations/018_habit_scheduling.sql
```

---

## 5. Success Criteria

| # | المعيار | الحالة |
|---|---------|--------|
| 1 | العادات تدعم أي نوع تكرار | ✅ |
| 2 | التذكير حسب موعد العادة | ✅ |
| 3 | الوزن الحالي قابل للتعديل اليدوي | ✅ |
| 4 | توقع الوصول للهدف | ✅ |
| 5 | Dashboard حديث | ✅ |
| 6 | Animations (Framer Motion — جزئي على Dashboard/Habits) | ✅ |
| 7 | الأداء محمي (memo · lazy patterns موجودة) | ✅ |
| 8 | نشر على Vercel بعد الاختبارات | انظر أدناه |

---

## 6. أوامر QA

```bash
npm run lint
npm run build
npm run test:smoke
npm run test:backup
```
