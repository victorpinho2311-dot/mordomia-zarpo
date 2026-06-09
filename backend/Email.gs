const GESTAO_EMAIL = 'gestao-cs@zarpo.com.br';

function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const s = String(dateStr).substring(0, 10);
  const parts = s.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateTimeBR(dateStr) {
  if (!dateStr) return '';
  const s = String(dateStr);
  if (s.includes('T') || s.length > 10) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return Utilities.formatDate(d, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm');
    }
  }
  return formatDateBR(dateStr);
}

function sendRequestEmail(reqData, token) {
  const scriptUrl = ScriptApp.getService().getUrl();
  const approveUrl = `${scriptUrl}?action=approve&token=${token}`;
  const rejectUrl = `${scriptUrl}?action=reject&token=${token}`;

  const motivo = reqData.motivo === 'Outros' && reqData.motivo_outro
    ? `Outros — ${reqData.motivo_outro}`
    : reqData.motivo;

  const subject = `[Mordomia] Novo Pedido: ${reqData.tipo_solicitacao} — ${reqData.nome}`;

  const plainBody =
    `Novo pedido de ${reqData.tipo_solicitacao} recebido pelo sistema Mordomia Zarpo.\n\n` +
    `Funcionário: ${reqData.nome}\n` +
    `Email: ${reqData.email}\n` +
    `Tipo: ${reqData.tipo_solicitacao}\n` +
    `Início: ${formatDateTimeBR(reqData.data_inicio)}\n` +
    `Fim: ${formatDateTimeBR(reqData.data_fim)}\n` +
    `Motivo: ${motivo}\n\n` +
    `✅ APROVAR: ${approveUrl}\n\n` +
    `❌ REJEITAR: ${rejectUrl}\n\n` +
    `—\nSistema Mordomia Zarpo`;

  const htmlBody = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;margin:0;padding:24px}
  .wrap{max-width:560px;margin:0 auto}
  .card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .hd{background:#1E293B;padding:24px 32px}
  .hd h1{color:#fff;font-size:18px;margin:0;font-weight:600}
  .hd p{color:#94A3B8;font-size:12px;margin:4px 0 0}
  .bd{padding:28px 32px}
  .badge{display:inline-block;background:#DBEAFE;color:#2563EB;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:20px}
  .grid{background:#F8FAFC;border-radius:8px;padding:16px 20px;margin-bottom:24px}
  .row{display:flex;gap:12px;margin-bottom:10px}
  .row:last-child{margin-bottom:0}
  .lbl{color:#64748B;font-size:12px;width:80px;flex-shrink:0;padding-top:2px}
  .val{color:#1E293B;font-size:14px;font-weight:500}
  .btns{display:flex;gap:12px}
  .btn{flex:1;display:block;padding:14px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;text-align:center;color:#fff}
  .ok{background:#22C55E}
  .no{background:#EF4444}
  .ft{background:#F8FAFC;padding:14px 32px;border-top:1px solid #E2E8F0}
  .ft p{color:#94A3B8;font-size:11px;margin:0}
</style></head><body><div class="wrap"><div class="card">
<div class="hd"><h1>Mordomia Zarpo</h1><p>Sistema de Gestão de Escala</p></div>
<div class="bd">
  <div class="badge">Novo Pedido</div>
  <div class="grid">
    <div class="row"><div class="lbl">Funcionário</div><div class="val">${reqData.nome}</div></div>
    <div class="row"><div class="lbl">Email</div><div class="val">${reqData.email}</div></div>
    <div class="row"><div class="lbl">Tipo</div><div class="val">${reqData.tipo_solicitacao}</div></div>
    <div class="row"><div class="lbl">Início</div><div class="val">${formatDateTimeBR(reqData.data_inicio)}</div></div>
    <div class="row"><div class="lbl">Fim</div><div class="val">${formatDateTimeBR(reqData.data_fim)}</div></div>
    <div class="row"><div class="lbl">Motivo</div><div class="val">${motivo}</div></div>
  </div>
  <div class="btns">
    <a href="${approveUrl}" class="btn ok">✓ Aprovar</a>
    <a href="${rejectUrl}" class="btn no">✗ Rejeitar</a>
  </div>
</div>
<div class="ft"><p>Gerado automaticamente pelo sistema Mordomia Zarpo.</p></div>
</div></div></body></html>`;

  GmailApp.sendEmail(GESTAO_EMAIL, subject, plainBody, {
    htmlBody: htmlBody,
    replyTo: reqData.email,
    name: 'Mordomia Zarpo'
  });
}

function sendNotificationEmail(ausencia, status) {
  const approved = status === 'aprovado';
  const subject = approved
    ? `[Mordomia] ✅ Pedido aprovado — ${ausencia.tipo_solicitacao}`
    : `[Mordomia] ❌ Pedido rejeitado — ${ausencia.tipo_solicitacao}`;

  const motivo = ausencia.motivo === 'Outros' && ausencia.motivo_outro
    ? `Outros — ${ausencia.motivo_outro}`
    : ausencia.motivo;

  const color = approved ? '#22C55E' : '#EF4444';
  const label = approved ? 'APROVADO' : 'REJEITADO';
  const icon = approved ? '✅' : '❌';

  const plain = `Olá ${ausencia.nome},\n\nSeu pedido de ${ausencia.tipo_solicitacao} foi ${label}.\n\nPeríodo: ${formatDateTimeBR(ausencia.data_inicio)} → ${formatDateTimeBR(ausencia.data_fim)}\nMotivo: ${motivo}\n\n${approved ? 'Seu pedido foi registrado. Em caso de dúvidas, entre em contato com a gestão.' : 'Em caso de dúvidas, entre em contato com gestao-cs@zarpo.com.br.'}\n\nAtenciosamente,\nEquipe Gestão CS — Zarpo`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;margin:0;padding:24px}
  .wrap{max-width:520px;margin:0 auto}
  .card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .hd{background:${color};padding:28px 32px;text-align:center}
  .hd .ic{font-size:40px;margin-bottom:8px}
  .hd h2{color:#fff;font-size:20px;margin:0;font-weight:700}
  .bd{padding:28px 32px}
  .hi{font-size:15px;color:#1E293B;margin-bottom:20px}
  .grid{background:#F8FAFC;border-radius:8px;padding:16px 20px;margin-bottom:20px}
  .row{display:flex;gap:12px;margin-bottom:10px}
  .row:last-child{margin-bottom:0}
  .lbl{color:#64748B;font-size:12px;width:80px;flex-shrink:0;padding-top:2px}
  .val{color:#1E293B;font-size:14px;font-weight:500}
  .st{font-weight:700;color:${color}}
  .note{color:#64748B;font-size:13px;line-height:1.6}
  .ft{background:#F8FAFC;padding:14px 32px;border-top:1px solid #E2E8F0}
  .ft p{color:#94A3B8;font-size:11px;margin:0}
</style></head><body><div class="wrap"><div class="card">
<div class="hd"><div class="ic">${icon}</div><h2>Pedido ${label}</h2></div>
<div class="bd">
  <div class="hi">Olá, <strong>${ausencia.nome}</strong>!</div>
  <div class="grid">
    <div class="row"><div class="lbl">Tipo</div><div class="val">${ausencia.tipo_solicitacao}</div></div>
    <div class="row"><div class="lbl">Início</div><div class="val">${formatDateTimeBR(ausencia.data_inicio)}</div></div>
    <div class="row"><div class="lbl">Fim</div><div class="val">${formatDateTimeBR(ausencia.data_fim)}</div></div>
    <div class="row"><div class="lbl">Motivo</div><div class="val">${motivo}</div></div>
    <div class="row"><div class="lbl">Status</div><div class="val st">${label}</div></div>
  </div>
  <p class="note">${approved ? 'Seu pedido foi registrado no sistema. Em caso de dúvidas, entre em contato com a gestão.' : 'Em caso de dúvidas sobre a rejeição, entre em contato com gestao-cs@zarpo.com.br.'}</p>
</div>
<div class="ft"><p>Gerado automaticamente pelo sistema Mordomia Zarpo.</p></div>
</div></div></body></html>`;

  GmailApp.sendEmail(ausencia.email, subject, plain, {
    htmlBody: html,
    name: 'Mordomia Zarpo'
  });
}
