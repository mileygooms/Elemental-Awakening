import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName("eleaderboard")
        .setDescription("View the top 10 users by Event Gems")
        .setDMPermission(false),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const guildId = interaction.guildId;

        logger.debug(`[EVENT GEMS] Leaderboard requested`, { guildId });

        const prefix = `economy:${guildId}:`;
        let allKeys = await client.db.list(prefix);

        if (!Array.isArray(allKeys)) allKeys = [];

        if (allKeys.length === 0) {
            throw createError(
                "No data found",
                ErrorTypes.VALIDATION,
                "No economy data found for this server."
            );
        }

        const allUsers = [];

        for (const key of allKeys) {
            const userId = key.replace(prefix, "");
            const userData = await client.db.get(key);

            if (!userData) continue;

            allUsers.push({
                userId,
                eventGems: userData.eventGems || 0,
            });
        }

        allUsers.sort((a, b) => b.eventGems - a.eventGems);

        const topUsers = allUsers.slice(0, 10);

        const userRank =
            allUsers.findIndex(u => u.userId === interaction.user.id) + 1;

        const rankEmoji = ["🥇", "🥈", "🥉"];
        const leaderboardEntries = [];

        for (let i = 0; i < topUsers.length; i++) {
            const user = topUsers[i];
            const rank = i + 1;
            const emoji = rankEmoji[i] || `**#${rank}**`;

            leaderboardEntries.push(
                `${emoji} <@${user.userId}> - ✨ ${user.eventGems.toLocaleString()}`
            );
        }

        logger.info(`[EVENT GEMS] Leaderboard generated`, {
            guildId,
            userCount: allUsers.length,
            userRank
        });

        const description =
            leaderboardEntries.length > 0
                ? leaderboardEntries.join("\n")
                : "No Event Gem data is available yet.";

        const embed = createEmbed({
            title: "✨ Event Gems Leaderboard",
            description,
            footer: `Your Rank: ${userRank > 0 ? `#${userRank}` : "Unranked"}`
        });

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed]
        });

    }, { command: 'eleaderboard' })
};
