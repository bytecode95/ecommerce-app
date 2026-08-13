/**
 * Base class for every error the application deliberately throws.
 *
 * Design decision: services and repositories throw these directly rather
 * than returning `{ success, error }` result objects. This keeps service
 * code readable (no error-checking boilerplate after every call) while
 * still giving the error-handling middleware everything it needs:
 * - `statusCode`: what HTTP status to respond with
 * - `isOperational`: true for expected, handleable errors (bad input,
 *   not found, conflict, ...); false for genuine bugs/unexpected
 *   failures. The error handler logs operational errors at `warn` and
 *   everything else at `error` with a full stack trace, so on-call
 *   engineers can tell "a customer did something invalid" apart from
 *   "something is actually broken" at a glance.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code: string;

    constructor(message: string, statusCode: number, code: string, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    public readonly details: unknown;

    constructor(message: string, details?: unknown) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'You do not have permission to perform this action') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT');
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests, please try again later') {
        super(message, 429, 'TOO_MANY_REQUESTS');
    }
}
