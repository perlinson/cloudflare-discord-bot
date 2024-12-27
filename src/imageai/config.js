export const IMAGEAI_CONFIG = {
    // ComfyDeploy API Settings
    api: {
        baseUrl: 'https://api.comfydeploy.com/api',
        deploymentId: '9a1a22b0-c365-4aba-b8a3-28b0e62a46e6',
        maxRetries: 5,
        retryDelay: 2000, // 2 seconds
        timeout: 300000, // 5 minutes
    },

    // Generation Settings
    generation: {
        maxPromptLength: 1000,
        maxQueueSize: 5,
        maxImagesPerUser: 50,
        cooldown: 60000, // 1 minute
        defaultNegativePrompt: 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
    },

    // Premium Features
    premium: {
        maxPromptLength: 2000,
        maxQueueSize: 10,
        maxImagesPerUser: 200,
        cooldown: 30000, // 30 seconds
        priorityQueue: true,
        customNegativePrompt: true,
        advancedSettings: true,
    },

    // Image Settings
    image: {
        format: 'png',
        maxSize: 10485760, // 10MB
        defaultWidth: 512,
        defaultHeight: 512,
        maxWidth: 1024,
        maxHeight: 1024,
        samplingSteps: 20,
        cfgScale: 7,
        seed: -1, // random
    },

    // Style Presets
    styles: {
        anime: {
            name: 'Anime',
            prompt: 'anime style, high quality, masterpiece, best quality, ',
            negative: 'photo, photorealistic, realistic, ',
        },
        realistic: {
            name: 'Realistic',
            prompt: 'photorealistic, realistic, high quality, masterpiece, best quality, ',
            negative: 'anime, cartoon, illustration, ',
        },
        fantasy: {
            name: 'Fantasy',
            prompt: 'fantasy style, magical, ethereal, high quality, masterpiece, best quality, ',
            negative: 'modern, mundane, ordinary, ',
        },
        cyberpunk: {
            name: 'Cyberpunk',
            prompt: 'cyberpunk style, neon, futuristic, high tech, high quality, masterpiece, best quality, ',
            negative: 'natural, organic, vintage, ',
        },
    },

    // UI Settings
    ui: {
        colors: {
            generating: '#f1c40f', // Yellow
            success: '#2ecc71', // Green
            error: '#e74c3c', // Red
            info: '#3498db', // Blue
        },
        thumbnailSize: 256,
        maxHistoryDisplay: 10,
    },

    // Error Messages
    errors: {
        cooldown: 'Please wait before generating another image.',
        queueFull: 'The generation queue is currently full. Please try again later.',
        invalidPrompt: 'Your prompt is invalid or too long.',
        apiError: 'An error occurred while generating your image.',
        timeout: 'The image generation timed out.',
        unauthorized: 'You do not have permission to use this feature.',
    },
};
