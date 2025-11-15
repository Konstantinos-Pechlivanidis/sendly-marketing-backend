/**
 * API Adapters
 * Transform data between frontend-friendly format and backend API format
 * This allows the backend to use database field names (camelCase) consistently
 * while the frontend can use more user-friendly field names
 */

/**
 * Transform automation data from backend API to frontend format
 * Backend returns: name, trigger, message, status (already transformed by backend)
 * This function ensures consistency and handles edge cases
 *
 * @param {Object} backendData - Automation data from backend API
 * @returns {Object} Frontend-friendly automation object
 */
export function transformAutomationFromAPI(backendData) {
  if (!backendData) return null;

  // Backend now returns frontend-friendly format, but we ensure consistency
  return {
    id: backendData.id,
    automationId: backendData.automationId,
    name: backendData.name || backendData.title || '',
    description: backendData.description || '',
    trigger: backendData.trigger || backendData.triggerEvent || '',
    message: backendData.message || backendData.userMessage || backendData.defaultMessage || '',
    status: backendData.status || (backendData.isActive ? 'active' : 'draft'),
    isSystemDefault: backendData.isSystemDefault || false,
    createdAt: backendData.createdAt,
    updatedAt: backendData.updatedAt,
    // Include original fields for reference if needed
    triggerConditions: backendData.triggerConditions || {},
  };
}

/**
 * Transform automation data from frontend format to backend API format
 * Frontend uses: name, trigger, message, status
 * Backend expects: name, trigger, message, status (for create) or userMessage, isActive (for update)
 *
 * @param {Object} frontendData - Automation data from frontend
 * @param {boolean} isUpdate - Whether this is for an update operation
 * @returns {Object} Backend-compatible automation object
 */
export function transformAutomationToAPI(frontendData, isUpdate = false) {
  if (!frontendData) return null;

  if (isUpdate) {
    // For updates, backend accepts both formats, but we send frontend-friendly format
    // Backend will transform it internally
    return {
      message: frontendData.message,
      status: frontendData.status,
      // Also support direct backend format if provided
      userMessage: frontendData.userMessage,
      isActive: frontendData.isActive,
    };
  }

  // For create, use frontend format (backend expects this)
  return {
    name: frontendData.name,
    trigger: frontendData.trigger,
    message: frontendData.message,
    status: frontendData.status,
    triggerConditions: frontendData.triggerConditions || {},
  };
}

/**
 * Transform contact data from backend API to frontend format
 * Backend returns: phoneE164 (database field)
 * Frontend form uses: phone (for better UX)
 *
 * @param {Object} backendData - Contact data from backend API
 * @returns {Object} Frontend-friendly contact object
 */
export function transformContactFromAPI(backendData) {
  if (!backendData) return null;

  return {
    ...backendData,
    // Keep phoneE164 for display, but also provide phone for form compatibility
    phone: backendData.phoneE164 || '',
  };
}

/**
 * Transform contact data from frontend format to backend API format
 * Frontend form uses: phone (user-friendly)
 * Backend expects: phoneE164 (E.164 format)
 *
 * @param {Object} frontendData - Contact data from frontend form
 * @returns {Object} Backend-compatible contact object
 */
export function transformContactToAPI(frontendData) {
  if (!frontendData) return null;

  const transformed = { ...frontendData };

  // Convert phone to phoneE164 if phone is provided
  if (transformed.phone) {
    transformed.phoneE164 = normalizePhoneToE164(transformed.phone);
    delete transformed.phone; // Remove phone field as backend expects phoneE164
  }

  return transformed;
}

/**
 * Normalize phone number to E.164 format
 * @param {string} phone - Phone number in any format
 * @returns {string} Phone number in E.164 format
 */
function normalizePhoneToE164(phone) {
  if (!phone) return phone;
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  // Ensure it starts with +
  if (!normalized.startsWith('+')) {
    normalized = `+${normalized}`;
  }
  return normalized;
}

/**
 * Transform array of automations from backend API
 * @param {Array} backendArray - Array of automation objects from backend
 * @returns {Array} Array of frontend-friendly automation objects
 */
export function transformAutomationsFromAPI(backendArray) {
  if (!Array.isArray(backendArray)) return [];
  return backendArray.map(transformAutomationFromAPI);
}

/**
 * Transform array of contacts from backend API
 * @param {Array} backendArray - Array of contact objects from backend
 * @returns {Array} Array of frontend-friendly contact objects
 */
export function transformContactsFromAPI(backendArray) {
  if (!Array.isArray(backendArray)) return [];
  return backendArray.map(transformContactFromAPI);
}

