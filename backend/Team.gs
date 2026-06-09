function getFuncionarios() {
  const sheet = getOrCreateSheet('Funcionarios', ['id','nome','email','canal','frente','horario_normal_inicio','horario_normal_fim','horario_reduzido_inicio','horario_reduzido_fim','ativo']);
  const all = sheetToObjects(sheet);
  return { success: true, data: all.filter(f => f.ativo !== false && String(f.ativo).toUpperCase() !== 'FALSE') };
}

function getAllFuncionarios() {
  const sheet = getOrCreateSheet('Funcionarios', ['id','nome','email','canal','frente','horario_normal_inicio','horario_normal_fim','horario_reduzido_inicio','horario_reduzido_fim','ativo']);
  return sheetToObjects(sheet).filter(f => f.ativo !== false && String(f.ativo).toUpperCase() !== 'FALSE');
}

function addFuncionario(data) {
  const sheet = getOrCreateSheet('Funcionarios', ['id','nome','email','canal','frente','horario_normal_inicio','horario_normal_fim','horario_reduzido_inicio','horario_reduzido_fim','ativo']);
  const id = generateId();
  sheet.appendRow([
    id,
    data.nome,
    data.email || '',
    data.canal,
    data.frente || '',
    data.horario_normal_inicio,
    data.horario_normal_fim,
    data.horario_reduzido_inicio || '',
    data.horario_reduzido_fim || '',
    true
  ]);
  return { success: true, id };
}

function updateFuncionario(data) {
  const sheet = getOrCreateSheet('Funcionarios', ['id','nome','email','canal','frente','horario_normal_inicio','horario_normal_fim','horario_reduzido_inicio','horario_reduzido_fim','ativo']);
  const row = findRowById(sheet, data.id);
  if (row === -1) return { success: false, error: 'Funcionário não encontrado.' };
  sheet.getRange(row, 2, 1, 9).setValues([[
    data.nome,
    data.email || '',
    data.canal,
    data.frente || '',
    data.horario_normal_inicio,
    data.horario_normal_fim,
    data.horario_reduzido_inicio || '',
    data.horario_reduzido_fim || '',
    true
  ]]);
  return { success: true };
}

function deleteFuncionario(data) {
  const sheet = getOrCreateSheet('Funcionarios', ['id','nome','email','canal','frente','horario_normal_inicio','horario_normal_fim','horario_reduzido_inicio','horario_reduzido_fim','ativo']);
  const row = findRowById(sheet, data.id);
  if (row === -1) return { success: false, error: 'Funcionário não encontrado.' };
  sheet.getRange(row, 10).setValue(false);
  return { success: true };
}
