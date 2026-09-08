require('dotenv').config();
const { Client, GatewayIntentBits, Collection, MessageFlags } = require('discord.js');
const path = require('path');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    }
}

const { EmbedBuilder } = require('discord.js');
const { handle: handleChecklistButton, handleLoreModal } = require('./buttons/checklistButtons');
const { handleRemoveButton } = require('./commands/personagem');

client.once('clientReady', () => {
    console.log(`✅ Bot ${client.user.tag} online!`);
    console.log(`📋 Comandos carregados: ${[...client.commands.keys()].join(', ')}`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`[Comando] Erro em /${interaction.commandName}:`, error);
            const msg = { content: '❌ Ocorreu um erro ao executar o comando.', flags: MessageFlags.Ephemeral };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(msg).catch(() => {});
            } else {
                await interaction.reply(msg).catch(() => {});
            }
        }
        return;
    }

    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) {
            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(`[Autocomplete] Erro em /${interaction.commandName}:`, error);
            }
        }
        return;
    }

    if (interaction.isModalSubmit()) {
        try {
            if (interaction.customId.startsWith('modal_lore_')) {
                await handleLoreModal(interaction);
            }
        } catch (error) {
            console.error('[Modal] Erro:', error);
            const msg = { content: '❌ Ocorreu um erro ao processar o modal.', flags: MessageFlags.Ephemeral };
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply(msg).catch(() => {});
            }
        }
        return;
    }

    if (interaction.isButton()) {
        try {
            if (interaction.customId.startsWith('checklist_')) {
                await handleChecklistButton(interaction);
            } else if (
                interaction.customId.startsWith('confirm_remove_') ||
                interaction.customId.startsWith('cancel_remove_')
            ) {
                await handleRemoveButton(interaction);
            }
        } catch (error) {
            console.error('[Botão] Erro:', error);
            const msg = { content: '❌ Ocorreu um erro ao processar o botão.', flags: MessageFlags.Ephemeral };
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply(msg).catch(() => {});
            }
        }
        return;
    }
});

const AUTO_ROLE_ID = '1546708141507481702';
const WELCOME_CHANNEL_ID = '1546700449627906069';
const WELCOME_GIF = 'https://media.tenor.com/wqbagCCVA74AAAAd/document-signing.gif';

client.on('guildMemberAdd', async member => {
    try {
        const role = member.guild.roles.cache.get(AUTO_ROLE_ID);
        if (role) {
            await member.roles.add(role);
            console.log(`✅ Cargo atribuído para ${member.user.tag}`);
        } else {
            console.warn(`⚠️ Cargo ${AUTO_ROLE_ID} não encontrado no servidor`);
        }
    } catch (error) {
        console.error(`[AutoRole] Erro ao atribuir cargo para ${member.user.tag}:`, error);
    }

    try {
        const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor(0x2B7A0B)
                .setImage(WELCOME_GIF)
                .setDescription(
                    '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                    '🧅 **BEM-VINDO(A) AO GALLEYRP**\n' +
                    '━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                    `👤 Olá, <@${member.id}>! Você entrou no servidor.\n\n` +
                    '📜 Você só pode ficar se **assinar**!\n' +
                    '┃ Leia as regras e assine para liberar\n' +
                    '┃ o acesso completo ao servidor.\n\n' +
                    '━━━━━━━━━━━━━━━━━━━━━━━━━'
                )
                .setFooter({ text: 'GalleyRP • Bem-vindo(a)!' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`[Welcome] Erro ao enviar mensagem para ${member.user.tag}:`, error);
    }
});

client.login(process.env.BOT_TOKEN);
