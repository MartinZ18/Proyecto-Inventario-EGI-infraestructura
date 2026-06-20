-- ============================================================
-- DATOS DE PRUEBA - SOLO DESARROLLO LOCAL
-- Refleja el modelo relacional de 5 tablas del equipo de BD.
-- Las tablas las crea el back (create_all); este script solo inserta datos.
-- ============================================================

USE inventario_ubicaciones;
GO

-- Limpiar en orden inverso a las dependencias (por las foreign keys)
DELETE FROM mantenimientos;
DELETE FROM asignaciones;
DELETE FROM equipos;
DELETE FROM personas;
DELETE FROM ubicaciones;
GO

-- Ubicaciones
INSERT INTO ubicaciones (id_ubicacion, nombre, tipo, edificio, piso) VALUES
    (1, 'Aula 101', 'AULA', 'Edificio A', 1),
    (2, 'Laboratorio de Redes', 'LABORATORIO', 'Edificio B', 2);
GO

-- Personas (2 técnicos, 1 docente, 1 alumno)
INSERT INTO personas (id_persona, nombre, apellido, dni, email, rol) VALUES
    (1, 'Carlos', 'Gomez', '30111222', 'cgomez@itu.edu.ar', 'TECNICO'),
    (2, 'Laura', 'Diaz', '28999444', 'ldiaz@itu.edu.ar', 'TECNICO'),
    (3, 'Marta', 'Lopez', '25777888', 'mlopez@itu.edu.ar', 'DOCENTE'),
    (4, 'Juan', 'Perez', '40555666', 'jperez@itu.edu.ar', 'ALUMNO');
GO

-- Equipos (id_equipo es el puente con MongoDB)
INSERT INTO equipos (id_equipo, id_ubicacion, estado, fecha_alta) VALUES
    (1, 1, 'operativo', '2025-03-01'),
    (2, 2, 'operativo', '2025-04-15'),
    (3, 2, 'en reparacion', '2025-02-10');
GO

-- Asignaciones (equipo 1 asignado a la docente; equipo 3 a un alumno)
INSERT INTO asignaciones (id_asignacion, id_equipo, id_persona, tipo_asignacion, fecha_inicio, fecha_fin) VALUES
    (1, 1, 3, 'DOCENTE', '2026-03-01', NULL),
    (2, 3, 4, 'ALUMNO', '2026-04-01', '2026-04-30');
GO

-- Mantenimientos (hechos por técnicos)
INSERT INTO mantenimientos (id_mantenimiento, id_equipo, fecha, tipo, descripcion, id_tecnico) VALUES
    (1, 1, '2026-03-15', 'PREVENTIVO', 'Limpieza y actualizacion de SO', 1),
    (2, 3, '2026-02-20', 'CORRECTIVO', 'Reemplazo de disco danado', 2);
GO