import { InteractionResponseType } from 'discord-interactions';
import { PhoneService } from './service.js';

export async function handlePhoneCommands(interaction, client, env) {
  const phoneService = new PhoneService(env);
  const subcommand = interaction.data.options?.[0];

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
      case 'call': {
        const targetUser = subcommand.options?.find(opt => opt.name === 'user')?.value;
        if (!targetUser) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '请指定要呼叫的用户！',
              flags: 64
            }
          };
        }

        const response = {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 0
          }
        };

        env.ENVIRONMENT.waitUntil((async () => {
          try {
            // Check if either user is already in a call
            const [fromCall, toCall] = await Promise.all([
              phoneService.getActiveCall(interaction.member.user.id),
              phoneService.getActiveCall(targetUser)
            ]);

            if (fromCall || toCall) {
              await client.interactions.editReply(
                env.DISCORD_APPLICATION_ID,
                interaction.token,
                {
                  content: '你或对方已经在通话中！',
                  flags: 64
                }
              );
              return;
            }

            const call = await phoneService.createCall(
              interaction.member.user.id,
              targetUser,
              interaction.channel_id
            );

            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: `已向 <@${targetUser}> 发起通话请求！\n通话ID：${call.id}`
              }
            );
          } catch (error) {
            console.error('[Phone] Error initiating call:', error);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '发起通话时发生错误！',
                flags: 64
              }
            );
          }
        })());

        return response;
      }

      case 'hangup': {
        const response = {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 0
          }
        };

        env.ENVIRONMENT.waitUntil((async () => {
          try {
            const activeCall = await phoneService.getActiveCall(interaction.member.user.id);
            if (!activeCall) {
              await client.interactions.editReply(
                env.DISCORD_APPLICATION_ID,
                interaction.token,
                {
                  content: '你当前没有进行中的通话！',
                  flags: 64
                }
              );
              return;
            }

            const call = await phoneService.endCall(activeCall.id);
            const duration = Math.floor((call.endTime - call.startTime) / 1000);

            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: `通话已结束\n通话时长：${duration}秒`
              }
            );
          } catch (error) {
            console.error('[Phone] Error ending call:', error);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '结束通话时发生错误！',
                flags: 64
              }
            );
          }
        })());

        return response;
      }

      case 'status': {
        const response = {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 0
          }
        };

        env.ENVIRONMENT.waitUntil((async () => {
          try {
            const activeCall = await phoneService.getActiveCall(interaction.member.user.id);
            if (!activeCall) {
              await client.interactions.editReply(
                env.DISCORD_APPLICATION_ID,
                interaction.token,
                {
                  content: '你当前没有进行中的通话。',
                  flags: 64
                }
              );
              return;
            }

            const duration = Math.floor((Date.now() - activeCall.startTime) / 1000);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: `当前通话信息：\n与 <@${activeCall.fromUserId === interaction.member.user.id ? activeCall.toUserId : activeCall.fromUserId}> 通话中\n已持续：${duration}秒`,
                flags: 64
              }
            );
          } catch (error) {
            console.error('[Phone] Error getting call status:', error);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '获取通话状态时发生错误！',
                flags: 64
              }
            );
          }
        })());

        return response;
      }

      case 'history': {
        const response = {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 0
          }
        };

        env.ENVIRONMENT.waitUntil((async () => {
          try {
            const history = await phoneService.getCallHistory(interaction.member.user.id);
            if (history.length === 0) {
              await client.interactions.editReply(
                env.DISCORD_APPLICATION_ID,
                interaction.token,
                {
                  content: '没有通话记录。',
                  flags: 64
                }
              );
              return;
            }

            const content = history
              .map((call, index) => {
                const duration = Math.floor((call.endTime - call.startTime) / 1000);
                const otherUser = call.fromUserId === interaction.member.user.id ? call.toUserId : call.fromUserId;
                return `${index + 1}. 与 <@${otherUser}> 通话 ${duration}秒`;
              })
              .join('\n');

            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: `通话记录：\n${content}`,
                flags: 64
              }
            );
          } catch (error) {
            console.error('[Phone] Error getting call history:', error);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '获取通话记录时发生错误！',
                flags: 64
              }
            );
          }
        })());

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
    console.error('[Phone] Error handling command:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '处理命令时发生错误！',
        flags: 64
      }
    };
  }
}
