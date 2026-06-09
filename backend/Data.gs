function getCalendarData(params) {
  const mes = params && params.mes ? parseInt(params.mes) : new Date().getMonth() + 1;
  const ano = params && params.ano ? parseInt(params.ano) : new Date().getFullYear();

  const funcionarios = getAllFuncionarios();

  const allEscala = sheetToObjects(getOrCreateSheet('Escala_FDS', ['id','funcionario_id','funcionario_nome','data','tipo']));
  const escala_fds = allEscala.filter(e => {
    const d = new Date(e.data + 'T12:00:00');
    return d.getMonth() + 1 === mes && d.getFullYear() === ano;
  });

  const allFeriados = sheetToObjects(getOrCreateSheet('Feriados', ['id','data','descricao']));
  const feriados = allFeriados.filter(f => {
    const d = new Date(f.data + 'T12:00:00');
    return d.getMonth() + 1 === mes && d.getFullYear() === ano;
  });

  const allEventos = sheetToObjects(getOrCreateSheet('Eventos', ['id','nome','data_inicio','hora_inicio','data_fim','hora_fim']));
  const eventos = allEventos.filter(e => {
    const start = new Date(e.data_inicio + 'T12:00:00');
    const end = new Date((e.data_fim || e.data_inicio) + 'T12:00:00');
    const mesStart = new Date(ano, mes - 1, 1);
    const mesEnd = new Date(ano, mes, 0);
    return start <= mesEnd && end >= mesStart;
  });

  const allAusencias = sheetToObjects(getOrCreateSheet('Ausencias', ['id','nome','email','tipo_solicitacao','motivo','motivo_outro','data_inicio','data_fim','status','token_aprovacao','data_criacao']));
  const ausencias = allAusencias.filter(a => {
    if (a.status !== 'aprovado') return false;
    const start = new Date(String(a.data_inicio).substring(0, 10) + 'T12:00:00');
    const end = new Date(String(a.data_fim).substring(0, 10) + 'T12:00:00');
    const mesStart = new Date(ano, mes - 1, 1);
    const mesEnd = new Date(ano, mes, 0);
    return start <= mesEnd && end >= mesStart;
  });

  return {
    success: true,
    data: { funcionarios, escala_fds, feriados, eventos, ausencias, mes, ano }
  };
}

function getAllAusencias() {
  const sheet = getOrCreateSheet('Ausencias', ['id','nome','email','tipo_solicitacao','motivo','motivo_outro','data_inicio','data_fim','status','token_aprovacao','data_criacao']);
  return { success: true, data: sheetToObjects(sheet) };
}

function updateAusenciaStatus(data) {
  const sheet = getOrCreateSheet('Ausencias', ['id','nome','email','tipo_solicitacao','motivo','motivo_outro','data_inicio','data_fim','status','token_aprovacao','data_criacao']);
  const row = findRowById(sheet, data.id);
  if (row === -1) return { success: false, error: 'Ausência não encontrada.' };
  sheet.getRange(row, 9).setValue(data.status);
  const all = sheetToObjects(sheet);
  const ausencia = all.find(a => String(a.id) === String(data.id));
  if (ausencia) sendNotificationEmail(ausencia, data.status);
  return { success: true };
}
