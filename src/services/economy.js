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
    return await this.getBalance(discordId);
  }

  async transfer(fromDiscordId, toDiscordId, amount) {
    this.logger.info('Transfer called with:', { 
      fromDiscordId, 
      toDiscordId, 
      amount, 
      type: typeof amount 
    });

    // 验证输入
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    const fromUser = await this.userRepo.findByDiscordId(fromDiscordId);
    this.logger.info('From user:', fromUser);

    if (!fromUser) {
      throw new Error('Sender not found');
    }

    if (fromUser.balance < amount) {
      throw new Error(`Insufficient balance: have ${fromUser.balance}, need ${amount}`);
    }

    await this.userRepo.updateBalance(fromDiscordId, -amount);
    await this.userRepo.updateBalance(toDiscordId, amount);

    const result = {
      from: await this.getBalance(fromDiscordId),
      to: await this.getBalance(toDiscordId)
    };
    this.logger.info('Transfer result:', result);
    return result;
  }

  async deposit(discordId, amount) {
    this.logger.info('Deposit called with:', { 
      discordId, 
      amount, 
      type: typeof amount 
    });
    
    // 验证输入
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    const user = await this.userRepo.findByDiscordId(discordId);
    this.logger.info('Found user:', user);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.balance < amount) {
      throw new Error(`Insufficient balance: have ${user.balance}, need ${amount}`);
    }

    this.logger.info('Updating balance and bank:', { 
      currentBalance: user.balance,
      currentBank: user.bank,
      amount 
    });

    await this.userRepo.updateBalance(discordId, -amount);
    await this.userRepo.updateBank(discordId, amount);

    const result = await this.getBalance(discordId);
    this.logger.info('Updated balance:', result);
    return result;
  }

  async withdraw(discordId, amount) {
    this.logger.info('Withdraw called with:', { 
      discordId, 
      amount, 
      type: typeof amount 
    });

    // 验证输入
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    const user = await this.userRepo.findByDiscordId(discordId);
    this.logger.info('Found user:', user);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.bank < amount) {
      throw new Error(`Insufficient bank balance: have ${user.bank}, need ${amount}`);
    }

    await this.userRepo.updateBank(discordId, -amount);
    await this.userRepo.updateBalance(discordId, amount);

    const result = await this.getBalance(discordId);
    this.logger.info('Updated balance:', result);
    return result;
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
    const newBalance =  await this.addBalance(discordId, amount)
    return {...newBalance, amount};
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
    const newBalance =  await this.addBalance(discordId, amount)
    return {...newBalance, amount};
  }

  async work(discordId) {
    const amount = Math.floor(Math.random() * 50) + 50; // 50-100 之间的随机金额
    const newBalance =  await this.addBalance(discordId, amount)
    return {...newBalance, amount};
  }
}
