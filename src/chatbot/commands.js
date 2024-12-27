export const CHATBOT_COMMANDS = {
    TOGGLE_CHATBOT: {
        name: 'togglechat',
        description: 'Enable or disable chatbot in the current channel',
        default_member_permissions: '32', // MANAGE_CHANNELS permission
    },
    CONFIG_CHATBOT: {
        name: 'chatconfig',
        description: 'Configure chatbot settings',
        default_member_permissions: '32', // MANAGE_CHANNELS permission
        options: [
            {
                name: 'setting',
                description: 'Setting to configure',
                type: 3, // STRING type
                required: true,
                choices: [
                    {
                        name: 'character',
                        value: 'character',
                    },
                    {
                        name: 'cooldown',
                        value: 'cooldown',
                    },
                    {
                        name: 'reactions',
                        value: 'reactions',
                    },
                ],
            },
            {
                name: 'value',
                description: 'New value for the setting',
                type: 3, // STRING type
                required: true,
            },
        ],
    },
    CLEAR_CHAT: {
        name: 'clearchat',
        description: 'Clear chat history with the bot',
    },
    CHAT_CHARACTER: {
        name: 'character',
        description: 'Change the chatbot\'s character',
        options: [
            {
                name: 'character',
                description: 'Character to switch to',
                type: 3, // STRING type
                required: true,
                choices: [
                    {
                        name: 'Default Assistant',
                        value: 'default',
                    },
                    {
                        name: 'Casual Buddy',
                        value: 'casual',
                    },
                    {
                        name: 'Professional Assistant',
                        value: 'professional',
                    },
                ],
            },
        ],
    },
};
