from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import date, datetime

# 1. Tabela de Usuários (Corretores e Admins)
class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    email: str = Field(unique=True, index=True)
    senha_hash: str
    cargo: str = Field(default="corretor") # "corretor" ou "admin"
    comissao_padrao: Optional[float] = Field(default=None)

    reset_token: Optional[str] = Field(default=None)
    reset_token_expires: Optional[datetime] = Field(default=None)
    
    # Relacionamento: Um corretor pode ter vários contratos
    contratos: List["Contrato"] = Relationship(back_populates="corretor")

class Produtor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    whatsapp: str
    
    # Vínculos
    fazendas: List["Fazenda"] = Relationship(back_populates="produtor")
    ofertas: List["Oferta"] = Relationship(back_populates="produtor")
    contratos: List["Contrato"] = Relationship(back_populates="produtor") # <- CORREÇÃO AQUI

class Fazenda(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    
    # Dependência de criação (A fazenda não existe sem um produtor)
    produtor_id: int = Field(foreign_key="produtor.id")
    produtor: Optional[Produtor] = Relationship(back_populates="fazendas")
    
    # Vínculos
    ofertas: List["Oferta"] = Relationship(back_populates="fazenda")
    contratos: List["Contrato"] = Relationship(back_populates="fazenda_origem") # <- CORREÇÃO AQUI

# ---------------------------------------------------------
# 2. OBJETO: OFERTA
# ---------------------------------------------------------

class Oferta(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # DEPENDÊNCIAS (Chaves Estrangeiras)
    produtor_id: int = Field(foreign_key="produtor.id", index=True)
    fazenda_id: int = Field(foreign_key="fazenda.id", index=True)
    
    # DADOS DA OFERTA
    volume: int = Field(description="Quantidade em sacas (ex: 5000)")
    preco: float = Field(description="Preço ofertado por saca")
    moeda: str = Field(default="BRL", max_length=3, description="Moeda da negociação, ex: BRL, USD")
    data_entrega_embarque: date = Field(description="Data limite ou programada para entrega/embarque")
    
    # RELACIONAMENTOS ORM
    produtor: Optional[Produtor] = Relationship(back_populates="ofertas")
    fazenda: Optional[Fazenda] = Relationship(back_populates="ofertas")

# 4. Tabela de Empresas Compradoras (Tradings)
class Empresa(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    razao_social: str
    cnpj: str = Field(unique=True, index=True)
    inscricao_estadual: Optional[str] = None
    contato_nome: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None
    
    contratos: List["Contrato"] = Relationship(back_populates="empresa_compradora")
    compradores: List["Comprador"] = Relationship(back_populates="empresa")

class Comprador(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    email: str = Field(unique=True, index=True)
    telefone: str
    
    # Relação com a Empresa (Chave Estrangeira)
    empresa_id: int = Field(foreign_key="empresa.id", index=True)
    empresa: Optional[Empresa] = Relationship(back_populates="compradores")

# 5. O Coração do Sistema: Contratos de Fechamento
class Contrato(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    data_fechamento: date
    commodity: str # "Soja" ou "Milho"
    safra: str # Ex: "2025/2026"
    volume: float
    tipo_medida: str # "Sacas" ou "Toneladas"
    moeda: str # "BRL" ou "USD"
    preco_unitario: float
    valor_total: float # Calculado (Volume x Preço)
    tipo_frete: str # "CIF Armazém" ou "FOB Fazenda"
    data_entrega: Optional[date] = None
    data_pagamento: Optional[date] = None
    numero_contrato_trading: Optional[str] = None
    comissao_porcentagem: float
    valor_comissao: float
    status: str = Field(default="Fechado") # Fechado, Emitido, Concluído, Cancelado
    observacoes: Optional[str] = None

    # Chaves Estrangeiras (Quem fez, quem vendeu, de onde saiu, quem comprou)
    usuario_id: int = Field(foreign_key="usuario.id")
    corretor: Optional[Usuario] = Relationship(back_populates="contratos")
    
    produtor_id: int = Field(foreign_key="produtor.id")
    produtor: Optional[Produtor] = Relationship(back_populates="contratos")
    
    fazenda_id: int = Field(foreign_key="fazenda.id")
    fazenda_origem: Optional[Fazenda] = Relationship(back_populates="contratos")
    
    empresa_id: int = Field(foreign_key="empresa.id")
    empresa_compradora: Optional[Empresa] = Relationship(back_populates="contratos")