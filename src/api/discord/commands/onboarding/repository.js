export class OnboardingRepository {
  constructor(env) {
    this.env = env;
    this.kv = env.KV;
  }

  async getUserProgress(userId, guildId) {
    const key = `onboarding:${guildId}:${userId}`;
    const progress = await this.kv.get(key);
    return progress ? JSON.parse(progress) : { step: 0, completed: false };
  }

  async updateUserProgress(userId, guildId, step) {
    const key = `onboarding:${guildId}:${userId}`;
    const progress = { step, completed: false };
    await this.kv.put(key, JSON.stringify(progress));
    return progress;
  }

  async completeOnboarding(userId, guildId) {
    const key = `onboarding:${guildId}:${userId}`;
    const progress = { step: -1, completed: true };
    await this.kv.put(key, JSON.stringify(progress));
    return progress;
  }
}
