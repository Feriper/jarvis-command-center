#!/bin/bash

# =================================================================
# JARVIS Ultra-Premium - Oracle Cloud / VPS Deploy Script
# =================================================================

echo "🚀 Iniciando instalação do JARVIS Ultra-Premium..."

# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -e bash -
sudo apt-get install -y nodejs

# 3. Instalar pnpm
sudo npm install -g pnpm

# 4. Instalar MySQL
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql

# 5. Instalar PM2 (Gerenciador de Processos)
sudo npm install -g pm2

# 6. Configurar Banco de Dados
echo "📦 Configurando banco de dados..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS jarvis_db;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'jarvis_user'@'localhost' IDENTIFIED BY 'jarvis_pass_2026';"
sudo mysql -e "GRANT ALL PRIVILEGES ON jarvis_db.* TO 'jarvis_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 7. Instalar dependências e Build
echo "🏗️ Construindo aplicação..."
pnpm install
pnpm build

# 8. Configurar Variáveis de Ambiente
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️ Por favor, edite o arquivo .env com sua OPENAI_API_KEY e outras chaves."
fi

# 9. Rodar Migrações
echo "🔄 Rodando migrações do banco de dados..."
DATABASE_URL="mysql://jarvis_user:jarvis_pass_2026@localhost:3306/jarvis_db" pnpm db:push

# 10. Iniciar com PM2
echo "🔥 Iniciando JARVIS..."
DATABASE_URL="mysql://jarvis_user:jarvis_pass_2026@localhost:3306/jarvis_db" pm2 start dist-server/index.js --name "jarvis-backend"
pm2 save
pm2 startup

echo "✅ INSTALAÇÃO CONCLUÍDA!"
echo "-------------------------------------------------------"
echo "O JARVIS está rodando internamente na porta 3000."
echo "Use um Nginx Reverse Proxy para acessar via domínio."
echo "-------------------------------------------------------"
