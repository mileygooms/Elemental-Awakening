import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { shopItems } from '../../config/shop/items.js';
import { getEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const SHOP_ITEMS = shopItems;

export default {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View purchased shop rewards'),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        const userData = await getEconomyData(client, guildId, userId);

        if (!userData) {
            throw createError(
                'Failed to load economy data',
                ErrorTypes.DATABASE,
                'Failed to load your data.'
            );
        }

        const inventory = userData.inventory || {};

        const purchases = Object.entries(inventory)
            .filter(([itemId, quantity]) => {
                const item = SHOP_ITEMS.find(i => i.id === itemId);
                return item && quantity > 0;
            })
            .map(([itemId, quantity]) => {
                const item = SHOP_ITEMS.find(i => i.id === itemId);
                return `• **${item.name}** × ${quantity}`;
            });

        const embed = createEmbed({
            title: `🛒 Purchase History`,
            description:
                purchases.length > 0
                    ? purchases.join('\n')
                    : 'No shop purchases found.'
        })
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({
            text: `Staff can use this as purchase verification`
        });

        logger.info('[SHOP] Inventory viewed', {
            userId,
            guildId,
            purchases: purchases.length
        });

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed]
        });

    }, { command: 'inventory' })
};
