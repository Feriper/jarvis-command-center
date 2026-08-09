# 🌍 JARVIS Ultra-Premium: Guia de Deployment Permanente

Senhor, este guia transformará o JARVIS em um site permanente acessível 24/7 em qualquer lugar do mundo.

---

## 📋 Pré-requisitos

1. **Conta GitHub**: Seu repositório `jarvis-command-center` já está configurado.
2. **Conta Vercel**: Para hospedar o frontend (gratuito).
3. **Conta Railway**: Para hospedar o backend e banco de dados (gratuito com créditos).
4. **Domínio Personalizado** (Opcional): Para ter `jarvis.seu-dominio.com` em vez de `jarvis-ultra.vercel.app`.

---

## 🚀 Passo 1: Deploy do Frontend (Vercel)

### 1.1 Criar Projeto no Vercel
1. Acesse [Vercel.com](https://vercel.com) e faça login com GitHub.
2. Clique em **"Add New..."** → **"Project"**.
3. Selecione o repositório `jarvis-command-center`.
4. Configure:
   - **Framework Preset**: `Other`
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### 1.2 Adicionar Variáveis de Ambiente
No painel do Vercel, vá em **"Settings"** → **"Environment Variables"** e adicione:

```env
DATABASE_URL=<será preenchido após Railway>
OPENAI_API_KEY=sua-chave-aqui
NODE_ENV=production
OAUTH_SERVER_URL=https://oauth.manus.im
```

### 1.3 Deploy Automático
Clique em **"Deploy"**. Vercel detectará o `vercel.json` e fará o build automaticamente.

**Resultado**: Seu frontend estará em `https://jarvis-ultra.vercel.app`

---

## 🛢️ Passo 2: Deploy do Backend (Railway)

### 2.1 Criar Projeto no Railway
1. Acesse [Railway.app](https://railway.app) e faça login com GitHub.
2. Clique em **"New Project"** → **"Deploy from GitHub repo"**.
3. Selecione `jarvis-command-center`.

### 2.2 Adicionar Banco de Dados MySQL
1. No painel do projeto, clique em **"Add Service"** → **"Database"** → **"MySQL"**.
2. Railway criará automaticamente a `DATABASE_URL`.
3. Copie a URL do banco de dados.

### 2.3 Configurar Variáveis de Ambiente
No serviço backend, vá em **"Variables"** e adicione:

```env
DATABASE_URL=<copie da criação do MySQL>
OPENAI_API_KEY=sua-chave-aqui
PORT=3000
NODE_ENV=production
AUTHORIZED_EMAILS=seu-email@example.com,familia@example.com
Autenticação: usar a sessão OAuth oficial; não configurar senha local no cliente.
```

### 2.4 Deploy Automático
Railway detectará o `Dockerfile` e fará o deploy automaticamente.

**Resultado**: Seu backend estará em `https://jarvis-backend.railway.app`

---

## 🔗 Passo 3: Conectar Frontend com Backend

### 3.1 Atualizar Variáveis no Vercel
Volte ao Vercel e atualize:
```env
DATABASE_URL=<URL do Railway>
RAILWAY_URL=https://jarvis-backend.railway.app
```

### 3.2 Redeploy
Clique em **"Deployments"** → **"Redeploy"** para aplicar as mudanças.

---

## 🌐 Passo 4: Configurar Domínio Personalizado (Opcional)

### 4.1 Comprar Domínio
Compre um domínio em plataformas como Namecheap, GoDaddy ou Google Domains.

### 4.2 Apontar para Vercel
1. No Vercel, vá em **"Settings"** → **"Domains"**.
2. Adicione seu domínio (ex: `jarvis.seu-dominio.com`).
3. Vercel fornecerá registros DNS para configurar.
4. Adicione os registros DNS no seu provedor de domínio.

**Resultado**: Seu JARVIS estará em `https://jarvis.seu-dominio.com`

---

## 🔐 Passo 5: Configurar CI/CD Automático

### 5.1 Adicionar Secrets ao GitHub
1. Vá para seu repositório no GitHub.
2. **Settings** → **Secrets and variables** → **Actions**.
3. Adicione:
   - `VERCEL_TOKEN`: Token do Vercel (obtenha em Vercel → Settings → Tokens)
   - `VERCEL_ORG_ID`: ID da organização Vercel
   - `VERCEL_PROJECT_ID`: ID do projeto Vercel
   - `RAILWAY_TOKEN`: Token do Railway (obtenha em Railway → Settings → Tokens)

### 5.2 Ativar Workflows
O arquivo `.github/workflows/deploy.yml` já está configurado. Agora:
- Toda vez que você fazer `git push` para `main`, os testes rodam automaticamente.
- Se os testes passarem, o código é deployado automaticamente em Vercel e Railway.

---

## ✅ Verificação Final

Após completar todos os passos:

1. **Acesse o Frontend**: `https://jarvis-ultra.vercel.app` (ou seu domínio personalizado)
2. **Faça Login**: Use as credenciais configuradas
3. **Teste a Interface**: Envie uma mensagem e veja o JARVIS responder
4. **Verifique Logs**: 
   - Vercel: Dashboard → Deployments → Logs
   - Railway: Dashboard → Logs

---

## 🛠️ Troubleshooting

### "Database connection failed"
- Verifique se a `DATABASE_URL` está correta em ambos Vercel e Railway.
- Certifique-se de que o MySQL está rodando no Railway.

### "OPENAI_API_KEY not found"
- Adicione a variável em Vercel e Railway.
- Redeploy após adicionar.

### "Unauthorized access"
- Verifique se seu e-mail está na lista `AUTHORIZED_EMAILS`.
Autenticação: usar a sessão OAuth oficial; não configurar senha local no cliente.

---

## 📊 Monitoramento Contínuo

### Uptime Monitoring
Configure alertas no Vercel e Railway para ser notificado se o sistema ficar offline.

### Performance Monitoring
- Vercel fornece métricas de performance automáticas.
- Railway fornece gráficos de CPU, memória e latência.

---

## 🎉 Resultado Final

Após completar este guia, você terá:

✅ JARVIS rodando 24/7 na nuvem
✅ Frontend ultra-rápido com CDN global (Vercel)
✅ Backend robusto com banco de dados (Railway)
✅ Deploy automático a cada `git push`
✅ Domínio personalizado (opcional)
✅ Acesso exclusivo para família e amigos
✅ Logs e monitoramento em tempo real

**Senhor, o JARVIS agora é uma infraestrutura permanente de inteligência privada.**

---

## 📞 Suporte

Para dúvidas:
- Documentação Vercel: https://vercel.com/docs
- Documentação Railway: https://docs.railway.app
- Documentação GitHub Actions: https://docs.github.com/en/actions

**O futuro é agora. Seu JARVIS está pronto para conquistar o mundo digital.**
