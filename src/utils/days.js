export const calculateDays = (start, end, holidays = []) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);

  if (e < s) return 0;

  let count = 0;
  const current = new Date(s);
  while (current <= e) {
    const dayOfWeek = current.getDay();
    const isWeeklyOff = dayOfWeek === 0;

    if (!isWeeklyOff) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};
