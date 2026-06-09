const MOTIVOS = [
  'Férias','Folga','Day Off',
  'Consulta médica/Exame médico','Consulta odontológica',
  'Cirurgia','Acompanhamento de familiar','Abono','Outros'
];

async function initRequest() {
  // Load employees for the dropdown
  try {
    const res = await API.getFuncionarios();
    if (res.success && res.data.length) {
      const sel = document.getElementById('nome');
      sel.innerHTML = '<option value="">Selecione seu nome...</option>' +
        res.data.map(f => `<option value="${f.nome}" data-email="${f.email || ''}">${f.nome}</option>`).join('');
      sel.addEventListener('change', () => {
        const opt = sel.options[sel.selectedIndex];
        const emailField = document.getElementById('email');
        if (opt.dataset.email) emailField.value = opt.dataset.email;
      });
    }
  } catch (e) {
    console.warn('Could not load employees:', e);
  }

  // Populate motivo dropdown
  const motivoSel = document.getElementById('motivo');
  motivoSel.innerHTML = '<option value="">Selecione o motivo...</option>' +
    MOTIVOS.map(m => `<option value="${m}">${m}</option>`).join('');

  motivoSel.addEventListener('change', () => {
    const outrosWrap = document.getElementById('outros-wrap');
    outrosWrap.style.display = motivoSel.value === 'Outros' ? 'block' : 'none';
  });

  document.getElementById('request-form').addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  const alert = document.getElementById('form-alert');

  const nome     = document.getElementById('nome').value.trim();
  const email    = document.getElementById('email').value.trim();
  const tipo     = document.getElementById('tipo_solicitacao').value;
  const motivo   = document.getElementById('motivo').value;
  const outroTxt = document.getElementById('motivo_outro').value.trim();
  const inicio   = document.getElementById('data_inicio').value;
  const fim      = document.getElementById('data_fim').value;

  if (!nome || !email || !tipo || !motivo || !inicio || !fim) {
    showAlert(alert, 'error', 'Por favor, preencha todos os campos obrigatórios.');
    return;
  }
  if (motivo === 'Outros' && !outroTxt) {
    showAlert(alert, 'error', 'Por favor, descreva o motivo.');
    return;
  }
  if (inicio > fim) {
    showAlert(alert, 'error', 'A data de início não pode ser posterior à data de fim.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Enviando...';
  hideAlert(alert);

  try {
    const res = await API.submitRequest({ nome, email, tipo_solicitacao: tipo, motivo, motivo_outro: outroTxt, data_inicio: inicio, data_fim: fim });
    if (res.success) {
      showAlert(alert, 'success', res.message || 'Pedido enviado com sucesso!');
      e.target.reset();
      document.getElementById('outros-wrap').style.display = 'none';
    } else {
      showAlert(alert, 'error', res.error || 'Erro ao enviar o pedido.');
    }
  } catch (err) {
    showAlert(alert, 'error', 'Erro de conexão. Tente novamente.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar Pedido';
  }
}

function showAlert(el, type, msg) {
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideAlert(el) { el.style.display = 'none'; }

document.addEventListener('DOMContentLoaded', initRequest);
