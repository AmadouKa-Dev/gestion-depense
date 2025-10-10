# =========================
# 1) Stage Dependencies
# =========================
FROM node:22.19.0-alpine AS deps
WORKDIR /app

# Copier uniquement les fichiers de dépendances
COPY package.json package-lock.json* ./
RUN npm ci --only=production && \
    npm cache clean --force

# =========================
# 2) Stage Build
# =========================
FROM node:22.19.0-alpine AS build
WORKDIR /app

# Copier les dépendances depuis le stage précédent
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build de l'application
RUN npm run build

# =========================
# 3) Stage Runtime
# =========================
FROM node:22.19.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copier les node_modules de production uniquement
COPY --from=deps /app/node_modules ./node_modules

# Copier les fichiers de config et package
COPY --from=build /app/next.config.ts ./
COPY --from=build /app/package.json ./

# Copier le build Next.js
COPY --from=build /app/.next ./.next

EXPOSE 3000

CMD ["npm", "start"]