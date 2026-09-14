# ============================================================
# SalesPilot AI — Production API Dockerfile
# npm workspace / monorepo
# ============================================================

FROM node:20-bookworm-slim AS build

WORKDIR /app

# Prisma requires OpenSSL
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Root workspace manifests
COPY package*.json ./

# Server workspace manifest
COPY server/package*.json ./server/

# Prisma schema and migrations
COPY server/prisma ./server/prisma

# Install dependencies from the root lockfile
RUN npm ci --no-audit --no-fund

# Copy server source
COPY server ./server

# Build API
RUN npm run build -w server


# ============================================================
# Production runtime
# ============================================================

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Prisma requires OpenSSL
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Root workspace manifests
COPY package*.json ./

# Server workspace manifest
COPY server/package*.json ./server/

# Prisma schema and migrations
COPY server/prisma ./server/prisma

# Production dependencies
RUN npm ci --omit=dev --no-audit --no-fund

# Generate Prisma Client
RUN npx prisma generate --schema=server/prisma/schema.prisma

# Compiled API
COPY --from=build /app/server/dist ./server/dist

# OpenAPI specification
COPY server/openapi.yaml ./server/openapi.yaml

EXPOSE 4000

CMD ["node", "server/dist/index.js"]