/* وصل دائم — core: state, storage, i18n, permissions, audit, requests, UI helpers */
'use strict';

const STORE_KEY = 'wasl-daim-proto';
const VIEW_ONLY = !!window.VIEW_ONLY;
let S;
const UI = { view:'site', admin:'dashboard', portalTab:'requests', reqFilter:{q:'', type:'', status:'', who:''}, crmMode:'board', calRes:'r1', calWeek:0, contentTab:'slides', usersTab:'users', settingsTab:'general', notifTab:'feed', formOpenedAt:0 };

function loadState() {
  if (VIEW_ONLY) { // view-only copy: always the pristine demo data; only UI preferences persist
    S = seedState();
    try { const p = JSON.parse(localStorage.getItem(STORE_KEY + '-view') || '{}'); ['lang', 'theme', 'session', 'portal'].forEach(k => { if (p[k] !== undefined) S[k] = p[k]; }); } catch (e) { /* no storage */ }
    return;
  }
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { saved = null; }
  S = (saved && saved.v === 3) ? saved : seedState();
}
function save() {
  if (VIEW_ONLY) { try { localStorage.setItem(STORE_KEY + '-view', JSON.stringify({lang:S.lang, theme:S.theme, session:S.session, portal:S.portal})); } catch (e) { /* no storage */ } return; }
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
  catch (e) { toast('تعذّر الحفظ في المتصفح (المساحة ممتلئة). جرّب صورًا أصغر.', true); }
}
function resetData() {
  if (VIEW_ONLY) return;
  const lang = S.lang, theme = S.theme;
  S = seedState(); S.lang = lang; S.theme = theme; save();
  toast(S.lang === 'en' ? 'Demo data restored' : 'أُعيدت البيانات التجريبية');
  route();
}

/* ---------- small utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const curLang = () => UI.view === 'admin' ? 'ar' : S.lang;
const t = (k) => (STR[curLang()] && STR[curLang()][k]) || STR.ar[k] || k;
const L = (o, lang) => o == null ? '' : (typeof o === 'string' ? o : (o[lang || curLang()] || o.ar || ''));
const uid = (p = 'x') => p + Math.random().toString(36).slice(2, 8);
const isEn = () => curLang() === 'en';
const locale = () => isEn() ? 'en-GB' : 'ar-SA-u-nu-latn-ca-gregory';
function fmtDate(iso, withTime = false, lang) {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  if (isNaN(d)) return iso;
  const loc = (lang || curLang()) === 'en' ? 'en-GB' : 'ar-SA-u-nu-latn-ca-gregory';
  const o = {day:'numeric', month:'short', year:'numeric'};
  if (withTime) Object.assign(o, {hour:'numeric', minute:'2-digit'});
  return d.toLocaleString(loc, o);
}
const fmtTime = (iso) => new Date(iso).toLocaleTimeString(locale(), {hour:'numeric', minute:'2-digit'});
const money = (n) => Math.round(n || 0).toLocaleString('en-US');
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
function ago(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 6e4);
  if (m < 1) return 'الآن';
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.round(m / 60); if (h < 24) return `قبل ${h} ساعة`;
  const d = Math.round(h / 24); return d === 1 ? 'أمس' : `قبل ${d} يوم`;
}
const initials = (n) => (n || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('');
const maskPhone = (p) => p ? p.slice(0, 3) + '•••••' + p.slice(-2) : '';
const maskEmail = (e) => e ? e[0] + '•••@' + (e.split('@')[1] || '') : '';

/* ---------- toast & modal ---------- */
function toast(msg, bad = false) {
  const box = $('#toasts'); if (!box) return;
  const el = document.createElement('div'); el.className = 'toast' + (bad ? ' bad' : ''); el.textContent = msg; el.setAttribute('role', 'status');
  box.appendChild(el); setTimeout(() => el.remove(), 3200);
}
let modalReturn = null;
function openModal({title = '', sub = '', body = '', size = '', onMount = null}) {
  const m = $('#modal');
  modalReturn = document.activeElement;
  m.innerHTML = `<div class="modal-backdrop" data-act="close-modal"></div>
    <div class="modal-box ${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-head"><div><h3 id="modal-title">${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div>
      <button class="icon-btn" data-act="close-modal" aria-label="${t('close')}">${ic('close')}</button></div>
      <div class="modal-body">${body}</div></div>`;
  m.classList.add('open'); document.body.style.overflow = 'hidden';
  const f = m.querySelector('input:not([type=hidden]):not(.hp input),select,textarea,button:not([data-act=close-modal])');
  setTimeout(() => (f || m.querySelector('.modal-box')).focus?.(), 30);
  if (onMount) onMount(m);
  lockUI(m);
}
function closeModal() {
  const m = $('#modal'); m.classList.remove('open'); m.innerHTML = ''; document.body.style.overflow = '';
  if (modalReturn && modalReturn.focus) modalReturn.focus();
}
function confirmBox(text, onYes, yesLabel = 'تأكيد', danger = true) {
  openModal({title:isEn() ? 'Please confirm' : 'تأكيد العملية', body:`<p style="margin-bottom:20px">${text}</p>
    <div class="toolbar" style="justify-content:flex-end"><button class="btn btn-ghost btn-sm" data-act="close-modal">${isEn() ? 'Back' : 'تراجع'}</button>
    <button class="btn ${danger ? 'btn-danger' : 'btn-gold'} btn-sm" id="cf-yes">${yesLabel}</button></div>`,
    onMount:(m) => m.querySelector('#cf-yes').onclick = () => { closeModal(); onYes(); }});
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('نُسخ إلى الحافظة'); }
  catch (e) { toast('تعذّر النسخ تلقائيًا — حدّد النص وانسخه يدويًا', true); }
}

/* ---------- theme & language ---------- */
function applyTheme() {
  const root = document.documentElement;
  if (S.theme) root.setAttribute('data-theme', S.theme);
  const acc = S.settings.accent;
  if (acc) { root.style.setProperty('--gold', acc); root.style.setProperty('--gold-2', acc); root.style.setProperty('--gold-soft', acc + '22'); }
  else { root.style.removeProperty('--gold'); root.style.removeProperty('--gold-2'); root.style.removeProperty('--gold-soft'); }
}
function currentDark() {
  const a = document.documentElement.getAttribute('data-theme');
  if (a) return a === 'dark';
  return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
}
function toggleTheme() { S.theme = currentDark() ? 'light' : 'dark'; save(); applyTheme(); }
function applyLangDir(forceAr = false) {
  const lang = forceAr ? 'ar' : S.lang;
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = forceAr ? 'لوحة التحكم — وصل دائم' : L(S.settings.seoTitle);
  const md = $('meta[name=description]'); if (md) md.setAttribute('content', L(S.settings.seoDesc));
}

/* ---------- users & permissions ---------- */
const userById = (id) => S.users.find(u => u.id === id);
const roleById = (id) => S.roles.find(r => r.id === id);
const userName = (id) => id === 'system' ? 'النظام (الموقع)' : (userById(id)?.name || (id === '—' ? 'غير معروف' : '—'));
const me = () => S.session ? userById(S.session.userId) : null;
const isOwner = (u = me()) => !!u && u.roleId === 'owner';
function overrideFor(u, key) {
  const d = today();
  const o = (u.overrides || []).find(x => x.perm === key && (!x.from || x.from <= d) && (!x.to || x.to >= d));
  return o ? o.grant : undefined;
}
function can(mod, act, u = me()) {
  if (!u || u.status !== 'active') return false;
  if (u.roleId === 'owner') return true;
  const key = mod + '.' + act;
  const ov = overrideFor(u, key);
  if (ov !== undefined) return ov;
  return (roleById(u.roleId)?.perms || []).includes(key);
}
const scopeAssigned = (u = me()) => u && (u.scope || roleById(u.roleId)?.scope) === 'assigned';
function guard(mod, act, msg) {
  if (can(mod, act)) return true;
  toast(msg || 'لا تملك صلاحية تنفيذ هذه العملية. اطلبها من مالك النظام.', true);
  return false;
}
const fakeIp = () => '85.154.12.' + (40 + (S.users.findIndex(u => u.id === S.session?.userId) + 1));

/* ---------- audit & notifications ---------- */
const AUDIT_ACTS = {
  login:'تسجيل دخول', logout:'تسجيل خروج', login_fail:'محاولة دخول فاشلة', lock:'إيقاف حساب بسبب المحاولات', create:'إنشاء', edit:'تعديل', delete:'حذف',
  status:'تغيير حالة', assign:'إسناد', note:'ملاحظة داخلية', export:'تصدير بيانات', perm:'تغيير صلاحيات', role:'تغيير دور', user_add:'إضافة مستخدم',
  user_del:'حذف مستخدم', user_suspend:'إيقاف حساب', user_activate:'تفعيل حساب', sessions:'إنهاء الجلسات', content:'تعديل محتوى', price:'تعديل أسعار',
  booking:'حجز', contract:'عقد', payment:'تسجيل دفعة', settings:'تعديل إعدادات', backup:'نسخ احتياطي', owner:'نقل الملكية', file:'رفع ملف', crm:'تحديث عميل'
};
function audit(act, target, before = null, after = null, by) {
  S.audit.unshift({at:new Date().toISOString(), by:by || S.session?.userId || 'system', ip:by === 'system' ? 'موقع عام' : fakeIp(), act, target, before, after});
  if (S.audit.length > 500) S.audit.length = 500;
}
function notify(to, title, body = '', link = '') {
  S.notifs.unshift({id:uid('n'), to, at:new Date().toISOString(), read:false, title, body, link});
}
const myNotifs = () => S.notifs.filter(n => n.to === me()?.id);

/* ---------- business logic shared by site, portal and admin ---------- */
const resById = (id) => S.resources.find(r => r.id === id);
const activeBooking = (b) => b.status !== 'cancelled' && b.status !== 'rejected';
function bookingConflict(resourceId, start, end, people = 1, excludeId = null) {
  const r = resById(resourceId); if (!r) return null;
  const s = new Date(start), e = new Date(end);
  const over = S.bookings.filter(b => b.id !== excludeId && b.resourceId === resourceId && activeBooking(b) && new Date(b.start) < e && new Date(b.end) > s);
  if (r.kind === 'desk') { const used = over.reduce((n, b) => n + (+b.people || 1), 0); return used + (+people) > r.cap ? over : null; }
  return over.length ? over : null;
}
function bookingRange(v) {
  const unit = v.unit || 'hour';
  if (unit === 'hour') return {start:new Date(`${v.date}T${v.start || '09:00'}:00`), end:new Date(`${v.date}T${v.end || '10:00'}:00`)};
  if (unit === 'day') return {start:new Date(`${v.date}T08:00:00`), end:new Date(`${v.date}T22:00:00`)};
  const s = new Date(`${v.date}T08:00:00`), e = new Date(s); e.setMonth(e.getMonth() + (+v.months || 1)); return {start:s, end:e};
}
function bookingPrice(v) {
  const r = resById(v.resource); if (!r) return 0;
  const {start, end} = bookingRange(v); let p = 0;
  if (v.unit === 'hour') p = (r.rate.hour || r.rate.day / 8 || 0) * Math.max(0, (end - start) / 36e5);
  else if (v.unit === 'day') p = r.rate.day || (r.rate.hour || 0) * 8;
  else p = (r.rate.month || (r.rate.day || 0) * 22) * (+v.months || 1);
  const code = S.codes.find(c => c.active && c.code.toUpperCase() === String(v.code || '').trim().toUpperCase());
  if (code) p = p * (1 - code.pct / 100);
  return Math.round(p);
}
function routeAssignee(type) {
  const by = (roleId) => S.users.find(u => u.roleId === roleId && u.status === 'active')?.id || null;
  if (type === 'booking') return by('bookings') || by('staff');
  if (['incubator', 'event', 'contact'].includes(type)) return by('staff');
  return by('ops');
}
function upsertClient(r, assignee) {
  let c = S.clients.find(x => (r.email && x.email === r.email) || (r.phone && x.phone === r.phone));
  if (c) { c.log.unshift({at:new Date().toISOString(), by:'system', kind:'web', text:`طلب جديد من الموقع: ${REQ_TYPES[r.type].ar} (${r.id})`}); return c; }
  c = {id:uid('c'), name:r.name, phone:r.phone, email:r.email, company:r.data.company || r.data.org || '', service:r.type, source:r.source || 'web', status:'new',
       owner:assignee, nextFollow:today(), createdAt:new Date().toISOString(), log:[{at:new Date().toISOString(), by:'system', kind:'web', text:`أول تواصل عبر نموذج «${REQ_TYPES[r.type].ar}» (${r.id})`}], notes:''};
  S.clients.unshift(c); return c;
}
function createRequest(type, v, files = []) {
  const id = 'WD-' + (++S.seq);
  const assignee = routeAssignee(type);
  const data = Object.assign({}, v); ['name', 'phone', 'email', 'source', 'consent', 'website_hp'].forEach(k => delete data[k]);
  const r = {id, type, status:'new', assignee, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), name:v.name, phone:v.phone, email:v.email,
    source:v.source || 'web', data, files, notes:[], comms:[], history:[{at:new Date().toISOString(), by:'system', text:'استُلم الطلب من الموقع'}]};
  if (assignee) r.history.push({at:new Date().toISOString(), by:'system', text:`أُسند تلقائيًا إلى ${userName(assignee)} حسب قواعد التوزيع`});
  if (type === 'booking') {
    const {start, end} = bookingRange(v);
    S.bookings.push({id:uid('b'), reqId:id, resourceId:v.resource, start:start.toISOString(), end:end.toISOString(), name:v.name, phone:v.phone, email:v.email,
      people:+v.people || 1, status:'pending', code:v.code || '', price:bookingPrice(v), by:'web', createdAt:new Date().toISOString(), notes:v.notes || '', unit:v.unit});
  }
  if (type === 'event') {
    const ev = S.content.events.find(e => e.id === v.event);
    if (ev) { if (ev.taken < ev.seats) ev.taken++; else { r.data.waitlist = true; ev.waitlist = (ev.waitlist || 0) + 1; } }
  }
  S.requests.unshift(r);
  upsertClient(r, assignee);
  const label = REQ_TYPES[type].ar;
  if (assignee) notify(assignee, `أُسند إليك طلب جديد: ${label}`, `${id} — ${v.name}`, 'requests');
  S.users.filter(u => u.status === 'active' && (u.roleId === 'ops' || u.roleId === 'owner') && u.id !== assignee).forEach(u => notify(u.id, `طلب جديد: ${label}`, `${id} — ${v.name}`, 'requests'));
  (S.outbox = S.outbox || []).unshift({at:new Date().toISOString(), to:S.settings.notifyEmail, subject:`طلب جديد ${id} — ${label}`, channel:'email'},
    {at:new Date().toISOString(), to:v.email, subject:fillTpl('req_client', {name:v.name, ref:id}), channel:'email'});
  const cust = S.customers.find(c => c.email === v.email);
  if (cust) cust.notifs.unshift({at:new Date().toISOString(), text:`استلمنا طلبك ${id} (${label}).`});
  audit('create', id, null, {النوع:label, الإسناد:userName(assignee)}, 'system');
  save();
  return r;
}
function fillTpl(key, vars, lang = 'ar') {
  const tp = S.templates.find(x => x.key === key); if (!tp) return '';
  return tp[lang].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
function setReqStatus(r, status, by) {
  const before = REQ_STATUS[r.status].ar; r.status = status; r.updatedAt = new Date().toISOString();
  r.history.push({at:r.updatedAt, by:by || me()?.id, text:`غيّر الحالة إلى «${REQ_STATUS[status].ar}»`});
  audit('status', r.id, {الحالة:before}, {الحالة:REQ_STATUS[status].ar});
  const cust = S.customers.find(c => c.email === r.email);
  if (cust) cust.notifs.unshift({at:r.updatedAt, text:`تم تحديث حالة طلبك ${r.id} إلى «${REQ_STATUS[status].ar}».`});
  if (r.type === 'booking') {
    const b = S.bookings.find(x => x.reqId === r.id);
    if (b && status === 'approved') b.status = 'confirmed';
    if (b && status === 'rejected') b.status = 'rejected';
  }
}

/* ---------- export helper (CSV for Excel) ---------- */
function toCSV(rows) {
  return '﻿' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}
function exportDialog(title, rows, mod) {
  if (!guard(mod, 'export', 'لا تملك صلاحية تصدير البيانات.')) return;
  const csv = toCSV(rows);
  audit('export', title + ' (Excel)', null, {الصفوف:rows.length - 1});
  save();
  openModal({title:'تصدير: ' + esc(title), sub:`${rows.length - 1} صفًا — سُجّلت عملية التصدير في سجل العمليات.`, size:'wide', body:`
    <div class="notice" style="margin-bottom:14px">${ic('info')}<div>في النسخة النهائية يُنزَّل ملف Excel مباشرة. داخل النموذج الأولي انسخ البيانات والصقها في Excel أو Google Sheets.</div></div>
    <div class="tbl-wrap panel" style="max-height:300px;margin-bottom:14px"><table class="tbl"><thead><tr>${rows[0].map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.slice(1, 9).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="toolbar" style="justify-content:flex-end"><button class="btn btn-gold btn-sm" id="cp-csv">${ic('copy')} نسخ البيانات</button></div>`,
    onMount:(m) => m.querySelector('#cp-csv').onclick = () => copyText(csv.replace(/^﻿/, '').replace(/","/g, '\t').replace(/^"|"$/gm, ''))});
}
function tryPrint() { try { window.print(); } catch (e) { toast('الطباعة غير متاحة داخل المعاينة؛ تعمل في النسخة النهائية.'); } }

/* ---------- read a chosen image as a compact data URL ---------- */
function readImage(file, maxW = 1400) {
  return new Promise((res, rej) => {
    if (!file || !file.type.startsWith('image/')) return rej(new Error('type'));
    const fr = new FileReader();
    fr.onload = () => { const img = new Image(); img.onload = () => {
      const k = Math.min(1, maxW / img.width); const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      let out = c.toDataURL('image/webp', .8); if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', .8);
      res(out); }; img.onerror = rej; img.src = fr.result; };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}

/* ---------- view-only mode ---------- */
const VIEW_MSG = 'نسخة عرض فقط — التعديل غير متاح';
const BLOCKED_ACTS = new Set(['reset-data', 'req-export', 'req-decide', 'req-del', 'crm-export', 'booking-export', 'bk-status', 'contract-export', 'ev-pub', 'ev-export',
  'ce-del', 'ce-move', 'rep-export', 'audit-export', 'role-save', 'role-reset', 'role-del', 'ov-del', 'user-reset', 'user-toggle', 'user-unlock', 'user-pw',
  'user-sessions', 'user-del', 'kill-session', 'bk-now', 'bk-restore', 'p-cancel']);
const SAFE_IDS = new Set(['rq-q', 'rq-type', 'rq-who', 'au-who', 'au-act', 'cal-res', 'acct-switch']);
function lockUI(root) {
  if (!VIEW_ONLY || !root) return;
  root.querySelectorAll('button, input, select, textarea').forEach(el => {
    if (el.closest('form[data-form], #login-form, #otp-form, #fg, #pf')) return;
    if (SAFE_IDS.has(el.id)) return;
    const act = el.dataset.act;
    if (act && !BLOCKED_ACTS.has(act)) return;
    el.disabled = true; el.title = VIEW_MSG;
  });
}

/* ---------- routing ---------- */
const ACT = {};
function route() {
  const h = location.hash.replace('#', '');
  const view = h === 'admin' ? 'admin' : h === 'portal' ? 'portal' : 'site';
  const changed = view !== UI.view || !$('#app').children.length;
  UI.view = view;
  if (view === 'admin') { applyLangDir(true); renderAdmin(); }
  else if (view === 'portal') { applyLangDir(); renderPortal(); }
  else {
    applyLangDir();
    if (changed || !$('.site-header')) renderSite();
    if (h) { const el = document.getElementById(h); if (el) setTimeout(() => el.scrollIntoView({behavior:changed ? 'auto' : 'smooth'}), changed ? 30 : 0); }
    else if (changed) window.scrollTo(0, 0);
  }
}
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  if (VIEW_ONLY && BLOCKED_ACTS.has(el.dataset.act)) { e.preventDefault(); toast(VIEW_MSG, true); return; }
  if (el.tagName === 'A' && !el.getAttribute('href')?.startsWith('#')) return;
  if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault();
  fn(el, e);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#modal.open')) closeModal(); });
ACT['close-modal'] = closeModal;
ACT['toggle-theme'] = (el) => { toggleTheme(); $$('[data-act="toggle-theme"]').forEach(b => { const svg = b.querySelector('svg'); if (svg) svg.outerHTML = ic(currentDark() ? 'sun' : 'moon'); }); };
ACT['reset-data'] = () => confirmBox(isEn() ? 'Restore all demo data? Your changes in this browser will be lost.' : 'إعادة كل البيانات التجريبية؟ ستُفقد تعديلاتك في هذا المتصفح.', resetData, isEn() ? 'Restore' : 'إعادة');
ACT['go'] = (el) => { location.hash = el.dataset.to; };
window.addEventListener('hashchange', route);
