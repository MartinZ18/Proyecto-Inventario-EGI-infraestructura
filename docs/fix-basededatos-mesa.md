# Fix necesario en el repo de bases de datos

Repo: `Agus-tina/Proyecto-Inventario-EGI`, rama `bases-de-datos`

---

## Archivo: `database/scripts/Script SQL Server 2022.sql`

El `INSERT INTO Equipo` no incluye el campo `mesa`, por lo que todos los
equipos quedan con `NULL`. El frontend ya soporta mostrar y editar ese
campo, así que conviene que el seed lo cargue con valores reales.

**Reemplazar:**

```sql
INSERT INTO Equipo (id_ubicacion, estado, fecha_alta) VALUES
  ( 4, 'OPERATIVO',     '2023-03-15'),  -- 1  desktop
  ( 4, 'OPERATIVO',     '2023-03-15'),  -- 2  desktop
  ( 3, 'OPERATIVO',     '2023-04-01'),  -- 3  laptop
  ( 1, 'OPERATIVO',     '2023-05-10'),  -- 4  desktop
  ( 8, 'EN_REPARACION', '2022-08-20'),  -- 5  desktop
  ( 6, 'OPERATIVO',     '2024-01-12'),  -- 6  laptop
  ( 5, 'OPERATIVO',     '2023-09-05'),  -- 7  desktop
  ( 3, 'OPERATIVO',     '2024-02-28'),  -- 8  laptop
  ( 7, 'OPERATIVO',     '2023-11-11'),  -- 9  desktop
  ( 9, 'OPERATIVO',     '2024-03-01'),  -- 10 laptop
  (11, 'OPERATIVO',     '2022-06-30'),  -- 11 desktop
  (10, 'BAJA',          '2021-04-18');  -- 12 laptop
```

**Por:**

```sql
INSERT INTO Equipo (id_ubicacion, mesa, estado, fecha_alta) VALUES
  ( 4, 'M-01', 'OPERATIVO',     '2023-03-15'),  -- 1  desktop  Lab Software
  ( 4, 'M-02', 'OPERATIVO',     '2023-03-15'),  -- 2  desktop  Lab Software
  ( 3, 'M-01', 'OPERATIVO',     '2023-04-01'),  -- 3  laptop   Lab Redes
  ( 1, 'M-01', 'OPERATIVO',     '2023-05-10'),  -- 4  desktop  Aula 101
  ( 8, NULL,   'EN_REPARACION', '2022-08-20'),  -- 5  desktop  Lab Hardware (en reparacion, sin mesa asignada)
  ( 6, 'M-01', 'OPERATIVO',     '2024-01-12'),  -- 6  laptop   Oficina Sistemas
  ( 5, 'M-01', 'OPERATIVO',     '2023-09-05'),  -- 7  desktop  Biblioteca
  ( 3, 'M-02', 'OPERATIVO',     '2024-02-28'),  -- 8  laptop   Lab Redes
  ( 7, 'M-01', 'OPERATIVO',     '2023-11-11'),  -- 9  desktop  Aula 201
  ( 9, 'M-01', 'OPERATIVO',     '2024-03-01'),  -- 10 laptop   Oficina Direccion
  (11, NULL,   'OPERATIVO',     '2022-06-30'),  -- 11 desktop  Sala Servidores (servidor de rack, sin mesa)
  (10, NULL,   'BAJA',          '2021-04-18');  -- 12 laptop   Aula Magna (dado de baja, sin mesa)
```

---

## Por qué

El campo `mesa` identifica el número de banco/puesto dentro del aula o
laboratorio (ej. `M-01`, `M-02`). El contexto del proyecto lo menciona
explícitamente ("número de banco/mesa") y el frontend ahora lo muestra
en el formulario y en el detalle del equipo.

Los equipos `EN_REPARACION`, `BAJA` y el servidor de rack (`id=11`)
tienen `NULL` porque no tienen un puesto fijo asignado.
