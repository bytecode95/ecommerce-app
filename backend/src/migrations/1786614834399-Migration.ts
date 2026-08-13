import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1786614834399 implements MigrationInterface {
    name = 'Migration1786614834399'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`user_type\` enum ('CUSTOMER', 'ADMIN', 'SUPERUSER') NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`phone\` varchar(32) NULL, \`password_hash\` varchar(255) NOT NULL, \`status\` enum ('PENDING_VERIFICATION', 'ACTIVE', 'DISABLED') NOT NULL DEFAULT 'PENDING_VERIFICATION', \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), \`deleted_at\` datetime(3) NULL, UNIQUE INDEX \`uq_users_email\` (\`email\`), UNIQUE INDEX \`uq_users_phone\` (\`phone\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`uq_users_phone\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`uq_users_email\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
