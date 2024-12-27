import { IMAGEAI_CONFIG } from './config.js';

class ImageAIDataLoader {
    constructor() {
        this.userSettings = new Map();
        this.generationQueue = [];
        this.userHistory = new Map();
        this.userCooldowns = new Map();
        this.activeGenerations = new Map();
    }

    // User Settings
    getUserSettings(userId) {
        if (!this.userSettings.has(userId)) {
            this.userSettings.set(userId, {
                width: IMAGEAI_CONFIG.image.defaultWidth,
                height: IMAGEAI_CONFIG.image.defaultHeight,
                steps: IMAGEAI_CONFIG.image.samplingSteps,
                cfg: IMAGEAI_CONFIG.image.cfgScale,
                seed: IMAGEAI_CONFIG.image.seed,
                isPremium: false,
                lastImage: null,
            });
        }
        return this.userSettings.get(userId);
    }

    updateUserSettings(userId, settings) {
        const currentSettings = this.getUserSettings(userId);
        this.userSettings.set(userId, { ...currentSettings, ...settings });
    }

    // Queue Management
    addToQueue(userId, prompt, style, negative) {
        const position = this.generationQueue.length + 1;
        const generation = {
            userId,
            prompt,
            style,
            negative,
            timestamp: Date.now(),
            status: 'pending',
        };
        this.generationQueue.push(generation);
        return position;
    }

    getQueuePosition(userId) {
        return this.generationQueue.findIndex(gen => gen.userId === userId) + 1;
    }

    removeFromQueue(userId) {
        const index = this.generationQueue.findIndex(gen => gen.userId === userId);
        if (index !== -1) {
            this.generationQueue.splice(index, 1);
            return true;
        }
        return false;
    }

    // History Management
    addToHistory(userId, imageData) {
        if (!this.userHistory.has(userId)) {
            this.userHistory.set(userId, []);
        }
        const history = this.userHistory.get(userId);
        history.unshift({
            ...imageData,
            timestamp: Date.now(),
        });

        // Limit history size
        const maxHistory = this.getUserSettings(userId).isPremium ? 
            IMAGEAI_CONFIG.premium.maxImagesPerUser : 
            IMAGEAI_CONFIG.generation.maxImagesPerUser;
        
        if (history.length > maxHistory) {
            history.pop();
        }
    }

    getHistory(userId, page = 1) {
        const history = this.userHistory.get(userId) || [];
        const perPage = IMAGEAI_CONFIG.ui.maxHistoryDisplay;
        const start = (page - 1) * perPage;
        const end = start + perPage;
        return {
            items: history.slice(start, end),
            totalPages: Math.ceil(history.length / perPage),
            currentPage: page,
        };
    }

    // Cooldown Management
    checkCooldown(userId) {
        const lastGeneration = this.userCooldowns.get(userId);
        if (!lastGeneration) return true;

        const cooldownTime = this.getUserSettings(userId).isPremium ?
            IMAGEAI_CONFIG.premium.cooldown :
            IMAGEAI_CONFIG.generation.cooldown;

        return Date.now() - lastGeneration >= cooldownTime;
    }

    updateCooldown(userId) {
        this.userCooldowns.set(userId, Date.now());
    }

    // Active Generation Management
    setActiveGeneration(userId, runId) {
        this.activeGenerations.set(userId, {
            runId,
            startTime: Date.now(),
        });
    }

    getActiveGeneration(userId) {
        return this.activeGenerations.get(userId);
    }

    removeActiveGeneration(userId) {
        this.activeGenerations.delete(userId);
    }

    // Premium Status
    isPremiumUser(userId) {
        return this.getUserSettings(userId).isPremium;
    }

    setPremiumStatus(userId, isPremium) {
        const settings = this.getUserSettings(userId);
        settings.isPremium = isPremium;
        this.userSettings.set(userId, settings);
    }

    // Last Image Management
    setLastImage(userId, imageData) {
        const settings = this.getUserSettings(userId);
        settings.lastImage = imageData;
        this.userSettings.set(userId, settings);
    }

    getLastImage(userId) {
        return this.getUserSettings(userId).lastImage;
    }
}

// Create and export a singleton instance
export const imageAIData = new ImageAIDataLoader();
