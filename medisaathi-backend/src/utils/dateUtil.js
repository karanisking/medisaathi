/**
 * Returns today's date as YYYY-MM-DD in IST (UTC+5:30).
 * All queue date scoping must use this — never raw Date() directly.
 */
export const getTodayIST = () => {
    const now       = new Date();
    const istOffset = 330 * 60 * 1000; // IST = UTC + 5h30m
    const istDate   = new Date(now.getTime() + istOffset);
    return istDate.toISOString().slice(0, 10); // YYYY-MM-DD
  };
  
  /**
   * Returns the current hour (0-23) in IST as a string.
   * Used as the key for hourlyTokens map in analytics.
   */
  export const getCurrentHourIST = () => {
    const now       = new Date();
    const istOffset = 330 * 60 * 1000;
    const istDate   = new Date(now.getTime() + istOffset);
    return String(istDate.getUTCHours());
  };
  
  /**
   * Returns the difference between two Date objects in minutes.
   * Rounded to 1 decimal place.
   */
  export const diffInMinutes = (start, end) => {
    const ms = (end ?? new Date()) - (start ?? new Date());
    return Math.round((ms / 60000) * 10) / 10;
  };