# Cobertura de requisitos del proyecto

Verificación contra las exigencias del documento "Proyecto Integrador EGI:
Ecosistema de Inventario Seguro".

---

## Contexto / problema

| Requisito | Estado | Implementación |
|---|---|---|
| Sistema centralizado de inventario de computadoras | ✅ | Cubre todo el ciclo: ubicación física + componentes de hardware |
| SQL Server para ubicación, responsable y fechas | ✅ | `inventario_ubicaciones`: tablas `Equipo`, `Ubicacion`, `Persona`, `Asignacion`, `Mantenimiento` |
| MongoDB para componentes de hardware | ✅ | `inventario_componentes.computadoras`, 12 documentos con estructura variada (CPU, RAM, almacenamiento, SO, periféricos) |
| Autenticación contra Active Directory / LDAP | ✅ | FastAPI + ldap3, JWT HS256 60 min, roles `Tecnicos`/`Docentes`/`Alumnos` |
| Seguridad perimetral con pfSense | ✅ | NAT port-forward `WAN:80 → NodePort 30080`, autenticación de administradores contra AD (`pfAdmins`) |
| Versionado en Git con evolución visible | ✅ | Monorepo `MartinZ18/Proyecto-Inventario-EGI` con historial completo de cada capa |

---

## Arquitectura requerida (5 componentes)

| Componente | Estado | Detalle |
|---|---|---|
| Frontend (`inventario-web`) | ✅ | nginx + Bootstrap 5, NodePort 30080 |
| MongoDB (`inventario-db`) | ✅ | Pod en namespace `inventario`, colección `computadoras` |
| SQL Server (`ubicacion-db`) | ✅ | VM externa `192.168.56.20`, acceso por `sqlserver-service` (Endpoints K8s) |
| Servidor LDAP / AD | ✅ | DC01-ITU `192.168.56.10`, Endpoints K8s `ldap-service` |
| Firewall perimetral (pfSense) | ✅ | pfSense LAN `192.168.56.2`, NAT + autenticación AD |

---

## Desafíos técnicos

| Objetivo | Estado | Detalle |
|---|---|---|
| Conectividad interna (puertos, env vars, selectors) | ✅ | ConfigMap + Secret + Endpoints externos para SQL Server y LDAP |
| Acceso externo seguro simulando NAT de pfSense | ✅ | pfSense `WAN:80 → 30080` + port-forward VirtualBox `host:80 → WAN:80` |
| Zero-trust con NetworkPolicies | ✅ | 7 políticas Calico (00-06), default-deny, mínimo privilegio |
| DBs solo aceptan conexiones del backend | ✅ | Policy 04 (backend ← frontend) + Policy 06 (mongo ← backend) |
| MongoDB: colección con documentos variados | ✅ | 12 documentos: desktops, laptops, 1 servidor, 1 baja; estructuras distintas según tipo |
| MongoDB: búsquedas filtradas | ✅ | Frontend filtra por tipo y ubicación; `GET /inventario/{id}` devuelve detalle completo |
| MongoDB: actualizar registros | ✅ | `PUT /inventario/componentes/{id}` |
| MongoDB: eliminar datos | ✅ | `DELETE /inventario/componentes/{id}` |
| MongoDB accesible por shell | ✅ | `kubectl exec` + `mongosh` funcional |
| AD recibe tráfico de autenticación del backend | ✅ | Policy 05: egress backend → `ipBlock 192.168.56.0/24` :389 |
| Bloquear tráfico no autorizado en el namespace | ✅ | Policy 00 default-deny como base |
| Minikube con CNI compatible para NetworkPolicies | ✅ | `minikube start --cni=calico` |

---

## Entregables

| Entregable | Estado | Ubicación |
|---|---|---|
| Documentación del proyecto | ✅ | `docs/arquitectura.md`, `docs/topologia-red.md`, `docs/runbook-despliegue.md` |
| Esquema de arquitectura (servicios, puertos, reglas de red) | ✅ | `docs/arquitectura.md` — diagrama Mermaid + flujo de autenticación + matriz de puertos en `docs/topologia-red.md` |
| Esquema de BD (diseño previo + scripts + JSON) | ✅ | Scripts en `bases-de-datos/database/scripts/`; diagramas E-R y NoSQL en `bases-de-datos/database/diagramas/` |
| Flujograma de la aplicación web | ✅ | `docs/flujo-aplicacion.md` — diagrama Mermaid de navegación, roles, permisos y flujo de datos por operación |
| Repositorio Git con todo el código | ✅ | Monorepo `MartinZ18/Proyecto-Inventario-EGI`: `backend/`, `frontend/`, `bases-de-datos/`, infra |
| Scripts de creación de BD + documentos JSON | ✅ | `bases-de-datos/database/scripts/Script SQL Server 2022.sql` + `inventario-db_mongo.js` |
| Manifiestos de Kubernetes | ✅ | `kubernetes/`: deployments, services, configmaps, secrets, network-policies, namespace |
| Ecosistema funcional en Minikube | ✅ | Login AD funcional, 12 equipos en listado, detalle completo SQL+Mongo, CRUD operativo |
| Aplicación web de gestión de inventario | ✅ | CRUD completo, filtros por tipo y ubicación, detalle por equipo, campo mesa |
| Presentación formato PowerPoint | ⚠️ | Entregable separado — no se versiona en el repo |
