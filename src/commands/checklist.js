const { SlashCommandBuilder, ChannelType, MessageFlags } = require('discord.js');
const db = require('../database');
const { buildChecklistEmbed, buildChecklistButtons, buildPainelGeral } = require('../utils/embeds');

const data = new SlashCommandBuilder()
    .setName('checklist')
    .setDescription('Gerencia a checklist de personagens')
    .addSubcommand(sub => sub
        .setName('ver')
        .setDescription('Veja sua checklist de personagens com botões interativos'))
    .addSubcommand(sub => sub
        .setName('canal')
        .setDescription('Define o canal do painel fixo de todos os personagens (Staff)')
        .addChannelOption(opt => opt
            .setName('canal')
            .setDescription('Canal onde o painel será exibido')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)));

async function execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const sub = interaction.options.getSubcommand();

    if (sub === 'ver') {
        const userId = interaction.user.id;
        const personagens = await db.getByUser(userId);

        if (personagens.length === 0) {
            return interaction.editReply({
                content: '❌ Você não tem nenhum personagem cadastrado. Use `/personagem adicionar` para criar um!'
            });
        }

        const embed = buildChecklistEmbed(personagens);
        const rows = buildChecklistButtons(personagens);

        return interaction.editReply({ embeds: [embed], components: rows });
    }

    if (sub === 'canal') {
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        if (adminRoleId && !interaction.member.roles.cache.has(adminRoleId)) {
            return interaction.editReply({
                content: '❌ Você não tem permissão para usar este comando.'
            });
        }

        const canal = interaction.options.getChannel('canal');

        try {
            const personagens = await db.getAll();
            const embed = buildPainelGeral(personagens);
            const msg = await canal.send({ embeds: [embed] });

            await db.setConfig('painel_channel_id', canal.id);
            await db.setConfig('painel_message_id', msg.id);

            return interaction.editReply({
                content: `✅ Painel fixo configurado em ${canal}! Será atualizado automaticamente sempre que alguém alterar sua checklist.`
            });
        } catch {
            return interaction.editReply({
                content: '❌ Não consegui enviar a mensagem no canal. Verifique as permissões do bot.'
            });
        }
    }
}

module.exports = { data, execute };
