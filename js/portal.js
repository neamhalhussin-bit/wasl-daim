/* وصل دائم — client portal (separate from staff accounts) */
'use strict';

const BK_ST = {confirmed:{ar:'مؤكد', en:'Confirmed', cls:'ok'}, pending:{ar:'بانتظار الموافقة', en:'Awaiting approval', cls:'warn'}, cancelled:{ar:'ملغي', en:'Cancelled', cls:'plain'}, rejected:{ar:'مرفوض', en:'Declined', cls:'bad'}};
let portalMode = 'in';
function renderPortal() {
  const c = S.customers.find(x => x.id === S.portal);
  $('#app').innerHTML = headerHTML() + `<main>${c ? portalHome(c) : portalAuth()}</main>` + footerHTML();
  bindHeader();
  if (!c) bindAuth(); else bindPortal(c);
  lockUI($('main'));
}
function portalAuth() {
  const up = portalMode === 'up';
  return `<section class="portal-head"><div class="wrap"><h1>${esc(t('portal'))}</h1><p>${esc(t('portal_sub'))}</p></div></section>
  <section class="block tight"><div class="wrap" style="max-width:520px"><div class="card" style="display:grid;gap:16px">
    <div class="seg" role="tablist" style="justify-self:start"><button class="${up ? '' : 'on'}" data-act="pmode" data-m="in" role="tab">${esc(t('sign_in'))}</button><button class="${up ? 'on' : ''}" data-act="pmode" data-m="up" role="tab">${esc(t('sign_up'))}</button></div>
    <form class="form" id="pf" novalidate>
      ${up ? `<div class="field"><label for="pf-n">${esc(t('full_name'))}</label><input class="input" id="pf-n" autocomplete="name" required></div>
      <div class="field"><label for="pf-p">${esc(t('phone'))}</label><input class="input" id="pf-p" type="tel" dir="ltr" placeholder="05XXXXXXXX" autocomplete="tel"></div>` : ''}
      <div class="field"><label for="pf-e">${esc(t('email'))}</label><input class="input" id="pf-e" type="email" dir="ltr" autocomplete="email" required></div>
      <div class="field"><label for="pf-w">${esc(t('password'))}</label><input class="input" id="pf-w" type="password" dir="ltr" autocomplete="${up ? 'new-password' : 'current-password'}" required>${up ? `<span class="hint">${esc(t('weak_pw'))}</span>` : ''}</div>
      ${up ? `<label class="check"><input type="checkbox" id="pf-c"><span>${esc(t('consent'))}</span></label>` : ''}
      <div class="notice bad hidden" id="pf-err">${ic('alert')}<div id="pf-err-t"></div></div>
      <button class="btn btn-gold" type="submit">${esc(t(up ? 'sign_up' : 'sign_in'))}</button>
      ${up ? '' : `<a href="#" data-act="p-forgot" class="muted" style="font-size:14px">${esc(t('forgot'))}</a>`}
    </form>
    ${VIEW_ONLY ? `<button class="btn btn-dark" data-act="p-demo">${ic('user')} ${esc(t('demo_login'))}</button>` : ''}
    <div class="notice">${ic('info')}<div>${esc(t('client_demo'))}<br><span class="muted">${esc(t('admin_blocked'))}</span></div></div>
  </div></div></section>`;
}
function bindAuth() {
  $('#pf').onsubmit = (e) => {
    e.preventDefault(); const up = portalMode === 'up';
    const g = (i) => ($('#' + i)?.value || '').trim(); const err = (m) => { $('#pf-err-t').textContent = m; $('#pf-err').classList.remove('hidden'); };
    const email = g('pf-e').toLowerCase(), pw = g('pf-w');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err(t('invalid_email'));
    if (!up) {
      if (S.users.some(u => u.email === email)) return err(isEn() ? 'Staff accounts sign in from the dashboard, not the client portal.' : 'حسابات الموظفين تدخل من لوحة التحكم وليس من بوابة العملاء.');
      const c = S.customers.find(x => x.email === email && x.pw === pw); if (!c) return err(t('bad_login'));
      S.portal = c.id; save(); renderPortal(); return;
    }
    if (VIEW_ONLY) return err(t('view_signup'));
    if (!g('pf-n')) return err(t('required'));
    if (S.customers.some(x => x.email === email) || S.users.some(u => u.email === email)) return err(t('exists'));
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return err(t('weak_pw'));
    if (!$('#pf-c').checked) return err(t('consent_required'));
    const c = {id:uid('cu'), name:g('pf-n'), email, phone:g('pf-p'), pw, files:[], notifs:[{at:new Date().toISOString(), text:isEn() ? 'Welcome to the Wasl Daim client portal.' : 'مرحبًا بك في بوابة عملاء وصل دائم.'}]};
    S.customers.push(c); S.portal = c.id; save(); renderPortal();
  };
}
ACT['pmode'] = (el) => { portalMode = el.dataset.m; renderPortal(); };
ACT['p-forgot'] = () => toast(t('reset_sent'));
ACT['p-demo'] = () => { S.portal = 'cu1'; UI.portalTab = 'requests'; save(); renderPortal(); };
ACT['p-out'] = () => { S.portal = null; save(); renderPortal(); };
ACT['p-tab'] = (el) => { UI.portalTab = el.dataset.k; renderPortal(); };
function portalHome(c) {
  const lang = curLang(); const reqs = S.requests.filter(r => r.email === c.email); const bks = S.bookings.filter(b => b.email === c.email);
  const tabs = [['requests', t('my_requests'), reqs.length], ['bookings', t('my_bookings'), bks.length], ['files', t('my_files'), c.files.length], ['notifs', t('my_notifs'), c.notifs.length], ['invoices', t('invoices')], ['profile', t('my_profile')]];
  const tab = UI.portalTab; let body;
  if (tab === 'bookings') body = bks.length ? `<div class="panel">${table([t('space'), t('date'), t('time'), t('status'), ''], bks.map(b => { const st = BK_ST[b.status]; const cancellable = ['pending', 'confirmed'].includes(b.status) && new Date(b.start) - new Date() > 864e5;
      return `<tr><td>${esc(L(resById(b.resourceId)?.name))}</td><td>${fmtDate(b.start)}</td><td class="num">${fmtTime(b.start)} – ${fmtTime(b.end)}</td><td><span class="chip ${st.cls}">${st[lang]}</span></td><td>${cancellable ? `<button class="btn btn-ghost btn-xs" data-act="p-cancel" data-id="${b.id}">${esc(t('cancel_booking'))}</button>` : ''}</td></tr>`; }))}</div><p class="muted" style="font-size:13px;margin-top:8px">${esc(t('cancel_policy'))}</p>` : emptyP('booking');
  else if (tab === 'files') body = `<div class="panel"><div class="panel-body"><label class="btn btn-gold btn-sm">${ic('upload')} ${esc(t('upload'))}<input type="file" id="p-file" hidden accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg"></label>
      <p class="muted" style="font-size:13px;margin-top:8px">${isEn() ? 'Files are stored privately and only the staff handling your request can open them.' : 'تُحفظ الملفات بشكل خاص، ولا يطّلع عليها إلا الموظف المسؤول عن طلبك.'}</p></div>
      ${c.files.map(f => `<div class="list-item">${ic('doc')}<div class="grow"><b>${esc(f.name)}</b><span>${fmtDate(f.at, true)}</span></div><span class="chip plain">${ic('lock')}</span></div>`).join('') || `<p class="empty">${esc(t('no_items'))}</p>`}</div>`;
  else if (tab === 'notifs') body = `<div class="panel">${c.notifs.map(n => `<div class="list-item">${ic('bell')}<div class="grow"><b style="font-weight:500">${esc(n.text)}</b><span>${fmtDate(n.at, true)}</span></div></div>`).join('') || `<p class="empty">${esc(t('no_items'))}</p>`}</div>`;
  else if (tab === 'invoices') body = `<div class="notice">${ic('info')}<div>${esc(t('invoices_soon'))}</div></div>`;
  else if (tab === 'profile') body = `<div class="card" style="max-width:560px"><form class="form" id="pp">
      <div class="field"><label for="pp-n">${esc(t('full_name'))}</label><input class="input" id="pp-n" value="${esc(c.name)}"></div>
      <div class="field"><label for="pp-p">${esc(t('phone'))}</label><input class="input" id="pp-p" value="${esc(c.phone)}" dir="ltr"></div>
      <div class="field"><label for="pp-e">${esc(t('email'))}</label><input class="input" id="pp-e" value="${esc(c.email)}" dir="ltr" disabled></div>
      <div class="field"><label for="pp-w">${esc(t('password'))} <span class="muted" style="font-weight:400">(${esc(t('optional'))})</span></label><input class="input" id="pp-w" type="password" dir="ltr" autocomplete="new-password"><span class="hint">${esc(t('weak_pw'))}</span></div>
      <button class="btn btn-gold" type="submit" style="justify-self:start">${esc(t('save'))}</button></form></div>`;
  else body = reqs.length ? `<div class="panel">${table([t('ref'), t('type'), t('date'), t('status')], reqs.map(r => `<tr><td class="ltr" style="text-align:start"><b>${r.id}</b></td><td>${esc(REQ_TYPES[r.type][lang])}</td><td>${fmtDate(r.createdAt)}</td><td><span class="chip ${REQ_STATUS[r.status].cls}">${REQ_STATUS[r.status][lang]}</span>${r.data.waitlist ? ` <span class="chip warn">${esc(t('waitlist'))}</span>` : ''}</td></tr>`))}</div>` : emptyP('incubator');
  return `<section class="portal-head"><div class="wrap" style="display:flex;justify-content:space-between;align-items:end;gap:16px;flex-wrap:wrap"><div><p>${esc(t('portal'))}</p><h1>${esc(c.name)}</h1></div>
    <div class="toolbar"><button class="btn btn-gold btn-sm" data-act="apply">${esc(t('apply'))}</button><button class="btn btn-ghost-light btn-sm" data-act="p-out">${ic('logout')} ${esc(t('sign_out'))}</button></div></div></section>
  <section class="block tight"><div class="wrap" style="display:grid;gap:18px"><div class="tabs" role="tablist">${tabs.map(([k, l, n]) => `<button role="tab" class="${tab === k ? 'on' : ''}" aria-selected="${tab === k}" data-act="p-tab" data-k="${k}">${esc(l)}${n ? ` <span class="chip plain num">${n}</span>` : ''}</button>`).join('')}</div>${body}</div></section>`;
}
const emptyP = (form) => `<div class="card empty"><p style="margin-bottom:14px">${esc(t('no_items'))}</p><button class="btn btn-dark btn-sm" data-act="open-form" data-form="${form}">${esc(t('apply'))}</button></div>`;
function bindPortal(c) {
  const f = $('#p-file'); if (f) f.onchange = () => { const x = f.files[0]; if (!x) return; if (x.size > 10 * 1024 * 1024) return toast(t('file_hint'), true); c.files.unshift({name:x.name, at:new Date().toISOString()}); audit('file', 'بوابة العملاء — ' + c.name, null, {الملف:x.name}, 'system'); save(); renderPortal(); toast(t('saved')); };
  const p = $('#pp'); if (p) p.onsubmit = (e) => { e.preventDefault(); const w = $('#pp-w').value; if (w && (w.length < 8 || !/[A-Za-z]/.test(w) || !/\d/.test(w))) return toast(t('weak_pw'), true); c.name = $('#pp-n').value.trim() || c.name; c.phone = $('#pp-p').value.trim(); if (w) c.pw = w; save(); renderPortal(); toast(t('saved')); };
}
ACT['p-cancel'] = (el) => {
  const b = S.bookings.find(x => x.id === el.dataset.id);
  confirmBox(isEn() ? 'Cancel this booking?' : 'إلغاء هذا الحجز؟', () => {
    b.status = 'cancelled'; if (b.reqId) { const r = S.requests.find(x => x.id === b.reqId); if (r) { r.status = 'done'; r.history.push({at:new Date().toISOString(), by:'system', text:'ألغى العميل الحجز من بوابة العملاء'}); } }
    audit('booking', `${b.name} — ${L(resById(b.resourceId)?.name, 'ar')}`, {الحالة:'قائم'}, {الحالة:'ألغاه العميل'}, 'system');
    S.users.filter(u => u.status === 'active' && ['bookings', 'ops'].includes(u.roleId)).forEach(u => notify(u.id, 'ألغى عميل حجزه', `${b.name} — ${fmtDate(b.start, true)}`, 'bookings'));
    save(); renderPortal(); toast(isEn() ? 'Booking cancelled' : 'أُلغي الحجز');
  }, isEn() ? 'Cancel booking' : 'إلغاء الحجز');
};
