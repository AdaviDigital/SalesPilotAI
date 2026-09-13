# Multi-stage build producing a plain Node.js process — the exact same
# container works whether run directly, via docker-compose, or as the
# reference for how Render/Hostinger should run the server (npm run build
# && npm run start), since neither platform requires Docker specifically.

FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate
COPY --from=build /app/dist ./dist
COPY openapi.yaml ./openapi.yaml

EXPOSE 4000
CMD ["node", "dist/index.js"]
