import { Composition } from "remotion";
import { LifeScoreOrb } from "./compositions/life-score-orb";
import { AmbientHero } from "./compositions/ambient-hero";
import { WeeklyPulse } from "./compositions/weekly-pulse";
import { WeeklyReview } from "./compositions/weekly-review";
import { MonthlyBriefing } from "./compositions/monthly-briefing";
import { YearInReview } from "./compositions/year-in-review";
import { AchievementReveal } from "./compositions/achievement-reveal";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LifeScoreOrb"
        component={LifeScoreOrb}
        durationInFrames={90}
        fps={30}
        width={200}
        height={200}
        defaultProps={{ score: 72 }}
      />
      <Composition
        id="AmbientHero"
        component={AmbientHero}
        durationInFrames={240}
        fps={30}
        width={720}
        height={320}
      />
      <Composition
        id="WeeklyPulse"
        component={WeeklyPulse}
        durationInFrames={75}
        fps={30}
        width={360}
        height={140}
        defaultProps={{ habitPct: 65, workoutPct: 40, goalsPct: 55 }}
      />
      <Composition
        id="WeeklyReview"
        component={WeeklyReview}
        durationInFrames={150}
        fps={30}
        width={640}
        height={400}
        defaultProps={{
          weekLabel: "الأسبوع 24",
          habitsPct: 78,
          workouts: 4,
          goalsDone: 2,
          learningHours: 6,
          lifeScore: 72,
        }}
      />
      <Composition
        id="MonthlyBriefing"
        component={MonthlyBriefing}
        durationInFrames={180}
        fps={30}
        width={720}
        height={400}
        defaultProps={{
          monthLabel: "يونيو 2026",
          lifeScore: 74,
          topWin: "التزام بالعادات 85%",
          topRisk: "هدف الوزن متأخر أسبوعين",
          opportunity: "زيادة ساعات التعلم",
        }}
      />
      <Composition
        id="AchievementReveal"
        component={AchievementReveal}
        durationInFrames={45}
        fps={30}
        width={400}
        height={300}
        defaultProps={{ emoji: "🏆", title: "إنجاز!", kind: "goal" }}
      />
      <Composition
        id="YearInReview"
        component={YearInReview}
        durationInFrames={240}
        fps={30}
        width={800}
        height={480}
        defaultProps={{
          year: "2026",
          habitsCompleted: 420,
          booksRead: 8,
          weightDelta: 5,
          learningHours: 120,
          savingsTotal: 24000,
          lifeScore: 76,
        }}
      />
    </>
  );
};
