# LifeOS — Premium Motion & Experience Architecture

**تاريخ:** 6 يونيو 2026  
**حالة البناء:** `npm run build` ✅  
**Remotion Studio:** `npm run remotion:studio`  

---

## 1. Motion Architecture (Framer Motion)

### Shared Element Transitions
| الكيان | الآلية | الملفات |
|--------|--------|---------|
| Goals | بطاقة → `/goals/[id]` | `goal-expand-context.tsx`, `premium-goal-card.tsx`, `goals-view.tsx` |
| Areas | بطاقة → `/areas/[slug]` | `area-preview-card.tsx`, `areas-intelligence-view.tsx` |
| Books | معرض → morph → نموذج التفاصيل | `books-view.tsx` (`BookGalleryCard`, `openBookWithExpand`) |
| Projects / Tasks | API جاهز (`entity: "project" \| "task"`) | `goal-expand-context.tsx` — يحتاج مسارات تفصيلية |

**Overlay:** `goal-expand-overlay.tsx` — morph مشترك لكل الكيانات.

### Layout Animations
| المكوّن | الاستخدام |
|---------|-----------|
| `LayoutAnimateList` | Areas hub، Books gallery |
| `motion.div layout` | KPI cards، Task rows، Goal cards |
| `PremiumSurface layout` | Analytics bento، Areas hero |

### Micro-Interactions
| الحدث | التأثير | الملف |
|-------|---------|-------|
| إكمال عادة | ripple + pulse + achievement burst | `habit-check.tsx`, `habits-today.tsx` |
| إكمال مهمة | HabitCheck + celebrate | `task-row.tsx` |
| KPI تحديث | scale pulse | `kpi-card.tsx`, `kpiPulse` |
| Life Score | bump عند العادة | `dashboard-view.tsx` |

### Page Transitions
| الطبقة | الملف |
|--------|-------|
| Dashboard shell | `app/(dashboard)/template.tsx` → `PageTransitionShell` |
| Per-view | `PageTransition` في analytics، admin |
| Reduced motion | `use-reduced-motion.ts` — يعطّل الحركة عند طلب المستخدم |

---

## 2. Visual Redesign

### Bento + Premium Surfaces
| الشاشة | الحالة |
|--------|--------|
| Dashboard | ✅ Bento hero + Remotion ambient |
| Analytics | ✅ Bento كامل + `ProgressJourney` + `TrendArrow` |
| Executive | ✅ Remotion Life Score orb |
| Areas Intelligence | ✅ Premium hero + layout list |
| Books | ✅ `ProgressJourney` سنوي |
| Weight | ✅ `ProgressJourney` في hero |

### Gradient System (`globals.css`)
`gradient-indigo` · `gradient-blue` · `gradient-emerald` · `gradient-purple` · `gradient-rose` · `gradient-cyan` · `gradient-orange`

### Primitives
`BentoGrid` · `ProgressRing` · `TrendArrow` · `GoalTrajectory` · `AnimatedProgress` · `PremiumSurface` · `WeightVizCard`

---

## 3. Remotion Storytelling

| التكوين | الاستخدام |
|---------|-----------|
| `WeeklyReview` | Reviews — تبويب أسبوعي/شهري/سنوي |
| `MonthlyBriefing` | Reviews + Executive |
| `YearInReview` | Reviews — تبويب سنوي |
| `LifeScoreOrb` | Dashboard + Executive |
| `AmbientHero` | Dashboard background |
| `WeeklyPulse` | Dashboard KPI strip |

**تشغيل:** `npm run remotion:studio`  
**تضمين:** `RemotionEmbed` + players في `src/components/remotion/`

---

## 4. Emotional Design

| الميزة | الملف |
|--------|-------|
| Achievement burst (streaks, goals, milestones) | `achievement-context.tsx`, `achievement-burst.tsx` |
| Progress storytelling | `progress-journey.tsx` — "أكملت X% من رحلتك" |
| Weight journey | `weight-hero-card.tsx` |
| Analytics journey | `analytics-view.tsx` |

---

## 5. UI/UX Audit — Screen by Screen

### ✅ Premium feel (P0 done)
| Route | التحسينات |
|-------|-----------|
| `/` Dashboard | Bento, Remotion, expand goals, habit micro-interactions |
| `/goals`, `/goals/[id]` | Expand transition, command center bento |
| `/analytics` | Full bento redesign, animated metrics |
| `/reviews` | Remotion recap trio |
| `/areas`, `/areas/[slug]` | Expand + PremiumSurface |
| `/books` | Gallery expand + ProgressJourney |
| `/weight` | Journey storytelling + viz |
| `/executive` | Remotion briefing |

### 🟡 Partial — still admin-adjacent (P1)
| Route | المشكلة | التوصية |
|-------|---------|---------|
| `/tasks` | قائمة ERP-style | Bento inbox + expand task panel |
| `/projects` | جدول مسطح | Kanban bento + shared expand |
| `/finance` | جداول + modal خام | Wealth bento + `MotionModal` + counter animations |
| `/workouts` | 3 modals خامة | MotionModal + completion pulse |
| `/nutrition` | modal خام | MotionModal + macro rings |
| `/habits` | modal خام | MotionModal + streak celebrations |
| `/time`, `/planner` | جدول تقليدي | Timeline bento + drag layout animate |
| `/career` | forms-heavy | Journey cards + milestone bursts |
| `/resources` | قائمة PARA | Gallery cards + expand |
| `/settings` | form panels | Segmented bento settings |

### 🔴 Admin / ERP tone (P2)
| Route | الملاحظة |
|-------|----------|
| `/admin/*` | مقصود — يبقى utilitarian |
| Raw `fixed inset-0 bg-black/80` modals | ~12 ملف — استبدال بـ `MotionModal` |
| Tables without motion | Finance transactions, career tables |

---

## 6. Performance

| القاعدة | التطبيق |
|---------|---------|
| Hardware-accelerated | `transform` / `opacity` فقط في transitions |
| Lazy Remotion | `RemotionEmbed` يحمّل Player عند العرض |
| Reduced motion | `PageTransitionShell` + `useReducedMotion` |
| Target 60 FPS | لا re-render blocking — `layout` على قوائم محدودة |

---

## 7. Key Files Index

```
src/contexts/goal-expand-context.tsx      # Universal expand transitions
src/contexts/achievement-context.tsx      # Celebration orchestration
src/components/motion/
  premium-surface.tsx · layout-animate-list.tsx · page-transition-shell.tsx
src/components/emotion/
  progress-journey.tsx · achievement-burst.tsx
src/components/reviews/remotion-recap-section.tsx
src/remotion/compositions/                # 6 cinematic compositions
src/lib/motion/                           # Tokens: card, dashboard, micro
```

---

## 8. Next Iteration (P1 backlog)

1. Task/Project detail routes + `expandCard` wiring
2. Convert remaining raw modals → `MotionModal` (nutrition, workouts, weight, habits, planner, career, body, resources)
3. Finance entry micro-interaction (counter + success glow)
4. Weight log celebration at milestone kg
5. Learning hub bento + book streak achievements
6. Commit + deploy when approved

---

*LifeOS should feel like a Personal Operating System — not a business dashboard.*
