import { UserRepository } from '../database/repositories/user';
import { Logger } from '../utils/logger';

export class LevelService {
  constructor(env) {
    this.userRepo = new UserRepository(env);
    this.logger = new Logger({ prefix: 'LevelService' });
  }

  calculateXPForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level));
  }

  calculateLevelFromXP(xp) {
    return Math.floor(Math.log(xp / 100) / Math.log(1.5));
  }

  async addXP(discordId, amount) {
    const user = await this.userRepo.findByDiscordId(discordId);
    if (!user) {
      throw new Error('User not found');
    }

    const newXP = user.xp + amount;
    const currentLevel = user.level;
    const newLevel = this.calculateLevelFromXP(newXP);

    await this.userRepo.updateXP(discordId, amount);

    if (newLevel > currentLevel) {
      await this.userRepo.updateLevel(discordId, newLevel);
      return {
        levelUp: true,
        oldLevel: currentLevel,
        newLevel,
        xp: newXP,
      };
    }

    return {
      levelUp: false,
      level: currentLevel,
      xp: newXP,
    };
  }

  async getRank(discordId) {
    const user = await this.userRepo.findByDiscordId(discordId);
    if (!user) {
      throw new Error('User not found');
    }

    const xpNeeded = this.calculateXPForLevel(user.level + 1);
    return {
      level: user.level,
      xp: user.xp,
      xpNeeded,
      progress: Math.floor((user.xp / xpNeeded) * 100),
      messages: user.messages,
    };
  }

  async getLeaderboard(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const users = await this.prisma.user.findMany({
      orderBy: [
        { level: 'desc' },
        { xp: 'desc' },
      ],
      select: {
        discordId: true,
        username: true,
        level: true,
        xp: true,
        messages: true,
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.user.count();

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
