import { UserRepository } from '../database/repositories/user';
import { ItemRepository } from '../database/repositories/item';
import { Logger } from '../utils/logger';

export class EconomyService {
  constructor(env) {
    this.userRepo = new UserRepository(env);
    this.itemRepo = new ItemRepository(env);
    this.logger = new Logger({ prefix: 'EconomyService' });
  }

  async getBalance(discordId) {
    let user = await this.userRepo.findByDiscordId(discordId);
    if (!user) {
      user = await this.userRepo.createUser({ discordId });
    }
    return {
      wallet: user.balance,
      bank: user.bank,
      total: user.balance + user.bank,
    };
  }

  async addBalance(discordId, amount) {
    await this.userRepo.updateBalance(discordId, amount);
    return this.getBalance(discordId);
  }

  async transfer(fromDiscordId, toDiscordId, amount) {
    const fromUser = await this.userRepo.findByDiscordId(fromDiscordId);
    if (!fromUser || fromUser.balance < amount) {
      throw new Error('Insufficient balance');
    }

    await this.userRepo.updateBalance(fromDiscordId, -amount);
    await this.userRepo.updateBalance(toDiscordId, amount);

    return {
      from: await this.getBalance(fromDiscordId),
      to: await this.getBalance(toDiscordId),
    };
  }

  async deposit(discordId, amount) {
    const user = await this.userRepo.findByDiscordId(discordId);
    if (!user || user.balance < amount) {
      throw new Error('Insufficient balance');
    }

    await this.userRepo.updateBalance(discordId, -amount);
    await this.userRepo.updateBank(discordId, amount);

    return this.getBalance(discordId);
  }

  async withdraw(discordId, amount) {
    const user = await this.userRepo.findByDiscordId(discordId);
    if (!user || user.bank < amount) {
      throw new Error('Insufficient bank balance');
    }

    await this.userRepo.updateBank(discordId, -amount);
    await this.userRepo.updateBalance(discordId, amount);

    return this.getBalance(discordId);
  }

  async claimDaily(discordId) {
    const user = await this.userRepo.findByDiscordId(discordId);
    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const lastDaily = user.lastDaily;
    if (lastDaily && now.getTime() - lastDaily.getTime() < 24 * 60 * 60 * 1000) {
      throw new Error('Daily reward already claimed');
    }

    const amount = 100; // 每日奖励金额
    await this.userRepo.updateDailyReward(discordId);
    return this.addBalance(discordId, amount);
  }

  async claimWeekly(discordId) {
    const user = await this.userRepo.findByDiscordId(discordId);
    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const lastWeekly = user.lastWeekly;
    if (lastWeekly && now.getTime() - lastWeekly.getTime() < 7 * 24 * 60 * 60 * 1000) {
      throw new Error('Weekly reward already claimed');
    }

    const amount = 500; // 每周奖励金额
    await this.userRepo.updateWeeklyReward(discordId);
    return this.addBalance(discordId, amount);
  }

  async work(discordId) {
    const amount = Math.floor(Math.random() * 50) + 50; // 50-100 之间的随机金额
    return this.addBalance(discordId, amount);
  }
}
