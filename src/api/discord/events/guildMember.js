// src/api/discord/events/guildMember.js
import { Logger } from '../../../utils/logger.js';

const logger = new Logger({ prefix: 'GuildMemberEvents' });

export class GuildMemberEvents {
  constructor(client) {
    this.client = client;
  }

  async handleMemberAdd(data) {
    console.log('Raw member add data:', JSON.stringify(data, null, 2));
    try {
      const { guild_id, user } = data;
      
      // 直接发送测试消息到第一个可用的文本频道
      try {
        const channels = await this.client.get(`/guilds/${guild_id}/channels`);
        console.log('Available channels:', channels);
        
        const textChannel = channels.find(channel => channel.type === 0);
        if (textChannel) {
          const message = {
            content: `👋 欢迎新成员 <@${user.id}> 加入服务器！\n这是一条测试消息，用于验证事件系统是否正常工作。`,
            allowed_mentions: { users: [user.id] }
          };
          
          console.log('Sending welcome message to channel:', textChannel.id);
          const response = await this.client.post(`/channels/${textChannel.id}/messages`, message);
          console.log('Message sent successfully:', response);
        } else {
          console.log('No text channel found in guild:', guild_id);
        }
      } catch (error) {
        console.error('Error sending test message:', error);
      }
    } catch (error) {
      console.error('Error in handleMemberAdd:', error);
    }
  }

  async handleMemberRemove(data) {
    console.log('Raw member remove data:', JSON.stringify(data, null, 2));
    try {
      const { guild_id, user } = data;
      
      // 直接发送测试消息到第一个可用的文本频道
      try {
        const channels = await this.client.get(`/guilds/${guild_id}/channels`);
        console.log('Available channels:', channels);
        
        const textChannel = channels.find(channel => channel.type === 0);
        if (textChannel) {
          const message = {
            content: `👋 成员 ${user.username} 离开了服务器\n这是一条测试消息，用于验证事件系统是否正常工作。`
          };
          
          console.log('Sending goodbye message to channel:', textChannel.id);
          const response = await this.client.post(`/channels/${textChannel.id}/messages`, message);
          console.log('Message sent successfully:', response);
        } else {
          console.log('No text channel found in guild:', guild_id);
        }
      } catch (error) {
        console.error('Error sending test message:', error);
      }
    } catch (error) {
      console.error('Error in handleMemberRemove:', error);
    }
  }
}