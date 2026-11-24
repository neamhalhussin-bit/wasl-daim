/* وصل دائم — dashboard (part 3): companies & verification, contracts, accounting (invoices, receipts, aging, VAT), spaces & prices, business rules, staff invitations, reports */
'use strict';

const finOK = () => can('billing', 'finance') || can('contracts', 'finance') || can('dashboard', 'finance');

/* ================= companies ================= */
UI.coQ = ''; UI.coSt = ''; UI.coTab = 'overview';
VIEWS.companies = () => {
  const q = UI.coQ.trim().toLowerCase(); const all = S.companies.filter(c => inScope({assignee:c.salesOwner, branch:c.branch}));
  const list = all.filter(c => (!UI.coSt || c.status === UI.coSt) && (!q || [c.nameAr, c.nameEn, c.cr, c.vat].join(' ').toLowerCase().includes(q)));
  const fin = finOK();
  return `<div class="tiles">${Object.entries(COMPANY_STATUS).map(([k, v]) => tile(v.ar, all.filter(c => c.status === k).length, {icon:{pending:'clock', verified:'check', suspended:'ban', rejected:'close'}[k]})).join('')}</div>
  ${panel('المنشآت', `<div class="panel-body" style="padding-bottom:0"><div class="toolbar"><input class="input search" id="co-q" placeholder="بحث بالاسم عربي أو إنجليزي أو السجل أو الرقم الضريبي" value="${esc(UI.coQ)}" aria-label="بحث">
      <select class="input" id="co-st" aria-label="الحالة"><option value="">كل الحالات</option>${options(Object.entries(COMPANY_STATUS).map(([k, v]) => [k, v.ar]), UI.coSt)}</select></div></div>
    <div style="padding-top:14px">${table(['المنشأة', 'السجل', 'الحالة', 'المستندات', 'العقود السارية', 'الرصيد', 'مسؤول المبيعات'], list.map(c => { const req = c.docs.filter(d => DOC_TYPES[d.type].req); const ok = req.filter(d => d.status === 'approved').length; const rev = c.docs.filter(d => d.status === 'review').length;
      return `<tr class="click" data-act="open-company" data-id="${c.id}" tabindex="0"><td><b>${esc(c.nameAr)}</b><span class="sub ltr" style="text-align:start">${esc(c.nameEn)}</span></td><td class="ltr num" style="text-align:start">${esc(c.cr)}</td><td>${chipM(COMPANY_STATUS, c.status)}${c.pendingChange ? ' <span class="chip info">تعديل معلّق</span>' : ''}</td>
        <td><span class="num">${ok}/${req.length}</span>${rev ? ` <span class="chip warn">${rev} للمراجعة</span>` : ''}${c.docs.some(d => d.expiry && daysBetween(today(), d.expiry) <= 30) ? ' <span class="chip bad">ينتهي قريبًا</span>' : ''}</td>
        <td class="num">${S.contracts.filter(k => k.companyId === c.id && ['active', 'expiring'].includes(contractStatus(k))).length}</td><td class="num ${companyBalance(c.id) ? 'gold' : ''}">${fin ? sar(companyBalance(c.id)) : '•••'}</td><td>${whoTag(c.salesOwner)}</td></tr>`; }), 'لا توجد منشآت مطابقة')}</div>`,
    {pad:false, sub:`${list.length} منشأة`, actions:`<button class="btn btn-ghost btn-sm" data-act="co-export" ${can('companies', 'export') ? '' : 'disabled title="يتطلب صلاحية التصدير"'}>${ic('download')} تصدير Excel</button>`})}`;
};
AFTER.companies = () => { let tm; const q = $('#co-q'); if (!q) return; q.oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => { UI.coQ = e.target.value; renderAdmin(); const x = $('#co-q'); x.focus(); x.setSelectionRange(x.value.length, x.value.length); }, 250); }; $('#co-st').onchange = (e) => { UI.coSt = e.target.value; renderAdmin(); }; };
ACT['co-export'] = () => exportDialog('المنشآت', [['الاسم العربي', 'الاسم الإنجليزي', 'السجل التجاري', 'الرقم الضريبي', 'المدينة', 'الحالة', 'العقود السارية', 'الرصيد', 'مسؤول المبيعات', 'البريد الرئيسي'],
  ...S.companies.map(c => [c.nameAr, c.nameEn, c.cr, c.vat, c.city, COMPANY_STATUS[c.status].ar, S.contracts.filter(k => k.companyId === c.id && ['active', 'expiring'].includes(contractStatus(k))).length, finOK() ? companyBalance(c.id) : '—', userName(c.salesOwner), S.customers.find(u => u.companyId === c.id && u.companyRole === 'admin')?.email || ''])], 'companies');
ACT['open-company'] = (el) => { UI.coTab = el.dataset.tab || 'overview'; openCompany(el.dataset.id); };
ACT['co-tab'] = (el) => { UI.coTab = el.dataset.k; openCompany(el.dataset.id); };
function openCompany(id) {
  const c = companyById(id); if (!c) return; const tab = UI.coTab; const fin = finOK(); const ed = can('companies', 'edit'), ap = can('companies', 'approve');
  const ks = S.contracts.filter(k => k.companyId === c.id); const inv = companyInvoices(c.id).filter(i => i.status !== 'draft').sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  const users = S.customers.filter(u => u.companyId === c.id && u.status !== 'removed'); const reqDocs = c.docs.filter(d => DOC_TYPES[d.type].req); const canVerify = reqDocs.every(d => d.status === 'approved');
  const tabs = [['overview', 'نظرة عامة'], ['docs', `المستندات (${c.docs.filter(d => d.status === 'review').length})`], ['contracts', `العقود (${ks.length})`], ...(fin ? [['invoices', 'الفواتير والرصيد']] : []), ['users', `المستخدمون (${users.length})`], ['activity', 'الحجوزات والطلبات']];
  let body = '';
  if (tab === 'overview') body = `<div class="cols even"><dl class="kv"><dt>الاسم القانوني</dt><dd>${esc(c.nameAr)}<span class="sub ltr" style="text-align:start">${esc(c.nameEn)}</span></dd><dt>السجل التجاري</dt><dd class="ltr num" style="text-align:start">${esc(c.cr)}</dd><dt>الرقم الضريبي</dt><dd class="ltr num" style="text-align:start">${esc(c.vat || '—')}</dd>
      <dt>المدينة والحجم</dt><dd>${esc(c.city)} · ${esc(c.size)} موظفين</dd><dt>الاهتمامات</dt><dd>${esc((c.interests || []).map(x => ({office:'مكتب مقفل', shared:'مكتب مشترك', desk:'مقاعد مرنة', virtual:'مكتب افتراضي', rooms:'قاعات', programs:'برامج الحاضنة', foreign:'مستثمر أجنبي'}[x] || x)).join('، ') || '—')}</dd>
      <dt>مسؤول المبيعات</dt><dd>${whoTag(c.salesOwner)}</dd><dt>تاريخ التسجيل</dt><dd>${fmtDate(c.createdAt)}</dd></dl>
    <div style="display:grid;gap:10px;align-content:start">${c.status === 'suspended' ? `<div class="notice bad">${ic('ban')}<div><b>معلّقة:</b> ${esc(c.suspendReason)} — لا تُفتح صفقات أو حجوزات جديدة.</div></div>` : ''}
      ${c.pendingChange ? `<div class="notice">${ic('edit')}<div>طلب تعديل «${esc(c.pendingChange.label)}» من «${esc(c.pendingChange.from)}» إلى «${esc(c.pendingChange.to)}»${c.pendingChange.file ? ` · مرفق: ${esc(c.pendingChange.file)}` : ''}
        ${ap ? `<div class="toolbar" style="margin-top:8px"><button class="btn btn-gold btn-xs" data-act="co-change" data-id="${c.id}" data-d="ok">اعتماد</button><button class="btn btn-danger btn-xs" data-act="co-change" data-id="${c.id}" data-d="no">رفض</button></div>` : ''}</div></div>` : ''}
      ${c.status === 'pending' ? `<div class="notice ${canVerify ? '' : 'warn'}">${ic('idcard')}<div>${canVerify ? 'المستندات المطلوبة معتمدة — يمكن توثيق المنشأة الآن.' : `يلزم اعتماد ${reqDocs.filter(d => d.status !== 'approved').length} من المستندات المطلوبة قبل التوثيق.`}</div></div>` : ''}
      <div class="toolbar">${ap && c.status === 'pending' ? `<button class="btn btn-gold btn-sm" data-act="co-verify" data-id="${c.id}" ${canVerify ? '' : 'disabled'}>${ic('check')} توثيق المنشأة</button>` : ''}
        ${ap && c.status === 'verified' ? `<button class="btn btn-danger btn-sm" data-act="co-suspend" data-id="${c.id}">${ic('ban')} تعليق المنشأة</button>` : ''}${ap && c.status === 'suspended' ? `<button class="btn btn-ghost btn-sm" data-act="co-suspend" data-id="${c.id}" data-d="on">${ic('check')} رفع التعليق</button>` : ''}
        ${can('deals', 'add') && c.status === 'verified' ? `<button class="btn btn-ghost btn-sm" data-act="deal-for" data-id="${c.id}">${ic('brief')} صفقة جديدة</button>` : ''}${fin ? `<button class="btn btn-ghost btn-sm" data-act="co-stmt" data-id="${c.id}">${ic('list')} كشف الحساب</button>` : ''}</div>
      ${fin ? `<div class="tiles" style="grid-template-columns:repeat(2,minmax(0,1fr))">${tile('الرصيد المستحق', sar(companyBalance(c.id)), {icon:'coins'})}${tile('أقدم تأخير', maxLateDays(c.id) + ' يوم', {icon:'alert'})}</div>` : ''}</div></div>`;
  else if (tab === 'docs') body = table(['المستند', 'الملف', 'الانتهاء', 'الحالة', ''], c.docs.map(d => { const T = DOC_TYPES[d.type]; const left = d.expiry ? daysBetween(today(), d.expiry) : null;
      return `<tr><td><b>${esc(T.ar)}</b>${T.req ? ' <span class="chip plain">مطلوب</span>' : ''}</td><td>${d.file ? (can('companies', 'files') ? `${ic('doc', '')} ${esc(d.file)}<span class="sub">${fmtDate(d.uploadedAt, true)}</span>` : '<span class="chip plain">' + ic('lock') + ' يتطلب صلاحية الملفات</span>') : '—'}</td>
        <td>${d.expiry ? `${fmtDate(d.expiry)}${left <= 30 ? ` <span class="chip ${left < 0 ? 'bad' : 'warn'}">${left < 0 ? 'منتهي' : 'بعد ' + left + ' يوم'}</span>` : ''}` : '—'}</td><td>${chipM(DOC_STATUS, d.status)}${d.reason ? `<span class="sub bad-t">${esc(d.reason)}</span>` : ''}</td>
        <td>${ap && d.status === 'review' ? `<div class="toolbar" style="flex-wrap:nowrap"><button class="btn btn-gold btn-xs" data-act="co-doc" data-id="${c.id}" data-t="${d.type}" data-d="ok">اعتماد</button><button class="btn btn-danger btn-xs" data-act="co-doc" data-id="${c.id}" data-t="${d.type}" data-d="no">رفض</button></div>` : d.expiry && left <= 30 && d.status === 'approved' ? `<button class="btn btn-ghost btn-xs" data-act="co-doc-remind" data-id="${c.id}" data-t="${d.type}">${ic('bell')} تذكير</button>` : ''}</td></tr>`; }));
  else if (tab === 'contracts') body = table(['العقد', 'المساحة', 'الفترة', 'الشهري', 'الحالة'], ks.map(k => `<tr class="click" data-act="open-contract" data-id="${k.id}"><td class="ltr" style="text-align:start"><b>${k.id}</b></td><td>${esc(L(resById(k.resourceId).name, 'ar'))}${k.qty > 1 ? ' ×' + k.qty : ''}</td><td>${fmtDate(k.start)} ← ${fmtDate(k.end)}</td><td class="num">${fin ? sar(k.monthly) : '•••'}</td><td>${chipM(CONTRACT_STATUS, contractStatus(k))}</td></tr>`), 'لا توجد عقود');
  else if (tab === 'invoices') { const a = agingFor(c.id); body = `<div class="aging">${[['cur', 'غير مستحقة'], ['d30', '1–30 يومًا'], ['d60', '31–60'], ['d90', '61–90'], ['d90p', 'أكثر من 90']].map(([k, l]) => `<div class="${a[k] && k !== 'cur' ? 'late' : ''}"><span>${l}</span><b class="num">${sar(a[k])}</b></div>`).join('')}<div class="tot"><span>الإجمالي</span><b class="num">${sar(a.total)}</b></div></div>
    ${table(['الفاتورة', 'الإصدار', 'الاستحقاق', 'الإجمالي', 'المتبقي', 'الحالة'], inv.map(i => `<tr class="click" data-act="open-invoice" data-id="${i.id}"><td class="ltr" style="text-align:start"><b>${i.id}</b></td><td>${fmtDate(i.issueDate)}</td><td>${i.kind === 'credit' ? '—' : fmtDate(i.dueDate)}</td><td class="num">${sar(i.total)}</td><td class="num">${i.kind === 'credit' ? '—' : sar(invOpen(i))}</td><td>${chipM(INV_STATUS, invStatus(i))}</td></tr>`), 'لا توجد فواتير')}`; }
  else if (tab === 'users') body = table(['المستخدم', 'الدور في المنشأة', 'الجوال', 'آخر دخول'], users.map(u => `<tr><td><b>${esc(u.name)}</b><span class="sub ltr" style="text-align:start">${esc(showEmail(u.email))}</span></td><td>${esc(COMPANY_ROLES[u.companyRole].ar)}</td><td class="ltr" style="text-align:start">${esc(showPhone(u.phone))}</td><td>${u.sessions?.[0] ? ago(u.sessions[0].at) : '—'}</td></tr>`));
  else { const bs = S.bookings.filter(b => b.companyId === c.id).sort((a, b) => b.start.localeCompare(a.start)).slice(0, 8); const rq = S.requests.filter(r => r.companyId === c.id);
    body = `<p class="lbl">ساعات القاعات هذا الشهر: <b class="num">${freeUsed(c.id)}</b> من <b class="num">${freeQuota(c.id)}</b> مجانية</p>${table(['القاعة', 'الموعد', 'الحالة'], bs.map(b => `<tr class="click" data-act="open-booking" data-id="${b.id}"><td>${esc(L(resById(b.resourceId).name, 'ar'))}</td><td>${fmtDate(b.start, true)}</td><td>${chipM(BOOKING_STATUS, b.status)}</td></tr>`), 'لا توجد حجوزات')}
    <p class="lbl" style="margin-top:14px">الطلبات</p>${table(['الطلب', 'النوع', 'الحالة'], rq.map(r => `<tr class="click" data-act="open-req" data-id="${r.id}"><td class="ltr" style="text-align:start">${r.id}</td><td>${esc(REQ_TYPES[r.type].ar)}</td><td>${stChip(r.status)}</td></tr>`), 'لا توجد طلبات')}`; }
  openModal({size:'xl', title:esc(c.nameAr), sub:`${chipM(COMPANY_STATUS, c.status)} · <span class="ltr">CR ${esc(c.cr)}</span> · ${esc(branchName(c.branch, 'ar'))}`, body:`<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" class="${tab === k ? 'on' : ''}" data-act="co-tab" data-k="${k}" data-id="${c.id}">${l}</button>`).join('')}</div>${body}`});
}
ACT['co-stmt'] = (el) => openStatement(el.dataset.id);
ACT['deal-for'] = (el) => { ACT['deal-new']({dataset:{}}); UI.wiz.d.companyId = el.dataset.id; UI.wiz.d.branch = companyById(el.dataset.id).branch; UI.wiz.step = 2; openWizard(); };
ACT['co-doc'] = (el) => {
  if (!guard('companies', 'approve')) return; const c = companyById(el.dataset.id); const d = c.docs.find(x => x.type === el.dataset.t); const T = DOC_TYPES[d.type];
  const done = (reason = '') => { d.status = reason ? 'rejected' : 'approved'; d.reason = reason; d.reviewedBy = me().id; d.reviewedAt = new Date().toISOString();
    S.customers.filter(u => u.companyId === c.id && u.companyRole === 'admin').forEach(u => u.notifs.unshift({at:d.reviewedAt, text:reason ? `رُفض مستند «${T.ar}»: ${reason}. ارفع نسخة جديدة من البوابة.` : `اعتُمد مستند «${T.ar}».`}));
    audit('verify', c.nameAr, {[T.ar]:'قيد المراجعة'}, {[T.ar]:reason ? 'مرفوض: ' + reason : 'معتمد'}); save(); UI.coTab = 'docs'; openCompany(c.id); renderAdminKeepModal(); toast(reason ? 'رُفض المستند وأُبلغ العميل بالسبب' : 'اعتُمد المستند'); };
  if (el.dataset.d === 'ok') return done();
  openModal({title:'رفض المستند', sub:esc(T.ar + ' — ' + c.nameAr), body:`<div class="form">${fld('dr-r', 'السبب (يظهر للعميل) *', `<select class="input" id="dr-r"><option value="">اختر</option>${options([['الصورة غير واضحة', 'الصورة غير واضحة'], ['المستند منتهي الصلاحية', 'منتهي الصلاحية'], ['البيانات لا تطابق بيانات المنشأة', 'لا يطابق البيانات'], ['المستند ناقص الصفحات', 'ناقص'], ['other', 'سبب آخر']])}</select>`)}${fld('dr-o', 'تفاصيل', inp('dr-o'))}<button class="btn btn-danger" id="dr-go" style="justify-self:start">رفض</button></div>`,
    onMount:(m) => m.querySelector('#dr-go').onclick = () => { let r = m.querySelector('#dr-r').value; const o = m.querySelector('#dr-o').value.trim(); if (!r) return toast('السبب إلزامي', true); if (r === 'other') { if (!o) return toast('اكتب السبب', true); r = o; } else if (o) r += ' — ' + o; done(r); }});
};
ACT['co-doc-remind'] = (el) => { const c = companyById(el.dataset.id); const T = DOC_TYPES[el.dataset.t]; S.customers.filter(u => u.companyId === c.id && u.companyRole === 'admin').forEach(u => u.notifs.unshift({at:new Date().toISOString(), text:`تذكير: مستند «${T.ar}» ينتهي قريبًا. ارفع النسخة المجددة من البوابة.`})); (S.outbox = S.outbox || []).unshift({at:new Date().toISOString(), to:c.nameAr, subject:fillTpl('doc_expiry', {doc:T.ar}) || 'تذكير بانتهاء مستند', channel:'email'}); save(); toast('أُرسل التذكير للعميل'); };
ACT['co-verify'] = (el) => {
  if (!guard('companies', 'approve')) return; const c = companyById(el.dataset.id); if (!c.docs.filter(d => DOC_TYPES[d.type].req).every(d => d.status === 'approved')) return toast('اعتمد المستندات المطلوبة أولًا', true);
  c.status = 'verified'; c.verifiedAt = new Date().toISOString(); c.verifiedBy = me().id;
  S.customers.filter(u => u.companyId === c.id).forEach(u => u.notifs.unshift({at:c.verifiedAt, text:'وُثّقت منشأتكم — أصبح حجز القاعات أونلاين وعروض الأسعار والفوترة متاحة.'}));
  S.requests.filter(r => r.companyId === c.id && r.type === 'register' && !['done', 'approved'].includes(r.status)).forEach(r => setReqStatus(r, 'approved'));
  if (c.salesOwner) notify(c.salesOwner, 'وُثّقت منشأة عميلك', c.nameAr + ' — يمكنك إعداد عرض السعر الآن', 'deals');
  audit('company', c.nameAr, {الحالة:'قيد التحقق'}, {الحالة:'موثّقة'}); save(); openCompany(c.id); renderAdminKeepModal(); toast('وُثّقت المنشأة وأُبلغ العميل');
};
ACT['co-suspend'] = (el) => {
  if (!guard('companies', 'approve')) return; const c = companyById(el.dataset.id);
  if (el.dataset.d === 'on') { c.status = 'verified'; c.suspendReason = ''; audit('company', c.nameAr, {الحالة:'معلّقة'}, {الحالة:'موثّقة'}); save(); openCompany(c.id); renderAdminKeepModal(); return toast('رُفع التعليق'); }
  openModal({title:'تعليق المنشأة', sub:esc(c.nameAr), body:`<div class="form"><div class="notice warn">${ic('alert')}<div>لن تُفتح صفقات أو حجوزات جديدة. العقود الحالية تستمر حتى قرار آخر.</div></div>${fld('cs-r', 'السبب *', inp('cs-r', maxLateDays(c.id) > S.rules.billing.reminders.suspend ? `فواتير متأخرة أكثر من ${S.rules.billing.reminders.suspend} يومًا` : ''))}<button class="btn btn-danger" id="cs-go" style="justify-self:start">تعليق</button></div>`,
    onMount:(m) => m.querySelector('#cs-go').onclick = () => { const r = m.querySelector('#cs-r').value.trim(); if (!r) return toast('السبب إلزامي', true); c.status = 'suspended'; c.suspendReason = r;
      S.customers.filter(u => u.companyId === c.id && u.companyRole === 'admin').forEach(u => u.notifs.unshift({at:new Date().toISOString(), text:`عُلّق حساب المنشأة: ${r}. تواصل مع المحاسبة.`}));
      audit('company', c.nameAr, {الحالة:'موثّقة'}, {الحالة:'معلّقة', السبب:r}); save(); openCompany(c.id); renderAdminKeepModal(); toast('عُلّقت المنشأة'); }});
};
ACT['co-change'] = (el) => {
  if (!guard('companies', 'approve')) return; const c = companyById(el.dataset.id); const ch = c.pendingChange; if (!ch) return;
  if (el.dataset.d === 'ok') { const before = c[ch.field]; c[ch.field] = ch.to; S.customers.filter(u => u.companyId === c.id && u.companyRole === 'admin').forEach(u => u.notifs.unshift({at:new Date().toISOString(), text:`اعتُمد تعديل «${ch.label}». يظهر في العقود والفواتير القادمة.`})); audit('company', c.nameAr, {[ch.label]:before}, {[ch.label]:ch.to}); }
  else { S.customers.filter(u => u.companyId === c.id && u.companyRole === 'admin').forEach(u => u.notifs.unshift({at:new Date().toISOString(), text:`رُفض طلب تعديل «${ch.label}». تواصل مع فريق المبيعات للتفاصيل.`})); audit('company', c.nameAr, null, {[ch.label]:'رُفض التعديل'}); }
  c.pendingChange = null; save(); if ($('#modal.open')) { openCompany(c.id); renderAdminKeepModal(); } else renderAdmin(); toast(el.dataset.d === 'ok' ? 'اعتُمد التعديل' : 'رُفض التعديل');
};

/* ================= contracts ================= */
UI.kF = '';
VIEWS.contracts = () => {
  const fin = can('contracts', 'finance'); const all = S.contracts.filter(k => inScope({assignee:companyById(k.companyId)?.salesOwner, branch:resById(k.resourceId).branch}));
  const list = UI.kF ? all.filter(k => contractStatus(k) === UI.kF) : all;
  const next = (k) => { const p = contractSchedule(k).find(x => x.from >= today()); return p ? fmtDate(p.from) : '—'; };
  return `<div class="tiles">${tile('سارية', all.filter(k => ['active', 'expiring'].includes(contractStatus(k))).length, {icon:'contract'})}${tile('بانتظار التوقيع', all.filter(k => k.status === 'awaiting').length, {icon:'stamp'})}
    ${tile(`تنتهي خلال ${S.rules.contracts.renewalAlertDays} يومًا`, all.filter(k => contractStatus(k) === 'expiring').length, {icon:'refresh'})}${tile('تأمينات محتجزة (ر.س)', money(all.filter(k => ['active', 'expiring'].includes(contractStatus(k))).reduce((n, k) => n + k.deposit, 0)), {icon:'lock', locked:!fin})}</div>
  <div class="toolbar">${['', ...Object.keys(CONTRACT_STATUS)].map(k => `<button class="chip ${UI.kF === k ? '' : 'plain'}" style="border:0;cursor:pointer" data-act="k-f" data-f="${k}">${k ? CONTRACT_STATUS[k].ar : 'الكل'} <b class="num">${k ? all.filter(x => contractStatus(x) === k).length : all.length}</b></button>`).join('')}</div>
  ${panel('العقود', table(['العقد', 'المنشأة', 'المساحة', 'الفترة', 'الشهري', 'الفاتورة القادمة', 'الحالة'], list.map(k => `<tr class="click" data-act="open-contract" data-id="${k.id}"><td class="ltr" style="text-align:start"><b>${k.id}</b>${k.dealId ? `<span class="sub">${k.dealId}</span>` : ''}</td><td>${coN(k.companyId)}</td><td>${esc(L(resById(k.resourceId).name, 'ar'))}${k.qty > 1 ? ' ×' + k.qty : ''}</td>
    <td>${fmtDate(k.start)} ← ${fmtDate(k.end)}</td><td class="num">${fin ? sar(k.monthly * (k.qty || 1)) : '•••'}</td><td>${k.status === 'awaiting' ? '—' : next(k)}</td><td>${chipM(CONTRACT_STATUS, contractStatus(k))}</td></tr>`), 'لا توجد عقود'),
    {pad:false, sub:'تُنشأ العقود تلقائيًا من الصفقات المعتمدة', actions:`<button class="btn btn-ghost btn-sm" data-act="contract-export" ${can('contracts', 'export') ? '' : 'disabled'}>${ic('download')} تصدير</button>`})}`;
};
ACT['k-f'] = (el) => { UI.kF = el.dataset.f; renderAdmin(); };
ACT['contract-export'] = () => { const fin = can('contracts', 'finance'); exportDialog('العقود', [['العقد', 'المنشأة', 'السجل', 'المساحة', 'البداية', 'النهاية', 'الشهري', 'الخصم', 'التأمين', 'الحالة'], ...S.contracts.map(k => [k.id, companyName(companyById(k.companyId), 'ar'), companyById(k.companyId)?.cr, L(resById(k.resourceId).name, 'ar'), k.start, k.end, fin ? k.monthly : '—', (k.discountPct || 0) + '%', fin ? k.deposit : '—', CONTRACT_STATUS[contractStatus(k)].ar])], 'contracts'); };
ACT['open-contract'] = (el) => openContractAdmin(S.contracts.find(k => k.id === el.dataset.id));
function openContractAdmin(k) {
  if (!k) return; const ed = can('contracts', 'edit'); const cs = contractStatus(k); const fin = can('contracts', 'finance');
  const sch = contractSchedule(k).map((p, i) => { const inv = S.invoices.find(x => x.contractId === k.id && x.period?.from === p.from && x.kind === 'invoice');
    return `<tr><td class="num">${i + 1}</td><td>${fmtDate(p.from)} — ${fmtDate(p.to)}</td><td class="num">${fin ? sar(p.net + vatOf(p.net)) : '•••'}</td><td>${inv ? `<button class="lk" data-act="open-invoice" data-id="${inv.id}">${inv.status === 'draft' ? 'مسودة' : esc(inv.id)}</button> ${chipM(INV_STATUS, invStatus(inv))}` : '<span class="muted">لم تُنشأ</span>'}</td></tr>`; }).join('');
  const extra = `${k.status === 'awaiting' && ed ? `<label class="btn btn-gold btn-sm">${ic('upload')} رفع النسخة الموقعة وتفعيل العقد<input type="file" id="k-signed" accept=".pdf" hidden data-act="k-sign" data-id="${k.id}"></label>${S.rules.contracts.allowUnsigned ? `<button class="btn btn-ghost btn-sm" data-act="k-activate" data-id="${k.id}">تفعيل دون نسخة موقعة</button>` : ''}` : ''}
    ${cs === 'expiring' && ed ? `<button class="btn btn-ghost btn-sm" data-act="k-remind" data-id="${k.id}">${ic('bell')} إرسال تنبيه التجديد</button>` : ''}`;
  openModal({size:'xl', title:`العقد <span class="ltr">${k.id}</span>`, sub:`${coN(k.companyId)} · ${chipM(CONTRACT_STATUS, cs)}`, body:`<div class="toolbar no-print" style="margin-bottom:14px">${extra}<button class="btn btn-ghost btn-sm" data-act="print-doc">${ic('print')} طباعة / PDF</button>${k.dealId ? `<button class="btn btn-ghost btn-sm" data-act="open-deal" data-id="${k.dealId}">${ic('brief')} الصفقة ${k.dealId}</button>` : ''}</div>
    ${k.status === 'awaiting' ? `<div class="notice warn no-print">${ic('stamp')}<div>المساحة محجوزة لهذا العقد. بعد رفع النسخة الموقعة يصبح نشطًا وتُنشأ أول فاتورة للمحاسبة.${S.rules.contracts.allowUnsigned ? '' : ' (التفعيل دون توقيع غير مسموح في قواعد العمل)'}</div></div>` : ''}
    <div class="panel no-print" style="margin-bottom:14px"><div class="panel-head"><h2>جدول الفواتير</h2></div>${table(['#', 'الفترة', 'الإجمالي', 'الفاتورة'], [sch])}</div>${contractDocHTML(k)}`,
    onMount:(m) => { const f = m.querySelector('#k-signed'); if (f) f.onchange = () => { if (VIEW_ONLY) return toast(VIEW_MSG, true); const file = f.files[0]; if (!file) return; contractGoLive(k, file.name); }; }});
}
function contractGoLive(k, file) {
  if (!guard('contracts', 'edit')) return; const inv = activateContract(k, me().id, file);
  S.users.filter(u => u.status === 'active' && u.roleId === 'accountant').forEach(u => notify(u.id, 'عقد نشط — أول فاتورة جاهزة للإصدار', `${k.id} — ${companyName(companyById(k.companyId), 'ar')}`, 'billing'));
  S.customers.filter(x => x.companyId === k.companyId && ['admin', 'finance'].includes(x.companyRole)).forEach(x => x.notifs.unshift({at:new Date().toISOString(), text:`أصبح عقدكم ${k.id} نشطًا. ستصلكم الفاتورة الأولى قريبًا.`}));
  audit('contract', k.id, {الحالة:'بانتظار التوقيع'}, {الحالة:'نشط', النسخة_الموقعة:file || 'دون توقيع', الفاتورة_الأولى:'مسودة'}); save(); openContractAdmin(k); renderAdminKeepModal(); toast('فُعّل العقد وأُنشئت مسودة أول فاتورة للمحاسبة');
}
ACT['k-sign'] = () => {};
ACT['k-activate'] = (el) => { const k = S.contracts.find(x => x.id === el.dataset.id); confirmBox('تفعيل العقد دون نسخة موقعة؟ تُسجَّل العملية في السجل.', () => contractGoLive(k, null), 'تفعيل', false); };
ACT['k-remind'] = (el) => { const k = S.contracts.find(x => x.id === el.dataset.id); S.customers.filter(x => x.companyId === k.companyId && x.companyRole === 'admin').forEach(x => x.notifs.unshift({at:new Date().toISOString(), text:`عقدكم ${k.id} ينتهي في ${fmtDate(k.end, false, 'ar')}. اطلب التجديد من البوابة واحصل على خصم حتى 15%.`})); (S.outbox = S.outbox || []).unshift({at:new Date().toISOString(), to:companyName(companyById(k.companyId), 'ar'), subject:fillTpl('contract_expiry', {name:companyName(companyById(k.companyId), 'ar'), space:L(resById(k.resourceId).name, 'ar'), date:fmtDate(k.end)}), channel:'email'}); audit('contract', k.id, null, {تنبيه:'تجديد'}); save(); toast('أُرسل تنبيه التجديد'); };

/* ================= accounting ================= */
UI.billTab = 'drafts'; UI.invF = ''; UI.vatQ = '';
VIEWS.billing = () => {
  const tab = UI.billTab; const fin = can('billing', 'finance'); const ed = can('billing', 'edit');
  const drafts = S.invoices.filter(i => i.status === 'draft'); const recs = S.payments.filter(p => p.status === 'review');
  const tabs = [['drafts', `المسودات (${drafts.length})`], ['issued', 'الفواتير الصادرة'], ['receipts', `الإيصالات (${recs.length})`], ['aging', 'أعمار الديون'], ['vat', 'ضريبة القيمة المضافة']];
  if (!fin) return lockNote('المحاسبة تتطلب صلاحية «بيانات مالية» في المحاسبة والفواتير.');
  let body = '';
  if (tab === 'drafts') body = panel('مسودات الفواتير', `${table(['', 'المنشأة', 'العقد', 'الفترة', 'البنود', 'الإجمالي', ''], drafts.map(i => `<tr><td><input type="checkbox" data-dr="${i.id}" checked aria-label="تحديد"></td><td>${coN(i.companyId)}</td><td class="ltr" style="text-align:start">${esc(i.contractId || '—')}</td><td>${i.period ? `${fmtDate(i.period.from)} — ${fmtDate(i.period.to)}` : '—'}</td>
      <td>${i.lines.length}${i.extraFor ? ' <span class="chip info">ساعات إضافية</span>' : ''}</td><td class="num">${sar(i.total)}</td><td><button class="btn btn-ghost btn-xs" data-act="open-invoice" data-id="${i.id}">${ic('eye')} معاينة</button></td></tr>`), 'لا توجد مسودات — ولّدها من جداول العقود')}`,
    {pad:false, sub:'تُنشأ من جداول دفعات العقود السارية، وتُضاف ساعات القاعات الزائدة عن الرصيد المجاني', actions:ed ? `<button class="btn btn-ghost btn-sm" data-act="gen-drafts">${ic('refresh')} توليد من الجداول</button><button class="btn btn-gold btn-sm" data-act="inv-issue-all" ${drafts.length ? '' : 'disabled'}>${ic('stamp')} إصدار المحدد وإرساله</button>` : ''});
  else if (tab === 'issued') { const all = S.invoices.filter(i => i.status !== 'draft').sort((a, b) => b.issueDate.localeCompare(a.issueDate)); const list = UI.invF ? all.filter(i => invStatus(i) === UI.invF) : all;
    body = panel('الفواتير الصادرة', `<div class="panel-body" style="padding-bottom:0"><div class="toolbar"><select class="input" id="inv-f" aria-label="الحالة"><option value="">كل الحالات</option>${options(Object.entries(INV_STATUS).filter(([k]) => k !== 'draft').map(([k, v]) => [k, `${v.ar} (${all.filter(i => invStatus(i) === k).length})`]), UI.invF)}</select></div></div>
      <div style="padding-top:14px">${table(['الرقم', 'المنشأة', 'الإصدار', 'الاستحقاق', 'الإجمالي', 'المتبقي', 'الحالة'], list.map(i => `<tr class="click" data-act="open-invoice" data-id="${i.id}"><td class="ltr" style="text-align:start"><b>${i.id}</b>${i.refInvoice ? `<span class="sub">← ${i.refInvoice}</span>` : ''}</td><td>${coN(i.companyId)}</td><td>${fmtDate(i.issueDate)}</td><td>${i.kind === 'credit' ? '—' : fmtDate(i.dueDate)}</td><td class="num">${sar(i.total)}</td><td class="num ${invOpen(i) ? 'gold' : ''}">${i.kind === 'credit' ? '—' : sar(invOpen(i))}</td><td>${chipM(INV_STATUS, invStatus(i))}</td></tr>`), 'لا توجد')}</div>`,
      {pad:false, sub:'لا تُعدَّل الفاتورة بعد إصدارها — التصحيح بإشعار دائن', actions:`<button class="btn btn-ghost btn-sm" data-act="inv-export">${ic('download')} تصدير للمحاسبة</button>`}); }
  else if (tab === 'receipts') body = panel('إيصالات التحويل', table(['المرجع', 'المنشأة', 'المبلغ', 'التاريخ', 'الفاتورة', 'الحالة', ''], S.payments.slice().sort((a, b) => (a.status === 'review' ? -1 : 1) - (b.status === 'review' ? -1 : 1) || b.at.localeCompare(a.at)).slice(0, 30).map(p => `<tr><td class="ltr" style="text-align:start"><b>${esc(p.ref)}</b><span class="sub">${esc(p.id)}</span></td><td>${coN(p.companyId)}</td><td class="num">${sar(p.amount)}</td><td>${fmtDate(p.date)}</td><td class="ltr" style="text-align:start">${esc(p.invoiceId || '—')}</td>
    <td>${chipM(PAY_STATUS, p.status)}${p.allocations?.length > 1 ? `<span class="sub">وُزّع على ${p.allocations.length}</span>` : ''}</td><td><button class="btn ${p.status === 'review' ? 'btn-gold' : 'btn-ghost'} btn-xs" data-act="open-payment" data-id="${p.id}">${p.status === 'review' ? 'مراجعة' : 'تفاصيل'}</button></td></tr>`), 'لا توجد'), {pad:false, sub:'عند الاعتماد تُخصم الدفعة من أقدم فاتورة مستحقة أولًا، والزيادة رصيد دائن', actions:ed ? `<button class="btn btn-ghost btn-sm" data-act="pay-record">${ic('plus')} تسجيل دفعة يدويًا</button>` : ''});
  else if (tab === 'aging') { const rem = S.rules.billing.reminders; const rows = S.companies.map(c => ({c, a:agingFor(c.id), late:maxLateDays(c.id)})).filter(x => x.a.total);
    const tot = (k) => r2(rows.reduce((n, x) => n + x.a[k], 0)); const stage = (d) => d > rem.suspend ? ['suspend', 'إيقاف الخدمة', 'bad'] : d > rem.warn ? ['warn', 'إنذار', 'warn'] : d >= rem.remind ? ['remind', 'تذكير', 'info'] : null;
    body = `<div class="aging">${[['cur', 'غير مستحقة'], ['d30', '1–30 يومًا'], ['d60', '31–60'], ['d90', '61–90'], ['d90p', 'أكثر من 90']].map(([k, l]) => `<div class="${tot(k) && k !== 'cur' ? 'late' : ''}"><span>${l}</span><b class="num">${sar(tot(k))}</b></div>`).join('')}<div class="tot"><span>الإجمالي</span><b class="num">${sar(tot('total'))}</b></div></div>
    ${panel('أعمار الديون حسب المنشأة', table(['المنشأة', 'غير مستحقة', '1–30', '31–60', '61–90', '+90', 'أقدم تأخير', 'الإجراء', ''], rows.map(({c, a, late}) => { const s = stage(late);
      return `<tr><td><button class="lk" data-act="open-company" data-id="${c.id}" data-tab="invoices">${esc(c.nameAr)}</button>${c.status === 'suspended' ? ' <span class="chip bad">معلّقة</span>' : ''}</td>${['cur', 'd30', 'd60', 'd90', 'd90p'].map(k => `<td class="num ${a[k] && k !== 'cur' ? 'gold' : ''}">${a[k] ? sar(a[k]) : '—'}</td>`).join('')}<td class="num">${late > 0 ? late + ' يوم' : '—'}</td>
        <td>${s ? `<span class="chip ${s[2]}">${s[1]}</span>` : '—'}</td><td><div class="toolbar" style="flex-wrap:nowrap">${s ? `<button class="btn btn-ghost btn-xs" data-act="aging-remind" data-id="${c.id}" data-s="${s[0]}">${ic('mail')} إرسال</button>` : ''}<button class="btn btn-ghost btn-xs" data-act="co-stmt" data-id="${c.id}">كشف</button></div></td></tr>`; }), 'لا توجد ذمم'), {pad:false, sub:`السياسة: تذكير بعد ${rem.remind} أيام · إنذار بعد ${rem.warn} · إيقاف الخدمة بعد ${rem.suspend}`})}`; }
  else { const qs = quartersBack(4); const q = UI.vatQ || qs[0]; const V = vatReport(q);
    body = `<div class="toolbar"><div class="seg">${qs.map(x => `<button class="${x === q ? 'on' : ''}" data-act="vat-q" data-q="${x}">${x}</button>`).join('')}</div></div>
    <div class="tiles">${tile('المبيعات الخاضعة (ر.س)', sar(V.salesNet), {icon:'doc'})}${tile('ضريبة المخرجات', sar(V.salesVat), {icon:'coins'})}${tile('تعديلات الإشعارات الدائنة', '−' + sar(V.cnVat), {icon:'refresh'})}${tile('صافي الضريبة المستحقة', sar(V.net), {icon:'stamp'})}</div>
    ${panel(`مستندات ${q}`, table(['المستند', 'التاريخ', 'المنشأة', 'الرقم الضريبي للعميل', 'قبل الضريبة', 'الضريبة', 'الإجمالي'], V.docs.map(i => `<tr class="click" data-act="open-invoice" data-id="${i.id}"><td class="ltr" style="text-align:start">${i.id}</td><td>${fmtDate(i.issueDate)}</td><td>${coN(i.companyId)}</td><td class="ltr num" style="text-align:start">${esc(companyById(i.companyId)?.vat || '—')}</td><td class="num">${i.kind === 'credit' ? '−' : ''}${sar(i.net)}</td><td class="num">${i.kind === 'credit' ? '−' : ''}${sar(i.vat)}</td><td class="num">${i.kind === 'credit' ? '−' : ''}${sar(i.total)}</td></tr>`), 'لا توجد مستندات في هذا الربع'),
      {pad:false, sub:'ملخص لإعداد الإقرار الضريبي الربعي — الإقرار الرسمي يُقدَّم عبر بوابة هيئة الزكاة والضريبة والجمارك', actions:`<button class="btn btn-gold btn-sm" data-act="vat-export" data-q="${q}">${ic('download')} تصدير Excel</button>`})}`; }
  return `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" class="${tab === k ? 'on' : ''}" data-act="bill-tab" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
};
AFTER.billing = () => { const f = $('#inv-f'); if (f) f.onchange = (e) => { UI.invF = e.target.value; renderAdmin(); }; };
ACT['bill-tab'] = (el) => { UI.billTab = el.dataset.k; renderAdmin(); };
ACT['vat-q'] = (el) => { UI.vatQ = el.dataset.q; renderAdmin(); };
ACT['vat-export'] = (el) => { const V = vatReport(el.dataset.q); exportDialog('إقرار ضريبة القيمة المضافة ' + V.q, [['المستند', 'النوع', 'التاريخ', 'العميل', 'الرقم الضريبي', 'قبل الضريبة', 'الضريبة', 'الإجمالي'], ...V.docs.map(i => [i.id, i.kind === 'credit' ? 'إشعار دائن' : 'فاتورة', i.issueDate, companyName(companyById(i.companyId), 'ar'), companyById(i.companyId)?.vat || '', (i.kind === 'credit' ? -1 : 1) * i.net, (i.kind === 'credit' ? -1 : 1) * i.vat, (i.kind === 'credit' ? -1 : 1) * i.total]), ['الإجمالي', '', '', '', '', V.base, V.net, r2(V.base + V.net)]], 'billing'); };
ACT['inv-export'] = () => exportDialog('الفواتير (للمحاسبة)', [['الرقم', 'النوع', 'المنشأة', 'السجل', 'الرقم الضريبي', 'الإصدار', 'الاستحقاق', 'قبل الضريبة', 'الضريبة', 'الإجمالي', 'المدفوع', 'المتبقي', 'الحالة', 'UUID'], ...S.invoices.filter(i => i.status !== 'draft').map(i => { const c = companyById(i.companyId); return [i.id, i.kind === 'credit' ? 'إشعار دائن' : 'فاتورة', c?.nameAr, c?.cr, c?.vat, i.issueDate, i.dueDate, i.net, i.vat, i.total, i.paid, invOpen(i), INV_STATUS[invStatus(i)].ar, i.uuid]; })], 'billing');
ACT['gen-drafts'] = () => { if (!guard('billing', 'add')) return; const n = generateDrafts(); audit('invoice', 'توليد مسودات من جداول العقود', null, {العدد:n}); rerender(); toast(n ? `أُنشئت ${n} مسودة` : 'لا توجد فترات جديدة خلال 15 يومًا القادمة'); };
function issueAndSend(inv) {
  issueInvoice(inv); inv.sentAt = new Date().toISOString();
  S.customers.filter(x => x.companyId === inv.companyId && ['admin', 'finance'].includes(x.companyRole)).forEach(x => x.notifs.unshift({at:inv.sentAt, text:fillTpl('invoice_issued', {ref:inv.id, amount:sar(inv.total), date:fmtDate(inv.dueDate, false, 'ar')})}));
  (S.outbox = S.outbox || []).unshift({at:inv.sentAt, to:companyName(companyById(inv.companyId), 'ar'), subject:`فاتورة ضريبية ${inv.id} — ${sar(inv.total)} ر.س (PDF + QR)`, channel:'email'});
  audit('invoice', inv.id, {الحالة:'مسودة'}, {الحالة:'صادرة', الإجمالي:inv.total, المنشأة:companyName(companyById(inv.companyId), 'ar')});
}
ACT['inv-issue'] = (el) => { if (!guard('billing', 'approve')) return; const inv = S.invoices.find(x => x.id === el.dataset.id); if (inv.status !== 'draft') return;
  confirmBox(`إصدار الفاتورة الضريبية وإرسالها للعميل؟ لا يمكن تعديلها بعد الإصدار.`, () => { issueAndSend(inv); save(); openInvoice(inv.id, {admin:true}); renderAdminKeepModal(); toast(`صدرت الفاتورة ${inv.id} وأُرسلت`); }, 'إصدار', false); };
ACT['inv-issue-all'] = () => { if (!guard('billing', 'approve')) return; const ids = $$('[data-dr]:checked').map(i => i.dataset.dr); if (!ids.length) return toast('حدّد مسودة واحدة على الأقل', true);
  confirmBox(`إصدار ${ids.length} فاتورة وإرسالها؟ لا تُعدَّل بعد الإصدار.`, () => { ids.forEach(id => issueAndSend(S.invoices.find(x => x.id === id))); rerender(); toast(`صدرت ${ids.length} فاتورة`); }, 'إصدار', false); };
ACT['inv-send'] = (el) => { const inv = S.invoices.find(x => x.id === el.dataset.id); (S.outbox = S.outbox || []).unshift({at:new Date().toISOString(), to:companyName(companyById(inv.companyId), 'ar'), subject:`إعادة إرسال ${inv.id}`, channel:'email'}); audit('invoice', inv.id, null, {العملية:'إعادة إرسال'}); save(); toast('أُعيد إرسال الفاتورة'); };
function invAdminActions(inv) {
  if (!can('billing', 'view')) return '';
  if (inv.status === 'draft') return can('billing', 'approve') ? `<button class="btn btn-gold btn-sm" data-act="inv-issue" data-id="${inv.id}">${ic('stamp')} إصدار وإرسال</button>` : '';
  return `${inv.kind === 'invoice' && can('billing', 'edit') ? `${invOpen(inv) > 0 ? `<button class="btn btn-gold btn-sm" data-act="pay-record" data-id="${inv.id}">${ic('coins')} تسجيل دفعة</button>` : ''}<button class="btn btn-ghost btn-sm" data-act="inv-credit" data-id="${inv.id}">${ic('refresh')} إشعار دائن</button>` : ''}<button class="btn btn-ghost btn-sm" data-act="inv-send" data-id="${inv.id}">${ic('mail')} إعادة الإرسال</button>`;
}
ACT['inv-credit'] = (el) => {
  if (!guard('billing', 'edit')) return; const inv = S.invoices.find(x => x.id === el.dataset.id); const max = r2(inv.net - (inv.credited ? inv.credited / (1 + VAT_RATE) : 0));
  openModal({title:'إشعار دائن', sub:`على الفاتورة <span class="ltr">${inv.id}</span>`, body:`<div class="form"><p class="muted">الفاتورة الصادرة لا تُعدَّل. يصدر إشعار دائن بالمبلغ قبل الضريبة وتُعكس الضريبة تلقائيًا.</p>
    ${fld('cn-a', `المبلغ قبل الضريبة (حتى ${sar(max)})`, inp('cn-a', '', 'number', `min="1" max="${max}" step="0.01" dir="ltr"`))}${fld('cn-r', 'السبب *', inp('cn-r', '', 'text', 'placeholder="مثال: خصم متفق عليه لم يُحتسب"'))}<button class="btn btn-gold" id="cn-go" style="justify-self:start">إصدار الإشعار</button></div>`,
    onMount:(m) => m.querySelector('#cn-go').onclick = () => { const a = +m.querySelector('#cn-a').value, r = m.querySelector('#cn-r').value.trim(); if (!(a > 0) || a > max + 0.01) return toast('مبلغ غير صحيح', true); if (!r) return toast('السبب إلزامي', true);
      const cn = newInvoice({companyId:inv.companyId, contractId:inv.contractId, kind:'credit', refInvoice:inv.id, note:r, lines:[{desc:{ar:`إشعار دائن على ${inv.id}: ${r}`, en:`Credit on ${inv.id}`}, qty:1, unit:r2(a)}]});
      issueInvoice(cn); S.invoices.unshift(cn); inv.credited = r2(inv.credited + cn.total);
      S.customers.filter(x => x.companyId === inv.companyId && ['admin', 'finance'].includes(x.companyRole)).forEach(x => x.notifs.unshift({at:new Date().toISOString(), text:`صدر إشعار دائن ${cn.id} بمبلغ ${sar(cn.total)} ر.س على الفاتورة ${inv.id}.`}));
      audit('invoice', cn.id, null, {على:inv.id, المبلغ:cn.total, السبب:r}); save(); openInvoice(cn.id, {admin:true}); renderAdminKeepModal(); toast(`صدر الإشعار الدائن ${cn.id}`); }});
};
ACT['open-payment'] = (el) => {
  const p = S.payments.find(x => x.id === el.dataset.id); const c = companyById(p.companyId); const open = companyInvoices(c.id).filter(i => invOpen(i) > 0).sort((a, b) => (p.invoiceId === a.id ? -1 : p.invoiceId === b.id ? 1 : a.dueDate.localeCompare(b.dueDate)));
  let left = p.amount; const prev = open.map(i => { const take = Math.min(left, invOpen(i)); left = r2(left - take); return [i, take]; }).filter(x => x[1] > 0);
  openModal({size:'wide', title:`إيصال <span class="ltr">${esc(p.ref)}</span>`, sub:`${esc(c.nameAr)} · ${chipM(PAY_STATUS, p.status)}`, body:`<div class="cols even"><dl class="kv"><dt>المبلغ</dt><dd class="num">${sar(p.amount)} ر.س</dd><dt>تاريخ التحويل</dt><dd>${fmtDate(p.date)}</dd><dt>المرجع</dt><dd class="ltr" style="text-align:start">${esc(p.ref)}</dd><dt>الفاتورة المذكورة</dt><dd class="ltr" style="text-align:start">${esc(p.invoiceId || '—')}</dd>
      <dt>المرفق</dt><dd>${ic('doc', '')} ${esc(p.file || '—')}</dd><dt>رفعه</dt><dd>${esc(custById(p.by)?.name || userName(p.by) || 'العميل')} · ${fmtDate(p.at, true)}</dd>${p.reason ? `<dt>سبب الرفض</dt><dd>${esc(p.reason)}</dd>` : ''}</dl>
    <div>${p.status === 'review' ? `<p class="lbl">التخصيص عند الاعتماد (الأقدم أولًا)</p>${table(['الفاتورة', 'المتبقي', 'يُخصم'], prev.map(([i, a]) => `<tr><td class="ltr" style="text-align:start">${i.id}</td><td class="num">${sar(invOpen(i))}</td><td class="num gold">${sar(a)}</td></tr>`))}${left > 0 ? `<p class="muted">الزيادة ${sar(left)} ر.س تُسجَّل رصيدًا دائنًا للمنشأة.</p>` : ''}
      ${can('billing', 'approve') ? `${fld('pd-r', 'سبب الرفض (عند الرفض)', inp('pd-r', '', 'text', 'placeholder="مثال: المبلغ لم يصل إلى الحساب"'))}<div class="toolbar"><button class="btn btn-gold" data-act="pay-decide" data-id="${p.id}" data-d="ok">${ic('check')} اعتماد الدفعة</button><button class="btn btn-danger" data-act="pay-decide" data-id="${p.id}" data-d="no">رفض</button></div>` : ''}`
      : `<p class="lbl">التخصيص</p>${table(['الفاتورة', 'المبلغ'], (p.allocations || []).map(a => `<tr><td class="ltr" style="text-align:start">${esc(a.invoiceId)}</td><td class="num">${sar(a.amount)}</td></tr>`), '—')}`}</div></div>`});
};
ACT['pay-decide'] = (el) => {
  if (!guard('billing', 'approve')) return; const p = S.payments.find(x => x.id === el.dataset.id); if (p.status !== 'review') return; const c = companyById(p.companyId); const ok = el.dataset.d === 'ok';
  if (!ok) { const r = ($('#pd-r')?.value || '').trim(); if (!r) return toast('اكتب سبب الرفض', true); Object.assign(p, {status:'rejected', reason:r, decidedBy:me().id, decidedAt:new Date().toISOString()}); }
  else approvePayment(p, me().id);
  S.customers.filter(x => x.companyId === c.id && ['admin', 'finance'].includes(x.companyRole)).forEach(x => x.notifs.unshift({at:new Date().toISOString(), text:ok ? `اعتُمدت دفعتكم ${p.ref} بمبلغ ${sar(p.amount)} ر.س.` : `لم تُعتمد دفعتكم ${p.ref}: ${p.reason}.`}));
  audit('payment', c.nameAr, {الحالة:'قيد المراجعة'}, ok ? {الحالة:'معتمدة', التخصيص:p.allocations.map(a => `${a.invoiceId}: ${sar(a.amount)}`).join('، ')} : {الحالة:'مرفوضة', السبب:p.reason}); closeModal(); rerender(); toast(ok ? 'اعتُمدت الدفعة وخُصمت من الأقدم أولًا' : 'رُفض الإيصال وأُبلغ العميل');
};
ACT['pay-record'] = (el) => {
  if (!guard('billing', 'edit')) return; const inv = el.dataset.id ? S.invoices.find(x => x.id === el.dataset.id) : null;
  openModal({title:'تسجيل دفعة', sub:inv ? `<span class="ltr">${inv.id}</span> · المتبقي ${sar(invOpen(inv))}` : 'دفعة مستلمة خارج البوابة', body:`<div class="form">${inv ? '' : fld('pr-co', 'المنشأة', `<select class="input" id="pr-co">${options(S.companies.filter(c => companyBalance(c.id) > 0).map(c => [c.id, `${c.nameAr} — ${sar(companyBalance(c.id))}`]))}</select>`)}
    <div class="row">${fld('pr-a', 'المبلغ', inp('pr-a', inv ? invOpen(inv) : '', 'number', 'min="1" step="0.01" dir="ltr"'))}${fld('pr-d', 'التاريخ', inp('pr-d', today(), 'date', `max="${today()}"`))}</div>
    <div class="row">${fld('pr-m', 'الطريقة', `<select class="input" id="pr-m">${options([['transfer', 'تحويل بنكي'], ['mada', 'مدى'], ['cash', 'نقدًا'], ['cheque', 'شيك']])}</select>`)}${fld('pr-ref', 'المرجع', inp('pr-ref', '', 'text', 'dir="ltr"'))}</div>
    <button class="btn btn-gold" id="pr-go" style="justify-self:start">تسجيل واعتماد</button></div>`,
    onMount:(m) => m.querySelector('#pr-go').onclick = () => { const a = +m.querySelector('#pr-a').value, ref = m.querySelector('#pr-ref').value.trim(); if (!(a > 0)) return toast('أدخل المبلغ', true); if (!ref) return toast('أدخل المرجع', true);
      const cid = inv ? inv.companyId : m.querySelector('#pr-co').value; const p = {id:nextNo('PAY'), companyId:cid, invoiceId:inv?.id || null, amount:r2(a), date:m.querySelector('#pr-d').value, ref, method:m.querySelector('#pr-m').value, status:'review', file:'', by:me().id, at:new Date().toISOString(), allocations:[]};
      S.payments.unshift(p); approvePayment(p, me().id); audit('payment', companyName(companyById(cid), 'ar'), null, {المبلغ:p.amount, المرجع:ref, التخصيص:p.allocations.map(x => x.invoiceId).join('، ')}); closeModal(); rerender(); toast('سُجّلت الدفعة وخُصمت من الأقدم أولًا'); }});
};
ACT['aging-remind'] = (el) => {
  const c = companyById(el.dataset.id); const s = el.dataset.s; const bal = sar(companyBalance(c.id));
  const txt = {remind:`تذكير: لديكم فواتير مستحقة بمبلغ ${bal} ر.س. يمكنكم رفع إيصال التحويل من البوابة.`, warn:`إنذار: تأخر سداد ${bal} ر.س أكثر من ${S.rules.billing.reminders.warn} يومًا. قد تُوقف الخدمات بعد ${S.rules.billing.reminders.suspend} يومًا.`, suspend:`إشعار إيقاف الخدمة: تأخر السداد أكثر من ${S.rules.billing.reminders.suspend} يومًا (${bal} ر.س). تواصلوا مع المحاسبة لتسوية الوضع.`}[s];
  S.customers.filter(x => x.companyId === c.id && ['admin', 'finance'].includes(x.companyRole)).forEach(x => x.notifs.unshift({at:new Date().toISOString(), text:txt}));
  (S.outbox = S.outbox || []).unshift({at:new Date().toISOString(), to:c.nameAr, subject:txt.slice(0, 60) + '… + كشف الحساب', channel:'email'});
  if (s === 'suspend' && c.status !== 'suspended' && can('companies', 'approve')) { c.status = 'suspended'; c.suspendReason = `فواتير متأخرة أكثر من ${S.rules.billing.reminders.suspend} يومًا`; }
  audit('invoice', c.nameAr, null, {الإجراء:{remind:'تذكير', warn:'إنذار', suspend:'إشعار إيقاف'}[s], الرصيد:bal}); rerender(); toast('أُرسل للعميل مع كشف الحساب');
};

/* ================= spaces & prices ================= */
VIEWS.spaces = () => {
  const ed = can('pricing', 'edit'); const own = isOwner();
  return `${ed ? '' : lockNote('تعديل المساحات والأسعار يتطلب صلاحية «تعديل» في الباقات والأسعار.')}
  ${panel('الفروع', `<div>${S.branches.map(b => `<div class="list-item">${ic('branch')}<div class="grow"><b>${esc(b.name)}</b><span>${S.resources.filter(r => r.branch === b.id).length} مساحة · ${S.users.filter(u => u.branch === b.id && u.status === 'active').length} موظفين · هدف شهري ${money(S.rules.targets.branches[b.id]?.revenue || 0)} ر.س</span></div></div>`).join('')}</div>
    ${own ? `<div class="panel-body"><div class="toolbar"><input class="input" id="br-n" placeholder="اسم الفرع الجديد" aria-label="اسم الفرع"><button class="btn btn-ghost btn-sm" data-act="branch-add">${ic('plus')} إضافة فرع</button></div></div>` : ''}`, {pad:false})}
  ${panel('المساحات', table(['المساحة', 'النوع', 'الفرع', 'السعة', 'الساعة', 'الشهر', 'الحد الأدنى الشهري', 'أونلاين', 'الحالة', ''], S.resources.map(r => `<tr><td><b>${esc(L(r.name, 'ar'))}</b><span class="sub ltr" style="text-align:start">${esc(L(r.name, 'en'))}</span></td><td>${esc(SPACE_KINDS[r.kind].ar)}</td><td>${esc(branchName(r.branch, 'ar'))}</td><td class="num">${r.cap}</td>
    <td class="num">${r.rate.hour ? money(r.rate.hour) : '—'}</td><td class="num">${r.rate.month ? money(r.rate.month) : '—'}</td><td class="num">${r.minMonth ? money(r.minMonth) : '—'}</td><td>${S.rules.booking.onlineKinds.includes(r.kind) ? '<span class="chip ok">نعم</span>' : '—'}</td>
    <td>${r.maintenance ? '<span class="chip bad">صيانة</span>' : S.contracts.some(k => k.resourceId === r.id && ['active', 'expiring', 'awaiting'].includes(contractStatus(k))) && !['desk', 'virtual'].includes(r.kind) ? '<span class="chip gold">مؤجّرة</span>' : '<span class="chip ok">متاحة</span>'}</td>
    <td>${ed ? `<button class="btn btn-ghost btn-xs" data-act="space-edit" data-id="${r.id}">${ic('edit')} تعديل</button>` : ''}</td></tr>`)), {pad:false, sub:'الحد الأدنى يمنع موظف المبيعات من إرسال صفقة بسعر أقل', actions:ed ? `<button class="btn btn-gold btn-sm" data-act="space-edit">${ic('plus')} مساحة</button>` : ''})}
  ${panel('خصومات المدة', table(['المدة', 'الخصم'], Object.entries(S.rules.durationDiscounts).map(([m, p]) => `<tr><td>${m} ${+m === 1 ? 'شهر' : 'أشهر'}</td><td class="num">${p}%</td></tr>`)), {pad:false, sub:'تظهر في صفحة المساحات والأسعار بالموقع وفي التجديد — تُعدَّل من قواعد العمل', actions:`<button class="btn btn-ghost btn-sm" data-act="nav" data-k="rules">قواعد العمل</button>`})}`;
};
ACT['branch-add'] = () => { if (!ownerOnly()) return; const n = $('#br-n').value.trim(); if (!n) return; const id = uid('br'); S.branches.push({id, name:n, en:n, city:'مكة المكرمة'}); S.rules.targets.branches[id] = {revenue:0, occupancy:0}; audit('settings', 'فرع جديد: ' + n); rerender(); toast('أُضيف الفرع'); };
ACT['space-edit'] = (el) => {
  if (!guard('pricing', 'edit')) return; const isNew = !el.dataset.id; const r = isNew ? {id:uid('r'), name:{ar:'', en:''}, kind:'office', branch:'main', cap:2, rate:{}, minMonth:0, maintenance:false, art:'office'} : resById(el.dataset.id);
  openModal({size:'wide', title:isNew ? 'مساحة جديدة' : 'تعديل ' + esc(L(r.name, 'ar')), body:`<div class="form"><div class="lang-split">${fld('sp-ar', 'الاسم<span class="tag">عربي</span>', inp('sp-ar', r.name.ar))}${fld('sp-en', 'Name<span class="tag">English</span>', inp('sp-en', r.name.en, 'text', 'dir="ltr"'))}</div>
    <div class="row">${fld('sp-k', 'النوع', `<select class="input" id="sp-k">${options(Object.entries(SPACE_KINDS).map(([k, v]) => [k, v.ar]), r.kind)}</select>`)}${fld('sp-b', 'الفرع', `<select class="input" id="sp-b">${options(S.branches.map(b => [b.id, b.name]), r.branch)}</select>`)}${fld('sp-c', 'السعة', inp('sp-c', r.cap, 'number', 'min="1"'))}</div>
    <div class="row">${fld('sp-h', 'سعر الساعة', inp('sp-h', r.rate.hour ?? '', 'number', 'min="0"'))}${fld('sp-d', 'سعر اليوم', inp('sp-d', r.rate.day ?? '', 'number', 'min="0"'))}${fld('sp-m', 'السعر الشهري', inp('sp-m', r.rate.month ?? '', 'number', 'min="0"'))}${fld('sp-min', 'الحد الأدنى الشهري', inp('sp-min', r.minMonth || '', 'number', 'min="0"'))}</div>
    <label class="check"><input type="checkbox" id="sp-mt" ${r.maintenance ? 'checked' : ''}> تحت الصيانة (لا تُحجز ولا تُباع)</label><button class="btn btn-gold" data-act="space-save" data-id="${r.id}" data-new="${isNew ? 1 : ''}" style="justify-self:start">حفظ</button></div>`});
  UI.spaceDraft = r;
};
ACT['space-save'] = (el) => {
  const r = UI.spaceDraft; const g = (i) => $('#' + i).value.trim(); const num = (i) => g(i) === '' ? undefined : +g(i);
  if (!g('sp-ar')) return toast('أدخل الاسم', true); const mo = num('sp-m'), mn = num('sp-min') || 0; if (mo && mn > mo) return toast('الحد الأدنى أعلى من السعر', true);
  const before = {السعر:r.rate.month || r.rate.hour || '—', الحد_الأدنى:r.minMonth || '—', الصيانة:r.maintenance ? 'نعم' : 'لا'};
  Object.assign(r, {name:{ar:g('sp-ar'), en:g('sp-en') || g('sp-ar')}, kind:g('sp-k'), branch:g('sp-b'), cap:+g('sp-c') || 1, minMonth:mn, maintenance:$('#sp-mt').checked, rate:{}});
  ['hour', 'day', 'month'].forEach((u, i) => { const v = num(['sp-h', 'sp-d', 'sp-m'][i]); if (v) r.rate[u] = v; });
  r.art = {room:'meeting', desk:'open', virtual:'lounge', shared:'booth', office:'office'}[r.kind];
  if (el.dataset.new) S.resources.push(r);
  audit('price', 'مساحة: ' + r.name.ar, el.dataset.new ? null : before, {السعر:r.rate.month || r.rate.hour || '—', الحد_الأدنى:r.minMonth || '—', الصيانة:r.maintenance ? 'نعم' : 'لا'}); closeModal(); rerender(); toast('حُفظت المساحة');
};

/* ================= business rules ================= */
VIEWS.rules = () => {
  const R = S.rules, b = R.booking; const ed = can('settings', 'edit'); const dis = ed ? '' : 'disabled';
  const n = (id, v, l, d, mn = 0, mx = 999, step = 1) => `<div class="setting"><div><b>${l}</b><span>${d}</span></div><input class="input num" type="number" id="${id}" value="${v}" min="${mn}" max="${mx}" step="${step}" style="width:100px" ${dis} aria-label="${l}"></div>`;
  const sel = (id, v, l, d, opts) => `<div class="setting"><div><b>${l}</b><span>${d}</span></div><select class="input" id="${id}" style="width:auto" ${dis} aria-label="${l}">${options(opts, v)}</select></div>`;
  const sw = (id, on, l, d) => `<div class="setting"><div><b>${l}</b><span>${d}</span></div><label class="switchx"><input type="checkbox" id="${id}" ${on ? 'checked' : ''} ${dis} aria-label="${l}"><span></span></label></div>`;
  return `${ed ? '' : lockNote('تعديل قواعد العمل يتطلب صلاحية «تعديل» في الإعدادات.')}<div class="notice">${ic('info')}<div>هذه القرارات تتحكم في سلوك النظام كله: الموقع والبوابة والمبيعات والمحاسبة. كل تغيير يُسجَّل في سجل العمليات.</div></div>
  <div class="cols even">${panel('حجز القاعات', `${n('r-hold', b.holdHours, 'مدة الحجز المعلّق', 'بالساعات — لا يظهر الموعد لعملاء آخرين خلالها', 1, 48)}${n('r-alert', b.alertBefore, 'تنبيه الفريق قبل انتهاء المهلة', 'بالساعات', 0, 12)}
      ${sel('r-confirm', b.confirmBy, 'من يؤكد الحجوزات', 'يصله الإشعار ويظهر له في «مهامي اليوم»', [['sales', 'موظف مبيعات الفرع'], ['bookings', 'موظف الحجوزات'], ['ops', 'الإدارة']])}
      ${n('r-cancel', b.cancelFreeHours, 'الإلغاء المجاني قبل الموعد', 'بالساعات', 0, 168)}${sel('r-noshow', b.noShow, 'عدم الحضور', 'عند عدم الحضور دون إلغاء', [['charge', 'يُحتسب الحجز'], ['free', 'لا يُحتسب (تنبيه فقط)']])}
      ${n('r-minh', b.minH, 'أقل مدة', 'ساعات', 1, 8)}${n('r-maxh', b.maxH, 'أطول مدة', 'ساعات', 1, 12)}${n('r-days', b.daysAhead, 'الحجز مقدمًا حتى', 'يومًا', 1, 90)}${n('r-pend', b.maxPending, 'الحد الأقصى للطلبات المعلّقة', 'لكل منشأة', 1, 10)}
      ${n('r-ws', b.workStart, 'بداية الدوام', 'الساعة', 0, 23)}${n('r-we', b.workEnd, 'نهاية الدوام', 'الساعة', 1, 24)}
      <div class="setting"><div><b>الإجازات الرسمية</b><span>تواريخ لا يُسمح فيها بالحجز (مفصولة بفاصلة)</span></div><input class="input ltr" id="r-hol" value="${esc(b.holidays.join(', '))}" style="width:220px" ${dis} aria-label="الإجازات"></div>
      <div class="setting"><div><b>ما يُحجز أونلاين</b><span>بقية الأنواع بعرض سعر وعقد</span></div><div class="checks">${Object.entries(SPACE_KINDS).map(([k, v]) => `<label class="check"><input type="checkbox" name="r-online" value="${k}" ${b.onlineKinds.includes(k) ? 'checked' : ''} ${dis}> ${v.ar}</label>`).join('')}</div></div>`)}
    ${panel('الساعات المجانية والأسعار', `${Object.entries(R.freeHours).map(([k, v]) => n('r-fh-' + k, v, `ساعات مجانية — ${SPACE_KINDS[k].ar}`, 'شهريًا لكل عقد', 0, 100)).join('')}
      ${Object.entries(R.durationDiscounts).map(([m, p]) => n('r-dd-' + m, p, `خصم ${m} ${+m === 1 ? 'شهر' : 'أشهر'}`, '%', 0, 50, .5)).join('')}
      ${n('r-maxd', R.deals.maxDiscountNoJust, 'أقصى خصم دون تبرير', '% — ما زاد يتطلب تبريرًا ويُميَّز للإدارة', 0, 50)}${n('r-2nd', R.deals.secondApprovalAbove, 'اعتماد ثانٍ (المالك) فوق', 'ر.س قبل الضريبة', 0, 10000000, 1000)}`)}</div>
  <div class="cols even">${panel('العقود والفوترة', `${sw('r-unsigned', R.contracts.allowUnsigned, 'السماح بتفعيل العقد دون نسخة موقعة', 'يُسجَّل في السجل عند الاستخدام')}${n('r-renew', R.contracts.renewalAlertDays, 'تنبيه التجديد قبل النهاية', 'يومًا', 7, 180)}
      ${sel('r-bday', R.billing.day, 'يوم الفوترة', 'متى تُنشأ الفاتورة', [['start', 'بداية كل فترة في العقد'], ['first', 'أول كل شهر ميلادي']])}${n('r-due', R.billing.dueDays, 'مدة الاستحقاق', 'أيام من الإصدار', 0, 60)}
      ${n('r-rem', R.billing.reminders.remind, 'تذكير بعد', 'يوم تأخير', 1, 30)}${n('r-warn', R.billing.reminders.warn, 'إنذار بعد', 'يوم تأخير', 1, 90)}${n('r-susp', R.billing.reminders.suspend, 'إيقاف الخدمة بعد', 'يوم تأخير', 1, 180)}
      ${sel('r-exp', R.billing.exportTo, 'التصدير للمحاسبة', 'صيغة ملف القيود', [['excel', 'Excel'], ['qoyod', 'قيود (لاحقًا)'], ['zoho', 'Zoho Books (لاحقًا)']])}`)}
    ${panel('الأهداف الشهرية', `${S.branches.map(b2 => `${n('r-tr-' + b2.id, S.rules.targets.branches[b2.id]?.revenue || 0, `إيراد ${b2.name}`, 'ر.س شهريًا', 0, 10000000, 500)}${n('r-to-' + b2.id, S.rules.targets.branches[b2.id]?.occupancy || 0, `إشغال ${b2.name}`, '%', 0, 100)}`).join('')}
      ${S.users.filter(u => u.roleId === 'staff' && u.status === 'active').map(u => n('r-ts-' + u.id, S.rules.targets.sales[u.id] || 0, `هدف ${u.name}`, 'قيمة الصفقات المعتمدة شهريًا', 0, 10000000, 1000)).join('')}`)}</div>
  ${ed ? `<div class="toolbar" style="justify-content:flex-end"><button class="btn btn-gold" data-act="rules-save">${ic('check')} حفظ قواعد العمل</button></div>` : ''}`;
};
ACT['rules-save'] = () => {
  if (!guard('settings', 'edit')) return; const R = S.rules, b = R.booking; const v = (id) => +$('#' + id).value; const before = JSON.stringify(R);
  if (v('r-we') <= v('r-ws')) return toast('نهاية الدوام قبل بدايته', true); if (v('r-maxh') < v('r-minh')) return toast('أطول مدة أقل من أقصرها', true);
  if (!(v('r-rem') < v('r-warn') && v('r-warn') < v('r-susp'))) return toast('ترتيب سياسة التأخير: تذكير ثم إنذار ثم إيقاف', true);
  Object.assign(b, {holdHours:v('r-hold'), alertBefore:v('r-alert'), confirmBy:$('#r-confirm').value, cancelFreeHours:v('r-cancel'), noShow:$('#r-noshow').value, minH:v('r-minh'), maxH:v('r-maxh'), daysAhead:v('r-days'), maxPending:v('r-pend'), workStart:v('r-ws'), workEnd:v('r-we'),
    holidays:$('#r-hol').value.split(/[,،\s]+/).filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x)), onlineKinds:$$('[name="r-online"]:checked').map(i => i.value)});
  Object.keys(R.freeHours).forEach(k => R.freeHours[k] = v('r-fh-' + k)); Object.keys(R.durationDiscounts).forEach(m => R.durationDiscounts[m] = v('r-dd-' + m));
  R.deals = {maxDiscountNoJust:v('r-maxd'), secondApprovalAbove:v('r-2nd')}; R.contracts = {allowUnsigned:$('#r-unsigned').checked, renewalAlertDays:v('r-renew')};
  R.billing = {day:$('#r-bday').value, dueDays:v('r-due'), reminders:{remind:v('r-rem'), warn:v('r-warn'), suspend:v('r-susp')}, exportTo:$('#r-exp').value};
  S.branches.forEach(b2 => { R.targets.branches[b2.id] = {revenue:v('r-tr-' + b2.id), occupancy:v('r-to-' + b2.id)}; }); S.users.filter(u => u.roleId === 'staff' && u.status === 'active').forEach(u => R.targets.sales[u.id] = v('r-ts-' + u.id));
  const a = JSON.parse(before); const ch = []; const walk = (x, y, p = '') => Object.keys(y).forEach(k => { if (typeof y[k] === 'object' && !Array.isArray(y[k]) && y[k]) walk(x?.[k] || {}, y[k], p + k + '.'); else if (JSON.stringify(x?.[k]) !== JSON.stringify(y[k])) ch.push([p + k, x?.[k], y[k]]); }); walk(a, R);
  audit('rules', 'قواعد العمل', Object.fromEntries(ch.slice(0, 8).map(([k, x]) => [k, JSON.stringify(x)])), Object.fromEntries(ch.slice(0, 8).map(([k, , y]) => [k, JSON.stringify(y)]))); rerender(); toast(ch.length ? `حُفظ ${ch.length} تغيير وطُبّق على النظام` : 'لا تغييرات');
};

/* ================= staff invitations ================= */
ACT['user-invite'] = () => {
  if (!guard('users', 'add')) return;
  openModal({title:'دعوة موظف', sub:`يصل الموظف رابط صالح ${S.security.inviteHours} ساعة لتعيين كلمة مروره وتفعيل التحقق بخطوتين`, body:`<div class="form"><div class="row">${fld('iv-n', 'الاسم', inp('iv-n'))}${fld('iv-e', 'البريد', inp('iv-e', '', 'email', 'dir="ltr"'))}</div>
    <div class="row">${fld('iv-r', 'الدور', `<select class="input" id="iv-r">${options(S.roles.filter(r => r.id !== 'owner' && (isOwner() || r.id !== 'ops')).map(r => [r.id, r.name]), 'staff')}</select>`)}${fld('iv-b', 'الفرع', `<select class="input" id="iv-b">${options(S.branches.map(b => [b.id, b.name]))}</select>`)}</div>
    <p class="muted" style="font-size:13px">التحقق بخطوتين إلزامي للإدارة والمحاسبة. سياسة كلمة المرور: ${S.security.minPw} أحرف على الأقل مع حرف كبير ورقم ورمز.</p><button class="btn btn-gold" id="iv-go" style="justify-self:start">${ic('mail')} إرسال الدعوة</button></div>`,
    onMount:(m) => m.querySelector('#iv-go').onclick = () => { const g = (i) => m.querySelector('#' + i).value.trim(); const em = g('iv-e').toLowerCase();
      if (g('iv-n').length < 3 || !/^\S+@\S+\.\S+$/.test(em)) return toast('أدخل الاسم وبريدًا صحيحًا', true); if (S.users.some(u => u.email === em) || S.customers.some(c => c.email === em)) return toast('البريد مستخدم لحساب آخر', true);
      const u = {id:uid('u'), name:g('iv-n'), email:em, roleId:g('iv-r'), status:'invited', inviteExpires:new Date(Date.now() + S.security.inviteHours * 36e5).toISOString(), invitedBy:me().id, twoFA:false, twoFAMethod:'app', recovery:[], branch:g('iv-b'), overrides:[], lastLogin:null, sessions:[], pwHistory:[], lang:'ar'};
      S.users.push(u); (S.outbox = S.outbox || []).unshift({at:new Date().toISOString(), to:em, subject:fillTpl('staff_invite', {by:me().name, role:roleById(u.roleId).name}), channel:'email'});
      audit('invite', u.name, null, {الدور:roleById(u.roleId).name, الفرع:branchName(u.branch, 'ar'), الصلاحية:S.security.inviteHours + ' ساعة'}); closeModal(); rerender(); toast('أُرسلت الدعوة — يمكن تجربتها من صفحة «تفعيل حساب موظف»'); }});
};
ACT['invite-resend'] = (el) => { const u = userById(el.dataset.id); u.inviteExpires = new Date(Date.now() + S.security.inviteHours * 36e5).toISOString(); u.invitedBy = me().id; (S.outbox = S.outbox || []).unshift({at:new Date().toISOString(), to:u.email, subject:fillTpl('staff_invite', {by:me().name, role:roleById(u.roleId).name}), channel:'email'}); audit('invite', u.name, null, {العملية:'إعادة إرسال الدعوة'}); rerender(); openUser(u); toast('أُعيد إرسال الدعوة برابط جديد'); };
ACT['tfa-reset'] = (el) => { const u = userById(el.dataset.id); confirmBox(`إعادة ضبط التحقق بخطوتين لـ ${esc(u.name)}؟ يُطلب منه إعداده من جديد عند الدخول التالي، وتُلغى رموز الاسترداد القديمة.`, () => { u.recovery = recoveryCodes(); u.sessions = []; audit('twofa', u.name, null, {العملية:'إعادة ضبط', الجلسات:'أُنهيت'}); rerender(); openUser(u); toast('أُعيد الضبط وأُنهيت جلساته'); }, 'إعادة الضبط', false); };

/* ================= reports ================= */
VIEWS.reports = () => {
  const fin = can('reports', 'finance'); const M = metrics();
  const rows = S.history.map(h => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + h.m); return [d.toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', {month:'long', year:'numeric'}), h.clients, h.bookings, h.leads, h.won, pct(h.won, h.leads) + '%', h.revenue]; });
  rows.push(['الشهر الحالي (حتى الآن)', M.newClients, M.bookingsMonth, S.clients.filter(c => monthKey(c.createdAt) === thisMonth()).length, S.deals.filter(d => d.status === 'approved' && monthKey(approvedAt(d)) === thisMonth()).length, M.conv + '%', M.revenue]);
  const q = quartersBack(1)[0]; const V = vatReport(q);
  return `<div class="toolbar" style="justify-content:flex-end"><button class="btn btn-ghost btn-sm" data-act="print" ${can('reports', 'print') ? '' : 'disabled'}>${ic('print')} طباعة</button><button class="btn btn-gold btn-sm" data-act="rep-export" ${can('reports', 'export') ? '' : 'disabled'}>${ic('download')} تصدير الأداء</button>
    <button class="btn btn-ghost btn-sm" data-act="rep-sales" ${can('reports', 'export') ? '' : 'disabled'}>${ic('download')} المبيعات والأهداف</button><button class="btn btn-ghost btn-sm" data-act="rep-sources" ${can('reports', 'export') ? '' : 'disabled'}>${ic('download')} المصادر والحملات</button>${fin ? `<button class="btn btn-ghost btn-sm" data-act="vat-export" data-q="${q}">${ic('download')} ضريبة ${q}</button>` : ''}</div>
  <div class="tiles">${tile('تحويل العملاء المحتملين', M.conv + '%', {icon:'chart'})}${tile('إشغال المكاتب', M.occ.office + '%', {icon:'office'})}${tile('الإيراد الشهري (ر.س)', money(M.revenue), {icon:'coins', locked:!fin})}${tile(`صافي ضريبة ${q}`, money(V.net), {icon:'stamp', locked:!fin})}</div>
  <div class="cols even">${panel('العملاء الجدد شهريًا', monthChart('clients', 'العملاء الجدد', v => v))}${panel(fin ? 'الإيراد الشهري (ر.س)' : 'الحجوزات الشهرية', fin ? monthChart('revenue', 'الإيراد') : monthChart('bookings', 'الحجوزات', v => v))}</div>
  ${panel('مقارنة النتائج بين الشهور', table(['الشهر', 'عملاء جدد', 'حجوزات', 'استفسارات', 'تعاقدات', 'التحويل', 'الإيراد (ر.س)'], rows.map(r => `<tr>${r.map((c, i) => `<td class="${i ? 'num' : ''}">${i === 6 ? (fin ? money(c) : '•••') : esc(c)}</td>`).join('')}</tr>`)), {pad:false})}
  <div class="cols even">${panel('المبيعات مقابل الأهداف', table(['الموظف', 'المعتمد', 'الهدف', 'الإنجاز'], M.sales.map(s => `<tr><td>${whoTag(s.u.id)}</td><td class="num">${money(s.wonV)}</td><td class="num">${money(s.target)}</td><td style="min-width:120px">${meter(s.wonV, s.target)}</td></tr>`)), {pad:false})}
    ${panel('المصادر والحملات', table(['المصدر', 'العملاء', 'تعاقدوا', 'النجاح'], M.bySource.map(([k, n, w, p]) => `<tr><td>${SOURCES[k].ar}</td><td class="num">${n}</td><td class="num">${w}</td><td class="num">${p}%</td></tr>`)), {pad:false})}</div>
  ${panel('أداء فريق العمل', table(['الموظف', 'طلبات مسندة', 'منجزة', 'نسبة الإنجاز', 'عملاء يتابعهم'], M.staff.map(s => `<tr><td>${whoTag(s.u.id)}</td><td class="num">${s.total}</td><td class="num">${s.done}</td><td class="num">${pct(s.done, s.total)}%</td><td class="num">${s.follow}</td></tr>`)), {pad:false})}`;
};
ACT['rep-export'] = () => { const fin = can('reports', 'finance'); exportDialog('تقرير الأداء الشهري', [['الشهر', 'عملاء جدد', 'حجوزات', 'استفسارات', 'تعاقدات', 'الإيراد'], ...S.history.map(h => [h.m, h.clients, h.bookings, h.leads, h.won, fin ? h.revenue : '—'])], 'reports'); };
ACT['rep-sales'] = () => { const M = metrics(); exportDialog('المبيعات مقابل الأهداف', [['الموظف', 'الفرع', 'عملاء محتملون', 'بلا تواصل +24س', 'تعاقدات', 'المعتمد هذا الشهر', 'الهدف', 'الإنجاز %', 'قيد الإعداد'], ...M.sales.map(s => [s.u.name, branchName(s.u.branch, 'ar'), s.leads, s.late, s.won, s.wonV, s.target, pct(s.wonV, s.target), s.pipe])], 'reports'); };
ACT['rep-sources'] = () => { const M = metrics(); exportDialog('المصادر والحملات', [['المصدر', 'العملاء', 'تعاقدوا', 'نسبة النجاح'], ...M.bySource.map(([k, n, w, p]) => [SOURCES[k].ar, n, w, p + '%'])], 'reports'); };
