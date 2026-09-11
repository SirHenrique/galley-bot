const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../database');

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

async function handleBirthdayButton(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('modal_birthday_set')
        .setTitle('🎂 Seu Aniversário');

    const input = new TextInputBuilder()
        .setCustomId('birthday_input')
        .setLabel('Data de aniversário (DD/MM)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 15/03')
        .setMinLength(4)
        .setMaxLength(5)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function handleBirthdayModal(interaction) {
    const raw = interaction.fields.getTextInputValue('birthday_input').trim();
    const match = raw.match(/^(\d{1,2})\/(\d{1,2})$/);

    if (!match) {
        return interaction.reply({ content: '❌ Formato inválido. Use DD/MM (ex: 15/03).', flags: MessageFlags.Ephemeral });
    }

    const dia = parseInt(match[1]);
    const mes = parseInt(match[2]);

    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
        return interaction.reply({ content: '❌ Data inválida. Verifique o dia e o mês.', flags: MessageFlags.Ephemeral });
    }

    await db.setAniversario(interaction.user.id, dia, mes);

    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setDescription(
            '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '🎂 **ANIVERSÁRIO SALVO!**\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
            `✅ Seu aniversário foi definido para:\n` +
            `┃ 📅 **${String(dia).padStart(2,'0')} de ${MESES[mes-1]}**\n\n` +
            '🎉 Você será lembrado no grande dia!\n\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━'
        )
        .setFooter({ text: 'GalleyRP • Aniversários' });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

module.exports = { handleBirthdayButton, handleBirthdayModal };
