import { Logger } from '../../../../utils/logger.js';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

export class EconomyRepository {
  constructor(db, kv) {
    this.db = db;
    this.kv = kv;
    this.logger = new Logger({ prefix: 'EconomyRepository' });
    this.prisma = new PrismaClient({ adapter: new PrismaD1(db.MY_DATABASE) });
  }

  async ensureUserExists(userId, guildId) {
    try {
      this.logger.info('Ensuring user exists:', { userId, guildId });
      const userData = await this.getUserData(userId, guildId);
      this.logger.info('User data:', userData);
      return userData;
    } catch (error) {
      this.logger.error('Error in ensureUserExists:', error);
      throw error;
    }
  }

  async getUserData(userId, guildId) {
    try {
      this.logger.info('Getting user data:', { userId, guildId });
      const userData = await this.prisma.economy.upsert({
        where: {
          userId_guildId: {
            userId,
            guildId
          }
        },
        create: {
          userId,
          guildId,
          balance: 0,
          lastDaily: null,
          inventory: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        update: {
          updatedAt: new Date()
        }
      });
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
      const userData = await this.prisma.economy.update({
        where: {
          userId_guildId: {
            userId,
            guildId
          }
        },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });
      this.logger.info('Updated user data:', userData);
      return userData;
    } catch (error) {
      this.logger.error('Error in updateUserData:', error);
      throw error;
    }
  }
}