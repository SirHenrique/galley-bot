const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

async function query(promise) {
    const { data, error } = await promise;
    if (error) throw new Error(`[DB] ${error.message}`);
    return data;
}

module.exports = {
    async getByUser(userId) {
        return query(
            supabase.from('personagens').select('*').eq('user_id', userId).order('created_at', { ascending: true })
        );
    },

    async getById(id) {
        const data = await query(
            supabase.from('personagens').select('*').eq('id', id).maybeSingle()
        );
        return data;
    },

    async getByUserAndName(userId, nome) {
        const data = await query(
            supabase.from('personagens').select('*').eq('user_id', userId).ilike('nome', nome).maybeSingle()
        );
        return data;
    },

    async getAll() {
        return query(
            supabase.from('personagens').select('*').order('user_id').order('created_at', { ascending: true })
        );
    },

    async countByUser(userId) {
        const { count, error } = await supabase
            .from('personagens')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        if (error) throw new Error(`[DB] ${error.message}`);
        return count ?? 0;
    },

    async addPersonagem(userId, nome, titulo, cidade, profissao) {
        return query(
            supabase.from('personagens').insert({
                user_id: userId,
                nome,
                titulo: titulo || '',
                cidade: cidade || '',
                profissao: profissao || ''
            }).select().single()
        );
    },

    async removePersonagem(id) {
        return query(
            supabase.from('personagens').delete().eq('id', id)
        );
    },

    async updatePersonagem(id, fields) {
        if (Object.keys(fields).length === 0) return;
        return query(
            supabase.from('personagens').update(fields).eq('id', id)
        );
    },

    async toggleLore(id) {
        const row = await this.getById(id);
        if (!row) return;
        return query(
            supabase.from('personagens').update({ lore_status: row.lore_status === 0 ? 1 : 0 }).eq('id', id)
        );
    },

    async setLoreUrl(id, url) {
        return query(
            supabase.from('personagens').update({ lore_url: url }).eq('id', id)
        );
    },

    async toggleSkin(id) {
        const row = await this.getById(id);
        if (!row) return;
        return query(
            supabase.from('personagens').update({ skin_status: row.skin_status === 0 ? 1 : 0 }).eq('id', id)
        );
    },

    async getConfig(key) {
        const data = await query(
            supabase.from('config').select('value').eq('key', key).maybeSingle()
        );
        return data ? data.value : null;
    },

    async setConfig(key, value) {
        return query(
            supabase.from('config').upsert({ key, value })
        );
    }
};
