import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { ensureBootstrapAdmin } from './services/userService.js';
import { initTelemetry, flushTelemetry } from './services/telemetryService.js';
import { createShutdown } from './services/lifecycleService.js';
import { logger } from './config/logger.js';
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDatabase();
        await ensureBootstrapAdmin({
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD,
            fullName: process.env.ADMIN_FULL_NAME || 'Quản lý 3S',
        });
        await app.frontendReady;
        initTelemetry();
        const server = app.listen(PORT, () => logger.info({ port: PORT }, 'Máy chủ đã khởi động'));
        const shutdown = createShutdown({ server, disconnect: disconnectDatabase, flush: flushTelemetry, exit: (code: number) => { process.exitCode = code; }, logger, timeoutMs: Number(process.env.SHUTDOWN_TIMEOUT_MS || 10000) });
        process.once('SIGTERM', () => shutdown('SIGTERM', 0));
        process.once('SIGINT', () => shutdown('SIGINT', 0));
        process.once('unhandledRejection', (error) => { logger.fatal({ err: error }, 'Unhandled rejection'); shutdown('unhandledRejection', 1); });
        process.once('uncaughtException', (error) => { logger.fatal({ err: error }, 'Uncaught exception'); shutdown('uncaughtException', 1); });
    } catch (error) {
        logger.fatal({ err: error }, 'Không thể khởi động máy chủ');
        process.exitCode = 1;
    }
}

startServer();
