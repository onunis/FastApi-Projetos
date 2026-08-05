# FastAPI - Projetos

Repositório de projetos práticos do curso **"FastAPI - The Complete Course 2026"** (Eric Roby & Chad Darby, Udemy).

## Sobre

Projetos criados durante o estudo de FastAPI, cobrindo desde os fundamentos (path parameters, query parameters, métodos HTTP) até tópicos mais avançados conforme o curso avança.

---

## Project One — API de Livros (`books.py`)

Uma API REST simples para gerenciar uma lista de livros, implementando o CRUD completo (Create, Read, Update, Delete).

### Como rodar

```bash
pip install fastapi uvicorn
uvicorn books:app --reload
```

Acesse a documentação interativa (Swagger UI) em: `http://127.0.0.1:8000/docs`

### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/books` | Retorna todos os livros |
| `GET` | `/books/{book_title}` | Busca um livro específico pelo título |
| `GET` | `/books/` `?category=...` | Filtra livros por categoria (query parameter) |
| `GET` | `/books/author/{books_author}` | Retorna todos os livros de um autor específico |
| `GET` | `/books/{book_author}/` `?category=...` | Filtra livros por autor **e** categoria combinados |
| `POST` | `/books/create_book` | Cria um novo livro (dados enviados no corpo da requisição) |
| `PUT` | `/books/update_book` | Atualiza um livro existente, localizado pelo título |
| `DELETE` | `/books/delete_book/{book_title}` | Remove um livro pelo título |

### Conceitos aplicados

- **Path parameters** (`/books/{book_title}`) — identificam um recurso específico via URL.
- **Query parameters** (`?category=...`) — usados para filtros opcionais/adicionais.
- **Request body** (`Body()`) — usado em `POST` e `PUT` para receber dados estruturados (JSON).
- **Ordem de rotas** — rotas estáticas e mais específicas são declaradas antes de rotas dinâmicas mais genéricas, evitando que uma rota "capture" requisições destinadas a outra.
- **`.casefold()`** — usado em todas as comparações de string para tornar as buscas case-insensitive.

### Exemplo de requisição (POST)

```json
POST /books/create_book
Content-Type: application/json

{
  "Title": "Título Sete",
  "Author": "Autor Dois",
  "Category": "Math"
}
```

---

## Próximos projetos

Novos módulos do curso serão adicionados a este repositório conforme forem concluídos (Pydantic, SQLAlchemy, autenticação, deploy, etc).