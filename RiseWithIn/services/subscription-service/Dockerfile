# syntax=docker/dockerfile:1

# RiseWithin - subscription-service
#
# Immagine multi-stage per il microservizio Node.js:
#   1. dependencies installa soltanto le dipendenze necessarie in produzione;
#   2. production contiene dipendenze e sorgenti minimi per l'esecuzione.

# -----------------------------------------------------------------------------
# FASE 1 - DIPENDENZE DI PRODUZIONE
# -----------------------------------------------------------------------------
FROM node:22.18-alpine AS dependencies

WORKDIR /app

# Copia i manifest del monorepo prima dei sorgenti per sfruttare la cache Docker
# quando il codice cambia ma le dipendenze rimangono invariate.
COPY package*.json ./
COPY api-gateway/package.json api-gateway/package.json
COPY frontend/package.json frontend/package.json
COPY services services

# Installa soltanto il workspace corrente, esclude le dipendenze di sviluppo e
# rimuove la cache npm per non trasferire file inutili nello stage successivo.
RUN npm ci --omit=dev --workspace=@risewithin/subscription-service && \
    npm cache clean --force

# -----------------------------------------------------------------------------
# FASE 2 - IMMAGINE DI PRODUZIONE
# -----------------------------------------------------------------------------
FROM node:22.18-alpine AS production

# Imposta l'ambiente Node.js e la porta interna utilizzata dal microservizio.
ENV NODE_ENV=production \
    PORT=4009

WORKDIR /app

# Crea un utente non privilegiato con UID/GID stabili. Le istruzioni COPY
# assegnano direttamente a questo utente la proprietà dei file applicativi.
RUN addgroup -S app -g 1001 && \
    adduser -S app -u 1001 -G app

# Importa dallo stage precedente le dipendenze di produzione già installate.
COPY --from=dependencies --chown=app:app /app/node_modules ./node_modules

# Copia esclusivamente il codice condiviso e il microservizio corrente.
COPY --chown=app:app shared ./shared
COPY --chown=app:app services/subscription-service ./services/subscription-service

# Da questo punto il container viene eseguito senza privilegi di root.
USER app

EXPOSE 4009

# Docker considera il container healthy quando l'endpoint /health risponde
# correttamente sulla porta locale del servizio.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q -O - http://127.0.0.1:4009/health || exit 1

# Avvia Node.js direttamente come PID 1 per gestire correttamente i segnali.
CMD ["node", "services/subscription-service/src/index.js"]
