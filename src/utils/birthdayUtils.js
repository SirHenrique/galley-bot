const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

async function sendBirthdayDM(user) {
    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setDescription(
            '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '🎂 **ANIVERSÁRIO — GALLEYRP**\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
            '🎉 Olá! Para participar das comemorações do servidor,\n' +
            '┃ nos conte quando é seu aniversário!\n\n' +
            '📅 Clique no botão abaixo para definir sua data.\n\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━'
        )
        .setFooter({ text: 'GalleyRP • Aniversários' });

    const btn = new ButtonBuilder()
        .setCustomId('birthday_set_btn')
        .setLabel('🎂 Definir meu aniversário')
        .setStyle(ButtonStyle.Primary);

    await user.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(btn)] });
}

module.exports = { sendBirthdayDM };
