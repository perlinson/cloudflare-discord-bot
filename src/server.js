/**
 * The core server that runs on a Cloudflare worker.
 */

import { AutoRouter } from 'itty-router';
import {
  InteractionType,
  InteractionResponseType,
  verifyKey,
  InteractionResponseFlags,
} from 'discord-interactions';

// Import commands
import { CHATBOT_COMMANDS } from './chatbot/commands.js';
import { ECONOMY_COMMANDS } from './economy/commands.js';
import { IMAGEAI_COMMANDS as IMAGE_COMMANDS } from './imageai/commands.js';
import { LEVELS_COMMANDS as LEVEL_COMMANDS } from './levels/commands.js';
import { NETWORK_COMMANDS } from './network/commands.js';
import { ONBOARDING_COMMANDS } from './onboarding/commands.js';
import { PHONE_COMMANDS } from './phone/commands.js';
import { SHARE_COMMANDS } from './share/commands.js';

// Import handlers
import { handleChatCommands } from './chatbot/handlers.js';
import { handleEconomyCommands } from './economy/handlers.js';
import { handleImageCommands } from './imageai/handlers.js';
import { handleLevelCommands } from './levels/handlers.js';
import { handleNetworkCommands } from './network/handlers.js';
import { handleOnboardingCommands } from './onboarding/handlers.js';
import { handlePhoneCommands } from './phone/handlers.js';
import { handleShareCommands } from './share/handlers.js';
import { imageService } from './imageai/service.js';

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

// Register commands
const ALL_COMMANDS = [
  ...Object.values(CHATBOT_COMMANDS),
  ...Object.values(ECONOMY_COMMANDS),
  ...Object.values(IMAGE_COMMANDS),
  ...Object.values(LEVEL_COMMANDS),
  ...Object.values(NETWORK_COMMANDS),
  ...Object.values(ONBOARDING_COMMANDS),
  ...Object.values(PHONE_COMMANDS),
  ...Object.values(SHARE_COMMANDS),
];

// Discord request verification
async function verifyDiscordRequest(request, env) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.clone().text();
  
  console.log('Signature:', signature);
  console.log('Timestamp:', timestamp);
  console.log('Request body:', body);
  console.log('Public Key:', env.DISCORD_PUBLIC_KEY);

  const isValidRequest = signature && 
    timestamp && 
    (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
    
  console.log('Is Valid Request:', isValidRequest);
    
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

// Main Discord interaction route
router.post('/interactions', async (request, env) => {
  const { isValid, interaction } = await verifyDiscordRequest(request, env);
  if (!isValid || !interaction) {
    return new Response('Bad request signature.', { status: 401 });
  }

  console.log('Received interaction:', JSON.stringify(interaction, null, 2));

  // Handle different types of interactions
  if (interaction.type === InteractionType.PING) {
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    // 获取命令名称和子命令
    const { name, options } = interaction.data;
    console.log('Command name:', name);
    console.log('Options:', JSON.stringify(options, null, 2));

    switch (name.toLowerCase()) {
      case 'image':
        return handleImageCommands(interaction, env);
      case 'level':
        return handleLevelCommands(interaction, env);
      case 'onboarding':
        return handleOnboardingCommands(interaction, env);
      case 'phone':
        return handlePhoneCommands(interaction, env);
      case 'share':
        return handleShareCommands(interaction, env);
      default:
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Unknown command',
          },
        });
    }
  }

  return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
});

// 添加一个新的路由来处理图像生成进度更新
router.post('/api/image-progress', async (request, env) => {
    try {
        const { runId, channelId, messageId } = await request.json();
        const elapsedTime = imageService.getElapsedTime(runId);
        
        if (!elapsedTime) {
            return new Response('Task not found', { status: 404 });
        }

        // 更新 Discord 消息
        const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
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

// ComfyDeploy webhook 处理
router.post('/api/comfy-webhook', async (request, env) => {
  console.log('Received webhook request at /api/comfy-webhook');
  try {
    // 确保 imageService 已初始化
    if (!imageService.cd) {
      console.log('Initializing imageService for webhook');
      imageService.initialize(env);
    }

    // 检查请求对象
    if (!request || !request.url) {
      console.error('Invalid request object:', request);
      throw new Error('Invalid request: missing URL');
    }

    // 获取请求的原始 URL
    const requestUrl = request.url;
    console.log('Request URL:', requestUrl);

    // 构建完整的 webhook URL
    const webhookUrl = 'https://globalcord.xingxuantechnology.cn/api/comfy-webhook';
    console.log('Webhook URL:', webhookUrl);

    // 获取请求头和请求体
    const headers = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('Request headers:', headers);

    const bodyText = await request.text();
    console.log('Request body:', bodyText);

    // 创建新的请求对象
    const newRequest = new Request(webhookUrl, {
      method: 'POST',
      headers: new Headers(headers),
      body: bodyText
    });

    console.log('Created new request:', {
      url: newRequest.url,
      method: newRequest.method,
      hasHeaders: !!newRequest.headers,
      hasBody: !!newRequest.body
    });

    // 处理 webhook
    return await imageService.handleWebhook(newRequest);
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack, 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Health check
router.get('/health', () => new Response('OK'));

// Favicon route
router.get('/favicon.ico', () => new Response(null, { status: 204 }));

// Catch-all route
router.all('*', () => new Response('Not Found', { status: 404 }));

const server = {
  verifyDiscordRequest,
  fetch: router.fetch,
};

export default server;