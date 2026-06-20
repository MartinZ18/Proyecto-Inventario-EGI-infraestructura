# Flujo de la aplicación web

## Diagrama de navegación y flujo de datos

```mermaid
flowchart TD
    START([Usuario abre el navegador]) --> LOGIN

    subgraph AUTH["Autenticación — index.html"]
        LOGIN[Formulario de login\nusuario + contraseña]
        LOGIN --> POST_LOGIN["POST /auth/login"]
        POST_LOGIN --> LDAP["Backend: bind LDAP contra AD\n{username}@itu.local"]
        LDAP --> ROL["Backend: rebind como svc-inventario\nbusca grupo del usuario\nTecnicos / Docentes / Alumnos"]
        ROL --> JWT_ERR{Credenciales\nválidas?}
        JWT_ERR -- No --> ERR_LOGIN["Error: 'Credenciales incorrectas'\nvuelve al formulario"]
        JWT_ERR -- Sí --> JWT_OK["Emite JWT (HS256, 60 min)\nguardado en localStorage"]
    end

    JWT_OK --> LISTADO

    subgraph NAV["Navegación principal — listado.html"]
        LISTADO["GET /inventario/\nTabla de todos los equipos"]
        LISTADO --> FILTROS["Filtros client-side:\ntipo (desktop/laptop) · ubicación"]
        FILTROS --> LISTADO
        LISTADO --> CLICK_EQUIPO["Click en un equipo"]
        LISTADO --> ROL_CHECK_NUEVO{rol == Tecnicos?}
        ROL_CHECK_NUEVO -- Sí --> BTN_NUEVO["Botón 'Nuevo equipo'"]
        ROL_CHECK_NUEVO -- No --> HIDDEN["Botón oculto"]
        BTN_NUEVO --> FORMULARIO_NUEVO
    end

    CLICK_EQUIPO --> DETALLE

    subgraph DET["Detalle — detalle.html"]
        DETALLE["GET /inventario/{id}\nDatos SQL Server + MongoDB combinados\n(equipo + ubicación + componentes + asignaciones)"]
        DETALLE --> ROL_DET{rol == Tecnicos?}
        ROL_DET -- No --> SOLO_LECTURA["Solo lectura\n(Docentes / Alumnos)"]
        ROL_DET -- Sí --> BTN_EDITAR["Botón 'Editar'"]
        ROL_DET -- Sí --> BTN_ELIMINAR["Botón 'Eliminar'"]
        BTN_EDITAR --> FORMULARIO_EDITAR
        BTN_ELIMINAR --> CONFIRM{"¿Confirmar\neliminar?"}
        CONFIRM -- No --> DETALLE
        CONFIRM -- Sí --> DELETE_REQ["DELETE /inventario/equipos/{id}\nDELETE /inventario/componentes/{id}"]
        DELETE_REQ --> LISTADO
    end

    subgraph FORM["Alta / Edición — formulario.html"]
        FORMULARIO_NUEVO["Formulario vacío\n(nuevo equipo)"]
        FORMULARIO_EDITAR["Formulario pre-cargado\n(editar equipo existente)"]

        FORMULARIO_NUEVO --> SUBMIT_NUEVO
        FORMULARIO_EDITAR --> SUBMIT_EDIT

        SUBMIT_NUEVO["POST /inventario/equipos\nPOST /inventario/componentes\n(mismo id_equipo)"]
        SUBMIT_EDIT["PUT /inventario/equipos/{id}\nPUT /inventario/componentes/{id}"]

        SUBMIT_NUEVO --> LISTADO
        SUBMIT_EDIT --> DETALLE
    end

    subgraph TOKEN["Control de sesión (todas las páginas)"]
        EXP{Token expirado\no 401?}
        EXP -- Sí --> LOGOUT_REDIR["Limpia localStorage\nredirige a index.html"]
        EXP -- No --> CONTINUA["Continúa con la operación"]
    end

    LISTADO -.->|"cada request\nfetchWithAuth()"| EXP
    DETALLE -.->|"cada request\nfetchWithAuth()"| EXP
    FORMULARIO_NUEVO -.->|"cada request\nfetchWithAuth()"| EXP
    FORMULARIO_EDITAR -.->|"cada request\nfetchWithAuth()"| EXP
```

---

## Roles y permisos

| Rol | Login | Ver listado | Ver detalle | Crear equipo | Editar equipo | Eliminar equipo |
|---|---|---|---|---|---|---|
| `Tecnicos` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `Docentes` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `Alumnos` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

Los roles se leen del JWT (`rol` claim). Los botones de escritura se ocultan
en el frontend si el rol no es `Tecnicos`. Los endpoints de escritura
(`POST/PUT/DELETE`) validan el rol también en el backend (`requiere_tecnico`
en `app/dependencies.py`), de modo que la restricción existe en las dos capas.

---

## Flujo de datos por operación

| Operación | Frontend | Backend | SQL Server | MongoDB |
|---|---|---|---|---|
| Login | `POST /auth/login` | bind LDAP → AD | — | — |
| Ver listado | `GET /inventario/` | `equipo_repo` + `computadora_repo` | `Equipo` + `Ubicacion` | `computadoras` (todos) |
| Ver detalle | `GET /inventario/{id}` | `inventario_service` | `Equipo` + `Ubicacion` + `Persona` + `Asignacion` + `Mantenimiento` | `computadoras` (por `id_equipo`) |
| Crear equipo | `POST /equipos` + `POST /componentes` | dos repos coordinados | INSERT en `Equipo` | insertOne en `computadoras` |
| Editar equipo | `PUT /equipos/{id}` + `PUT /componentes/{id}` | dos repos coordinados | UPDATE en `Equipo` | updateOne en `computadoras` |
| Eliminar equipo | `DELETE /equipos/{id}` | coordina ambas eliminaciones | DELETE en `Equipo` (cascade a `Asignacion`/`Mantenimiento`) | deleteOne en `computadoras` |
