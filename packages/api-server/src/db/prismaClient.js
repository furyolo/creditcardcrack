import pkg from '@prisma/client';

const { PrismaClient } = pkg;

export function createPrismaClient() {
    return new PrismaClient();
}
