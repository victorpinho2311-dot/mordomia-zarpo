function doGet(e) {
  try {
    const p = e.parameter || {};
    const action = p.action;
    const callback = p.callback; // JSONP support

    if (action === 'approve' || action === 'reject') {
      return handleEmailAction(action, p.token);
    }

    let result;
    if (action === 'setup')           result = initSheets();
    else if (action === 'setupAdmin') result = setupAdmin(p);
    else if (action === 'getCalendarData') result = getCalendarData(p);
    else if (action === 'getFuncionarios')  result = getFuncionarios();
    else if (action === 'getEventos')       result = getEventos(p);
    else if (action === 'getEscalaFDS')     result = getEscalaFDS(p);
    else if (action === 'getFeriados')      result = getFeriados();
    else if (action === 'getAusencias')     result = getAllAusencias();
    else result = { error: 'Ação não encontrada.' };

    if (callback) {
      return ContentService
        .createTextOutput(`${callback}(${JSON.stringify(result)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return jsonResponse(result);
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
