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

// Main Discord interaction route
// Main Discord interaction route
router.post('/interactions', async (request, env, ctx) => {
  const discordClient = new DiscordClient(env.DISCORD_TOKEN, {}, env);
  const { isValid, interaction } = await verifyDiscordRequest(request, env);
  if (!isValid || !interaction) {
    return new Response('Bad request signature.', { status: 401 });
  }

  // Handle different types of interactions
  if (interaction.type === InteractionType.PING) {
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }
  
  try {
    const response = await discordClient.handleInteraction(interaction);
    
    // 如果有长时间运行的任务，使用 ctx.waitUntil
    if (response.backgroundTask) {
      ctx.waitUntil(response.backgroundTask);
      delete response.backgroundTask;
    }
    
    return new JsonResponse(response);
  } catch (error) {
    console.error('Error handling interaction:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

// Image progress update route
router.post('/api/image-progress', async (request, env) => {
  try {
    // const { runId, channelId, messageId } = await request.json();
    // const elapsedTime = imageService.getElapsedTime(runId);
    
    // if (!elapsedTime) {
    //   return new Response('Task not found', { status: 404 });
    // }

    // // Update Discord message
    // const response = await fetch(`${DISCORD_API_URL}/v10/channels/${channelId}/messages/${messageId}`, {
    //   method: 'PATCH',
    //   headers: {
    //     'Authorization': `Bot ${env.DISCORD_TOKEN}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     content: `⏳ Generating image... (${elapsedTime}s)`,
    //   }),
    // });

    // if (!response.ok) {
    //   throw new Error(`Failed to update Discord message: ${response.status}`);
    // }

    return new Response('OK');
  } catch (error) {
    console.error('Error updating progress:', error);
    return new Response(error.message, { status: 500 });
  }
});

// ComfyDeploy webhook handler
router.post('/api/comfy-webhook', async (request, env) => {
  console.log('Received webhook request at /api/comfy-webhook');
  try {
    if (!imageService.cd) {
      console.log('Initializing imageService for webhook');
      imageService.initialize(env);
    }

    const result = await imageService.handleWebhook(request);
    return new JsonResponse(result || { status: 'ok' });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response(error.message, { status: 500 });
  }
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