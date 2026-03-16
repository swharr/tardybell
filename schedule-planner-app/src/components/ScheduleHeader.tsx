import { Flower2 } from 'lucide-react';
import type { GradeProfile } from '@/types/schedule';

type Props = {
  gradeProfile: GradeProfile;
  onGradeChange: (grade: GradeProfile) => void;
};

export function ScheduleHeader({ gradeProfile, onGradeChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Flower2 className="h-8 w-8 text-gold-400" />
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">TardyBell</h1>
        <p className="text-garden-200 text-sm">Timpanogos High School &middot; 2026-2027</p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <label htmlFor="grade-select" className="text-sm text-garden-200">
          Grade:
        </label>
        <select
          id="grade-select"
          value={gradeProfile}
          onChange={(e) => onGradeChange(e.target.value as GradeProfile)}
          className="bg-garden-600 text-white border border-garden-500 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold-400"
        >
          <option value="9">Freshman (9)</option>
          <option value="10">Sophomore (10)</option>
          <option value="11">Junior (11)</option>
          <option value="12">Senior (12)</option>
        </select>
      </div>
    </div>
  );
}
