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
        type: InteractionResponseTypes.DEFERRED_CHANNEL_MESSAGE,
        data: { flags: ephemeral ? 64 : undefined },
      }
    );
  }

  async followUp(applicationId, token, response) {
    return this.client.post(
      Endpoints.INTERACTION_FOLLOWUP(applicationId, token),
      typeof response === 'string' ? { content: response } : response
    );
  }

  async editReply(applicationId, token, response) {
    return this.client.patch(
      Endpoints.INTERACTION_RESPONSE(applicationId, token),
      typeof response === 'string' ? { content: response } : response
    );
  }

  async deleteReply(applicationId, token) {
    return this.client.delete(
      Endpoints.INTERACTION_RESPONSE(applicationId, token)
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
