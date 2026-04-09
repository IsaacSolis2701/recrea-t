# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Production stage ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Only copy what's needed to run
COPY package*.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY --from=builder /app/dist ./dist

# Uploads folder (ephemeral for demo — mount a volume in prod)
RUN mkdir -p server/uploads

EXPOSE 4000

CMD ["node", "server/index.js"]
