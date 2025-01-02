import { InteractionResponseTypes } from '../../api/discord/client/constants.js';
import { DiscordClient } from '../../api/discord/client/index.js';

export class AutocompleteHandler {
  static async handle(interaction, env) {
    const { data: { name, options } } = interaction;

    try {
      // 获取正在输入的选项
      const focusedOption = options.find(opt => opt.focused);
      if (!focusedOption) {
        return {
          type: InteractionResponseTypes.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
          data: { choices: [] },
        };
      }

      switch (name) {
        case 'search':
          return this.handleSearch(focusedOption.value, env);

        case 'tag':
          return this.handleTags(focusedOption.value, env);

        case 'user':
          return this.handleUsers(focusedOption.value, interaction, env);

        default:
          return {
            type: InteractionResponseTypes.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
            data: { choices: [] },
          };
      }
    } catch (error) {
      console.error(`Error handling autocomplete for ${name}:`, error);
      return {
        type: InteractionResponseTypes.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
        data: { choices: [] },
      };
    }
  }

  static async handleSearch(query, env) {
    // 从 KV 或 D1 获取搜索数据
    const searchData = await env.KV.get('searchData', { type: 'json' }) || [];

    // 过滤和排序结果
    const results = searchData
      .filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => {
        // 优先显示以查询开头的项目
        const aStartsWith = a.name.toLowerCase().startsWith(query.toLowerCase());
        const bStartsWith = b.name.toLowerCase().startsWith(query.toLowerCase());
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 25) // Discord 限制最多 25 个选项
      .map(item => ({
        name: item.name,
        value: item.id,
      }));

    return {
      type: InteractionResponseTypes.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
      data: { choices: results },
    };
  }

  static async handleTags(query, env) {
    // 从 KV 或 D1 获取标签数据
    const tags = await env.KV.get('tags', { type: 'json' }) || [];

    // 过滤和排序标签
    const filteredTags = tags
      .filter(tag => 
        tag.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => {
        const aStartsWith = a.toLowerCase().startsWith(query.toLowerCase());
        const bStartsWith = b.toLowerCase().startsWith(query.toLowerCase());
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 25)
      .map(tag => ({
        name: tag,
        value: tag,
      }));

    return {
      type: InteractionResponseTypes.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
      data: { choices: filteredTags },
    };
  }

  static async handleUsers(query, interaction, client, env) {
    try {
      // 获取服务器成员
      const members = await client.guilds.getMembers(interaction.guild_id, {
        limit: 1000,
      });

      // 过滤和排序用户
      const filteredUsers = members
        .filter(member => {
          const username = member.user.username.toLowerCase();
          const nickname = member.nick?.toLowerCase();
          const searchQuery = query.toLowerCase();
          
          return username.includes(searchQuery) || 
                 (nickname && nickname.includes(searchQuery));
        })
        .sort((a, b) => {
          const aName = (a.nick || a.user.username).toLowerCase();
          const bName = (b.nick || b.user.username).toLowerCase();
          const aStartsWith = aName.startsWith(query.toLowerCase());
          const bStartsWith = bName.startsWith(query.toLowerCase());
          
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return aName.localeCompare(bName);
        })
        .slice(0, 25)
        .map(member => ({
          name: member.nick || member.user.username,
          value: member.user.id,
        }));

      return {
        type: InteractionResponseTypes.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
        data: { choices: filteredUsers },
      };
    } catch (error) {
      console.error('Error fetching users for autocomplete:', error);
      return {
        type: InteractionResponseTypes.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
        data: { choices: [] },
      };
    }
  }
}
