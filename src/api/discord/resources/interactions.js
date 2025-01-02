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
    this.client.logger.info('Deferring reply:', {
      interactionId,
      token: token.substring(0, 10) + '...',
      ephemeral
    });

    const endpoint = Endpoints.INTERACTION_CALLBACK(interactionId, token);
    const payload = {
      type: InteractionResponseTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      data: { flags: ephemeral ? 64 : undefined }
    };

    this.client.logger.info('Defer reply request:', {
      endpoint,
      payload
    });

    try {
      const response = await this.client.post(endpoint, payload);
      this.client.logger.info('Deferred reply response:', { response });
      return response;
    } catch (error) {
      this.client.logger.error('Defer reply failed:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async followUp(interactionId, token, response) {
    return this.client.post(
      Endpoints.INTERACTION_FOLLOWUP(interactionId, token),
      typeof response === 'string' ? { content: response } : response
    );
  }

  async editReply(interactionId, token, response) {
    this.client.logger.info('Editing reply:', {
      interactionId,
      token: token.substring(0, 10) + '...',
      responseType: typeof response,
      responseContent: typeof response === 'string' ? response : 'object'
    });

    const endpoint = Endpoints.INTERACTION_RESPONSE(interactionId, token);
    this.client.logger.info('Edit reply endpoint:', { endpoint });

    const result = await this.client.patch(
      endpoint,
      typeof response === 'string' ? { content: response } : response
    );

    this.client.logger.info('Edit reply result:', { result });
    return result;
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
