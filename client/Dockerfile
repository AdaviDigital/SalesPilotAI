# Builds the static Vite output and serves it with a minimal static file
# server. On Vercel/Render/Hostinger this build output (dist/) is typically
# deployed directly as a static site instead of via this container — this
# Dockerfile exists for local docker-compose parity and for any host that
# only accepts container images.

FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
