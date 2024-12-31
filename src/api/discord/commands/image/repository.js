export class ImageRepository {
  constructor(env) {
    this.env = env;
    this.kv = env.KV;
  }

  async saveImageData(userId, imageData) {
    const key = `image:${userId}:history`;
    const history = await this.getImageHistory(userId);
    history.unshift(imageData);
    await this.kv.put(key, JSON.stringify(history.slice(0, 10)));
  }

  async getImageHistory(userId) {
    const key = `image:${userId}:history`;
    const history = await this.kv.get(key);
    return history ? JSON.parse(history) : [];
  }
}
