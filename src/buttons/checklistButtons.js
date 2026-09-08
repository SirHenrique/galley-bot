const {
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ActionRowBuilder, MessageFlags
} = require('discord.js');
const db = require('../database');
const { buildChecklistEmbed, buildChecklistButtons } = require('../utils/embeds');
const { updatePainelGeral, notifyCompletion } = require('../utils/panelUtils');

async function handle(interaction) {
    const parts = interaction.customId.split('_');
    const action = parts[1];
    const personagemId = parseInt(parts[2]);
    const userId = interaction.user.id;

    const personagem = await db.getById(personagemId);
    if (!personagem) {
        return interaction.reply({ content: '❌ Personagem não encontrado.', flags: MessageFlags.Ephemeral });
    }

    if (personagem.user_id !== userId) {
        return interaction.reply({ content: '❌ Esses botões não são seus!', flags: MessageFlags.Ephemeral });
    }

    if (action === 'lore') {
        if (personagem.lore_status === 0) {
            // Marcando como pronta → pede URL via modal
            const modal = new ModalBuilder()
                .setCustomId(`modal_lore_${personagemId}`)
                .setTitle(`Lore — ${personagem.nome}`);

            const urlInput = new TextInputBuilder()
                .setCustomId('lore_url')
                .setLabel('Link do Google Drive da Lore')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://docs.google.com/document/d/...')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(urlInput));
            return interaction.showModal(modal);
        } else {
            // Desmarcando → remove URL e volta para pendente
            await interaction.deferUpdate();
            await db.toggleLore(personagemId);
            await db.setLoreUrl(personagemId, '');

            const updatedPersonagens = await db.getByUser(userId);
            await interaction.editReply({
                embeds: [buildChecklistEmbed(updatedPersonagens)],
                components: buildChecklistButtons(updatedPersonagens)
            });
            await updatePainelGeral(interaction.client);
        }
        return;
    }

    if (action === 'skin') {
        await interaction.deferUpdate();

        const prevSkin = personagem.skin_status;
        await db.toggleSkin(personagemId);

        const updated = await db.getById(personagemId);
        const updatedPersonagens = await db.getByUser(userId);

        await interaction.editReply({
            embeds: [buildChecklistEmbed(updatedPersonagens)],
            components: buildChecklistButtons(updatedPersonagens)
        });

        if (updated.lore_status === 1 && updated.skin_status === 1 && prevSkin === 0) {
            await notifyCompletion(interaction.client, updated);
        }

        await updatePainelGeral(interaction.client);
    }
}

async function handleLoreModal(interaction) {
    const personagemId = parseInt(interaction.customId.split('_')[2]);
    const userId = interaction.user.id;
    const loreUrl = interaction.fields.getTextInputValue('lore_url').trim();

    const personagem = await db.getById(personagemId);
    if (!personagem || personagem.user_id !== userId) {
        return interaction.reply({ content: '❌ Personagem não encontrado.', flags: MessageFlags.Ephemeral });
    }

    await interaction.deferUpdate();

    await db.toggleLore(personagemId);
    await db.setLoreUrl(personagemId, loreUrl);

    const updated = await db.getById(personagemId);
    const updatedPersonagens = await db.getByUser(userId);

    await interaction.editReply({
        embeds: [buildChecklistEmbed(updatedPersonagens)],
        components: buildChecklistButtons(updatedPersonagens)
    });

    if (updated.lore_status === 1 && updated.skin_status === 1) {
        await notifyCompletion(interaction.client, updated);
    }

    await updatePainelGeral(interaction.client);
}

module.exports = { handle, handleLoreModal };
