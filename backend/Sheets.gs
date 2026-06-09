function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1E293B').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function initSheets() {
  getOrCreateSheet('Funcionarios', ['id','nome','email','canal','frente','horario_normal_inicio','horario_normal_fim','horario_reduzido_inicio','horario_reduzido_fim','ativo']);
  getOrCreateSheet('Escala_FDS', ['id','funcionario_id','funcionario_nome','data','tipo']);
  getOrCreateSheet('Feriados', ['id','data','descricao']);
  getOrCreateSheet('Eventos', ['id','nome','data_inicio','hora_inicio','data_fim','hora_fim']);
  getOrCreateSheet('Ausencias', ['id','nome','email','tipo_solicitacao','motivo','motivo_outro','data_inicio','data_fim','status','token_aprovacao','data_criacao']);
  getOrCreateSheet('Admins', ['usuario','senha','token','token_expiry']);
  return { success: true, message: 'Planilhas inicializadas com sucesso.' };
}

// Columns returned as "HH:mm"
const TIME_COLS = ['horario_normal_inicio','horario_normal_fim','horario_reduzido_inicio','horario_reduzido_fim'];
// Columns returned as full "yyyy-MM-dd'T'HH:mm" (preserves time from datetime cells)
const DATETIME_COLS = ['data_inicio', 'data_fim'];

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const tz = Session.getScriptTimeZone();
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (val instanceof Date) {
        if (TIME_COLS.includes(h)) {
          val = Utilities.formatDate(val, tz, "HH:mm");
        } else if (DATETIME_COLS.includes(h)) {
          val = Utilities.formatDate(val, tz, "yyyy-MM-dd'T'HH:mm");
        } else {
          val = Utilities.formatDate(val, tz, "yyyy-MM-dd");
        }
      }
      obj[h] = val;
    });
    return obj;
  });
}

function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) return i + 1;
  }
  return -1;
}

function generateId() {
  return Utilities.getUuid();
}

function generateToken() {
  const raw = Utilities.computeHmacSha256Signature(
    new Date().toISOString() + Math.random().toString(),
    'mz-secret-2026'
  );
  return Utilities.base64EncodeWebSafe(raw).replace(/=/g, '').substring(0, 40);
}
