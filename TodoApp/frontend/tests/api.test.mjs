import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApi, decodeSession } from '../api.js';
import { createServer } from '../server.mjs';
import http from 'node:http';

test('login usa formulário, não envia Bearer nem senha em URL', async () => {
  let call;
  const api = createApi({ getToken: () => 'token', onUnauthorized() {}, fetcher: async (...args) => { call = args; return new Response('{"access_token":"ok"}'); } });
  await api.login('guilherme', 'a&b+c');
  assert.equal(call[0], '/api/auth/token');
  assert.equal(call[1].headers.Authorization, undefined);
  assert.equal(new URLSearchParams(call[1].body).get('password'), 'a&b+c');
  assert.equal(call[1].headers['Content-Type'], 'application/x-www-form-urlencoded');
});
test('contratos: listar, criar, editar sem status, mover, excluir e respostas vazias', async () => {
  const calls = [];
  const api = createApi({ getToken: () => 'jwt-test', onUnauthorized() {}, fetcher: async (url, options) => { calls.push({ url, ...options }); return new Response(null, { status: 204 }); } });
  const task = { title: ' Tarefa ', description: ' Descrição ', priority: '4', status: 'done', owner_id: 999 };
  await api.list(); await api.create(task); await api.update(7, task); await api.move(7, 'in_progress'); await api.remove(7);
  assert.deepEqual(calls.map(c => [c.url, c.method || 'GET']), [['/api/', 'GET'], ['/api/todo', 'POST'], ['/api/todo/7', 'PUT'], ['/api/todo/7/status', 'PATCH'], ['/api/todo/7', 'DELETE']]);
  assert.deepEqual(JSON.parse(calls[2].body), { title: 'Tarefa', description: 'Descrição', priority: 4 });
  assert.equal(JSON.parse(calls[1].body).status, 'todo');
  assert.deepEqual(JSON.parse(calls[3].body), { status: 'in_progress' });
  assert.ok(calls.every(c => c.headers.Authorization === 'Bearer jwt-test'));
});
test('401 encerra sessão autenticada, 422 informa validação e rede informa falha', async () => {
  let expired = 0;
  const api = createApi({ getToken: () => 'x', onUnauthorized: () => expired++, fetcher: async () => new Response('{}', { status: 401 }) });
  await assert.rejects(api.list(), /sessão expirou/); assert.equal(expired, 1);
  await assert.rejects(api.login('x', 'y'), /incorretos/); assert.equal(expired, 1);
  const bad = createApi({ getToken: () => '', onUnauthorized() {}, fetcher: async () => new Response(JSON.stringify({ detail: [{ loc: ['body', 'title'], msg: 'curto' }] }), { status: 422 }) });
  await assert.rejects(bad.list(), /title: curto/);
  const offline = createApi({ getToken: () => '', onUnauthorized() {}, fetcher: async () => { throw new Error('network'); } });
  await assert.rejects(offline.list(), /conectar/);
});
test('sessão rejeita token inválido e expirado, suporta nome Unicode', () => {
  const jwt = payload => `e30.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
  assert.equal(decodeSession('invalid'), null);
  assert.equal(decodeSession(jwt({ exp: 1 })), null);
  assert.equal(decodeSession(jwt({ sub: 'João', exp: Date.now() / 1000 + 60 })).username, 'João');
});
test('proxy encaminha método, Bearer, formulário e PATCH, protege arquivos privados', async t => {
  const observed = [];
  const upstream = http.createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    observed.push({ url: req.url, method: req.method, authorization: req.headers.authorization, body });
    res.writeHead(req.method === 'PATCH' ? 204 : 200, { 'Content-Type': 'application/json' }); res.end(req.method === 'PATCH' ? undefined : '[]');
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const frontend = createServer(`http://127.0.0.1:${upstream.address().port}`);
  await new Promise(resolve => frontend.listen(0, '127.0.0.1', resolve));
  t.after(() => { frontend.closeAllConnections(); frontend.close(); upstream.closeAllConnections(); upstream.close(); });
  const base = `http://127.0.0.1:${frontend.address().port}`;
  assert.equal((await fetch(`${base}/`)).status, 200);
  assert.equal((await fetch(`${base}/.env`)).status, 404);
  assert.equal((await fetch(`${base}/api/admin/todo`)).status, 404);
  await fetch(`${base}/api/auth/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'username=test&password=example' });
  await fetch(`${base}/api/`, { headers: { Authorization: 'Bearer test' } });
  assert.equal((await fetch(`${base}/api/todo/9/status`, { method: 'PATCH', headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' }, body: '{"status":"done"}' })).status, 204);
  assert.deepEqual(observed.map(x => x.url), ['/auth/token', '/', '/todo/9/status']);
  assert.equal(observed[1].authorization, 'Bearer test');
  assert.equal(observed[2].body, '{"status":"done"}');
  assert.equal((await fetch(`${base}/api/todo`, { method: 'POST', headers: { Origin: 'http://foreign.invalid' } })).status, 403);
});
