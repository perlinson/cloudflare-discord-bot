import { CHATBOT_CONFIG } from './config.js';
import { chatbotDataLoader } from './dataLoader.js';

class ChatHandler {
    constructor() {
        this.dataLoader = chatbotDataLoader;
        this.userCooldowns = new Map();
    }

    async handleMessage(message, env) {
        // Skip if message is from a bot and bots should be ignored
        if (CHATBOT_CONFIG.responseControl.ignoreBots && message.author.bot) {
            return;
        }

        // Skip if message starts with ignore prefix
        if (message.content.startsWith(CHATBOT_CONFIG.responseControl.ignorePrefix)) {
            return;
        }

        // Check if channel is enabled
        if (!this.dataLoader.isChannelEnabled(message.guild_id, message.channel_id)) {
            return;
        }

        // Check cooldown
        const cooldown = await this.checkCooldown(message.author.id, message.guild_id);
        if (cooldown > 0) {
            return {
                type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                data: {
                    content: `Please wait ${cooldown} seconds before sending another message.`,
                    flags: 64, // EPHEMERAL
                },
            };
        }

        // Get user settings and character
        const userSettings = this.dataLoader.getUserSettings(message.author.id);
        const character = CHATBOT_CONFIG.characters[userSettings.character];

        // Add message to conversation history
        this.dataLoader.addToConversation(message.author.id, {
            role: 'user',
            content: message.content,
        });

        // Get conversation history
        const history = this.dataLoader.getConversation(message.author.id);

        // Generate response
        const response = await this.generateResponse(history, character, env);

        // Add response to conversation history
        this.dataLoader.addToConversation(message.author.id, {
            role: 'assistant',
            content: response,
        });

        // Create response message with buttons
        const buttons = this.createResponseButtons();

        return {
            type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
            data: {
                content: response,
                components: [
                    {
                        type: 1, // ACTION_ROW
                        components: buttons,
                    },
                ],
            },
        };
    }

    async checkCooldown(userId, guildId) {
        const now = Date.now();
        const cooldownConfig = this.dataLoader.getConfig(guildId).cooldown || CHATBOT_CONFIG.responseControl.cooldown;
        const lastMessage = this.userCooldowns.get(userId) || 0;
        const timeLeft = Math.ceil((lastMessage + (cooldownConfig * 1000) - now) / 1000);

        if (timeLeft > 0) {
            return timeLeft;
        }

        this.userCooldowns.set(userId, now);
        return 0;
    }

    createResponseButtons() {
        return [
            {
                type: 2, // BUTTON
                style: 1, // PRIMARY
                label: CHATBOT_CONFIG.buttons.regenerate.label,
                custom_id: 'regenerate_response',
            },
            {
                type: 2, // BUTTON
                style: 1, // PRIMARY
                label: CHATBOT_CONFIG.buttons.continue.label,
                custom_id: 'continue_conversation',
            },
            {
                type: 2, // BUTTON
                style: 2, // SECONDARY
                label: CHATBOT_CONFIG.buttons.clear.label,
                custom_id: 'clear_history',
            },
        ];
    }

    async generateResponse(history, character, env) {
        // This is a placeholder. In a real implementation, you would:
        // 1. Use an AI model API (e.g., OpenAI, Claude, etc.)
        // 2. Format the conversation history appropriately
        // 3. Handle rate limits and errors
        // 4. Process and format the response
        
        // For now, we'll return a simple response
        return `${character.name}: I am not yet fully implemented, but I understand you're trying to chat with me! Once implemented, I will be able to have proper conversations.`;
    }

    async handleButtonClick(interaction, env) {
        const { custom_id, message, member } = interaction;
        const userId = member.user.id;

        switch (custom_id) {
            case 'regenerate_response':
                // Get the last user message and regenerate response
                const history = this.dataLoader.getConversation(userId);
                if (history.length >= 2) {
                    // Remove the last assistant response
                    history.pop();
                    const character = CHATBOT_CONFIG.characters[this.dataLoader.getUserSettings(userId).character];
                    const newResponse = await this.generateResponse(history, character, env);
                    
                    // Update conversation history
                    this.dataLoader.addToConversation(userId, {
                        role: 'assistant',
                        content: newResponse,
                    });

                    return {
                        type: 7, // UPDATE_MESSAGE
                        data: {
                            content: newResponse,
                            components: [
                                {
                                    type: 1,
                                    components: this.createResponseButtons(),
                                },
                            ],
                        },
                    };
                }
                break;

            case 'continue_conversation':
                // Generate a continuation of the last response
                const lastResponse = message.content;
                const continuedResponse = await this.generateResponse(
                    [...this.dataLoader.getConversation(userId), { role: 'user', content: 'Please continue' }],
                    CHATBOT_CONFIG.characters[this.dataLoader.getUserSettings(userId).character],
                    env
                );

                return {
                    type: 7, // UPDATE_MESSAGE
                    data: {
                        content: `${lastResponse}\n\n[Continuation]:\n${continuedResponse}`,
                        components: [
                            {
                                type: 1,
                                components: this.createResponseButtons(),
                            },
                        ],
                    },
                };

            case 'clear_history':
                this.dataLoader.clearConversation(userId);
                return {
                    type: 7, // UPDATE_MESSAGE
                    data: {
                        content: 'Conversation history has been cleared.',
                        components: [], // Remove buttons
                    },
                };
        }

        return {
            type: 4,
            data: {
                content: 'Something went wrong.',
                flags: 64, // EPHEMERAL
            },
        };
    }
}

export const chatHandler = new ChatHandler();
