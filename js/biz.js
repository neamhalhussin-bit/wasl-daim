/* وصل دائم — business layer: companies, spaces, deals, contracts, invoices (ZATCA), payments, room booking rules.
   Loaded after data.js and core.js. All amounts are SAR; VAT 15%. */
'use strict';

const VAT_RATE = 0.15;
const r2 = (n) => Math.round((+n || 0) * 100) / 100;
const vatOf = (net) => r2(net * VAT_RATE);
const sar = (n) => r2(n).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
const pad6 = (n) => String(n).padStart(6, '0');
function nextNo(prefix) { S.seqs[prefix] = (S.seqs[prefix] || 0) + 1; return `${prefix}-${new Date().getFullYear()}-${pad6(S.seqs[prefix])}`; }
const dstr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const toDate = (s) => new Date(String(s).length === 10 ? s + 'T12:00:00' : s);
function addDays(s, n) { const d = toDate(s); d.setDate(d.getDate() + n); return dstr(d); }
function addMonths(s, n) { const d = toDate(s); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return dstr(d); }
function fmtHijri(iso, lang) {
  try { return toDate(iso).toLocaleDateString(((lang || curLang()) === 'en' ? 'en' : 'ar-SA') + '-u-ca-islamic-umalqura-nu-latn', {day:'numeric', month:'long', year:'numeric'}); }
  catch (e) { return ''; }
}
const dualDate = (iso, lang) => iso ? `${fmtDate(iso, false, lang)} · ${fmtHijri(iso, lang)}` : '—';

/* ---------- reference data ---------- */
const COMPANY_STATUS = {
  pending:{ar:'قيد التحقق', en:'Pending verification', cls:'warn'}, verified:{ar:'موثّقة', en:'Verified', cls:'ok'},
  suspended:{ar:'معلّقة', en:'Suspended', cls:'bad'}, rejected:{ar:'مرفوضة', en:'Rejected', cls:'bad'}
};
const DOC_TYPES = {
  cr:{ar:'السجل التجاري', en:'Commercial registration', req:true, exp:true},
  vat:{ar:'شهادة ضريبة القيمة المضافة', en:'VAT certificate', req:false, exp:false},
  id:{ar:'هوية المفوّض', en:'Authorized signatory ID', req:true, exp:true},
  articles:{ar:'عقد التأسيس', en:'Articles of association', req:true, exp:false},
  address:{ar:'العنوان الوطني', en:'National address', req:false, exp:true}
};
const DOC_STATUS = {approved:{ar:'معتمد', en:'Approved', cls:'ok'}, review:{ar:'قيد المراجعة', en:'Under review', cls:'warn'}, rejected:{ar:'مرفوض', en:'Rejected', cls:'bad'}, missing:{ar:'لم يُرفع', en:'Not uploaded', cls:'plain'}};
const COMPANY_ROLES = {
  admin:{ar:'المسؤول الرئيسي', en:'Main admin', can:['book', 'finance', 'requests', 'manage', 'view']},
  booking:{ar:'حجز الغرف', en:'Room booking', can:['book', 'requests', 'view']},
  finance:{ar:'مالي', en:'Finance', can:['finance', 'view']},
  viewer:{ar:'عرض فقط', en:'View only', can:['view']}
};
const BOOKING_STATUS = {
  pending:{ar:'بانتظار التأكيد', en:'Awaiting confirmation', cls:'warn'}, confirmed:{ar:'مؤكد', en:'Confirmed', cls:'ok'},
  rejected:{ar:'مرفوض', en:'Declined', cls:'bad'}, expired:{ar:'منتهي', en:'Expired', cls:'plain'},
  cancelled:{ar:'ملغى', en:'Cancelled', cls:'plain'}, completed:{ar:'مكتمل', en:'Completed', cls:'info'}
};
const CONTRACT_STATUS = {
  awaiting:{ar:'بانتظار التوقيع', en:'Awaiting signature', cls:'warn'}, active:{ar:'نشط', en:'Active', cls:'ok'},
  expiring:{ar:'ينتهي قريبًا', en:'Ending soon', cls:'warn'}, ended:{ar:'منتهي', en:'Ended', cls:'plain'}, terminated:{ar:'منهى مبكرًا', en:'Terminated', cls:'bad'}
};
const INV_STATUS = {
  draft:{ar:'مسودة', en:'Draft', cls:'plain'}, issued:{ar:'مستحقة', en:'Due', cls:'info'}, partial:{ar:'مدفوعة جزئيًا', en:'Partly paid', cls:'warn'},
  overdue:{ar:'متأخرة', en:'Overdue', cls:'bad'}, paid:{ar:'مدفوعة', en:'Paid', cls:'ok'}, credit:{ar:'إشعار دائن', en:'Credit note', cls:'gold'}, credited:{ar:'ملغاة بإشعار دائن', en:'Credited', cls:'plain'}
};
const DEAL_STATUS = {
  draft:{ar:'مسودة', cls:'plain'}, pending:{ar:'بانتظار الاعتماد', cls:'warn'}, returned:{ar:'أُعيدت للتعديل', cls:'info'},
  approved:{ar:'معتمدة', cls:'ok'}, rejected:{ar:'مرفوضة', cls:'bad'}
};
const PAY_STATUS = {review:{ar:'قيد المراجعة', en:'Under review', cls:'warn'}, approved:{ar:'معتمد', en:'Approved', cls:'ok'}, rejected:{ar:'مرفوض', en:'Rejected', cls:'bad'}};
const PORTAL_REQ = ['contract_change', 'early_term', 'quote', 'extra_service', 'maintenance'];

/* ---------- lookups ---------- */
const companyById = (id) => (S.companies || []).find(c => c.id === id);
const companyName = (c, lang) => !c ? '—' : ((lang || curLang()) === 'en' ? (c.nameEn || c.nameAr) : c.nameAr);
const custById = (id) => S.customers.find(c => c.id === id);
const portalUser = () => S.portal ? custById(S.portal) : null;
const portalCompany = () => { const u = portalUser(); return u ? companyById(u.companyId) : null; };
const custCan = (what, u = portalUser()) => !!u && (COMPANY_ROLES[u.companyRole]?.can || []).includes(what);
const branchById = (id) => S.branches.find(b => b.id === id);
const branchName = (id, lang) => { const b = branchById(id); return b ? ((lang || curLang()) === 'en' ? (b.en || b.name) : b.name) : '—'; };
const spaceKind = (r, lang) => SPACE_KINDS[r.kind] ? L(SPACE_KINDS[r.kind], lang) : '';

/* ---------- pricing ---------- */
const durDisc = (months) => { const t = S.rules.durationDiscounts; const keys = Object.keys(t).map(Number).sort((a, b) => a - b); let p = 0; keys.forEach(k => { if (months >= k) p = t[k]; }); return p; };
function monthlyAfterDuration(listMonthly, months) { return r2(listMonthly * (1 - durDisc(months) / 100)); }

/* ---------- contracts & schedule ---------- */
function contractStatus(k) {
  if (k.status === 'awaiting' || k.status === 'terminated') return k.status;
  if (k.end < today()) return 'ended';
  if (daysBetween(today(), k.end) <= S.rules.contracts.renewalAlertDays) return 'expiring';
  return 'active';
}
function contractSchedule(k) {
  const step = k.billing === 'quarterly' ? 3 : 1; const out = [];
  for (let i = 0; i < k.months; i += step) {
    const from = addMonths(k.start, i), to = addDays(addMonths(k.start, Math.min(k.months, i + step)), -1);
    const months = Math.min(step, k.months - i);
    out.push({from, to, due:from, net:r2(k.monthly * months * (k.qty || 1)), months});
  }
  return out;
}

/* ---------- invoices (ZATCA phase-2 style fields; stamp simulated) ---------- */
const lineVat = (l) => l.noVat ? 0 : vatOf(l.qty * l.unit);
function invTotals(lines) { const net = r2(lines.reduce((n, l) => n + l.qty * l.unit, 0)); const vat = r2(lines.reduce((n, l) => n + lineVat(l), 0)); return {net, vat, total:r2(net + vat)}; }
function newInvoice({companyId, contractId = null, lines, period = null, kind = 'invoice', refInvoice = null, note = ''}) {
  const t = invTotals(lines);
  return Object.assign({id:'DRAFT-' + uid(''), kind, companyId, contractId, period, lines, ...t, paid:0, credited:0, status:'draft',
    issueDate:null, dueDate:null, uuid:null, hash:null, refInvoice, note, createdAt:new Date().toISOString(), sentAt:null}, {});
}
function pseudoHash(str) { let h1 = 0x811c9dc5, h2 = 0x1b873593; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 ^ c, 2654435761); } return ((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')).repeat(4); }
function issueInvoice(inv, when = new Date()) {
  const prefix = inv.kind === 'credit' ? 'CN' : 'INV';
  inv.id = nextNo(prefix); inv.status = 'issued'; inv.issueDate = dstr(when); inv.issuedAt = when.toISOString();
  inv.dueDate = inv.kind === 'credit' ? inv.issueDate : addDays(inv.issueDate, S.rules.billing.dueDays);
  inv.uuid = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (Math.random() * 16) >> c / 4).toString(16));
  const prev = S.invoices.filter(x => x.hash).slice(-1)[0];
  inv.hash = pseudoHash(inv.id + inv.total + inv.issuedAt + (prev ? prev.hash : '0'));
  return inv;
}
function invStatus(inv) {
  if (inv.status === 'draft') return 'draft';
  if (inv.kind === 'credit') return 'credit';
  const open = r2(inv.total - inv.paid - inv.credited);
  if (inv.credited >= inv.total - 0.01) return 'credited';
  if (open <= 0.01) return 'paid';
  if (inv.dueDate < today()) return 'overdue';
  return inv.paid > 0 ? 'partial' : 'issued';
}
const invOpen = (inv) => inv.status === 'draft' || inv.kind === 'credit' ? 0 : Math.max(0, r2(inv.total - inv.paid - inv.credited));
const companyInvoices = (cid) => S.invoices.filter(i => i.companyId === cid);
const companyBalance = (cid) => r2(companyInvoices(cid).reduce((n, i) => n + invOpen(i), 0));
function zatcaTLV(inv) {
  const enc = new TextEncoder(); const bytes = [];
  const put = (tag, val) => { const b = enc.encode(String(val)); bytes.push(tag, b.length, ...b); };
  put(1, L(S.settings.legalName, 'ar')); put(2, S.settings.vatNumber); put(3, (inv.issuedAt || new Date().toISOString()).replace(/\.\d+Z$/, 'Z'));
  put(4, inv.total.toFixed(2)); put(5, inv.vat.toFixed(2));
  let bin = ''; bytes.forEach(b => bin += String.fromCharCode(b)); return btoa(bin);
}
function qrSVG(text, cell = 3) {
  try { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag(cell, 2); }
  catch (e) { return '<div class="muted" style="font-size:12px">QR</div>'; }
}
function approvePayment(p, by) {
  p.status = 'approved'; p.decidedBy = by; p.decidedAt = new Date().toISOString(); p.allocations = [];
  let left = p.amount;
  const open = companyInvoices(p.companyId).filter(i => invOpen(i) > 0).sort((a, b) => (p.invoiceId === a.id ? -1 : p.invoiceId === b.id ? 1 : a.dueDate.localeCompare(b.dueDate)));
  for (const inv of open) { if (left <= 0) break; const take = Math.min(left, invOpen(inv)); inv.paid = r2(inv.paid + take); left = r2(left - take); p.allocations.push({invoiceId:inv.id, amount:take}); }
  if (left > 0) { const c = companyById(p.companyId); c.credit = r2((c.credit || 0) + left); p.allocations.push({invoiceId:'رصيد دائن', amount:left}); }
}
function agingFor(cid) {
  const b = {cur:0, d30:0, d60:0, d90:0, d90p:0};
  companyInvoices(cid).forEach(i => { const o = invOpen(i); if (!o) return; const late = daysBetween(i.dueDate, today());
    if (late <= 0) b.cur += o; else if (late <= 30) b.d30 += o; else if (late <= 60) b.d60 += o; else if (late <= 90) b.d90 += o; else b.d90p += o; });
  Object.keys(b).forEach(k => b[k] = r2(b[k])); b.total = r2(b.cur + b.d30 + b.d60 + b.d90 + b.d90p); return b;
}
function maxLateDays(cid) { return companyInvoices(cid).filter(i => invOpen(i) > 0).reduce((m, i) => Math.max(m, daysBetween(i.dueDate, today())), 0); }
function quarterOf(d) { const q = Math.floor(toDate(d).getMonth() / 3); return `${toDate(d).getFullYear()}-Q${q + 1}`; }

/* ---------- room booking (clients) ---------- */
const bookingHours = (b) => r2((new Date(b.end) - new Date(b.start)) / 36e5);
function isWorkday(ds) { const r = S.rules.booking; return !r.weekend.includes(toDate(ds).getDay()) && !r.holidays.includes(ds); }
function bookableDays() { const out = []; let d = today(); for (let i = 0; i <= S.rules.booking.daysAhead; i++) { if (isWorkday(d)) out.push(d); d = addDays(d, 1); } return out; }
function slotState(resId, ds, hour, viewer) {
  const s = new Date(`${ds}T${String(hour).padStart(2, '0')}:00:00`), e = new Date(+s + 36e5);
  if (s < new Date()) return 'past';
  const b = S.bookings.find(x => x.resourceId === resId && ['pending', 'confirmed'].includes(x.status) && new Date(x.start) < e && new Date(x.end) > s);
  if (!b) return 'free';
  if (viewer && b.companyId === viewer) return b.status === 'pending' ? 'mine-held' : 'mine';
  return b.status === 'pending' ? 'held' : 'booked';
}
function freeQuota(cid) { return S.contracts.filter(k => k.companyId === cid && ['active', 'expiring'].includes(contractStatus(k))).reduce((n, k) => n + (k.freeHours || 0), 0); }
function freeUsed(cid, month = thisMonthKey()) { return r2(S.bookings.filter(b => b.companyId === cid && ['confirmed', 'completed', 'pending'].includes(b.status) && b.start.slice(0, 7) === month).reduce((n, b) => n + bookingHours(b), 0)); }
const thisMonthKey = () => today().slice(0, 7);
function bookingEstimate(resId, hours, cid, month) {
  const r = resById(resId); const rate = r.rate.hour || 0;
  const left = cid ? Math.max(0, freeQuota(cid) - freeUsed(cid, month)) : 0;
  const free = Math.min(hours, left), paid = r2(hours - free); const net = r2(paid * rate);
  return {rate, hours, free, paid, net, vat:vatOf(net), total:r2(net + vatOf(net)), left};
}
function alternativesFor(b, n = 3) {
  const out = []; const hrs = bookingHours(b); const st = new Date(b.start); const h0 = st.getHours();
  const tryAdd = (resId, ds, h) => {
    if (out.length >= n || h < S.rules.booking.workStart || h + hrs > S.rules.booking.workEnd || !isWorkday(ds)) return;
    for (let k = 0; k < hrs; k++) if (slotState(resId, ds, h + k) !== 'free') return;
    const s = new Date(`${ds}T${String(h).padStart(2, '0')}:00:00`); if (s < new Date()) return;
    if (!out.some(o => o.resourceId === resId && o.start === s.toISOString())) out.push({resourceId:resId, start:s.toISOString(), end:new Date(+s + hrs * 36e5).toISOString()});
  };
  const ds = dstr(st); const sameBranch = S.resources.filter(r => r.kind === 'room' && r.branch === resById(b.resourceId).branch && !r.maintenance && r.cap >= (b.people || 1));
  [h0 + hrs, h0 - hrs, h0 + hrs + 1, h0 + 2 * hrs].forEach(h => tryAdd(b.resourceId, ds, h));
  sameBranch.filter(r => r.id !== b.resourceId).forEach(r => tryAdd(r.id, ds, h0));
  let d = addDays(ds, 1); for (let i = 0; i < 5 && out.length < n; i++, d = addDays(d, 1)) tryAdd(b.resourceId, d, h0);
  return out.slice(0, n);
}
function icsFor(b) {
  const f = (iso) => iso.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wasl Daim//Booking//AR', 'BEGIN:VEVENT', `UID:${b.id}@wasldaim`, `DTSTAMP:${f(new Date().toISOString())}`,
    `DTSTART:${f(b.start)}`, `DTEND:${f(b.end)}`, `SUMMARY:${L(resById(b.resourceId).name, 'ar')} — وصل دائم`, `LOCATION:${branchName(resById(b.resourceId).branch, 'ar')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
function offerIcs(b) {
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([icsFor(b)], {type:'text/calendar'})); a.download = `booking-${b.id}.ics`; document.body.appendChild(a); a.click(); a.remove(); }
  catch (e) { toast(isEn() ? 'Calendar file download is not available in this preview' : 'تنزيل ملف التقويم غير متاح في هذه المعاينة', true); }
}
/* expire holds, complete past bookings */
function tickBusiness() {
  if (!S.bookings) return; const now = new Date(); let changed = false;
  S.bookings.forEach(b => {
    if (b.status === 'pending' && b.holdUntil && new Date(b.holdUntil) < now) {
      b.status = 'expired'; changed = true;
      const cu = custById(b.customerId); if (cu) cu.notifs.unshift({at:now.toISOString(), text:`انتهت مهلة تأكيد حجزك في ${L(resById(b.resourceId).name, 'ar')} دون رد، وتحرر الموعد.`});
    }
    if (b.status === 'confirmed' && new Date(b.end) < now) { b.status = 'completed'; changed = true; }
  });
  if (changed) save();
}

/* ---------- deals ---------- */
function dealCalc(d) {
  const r = resById(d.resourceId) || {rate:{}};
  const qty = d.qty || 1; const sub = r2(d.listMonthly * d.months * qty); const disc = r2(sub * (d.discountPct || 0) / 100);
  const net = r2(sub - disc); const vat = vatOf(net); const monthlyNet = r2(net / d.months / qty);
  const flags = [];
  if ((d.discountPct || 0) > S.rules.deals.maxDiscountNoJust) flags.push({k:'discount', bad:!(d.justification || '').trim(), text:`خصم ${d.discountPct}% أعلى من ${S.rules.deals.maxDiscountNoJust}%${(d.justification || '').trim() ? ' — مع تبرير' : ' — يتطلب تبريرًا'}`});
  if (r.minMonth && monthlyNet < r.minMonth) flags.push({k:'min', bad:true, text:`السعر الشهري بعد الخصم (${money(monthlyNet)}) أقل من الحد الأدنى ${money(r.minMonth)} ر.س`});
  const end = addDays(addMonths(d.start, d.months), -1);
  if (r.kind !== 'desk' && r.kind !== 'virtual') {
    const clash = S.contracts.find(k => k.resourceId === d.resourceId && k.status !== 'terminated' && k.end >= today() && k.start <= end && contractEnd(k) >= d.start && k.dealId !== d.id);
    if (clash) flags.push({k:'clash', bad:true, text:`المساحة محجوزة بعقد ${clash.id} حتى ${fmtDate(clash.end)}`});
  }
  if (r.maintenance) flags.push({k:'maint', bad:true, text:'المساحة في الصيانة ولا يمكن بيعها'});
  if (net > S.rules.deals.secondApprovalAbove) flags.push({k:'second', bad:false, text:`قيمة الصفقة فوق ${money(S.rules.deals.secondApprovalAbove)} ر.س — تحتاج اعتمادًا ثانيًا`});
  return {sub, disc, net, vat, total:r2(net + vat), monthlyNet, end, flags, blocked:flags.some(f => f.bad)};
}
const contractEnd = (k) => k.end;
const DEAL_FIELDS = [['resourceId', 'المساحة', (v) => L(resById(v)?.name, 'ar')], ['start', 'تاريخ البدء', (v) => fmtDate(v)], ['months', 'المدة (أشهر)', (v) => v], ['qty', 'العدد', (v) => v || 1],
  ['listMonthly', 'السعر الشهري', (v) => money(v)], ['discountPct', 'الخصم %', (v) => (v || 0) + '%'], ['billing', 'الفوترة', (v) => v === 'quarterly' ? 'ربع سنوية' : 'شهرية'],
  ['deposit', 'التأمين', (v) => money(v)], ['freeHours', 'ساعات القاعات المجانية', (v) => v], ['justification', 'التبرير', (v) => v || '—'], ['terms', 'شروط إضافية', (v) => v || '—']];
function dealSnapshot(d) { const o = {}; DEAL_FIELDS.forEach(([k]) => o[k] = d[k]); return o; }
function dealDiff(a, b) { return DEAL_FIELDS.filter(([k]) => JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k])).map(([k, l, f]) => ({k, label:l, from:a ? f(a[k]) : '—', to:f(b[k])})); }
function createContractFromDeal(d, by) {
  const c = dealCalc(d); const k = {id:nextNo('CT'), companyId:d.companyId, resourceId:d.resourceId, qty:d.qty || 1, start:d.start, months:d.months, end:c.end,
    monthly:c.monthlyNet, listMonthly:d.listMonthly, discountPct:d.discountPct || 0, billing:d.billing, deposit:d.deposit || 0, freeHours:d.freeHours || 0,
    status:'awaiting', dealId:d.id, prevId:d.prevContractId || null, renewals:0, createdAt:new Date().toISOString(), createdBy:by, signedFile:null, terms:d.terms || ''};
  S.contracts.unshift(k); d.contractId = k.id; return k;
}
function activateContract(k, by, file) {
  k.status = 'active'; k.signedFile = file || k.signedFile; k.activatedAt = new Date().toISOString(); k.activatedBy = by;
  const first = contractSchedule(k)[0];
  const inv = newInvoice({companyId:k.companyId, contractId:k.id, period:{from:first.from, to:first.to},
    lines:[{desc:{ar:`إيجار ${L(resById(k.resourceId).name, 'ar')} من ${fmtDate(first.from, false, 'ar')} إلى ${fmtDate(first.to, false, 'ar')}`, en:`Rent — ${L(resById(k.resourceId).name, 'en')} ${first.from} to ${first.to}`}, qty:first.months * (k.qty || 1), unit:k.monthly}]});
  if (k.deposit) inv.lines.push({desc:{ar:'تأمين مسترد (خارج نطاق الضريبة)', en:'Refundable deposit (out of VAT scope)'}, qty:1, unit:k.deposit, noVat:true});
  Object.assign(inv, invTotals(inv.lines)); S.invoices.unshift(inv); return inv;
}
/* draft invoices for periods starting within the next 15 days, with extra meeting-room hours */
function generateDrafts() {
  let n = 0; const horizon = addDays(today(), 15);
  S.contracts.filter(k => ['active', 'expiring'].includes(contractStatus(k))).forEach(k => {
    contractSchedule(k).forEach(p => {
      if (p.from > horizon || p.from < addDays(today(), -40)) return;
      if (S.invoices.some(i => i.contractId === k.id && i.period && i.period.from === p.from && i.kind === 'invoice')) return;
      const lines = [{desc:{ar:`إيجار ${L(resById(k.resourceId).name, 'ar')} من ${fmtDate(p.from, false, 'ar')} إلى ${fmtDate(p.to, false, 'ar')}`, en:`Rent — ${L(resById(k.resourceId).name, 'en')} ${p.from} to ${p.to}`}, qty:p.months * (k.qty || 1), unit:k.monthly}];
      const prevMonth = addMonths(p.from, -1).slice(0, 7); const used = freeUsed(k.companyId, prevMonth); const extra = r2(used - freeQuota(k.companyId));
      if (extra > 0 && !S.invoices.some(i => i.companyId === k.companyId && i.extraFor === prevMonth)) lines.push({desc:{ar:`ساعات قاعات إضافية (${prevMonth})`, en:`Extra meeting-room hours (${prevMonth})`}, qty:extra, unit:150});
      const inv = newInvoice({companyId:k.companyId, contractId:k.id, period:{from:p.from, to:p.to}, lines}); if (extra > 0) inv.extraFor = prevMonth;
      S.invoices.unshift(inv); n++;
    });
  });
  return n;
}

/* ---------- seed ---------- */
function seedBiz(st, {day, dOnly, T}) {
  const now = new Date(); const D = (off) => { const d = new Date(now); d.setDate(d.getDate() + off); return dstr(d); };
  const wd = (off) => { let d = D(off); let g = 0; while ([5, 6].includes(toDate(d).getDay()) && g++ < 4) d = addDays(d, off >= 0 ? 1 : -1); return d; };
  const at = (ds, h, m = 0) => new Date(`${ds}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`).toISOString();
  const ago = (mins) => new Date(Date.now() - mins * 6e4).toISOString();

  st.settings.address = T('مكة المكرمة — العنوان التفصيلي يُعدَّل من لوحة التحكم', 'Makkah — full address editable from the dashboard');
  st.settings.legalName = T('شركة وصل دائم (مثال)', 'Wasl Daim Co. (example)');
  st.settings.vatNumber = '300000000000003'; st.settings.crNumber = '4031000000';
  st.settings.bank = {name:T('البنك (مثال)', 'Bank (example)'), iban:'SA00 0000 0000 0000 0000 0000'};

  st.branches = [{id:'main', name:'فرع مكة المكرمة الرئيسي', en:'Makkah main branch', city:'مكة المكرمة'}, {id:'b2', name:'فرع العوالي (مثال)', en:'Al-Awali branch (example)', city:'مكة المكرمة'}];
  const R = (id, ar, en, kind, branch, cap, rate, o = {}) => Object.assign({id, name:T(ar, en), kind, branch, cap, rate, minMonth:0, online:kind === 'room', maintenance:false, art:kind === 'room' ? 'meeting' : kind === 'desk' ? 'open' : kind === 'virtual' ? 'lounge' : kind === 'shared' ? 'booth' : 'office'}, o);
  st.resources = [
    R('r1', 'قاعة أجياد', 'Ajyad room', 'room', 'main', 12, {hour:150, day:900}),
    R('r2', 'قاعة حراء', 'Hira room', 'room', 'main', 6, {hour:90, day:550}),
    R('r6', 'قاعة الحجون (تدريب)', 'Al-Hajun training room', 'room', 'main', 25, {hour:250, day:1600}, {art:'hall'}),
    R('r3', 'المساحة المفتوحة — مقعد مرن', 'Open space — flexible desk', 'desk', 'main', 40, {day:75, month:1200}, {minMonth:1000}),
    R('r7', 'مكتب مشترك (أ)', 'Shared office (A)', 'shared', 'main', 6, {month:3200}, {minMonth:2800}),
    R('r4', 'مكتب مقفل 101', 'Private office 101', 'office', 'main', 4, {month:4500}, {minMonth:3900}),
    R('r5', 'مكتب مقفل 102', 'Private office 102', 'office', 'main', 3, {month:3800}, {minMonth:3300}),
    R('r11', 'مكتب مقفل 103', 'Private office 103', 'office', 'main', 6, {month:6200}, {minMonth:5400}),
    R('r8', 'مكتب افتراضي', 'Virtual office', 'virtual', 'main', 1, {month:650}, {minMonth:550}),
    R('r9', 'قاعة العوالي', 'Al-Awali room', 'room', 'b2', 8, {hour:120, day:700}),
    R('r10', 'مكتب مقفل 201', 'Private office 201', 'office', 'b2', 4, {month:3900}, {minMonth:3400, maintenance:true})
  ];
  st.content.packages.forEach(p => { if (p.resource === 'r1') p.name = T('قاعة اجتماعات', 'Meeting room'); });
  const s3 = st.content.slides.find(x => x.id === 's3'); if (s3) { s3.cta1 = {label:T('اطلب عرض سعر', 'Request a quote'), form:'quote'}; s3.cta2 = {label:T('كل المساحات والأسعار', 'All spaces & prices'), href:'#workspaces'}; }

  st.roles = [
    {id:'owner', name:'مالك النظام', en:'Owner', system:true, scope:'all', desc:'أعلى صلاحية. لا يمكن لأي مستخدم آخر تعديل صلاحياته أو حذف حسابه.', perms:[]},
    {id:'ops', name:'مدير العمليات (الإدارة)', en:'Operations manager', system:true, scope:'all', desc:'الإدارة: تعتمد الصفقات، وتدير المنشآت والمساحات والأسعار، وتتابع الأداء.', perms:[...ROLE_DEFAULTS.ops]},
    {id:'staff', name:'موظف مبيعات', en:'Sales', system:true, scope:'branch', desc:'يرى طلبات فرعه وغير المُسندة، ويبني الصفقات ويؤكد حجوزات القاعات.', perms:[...ROLE_DEFAULTS.staff]},
    {id:'accountant', name:'محاسب', en:'Accountant', system:true, scope:'all', desc:'يصدر الفواتير، ويراجع المدفوعات، ويتابع الذمم والضريبة.', perms:[...ROLE_DEFAULTS.accountant]},
    {id:'content', name:'مسؤول محتوى', en:'Content manager', system:true, scope:'all', desc:'يدير نصوص الموقع وصوره والفعاليات بالعربية والإنجليزية.', perms:[...ROLE_DEFAULTS.content]},
    {id:'bookings', name:'موظف حجوزات', en:'Bookings officer', system:false, scope:'assigned', desc:'دور مخصص: يؤكد حجوزات القاعات ويضيف الملاحظات، دون حذف أو بيانات مالية.', perms:[...ROLE_DEFAULTS.bookings]},
    {id:'reception', name:'موظف استقبال', en:'Receptionist', system:false, scope:'all', desc:'دور مخصص: يستقبل الزوار ويسجل الطلبات الجديدة.', perms:[...ROLE_DEFAULTS.reception]}
  ];
  const codes = () => Array.from({length:10}, () => Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase());
  const U = (id, name, email, roleId, branch, o = {}) => Object.assign({id, name, email, roleId, status:'active', twoFA:['owner', 'ops', 'accountant'].includes(roleId), twoFAMethod:'app', recovery:['owner', 'ops', 'accountant'].includes(roleId) ? ['WD7K-29QF', ...codes().slice(1)] : [], branch, overrides:[], lastLogin:ago(60 * 20), sessions:[], pwHistory:[], lang:'ar'}, o);
  st.users = [
    U('u1', 'نورة الراشد', 'owner@wasldaim.sa', 'owner', 'main', {sessions:[{device:'Chrome — macOS', ip:'85.154.12.40', at:ago(90)}]}),
    U('u2', 'خالد المالكي', 'ops@wasldaim.sa', 'ops', 'main', {sessions:[{device:'Edge — Windows', ip:'85.154.12.41', at:ago(40)}]}),
    U('u4', 'فهد العتيبي', 'sales@wasldaim.sa', 'staff', 'main', {sessions:[{device:'Chrome — Windows', ip:'85.154.12.45', at:ago(30)}]}),
    U('u8', 'عبدالله الزهراني', 'sales2@wasldaim.sa', 'staff', 'b2'),
    U('u6', 'ماجد الحربي', 'finance@wasldaim.sa', 'accountant', 'main', {twoFAMethod:'sms'}),
    U('u5', 'لمى الفيصل', 'content@wasldaim.sa', 'content', 'main'),
    U('u3', 'ريم السالم', 'bookings@wasldaim.sa', 'bookings', 'main', {overrides:[{perm:'reports.view', grant:true, from:dOnly(-2), to:dOnly(21), by:'u1'}]}),
    U('u7', 'سعد القرني', 'reception@wasldaim.sa', 'reception', 'main', {status:'suspended'}),
    U('u9', 'أريج المالكي', 'areej@wasldaim.sa', 'staff', 'main', {status:'invited', inviteExpires:new Date(Date.now() + 40 * 36e5).toISOString(), invitedBy:'u1', lastLogin:null}),
    U('u10', 'هند السبيعي', 'hind@wasldaim.sa', 'accountant', 'main', {status:'invited', inviteExpires:new Date(Date.now() - 10 * 36e5).toISOString(), invitedBy:'u1', lastLogin:null})
  ];

  const Dc = (type, status, expOff, upOff = -150, reason = '') => ({type, status, file:status === 'missing' ? null : `${DOC_TYPES[type].en.replace(/\s+/g, '-').toLowerCase()}.pdf`, expiry:expOff == null ? null : D(expOff), uploadedAt:status === 'missing' ? null : day(upOff, 11), reason});
  const allDocs = (off = -150) => [Dc('cr', 'approved', 300, off), Dc('vat', 'approved', null, off), Dc('id', 'approved', 500, off), Dc('articles', 'approved', null, off), Dc('address', 'approved', 400, off)];
  const C = (id, nameAr, nameEn, cr, vat, o = {}) => Object.assign({id, nameAr, nameEn, cr, vat, city:'مكة المكرمة', size:'6-20', branch:'main', status:'verified', salesOwner:'u4', docs:allDocs(), interests:['office'], createdAt:day(-200, 10), credit:0, pendingChange:null, suspendReason:''}, o);
  st.companies = [
    C('co1', 'رواد مكة للتقنية', 'Ruwad Makkah Tech Co.', '4031098765', '310987654300003', {docs:[Dc('cr', 'approved', 20), Dc('vat', 'approved', null), Dc('id', 'approved', 420), Dc('articles', 'approved', null), Dc('address', 'approved', 200)], interests:['office', 'rooms']}),
    C('co2', 'استوديو ضوء', 'Daw Studio', '4031122334', '311122334400003', {createdAt:day(-12, 10), docs:allDocs(-11), interests:['office']}),
    C('co3', 'منصة تعليم', 'Taaleem Platform', '4031555777', '', {status:'pending', createdAt:day(-1, 15), size:'1-5', interests:['desk', 'programs'], docs:[Dc('cr', 'review', 340, -1), Dc('vat', 'missing', null), Dc('id', 'review', 900, -1), Dc('articles', 'missing', null), Dc('address', 'missing', null)]}),
    C('co4', 'وقود للحلول اللوجستية', 'Wuqood Logistics', '4031444555', '311222333400003', {pendingChange:{field:'nameAr', label:'الاسم القانوني (عربي)', from:'وقود للحلول اللوجستية', to:'وقود القابضة للحلول اللوجستية', at:day(-2, 13)}}),
    C('co5', 'مكتب السبيعي للاستشارات', 'Al-Subaie Consulting', '4031777888', '310777888900003'),
    C('co6', 'شركة المدار للتجارة', 'Al-Madar Trading', '4031999000', '310999000100003', {status:'suspended', suspendReason:'فواتير متأخرة أكثر من 60 يومًا'})
  ];
  const CU = (id, name, email, companyId, companyRole, phone) => ({id, name, email, phone, pw:'Client@2026', pwHistory:[], companyId, companyRole, status:'active', lang:'ar', files:[], notifs:[], sessions:[]});
  st.customers = [
    CU('cu1', 'سارة العتيبي', 'client@example.com', 'co1', 'admin', '0551234567'), CU('cu2', 'محمد القحطاني', 'booking@example.com', 'co1', 'booking', '0559876543'),
    CU('cu3', 'ليان الشهري', 'finance@example.com', 'co1', 'finance', '0503344556'), CU('cu7', 'تركي العنزي', 'viewer@example.com', 'co1', 'viewer', '0578899001'),
    CU('cu4', 'نوف الحربي', 'daw@example.com', 'co2', 'admin', '0567788990'), CU('cu5', 'عمر الدوسري', 'new@example.com', 'co3', 'admin', '0541122334'),
    CU('cu6', 'سلطان الغامدي', 'wuqood@example.com', 'co4', 'admin', '0532233445'), CU('cu8', 'بندر السبيعي', 'subaie@example.com', 'co5', 'admin', '0545566778')
  ];
  st.customers[0].notifs = [{at:day(-1, 9), text:'فاتورتك الأخيرة متأخرة عن موعد السداد. يمكنك رفع إيصال التحويل من صفحة الفواتير.'}, {at:day(-3, 10), text:'تم تأكيد حجزك في قاعة أجياد.'}];

  st.rules = {
    booking:{holdHours:4, alertBefore:1, cancelFreeHours:24, minH:1, maxH:8, daysAhead:30, maxPending:3, workStart:8, workEnd:20, weekend:[5, 6], holidays:['2027-02-22'], onlineKinds:['room'], confirmBy:'sales', noShow:'charge'},
    durationDiscounts:{1:0, 3:5, 6:10, 12:15},
    freeHours:{office:10, shared:5, desk:2, virtual:0},
    deals:{maxDiscountNoJust:10, secondApprovalAbove:100000},
    contracts:{allowUnsigned:false, renewalAlertDays:60},
    billing:{day:'start', dueDays:10, reminders:{remind:7, warn:30, suspend:60}, exportTo:'excel'},
    targets:{sales:{u4:30000, u8:15000}, branches:{main:{revenue:18000, occupancy:85}, b2:{revenue:3000, occupancy:60}}}
  };
  Object.assign(st.security, {require2FA:true, lockAfter:5, lockWindow:15, lockMinutes:15, sessionMins:30, minPw:10, pwHistory:5, resetMins:30, inviteHours:48, ipRestrict:false, officeIps:'85.154.12.0/24', maskExports:true, alertNewLogin:true});

  // contracts
  const K = (id, companyId, resourceId, startOff, months, monthly, billing, deposit, freeHours, o = {}) => {
    const start = D(startOff); return Object.assign({id, companyId, resourceId, qty:1, start, months, end:addDays(addMonths(start, months), -1), monthly, listMonthly:monthly, discountPct:0, billing, deposit, freeHours,
      status:'active', dealId:null, prevId:null, renewals:0, createdAt:day(startOff - 5, 10), signedFile:`signed-${id}.pdf`, terms:''}, o);
  };
  st.contracts = [
    K('CT-2026-000031', 'co1', 'r4', -170, 12, 4500, 'monthly', 4500, 10),
    K('CT-2026-000033', 'co4', 'r5', -305, 12, 3800, 'quarterly', 3800, 10),
    K('CT-2026-000035', 'co5', 'r7', -160, 6, 3200, 'monthly', 3200, 5, {dealId:'DL-2026-000012'}),
    K('CT-2026-000036', 'co6', 'r3', -150, 6, 1200, 'monthly', 0, 2, {qty:2})
  ];
  // invoices from schedules
  const prevS = S; S = st; st.seqs = {REQ:230, CT:40, INV:118, CN:2, DL:20, PAY:70}; st.invoices = []; st.payments = [];
  const unpaid = {'co1':1, 'co4':1, 'co6':3};
  st.contracts.forEach(k => {
    const per = contractSchedule(k).filter(p => p.from <= D(0)); const lastN = unpaid[k.companyId] || 0;
    per.forEach((p, i) => {
      const inv = newInvoice({companyId:k.companyId, contractId:k.id, period:{from:p.from, to:p.to}, lines:[{desc:{ar:`إيجار ${L(resById(k.resourceId).name, 'ar')} من ${fmtDate(p.from, false, 'ar')} إلى ${fmtDate(p.to, false, 'ar')}`, en:`Rent — ${L(resById(k.resourceId).name, 'en')} ${p.from} to ${p.to}`}, qty:p.months * (k.qty || 1), unit:k.monthly}]});
      if (i === 0 && k.deposit) { inv.lines.push({desc:{ar:'تأمين مسترد (خارج نطاق الضريبة)', en:'Refundable deposit (out of VAT scope)'}, qty:1, unit:k.deposit, noVat:true}); Object.assign(inv, invTotals(inv.lines)); }
      issueInvoice(inv, toDate(p.from)); inv.sentAt = inv.issuedAt; st.invoices.push(inv);
      if (i < per.length - lastN) { inv.paid = inv.total; st.payments.push({id:nextNo('PAY'), companyId:k.companyId, invoiceId:inv.id, amount:inv.total, date:addDays(p.from, 4), ref:'TRX-' + (40000 + st.payments.length * 37), method:'transfer', status:'approved', file:'receipt.pdf', by:'client', at:toDate(addDays(p.from, 4)).toISOString(), decidedBy:'u6', allocations:[{invoiceId:inv.id, amount:inv.total}]}); }
    });
  });
  // credit note example (co5)
  const co5inv = st.invoices.find(i => i.companyId === 'co5');
  if (co5inv) { const cn = newInvoice({companyId:'co5', contractId:co5inv.contractId, kind:'credit', refInvoice:co5inv.id, note:'تصحيح: احتُسب يوم إضافي بالخطأ', lines:[{desc:{ar:'خصم تصحيحي على ' + co5inv.id, en:'Correction on ' + co5inv.id}, qty:1, unit:500}]}); issueInvoice(cn, toDate(addDays(co5inv.issueDate, 6))); co5inv.credited = cn.total; st.invoices.push(cn); }
  // receipt awaiting review (co4)
  const co4open = st.invoices.filter(i => i.companyId === 'co4' && i.paid < i.total).slice(-1)[0];
  generateDrafts();
  if (co4open) st.payments.unshift({id:nextNo('PAY'), companyId:'co4', invoiceId:co4open.id, amount:co4open.total, date:D(-1), ref:'TRX-88123', method:'transfer', status:'review', file:'إيصال-التحويل.pdf', by:'cu6', at:day(-1, 16), allocations:[]});

  // room bookings
  const B = (id, resourceId, ds, h1, h2, companyId, customerId, status, o = {}) => Object.assign({id, resourceId, start:at(ds, h1), end:at(ds, h2), companyId, customerId,
    name:companyId ? companyName(st.companies.find(c => c.id === companyId), 'ar') : (o.name || ''), phone:'', email:'', people:4, status, code:'', price:0, by:customerId ? 'portal' : 'u4', createdAt:ago(60 * 24 * 3), notes:''}, o);
  const thisM = (n) => { const d = new Date(now); d.setDate(Math.max(1, Math.min(n, now.getDate() - 1))); return dstr(d); };
  st.bookings = [
    B('bk1', 'r1', wd(1), 10, 12, 'co1', 'cu1', 'confirmed', {people:8}),
    B('bk2', 'r2', wd(2), 13, 15, 'co1', 'cu2', 'pending', {createdAt:ago(190), holdUntil:new Date(Date.now() + 50 * 6e4).toISOString(), people:5}),
    B('bk3', 'r1', wd(2), 9, 11, 'co4', 'cu6', 'pending', {createdAt:ago(60), holdUntil:new Date(Date.now() + 3 * 36e5).toISOString(), people:6}),
    B('bk4', 'r6', wd(3), 16, 18, 'co5', 'cu8', 'confirmed', {people:20}),
    B('bk5', 'r1', thisM(3), 10, 12, 'co1', 'cu1', 'completed', {people:10}),
    B('bk6', 'r2', thisM(6), 14, 16, 'co1', 'cu2', 'completed', {people:4}),
    B('bk7', 'r1', wd(1), 13, 15, 'co2', 'cu4', 'rejected', {reason:'القاعة محجوزة لفعالية داخلية في هذا الوقت', alts:[], decidedBy:'u4'}),
    B('bk8', 'r2', wd(4), 10, 11, 'co1', 'cu1', 'cancelled'),
    B('bk9', 'r6', wd(5), 17, 20, null, null, 'confirmed', {name:'دورة التسويق الرقمي', by:'u5', people:25}),
    B('bk10', 'r2', wd(-1), 9, 10, 'co1', 'cu2', 'expired'),
    B('bk11', 'r9', wd(2), 11, 13, 'co5', 'cu8', 'confirmed', {people:6})
  ];
  // last month extra hours for co1 (12h used of 10)
  const lm = addMonths(D(0), -1).slice(0, 8);
  st.bookings.push(B('bk12', 'r1', lm + '08', 9, 15, 'co1', 'cu1', 'completed'), B('bk13', 'r2', lm + '14', 10, 16, 'co1', 'cu2', 'completed'));
  st.bookings.forEach(b => { const r = st.resources.find(x => x.id === b.resourceId); b.price = r2((r.rate.hour || 0) * bookingHours(b)); });
  const rej = st.bookings.find(b => b.id === 'bk7'); rej.alts = alternativesFor(rej);

  // deals
  const v1 = {resourceId:'r11', start:D(14), months:6, qty:1, listMonthly:6200, discountPct:18, billing:'quarterly', deposit:6200, freeHours:10, justification:'عميل جديد مهم', terms:''};
  const v2 = Object.assign({}, v1, {discountPct:12, justification:'التزام 6 أشهر ودفع ربع سنوي مقدمًا، وإمكانية التوسع لمكتب أكبر بعد 3 أشهر'});
  st.deals = [
    Object.assign({id:'DL-2026-000018', companyId:'co2', branch:'main', owner:'u4', status:'pending', createdAt:day(-3, 10), contractId:null}, v2, {versions:[
      {v:1, at:day(-2, 11), by:'u4', data:v1, decision:'returned', decidedBy:'u2', decidedAt:day(-2, 15), comment:'الخصم أعلى من المسموح. الحد 10%، وأي زيادة تحتاج تبريرًا مقنعًا.'},
      {v:2, at:ago(120), by:'u4', data:v2, decision:null}]}),
    Object.assign({id:'DL-2026-000019', companyId:'co3', branch:'main', owner:'u4', status:'draft', createdAt:ago(300), contractId:null, versions:[]},
      {resourceId:'r3', start:D(7), months:3, qty:3, listMonthly:1200, discountPct:5, billing:'monthly', deposit:0, freeHours:2, justification:'', terms:'بعد اعتماد المنشأة'}),
    Object.assign({id:'DL-2026-000012', companyId:'co5', branch:'main', owner:'u4', status:'approved', createdAt:day(-170, 10), contractId:'CT-2026-000035', versions:[{v:1, at:day(-168, 10), by:'u4', data:{}, decision:'approved', decidedBy:'u2', decidedAt:day(-167, 12), comment:''}]},
      {resourceId:'r7', start:D(-160), months:6, qty:1, listMonthly:3200, discountPct:0, billing:'monthly', deposit:3200, freeHours:5, justification:'', terms:''}),
    Object.assign({id:'DL-2026-000017', companyId:'co6', branch:'main', owner:'u4', status:'rejected', createdAt:day(-20, 10), contractId:null, versions:[{v:1, at:day(-20, 11), by:'u4', data:{}, decision:'rejected', decidedBy:'u2', decidedAt:day(-19, 9), comment:'لا تُفتح صفقات جديدة لمنشأة معلّقة بسبب المتأخرات.'}]},
      {resourceId:'r7', start:D(10), months:3, qty:1, listMonthly:3200, discountPct:0, billing:'monthly', deposit:3200, freeHours:5, justification:'', terms:''})
  ];
  S = prevS;

  // leads (CRM)
  const LD = (id, name, phone, email, company, service, source, status, owner, o = {}) => Object.assign({id, name, phone, email, company, service, source, status, owner, branch:'main', nextFollow:D(1), createdAt:day(-10, 10), lastContactAt:day(-2, 11), log:[{at:day(-2, 11), by:owner || 'system', kind:'call', text:'مكالمة متابعة: مهتم ويطلب عرض سعر.'}], notes:'', closeReason:'', companyId:null}, o);
  st.clients = [
    LD('c1', 'سارة العتيبي', '0551234567', 'client@example.com', 'رواد مكة للتقنية', 'quote', 'referral', 'won', 'u4', {companyId:'co1', createdAt:day(-210, 10), nextFollow:''}),
    LD('c2', 'نوف الحربي', '0567788990', 'daw@example.com', 'استوديو ضوء', 'quote', 'social', 'deal', 'u4', {companyId:'co2', createdAt:day(-14, 10)}),
    LD('c3', 'عمر الدوسري', '0541122334', 'new@example.com', 'منصة تعليم', 'register', 'ad', 'assigned', 'u4', {companyId:'co3', createdAt:day(-1, 15), lastContactAt:null, log:[{at:day(-1, 15), by:'system', kind:'web', text:'سجّلت المنشأة من الموقع — الاهتمامات: مقاعد مرنة، برامج الحاضنة'}], nextFollow:D(0)}),
    LD('c4', 'سلطان الغامدي', '0532233445', 'wuqood@example.com', 'وقود للحلول اللوجستية', 'renewal', 'visit', 'won', 'u4', {companyId:'co4', createdAt:day(-320, 10)}),
    LD('c5', 'بندر السبيعي', '0545566778', 'subaie@example.com', 'مكتب السبيعي للاستشارات', 'quote', 'referral', 'won', 'u4', {companyId:'co5', createdAt:day(-175, 10)}),
    LD('c6', 'تركي العتيبي', '0578800112', 'turki.o@example.com', '', 'quote', 'ad', 'new', null, {createdAt:day(-2, 9), lastContactAt:null, log:[{at:day(-2, 9), by:'system', kind:'web', text:'طلب عرض سعر من الموقع: مكتب مقفل لـ 4 أشخاص لمدة 6 أشهر'}]}),
    LD('c7', 'شهد الحربي', '0596677889', 'shahad.h@example.com', 'متجر رواء', 'visit', 'social', 'assigned', 'u4', {createdAt:day(-1, 8), lastContactAt:null, log:[{at:day(-1, 8), by:'system', kind:'web', text:'حجز زيارة من الموقع'}]}),
    LD('c8', 'يوسف الشمري', '0584455667', 'yousef.sh@example.com', '', 'incubator', 'web', 'contacted', 'u4', {nextFollow:D(-1)}),
    LD('c9', 'دانة العمري', '0509988776', 'dana.o@example.com', '', 'quote', 'whatsapp', 'lost', 'u4', {closeReason:'price', notes:'السعر أعلى من ميزانيتها الحالية؛ تعاود التواصل بعد 6 أشهر.', nextFollow:''}),
    LD('c10', 'ريان الأحمدي', '0553322110', 'rayan.a@example.com', 'تقنية الحرم', 'quote', 'ad', 'contacted', 'u8', {branch:'b2'}),
    LD('c11', 'هيفاء المطيري', '0567700110', 'haifa.m@example.com', '', 'contact', 'whatsapp', 'new', null, {branch:'b2', createdAt:ago(60 * 5), lastContactAt:null, log:[]})
  ];

  // requests (REQ-YYYY-000xxx)
  let rq = 200;
  const RQ = (type, status, assignee, off, o = {}) => { rq++; return Object.assign({id:`REQ-${now.getFullYear()}-${pad6(rq)}`, type, status, assignee, branch:'main', companyId:null, name:'', phone:'', email:'', source:'web', data:{}, files:[], notes:[], comms:[], createdAt:day(off, 10 + (rq % 7)), updatedAt:day(Math.min(0, off + 1), 12), history:[{at:day(off, 10), by:'system', text:'استُلم الطلب'}]}, o); };
  st.requests = [
    RQ('register', 'new', 'u4', -1, {companyId:'co3', name:'عمر الدوسري', phone:'0541122334', email:'new@example.com', source:'ad', data:{company:'منصة تعليم', interests:['desk', 'programs']}}),
    RQ('quote', 'new', null, -2, {name:'تركي العتيبي', phone:'0578800112', email:'turki.o@example.com', source:'ad', data:{kind:'office', people:4, months:'6', branch:'main'}}),
    RQ('visit', 'review', 'u4', -1, {name:'شهد الحربي', phone:'0596677889', email:'shahad.h@example.com', source:'social', data:{branch:'main', date:D(2), slot:'am', people:2}}),
    RQ('renewal', 'review', 'u4', -3, {companyId:'co4', name:'سلطان الغامدي', phone:'0532233445', email:'wuqood@example.com', data:{contract:'CT-2026-000033', months:'12'}}),
    RQ('maintenance', 'review', 'u2', -2, {companyId:'co1', name:'سارة العتيبي', phone:'0551234567', email:'client@example.com', data:{details:'التكييف في المكتب 101 لا يبرد بشكل كافٍ.'}, comms:[{by:'u2', at:day(-1, 10), kind:'زيارة', text:'زار فني الصيانة المكتب وطلب قطعة غيار، الإصلاح متوقع خلال يومين.'}]}),
    RQ('extra_service', 'done', 'u2', -9, {companyId:'co1', name:'محمد القحطاني', phone:'0559876543', email:'booking@example.com', data:{details:'شاشة عرض إضافية في المكتب'}}),
    RQ('contract_change', 'new', 'u4', 0, {companyId:'co5', name:'بندر السبيعي', phone:'0545566778', email:'subaie@example.com', data:{contract:'CT-2026-000035', details:'نرغب في إضافة مقعدين للعقد الحالي.'}}),
    RQ('incubator', 'review', 'u4', -6, {name:'يوسف الشمري', phone:'0584455667', email:'yousef.sh@example.com', data:{project:'سلة ذكية للمطاعم', sector:'food', stage:'prototype', founders:2, summary:'نظام طلبات ذكي يربط المطاعم بالموردين.'}, files:['pitch-smart-basket.pdf']}),
    RQ('accelerator', 'new', 'u2', -1, {name:'عبدالرحمن الدوسري', phone:'0503344556', email:'a.dosari@example.com', source:'referral', data:{company:'مِنصّة تعليم', sector:'edu', revenue:'r1', team:6, needs:'توسّع في الخليج وبناء فريق مبيعات.'}}),
    RQ('investor', 'review', 'u2', -3, {name:'هيفاء المطيري', phone:'0567700110', email:'haifa.m@example.com', source:'whatsapp', data:{itype:'angel', ticket:'t1', sectors:['health', 'tech'], opp:'o2'}}),
    RQ('event', 'approved', 'u4', -2, {name:'جواهر الزهراني', phone:'0532233445', email:'jawaher.z@example.com', source:'social', data:{event:'e1', org:'جامعة أم القرى'}}),
    RQ('contact', 'done', 'u4', -9, {name:'بندر السبيعي', phone:'0545566778', email:'subaie@example.com', data:{topic:'spaces', message:'هل تتوفر مكاتب خاصة لفريق من خمسة أشخاص؟'}}),
    RQ('opportunity', 'review', 'u2', -7, {name:'سلطان الغامدي', phone:'0532233445', email:'sultan.g@example.com', data:{project:'تطبيق صيانة منزلية', sector:'tech', stage:'seed', amount:900000, summary:'منصة تربط الفنيين بأصحاب المنازل.'}, files:['deck-home-fix.pdf']}),
    RQ('contact', 'new', null, 0, {branch:'b2', name:'هيفاء المطيري', phone:'0567700110', email:'haifa.m@example.com', source:'whatsapp', data:{topic:'spaces', message:'هل يوجد مكتب في فرع العوالي؟'}})
  ];
  st.requests[4].notes = [{by:'u2', at:day(-1, 11), text:'قطعة الغيار مطلوبة من المورد، تابع معه يوم الأحد.'}];
  st.requests.forEach(r => { r.updatedAt = r.updatedAt || r.createdAt; });
  st.seqs.REQ = rq + 20;

  st.audit = [
    {at:day(-2, 15), by:'u2', ip:'85.154.12.41', act:'deal', target:'DL-2026-000018', before:{الحالة:'بانتظار الاعتماد'}, after:{الحالة:'أُعيدت للتعديل', السبب:'الخصم أعلى من المسموح'}},
    {at:ago(120), by:'u4', ip:'85.154.12.45', act:'deal', target:'DL-2026-000018', before:{النسخة:'v1', الخصم:'18%'}, after:{النسخة:'v2', الخصم:'12%'}},
    {at:day(-1, 16), by:'system', ip:'بوابة العملاء', act:'payment', target:'وقود للحلول اللوجستية', before:null, after:{إيصال:'TRX-88123'}},
    {at:day(-1, 15), by:'system', ip:'موقع عام', act:'create', target:'تسجيل منشأة: منصة تعليم', before:null, after:{الحالة:'قيد التحقق'}},
    {at:day(-4, 9), by:'u1', ip:'85.154.12.40', act:'perm', target:'ريم السالم', before:{'reports.view':false}, after:{'reports.view':'مؤقت حتى ' + dOnly(21)}},
    {at:day(-1, 23, 41), by:'—', ip:'102.89.4.17', act:'login_fail', target:'ops@wasldaim.sa', before:null, after:{المحاولة:3}},
    {at:day(0, 8, 2), by:'u2', ip:'85.154.12.41', act:'login', target:'لوحة التحكم', before:null, after:null}
  ];
  st.notifs = [
    {id:'n1', to:'u2', at:ago(118), read:false, title:'صفقة بانتظار اعتمادك', body:'DL-2026-000018 — استوديو ضوء (النسخة 2)', link:'approvals'},
    {id:'n2', to:'u4', at:ago(70), read:false, title:'حجز معلّق ينتهي خلال ساعة', body:'قاعة حراء — رواد مكة للتقنية', link:'bookings'},
    {id:'n3', to:'u6', at:day(-1, 16), read:false, title:'إيصال تحويل بانتظار المراجعة', body:'وقود للحلول اللوجستية — TRX-88123', link:'billing'},
    {id:'n4', to:'u2', at:day(-1, 15), read:false, title:'منشأة جديدة بانتظار التحقق', body:'منصة تعليم — مستندات قيد المراجعة', link:'companies'},
    {id:'n5', to:'u1', at:day(-1, 23, 42), read:false, title:'محاولات دخول فاشلة', body:'3 محاولات على ops@wasldaim.sa من عنوان غير معتاد', link:'audit'},
    {id:'n6', to:'u4', at:day(-1, 15), read:false, title:'طلب تسجيل منشأة جديد', body:'منصة تعليم — عمر الدوسري', link:'leads'}
  ];
  st.templates.push(
    {key:'booking_confirmed', name:'تأكيد حجز قاعة (للعميل)', channels:['email', 'inapp'], ar:'تم تأكيد حجزك في {space} يوم {date} الساعة {time}. أرفقنا ملف التقويم.', en:'Your booking at {space} on {date} at {time} is confirmed.'},
    {key:'booking_rejected', name:'رفض حجز مع بدائل', channels:['email', 'inapp'], ar:'نعتذر، لم نتمكن من تأكيد حجزك في {space}: {reason}. اقترحنا عليك مواعيد بديلة في البوابة.', en:'We could not confirm your booking at {space}: {reason}. Alternatives are in your portal.'},
    {key:'invoice_issued', name:'إصدار فاتورة', channels:['email', 'inapp'], ar:'صدرت الفاتورة {ref} بمبلغ {amount} ر.س، تستحق في {date}.', en:'Invoice {ref} of {amount} SAR was issued, due {date}.'},
    {key:'otp', name:'رمز التحقق', channels:['sms'], ar:'رمز التحقق في وصل دائم: {code}. لا تشاركه مع أحد.', en:'Your Wasl Daim verification code: {code}.'},
    {key:'staff_invite', name:'دعوة موظف', channels:['email'], ar:'دعاك {by} للانضمام إلى لوحة تحكم وصل دائم بدور {role}. الرابط صالح 48 ساعة.', en:'{by} invited you to the Wasl Daim dashboard as {role}. Link valid for 48 hours.'}
  );
  st.content.slides.splice(3, 0, {id:'s4', art:'plan', eyebrow:T('المستثمر الأجنبي', 'Foreign investors'), title:T('ابدأ أعمالك في مكة بخطوات واضحة', 'Start your business in Makkah with clear steps'),
    text:T('نرافق المستثمر الأجنبي في التراخيص والسجل التجاري والمقر، مع مكتب جاهز من اليوم الأول.', 'We guide foreign investors through licences, registration and premises, with an office ready from day one.'),
    cta1:{label:T('سجّل منشأتك', 'Register your company'), form:'register'}, cta2:{label:T('خدماتنا', 'Our services'), href:'#services'}, img:''});
  st.content.services.push({id:'sv7', icon:'globe', name:T('تأسيس المستثمر الأجنبي', 'Foreign investor setup'), text:T('مرافقة في التراخيص والسجل والمقر والحسابات البنكية للمستثمر غير السعودي.', 'Support with licences, registration, premises and banking for non-Saudi investors.')});
  st.content.sections.contact.text = T('زرنا في مكة المكرمة أو راسلنا، ويرد عليك فريقنا خلال يوم عمل.', 'Visit us in Makkah or message us — our team replies within one working day.');
  st.history = [ // last 6 full months (scaled to the demo portfolio)
    {m:-6, revenue:9800, bookings:9, clients:3, leads:8, won:1}, {m:-5, revenue:10900, bookings:11, clients:4, leads:9, won:2}, {m:-4, revenue:11600, bookings:10, clients:3, leads:8, won:1},
    {m:-3, revenue:12900, bookings:13, clients:5, leads:11, won:2}, {m:-2, revenue:13400, bookings:12, clients:4, leads:10, won:2}, {m:-1, revenue:14300, bookings:14, clients:6, leads:12, won:3}];
  st.deals.forEach(d => { if (d.status === 'approved') d.approvedAt = d.versions.at(-1)?.decidedAt; });
  st.outbox = [];
  st.seq = 0;
  return st;
}

/* ---------- VAT (quarterly return helper) ---------- */
function vatReport(q) {
  const docs = S.invoices.filter(i => i.status !== 'draft' && quarterOf(i.issueDate) === q).sort((a, b) => a.issueDate.localeCompare(b.issueDate));
  const sales = docs.filter(i => i.kind === 'invoice'), cn = docs.filter(i => i.kind === 'credit');
  const s = (arr, k) => r2(arr.reduce((n, i) => n + i[k], 0));
  return {q, docs, salesNet:s(sales, 'net'), salesVat:s(sales, 'vat'), cnNet:s(cn, 'net'), cnVat:s(cn, 'vat'), base:r2(s(sales, 'net') - s(cn, 'net')), net:r2(s(sales, 'vat') - s(cn, 'vat'))};
}
function quartersBack(n = 4) { const out = []; const d = toDate(today()); d.setDate(1); for (let i = 0; i < n; i++) { const q = quarterOf(dstr(d)); if (!out.includes(q)) out.push(q); d.setMonth(d.getMonth() - 3); } return out; }
