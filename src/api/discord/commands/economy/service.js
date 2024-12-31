import { EconomyRepository } from './repository.js';
import { Logger } from '../../../../utils/logger.js';

export class EconomyService {
  constructor(env) {
    this.logger = new Logger({ prefix: 'EconomyService' });
    this.repository = new EconomyRepository(env);
    this.env = env;
    this.logger.info('Service initialized');
  }

  async initialize() {
    try {
      if (this.env.TESTING === 'true') {
        this.logger.info('Running in test mode, skipping initialization');
        return;
      }
      await this.repository.initialize();
      this.logger.info('Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize service:', error);
      throw error; 
    }
  }

  async ensureUserExists(userId, guildId) {
    try {
      this.logger.info('Ensuring user exists:', { userId, guildId });
      const userData = await this.repository.ensureUserExists(userId, guildId);
      this.logger.info('User data:', userData);
      return userData;
    } catch (error) {
      this.logger.error('Failed to ensure user exists:', error);
      throw error;
    }
  }

  async getUserBalance(userId, guildId) {
    try {
      this.logger.info('Getting user balance:', { userId, guildId });
      const balance = await this.repository.getBalance(userId, guildId);
      this.logger.info('User balance:', balance);
      return balance;
    } catch (error) {
      this.logger.error('Failed to get user balance:', error);
      throw error;
    }
  }

  async getLastDailyReward(userId, guildId) {
    try {
      this.logger.info('Getting last daily reward:', { userId, guildId });
      const userData = await this.repository.getUserData(userId, guildId);
      const lastReward = userData?.lastDailyReward ? new Date(userData.lastDailyReward) : null;
      this.logger.info('Last daily reward:', lastReward);
      return lastReward;
    } catch (error) {
      this.logger.error('Failed to get last daily reward:', error);
      throw error;
    }
  }

  async getLastWeeklyReward(userId, guildId) {
    try {
      this.logger.info('Getting last weekly reward:', { userId, guildId });
      const userData = await this.repository.getUserData(userId, guildId);
      const lastReward = userData?.lastWeeklyReward ? new Date(userData.lastWeeklyReward) : null;
      this.logger.info('Last weekly reward:', lastReward);
      return lastReward;
    } catch (error) {
      this.logger.error('Failed to get last weekly reward:', error);
      throw error;
    }
  }

  async claimDailyReward(userId, guildId) {
    try {
      this.logger.info('Claiming daily reward:', { userId, guildId });
      
      // Get last reward time
      const userData = await this.repository.getUserData(userId, guildId);
      const lastReward = userData?.lastDailyReward ? new Date(userData.lastDailyReward) : null;
      
      // Check if enough time has passed
      if (lastReward) {
        const now = new Date();
        const hoursSinceLastReward = (now - lastReward) / (1000 * 60 * 60);
        if (hoursSinceLastReward < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceLastReward);
          this.logger.info('Daily reward not available yet:', { hoursRemaining });
          return {
            success: false,
            message: `每日奖励还需要等待 ${hoursRemaining} 小时！`
          };
        }
      }

      // Give reward
      const rewardAmount = 100;
      await this.repository.updateUserData(userId, guildId, async (userData) => {
        userData.balance = (userData.balance || 0) + rewardAmount;
        userData.lastDailyReward = new Date().toISOString();
        return userData;
      });

      this.logger.info('Daily reward claimed successfully:', { rewardAmount });
      return {
        success: true,
        message: `领取了 ${rewardAmount} 金币的每日奖励！`
      };
    } catch (error) {
      this.logger.error('Failed to claim daily reward:', error);
      throw error;
    }
  }

  async claimWeeklyReward(userId, guildId) {
    try {
      this.logger.info('Claiming weekly reward:', { userId, guildId });
      
      // Get last reward time
      const userData = await this.repository.getUserData(userId, guildId);
      const lastReward = userData?.lastWeeklyReward ? new Date(userData.lastWeeklyReward) : null;
      
      // Check if enough time has passed
      if (lastReward) {
        const now = new Date();
        const hoursSinceLastReward = (now - lastReward) / (1000 * 60 * 60);
        if (hoursSinceLastReward < 168) { // 7 days * 24 hours
          const daysRemaining = Math.ceil((168 - hoursSinceLastReward) / 24);
          this.logger.info('Weekly reward not available yet:', { daysRemaining });
          return {
            success: false,
            message: `每周奖励还需要等待 ${daysRemaining} 天！`
          };
        }
      }

      // Give reward
      const rewardAmount = 500;
      await this.repository.updateUserData(userId, guildId, async (userData) => {
        userData.balance = (userData.balance || 0) + rewardAmount;
        userData.lastWeeklyReward = new Date().toISOString();
        return userData;
      });

      this.logger.info('Weekly reward claimed successfully:', { rewardAmount });
      return {
        success: true,
        message: `领取了 ${rewardAmount} 金币的每周奖励！`
      };
    } catch (error) {
      this.logger.error('Failed to claim weekly reward:', error);
      throw error;
    }
  }

  async updateBalance(userId, guildId, amount) {
    try {
      this.logger.info('Updating balance:', { userId, guildId, amount });
      await this.repository.updateBalance(userId, guildId, amount);
      this.logger.info('Balance updated successfully');
    } catch (error) {
      this.logger.error('Failed to update balance:', error);
      throw error;
    }
  }

  async setLastDailyReward(userId, guildId) {
    try {
      this.logger.info('Setting last daily reward:', { userId, guildId });
      await this.repository.setLastDailyReward(userId, guildId);
      this.logger.info('Last daily reward set successfully');
    } catch (error) {
      this.logger.error('Failed to set last daily reward:', error);
      throw error;
    }
  }

  async setLastWeeklyReward(userId, guildId) {
    try {
      this.logger.info('Setting last weekly reward:', { userId, guildId });
      await this.repository.setLastWeeklyReward(userId, guildId);
      this.logger.info('Last weekly reward set successfully');
    } catch (error) {
      this.logger.error('Failed to set last weekly reward:', error);
      throw error;
    }
  }

  async transferCoins(fromUserId, toUserId, guildId, amount) {
    try {
      this.logger.info('Transferring coins:', { fromUserId, toUserId, guildId, amount });
      
      // Validate amount
      if (amount <= 0) {
        throw new Error('Transfer amount must be positive');
      }

      // Check if sender has enough balance
      const senderBalance = await this.repository.getBalance(fromUserId, guildId);
      if (senderBalance < amount) {
        this.logger.warn('Insufficient balance for transfer:', { senderBalance, amount });
        return {
          success: false,
          message: '余额不足！'
        };
      }

      // Perform transfer
      await this.repository.transferBalance(fromUserId, toUserId, guildId, amount);

      this.logger.info('Transfer completed successfully');
      return {
        success: true,
        message: `成功转账 ${amount} 金币！`
      };
    } catch (error) {
      this.logger.error('Failed to transfer coins:', error);
      throw error;
    }
  }

  async getInventory(userId, guildId) {
    try {
      this.logger.info('Getting inventory:', { userId, guildId });
      const inventory = await this.repository.getInventory(userId, guildId);
      this.logger.info('Got inventory:', inventory);
      return inventory;
    } catch (error) {
      this.logger.error('Failed to get inventory:', error);
      throw error;
    }
  }

  async getShopItems() {
    try {
      this.logger.info('Getting shop items');
      const items = await this.repository.getShopItems();
      this.logger.info('Got shop items:', items);
      return items;
    } catch (error) {
      this.logger.error('Failed to get shop items:', error);
      throw error;
    }
  }

  async work(userId, guildId) {
    try {
      this.logger.info('Working:', { userId, guildId });
      
      // Calculate earnings
      const earnings = Math.floor(Math.random() * 91) + 10; // Random amount between 10-100
      
      // Update balance
      await this.updateBalance(userId, guildId, earnings);

      this.logger.info('Work completed successfully:', { earnings });
      return {
        success: true,
        message: `工作获得了 ${earnings} 金币！`
      };
    } catch (error) {
      this.logger.error('Failed to work:', error);
      throw error;
    }
  }

  async transfer(fromUserId, toUserId, guildId, amount) {
    try {
      this.logger.info('Transferring:', { fromUserId, toUserId, guildId, amount });
      
      // Validate amount
      if (amount <= 0) {
        throw new Error('Transfer amount must be positive');
      }

      // Check if sender has enough balance
      const senderBalance = await this.getUserBalance(fromUserId, guildId);
      if (senderBalance < amount) {
        this.logger.warn('Insufficient balance for transfer:', { senderBalance, amount });
        return {
          success: false,
          message: '余额不足！'
        };
      }

      // Perform transfer
      await this.transferCoins(fromUserId, toUserId, guildId, amount);

      this.logger.info('Transfer completed successfully');
      return {
        success: true,
        message: `成功转账 ${amount} 金币！`
      };
    } catch (error) {
      this.logger.error('Failed to transfer:', error);
      throw error;
    }
  }
}
