import {
    SlashCommandBuilder,
    PermissionFlagsBits
} from 'discord.js';

import {
    getShopItems,
    saveShopItems
} from '../../utils/shopDatabase.js';

export default {
    data: new SlashCommandBuilder()
        .setName('shopadmin')
        .setDescription('Manage shop items')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        )

        .addSubcommand(sub =>
            sub
                .setName('add')
                .setDescription('Add item')
                .addStringOption(o =>
                    o
                        .setName('id')
                        .setDescription('Item ID')
                        .setRequired(true))
                .addStringOption(o =>
                    o
                        .setName('name')
                        .setDescription('Item name')
                        .setRequired(true))
                .addIntegerOption(o =>
                    o
                        .setName('price')
                        .setDescription('Item price')
                        .setRequired(true))
                .addStringOption(o =>
                    o
                        .setName('description')
                        .setDescription('Item description')
                        .setRequired(true))
        )

        .addSubcommand(sub =>
            sub
                .setName('remove')
                .setDescription('Remove item')
                .addStringOption(o =>
                    o
                        .setName('id')
                        .setDescription('Item ID')
                        .setRequired(true))
        ),

    async execute(interaction, config, client) {

        const sub =
            interaction.options.getSubcommand();

        const shopItems =
            await getShopItems(client);

        if (sub === 'add') {

            const id =
                interaction.options.getString('id');

            const name =
                interaction.options.getString('name');

            const price =
                interaction.options.getInteger('price');

            const description =
                interaction.options.getString('description');

            if (shopItems.find(i => i.id === id)) {
                return interaction.reply({
                    content: '❌ Item already exists.',
                    ephemeral: true
                });
            }

            shopItems.push({
                id,
                name,
                price,
                description,
                type: 'custom'
            });

            await saveShopItems(
                client,
                shopItems
            );

            return interaction.reply({
                content: `✅ Added **${name}** to the shop.`,
                ephemeral: true
            });
        }

        if (sub === 'remove') {

            const id =
                interaction.options.getString('id');

            const index =
                shopItems.findIndex(
                    i => i.id === id
                );

            if (index === -1) {
                return interaction.reply({
                    content: '❌ Item not found.',
                    ephemeral: true
                });
            }

            const removed =
                shopItems[index];

            shopItems.splice(index, 1);

            await saveShopItems(
                client,
                shopItems
            );

            return interaction.reply({
                content: `✅ Removed **${removed.name}** from the shop.`,
                ephemeral: true
            });
        }
    }
};
