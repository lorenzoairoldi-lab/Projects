# 🏃 Running Platform

[![CI](https://github.com/lorenzoairoldi-lab/Projects/actions/workflows/ci.yml/badge.svg)](https://github.com/lorenzoairoldi-lab/Projects/actions/workflows/ci.yml)

Piattaforma per runner con 3 microservizi backend, frontend **React + Vite + Tailwind CSS v4**, cache **Redis**, **Docker Compose** e **Nginx**.

## Architettura

```
                         NGINX (porta 80)
                      /         |          \
              /api/auth  /api/workouts   /api/stats
              /api/profiles    |              |
                   |           |              |
           Auth Service     Workout        Stats Service
           (porta 3001)    Service          (porta 3003)
               |           (porta 3002)         |
           PostgreSQL      PostgreSQL        PostgreSQL
                                                 |
                                               Redis
```

Tutti i servizi comunicano attraverso la rete Docker `running-platform-net`.

## Struttura

```
running-platform/
├── services/
│   ├── auth-service/          # Registrazione, login, profilo, refresh token
│   │   └── src/__tests__/     # 17 test Vitest
│   ├── workout-service/       # CRUD allenamenti con paginazione e filtri data
│   │   └── src/__tests__/     # 8 test Vitest
│   └── stats-service/         # Statistiche, personal best, progresso
│       └── src/__tests__/     # 14 test Vitest
├── frontend/                  # React + Vite + Tailwind CSS v4
│   └── src/
│       ├── App.jsx            # Routing, login/register, layout protetto
│       ├── Workouts.jsx       # CRUD allenamenti con paginazione
│       ├── Dashboard.jsx      # Grafici, statistiche, personal best
│       ├── Profile.jsx        # Profilo utente modificabile
│       ├── Toast.jsx          # Sistema di notifiche toast
│       └── api.js             # Client Axios con refresh token automatico
├── nginx/
│   └── default.conf           # Reverse proxy upstream per ogni servizio
├── docker-compose.yml
└── .env
```

## Tecnologie

| Livello | Tecnologia |
|---------|-----------|
| Backend | Node.js + Express |
| Frontend | React 18 + Vite + React Router + Axios |
| Styling | Tailwind CSS v4 + PostCSS + `@tailwindcss/forms` |
| Grafici | Recharts (bar chart dashboard) |
| Database | PostgreSQL 16 Alpine (un DB per servizio) |
| Cache | Redis 7 Alpine |
| Auth | JWT (access 15min + refresh 7gg, bcrypt, refresh token rotation) |
| Test | Vitest + Supertest (39 test totali, mock delle dipendenze) |
| Infra | Docker Compose + Nginx (rete esplicita `running-platform-net`) |

## Pattern implementati

- **Dependency Injection** — ogni servizio esporta `createApp(deps)`. In produzione usa i moduli reali, nei test riceve mock (pool, queries, bcrypt, jwt, cockatiel...).
- **Repository Pattern** — le query DB sono isolate in factory `createQueries(pool)`, il pool viene iniettato dall'esterno.
- **Circuit Breaker** — stats-service chiama workout-service via `cockatiel`. Dopo 3 fallimenti consecutivi il circuito si apre per 15s, evitando chiamate inutili. Fallback: dati cached o array vuoto.
- **Refresh Token Rotation** — alla scadenza dell'access token (15 min), il client tenta automaticamente il refresh con rotazione del token. Se il refresh fallisce, redirect al login.
- **Toast Notifications** — feedback utente context-based per operazioni CRUD (success/error) con auto-dismiss.
- **Reti Docker esplicite** — rete bridge `running-platform-net` dichiarata e assegnata a ogni container.

## Frontend — Single Page Application

Il frontend è una SPA React con routing lato client:

| Pagina | Route | Descrizione |
|--------|-------|-------------|
| Login / Register | `/login` | Autenticazione con toggle login/register |
| Workouts | `/workouts` | CRUD allenamenti con tabella, paginazione, editing inline |
| Dashboard | `/dashboard` | Grafico settimanale (Recharts), tabelle mensili, personal best, barra progresso |
| Profile | `/profile` | Modifica profilo: bio, peso, altezza, livello esperienza |
| Protezione | — | `Protected` wrapper: redirect a `/login` se non autenticato |

**Client API (`api.js`):**
- Interceptor request: injecta automaticamente `Bearer` token
- Interceptor response: 401 → tenta refresh token con rotazione → fallback a logout + redirect `/login`
- Funzioni per ogni endpoint: login, register, logout, getProfile, updateProfile, CRUD workouts, stats

## Test

Framework: **Vitest + Supertest** (nessuna dipendenza esterna nei test — tutti i moduli sono mockati).

```bash
# Tutti i servizi (39 test totali)
cd services/auth-service   && npm test   # 17 test
cd services/workout-service && npm test  # 8 test
cd services/stats-service  && npm test   # 14 test
```

### Auth Service — 17 test
- `POST /auth/register` — creazione utente, errore se email già registrata, validazione campi
- `POST /auth/login` — login valido, password errata, utente inesistente
- `POST /auth/refresh` — refresh valido, token scaduto/invalido, riutilizzo (rotation)
- `POST /auth/logout` — revoca refresh token
- `GET /auth/me` — profilo utente autenticato
- `GET /profiles / PUT /profiles` — lettura e aggiornamento profilo

### Workout Service — 8 test
- `POST /workouts` — creazione, validazione campi (required, positivi), pace automatico, campi opzionali
- `GET /workouts` — paginazione
- `GET /workouts/:id` — singolo workout, 404 se inesistente
- `PUT /workouts/:id` — aggiornamento, validazione campi vuoti
- `DELETE /workouts/:id` — cancellazione, 404 se inesistente

### Stats Service — 14 test
- `GET /stats/weekly` — statistiche settimanali, parametro `weeks`
- `GET /stats/monthly` — statistiche mensili, parametro `months`
- `GET /stats/personal-bests` — migliori risultati per metrica
- `GET /stats/progress` — progresso con metriche e periodi diversi
- `POST /stats/ingest` — ingest con azioni create/update/delete
- Circuit Breaker — test apertura dopo 3 fallimenti consecutivi e reset

## Avvio

```bash
docker compose up --build    # prima volta
docker compose up            # volte successive
```

Apri [http://localhost](http://localhost) per il frontend.

## API

### Auth Service (3001)
```
POST /auth/register    { email, password, name }
POST /auth/login       { email, password }
POST /auth/refresh     { refreshToken }
POST /auth/logout      Bearer + { refreshToken }
GET  /auth/me          Bearer
GET  /profiles/me      Bearer
PUT  /profiles/me      Bearer + { bio, weightKg, heightCm, experienceLevel }
```

### Workout Service (3002)
```
POST   /workouts        Bearer + { date, distanceKm, durationMin, elevationM?, notes? }
GET    /workouts        Bearer (?page=1&limit=20&from=&to=)
GET    /workouts/:id    Bearer
PUT    /workouts/:id    Bearer + { distanceKm?, durationMin?, elevationM?, notes? }
DELETE /workouts/:id    Bearer
```

### Stats Service (3003)
```
GET  /stats/weekly          Bearer (?weeks=4)
GET  /stats/monthly         Bearer (?months=3)
GET  /stats/personal-bests  Bearer
GET  /stats/progress        Bearer (?metric=distance&period=monthly)
POST /stats/ingest          Bearer + { action, workout }
```

## DevOps

### Docker Compose

9 container orchestrati con rete esplicita:

| Container | Ruolo | Dipende da |
|-----------|-------|------------|
| `auth-db` | PostgreSQL auth | — |
| `workout-db` | PostgreSQL workout | — |
| `stats-db` | PostgreSQL stats | — |
| `redis` | Cache Redis | — |
| `auth-service` | Backend auth | auth-db (healthy) |
| `workout-service` | Backend workout | workout-db (healthy) |
| `stats-service` | Backend stats | stats-db, redis, workout-service |
| `nginx` | Reverse proxy | auth-service, workout-service, stats-service |
| `frontend` | React SPA | — (servito tramite nginx) |

### Nginx

Routing configurabile via `nginx/default.conf`:
- `/api/auth/*` → auth-service
- `/api/profiles/*` → auth-service
- `/api/workouts/*` → workout-service
- `/api/stats/*` → stats-service
- `/*` → frontend (SPA — supporta HMR/WebSocket)

## CI/CD — GitHub Actions

Il progetto usa **GitHub Actions** per integrazione continua (CI) e delivery continua (CD).

### CI (test — su ogni push e PR)
```
├── Test Auth Service    → 17 test Vitest
├── Test Workout Service →  8 test Vitest
├── Test Stats Service   → 14 test Vitest
└── Build Frontend       → verifica che il bundle Vite compili
```
Tutti i job girano in parallelo (~30s). I lockfile sono cachati per installazioni rapide.

### CD (Docker — solo su push a `master`)
Dopo che tutti i test passano:
- Builda le 4 immagini Docker (auth-service, workout-service, stats-service, frontend)
- Le pubblica su **GitHub Container Registry (GHCR)**
- Ogni immagine taggata con SHA del commit + `latest`

### Badge
```markdown
[![CI](https://github.com/lorenzoairoldi-lab/Projects/actions/workflows/ci.yml/badge.svg)](https://github.com/lorenzoairoldi-lab/Projects/actions/workflows/ci.yml)
```

## Variabili d'ambiente (`.env`)

```env
AUTH_DB_PASSWORD=auth_secret_123
WORKOUT_DB_PASSWORD=workout_secret_456
STATS_DB_PASSWORD=stats_secret_789
JWT_SECRET=super-secret-jwt-key-change-in-production
AUTH_PORT=3001
WORKOUT_PORT=3002
STATS_PORT=3003
```
