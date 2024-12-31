import { getPrismaClient } from '../client';

export class UserRepository {
  constructor(env) {
    this.prisma = getPrismaClient(env);
  }

  async findByDiscordId(discordId) {
    return this.prisma.user.findUnique({
      where: { discordId },
      include: {
        chatSettings: true,
        inventory: true,
      },
    });
  }

  async createUser(data) {
    return this.prisma.user.create({
      data: {
        discordId: data.discordId,
        username: data.username,
        discriminator: data.discriminator,
        avatar: data.avatar,
      },
      include: {
        chatSettings: true,
      },
    });
  }

  async updateBalance(discordId, amount) {
    return this.prisma.user.update({
      where: { discordId },
      data: { balance: { increment: amount } },
    });
  }

  async updateBank(discordId, amount) {
    return this.prisma.user.update({
      where: { discordId },
      data: { bank: { increment: amount } },
    });
  }

  async updateXP(discordId, amount) {
    return this.prisma.user.update({
      where: { discordId },
      data: {
        xp: { increment: amount },
        messages: { increment: 1 },
        lastMessage: new Date(),
      },
    });
  }

  async updateLevel(discordId, level) {
    return this.prisma.user.update({
      where: { discordId },
      data: { level },
    });
  }

  async updateDailyReward(discordId) {
    return this.prisma.user.update({
      where: { discordId },
      data: { lastDaily: new Date() },
    });
  }

  async updateWeeklyReward(discordId) {
    return this.prisma.user.update({
      where: { discordId },
      data: { lastWeekly: new Date() },
    });
  }
}
