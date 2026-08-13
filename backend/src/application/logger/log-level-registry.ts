import pino from 'pino';
import { rootLogger } from './custom.logger';


// ============================================================================
// DYNAMIC LOG LEVELS
//
// The Winston version's setLogLevels() changes the level for the ENTIRE
// logger globally. That's a blunt instrument — in production you often want
// "turn on debug logging for just the PaymentService while investigating an
// incident, without flooding logs from every other module."
//
// This keeps a registry of every module child logger created, so levels can
// be adjusted per module at runtime (e.g., via an internal admin endpoint),
// without a redeploy.
// ============================================================================

const moduleLoggers = new Map<string, pino.Logger>();

export function createTrackedModuleLogger(moduleName: string): pino.Logger {
    if (moduleLoggers.has(moduleName)) return moduleLoggers.get(moduleName)!;

    const child = rootLogger.child({ module: moduleName });
    moduleLoggers.set(moduleName, child);
    return child;
}

/** Set level for one specific module only. */
export function setModuleLogLevel(moduleName: string, level: pino.Level): void {
    const child = moduleLoggers.get(moduleName);
    if (!child) throw new Error(`No logger registered for module "${moduleName}"`);
    child.level = level;
}

/** Set level for every registered module at once — equivalent to the Winston global setLogLevels(). */
export function setGlobalLogLevel(level: pino.Level): void {
    rootLogger.level = level;
    for (const child of moduleLoggers.values()) {
        child.level = level;
    }
}

export function getRegisteredModules(): string[] {
    return Array.from(moduleLoggers.keys());
}