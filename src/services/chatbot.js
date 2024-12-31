import { ChatRepository } from '../database/repositories/chat.js';
import { Logger } from '../utils/logger.js';

export class ChatbotService {
  constructor(env) {
    this.chatRepo = new ChatRepository(env);
    this.logger = new Logger({ prefix: 'ChatbotService' });
  }

  async getSettings(userId) {
    let settings = await this.chatRepo.findSettingsByUserId(userId);
    if (!settings) {
      settings = await this.chatRepo.updateSettings(userId, {
        language: 'en',
        personality: 'friendly',
        memory: true,
        reactions: true,
        character: 'assistant',
      });
    }
    return settings;
  }

  async updateSettings(userId, settings) {
    return this.chatRepo.updateSettings(userId, settings);
  }

  async addMessage(userId, role, content) {
    return this.chatRepo.addMessage(userId, role, content);
  }

  async getHistory(userId, limit = 10) {
    const settings = await this.getSettings(userId);
    if (!settings.memory) {
      return [];
    }
    return this.chatRepo.getHistory(userId, limit);
  }

  async clearHistory(userId) {
    return this.chatRepo.clearHistory(userId);
  }

  async processMessage(userId, content) {
    const settings = await this.getSettings(userId);
    const history = settings.memory ? await this.getHistory(userId, 5) : [];

    // 添加用户消息到历史记录
    await this.addMessage(userId, 'user', content);

    // TODO: 调用 AI API 处理消息
    const response = '这是一个示例回复';

    // 添加机器人回复到历史记录
    await this.addMessage(userId, 'assistant', response);

    return {
      content: response,
      settings,
    };
  }

  async setCharacter(userId, character) {
    return this.updateSettings(userId, { character });
  }
}
