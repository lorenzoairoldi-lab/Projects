# Projects

Personal projects by **Lorenzo Airoldi**, exploring full-stack development, microservices, cloud infrastructure and DevOps through practical applications.

Each project includes its own source code, documentation and infrastructure configuration.

[View my portfolio](https://lorenzoairoldi-lab.github.io/Portfolio/#projects)

## Projects

| Project | Overview | Main technologies |
|---------|----------|-------------------|
| [RiseWithin](./RiseWithIn/) | Personal growth platform for habits, goals, routines, focus sessions and community. | React, Node.js, GraphQL, PostgreSQL, MongoDB, Redis, RabbitMQ, Docker, Kubernetes, Prometheus, Grafana |
| [Running Platform](./Running%20Platform/) | Training platform for runners with workout tracking, performance analytics and user profiles. | React, Node.js, Express, PostgreSQL, Redis, Docker, Nginx |

### RiseWithin

A personal growth application built around a React frontend, a GraphQL API gateway and dedicated Node.js microservices.

- Habit tracking, goals, routines, focus sessions, content and community features.
- PostgreSQL and MongoDB storage, Redis caching and RabbitMQ messaging.
- Docker Compose for local development and Kubernetes manifests for deployment.
- Prometheus metrics and Grafana datasource provisioning for monitoring.

[Explore the source code](./RiseWithIn/) · [Setup and documentation](./RiseWithIn/README.md)

### Running Platform

A running application with separate authentication, workout and statistics services, connected through an Nginx reverse proxy.

- Authentication with JWT access tokens and refresh token rotation.
- Workout management, user profiles and performance dashboards with Recharts.
- PostgreSQL databases, Redis caching and Docker Compose orchestration.
- Automated service tests and a repository-level GitHub Actions workflow for testing, frontend builds and container image publication.

[Explore the source code](./Running%20Platform/) · [Setup and documentation](./Running%20Platform/README.md)

## Repository structure

```text
Projects/
├── .github/workflows/    # Running Platform CI and container publishing
├── RiseWithIn/          # Personal growth platform
├── Running Platform/    # Running and workout platform
└── README.md
```

## Getting started

```bash
git clone https://github.com/lorenzoairoldi-lab/Projects.git
cd Projects
```

Choose a project and follow its README for prerequisites, environment configuration, startup commands and tests. Each application runs from its own project directory.

RiseWithin's nested workflow is included as a reference; it must be adapted and moved to the repository's root `.github/workflows/` directory before GitHub Actions can run it.

---

*Built to showcase my learning journey and technical growth.*
