from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os
from dotenv import load_dotenv
from sqlmodel import Session, select
from database import get_session
from modelo_tabela import Usuario

load_dotenv()
# Configurações de Segurança
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("Faltou configurar a SECRET_KEY no arquivo .env!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Função para embaralhar a senha antes de salvar no banco
def obter_hash_senha(senha: str):
    return pwd_context.hash(senha)

# Função para verificar se a senha digitada bate com a salva no banco
def verificar_senha(senha_limpa, senha_hash):
    return pwd_context.verify(senha_limpa, senha_hash)

# Função para criar o Token (O Crachá)
def criar_token_acesso(dados: dict):
    dados_copia = dados.copy()
    expiracao = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    dados_copia['exp'] = expiracao
    token_jwt = jwt.encode(dados_copia, SECRET_KEY, algorithm=ALGORITHM)
    return token_jwt

# --- AS TRAVAS DE SEGURANÇA (Dependências) ---

# 1. Verifica se o usuário tem um token válido E se continua ativo no banco
def usuario_atual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_session)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    except jwt.JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Não autorizado")

    usuario = db.exec(select(Usuario).where(Usuario.email == email)).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado.")
    if not usuario.ativo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário inativo. Acesso revogado.")

    return {"email": usuario.email, "cargo": usuario.cargo, "id": usuario.id, "nome": usuario.nome}

# 2. Verifica se, além de logado, o usuário é ADMIN
def apenas_admin(usuario=Depends(usuario_atual)):
    if usuario["cargo"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado. Apenas administradores.")
    return usuario
