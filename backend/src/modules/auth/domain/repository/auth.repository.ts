import { EntityManager } from "typeorm";
import { AppDataSource } from "../../../../application/database/database";
import { User } from "../../entities/User.entity";
import { UserStatus, UserType } from "../model/user.types";

function userRepo(manager: EntityManager = AppDataSource.manager) {
    return manager.getRepository(User);
}

export const usersRepository = {
    async findByEmail(email: string): Promise<User | null> {
        return userRepo().findOneBy({ email });
    },

    async findByEmailOrPhone(email: string, phone: string): Promise<User | null> {
        // TypeORM's findOneBy doesn't express OR across two conditions in a
        // single object cleanly, so this uses the query builder — still
        // fully parameterized, no string concatenation.
        return userRepo()
            .createQueryBuilder('user')
            .where('user.email = :email', { email })
            .orWhere('user.phone = :phone', { phone })
            .getOne();
    },

    async findById(id: string): Promise<User | null> {
        return userRepo().findOneBy({ id });
    },

    async create(
        user: {
            id?: string;
            userType: UserType;
            name: string;
            email: string;
            phone: string;
            passwordHash: string;
            status: UserStatus;
        },
        manager?: EntityManager,
    ): Promise<User> {
        const repo = userRepo(manager);
        const entity = repo.create(user);
        return repo.save(entity);
    },

    async updateStatus(userId: string, status: UserStatus, manager?: EntityManager): Promise<void> {
        await userRepo(manager).update({ id: userId }, { status });
    },
};