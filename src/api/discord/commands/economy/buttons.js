import { InteractionResponseType } from 'discord-interactions';
import { EmbedBuilder } from '../../utils/EmbedBuilder.js';
import { ComponentBuilder } from '../../utils/ComponentBuilder.js';
import { MessageBuilder } from '../../utils/MessageBuilder.js';
import { Logger } from '../../../../utils/logger.js';
import { EconomyService } from '../../../../services/economy.js';

const logger = new Logger({ prefix: 'EconomyButtons' });

// 处理存款按钮
async function handleDeposit(interaction, env) {
  const economyService = new EconomyService(env);
  const userId = interaction.member.user.id;
  const guildId = interaction.guild_id;

  // 创建模态框让用户输入存款金额
  const modal = {
    title: "存款",
    custom_id: "deposit_modal",
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: "deposit_amount",
            label: "存款金额",
            style: 1,
            min_length: 1,
            max_length: 10,
            placeholder: "请输入存款金额",
            required: true
          }
        ]
      }
    ]
  };

  logger.info('Sending deposit modal:', modal);

  return {
    type: InteractionResponseType.MODAL,
    data: modal
  };
}

// 处理取款按钮
async function handleWithdraw(interaction, env) {
  const economyService = new EconomyService(env);
  const userId = interaction.member.user.id;
  const guildId = interaction.guild_id;

  // 创建模态框让用户输入取款金额
  const modal = {
    title: "取款",
    custom_id: "withdraw_modal",
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: "withdraw_amount",
            label: "取款金额",
            style: 1,
            min_length: 1,
            max_length: 10,
            placeholder: "请输入取款金额",
            required: true
          }
        ]
      }
    ]
  };

  return {
    type: InteractionResponseType.MODAL,
    data: modal
  };
}

// 处理转账按钮
async function handleTransfer(interaction, env) {
  const economyService = new EconomyService(env);
  const userId = interaction.member.user.id;
  const guildId = interaction.guild_id;

  // 创建模态框让用户输入转账信息
  const modal = {
    title: "转账",
    custom_id: "transfer_modal",
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: "target_user",
            label: "接收者ID",
            style: 1,
            min_length: 17,
            max_length: 20,
            placeholder: "请输入接收者的Discord ID",
            required: true
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: "transfer_amount",
            label: "转账金额",
            style: 1,
            min_length: 1,
            max_length: 10,
            placeholder: "请输入转账金额",
            required: true
          }
        ]
      }
    ]
  };

  return {
    type: InteractionResponseType.MODAL,
    data: modal
  };
}

// 处理商店按钮
async function handleShop(interaction, env) {
  const economyService = new EconomyService(env);
  const userId = interaction.member.user.id;
  const guildId = interaction.guild_id;

  try {
    const items = await economyService.getShopItems(guildId);
    
    const embed = new EmbedBuilder()
      .setTitle('🛍️ 商店')
      .setDescription('可购买的物品列表')
      .setColor(0x00ff00);

    items.forEach(item => {
      embed.addField(
        item.name,
        `价格: ${item.price} 金币\n${item.description || ''}`,
        true
      );
    });

    const components = new ComponentBuilder();
    let currentRow = 0;

    items.forEach((item, index) => {
      if (index % 5 === 0) {
        components.addActionRow();
        currentRow++;
      }

      components.addButton({
        label: `购买 ${item.name}`,
        customId: `buy_${item.id}`,
        style: ComponentBuilder.ButtonStyles.PRIMARY
      });
    });

    const message = new MessageBuilder()
      .setEmbed(embed.data)
      .setComponents(components.components)
      .setEphemeral(true);

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: message.data
    };
  } catch (error) {
    logger.error('Error handling shop button:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '获取商店信息时发生错误！',
        flags: 64
      }
    };
  }
}

// 处理模态框提交
async function handleModalSubmit(interaction, env) {
  const economyService = new EconomyService(env);
  const userId = interaction.member.user.id;
  const guildId = interaction.guild_id;
  const customId = interaction.data.custom_id;
  
  try {
    logger.info('Modal Submit Interaction:', {
      type: interaction.type,
      data: interaction.data,
      components: interaction.data.components
    });

    // 从模态框组件中获取输入值
    const getComponentValue = (customId) => {
      const component = interaction.data.components?.find(row => 
        row.components?.find(comp => comp.custom_id === customId)
      )?.components?.find(comp => comp.custom_id === customId);

      if (!component?.value) {
        logger.error('Cannot find component value:', {
          customId,
          components: interaction.data.components
        });
        throw new Error('无法获取输入值，请重试！');
      }

      logger.info('Found component value:', {
        customId,
        value: component.value,
        type: typeof component.value
      });

      return component.value;
    };

    // 解析金额
    const parseAmount = (value) => {
      // 移除所有非数字字符
      const cleanValue = value.replace(/[^\d]/g, '');
      logger.info('Parsing amount:', { 
        original: value,
        cleaned: cleanValue,
        type: typeof cleanValue
      });

      const amount = parseInt(cleanValue, 10);
      logger.info('Parsed amount:', {
        amount,
        type: typeof amount
      });

      if (isNaN(amount) || amount <= 0) {
        throw new Error('请输入有效的金额！');
      }
      if (amount > 1000000000) { // 10亿上限
        throw new Error('金额超出限制！');
      }
      return amount;
    };

    let result;
    switch (customId) {
      case 'deposit_modal': {
        const rawAmount = getComponentValue('deposit_amount');
        logger.info('Processing deposit:', { 
          rawAmount,
          type: typeof rawAmount
        });
        
        const amount = parseAmount(rawAmount);
        logger.info('Final deposit amount:', { 
          amount,
          type: typeof amount,
          userId,
          guildId
        });

        // 修正参数顺序
        result = await economyService.deposit(userId, amount);
        return createResponse('存款成功', `成功存入 ${amount} 金币`, result);
      }

      case 'withdraw_modal': {
        const rawAmount = getComponentValue('withdraw_amount');
        logger.info('Processing withdraw:', { 
          rawAmount,
          type: typeof rawAmount
        });
        
        const amount = parseAmount(rawAmount);
        logger.info('Final withdraw amount:', { 
          amount,
          type: typeof amount,
          userId,
          guildId
        });

        // 修正参数顺序
        result = await economyService.withdraw(userId, amount);
        return createResponse('取款成功', `成功取出 ${amount} 金币`, result);
      }

      case 'transfer_modal': {
        const targetUser = getComponentValue('target_user');
        const rawAmount = getComponentValue('transfer_amount');
        logger.info('Processing transfer:', { 
          targetUser,
          rawAmount,
          type: typeof rawAmount,
          userId,
          guildId
        });
        
        const amount = parseAmount(rawAmount);
        logger.info('Final transfer amount:', { 
          amount,
          type: typeof amount
        });

        // 修正参数顺序
        result = await economyService.transfer(userId, targetUser, amount);
        return createResponse('转账成功', `成功转账 ${amount} 金币给 <@${targetUser}>`, result);
      }

      default:
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '未知的模态框类型！',
            flags: 64
          }
        };
    }
  } catch (error) {
    logger.error('Error handling modal submit:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `操作失败：${error.message}`,
        flags: 64
      }
    };
  }
}

// 创建响应消息
function createResponse(title, description, result) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0x00ff00)
    .addField('现金', `${result.wallet} 金币`, true)
    .addField('银行余额', `${result.bank} 金币`, true)
    .addField('总资产', `${result.total} 金币`, true)
    .setTimestamp();

  const message = new MessageBuilder()
    .setEmbed(embed.data)
    .setEphemeral(true);

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: message.data
  };
}

export const economyButtons = {
  handleDeposit,
  handleWithdraw,
  handleTransfer,
  handleShop,
  handleModalSubmit
};
