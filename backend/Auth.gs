function login(data) {
  const { usuario, senha } = data;
  if (!usuario || !senha) return { success: false, error: 'Usuário e senha são obrigatórios.' };

  const sheet = getOrCreateSheet('Admins', ['usuario','senha','token','token_expiry']);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === usuario && String(rows[i][1]).trim() === senha) {
      const token = generateToken();
      const expiry = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      sheet.getRange(i + 1, 3).setValue(token);
      sheet.getRange(i + 1, 4).setValue(expiry);
      return { success: true, token, usuario };
    }
  }

  return { success: false, error: 'Usuário ou senha incorretos.' };
}

function verifyToken(token) {
  if (!token) return false;
  const sheet = getOrCreateSheet('Admins', ['usuario','senha','token','token_expiry']);
  const admins = sheetToObjects(sheet);
  const admin = admins.find(a => String(a.token).trim() === String(token).trim());
  if (!admin) return false;
  return new Date(admin.token_expiry) > new Date();
}

function setupAdmin(data) {
  if (data.setupKey !== 'mz-setup-2026') return { success: false, error: 'Chave inválida.' };
  const sheet = getOrCreateSheet('Admins', ['usuario','senha','token','token_expiry']);
  const existing = sheetToObjects(sheet);
  if (existing.find(a => a.usuario === data.usuario)) {
    return { success: false, error: 'Usuário já existe.' };
  }
  sheet.appendRow([data.usuario, data.senha, '', '']);
  return { success: true, message: 'Admin criado com sucesso.' };
}
