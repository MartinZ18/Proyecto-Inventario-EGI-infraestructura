// ============================================================
// DATOS DE PRUEBA - SOLO DESARROLLO LOCAL
// Estructura según el diseño de inventario-db (MongoDB).
// id_equipo es el puente con SQL Server.
// ============================================================

db = db.getSiblingDB("inventario_componentes");
db.computadoras.drop();

db.computadoras.insertMany([
  {
    id_equipo: 10,
    tipo: "desktop",
    codigo_inventario: "INV-0010",
    fabricante: "Dell",
    modelo: "OptiPlex 7090",
    sistema_operativo: { nombre: "Windows 11 Pro", version: "23H2", arquitectura: "x64" },
    cpu: { fabricante: "Intel", modelo: "Core i5-11500", nucleos: 6, frecuencia_ghz: 2.7 },
    ram: [
      { fabricante: "Kingston", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 3200 },
      { fabricante: "Kingston", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 3200 }
    ],
    almacenamiento: [
      { tipo: "SSD", capacidad_gb: 512, fabricante: "Samsung", modelo: "980" }
    ],
    perifericos: {
      monitor: { fabricante: "Dell", modelo: "P2422H", pulgadas: 24 },
      teclado: { fabricante: "Dell", conexion: "USB" },
      mouse: { fabricante: "Dell", conexion: "USB" }
    }
  },
  {
    id_equipo: 20,
    tipo: "laptop",
    codigo_inventario: "INV-0020",
    fabricante: "Lenovo",
    modelo: "ThinkPad E14",
    observacion: "Asignada a sala de profesores",
    sistema_operativo: { nombre: "Ubuntu", version: "22.04 LTS", arquitectura: "x64" },
    cpu: { fabricante: "AMD", modelo: "Ryzen 5 5500U", nucleos: 6, frecuencia_ghz: 2.1 },
    gpu: { fabricante: "AMD", modelo: "Radeon Vega 7", memoria_gb: null },
    ram: [
      { fabricante: "Samsung", capacidad_gb: 16, tipo: "DDR4", frecuencia_mhz: 3200 }
    ],
    almacenamiento: [
      { tipo: "SSD", capacidad_gb: 256, fabricante: "WD", modelo: "SN530" }
    ],
    bateria: { estado: "bueno", ciclos: 120 },
    pantalla_integrada: { pulgadas: 14.0, resolucion: "1920x1080" }
  }
]);

print("Insertados: " + db.computadoras.countDocuments());