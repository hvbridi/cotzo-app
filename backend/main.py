from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm # <-- IMPORTAÇÃO NOVA AQUI!
from sqlmodel import Session, select
from contextlib import asynccontextmanager
from fastapi.responses import StreamingResponse
import io
import pandas as pd


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