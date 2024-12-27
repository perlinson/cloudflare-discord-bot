import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { IMAGEAI_CONFIG } from './config.js';
import { imageAIData } from './dataLoader.js';

export async function handleImageAICommands(interaction, env) {
    const { type, data, member, guild_id } = interaction;
    const commandName = data.name.toLowerCase();
    const userId = member.user.id;

    try {
        switch (commandName) {
            case 'imagine':
                return await handleImagine(interaction, env);
            case 'style':
                return await handleStyle(interaction);
            case 'queue':
                return await handleQueue(interaction);
            case 'history':
                return await handleHistory(interaction);
            case 'settings':
                return await handleSettings(interaction);
            case 'variations':
                return await handleVariations(interaction);
            case 'upscale':
                return await handleUpscale(interaction);
            default:
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'Unknown image generation command',
                        flags: InteractionResponseFlags.EPHEMERAL,
                    },
                };
        }
    } catch (error) {
        console.error(`Error handling image generation command ${commandName}:`, error);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `❌ Error: ${error.message}`,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }
}

async function handleImagine(interaction, env) {
    const userId = interaction.member.user.id;
    const prompt = interaction.data.options.find(opt => opt.name === 'prompt')?.value;
    const style = interaction.data.options.find(opt => opt.name === 'style')?.value;
    const negative = interaction.data.options.find(opt => opt.name === 'negative')?.value;

    // Check cooldown
    if (!imageAIData.checkCooldown(userId)) {
        throw new Error(IMAGEAI_CONFIG.errors.cooldown);
    }

    // Validate prompt
    const maxLength = imageAIData.isPremiumUser(userId) ?
        IMAGEAI_CONFIG.premium.maxPromptLength :
        IMAGEAI_CONFIG.generation.maxPromptLength;

    if (!prompt || prompt.length > maxLength) {
        throw new Error(IMAGEAI_CONFIG.errors.invalidPrompt);
    }

    // Check queue size
    const maxQueue = imageAIData.isPremiumUser(userId) ?
        IMAGEAI_CONFIG.premium.maxQueueSize :
        IMAGEAI_CONFIG.generation.maxQueueSize;

    if (imageAIData.generationQueue.length >= maxQueue) {
        throw new Error(IMAGEAI_CONFIG.errors.queueFull);
    }

    // Build the full prompt
    let fullPrompt = prompt;
    if (style && IMAGEAI_CONFIG.styles[style]) {
        fullPrompt = IMAGEAI_CONFIG.styles[style].prompt + fullPrompt;
    }

    // Get user settings
    const settings = imageAIData.getUserSettings(userId);

    // Call the ComfyDeploy API
    try {
        const response = await fetch(`${IMAGEAI_CONFIG.api.baseUrl}/run/deployment/queue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.COMFY_DEPLOY_API_KEY}`,
            },
            body: JSON.stringify({
                deployment_id: IMAGEAI_CONFIG.api.deploymentId,
                inputs: {
                    input_text: fullPrompt,
                    negative_prompt: negative || IMAGEAI_CONFIG.generation.defaultNegativePrompt,
                    width: settings.width,
                    height: settings.height,
                    steps: settings.steps,
                    cfg_scale: settings.cfg,
                    seed: settings.seed,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(IMAGEAI_CONFIG.errors.apiError);
        }

        const result = await response.json();
        const runId = result.id;

        // Update state
        imageAIData.setActiveGeneration(userId, runId);
        imageAIData.updateCooldown(userId);

        // Start polling for results
        pollGenerationStatus(runId, userId, env);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: '🎨 Generating Image',
                    description: 'Your image is being generated...',
                    color: parseInt(IMAGEAI_CONFIG.ui.colors.generating.replace('#', ''), 16),
                    fields: [
                        {
                            name: 'Prompt',
                            value: prompt,
                        },
                        style ? {
                            name: 'Style',
                            value: IMAGEAI_CONFIG.styles[style].name,
                            inline: true,
                        } : null,
                        {
                            name: 'Status',
                            value: 'Starting generation...',
                            inline: true,
                        },
                    ].filter(Boolean),
                }],
            },
        };
    } catch (error) {
        console.error('Error calling ComfyDeploy API:', error);
        throw new Error(IMAGEAI_CONFIG.errors.apiError);
    }
}

async function pollGenerationStatus(runId, userId, env) {
    let retries = 0;
    const maxRetries = IMAGEAI_CONFIG.api.maxRetries;

    const poll = async () => {
        try {
            const response = await fetch(`${IMAGEAI_CONFIG.api.baseUrl}/run/${runId}`, {
                headers: {
                    'Authorization': `Bearer ${env.COMFY_DEPLOY_API_KEY}`,
                },
            });

            if (!response.ok) {
                throw new Error('API error');
            }

            const result = await response.json();

            if (result.live_status === 'Completed') {
                // Process the completed generation
                const imageUrl = result.outputs?.image_url;
                if (imageUrl) {
                    // Save to history and update last image
                    const imageData = {
                        url: imageUrl,
                        prompt: result.workflow_inputs.input_text,
                        runId,
                    };
                    imageAIData.addToHistory(userId, imageData);
                    imageAIData.setLastImage(userId, imageData);
                }
                imageAIData.removeActiveGeneration(userId);
                return;
            }

            if (result.live_status === 'Failed') {
                imageAIData.removeActiveGeneration(userId);
                throw new Error('Generation failed');
            }

            // Continue polling
            if (retries < maxRetries) {
                retries++;
                setTimeout(poll, IMAGEAI_CONFIG.api.retryDelay);
            } else {
                imageAIData.removeActiveGeneration(userId);
                throw new Error(IMAGEAI_CONFIG.errors.timeout);
            }
        } catch (error) {
            console.error('Error polling generation status:', error);
            imageAIData.removeActiveGeneration(userId);
        }
    };

    // Start polling
    poll();
}

async function handleStyle(interaction) {
    const styles = Object.entries(IMAGEAI_CONFIG.styles).map(([id, style]) => ({
        name: style.name,
        value: `**${style.name}**\nPrompt: \`${style.prompt}\`\nNegative: \`${style.negative}\``,
    }));

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '🎨 Available Style Presets',
                description: 'Here are the available style presets you can use with the `/imagine` command:',
                fields: styles.map(style => ({
                    name: style.name,
                    value: style.value,
                })),
                color: parseInt(IMAGEAI_CONFIG.ui.colors.info.replace('#', ''), 16),
            }],
        },
    };
}

async function handleQueue(interaction) {
    const userId = interaction.member.user.id;
    const position = imageAIData.getQueuePosition(userId);

    if (position === 0) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'You don\'t have any images in the generation queue.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '🎨 Queue Status',
                description: `Your image is at position ${position} in the queue.`,
                color: parseInt(IMAGEAI_CONFIG.ui.colors.info.replace('#', ''), 16),
            }],
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleHistory(interaction) {
    const userId = interaction.member.user.id;
    const page = interaction.data.options?.find(opt => opt.name === 'page')?.value || 1;
    const history = imageAIData.getHistory(userId, page);

    if (history.items.length === 0) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'You haven\'t generated any images yet.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '🎨 Your Generated Images',
                description: history.items.map((item, index) => 
                    `${index + 1}. [Image](${item.url}) - \`${item.prompt.substring(0, 100)}${item.prompt.length > 100 ? '...' : ''}\``
                ).join('\n'),
                color: parseInt(IMAGEAI_CONFIG.ui.colors.info.replace('#', ''), 16),
                footer: {
                    text: `Page ${history.currentPage}/${history.totalPages}`,
                },
            }],
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleSettings(interaction) {
    const userId = interaction.member.user.id;

    // Check premium status
    if (!imageAIData.isPremiumUser(userId)) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '⭐ This feature is only available for premium users.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    const settings = imageAIData.getUserSettings(userId);
    const options = interaction.data.options || [];

    // Update settings if provided
    const updates = {};
    for (const option of options) {
        switch (option.name) {
            case 'width':
                if (option.value >= 512 && option.value <= IMAGEAI_CONFIG.image.maxWidth) {
                    updates.width = option.value;
                }
                break;
            case 'height':
                if (option.value >= 512 && option.value <= IMAGEAI_CONFIG.image.maxHeight) {
                    updates.height = option.value;
                }
                break;
            case 'steps':
                if (option.value >= 10 && option.value <= 50) {
                    updates.steps = option.value;
                }
                break;
            case 'cfg':
                if (option.value >= 1 && option.value <= 20) {
                    updates.cfg = option.value;
                }
                break;
            case 'seed':
                updates.seed = option.value;
                break;
        }
    }

    if (Object.keys(updates).length > 0) {
        imageAIData.updateUserSettings(userId, updates);
    }

    // Get updated settings
    const currentSettings = imageAIData.getUserSettings(userId);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '⚙️ Generation Settings',
                fields: [
                    {
                        name: 'Width',
                        value: currentSettings.width.toString(),
                        inline: true,
                    },
                    {
                        name: 'Height',
                        value: currentSettings.height.toString(),
                        inline: true,
                    },
                    {
                        name: 'Steps',
                        value: currentSettings.steps.toString(),
                        inline: true,
                    },
                    {
                        name: 'CFG Scale',
                        value: currentSettings.cfg.toString(),
                        inline: true,
                    },
                    {
                        name: 'Seed',
                        value: currentSettings.seed === -1 ? 'Random' : currentSettings.seed.toString(),
                        inline: true,
                    },
                ],
                color: parseInt(IMAGEAI_CONFIG.ui.colors.info.replace('#', ''), 16),
            }],
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleVariations(interaction) {
    const userId = interaction.member.user.id;

    // Check premium status
    if (!imageAIData.isPremiumUser(userId)) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '⭐ This feature is only available for premium users.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    // Check if there's a last image
    const lastImage = imageAIData.getLastImage(userId);
    if (!lastImage) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'You need to generate an image first before creating variations.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    // TODO: Implement variation generation
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: '🚧 This feature is coming soon!',
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleUpscale(interaction) {
    const userId = interaction.member.user.id;

    // Check premium status
    if (!imageAIData.isPremiumUser(userId)) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '⭐ This feature is only available for premium users.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    // Check if there's a last image
    const lastImage = imageAIData.getLastImage(userId);
    if (!lastImage) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'You need to generate an image first before upscaling.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    // TODO: Implement upscaling
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: '🚧 This feature is coming soon!',
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}
