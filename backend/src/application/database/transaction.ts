import { EntityManager } from 'typeorm';
import { AppDataSource } from './database';


/**
 * Same role `withTransaction()` played with raw mysql2: the ONE
 * sanctioned way to run a multi-step write that must be atomic (order
 * creation: decrement stock + insert order + insert order_items + clear
 * cart, once that module exists). Repository methods called inside
 * `work` should accept an optional `EntityManager` and use
 * `manager.getRepository(Entity)` instead of the module-level repository
 * when one is passed, so the whole unit of work runs on the same
 * connection/transaction.
 */
export async function withTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    return AppDataSource.transaction(work);
}
