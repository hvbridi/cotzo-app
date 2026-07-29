from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
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
from typing import List
from datetime import date, datetime, timedelta
import secrets
from fastapi.responses import HTMLResponse
# Nossas tabelas
from modelo_tabela import Usuario, Produtor, Fazenda, Empresa, Contrato, Oferta, Comprador
# Nossas funções de segurança
from auth import criar_token_acesso, usuario_atual, apenas_admin, obter_hash_senha, verificar_senha
# Nossa conexão com o banco
from database import criar_tabelas, get_session

load_dotenv()

EVOLUTION_URL = "https://evolution-api-production-aeca.up.railway.app"
EVOLUTION_API_KEY = os.getenv('EVOLUTION_API_KEY')
INSTANCIA = "teste"


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

# ==========================================
# 🔐 ROTA DE LOGIN (Adaptada para o Swagger)
# ==========================================
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)):
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
@app.post("/usuarios/")
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
    return {"msg": "Usuário criado com sucesso!", "dados": usuario}

@app.get("/usuarios/")
def ler_usuarios(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    usuarios = db.exec(select(Usuario)).all()
    return usuarios


# ==========================================
# 🌾 B. PRODUTORES
# ==========================================
@app.post("/produtores/")
def criar_produtor(produtor: Produtor, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    db.add(produtor)
    db.commit()
    db.refresh(produtor)
    return {"msg": "Produtor criado com sucesso!", "dados": produtor}

@app.get("/produtores/")
def ler_produtores(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    return db.exec(select(Produtor)).all()


# ==========================================
# 🚜 C. FAZENDAS
# ==========================================
@app.post("/fazendas/")
def criar_fazenda(fazenda: Fazenda, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    db.add(fazenda)
    db.commit()
    db.refresh(fazenda)
    return {"msg": "Fazenda criada com sucesso!", "dados": fazenda}

# A ROTA MÁGICA PRO SELECT DO SEU PAI: Traz as fazendas de 1 produtor específico
@app.get("/produtores/{produtor_id}/fazendas")
def ler_fazendas_do_produtor(produtor_id: int, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    fazendas = db.exec(select(Fazenda).where(Fazenda.produtor_id == produtor_id)).all()
    return fazendas


# ==========================================
# 🏢 D. EMPRESAS (Tradings)
# ==========================================
@app.post("/empresas/")
def criar_empresa(empresa: Empresa, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    return {"msg": "Empresa criada com sucesso!", "dados": empresa}

@app.get("/empresas/")
def ler_empresas(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    return db.exec(select(Empresa)).all()


# ==========================================
# 📄 E. CONTRATOS (O Coração do Sistema)
# ==========================================
@app.post("/contratos/")
def criar_contrato(contrato: Contrato, db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    # Cálculo de segurança: O Backend calcula sozinho pra evitar fraudes ou erros no React
    contrato.valor_total = contrato.volume * contrato.preco_unitario
    contrato.valor_comissao = contrato.valor_total * (contrato.comissao_porcentagem / 100)
    
    db.add(contrato)
    db.commit()
    db.refresh(contrato)
    return {"msg": "Contrato emitido com sucesso!", "dados": contrato}

@app.get("/contratos/")
def ler_contratos(db: Session = Depends(get_session), usuario_logado=Depends(usuario_atual)):
    return db.exec(select(Contrato)).all()


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

@app.post("/ofertas/", response_model=Oferta)
def criar_oferta(dados: OfertaCreate, session: Session = Depends(get_session),usuario_logado=Depends(usuario_atual)):
    """
    Cria uma nova oferta, valida a fazenda e envia o WhatsApp automaticamente 
    para os compradores selecionados na lista 'compradores_ids'.
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
        
    # 3. Cria o objeto Oferta para salvar no banco
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
    
    # 4. DISPARO AUTOMÁTICO PARA OS COMPRADORES SELECIONADOS
    if dados.compradores_ids:
        # Pega o nome do produtor e da fazenda para deixar a mensagem bonita
        produtor_nome = fazenda_db.produtor.nome
        fazenda_nome = fazenda_db.nome
        
        # Monta o texto do WhatsApp
        texto_mensagem = (
            f"🌾 *NOVA OFERTA DISPONÍVEL* 🌾\n\n"
            f"👤 *Produtor:* {produtor_nome}\n"
            f"🚜 *Fazenda:* {fazenda_nome}\n"
            f"📦 *Volume:* {dados.volume:,} sacas\n"
            f"💰 *Preço:* {dados.moeda} {dados.preco:,.2f}\n"
            f"📅 *Embarque:* {dados.data_entrega_embarque}\n\n"
            f"Responda esta mensagem para negociar!"
        )
        
        # Busca cada comprador no banco pelo ID enviado na lista
        for comprador_id in dados.compradores_ids:
            comprador = session.get(Comprador, comprador_id)
            if comprador and comprador.telefone:
                # Dispara o WhatsApp para o telefone do comprador
                disparar_whatsapp_comprador(comprador.telefone, texto_mensagem)

    return nova_oferta

@app.get("/ofertas/", response_model=list[Oferta])
def listar_ofertas(session: Session = Depends(get_session)):
    """
    Lista todas as ofertas ativas no sistema.
    """
    ofertas = session.exec(select(Oferta)).all()
    return ofertas

@app.post("/compradores/", response_model=Comprador)
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

@app.get("/compradores/", response_model=list[Comprador])
def listar_compradores(session: Session = Depends(get_session)):
    """
    Lista todos os compradores cadastrados.
    """
    compradores = session.exec(select(Comprador)).all()
    return compradores

@app.post("/esqueci-senha")
def esqueci_senha(email: str, db: Session = Depends(get_session)):
    # 1. Busca o usuário pelo e-mail
    usuario = db.exec(select(Usuario).where(Usuario.email == email)).first()
    
    if not usuario:
        return {"msg": "Se o e-mail estiver cadastrado, as instruções serão enviadas."}
        
    # 2. Segurança: Verifica se o usuário tem um WhatsApp cadastrado no banco
    if not usuario.telefone:
        raise HTTPException(status_code=400, detail="Este usuário não possui um telefone cadastrado para receber o token. Contate o administrador.")
    
    # 3. Gera um token seguro e único e define a validade (15 minutos)
    token_recuperacao = secrets.token_urlsafe(32)
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

@app.post("/redefinir-senha")
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
    """Rota para gerar e exibir o QR Code do WhatsApp na tela"""
    url = f"{EVOLUTION_URL}/instance/connect/{INSTANCIA}"
    headers = {
        "apikey": EVOLUTION_API_KEY
    }
    
    try:
        resposta = requests.get(url, headers=headers)
        dados = resposta.json()
        
        # Se a Evolution devolver o base64, criamos uma telinha HTML com a imagem!
        if "base64" in dados:
            imagem_base64 = dados["base64"]
            html = f"""
            <html>
                <body style="display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; height: 100vh; background-color: #f0f2f5;">
                    <h2>Conectar WhatsApp</h2>
                    <p>Pegue seu celular e escaneie o código abaixo <b>rapidamente</b> (Expira em 15s):</p>
                    <img src="{imagem_base64}" style="width: 300px; height: 300px; border-radius: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
                    <br>
                    <button onclick="window.location.reload();" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background-color: #25D366; color: white; border: none; border-radius: 5px;">🔄 Gerar Novo Código</button>
                </body>
            </html>
            """
            return HTMLResponse(content=html)
        else:
            return HTMLResponse(content=f"<h3>O WhatsApp já está conectado ou houve um erro:</h3> <p>{dados}</p>")
            
    except Exception as e:
        return HTMLResponse(content=f"<h3>Erro ao conectar com a Evolution API:</h3> <p>{str(e)}</p>")