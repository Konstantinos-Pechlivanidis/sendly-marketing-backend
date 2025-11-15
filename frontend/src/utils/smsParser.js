/**
 * SMS Parser Utility
 * Calculates character count, SMS parts, and handles variable tokens
 */

// GSM 7-bit character set (single byte)
// eslint-disable-next-line no-useless-escape
const GSM_7BIT_CHARS = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-.\/0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà]*$/;

// Characters that count as 2 in GSM 7-bit
const GSM_7BIT_EXTENDED = /[^{|}~€\\]/;

/**
 * Check if text uses only GSM 7-bit characters
 */
function isGSM7Bit(text) {
  return GSM_7BIT_CHARS.test(text);
}

/**
 * Count characters in SMS message
 * Returns object with character count and encoding type
 */
export function countSMSCharacters(message) {
  if (!message) {
    return {
      count: 0,
      encoding: 'GSM_7BIT',
      parts: 1,
    };
  }

  // Check if message contains GSM 7-bit only characters
  const isGSM = isGSM7Bit(message);
  const encoding = isGSM ? 'GSM_7BIT' : 'UCS2';

  // Character count
  let charCount = message.length;

  // For GSM 7-bit, extended characters count as 2
  if (isGSM) {
    // Extended characters: {, }, |, ~, €, \
    const extendedMatches = message.match(/[{}|~€\\]/g);
    if (extendedMatches) {
      charCount += extendedMatches.length;
    }
  }

  // Calculate parts
  let parts = 1;
  if (isGSM) {
    if (charCount <= 160) {
      parts = 1;
    } else if (charCount <= 306) {
      parts = 2;
    } else if (charCount <= 459) {
      parts = 3;
    } else {
      // For longer messages, each part can hold 153 characters (with UDH)
      parts = Math.ceil(charCount / 153);
    }
  } else {
    // UCS-2 encoding
    if (charCount <= 70) {
      parts = 1;
    } else if (charCount <= 134) {
      parts = 2;
    } else {
      // Each part can hold 67 characters (with UDH)
      parts = Math.ceil(charCount / 67);
    }
  }

  return {
    count: charCount,
    encoding,
    parts,
  };
}

/**
 * Extract variable tokens from message (e.g., {{first_name}}, {{discount_code}})
 */
export function extractTokens(message) {
  if (!message) return [];
  const tokenRegex = /\{\{([^}]+)\}\}/g;
  const tokens = [];
  let match;
  
  while ((match = tokenRegex.exec(message)) !== null) {
    tokens.push({
      full: match[0],
      name: match[1],
      index: match.index,
    });
  }
  
  return tokens;
}

/**
 * Format message with token highlighting info
 */
export function formatMessageWithTokens(message) {
  const tokens = extractTokens(message);
  if (tokens.length === 0) {
    return [{ type: 'text', content: message }];
  }

  const parts = [];
  let lastIndex = 0;

  tokens.forEach((token) => {
    // Add text before token
    if (token.index > lastIndex) {
      parts.push({
        type: 'text',
        content: message.substring(lastIndex, token.index),
      });
    }

    // Add token
    parts.push({
      type: 'token',
      content: token.full,
      name: token.name,
    });

    lastIndex = token.index + token.full.length;
  });

  // Add remaining text
  if (lastIndex < message.length) {
    parts.push({
      type: 'text',
      content: message.substring(lastIndex),
    });
  }

  return parts;
}

