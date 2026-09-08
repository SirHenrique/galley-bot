const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { EMBED_COLORS } = require('../config');

function getPersonagemStatus(lore, skin) {
    if (lore && skin) return { label: '🟢 Pronto', color: EMBED_COLORS.PRONTO };
    if (lore || skin) return { label: '🟡 Quase pronto', color: EMBED_COLORS.QUASE };
    return { label: '🔴 Pendente', color: EMBED_COLORS.PENDENTE };
}

function getWorstColor(personagens) {
    let color = EMBED_COLORS.PRONTO;
    for (const p of personagens) {
        if (!p.lore_status || !p.skin_status) {
            if (!p.lore_status && !p.skin_status) return EMBED_COLORS.PENDENTE;
            color = EMBED_COLORS.QUASE;
        }
    }
    return color;
}

function buildChecklistEmbed(personagens) {
    let totalItems = 0;
    let doneItems = 0;

    let description = '━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    description += '⚔️ **GALLEYRP — SUA CHECKLIST**\n';
    description += '━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    personagens.forEach((p, i) => {
        const lore = p.lore_status === 1;
        const skin = p.skin_status === 1;
        const status = getPersonagemStatus(lore, skin);

        totalItems += 2;
        if (lore) doneItems++;
        if (skin) doneItems++;

        description += `👤 **${p.nome}**${p.titulo ? ` — ${p.titulo}` : ''}\n`;
        if (p.cidade) description += `┃ 🏘️ ${p.cidade}\n`;
        if (p.profissao) description += `┃ ⚒️ ${p.profissao}\n`;
        description += `┃\n`;
        const loreLink = lore && p.lore_url ? ` — [📄 Ver Lore](${p.lore_url})` : '';
        description += `┃ 📜 Lore    ➜  ${lore ? `✅ Pronta${loreLink}` : '❌ Pendente'}\n`;
        description += `┃ 🎨 Skin    ➜  ${skin ? '✅ Pronta' : '❌ Pendente'}\n`;
        description += `┃\n`;
        description += `┃ Status: ${status.label}\n`;

        if (i < personagens.length - 1) description += '┠─────────────────────────\n';
    });

    const percent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
    description += '\n━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    description += `📊 Progresso geral: **${doneItems}/${totalItems}** itens concluídos (${percent}%)`;

    return new EmbedBuilder()
        .setColor(getWorstColor(personagens))
        .setDescription(description)
        .setFooter({ text: 'GalleyRP • Checklist de Personagens' });
}

function buildChecklistButtons(personagens) {
    return personagens.map(p => {
        const lore = p.lore_status === 1;
        const skin = p.skin_status === 1;

        const loreBtn = new ButtonBuilder()
            .setCustomId(`checklist_lore_${p.id}`)
            .setLabel(`📜 Lore: ${p.nome}`)
            .setStyle(lore ? ButtonStyle.Success : ButtonStyle.Danger);

        const skinBtn = new ButtonBuilder()
            .setCustomId(`checklist_skin_${p.id}`)
            .setLabel(`🎨 Skin: ${p.nome}`)
            .setStyle(skin ? ButtonStyle.Success : ButtonStyle.Danger);

        return new ActionRowBuilder().addComponents(loreBtn, skinBtn);
    });
}

function buildPainelGeral(personagens) {
    const now = new Date();
    const dateStr = now.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const prontos = [];
    const quase = [];
    const pendentes = [];

    for (const p of personagens) {
        const lore = p.lore_status === 1;
        const skin = p.skin_status === 1;
        const faltando = [];
        if (!lore) faltando.push('Lore');
        if (!skin) faltando.push('Skin');

        if (lore && skin) prontos.push(p);
        else if (lore || skin) quase.push({ ...p, faltando });
        else pendentes.push({ ...p, faltando });
    }

    let description = '━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    description += '📋 **PAINEL DE PERSONAGENS — GALLEYRP**\n';
    description += '━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    if (prontos.length > 0) {
        description += '🟢 **PRONTOS** (Lore + Skin)\n';
        prontos.forEach((p, i) => {
            const prefix = i === prontos.length - 1 ? '└' : '├';
            const loreLink = p.lore_url ? ` [📄 Lore](${p.lore_url})` : '';
            description += `${prefix} **${p.nome}** (<@${p.user_id}>)${p.cidade ? ` — ${p.cidade}` : ''}${loreLink}\n`;
        });
        description += '\n';
    }

    if (quase.length > 0) {
        description += '🟡 **QUASE** (falta 1 item)\n';
        quase.forEach((p, i) => {
            const prefix = i === quase.length - 1 ? '└' : '├';
            const loreLink = p.lore_url ? ` [📄 Lore](${p.lore_url})` : '';
            description += `${prefix} **${p.nome}** (<@${p.user_id}>)${p.cidade ? ` — ${p.cidade}` : ''} [falta: ${p.faltando.join(', ')}]${loreLink}\n`;
        });
        description += '\n';
    }

    if (pendentes.length > 0) {
        description += '🔴 **PENDENTES**\n';
        pendentes.forEach((p, i) => {
            const prefix = i === pendentes.length - 1 ? '└' : '├';
            const loreLink = p.lore_url ? ` [📄 Lore](${p.lore_url})` : '';
            description += `${prefix} **${p.nome}** (<@${p.user_id}>)${p.cidade ? ` — ${p.cidade}` : ''} [falta: ${p.faltando.join(', ')}]${loreLink}\n`;
        });
        description += '\n';
    }

    if (personagens.length === 0) {
        description += '*Nenhum personagem cadastrado ainda.*\n\n';
    }

    description += '━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    description += `📊 Total: **${personagens.length}** personagens | `;
    description += `**${prontos.length}** prontos | **${quase.length}** quase | **${pendentes.length}** pendentes\n`;
    description += `🕐 Última atualização: ${dateStr}\n`;
    description += '━━━━━━━━━━━━━━━━━━━━━━━━━';

    return new EmbedBuilder()
        .setColor(EMBED_COLORS.INFO)
        .setDescription(description)
        .setFooter({ text: 'GalleyRP • Atualizado automaticamente' });
}

module.exports = { buildChecklistEmbed, buildChecklistButtons, buildPainelGeral, getPersonagemStatus };
