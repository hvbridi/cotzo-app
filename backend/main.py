from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session
# Importe os arquivos que criamos acima (simulado aqui)
from modelo_tabela import Usuario, Cliente
from auth import criar_token_acesso, usuario_atual, apenas_admin

app = FastAPI()

# --- ROTA DE LOGIN ---
@app.post("/login")
def login(email: str, senha: str):
    # Aqui você buscaria o usuário no banco de dados. Exemplo simulado:
    # usuario = session.exec(select(Usuario).where(Usuario.email == email)).first()
    
    # Se a senha estiver correta, geramos o crachá com o cargo dele dentro!
    token = criar_token_acesso({"sub": email, "cargo": "admin"}) # ou "corretor"
    return {"access_token": token, "token_type": "bearer"}


# --- ROTAS CRUD (Exemplo de Clientes) ---

# Criar Cliente (Qualquer um logado pode criar)
@app.post("/clientes/")
def criar_cliente(cliente_dados: dict, usuario_logado=Depends(usuario_atual)):
    return {"msg": f"Cliente criado com sucesso pelo corretor {usuario_logado['email']}"}

# Ler Clientes (Qualquer um logado pode ler)
@app.get("/clientes/")
def ler_clientes(usuario_logado=Depends(usuario_atual)):
    return {"clientes": [{"nome": "Fazenda Rio Grande", "cpf_cnpj": "123"}]}

# Deletar Cliente (⚠️ APENAS ADMIN PODE)
# Note que mudamos a dependência para "apenas_admin"
@app.delete("/clientes/{cliente_id}")
def deletar_cliente(cliente_id: int, admin_logado=Depends(apenas_admin)):
    return {"msg": f"Cliente {cliente_id} deletado com sucesso pelo ADMIN!"}
