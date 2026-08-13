import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, UpdateDateColumn } from 'typeorm';
import { UuidEntity } from '../../../application/database/entities/UuidEntity';
import { UserStatus, UserType } from '../domain/model/user.types';


/**
 * Column `name` is set explicitly (snake_case) on every field rather
 * than relying on a global naming strategy. This keeps the entity and
 * schema.sql readable side by side — someone auditing the DB directly
 * doesn't have to know TypeORM's camelCase-to-snake_case convention to
 * find the right column.
 */
@Entity({ name: 'users' })
export class User extends UuidEntity {
    @Column({ name: 'user_type', type: 'enum', enum: ['CUSTOMER', 'ADMIN', 'SUPERUSER'] })
    userType!: UserType;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Index('uq_users_email', { unique: true })
    @Column({ type: 'varchar', length: 255 })
    email!: string;

    @Index('uq_users_phone', { unique: true })
    @Column({ type: 'varchar', length: 32, nullable: true })
    phone!: string | null;

    @Column({ name: 'password_hash', type: 'varchar', length: 255 })
    passwordHash!: string;

    @Column({
        type: 'enum',
        enum: ['PENDING_VERIFICATION', 'ACTIVE', 'DISABLED'],
        default: 'PENDING_VERIFICATION',
    })
    status!: UserStatus;

    @CreateDateColumn({
        name: 'created_at',
        type: 'datetime',
        precision: 3,
        default: () => 'CURRENT_TIMESTAMP(3)',
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'datetime',
        precision: 3,
        default: () => 'CURRENT_TIMESTAMP(3)',
        onUpdate: 'CURRENT_TIMESTAMP(3)',
    })
    updatedAt!: Date;

    @DeleteDateColumn({
        name: 'deleted_at',
        type: 'datetime',
        precision: 3,
        nullable: true,
    })
    deletedAt!: Date | null;
}
