import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env';
import { authRouter } from './modules/auth/routes/auth.routes';
import { Routes } from './application/routes.v1';

export function createApp(): Express {
    const app = express();
    app.use(express.json());
    app.use(helmet());
    app.use(
        cors({
            origin: env.CORS_ORIGIN,
            credentials: true,
        }),
    );
    app.use(compression());
    app.use(express.json({ limit: '1mb' }));
    app.use(Routes.auth.signIn, authRouter);
    return app;
}