# 🤖 GalleyRP — Bot de Checklist de Personagens

Bot para Discord que permite cada jogador do servidor GalleyRP gerenciar a checklist dos seus personagens. Cada personagem tem dois itens para validar: **Lore** e **Skin**.

---

## Stack

- **Runtime:** Node.js 18+
- **Lib:** discord.js v14
- **Banco:** Supabase (PostgreSQL)

---

## 1. Configurar o Supabase

### Criar as tabelas

No painel do Supabase, vá em **SQL Editor** e execute:

```sql
-- Tabela de personagens
CREATE TABLE personagens (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    titulo TEXT DEFAULT '',
    cidade TEXT DEFAULT '',
    profissao TEXT DEFAULT '',
    lore_status INTEGER DEFAULT 0,
    skin_status INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_id ON personagens(user_id);

-- Tabela de configurações do bot
CREATE TABLE config (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

### Obter as credenciais

No painel do Supabase: **Settings → API**

- **Project URL** → `SUPABASE_URL`
- **anon / public key** → `SUPABASE_KEY`

---

## 2. Configurar o Discord

No [Portal do Desenvolvedor](https://discord.com/developers/applications):

1. Crie uma aplicação → vá em **Bot** → clique em **Reset Token** → copie o token
2. Ative: **Server Members Intent** e **Message Content Intent** (em Bot → Privileged Gateway Intents)
3. Copie o **Application ID** (General Information)

> Para copiar IDs do servidor/canal/role: ative o **Modo Desenvolvedor** em Configurações do Discord → Avançado → clique direito no item → Copiar ID.

---

## 3. Instalação

```bash
npm install
```

---

## 4. Configurar o `.env`

```env
BOT_TOKEN=seu_token_aqui
CLIENT_ID=id_da_aplicacao_discord
GUILD_ID=id_do_servidor_discord
ADMIN_ROLE_ID=id_da_role_de_staff

SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=sua_anon_key_aqui
```

---

## 5. Registrar os Comandos Slash

Execute **uma vez** (ou sempre que adicionar/mudar comandos):

```bash
npm run deploy
```

---

## 6. Rodar o Bot

```bash
npm start
```

---

## Comandos Disponíveis

### Jogadores

| Comando | Descrição |
|---|---|
| `/personagem adicionar` | Adiciona um personagem à checklist (máx. 3) |
| `/personagem remover` | Remove um personagem (pede confirmação) |
| `/personagem editar` | Edita nome, título, cidade ou profissão |
| `/checklist ver` | Exibe sua checklist com botões de toggle |

### Staff

| Comando | Descrição |
|---|---|
| `/checklist canal #canal` | Define o canal do painel fixo (atualiza automaticamente) |
| `/admin checklist` | Painel geral de todos os jogadores |
| `/admin checklist @jogador` | Checklist de um jogador específico |

---

## Painel Fixo

Use `/checklist canal #canal` para fixar um painel que exibe o status de todos os personagens. Ele é atualizado automaticamente sempre que qualquer jogador marcar ou desmarcar Lore/Skin.

Se a mensagem do painel for deletada, execute o comando novamente.

---

## Permissões do Bot no Discord

- Send Messages
- Embed Links
- Use Slash Commands
- Read Message History
- Manage Messages

---

## Estrutura do Projeto

```
galleyrp-bot/
├── src/
│   ├── index.js                  # Entry point
│   ├── deploy-commands.js        # Registra slash commands
│   ├── config.js                 # Constantes
│   ├── database.js               # Supabase client + queries
│   ├── commands/
│   │   ├── personagem.js         # /personagem
│   │   ├── checklist.js          # /checklist
│   │   └── admin.js              # /admin
│   ├── buttons/
│   │   └── checklistButtons.js   # Handler dos botões de toggle
│   └── utils/
│       ├── embeds.js             # Geração de embeds e botões
│       └── panelUtils.js         # Atualização do painel e notificações
├── .env
└── package.json
```
