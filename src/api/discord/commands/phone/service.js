import { PhoneRepository } from './repository.js';

export class PhoneService {
  constructor(env) {
    this.repository = new PhoneRepository(env);
    this.env = env;
  }

  async createCall(fromUserId, toUserId, channelId) {
    return this.repository.createCall(fromUserId, toUserId, channelId);
  }

  async endCall(callId) {
    return this.repository.endCall(callId);
  }

  async getActiveCall(userId) {
    return this.repository.getActiveCall(userId);
  }

  async getCallHistory(userId) {
    return this.repository.getCallHistory(userId);
  }
}
