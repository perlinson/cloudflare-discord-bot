import { InteractionResponseType } from 'discord-interactions';
import { EconomyService } from './service.js';
import { InteractionsAPI } from '../../resources/interactions.js';
import { DiscordClient } from '../../client/index.js';
import { Logger } from '../../../../utils/logger.js';

export async function handleEconomyCommands(interaction, env) {
  const logger = new Logger({ prefix: 'EconomyHandler' });
  logger.info('Starting command handler');

  // 1. 初始化服务
  const economyService = new EconomyService(env);
  const client = new DiscordClient(env.DISCORD_TOKEN, {}, env);
  const interactionsApi = new InteractionsAPI(client);

  try {
    logger.info('Initializing service');
    await economyService.initialize();
  } catch (error) {
    logger.error('Failed to initialize service:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '服务初始化失败！',
        flags: 64
      }
    };
  }
  
  // 2. 验证子命令
  const subcommand = interaction.data.options?.[0];
  if (!subcommand) {
    logger.warn('Invalid command: no subcommand found');
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '无效的命令！',
        flags: 64
      }
    };
  }

  // 3. 获取用户信息
  const userId = interaction.member.user.id;
  const guildId = interaction.guild_id;

  logger.info('Processing command:', {
    subcommand: subcommand.name,
    userId,
    guildId
  });

  // 4. 确保用户存在
  try {
    logger.info('Ensuring user exists');
    await economyService.ensureUserExists(userId, guildId);
  } catch (error) {
    logger.error('Failed to ensure user exists:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '用户数据初始化失败！',
        flags: 64
      }
    };
  }

  // 5. 处理子命令
  try {
    let result;
    switch (subcommand.name) {
      case 'balance': {
        const targetUser = subcommand.options?.find(opt => opt.name === 'user')?.value || userId;
        logger.info('Getting balance for user:', targetUser);
        const balance = await economyService.getUserBalance(targetUser, guildId);
        logger.info('Got balance:', balance);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `余额：${balance} 金币`
          }
        };
      }

      case 'daily': {
        logger.info('Processing daily command');
        result = await economyService.claimDailyReward(userId, guildId);
        logger.info('Daily reward claimed:', result);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: result.message
          }
        };
      }

      case 'weekly': {
        logger.info('Processing weekly command');
        result = await economyService.claimWeeklyReward(userId, guildId);
        logger.info('Weekly reward claimed:', result);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: result.message
          }
        };
      }

      case 'work': {
        logger.info('Processing work command');
        result = await economyService.work(userId, guildId);
        logger.info('Work completed:', result);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: result.message
          }
        };
      }

      case 'inventory': {
        logger.info('Processing inventory command');
        const inventory = await economyService.getInventory(userId, guildId);
        logger.info('Got inventory:', inventory);
        
        const content = inventory.length > 0
          ? `您的物品栏：\n${inventory.map(item => `- ${item.name} (${item.quantity})`).join('\n')}`
          : '您的物品栏是空的';
        
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content
          }
        };
      }

      case 'shop': {
        logger.info('Processing shop command');
        const items = await economyService.getShopItems();
        logger.info('Got shop items:', items);
        
        const content = items.length > 0
          ? `商店物品：\n${items.map(item => `- ${item.name}: ${item.price} 金币`).join('\n')}`
          : '商店目前没有任何物品';
        
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content
          }
        };
      }

      case 'transfer': {
        logger.info('Processing transfer command');
        const targetUser = subcommand.options.find(opt => opt.name === 'user').value;
        const amount = parseInt(subcommand.options.find(opt => opt.name === 'amount').value);
        
        if (amount <= 0) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '转账金额必须大于 0！',
              flags: 64
            }
          };
        }

        logger.info('Transferring coins:', { targetUser, amount });
        result = await economyService.transferCoins(userId, targetUser, guildId, amount);
        logger.info('Transfer completed:', result);
        
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: result.message
          }
        };
      }

      default: {
        logger.warn('Unknown subcommand:', subcommand.name);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '未知的子命令！',
            flags: 64
          }
        };
      }
    }
  } catch (error) {
    logger.error('Error processing command:', {
      subcommand: subcommand.name,
      error: error.message,
      stack: error.stack
    });
    
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '处理命令时发生错误！',
        flags: 64
      }
    };
  }
}
