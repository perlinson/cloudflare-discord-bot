/**
 * The core server that runs on a Cloudflare worker.
 */

import { AutoRouter } from 'itty-router';
import {
  InteractionType,
  InteractionResponseType,
  verifyKey,
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
import { handleChatbotCommands as handleChatCommands } from './chatbot/handlers.js';
import { handleEconomyCommands } from './economy/handlers.js';
import { handleImageAICommands as handleImageCommands } from './imageai/handlers.js';
import { handleLevelsCommands as handleLevelCommands } from './levels/handlers.js';
import { handleNetworkCommands } from './network/handlers.js';
import { handleOnboardingCommands } from './onboarding/handlers.js';
import { handlePhoneCommands } from './phone/handlers.js';
import { handleShareCommands } from './share/handlers.js';

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
async function verifyDiscordRequest(request) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.clone().text();
  
  if (!verifyKey(body, signature, timestamp, process.env.DISCORD_PUBLIC_KEY)) {
    return new Response('Invalid request signature', { status: 401 });
  }
}

// Handle interactions
router.post('/interactions', async (request) => {
  const { type, data } = await request.json();

  if (type === InteractionType.PING) {
    return new Response(
      JSON.stringify({ type: InteractionResponseType.PONG }),
      { headers: { 'Content-Type': 'application/json' }}
    );
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    let response;

    try {
      switch(true) {
        case name.startsWith('chat'):
          response = await handleChatCommands(data);
          break;
        case name.startsWith('economy'):
          response = await handleEconomyCommands(data);
          break;
        case name.startsWith('image'):
          response = await handleImageCommands(data);
          break;
        case name.startsWith('level'):
          response = await handleLevelCommands(data);
          break;
        case name.startsWith('network'):
          response = await handleNetworkCommands(data);
          break;
        case name.startsWith('onboarding'):
          response = await handleOnboardingCommands(data);
          break;
        case name.startsWith('phone'):
          response = await handlePhoneCommands(data);
          break;
        case name.startsWith('share'):
          response = await handleShareCommands(data);
          break;
        default:
          return new Response('Command not found', { status: 404 });
      }

      return new Response(
        JSON.stringify(response),
        { headers: { 'Content-Type': 'application/json' }}
      );

    } catch (error) {
      console.error('Error handling command:', error);
      return new Response(
        JSON.stringify({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'An error occurred while processing your command.',
            flags: 64, // EPHEMERAL
          },
        }),
        { headers: { 'Content-Type': 'application/json' }}
      );
    }
  }

  return new Response('Unknown interaction type', { status: 400 });
});

// Health check
router.get('/health', () => new Response('OK'));

// Export worker
export default {
  async fetch(request, env, ctx) {
    request.env = env;
    
    if (request.method === 'POST') {
      const verificationResponse = verifyDiscordRequest(request);
      if (verificationResponse) return verificationResponse;
    }

    return router.handle(request);
  },
};
