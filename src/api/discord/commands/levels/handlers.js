import { InteractionResponseType } from 'discord-interactions';
import { LevelService } from '../../../../services/level';
import { InteractionsAPI } from '../../resources/interactions.js';
import { DiscordClient } from '../../client/index.js';

export async function handleRankCommand(interaction, subcommand, env) {
  const levelService = new LevelService(env);
  const client = new DiscordClient(env.DISCORD_TOKEN, {}, env);
  const interactionsApi = new InteractionsAPI(client);
  const targetUser = subcommand.options?.find(opt => opt.name === 'user')?.value || interaction.member.user.id;

  // Return deferred response immediately
  const response = {
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags: 0
    }
  };

  // Handle the rank check in the background
  Promise.resolve().then(async () => {
    try {
      const rank = await levelService.getRank(targetUser);
      await interactionsApi.editReply(
        env.DISCORD_APPLICATION_ID,
        interaction.token,
        {
          content: `Level: ${rank.level}\nXP: ${rank.xp}/${rank.xpNeeded}\nProgress: ${rank.progress}%\nMessages: ${rank.messages}`
        }
      );
    } catch (error) {
      console.error('[Levels] Error getting rank:', error);
      await interactionsApi.editReply(
        env.DISCORD_APPLICATION_ID,
        interaction.token,
        {
          content: error.message,
          flags: 64
        }
      );
    }
  }).catch(console.error);

  return response;
}

export async function handleLeaderboardCommand(interaction, subcommand, env) {
  const levelService = new LevelService(env);
  const client = new DiscordClient(env.DISCORD_TOKEN, {}, env);
  const interactionsApi = new InteractionsAPI(client);
  const page = subcommand.options?.find(opt => opt.name === 'page')?.value || 1;

  // Return deferred response immediately
  const response = {
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags: 0
    }
  };

  // Handle the leaderboard in the background
  Promise.resolve().then(async () => {
    try {
      const leaderboard = await levelService.getLeaderboard(page);
      const content = leaderboard.users.map((user, index) => {
        const position = (leaderboard.page - 1) * 10 + index + 1;
        return `${position}. ${user.username} - Level ${user.level} (${user.xp} XP)`;
      }).join('\n');

      await interactionsApi.editReply(
        env.DISCORD_APPLICATION_ID,
        interaction.token,
        {
          content: `Leaderboard (Page ${leaderboard.page}/${leaderboard.totalPages}):\n${content}`
        }
      );
    } catch (error) {
      console.error('[Levels] Error getting leaderboard:', error);
      await interactionsApi.editReply(
        env.DISCORD_APPLICATION_ID,
        interaction.token,
        {
          content: error.message,
          flags: 64
        }
      );
    }
  }).catch(console.error);

  return response;
}
