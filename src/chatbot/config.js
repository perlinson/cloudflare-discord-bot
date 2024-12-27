export const CHATBOT_CONFIG = {
    responseControl: {
        ignoreBots: true,
        ignorePrefix: '!',
        cooldown: 3, // seconds
        maxMessageLength: 2000,
        maxHistoryLength: 10,
        maxResponseTokens: 500,
    },
    
    characters: {
        default: {
            name: 'Assistant',
            personality: 'I am a helpful and friendly AI assistant.',
            greeting: 'Hello! How can I help you today?',
        },
        casual: {
            name: 'Buddy',
            personality: 'I am a casual and fun-loving chatbot.',
            greeting: 'Hey there! What\'s up?',
        },
        professional: {
            name: 'Pro',
            personality: 'I am a professional and formal AI assistant.',
            greeting: 'Greetings. How may I assist you today?',
        },
    },

    features: {
        webScraping: false, // Requires additional setup
        youtubeAnalysis: false, // Requires additional setup
        codeHighlighting: true,
        sentimentAnalysis: true,
        messageReactions: true,
    },

    messageTracking: {
        enabled: true,
        maxMessages: 100,
        expiryTime: 3600, // 1 hour
    },

    buttons: {
        regenerate: {
            label: '🔄 Regenerate',
            style: 'PRIMARY',
        },
        continue: {
            label: '⏩ Continue',
            style: 'PRIMARY',
        },
        clear: {
            label: '🗑️ Clear History',
            style: 'SECONDARY',
        },
    },
};
