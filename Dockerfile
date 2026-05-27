# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration=production

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

ENV PORT=4000
ENV NODE_ENV=production

COPY --from=build /app/dist/front-neo ./dist/front-neo
COPY --from=build /app/node_modules ./node_modules

EXPOSE 4000

CMD ["node", "dist/front-neo/server/server.mjs"]
