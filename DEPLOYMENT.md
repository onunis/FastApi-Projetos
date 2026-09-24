# Preparação da publicação

Esta etapa prepara o projeto; não publica serviços nem modifica dados existentes.

## Alterações verificadas

- Frontend Kanban integrado à API, com proxy local, sessão JWT e operações de tarefas.
- `requirements.txt` inclui `psycopg2-binary==2.9.12` e `alembic==1.19.1`, antes presentes apenas no ambiente local. Arquivo convertido de UTF-16 para UTF-8.
- Cadastro público sempre cria perfil `user`. O campo `role` foi removido do modelo de entrada; valores extras enviados por clientes antigos são ignorados. O perfil é definido pelo servidor.
- Contas administradoras existentes permanecem inalteradas. Esta correção não audita nem reclassifica contas criadas anteriormente.

## Validação

- 31 testes do backend passaram, incluindo 5 casos novos: cadastro sem perfil e com `user`, `admin` ou `ADMIN`; acesso de administrador existente.
- Os testes novos usam SQLite em memória e tokens reais para confirmar que contas cadastradas não podem listar nem excluir pelo endpoint administrativo.
- A suíte completa foi executada com `SQLALCHEMY_URL=sqlite://`, segredo exclusivo de teste e diretório de trabalho temporário, sem usar o banco local da aplicação.
- 5 testes do frontend passaram.
- `pip check` e importações do driver PostgreSQL e Alembic passaram no ambiente local. Instalação limpa em Linux ainda não foi validada.
- Há avisos de descontinuação de bibliotecas na suíte, sem falhas.

## Pendências antes do deploy

1. Definir PostgreSQL remoto e decidir se será vazio ou receberá dados existentes.
2. Preparar e testar a inicialização: a primeira migração atual pressupõe tabelas existentes. Não executar `alembic upgrade head` em banco vazio nem `stamp head` sem conferir a estrutura.
3. Configurar `SQLALCHEMY_URL` e `SECRET_KEY` no serviço, nunca no código ou no Git.
4. Adaptar o servidor do frontend para o endereço de escuta da hospedagem e origem HTTPS. Atualmente ele foi configurado para execução local.
5. Validar instalação limpa das dependências, inicialização e fluxo completo em ambiente de publicação.
6. Revisar e autorizar a publicação. Nenhum recurso remoto foi criado nesta etapa.

As migrações existentes, a configuração do banco e os dados não foram alterados nesta etapa.
