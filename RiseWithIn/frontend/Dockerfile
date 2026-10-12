# syntax=docker/dockerfile:1

# RiseWithin - Frontend
#
# Immagine multi-stage per l'applicazione web:
#   1. builder installa le dipendenze e genera gli asset statici con Vite;
#   2. production pubblica gli asset tramite Nginx eseguito senza privilegi.

# -----------------------------------------------------------------------------
# FASE 1 - BUILD DEL FRONTEND
# -----------------------------------------------------------------------------
FROM node:22.18-alpine AS builder

WORKDIR /app

# Copia prima i manifest del monorepo per conservare la cache delle dipendenze
# quando cambiano soltanto i sorgenti dell'applicazione.
COPY package*.json ./
COPY api-gateway/package.json api-gateway/package.json
COPY frontend/package.json frontend/package.json
COPY services services

# Installa il workspace frontend, incluse le dipendenze di sviluppo necessarie
# a Vite, e rimuove la cache npm dalla relativa immagine intermedia.
RUN npm ci --workspace=@risewithin/frontend && \
    npm cache clean --force

# Copia i sorgenti soltanto dopo l'installazione delle dipendenze.
COPY frontend ./frontend

# Permette di configurare a build time l'endpoint GraphQL incorporato nel bundle.
ARG VITE_GRAPHQL_URL=/graphql
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL

# Genera gli asset statici ottimizzati nella directory frontend/dist.
RUN npm run build --workspace=@risewithin/frontend

# -----------------------------------------------------------------------------
# FASE 2 - SERVER WEB DI PRODUZIONE
# -----------------------------------------------------------------------------
# Questa variante di Nginx usa un utente non privilegiato e ascolta sulla 8080.
FROM nginxinc/nginx-unprivileged:1.27.4-alpine3.21 AS production

# Copia soltanto il risultato della build e la configurazione Nginx dedicata.
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

# Verifica che Nginx risponda tramite l'endpoint leggero /health.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O - http://127.0.0.1:8080/health || exit 1
