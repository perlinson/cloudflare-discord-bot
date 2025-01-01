import { PrismaClient } from '@prisma/client'
  import { PrismaD1 } from '@prisma/adapter-d1'
export class ImageRepository {
  constructor(env) {
    this.env = env;
    this.kv = env.KV;
    const adapter = new PrismaD1(env.MY_DATABASE)
    this.prisma = new PrismaClient({ adapter })
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
