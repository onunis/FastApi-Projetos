# Validação local

- Cinco testes automatizados passaram: formulário de login, contratos CRUD/status, erros e 401, sessão JWT e proxy HTTP.
- Navegador com API temporária em memória: login, listagem, criação, movimento pelo menu, edição mantendo `in_progress`, busca sem resultados, confirmação/cancelamento de exclusão, recarregamento preservando sessão e logout verificados.
- Layout conferido em desktop e largura móvel de 390 pixels; colunas permitem rolagem horizontal no celular.
- Console do navegador sem erros durante a conferência.
- API FastAPI real iniciada sem edição de seus arquivos; OpenAPI e retorno 401 sem autenticação confirmados via proxy.
- O usuário confirmou login com sua conta e visualização das três colunas na API real.
- CRUD autenticado contra o banco real não foi automatizado nesta sessão. Movimentação por arrastar implementada; teste de movimento no navegador realizado pelo seletor de status.
- Nenhum deploy realizado. Nenhum arquivo existente do backend foi editado pelo assistente.

A única diferença detectada no conteúdo do backend durante a sessão foi uma mudança externa na ordem das declarações em `routers/todos.py`; o assistente leu essa correção e iniciou a API depois dela.
