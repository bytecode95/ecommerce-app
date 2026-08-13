import pino from 'pino';
import { RequestContextService } from '../service/request-context.service';
import { env, isProduction } from '../../config/env';
import { createTrackedModuleLogger } from './log-level-registry';


// ============================================================================
// CORE LOGGER
//
// Key difference from the Winston/NestJS version: instead of manually
// building a context string and concatenating it into the message
// (`${message} ctx: ${ctx}`), we use pino's `mixin` hook. It runs on every
// single log call and merges its return value into the log's top-level
// JSON fields. Result: requestId/userId/tenantId are real structured
// fields (queryable in CloudWatch Insights / Datadog / ELK), not text
// buried inside a message string.
// ============================================================================

const baseOptions = {
    level: env.NODE_ENV === 'test' ? 'silent' : isProduction ? 'info' : 'debug',

    // Injects request/user context into every log line automatically —
    // this is the direct equivalent of getUserContextData() in the Winston
    // version, but structural instead of string-concatenated.
    mixin() {
        const ctx = RequestContextService.getContext();
        if (!ctx) return { context: 'system' };

        return {
            requestId: ctx.requestId,
            userId: ctx.userId ?? null,
            accessingModel: ctx.accessingModel ?? null,
        };
    },

    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            '*.password',
            '*.passwordHash',
            '*.password_hash',
            '*.otp',
            '*.otpHash',
            '*.otp_hash',
            '*.accessToken',
            '*.refreshToken',
        ],
        censor: '[REDACTED]',
    },
} satisfies pino.LoggerOptions;

export const rootLogger = isProduction
    ? pino(baseOptions)
    : pino({
        ...baseOptions,
        transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
    });

// ============================================================================
// MODULE-SCOPED LOGGERS
//
// This is the part the Winston example actually doesn't do — it hardcodes
// 'bapp' as the app name everywhere. Real per-module tagging uses pino's
// `child()` to bind a `module` field once, so every log line from that
// module is taggeded and filterable without repeating it on every call site.
//
// Usage:
//   const logger = createModuleLogger('OrderService');
//   logger.info('Order placed', { orderId });
//   // -> { level: 30, module: 'OrderService', requestId: '...', userId: '...', orderId: '...', msg: 'Order placed' }
// ============================================================================

export function createModuleLogger(moduleName: string) {
    // Delegates to the tracked registry (log-level-registry.ts) so this
    // module's level can be adjusted at runtime — see setModuleLogLevel().

    return createTrackedModuleLogger(moduleName) as pino.Logger;
}

// Also export a default logger for quick/ad-hoc use outside a specific module
export const logger = createModuleLogger('App');