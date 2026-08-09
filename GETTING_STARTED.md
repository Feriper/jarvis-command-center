# JARVIS — Guia de ativação do MVP

Este projeto é um MVP de assistente pessoal com conversa, memória, tarefas, conteúdo e aprovação humana de ações sensíveis. Ele não executa transferências Pix, não publica automaticamente e não armazena senhas pessoais.

## 1. Pré-requisitos

É necessário Node.js, pnpm, um banco MySQL/TiDB acessível e um provedor OAuth compatível com a configuração do projeto. Para iniciar apenas o desenvolvimento do cliente e validar o código, as dependências podem ser instaladas com `pnpm install --frozen-lockfile`.

## 2. Configuração do ambiente

Copie `.env.example` para `.env` no servidor. Preencha `DATABASE_URL`, `OAUTH_SERVER_URL`, `OAUTH_CLIENT_ID` e `OAUTH_CLIENT_SECRET` no ambiente de execução, nunca no frontend e nunca no Git. A chave do LLM é opcional para executar apenas os testes, mas necessária para o chat real.

Não coloque neste arquivo uma senha de usuário, chave Pix, token bancário, client secret de YouTube/TikTok ou qualquer outro segredo que não seja necessário para o servidor. Use o mecanismo de secrets da hospedagem.

## 3. Verificação antes de iniciar

Execute:

```bash
pnpm preflight
```

O comando falha se as variáveis obrigatórias não estiverem presentes e não imprime os valores dos segredos.

## 4. Banco de dados

Aplique as migrações versionadas em ordem, incluindo:

```text
drizzle/0000_smiling_ravenous.sql
drizzle/0001_superb_smasher.sql
drizzle/0002_content_drafts.sql
drizzle/0003_assistant_actions.sql
```

O arquivo `0003_assistant_actions.sql` cria o cofre de ações pendentes. Ele permite registrar propostas e aprovações, mas não executa transferências, publicações ou mensagens.

## 5. Executar

Para desenvolvimento:

```bash
pnpm preflight
pnpm dev
```

Para produção:

```bash
pnpm check
pnpm test -- --run
pnpm build
pnpm start
```

A autenticação do cliente usa a sessão OAuth oficial. A rota `/actions` mostra ações pendentes e exige revisão humana. A rota `/tasks` organiza tarefas. A pipeline de conteúdo está documentada em `CONTENT_PRODUCTION.md`.

## 6. Critérios de segurança do MVP

A publicação externa deve começar em modo privado ou não listado. O Jarvis deve registrar fontes e direitos antes de aprovar um rascunho. Nenhuma ação financeira deve ser conectada a uma chave Pix ou executor automático. A aprovação atual apenas muda o estado da ação; a execução permanece bloqueada até existir uma integração oficial, limitada, auditável e confirmada no momento da operação.

## 7. Checklist de ativação

| Verificação | Concluída quando |
|---|---|
| Banco | Migrações aplicadas sem erro |
| OAuth | Login e logout funcionam com sessão oficial |
| Chat | Uma conversa é salva e recuperada |
| Tarefas | Criar, concluir e excluir funcionam |
| Ações | Propor, aprovar e rejeitar funcionam; nada externo é executado |
| Conteúdo | Rascunho, direitos, pacote e render local funcionam |
| Segurança | Nenhuma senha pessoal ou chave Pix aparece no repositório |
| Backup | Banco e arquivos de mídia têm rotina de backup |
