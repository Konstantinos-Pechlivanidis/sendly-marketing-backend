/**
 * Replace personalization placeholders in message with contact data
 * @param {string} message - Message template with placeholders
 * @param {Object} contact - Contact object with firstName, lastName, etc.
 * @returns {string} Message with placeholders replaced
 */
export function replacePlaceholders(message, contact) {
  if (!message || typeof message !== 'string') {
    return message || '';
  }

  if (!contact) {
    // If no contact data, replace with empty string or generic fallback
    return message
      .replace(/\{\{first_name\}\}/gi, '')
      .replace(/\{\{last_name\}\}/gi, '')
      .replace(/\s+/g, ' ') // Clean up extra spaces
      .trim();
  }

  // Get contact data with fallbacks
  const firstName = contact.firstName || '';
  const lastName = contact.lastName || '';

  // Replace placeholders (case-insensitive)
  let personalizedMessage = message
    .replace(/\{\{first_name\}\}/gi, firstName)
    .replace(/\{\{last_name\}\}/gi, lastName);

  // Clean up extra spaces that might result from empty replacements
  personalizedMessage = personalizedMessage.replace(/\s+/g, ' ').trim();

  return personalizedMessage;
}

