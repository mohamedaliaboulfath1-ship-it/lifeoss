import { describe, it, expect } from "vitest";
import { areaHealthEngine } from "./area-health.engine";
import { lifeScoreEngine } from "./life-score.engine";
import { habitScoreEngine } from "./habit-score.engine";
import { goalProgressEngine } from "./goal-progress.engine";
import { InvestmentEntity } from "@/domains/finance/entities/finance.entity";
import { BodyMeasurementEntity } from "@/domains/body/entities/body.entity";

describe("AreaHealthEngine", () => {
  it("calculates composite area score", () => {
    const { score, reasons } = areaHealthEngine.calculate({
      domainId: "domain_discipline",
      goals: [{ progress: 80 }],
      habits: [{ adherencePct: 70 }],
      tasksDone: 3,
      tasksTotal: 5,
      booksProgress: [50],
    });
    expect(score.value).toBeGreaterThan(0);
    expect(score.value).toBeLessThanOrEqual(100);
    expect(reasons.length).toBeGreaterThan(0);
  });

  it("applies body domain override", () => {
    const { score } = areaHealthEngine.calculate({
      domainId: "domain_body",
      goals: [{ progress: 50 }],
      habits: [{ adherencePct: 50 }],
      tasksDone: 0,
      tasksTotal: 0,
      booksProgress: [],
      bodyProgress: 90,
    });
    expect(score.value).toBeGreaterThan(60);
  });
});

describe("LifeScoreEngine", () => {
  it("preserves dashboard context weights", () => {
    const score = lifeScoreEngine.calculate({
      context: "dashboard",
      habitPct: 80,
      goalPct: 70,
      nutritionPct: 60,
      workoutPct: 50,
      taskPct: 40,
      savingsPct: 30,
    });
    expect(score.value).toBe(59);
  });

  it("averages area scores in areas context", () => {
    const score = lifeScoreEngine.calculate({
      context: "areas",
      habitPct: 0,
      goalPct: 0,
      areaScores: [60, 80, 100],
    });
    expect(score.value).toBe(80);
  });
});

describe("HabitScoreEngine", () => {
  it("computes adherence from logs", () => {
    const logs = {
      h1: { "2026-06-01": true, "2026-06-02": true, "2026-06-03": false },
    };
    const pct = habitScoreEngine.adherence("h1", logs, [0, 1, 2, 3, 4, 5, 6], 7);
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });
});

describe("GoalProgressEngine", () => {
  it("calculates metric progress", () => {
    const pct = goalProgressEngine.calculateMetricProgress({
      startVal: "60",
      current: "70",
      target: "80",
    });
    expect(pct).toBe(50);
  });
});

describe("InvestmentEntity", () => {
  it("calculates ROI", () => {
    const inv = new InvestmentEntity("i1", "ETF", 1000, 1200);
    expect(inv.calculateROI()).toBe(20);
    expect(inv.gain()).toBe(200);
  });
});

describe("BodyMeasurementEntity", () => {
  it("calculates BMI", () => {
    const m = new BodyMeasurementEntity("m1", undefined, undefined, undefined, undefined, undefined, 180);
    expect(m.calculateBMI(80)).toBe(24.7);
  });
});
