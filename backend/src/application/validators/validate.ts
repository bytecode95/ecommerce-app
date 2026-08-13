import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';
import { ValidationError } from '../errors/AppError';

interface ValidationSchemas {
    body?: ZodType;
    params?: ZodType;
    query?: ZodType;
}

export function validate(schemas: ValidationSchemas) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }

            if (schemas.params) {
                req.params = schemas.params.parse(req.params) as typeof req.params;
            }

            if (schemas.query) {
                req.query = schemas.query.parse(req.query) as typeof req.query;
            }

            next();
        } catch (err) {
            if (err instanceof ZodError) {
                next(new ValidationError('Validation failed', err.flatten()));
                return;
            }

            next(err);
        }
    };
}