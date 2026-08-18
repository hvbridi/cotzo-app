from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import date, datetime
from zoneinfo import ZoneInfo

# 1. Tabela de Usuários (Corretores e Admins)
class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    email: str = Field(unique=True, index=True)
    telefone: str
    senha_hash: str
    cargo: str = Field(default="corretor") # "corretor" ou "admin"
    comissao_padrao: Optional[float] = Field(default=None)

    reset_token: Optional[str] = Field(default=None)
    reset_token_expires: Optional[datetime] = Field(default=None)
    
    # Relacionamento: Um corretor pode ter vários contratos
    contratos: List["Contrato"] = Relationship(back_populates="corretor")

class Produtor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuario.id")
    nome: str
    whatsapp: str
    cpf_cnpj: Optional[str] = None 
    cidade: Optional[str] = None
    uf: Optional[str] = None
    # Vínculos
    fazendas: List["Fazenda"] = Relationship(back_populates="produtor")
    ofertas: List["Oferta"] = Relationship(back_populates="produtor")
    contratos: List["Contrato"] = Relationship(back_populates="produtor") # <- CORREÇÃO AQUI

class Fazenda(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuario.id")
    nome: str
    
    # 👇 NOVOS CAMPOS LOGÍSTICOS E CADASTRAIS
    telefone: Optional[str] = None
    condicao_frete: Optional[str] = Field(default=None, description="'FOB Fazenda' ou 'CIF Armazém'")
    inscricao_estadual: Optional[str] = None
    coordenadas: Optional[str] = Field(default=None, description="Ex: -15.793889, -47.882778")
    municipio: Optional[str] = None
    descricao_roteiro: Optional[str] = None
    
    # Campos que você já tinha colocado
    capacidade_carregamento: Optional[int] = None # Ex: 50 (toneladas)
    comprimento_balanca: Optional[float] = None
    
    # Dependência de criação (A fazenda não existe sem um produtor)
    produtor_id: int = Field(foreign_key="produtor.id")
    produtor: Optional[Produtor] = Relationship(back_populates="fazendas")
    
    # Vínculos
    ofertas: List["Oferta"] = Relationship(back_populates="fazenda")
    contratos: List["Contrato"] = Relationship(back_populates="fazenda_origem")

# --------------------------------------------------------
# 2. OBJETO: OFERTA
# ---------------------------------------------------------

class Oferta(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuario.id")
    
    # DEPENDÊNCIAS (Chaves Estrangeiras)
    produtor_id: int = Field(foreign_key="produtor.id", index=True)
    fazenda_id: int = Field(foreign_key="fazenda.id", index=True)
    
    # DADOS DA OFERTA
    commodity: str = Field(default="Soja", description="'Soja' ou 'Milho'")
    volume: int = Field(description="Quantidade em sacas (ex: 5000)")
    tipo_medida: str = Field(default="Sacas", description="'Sacas' ou 'Toneladas'")
    preco: float = Field(description="Preço ofertado por saca")
    moeda: str = Field(default="BRL", max_length=3, description="Moeda da negociação, ex: BRL, USD")
    data_entrega_embarque: date = Field(description="Data limite ou programada para entrega/embarque")
    
    # RELACIONAMENTOS ORM
    produtor: Optional[Produtor] = Relationship(back_populates="ofertas")
    fazenda: Optional[Fazenda] = Relationship(back_populates="ofertas")

# 4. Tabela de Empresas Compradoras (Tradings)
class Empresa(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuario.id")
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
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuario.id")
    nome: str
    email: str = Field(unique=True, index=True)
    telefone: str
    
    # Relação com a Empresa (Chave Estrangeira)
    empresa_id: int = Field(foreign_key="empresa.id", index=True)
    empresa: Optional[Empresa] = Relationship(back_populates="compradores")

# 5. O Coração do Sistema: Contratos de Fechamento
class Contrato(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuario.id")
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
    corretor: Optional[Usuario] = Relationship(back_populates="contratos")
    
    produtor_id: int = Field(foreign_key="produtor.id")
    produtor: Optional[Produtor] = Relationship(back_populates="contratos")
    
    fazenda_id: int = Field(foreign_key="fazenda.id")
    fazenda_origem: Optional[Fazenda] = Relationship(back_populates="contratos")
    
    empresa_id: int = Field(foreign_key="empresa.id")
    empresa_compradora: Optional[Empresa] = Relationship(back_populates="contratos")

class Historico(SQLModel, table=True):
    id: Optional[int] = Field(primary_key=True, default=None)
    usuario_id: int = Field(foreign_key='usuario.id')
    tabela_afetada: str
    id_afetado: int
    acao: str
    detalhes: Optional[str] = None
    horario: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("America/Sao_Paulo")))