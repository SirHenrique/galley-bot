const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../database');
const { sendBirthdayDM } = require('../utils/birthdayUtils');

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aniversario')
        .setDescription('Gerencia aniversários do servidor')
        .addSubcommand(sub => sub
            .setName('canal')
            .setDescription('Define o canal onde serão enviadas as mensagens de parabéns')
            .addChannelOption(opt => opt
                .setName('canal')
                .setDescription('Canal de aniversários')
                .setRequired(true)))
        .addSubcommand(sub => sub
            .setName('lista')
            .setDescription('Mostra a lista de aniversários do servidor'))
        .addSubcommand(sub => sub
            .setName('dm-todos')
            .setDescription('Envia DM para todos os membros pedindo o aniversário')),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const sub = interaction.options.getSubcommand();
        const isAdmin = interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID);

        if (sub === 'canal') {
            if (!isAdmin) return interaction.editReply({ content: '❌ Sem permissão.' });
            const channel = interaction.options.getChannel('canal');
            await db.setConfig('birthday_channel_id', channel.id);
            return interaction.editReply({ content: `✅ Canal de aniversários definido como ${channel}.` });
        }

        if (sub === 'lista') {
            const aniversarios = await db.getAllAniversarios();
            if (!aniversarios.length) {
                return interaction.editReply({ content: '📭 Nenhum aniversário cadastrado ainda.' });
            }

            let desc = '━━━━━━━━━━━━━━━━━━━━━━━━━\n🎂 **LISTA DE ANIVERSÁRIOS**\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

            const now = new Date();
            const hoje = { dia: now.getDate(), mes: now.getMonth() + 1 };

            for (const a of aniversarios) {
                const isHoje = a.dia === hoje.dia && a.mes === hoje.mes;
                const tag = isHoje ? ' 🎉 **HOJE!**' : '';
                desc += `🎂 <@${a.user_id}> — **${String(a.dia).padStart(2,'0')}/${MESES[a.mes-1]}**${tag}\n`;
            }

            desc += '\n━━━━━━━━━━━━━━━━━━━━━━━━━';

            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setDescription(desc)
                .setFooter({ text: `GalleyRP • ${aniversarios.length} aniversários cadastrados` });

            return interaction.editReply({ embeds: [embed] });
        }

        if (sub === 'dm-todos') {
            if (!isAdmin) return interaction.editReply({ content: '❌ Sem permissão.' });

            await interaction.editReply({ content: '⏳ Buscando membros e enviando DMs...' });

            const members = await interaction.guild.members.fetch();
            const aniversarios = await db.getAllAniversarios();
            const jatem = new Set(aniversarios.map(a => a.user_id));

            let enviados = 0;
            let falhos = 0;

            for (const [, member] of members) {
                if (member.user.bot) continue;
                if (jatem.has(member.id)) continue;

                try {
                    await sendBirthdayDM(member.user);
                    enviados++;
                    await new Promise(r => setTimeout(r, 600));
                } catch {
                    falhos++;
                }
            }

            return interaction.editReply({
                content: `✅ Concluído!\n📨 DMs enviadas: **${enviados}**\n❌ Falhos (DM fechado): **${falhos}**`
            });
        }
    }
};
