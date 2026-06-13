export const SUNDAY_OFF_EMPLOYEE_IDS = Object.freeze([
  'H694',
  'H2',
  'H4',
  'H336',
  'H34',
  'H482',
  'H532',
  'H317',
  'H545',
  'H704',
  'H495',
  'H616',
  'H624',
  'H641',
  'H666',
  'H386',
  'H602',
  'H689',
]);

const normalizeEmployeeId = (employeeOrId) => {
  if (!employeeOrId) return '';
  if (typeof employeeOrId === 'string') return employeeOrId.trim().toUpperCase();
  return String(employeeOrId.employeeId || '').trim().toUpperCase();
};

export const hasSundayOff = (employeeOrId) =>
  SUNDAY_OFF_EMPLOYEE_IDS.includes(normalizeEmployeeId(employeeOrId));

export const calculateDays = (start, end, holidays = [], options = {}) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);

  if (e < s) return 0;

  let count = 0;
  const current = new Date(s);
  const sundayOff = hasSundayOff(options.employee || options.employeeId);
  while (current <= e) {
    const dayOfWeek = current.getDay();
    const isWeeklyOff = sundayOff && dayOfWeek === 0;

    if (!isWeeklyOff) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};
