import { OnboardingRepository } from './repository.js';

export class OnboardingService {
  constructor(env) {
    this.repository = new OnboardingRepository(env);
    this.env = env;
  }

  async getUserProgress(userId, guildId) {
    return this.repository.getUserProgress(userId, guildId);
  }

  async updateUserProgress(userId, guildId, step) {
    return this.repository.updateUserProgress(userId, guildId, step);
  }

  async completeOnboarding(userId, guildId) {
    return this.repository.completeOnboarding(userId, guildId);
  }
}
