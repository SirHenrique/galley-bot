const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const db = require('../database');
const { MAX_PERSONAGENS_POR_USUARIO } = require('../config');
const { updatePainelGeral } = require('../utils/panelUtils');

const data = new SlashCommandBuilder()
    .setName('personagem')
    .setDescription('Gerencie seus personagens')
    .addSubcommand(sub => sub
        .setName('adicionar')
        .setDescription('Adiciona um novo personagem à sua checklist')
        .addStringOption(opt => opt
            .setName('nome')
            .setDescription('Nome do personagem')
            .setRequired(true)
            .setMaxLength(50))
        .addStringOption(opt => opt
            .setName('titulo')
            .setDescription('Título ou apelido (ex: O Lodo que Cultiva)')
            .setRequired(false)
            .setMaxLength(80))
        .addStringOption(opt => opt
            .setName('cidade')
            .setDescription('Cidade do personagem no RP')
            .setRequired(false)
            .addChoices(
                { name: 'Hati', value: 'Hati' },
                { name: 'Ardamarah', value: 'Ardamarah' },
                { name: 'Geffen', value: 'Geffen' },
                { name: 'Amatsu', value: 'Amatsu' }
            ))
        .addStringOption(opt => opt
            .setName('profissao')
            .setDescription('Profissão (ex: Fazendeiro / Alquimista)')
            .setRequired(false)
            .setMaxLength(80)))
    .addSubcommand(sub => sub
        .setName('remover')
        .setDescription('Remove um personagem da sua checklist')
        .addStringOption(opt => opt
            .setName('nome')
            .setDescription('Nome do personagem')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(sub => sub
        .setName('editar')
        .setDescription('Edita informações de um personagem existente')
        .addStringOption(opt => opt
            .setName('nome')
            .setDescription('Nome do personagem a editar')
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(opt => opt
            .setName('novo_nome')
            .setDescription('Novo nome')
            .setRequired(false)
            .setMaxLength(50))
        .addStringOption(opt => opt
            .setName('titulo')
            .setDescription('Novo título')
            .setRequired(false)
            .setMaxLength(80))
        .addStringOption(opt => opt
            .setName('cidade')
            .setDescription('Nova cidade')
            .setRequired(false)
            .addChoices(
                { name: 'Hati', value: 'Hati' },
                { name: 'Ardamarah', value: 'Ardamarah' },
                { name: 'Geffen', value: 'Geffen' },
                { name: 'Amatsu', value: 'Amatsu' }
            ))
        .addStringOption(opt => opt
            .setName('profissao')
            .setDescription('Nova profissão')
            .setRequired(false)
            .setMaxLength(80)));

async function autocomplete(interaction) {
    const userId = interaction.user.id;
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const personagens = await db.getByUser(userId);
    const filtered = personagens.filter(p => p.nome.toLowerCase().includes(focusedValue));
    await interaction.respond(filtered.map(p => ({ name: p.nome, value: p.nome })));
}

async function execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const sub = interaction.options.getSubcommand();

    if (sub === 'adicionar') {
        const nome = interaction.options.getString('nome');
        const titulo = interaction.options.getString('titulo') || '';
        const cidade = interaction.options.getString('cidade') || '';
        const profissao = interaction.options.getString('profissao') || '';
        const userId = interaction.user.id;

        const count = await db.countByUser(userId);
        if (count >= MAX_PERSONAGENS_POR_USUARIO) {
            return interaction.editReply({
                content: `❌ Você já possui o máximo de **${MAX_PERSONAGENS_POR_USUARIO}** personagens. Remova um antes de adicionar outro.`
            });
        }

        const existing = await db.getByUserAndName(userId, nome);
        if (existing) {
            return interaction.editReply({
                content: `❌ Você já tem um personagem chamado **${nome}**.`
            });
        }

        await db.addPersonagem(userId, nome, titulo, cidade, profissao);
        await updatePainelGeral(interaction.client);

        return interaction.editReply({
            content: `✅ Personagem **${nome}** adicionado à sua checklist!\nUse \`/checklist ver\` para acompanhar o progresso.`
        });
    }

    if (sub === 'remover') {
        const nome = interaction.options.getString('nome');
        const userId = interaction.user.id;

        const personagem = await db.getByUserAndName(userId, nome);
        if (!personagem) {
            return interaction.editReply({
                content: `❌ Personagem **${nome}** não encontrado.`
            });
        }

        const confirmBtn = new ButtonBuilder()
            .setCustomId(`confirm_remove_${personagem.id}`)
            .setLabel('Confirmar')
            .setStyle(ButtonStyle.Danger);

        const cancelBtn = new ButtonBuilder()
            .setCustomId(`cancel_remove_${personagem.id}`)
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

        return interaction.editReply({
            content: `⚠️ Tem certeza que deseja remover **${nome}**? Essa ação não pode ser desfeita.`,
            components: [row]
        });
    }

    if (sub === 'editar') {
        const nome = interaction.options.getString('nome');
        const novoNome = interaction.options.getString('novo_nome');
        const titulo = interaction.options.getString('titulo');
        const cidade = interaction.options.getString('cidade');
        const profissao = interaction.options.getString('profissao');
        const userId = interaction.user.id;

        if (!novoNome && titulo === null && !cidade && profissao === null) {
            return interaction.editReply({
                content: '❌ Preencha pelo menos um campo para editar.'
            });
        }

        const personagem = await db.getByUserAndName(userId, nome);
        if (!personagem) {
            return interaction.editReply({
                content: `❌ Personagem **${nome}** não encontrado.`
            });
        }

        const fields = {};
        if (novoNome) fields.nome = novoNome;
        if (titulo !== null) fields.titulo = titulo;
        if (cidade) fields.cidade = cidade;
        if (profissao !== null) fields.profissao = profissao;

        await db.updatePersonagem(personagem.id, fields);
        await updatePainelGeral(interaction.client);

        return interaction.editReply({
            content: `✅ Personagem **${nome}** atualizado com sucesso!`
        });
    }
}

async function handleRemoveButton(interaction) {
    const parts = interaction.customId.split('_');
    const action = parts[1];
    const personagemId = parseInt(parts[2]);
    const userId = interaction.user.id;

    const personagem = await db.getById(personagemId);
    if (!personagem) {
        return interaction.update({ content: '❌ Personagem não encontrado.', components: [] });
    }

    if (personagem.user_id !== userId) {
        return interaction.reply({ content: '❌ Não é seu botão.', flags: MessageFlags.Ephemeral });
    }

    if (action === 'remove') {
        await db.removePersonagem(personagemId);
        await updatePainelGeral(interaction.client);
        return interaction.update({
            content: `✅ Personagem **${personagem.nome}** removido com sucesso.`,
            components: []
        });
    }

    if (action === 'cancel') {
        return interaction.update({ content: '❌ Remoção cancelada.', components: [] });
    }
}

module.exports = { data, execute, autocomplete, handleRemoveButton };
