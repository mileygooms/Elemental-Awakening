import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';

export default {
    data: new SlashCommandBuilder()
        .setName('eventgems')
        .setDescription('Staff-only Event Gems control')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(s =>
            s.setName('add')
                .setDescription('Add Event Gems')
                .addUserOption(o => o.setName('user').setRequired(true))
                .addIntegerOption(o => o.setName('amount').setRequired(true))
        )
        .addSubcommand(s =>
            s.setName('remove')
                .setDescription('Remove Event Gems')
                .addUserOption(o => o.setName('user').setRequired(true))
                .addIntegerOption(o => o.setName('amount').setRequired(true))
        )
        .addSubcommand(s =>
            s.setName('set')
                .setDescription('Set Event Gems')
                .addUserOption(o => o.setName('user').setRequired(true))
                .addIntegerOption(o => o.setName('amount').setRequired(true))
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const guildId = interaction.guildId;
        const sub = interaction.options.getSubcommand();

        const data = await getEconomyData(client, guildId, user.id);

        data.eventGems = data.eventGems || 0;

        if (sub === 'add') data.eventGems += amount;
        if (sub === 'remove') data.eventGems = Math.max(0, data.eventGems - amount);
        if (sub === 'set') data.eventGems = Math.max(0, amount);

        await setEconomyData(client, guildId, user.id, data);

        const embed = createEmbed({
            title: 'Event Gems Updated',
            description: `${user.username} now has **${data.eventGems} Event Gems**`
        });

        await InteractionHelper.safeReply(interaction, { embeds: [embed], ephemeral: true });
    }, { command: 'eventgems' })
};
