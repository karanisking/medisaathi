/**
 * Returns today's date as YYYY-MM-DD in IST (UTC+5:30).
 * Use this everywhere you need today's date — never use new Date() directly.
 */
export const getTodayIST = () => {
    const now       = new Date();
    const istOffset = 330 * 60 * 1000; // IST = UTC + 5h30m
    const istDate   = new Date(now.getTime() + istOffset);
    return istDate.toISOString().slice(0, 10); // YYYY-MM-DD
  };
  
  /**
   * Returns the current hour (0-23) in IST as a string.
   * Used for hourly analytics bucketing.
   */
  export const getCurrentHourIST = () => {
    const now       = new Date();
    const istOffset = 330 * 60 * 1000;
    const istDate   = new Date(now.getTime() + istOffset);
    return String(istDate.getUTCHours());
  };
  
  /**
   * Returns a date N days ago as YYYY-MM-DD in IST.
   * Used for default date range in analytics pages.
   */
  export const daysAgo = (n) => {
    const now       = new Date();
    const istOffset = 330 * 60 * 1000;
    const istDate   = new Date(now.getTime() + istOffset - n * 24 * 60 * 60 * 1000);
    return istDate.toISOString().slice(0, 10);
  };
  
  /**
   * Format a YYYY-MM-DD string to a readable date.
   * e.g. "2025-06-15" → "15 Jun 2025"
   */
  export const formatDateStr = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${day} ${months[parseInt(month) - 1]} ${year}`;
  };
  
  /**
   * Check if a YYYY-MM-DD string is today (IST).
   */
  export const isToday = (dateStr) => {
    return dateStr === getTodayIST();
  };
  
  /**
   * Returns difference between two Date objects in minutes.
   * Rounded to 1 decimal place.
   */
  export const diffInMinutes = (start, end) => {
    if (!start) return 0;
    const ms = (end ?? new Date()) - new Date(start);
    return Math.round((ms / 60000) * 10) / 10;
  };