/**
 * Test Client Helper
 * Wraps axios to provide supertest-like API for production server testing
 */

import axios from 'axios';
import { testConfig, getTestUrl, createTestHeaders } from '../config/test-config.js';

/**
 * Create a test client that mimics supertest API
 * Supports chaining: request().get('/path').set(headers)
 */
export function createTestClient(shopDomain = testConfig.testShop.shopDomain) {
  const currentHeaders = { ...createTestHeaders(shopDomain) };
  let pendingData = null;
  let pendingPath = null;
  let pendingMethod = null;

  const makeRequest = async () => {
    if (!pendingMethod || !pendingPath) {
      throw new Error('Request method and path must be set before awaiting');
    }

    const url = getTestUrl(pendingPath);
    const method = pendingMethod;
    const data = pendingData;
    const headers = { ...currentHeaders };

    // Reset for next request
    pendingMethod = null;
    pendingPath = null;
    pendingData = null;

    try {
      let response;
      const config = {
        headers,
        timeout: 10000, // 10 second timeout
      };

      switch (method) {
      case 'GET':
        response = await axios.get(url, config);
        break;
      case 'POST':
        response = await axios.post(url, data || {}, config);
        break;
      case 'PUT':
        response = await axios.put(url, data || {}, config);
        break;
      case 'DELETE':
        response = await axios.delete(url, config);
        break;
      case 'PATCH':
        response = await axios.patch(url, data || {}, config);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
      }
      return normalizeResponse(response);
    } catch (error) {
      return normalizeErrorResponse(error);
    }
  };

  const client = {
    /**
     * GET request (chainable)
     */
    get(path) {
      pendingMethod = 'GET';
      pendingPath = path;
      return this;
    },

    /**
     * POST request (chainable)
     */
    post(path, data) {
      pendingMethod = 'POST';
      pendingPath = path;
      if (data !== undefined) {
        pendingData = data;
      }
      return this;
    },

    /**
     * PUT request (chainable)
     */
    put(path, data) {
      pendingMethod = 'PUT';
      pendingPath = path;
      if (data !== undefined) {
        pendingData = data;
      }
      return this;
    },

    /**
     * DELETE request (chainable)
     */
    delete(path) {
      pendingMethod = 'DELETE';
      pendingPath = path;
      return this;
    },

    /**
     * PATCH request (chainable)
     */
    patch(path, data) {
      pendingMethod = 'PATCH';
      pendingPath = path;
      if (data !== undefined) {
        pendingData = data;
      }
      return this;
    },

    /**
     * Set header (chainable)
     */
    set(key, value) {
      if (typeof key === 'object' && value === undefined) {
        // If object is passed, merge all headers
        Object.assign(currentHeaders, key);
      } else {
        // If key-value pair is passed
        currentHeaders[key] = value;
      }
      return this;
    },

    /**
     * Send data (chainable, for POST/PUT)
     */
    send(data) {
      pendingData = data;
      return this;
    },
  };

  // Make the client awaitable by implementing then/catch
  // This allows: await request().get('/path')
  const thenable = {
    ...client,
    then(onFulfilled, onRejected) {
      return makeRequest().then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return makeRequest().catch(onRejected);
    },
  };

  return thenable;
}

/**
 * Normalize axios response to supertest-like format
 */
function normalizeResponse(axiosResponse) {
  return {
    status: axiosResponse.status,
    statusCode: axiosResponse.status,
    body: axiosResponse.data,
    headers: axiosResponse.headers,
    text: JSON.stringify(axiosResponse.data),
    ok: axiosResponse.status >= 200 && axiosResponse.status < 300,
  };
}

/**
 * Normalize axios error response
 */
function normalizeErrorResponse(error) {
  if (error.response) {
    // Server responded with error status
    return {
      status: error.response.status,
      statusCode: error.response.status,
      body: error.response.data || { success: false, error: 'request_error', message: error.message },
      headers: error.response.headers,
      text: JSON.stringify(error.response.data || {}),
      ok: false,
      error,
    };
  } else {
    // Request failed (network error, etc.)
    return {
      status: 500,
      statusCode: 500,
      body: { success: false, error: 'network_error', message: error.message },
      headers: {},
      text: JSON.stringify({ success: false, error: 'network_error', message: error.message }),
      ok: false,
      error,
    };
  }
}

/**
 * Create request helper (for compatibility with existing tests)
 * Mimics supertest's request(app) API
 */
export function request(_baseUrlOrApp) {
  // Always use production server
  // The app parameter is ignored since we're testing against production
  return createTestClient();
}

export default {
  createTestClient,
  request,
};

