from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from contextlib import asynccontextmanager
from fastapi.responses import StreamingResponse
import io
import pandas as pd
import requests
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime, timedelta, timezone
import secrets
from fastapi.responses import HTMLResponse
# Nossas tabelas
from modelo_tabela import Usuario, Produtor, Fazenda, Empresa, Contrato, Oferta, Comprador, Historico
from sqlalchemy.exc import IntegrityError
# Nossas funções de segurança
from auth import criar_token_acesso, usuario_atual, apenas_admin, obter_hash_senha, verificar_senha
# Nossa conexão com o banco
from database import criar_tabelas, get_session
import string
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

EVOLUTION_URL = os.getenv('EVOLUTION_URL')
EVOLUTION_API_KEY = os.getenv('EVOLUTION_API_KEY')
INSTANCIA_PADRAO = "corretora"


def obter_instancia_usuario(usuario) -> str:
    """Retorna o nome único da instância da Evolution API para o usuário/corretor"""
    if not usuario:
        return INSTANCIA_PADRAO
    user_id = getattr(usuario, "id", None) or (usuario.get("id") if isinstance(usuario, dict) else None)
    if user_id:
        return f"corretor_{user_id}"
    return INSTANCIA_PADRAO


def checar_whatsapp_conectado(instancia: str) -> bool:
    """Consulta a Evolution API para checar se a instância está aberta e autenticada"""
    if not EVOLUTION_URL or not EVOLUTION_API_KEY:
        return False
    headers = {
        "apikey": EVOLUTION_API_KEY,
        "Content-Type": "application/json"
    }
    try:
        url = f"{EVOLUTION_URL}/instance/connectionState/{instancia}"
        resposta = requests.get(url, headers=headers, timeout=5)
        if resposta.status_code == 200:
            dados = resposta.json()
            state = dados.get("instance", {}).get("state") if isinstance(dados, dict) else None
            return state == "open"
        return False
    except Exception as e:
        print(f"Erro ao verificar conexão do WhatsApp ({instancia}): {e}")
        return False


def disparar_whatsapp_comprador(telefone: str, mensagem: str, instancia: str = INSTANCIA_PADRAO):
    url = f"{EVOLUTION_URL}/message/sendText/{instancia}"
    headers = {
        "apikey": EVOLUTION_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "number": telefone,
        "text": mensagem,
        "delay": 1000,
        "presence": "composing"
    }
    try:
        resposta = requests.post(url, headers=headers, json=payload)
        return resposta.status_code in [200, 201]
    except Exception as e:
        print(f"Erro ao enviar WhatsApp pela instância {instancia}: {e}")
        return False

# ==========================================
# 🛠️ FUNÇÃO AUXILIAR DE PERMISSÕES
# ==========================================
def obter_usuario_db(usuario_token, db: Session):
    """Pega o objeto do usuário logado diretamente do banco"""
    if isinstance(usuario_token, dict):
        email = usuario_token.get("email") or usuario_token.get("sub")
    else:
        email = usuario_token.email
    return db.exec(select(Usuario).where(Usuario.email == email)).first()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando banco de dados e conferindo tabelas...")
    criar_tabelas() 
    yield
    print("Desligando servidor...")

app = FastAPI(lifespan=lifespan)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://cotzo-app.vercel.app"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

class EsqueciSenhaRequest(BaseModel):
    email: str

# ==========================================
# 🔐 LOGIN E USUÁRIOS
# ==========================================
@app.post("/login")
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)):
    usuario = db.exec(select(Usuario).where(Usuario.email == form_data.username)).first()
    if not usuario or not verificar_senha(form_data.password, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    if not usuario.ativo:
        raise HTTPException(status_code=403, detail="Usuário inativo. Contate o administrador.")
    
    token = criar_token_acesso({"sub": usuario.email, "cargo": usuario.cargo})
    return {"access_token": token, "token_type": "bearer"}

class UsuarioCreate(BaseModel):
    nome: str
    email: str
    telefone: str
    senha: Optional[str] = None
    senha_hash: Optional[str] = None
    cargo: str = "corretor"
    comissao_padrao: Optional[float] = None

class AlterarSenhaRequest(BaseModel):
    senha_atual: str
    nova_senha: str

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    senha_hash: Optional[str] = None
    cargo: Optional[str] = None
    comissao_padrao: Optional[float] = None
    ativo: Optional[bool] = None

class ProdutorUpdate(BaseModel):
    nome: Optional[str] = None
    whatsapp: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None

class FazendaUpdate(BaseModel):
    nome: Optional[str] = None
    capacidade_carregamento: Optional[int] = None
    comprimento_balanca: Optional[float] = None
    telefone: Optional[str] = None
    condicao_frete: Optional[str] = None
    inscricao_estadual: Optional[str] = None
    coordenadas: Optional[str] = None
    municipio: Optional[str] = None
    descricao_roteiro: Optional[str] = None
    produtor_id: Optional[int] = None

class EmpresaUpdate(BaseModel):
    razao_social: Optional[str] = None
    cnpj: Optional[str] = None
    inscricao_estadual: Optional[str] = None
    contato_nome: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None

class ContratoUpdate(BaseModel):
    data_fechamento: Optional[date] = None
    commodity: Optional[str] = None
    safra: Optional[str] = None
    volume: Optional[float] = None
    tipo_medida: Optional[str] = None
    moeda: Optional[str] = None
    preco_unitario: Optional[float] = None
    tipo_frete: Optional[str] = None
    data_entrega: Optional[date] = None
    data_pagamento: Optional[date] = None
    numero_contrato_trading: Optional[str] = None
    comissao_porcentagem: Optional[float] = None
    status: Optional[str] = None
    observacoes: Optional[str] = None
    produtor_id: Optional[int] = None
    fazenda_id: Optional[int] = None
    empresa_id: Optional[int] = None

class OfertaUpdate(BaseModel):
    tipo_oferta: Optional[str] = None
    commodity: Optional[str] = None
    volume: Optional[float] = None
    tipo_medida: Optional[str] = None
    preco: Optional[float] = None
    moeda: Optional[str] = None
    tipo_frete: Optional[str] = None
    data_entrega_embarque: Optional[date] = None

class CompradorUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None

@app.post("/usuarios/", tags=["Usuario"])
def criar_usuario(usuario_in: UsuarioCreate, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get('cargo') != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores criam usuários.")
    if usuario_in.cargo not in ["corretor", "gerente", "admin"]:
        raise HTTPException(status_code=400, detail="Cargo inválido. Digite apenas: corretor, gerente ou admin.")
    
    senha_pura = usuario_in.senha or usuario_in.senha_hash
    if not senha_pura or len(senha_pura) < 8:
        raise HTTPException(status_code=400, detail="A senha deve ter no mínimo 8 caracteres.")
    
    usuario = Usuario(
        nome=usuario_in.nome,
        email=usuario_in.email,
        telefone=usuario_in.telefone,
        senha_hash=obter_hash_senha(senha_pura),
        cargo=usuario_in.cargo,
        comissao_padrao=usuario_in.comissao_padrao,
        ativo=True
    )
    db.add(usuario)
    try:
        db.commit()
        db.refresh(usuario)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="E-mail já está em uso por outro usuário.")
    return {"msg": "Usuário criado com sucesso!", "dados": usuario.model_dump(exclude={"senha_hash", "reset_token", "reset_token_expires"})}

@app.get("/usuarios/", tags=["Usuario"])
def ler_usuarios(inativos: bool = False, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    # Corretor não pode ver a lista de todos os usuários
    if usuario_logado.get("cargo") == "corretor":
        raise HTTPException(status_code=403, detail="Acesso negado.")
    query = select(Usuario).where(Usuario.ativo == (not inativos))
    usuarios = db.exec(query).all()
    return [u.model_dump(exclude={"senha_hash", "reset_token", "reset_token_expires"}) for u in usuarios]

@app.get('/usuarios/me', tags=["Usuario"])
def ler_usuario_atual(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    usuario_db = obter_usuario_db(usuario_logado, db)
    if not usuario_db or not usuario_db.ativo:
        raise HTTPException(status_code=404, detail="Usuário não encontrado ou inativo.")
    usuario_dict = usuario_db.model_dump()
    usuario_dict.pop('senha_hash', None)
    usuario_dict.pop('reset_token', None)
    usuario_dict.pop('reset_token_expires', None)
    return usuario_dict

@app.get("/usuarios/{usuario_id}", tags=["Usuario"])
def ler_usuario_por_id(usuario_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") == "corretor":
        raise HTTPException(status_code=403, detail="Acesso negado.")
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return usuario.model_dump(exclude={"senha_hash", "reset_token", "reset_token_expires"})

@app.put("/usuarios/{usuario_id}", tags=["Usuario"])
def atualizar_usuario(usuario_id: int, dados_atualizados: UsuarioUpdate, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get('cargo') != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem editar usuários.")
    if dados_atualizados.cargo and dados_atualizados.cargo not in ["corretor", "gerente", "admin"]:
        raise HTTPException(status_code=400, detail="Cargo inválido. Digite apenas: corretor, gerente ou admin.")
    usuario = db.get(Usuario, usuario_id)
    if not usuario: raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    for key, value in dados_atualizados.model_dump(exclude_unset=True).items():
        if hasattr(usuario, key) and key != "id":
            if key == "senha_hash": value = obter_hash_senha(value)
            setattr(usuario, key, value)
            
    db.add(usuario)
    try:
        db.commit()
        db.refresh(usuario)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="E-mail já está em uso por outro usuário.")
    return {"msg": "Usuário atualizado!", "dados": usuario.model_dump(exclude={"senha_hash", "reset_token", "reset_token_expires"})}

@app.delete("/usuarios/{usuario_id}", tags=["Usuario"])
def deletar_usuario(usuario_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get('cargo') != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores excluem registros.")
    usuario = db.get(Usuario, usuario_id)
    if not usuario or not usuario.ativo: raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    usuario.ativo = False
    db.add(usuario)
    db.commit()
    return {"msg": "Usuário desativado com sucesso."}

@app.put("/usuarios/{usuario_id}/restaurar", tags=["Usuario"])
def restaurar_usuario(usuario_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get('cargo') != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem restaurar registros.")
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    usuario.ativo = True
    db.add(usuario)
    usuario_db = obter_usuario_db(usuario_logado, db)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Usuarios', id_afetado=usuario.id, acao='Restaurar',
                    detalhes=f'O usuário {usuario.nome} foi restaurado')
    db.add(log)
    db.commit()
    return {"msg": "Usuário restaurado com sucesso.", "dados": usuario.model_dump(exclude={"senha_hash", "reset_token", "reset_token_expires"})}

@app.post("/alterar-senha", tags=["Senha"])
def alterar_senha(dados: AlterarSenhaRequest, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    """Permite que qualquer usuário logado altere sua própria senha"""
    usuario_db = obter_usuario_db(usuario_logado, db)
    if not usuario_db or not usuario_db.ativo:
        raise HTTPException(status_code=404, detail="Usuário não encontrado ou inativo.")
    
    if not verificar_senha(dados.senha_atual, usuario_db.senha_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta.")
    
    if len(dados.nova_senha) < 8:
        raise HTTPException(status_code=400, detail="A nova senha deve ter no mínimo 8 caracteres.")
    
    usuario_db.senha_hash = obter_hash_senha(dados.nova_senha)
    db.add(usuario_db)
    db.commit()
    return {"msg": "Senha alterada com sucesso!"}


# ==========================================
# 🌾 B. PRODUTORES
# ==========================================
@app.post("/produtores/", tags=["Produtor"])
def criar_produtor(produtor: Produtor, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    usuario_db = obter_usuario_db(usuario_logado, db)
    # Atrela o produtor ao corretor que o criou, caso não tenha sido enviado
    if not produtor.usuario_id or usuario_logado.get("cargo") == "corretor":
        produtor.usuario_id = usuario_db.id
        
    db.add(produtor)
    db.flush()
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Produtores', id_afetado=produtor.id, acao='Adicionar',
                    detalhes=f'O produtor {produtor.nome} foi adicionado')
    db.add(log)
    db.commit()
    db.refresh(produtor)
    return {"msg": "Produtor criado com sucesso!", "dados": produtor}

@app.get("/produtores/", tags=["Produtor"])
def ler_produtores(inativos: bool = False, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if inativos and usuario_logado.get("cargo") not in ["admin", "gerente"]:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    query = select(Produtor).where(Produtor.ativo == (not inativos))
    if usuario_logado.get("cargo") in ["admin", "gerente"]:
        return db.exec(query).all()
    
    # Se for corretor, vê apenas os clientes dele
    usuario_db = obter_usuario_db(usuario_logado, db)
    return db.exec(query.where(Produtor.usuario_id == usuario_db.id)).all()

@app.get("/produtores/{produtor_id}", tags=["Produtor"])
def ler_produtor_por_id(produtor_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    produtor = db.get(Produtor, produtor_id)
    if not produtor or not produtor.ativo:
        raise HTTPException(status_code=404, detail="Produtor não encontrado.")
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor" and produtor.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Acesso negado. Este produtor não pertence a você.")
    return produtor

@app.put("/produtores/{produtor_id}", tags=["Produtor"])
def atualizar_produtor(produtor_id: int, dados_atualizados: ProdutorUpdate, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    produtor = db.get(Produtor, produtor_id)
    if not produtor or not produtor.ativo: raise HTTPException(status_code=404, detail="Produtor não encontrado.")
        
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor" and produtor.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Você só pode editar seus próprios clientes.")

    campos_permitidos = ['nome','whatsapp','cpf_cnpj','cidade','uf']
    for key, value in dados_atualizados.model_dump(exclude_unset=True).items():
        if hasattr(produtor, key) and key != "id":
            if key in campos_permitidos:
                setattr(produtor, key, value)
            
    db.add(produtor)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Produtores', id_afetado=produtor.id, acao='Alterar',
                    detalhes=f'O produtor {produtor.nome} foi alterado')
    db.add(log)
    db.commit()
    db.refresh(produtor)
    return produtor

@app.delete("/produtores/{produtor_id}", tags=["Produtor"])
def deletar_produtor(produtor_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem excluir registros.")
    produtor = db.get(Produtor, produtor_id)
    if not produtor or not produtor.ativo: raise HTTPException(status_code=404, detail="Produtor não encontrado.")
    usuario_db = obter_usuario_db(usuario_logado,db)
    produtor.ativo = False
    db.add(produtor)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Produtores', id_afetado=produtor.id, acao='Deletar',
                    detalhes=f'O produtor {produtor.nome} foi desativado')
    db.add(log)
    db.commit()
    return {"msg": "Produtor desativado com sucesso."}

@app.put("/produtores/{produtor_id}/restaurar", tags=["Produtor"])
def restaurar_produtor(produtor_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem restaurar registros.")
    produtor = db.get(Produtor, produtor_id)
    if not produtor:
        raise HTTPException(status_code=404, detail="Produtor não encontrado.")
    produtor.ativo = True
    db.add(produtor)
    usuario_db = obter_usuario_db(usuario_logado, db)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Produtores', id_afetado=produtor.id, acao='Restaurar',
                    detalhes=f'O produtor {produtor.nome} foi restaurado')
    db.add(log)
    db.commit()
    return {"msg": "Produtor restaurado com sucesso.", "dados": produtor}


# ==========================================
# 🚜 C. FAZENDAS
# ==========================================
@app.post("/fazendas/", tags=["Fazenda"])
def criar_fazenda(fazenda: Fazenda, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    usuario_db = obter_usuario_db(usuario_logado, db)
    
    produtor_db = db.get(Produtor, fazenda.produtor_id)
    if not produtor_db or not produtor_db.ativo:
        raise HTTPException(status_code=404, detail="Produtor não encontrado ou inativo.")

    if usuario_logado.get("cargo") == "corretor":
        if produtor_db.usuario_id != usuario_db.id:
            raise HTTPException(status_code=403, detail="Você só pode cadastrar fazendas para seus próprios produtores.")
        fazenda.usuario_id = usuario_db.id
    elif not fazenda.usuario_id:
        fazenda.usuario_id = produtor_db.usuario_id or usuario_db.id

    db.add(fazenda)
    db.flush()
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Fazendas', id_afetado=fazenda.id, acao='Adicionar',
                    detalhes=f'A fazenda {fazenda.nome} foi adicionada')
    db.add(log)
    db.commit()
    db.refresh(fazenda)
    return {"msg": "Fazenda criada com sucesso!", "dados": fazenda}

@app.get("/fazendas/", tags=["Fazenda"])
def ler_fazendas(inativos: bool = False, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if inativos and usuario_logado.get("cargo") not in ["admin", "gerente"]:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    
    query = (
        select(Fazenda, Produtor.nome.label("produtor_nome"))
        .outerjoin(Produtor, Fazenda.produtor_id == Produtor.id)
        .where(Fazenda.ativo == (not inativos))
    )
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor":
        query = query.where(Fazenda.usuario_id == usuario_db.id)
        
    resultados = db.exec(query).all()
    lista_final = []
    for fazenda, produtor_nome in resultados:
        item = fazenda.model_dump()
        item["produtor_nome"] = produtor_nome or "N/A"
        lista_final.append(item)
    return lista_final

@app.get("/fazendas/{fazenda_id}", tags=["Fazenda"])
def ler_fazenda_por_id(fazenda_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    fazenda = db.get(Fazenda, fazenda_id)
    if not fazenda or not fazenda.ativo:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada.")
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor" and fazenda.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Acesso negado. Esta fazenda não pertence a você.")
    
    produtor = db.get(Produtor, fazenda.produtor_id)
    item = fazenda.model_dump()
    item["produtor_nome"] = produtor.nome if produtor else "N/A"
    return item

@app.get("/produtores/{produtor_id}/fazendas", tags=["Fazenda"])
def ler_fazendas_do_produtor(produtor_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    produtor_db = db.get(Produtor, produtor_id)
    if not produtor_db or not produtor_db.ativo:
        raise HTTPException(status_code=404, detail="Produtor não encontrado.")

    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor" and produtor_db.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Acesso negado. Este produtor não pertence a você.")

    fazendas = db.exec(select(Fazenda).where(Fazenda.produtor_id == produtor_id, Fazenda.ativo == True)).all()
    return fazendas

@app.put("/fazendas/{fazenda_id}", tags=["Fazenda"])
def atualizar_fazenda(fazenda_id: int, dados_atualizados: FazendaUpdate, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    fazenda = db.get(Fazenda, fazenda_id)
    if not fazenda or not fazenda.ativo: raise HTTPException(status_code=404)
    
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor" and fazenda.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Permissão negada.")

    dados_dict = dados_atualizados.model_dump(exclude_unset=True)

    if "produtor_id" in dados_dict:
        if dados_dict["produtor_id"] is None:
            raise HTTPException(status_code=422, detail="produtor_id não pode ser nulo.")
        novo_produtor = db.get(Produtor, dados_dict["produtor_id"])
        if not novo_produtor or not novo_produtor.ativo:
            raise HTTPException(status_code=404, detail="Produtor não encontrado ou inativo.")
        if usuario_logado.get("cargo") == "corretor" and novo_produtor.usuario_id != usuario_db.id:
            raise HTTPException(status_code=403, detail="Você só pode vincular fazendas aos seus próprios produtores.")

    campos_permitidos = ["nome", "capacidade_carregamento", "comprimento_balanca", "telefone", "condicao_frete", "inscricao_estadual", "coordenadas", "municipio", "descricao_roteiro", "produtor_id"]
    for key, value in dados_dict.items():
        if hasattr(fazenda, key) and key in campos_permitidos:
            setattr(fazenda, key, value)
            
    db.add(fazenda)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Fazendas', id_afetado=fazenda.id, acao='Alterar',
                    detalhes=f'A fazenda {fazenda.nome} foi alterada')
    db.add(log)
    db.commit()
    db.refresh(fazenda)
    return fazenda

@app.delete("/fazendas/{fazenda_id}", tags=["Fazenda"])
def deletar_fazenda(fazenda_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin": raise HTTPException(status_code=403)
    fazenda = db.get(Fazenda, fazenda_id)
    if not fazenda or not fazenda.ativo:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada.")
    usuario_db = obter_usuario_db(usuario_logado,db)
    fazenda.ativo = False
    db.add(fazenda)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Fazendas', id_afetado=fazenda.id, acao='Deletar',
                    detalhes=f'A fazenda {fazenda.nome} foi desativada')
    db.add(log)
    db.commit()
    return {"msg": "Fazenda desativada."}

@app.put("/fazendas/{fazenda_id}/restaurar", tags=["Fazenda"])
def restaurar_fazenda(fazenda_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem restaurar registros.")
    fazenda = db.get(Fazenda, fazenda_id)
    if not fazenda:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada.")
    fazenda.ativo = True
    db.add(fazenda)
    usuario_db = obter_usuario_db(usuario_logado, db)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Fazendas', id_afetado=fazenda.id, acao='Restaurar',
                    detalhes=f'A fazenda {fazenda.nome} foi restaurada')
    db.add(log)
    db.commit()
    return {"msg": "Fazenda restaurada com sucesso.", "dados": fazenda}


# ==========================================
# 🏢 D. EMPRESAS (Tradings)
# ==========================================
@app.post("/empresas/", tags=["Empresa"])
def criar_empresa(empresa: Empresa, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    usuario_db = obter_usuario_db(usuario_logado, db)
    if not empresa.usuario_id or usuario_logado.get("cargo") == "corretor": 
        empresa.usuario_id = usuario_db.id
    db.add(empresa)
    db.flush()
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Empresas', id_afetado=empresa.id, acao='Adicionar',
                    detalhes=f'A empresa {empresa.razao_social} foi adicionada')
    db.add(log)
    try:
        db.commit()
        db.refresh(empresa)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="CNPJ já está cadastrado em outra empresa.")
    return {"msg": "Empresa criada com sucesso!", "dados": empresa}

@app.get("/empresas/", tags=["Empresa"])
def ler_empresas(inativos: bool = False, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if inativos and usuario_logado.get("cargo") not in ["admin", "gerente"]:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return db.exec(select(Empresa).where(Empresa.ativo == (not inativos))).all()

@app.get("/empresas/{empresa_id}", tags=["Empresa"])
def ler_empresa_por_id(empresa_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    empresa = db.get(Empresa, empresa_id)
    if not empresa or not empresa.ativo:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
    return empresa

@app.put("/empresas/{empresa_id}", tags=["Empresa"])
def atualizar_empresa(empresa_id: int, dados_atualizados: EmpresaUpdate, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    empresa = db.get(Empresa, empresa_id)
    if not empresa or not empresa.ativo: raise HTTPException(status_code=404, detail="Empresa não encontrada.")
    
    usuario_db = obter_usuario_db(usuario_logado, db)

    campos_permitidos = ['razao_social','cnpj','inscricao_estadual','contato_nome','telefone','email','endereco']
    for key, value in dados_atualizados.model_dump(exclude_unset=True).items():
        if hasattr(empresa, key) and key != "id":
            if key in campos_permitidos:
                setattr(empresa, key, value)
            
    db.add(empresa)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Empresas', id_afetado=empresa.id, acao='Alterar',
                    detalhes=f'A empresa {empresa.razao_social} foi alterada')
    db.add(log)
    try:
        db.commit()
        db.refresh(empresa)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="CNPJ já está cadastrado em outra empresa.")
    return empresa

@app.delete("/empresas/{empresa_id}", tags=["Empresa"])
def deletar_empresa(empresa_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin": raise HTTPException(status_code=403)
    empresa = db.get(Empresa, empresa_id)
    if not empresa or not empresa.ativo:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
    usuario_db = obter_usuario_db(usuario_logado,db)
    empresa.ativo = False
    db.add(empresa)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Empresas', id_afetado=empresa.id, acao='Deletar',
                    detalhes=f'A empresa {empresa.razao_social} foi desativada')
    db.add(log)
    db.commit()
    return {"msg": "Empresa desativada."}

@app.put("/empresas/{empresa_id}/restaurar", tags=["Empresa"])
def restaurar_empresa(empresa_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem restaurar registros.")
    empresa = db.get(Empresa, empresa_id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
    empresa.ativo = True
    db.add(empresa)
    usuario_db = obter_usuario_db(usuario_logado, db)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Empresas', id_afetado=empresa.id, acao='Restaurar',
                    detalhes=f'A empresa {empresa.razao_social} foi restaurada')
    db.add(log)
    db.commit()
    return {"msg": "Empresa restaurada com sucesso.", "dados": empresa}


# ==========================================
# 📄 E. CONTRATOS (O Coração do Sistema)
# ==========================================
@app.post("/contratos/", tags=["Contrato"])
def criar_contrato(
    contrato: Contrato, 
    background_tasks: BackgroundTasks, # 👈 1. Injetou o BackgroundTasks aqui
    db: Session = Depends(get_session), 
    usuario_logado=Depends(usuario_atual)
):
    usuario_db = obter_usuario_db(usuario_logado, db)
    
    produtor_db = db.get(Produtor, contrato.produtor_id)
    if not produtor_db or not produtor_db.ativo:
        raise HTTPException(status_code=404, detail="Produtor não encontrado ou inativo.")

    fazenda_db = db.get(Fazenda, contrato.fazenda_id)
    if not fazenda_db or not fazenda_db.ativo:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada ou inativa.")

    empresa_db = db.get(Empresa, contrato.empresa_id)
    if not empresa_db or not empresa_db.ativo:
        raise HTTPException(status_code=404, detail="Empresa compradora não encontrada ou inativa.")

    if fazenda_db.produtor_id != contrato.produtor_id:
        raise HTTPException(status_code=400, detail="A fazenda informada não pertence ao produtor selecionado.")

    if usuario_logado.get("cargo") == "corretor":
        if produtor_db.usuario_id != usuario_db.id:
            raise HTTPException(status_code=403, detail="Produtor não pertence a você.")
        if fazenda_db.usuario_id != usuario_db.id:
            raise HTTPException(status_code=403, detail="Fazenda não pertence a você.")
        contrato.usuario_id = usuario_db.id
    elif not contrato.usuario_id:
        contrato.usuario_id = usuario_db.id

    contrato.valor_total = contrato.volume * contrato.preco_unitario
    contrato.valor_comissao = contrato.valor_total * (contrato.comissao_porcentagem / 100)
    
    corretor_contrato = db.get(Usuario, contrato.usuario_id) if contrato.usuario_id else usuario_db
    instancia_corretor = obter_instancia_usuario(corretor_contrato)

    # 👈 Validação prévia: Impede emissão se houver notificações a disparar e o WhatsApp do corretor não estiver conectado
    tem_destinatarios = (produtor_db and produtor_db.whatsapp) or (empresa_db and empresa_db.telefone)
    if tem_destinatarios:
        if not checar_whatsapp_conectado(instancia_corretor):
            raise HTTPException(
                status_code=400, 
                detail="Seu WhatsApp não está conectado. Conecte seu aparelho em Configurações > WhatsApp antes de emitir o contrato e disparar as notificações."
            )

    db.add(contrato)
    db.flush()
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Contratos', id_afetado=contrato.id, acao='Adicionar', detalhes=f'O contrato de id {contrato.id} foi adicionado')
    db.add(log)
    db.commit()
    db.refresh(contrato)
    
    nome_corretor = corretor_contrato.nome if corretor_contrato else "Corretor"
    telefone_corretor = corretor_contrato.telefone if corretor_contrato else ""

    # 👈 2. Disparo do Produtor em segundo plano
    if produtor_db and produtor_db.whatsapp:
        msg_produtor = (
            f"🤝 *CONTRATO FECHADO COM SUCESSO!* 🤝\n\n"
            f"Olá *{produtor_db.nome}*, seu negócio foi concluído!\n\n"
            f"🌱 *Produto:* {contrato.commodity} ({contrato.safra})\n"
            f"📦 *Volume:* {contrato.volume:,.2f} {contrato.tipo_medida.lower()}\n"
            f"💰 *Preço:* {contrato.moeda} {contrato.preco_unitario:,.2f} / {contrato.tipo_medida.lower()}\n"
            f"🏢 *Comprador:* {empresa_db.razao_social if empresa_db else 'N/A'}\n"
            f"🚚 *Frete:* {contrato.tipo_frete}\n\n"
            f"👨‍💼 *Corretor responsável:* {nome_corretor}\n"
            f"Agradecemos a confiança e ótimos negócios!"
        )
        background_tasks.add_task(disparar_whatsapp_comprador, produtor_db.whatsapp, msg_produtor, instancia_corretor)

    # 👈 3. Disparo da Empresa em segundo plano
    if empresa_db and empresa_db.telefone:
        fazenda_nome = fazenda_db.nome if fazenda_db else "N/A"
        produtor_nome = produtor_db.nome if produtor_db else "N/A"
        msg_empresa = (
            f"📄 *NOVO FECHAMENTO DE CONTRATO* 📄\n\n"
            f"Olá equipe *{empresa_db.razao_social}*, um novo negócio foi fechado:\n\n"
            f"👤 *Produtor:* {produtor_nome}\n"
            f"🚜 *Origem:* {fazenda_nome}\n"
            f"🌱 *Produto:* {contrato.commodity} ({contrato.safra})\n"
            f"📦 *Volume:* {contrato.volume:,.2f} {contrato.tipo_medida.lower()}\n"
            f"💰 *Preço Acordado:* {contrato.moeda} {contrato.preco_unitario:,.2f}\n"
            f"🚚 *Modalidade:* {contrato.tipo_frete}\n\n"
            f"👨‍💼 *Corretor:* {nome_corretor}\n"
            f"📞 *Contato do Corretor:* {telefone_corretor}\n\n"
            f"Em breve enviaremos a documentação oficial."
        )
        background_tasks.add_task(disparar_whatsapp_comprador, empresa_db.telefone, msg_empresa, instancia_corretor)
        
    return {"msg": "Contrato emitido e notificações enviadas com sucesso!", "dados": contrato}

@app.get("/contratos/", tags=["Contrato"])
def ler_contratos(inativos: bool = False, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if inativos and usuario_logado.get("cargo") not in ["admin", "gerente"]:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    
    query = (
        select(
            Contrato,
            Produtor.nome.label("produtor_nome"),
            Fazenda.nome.label("fazenda_nome"),
            Empresa.razao_social.label("empresa_razao_social"),
            Usuario.nome.label("corretor_nome")
        )
        .outerjoin(Produtor, Contrato.produtor_id == Produtor.id)
        .outerjoin(Fazenda, Contrato.fazenda_id == Fazenda.id)
        .outerjoin(Empresa, Contrato.empresa_id == Empresa.id)
        .outerjoin(Usuario, Contrato.usuario_id == Usuario.id)
        .where(Contrato.ativo == (not inativos))
    )
    
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor":
        query = query.where(Contrato.usuario_id == usuario_db.id)
        
    resultados = db.exec(query).all()
    lista_final = []
    for contrato, p_nome, f_nome, e_nome, c_nome in resultados:
        item = contrato.model_dump()
        item["produtor_nome"] = p_nome or "N/A"
        item["fazenda_nome"] = f_nome or "N/A"
        item["empresa_razao_social"] = e_nome or "N/A"
        item["corretor_nome"] = c_nome or "N/A"
        lista_final.append(item)
    return lista_final

@app.get("/contratos/{contrato_id}", tags=["Contrato"])
def ler_contrato_por_id(contrato_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    contrato = db.get(Contrato, contrato_id)
    if not contrato or not contrato.ativo:
        raise HTTPException(status_code=404, detail="Contrato não encontrado.")
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor" and contrato.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Acesso negado. Este contrato não pertence a você.")
    
    produtor = db.get(Produtor, contrato.produtor_id)
    fazenda = db.get(Fazenda, contrato.fazenda_id)
    empresa = db.get(Empresa, contrato.empresa_id)
    corretor = db.get(Usuario, contrato.usuario_id) if contrato.usuario_id else None
    
    item = contrato.model_dump()
    item["produtor_nome"] = produtor.nome if produtor else "N/A"
    item["fazenda_nome"] = fazenda.nome if fazenda else "N/A"
    item["empresa_razao_social"] = empresa.razao_social if empresa else "N/A"
    item["corretor_nome"] = corretor.nome if corretor else "N/A"
    return item

@app.put("/contratos/{contrato_id}", tags=["Contrato"])
def atualizar_contrato(contrato_id: int, dados_atualizados: ContratoUpdate, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    contrato = db.get(Contrato, contrato_id)
    if not contrato or not contrato.ativo: raise HTTPException(status_code=404)
    
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor" and contrato.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Você só pode editar seus próprios contratos.")

    dados_dict = dados_atualizados.model_dump(exclude_unset=True)

    # Validação de campos não nulos
    for key, value in dados_dict.items():
        if value is None and key in ["volume", "preco_unitario", "comissao_porcentagem", "data_fechamento", "commodity", "safra", "tipo_medida", "moeda", "tipo_frete", "status", "produtor_id", "fazenda_id", "empresa_id"]:
            raise HTTPException(status_code=422, detail=f"O campo {key} não pode ser nulo.")

    # Validação de FKs quando alteradas
    if "produtor_id" in dados_dict:
        produtor_db = db.get(Produtor, dados_dict["produtor_id"])
        if not produtor_db or not produtor_db.ativo:
            raise HTTPException(status_code=404, detail="Produtor não encontrado ou inativo.")
        if usuario_logado.get("cargo") == "corretor" and produtor_db.usuario_id != usuario_db.id:
            raise HTTPException(status_code=403, detail="Produtor não pertence a você.")

    if "fazenda_id" in dados_dict:
        fazenda_db = db.get(Fazenda, dados_dict["fazenda_id"])
        if not fazenda_db or not fazenda_db.ativo:
            raise HTTPException(status_code=404, detail="Fazenda não encontrada ou inativa.")
        if usuario_logado.get("cargo") == "corretor" and fazenda_db.usuario_id != usuario_db.id:
            raise HTTPException(status_code=403, detail="Fazenda não pertence a você.")

    if "empresa_id" in dados_dict:
        empresa_db = db.get(Empresa, dados_dict["empresa_id"])
        if not empresa_db or not empresa_db.ativo:
            raise HTTPException(status_code=404, detail="Empresa compradora não encontrada ou inativa.")

    # Valida consistência entre fazenda e produtor resultante
    target_produtor_id = dados_dict.get("produtor_id", contrato.produtor_id)
    target_fazenda_id = dados_dict.get("fazenda_id", contrato.fazenda_id)
    fazenda_alvo = db.get(Fazenda, target_fazenda_id)
    if fazenda_alvo and fazenda_alvo.produtor_id != target_produtor_id:
        raise HTTPException(status_code=400, detail="A fazenda informada não pertence ao produtor.")

    campos_permitidos = ["data_fechamento", "commodity", "safra", "volume", "tipo_medida", "moeda", "preco_unitario", "tipo_frete", "data_entrega", "data_pagamento", "numero_contrato_trading", "comissao_porcentagem", "status", "observacoes", "produtor_id", "fazenda_id", "empresa_id"]
    for key, value in dados_dict.items():
        if hasattr(contrato, key) and key in campos_permitidos:
            setattr(contrato, key, value)
            
    contrato.valor_total = contrato.volume * contrato.preco_unitario
    contrato.valor_comissao = contrato.valor_total * (contrato.comissao_porcentagem / 100)
            
    db.add(contrato)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Contratos', id_afetado=contrato.id, acao='Alterar',
                    detalhes=f'O contrato de id {contrato.id} foi alterado')
    db.add(log)
    db.commit()
    db.refresh(contrato)
    return contrato

@app.delete("/contratos/{contrato_id}", tags=["Contrato"])
def deletar_contrato(contrato_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin": raise HTTPException(status_code=403)
    contrato = db.get(Contrato, contrato_id)
    if not contrato or not contrato.ativo:
        raise HTTPException(status_code=404, detail="Contrato não encontrado.")
    usuario_db = obter_usuario_db(usuario_logado,db)
    contrato.ativo = False
    contrato.status = "Cancelado"
    db.add(contrato)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Contratos', id_afetado=contrato.id, acao='Deletar',
                    detalhes=f'O contrato de id {contrato.id} foi desativado')
    db.add(log)
    db.commit()
    return {"msg": "Contrato desativado."}

@app.put("/contratos/{contrato_id}/restaurar", tags=["Contrato"])
def restaurar_contrato(contrato_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem restaurar registros.")
    contrato = db.get(Contrato, contrato_id)
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado.")
    contrato.ativo = True
    contrato.status = "Fechado"
    db.add(contrato)
    usuario_db = obter_usuario_db(usuario_logado, db)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Contratos', id_afetado=contrato.id, acao='Restaurar',
                    detalhes=f'O contrato de id {contrato.id} foi restaurado')
    db.add(log)
    db.commit()
    return {"msg": "Contrato restaurado com sucesso.", "dados": contrato}


# ==========================================
# 📊 OFERTAS E COMPRADORES
# ==========================================
class OfertaCreate(BaseModel):
    produtor_id: int
    fazenda_id: int
    tipo_oferta: str = "Oferta"
    commodity: str = "Soja"
    volume: float
    tipo_medida: str = "Sacas"
    preco: float
    moeda: str = "BRL"
    tipo_frete: str = "FOB Fazenda"
    data_entrega_embarque: date
    compradores_ids: List[int] = []

@app.post("/ofertas/", response_model=Oferta, tags=["Oferta"])
def criar_oferta(
    dados: OfertaCreate, 
    background_tasks: BackgroundTasks, # 👈 1. Injetou o BackgroundTasks aqui
    session: Session = Depends(get_session), 
    usuario_logado=Depends(usuario_atual)
):
    produtor_db = session.get(Produtor, dados.produtor_id)
    if not produtor_db or not produtor_db.ativo:
        raise HTTPException(status_code=404, detail="Produtor não encontrado ou inativo.")

    fazenda_db = session.get(Fazenda, dados.fazenda_id)
    if not fazenda_db or not fazenda_db.ativo:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada ou inativa.")

    if fazenda_db.produtor_id != dados.produtor_id:
        raise HTTPException(status_code=400, detail="A fazenda informada não pertence ao produtor.")
        
    usuario_db = obter_usuario_db(usuario_logado, session)
    if not usuario_db or not usuario_db.telefone:
        raise HTTPException(status_code=400, detail="Corretor sem telefone.")

    if usuario_logado.get("cargo") == "corretor":
        if produtor_db.usuario_id != usuario_db.id:
            raise HTTPException(status_code=403, detail="Produtor não pertence a você.")
        if fazenda_db.usuario_id != usuario_db.id:
            raise HTTPException(status_code=403, detail="Fazenda não pertence a você.")
        
    instancia_corretor = obter_instancia_usuario(usuario_db)

    # 👈 Validação prévia: Impede disparo se houver compradores selecionados e o WhatsApp do corretor não estiver conectado
    if dados.compradores_ids:
        if not checar_whatsapp_conectado(instancia_corretor):
            raise HTTPException(
                status_code=400,
                detail="Seu WhatsApp não está conectado. Conecte seu aparelho em Configurações > WhatsApp antes de disparar ofertas."
            )

    nova_oferta = Oferta(
        usuario_id=usuario_db.id,
        produtor_id=dados.produtor_id,
        fazenda_id=dados.fazenda_id,
        tipo_oferta=dados.tipo_oferta,
        commodity=dados.commodity,
        volume=dados.volume,
        tipo_medida=dados.tipo_medida,
        preco=dados.preco,
        moeda=dados.moeda,
        tipo_frete=dados.tipo_frete,
        data_entrega_embarque=dados.data_entrega_embarque
    )
    
    session.add(nova_oferta)
    session.flush()
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Ofertas', id_afetado=nova_oferta.id, acao='Adicionar', detalhes=f'A oferta de id {nova_oferta.id} foi adicionado')
    session.add(log)
    session.commit()
    session.refresh(nova_oferta)

    if dados.compradores_ids:
        fazenda_nome = fazenda_db.nome
        texto_mensagem = (
            f"🌾 *NOVA OFERTA DISPONÍVEL* 🌾\n\n"
            f"🌱 *Produto:* {dados.commodity}\n"
            f"👤 *Produtor:* {produtor_db.nome}\n"
            f"🚜 *Fazenda:* {fazenda_nome}\n"
            f"📦 *Volume:* {dados.volume:,} {dados.tipo_medida.lower()}\n"
            f"💰 *Preço:* {dados.moeda} {dados.preco:,.2f}\n"
            f"🚚 *Frete:* {dados.tipo_frete}\n"
            f"📅 *Embarque:* {dados.data_entrega_embarque.strftime('%d/%m/%Y')}\n\n"
            f"👨‍💼 *Corretor:* {usuario_db.nome}\n"
            f"📞 *WhatsApp:* {usuario_db.telefone}\n\n"
            f"Responda esta mensagem ou clique no número acima para negociar!"
        )
        
        # 👈 2. Envia para a fila de segundo plano em vez de travar o loop
        for comprador_id in dados.compradores_ids:
            comprador = session.get(Comprador, comprador_id)
            if comprador and comprador.ativo and comprador.telefone:
                # Segurança: Se for corretor, só pode mandar msg pros seus próprios compradores
                if usuario_logado.get("cargo") == "corretor" and comprador.usuario_id != usuario_db.id:
                    continue
                background_tasks.add_task(disparar_whatsapp_comprador, comprador.telefone, texto_mensagem, instancia_corretor)

    return nova_oferta

@app.get("/ofertas/", tags=["Oferta"])
def listar_ofertas(inativos: bool = False, session: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if inativos and usuario_logado.get("cargo") not in ["admin", "gerente"]:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    
    query = (
        select(
            Oferta,
            Produtor.nome.label("produtor_nome"),
            Fazenda.nome.label("fazenda_nome"),
            Usuario.nome.label("corretor_nome")
        )
        .outerjoin(Produtor, Oferta.produtor_id == Produtor.id)
        .outerjoin(Fazenda, Oferta.fazenda_id == Fazenda.id)
        .outerjoin(Usuario, Oferta.usuario_id == Usuario.id)
        .where(Oferta.ativo == (not inativos))
    )
    resultados = session.exec(query).all()
    lista_final = []
    for oferta, p_nome, f_nome, c_nome in resultados:
        item = oferta.model_dump()
        item["produtor_nome"] = p_nome or "N/A"
        item["fazenda_nome"] = f_nome or "N/A"
        item["corretor_nome"] = c_nome or "N/A"
        lista_final.append(item)
    return lista_final

@app.get("/ofertas/{oferta_id}", tags=["Oferta"])
def ler_oferta_por_id(oferta_id: int, session: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    oferta = session.get(Oferta, oferta_id)
    if not oferta or not oferta.ativo:
        raise HTTPException(status_code=404, detail="Oferta não encontrada.")
    produtor = session.get(Produtor, oferta.produtor_id)
    fazenda = session.get(Fazenda, oferta.fazenda_id)
    corretor = session.get(Usuario, oferta.usuario_id) if oferta.usuario_id else None
    
    item = oferta.model_dump()
    item["produtor_nome"] = produtor.nome if produtor else "N/A"
    item["fazenda_nome"] = fazenda.nome if fazenda else "N/A"
    item["corretor_nome"] = corretor.nome if corretor else "N/A"
    return item

@app.put("/ofertas/{oferta_id}", tags=["Oferta"])
def atualizar_oferta(oferta_id: int, dados_atualizados: OfertaUpdate, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    oferta = db.get(Oferta, oferta_id)
    if not oferta or not oferta.ativo: raise HTTPException(status_code=404)
    
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor" and oferta.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Permissão negada.")
        
    campos_permitidos = ['tipo_oferta', "commodity", "volume", "tipo_medida", "preco", "moeda", "tipo_frete", "data_entrega_embarque"]
    for key, value in dados_atualizados.model_dump(exclude_unset=True).items():
        if hasattr(oferta, key) and key in campos_permitidos:
            setattr(oferta, key, value)
            
    db.add(oferta)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Ofertas', id_afetado=oferta.id, acao='Alterar',
                    detalhes=f'A oferta de id {oferta.id} foi alterada')
    db.add(log)
    db.commit()
    db.refresh(oferta)
    return oferta

@app.delete("/ofertas/{oferta_id}", tags=["Oferta"])
def deletar_oferta(oferta_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin": raise HTTPException(status_code=403)
    oferta = db.get(Oferta, oferta_id)
    if not oferta or not oferta.ativo:
        raise HTTPException(status_code=404, detail="Oferta não encontrada.")
    usuario_db = obter_usuario_db(usuario_logado,db)
    oferta.ativo = False
    db.add(oferta)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Ofertas', id_afetado=oferta.id, acao='Deletar',
                    detalhes=f'A oferta de id {oferta.id} foi desativada')
    db.add(log)
    db.commit()
    return {"msg": "Oferta desativada."}

@app.put("/ofertas/{oferta_id}/restaurar", tags=["Oferta"])
def restaurar_oferta(oferta_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem restaurar registros.")
    oferta = db.get(Oferta, oferta_id)
    if not oferta:
        raise HTTPException(status_code=404, detail="Oferta não encontrada.")
    oferta.ativo = True
    db.add(oferta)
    usuario_db = obter_usuario_db(usuario_logado, db)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Ofertas', id_afetado=oferta.id, acao='Restaurar',
                    detalhes=f'A oferta de id {oferta.id} foi restaurada')
    db.add(log)
    db.commit()
    return {"msg": "Oferta restaurada com sucesso.", "dados": oferta}

# ==========================================
# 🛒 F. COMPRADORES
# ==========================================
@app.post("/compradores/", response_model=Comprador, tags=["Comprador"])
def criar_comprador(comprador: Comprador, session: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    usuario_db = obter_usuario_db(usuario_logado, session)

    empresa_db = session.get(Empresa, comprador.empresa_id)
    if not empresa_db or not empresa_db.ativo: 
        raise HTTPException(status_code=404, detail="Empresa compradora não encontrada ou inativa.")

    if not comprador.usuario_id or usuario_logado.get("cargo") == "corretor":
        comprador.usuario_id = usuario_db.id

    session.add(comprador)
    session.flush()
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Compradores', id_afetado=comprador.id, acao='Adicionar',
                    detalhes=f'{comprador.nome} foi adicionado como comprador')
    session.add(log)
    try:
        session.commit()
        session.refresh(comprador)
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=400, detail="E-mail já está em uso por outro comprador.")
    return comprador

@app.get("/compradores/", tags=["Comprador"])
def listar_compradores(inativos: bool = False, session: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if inativos and usuario_logado.get("cargo") not in ["admin", "gerente"]:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    
    query = (
        select(Comprador, Empresa.razao_social.label("empresa_razao_social"))
        .outerjoin(Empresa, Comprador.empresa_id == Empresa.id)
        .where(Comprador.ativo == (not inativos))
    )
    usuario_db = obter_usuario_db(usuario_logado, session)
    if usuario_logado.get("cargo") == "corretor":
        query = query.where(Comprador.usuario_id == usuario_db.id)
        
    resultados = session.exec(query).all()
    lista_final = []
    for comprador, empresa_nome in resultados:
        item = comprador.model_dump()
        item["empresa_razao_social"] = empresa_nome or "N/A"
        lista_final.append(item)
    return lista_final

@app.get("/compradores/{comprador_id}", tags=["Comprador"])
def ler_comprador_por_id(comprador_id: int, session: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    comprador = session.get(Comprador, comprador_id)
    if not comprador or not comprador.ativo:
        raise HTTPException(status_code=404, detail="Comprador não encontrado.")
    usuario_db = obter_usuario_db(usuario_logado, session)
    if usuario_logado.get("cargo") == "corretor" and comprador.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Acesso negado. Este comprador não pertence a você.")
    
    empresa = session.get(Empresa, comprador.empresa_id)
    item = comprador.model_dump()
    item["empresa_razao_social"] = empresa.razao_social if empresa else "N/A"
    return item

@app.put("/compradores/{comprador_id}", tags=["Comprador"])
def atualizar_comprador(comprador_id: int, dados_atualizados: CompradorUpdate, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    comprador = db.get(Comprador, comprador_id)
    if not comprador or not comprador.ativo: 
        raise HTTPException(status_code=404)
    
    usuario_db = obter_usuario_db(usuario_logado, db)
    # Bloqueia se o corretor tentar editar um comprador que não é dele
    if usuario_logado.get("cargo") == "corretor" and comprador.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Permissão negada. Você só pode editar seus próprios compradores.")

    campos_permitidos=['nome','email','telefone']
    for key, value in dados_atualizados.model_dump(exclude_unset=True).items():
        if hasattr(comprador, key) and key != "id":
            if key in campos_permitidos:
                setattr(comprador, key, value)
            
    db.add(comprador)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Compradores', id_afetado=comprador.id, acao='Alterar',
                    detalhes=f'O comprador {comprador.nome} foi alterado')
    db.add(log)
    try:
        db.commit()
        db.refresh(comprador)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="E-mail já está em uso por outro comprador.")
    return comprador

@app.delete("/compradores/{comprador_id}", tags=["Comprador"])
def deletar_comprador(comprador_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    # Apenas Admin pode deletar
    if usuario_logado.get("cargo") != "admin": 
        raise HTTPException(status_code=403)
    usuario_db=obter_usuario_db(usuario_logado,db)
    comprador = db.get(Comprador, comprador_id)
    if not comprador or not comprador.ativo:
        raise HTTPException(status_code=404, detail="Comprador não encontrado.")
    comprador.ativo = False
    db.add(comprador)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Compradores', id_afetado=comprador.id, acao='Deletar',
                    detalhes=f'O comprador {comprador.nome} foi desativado')
    db.add(log)
    db.commit()
    return {"msg": "Comprador desativado com sucesso."}

@app.put("/compradores/{comprador_id}/restaurar", tags=["Comprador"])
def restaurar_comprador(comprador_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem restaurar registros.")
    comprador = db.get(Comprador, comprador_id)
    if not comprador:
        raise HTTPException(status_code=404, detail="Comprador não encontrado.")
    comprador.ativo = True
    db.add(comprador)
    usuario_db = obter_usuario_db(usuario_logado, db)
    log = Historico(usuario_id=usuario_db.id, tabela_afetada='Compradores', id_afetado=comprador.id, acao='Restaurar',
                    detalhes=f'O comprador {comprador.nome} foi restaurado')
    db.add(log)
    db.commit()
    return {"msg": "Comprador restaurado com sucesso.", "dados": comprador}


# ==========================================
# 📄 EXPORTAÇÃO E EXTRA (Apenas Gerência)
# ==========================================
@app.get("/exportar-excel/", tags=["Exportacao"])
def exportar_dados_para_excel(
    tabelas: Optional[str] = None, # Opcional: ex: "fazendas,empresas"
    db: Session = Depends(get_session), 
    usuario_logado=Depends(usuario_atual)
):
    usuario_db = obter_usuario_db(usuario_logado, db)
    cargo = usuario_logado.get("cargo")
    
    # 1. Define quais tabelas o usuário quer exportar
    if tabelas:
        tabelas_solicitadas = [t.strip().lower() for t in tabelas.split(",")]
    else:
        tabelas_solicitadas = ["usuarios", "contratos", "ofertas", "produtores", "fazendas", "empresas", "compradores"]
        
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        sheets_escritas = 0
        
        # 👤 USUÁRIOS (Apenas Admin e Gerente)
        if "usuarios" in tabelas_solicitadas and cargo in ["admin", "gerente"]:
            usuarios = db.exec(select(Usuario).where(Usuario.ativo == True)).all()
            dados_usuarios = []
            for u in usuarios:
                dados_usuarios.append({
                    "ID": u.id,
                    "Nome": u.nome,
                    "E-mail": u.email,
                    "Telefone": u.telefone,
                    "Cargo": u.cargo.capitalize() if u.cargo else "N/A",
                    "Comissão Padrão (%)": u.comissao_padrao or 0.0,
                })
            df = pd.DataFrame(dados_usuarios)
            if not df.empty:
                df.to_excel(writer, sheet_name='Usuários', index=False)
                sheets_escritas += 1

        # 📄 CONTRATOS
        if "contratos" in tabelas_solicitadas:
            query = (
                select(
                    Contrato,
                    Produtor.nome.label("produtor_nome"),
                    Fazenda.nome.label("fazenda_nome"),
                    Empresa.razao_social.label("empresa_razao_social"),
                    Usuario.nome.label("corretor_nome")
                )
                .outerjoin(Produtor, Contrato.produtor_id == Produtor.id)
                .outerjoin(Fazenda, Contrato.fazenda_id == Fazenda.id)
                .outerjoin(Empresa, Contrato.empresa_id == Empresa.id)
                .outerjoin(Usuario, Contrato.usuario_id == Usuario.id)
                .where(Contrato.ativo == True)
            )
            if cargo == "corretor":
                query = query.where(Contrato.usuario_id == usuario_db.id)
            resultados = db.exec(query).all()
            
            dados_contratos = []
            for c, p_nome, f_nome, e_nome, u_nome in resultados:
                dados_contratos.append({
                    "Nº Contrato": c.id,
                    "Data Fechamento": c.data_fechamento.strftime('%d/%m/%Y') if c.data_fechamento else "N/A",
                    "Status": c.status,
                    "Corretor Responsável": u_nome or "N/A",
                    "Produtor": p_nome or "N/A",
                    "Fazenda de Origem": f_nome or "N/A",
                    "Comprador (Trading)": e_nome or "N/A",
                    "Produto": c.commodity,
                    "Safra": c.safra,
                    "Volume": c.volume,
                    "Unidade Medida": c.tipo_medida,
                    "Moeda": c.moeda,
                    "Preço Unitário": c.preco_unitario,
                    "Valor Total": c.valor_total,
                    "Tipo de Frete": c.tipo_frete,
                    "Data Entrega": c.data_entrega.strftime('%d/%m/%Y') if c.data_entrega else "",
                    "Data Pagamento": c.data_pagamento.strftime('%d/%m/%Y') if c.data_pagamento else "",
                    "Nº Contrato Trading": c.numero_contrato_trading or "",
                    "Comissão (%)": c.comissao_porcentagem,
                    "Valor Comissão": c.valor_comissao,
                    "Observações": c.observacoes or ""
                })
            df = pd.DataFrame(dados_contratos)
            if not df.empty:
                df.to_excel(writer, sheet_name='Contratos', index=False)
                sheets_escritas += 1

        # 📊 OFERTAS
        if "ofertas" in tabelas_solicitadas:
            query = (
                select(
                    Oferta,
                    Produtor.nome.label("produtor_nome"),
                    Fazenda.nome.label("fazenda_nome"),
                    Usuario.nome.label("corretor_nome")
                )
                .outerjoin(Produtor, Oferta.produtor_id == Produtor.id)
                .outerjoin(Fazenda, Oferta.fazenda_id == Fazenda.id)
                .outerjoin(Usuario, Oferta.usuario_id == Usuario.id)
                .where(Oferta.ativo == True)
            )
            if cargo == "corretor":
                query = query.where(Oferta.usuario_id == usuario_db.id)
            resultados = db.exec(query).all()
            
            dados_ofertas = []
            for o, p_nome, f_nome, u_nome in resultados:
                dados_ofertas.append({
                    "ID Oferta": o.id,
                    "Tipo": o.tipo_oferta,
                    "Corretor": u_nome or "N/A",
                    "Produtor": p_nome or "N/A",
                    "Fazenda": f_nome or "N/A",
                    "Produto": o.commodity,
                    "Volume": o.volume,
                    "Unidade Medida": o.tipo_medida,
                    "Preço": o.preco,
                    "Moeda": o.moeda,
                    "Condição de Frete": getattr(o, "tipo_frete", "FOB Fazenda") or "FOB Fazenda",
                    "Data Embarque": o.data_entrega_embarque.strftime('%d/%m/%Y') if o.data_entrega_embarque else "N/A"
                })
            df = pd.DataFrame(dados_ofertas)
            if not df.empty:
                df.to_excel(writer, sheet_name='Ofertas', index=False)
                sheets_escritas += 1

        # 🌾 PRODUTORES
        if "produtores" in tabelas_solicitadas:
            query = select(Produtor, Usuario.nome.label("corretor_nome")).outerjoin(Usuario, Produtor.usuario_id == Usuario.id).where(Produtor.ativo == True)
            if cargo == "corretor":
                query = query.where(Produtor.usuario_id == usuario_db.id)
            resultados = db.exec(query).all()
            
            dados_produtores = []
            for p, u_nome in resultados:
                dados_produtores.append({
                    "ID": p.id,
                    "Nome do Produtor": p.nome,
                    "WhatsApp": p.whatsapp or "",
                    "CPF / CNPJ": p.cpf_cnpj or "",
                    "Cidade": p.cidade or "",
                    "UF": p.uf or "",
                    "Corretor Responsável": u_nome or "N/A"
                })
            df = pd.DataFrame(dados_produtores)
            if not df.empty:
                df.to_excel(writer, sheet_name='Produtores', index=False)
                sheets_escritas += 1

        # 🚜 FAZENDAS
        if "fazendas" in tabelas_solicitadas:
            query = select(Fazenda, Produtor.nome.label("produtor_nome"), Usuario.nome.label("corretor_nome")).outerjoin(Produtor, Fazenda.produtor_id == Produtor.id).outerjoin(Usuario, Fazenda.usuario_id == Usuario.id).where(Fazenda.ativo == True)
            if cargo == "corretor":
                query = query.where(Fazenda.usuario_id == usuario_db.id)
            resultados = db.exec(query).all()
            
            dados_fazendas = []
            for f, p_nome, u_nome in resultados:
                dados_fazendas.append({
                    "ID": f.id,
                    "Nome da Fazenda": f.nome,
                    "Produtor Proprietário": p_nome or "N/A",
                    "Município": f.municipio or "",
                    "Inscrição Estadual": f.inscricao_estadual or "",
                    "Telefone": f.telefone or "",
                    "Capacidade Carregamento (t/dia)": f.capacidade_carregamento or "",
                    "Comprimento Balança (m)": f.comprimento_balanca or "",
                    "Condição do Frete": f.condicao_frete or "",
                    "Coordenadas": f.coordenadas or "",
                    "Roteiro / Localização": f.descricao_roteiro or "",
                    "Cadastrado Por": u_nome or "N/A"
                })
            df = pd.DataFrame(dados_fazendas)
            if not df.empty:
                df.to_excel(writer, sheet_name='Fazendas', index=False)
                sheets_escritas += 1

        # 🏢 EMPRESAS (Tradings)
        if "empresas" in tabelas_solicitadas:
            query = select(Empresa).where(Empresa.ativo == True)
            empresas = db.exec(query).all()
            dados_empresas = []
            for e in empresas:
                dados_empresas.append({
                    "ID": e.id,
                    "Razão Social": e.razao_social,
                    "CNPJ": e.cnpj,
                    "Inscrição Estadual": e.inscricao_estadual or "",
                    "Pessoa de Contato": e.contato_nome or "",
                    "Telefone": e.telefone or "",
                    "E-mail": e.email or "",
                    "Endereço": e.endereco or ""
                })
            df = pd.DataFrame(dados_empresas)
            if not df.empty:
                df.to_excel(writer, sheet_name='Empresas', index=False)
                sheets_escritas += 1
                
        # 🛒 COMPRADORES
        if "compradores" in tabelas_solicitadas:
            query = select(Comprador, Empresa.razao_social.label("empresa_nome"), Usuario.nome.label("corretor_nome")).outerjoin(Empresa, Comprador.empresa_id == Empresa.id).outerjoin(Usuario, Comprador.usuario_id == Usuario.id).where(Comprador.ativo == True)
            if cargo == "corretor":
                query = query.where(Comprador.usuario_id == usuario_db.id)
            resultados = db.exec(query).all()
            dados_compradores = []
            for comp, emp_nome, u_nome in resultados:
                dados_compradores.append({
                    "ID": comp.id,
                    "Nome do Contato": comp.nome,
                    "Empresa (Trading)": emp_nome or "N/A",
                    "E-mail": comp.email,
                    "Telefone": comp.telefone,
                    "Cadastrado Por": u_nome or "N/A"
                })
            df = pd.DataFrame(dados_compradores)
            if not df.empty:
                df.to_excel(writer, sheet_name='Compradores', index=False)
                sheets_escritas += 1

        # Se a pessoa pedir uma tabela vazia (ou tentar fraudar), retorna um aviso
        if sheets_escritas == 0:
            pd.DataFrame([{"Aviso": "Nenhum dado encontrado ou sem permissão para exportar."}]).to_excel(writer, sheet_name='Sem Dados', index=False)
        else:
            # 📏 Auto-fit nas colunas em todas as abas criadas
            for ws in writer.book.worksheets:
                for col in ws.columns:
                    max_len = max((len(str(cell.value or '')) for cell in col), default=10)
                    col_letter = col[0].column_letter
                    ws.column_dimensions[col_letter].width = min(max(max_len + 4, 12), 50)

    output.seek(0)
    return StreamingResponse(
        output, 
        headers={'Content-Disposition': 'attachment; filename="relatorio_corretora.xlsx"'}, 
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )


@app.post("/esqueci-senha", tags=["Senha"])
@limiter.limit("3/minute")
def esqueci_senha(
    request: Request, 
    background_tasks: BackgroundTasks, 
    email: Optional[str] = None,
    dados: Optional[EsqueciSenhaRequest] = None,
    db: Session = Depends(get_session)
):
    target_email = email or (dados.email if dados else None)
    if not target_email:
        raise HTTPException(status_code=400, detail="E-mail não fornecido.")

    # 1. Busca pelo usuário pelo e-mail recebido
    usuario = db.exec(select(Usuario).where(Usuario.email == target_email)).first()
    
    if not usuario:
        return {"msg": "Se o e-mail estiver cadastrado, as instruções serão enviadas."}
        
    if not usuario.telefone:
        raise HTTPException(status_code=400, detail="Este usuário não possui um telefone cadastrado para receber o token. Contate o administrador.")
    
    token_recuperacao = "".join(secrets.choice(string.digits) for _ in range(6))
    usuario.reset_token = token_recuperacao
    usuario.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    db.add(usuario)
    db.commit()
    
    texto_whatsapp = (
        f"🔐 *Recuperação de Senha*\n\n"
        f"Olá {usuario.nome}, você solicitou a redefinição de senha no sistema.\n\n"
        f"Use o token abaixo para cadastrar sua nova senha:\n\n"
        f"*{token_recuperacao}*\n\n"
        f"⏳ _Este token é válido por 15 minutos._"
    )
    
    # Envio em segundo plano
    background_tasks.add_task(disparar_whatsapp_comprador, usuario.telefone, texto_whatsapp)
    
    return {"msg": "As instruções foram enviadas para o seu WhatsApp cadastrado!"}

class RedefinirSenhaRequest(BaseModel):
    token: str
    nova_senha: str

@app.post("/redefinir-senha", tags=["Senha"])
@limiter.limit("5/minute")
def redefinir_senha(request: Request, dados: RedefinirSenhaRequest, db: Session = Depends(get_session)):
    if len(dados.nova_senha) < 8:
        raise HTTPException(status_code=400, detail="A nova senha deve ter no mínimo 8 caracteres.")

    usuario = db.exec(select(Usuario).where(Usuario.reset_token == dados.token)).first()

    if not usuario or not usuario.reset_token_expires:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado.")

    # Se a data no banco for naive, compara com utcnow naive ou utc aware
    expiracao = usuario.reset_token_expires
    if expiracao.tzinfo is None:
        agora = datetime.utcnow()
    else:
        agora = datetime.now(timezone.utc)

    if agora > expiracao:
        raise HTTPException(status_code=400, detail="O token de recuperação expirou.")

    usuario.senha_hash = obter_hash_senha(dados.nova_senha)
    usuario.reset_token = None
    usuario.reset_token_expires = None

    db.add(usuario)
    db.commit()

    return {"msg": "Senha redefinida com sucesso! Faça login com a nova senha."}

@app.get("/conectar-whatsapp", tags=["WhatsApp"])
def conectar_whatsapp(
    instancia: Optional[str] = None,
    session: Session = Depends(get_session),
    usuario_logado=Depends(usuario_atual)
):
    """Gera o QR Code do WhatsApp para a instância do usuário logado"""
    usuario_db = obter_usuario_db(usuario_logado, session)
    if instancia and usuario_logado.get("cargo") in ["admin", "gerente"]:
        nome_instancia = instancia
    else:
        nome_instancia = obter_instancia_usuario(usuario_db)

    headers = {
        "apikey": EVOLUTION_API_KEY,
        "Content-Type": "application/json"
    }
    
    try:
        # 1. Tenta CRIAR a nova instância
        url_create = f"{EVOLUTION_URL}/instance/create"
        payload = {"instanceName": nome_instancia, "qrcode": True, "integration": "WHATSAPP-BAILEYS"}
        resposta = requests.post(url_create, headers=headers, json=payload)
        dados = resposta.json()
        
        # 2. Se a instância já existir, a Evolution devolve erro 403. Aí tentamos o CONNECT.
        if resposta.status_code == 403 or (isinstance(dados, dict) and dados.get("error") == "Instance already exists"):
            url_connect = f"{EVOLUTION_URL}/instance/connect/{nome_instancia}"
            resposta = requests.get(url_connect, headers=headers)
            dados = resposta.json()

        # 3. Procura a imagem do QR Code na resposta
        imagem_base64 = None
        if isinstance(dados, dict):
            if "base64" in dados:
                imagem_base64 = dados["base64"]
            elif "qrcode" in dados and "base64" in dados["qrcode"]:
                imagem_base64 = dados["qrcode"]["base64"]
        
        if imagem_base64:
            return {
                "status": "aguardando_leitura",
                "instancia": nome_instancia,
                "qrcode": imagem_base64
            }
        else:
            # 4. Checa o estado da conexão na Evolution API
            state_url = f"{EVOLUTION_URL}/instance/connectionState/{nome_instancia}"
            state_res = requests.get(state_url, headers=headers)
            state_data = state_res.json() if state_res.status_code == 200 else {}
            state = state_data.get("instance", {}).get("state") if isinstance(state_data, dict) else None

            if state == "open":
                return {
                    "status": "conectado",
                    "instancia": nome_instancia,
                    "detalhes": state_data
                }
            else:
                return {
                    "status": "indisponivel",
                    "instancia": nome_instancia,
                    "detalhes": dados
                }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao conectar com a Evolution API: {str(e)}")

@app.post("/desconectar-whatsapp", tags=["WhatsApp"])
def desconectar_whatsapp(
    instancia: Optional[str] = None,
    session: Session = Depends(get_session),
    usuario_logado=Depends(usuario_atual)
):
    """Desconecta a instância do WhatsApp na Evolution API para permitir novo pareamento"""
    usuario_db = obter_usuario_db(usuario_logado, session)
    if instancia and usuario_logado.get("cargo") in ["admin", "gerente"]:
        nome_instancia = instancia
    else:
        nome_instancia = obter_instancia_usuario(usuario_db)

    headers = {
        "apikey": EVOLUTION_API_KEY,
        "Content-Type": "application/json"
    }
    
    try:
        url_logout = f"{EVOLUTION_URL}/instance/logout/{nome_instancia}"
        resposta = requests.delete(url_logout, headers=headers)
        return {
            "status": "desconectado",
            "instancia": nome_instancia,
            "detalhes": resposta.json() if resposta.content else {}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao desconectar WhatsApp: {str(e)}")

@app.get('/historicos/',tags=['Historico'])
def pegar_historico(db=Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get('cargo') not in ['admin', 'gerente']:
        raise HTTPException(status_code=403, detail="Cargo sem permissão")
    resultados = db.exec(
        select(Historico, Usuario.nome)
        .join(Usuario, Historico.usuario_id == Usuario.id)
        .order_by(Historico.id.desc())).all()
    lista_final = []
    
    for historico, nome in resultados:
        # Transforma o objeto do histórico em um dicionário
        item = historico.model_dump()
        
        # Cria uma gaveta nova no dicionário e coloca o nome lá dentro
        item["usuario_nome"] = nome
        
        # Adiciona esse dicionário pronto na nossa lista final
        lista_final.append(item)
        
    # 3. Devolve a lista pronta para o frontend
    return lista_final