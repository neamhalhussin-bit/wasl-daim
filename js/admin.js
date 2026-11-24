/* وصل دائم — admin dashboard (Arabic, RTL) */
'use strict';

const DEMO_PW = 'Demo@2026', OTP = '246810';
const NAV = [
  {k:'mine', label:'مهامي اليوم', icon:'target', always:true},
  {k:'dashboard', label:'لوحة المؤشرات', icon:'grid', mod:'dashboard'},
  {grp:'المبيعات'},
  {k:'requests', label:'الطلبات', icon:'inbox', mod:'requests', count:() => visibleRequests().filter(r => r.status === 'new').length},
  {k:'crm', label:'العملاء المحتملون', icon:'users', mod:'crm', count:() => visibleLeads().filter(c => leadLate(c)).length, hot:true},
  {k:'deals', label:'الصفقات وعروض الأسعار', icon:'brief', mod:'deals'},
  {k:'bookings', label:'حجوزات القاعات', icon:'calendar', mod:'bookings', count:() => S.bookings.filter(b => b.status === 'pending' && bookingVisible(b)).length},
  {grp:'الإدارة'},
  {k:'approvals', label:'الاعتمادات', icon:'stamp', mod:'deals', act:'approve', count:() => S.deals.filter(d => d.status === 'pending').length + S.companies.filter(c => c.pendingChange).length},
  {k:'companies', label:'المنشآت', icon:'office', mod:'companies', count:() => S.companies.filter(c => c.status === 'pending').length},
  {k:'contracts', label:'العقود', icon:'contract', mod:'contracts'},
  {k:'spaces', label:'المساحات والأسعار', icon:'tag', mod:'pricing'},
  {grp:'المحاسبة'},
  {k:'billing', label:'الفواتير والمدفوعات', icon:'coins', mod:'billing', count:() => S.payments.filter(p => p.status === 'review').length},
  {grp:'الموقع'},
  {k:'content', label:'محتوى الموقع', icon:'layout', mod:'content'},
  {k:'events', label:'الدورات والفعاليات', icon:'ticket', mod:'events'},
  {k:'pricing', label:'باقات الموقع', icon:'list', mod:'pricing'},
  {grp:'المتابعة'},
  {k:'reports', label:'التقارير', icon:'chart', mod:'reports'},
  {k:'notifs', label:'الإشعارات', icon:'bell', always:true, count:() => myNotifs().filter(n => !n.read).length},
  {k:'audit', label:'سجل العمليات', icon:'list', mod:'audit'},
  {grp:'النظام'},
  {k:'users', label:'الفريق والصلاحيات', icon:'key', mod:'users'},
  {k:'rules', label:'قواعد العمل', icon:'target', mod:'settings'},
  {k:'settings', label:'الإعدادات والأمان', icon:'gear', mod:'settings'}
];
const allowed = (n) => n.always || can(n.mod, n.act || 'view');

/* ---------- small render helpers ---------- */
const av = (name) => `<span class="av" aria-hidden="true">${esc(initials(name))}</span>`;
const whoTag = (id) => id ? `<span class="who">${av(userName(id))}<span>${esc(userName(id))}</span></span>` : '<span class="chip plain">غير مُسند</span>';
const stChip = (s) => `<span class="chip ${REQ_STATUS[s]?.cls || 'plain'}">${esc(REQ_STATUS[s]?.ar || s)}</span>`;
const panel = (title, body, {sub = '', actions = '', pad = true, id = ''} = {}) => `<section class="panel" ${id ? `id="${id}"` : ''}><div class="panel-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${actions ? `<div class="toolbar">${actions}</div>` : ''}</div>${pad ? `<div class="panel-body">${body}</div>` : body}</section>`;
const table = (heads, rows, empty = 'لا توجد بيانات') => `<div class="tbl-wrap"><table class="tbl"><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${heads.length}" class="empty">${empty}</td></tr>`}</tbody></table></div>`;
const options = (pairs, val) => pairs.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val ?? '') ? 'selected' : ''}>${esc(l)}</option>`).join('');
const fld = (id, label, ctrl, hint = '') => `<div class="field"><label for="${id}">${label}</label>${ctrl}${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
const inp = (id, val = '', type = 'text', extra = '') => `<input class="input" id="${id}" type="${type}" value="${esc(val)}" ${extra}>`;
const lockNote = (txt) => `<div class="notice warn">${ic('lock')}<div>${txt}</div></div>`;
const staffOpts = () => S.users.filter(u => u.status === 'active' && u.roleId !== 'owner').map(u => [u.id, `${u.name} — ${roleById(u.roleId)?.name}`]);
const customerData = () => can('requests', 'customers') || can('crm', 'customers');
const showPhone = (p) => customerData() ? p : maskPhone(p);
const showEmail = (e) => customerData() ? e : maskEmail(e);
const monthKey = (iso) => (iso || '').slice(0, 7);
const thisMonth = () => today().slice(0, 7);

/* ---------- login: the unified sign-in page lives in pages.js (#login) ---------- */
function renderLogin() { UI.loginFor = 'admin'; if (location.hash !== '#login') location.replace('#login'); else renderPage('login'); }
ACT['logout'] = () => { audit('logout', 'لوحة التحكم'); S.session = null; save(); toast('سُجّل خروجك'); location.hash = 'login'; };
ACT['nav'] = (el) => { UI.admin = el.dataset.k; $('#side')?.classList.remove('open'); renderAdmin(); window.scrollTo(0, 0); };
ACT['side'] = () => $('#side').classList.toggle('open');

/* ---------- shell ---------- */
function renderAdmin() {
  applyTheme();
  const u = me();
  if (!u || u.status !== 'active' || u.locked) { S.session = null; renderLogin(); return; }
  const nav = NAV.filter(n => n.grp || allowed(n));
  if (!nav.find(n => n.k === UI.admin)) UI.admin = nav.find(n => n.k && n.k !== 'mine')?.k || 'mine';
  const cur = NAV.find(n => n.k === UI.admin);
  const navHTML = nav.map((n, i) => n.grp ? (nav[i + 1] && !nav[i + 1].grp ? `<div class="grp">${n.grp}</div>` : '') :
    `<a class="nl ${n.k === UI.admin ? 'on' : ''}" href="#admin" data-act="nav" data-k="${n.k}" ${n.k === UI.admin ? 'aria-current="page"' : ''}>${ic(n.icon)}<span>${n.label}</span>${n.count && n.count() ? `<span class="cnt ${n.hot ? 'hot' : ''}">${n.count()}</span>` : ''}</a>`).join('');
  const unread = myNotifs().filter(n => !n.read).length;
  const y = scrollY;
  $('#app').innerHTML = `<div class="admin"><aside class="side" id="side" aria-label="القائمة الجانبية">
    <a class="brand" href="#" title="عرض الموقع"><span class="brand-mark"></span><span class="brand-name">وصل دائم<small>لوحة التحكم</small></span></a>${navHTML}
    <div class="me">${av(u.name)}<div style="min-width:0"><b>${esc(u.name)}</b><span>${esc(roleById(u.roleId)?.name)}</span></div></div></aside>
  <div class="main"><div class="topbar">
    <button class="icon-btn side-toggle" data-act="side" aria-label="القائمة">${ic('menu')}</button><h1>${cur?.label || ''}</h1><span class="sp"></span>
    <label class="switch"><span>تبديل الحساب التجريبي</span><select id="acct-switch" aria-label="تبديل الحساب التجريبي">${options(S.users.filter(x => x.status === 'active' && !x.locked).map(x => [x.id, `${x.name} — ${roleById(x.roleId)?.name}`]), u.id)}</select></label>
    <button class="icon-btn bell" data-act="nav" data-k="notifs" aria-label="الإشعارات (${unread})">${ic('bell')}${unread ? `<span class="dot">${unread}</span>` : ''}</button>
    <button class="icon-btn" data-act="toggle-theme-admin" aria-label="الوضع الليلي/النهاري">${ic(currentDark() ? 'sun' : 'moon')}</button>
    <a class="icon-btn" href="#" aria-label="عرض الموقع" title="عرض الموقع">${ic('external')}</a>
    <button class="icon-btn" data-act="logout" aria-label="تسجيل الخروج" title="تسجيل الخروج">${ic('logout')}</button></div>
    <div class="content" id="acontent">${VIEW_ONLY ? `<div class="notice warn">${ic('eye')}<div><b>نسخة عرض فقط.</b> تنقّل بين الأقسام وبدّل الحسابات من أعلى الصفحة لترى صلاحيات كل دور. الأزرار التي تغيّر البيانات معطّلة.</div></div>` : ''}${(VIEWS[UI.admin] || VIEWS.mine)()}</div></div></div>`;
  $('#acct-switch').onchange = (e) => { const nu = userById(e.target.value); audit('logout', 'لوحة التحكم'); finishLogin(nu, true); toast(`أنت الآن: ${nu.name} (${roleById(nu.roleId).name})`); };
  bindIdle();
  if (AFTER[UI.admin]) AFTER[UI.admin]();
  lockUI($('#app'));
  window.scrollTo(0, y);
}
ACT['toggle-theme-admin'] = () => { toggleTheme(); renderAdmin(); };
const AFTER = {};
const rerender = () => { save(); renderAdmin(); };

function tile(label, value, {icon = '', delta = '', up = true, locked = false} = {}) {
  return `<div class="tile ${locked ? 'locked' : ''}"><div class="l">${icon ? ic(icon) : ''}${label}</div><div class="v num">${value}</div>${delta ? `<div class="d ${up ? 'up' : 'down'}">${delta}</div>` : ''}${locked ? `<div class="lockmsg">${ic('lock')} بيانات مالية — تتطلب صلاحية</div>` : ''}</div>`;
}
function barsHTML(rows, fmt = (v) => v) {
  const max = Math.max(1, ...rows.map(r => r[1]));
  return `<div class="bars">${rows.map(([l, v, extra]) => `<div class="bar-row"><span>${esc(l)}</span><div class="track"><i style="width:${v / max * 100}%"></i></div><span class="val">${fmt(v)}${extra || ''}</span></div>`).join('')}</div>`;
}
function monthChart(key, label, fmt = money) {
  const cur = metrics(); const mNames = [];
  const data = S.history.map(h => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + h.m); return {l:d.toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', {month:'short'}), v:h[key]}; });
  const nowD = new Date(); data.push({l:nowD.toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', {month:'short'}) + ' (حتى الآن)', v:key === 'revenue' ? cur.revenue : key === 'bookings' ? cur.bookingsMonth : cur.newClients, now:true});
  const W = 640, H = 230, pl = 56, pb = 34, pt = 22, max = Math.max(...data.map(d => d.v)) * 1.15, bw = (W - pl - 10) / data.length;
  const ticks = [0, .25, .5, .75, 1].map(k => Math.round(max * k / (max > 1000 ? 1000 : 1)) * (max > 1000 ? 1000 : 1));
  const y = (v) => H - pb - (v / max) * (H - pb - pt);
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    ${ticks.map(tk => `<line x1="${pl}" x2="${W - 6}" y1="${y(tk)}" y2="${y(tk)}" stroke="var(--line)" stroke-dasharray="${tk ? '3 4' : ''}"/><text x="${pl - 8}" y="${y(tk) + 4}" text-anchor="end">${fmt(tk)}</text>`).join('')}
    ${data.map((d, i) => { const x = pl + i * bw + bw * .2, w = bw * .6; return `<rect x="${x}" y="${y(d.v)}" width="${w}" height="${H - pb - y(d.v)}" rx="6" fill="${d.now ? 'url(#gbar)' : 'var(--gold-soft)'}" stroke="${d.now ? 'none' : 'var(--gold)'}" stroke-opacity=".35"><title>${d.l}: ${fmt(d.v)}</title></rect>
      <text x="${x + w / 2}" y="${H - pb + 18}" text-anchor="middle">${d.l.replace(' (حتى الآن)', '')}</text>${d.now || i === data.length - 2 ? `<text x="${x + w / 2}" y="${y(d.v) - 7}" text-anchor="middle" style="fill:var(--ink);font-weight:600">${fmt(d.v)}</text>` : ''}`; }).join('')}
    <defs><linearGradient id="gbar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6C46C"/><stop offset="1" stop-color="#B98A2E"/></linearGradient></defs></svg></div>`;
}

/* ================= views ================= */
const VIEWS = {};

/* ---------- requests ---------- */
function visibleRequests() {
  const u = me(); if (!u) return [];
  return S.requests.filter(r => inScope(r, 'assignee', u));
}
VIEWS.requests = () => {
  const f = UI.reqFilter; const scoped = scopeAssigned();
  let list = visibleRequests();
  if (f.type) list = list.filter(r => r.type === f.type);
  if (f.status) list = list.filter(r => r.status === f.status);
  if (f.who) list = list.filter(r => (f.who === 'none' ? !r.assignee : r.assignee === f.who));
  if (f.q) { const q = f.q.toLowerCase(); list = list.filter(r => [r.id, r.name, r.phone, r.email].join(' ').toLowerCase().includes(q)); }
  const counts = Object.keys(REQ_STATUS).map(s => [s, visibleRequests().filter(r => r.status === s).length]);
  return `${scopeOf() !== 'all' ? `<div class="notice">${ic('info')}<div>${scopeOf() === 'branch' ? `تظهر لك طلبات ${esc(branchName(me().branch, 'ar'))} والطلبات غير المُسندة فيه وما أُسند إليك.` : 'تظهر لك الطلبات المسندة إليك فقط حسب صلاحيات دورك.'}</div></div>` : ''}
  <div class="toolbar">${counts.map(([s, n]) => `<button class="chip ${f.status === s ? '' : 'plain'}" style="border:0;cursor:pointer" data-act="req-status-filter" data-s="${s}">${REQ_STATUS[s].ar} <b class="num">${n}</b></button>`).join('')}</div>
  ${panel('الطلبات', `<div class="panel-body" style="padding-bottom:0"><div class="toolbar">
    <input class="input search" id="rq-q" placeholder="بحث بالرقم أو الاسم أو الجوال" value="${esc(f.q)}" aria-label="بحث">
    <select class="input" id="rq-type" aria-label="النوع"><option value="">كل الأنواع</option>${options(Object.entries(REQ_TYPES).map(([k, v]) => [k, v.ar]), f.type)}</select>
    ${scoped ? '' : `<select class="input" id="rq-who" aria-label="الموظف"><option value="">كل الموظفين</option><option value="none" ${f.who === 'none' ? 'selected' : ''}>غير مُسند</option>${options(staffOpts(), f.who)}</select>`}
    ${f.q || f.type || f.status || f.who ? `<button class="btn btn-ghost btn-sm" data-act="req-clear">مسح الفلاتر</button>` : ''}</div></div>
    <div style="padding-top:14px">${table(['الطلب', 'العميل', 'الحالة', 'المسؤول', 'المصدر', 'التاريخ'], list.map(r => `<tr class="click" data-act="open-req" data-id="${r.id}" tabindex="0">
      <td><b class="ltr">${r.id}</b><span class="sub">${esc(REQ_TYPES[r.type].ar)}${S.branches.length > 1 ? ' · ' + esc(branchName(r.branch, 'ar')) : ''}</span></td><td>${esc(r.name)}${r.companyId ? `<span class="sub">${esc(companyName(companyById(r.companyId), 'ar'))}</span>` : `<span class="sub ltr" style="text-align:start">${esc(showPhone(r.phone))}</span>`}</td>
      <td>${stChip(r.status)}${r.data.waitlist ? ' <span class="chip warn">انتظار</span>' : ''}</td><td>${whoTag(r.assignee)}</td><td>${esc(SOURCES[r.source]?.ar || '')}</td><td>${fmtDate(r.createdAt)}<span class="sub">${ago(r.createdAt)}</span></td></tr>`), 'لا توجد طلبات مطابقة')}</div>`,
    {pad:false, sub:`${list.length} طلبًا`, actions:`${can('requests', 'add') ? `<button class="btn btn-ghost btn-sm" data-act="admin-new-req">${ic('plus')} طلب يدوي</button>` : ''}
      <button class="btn btn-ghost btn-sm" data-act="req-export" ${can('requests', 'export') ? '' : 'disabled title="يتطلب صلاحية التصدير"'}>${ic('download')} تصدير Excel</button>`})}`;
};
AFTER.requests = () => {
  const f = UI.reqFilter; let tm;
  $('#rq-q').oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => { f.q = e.target.value; renderAdmin(); const q = $('#rq-q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 250); };
  $('#rq-type').onchange = (e) => { f.type = e.target.value; renderAdmin(); };
  if ($('#rq-who')) $('#rq-who').onchange = (e) => { f.who = e.target.value; renderAdmin(); };
};
ACT['req-status-filter'] = (el) => { UI.reqFilter.status = UI.reqFilter.status === el.dataset.s ? '' : el.dataset.s; renderAdmin(); };
ACT['req-clear'] = () => { UI.reqFilter = {q:'', type:'', status:'', who:''}; renderAdmin(); };
ACT['req-export'] = () => {
  const rows = [['رقم الطلب', 'النوع', 'الاسم', 'الجوال', 'البريد', 'الحالة', 'المسؤول', 'المصدر', 'التاريخ'],
    ...visibleRequests().map(r => [r.id, REQ_TYPES[r.type].ar, r.name, showPhone(r.phone), showEmail(r.email), REQ_STATUS[r.status].ar, userName(r.assignee), SOURCES[r.source]?.ar || '', fmtDate(r.createdAt)])];
  exportDialog('الطلبات', rows, 'requests');
};
ACT['admin-new-req'] = () => { if (guard('requests', 'add')) ACT['apply'](); };
function fieldLabel(type, k) { const f = FORMS[type]?.fields.find(x => x.k === k); return f ? f.ar : k; }
function fieldValue(type, k, v) {
  const f = FORMS[type]?.fields.find(x => x.k === k);
  if (k === 'contract') return v;
  if (k === 'interests' && Array.isArray(v)) return v.map(x => ({office:'مكتب مقفل', desk:'مقاعد مرنة', rooms:'قاعات اجتماعات', virtual:'مكتب افتراضي', programs:'برامج الحاضنة والمسرعة', foreign:'تأسيس مستثمر أجنبي'}[x] || x)).join('، ');
  if (k === 'months') return (DURATIONS.find(d => String(d[0]) === String(v)) || [, v + ' أشهر'])[1];
  if (Array.isArray(v)) return v.map(x => SECTORS[x]?.ar || x).join('، ');
  if (!f || f.type !== 'select') return v;
  if (Array.isArray(f.opts)) return (f.opts.find(o => o[0] === v) || [, v])[1];
  if (f.opts === 'sectors') return SECTORS[v]?.ar || v;
  if (f.opts === 'resources') return L(resById(v)?.name) || v;
  if (f.opts === 'branches') return branchName(v, 'ar');
  if (f.opts === 'kinds') return L(SPACE_KINDS[v], 'ar') || v;
  if (f.opts === 'durations') return (DURATIONS.find(d => String(d[0]) === String(v)) || [, v])[1];
  if (f.opts === 'events') return L(S.content.events.find(e => e.id === v)?.title) || v;
  if (f.opts === 'opportunities') return L(S.content.opportunities.find(o => o.id === v)?.name) || v;
  return v;
}
ACT['open-req'] = (el) => openRequest(el.dataset.id);
function openRequest(id) {
  const r = S.requests.find(x => x.id === id); if (!r) return;
  if (!inScope(r)) return toast('هذا الطلب خارج نطاق صلاحيتك.', true);
  const ce = can('requests', 'edit'), ca = can('requests', 'approve'), cs = can('requests', 'assign'), cf = can('requests', 'files');
  const data = Object.entries(r.data).filter(([k, v]) => v !== '' && v != null && k !== 'deck' && k !== 'waitlist');
  openModal({size:'xl', title:`<span class="ltr">${r.id}</span> — ${esc(REQ_TYPES[r.type].ar)}`, sub:`استُلم ${fmtDate(r.createdAt, true)} · المصدر: ${esc(SOURCES[r.source]?.ar || '')}`, body:`<div class="detail"><div style="display:grid;gap:18px;align-content:start">
    <div class="panel"><div class="panel-head"><h2>بيانات العميل</h2>${customerData() ? '' : '<span class="chip plain">' + ic('lock') + ' مخفية جزئيًا</span>'}</div><div class="panel-body"><dl class="kv">
      ${r.companyId ? `<dt>المنشأة</dt><dd><a href="#admin" data-act="open-company" data-id="${r.companyId}">${esc(companyName(companyById(r.companyId), 'ar'))}</a></dd>` : ''}<dt>الاسم</dt><dd>${esc(r.name)}</dd><dt>الجوال</dt><dd class="ltr" style="text-align:start">${esc(showPhone(r.phone))}</dd><dt>البريد</dt><dd class="ltr" style="text-align:start">${esc(showEmail(r.email))}</dd></dl></div></div>
    <div class="panel"><div class="panel-head"><h2>تفاصيل الطلب</h2></div><div class="panel-body"><dl class="kv">${data.map(([k, v]) => `<dt>${esc(fieldLabel(r.type, k))}</dt><dd>${esc(fieldValue(r.type, k, v))}</dd>`).join('') || '<dt>—</dt><dd></dd>'}</dl></div></div>
    <div class="panel"><div class="panel-head"><h2>الملفات والمرفقات</h2>${cf ? `<label class="btn btn-ghost btn-xs">${ic('upload')} رفع ملف<input type="file" id="rq-file" hidden></label>` : ''}</div><div class="panel-body">
      ${cf ? (r.files.length ? r.files.map(f => `<div class="list-item" style="padding:8px 0">${ic('doc')}<span class="grow">${esc(f)}</span><span class="chip plain">محمي</span></div>`).join('') : '<p class="muted">لا توجد ملفات</p>') : lockNote('الاطلاع على المرفقات يتطلب صلاحية «الملفات».')}</div></div>
    <div class="panel"><div class="panel-head"><h2>سجل التواصل مع العميل</h2></div><div class="panel-body">
      ${(r.comms || []).map(c => `<div class="list-item" style="padding:8px 0"><span class="chip plain">${esc(c.kind)}</span><span class="grow">${esc(c.text)}<span style="display:block">${esc(userName(c.by))} · ${fmtDate(c.at, true)}</span></span></div>`).join('') || '<p class="muted" style="margin-bottom:10px">لم يُسجَّل تواصل بعد</p>'}
      ${ce ? `<div class="toolbar" style="margin-top:10px"><select class="input" id="cm-kind" aria-label="نوع التواصل">${options([['مكالمة', 'مكالمة'], ['واتساب', 'واتساب'], ['بريد', 'بريد'], ['زيارة', 'زيارة']])}</select><input class="input search" id="cm-text" placeholder="ملخص التواصل"><button class="btn btn-ghost btn-sm" id="cm-add">تسجيل</button></div>` : ''}</div></div>
  </div><div style="display:grid;gap:18px;align-content:start">
    <div class="panel"><div class="panel-body" style="display:grid;gap:14px">
      ${fld('rq-st', 'الحالة', `<select class="input" id="rq-st" ${ce ? '' : 'disabled'}>${options(Object.entries(REQ_STATUS).filter(([k]) => ca || !['approved', 'rejected'].includes(k) || k === r.status).map(([k, v]) => [k, v.ar]), r.status)}</select>`, ca ? '' : 'الموافقة والرفض تتطلب صلاحية خاصة')}
      ${ca && !['approved', 'rejected', 'done'].includes(r.status) ? `<div class="toolbar"><button class="btn btn-gold btn-sm" data-act="req-decide" data-id="${r.id}" data-s="approved">${ic('check')} موافقة</button><button class="btn btn-danger btn-sm" data-act="req-decide" data-id="${r.id}" data-s="rejected">رفض</button></div>` : ''}
      ${fld('rq-as', 'الموظف المسؤول', `<select class="input" id="rq-as" ${cs ? '' : 'disabled'}><option value="">غير مُسند</option>${options(staffOpts(), r.assignee)}</select>`, cs ? 'يصل الموظف إشعار فور الإسناد' : 'الإسناد يتطلب صلاحية')}
    </div></div>
    <div class="panel"><div class="panel-head"><h2>ملاحظات داخلية</h2><span class="chip plain">لا تظهر للعميل</span></div><div class="panel-body" style="display:grid;gap:10px">
      ${r.notes.map(n => `<div class="note-box"><b style="font-size:13px">${esc(userName(n.by))}</b> <span class="muted" style="font-size:12px">${fmtDate(n.at, true)}</span><p>${esc(n.text)}</p></div>`).join('') || '<p class="muted">لا توجد ملاحظات</p>'}
      ${ce ? `<textarea class="input" id="rq-note" placeholder="اكتب ملاحظة للفريق" style="min-height:70px"></textarea><button class="btn btn-ghost btn-sm" id="rq-note-add" style="justify-self:start">${ic('note')} إضافة ملاحظة</button>` : ''}</div></div>
    <div class="panel"><div class="panel-head"><h2>سجل الطلب</h2></div><div class="panel-body"><div class="timeline">${r.history.slice().reverse().map(h => `<div class="tl"><i></i><div><p>${esc(h.text)}</p><span>${esc(userName(h.by))} · ${fmtDate(h.at, true)}</span></div></div>`).join('')}</div></div></div>
    <div class="toolbar"><button class="btn btn-ghost btn-sm" data-act="print">${ic('print')} طباعة</button>
      ${can('requests', 'delete') ? `<button class="btn btn-danger btn-sm" data-act="req-del" data-id="${r.id}">${ic('trash')} حذف نهائي</button>` : ''}</div>
  </div></div>`, onMount:(m) => {
    const st = m.querySelector('#rq-st'); if (st) st.onchange = () => { if (!guard('requests', 'edit')) return; setReqStatus(r, st.value); save(); openRequest(r.id); renderAdminKeepModal(); toast('حُدّثت الحالة وأُبلغ العميل'); };
    const as = m.querySelector('#rq-as'); if (as) as.onchange = () => { if (!guard('requests', 'assign')) return; const before = userName(r.assignee); r.assignee = as.value || null; r.history.push({at:new Date().toISOString(), by:me().id, text:`أسند الطلب إلى ${userName(r.assignee)}`}); audit('assign', r.id, {المسؤول:before}, {المسؤول:userName(r.assignee)}); if (r.assignee) notify(r.assignee, 'أُسند إليك طلب', `${r.id} — ${REQ_TYPES[r.type].ar}`, 'requests'); save(); openRequest(r.id); renderAdminKeepModal(); toast('أُسند الطلب وأُرسل إشعار للموظف'); };
    const na = m.querySelector('#rq-note-add'); if (na) na.onclick = () => { const v = m.querySelector('#rq-note').value.trim(); if (!v) return; r.notes.push({by:me().id, at:new Date().toISOString(), text:v}); r.history.push({at:new Date().toISOString(), by:me().id, text:'أضاف ملاحظة داخلية'}); audit('note', r.id, null, {ملاحظة:v}); save(); openRequest(r.id); };
    const fi = m.querySelector('#rq-file'); if (fi) fi.onchange = () => { const f = fi.files[0]; if (!f) return; r.files.push(f.name); r.history.push({at:new Date().toISOString(), by:me().id, text:`رفع ملف: ${f.name}`}); audit('file', r.id, null, {الملف:f.name}); save(); openRequest(r.id); };
    const ca2 = m.querySelector('#cm-add'); if (ca2) ca2.onclick = () => { const v = m.querySelector('#cm-text').value.trim(); if (!v) return; (r.comms = r.comms || []).push({by:me().id, at:new Date().toISOString(), kind:m.querySelector('#cm-kind').value, text:v}); audit('note', r.id, null, {تواصل:v}); save(); openRequest(r.id); };
  }});
}
function renderAdminKeepModal() { const m = $('#modal').innerHTML; const open = $('#modal').classList.contains('open'); renderAdmin(); if (open) { $('#modal').innerHTML = m; } }
ACT['print'] = () => tryPrint();
ACT['req-decide'] = (el) => { const r = S.requests.find(x => x.id === el.dataset.id); if (!guard('requests', 'approve')) return; setReqStatus(r, el.dataset.s); save(); renderAdmin(); openRequest(r.id); toast(el.dataset.s === 'approved' ? 'تمت الموافقة وأُبلغ العميل' : 'رُفض الطلب وأُبلغ العميل'); };
ACT['req-del'] = (el) => confirmBox(`حذف الطلب ${el.dataset.id} نهائيًا؟ تبقى العملية مسجلة في سجل العمليات.`, () => { const i = S.requests.findIndex(x => x.id === el.dataset.id); const r = S.requests[i]; S.requests.splice(i, 1); audit('delete', r.id, {النوع:REQ_TYPES[r.type].ar, العميل:r.name}, null); rerender(); toast('حُذف الطلب'); }, 'حذف نهائي');

/* ---------- events ---------- */
VIEWS.events = () => {
  const regs = (id) => S.requests.filter(r => r.type === 'event' && r.data.event === id);
  return panel('الدورات والفعاليات', table(['الفعالية', 'التاريخ', 'المقاعد', 'المسجلون', 'الرسوم', 'الحالة', ''], S.content.events.slice().sort((a, b) => a.date.localeCompare(b.date)).map(e => `<tr>
    <td><b>${esc(e.title.ar)}</b><span class="sub">${esc(e.kind.ar)} · ${esc(e.place.ar)}</span></td><td>${fmtDate(e.date)} <span class="sub">${e.time}</span></td>
    <td class="num">${e.taken}/${e.seats}${e.waitlist ? ` <span class="chip warn">+${e.waitlist} انتظار</span>` : ''}</td><td><button class="btn btn-ghost btn-xs" data-act="ev-regs" data-id="${e.id}">${regs(e.id).length} عبر الموقع</button></td>
    <td>${e.price ? money(e.price) + ' ر.س' : 'مجاني'}</td><td><span class="chip ${e.status === 'published' ? 'ok' : 'plain'}">${e.status === 'published' ? 'منشورة' : 'مسودة'}</span></td>
    <td><div class="toolbar" style="flex-wrap:nowrap">${can('events', 'edit') ? `<button class="btn btn-ghost btn-xs" data-act="ce-edit" data-col="events" data-id="${e.id}">${ic('edit')} تعديل</button>` : ''}
      ${can('events', 'publish') ? `<button class="btn btn-ghost btn-xs" data-act="ev-pub" data-id="${e.id}">${e.status === 'published' ? 'إلغاء النشر' : 'نشر'}</button>` : ''}
      ${can('events', 'delete') ? `<button class="btn btn-danger btn-xs" data-act="ce-del" data-col="events" data-id="${e.id}" aria-label="حذف">${ic('trash')}</button>` : ''}</div></td></tr>`)),
    {pad:false, sub:'التسجيل وقائمة الانتظار يعملان تلقائيًا. تسجيل الحضور بـ QR والشهادات ضمن المرحلة الثانية.', actions:`${can('events', 'add') ? `<button class="btn btn-gold btn-sm" data-act="ce-add" data-col="events">${ic('plus')} فعالية جديدة</button>` : ''}<button class="btn btn-ghost btn-sm" data-act="ev-export" ${can('events', 'export') ? '' : 'disabled'}>${ic('download')} تصدير المسجلين</button>`});
};
ACT['ev-pub'] = (el) => { if (!guard('events', 'publish')) return; const e = S.content.events.find(x => x.id === el.dataset.id); e.status = e.status === 'published' ? 'draft' : 'published'; audit('content', 'فعالية: ' + e.title.ar, null, {الحالة:e.status === 'published' ? 'منشورة' : 'مسودة'}); rerender(); };
ACT['ev-regs'] = (el) => {
  const e = S.content.events.find(x => x.id === el.dataset.id); const rs = S.requests.filter(r => r.type === 'event' && r.data.event === e.id);
  openModal({title:'المسجلون — ' + esc(e.title.ar), size:'wide', body:table(['الاسم', 'الجوال', 'الجهة', 'الحالة', 'الحضور'], rs.map(r => `<tr><td>${esc(r.name)}</td><td class="ltr">${esc(showPhone(r.phone))}</td><td>${esc(r.data.org || '—')}</td><td>${r.data.waitlist ? '<span class="chip warn">قائمة الانتظار</span>' : stChip(r.status)}</td>
    <td><label class="check"><input type="checkbox" data-att="${r.id}" ${r.data.attended ? 'checked' : ''} ${can('events', 'edit') ? '' : 'disabled'}> حضر</label></td></tr>`), 'لا يوجد مسجلون عبر الموقع بعد'),
    onMount:(m) => $$('[data-att]', m).forEach(c => c.onchange = () => { const r = S.requests.find(x => x.id === c.dataset.att); r.data.attended = c.checked; audit('edit', r.id, null, {الحضور:c.checked ? 'حضر' : 'لم يحضر'}); save(); })});
};
ACT['ev-export'] = () => exportDialog('المسجلون في الفعاليات', [['الفعالية', 'الاسم', 'الجوال', 'البريد', 'الجهة', 'قائمة الانتظار'], ...S.requests.filter(r => r.type === 'event').map(r => [L(S.content.events.find(e => e.id === r.data.event)?.title, 'ar'), r.name, showPhone(r.phone), showEmail(r.email), r.data.org || '', r.data.waitlist ? 'نعم' : 'لا'])], 'events');

/* ---------- generic bilingual content editor ---------- */
const ICON_OPTS = ['target', 'compass', 'heart', 'shield', 'bulb', 'doc', 'stamp', 'palette', 'coins', 'idcard', 'desk', 'office', 'meeting', 'rocket', 'sprout', 'users', 'chart', 'headset', 'megaphone'].map(k => [k, k]);
const SCHEMA = {
  slides:{label:'السلايدر الرئيسي', perm:'content', title:(x) => x.title.ar, fields:[['eyebrow', 'عنوان صغير', 't'], ['title', 'العنوان', 't'], ['text', 'النص', 'ta'], ['cta1.label', 'نص الزر الأساسي', 't'], ['cta1.form', 'الزر يفتح نموذج', 'sel', Object.keys(FORMS).map(k => [k, FORMS[k].ar])], ['cta2.label', 'نص الزر الثانوي', 't'], ['cta2.href', 'رابط الزر الثانوي', 's'], ['art', 'الرسم', 'sel', [['arches', 'أقواس'], ['steps', 'درجات النمو'], ['plan', 'مخطط المكاتب']]], ['img', 'صورة (تحل محل الرسم)', 'img']]},
  values:{label:'من نحن — الرؤية والرسالة', perm:'content', title:(x) => x.title.ar, fields:[['icon', 'الأيقونة', 'sel', ICON_OPTS], ['title', 'العنوان', 't'], ['text', 'النص', 'ta']]},
  stats:{label:'الأرقام والإحصائيات', perm:'content', title:(x) => `${money(x.v)} ${x.label.ar}`, fields:[['v', 'الرقم', 'n'], ['suf', 'لاحقة (مثل م ر.س)', 't'], ['label', 'الوصف', 't']]},
  partners:{label:'الشركاء', perm:'content', title:(x) => x.name.ar, fields:[['name', 'اسم الجهة', 't'], ['mark', 'حرف مختصر (بدون شعار)', 's'], ['img', 'الشعار', 'img']]},
  services:{label:'الخدمات', perm:'content', title:(x) => x.name.ar, fields:[['icon', 'الأيقونة', 'sel', ICON_OPTS], ['name', 'اسم الخدمة', 't'], ['text', 'الوصف', 'ta']]},
  opportunities:{label:'الفرص الاستثمارية', perm:'content', title:(x) => x.name.ar, fields:[['name', 'اسم المشروع', 't'], ['sector', 'القطاع', 'sel', Object.entries(SECTORS).map(([k, v]) => [k, v.ar])], ['stage', 'المرحلة', 't'], ['amount', 'التمويل المطلوب (ر.س)', 'n'], ['raised', 'نسبة ما تم تأمينه %', 'n'], ['status', 'الحالة', 'sel', [['published', 'منشورة'], ['draft', 'مسودة']]]]},
  events:{label:'الدورات والفعاليات', perm:'events', title:(x) => x.title.ar, fields:[['kind', 'النوع', 't'], ['title', 'العنوان', 't'], ['date', 'التاريخ', 'd'], ['time', 'الوقت', 'tm'], ['dur', 'المدة', 't'], ['place', 'المكان', 't'], ['seats', 'عدد المقاعد', 'n'], ['price', 'الرسوم (ر.س، 0 مجاني)', 'n'], ['status', 'الحالة', 'sel', [['published', 'منشورة'], ['draft', 'مسودة']]]]},
  gallery:{label:'معرض الصور', perm:'content', title:(x) => x.cap.ar, fields:[['cap', 'التعليق', 't'], ['img', 'الصورة', 'img'], ['art', 'الرسم البديل', 'sel', [['open', 'مساحة مفتوحة'], ['office', 'مكاتب'], ['meeting', 'اجتماعات'], ['lounge', 'استراحة'], ['hall', 'قاعة'], ['booth', 'غرف مكالمات']]], ['size', 'الحجم في الشبكة', 'sel', [['', 'عادي'], ['big', 'كبير'], ['wide', 'عريض']]]]},
  testimonials:{label:'قصص النجاح وآراء العملاء', perm:'content', title:(x) => x.who.ar, fields:[['text', 'النص', 'ta'], ['who', 'صاحب الرأي', 't'], ['role', 'الصفة', 't']]},
  faq:{label:'الأسئلة الشائعة', perm:'content', title:(x) => x.q.ar, fields:[['q', 'السؤال', 't'], ['a', 'الإجابة', 'ta']]}
};
const getP = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
const setP = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => (a[k] = a[k] || {}), o)[last] = v; };
function colOf(col) { return S.content[col]; }
function editItem(col, item, isNew) {
  const sc = SCHEMA[col]; const perm = sc.perm;
  if (!guard(perm, isNew ? 'add' : 'edit')) return;
  const body = sc.fields.map(([k, lab, type, opts]) => {
    const v = getP(item, k); const id = 'ce-' + k.replace('.', '-');
    if (type === 't' || type === 'ta') return `<div class="lang-split">${['ar', 'en'].map(lg => fld(`${id}-${lg}`, `${lab}<span class="tag">${lg === 'ar' ? 'عربي' : 'English'}</span>`,
      type === 'ta' ? `<textarea class="input" id="${id}-${lg}" ${lg === 'en' ? 'dir="ltr"' : ''}>${esc(v?.[lg] || '')}</textarea>` : inp(`${id}-${lg}`, v?.[lg] || '', 'text', lg === 'en' ? 'dir="ltr"' : ''))).join('')}</div>`;
    if (type === 'sel') return fld(id, lab, `<select class="input" id="${id}">${options(opts, v)}</select>`);
    if (type === 'img') return fld(id, lab, `<div class="toolbar">${v ? `<span class="thumb"><img src="${v}" alt=""></span><button class="btn btn-ghost btn-xs" type="button" id="${id}-rm">إزالة الصورة</button>` : ''}<input class="input" type="file" accept="image/*" id="${id}" style="flex:1"></div>`, 'تُضغط الصورة وتُحوَّل إلى WebP تلقائيًا');
    return fld(id, lab, inp(id, v ?? '', type === 'n' ? 'number' : type === 'd' ? 'date' : type === 'tm' ? 'time' : 'text', type === 's' ? 'dir="ltr"' : ''));
  }).join('');
  openModal({size:'wide', title:(isNew ? 'إضافة: ' : 'تعديل: ') + sc.label, sub:'كل نص له نسخة عربية وإنجليزية منفصلة', body:`<div class="form">${body}<div class="toolbar"><button class="btn btn-gold" id="ce-save">حفظ ونشر</button><button class="btn btn-ghost" data-act="close-modal">إلغاء</button></div></div>`,
  onMount:(m) => {
    let clearImg = false; const rmb = m.querySelector('#ce-img-rm'); if (rmb) rmb.onclick = () => { clearImg = true; rmb.closest('.toolbar').querySelector('.thumb')?.remove(); rmb.remove(); };
    m.querySelector('#ce-save').onclick = async () => {
      const before = JSON.parse(JSON.stringify(item));
      for (const [k, , type] of sc.fields) {
        const id = 'ce-' + k.replace('.', '-');
        if (type === 't' || type === 'ta') setP(item, k, {ar:m.querySelector(`#${id}-ar`).value.trim(), en:m.querySelector(`#${id}-en`).value.trim()});
        else if (type === 'img') { const f = m.querySelector('#' + id).files[0]; if (f) { try { setP(item, k, await readImage(f, col === 'partners' ? 400 : 1400)); } catch (e) { return toast('الملف ليس صورة صالحة', true); } } else if (clearImg) setP(item, k, ''); }
        else if (type === 'n') setP(item, k, +m.querySelector('#' + id).value || 0);
        else setP(item, k, m.querySelector('#' + id).value);
      }
      if (isNew) { if (col === 'events') Object.assign(item, {taken:0}); colOf(col).push(item); }
      const diffB = {}, diffA = {};
      sc.fields.forEach(([k, lab, type]) => { if (type === 'img') return; const a = JSON.stringify(getP(before, k)), b = JSON.stringify(getP(item, k)); if (a !== b) { diffB[lab] = typeof getP(before, k) === 'object' ? getP(before, k)?.ar : getP(before, k); diffA[lab] = typeof getP(item, k) === 'object' ? getP(item, k)?.ar : getP(item, k); } });
      audit('content', `${sc.label} — ${sc.title(item)}`, isNew ? null : diffB, isNew ? {إضافة:sc.title(item)} : diffA);
      closeModal(); rerender(); toast('حُفظ ونُشر على الموقع');
    };
  }});
}
const blankFor = (col) => { const o = {id:uid(col[0])}; SCHEMA[col].fields.forEach(([k, , type, opts]) => setP(o, k, type === 't' || type === 'ta' ? {ar:'', en:''} : type === 'n' ? 0 : type === 'sel' ? opts[0][0] : type === 'd' ? today() : '')); if (col === 'slides') Object.assign(o, {cta2:Object.assign({href:'#about'}, o.cta2)}); return o; };
ACT['ce-edit'] = (el) => editItem(el.dataset.col, colOf(el.dataset.col).find(x => x.id === el.dataset.id), false);
ACT['ce-add'] = (el) => editItem(el.dataset.col, blankFor(el.dataset.col), true);
ACT['ce-del'] = (el) => { const col = el.dataset.col; if (!guard(SCHEMA[col].perm, 'delete')) return; const arr = colOf(col); const i = arr.findIndex(x => x.id === el.dataset.id);
  confirmBox(`حذف «${esc(SCHEMA[col].title(arr[i]))}» من الموقع؟`, () => { const [x] = arr.splice(i, 1); audit('delete', `${SCHEMA[col].label} — ${SCHEMA[col].title(x)}`, {عنصر:SCHEMA[col].title(x)}, null); rerender(); toast('حُذف'); }); };
ACT['ce-move'] = (el) => { const col = el.dataset.col; if (!guard(SCHEMA[col].perm, 'edit')) return; const arr = colOf(col); const i = arr.findIndex(x => x.id === el.dataset.id); const j = i + (+el.dataset.d); if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; audit('content', SCHEMA[col].label, null, {الترتيب:'تغيّر'}); rerender(); };
function collectionPanel(col) {
  const sc = SCHEMA[col]; const arr = colOf(col); const pm = sc.perm;
  return panel(sc.label, `<div>${arr.map((x, i) => `<div class="list-item">${x.img ? `<span class="thumb"><img src="${x.img}" alt=""></span>` : (col === 'slides' ? `<span class="thumb">${slideArt(x.art)}</span>` : col === 'gallery' ? `<span class="thumb">${galleryArt(x.art)}</span>` : '')}
    <div class="grow"><b>${esc(sc.title(x))}</b><span class="ltr" style="display:block;text-align:start">${esc(L(x.title || x.name || x.q || x.cap || x.label || x.text, 'en') || '— لا توجد ترجمة إنجليزية —')}</span></div>
    ${can(pm, 'edit') ? `<button class="icon-btn" data-act="ce-move" data-col="${col}" data-id="${x.id}" data-d="-1" aria-label="أعلى" ${i ? '' : 'disabled'} style="width:32px;height:32px">↑</button><button class="icon-btn" data-act="ce-move" data-col="${col}" data-id="${x.id}" data-d="1" aria-label="أسفل" ${i < arr.length - 1 ? '' : 'disabled'} style="width:32px;height:32px">↓</button>
    <button class="btn btn-ghost btn-xs" data-act="ce-edit" data-col="${col}" data-id="${x.id}">${ic('edit')} تعديل</button>` : ''}${can(pm, 'delete') ? `<button class="btn btn-danger btn-xs" data-act="ce-del" data-col="${col}" data-id="${x.id}" aria-label="حذف">${ic('trash')}</button>` : ''}</div>`).join('')}</div>`,
    {pad:false, sub:`${arr.length} عناصر — يظهر الترتيب كما في الموقع`, actions:can(pm, 'add') ? `<button class="btn btn-gold btn-sm" data-act="ce-add" data-col="${col}">${ic('plus')} إضافة</button>` : ''});
}
VIEWS.content = () => {
  const tabs = [['slides', 'السلايدر'], ['sections', 'نصوص الأقسام'], ['values', 'من نحن'], ['stats', 'الأرقام'], ['partners', 'الشركاء'], ['services', 'الخدمات'], ['opportunities', 'الفرص'], ['gallery', 'المعرض'], ['testimonials', 'آراء العملاء'], ['faq', 'الأسئلة الشائعة']];
  const tab = UI.contentTab;
  const body = tab === 'sections' ? panel('نصوص عناوين الأقسام', `<div>${Object.entries(S.content.sections).map(([k, s]) => `<div class="list-item"><div class="grow"><b>${esc(s.title.ar)}</b><span>${esc(s.kicker.ar)} · <span class="ltr">${esc(s.title.en)}</span></span></div>${can('content', 'edit') ? `<button class="btn btn-ghost btn-xs" data-act="sec-edit" data-k="${k}">${ic('edit')} تعديل</button>` : ''}</div>`).join('')}</div>`, {pad:false})
    : collectionPanel(tab);
  return `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" class="${tab === k ? 'on' : ''}" aria-selected="${tab === k}" data-act="content-tab" data-k="${k}">${l}</button>`).join('')}</div>
    ${can('content', 'edit') ? '' : lockNote('دورك يسمح بالمشاهدة فقط. تعديل المحتوى يتطلب صلاحية «تعديل» في محتوى الموقع.')}
    <div class="notice">${ic('info')}<div>تُحفظ التعديلات وتظهر في الموقع مباشرة. <a href="#">معاينة الموقع</a> · بيانات التواصل وروابط المنصات من <a href="#admin" data-act="nav" data-k="settings">الإعدادات</a>.</div></div>${body}`;
};
ACT['content-tab'] = (el) => { UI.contentTab = el.dataset.k; renderAdmin(); };
ACT['sec-edit'] = (el) => {
  if (!guard('content', 'edit')) return; const s = S.content.sections[el.dataset.k]; const keys = Object.keys(s);
  const names = {kicker:'العنوان الصغير', title:'العنوان', text:'النص', lead:'الفقرة الافتتاحية'};
  openModal({size:'wide', title:'تعديل نصوص القسم', body:`<div class="form">${keys.map(k => `<div class="lang-split">${['ar', 'en'].map(lg => fld(`sx-${k}-${lg}`, `${names[k] || k}<span class="tag">${lg === 'ar' ? 'عربي' : 'English'}</span>`, k === 'title' || k === 'kicker' ? inp(`sx-${k}-${lg}`, s[k][lg], 'text', lg === 'en' ? 'dir="ltr"' : '') : `<textarea class="input" id="sx-${k}-${lg}" ${lg === 'en' ? 'dir="ltr"' : ''}>${esc(s[k][lg])}</textarea>`)).join('')}</div>`).join('')}
    <button class="btn btn-gold" id="sx-save" style="justify-self:start">حفظ ونشر</button></div>`, onMount:(m) => m.querySelector('#sx-save').onclick = () => {
      const before = s.title.ar; keys.forEach(k => s[k] = {ar:m.querySelector(`#sx-${k}-ar`).value.trim(), en:m.querySelector(`#sx-${k}-en`).value.trim()});
      audit('content', 'قسم: ' + s.title.ar, {العنوان:before}, {العنوان:s.title.ar}); closeModal(); rerender(); toast('حُفظ ونُشر'); }});
};

/* ---------- pricing ---------- */
VIEWS.pricing = () => {
  const ed = can('pricing', 'edit');
  return `${ed ? '' : lockNote('تغيير الأسعار والباقات يتطلب صلاحية «تعديل» في الباقات والأسعار — يمنحها المالك.')}
  ${panel('باقات مساحات العمل', table(['الباقة', 'السعر', 'الوحدة', 'مميزة', ''], S.content.packages.map(p => `<tr><td><b>${esc(p.name.ar)}</b><span class="sub ltr" style="text-align:start">${esc(p.name.en)}</span></td>
    <td>${ed ? `<input class="input num" type="number" min="0" value="${p.price}" data-pk="${p.id}" style="width:120px;min-height:38px" aria-label="السعر">` : `<b class="num">${money(p.price)}</b>`} ر.س</td>
    <td><select class="input" data-pku="${p.id}" ${ed ? '' : 'disabled'} style="min-height:38px;width:auto" aria-label="الوحدة">${options([['hour', 'ساعة'], ['day', 'يوم'], ['month', 'شهر']], p.unit)}</select></td>
    <td><label class="switchx"><input type="checkbox" data-pkf="${p.id}" ${p.featured ? 'checked' : ''} ${ed ? '' : 'disabled'} aria-label="مميزة"><span></span></label></td>
    <td>${ed ? `<button class="btn btn-ghost btn-xs" data-act="pk-edit" data-id="${p.id}">${ic('edit')} النصوص</button>` : ''}</td></tr>`)), {pad:false, sub:'تظهر في قسم «مساحات العمل» بالموقع', actions:ed ? `<button class="btn btn-gold btn-sm" id="pk-save">حفظ الأسعار</button>` : ''})}
  ${panel('أسعار المساحات القابلة للحجز', table(['المساحة', 'السعة', 'بالساعة', 'باليوم', 'بالشهر'], S.resources.map(r => `<tr><td>${esc(r.name.ar)}</td><td class="num">${r.cap}</td>${['hour', 'day', 'month'].map(u => `<td>${ed ? `<input class="input num" type="number" min="0" value="${r.rate[u] ?? ''}" placeholder="—" data-rr="${r.id}" data-u="${u}" style="width:100px;min-height:36px" aria-label="${u}">` : (r.rate[u] ? money(r.rate[u]) : '—')}</td>`).join('')}</tr>`)), {pad:false, sub:'يستخدمها نموذج الحجز لحساب السعر التقديري', actions:ed ? `<button class="btn btn-gold btn-sm" id="rr-save">حفظ</button>` : ''})}
  ${panel('أكواد الخصم', table(['الكود', 'الخصم', 'مفعّل'], S.codes.map((c, i) => `<tr><td class="ltr" style="text-align:start"><b>${esc(c.code)}</b></td><td class="num">${c.pct}%</td><td><label class="switchx"><input type="checkbox" data-code="${i}" ${c.active ? 'checked' : ''} ${ed ? '' : 'disabled'} aria-label="مفعّل"><span></span></label></td></tr>`)),
    {pad:false, actions:ed ? `<input class="input ltr" id="cd-new" placeholder="NEWCODE" style="width:130px;min-height:36px" aria-label="كود جديد"><input class="input" id="cd-pct" type="number" min="1" max="90" placeholder="%" style="width:80px;min-height:36px" aria-label="النسبة"><button class="btn btn-ghost btn-sm" id="cd-add">${ic('plus')} إضافة</button>` : ''})}`;
};
AFTER.pricing = () => {
  const s1 = $('#pk-save'); if (s1) s1.onclick = () => { const ch = []; S.content.packages.forEach(p => { const v = +$(`[data-pk="${p.id}"]`).value, u = $(`[data-pku="${p.id}"]`).value, f = $(`[data-pkf="${p.id}"]`).checked; if (v !== p.price || u !== p.unit) ch.push([p.name.ar, `${p.price}/${p.unit}`, `${v}/${u}`]); p.price = v; p.unit = u; p.featured = f; });
    ch.forEach(([n, b, a]) => audit('price', 'باقة: ' + n, {السعر:b}, {السعر:a})); rerender(); toast(ch.length ? 'حُفظت الأسعار وظهرت في الموقع' : 'لا تغييرات'); };
  const s2 = $('#rr-save'); if (s2) s2.onclick = () => { $$('[data-rr]').forEach(i => { const r = resById(i.dataset.rr); const v = i.value === '' ? undefined : +i.value; if (r.rate[i.dataset.u] !== v) { audit('price', 'مساحة: ' + r.name.ar, {[i.dataset.u]:r.rate[i.dataset.u] ?? '—'}, {[i.dataset.u]:v ?? '—'}); if (v === undefined) delete r.rate[i.dataset.u]; else r.rate[i.dataset.u] = v; } }); rerender(); toast('حُفظت الأسعار'); };
  $$('[data-code]').forEach(c => c.onchange = () => { const x = S.codes[+c.dataset.code]; x.active = c.checked; audit('price', 'كود خصم ' + x.code, null, {مفعّل:x.active ? 'نعم' : 'لا'}); save(); });
  const ad = $('#cd-add'); if (ad) ad.onclick = () => { const code = $('#cd-new').value.trim().toUpperCase(), pct = +$('#cd-pct').value; if (!/^[A-Z0-9]{3,15}$/.test(code) || !(pct > 0 && pct <= 90)) return toast('كود من 3–15 حرفًا إنجليزيًا أو رقمًا، ونسبة بين 1 و90', true); S.codes.push({code, pct, active:true}); audit('price', 'كود خصم ' + code, null, {النسبة:pct + '%'}); rerender(); };
};
ACT['pk-edit'] = (el) => {
  const p = S.content.packages.find(x => x.id === el.dataset.id); if (!guard('pricing', 'edit')) return;
  openModal({size:'wide', title:'نصوص الباقة', body:`<div class="form">${[['name', 'الاسم'], ['desc', 'الوصف'], ['alt', 'سطر إضافي تحت السعر']].map(([k, l]) => `<div class="lang-split">${['ar', 'en'].map(lg => fld(`pk-${k}-${lg}`, `${l}<span class="tag">${lg === 'ar' ? 'عربي' : 'English'}</span>`, inp(`pk-${k}-${lg}`, p[k][lg], 'text', lg === 'en' ? 'dir="ltr"' : ''))).join('')}</div>`).join('')}
    <div class="lang-split">${['ar', 'en'].map(lg => fld(`pk-f-${lg}`, `المزايا (سطر لكل ميزة)<span class="tag">${lg === 'ar' ? 'عربي' : 'English'}</span>`, `<textarea class="input" id="pk-f-${lg}" ${lg === 'en' ? 'dir="ltr"' : ''}>${esc(p.feats.map(f => f[lg]).join('\n'))}</textarea>`)).join('')}</div>
    <button class="btn btn-gold" id="pk-s" style="justify-self:start">حفظ</button></div>`, onMount:(m) => m.querySelector('#pk-s').onclick = () => {
      ['name', 'desc', 'alt'].forEach(k => p[k] = {ar:m.querySelector(`#pk-${k}-ar`).value, en:m.querySelector(`#pk-${k}-en`).value});
      const ar = m.querySelector('#pk-f-ar').value.split('\n').filter(Boolean), en = m.querySelector('#pk-f-en').value.split('\n'); p.feats = ar.map((a, i) => ({ar:a, en:en[i] || ''}));
      audit('content', 'باقة: ' + p.name.ar, null, {النصوص:'حُدّثت'}); closeModal(); rerender(); toast('حُفظت'); }});
};

/* ---------- reports ---------- */
VIEWS.reports = () => {
  const fin = can('reports', 'finance'); const M = metrics();
  const rows = S.history.map(h => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + h.m); return [d.toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', {month:'long', year:'numeric'}), h.clients, h.bookings, h.leads, h.won, Math.round(h.won / h.leads * 100) + '%', h.revenue]; });
  rows.push(['الشهر الحالي (حتى الآن)', M.newClients, M.bookingsMonth, S.clients.filter(c => monthKey(c.createdAt) === thisMonth()).length, S.clients.filter(c => c.status === 'contracted' && monthKey(c.createdAt) === thisMonth()).length, M.conv + '%', M.revenue]);
  return `<div class="toolbar" style="justify-content:flex-end"><button class="btn btn-ghost btn-sm" data-act="print" ${can('reports', 'print') ? '' : 'disabled'}>${ic('print')} طباعة</button><button class="btn btn-gold btn-sm" data-act="rep-export" ${can('reports', 'export') ? '' : 'disabled'}>${ic('download')} تصدير Excel</button></div>
  <div class="tiles">${tile('نسبة تحويل الاستفسارات إلى عقود', M.conv + '%', {icon:'chart'})}${tile('إشغال المكاتب الخاصة', M.occ.office + '%', {icon:'office'})}${tile('الإيراد الشهري (ر.س)', money(M.revenue), {icon:'coins', locked:!fin})}${tile('المستحقات (ر.س)', money(M.outstanding), {icon:'alert', locked:!fin})}</div>
  <div class="cols even">${panel('العملاء الجدد شهريًا', monthChart('clients', 'العملاء الجدد', v => v))}${panel(fin ? 'الإيراد الشهري (ر.س)' : 'الحجوزات الشهرية', fin ? monthChart('revenue', 'الإيراد') : monthChart('bookings', 'الحجوزات', v => v))}</div>
  ${panel('مقارنة النتائج بين الشهور', table(['الشهر', 'عملاء جدد', 'حجوزات', 'استفسارات', 'تعاقدات', 'نسبة التحويل', 'الإيراد (ر.س)'], rows.map(r => `<tr>${r.map((c, i) => `<td class="${i ? 'num' : ''}">${i === 6 ? (fin ? money(c) : '•••') : esc(c)}</td>`).join('')}</tr>`)), {pad:false})}
  <div class="cols even">${panel('أداء كل موظف', table(['الموظف', 'مسندة', 'منجزة', 'نسبة الإنجاز'], M.staff.map(s => `<tr><td>${whoTag(s.u.id)}</td><td class="num">${s.total}</td><td class="num">${s.done}</td><td class="num">${s.total ? Math.round(s.done / s.total * 100) : 0}%</td></tr>`)), {pad:false})}
    ${panel('مصادر العملاء', table(['المصدر', 'العملاء', 'تحوّلوا', 'نسبة النجاح'], M.bySource.map(([k, n, w, p]) => `<tr><td>${SOURCES[k].ar}</td><td class="num">${n}</td><td class="num">${w}</td><td class="num">${p}%</td></tr>`)), {pad:false})}</div>`;
};
ACT['rep-export'] = () => { const fin = can('reports', 'finance'); exportDialog('تقرير الأداء الشهري', [['الشهر', 'عملاء جدد', 'حجوزات', 'استفسارات', 'تعاقدات', 'الإيراد'], ...S.history.map(h => [h.m, h.clients, h.bookings, h.leads, h.won, fin ? h.revenue : '—'])], 'reports'); };

/* ---------- notifications ---------- */
VIEWS.notifs = () => {
  const tab = UI.notifTab; const tv = can('notifications', 'view');
  const tabs = [['feed', 'إشعاراتي'], ...(tv ? [['tpl', 'قوالب الرسائل'], ['out', 'سجل الإرسال']] : []), ...(can('notifications', 'notify') ? [['send', 'إرسال إشعار']] : [])];
  const mine = myNotifs();
  let body = '';
  if (tab === 'feed' || !tabs.find(x => x[0] === tab)) body = panel('إشعاراتي', `<div>${mine.map(n => `<div class="list-item" style="${n.read ? '' : 'background:var(--gold-soft)'}"><span class="ic" style="color:var(--gold)">${ic('bell')}</span><div class="grow"><b>${esc(n.title)}</b><span>${esc(n.body)} · ${ago(n.at)}</span></div>
      ${n.link ? `<button class="btn btn-ghost btn-xs" data-act="notif-open" data-id="${n.id}">فتح</button>` : ''}</div>`).join('') || '<p class="empty">لا توجد إشعارات</p>'}</div>`, {pad:false, actions:mine.some(n => !n.read) ? `<button class="btn btn-ghost btn-sm" data-act="notif-read-all">تعليم الكل كمقروء</button>` : ''});
  else if (tab === 'tpl') body = panel('قوالب الرسائل', `<div>${S.templates.map(tp => `<div class="list-item"><div class="grow"><b>${esc(tp.name)}</b><span>${esc(tp.ar)}</span><span style="display:block">${tp.channels.map(c => `<span class="chip plain" style="margin-inline-end:4px">${{email:'بريد', sms:'رسالة نصية', whatsapp:'واتساب', inapp:'داخل النظام'}[c]}</span>`).join('')}</span></div>${can('notifications', 'edit') ? `<button class="btn btn-ghost btn-xs" data-act="tpl-edit" data-k="${tp.key}">${ic('edit')} تعديل</button>` : ''}</div>`).join('')}</div>`, {pad:false, sub:'المتغيرات بين { } تُستبدل تلقائيًا. الإرسال عبر الرسائل النصية وواتساب حسب الربط المتاح مع مزوّد الخدمة.'});
  else if (tab === 'out') body = panel('سجل الإرسال (محاكاة)', table(['الوقت', 'القناة', 'إلى', 'المحتوى'], (S.outbox || []).slice(0, 40).map(o => `<tr><td>${fmtDate(o.at, true)}</td><td><span class="chip plain">${{email:'بريد', whatsapp:'واتساب', sms:'نصية'}[o.channel] || o.channel}</span></td><td class="ltr" style="text-align:start">${esc(customerData() ? o.to : maskEmail(o.to))}</td><td>${esc(o.subject)}</td></tr>`), 'لم يُرسل شيء بعد — أرسل نموذجًا من الموقع لتجربة الإشعارات'), {pad:false});
  else body = panel('إرسال إشعار', `<div class="form">${fld('ns-to', 'إلى', `<select class="input" id="ns-to">${options([['staff', 'جميع الموظفين'], ...S.users.filter(u => u.status === 'active').map(u => [u.id, u.name])])}</select>`)}${fld('ns-t', 'العنوان', inp('ns-t'))}${fld('ns-b', 'النص', '<textarea class="input" id="ns-b"></textarea>')}<button class="btn btn-gold" id="ns-send" style="justify-self:start">إرسال</button></div>`);
  return `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" class="${tab === k ? 'on' : ''}" data-act="notif-tab" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
};
AFTER.notifs = () => { const b = $('#ns-send'); if (b) b.onclick = () => { const to = $('#ns-to').value, ti = $('#ns-t').value.trim(); if (!ti) return toast('اكتب عنوانًا', true); (to === 'staff' ? S.users.filter(u => u.status === 'active').map(u => u.id) : [to]).forEach(id => notify(id, ti, $('#ns-b').value.trim())); audit('create', 'إشعار: ' + ti); rerender(); toast('أُرسل الإشعار'); }; };
ACT['notif-tab'] = (el) => { UI.notifTab = el.dataset.k; renderAdmin(); };
ACT['notif-read-all'] = () => { myNotifs().forEach(n => n.read = true); rerender(); };
ACT['notif-open'] = (el) => { const n = S.notifs.find(x => x.id === el.dataset.id); n.read = true; const tgt = NAV.find(x => x.k === n.link); UI.admin = tgt && allowed(tgt) ? n.link : 'notifs'; rerender(); };
ACT['tpl-edit'] = (el) => { const tp = S.templates.find(x => x.key === el.dataset.k); if (!guard('notifications', 'edit')) return;
  openModal({size:'wide', title:'تعديل القالب', sub:esc(tp.name), body:`<div class="form"><div class="lang-split">${fld('tp-ar', 'النص العربي', `<textarea class="input" id="tp-ar">${esc(tp.ar)}</textarea>`)}${fld('tp-en', 'English', `<textarea class="input" id="tp-en" dir="ltr">${esc(tp.en)}</textarea>`)}</div>
    <div class="checks">${['email', 'sms', 'whatsapp', 'inapp'].map(c => `<label><input type="checkbox" value="${c}" ${tp.channels.includes(c) ? 'checked' : ''}> ${{email:'بريد', sms:'رسالة نصية', whatsapp:'واتساب', inapp:'داخل النظام'}[c]}</label>`).join('')}</div>
    <button class="btn btn-gold" id="tp-s" style="justify-self:start">حفظ</button></div>`, onMount:(m) => m.querySelector('#tp-s').onclick = () => { const b = tp.ar; tp.ar = m.querySelector('#tp-ar').value; tp.en = m.querySelector('#tp-en').value; tp.channels = $$('.checks input:checked', m).map(i => i.value); audit('edit', 'قالب: ' + tp.name, {النص:b}, {النص:tp.ar}); closeModal(); rerender(); toast('حُفظ القالب'); }}); };

/* ---------- audit ---------- */
VIEWS.audit = () => {
  const own = isOwner(); const f = UI.auditF || (UI.auditF = {who:'', act:''});
  let list = own ? S.audit : S.audit.filter(a => a.by === me().id);
  if (f.who) list = list.filter(a => a.by === f.who); if (f.act) list = list.filter(a => a.act === f.act);
  const show = (o) => o ? Object.entries(o).map(([k, v]) => `${k}: ${v}`).join(' · ') : '—';
  return `${own ? '' : `<div class="notice">${ic('lock')}<div>يظهر لك سجل عملياتك فقط. الاطلاع الكامل على السجل متاح لمالك النظام.</div></div>`}
  <div class="notice warn">${ic('shield')}<div>السجل للقراءة فقط: لا يستطيع أي مستخدم — بمن فيهم المالك — تعديله أو حذف أي سطر منه.</div></div>
  ${panel('سجل العمليات', `<div class="panel-body" style="padding-bottom:0"><div class="toolbar">${own ? `<select class="input" id="au-who" aria-label="المستخدم"><option value="">كل المستخدمين</option>${options(S.users.map(u => [u.id, u.name]).concat([['system', 'النظام (الموقع)'], ['—', 'غير معروف']]), f.who)}</select>` : ''}
    <select class="input" id="au-act" aria-label="العملية"><option value="">كل العمليات</option>${options(Object.entries(AUDIT_ACTS), f.act)}</select></div></div><div style="padding-top:14px">
    ${table(['الوقت', 'المستخدم', 'العملية', 'القسم / العنصر', 'قبل ← بعد', 'IP'], list.slice(0, 150).map(a => `<tr><td style="white-space:nowrap">${fmtDate(a.at, true)}</td><td>${a.by === 'system' || a.by === '—' ? `<span class="chip plain">${esc(userName(a.by))}</span>` : whoTag(a.by)}</td>
      <td><span class="chip ${['delete', 'login_fail', 'lock', 'user_del'].includes(a.act) ? 'bad' : ['perm', 'role', 'export', 'owner'].includes(a.act) ? 'warn' : 'plain'}">${esc(AUDIT_ACTS[a.act] || a.act)}</span></td><td>${esc(a.target)}</td>
      <td style="min-width:220px">${a.before || a.after ? `<div class="diff"><div class="b">${esc(show(a.before))}</div><div class="a">${esc(show(a.after))}</div></div>` : '—'}</td><td class="ltr num" style="font-size:12.5px">${esc(a.ip)}</td></tr>`))}</div>`,
    {pad:false, sub:`${list.length} عملية`, actions:own ? `<button class="btn btn-ghost btn-sm" data-act="audit-export">${ic('download')} تصدير</button>` : ''})}`;
};
AFTER.audit = () => { const w = $('#au-who'); if (w) w.onchange = () => { UI.auditF.who = w.value; renderAdmin(); }; $('#au-act').onchange = (e) => { UI.auditF.act = e.target.value; renderAdmin(); }; };
ACT['audit-export'] = () => { if (!isOwner()) return; const rows = [['الوقت', 'المستخدم', 'العملية', 'العنصر', 'قبل', 'بعد', 'IP'], ...S.audit.map(a => [fmtDate(a.at, true), userName(a.by), AUDIT_ACTS[a.act] || a.act, a.target, JSON.stringify(a.before || ''), JSON.stringify(a.after || ''), a.ip])];
  audit('export', 'سجل العمليات (Excel)', null, {الصفوف:rows.length - 1}); save(); const csv = toCSV(rows);
  openModal({title:'تصدير سجل العمليات', body:`<p class="muted" style="margin-bottom:12px">${rows.length - 1} عملية.</p><button class="btn btn-gold btn-sm" id="cp">${ic('copy')} نسخ البيانات</button>`, onMount:(m) => m.querySelector('#cp').onclick = () => copyText(csv.replace(/^﻿/, '').replace(/","/g, '\t').replace(/^"|"$/gm, ''))}); };

/* ---------- users, roles, permissions ---------- */
VIEWS.users = () => {
  const tab = UI.usersTab; const own = isOwner();
  const tabs = [['users', 'المستخدمون'], ['roles', 'الأدوار والصلاحيات'], ['branches', 'الفروع']];
  let body;
  if (tab === 'roles') body = rolesHTML();
  else if (tab === 'branches') body = panel('الفروع', `<div>${S.branches.map(b => `<div class="list-item">${ic('branch')}<div class="grow"><b>${esc(b.name)}</b><span>${S.users.filter(u => u.branch === b.id).length} موظفين · ${S.resources.filter(r => r.branch === b.id).length} مساحات</span></div></div>`).join('')}</div>
    <div class="panel-body"><p class="muted" style="font-size:14px">النظام مبني لدعم أكثر من فرع: لكل فرع مساحاته وأسعاره وموظفوه ومديره وتقاريره، ويُقيَّد الموظف بفرعه.</p>${own ? `<div class="toolbar" style="margin-top:10px"><input class="input" id="br-n" placeholder="اسم الفرع الجديد" aria-label="اسم الفرع"><button class="btn btn-ghost btn-sm" id="br-add">${ic('plus')} إضافة فرع</button></div>` : ''}</div>`, {pad:false});
  else body = panel('المستخدمون', table(['المستخدم', 'الدور', 'الحالة', 'التحقق بخطوتين', 'الفرع', 'صلاحيات خاصة', 'آخر دخول'], S.users.map(u => {
    const ovs = (u.overrides || []).length; const st = isLocked(u.email) ? ['مقفل مؤقتًا', 'bad'] : u.status === 'active' ? ['نشط', 'ok'] : u.status === 'invited' ? (new Date(u.inviteExpires) < new Date() ? ['دعوة منتهية', 'plain'] : ['دعوة مرسلة', 'info']) : ['موقوف', 'bad'];
    return `<tr class="click" data-act="open-user" data-id="${u.id}"><td>${av(u.name)} <b>${esc(u.name)}</b><span class="sub ltr" style="text-align:start">${esc(u.email)}</span></td><td>${esc(roleById(u.roleId)?.name)}${u.roleId === 'owner' ? ` <span class="chip">${ic('shield')}محمي</span>` : ''}</td>
    <td><span class="chip ${st[1]}">${st[0]}</span></td><td>${needs2FA(u) ? `<span class="chip ok">${u.twoFAMethod === 'sms' ? 'رسالة نصية' : 'تطبيق'}${mandatory2FA(u) ? ' · إلزامي' : ''}</span>` : '<span class="chip plain">اختياري — غير مفعّل</span>'}</td>
    <td>${esc(S.branches.find(b => b.id === u.branch)?.name || '')}</td><td>${ovs ? `<span class="chip info">${ovs}</span>` : '—'}</td><td>${u.lastLogin ? ago(u.lastLogin) : '—'}</td></tr>`; })),
    {pad:false, sub:'لا يُسمح بمشاركة حساب واحد بين أكثر من موظف', actions:can('users', 'add') ? `<button class="btn btn-gold btn-sm" data-act="user-invite">${ic('mail')} دعوة موظف</button>` : ''});
  return `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" class="${tab === k ? 'on' : ''}" data-act="users-tab" data-k="${k}">${l}</button>`).join('')}</div>
    ${own ? '' : `<div class="notice">${ic('lock')}<div>منح الصلاحيات وسحبها وإنشاء الأدوار متاح لمالك النظام فقط.${can('users', 'edit') ? ' يمكنك تعديل بيانات الموظفين وحالتهم ضمن صلاحيتك.' : ''}</div></div>`}${body}`;
};
AFTER.users = () => { const b = $('#br-add'); if (b) b.onclick = () => { const n = $('#br-n').value.trim(); if (!n) return; S.branches.push({id:uid('br'), name:n}); audit('settings', 'فرع جديد: ' + n); rerender(); toast('أُضيف الفرع'); }; };
ACT['users-tab'] = (el) => { UI.usersTab = el.dataset.k; renderAdmin(); };
function matrixHTML(getVal, {editable, cellClass = () => '', idp = 'm'}) {
  return `<div class="tbl-wrap"><table class="tbl matrix"><thead><tr><th>القسم</th>${ACTS.map(([, l]) => `<th style="font-size:11.5px">${l}</th>`).join('')}</tr></thead><tbody>
    ${MODULES.map(m => `<tr><td>${ic(m.icon, '')} ${m.ar}</td>${ACTS.map(([a]) => m.acts.includes(a) ? `<td class="${cellClass(m.k, a)}"><input type="checkbox" data-${idp}="${m.k}.${a}" ${getVal(m.k, a) ? 'checked' : ''} ${editable ? '' : 'disabled'} aria-label="${m.ar} — ${ACTS.find(x => x[0] === a)[1]}"></td>` : '<td class="na">·</td>').join('')}</tr>`).join('')}</tbody></table></div>`;
}
function rolesHTML() {
  const own = isOwner(); const rid = UI.roleSel || 'ops'; const r = roleById(rid) || S.roles[1];
  return `<div class="cols roles">${panel('الأدوار', `<div>${S.roles.map(x => `<div class="list-item" style="cursor:pointer;${x.id === r.id ? 'background:var(--gold-soft)' : ''}" data-act="role-sel" data-id="${x.id}"><div class="grow"><b>${esc(x.name)}</b><span>${S.users.filter(u => u.roleId === x.id).length} مستخدم · ${x.system ? 'دور أساسي' : 'دور مخصص'}</span></div></div>`).join('')}</div>`,
    {pad:false, actions:own ? `<button class="btn btn-gold btn-sm" data-act="role-new">${ic('plus')} دور جديد</button>` : ''})}
  ${panel(esc(r.name), r.id === 'owner' ? `<div class="notice">${ic('shield')}<div>المالك يملك جميع الصلاحيات دائمًا. لا يستطيع أي مدير أو موظف تعديل صلاحياته أو حذف حسابه، وتُنقل الملكية من الإعدادات فقط.</div></div>` :
    `<p class="muted" style="margin-bottom:12px">${esc(r.desc)}</p>
    <div class="setting" style="padding-top:0"><div><b>نطاق البيانات</b><span>ما يراه مستخدمو هذا الدور من الطلبات والعملاء والصفقات والحجوزات</span></div><select class="input" id="role-scope" ${own ? '' : 'disabled'} style="width:auto" aria-label="نطاق البيانات">${options([['all', 'كل الفروع'], ['branch', 'فرعه + غير المُسند + المُسند إليه'], ['assigned', 'المُسند إليه فقط']], r.scope || 'all')}</select></div>
    ${matrixHTML((mk, a) => r.perms.includes(mk + '.' + a), {editable:own, idp:'rp'})}
    ${own ? `<div class="toolbar" style="margin-top:14px"><button class="btn btn-gold btn-sm" data-act="role-save" data-id="${r.id}">حفظ صلاحيات الدور</button>${ROLE_DEFAULTS[r.id] ? `<button class="btn btn-ghost btn-sm" data-act="role-reset" data-id="${r.id}">${ic('refresh')} إعادة للوضع الافتراضي</button>` : ''}${!r.system ? `<button class="btn btn-danger btn-sm" data-act="role-del" data-id="${r.id}">${ic('trash')} حذف الدور</button>` : ''}</div>` : ''}`,
    {sub:r.id === 'owner' ? '' : 'تنطبق على كل من يحمل هذا الدور، ويمكن تخصيص كل موظف على حدة من ملفه.'})}</div>`;
}
ACT['role-sel'] = (el) => { UI.roleSel = el.dataset.id; renderAdmin(); };
ACT['role-save'] = (el) => { if (!isOwner()) return; const r = roleById(el.dataset.id); const before = r.perms.length; r.perms = $$('[data-rp]:checked').map(i => i.dataset.rp); r.scope = $('#role-scope').value; audit('perm', 'دور: ' + r.name, {عدد_الصلاحيات:before}, {عدد_الصلاحيات:r.perms.length, النطاق:{all:'الكل', branch:'الفرع', assigned:'المسندة فقط'}[r.scope]}); rerender(); toast('حُفظت صلاحيات الدور'); };
ACT['role-reset'] = (el) => { const r = roleById(el.dataset.id); confirmBox(`إعادة صلاحيات «${esc(r.name)}» إلى الوضع الافتراضي؟`, () => { r.perms = [...ROLE_DEFAULTS[r.id]]; audit('perm', 'دور: ' + r.name, null, {إعادة:'الوضع الافتراضي'}); rerender(); }, 'إعادة', false); };
ACT['role-del'] = (el) => { const r = roleById(el.dataset.id); if (S.users.some(u => u.roleId === r.id)) return toast('انقل مستخدمي هذا الدور إلى دور آخر قبل حذفه', true); confirmBox(`حذف الدور «${esc(r.name)}»؟`, () => { S.roles = S.roles.filter(x => x.id !== r.id); UI.roleSel = 'ops'; audit('perm', 'حذف دور: ' + r.name); rerender(); }); };
ACT['role-new'] = () => { if (!isOwner()) return;
  openModal({title:'دور جديد', sub:'مثل: موظف خدمة عملاء، مسؤول تسويق، مشرف دورات، مدير فرع', body:`<div class="form">${fld('rn-n', 'اسم الدور', inp('rn-n'))}${fld('rn-b', 'ابدأ بصلاحيات', `<select class="input" id="rn-b"><option value="">بدون صلاحيات</option>${options(S.roles.filter(r => r.id !== 'owner').map(r => [r.id, 'نسخ من: ' + r.name]))}</select>`)}${fld('rn-d', 'وصف', inp('rn-d'))}<button class="btn btn-gold" id="rn-s" style="justify-self:start">إنشاء</button></div>`,
    onMount:(m) => m.querySelector('#rn-s').onclick = () => { const n = m.querySelector('#rn-n').value.trim(); if (!n) return toast('اكتب اسم الدور', true); const base = roleById(m.querySelector('#rn-b').value); const r = {id:uid('role'), name:n, system:false, scope:base?.scope || 'assigned', desc:m.querySelector('#rn-d').value || 'دور مخصص', perms:base ? [...base.perms] : []}; S.roles.push(r); UI.roleSel = r.id; audit('perm', 'دور جديد: ' + n); closeModal(); rerender(); toast('أُنشئ الدور — حدّد صلاحياته الآن'); }}); };
ACT['open-user'] = (el) => openUser(userById(el.dataset.id));
function openUser(u) {
  const own = isOwner(); const target_owner = u.roleId === 'owner'; const self = u.id === me().id;
  const canEdit = !target_owner && (own || can('users', 'edit'));
  const today_ = today();
  const effective = (mk, a) => can(mk, a, Object.assign({}, u, {status:'active'}));
  const ovCls = (mk, a) => { const o = overrideFor(u, mk + '.' + a); return o === undefined ? '' : o ? 'ov' : 'ov minus'; };
  openModal({size:'xl', title:esc(u.name), sub:`<span class="ltr">${esc(u.email)}</span> · ${esc(roleById(u.roleId)?.name)}`, body:`
    ${target_owner && !self ? `<div class="notice">${ic('shield')}<div>حساب المالك محمي: لا يمكن تعديله أو إيقافه أو حذفه.</div></div>` : ''}
    <div class="detail user"><div style="display:grid;gap:14px;align-content:start">
      <div class="panel"><div class="panel-body" style="display:grid;gap:12px">
        ${fld('us-role', 'الدور الوظيفي', `<select class="input" id="us-role" ${canEdit && (own || u.roleId !== 'ops') ? '' : 'disabled'}>${options(S.roles.filter(r => r.id !== 'owner' || target_owner).filter(r => own || r.id !== 'ops' || u.roleId === 'ops').map(r => [r.id, r.name]), u.roleId)}</select>`)}
        ${fld('us-br', 'الفرع', `<select class="input" id="us-br" ${canEdit ? '' : 'disabled'}>${options(S.branches.map(b => [b.id, b.name]), u.branch)}</select>`)}
        ${fld('us-scope', 'نطاق البيانات', `<select class="input" id="us-scope" ${own && !target_owner ? '' : 'disabled'}>${options([['', 'حسب الدور (' + ({all:'الكل', branch:'الفرع', assigned:'المُسند فقط'}[roleById(u.roleId)?.scope || 'all']) + ')'], ['all', 'كل الفروع'], ['branch', 'فرعه + غير المُسند'], ['assigned', 'المُسند إليه فقط']], u.scope || '')}</select>`)}
        <div class="setting"><div><b>التحقق بخطوتين</b><span>${mandatory2FA(u) ? 'إلزامي لهذا الدور' : 'اختياري لهذا الدور'}${needs2FA(u) ? ` · ${(u.recovery || []).length} رموز استرداد متبقية` : ''}</span></div><label class="switchx"><input type="checkbox" id="us-2fa" ${needs2FA(u) ? 'checked' : ''} ${canEdit && !mandatory2FA(u) ? '' : 'disabled'} aria-label="التحقق بخطوتين"><span></span></label></div>
        ${fld('us-2fam', 'طريقة التحقق', `<select class="input" id="us-2fam" ${canEdit || self ? '' : 'disabled'}>${options([['app', 'تطبيق المصادقة'], ['sms', 'رسالة نصية للجوال']], u.twoFAMethod || 'app')}</select>`)}
        ${canEdit ? `<button class="btn btn-gold btn-sm" id="us-save" style="justify-self:start">حفظ</button>` : ''}</div></div>
      <div class="panel"><div class="panel-head"><h2>الحساب والأمان</h2></div><div class="panel-body" style="display:grid;gap:8px">
        ${isLocked(u.email) ? `<div class="notice bad">${ic('lock')}<div>الحساب مقفل مؤقتًا بعد محاولات دخول فاشلة — يُفتح تلقائيًا ${esc(lockLeft(u.email))}.</div></div>` : ''}
        ${u.status === 'invited' ? `<div class="notice ${new Date(u.inviteExpires) < new Date() ? 'warn' : ''}">${ic('mail')}<div>${new Date(u.inviteExpires) < new Date() ? 'انتهت صلاحية رابط الدعوة دون تفعيل.' : `دعوة مرسلة — صالحة حتى ${fmtDate(u.inviteExpires, true)}.`} <button class="lk" data-act="invite-resend" data-id="${u.id}">إعادة إرسال الدعوة</button></div></div>` : ''}
        ${(own || canEdit) && needs2FA(u) && !self ? `<button class="btn btn-ghost btn-sm" data-act="tfa-reset" data-id="${u.id}">${ic('shield')} إعادة ضبط التحقق بخطوتين</button>` : ''}
        ${canEdit && !self ? `${isLocked(u.email) ? `<button class="btn btn-ghost btn-sm" data-act="user-unlock" data-id="${u.id}">${ic('key')} فتح القفل الآن</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-act="user-toggle" data-id="${u.id}">${u.status === 'active' ? ic('ban') + ' إيقاف الحساب مؤقتًا' : ic('check') + ' تفعيل الحساب'}</button>` : ''}
        ${(own || canEdit) ? `<button class="btn btn-ghost btn-sm" data-act="user-pw" data-id="${u.id}">${ic('mail')} إرسال رابط إعادة تعيين كلمة المرور</button>` : ''}
        ${own || self ? `<button class="btn btn-ghost btn-sm" data-act="user-sessions" data-id="${u.id}">${ic('logout')} تسجيل الخروج من جميع الأجهزة</button>` : ''}
        ${!target_owner && can('users', 'delete') && !self ? `<button class="btn btn-danger btn-sm" data-act="user-del" data-id="${u.id}">${ic('trash')} حذف الحساب</button>` : ''}
        <p style="font-weight:600;margin-top:8px;font-size:14px">الجلسات النشطة</p>${(u.sessions || []).map(s => `<div class="list-item" style="padding:6px 0">${ic('device')}<div class="grow"><b style="font-size:13.5px">${esc(s.device)}</b><span class="ltr">${esc(s.ip)} · ${fmtDate(s.at, true)}</span></div></div>`).join('') || '<p class="muted" style="font-size:13px">لا توجد جلسات</p>'}
      </div></div></div>
    <div class="panel"><div class="panel-head"><div><h2>الصلاحيات الفعلية</h2><p>من الدور + التخصيص الفردي لهذا الموظف</p></div>${own && !target_owner ? `<div class="toolbar"><button class="btn btn-ghost btn-xs" data-act="user-copy" data-id="${u.id}">${ic('copy')} نسخ صلاحيات موظف آخر</button><button class="btn btn-ghost btn-xs" data-act="user-reset" data-id="${u.id}">${ic('refresh')} إعادة للوضع الافتراضي</button></div>` : ''}</div>
      <div class="panel-body">${target_owner ? '<p class="muted">جميع الصلاحيات.</p>' : `
        <div class="legend" style="margin-bottom:10px"><span><i style="background:var(--info-soft)"></i>ممنوحة له خصيصًا</span><span><i style="background:var(--bad-soft)"></i>مسحوبة منه خصيصًا</span><span>بدون لون: من الدور</span></div>
        ${matrixHTML(effective, {editable:own, cellClass:ovCls, idp:'up'})}
        ${own ? `<div class="row" style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;margin-top:14px">${fld('ov-from', 'صلاحية مؤقتة — من', inp('ov-from', '', 'date'))}${fld('ov-to', 'إلى', inp('ov-to', '', 'date'))}<button class="btn btn-gold btn-sm" id="ov-save">حفظ الصلاحيات</button></div><p class="hint muted" style="font-size:12.5px;margin-top:6px">اترك التاريخين فارغين لتكون دائمة. التاريخ ينطبق على الصلاحيات التي غيّرتها الآن.</p>` : ''}
        ${(u.overrides || []).length ? `<p style="font-weight:600;margin:14px 0 6px;font-size:14px">التخصيصات الحالية</p>${u.overrides.map((o, i) => { const active = (!o.from || o.from <= today_) && (!o.to || o.to >= today_);
          return `<div class="list-item" style="padding:6px 0"><span class="chip ${o.grant ? 'info' : 'bad'}">${o.grant ? 'منح' : 'سحب'}</span><div class="grow"><b style="font-size:13.5px">${esc(MODULES.find(m => m.k === o.perm.split('.')[0])?.ar)} — ${esc(ACTS.find(a => a[0] === o.perm.split('.')[1])?.[1])}</b><span>${o.from || o.to ? `من ${o.from || '—'} إلى ${o.to || '—'}` : 'دائمة'}${active ? '' : ' · غير سارية الآن'}</span></div>${own ? `<button class="btn btn-ghost btn-xs" data-act="ov-del" data-id="${u.id}" data-i="${i}">إزالة</button>` : ''}</div>`; }).join('')}` : ''}`}
      </div></div></div>`,
  onMount:(m) => {
    const sv = m.querySelector('#us-save'); if (sv) sv.onclick = () => {
      const before = {الدور:roleById(u.roleId).name, الفرع:u.branch}; const nr = m.querySelector('#us-role').value;
      if (nr !== u.roleId) { audit('role', u.name, {الدور:roleById(u.roleId).name}, {الدور:roleById(nr).name}); u.roleId = nr; }
      u.branch = m.querySelector('#us-br').value; if (!m.querySelector('#us-2fa').disabled) u.twoFA = m.querySelector('#us-2fa').checked; u.twoFAMethod = m.querySelector('#us-2fam').value;
      if (needs2FA(u) && !(u.recovery || []).length) u.recovery = recoveryCodes();
      const sc = m.querySelector('#us-scope'); if (!sc.disabled) { if (sc.value) u.scope = sc.value; else delete u.scope; }
      audit('edit', 'مستخدم: ' + u.name, before, {الدور:roleById(u.roleId).name, الفرع:u.branch}); rerender(); openUser(u); toast('حُفظ');
    };
    const ov = m.querySelector('#ov-save'); if (ov) ov.onclick = () => {
      const from = m.querySelector('#ov-from').value, to = m.querySelector('#ov-to').value; if (from && to && to < from) return toast('تاريخ النهاية قبل البداية', true);
      const role = roleById(u.roleId); const changes = [];
      $$('[data-up]', m).forEach(i => { const key = i.dataset.up; const cur = can(key.split('.')[0], key.split('.')[1], Object.assign({}, u, {status:'active'})); if (i.checked === cur) return;
        u.overrides = (u.overrides || []).filter(o => o.perm !== key);
        if (i.checked !== role.perms.includes(key) || from || to) u.overrides.push({perm:key, grant:i.checked, from, to, by:me().id});
        changes.push([key, cur, i.checked]); });
      if (!changes.length) return toast('لم تغيّر أي صلاحية');
      changes.forEach(([k, b, a]) => audit('perm', u.name, {[k]:b ? 'مسموح' : 'ممنوع'}, {[k]:(a ? 'مسموح' : 'ممنوع') + (from || to ? ` (مؤقت ${from || ''}→${to || ''})` : '')}));
      notify(u.id, 'تغيّرت صلاحياتك', `${changes.length} تغيير من مالك النظام`); rerender(); openUser(u); toast(`حُفظ ${changes.length} تغيير`);
    };
  }});
}
const ownerOnly = () => { if (isOwner()) return true; toast('هذه العملية متاحة لمالك النظام فقط', true); return false; };
ACT['ov-del'] = (el) => { if (!ownerOnly()) return; const u = userById(el.dataset.id); const [o] = u.overrides.splice(+el.dataset.i, 1); audit('perm', u.name, {[o.perm]:o.grant ? 'ممنوحة خصيصًا' : 'مسحوبة خصيصًا'}, {[o.perm]:'من الدور'}); rerender(); openUser(u); };
ACT['user-reset'] = (el) => { if (!ownerOnly()) return; const u = userById(el.dataset.id); confirmBox(`إزالة كل التخصيصات وإعادة صلاحيات ${esc(u.name)} إلى صلاحيات دوره؟`, () => { const n = (u.overrides || []).length; u.overrides = []; delete u.scope; audit('perm', u.name, {تخصيصات:n}, {تخصيصات:0}); rerender(); openUser(u); }, 'إعادة', false); };
ACT['user-copy'] = (el) => { if (!ownerOnly()) return; const u = userById(el.dataset.id);
  openModal({title:'نسخ صلاحيات موظف آخر', sub:`إلى ${esc(u.name)}`, body:`<div class="form">${fld('cp-from', 'انسخ من', `<select class="input" id="cp-from">${options(S.users.filter(x => x.id !== u.id && x.roleId !== 'owner').map(x => [x.id, `${x.name} — ${roleById(x.roleId).name}`]))}</select>`)}<p class="muted" style="font-size:13px">يُنسخ الدور والتخصيصات ونطاق الطلبات.</p><button class="btn btn-gold" id="cp-s" style="justify-self:start">نسخ</button></div>`,
    onMount:(m) => m.querySelector('#cp-s').onclick = () => { const src = userById(m.querySelector('#cp-from').value); const b = roleById(u.roleId).name; u.roleId = src.roleId; u.overrides = JSON.parse(JSON.stringify(src.overrides || [])); if (src.scope) u.scope = src.scope; else delete u.scope; audit('perm', u.name, {الدور:b}, {نُسخت_من:src.name}); rerender(); openUser(u); toast('نُسخت الصلاحيات'); }}); };
ACT['user-toggle'] = (el) => { const u = userById(el.dataset.id); if (u.roleId === 'owner') return; if (!isOwner() && !guard('users', 'edit')) return;
  if (u.status !== 'active') { u.status = 'active'; audit('user_activate', u.name, {الحالة:'موقوف'}, {الحالة:'نشط'}); rerender(); openUser(u); toast('فُعّل الحساب'); return; }
  const work = S.requests.filter(r => r.assignee === u.id && !['done', 'approved', 'rejected'].includes(r.status)).length + S.clients.filter(c => c.owner === u.id && !['won', 'lost'].includes(c.status)).length + S.deals.filter(d => d.owner === u.id && ['draft', 'pending', 'returned'].includes(d.status)).length;
  openModal({title:'إيقاف حساب ' + esc(u.name), sub:'يُوقف فورًا وتُنهى جميع جلساته', body:`<div class="form">${work ? `<div class="notice warn">${ic('alert')}<div>لدى ${esc(u.name)} <b>${work}</b> من الطلبات والعملاء والصفقات المفتوحة. انقلها إلى زميل حتى لا يتوقف العمل.</div></div>
    ${fld('tr-to', 'نقل العمل إلى', `<select class="input" id="tr-to">${options(S.users.filter(x => x.id !== u.id && x.status === 'active' && x.roleId !== 'owner').map(x => [x.id, `${x.name} — ${roleById(x.roleId).name}`]), S.users.find(x => x.id !== u.id && x.roleId === u.roleId && x.status === 'active')?.id)}</select>`)}` : '<p class="muted">لا يوجد عمل مفتوح مسند إليه.</p>'}
    ${fld('tr-why', 'سبب الإيقاف (يظهر في السجل)', inp('tr-why', '', 'text', 'placeholder="مثال: إجازة طويلة"'))}<button class="btn btn-danger" id="tr-go" style="justify-self:start">إيقاف الحساب${work ? ' ونقل العمل' : ''}</button></div>`,
    onMount:(m) => m.querySelector('#tr-go').onclick = () => {
      const to = m.querySelector('#tr-to')?.value; let n = 0;
      if (to) { S.requests.forEach(r => { if (r.assignee === u.id && !['done', 'approved', 'rejected'].includes(r.status)) { r.assignee = to; r.history.push({at:new Date().toISOString(), by:me().id, text:`نُقل من ${u.name} إلى ${userName(to)} (إيقاف حساب)`}); n++; } });
        S.clients.forEach(c => { if (c.owner === u.id && !['won', 'lost'].includes(c.status)) { c.owner = to; c.log.unshift({at:new Date().toISOString(), by:me().id, kind:'status', text:`نُقل إلى ${userName(to)}`}); n++; } });
        S.deals.forEach(d => { if (d.owner === u.id && ['draft', 'pending', 'returned'].includes(d.status)) { d.owner = to; n++; } });
        notify(to, 'نُقل إليك عمل زميل', `${n} عنصرًا من ${u.name}`, 'mine'); }
      u.status = 'suspended'; u.sessions = []; audit('user_suspend', u.name, {الحالة:'نشط'}, {الحالة:'موقوف', السبب:m.querySelector('#tr-why').value || '—', نُقل_إلى:to ? userName(to) : '—'});
      closeModal(); rerender(); toast(`أُوقف الحساب${n ? ` ونُقل ${n} عنصرًا إلى ${userName(to)}` : ''}`); }});
};
ACT['user-unlock'] = (el) => { const u = userById(el.dataset.id); u.locked = false; delete S.loginFails[u.email]; audit('user_activate', u.name, {الحالة:'مقفل'}, {الحالة:'نشط'}); rerender(); openUser(u); toast('فُتح الحساب'); };
ACT['user-pw'] = (el) => { const u = userById(el.dataset.id); audit('edit', u.name, null, {كلمة_المرور:'أُرسل رابط إعادة التعيين'}); save(); toast('أُرسل رابط إعادة التعيين إلى ' + u.email + ' (محاكاة)'); };
ACT['user-sessions'] = (el) => { const u = userById(el.dataset.id); const n = (u.sessions || []).length; u.sessions = []; audit('sessions', u.name, {الجلسات:n}, {الجلسات:0}); if (u.id === me().id) { S.session = null; save(); toast('سُجّل خروجك من جميع الأجهزة'); renderAdmin(); closeModal(); return; } rerender(); openUser(u); toast('أُنهيت جميع الجلسات'); };
ACT['user-del'] = (el) => { const u = userById(el.dataset.id); if (u.roleId === 'owner') return; if (!guard('users', 'delete')) return;
  confirmBox(`حذف حساب ${esc(u.name)} نهائيًا؟ الطلبات المسندة إليه تعود «غير مُسندة». يمكنك بدلًا من ذلك إيقافه مؤقتًا.`, () => { S.requests.forEach(r => { if (r.assignee === u.id) r.assignee = null; }); S.users = S.users.filter(x => x.id !== u.id); audit('user_del', u.name, {الدور:roleById(u.roleId)?.name}, null); closeModal(); rerender(); toast('حُذف الحساب'); }, 'حذف نهائي'); };

/* ---------- settings ---------- */
VIEWS.settings = () => {
  const own = isOwner(); const ed = can('settings', 'edit'); const tab = UI.settingsTab; const st = S.settings;
  const tabs = [['general', 'الموقع والتواصل'], ['seo', 'محركات البحث'], ['booking', 'الحجز والفوترة'], ['security', 'الأمان' + (own ? '' : ' 🔒')], ['backup', 'النسخ الاحتياطي' + (own ? '' : ' 🔒')], ['owner', 'الملكية' + (own ? '' : ' 🔒')]];
  const dis = ed ? '' : 'disabled'; let body;
  if (['security', 'backup', 'owner'].includes(tab) && !own) body = lockNote('هذا القسم متاح لمالك النظام فقط: إعدادات الحماية والنسخ الاحتياطي ونقل الملكية.');
  else if (tab === 'general') body = panel('بيانات الموقع والتواصل', `<div class="form">
    <div class="lang-split">${fld('st-n-ar', 'اسم الجهة<span class="tag">عربي</span>', inp('st-n-ar', st.name.ar, 'text', dis))}${fld('st-n-en', 'Name<span class="tag">English</span>', inp('st-n-en', st.name.en, 'text', dis + ' dir="ltr"'))}</div>
    <div class="lang-split">${fld('st-t-ar', 'الوصف المختصر<span class="tag">عربي</span>', inp('st-t-ar', st.tagline.ar, 'text', dis))}${fld('st-t-en', 'Tagline<span class="tag">English</span>', inp('st-t-en', st.tagline.en, 'text', dis + ' dir="ltr"'))}</div>
    <div class="row">${fld('st-ph', 'الجوال', inp('st-ph', st.phone, 'tel', dis + ' dir="ltr"'))}${fld('st-wa', 'رقم واتساب (دولي بدون +)', inp('st-wa', st.whatsapp, 'text', dis + ' dir="ltr"'))}</div>
    <div class="row">${fld('st-em', 'البريد العام', inp('st-em', st.email, 'email', dis + ' dir="ltr"'))}${fld('st-ne', 'بريد إشعارات الطلبات', inp('st-ne', st.notifyEmail, 'email', dis + ' dir="ltr"'))}</div>
    <div class="lang-split">${fld('st-a-ar', 'العنوان<span class="tag">عربي</span>', inp('st-a-ar', st.address.ar, 'text', dis))}${fld('st-a-en', 'Address<span class="tag">English</span>', inp('st-a-en', st.address.en, 'text', dis + ' dir="ltr"'))}</div>
    <div class="lang-split">${fld('st-h-ar', 'ساعات العمل<span class="tag">عربي</span>', inp('st-h-ar', st.hours.ar, 'text', dis))}${fld('st-h-en', 'Hours<span class="tag">English</span>', inp('st-h-en', st.hours.en, 'text', dis + ' dir="ltr"'))}</div>
    ${fld('st-map', 'رابط الموقع على الخريطة', inp('st-map', st.mapUrl, 'url', dis + ' dir="ltr"'))}
    <div class="row">${['x', 'instagram', 'linkedin', 'snapchat'].map(k => fld('st-s-' + k, {x:'X (تويتر)', instagram:'إنستغرام', linkedin:'لينكدإن', snapchat:'سناب شات'}[k], inp('st-s-' + k, st.social[k], 'url', dis + ' dir="ltr"'))).join('')}</div>
    <div class="setting"><div><b>اللون الرئيسي للهوية</b><span>يتغير في الموقع ولوحة التحكم فورًا</span></div><div class="toolbar"><input type="color" id="st-acc" value="${st.accent || '#C9A04A'}" ${dis} aria-label="اللون" style="width:48px;height:36px;border:0;background:none">${st.accent ? `<button class="btn btn-ghost btn-xs" id="st-acc-reset" ${dis}>اللون الأصلي</button>` : ''}</div></div>
    ${ed ? `<button class="btn btn-gold" id="st-save" style="justify-self:start">حفظ</button>` : lockNote('التعديل يتطلب صلاحية «تعديل» في الإعدادات.')}</div>`);
  else if (tab === 'seo') body = panel('تحسين الظهور في محركات البحث', `<div class="form">
    <div class="lang-split">${fld('seo-t-ar', 'عنوان الصفحة الرئيسية<span class="tag">عربي</span>', inp('seo-t-ar', st.seoTitle.ar, 'text', dis))}${fld('seo-t-en', 'Title<span class="tag">English</span>', inp('seo-t-en', st.seoTitle.en, 'text', dis + ' dir="ltr"'))}</div>
    <div class="lang-split">${fld('seo-d-ar', 'الوصف<span class="tag">عربي</span>', `<textarea class="input" id="seo-d-ar" ${dis}>${esc(st.seoDesc.ar)}</textarea>`)}${fld('seo-d-en', 'Description<span class="tag">English</span>', `<textarea class="input" id="seo-d-en" ${dis} dir="ltr">${esc(st.seoDesc.en)}</textarea>`)}</div>
    ${fld('seo-ga', 'معرّف Google Analytics', inp('seo-ga', st.ga, 'text', dis + ' dir="ltr"'), 'يُربط Google Search Console ويُنشأ sitemap.xml وrobots.txt تلقائيًا في النسخة النهائية')}
    ${ed ? `<button class="btn btn-gold" id="seo-save" style="justify-self:start">حفظ</button>` : ''}</div>`);
  else if (tab === 'booking') body = panel('الحجز والفوترة', `<div class="notice">${ic('info')}<div>مهلة الحجز المعلّق، ومن يؤكد، وسياسة الإلغاء، والساعات المجانية، وأيام الفوترة والتذكير — كلها في <a href="#admin" data-act="nav" data-k="rules">قواعد العمل</a>.</div></div>
    <div class="setting"><div><b>الدفع الإلكتروني</b><span>مدى وApple Pay والبطاقات — المرحلة الثانية. حاليًا: تحويل بنكي ورفع الإيصال من بوابة العميل.</span></div><span class="chip plain">لاحقًا</span></div>
    <div class="setting"><div><b>الربط مع هيئة الزكاة (فاتورة — المرحلة الثانية)</b><span>الفواتير بصيغة متوافقة: رقم تسلسلي، رمز QR، ختم تشفيري، وتسلسل التجزئة. الربط الفعلي مع منصة فاتورة يتم عند الإطلاق.</span></div><span class="chip warn">تجهيز</span></div>`);
  else if (tab === 'security') { const sc = S.security; const sw = (id, on, l, d) => `<div class="setting"><div><b>${l}</b><span>${d}</span></div><label class="switchx"><input type="checkbox" id="${id}" ${on ? 'checked' : ''} aria-label="${l}"><span></span></label></div>`;
    const nm = (id, v, l, d, mn, mx) => `<div class="setting"><div><b>${l}</b><span>${d}</span></div><input class="input num" type="number" id="${id}" min="${mn}" max="${mx}" value="${v}" style="width:90px" aria-label="${l}"></div>`;
    body = `${panel('الدخول والحسابات', `
    ${sw('sec-2fa', sc.require2FA, 'فرض التحقق بخطوتين', 'إلزامي للمالك والإدارة والمحاسبة، واختياري للمبيعات. تطبيق مصادقة أو رسالة نصية، مع 10 رموز استرداد. ثلاثة رموز خاطئة تلغي محاولة الدخول.')}
    ${nm('sec-lock', sc.lockAfter, 'قفل مؤقت بعد محاولات فاشلة', `عدد المحاولات خلال ${sc.lockWindow} دقيقة — يُقفل الحساب ${sc.lockMinutes} دقيقة، والرسالة عامة لا تكشف إن كان البريد مسجلًا`, 3, 10)}
    ${nm('sec-pw', sc.minPw, 'الحد الأدنى لطول كلمة المرور', 'مع حرف كبير ورقم ورمز، ولا يُسمح بإعادة آخر 5 كلمات مرور', 8, 32)}
    ${nm('sec-sess', sc.sessionMins, 'إنهاء الجلسة بعد عدم النشاط', 'بالدقائق', 5, 240)}
    ${nm('sec-reset', sc.resetMins, 'صلاحية رابط استعادة كلمة المرور', 'بالدقائق — يُستخدم مرة واحدة فقط', 10, 120)}
    ${nm('sec-inv', sc.inviteHours, 'صلاحية رابط دعوة الموظف', 'بالساعات', 1, 168)}
    ${sw('sec-alert', sc.alertNewLogin, 'تنبيه المالك عند دخول جديد', 'وعند محاولات الدخول المشبوهة')}`)}
    ${panel('حماية البيانات', `
    ${sw('sec-mask', sc.maskExports, 'إخفاء البيانات الشخصية في التصدير', 'تظهر أرقام الجوال والبريد مخفية جزئيًا في ملفات Excel، وتُسجَّل كل عملية تصدير في سجل العمليات')}
    ${sw('sec-ip', sc.ipRestrict, 'تقييد دخول لوحة التحكم بعناوين المكتب', 'اختياري — يسمح بالدخول من شبكة المكتب فقط')}
    <div class="setting"><div><b>عناوين IP المسموح بها</b><span>مثال: 85.154.12.0/24</span></div><input class="input ltr" id="sec-ips" value="${esc(sc.officeIps)}" style="width:180px" aria-label="عناوين IP"></div>
    <div class="setting"><div><b>استضافة البيانات</b><span>تُستضاف قاعدة البيانات والملفات داخل المملكة العربية السعودية وفق نظام حماية البيانات الشخصية</span></div><span class="chip ok">داخل المملكة</span></div>
    <button class="btn btn-gold" id="sec-save" style="margin-top:12px">حفظ</button>`)}
    ${panel('الجلسات النشطة لجميع المستخدمين', table(['المستخدم', 'الجهاز', 'IP', 'آخر نشاط', ''], S.users.flatMap(u => (u.sessions || []).map((s, i) => `<tr><td>${whoTag(u.id)}</td><td>${esc(s.device)}</td><td class="ltr">${esc(s.ip)}</td><td>${fmtDate(s.at, true)}</td><td>${u.id !== me().id ? `<button class="btn btn-danger btn-xs" data-act="kill-session" data-id="${u.id}" data-i="${i}">إنهاء الجلسة</button>` : '<span class="chip ok">جلستك</span>'}</td></tr>`))), {pad:false})}`; }
  else if (tab === 'backup') body = panel('النسخ الاحتياطي', `${table(['الوقت', 'النوع', 'الحجم', ''], S.backups.map(b => `<tr><td>${fmtDate(b.at, true)}</td><td>${b.kind}</td><td class="num">${b.size}</td><td><button class="btn btn-ghost btn-xs" data-act="bk-restore" data-id="${b.id}">استعادة</button></td></tr>`))}
    <div class="panel-body"><p class="muted" style="font-size:14px">نسخة تلقائية يومية الساعة 3 فجرًا تُحفظ لمدة 30 يومًا في موقع منفصل. لا يستطيع أي مستخدم غير المالك حذف النسخ الاحتياطية. كل تحديث يُختبر أولًا على بيئة تجريبية (Staging) مع خطة للرجوع للنسخة السابقة.</p></div>`, {pad:false, actions:`<button class="btn btn-gold btn-sm" data-act="bk-now">${ic('backup')} نسخة الآن</button>`});
  else body = panel('نقل ملكية النظام', `<div class="notice warn">${ic('alert')}<div>بعد النقل يصبح المستخدم المختار مالك النظام، ويتحول حسابك إلى «مدير العمليات». يتطلب رمز التحقق.</div></div>
    <div class="form" style="margin-top:14px">${fld('ow-to', 'المالك الجديد', `<select class="input" id="ow-to">${options(S.users.filter(u => u.roleId !== 'owner' && u.status === 'active').map(u => [u.id, u.name]))}</select>`)}${fld('ow-otp', 'رمز التحقق', inp('ow-otp', '', 'text', 'inputmode="numeric" dir="ltr" maxlength="6"'), 'الرمز التجريبي: ' + OTP)}<button class="btn btn-danger" id="ow-go" style="justify-self:start">نقل الملكية</button></div>`);
  return `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" class="${tab === k ? 'on' : ''}" data-act="settings-tab" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
};
ACT['settings-tab'] = (el) => { UI.settingsTab = el.dataset.k; renderAdmin(); };
AFTER.settings = () => {
  const g = (i) => $('#' + i)?.value.trim();
  const s1 = $('#st-save'); if (s1) s1.onclick = () => { const st = S.settings; const before = {الجوال:st.phone, البريد:st.email};
    Object.assign(st, {name:{ar:g('st-n-ar'), en:g('st-n-en')}, tagline:{ar:g('st-t-ar'), en:g('st-t-en')}, phone:g('st-ph'), whatsapp:g('st-wa').replace(/\D/g, ''), email:g('st-em'), notifyEmail:g('st-ne'), address:{ar:g('st-a-ar'), en:g('st-a-en')}, hours:{ar:g('st-h-ar'), en:g('st-h-en')}, mapUrl:g('st-map')});
    ['x', 'instagram', 'linkedin', 'snapchat'].forEach(k => st.social[k] = g('st-s-' + k));
    const acc = $('#st-acc').value; if (acc.toLowerCase() !== '#c9a04a') st.accent = acc;
    audit('settings', 'بيانات الموقع والتواصل', before, {الجوال:st.phone, البريد:st.email}); applyTheme(); rerender(); toast('حُفظت الإعدادات وظهرت في الموقع'); };
  const ar = $('#st-acc-reset'); if (ar) ar.onclick = () => { S.settings.accent = ''; audit('settings', 'اللون الرئيسي', null, {اللون:'الأصلي'}); applyTheme(); rerender(); };
  const ac = $('#st-acc'); if (ac) ac.oninput = () => { document.documentElement.style.setProperty('--gold', ac.value); document.documentElement.style.setProperty('--gold-2', ac.value); };
  const s2 = $('#seo-save'); if (s2) s2.onclick = () => { Object.assign(S.settings, {seoTitle:{ar:g('seo-t-ar'), en:g('seo-t-en')}, seoDesc:{ar:g('seo-d-ar'), en:g('seo-d-en')}, ga:g('seo-ga')}); audit('settings', 'إعدادات محركات البحث'); rerender(); toast('حُفظ'); };
  const s3 = $('#sec-save'); if (s3) s3.onclick = () => { const sc = S.security; const b = {...sc}; Object.assign(sc, {require2FA:$('#sec-2fa').checked, alertNewLogin:$('#sec-alert').checked, lockAfter:+g('sec-lock') || 5, minPw:+g('sec-pw') || 10, sessionMins:+g('sec-sess') || 30, resetMins:+g('sec-reset') || 30, inviteHours:+g('sec-inv') || 48, maskExports:$('#sec-mask').checked, ipRestrict:$('#sec-ip').checked, officeIps:g('sec-ips')});
    audit('settings', 'إعدادات الأمان', {قفل_بعد:b.lockAfter, خطوتين:b.require2FA ? 'نعم' : 'لا'}, {قفل_بعد:sc.lockAfter, خطوتين:sc.require2FA ? 'نعم' : 'لا'}); rerender(); toast('حُفظت إعدادات الأمان'); };
  const ow = $('#ow-go'); if (ow) ow.onclick = () => { if (g('ow-otp') !== OTP) return toast('رمز التحقق غير صحيح', true); const nu = userById(g('ow-to'));
    confirmBox(`نقل ملكية النظام إلى ${esc(nu.name)}؟ لا يمكن التراجع إلا بنقلها مرة أخرى من المالك الجديد.`, () => { const old = me(); old.roleId = 'ops'; nu.roleId = 'owner'; nu.overrides = []; audit('owner', 'ملكية النظام', {المالك:old.name}, {المالك:nu.name}); notify(nu.id, 'أصبحت مالك النظام', 'نُقلت إليك ملكية لوحة التحكم'); rerender(); toast('نُقلت الملكية'); }, 'نقل الملكية'); };
};
ACT['kill-session'] = (el) => { if (!ownerOnly()) return; const u = userById(el.dataset.id); const [s] = u.sessions.splice(+el.dataset.i, 1); audit('sessions', u.name, {جلسة:s.device}, null); rerender(); toast('أُنهيت الجلسة'); };
ACT['bk-now'] = () => { if (!ownerOnly()) return; S.backups.unshift({id:uid('bk'), at:new Date().toISOString(), size:'48 MB', kind:'يدوي — ' + me().name}); audit('backup', 'نسخة احتياطية يدوية'); rerender(); toast('أُنشئت نسخة احتياطية (محاكاة)'); };
ACT['bk-restore'] = (el) => { if (!ownerOnly()) return; const b = S.backups.find(x => x.id === el.dataset.id); confirmBox(`استعادة النسخة الاحتياطية بتاريخ ${fmtDate(b.at, true)}؟ في النسخة النهائية تُستعاد أولًا على البيئة التجريبية للتحقق.`, () => { audit('backup', 'استعادة نسخة', null, {النسخة:fmtDate(b.at, true)}); rerender(); toast('بدأت الاستعادة على البيئة التجريبية (محاكاة)'); }, 'استعادة', false); };
