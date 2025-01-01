import { Logger } from '../../../utils/logger.js';
import { ChannelsAPI } from '../resources/channels.js';
import { GuildsAPI } from '../resources/guilds.js';
import { MessagesAPI } from '../resources/messages.js';
import { UsersAPI } from '../resources/users.js';
import { InteractionsAPI } from '../resources/interactions.js';
import { CommandsAPI } from '../resources/commands.js';
import { WebhooksAPI } from '../resources/webhooks.js';
import { EmojiAPI } from '../resources/emoji.js';
import { VoiceAPI } from '../resources/voice.js';
import { DiscordAPIError } from './errors.js';
import { API_VERSION } from './constants.js';
import { InteractionType, InteractionResponseType } from 'discord-interactions';

// Import handlers from new location
import {handleCommand} from '../commands/index.js';

const BASE_URL = `https://discord.com/api/${API_VERSION}`;

export class DiscordClient {
  constructor(token, options = {}, env) {
    this.token = token;
    this.env = env;
    this.logger = new Logger({ prefix: 'DiscordClient' });
    
    // 存储已注册的资源
    this.resources = new Map();
    
    // 注册资源
    this.registerResource('channels', ChannelsAPI);
    this.registerResource('guilds', GuildsAPI);
    this.registerResource('messages', MessagesAPI);
    this.registerResource('users', UsersAPI);
    this.registerResource('interactions', InteractionsAPI);
    this.registerResource('webhooks', WebhooksAPI);
    this.registerResource('emoji', EmojiAPI);
    this.registerResource('voice', VoiceAPI);
    this.registerResource('commands', CommandsAPI);

    // // 初始化基础配置
    // this.options = {
    //   baseURL: options.baseURL || 'https://discord.com/api/v10',
    //   timeout: options.timeout || 15000,
    //   retries: options.retries || 3,
    //   ...options
    // };

    // 初始化工具
    // this.logger = new Logger({
    //   prefix: 'DiscordBot',
    //   level: options.logLevel || Logger.LogLevels.INFO,
    // });

    // this.config = new ConfigManager({
    //   defaults: options.defaults || {},
    //   persistenceProvider: options.configProvider,
    //   logger: this.logger,
    // });

    // this.state = new StateManager({
    //   history: true,
    //   maxHistoryLength: 1000,
    //   logger: this.logger,
    // });

    // this.scheduler = new Scheduler();
    // this.cache = new CacheManager({
    //   ttl: 5 * 60 * 1000,
    //   maxSize: 1000,
    // });

    // this.rateLimiter = new RateLimiter({
    //   limit: 5,
    //   window: 1000,
    //   globalLimit: 50,
    //   globalWindow: 1000,
    // });


  }

  // 注册资源
  registerResource(name, ResourceClass) {
    if (this.resources.has(name)) {
      this.logger.warn(`Resource ${name} is already registered, overwriting...`);
    }

    try {
      // 创建资源实例
      const resource = new ResourceClass(this);
      
      // 存储资源
      this.resources.set(name, resource);
      
      // 在客户端实例上创建访问器
      Object.defineProperty(this, name, {
        get() {
          return this.resources.get(name);
        },
        configurable: true,
        enumerable: true
      });

      this.logger.info(`Resource ${name} registered successfully`);
    } catch (error) {
      this.logger.error(`Failed to register resource ${name}:`, error);
      throw error;
    }
  }

  // 获取资源
  getResource(name) {
    const resource = this.resources.get(name);
    if (!resource) {
      throw new Error(`Resource ${name} is not registered`);
    }
    return resource;
  }

  // 检查资源是否已注册
  hasResource(name) {
    return this.resources.has(name);
  }

  // 注销资源
  unregisterResource(name) {
    if (!this.resources.has(name)) {
      this.logger.warn(`Resource ${name} is not registered`);
      return false;
    }

    try {
      // 删除资源实例
      this.resources.delete(name);
      
      // 删除访问器
      delete this[name];
      
      this.logger.info(`Resource ${name} unregistered successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to unregister resource ${name}:`, error);
      throw error;
    }
  }

  // 获取所有已注册的资源名称
  getRegisteredResources() {
    return Array.from(this.resources.keys());
  }

  async handleInteraction(interaction, env) {
    const { type } = interaction;

    try {
      switch (type) {
        case InteractionType.PING:
          return this.handlePing();

        case InteractionType.APPLICATION_COMMAND:
          return this.handleCommand(interaction, env);

        case InteractionType.MESSAGE_COMPONENT:
          return this.handleComponent(interaction, env);

        case InteractionType.MODAL_SUBMIT:
          return this.handleModalSubmit(interaction, env);

        default:
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '不支持的交互类型！',
              flags: 64
            }
          };
      }
    } catch (error) {
      this.logger.error('Error handling interaction:', error);
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '处理请求时发生错误！',
          flags: 64
        }
      };
    }
  }

  async handleComponent(interaction, env) {
    const customId = interaction.data.custom_id;
    
    // 处理经济系统的按钮
    if (customId.startsWith('deposit_') || 
        customId.startsWith('withdraw_') || 
        customId.startsWith('transfer_') || 
        customId.startsWith('shop_')) {
      const { economyButtons } = await import('../commands/economy/buttons.js');
      
      if (customId.startsWith('deposit_')) {
        return economyButtons.handleDeposit(interaction, env);
      } else if (customId.startsWith('withdraw_')) {
        return economyButtons.handleWithdraw(interaction, env);
      } else if (customId.startsWith('transfer_')) {
        return economyButtons.handleTransfer(interaction, env);
      } else if (customId.startsWith('shop_')) {
        return economyButtons.handleShop(interaction, env);
      }
    }

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '未知的组件交互！',
        flags: 64
      }
    };
  }

  async handleModalSubmit(interaction, env) {
    const customId = interaction.data.custom_id;
    
    // 处理经济系统的模态框提交
    if (customId.endsWith('_modal')) {
      const { economyButtons } = await import('../commands/economy/buttons.js');
      return economyButtons.handleModalSubmit(interaction, env);
    }

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '未知的模态框提交！',
        flags: 64
      }
    };
  }

  async handlePing() {
    return {
      type: InteractionResponseType.PONG
    };
  }

  async handleCommand(interaction, env) {
    try {
      // 延迟响应
      await this.interactions.deferReply(
        interaction.id,
        interaction.token,
        true
      );

      // 处理命令
      const response = await handleCommand(interaction, env);
      
      // 确保响应格式正确
      const editResponse = {
        content: response.data.content,
        embeds: response.data.embeds,
        components: response.data.components,
        flags: response.data.flags
      };

      // 使用 editReply 更新延迟的消息
      await this.interactions.editReply(
        interaction.application_id,
        interaction.token,
        editResponse
      );

      return response;
    } catch (error) {
      this.logger.error('Error in handleCommand:', {
        error: error.message,
        stack: error.stack
      });

      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `处理命令时发生错误！\n错误信息：${error.message}`,
          flags: 64
        }
      };
    }
  }

  // HTTP 请求方法
  async makeRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.options.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bot ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      this.logger.debug('Making request:', {
        method: options.method || 'GET',
        url,
        headers: { ...headers, Authorization: '***' }
      });

      const controller = new AbortController();
      // const timeout = setTimeout(() => controller.abort(), this.options.timeout || 15000);

      const response = await fetch(url, {
        ...options,
        headers,
        // signal: controller.signal
      });

      // clearTimeout(timeout);

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }

      if (!response.ok) {
        const error = new Error(`Discord API returned ${response.status}`);
        error.status = response.status;
        error.response = responseData;
        throw error;
      }

      return responseData;
    } catch (error) {
      if (error.name === 'AbortError') {
        this.logger.error('Request timed out');
      } else {
        this.logger.error('API request failed:', {
          endpoint,
          error: error.message,
          response: error.response
        });
      }
      throw error;
    }
  }

  // HTTP 方法包装器
  async get(endpoint, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'GET'
    });
  }

  async post(endpoint, data = {}, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data = {}, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async patch(endpoint, data = {}, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }
}
