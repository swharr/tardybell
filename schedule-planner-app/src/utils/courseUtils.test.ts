import { describe, it, expect } from "vitest";
import {
  createEmptyScheduleGrid,
  normalizeCourseName,
  getUniqueCourses,
  groupCoursesByNormalizedName,
  buildCourseMap,
  isCourseEligibleForGrade,
  getScheduleIds,
  getSlotCourseId,
  setSlotCourseId,
  slotLabel,
  isSpecialPlacementName,
} from "./courseUtils";
import type { CourseRecord } from "@/types/schedule";

// ── Helpers ──────────────────────────────────────────────────────────

function makeCourse(overrides: Partial<CourseRecord> = {}): CourseRecord {
  return {
    id: "test-1",
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

// ── createEmptyScheduleGrid ──────────────────────────────────────────

describe("createEmptyScheduleGrid", () => {
  it("returns a grid with empty semester/day/period maps", () => {
    const grid = createEmptyScheduleGrid();
    expect(grid).toEqual({
      sem1: { A: {}, B: {} },
      sem2: { A: {}, B: {} },
    });
  });

  it("returns a fresh object each call (no shared references)", () => {
    const a = createEmptyScheduleGrid();
    const b = createEmptyScheduleGrid();
    expect(a).not.toBe(b);
    expect(a.sem1).not.toBe(b.sem1);
  });
});

// ── normalizeCourseName ──────────────────────────────────────────────

describe("normalizeCourseName", () => {
  it("lowercases and trims", () => {
    expect(normalizeCourseName("  AP History  ")).toBe("ap history");
  });

  it("replaces & with 'and'", () => {
    expect(normalizeCourseName("Arts & Crafts")).toBe("arts and crafts");
  });

  it("expands abbreviations: eng → english, lang → language, lit → literature", () => {
    expect(normalizeCourseName("Eng Lit")).toBe("english literature");
    expect(normalizeCourseName("Lang Arts")).toBe("language arts");
  });

  it("collapses whitespace", () => {
    expect(normalizeCourseName("AP   US   History")).toBe("ap us history");
  });

  it("strips special characters but keeps colons, slashes, plus signs", () => {
    expect(normalizeCourseName("Math: Level 3+")).toBe("math: level 3+");
  });

  it("handles newlines in course names", () => {
    expect(normalizeCourseName("Line1\nLine2")).toBe("line1 line2");
  });
});

// ── getUniqueCourses ─────────────────────────────────────────────────

describe("getUniqueCourses", () => {
  it("deduplicates by normalizedName and sorts alphabetically", () => {
    const courses = [
      makeCourse({ id: "1", name: "Zoology", normalizedName: "zoology" }),
      makeCourse({ id: "2", name: "Art 1", normalizedName: "art 1" }),
      makeCourse({ id: "3", name: "Art 1", normalizedName: "art 1" }),
    ];
    const result = getUniqueCourses(courses);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Art 1");
    expect(result[1].name).toBe("Zoology");
  });
});

// ── groupCoursesByNormalizedName ──────────────────────────────────────

describe("groupCoursesByNormalizedName", () => {
  it("groups courses sharing the same normalizedName", () => {
    const courses = [
      makeCourse({ id: "1", normalizedName: "math" }),
      makeCourse({ id: "2", normalizedName: "math" }),
      makeCourse({ id: "3", normalizedName: "science" }),
    ];
    const groups = groupCoursesByNormalizedName(courses);
    expect(Object.keys(groups)).toEqual(["math", "science"]);
    expect(groups["math"]).toHaveLength(2);
    expect(groups["science"]).toHaveLength(1);
  });
});

// ── buildCourseMap ───────────────────────────────────────────────────

describe("buildCourseMap", () => {
  it("maps course id → course record", () => {
    const c1 = makeCourse({ id: "abc" });
    const c2 = makeCourse({ id: "xyz" });
    const map = buildCourseMap([c1, c2]);
    expect(map["abc"]).toBe(c1);
    expect(map["xyz"]).toBe(c2);
  });
});

// ── isCourseEligibleForGrade ─────────────────────────────────────────

describe("isCourseEligibleForGrade", () => {
  const course = makeCourse({ allowedGrades: ["10", "11"] });

  it("returns true when grade is in allowedGrades", () => {
    expect(isCourseEligibleForGrade(course, "11")).toBe(true);
  });

  it("returns false when grade is not in allowedGrades", () => {
    expect(isCourseEligibleForGrade(course, "9")).toBe(false);
  });

  it("returns true when gradeProfile is null (no filter)", () => {
    expect(isCourseEligibleForGrade(course, null)).toBe(true);
  });
});

// ── getScheduleIds ───────────────────────────────────────────────────

describe("getScheduleIds", () => {
  it("collects all non-empty course IDs from the grid", () => {
    const grid = createEmptyScheduleGrid();
    grid.sem1.A[1] = "id-a";
    grid.sem2.B[3] = "id-b";
    const ids = getScheduleIds(grid);
    expect(ids).toContain("id-a");
    expect(ids).toContain("id-b");
    expect(ids).toHaveLength(2);
  });
});

// ── getSlotCourseId / setSlotCourseId ────────────────────────────────

describe("getSlotCourseId + setSlotCourseId", () => {
  it("gets null for empty slot", () => {
    const grid = createEmptyScheduleGrid();
    expect(getSlotCourseId(grid, "sem1", "A", 1)).toBeNull();
  });

  it("sets and retrieves a course id", () => {
    let grid = createEmptyScheduleGrid();
    grid = setSlotCourseId(grid, "sem1", "A", 1, "course-123");
    expect(getSlotCourseId(grid, "sem1", "A", 1)).toBe("course-123");
  });

  it("clears a slot when set to null", () => {
    let grid = createEmptyScheduleGrid();
    grid = setSlotCourseId(grid, "sem1", "A", 1, "course-123");
    grid = setSlotCourseId(grid, "sem1", "A", 1, null);
    expect(getSlotCourseId(grid, "sem1", "A", 1)).toBeNull();
  });

  it("returns a new object (immutable update)", () => {
    const grid = createEmptyScheduleGrid();
    const next = setSlotCourseId(grid, "sem1", "A", 1, "x");
    expect(next).not.toBe(grid);
    expect(grid.sem1.A[1]).toBeUndefined();
  });
});

// ── slotLabel ────────────────────────────────────────────────────────

describe("slotLabel", () => {
  it("formats day + period into human-readable label", () => {
    expect(slotLabel("A", 3)).toBe("A-Day Period 3");
    expect(slotLabel("B", 7)).toBe("B-Day Period 7");
  });
});

// ── isSpecialPlacementName ───────────────────────────────────────────

describe("isSpecialPlacementName", () => {
  it("detects release time", () => {
    expect(isSpecialPlacementName("Release Time")).toBe(true);
  });

  it("detects office aide", () => {
    expect(isSpecialPlacementName("Office Aide")).toBe(true);
  });

  it("detects teacher aide / teacher aid", () => {
    expect(isSpecialPlacementName("Teacher Aide")).toBe(true);
    expect(isSpecialPlacementName("Teacher Aid")).toBe(true);
  });

  it("returns false for regular courses", () => {
    expect(isSpecialPlacementName("AP Chemistry")).toBe(false);
    expect(isSpecialPlacementName("Algebra 2")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isSpecialPlacementName("RELEASE TIME")).toBe(true);
    expect(isSpecialPlacementName("office aide")).toBe(true);
  });
});
