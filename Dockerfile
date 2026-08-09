# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

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

# Instalar pnpm
RUN npm install -g pnpm

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

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar aplicação
CMD ["pnpm", "start"]
