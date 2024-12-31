import { ChatbotService } from '../../../../services/chatbot.js';

export async function handleChatCommands(interaction, env) {
  const subcommand = interaction.data.options?.[0];
  
  if (!subcommand) {
    return {
      type: 4,
      data: {
        content: 'Invalid command!',
        flags: 64
      }
    };
  }

  try {
    switch (subcommand.name) {
      case 'settings':
        return handleChatbotSettingsCommand(interaction, subcommand, env);
      case 'clear':
        return handleChatbotClearCommand(interaction, env);
      case 'character':
        return handleChatbotCharacterCommand(interaction, subcommand, env);
      default:
        return {
          type: 4,
          data: {
            content: 'Unknown command!',
            flags: 64
          }
        };
    }
  } catch (error) {
    console.error('[Chatbot] Error handling command:', error);
    return {
      type: 4,
      data: {
        content: 'An error occurred while processing your request!',
        flags: 64
      }
    };
  }
}

async function handleChatbotSettingsCommand(interaction, subcommand, env) {
  const chatbotService = new ChatbotService(env);
  const setting = subcommand.options.find(opt => opt.name === 'setting').value;
  const value = subcommand.options.find(opt => opt.name === 'value').value;

  try {
    const settings = await chatbotService.updateSettings(interaction.member.user.id, {
      [setting]: value,
    });

    return {
      type: 4,
      data: {
        content: `Successfully updated ${setting} to ${value}`,
      },
    };
  } catch (error) {
    return {
      type: 4,
      data: {
        content: `Failed to update settings: ${error.message}`,
        flags: 64,
      },
    };
  }
}

async function handleChatbotClearCommand(interaction, env) {
  const chatbotService = new ChatbotService(env);

  try {
    await chatbotService.clearHistory(interaction.member.user.id);
    return {
      type: 4,
      data: {
        content: 'Chat history cleared successfully!',
      },
    };
  } catch (error) {
    return {
      type: 4,
      data: {
        content: `Failed to clear chat history: ${error.message}`,
        flags: 64,
      },
    };
  }
}

async function handleChatbotCharacterCommand(interaction, subcommand, env) {
  const chatbotService = new ChatbotService(env);
  const character = subcommand.options.find(opt => opt.name === 'character').value;

  try {
    await chatbotService.setCharacter(interaction.member.user.id, character);
    return {
      type: 4,
      data: {
        content: `Character set to: ${character}`,
      },
    };
  } catch (error) {
    return {
      type: 4,
      data: {
        content: `Failed to set character: ${error.message}`,
        flags: 64,
      },
    };
  }
}
