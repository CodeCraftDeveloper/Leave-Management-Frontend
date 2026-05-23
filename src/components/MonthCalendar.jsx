import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  startOfMonth,
  startOfWeek,
  addDays,
  addMonths,
  isSameDay,
  isSameMonth,
  isBefore,
  startOfDay,
  format,
} from 'date-fns';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_CHIP_ROWS = 3;
const CHIP_ROW_HEIGHT_PX = 24;

const kindStyles = {
  'holiday': 'bg-indigo-500 text-white border border-dashed border-indigo-300',
  'leave-approved': 'bg-emerald-500 text-white',
  'leave-pending': 'bg-amber-500 text-white',
  'leave-rejected': 'bg-rose-400/70 text-white',
};

const parseDate = (d) => (d instanceof Date ? d : new Date(d));

function buildWeeks(month) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      days.push(addDays(gridStart, w * 7 + d));
    }
    weeks.push(days);
  }
  return weeks;
}

function layoutWeek(weekDays, events) {
  const weekStart = startOfDay(weekDays[0]);
  const weekEnd = startOfDay(weekDays[6]);
  const dayMs = 86_400_000;

  const intersecting = events
    .map((e) => {
      const s = startOfDay(parseDate(e.startDate));
      const en = startOfDay(parseDate(e.endDate));
      if (isNaN(s) || isNaN(en) || en < weekStart || s > weekEnd) return null;
      const startCol = Math.max(0, Math.round((s - weekStart) / dayMs));
      const endCol = Math.min(6, Math.round((en - weekStart) / dayMs));
      return { event: e, startCol, endCol };
    })
    .filter(Boolean)
    .sort((a, b) => a.startCol - b.startCol || (b.endCol - b.startCol) - (a.endCol - a.startCol));

  const laneEnds = [];
  const placed = [];
  const overflowByCol = {};

  for (const item of intersecting) {
    let lane = laneEnds.findIndex((end) => end < item.startCol);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endCol);
    } else {
      laneEnds[lane] = item.endCol;
    }
    if (lane < MAX_CHIP_ROWS - 1) {
      placed.push({ ...item, lane });
    } else {
      for (let c = item.startCol; c <= item.endCol; c++) {
        overflowByCol[c] = (overflowByCol[c] || 0) + 1;
      }
    }
  }
  return { placed, overflowByCol };
}

export default function MonthCalendar({
  events = [],
  month,
  onChangeMonth,
  onClickDay,
  disablePastDays = false,
}) {
  const today = startOfDay(new Date());
  const weeks = useMemo(() => buildWeeks(month), [month]);

  const goPrev = () => onChangeMonth(addMonths(startOfMonth(month), -1));
  const goNext = () => onChangeMonth(addMonths(startOfMonth(month), 1));
  const goToday = () => onChangeMonth(new Date());

  const monthLabel = format(month, 'MMMM yyyy');
  const isOnCurrentMonth = isSameMonth(month, today);

  const handleCellClick = (day) => {
    if (disablePastDays && isBefore(startOfDay(day), today)) return;
    const dayKey = startOfDay(day);
    const eventsOnDay = events.filter((e) => {
      const s = startOfDay(parseDate(e.startDate));
      const en = startOfDay(parseDate(e.endDate));
      if (isNaN(s) || isNaN(en)) return false;
      return s <= dayKey && dayKey <= en;
    }).sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate));
    onClickDay?.(dayKey, eventsOnDay);
  };

  return (
    <div className="select-none">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-1 sm:gap-2 mb-3">
        <button
          type="button"
          onClick={goPrev}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Previous month"
        >
          <FiChevronLeft />
        </button>
        <h3 className="min-w-0 truncate px-1 text-center text-base sm:text-lg font-semibold">{monthLabel}</h3>
        <button
          type="button"
          onClick={goNext}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Next month"
        >
          <FiChevronRight />
        </button>
        <button
          type="button"
          onClick={goToday}
          disabled={isOnCurrentMonth}
          className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Today
        </button>
      </div>

      <div className="grid grid-cols-7 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center">{d}</div>
        ))}
      </div>

      <div className="flex flex-col">
        {weeks.map((week, wi) => {
          const { placed, overflowByCol } = layoutWeek(week, events);
          return (
            <motion.div
              key={wi}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: wi * 0.02 }}
              className="relative grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 last:border-b-0 min-h-[5rem] sm:min-h-[7rem]"
            >
              {week.map((day, di) => {
                const inMonth = isSameMonth(day, month);
                const isToday = isSameDay(day, today);
                const isPast = isBefore(startOfDay(day), today);
                const disabled = disablePastDays && isPast;
                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => handleCellClick(day)}
                    disabled={disabled}
                    className={[
                      'relative text-left p-1.5 sm:p-2 border-r border-slate-100 dark:border-slate-800 last:border-r-0',
                      'transition',
                      disabled
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-end">
                      <span
                        className={[
                          'text-xs sm:text-sm w-7 h-7 inline-flex items-center justify-center rounded-full',
                          isToday
                            ? 'bg-primary-600 text-white font-semibold'
                            : inMonth
                              ? 'text-slate-700 dark:text-slate-200'
                              : 'text-slate-400 dark:text-slate-600',
                        ].join(' ')}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                  </button>
                );
              })}

              <div className="absolute inset-x-0 top-9 sm:top-10 pointer-events-none">
                {placed.map(({ event, startCol, endCol, lane }) => (
                  <div
                    key={event.id + '-' + wi}
                    className={[
                      'absolute h-5 sm:h-6 rounded text-[10px] sm:text-xs leading-5 sm:leading-6 px-1.5 truncate',
                      kindStyles[event.kind] || 'bg-slate-400 text-white',
                    ].join(' ')}
                    style={{
                      left: `calc(${(startCol / 7) * 100}% + 4px)`,
                      width: `calc(${((endCol - startCol + 1) / 7) * 100}% - 8px)`,
                      top: `${lane * CHIP_ROW_HEIGHT_PX}px`,
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {Object.entries(overflowByCol).map(([col, count]) => (
                  <div
                    key={'over-' + col}
                    className="absolute h-5 sm:h-6 text-[10px] sm:text-xs leading-5 sm:leading-6 px-1.5 text-slate-500 dark:text-slate-400 font-medium"
                    style={{
                      left: `calc(${(Number(col) / 7) * 100}% + 4px)`,
                      width: `calc(${(1 / 7) * 100}% - 8px)`,
                      top: `${(MAX_CHIP_ROWS - 1) * CHIP_ROW_HEIGHT_PX}px`,
                    }}
                  >
                    +{count} more
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
