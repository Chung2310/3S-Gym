import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { ensureBootstrapSuperAdmin } from './services/userService.js';
import { ensureCreditReferenceData, migrationStatus } from './services/migrationService.js';
import { initTelemetry, flushTelemetry } from './services/telemetryService.js';
import { createShutdown } from './services/lifecycleService.js';
import { logger } from './config/logger.js';
import { APP_POLICY, getEnv } from './config/env.js';
import { startAiWorkoutGenerationWorker } from './services/aiWorkoutGenerationJobService.js';
import { startAiNutritionGenerationWorker } from './services/aiNutritionGenerationJobService.js';
import { startPackageAlertScheduler, stopPackageAlertScheduler } from './services/packageAlertScheduler.js';
import { startDeletionMediaWorker, stopDeletionMediaWorker } from './services/deletionMediaService.js';

const env = getEnv();
const PORT = env.PORT;

async function startServer() {
    try {
        await connectDatabase();
        const migrations = await migrationStatus();
        if (!migrations.some((migration) => migration.version === '004-center-tenancy' && migration.status === 'APPLIED')) {
            throw new Error('Center-tenancy migration is required before the API can start. Run npm run db:migrate first.');
        }
        await ensureBootstrapSuperAdmin({
            username: env.SUPER_ADMIN_USERNAME,
            password: env.SUPER_ADMIN_PASSWORD,
            fullName: env.SUPER_ADMIN_FULL_NAME || 'Quản lý cấp cao 3S',
        });
        await ensureCreditReferenceData();
        await startAiWorkoutGenerationWorker();
        await startAiNutritionGenerationWorker();
        await startPackageAlertScheduler();
        startDeletionMediaWorker();
        await app.frontendReady;
        initTelemetry();
        const server = app.listen(PORT, () => logger.info({ port: PORT }, 'Máy chủ đã khởi động'));
        const shutdown = createShutdown({
            server,
            disconnect: async () => {
                stopPackageAlertScheduler();
                stopDeletionMediaWorker();
                await disconnectDatabase();
            },
            flush: flushTelemetry,
            exit: (code: number) => {
                process.exitCode = code;
                if (process.send) {
                    try {
                        process.send({ type: 'shutdown-complete', exitCode: code });
                    } catch {}
                }
                setImmediate(() => {
                    process.exit(code);
                });
            },
            logger,
            timeoutMs: APP_POLICY.SHUTDOWN_TIMEOUT_MS,
        });
        process.once('SIGTERM', () => shutdown('SIGTERM', 0));
        process.once('SIGINT', () => shutdown('SIGINT', 0));
        process.once('message', (message) => {
            if (typeof message === 'object' && message !== null && 'type' in message && message.type === 'shutdown') {
                void shutdown('IPC', 0);
            }
        });
        process.once('unhandledRejection', (error) => { logger.fatal({ err: error }, 'Unhandled rejection'); shutdown('unhandledRejection', 1); });
        process.once('uncaughtException', (error) => { logger.fatal({ err: error }, 'Uncaught exception'); shutdown('uncaughtException', 1); });
    } catch (error) {
        logger.fatal({ err: error }, 'Không thể khởi động máy chủ');
        await disconnectDatabase().catch(() => undefined);
        process.exitCode = 1;
    }
}

startServer();
