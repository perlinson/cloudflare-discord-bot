import { Endpoints } from '../client/constants.js';

export class EmojiAPI {
  constructor(client) {
    this.client = client;
  }

  // 服务器表情符号
  async listGuildEmojis(guildId) {
    return this.client.get(`/guilds/${guildId}/emojis`);
  }

  async getGuildEmoji(guildId, emojiId) {
    return this.client.get(`/guilds/${guildId}/emojis/${emojiId}`);
  }

  async createGuildEmoji(guildId, data) {
    return this.client.post(`/guilds/${guildId}/emojis`, {
      name: data.name,
      image: data.image,
      roles: data.roles,
    });
  }

  async modifyGuildEmoji(guildId, emojiId, data) {
    return this.client.patch(`/guilds/${guildId}/emojis/${emojiId}`, {
      name: data.name,
      roles: data.roles,
    });
  }

  async deleteGuildEmoji(guildId, emojiId) {
    return this.client.delete(`/guilds/${guildId}/emojis/${emojiId}`);
  }

  // 贴纸
  async getSticker(stickerId) {
    return this.client.get(`/stickers/${stickerId}`);
  }

  async listNitroStickerPacks() {
    return this.client.get('/sticker-packs');
  }

  async listGuildStickers(guildId) {
    return this.client.get(`/guilds/${guildId}/stickers`);
  }

  async getGuildSticker(guildId, stickerId) {
    return this.client.get(`/guilds/${guildId}/stickers/${stickerId}`);
  }

  async createGuildSticker(guildId, data) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('tags', data.tags);
    formData.append('file', data.file);

    return this.client.post(`/guilds/${guildId}/stickers`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async modifyGuildSticker(guildId, stickerId, data) {
    return this.client.patch(`/guilds/${guildId}/stickers/${stickerId}`, {
      name: data.name,
      description: data.description,
      tags: data.tags,
    });
  }

  async deleteGuildSticker(guildId, stickerId) {
    return this.client.delete(`/guilds/${guildId}/stickers/${stickerId}`);
  }
}
