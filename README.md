# GlobalCord

A powerful Discord bot powered by Cloudflare Workers, providing global connectivity and advanced features.

## Features

- Network System: Connect and manage Discord servers globally
- Economy System: Cross-server economy with items, shops, and transactions
- Chatbot System: AI-powered conversations with context awareness
- Advanced Storage: Utilizes Cloudflare KV, D1, and R2 for robust data management
- Monitoring: Built-in monitoring, logging, and analytics
- Backup: Automated backup system with easy restoration

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/globalcord.git
cd globalcord
```

2. Install dependencies:
```bash
yarn install
```

3. Configure Cloudflare:
```bash
# Create KV namespace
yarn wrangler kv:namespace create "globalcord-kv"
yarn wrangler kv:namespace create "globalcord-kv" --preview

# Create D1 database
yarn wrangler d1 create globalcord-db

# Create R2 buckets
yarn wrangler r2 bucket create globalcord-storage
yarn wrangler r2 bucket create globalcord-backup
```

4. Update `wrangler.toml` with your resource IDs

5. Set up environment variables:
```bash
yarn wrangler secret put DISCORD_TOKEN
yarn wrangler secret put DISCORD_PUBLIC_KEY
yarn wrangler secret put DISCORD_APPLICATION_ID
yarn wrangler secret put ALERT_WEBHOOK_URL
```

6. Initialize database:
```bash
yarn wrangler d1 execute globalcord-db --file=./schema.sql
```

7. Deploy:
```bash
yarn publish
```

## Development

- `yarn dev`: Start development server
- `yarn test`: Run tests
- `yarn lint`: Check code style
- `yarn fix`: Fix code style issues
- `yarn migrate`: Run database migrations
- `yarn backup`: Create manual backup
- `yarn monitor`: View monitoring stats

## Architecture

The bot uses a modern, scalable architecture:

- **Storage Layer**: 
  - Cloudflare KV: Fast access to frequently used data
  - Cloudflare D1: Structured data storage
  - Cloudflare R2: File and backup storage

- **Features**:
  - Network System: Server connections and management
  - Economy System: Cross-server economy
  - Chatbot System: AI conversations

- **Infrastructure**:
  - Monitoring: Real-time system monitoring
  - Logging: Comprehensive logging system
  - Analytics: Usage and performance tracking
  - Backup: Automated backup system

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
