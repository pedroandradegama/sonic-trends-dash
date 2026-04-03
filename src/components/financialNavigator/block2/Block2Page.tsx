import { useState } from 'react';
import { FnCalendar } from './FnCalendar';
import { FnMonthSummaryStrip } from './FnMonthSummaryStrip';
import { FnConflictBanner } from './FnConflictBanner';
import { FnVoiceInput } from './FnVoiceInput';
import { useFnCalendar } from '@/hooks/useFnCalendar';

export function Block2Page() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const { buildMonthSummary } = useFnCalendar();

  const summary = buildMonthSummary(year, month);

  return (
    <div className="space-y-4 w-full">
      {summary.conflictDays.length > 0 && (
        <FnConflictBanner conflictDays={summary.conflictDays} />
      )}

      <FnMonthSummaryStrip summary={summary} year={year} month={month} />

      <FnCalendar
        year={year}
        month={month}
        onNavigate={(y, m) => { setYear(y); setMonth(m); }}
      />

      <FnVoiceInput />
    </div>
  );
}
