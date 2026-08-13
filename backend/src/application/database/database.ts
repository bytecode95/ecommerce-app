import 'reflect-metadata';
import { env } from "../../config/env";
import { DataSource } from 'typeorm';
import { User } from '../../modules/auth/entities/User.entity';



export const AppDataSource = new DataSource({
    type: 'mysql',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: false,
    logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    entities: [User],
    migrations: ['src/migrations/*.ts'],
    poolSize: env.DB_CONNECTION_LIMIT,
});
