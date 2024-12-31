import { Endpoints } from '../client/constants.js';

export class WebhooksAPI {
  constructor(client) {
    this.client = client;
  }

  async get(webhookId) {
    return this.client.get(`/webhooks/${webhookId}`);
  }

  async getWithToken(webhookId, webhookToken) {
    return this.client.get(`/webhooks/${webhookId}/${webhookToken}`);
  }

  async modify(webhookId, data) {
    return this.client.patch(`/webhooks/${webhookId}`, data);
  }

  async modifyWithToken(webhookId, webhookToken, data) {
    return this.client.patch(`/webhooks/${webhookId}/${webhookToken}`, data);
  }

  async delete(webhookId) {
    return this.client.delete(`/webhooks/${webhookId}`);
  }

  async deleteWithToken(webhookId, webhookToken) {
    return this.client.delete(`/webhooks/${webhookId}/${webhookToken}`);
  }

  async execute(webhookId, webhookToken, data) {
    return this.client.post(`/webhooks/${webhookId}/${webhookToken}`, data);
  }

  async executeSlack(webhookId, webhookToken, data) {
    return this.client.post(`/webhooks/${webhookId}/${webhookToken}/slack`, data);
  }

  async executeGitHub(webhookId, webhookToken, data) {
    return this.client.post(`/webhooks/${webhookId}/${webhookToken}/github`, data);
  }

  async getMessage(webhookId, webhookToken, messageId) {
    return this.client.get(`/webhooks/${webhookId}/${webhookToken}/messages/${messageId}`);
  }

  async editMessage(webhookId, webhookToken, messageId, data) {
    return this.client.patch(`/webhooks/${webhookId}/${webhookToken}/messages/${messageId}`, data);
  }

  async deleteMessage(webhookId, webhookToken, messageId) {
    return this.client.delete(`/webhooks/${webhookId}/${webhookToken}/messages/${messageId}`);
  }
}
