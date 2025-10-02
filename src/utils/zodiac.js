/**
 * Utility functions for zodiac sign calculations
 * Uses UTC date parsing to avoid timezone issues
 */

export const ZODIAC_COLORS = {
  'Aries': '#ef4444',        // Red
  'Taurus': '#22c55e',       // Green
  'Gemini': '#eab308',       // Yellow
  'Cancer': '#3b82f6',       // Blue
  'Leo': '#f97316',          // Orange
  'Virgo': '#8b5cf6',        // Purple
  'Libra': '#ec4899',        // Pink
  'Scorpio': '#dc2626',      // Dark Red
  'Sagittarius': '#059669',  // Emerald
  'Capricorn': '#7c3aed',    // Violet
  'Aquarius': '#0891b2',     // Cyan
  'Pisces': '#6366f1'        // Indigo
}

/**
 * Calculate zodiac sign from date of birth
 * Uses UTC parsing to avoid timezone issues
 * @param {string} dob - Date of birth in format YYYY-MM-DD
 * @returns {string} Zodiac sign name
 */
export function calculateZodiacSign(dob) {
  if (!dob) return 'Aquarius'
  
  // Parse date string manually to avoid timezone issues
  // Format: YYYY-MM-DD
  const parts = dob.split('-')
  if (parts.length !== 3) return 'Aquarius'
  
  const month = parseInt(parts[1], 10) // 1-12
  const day = parseInt(parts[2], 10)   // 1-31
  
  // Validate month and day
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return 'Aquarius'
  }
  
  // Zodiac sign calculation
  if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return 'Aries'
  if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return 'Taurus'
  if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return 'Gemini'
  if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return 'Cancer'
  if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return 'Leo'
  if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return 'Virgo'
  if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return 'Libra'
  if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return 'Scorpio'
  if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return 'Sagittarius'
  if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return 'Capricorn'
  if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return 'Aquarius'
  if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return 'Pisces'
  
  return 'Aquarius' // Default fallback
}

/**
 * Get zodiac color for a member
 * @param {object} member - Member object with zodiacSign property
 * @returns {string} Hex color code
 */
export function getZodiacColor(member) {
  return ZODIAC_COLORS[member?.zodiacSign] || '#667eea'
}


