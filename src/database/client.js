import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

let prisma;

export function getPrismaClient(env) {
  if (!prisma) {
    prisma = new PrismaClient({
      adapter: env.DB ? new PrismaD1(env.DB) : undefined
    });
  }
  return prisma;
}

export default getPrismaClient;
