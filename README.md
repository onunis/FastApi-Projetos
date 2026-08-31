# TodoApp — FastAPI + SQLAlchemy + JWT

API REST de gerenciamento de tarefas (To-Do List) com autenticação de usuários via JWT, autorização por posse de recurso e por papéis (admin), e persistência em banco de dados relacional via SQLAlchemy.

Projeto desenvolvido durante o curso **"FastAPI - The Complete Course 2026"** (Eric Roby & Chad Darby, Udemy) — Projeto 3.

---

## Stack

- **FastAPI** — framework web
- **SQLAlchemy** — ORM
- **SQLite** — banco de dados (desenvolvimento)
- **Pydantic** — validação de dados
- **python-jose** — geração e verificação de JWT
- **passlib + bcrypt** — hashing de senha
- **python-multipart** — suporte a formulários (login OAuth2)

---

## Como rodar

```bash
pip install fastapi uvicorn sqlalchemy pydantic "python-jose[cryptography]" passlib bcrypt==4.0.1 python-multipart
uvicorn main:app --reload
```

Acesse a documentação interativa em: `http://127.0.0.1:8000/docs`

---

## Arquitetura

```
TodoApp/
├── main.py              # inicializa o app, cria tabelas, inclui routers
├── database.py          # engine, SessionLocal, Base (config do SQLAlchemy)
├── models.py             # modelos de tabela: Users, Todos
└── routers/
    ├── auth.py           # cadastro de usuário, login, geração/validação de JWT
    ├── todos.py           # CRUD de tarefas (protegido por usuário)
    └── admin.py           # endpoints exclusivos para administradores
```

### Banco de dados

**Tabela `users`**

| Campo | Tipo | Observação |
|---|---|---|
| id | int | chave primária |
| email | string | único |
| username | string | único |
| first_name | string | |
| last_name | string | |
| hashed_password | string | senha nunca salva em texto puro |
| is_active | bool | padrão `true` |
| role | string | ex: `"admin"` |

**Tabela `todos`**

| Campo | Tipo | Observação |
|---|---|---|
| id | int | chave primária |
| title | string | |
| description | string | |
| priority | int | 1 a 5 |
| complete | bool | padrão `false` |
| owner_id | int | chave estrangeira → `users.id` |

Relacionamento **um-para-muitos**: um usuário pode ter várias tarefas; cada tarefa pertence a um único usuário.

---

## Autenticação e Autorização

### Fluxo

1. `POST /auth/` — cria um novo usuário (senha é hasheada com bcrypt antes de salvar).
2. `POST /auth/token` — login (usuário + senha via formulário OAuth2) → retorna um JWT.
3. O cliente reenvia esse token em toda requisição protegida, no cabeçalho:
   ```
   Authorization: Bearer <token>
   ```
4. Cada endpoint protegido decodifica o token, extrai `username`, `id` e `role` do usuário, e:
   - filtra os dados pelo `owner_id` (usuário só vê/edita/deleta suas próprias tarefas), **ou**
   - exige `role == "admin"` para endpoints administrativos.

### Payload do JWT

```json
{
  "sub": "<username>",
  "id": "<user_id>",
  "role": "<role>",
  "exp": "<timestamp de expiração>"
}
```

Token expira em **20 minutos**.

---

## Endpoints

### Auth (`/auth`)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/` | Cria um novo usuário |
| `POST` | `/auth/token` | Login — retorna `access_token` + `token_type` |

### Todos (`/todo`) — requer autenticação

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/todo` | Lista as tarefas do usuário logado |
| `GET` | `/todo/{todo_id}` | Busca uma tarefa específica do usuário logado |
| `POST` | `/todo` | Cria uma nova tarefa (associada ao usuário logado) |
| `PUT` | `/todo/{todo_id}` | Atualiza uma tarefa do usuário logado |
| `DELETE` | `/todo/{todo_id}` | Remove uma tarefa do usuário logado |

### Admin (`/admin`) — requer autenticação + role `admin`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/admin/todo` | Lista **todas** as tarefas, de **todos** os usuários |
| `DELETE` | `/admin/todo/{todo_id}` | Remove a tarefa de **qualquer** usuário |

---

## Testando no Swagger

1. Crie um usuário em `POST /auth/`.
2. Faça login em `POST /auth/token` (ou clique no cadeado 🔒 "Authorize" no topo da página e informe usuário/senha diretamente).
3. Uma vez autorizado, todas as chamadas seguintes já incluem o token automaticamente.

---

## Conceitos aplicados

- **ORM (SQLAlchemy)** — modelos Python mapeados para tabelas reais, sem SQL manual.
- **Injeção de dependência** (`Depends`) — sessão de banco (`get_db`) e usuário autenticado (`get_current_user`) injetados automaticamente em cada rota que precisa.
- **Foreign Key** — relação um-para-muitos entre `users` e `todos`.
- **JWT (JSON Web Token)** — autenticação stateless, assinada com `HS256`.
- **Hashing de senha** (bcrypt) — senha nunca armazenada nem transmitida em texto puro.
- **Autorização por posse (ownership)** — cada usuário só acessa seus próprios dados.
- **Autorização por papel (role-based)** — endpoints administrativos restritos por `role`.
- **Roteamento modular** (`APIRouter`) — cada domínio (auth, todos, admin) isolado em seu próprio arquivo/router.

---

## Próximos passos

- Migração de banco com Alembic (alterar tabelas sem perder dados)
- Suporte a PostgreSQL / MySQL em produção
- Testes automatizados