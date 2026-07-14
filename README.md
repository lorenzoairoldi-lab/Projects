# 🏃 Running Platform

Piattaforma per runner con architettura a **3 microservizi**, frontend **React + Vite**, cache **Redis** e documentazione **Swagger/OpenAPI**. Orchestrato con **Docker Compose** e **Nginx**.

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

## Struttura del progetto

```
running-platform/
│
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── app.js           # Express + route
│   │   │   ├── database.js      # Pool PostgreSQL
│   │   │   ├── queries.js       # Query SQL
│   │   │   ├── middleware.js    # JWT auth
│   │   │   └── swagger.json     # Documentazione
│   │   ├── migrations/init.sql
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── workout-service/
│   │   └── src/
│   │       ├── app.js
│   │       ├── database.js
│   │       ├── queries.js
│   │       ├── middleware.js
│   │       └── swagger.json
│   │
│   └── stats-service/
│       └── src/
│           ├── app.js
│           ├── database.js
│           ├── queries.js
│           ├── redis.js         # Cache Redis
│           ├── middleware.js
│           └── swagger.json
│
├── frontend/
│   └── src/
│       ├── api.js               # Chiamate API con axios
│       ├── App.jsx              # Router
│       ├── Login.jsx            # Login + register
│       ├── Workouts.jsx         # Lista + form allenamenti
│       ├── Dashboard.jsx        # Statistiche + grafico
│       └── main.jsx             # Entry point Vite
│
├── nginx/
│   └── default.conf             # Reverse proxy
├── docker-compose.yml           # Orchestrazione
├── .env                         # Variabili sensibili
└── README.md
```

**Totale: ~38 file**

## Avvio

```bash
# Prima volta
docker compose up --build

# Volte successive
docker compose up
```

Apri [http://localhost](http://localhost) per il frontend.

## API

### Auth (3001)
```
POST /auth/register    { email, password, name }
POST /auth/login       { email, password }
POST /auth/refresh     { refreshToken }
GET  /auth/me          Bearer
GET  /profiles/me      Bearer
PUT  /profiles/me      Bearer + { bio, weightKg, heightCm }
```

### Workout (3002)
```
POST   /workouts       Bearer + { distanceKm, durationMin }
GET    /workouts       Bearer (?page=1&limit=20)
GET    /workouts/:id   Bearer
DELETE /workouts/:id   Bearer
```

### Stats (3003)
```
GET /stats/weekly         Bearer (?weeks=4)
GET /stats/monthly        Bearer (?months=3)
GET /stats/personal-bests Bearer
GET /stats/progress       Bearer (?metric=distance&period=monthly)
```

### Swagger
```
/swagger.json per ogni servizio
```

## Tecnologie

- **Backend:** Node.js + Express + PostgreSQL
- **Frontend:** React + Vite + Axios
- **Infra:** Docker Compose + Nginx + Redis
- **Auth:** JWT (access 15min + refresh 7gg, bcrypt)
- **Documentazione:** OpenAPI 3.0 (Swagger)

## Prossimi sviluppi

- [ ] Test automatici (Jest + Supertest)
- [ ] CI/CD con GitHub Actions
- [ ] Deploy su VPS
- [ ] Rate limiting sulle API
- [ ] Grafici interattivi con Recharts
- [ ] Email di conferma registrazione
- [ ] Dashboard admin
