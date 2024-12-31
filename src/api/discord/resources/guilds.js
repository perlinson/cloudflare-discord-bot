import { Endpoints } from '../client/constants.js';

export class GuildsAPI {
  constructor(client) {
    this.client = client;
  }

  async get(guildId) {
    return this.client.get(Endpoints.GUILD(guildId));
  }

  async modify(guildId, data) {
    return this.client.patch(Endpoints.GUILD(guildId), data);
  }

  async delete(guildId) {
    return this.client.delete(Endpoints.GUILD(guildId));
  }

  // Member methods
  async getMembers(guildId, options = {}) {
    const query = new URLSearchParams(options).toString();
    return this.client.get(`${Endpoints.GUILD_MEMBERS(guildId)}?${query}`);
  }

  async getMember(guildId, userId) {
    return this.client.get(Endpoints.GUILD_MEMBER(guildId, userId));
  }

  async modifyMember(guildId, userId, data) {
    return this.client.patch(Endpoints.GUILD_MEMBER(guildId, userId), data);
  }

  async kickMember(guildId, userId, reason) {
    const options = reason ? { headers: { 'X-Audit-Log-Reason': reason } } : {};
    return this.client.delete(Endpoints.GUILD_MEMBER(guildId, userId), options);
  }

  // Role methods
  async getRoles(guildId) {
    return this.client.get(Endpoints.GUILD_ROLES(guildId));
  }

  async createRole(guildId, data) {
    return this.client.post(Endpoints.GUILD_ROLES(guildId), data);
  }

  async modifyRole(guildId, roleId, data) {
    return this.client.patch(Endpoints.GUILD_ROLE(guildId, roleId), data);
  }

  async deleteRole(guildId, roleId) {
    return this.client.delete(Endpoints.GUILD_ROLE(guildId, roleId));
  }

  async addMemberRole(guildId, userId, roleId, reason) {
    const options = reason ? { headers: { 'X-Audit-Log-Reason': reason } } : {};
    return this.client.put(
      `${Endpoints.GUILD_MEMBER(guildId, userId)}/roles/${roleId}`,
      null,
      options
    );
  }

  async removeMemberRole(guildId, userId, roleId, reason) {
    const options = reason ? { headers: { 'X-Audit-Log-Reason': reason } } : {};
    return this.client.delete(
      `${Endpoints.GUILD_MEMBER(guildId, userId)}/roles/${roleId}`,
      options
    );
  }

  // Ban methods
  async getBans(guildId) {
    return this.client.get(`${Endpoints.GUILD(guildId)}/bans`);
  }

  async getBan(guildId, userId) {
    return this.client.get(`${Endpoints.GUILD(guildId)}/bans/${userId}`);
  }

  async createBan(guildId, userId, data = {}) {
    return this.client.put(`${Endpoints.GUILD(guildId)}/bans/${userId}`, data);
  }

  async removeBan(guildId, userId, reason) {
    const options = reason ? { headers: { 'X-Audit-Log-Reason': reason } } : {};
    return this.client.delete(`${Endpoints.GUILD(guildId)}/bans/${userId}`, options);
  }
}
