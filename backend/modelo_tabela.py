from sqlmodel import SQLModel, Field
from typing import Optional

# Tabela de Usuários (Corretores e Admins)
class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    email: str = Field(unique=True, index=True)
    senha_hash: str # NUNCA guarde a senha normal, apenas o hash!
    cargo: str = Field(default="corretor") # Pode ser "corretor" ou "admin"

# Tabela de Clientes
class Cliente(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    cpf_cnpj: str
    