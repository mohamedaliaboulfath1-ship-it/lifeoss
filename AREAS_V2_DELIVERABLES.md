# Life Areas Intelligence Center V2 — Deliverables

**تاريخ:** 8 يونيو 2026  
**البناء:** `npm run build` ✅  
**Migration:** **لا يوجد migration جديد** — يستخدم `life_domains` + `domain_id` الموجودة

---

## 1. الهدف

تحويل `/areas` من بطاقات ثابتة إلى **Life Areas Intelligence Center** — كل مجال = مركز قيادة مستقل يجيب خلال 10 ثوانٍ:
- أين أنا الآن؟
- ماذا أعمل حالياً؟
- ما نسبة التقدم؟
- ما الذي يجب أن أفعله بعد ذلك؟
- ما الذي يؤخرني؟

---

## 2. ما تم تنفيذه

### صفحة المناطق `/areas`
- بطاقات Preview حية لكل مجال (Health Score، أهداف، عادات، مهام، كتب)
- ملخصات مخصصة حسب المجال (وزن/هدف للجسد، دخل/ادخار للمال، ساعات تعلم للتعلم)
- تنبيهات `needsAttention` من Area Coach
- متوسط صحة الحياة
- تحديث تلقائي عند العودة للتبويب (`focus` + `visibilitychange`)

### Area Dashboard `/areas/[slug]`
- 8 تبويبات: نظرة · أهداف · مهام · عادات · كتب · تعلم · علاقات · مدرب
- Area Health Score مع أسباب الدرجة
- Domain Metrics (وزن، مالية، تعلم)
- Timeline (اليوم / الأسبوع)
- AI Area Coach
- Knowledge Graph (PARA relationships)
- Goal Drill-Down (modal عند الضغط على هدف)
- Navigation بالأرقام → تبويبات + hash (`#goals`, `#tasks`, …)

### Goal Drill-Down
- Vision / Goal / Projects / Tasks / Habits / Metrics / Forecast
- يُحمّل عبر `GET /api/areas/[slug]?goalId=`

### Area Health Score
| المجال | المعادلة |
|--------|----------|
| عام | أهداف 35% + عادات 30% + مهام 20% + كتب 15% |
| الجسد | + تقدم الوزن 60% |
| المال | + الصحة المالية 70% |
| المهنة | + جاهزية مهنية 70% (عند توفرها) |
| التعلم | + bonus ساعات التعلم |

### PARA Integration
- ربط عبر `domain_id` + `goal_id` + `project_id`
- `matchesDomain()` يطابق: domain_id، area، category، cat

---

## 3. APIs الجديدة

| Endpoint | الوصف |
|----------|-------|
| `GET /api/areas/overview` | كل بطاقات Preview |
| `GET /api/areas/[slug]` | Hub كامل للمجال |
| `GET /api/areas/[slug]?goalId=` | Hub + Goal Drill-Down |
| `POST /api/areas` | إضافة مجال مخصص (موجود مسبقاً) |

---

## 4. الملفات الجديدة

### Types
- `src/types/areas.ts`

### Lib
- `src/lib/areas/match.ts` — مطابقة الكيانات بالمجال
- `src/lib/areas/scores.ts` — Area Health Score
- `src/lib/areas/coach.ts` — AI Area Coach insights
- `src/lib/areas/load-hub.ts` — تجميع البيانات (hub + overview + drill-down)

### API Routes
- `src/app/api/areas/overview/route.ts`
- `src/app/api/areas/[slug]/route.ts`

### UI Components
- `src/components/areas/areas-intelligence-view.tsx` — الصفحة الرئيسية
- `src/components/areas/area-preview-card.tsx` — بطاقة Preview
- `src/components/areas/area-hub-view.tsx` — Area Command Center
- `src/components/areas/goal-drill-down-panel.tsx` — تفاصيل الهدف
- `src/components/areas/area-knowledge-graph.tsx` — Knowledge Graph

### Routes
- `src/app/(dashboard)/areas/page.tsx` — يستخدم `AreasIntelligenceView`
- `src/app/(dashboard)/areas/[slug]/page.tsx` — يستخدم `AreaHubView`

### Legacy (غير مستخدم)
- `src/components/areas/areas-view.tsx` — الواجهة القديمة

---

## 5. Migrations

**لا migration جديد مطلوب.**

يعتمد على:
- `014_para_habit_system.sql` — PARA + habits + domain_id
- `015_body_system_v11.sql` — body metrics
- `016_career_hub_v2.sql` — career (اختياري للمهنة)

---

## 6. ما لم يُنفَّذ بالكامل (V1.1)

| البند | الحالة |
|-------|--------|
| Live optimistic updates (بدون refresh) | جزئي — refetch عند focus فقط |
| `/areas/[slug]/goals/[id]` route منفصل | modal فقط |
| Career Score في preview | يحتاج ربط `/api/career` |
| Net Worth / Subscriptions في المال | يحتاج wealth tables |
| Knowledge Graph تفاعلي (مكتبة graph) | CSS vertical layout |
| Overview performance | 8× `loadAreaHub` parallel — ثقيل |
| `domain_id` على كل CRUD APIs | جزئي — يعتمد على area/category |

---

## 7. كيفية الاستخدام

1. افتح `/areas` — شاهد ملخص كل مجال
2. اضغط على مجال → `/areas/body` (مثال)
3. اضغط على رقم (أهداف/مهام) → ينتقل للتبويب
4. اضغط على هدف → Goal Drill-Down
5. تبويب «علاقات» → Knowledge Graph
6. تبويب «مدرب» → AI Coach insights

---

## 8. نسبة الإنجاز

| الميزة | % |
|--------|---|
| Card Preview حي | 85% |
| Area Dashboard | 90% |
| Goal Drill-Down | 75% |
| Knowledge Graph | 60% |
| Area Scores | 85% |
| Area Timeline | 70% |
| AI Area Coach | 75% |
| PARA Integration | 80% |
| Live Updates | 40% |
| **الإجمالي** | **~78%** |

---

## 9. الخطوات التالية (V1.1)

1. `loadAreasOverviewLight()` — overview خفيف بدون 8× full hub
2. Supabase Realtime أو SWR mutation للتحديث الفوري
3. ربط Career Readiness Score في مجال المهنة
4. Wealth summary في مجال المال
5. Route منفصل `/areas/[slug]/goals/[id]`
6. حذف `areas-view.tsx` القديم
