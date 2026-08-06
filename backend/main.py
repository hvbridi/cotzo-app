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
from modelo_tabela import Usuario, Produtor, Fazenda, Empresa, Contrato, Oferta, Comprador
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

# Libera o acesso para o frontend conversar com a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", # Se o dev estiver testando no próprio PC
        "http://localhost:5173"], # Em produção, você pode trocar "*" pelo link exato do seu site frontend
    allow_credentials=True,
    allow_methods=["*"], # Permite GET, POST, PUT, DELETE...
    allow_headers=["*"],
)

# ==========================================
# 🔐 ROTA DE LOGIN (Adaptada para o Swagger)
# ==========================================
@app.post("/login")
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)):
    # 1. O Swagger manda os dados num pacote chamado "form_data". 
    # O email vem escondido dentro de "form_data.username" e a senha em "form_data.password"
    usuario = db.exec(select(Usuario).where(Usuario.email == form_data.username)).first()
    
    # 2. Se não achar o usuário ou a senha não bater, bloqueia!
    if not usuario or not verificar_senha(form_data.password, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # 3. Se deu tudo certo, cria o crachá com o cargo real dele
    token = criar_token_acesso({"sub": usuario.email, "cargo": usuario.cargo})
    return {"access_token": token, "token_type": "bearer"}


# ==========================================
# 👤 A. USUÁRIOS (Corretores)
# ==========================================

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    senha_hash: Optional[str] = None
    cargo: Optional[str] = None
    comissao_padrao: Optional[float] = None

@app.post("/usuarios/", tags=["Usuario"])
def criar_usuario(
    usuario: Usuario, 
    db: Session = Depends(get_session), 
    usuario_logado=Depends(usuario_atual) # 1. Adiciona o cadeado no Swagger!
):
    
    # 2. A Fechadura: Verifica se quem está tentando criar a conta tem o cargo correto
    if usuario_logado['cargo'] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores podem criar novos usuários."
        )

    # Criptografa a senha antes de salvar no banco! (NUNCA salvar a senha limpa)
    usuario.senha_hash = obter_hash_senha(usuario.senha_hash)
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return {
        "msg": "Usuário criado com sucesso!", 
        "dados": usuario.model_dump(exclude={"senha_hash", "reset_token", "reset_token_expires"})
    }

@app.get("/usuarios/", tags=["Usuario"])
def ler_usuarios(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    usuarios = db.exec(select(Usuario)).all()
    return [u.model_dump(exclude={"senha_hash", "reset_token", "reset_token_expires"}) for u in usuarios]

@app.put("/usuarios/{usuario_id}", tags=["Usuario"])
def atualizar_usuario(usuario_id: int, dados_atualizados: UsuarioUpdate, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado['cargo'] != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem editar usuários.")
        
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    dados_filtrados = dados_atualizados.model_dump(exclude_unset=True)
        
    for key, value in dados_filtrados.items():
        if hasattr(usuario, key) and key != "id":
            if key == "senha_hash": # Se estiver mudando a senha, criptografa de novo
                value = obter_hash_senha(value)
            setattr(usuario, key, value)
            
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return {
        "msg": "Usuário atualizado!", 
        "dados": usuario.model_dump(exclude={"senha_hash", "reset_token", "reset_token_expires"})
    }

@app.delete("/usuarios/{usuario_id}", tags=["Usuario"])
def deletar_usuario(usuario_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    if usuario_logado['cargo'] != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem deletar usuários.")
        
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
    db.delete(usuario)
    db.commit()
    return {"msg": "Usuário deletado com sucesso."}


# ==========================================
# 🌾 B. PRODUTORES
# ==========================================
@app.post("/produtores/", tags=["Produtor"])
def criar_produtor(produtor: Produtor, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    db.add(produtor)
    db.commit()
    db.refresh(produtor)
    return {"msg": "Produtor criado com sucesso!", "dados": produtor}

@app.get("/produtores/", tags=["Produtor"])
def ler_produtores(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    return db.exec(select(Produtor)).all()

@app.put("/produtores/{produtor_id}", tags=["Produtor"])
def atualizar_produtor(produtor_id: int, dados_atualizados: dict, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    produtor = db.get(Produtor, produtor_id)
    if not produtor:
        raise HTTPException(status_code=404, detail="Produtor não encontrado.")
        
    for key, value in dados_atualizados.items():
        if hasattr(produtor, key) and key != "id":
            setattr(produtor, key, value)
            
    db.add(produtor)
    db.commit()
    db.refresh(produtor)
    return produtor

@app.delete("/produtores/{produtor_id}", tags=["Produtor"])
def deletar_produtor(produtor_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    produtor = db.get(Produtor, produtor_id)
    if not produtor:
        raise HTTPException(status_code=404, detail="Produtor não encontrado.")
    db.delete(produtor)
    db.commit()
    return {"msg": "Produtor deletado com sucesso."}


# ==========================================
# 🚜 C. FAZENDAS
# ==========================================
@app.post("/fazendas/", tags=["Fazenda"])
def criar_fazenda(fazenda: Fazenda, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    db.add(fazenda)
    db.commit()
    db.refresh(fazenda)
    return {"msg": "Fazenda criada com sucesso!", "dados": fazenda}

# A ROTA MÁGICA PRO SELECT DO SEU PAI: Traz as fazendas de 1 produtor específico
@app.get("/produtores/{produtor_id}/fazendas", tags=["Fazenda"])
def ler_fazendas_do_produtor(produtor_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    fazendas = db.exec(select(Fazenda).where(Fazenda.produtor_id == produtor_id)).all()
    return fazendas

@app.put("/fazendas/{fazenda_id}", tags=["Fazenda"])
def atualizar_fazenda(fazenda_id: int, dados_atualizados: dict, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    fazenda = db.get(Fazenda, fazenda_id)
    if not fazenda:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada.")
        
    for key, value in dados_atualizados.items():
        if hasattr(fazenda, key) and key != "id":
            setattr(fazenda, key, value)
            
    db.add(fazenda)
    db.commit()
    db.refresh(fazenda)
    return fazenda

@app.delete("/fazendas/{fazenda_id}", tags=["Fazenda"])
def deletar_fazenda(fazenda_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    fazenda = db.get(Fazenda, fazenda_id)
    if not fazenda:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada.")
    db.delete(fazenda)
    db.commit()
    return {"msg": "Fazenda deletada com sucesso."}


# ==========================================
# 🏢 D. EMPRESAS (Tradings)
# ==========================================
@app.post("/empresas/", tags=["Empresa"])
def criar_empresa(empresa: Empresa, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    return {"msg": "Empresa criada com sucesso!", "dados": empresa}

@app.get("/empresas/", tags=["Empresa"])
def ler_empresas(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    return db.exec(select(Empresa)).all()

@app.put("/empresas/{empresa_id}", tags=["Empresa"])
def atualizar_empresa(empresa_id: int, dados_atualizados: dict, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    empresa = db.get(Empresa, empresa_id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
        
    for key, value in dados_atualizados.items():
        if hasattr(empresa, key) and key != "id":
            setattr(empresa, key, value)
            
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    return empresa

@app.delete("/empresas/{empresa_id}", tags=["Empresa"])
def deletar_empresa(empresa_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    empresa = db.get(Empresa, empresa_id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
    db.delete(empresa)
    db.commit()
    return {"msg": "Empresa deletada com sucesso."}


# ==========================================
# 📄 E. CONTRATOS (O Coração do Sistema)
# ==========================================
@app.post("/contratos/", tags=["Contrato"])
def criar_contrato(contrato: Contrato, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    # Cálculo de segurança: O Backend calcula sozinho pra evitar fraudes ou erros no React
    contrato.valor_total = contrato.volume * contrato.preco_unitario
    contrato.valor_comissao = contrato.valor_total * (contrato.comissao_porcentagem / 100)
    
    db.add(contrato)
    db.commit()
    db.refresh(contrato)
    return {"msg": "Contrato emitido com sucesso!", "dados": contrato}

@app.get("/contratos/", tags=["Contrato"])
def ler_contratos(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    return db.exec(select(Contrato)).all()

@app.put("/contratos/{contrato_id}", tags=["Contrato"])
def atualizar_contrato(contrato_id: int, dados_atualizados: dict, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    contrato = db.get(Contrato, contrato_id)
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado.")

    campos_permitidos = [
        "data_fechamento", "commodity", "safra", "volume", 
        "tipo_medida", "moeda", "preco_unitario", "tipo_frete", 
        "data_entrega", "data_pagamento", "numero_contrato_trading", 
        "comissao_porcentagem", "status", "observacoes",
        "produtor_id", "fazenda_id", "empresa_id"
    ]
    
    for key, value in dados_atualizados.items():
        if hasattr(contrato, key) and key in campos_permitidos:
            setattr(contrato, key, value)
            
    # Recalcula automaticamente a parte financeira após as alterações
    contrato.valor_total = contrato.volume * contrato.preco_unitario
    contrato.valor_comissao = contrato.valor_total * (contrato.comissao_porcentagem / 100)
            
    db.add(contrato)
    db.commit()
    db.refresh(contrato)
    return contrato

@app.delete("/contratos/{contrato_id}", tags=["Contrato"])
def deletar_contrato(contrato_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    contrato = db.get(Contrato, contrato_id)
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado.")
    db.delete(contrato)
    db.commit()
    return {"msg": "Contrato deletado com sucesso."}


@app.get("/exportar-excel/")
def exportar_dados_para_excel(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    # 1. Pega tudo do banco de dados
    usuarios = db.exec(select(Usuario)).all()
    produtores = db.exec(select(Produtor)).all()
    fazendas = db.exec(select(Fazenda)).all()
    empresas = db.exec(select(Empresa)).all()
    contratos = db.exec(select(Contrato)).all()

    # 2. Converte para o formato de Tabela
    df_usuarios = pd.DataFrame([u.model_dump() for u in usuarios])
    df_produtores = pd.DataFrame([p.model_dump() for p in produtores])
    df_fazendas = pd.DataFrame([f.model_dump() for f in fazendas])
    df_empresas = pd.DataFrame([e.model_dump() for e in empresas])
    df_contratos = pd.DataFrame([c.model_dump() for c in contratos])

    # Segurança: NUNCA exporte as senhas!
    if not df_usuarios.empty and 'senha_hash' in df_usuarios.columns:
        df_usuarios = df_usuarios.drop(columns=['senha_hash'])

    # 3. Prepara o arquivo Excel na memória do servidor
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df_contratos.to_excel(writer, sheet_name='Contratos', index=False)
        df_produtores.to_excel(writer, sheet_name='Produtores', index=False)
        df_fazendas.to_excel(writer, sheet_name='Fazendas', index=False)
        df_empresas.to_excel(writer, sheet_name='Empresas', index=False)
        df_usuarios.to_excel(writer, sheet_name='Usuários', index=False)

    # 4. Finaliza e envia o arquivo para download
    output.seek(0)
    return StreamingResponse(
        output, 
        headers={'Content-Disposition': 'attachment; filename="banco_de_dados_corretora.xlsx"'}, 
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

# Modelo temporário para receber os dados do front-end/Swagger incluindo os compradores
class OfertaCreate(BaseModel):
    produtor_id: int
    fazenda_id: int
    volume: int
    preco: float
    moeda: str = "BRL"
    data_entrega_embarque: date # ou date
    compradores_ids: List[int] = [] # <--- Aqui você seleciona quais IDs de compradores vão receber

@app.post("/ofertas/", response_model=Oferta, tags=["Oferta"])
def criar_oferta(dados: OfertaCreate, session: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    """
    Cria uma nova oferta, valida a fazenda e envia o WhatsApp automaticamente 
    para os compradores selecionados, incluindo o contato do corretor logado.
    """
    # 1. Valida se a fazenda existe
    fazenda_db = session.get(Fazenda, dados.fazenda_id)
    if not fazenda_db:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada no sistema.")
        
    # 2. Trava de segurança: A fazenda pertence ao produtor?
    if fazenda_db.produtor_id != dados.produtor_id:
        raise HTTPException(
            status_code=403, 
            detail="Operação bloqueada: Esta fazenda não pertence ao produtor informado."
        )
        
    # 3. Busca os dados completos do corretor logado no banco de dados
    # Descobre o e-mail dependendo de como o seu auth.py foi programado
    if isinstance(usuario_logado, dict):
        email_logado = usuario_logado.get("email") or usuario_logado.get("sub")
    else:
        email_logado = usuario_logado.email
        
    corretor = session.exec(select(Usuario).where(Usuario.email == email_logado)).first()
    
    if not corretor or not corretor.telefone:
         raise HTTPException(status_code=400, detail="Seu usuário precisa ter um telefone cadastrado para enviar ofertas.")
        
    # 4. Cria o objeto Oferta para salvar no banco
    nova_oferta = Oferta(
        produtor_id=dados.produtor_id,
        fazenda_id=dados.fazenda_id,
        volume=dados.volume,
        preco=dados.preco,
        moeda=dados.moeda,
        data_entrega_embarque=dados.data_entrega_embarque
    )
    
    session.add(nova_oferta)
    session.commit()
    session.refresh(nova_oferta)
    
    # 5. DISPARO AUTOMÁTICO PARA OS COMPRADORES SELECIONADOS
    if dados.compradores_ids:
        produtor_nome = fazenda_db.produtor.nome
        fazenda_nome = fazenda_db.nome
        
        # Monta o texto do WhatsApp incluindo os dados do corretor
        texto_mensagem = (
            f"🌾 *NOVA OFERTA DISPONÍVEL* 🌾\n\n"
            f"👤 *Produtor:* {produtor_nome}\n"
            f"🚜 *Fazenda:* {fazenda_nome}\n"
            f"📦 *Volume:* {dados.volume:,} sacas\n"
            f"💰 *Preço:* {dados.moeda} {dados.preco:,.2f}\n"
            f"📅 *Embarque:* {dados.data_entrega_embarque}\n\n"
            f"👨‍💼 *Corretor:* {corretor.nome}\n"
            f"📞 *WhatsApp:* {corretor.telefone}\n\n"
            f"Responda esta mensagem ou clique no número acima para negociar!"
        )
        
        # Busca cada comprador no banco pelo ID enviado na lista
        for comprador_id in dados.compradores_ids:
            comprador = session.get(Comprador, comprador_id)
            if comprador and comprador.telefone:
                disparar_whatsapp_comprador(comprador.telefone, texto_mensagem)

    return nova_oferta

@app.get("/ofertas/", response_model=list[Oferta], tags=["Oferta"])
def listar_ofertas(session: Session = Depends(get_session)):
    """
    Lista todas as ofertas ativas no sistema.
    """
    ofertas = session.exec(select(Oferta)).all()
    return ofertas

@app.put("/ofertas/{oferta_id}", tags=["Oferta"])
def atualizar_oferta(oferta_id: int, dados_atualizados: dict, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    oferta = db.get(Oferta, oferta_id)
    if not oferta:
        raise HTTPException(status_code=404, detail="Oferta não encontrada.")
        
    for key, value in dados_atualizados.items():
        if hasattr(oferta, key) and key != "id":
            setattr(oferta, key, value)
            
    db.add(oferta)
    db.commit()
    db.refresh(oferta)
    return oferta

@app.delete("/ofertas/{oferta_id}", tags=["Oferta"])
def deletar_oferta(oferta_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    oferta = db.get(Oferta, oferta_id)
    if not oferta:
        raise HTTPException(status_code=404, detail="Oferta não encontrada.")
    db.delete(oferta)
    db.commit()
    return {"msg": "Oferta deletada com sucesso."}

@app.post("/compradores/", response_model=Comprador, tags=["Comprador"])
def criar_comprador(comprador: Comprador, session: Session = Depends(get_session)):
    """
    Cadastra um novo comprador vinculado a uma empresa (Trading).
    """
    # Validação opcional: verificar se a empresa realmente existe
    empresa_db = session.get(Empresa, comprador.empresa_id)
    if not empresa_db:
        raise HTTPException(status_code=404, detail="Empresa compradora não encontrada.")
        
    session.add(comprador)
    session.commit()
    session.refresh(comprador)
    return comprador

@app.get("/compradores/", response_model=list[Comprador], tags=["Comprador"])
def listar_compradores(session: Session = Depends(get_session)):
    """
    Lista todos os compradores cadastrados.
    """
    compradores = session.exec(select(Comprador)).all()
    return compradores

@app.put("/compradores/{comprador_id}", tags=["Comprador"])
def atualizar_comprador(comprador_id: int, dados_atualizados: dict, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    comprador = db.get(Comprador, comprador_id)
    if not comprador:
        raise HTTPException(status_code=404, detail="Comprador não encontrado.")
        
    for key, value in dados_atualizados.items():
        if hasattr(comprador, key) and key != "id":
            setattr(comprador, key, value)
            
    db.add(comprador)
    db.commit()
    db.refresh(comprador)
    return comprador

@app.delete("/compradores/{comprador_id}", tags=["Comprador"])
def deletar_comprador(comprador_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    comprador = db.get(Comprador, comprador_id)
    if not comprador:
        raise HTTPException(status_code=404, detail="Comprador não encontrado.")
    db.delete(comprador)
    db.commit()
    return {"msg": "Comprador deletado com sucesso."}

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