import { InteractionResponseTypes } from '../../api/discord/client/constants.js';
import { DiscordClient } from '../../api/discord/client/index.js';
import { EmbedBuilder } from '../../api/discord/utils/EmbedBuilder.js';

export class ModalHandler {
  static async handle(interaction, env, ctx) {
    const { data: { custom_id, components } } = interaction;

    try {
      // 解析自定义 ID
      const [modalType, action, ...params] = custom_id.split(':');

      // 获取表单数据
      const formData = this.getFormData(components);

      switch (modalType) {
        case 'feedback':
          return this.handleFeedback(formData, interaction, env);

        case 'report':
          return this.handleReport(formData, interaction, env);

        case 'ticket':
          return this.handleTicket(action, formData, interaction, env);

        default:
          return {
            type: InteractionResponseTypes.CHANNEL_MESSAGE,
            data: {
              content: `Unknown modal type: ${modalType}`,
              flags: 64, // EPHEMERAL
            },
          };
      }
    } catch (error) {
      console.error(`Error handling modal ${custom_id}:`, error);
      return {
        type: InteractionResponseTypes.CHANNEL_MESSAGE,
        data: {
          content: 'An error occurred while processing your submission.',
          flags: 64, // EPHEMERAL
        },
      };
    }
  }

  // 从组件中提取表单数据
  static getFormData(components) {
    const formData = {};
    
    for (const actionRow of components) {
      for (const component of actionRow.components) {
        formData[component.custom_id] = component.value;
      }
    }

    return formData;
  }

  // 处理反馈表单
  static async handleFeedback(formData, interaction, env) {
    const { 'feedback:type': type, 'feedback:content': content } = formData;

    try {
      // 保存反馈到数据库
      await env.D1.prepare(
        'INSERT INTO feedback (user_id, type, content) VALUES (?, ?, ?)'
      )
      .bind(interaction.user.id, type, content)
      .run();

      // 发送反馈到日志频道
      const client = new DiscordClient(env.DISCORD_TOKEN);
      const logChannelId = await env.KV.get('logChannel');
      
      if (logChannelId) {
        const embed = new EmbedBuilder()
          .setTitle('New Feedback')
          .addField('Type', type)
          .addField('Content', content)
          .addField('User', `<@${interaction.user.id}>`)
          .setColor('#00ff00')
          .setTimestamp()
          .toJSON();

        await client.messages.send(logChannelId, { embeds: [embed] });
      }

      return {
        type: InteractionResponseTypes.CHANNEL_MESSAGE,
        data: {
          content: 'Thank you for your feedback!',
          flags: 64, // EPHEMERAL
        },
      };
    } catch (error) {
      console.error('Error processing feedback:', error);
      throw error;
    }
  }

  // 处理举报表单
  static async handleReport(formData, interaction, env) {
    const {
      'report:user': reportedUser,
      'report:reason': reason,
      'report:details': details,
    } = formData;

    try {
      // 保存举报到数据库
      await env.D1.prepare(
        'INSERT INTO reports (reporter_id, reported_user_id, reason, details) VALUES (?, ?, ?, ?)'
      )
      .bind(interaction.user.id, reportedUser, reason, details)
      .run();

      // 发送举报到管理频道
      const client = new DiscordClient(env.DISCORD_TOKEN);
      const modChannelId = await env.KV.get('modChannel');
      
      if (modChannelId) {
        const embed = new EmbedBuilder()
          .setTitle('New User Report')
          .addField('Reported User', `<@${reportedUser}>`)
          .addField('Reason', reason)
          .addField('Details', details)
          .addField('Reporter', `<@${interaction.user.id}>`)
          .setColor('#ff0000')
          .setTimestamp()
          .toJSON();

        await client.messages.send(modChannelId, { embeds: [embed] });
      }

      return {
        type: InteractionResponseTypes.CHANNEL_MESSAGE,
        data: {
          content: 'Your report has been submitted to the moderators.',
          flags: 64, // EPHEMERAL
        },
      };
    } catch (error) {
      console.error('Error processing report:', error);
      throw error;
    }
  }

  // 处理工单表单
  static async handleTicket(action, formData, interaction, env) {
    switch (action) {
      case 'create': {
        const {
          'ticket:subject': subject,
          'ticket:description': description,
          'ticket:priority': priority,
        } = formData;

        try {
          // 创建工单频道
          const client = new DiscordClient(env.DISCORD_TOKEN);
          const category = await env.KV.get('ticketCategory');
          
          const channel = await client.channels.create(interaction.guild_id, {
            name: `ticket-${interaction.user.username}`,
            type: 0, // GUILD_TEXT
            parent_id: category,
            permission_overwrites: [
              {
                id: interaction.guild_id,
                type: 0,
                deny: '1024', // VIEW_CHANNEL
              },
              {
                id: interaction.user.id,
                type: 1,
                allow: '1024', // VIEW_CHANNEL
              },
            ],
          });

          // 发送工单信息
          const embed = new EmbedBuilder()
            .setTitle(`Ticket: ${subject}`)
            .setDescription(description)
            .addField('Priority', priority)
            .addField('Created by', `<@${interaction.user.id}>`)
            .setColor('#0099ff')
            .setTimestamp()
            .toJSON();

          await client.messages.send(channel.id, { embeds: [embed] });

          // 保存工单信息到数据库
          await env.D1.prepare(
            'INSERT INTO tickets (channel_id, user_id, subject, description, priority) VALUES (?, ?, ?, ?, ?)'
          )
          .bind(channel.id, interaction.user.id, subject, description, priority)
          .run();

          return {
            type: InteractionResponseTypes.CHANNEL_MESSAGE,
            data: {
              content: `Ticket created! Please check <#${channel.id}>`,
              flags: 64, // EPHEMERAL
            },
          };
        } catch (error) {
          console.error('Error creating ticket:', error);
          throw error;
        }
      }

      case 'close': {
        const { 'ticket:reason': reason } = formData;

        try {
          // 更新工单状态
          await env.D1.prepare(
            'UPDATE tickets SET status = ?, closed_reason = ?, closed_at = CURRENT_TIMESTAMP WHERE channel_id = ?'
          )
          .bind('closed', reason, interaction.channel_id)
          .run();

          // 关闭频道
          const client = new DiscordClient(env.DISCORD_TOKEN);
          await client.channels.delete(interaction.channel_id);

          return {
            type: InteractionResponseTypes.CHANNEL_MESSAGE,
            data: {
              content: 'Ticket has been closed.',
              flags: 64, // EPHEMERAL
            },
          };
        } catch (error) {
          console.error('Error closing ticket:', error);
          throw error;
        }
      }

      default:
        return {
          type: InteractionResponseTypes.CHANNEL_MESSAGE,
          data: {
            content: `Unknown ticket action: ${action}`,
            flags: 64, // EPHEMERAL
          },
        };
    }
  }
}
