import { NetworkRepository } from './repository.js';

export class NetworkService {
  constructor(env) {
    this.repository = new NetworkRepository(env);
    this.env = env;
  }

  async ping(host) {
    try {
      const start = Date.now();
      const response = await fetch(`https://${host}`);
      const end = Date.now();
      const latency = end - start;

      return {
        success: response.ok,
        latency,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async lookup(domain) {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}`);
      const data = await response.json();
      return {
        success: true,
        records: data.Answer || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
