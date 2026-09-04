# TodoApp | API de tarefas com FastAPI

Projeto de backend em Python para praticar APIs REST, autenticação com JWT e persistência com SQLAlchemy. A aplicação organiza tarefas por usuário e inclui rotas de cadastro, login, perfil e administração.

Desenvolvido durante o curso **FastAPI — The Complete Course 2026**, de Eric Roby e Chad Darby (Udemy), como parte do meu aprendizado em desenvolvimento backend.

> **Status:** projeto de estudo em evolução, com correções e testes pendentes descritos ao final. Ainda não está pronto para produção.

## Tecnologias

| Tecnologia | Aplicação |
| --- | --- |
| Python e FastAPI | API HTTP e organização das rotas |
| SQLAlchemy | Modelos relacionais e sessões de banco |
| Pydantic | Validação dos dados recebidos |
| python-jose | Geração e validação de JWT |
| passlib e bcrypt | Hash e verificação de senhas |
| python-dotenv | Configuração de banco pelo `.env` |
| Uvicorn | Servidor de desenvolvimento |
| Alembic | Estrutura inicial de migrações |

O banco é configurado por `SQLALCHEMY_URL`. O exemplo abaixo utiliza SQLite para execução local.

## Recursos e conceitos praticados

- Cadastro e login com OAuth2 Password e JWT com expiração de 20 minutos.
- Rotas para criar, listar, consultar, atualizar e excluir tarefas, com filtros por proprietário.
- Validação de título, descrição, prioridade de 1 a 5 e estado de conclusão.
- Consulta de perfil, alteração de senha e atualização de telefone.
- Rotas administrativas com verificação do papel `admin`.
- Injeção de dependências para sessão de banco e identificação do usuário.
- Documentação interativa gerada pelo FastAPI.

## Como executar

### 1. Clonar e criar o ambiente virtual

Use Python 3.10 ou superior, com uma versão compatível com as dependências fixadas em `requirements.txt`.

```bash
git clone https://github.com/onunis/FastApi-Projetos.git
cd FastApi-Projetos
python -m venv .venv
```

Ative no **Windows PowerShell**:

```powershell
.\.venv\Scripts\Activate.ps1
```

Ou no **Linux/macOS**:

```bash
source .venv/bin/activate
```

### 2. Instalar as dependências

Na raiz do repositório:

```bash
python -m pip install -r requirements.txt
```

### 3. Configurar o banco

Crie `TodoApp/.env` com:

```dotenv
SQLALCHEMY_URL=sqlite:///./todos.db
```

O `.env` e os arquivos `.db` já estão no `.gitignore`. Nesse exemplo, o banco local será criado dentro de `TodoApp` ao iniciar a aplicação pelo diretório indicado abaixo.

### 4. Iniciar a API

```bash
cd TodoApp
python -m uvicorn main:app --reload
```

Execute dentro de `TodoApp`, pois os imports atuais usam esse diretório como base. A inicialização cria tabelas ausentes por meio de `Base.metadata.create_all()`; não atualiza o esquema de tabelas existentes.

- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## Experimentando pelo Swagger

1. Abra `/docs` e cadastre um usuário em `POST /auth/` usando dados fictícios:

   ```json
   {
     "username": "dev_teste",
     "email": "dev@example.com",
     "first_name": "Dev",
     "last_name": "Teste",
     "password": "senha-local-123",
     "role": "user",
     "phone_number": "21999999999"
   }
   ```

2. Clique em **Authorize** e informe username e senha. O Swagger obtém o token em `/auth/token` e o inclui nas requisições protegidas. Executar somente o endpoint de login não configura automaticamente essa autorização.
3. Crie uma tarefa em `POST /todo`:

   ```json
   {
     "title": "Estudar FastAPI",
     "description": "Praticar autenticação e dependências",
     "priority": 3,
     "complete": false
   }
   ```

4. Consulte `GET /` para listar as tarefas do usuário autenticado.

Em outros clientes HTTP, envie `Authorization: Bearer <access_token>`. O login recebe username e senha como formulário, não como JSON.

## Rotas

Estas são as rotas declaradas no código. Consulte as limitações conhecidas antes de testar consulta individual, exclusão e administração.

| Método | Rota | Finalidade | Acesso previsto |
| --- | --- | --- | --- |
| POST | `/auth/` | Cadastrar usuário | Público |
| POST | `/auth/token` | Obter token | Público, com credenciais |
| GET | `/` | Listar tarefas do usuário | Autenticado |
| GET | `/todo/{todo_id}` | Consultar tarefa | Proprietário |
| POST | `/todo` | Criar tarefa | Autenticado |
| PUT | `/todo/{todo_id}` | Atualizar tarefa | Proprietário |
| DELETE | `/todo/{todo_id}` | Excluir tarefa | Proprietário |
| GET | `/users/` | Consultar perfil | Autenticado |
| PUT | `/users/password` | Alterar senha informando a atual | Autenticado |
| PUT | `/users/phone_number/{phone_number}` | Atualizar telefone | Autenticado |
| GET | `/admin/todo` | Listar todas as tarefas | Papel `admin` |
| DELETE | `/admin/todo/{todo_id}` | Excluir tarefa de qualquer usuário | Papel `admin` |

## Estrutura

```text
FastApi-Projetos/
├── README.md
├── requirements.txt
└── TodoApp/
    ├── main.py              # Aplicação, criação de tabelas e routers
    ├── database.py          # Engine, sessões e configuração via .env
    ├── models.py            # Modelos Users e Todos
    ├── routers/
    │   ├── auth.py          # Cadastro, login e JWT
    │   ├── todos.py         # Operações sobre tarefas
    │   ├── users.py         # Perfil, senha e telefone
    │   └── admin.py         # Operações administrativas
    ├── alembic.ini
    ├── alembic/             # Configuração e migração de phone_number
    └── test/
        └── test_example.py  # Exercícios iniciais de assertions
```

### Modelo de dados

- **Users:** identificação, e-mail e username únicos, nome, sobrenome, hash da senha, estado ativo, papel e telefone.
- **Todos:** título, descrição, prioridade, conclusão e `owner_id`, chave estrangeira para `users.id`.

Cada tarefa referencia um usuário; um usuário pode ter várias tarefas.

## Testes e migrações

Os testes atuais são exercícios de assertions: dois contêm condições falsas e falham. Ainda não há testes dos endpoints. Para executar os exercícios, instale o pytest separadamente, pois não está em `requirements.txt`:

```bash
# Na raiz do repositório, com o ambiente virtual ativo
python -m pip install pytest
python -m pytest TodoApp/test
```

A estrutura do Alembic já existe, mas sua dependência também não está em `requirements.txt`. A migração disponível adiciona `phone_number` a uma tabela `users` preexistente; não cria um banco do zero. O fluxo local acima usa a criação de tabelas da aplicação, sem executar essa migração sobre um banco novo.

## Limitações conhecidas e próximos passos

- Corrigir a consulta individual, que retorna um objeto de consulta sem buscar o registro, e o erro de digitação `.flter()` na exclusão de tarefas.
- Padronizar `raise HTTPException`: algumas rotas retornam a exceção como valor.
- Substituir a chave JWT fixa no código por um segredo externo antes de publicar a aplicação.
- Restringir a atribuição de papéis: o cadastro atual aceita `role` informado pelo cliente, inclusive `admin`.
- Definir um modelo de resposta para o perfil que exclua `hashed_password`.
- Adicionar testes de autenticação, validação, isolamento entre usuários e permissões administrativas.
- Completar o fluxo de migrações e revisar as dependências de desenvolvimento.

## Autor

Desenvolvido por [onunis](https://github.com/onunis) como projeto de estudo em Python e FastAPI.
