import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    MessageFlags
} from 'discord.js';

import { getColor } from '../../../config/bot.js';
import { logger } from '../../../utils/logger.js';
import { getShopItems } from '../../../utils/shopDatabase.js';

export default {
    async execute(interaction, config, client) {

        try {

            const shopItems =
                await getShopItems(client);

            if (!shopItems.length) {
                return interaction.reply({
                    content: '❌ No shop items exist.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const TARGET_MAX_PAGES = 3;

            const ITEMS_PER_PAGE =
                Math.max(
                    1,
                    Math.ceil(shopItems.length / TARGET_MAX_PAGES)
                );

            const totalPages =
                Math.ceil(
                    shopItems.length / ITEMS_PER_PAGE
                );

            let currentPage = 1;

            const createShopEmbed = (page) => {

                const startIndex =
                    (page - 1) * ITEMS_PER_PAGE;

                const pageItems =
                    shopItems.slice(
                        startIndex,
                        startIndex + ITEMS_PER_PAGE
                    );

                const embed =
                    new EmbedBuilder()
                        .setTitle('✨ Event Gem Shop')
                        .setColor(getColor('primary'))
                        .setDescription(
                            'Use `/buy` to purchase items with Event Gems.'
                        );

                pageItems.forEach(item => {

                    embed.addFields({
                        name: `${item.name} (${item.id})`,
                        value:
                            `**Price:** ${item.price.toLocaleString()} Event Gems\n` +
                            `${item.description}`,
                        inline: false
                    });

                });

                embed.setFooter({
                    text: `Page ${page}/${totalPages}`
                });

                return embed;
            };

            const createShopComponents = (page) => {

                if (totalPages <= 1)
                    return [];

                return [
                    new ActionRowBuilder()
                        .addComponents(

                            new ButtonBuilder()
                                .setCustomId('shop_prev')
                                .setLabel('⬅️ Previous')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(page === 1),

                            new ButtonBuilder()
                                .setCustomId('shop_next')
                                .setLabel('Next ➡️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(page === totalPages)

                        )
                ];
            };

            const message =
                await interaction.reply({
                    embeds: [
                        createShopEmbed(currentPage)
                    ],
                    components:
                        createShopComponents(currentPage),
                    fetchReply: true
                });

            const collector =
                message.createMessageComponentCollector({
                    componentType:
                        ComponentType.Button,
                    time: 300000
                });

            collector.on(
                'collect',
                async buttonInteraction => {

                    if (
                        buttonInteraction.user.id !==
                        interaction.user.id
                    ) {

                        return buttonInteraction.reply({
                            content:
                                '❌ You cannot use these buttons.',
                            flags:
                                MessageFlags.Ephemeral
                        });

                    }

                    await buttonInteraction.deferUpdate();

                    if (
                        buttonInteraction.customId ===
                        'shop_prev'
                    ) {
                        currentPage--;
                    }

                    if (
                        buttonInteraction.customId ===
                        'shop_next'
                    ) {
                        currentPage++;
                    }

                    await buttonInteraction.editReply({
                        embeds: [
                            createShopEmbed(currentPage)
                        ],
                        components:
                            createShopComponents(currentPage)
                    });

                }
            );

            collector.on(
                'end',
                async () => {

                    try {

                        const rows =
                            createShopComponents(
                                currentPage
                            );

                        rows.forEach(row =>
                            row.components.forEach(
                                button =>
                                    button.setDisabled(
                                        true
                                    )
                            )
                        );

                        await message.edit({
                            components: rows
                        });

                    } catch {}

                }
            );

        } catch (error) {

            logger.error(
                'shop_browse error:',
                error
            );

            await interaction.reply({
                content:
                    '❌ An error occurred while loading the shop.',
                flags:
                    MessageFlags.Ephemeral
            });

        }

    }
};
