import { describe, it, expect } from "vitest";
import {
  getExclusiveConflict,
  buildScheduleFromPool,
  detectPoolConflicts,
} from "./poolScheduler";
import type { CourseRecord } from "@/types/schedule";

// ── Helpers ──────────────────────────────────────────────────────────

function makeCourse(overrides: Partial<CourseRecord> = {}): CourseRecord {
  return {
    id: `course-${Math.random().toString(36).slice(2, 8)}`,
    name: "Test Course",
    normalizedName: "test course",
    teacher: "Smith",
    period: 1,
    day: "A",
    semester: "Both",
    credits: 0.5,
    requirementArea: "Elective",
    allowedGrades: ["9", "10", "11", "12"],
    prerequisiteCourseNames: [],
    isSpecialPlacement: false,
    description: "",
    ...overrides,
  };
}

// ── getExclusiveConflict ─────────────────────────────────────────────

describe("getExclusiveConflict", () => {
  it("returns null when no conflict exists", () => {
    expect(getExclusiveConflict("art 1", ["art 1", "math 3"])).toBeNull();
  });

  it("detects English 11 vs AP English Language conflict", () => {
    const pool = ["english 11", "ap english language and composition"];
    expect(getExclusiveConflict("english 11", pool)).toBe(
      "ap english language and composition",
    );
  });

  it("detects US History vs AP US History conflict", () => {
    const pool = ["us history", "ap us history"];
    expect(getExclusiveConflict("us history", pool)).toBe("ap us history");
  });

  it("detects Secondary Math 3 vs Extended conflict", () => {
    const pool = ["secondary math 3", "secondary math 3 extended"];
    expect(getExclusiveConflict("secondary math 3", pool)).toBe(
      "secondary math 3 extended",
    );
  });

  it("returns null when only one from an exclusive group is present", () => {
    expect(
      getExclusiveConflict("english 11", ["english 11", "biology"]),
    ).toBeNull();
  });
});

// ── buildScheduleFromPool ────────────────────────────────────────────

describe("buildScheduleFromPool", () => {
  it("places a single course with one section", () => {
    const course = makeCourse({
      normalizedName: "art 1",
      period: 2,
      day: "A",
      semester: "Both",
    });
    const result = buildScheduleFromPool(
      ["art 1"],
      [course],
      "11",
      [],
    );
    expect(result.placed).toContain("art 1");
    expect(result.unplaced).toHaveLength(0);
    expect(result.schedule.sem1.A[2]).toBe(course.id);
  });

  it("handles conflicting courses — places what it can", () => {
    // Two courses both want period 1, day A, Both semesters
    const courseA = makeCourse({
      normalizedName: "math",
      period: 1,
      day: "A",
      semester: "Both",
    });
    const courseB = makeCourse({
      normalizedName: "science",
      period: 1,
      day: "A",
      semester: "Both",
    });
    const result = buildScheduleFromPool(
      ["math", "science"],
      [courseA, courseB],
      "11",
      [],
    );
    expect(result.placed.length + result.unplaced.length).toBe(2);
    expect(result.placed).toHaveLength(1);
    expect(result.unplaced).toHaveLength(1);
    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  it("uses priority groups (must before nice)", () => {
    // Must-have in period 1, nice-to-have also in period 1
    const must = makeCourse({
      normalizedName: "required math",
      period: 1,
      day: "A",
      semester: "Both",
    });
    const nice = makeCourse({
      normalizedName: "fun elective",
      period: 1,
      day: "A",
      semester: "Both",
    });
    const result = buildScheduleFromPool(
      ["required math", "fun elective"],
      [must, nice],
      "11",
      [],
      { must: ["required math"], want: [], nice: ["fun elective"] },
    );
    expect(result.placed).toContain("required math");
    expect(result.unplaced).toContain("fun elective");
  });

  it("returns empty schedule when no courses provided", () => {
    const result = buildScheduleFromPool([], [], "11", []);
    expect(result.placed).toHaveLength(0);
    expect(result.unplaced).toHaveLength(0);
    expect(result.schedule.sem1.A).toEqual({});
  });

  it("filters sections by grade", () => {
    const course = makeCourse({
      normalizedName: "senior seminar",
      allowedGrades: ["12"],
      period: 1,
      day: "A",
      semester: "Both",
    });
    const result = buildScheduleFromPool(
      ["senior seminar"],
      [course],
      "11", // grade 11 — not allowed
      [],
    );
    expect(result.unplaced).toContain("senior seminar");
    expect(result.placed).toHaveLength(0);
  });
});

// ── detectPoolConflicts ──────────────────────────────────────────────

describe("detectPoolConflicts", () => {
  it("warns about mutually exclusive courses", () => {
    const courses = [
      makeCourse({ normalizedName: "english 11", name: "English 11" }),
      makeCourse({
        normalizedName: "ap english language and composition",
        name: "AP English Language",
      }),
    ];
    const warnings = detectPoolConflicts(
      ["english 11", "ap english language and composition"],
      courses,
      "11",
    );
    expect(warnings.some((w) => w.includes("only need one"))).toBe(true);
  });

  it("warns about grade-ineligible courses", () => {
    const course = makeCourse({
      normalizedName: "senior only",
      name: "Senior Only",
      allowedGrades: ["12"],
    });
    const warnings = detectPoolConflicts(["senior only"], [course], "10");
    expect(warnings.some((w) => w.includes("grade level"))).toBe(true);
  });

  it("warns about single-slot time conflicts", () => {
    const a = makeCourse({
      normalizedName: "course a",
      name: "Course A",
      period: 3,
      day: "A",
      semester: "Both",
    });
    const b = makeCourse({
      normalizedName: "course b",
      name: "Course B",
      period: 3,
      day: "A",
      semester: "Both",
    });
    const warnings = detectPoolConflicts(
      ["course a", "course b"],
      [a, b],
      "11",
    );
    expect(warnings.some((w) => w.includes("same time"))).toBe(true);
  });

  it("returns no warnings for compatible courses", () => {
    const a = makeCourse({
      normalizedName: "art",
      name: "Art",
      period: 1,
      day: "A",
    });
    const b = makeCourse({
      normalizedName: "music",
      name: "Music",
      period: 2,
      day: "A",
    });
    const warnings = detectPoolConflicts(["art", "music"], [a, b], "11");
    expect(warnings).toHaveLength(0);
  });
});
