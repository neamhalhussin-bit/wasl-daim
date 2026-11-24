/* وصل دائم — public pages: unified sign-in (+2FA), company registration, workspaces, staff invitations, password reset, privacy & terms */
'use strict';

const PAGES = {};
function pageShell(view, inner) {
  $('#app').innerHTML = headerHTML() + `<main data-page="${view}">${inner}</main>` + footerHTML();
  bindHeader(); lockUI($('#app'));
}
function renderPage(view) { (PAGES[view] || PAGES.workspaces)(); }
const authAside = (title, items) => `<aside class="auth-art" aria-hidden="true"><img src="assets/logo-full.webp" alt="" width="190" height="184">
  <h2>${esc(title)}</h2><ul>${items.map(i => `<li>${ic('check')}<span>${esc(i)}</span></li>`).join('')}</ul></aside>`;
const authWrap = (aside, card) => `<section class="auth"><div class="wrap auth-in">${aside}<div class="auth-card">${card}</div></div></section>`;
function fieldErr(id, msg) {
  const el = document.getElementById(id); if (!el) return; const f = el.closest('.field'); if (!f) return;
  f.classList.toggle('bad', !!msg); let h = f.querySelector('.ferr'); if (!h) { h = document.createElement('span'); h.className = 'ferr'; f.appendChild(h); } h.textContent = msg || '';
  if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
}
const pwListHTML = (id) => `<ul class="pw-list" id="${id}" aria-live="polite">${pwChecks('', curLang()).map(([, l]) => `<li>${ic('close')}<span>${esc(l)}</span></li>`).join('')}</ul>`;
function bindPwList(inputId, listId) {
  const i = document.getElementById(inputId), ul = document.getElementById(listId); if (!i || !ul) return;
  i.addEventListener('input', () => { ul.innerHTML = pwChecks(i.value, curLang()).map(([ok, l]) => `<li class="${ok ? 'ok' : ''}">${ic(ok ? 'check' : 'close')}<span>${esc(l)}</span></li>`).join(''); });
}
const eyeBtn = (id) => `<button type="button" class="eye" data-act="pw-eye" data-for="${id}" aria-label="${esc(tt('إظهار كلمة المرور', 'Show password'))}">${ic('eye')}</button>`;
ACT['pw-eye'] = (el) => { const i = document.getElementById(el.dataset.for); i.type = i.type === 'password' ? 'text' : 'password'; };
const otpBoxes = (n = 6) => `<div class="otp" dir="ltr">${Array.from({length:n}, (_, i) => `<input inputmode="numeric" maxlength="1" autocomplete="${i ? 'off' : 'one-time-code'}" aria-label="${esc(tt('الرقم', 'Digit'))} ${i + 1}" data-otp="${i}">`).join('')}</div>`;
function bindOtp(root, onDone) {
  const ins = $$('[data-otp]', root); if (!ins.length) return () => '';
  ins.forEach((i, k) => {
    i.oninput = () => { i.value = i.value.replace(/\D/g, ''); if (i.value && ins[k + 1]) ins[k + 1].focus(); if (ins.every(x => x.value) && onDone) onDone(); };
    i.onkeydown = (e) => { if (e.key === 'Backspace' && !i.value && ins[k - 1]) ins[k - 1].focus(); };
  });
  ins[0].addEventListener('paste', (e) => { const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (d.length === 6) { e.preventDefault(); ins.forEach((x, k) => x.value = d[k]); if (onDone) onDone(); } });
  setTimeout(() => ins[0].focus(), 30);
  return () => ins.map(i => i.value).join('');
}
const fillOtp = (code = OTP) => { const ins = $$('[data-otp]'); ins.forEach((x, k) => x.value = code[k] || ''); };
ACT['otp-fill'] = () => fillOtp();

/* ================= unified sign-in ================= */
UI.auth = {step:'cred', email:'', userId:null, tries:0, recovery:false, msg:''};
const staffPw = (u) => u.pw || DEMO_PW;
PAGES.login = () => {
  const A = UI.auth; const u = A.step === 'otp' ? userById(A.userId) : null;
  if (!u && S.session && me() && UI.loginFor !== 'switch') { /* already signed in as staff */ }
  const aside = authAside(tt('دخول واحد لكل حسابات وصل دائم', 'One sign-in for every Wasl Daim account'), [
    tt('يوجّهك النظام تلقائيًا: الموظفون إلى لوحة التحكم، والمنشآت إلى بوابة العميل', 'Staff go to the dashboard and member companies to their portal automatically'),
    tt('تحقق بخطوتين إلزامي للإدارة والمحاسبة، ورموز استرداد عند فقدان الجوال', 'Two-step verification for management and finance, with recovery codes'),
    tt(`إيقاف مؤقت بعد ${S.security.lockAfter} محاولات خاطئة، وتنتهي الجلسة بعد ${S.security.sessionMins} دقيقة دون نشاط`, `Temporary lock after ${S.security.lockAfter} failed attempts; sessions end after ${S.security.sessionMins} idle minutes`)]);
  pageShell('login', authWrap(aside, u ? otpCardHTML(u) : credCardHTML()));
  if (u) bindOtpCard(u);
  else {
    $('#login-form').onsubmit = (e) => { e.preventDefault(); signIn($('#lg-email').value.trim().toLowerCase(), $('#lg-pw').value); };
  }
};
function demoAcctsHTML() {
  const staff = S.users.filter(x => x.status !== 'invited');
  const btn = (kind, email, name, sub, chips = '') => `<button type="button" class="demo-acct" data-act="pick-acct" data-kind="${kind}" data-email="${esc(email)}"><span class="av" aria-hidden="true">${esc(initials(name))}</span><div><b>${esc(name)}</b><span>${esc(sub)}</span>${chips}</div></button>`;
  return `<div class="demo-box"><p class="demo-h">${ic('key')} ${esc(VIEW_ONLY ? tt('اختر حسابًا للدخول مباشرة:', 'Pick an account to sign in:') : tt('حسابات تجريبية — اختر حسابًا لتعبئة البيانات:', 'Demo accounts — pick one to fill the form:'))}</p>
    <p class="demo-g">${esc(tt('فريق العمل', 'Staff'))}</p><div class="demo-accts">${staff.map(x => btn('staff', x.email, x.name, (isEn() ? roleById(x.roleId)?.en || roleById(x.roleId)?.name : roleById(x.roleId)?.name) + (S.branches.length > 1 && x.branch !== 'main' ? ' · ' + branchName(x.branch) : ''),
      (x.status !== 'active' ? ` <span class="chip bad">${esc(tt('موقوف', 'Suspended'))}</span>` : '') + (needs2FA(x) ? ` <span class="chip plain">${ic('shield')}${esc(tt('خطوتين', '2FA'))}</span>` : ''))).join('')}</div>
    <p class="demo-g">${esc(tt('العملاء (المنشآت)', 'Member companies'))}</p><div class="demo-accts">${S.customers.map(c => { const co = companyById(c.companyId);
      return btn('client', c.email, c.name, `${companyName(co)} · ${L(COMPANY_ROLES[c.companyRole])}`, co && co.status !== 'verified' ? ` <span class="chip ${COMPANY_STATUS[co.status].cls}">${esc(L(COMPANY_STATUS[co.status]))}</span>` : ''); }).join('')}</div>
    <p class="muted" style="font-size:12.5px;margin-top:8px">${esc(tt(`كلمة مرور الموظفين: ${DEMO_PW} · العملاء: Client@2026 · رمز التحقق: ${OTP}`, `Staff password: ${DEMO_PW} · Clients: Client@2026 · Code: ${OTP}`))}</p></div>`;
}
function credCardHTML() {
  const A = UI.auth;
  return `<div><span class="chip">${esc(VIEW_ONLY ? tt('نسخة عرض فقط', 'View-only demo') : tt('حسابات تجريبية', 'Demo accounts'))}</span></div>
    <h1>${esc(tt('تسجيل الدخول', 'Sign in'))}</h1><p class="muted">${esc(tt('للموظفين والمنشآت المشتركة في وصل دائم.', 'For Wasl Daim staff and member companies.'))}</p>
    ${A.msg ? `<div class="notice warn" role="status">${ic('alert')}<div>${esc(A.msg)}</div></div>` : ''}
    <form id="login-form" class="form" novalidate>
      ${fld('lg-email', esc(tt('البريد الإلكتروني', 'Email')), inp('lg-email', A.email, 'email', 'dir="ltr" autocomplete="username" required'))}
      <div class="field"><label for="lg-pw">${esc(tt('كلمة المرور', 'Password'))}</label><div class="pw-wrap">${inp('lg-pw', '', 'password', 'dir="ltr" autocomplete="current-password" required')}${eyeBtn('lg-pw')}</div></div>
      <div class="notice bad hidden" id="lg-err" role="alert">${ic('alert')}<div id="lg-err-t"></div></div>
      <button class="btn btn-gold" type="submit">${esc(tt('دخول', 'Sign in'))}</button>
      <div class="auth-links"><button type="button" class="lk" data-act="forgot">${esc(tt('نسيت كلمة المرور؟', 'Forgot password?'))}</button><a href="#register">${esc(tt('منشأة جديدة؟ سجّل الآن', 'New company? Register'))}</a></div></form>
    ${demoAcctsHTML()}
    <div class="auth-links"><a href="#activate">${ic('mail')} ${esc(tt('موظف لديه دعوة؟ فعّل حسابك', 'Staff invitation? Activate your account'))}</a><a href="#">${ic('back')} ${esc(tt('العودة إلى الموقع', 'Back to the website'))}</a></div>`;
}
function authErr(msg) { const b = $('#lg-err'); if (!b) return toast(msg, true); $('#lg-err-t').textContent = msg; b.classList.remove('hidden'); }
function signIn(email, pw) {
  const A = UI.auth; A.email = email; A.msg = '';
  if (!email || !pw) return authErr(tt('أدخل البريد الإلكتروني وكلمة المرور.', 'Enter your email and password.'));
  if (isLocked(email)) return authErr(tt(`أُوقف الدخول مؤقتًا بسبب محاولات متكررة. حاول مرة أخرى ${lockLeft(email)}.`, `Sign-in is temporarily locked after repeated attempts. Try again ${lockLeft(email).replace('بعد', 'in').replace('دقيقة', 'min')}.`));
  const u = S.users.find(x => x.email === email), c = S.customers.find(x => x.email === email);
  const okU = u && u.status !== 'invited' && pw === staffPw(u), okC = c && c.status === 'active' && pw === c.pw;
  if (!okU && !okC) {
    const r = registerFail(email); audit('login_fail', email, null, {المحاولة:r.lockedUntil ? S.security.lockAfter : r.n}, '—');
    if (isLocked(email)) {
      audit('lock', email, null, {المدة:S.security.lockMinutes + ' دقيقة'}, '—');
      if (u) S.users.filter(x => x.roleId === 'owner').forEach(o => notify(o.id, 'إيقاف دخول مؤقت', `${u.name} (${email}) — ${S.security.lockAfter} محاولات خاطئة`, 'audit'));
      save(); return authErr(tt(`أُوقف الدخول مؤقتًا لمدة ${S.security.lockMinutes} دقيقة بعد ${S.security.lockAfter} محاولات خاطئة.`, `Sign-in is locked for ${S.security.lockMinutes} minutes after ${S.security.lockAfter} failed attempts.`));
    }
    if (u && r.n >= 3) S.users.filter(x => x.roleId === 'owner').forEach(o => notify(o.id, 'محاولة دخول مشبوهة', `${r.n} محاولات فاشلة على ${email}`, 'audit'));
    save(); return authErr(tt(`البريد الإلكتروني أو كلمة المرور غير صحيحة. المحاولات المتبقية قبل الإيقاف المؤقت: ${S.security.lockAfter - r.n}`, `Incorrect email or password. Attempts left before a temporary lock: ${S.security.lockAfter - r.n}`));
  }
  if (okU) {
    if (u.status === 'suspended') return authErr(tt('هذا الحساب موقوف. تواصل مع مدير النظام.', 'This account is suspended. Contact the system administrator.'));
    if (needs2FA(u)) { Object.assign(A, {step:'otp', userId:u.id, tries:0, recovery:false}); PAGES.login(); return; }
    return finishLogin(u);
  }
  clientEnter(c);
}
function finishLogin(u, quiet = false) {
  clearFails(u.email); UI.auth = {step:'cred', email:'', userId:null, tries:0, recovery:false, msg:''};
  S.session = {userId:u.id, at:new Date().toISOString()}; u.lastLogin = S.session.at;
  u.sessions = [{device:(navigator.userAgent.includes('Mobile') ? 'جوال — ' : 'متصفح — ') + (navigator.userAgent.match(/(Edg|Chrome|Safari|Firefox)/)?.[1] || 'Browser'), ip:fakeIp(), at:S.session.at}, ...(u.sessions || [])].slice(0, 5);
  audit('login', 'لوحة التحكم');
  if (S.security.alertNewLogin && u.roleId !== 'owner' && !quiet) S.users.filter(x => x.roleId === 'owner').forEach(o => notify(o.id, 'دخول جديد إلى لوحة التحكم', `${u.name} — ${u.sessions[0].device}`, 'audit'));
  UI.admin = 'mine'; UI.lastAct = Date.now(); save();
  if (location.hash !== '#admin') location.hash = 'admin'; else renderAdmin();
  if (!quiet) setTimeout(() => toast(`مرحبًا ${u.name}`), 50);
}
function clientEnter(c) {
  clearFails(c.email); UI.auth = {step:'cred', email:'', userId:null, tries:0, recovery:false, msg:''};
  S.portal = c.id; if (c.lang) S.lang = c.lang;
  c.sessions = [{device:navigator.userAgent.includes('Mobile') ? 'جوال' : 'متصفح', at:new Date().toISOString()}, ...(c.sessions || [])].slice(0, 5);
  audit('portal', `${c.name} — ${companyName(companyById(c.companyId), 'ar')}`, null, {العملية:'تسجيل دخول'}, 'system');
  UI.portalTab = 'home'; save(); location.hash = 'portal';
  setTimeout(() => toast(tt(`أهلًا ${c.name}`, `Welcome, ${c.name}`)), 50);
}
function otpCardHTML(u) {
  const A = UI.auth; const sms = u.twoFAMethod === 'sms';
  return `<button type="button" class="lk" data-act="auth-back">${ic('back')} ${esc(tt('رجوع', 'Back'))}</button>
    <h1>${esc(tt('التحقق بخطوتين', 'Two-step verification'))}</h1>
    <p class="muted">${A.recovery ? esc(tt('أدخل أحد رموز الاسترداد العشرة التي حفظتها عند تفعيل التحقق. يُستخدم كل رمز مرة واحدة.', 'Enter one of your ten recovery codes. Each code works once.'))
      : sms ? esc(tt(`أرسلنا رمزًا من 6 أرقام برسالة نصية إلى جوال ${u.name}.`, `We sent a 6-digit code by SMS to ${u.name}'s phone.`)) : esc(tt('افتح تطبيق المصادقة وأدخل الرمز المكوّن من 6 أرقام.', 'Open your authenticator app and enter the 6-digit code.'))}</p>
    <div class="notice"><div>${ic('info')} ${A.recovery ? `${esc(tt('رمز استرداد تجريبي:', 'Demo recovery code:'))} <b class="ltr">${esc((u.recovery || [])[0] || '—')}</b>` : `${esc(tt('الرمز التجريبي:', 'Demo code:'))} <b class="ltr">${OTP}</b> <button type="button" class="lk" data-act="otp-fill">${esc(tt('تعبئة', 'Fill'))}</button>`}</div></div>
    <form id="otp-form" class="form" novalidate>${A.recovery ? fld('rc-code', esc(tt('رمز الاسترداد', 'Recovery code')), inp('rc-code', '', 'text', 'dir="ltr" autocomplete="one-time-code" placeholder="XXXX-XXXX" maxlength="9"')) : otpBoxes()}
      <div class="notice bad hidden" id="otp-err" role="alert">${ic('alert')}<div id="otp-err-t"></div></div>
      <button class="btn btn-gold" type="submit">${esc(tt('تحقق ودخول', 'Verify and sign in'))}</button>
      <p class="muted" style="font-size:13px">${esc(tt(`المحاولات المتبقية: ${3 - A.tries} — بعد 3 رموز خاطئة تُلغى محاولة الدخول.`, `Attempts left: ${3 - A.tries} — three wrong codes cancel the sign-in.`))}</p>
      <div class="auth-links">${A.recovery ? `<button type="button" class="lk" data-act="auth-recovery">${esc(tt('استخدم رمز التطبيق أو الرسالة', 'Use the app or SMS code'))}</button>` : `<button type="button" class="lk" data-act="auth-recovery">${esc(tt('فقدت جوالك؟ استخدم رمز استرداد', 'Lost your phone? Use a recovery code'))}</button>`}${sms && !A.recovery ? `<button type="button" class="lk" data-act="otp-resend">${esc(tt('إعادة إرسال الرمز', 'Resend code'))}</button>` : ''}</div></form>`;
}
function bindOtpCard(u) {
  const A = UI.auth; const read = A.recovery ? () => ($('#rc-code').value || '').trim().toUpperCase() : bindOtp($('#otp-form'));
  if (A.recovery) setTimeout(() => $('#rc-code')?.focus(), 30);
  $('#otp-form').onsubmit = (e) => {
    e.preventDefault(); const code = read();
    const ok = A.recovery ? (u.recovery || []).includes(code) : code === OTP;
    if (ok) {
      if (A.recovery) { u.recovery = u.recovery.filter(x => x !== code); audit('twofa', u.name, null, {رمز_استرداد:'استُخدم', المتبقي:u.recovery.length}, u.id); notify(u.id, 'استُخدم رمز استرداد لدخول حسابك', `تبقّى ${u.recovery.length} رموز. إن لم تكن أنت فغيّر كلمة المرور فورًا.`, 'notifs'); }
      return finishLogin(u);
    }
    A.tries++;
    if (A.tries >= 3) { audit('twofa', u.name, null, {النتيجة:'أُلغيت محاولة الدخول بعد 3 رموز خاطئة'}, '—'); registerFail(u.email);
      Object.assign(A, {step:'cred', userId:null, tries:0, recovery:false, msg:tt('أُلغيت محاولة الدخول بعد 3 رموز خاطئة. أعد إدخال بياناتك.', 'Sign-in was cancelled after 3 wrong codes. Please start again.')}); save(); PAGES.login(); return; }
    $('#otp-err-t').textContent = tt(`الرمز غير صحيح. المحاولات المتبقية: ${3 - A.tries}`, `Incorrect code. Attempts left: ${3 - A.tries}`); $('#otp-err').classList.remove('hidden');
    $$('[data-otp]').forEach(i => i.value = ''); $('[data-otp]')?.focus();
  };
}
ACT['open-reset'] = () => { closeModal(); location.hash = 'reset'; };
ACT['auth-back'] = () => { UI.auth.step = 'cred'; UI.auth.msg = ''; PAGES.login(); };
ACT['auth-recovery'] = () => { UI.auth.recovery = !UI.auth.recovery; PAGES.login(); };
ACT['otp-resend'] = () => toast(tt('أُرسل رمز جديد (محاكاة)', 'A new code was sent (simulated)'));
ACT['pick-acct'] = (el) => {
  const email = el.dataset.email, kind = el.dataset.kind;
  const u = kind === 'staff' ? S.users.find(x => x.email === email) : null, c = kind === 'client' ? S.customers.find(x => x.email === email) : null;
  if (VIEW_ONLY) {
    if (u && u.status !== 'active') { $('#lg-email').value = email; return authErr(tt('هذا الحساب موقوف — مثال على إيقاف موظف دون حذفه ونقل عمله لزميل. اختر حسابًا آخر.', 'This account is suspended — an example of suspending staff without deleting them. Pick another.')); }
    if (u) { if (needs2FA(u)) { Object.assign(UI.auth, {step:'otp', userId:u.id, tries:0, recovery:false, email}); PAGES.login(); return; } return finishLogin(u); }
    return clientEnter(c);
  }
  $('#lg-email').value = email; $('#lg-pw').value = u ? staffPw(u) : c.pw;
  $$('.demo-acct').forEach(b => b.classList.toggle('sel', b === el)); $('#login-form [type=submit]').focus();
};

/* ---------- password reset (link valid 30 min, single use, same answer for every email) ---------- */
ACT['forgot'] = () => {
  openModal({title:esc(tt('استعادة كلمة المرور', 'Reset your password')), sub:esc(tt(`نرسل رابطًا صالحًا ${S.security.resetMins} دقيقة لمرة واحدة.`, `We email a link valid for ${S.security.resetMins} minutes, usable once.`)),
    body:`<form class="form" id="fg" novalidate>${fld('fg-e', esc(tt('البريد الإلكتروني', 'Email')), inp('fg-e', $('#lg-email')?.value || '', 'email', 'dir="ltr" autocomplete="username"'))}<button class="btn btn-gold" type="submit">${esc(tt('إرسال الرابط', 'Send link'))}</button></form>`,
    onMount:(m) => m.querySelector('#fg').onsubmit = (e) => {
      e.preventDefault(); const em = m.querySelector('#fg-e').value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return fieldErr('fg-e', tt('أدخل بريدًا صحيحًا', 'Enter a valid email'));
      const acct = S.users.find(x => x.email === em && x.status === 'active') || S.customers.find(x => x.email === em);
      S.resets = S.resets || {};
      if (acct) { S.resets[em] = {exp:new Date(Date.now() + S.security.resetMins * 6e4).toISOString(), used:false}; (S.outbox = S.outbox || []).unshift({at:new Date().toISOString(), to:em, subject:'رابط استعادة كلمة المرور — صالح ' + S.security.resetMins + ' دقيقة', channel:'email'}); audit('pw_reset', em, null, {العملية:'طلب رابط'}, 'system'); save(); }
      UI.resetEmail = em;
      m.querySelector('.modal-body').innerHTML = `<div class="success" style="padding:8px 0"><div class="tick">${ic('mail')}</div><p>${esc(tt('إذا كان البريد مسجلًا لدينا فستصلك رسالة خلال دقائق تحتوي رابط تعيين كلمة مرور جديدة.', 'If this email is registered, you will receive a message with a link to set a new password.'))}</p>
        <p class="muted" style="font-size:13px">${esc(tt('الرسالة نفسها تظهر لأي بريد، حتى لا يُعرف إن كان الحساب موجودًا.', 'The same message appears for any email, so nobody can tell whether an account exists.'))}</p>
        <a class="btn btn-ghost btn-sm" href="#reset" data-act="open-reset">${ic('external')} ${esc(tt('افتح الرسالة (صندوق بريد تجريبي)', 'Open the email (demo inbox)'))}</a></div>`;
    }});
};
PAGES.reset = () => {
  const em = UI.resetEmail; const tk = em && S.resets && S.resets[em];
  const acct = em && (S.users.find(x => x.email === em) || S.customers.find(x => x.email === em));
  const valid = tk && !tk.used && new Date(tk.exp) > new Date() && acct;
  const aside = authAside(tt('كلمة مرور جديدة بأمان', 'A new password, safely'), [tt('الرابط يُستخدم مرة واحدة فقط', 'The link works once'), tt('لا يمكن إعادة استخدام آخر 5 كلمات مرور', 'Your last 5 passwords cannot be reused'), tt('بعد التغيير يُسجَّل خروجك من الأجهزة الأخرى وتصلك رسالة تأكيد', 'Other devices are signed out and you get a confirmation email')]);
  const card = !valid ? `<h1>${esc(tt('الرابط غير صالح', 'This link is not valid'))}</h1><div class="notice warn">${ic('alert')}<div>${esc(tt(`انتهت صلاحية الرابط أو استُخدم من قبل. الروابط صالحة ${S.security.resetMins} دقيقة لمرة واحدة.`, `The link expired or was already used. Links are valid for ${S.security.resetMins} minutes, once.`))}</div></div>
      <button class="btn btn-gold" data-act="forgot">${esc(tt('اطلب رابطًا جديدًا', 'Request a new link'))}</button><a href="#login" class="muted">${ic('back')} ${esc(tt('تسجيل الدخول', 'Sign in'))}</a>`
    : `<h1>${esc(tt('تعيين كلمة مرور جديدة', 'Set a new password'))}</h1><p class="muted ltr" style="text-align:start">${esc(em)}</p>
      <form class="form" id="rs-form" novalidate data-viewsafe><div class="field"><label for="rs-pw">${esc(tt('كلمة المرور الجديدة', 'New password'))}</label><div class="pw-wrap">${inp('rs-pw', '', 'password', 'dir="ltr" autocomplete="new-password"')}${eyeBtn('rs-pw')}</div>${pwListHTML('rs-list')}</div>
      ${fld('rs-pw2', esc(tt('تأكيد كلمة المرور', 'Confirm password')), inp('rs-pw2', '', 'password', 'dir="ltr" autocomplete="new-password"'))}
      <button class="btn btn-gold" type="submit">${esc(tt('حفظ كلمة المرور', 'Save password'))}</button><p class="muted" style="font-size:13px">${esc(tt(`ينتهي الرابط ${fmtDate(tk.exp, true)}.`, `Link expires ${fmtDate(tk.exp, true)}.`))}</p></form>`;
  pageShell('reset', authWrap(aside, card));
  if (!valid) return;
  bindPwList('rs-pw', 'rs-list');
  $('#rs-form').onsubmit = (e) => {
    e.preventDefault(); const pw = $('#rs-pw').value, pw2 = $('#rs-pw2').value; fieldErr('rs-pw', ''); fieldErr('rs-pw2', '');
    if (!pwOk(pw)) return fieldErr('rs-pw', tt('كلمة المرور لا تستوفي الشروط', 'The password does not meet the rules'));
    if (pw !== pw2) return fieldErr('rs-pw2', tt('كلمتا المرور غير متطابقتين', 'Passwords do not match'));
    const staff = S.users.includes(acct); const cur = staff ? staffPw(acct) : acct.pw;
    if ([cur, ...(acct.pwHistory || [])].slice(0, 5).includes(pw)) return fieldErr('rs-pw', tt('لا يمكن استخدام إحدى آخر 5 كلمات مرور.', 'You cannot reuse one of your last 5 passwords.'));
    if (VIEW_ONLY) return toast(t('view_submit'), true);
    acct.pwHistory = [cur, ...(acct.pwHistory || [])].slice(0, 5); acct.pw = pw; tk.used = true; acct.sessions = [];
    if (staff && S.session?.userId === acct.id) S.session = null; if (!staff && S.portal === acct.id) S.portal = null;
    (S.outbox = S.outbox || []).unshift({at:new Date().toISOString(), to:em, subject:'تم تغيير كلمة المرور وتسجيل خروجك من جميع الأجهزة', channel:'email'});
    audit('pw_reset', acct.name, null, {العملية:'تغيير كلمة المرور', الجلسات:'أُنهيت'}, 'system'); clearFails(em);
    UI.auth.email = em; UI.resetEmail = null; save(); location.hash = 'login'; setTimeout(() => toast(tt('حُفظت كلمة المرور. سجّل الدخول بها الآن.', 'Password saved. Sign in with it now.')), 60);
  };
};

/* ---------- staff invitations (link valid 48 h) ---------- */
PAGES.activate = () => {
  const u = UI.invite ? userById(UI.invite) : null;
  const aside = authAside(tt('انضم إلى فريق وصل دائم', 'Join the Wasl Daim team'), [tt('تصل الدعوة من مدير النظام بدورك وفرعك', 'Invitations come from the administrator with your role and branch'), tt(`رابط الدعوة صالح ${S.security.inviteHours} ساعة`, `The link is valid for ${S.security.inviteHours} hours`), tt('التحقق بخطوتين إلزامي للإدارة والمحاسبة', '2-step verification is required for management and finance')]);
  let card;
  if (!u) {
    const inv = S.users.filter(x => x.status === 'invited');
    card = `<h1>${esc(tt('تفعيل حساب موظف', 'Activate a staff account'))}</h1><p class="muted">${esc(tt('في النظام الفعلي تفتح الرابط من بريدك. هنا صندوق بريد تجريبي برسائل الدعوة:', 'In the live system you open the link from your email. Here is a demo inbox:'))}</p>
      <div class="demo-accts">${inv.map(x => { const exp = new Date(x.inviteExpires) < new Date();
        return `<button type="button" class="demo-acct" data-act="inv-open" data-id="${x.id}" data-viewsafe><span class="av">${ic('mail')}</span><div><b>${esc(tt('دعوة إلى', 'Invitation for'))} ${esc(x.name)}</b><span>${esc(roleById(x.roleId)?.name)} · ${esc(tt('من', 'from'))} ${esc(userName(x.invitedBy))}</span> <span class="chip ${exp ? 'bad' : 'ok'}">${esc(exp ? tt('منتهية', 'Expired') : tt('صالحة حتى ', 'Valid until ') + fmtDate(x.inviteExpires, true))}</span></div></button>`; }).join('') || `<p class="muted">${esc(tt('لا توجد دعوات معلّقة.', 'No pending invitations.'))}</p>`}</div>
      <a href="#login" class="muted">${ic('back')} ${esc(tt('تسجيل الدخول', 'Sign in'))}</a>`;
  } else if (new Date(u.inviteExpires) < new Date()) {
    card = `<h1>${esc(tt('انتهت صلاحية الدعوة', 'This invitation has expired'))}</h1><div class="notice warn">${ic('clock')}<div>${esc(tt(`روابط الدعوة صالحة ${S.security.inviteHours} ساعة. اطلب من ${userName(u.invitedBy)} إعادة إرسال الدعوة من صفحة الفريق والصلاحيات.`, `Invitation links are valid for ${S.security.inviteHours} hours. Ask ${userName(u.invitedBy)} to resend it.`))}</div></div>
      <button class="btn btn-ghost" data-act="inv-list" data-viewsafe>${ic('back')} ${esc(tt('رجوع', 'Back'))}</button>`;
  } else {
    const m2 = mandatory2FA(u); UI.invRec = UI.invRec || recoveryCodes();
    card = `<h1>${esc(tt('أهلًا', 'Welcome'))} ${esc(u.name)}</h1><p class="muted">${esc(roleById(u.roleId)?.name)} · ${esc(branchName(u.branch, 'ar'))} · <span class="ltr">${esc(u.email)}</span></p>
      <form class="form" id="inv-form" novalidate data-viewsafe><div class="field"><label for="iv-pw">${esc(tt('اختر كلمة مرور', 'Choose a password'))}</label><div class="pw-wrap">${inp('iv-pw', '', 'password', 'dir="ltr" autocomplete="new-password"')}${eyeBtn('iv-pw')}</div>${pwListHTML('iv-list')}</div>
      ${fld('iv-pw2', esc(tt('تأكيد كلمة المرور', 'Confirm password')), inp('iv-pw2', '', 'password', 'dir="ltr" autocomplete="new-password"'))}
      <fieldset class="tfa-setup"><legend>${ic('shield')} ${esc(tt('التحقق بخطوتين', 'Two-step verification'))} ${m2 ? `<span class="chip warn">${esc(tt('إلزامي لدورك', 'Required for your role'))}</span>` : `<span class="chip plain">${esc(tt('اختياري', 'Optional'))}</span>`}</legend>
        ${m2 ? '' : `<label class="check"><input type="checkbox" id="iv-2fa"> ${esc(tt('فعّل التحقق بخطوتين لحسابي', 'Turn on 2-step verification'))}</label>`}
        <div class="seg" role="radiogroup"><button type="button" class="on" data-act="iv-m" data-m="app" aria-pressed="true">${esc(tt('تطبيق مصادقة', 'Authenticator app'))}</button><button type="button" data-act="iv-m" data-m="sms" aria-pressed="false">${esc(tt('رسالة نصية', 'SMS'))}</button></div>
        <div class="tfa-qr" id="iv-qr"><div class="qr">${qrSVG(`otpauth://totp/WaslDaim:${u.email}?secret=JBSWY3DPEHPK3PXP&issuer=WaslDaim`, 3)}</div><p class="muted" style="font-size:13px">${esc(tt('امسح الرمز بتطبيق المصادقة (Google Authenticator أو Microsoft Authenticator) ثم أدخل الرمز الظاهر.', 'Scan with an authenticator app, then enter the code it shows.'))}</p></div>
        ${fld('iv-code', esc(tt('رمز التأكيد', 'Confirmation code')) + ` <span class="muted" style="font-weight:400">(${esc(tt('تجريبي', 'demo'))}: ${OTP})</span>`, inp('iv-code', '', 'text', 'dir="ltr" inputmode="numeric" maxlength="6"'))}
        <details><summary>${esc(tt('رموز الاسترداد العشرة — احفظها في مكان آمن', 'Your 10 recovery codes — keep them safe'))}</summary><div class="rec-codes ltr">${UI.invRec.map(c => `<code>${c}</code>`).join('')}</div></details>
        <label class="check"><input type="checkbox" id="iv-saved"> ${esc(tt('حفظت رموز الاسترداد', 'I saved my recovery codes'))}</label></fieldset>
      <button class="btn btn-gold" type="submit">${esc(tt('تفعيل الحساب', 'Activate account'))}</button></form>`;
  }
  pageShell('activate', authWrap(aside, card));
  if (!u || new Date(u.inviteExpires) < new Date()) return;
  bindPwList('iv-pw', 'iv-list'); UI.invM = 'app';
  $('#inv-form').onsubmit = (e) => {
    e.preventDefault(); ['iv-pw', 'iv-pw2', 'iv-code'].forEach(i => fieldErr(i, ''));
    const pw = $('#iv-pw').value; const on = mandatory2FA(u) || $('#iv-2fa')?.checked;
    if (!pwOk(pw)) return fieldErr('iv-pw', tt('كلمة المرور لا تستوفي الشروط', 'The password does not meet the rules'));
    if (pw !== $('#iv-pw2').value) return fieldErr('iv-pw2', tt('كلمتا المرور غير متطابقتين', 'Passwords do not match'));
    if (on && $('#iv-code').value.trim() !== OTP) return fieldErr('iv-code', tt('رمز التأكيد غير صحيح', 'Incorrect code'));
    if (on && !$('#iv-saved').checked) return toast(tt('أكّد أنك حفظت رموز الاسترداد', 'Confirm you saved the recovery codes'), true);
    if (VIEW_ONLY) return toast(t('view_submit'), true);
    Object.assign(u, {status:'active', pw, pwHistory:[], twoFA:on, twoFAMethod:UI.invM, recovery:on ? UI.invRec : [], activatedAt:new Date().toISOString()}); delete u.inviteExpires;
    audit('invite', u.name, {الحالة:'دعوة'}, {الحالة:'فُعّل الحساب', الخطوتين:on ? 'مفعّل' : 'غير مفعّل'}, 'system');
    if (u.invitedBy) notify(u.invitedBy, 'فعّل موظف حسابه', `${u.name} — ${roleById(u.roleId).name}`, 'users');
    UI.invite = null; UI.invRec = null; UI.auth.email = u.email; save(); location.hash = 'login'; setTimeout(() => toast(tt('فُعّل حسابك. سجّل الدخول الآن.', 'Your account is active. Sign in now.')), 60);
  };
};
ACT['inv-open'] = (el) => { UI.invite = el.dataset.id; UI.invRec = null; PAGES.activate(); window.scrollTo(0, 0); };
ACT['inv-list'] = () => { UI.invite = null; PAGES.activate(); };
ACT['iv-m'] = (el) => { UI.invM = el.dataset.m; $$('[data-act="iv-m"]').forEach(b => { b.classList.toggle('on', b === el); b.setAttribute('aria-pressed', b === el); }); $('#iv-qr').hidden = UI.invM !== 'app'; };

/* ================= company registration (4 steps) ================= */
const CITIES = [['makkah', 'مكة المكرمة', 'Makkah'], ['jeddah', 'جدة', 'Jeddah'], ['taif', 'الطائف', 'Taif'], ['madinah', 'المدينة المنورة', 'Madinah'], ['riyadh', 'الرياض', 'Riyadh'], ['other', 'مدينة أخرى', 'Other']];
const SIZES = [['1-5', '1–5 موظفين', '1–5 employees'], ['6-20', '6–20 موظفًا', '6–20 employees'], ['21-50', '21–50 موظفًا', '21–50 employees'], ['50+', 'أكثر من 50', '50+']];
const INTERESTS = [['office', 'مكتب مقفل', 'Private office'], ['shared', 'مكتب مشترك', 'Shared office'], ['desk', 'مقاعد مرنة', 'Flexible desks'], ['virtual', 'مكتب افتراضي', 'Virtual office'], ['rooms', 'قاعات اجتماعات', 'Meeting rooms'], ['programs', 'برامج الحاضنة والمسرعة', 'Incubator & accelerator'], ['foreign', 'تأسيس مستثمر أجنبي', 'Foreign investor setup']];
UI.reg = {step:1, d:{city:'makkah', size:'1-5', interests:[]}, tries:0, sentAt:0};
const pick = (arr, v) => (arr.find(x => x[0] === v) || [, v, v])[isEn() ? 2 : 1];
PAGES.register = () => {
  const R = UI.reg; const d = R.d; const steps = [tt('بيانات المنشأة', 'Company'), tt('المسؤول وكلمة المرور', 'Contact & password'), tt('تأكيد الجوال', 'Verify phone'), tt('تم', 'Done')];
  const sel = (id, arr, v) => `<select class="input" id="${id}">${arr.map(([k, ar, en]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${esc(isEn() ? en : ar)}</option>`).join('')}</select>`;
  let body = '';
  if (R.step === 1) body = `<h2>${esc(steps[0])}</h2>
    <div class="row">${fld('rg-nar', esc(tt('الاسم القانوني (عربي)', 'Legal name (Arabic)')) + ' *', inp('rg-nar', d.nameAr || '', 'text', 'autocomplete="organization"'))}${fld('rg-nen', esc(tt('الاسم القانوني (إنجليزي)', 'Legal name (English)')), inp('rg-nen', d.nameEn || '', 'text', 'dir="ltr"'))}</div>
    <div class="row">${fld('rg-cr', esc(tt('رقم السجل التجاري', 'Commercial registration no.')) + ' *', inp('rg-cr', d.cr || '', 'text', 'dir="ltr" inputmode="numeric" maxlength="10" placeholder="10 أرقام"'), esc(tt('10 أرقام، ولا يُسجَّل السجل نفسه مرتين', '10 digits; each CR can be registered once')))}
      ${fld('rg-vat', esc(tt('الرقم الضريبي (اختياري)', 'VAT number (optional)')), inp('rg-vat', d.vat || '', 'text', 'dir="ltr" inputmode="numeric" maxlength="15"'), esc(tt('15 رقمًا يبدأ وينتهي بالرقم 3', '15 digits, starting and ending with 3')))}</div>
    <div class="row">${fld('rg-city', esc(tt('المدينة', 'City')), sel('rg-city', CITIES, d.city))}${fld('rg-size', esc(tt('حجم المنشأة', 'Company size')), sel('rg-size', SIZES, d.size))}</div>
    <fieldset class="field"><legend>${esc(tt('ما الذي تحتاجه؟', 'What do you need?'))}</legend><div class="checks">${INTERESTS.map(([k, ar, en]) => `<label class="check"><input type="checkbox" name="rg-int" value="${k}" ${d.interests.includes(k) ? 'checked' : ''}> ${esc(isEn() ? en : ar)}</label>`).join('')}</div></fieldset>
    <div class="toolbar"><button class="btn btn-gold" type="submit">${esc(tt('التالي', 'Next'))} ${ic('arrow')}</button></div>`;
  else if (R.step === 2) body = `<h2>${esc(steps[1])}</h2>
    <div class="row">${fld('rg-name', esc(tt('الاسم الكامل', 'Full name')) + ' *', inp('rg-name', d.name || '', 'text', 'autocomplete="name"'))}${fld('rg-title', esc(tt('المسمى الوظيفي', 'Job title')), inp('rg-title', d.title || '', 'text', 'autocomplete="organization-title"'))}</div>
    <div class="row">${fld('rg-phone', esc(tt('رقم الجوال', 'Mobile')) + ' *', inp('rg-phone', d.phone || '', 'tel', 'dir="ltr" autocomplete="tel" placeholder="05XXXXXXXX"'))}${fld('rg-email', esc(tt('البريد الإلكتروني', 'Email')) + ' *', inp('rg-email', d.email || '', 'email', 'dir="ltr" autocomplete="email"'))}</div>
    <div class="field"><label for="rg-pw">${esc(tt('كلمة المرور', 'Password'))} *</label><div class="pw-wrap">${inp('rg-pw', '', 'password', 'dir="ltr" autocomplete="new-password"')}${eyeBtn('rg-pw')}</div>${pwListHTML('rg-list')}</div>
    ${fld('rg-pw2', esc(tt('تأكيد كلمة المرور', 'Confirm password')) + ' *', inp('rg-pw2', '', 'password', 'dir="ltr" autocomplete="new-password"'))}
    <label class="check"><input type="checkbox" id="rg-ok" ${d.consent ? 'checked' : ''}> <span>${tt('أوافق على <a href="#terms">الشروط والأحكام</a> و<a href="#privacy">سياسة الخصوصية</a>، وعلى معالجة بياناتي وفق نظام حماية البيانات الشخصية.', 'I agree to the <a href="#terms">terms</a> and <a href="#privacy">privacy policy</a>, and to processing my data under the Personal Data Protection Law.')}</span></label>
    <span class="ferr" id="rg-ok-msg"></span>
    <label class="check"><input type="checkbox" id="rg-mk" ${d.marketing ? 'checked' : ''}> ${esc(tt('أرغب في تلقي أخبار الفعاليات والعروض (اختياري)', 'Send me event news and offers (optional)'))}</label>
    <div class="toolbar"><button class="btn btn-ghost" type="button" data-act="rg-back">${ic('back')} ${esc(tt('السابق', 'Back'))}</button><button class="btn btn-gold" type="submit">${esc(tt('إرسال رمز التحقق', 'Send verification code'))}</button></div>`;
  else if (R.step === 3) body = `<h2>${esc(steps[2])}</h2><p class="muted">${esc(tt(`أرسلنا رمزًا من 6 أرقام إلى ${maskPhone(d.phone)}.`, `We sent a 6-digit code to ${maskPhone(d.phone)}.`))}</p>
    <div class="notice"><div>${ic('info')} ${esc(tt('الرمز التجريبي:', 'Demo code:'))} <b class="ltr">${OTP}</b> <button type="button" class="lk" data-act="otp-fill">${esc(tt('تعبئة', 'Fill'))}</button></div></div>
    ${otpBoxes()}<div class="notice bad hidden" id="rg-otp-err" role="alert">${ic('alert')}<div id="rg-otp-t"></div></div>
    <div class="toolbar"><button class="btn btn-ghost" type="button" data-act="rg-back">${ic('back')} ${esc(tt('تعديل الرقم', 'Change number'))}</button><button class="btn btn-gold" type="submit">${esc(tt('تأكيد وإنشاء الحساب', 'Verify and create account'))}</button>
    <button type="button" class="lk" data-act="rg-resend" id="rg-resend">${esc(tt('إعادة الإرسال', 'Resend'))}</button></div>`;
  else body = `<div class="success" style="padding:10px 0"><div class="tick">${ic('check')}</div><h2>${esc(tt('أُنشئ حساب منشأتك', 'Your company account is ready'))}</h2>
    ${R.preview ? `<div class="notice warn">${ic('eye')}<div>${esc(tt('معاينة فقط — في نسخة العرض لا يُنشأ حساب فعلي.', 'Preview only — no account is created in the view-only demo.'))}</div></div>` : ''}
    <p><span class="chip warn">${esc(tt('قيد التحقق', 'Pending verification'))}</span></p>
    <p class="muted" style="max-width:52ch;margin:auto">${esc(tt('سيتواصل معك فريق المبيعات خلال يوم عمل. ارفع السجل التجاري وهوية المفوّض وعقد التأسيس من بوابتك لتسريع التحقق — بعده يُفعَّل حجز القاعات أونلاين وعروض الأسعار والفوترة.', 'Our sales team will contact you within one working day. Upload your CR, signatory ID and articles from your portal to speed up verification — then online booking, quotes and invoicing are activated.'))}</p>
    ${R.ref ? `<div class="ref">${esc(R.ref)}</div>` : ''}
    <div class="toolbar" style="justify-content:center">${R.preview ? `<a class="btn btn-gold" href="#login">${esc(tt('جرّب حساب منشأة قيد التحقق', 'Try a pending company account'))}</a>` : `<a class="btn btn-gold" href="#portal" data-act="p-go" data-k="documents">${ic('upload')} ${esc(tt('ارفع المستندات الآن', 'Upload documents now'))}</a><a class="btn btn-ghost" href="#portal" data-act="p-go" data-k="home">${esc(tt('بوابتي', 'My portal'))}</a>`}</div></div>`;
  const aside = authAside(tt('حساب واحد لمنشأتك', 'One account for your company'), [tt('احجز قاعات الاجتماعات أونلاين وتابع الحجوزات', 'Book meeting rooms online'), tt('عقودك وفواتيرك الضريبية وإيصالاتك في مكان واحد', 'Contracts, tax invoices and receipts in one place'), tt('أضف زملاءك بأدوار: حجز، مالي، عرض فقط', 'Add colleagues with roles: booking, finance, view only')]);
  pageShell('register', `<section class="auth"><div class="wrap auth-in">${aside}<div class="auth-card wide">
    <h1>${esc(tt('سجّل منشأتك', 'Register your company'))}</h1>
    <ol class="steps" aria-label="${esc(tt('خطوات التسجيل', 'Registration steps'))}">${steps.map((l, i) => `<li class="${i + 1 < R.step ? 'done' : i + 1 === R.step ? 'on' : ''}" ${i + 1 === R.step ? 'aria-current="step"' : ''}><i>${i + 1 < R.step ? ic('check') : i + 1}</i><span>${esc(l)}</span></li>`).join('')}</ol>
    <form class="form" id="rg-form" novalidate data-viewsafe>${body}</form>
    ${R.step < 4 ? `<p class="muted" style="font-size:13.5px">${esc(tt('لديك حساب؟', 'Have an account?'))} <a href="#login">${esc(tt('سجّل الدخول', 'Sign in'))}</a></p>` : ''}</div></div></section>`);
  const f = $('#rg-form');
  if (R.step === 2) bindPwList('rg-pw', 'rg-list');
  let readOtp = null; if (R.step === 3) { readOtp = bindOtp(f); regResendTimer(); }
  f.onsubmit = (e) => { e.preventDefault(); regNext(readOtp); };
};
function regResendTimer() {
  const b = $('#rg-resend'); if (!b) return; clearInterval(UI.regTm);
  const tick = () => { const left = 60 - Math.floor((Date.now() - UI.reg.sentAt) / 1000); if (!$('#rg-resend')) return clearInterval(UI.regTm); b.disabled = left > 0; b.textContent = left > 0 ? tt(`إعادة الإرسال بعد ${left} ث`, `Resend in ${left}s`) : tt('إعادة الإرسال', 'Resend'); if (left <= 0) clearInterval(UI.regTm); };
  tick(); UI.regTm = setInterval(tick, 1000);
}
function regNext(readOtp) {
  const R = UI.reg; const d = R.d; const v = (id) => ($('#' + id)?.value || '').trim();
  if (R.step === 1) {
    ['rg-nar', 'rg-cr', 'rg-vat'].forEach(i => fieldErr(i, '')); let bad = null; const err = (i, m) => { fieldErr(i, m); bad = bad || i; };
    Object.assign(d, {nameAr:v('rg-nar'), nameEn:v('rg-nen'), cr:v('rg-cr'), vat:v('rg-vat'), city:v('rg-city'), size:v('rg-size'), interests:$$('[name="rg-int"]:checked').map(i => i.value)});
    if (d.nameAr.length < 3) err('rg-nar', tt('أدخل الاسم القانوني كما في السجل التجاري', 'Enter the legal name as on the CR'));
    if (!/^\d{10}$/.test(d.cr)) err('rg-cr', tt('رقم السجل 10 أرقام', 'The CR number has 10 digits'));
    else if (S.companies.some(c => c.cr === d.cr)) err('rg-cr', tt('هذا السجل مسجّل لدينا. إن كان لشركتك فاطلب من مسؤول الحساب إضافتك، أو تواصل معنا.', 'This CR is already registered. Ask your company admin to add you, or contact us.'));
    if (d.vat && !/^3\d{13}3$/.test(d.vat)) err('rg-vat', tt('الرقم الضريبي 15 رقمًا يبدأ وينتهي بالرقم 3', 'VAT number: 15 digits starting and ending with 3'));
    if (bad) return $('#' + bad).focus();
    R.step = 2; return PAGES.register();
  }
  if (R.step === 2) {
    ['rg-name', 'rg-phone', 'rg-email', 'rg-pw', 'rg-pw2'].forEach(i => fieldErr(i, '')); $('#rg-ok-msg').textContent = ''; let bad = null; const err = (i, m) => { fieldErr(i, m); bad = bad || i; };
    Object.assign(d, {name:v('rg-name'), title:v('rg-title'), phone:v('rg-phone').replace(/[\s-]/g, ''), email:v('rg-email').toLowerCase(), consent:$('#rg-ok').checked, marketing:$('#rg-mk').checked});
    const pw = $('#rg-pw').value;
    if (d.name.split(/\s+/).length < 2) err('rg-name', tt('أدخل الاسم الأول واسم العائلة', 'Enter first and last name'));
    if (!/^05\d{8}$/.test(d.phone)) err('rg-phone', t('invalid_phone'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) err('rg-email', t('invalid_email'));
    else if (S.customers.some(c => c.email === d.email) || S.users.some(u => u.email === d.email)) err('rg-email', tt('هذا البريد مستخدم لحساب آخر. سجّل الدخول أو استعد كلمة المرور.', 'This email already has an account. Sign in or reset your password.'));
    if (!pwOk(pw)) err('rg-pw', tt('كلمة المرور لا تستوفي الشروط', 'The password does not meet the rules'));
    else if (pw !== $('#rg-pw2').value) err('rg-pw2', tt('كلمتا المرور غير متطابقتين', 'Passwords do not match'));
    if (!d.consent) { $('#rg-ok-msg').textContent = t('consent_required'); bad = bad || 'rg-ok'; }
    if (bad) return $('#' + bad).focus();
    R.pw = pw; R.step = 3; R.tries = 0; R.sentAt = Date.now(); (S.outbox = S.outbox || []).unshift({at:new Date().toISOString(), to:maskPhone(d.phone), subject:fillTpl('otp', {code:'••••••'}), channel:'sms'});
    return PAGES.register();
  }
  if (R.step === 3) {
    const code = readOtp ? readOtp() : '';
    if (R.tries >= 3) { $('#rg-otp-t').textContent = tt('تجاوزت عدد المحاولات. اطلب رمزًا جديدًا.', 'Too many attempts. Request a new code.'); return $('#rg-otp-err').classList.remove('hidden'); }
    if (code !== OTP) { R.tries++; $('#rg-otp-t').textContent = tt(`الرمز غير صحيح. المحاولات المتبقية: ${3 - R.tries}`, `Incorrect code. Attempts left: ${3 - R.tries}`); $('#rg-otp-err').classList.remove('hidden'); $$('[data-otp]').forEach(i => i.value = ''); $('[data-otp]').focus(); return; }
    if (VIEW_ONLY) { R.preview = true; R.ref = ''; R.step = 4; return PAGES.register(); }
    const co = {id:uid('co'), nameAr:d.nameAr, nameEn:d.nameEn, cr:d.cr, vat:d.vat, city:pick(CITIES, d.city), size:d.size, branch:'main', status:'pending', salesOwner:null,
      docs:Object.keys(DOC_TYPES).map(type => ({type, status:'missing', file:null, expiry:null, uploadedAt:null, reason:''})), interests:d.interests, createdAt:new Date().toISOString(), credit:0, pendingChange:null, suspendReason:''};
    const cu = {id:uid('cu'), name:d.name, title:d.title, email:d.email, phone:d.phone, pw:R.pw, pwHistory:[], companyId:co.id, companyRole:'admin', status:'active', lang:S.lang, files:[], marketing:d.marketing,
      notifs:[{at:new Date().toISOString(), text:'مرحبًا بك في وصل دائم. ارفع مستندات منشأتك لتسريع التحقق.'}], sessions:[]};
    S.companies.unshift(co); S.customers.push(cu);
    const r = createRequest('register', {name:d.name, phone:d.phone, email:d.email, source:'web', company:d.nameAr, interests:d.interests}, [], {companyId:co.id});
    co.salesOwner = r.assignee;
    audit('company', d.nameAr, null, {الحالة:'قيد التحقق', السجل:d.cr}, 'system');
    S.portal = cu.id; R.ref = r.id; R.step = 4; R.pw = null; save(); PAGES.register();
  }
}
ACT['rg-back'] = () => { UI.reg.step = Math.max(1, UI.reg.step - 1); PAGES.register(); };
ACT['rg-resend'] = () => { UI.reg.sentAt = Date.now(); UI.reg.tries = 0; toast(tt('أُرسل رمز جديد (محاكاة)', 'A new code was sent (simulated)')); regResendTimer(); $('#rg-otp-err')?.classList.add('hidden'); };

/* ================= workspaces ================= */
UI.ws = {branch:'', people:1, months:1, kind:'all', online:false};
const WS_FEATS = {
  room:[['شاشة عرض وسبورة', 'Display & whiteboard'], ['إنترنت ألياف ضوئية', 'Fibre internet'], ['ضيافة', 'Hospitality'], ['حجز بالساعة', 'Hourly booking']],
  office:[['أثاث كامل وخزائن', 'Fully furnished with storage'], ['دخول ذكي 24/7', 'Smart access 24/7'], ['عنوان تجاري رسمي', 'Official business address'], ['تنظيف يومي', 'Daily cleaning']],
  shared:[['مكتب لفريق صغير', 'Desk space for a small team'], ['طابعة وماسح', 'Printer & scanner'], ['ضيافة', 'Hospitality']],
  desk:[['مقعد في المساحة المفتوحة', 'Seat in the open space'], ['دخول خلال ساعات العمل', 'Access in working hours'], ['خزانة شخصية', 'Personal locker']],
  virtual:[['عنوان تجاري رسمي', 'Official business address'], ['استلام البريد والطرود', 'Mail & parcel handling'], ['قاعات بسعر الأعضاء', 'Member room rates']]
};
function wsCard(r) {
  const W = UI.ws; const cu = portalUser(); const room = r.kind === 'room'; const free = S.rules.freeHours[r.kind] || 0;
  const monthly = r.rate.month ? monthlyAfterDuration(r.rate.month, W.months) : 0; const d = durDisc(W.months);
  const price = room ? `<b class="num">${money(r.rate.hour)}</b><span>${esc(t('sar'))} / ${esc(t('hour'))}</span>` : `<b class="num">${money(monthly)}</b><span>${esc(t('sar'))} / ${esc(t('month'))}</span>${d && !room ? `<s class="muted num">${money(r.rate.month)}</s>` : ''}`;
  const online = S.rules.booking.onlineKinds.includes(r.kind);
  const cta = r.maintenance ? `<button class="btn btn-ghost" disabled>${esc(tt('غير متاح حاليًا', 'Not available'))}</button>`
    : room && cu ? `<button class="btn btn-gold" data-act="p-go" data-k="book" data-res="${r.id}">${ic('calendar')} ${esc(tt('احجز أونلاين', 'Book online'))}</button>`
    : room ? `<a class="btn btn-gold" href="#register">${esc(tt('سجّل منشأتك للحجز أونلاين', 'Register to book online'))}</a><button class="btn btn-ghost btn-sm" data-act="open-form" data-form="visit" data-branch="${r.branch}">${esc(tt('احجز زيارة', 'Book a visit'))}</button>`
    : `<button class="btn btn-gold" data-act="open-form" data-form="quote" data-kind="${r.kind}" data-months="${W.months}" data-branch="${r.branch}">${esc(tt('اطلب عرض سعر', 'Request a quote'))}</button><button class="btn btn-ghost btn-sm" data-act="open-form" data-form="visit" data-branch="${r.branch}">${esc(tt('احجز زيارة', 'Book a visit'))}</button>`;
  return `<article class="card ws-card ${r.maintenance ? 'off' : ''}"><div class="ws-art art-box">${galleryArt(r.art)}<span class="chip ws-kind">${esc(spaceKind(r))}</span>${r.maintenance ? `<span class="chip bad ws-flag">${esc(tt('تحت الصيانة', 'Under maintenance'))}</span>` : online ? `<span class="chip ok ws-flag">${ic('calendar')}${esc(tt('حجز أونلاين', 'Online booking'))}</span>` : ''}</div>
    <div class="ws-body"><h3>${esc(L(r.name))}</h3><p class="muted ws-meta">${ic('pin')}${esc(branchName(r.branch))} · ${ic('users')}${esc(tt(`حتى ${r.cap}`, `Up to ${r.cap}`))}</p>
    <div class="price">${price}</div>${!room && W.months > 1 ? `<span class="muted" style="font-size:13px">${esc(tt(`اشتراك ${W.months} أشهر — خصم ${d}%`, `${W.months}-month plan — ${d}% off`))}</span>` : ''}
    <ul>${(WS_FEATS[r.kind] || []).map(([a, e]) => `<li>${esc(isEn() ? e : a)}</li>`).join('')}${free ? `<li>${esc(tt(`${free} ساعات قاعات مجانية شهريًا`, `${free} free meeting-room hours a month`))}</li>` : ''}</ul>
    <div class="ws-cta">${cta}</div></div></article>`;
}
PAGES.workspaces = () => {
  const W = UI.ws;
  const kinds = [['all', 'الكل', 'All'], ['office', 'مكاتب مقفلة', 'Private offices'], ['shared', 'مكاتب مشتركة', 'Shared offices'], ['desk', 'مكاتب مرنة', 'Flexible desks'], ['virtual', 'مكاتب افتراضية', 'Virtual offices'], ['room', 'غرف اجتماعات', 'Meeting rooms']];
  const list = S.resources.filter(r => (!W.branch || r.branch === W.branch) && r.cap >= (W.kind === 'desk' || r.kind === 'desk' ? 1 : W.people) && (W.kind === 'all' || r.kind === W.kind) && (!W.online || S.rules.booking.onlineKinds.includes(r.kind)))
    .sort((a, b) => (a.maintenance - b.maintenance) || Object.keys(SPACE_KINDS).indexOf(a.kind) - Object.keys(SPACE_KINDS).indexOf(b.kind));
  const st = S.settings;
  pageShell('workspaces', `<section class="ws-hero"><div class="wrap ws-hero-in"><div>
      <div class="kicker">${esc(tt('مساحات العمل', 'Workspaces'))}</div><h1>${esc(tt('مكتبك جاهز في مكة المكرمة', 'Your office is ready in Makkah'))}</h1>
      <p>${esc(tt('مكاتب مقفلة ومشتركة ومرنة وافتراضية، وقاعات اجتماعات تُحجز أونلاين — بعقود رسمية وأسعار واضحة.', 'Private, shared, flexible and virtual offices, plus meeting rooms you book online — with official contracts and clear prices.'))}</p>
      <div class="ws-chips">${[['key', 'دخول ذكي 24/7', 'Smart access 24/7'], ['globe', 'إنترنت ألياف ضوئية', 'Fibre internet'], ['heart', 'ضيافة واستقبال', 'Hospitality & reception'], ['contract', 'عقود رسمية', 'Official contracts']].map(([i, a, e]) => `<span class="chip">${ic(i)}${esc(isEn() ? e : a)}</span>`).join('')}</div></div>
      <div class="ws-hero-art art-box">${galleryArt('office')}</div></div></section>
    <section class="block" style="padding-top:28px"><div class="wrap">
      <div class="ws-search card" role="search" data-viewsafe>
        <div class="field"><label for="ws-branch">${esc(tt('الفرع', 'Branch'))}</label><select class="input" id="ws-branch"><option value="">${esc(tt('كل الفروع', 'All branches'))}</option>${S.branches.map(b => `<option value="${b.id}" ${W.branch === b.id ? 'selected' : ''}>${esc(branchName(b.id))}</option>`).join('')}</select></div>
        <div class="field"><label for="ws-people">${esc(tt('عدد الأشخاص', 'People'))}</label><input class="input num" id="ws-people" type="number" min="1" max="40" value="${W.people}"></div>
        <div class="field"><label for="ws-months">${esc(tt('مدة الاشتراك', 'Subscription'))}</label><select class="input" id="ws-months">${DURATIONS.map(([v, a, e]) => `<option value="${v}" ${W.months === v ? 'selected' : ''}>${esc(isEn() ? e : a)}${durDisc(v) ? (isEn() ? ` (${durDisc(v)}% off)` : ` — خصم ${durDisc(v)}٪`) : ''}</option>`).join('')}</select></div>
        <label class="check ws-online"><input type="checkbox" id="ws-online" ${W.online ? 'checked' : ''}> ${esc(tt('القابلة للحجز أونلاين فقط', 'Bookable online only'))}</label></div>
      <div class="ws-tabs" role="tablist" data-viewsafe>${kinds.map(([k, a, e]) => `<button role="tab" class="${W.kind === k ? 'on' : ''}" aria-selected="${W.kind === k}" data-act="ws-kind" data-k="${k}">${esc(isEn() ? e : a)} <span class="num">${k === 'all' ? S.resources.length : S.resources.filter(r => r.kind === k).length}</span></button>`).join('')}</div>
      <p class="muted" style="margin:6px 0 18px;font-size:14px" aria-live="polite">${esc(tt(`${list.length} مساحة مطابقة — الأسعار غير شاملة ضريبة القيمة المضافة 15%`, `${list.length} matching spaces — prices exclude 15% VAT`))}</p>
      <div class="grid g3 ws-grid">${list.map(wsCard).join('') || `<div class="card empty-card">${ic('filter')}<p>${esc(tt('لا توجد مساحة مطابقة. غيّر عدد الأشخاص أو الفرع، أو اطلب عرض سعر مخصصًا.', 'No matching space. Change the filters or request a custom quote.'))}</p><button class="btn btn-gold btn-sm" data-act="open-form" data-form="quote">${esc(tt('اطلب عرض سعر', 'Request a quote'))}</button></div>`}</div>
    </div></section>
    <section class="block alt"><div class="wrap"><div class="sec-head"><div><div class="kicker">${esc(tt('كيف تبدأ', 'How it works'))}</div><h2>${esc(tt('من الطلب إلى مكتبك في ثلاث خطوات', 'From request to your desk in three steps'))}</h2></div></div>
      <div class="grid g3">${[['tag', 'اطلب عرض سعر أو زيارة', 'Request a quote or a visit', 'يرد عليك فريق المبيعات خلال يوم عمل بعرض مكتوب.', 'Sales replies within a working day with a written offer.'], ['contract', 'وقّع العقد', 'Sign the contract', 'عقد رسمي ثنائي اللغة، وفاتورة ضريبية متوافقة مع هيئة الزكاة.', 'An official bilingual contract and a ZATCA-compliant tax invoice.'], ['key', 'ابدأ العمل', 'Move in', 'بطاقة دخول ذكي، وبوابة لحجز القاعات ومتابعة الفواتير.', 'A smart access card and a portal for rooms and invoices.']].map(([i, a, e, da, de], k) => `<div class="card step-card"><span class="n num">${k + 1}</span><div class="ic">${ic(i)}</div><h3>${esc(isEn() ? e : a)}</h3><p class="muted">${esc(isEn() ? de : da)}</p></div>`).join('')}</div></div></section>
    <section class="block"><div class="wrap ws-map"><div class="map-box art-box">${mapArt()}</div><div><div class="kicker">${esc(tt('الموقع والمرافق', 'Location & facilities'))}</div><h2>${esc(branchName('main'))}</h2>
      <p class="muted">${esc(L(st.address))}</p><p class="muted">${ic('clock')} ${esc(L(st.hours))}</p>
      <ul class="facil">${[['مواقف سيارات', 'Parking'], ['مصلى', 'Prayer room'], ['مطبخ وضيافة', 'Kitchen & hospitality'], ['استقبال للزوار', 'Visitor reception'], ['طابعات', 'Printers'], ['كاميرات وأمن', 'CCTV & security']].map(([a, e]) => `<li>${ic('check')}${esc(isEn() ? e : a)}</li>`).join('')}</ul>
      <div class="toolbar"><a class="btn btn-ghost" href="${esc(st.mapUrl)}" target="_blank" rel="noopener">${ic('pin')} ${esc(tt('الاتجاهات', 'Directions'))}</a><button class="btn btn-gold" data-act="open-form" data-form="visit">${esc(tt('احجز زيارة', 'Book a visit'))}</button></div></div></div></section>`);
  const upd = () => { const y = scrollY; PAGES.workspaces(); window.scrollTo(0, y); };
  $('#ws-branch').onchange = (e) => { W.branch = e.target.value; upd(); };
  $('#ws-months').onchange = (e) => { W.months = +e.target.value; upd(); };
  $('#ws-online').onchange = (e) => { W.online = e.target.checked; upd(); };
  let tm; $('#ws-people').oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => { W.people = Math.max(1, +e.target.value || 1); upd(); const p = $('#ws-people'); p.focus(); }, 400); };
};
ACT['ws-kind'] = (el) => { UI.ws.kind = el.dataset.k; const y = scrollY; PAGES.workspaces(); window.scrollTo(0, y); };

/* ================= privacy & terms (drafts for legal review; values come from the business rules) ================= */
function legalPage(view, title, sections) {
  pageShell(view, `<section class="legal"><div class="wrap legal-in"><nav class="legal-toc" aria-label="${esc(tt('المحتويات', 'Contents'))}"><b>${esc(tt('المحتويات', 'Contents'))}</b>${sections.map((s, i) => `<a href="#${view}" data-act="legal-go" data-to="lg-${i}">${esc(s[0])}</a>`).join('')}</nav>
    <article><div class="kicker">${esc(tt('مسودة — تُراجَع من مستشار قانوني قبل الإطلاق', 'Draft — to be reviewed by legal counsel before launch'))}</div><h1>${esc(title)}</h1>
    <p class="muted">${esc(tt('آخر تحديث:', 'Last updated:'))} ${esc(dualDate(today()))}</p>
    ${sections.map(([h, ps], i) => `<section id="lg-${i}"><h2>${esc(h)}</h2>${ps.map(p => Array.isArray(p) ? `<ul>${p.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p>${esc(p)}</p>`).join('')}</section>`).join('')}
    <div class="notice">${ic('mail')}<div>${esc(tt('للاستفسار أو ممارسة حقوقك:', 'Questions or requests:'))} <a href="mailto:${esc(S.settings.email)}">${esc(S.settings.email)}</a></div></div></article></div></section>`);
}
ACT['legal-go'] = (el, e) => { e.preventDefault(); document.getElementById(el.dataset.to)?.scrollIntoView({behavior:'smooth'}); };
PAGES.privacy = () => {
  const en = isEn();
  legalPage('privacy', tt('سياسة الخصوصية', 'Privacy policy'), en ? [
    ['Who we are', [`${L(S.settings.legalName, 'en')} operates Wasl Daim in Makkah. We process personal data under the Saudi Personal Data Protection Law (PDPL) and its regulations.`]],
    ['What we collect', [['Contact details: name, mobile, email, job title', 'Company data: legal name, CR and VAT numbers, address, documents you upload', 'Booking, contract, invoice and payment records', 'Technical data: sign-in times, device type and IP address for security']]],
    ['Why we use it', [['To answer requests, prepare quotes and contracts', 'To manage bookings, invoices and payments, and meet ZATCA obligations', 'To protect accounts (2-step verification, lockouts, audit logs)', 'Marketing messages only if you opt in — you can opt out at any time']]],
    ['Where data is stored', ['Data and files are hosted inside the Kingdom of Saudi Arabia. Access is limited by role, and every export is logged with personal data masked.']],
    ['Sharing', ['We do not sell personal data. We share it only with service providers bound by contract (hosting, SMS, e-invoicing) or when required by law.']],
    ['How long we keep it', ['Account data for the life of the relationship; invoices and accounting records for the period required by law; unconverted enquiries for up to 24 months.']],
    ['Your rights', [['Know what we hold about you and get a copy', 'Correct or complete your data', 'Ask for deletion where no legal obligation prevents it', 'Withdraw consent for marketing']]],
    ['Security', ['Encrypted connections, strong password rules, 2-step verification for staff, automatic session expiry, daily backups and a full audit log.']]
  ] : [
    ['من نحن', [`${L(S.settings.legalName, 'ar')} تدير وصل دائم في مكة المكرمة، وتعالج البيانات الشخصية وفق نظام حماية البيانات الشخصية في المملكة العربية السعودية ولوائحه.`]],
    ['البيانات التي نجمعها', [['بيانات التواصل: الاسم والجوال والبريد والمسمى الوظيفي', 'بيانات المنشأة: الاسم القانوني ورقم السجل والرقم الضريبي والعنوان والمستندات المرفوعة', 'سجلات الحجوزات والعقود والفواتير والمدفوعات', 'بيانات تقنية للحماية: أوقات الدخول ونوع الجهاز وعنوان IP']]],
    ['لماذا نستخدمها', [['للرد على الطلبات وإعداد عروض الأسعار والعقود', 'لإدارة الحجوزات والفواتير والمدفوعات والوفاء بمتطلبات هيئة الزكاة والضريبة والجمارك', 'لحماية الحسابات: التحقق بخطوتين والإيقاف المؤقت وسجل العمليات', 'الرسائل التسويقية فقط إذا وافقت عليها، ويمكنك إلغاؤها في أي وقت']]],
    ['أين تُحفظ البيانات', ['تُستضاف البيانات والملفات داخل المملكة العربية السعودية. يُقيَّد الوصول حسب الدور الوظيفي، وتُسجَّل كل عملية تصدير مع إخفاء البيانات الشخصية.']],
    ['المشاركة مع الغير', ['لا نبيع البيانات الشخصية. نشاركها فقط مع مزودي خدمات ملتزمين تعاقديًا (الاستضافة، الرسائل النصية، الفوترة الإلكترونية) أو عندما يلزمنا النظام بذلك.']],
    ['مدة الاحتفاظ', ['بيانات الحساب طوال مدة العلاقة، والفواتير والسجلات المحاسبية للمدة التي يحددها النظام، والاستفسارات التي لم تتحول إلى تعاقد حتى 24 شهرًا.']],
    ['حقوقك', [['العلم بالبيانات التي نحتفظ بها والحصول على نسخة منها', 'تصحيح بياناتك أو استكمالها', 'طلب الإتلاف ما لم يمنع ذلك التزام نظامي', 'سحب موافقتك على الرسائل التسويقية']]],
    ['أمن البيانات', ['اتصال مشفّر، وسياسة كلمات مرور قوية، وتحقق بخطوتين للموظفين، وإنهاء تلقائي للجلسات، ونسخ احتياطي يومي، وسجل كامل للعمليات.']]
  ]);
};
PAGES.terms = () => {
  const b = S.rules.booking, bl = S.rules.billing, en = isEn();
  legalPage('terms', tt('الشروط والأحكام', 'Terms & conditions'), en ? [
    ['Accounts', ['Each company has one main admin who can add colleagues with booking, finance or view-only roles. Online booking, quotes and invoicing start after the company documents are verified.']],
    ['Meeting-room bookings', [[`A booking request holds the slot for ${b.holdHours} hours until our team confirms it`, `Bookings are made up to ${b.daysAhead} days ahead, ${b.minH}–${b.maxH} hours, within working hours (${b.workStart}:00–${b.workEnd}:00), excluding Fridays, Saturdays and public holidays`, `Up to ${b.maxPending} pending requests per company at a time`, `Free cancellation more than ${b.cancelFreeHours} hours before the start; later cancellations and no-shows are charged`, 'To reschedule, cancel and make a new booking']]],
    ['Contracts', [`We send a renewal notice ${S.rules.contracts.renewalAlertDays} days before the end date. Longer plans get a discount (3 months ${S.rules.durationDiscounts[3]}%, 6 months ${S.rules.durationDiscounts[6]}%, 12 months ${S.rules.durationDiscounts[12]}%). Early termination follows the contract terms. Deposits are refunded at the end after settling dues.`]],
    ['Invoices and payment', [[`Invoices are tax invoices including 15% VAT and are due within ${bl.dueDays} days`, 'Pay by bank transfer quoting the invoice number, then upload the receipt in the portal', 'Issued invoices cannot be edited; corrections are made by credit note', `Late payments: reminder after ${bl.reminders.remind} days, formal warning after ${bl.reminders.warn} days, service suspension after ${bl.reminders.suspend} days`]]],
    ['Use of the premises', ['Members follow the house rules, keep shared areas tidy and register their guests at reception.']],
    ['Governing law', ['These terms are governed by the laws of the Kingdom of Saudi Arabia.']]
  ] : [
    ['الحسابات', ['لكل منشأة مسؤول رئيسي يضيف زملاءه بأدوار: حجز القاعات، أو مالي، أو عرض فقط. يُفعَّل الحجز أونلاين وعروض الأسعار والفوترة بعد التحقق من مستندات المنشأة.']],
    ['حجز قاعات الاجتماعات', [[`يُحجز الموعد للمنشأة مدة ${b.holdHours} ساعات حتى يؤكده فريقنا`, `الحجز حتى ${b.daysAhead} يومًا مقدمًا، من ${b.minH} إلى ${b.maxH} ساعات، ضمن ساعات العمل (${b.workStart}:00–${b.workEnd}:00)، عدا الجمعة والسبت والإجازات الرسمية`, `بحد أقصى ${b.maxPending} طلبات معلّقة للمنشأة في الوقت نفسه`, `الإلغاء مجاني قبل الموعد بأكثر من ${b.cancelFreeHours} ساعة، وبعدها أو عند عدم الحضور يُحتسب الحجز`, 'لتغيير الموعد: ألغِ الحجز واحجز موعدًا جديدًا']]],
    ['العقود', [`نرسل تنبيه التجديد قبل نهاية العقد بـ ${S.rules.contracts.renewalAlertDays} يومًا. للاشتراكات الأطول خصم: 3 أشهر ${S.rules.durationDiscounts[3]}%، و6 أشهر ${S.rules.durationDiscounts[6]}%، وسنة ${S.rules.durationDiscounts[12]}%. الإنهاء المبكر وفق بنود العقد، ويُسترد التأمين عند الانتهاء بعد تسوية المستحقات.`]],
    ['الفواتير والدفع', [[`الفواتير ضريبية شاملة ضريبة القيمة المضافة 15% وتستحق خلال ${bl.dueDays} أيام`, 'الدفع بتحويل بنكي مع ذكر رقم الفاتورة، ثم رفع الإيصال من البوابة', 'لا تُعدَّل الفاتورة بعد إصدارها، ويُصحَّح الخطأ بإشعار دائن', `التأخر: تذكير بعد ${bl.reminders.remind} أيام، وإنذار بعد ${bl.reminders.warn} يومًا، وإيقاف الخدمة بعد ${bl.reminders.suspend} يومًا`]]],
    ['استخدام المكان', ['يلتزم الأعضاء بتعليمات المكان، والمحافظة على المساحات المشتركة، وتسجيل الزوار لدى الاستقبال.']],
    ['النظام الحاكم', ['تخضع هذه الشروط لأنظمة المملكة العربية السعودية.']]
  ]);
};
