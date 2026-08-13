import { NextFunction, Request, Response } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Express does not automatically forward rejected promises from async
 * route handlers to the error-handling middleware — an unhandled
 * rejection in an `async (req, res) => {...}` handler would otherwise
 * hang the request or crash the process, depending on Node version.
 *
 * Wrapping every controller method in this eliminates the need for a
 * try/catch block in every single one, while still guaranteeing errors
 * reach `errorHandler`.
 */
export function asyncHandler(fn: AsyncRequestHandler) {
    return (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch(next);
    };
}
