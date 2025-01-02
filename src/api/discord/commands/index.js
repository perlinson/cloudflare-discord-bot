import { EconomyCommands } from './economy/index.js';
import { ImageCommands } from './image/index.js';
import { LevelCommands } from './levels/index.js';
import { ChatbotCommands } from './chatbot/index.js';
import { ShareCommands } from './share/index.js';

import { handleEconomyCommands } from './economy/handlers.js';
import { handleImageCommands } from './image/handlers.js';
import { handleShareCommands } from './share/handlers.js';

// Export all commands
export const Commands = {
  ...EconomyCommands,
  ...ImageCommands,
  ...LevelCommands,
  ...ChatbotCommands,
  ...ShareCommands,
};

// Command handlers map
const handlers = {
  economy: handleEconomyCommands,

  image: handleImageCommands,

  // level: handleLevelCommands,

  // chatbot: handleChatbotCommands,

  share: handleShareCommands,
};

// Main command handler
export async function handleCommand(interaction, client, env) {
  const { name } = interaction.data;
  console.log(`Handling interaction: ${interaction}`);
  const handler = handlers[name];

  if (!handler) {
    throw new Error(`Unknown command: ${name}`);
  }

  return handler(interaction, client, env);
}
