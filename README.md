# GlobalCord

[English](#english) | [中文](#chinese)

<h2 id="english">English</h2>

A powerful Discord bot powered by Cloudflare Workers, providing AI image generation and advanced features.

## Current Features

- 🎨 AI Image Generation
  - Support for multiple art styles
  - Custom prompts and parameters
  - Real-time generation progress
  - Image storage using Cloudflare R2

## Roadmap

- 🌐 Network System
  - Cross-server connectivity
  - Global chat channels
  - Server management tools

- 💬 AI Chat System
  - Context-aware conversations
  - Multi-language support
  - Custom personality settings

- 💰 Economy System
  - Cross-server economy
  - Virtual items and shops
  - Trading system

- 📊 Analytics & Monitoring
  - Usage statistics
  - Performance monitoring
  - Error tracking

## Setup

1. Clone the repository:
```bash
git clone https://github.com/perlinson/globalcord-cloudflare-bot.git
cd globalcord
```

2. Install dependencies:
```bash
yarn install
```

3. Configure environment variables in `.dev.vars`:
```
DISCORD_APPLICATION_ID="your_app_id"
DISCORD_PUBLIC_KEY="your_public_key"
DISCORD_TOKEN="your_bot_token"
COMFY_DEPLOY_API_KEY="your_comfy_deploy_key"
APP_ID="your_worker_url"
```

4. Deploy to Cloudflare Workers:
```bash
yarn deploy
```

## Contributing

We welcome contributions! Feel free to:
- Join our [Discord server](https://discord.gg/Jvtaq2hkfC) for discussions
- Submit Pull Requests
- Report issues
- Share ideas and suggestions

---

<h2 id="chinese">中文</h2>

一个强大的 Discord 机器人，由 Cloudflare Workers 提供支持，提供 AI 图像生成和高级功能。

## 当前功能

- 🎨 AI 图像生成
  - 支持多种艺术风格
  - 自定义提示词和参数
  - 实时生成进度
  - 使用 Cloudflare R2 存储图像

## 开发计划

- 🌐 网络系统
  - 跨服务器连接
  - 全球聊天频道
  - 服务器管理工具

- 💬 AI 聊天系统
  - 上下文感知对话
  - 多语言支持
  - 自定义性格设置

- 💰 经济系统
  - 跨服务器经济
  - 虚拟物品和商店
  - 交易系统

- 📊 分析和监控
  - 使用统计
  - 性能监控
  - 错误追踪

## 安装设置

1. 克隆仓库：
```bash
git clone https://github.com/perlinson/globalcord-cloudflare-bot.git
cd globalcord
```

2. 安装依赖：
```bash
yarn install
```

3. 在 `.dev.vars` 中配置环境变量：
```
DISCORD_APPLICATION_ID="你的应用ID"
DISCORD_PUBLIC_KEY="你的公钥"
DISCORD_TOKEN="你的机器人令牌"
COMFY_DEPLOY_API_KEY="你的ComfyDeploy密钥"
APP_ID="你的Worker URL"
```

4. 部署到 Cloudflare Workers：
```bash
yarn deploy
```

## 参与贡献

我们欢迎各种形式的贡献！你可以：
- 加入我们的 [Discord 服务器](https://discord.gg/Jvtaq2hkfC) 参与讨论
- 提交 Pull Request
- 报告问题
- 分享想法和建议
