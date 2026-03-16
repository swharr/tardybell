import { useState, useMemo, useCallback, useEffect } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { LogOut, RotateCcw, HelpCircle } from 'lucide-react';
import type { CourseRecord, DayKey, GradeProfile, Period, ScheduleGrid, SemesterKey } from '@/types/schedule';
import {
  buildCourseMap,
  createEmptyScheduleGrid,
  getScheduledNormalizedNames,
  groupCoursesByNormalizedName,
  setSlotCourseId,
} from '@/utils/courseUtils';
import { buildScheduleFromPool, detectPoolConflicts, getExclusiveConflict } from '@/utils/poolScheduler';
import { ScheduleHeader } from '@/components/ScheduleHeader';
import { CourseBrowser } from '@/components/CourseBrowser';
import { CoursePool } from '@/components/CoursePool';
import type { CoursePriority, PoolEntry } from '@/components/CoursePool';
import { ScheduleGrid as ScheduleGridComponent } from '@/components/ScheduleGrid';
import { RequirementsBar } from '@/components/RequirementsBar';
import { GraduationTracker } from '@/components/GraduationTracker';
import { CompletedCoursework } from '@/components/CompletedCoursework';
import { ExportSchedule } from '@/components/ExportSchedule';
import { ProfilePicker } from '@/components/ProfilePicker';
import type { StudentProfile } from '@/components/ProfilePicker';
import { MobileGate } from '@/components/MobileGate';
import { BuildFooter } from '@/components/BuildFooter';
import { SavedVersions } from '@/components/SavedVersions';
import type { SavedVersion } from '@/components/SavedVersions';
import { HelpModal } from '@/components/HelpModal';
import { ConflictModal } from '@/components/ConflictModal';
import coursesData from '@/data/courses.json';

const allCourses = coursesData as CourseRecord[];

// --- Abigail's pre-populated completed courses (from gradebook) ---
const ABIGAIL_COMPLETED_COURSES = [
  'secondary math 2',
  'health',
  'fitness',
  'sculpture',
  'digital photo 1',
  'sociology',
  'computer science principles',
  'english 10',
  'aquaculture 1',
  'chemistry',
  'swim team',
];

// --- Profile storage ---
const PROFILES_KEY = 'tardybell-profiles';
const ACTIVE_PROFILE_KEY = 'tardybell-active-profile';

function loadProfiles(): StudentProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? (JSON.parse(raw) as StudentProfile[]) : [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: StudentProfile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function loadActiveProfileId(): string | null {
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

function saveActiveProfileId(id: string | null) {
  if (id) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
}

// --- Per-profile schedule storage ---
type ProfileData = {
  gradeProfile: GradeProfile;
  schedule: ScheduleGrid;
  completedCourseNames: string[];
  poolEntries: PoolEntry[];
  hasSeenWelcome?: boolean;
};

function profileKey(profileId: string) {
  return `tardybell-data-${profileId}`;
}

function loadProfileData(id: string): ProfileData | null {
  try {
    const raw = localStorage.getItem(profileKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfileData & { poolCourseNames?: string[] };
    // Migration: old format had poolCourseNames as string[]
    if (parsed.poolCourseNames && !parsed.poolEntries) {
      parsed.poolEntries = parsed.poolCourseNames.map((n: string) => ({ normalizedName: n, priority: 'want' as CoursePriority }));
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveProfileData(id: string, data: ProfileData) {
  localStorage.setItem(profileKey(id), JSON.stringify(data));
}

// --- Saved versions storage ---
function versionsKey(profileId: string) {
  return `tardybell-versions-${profileId}`;
}

function loadVersions(profileId: string): SavedVersion[] {
  try {
    const raw = localStorage.getItem(versionsKey(profileId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVersions(profileId: string, versions: SavedVersion[]) {
  localStorage.setItem(versionsKey(profileId), JSON.stringify(versions));
}

// --- Schedule Builder (inner app) ---
function ScheduleBuilder({
  profile,
  onSwitchProfile,
}: {
  profile: StudentProfile;
  onSwitchProfile: () => void;
}) {
  const saved = loadProfileData(profile.id);
  const [gradeProfile, setGradeProfile] = useState<GradeProfile>(saved?.gradeProfile ?? '11');
  const [schedule, setSchedule] = useState<ScheduleGrid>(saved?.schedule ?? createEmptyScheduleGrid());
  const [poolEntries, setPoolEntries] = useState<PoolEntry[]>(saved?.poolEntries ?? []);
  const [activeDrag, setActiveDrag] = useState<{ normalizedName: string; displayName: string } | null>(null);
  const [completedCourseNames, setCompletedCourseNames] = useState<string[]>(
    saved?.completedCourseNames ?? [],
  );
  const [isScheduleBuilt, setIsScheduleBuilt] = useState(() => {
    if (!saved?.schedule) return false;
    for (const sem of ['sem1', 'sem2'] as const) {
      for (const day of ['A', 'B'] as const) {
        for (const p of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
          if (saved.schedule[sem][day][p]) return true;
        }
      }
    }
    return false;
  });
  const [buildConflicts, setBuildConflicts] = useState<string[]>([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [savedVersions, setSavedVersions] = useState<SavedVersion[]>(() => loadVersions(profile.id));
  const [isWelcome, setIsWelcome] = useState(false);

  // Auto-show welcome modal for new users
  useEffect(() => {
    if (!saved?.hasSeenWelcome) {
      setIsWelcome(true);
      setShowHelp(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const courseMap = useMemo(() => buildCourseMap(allCourses), []);
  const coursesByName = useMemo(() => groupCoursesByNormalizedName(allCourses), []);

  // Derive pool names from entries
  const poolCourseNames = useMemo(() => poolEntries.map((e) => e.normalizedName), [poolEntries]);
  const poolCourseNameSet = useMemo(() => new Set(poolCourseNames), [poolCourseNames]);

  const completedCourses = useMemo(() => {
    const uniqueByName = new Map<string, CourseRecord>();
    for (const c of allCourses) {
      if (completedCourseNames.includes(c.normalizedName) && !uniqueByName.has(c.normalizedName)) {
        uniqueByName.set(c.normalizedName, c);
      }
    }
    return Array.from(uniqueByName.values());
  }, [completedCourseNames]);

  const placedCourseNames = useMemo(
    () => getScheduledNormalizedNames(schedule, courseMap),
    [schedule, courseMap],
  );

  // Resolve pool entries to CourseRecord objects for display
  const poolCourses = useMemo(() => {
    const result: CourseRecord[] = [];
    for (const entry of poolEntries) {
      const sections = coursesByName[entry.normalizedName];
      if (sections && sections.length > 0) {
        result.push(sections[0]);
      }
    }
    return result;
  }, [poolEntries, coursesByName]);

  // Detect pool conflicts in real-time
  const poolConflicts = useMemo(
    () => detectPoolConflicts(poolCourseNames, allCourses, gradeProfile),
    [poolCourseNames, gradeProfile],
  );



  const lockedSlots = useMemo(() => {
    const locked = new Set<string>();
    for (const day of ['A', 'B'] as const) {
      const periods: Period[] = day === 'A' ? [1, 2, 3, 4] : [5, 6, 7, 8];
      for (const period of periods) {
        const sem1Id = schedule.sem1[day][period];
        const sem2Id = schedule.sem2[day][period];
        if (sem1Id && sem2Id && sem1Id === sem2Id) {
          const course = courseMap[sem1Id];
          if (course?.semester === 'Both') {
            locked.add(`sem2-${day}-${period}`);
          }
        }
      }
    }
    return locked;
  }, [schedule, courseMap]);

  // Compute valid drag target slots based on the currently dragged course
  const dragTargetSlots = useMemo(() => {
    const valid = new Set<string>();
    if (!activeDrag) return valid;
    const sections = coursesByName[activeDrag.normalizedName] ?? [];
    for (const section of sections) {
      if (section.semester === 'Both' || section.semester === 'S1') {
        if (!schedule.sem1[section.day][section.period]) {
          if (section.semester === 'Both' && schedule.sem2[section.day][section.period]) continue;
          valid.add(`sem1-${section.day}-${section.period}`);
        }
      }
      if (section.semester === 'Both' || section.semester === 'S2') {
        if (!schedule.sem2[section.day][section.period]) {
          if (section.semester === 'Both' && schedule.sem1[section.day][section.period]) continue;
          valid.add(`sem2-${section.day}-${section.period}`);
        }
      }
    }
    return valid;
  }, [activeDrag, coursesByName, schedule]);

  // Persist on changes
  useEffect(() => {
    saveProfileData(profile.id, { gradeProfile, schedule, completedCourseNames, poolEntries });
  }, [profile.id, gradeProfile, schedule, completedCourseNames, poolEntries]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // --- Pool handlers ---
  const handleTogglePool = useCallback((course: CourseRecord) => {
    setPoolEntries((prev) => {
      const existing = prev.find((e) => e.normalizedName === course.normalizedName);
      if (existing) {
        // Remove from pool
        return prev.filter((e) => e.normalizedName !== course.normalizedName);
      }
      // Check for mutually exclusive conflict — swap instead of blocking
      const prevNames = prev.map((e) => e.normalizedName);
      const conflict = getExclusiveConflict(course.normalizedName, prevNames);
      if (conflict) {
        const conflictEntry = prev.find((e) => e.normalizedName === conflict);
        const priority = conflictEntry?.priority ?? 'want';
        return [
          ...prev.filter((e) => e.normalizedName !== conflict),
          { normalizedName: course.normalizedName, priority },
        ];
      }
      return [...prev, { normalizedName: course.normalizedName, priority: 'want' as CoursePriority }];
    });
  }, []);

  const handleRemoveFromPool = useCallback((normalizedName: string) => {
    setPoolEntries((prev) => prev.filter((e) => e.normalizedName !== normalizedName));
  }, []);

  const handleChangePriority = useCallback((normalizedName: string, priority: CoursePriority) => {
    setPoolEntries((prev) =>
      prev.map((e) => (e.normalizedName === normalizedName ? { ...e, priority } : e)),
    );
  }, []);

  const handleBuildSchedule = useCallback(() => {
    // Group by priority
    const must = poolEntries.filter((e) => e.priority === 'must').map((e) => e.normalizedName);
    const want = poolEntries.filter((e) => e.priority === 'want').map((e) => e.normalizedName);
    const nice = poolEntries.filter((e) => e.priority === 'nice').map((e) => e.normalizedName);
    const allNames = [...must, ...want, ...nice];

    const result = buildScheduleFromPool(allNames, allCourses, gradeProfile, completedCourseNames, { must, want, nice });
    setSchedule(result.schedule);
    setBuildConflicts(result.conflicts);
    setIsScheduleBuilt(true);
    if (result.conflicts.length > 0) {
      setShowConflicts(true);
    }
  }, [poolEntries, gradeProfile, completedCourseNames]);

  const handleAutoFixSchedule = useCallback(() => {
    // Remove the conflicting (unplaced) courses from the pool and rebuild
    const must = poolEntries.filter((e) => e.priority === 'must').map((e) => e.normalizedName);
    const want = poolEntries.filter((e) => e.priority === 'want').map((e) => e.normalizedName);
    const nice = poolEntries.filter((e) => e.priority === 'nice').map((e) => e.normalizedName);
    const allNames = [...must, ...want, ...nice];

    const result = buildScheduleFromPool(allNames, allCourses, gradeProfile, completedCourseNames, { must, want, nice });

    // Drop unplaced courses from the pool
    const unplacedSet = new Set(result.unplaced);
    setPoolEntries((prev) => prev.filter((e) => !unplacedSet.has(e.normalizedName)));
    setSchedule(result.schedule);
    setBuildConflicts([]);
    setShowConflicts(false);
    setIsScheduleBuilt(true);
  }, [poolEntries, gradeProfile, completedCourseNames]);

  // --- Drag handlers (for tweaking after build) ---
  const placeCourseInSlot = useCallback(
    (normalizedName: string, semester: SemesterKey, day: DayKey, period: Period) => {
      const sections = coursesByName[normalizedName] ?? [];
      const matching = sections.filter(
        (s) =>
          s.period === period &&
          s.day === day &&
          (s.semester === 'Both' || s.semester === (semester === 'sem1' ? 'S1' : 'S2')),
      );
      if (matching.length === 0) return;
      const section = matching[0];
      let nextSchedule = setSlotCourseId(schedule, semester, day, period, section.id);
      if (section.semester === 'Both') {
        const otherSem: SemesterKey = semester === 'sem1' ? 'sem2' : 'sem1';
        nextSchedule = setSlotCourseId(nextSchedule, otherSem, day, period, section.id);
      }
      setSchedule(nextSchedule);
    },
    [schedule, coursesByName],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.normalizedName) {
      setActiveDrag({ normalizedName: data.normalizedName, displayName: data.displayName });
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);
      const { over } = event;
      if (!over?.data.current) return;
      const dragData = event.active.data.current;
      if (!dragData?.normalizedName) return;
      const { semester, day, period } = over.data.current as { semester: SemesterKey; day: DayKey; period: Period };
      placeCourseInSlot(dragData.normalizedName as string, semester, day, period);
    },
    [placeCourseInSlot],
  );

  const handleClickPlace = useCallback(
    (_semester: SemesterKey, _day: DayKey, _period: Period) => {
      // Click-to-place is no longer the primary flow
    },
    [],
  );

  const handleRemoveCourse = useCallback(
    (semester: SemesterKey, day: DayKey, period: Period) => {
      const courseId = schedule[semester][day][period];
      if (!courseId) return;
      const course = courseMap[courseId];
      let nextSchedule = setSlotCourseId(schedule, semester, day, period, null);
      if (course?.semester === 'Both') {
        const otherSem: SemesterKey = semester === 'sem1' ? 'sem2' : 'sem1';
        nextSchedule = setSlotCourseId(nextSchedule, otherSem, day, period, null);
      }
      setSchedule(nextSchedule);
    },
    [schedule, courseMap],
  );

  const handleGradeChange = useCallback((grade: GradeProfile) => {
    setGradeProfile(grade);
    setSchedule(createEmptyScheduleGrid());
    setPoolEntries([]);
    setIsScheduleBuilt(false);
    setBuildConflicts([]);
  }, []);

  const handleResetSchedule = useCallback(() => {
    setSchedule(createEmptyScheduleGrid());
    setPoolEntries([]);
    setIsScheduleBuilt(false);
    setBuildConflicts([]);
  }, []);

  const handleSaveVersion = useCallback((name: string) => {
    const version: SavedVersion = {
      id: Date.now().toString(),
      name,
      savedAt: new Date().toISOString(),
      schedule,
      poolEntries,
    };
    const updated = [...savedVersions, version];
    setSavedVersions(updated);
    saveVersions(profile.id, updated);
  }, [schedule, poolEntries, savedVersions, profile.id]);

  const handleLoadVersion = useCallback((version: SavedVersion) => {
    setSchedule(version.schedule);
    setPoolEntries(version.poolEntries);
    setIsScheduleBuilt(true);
    setBuildConflicts([]);
  }, []);

  const handleDeleteVersion = useCallback((id: string) => {
    const updated = savedVersions.filter((v) => v.id !== id);
    setSavedVersions(updated);
    saveVersions(profile.id, updated);
  }, [savedVersions, profile.id]);

  const handleAddCompleted = useCallback((course: CourseRecord) => {
    setCompletedCourseNames((prev) =>
      prev.includes(course.normalizedName) ? prev : [...prev, course.normalizedName],
    );
  }, []);

  const handleRemoveCompleted = useCallback((normalizedName: string) => {
    setCompletedCourseNames((prev) => prev.filter((n) => n !== normalizedName));
  }, []);

  // Empty set for validSlots (no click-to-place in new flow)
  const emptySlots = useMemo(() => new Set<string>(), []);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen flex flex-col">
        <header className="bg-garden-700 text-white shadow-lg">
          <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between">
            <ScheduleHeader gradeProfile={gradeProfile} onGradeChange={handleGradeChange} />
            <div className="flex items-center gap-3">
              <span className="text-sm text-garden-200">{profile.name}</span>
              <button
                onClick={() => { setIsWelcome(false); setShowHelp(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-garden-600 hover:bg-garden-500 rounded-lg text-sm text-garden-100 transition-colors"
                title="How it works"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Help
              </button>
              <button
                onClick={onSwitchProfile}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-garden-600 hover:bg-garden-500 rounded-lg text-sm text-garden-100 transition-colors"
                title="Switch profile"
              >
                <LogOut className="h-3.5 w-3.5" />
                Switch
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-4 flex gap-4">
          <div
            className="w-80 flex-shrink-0 hidden md:flex flex-col"
            style={{ maxHeight: 'calc(100vh - 88px)', position: 'sticky', top: '88px' }}
          >
            <CourseBrowser
              courses={allCourses}
              gradeProfile={gradeProfile}
              poolCourseNames={poolCourseNameSet}
              placedCourseNames={placedCourseNames}
              onTogglePool={handleTogglePool}
            />
          </div>

          <div className="flex-1 space-y-4">
            <RequirementsBar schedule={schedule} courseMap={courseMap} gradeProfile={gradeProfile} poolCourseNames={poolCourseNameSet} />

            <CoursePool
              poolEntries={poolEntries}
              poolCourses={poolCourses}
              conflicts={[...poolConflicts, ...buildConflicts]}
              onRemoveCourse={handleRemoveFromPool}
              onChangePriority={handleChangePriority}
              onBuildSchedule={handleBuildSchedule}
              isScheduleBuilt={isScheduleBuilt}
            />

            <ScheduleGridComponent
              schedule={schedule}
              courseMap={courseMap}
              lockedSlots={lockedSlots}
              validSlots={emptySlots}
              dragTargetSlots={dragTargetSlots}
              isDragging={!!activeDrag}
              onRemoveCourse={handleRemoveCourse}
              onClickPlace={handleClickPlace}
            />

            <div className="flex items-center gap-3">
              <ExportSchedule schedule={schedule} courseMap={courseMap} gradeProfile={gradeProfile} studentName={profile.name} />
              <button
                onClick={handleResetSchedule}
                className="flex items-center gap-1.5 px-4 py-2 bg-berry-100 text-berry-600 rounded-lg hover:bg-berry-200 transition-colors text-sm font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                JK – Reset
              </button>
            </div>

            <SavedVersions
              versions={savedVersions}
              onSave={handleSaveVersion}
              onLoad={handleLoadVersion}
              onDelete={handleDeleteVersion}
            />

            <CompletedCoursework
              allCourses={allCourses}
              completedCourses={completedCourses}
              onAddCourse={handleAddCompleted}
              onRemoveCourse={handleRemoveCompleted}
            />

            <GraduationTracker schedule={schedule} completed={completedCourses} courses={allCourses} />
          </div>
        </div>

        <BuildFooter />
      </div>

      <DragOverlay>
        {activeDrag ? (
          <div className="px-3 py-2 bg-white shadow-xl rounded-lg border-2 border-garden-400 text-sm font-medium text-slate-700 max-w-[200px] truncate">
            {activeDrag.displayName}
          </div>
        ) : null}
      </DragOverlay>
      {showConflicts && buildConflicts.length > 0 && (
        <ConflictModal conflicts={buildConflicts} onClose={() => setShowConflicts(false)} onAutoSchedule={handleAutoFixSchedule} />
      )}
      {showHelp && (
        <HelpModal
          isWelcome={isWelcome}
          onClose={() => {
            setShowHelp(false);
            if (isWelcome) {
              setIsWelcome(false);
              // Mark welcome as seen so it doesn't show again
              const current = loadProfileData(profile.id);
              saveProfileData(profile.id, {
                gradeProfile: current?.gradeProfile ?? gradeProfile,
                schedule: current?.schedule ?? schedule,
                completedCourseNames: current?.completedCourseNames ?? completedCourseNames,
                poolEntries: current?.poolEntries ?? poolEntries,
                hasSeenWelcome: true,
              });
            }
          }}
        />
      )}
    </DndContext>
  );
}

// --- Root App with Profile Management ---
export default function App() {
  const [profiles, setProfiles] = useState<StudentProfile[]>(loadProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(loadActiveProfileId);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const handleCreateProfile = useCallback((name: string) => {
    const newProfile: StudentProfile = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    saveProfiles(updated);
    setActiveProfileId(newProfile.id);
    saveActiveProfileId(newProfile.id);

    // Pre-populate Abigail's completed courses if name matches
    if (name.toLowerCase().includes('abigail') || name.toLowerCase().includes('abi')) {
      const data: ProfileData = {
        gradeProfile: '11',
        schedule: createEmptyScheduleGrid(),
        completedCourseNames: ABIGAIL_COMPLETED_COURSES,
        poolEntries: [],
      };
      saveProfileData(newProfile.id, data);
    }
  }, [profiles]);

  const handleSelectProfile = useCallback((profile: StudentProfile) => {
    setActiveProfileId(profile.id);
    saveActiveProfileId(profile.id);
  }, []);

  const handleDeleteProfile = useCallback((id: string) => {
    const updated = profiles.filter((p) => p.id !== id);
    setProfiles(updated);
    saveProfiles(updated);
    localStorage.removeItem(profileKey(id));
    if (activeProfileId === id) {
      setActiveProfileId(null);
      saveActiveProfileId(null);
    }
  }, [profiles, activeProfileId]);

  const handleSwitchProfile = useCallback(() => {
    setActiveProfileId(null);
    saveActiveProfileId(null);
  }, []);

  return (
    <>
      <MobileGate />
      <div className="hidden md:block">
        {!activeProfile ? (
          <ProfilePicker
            profiles={profiles}
            onSelectProfile={handleSelectProfile}
            onCreateProfile={handleCreateProfile}
            onDeleteProfile={handleDeleteProfile}
          />
        ) : (
          <ScheduleBuilder key={activeProfile.id} profile={activeProfile} onSwitchProfile={handleSwitchProfile} />
        )}
      </div>
    </>
  );
}
