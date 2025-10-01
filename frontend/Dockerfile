# =========================
# 1) Stage Build
# =========================
FROM node:22.19.0-bullseye AS builder
WORKDIR /app
COPY .env.prod .env
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# =========================
# 2) Stage Runtime
# =========================
FROM node:22.19.0-alpine AS runner
WORKDIR /app

# Copier package.json et lockfile pour installer seulement les deps nécessaires
COPY package*.json ./

# Installer uniquement les deps de prod
RUN npm ci --omit=dev --cache /tmp/empty-cache && rm -rf /tmp/empty-cache

# Copier uniquement ce qui est nécessaire pour exécuter
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/.env ./.env
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]