function doGet(e) {
  try {
    const p = e.parameter || {};
    const action = p.action;

    if (action === 'approve' || action === 'reject') {
      return handleEmailAction(action, p.token);
    }
    if (action === 'setup') {
      return jsonResponse(initSheets());
    }
    if (action === 'setupAdmin') {
      return jsonResponse(setupAdmin(p));
    }
    if (action === 'getCalendarData') return jsonResponse(getCalendarData(p));
    if (action === 'getFuncionarios')  return jsonResponse(getFuncionarios());
    if (action === 'getEventos')       return jsonResponse(getEventos(p));
    if (action === 'getEscalaFDS')     return jsonResponse(getEscalaFDS(p));
    if (action === 'getFeriados')      return jsonResponse(getFeriados());
    if (action === 'getAusencias')     return jsonResponse(getAllAusencias());

    return jsonResponse({ error: 'Ação não encontrada.' });
  } catch (err) {
    return jsonResponse({ error: err.message, stack: err.stack });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // Public endpoints (no auth required)
    if (action === 'login')         return jsonResponse(login(data));
    if (action === 'submitRequest') return jsonResponse(submitRequest(data));

    // Protected endpoints
    if (!verifyToken(data.token)) {
      return jsonResponse({ success: false, error: 'Não autorizado.', unauthorized: true });
    }

    // Team
    if (action === 'addFuncionario')    return jsonResponse(addFuncionario(data));
    if (action === 'updateFuncionario') return jsonResponse(updateFuncionario(data));
    if (action === 'deleteFuncionario') return jsonResponse(deleteFuncionario(data));

    // Events
    if (action === 'addEvento')    return jsonResponse(addEvento(data));
    if (action === 'updateEvento') return jsonResponse(updateEvento(data));
    if (action === 'deleteEvento') return jsonResponse(deleteEvento(data));

    // Schedule
    if (action === 'addEscalaFDS')    return jsonResponse(addEscalaFDS(data));
    if (action === 'deleteEscalaFDS') return jsonResponse(deleteEscalaFDS(data));

    // Holidays
    if (action === 'addFeriado')    return jsonResponse(addFeriado(data));
    if (action === 'deleteFeriado') return jsonResponse(deleteFeriado(data));

    // Absences management
    if (action === 'updateAusenciaStatus') return jsonResponse(updateAusenciaStatus(data));

    return jsonResponse({ error: 'Ação não encontrada.' });
  } catch (err) {
    return jsonResponse({ error: err.message, stack: err.stack });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
