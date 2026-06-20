# Informe Técnico — Sistema de Inventario de Laboratorios
## Proyecto Integrador EGI · ITU · 2026

---

**Materia:** Ecosistemas de Gestión de Infraestructura (EGI)  
**Institución:** Instituto Tecnológico Universitario (ITU)  
**Repositorio:** https://github.com/MartinZ18/Proyecto-Inventario-EGI  

---

## Índice

1. [Introducción y contexto del problema](#1-introducción-y-contexto-del-problema)
2. [Arquitectura general del sistema](#2-arquitectura-general-del-sistema)
3. [Decisiones de diseño y justificación tecnológica](#3-decisiones-de-diseño-y-justificación-tecnológica)
4. [Base de datos relacional — SQL Server 2022](#4-base-de-datos-relacional--sql-server-2022)
5. [Base de datos documental — MongoDB 7](#5-base-de-datos-documental--mongodb-7)
6. [Backend — FastAPI (Python 3.12)](#6-backend--fastapi-python-312)
7. [Frontend — HTML/JS vanilla + Bootstrap 5](#7-frontend--htmljs-vanilla--bootstrap-5)
8. [Autenticación y autorización — Active Directory, LDAP y JWT](#8-autenticación-y-autorización--active-directory-ldap-y-jwt)
9. [Infraestructura de red — pfSense y topología de laboratorio](#9-infraestructura-de-red--pfsense-y-topología-de-laboratorio)
10. [Orquestación — Kubernetes (Minikube + Calico CNI)](#10-orquestación--kubernetes-minikube--calico-cni)
11. [Seguridad en profundidad — NetworkPolicies y iptables](#11-seguridad-en-profundidad--networkpolicies-y-iptables)
12. [Pipeline de CI/CD — GitHub Actions](#12-pipeline-de-cicd--github-actions)
13. [Conclusiones y lecciones aprendidas](#13-conclusiones-y-lecciones-aprendidas)

---

## 1. Introducción y contexto del problema

El Instituto Tecnológico Universitario (ITU) necesita un sistema centralizado para gestionar el inventario de equipos de cómputo distribuidos en sus laboratorios de informática. Hasta el momento, esta información se maneja de forma dispersa, lo que dificulta saber en qué aula está cada máquina, quién es su responsable técnico, cuándo tuvo mantenimiento y qué componentes de hardware tiene instalados.

El objetivo del proyecto es construir una aplicación web que resuelva este problema en dos dimensiones complementarias:

- **¿Dónde está el equipo y a quién pertenece?** — datos relacionales: ubicación (aula, laboratorio, número de mesa), asignaciones a personas (técnico responsable, docentes o alumnos con asignación temporal) y registro de mantenimientos.
- **¿Qué tiene adentro el equipo?** — datos de hardware con estructura variable: CPU, RAM, almacenamiento, sistema operativo, periféricos (monitor, teclado, mouse) y, en el caso de laptops, batería y pantalla integrada.

La naturaleza distinta de estos dos tipos de datos motivó la decisión de utilizar dos bases de datos con paradigmas diferentes: **SQL Server 2022** para los datos relacionales y **MongoDB 7** para los componentes de hardware. Ambas se conectan a través de un identificador compartido (`id_equipo`) que actúa como clave puente.

El proyecto impone además exigencias de seguridad de nivel productivo: autenticación centralizada contra **Active Directory** institucional, despliegue contenerizado en **Kubernetes** con políticas de red zero-trust mediante **Calico NetworkPolicies**, y seguridad perimetral con **pfSense** como gateway NAT del laboratorio.

---

## 2. Arquitectura general del sistema

El sistema está compuesto por cinco capas funcionales que se interconectan siguiendo el principio de menor privilegio:

```
Internet / cliente externo
        │
        ▼  port-forward VirtualBox (host:80 → WAN pfSense:80)
   pfSense — NAT gateway (FreeBSD)
        │  NAT port-forward (WAN:80 → 192.168.56.30:30080)
        ▼
   Host LinuxEGI — Minikube (192.168.56.30)
        │  iptables INPUT: solo pfSense y red lab
        ▼
   namespace: inventario (Calico NetworkPolicies)
   ┌─────────────────────────────────────────────┐
   │  frontend (nginx) — NodePort :30080         │
   │        │ proxy /api/ → :8000                │
   │  backend (FastAPI) — ClusterIP :8000        │
   │   ├── → MongoDB pod :27017                  │
   │   ├── → SQL Server VM :1433 (Endpoints)     │
   │   └── → AD/LDAP VM :389 (Endpoints)         │
   └─────────────────────────────────────────────┘
        │
        ├── VM DC01-ITU (192.168.56.10) — AD DS, DNS, DHCP
        └── VM SQL Server (192.168.56.20) — SQL Server 2022
```

### Componentes y responsabilidades

| Componente | Tecnología | Responsable |
|---|---|---|
| Interfaz web | HTML/CSS/JS vanilla + Bootstrap 5 servido por nginx | Integrante Frontend |
| API REST | FastAPI (Python 3.12) + SQLAlchemy + pymongo + ldap3 | Integrante Backend |
| Base relacional | SQL Server 2022, base `inventario_ubicaciones` | Integrante Bases de Datos |
| Base documental | MongoDB 7, base `inventario_componentes`, colección `computadoras` | Integrante Bases de Datos |
| Identidad y autenticación | Active Directory `itu.local` + LDAP | Integrante Seguridad y Redes |
| Red perimetral | pfSense (NAT, port-forward, auth AD, DHCP relay) | Integrante Seguridad y Redes |
| Orquestación | Kubernetes (Minikube + Calico CNI), 7 NetworkPolicies | Integrante Seguridad y Redes |
| CI/CD | GitHub Actions, self-hosted runner en LinuxEGI | Integrante Seguridad y Redes |

---

## 3. Decisiones de diseño y justificación tecnológica

### 3.1 ¿Por qué dos bases de datos?

La elección de usar dos motores de base de datos responde a la naturaleza estructuralmente diferente de los datos que maneja el sistema:

Los datos de **ubicación y asignación** son fuertemente relacionales: un equipo pertenece a una ubicación, una ubicación puede tener muchos equipos, una persona puede tener múltiples asignaciones, y un equipo puede tener varios registros de mantenimiento. Esta red de relaciones con integridad referencial es el dominio natural de un motor SQL. SQL Server 2022 ofrece además integración nativa con el ecosistema Windows del laboratorio.

Los datos de **componentes de hardware** son intrínsecamente heterogéneos: una laptop tiene batería y pantalla integrada, un desktop no; la cantidad de módulos de RAM varía por equipo; un servidor tiene perfiles de almacenamiento distintos a una workstation. Forzar esta variedad en un esquema relacional rígido requeriría decenas de columnas nullable o tablas de atributos genéricos, ambas soluciones poco mantenibles. MongoDB permite representar cada equipo con exactamente los campos que le corresponden, sin penalizar los que no aplican.

El **campo puente** `id_equipo` — presente en la tabla `Equipo` de SQL Server y en cada documento de MongoDB — es el mecanismo de enlace. El backend lo recibe en el request, consulta SQL Server para los datos relacionales y MongoDB para los componentes, y fusiona ambas respuestas en un objeto `InventarioCompleto` antes de enviarlo al frontend. SQL Server funciona como la fuente de verdad: si el equipo no existe en SQL, no existe para el sistema.

### 3.2 ¿Por qué FastAPI y no Django o Flask?

FastAPI fue elegido sobre las alternativas por tres razones concretas:

1. **Validación automática con Pydantic**: cada endpoint declara modelos de entrada y salida (schemas en `app/schemas/`), y FastAPI valida los datos automáticamente. Esto elimina código de validación manual y genera documentación interactiva en `/docs` (Swagger UI) sin esfuerzo adicional, útil para el desarrollo y la demostración.

2. **Rendimiento asincrónico**: FastAPI está construido sobre Starlette y Uvicorn, lo que le permite manejar múltiples conexiones concurrentes de forma eficiente. Relevante cuando el backend debe hacer consultas a SQL Server, MongoDB y LDAP en la misma request.

3. **Arquitectura limpia**: el patrón en capas (routers → services → repositories → db) facilita la separación de responsabilidades y fue adoptado directamente, con routers que solo manejan HTTP, services que orquestan la lógica de negocio entre las dos bases de datos, y repositories que encapsulan el acceso a cada motor.

### 3.3 ¿Por qué Kubernetes y no Docker Compose?

Docker Compose hubiera sido suficiente para correr los contenedores, pero no permite implementar **NetworkPolicies**, que son un requisito explícito del proyecto. Las NetworkPolicies son objetos de Kubernetes que el CNI (en este caso Calico) intercepta e impone a nivel de kernel. Sin Kubernetes, no hay forma de aplicar un modelo zero-trust entre servicios.

Adicionalmente, Kubernetes provee:
- **Self-healing**: reinicia automáticamente un pod que falla.
- **Rolling updates**: el CI/CD puede aplicar nuevas imágenes sin downtime (`kubectl rollout restart`).
- **Abstracción de red**: los Services permiten que el backend llame a `mongo-service:27017` sin conocer la IP real del pod, y los `Endpoints` permiten referenciar las VMs externas (SQL Server, AD) con un nombre DNS interno del clúster.

### 3.4 ¿Por qué Calico y no el CNI por defecto de Minikube?

El CNI por defecto de Minikube (kindnet) no implementa NetworkPolicies. Al crear una NetworkPolicy con kindnet, el objeto se crea en la API de Kubernetes pero no tiene efecto real: el tráfico fluye sin restricciones. Calico sí implementa las políticas a nivel de iptables/eBPF. La instrucción `minikube start --cni=calico` instala Calico como CNI, lo que hace que las 7 NetworkPolicies del proyecto tengan efecto real.

---

## 4. Base de datos relacional — SQL Server 2022

### 4.1 Modelo de datos

La base `inventario_ubicaciones` contiene cinco tablas relacionadas:

```
Ubicacion (id_ubicacion PK, nombre, tipo, edificio, piso)
    │
    └──► Equipo (id_equipo PK, id_ubicacion FK, mesa, estado, fecha_alta)
              │
              ├──► Asignacion (id_asignacion PK, id_equipo FK, id_persona FK,
              │                tipo_asignacion, fecha_inicio, fecha_fin)
              │
              └──► Mantenimiento (id_mantenimiento PK, id_equipo FK, fecha,
                                  tipo, descripcion, id_tecnico FK → Persona)

Persona (id_persona PK, nombre, apellido, dni UNIQUE, email UNIQUE, rol)
```

- `Ubicacion.tipo` acepta valores `AULA`, `LABORATORIO`, `OFICINA`, `OTRO`.
- `Equipo.estado` acepta `OPERATIVO`, `EN_REPARACION`, `BAJA`.
- `Asignacion.tipo_asignacion` distingue `RESPONSABLE_TECNICO` de `TEMPORAL`. Una asignación con `fecha_fin IS NULL` indica vigencia actual.
- `Mantenimiento.tipo` categoriza entre `PREVENTIVO`, `CORRECTIVO`, `ACTUALIZACION`.
- `Persona.rol` puede ser `TECNICO`, `DOCENTE` o `ALUMNO`, que se alinea con los grupos de Active Directory.

### 4.2 Conexión desde Kubernetes

SQL Server corre en una VM externa (`192.168.56.20`), fuera del clúster de Kubernetes. Para que el backend pueda referenciarlo por nombre, se creó un par `Service + Endpoints` en Kubernetes:

- `Service` tipo `ClusterIP` llamado `sqlserver-service` que expone el puerto 1433 dentro del clúster.
- `Endpoints` que apunta a `192.168.56.20:1433` (la IP real de la VM, resuelta dinámicamente mediante `infra/scripts/generar-manifiestos.sh`).

El backend usa SQLAlchemy con el driver `pyodbc` (ODBC Driver 18 for SQL Server), y la URL de conexión se construye en `app/core/config.py` a partir de variables de entorno inyectadas desde un ConfigMap y un Secret de Kubernetes.

---

## 5. Base de datos documental — MongoDB 7

### 5.1 Estructura de los documentos

La colección `computadoras` en la base `inventario_componentes` almacena un documento por equipo. El campo `id_equipo` es la clave puente con SQL Server e incluye un índice único para garantizar que no haya dos documentos para el mismo equipo.

Estructura base de un documento (desktop):

```json
{
  "id_equipo": 1,
  "tipo": "desktop",
  "codigo_inventario": "INV-2023-001",
  "fabricante": "Dell",
  "modelo": "OptiPlex 7090",
  "sistema_operativo": { "nombre": "Windows 10 Pro", "version": "22H2", "arquitectura": "x64" },
  "cpu": { "marca": "Intel", "modelo": "Core i7-10700", "nucleos": 8, "frecuencia_ghz": 2.9 },
  "ram": [ { "capacidad_gb": 16, "tipo": "DDR4", "frecuencia_mhz": 2666 } ],
  "almacenamiento": [ { "tipo": "SSD", "capacidad_gb": 512, "interfaz": "SATA" } ],
  "perifericos": { "monitor": true, "teclado": true, "mouse": true }
}
```

Una laptop agrega los campos `bateria` y `pantalla_integrada`, que no existen (ni como null) en un desktop. Esta diferencia estructural es exactamente el escenario para el que MongoDB está diseñado.

### 5.2 Validación con `$jsonSchema`

El script de creación de la colección (`bases-de-datos/database/scripts/inventario-db_mongo.js`) define un validador `$jsonSchema` que requiere los campos obligatorios (`id_equipo`, `tipo`, `cpu`, `ram`, `almacenamiento`, `sistema_operativo`) y valida los tipos. Esto garantiza consistencia sin la rigidez de un esquema SQL.

### 5.3 Seed inicial

El seed de 12 documentos (`backend/scripts-dev/componentes_prueba.js`) incluye variedad deliberada: 8 desktops, 3 laptops y 1 servidor de rack; un equipo en estado de baja (`EN_REPARACION`) sin componentes GPU; laptops con batería y pantalla integrada pero sin monitor/teclado/mouse externo. Esta variedad permite demostrar en vivo las búsquedas filtradas por tipo y las diferencias estructurales entre documentos.

---

## 6. Backend — FastAPI (Python 3.12)

### 6.1 Arquitectura en capas

El backend sigue un patrón de cuatro capas con inyección de dependencias:

```
Routers (HTTP, RBAC)
    │
    ▼
Services (orquestación, lógica de negocio cross-DB)
    │
    ▼
Repositories (acceso a datos: SQLAlchemy ORM / pymongo)
    │
    ▼
DB (engine/session de SQL Server, cliente de MongoDB)
```

**Routers** (`app/routers/`): solo manejan HTTP — reciben el request, validan el JWT, aplican RBAC y delegan al service. No tocan la base de datos directamente.

**Services** (`app/services/`): `inventario_service.py` coordina los dos repositories cuando una operación involucra ambas bases. Por ejemplo, `GET /inventario/{id}` hace primero la consulta SQL y luego la de Mongo, fusiona los resultados y retorna `InventarioCompleto`.

**Repositories** (`app/repositories/`): `equipo_repo.py` usa SQLAlchemy con `joinedload` para cargar en una sola query el equipo con su ubicación, asignaciones y mantenimientos. `computadora_repo.py` usa el cliente pymongo directamente.

### 6.2 Endpoints disponibles

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/login` | Público | Valida credenciales LDAP, emite JWT |
| GET | `/inventario/` | Autenticado | Lista todos los equipos (SQL + Mongo) |
| GET | `/inventario/{id}` | Autenticado | Detalle completo de un equipo |
| GET | `/inventario/ubicaciones` | Autenticado | Lista ubicaciones disponibles |
| GET | `/inventario/personas` | Autenticado | Lista personas para asignar |
| POST | `/inventario/equipos` | Solo Técnicos | Crear equipo en SQL Server |
| PUT | `/inventario/equipos/{id}` | Solo Técnicos | Actualizar equipo |
| DELETE | `/inventario/equipos/{id}` | Solo Técnicos | Eliminar equipo (y sus componentes) |
| POST | `/inventario/componentes` | Solo Técnicos | Crear componentes en MongoDB |
| PUT | `/inventario/componentes/{id}` | Solo Técnicos | Actualizar componentes |
| GET | `/health` | Público | Health check para Kubernetes |

### 6.3 Containerización

El Dockerfile del backend (`backend/Dockerfile`) parte de `python:3.12-slim` e instala el **ODBC Driver 18 for SQL Server** de Microsoft (necesario para que pyodbc pueda conectarse). Es el paso más complejo del build: requiere agregar el repositorio de Microsoft, instalar `msodbcsql18` y las herramientas de línea de comandos. El proceso está documentado y automatizado en el Dockerfile.

---

## 7. Frontend — HTML/JS vanilla + Bootstrap 5

### 7.1 Estructura de páginas

El frontend no usa ningún framework JavaScript. Está compuesto por cuatro páginas HTML con sus correspondientes módulos JS:

| Página | Módulo JS | Función |
|---|---|---|
| `index.html` | `js/login.js` | Formulario de login, POST a `/auth/login`, guarda JWT en localStorage |
| `listado.html` | `js/listado.js` | Tabla de todos los equipos, filtros client-side, botón eliminar |
| `detalle.html` | `js/detalle.js` | Vista completa de un equipo (SQL + Mongo), botones editar/eliminar |
| `formulario.html` | `js/formulario.js` | Formulario de alta y edición de equipo + componentes |

### 7.2 Cliente API centralizado (`js/api.js`)

Toda la comunicación con el backend pasa por `api.js`, que implementa:
- `fetchWithAuth()`: wrapper de `fetch` que inyecta el header `Authorization: Bearer <token>` en cada request.
- `isTokenExpired()`: decodifica el payload del JWT (sin verificar firma, solo para leer la fecha de expiración) y devuelve `true` si el token expiró.
- Redirección automática a `index.html` en caso de 401 o token expirado.

Este diseño centralizado garantiza que ninguna página quede con requests no autenticados por olvido, y que la expiración del JWT se maneje consistentemente en toda la app.

### 7.3 Control de acceso por rol en el frontend

El rol se extrae del payload del JWT (`obtenerRolUsu()`). Los botones y secciones de escritura (crear, editar, eliminar) se ocultan si el rol no es `Tecnicos`. Esta es la capa de UX del RBAC; la capa de seguridad real está en el backend (`requiere_tecnico` en `app/dependencies.py`).

### 7.4 Containerización con nginx

El Dockerfile del frontend (`docker/frontend/Dockerfile`) usa `nginx:1.25-alpine`. La configuración de nginx (`docker/frontend/nginx.conf`) tiene dos responsabilidades:
- Servir los archivos estáticos (HTML, CSS, JS, imágenes).
- **Proxy reverso**: las requests a `/api/` son redirigidas a `backend-service:8000` (el Service ClusterIP del backend dentro del clúster). Esto elimina la necesidad de CORS y hace que el frontend nunca llame directamente al backend por IP, siempre por el hostname del Service.

---

## 8. Autenticación y autorización — Active Directory, LDAP y JWT

### 8.1 Flujo completo de autenticación

```
1. Usuario → POST /auth/login {username, password}
2. Backend: bind LDAP como {username}@itu.local contra DC01-ITU:389
   → Si falla: 401 Unauthorized
3. Backend: rebind como svc-inventario@itu.local (cuenta de servicio)
4. Backend: busca el atributo memberOf del usuario en AD
   → Revisa si pertenece a Tecnicos, Docentes o Alumnos
5. Backend: emite JWT (python-jose, HS256, 60 min) con claims:
   { "sub": "mgomez", "rol": "Tecnicos", "exp": ... }
6. Frontend: guarda JWT en localStorage
7. Frontend: adjunta JWT en cada request: Authorization: Bearer <token>
8. Backend: valida el JWT en cada endpoint (get_current_user)
   → Endpoints de escritura: valida además que rol == "Tecnicos"
```

### 8.2 Active Directory — estructura

El dominio `itu.local` con DC `DC01-ITU` tiene la siguiente estructura de OUs y grupos relevantes:

```
DC=itu, DC=local
  └── OU=ITU
        ├── OU=User     → usuarios del sistema
        ├── OU=Grupos   → grupos de seguridad
        └── OU=Computer → equipos del dominio
```

Grupos de seguridad para el inventario:

| Grupo | Rol en el sistema | Permisos |
|---|---|---|
| `Tecnicos` | Técnicos de laboratorio | CRUD completo |
| `Docentes` | Docentes | Solo lectura |
| `Alumnos` | Alumnos | Solo lectura |
| `pfAdmins` | Administradores de pfSense | Acceso a WebGUI de pfSense |

La cuenta de servicio `svc-inventario@itu.local` tiene permisos de lectura sobre el directorio para el rebind de `obtener_rol()`.

### 8.3 Doble validación de seguridad (RBAC)

El RBAC se implementa en dos capas independientes para que ninguna pueda ser evitada por separado:
- **Frontend**: oculta botones y bloquea navegación según el rol del JWT.
- **Backend**: la dependencia `requiere_tecnico` en `app/dependencies.py` verifica el rol en cada endpoint de escritura y retorna 403 si el rol no es `Tecnicos`, independientemente de lo que haga el frontend.

---

## 9. Infraestructura de red — pfSense y topología de laboratorio

### 9.1 Topología de VirtualBox

Todo el entorno corre en una sola PC con Windows 11 usando VirtualBox. La red **Host-Only** `192.168.56.0/24` conecta a todas las VMs:

| VM | SO | IP fija | Rol |
|---|---|---|---|
| `pfSense-Gateway` | FreeBSD (pfSense) | 192.168.56.2 (LAN) | NAT gateway, DHCP relay, auth AD |
| `DC01-ITU` | Windows Server 2022 | 192.168.56.10 | AD DS, DNS, DHCP |
| `SQLServer2022` | Windows Server 2022 | 192.168.56.20 | SQL Server 2022 |
| `LinuxEGI` | Ubuntu (Linux) | 192.168.56.30 | Minikube, Docker, runner CI/CD |

### 9.2 Acceso externo al sistema

El acceso externo (fuera de la red del laboratorio) se logra encadenando dos port-forwards:

1. **VirtualBox** (a nivel de hipervisor): `host Windows:80 → WAN de pfSense-Gateway:80`. Esto hace que el puerto 80 de la PC Windows apunte al WAN de pfSense.
2. **pfSense** (a nivel de firewall): `WAN:80 → 192.168.56.30:30080`. Esto reenvía el tráfico al NodePort del frontend en el host de Minikube.

Un cliente externo navega a la IP pública/host de Windows → pfSense recibe y reenvía → el frontend de Kubernetes responde. Todo el tráfico entra por el único punto de control (pfSense).

### 9.3 Configuración de pfSense como código

pfSense expone una API PHP accesible por SSH (`php -f script.php`). Todos los pasos de configuración de pfSense están automatizados como scripts PHP en `pfsense/scripts/`:

| Script | Función |
|---|---|
| `wan-allow-private.php` | Desactiva "Block private networks" en WAN (necesario porque el WAN es el NAT de VirtualBox, rango RFC1918) |
| `nat-port-forward.php` | Crea la regla NAT `WAN:80 → MINIKUBE_IP:30080` |
| `auth-server-ad.php` | Configura el Authentication Server para pfAdmins → AD |
| `dhcp-relay.php` | Activa DHCP relay hacia el DC (desactiva DHCP local de pfSense) |

Se ejecutan desde PowerShell en Windows con `pfsense/scripts/aplicar-config-pfsense.ps1`, que se conecta por SSH y ejecuta cada script. Esto permite reproducir la configuración desde cero en minutos.

### 9.4 IPs y puertos relevantes

| Origen | Destino | Puerto | Propósito |
|---|---|---|---|
| Internet | Host Windows | 80/TCP | Port-forward VirtualBox |
| Host Windows | pfSense WAN | 80/TCP | NAT VirtualBox |
| Cualquier cliente LAN / pfSense | LinuxEGI :30080 | 80/TCP (reenv.) | Frontend NodePort |
| Backend pod | SQL Server VM | 1433/TCP | SQLAlchemy/pyodbc |
| Backend pod | DC01-ITU | 389/TCP | LDAP (auth + roles) |
| Backend pod | MongoDB pod | 27017/TCP | pymongo |
| pfSense | DC01-ITU | 389/TCP | Auth pfAdmins |
| pfSense | DC01-ITU | 67-68/UDP | DHCP relay |
| Admins (red lab) | LinuxEGI | 22/TCP | SSH administración |

---

## 10. Orquestación — Kubernetes (Minikube + Calico CNI)

### 10.1 Namespace y objetos desplegados

Todos los recursos de la aplicación viven en el namespace `inventario`:

```
kubernetes/
├── 00-namespace.yaml           namespace: inventario
├── configmaps/
│   └── backend-configmap.yaml  variables no sensibles del backend
├── deployments/
│   ├── backend-deployment.yaml  FastAPI (inventario-api:latest)
│   ├── frontend-deployment.yaml nginx (inventario-web:latest)
│   └── mongo-deployment.yaml    MongoDB 7 con PersistentVolumeClaim 1Gi
├── services/
│   ├── backend-service.yaml    ClusterIP :8000
│   ├── frontend-service.yaml   NodePort :30080
│   └── mongo-service.yaml      ClusterIP :27017
├── external/
│   ├── sqlserver-endpoints.yaml Service+Endpoints → ${SQLSERVER_IP}:1433
│   └── ldap-endpoints.yaml      Service+Endpoints → ${DC_IP}:389
├── secrets/
│   └── backend-secret.example.yaml  plantilla (valores reales = Secret K8s)
└── network-policies/            7 políticas (00 a 06)
```

### 10.2 Configuración dinámica de IPs

Las IPs del laboratorio (`DC_IP`, `SQLSERVER_IP`, `MINIKUBE_IP`, `IP_RED_PROF`, `PFSENSE_LAN_IP`) no están hardcodeadas en los manifiestos. Se gestionan así:

1. `infra/red.example.env` — plantilla committada con los defaults de la red Host-Only `192.168.56.0/24`.
2. Cada operador copia este archivo a `infra/red.local.env` (gitignored) y ajusta si su red difiere.
3. `infra/scripts/detectar-red.sh` carga el archivo y exporta las variables a `$GITHUB_ENV` (en el pipeline) o al entorno de la shell.
4. `infra/scripts/generar-manifiestos.sh` usa `envsubst` para sustituir los placeholders y deja el resultado en `kubernetes/_generated/` (gitignored).

Solo tres archivos tienen placeholders y requieren generación: los Endpoints externos y la NetworkPolicy 05.

### 10.3 Imágenes de Docker y build local

Las imágenes (`inventario-api:latest` e `inventario-web:latest`) se construyen directamente en el daemon de Docker de Minikube, sin pasar por ningún registry externo. Esto se logra con:

```bash
eval $(minikube -p minikube docker-env)
docker build -t inventario-api:latest ./backend
docker build -f docker/frontend/Dockerfile -t inventario-web:latest ./frontend
```

Al apuntar el cliente Docker al daemon interno de Minikube, las imágenes quedan inmediatamente disponibles para los Pods (`imagePullPolicy: Never` en los Deployments).

---

## 11. Seguridad en profundidad — NetworkPolicies y iptables

### 11.1 Modelo zero-trust con Calico NetworkPolicies

El modelo de seguridad dentro del clúster sigue el principio zero-trust: **todo el tráfico está denegado por defecto**, y solo se abre lo estrictamente necesario. Las 7 políticas se aplican en orden (00 → 06):

| Política | Aplica a | Permite | Justificación |
|---|---|---|---|
| `00-default-deny` | Todos los pods | Nada (ingress y egress) | Base zero-trust: punto de partida de mínimo privilegio |
| `01-allow-dns` | Todos los pods | Egress :53 UDP/TCP → kube-dns | Sin DNS ningún pod resuelve nombres de Service |
| `02-allow-frontend-ingress` | `app=frontend` | Ingress :80 desde cualquier origen | Es el único componente expuesto externamente |
| `03-allow-frontend-egress` | `app=frontend` | Egress :8000 → `app=backend` | El frontend solo necesita llamar a la API |
| `04-allow-backend-from-frontend` | `app=backend` | Ingress :8000 desde `app=frontend` | Nadie puede llamar a la API sin pasar por el frontend |
| `05-allow-backend-egress` | `app=backend` | Egress :27017 → `app=mongo`; Egress :1433/:389 → ipBlock `192.168.56.0/24` | Backend accede a Mongo (pod) y a SQL/AD (VMs externas, acotado a la red del lab) |
| `06-allow-mongodb-from-backend` | `app=mongo` | Ingress :27017 desde `app=backend` | Solo el backend accede a la base documental |

**Demostración en vivo del zero-trust:**

```bash
# Frontend NO puede llegar a MongoDB (debe fallar):
kubectl exec -n inventario deploy/frontend -- \
  sh -c "nc -zv mongo-service 27017 2>&1 || echo BLOQUEADO"

# Backend SÍ puede (debe dar OK):
kubectl exec -n inventario deploy/backend -- \
  sh -c "nc -zv mongo-service 27017 && echo OK"
```

### 11.2 iptables en el host de Minikube

Las NetworkPolicies de Calico controlan el tráfico entre pods. Pero el host de Minikube (LinuxEGI) también necesita protección: sin reglas adicionales, cualquier equipo de la red podría conectarse por SSH o intentar acceder a recursos del host.

Las reglas de `iptables/reglas-perimetrales.sh` se aplican **solo a la cadena `INPUT`** (tráfico con destino el host mismo):

- SSH `:22` — solo desde `192.168.56.0/24` (red del laboratorio).
- ICMP — solo desde `192.168.56.0/24`.
- NodePort `:30080` — solo desde `192.168.56.2` (pfSense) y la red del laboratorio.
- Política por defecto de INPUT: `DROP`.

Las cadenas `FORWARD` y `OUTPUT` no se modifican, para no interferir con las cadenas internas de Calico y kube-proxy que gestionan el tráfico entre pods.

### 11.3 Gestión segura de credenciales

La gestión de credenciales sigue un modelo de tres niveles que garantiza que ninguna contraseña ni clave secreta aparezca en el código fuente ni en el historial de Git.

#### Nivel 1 — GitHub Secrets (origen)

Las credenciales de runtime se almacenan como GitHub Secrets en el repositorio. Son la única fuente de verdad para las contraseñas del sistema. No son visibles en logs, no se imprimen en el pipeline, y solo los administradores del repo pueden gestionarlas.

| Secret | Qué protege |
|---|---|
| `JWT_SECRET` | Clave de firma HS256 del JWT (256 bits aleatorios) |
| `SQLSERVER_USER` | Usuario `inventario_admin` (db_owner en SQL Server) |
| `SQLSERVER_PASSWORD` | Contraseña del usuario SQL Server |
| `MONGO_ROOT_USER` | Usuario root de MongoDB |
| `MONGO_ROOT_PASSWORD` | Contraseña root de MongoDB |
| `LDAP_BIND_PASSWORD` | Contraseña de `svc-inventario@itu.local` (bind LDAP) |

#### Nivel 2 — Kubernetes Secret (en el clúster)

El pipeline (paso 8 del workflow) crea el Secret `backend-secret` en el namespace `inventario` mediante:

```bash
kubectl create secret generic backend-secret \
  --from-literal=JWT_SECRET="${{ secrets.JWT_SECRET }}" \
  --from-literal=SQLSERVER_PASSWORD="${{ secrets.SQLSERVER_PASSWORD }}" \
  --from-literal=MONGO_ROOT_PASSWORD="${{ secrets.MONGO_ROOT_PASSWORD }}" \
  --from-literal=LDAP_BIND_PASSWORD="${{ secrets.LDAP_BIND_PASSWORD }}" \
  --save-config --dry-run=client -o yaml | kubectl apply -f -
```

Este Secret existe solo dentro de `etcd` de Kubernetes, nunca en un archivo commiteado. El `backend-secret.example.yaml` que existe en el repo es solo una plantilla con valores vacíos, para documentar la forma del objeto.

#### Nivel 3 — Variables de entorno del pod (consumo)

El Deployment del backend monta las claves del Secret como variables de entorno del contenedor:

```yaml
envFrom:
  - configMapRef:
      name: backend-configmap   # variables no sensibles (host, puerto, etc.)
  - secretRef:
      name: backend-secret      # variables sensibles (passwords, JWT secret)
```

La app lee estas variables mediante `app/core/config.py` (Pydantic Settings), sin ninguna lógica adicional de desencriptado. El proceso del pod recibe las variables en su entorno — nunca como archivos en disco, nunca en logs.

#### Principio de mínimo privilegio en cuentas de base de datos

El sistema define tres cuentas SQL Server con permisos distintos:

| Cuenta | Rol en SQL Server | Uso |
|---|---|---|
| `inventario_admin` | `db_owner` | Backend (FastAPI) — necesita DDL para `create_all()` al iniciar |
| `inventario_ro` | `db_datareader` | Solo SELECT — para auditoría y consultas manuales |
| `inventarioapp` | obsoleto | Login anterior, eliminado tras la migración |

El backend **solo usa `inventario_admin`**. La cuenta `inventario_ro` existe para que un auditor o docente pueda conectarse con SSMS y hacer consultas de lectura sin poder modificar datos. Esto sigue el principio de que cada actor tiene exactamente los permisos que necesita y ninguno más.

Para MongoDB, la cuenta raíz (`MONGO_ROOT_USER`) se usa solo para operaciones de administración (seed, índices). En un entorno de producción se crearía una cuenta con permisos `readWrite` sobre la base `inventario_componentes` únicamente.

#### Principio de mínimo privilegio en la cuenta LDAP

La cuenta `svc-inventario@itu.local` es una cuenta de servicio en Active Directory con permisos mínimos:
- Solo lectura (`Read`) sobre el directorio.
- No puede modificar usuarios ni grupos.
- No puede autenticarse interactivamente (sin shell, sin RDP).
- Su contraseña no expira y no requiere cambio en el próximo login (`PasswordNeverExpires`, `ChangePasswordAtLogon = false`) — necesario para un servicio sin operador humano.

El backend la usa exclusivamente para el **rebind** en `ldap_service.obtener_rol()`: después de validar las credenciales del usuario con un bind directo, se reconecta como `svc-inventario` para buscar a qué grupo pertenece el usuario. El usuario final nunca tiene acceso a esta cuenta.

#### Scripts de provisioning parametrizados

Los scripts de creación inicial de usuarios (AD y SQL Server) no contienen contraseñas. Las reciben en tiempo de ejecución:

- `active-directory/scripts/04-crear-usuarios-grupos.ps1`: parámetros `-PassInventario` y `-PassLdap`. Si no se pasan, solicita por consola con `Read-Host` (sin eco).
- `sql-server-iis/scripts/configurar-usuarios-sql.sql`: variables sqlcmd `$(ADMIN_PASSWORD)` y `$(RO_PASSWORD)`, pasadas con `sqlcmd -v` al ejecutar.
- `infra/scripts/verificar-migracion.sh`: lee `$VERIFY_PASSWORD` del entorno; si no está seteada, solicita con `read -rsp` (sin eco en terminal).

Este patrón permite automatizar estos scripts desde un pipeline o desde un vault de secretos sin modificar el código fuente.

#### Flujo completo de una credencial — de extremo a extremo

```
Administrador del repo
        │
        ▼ (una sola vez, interfaz web de GitHub)
GitHub Secrets → JWT_SECRET, SQLSERVER_PASSWORD, etc.
        │
        ▼ (cada ejecución del pipeline)
GitHub Actions runner (self-hosted, LinuxEGI)
        │  ${{ secrets.JWT_SECRET }} inyectado en el paso del workflow
        ▼
kubectl create secret generic backend-secret --from-literal=...
        │
        ▼ (almacenado en etcd, encriptado en reposo)
Kubernetes Secret "backend-secret" en namespace "inventario"
        │
        ▼ (al crear el pod)
Variable de entorno en el proceso del contenedor backend
        │
        ▼ (al iniciar la app)
app/core/config.py: Settings(jwt_secret=os.getenv("JWT_SECRET"))
        │
        ▼ (al firmar tokens)
python-jose: jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
```

En ningún punto de este flujo la credencial toca un archivo en disco dentro del repositorio.

---

## 12. Pipeline de CI/CD — GitHub Actions

### 12.1 Arquitectura del pipeline

El pipeline (`.github/workflows/deploy.yml`) se dispara **manualmente** (`workflow_dispatch`), siguiendo el patrón de la clase. Corre sobre un runner self-hosted con la etiqueta `minikube`, instalado en LinuxEGI como servicio systemd.

**Pasos del pipeline:**

| Paso | Acción |
|---|---|
| 1 | Checkout del repositorio completo (incluye `backend/`, `frontend/`, `kubernetes/`, etc.) |
| 2 | Resolver red: carga `infra/red.local.env`, exporta IPs a `$GITHUB_ENV` |
| 3 | Generar manifiestos: sustituye placeholders `${VAR}` en los tres archivos dinámicos |
| 4 | Apuntar Docker al daemon de Minikube (`eval $(minikube docker-env)`) |
| 5 | Build imagen backend (`inventario-api:latest`) |
| 6 | Build imagen frontend (`inventario-web:latest`) |
| 7 | Aplicar namespace, ConfigMaps y Endpoints externos |
| 8 | Crear/actualizar Secret del backend con los GitHub Secrets |
| 9 | Aplicar Deployments y Services, forzar rollout restart |
| 10 | Aplicar NetworkPolicies (al final, cuando los pods/labels ya existen) |
| 11 | Esperar rollout de los 3 Deployments (timeout 180s cada uno) |
| 12 | Seed MongoDB idempotente (no modifica si ya hay datos) |
| 13 | Resumen: imprime URL de acceso LAN y estado de pods |

### 12.2 Secrets de GitHub necesarios

| Secret | Uso |
|---|---|
| `JWT_SECRET` | Clave de firma del JWT |
| `SQLSERVER_USER` | Usuario de SQL Server (`inventario_admin`) |
| `SQLSERVER_PASSWORD` | Contraseña del usuario SQL |
| `MONGO_ROOT_USER` | Usuario administrador de MongoDB |
| `MONGO_ROOT_PASSWORD` | Contraseña MongoDB |
| `LDAP_BIND_PASSWORD` | Contraseña de `svc-inventario@itu.local` |

---

## 13. Conclusiones y lecciones aprendidas

### 13.1 Logros técnicos

El proyecto logró implementar un ecosistema completo de inventario con todos los requisitos planteados:

- **Aplicación funcional**: CRUD completo de equipos con datos distribuidos entre SQL Server y MongoDB, autenticación real contra Active Directory, RBAC por rol en backend y frontend, y filtros de búsqueda.
- **Seguridad en tres capas**: pfSense como gateway perimetral, 7 NetworkPolicies zero-trust a nivel de clúster Kubernetes, e iptables en el host del nodo.
- **Despliegue reproducible**: infraestructura como código — scripts de pfSense en PHP, scripts de AD en PowerShell, manifiestos de Kubernetes con IPs dinámicas, Dockerfiles, y pipeline de CI/CD automatizado.
- **Repositorio unificado**: monorepo con todo el código de la aplicación e infraestructura, historial de evolución visible, documentación técnica completa.

### 13.2 Decisiones que resultaron más complejas de lo previsto

**LDAP contra Active Directory vs OpenLDAP**: el backend fue desarrollado inicialmente contra un contenedor OpenLDAP (para desarrollo local), con un DN template del estilo `uid={username},ou=usuarios,dc=itu,dc=edu,dc=ar`. Al conectar contra el AD real (`itu.local`), la búsqueda de grupos con el atributo `member` (que en AD guarda DNs completos, no usernames) devolvía siempre vacío. La solución fue usar el atributo `memberOf` del usuario (que sí existe en AD) con un rebind administrativo de la cuenta de servicio `svc-inventario`.

**IPs dinámicas del laboratorio**: cada vez que se usaba el entorno en una PC diferente, las IPs podían cambiar. Resolver esto con el sistema de plantillas `infra/red.example.env` → `infra/red.local.env` → `generar-manifiestos.sh` fue una inversión de tiempo que evitó problemas constantes.

**pfSense y las redes RFC1918 en el WAN**: pfSense bloquea por defecto el tráfico entrante hacia el WAN si proviene de rangos privados (RFC1918). Como el WAN de pfSense es el NAT de VirtualBox (cuyo gateway es `10.0.2.2`, rango privado), hay que desmarcar explícitamente esa opción antes de que los port-forwards funcionen.

### 13.3 Cobertura de los requisitos del enunciado

| Requisito | Cubierto |
|---|---|
| Sistema centralizado de inventario | ✅ |
| SQL Server para ubicación y responsable | ✅ |
| MongoDB para componentes de hardware | ✅ |
| Autenticación contra AD/LDAP | ✅ |
| Seguridad perimetral con pfSense | ✅ |
| Zero-trust con NetworkPolicies | ✅ |
| DBs solo aceptan conexiones de la capa de aplicación | ✅ |
| MongoDB: CRUD + búsquedas filtradas + acceso por shell | ✅ |
| Minikube con CNI compatible (Calico) | ✅ |
| Repositorio Git con todo el código y manifiestos | ✅ |
| Documentación completa de arquitectura, BD y flujo | ✅ |
| Ecosistema funcional en Minikube | ✅ |

---

*Sistema de Inventario de Laboratorios — ITU 2026 · https://github.com/MartinZ18/Proyecto-Inventario-EGI*
