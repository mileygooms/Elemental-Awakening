import { SlashCommandBuilder } from 'discord.js';
import { shopItems } from '../../config/shop/items.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { createEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { withErrorHandling } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy an item from the shop')
        .addStringOption(option =>
            option
                .setName('item')
                .setDescription('Item ID')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addIntegerOption(option =>
            option
                .setName('quantity')
                .setDescription('Quantity')
                .setRequired(false)
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();

        const filtered = shopItems
            .filter(i =>
                i.name.toLowerCase().includes(focused.toLowerCase()) ||
                i.id.toLowerCase().includes(focused.toLowerCase())
            )
            .slice(0, 25);

        await interaction.respond(
            filtered.map(item => ({
                name: `${item.name} ($${item.price.toLocaleString()})`,
                value: item.id
            }))
        );
    },

    execute: withErrorHandling(async (interaction, config, client) => {
        await InteractionHelper.safeDefer(interaction);

        const itemId = interaction.options.getString('item');
        const quantity = interaction.options.getInteger('quantity') || 1;

        const item = shopItems.find(i => i.id === itemId);

        if (!item) {
            return InteractionHelper.safeEditReply(interaction, {
                content: '❌ Item not found.'
            });
        }

        const data = await getEconomyData(
            client,
            interaction.guildId,
            interaction.user.id
        );

        const totalCost = item.price * quantity;

        if ((data.wallet || 0) < totalCost) {
            return InteractionHelper.safeEditReply(interaction, {
                content: `❌ You need $${totalCost.toLocaleString()}`
            });
        }

        data.wallet -= totalCost;

        if (!data.inventory)
            data.inventory = {};

        data.inventory[item.id] =
            (data.inventory[item.id] || 0) + quantity;

        await setEconomyData(
            client,
            interaction.guildId,
            interaction.user.id,
            data
        );

        const embed = createEmbed({
            title: 'Purchase Successful',
            description:
                `Purchased **${quantity}x ${item.name}**\n` +
                `Cost: **$${totalCost.toLocaleString()}**`
        });

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed]
        });

        console.log(
            `[SHOP PURCHASE] ${interaction.user.tag} bought ${quantity}x ${item.name} for $${totalCost}`
        );
    }, { command: 'buy' })
};
