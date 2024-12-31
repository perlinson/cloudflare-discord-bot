import { DiscordClient } from './api/discord/client/index.js';
import { Logger } from './utils/logger.js';
import { verifyKey } from 'discord-interactions';
import { InteractionType, InteractionResponseType } from 'discord-interactions';

const logger = new Logger({ prefix: 'Worker' });

export default {
  async fetch(request, env, ctx) {
    try {
      // 1. 验证请求
      const { isValid, interaction } = await verifyDiscordRequest(request, env);
      if (!isValid || !interaction) {
        logger.warn('Invalid request signature');
        return new Response('Bad request signature', { status: 401 });
      }

      // 2. 处理 PING
      if (interaction.type === InteractionType.PING) {
        logger.info('Handling PING interaction');
        return new Response(JSON.stringify({
          type: InteractionResponseType.PONG
        }), {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      // 3. 处理其他交互
      logger.info('Processing interaction:', {
        type: interaction.type,
        commandName: interaction.data?.name
      });

      const client = new DiscordClient(env.DISCORD_TOKEN, {}, env);
      
      // 设置超时处理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Command processing timed out'));
        }, 5000); // 5 秒超时
      });

      // 使用 Promise.race 来处理超时
      const response = await Promise.race([
        client.handleInteraction(interaction),
        timeoutPromise
      ]);

      if (!response) {
        throw new Error('No response received from command handler');
      }

      logger.info('Interaction handled successfully');
      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      logger.error('Error handling request:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });

      // 确保总是返回一个有效的响应
      return new Response(JSON.stringify({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `处理请求时发生错误！\n错误信息：${error.message}`,
          flags: 64
        }
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
};

async function verifyDiscordRequest(request, env) {
  try {
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const body = await request.clone().text();

    logger.info('Verifying request:', {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      bodyLength: body.length
    });

    const isValidRequest = signature && 
      timestamp && 
      await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);

    if (!isValidRequest) {
      logger.warn('Invalid Discord request signature');
      return { isValid: false };
    }

    const interaction = JSON.parse(body);
    logger.info('Request verified successfully');
    return { isValid: true, interaction };
  } catch (error) {
    logger.error('Error verifying request:', error);
    return { isValid: false };
  }
}
