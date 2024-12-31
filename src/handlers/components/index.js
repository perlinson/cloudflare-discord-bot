import { InteractionResponseTypes } from '../../api/discord/client/constants.js';
import { DiscordClient } from '../../api/discord/client/index.js';
import { EmbedBuilder } from '../../api/discord/utils/EmbedBuilder.js';
import { ComponentBuilder } from '../../api/discord/utils/ComponentBuilder.js';

export class ComponentHandler {
  static async handle(interaction, env, ctx) {
    const { data: { custom_id, values } } = interaction;

    // 初始化 Discord 客户端
    const client = new DiscordClient(env.DISCORD_TOKEN);

    try {
      // 解析自定义 ID
      const [componentType, action, ...params] = custom_id.split(':');

      switch (componentType) {
        case 'button':
          return this.handleButton(action, params, interaction, env);

        case 'select':
          return this.handleSelect(action, values, interaction, env);

        default:
          return {
            type: InteractionResponseTypes.CHANNEL_MESSAGE,
            data: {
              content: `Unknown component type: ${componentType}`,
              flags: 64, // EPHEMERAL
            },
          };
      }
    } catch (error) {
      console.error(`Error handling component ${custom_id}:`, error);
      return {
        type: InteractionResponseTypes.CHANNEL_MESSAGE,
        data: {
          content: 'An error occurred while processing your interaction.',
          flags: 64, // EPHEMERAL
        },
      };
    }
  }

  static async handleButton(action, params, interaction, env) {
    switch (action) {
      case 'confirm': {
        // 处理确认按钮
        const [targetId] = params;
        
        try {
          // 执行确认操作
          await this.processConfirmation(targetId, interaction, env);

          return {
            type: InteractionResponseTypes.CHANNEL_MESSAGE,
            data: {
              content: 'Action confirmed successfully!',
              flags: 64, // EPHEMERAL
            },
          };
        } catch (error) {
          console.error('Error processing confirmation:', error);
          return {
            type: InteractionResponseTypes.CHANNEL_MESSAGE,
            data: {
              content: 'Failed to process confirmation.',
              flags: 64, // EPHEMERAL
            },
          };
        }
      }

      case 'cancel': {
        // 处理取消按钮
        return {
          type: InteractionResponseTypes.CHANNEL_MESSAGE,
          data: {
            content: 'Action cancelled.',
            flags: 64, // EPHEMERAL
          },
        };
      }

      case 'page': {
        // 处理分页按钮
        const [pageNumber] = params;
        return this.handlePagination(parseInt(pageNumber), interaction, env);
      }

      default:
        return {
          type: InteractionResponseTypes.CHANNEL_MESSAGE,
          data: {
            content: `Unknown button action: ${action}`,
            flags: 64, // EPHEMERAL
          },
        };
    }
  }

  static async handleSelect(action, values, interaction, env) {
    switch (action) {
      case 'role': {
        // 处理角色选择
        try {
          await this.processRoleSelection(values, interaction, env);

          return {
            type: InteractionResponseTypes.CHANNEL_MESSAGE,
            data: {
              content: 'Roles updated successfully!',
              flags: 64, // EPHEMERAL
            },
          };
        } catch (error) {
          console.error('Error processing role selection:', error);
          return {
            type: InteractionResponseTypes.CHANNEL_MESSAGE,
            data: {
              content: 'Failed to update roles.',
              flags: 64, // EPHEMERAL
            },
          };
        }
      }

      case 'option': {
        // 处理选项选择
        return {
          type: InteractionResponseTypes.CHANNEL_MESSAGE,
          data: {
            content: `Selected options: ${values.join(', ')}`,
            flags: 64, // EPHEMERAL
          },
        };
      }

      default:
        return {
          type: InteractionResponseTypes.CHANNEL_MESSAGE,
          data: {
            content: `Unknown select action: ${action}`,
            flags: 64, // EPHEMERAL
          },
        };
    }
  }

  // 处理确认操作
  static async processConfirmation(targetId, interaction, env) {
    // 从 KV 或 D1 获取待确认的操作
    const pendingAction = await env.KV.get(`pending:${targetId}`);
    if (!pendingAction) {
      throw new Error('Pending action not found');
    }

    // 执行操作
    // ...

    // 清理待确认的操作
    await env.KV.delete(`pending:${targetId}`);
  }

  // 处理分页
  static async handlePagination(page, interaction, env) {
    const itemsPerPage = 10;
    
    // 从 KV 或 D1 获取数据
    const data = await env.KV.get('paginatedData', { type: 'json' }) || [];
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const items = data.slice(startIndex, endIndex);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const embed = new EmbedBuilder()
      .setTitle('Paginated Results')
      .setDescription(items.join('\n'))
      .setFooter(`Page ${page} of ${totalPages}`)
      .toJSON();

    const components = new ComponentBuilder()
      .addActionRow()
      .addButton({
        customId: `button:page:${page - 1}`,
        label: 'Previous',
        style: ComponentBuilder.ButtonStyles.PRIMARY,
        disabled: page <= 1,
      })
      .addButton({
        customId: `button:page:${page + 1}`,
        label: 'Next',
        style: ComponentBuilder.ButtonStyles.PRIMARY,
        disabled: page >= totalPages,
      })
      .toJSON();

    return {
      type: InteractionResponseTypes.UPDATE_MESSAGE,
      data: {
        embeds: [embed],
        components,
      },
    };
  }

  // 处理角色选择
  static async processRoleSelection(roleIds, interaction, env) {
    const client = new DiscordClient(env.DISCORD_TOKEN);

    // 获取用户当前的角色
    const member = await client.guilds.getMember(
      interaction.guild_id,
      interaction.user.id
    );

    // 计算要添加和删除的角色
    const currentRoles = new Set(member.roles);
    const selectedRoles = new Set(roleIds);

    const rolesToAdd = roleIds.filter(id => !currentRoles.has(id));
    const rolesToRemove = Array.from(currentRoles)
      .filter(id => !selectedRoles.has(id));

    // 更新角色
    for (const roleId of rolesToAdd) {
      await client.guilds.addMemberRole(
        interaction.guild_id,
        interaction.user.id,
        roleId
      );
    }

    for (const roleId of rolesToRemove) {
      await client.guilds.removeMemberRole(
        interaction.guild_id,
        interaction.user.id,
        roleId
      );
    }
  }
}
