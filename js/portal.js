/* وصل دائم — client portal: company dashboard, live room booking, bookings, contracts, invoices & receipts, requests, documents, company users, profile */
'use strict';

const P_TABS = [
  ['home', 'grid', 'لوحة التحكم', 'Dashboard', () => true],
  ['book', 'calendar', 'حجز قاعة', 'Book a room', () => custCan('book')],
  ['bookings', 'clock', 'حجوزاتي', 'My bookings', () => custCan('book') || custCan('view')],
  ['contracts', 'contract', 'العقود', 'Contracts', () => true],
  ['invoices', 'doc', 'الفواتير', 'Invoices', () => custCan('finance')],
  ['requests', 'inbox', 'الطلبات', 'Requests', () => true],
  ['company', 'office', 'بيانات الشركة', 'Company details', () => true],
  ['team', 'users', 'مستخدمو المنشأة', 'Company users', () => custCan('manage')],
  ['notifs', 'bell', 'الإشعارات', 'Notifications', () => true],
  ['profile', 'shield', 'الملف الشخصي والأمان', 'Profile & security', () => true]
];
const pNotice = (cls, icon, html) => `<div class="notice ${cls}">${ic(icon)}<div>${html}</div></div>`;
const pPanel = (title, body, actions = '', sub = '') => `<section class="panel"><div class="panel-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${actions ? `<div class="toolbar">${actions}</div>` : ''}</div>${body}</section>`;
const pTable = (heads, rows, empty) => `<div class="tbl-wrap"><table class="tbl"><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${heads.length}" class="empty">${empty}</td></tr>`}</tbody></table></div>`;
const chipOf = (map, k) => `<span class="chip ${map[k]?.cls || 'plain'}">${esc(L(map[k]) || k)}</span>`;
const dd = (iso) => esc(dualDate(iso));
const hhmm = (iso) => fmtTime(iso);
const coBookings = (co) => S.bookings.filter(b => b.companyId === co.id).sort((a, b) => b.start.localeCompare(a.start));
const coContracts = (co) => S.contracts.filter(k => k.companyId === co.id);
const holdLeft = (b) => { const ms = new Date(b.holdUntil) - new Date(); if (ms <= 0) return tt('انتهت المهلة', 'expired'); const h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4); return `${h}:${String(m).padStart(2, '0')}`; };

function renderPortal() {
  const c = portalUser();
  if (!c) { UI.loginFor = 'portal'; if (location.hash !== '#login') location.replace('#login'); else renderPage('login'); return; }
  const co = portalCompany();
  const tabs = P_TABS.filter(x => x[4]());
  if (!tabs.find(x => x[0] === UI.portalTab)) UI.portalTab = 'home';
  const tab = UI.portalTab; const unread = c.notifs.filter(n => !n.read).length;
  const body = (P_VIEWS[tab] || P_VIEWS.home)(c, co);
  $('#app').innerHTML = headerHTML() + `<main class="portal" data-page="portal">
    <section class="portal-head"><div class="wrap ph-in"><div><span class="kicker">${esc(t('portal'))}</span><h1>${esc(companyName(co))}</h1>
      <p>${chipOf(COMPANY_STATUS, co.status)} <span class="muted">${esc(c.name)} · ${esc(L(COMPANY_ROLES[c.companyRole]))}</span></p></div>
      ${custCan('book') && co.status === 'verified' ? `<button class="btn btn-gold" data-act="p-go" data-k="book">${ic('calendar')} ${esc(tt('احجز قاعة', 'Book a room'))}</button>` : ''}</div></section>
    <div class="wrap portal-in"><nav class="p-nav" aria-label="${esc(t('portal'))}">${tabs.map(([k, i, ar, en]) => `<a href="#portal" class="${k === tab ? 'on' : ''}" data-act="p-go" data-k="${k}" ${k === tab ? 'aria-current="page"' : ''}>${ic(i)}<span>${esc(isEn() ? en : ar)}</span>${k === 'notifs' && unread ? `<span class="cnt">${unread}</span>` : ''}${k === 'invoices' && companyInvoices(co.id).some(i => invStatus(i) === 'overdue') ? '<span class="dot-b"></span>' : ''}</a>`).join('')}
      <button class="p-out" data-act="p-out">${ic('logout')}<span>${esc(t('sign_out'))}</span></button></nav>
    <div class="p-body" id="pbody">${body}</div></div></main>` + footerHTML();
  bindHeader();
  if (P_AFTER[tab]) P_AFTER[tab](c, co);
  if (tab === 'notifs') { c.notifs.forEach(n => n.read = true); save(); }
  lockUI($('main'));
}
const P_VIEWS = {}, P_AFTER = {};
ACT['p-go'] = (el) => {
  $('#drawer')?.classList.remove('open'); $$('.acct-menu').forEach(m => m.hidden = true); closeModal();
  UI.portalTab = el.dataset.k; if (el.dataset.res) { UI.pb = Object.assign(UI.pb || {}, {room:el.dataset.res, branch:resById(el.dataset.res).branch, sel:null}); }
  if (!portalUser()) { UI.loginFor = 'portal'; location.hash = 'login'; return; }
  if (location.hash !== '#portal') location.hash = 'portal'; else { renderPortal(); window.scrollTo(0, 0); }
};
ACT['p-out'] = () => { const c = portalUser(); if (c) audit('portal', c.name, null, {العملية:'تسجيل خروج'}, 'system'); S.portal = null; save(); toast(tt('سُجّل خروجك', 'Signed out')); location.hash = ''; renderSite(); window.scrollTo(0, 0); };
ACT['p-demo'] = () => { location.hash = 'login'; };

/* ---------- dashboard ---------- */
P_VIEWS.home = (c, co) => {
  const ks = coContracts(co).filter(k => ['active', 'expiring', 'awaiting'].includes(contractStatus(k)));
  const invs = companyInvoices(co.id).filter(i => i.status !== 'draft');
  const overdue = invs.filter(i => invStatus(i) === 'overdue');
  const sched = ks.filter(k => k.status !== 'awaiting').flatMap(k => contractSchedule(k).filter(p => p.from > today()).map(p => ({status:'draft', total:r2(p.net + vatOf(p.net)), period:{from:p.from}}))).sort((a, b) => a.period.from.localeCompare(b.period.from));
  const nextInv = invs.filter(i => ['issued', 'partial'].includes(invStatus(i))).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
    || S.invoices.filter(i => i.companyId === co.id && i.status === 'draft').sort((a, b) => (a.period?.from || '').localeCompare(b.period?.from || ''))[0] || sched[0];
  const quota = freeQuota(co.id), used = freeUsed(co.id);
  const cr = co.docs.find(d => d.type === 'cr'); const crDays = cr?.expiry ? daysBetween(today(), cr.expiry) : null;
  const up = coBookings(co).filter(b => ['pending', 'confirmed'].includes(b.status) && new Date(b.end) > new Date()).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 4);
  const fin = custCan('finance');
  const alerts = [
    co.status === 'suspended' ? pNotice('bad', 'ban', `<b>${esc(tt('الحساب معلّق', 'Account suspended'))}</b> — ${esc(co.suspendReason || '')}. ${esc(tt('لا يمكن إنشاء حجوزات أو صفقات جديدة حتى تسوية الوضع. تواصل مع المحاسبة.', 'No new bookings or deals until this is settled. Please contact accounts.'))}`) : '',
    overdue.length && fin ? pNotice('bad', 'alert', `<b>${esc(tt(`لديك ${overdue.length} فاتورة متأخرة`, `${overdue.length} overdue invoice(s)`))}</b> — ${esc(tt('بمبلغ', 'totalling'))} <b class="num">${sar(overdue.reduce((n, i) => n + invOpen(i), 0))}</b> ${esc(t('sar'))}. <a href="#portal" data-act="p-go" data-k="invoices">${esc(tt('ادفع وارفع الإيصال', 'Pay and upload the receipt'))}</a>`) : '',
    co.status === 'pending' ? pNotice('warn', 'clock', `<b>${esc(tt('منشأتك قيد التحقق', 'Your company is being verified'))}</b> — ${esc(tt('ارفع المستندات المطلوبة ليُفعَّل حجز القاعات أونلاين وعروض الأسعار والفوترة.', 'Upload the required documents to activate online booking, quotes and invoicing.'))} <a href="#portal" data-act="p-go" data-k="company">${esc(tt('المستندات', 'Documents'))}</a>`) : '',
    crDays != null && crDays <= 30 ? pNotice(crDays < 0 ? 'bad' : 'warn', 'idcard', `<b>${esc(crDays < 0 ? tt('انتهى السجل التجاري', 'Your CR has expired') : tt(`السجل التجاري ينتهي بعد ${crDays} يومًا`, `Your CR expires in ${crDays} days`))}</b> — ${esc(tt('ارفع النسخة المجددة لتجنب إيقاف الخدمات.', 'Upload the renewed copy to avoid service interruption.'))} <a href="#portal" data-act="p-go" data-k="company">${esc(tt('تحديث', 'Update'))}</a>`) : '',
    co.pendingChange ? pNotice('', 'info', esc(tt(`طلب تعديل «${co.pendingChange.label}» بانتظار اعتماد الإدارة.`, `Your change to "${co.pendingChange.label}" is awaiting approval.`))) : '',
    ...ks.filter(k => contractStatus(k) === 'expiring').map(k => pNotice('warn', 'refresh', `${esc(tt(`عقد ${L(resById(k.resourceId).name)} ينتهي بعد ${daysBetween(today(), k.end)} يومًا`, `Your ${L(resById(k.resourceId).name)} contract ends in ${daysBetween(today(), k.end)} days`))}. <button class="lk" data-act="p-renew" data-id="${k.id}">${esc(tt('اطلب التجديد بخصم حتى 15%', 'Request renewal — up to 15% off'))}</button>`))
  ].filter(Boolean).join('');
  const tile = (l, v, s = '', i = '') => `<div class="tile"><div class="l">${i ? ic(i) : ''}${esc(l)}</div><div class="v num">${v}</div>${s ? `<div class="d">${s}</div>` : ''}</div>`;
  return `${alerts}<div class="tiles">
    ${tile(tt('العقود السارية', 'Active contracts'), ks.length, ks[0] ? esc(tt('أقرب انتهاء: ', 'Next end: ') + fmtDate(ks.map(k => k.end).sort()[0])) : '', 'contract')}
    ${fin ? tile(tt('الفاتورة القادمة', 'Next invoice'), nextInv ? sar(nextInv.status === 'draft' ? nextInv.total : invOpen(nextInv)) : '—', nextInv ? esc((nextInv.status === 'draft' ? tt('تصدر ', 'Issued ') + fmtDate(nextInv.period?.from) : tt('تستحق ', 'Due ') + fmtDate(nextInv.dueDate))) : '', 'doc') : ''}
    ${fin ? tile(tt('الرصيد المستحق', 'Balance due'), sar(companyBalance(co.id)), co.credit ? esc(tt(`رصيد دائن ${sar(co.credit)}`, `Credit ${sar(co.credit)}`)) : esc(t('sar')), 'coins') : ''}
    ${tile(tt('ساعات القاعات هذا الشهر', 'Meeting hours this month'), `${used}<small>/${quota}</small>`, `<span class="meter"><i style="width:${Math.min(100, quota ? used / quota * 100 : 0)}%"></i></span>${used > quota ? esc(tt(` ${r2(used - quota)} ساعة إضافية تُفوتر`, ` ${r2(used - quota)} extra h billed`)) : esc(tt(` متبقٍ ${r2(Math.max(0, quota - used))} ساعة`, ` ${r2(Math.max(0, quota - used))} h left`))}`, 'clock')}</div>
  <div class="cols even">${pPanel(esc(tt('الحجوزات القادمة', 'Upcoming bookings')), up.length ? `<div>${up.map(b => `<div class="list-item"><span class="date-badge"><b class="num">${new Date(b.start).getDate()}</b><span>${esc(new Date(b.start).toLocaleDateString(isEn() ? 'en' : 'ar-SA-u-nu-latn-ca-gregory', {month:'short'}))}</span></span>
      <div class="grow"><b>${esc(L(resById(b.resourceId).name))}</b><span>${hhmm(b.start)} – ${hhmm(b.end)} · ${esc(fmtHijri(b.start.slice(0, 10)))}</span></div>${chipOf(BOOKING_STATUS, b.status)}${b.status === 'pending' ? `<span class="chip warn num" title="${esc(tt('الوقت المتبقي للحجز المؤقت', 'Hold time left'))}">${ic('clock')}${holdLeft(b)}</span>` : ''}</div>`).join('')}</div>`
      : `<div class="panel-body"><p class="muted">${esc(tt('لا توجد حجوزات قادمة.', 'No upcoming bookings.'))}</p></div>`, custCan('book') && co.status === 'verified' ? `<button class="btn btn-ghost btn-sm" data-act="p-go" data-k="book">${ic('plus')} ${esc(tt('حجز جديد', 'New booking'))}</button>` : '')}
    ${ks.length ? pPanel(esc(tt('اشتراكك', 'Your subscription')), `<div>${ks.map(k => { const r = resById(k.resourceId); const left = Math.max(0, daysBetween(today(), k.end)); const tot = Math.max(1, daysBetween(k.start, k.end));
      return `<div class="list-item"><span class="ic-b">${ic(r.kind === 'desk' ? 'desk' : 'office')}</span><div class="grow"><b>${esc(L(r.name))}${k.qty > 1 ? ` ×${k.qty}` : ''}</b><span>${esc(tt('حتى', 'until'))} ${dd(k.end)}</span><span class="meter"><i style="width:${100 - left / tot * 100}%"></i></span></div>${chipOf(CONTRACT_STATUS, contractStatus(k))}
        ${custCan('manage') && k.status !== 'awaiting' ? `<button class="btn btn-ghost btn-xs" data-act="p-renew" data-id="${k.id}">${ic('refresh')} ${esc(tt('تجديد', 'Renew'))}</button>` : ''}</div>`; }).join('')}</div>`)
      : pPanel(esc(tt('ابدأ اشتراكك', 'Start your membership')), `<div class="panel-body"><p class="muted" style="margin-bottom:14px">${esc(tt('لا يوجد عقد ساري بعد. اطلب عرض سعر لمكتب أو مقاعد، أو احجز زيارة للمكان.', 'No active contract yet. Request a quote, or book a visit.'))}</p>
        <div class="toolbar"><button class="btn btn-gold" data-act="open-form" data-form="quote">${esc(tt('اطلب عرض سعر', 'Request a quote'))}</button><button class="btn btn-ghost" data-act="open-form" data-form="visit">${esc(tt('احجز زيارة', 'Book a visit'))}</button><a class="btn btn-ghost" href="#workspaces">${esc(tt('تصفح المساحات', 'Browse spaces'))}</a></div></div>`)}</div>`;
};

/* ---------- live room booking ---------- */
UI.pb = {branch:'main', room:'', day:'', start:null, hours:1, people:2, notes:''};
P_VIEWS.book = (c, co) => {
  const R = S.rules.booking; const P = UI.pb;
  if (co.status !== 'verified') return pNotice(co.status === 'suspended' ? 'bad' : 'warn', 'lock', `${esc(co.status === 'suspended' ? tt('الحجز متوقف لأن الحساب معلّق.', 'Booking is paused because the account is suspended.') : tt('يُفعَّل حجز القاعات أونلاين بعد التحقق من مستندات المنشأة.', 'Online booking is activated once your company documents are verified.'))} <a href="#portal" data-act="p-go" data-k="company">${esc(tt('المستندات', 'Documents'))}</a>`);
  const rooms = S.resources.filter(r => R.onlineKinds.includes(r.kind) && r.branch === P.branch && !r.maintenance);
  if (!rooms.find(r => r.id === P.room)) P.room = rooms[0]?.id || '';
  const days = bookableDays(); if (!days.includes(P.day)) { P.day = days.find(d => d > today()) || days[0]; P.start = null; }
  const room = resById(P.room); const hrs = Array.from({length:R.workEnd - R.workStart}, (_, i) => R.workStart + i);
  const pending = S.bookings.filter(b => b.companyId === co.id && b.status === 'pending').length;
  const sel = (h) => P.start != null && h >= P.start && h < P.start + P.hours;
  const okRange = P.start != null && P.start + P.hours <= R.workEnd && Array.from({length:P.hours}, (_, k) => slotState(P.room, P.day, P.start + k, co.id)).every(s => s === 'free');
  const est = P.start != null ? bookingEstimate(P.room, P.hours, co.id, P.day.slice(0, 7)) : null;
  const dayBtn = (d) => { const dt = toDate(d); return `<button type="button" class="day ${d === P.day ? 'on' : ''}" data-act="pb-day" data-d="${d}" aria-pressed="${d === P.day}"><span>${esc(dt.toLocaleDateString(isEn() ? 'en' : 'ar-SA-u-nu-latn-ca-gregory', {weekday:'short'}))}</span><b class="num">${dt.getDate()}</b><span>${esc(dt.toLocaleDateString(isEn() ? 'en' : 'ar-SA-u-nu-latn-ca-gregory', {month:'short'}))}</span></button>`; };
  return `<div data-viewsafe>${pending >= R.maxPending ? pNotice('warn', 'alert', esc(tt(`لديك ${pending} طلبات بانتظار التأكيد — الحد الأقصى ${R.maxPending}. انتظر تأكيدها أو ألغِ أحدها.`, `You have ${pending} pending requests — the maximum is ${R.maxPending}.`))) : ''}
  <div class="pb-grid"><div class="panel"><div class="panel-body" style="display:grid;gap:16px">
    <div class="row">${fld('pb-branch', esc(tt('الفرع', 'Branch')), `<select class="input" id="pb-branch">${S.branches.map(b => `<option value="${b.id}" ${b.id === P.branch ? 'selected' : ''}>${esc(branchName(b.id))}</option>`).join('')}</select>`)}
      ${fld('pb-room', esc(tt('القاعة', 'Room')), `<select class="input" id="pb-room">${rooms.map(r => `<option value="${r.id}" ${r.id === P.room ? 'selected' : ''}>${esc(L(r.name))} — ${esc(tt(`حتى ${r.cap}`, `up to ${r.cap}`))} · ${money(r.rate.hour)} ${esc(t('sar'))}/${esc(t('hour'))}</option>`).join('')}</select>`)}</div>
    <div><p class="lbl">${esc(tt('اليوم', 'Day'))} <span class="muted">— ${esc(tt(`حتى ${R.daysAhead} يومًا، عدا الجمعة والسبت والإجازات`, `up to ${R.daysAhead} days; no Fri/Sat or holidays`))}</span></p><div class="days" role="group">${days.map(dayBtn).join('')}</div></div>
    <div><p class="lbl">${esc(tt('الوقت', 'Time'))} <span class="muted">— ${dd(P.day)}</span></p>
      <div class="slots">${hrs.map(h => { const s = slotState(P.room, P.day, h, co.id); const on = sel(h) && s === 'free';
        const lab = {free:tt('متاح', 'Free'), held:tt('محجوز مؤقتًا', 'On hold'), booked:tt('محجوز', 'Booked'), past:tt('مضى', 'Past'), mine:tt('حجزك', 'Yours'), 'mine-held':tt('طلبك', 'Your request')}[s];
        return `<button type="button" class="slot ${s} ${on ? 'sel' : ''} ${sel(h) && s !== 'free' ? 'clash' : ''}" data-act="pb-slot" data-h="${h}" ${s === 'free' ? '' : 'disabled'} aria-pressed="${on}" aria-label="${h}:00 ${esc(lab)}"><b class="num">${h}:00</b><span>${esc(lab)}</span></button>`; }).join('')}</div>
      <div class="legend" style="margin-top:10px"><span><i class="lg free"></i>${esc(tt('متاح', 'Free'))}</span><span><i class="lg sel"></i>${esc(tt('اختيارك', 'Your pick'))}</span><span><i class="lg held"></i>${esc(tt('محجوز مؤقتًا لعميل آخر', 'Held by another client'))}</span><span><i class="lg booked"></i>${esc(tt('محجوز', 'Booked'))}</span></div></div>
    <div class="row">${fld('pb-hours', esc(tt('المدة', 'Duration')), `<select class="input" id="pb-hours">${Array.from({length:R.maxH - R.minH + 1}, (_, i) => R.minH + i).map(h => `<option value="${h}" ${h === P.hours ? 'selected' : ''}>${h} ${esc(h === 1 ? tt('ساعة', 'hour') : h === 2 ? tt('ساعتان', 'hours') : tt('ساعات', 'hours'))}</option>`).join('')}</select>`)}
      ${fld('pb-people', esc(tt('عدد الحضور', 'Attendees')), `<input class="input num" id="pb-people" type="number" min="1" max="${room?.cap || 1}" value="${Math.min(P.people, room?.cap || 1)}">`)}</div>
    ${fld('pb-notes', esc(tt('ملاحظات (اختياري)', 'Notes (optional)')), `<input class="input" id="pb-notes" value="${esc(P.notes)}" placeholder="${esc(tt('مثال: نحتاج شاشة عرض وقهوة لـ 6 أشخاص', 'e.g. display and coffee for 6'))}">`)}</div></div>
  <aside class="panel pb-sum"><div class="panel-head"><h2>${esc(tt('ملخص الحجز', 'Booking summary'))}</h2></div><div class="panel-body">
    ${P.start == null ? `<p class="muted">${esc(tt('اختر وقت البداية من الجدول.', 'Pick a start time in the grid.'))}</p>` : `
    <dl class="kv"><dt>${esc(tt('القاعة', 'Room'))}</dt><dd>${esc(L(room.name))}</dd><dt>${esc(tt('التاريخ', 'Date'))}</dt><dd>${dd(P.day)}</dd><dt>${esc(tt('الوقت', 'Time'))}</dt><dd class="num">${P.start}:00 – ${P.start + P.hours}:00</dd></dl>
    ${okRange ? '' : pNotice('bad', 'alert', esc(P.start + P.hours > R.workEnd ? tt(`ينتهي الدوام الساعة ${R.workEnd}:00 — قلّل المدة.`, `Working hours end at ${R.workEnd}:00.`) : tt('جزء من المدة غير متاح. اختر وقتًا آخر أو قلّل المدة.', 'Part of this time is not available.')))}
    <div class="est"><div><span>${esc(tt('سعر الساعة', 'Hourly rate'))}</span><b class="num">${sar(est.rate)}</b></div>
      <div><span>${esc(tt('تُخصم من ساعاتك المجانية', 'Covered by your free hours'))}<small>${esc(tt(`المتبقي هذا الشهر: ${est.left} ساعة`, `${est.left} h left this month`))}</small></span><b class="num">${est.free}</b></div>
      <div><span>${esc(tt('ساعات مدفوعة', 'Paid hours'))}</span><b class="num">${est.paid}</b></div>
      <div><span>${esc(tt('قبل الضريبة', 'Before VAT'))}</span><b class="num">${sar(est.net)}</b></div><div><span>${esc(tt('ضريبة القيمة المضافة 15%', 'VAT 15%'))}</span><b class="num">${sar(est.vat)}</b></div>
      <div class="tot"><span>${esc(tt('الإجمالي التقديري', 'Estimated total'))}</span><b class="num">${sar(est.total)} ${esc(t('sar'))}</b></div></div>
    <p class="muted" style="font-size:13px">${esc(tt(`يُحجز الموعد لك ${R.holdHours} ساعات حتى يؤكده الفريق، ولا يظهر للآخرين خلالها. الإلغاء مجاني قبل الموعد بأكثر من ${R.cancelFreeHours} ساعة.`, `The slot is held for you for ${R.holdHours} hours until the team confirms. Free cancellation up to ${R.cancelFreeHours} hours before.`))}</p>
    <button class="btn btn-gold" style="width:100%" data-act="p-book-send" ${okRange && pending < R.maxPending ? '' : 'disabled'}>${ic('check')} ${esc(tt('أرسل طلب الحجز', 'Send booking request'))}</button>`}</div></aside></div></div>`;
};
P_AFTER.book = () => {
  const P = UI.pb; const re = () => { const y = scrollY; renderPortal(); window.scrollTo(0, y); };
  const b = $('#pb-branch'); if (!b) return;
  b.onchange = (e) => { P.branch = e.target.value; P.room = ''; P.start = null; re(); };
  $('#pb-room').onchange = (e) => { P.room = e.target.value; P.start = null; re(); };
  $('#pb-hours').onchange = (e) => { P.hours = +e.target.value; re(); };
  $('#pb-people').onchange = (e) => { P.people = Math.max(1, +e.target.value || 1); };
  $('#pb-notes').oninput = (e) => { P.notes = e.target.value; };
};
ACT['pb-day'] = (el) => { UI.pb.day = el.dataset.d; UI.pb.start = null; const y = scrollY; renderPortal(); window.scrollTo(0, y); };
ACT['pb-slot'] = (el) => { UI.pb.start = +el.dataset.h; const y = scrollY; renderPortal(); window.scrollTo(0, y); if (innerWidth < 900) $('.pb-sum')?.scrollIntoView({behavior:'smooth', block:'start'}); };
ACT['p-book-send'] = () => {
  const c = portalUser(), co = portalCompany(), P = UI.pb, R = S.rules.booking; const room = resById(P.room);
  if (!custCan('book') || co.status !== 'verified') return toast(tt('لا تملك صلاحية الحجز', 'You cannot book'), true);
  if (S.bookings.filter(b => b.companyId === co.id && b.status === 'pending').length >= R.maxPending) return toast(tt('بلغت الحد الأقصى للطلبات المعلّقة', 'Pending limit reached'), true);
  for (let k = 0; k < P.hours; k++) if (slotState(P.room, P.day, P.start + k, co.id) !== 'free') return toast(tt('الموعد لم يعد متاحًا — اختر وقتًا آخر', 'That slot is no longer free'), true);
  if (P.people > room.cap) return toast(tt(`السعة القصوى ${room.cap}`, `Capacity is ${room.cap}`), true);
  const start = new Date(`${P.day}T${String(P.start).padStart(2, '0')}:00:00`); const est = bookingEstimate(P.room, P.hours, co.id, P.day.slice(0, 7));
  const b = {id:uid('bk'), resourceId:P.room, start:start.toISOString(), end:new Date(+start + P.hours * 36e5).toISOString(), companyId:co.id, customerId:c.id, name:companyName(co, 'ar'), phone:c.phone, email:c.email,
    people:P.people, status:'pending', holdUntil:new Date(Date.now() + R.holdHours * 36e5).toISOString(), price:est.net, freeUsed:est.free, by:'portal', createdAt:new Date().toISOString(), notes:P.notes};
  S.bookings.push(b);
  const to = S.users.filter(u => u.status === 'active' && (u.roleId === 'bookings' || (u.roleId === 'staff' && u.branch === room.branch)));
  to.forEach(u => notify(u.id, 'طلب حجز قاعة بانتظار التأكيد', `${L(room.name, 'ar')} — ${companyName(co, 'ar')} · ${fmtDate(b.start, true, 'ar')}`, 'bookings'));
  c.notifs.unshift({at:b.createdAt, text:`أُرسل طلب حجز ${L(room.name, 'ar')} يوم ${fmtDate(b.start, true, 'ar')}. الموعد محجوز لك ${R.holdHours} ساعات حتى التأكيد.`});
  audit('booking', `${companyName(co, 'ar')} — ${L(room.name, 'ar')}`, null, {الحالة:'بانتظار التأكيد', الموعد:fmtDate(b.start, true, 'ar')}, 'system');
  UI.pb.start = null; UI.pb.notes = ''; UI.portalTab = 'bookings'; UI.pbHi = b.id; save(); renderPortal(); window.scrollTo(0, 0);
  toast(tt('أُرسل طلب الحجز وهو محجوز لك حتى التأكيد', 'Request sent — the slot is held for you'));
};

/* ---------- my bookings ---------- */
UI.pbF = 'upcoming'; UI.pbMode = 'list';
P_VIEWS.bookings = (c, co) => {
  const all = coBookings(co); const now = new Date(); const f = UI.pbF;
  const list = all.filter(b => f === 'all' ? true : f === 'upcoming' ? ['pending', 'confirmed'].includes(b.status) && new Date(b.end) > now : f === 'past' ? ['completed', 'expired'].includes(b.status) || (b.status === 'confirmed' && new Date(b.end) <= now) : ['cancelled', 'rejected'].includes(b.status));
  if (f === 'upcoming') list.sort((a, b) => a.start.localeCompare(b.start));
  const quota = freeQuota(co.id), used = freeUsed(co.id);
  const row = (b) => { const r = resById(b.resourceId); const hrsTo = (new Date(b.start) - now) / 36e5; const canAct = custCan('book') && ['pending', 'confirmed'].includes(b.status) && hrsTo > 0;
    return `<div class="bk-row ${UI.pbHi === b.id ? 'hi' : ''}" id="bk-${b.id}"><span class="date-badge"><b class="num">${new Date(b.start).getDate()}</b><span>${esc(new Date(b.start).toLocaleDateString(isEn() ? 'en' : 'ar-SA-u-nu-latn-ca-gregory', {month:'short'}))}</span></span>
      <div class="grow"><b>${esc(L(r.name))}</b><span>${dd(b.start.slice(0, 10))} · <span class="num">${hhmm(b.start)} – ${hhmm(b.end)}</span> · ${bookingHours(b)} ${esc(tt('ساعة', 'h'))}${b.people ? ` · ${b.people} ${esc(tt('أشخاص', 'people'))}` : ''}</span>
      ${b.status === 'rejected' ? `<span class="muted">${esc(tt('السبب:', 'Reason:'))} ${esc(b.reason || '—')}</span>${(b.alts || []).length ? `<div class="alts"><span>${esc(tt('مواعيد بديلة مقترحة:', 'Suggested alternatives:'))}</span>${b.alts.map((a, i) => `<button class="btn btn-ghost btn-xs" data-act="p-alt-book" data-id="${b.id}" data-i="${i}">${esc(L(resById(a.resourceId).name))} · ${esc(fmtDate(a.start, true))}</button>`).join('')}</div>` : ''}` : ''}</div>
      <div class="bk-side">${chipOf(BOOKING_STATUS, b.status)}${b.status === 'pending' ? `<span class="chip warn num">${ic('clock')}${esc(tt('مؤقت', 'hold'))} ${holdLeft(b)}</span>` : ''}
      ${b.status === 'confirmed' && hrsTo > 0 ? `<button class="btn btn-ghost btn-xs" data-act="p-ics" data-id="${b.id}">${ic('calendar')} ${esc(tt('أضف للتقويم', 'Add to calendar'))}</button>` : ''}
      ${canAct ? `<button class="btn btn-ghost btn-xs" data-act="p-resched" data-id="${b.id}">${ic('refresh')} ${esc(tt('تغيير الموعد', 'Reschedule'))}</button><button class="btn btn-danger btn-xs" data-act="p-cancel" data-id="${b.id}">${esc(tt('إلغاء', 'Cancel'))}</button>` : ''}</div></div>`; };
  const cal = () => { const d0 = toDate(today()); d0.setDate(1); const first = (d0.getDay() + 1) % 7; const n = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate();
    const wd = isEn() ? ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
    return `<div class="mcal">${wd.map(w => `<b>${w}</b>`).join('')}${Array.from({length:first}, () => '<i></i>').join('')}${Array.from({length:n}, (_, i) => { const ds = dstr(new Date(d0.getFullYear(), d0.getMonth(), i + 1)); const bs = all.filter(b => b.start.slice(0, 10) === ds && !['cancelled', 'rejected', 'expired'].includes(b.status));
      return `<div class="${ds === today() ? 'today' : ''} ${isWorkday(ds) ? '' : 'off'}"><span class="num">${i + 1}</span>${bs.map(b => `<em class="${b.status}">${hhmm(b.start)} ${esc(L(resById(b.resourceId).name))}</em>`).join('')}</div>`; }).join('')}</div>`; };
  return `<div class="tiles">
    <div class="tile"><div class="l">${ic('clock')}${esc(tt('رصيد الساعات المجانية', 'Free hours balance'))}</div><div class="v num">${r2(Math.max(0, quota - used))}<small>/${quota}</small></div><div class="d"><span class="meter"><i style="width:${Math.min(100, quota ? used / quota * 100 : 0)}%"></i></span>${esc(tt('يتجدد أول كل شهر', 'Renews monthly'))}</div></div>
    <div class="tile"><div class="l">${ic('alert')}${esc(tt('بانتظار التأكيد', 'Awaiting confirmation'))}</div><div class="v num">${all.filter(b => b.status === 'pending').length}<small>/${S.rules.booking.maxPending}</small></div></div></div>
  ${pPanel(esc(tt('حجوزاتي', 'My bookings')), `<div class="panel-body" style="padding-bottom:0"><div class="toolbar" style="justify-content:space-between"><div class="seg">${[['upcoming', tt('القادمة', 'Upcoming')], ['past', tt('السابقة', 'Past')], ['closed', tt('ملغاة ومرفوضة', 'Cancelled & declined')], ['all', tt('الكل', 'All')]].map(([k, l]) => `<button class="${f === k ? 'on' : ''}" data-act="pb-f" data-f="${k}">${esc(l)}</button>`).join('')}</div>
    <div class="seg"><button class="${UI.pbMode === 'list' ? 'on' : ''}" data-act="pb-mode" data-m="list">${ic('list')} ${esc(tt('قائمة', 'List'))}</button><button class="${UI.pbMode === 'cal' ? 'on' : ''}" data-act="pb-mode" data-m="cal">${ic('calendar')} ${esc(tt('تقويم', 'Calendar'))}</button></div></div></div>
    <div class="panel-body">${UI.pbMode === 'cal' ? cal() : list.map(row).join('') || `<p class="muted">${esc(tt('لا توجد حجوزات هنا.', 'Nothing here.'))}</p>`}</div>`,
    custCan('book') && co.status === 'verified' ? `<button class="btn btn-gold btn-sm" data-act="p-go" data-k="book">${ic('plus')} ${esc(tt('حجز جديد', 'New booking'))}</button>` : '')}`;
};
P_AFTER.bookings = () => { if (UI.pbHi) { setTimeout(() => { $('#bk-' + UI.pbHi)?.scrollIntoView({block:'center'}); UI.pbHi = null; }, 50); } };
ACT['pb-f'] = (el) => { UI.pbF = el.dataset.f; renderPortal(); };
ACT['pb-mode'] = (el) => { UI.pbMode = el.dataset.m; renderPortal(); };
ACT['p-ics'] = (el) => offerIcs(S.bookings.find(b => b.id === el.dataset.id));
ACT['p-cancel'] = (el) => {
  const b = S.bookings.find(x => x.id === el.dataset.id); const hrs = (new Date(b.start) - new Date()) / 36e5; const free = hrs > S.rules.booking.cancelFreeHours || b.status === 'pending';
  confirmBox(free ? tt('إلغاء هذا الحجز؟ الإلغاء مجاني.', 'Cancel this booking? Cancellation is free.') : tt(`باقي على الموعد أقل من ${S.rules.booking.cancelFreeHours} ساعة — سيُحتسب الحجز ${b.freeUsed ? 'من رصيد ساعاتك' : 'في الفاتورة القادمة'} وفق سياسة الإلغاء. متابعة؟`, `Less than ${S.rules.booking.cancelFreeHours} hours to go — the booking will be charged under the cancellation policy. Continue?`), () => {
    b.status = 'cancelled'; b.cancelledAt = new Date().toISOString(); b.lateCancel = !free; const c = portalUser();
    c.notifs.unshift({at:b.cancelledAt, text:`أُلغي حجز ${L(resById(b.resourceId).name, 'ar')} يوم ${fmtDate(b.start, true, 'ar')}${free ? '' : ' (إلغاء متأخر يُحتسب)'}.`});
    audit('booking', `${b.name} — ${L(resById(b.resourceId).name, 'ar')}`, {الحالة:BOOKING_STATUS.confirmed.ar}, {الحالة:'ملغى', 'إلغاء متأخر':free ? 'لا' : 'نعم'}, 'system'); save(); renderPortal(); toast(tt('أُلغي الحجز', 'Booking cancelled'));
  }, tt('إلغاء الحجز', 'Cancel booking'));
};
ACT['p-resched'] = (el) => { const b = S.bookings.find(x => x.id === el.dataset.id);
  confirmBox(tt('تغيير الموعد يعني إلغاء هذا الحجز ثم اختيار موعد جديد. متابعة؟', 'Rescheduling cancels this booking so you can pick a new time. Continue?'), () => {
    b.status = 'cancelled'; b.cancelledAt = new Date().toISOString(); audit('booking', b.name, null, {الحالة:'ملغى لإعادة الجدولة'}, 'system');
    UI.pb = Object.assign(UI.pb, {room:b.resourceId, branch:resById(b.resourceId).branch, day:b.start.slice(0, 10), hours:bookingHours(b), start:null}); UI.portalTab = 'book'; save(); renderPortal(); }, tt('متابعة', 'Continue'), false); };
ACT['p-alt-book'] = (el) => { const b = S.bookings.find(x => x.id === el.dataset.id); const a = b.alts[+el.dataset.i]; const s = new Date(a.start);
  UI.pb = Object.assign(UI.pb, {room:a.resourceId, branch:resById(a.resourceId).branch, day:dstr(s), start:s.getHours(), hours:Math.round((new Date(a.end) - s) / 36e5), people:b.people}); UI.portalTab = 'book'; renderPortal(); window.scrollTo(0, 0); };

/* ---------- contracts ---------- */
P_VIEWS.contracts = (c, co) => {
  const ks = coContracts(co).sort((a, b) => b.start.localeCompare(a.start)); const man = custCan('manage') || custCan('requests');
  return `${ks.filter(k => contractStatus(k) === 'expiring').map(k => pNotice('warn', 'refresh', `${esc(tt(`العقد ${k.id} ينتهي بعد ${daysBetween(today(), k.end)} يومًا.`, `Contract ${k.id} ends in ${daysBetween(today(), k.end)} days.`))} ${custCan('manage') ? `<button class="lk" data-act="p-renew" data-id="${k.id}">${esc(tt('اطلب التجديد', 'Request renewal'))}</button>` : ''}`)).join('')}
  ${ks.length ? ks.map(k => { const r = resById(k.resourceId); const cs = contractStatus(k);
    return `<section class="panel k-card"><div class="panel-head"><div><h2>${esc(L(r.name))}${k.qty > 1 ? ` ×${k.qty}` : ''} <span class="ltr muted" style="font-size:14px">${k.id}</span></h2><p>${dd(k.start)} ← ${dd(k.end)}</p></div>${chipOf(CONTRACT_STATUS, cs)}</div>
      <div class="panel-body"><dl class="kv cols2"><dt>${esc(tt('نوع المساحة', 'Space type'))}</dt><dd>${esc(spaceKind(r))} · ${esc(branchName(r.branch))}</dd><dt>${esc(tt('المدة', 'Term'))}</dt><dd>${k.months} ${esc(tt('شهر', 'months'))}</dd>
        ${custCan('finance') ? `<dt>${esc(tt('القيمة الشهرية', 'Monthly fee'))}</dt><dd class="num">${sar(k.monthly)} ${esc(t('sar'))} <span class="muted">+ ${esc(tt('الضريبة', 'VAT'))}</span></dd><dt>${esc(tt('التأمين', 'Deposit'))}</dt><dd class="num">${sar(k.deposit)}</dd>` : ''}
        <dt>${esc(tt('الفوترة', 'Billing'))}</dt><dd>${esc(k.billing === 'quarterly' ? tt('ربع سنوية', 'Quarterly') : tt('شهرية', 'Monthly'))}</dd><dt>${esc(tt('ساعات القاعات المجانية', 'Free room hours'))}</dt><dd>${k.freeHours} ${esc(tt('شهريًا', '/ month'))}</dd></dl>
        ${k.status === 'awaiting' ? pNotice('warn', 'stamp', esc(tt('العقد بانتظار التوقيع. وقّع النسخة واتفق مع فريق المبيعات على التسليم، ويصبح نشطًا بعد رفع النسخة الموقعة.', 'Awaiting signature. It becomes active once the signed copy is uploaded.'))) : ''}
        <div class="toolbar" style="margin-top:12px"><button class="btn btn-ghost btn-sm" data-act="open-contract-doc" data-id="${k.id}">${ic('doc')} ${esc(tt('عرض العقد (PDF)', 'View contract (PDF)'))}</button>
        ${custCan('manage') && ['active', 'expiring'].includes(cs) ? `<button class="btn btn-gold btn-sm" data-act="p-renew" data-id="${k.id}">${ic('refresh')} ${esc(tt('طلب تجديد', 'Request renewal'))}</button>` : ''}
        ${man && ['active', 'expiring'].includes(cs) ? `<button class="btn btn-ghost btn-sm" data-act="p-req" data-type="contract_change" data-k="${k.id}">${ic('edit')} ${esc(tt('طلب تعديل', 'Request a change'))}</button><button class="btn btn-ghost btn-sm" data-act="p-req" data-type="early_term" data-k="${k.id}">${ic('ban')} ${esc(tt('إنهاء مبكر', 'Early termination'))}</button>` : ''}</div></div></section>`; }).join('')
  : pNotice('', 'info', `${esc(tt('لا توجد عقود بعد.', 'No contracts yet.'))} <button class="lk" data-act="open-form" data-form="quote">${esc(tt('اطلب عرض سعر', 'Request a quote'))}</button>`)}`;
};
ACT['p-renew'] = (el) => {
  const k = S.contracts.find(x => x.id === el.dataset.id); const r = resById(k.resourceId); const list = k.listMonthly || k.monthly;
  openModal({title:esc(tt('طلب تجديد العقد', 'Request renewal')), sub:`<span class="ltr">${k.id}</span> · ${esc(L(r.name))}`, body:`<div class="form" data-viewsafe><p class="muted">${esc(tt('اختر مدة التجديد. يجهّز فريق المبيعات العرض وتعتمده الإدارة، ثم يصلك العقد الجديد للتوقيع.', 'Choose a renewal term. Sales prepares the offer, management approves it, and you receive the new contract to sign.'))}</p>
    <div class="dur-pick">${DURATIONS.map(([m, a, e]) => `<label class="dur"><input type="radio" name="rn-m" value="${m}" ${m === 12 ? 'checked' : ''}><span><b>${esc(isEn() ? e : a)}</b>${durDisc(m) ? `<em>−${durDisc(m)}%</em>` : ''}<small class="num">${sar(monthlyAfterDuration(list, m))} / ${esc(t('month'))}</small></span></label>`).join('')}</div>
    ${fld('rn-note', esc(tt('ملاحظات', 'Notes')), `<input class="input" id="rn-note" placeholder="${esc(tt('مثال: نرغب في مكتب أكبر', 'e.g. we need a bigger office'))}">`)}
    <button class="btn btn-gold" data-act="p-renew-send" data-id="${k.id}" style="justify-self:start">${esc(tt('إرسال طلب التجديد', 'Send renewal request'))}</button></div>`});
};
ACT['p-renew-send'] = (el) => {
  if (VIEW_ONLY) return toast(t('view_submit'), true);
  const k = S.contracts.find(x => x.id === el.dataset.id); const c = portalUser(); const m = +($('[name="rn-m"]:checked')?.value || 12);
  const r = createRequest('renewal', {name:c.name, phone:c.phone, email:c.email, contract:k.id, months:String(m), details:$('#rn-note').value.trim()}, [], {portal:true, companyId:c.companyId, customerId:c.id, branch:resById(k.resourceId).branch});
  closeModal(); UI.portalTab = 'requests'; renderPortal(); toast(tt(`أُرسل طلب التجديد ${r.id}`, `Renewal request ${r.id} sent`));
};

/* ---------- invoices & receipts ---------- */
UI.pinvF = 'all';
P_VIEWS.invoices = (c, co) => {
  const all = companyInvoices(co.id).filter(i => i.status !== 'draft').sort((a, b) => b.issueDate.localeCompare(a.issueDate)); const f = UI.pinvF;
  const map = {due:['issued', 'partial'], overdue:['overdue'], paid:['paid', 'credited'], credit:['credit']};
  const list = f === 'all' ? all : all.filter(i => map[f].includes(invStatus(i)));
  const pays = S.payments.filter(p => p.companyId === co.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  const ag = agingFor(co.id);
  return `<div class="tiles"><div class="tile"><div class="l">${ic('coins')}${esc(tt('الرصيد المستحق', 'Balance due'))}</div><div class="v num">${sar(ag.total)}</div><div class="d">${esc(t('sar'))}</div></div>
    <div class="tile"><div class="l">${ic('alert')}${esc(tt('متأخر', 'Overdue'))}</div><div class="v num ${ag.total - ag.cur ? 'bad-t' : ''}">${sar(ag.total - ag.cur)}</div></div>
    <div class="tile"><div class="l">${ic('clock')}${esc(tt('إيصالات قيد المراجعة', 'Receipts in review'))}</div><div class="v num">${pays.filter(p => p.status === 'review').length}</div></div></div>
  <div class="notice">${ic('coins')}<div><b>${esc(tt('الدفع بالتحويل البنكي', 'Pay by bank transfer'))}</b> — ${esc(L(S.settings.bank.name))} · <span class="ltr num">${esc(S.settings.bank.iban)}</span> <button class="lk" data-act="copy-iban">${ic('copy')}${esc(tt('نسخ', 'Copy'))}</button><br><span class="muted">${esc(tt('اذكر رقم الفاتورة في وصف التحويل، ثم ارفع الإيصال هنا لتؤكده المحاسبة.', 'Quote the invoice number in the transfer, then upload the receipt here.'))}</span></div></div>
  ${pPanel(esc(tt('الفواتير', 'Invoices')), `<div class="panel-body" style="padding-bottom:0"><div class="seg">${[['all', tt('الكل', 'All')], ['due', tt('مستحقة', 'Due')], ['overdue', tt('متأخرة', 'Overdue')], ['paid', tt('مدفوعة', 'Paid')], ['credit', tt('إشعارات دائنة', 'Credit notes')]].map(([k, l]) => `<button class="${f === k ? 'on' : ''}" data-act="pinv-f" data-f="${k}">${esc(l)} <span class="num">${k === 'all' ? all.length : all.filter(i => map[k].includes(invStatus(i))).length}</span></button>`).join('')}</div></div>
    <div style="padding-top:12px">${pTable([esc(tt('الرقم', 'No.')), esc(tt('التاريخ', 'Date')), esc(tt('الاستحقاق', 'Due')), esc(tt('الإجمالي', 'Total')), esc(tt('المتبقي', 'Balance')), esc(tt('الحالة', 'Status')), ''],
      list.map(i => `<tr class="click" data-act="open-invoice" data-id="${i.id}" tabindex="0"><td class="ltr" style="text-align:start"><b>${i.id}</b>${i.period ? `<span class="sub">${esc(fmtDate(i.period.from))}</span>` : ''}</td><td>${esc(fmtDate(i.issueDate))}<span class="sub">${esc(fmtHijri(i.issueDate))}</span></td><td>${i.kind === 'credit' ? '—' : esc(fmtDate(i.dueDate))}</td>
        <td class="num">${sar(i.total)}</td><td class="num ${invOpen(i) ? 'gold' : ''}">${i.kind === 'credit' ? '—' : sar(invOpen(i))}</td><td>${chipOf(INV_STATUS, invStatus(i))}</td>
        <td>${invOpen(i) > 0 ? `<button class="btn btn-gold btn-xs" data-act="p-receipt" data-id="${i.id}">${ic('upload')} ${esc(tt('رفع إيصال', 'Upload receipt'))}</button>` : `<button class="btn btn-ghost btn-xs" data-act="open-invoice" data-id="${i.id}">${ic('doc')} PDF</button>`}</td></tr>`), esc(tt('لا توجد فواتير', 'No invoices')))}</div>`,
    `<button class="btn btn-ghost btn-sm" data-act="p-stmt">${ic('list')} ${esc(tt('كشف الحساب السنوي', 'Annual statement'))}</button>`)}
  ${pPanel(esc(tt('الإيصالات المرفوعة', 'Uploaded receipts')), pTable([esc(tt('المرجع', 'Ref')), esc(tt('المبلغ', 'Amount')), esc(tt('تاريخ التحويل', 'Transfer date')), esc(tt('الفاتورة', 'Invoice')), esc(tt('الحالة', 'Status'))],
    pays.map(p => `<tr><td class="ltr" style="text-align:start">${esc(p.ref)}</td><td class="num">${sar(p.amount)}</td><td>${esc(fmtDate(p.date))}</td><td class="ltr" style="text-align:start">${esc(p.invoiceId || '—')}</td><td>${chipOf(PAY_STATUS, p.status)}${p.status === 'rejected' && p.reason ? `<span class="sub">${esc(p.reason)}</span>` : ''}</td></tr>`), esc(tt('لا توجد إيصالات', 'No receipts'))))}`;
};
ACT['pinv-f'] = (el) => { UI.pinvF = el.dataset.f; renderPortal(); };
ACT['p-stmt'] = () => openStatement(portalCompany().id);
ACT['copy-iban'] = () => copyText(S.settings.bank.iban.replace(/\s/g, ''));
ACT['p-receipt'] = (el) => {
  const inv = S.invoices.find(x => x.id === el.dataset.id); if (!custCan('finance')) return toast(tt('يتطلب دور مالي', 'Finance role required'), true);
  openModal({title:esc(tt('رفع إيصال التحويل', 'Upload transfer receipt')), sub:`<span class="ltr">${inv.id}</span> · ${esc(tt('المتبقي', 'Balance'))} <b class="num">${sar(invOpen(inv))}</b> ${esc(t('sar'))}`, body:`<form class="form" id="rc-form" novalidate data-viewsafe>
    <div class="row">${fld('rc-amt', esc(tt('المبلغ المحوّل', 'Amount transferred')), inp('rc-amt', invOpen(inv), 'number', 'min="1" step="0.01" dir="ltr"'))}${fld('rc-date', esc(tt('تاريخ التحويل', 'Transfer date')), inp('rc-date', today(), 'date', `max="${today()}"`))}</div>
    ${fld('rc-ref', esc(tt('رقم مرجع التحويل', 'Transfer reference')), inp('rc-ref', '', 'text', 'dir="ltr" placeholder="TRX-…"'))}
    ${fld('rc-file', esc(tt('صورة الإيصال أو PDF (حتى 10 ميجابايت)', 'Receipt image or PDF (max 10 MB)')), '<input class="input" type="file" id="rc-file" accept=".pdf,.jpg,.jpeg,.png">')}
    <p class="muted" style="font-size:13px">${esc(tt('تراجع المحاسبة الإيصال وتؤكد الدفعة، وتُخصم من أقدم فاتورة مستحقة أولًا.', 'Accounts review the receipt and allocate it to the oldest invoice first.'))}</p>
    <button class="btn btn-gold" type="submit">${esc(tt('إرسال للمراجعة', 'Send for review'))}</button></form>`,
    onMount:(m) => m.querySelector('#rc-form').onsubmit = (e) => {
      e.preventDefault(); ['rc-amt', 'rc-ref', 'rc-file', 'rc-date'].forEach(i => fieldErr(i, ''));
      const amt = +m.querySelector('#rc-amt').value, ref = m.querySelector('#rc-ref').value.trim(), f = m.querySelector('#rc-file').files[0], dt = m.querySelector('#rc-date').value;
      if (!(amt > 0)) return fieldErr('rc-amt', tt('أدخل مبلغًا صحيحًا', 'Enter a valid amount'));
      if (!dt || dt > today()) return fieldErr('rc-date', tt('تاريخ غير صحيح', 'Invalid date'));
      if (ref.length < 4) return fieldErr('rc-ref', tt('أدخل رقم مرجع التحويل', 'Enter the transfer reference'));
      if (!f) return fieldErr('rc-file', tt('أرفق الإيصال', 'Attach the receipt'));
      if (f.size > 10 * 1024 * 1024) return fieldErr('rc-file', tt('الحد الأقصى 10 ميجابايت', 'Max 10 MB'));
      if (VIEW_ONLY) return toast(t('view_submit'), true);
      const c = portalUser(); const p = {id:nextNo('PAY'), companyId:inv.companyId, invoiceId:inv.id, amount:r2(amt), date:dt, ref, method:'transfer', status:'review', file:f.name, by:c.id, at:new Date().toISOString(), allocations:[]};
      S.payments.unshift(p); S.users.filter(u => u.status === 'active' && u.roleId === 'accountant').forEach(u => notify(u.id, 'إيصال تحويل بانتظار المراجعة', `${companyName(portalCompany(), 'ar')} — ${ref} · ${sar(amt)} ر.س`, 'billing'));
      c.notifs.unshift({at:p.at, text:`استلمنا إيصال التحويل ${ref} بمبلغ ${sar(amt)} ر.س وهو قيد المراجعة.`});
      audit('payment', companyName(portalCompany(), 'ar'), null, {إيصال:ref, المبلغ:amt, الحالة:'قيد المراجعة'}, 'system'); save(); closeModal(); renderPortal(); toast(tt('أُرسل الإيصال للمراجعة', 'Receipt sent for review'));
    }});
};

/* ---------- requests ---------- */
P_VIEWS.requests = (c, co) => {
  const list = S.requests.filter(r => r.companyId === co.id || r.email === c.email).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return pPanel(esc(tt('طلباتي', 'My requests')), list.length ? `<div class="req-list">${list.map(r => `<details class="req"><summary><span class="ltr num">${r.id}</span><b>${esc(L(REQ_TYPES[r.type]))}</b>${chipOf(REQ_STATUS, r.status)}<span class="muted">${esc(fmtDate(r.createdAt))}</span></summary>
      <div class="req-body">${r.data.contract ? `<p><b>${esc(tt('العقد:', 'Contract:'))}</b> <span class="ltr">${esc(r.data.contract)}</span></p>` : ''}${r.data.details || r.data.message ? `<p>${esc(r.data.details || r.data.message)}</p>` : ''}
      <div class="timeline">${r.history.slice().reverse().map(h => `<div class="tl"><i></i><div><p>${esc(h.text)}</p><span>${esc(fmtDate(h.at, true))}</span></div></div>`).join('')}</div>
      <p class="muted" style="font-size:12.5px">${esc(tt('الملاحظات الداخلية للفريق لا تظهر هنا.', 'Internal team notes are not shown here.'))}</p></div></details>`).join('')}</div>`
    : `<div class="panel-body"><p class="muted">${esc(tt('لا توجد طلبات بعد.', 'No requests yet.'))}</p></div>`, custCan('requests') ? `<button class="btn btn-gold btn-sm" data-act="p-req">${ic('plus')} ${esc(tt('طلب جديد', 'New request'))}</button>` : '');
};
ACT['p-req'] = (el) => {
  const c = portalUser(), co = portalCompany(); if (!custCan('requests')) return toast(tt('دورك لا يسمح بإرسال طلبات', 'Your role cannot send requests'), true);
  const ks = coContracts(co).filter(k => ['active', 'expiring'].includes(contractStatus(k))); const type0 = el.dataset.type || 'maintenance';
  openModal({title:esc(tt('طلب جديد', 'New request')), body:`<form class="form" id="pr-form" novalidate data-viewsafe>
    ${fld('pr-type', esc(tt('نوع الطلب', 'Request type')), `<select class="input" id="pr-type">${PORTAL_REQ.map(k => `<option value="${k}" ${k === type0 ? 'selected' : ''}>${esc(L(REQ_TYPES[k]))}</option>`).join('')}</select>`)}
    ${ks.length ? fld('pr-k', esc(tt('العقد المعني', 'Related contract')), `<select class="input" id="pr-k"><option value="">—</option>${ks.map(k => `<option value="${k.id}" ${k.id === el.dataset.k ? 'selected' : ''}>${k.id} — ${esc(L(resById(k.resourceId).name))}</option>`).join('')}</select>`) : ''}
    ${fld('pr-d', esc(tt('التفاصيل', 'Details')), `<textarea class="input" id="pr-d" placeholder="${esc(tt('اشرح طلبك باختصار', 'Briefly describe your request'))}"></textarea>`)}
    ${fld('pr-f', esc(tt('مرفق (اختياري، حتى 10 ميجابايت)', 'Attachment (optional, max 10 MB)')), '<input class="input" type="file" id="pr-f">')}
    <div class="notice hidden" id="pr-et">${ic('alert')}<div>${esc(tt('الإنهاء المبكر وفق بنود العقد: إشعار قبل 30 يومًا ويُحتسب إيجار شهر إضافي.', 'Early termination follows the contract: 30 days notice and one extra month.'))}</div></div>
    <button class="btn btn-gold" type="submit">${esc(tt('إرسال الطلب', 'Send request'))}</button></form>`,
    onMount:(m) => { const ty = m.querySelector('#pr-type'); const sync = () => m.querySelector('#pr-et').classList.toggle('hidden', ty.value !== 'early_term'); ty.onchange = sync; sync();
      m.querySelector('#pr-form').onsubmit = (e) => { e.preventDefault(); fieldErr('pr-d', ''); fieldErr('pr-f', '');
        const d = m.querySelector('#pr-d').value.trim(); const f = m.querySelector('#pr-f').files[0];
        if (d.length < 5) return fieldErr('pr-d', tt('اكتب التفاصيل', 'Add the details'));
        if (f && f.size > 10 * 1024 * 1024) return fieldErr('pr-f', tt('الحد الأقصى 10 ميجابايت', 'Max 10 MB'));
        if (VIEW_ONLY) return toast(t('view_submit'), true);
        const kid = m.querySelector('#pr-k')?.value || '';
        const r = createRequest(ty.value, {name:c.name, phone:c.phone, email:c.email, contract:kid, details:d}, f ? [f.name] : [], {portal:true, companyId:co.id, customerId:c.id, branch:kid ? resById(S.contracts.find(k => k.id === kid).resourceId).branch : co.branch});
        closeModal(); UI.portalTab = 'requests'; renderPortal(); toast(tt(`أُرسل الطلب ${r.id}`, `Request ${r.id} sent`)); }; }});
};

/* ---------- company details & documents ---------- */
P_VIEWS.company = (c, co) => {
  const man = custCan('manage');
  const docRow = (d) => { const T = DOC_TYPES[d.type]; const left = d.expiry ? daysBetween(today(), d.expiry) : null;
    return `<tr><td><b>${esc(L(T))}</b>${T.req ? ` <span class="chip plain">${esc(tt('مطلوب', 'Required'))}</span>` : ''}${d.file ? `<span class="sub ltr" style="text-align:start">${esc(d.file)}</span>` : ''}</td><td>${chipOf(DOC_STATUS, d.status)}${d.status === 'rejected' && d.reason ? `<span class="sub bad-t">${esc(d.reason)}</span>` : ''}</td>
      <td>${d.expiry ? `${esc(fmtDate(d.expiry))}${left != null && left <= 30 ? ` <span class="chip ${left < 0 ? 'bad' : 'warn'}">${esc(left < 0 ? tt('منتهي', 'Expired') : tt(`بعد ${left} يوم`, `in ${left} d`))}</span>` : ''}` : '—'}</td>
      <td>${man ? `<button class="btn btn-ghost btn-xs" data-act="p-doc" data-t="${d.type}">${ic('upload')} ${esc(d.file ? tt('تحديث', 'Update') : tt('رفع', 'Upload'))}</button>` : ''}</td></tr>`; };
  return `${co.status === 'pending' ? pNotice('warn', 'clock', esc(tt('بعد رفع المستندات المطلوبة يراجعها الفريق خلال يوم عمل، ويُفعَّل الحجز أونلاين وعروض الأسعار والفوترة.', 'Once the required documents are uploaded, the team reviews them within a working day.'))) : ''}
  ${co.pendingChange ? pNotice('', 'info', esc(tt(`طلب تعديل «${co.pendingChange.label}» إلى «${co.pendingChange.to}» بانتظار اعتماد الإدارة.`, `Change to "${co.pendingChange.label}" is awaiting approval.`))) : ''}
  ${pPanel(esc(tt('بيانات المنشأة', 'Company details')), `<div class="panel-body"><dl class="kv cols2"><dt>${esc(tt('الاسم القانوني (عربي)', 'Legal name (AR)'))}</dt><dd>${esc(co.nameAr)}</dd><dt>${esc(tt('الاسم القانوني (إنجليزي)', 'Legal name (EN)'))}</dt><dd class="ltr" style="text-align:start">${esc(co.nameEn || '—')}</dd>
    <dt>${esc(tt('السجل التجاري', 'CR'))}</dt><dd class="ltr num" style="text-align:start">${esc(co.cr)}</dd><dt>${esc(tt('الرقم الضريبي', 'VAT no.'))}</dt><dd class="ltr num" style="text-align:start">${esc(co.vat || '—')}</dd>
    <dt>${esc(tt('المدينة', 'City'))}</dt><dd>${esc(co.city)}</dd><dt>${esc(tt('الحالة', 'Status'))}</dt><dd>${chipOf(COMPANY_STATUS, co.status)}</dd></dl>
    <p class="muted" style="font-size:13px;margin-top:10px">${esc(tt('تعديل الاسم القانوني أو الرقم الضريبي يحتاج اعتماد الإدارة لأنه يظهر في العقود والفواتير الضريبية.', 'Changing the legal name or VAT number needs approval because it appears on contracts and tax invoices.'))}</p></div>`,
    man && !co.pendingChange ? `<button class="btn btn-ghost btn-sm" data-act="p-legal">${ic('edit')} ${esc(tt('طلب تعديل', 'Request a change'))}</button>` : '')}
  ${pPanel(esc(tt('المستندات', 'Documents')), pTable([esc(tt('المستند', 'Document')), esc(tt('الحالة', 'Status')), esc(tt('الانتهاء', 'Expiry')), ''], co.docs.map(docRow), ''), '', esc(tt('PDF أو صورة حتى 10 ميجابايت. نذكّرك قبل انتهاء المستندات بـ 30 يومًا.', 'PDF or image up to 10 MB. We remind you 30 days before expiry.')))}`;
};
ACT['p-doc'] = (el) => {
  const co = portalCompany(); const d = co.docs.find(x => x.type === el.dataset.t); const T = DOC_TYPES[d.type];
  openModal({title:esc(L(T)), body:`<form class="form" id="pd-form" novalidate data-viewsafe>${fld('pd-f', esc(tt('الملف (PDF أو صورة، حتى 10 ميجابايت)', 'File (PDF or image, max 10 MB)')), '<input class="input" type="file" id="pd-f" accept=".pdf,.jpg,.jpeg,.png">')}
    ${T.exp ? fld('pd-x', esc(tt('تاريخ الانتهاء', 'Expiry date')), inp('pd-x', d.expiry || '', 'date', `min="${today()}"`)) : ''}<button class="btn btn-gold" type="submit">${esc(tt('رفع للمراجعة', 'Upload for review'))}</button></form>`,
    onMount:(m) => m.querySelector('#pd-form').onsubmit = (e) => { e.preventDefault(); fieldErr('pd-f', ''); fieldErr('pd-x', '');
      const f = m.querySelector('#pd-f').files[0]; const x = m.querySelector('#pd-x')?.value || null;
      if (!f) return fieldErr('pd-f', tt('اختر ملفًا', 'Choose a file'));
      if (f.size > 10 * 1024 * 1024) return fieldErr('pd-f', tt('الحد الأقصى 10 ميجابايت', 'Max 10 MB'));
      if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) return fieldErr('pd-f', tt('الصيغ المسموحة: PDF أو JPG أو PNG', 'Allowed: PDF, JPG, PNG'));
      if (T.exp && !x) return fieldErr('pd-x', tt('أدخل تاريخ الانتهاء', 'Enter the expiry date'));
      if (VIEW_ONLY) return toast(t('view_submit'), true);
      Object.assign(d, {file:f.name, status:'review', expiry:x, uploadedAt:new Date().toISOString(), reason:''});
      S.users.filter(u => u.status === 'active' && (u.roleId === 'ops' || u.id === co.salesOwner)).forEach(u => notify(u.id, 'مستند جديد بانتظار التحقق', `${co.nameAr} — ${L(T, 'ar')}`, 'companies'));
      audit('file', co.nameAr, null, {المستند:L(T, 'ar'), الحالة:'قيد المراجعة'}, 'system'); save(); closeModal(); renderPortal(); toast(tt('رُفع المستند وهو قيد المراجعة', 'Uploaded for review')); }});
};
ACT['p-legal'] = () => {
  const co = portalCompany();
  openModal({title:esc(tt('طلب تعديل بيانات المنشأة', 'Request a company data change')), body:`<form class="form" id="pl-form" novalidate data-viewsafe>${fld('pl-f', esc(tt('البيان', 'Field')), `<select class="input" id="pl-f"><option value="nameAr">${esc(tt('الاسم القانوني (عربي)', 'Legal name (AR)'))}</option><option value="nameEn">${esc(tt('الاسم القانوني (إنجليزي)', 'Legal name (EN)'))}</option><option value="vat">${esc(tt('الرقم الضريبي', 'VAT number'))}</option></select>`)}
    ${fld('pl-v', esc(tt('القيمة الجديدة', 'New value')), inp('pl-v'))}${fld('pl-file', esc(tt('مستند داعم (السجل أو شهادة الضريبة المحدّثة)', 'Supporting document')), '<input class="input" type="file" id="pl-file" accept=".pdf,.jpg,.jpeg,.png">')}
    <button class="btn btn-gold" type="submit">${esc(tt('إرسال للاعتماد', 'Send for approval'))}</button></form>`,
    onMount:(m) => m.querySelector('#pl-form').onsubmit = (e) => { e.preventDefault(); fieldErr('pl-v', '');
      const f = m.querySelector('#pl-f').value, v = m.querySelector('#pl-v').value.trim();
      if (v.length < 3) return fieldErr('pl-v', tt('أدخل القيمة الجديدة', 'Enter the new value'));
      if (f === 'vat' && !/^3\d{13}3$/.test(v)) return fieldErr('pl-v', tt('الرقم الضريبي 15 رقمًا يبدأ وينتهي بالرقم 3', '15 digits starting and ending with 3'));
      if (VIEW_ONLY) return toast(t('view_submit'), true);
      const labels = {nameAr:'الاسم القانوني (عربي)', nameEn:'الاسم القانوني (إنجليزي)', vat:'الرقم الضريبي'};
      co.pendingChange = {field:f, label:labels[f], from:co[f] || '', to:v, at:new Date().toISOString(), file:m.querySelector('#pl-file').files[0]?.name || ''};
      S.users.filter(u => u.status === 'active' && u.roleId === 'ops').forEach(u => notify(u.id, 'طلب تعديل بيانات منشأة', `${co.nameAr} — ${labels[f]}`, 'approvals'));
      audit('company', co.nameAr, {[labels[f]]:co[f] || '—'}, {[labels[f]]:v + ' (بانتظار الاعتماد)'}, 'system'); save(); closeModal(); renderPortal(); toast(tt('أُرسل الطلب للاعتماد', 'Sent for approval')); }});
};

/* ---------- company users ---------- */
P_VIEWS.team = (c, co) => {
  const us = S.customers.filter(x => x.companyId === co.id && x.status !== 'removed');
  return pPanel(esc(tt('مستخدمو المنشأة', 'Company users')), pTable([esc(tt('المستخدم', 'User')), esc(tt('الدور', 'Role')), esc(tt('آخر دخول', 'Last sign-in')), ''], us.map(u => `<tr><td><b>${esc(u.name)}</b>${u.id === c.id ? ` <span class="chip plain">${esc(tt('أنت', 'You'))}</span>` : ''}<span class="sub ltr" style="text-align:start">${esc(u.email)}</span></td>
    <td>${u.id === c.id ? `<span class="chip">${esc(L(COMPANY_ROLES[u.companyRole]))}</span>` : `<select class="input" data-p-role="${u.id}" style="min-height:36px;width:auto" aria-label="${esc(tt('الدور', 'Role'))}">${Object.entries(COMPANY_ROLES).map(([k, v]) => `<option value="${k}" ${k === u.companyRole ? 'selected' : ''}>${esc(L(v))}</option>`).join('')}</select>`}${u.status === 'invited' ? ` <span class="chip info">${esc(tt('دعوة مرسلة', 'Invited'))}</span>` : ''}</td>
    <td>${u.sessions?.[0] ? esc(ago(u.sessions[0].at)) : '—'}</td><td>${u.id !== c.id ? `<button class="btn btn-danger btn-xs" data-act="p-remove" data-id="${u.id}">${esc(tt('إزالة', 'Remove'))}</button>` : ''}</td></tr>`), ''),
    `<button class="btn btn-gold btn-sm" data-act="p-invite">${ic('plus')} ${esc(tt('إضافة مستخدم', 'Add user'))}</button>`, esc(tt('المسؤول الرئيسي يدير الكل · حجز القاعات · مالي: الفواتير والإيصالات · عرض فقط', 'Main admin manages all · Booking · Finance: invoices & receipts · View only')));
};
P_AFTER.team = (c, co) => { $$('[data-p-role]').forEach(s => s.onchange = () => { if (VIEW_ONLY) { toast(VIEW_MSG, true); return renderPortal(); } const u = custById(s.dataset.pRole); const b = u.companyRole; u.companyRole = s.value; audit('portal', `${co.nameAr} — ${u.name}`, {الدور:L(COMPANY_ROLES[b], 'ar')}, {الدور:L(COMPANY_ROLES[u.companyRole], 'ar')}, 'system'); save(); toast(tt('حُدّث الدور', 'Role updated')); }); };
ACT['p-invite'] = () => {
  openModal({title:esc(tt('إضافة مستخدم للمنشأة', 'Add a company user')), body:`<form class="form" id="pi-form" novalidate data-viewsafe><div class="row">${fld('pi-n', esc(tt('الاسم', 'Name')), inp('pi-n'))}${fld('pi-p', esc(tt('الجوال', 'Mobile')), inp('pi-p', '', 'tel', 'dir="ltr" placeholder="05XXXXXXXX"'))}</div>
    ${fld('pi-e', esc(tt('البريد الإلكتروني', 'Email')), inp('pi-e', '', 'email', 'dir="ltr"'))}${fld('pi-r', esc(tt('الدور', 'Role')), `<select class="input" id="pi-r">${Object.entries(COMPANY_ROLES).filter(([k]) => k !== 'admin').map(([k, v]) => `<option value="${k}">${esc(L(v))}</option>`).join('')}</select>`)}
    <p class="muted" style="font-size:13px">${esc(tt('تصله رسالة لتعيين كلمة مرور خاصة به.', 'They receive an email to set their own password.'))}</p><button class="btn btn-gold" type="submit">${esc(tt('إرسال الدعوة', 'Send invitation'))}</button></form>`,
    onMount:(m) => m.querySelector('#pi-form').onsubmit = (e) => { e.preventDefault(); ['pi-n', 'pi-e', 'pi-p'].forEach(i => fieldErr(i, ''));
      const g = (i) => m.querySelector('#' + i).value.trim(); const em = g('pi-e').toLowerCase();
      if (g('pi-n').length < 3) return fieldErr('pi-n', t('required'));
      if (!/^05\d{8}$/.test(g('pi-p'))) return fieldErr('pi-p', t('invalid_phone'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return fieldErr('pi-e', t('invalid_email'));
      if (S.customers.some(x => x.email === em) || S.users.some(x => x.email === em)) return fieldErr('pi-e', tt('البريد مستخدم لحساب آخر', 'Email already in use'));
      if (VIEW_ONLY) return toast(t('view_submit'), true);
      const co = portalCompany(); const u = {id:uid('cu'), name:g('pi-n'), email:em, phone:g('pi-p'), pw:'Client@2026', pwHistory:[], companyId:co.id, companyRole:g('pi-r'), status:'active', lang:S.lang, files:[], notifs:[{at:new Date().toISOString(), text:`أضافك ${portalUser().name} إلى حساب ${co.nameAr}.`}], sessions:[]};
      S.customers.push(u); (S.outbox = S.outbox || []).unshift({at:new Date().toISOString(), to:em, subject:`دعوة للانضمام إلى حساب ${co.nameAr} في وصل دائم`, channel:'email'});
      audit('portal', `${co.nameAr} — ${u.name}`, null, {العملية:'إضافة مستخدم', الدور:L(COMPANY_ROLES[u.companyRole], 'ar')}, 'system'); save(); closeModal(); renderPortal(); toast(tt('أُضيف المستخدم وأُرسلت الدعوة', 'User added and invited')); }});
};
ACT['p-remove'] = (el) => { const u = custById(el.dataset.id); const co = portalCompany();
  confirmBox(tt(`إزالة ${u.name} من حساب المنشأة؟ تُنهى جلساته فورًا.`, `Remove ${u.name}? Their sessions end immediately.`), () => { u.status = 'removed'; u.sessions = []; audit('portal', `${co.nameAr} — ${u.name}`, null, {العملية:'إزالة مستخدم', الجلسات:'أُنهيت'}, 'system'); save(); renderPortal(); toast(tt('أُزيل المستخدم وأُنهيت جلساته', 'User removed and signed out')); }, tt('إزالة', 'Remove')); };

/* ---------- notifications & profile ---------- */
P_VIEWS.notifs = (c) => pPanel(esc(tt('الإشعارات', 'Notifications')), c.notifs.length ? `<div>${c.notifs.map(n => `<div class="list-item ${n.read ? '' : 'unread'}">${ic('bell')}<div class="grow"><b style="font-weight:500">${esc(n.text)}</b><span>${esc(fmtDate(n.at, true))}</span></div></div>`).join('')}</div>` : `<div class="panel-body"><p class="muted">${esc(tt('لا توجد إشعارات', 'No notifications'))}</p></div>`);
P_VIEWS.profile = (c) => `${pPanel(esc(tt('الملف الشخصي', 'Profile')), `<form class="form panel-body" id="pp-form" novalidate data-viewsafe><div class="row">${fld('pp-n', esc(tt('الاسم', 'Name')), inp('pp-n', c.name))}${fld('pp-p', esc(tt('الجوال', 'Mobile')), inp('pp-p', c.phone, 'tel', 'dir="ltr"'))}</div>
    <div class="row">${fld('pp-e', esc(tt('البريد الإلكتروني', 'Email')), inp('pp-e', c.email, 'email', 'dir="ltr" disabled'))}${fld('pp-l', esc(tt('لغة البوابة والرسائل', 'Portal & message language')), `<select class="input" id="pp-l"><option value="ar" ${(c.lang || 'ar') === 'ar' ? 'selected' : ''}>العربية</option><option value="en" ${c.lang === 'en' ? 'selected' : ''}>English</option></select>`)}</div>
    <button class="btn btn-gold" type="submit" style="justify-self:start">${esc(tt('حفظ', 'Save'))}</button></form>`)}
  ${pPanel(esc(tt('كلمة المرور', 'Password')), `<form class="form panel-body" id="pw-form" novalidate data-viewsafe>${fld('pw-c', esc(tt('كلمة المرور الحالية', 'Current password')), inp('pw-c', '', 'password', 'dir="ltr" autocomplete="current-password"'))}
    <div class="field"><label for="pw-n">${esc(tt('كلمة المرور الجديدة', 'New password'))}</label><div class="pw-wrap">${inp('pw-n', '', 'password', 'dir="ltr" autocomplete="new-password"')}${eyeBtn('pw-n')}</div>${pwListHTML('pw-list')}</div>
    <button class="btn btn-gold" type="submit" style="justify-self:start">${esc(tt('تغيير كلمة المرور', 'Change password'))}</button></form>`)}
  ${pPanel(esc(tt('الأجهزة والجلسات', 'Devices & sessions')), `<div>${(c.sessions || []).map((s, i) => `<div class="list-item">${ic('device')}<div class="grow"><b>${esc(s.device)}</b><span>${esc(fmtDate(s.at, true))}</span></div>${i === 0 ? `<span class="chip ok">${esc(tt('هذا الجهاز', 'This device'))}</span>` : ''}</div>`).join('')}</div>`,
    `<button class="btn btn-ghost btn-sm" data-act="p-out-all">${ic('logout')} ${esc(tt('تسجيل الخروج من الأجهزة الأخرى', 'Sign out other devices'))}</button>`)}`;
P_AFTER.profile = (c) => {
  bindPwList('pw-n', 'pw-list');
  $('#pp-form').onsubmit = (e) => { e.preventDefault(); fieldErr('pp-n', ''); fieldErr('pp-p', ''); const n = $('#pp-n').value.trim(), p = $('#pp-p').value.trim();
    if (n.length < 3) return fieldErr('pp-n', t('required')); if (!/^05\d{8}$/.test(p)) return fieldErr('pp-p', t('invalid_phone'));
    if (VIEW_ONLY) return toast(t('view_submit'), true);
    c.name = n; c.phone = p; c.lang = $('#pp-l').value; S.lang = c.lang; save(); applyLangDir(); renderPortal(); toast(tt('حُفظ', 'Saved')); };
  $('#pw-form').onsubmit = (e) => { e.preventDefault(); fieldErr('pw-c', ''); fieldErr('pw-n', ''); const cur = $('#pw-c').value, nw = $('#pw-n').value;
    if (cur !== c.pw) return fieldErr('pw-c', tt('كلمة المرور الحالية غير صحيحة', 'Current password is incorrect'));
    if (!pwOk(nw)) return fieldErr('pw-n', tt('كلمة المرور لا تستوفي الشروط', 'The password does not meet the rules'));
    if ([c.pw, ...(c.pwHistory || [])].slice(0, 5).includes(nw)) return fieldErr('pw-n', tt('لا يمكن استخدام إحدى آخر 5 كلمات مرور.', 'You cannot reuse one of your last 5 passwords.'));
    if (VIEW_ONLY) return toast(t('view_submit'), true);
    c.pwHistory = [c.pw, ...(c.pwHistory || [])].slice(0, 5); c.pw = nw; c.sessions = (c.sessions || []).slice(0, 1);
    (S.outbox = S.outbox || []).unshift({at:new Date().toISOString(), to:c.email, subject:'تم تغيير كلمة المرور وتسجيل الخروج من الأجهزة الأخرى', channel:'email'});
    audit('pw_reset', c.name, null, {العملية:'تغيير كلمة المرور من البوابة'}, 'system'); save(); renderPortal(); toast(tt('تغيّرت كلمة المرور، وسُجّل خروجك من الأجهزة الأخرى', 'Password changed; other devices signed out')); };
};
ACT['p-out-all'] = () => { if (VIEW_ONLY) return toast(VIEW_MSG, true); const c = portalUser(); c.sessions = (c.sessions || []).slice(0, 1); audit('portal', c.name, null, {العملية:'تسجيل الخروج من الأجهزة الأخرى'}, 'system'); save(); renderPortal(); toast(tt('سُجّل الخروج من الأجهزة الأخرى', 'Other devices signed out')); };
