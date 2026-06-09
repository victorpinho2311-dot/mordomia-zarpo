function getEscalaFDS(params) {
  const sheet = getOrCreateSheet('Escala_FDS', ['id','funcionario_id','funcionario_nome','data','tipo']);
  const all = sheetToObjects(sheet);
  if (params && params.mes && params.ano) {
    const mes = parseInt(params.mes);
    const ano = parseInt(params.ano);
    return { success: true, data: all.filter(e => {
      const d = new Date(e.data + 'T12:00:00');
      return d.getMonth() + 1 === mes && d.getFullYear() === ano;
    })};
  }
  return { success: true, data: all };
}

function addEscalaFDS(data) {
  const sheet = getOrCreateSheet('Escala_FDS', ['id','funcionario_id','funcionario_nome','data','tipo']);
  const entries = Array.isArray(data.entries) ? data.entries : [data];
  entries.forEach(e => {
    sheet.appendRow([generateId(), e.funcionario_id, e.funcionario_nome, e.data, e.tipo]);
  });
  return { success: true };
}

function deleteEscalaFDS(data) {
  const sheet = getOrCreateSheet('Escala_FDS', ['id','funcionario_id','funcionario_nome','data','tipo']);
  const row = findRowById(sheet, data.id);
  if (row === -1) return { success: false, error: 'Entrada não encontrada.' };
  sheet.deleteRow(row);
  return { success: true };
}

function getFeriados() {
  const sheet = getOrCreateSheet('Feriados', ['id','data','descricao']);
  return { success: true, data: sheetToObjects(sheet) };
}

function addFeriado(data) {
  const sheet = getOrCreateSheet('Feriados', ['id','data','descricao']);
  const id = generateId();
  sheet.appendRow([id, data.data, data.descricao]);
  return { success: true, id };
}

function deleteFeriado(data) {
  const sheet = getOrCreateSheet('Feriados', ['id','data','descricao']);
  const row = findRowById(sheet, data.id);
  if (row === -1) return { success: false, error: 'Feriado não encontrado.' };
  sheet.deleteRow(row);
  return { success: true };
}
