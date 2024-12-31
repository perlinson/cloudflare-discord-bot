import { Logger } from '../utils/logger.js';
import { DiscordClient } from '../api/discord/client/index.js';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Import all commands
import { EconomyCommands } from '../api/discord/commands/economy/index.js';
import { ImageCommands } from '../api/discord/commands/image/index.js';
// import { NetworkCommands } from '../api/discord/commands/network/index.js';
import { ChatbotCommands } from '../api/discord/commands/chatbot/index.js';
import { ShareCommands } from '../api/discord/commands/share/index.js'; 
import { config } from 'dotenv';
import fetch from 'node-fetch';
config();

// Initialize logger
const logger = new Logger({ prefix: 'CommandRegistration' });

// Combine all commands
const ALL_COMMANDS = [
  ...Object.values(EconomyCommands),
  ...Object.values(ImageCommands),
  ...Object.values(ChatbotCommands),
  ...Object.values(ShareCommands),
];

const agent = new HttpsProxyAgent('http://127.0.0.1:7897');

async function bulkOverwriteGuildCommands(){


  const discordClient = new DiscordClient(process.env.DISCORD_TOKEN, {}, process.env);

  if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_APPLICATION_ID) {
    throw new Error('Missing required environment variables');
  }

  const url = `https://discord.com/api/v10/applications/${process.env.DISCORD_APPLICATION_ID}/commands`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
    },
    method: 'PUT',
    body: JSON.stringify(ALL_COMMANDS),
    agent: agent
  });

  if (response.ok) {
    logger.info('Registered all commands');
  } else {
    const text = await response.text();
    logger.error('Error registering commands:', text);
    throw new Error(`Failed to register commands: ${text}`);
  }
  return response;
}

// Run the registration
bulkOverwriteGuildCommands()
  .then(() => {
    logger.info('Command registration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Command registration failed:', error);
    process.exit(1);
  });