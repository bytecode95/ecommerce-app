import { randomUUID } from 'node:crypto';
import { RequestHandler } from 'express';
import { RequestContextService } from '../service/request-context.service';


// ============================================================================
// Mount this FIRST, before any other middleware (including auth), so every
// downstream log call — even ones from auth middleware itself — has a
// requestId available. Auth middleware later calls
// RequestContextService.setUser() once it knows who the caller is.
// ============================================================================

export const requestContextMiddleware: RequestHandler = (req, res, next) => {
    const incomingId = req.headers['x-request-id'];
    const requestId = typeof incomingId === 'string' ? incomingId : randomUUID();

    res.setHeader('x-request-id', requestId);

    RequestContextService.run({ requestId }, () => next());
};