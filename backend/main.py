from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm # <-- IMPORTAÇÃO NOVA AQUI!
from sqlmodel import Session, select
from contextlib import asynccontextmanager

# Nossas tabelas
from modelo_tabela import Usuario, Produtor, Fazenda, Empresa, Contrato
# Nossas funções de segurança
from auth import criar_token_acesso, usuario_atual, apenas_admin, obter_hash_senha, verificar_senha
# Nossa conexão com o banco
from database import criar_tabelas, get_session

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
def criar_usuario(usuario: Usuario, db: Session = Depends(get_session)):
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