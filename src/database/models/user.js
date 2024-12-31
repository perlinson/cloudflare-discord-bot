export class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.discriminator = data.discriminator;
    this.avatar = data.avatar;
    this.bot = data.bot || false;
    this.system = data.system || false;
    this.flags = data.flags || 0;
    this.createdAt = data.created_at || new Date().toISOString();
    this.updatedAt = data.updated_at || new Date().toISOString();
  }

  static tableName = 'users';

  static async findById(db, id) {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    const result = await stmt.get(id);
    return result ? new User(result) : null;
  }

  static async create(db, data) {
    const stmt = db.prepare(`
      INSERT INTO ${this.tableName} (
        id, username, discriminator, avatar, bot, system, flags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const user = new User(data);
    await stmt.run(
      user.id,
      user.username,
      user.discriminator,
      user.avatar,
      user.bot,
      user.system,
      user.flags,
      user.createdAt,
      user.updatedAt
    );

    return user;
  }

  async update(db, data) {
    const stmt = db.prepare(`
      UPDATE ${this.tableName} SET
        username = ?,
        discriminator = ?,
        avatar = ?,
        bot = ?,
        system = ?,
        flags = ?,
        updated_at = ?
      WHERE id = ?
    `);

    Object.assign(this, data);
    this.updatedAt = new Date().toISOString();

    await stmt.run(
      this.username,
      this.discriminator,
      this.avatar,
      this.bot,
      this.system,
      this.flags,
      this.updatedAt,
      this.id
    );

    return this;
  }

  async delete(db) {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    await stmt.run(this.id);
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      discriminator: this.discriminator,
      avatar: this.avatar,
      bot: this.bot,
      system: this.system,
      flags: this.flags,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}
