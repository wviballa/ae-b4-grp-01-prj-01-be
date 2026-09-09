export class ApiError extends Error {
  constructor(statusCode, message, code = 'INTERNAL_ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = []) {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Access forbidden') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message = 'Resource conflict') {
    return new ApiError(409, message, 'CONFLICT');
  }

  static unprocessable(message = 'Unprocessable entity', details = []) {
    return new ApiError(422, message, 'UNPROCESSABLE_ENTITY', details);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, 'INTERNAL_SERVER_ERROR');
  }
}
