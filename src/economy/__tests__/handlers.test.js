import { jest } from '@jest/globals';
import { InteractionResponseType } from 'discord-interactions';
import { handleEconomyCommands } from '../handlers.js';

// Mock the economyData module
const mockEconomyData = {
    initialize: jest.fn(),
    ensureUserExists: jest.fn(),
    getUserBalance: jest.fn(),
    updateUserBalance: jest.fn(),
    getLastDailyReward: jest.fn(),
    setLastDailyReward: jest.fn(),
    getShopItems: jest.fn(),
    buyItem: jest.fn(),
    getUserItems: jest.fn(),
    getLeaderboard: jest.fn()
};

jest.mock('../data.js', () => mockEconomyData);

describe('Economy Command Handlers', () => {
    const mockEnv = {
        TESTING: 'true',
        DATABASE: 'mock-db'
    };

    const mockUser = {
        id: 'mock-user-id',
        username: 'mock-user'
    };

    const mockGuild = {
        id: 'mock-guild-id'
    };

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        
        // Set up default mock implementations
        mockEconomyData.initialize.mockResolvedValue(undefined);
        mockEconomyData.ensureUserExists.mockResolvedValue(undefined);
        mockEconomyData.getUserBalance.mockResolvedValue(1000);
        mockEconomyData.updateUserBalance.mockResolvedValue(undefined);
        mockEconomyData.getLastDailyReward.mockResolvedValue(null);
        mockEconomyData.setLastDailyReward.mockResolvedValue(undefined);
        mockEconomyData.getShopItems.mockResolvedValue([
            { id: 1, name: 'Item 1', price: 100 },
            { id: 2, name: 'Item 2', price: 200 }
        ]);
        mockEconomyData.buyItem.mockResolvedValue(undefined);
        mockEconomyData.getUserItems.mockResolvedValue([
            { id: 1, name: 'Item 1', quantity: 1 },
            { id: 2, name: 'Item 2', quantity: 2 }
        ]);
        mockEconomyData.getLeaderboard.mockResolvedValue([
            { userId: 'user1', balance: 1000 },
            { userId: 'user2', balance: 500 }
        ]);
    });

    describe('handleBaseResponse', () => {
        it('should initialize storage and ensure user exists', async () => {
            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'balance'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(mockEconomyData.initialize).toHaveBeenCalledWith(mockEnv);
            expect(mockEconomyData.ensureUserExists).toHaveBeenCalledWith('mock-user-id', 'mock-guild-id');
        });

        it('should handle initialization errors gracefully', async () => {
            mockEconomyData.initialize.mockRejectedValue(new Error('Mock error'));

            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'balance'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('抱歉，处理命令时出现错误');
        });
    });

    describe('balance command', () => {
        it('should return current balance', async () => {
            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'balance'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result).toEqual({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '您当前的余额是: 1000 金币'
                }
            });
        });

        it('should handle balance errors', async () => {
            mockEconomyData.getUserBalance.mockRejectedValue(new Error('Mock error'));

            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'balance'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('抱歉，处理命令时出现错误');
        });
    });

    describe('daily command', () => {
        it('should give daily reward if eligible', async () => {
            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'daily'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('成功领取');
            expect(mockEconomyData.updateUserBalance).toHaveBeenCalledWith(
                'mock-user-id',
                'mock-guild-id',
                expect.any(Number)
            );
        });

        it('should prevent claiming reward too soon', async () => {
            const now = new Date();
            mockEconomyData.getLastDailyReward.mockResolvedValue(now.toISOString());

            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'daily'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('您今天已经领取过了');
        });
    });

    describe('shop command', () => {
        it('should list shop items', async () => {
            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'shop'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('商店商品列表');
            expect(result.data.content).toContain('Item 1');
            expect(result.data.content).toContain('Item 2');
        });

        it('should handle empty shop', async () => {
            mockEconomyData.getShopItems.mockResolvedValue([]);

            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'shop'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('商店目前没有商品');
        });
    });

    describe('buy command', () => {
        it('should allow purchase if user has enough balance', async () => {
            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'buy',
                    options: [
                        {
                            name: 'item',
                            value: 'Item 1'
                        }
                    ]
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('成功购买');
            expect(mockEconomyData.buyItem).toHaveBeenCalled();
        });

        it('should prevent purchase if insufficient balance', async () => {
            mockEconomyData.getUserBalance.mockResolvedValue(50);

            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'buy',
                    options: [
                        {
                            name: 'item',
                            value: 'Item 1'
                        }
                    ]
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('余额不足');
        });
    });

    describe('inventory command', () => {
        it('should list inventory items', async () => {
            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'inventory'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('您的背包');
            expect(result.data.content).toContain('Item 1');
            expect(result.data.content).toContain('Item 2');
        });

        it('should handle empty inventory', async () => {
            mockEconomyData.getUserItems.mockResolvedValue([]);

            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'inventory'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('您的背包是空的');
        });
    });

    describe('transfer command', () => {
        it('should transfer money if user has enough balance', async () => {
            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'transfer',
                    options: [
                        {
                            name: 'user',
                            value: 'target-user-id'
                        },
                        {
                            name: 'amount',
                            value: 500
                        }
                    ]
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('成功转账');
            expect(mockEconomyData.updateUserBalance).toHaveBeenCalledTimes(2);
        });

        it('should prevent transfer if insufficient balance', async () => {
            mockEconomyData.getUserBalance.mockResolvedValue(100);

            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'transfer',
                    options: [
                        {
                            name: 'user',
                            value: 'target-user-id'
                        },
                        {
                            name: 'amount',
                            value: 500
                        }
                    ]
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('余额不足');
        });
    });

    describe('work commands', () => {
        it('should handle work command', async () => {
            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'work'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('成功工作');
            expect(result.data.content).toContain('100 金币');
        });

        it('should handle mine command', async () => {
            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'mine'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('成功挖矿');
            expect(result.data.content).toContain('150 金币');
        });

        it('should handle fish command', async () => {
            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'fish'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('成功钓鱼');
            expect(result.data.content).toContain('200 金币');
        });

        it('should handle business command', async () => {
            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'business'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('成功经商');
            expect(result.data.content).toContain('300 金币');
        });
    });

    describe('leaderboard command', () => {
        it('should display leaderboard', async () => {
            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'leaderboard'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('排行榜');
            expect(result.data.content).toContain('user1');
            expect(result.data.content).toContain('user2');
        });

        it('should handle empty leaderboard', async () => {
            mockEconomyData.getLeaderboard.mockResolvedValue([]);

            const result = await handleEconomyCommands({
                type: 'APPLICATION_COMMAND',
                data: {
                    name: 'leaderboard'
                },
                member: {
                    user: mockUser
                },
                guild_id: mockGuild.id
            }, mockEnv);

            expect(result.data.content).toContain('暂无排行数据');
        });
    });
});
