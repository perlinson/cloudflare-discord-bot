import { InteractionResponseType } from 'discord-interactions';
import { ShareService } from './service.js';

export async function handleShareCommands(interaction, client, env) {
  const shareService = new ShareService(env);
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
      case 'post': {
        const content = subcommand.options?.find(opt => opt.name === 'content')?.value;
        const type = subcommand.options?.find(opt => opt.name === 'type')?.value || 'text';

        if (!content) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '请提供要分享的内容！',
              flags: 64
            }
          };
        }

        // Return deferred response immediately
        const response = {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 0
          }
        };

        // Handle the post in the background
        Promise.resolve().then(async () => {
          try {
            const share = await shareService.shareContent(
              interaction.member.user.id,
              content,
              type
            );

            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: `分享成功！\n分享ID：${share.id}\n内容：${share.content}`
              }
            );
          } catch (error) {
            console.error('[Share] Error posting content:', error);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '分享内容时发生错误！',
                flags: 64
              }
            );
          }
        }).catch(console.error);

        return response;
      }

      case 'like': {
        const shareId = subcommand.options?.find(opt => opt.name === 'id')?.value;
        if (!shareId) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '请提供要点赞的分享ID！',
              flags: 64
            }
          };
        }

        // Return deferred response immediately
        const response = {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 0
          }
        };

        // Handle the like in the background
        Promise.resolve().then(async () => {
          try {
            const share = await shareService.likeShare(shareId, interaction.member.user.id);

            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: `点赞成功！\n分享ID：${share.id}\n当前点赞数：${share.likes}`
              }
            );
          } catch (error) {
            console.error('[Share] Error liking content:', error);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '点赞时发生错误！',
                flags: 64
              }
            );
          }
        }).catch(console.error);

        return response;
      }

      case 'comment': {
        const shareId = subcommand.options?.find(opt => opt.name === 'id')?.value;
        const comment = subcommand.options?.find(opt => opt.name === 'comment')?.value;

        if (!shareId || !comment) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '请提供分享ID和评论内容！',
              flags: 64
            }
          };
        }

        // Return deferred response immediately
        const response = {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 0
          }
        };

        // Handle the comment in the background
        Promise.resolve().then(async () => {
          try {
            const share = await shareService.addComment(
              shareId,
              interaction.member.user.id,
              comment
            );

            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: `评论成功！\n分享ID：${share.id}\n评论：${comment}`
              }
            );
          } catch (error) {
            console.error('[Share] Error adding comment:', error);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '添加评论时发生错误！',
                flags: 64
              }
            );
          }
        }).catch(console.error);

        return response;
      }

      case 'view': {
        const shareId = subcommand.options?.find(opt => opt.name === 'id')?.value;
        if (!shareId) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '请提供分享ID！',
              flags: 64
            }
          };
        }

        // Return deferred response immediately
        const response = {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 0
          }
        };

        // Handle the view in the background
        Promise.resolve().then(async () => {
          try {
            const share = await shareService.getShare(shareId);
            if (!share) {
              await client.interactions.editReply(
                env.DISCORD_APPLICATION_ID,
                interaction.token,
                {
                  content: '未找到该分享！',
                  flags: 64
                }
              );
              return;
            }

            const comments = share.comments
              .map(comment => `<@${comment.userId}>: ${comment.content}`)
              .join('\n');

            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: `分享详情：\n作者：<@${share.userId}>\n内容：${share.content}\n点赞数：${share.likes}\n\n评论：\n${comments || '暂无评论'}`,
                flags: 64
              }
            );
          } catch (error) {
            console.error('[Share] Error viewing share:', error);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '查看分享时发生错误！',
                flags: 64
              }
            );
          }
        }).catch(console.error);

        return response;
      }

      case 'list': {
        const targetUser = subcommand.options?.find(opt => opt.name === 'user')?.value || interaction.member.user.id;

        // Return deferred response immediately
        const response = {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 0
          }
        };

        // Handle the list in the background
        Promise.resolve().then(async () => {
          try {
            const shares = await shareService.getUserShares(targetUser);
            if (shares.length === 0) {
              await client.interactions.editReply(
                env.DISCORD_APPLICATION_ID,
                interaction.token,
                {
                  content: '暂无分享记录！',
                  flags: 64
                }
              );
              return;
            }

            const content = shares
              .map((share, index) => `${index + 1}. ID：${share.id}\n内容：${share.content}\n点赞：${share.likes} | 评论：${share.comments.length}`)
              .join('\n\n');

            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: `<@${targetUser}> 的分享列表：\n\n${content}`,
                flags: 64
              }
            );
          } catch (error) {
            console.error('[Share] Error listing content:', error);
            await client.interactions.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '获取分享列表时发生错误！',
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
    console.error('[Share] Error handling command:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '处理命令时发生错误！',
        flags: 64
      }
    };
  }
}
