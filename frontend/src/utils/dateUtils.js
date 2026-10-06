/**
 * Date Utility Functions
 * Auto-computes age based on date of birth with full leap-year and month precision
 */

export const calculateAgeFromDob = (dobString) => {
  if (!dobString) return '';
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return '';
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 0 ? age : 0;
};

/**
 * Standardize clinical and operational time displays to 12-hour AM/PM format
 * E.g., "12:42:17.093" -> "12:42 PM" (or "12:42:17 PM")
 */
export const formatStandardTime = (timeStr, includeSeconds = false) => {
  if (!timeStr) return 'Not recorded';
  const str = String(timeStr).trim();
  if (!str) return 'Not recorded';

  // If already contains AM or PM
  if (str.toUpperCase().includes('AM') || str.toUpperCase().includes('PM')) {
    return str;
  }

  try {
    // If it's a full ISO datetime string (e.g. 2026-10-03T12:42:17.093)
    if (str.includes('T')) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: includeSeconds ? '2-digit' : undefined,
          hour12: true
        });
      }
    }

    // If it's a time string (e.g. "12:42:17.093", "12:42:17", "09:00")
    const withoutMs = str.split('.')[0];
    const parts = withoutMs.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      if (isNaN(hours)) return str;
      const minutes = parts[1].padStart(2, '0');
      const seconds = parts[2] ? parts[2].padStart(2, '0') : null;
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const formattedHour = String(hours).padStart(2, '0');
      return includeSeconds && seconds
        ? `${formattedHour}:${minutes}:${seconds} ${period}`
        : `${formattedHour}:${minutes} ${period}`;
    }
  } catch (err) {
    console.error('Error formatting time:', err);
  }

  return str.split('.')[0];
};

/**
 * Checks whether a given date and time is in the past compared to real-time.
 * @param {string} dateStr - 'YYYY-MM-DD' or ISO date string
 * @param {string} timeStr - 'HH:mm:ss' or 'HH:mm'
 * @returns {boolean} true if the date+time is strictly before current real-time
 */
export const isPastDateTime = (dateStr, timeStr) => {
  if (!dateStr) return false;
  const now = new Date();

  if (String(dateStr).includes('T')) {
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d < now;
  }

  const parts = String(dateStr).split('-').map(Number);
  if (parts.length < 3) return false;
  const [year, month, day] = parts;

  let hours = 23;
  let minutes = 59;
  let seconds = 59;

  if (timeStr) {
    const tParts = String(timeStr).trim().split(':').map(Number);
    if (!isNaN(tParts[0])) hours = tParts[0];
    if (!isNaN(tParts[1])) minutes = tParts[1];
    if (!isNaN(tParts[2])) seconds = tParts[2];
  }

  const target = new Date(year, month - 1, day, hours, minutes, seconds);
  return target.getTime() < now.getTime();
};

/**
 * Checks whether a specific timeslot has expired.
 */
export const isSlotExpired = (scheduleDate, slotTime, slotEndTime, slotStatus) => {
  if (slotStatus === 'EXPIRED') return true;
  if (!scheduleDate) return false;
  const checkTime = slotTime || slotEndTime;
  return isPastDateTime(scheduleDate, checkTime);
};

/**
 * Checks whether an entire consultation session has finished based on date and endTime.
 */
export const isSessionCompleted = (scheduleDate, endTime, status) => {
  if (status === 'COMPLETED') return true;
  if (!scheduleDate) return false;
  return isPastDateTime(scheduleDate, endTime);
};

/**
 * Calculates whether an appointment's 2-day (48-hour) cancellation window has expired,
 * and how many days/hours/minutes are remaining.
 * @param {string} bookingDateStr - ISO date-time string (bookingDate or createdAt)
 * @returns {{ isExpired: boolean, remainingMinutes: number, formattedRemaining: string, hoursSinceBooking: number, daysSinceBooking: number }}
 */
export const getCancellationWindowStatus = (bookingDateStr) => {
  const MAX_MINUTES = 48 * 60; // 2880 minutes (2 days / 48 hours)
  if (!bookingDateStr) return { isExpired: false, remainingMinutes: MAX_MINUTES, formattedRemaining: '2d 00h', hoursSinceBooking: 0, daysSinceBooking: 0 };
  const bookingTime = new Date(bookingDateStr).getTime();
  if (isNaN(bookingTime)) return { isExpired: false, remainingMinutes: MAX_MINUTES, formattedRemaining: '2d 00h', hoursSinceBooking: 0, daysSinceBooking: 0 };

  const now = new Date().getTime();
  const diffMs = now - bookingTime;
  const elapsedMinutes = Math.floor(diffMs / (1000 * 60));

  if (elapsedMinutes >= MAX_MINUTES) {
    return {
      isExpired: true,
      remainingMinutes: 0,
      formattedRemaining: '0m',
      hoursSinceBooking: Math.floor(elapsedMinutes / 60),
      daysSinceBooking: Math.floor(elapsedMinutes / (60 * 24))
    };
  }

  const remaining = MAX_MINUTES - elapsedMinutes;
  const remHours = Math.floor(remaining / 60);
  const remMins = remaining % 60;
  const remDays = Math.floor(remHours / 24);
  const remainingHoursInDay = remHours % 24;

  const formattedRemaining = remDays > 0
    ? `${remDays}d ${remainingHoursInDay}h`
    : `${remHours}h ${String(remMins).padStart(2, '0')}m`;

  return {
    isExpired: false,
    remainingMinutes: remaining,
    formattedRemaining,
    hoursSinceBooking: Math.floor(elapsedMinutes / 60),
    daysSinceBooking: Math.floor(elapsedMinutes / (60 * 24))
  };
};


