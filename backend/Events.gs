function getEventos(params) {
  const sheet = getOrCreateSheet('Eventos', ['id','nome','data_inicio','hora_inicio','data_fim','hora_fim']);
  const all = sheetToObjects(sheet);
  if (params && params.mes && params.ano) {
    const mes = parseInt(params.mes);
    const ano = parseInt(params.ano);
    return { success: true, data: all.filter(e => {
      const d = new Date(e.data_inicio + 'T12:00:00');
      return d.getMonth() + 1 === mes && d.getFullYear() === ano;
    })};
  }
  return { success: true, data: all };
}

function addEvento(data) {
  const sheet = getOrCreateSheet('Eventos', ['id','nome','data_inicio','hora_inicio','data_fim','hora_fim']);
  const id = generateId();
  sheet.appendRow([
    id,
    data.nome,
    data.data_inicio,
    data.hora_inicio || '',
    data.data_fim || data.data_inicio,
    data.hora_fim || ''
  ]);
  return { success: true, id };
}

function updateEvento(data) {
  const sheet = getOrCreateSheet('Eventos', ['id','nome','data_inicio','hora_inicio','data_fim','hora_fim']);
  const row = findRowById(sheet, data.id);
  if (row === -1) return { success: false, error: 'Evento não encontrado.' };
  sheet.getRange(row, 2, 1, 5).setValues([[
    data.nome,
    data.data_inicio,
    data.hora_inicio || '',
    data.data_fim || data.data_inicio,
    data.hora_fim || ''
  ]]);
  return { success: true };
}

function deleteEvento(data) {
  const sheet = getOrCreateSheet('Eventos', ['id','nome','data_inicio','hora_inicio','data_fim','hora_fim']);
  const row = findRowById(sheet, data.id);
  if (row === -1) return { success: false, error: 'Evento não encontrado.' };
  sheet.deleteRow(row);
  return { success: true };
}
