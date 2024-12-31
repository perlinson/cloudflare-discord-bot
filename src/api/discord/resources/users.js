import { Endpoints } from '../client/constants.js';

export class UsersAPI {
  constructor(client) {
    this.client = client;
  }

  async get(userId = '@me') {
    return this.client.get(Endpoints.USER(userId));
  }

  async createDM(recipientId) {
    return this.client.post(Endpoints.USER_DM, {
      recipient_id: recipientId,
    });
  }

  async getGuilds(userId = '@me') {
    return this.client.get(`${Endpoints.USER(userId)}/guilds`);
  }

  async modifyCurrentUser(data) {
    return this.client.patch(Endpoints.USER('@me'), data);
  }

  async getCurrentUserGuildMember(guildId) {
    return this.client.get(`${Endpoints.USER('@me')}/guilds/${guildId}/member`);
  }

  async leaveGuild(guildId) {
    return this.client.delete(`${Endpoints.USER('@me')}/guilds/${guildId}`);
  }

  async getConnections() {
    return this.client.get(`${Endpoints.USER('@me')}/connections`);
  }

  async createGroupDM(accessTokens, nicks) {
    return this.client.post(`${Endpoints.USER('@me')}/channels`, {
      access_tokens: accessTokens,
      nicks,
    });
  }
}
