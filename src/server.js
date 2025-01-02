/**
 * The core server that runs on a Cloudflare worker.
 */

import { AutoRouter } from 'itty-router';
import {
  InteractionType,
  InteractionResponseType,
  verifyKey,
} from 'discord-interactions';
import { DiscordClient } from './api/discord/client/index.js';
import { DISCORD_API_URL } from './api/discord/client/constants.js';
import { GuildMemberEvents } from './api/discord/events/guildMember.js';
import { imageService } from './api/discord/commands/image/service.js';

class JsonResponse extends Response {
  constructor(body, init) {
    const jsonBody = JSON.stringify(body);
    init = init || {};
    init.headers = {
      ...init.headers,
      'content-type': 'application/json;charset=UTF-8',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    };
    super(jsonBody, init);
  }
}

// Create router
const router = AutoRouter();

// Discord request verification
async function verifyDiscordRequest(request, env) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.clone().text();

  const isValidRequest = signature && 
    timestamp && 
    (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
    
  if (!isValidRequest) {
    console.error('Invalid Discord request signature');
    return { isValid: false };
  }

  try {
    const interaction = JSON.parse(body);
    return { isValid: true, interaction };
  } catch (error) {
    console.error('Error parsing interaction body:', error);
    return { isValid: false };
  }
}

// Root route
router.get('/', (request, env) => {
  return new Response(`👋 ${env.DISCORD_APPLICATION_ID}`, {
    headers: {
      'content-type': 'text/plain;charset=UTF-8',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    }
  });
});

// Discord interaction callback route
router.post('/interactions/:interactionId/:token/callback', async (request, env) => {
  try {
    const { interactionId, token } = request.params;
    const body = await request.json();
    
    console.log('Interaction callback:', {
      interactionId,
      token,
      body
    });

    return new JsonResponse(body);
  } catch (error) {
    console.error('Error handling interaction callback:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

// Discord webhook route
router.post('/webhooks/:applicationId/:token', async (request, env) => {
  try {
    const { applicationId, token } = request.params;
    const body = await request.json();
    
    console.log('Webhook request:', {
      applicationId,
      token,
      body
    });

    return new JsonResponse(body);
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

// 添加一个测试路由
router.post('/webhook-test', async (request, env, ctx) => {
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  const body = await request.json().catch(() => ({}));
  console.log('Body:', body);
  
  return new JsonResponse({
    message: 'Webhook test received',
    headers: Object.fromEntries(request.headers.entries()),
    body: body
  });
});

router.post ('/', async (request, env, ctx) => {
  // 检查是否是 Discord 事件
  const eventType = request.headers.get('X-Discord-Event-Type');
  if (eventType) {
    console.log('Received Discord event:', eventType);
    
    try {
      const eventData = await request.json();
      console.log('Event data:', eventData);

      const discordClient = new DiscordClient(env.DISCORD_TOKEN, {}, env);
      const guildMemberEvents = new GuildMemberEvents(discordClient);

      switch (eventType) {
        case 'GUILD_MEMBER_ADD':
          console.log('Member added:', eventData);
          await guildMemberEvents.handleMemberAdd(eventData);
          break;
        case 'GUILD_MEMBER_REMOVE':
          console.log('Member removed:', eventData);
          await guildMemberEvents.handleMemberRemove(eventData);
          break;
        default:
          console.log('Unhandled event type:', eventType);
      }

      return new JsonResponse({ success: true });
    } catch (error) {
      console.error('Error handling Discord event:', error);
      return new JsonResponse({ error: 'Internal server error' }, { status: 500 });
    }
  }

  // 处理常规的 Discord 交互
  const { isValid, interaction } = await verifyDiscordRequest(request, env);
  if (!isValid || !interaction) {
    return new Response('Bad request signature.', { status: 401 });
  }

  if (interaction.type === InteractionType.PING) {
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }

  // 处理其他交互
  try {
    const discordClient = new DiscordClient(env.DISCORD_TOKEN, {}, env);
    const response = await discordClient.handleInteraction(interaction);
    return new JsonResponse(response);
  } catch (error) {
    console.error('Error handling interaction:', error);
    return new JsonResponse(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Main Discord interaction route
router.post('/interactions', async (request, env, ctx) => {
  console.log('Received interaction request');
  
  // 创建一个新的 Promise 来处理请求
  const responsePromise = new Promise(async (resolve, reject) => {
    try {
      const { isValid, interaction } = await verifyDiscordRequest(request, env);
      if (!isValid || !interaction) {
        console.error('Invalid Discord request');
        resolve(new Response('Bad request signature.', { status: 401 }));
        return;
      }

      console.log('Interaction verified:', {
        type: interaction.type,
        data: interaction.data
      });

      const client = new DiscordClient(env.DISCORD_TOKEN, {}, env);
      const response = await client.handleInteraction(interaction, env);
      
      console.log('Interaction handled, sending response');
      resolve(new JsonResponse(response));
    } catch (error) {
      console.error('Error in interaction route:', {
        error: error.message,
        stack: error.stack
      });
      resolve(new Response('Internal Server Error', { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack
        })
      }));
    }
  });

  // 等待 Promise 完成或超时
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Response('Request timed out', { status: 504 }));
    }, 25000); // 25 秒超时
  });

  // 使用 ctx.waitUntil 确保异步操作完成
  ctx.waitUntil(responsePromise);

  // 返回先完成的 Promise
  return Promise.race([responsePromise, timeoutPromise]);
});

// Image progress update route
router.post('/api/image-progress', async (request, env) => {
  try {
    const { runId, channelId, messageId } = await request.json();
    const elapsedTime = imageService.getElapsedTime(runId);
    
    if (!elapsedTime) {
      return new Response('Task not found', { status: 404 });
    }

    // Update Discord message
    const response = await fetch(`${DISCORD_API_URL}/v10/channels/${channelId}/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bot ${env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `⏳ Generating image... (${elapsedTime}s)`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update Discord message: ${response.status}`);
    }

    return new Response('OK');
  } catch (error) {
    console.error('Error updating progress:', error);
    return new Response(error.message, { status: 500 });
  }
});

// ComfyDeploy webhook handler
router.post('/api/comfy-webhook', async (request, env) => {

  try {
    if (!imageService.cd) {
      console.log('Initializing imageService for webhook');
      imageService.initialize(env);
    }

    const result = await imageService.handleWebhook(request, env);
    return new JsonResponse(result || { status: 'ok' });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response(error.message, { status: 500 });
  }
});

router.get('/api/comfy-webhook', async (request, env) => {
  return new JsonResponse({ status: 'ok' });
});

// Health check
router.get('/health', () => new Response('OK'));

// Favicon route
router.get('/favicon.ico', () => new Response(null, { status: 204 }));

// Catch-all route
router.all('*', () => new Response('Not Found.', { status: 404 }));

// Register event handler
export default {
  verifyDiscordRequest,
  fetch: router.fetch
};