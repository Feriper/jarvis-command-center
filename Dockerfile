# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Fixar o gerenciador para reproduzir o lockfile em todos os deploys
ARG PNPM_VERSION=10.18.0
RUN npm install -g pnpm@${PNPM_VERSION}

# Copiar arquivos
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código-fonte
COPY . .

# Build
RUN pnpm build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Fixar o gerenciador para reproduzir o lockfile em todos os deploys
ARG PNPM_VERSION=10.18.0
RUN npm install -g pnpm@${PNPM_VERSION}

# Copiar apenas os arquivos necessários do builder
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile --prod

# Copiar os bundles de produção do stage anterior.
# O servidor empacotado resolve os assets relativos a dist-server/public.
COPY --from=builder /app/dist/public ./dist-server/public
COPY --from=builder /app/dist-server/index.js ./dist-server/index.js

# Expor porta
EXPOSE 3000

# Health check: Railway injects PORT; 3000 remains the local default.
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; require('http').get('http://localhost:' + port + '/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)}).on('error', () => process.exit(1))"

# Iniciar aplicação
CMD ["pnpm", "start"]
