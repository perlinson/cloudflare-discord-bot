import { Endpoints } from '../client/constants.js';

export class MessagesAPI {
  constructor(client) {
    this.client = client;
  }

  async send(channelId, content) {
    return this.client.post(
      Endpoints.CHANNEL_MESSAGES(channelId),
      typeof content === 'string' ? { content } : content
    );
  }

  async edit(channelId, messageId, content) {
    return this.client.patch(
      Endpoints.CHANNEL_MESSAGE(channelId, messageId),
      typeof content === 'string' ? { content } : content
    );
  }

  async delete(channelId, messageId) {
    return this.client.delete(Endpoints.CHANNEL_MESSAGE(channelId, messageId));
  }

  async get(channelId, messageId) {
    return this.client.get(Endpoints.CHANNEL_MESSAGE(channelId, messageId));
  }

  async bulkDelete(channelId, messageIds) {
    return this.client.post(
      `${Endpoints.CHANNEL_MESSAGES(channelId)}/bulk-delete`,
      { messages: messageIds }
    );
  }

  async pin(channelId, messageId) {
    return this.client.put(
      `${Endpoints.CHANNEL_MESSAGE(channelId, messageId)}/pin`
    );
  }

  async unpin(channelId, messageId) {
    return this.client.delete(
      `${Endpoints.CHANNEL_MESSAGE(channelId, messageId)}/pin`
    );
  }

  async react(channelId, messageId, emoji) {
    return this.client.put(
      `${Endpoints.CHANNEL_MESSAGE(channelId, messageId)}/reactions/${emoji}/@me`
    );
  }

  async removeReaction(channelId, messageId, emoji, userId = '@me') {
    return this.client.delete(
      `${Endpoints.CHANNEL_MESSAGE(channelId, messageId)}/reactions/${emoji}/${userId}`
    );
  }

  async clearReactions(channelId, messageId) {
    return this.client.delete(
      `${Endpoints.CHANNEL_MESSAGE(channelId, messageId)}/reactions`
    );
  }
}