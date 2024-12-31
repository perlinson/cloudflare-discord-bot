import { ShareRepository } from './repository.js';

export class ShareService {
  constructor(env) {
    this.repository = new ShareRepository(env);
    this.env = env;
  }

  async shareContent(userId, content, type) {
    const shareData = {
      userId,
      content,
      type,
      timestamp: Date.now(),
      likes: 0,
      comments: []
    };

    return this.repository.createShare(shareData);
  }

  async likeShare(shareId, userId) {
    return this.repository.likeShare(shareId, userId);
  }

  async addComment(shareId, userId, comment) {
    return this.repository.addComment(shareId, userId, comment);
  }

  async getShare(shareId) {
    return this.repository.getShare(shareId);
  }

  async getUserShares(userId) {
    return this.repository.getUserShares(userId);
  }
}
