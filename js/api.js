const API = {
  async get(action, params = {}) {
    const qs = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`${CONFIG.SCRIPT_URL}?${qs}`, { redirect: 'follow' });
    return res.json();
  },

  async post(action, data = {}) {
    const token = localStorage.getItem('mz_token');
    const body = JSON.stringify({ action, token, ...data });
    const res = await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      body,
      redirect: 'follow'
    });
    const json = await res.json();
    if (json.unauthorized) {
      localStorage.removeItem('mz_token');
      localStorage.removeItem('mz_user');
      window.location.href = 'admin.html';
    }
    return json;
  },

  // Auth
  login: (usuario, senha) => API.post('login', { usuario, senha }),

  // Calendar
  getCalendarData: (mes, ano) => API.get('getCalendarData', { mes, ano }),

  // Employees
  getFuncionarios: () => API.get('getFuncionarios'),
  addFuncionario: (data) => API.post('addFuncionario', data),
  updateFuncionario: (data) => API.post('updateFuncionario', data),
  deleteFuncionario: (id) => API.post('deleteFuncionario', { id }),

  // Events
  getEventos: (mes, ano) => API.get('getEventos', { mes, ano }),
  addEvento: (data) => API.post('addEvento', data),
  updateEvento: (data) => API.post('updateEvento', data),
  deleteEvento: (id) => API.post('deleteEvento', { id }),

  // Schedule
  getEscalaFDS: (mes, ano) => API.get('getEscalaFDS', { mes, ano }),
  addEscalaFDS: (entries) => API.post('addEscalaFDS', { entries }),
  deleteEscalaFDS: (id) => API.post('deleteEscalaFDS', { id }),

  // Holidays
  getFeriados: () => API.get('getFeriados'),
  addFeriado: (data) => API.post('addFeriado', data),
  deleteFeriado: (id) => API.post('deleteFeriado', { id }),

  // Absences
  submitRequest: (data) => API.post('submitRequest', data),
  getAusencias: () => API.get('getAusencias'),
  updateAusenciaStatus: (id, status) => API.post('updateAusenciaStatus', { id, status })
};
