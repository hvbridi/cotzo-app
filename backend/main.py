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
from datetime import date, datetime, timedelta
import secrets
from fastapi.responses import HTMLResponse
# Nossas tabelas
from modelo_tabela import Usuario, Produtor, Fazenda, Empresa, Contrato, Oferta, Comprador, Historico
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

EVOLUTION_URL = "https://evolution-api-production-aeca.up.railway.app"
EVOLUTION_API_KEY = os.getenv('EVOLUTION_API_KEY')
INSTANCIA = "corretora"


def disparar_whatsapp_comprador(telefone: str, mensagem: str):
    url = f"{EVOLUTION_URL}/message/sendText/{INSTANCIA}"
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
        print(f"Erro ao enviar WhatsApp: {e}")
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

# ==========================================
# 🔐 LOGIN E USUÁRIOS
# ==========================================
@app.post("/login")
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)):
    usuario = db.exec(select(Usuario).where(Usuario.email == form_data.username)).first()
    if not usuario or not verificar_senha(form_data.password, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    token = criar_token_acesso({"sub": usuario.email, "cargo": usuario.cargo})
    return {"access_token": token, "token_type": "bearer"}

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    senha_hash: Optional[str] = None
    cargo: Optional[str] = None
    comissao_padrao: Optional[float] = None

@app.post("/usuarios/", tags=["Usuario"])
def criar_usuario(usuario: Usuario, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get('cargo') != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores criam usuários.")
    if usuario.cargo not in ["corretor", "gerente", "admin"]:
        raise HTTPException(status_code=400, detail="Cargo inválido. Digite apenas: corretor, gerente ou admin.")
    usuario.senha_hash = obter_hash_senha(usuario.senha_hash)
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return {"msg": "Usuário criado com sucesso!", "dados": usuario.model_dump(exclude={"senha_hash", "reset_token", "reset_token_expires"})}

@app.get("/usuarios/", tags=["Usuario"])
def ler_usuarios(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    # Corretor não pode ver a lista de todos os usuários
    if usuario_logado.get("cargo") == "corretor":
        raise HTTPException(status_code=403, detail="Acesso negado.")
    usuarios = db.exec(select(Usuario)).all()
    return [u.model_dump(exclude={"senha_hash", "reset_token", "reset_token_expires"}) for u in usuarios]

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
    db.commit()
    db.refresh(usuario)
    return {"msg": "Usuário atualizado!", "dados": usuario.model_dump(exclude={"senha_hash"})}

@app.delete("/usuarios/{usuario_id}", tags=["Usuario"])
def deletar_usuario(usuario_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get('cargo') != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores excluem registros.")
    usuario = db.get(Usuario, usuario_id)
    if not usuario: raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    db.delete(usuario)
    db.commit()
    return {"msg": "Usuário deletado com sucesso."}


# ==========================================
# 🌾 B. PRODUTORES
# ==========================================
@app.post("/produtores/", tags=["Produtor"])
def criar_produtor(produtor: Produtor, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    usuario_db = obter_usuario_db(usuario_logado, db)
    # Atrela o produtor ao corretor que o criou, caso não tenha sido enviado
    if not produtor.usuario_id:
        produtor.usuario_id = usuario_db.id
        
    db.add(produtor)
    db.commit()
    db.refresh(produtor)
    log = Historico(usuario_id=usuario_db.id,tabela_afetada='Produtores',id_afetado=produtor.id,acao='Adicionar',
                            detalhes=f'O produtor {produtor.nome} foi adicionado')
    db.add(log)
    db.commit()
    return {"msg": "Produtor criado com sucesso!", "dados": produtor}

@app.get("/produtores/", tags=["Produtor"])
def ler_produtores(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") in ["admin", "gerente"]:
        return db.exec(select(Produtor)).all()
    
    # Se for corretor, vê apenas os clientes dele
    usuario_db = obter_usuario_db(usuario_logado, db)
    return db.exec(select(Produtor).where(Produtor.usuario_id == usuario_db.id)).all()

@app.put("/produtores/{produtor_id}", tags=["Produtor"])
def atualizar_produtor(produtor_id: int, dados_atualizados: dict, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    produtor = db.get(Produtor, produtor_id)
    if not produtor: raise HTTPException(status_code=404, detail="Produtor não encontrado.")
        
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor" and produtor.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Você só pode editar seus próprios clientes.")

    for key, value in dados_atualizados.items():
        if hasattr(produtor, key) and key != "id":
            setattr(produtor, key, value)
            
    db.add(produtor)
    db.commit()
    db.refresh(produtor)
    return produtor

@app.delete("/produtores/{produtor_id}", tags=["Produtor"])
def deletar_produtor(produtor_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem excluir registros.")
    produtor = db.get(Produtor, produtor_id)
    if not produtor: raise HTTPException(status_code=404)
    usuario_db = obter_usuario_db(usuario_logado,db)
    db.delete(produtor)
    log = Historico(usuario_id=usuario_db.id,tabela_afetada='Produtores',id_afetado=produtor.id,acao='Deletar',
                                detalhes=f'O produtor {produtor.nome} foi deletado')
    db.add(log)
    db.commit()
    return {"msg": "Produtor deletado com sucesso."}


# ==========================================
# 🚜 C. FAZENDAS
# ==========================================
@app.post("/fazendas/", tags=["Fazenda"])
def criar_fazenda(fazenda: Fazenda, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    usuario_db = obter_usuario_db(usuario_logado, db)
    if not fazenda.usuario_id: fazenda.usuario_id = usuario_db.id
    db.add(fazenda)
    db.commit()
    db.refresh(fazenda)
    log = Historico(usuario_id=usuario_db.id,tabela_afetada='Fazendas',id_afetado=fazenda.id,acao='Adicionar',
                    detalhes=f'A fazenda {fazenda.nome} foi adicionada')
    db.add(log)
    db.commit()
    return {"msg": "Fazenda criada com sucesso!", "dados": fazenda}

@app.get("/produtores/{produtor_id}/fazendas", tags=["Fazenda"])
def ler_fazendas_do_produtor(produtor_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    fazendas = db.exec(select(Fazenda).where(Fazenda.produtor_id == produtor_id)).all()
    return fazendas

@app.put("/fazendas/{fazenda_id}", tags=["Fazenda"])
def atualizar_fazenda(fazenda_id: int, dados_atualizados: dict, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    fazenda = db.get(Fazenda, fazenda_id)
    if not fazenda: raise HTTPException(status_code=404)
    
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor" and fazenda.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Permissão negada.")
        
    campos_permitidos = ["nome", "capacidade_carregamento", "comprimento_balanca", "telefone", "condicao_frete", "inscricao_estadual", "coordenadas", "municipio", "descricao_roteiro"]
    for key, value in dados_atualizados.items():
        if hasattr(fazenda, key) and key in campos_permitidos:
            setattr(fazenda, key, value)
            
    db.add(fazenda)
    db.commit()
    db.refresh(fazenda)
    return fazenda

@app.delete("/fazendas/{fazenda_id}", tags=["Fazenda"])
def deletar_fazenda(fazenda_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin": raise HTTPException(status_code=403)
    fazenda = db.get(Fazenda, fazenda_id)
    usuario_db = obter_usuario_db(usuario_logado,db)
    db.delete(fazenda)
    log = Historico(usuario_id=usuario_db.id,tabela_afetada='Fazendas',id_afetado=fazenda.id,acao='Deletar',
                        detalhes=f'A fazenda {fazenda.nome} foi deletada')
    db.add(log)
    db.commit()
    return {"msg": "Fazenda deletada."}


# ==========================================
# 🏢 D. EMPRESAS (Tradings)
# ==========================================
@app.post("/empresas/", tags=["Empresa"])
def criar_empresa(empresa: Empresa, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    usuario_db = obter_usuario_db(usuario_logado, db)
    if not empresa.usuario_id: empresa.usuario_id = usuario_db.id
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    log = Historico(usuario_id=usuario_db.id,tabela_afetada='Empresas',id_afetado=empresa.id,acao='Adicionar',
                        detalhes=f'A empresa {empresa.razao_social} foi adicionada')
    db.add(log)
    db.commit()
    return {"msg": "Empresa criada com sucesso!", "dados": empresa}

@app.get("/empresas/", tags=["Empresa"])
def ler_empresas(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") in ["admin", "gerente"]:
        return db.exec(select(Empresa)).all()
        
    usuario_db = obter_usuario_db(usuario_logado, db)
    return db.exec(select(Empresa).where(Empresa.usuario_id == usuario_db.id)).all()

@app.put("/empresas/{empresa_id}", tags=["Empresa"])
def atualizar_empresa(empresa_id: int, dados_atualizados: dict, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    empresa = db.get(Empresa, empresa_id)
    if not empresa: raise HTTPException(status_code=404)
    
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor" and empresa.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Você só pode editar suas próprias empresas cadastradas.")
        
    for key, value in dados_atualizados.items():
        if hasattr(empresa, key) and key != "id":
            setattr(empresa, key, value)
            
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    return empresa

@app.delete("/empresas/{empresa_id}", tags=["Empresa"])
def deletar_empresa(empresa_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin": raise HTTPException(status_code=403)
    empresa = db.get(Empresa, empresa_id)
    usuario_db = obter_usuario_db(usuario_logado,db)
    db.delete(empresa)
    log = Historico(usuario_id=usuario_db.id,tabela_afetada='Empresas',id_afetado=empresa.id,acao='Deletar',
                        detalhes=f'A empresa {empresa.razao_social} foi deletada')
    db.add(log)
    db.commit()
    return {"msg": "Empresa deletada."}


# ==========================================
# 📄 E. CONTRATOS (O Coração do Sistema)
# ==========================================
@app.post("/contratos/", tags=["Contrato"])
def criar_contrato(contrato: Contrato, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    usuario_db = obter_usuario_db(usuario_logado, db)
    
    # O dono do contrato é sempre quem está logado, a menos que o admin passe outro ID
    if usuario_logado.get("cargo") == "corretor" or not contrato.usuario_id:
        contrato.usuario_id = usuario_db.id

    contrato.valor_total = contrato.volume * contrato.preco_unitario
    contrato.valor_comissao = contrato.valor_total * (contrato.comissao_porcentagem / 100)
    
    db.add(contrato)
    db.commit()
    db.refresh(contrato)
    log = Historico(usuario_id=usuario_db.id,tabela_afetada='Contratos',id_afetado=contrato.id,acao='Adicionar',
                        detalhes=f'O contrato de id {contrato.id} foi adicionado')
    db.add(log)
    db.commit()
    
    # ================= DISPAROS DO WHATSAPP =================
    produtor = db.get(Produtor, contrato.produtor_id)
    empresa = db.get(Empresa, contrato.empresa_id)
    fazenda = db.get(Fazenda, contrato.fazenda_id)
    
    nome_corretor = usuario_db.nome if usuario_db else "Corretor"
    telefone_corretor = usuario_db.telefone if usuario_db else ""

    if produtor and produtor.whatsapp:
        msg_produtor = (
            f"🤝 *CONTRATO FECHADO COM SUCESSO!* 🤝\n\n"
            f"Olá *{produtor.nome}*, seu negócio foi concluído!\n\n"
            f"🌱 *Produto:* {contrato.commodity} ({contrato.safra})\n"
            f"📦 *Volume:* {contrato.volume:,.2f} {contrato.tipo_medida.lower()}\n"
            f"💰 *Preço:* {contrato.moeda} {contrato.preco_unitario:,.2f} / {contrato.tipo_medida.lower()}\n"
            f"🏢 *Comprador:* {empresa.razao_social}\n"
            f"🚚 *Frete:* {contrato.tipo_frete}\n\n"
            f"👨‍💼 *Corretor responsável:* {nome_corretor}\n"
            f"Agradecemos a confiança e ótimos negócios!"
        )
        disparar_whatsapp_comprador(produtor.whatsapp, msg_produtor)

    if empresa and empresa.telefone:
        msg_empresa = (
            f"📄 *NOVO FECHAMENTO DE CONTRATO* 📄\n\n"
            f"Olá equipe *{empresa.razao_social}*, um novo negócio foi fechado:\n\n"
            f"👤 *Produtor:* {produtor.nome}\n"
            f"🚜 *Origem:* {fazenda.nome}\n"
            f"🌱 *Produto:* {contrato.commodity} ({contrato.safra})\n"
            f"📦 *Volume:* {contrato.volume:,.2f} {contrato.tipo_medida.lower()}\n"
            f"💰 *Preço Acordado:* {contrato.moeda} {contrato.preco_unitario:,.2f}\n"
            f"🚚 *Modalidade:* {contrato.tipo_frete}\n\n"
            f"👨‍💼 *Corretor:* {nome_corretor}\n"
            f"📞 *Contato do Corretor:* {telefone_corretor}\n\n"
            f"Em breve enviaremos a documentação oficial."
        )
        disparar_whatsapp_comprador(empresa.telefone, msg_empresa)
        
    return {"msg": "Contrato emitido e notificações enviadas com sucesso!", "dados": contrato}

@app.get("/contratos/", tags=["Contrato"])
def ler_contratos(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") in ["admin", "gerente"]:
        return db.exec(select(Contrato)).all()
        
    usuario_db = obter_usuario_db(usuario_logado, db)
    return db.exec(select(Contrato).where(Contrato.usuario_id == usuario_db.id)).all()

@app.put("/contratos/{contrato_id}", tags=["Contrato"])
def atualizar_contrato(contrato_id: int, dados_atualizados: dict, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    contrato = db.get(Contrato, contrato_id)
    if not contrato: raise HTTPException(status_code=404)
    
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor" and contrato.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Você só pode editar seus próprios contratos.")

    campos_permitidos = ["data_fechamento", "commodity", "safra", "volume", "tipo_medida", "moeda", "preco_unitario", "tipo_frete", "data_entrega", "data_pagamento", "numero_contrato_trading", "comissao_porcentagem", "status", "observacoes", "produtor_id", "fazenda_id", "empresa_id"]
    for key, value in dados_atualizados.items():
        if hasattr(contrato, key) and key in campos_permitidos:
            setattr(contrato, key, value)
            
    contrato.valor_total = contrato.volume * contrato.preco_unitario
    contrato.valor_comissao = contrato.valor_total * (contrato.comissao_porcentagem / 100)
            
    db.add(contrato)
    db.commit()
    db.refresh(contrato)
    return contrato

@app.delete("/contratos/{contrato_id}", tags=["Contrato"])
def deletar_contrato(contrato_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin": raise HTTPException(status_code=403)
    contrato = db.get(Contrato, contrato_id)
    usuario_db = obter_usuario_db(usuario_logado,db)
    db.delete(contrato)
    log = Historico(usuario_id=usuario_db.id,tabela_afetada='Contratos',id_afetado=contrato.id,acao='Deletar',
                        detalhes=f'O contrato de id {contrato.id} foi deletado')
    db.add(log)
    db.commit()
    return {"msg": "Contrato deletado."}


# ==========================================
# 📊 OFERTAS E COMPRADORES
# ==========================================
class OfertaCreate(BaseModel):
    produtor_id: int
    fazenda_id: int
    commodity: str = "Soja"
    volume: int
    tipo_medida: str = "Sacas"
    preco: float
    moeda: str = "BRL"
    data_entrega_embarque: date
    compradores_ids: List[int] = []

@app.post("/ofertas/", response_model=Oferta, tags=["Oferta"])
def criar_oferta(dados: OfertaCreate, session: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    fazenda_db = session.get(Fazenda, dados.fazenda_id)
    if not fazenda_db: raise HTTPException(status_code=404, detail="Fazenda não encontrada.")
    if fazenda_db.produtor_id != dados.produtor_id: raise HTTPException(status_code=403)
        
    usuario_db = obter_usuario_db(usuario_logado, session)
    if not usuario_db or not usuario_db.telefone: raise HTTPException(status_code=400, detail="Corretor sem telefone.")
        
    nova_oferta = Oferta(
        usuario_id=usuario_db.id, # <--- DONO DA OFERTA
        produtor_id=dados.produtor_id,
        fazenda_id=dados.fazenda_id,
        commodity=dados.commodity,
        volume=dados.volume,
        tipo_medida=dados.tipo_medida,
        preco=dados.preco,
        moeda=dados.moeda,
        data_entrega_embarque=dados.data_entrega_embarque
    )
    
    session.add(nova_oferta)
    session.commit()
    session.refresh(nova_oferta)
    log = Historico(usuario_id=usuario_db.id,tabela_afetada='Ofertas',id_afetado=nova_oferta.id,acao='Adicionar',
                            detalhes=f'A oferta de id {nova_oferta.id} foi adicionado')
    session.add(log)
    session.commit()

    
    if dados.compradores_ids:
        produtor_nome = fazenda_db.produtor.nome
        fazenda_nome = fazenda_db.nome
        texto_mensagem = (
            f"🌾 *NOVA OFERTA DISPONÍVEL* 🌾\n\n"
            f"🌱 *Produto:* {dados.commodity}\n"
            f"👤 *Produtor:* {produtor_nome}\n"
            f"🚜 *Fazenda:* {fazenda_nome}\n"
            f"📦 *Volume:* {dados.volume:,} {dados.tipo_medida.lower()}\n"
            f"💰 *Preço:* {dados.moeda} {dados.preco:,.2f}\n"
            f"📅 *Embarque:* {dados.data_entrega_embarque}\n\n"
            f"👨‍💼 *Corretor:* {usuario_db.nome}\n"
            f"📞 *WhatsApp:* {usuario_db.telefone}\n\n"
            f"Responda esta mensagem ou clique no número acima para negociar!"
        )
        
        for comprador_id in dados.compradores_ids:
            comprador = session.get(Comprador, comprador_id)
            if comprador and comprador.telefone:
                disparar_whatsapp_comprador(comprador.telefone, texto_mensagem)

    return nova_oferta

@app.get("/ofertas/", response_model=list[Oferta], tags=["Oferta"])
def listar_ofertas(session: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") in ["admin", "gerente"]:
        return session.exec(select(Oferta)).all()
        
    usuario_db = obter_usuario_db(usuario_logado, session)
    return session.exec(select(Oferta).where(Oferta.usuario_id == usuario_db.id)).all()

@app.put("/ofertas/{oferta_id}", tags=["Oferta"])
def atualizar_oferta(oferta_id: int, dados_atualizados: dict, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    oferta = db.get(Oferta, oferta_id)
    if not oferta: raise HTTPException(status_code=404)
    
    usuario_db = obter_usuario_db(usuario_logado, db)
    if usuario_logado.get("cargo") == "corretor" and oferta.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Permissão negada.")
        
    campos_permitidos = ["commodity", "volume", "tipo_medida", "preco", "moeda", "data_entrega_embarque"]
    for key, value in dados_atualizados.items():
        if hasattr(oferta, key) and key in campos_permitidos:
            setattr(oferta, key, value)
            
    db.add(oferta)
    db.commit()
    db.refresh(oferta)
    return oferta

@app.delete("/ofertas/{oferta_id}", tags=["Oferta"])
def deletar_oferta(oferta_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get("cargo") != "admin": raise HTTPException(status_code=403)
    oferta = db.get(Oferta, oferta_id)
    usuario_db = obter_usuario_db(usuario_logado,db)
    log = Historico(usuario_id=usuario_db.id,tabela_afetada='Ofertas',id_afetado=oferta.id,acao='Deletar',
                            detalhes=f'A oferta de id {oferta.id} foi deletada')
    db.delete(oferta)
    db.add(log)
    db.commit()
    return {"msg": "Oferta deletada."}

# ==========================================
# 🛒 F. COMPRADORES
# ==========================================
@app.post("/compradores/", response_model=Comprador, tags=["Comprador"])
def criar_comprador(comprador: Comprador, session: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    usuario_db = obter_usuario_db(usuario_logado, session)
    
    # Atrela o comprador ao corretor que o criou
    if not comprador.usuario_id: 
        comprador.usuario_id = usuario_db.id
        
    empresa_db = session.get(Empresa, comprador.empresa_id)
    if not empresa_db: 
        raise HTTPException(status_code=404, detail="Empresa compradora não encontrada.")
        
    session.add(comprador)
    session.commit()
    session.refresh(comprador)
    log = Historico(usuario_id=usuario_db.id,tabela_afetada='Compradores',id_afetado=comprador.id,acao='Adicionar',
                            detalhes=f'{comprador.nome} foi adicionado como comprador')
    session.add(log)
    session.commit()
    return comprador

@app.get("/compradores/", response_model=list[Comprador], tags=["Comprador"])
def listar_compradores(session: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    # Gerente e Admin veem todos os contatos
    if usuario_logado.get("cargo") in ["admin", "gerente"]:
        return session.exec(select(Comprador)).all()
        
    # Corretor vê apenas os contatos que ele mesmo cadastrou
    usuario_db = obter_usuario_db(usuario_logado, session)
    return session.exec(select(Comprador).where(Comprador.usuario_id == usuario_db.id)).all()

@app.put("/compradores/{comprador_id}", tags=["Comprador"])
def atualizar_comprador(comprador_id: int, dados_atualizados: dict, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    comprador = db.get(Comprador, comprador_id)
    if not comprador: 
        raise HTTPException(status_code=404)
    
    usuario_db = obter_usuario_db(usuario_logado, db)
    # Bloqueia se o corretor tentar editar um comprador que não é dele
    if usuario_logado.get("cargo") == "corretor" and comprador.usuario_id != usuario_db.id:
        raise HTTPException(status_code=403, detail="Permissão negada. Você só pode editar seus próprios compradores.")
        
    for key, value in dados_atualizados.items():
        if hasattr(comprador, key) and key != "id":
            setattr(comprador, key, value)
            
    db.add(comprador)
    db.commit()
    db.refresh(comprador)
    return comprador

@app.delete("/compradores/{comprador_id}", tags=["Comprador"])
def deletar_comprador(comprador_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    # Apenas Admin pode deletar
    if usuario_logado.get("cargo") != "admin": 
        raise HTTPException(status_code=403)
    usuario_db=obter_usuario_db(usuario_logado,db)
    comprador = db.get(Comprador, comprador_id)
    log = Historico(usuario_id=usuario_db.id,tabela_afetada='Compradores',id_afetado=comprador.id,acao='Deletar',
                            detalhes=f'O comprador {comprador.nome} foi deletado')
    db.delete(comprador)
    db.add(log)
    db.commit()
    return {"msg": "Comprador deletado com sucesso."}


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
    # Se ele mandar "?tabelas=fazendas,contratos", o sistema separa numa lista.
    if tabelas:
        tabelas_solicitadas = [t.strip().lower() for t in tabelas.split(",")]
    else:
        # Se não especificar nada, exporta todas as abas que ele tem direito
        tabelas_solicitadas = ["usuarios", "produtores", "fazendas", "empresas", "contratos", "ofertas"]
        
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        sheets_escritas = 0
        
        # 👤 USUÁRIOS (Corretor nunca pode exportar a lista de usuários da empresa)
        if "usuarios" in tabelas_solicitadas and cargo in ["admin", "gerente"]:
            usuarios = db.exec(select(Usuario)).all()
            df = pd.DataFrame([u.model_dump(exclude={"senha_hash", "reset_token", "reset_token_expires"}) for u in usuarios])
            if not df.empty:
                df.to_excel(writer, sheet_name='Usuarios', index=False)
                sheets_escritas += 1

        # 📄 CONTRATOS
        if "contratos" in tabelas_solicitadas:
            query = select(Contrato)
            if cargo == "corretor": query = query.where(Contrato.usuario_id == usuario_db.id)
            contratos = db.exec(query).all()
            df = pd.DataFrame([c.model_dump() for c in contratos])
            if not df.empty:
                df.to_excel(writer, sheet_name='Contratos', index=False)
                sheets_escritas += 1

        # 🌾 PRODUTORES
        if "produtores" in tabelas_solicitadas:
            query = select(Produtor)
            if cargo == "corretor": query = query.where(Produtor.usuario_id == usuario_db.id)
            produtores = db.exec(query).all()
            df = pd.DataFrame([p.model_dump() for p in produtores])
            if not df.empty:
                df.to_excel(writer, sheet_name='Produtores', index=False)
                sheets_escritas += 1

        # 🚜 FAZENDAS
        if "fazendas" in tabelas_solicitadas:
            query = select(Fazenda)
            if cargo == "corretor": query = query.where(Fazenda.usuario_id == usuario_db.id)
            fazendas = db.exec(query).all()
            df = pd.DataFrame([f.model_dump() for f in fazendas])
            if not df.empty:
                df.to_excel(writer, sheet_name='Fazendas', index=False)
                sheets_escritas += 1

        # 🏢 EMPRESAS
        if "empresas" in tabelas_solicitadas:
            query = select(Empresa)
            if cargo == "corretor": query = query.where(Empresa.usuario_id == usuario_db.id)
            empresas = db.exec(query).all()
            df = pd.DataFrame([e.model_dump() for e in empresas])
            if not df.empty:
                df.to_excel(writer, sheet_name='Empresas', index=False)
                sheets_escritas += 1
                
        # 📊 OFERTAS
        if "ofertas" in tabelas_solicitadas:
            query = select(Oferta)
            if cargo == "corretor": query = query.where(Oferta.usuario_id == usuario_db.id)
            ofertas = db.exec(query).all()
            df = pd.DataFrame([o.model_dump() for o in ofertas])
            if not df.empty:
                df.to_excel(writer, sheet_name='Ofertas', index=False)
                sheets_escritas += 1

        # Segurança: Se a pessoa pedir uma tabela vazia (ou tentar fraudar), retorna um aviso
        if sheets_escritas == 0:
            pd.DataFrame([{"Aviso": "Nenhum dado encontrado ou sem permissão para exportar."}]).to_excel(writer, sheet_name='Sem Dados', index=False)

    output.seek(0)
    return StreamingResponse(
        output, 
        headers={'Content-Disposition': 'attachment; filename="relatorio_corretora.xlsx"'}, 
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )


@app.post("/esqueci-senha", tags=["Senha"])
@limiter.limit("3/minute")
def esqueci_senha(request: Request, email: str, db: Session = Depends(get_session)):
    # 1. Busca o usuário pelo e-mail
    usuario = db.exec(select(Usuario).where(Usuario.email == email)).first()
    
    if not usuario:
        return {"msg": "Se o e-mail estiver cadastrado, as instruções serão enviadas."}
        
    # 2. Segurança: Verifica se o usuário tem um WhatsApp cadastrado no banco
    if not usuario.telefone:
        raise HTTPException(status_code=400, detail="Este usuário não possui um telefone cadastrado para receber o token. Contate o administrador.")
    
    # 3. Gera um token seguro e único e define a validade (15 minutos)
    token_recuperacao = "".join(secrets.choice(string.digits) for _ in range(6))
    usuario.reset_token = token_recuperacao
    usuario.reset_token_expires = datetime.utcnow() + timedelta(minutes=15)
    
    db.add(usuario)
    db.commit()
    
    # 4. DISPARO DO WHATSAPP (Usando a sua função já existente da Evolution API)
    texto_whatsapp = (
        f"🔐 *Recuperação de Senha*\n\n"
        f"Olá {usuario.nome}, você solicitou a redefinição de senha no sistema.\n\n"
        f"Use o token abaixo para cadastrar sua nova senha:\n\n"
        f"*{token_recuperacao}*\n\n"
        f"⏳ _Este token é válido por 15 minutos._"
    )
    
    disparar_whatsapp_comprador(usuario.telefone, texto_whatsapp)
    
    return {"msg": "As instruções foram enviadas para o seu WhatsApp cadastrado!"}

class RedefinirSenhaRequest(BaseModel):
    token: str
    nova_senha: str

@app.post("/redefinir-senha", tags=["Senha"])
def redefinir_senha(dados: RedefinirSenhaRequest, db: Session = Depends(get_session)):
    # 1. Busca o usuário que possui esse token
    usuario = db.exec(select(Usuario).where(Usuario.reset_token == dados.token)).first()
    
    # 2. Valida se o token existe e se não expirou
    if not usuario or not usuario.reset_token_expires:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado.")
    
    if datetime.utcnow() > usuario.reset_token_expires:
        raise HTTPException(status_code=400, detail="O token de recuperação expirou.")
    
    # 3. Criptografa a nova senha usando a sua função existente
    usuario.senha_hash = obter_hash_senha(dados.nova_senha)
    
    # 4. Limpa o token para que ele não possa ser reutilizado
    usuario.reset_token = None
    usuario.reset_token_expires = None
    
    db.add(usuario)
    db.commit()
    
    return {"msg": "Senha redefinida com sucesso! Faça login com a nova senha."}

@app.get("/conectar-whatsapp", response_class=HTMLResponse)
def conectar_whatsapp():
    """Rota inteligente: Cria a instância nova ou conecta se já existir"""
    headers = {
        "apikey": EVOLUTION_API_KEY,
        "Content-Type": "application/json"
    }
    
    try:
        # 1. Tenta CRIAR a nova instância
        url_create = f"{EVOLUTION_URL}/instance/create"
        payload = {"instanceName": INSTANCIA, "qrcode": True}
        resposta = requests.post(url_create, headers=headers, json=payload)
        dados = resposta.json()
        
        # 2. Se a instância já existir, a Evolution devolve erro 403. Aí tentamos o CONNECT.
        if resposta.status_code == 403 or (isinstance(dados, dict) and dados.get("error") == "Instance already exists"):
            url_connect = f"{EVOLUTION_URL}/instance/connect/{INSTANCIA}"
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
            html = f"""
            <html>
                <body style="display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; height: 100vh; background-color: #f0f2f5;">
                    <h2>Conectar WhatsApp (Instância: {INSTANCIA})</h2>
                    <p>Aponte o celular e escaneie o código abaixo:</p>
                    <img src="{imagem_base64}" style="width: 300px; height: 300px; border-radius: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
                    <br>
                    <button onclick="window.location.reload();" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background-color: #25D366; color: white; border: none; border-radius: 5px;">🔄 Atualizar Código</button>
                </body>
            </html>
            """
            return HTMLResponse(content=html)
        else:
            return HTMLResponse(content=f"<h3>O WhatsApp já está conectado ou houve um erro:</h3> <p>{dados}</p>")
            
    except Exception as e:
        return HTMLResponse(content=f"<h3>Erro ao conectar com a Evolution API:</h3> <p>{str(e)}</p>")

@app.get('/historicos/',tags=['Historico'])
def pegar_historico(db=Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado.get('cargo') != 'admin':
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