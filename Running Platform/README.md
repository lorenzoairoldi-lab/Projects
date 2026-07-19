# 🏃 Running Platform

Piattaforma per runner con 3 microservizi backend, frontend **React + Vite**, cache **Redis**, **Docker Compose** e **Nginx**.

## Architettura

```
                         NGINX (porta 80)
                      /         |          \
              /auth/* /profiles/*  /workouts/*   /stats/*
                   |                |              |
           Auth Service          Workout         Stats
           (porta 3001)         Service          Service
               |                (porta 3002)        |
           PostgreSQL           PostgreSQL        PostgreSQL
                                                    |
                                                  Redis
```

## Struttura

```
running-platform/
├── services/
│   ├── auth-service/          # Registrazione, login, profilo
│   ├── workout-service/       # CRUD allenamenti
│   └── stats-service/         # Statistiche, personal best, progresso
│       └── src/app.js         # Circuit Breaker su chiamata → workout-service
├── frontend/                  # React + Vite
├── nginx/                     # Reverse proxy
├── docker-compose.yml
└── .env
```

## Tecnologie

| Livello | Tecnologia |
|---------|-----------|
| Backend | Node.js + Express |
| Frontend | React + Vite + Axios |
| Database | PostgreSQL (un DB per servizio) |
| Cache | Redis |
| Auth | JWT (access 15min + refresh 7gg, bcrypt) |
| Infra | Docker Compose + Nginx |

## Pattern implementati

- **Dependency Injection** — ogni servizio esporta `createApp(deps)`. In produzione usa i moduli reali, nei test riceve mock.
- **Repository Pattern** — le query DB sono isolate in factory (`createQueries(pool)`), il pool viene iniettato.
- **Circuit Breaker** — stats-service chiama workout-service via `cockatiel`. Dopo 3 fallimenti consecutivi il circuito si apre per 15s, evitando chiamate inutili. Fallback: dati cached o array vuoto.

## Test

Framework: **Vitest + Supertest** (39 test totali, nessuna dipendenza esterna nei test).

```bash
# Tutti i servizi
cd services/workout-service && npm test   # 8 test
cd services/auth-service   && npm test   # 17 test
cd services/stats-service  && npm test   # 14 test
```

## Avvio

```bash
docker compose up --build    # prima volta
docker compose up            # volte successive
```

Apri [http://localhost](http://localhost) per il frontend.

## API

### Auth (3001)
```
POST /auth/register    { email, password, name }
POST /auth/login       { email, password }
POST /auth/refresh     { refreshToken }
POST /auth/logout      Bearer + { refreshToken }
GET  /auth/me          Bearer
GET  /profiles/me      Bearer
PUT  /profiles/me      Bearer + { bio, weightKg, heightCm, experienceLevel }
```

### Workout (3002)
```
POST   /workouts       Bearer + { distanceKm, durationMin, elevationM?, notes? }
GET    /workouts       Bearer (?page=1&limit=20&from=&to=)
GET    /workouts/:id   Bearer
PUT    /workouts/:id   Bearer + { distanceKm?, durationMin?, ... }
DELETE /workouts/:id   Bearer
```

### Stats (3003)
```
GET /stats/weekly         Bearer (?weeks=4)
GET /stats/monthly        Bearer (?months=3)
GET /stats/personal-bests Bearer
GET /stats/progress       Bearer (?metric=distance&period=monthly)
POST /stats/ingest        Bearer + { action, workout }
```
