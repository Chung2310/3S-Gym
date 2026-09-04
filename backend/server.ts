import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { ensureBootstrapSuperAdmin } from './services/userService.js';
import { ensureCreditReferenceData } from './services/migrationService.js';
import { initTelemetry, flushTelemetry } from './services/telemetryService.js';
import { createShutdown } from './services/lifecycleService.js';
import { logger } from './config/logger.js';
import { APP_POLICY, getEnv } from './config/env.js';
import { startAiWorkoutGenerationWorker } from './services/aiWorkoutGenerationJobService.js';
const env = getEnv();
const PORT = env.PORT;

async function startServer() {
    try {
        await connectDatabase();
        await ensureBootstrapSuperAdmin({
            username: env.SUPER_ADMIN_USERNAME,
            password: env.SUPER_ADMIN_PASSWORD,
            fullName: env.SUPER_ADMIN_FULL_NAME || 'Quản lý cấp cao 3S',
        });
        await ensureCreditReferenceData();
        await startAiWorkoutGenerationWorker();
        await app.frontendReady;
        initTelemetry();
        const server = app.listen(PORT, () => logger.info({ port: PORT }, 'Máy chủ đã khởi động'));
        const shutdown = createShutdown({ server, disconnect: disconnectDatabase, flush: flushTelemetry, exit: (code: number) => { process.exitCode = code; }, logger, timeoutMs: APP_POLICY.SHUTDOWN_TIMEOUT_MS });
        process.once('SIGTERM', () => shutdown('SIGTERM', 0));
        process.once('SIGINT', () => shutdown('SIGINT', 0));
        process.once('message', (message) => {
            if (typeof message === 'object' && message !== null && 'type' in message && message.type === 'shutdown') void shutdown('IPC', 0);
        });
        process.once('unhandledRejection', (error) => { logger.fatal({ err: error }, 'Unhandled rejection'); shutdown('unhandledRejection', 1); });
        process.once('uncaughtException', (error) => { logger.fatal({ err: error }, 'Uncaught exception'); shutdown('uncaughtException', 1); });
    } catch (error) {
        logger.fatal({ err: error }, 'Không thể khởi động máy chủ');
        process.exitCode = 1;
    }
}

startServer();
