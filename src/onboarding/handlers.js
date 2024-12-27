import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { ONBOARDING_CONFIG } from './config.js';
import { onboardingData } from './dataLoader.js';

export async function handleOnboardingCommands(interaction, env) {
    const { type, data, member, guild_id } = interaction;
    const commandName = data.name.toLowerCase();
    const userId = member.user.id;

    // Initialize storage
    onboardingData.initialize(env);

    try {
        switch (commandName) {
            // Setup Commands
            case 'onboarding-setup':
                return await handleSetup(interaction);
            case 'onboarding-customize':
                return await handleCustomize(interaction);

            // Channel Management
            case 'onboarding-channel-add':
                return await handleChannelAdd(interaction);
            case 'onboarding-channel-remove':
                return await handleChannelRemove(interaction);

            // Role Management
            case 'onboarding-role-add':
                return await handleRoleAdd(interaction);
            case 'onboarding-role-remove':
                return await handleRoleRemove(interaction);

            // Verification Management
            case 'onboarding-verify-setup':
                return await handleVerifySetup(interaction);
            case 'onboarding-verify-disable':
                return await handleVerifyDisable(interaction);

            // Message Management
            case 'onboarding-message-edit':
                return await handleMessageEdit(interaction);

            // Analytics
            case 'onboarding-stats':
                return await handleStats(interaction);

            // Premium Features
            case 'onboarding-premium':
                return await handlePremium(interaction);

            default:
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'Unknown onboarding command',
                        flags: InteractionResponseFlags.EPHEMERAL,
                    },
                };
        }
    } catch (error) {
        console.error(`Error handling onboarding command ${commandName}:`, error);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `❌ Error: ${error.message}`,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }
}

// Setup Handlers
async function handleSetup(interaction) {
    const serverId = interaction.guild_id;
    const type = interaction.data.options.find(opt => opt.name === 'type')?.value;

    // Check permissions
    if (!hasPermission(interaction, 'ADMINISTRATOR')) {
        throw new Error(ONBOARDING_CONFIG.errors.permissions.user);
    }

    // Start setup
    onboardingData.startSetup(serverId, type);

    let setupSteps = [];
    switch (type) {
        case 'full':
            setupSteps = ['channels', 'roles', 'verification'];
            break;
        case 'channels':
            setupSteps = ['channels'];
            break;
        case 'roles':
            setupSteps = ['roles'];
            break;
        case 'verification':
            setupSteps = ['verification'];
            break;
    }

    // Execute setup steps
    for (const step of setupSteps) {
        try {
            switch (step) {
                case 'channels':
                    await setupChannels(serverId);
                    break;
                case 'roles':
                    await setupRoles(serverId);
                    break;
                case 'verification':
                    await setupVerification(serverId);
                    break;
            }
            onboardingData.updateSetup(serverId, step, 'completed');
        } catch (error) {
            onboardingData.updateSetup(serverId, step, 'failed');
            throw error;
        }
    }

    // Complete setup
    const setup = onboardingData.completeSetup(serverId);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '✅ Setup Complete',
                description: 'Server onboarding has been set up successfully!',
                fields: setup.steps.map(step => ({
                    name: step.step,
                    value: step.status === 'completed' ? '✅ Completed' : '❌ Failed',
                    inline: true,
                })),
                color: parseInt(ONBOARDING_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

async function handleCustomize(interaction) {
    const serverId = interaction.guild_id;
    const setting = interaction.data.options.find(opt => opt.name === 'setting')?.value;
    const value = interaction.data.options.find(opt => opt.name === 'value')?.value;

    // Check permissions
    if (!hasPermission(interaction, 'ADMINISTRATOR')) {
        throw new Error(ONBOARDING_CONFIG.errors.permissions.user);
    }

    // Update settings
    onboardingData.updateSettings(serverId, {
        [setting]: value,
    });

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '⚙️ Settings Updated',
                description: `Successfully updated ${setting} settings!`,
                color: parseInt(ONBOARDING_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

// Channel Management Handlers
async function handleChannelAdd(interaction) {
    const serverId = interaction.guild_id;
    const name = interaction.data.options.find(opt => opt.name === 'name')?.value;
    const type = interaction.data.options.find(opt => opt.name === 'type')?.value;
    const category = interaction.data.options.find(opt => opt.name === 'category')?.value;

    // Check permissions
    if (!hasPermission(interaction, 'MANAGE_CHANNELS')) {
        throw new Error(ONBOARDING_CONFIG.errors.permissions.user);
    }

    // Add channel
    onboardingData.addChannel(serverId, {
        name,
        type,
        category,
    });

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '✅ Channel Added',
                description: `Successfully added channel #${name}`,
                color: parseInt(ONBOARDING_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

async function handleChannelRemove(interaction) {
    const serverId = interaction.guild_id;
    const channelId = interaction.data.options.find(opt => opt.name === 'channel')?.value;

    // Check permissions
    if (!hasPermission(interaction, 'MANAGE_CHANNELS')) {
        throw new Error(ONBOARDING_CONFIG.errors.permissions.user);
    }

    // Remove channel
    onboardingData.removeChannel(serverId, channelId);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '✅ Channel Removed',
                description: 'Successfully removed channel from onboarding',
                color: parseInt(ONBOARDING_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

// Role Management Handlers
async function handleRoleAdd(interaction) {
    const serverId = interaction.guild_id;
    const name = interaction.data.options.find(opt => opt.name === 'name')?.value;
    const color = interaction.data.options.find(opt => opt.name === 'color')?.value;
    const type = interaction.data.options.find(opt => opt.name === 'type')?.value;

    // Check permissions
    if (!hasPermission(interaction, 'MANAGE_ROLES')) {
        throw new Error(ONBOARDING_CONFIG.errors.permissions.user);
    }

    // Add role
    onboardingData.addRole(serverId, {
        name,
        color,
        type,
    });

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '✅ Role Added',
                description: `Successfully added role @${name}`,
                color: parseInt(ONBOARDING_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

async function handleRoleRemove(interaction) {
    const serverId = interaction.guild_id;
    const roleId = interaction.data.options.find(opt => opt.name === 'role')?.value;

    // Check permissions
    if (!hasPermission(interaction, 'MANAGE_ROLES')) {
        throw new Error(ONBOARDING_CONFIG.errors.permissions.user);
    }

    // Remove role
    onboardingData.removeRole(serverId, roleId);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '✅ Role Removed',
                description: 'Successfully removed role from onboarding',
                color: parseInt(ONBOARDING_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

// Verification Management Handlers
async function handleVerifySetup(interaction) {
    const serverId = interaction.guild_id;
    const type = interaction.data.options.find(opt => opt.name === 'type')?.value;
    const channelId = interaction.data.options.find(opt => opt.name === 'channel')?.value;

    // Check permissions
    if (!hasPermission(interaction, 'ADMINISTRATOR')) {
        throw new Error(ONBOARDING_CONFIG.errors.permissions.user);
    }

    // Update settings
    onboardingData.updateSettings(serverId, {
        verification: {
            enabled: true,
            type,
            channel: channelId,
        },
    });

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '✅ Verification Setup Complete',
                description: `Successfully set up ${type} verification in <#${channelId}>`,
                color: parseInt(ONBOARDING_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

async function handleVerifyDisable(interaction) {
    const serverId = interaction.guild_id;

    // Check permissions
    if (!hasPermission(interaction, 'ADMINISTRATOR')) {
        throw new Error(ONBOARDING_CONFIG.errors.permissions.user);
    }

    // Update settings
    onboardingData.updateSettings(serverId, {
        verification: {
            enabled: false,
        },
    });

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '✅ Verification Disabled',
                description: 'Successfully disabled verification system',
                color: parseInt(ONBOARDING_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

// Message Management Handler
async function handleMessageEdit(interaction) {
    const serverId = interaction.guild_id;
    const type = interaction.data.options.find(opt => opt.name === 'type')?.value;
    const content = interaction.data.options.find(opt => opt.name === 'content')?.value;

    // Check permissions
    if (!hasPermission(interaction, 'MANAGE_MESSAGES')) {
        throw new Error(ONBOARDING_CONFIG.errors.permissions.user);
    }

    // Update message
    onboardingData.setMessage(serverId, type, content);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '✅ Message Updated',
                description: `Successfully updated ${type} message`,
                color: parseInt(ONBOARDING_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

// Analytics Handler
async function handleStats(interaction) {
    const serverId = interaction.guild_id;
    const type = interaction.data.options.find(opt => opt.name === 'type')?.value || 'joins';
    const period = interaction.data.options.find(opt => opt.name === 'period')?.value || 'day';

    const analytics = onboardingData.getAnalytics(serverId, type, period);
    if (!analytics) {
        throw new Error('No analytics data available');
    }

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '📊 Onboarding Statistics',
                fields: [
                    {
                        name: 'Current',
                        value: analytics.current.toString(),
                        inline: true,
                    },
                    {
                        name: `Total (${period})`,
                        value: analytics.history.reduce((sum, entry) => sum + entry.value, 0).toString(),
                        inline: true,
                    },
                ],
                color: parseInt(ONBOARDING_CONFIG.ui.colors.info.replace('#', ''), 16),
            }],
        },
    };
}

// Premium Handler
async function handlePremium(interaction) {
    const serverId = interaction.guild_id;
    const action = interaction.data.options.find(opt => opt.name === 'action')?.value;

    switch (action) {
        case 'status':
            const isPremium = onboardingData.isPremiumServer(serverId);
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [{
                        title: '💎 Premium Status',
                        description: isPremium ?
                            'This server has premium features enabled!' :
                            'This server does not have premium features.',
                        color: parseInt(ONBOARDING_CONFIG.ui.colors.info.replace('#', ''), 16),
                    }],
                },
            };

        case 'features':
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [{
                        title: '✨ Premium Features',
                        fields: Object.entries(ONBOARDING_CONFIG.premium).map(([key, value]) => ({
                            name: key,
                            value: value ? '✅ Available' : '❌ Not Available',
                            inline: true,
                        })),
                        color: parseInt(ONBOARDING_CONFIG.ui.colors.info.replace('#', ''), 16),
                    }],
                },
            };

        case 'activate':
            // This should be implemented based on your premium system
            throw new Error('Premium activation not implemented');

        default:
            throw new Error('Invalid premium action');
    }
}

// Helper Functions
function hasPermission(interaction, permission) {
    return interaction.member.permissions.includes(permission);
}

async function setupChannels(serverId) {
    const requiredChannels = ONBOARDING_CONFIG.channels.required;
    const optionalChannels = ONBOARDING_CONFIG.channels.optional;
    const categories = ONBOARDING_CONFIG.channels.categories;

    // Create categories
    for (const category of categories) {
        await onboardingData.addChannel(serverId, {
            name: category.name,
            type: 'GUILD_CATEGORY',
        });
    }

    // Create required channels
    for (const channel of requiredChannels) {
        await onboardingData.addChannel(serverId, {
            ...channel,
            parentCategory: categories.find(c => c.channels.includes(channel.name))?.name,
        });
    }

    // Create optional channels
    for (const channel of optionalChannels) {
        await onboardingData.addChannel(serverId, {
            ...channel,
            parentCategory: categories.find(c => c.channels.includes(channel.name))?.name,
        });
    }

    return true;
}

async function setupRoles(serverId) {
    // Create default role
    await onboardingData.addRole(serverId, ONBOARDING_CONFIG.roles.default);

    // Create auto roles
    for (const role of ONBOARDING_CONFIG.roles.autoroles) {
        await onboardingData.addRole(serverId, role);
    }

    // Create level roles
    for (const role of ONBOARDING_CONFIG.roles.levels) {
        await onboardingData.addRole(serverId, role);
    }

    return true;
}

async function setupVerification(serverId) {
    const verificationConfig = ONBOARDING_CONFIG.verification;
    if (!verificationConfig.enabled) return true;

    // Create verification channel if needed
    const channels = await onboardingData.getChannels(serverId);
    if (!channels.find(c => c.name === 'verification')) {
        await onboardingData.addChannel(serverId, {
            name: 'verification',
            type: 'GUILD_TEXT',
            topic: 'Verify yourself to access the server',
        });
    }

    // Set up verification message
    await onboardingData.setMessage(serverId, 'verification', verificationConfig.message);

    // Update settings
    await onboardingData.updateSettings(serverId, {
        verification: {
            enabled: true,
            type: verificationConfig.type,
            timeout: verificationConfig.timeout,
        },
    });

    return true;
}
