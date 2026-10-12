# RiseWithin

Piattaforma per abitudini, obiettivi, routine, concentrazione e community.

## Come funziona

```text
Browser → Frontend React → API Gateway GraphQL → Microservizi → Database
                                      ├→ Redis (cache)
                                      └→ RabbitMQ (eventi)
```

Il Gateway è il portone unico; i microservizi sono uffici separati per auth, utenti, abitudini, obiettivi, routine, focus, contenuti, community, pagamenti e notifiche.

## Componenti

- **GraphQL/Apollo**: API unica e dati richiesti dal frontend.
- **PostgreSQL/MongoDB**: dati permanenti.
- **Redis**: cache veloce con TTL `REDIS_CACHE_TTL` (default 60 secondi). Se Redis non funziona, si usa il database.
- **RabbitMQ**: coda per eventi asincroni e notifiche.
- **Pino**: diario tecnico; i log si leggono con `docker compose logs -f`.
- **Prometheus**: raccoglie metriche da `/metrics`, richieste e latenza.
- **Grafana**: mostra le metriche con grafici.
- **Docker/Kubernetes**: eseguono e riavviano i servizi.
- **HPA**: aumenta o riduce le repliche usando CPU e memoria; Prometheus Adapter abiliterà richieste/latenza.

## Avvio locale

Prerequisiti: Docker Desktop, Compose v2, Node.js 22+.

```powershell
git clone https://github.com/lorenzoairoldi-lab/Projects.git
cd Projects/RiseWithIn
Copy-Item .env.example .env
# Configurare .env con i propri valori prima di avviare i servizi.
docker compose up --build -d
docker compose ps
docker compose logs -f api-gateway
```

App `http://localhost:3000` · GraphQL `http://localhost:4000/graphql` · Prometheus `http://localhost:9090` · Grafana `http://localhost:3001` · RabbitMQ `http://localhost:15672`.

## Test e CI/CD

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
docker compose config --quiet
```

Il workflow di esempio in `.github/workflows/ci-cd.yaml` definisce test, lint, build e `npm audit`, che controlla vulnerabilità note nelle dipendenze. In questo repository il progetto è in una sottocartella: il workflow è conservato come riferimento e non viene eseguito automaticamente. Per attivarlo occorre portarlo nella cartella `.github/workflows` alla radice del repository e adattare percorsi, branch e configurazione di deploy.

## Kubernetes

```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmaps
kubectl apply -f k8s/services
kubectl apply -f k8s/deployments
kubectl apply -f k8s/hpa.yaml
kubectl get pods,hpa -n risewithin
kubectl logs -f deployment/api-gateway -n risewithin
```

Prometheus è definito nei manifest `k8s/*/prometheus.yaml`. Prometheus Adapter richiede Helm; la guida è `docs/prometheus-adapter.md`.

## Sicurezza

JWT verificati; password con bcrypt; refresh token hashati e ruotati; Helmet, CORS, rate limit, query parametrizzate, autorizzazioni e container non-root. In produzione usare secret manager, TLS, NetworkPolicy, MFA, backup cifrati e scansione immagini.

## Struttura

`api-gateway/` gateway · `services/` microservizi · `shared/` codice comune · `frontend/` React · `k8s/` Kubernetes · `monitoring/` Prometheus/Grafana · `docs/` guide.

## Prossimi passi

Loki per centralizzare i log, alert, Prometheus Adapter, autoscaling su richieste/latenza e test di carico.
