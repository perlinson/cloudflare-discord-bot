import { getPrismaClient } from '../client.js';

export class ChatRepository {
  constructor(env) {
    this.prisma = getPrismaClient(env);
  }

  async findSettingsByUserId(userId) {
    return this.prisma.chatSettings.findUnique({
      where: { userId },
    });
  }

  async updateSettings(userId, data) {
    return this.prisma.chatSettings.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  async addMessage(userId, role, content) {
    return this.prisma.chatMessage.create({
      data: {
        userId,
        role,
        content,
      },
    });
  }

  async getHistory(userId) {
    return this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async clearHistory(userId) {
    return this.prisma.chatMessage.deleteMany({
      where: { userId },
    });
  }
}
