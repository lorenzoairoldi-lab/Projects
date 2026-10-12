# RiseWithin — Security readiness review

Data revisione: 20 agosto 2026. Ambito: codice JavaScript/React/Express/GraphQL, configurazione Docker, Kubernetes e CI/CD presente nel repository. Non include penetration test runtime, configurazione effettiva del cloud, del cluster, dei database gestiti o dell'Ingress Controller.

## Executive summary

RiseWithin possiede una base difensiva sensata: query SQL parametrizzate, UUID, validazione Zod in molte mutation, bcrypt cost 12, refresh token hashati e ruotati, CSP e header browser, webhook Stripe firmato, container non-root, capability drop e azioni GitHub pin-nate per SHA.

Non è tuttavia ancora pronta per conservare dati e pagamenti di utenti reali. Le priorità sono: correggere il bypass dei contenuti premium; rendere affidabile la fonte delle autorizzazioni di piano; rafforzare login/sessioni; limitare costo e profondità GraphQL; isolare i microservizi con NetworkPolicy e identità service-to-service; spostare tutte le credenziali in un secret manager; aggiungere controlli di supply chain e procedure operative per backup, audit e incident response.

## High priority

### RW-SEC-001 — Il corpo dei contenuti premium è leggibile dalla lista pubblica

- **Severity:** High
- **Location:** `services/content-service/src/schema.js:1`; `services/content-service/src/resolvers.js:1`; `services/content-service/src/models/contentModel.js:1`
- **Evidence:** `Content` espone `body`; `contents` non richiede autenticazione o piano e `contentModel.list()` restituisce i documenti completi. Il controllo Premium esiste soltanto nella query singola `content(slug)`.
- **Impact:** un client anonimo può richiedere `contents { items { premium body } }` e leggere materiale a pagamento senza abbonamento.
- **Fix:** la lista deve restituire solo metadati/preview oppure il resolver di `Content.body` deve verificare centralmente il piano. Aggiungere test di autorizzazione per anonimo, Free, Pro e Premium.
- **Mitigation:** proiezione Mongo che escluda `body` per la lista.
- **False positive notes:** nessuna; il bypass è direttamente rappresentato dallo schema e dal resolver.

### RW-SEC-002 — Le autorizzazioni di abbonamento non hanno una fonte affidabile e sincronizzata

- **Severity:** High
- **Location:** `services/auth-service/src/tokens.js:9-12`; `services/auth-service/src/models/authModel.js:4-7`; `services/subscription-service/src/index.js:21-34`; `shared/auth.js:24-31`
- **Evidence:** il piano usato da `requirePlan` arriva dal claim JWT; il token è emesso usando `users.plan` dell'auth DB. Il webhook aggiorna soltanto il subscription DB e pubblica `subscription.updated`, ma auth-service non consuma quell'evento.
- **Impact:** gli entitlement possono essere errati. Attualmente un cliente pagante può restare Free; con sincronizzazione parziale un downgrade/cancel può conservare l'accesso fino alla scadenza del token o più a lungo.
- **Fix:** definire un'unica fonte di verità; aggiornare auth in modo idempotente da eventi autenticati oppure fare introspection/token exchange per le operazioni premium. Introdurre `tokenVersion`/session version e revoca immediata sui downgrade.
- **Mitigation:** access token molto breve e controllo diretto dello stato subscription sulle operazioni economicamente sensibili.
- **False positive notes:** verificare se la sincronizzazione viene fornita esternamente; non è presente nel repository.

### RW-SEC-003 — Difese anti-account-takeover insufficienti

- **Severity:** High
- **Location:** `services/auth-service/src/resolvers.js:9-40`; `shared/server.js:21-22`; `api-gateway/src/index.js:17-18`
- **Evidence:** esiste soltanto un limite HTTP generico, in memoria e per replica (`200`/min sui servizi, `300`/min sul gateway). Non risultano rate limit dedicati a login/registrazione/refresh, contatori Redis per account+IP, email verification, recupero password, MFA, controllo password compromesse o revoca di tutte le sessioni.
- **Impact:** credential stuffing, brute force e takeover di account con dati personali e billing.
- **Fix:** rate limiter distribuito Redis per IP e identità normalizzata, backoff progressivo, verifica email, reset password con token monouso hashato e breve, MFA/passkey opzionale, session management e revoca globale.
- **Mitigation:** WAF/CDN rate limiting e alert su pattern di login anomali.
- **False positive notes:** controlli esterni WAF/IdP non sono visibili nel repository.

### RW-SEC-004 — GraphQL non limita profondità, alias e costo delle query

- **Severity:** High
- **Location:** `api-gateway/src/index.js:21-32`; `shared/server.js:27-36`; `services/habits-service/src/resolvers.js:21-27`; `services/goals-service/src/resolvers.js:2-3`
- **Evidence:** non esistono validation rule per depth/complexity, timeout di operazione o allowlist di documenti. La trasformazione delle liste genera query DB addizionali per ogni habit/goal, amplificabili con alias in una singola richiesta HTTP.
- **Impact:** un utente o bot può causare consumo elevato di CPU/database e degradare tutti i servizi aggirando il semplice limite per richiesta HTTP.
- **Fix:** limite di profondità e costo, massimale alias/root fields, timeout e cancellation, persisted operations in produzione, DataLoader/batching e budget per utente.
- **Mitigation:** limiti Ingress/WAF, timeout upstream e statement timeout sui database.
- **False positive notes:** eventuali limiti dell'Ingress non sostituiscono l'analisi del costo GraphQL e non sono configurati qui.

## Medium priority

### RW-SEC-005 — Sessione browser ancora incompleta

- **Severity:** Medium
- **Location:** `services/auth-service/src/schema.js:5-11`; `frontend/src/store/auth.js:3-10`; `frontend/src/graphql/client.js:1`
- **Evidence:** access e refresh token vengono restituiti a JavaScript e tenuti in memoria. Questo evita localStorage, ma un XSS attivo può leggerli e un reload elimina la sessione; non c'è rinnovo automatico sicuro.
- **Impact:** furto token durante un XSS e UX/session lifecycle non adatto a un prodotto reale.
- **Fix:** refresh token in cookie `HttpOnly`, `Secure`, `SameSite` con rotazione/reuse detection; access token breve solo in memoria. Se si passa ai cookie, aggiungere protezione CSRF e verifica Origin. Valutare un BFF.
- **Mitigation:** mantenere CSP stretta e TTL access token breve.
- **False positive notes:** un'architettura puramente bearer può restare valida, ma richiede un flusso OAuth browser hardened e una strategia di persistenza esplicita.

### RW-SEC-006 — Validazione JWT e gestione chiavi da irrobustire

- **Severity:** Medium
- **Location:** `shared/auth.js:4-12`; `services/auth-service/src/resolvers.js:35-38`; `services/auth-service/src/tokens.js:8-12`
- **Evidence:** la verifica controlla issuer ma non audience né un allowlist esplicito di algoritmi. Il refresh resolver usa ancora un fallback hard-coded invece di `requiredSecret`. Tutti i servizi condividono una chiave HMAC capace anche di firmare token.
- **Impact:** errori di configurazione e compromissione di un singolo servizio aumentano il raggio d'impatto sull'intera piattaforma.
- **Fix:** chiavi asimmetriche, `kid` e JWKS con rotazione; verificare `iss`, `aud`, algoritmo, tipo token e claim richiesti. Solo auth-service deve possedere la chiave privata.
- **Mitigation:** chiavi HMAC distinte e ruotate, montate solo dove indispensabile.
- **False positive notes:** la firma attuale impedisce token arbitrari finché il secret rimane forte e non viene esposto.

### RW-SEC-007 — Mancano isolamento di rete e autenticazione service-to-service

- **Severity:** Medium
- **Location:** `k8s/` (nessun `NetworkPolicy`); `api-gateway/src/resolvers.js:1`; `shared/server.js:36`
- **Evidence:** qualunque pod raggiungibile nel cluster può contattare i subgraph; il gateway inoltra direttamente il bearer dell'utente e non esiste mTLS o identità workload.
- **Impact:** un pod compromesso può muoversi lateralmente, interrogare servizi interni e pubblicare/consumare eventi.
- **Fix:** default-deny ingress/egress, allowlist gateway→subgraph e servizi→DB/Redis/RabbitMQ/DNS; mTLS/service mesh o token service-to-service con audience specifica.
- **Mitigation:** segmentazione per namespace e policy del cloud firewall.
- **False positive notes:** un service mesh esterno potrebbe applicare policy non presenti nel repository.

### RW-SEC-008 — Secret e cifratura dei collegamenti infrastrutturali incompleti

- **Severity:** Medium
- **Location:** `k8s/configmaps/platform-config.yaml:8-9`; `k8s/secrets/platform-secrets.example.yaml:5-21`; `shared/postgres.js:4-7`; `shared/mongo.js:4-9`; `shared/redis.js:4-9`
- **Evidence:** la password RabbitMQ è in una ConfigMap; Secret Kubernetes standard e variabili ambiente sono l'unico meccanismo mostrato. Le connessioni interne usano URI plaintext e non impostano TLS/verifica CA.
- **Impact:** esposizione credenziali tramite lettura ConfigMap/env o intercettazione nella rete interna; accesso a dati e code.
- **Fix:** secret manager esterno/CSI, encryption-at-rest di etcd, RBAC minimo, rotazione; TLS verificato verso PostgreSQL, MongoDB, Redis e RabbitMQ.
- **Mitigation:** database gestiti con private endpoints e policy di rete.
- **False positive notes:** TLS/encryption potrebbero essere forzati dai servizi gestiti esterni, ma non sono dimostrati dalla configurazione.

### RW-SEC-009 — CI/CD senza security gates di supply chain

- **Severity:** Medium
- **Location:** `.github/workflows/ci-cd.yaml:17-116`; `package-lock.json`
- **Evidence:** CI esegue test/build ma non SAST, dependency review, secret scanning, image scan, SBOM, firma o attestazione. L'audit locale rileva 20 advisory moderate transitive Apollo/OpenTelemetry/uuid.
- **Impact:** dipendenze o immagini vulnerabili possono arrivare in produzione senza blocco o tracciabilità; un'immagine pubblicata non è verificata crittograficamente al deploy.
- **Fix:** CodeQL/Semgrep, dependency-review, Gitleaks, Trivy/Grype, SBOM CycloneDX/SPDX, firma Cosign e verifica admission; Dependabot/Renovate e policy su severity.
- **Mitigation:** branch protection, reviewer obbligatori e ambienti protetti.
- **False positive notes:** GitHub Advanced Security o scanner registry potrebbero essere abilitati fuori dal repository.

### RW-SEC-010 — Mancano controlli operativi e ciclo di vita dei dati

- **Severity:** Medium
- **Location:** repository-wide; `monitoring/`; `README.md:125-132`
- **Evidence:** sono presenti metriche e dashboard, ma non alert rule, audit trail di login/billing/azioni privilegiate, redazione PII, retention, export/cancellazione account, backup cifrati con restore testato o runbook incident response.
- **Impact:** rilevamento tardivo di compromissioni, recupero incerto e gestione incompleta di dati personali.
- **Fix:** audit log immutabile e senza segreti, alerting, retention per tipo dato, delete/export account, backup cifrati e restore drill, incident-response playbook e rotazione credenziali.
- **Mitigation:** abilitare audit e backup del provider prima del primo utente reale.
- **False positive notes:** controlli cloud esterni non sono visibili nel repository.

## Low / hardening

### RW-SEC-011 — Hardening Kubernetes e disponibilità da completare

- **Severity:** Low
- **Location:** `k8s/namespace.yaml:1-5`; `k8s/deployments/*.yaml`; assenza di PDB e policy admission
- **Evidence:** i pod hanno buoni securityContext, ma il namespace non applica Pod Security Admission `restricted`; mancano PodDisruptionBudget, topology spread, LimitRange/ResourceQuota e immagini per digest.
- **Impact:** minore difesa contro configurazioni future insicure e maggiore rischio operativo durante manutenzioni/rollout.
- **Fix:** etichette PSA restricted, policy admission, PDB/topology spread, quote e digest immutabili.
- **Mitigation:** enforcement equivalente tramite policy engine del cluster.
- **False positive notes:** policy cluster-wide potrebbero già esistere.

### RW-SEC-012 — Abuse prevention della community non implementata

- **Severity:** Low
- **Location:** `services/community-service/src/resolvers.js:1`; `services/community-service/src/models/communityModel.js:1`
- **Evidence:** limiti di lunghezza sono presenti, ma non risultano report/block, moderazione, anti-spam per utente, limiti messaggi o protezione da molestie.
- **Impact:** spam, abuso della messaggistica e rischio per utenti/community operations.
- **Fix:** rate limit per utente e relazione, report/block, moderazione, audit e workflow di risposta.
- **Mitigation:** feature flag/invite-only durante beta.
- **False positive notes:** può essere accettabile per una demo privata, non per una community pubblica.

## Ordine di remediation consigliato

1. RW-SEC-001 e RW-SEC-002: chiudere bypass premium e rendere coerenti gli entitlement.
2. RW-SEC-003, RW-SEC-005 e RW-SEC-006: completare account security e sessioni.
3. RW-SEC-004: proteggere GraphQL da query costose e testare authorization/BOLA.
4. RW-SEC-007 e RW-SEC-008: isolamento Kubernetes, identità interna e secret management.
5. RW-SEC-009 e RW-SEC-010: security gates, audit, backup e incident response.
6. Penetration test autenticato, test DAST in staging e verifica runtime di TLS/header/policy prima del go-live.
