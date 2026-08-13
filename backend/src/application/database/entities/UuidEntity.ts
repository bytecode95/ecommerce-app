import { BeforeInsert, PrimaryColumn } from "typeorm";
import { generatedId } from "../../utils/uuid";

export abstract class UuidEntity {
    @PrimaryColumn({ type: 'uuid', length: 36 })
    id!: string;

    @BeforeInsert()
    assignIdIfMissing(): void {
        if (!this.id) {
            this.id = generatedId();
        }
    }
}