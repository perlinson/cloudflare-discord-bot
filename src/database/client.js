import { PrismaClient } from '@prisma/client/edge';
import { PrismaD1 } from '@prisma/adapter-d1';

let prisma;

export function getPrismaClient(env) {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'file:./dev.db'
        }
      },
      adapter: env.DB ? new PrismaD1(env.DB) : undefined
    });
  }
  return prisma;
}

export default getPrismaClient;
