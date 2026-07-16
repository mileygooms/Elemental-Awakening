import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { getEconomyData } from '../../utils/economy.js';
import { getShopItems } from '../../utils/shopDatabase.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View purchased shop rewards'),

    execute: withErrorHandling(async (interaction, config, client) => {

        const deferred =
            await InteractionHelper.safeDefer(interaction);

        if (!deferred) return;

        const userId =
            interaction.user.id;

        const guildId =
            interaction.guildId;

        const userData =
            await getEconomyData(
                client,
                guildId,
                userId
            );

        if (!userData) {
            throw createError(
                'Failed to load economy data',
                ErrorTypes.DATABASE,
                'Failed to load your data.'
            );
        }

        const shopItems =
            await getShopItems(client);

        const inventory =
            userData.inventory || {};

        const purchases =
            Object.entries(inventory)
                .filter(([_, quantity]) =>
                    quantity > 0
                )
                .map(([itemId, quantity]) => {

                    const item =
                        shopItems.find(
                            i => i.id === itemId
                        );

                    return item
                        ? `• **${item.name}** × ${quantity}`
                        : `• **${itemId}** × ${quantity}`;

                });

        const embed =
            createEmbed({
                title: '📦 Inventory',
                description:
                    purchases.length
                        ? purchases.join('\n')
                        : 'Your inventory is empty.'
            })
                .setThumbnail(
                    interaction.user.displayAvatarURL()
                )
                .setFooter({
                    text:
                        `Total Items: ${purchases.length}`
                });

        logger.info(
            '[SHOP] Inventory viewed',
            {
                userId,
                guildId,
                items: purchases.length
            }
        );

        await InteractionHelper.safeEditReply(
            interaction,
            {
                embeds: [embed]
            }
        );

    }, { command: 'inventory' })
};
