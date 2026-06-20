# Proyecto Integrador EGI — Sistema de Inventario ITU

Sistema de inventario de equipos de laboratorio para la Universidad Tecnológica
(ITU). Trabajo integrador grupal con defensa oral.

## Equipo y responsabilidades

| Integrante | Capa |
|---|---|
| Backend | FastAPI + Python — API REST |
| Frontend | HTML/JS/Bootstrap — interfaz web |
| Bases de datos | SQL Server 2022 + MongoDB 7 — modelos y scripts |
| Seguridad y Redes | Kubernetes, NetworkPolicies, Active Directory, pfSense, CI/CD |

## Stack

| Capa | Tecnología |
|---|---|
| API | Python 3.12 + FastAPI + SQLAlchemy |
| Frontend | HTML + CSS + JS vanilla + Bootstrap 5 |
| Base relacional | SQL Server 2022 (`inventario_ubicaciones`) |
| Base documental | MongoDB 7 (`inventario_componentes.computadoras`) |
| Autenticación | LDAP → Active Directory (`itu.local`) + JWT (HS256) |
| Orquestación | Minikube + Calico CNI (NetworkPolicies) |
| CI/CD | GitHub Actions — self-hosted runner en LinuxEGI |
| Gateway | pfSense — NAT, DHCP relay, autenticación AD |

## Estructura del repositorio

```
.
├── backend/                 FastAPI — código de la API
│   ├── app/                 Aplicación (routers, services, repos, models, schemas)
│   ├── scripts-dev/         Seeds SQL/Mongo/LDAP para desarrollo local
│   ├── Dockerfile
│   ├── docker-compose.yml   SQL Server + MongoDB + OpenLDAP (dev local)
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                Interfaz web — HTML/JS vanilla + Bootstrap 5
│   ├── index.html           Login
│   ├── listado.html         Tabla de equipos
│   ├── detalle.html         Detalle completo de un equipo
│   ├── formulario.html      Alta / edición (solo Técnicos)
│   ├── js/                  api.js, login.js, listado.js, detalle.js, formulario.js
│   └── css/ img/
│
├── bases-de-datos/          Scripts de base de datos
│   └── database/scripts/
│       ├── Script SQL Server 2022.sql   Crea ubicacion_db con 5 tablas + seed
│       └── inventario-db_mongo.js       Crea inventario_db.componentes + seed
│
├── kubernetes/              Manifiestos del namespace "inventario"
│   ├── 00-namespace.yaml
│   ├── configmaps/
│   ├── deployments/         backend, frontend, mongo
│   ├── services/
│   ├── external/            Endpoints hacia SQL Server y AD (VMs, no pods)
│   └── network-policies/    7 políticas zero-trust (00-06)
│
├── active-directory/        Scripts PowerShell — OUs, grupos, usuarios AD
├── pfsense/                 Runbook + scripts PHP para configurar pfSense
├── sql-server-iis/          Runbook + scripts de firewall para SQL Server
├── iptables/                Reglas de firewall del host LinuxEGI (Minikube)
├── docker/frontend/         Dockerfile + nginx.conf para el frontend en K8s
│
├── infra/                   Configuración de red dinámica
│   ├── red.example.env      Plantilla (committear) — copiar a red.local.env
│   └── scripts/             detectar-red.*, generar-manifiestos.*, seed-mongo.sh
│
├── docs/                    Documentación técnica
│   ├── arquitectura.md      Diagrama de componentes, flujo de autenticación
│   ├── topologia-red.md     Diagrama de red, 7 NetworkPolicies, matriz de puertos
│   └── runbook-despliegue.md Orden end-to-end de despliegue (Fases 0-5)
│
└── .github/workflows/
    └── deploy.yml           Pipeline CI/CD — build + deploy en Minikube
```

## Arranque local (desarrollo)

```bash
# 1. Levantar SQL Server, MongoDB y OpenLDAP con Docker
cd backend
docker compose up -d

# 2. Entorno Python
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env: SQLSERVER_DB=inventario_ubicaciones

# 4. Seed inicial
# SQL Server: ejecutar bases-de-datos/database/scripts/Script SQL Server 2022.sql
#             o scripts-dev/ubicaciones_prueba.sql para dev rápido
# MongoDB:    mongosh < scripts-dev/componentes_prueba.js

# 5. Levantar la API
uvicorn app.main:app --reload --port 8000
# Swagger UI: http://localhost:8000/docs

# 6. Frontend
# Abrir frontend/index.html directamente en el navegador
```

## Despliegue en Kubernetes

Ver [`docs/runbook-despliegue.md`](docs/runbook-despliegue.md) para el procedimiento
completo (Fases 0-5). Resumen:

```bash
# Copiar plantilla de red y completar con las IPs del laboratorio
cp infra/red.example.env infra/red.local.env

# Generar manifiestos con las IPs resueltas
bash infra/scripts/detectar-red.sh
bash infra/scripts/generar-manifiestos.sh

# Aplicar al clúster (o usar el pipeline CI/CD desde GitHub Actions)
kubectl apply -f kubernetes/00-namespace.yaml
kubectl apply -f kubernetes/configmaps/
kubectl apply -f kubernetes/_generated/external/
kubectl apply -f kubernetes/deployments/
kubectl apply -f kubernetes/services/
kubectl apply -f kubernetes/_generated/network-policies/
```

El pipeline `deploy.yml` automatiza todo esto. Requiere un self-hosted runner
con la etiqueta `minikube` instalado en LinuxEGI y los GitHub Secrets configurados
(`JWT_SECRET`, `SQLSERVER_USER`, `SQLSERVER_PASSWORD`, `MONGO_ROOT_USER`,
`MONGO_ROOT_PASSWORD`, `LDAP_BIND_PASSWORD`).

## Endpoints de la API

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/auth/login` | público |
| GET | `/inventario/` | autenticado |
| GET | `/inventario/{id}` | autenticado |
| GET | `/inventario/ubicaciones` | autenticado |
| POST | `/inventario/equipos` | solo Técnicos |
| PUT | `/inventario/equipos/{id}` | solo Técnicos |
| DELETE | `/inventario/equipos/{id}` | solo Técnicos |
| POST | `/inventario/componentes` | solo Técnicos |
| PUT | `/inventario/componentes/{id}` | solo Técnicos |
| DELETE | `/inventario/componentes/{id}` | solo Técnicos |
| GET | `/health` | público (health check K8s) |

## Seguridad — NetworkPolicies zero-trust

7 políticas aplicadas en el namespace `inventario`:

| Archivo | Efecto |
|---|---|
| `00-default-deny.yaml` | Deniega todo el tráfico por defecto |
| `01-allow-dns.yaml` | Permite egress DNS → kube-dns |
| `02-allow-frontend-ingress.yaml` | Permite ingress :80 al frontend |
| `03-allow-frontend-egress.yaml` | Permite egress del frontend → API :8000 |
| `04-allow-backend-from-frontend.yaml` | Permite ingress :8000 al backend solo desde frontend |
| `05-allow-backend-egress.yaml` | Permite egress del backend → MongoDB (pod) + SQL Server/AD (ipBlock) |
| `06-allow-mongodb-from-backend.yaml` | Permite ingress :27017 a MongoDB solo desde backend |

## Usuarios de prueba (Active Directory)

| Usuario | Contraseña | Rol |
|---|---|---|
| `mgomez` | `Inventario!2025` | Técnico (CRUD completo) |
| `clopez` | `Inventario!2025` | Técnico (CRUD completo) |
| `jperez` | `Inventario!2025` | Docente (solo lectura) |
| `agarcia` | `Inventario!2025` | Docente (solo lectura) |
| `psanchez` | `Inventario!2025` | Alumno (solo lectura) |
