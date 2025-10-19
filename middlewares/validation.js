import { ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Validation Middleware
 * Validates request data against Zod schemas
 */

/**
 * Validate request body against schema
 * @param {Object} schema - Zod schema
 * @returns {Function} Express middleware
 */
export function validateBody(schema) {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Validation error', {
          path: req.path,
          errors,
          body: req.body,
        });

        return next(new ValidationError('Validation failed', errors));
      }
      next(error);
    }
  };
}

/**
 * Validate request query parameters against schema
 * @param {Object} schema - Zod schema
 * @returns {Function} Express middleware
 */
export function validateQuery(schema) {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Query validation error', {
          path: req.path,
          errors,
          query: req.query,
        });

        return next(new ValidationError('Query validation failed', errors));
      }
      next(error);
    }
  };
}

/**
 * Validate request params against schema
 * @param {Object} schema - Zod schema
 * @returns {Function} Express middleware
 */
export function validateParams(schema) {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Params validation error', {
          path: req.path,
          errors,
          params: req.params,
        });

        return next(new ValidationError('Params validation failed', errors));
      }
      next(error);
    }
  };
}

export default {
  validateBody,
  validateQuery,
  validateParams,
};

