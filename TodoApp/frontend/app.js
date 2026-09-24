import { createApi, decodeSession, STATUSES } from './api.js';

const $ = id => document.getElementById(id);
const labels = { todo: 'A fazer', in_progress: 'Em andamento', done: 'Concluído' };
const priorities = ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Urgente'];
let token = '', tasks = [], session = null, generation = 0, expiryTimer, editingId = null, deletingId = null, busy = false, loadFailed = false;
try { token = sessionStorage.getItem('todoapp.token') || ''; } catch { /* Storage may be disabled. In-memory login still works. */ }
const api = createApi({ getToken: () => token, onUnauthorized: () => logout('Sua sessão expirou. Entre novamente.') });
function message(id, text = '') { $(id).textContent = text; if (['board-error', 'board-message'].includes(id)) $(id).hidden = !text; }
function node(tag, className, text) { const el = document.createElement(tag); el.className = className; if (text !== undefined) el.textContent = text; return el; }
function saveToken(value) { token = value; try { if (value) sessionStorage.setItem('todoapp.token', value); else sessionStorage.removeItem('todoapp.token'); } catch {} }
function logout(reason = '') {
  generation++; clearTimeout(expiryTimer); saveToken(''); session = null; tasks = []; busy = false;
  $('task-dialog').close(); $('delete-dialog').close(); $('board-view').hidden = true; $('login-view').hidden = false;
  $('kanban').replaceChildren(); $('password').value = ''; $('search').value = '';
  message('login-error', reason); $('username').focus();
}
function activateSession() {
  session = decodeSession(token);
  if (!session) { logout(token ? 'Sua sessão expirou. Entre novamente.' : ''); return false; }
  $('account-name').textContent = session.username; $('avatar').textContent = session.username.slice(0, 1).toUpperCase();
  $('login-view').hidden = true; $('board-view').hidden = false;
  clearTimeout(expiryTimer); expiryTimer = setTimeout(() => logout('Sua sessão expirou. Entre novamente.'), Math.min(session.expires - Date.now(), 2147483647));
  return true;
}
function controls() {
  for (const id of ['new-task', 'refresh', 'save-task', 'confirm-delete']) $(id).disabled = busy;
  $('task-form').querySelectorAll('input,textarea,select').forEach(el => { el.disabled = busy; });
}
function render() {
  const query = $('search').value.trim().toLocaleLowerCase('pt-BR');
  const filtered = tasks.filter(t => `${t.title} ${t.description}`.toLocaleLowerCase('pt-BR').includes(query));
  const done = tasks.filter(t => t.status === 'done').length;
  $('total-count').textContent = loadFailed ? '—' : tasks.length;
  $('active-count').textContent = loadFailed ? '—' : tasks.filter(t => t.status === 'in_progress').length;
  $('done-count').textContent = loadFailed ? '—' : done;
  const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  $('progress').value = percent; $('progress').textContent = `${percent}%`; $('progress').setAttribute('aria-label', 'Tarefas concluídas'); $('progress-label').textContent = `${percent}%`;
  $('kanban').replaceChildren();
  for (const status of STATUSES) {
    const column = node('section', `column ${status}`); column.setAttribute('aria-label', labels[status]);
    const columnTasks = filtered.filter(t => t.status === status);
    const heading = node('div', 'column-heading');
    heading.append(node('span', 'status-dot'), node('span', '', labels[status]), node('span', 'column-count', columnTasks.length));
    if (status === 'todo') { const add = node('button', 'icon-button', '+'); add.title = 'Criar tarefa em A fazer'; add.setAttribute('aria-label', add.title); add.disabled = busy; add.onclick = () => openTask(); heading.append(add); }
    column.append(heading);
    if (!columnTasks.length) {
      const empty = node('div', 'empty-column'); empty.append(node('span', '', status === 'done' ? '✓' : '·'));
      empty.append(node('div', '', busy ? 'Carregando...' : loadFailed ? 'Não foi possível carregar.' : query ? 'Nenhuma tarefa encontrada.' : status === 'todo' ? 'Tudo começa com uma ideia. Crie sua primeira tarefa.' : status === 'in_progress' ? 'Sua próxima conquista começa aqui.' : 'Cada conclusão merece seu lugar.'));
      column.append(empty);
    }
    for (const task of columnTasks) column.append(card(task));
    if (status === 'todo') { const add = node('button', 'column-add', '＋ Adicionar tarefa'); add.disabled = busy; add.onclick = () => openTask(); column.append(add); }
    column.addEventListener('dragover', e => { if (!busy) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; column.classList.add('drag-over'); } });
    column.addEventListener('dragleave', e => { if (!column.contains(e.relatedTarget)) column.classList.remove('drag-over'); });
    column.addEventListener('drop', e => { e.preventDefault(); column.classList.remove('drag-over'); const task = tasks.find(t => String(t.id) === e.dataTransfer.getData('text/plain')); if (task && !busy) move(task, status); });
    $('kanban').append(column);
  }
  controls();
}
function card(task) {
  const el = node('article', 'card'); el.draggable = !busy; el.setAttribute('aria-label', task.title);
  el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', String(task.id)); e.dataTransfer.effectAllowed = 'move'; el.classList.add('dragging'); });
  el.addEventListener('dragend', () => { el.classList.remove('dragging'); document.querySelectorAll('.drag-over').forEach(c => c.classList.remove('drag-over')); });
  const top = node('div', 'card-top'), actions = node('div', 'card-actions');
  top.append(node('span', `priority p${Number(task.priority)}`, `${task.priority} · ${priorities[task.priority - 1] || 'Prioridade'}`));
  const edit = node('button', 'icon-button', '✎'); edit.title = `Editar ${task.title}`; edit.setAttribute('aria-label', edit.title); edit.disabled = busy; edit.onclick = () => openTask(task);
  const remove = node('button', 'icon-button', '×'); remove.title = `Excluir ${task.title}`; remove.setAttribute('aria-label', remove.title); remove.disabled = busy; remove.onclick = () => openDelete(task);
  actions.append(edit, remove); top.append(actions);
  el.append(top, node('h3', '', task.title), node('p', '', task.description));
  const footer = node('div', 'card-footer'), select = node('select', '');
  select.setAttribute('aria-label', `Mover ${task.title}`); select.disabled = busy;
  for (const status of STATUSES) { const option = node('option', '', labels[status]); option.value = status; select.append(option); }
  select.value = task.status; select.onchange = () => move(task, select.value);
  footer.append(node('span', 'task-id', `#${String(task.id).padStart(3, '0')}`), select); el.append(footer); return el;
}
async function fetchTasks() {
  const result = await api.list();
  if (!Array.isArray(result) || result.some(t => !Number.isInteger(t.id) || !STATUSES.includes(t.status))) throw new Error('A API retornou tarefas em um formato inesperado.');
  return result;
}
async function reload() {
  if (busy) return;
  const version = generation; busy = true; message('board-error'); message('board-message', 'Atualizando seu quadro...'); render();
  try { const result = await fetchTasks(); if (version !== generation) return; tasks = result; loadFailed = false; message('board-message'); }
  catch (error) { if (version === generation) { loadFailed = true; message('board-error', error.message); message('board-message'); } }
  finally { if (version === generation) { busy = false; render(); } }
}
async function mutate(action, success, errorId, afterSuccess = () => {}) {
  if (busy) return;
  const version = generation; busy = true; message(errorId); message('board-message'); render();
  try {
    await action(); if (version !== generation) return;
    afterSuccess(); message('board-message', success);
    try { const result = await fetchTasks(); if (version !== generation) return; tasks = result; loadFailed = false; message('board-error'); }
    catch (error) { if (version === generation) { loadFailed = true; message('board-error', `Alteração salva, mas o quadro não pôde ser atualizado. Clique em Atualizar. ${error.message}`); } }
  } catch (error) { if (version === generation) message(errorId, error.message); }
  finally { if (version === generation) { busy = false; render(); } }
}
function openTask(task) {
  if (busy) return; editingId = task?.id ?? null; $('task-form').reset(); message('form-error');
  $('dialog-title').textContent = task ? 'Editar tarefa' : 'Nova tarefa'; $('save-task').textContent = task ? 'Salvar alterações' : 'Criar tarefa';
  $('task-title').value = task?.title || ''; $('task-description').value = task?.description || ''; $('task-priority').value = task?.priority || 3;
  $('task-status-note').textContent = task ? `O status será preservado: ${labels[task.status]}.` : 'A tarefa será criada em A fazer.';
  $('task-dialog').showModal(); $('task-title').focus();
}
function openDelete(task) { deletingId = task.id; message('delete-error'); $('delete-description').textContent = `A tarefa “${task.title}” será excluída.`; $('delete-dialog').showModal(); $('cancel-delete').focus(); }
function move(task, status) { if (status !== task.status) mutate(() => api.move(task.id, status), `Tarefa movida para ${labels[status]}.`, 'board-error'); }
$('login-form').addEventListener('submit', async e => {
  e.preventDefault(); message('login-error'); $('login-submit').disabled = true; $('login-submit').textContent = 'Entrando...';
  try { const data = await api.login($('username').value.trim(), $('password').value); if (!decodeSession(data?.access_token || '')) throw new Error('A API retornou uma sessão inválida.'); saveToken(data.access_token); generation++; $('password').value = ''; if (activateSession()) await reload(); }
  catch (error) { message('login-error', error.message); }
  finally { $('login-submit').disabled = false; $('login-submit').textContent = 'Entrar no meu quadro →'; }
});
$('task-form').addEventListener('submit', e => {
  e.preventDefault(); const data = { title: $('task-title').value.trim(), description: $('task-description').value.trim(), priority: Number($('task-priority').value) };
  if (data.title.length < 3 || data.description.length < 3 || data.description.length > 100) { message('form-error', 'O título precisa de pelo menos 3 caracteres e a descrição, de 3 a 100.'); return; }
  const id = editingId;
  mutate(() => id === null ? api.create(data) : api.update(id, data), id === null ? 'Tarefa criada. Um novo passo no seu quadro!' : 'Alterações salvas. O status foi preservado.', 'form-error', () => $('task-dialog').close());
});
$('delete-form').addEventListener('submit', e => { e.preventDefault(); const id = deletingId; mutate(() => api.remove(id), 'Tarefa excluída.', 'delete-error', () => $('delete-dialog').close()); });
for (const id of ['close-dialog', 'cancel-dialog']) $(id).onclick = () => { if (!busy) $('task-dialog').close(); };
$('cancel-delete').onclick = () => { if (!busy) $('delete-dialog').close(); };
for (const id of ['task-dialog', 'delete-dialog']) $(id).addEventListener('cancel', e => { if (busy) e.preventDefault(); });
$('new-task').onclick = () => openTask(); $('refresh').onclick = reload; $('search').oninput = render; $('logout').onclick = () => logout();
document.addEventListener('visibilitychange', () => { if (!document.hidden && token && !decodeSession(token)) logout('Sua sessão expirou. Entre novamente.'); });
if (activateSession()) reload();
