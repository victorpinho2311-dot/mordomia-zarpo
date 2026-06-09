let adminToken = localStorage.getItem('mz_token');
let adminUser  = localStorage.getItem('mz_user');
let activeTab  = 'funcionarios';

// ── Auth ────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const btn   = document.getElementById('login-btn');
  const alert = document.getElementById('login-alert');
  const user  = document.getElementById('login-user').value.trim();
  const pass  = document.getElementById('login-pass').value;
  btn.disabled = true; btn.textContent = 'Entrando...';
  try {
    const res = await API.login(user, pass);
    if (res.success) {
      localStorage.setItem('mz_token', res.token);
      localStorage.setItem('mz_user', res.usuario);
      adminToken = res.token; adminUser = res.usuario;
      showAdminPanel();
    } else {
      alert.className = 'alert alert-error';
      alert.textContent = res.error || 'Credenciais inválidas.';
      alert.style.display = 'block';
    }
  } catch { alert.className='alert alert-error'; alert.textContent='Erro de conexão.'; alert.style.display='block'; }
  finally { btn.disabled = false; btn.textContent = 'Entrar'; }
}

function logout() { localStorage.removeItem('mz_token'); localStorage.removeItem('mz_user'); location.reload(); }

function showAdminPanel() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'flex';
  document.getElementById('admin-user-name').textContent = adminUser;
  loadTab('funcionarios');
}

// ── Tabs ────────────────────────────────────────────────────
function loadTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
  ({ funcionarios: loadFuncionarios, eventos: loadEventos, escala: loadEscala, feriados: loadFeriados, pedidos: loadPedidos })[tab]?.();
}

// ── Funcionários ─────────────────────────────────────────────
async function loadFuncionarios() {
  setContent(`<div class="loader"><div class="spinner"></div></div>`);
  const res = await API.getFuncionarios();
  if (!res.success) return setContent(`<div class="alert alert-error">${res.error}</div>`);
  const data = res.data;

  let html = `<div class="section-title">👥 Funcionários
    <button class="btn-sm btn-primary" onclick="openFuncModal()">+ Adicionar</button></div>`;

  if (!data.length) {
    html += `<div class="empty"><div class="empty-icon">👤</div><div class="empty-text">Nenhum funcionário cadastrado.</div></div>`;
  } else {
    html += `<div class="table-wrap"><table>
      <thead><tr><th>Nome</th><th>Canal</th><th>Frente</th><th>Horário Normal</th><th>Horário Reduzido</th><th></th></tr></thead>
      <tbody>${data.map(f => `<tr>
        <td><strong>${f.nome}</strong><br><span style="color:var(--light);font-size:12px">${f.email||''}</span></td>
        <td><span class="${chipCls(f.canal)}">${f.canal||'—'}</span></td>
        <td>${f.frente||'—'}</td>
        <td>${f.horario_normal_inicio||''}–${f.horario_normal_fim||''}</td>
        <td>${f.horario_reduzido_inicio ? f.horario_reduzido_inicio+'–'+f.horario_reduzido_fim : '—'}</td>
        <td class="td-actions">
          <button class="btn-sm btn-ghost" onclick='openFuncModal(${JSON.stringify(f).replace(/'/g,"&#39;")})'>Editar</button>
          <button class="btn-sm btn-danger" onclick="deleteFunc('${f.id}','${f.nome}')">Excluir</button>
        </td></tr>`).join('')}</tbody></table></div>`;
  }

  html += `
    <div class="modal-overlay" id="func-modal"><div class="modal">
      <div class="modal-title" id="func-modal-title">Adicionar Funcionário</div>
      <div id="func-alert" style="display:none" class="alert"></div>
      <input type="hidden" id="func-id">
      <div class="form-group"><label class="form-label">Nome <span class="req">*</span></label>
        <input class="form-control" id="func-nome" placeholder="Nome completo"></div>
      <div class="form-group"><label class="form-label">Email Zarpo</label>
        <input class="form-control" id="func-email" placeholder="nome@zarpo.com.br" type="email"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Canal <span class="req">*</span></label>
          <select class="form-control" id="func-canal">
            <option value="">Selecione...</option>
            <option>Chat</option><option>Telefone/pós</option><option>Telefone/pré</option>
          </select></div>
        <div class="form-group"><label class="form-label">Frente</label>
          <input class="form-control" id="func-frente" placeholder="Ex: Vendas"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Início Normal <span class="req">*</span></label>${tmHtml('func-ni')}</div>
        <div class="form-group"><label class="form-label">Fim Normal <span class="req">*</span></label>${tmHtml('func-nf')}</div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Início Reduzido</label>${tmHtml('func-ri')}</div>
        <div class="form-group"><label class="form-label">Fim Reduzido</label>${tmHtml('func-rf')}</div>
      </div>
      <div class="form-hint" style="margin-bottom:16px">Horário reduzido = usado quando trabalha no final de semana</div>
      <div class="modal-footer">
        <button class="btn-sm btn-ghost" onclick="closeModal('func-modal')">Cancelar</button>
        <button class="btn-sm btn-primary" onclick="saveFunc()">Salvar</button>
      </div>
    </div></div>`;

  setContent(html);
  initPickers(document.getElementById('admin-content'));
}

function openFuncModal(f) {
  const modal = document.getElementById('func-modal');
  if (f) {
    document.getElementById('func-modal-title').textContent = 'Editar Funcionário';
    document.getElementById('func-id').value    = f.id;
    document.getElementById('func-nome').value  = f.nome;
    document.getElementById('func-email').value = f.email || '';
    document.getElementById('func-canal').value = f.canal;
    document.getElementById('func-frente').value= f.frente || '';
    tmSet('func-ni', f.horario_normal_inicio);
    tmSet('func-nf', f.horario_normal_fim);
    tmSet('func-ri', f.horario_reduzido_inicio || '');
    tmSet('func-rf', f.horario_reduzido_fim || '');
  } else {
    document.getElementById('func-modal-title').textContent = 'Adicionar Funcionário';
    document.getElementById('func-id').value = '';
    ['func-nome','func-email','func-canal','func-frente'].forEach(id => { document.getElementById(id).value = ''; });
    ['func-ni','func-nf','func-ri','func-rf'].forEach(id => tmSet(id, ''));
  }
  modal.classList.add('open');
}

async function saveFunc() {
  const id    = document.getElementById('func-id').value;
  const nome  = document.getElementById('func-nome').value.trim();
  const canal = document.getElementById('func-canal').value;
  const ni    = tmGet('func-ni');
  const nf    = tmGet('func-nf');
  const al    = document.getElementById('func-alert');

  if (!nome || !canal || !ni || !nf) {
    al.className='alert alert-error'; al.textContent='Preencha os campos obrigatórios.'; al.style.display='block'; return;
  }
  const data = {
    nome, canal,
    email:  document.getElementById('func-email').value.trim(),
    frente: document.getElementById('func-frente').value.trim(),
    horario_normal_inicio: ni, horario_normal_fim: nf,
    horario_reduzido_inicio: tmGet('func-ri'),
    horario_reduzido_fim:    tmGet('func-rf')
  };

  const res = id ? await API.updateFuncionario({ ...data, id }) : await API.addFuncionario(data);
  if (!res.success) { al.className='alert alert-error'; al.textContent=res.error; al.style.display='block'; return; }
  closeModal('func-modal'); loadFuncionarios();
}

async function deleteFunc(id, nome) {
  if (!confirm(`Remover "${nome}" do sistema?`)) return;
  const res = await API.deleteFuncionario(id);
  if (res.success) loadFuncionarios(); else alert(res.error);
}

// ── Eventos ──────────────────────────────────────────────────
async function loadEventos() {
  setContent(`<div class="loader"><div class="spinner"></div></div>`);
  const now = new Date();
  const res = await API.getEventos(now.getMonth()+1, now.getFullYear());
  if (!res.success) return setContent(`<div class="alert alert-error">${res.error}</div>`);
  const data = res.data;

  let html = `<div class="section-title">📅 Eventos
    <button class="btn-sm btn-primary" onclick="openEventoModal()">+ Adicionar</button></div>`;

  if (!data.length) {
    html += `<div class="empty"><div class="empty-icon">📅</div><div class="empty-text">Nenhum evento cadastrado.</div></div>`;
  } else {
    html += `<div class="table-wrap"><table>
      <thead><tr><th>Nome</th><th>Início</th><th>Fim</th><th>Horário</th><th></th></tr></thead>
      <tbody>${data.map(ev => `<tr>
        <td><strong>${ev.nome}</strong></td>
        <td>${fmtBR(ev.data_inicio)}</td>
        <td>${ev.data_fim ? fmtBR(ev.data_fim) : '—'}</td>
        <td>${ev.hora_inicio||''}${ev.hora_inicio&&ev.hora_fim?' – '+ev.hora_fim:''}</td>
        <td><button class="btn-sm btn-danger" onclick="deleteEvento('${ev.id}','${ev.nome}')">Excluir</button></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  html += `
    <div class="modal-overlay" id="evento-modal"><div class="modal">
      <div class="modal-title">Adicionar Evento</div>
      <div id="evento-alert" style="display:none" class="alert"></div>
      <div class="form-group"><label class="form-label">Nome do evento <span class="req">*</span></label>
        <input class="form-control" id="ev-nome" placeholder="Ex: Reunião mensal"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Data início <span class="req">*</span></label>${dpHtml('ev-di')}</div>
        <div class="form-group"><label class="form-label">Data fim</label>${dpHtml('ev-df')}</div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Hora início</label>${tmHtml('ev-hi')}</div>
        <div class="form-group"><label class="form-label">Hora fim</label>${tmHtml('ev-hf')}</div>
      </div>
      <div class="modal-footer">
        <button class="btn-sm btn-ghost" onclick="closeModal('evento-modal')">Cancelar</button>
        <button class="btn-sm btn-primary" onclick="saveEvento()">Salvar</button>
      </div>
    </div></div>`;

  setContent(html);
  initPickers(document.getElementById('admin-content'));
}

function openEventoModal() { document.getElementById('evento-modal').classList.add('open'); }

async function saveEvento() {
  const nome = document.getElementById('ev-nome').value.trim();
  const di   = dpGet('ev-di');
  const al   = document.getElementById('evento-alert');
  if (!nome || !di) { al.className='alert alert-error'; al.textContent='Nome e data de início são obrigatórios.'; al.style.display='block'; return; }
  const res = await API.addEvento({ nome, data_inicio: di, hora_inicio: tmGet('ev-hi'), data_fim: dpGet('ev-df'), hora_fim: tmGet('ev-hf') });
  if (res.success) { closeModal('evento-modal'); loadEventos(); }
  else { al.className='alert alert-error'; al.textContent=res.error; al.style.display='block'; }
}

async function deleteEvento(id, nome) {
  if (!confirm(`Excluir evento "${nome}"?`)) return;
  const res = await API.deleteEvento(id);
  if (res.success) loadEventos(); else alert(res.error);
}

// ── Escala FDS ───────────────────────────────────────────────
let escalaMes = new Date().getMonth()+1;
let escalaAno = new Date().getFullYear();

async function loadEscala() {
  setContent(`<div class="loader"><div class="spinner"></div></div>`);
  const [escRes, funcRes] = await Promise.all([API.getEscalaFDS(escalaMes, escalaAno), API.getFuncionarios()]);
  const data  = escRes.data  || [];
  const funcs = funcRes.data || [];
  const MN = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  let html = `<div class="section-title">📋 Escala Final de Semana / Feriados</div>
    <div class="cal-controls" style="margin-bottom:16px">
      <div class="cal-nav">
        <button onclick="changeEscalaMes(-1)">‹</button>
        <span class="cal-title" style="font-size:15px">${MN[escalaMes-1]} ${escalaAno}</span>
        <button onclick="changeEscalaMes(1)">›</button>
      </div>
      <button class="btn-sm btn-primary" onclick="openEscalaModal()">+ Adicionar entrada</button>
    </div>`;

  if (!data.length) {
    html += `<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">Nenhuma escala para este período.</div></div>`;
  } else {
    html += `<div class="table-wrap"><table>
      <thead><tr><th>Funcionário</th><th>Data</th><th>Tipo</th><th></th></tr></thead>
      <tbody>${data.map(e => `<tr>
        <td>${e.funcionario_nome}</td><td>${fmtBR(e.data)}</td><td>${e.tipo}</td>
        <td><button class="btn-sm btn-danger" onclick="deleteEscala('${e.id}')">Remover</button></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  html += `
    <div class="modal-overlay" id="escala-modal"><div class="modal">
      <div class="modal-title">Adicionar Escala</div>
      <div id="escala-alert" style="display:none" class="alert"></div>
      <div class="form-group"><label class="form-label">Funcionário <span class="req">*</span></label>
        <select class="form-control" id="esc-func">
          <option value="">Selecione...</option>
          ${funcs.map(f => `<option value="${f.id}" data-nome="${f.nome}">${f.nome}</option>`).join('')}
        </select></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Data <span class="req">*</span></label>${dpHtml('esc-data')}</div>
        <div class="form-group"><label class="form-label">Tipo <span class="req">*</span></label>
          <select class="form-control" id="esc-tipo">
            <option value="">Selecione...</option>
            <option>Sábado</option><option>Domingo</option><option>Feriado</option>
          </select></div>
      </div>
      <div class="modal-footer">
        <button class="btn-sm btn-ghost" onclick="closeModal('escala-modal')">Cancelar</button>
        <button class="btn-sm btn-primary" onclick="saveEscala()">Salvar</button>
      </div>
    </div></div>`;

  setContent(html);
  initPickers(document.getElementById('admin-content'));
}

function changeEscalaMes(d) {
  escalaMes += d;
  if (escalaMes > 12) { escalaMes = 1; escalaAno++; }
  if (escalaMes < 1)  { escalaMes = 12; escalaAno--; }
  loadEscala();
}
function openEscalaModal() { document.getElementById('escala-modal').classList.add('open'); }

async function saveEscala() {
  const sel    = document.getElementById('esc-func');
  const funcId = sel.value;
  const funcNome = sel.options[sel.selectedIndex]?.dataset.nome || '';
  const data   = dpGet('esc-data');
  const tipo   = document.getElementById('esc-tipo').value;
  const al     = document.getElementById('escala-alert');
  if (!funcId || !data || !tipo) { al.className='alert alert-error'; al.textContent='Preencha todos os campos.'; al.style.display='block'; return; }
  const res = await API.addEscalaFDS([{ funcionario_id: funcId, funcionario_nome: funcNome, data, tipo }]);
  if (res.success) { closeModal('escala-modal'); loadEscala(); }
  else { al.className='alert alert-error'; al.textContent=res.error; al.style.display='block'; }
}

async function deleteEscala(id) {
  if (!confirm('Remover esta entrada da escala?')) return;
  const res = await API.deleteEscalaFDS(id);
  if (res.success) loadEscala(); else alert(res.error);
}

// ── Feriados ─────────────────────────────────────────────────
async function loadFeriados() {
  setContent(`<div class="loader"><div class="spinner"></div></div>`);
  const res = await API.getFeriados();
  if (!res.success) return setContent(`<div class="alert alert-error">${res.error}</div>`);
  const data = res.data;

  let html = `<div class="section-title">🗓️ Feriados
    <button class="btn-sm btn-primary" onclick="openFeriadoModal()">+ Adicionar</button></div>`;

  if (!data.length) {
    html += `<div class="empty"><div class="empty-icon">🗓️</div><div class="empty-text">Nenhum feriado cadastrado.</div></div>`;
  } else {
    html += `<div class="table-wrap"><table>
      <thead><tr><th>Data</th><th>Descrição</th><th></th></tr></thead>
      <tbody>${data.map(f => `<tr>
        <td>${fmtBR(f.data)}</td><td>${f.descricao}</td>
        <td><button class="btn-sm btn-danger" onclick="deleteFeriado('${f.id}','${f.descricao}')">Excluir</button></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  html += `
    <div class="modal-overlay" id="feriado-modal"><div class="modal">
      <div class="modal-title">Adicionar Feriado</div>
      <div id="feriado-alert" style="display:none" class="alert"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Data <span class="req">*</span></label>${dpHtml('fer-data')}</div>
        <div class="form-group"><label class="form-label">Descrição <span class="req">*</span></label>
          <input class="form-control" id="fer-desc" placeholder="Ex: Natal"></div>
      </div>
      <div class="modal-footer">
        <button class="btn-sm btn-ghost" onclick="closeModal('feriado-modal')">Cancelar</button>
        <button class="btn-sm btn-primary" onclick="saveFeriado()">Salvar</button>
      </div>
    </div></div>`;

  setContent(html);
  initPickers(document.getElementById('admin-content'));
}

function openFeriadoModal() { document.getElementById('feriado-modal').classList.add('open'); }

async function saveFeriado() {
  const data = dpGet('fer-data');
  const desc = document.getElementById('fer-desc').value.trim();
  const al   = document.getElementById('feriado-alert');
  if (!data || !desc) { al.className='alert alert-error'; al.textContent='Preencha todos os campos.'; al.style.display='block'; return; }
  const res = await API.addFeriado({ data, descricao: desc });
  if (res.success) { closeModal('feriado-modal'); loadFeriados(); }
  else { al.className='alert alert-error'; al.textContent=res.error; al.style.display='block'; }
}

async function deleteFeriado(id, desc) {
  if (!confirm(`Excluir feriado "${desc}"?`)) return;
  const res = await API.deleteFeriado(id);
  if (res.success) loadFeriados(); else alert(res.error);
}

// ── Pedidos ──────────────────────────────────────────────────
let pedidoFilter = 'todos';

async function loadPedidos() {
  setContent(`<div class="loader"><div class="spinner"></div></div>`);
  const res = await API.getAusencias();
  if (!res.success) return setContent(`<div class="alert alert-error">${res.error}</div>`);
  const all = res.data.sort((a,b) => new Date(b.data_criacao) - new Date(a.data_criacao));
  const filtered = pedidoFilter === 'todos' ? all : all.filter(a => a.status === pedidoFilter);

  let html = `<div class="section-title">📨 Pedidos</div>
    <div class="toggle-group" style="margin-bottom:16px">
      ${['todos','pendente','aprovado','rejeitado'].map(s =>
        `<button class="${pedidoFilter===s?'active':''}" onclick="setPedidoFilter('${s}')">${s.charAt(0).toUpperCase()+s.slice(1)}</button>`
      ).join('')}
    </div>`;

  if (!filtered.length) {
    html += `<div class="empty"><div class="empty-icon">📨</div><div class="empty-text">Nenhum pedido encontrado.</div></div>`;
  } else {
    html += `<div class="table-wrap"><table>
      <thead><tr><th>Funcionário</th><th>Tipo</th><th>Período</th><th>Motivo</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody>${filtered.map(a => `<tr>
        <td><strong>${a.nome}</strong><br><span style="color:var(--light);font-size:12px">${a.email}</span></td>
        <td>${a.tipo_solicitacao}</td>
        <td style="white-space:nowrap">${fmtBR(a.data_inicio)}<br>→ ${fmtBR(a.data_fim)}</td>
        <td>${a.motivo==='Outros'?'Outros: '+a.motivo_outro:a.motivo}</td>
        <td><span class="badge badge-${a.status}">${a.status}</span></td>
        <td class="td-actions">${a.status==='pendente'
          ? `<button class="btn-sm btn-primary" onclick="updatePedido('${a.id}','aprovado')">Aprovar</button>
             <button class="btn-sm btn-danger"  onclick="updatePedido('${a.id}','rejeitado')">Rejeitar</button>`
          : '—'}</td>
      </tr>`).join('')}</tbody></table></div>`;
  }
  setContent(html);
}

function setPedidoFilter(f) { pedidoFilter = f; loadPedidos(); }

async function updatePedido(id, status) {
  const res = await API.updateAusenciaStatus(id, status);
  if (res.success) loadPedidos(); else alert(res.error);
}

// ── Helpers ──────────────────────────────────────────────────
function setContent(html) { document.getElementById('admin-content').innerHTML = html; }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function fmtBR(s) {
  if (!s) return '—';
  const d = String(s).substring(0,10).split('-');
  return d.length===3 ? `${d[2]}/${d[1]}/${d[0]}` : s;
}

function chipCls(canal) {
  return {'Chat':'chip chip-chat','Telefone/pós':'chip chip-pos','Telefone/pré':'chip chip-pre'}[canal] || 'chip chip-ausencia';
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

document.addEventListener('DOMContentLoaded', () => {
  if (adminToken) showAdminPanel();
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
});
