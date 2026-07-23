from sqlmodel import create_engine, SQLModel, Session
import os
from dotenv import load_dotenv

# Importamos os modelos para que o SQLModel saiba o que precisa criar
from modelo_tabela import Usuario, Produtor, Fazenda, Empresa, Contrato

# Carrega as senhas do arquivo .env silenciosamente
load_dotenv()

# Pega a URL do banco de dados do arquivo .env
DATABASE_URL = os.getenv("DATABASE_URL")

# O Engine é o "motor" de conexão. echo=True faz ele imprimir no terminal os comandos SQL que está rodando (ótimo para ver se deu certo).
engine = create_engine(DATABASE_URL, echo=True)

def criar_tabelas():
    # Vai olhar todos os modelos que importamos ali em cima e criar as tabelas reais no PostgreSQL!
    SQLModel.metadata.create_all(engine)

def get_session():
    # Função que usaremos nas rotas do main.py para abrir e fechar a conexão a cada requisição
    with Session(engine) as session:
        yield session