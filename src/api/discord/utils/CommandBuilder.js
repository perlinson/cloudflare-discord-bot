export class CommandBuilder {
  static ApplicationCommandTypes = {
    CHAT_INPUT: 1,
    USER: 2,
    MESSAGE: 3,
  };

  static OptionTypes = {
    SUB_COMMAND: 1,
    SUB_COMMAND_GROUP: 2,
    STRING: 3,
    INTEGER: 4,
    BOOLEAN: 5,
    USER: 6,
    CHANNEL: 7,
    ROLE: 8,
    MENTIONABLE: 9,
    NUMBER: 10,
    ATTACHMENT: 11,
  };

  constructor(data = {}) {
    this.data = {
      type: data.type || CommandBuilder.ApplicationCommandTypes.CHAT_INPUT,
      name: data.name || '',
      description: data.description || '',
      options: data.options || [],
      default_member_permissions: data.defaultMemberPermissions,
      dm_permission: data.dmPermission,
      nsfw: data.nsfw,
    };
  }

  setName(name) {
    if (!name || name.length < 1 || name.length > 32 || !/^[\w-]{1,32}$/.test(name)) {
      throw new Error('Command name must be between 1 and 32 characters and match the regex ^[\\w-]{1,32}$');
    }
    this.data.name = name.toLowerCase();
    return this;
  }

  setDescription(description) {
    if (!description || description.length < 1 || description.length > 100) {
      throw new Error('Command description must be between 1 and 100 characters');
    }
    this.data.description = description;
    return this;
  }

  setType(type) {
    this.data.type = type;
    return this;
  }

  setDefaultMemberPermissions(permissions) {
    this.data.default_member_permissions = permissions;
    return this;
  }

  setDMPermission(allowed) {
    this.data.dm_permission = allowed;
    return this;
  }

  setNSFW(nsfw) {
    this.data.nsfw = nsfw;
    return this;
  }

  addOption(option) {
    if (!option.name || option.name.length < 1 || option.name.length > 32 || !/^[\w-]{1,32}$/.test(option.name)) {
      throw new Error('Option name must be between 1 and 32 characters and match the regex ^[\\w-]{1,32}$');
    }
    if (!option.description || option.description.length < 1 || option.description.length > 100) {
      throw new Error('Option description must be between 1 and 100 characters');
    }

    const opt = {
      type: option.type,
      name: option.name.toLowerCase(),
      description: option.description,
      required: option.required ?? false,
    };

    if (option.choices) opt.choices = option.choices;
    if (option.minValue !== undefined) opt.min_value = option.minValue;
    if (option.maxValue !== undefined) opt.max_value = option.maxValue;
    if (option.minLength !== undefined) opt.min_length = option.minLength;
    if (option.maxLength !== undefined) opt.max_length = option.maxLength;
    if (option.autocomplete !== undefined) opt.autocomplete = option.autocomplete;
    if (option.channelTypes !== undefined) opt.channel_types = option.channelTypes;

    this.data.options.push(opt);
    return this;
  }

  addSubcommand(fn) {
    const builder = new SubcommandBuilder();
    fn(builder);
    
    const subcommand = builder.toJSON();
    subcommand.type = CommandBuilder.OptionTypes.SUB_COMMAND;
    
    this.data.options.push(subcommand);
    return this;
  }

  addSubcommandGroup(fn) {
    const builder = new SubcommandGroupBuilder();
    fn(builder);
    
    const group = builder.toJSON();
    group.type = CommandBuilder.OptionTypes.SUB_COMMAND_GROUP;
    
    this.data.options.push(group);
    return this;
  }

  addStringOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.STRING);
    fn(builder);
    return this.addOption(builder.toJSON());
  }

  addIntegerOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.INTEGER);
    fn(builder);
    return this.addOption(builder.toJSON());
  }

  addBooleanOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.BOOLEAN);
    fn(builder);
    return this.addOption(builder.toJSON());
  }

  addUserOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.USER);
    fn(builder);
    return this.addOption(builder.toJSON());
  }

  addChannelOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.CHANNEL);
    fn(builder);
    return this.addOption(builder.toJSON());
  }

  addRoleOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.ROLE);
    fn(builder);
    return this.addOption(builder.toJSON());
  }

  addMentionableOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.MENTIONABLE);
    fn(builder);
    return this.addOption(builder.toJSON());
  }

  addNumberOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.NUMBER);
    fn(builder);
    return this.addOption(builder.toJSON());
  }

  addAttachmentOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.ATTACHMENT);
    fn(builder);
    return this.addOption(builder.toJSON());
  }

  toJSON() {
    return this.data;
  }
}

class SubcommandBuilder {
  constructor() {
    this.data = {
      name: '',
      description: '',
      options: [],
    };
  }

  setName(name) {
    if (!name || name.length < 1 || name.length > 32 || !/^[\w-]{1,32}$/.test(name)) {
      throw new Error('Subcommand name must be between 1 and 32 characters and match the regex ^[\\w-]{1,32}$');
    }
    this.data.name = name.toLowerCase();
    return this;
  }

  setDescription(description) {
    if (!description || description.length < 1 || description.length > 100) {
      throw new Error('Subcommand description must be between 1 and 100 characters');
    }
    this.data.description = description;
    return this;
  }

  addStringOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.STRING);
    fn(builder);
    this.data.options.push(builder.toJSON());
    return this;
  }

  addIntegerOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.INTEGER);
    fn(builder);
    this.data.options.push(builder.toJSON());
    return this;
  }

  addBooleanOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.BOOLEAN);
    fn(builder);
    this.data.options.push(builder.toJSON());
    return this;
  }

  addUserOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.USER);
    fn(builder);
    this.data.options.push(builder.toJSON());
    return this;
  }

  addChannelOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.CHANNEL);
    fn(builder);
    this.data.options.push(builder.toJSON());
    return this;
  }

  addRoleOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.ROLE);
    fn(builder);
    this.data.options.push(builder.toJSON());
    return this;
  }

  addMentionableOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.MENTIONABLE);
    fn(builder);
    this.data.options.push(builder.toJSON());
    return this;
  }

  addNumberOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.NUMBER);
    fn(builder);
    this.data.options.push(builder.toJSON());
    return this;
  }

  addAttachmentOption(fn) {
    const builder = new OptionBuilder(CommandBuilder.OptionTypes.ATTACHMENT);
    fn(builder);
    this.data.options.push(builder.toJSON());
    return this;
  }

  toJSON() {
    return this.data;
  }
}

class SubcommandGroupBuilder {
  constructor() {
    this.data = {
      name: '',
      description: '',
      options: [],
    };
  }

  setName(name) {
    if (!name || name.length < 1 || name.length > 32 || !/^[\w-]{1,32}$/.test(name)) {
      throw new Error('Subcommand group name must be between 1 and 32 characters and match the regex ^[\\w-]{1,32}$');
    }
    this.data.name = name.toLowerCase();
    return this;
  }

  setDescription(description) {
    if (!description || description.length < 1 || description.length > 100) {
      throw new Error('Subcommand group description must be between 1 and 100 characters');
    }
    this.data.description = description;
    return this;
  }

  addSubcommand(fn) {
    const builder = new SubcommandBuilder();
    fn(builder);
    this.data.options.push({
      ...builder.toJSON(),
      type: CommandBuilder.OptionTypes.SUB_COMMAND,
    });
    return this;
  }

  toJSON() {
    return this.data;
  }
}

class OptionBuilder {
  constructor(type) {
    this.data = {
      type,
      name: '',
      description: '',
      required: false,
    };
  }

  setName(name) {
    if (!name || name.length < 1 || name.length > 32 || !/^[\w-]{1,32}$/.test(name)) {
      throw new Error('Option name must be between 1 and 32 characters and match the regex ^[\\w-]{1,32}$');
    }
    this.data.name = name.toLowerCase();
    return this;
  }

  setDescription(description) {
    if (!description || description.length < 1 || description.length > 100) {
      throw new Error('Option description must be between 1 and 100 characters');
    }
    this.data.description = description;
    return this;
  }

  setRequired(required) {
    this.data.required = required;
    return this;
  }

  setChoices(choices) {
    // Discord expects an array of name/value pairs
    if (!Array.isArray(choices)) {
      throw new Error('Choices must be an array');
    }
    
    this.data.choices = choices.map(choice => ({
      name: choice.name,
      value: choice.value
    }));
    return this;
  }

  setMinValue(minValue) {
    this.data.min_value = minValue;
    return this;
  }

  setMaxValue(maxValue) {
    this.data.max_value = maxValue;
    return this;
  }

  setMinLength(minLength) {
    this.data.min_length = minLength;
    return this;
  }

  setMaxLength(maxLength) {
    this.data.max_length = maxLength;
    return this;
  }

  setAutocomplete(autocomplete) {
    this.data.autocomplete = autocomplete;
    return this;
  }

  setChannelTypes(channelTypes) {
    this.data.channel_types = channelTypes;
    return this;
  }

  toJSON() {
    return this.data;
  }
}