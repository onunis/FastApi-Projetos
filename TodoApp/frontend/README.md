# TodoApp · Frontend Kanban

Interface em português integrada ao backend FastAPI existente, sem dependências npm externas. Requer Node.js 20 ou superior.

## Executar no Windows

Com o backend já rodando em `http://127.0.0.1:8000`, abra um terminal:

```powershell
cd C:\Users\guizi\Documents\fastapi\TodoApp\frontend
node server.mjs
```

Abra http://127.0.0.1:5173 e entre com uma conta existente. Não é necessário executar `npm install`.

Se precisar iniciar o backend, use outro terminal com o ambiente Python do projeto:

```powershell
cd C:\Users\guizi\Documents\fastapi\TodoApp
..\fastapienv\Scripts\python.exe -B -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Para outra porta/endereço da API, configure apenas o frontend:

```powershell
$env:API_TARGET = 'http://127.0.0.1:8000'
$env:PORT = '5173'
node server.mjs
```

## Uso e integração

- Login: `POST /auth/token`, formulário URL encoded; requisições autenticadas usam JWT Bearer.
- Listagem: `GET /`.
- Criação: `POST /todo`, sempre começando em `todo`.
- Edição: `PUT /todo/{id}` envia somente `title`, `description` e `priority`; não envia status.
- Movimento: `PATCH /todo/{id}/status`, por arrastar ou seletor acessível em cada card.
- Exclusão: `DELETE /todo/{id}`, com confirmação.
- Título mínimo de 3 caracteres; descrição de 3 a 100; prioridade de 1 a 5.
- Busca local, contadores, progresso, estados vazios, mensagens de erro e prevenção de cliques duplicados.
- Token fica em `sessionStorage` da aba, com fallback em memória quando o armazenamento estiver indisponível. Logout, expiração e resposta 401 limpam a sessão. A senha não é armazenada.
- A API valida o JWT; a leitura do campo `exp` no navegador só antecipa o retorno à tela de login.
- O servidor local encaminha `/api/…` para a API na porta 8000. Isso dispensa mudança de CORS no backend.
- Servidor acessível somente em `127.0.0.1`. Esta entrega é para execução local; não foi feito deploy.

## Testes

```powershell
node --test tests/*.test.mjs
```

Os testes verificam os contratos das requisições, preservação de status no PUT, expiração, erros, respostas sem corpo e proxy HTTP real contra um servidor temporário. Não alteram arquivos nem dados do backend.

Para conferir com sua conta, crie uma tarefa de teste, mova para Em andamento, edite seu conteúdo e verifique que ela permanece nessa coluna. Depois conclua e exclua somente a tarefa de teste.
