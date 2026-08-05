# 🚀 Deploy Jarvis em Oracle Cloud Free Tier

## 📋 Pré-requisitos

- Conta Oracle Cloud (Free Tier)
- 4 vCPU ARM Ampere A1 (permanente)
- 24 GB RAM
- 200 GB SSD
- Ubuntu 22.04 LTS

---

## 🔧 Step 1: Criar Instância ARM em Oracle Cloud

### 1.1 Acessar Oracle Cloud Console
```
https://www.oracle.com/cloud/free/
```

### 1.2 Criar Compute Instance
- **Image**: Ubuntu 22.04 LTS
- **Shape**: VM.Standard.A1.Flex (ARM)
- **CPU**: 4 vCPU
- **Memory**: 24 GB
- **Storage**: 200 GB

### 1.3 Configurar Security Group
```
Inbound Rules:
- SSH (22): 0.0.0.0/0
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
- Custom (3000): 0.0.0.0/0 (Node.js app)
```

---

## 💻 Step 2: Configurar Servidor

### 2.1 SSH na Instância
```bash
ssh -i your-key.pem ubuntu@your-oracle-ip
```

### 2.2 Atualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 2.3 Instalar Node.js 22
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # v22.x.x
npm install -g pnpm
```

### 2.4 Instalar MySQL
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Criar database para Jarvis
sudo mysql -u root -p
CREATE DATABASE jarvis_db;
CREATE USER 'jarvis'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON jarvis_db.* TO 'jarvis'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.5 Instalar Nginx (Reverse Proxy)
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 📦 Step 3: Deploy da Aplicação

### 3.1 Clonar Repositório
```bash
cd /home/ubuntu
git clone https://github.com/Feriper/jarvis-command-center.git
cd jarvis-command-center
```

### 3.2 Instalar Dependências
```bash
pnpm install
```

### 3.3 Configurar Variáveis de Ambiente
```bash
cat > .env.production << 'EOF'
# Database
DATABASE_URL="mysql://jarvis:strong_password@localhost:3306/jarvis_db"

# API Keys
OPENAI_API_KEY="your-key"
GROQ_API_KEY="your-key"

# Server
NODE_ENV=production
PORT=3000

# Frontend
VITE_API_URL="https://your-oracle-domain.com"
EOF
```

### 3.4 Build da Aplicação
```bash
pnpm build
```

### 3.5 Executar Migrations
```bash
pnpm db:push
```

---

## 🔄 Step 4: Configurar PM2 (Process Manager)

### 4.1 Instalar PM2
```bash
sudo npm install -g pm2
```

### 4.2 Criar Arquivo de Configuração
```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'jarvis-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/jarvis-error.log',
    out_file: '/var/log/jarvis-out.log',
    log_file: '/var/log/jarvis-combined.log',
    time_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF
```

### 4.3 Iniciar com PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🌐 Step 5: Configurar Nginx Reverse Proxy

### 5.1 Criar Configuração Nginx
```bash
sudo cat > /etc/nginx/sites-available/jarvis << 'EOF'
upstream jarvis_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-oracle-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-oracle-domain.com;
    
    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-oracle-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-oracle-domain.com/privkey.pem;
    
    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1024;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    
    # Frontend
    location / {
        root /home/ubuntu/jarvis-command-center/dist/public;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # API
    location /api {
        proxy_pass http://jarvis_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # tRPC
    location /trpc {
        proxy_pass http://jarvis_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
EOF
```

### 5.2 Ativar Configuração
```bash
sudo ln -s /etc/nginx/sites-available/jarvis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5.3 Instalar SSL com Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-oracle-domain.com
```

---

## 📊 Step 6: Monitoramento

### 6.1 Verificar Status
```bash
pm2 status
pm2 logs jarvis-api
```

### 6.2 Monitorar Performance
```bash
# Instalar htop
sudo apt install -y htop
htop

# Verificar espaço em disco
df -h

# Verificar uso de memória
free -h
```

---

## 🔐 Step 7: Backup e Segurança

### 7.1 Backup Automático do Banco de Dados
```bash
cat > /home/ubuntu/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
mysqldump -u jarvis -p"strong_password" jarvis_db > $BACKUP_DIR/jarvis_$(date +%Y%m%d_%H%M%S).sql
# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF

chmod +x /home/ubuntu/backup-db.sh

# Agendar backup diário
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup-db.sh") | crontab -
```

### 7.2 Firewall
```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## 🎯 Performance Esperado

| Métrica | Valor |
| :--- | :--- |
| **CPU** | 4 vCPU ARM Ampere |
| **RAM** | 24 GB |
| **Storage** | 200 GB SSD |
| **Bandwidth** | Ilimitado (Free Tier) |
| **Uptime SLA** | 99.9% |
| **Custo** | $0/mês (Permanente) |

---

## 📝 Troubleshooting

### Erro: "Cannot find module"
```bash
pnpm install
pnpm build
```

### Erro: "Port 3000 already in use"
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Erro: "Database connection refused"
```bash
sudo systemctl restart mysql
# Verificar credenciais em .env
```

---

## ✅ Checklist Final

- [ ] Instância Oracle Cloud criada
- [ ] Node.js 22 instalado
- [ ] MySQL configurado
- [ ] Repositório clonado
- [ ] Dependências instaladas
- [ ] Build executado com sucesso
- [ ] PM2 rodando aplicação
- [ ] Nginx configurado como reverse proxy
- [ ] SSL/HTTPS funcionando
- [ ] Domínio apontando para IP da instância
- [ ] Backups agendados
- [ ] Firewall configurado

---

**Custo Total: $0/mês (Oracle Cloud Free Tier Permanente)** 🎉
