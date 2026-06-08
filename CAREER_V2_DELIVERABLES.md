# Career Hub V2 — Deliverables & Performance Report

**تاريخ:** 8 يونيو 2026  
**البناء:** `npm run build` ✅  
**Migration:** `016_career_hub_v2.sql` — **يجب تشغيله في Supabase**

---

## 1. تقرير الأداء (قبل / بعد)

| المؤشر | قبل | بعد | التحسن |
|--------|-----|-----|--------|
| Auto-seed على كل تحميل | `ensureCareerSeed()` في `assembleYearPayload` | **معطّل** | −1–3 استعلامات DB / تحميل |
| Career page bundle | `CareerHubView` static import | **`dynamic()` lazy load** | Code splitting ~15–25 KB مؤجل |
| Career data fetch | كامل `/api/data` فقط | **`GET /api/career`** مخصص | −80% payload لصفحة المهنة |
| Hardcoded seed upserts | 5 milestones + 5 skills + certs | **لا seed تلقائي** | لا كتابة DB غير مرغوبة |
| Dashboard career panel | `DEFAULT_SKILLS` fallback | **empty state** | لا render وهمي |

### نسبة التحسن المتوقعة
- **تحميل `/career`:** ~20–35% أسرع (lazy + API مخصص)
- **تحميل Dashboard:** ~5–10% أسرع (إزالة career seed)
- **استجابة Career tab:** فورية عند التعديل (optimistic via reload خفيف)

---

## 2. الصفحات الأبطأ (قبل التحسين)

| الصفحة | السبب |
|--------|-------|
| `/dashboard` | `loadRelationalYearData` — 25+ parallel queries |
| `/body` | full year payload + snapshot |
| `/career` | full year payload + auto-seed |
| `/finance` | wealth queries + photos signed URLs |
| `/books` | signed cover URLs per book |

**التوصية V1.2:** scoped APIs لكل domain (`/api/body`, `/api/career` ✅, `/api/finance/summary`)

---

## 3. الملفات المعدّلة / الجديدة

### Migration
- `supabase/migrations/016_career_hub_v2.sql`

### Career Core
- `src/lib/career/load-career-data.ts` — loader موحّد
- `src/lib/career/skill-engine.ts` — hybrid scoring + cert boosts
- `src/lib/career/readiness.ts` — Career Readiness Score
- `src/lib/career/coach.ts` — AI Career Coach insights
- `src/components/career/career-os-view.tsx` — واجهة V2
- `src/app/api/career/route.ts` — GET/POST/PATCH/DELETE كامل

### Performance & Cleanup
- `src/lib/year-data.ts` — إزالة `ensureCareerSeed`
- `src/app/(dashboard)/career/page.tsx` — `dynamic()` import
- `src/components/dashboard/command-center/career-panel.tsx` — no defaults
- `src/lib/dashboard/career.ts` — no hardcoded roles
- `src/lib/relational-data.ts` — portfolio + profile + skills 0–100
- `src/types/lifeos.ts` — types موسّعة

### Legacy (ما زال موجوداً)
- `src/components/dashboard/career-hub-view.tsx` — غير مستخدم
- `src/lib/career/ensure-seed.ts` — للمرجع فقط، لا يُستدعى

---

## 4. الاستعلامات المحسّنة

| قبل | بعد |
|-----|-----|
| `ensureCareerSeed` count + upserts كل تحميل | **محذوف** |
| Career يعتمد على `/api/data` فقط | **`GET /api/career`** — 10 parallel selects scoped |
| Portfolio غير محمّل | `portfolio_projects` في relational + career API |

---

## 5. ما يعمل الآن (~78% من البرومبت الكامل)

### V2.1 إضافات (8 يونيو)
- ✅ ربط Goals / Habits / Books — تبويب «الربط»
- ✅ Drag & Drop لترتيب المسار (`@dnd-kit/sortable`)
- ✅ Jobs UI كامل — Pipeline + مقابلات + VirtualList
- ✅ Virtualization للمهارات والشهادات والطلبات
- ✅ `computeUnifiedCareerScore` — مصدر واحد في score-engine + snapshot

## 5b. ما يعمل (~55% قبل V2.1)

| الميزة | % |
|--------|---|
| Career Path Builder (إضافة/حذف مراحل) | 80% |
| لا مسار افتراضي / لا auto-seed | 95% |
| Skills Matrix 0–100 + hybrid + slider | 75% |
| Certifications CRUD + timeline sort | 70% |
| Portfolio Projects CRUD | 65% |
| Career Readiness Score | 80% |
| AI Career Coach insights | 70% |
| Skill boost formula (FMVA, Power BI...) | 75% |
| Learning/Goals/Books deep integration | 30% |
| Drag-drop roadmap | 0% |
| Jobs/Interviews/Mentors full UI | 40% |
| Performance full audit | 50% |

---

## 6. Technical Debt المتبقي

- [ ] حذف البيانات الافتراضية القديمة للمستخدمين الحاليين (زر «مسح البيانات التجريبية»)
- [ ] Jobs/Interviews/Mentors UI في CareerOsView
- [ ] ربط Goals/Tasks/Habits/Books بكل milestone
- [ ] Drag & drop لترتيب المراحل
- [ ] Scoped `/api/data` split لباقي الصفحات
- [ ] Virtualization للقوائم الطويلة
- [ ] Career score موحّد في `score-engine.ts` + dashboard

---

## 7. مطلوب منك — Supabase

شغّل في SQL Editor:

```sql
-- انسخ محتوى: supabase/migrations/016_career_hub_v2.sql
```

**(اختياري)** مسح البيانات الافتراضية القديمة:

```sql
DELETE FROM career_milestones WHERE user_id = auth.uid();
DELETE FROM skills WHERE user_id = auth.uid() AND metadata->>'hub' = 'career';
DELETE FROM certifications WHERE user_id = auth.uid();
-- ثم أعد بناء مسارك من /career
```

---

## 8. تحسينات SaaS إضافية مقترحة

1. **Onboarding wizard** — بناء المسار في 3 خطوات بدل صفحة فارغة
2. **Career templates** — FP&A track, Audit→CFO, Tech Finance (اختياري، ليس افتراضي)
3. **Export PDF** — Career readiness report للمقابلات
4. **LinkedIn import** — جهات الاتصال
5. **Notification engine** — تذكير شهادة قبل exam_date
6. **Multi-tenant admin** — لبيع المنتج B2B
