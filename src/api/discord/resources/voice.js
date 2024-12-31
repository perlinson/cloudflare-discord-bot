import { Endpoints } from '../client/constants.js';

export class VoiceAPI {
  constructor(client) {
    this.client = client;
  }

  // 语音状态
  async setVoiceState(guildId, userId, data) {
    return this.client.patch(`/guilds/${guildId}/voice-states/${userId}`, {
      channel_id: data.channelId,
      suppress: data.suppress,
      request_to_speak_timestamp: data.requestToSpeak ? new Date().toISOString() : null,
    });
  }

  // 语音区域
  async listVoiceRegions() {
    return this.client.get('/voice/regions');
  }

  // 语音连接
  async getVoiceConnections() {
    return this.client.get('/voice/connections');
  }

  async createVoiceConnection(channelId, data) {
    return this.client.post(`/channels/${channelId}/voice`, {
      guild_id: data.guildId,
      self_mute: data.selfMute,
      self_deaf: data.selfDeaf,
    });
  }

  async modifyVoiceConnection(guildId, data) {
    return this.client.patch(`/guilds/${guildId}/voice`, {
      channel_id: data.channelId,
      self_mute: data.selfMute,
      self_deaf: data.selfDeaf,
    });
  }

  async deleteVoiceConnection(guildId) {
    return this.client.delete(`/guilds/${guildId}/voice`);
  }

  // 舞台实例
  async createStageInstance(channelId, data) {
    return this.client.post('/stage-instances', {
      channel_id: channelId,
      topic: data.topic,
      privacy_level: data.privacyLevel,
      send_start_notification: data.sendStartNotification,
    });
  }

  async getStageInstance(channelId) {
    return this.client.get(`/stage-instances/${channelId}`);
  }

  async modifyStageInstance(channelId, data) {
    return this.client.patch(`/stage-instances/${channelId}`, {
      topic: data.topic,
      privacy_level: data.privacyLevel,
    });
  }

  async deleteStageInstance(channelId) {
    return this.client.delete(`/stage-instances/${channelId}`);
  }

  // 语音设置
  async getVoiceSettings() {
    return this.client.get('/users/@me/settings');
  }

  async updateVoiceSettings(data) {
    return this.client.patch('/users/@me/settings', {
      voice_settings: data,
    });
  }
}
