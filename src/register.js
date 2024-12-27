import 'dotenv/config';
import fetch from 'node-fetch';
import { PHONE_COMMANDS } from './phone/commands.js';
import { ECONOMY_COMMANDS } from './economy/commands.js';
import { CHATBOT_COMMANDS } from './chatbot/commands.js';
import { LEVELS_COMMANDS } from './levels/commands.js';
import { IMAGEAI_COMMANDS } from './imageai/commands.js';
import { SHARE_COMMANDS } from './share/commands.js';
import { NETWORK_COMMANDS } from './network/commands.js';
import { ONBOARDING_COMMANDS } from './onboarding/commands.js';
import { HttpsProxyAgent } from 'https-proxy-agent';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;

if (!DISCORD_TOKEN || !DISCORD_APPLICATION_ID) {
  console.error('Required environment variables are missing!');
  process.exit(1);
}

// Create a proxy agent (using a public proxy - replace with a more reliable one if needed)
const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:7897');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDiscordAPI() {
  console.log(`Testing Discord API connection...${DISCORD_TOKEN}`);
  try {
    const response = await fetch('https://discord.com/api/v10/applications/@me', {
      headers: {
        Authorization: `Bot ${DISCORD_TOKEN}`,
      },
      agent: proxyAgent,
    });

    if (!response.ok) {
      throw new Error(`API test failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully connected to Discord API');
    console.log('Bot application name:', data.name);
    return true;
  } catch (error) {
    console.error('Failed to connect to Discord API:', error);
    return false;
  }
}

async function registerCommandWithRetry(command, retries = 3) {
  const url = `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${DISCORD_TOKEN}`,
        },
        method: 'POST',
        body: JSON.stringify(command),
        agent: proxyAgent,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error registering command ${command.name}: ${text}`);
      }

      console.log(`Successfully registered command: ${command.name}`);
      return response.json();
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed for command ${command.name}:`, error.message);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await sleep(Math.min(1000 * Math.pow(2, attempt - 1), 10000));
    }
  }
}

async function registerCommands() {
  console.log('Registering commands...');

  // First test the API connection
  if (!await testDiscordAPI()) {
    console.error('Could not connect to Discord API. Please check your network connection and token.');
    process.exit(1);
  }

  const allCommands = [
    ...Object.values(PHONE_COMMANDS),
    ...Object.values(ECONOMY_COMMANDS),
    ...Object.values(CHATBOT_COMMANDS),
    ...Object.values(LEVELS_COMMANDS),
    ...Object.values(IMAGEAI_COMMANDS),
    ...Object.values(SHARE_COMMANDS),
    ...Object.values(NETWORK_COMMANDS),
    ...Object.values(ONBOARDING_COMMANDS),
  ];

  try {
    for (const command of allCommands) {
      console.log(`Registering command: ${command.name}`);
      await registerCommandWithRetry(command);
      // Add a small delay between commands to avoid rate limits
      await sleep(1000);
    }
    console.log('All commands registered successfully!');
  } catch (error) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
}

registerCommands();
