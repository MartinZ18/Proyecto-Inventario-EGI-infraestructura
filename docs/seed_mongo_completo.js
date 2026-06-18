const col = db.getSiblingDB('inventario_componentes').computadoras;
col.drop();

col.insertMany([
  {
    id_equipo: 1, tipo: "desktop", codigo_inventario: "INV-0001",
    fabricante: "HP", modelo: "EliteDesk 800 G6", observacion: null,
    cpu: { fabricante: "Intel", modelo: "Core i5-10500", nucleos: 6, frecuencia_ghz: 3.1 },
    gpu: null,
    ram: [{ fabricante: "Kingston", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 2666 },
          { fabricante: "Kingston", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 2666 }],
    almacenamiento: [{ tipo: "SSD", capacidad_gb: 256, fabricante: "Samsung", modelo: "870 EVO" }],
    sistema_operativo: { nombre: "Windows 10 Pro", version: "22H2", arquitectura: "x64" },
    perifericos: { monitor: { fabricante: "HP", modelo: "P24h G4", pulgadas: 23.8 },
                   teclado: { fabricante: "HP", conexion: "USB" }, mouse: { fabricante: "HP", conexion: "USB" } },
    bateria: null, pantalla_integrada: null
  },
  {
    id_equipo: 2, tipo: "desktop", codigo_inventario: "INV-0002",
    fabricante: "HP", modelo: "EliteDesk 800 G6", observacion: null,
    cpu: { fabricante: "Intel", modelo: "Core i5-10500", nucleos: 6, frecuencia_ghz: 3.1 },
    gpu: null,
    ram: [{ fabricante: "Kingston", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 2666 },
          { fabricante: "Kingston", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 2666 }],
    almacenamiento: [{ tipo: "SSD", capacidad_gb: 256, fabricante: "Samsung", modelo: "870 EVO" }],
    sistema_operativo: { nombre: "Windows 10 Pro", version: "22H2", arquitectura: "x64" },
    perifericos: { monitor: { fabricante: "HP", modelo: "P24h G4", pulgadas: 23.8 },
                   teclado: { fabricante: "HP", conexion: "USB" }, mouse: { fabricante: "HP", conexion: "USB" } },
    bateria: null, pantalla_integrada: null
  },
  {
    id_equipo: 3, tipo: "desktop", codigo_inventario: "INV-0003",
    fabricante: "Dell", modelo: "OptiPlex 5090", observacion: null,
    cpu: { fabricante: "Intel", modelo: "Core i5-10505", nucleos: 6, frecuencia_ghz: 3.2 },
    gpu: null,
    ram: [{ fabricante: "Samsung", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 2933 }],
    almacenamiento: [{ tipo: "SSD", capacidad_gb: 512, fabricante: "Western Digital", modelo: "SN530" }],
    sistema_operativo: { nombre: "Ubuntu", version: "22.04 LTS", arquitectura: "x64" },
    perifericos: { monitor: { fabricante: "Dell", modelo: "E2422H", pulgadas: 24.0 },
                   teclado: { fabricante: "Dell", conexion: "USB" }, mouse: { fabricante: "Dell", conexion: "USB" } },
    bateria: null, pantalla_integrada: null
  },
  {
    id_equipo: 4, tipo: "desktop", codigo_inventario: "INV-0004",
    fabricante: "Lenovo", modelo: "ThinkCentre M70q", observacion: null,
    cpu: { fabricante: "Intel", modelo: "Core i3-10105T", nucleos: 4, frecuencia_ghz: 3.0 },
    gpu: null,
    ram: [{ fabricante: "Micron", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 2666 }],
    almacenamiento: [{ tipo: "SSD", capacidad_gb: 256, fabricante: "Samsung", modelo: "PM991a" }],
    sistema_operativo: { nombre: "Windows 11 Pro", version: "23H2", arquitectura: "x64" },
    perifericos: { monitor: { fabricante: "Lenovo", modelo: "T24i-20", pulgadas: 23.8 },
                   teclado: { fabricante: "Lenovo", conexion: "USB" }, mouse: { fabricante: "Lenovo", conexion: "USB" } },
    bateria: null, pantalla_integrada: null
  },
  {
    id_equipo: 5, tipo: "desktop", codigo_inventario: "INV-0005",
    fabricante: "HP", modelo: "ProDesk 400 G7",
    observacion: "Falla en la placa de video integrada, pendiente de reemplazo",
    cpu: { fabricante: "Intel", modelo: "Core i5-10500", nucleos: 6, frecuencia_ghz: 3.1 },
    gpu: null,
    ram: [{ fabricante: "Kingston", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 2666 }],
    almacenamiento: [{ tipo: "HDD", capacidad_gb: 1000, fabricante: "Seagate", modelo: "Barracuda" }],
    sistema_operativo: { nombre: "Windows 10 Pro", version: "22H2", arquitectura: "x64" },
    perifericos: { monitor: { fabricante: "HP", modelo: "V24i G5", pulgadas: 23.8 },
                   teclado: { fabricante: "HP", conexion: "USB" }, mouse: { fabricante: "HP", conexion: "USB" } },
    bateria: null, pantalla_integrada: null
  },
  {
    id_equipo: 6, tipo: "desktop", codigo_inventario: "INV-0006",
    fabricante: "Dell", modelo: "OptiPlex 7090", observacion: null,
    cpu: { fabricante: "Intel", modelo: "Core i7-10700", nucleos: 8, frecuencia_ghz: 2.9 },
    gpu: null,
    ram: [{ fabricante: "Kingston", capacidad_gb: 16, tipo: "DDR4", frecuencia_mhz: 2933 }],
    almacenamiento: [{ tipo: "SSD", capacidad_gb: 512, fabricante: "Samsung", modelo: "980" }],
    sistema_operativo: { nombre: "Windows 11 Pro", version: "23H2", arquitectura: "x64" },
    perifericos: { monitor: { fabricante: "Dell", modelo: "P2422H", pulgadas: 24.0 },
                   teclado: { fabricante: "Dell", conexion: "USB" }, mouse: { fabricante: "Dell", conexion: "USB" } },
    bateria: null, pantalla_integrada: null
  },
  {
    id_equipo: 7, tipo: "laptop", codigo_inventario: "INV-0007",
    fabricante: "Lenovo", modelo: "ThinkPad E14 Gen 4", observacion: null,
    cpu: { fabricante: "Intel", modelo: "Core i5-1235U", nucleos: 10, frecuencia_ghz: 1.3 },
    gpu: null,
    ram: [{ fabricante: "Samsung", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 3200 }],
    almacenamiento: [{ tipo: "SSD", capacidad_gb: 256, fabricante: "Samsung", modelo: "PM9A1" }],
    sistema_operativo: { nombre: "Windows 11 Pro", version: "23H2", arquitectura: "x64" },
    perifericos: null,
    bateria: { capacidad_mah: 45000, ciclos: 87 },
    pantalla_integrada: { pulgadas: 14.0, resolucion: "1920x1080", tipo: "IPS" }
  },
  {
    id_equipo: 8, tipo: "desktop", codigo_inventario: "INV-0008",
    fabricante: "Dell", modelo: "OptiPlex 5090", observacion: null,
    cpu: { fabricante: "Intel", modelo: "Core i5-10505", nucleos: 6, frecuencia_ghz: 3.2 },
    gpu: null,
    ram: [{ fabricante: "Samsung", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 2933 },
          { fabricante: "Samsung", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 2933 }],
    almacenamiento: [{ tipo: "SSD", capacidad_gb: 512, fabricante: "Western Digital", modelo: "SN530" }],
    sistema_operativo: { nombre: "Ubuntu", version: "22.04 LTS", arquitectura: "x64" },
    perifericos: { monitor: { fabricante: "Dell", modelo: "E2422H", pulgadas: 24.0 },
                   teclado: { fabricante: "Dell", conexion: "USB" }, mouse: { fabricante: "Dell", conexion: "USB" } },
    bateria: null, pantalla_integrada: null
  },
  {
    id_equipo: 9, tipo: "desktop", codigo_inventario: "INV-0009",
    fabricante: "Lenovo", modelo: "ThinkCentre M70q", observacion: null,
    cpu: { fabricante: "Intel", modelo: "Core i3-10105T", nucleos: 4, frecuencia_ghz: 3.0 },
    gpu: null,
    ram: [{ fabricante: "Micron", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 2666 }],
    almacenamiento: [{ tipo: "SSD", capacidad_gb: 256, fabricante: "Samsung", modelo: "PM991a" }],
    sistema_operativo: { nombre: "Windows 11 Pro", version: "23H2", arquitectura: "x64" },
    perifericos: { monitor: { fabricante: "Lenovo", modelo: "T24i-20", pulgadas: 23.8 },
                   teclado: { fabricante: "Lenovo", conexion: "USB" }, mouse: { fabricante: "Lenovo", conexion: "USB" } },
    bateria: null, pantalla_integrada: null
  },
  {
    id_equipo: 10, tipo: "desktop", codigo_inventario: "INV-0010",
    fabricante: "Dell", modelo: "OptiPlex 7090", observacion: null,
    cpu: { fabricante: "Intel", modelo: "Core i5-11500", nucleos: 6, frecuencia_ghz: 2.7 },
    gpu: null,
    ram: [{ fabricante: "Kingston", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 3200 },
          { fabricante: "Kingston", capacidad_gb: 8, tipo: "DDR4", frecuencia_mhz: 3200 }],
    almacenamiento: [{ tipo: "SSD", capacidad_gb: 512, fabricante: "Samsung", modelo: "980" }],
    sistema_operativo: { nombre: "Windows 11 Pro", version: "23H2", arquitectura: "x64" },
    perifericos: { monitor: { fabricante: "Dell", modelo: "P2422H", pulgadas: 24.0 },
                   teclado: { fabricante: "Dell", conexion: "USB" }, mouse: { fabricante: "Dell", conexion: "USB" } },
    bateria: null, pantalla_integrada: null
  },
  {
    id_equipo: 11, tipo: "desktop", codigo_inventario: "INV-0011",
    fabricante: "HP", modelo: "ProLiant ML30 Gen10 Plus",
    observacion: "Servidor de archivos y backups del laboratorio",
    cpu: { fabricante: "Intel", modelo: "Xeon E-2314", nucleos: 4, frecuencia_ghz: 2.8 },
    gpu: null,
    ram: [{ fabricante: "HPE", capacidad_gb: 16, tipo: "DDR4 ECC", frecuencia_mhz: 3200 },
          { fabricante: "HPE", capacidad_gb: 16, tipo: "DDR4 ECC", frecuencia_mhz: 3200 }],
    almacenamiento: [{ tipo: "HDD", capacidad_gb: 4000, fabricante: "Seagate", modelo: "IronWolf" },
                     { tipo: "HDD", capacidad_gb: 4000, fabricante: "Seagate", modelo: "IronWolf" }],
    sistema_operativo: { nombre: "Windows Server 2022", version: "21H2", arquitectura: "x64" },
    perifericos: null, bateria: null, pantalla_integrada: null
  },
  {
    id_equipo: 12, tipo: "desktop", codigo_inventario: "INV-0012",
    fabricante: "HP", modelo: "Compaq 6200 Pro",
    observacion: "Dado de baja por obsolescencia. CPU y RAM incompatibles con software actual",
    cpu: { fabricante: "Intel", modelo: "Core i3-2120", nucleos: 2, frecuencia_ghz: 3.3 },
    gpu: null,
    ram: [{ fabricante: "Kingston", capacidad_gb: 4, tipo: "DDR3", frecuencia_mhz: 1333 }],
    almacenamiento: [{ tipo: "HDD", capacidad_gb: 500, fabricante: "Seagate", modelo: "Barracuda" }],
    sistema_operativo: { nombre: "Windows 7 Pro", version: "SP1", arquitectura: "x64" },
    perifericos: { monitor: { fabricante: "HP", modelo: "LE1902x", pulgadas: 18.5 },
                   teclado: { fabricante: "HP", conexion: "USB" }, mouse: { fabricante: "HP", conexion: "USB" } },
    bateria: null, pantalla_integrada: null
  }
]);

print("Total insertados:", db.getSiblingDB('inventario_componentes').computadoras.countDocuments());
