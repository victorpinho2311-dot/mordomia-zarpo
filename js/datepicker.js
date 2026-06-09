// ── DatePicker ────────────────────────────────────────────────
class DatePicker {
  constructor(wrap) {
    this.wrap = wrap;
    this.input = wrap.querySelector('.dp-input');
    this.hidden = wrap.querySelector('.dp-hidden');
    this.btn   = wrap.querySelector('.dp-btn');
    this.popup = null;
    this.curMonth = new Date().getMonth();
    this.curYear  = new Date().getFullYear();
    if (this.hidden.value) this._syncDisplay();
    this._bind();
  }

  _bind() {
    this.input.addEventListener('input', () => this._onInput());
    this.input.addEventListener('keydown', (e) => this._onKey(e));
    this.btn.addEventListener('mousedown', (e) => { e.preventDefault(); this._toggle(); });
    document.addEventListener('mousedown', (e) => {
      if (!this.wrap.contains(e.target)) this._close();
    });
  }

  _onInput() {
    const prev = this.input.value;
    let d = prev.replace(/\D/g, '').substring(0, 8);

    // Clamp day and month
    if (d.length >= 2 && parseInt(d.substring(0,2)) > 31) d = '31' + d.substring(2);
    if (d.length >= 4 && parseInt(d.substring(2,4)) > 12) d = d.substring(0,2) + '12' + d.substring(4);

    let fmt = d.substring(0, 2);
    if (d.length > 2) fmt += '/' + d.substring(2, 4);
    if (d.length > 4) fmt += '/' + d.substring(4, 8);
    this.input.value = fmt;

    if (d.length === 8) {
      const dd = d.substring(0,2), mm = d.substring(2,4), yyyy = d.substring(4,8);
      const valid = parseInt(dd) >= 1 && parseInt(mm) >= 1 && parseInt(yyyy) >= 1900;
      this.hidden.value = valid ? `${yyyy}-${mm}-${dd}` : '';
      if (valid) { this.curMonth = parseInt(mm) - 1; this.curYear = parseInt(yyyy); }
    } else {
      this.hidden.value = '';
    }
  }

  _onKey(e) {
    if (['ArrowLeft','ArrowRight','Tab','Backspace','Delete','Home','End'].includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  }

  _syncDisplay() {
    const v = this.hidden.value;
    if (!v) { this.input.value = ''; return; }
    const p = v.substring(0,10).split('-');
    if (p.length === 3) {
      this.input.value = `${p[2]}/${p[1]}/${p[0]}`;
      this.curMonth = parseInt(p[1]) - 1;
      this.curYear  = parseInt(p[0]);
    }
  }

  getValue() { return this.hidden.value; }

  setValue(iso) {
    this.hidden.value = iso ? iso.substring(0,10) : '';
    this._syncDisplay();
  }

  _toggle() { this.popup ? this._close() : this._open(); }

  _open() {
    if (this.hidden.value) {
      const p = this.hidden.value.split('-');
      this.curYear = parseInt(p[0]); this.curMonth = parseInt(p[1]) - 1;
    }
    this.popup = document.createElement('div');
    this.popup.className = 'dp-popup';
    this.wrap.appendChild(this.popup);
    this._render();
  }

  _close() { if (this.popup) { this.popup.remove(); this.popup = null; } }

  _render() {
    const MN = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const DL = ['D','S','T','Q','Q','S','S'];
    const fdow = new Date(this.curYear, this.curMonth, 1).getDay();
    const dim  = new Date(this.curYear, this.curMonth + 1, 0).getDate();
    const today = new Date().toISOString().substring(0,10);
    const sel   = this.hidden.value;

    let html = `<div class="dp-header">
      <button class="dp-nav-btn" data-dir="-1">‹</button>
      <span>${MN[this.curMonth]} ${this.curYear}</span>
      <button class="dp-nav-btn" data-dir="1">›</button>
    </div><div class="dp-cal">
      ${DL.map(d=>`<div class="dp-dow">${d}</div>`).join('')}
      ${'<div class="dp-day dp-empty"></div>'.repeat(fdow)}`;

    for (let d = 1; d <= dim; d++) {
      const ds = `${this.curYear}-${String(this.curMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      let cls = 'dp-day';
      if (ds === today) cls += ' dp-today';
      if (ds === sel)   cls += ' dp-sel';
      html += `<div class="${cls}" data-date="${ds}">${d}</div>`;
    }
    html += `</div>`;
    this.popup.innerHTML = html;

    this.popup.querySelectorAll('.dp-nav-btn').forEach(btn => {
      btn.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation();
        this.curMonth += parseInt(btn.dataset.dir);
        if (this.curMonth > 11) { this.curMonth = 0; this.curYear++; }
        if (this.curMonth < 0)  { this.curMonth = 11; this.curYear--; }
        this._render();
      });
    });

    this.popup.querySelectorAll('.dp-day[data-date]').forEach(el => {
      el.addEventListener('mousedown', e => {
        e.preventDefault();
        this.setValue(el.dataset.date);
        this._close();
      });
    });
  }
}

// ── TimeMask ──────────────────────────────────────────────────
class TimeMask {
  constructor(wrap) {
    this.wrap  = wrap;
    this.input = wrap.querySelector('.tm-input');
    this._bind();
  }

  _bind() {
    this.input.addEventListener('input', () => this._onInput());
    this.input.addEventListener('keydown', (e) => this._onKey(e));
  }

  _onInput() {
    let d = this.input.value.replace(/\D/g, '').substring(0, 4);
    let hh = d.substring(0, 2);
    if (hh.length === 2 && parseInt(hh) > 23) hh = '23';
    let fmt = hh;
    if (d.length > 2) {
      let mm = d.substring(2, 4);
      if (mm.length === 2 && parseInt(mm) > 59) mm = '59';
      fmt += ':' + mm;
    }
    this.input.value = fmt;
  }

  _onKey(e) {
    if (['ArrowLeft','ArrowRight','Tab','Backspace','Delete'].includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  }

  getValue() { return this.input.value; }
  setValue(v) { this.input.value = v || ''; }
}

// ── Init helpers ──────────────────────────────────────────────
function initPickers(root) {
  root = root || document;
  root.querySelectorAll('.dp-wrap:not([data-dp])').forEach(el => {
    el.setAttribute('data-dp', '1');
    el._dp = new DatePicker(el);
  });
  root.querySelectorAll('.tm-wrap:not([data-tm])').forEach(el => {
    el.setAttribute('data-tm', '1');
    el._tm = new TimeMask(el);
  });
}

function dpGet(id) {
  const el = document.getElementById(id);
  return el && el._dp ? el._dp.getValue() : '';
}
function dpSet(id, v) {
  const el = document.getElementById(id);
  if (el && el._dp) el._dp.setValue(v);
}
function tmGet(id) {
  const el = document.getElementById(id);
  return el && el._tm ? el._tm.getValue() : '';
}
function tmSet(id, v) {
  const el = document.getElementById(id);
  if (el && el._tm) el._tm.setValue(v);
}

// HTML builder helpers
function dpHtml(id, opts) {
  opts = opts || {};
  return `<div class="dp-wrap" id="${id}">
    <input type="text" class="form-control dp-input" placeholder="${opts.placeholder || 'DD/MM/AAAA'}" maxlength="10" autocomplete="off">
    <input type="hidden" class="dp-hidden" ${opts.value ? `value="${opts.value}"` : ''}>
    <button type="button" class="dp-btn" tabindex="-1">📅</button>
  </div>`;
}

function tmHtml(id) {
  return `<div class="tm-wrap" id="${id}">
    <input type="text" class="form-control tm-input" placeholder="HH:MM" maxlength="5" autocomplete="off">
  </div>`;
}
