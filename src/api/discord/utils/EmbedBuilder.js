export class EmbedBuilder {
  constructor() {
    this.data = {};
  }

  setTitle(title) {
    this.data.title = title;
    return this;
  }

  setDescription(description) {
    this.data.description = description;
    return this;
  }

  setURL(url) {
    this.data.url = url;
    return this;
  }

  setTimestamp(timestamp = new Date()) {
    this.data.timestamp = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
    return this;
  }

  setColor(color) {
    this.data.color = typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color;
    return this;
  }

  setFooter(text, iconURL) {
    this.data.footer = { text };
    if (iconURL) this.data.footer.icon_url = iconURL;
    return this;
  }

  setImage(url) {
    this.data.image = { url };
    return this;
  }

  setThumbnail(url) {
    this.data.thumbnail = { url };
    return this;
  }

  setAuthor(name, iconURL, url) {
    this.data.author = { name };
    if (iconURL) this.data.author.icon_url = iconURL;
    if (url) this.data.author.url = url;
    return this;
  }

  addField(name, value, inline = false) {
    this.data.fields = this.data.fields || [];
    this.data.fields.push({ name, value, inline });
    return this;
  }

  addFields(...fields) {
    this.data.fields = this.data.fields || [];
    this.data.fields.push(...fields);
    return this;
  }

  setFields(fields) {
    this.data.fields = fields;
    return this;
  }

  toJSON() {
    return this.data;
  }
}
