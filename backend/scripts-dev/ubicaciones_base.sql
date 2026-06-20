USE inventario_ubicaciones;
GO

DELETE FROM ubicaciones;
GO

INSERT INTO ubicaciones (id_ubicacion, nombre, tipo, edificio, piso) VALUES
    (1, 'Laboratorio 1', 'LABORATORIO', 'Edificio A', 1),
    (2, 'Laboratorio 2', 'LABORATORIO', 'Edificio A', 1),
    (3, 'Laboratorio 3', 'LABORATORIO', 'Edificio B', 2),
    (4, 'Laboratorio 4', 'LABORATORIO', 'Edificio B', 2);
GO