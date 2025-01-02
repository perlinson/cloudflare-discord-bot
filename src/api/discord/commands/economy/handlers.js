import { InteractionResponseType } from 'discord-interactions';
import { EconomyService } from '../../../../services/economy.js';
import { Logger } from '../../../../utils/logger.js';
import { EmbedBuilder } from '../../utils/EmbedBuilder.js';
import { ComponentBuilder } from '../../utils/ComponentBuilder.js';
import { MessageBuilder } from '../../utils/MessageBuilder.js';

export async function handleEconomyCommands(interaction, client, env) {
  const logger = new Logger({ prefix: 'EconomyHandler' });
  const economyService = new EconomyService(env);
  const userId = interaction.member.user.id;
  const guildId = interaction.guild_id;
  
  // 验证子命令
  const subcommand = interaction.data.options?.[0];
  if (!subcommand) {
    logger.warn('No subcommand provided');
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '请指定子命令！',
        flags: 64
      }
    };
  }

  let result;
  try {
    switch (subcommand.name) {
      case 'balance': {
        const targetUser = subcommand.options?.find(opt => opt.name === 'user')?.value || userId;
        logger.info('Getting balance for user:', targetUser);
        const balance = await economyService.getBalance(targetUser, guildId);
        logger.info('Got balance:', balance);

        // 创建嵌入消息
        const embed = new EmbedBuilder()
          .setTitle('💰 余额查询')
          .setDescription(`<@${targetUser}> 的余额信息`)
          .setColor(0x00ff00)
          .addField('现金', `${balance?.wallet || 0} 金币`, true)
          .addField('银行', `${balance?.bank || 0} 金币`, true)
          .addField('总资产', `${(balance?.total  || 0) + (balance?.bank || 0)} 金币`, true)
          .setTimestamp();

        // 创建按钮组件
        const components = new ComponentBuilder()
          .addActionRow()
          .addButton({
            label: '存款',
            customId: `economy:deposit:${targetUser}`,
            style: ComponentBuilder.ButtonStyles.PRIMARY
          })
          .addButton({
            label: '取款',
            customId: `economy:withdraw:${targetUser}`,
            style: ComponentBuilder.ButtonStyles.PRIMARY
          })
          .addActionRow()
          .addButton({
            label: '转账',
            customId: `economy:transfer:${targetUser}`,
            style: ComponentBuilder.ButtonStyles.SUCCESS
          })
          .addButton({
            label: '商店',
            customId: `economy:shop:${targetUser}`,
            style: ComponentBuilder.ButtonStyles.SECONDARY
          });

        // 创建消息
        const message = new MessageBuilder()
          .setEmbed(embed.data)
          .setComponents(components.components)
          .setEphemeral(true);

        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: message.data
        };
      }

      case 'daily': {
        logger.info('Processing daily command');
        result = await economyService.claimDaily(userId, guildId);
        logger.info('Daily reward claimed:', result);

        const embed = new EmbedBuilder()
          .setTitle('📅 每日奖励')
          .setDescription(`<@${userId}> 的每日奖励已领取！`)
          .setColor(0x00ff00)
          .addField('获得金币', `${result.amount} 金币`, true)
          .addField('当前余额', `${result.wallet} 金币`, true)
          .setTimestamp();

        const message = new MessageBuilder()
          .addEmbed(embed)
          .setEphemeral(true);

        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: message.toJSON()
        };
      }

      case 'weekly': {
        logger.info('Processing weekly command');
        result = await economyService.claimWeekly(userId, guildId);
        logger.info('Weekly reward claimed:', result);

        const embed = new EmbedBuilder()
          .setTitle('📅 每周奖励')
          .setDescription(`<@${userId}> 的每周奖励已领取！`)
          .setColor(0x00ff00)
          .addField('获得金币', `${result.amount} 金币`, true)
          .addField('当前余额', `${result.wallet} 金币`, true)
          .setTimestamp();

        const message = new MessageBuilder()
          .addEmbed(embed)
          .setEphemeral(true);

        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: message.toJSON()
        };
      }

      case 'work': {
        logger.info('Processing work command');
        result = await economyService.work(userId, guildId);
        logger.info('Work completed:', result);

        const embed = new EmbedBuilder()
          .setTitle('💼 工作')
          .setDescription(`<@${userId}> 的工作已完成！`)
          .setColor(0x00ff00)
          .addField('获得金币', `${result.amount} 金币`, true)
          .addField('当前余额', `${result.wallet} 金币`, true)
          .setTimestamp();

        const message = new MessageBuilder()
          .addEmbed(embed)
          .setEphemeral(true);

        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: message.toJSON()
        };
      }

      case 'inventory': {
        logger.info('Processing inventory command');
        const inventory = await economyService.getInventory(userId, guildId);
        logger.info('Got inventory:', inventory);
        
        const content = inventory.length > 0
          ? `您的物品栏：\n${inventory.map(item => `- ${item.name} (${item.quantity})`).join('\n')}`
          : '您的物品栏是空的';
        
        const embed = new EmbedBuilder()
          .setTitle('📦 物品栏')
          .setDescription(content)
          .setColor(0x00ff00)
          .setTimestamp();

        const message = new MessageBuilder()
          .addEmbed(embed)
          .setEphemeral(true);

        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: message.toJSON()
        };
      }

      case 'shop': {
        logger.info('Processing shop command');
        const items = await economyService.getShopItems();
        logger.info('Got shop items:', items);
        
        const content = items.length > 0
          ? `商店物品：\n${items.map(item => `- ${item.name}: ${item.price} 金币`).join('\n')}`
          : '商店目前没有任何物品';
        
        const embed = new EmbedBuilder()
          .setTitle('🛍️ 商店')
          .setDescription(content)
          .setColor(0x00ff00)
          .setTimestamp();

        const message = new MessageBuilder()
          .addEmbed(embed)
          .setEphemeral(true);

        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: message.toJSON()
        };
      }

      case 'transfer': {
        logger.info('Processing transfer command');
        const targetUser = subcommand.options.find(opt => opt.name === 'user').value;
        const amount = parseInt(subcommand.options.find(opt => opt.name === 'amount').value);
        
        if (amount <= 0) {
          const embed = new EmbedBuilder()
            .setTitle('转账')
            .setDescription('转账金额必须大于 0！')
            .setColor(0xff0000)
            .setTimestamp();

          const message = new MessageBuilder()
            .addEmbed(embed)
            .setEphemeral(true);

          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: message.toJSON()
          };
        }

        logger.info('Transferring coins:', { targetUser, amount });
        result = await economyService.transferCoins(userId, targetUser, guildId, amount);
        logger.info('Transfer completed:', result);
        
        const embed = new EmbedBuilder()
          .setTitle('转账')
          .setDescription(result.message)
          .setColor(0x00ff00)
          .setTimestamp();

        const message = new MessageBuilder()
          .addEmbed(embed)
          .setEphemeral(true);

        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: message.toJSON()
        };
      }

      default:
        logger.warn('Unknown subcommand:', subcommand.name);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '未知的子命令！',
            flags: 64
          }
        };
    }
  } catch (error) {
    logger.error('Error processing command:', {
      subcommand: subcommand.name,
      error: error.message,
      stack: error.stack
    });

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ 错误')
      .setDescription('处理命令时发生错误')
      .setColor(0xff0000)
      .addField('错误信息', error.message)
      .setTimestamp();

    const message = new MessageBuilder()
      .addEmbed(errorEmbed)
      .setEphemeral(true);

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: message.toJSON()
    };
  }
}
