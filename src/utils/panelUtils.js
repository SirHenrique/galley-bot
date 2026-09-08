const db = require('../database');
const { buildPainelGeral } = require('./embeds');

async function updatePainelGeral(client) {
    const channelId = await db.getConfig('painel_channel_id');
    const messageId = await db.getConfig('painel_message_id');
    if (!channelId || !messageId) return;

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return;

        const message = await channel.messages.fetch(messageId);
        const personagens = await db.getAll();
        const embed = buildPainelGeral(personagens);
        await message.edit({ embeds: [embed] });
    } catch (e) {
        console.error('[Panel] Erro ao atualizar painel geral:', e.message);
    }
}

async function notifyCompletion(client, personagem) {
    const channelId = await db.getConfig('painel_channel_id');
    if (!channelId) return;

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return;
        await channel.send(
            `🎉 O personagem **${personagem.nome}** do jogador <@${personagem.user_id}> está 100% pronto para revisão!\n📜 Lore ✅ | 🎨 Skin ✅`
        );
    } catch (e) {
        console.error('[Panel] Erro ao enviar notificação de conclusão:', e.message);
    }
}

module.exports = { updatePainelGeral, notifyCompletion };
