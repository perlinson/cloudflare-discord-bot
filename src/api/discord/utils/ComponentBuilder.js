export class ComponentBuilder {
  static ButtonStyles = {
    PRIMARY: 1,
    SECONDARY: 2,
    SUCCESS: 3,
    DANGER: 4,
    LINK: 5,
  };

  static TextInputStyles = {
    SHORT: 1,
    PARAGRAPH: 2,
  };

  constructor() {
    this.components = [];
  }

  addActionRow() {
    const row = {
      type: 1,
      components: [],
    };
    this.components.push(row);
    return this;
  }

  addButton(options) {
    if (!this.components.length || this.components[this.components.length - 1].type !== 1) {
      this.addActionRow();
    }

    const button = {
      type: 2,
      style: options.style || ComponentBuilder.ButtonStyles.PRIMARY,
      label: options.label,
      custom_id: options.customId,
      url: options.url,
      disabled: options.disabled,
      emoji: options.emoji,
    };

    const currentRow = this.components[this.components.length - 1];
    currentRow.components.push(button);
    return this;
  }

  addSelectMenu(options) {
    if (!this.components.length || this.components[this.components.length - 1].type !== 1) {
      this.addActionRow();
    }

    const selectMenu = {
      type: 3,
      custom_id: options.customId,
      options: options.options,
      placeholder: options.placeholder,
      min_values: options.minValues,
      max_values: options.maxValues,
      disabled: options.disabled,
    };

    const currentRow = this.components[this.components.length - 1];
    currentRow.components.push(selectMenu);
    return this;
  }

  addTextInput(options) {
    if (!this.components.length || this.components[this.components.length - 1].type !== 1) {
      this.addActionRow();
    }

    const textInput = {
      type: 4,
      custom_id: options.customId,
      style: options.style || ComponentBuilder.TextInputStyles.SHORT,
      label: options.label,
      min_length: options.minLength,
      max_length: options.maxLength,
      required: options.required,
      value: options.value,
      placeholder: options.placeholder,
    };

    const currentRow = this.components[this.components.length - 1];
    currentRow.components.push(textInput);
    return this;
  }

  toJSON() {
    return this.components;
  }
}
