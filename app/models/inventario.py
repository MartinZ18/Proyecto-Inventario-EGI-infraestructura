"""
Modelos SQLAlchemy del inventario (tablas de SQL Server).
Refleja el modelo relacional normalizado diseñado por el equipo de bases
de datos. Cinco entidades relacionadas:
  - Ubicacion: dónde puede estar un equipo (aula, laboratorio, etc.).
  - Equipo: la máquina física. Su id es el PUENTE con MongoDB.
  - Persona: técnicos, docentes y alumnos.
  - Asignacion: vincula temporalmente una persona con un equipo.
  - Mantenimiento: registro de mantenimientos hechos por un técnico.

El id_equipo (Integer) es el identificador que se usa para buscar los componentes de la máquina en MongoDB.
"""

from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db.sql_server import Base

class Ubicacion(Base):
    __tablename__ = "ubicaciones"
    id_ubicacion = Column(Integer, primary_key=True, index=True, autoincrement=False)
    nombre = Column(String(100), nullable=False)
    tipo = Column(String(20), nullable=False)        # AULA | LABORATORIO | BIBLIOTECA | OFICINA
    edificio = Column(String(50), nullable=True)
    piso = Column(Integer, nullable=True)
    # Una ubicación puede tener muchos equipos.
    equipos = relationship("Equipo", back_populates="ubicacion")

class Equipo(Base):
    __tablename__ = "equipos"
    id_equipo = Column(Integer, primary_key=True, index=True, autoincrement=False)
    id_ubicacion = Column(Integer, ForeignKey("ubicaciones.id_ubicacion"), nullable=False)
    mesa = Column(String(20), nullable=True)          # ej. "A-01"
    estado = Column(String(50), nullable=True)
    fecha_alta = Column(Date, nullable=True)
    ubicacion = relationship("Ubicacion", back_populates="equipos")
    asignaciones = relationship("Asignacion", back_populates="equipo", cascade="all, delete-orphan")
    mantenimientos = relationship("Mantenimiento", back_populates="equipo", cascade="all, delete-orphan")

class Persona(Base):
    __tablename__ = "personas"
    id_persona = Column(Integer, primary_key=True, index=True, autoincrement=False)
    nombre = Column(String(80), nullable=False)
    apellido = Column(String(80), nullable=False)
    dni = Column(String(20), nullable=True)
    email = Column(String(120), nullable=True)
    rol = Column(String(20), nullable=False)         # TECNICO | DOCENTE | ALUMNO | ADMINISTRADOR

class Asignacion(Base):
    __tablename__ = "asignaciones"
    id_asignacion = Column(Integer, primary_key=True, index=True, autoincrement=False)
    id_equipo = Column(Integer, ForeignKey("equipos.id_equipo"), nullable=False)
    id_persona = Column(Integer, ForeignKey("personas.id_persona"), nullable=False)
    tipo_asignacion = Column(String(20), nullable=True)   # coincide con el rol asignado
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin = Column(Date, nullable=True)               # null = asignación vigente
    equipo = relationship("Equipo", back_populates="asignaciones")
    persona = relationship("Persona")

class Mantenimiento(Base):
    __tablename__ = "mantenimientos"
    id_mantenimiento = Column(Integer, primary_key=True, index=True, autoincrement=False)
    id_equipo = Column(Integer, ForeignKey("equipos.id_equipo"), nullable=False)
    fecha = Column(Date, nullable=True)
    tipo = Column(String(20), nullable=True)              # PREVENTIVO | CORRECTIVO
    descripcion = Column(String(255), nullable=True)
    id_tecnico = Column(Integer, ForeignKey("personas.id_persona"), nullable=False)
    equipo = relationship("Equipo", back_populates="mantenimientos")
    tecnico = relationship("Persona")