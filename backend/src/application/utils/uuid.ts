import { randomUUID } from 'node:crypto';

export function generatedId(): string {
    return randomUUID();
}