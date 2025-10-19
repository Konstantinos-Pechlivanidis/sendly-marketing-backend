// Custom error classes for better error handling
export class AppError extends Error {
  constructor(message, statusCode, code = 'app_error') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'validation_error');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'authentication_error');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'authorization_error');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'not_found');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'conflict_error');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'rate_limit_error');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, message = 'External service error') {
    super(`${service}: ${message}`, 502, 'external_service_error');
    this.service = service;
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'database_error');
  }
}

export class QueueError extends AppError {
  constructor(message = 'Queue operation failed') {
    super(message, 500, 'queue_error');
  }
}

// Error response formatter
export const formatErrorResponse = (error, req) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response = {
    error: error.code || 'server_error',
    message: error.message || 'Internal server error',
    timestamp: error.timestamp || new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Add additional details in development
  if (isDevelopment) {
    response.stack = error.stack;
    response.details = error.details || [];
  }

  // Add request ID if available
  if (req.id) {
    response.requestId = req.id;
  }

  return response;
};

// Async error handler wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler
export const globalErrorHandler = (error, req, res, _next) => {
  // Import logger dynamically to avoid circular dependencies
  const { logger } = require('./logger.js');
  
  let err = error;

  // Convert non-AppError instances to AppError
  if (!(error instanceof AppError)) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      err = new ValidationError(error.message, error.details);
    } else if (error.name === 'CastError') {
      err = new ValidationError('Invalid ID format');
    } else if (error.code === '11000') {
      err = new ConflictError('Duplicate entry');
    } else if (error.name === 'JsonWebTokenError') {
      err = new AuthenticationError('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      err = new AuthenticationError('Token expired');
    } else {
      err = new AppError(error.message || 'Internal server error', 500);
    }
  }

  // Log error using logger
  logger.error('Global error handler', {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    stack: err.stack,
    requestId: req.id,
    path: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  // Send error response
  const statusCode = err.statusCode || 500;
  const response = formatErrorResponse(err, req);

  res.status(statusCode).json(response);
};

// 404 handler
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};
