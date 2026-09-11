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
const { handleBirthdayButton, handleBirthdayModal } = require('./buttons/birthdayButtons');
const { sendBirthdayDM } = require('./utils/birthdayUtils');
const db = require('./database');

client.once('clientReady', () => {
    console.log(`✅ Bot ${client.user.tag} online!`);
    console.log(`📋 Comandos carregados: ${[...client.commands.keys()].join(', ')}`);

    let lastBirthdayDate = null;
    setInterval(async () => {
        const now = new Date();
        const today = `${now.getDate()}-${now.getMonth() + 1}`;
        if (now.getHours() !== 0 || lastBirthdayDate === today) return;
        lastBirthdayDate = today;

        try {
            const channelId = await db.getConfig('birthday_channel_id');
            if (!channelId) return;
            const channel = client.channels.cache.get(channelId);
            if (!channel) return;

            const aniversariantes = await db.getAniversariosByDate(now.getDate(), now.getMonth() + 1);
            for (const a of aniversariantes) {
                await channel.send(
                    `🎂🎉 Hoje é o aniversário de <@${a.user_id}>! Feliz aniversário! 🥳🎊`
                );
            }
        } catch (err) {
            console.error('[Birthday] Erro na verificação diária:', err);
        }
    }, 60 * 60 * 1000);
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
            } else if (interaction.customId === 'modal_birthday_set') {
                await handleBirthdayModal(interaction);
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
            } else if (interaction.customId === 'birthday_set_btn') {
                await handleBirthdayButton(interaction);
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
const WELCOME_CHANNEL_ID = '1546699292478013501';
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
        await sendBirthdayDM(member.user);
    } catch {
        // DM fechado, ignorar
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

const MENTION_GIF = 'https://media.tenor.com/ZLJALFcM_GkAAAAM/n-entrosa-favelado.gif';
const mentionCount = new Map();

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.mentions.has(client.user)) return;

    const userId = message.author.id;

    if (userId === '403525211665727489') {
        await message.channel.send(`é isso mesmo senhor <@${userId}>`).catch(err => console.error('[Mention] Erro:', err));
        return;
    }

    const count = (mentionCount.get(userId) || 0) + 1;
    mentionCount.set(userId, count);

    try {
        if (count === 1) {
            await message.channel.send(
                `Não marque staffs de cargo alto! Preciso me concentrar para responder meus webamigos a próxima é ban! <@${userId}>`
            );
        } else {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setImage(MENTION_GIF);
            await message.channel.send({ embeds: [embed] });
            mentionCount.set(userId, 0);
        }
    } catch (err) {
        console.error('[Mention] Erro ao responder menção:', err);
    }
});

client.login(process.env.BOT_TOKEN);
