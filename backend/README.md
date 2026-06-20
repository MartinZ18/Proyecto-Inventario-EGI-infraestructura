# Backend — Proyecto Inventario EGI "Ecosistema de Inventario Seguro"

API REST desarrollada con **FastAPI (Python 3.12)** para el sistema de inventario de equipos de laboratorio del ITU. Gestiona la información de las computadoras combinando dos bases de datos: **SQL Server** (ubicación, responsables, mantenimientos) y **MongoDB** (componentes de hardware), usando el `id_equipo` como puente entre ambas. La autenticación se realiza contra **Active Directory / LDAP**, con control de acceso por rol (RBAC).

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Las dos bases de datos](#las-dos-bases-de-datos)
- [Autenticación y roles](#autenticación-y-roles-rbac)
- [Endpoints principales](#endpoints-principales)
- [Puesta en marcha](#puesta-en-marcha)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Tecnologías](#tecnologías)

---

## Arquitectura

El back-end sigue una arquitectura en capas que separa responsabilidades:

| Capa | Responsabilidad |
|---|---|
| **routers** | Definen los endpoints y delegan en los servicios |
| **services** | Lógica de negocio: combinar las dos bases, coordinar el borrado en cascada |
| **repositories** | Aíslan el acceso a datos (SQLAlchemy para SQL Server, PyMongo para MongoDB) |
| **models** | Modelos declarativos de SQLAlchemy (tablas de SQL Server) |
| **schemas** | Esquemas Pydantic: validación de entrada y serialización de salida |
| **core** | Configuración central (settings desde `.env`) y utilidades JWT |
| **db** | Inicialización de las conexiones a SQL Server y MongoDB |

---

## Las dos bases de datos

### SQL Server — `ubicacion_db`
Almacena el contexto físico y administrativo de cada equipo:
- **Dónde está**: ubicación, edificio, piso, mesa.
- **Quién lo usa**: asignaciones a técnicos, docentes o alumnos.
- **Historial**: registro de mantenimientos preventivos y correctivos.

Tablas: `Ubicacion`, `Equipo`, `Persona`, `Asignacion`, `Mantenimiento`.

### MongoDB — `inventario_componentes` / colección `computadoras`
Almacena los componentes internos de cada equipo como documento JSON:
CPU, RAM, almacenamiento, sistema operativo y, según el tipo de equipo, periféricos (desktop) o batería y pantalla (laptop).

### El puente entre las dos bases
El campo `id_equipo` es la clave compartida: con el mismo entero se localiza el registro en SQL Server y el documento en MongoDB. SQL Server es la fuente maestra: si el equipo no existe ahí, no existe en el sistema.

---

## Autenticación y roles (RBAC)

El flujo de autenticación es el siguiente:

1. El cliente envía usuario y contraseña a `POST /auth/login`.
2. El back-end hace un *bind* contra **Active Directory / LDAP** para verificar las credenciales.
3. Si el bind tiene éxito, se consulta el grupo de seguridad del usuario (`memberOf`) para determinar su rol: **Tecnicos**, **Docentes** o **Alumnos**.
4. Se emite un **token JWT** firmado que incluye el `username` y el `rol`.
5. El cliente adjunta el token en el encabezado `Authorization: Bearer <token>` en cada request posterior.

Control de acceso:

| Acción | Roles permitidos |
|---|---|
| Leer (listar, ver detalle, ubicaciones, personas) | Cualquier usuario autenticado |
| Escribir (crear, editar, eliminar equipos o componentes) | Solo **Tecnicos** |

Los intentos no autorizados devuelven `401` (sin token o token inválido) o `403` (autenticado pero sin permiso).

---

## Endpoints principales

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/auth/login` | Autenticación. Devuelve un JWT | Público |
| `GET` | `/inventario/` | Lista todos los equipos (SQL + Mongo combinados) | Autenticado |
| `GET` | `/inventario/{id_equipo}` | Vista completa de un equipo | Autenticado |
| `GET` | `/inventario/ubicaciones` | Lista las ubicaciones disponibles | Autenticado |
| `GET` | `/inventario/personas` | Lista las personas disponibles para asignar | Autenticado |
| `POST` | `/inventario/equipos` | Crea un equipo en una ubicación existente | Solo técnicos |
| `PUT` | `/inventario/equipos/{id_equipo}` | Actualiza los datos de un equipo | Solo técnicos |
| `DELETE` | `/inventario/equipos/{id_equipo}` | Elimina el equipo de ambas bases | Solo técnicos |
| `POST` | `/inventario/componentes` | Carga los componentes de un equipo | Solo técnicos |
| `PUT` | `/inventario/componentes/{id_equipo}` | Actualiza los componentes de un equipo | Solo técnicos |
| `DELETE` | `/inventario/componentes/{id_equipo}` | Elimina los componentes de un equipo | Solo técnicos |

Documentación interactiva disponible en `/docs` (Swagger UI) mientras el servidor esté corriendo.

---

## Puesta en marcha

### Requisitos previos

- Python 3.12
- [ODBC Driver 18 for SQL Server](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server) (necesario para pyodbc)
- Docker y Docker Compose (para levantar las dependencias locales)

### 1. Instalar dependencias de Python

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configurar las variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los valores reales. Ver `.env.example` para referencia de cada variable.

> **Nota:** el archivo `.env` nunca debe subirse al repositorio (está en `.gitignore`).

### 3. Levantar las dependencias (SQL Server, MongoDB, LDAP)

```bash
docker compose up -d
```

Esto levanta los tres servicios en contenedores locales. Los datos persisten en volúmenes Docker entre reinicios.

```bash
docker compose ps       # ver estado de los contenedores
docker compose down     # apagar (conserva los datos)
docker compose down -v  # apagar y eliminar los datos
```

### 4. Iniciar el servidor

```bash
uvicorn app.main:app --reload
```

La API queda disponible en `http://localhost:8000`.
La documentación interactiva en `http://localhost:8000/docs`.

---

## Estructura del proyecto

```
app/
├── core/
│   ├── config.py       # Settings (carga variables de entorno con Pydantic)
│   └── security.py     # Creación y verificación de tokens JWT
├── db/
│   ├── sql_server.py   # Engine, SessionLocal y Base de SQLAlchemy
│   └── mongo.py        # Cliente y referencia a la base de MongoDB
├── models/
│   └── inventario.py   # Modelos SQLAlchemy (tablas de SQL Server)
├── schemas/
│   ├── auth.py         # Schemas de login y token
│   ├── inventario.py   # Schemas de Equipo, Ubicacion, Persona, etc.
│   └── computadora.py  # Schemas de componentes (MongoDB) + vista unificada
├── repositories/
│   ├── equipo_repo.py      # Acceso a SQL Server (CRUD de equipos y relaciones)
│   └── computadora_repo.py # Acceso a MongoDB (CRUD de componentes)
├── services/
│   ├── auth_service.py      # Orquesta el login: LDAP → JWT
│   ├── ldap_service.py      # Bind y lectura de rol desde Active Directory
│   └── inventario_service.py # Combina SQL y Mongo; coordina escrituras
├── routers/
│   ├── auth.py         # POST /auth/login
│   └── inventario.py   # Endpoints de /inventario/*
├── dependencies.py     # Dependencias de FastAPI: sesiones de DB y control de acceso
└── main.py             # Punto de entrada: crea la app, registra routers

scripts-dev/            # Scripts para poblar las bases en desarrollo
```

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| FastAPI | Framework web y documentación automática |
| SQLAlchemy + pyodbc | ORM y acceso a SQL Server |
| PyMongo | Acceso a MongoDB |
| ldap3 | Autenticación contra Active Directory / LDAP |
| python-jose | Generación y verificación de tokens JWT |
| Pydantic v2 | Validación de datos y serialización |
| Docker Compose | Entorno de desarrollo local |
