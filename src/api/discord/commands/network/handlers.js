import { InteractionResponseType } from 'discord-interactions';
import { NetworkService } from './service.js';
import { InteractionsAPI } from '../../resources/interactions.js';
import { DiscordClient } from '../../client/index.js';

export async function handleNetworkCommands(interaction, env) {
  const networkService = new NetworkService(env);
  const client = new DiscordClient(env.DISCORD_TOKEN, {}, env);
  const interactionsApi = new InteractionsAPI(client);
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
      case 'ping': {
        const host = subcommand.options?.find(opt => opt.name === 'host')?.value;
        if (!host) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '请提供要测试的主机！',
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
            const result = await networkService.ping(host);
            if (!result.success) {
              await interactionsApi.editReply(
                env.DISCORD_APPLICATION_ID,
                interaction.token,
                {
                  content: `Ping 失败：${result.error}`,
                  flags: 64
                }
              );
              return;
            }

            await interactionsApi.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: `Ping 结果：\n延迟：${result.latency}ms\n状态码：${result.status}`
              }
            );
          } catch (error) {
            console.error('[Network] Error pinging host:', error);
            await interactionsApi.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '执行 ping 时发生错误！',
                flags: 64
              }
            );
          }
        })());

        return response;
      }

      case 'lookup': {
        const domain = subcommand.options?.find(opt => opt.name === 'domain')?.value;
        if (!domain) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '请提供要查询的域名！',
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
            const result = await networkService.lookup(domain);
            if (!result.success) {
              await interactionsApi.editReply(
                env.DISCORD_APPLICATION_ID,
                interaction.token,
                {
                  content: `DNS 查询失败：${result.error}`,
                  flags: 64
                }
              );
              return;
            }

            const records = result.records
              .map(record => `类型：${record.type}, TTL：${record.TTL}, 数据：${record.data}`)
              .join('\n');

            await interactionsApi.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: `DNS 记录：\n${records}`
              }
            );
          } catch (error) {
            console.error('[Network] Error looking up domain:', error);
            await interactionsApi.editReply(
              env.DISCORD_APPLICATION_ID,
              interaction.token,
              {
                content: '执行 DNS 查询时发生错误！',
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
    console.error('[Network] Error handling command:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '处理命令时发生错误！',
        flags: 64
      }
    };
  }
}
