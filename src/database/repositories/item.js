import { getPrismaClient } from '../client';

export class ItemRepository {
  constructor(env) {
    this.prisma = getPrismaClient(env);
  }

  async findById(id) {
    return this.prisma.item.findUnique({
      where: { id },
    });
  }

  async findByName(name) {
    return this.prisma.item.findFirst({
      where: { name },
    });
  }

  async findAll() {
    return this.prisma.item.findMany();
  }

  async findByType(type) {
    return this.prisma.item.findMany({
      where: { type },
    });
  }

  async create(data) {
    return this.prisma.item.create({
      data,
    });
  }

  async addToUser(itemId, userId) {
    return this.prisma.item.update({
      where: { id: itemId },
      data: {
        users: {
          connect: { id: userId },
        },
      },
    });
  }

  async removeFromUser(itemId, userId) {
    return this.prisma.item.update({
      where: { id: itemId },
      data: {
        users: {
          disconnect: { id: userId },
        },
      },
    });
  }
}
