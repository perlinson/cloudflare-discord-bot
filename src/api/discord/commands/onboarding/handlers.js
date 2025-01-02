import { InteractionResponseType } from 'discord-interactions';
import { OnboardingService } from './service.js';

export async function handleOnboardingCommands(interaction, client, env) {
  const onboardingService = new OnboardingService(env);
  const subcommand = interaction.data.options?.[0];
  const userId = interaction.member.user.id;
  const guildId = interaction.guild_id;

  if (!subcommand) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '无效的命令！',
        flags: 64
      }
    };
  }

  try {
    switch (subcommand.name) {
      case 'start': {
        // Return deferred response immediately
        const response = {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 0
          }
        };

        // Handle the start in the background
        Promise.resolve().then(async () => {
          try {
            await onboardingService.updateUserProgress(userId, guildId, 1);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '欢迎开始新手引导！让我来帮助你了解服务器的基本功能。\n输入 `/onboarding next` 继续。'
              }
            );
          } catch (error) {
            console.error('[Onboarding] Error starting onboarding:', error);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '开始新手引导时发生错误！',
                flags: 64
              }
            );
          }
        }).catch(console.error);

        return response;
      }

      case 'next': {
        // Return deferred response immediately
        const response = {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 0
          }
        };

        // Handle the next step in the background
        Promise.resolve().then(async () => {
          try {
            const progress = await onboardingService.getUserProgress(userId, guildId);
            if (progress.completed) {
              await client.interactions.editReply(
                env.DISCORD_APPLICATION_ID,
                interaction.token,
                {
                  content: '你已经完成了新手引导！',
                  flags: 64
                }
              );
              return;
            }

            const nextStep = progress.step + 1;
            if (nextStep > 5) {
              await onboardingService.completeOnboarding(userId, guildId);
              await client.interactions.editReply(
                env.DISCORD_APPLICATION_ID,
                interaction.token,
                {
                  content: '🎉 恭喜你完成了所有新手引导步骤！现在你可以开始使用服务器的所有功能了。'
                }
              );
              return;
            }

            await onboardingService.updateUserProgress(userId, guildId, nextStep);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: getStepContent(nextStep)
              }
            );
          } catch (error) {
            console.error('[Onboarding] Error processing next step:', error);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '处理下一步时发生错误！',
                flags: 64
              }
            );
          }
        }).catch(console.error);

        return response;
      }

      case 'status': {
        // Return deferred response immediately
        const response = {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 0
          }
        };

        // Handle the status check in the background
        Promise.resolve().then(async () => {
          try {
            const progress = await onboardingService.getUserProgress(userId, guildId);
            if (progress.completed) {
              await client.interactions.editReply(
                env.DISCORD_APPLICATION_ID,
                interaction.token,
                {
                  content: '你已经完成了新手引导！',
                  flags: 64
                }
              );
              return;
            }

            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: `当前进度：第 ${progress.step}/5 步\n${getStepContent(progress.step)}`,
                flags: 64
              }
            );
          } catch (error) {
            console.error('[Onboarding] Error checking status:', error);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '获取进度时发生错误！',
                flags: 64
              }
            );
          }
        }).catch(console.error);

        return response;
      }

      default:
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '未知的命令！',
            flags: 64
          }
        };
    }
  } catch (error) {
    console.error('[Onboarding] Error handling command:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '处理命令时发生错误！',
        flags: 64
      }
    };
  }
}

function getStepContent(step) {
  switch (step) {
    case 1:
      return '第 1 步：了解基本命令\n服务器提供了多种实用的命令，你可以通过输入 `/` 来查看所有可用的命令。\n输入 `/onboarding next` 继续。';
    case 2:
      return '第 2 步：经济系统\n你可以通过完成任务、参与活动来赚取金币。使用 `/economy` 相关命令来管理你的财富。\n输入 `/onboarding next` 继续。';
    case 3:
      return '第 3 步：AI 功能\n服务器集成了强大的 AI 功能，包括聊天和图片生成。试试 `/chat` 和 `/image` 命令。\n输入 `/onboarding next` 继续。';
    case 4:
      return '第 4 步：社交功能\n与其他成员互动是服务器的重要部分。使用 `/share` 命令来分享内容。\n输入 `/onboarding next` 继续。';
    case 5:
      return '第 5 步：获取帮助\n如果你在使用过程中遇到任何问题，可以使用 `/help` 命令获取帮助。\n输入 `/onboarding next` 完成引导。';
    default:
      return '未知步骤';
  }
}
