const dotenv = require('dotenv');
dotenv.config();
const app = require('./app');
const { connectDatabase } = require('./services/databaseService');
const { ensureBootstrapAdmin } = require('./services/userService');
const { disconnectDatabase } = require('./services/databaseService');
const { initTelemetry, flushTelemetry } = require('./services/telemetryService');
const { createShutdown } = require('./services/lifecycleService');
const { logger } = require('./config/logger');

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDatabase(process.env.MONGODB_URI);
        await ensureBootstrapAdmin({
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD,
            fullName: process.env.ADMIN_FULL_NAME || 'Quản lý 3S',
        });
        await app.frontendReady;
        initTelemetry();
        const server = app.listen(PORT, () => logger.info({ port: PORT }, 'Máy chủ đã khởi động'));
        const shutdown = createShutdown({ server, disconnect: disconnectDatabase, flush: flushTelemetry, exit: (code) => { process.exitCode = code; }, logger, timeoutMs: Number(process.env.SHUTDOWN_TIMEOUT_MS || 10000) });
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
