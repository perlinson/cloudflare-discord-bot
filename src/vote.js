import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

const TOPGG_VOTE_LINK = process.env.TOPGG_VOTE_LINK || 'https://top.gg/bot/YOUR_BOT_ID/vote';
const votedUsers = new Set();

// Store vote data in memory (you might want to use a database in production)
const voteData = {
    users: new Map(), // Map<userId, lastVoteTime>
};

export function createVoteEmbed() {
    return new EmbedBuilder()
        .setTitle('🎁 Unlock GlobalCord\'s Full Potential! 🎁')
        .setDescription(
            'Vote for GlobalCord and empower your server\'s growth! 🚀\n' +
            'Get access to amazing benefits and random GlobalCoins!\n\n' +
            '**Voting Perks Include:**\n' +
            '- ✨ **GlobalCoin Rewards:** Chance to get 1-5 GlobalCoins every 12 hours!\n' +
            '- 🚀 **Exclusive Commands:** Use special commands designed to boost server visibility!\n' +
            '- 💪 **Support Future Development:** Motivate me to add even more features!\n\n' +
            'Vote now by clicking the button below! 👇'
        )
        .setColor('#FFD700');
}

export function createVoteButtons() {
    const voteButton = new ButtonBuilder()
        .setLabel('Vote Now!')
        .setURL(TOPGG_VOTE_LINK)
        .setStyle(ButtonStyle.Link);

    const benefitsButton = new ButtonBuilder()
        .setLabel('Benefits!')
        .setCustomId('show_benefits')
        .setStyle(ButtonStyle.Primary);

    return new ActionRowBuilder().addComponents(voteButton, benefitsButton);
}

export async function showVoteBenefits(interaction) {
    const embed = createVoteEmbed();
    if (interaction.client.user.avatar) {
        embed.setThumbnail(interaction.client.user.avatarURL());
    }
    
    await interaction.reply({
        embeds: [embed],
        components: [createVoteButtons()],
        ephemeral: true
    });
}

// Middleware to check if user has voted
export function isVoter() {
    return async (interaction) => {
        const userId = interaction.user.id;
        if (votedUsers.has(userId)) {
            return true;
        }

        const embed = new EmbedBuilder()
            .setTitle('🗳️ Vote for GlobalCord and Unlock Perks! 🎁')
            .setDescription(
                'Support GlobalCord and gain access to awesome benefits! Every vote counts! 🙏\n\n' +
                'Click **Vote Now!** to show your love & get rewards. 💖\n' +
                'Click **Benefits!** to learn about the amazing perks you\'ll unlock. 🤩'
            )
            .setColor('#FFD700');

        await interaction.reply({
            embeds: [embed],
            components: [createVoteButtons()],
            ephemeral: true
        });
        return false;
    };
}

// Handle vote webhook from top.gg
export async function handleVote(userId) {
    votedUsers.add(userId);
    voteData.users.set(userId, Date.now());
    
    // Give random GlobalCoins (1-5)
    const coins = Math.floor(Math.random() * 5) + 1;
    // TODO: Implement coin system
    
    // Remove user from voted list after 12 hours
    setTimeout(() => {
        votedUsers.delete(userId);
    }, 12 * 60 * 60 * 1000);
}

export function createVoteMessage(interaction, question) {
  const upvoteButton = new ButtonBuilder()
    .setCustomId('upvote')
    .setLabel('👍 Upvote')
    .setStyle(ButtonStyle.Primary);

  const downvoteButton = new ButtonBuilder()
    .setCustomId('downvote')
    .setLabel('👎 Downvote')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder()
    .addComponents(upvoteButton, downvoteButton);

  return {
    content: `**Vote:** ${question}\n\nUpvotes: 0\nDownvotes: 0`,
    components: [row]
  };
}

export function handleVoteButton(interaction, votes) {
  const messageId = interaction.message.id;
  const userId = interaction.user.id;
  const buttonId = interaction.customId;
  
  if (!votes[messageId]) {
    votes[messageId] = {
      upvotes: new Set(),
      downvotes: new Set()
    };
  }

  const userVotes = votes[messageId];
  
  if (buttonId === 'upvote') {
    if (userVotes.upvotes.has(userId)) {
      userVotes.upvotes.delete(userId);
    } else {
      userVotes.upvotes.add(userId);
      userVotes.downvotes.delete(userId);
    }
  } else if (buttonId === 'downvote') {
    if (userVotes.downvotes.has(userId)) {
      userVotes.downvotes.delete(userId);
    } else {
      userVotes.downvotes.add(userId);
      userVotes.upvotes.delete(userId);
    }
  }

  const content = interaction.message.content.split('\n\n')[0];
  const updatedContent = `${content}\n\nUpvotes: ${userVotes.upvotes.size}\nDownvotes: ${userVotes.downvotes.size}`;
  
  return {
    content: updatedContent,
    components: interaction.message.components
  };
}
