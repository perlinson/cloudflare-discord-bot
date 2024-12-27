import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { phoneSystem } from './phoneSystem.js';

export async function handlePhoneCommands(interaction, env) {
    const { type, data, member, channel_id, guild_id } = interaction;
    const commandName = data.name.toLowerCase();

    switch (commandName) {
        case 'setphone':
            return handleSetPhone(interaction, env);
        case 'call':
            return handleCall(interaction, env);
        case 'hangup':
            return handleHangup(interaction, env);
        case 'phoneinfo':
            return handlePhoneInfo(interaction, env);
        case 'callstats':
            return handleCallStats(interaction, env);
        case 'block':
            return handleBlock(interaction, env);
        case 'unblock':
            return handleUnblock(interaction, env);
        default:
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: 'Unknown phone command',
                    flags: InteractionResponseFlags.EPHEMERAL,
                },
            };
    }
}

async function handleSetPhone(interaction, env) {
    const { guild_id, channel_id, member } = interaction;
    
    // Check if user has permission to manage channels
    if (!member.permissions.includes('MANAGE_CHANNELS')) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'You need the Manage Channels permission to use this command.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    phoneSystem.setPhoneChannel(guild_id, channel_id);
    
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: '📞 This channel has been set as the phone channel!',
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleCall(interaction, env) {
    const { guild_id, channel_id, member } = interaction;
    const userId = member.user.id;

    // Check if in phone channel
    const phoneChannel = phoneSystem.getPhoneChannel(guild_id);
    if (phoneChannel !== channel_id) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '❌ You can only make calls from the designated phone channel!',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    // Check if user is already in a call
    if (phoneSystem.isUserInCall(userId)) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '❌ You are already in a call! Use /hangup to end it.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    // Add user to waiting list
    phoneSystem.addWaitingUser(userId, channel_id, Date.now());

    const theme = phoneSystem.getTheme();
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `${theme.waitingEmoji} Waiting for someone to answer... Use /hangup to cancel.`,
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleHangup(interaction, env) {
    const { member } = interaction;
    const userId = member.user.id;

    // Check if user is waiting
    if (phoneSystem.isUserWaiting(userId)) {
        phoneSystem.removeWaitingUser(userId);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '📞 Call request cancelled.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    // Check if user is in a call
    const call = Array.from(phoneSystem.activeCalls.values()).find(
        call => call.caller === userId || call.receiver === userId
    );

    if (!call) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '❌ You are not in a call!',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    const duration = phoneSystem.endCall(call.id);
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `📞 Call ended. Duration: ${minutes}m ${seconds}s`,
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handlePhoneInfo(interaction, env) {
    const { guild_id } = interaction;
    const phoneChannel = phoneSystem.getPhoneChannel(guild_id);
    const waitingCount = phoneSystem.waitingUsers.size;
    const activeCallCount = phoneSystem.activeCalls.size;

    const content = [
        '📱 **Phone System Information**',
        `Phone Channel: ${phoneChannel ? `<#${phoneChannel}>` : 'Not set'}`,
        `Waiting Users: ${waitingCount}`,
        `Active Calls: ${activeCallCount}`,
    ].join('\n');

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content,
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleCallStats(interaction, env) {
    const { member } = interaction;
    const userId = member.user.id;
    const stats = phoneSystem.getUserStats(userId);

    const content = [
        '📊 **Your Call Statistics**',
        `Total Calls: ${stats.totalCalls}`,
        `Total Duration: ${Math.floor(stats.totalDuration / 60000)}m`,
        `Total Messages: ${stats.totalMessages}`,
    ].join('\n');

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content,
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleBlock(interaction, env) {
    const { data, member } = interaction;
    const userId = member.user.id;
    const targetId = data.options[0].value;

    if (userId === targetId) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '❌ You cannot block yourself!',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    phoneSystem.blockUser(targetId);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `✅ Successfully blocked <@${targetId}> from calling you.`,
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleUnblock(interaction, env) {
    const { data, member } = interaction;
    const targetId = data.options[0].value;

    if (!phoneSystem.isUserBlocked(targetId)) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '❌ This user is not blocked!',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    phoneSystem.unblockUser(targetId);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `✅ Successfully unblocked <@${targetId}>.`,
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}
