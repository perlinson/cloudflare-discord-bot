import { MessageFlags } from '../client/constants.js';

export class MessageBuilder {
  constructor() {
    this.data = {};
  }

  setContent(content) {
    this.data.content = content;
    return this;
  }

  setEmbed(embed) {
    this.data.embeds = this.data.embeds || [];
    this.data.embeds.push(embed);
    return this;
  }

  setEmbeds(embeds) {
    this.data.embeds = embeds;
    return this;
  }

  addEmbed(embed) {
    this.data.embeds = this.data.embeds || [];
    this.data.embeds.push(embed);
    return this;
  }

  setComponents(components) {
    this.data.components = components;
    return this;
  }

  addComponent(component) {
    this.data.components = this.data.components || [];
    this.data.components.push(component);
    return this;
  }

  setEphemeral(ephemeral = true) {
    if (ephemeral) {
      this.data.flags = (this.data.flags || 0) | MessageFlags.EPHEMERAL;
    }
    return this;
  }

  suppressEmbeds(suppress = true) {
    if (suppress) {
      this.data.flags = (this.data.flags || 0) | MessageFlags.SUPPRESS_EMBEDS;
    }
    return this;
  }

  setAllowedMentions(parse = [], users = [], roles = [], repliedUser = false) {
    this.data.allowed_mentions = {
      parse,
      users,
      roles,
      replied_user: repliedUser
    };
    return this;
  }

  setTTS(tts = true) {
    this.data.tts = tts;
    return this;
  }

  setFile(file, name) {
    this.data.files = this.data.files || [];
    this.data.files.push({ file, name });
    return this;
  }

  setFiles(files) {
    this.data.files = files;
    return this;
  }

  toJSON() {
    return this.data;
  }
}
