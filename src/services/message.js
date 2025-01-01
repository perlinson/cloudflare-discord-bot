import { DiscordClient } from '../api/discord/client/index.js';
import { 
  ChannelsAPI, 
  GuildsAPI, 
  MessagesAPI, 
  UsersAPI, 
  InteractionsAPI 
} from '../api/discord/resources/index.js';

export class MessageService {
  constructor(env) {
    this.env = env;
    this.client = new DiscordClient(this.env.DISCORD_TOKEN, {
      debug: this.env.NODE_ENV !== 'production'
    });

    // 注册所有资源
    this.client.registerResource('channels', ChannelsAPI);
    this.client.registerResource('guilds', GuildsAPI);
    this.client.registerResource('messages', MessagesAPI);
    this.client.registerResource('users', UsersAPI);
    this.client.registerResource('interactions', InteractionsAPI);
  }

  async sendMessage(channelId, content) {
    try {
      return await this.client.messages.send(channelId, {
        content,
        allowed_mentions: { parse: [] }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async handleInteraction(interaction) {
    try {
      // 延迟响应
      await this.client.interactions.deferReply(
        interaction.id,
        interaction.token,
        true
      );

      // 处理交互
      // 发送响应
      return this.client.interactions.editReply(
        interaction.id,
        interaction.token,
        {
          content: 'Command processed!',
          ephemeral: true
        }
      );
    } catch (error) {
      console.error('Error handling interaction:', error);
      throw error;
    }
  }
}