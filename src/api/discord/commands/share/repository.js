export class ShareRepository {
  constructor(env) {
    this.env = env;
    this.kv = env.KV;
  }

  async createShare(shareData) {
    const shareId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    shareData.id = shareId;

    await this.kv.put(`share:${shareId}`, JSON.stringify(shareData));
    await this.addToUserShares(shareData.userId, shareId);

    return shareData;
  }

  async likeShare(shareId, userId) {
    const shareData = await this.getShare(shareId);
    if (!shareData) return null;

    const likeKey = `share:${shareId}:likes`;
    const likes = await this.kv.get(likeKey);
    const likesList = likes ? JSON.parse(likes) : [];

    if (likesList.includes(userId)) {
      return shareData;
    }

    likesList.push(userId);
    shareData.likes = likesList.length;

    await this.kv.put(likeKey, JSON.stringify(likesList));
    await this.kv.put(`share:${shareId}`, JSON.stringify(shareData));

    return shareData;
  }

  async addComment(shareId, userId, comment) {
    const shareData = await this.getShare(shareId);
    if (!shareData) return null;

    const commentData = {
      userId,
      content: comment,
      timestamp: Date.now()
    };

    shareData.comments.push(commentData);
    await this.kv.put(`share:${shareId}`, JSON.stringify(shareData));

    return shareData;
  }

  async getShare(shareId) {
    const shareData = await this.kv.get(`share:${shareId}`);
    return shareData ? JSON.parse(shareData) : null;
  }

  async getUserShares(userId) {
    const key = `user:${userId}:shares`;
    const shares = await this.kv.get(key);
    const shareIds = shares ? JSON.parse(shares) : [];

    const sharesList = await Promise.all(
      shareIds.map(shareId => this.getShare(shareId))
    );

    return sharesList.filter(Boolean);
  }

  async addToUserShares(userId, shareId) {
    const key = `user:${userId}:shares`;
    const shares = await this.kv.get(key);
    const sharesList = shares ? JSON.parse(shares) : [];
    sharesList.unshift(shareId);
    await this.kv.put(key, JSON.stringify(sharesList.slice(0, 50)));
  }
}
