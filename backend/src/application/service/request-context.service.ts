import { AsyncLocalStorage } from 'node:async_hooks';

// ============================================================================
// REQUEST CONTEXT
// NestJS's RequestContextService relies on request-scoped DI under the hood.
// Express has no equivalent, so we use Node's built-in AsyncLocalStorage —
// it threads a context object through the entire async call chain of a
// single request (middleware -> controller -> service -> repository)
// without needing to pass it as a parameter through every function.
// ============================================================================

export interface RequestContext {
    requestId: string;
    userId?: string;
    accessingModel?: string;
    roles?: string[];
}

const storage = new AsyncLocalStorage<RequestContext>();

export const RequestContextService = {
    /** Called once, at the top of the request lifecycle (see middleware). */
    run<T>(context: RequestContext, callback: () => T): T {
        return storage.run(context, callback);
    },

    getContext(): RequestContext | undefined {
        return storage.getStore();
    },

    getRequestId(): string | undefined {
        return storage.getStore()?.requestId;
    },

    /**
     * Called after auth middleware resolves the user, to attach identity
     * onto the already-running context for the rest of the request.
     */
    setUser(userId: string, roles: string[]): void {
        const ctx = storage.getStore();
        if (ctx) {
            ctx.userId = userId;
            ctx.roles = roles;
        }
    },
};