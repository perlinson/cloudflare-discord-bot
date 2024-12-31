import { Logger } from '../../../utils/logger.js';
import { CommandsAPI } from '../resources/commands.js';
import { InteractionType, InteractionResponseType } from 'discord-interactions';

// Import handlers from new location
import { handleChatCommands } from '../commands/chatbot/handlers.js';
import { handleEconomyCommands } from '../commands/economy/handlers.js';
import { handleImageCommands } from '../commands/image/handlers.js';
import { handleNetworkCommands } from '../commands/network/handlers.js';
import { handleOnboardingCommands } from '../commands/onboarding/handlers.js';
import { handlePhoneCommands } from '../commands/phone/handlers.js';
import { handleShareCommands } from '../commands/share/handlers.js';

const API_VERSION = 'v10';
const BASE_URL = `https://discord.com/api/${API_VERSION}`;

export class DiscordClient {
  constructor(token, options = {}, env) {
    this.token = token;
    this.env = env;
    this.logger = new Logger({ prefix: 'DiscordClient' });
    this.commands = new CommandsAPI(this);
  }

  async handleInteraction(interaction) {
    try {
      this.logger.info('Handling interaction:', {
        type: interaction.type,
        commandName: interaction.data?.name
      });

      if (interaction.type === InteractionType.PING) {
        this.logger.info('Responding to PING');
        return {
          type: InteractionResponseType.PONG
        };
      }

      if (interaction.type !== InteractionType.APPLICATION_COMMAND) {
        this.logger.warn('Unsupported interaction type:', interaction.type);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '不支持的交互类型！',
            flags: 64
          }
        };
      }

      // Handle command
      const commandName = interaction.data.name;
      this.logger.info('Processing command:', commandName);

      let response;
      try {
        switch (commandName) {
          case 'chat':
            response = await handleChatCommands(interaction, this.env);
            break;
          case 'economy':
            response = await handleEconomyCommands(interaction, this.env);
            break;
          case 'image':
            response = await handleImageCommands(interaction, this.env);
            break;
          case 'network':
            response = await handleNetworkCommands(interaction, this.env);
            break;
          case 'onboarding':
            response = await handleOnboardingCommands(interaction, this.env);
            break;
          case 'phone':
            response = await handlePhoneCommands(interaction, this.env);
            break;
          case 'share':
            response = await handleShareCommands(interaction, this.env);
            break;
          default:
            this.logger.warn('Unknown command:', commandName);
            return {
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: '未知的命令！',
                flags: 64
              }
            };
        }

        if (!response) {
          throw new Error('Command handler returned no response');
        }

        this.logger.info('Command handled successfully:', {
          type: response.type,
          hasData: !!response.data
        });
        
        return response;
      } catch (error) {
        this.logger.error('Error handling command:', {
          commandName,
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
    } catch (error) {
      this.logger.error('Error in handleInteraction:', {
        error: error.message,
        stack: error.stack
      });
      
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `处理交互时发生错误！\n错误信息：${error.message}`,
          flags: 64
        }
      };
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = endpoint;
    const headers = {
      'Authorization': `Bot ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      // 如果 body 是字符串，确保它是有效的 JSON
      let body = options.body;
      if (typeof body === 'string') {
        try {
          JSON.parse(body); // 验证是否是有效的 JSON
        } catch (e) {
          body = JSON.stringify(body); // 如果不是，则进行字符串化
        }
      } else if (body && typeof body === 'object') {
        body = JSON.stringify(body); // 如果是对象，进行字符串化
      }

      console.log("Request details:", {
        url,
        method: options.method || 'GET',
        headers: { ...headers, Authorization: '***' },
        body
      });

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body,
        signal: controller.signal
      });

      clearTimeout(timeout);

      const responseText = await response.text();
      console.log("Response text:", responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }

      if (!response.ok) {
        const error = new Error(`Discord API returned ${response.status}: ${JSON.stringify(responseData)}`);
        error.status = response.status;
        error.response = responseData;
        throw error;
      }

      return responseData;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timed out after 10 seconds');
      } else {
        console.error('API request failed:', {
          endpoint,
          error: error.message,
          response: error.response
        });
      }
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'GET'
    });
  }

  // POST request
  async post(endpoint, data = {}, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  async put(endpoint, data = {}, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // PATCH request
  async patch(endpoint, data = {}, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }

  // Utility methods for common Discord API endpoints
  
  // Get guild information
  async getGuild(guildId) {
    return this.get(`/guilds/${guildId}`);
  }

  // Get channel information
  async getChannel(channelId) {
    return this.get(`/channels/${channelId}`);
  }

  // Send message to channel
  async createMessage(channelId, content) {
    return this.post(`/channels/${channelId}/messages`, {
      content: typeof content === 'string' ? content : content.content,
      embeds: content.embeds,
      components: content.components,
      files: content.files,
      attachments: content.attachments,
      flags: content.flags
    });
  }

  // Edit message
  async editMessage(channelId, messageId, content) {
    return this.patch(`/channels/${channelId}/messages/${messageId}`, {
      content: typeof content === 'string' ? content : content.content,
      embeds: content.embeds,
      components: content.components,
      files: content.files,
      attachments: content.attachments,
      flags: content.flags
    });
  }

  // Delete message
  async deleteMessage(channelId, messageId) {
    return this.delete(`/channels/${channelId}/messages/${messageId}`);
  }

  // Get guild member
  async getGuildMember(guildId, userId) {
    return this.get(`/guilds/${guildId}/members/${userId}`);
  }

  // Modify guild member
  async modifyGuildMember(guildId, userId, data) {
    return this.patch(`/guilds/${guildId}/members/${userId}`, data);
  }

  // Create guild application command
  async createGuildCommand(guildId, command) {
    return this.post(`/applications/${process.env.DISCORD_APPLICATION_ID}/guilds/${guildId}/commands`, command);
  }

  // Bulk overwrite guild application commands
  async bulkOverwriteGuildCommands(guildId, commands) {
    return this.put(`/applications/${process.env.DISCORD_APPLICATION_ID}/guilds/${guildId}/commands`, commands);
  }

  // Create global application command
  async createGlobalCommand(command) {
    return this.post(`/applications/${process.env.DISCORD_APPLICATION_ID}/commands`, command);
  }

  // Bulk overwrite global application commands
  async bulkOverwriteGlobalCommands(commands) {
    return this.put(`/applications/${process.env.DISCORD_APPLICATION_ID}/commands`, commands);
  }

  // Create interaction response
  async createInteractionResponse(interactionId, interactionToken, response) {
    return this.post(`/interactions/${interactionId}/${interactionToken}/callback`, response);
  }

  // Get original interaction response
  async getOriginalInteractionResponse(applicationId, interactionToken) {
    return this.get(`/webhooks/${applicationId}/${interactionToken}/messages/@original`);
  }

  // Edit original interaction response
  async editOriginalInteractionResponse(applicationId, interactionToken, response) {
    return this.patch(`/webhooks/${applicationId}/${interactionToken}/messages/@original`, response);
  }

  // Delete original interaction response
  async deleteOriginalInteractionResponse(applicationId, interactionToken) {
    return this.delete(`/webhooks/${applicationId}/${interactionToken}/messages/@original`);
  }
}
