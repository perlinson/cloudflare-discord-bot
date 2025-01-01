

export class ComponentBuilder {
  static ButtonStyle = {
    PRIMARY: 1,
    SECONDARY: 2,
    SUCCESS: 3,
    DANGER: 4,
    LINK: 5
  };

  constructor() {
    this.components = [];
    this.currentRow = null;
  }

  addRow() {
    this.currentRow = {
      type: 1,
      components: []
    };
    this.components.push(this.currentRow);
    return this;
  }

  addButton(label, customId, style = ComponentBuilder.ButtonStyle.PRIMARY, disabled = false, emoji = null) {
    if (!this.currentRow) {
      this.addRow();
    }

    const button = {
      type: 2,
      label,
      custom_id: customId,
      style,
      disabled
    };

    if (emoji) {
      button.emoji = emoji;
    }

    this.currentRow.components.push(button);
    return this;
  }

  addLinkButton(label, url, disabled = false, emoji = null) {
    if (!this.currentRow) {
      this.addRow();
    }

    const button = {
      type: 2,
      label,
      url,
      style: ComponentBuilder.ButtonStyle.LINK,
      disabled
    };

    if (emoji) {
      button.emoji = emoji;
    }

    this.currentRow.components.push(button);
    return this;
  }

  toJSON() {
    return this.components;
  }
}

export class MessageBuilder {
  constructor() {
    this.message = {
      content: null,
      embeds: [],
      components: [],
      flags: 0
    };
  }

  setContent(content) {
    this.message.content = content;
    return this;
  }

  addEmbed(embed) {
    this.message.embeds.push(embed instanceof EmbedBuilder ? embed.toJSON() : embed);
    return this;
  }

  addComponents(components) {
    if (components instanceof ComponentBuilder) {
      this.message.components = components.toJSON();
    } else {
      this.message.components = components;
    }
    return this;
  }

  setEphemeral(ephemeral = true) {
    if (ephemeral) {
      this.message.flags |= 64;
    } else {
      this.message.flags &= ~64;
    }
    return this;
  }

  toJSON() {
    return Object.fromEntries(
      Object.entries(this.message).filter(([_, v]) => {
        if (Array.isArray(v)) return v.length > 0;
        return v != null;
      })
    );
  }
}
