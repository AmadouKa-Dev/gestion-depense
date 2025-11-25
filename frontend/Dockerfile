# =========================
# 1) Stage Dependencies
# =========================
FROM node:22.19.0-alpine AS deps

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installation des dépendances de production et dev (nécessaires pour le build)
RUN npm ci

# =========================
# 2) Stage Build
# =========================
FROM node:22.19.0-alpine AS build

WORKDIR /app

# Copier les node_modules depuis deps
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build de l'application
RUN npm run build

# =========================
# 3) Stage Runtime
# =========================
FROM node:22.19.0-alpine AS runner

WORKDIR /app

# Copier uniquement les dépendances de PRODUCTION
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]