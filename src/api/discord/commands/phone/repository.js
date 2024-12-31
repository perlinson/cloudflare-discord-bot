export class PhoneRepository {
  constructor(env) {
    this.env = env;
    this.kv = env.KV;
  }

  async createCall(fromUserId, toUserId, channelId) {
    const callId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const call = {
      id: callId,
      fromUserId,
      toUserId,
      channelId,
      startTime: Date.now(),
      endTime: null,
      status: 'active'
    };

    await this.kv.put(`call:${callId}`, JSON.stringify(call));
    await this.kv.put(`user:${fromUserId}:active_call`, callId);
    await this.kv.put(`user:${toUserId}:active_call`, callId);

    return call;
  }

  async endCall(callId) {
    const callData = await this.kv.get(`call:${callId}`);
    if (!callData) return null;

    const call = JSON.parse(callData);
    call.endTime = Date.now();
    call.status = 'ended';

    await this.kv.put(`call:${callId}`, JSON.stringify(call));
    await this.kv.delete(`user:${call.fromUserId}:active_call`);
    await this.kv.delete(`user:${call.toUserId}:active_call`);

    // Add to history
    await this.addToHistory(call.fromUserId, call);
    await this.addToHistory(call.toUserId, call);

    return call;
  }

  async getActiveCall(userId) {
    const callId = await this.kv.get(`user:${userId}:active_call`);
    if (!callId) return null;

    const callData = await this.kv.get(`call:${callId}`);
    return callData ? JSON.parse(callData) : null;
  }

  async getCallHistory(userId) {
    const key = `user:${userId}:call_history`;
    const history = await this.kv.get(key);
    return history ? JSON.parse(history) : [];
  }

  async addToHistory(userId, call) {
    const key = `user:${userId}:call_history`;
    const history = await this.getCallHistory(userId);
    history.unshift(call);
    await this.kv.put(key, JSON.stringify(history.slice(0, 10)));
  }
}
