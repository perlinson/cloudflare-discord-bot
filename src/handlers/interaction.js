import { CommandHandler } from './commands/index.js';
import { ComponentHandler } from './components/index.js';
import { AutocompleteHandler } from './autocomplete/index.js';
import { ModalHandler } from './modals/index.js';
import { InteractionResponseTypes } from '../api/discord/client/constants.js';

export async function handleInteraction(interaction, env, ctx) {
  try {
    let response;

    switch (interaction.type) {
      case 1: // PING
        response = { type: InteractionResponseTypes.PONG };
        break;

      case 2: // APPLICATION_COMMAND
        response = await CommandHandler.handle(interaction, env, ctx);
        break;

      case 3: // MESSAGE_COMPONENT
        response = await ComponentHandler.handle(interaction, env, ctx);
        break;

      case 4: // APPLICATION_COMMAND_AUTOCOMPLETE
        response = await AutocompleteHandler.handle(interaction, env, ctx);
        break;

      case 5: // MODAL_SUBMIT
        response = await ModalHandler.handle(interaction, env, ctx);
        break;

      default:
        response = {
          type: InteractionResponseTypes.CHANNEL_MESSAGE,
          data: {
            content: 'Unknown interaction type',
            flags: 64, // EPHEMERAL
          },
        };
    }

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling interaction:', error);
    
    return new Response(
      JSON.stringify({
        type: InteractionResponseTypes.CHANNEL_MESSAGE,
        data: {
          content: 'An error occurred while processing your request.',
          flags: 64, // EPHEMERAL
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}
