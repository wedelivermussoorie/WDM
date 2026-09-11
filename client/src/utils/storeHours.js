/**
 * Store Operational Hours: 9:00 AM to 11:30 PM IST (Asia/Kolkata)
 * Closed Hours: 11:31 PM to 8:59 AM IST
 */

export function getStoreStatus() {
  const now = new Date();
  
  // Format current time in IST (Asia/Kolkata)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const parts = formatter.formatToParts(now);
  let hour = 0;
  let minute = 0;
  
  for (const part of parts) {
    if (part.type === 'hour') hour = parseInt(part.value, 10);
    if (part.type === 'minute') minute = parseInt(part.value, 10);
  }
  
  if (hour === 24) hour = 0;
  
  const currentMinutes = hour * 60 + minute;
  const openMinutes = 9 * 60;          // 9:00 AM = 540 min
  const closeMinutes = 23 * 60 + 30;   // 11:30 PM = 1410 min
  
  const isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  
  return {
    isOpen,
    openTimeStr: '9:00 AM',
    closeTimeStr: '11:30 PM',
  };
}

export function isStoreOpen() {
  return getStoreStatus().isOpen;
}
