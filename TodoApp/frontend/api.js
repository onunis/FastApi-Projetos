export const STATUSES = ['todo', 'in_progress', 'done'];
export function taskContent(task) {
  return { title: task.title.trim(), description: task.description.trim(), priority: Number(task.priority) };
}
export function decodeSession(token) {
  try {
    const part = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part), c => c.charCodeAt(0))));
    if (!Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now()) return null;
    return { username: String(payload.sub || 'Você'), expires: payload.exp * 1000 };
  } catch { return null; }
}
export function createApi({ getToken, onUnauthorized, fetcher = fetch }) {
  async function request(path, options = {}, authenticated = true) {
    const headers = { ...options.headers };
    if (authenticated) headers.Authorization = `Bearer ${getToken()}`;
    let response;
    try { response = await fetcher(`/api${path}`, { ...options, headers, signal: AbortSignal.timeout(15000) }); }
    catch { throw new Error('Não foi possível conectar. Verifique sua conexão e tente novamente.'); }
    const body = await response.text();
    let data; try { data = body ? JSON.parse(body) : null; } catch { data = null; }
    if (!response.ok) {
      if (response.status === 401) {
        if (authenticated) onUnauthorized();
        throw new Error(authenticated ? 'Sua sessão expirou. Entre novamente.' : 'Usuário ou senha incorretos.');
      }
      const detail = Array.isArray(data?.detail) ? data.detail.map(x => `${x.loc?.at(-1) || 'Campo'}: ${x.msg}`).join('; ') : data?.detail;
      throw new Error(typeof detail === 'string' ? detail : `Não foi possível concluir a operação (${response.status}).`);
    }
    return data;
  }
  const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return {
    login: (username, password) => request('/auth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ username, password }).toString() }, false),
    list: () => request('/'),
    create: task => request('/todo', json('POST', { ...taskContent(task), status: 'todo' })),
    update: (id, task) => request(`/todo/${id}`, json('PUT', taskContent(task))),
    remove: id => request(`/todo/${id}`, { method: 'DELETE' }),
    move: (id, status) => { if (!STATUSES.includes(status)) throw new Error('Status inválido.'); return request(`/todo/${id}/status`, json('PATCH', { status })); },
  };
}
