/**
 * Cloud sync service for TardyBell profiles.
 * Uses Azure Functions API at /api/profile/:name
 * Fails silently — localStorage is always the primary store.
 */

const API_BASE = "/api/profile";

export type CloudProfileData = {
  gradeProfile: string;
  schedule: unknown;
  completedCourseNames: string[];
  poolEntries: { normalizedName: string; priority: string }[];
  hasSeenWelcome?: boolean;
};

export type CloudVersion = {
  id: string;
  name: string;
  savedAt: string;
  schedule: unknown;
  poolEntries: { normalizedName: string; priority: string }[];
};

export type CloudResponse = {
  profile: CloudProfileData;
  versions: CloudVersion[];
  updatedAt: string;
};

export async function pullProfile(name: string): Promise<CloudResponse | null> {
  try {
    const res = await fetch(
      `${API_BASE}/${encodeURIComponent(name.toLowerCase().trim())}`,
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn(`Cloud pull failed: ${res.status}`);
      return null;
    }
    return (await res.json()) as CloudResponse;
  } catch (err) {
    console.warn("Cloud sync pull failed (offline?):", err);
    return null;
  }
}

export async function pushProfile(
  name: string,
  profile: CloudProfileData,
  versions: CloudVersion[],
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_BASE}/${encodeURIComponent(name.toLowerCase().trim())}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, versions }),
      },
    );
    if (!res.ok) {
      console.warn(`Cloud push failed: ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Cloud sync push failed (offline?):", err);
    return false;
  }
}

export async function deleteCloudProfile(name: string): Promise<void> {
  try {
    await fetch(
      `${API_BASE}/${encodeURIComponent(name.toLowerCase().trim())}`,
      { method: "DELETE" },
    );
  } catch (err) {
    console.warn("Cloud sync delete failed (offline?):", err);
  }
}
