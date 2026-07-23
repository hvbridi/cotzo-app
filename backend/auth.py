from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Configurações de Segurança
SECRET_KEY = "mudar_senha_dps_pimpolhetes"
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
    dados_copia.update({"exp": expiracao})
    token_jwt = jwt.encode(dados_copia, SECRET_KEY, algorithm=ALGORITHM)
    return token_jwt

# --- AS TRAVAS DE SEGURANÇA (Dependências) ---

# 1. Verifica se o usuário tem um token válido
def usuario_atual(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        cargo: str = payload.get("cargo")
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return {"email": email, "cargo": cargo}
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Não autorizado")

# 2. Verifica se, além de logado, o usuário é ADMIN
def apenas_admin(usuario=Depends(usuario_atual)):
    if usuario["cargo"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    return usuario
