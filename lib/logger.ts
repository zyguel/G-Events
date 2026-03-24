type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const shouldLogDebug = process.env.NODE_ENV !== 'production'

function log(level: LogLevel, scope: string, message: string, meta?: unknown): void {
    if (level === 'debug' && !shouldLogDebug) {
        return
    }

    const prefix = `[${scope}] ${message}`

    if (meta === undefined) {
        console[level](prefix)
        return
    }

    console[level](prefix, meta)
}

export const logger = {
    debug(scope: string, message: string, meta?: unknown): void {
        log('debug', scope, message, meta)
    },
    info(scope: string, message: string, meta?: unknown): void {
        log('info', scope, message, meta)
    },
    warn(scope: string, message: string, meta?: unknown): void {
        log('warn', scope, message, meta)
    },
    error(scope: string, message: string, meta?: unknown): void {
        log('error', scope, message, meta)
    },
}
