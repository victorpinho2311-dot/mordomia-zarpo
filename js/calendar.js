const DAYS_SHORT   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MONTHS_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const CANAL_CLASS = {
  'Chat': 'chat',
  'Telefone/pós': 'pos',
  'Telefone/pre': 'pre',
  'Telefone/pré': 'pre',
};

function getChipClass(canal) {
  return 'chip chip-' + (CANAL_CLASS[canal] || 'ausencia');
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateInRange(dateStr, startStr, endStr) {
  const d = dateStr.substring(0, 10);
  const s = String(startStr).substring(0, 10);
  const e = String(endStr).substring(0, 10);
  return d >= s && d <= e;
}

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (m || 0);
}

function isFeriado(dateStr, feriados) {
  return feriados.some(f => String(f.data).substring(0, 10) === dateStr);
}

// ── Month View ──────────────────────────────────────────────
function renderMonth(container, calData, viewMode) {
  const { funcionarios, escala_fds, feriados, eventos, ausencias, mes, ano } = calData;

  const firstDay = new Date(ano, mes - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(ano, mes, 0).getDate();
  const prevDays = new Date(ano, mes - 1, 0).getDate();
  const today = toDateStr(new Date());

  let html = `
    <div class="cal-grid">
      <div class="cal-header">
        ${DAYS_SHORT.map(d => `<div class="cal-header-cell">${d}</div>`).join('')}
      </div>
      <div class="cal-body">`;

  // Leading blanks
  for (let i = 0; i < firstDay; i++) {
    const d = prevDays - firstDay + 1 + i;
    html += `<div class="cal-cell other-month"><div class="cal-day-num">${d}</div></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(ano, mes - 1, day);
    const dow = date.getDay();
    const dateStr = toDateStr(date);
    const isWeekend = dow === 0 || dow === 6;
    const isFer = isFeriado(dateStr, feriados);
    const isSpecial = isWeekend || isFer;
    const isToday = dateStr === today;

    const dayAusencias = ausencias.filter(a => dateInRange(dateStr, a.data_inicio, a.data_fim));
    const dayEventos   = eventos.filter(e => dateInRange(dateStr, e.data_inicio, e.data_fim || e.data_inicio));
    const dayEscala    = escala_fds.filter(e => String(e.data).substring(0, 10) === dateStr);

    const absentNames = dayAusencias.map(a => a.nome);

    let chips = [];

    if (viewMode === 'escala' || viewMode === 'ambos') {
      if (isSpecial) {
        dayEscala.forEach(e => {
          const func = funcionarios.find(f => f.id === e.funcionario_id || f.nome === e.funcionario_nome);
          const canal = func ? func.canal : '';
          chips.push(`<div class="${getChipClass(canal)}" title="${e.funcionario_nome} (${e.tipo})">${e.funcionario_nome}</div>`);
        });
      }
      // Absences always shown
      dayAusencias.forEach(a => {
        const label = a.data_inicio === a.data_fim || String(a.data_inicio).substring(0, 10) === String(a.data_fim).substring(0, 10)
          ? a.nome
          : `${a.nome} (${a.tipo_solicitacao})`;
        chips.push(`<div class="chip chip-ausencia" title="${a.nome} — ${a.tipo_solicitacao}">${label}</div>`);
      });
    }

    if (viewMode === 'canais' || viewMode === 'ambos') {
      if (!isSpecial) {
        const groups = {};
        funcionarios.filter(f => !absentNames.includes(f.nome)).forEach(f => {
          if (!groups[f.canal]) groups[f.canal] = [];
          groups[f.canal].push(f.nome);
        });
        Object.entries(groups).forEach(([canal, names]) => {
          chips.push(`<div class="${getChipClass(canal)}" title="${names.join(', ')}">${canal} (${names.length})</div>`);
        });
      }
    }

    // Events
    dayEventos.forEach(ev => {
      chips.push(`<div class="chip chip-evento" title="${ev.nome}">${ev.nome}</div>`);
    });

    // Holiday label
    if (isFer) {
      const fer = feriados.find(f => String(f.data).substring(0, 10) === dateStr);
      chips.unshift(`<div class="chip chip-feriado">${fer.descricao}</div>`);
    }

    const MAX_CHIPS = 4;
    const shown = chips.slice(0, MAX_CHIPS);
    const hidden = chips.length - MAX_CHIPS;

    let cls = 'cal-cell';
    if (isToday) cls += ' today';
    if (isWeekend) cls += ' weekend-col';
    if (isFer) cls += ' feriado';

    html += `
      <div class="${cls}" data-date="${dateStr}">
        <div class="cal-day-num">${day}</div>
        <div class="cal-chips">
          ${shown.join('')}
          ${hidden > 0 ? `<div class="more-chips">+${hidden} mais</div>` : ''}
        </div>
      </div>`;
  }

  // Trailing blanks
  const total = firstDay + daysInMonth;
  const trailing = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= trailing; i++) {
    html += `<div class="cal-cell other-month"><div class="cal-day-num">${i}</div></div>`;
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

// ── Week View ────────────────────────────────────────────────
const WEEK_START_H = 8;   // 8am
const WEEK_END_H   = 21;  // 9pm
const HOUR_PX      = 60;

function renderWeek(container, calData, viewMode, weekOffset) {
  const { funcionarios, escala_fds, feriados, eventos, ausencias, mes, ano } = calData;
  const today = new Date();

  // Find the Sunday of the first week of the month, then offset
  const firstOfMonth = new Date(ano, mes - 1, 1);
  const startOfWeek = new Date(firstOfMonth);
  startOfWeek.setDate(firstOfMonth.getDate() - firstOfMonth.getDay() + weekOffset * 7);

  const hours = [];
  for (let h = WEEK_START_H; h <= WEEK_END_H; h++) {
    hours.push(h);
  }

  let html = `<div class="cal-grid"><div class="week-grid">
    <div class="week-time-col">
      <div style="height:48px;border-bottom:1px solid var(--border)"></div>`;
  hours.forEach(h => {
    html += `<div class="week-time-slot">${h}:00</div>`;
  });
  html += `</div><div class="week-days">`;

  for (let d = 0; d < 7; d++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + d);
    const dateStr = toDateStr(date);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isFer = isFeriado(dateStr, feriados);
    const isSpecial = isWeekend || isFer;
    const isToday = toDateStr(date) === toDateStr(today);

    const dayAusencias = ausencias.filter(a => dateInRange(dateStr, a.data_inicio, a.data_fim));
    const dayEventos   = eventos.filter(e => dateInRange(dateStr, e.data_inicio, e.data_fim || e.data_inicio));
    const dayEscala    = escala_fds.filter(e => String(e.data).substring(0, 10) === dateStr);
    const absentNames  = dayAusencias.map(a => a.nome);

    let workers = [];
    if (!isSpecial) {
      workers = funcionarios.filter(f => !absentNames.includes(f.nome));
    } else {
      dayEscala.forEach(e => {
        const f = funcionarios.find(fn => fn.id === e.funcionario_id || fn.nome === e.funcionario_nome);
        if (f) workers.push({ ...f, reduced: true });
      });
    }

    html += `<div class="week-day-col">
      <div class="week-day-header${isToday ? ' today' : ''}">
        <div class="wd-name">${DAYS_SHORT[dow]}</div>
        <div class="wd-num">${date.getDate()}</div>
      </div>
      <div class="week-slots">`;

    // Hour grid lines
    hours.forEach((_, i) => {
      html += `<div class="week-slot-line" style="top:${i * HOUR_PX}px"></div>`;
    });

    // Worker blocks
    workers.forEach((f, idx) => {
      const startStr = f.reduced ? (f.horario_reduzido_inicio || f.horario_normal_inicio) : f.horario_normal_inicio;
      const endStr   = f.reduced ? (f.horario_reduzido_fim   || f.horario_normal_fim)   : f.horario_normal_fim;
      const startMin = timeToMinutes(startStr);
      const endMin   = timeToMinutes(endStr);
      if (startMin === null || endMin === null) return;
      const top    = (startMin - WEEK_START_H * 60) * (HOUR_PX / 60);
      const height = (endMin - startMin) * (HOUR_PX / 60);
      if (top < 0 || height <= 0) return;

      const canal = f.canal || '';
      const cls = 'week-event ' + (CANAL_CLASS[canal] ? 'chip-' + CANAL_CLASS[canal] : 'chip-ausencia');
      const colWidth = 100 / Math.max(workers.length, 1);
      const left = idx * colWidth;

      html += `<div class="${cls}" style="top:${top}px;height:${height}px;left:${left}%;width:${colWidth}%;right:auto" title="${f.nome} — ${startStr} às ${endStr}">
        <div style="font-weight:600">${f.nome}</div>
        <div style="opacity:.8">${startStr}–${endStr}</div>
      </div>`;
    });

    // Absence markers
    dayAusencias.forEach(a => {
      html += `<div class="week-event chip-ausencia" style="top:0;height:100%;opacity:.4;border-radius:0" title="${a.nome} — ${a.tipo_solicitacao}"></div>`;
    });

    // Events
    dayEventos.forEach(ev => {
      const startMin = timeToMinutes(ev.hora_inicio) || WEEK_START_H * 60;
      const endMin   = timeToMinutes(ev.hora_fim)   || (WEEK_START_H + 1) * 60;
      const top      = (startMin - WEEK_START_H * 60) * (HOUR_PX / 60);
      const height   = Math.max((endMin - startMin) * (HOUR_PX / 60), 24);
      html += `<div class="week-event chip-evento" style="top:${top}px;height:${height}px" title="${ev.nome}">${ev.nome}</div>`;
    });

    html += `</div></div>`;
  }

  html += `</div></div></div>`;
  container.innerHTML = html;
}

// ── Day View ─────────────────────────────────────────────────
function renderDay(container, calData, viewMode, dayOffset) {
  const { funcionarios, escala_fds, feriados, eventos, ausencias, mes, ano } = calData;
  const today = new Date();
  const base  = new Date(ano, mes - 1, 1);
  base.setDate(base.getDate() + dayOffset);

  const dateStr  = toDateStr(base);
  const dow      = base.getDay();
  const isWeekend = dow === 0 || dow === 6;
  const isFer    = isFeriado(dateStr, feriados);
  const isSpecial = isWeekend || isFer;

  const dayAusencias = ausencias.filter(a => dateInRange(dateStr, a.data_inicio, a.data_fim));
  const dayEventos   = eventos.filter(e => dateInRange(dateStr, e.data_inicio, e.data_fim || e.data_inicio));
  const dayEscala    = escala_fds.filter(e => String(e.data).substring(0, 10) === dateStr);
  const absentNames  = dayAusencias.map(a => a.nome);

  let workers = [];
  if (!isSpecial) {
    workers = funcionarios.filter(f => !absentNames.includes(f.nome));
  } else {
    dayEscala.forEach(e => {
      const f = funcionarios.find(fn => fn.id === e.funcionario_id || fn.nome === e.funcionario_nome);
      if (f) workers.push({ ...f, reduced: true });
    });
  }

  const isToday = dateStr === toDateStr(today);
  const hours = [];
  for (let h = WEEK_START_H; h <= WEEK_END_H; h++) hours.push(h);

  let html = `<div class="cal-grid"><div class="week-grid">
    <div class="week-time-col">
      <div style="height:72px;border-bottom:1px solid var(--border)"></div>`;
  hours.forEach(h => { html += `<div class="week-time-slot">${h}:00</div>`; });
  html += `</div><div class="week-days" style="flex:1">
    <div class="week-day-col" style="flex:1">
      <div class="week-day-header${isToday ? ' today' : ''}" style="padding:12px">
        <div class="wd-name">${DAYS_SHORT[dow]}, ${base.getDate()} de ${MONTHS_FULL[base.getMonth()]}</div>
        <div class="wd-num" style="font-size:28px">${base.getDate()}</div>
      </div>
      <div class="week-slots">`;

  hours.forEach((_, i) => { html += `<div class="week-slot-line" style="top:${i * HOUR_PX}px"></div>`; });

  workers.forEach((f, idx) => {
    const startStr = f.reduced ? (f.horario_reduzido_inicio || f.horario_normal_inicio) : f.horario_normal_inicio;
    const endStr   = f.reduced ? (f.horario_reduzido_fim   || f.horario_normal_fim)   : f.horario_normal_fim;
    const startMin = timeToMinutes(startStr);
    const endMin   = timeToMinutes(endStr);
    if (startMin === null || endMin === null) return;
    const top    = (startMin - WEEK_START_H * 60) * (HOUR_PX / 60);
    const height = (endMin - startMin) * (HOUR_PX / 60);
    if (top < 0 || height <= 0) return;
    const canal = f.canal || '';
    const cls = 'week-event ' + (CANAL_CLASS[canal] ? 'chip-' + CANAL_CLASS[canal] : 'chip-ausencia');
    const colWidth = 100 / Math.max(workers.length, 1);
    html += `<div class="${cls}" style="top:${top}px;height:${height}px;left:${idx * colWidth}%;width:${colWidth}%;right:auto">
      <div style="font-weight:600">${f.nome}</div>
      <div style="opacity:.8">${startStr}–${endStr}</div>
      <div style="opacity:.7;font-size:10px">${canal}</div>
    </div>`;
  });

  dayAusencias.forEach(a => {
    html += `<div class="week-event chip-ausencia" style="top:0;height:100%;opacity:.35;border-radius:0" title="${a.nome} — ${a.tipo_solicitacao}"></div>`;
  });

  dayEventos.forEach(ev => {
    const startMin = timeToMinutes(ev.hora_inicio) || WEEK_START_H * 60;
    const endMin   = timeToMinutes(ev.hora_fim)   || (WEEK_START_H + 1) * 60;
    const top      = (startMin - WEEK_START_H * 60) * (HOUR_PX / 60);
    const height   = Math.max((endMin - startMin) * (HOUR_PX / 60), 24);
    html += `<div class="week-event chip-evento" style="top:${top}px;height:${height}px">${ev.nome}</div>`;
  });

  html += `</div></div></div></div></div>`;
  container.innerHTML = html;
}
