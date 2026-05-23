export const calculateDays = (start, end, holidays = []) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);

  if (e < s) return 0;

  const holidayTimes = new Set(
    holidays.map((h) => {
      const d = new Date(h.date || h);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  let count = 0;
  const current = new Date(s);
  while (current <= e) {
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayTimes.has(current.getTime());

    if (!isWeekend && !isHoliday) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};
