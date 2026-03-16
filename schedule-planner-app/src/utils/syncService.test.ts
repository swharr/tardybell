import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { pullProfile, pushProfile, deleteCloudProfile } from "./syncService";

// ── Mock fetch globally ──────────────────────────────────────────────

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── pullProfile ──────────────────────────────────────────────────────

describe("pullProfile", () => {
  it("returns parsed JSON on success", async () => {
    const data = { profile: { gradeProfile: "11" }, versions: [], updatedAt: "2026-01-01" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    });
    const result = await pullProfile("Abigail");
    expect(result).toEqual(data);
    // Verify it lowercases the name
    expect(mockFetch).toHaveBeenCalledWith("/api/profile/abigail");
  });

  it("returns null on 404", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const result = await pullProfile("nobody");
    expect(result).toBeNull();
  });

  it("returns null on non-ok status", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await pullProfile("test");
    expect(result).toBeNull();
  });

  it("returns null on network error (offline)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));
    const result = await pullProfile("test");
    expect(result).toBeNull();
  });

  it("normalizes name: trims and lowercases", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    await pullProfile("  ABIGAIL  ");
    expect(mockFetch).toHaveBeenCalledWith("/api/profile/abigail");
  });
});

// ── pushProfile ──────────────────────────────────────────────────────

describe("pushProfile", () => {
  const profile = {
    gradeProfile: "11",
    schedule: {},
    completedCourseNames: [],
    poolEntries: [],
  };

  it("returns true on success", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const result = await pushProfile("Abigail", profile, []);
    expect(result).toBe(true);
  });

  it("sends PUT with correct body", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    await pushProfile("Abigail", profile, []);
    expect(mockFetch).toHaveBeenCalledWith("/api/profile/abigail", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, versions: [] }),
    });
  });

  it("returns false on server error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await pushProfile("test", profile, []);
    expect(result).toBe(false);
  });

  it("returns false on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("offline"));
    const result = await pushProfile("test", profile, []);
    expect(result).toBe(false);
  });
});

// ── deleteCloudProfile ───────────────────────────────────────────────

describe("deleteCloudProfile", () => {
  it("calls DELETE with lowercased name", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    await deleteCloudProfile("Abigail");
    expect(mockFetch).toHaveBeenCalledWith("/api/profile/abigail", {
      method: "DELETE",
    });
  });

  it("does not throw on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("offline"));
    await expect(deleteCloudProfile("test")).resolves.toBeUndefined();
  });
});
