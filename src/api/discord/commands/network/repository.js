export class NetworkRepository {
  constructor(env) {
    this.env = env;
    this.kv = env.KV;
  }

  async saveNetworkTest(userId, testData) {
    const key = `network:${userId}:history`;
    const history = await this.getNetworkHistory(userId);
    history.unshift(testData);
    await this.kv.put(key, JSON.stringify(history.slice(0, 10)));
  }

  async getNetworkHistory(userId) {
    const key = `network:${userId}:history`;
    const history = await this.kv.get(key);
    return history ? JSON.parse(history) : [];
  }
}
