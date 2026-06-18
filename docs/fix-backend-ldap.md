# Fixes necesarios en el repo del backend

Repo: `Agus-tina/Proyecto-Inventario-EGI`, rama `backend`

---

## Archivo 1: `app/core/config.py`

Agregar estas dos líneas en la clase `Settings`, **antes** de
`ldap_user_dn_template`:

```python
ldap_bind_dn: str
ldap_bind_password: str
```

---

## Archivo 2: `app/services/ldap_service.py`

Dentro de la función `obtener_rol()`, reemplazar el bloque que:
1. Crea `admin_conn` con `cn=admin,...`
2. Hace `search` con `(member={user_dn})`

Por este bloque:

```python
admin_conn = Connection(
    server,
    user=settings.ldap_bind_dn,
    password=settings.ldap_bind_password,
    auto_bind=True,
)

admin_conn.search(
    search_base=settings.ldap_base_dn,
    search_filter=f"(userPrincipalName={user_dn})",
    search_scope=SUBTREE,
    attributes=["memberOf"],
)

rol = None
if admin_conn.entries:
    grupos_usuario = admin_conn.entries[0].entry_attributes_as_dict.get("memberOf", [])
    for grupo in ("Tecnicos", "Docentes", "Alumnos"):
        prefijo = f"cn={grupo},".lower()
        if any(dn.lower().startswith(prefijo) for dn in grupos_usuario):
            rol = grupo
            break
```

---

---

## Archivo 4: `app/repositories/equipo_repo.py`

Agregar el import de `Persona` junto a los que ya están arriba del archivo:

```python
from app.models.inventario import Equipo, Ubicacion, Persona
```

Luego agregar la función `get_personas` después de `get_ubicaciones`:

```python
def get_personas(db: Session) -> List[Persona]:
    return db.query(Persona).order_by(Persona.apellido).all()
```

---

## Archivo 5: `app/routers/inventario.py`

Agregar `PersonaOut` al import de schemas que ya existe en la línea que
empieza con `from app.schemas.inventario import ...`:

```python
from app.schemas.inventario import EquipoCreate, EquipoUpdate, EquipoOut, UbicacionOut, PersonaOut
```

Luego agregar el endpoint después del bloque de `/ubicaciones`:

```python
@router.get("/personas", response_model=List[PersonaOut])
def listar_personas(sql: Session = Depends(get_sql)):
    """Lista las personas disponibles para asignar a un equipo."""
    return inventario_service.equipo_repo.get_personas(sql)
```

---

## Por qué (LDAP)

El código actual hace el bind con `cn=admin,DC=itu,DC=local` y password
`"admin"` — esa cuenta no existe en Active Directory. Además busca los
grupos con `(member=mgomez@itu.local)` pero el atributo `member` en AD
guarda DNs completos (`CN=Maria Gomez,OU=User,...`), no UPNs, así que
siempre devuelve vacío y el login retorna 401.

El fix usa la cuenta de servicio `svc-inventario@itu.local` (que ya
está configurada en el ConfigMap como `LDAP_BIND_DN`) y lee el atributo
`memberOf` del usuario, que sí contiene los grupos en formato DN.

---

## Archivo 3: `scripts-dev/componentes_prueba.js`

Reemplazar el contenido completo con los 12 documentos reales del
inventario. El archivo actual solo tiene 2 documentos de prueba
(`id_equipo: 10` y `id_equipo: 20`).

El archivo canónico ya existe en la rama `bases-de-datos` del mismo
repo (`Agus-tina/Proyecto-Inventario-EGI`):

```
database/scripts/inventario-db_mongo.js
```

Ese archivo define la colección con validador `$jsonSchema`, índices y
los 12 documentos. **Ojo:** la última línea tiene un error cosmético —
dice `db.componentes.countDocuments()` pero debería ser
`db.computadoras.countDocuments()` (no afecta a los datos, solo al
print de confirmación).

El seed del workflow llama:
```bash
mongosh -u $MONGO_USER -p $MONGO_PASS --authenticationDatabase admin /tmp/seed.js
```
donde `/tmp/seed.js` es una copia de `scripts-dev/componentes_prueba.js`.
Con los 12 documentos, el seed queda completo desde el primer deploy.
