import { Endpoints } from '../client/constants.js';

export class ChannelsAPI {
  constructor(client) {
    this.client = client;
  }

  async get(channelId) {
    return this.client.get(Endpoints.CHANNELS(channelId));
  }

  async modify(channelId, data) {
    return this.client.patch(Endpoints.CHANNELS(channelId), data);
  }

  async delete(channelId) {
    return this.client.delete(Endpoints.CHANNELS(channelId));
  }

  async getMessages(channelId, options = {}) {
    const query = new URLSearchParams(options).toString();
    return this.client.get(`${Endpoints.CHANNEL_MESSAGES(channelId)}?${query}`);
  }

  async createInvite(channelId, options = {}) {
    return this.client.post(`${Endpoints.CHANNELS(channelId)}/invites`, options);
  }

  async getPins(channelId) {
    return this.client.get(Endpoints.CHANNEL_PINS(channelId));
  }

  async createWebhook(channelId, data) {
    return this.client.post(`${Endpoints.CHANNELS(channelId)}/webhooks`, data);
  }

  async getWebhooks(channelId) {
    return this.client.get(`${Endpoints.CHANNELS(channelId)}/webhooks`);
  }

  async startTyping(channelId) {
    return this.client.post(`${Endpoints.CHANNELS(channelId)}/typing`);
  }

  async addGroupDMRecipient(channelId, userId, data) {
    return this.client.put(
      `${Endpoints.CHANNELS(channelId)}/recipients/${userId}`,
      data
    );
  }

  async removeGroupDMRecipient(channelId, userId) {
    return this.client.delete(
      `${Endpoints.CHANNELS(channelId)}/recipients/${userId}`
    );
  }

  async setPermissions(channelId, overwriteId, data) {
    return this.client.put(
      `${Endpoints.CHANNELS(channelId)}/permissions/${overwriteId}`,
      data
    );
  }

  async deletePermission(channelId, overwriteId) {
    return this.client.delete(
      `${Endpoints.CHANNELS(channelId)}/permissions/${overwriteId}`
    );
  }

  async triggerTyping(channelId) {
    return this.client.post(`${Endpoints.CHANNELS(channelId)}/typing`);
  }

  async getPinnedMessages(channelId) {
    return this.client.get(`${Endpoints.CHANNELS(channelId)}/pins`);
  }

  async follow(channelId, webhookChannelId) {
    return this.client.post(`${Endpoints.CHANNELS(channelId)}/followers`, {
      webhook_channel_id: webhookChannelId,
    });
  }
}
