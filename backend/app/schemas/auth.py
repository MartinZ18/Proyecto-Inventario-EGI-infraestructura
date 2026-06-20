"""
Schemas de autenticación: definen la forma del login y del token.
"""

from typing import Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Credenciales que envía el usuario para autenticarse contra LDAP."""
    username: str
    password: str


class Token(BaseModel):
    """Token JWT que devuelve la API tras un login exitoso."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Datos que viajan dentro del token (se extraen al validarlo)."""
    username: Optional[str] = None