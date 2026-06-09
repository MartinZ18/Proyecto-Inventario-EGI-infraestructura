"""
Dependencies de FastAPI: piezas reutilizables que se inyectan en los endpoints.

Centraliza las sesiones de base de datos y el control de acceso:
  - get_current_user: exige token válido (autenticación).
  - requiere_tecnico: exige además rol de técnico (autorización / RBAC).
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pymongo.database import Database

from app.db.sql_server import get_sql_session
from app.db.mongo import get_mongo_db
from app.core.security import verificar_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ---- Bases de datos ----

def get_sql(db: Session = Depends(get_sql_session)) -> Session:
    """Entrega una sesión de SQL Server."""
    return db


def get_mongo() -> Database:
    """Entrega la base de datos de MongoDB."""
    return get_mongo_db()


# ---- Usuario autenticado ----

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Valida el token JWT y devuelve los datos del usuario (username y rol).
    Si el token falta, está manipulado o expiró, corta con 401.
    """
    datos = verificar_token(token)
    if datos is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return datos


# ---- Control de acceso por rol (RBAC) ----

def requiere_tecnico(usuario: dict = Depends(get_current_user)) -> dict:
    """
    Solo permite el paso si el usuario tiene rol 'Tecnicos'.
    Cualquier otro rol recibe 403 (autenticado pero sin permiso).
    """
    if usuario.get("rol") != "Tecnicos":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los técnicos pueden realizar esta acción",
        )
    return usuario