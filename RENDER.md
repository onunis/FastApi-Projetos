# Publicação do TodoApp

Um Web Service Python serve a API existente em `/api` e o Kanban em `/`.
Os arquivos anteriores do backend e o banco local não são modificados.

## Render

- Repositório: `onunis/FastApi-Projetos`; branch: `main`.
- Root Directory: vazio.
- Build Command: `pip install -r requirements.txt`.
- Start Command: `python -m uvicorn hosting:app --app-dir TodoApp --host 0.0.0.0 --port $PORT`.
- Compute: **Free ($0)**.
- Health Check Path: `/healthy`.
- `SECRET_KEY`: gerar um valor aleatório no painel (pelo menos 32 caracteres).
- `SQLALCHEMY_URL`: URL PostgreSQL do banco online vazio, com `sslmode=require`.
  Usar o prefixo `postgresql://`, não `postgres://`.

Nunca adicionar valores secretos ao Git ou a capturas de tela.

## Primeiro acesso

O banco online não contém suas contas locais. Em `/api/docs`, executar
`POST /auth/` com username, email, first_name, last_name, password e phone_number.
Depois entrar no Kanban na página inicial com a conta criada. O cadastro público
sempre cria um usuário comum.

## Banco e migrações

Na primeira inicialização, `hosting.py` cria o esquema atual somente se o banco
estiver completamente vazio. Nas demais inicializações confere a presença das
tabelas e colunas esperadas, sem alterar tabelas ou excluir dados.
Não executa nem registra migrações antigas: elas pressupõem um esquema anterior.
Uma futura evolução do banco exige uma estratégia de baseline/migração revisada.

O banco local não é enviado nem apagado. Não usar SQLite no serviço gratuito:
os dados precisam permanecer em PostgreSQL remoto.
