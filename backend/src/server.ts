import { createApp } from "./app";
import { AppDataSource } from "./application/database/database";
import { logger } from "./application/logger/custom.logger";
import { env } from "./config/env";


async function main(): Promise<void> {

    await AppDataSource.initialize();
    logger.info('Database connection established');
    const app = createApp();
    const server = app.listen(env.PORT, () => {
        logger.info(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
    });

    server.on('error', (err) => {
        logger.error({ err }, 'Server failed to start');
        process.exit(1);
    });

}

main().catch((err) => {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
});