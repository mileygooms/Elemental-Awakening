import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { shopItems } from '../../config/shop/items.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('purchase')
        .setDescription('Purchase an item using Event Gems')
        .addStringOption(option =>
            option
                .setName('item')
                .setDescription('Item ID from /shop')
                .setRequired(true)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {

        const itemId = interaction.options.getString('item');
        const guildId = interaction.guildId;
        const userId = interaction.user.id;

        const item = shopItems.find(i => i.id === itemId);

        if (!item) {
            throw createError(
                'Invalid item',
                ErrorTypes.VALIDATION,
                'That item does not exist.'
            );
        }

        const userData = await getEconomyData(client, guildId, userId);

        userData.eventGems = userData.eventGems || 0;
        userData.inventory = userData.inventory || {};

        if (userData.eventGems < item.price) {
            throw createError(
                'Not enough Event Gems',
                ErrorTypes.VALIDATION,
                `You need ${item.price.toLocaleString()} Event Gems.`
            );
        }

        userData.eventGems -= item.price;

        userData.inventory[item.id] =
            (userData.inventory[item.id] || 0) + 1;

        await setEconomyData(client, guildId, userId, userData);

        const embed = createEmbed({
            title: '✅ Purchase Successful',
            description:
                `Purchased **${item.name}**\n\n` +
                `Cost: **${item.price.toLocaleString()} Event Gems**\n` +
                `Remaining Gems: **${userData.eventGems.toLocaleString()}**`
        });

        await InteractionHelper.safeReply(interaction, {
            embeds: [embed]
        });

    }, { command: 'purchase' })
};
