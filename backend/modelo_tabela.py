from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import date

# 1. Tabela de Usuários (Corretores e Admins)
class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    email: str = Field(unique=True, index=True)
    senha_hash: str
    cargo: str = Field(default="corretor") # "corretor" ou "admin"
    comissao_padrao: Optional[float] = Field(default=None)
    
    # Relacionamento: Um corretor pode ter vários contratos
    contratos: List["Contrato"] = Relationship(back_populates="corretor")

# 2. Tabela de Produtores (Vendedores)
class Produtor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome_razao: str
    cpf_cnpj: str = Field(unique=True, index=True)
    inscricao_estadual: Optional[str] = None
    telefone: Optional[str] = None
    whatsapp: str # Muito importante para o envio automático
    email: Optional[str] = None
    endereco: Optional[str] = None
    cep: Optional[str] = None
    cidade: str
    estado: str
    
    # Relacionamento: Um produtor tem várias fazendas e contratos
    fazendas: List["Fazenda"] = Relationship(back_populates="produtor")
    contratos: List["Contrato"] = Relationship(back_populates="produtor")

# 3. Tabela de Fazendas (Ligadas ao Produtor)
class Fazenda(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    inscricao_estadual: Optional[str] = None
    cidade: str
    estado: str
    
    # A Mágica do Select Dinâmico: Chave Estrangeira ligando ao Produtor
    produtor_id: int = Field(foreign_key="produtor.id")
    produtor: Optional[Produtor] = Relationship(back_populates="fazendas")
    
    contratos: List["Contrato"] = Relationship(back_populates="fazenda_origem")

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