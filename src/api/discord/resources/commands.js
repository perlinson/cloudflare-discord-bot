import { Endpoints } from '../client/constants.js';

export class CommandsAPI {
  constructor(client) {
    this.client = client;
  }

  // 全局命令
  async getGlobalCommands(applicationId) {
    return this.client.get(Endpoints.GLOBAL_COMMANDS(applicationId));
  }

  async createGlobalCommand(applicationId, data) {
    return this.client.post(Endpoints.GLOBAL_COMMANDS(applicationId), data);
  }

  async getGlobalCommand(applicationId, commandId) {
    return this.client.get(`${Endpoints.GLOBAL_COMMANDS(applicationId)}/${commandId}`);
  }

  async editGlobalCommand(applicationId, commandId, data) {
    return this.client.patch(`${Endpoints.GLOBAL_COMMANDS(applicationId)}/${commandId}`, data);
  }

  async deleteGlobalCommand(applicationId, commandId) {
    return this.client.delete(`${Endpoints.GLOBAL_COMMANDS(applicationId)}/${commandId}`);
  }

  async bulkOverwriteGlobalCommands(applicationId, commands) {
    return this.client.post(Endpoints.GLOBAL_COMMANDS(applicationId), commands);
  }

  // 服务器命令
  async getGuildCommands(applicationId, guildId) {
    return this.client.get(Endpoints.GUILD_COMMANDS(applicationId, guildId));
  }

  async createGuildCommand(applicationId, guildId, data) {
    return this.client.post(Endpoints.GUILD_COMMANDS(applicationId, guildId), data);
  }

  async getGuildCommand(applicationId, guildId, commandId) {
    return this.client.get(`${Endpoints.GUILD_COMMANDS(applicationId, guildId)}/${commandId}`);
  }

  async editGuildCommand(applicationId, guildId, commandId, data) {
    return this.client.patch(`${Endpoints.GUILD_COMMANDS(applicationId, guildId)}/${commandId}`, data);
  }

  async deleteGuildCommand(applicationId, guildId, commandId) {
    return this.client.delete(`${Endpoints.GUILD_COMMANDS(applicationId, guildId)}/${commandId}`);
  }

  async bulkOverwriteGuildCommands(applicationId, guildId, commands) {
    return this.client.post(Endpoints.GUILD_COMMANDS(applicationId, guildId), commands);
  }

  // 命令权限
  async getCommandPermissions(applicationId, guildId, commandId) {
    return this.client.get(`${Endpoints.GUILD_COMMANDS(applicationId, guildId)}/${commandId}/permissions`);
  }

  async editCommandPermissions(applicationId, guildId, commandId, permissions) {
    return this.client.post(
      `${Endpoints.GUILD_COMMANDS(applicationId, guildId)}/${commandId}/permissions`,
      permissions
    );
  }

  async getGuildCommandPermissions(applicationId, guildId) {
    return this.client.get(`/applications/${applicationId}/guilds/${guildId}/commands/permissions`);
  }

  async batchEditCommandPermissions(applicationId, guildId, permissions) {
    return this.client.post(
      `/applications/${applicationId}/guilds/${guildId}/commands/permissions`,
      permissions
    );
  }
}
