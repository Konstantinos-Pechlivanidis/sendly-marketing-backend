import { PrismaClient } from '@prisma/client';

const prisma = global.__prisma || new PrismaClient();
if (!global.__prisma) {
  global.__prisma = prisma;
}
export default prisma;
