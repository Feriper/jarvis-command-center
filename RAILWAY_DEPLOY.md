# Hospedagem recomendada: Railway

## Decisão

Para o MVP atual, Railway é a opção mais simples porque o projeto já usa Node.js, Docker e MySQL. A plataforma permite conectar o repositório GitHub, provisionar um serviço MySQL e disponibilizar as variáveis `MYSQL_URL`/`MYSQL_PUBLIC_URL` para a aplicação. O serviço também permite configurar comando de build, start, pre-deploy e reinício.

A recomendação é começar no teste gratuito e não ativar cobrança sem revisar o limite. A página oficial informa um período de teste com US$ 5 em créditos por 30 dias sem cartão, um plano Free com US$ 1 de créditos mensais e um plano Hobby de US$ 5 por mês com US$ 5 de uso incluído. O preço real depende de CPU, memória, disco, egress e armazenamento de objetos.

## Por que não Render Free como serviço principal

Render é uma boa alternativa para protótipo, mas a própria documentação informa que os serviços Free entram em suspensão após 15 minutos sem tráfego, perdem arquivos locais quando reiniciam e o Postgres Free expira após 30 dias. Isso é inadequado para memória pessoal, mídia e execução contínua sem backups.

## Preparação do projeto

O repositório já possui `Dockerfile` e `railway.json`. O Dockerfile foi corrigido para copiar `dist-server`, que contém o bundle usado por `pnpm start`. Também foi criada a rota HTTP `/health` para monitoramento.

No Railway, crie um projeto a partir do repositório GitHub e adicione um serviço MySQL pelo menu de banco. No serviço da aplicação, configure as variáveis no painel de secrets:

```text
DATABASE_URL=${{MySQL.MYSQL_URL}}
OAUTH_SERVER_URL=<valor fornecido pelo provedor OAuth>
OAUTH_CLIENT_ID=<client id do OAuth>
OAUTH_CLIENT_SECRET=<secret armazenado no Railway>
OPENAI_API_KEY=<chave do provedor de LLM, se o chat real for usado>
NODE_ENV=production
PORT=3000
```

Não publique esses valores no GitHub e não reutilize a senha do Google. O callback OAuth deve usar o domínio HTTPS gerado pelo Railway, com o caminho oficial `/api/oauth/callback`, e precisa ser cadastrado no provedor OAuth antes do primeiro login.

## Migrações

Depois que o MySQL estiver criado e `DATABASE_URL` estiver disponível, execute as migrações no ambiente de deploy, preferencialmente como pre-deploy command:

```bash
pnpm db:push
```

A aplicação só deve ser liberada após as migrações `0000` até `0003` concluírem sem erro. Faça backup antes de atualizar o schema.

## Configuração de produção

Use:

```text
Build command: pnpm install --frozen-lockfile && pnpm build
Start command: pnpm start
Healthcheck: /health
```

O Jarvis deve começar com publicação externa, Pix, mensagens e ações financeiras bloqueados. Primeiro valide login, chat, tarefas, memória, `/actions` e produção de rascunhos. O primeiro upload de vídeo deve ser manual e privado ou não listado.

## Limites e segurança

Railway cobra uso por segundo e pode cobrar egress, volumes e armazenamento de objetos. Configure alertas e limite de gasto antes de ativar qualquer serviço pago. O banco MySQL é provisionado a partir de uma imagem oficial, mas a documentação do Railway considera esse banco não gerenciado; configure backups próprios e não trate a hospedagem como substituta de backup.

## Referências oficiais

[1]: [Railway Pricing](https://railway.com/pricing)
[2]: [Railway MySQL](https://docs.railway.com/databases/mysql)
[3]: [Railway Deployments](https://docs.railway.com/deploy/deployments)
[4]: [Render Deploy for Free](https://render.com/docs/free)
[5]: [Render Pricing](https://render.com/pricing)
[6]: [Render Background Workers](https://render.com/docs/background-workers)
