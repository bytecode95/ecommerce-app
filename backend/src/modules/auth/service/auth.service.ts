import { withTransaction } from "../../../application/database/transaction";
import { usersRepository } from "../domain/repository/auth.repository";
import { User } from "../entities/User.entity";
import { RegisterInput } from "../validators/auth.validator";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from "../../../config/env";
import { RegisterResponseDto } from "../domain/model/auth.dto";
const BCRYPT_SALT_ROUNDS = 12;
export class AuthService {
    constructor() { }

    async register(input: RegisterInput): Promise<RegisterResponseDto> {
        const existing = await usersRepository.findByEmailOrPhone(input.email, input.phone);
        if (existing) {
            // Deliberately vague about WHICH field collided — confirming
            // "this email exists" or "this phone exists" separately would let
            // an attacker enumerate registered accounts one field at a time.
            // throw new ConflictError('An account with this email or phone already exists');
        }

        const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

        const createdUser = await withTransaction(async (manager) => {
            return usersRepository.create(
                {
                    userType: 'CUSTOMER',
                    name: input.name,
                    email: input.email,
                    phone: input.phone,
                    passwordHash,
                    status: 'ACTIVE',
                },
                manager,
            );
        });

        return {
            user: {
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                phone: createdUser.phone,
                userType: createdUser.userType,
                status: createdUser.status,
                createdAt: createdUser.createdAt.toISOString(),
            },
            message: 'Registration successful. Please verify your account with the code we sent you.',
        };
    }

    private signAccessToken(user: User): string {
        return jwt.sign(
            { sub: user.id, userType: user.userType },
            env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' },
        );
    }

    private signRefreshToken(user: User): string {
        return jwt.sign(
            { sub: user.id, tokenType: 'refresh' },
            env.JWT_REFRESH_SECRET,
            { expiresIn: '30d' },
        );
    }

}