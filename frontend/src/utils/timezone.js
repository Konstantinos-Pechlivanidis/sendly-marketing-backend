/**
 * Timezone utility functions
 * Handles conversion between shop timezone and UTC for campaign scheduling
 */

/**
 * Convert a date/time selected by the user (interpreted as shop timezone) to UTC
 * @param {Date|string} dateTime - Date object or ISO string from date picker
 * @param {string} shopTimezone - IANA timezone identifier (e.g., 'America/New_York', 'Europe/Paris')
 * @returns {string} ISO string in UTC
 */
export function convertShopTimeToUTC(dateTime, shopTimezone = 'UTC') {
  try {
    // Parse the input date/time
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    // Extract date/time components as the user selected them
    // These represent what the user wants in their shop timezone
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth is 0-indexed
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds() || 0;

    // If shop timezone is UTC, no conversion needed
    if (shopTimezone === 'UTC') {
      return new Date(Date.UTC(year, month - 1, day, hour, minute, second)).toISOString();
    }

    // Use Intl.DateTimeFormat to convert from shop timezone to UTC
    // We'll create a formatter that outputs in UTC, then parse the result
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: shopTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Find the UTC time that, when displayed in shop timezone, equals the desired time
    // We'll test UTC times around the selected time (±12 hours to handle all timezones)
    const testUTC = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    let bestMatch = testUTC;
    let foundExact = false;

    // Try a range of UTC times (±12 hours in 1-hour increments)
    for (let offsetHours = -12; offsetHours <= 12; offsetHours++) {
      const candidateUTC = new Date(testUTC.getTime() + offsetHours * 60 * 60 * 1000);
      const shopParts = formatter.formatToParts(candidateUTC);
      
      const shopYear = parseInt(shopParts.find(p => p.type === 'year').value);
      const shopMonth = parseInt(shopParts.find(p => p.type === 'month').value);
      const shopDay = parseInt(shopParts.find(p => p.type === 'day').value);
      const shopHour = parseInt(shopParts.find(p => p.type === 'hour').value);
      const shopMinute = parseInt(shopParts.find(p => p.type === 'minute').value);

      // Check if this UTC time displays as the desired shop time
      if (shopYear === year && shopMonth === month && shopDay === day &&
          shopHour === hour && shopMinute === minute) {
        bestMatch = candidateUTC;
        foundExact = true;
        break; // Found exact match
      }
    }

    // If no exact match found, try a more precise search (±2 hours in 15-minute increments)
    if (!foundExact) {
      for (let offsetMinutes = -120; offsetMinutes <= 120; offsetMinutes += 15) {
        const candidateUTC = new Date(testUTC.getTime() + offsetMinutes * 60 * 1000);
        const shopParts = formatter.formatToParts(candidateUTC);
        
        const shopYear = parseInt(shopParts.find(p => p.type === 'year').value);
        const shopMonth = parseInt(shopParts.find(p => p.type === 'month').value);
        const shopDay = parseInt(shopParts.find(p => p.type === 'day').value);
        const shopHour = parseInt(shopParts.find(p => p.type === 'hour').value);
        const shopMinute = parseInt(shopParts.find(p => p.type === 'minute').value);

        if (shopYear === year && shopMonth === month && shopDay === day &&
            shopHour === hour && shopMinute === minute) {
          bestMatch = candidateUTC;
          foundExact = true;
          break;
        }
      }
    }

    if (!foundExact) {
      console.warn('No exact timezone match found, using closest match', {
        desired: `${year}-${month}-${day} ${hour}:${minute}`,
        shopTimezone,
        using: bestMatch.toISOString(),
      });
    }

    return bestMatch.toISOString();
  } catch (error) {
    console.error('Timezone conversion error:', error);
    // Fallback: treat the date as UTC (not ideal but safe)
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return date.toISOString();
  }
}

/**
 * Convert a UTC date/time to shop timezone for display
 * @param {Date|string} utcDateTime - UTC date/time
 * @param {string} shopTimezone - IANA timezone identifier
 * @returns {Date} Date object representing the time in shop timezone
 */
export function convertUTCToShopTime(utcDateTime, shopTimezone = 'UTC') {
  try {
    const date = typeof utcDateTime === 'string' ? new Date(utcDateTime) : utcDateTime;
    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    // Use Intl.DateTimeFormat to get the time in shop timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: shopTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find(p => p.type === 'year').value);
    const month = parseInt(parts.find(p => p.type === 'month').value) - 1; // 0-indexed
    const day = parseInt(parts.find(p => p.type === 'day').value);
    const hour = parseInt(parts.find(p => p.type === 'hour').value);
    const minute = parseInt(parts.find(p => p.type === 'minute').value);
    const second = parseInt(parts.find(p => p.type === 'second').value);

    return new Date(year, month, day, hour, minute, second);
  } catch (error) {
    console.error('Timezone conversion error:', error);
    const date = typeof utcDateTime === 'string' ? new Date(utcDateTime) : utcDateTime;
    return date;
  }
}

