function submitRequest(data) {
  const required = ['nome', 'email', 'tipo_solicitacao', 'motivo', 'data_inicio', 'data_fim'];
  for (const f of required) {
    if (!data[f]) return { success: false, error: `Campo obrigatório ausente: ${f}` };
  }

  const sheet = getOrCreateSheet('Ausencias', ['id','nome','email','tipo_solicitacao','motivo','motivo_outro','data_inicio','data_fim','status','token_aprovacao','data_criacao']);
  const id = generateId();
  const token = generateToken();
  const now = new Date().toISOString();

  sheet.appendRow([
    id,
    data.nome,
    data.email,
    data.tipo_solicitacao,
    data.motivo,
    data.motivo_outro || '',
    data.data_inicio,
    data.data_fim,
    'pendente',
    token,
    now
  ]);

  try {
    sendRequestEmail(data, token);
  } catch(e) {
    Logger.log('Email error: ' + e.message);
  }
  return { success: true, message: 'Pedido enviado com sucesso! Você receberá um email com o resultado.' };
}

function handleEmailAction(action, token) {
  const sheet = getOrCreateSheet('Ausencias', ['id','nome','email','tipo_solicitacao','motivo','motivo_outro','data_inicio','data_fim','status','token_aprovacao','data_criacao']);
  const all = sheetToObjects(sheet);
  const idx = all.findIndex(a => String(a.token_aprovacao).trim() === String(token).trim());

  if (idx === -1) {
    return HtmlService.createHtmlOutput(confirmHtml('error', 'Token inválido ou pedido não encontrado.'));
  }

  const ausencia = all[idx];
  if (ausencia.status !== 'pendente') {
    return HtmlService.createHtmlOutput(confirmHtml('info', `Este pedido já foi <strong>${ausencia.status}</strong>.`));
  }

  const newStatus = action === 'approve' ? 'aprovado' : 'rejeitado';
  sheet.getRange(idx + 2, 9).setValue(newStatus);

  const updated = Object.assign({}, ausencia, { status: newStatus });
  sendNotificationEmail(updated, newStatus);

  const msg = action === 'approve'
    ? `Pedido de <strong>${ausencia.tipo_solicitacao}</strong> de <strong>${ausencia.nome}</strong> aprovado com sucesso!`
    : `Pedido de <strong>${ausencia.tipo_solicitacao}</strong> de <strong>${ausencia.nome}</strong> foi rejeitado.`;

  return HtmlService.createHtmlOutput(confirmHtml(action === 'approve' ? 'success' : 'reject', msg));
}

function confirmHtml(type, message) {
  const map = {
    success: { color: '#22C55E', icon: '✓', title: 'Aprovado!' },
    reject:  { color: '#EF4444', icon: '✗', title: 'Rejeitado' },
    error:   { color: '#F59E0B', icon: '⚠', title: 'Atenção' },
    info:    { color: '#3B82F6', icon: 'ℹ', title: 'Informação' }
  };
  const t = map[type] || map.info;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mordomia Zarpo</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#F1F5F9;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .card{background:#fff;border-radius:16px;padding:48px 40px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:440px;width:90%}
  .icon{width:72px;height:72px;border-radius:50%;background:${t.color}20;color:${t.color};font-size:28px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px}
  h2{color:#1E293B;font-size:22px;margin-bottom:12px}
  p{color:#64748B;font-size:15px;line-height:1.6}
  .brand{font-size:12px;color:#94A3B8;margin-top:32px;font-weight:600;letter-spacing:.5px;text-transform:uppercase}
</style></head><body>
<div class="card">
  <div class="icon">${t.icon}</div>
  <h2>${t.title}</h2>
  <p>${message}</p>
  <div class="brand">Mordomia Zarpo</div>
</div></body></html>`;
}
