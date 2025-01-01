import { Endpoints, InteractionResponseTypes } from '../client/constants.js';

export class InteractionsAPI {
  constructor(client) {
    this.client = client;
  }

  async reply(interactionId, token, response) {
    return this.client.post(
      Endpoints.INTERACTION_CALLBACK(interactionId, token),
      {
        type: InteractionResponseTypes.CHANNEL_MESSAGE,
        data: typeof response === 'string' ? { content: response } : response,
      }
    );
  }

  async deferReply(interactionId, token, ephemeral = false) {
    return this.client.post(
      Endpoints.INTERACTION_CALLBACK(interactionId, token),
      {
        type: InteractionResponseTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: ephemeral ? 64 : undefined },
      }
    );
  }

  async followUp(interactionId, token, response) {
    return this.client.post(
      Endpoints.INTERACTION_FOLLOWUP(interactionId, token),
      typeof response === 'string' ? { content: response } : response
    );
  }

  async editReply(interactionId, token, response) {
    return this.client.patch(
      Endpoints.INTERACTION_RESPONSE(interactionId, token),
      typeof response === 'string' ? { content: response } : response
    );
  }

  async deleteReply(interactionId, token) {
    return this.client.delete(
      Endpoints.INTERACTION_RESPONSE(interactionId, token)
    );
  }

  async showModal(interactionId, token, modal) {
    return this.client.post(
      Endpoints.INTERACTION_CALLBACK(interactionId, token),
      {
        type: InteractionResponseTypes.MODAL,
        data: modal,
      }
    );
  }

  async updateMessage(interactionId, token, response) {
    return this.client.post(
      Endpoints.INTERACTION_CALLBACK(interactionId, token),
      {
        type: InteractionResponseTypes.UPDATE_MESSAGE,
        data: typeof response === 'string' ? { content: response } : response,
      }
    );
  }

  async autocomplete(interactionId, token, choices) {
    return this.client.post(
      Endpoints.INTERACTION_CALLBACK(interactionId, token),
      {
        type: InteractionResponseTypes.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
        data: { choices },
      }
    );
  }
}
