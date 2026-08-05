# Guia de Instalação: JARVIS Command Center (PC & Celular)

Senhor, preparei este guia para que você possa ter o JARVIS operando em todos os seus dispositivos. O sistema foi projetado como uma aplicação web responsiva, o que facilita o acesso.

---

## 💻 1. Rodando no seu PC (Local)

### Pré-requisitos
1. **Node.js**: Versão 20 ou superior instalada.
2. **pnpm**: Gerenciador de pacotes (instale com `npm install -g pnpm`).
3. **MySQL/TiDB**: Uma instância de banco de dados rodando (ou use o Docker).

### Passo a Passo
1.  **Clonar o Repositório**:
    ```bash
    git clone https://github.com/Feriper/jarvis-command-center.git
    cd jarvis-command-center
    ```

2.  **Instalar Dependências**:
    ```bash
    pnpm install
    ```

3.  **Configurar Variáveis de Ambiente**:
    Crie um arquivo `.env` na raiz do projeto com:
    ```env
    DATABASE_URL=mysql://usuario:senha@localhost:3306/nome_do_banco
    OPENAI_API_KEY=sua_chave_aqui
    PORT=3000
    ```

4.  **Preparar o Banco de Dados**:
    ```bash
    pnpm db:push
    ```

5.  **Iniciar o Sistema**:
    ```bash
    pnpm dev
    ```
    O JARVIS estará rodando em `http://localhost:3000`.

---

## 📱 2. Rodando no seu Celular

Como o JARVIS é uma Web App, você tem duas formas principais de acessá-lo no celular:

### Opção A: Rede Local (Wi-Fi)
*Use esta opção para testar rapidamente enquanto o PC está ligado.*

1.  Certifique-se de que o PC e o Celular estão no **mesmo Wi-Fi**.
2.  No PC, descubra seu endereço IP local (No Windows: `ipconfig` -> Endereço IPv4, ex: `192.168.1.15`).
3.  No celular, abra o navegador e digite: `http://192.168.1.15:3000`.

### Opção B: Túnel Temporário (ngrok)
*Use esta opção para acessar de qualquer lugar (4G/5G).*

1.  Instale o **ngrok** no seu PC.
2.  Com o JARVIS rodando, execute no terminal:
    ```bash
    ngrok http 3000
    ```
3.  O ngrok fornecerá uma URL (ex: `https://abcd-123.ngrok-free.app`). Abra essa URL no seu celular.

### Opção C: Deploy Real (Recomendado)
*Para ter o JARVIS online 24/7.*

1.  Faça o deploy do backend no **Railway.app** ou **Render.com**.
2.  Conecte seu repositório do GitHub.
3.  Configure as variáveis de ambiente no painel deles.
4.  O JARVIS terá uma URL própria (ex: `https://meu-jarvis.up.railway.app`) que você pode salvar como um ícone na tela inicial do seu celular.

---

## 🚀 Dica de Experiência "Nativa" no Celular

Para que ele pareça um aplicativo real no seu celular:
1.  Abra a URL do seu JARVIS no navegador do celular (Safari ou Chrome).
2.  Toque em **"Compartilhar"** (iOS) ou nos **"Três Pontinhos"** (Android).
3.  Selecione **"Adicionar à Tela de Início"**.
4.  Agora você terá o ícone do JARVIS direto na sua grade de apps!

**Senhor, o sistema está pronto para ser implantado sob seu comando.**
