import { Logger } from '../../../../utils/logger.js';

export class EconomyRepository {
  constructor(db, kv) {
    this.db = db;
    this.kv = kv;
    this.logger = new Logger({ prefix: 'EconomyRepository' });
  }

  async getUserData(userId, guildId) {
    try {
      this.logger.info('Getting user data:', { userId, guildId });
      const key = `economy:${guildId}:${userId}`;
      
      let userData;
      try {
        const rawData = await this.kv.get(key);
        userData = rawData ? JSON.parse(rawData) : null;
      } catch (error) {
        this.logger.error('Error reading user data:', error);
        throw new Error('Failed to read user data: ' + error.message);
      }
      
      if (!userData) {
        this.logger.info('User data not found, creating new user');
        userData = {
          userId,
          guildId,
          balance: 0,
          lastDaily: null,
          inventory: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        try {
          await this.kv.put(key, JSON.stringify(userData));
        } catch (error) {
          this.logger.error('Error creating user data:', error);
          throw new Error('Failed to create user data: ' + error.message);
        }
      }
      
      this.logger.info('Got user data:', userData);
      return userData;
    } catch (error) {
      this.logger.error('Error in getUserData:', error);
      throw error;
    }
  }

  async updateUserData(userId, guildId, updates) {
    try {
      this.logger.info('Updating user data:', { userId, guildId, updates });
      const key = `economy:${guildId}:${userId}`;
      
      let userData;
      try {
        const rawData = await this.kv.get(key);
        userData = rawData ? JSON.parse(rawData) : null;
      } catch (error) {
        this.logger.error('Error reading user data for update:', error);
        throw new Error('Failed to read user data: ' + error.message);
      }
      
      if (!userData) {
        this.logger.error('User data not found for update');
        throw new Error('User data not found');
      }
      
      userData = {
        ...userData,
        ...updates,
        updatedAt: Date.now()
      };
      
      try {
        await this.kv.put(key, JSON.stringify(userData));
      } catch (error) {
        this.logger.error('Error saving updated user data:', error);
        throw new Error('Failed to save user data: ' + error.message);
      }
      
      this.logger.info('Updated user data:', userData);
      return userData;
    } catch (error) {
      this.logger.error('Error in updateUserData:', error);
      throw error;
    }
  }
}