import { useState, useEffect } from 'react';
import { STORE_KEY } from '../utils/constants';

/**
 * Custom hook to access store information from localStorage
 * @returns {Object|null} Store info object or null if not available
 */
export function useStoreInfo() {
  const [storeInfo, setStoreInfo] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORE_KEY);
    if (stored) {
      try {
        setStoreInfo(JSON.parse(stored));
      } catch (e) {
        // Silently fail - invalid JSON in localStorage
        setStoreInfo(null);
      }
    }
  }, []);

  return storeInfo;
}

