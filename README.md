# TardyBell

Class schedule planner for Timpanogos High School, 2026–2027 school year.

**Live at:** [tardybell.t8rsk8s.io](https://tardybell.t8rsk8s.io)

## What it does

TardyBell helps students plan their class schedule in three steps:

1. **Pick classes** from the course catalog (163 courses across 590 sections)
2. **Rank by priority** — Must Have, Want, or If It Fits
3. **Build schedule** — the scheduler places courses using a backtracking algorithm, starting with must-haves

Features:
- A-Day / B-Day alternating block schedule support
- Drag-and-drop schedule tweaking after auto-build
- Mutually exclusive course detection (e.g., US History vs AP US History)
- Junior year requirements tracker with real-time validation
- Priority-based conflict resolution with "Automagically Fix" option
- Save/load multiple schedule versions for comparison
- PDF export
- Per-student profiles with localStorage persistence
- Pre-populated completed coursework for returning students

## Tech stack

- **React 19** + **TypeScript** + **Vite 6**
- **Tailwind CSS 3.4** with custom design tokens (garden, gold, berry, parchment)
- **@dnd-kit** for drag-and-drop
- **jsPDF** for PDF export
- **Azure Static Web Apps** via GitHub Actions

## Development

```bash
cd schedule-planner-app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

Output goes to `schedule-planner-app/dist/`.

## Deployment

Deployed automatically via GitHub Actions to Azure Static Web Apps on push to `main`.

The build footer displays the build ID, deploy timestamp (GMT + local), for traceability.

## Project structure

```
schedule-planner-app/
├── src/
│   ├── App.tsx                 # Main app with profile management
│   ├── components/
│   │   ├── BuildFooter.tsx     # Build ID + deploy timestamp
│   │   ├── ConflictModal.tsx   # Schedule conflict popup
│   │   ├── CourseBrowser.tsx   # Course catalog with filters
│   │   ├── CoursePool.tsx      # Priority-ranked course picks
│   │   ├── CompletedCoursework.tsx
│   │   ├── DraggableCourseCard.tsx
│   │   ├── DroppableSlot.tsx
│   │   ├── ExportSchedule.tsx  # PDF generation
│   │   ├── GraduationTracker.tsx
│   │   ├── HelpModal.tsx       # Welcome + help modal
│   │   ├── MobileGate.tsx      # Mobile viewport redirect
│   │   ├── ProfilePicker.tsx   # Student profile management
│   │   ├── RequirementsBar.tsx # Junior year requirement checks
│   │   ├── SavedVersions.tsx   # Version snapshots
│   │   ├── ScheduleGrid.tsx    # A/B day schedule display
│   │   └── ScheduleHeader.tsx
│   ├── data/
│   │   └── courses.json        # 590 course sections
│   ├── types/
│   │   └── schedule.ts
│   └── utils/
│       ├── courseUtils.ts
│       └── poolScheduler.ts    # Backtracking scheduler
├── public/
├── index.html
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```
