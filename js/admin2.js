/* وصل دائم — dashboard (part 2): role-aware "today" pages, KPIs vs targets, leads board, room-booking confirmations, deals wizard, approvals */
'use strict';

const chipM = (map, k, extra = '') => `<span class="chip ${map[k]?.cls || 'plain'}">${esc(map[k]?.ar || k)}${extra}</span>`;
const coN = (id) => esc(companyName(companyById(id), 'ar'));
const visibleLeads = () => S.clients.filter(c => inScope(c, 'owner'));
const leadLate = (c) => ['new', 'assigned'].includes(c.status) && !c.lastContactAt && Date.now() - new Date(c.createdAt) > 24 * 36e5;
const dealNet = (d) => dealCalc(d).net;
const approvedAt = (d) => d.approvedAt || d.versions?.at(-1)?.decidedAt || d.createdAt;
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const meter = (v, target, label = '') => `<div class="tgt"><div class="tgt-bar"><i style="width:${Math.min(100, pct(v, target))}%"></i><b style="inset-inline-start:100%"></b></div><span class="num">${label || pct(v, target) + '%'}</span></div>`;
const bookingBranch = (b) => resById(b.resourceId)?.branch || 'main';
const branchVisible = (br) => scopeOf() !== 'branch' || br === me()?.branch;
const bookingVisible = (b) => branchVisible(bookingBranch(b));
const countdown = (iso) => { const ms = new Date(iso) - new Date(); if (ms <= 0) return 'انتهت'; const h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4); return h ? `${h} س ${m} د` : `${m} د`; };

/* ================= metrics ================= */
function metrics() {
  const m = thisMonth();
  const act = S.contracts.filter(k => ['active', 'expiring'].includes(contractStatus(k)));
  const roomRev = (br) => S.bookings.filter(b => ['confirmed', 'completed'].includes(b.status) && monthKey(b.start) === m && (!br || bookingBranch(b) === br)).reduce((n, b) => n + (b.price || 0), 0);
  const mrr = (br) => r2(act.filter(k => !br || resById(k.resourceId).branch === br).reduce((n, k) => n + k.monthly * (k.qty || 1), 0) + roomRev(br));
  const occOf = (br) => { const offs = S.resources.filter(r => ['office', 'shared'].includes(r.kind) && (!br || r.branch === br)); return offs.length ? pct(offs.filter(r => act.some(k => k.resourceId === r.id)).length, offs.length) : 0; };
  const desks = S.resources.filter(r => r.kind === 'desk'); const deskCap = desks.reduce((n, r) => n + r.cap, 0);
  const deskUsed = act.filter(k => resById(k.resourceId).kind === 'desk').reduce((n, k) => n + (k.qty || 1), 0);
  const rooms = S.resources.filter(r => r.kind === 'room' && !r.maintenance); const wk = bookableDays().slice(0, 5);
  const roomH = S.bookings.filter(b => ['confirmed', 'pending'].includes(b.status) && wk.includes(b.start.slice(0, 10))).reduce((n, b) => n + bookingHours(b), 0);
  const invoiced = r2(S.invoices.filter(i => i.status !== 'draft' && monthKey(i.issueDate) === m).reduce((n, i) => n + (i.kind === 'credit' ? -i.net : i.net), 0));
  const outstanding = r2(S.companies.reduce((n, c) => n + companyBalance(c.id), 0));
  const overdue = r2(S.companies.reduce((n, c) => { const a = agingFor(c.id); return n + a.total - a.cur; }, 0));
  const newClients = S.clients.filter(c => monthKey(c.createdAt) === m).length;
  const won = S.clients.filter(c => c.status === 'won').length; const conv = pct(won, S.clients.length);
  const byType = Object.keys(REQ_TYPES).map(k => [k, S.requests.filter(r => r.type === k).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
  const bySource = Object.keys(SOURCES).map(k => { const all = S.clients.filter(c => c.source === k); const w = all.filter(c => c.status === 'won').length; return [k, all.length, w, pct(w, all.length)]; }).filter(x => x[1]);
  const sales = S.users.filter(u => u.roleId === 'staff' && u.status === 'active').map(u => {
    const leads = S.clients.filter(c => c.owner === u.id);
    const wonV = r2(S.deals.filter(d => d.owner === u.id && d.status === 'approved' && monthKey(approvedAt(d)) === m).reduce((n, d) => n + dealNet(d), 0));
    const pipe = r2(S.deals.filter(d => d.owner === u.id && ['draft', 'pending', 'returned'].includes(d.status)).reduce((n, d) => n + dealNet(d), 0));
    const target = S.rules.targets.sales[u.id] || 0;
    return {u, leads:leads.length, late:leads.filter(leadLate).length, won:leads.filter(c => c.status === 'won').length, wonV, pipe, target};
  });
  const staff = S.users.filter(u => u.roleId !== 'owner' && u.status === 'active').map(u => { const rs = S.requests.filter(r => r.assignee === u.id); const done = rs.filter(r => ['done', 'approved', 'rejected'].includes(r.status)).length; return {u, total:rs.length, done, open:rs.length - done, follow:S.clients.filter(c => c.owner === u.id).length}; }).filter(x => x.total || x.follow);
  const expiring = S.contracts.filter(k => contractStatus(k) === 'expiring').sort((a, b) => a.end.localeCompare(b.end));
  const bookingsMonth = S.bookings.filter(b => activeBooking(b) && monthKey(b.start) === m).length;
  const branches = S.branches.map(b => ({b, mrr:mrr(b.id), occ:occOf(b.id), t:S.rules.targets.branches[b.id] || {revenue:0, occupancy:0}}));
  return {revenue:mrr(), invoiced, outstanding, overdue, newClients, conv, won, byType, bySource, staff, sales, expiring, bookingsMonth, branches,
    occ:{office:occOf(), desk:pct(deskUsed, deskCap), room:pct(roomH, Math.max(1, rooms.length * wk.length * (S.rules.booking.workEnd - S.rules.booking.workStart)))},
    deposits:act.reduce((n, k) => n + (k.deposit || 0), 0)};
}

/* ================= today (role aware) ================= */
VIEWS.mine = () => {
  const u = me();
  if (u.roleId === 'staff') return salesToday(u);
  if (u.roleId === 'accountant') return financeToday(u);
  if (u.roleId === 'owner' || u.roleId === 'ops') return mgmtToday(u);
  return genericToday(u);
};
function pendingBookingsTable(list, compact = false) {
  const ok = can('bookings', 'approve');
  return table(['العميل', 'القاعة', 'الموعد', 'المهلة', ''], list.map(b => { const r = resById(b.resourceId); const soon = new Date(b.holdUntil) - new Date() < S.rules.booking.alertBefore * 36e5;
    return `<tr><td><b>${coN(b.companyId) || esc(b.name)}</b><span class="sub">${b.people} أشخاص${b.notes ? ' · ' + esc(b.notes) : ''}</span></td><td>${esc(L(r.name, 'ar'))}${S.branches.length > 1 ? `<span class="sub">${esc(branchName(r.branch, 'ar'))}</span>` : ''}</td>
      <td>${fmtDate(b.start, true)}<span class="sub">${bookingHours(b)} ساعة</span></td><td><span class="chip ${soon ? 'bad' : 'warn'} num">${ic('clock')}${countdown(b.holdUntil)}</span></td>
      <td>${ok ? `<div class="toolbar" style="flex-wrap:nowrap"><button class="btn btn-gold btn-xs" data-act="bkx-confirm" data-id="${b.id}">${ic('check')} تأكيد</button><button class="btn btn-danger btn-xs" data-act="bkx-reject" data-id="${b.id}">رفض</button></div>` : '<span class="chip plain">يتطلب صلاحية</span>'}</td></tr>`; }), 'لا توجد حجوزات بانتظار التأكيد');
}
const pendingBookings = () => S.bookings.filter(b => b.status === 'pending' && bookingVisible(b)).sort((a, b) => (a.holdUntil || '').localeCompare(b.holdUntil || ''));
function salesToday(u) {
  const leads = visibleLeads(); const late = leads.filter(leadLate); const due = leads.filter(c => c.nextFollow && c.nextFollow <= today() && !['won', 'lost'].includes(c.status) && !leadLate(c));
  const pend = pendingBookings(); const myDeals = S.deals.filter(d => d.owner === u.id); const returned = myDeals.filter(d => d.status === 'returned');
  const reqs = visibleRequests().filter(r => r.status === 'new' && (r.assignee === u.id || !r.assignee));
  const M = metrics(); const mine = M.sales.find(s => s.u.id === u.id) || {wonV:0, pipe:0, target:0};
  const ending = S.contracts.filter(k => contractStatus(k) === 'expiring' && resById(k.resourceId).branch === u.branch);
  const task = (cls, icon, title, sub, act, id, btn) => `<div class="list-item task ${cls}">${ic(icon)}<div class="grow"><b>${title}</b><span>${sub}</span></div><button class="btn btn-ghost btn-xs" data-act="${act}" data-id="${id}">${btn}</button></div>`;
  return `<div class="tiles">${tile('بلا تواصل منذ +24 ساعة', late.length, {icon:'alert', delta:late.length ? 'تواصل معهم الآن' : 'لا يوجد تأخير', up:!late.length})}${tile('متابعات اليوم', due.length, {icon:'phone'})}${tile('حجوزات بانتظار تأكيدك', pend.length, {icon:'calendar'})}${tile('صفقات أُعيدت للتعديل', returned.length, {icon:'refresh'})}</div>
  <div class="cols">${panel('مهام اليوم', `<div>${[
      ...late.map(c => task('late', 'alert', `${esc(c.name)} <span class="chip bad">+24 ساعة بلا تواصل</span>`, `${esc(REQ_TYPES[c.service]?.ar || '')} · ${esc(SOURCES[c.source]?.ar || '')} · وصل ${ago(c.createdAt)}`, 'open-lead', c.id, 'سجّل تواصلًا')),
      ...returned.map(d => task('warn', 'refresh', `صفقة ${d.id} أُعيدت للتعديل`, esc(d.versions.at(-1)?.comment || ''), 'open-deal', d.id, 'عدّل الصفقة')),
      ...due.map(c => task('', 'phone', esc(c.name), `موعد المتابعة: ${fmtDate(c.nextFollow)}${c.nextAt ? ' ' + esc(c.nextAt) : ''} · ${esc(CRM_STATUS[c.status].ar)}`, 'open-lead', c.id, 'فتح')),
      ...reqs.slice(0, 6).map(r => task('', 'inbox', `${esc(REQ_TYPES[r.type].ar)} — ${esc(r.name)}`, `<span class="ltr">${r.id}</span> · ${ago(r.createdAt)}${r.assignee ? '' : ' · غير مُسند'}`, 'open-req', r.id, 'فتح'))
    ].join('') || '<div class="panel-body"><p class="muted">لا توجد مهام متأخرة اليوم 👌</p></div>'}</div>`, {pad:false, sub:'العملاء الجدد أولًا: التواصل خلال 24 ساعة'})}
    ${panel('تقاريري هذا الشهر', `<div style="display:grid;gap:14px"><div><p class="lbl">الصفقات المعتمدة مقابل الهدف</p>${meter(mine.wonV, mine.target, `${money(mine.wonV)} / ${money(mine.target)} ر.س`)}</div>
      <dl class="kv"><dt>صفقات قيد الإعداد والاعتماد</dt><dd class="num">${money(mine.pipe)} ر.س</dd><dt>عملائي المحتملون</dt><dd class="num">${leads.filter(c => !['won', 'lost'].includes(c.status)).length}</dd><dt>تعاقدات</dt><dd class="num">${leads.filter(c => c.status === 'won').length}</dd></dl>
      <div><p class="lbl">عقود تنتهي قريبًا في فرعي</p>${ending.map(k => `<div class="list-item" style="padding:6px 0">${ic('refresh')}<div class="grow"><b>${coN(k.companyId)}</b><span>${esc(L(resById(k.resourceId).name, 'ar'))} · بعد ${daysBetween(today(), k.end)} يومًا</span></div><button class="btn btn-ghost btn-xs" data-act="open-company" data-id="${k.companyId}">تواصل للتجديد</button></div>`).join('') || '<p class="muted">لا يوجد</p>'}</div></div>`)}</div>
  ${panel('حجوزات القاعات بانتظار التأكيد', pendingBookingsTable(pend), {pad:false, sub:`مرتبة حسب أقرب انتهاء للمهلة (${S.rules.booking.holdHours} ساعات) — يصل تنبيه قبل الانتهاء بساعة`})}
  ${panel('صفقاتي', table(['الصفقة', 'المنشأة', 'المساحة', 'القيمة', 'الحالة'], myDeals.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(d => `<tr class="click" data-act="open-deal" data-id="${d.id}"><td class="ltr" style="text-align:start"><b>${d.id}</b><span class="sub">v${Math.max(1, d.versions.length)}</span></td><td>${coN(d.companyId)}</td><td>${esc(L(resById(d.resourceId)?.name, 'ar'))}</td><td class="num">${money(dealNet(d))}</td><td>${chipM(DEAL_STATUS, d.status)}</td></tr>`), 'لا توجد صفقات'), {pad:false, actions:can('deals', 'add') ? `<button class="btn btn-gold btn-sm" data-act="deal-new">${ic('plus')} صفقة جديدة</button>` : ''})}`;
}
function mgmtToday(u) {
  const deals = S.deals.filter(d => d.status === 'pending').sort((a, b) => a.start.localeCompare(b.start));
  const verif = S.companies.filter(c => c.docs.some(d => d.status === 'review') || c.status === 'pending');
  const changes = S.companies.filter(c => c.pendingChange);
  const unsigned = S.contracts.filter(k => k.status === 'awaiting');
  const hot = S.bookings.filter(b => b.status === 'pending' && new Date(b.holdUntil) - new Date() < S.rules.booking.alertBefore * 36e5);
  const late60 = S.companies.filter(c => maxLateDays(c.id) > S.rules.billing.reminders.suspend && c.status !== 'suspended');
  const late30 = S.companies.filter(c => { const d = maxLateDays(c.id); return d > S.rules.billing.reminders.warn && d <= S.rules.billing.reminders.suspend; });
  const M = metrics(); const fin = can('dashboard', 'finance');
  const item = (cls, icon, title, sub, act, id, btn, k = '') => `<div class="list-item task ${cls}">${ic(icon)}<div class="grow"><b>${title}</b><span>${sub}</span></div><button class="btn btn-ghost btn-xs" data-act="${act}" data-id="${id}" ${k ? `data-k="${k}"` : ''}>${btn}</button></div>`;
  const list = [
    ...deals.map(d => { const c = dealCalc(d); return item(c.flags.some(f => f.k === 'discount') ? 'warn' : '', 'stamp', `اعتماد صفقة ${d.id} — ${coN(d.companyId)} <span class="chip info">v${d.versions.length}</span>`, `تبدأ ${fmtDate(d.start)} · ${money(c.net)} ر.س · خصم ${d.discountPct || 0}%${c.flags.length ? ' · ' + c.flags.map(f => esc(f.text)).join(' · ') : ''}`, 'open-approval', d.id, 'مراجعة'); }),
    ...hot.map(b => item('late', 'clock', `حجز ينتهي خلال ${countdown(b.holdUntil)} دون تأكيد`, `${coN(b.companyId)} · ${esc(L(resById(b.resourceId).name, 'ar'))} · ${fmtDate(b.start, true)}`, 'nav', '', 'الحجوزات', 'bookings')),
    ...verif.map(c => item('', 'idcard', `تحقق مستندات ${esc(c.nameAr)}`, `${c.docs.filter(d => d.status === 'review').length} مستند قيد المراجعة · ${c.docs.filter(d => d.status === 'missing' && DOC_TYPES[d.type].req).length} مطلوب لم يُرفع`, 'open-company', c.id, 'فتح')),
    ...changes.map(c => item('', 'edit', `تعديل «${esc(c.pendingChange.label)}» — ${esc(c.nameAr)}`, `من «${esc(c.pendingChange.from)}» إلى «${esc(c.pendingChange.to)}»`, 'open-company', c.id, 'مراجعة')),
    ...unsigned.map(k => item('', 'contract', `عقد ${k.id} بانتظار التوقيع`, `${coN(k.companyId)} · يبدأ ${fmtDate(k.start)}`, 'open-contract', k.id, 'فتح')),
    ...late60.map(c => item('late', 'ban', `${esc(c.nameAr)}: متأخرات أكثر من ${S.rules.billing.reminders.suspend} يومًا`, `${money(companyBalance(c.id))} ر.س — السياسة: إيقاف الخدمة`, 'open-company', c.id, 'قرار')),
    ...late30.map(c => item('warn', 'alert', `${esc(c.nameAr)}: إنذار — متأخرات أكثر من ${S.rules.billing.reminders.warn} يومًا`, `${money(companyBalance(c.id))} ر.س`, 'open-company', c.id, 'فتح'))
  ];
  const main = M.branches[0];
  return `<div class="tiles">${tile('المطلوب منكم اليوم', list.length, {icon:'target'})}${tile('الإيراد الشهري المتعاقد (ر.س)', money(M.revenue), {icon:'coins', locked:!fin, delta:`الهدف ${money(M.branches.reduce((n, b) => n + b.t.revenue, 0))}`, up:M.revenue >= M.branches.reduce((n, b) => n + b.t.revenue, 0)})}
    ${tile('إشغال المكاتب', M.occ.office + '%', {icon:'office', delta:`الهدف ${main.t.occupancy}%`, up:M.occ.office >= main.t.occupancy})}${tile('متأخرات (ر.س)', money(M.overdue), {icon:'alert', locked:!fin})}</div>
  <div class="cols">${panel('المطلوب منكم اليوم', `<div>${list.join('') || '<div class="panel-body"><p class="muted">لا يوجد ما ينتظر قراركم الآن.</p></div>'}</div>`, {pad:false, sub:'الاعتمادات أولًا مرتبة حسب تاريخ البدء'})}
    ${panel('الأداء مقابل الأهداف', `<div style="display:grid;gap:16px">${M.branches.map(x => `<div><p class="lbl">${esc(x.b.name)}</p>
      <div class="tgt-row"><span>الإيراد</span>${fin ? meter(x.mrr, x.t.revenue, `${money(x.mrr)} / ${money(x.t.revenue)}`) : '<span class="muted">•••</span>'}</div>
      <div class="tgt-row"><span>الإشغال</span>${meter(x.occ, x.t.occupancy, `${x.occ}% / ${x.t.occupancy}%`)}</div></div>`).join('')}
      <div><p class="lbl">المبيعات</p>${M.sales.map(s => `<div class="tgt-row"><span>${esc(s.u.name)}</span>${meter(s.wonV, s.target, `${pct(s.wonV, s.target)}%`)}</div>`).join('')}</div>
      <button class="btn btn-ghost btn-sm" data-act="nav" data-k="dashboard" style="justify-self:start">${ic('chart')} لوحة المؤشرات الكاملة</button></div>`)}</div>`;
}
function financeToday(u) {
  const recs = S.payments.filter(p => p.status === 'review'); const drafts = S.invoices.filter(i => i.status === 'draft');
  const rem = S.rules.billing.reminders; const st = (c) => { const d = maxLateDays(c.id); return d > rem.suspend ? 'suspend' : d > rem.warn ? 'warn' : d >= rem.remind ? 'remind' : ''; };
  const late = S.companies.filter(c => st(c)); const q = quarterOf(today()); const V = vatReport(q);
  return `<div class="tiles">${tile('إيصالات بانتظار المراجعة', recs.length, {icon:'upload'})}${tile('مسودات فواتير للإصدار', drafts.length, {icon:'doc'})}${tile('منشآت متأخرة', late.length, {icon:'alert'})}${tile(`ضريبة ${q} المستحقة (ر.س)`, money(V.net), {icon:'coins'})}</div>
  <div class="cols even">${panel('إيصالات التحويل', table(['المنشأة', 'المرجع', 'المبلغ', ''], recs.map(p => `<tr><td>${coN(p.companyId)}<span class="sub">${fmtDate(p.date)}</span></td><td class="ltr" style="text-align:start">${esc(p.ref)}</td><td class="num">${sar(p.amount)}</td><td><button class="btn btn-gold btn-xs" data-act="open-payment" data-id="${p.id}">مراجعة</button></td></tr>`), 'لا توجد إيصالات'), {pad:false})}
    ${panel('المسودات', `${table(['المنشأة', 'الفترة', 'الإجمالي'], drafts.slice(0, 6).map(i => `<tr class="click" data-act="open-invoice" data-id="${i.id}"><td>${coN(i.companyId)}</td><td>${i.period ? fmtDate(i.period.from) : '—'}</td><td class="num">${sar(i.total)}</td></tr>`), 'لا توجد مسودات')}`, {pad:false, actions:`<button class="btn btn-ghost btn-sm" data-act="gen-drafts">${ic('refresh')} توليد من الجداول</button><button class="btn btn-gold btn-sm" data-act="nav" data-k="billing">الفواتير</button>`})}</div>
  ${panel('متابعة المتأخرات حسب السياسة', table(['المنشأة', 'أقدم تأخير', 'المبلغ', 'الإجراء المستحق', ''], late.map(c => { const s = st(c); const lab = {remind:['تذكير', 'info'], warn:['إنذار', 'warn'], suspend:['إيقاف الخدمة', 'bad']}[s];
    return `<tr><td>${esc(c.nameAr)}</td><td class="num">${maxLateDays(c.id)} يومًا</td><td class="num">${sar(companyBalance(c.id))}</td><td><span class="chip ${lab[1]}">${lab[0]}</span></td><td><button class="btn btn-ghost btn-xs" data-act="aging-remind" data-id="${c.id}" data-s="${s}">${ic('mail')} إرسال</button></td></tr>`; }), 'لا توجد متأخرات'), {pad:false, sub:`تذكير بعد ${rem.remind} أيام · إنذار بعد ${rem.warn} · إيقاف بعد ${rem.suspend}`})}`;
}
function genericToday(u) {
  const mine = S.requests.filter(r => r.assignee === u.id && !['done', 'approved', 'rejected'].includes(r.status));
  const pend = can('bookings', 'approve') ? pendingBookings() : [];
  return `<div class="tiles">${tile('طلبات مفتوحة مسندة إليّ', mine.length, {icon:'inbox'})}${tile('إشعارات غير مقروءة', myNotifs().filter(n => !n.read).length, {icon:'bell'})}${can('bookings', 'approve') ? tile('حجوزات بانتظار التأكيد', pend.length, {icon:'calendar'}) : ''}${tile('عملياتي في السجل', S.audit.filter(a => a.by === u.id).length, {icon:'list'})}</div>
  ${pend.length ? panel('حجوزات القاعات بانتظار التأكيد', pendingBookingsTable(pend), {pad:false}) : ''}
  ${panel('طلباتي المفتوحة', table(['الطلب', 'العميل', 'الحالة', 'التاريخ'], mine.map(r => `<tr class="click" data-act="open-req" data-id="${r.id}"><td><b class="ltr">${r.id}</b><span class="sub">${esc(REQ_TYPES[r.type].ar)}</span></td><td>${esc(r.name)}</td><td>${stChip(r.status)}</td><td>${fmtDate(r.createdAt)}</td></tr>`), 'لا توجد طلبات مفتوحة مسندة إليك'), {pad:false})}`;
}

/* ================= KPI dashboard ================= */
VIEWS.dashboard = () => {
  const M = metrics(); const fin = can('dashboard', 'finance');
  const tr = Object.keys(CRM_STATUS).map(k => [CRM_STATUS[k].ar, S.clients.filter(c => c.status === k).length]);
  return `<div class="toolbar" style="justify-content:flex-end"><button class="btn btn-ghost btn-sm" data-act="nav" data-k="reports">${ic('chart')} التقارير القابلة للتصدير</button></div>
  <div class="tiles">${tile('الإيراد الشهري المتعاقد (ر.س)', money(M.revenue), {icon:'coins', locked:!fin, delta:`الشهر الماضي ${money(S.history.at(-1).revenue)}`, up:M.revenue >= S.history.at(-1).revenue})}
    ${tile('المفوتر هذا الشهر (ر.س)', money(M.invoiced), {icon:'doc', locked:!fin})}${tile('الذمم المستحقة (ر.س)', money(M.outstanding), {icon:'alert', locked:!fin, delta:`منها متأخر ${money(M.overdue)}`, up:!M.overdue})}${tile('تحويل العملاء المحتملين', M.conv + '%', {icon:'chart'})}</div>
  <div class="cols">${panel('الفروع مقابل الأهداف', table(['الفرع', 'الإيراد الشهري', 'الهدف', 'الإنجاز', 'الإشغال', 'هدف الإشغال'], M.branches.map(x => `<tr><td><b>${esc(x.b.name)}</b></td><td class="num">${fin ? money(x.mrr) : '•••'}</td><td class="num">${fin ? money(x.t.revenue) : '•••'}</td><td style="min-width:140px">${fin ? meter(x.mrr, x.t.revenue) : '•••'}</td><td style="min-width:140px">${meter(x.occ, x.t.occupancy, x.occ + '%')}</td><td class="num">${x.t.occupancy}%</td></tr>`)), {pad:false, sub:'الأهداف الشهرية من «قواعد العمل»'})}
    ${panel('نسبة الإشغال', barsHTML([['المكاتب المقفلة والمشتركة', M.occ.office], ['المقاعد المرنة', M.occ.desk], ['القاعات (5 أيام قادمة)', M.occ.room]], v => v + '%'))}</div>
  <div class="cols">${panel(fin ? 'الإيراد الشهري: مقارنة الشهور' : 'الحجوزات الشهرية', fin ? monthChart('revenue', 'الإيراد') : monthChart('bookings', 'الحجوزات', v => v), {sub:'آخر ستة أشهر والشهر الحالي'})}
    ${panel('مراحل العملاء المحتملين', barsHTML(tr))}</div>
  ${panel('أداء المبيعات', table(['الموظف', 'عملاء محتملون', 'بلا تواصل +24س', 'تعاقدات', 'معتمد هذا الشهر', 'الهدف', 'الإنجاز', 'قيد الإعداد'], M.sales.map(s => `<tr><td>${whoTag(s.u.id)}</td><td class="num">${s.leads}</td><td class="num ${s.late ? 'bad-t' : ''}">${s.late}</td><td class="num">${s.won}</td><td class="num">${money(s.wonV)}</td><td class="num">${money(s.target)}</td><td style="min-width:130px">${meter(s.wonV, s.target)}</td><td class="num">${money(s.pipe)}</td></tr>`)), {pad:false})}
  <div class="cols even">${panel('المصادر والحملات', table(['المصدر', 'العملاء', 'تعاقدوا', 'التحويل'], M.bySource.sort((a, b) => b[1] - a[1]).map(([k, n, w, p]) => `<tr><td>${esc(SOURCES[k].ar)}</td><td class="num">${n}</td><td class="num">${w}</td><td class="num">${p}%</td></tr>`)), {pad:false, sub:'يُسجَّل مصدر كل عميل من النموذج أو الموظف'})}
    ${panel('أكثر الطلبات', barsHTML(M.byType.slice(0, 8).map(([k, v]) => [REQ_TYPES[k].ar, v])))}</div>`;
};

/* ================= leads board (CRM) ================= */
const LEAD_STAGES = ['new', 'assigned', 'contacted', 'deal'];
VIEWS.crm = () => {
  const list = visibleLeads(); const late = list.filter(leadLate);
  const due = list.filter(c => c.nextFollow && c.nextFollow <= today() && !['won', 'lost'].includes(c.status)).length;
  const card = (c) => `<div class="lead-card ${leadLate(c) ? 'late' : ''}" data-act="open-lead" data-id="${c.id}" tabindex="0" role="button"><b>${esc(c.name)}${leadLate(c) ? ' <span class="chip bad">+24 ساعة</span>' : ''}</b>
    <span class="muted">${esc(c.company || '')}${c.company ? ' · ' : ''}${esc(REQ_TYPES[c.service]?.ar || '')}</span><span class="muted" style="font-size:12px">${esc(SOURCES[c.source]?.ar || '')}${S.branches.length > 1 ? ' · ' + esc(branchName(c.branch, 'ar')) : ''}</span>
    <span class="due ${c.nextFollow && c.nextFollow < today() && !['won', 'lost'].includes(c.status) ? 'late' : 'muted'}">${c.nextFollow && !['won', 'lost'].includes(c.status) ? 'المتابعة: ' + fmtDate(c.nextFollow) : ''}</span>${c.owner ? `<span class="muted" style="font-size:12px">${esc(userName(c.owner))}</span>` : '<span class="chip plain">غير مُسند</span>'}</div>`;
  const closed = (k) => list.filter(c => c.status === k);
  return `<div class="tiles">${tile('عملاء محتملون مفتوحون', list.filter(c => !['won', 'lost'].includes(c.status)).length, {icon:'users'})}${tile('بلا تواصل +24 ساعة', late.length, {icon:'alert', up:!late.length, delta:late.length ? 'أولوية اليوم' : ''})}${tile('متابعات مستحقة', due, {icon:'phone'})}${tile('تحويل إلى عقد', pct(closed('won').length, list.length) + '%', {icon:'chart'})}</div>
  ${scopeOf() === 'branch' ? `<div class="notice">${ic('info')}<div>تظهر لك عملاء ${esc(branchName(me().branch, 'ar'))} وغير المُسندين فيه وما أُسند إليك.</div></div>` : ''}
  ${panel('العملاء المحتملون', UI.crmMode === 'list' ? table(['العميل', 'الخدمة', 'المصدر', 'المرحلة', 'المسؤول', 'آخر تواصل', 'المتابعة'], list.map(c => `<tr class="click" data-act="open-lead" data-id="${c.id}"><td><b>${esc(c.name)}</b>${leadLate(c) ? ' <span class="chip bad">+24س</span>' : ''}<span class="sub">${esc(c.company || '')}</span></td><td>${esc(REQ_TYPES[c.service]?.ar || '')}</td><td>${esc(SOURCES[c.source]?.ar || '')}</td><td>${chipM(CRM_STATUS, c.status)}${c.status === 'lost' && c.closeReason ? `<span class="sub">${esc((LOST_REASONS.find(x => x[0] === c.closeReason) || [, ''])[1])}</span>` : ''}</td><td>${whoTag(c.owner)}</td><td>${c.lastContactAt ? ago(c.lastContactAt) : '—'}</td><td>${fmtDate(c.nextFollow)}</td></tr>`))
    : `<div class="board">${LEAD_STAGES.map(k => { const cs = list.filter(c => c.status === k); return `<div class="lane"><h4><span>${CRM_STATUS[k].ar}</span><span class="muted num">${cs.length}</span></h4>${cs.map(card).join('')}</div>`; }).join('')}
      <div class="lane closed"><h4><span>مُغلقة</span><span class="muted num">${closed('won').length + closed('lost').length}</span></h4><p class="lbl ok-t">تعاقد ${closed('won').length}</p>${closed('won').slice(0, 4).map(card).join('')}<p class="lbl bad-t">مغلق ${closed('lost').length}</p>${closed('lost').slice(0, 4).map(card).join('')}</div></div>`,
    {pad:UI.crmMode !== 'list', sub:'جديد ← مُسند ← تم التواصل ← صفقة ← تعاقد أو إغلاق بسبب إلزامي', actions:`<div class="seg" role="tablist"><button class="${UI.crmMode !== 'list' ? 'on' : ''}" data-act="crm-mode" data-m="board">لوحة</button><button class="${UI.crmMode === 'list' ? 'on' : ''}" data-act="crm-mode" data-m="list">قائمة</button></div>
      ${can('crm', 'add') ? `<button class="btn btn-gold btn-sm" data-act="lead-new">${ic('plus')} عميل محتمل</button>` : ''}<button class="btn btn-ghost btn-sm" data-act="crm-export" ${can('crm', 'export') ? '' : 'disabled title="يتطلب صلاحية التصدير"'}>${ic('download')} تصدير</button>`})}`;
};
ACT['crm-mode'] = (el) => { UI.crmMode = el.dataset.m; renderAdmin(); };
ACT['crm-export'] = () => exportDialog('العملاء المحتملون', [['الاسم', 'الشركة', 'الجوال', 'البريد', 'الخدمة', 'المصدر', 'المرحلة', 'سبب الإغلاق', 'المسؤول', 'الفرع', 'المتابعة القادمة'], ...visibleLeads().map(c => [c.name, c.company, showPhone(c.phone), showEmail(c.email), REQ_TYPES[c.service]?.ar, SOURCES[c.source]?.ar, CRM_STATUS[c.status].ar, (LOST_REASONS.find(x => x[0] === c.closeReason) || [, ''])[1], userName(c.owner), branchName(c.branch, 'ar'), c.nextFollow])], 'crm');
ACT['lead-new'] = () => { if (!guard('crm', 'add')) return; openLead({id:uid('c'), name:'', phone:'', email:'', company:'', service:'quote', source:'visit', status:me().roleId === 'staff' ? 'assigned' : 'new', owner:me().roleId === 'staff' ? me().id : null, branch:me().branch, nextFollow:today(), createdAt:new Date().toISOString(), lastContactAt:null, log:[], notes:'', closeReason:'', companyId:null, _new:true}); };
ACT['open-lead'] = (el) => openLead(S.clients.find(c => c.id === el.dataset.id));
ACT['open-client'] = ACT['open-lead'];
function openLead(c) {
  if (!c) return; if (!c._new && !inScope(c, 'owner')) return toast('هذا العميل خارج نطاق صلاحيتك.', true);
  const ed = can('crm', c._new ? 'add' : 'edit'); const dis = ed ? '' : 'disabled';
  const reqs = S.requests.filter(r => (c.email && r.email === c.email) || (c.phone && r.phone === c.phone) || (c.companyId && r.companyId === c.companyId));
  const deals = c.companyId ? S.deals.filter(d => d.companyId === c.companyId) : [];
  openModal({size:'xl', title:c._new ? 'عميل محتمل جديد' : esc(c.name), sub:c._new ? '' : `${chipM(CRM_STATUS, c.status)} · منذ ${fmtDate(c.createdAt)}${leadLate(c) ? ' · <span class="chip bad">+24 ساعة بلا تواصل</span>' : ''}`, body:`<div class="detail"><div style="display:grid;gap:14px;align-content:start">
    <div class="form"><div class="row">${fld('cl-name', 'الاسم', inp('cl-name', c.name, 'text', dis))}${fld('cl-co', 'الشركة', inp('cl-co', c.company, 'text', dis))}</div>
    <div class="row">${fld('cl-phone', 'الجوال', inp('cl-phone', c._new ? '' : showPhone(c.phone), 'tel', dis + ' dir="ltr"'))}${fld('cl-email', 'البريد', inp('cl-email', c._new ? '' : showEmail(c.email), 'email', dis + ' dir="ltr"'))}</div>
    <div class="row">${fld('cl-svc', 'الاهتمام', `<select class="input" id="cl-svc" ${dis}>${options(Object.entries(REQ_TYPES).map(([k, v]) => [k, v.ar]), c.service)}</select>`)}${fld('cl-src', 'المصدر / الحملة', `<select class="input" id="cl-src" ${dis}>${options(Object.entries(SOURCES).map(([k, v]) => [k, v.ar]), c.source)}</select>`)}</div>
    <div class="row">${fld('cl-own', 'الموظف المسؤول', `<select class="input" id="cl-own" ${can('crm', 'assign') || (me().roleId === 'staff' && !c.owner) ? '' : 'disabled'}><option value="">غير مُسند</option>${options(staffOpts(), c.owner)}</select>`)}${fld('cl-br', 'الفرع', `<select class="input" id="cl-br" ${dis}>${options(S.branches.map(b => [b.id, b.name]), c.branch || 'main')}</select>`)}</div>
    ${fld('cl-notes', 'ملاحظات داخلية', `<textarea class="input" id="cl-notes" ${dis}>${esc(c.notes)}</textarea>`)}
    ${ed ? `<div class="toolbar"><button class="btn btn-gold" id="cl-save">حفظ</button>${!c._new && !['won', 'lost'].includes(c.status) ? `<button class="btn btn-danger btn-sm" data-act="lead-close" data-id="${c.id}">إغلاق مع ذكر السبب</button>` : ''}${c.status === 'lost' ? `<button class="btn btn-ghost btn-sm" data-act="lead-stage" data-id="${c.id}" data-s="contacted">إعادة فتح</button>` : ''}</div>` : lockNote('تعديل العميل يتطلب صلاحية «تعديل» في العملاء.')}</div>
    ${!c._new ? `<div class="panel"><div class="panel-head"><h2>المرحلة</h2></div><div class="panel-body"><div class="stage-bar">${[...LEAD_STAGES, 'won'].map((k, i) => { const idx = [...LEAD_STAGES, 'won'].indexOf(c.status); return `<button class="${i <= idx && c.status !== 'lost' ? 'done' : ''} ${k === c.status ? 'on' : ''}" data-act="lead-stage" data-id="${c.id}" data-s="${k}" ${ed && k !== 'won' ? '' : 'disabled'}>${CRM_STATUS[k].ar}</button>`; }).join('')}</div>
      ${c.status === 'lost' ? `<p class="bad-t" style="margin-top:8px">أُغلق: ${esc((LOST_REASONS.find(x => x[0] === c.closeReason) || [, '—'])[1])}</p>` : ''}
      ${['contacted', 'deal'].includes(c.status) && can('deals', 'add') ? `<button class="btn btn-gold btn-sm" style="margin-top:12px" data-act="deal-new" data-lead="${c.id}">${ic('brief')} ${c.status === 'deal' ? 'صفقة جديدة لهذا العميل' : 'إنشاء صفقة'}</button>` : ''}</div></div>` : ''}
  </div><div style="display:grid;gap:14px;align-content:start">${c._new ? '' : `
    <div class="panel"><div class="panel-head"><h2>سجل النشاط</h2></div><div class="panel-body">
      ${ed ? `<div class="form" style="margin-bottom:14px"><div class="row">${fld('lg-kind', 'النوع', `<select class="input" id="lg-kind">${options([['call', 'مكالمة'], ['whatsapp', 'واتساب'], ['visit', 'زيارة'], ['email', 'بريد'], ['meeting', 'اجتماع']])}</select>`)}${fld('lg-next', 'الموعد القادم', `<div class="row" style="gap:6px">${inp('lg-next', '', 'date', `min="${today()}"`)}${inp('lg-at', '', 'time')}</div>`)}</div>
        ${fld('lg-text', 'ملخص النشاط', inp('lg-text', '', 'text', 'placeholder="مثال: اتصلت، يطلب عرض سعر لمكتب 4 أشخاص"'))}<button class="btn btn-ghost btn-sm" id="lg-add" style="justify-self:start">${ic('plus')} تسجيل النشاط</button></div>` : ''}
      <div class="timeline">${c.log.map(l => `<div class="tl"><i class="${l.kind === 'web' ? '' : 'note'}"></i><div><p>${esc(l.text)}</p><span>${esc(userName(l.by))} · ${fmtDate(l.at, true)}${l.next ? ` · الموعد القادم ${fmtDate(l.next)}${l.nextAt ? ' ' + esc(l.nextAt) : ''}` : ''}</span></div></div>`).join('') || '<p class="muted">لا يوجد نشاط بعد</p>'}</div></div></div>
    <div class="panel"><div class="panel-head"><h2>الطلبات المرتبطة</h2></div>${table(['الطلب', 'الحالة'], reqs.map(r => `<tr class="click" data-act="open-req" data-id="${r.id}"><td class="ltr" style="text-align:start">${r.id} <span class="sub">${esc(REQ_TYPES[r.type].ar)}</span></td><td>${stChip(r.status)}</td></tr>`), 'لا توجد طلبات')}</div>
    ${deals.length ? `<div class="panel"><div class="panel-head"><h2>الصفقات</h2></div>${table(['الصفقة', 'الحالة'], deals.map(d => `<tr class="click" data-act="open-deal" data-id="${d.id}"><td class="ltr" style="text-align:start">${d.id}</td><td>${chipM(DEAL_STATUS, d.status)}</td></tr>`))}</div>` : ''}
    ${c.companyId ? `<button class="btn btn-ghost btn-sm" data-act="open-company" data-id="${c.companyId}" style="justify-self:start">${ic('office')} ملف المنشأة</button>` : ''}`}</div></div>`,
  onMount:(m) => {
    const sv = m.querySelector('#cl-save'); if (sv) sv.onclick = () => {
      const g = (id) => m.querySelector('#' + id).value.trim(); if (!g('cl-name')) return toast('أدخل اسم العميل', true);
      const before = {المسؤول:userName(c.owner), المرحلة:CRM_STATUS[c.status].ar};
      Object.assign(c, {name:g('cl-name'), company:g('cl-co'), service:g('cl-svc'), source:g('cl-src'), notes:g('cl-notes'), branch:g('cl-br')});
      if (customerData() || c._new) { c.phone = g('cl-phone'); c.email = g('cl-email'); }
      const own = g('cl-own') || null; if (own !== c.owner && !m.querySelector('#cl-own').disabled) { c.owner = own; if (own && c.status === 'new') c.status = 'assigned'; if (own) notify(own, 'أُسند إليك عميل محتمل', c.name, 'crm'); c.log.unshift({at:new Date().toISOString(), by:me().id, kind:'status', text:`أُسند إلى ${userName(own)}`}); }
      if (c._new) { delete c._new; S.clients.unshift(c); audit('create', 'عميل محتمل: ' + c.name); } else audit('crm', 'عميل: ' + c.name, before, {المسؤول:userName(c.owner), المرحلة:CRM_STATUS[c.status].ar});
      closeModal(); rerender(); toast('حُفظ');
    };
    const la = m.querySelector('#lg-add'); if (la) la.onclick = () => {
      const v = m.querySelector('#lg-text').value.trim(); if (!v) return toast('اكتب ملخص النشاط', true);
      const next = m.querySelector('#lg-next').value, at = m.querySelector('#lg-at').value; const now = new Date().toISOString();
      c.log.unshift({at:now, by:me().id, kind:m.querySelector('#lg-kind').value, text:v, next, nextAt:at}); c.lastContactAt = now;
      if (next) { c.nextFollow = next; c.nextAt = at; }
      if (['new', 'assigned'].includes(c.status)) { c.status = 'contacted'; if (!c.owner) c.owner = me().id; }
      audit('crm', 'عميل: ' + c.name, null, {نشاط:v, الموعد_القادم:next || '—'}); save(); openLead(c); renderAdminKeepModal();
    };
  }});
}
ACT['lead-stage'] = (el) => {
  const c = S.clients.find(x => x.id === el.dataset.id); const s = el.dataset.s; if (!guard('crm', 'edit')) return; if (s === c.status) return;
  if (s === 'lost') return ACT['lead-close'](el);
  const before = CRM_STATUS[c.status].ar; c.status = s; if (s !== 'lost') c.closeReason = ''; if (s === 'contacted' && !c.lastContactAt) c.lastContactAt = new Date().toISOString();
  if (s === 'assigned' && !c.owner) c.owner = me().id;
  c.log.unshift({at:new Date().toISOString(), by:me().id, kind:'status', text:`انتقل إلى مرحلة «${CRM_STATUS[s].ar}»`}); audit('crm', 'عميل: ' + c.name, {المرحلة:before}, {المرحلة:CRM_STATUS[s].ar}); save(); openLead(c); renderAdminKeepModal();
};
ACT['lead-close'] = (el) => {
  const c = S.clients.find(x => x.id === el.dataset.id); if (!guard('crm', 'edit')) return;
  openModal({title:'إغلاق العميل المحتمل', sub:esc(c.name), body:`<div class="form">${fld('lc-r', 'سبب الإغلاق (إلزامي)', `<select class="input" id="lc-r"><option value="">اختر السبب</option>${options(LOST_REASONS)}</select>`)}${fld('lc-n', 'تفاصيل', inp('lc-n', '', 'text', 'placeholder="مثال: يعاود التواصل بعد 6 أشهر"'))}${fld('lc-f', 'تذكير بإعادة التواصل (اختياري)', inp('lc-f', '', 'date', `min="${today()}"`))}<button class="btn btn-danger" id="lc-go" style="justify-self:start">إغلاق</button></div>`,
    onMount:(m) => m.querySelector('#lc-go').onclick = () => { const r = m.querySelector('#lc-r').value; if (!r) return toast('سبب الإغلاق إلزامي', true);
      const before = CRM_STATUS[c.status].ar; c.status = 'lost'; c.closeReason = r; c.nextFollow = m.querySelector('#lc-f').value || ''; const n = m.querySelector('#lc-n').value.trim(); if (n) c.notes = (c.notes ? c.notes + '\n' : '') + n;
      c.log.unshift({at:new Date().toISOString(), by:me().id, kind:'status', text:`أُغلق — ${(LOST_REASONS.find(x => x[0] === r) || [, r])[1]}${n ? ': ' + n : ''}`}); audit('crm', 'عميل: ' + c.name, {المرحلة:before}, {المرحلة:'مغلق', السبب:(LOST_REASONS.find(x => x[0] === r) || [, r])[1]}); closeModal(); rerender(); toast('أُغلق مع تسجيل السبب'); }});
};

/* ================= room bookings (admin) ================= */
const HRS = Array.from({length:14}, (_, i) => 8 + i);
const pad2_ = (n) => String(n).padStart(2, '0');
function weekStart(offset) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 1) % 7) + offset * 7); return d; }
VIEWS.bookings = () => {
  const ws = weekStart(UI.calWeek); const days = Array.from({length:7}, (_, i) => { const d = new Date(ws); d.setDate(d.getDate() + i); return d; });
  const rooms = S.resources.filter(r => r.kind === 'room' && branchVisible(r.branch)); if (!rooms.find(r => r.id === UI.calRes)) UI.calRes = rooms[0]?.id;
  const res = resById(UI.calRes); const bs = S.bookings.filter(b => b.resourceId === res.id && activeBooking(b)); const now = new Date();
  const pend = pendingBookings(); const recent = S.bookings.filter(b => ['rejected', 'expired', 'cancelled'].includes(b.status) && bookingVisible(b)).sort((a, b) => b.start.localeCompare(a.start)).slice(0, 6);
  const cols = days.map(d => { const ds = dstr(d); const d0 = new Date(`${ds}T08:00:00`), d1 = new Date(`${ds}T22:00:00`); const off = !isWorkday(ds);
    const blocks = bs.filter(b => new Date(b.start) < d1 && new Date(b.end) > d0).map(b => { const s = Math.max(d0, new Date(b.start)), e = Math.min(d1, new Date(b.end));
      return `<div class="bk ${b.status}" style="top:${(s - d0) / 36e5 * 44}px;height:${Math.max(20, (e - s) / 36e5 * 44 - 3)}px" data-act="open-booking" data-id="${b.id}" title="${esc(b.name)}"><b>${esc(b.name)}</b>${fmtTime(b.start)} – ${fmtTime(b.end)}${b.status === 'pending' ? ' · بانتظار التأكيد' : ''}</div>`; }).join('');
    const pastH = ds === today() ? Math.max(0, Math.min(14, (now - d0) / 36e5)) : (d1 < now ? 14 : 0);
    return `<div class="cal-col ${off ? 'off' : ''}" data-act="cal-slot" data-date="${ds}">${pastH ? `<div class="cal-past" style="height:${pastH * 44}px"></div>` : ''}${blocks}</div>`; }).join('');
  return `${panel('بانتظار التأكيد', pendingBookingsTable(pend), {pad:false, sub:`الحجز معلّق ${S.rules.booking.holdHours} ساعات ولا يظهر لعملاء آخرين — الرفض يتطلب سببًا ويمكن اقتراح حتى 3 بدائل`})}
  ${panel('تقويم القاعات', `<div class="toolbar" style="margin-bottom:14px;justify-content:space-between">
      <div class="toolbar"><select class="input" id="cal-res" aria-label="القاعة">${options(rooms.map(r => [r.id, `${L(r.name, 'ar')} (${r.cap})${S.branches.length > 1 ? ' — ' + branchName(r.branch, 'ar') : ''}`]), UI.calRes)}</select>
      <div class="seg"><button data-act="cal-week" data-d="-1" aria-label="الأسبوع السابق">${ic('arrow')}</button><button data-act="cal-week" data-d="0" class="${UI.calWeek === 0 ? 'on' : ''}">هذا الأسبوع</button><button data-act="cal-week" data-d="1" aria-label="الأسبوع التالي">${ic('back')}</button></div></div>
      <div class="legend"><span><i style="background:linear-gradient(135deg,#E6C46C,#C79A3E)"></i>مؤكد</span><span><i style="border:1px dashed var(--warn);background:var(--warn-soft)"></i>بانتظار التأكيد</span><span><i style="background:var(--surface-2)"></i>عطلة / مضى</span></div></div>
    <div class="tbl-wrap"><div class="cal2"><div class="ch"></div>${days.map(d => `<div class="ch ${dstr(d) === today() ? 'today' : ''}">${d.toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', {weekday:'short', day:'numeric', month:'short'})}</div>`).join('')}
      <div class="hrs">${HRS.map(h => `<div class="hr">${h}:00</div>`).join('')}</div>${cols}</div></div>
    <p class="muted" style="font-size:13px;margin-top:10px">${can('bookings', 'add') ? 'اضغط على وقت فارغ لإضافة حجز داخلي (فعالية أو عميل بالهاتف). ' : ''}يمنع النظام الحجز المكرر، والعملاء يحجزون من البوابة.</p>`,
    {sub:`${L(res.name, 'ar')} — السعة ${res.cap} · ${money(res.rate.hour)} ر.س/ساعة`, actions:`<button class="btn btn-ghost btn-sm" data-act="booking-export" ${can('bookings', 'export') ? '' : 'disabled'}>${ic('download')} تصدير</button>`})}
  ${panel('آخر المرفوضة والمنتهية والملغاة', table(['العميل', 'القاعة', 'الموعد', 'الحالة'], recent.map(b => `<tr class="click" data-act="open-booking" data-id="${b.id}"><td>${esc(b.name)}</td><td>${esc(L(resById(b.resourceId).name, 'ar'))}</td><td>${fmtDate(b.start, true)}</td><td>${chipM(BOOKING_STATUS, b.status)}${b.reason ? `<span class="sub">${esc(b.reason)}</span>` : ''}</td></tr>`), 'لا يوجد'), {pad:false})}`;
};
AFTER.bookings = () => { const s = $('#cal-res'); if (s) s.onchange = (e) => { UI.calRes = e.target.value; renderAdmin(); }; };
ACT['cal-week'] = (el) => { const d = +el.dataset.d; UI.calWeek = d === 0 ? 0 : UI.calWeek + d; renderAdmin(); };
ACT['cal-slot'] = (el, e) => {
  if (e.target.closest('.bk') || !can('bookings', 'add')) return;
  const h = 8 + Math.floor((e.clientY - el.getBoundingClientRect().top) / 44); const start = new Date(`${el.dataset.date}T${pad2_(h)}:00:00`);
  if (start < new Date()) return toast('لا يمكن الحجز في وقت مضى', true);
  openBooking({resourceId:UI.calRes, start:start.toISOString(), end:new Date(+start + 36e5).toISOString(), _new:true});
};
ACT['open-booking'] = (el, e) => { e?.stopPropagation(); openBooking(S.bookings.find(b => b.id === el.dataset.id)); };
ACT['booking-export'] = () => exportDialog('حجوزات القاعات', [['العميل', 'القاعة', 'من', 'إلى', 'الساعات', 'الأشخاص', 'الحالة', 'قبل الضريبة', 'السبب'], ...S.bookings.filter(bookingVisible).map(b => [b.name, L(resById(b.resourceId).name, 'ar'), fmtDate(b.start, true), fmtDate(b.end, true), bookingHours(b), b.people, BOOKING_STATUS[b.status]?.ar, b.price, b.reason || ''])], 'bookings');
function openBooking(b) {
  if (!b) return; const isNew = !!b._new; const r = resById(b.resourceId);
  if (!isNew) return openModal({title:'تفاصيل الحجز', sub:`${chipM(BOOKING_STATUS, b.status)} · أُنشئ ${fmtDate(b.createdAt, true)} · ${b.by === 'portal' ? 'من بوابة العميل' : esc(userName(b.by))}`, body:`<dl class="kv"><dt>العميل</dt><dd>${b.companyId ? `<a href="#admin" data-act="open-company" data-id="${b.companyId}">${coN(b.companyId)}</a>` : esc(b.name)}</dd>
      <dt>القاعة</dt><dd>${esc(L(r.name, 'ar'))} · ${esc(branchName(r.branch, 'ar'))}</dd><dt>الموعد</dt><dd>${esc(dualDate(b.start.slice(0, 10), 'ar'))} · <span class="num">${fmtTime(b.start)} – ${fmtTime(b.end)}</span> (${bookingHours(b)} ساعة)</dd>
      <dt>الحضور</dt><dd>${b.people || '—'}</dd><dt>التقدير قبل الضريبة</dt><dd class="num">${sar(b.price || 0)} ر.س${b.freeUsed ? ` (بعد خصم ${b.freeUsed} ساعة مجانية)` : ''}</dd>${b.notes ? `<dt>ملاحظات</dt><dd>${esc(b.notes)}</dd>` : ''}
      ${b.status === 'pending' ? `<dt>المهلة</dt><dd><span class="chip warn">${ic('clock')}${countdown(b.holdUntil)}</span></dd>` : ''}${b.reason ? `<dt>سبب الرفض</dt><dd>${esc(b.reason)}</dd>` : ''}${b.decidedBy ? `<dt>القرار</dt><dd>${esc(userName(b.decidedBy))}</dd>` : ''}</dl>
      ${(b.alts || []).length ? `<p class="lbl" style="margin-top:12px">البدائل المقترحة للعميل</p>${b.alts.map(a => `<div class="list-item" style="padding:6px 0">${ic('calendar')}<span class="grow">${esc(L(resById(a.resourceId).name, 'ar'))} · ${fmtDate(a.start, true)}</span></div>`).join('')}` : ''}
      ${b.status === 'pending' && can('bookings', 'approve') ? `<div class="toolbar" style="margin-top:14px"><button class="btn btn-gold btn-sm" data-act="bkx-confirm" data-id="${b.id}">${ic('check')} تأكيد</button><button class="btn btn-danger btn-sm" data-act="bkx-reject" data-id="${b.id}">رفض مع بدائل</button></div>` : ''}`});
  const s = new Date(b.start);
  openModal({title:'حجز داخلي', sub:'فعالية أو عميل اتصل هاتفيًا — يتحقق النظام من التعارض', body:`<div class="form">${fld('bn-res', 'القاعة', `<select class="input" id="bn-res">${options(S.resources.filter(x => x.kind === 'room').map(x => [x.id, L(x.name, 'ar')]), b.resourceId)}</select>`)}
    <div class="row">${fld('bn-name', 'العميل أو الفعالية', inp('bn-name'))}${fld('bn-co', 'منشأة مسجلة (اختياري)', `<select class="input" id="bn-co"><option value="">—</option>${options(S.companies.filter(c => c.status === 'verified').map(c => [c.id, c.nameAr]))}</select>`)}</div>
    <div class="row">${fld('bn-date', 'التاريخ', inp('bn-date', dstr(s), 'date'))}${fld('bn-s', 'من', inp('bn-s', `${pad2_(s.getHours())}:00`, 'time', 'step="3600"'))}${fld('bn-h', 'الساعات', inp('bn-h', 1, 'number', 'min="1" max="8"'))}</div>
    <div class="notice bad hidden" id="bn-err">${ic('alert')}<div id="bn-err-t"></div></div><button class="btn btn-gold" id="bn-go" style="justify-self:start">حفظ الحجز المؤكد</button></div>`,
    onMount:(m) => m.querySelector('#bn-go').onclick = () => { const g = (i) => m.querySelector('#' + i).value.trim(); const err = (t2) => { m.querySelector('#bn-err-t').textContent = t2; m.querySelector('#bn-err').classList.remove('hidden'); };
      const co = g('bn-co'); const name = co ? companyName(companyById(co), 'ar') : g('bn-name'); if (!name) return err('أدخل اسم العميل أو الفعالية');
      const st = new Date(`${g('bn-date')}T${g('bn-s')}:00`), en = new Date(+st + (+g('bn-h') || 1) * 36e5); if (st < new Date()) return err('لا يمكن الحجز في وقت مضى');
      const c = bookingConflict(g('bn-res'), st, en, 1); if (c) return err(`يتعارض مع «${c[0].name}» من ${fmtTime(c[0].start)} إلى ${fmtTime(c[0].end)}`);
      const nb = {id:uid('bk'), resourceId:g('bn-res'), start:st.toISOString(), end:en.toISOString(), companyId:co || null, customerId:null, name, people:1, status:'confirmed', by:me().id, createdAt:new Date().toISOString(), price:r2((resById(g('bn-res')).rate.hour || 0) * (+g('bn-h') || 1)), notes:''};
      S.bookings.push(nb); audit('booking', `${name} — ${L(resById(nb.resourceId).name, 'ar')}`, null, {الموعد:fmtDate(nb.start, true), الحالة:'مؤكد'}); UI.calRes = nb.resourceId; closeModal(); rerender(); toast('حُفظ الحجز'); }});
}
ACT['bkx-confirm'] = (el) => {
  if (!guard('bookings', 'approve')) return; const b = S.bookings.find(x => x.id === el.dataset.id); if (b.status !== 'pending') return toast('لم يعد الحجز معلّقًا', true);
  b.status = 'confirmed'; b.decidedBy = me().id; b.decidedAt = new Date().toISOString(); delete b.holdUntil;
  const cu = custById(b.customerId); const r = resById(b.resourceId);
  if (cu) cu.notifs.unshift({at:b.decidedAt, text:fillTpl('booking_confirmed', {space:L(r.name, 'ar'), date:fmtDate(b.start, false, 'ar'), time:fmtTime(b.start)})});
  (S.outbox = S.outbox || []).unshift({at:b.decidedAt, to:cu?.email || b.name, subject:`تأكيد حجز ${L(r.name, 'ar')} + ملف التقويم (ICS)`, channel:'email'});
  audit('booking', `${b.name} — ${L(r.name, 'ar')}`, {الحالة:'بانتظار التأكيد'}, {الحالة:'مؤكد'}); closeModal(); rerender(); toast('أُكّد الحجز وأُرسل للعميل تأكيد مع ملف التقويم');
};
ACT['bkx-reject'] = (el) => {
  if (!guard('bookings', 'approve')) return; const b = S.bookings.find(x => x.id === el.dataset.id); const alts = alternativesFor(b, 6);
  openModal({title:'رفض الحجز', sub:`${esc(b.name)} · ${esc(L(resById(b.resourceId).name, 'ar'))} · ${fmtDate(b.start, true)}`, body:`<div class="form">${fld('rj-r', 'السبب (يظهر للعميل) *', `<select class="input" id="rj-r"><option value="">اختر</option>${options([['القاعة محجوزة لفعالية داخلية في هذا الوقت', 'فعالية داخلية'], ['القاعة في الصيانة في هذا الموعد', 'صيانة'], ['عدد الحضور أكبر من سعة القاعة', 'السعة غير كافية'], ['other', 'سبب آخر']])}</select>`)}
    ${fld('rj-o', 'تفاصيل', inp('rj-o', '', 'text', 'placeholder="اختياري — أو اكتب السبب إن اخترت «سبب آخر»"'))}
    <fieldset class="field"><legend>اقترح حتى 3 مواعيد بديلة</legend><div class="checks">${alts.map((a, i) => `<label class="check"><input type="checkbox" name="rj-alt" value="${i}" ${i < 3 ? 'checked' : ''}> ${esc(L(resById(a.resourceId).name, 'ar'))} · ${fmtDate(a.start, true)}</label>`).join('') || '<p class="muted">لا توجد بدائل متاحة قريبة</p>'}</div></fieldset>
    <button class="btn btn-danger" id="rj-go" style="justify-self:start">رفض وإبلاغ العميل</button></div>`,
    onMount:(m) => m.querySelector('#rj-go').onclick = () => {
      let r = m.querySelector('#rj-r').value; const o = m.querySelector('#rj-o').value.trim(); if (!r) return toast('سبب الرفض إلزامي', true); if (r === 'other') { if (!o) return toast('اكتب السبب', true); r = o; } else if (o) r += ' — ' + o;
      const picked = $$('[name="rj-alt"]:checked', m).map(i => alts[+i.value]); if (picked.length > 3) return toast('اختر 3 بدائل كحد أقصى', true);
      b.status = 'rejected'; b.reason = r; b.alts = picked; b.decidedBy = me().id; b.decidedAt = new Date().toISOString(); delete b.holdUntil;
      const cu = custById(b.customerId); if (cu) cu.notifs.unshift({at:b.decidedAt, text:fillTpl('booking_rejected', {space:L(resById(b.resourceId).name, 'ar'), reason:r})});
      audit('booking', `${b.name} — ${L(resById(b.resourceId).name, 'ar')}`, {الحالة:'بانتظار التأكيد'}, {الحالة:'مرفوض', السبب:r, البدائل:picked.length}); closeModal(); rerender(); toast('رُفض الحجز وأُرسلت البدائل للعميل'); }});
};

/* ================= deals: 5-step wizard ================= */
VIEWS.deals = () => {
  const f = UI.dealF || ''; const all = S.deals.filter(d => inScope({assignee:d.owner, branch:d.branch})).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const list = f ? all.filter(d => d.status === f) : all;
  return `<div class="toolbar">${['', ...Object.keys(DEAL_STATUS)].map(k => `<button class="chip ${f === k ? '' : 'plain'}" style="border:0;cursor:pointer" data-act="deal-f" data-f="${k}">${k ? DEAL_STATUS[k].ar : 'الكل'} <b class="num">${k ? all.filter(d => d.status === k).length : all.length}</b></button>`).join('')}</div>
  ${panel('الصفقات وعروض الأسعار', table(['الصفقة', 'المنشأة', 'المساحة', 'المدة', 'الخصم', 'القيمة قبل الضريبة', 'المسؤول', 'الحالة'], list.map(d => { const c = dealCalc(d);
    return `<tr class="click" data-act="open-deal" data-id="${d.id}"><td class="ltr" style="text-align:start"><b>${d.id}</b><span class="sub">v${Math.max(1, d.versions.length)} · ${fmtDate(d.createdAt)}</span></td><td>${coN(d.companyId)}</td><td>${esc(L(resById(d.resourceId)?.name, 'ar'))}${d.qty > 1 ? ' ×' + d.qty : ''}</td><td>${d.months} أشهر<span class="sub">من ${fmtDate(d.start)}</span></td>
      <td class="num ${(d.discountPct || 0) > S.rules.deals.maxDiscountNoJust ? 'gold' : ''}">${d.discountPct || 0}%</td><td class="num">${money(c.net)}</td><td>${whoTag(d.owner)}</td><td>${chipM(DEAL_STATUS, d.status)}${c.flags.some(x => x.bad) && ['draft', 'returned'].includes(d.status) ? ' <span class="chip bad">يحتاج تعديل</span>' : ''}</td></tr>`; }), 'لا توجد صفقات'),
    {pad:false, sub:'يُجمَّد العرض عند الإرسال للاعتماد، وأي تعديل بعد الإعادة يصبح نسخة جديدة مع مقارنة الفروقات', actions:can('deals', 'add') ? `<button class="btn btn-gold btn-sm" data-act="deal-new">${ic('plus')} صفقة جديدة</button>` : ''})}`;
};
ACT['deal-f'] = (el) => { UI.dealF = el.dataset.f; renderAdmin(); };
ACT['deal-new'] = (el) => {
  if (!guard('deals', 'add')) return; const lead = el?.dataset?.lead ? S.clients.find(c => c.id === el.dataset.lead) : null;
  const d = {id:null, companyId:lead?.companyId || '', branch:me().branch || 'main', owner:me().id, status:'draft', createdAt:new Date().toISOString(), contractId:null, versions:[], leadId:lead?.id || null,
    resourceId:'', start:addDays(today(), 7), months:6, qty:1, listMonthly:0, discountPct:0, billing:'monthly', deposit:0, freeHours:0, justification:'', terms:''};
  UI.wiz = {d, step:1, isNew:true}; openWizard();
};
ACT['open-deal'] = (el) => openDeal(S.deals.find(d => d.id === el.dataset.id));
const WIZ_STEPS = ['العميل', 'المساحة والتواريخ', 'الشروط', 'التسعير', 'المراجعة'];
function openWizard() {
  const W = UI.wiz, d = W.d; const r = resById(d.resourceId); const c = dealCalc(d); const prev = d.versions.at(-1)?.data;
  const spaces = S.resources.filter(x => x.kind !== 'room' && x.branch === d.branch);
  let body = '';
  if (W.step === 1) body = `${fld('wz-co', 'المنشأة', `<select class="input" id="wz-co"><option value="">اختر منشأة موثّقة</option>${S.companies.map(co => `<option value="${co.id}" ${co.id === d.companyId ? 'selected' : ''} ${co.status !== 'verified' ? 'disabled' : ''}>${esc(co.nameAr)} — ${co.cr}${co.status !== 'verified' ? ` (${COMPANY_STATUS[co.status].ar})` : ''}</option>`).join('')}</select>`, 'لا تُفتح صفقات إلا لمنشأة موثّقة وغير معلّقة')}
    ${d.leadId ? `<div class="notice">${ic('users')}<div>من العميل المحتمل: <b>${esc(S.clients.find(x => x.id === d.leadId)?.name || '')}</b>${S.clients.find(x => x.id === d.leadId)?.companyId ? '' : ' — سجّل منشأته أولًا من الموقع أو اطلب منه التسجيل ثم اخترها هنا.'}</div></div>` : ''}
    ${fld('wz-br', 'الفرع', `<select class="input" id="wz-br">${options(S.branches.filter(b => branchVisible(b.id)).map(b => [b.id, b.name]), d.branch)}</select>`)}`;
  else if (W.step === 2) body = `${fld('wz-res', 'المساحة', `<select class="input" id="wz-res"><option value="">اختر</option>${spaces.map(x => `<option value="${x.id}" ${x.id === d.resourceId ? 'selected' : ''} ${x.maintenance ? 'disabled' : ''}>${esc(L(x.name, 'ar'))} — ${esc(SPACE_KINDS[x.kind].ar)} · ${money(x.rate.month)} ر.س${x.maintenance ? ' (صيانة)' : ''}</option>`).join('')}</select>`)}
    <div class="row">${fld('wz-start', 'تاريخ البدء', inp('wz-start', d.start, 'date', `min="${today()}"`))}${fld('wz-months', 'المدة (أشهر)', `<select class="input" id="wz-months">${options([1, 2, 3, 4, 6, 9, 12, 18, 24].map(m => [m, m + (durDisc(m) ? ` — خصم مدة مقترح ${durDisc(m)}%` : '')]), d.months)}</select>`)}</div>
    ${r && (r.kind === 'desk' || r.kind === 'shared') ? fld('wz-qty', 'العدد (مقاعد / مكاتب)', inp('wz-qty', d.qty || 1, 'number', `min="1" max="${r.cap}"`)) : ''}
    ${c.flags.filter(f => ['clash', 'maint'].includes(f.k)).map(f => `<div class="notice bad">${ic('ban')}<div>${esc(f.text)}</div></div>`).join('')}
    ${d.resourceId ? `<p class="muted">ينتهي العقد في ${esc(dualDate(c.end, 'ar'))}</p>` : ''}`;
  else if (W.step === 3) body = `<div class="row">${fld('wz-bill', 'دورة الفوترة', `<select class="input" id="wz-bill">${options([['monthly', 'شهرية مقدمًا'], ['quarterly', 'ربع سنوية مقدمًا']], d.billing)}</select>`)}${fld('wz-dep', 'التأمين (ر.س)', inp('wz-dep', d.deposit || r?.rate.month || 0, 'number', 'min="0"'))}</div>
    ${fld('wz-fh', 'ساعات القاعات المجانية شهريًا', inp('wz-fh', d.freeHours || S.rules.freeHours[r?.kind] || 0, 'number', 'min="0"'), `الافتراضي لهذا النوع: ${S.rules.freeHours[r?.kind] || 0} ساعات`)}
    ${fld('wz-terms', 'شروط إضافية', `<textarea class="input" id="wz-terms" placeholder="مثال: إمكانية الانتقال لمكتب أكبر بعد 3 أشهر بنفس سعر المتر">${esc(d.terms)}</textarea>`)}`;
  else if (W.step === 4) body = `<div class="row">${fld('wz-list', 'السعر الشهري للقائمة (ر.س)', inp('wz-list', d.listMonthly || r?.rate.month || 0, 'number', 'min="0" readonly'), `الحد الأدنى المسموح: ${money(r?.minMonth || 0)} ر.س شهريًا`)}${fld('wz-disc', 'الخصم %', inp('wz-disc', d.discountPct, 'number', 'min="0" max="50" step="0.5"'), `خصم المدة المقترح: ${durDisc(d.months)}% · أكثر من ${S.rules.deals.maxDiscountNoJust}% يحتاج تبريرًا ويُميَّز للإدارة`)}</div>
    ${fld('wz-just', 'تبرير الخصم' + ((d.discountPct || 0) > S.rules.deals.maxDiscountNoJust ? ' *' : ''), `<textarea class="input" id="wz-just" placeholder="لماذا هذا الخصم؟">${esc(d.justification)}</textarea>`)}
    <div class="est" id="wz-calc">${dealCalcHTML(d)}</div>`;
  else body = `${dealSummaryHTML(d)}${prev ? `<div class="panel"><div class="panel-head"><h2>الفروقات عن النسخة ${d.versions.length}</h2></div>${diffTable(dealDiff(prev, dealSnapshot(d)))}</div>` : ''}
    ${c.blocked ? `<div class="notice bad">${ic('ban')}<div>لا يمكن الإرسال: ${c.flags.filter(f => f.bad).map(f => esc(f.text)).join(' · ')}</div></div>` : `<div class="notice">${ic('info')}<div>عند الإرسال تُجمَّد هذه النسخة (v${d.versions.length + 1}) وتصل للإدارة للاعتماد.</div></div>`}
    <div class="toolbar"><button class="btn btn-ghost btn-sm" data-act="deal-preview">${ic('doc')} معاينة عرض السعر PDF</button></div>`;
  openModal({size:'wide', title:d.id ? `تعديل الصفقة <span class="ltr">${d.id}</span>` : 'صفقة جديدة', sub:d.versions.length ? `النسخة القادمة v${d.versions.length + 1}` : 'عرض سعر لمنشأة موثّقة', body:`<ol class="steps sm">${WIZ_STEPS.map((l, i) => `<li class="${i + 1 < W.step ? 'done' : i + 1 === W.step ? 'on' : ''}"><i>${i + 1 < W.step ? ic('check') : i + 1}</i><span>${l}</span></li>`).join('')}</ol>
    <div class="form" id="wz" data-viewsafe>${body}<div class="toolbar" style="justify-content:space-between;margin-top:6px"><span>${W.step > 1 ? `<button class="btn btn-ghost" data-act="wz-go" data-d="-1">${ic('back')} السابق</button>` : ''}</span>
      <span class="toolbar">${W.step < 5 ? `<button class="btn btn-ghost btn-sm" data-act="deal-save">حفظ كمسودة</button><button class="btn btn-gold" data-act="wz-go" data-d="1">التالي ${ic('arrow')}</button>` : `<button class="btn btn-ghost btn-sm" data-act="deal-save">حفظ كمسودة</button><button class="btn btn-gold" data-act="deal-submit" ${c.blocked ? 'disabled' : ''}>${ic('stamp')} إرسال للاعتماد</button>`}</span></div></div>`,
    onMount:(m) => {
      const disc = m.querySelector('#wz-disc'); if (disc) disc.oninput = () => { d.discountPct = +disc.value || 0; d.justification = m.querySelector('#wz-just').value; m.querySelector('#wz-calc').innerHTML = dealCalcHTML(d); };
      const res = m.querySelector('#wz-res'); if (res) res.onchange = () => { wizRead(); d.listMonthly = resById(d.resourceId)?.rate.month || 0; d.deposit = d.listMonthly; d.freeHours = S.rules.freeHours[resById(d.resourceId)?.kind] || 0; if (!d.versions.length && !d.discountPct) d.discountPct = durDisc(d.months); openWizard(); };
      const br = m.querySelector('#wz-br'); if (br) br.onchange = () => { d.branch = br.value; d.resourceId = ''; };
      const mo = m.querySelector('#wz-months'); if (mo) mo.onchange = () => { wizRead(); if (!d.versions.length) d.discountPct = Math.max(d.discountPct || 0, durDisc(d.months)); openWizard(); };
    }});
}
function wizRead() {
  const d = UI.wiz.d; const v = (id) => $('#' + id)?.value; const n = (id) => +v(id);
  if ($('#wz-co')) { d.companyId = v('wz-co'); d.branch = v('wz-br'); }
  if ($('#wz-res')) { d.resourceId = v('wz-res'); d.start = v('wz-start'); d.months = n('wz-months'); if ($('#wz-qty')) d.qty = Math.max(1, n('wz-qty')); else d.qty = 1; if (!d.listMonthly && d.resourceId) d.listMonthly = resById(d.resourceId).rate.month || 0; }
  if ($('#wz-bill')) { d.billing = v('wz-bill'); d.deposit = n('wz-dep'); d.freeHours = n('wz-fh'); d.terms = v('wz-terms').trim(); }
  if ($('#wz-disc')) { d.discountPct = n('wz-disc') || 0; d.justification = v('wz-just').trim(); }
}
ACT['wz-go'] = (el) => {
  wizRead(); const W = UI.wiz, d = W.d; const dir = +el.dataset.d;
  if (dir > 0) {
    if (W.step === 1 && !d.companyId) return toast('اختر منشأة موثّقة', true);
    if (W.step === 2) { if (!d.resourceId) return toast('اختر المساحة', true); if (!d.start || d.start < today()) return toast('تاريخ البدء غير صحيح', true); const c = dealCalc(d); const b = c.flags.find(f => ['clash', 'maint'].includes(f.k)); if (b) return toast(b.text, true); }
    if (W.step === 4) { const c = dealCalc(d); if ((d.discountPct || 0) > S.rules.deals.maxDiscountNoJust && !d.justification) return toast('الخصم أعلى من ' + S.rules.deals.maxDiscountNoJust + '% — اكتب التبرير', true); const mn = c.flags.find(f => f.k === 'min'); if (mn) return toast(mn.text, true); }
  }
  W.step = Math.min(5, Math.max(1, W.step + dir)); openWizard();
};
function dealCalcHTML(d) {
  const c = dealCalc(d);
  return `<div><span>الإجمالي قبل الخصم</span><b class="num">${sar(c.sub)}</b></div><div><span>الخصم (${d.discountPct || 0}%)</span><b class="num">−${sar(c.disc)}</b></div><div><span>الشهري بعد الخصم</span><b class="num">${sar(c.monthlyNet)}</b></div>
    <div><span>قبل الضريبة</span><b class="num">${sar(c.net)}</b></div><div><span>ضريبة 15%</span><b class="num">${sar(c.vat)}</b></div><div class="tot"><span>الإجمالي</span><b class="num">${sar(c.total)} ر.س</b></div>
    ${c.flags.map(f => `<p class="flag ${f.bad ? 'bad' : f.k === 'second' ? 'info' : 'warn'}">${ic(f.bad ? 'ban' : 'alert')}${esc(f.text)}</p>`).join('')}`;
}
function dealSummaryHTML(d) {
  const r = resById(d.resourceId) || {rate:{}, name:''}; const c = dealCalc(d);
  return `<dl class="kv cols2"><dt>المنشأة</dt><dd>${coN(d.companyId)}</dd><dt>المساحة</dt><dd>${esc(L(r.name, 'ar'))}${d.qty > 1 ? ' ×' + d.qty : ''}</dd><dt>المدة</dt><dd>${d.months} أشهر — ${fmtDate(d.start)} ← ${fmtDate(c.end)}</dd><dt>الفوترة</dt><dd>${d.billing === 'quarterly' ? 'ربع سنوية' : 'شهرية'}</dd>
    <dt>السعر الشهري</dt><dd class="num">${sar(d.listMonthly)} ← ${sar(c.monthlyNet)}</dd><dt>الخصم</dt><dd class="num">${d.discountPct || 0}%</dd><dt>التأمين</dt><dd class="num">${sar(d.deposit)}</dd><dt>ساعات القاعات</dt><dd>${d.freeHours} شهريًا</dd>
    ${d.justification ? `<dt>التبرير</dt><dd>${esc(d.justification)}</dd>` : ''}${d.terms ? `<dt>شروط إضافية</dt><dd>${esc(d.terms)}</dd>` : ''}</dl><div class="est">${dealCalcHTML(d)}</div>`;
}
const diffTable = (rows) => rows.length ? table(['البند', 'قبل', 'بعد'], rows.map(x => `<tr><td>${esc(x.label)}</td><td><s class="muted">${esc(x.from)}</s></td><td><b class="gold">${esc(x.to)}</b></td></tr>`)) : '<div class="panel-body"><p class="muted">لا فروقات</p></div>';
function quoteDocHTML(d) {
  const co = companyById(d.companyId); const r = resById(d.resourceId); const c = dealCalc(d);
  return `<div class="doc" dir="rtl">${d.status !== 'approved' ? '<div class="doc-wm">عرض سعر — مسودة</div>' : ''}${docHead('عرض سعر', 'Quotation', d.id || 'جديد')}
    <div class="doc-grid"><div class="doc-box"><h4>${bi('إلى', 'To')}</h4><b>${esc(co?.nameAr || '')}</b><span>${esc(co?.nameEn || '')}</span><span class="ltr">CR ${esc(co?.cr || '')}</span></div>
      <div class="doc-box"><h4>${bi('صلاحية العرض', 'Valid until')}</h4><b>${esc(dualDate(addDays(today(), 14), 'ar'))}</b><span>${esc(userName(d.owner))} — ${esc(userById(d.owner)?.email || '')}</span></div></div>
    <table class="doc-tbl"><thead><tr><th>${bi('البند', 'Item')}</th><th>${bi('المدة', 'Term')}</th><th>${bi('السعر الشهري', 'Monthly')}</th><th>${bi('الخصم', 'Discount')}</th><th>${bi('قبل الضريبة', 'Net')}</th></tr></thead>
      <tbody><tr><td>${esc(L(r?.name, 'ar'))}${d.qty > 1 ? ' ×' + d.qty : ''}<span class="sub ltr">${esc(L(r?.name, 'en'))}</span></td><td>${d.months} أشهر من ${esc(fmtDate(d.start, false, 'ar'))}</td><td class="num">${sar(d.listMonthly)}</td><td class="num">${d.discountPct || 0}%</td><td class="num">${sar(c.net)}</td></tr></tbody></table>
    <div class="doc-foot"><div></div><dl class="doc-sum"><dt>${bi('قبل الضريبة', 'Net')}</dt><dd class="num">${sar(c.net)}</dd><dt>${bi('الضريبة 15%', 'VAT 15%')}</dt><dd class="num">${sar(c.vat)}</dd><dt class="tot">${bi('الإجمالي', 'Total')}</dt><dd class="num tot">${sar(c.total)} ر.س</dd></dl></div>
    <ol class="doc-terms"><li>الفوترة ${d.billing === 'quarterly' ? 'ربع سنوية' : 'شهرية'} مقدمًا، وتأمين ${sar(d.deposit)} ر.س.</li><li>يشمل ${d.freeHours} ساعات قاعات اجتماعات مجانية شهريًا.</li>${d.terms ? `<li>${esc(d.terms)}</li>` : ''}<li>العرض خاضع لاعتماد الإدارة وتوقيع العقد.</li></ol></div>`;
}
ACT['deal-preview'] = () => { wizRead(); const d = UI.wiz.d; const keep = UI.wiz; openModal({size:'xl', title:'معاينة عرض السعر', body:`<div class="toolbar no-print" style="margin-bottom:14px"><button class="btn btn-ghost btn-sm" data-act="wz-back">${ic('back')} رجوع للصفقة</button><button class="btn btn-ghost btn-sm" data-act="print-doc">${ic('print')} طباعة / PDF</button></div>${quoteDocHTML(d)}`}); UI.wiz = keep; };
ACT['wz-back'] = () => openWizard();
function dealPersist(d) {
  if (!d.id) { d.id = nextNo('DL'); S.deals.unshift(d); audit('deal', d.id, null, {المنشأة:companyName(companyById(d.companyId), 'ar'), الحالة:'مسودة'}); }
  if (d.leadId) { const l = S.clients.find(c => c.id === d.leadId); if (l && !['won', 'lost'].includes(l.status)) { l.status = 'deal'; l.lastContactAt = l.lastContactAt || new Date().toISOString(); } }
}
ACT['deal-save'] = () => { wizRead(); const d = UI.wiz.d; if (!d.companyId) return toast('اختر المنشأة أولًا', true); if (d.status === 'pending') return toast('الصفقة مجمّدة بانتظار الاعتماد', true); dealPersist(d); closeModal(); rerender(); toast('حُفظت المسودة'); };
ACT['deal-submit'] = () => {
  wizRead(); const d = UI.wiz.d; const c = dealCalc(d); if (c.blocked) return toast(c.flags.find(f => f.bad).text, true);
  if (companyById(d.companyId).status !== 'verified') return toast('المنشأة غير موثّقة أو معلّقة', true);
  dealPersist(d); const prev = d.versions.at(-1)?.data; const v = d.versions.length + 1;
  d.versions.push({v, at:new Date().toISOString(), by:me().id, data:dealSnapshot(d), decision:null}); d.status = 'pending'; delete d.firstApproval;
  S.users.filter(u => u.status === 'active' && (u.roleId === 'ops' || u.roleId === 'owner') && u.id !== me().id).forEach(u => notify(u.id, 'صفقة بانتظار اعتمادك', `${d.id} — ${companyName(companyById(d.companyId), 'ar')} (النسخة ${v})`, 'approvals'));
  audit('deal', d.id, prev ? {النسخة:'v' + (v - 1)} : {الحالة:'مسودة'}, {النسخة:'v' + v, الحالة:'بانتظار الاعتماد', الفروقات:prev ? dealDiff(prev, dealSnapshot(d)).map(x => x.label).join('، ') || '—' : '—'});
  closeModal(); rerender(); toast(`أُرسلت النسخة v${v} للاعتماد وجُمّدت`);
};
function openDeal(d) {
  if (!d) return; const c = dealCalc(d); const canEdit = can('deals', 'edit') && ['draft', 'returned'].includes(d.status) && (d.owner === me().id || isOwner() || scopeOf() === 'all');
  openModal({size:'xl', title:`الصفقة <span class="ltr">${d.id}</span> — ${coN(d.companyId)}`, sub:`${chipM(DEAL_STATUS, d.status)} · ${esc(userName(d.owner))} · v${Math.max(1, d.versions.length)}${d.firstApproval ? ' · <span class="chip info">اعتماد أول — بانتظار المالك</span>' : ''}`, body:`<div class="detail"><div style="display:grid;gap:14px;align-content:start">${dealSummaryHTML(d)}
      <div class="toolbar">${canEdit ? `<button class="btn btn-gold btn-sm" data-act="deal-edit" data-id="${d.id}">${ic('edit')} ${d.status === 'returned' ? 'تعديل وإنشاء نسخة جديدة' : 'متابعة التعديل'}</button>` : ''}${can('deals', 'print') ? `<button class="btn btn-ghost btn-sm" data-act="deal-pdf" data-id="${d.id}">${ic('doc')} عرض السعر PDF</button>` : ''}
        ${d.status === 'pending' && can('deals', 'approve') ? `<button class="btn btn-gold btn-sm" data-act="open-approval" data-id="${d.id}">${ic('stamp')} مراجعة للاعتماد</button>` : ''}${d.contractId ? `<button class="btn btn-ghost btn-sm" data-act="open-contract" data-id="${d.contractId}">${ic('contract')} العقد ${d.contractId}</button>` : ''}</div>
      ${d.status === 'pending' ? `<div class="notice">${ic('lock')}<div>النسخة مجمّدة بانتظار الاعتماد ولا يمكن تعديلها.</div></div>` : ''}</div>
    <div class="panel"><div class="panel-head"><h2>النسخ والقرارات</h2></div><div class="panel-body"><div class="timeline">${d.versions.slice().reverse().map((v, i, arr) => { const prev = arr[i + 1]?.data;
      return `<div class="tl"><i class="${v.decision === 'approved' ? '' : 'note'}"></i><div><p><b>النسخة ${v.v}</b> — ${esc(userName(v.by))} · ${fmtDate(v.at, true)}</p>${prev && Object.keys(prev).length && Object.keys(v.data || {}).length ? `<p class="muted" style="font-size:13px">تغيّر: ${dealDiff(prev, v.data).map(x => `${esc(x.label)} (${esc(x.from)} ← ${esc(x.to)})`).join('، ') || '—'}</p>` : ''}
        ${v.decision ? `<p>${chipM({approved:{ar:'اعتُمدت', cls:'ok'}, returned:{ar:'أُعيدت', cls:'info'}, rejected:{ar:'رُفضت', cls:'bad'}}, v.decision)} ${esc(userName(v.decidedBy))} · ${fmtDate(v.decidedAt, true)}</p>${v.comment ? `<p class="note-box">${esc(v.comment)}</p>` : ''}` : '<p class="muted">بانتظار القرار</p>'}</div></div>`; }).join('') || '<p class="muted">لم تُرسل للاعتماد بعد</p>'}</div></div></div></div>`});
}
ACT['deal-edit'] = (el) => { const d = S.deals.find(x => x.id === el.dataset.id); UI.wiz = {d, step:d.status === 'returned' ? 4 : 1}; openWizard(); };
ACT['deal-pdf'] = (el) => { const d = S.deals.find(x => x.id === el.dataset.id); openModal({size:'xl', title:'عرض السعر', body:`<div class="toolbar no-print" style="margin-bottom:14px"><button class="btn btn-ghost btn-sm" data-act="print-doc">${ic('print')} طباعة / PDF</button></div>${quoteDocHTML(d)}`}); };

/* ================= approvals (management) ================= */
VIEWS.approvals = () => {
  const deals = S.deals.filter(d => d.status === 'pending').sort((a, b) => a.start.localeCompare(b.start));
  const changes = S.companies.filter(c => c.pendingChange);
  const decided = S.deals.filter(d => ['approved', 'rejected', 'returned'].includes(d.status)).sort((a, b) => (b.versions.at(-1)?.decidedAt || '').localeCompare(a.versions.at(-1)?.decidedAt || '')).slice(0, 6);
  return `${panel('صفقات بانتظار الاعتماد', table(['الصفقة', 'المنشأة', 'تبدأ', 'القيمة', 'الخصم', 'تنبيهات', ''], deals.map(d => { const c = dealCalc(d); const soon = daysBetween(today(), d.start) <= 7;
      return `<tr><td class="ltr" style="text-align:start"><b>${d.id}</b><span class="sub">v${d.versions.length} · ${esc(userName(d.owner))}</span></td><td>${coN(d.companyId)}</td><td>${fmtDate(d.start)}${soon ? ' <span class="chip warn">قريب</span>' : ''}</td><td class="num">${money(c.net)}</td>
        <td class="num ${(d.discountPct || 0) > S.rules.deals.maxDiscountNoJust ? 'gold' : ''}">${d.discountPct}%</td><td>${c.flags.map(f => `<span class="chip ${f.bad ? 'bad' : f.k === 'second' ? 'info' : 'warn'}" title="${esc(f.text)}">${{discount:'خصم مرتفع', min:'تحت الحد الأدنى', clash:'تعارض', maint:'صيانة', second:'اعتماد ثانٍ'}[f.k]}</span>`).join(' ') || '—'}${d.firstApproval ? ' <span class="chip info">اعتماد أول ✓</span>' : ''}</td>
        <td><button class="btn btn-gold btn-xs" data-act="open-approval" data-id="${d.id}">مراجعة</button></td></tr>`; }), 'لا توجد صفقات بانتظار الاعتماد'), {pad:false, sub:'مرتبة حسب تاريخ البدء — لا يعتمد الموظف صفقة أنشأها'})}
  ${panel('تعديلات بيانات المنشآت', table(['المنشأة', 'البيان', 'من', 'إلى', ''], changes.map(c => `<tr><td>${esc(c.nameAr)}</td><td>${esc(c.pendingChange.label)}</td><td><s class="muted">${esc(c.pendingChange.from)}</s></td><td><b>${esc(c.pendingChange.to)}</b></td><td><div class="toolbar" style="flex-wrap:nowrap"><button class="btn btn-gold btn-xs" data-act="co-change" data-id="${c.id}" data-d="ok">اعتماد</button><button class="btn btn-danger btn-xs" data-act="co-change" data-id="${c.id}" data-d="no">رفض</button></div></td></tr>`), 'لا توجد'), {pad:false, sub:'الاسم القانوني والرقم الضريبي يظهران في العقود والفواتير الضريبية'})}
  ${panel('آخر القرارات', table(['الصفقة', 'المنشأة', 'القرار', 'بواسطة', 'التعليق'], decided.map(d => { const v = d.versions.at(-1); return `<tr class="click" data-act="open-deal" data-id="${d.id}"><td class="ltr" style="text-align:start">${d.id}</td><td>${coN(d.companyId)}</td><td>${chipM(DEAL_STATUS, d.status)}</td><td>${esc(userName(v?.decidedBy))}</td><td>${esc(v?.comment || '—')}</td></tr>`; }), 'لا يوجد'), {pad:false})}`;
};
ACT['open-approval'] = (el) => {
  const d = S.deals.find(x => x.id === el.dataset.id); if (!guard('deals', 'approve')) return; const c = dealCalc(d); const cur = d.versions.at(-1); const prev = d.versions.at(-2);
  const self = d.owner === me().id || cur?.by === me().id; const needOwner = c.net > S.rules.deals.secondApprovalAbove && !isOwner();
  openModal({size:'xl', title:`اعتماد الصفقة <span class="ltr">${d.id}</span>`, sub:`${coN(d.companyId)} · النسخة ${cur.v} من ${esc(userName(d.owner))} · ${fmtDate(cur.at, true)}`, body:`<div class="detail"><div style="display:grid;gap:14px;align-content:start">${dealSummaryHTML(d)}
      ${prev ? `<div class="panel"><div class="panel-head"><h2>ما تغيّر عن النسخة ${prev.v}</h2><span class="chip info">${esc(prev.comment ? 'تعليقكم السابق: ' + prev.comment : '')}</span></div>${diffTable(dealDiff(prev.data, cur.data))}</div>` : ''}
      <button class="btn btn-ghost btn-sm" data-act="deal-pdf" data-id="${d.id}" style="justify-self:start">${ic('doc')} عرض السعر PDF</button></div>
    <div class="panel"><div class="panel-head"><h2>القرار</h2></div><div class="panel-body form">
      ${self ? `<div class="notice bad">${ic('ban')}<div>لا يمكنك اعتماد صفقة أنشأتها أو أرسلتها بنفسك — يعتمدها مدير آخر.</div></div>` : ''}
      ${needOwner ? `<div class="notice">${ic('info')}<div>القيمة فوق ${money(S.rules.deals.secondApprovalAbove)} ر.س: ${d.firstApproval ? 'سُجّل الاعتماد الأول، ويلزم اعتماد المالك.' : 'اعتمادك يُسجَّل كاعتماد أول ثم تُحال للمالك.'}</div></div>` : ''}
      ${fld('ap-c', 'التعليق (إلزامي عند الإعادة أو الرفض)', `<textarea class="input" id="ap-c" placeholder="مثال: الخصم مقبول بشرط الدفع ربع السنوي مقدمًا"></textarea>`)}
      <div class="toolbar"><button class="btn btn-gold" data-act="deal-decide" data-id="${d.id}" data-d="approved" ${self || (needOwner && d.firstApproval) ? 'disabled' : ''}>${ic('check')} ${needOwner ? 'اعتماد أول وإحالة للمالك' : 'اعتماد وإنشاء العقد'}</button>
        <button class="btn btn-ghost" data-act="deal-decide" data-id="${d.id}" data-d="returned" ${self ? 'disabled' : ''}>${ic('refresh')} إعادة للتعديل</button><button class="btn btn-danger" data-act="deal-decide" data-id="${d.id}" data-d="rejected" ${self ? 'disabled' : ''}>رفض</button></div>
      <p class="muted" style="font-size:13px">عند الاعتماد: يُنشأ عقد بانتظار التوقيع، وتُحجز المساحة، ويُجهَّز جدول الفواتير، ويُبلَّغ موظف المبيعات والمحاسبة.</p></div></div></div>`});
};
ACT['deal-decide'] = (el) => {
  const d = S.deals.find(x => x.id === el.dataset.id); if (!guard('deals', 'approve')) return; const dec = el.dataset.d; const comment = ($('#ap-c')?.value || '').trim(); const cur = d.versions.at(-1);
  if (d.owner === me().id || cur.by === me().id) return toast('لا يمكنك اعتماد صفقتك', true);
  if (dec !== 'approved' && !comment) return toast('اكتب التعليق — إلزامي عند الإعادة أو الرفض', true);
  const c = dealCalc(d);
  if (dec === 'approved' && c.blocked) return toast(c.flags.find(f => f.bad).text, true);
  if (dec === 'approved' && c.net > S.rules.deals.secondApprovalAbove && !isOwner()) {
    d.firstApproval = {by:me().id, at:new Date().toISOString(), comment}; S.users.filter(u => u.roleId === 'owner').forEach(u => notify(u.id, 'صفقة تحتاج اعتمادك الثاني', `${d.id} — ${money(c.net)} ر.س`, 'approvals'));
    audit('approve', d.id, null, {القرار:'اعتماد أول', التعليق:comment || '—'}); closeModal(); rerender(); return toast('سُجّل الاعتماد الأول وأُحيلت للمالك');
  }
  Object.assign(cur, {decision:dec, decidedBy:me().id, decidedAt:new Date().toISOString(), comment}); d.status = dec;
  const owner = d.owner; let msg = '';
  if (dec === 'approved') {
    d.approvedAt = cur.decidedAt; const k = createContractFromDeal(d, me().id);
    const lead = S.clients.find(l => l.companyId === d.companyId && !['lost'].includes(l.status)); if (lead) { lead.status = 'won'; lead.log.unshift({at:cur.decidedAt, by:me().id, kind:'status', text:`تعاقد — ${k.id}`}); }
    notify(owner, 'اعتُمدت صفقتك', `${d.id} ← العقد ${k.id} بانتظار التوقيع`, 'contracts');
    S.users.filter(u => u.status === 'active' && u.roleId === 'accountant').forEach(u => notify(u.id, 'عقد جديد — جدول فواتير', `${k.id} — ${companyName(companyById(d.companyId), 'ar')} · ${contractSchedule(k).length} دفعات`, 'contracts'));
    S.customers.filter(x => x.companyId === d.companyId && ['admin', 'finance'].includes(x.companyRole)).forEach(x => x.notifs.unshift({at:cur.decidedAt, text:`أُعد عقدكم ${k.id} وهو بانتظار التوقيع.`}));
    msg = `اعتُمدت وأُنشئ العقد ${k.id} بانتظار التوقيع`;
  } else { notify(owner, dec === 'returned' ? 'أُعيدت صفقتك للتعديل' : 'رُفضت صفقتك', `${d.id}: ${comment}`, 'deals'); msg = dec === 'returned' ? 'أُعيدت للموظف مع التعليق' : 'رُفضت الصفقة'; }
  audit('approve', d.id, {الحالة:'بانتظار الاعتماد'}, {القرار:DEAL_STATUS[dec].ar, التعليق:comment || '—'}); closeModal(); rerender(); toast(msg);
};
