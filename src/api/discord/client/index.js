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
    
    // 初始化基础配置
    this.options = {
      baseURL: 'https://discord.com/api/v10',
      timeout: 15000,
      retries: 3,
      ...options
    };

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

    this.logger.info('DiscordClient initialized with options:', {
      baseURL: this.options.baseURL,
      timeout: this.options.timeout,
      retries: this.options.retries
    });
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

      // this.logger.info(`Resource ${name} registered successfully`);
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
    
    // 解析按钮ID
    const [namespace, action, ...params] = customId.split(':');
    
    this.logger.info('Handling component interaction:', {
      customId,
      namespace,
      action,
      params
    });

    // 处理经济系统的按钮
    if (namespace === 'economy') {
      const { economyButtons } = await import('../commands/economy/buttons.js');
      
      switch (action) {
        case 'deposit':
          return economyButtons.handleDeposit(interaction, env);
        case 'withdraw':
          return economyButtons.handleWithdraw(interaction, env);
        case 'transfer':
          return economyButtons.handleTransfer(interaction, env);
        case 'shop':
          return economyButtons.handleShop(interaction, env);
        default:
          this.logger.warn('Unknown economy action:', action);
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '未知的操作！',
              flags: 64
            }
          };
      }
    }

    this.logger.warn('Unknown component namespace:', namespace);
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
    console.log('Handling modal submit:', customId);
    // 处理经济系统的模态框提交
    if (customId.startsWith('economy')) {
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
      const message = await this.interactions.deferReply(
        interaction.id,
        interaction.token,
        true
      );

      console.log("message", message)

      // 处理命令
      const response = await handleCommand(interaction, this, env);
      
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
    const requestOptions = {
      ...options,
      headers: {
        'Authorization': `Bot ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // 确保 body 是字符串
    if (requestOptions.body && typeof requestOptions.body === 'object') {
      requestOptions.body = JSON.stringify(requestOptions.body);
    }

    this.logger.info('Making request:', {
      url,
      method: options.method || 'GET',
      headers: Object.keys(requestOptions.headers),
      bodyLength: requestOptions.body ? requestOptions.body.length : 0
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 秒超时

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
        cf: {
          cacheTtl: 0,
          cacheEverything: false
        }
      });

      clearTimeout(timeoutId);
      
      this.logger.info('Received response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error('Request failed:', {
          url,
          status: response.status,
          statusText: response.statusText,
          body: errorBody
        });
        throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const contentType = response.headers.get('content-type');
      let responseData;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        this.logger.info('Response data:', {
          contentType,
          dataType: typeof responseData,
          isError: responseData instanceof Error
        });

        return responseData;
      } catch (parseError) {
        this.logger.error('Failed to parse response:', {
          error: parseError.message,
          contentType,
          responseText: await response.text()
        });
        throw parseError;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        this.logger.error('Request timed out:', { url });
        throw new Error(`Request timed out after 30 seconds: ${url}`);
      }

      this.logger.error('Request error:', {
        url,
        error: error.message,
        stack: error.stack
      });
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
