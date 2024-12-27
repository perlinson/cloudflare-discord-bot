export const IMAGEAI_COMMANDS = {
    IMAGINE: {
        name: 'imagine',
        description: 'Generate an image from a text description',
        options: [
            {
                name: 'prompt',
                description: 'Text description of the image you want to generate',
                type: 3, // STRING type
                required: true,
            },
            {
                name: 'style',
                description: 'Style preset to use',
                type: 3, // STRING type
                required: false,
                choices: [
                    {
                        name: 'Anime',
                        value: 'anime',
                    },
                    {
                        name: 'Realistic',
                        value: 'realistic',
                    },
                    {
                        name: 'Fantasy',
                        value: 'fantasy',
                    },
                    {
                        name: 'Cyberpunk',
                        value: 'cyberpunk',
                    },
                ],
            },
            {
                name: 'negative',
                description: 'Things to avoid in the image (Premium)',
                type: 3, // STRING type
                required: false,
            },
        ],
    },

    STYLE: {
        name: 'style',
        description: 'View available style presets and their descriptions',
    },

    QUEUE: {
        name: 'queue',
        description: 'View your current position in the generation queue',
    },

    HISTORY: {
        name: 'history',
        description: 'View your image generation history',
        options: [
            {
                name: 'page',
                description: 'Page number to view',
                type: 4, // INTEGER type
                required: false,
            },
        ],
    },

    SETTINGS: {
        name: 'settings',
        description: 'View or modify your image generation settings (Premium)',
        options: [
            {
                name: 'width',
                description: 'Image width (512-1024)',
                type: 4, // INTEGER type
                required: false,
            },
            {
                name: 'height',
                description: 'Image height (512-1024)',
                type: 4, // INTEGER type
                required: false,
            },
            {
                name: 'steps',
                description: 'Sampling steps (10-50)',
                type: 4, // INTEGER type
                required: false,
            },
            {
                name: 'cfg',
                description: 'CFG Scale (1-20)',
                type: 4, // INTEGER type
                required: false,
            },
            {
                name: 'seed',
                description: 'Generation seed (-1 for random)',
                type: 4, // INTEGER type
                required: false,
            },
        ],
    },

    VARIATIONS: {
        name: 'variations',
        description: 'Generate variations of your last image (Premium)',
        options: [
            {
                name: 'count',
                description: 'Number of variations to generate (1-4)',
                type: 4, // INTEGER type
                required: false,
            },
            {
                name: 'strength',
                description: 'How different the variations should be (0.1-0.9)',
                type: 10, // NUMBER type
                required: false,
            },
        ],
    },

    UPSCALE: {
        name: 'upscale',
        description: 'Upscale your last generated image (Premium)',
        options: [
            {
                name: 'scale',
                description: 'Scale factor (2x or 4x)',
                type: 4, // INTEGER type
                required: true,
                choices: [
                    {
                        name: '2x',
                        value: 2,
                    },
                    {
                        name: '4x',
                        value: 4,
                    },
                ],
            },
        ],
    },
};
