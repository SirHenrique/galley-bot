const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../database');
const { buildChecklistEmbed, buildPainelGeral } = require('../utils/embeds');

const data = new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Comandos administrativos (Staff)')
    .addSubcommand(sub => sub
        .setName('checklist')
        .setDescription('Veja a checklist de qualquer jogador ou de todos')
        .addUserOption(opt => opt
            .setName('jogador')
            .setDescription('Jogador específico (deixe vazio para ver todos)')
            .setRequired(false)));

async function execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const adminRoleId = process.env.ADMIN_ROLE_ID;
    if (adminRoleId && !interaction.member.roles.cache.has(adminRoleId)) {
        return interaction.editReply({
            content: '❌ Você não tem permissão para usar este comando.'
        });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'checklist') {
        const jogador = interaction.options.getUser('jogador');

        if (jogador) {
            const personagens = await db.getByUser(jogador.id);
            if (personagens.length === 0) {
                return interaction.editReply({
                    content: `❌ ${jogador} não tem nenhum personagem cadastrado.`
                });
            }
            const embed = buildChecklistEmbed(personagens);
            embed.setAuthor({ name: `Checklist de ${jogador.username}`, iconURL: jogador.displayAvatarURL() });
            return interaction.editReply({ embeds: [embed] });
        } else {
            const personagens = await db.getAll();
            const embed = buildPainelGeral(personagens);
            return interaction.editReply({ embeds: [embed] });
        }
    }
}

module.exports = { data, execute };
