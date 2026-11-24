/* وصل دائم — printable documents shared by the portal and the dashboard: tax invoice / credit note (ZATCA QR), contract, statement */
'use strict';

function printDoc() { document.body.classList.add('print-doc'); tryPrint(); setTimeout(() => document.body.classList.remove('print-doc'), 800); }
ACT['print-doc'] = () => printDoc();
const bi = (ar, en) => `<span class="bi"><b>${esc(ar)}</b><i>${esc(en)}</i></span>`;
function docHead(titleAr, titleEn, no, chip = '') {
  const st = S.settings;
  return `<header class="doc-head"><div class="doc-brand"><img src="assets/logo-full.webp" alt="" width="70" height="68"><div><b>${esc(L(st.legalName, 'ar'))}</b><span>${esc(L(st.legalName, 'en'))}</span>
    <span class="ltr">VAT ${esc(st.vatNumber)} · CR ${esc(st.crNumber)}</span><span>${esc(L(st.address, 'ar'))}</span></div></div>
    <div class="doc-title">${bi(titleAr, titleEn)}<span class="doc-no ltr">${esc(no)}</span>${chip}</div></header>`;
}
function invoiceDocHTML(inv) {
  const co = companyById(inv.companyId); const k = inv.contractId ? S.contracts.find(x => x.id === inv.contractId) : null;
  const credit = inv.kind === 'credit'; const draft = inv.status === 'draft'; const st = invStatus(inv);
  const qr = draft ? `<div class="qr-ph">${ic('stamp')}<span>يُنشأ رمز QR عند الإصدار</span></div>` : `<div class="qr">${qrSVG(zatcaTLV(inv), 2)}</div>`;
  return `<div class="doc ${draft ? 'is-draft' : ''}" dir="rtl">${draft ? '<div class="doc-wm">مسودة — DRAFT</div>' : ''}
    ${docHead(credit ? 'إشعار دائن' : 'فاتورة ضريبية', credit ? 'Credit note' : 'Tax invoice', draft ? 'مسودة' : inv.id, `<span class="chip ${INV_STATUS[st].cls}">${esc(INV_STATUS[st].ar)}</span>`)}
    <div class="doc-grid">
      <div class="doc-box"><h4>${bi('العميل', 'Buyer')}</h4><b>${esc(co?.nameAr || '')}</b><span>${esc(co?.nameEn || '')}</span><span class="ltr">VAT ${esc(co?.vat || '—')} · CR ${esc(co?.cr || '')}</span><span>${esc(co?.city || '')}</span></div>
      <div class="doc-box"><h4>${bi('بيانات الفاتورة', 'Invoice details')}</h4><dl>
        <dt>${bi('تاريخ الإصدار', 'Issue date')}</dt><dd>${inv.issueDate ? esc(dualDate(inv.issueDate, 'ar')) : '—'}</dd>
        ${credit ? `<dt>${bi('الفاتورة الأصلية', 'Original invoice')}</dt><dd class="ltr">${esc(inv.refInvoice)}</dd><dt>${bi('السبب', 'Reason')}</dt><dd>${esc(inv.note)}</dd>`
          : `<dt>${bi('تاريخ الاستحقاق', 'Due date')}</dt><dd>${inv.dueDate ? esc(dualDate(inv.dueDate, 'ar')) : '—'}</dd>`}
        ${inv.period ? `<dt>${bi('فترة التوريد', 'Supply period')}</dt><dd>${esc(fmtDate(inv.period.from, false, 'ar'))} — ${esc(fmtDate(inv.period.to, false, 'ar'))}</dd>` : ''}
        ${k ? `<dt>${bi('العقد', 'Contract')}</dt><dd class="ltr">${esc(k.id)}</dd>` : ''}</dl></div></div>
    <table class="doc-tbl"><thead><tr><th>${bi('الوصف', 'Description')}</th><th>${bi('الكمية', 'Qty')}</th><th>${bi('سعر الوحدة', 'Unit price')}</th><th>${bi('المبلغ قبل الضريبة', 'Net')}</th><th>${bi('الضريبة 15%', 'VAT 15%')}</th><th>${bi('الإجمالي', 'Total')}</th></tr></thead>
      <tbody>${inv.lines.map(l => { const net = r2(l.qty * l.unit); return `<tr><td>${esc(L(l.desc, 'ar'))}<span class="sub ltr">${esc(L(l.desc, 'en'))}</span></td><td class="num">${l.qty}</td><td class="num">${sar(l.unit)}</td><td class="num">${sar(net)}</td><td class="num">${l.noVat ? '—' : sar(lineVat(l))}</td><td class="num">${sar(net + lineVat(l))}</td></tr>`; }).join('')}</tbody></table>
    <div class="doc-foot"><div class="doc-qr">${qr}${draft ? '' : `<span class="ltr mono">UUID ${esc(inv.uuid.slice(0, 18))}…</span><span class="ltr mono">Hash ${esc(inv.hash.slice(0, 16))}…</span>`}</div>
      <dl class="doc-sum"><dt>${bi('الإجمالي قبل الضريبة', 'Total excl. VAT')}</dt><dd class="num">${sar(inv.net)} ر.س</dd><dt>${bi('ضريبة القيمة المضافة 15%', 'VAT 15%')}</dt><dd class="num">${sar(inv.vat)} ر.س</dd>
        <dt class="tot">${bi(credit ? 'إجمالي الإشعار' : 'الإجمالي المستحق', credit ? 'Credit total' : 'Total due')}</dt><dd class="num tot">${sar(inv.total)} ر.س</dd>
        ${!credit && !draft && (inv.paid || inv.credited) ? `<dt>${bi('المدفوع والمخصوم', 'Paid & credited')}</dt><dd class="num">${sar(inv.paid + inv.credited)} ر.س</dd><dt>${bi('المتبقي', 'Balance')}</dt><dd class="num gold">${sar(invOpen(inv))} ر.س</dd>` : ''}</dl></div>
    ${credit ? '' : `<div class="doc-bank">${ic('coins')}<div><b>${bi('الدفع بالتحويل البنكي', 'Pay by bank transfer')}</b><span>${esc(L(S.settings.bank.name, 'ar'))} — <span class="ltr">${esc(S.settings.bank.iban)}</span></span><span>اذكر رقم الفاتورة <b class="ltr">${esc(draft ? '—' : inv.id)}</b> في وصف التحويل · Quote the invoice number in the transfer reference</span></div></div>`}
    <p class="doc-note">${draft ? 'مسودة للمراجعة الداخلية — ليست فاتورة ضريبية حتى تُصدر.' : 'فاتورة ضريبية صادرة إلكترونيًا ولا تُعدَّل بعد الإصدار؛ أي تصحيح يتم بإشعار دائن. · This e-invoice cannot be edited after issue; corrections are made by credit note.'}</p></div>`;
}
function openInvoice(id, {admin = false} = {}) {
  const inv = S.invoices.find(x => x.id === id); if (!inv) return;
  const acts = admin ? (typeof invAdminActions === 'function' ? invAdminActions(inv) : '') : (inv.kind !== 'credit' && invOpen(inv) > 0 && custCan('finance') ? `<button class="btn btn-gold btn-sm" data-act="p-receipt" data-id="${inv.id}">${ic('upload')} ${esc(tt('رفع إيصال التحويل', 'Upload transfer receipt'))}</button>` : '');
  openModal({size:'xl', title:`${esc(inv.kind === 'credit' ? tt('إشعار دائن', 'Credit note') : tt('فاتورة ضريبية', 'Tax invoice'))} <span class="ltr">${esc(inv.status === 'draft' ? '' : inv.id)}</span>`,
    body:`<div class="toolbar no-print" style="margin-bottom:14px">${acts}<button class="btn btn-ghost btn-sm" data-act="print-doc">${ic('print')} ${esc(tt('طباعة / حفظ PDF', 'Print / save PDF'))}</button></div>${invoiceDocHTML(inv)}`});
}
ACT['open-invoice'] = (el) => openInvoice(el.dataset.id, {admin:UI.view === 'admin'});

function contractDocHTML(k) {
  const co = companyById(k.companyId); const r = resById(k.resourceId); const sch = contractSchedule(k);
  const cs = contractStatus(k);
  return `<div class="doc" dir="rtl">${k.status === 'awaiting' ? '<div class="doc-wm">بانتظار التوقيع</div>' : ''}
    ${docHead('عقد اشتراك مساحة عمل', 'Workspace membership agreement', k.id, `<span class="chip ${CONTRACT_STATUS[cs].cls}">${esc(CONTRACT_STATUS[cs].ar)}</span>`)}
    <div class="doc-grid"><div class="doc-box"><h4>${bi('الطرف الأول', 'First party')}</h4><b>${esc(L(S.settings.legalName, 'ar'))}</b><span>${esc(L(S.settings.legalName, 'en'))}</span></div>
      <div class="doc-box"><h4>${bi('الطرف الثاني', 'Second party')}</h4><b>${esc(co?.nameAr)}</b><span>${esc(co?.nameEn || '')}</span><span class="ltr">CR ${esc(co?.cr)} · VAT ${esc(co?.vat || '—')}</span></div></div>
    <table class="doc-tbl kv"><tbody>
      <tr><th>${bi('المساحة', 'Space')}</th><td>${esc(L(r?.name, 'ar'))} — ${esc(spaceKind(r, 'ar'))} · ${esc(branchName(r?.branch, 'ar'))}<span class="sub ltr">${esc(L(r?.name, 'en'))}</span></td></tr>
      <tr><th>${bi('المدة', 'Term')}</th><td>${k.months} ${k.months > 2 && k.months < 11 ? 'أشهر' : 'شهرًا'} · ${esc(dualDate(k.start, 'ar'))} ← ${esc(dualDate(k.end, 'ar'))}</td></tr>
      <tr><th>${bi('القيمة الشهرية', 'Monthly fee')}</th><td class="num">${sar(k.monthly)} ر.س + ضريبة القيمة المضافة${k.discountPct ? ` <span class="muted">(بعد خصم ${k.discountPct}% من ${sar(k.listMonthly)})</span>` : ''}</td></tr>
      <tr><th>${bi('الفوترة', 'Billing')}</th><td>${k.billing === 'quarterly' ? 'ربع سنوية مقدمًا' : 'شهرية مقدمًا'} — تستحق خلال ${S.rules.billing.dueDays} أيام من الإصدار</td></tr>
      <tr><th>${bi('التأمين', 'Deposit')}</th><td class="num">${sar(k.deposit)} ر.س — يُسترد عند الانتهاء بعد تسوية المستحقات</td></tr>
      <tr><th>${bi('ساعات القاعات', 'Meeting-room hours')}</th><td>${k.freeHours} ساعات مجانية شهريًا، وما زاد يُفوتر بسعر القاعة</td></tr>
      ${k.terms ? `<tr><th>${bi('شروط إضافية', 'Special terms')}</th><td>${esc(k.terms)}</td></tr>` : ''}</tbody></table>
    <h4 class="doc-h">${bi('جدول الدفعات', 'Payment schedule')}</h4>
    <table class="doc-tbl"><thead><tr><th>#</th><th>${bi('الفترة', 'Period')}</th><th>${bi('قبل الضريبة', 'Net')}</th><th>${bi('الضريبة', 'VAT')}</th><th>${bi('الإجمالي', 'Total')}</th></tr></thead>
      <tbody>${sch.map((p, i) => `<tr><td class="num">${i + 1}</td><td>${esc(fmtDate(p.from, false, 'ar'))} — ${esc(fmtDate(p.to, false, 'ar'))}</td><td class="num">${sar(p.net)}</td><td class="num">${sar(vatOf(p.net))}</td><td class="num">${sar(p.net + vatOf(p.net))}</td></tr>`).join('')}</tbody></table>
    <ol class="doc-terms"><li>يلتزم الطرف الثاني بتعليمات المكان واستخدام المساحة للغرض المتفق عليه.</li><li>يُرسل تنبيه التجديد قبل نهاية العقد بـ ${S.rules.contracts.renewalAlertDays} يومًا، والتجديد بطلب من البوابة.</li><li>الإنهاء المبكر بإشعار كتابي قبل 30 يومًا، ويُحتسب إيجار شهر إضافي.</li><li>التأخر في السداد أكثر من ${S.rules.billing.reminders.suspend} يومًا يجيز إيقاف الخدمة.</li></ol>
    <div class="doc-sign"><div><span>${bi('عن الطرف الأول', 'For the first party')}</span><i></i></div><div><span>${bi('عن الطرف الثاني', 'For the second party')}</span><i>${k.signedFile ? `<em>${ic('check')} موقّع — ${esc(k.signedFile)}</em>` : ''}</i></div></div></div>`;
}
function openContractDoc(id, extra = '') {
  const k = S.contracts.find(x => x.id === id); if (!k) return;
  openModal({size:'xl', title:`${esc(tt('العقد', 'Contract'))} <span class="ltr">${esc(k.id)}</span>`, body:`<div class="toolbar no-print" style="margin-bottom:14px">${extra}<button class="btn btn-ghost btn-sm" data-act="print-doc">${ic('print')} ${esc(tt('طباعة / حفظ PDF', 'Print / save PDF'))}</button></div>${contractDocHTML(k)}`});
}
ACT['open-contract-doc'] = (el) => openContractDoc(el.dataset.id);

function statementHTML(cid, year) {
  const co = companyById(cid); const inv = companyInvoices(cid).filter(i => i.status !== 'draft' && i.issueDate.slice(0, 4) === String(year)).sort((a, b) => a.issueDate.localeCompare(b.issueDate));
  const pays = S.payments.filter(p => p.companyId === cid && p.status === 'approved' && p.date.slice(0, 4) === String(year));
  const rows = [...inv.map(i => ({d:i.issueDate, t:i.kind === 'credit' ? `إشعار دائن ${i.id}` : `فاتورة ${i.id}`, dr:i.kind === 'credit' ? 0 : i.total, cr:i.kind === 'credit' ? i.total : 0})),
    ...pays.map(p => ({d:p.date, t:`دفعة — ${p.ref}`, dr:0, cr:p.amount}))].sort((a, b) => a.d.localeCompare(b.d));
  let bal = 0;
  return `<div class="doc" dir="rtl">${docHead('كشف حساب', 'Statement of account', String(year))}
    <div class="doc-box" style="margin-bottom:14px"><b>${esc(co.nameAr)}</b><span>${esc(co.nameEn)}</span><span class="ltr">CR ${esc(co.cr)} · VAT ${esc(co.vat || '—')}</span></div>
    <table class="doc-tbl"><thead><tr><th>${bi('التاريخ', 'Date')}</th><th>${bi('البيان', 'Description')}</th><th>${bi('مدين', 'Debit')}</th><th>${bi('دائن', 'Credit')}</th><th>${bi('الرصيد', 'Balance')}</th></tr></thead>
      <tbody>${rows.map(x => { bal = r2(bal + x.dr - x.cr); return `<tr><td>${esc(fmtDate(x.d, false, 'ar'))}</td><td>${esc(x.t)}</td><td class="num">${x.dr ? sar(x.dr) : ''}</td><td class="num">${x.cr ? sar(x.cr) : ''}</td><td class="num">${sar(bal)}</td></tr>`; }).join('') || '<tr><td colspan="5" class="empty">لا توجد حركات</td></tr>'}</tbody></table>
    <dl class="doc-sum" style="margin-top:12px"><dt class="tot">${bi('الرصيد المستحق', 'Balance due')}</dt><dd class="num tot">${sar(companyBalance(cid))} ر.س</dd></dl></div>`;
}
function openStatement(cid, year = new Date().getFullYear()) {
  openModal({size:'xl', title:esc(tt('كشف الحساب السنوي', 'Annual statement')), body:`<div class="toolbar no-print" style="margin-bottom:14px"><div class="seg">${[year - 1, year].map(y => `<button class="${y === year ? 'on' : ''}" data-act="stmt-year" data-y="${y}" data-c="${cid}">${y}</button>`).join('')}</div><button class="btn btn-ghost btn-sm" data-act="print-doc">${ic('print')} ${esc(tt('طباعة / حفظ PDF', 'Print / save PDF'))}</button></div>${statementHTML(cid, year)}`});
}
ACT['stmt-year'] = (el) => openStatement(el.dataset.c, +el.dataset.y);
