/* وصل دائم — public website */
'use strict';

/* ---------- gold line-art (no stock photos: the client supplies real photos later) ---------- */
const GOLD = '#D9B35B';
function slideArt(kind, img) {
  if (img) return `<img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:28px">`;
  const defs = `<defs><linearGradient id="gl-${kind}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3D88E"/><stop offset="1" stop-color="#A97C28"/></linearGradient>
    <radialGradient id="gw-${kind}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#D9B35B" stop-opacity=".35"/><stop offset="1" stop-color="#D9B35B" stop-opacity="0"/></radialGradient></defs>`;
  const S2 = `stroke="url(#gl-${kind})" fill="none"`;
  let g = '';
  if (kind === 'arches') {
    for (let i = 0; i < 5; i++) { const w = 300 - i * 46, x = 200 - w / 2, top = 70 + i * 34; g += `<path d="M${x} 380 V${top + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${top + w / 2} V380" ${S2} stroke-width="${1.6 - i * .15}" opacity="${1 - i * .14}"/>`; }
    g += `<line x1="30" y1="380" x2="370" y2="380" ${S2} stroke-width="1.2"/>`;
  } else if (kind === 'steps') {
    for (let i = 0; i < 6; i++) { const h = 40 + i * 46; g += `<rect x="${42 + i * 54}" y="${370 - h}" width="38" height="${h}" rx="6" ${S2} stroke-width="1.4" opacity="${.45 + i * .1}"/>`; }
    g += `<path d="M40 330 C120 320 170 250 230 190 S330 70 370 50" ${S2} stroke-width="2"/><circle cx="370" cy="50" r="7" fill="${GOLD}"/>`;
    g += `<path d="M352 44 L372 48 L366 68" ${S2} stroke-width="2"/>`;
  } else {
    g += `<rect x="40" y="40" width="320" height="320" rx="14" ${S2} stroke-width="1.6"/>`;
    g += `<path d="M40 150 H200 M200 40 V360 M200 250 H360 M120 150 V360 M280 40 V250" ${S2} stroke-width="1.2" opacity=".8"/>`;
    g += `<path d="M200 105 A30 30 0 0 1 230 135 M120 210 A28 28 0 0 0 148 238 M280 190 A30 30 0 0 1 310 220" ${S2} stroke-width="1" opacity=".7"/>`;
    for (let i = 0; i < 4; i++) g += `<rect x="${222 + (i % 2) * 70}" y="${272 + Math.floor(i / 2) * 44}" width="46" height="24" rx="5" ${S2} stroke-width="1" opacity=".75"/>`;
    for (let i = 0; i < 3; i++) g += `<circle cx="${70 + i * 40}" cy="95" r="12" ${S2} stroke-width="1" opacity=".7"/>`;
  }
  return `<svg viewBox="0 0 400 420" role="img" aria-label="">${defs}<circle cx="200" cy="210" r="190" fill="url(#gw-${kind})"/>
    <g class="drift">${g}${kind === 'plan' ? '' : `<image href="assets/emblem.webp" x="150" y="${kind === 'steps' ? 120 : 150}" width="100" height="136"/>`}</g></svg>`;
}
function galleryArt(kind) {
  const L2 = 'stroke="#D9B35B" fill="none" stroke-linecap="round"';
  let g = '';
  const rnd = (n) => Array.from({length:n}, (_, i) => i);
  if (kind === 'open') { rnd(3).forEach(r => rnd(4).forEach(c => { const x = 40 + c * 85, y = 50 + r * 75; g += `<rect x="${x}" y="${y}" width="62" height="34" rx="5" ${L2} stroke-width="1.3"/><circle cx="${x + 18}" cy="${y + 48}" r="7" ${L2}/><circle cx="${x + 44}" cy="${y + 48}" r="7" ${L2}/>`; })); }
  if (kind === 'office') { rnd(3).forEach(c => { const x = 30 + c * 120; g += `<rect x="${x}" y="40" width="100" height="220" rx="6" ${L2} stroke-width="1.4"/><path d="M${x + 70} 260 A30 30 0 0 0 ${x + 100} 230" ${L2}/><rect x="${x + 20}" y="70" width="60" height="30" rx="4" ${L2}/><circle cx="${x + 50}" cy="120" r="8" ${L2}/>`; }); }
  if (kind === 'meeting') { g += `<rect x="90" y="110" width="220" height="80" rx="40" ${L2} stroke-width="1.6"/>`; rnd(5).forEach(i => { g += `<circle cx="${120 + i * 40}" cy="88" r="10" ${L2}/><circle cx="${120 + i * 40}" cy="212" r="10" ${L2}/>`; }); g += `<circle cx="70" cy="150" r="10" ${L2}/><circle cx="330" cy="150" r="10" ${L2}/><line x1="150" y1="40" x2="250" y2="40" ${L2} stroke-width="3"/>`; }
  if (kind === 'lounge') { [[110,110],[260,90],[190,210],[320,210]].forEach(([x, y]) => { g += `<circle cx="${x}" cy="${y}" r="28" ${L2} stroke-width="1.4"/>`; rnd(3).forEach(i => { const a = i * 2.1; g += `<circle cx="${x + Math.cos(a) * 46}" cy="${y + Math.sin(a) * 46}" r="9" ${L2}/>`; }); }); g += `<path d="M30 270 H140 V250 H30" ${L2} stroke-width="1.4"/>`; }
  if (kind === 'hall') { g += `<rect x="110" y="34" width="180" height="36" rx="6" ${L2} stroke-width="1.6"/>`; rnd(4).forEach(r => rnd(8).forEach(c => { g += `<rect x="${62 + c * 36}" y="${110 + r * 40}" width="22" height="18" rx="4" ${L2}/>`; })); }
  if (kind === 'booth') { rnd(5).forEach(i => { const x = 30 + i * 72; g += `<rect x="${x}" y="70" width="56" height="170" rx="20" ${L2} stroke-width="1.5"/><circle cx="${x + 28}" cy="130" r="9" ${L2}/><rect x="${x + 14}" y="160" width="28" height="14" rx="3" ${L2}/>`; }); }
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="">
    <defs><linearGradient id="gb-${kind}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1D1B16"/><stop offset="1" stop-color="#0B0B0C"/></linearGradient></defs>
    <rect width="400" height="300" fill="url(#gb-${kind})"/><g opacity=".9">${g}</g></svg>`;
}
function mapArt() {
  return `<svg viewBox="0 0 600 260" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(t('address'))}">
    <rect width="600" height="260" fill="var(--surface-2)"/>
    <g stroke="var(--line)" stroke-width="14" fill="none" stroke-linecap="round"><path d="M-10 70 H620"/><path d="M-10 190 C150 180 260 210 620 160"/><path d="M140 -10 V280"/><path d="M420 -10 C430 90 400 170 440 280"/></g>
    <g stroke="var(--line)" stroke-width="5" fill="none"><path d="M-10 130 H620"/><path d="M270 -10 V280"/><path d="M60 -10 L200 280"/><path d="M520 -10 V280"/></g>
    <circle cx="350" cy="120" r="34" fill="var(--gold-soft)"/><path d="M350 140 s-20-17-20-33a20 20 0 0 1 40 0c0 16-20 33-20 33z" fill="var(--gold)"/><circle cx="350" cy="106" r="7" fill="var(--surface)"/></svg>`;
}

/* ---------- partials ---------- */
const navItems = () => [['about', 'nav_about'], ['incubator', 'nav_incubator'], ['accelerator', 'nav_accelerator'], ['spaces', 'nav_spaces'], ['services', 'nav_services'], ['opportunities', 'nav_opps'], ['events', 'nav_events'], ['contact', 'nav_contact']];
const sec = (k) => S.content.sections[k] || {};
function secHead(k, extra = '') {
  const s = sec(k);
  return `<div class="sec-head"><div><div class="kicker">${esc(L(s.kicker))}</div><h2>${esc(L(s.title))}</h2>${s.text ? `<p>${esc(L(s.text))}</p>` : ''}</div>${extra}</div>`;
}
function headerHTML() {
  return `<div class="topline"><div class="wrap topline-in"><div class="tl-info">${esc(t(VIEW_ONLY ? 'view_bar' : 'demo_bar'))} <a href="#admin">${esc(t('demo_admin'))}</a>·<a href="#portal">${esc(t('demo_portal'))}</a>${VIEW_ONLY ? '' : `·<button class="lk" data-act="reset-data">${esc(t('demo_reset'))}</button>`}</div>
    <div class="tl-tools"><button class="tbtn" data-act="lang" lang="${isEn() ? 'ar' : 'en'}" aria-label="${isEn() ? 'العربية' : 'English'}">${ic('globe')}${isEn() ? 'العربية' : 'English'}</button>
      <button class="tbtn" data-act="toggle-theme" aria-label="${esc(t('theme'))}" title="${esc(t('theme'))}">${ic(currentDark() ? 'sun' : 'moon')}</button>
      <button class="tbtn" data-act="login-choice">${ic('user')}${esc(t('login'))}</button></div></div></div>
  <header class="site-header" id="top"><div class="wrap nav">
    <a class="brand" href="#" data-act="to-top" aria-label="${esc(L(S.settings.name))}"><span class="brand-mark" aria-hidden="true"></span>
      <span class="brand-name">${esc(L(S.settings.name))}<small>${esc(L(S.settings.tagline))}</small></span></a>
    <ul class="nav-links"><li><a href="#" data-act="to-top">${esc(t('nav_home'))}</a></li>${navItems().map(([id, k]) => `<li><a href="#${id}">${esc(t(k))}</a></li>`).join('')}</ul>
    <div class="nav-tools">
      <button class="btn btn-gold btn-sm" data-act="apply">${esc(t('apply'))}</button>
      <button class="icon-btn menu-btn" data-act="drawer" aria-label="${esc(t('menu'))}" aria-expanded="false">${ic('menu')}</button>
    </div></div></header>
  <div class="drawer" id="drawer"><div class="drawer-backdrop" data-act="drawer"></div><nav class="drawer-panel" aria-label="${esc(t('menu'))}">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span class="brand"><span class="brand-mark"></span><span class="brand-name">${esc(L(S.settings.name))}</span></span>
    <button class="icon-btn" data-act="drawer" aria-label="${esc(t('close'))}">${ic('close')}</button></div>
    <a class="dl" href="#" data-act="drawer-top">${esc(t('nav_home'))}</a>
    ${navItems().map(([id, k]) => `<a class="dl" href="#${id}" data-act="drawer-go" data-to="${id}">${esc(t(k))}</a>`).join('')}
    <div style="display:grid;gap:8px;margin-top:14px"><button class="btn btn-ghost" data-act="login-choice">${ic('user')} ${esc(t('login'))}</button><button class="btn btn-gold" data-act="apply">${esc(t('apply'))}</button>
    <p class="muted" style="font-size:12.5px;margin-top:8px">${esc(t(VIEW_ONLY ? 'view_bar' : 'demo_bar'))} <a href="#admin">${esc(t('demo_admin'))}</a> · <a href="#portal">${esc(t('demo_portal'))}</a></p></div></nav></div>`;
}
function heroHTML() {
  const sl = S.content.slides;
  return `<section class="hero" aria-roledescription="carousel" aria-label="${esc(L(S.settings.name))}"><div class="wrap"><div class="slides">
    ${sl.map((s, i) => `<div class="slide${i === 0 ? ' active' : ''}" data-i="${i}" role="group" aria-roledescription="slide" aria-label="${i + 1} / ${sl.length}" ${i ? 'aria-hidden="true"' : ''}>
      <div><div class="eyebrow">${esc(L(s.eyebrow))}</div><${i === 0 ? 'h1' : 'h2'} class="h1">${esc(L(s.title))}</${i === 0 ? 'h1' : 'h2'}><p class="lead">${esc(L(s.text))}</p>
      <div class="ctas"><button class="btn btn-gold" data-act="open-form" data-form="${esc(s.cta1.form)}">${esc(L(s.cta1.label))} ${ic('arrow')}</button>
      <a class="btn btn-ghost-light" href="${esc(s.cta2.href)}">${esc(L(s.cta2.label))}</a></div></div>
      <div class="slide-art">${slideArt(s.art, s.img)}</div></div>`).join('')}
    </div><div class="slider-ui"><div class="dots" role="tablist">${sl.map((s, i) => `<button class="${i === 0 ? 'on' : ''}" data-act="slide" data-i="${i}" aria-label="${i + 1}" role="tab"></button>`).join('')}</div>
    <div class="arrows"><button data-act="slide-prev" aria-label="${esc(t('prev'))}">${ic('back')}</button><button data-act="slide-next" aria-label="${esc(t('next'))}">${ic('arrow')}</button></div></div></div></section>`;
}
function aboutHTML() {
  const s = sec('about');
  return `<section class="block" id="about"><div class="wrap about"><div>
    <div class="sec-head" style="margin-bottom:22px"><div><div class="kicker">${esc(L(s.kicker))}</div><h2>${esc(L(s.title))}</h2></div></div>
    <p class="lead">${esc(L(s.lead))}</p><p>${esc(L(s.text))}</p>
    <div class="toolbar" style="margin-top:26px"><button class="btn btn-dark" data-act="open-form" data-form="contact">${esc(t('nav_contact'))}</button><a class="btn btn-ghost" href="#spaces">${esc(t('nav_spaces'))}</a></div></div>
    <div class="values">${S.content.values.map(v => `<div class="card value"><div class="ic">${ic(v.icon)}</div><div><h3>${esc(L(v.title))}</h3><p class="muted">${esc(L(v.text))}</p></div></div>`).join('')}</div></div></section>`;
}
function statsHTML() {
  return `<section class="dark-band" aria-label="${esc(t('stats_note'))}"><div class="wrap"><div class="stats">
    ${S.content.stats.map(st => `<div class="stat"><div class="v num"><span class="count" data-to="${+st.v}">${money(st.v)}</span><small>${esc(L(st.suf))}</small></div><div class="l">${esc(L(st.label))}</div></div>`).join('')}
    </div></div></section>`;
}
function partnersHTML() {
  const p = S.content.partners; const item = (x) => `<div class="partner">${x.img ? `<img src="${x.img}" alt="${esc(L(x.name))}">` : `<span class="pm">${esc(x.mark)}</span>${esc(L(x.name))}`}</div>`;
  return `<section class="block tight"><div class="wrap">${secHead('partners')}<div class="marquee" aria-label="${esc(L(sec('partners').title))}"><div class="marquee-track">${p.map(item).join('')}${p.map(item).join('').replace(/class="partner"/g, 'class="partner" aria-hidden="true"')}</div></div></div></section>`;
}
function programHTML(key, dark) {
  const p = S.content[key]; const s = sec(key);
  return `<section class="block ${dark ? 'dark-band' : ''}" id="${key}"><div class="wrap program ${dark ? 'rev' : ''}">
    <div class="program-intro"><div class="sec-head" style="margin:0"><div><div class="kicker">${esc(L(s.kicker))}</div></div></div><h2>${esc(L(s.title))}</h2><p>${esc(L(s.text))}</p>
      <div class="facts">${p.facts.map(f => `<div class="fact"><b>${esc(L(f.v))}</b><span>${esc(L(f.l))}</span></div>`).join('')}</div>
      <ul class="benefits">${p.benefits.map(b => `<li>${ic('check')}<span>${esc(L(b))}</span></li>`).join('')}</ul>
      <button class="btn btn-gold" data-act="open-form" data-form="${key}">${esc(t(key === 'incubator' ? 'apply_incubator' : 'apply_accelerator'))} ${ic('arrow')}</button></div>
    <div class="stages">${p.stages.map((st, i) => `<div class="stage"><div class="n num">${i + 1}</div><div><h3>${esc(L(st.t))}</h3><p>${esc(L(st.d))}</p></div></div>`).join('')}</div>
  </div></section>`;
}
const unitLabel = (u) => t(u === 'hour' ? 'hour' : u === 'day' ? 'day' : 'month');
function spacesHTML() {
  return `<section class="block alt" id="spaces"><div class="wrap">${secHead('spaces')}<div class="grid g4">
    ${S.content.packages.map(p => `<article class="card hov price-card ${p.featured ? 'featured' : ''}">${p.featured ? `<span class="chip badge">${esc(t('featured'))}</span>` : ''}
      <div class="ic">${ic(p.icon)}</div><h3>${esc(L(p.name))}</h3><p class="desc">${esc(L(p.desc))}</p>
      <div class="price"><b class="num">${money(p.price)}</b><span>${esc(t('sar'))} ${t('per')} ${esc(unitLabel(p.unit))}</span></div>
      <span class="muted" style="font-size:13px;margin-top:-8px">${esc(L(p.alt))}</span>
      <ul>${p.feats.map(f => `<li>${esc(L(f))}</li>`).join('')}</ul>
      <button class="btn ${p.featured ? 'btn-gold' : 'btn-ghost'}" data-act="open-form" data-form="booking" data-res="${esc(p.resource)}" data-unit="${esc(p.unit)}">${esc(t('book_now'))}</button></article>`).join('')}
    </div></div></section>`;
}
function servicesHTML() {
  return `<section class="block" id="services"><div class="wrap">${secHead('services')}<div class="grid g3">
    ${S.content.services.map(s => `<article class="card hov svc"><div class="ic">${ic(s.icon)}</div><h3>${esc(L(s.name))}</h3><p>${esc(L(s.text))}</p>
      <button class="btn btn-ghost btn-sm" style="justify-self:start;margin-top:auto" data-act="open-form" data-form="contact" data-topic="general">${esc(t('request_service'))}</button></article>`).join('')}
    </div></div></section>`;
}
function oppsHTML() {
  const list = S.content.opportunities.filter(o => o.status === 'published');
  return `<section class="block alt" id="opportunities"><div class="wrap">${secHead('opps', `<button class="btn btn-dark" data-act="open-form" data-form="opportunity">${esc(t('submit_project'))}</button>`)}<div class="grid g3">
    ${list.map(o => `<article class="card hov opp"><div class="top"><span class="chip">${esc(L(SECTORS[o.sector]))}</span><span class="chip plain">${esc(L(o.stage))}</span></div>
      <h3>${esc(L(o.name))}</h3>
      <div class="meta"><div><span>${esc(t('sought'))}</span><b class="num">${money(o.amount)} ${esc(t('sar'))}</b></div><div><span>${esc(t('raised'))}</span><b class="num">${o.raised}%</b></div></div>
      <div class="progress" role="progressbar" aria-valuenow="${o.raised}" aria-valuemin="0" aria-valuemax="100"><i style="width:${o.raised}%"></i></div>
      <div class="lock">${ic('lock')}<span>${esc(t('nda_note'))}</span></div>
      <button class="btn btn-gold btn-sm" data-act="open-form" data-form="investor" data-opp="${o.id}">${esc(t('invest_interest'))}</button></article>`).join('')}
    </div></div></section>`;
}
function eventsHTML() {
  const list = S.content.events.filter(e => e.status === 'published').sort((a, b) => a.date.localeCompare(b.date));
  return `<section class="block" id="events"><div class="wrap">${secHead('events')}<div class="events">
    ${list.map(e => { const d = new Date(e.date + 'T12:00:00'); const left = Math.max(0, e.seats - e.taken); const full = left === 0;
      return `<article class="card event"><div class="date"><b class="num">${d.getDate()}</b><span>${d.toLocaleDateString(locale(), {month:'short'})}</span></div>
      <div><span class="chip">${esc(L(e.kind))}</span><h3>${esc(L(e.title))}</h3><div class="info"><span>${ic('clock')}${esc(e.time)} · ${esc(L(e.dur))}</span><span>${ic('pin')}${esc(L(e.place))}</span><span>${ic('tag')}${e.price ? money(e.price) + ' ' + esc(t('sar')) : esc(t('free'))}</span></div></div>
      <div class="ev-side"><div class="seats">${full ? `<span class="chip warn">${esc(t('waitlist'))}</span>` : `<span class="num">${left}</span> ${esc(t('seats_left'))}`}<div class="progress" style="margin-top:6px"><i style="width:${Math.min(100, e.taken / e.seats * 100)}%"></i></div></div>
      <button class="btn ${full ? 'btn-ghost' : 'btn-dark'} btn-sm" data-act="open-form" data-form="event" data-event="${e.id}">${esc(full ? t('waitlist') : t('register'))}</button></div></article>`; }).join('')}
    </div></div></section>`;
}
function galleryHTML() {
  return `<section class="block alt"><div class="wrap">${secHead('gallery', `<span class="sample-note">${ic('info', '')}${esc(t('gallery_note'))}</span>`)}<div class="gallery">
    ${S.content.gallery.map((g, i) => `<button class="${g.size === 'big' ? 'g-big' : g.size === 'wide' ? 'g-wide' : ''}" data-act="lightbox" data-i="${i}" aria-label="${esc(L(g.cap))}">${g.img ? `<img src="${g.img}" alt="${esc(L(g.cap))}" loading="lazy">` : galleryArt(g.art)}<span class="cap">${esc(L(g.cap))}</span></button>`).join('')}
    </div></div></section>`;
}
function testimonialsHTML() {
  return `<section class="block"><div class="wrap">${secHead('testimonials', `<span class="sample-note">${esc(t('testimonials_note'))}</span>`)}<div class="grid g3">
    ${S.content.testimonials.map(q => `<figure class="card quote" style="margin:0"><div class="mark" aria-hidden="true">”</div><blockquote style="margin:0"><p>${esc(L(q.text))}</p></blockquote>
      <figcaption class="who"><span class="av">${ic('user')}</span><div><b>${esc(L(q.who))}</b><span>${esc(L(q.role))}</span></div></figcaption></figure>`).join('')}
    </div></div></section>`;
}
function faqHTML() {
  return `<section class="block alt" id="faq"><div class="wrap">${secHead('faq')}<div class="faq">
    ${S.content.faq.map((f, i) => `<details ${i === 0 ? 'open' : ''}><summary>${esc(L(f.q))}</summary><p>${esc(L(f.a))}</p></details>`).join('')}</div></div></section>`;
}
function contactHTML() {
  const st = S.settings;
  return `<section class="block" id="contact"><div class="wrap">${secHead('contact')}<div class="contact">
    <div class="card"><h3 style="font-size:20px;margin-bottom:16px">${esc(t('quick_contact'))}</h3>${formHTML('contact', {compact:true})}</div>
    <div class="contact-info">
      <div class="ci"><span class="ic">${ic('phone')}</span><div><span>${esc(t('phone'))}</span><b><a href="tel:${esc(st.phone.replace(/\s/g, ''))}" style="text-decoration:none">${esc(st.phone)}</a></b></div></div>
      <div class="ci"><span class="ic">${ic('mail')}</span><div><span>${esc(t('email'))}</span><b><a href="mailto:${esc(st.email)}" style="text-decoration:none">${esc(st.email)}</a></b></div></div>
      <div class="ci"><span class="ic">${ic('clock')}</span><div><span>${esc(t('hours'))}</span><b style="direction:inherit">${esc(L(st.hours))}</b></div></div>
      <div class="ci"><span class="ic">${ic('pin')}</span><div><span>${esc(t('address'))}</span><b style="direction:inherit">${esc(L(st.address))}</b></div></div>
      <div class="map">${mapArt()}<a class="btn btn-dark btn-sm map-link" href="${esc(st.mapUrl)}" target="_blank" rel="noopener">${ic('external')} ${esc(t('open_map'))}</a></div>
    </div></div></div></section>`;
}
function footerHTML() {
  const st = S.settings; const soc = st.social;
  return `<footer class="site-footer"><div class="wrap"><div class="foot">
    <div><img class="foot-logo" src="assets/logo-full.webp" alt="${esc(L(st.name))}" width="150" height="145"><p style="max-width:34ch">${esc(L(st.tagline))}</p>
      <div class="socials">${[['x', 'X'], ['instagram', 'IG'], ['linkedin', 'in'], ['snapchat', 'SC']].filter(([k]) => soc[k]).map(([k, lb]) => `<a href="${esc(soc[k])}" target="_blank" rel="noopener" aria-label="${k}" style="font-weight:700;font-size:13px">${lb}</a>`).join('')}</div></div>
    <div><h4>${esc(t('quick_links'))}</h4>${navItems().slice(0, 5).map(([id, k]) => `<a href="#${id}">${esc(t(k))}</a>`).join('')}</div>
    <div><h4>${esc(t('programs'))}</h4><a href="#" data-act="open-form" data-form="incubator">${esc(t('apply_incubator'))}</a><a href="#" data-act="open-form" data-form="accelerator">${esc(t('apply_accelerator'))}</a>
      <a href="#" data-act="open-form" data-form="opportunity">${esc(t('submit_project'))}</a><a href="#" data-act="open-form" data-form="investor">${esc(t('invest_interest'))}</a><a href="#portal">${esc(t('portal'))}</a></div>
    <div><h4>${esc(t('nav_contact'))}</h4><a href="tel:${esc(st.phone.replace(/\s/g, ''))}" class="ltr" style="text-align:start">${esc(st.phone)}</a><a href="mailto:${esc(st.email)}">${esc(st.email)}</a><span style="font-size:14px">${esc(L(st.hours))}</span></div>
    </div><div class="foot-bottom"><span>© ${new Date().getFullYear()} ${esc(L(st.name))} — ${esc(t('rights'))}</span>
    <span><a href="#" data-act="policy" data-k="privacy" style="display:inline">${esc(t('privacy'))}</a> · <a href="#" data-act="policy" data-k="terms" style="display:inline">${esc(t('terms'))}</a></span></div></div></footer>
  <a class="wa" href="https://wa.me/${esc(st.whatsapp)}" target="_blank" rel="noopener" aria-label="WhatsApp">${ic('whatsapp')}</a>`;
}

function renderSite() {
  $('#app').innerHTML = headerHTML() + '<main>' + heroHTML() + aboutHTML() + statsHTML() + partnersHTML() + programHTML('incubator', false) + programHTML('accelerator', true)
    + spacesHTML() + servicesHTML() + oppsHTML() + eventsHTML() + galleryHTML() + testimonialsHTML() + faqHTML() + contactHTML() + '</main>' + footerHTML();
  bindForm($('#app form[data-form="contact"]'));
  startSlider(); startCounters(); bindHeader();
}

/* ---------- interactions ---------- */
let slideTimer = null, slideIdx = 0;
function showSlide(i) {
  const slides = $$('.slide'); if (!slides.length) return;
  slideIdx = (i + slides.length) % slides.length;
  slides.forEach((s, k) => { s.classList.toggle('active', k === slideIdx); s.setAttribute('aria-hidden', k === slideIdx ? 'false' : 'true'); });
  $$('.dots button').forEach((d, k) => d.classList.toggle('on', k === slideIdx));
}
function startSlider() {
  clearInterval(slideTimer); slideIdx = 0;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  slideTimer = setInterval(() => { if (!document.hidden && UI.view === 'site' && !$('.hero:hover')) showSlide(slideIdx + 1); }, 6500);
}
function startCounters() {
  const els = $$('.count'); if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver((ents) => ents.forEach(en => {
    if (!en.isIntersecting) return; io.unobserve(en.target);
    const el = en.target, to = +el.dataset.to, t0 = performance.now(), dur = 1400;
    const step = (now) => { const k = Math.min(1, (now - t0) / dur); el.textContent = money(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), {threshold:.4});
  els.forEach(e => io.observe(e));
}
function bindHeader() {
  const h = $('.site-header'); const on = () => h && h.classList.toggle('scrolled', scrollY > 10);
  window.onscroll = on; on();
  const secs = navItems().map(([id]) => document.getElementById(id)).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((ents) => ents.forEach(en => { if (en.isIntersecting) $$('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id)); }), {rootMargin:'-45% 0px -50% 0px'});
    secs.forEach(s => io.observe(s));
  }
}
ACT['slide'] = (el) => { showSlide(+el.dataset.i); startSlider(); };
ACT['slide-next'] = () => { showSlide(slideIdx + (isEn() ? 1 : 1)); startSlider(); };
ACT['slide-prev'] = () => { showSlide(slideIdx - 1); startSlider(); };
ACT['lang'] = () => { S.lang = isEn() ? 'ar' : 'en'; save(); const y = scrollY; applyLangDir(); if (UI.view === 'portal') renderPortal(); else { renderSite(); window.scrollTo(0, y); } };
ACT['to-top'] = () => { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* sandboxed */ } window.scrollTo({top:0, behavior:'smooth'}); };
ACT['drawer'] = () => { const d = $('#drawer'); d.classList.toggle('open'); $('.menu-btn')?.setAttribute('aria-expanded', d.classList.contains('open')); };
ACT['drawer-top'] = () => { $('#drawer').classList.remove('open'); ACT['to-top'](); };
ACT['drawer-go'] = (el) => { $('#drawer').classList.remove('open'); location.hash = el.dataset.to; document.getElementById(el.dataset.to)?.scrollIntoView({behavior:'smooth'}); };
ACT['lightbox'] = (el) => { const g = S.content.gallery[+el.dataset.i]; openModal({title:esc(L(g.cap)), size:'wide', body:`<div class="art-box" style="border-radius:16px;overflow:hidden;aspect-ratio:4/3;background:var(--night)">${g.img ? `<img src="${g.img}" alt="" style="width:100%;height:100%;object-fit:cover">` : galleryArt(g.art)}</div><p class="muted" style="margin-top:10px;font-size:13px">${esc(t('gallery_note'))}</p>`}); };
ACT['policy'] = (el) => {
  const pr = el.dataset.k === 'privacy';
  openModal({title:esc(t(pr ? 'privacy' : 'terms')), body:`<div style="display:grid;gap:12px;color:var(--muted)">${pr
    ? (isEn() ? '<p>We collect only the data needed to process your request: name, contact details and what you submit in the form.</p><p>Data is processed under the Saudi Personal Data Protection Law (PDPL). You may request access, correction or deletion at any time by email.</p><p>Draft text — to be reviewed by legal counsel before launch.</p>'
              : '<p>نجمع البيانات اللازمة لمعالجة طلبك فقط: الاسم وبيانات التواصل وما ترسله في النموذج.</p><p>تُعالَج البيانات وفق نظام حماية البيانات الشخصية في المملكة، ويحق لك طلب الاطلاع عليها أو تصحيحها أو حذفها في أي وقت عبر البريد الإلكتروني.</p><p>نص مبدئي — يُراجَع من مستشار قانوني قبل الإطلاق.</p>')
    : (isEn() ? '<p>Bookings are subject to availability and the cancellation policy. Programs have their own admission criteria.</p><p>Draft text — to be reviewed before launch.</p>'
              : '<p>تخضع الحجوزات للتوفر وسياسة الإلغاء، ولكل برنامج شروط قبول خاصة به.</p><p>نص مبدئي — يُراجَع قبل الإطلاق.</p>')}</div>`});
};
ACT['login-choice'] = () => {
  $('#drawer')?.classList.remove('open');
  openModal({title:esc(t('login_as')), body:`<div class="choices">
    <button class="choice" data-act="go" data-to="portal"><span class="ic">${ic('user')}</span><div><b>${esc(t('login_client'))}</b><span>${esc(t('login_client_sub'))}</span></div></button>
    <button class="choice" data-act="go" data-to="admin"><span class="ic">${ic('key')}</span><div><b>${esc(t('login_admin'))}</b><span>${esc(t('login_admin_sub'))}</span></div></button></div>`});
};
ACT['apply'] = () => {
  $('#drawer')?.classList.remove('open');
  const opts = ['incubator', 'accelerator', 'booking', 'event', 'opportunity', 'investor', 'contact'];
  openModal({title:esc(t('choose_form')), sub:esc(t('choose_form_sub')), body:`<div class="choices">${opts.map(k => `<button class="choice" data-act="open-form" data-form="${k}"><span class="ic">${ic(FORMS[k].icon)}</span><div><b>${esc(FORMS[k][curLang()])}</b><span>${esc(L(FORMS[k].sub))}</span></div></button>`).join('')}</div>`});
};

/* ---------- forms ---------- */
function optList(src) {
  if (Array.isArray(src)) return src.map(([v, ar, en]) => [v, isEn() ? en : ar]);
  if (src === 'sectors') return Object.entries(SECTORS).map(([k, v]) => [k, L(v)]);
  if (src === 'sources') return Object.entries(SOURCES).filter(([k]) => k !== 'web').map(([k, v]) => [k, L(v)]);
  if (src === 'resources') return S.resources.map(r => [r.id, `${L(r.name)} — ${isEn() ? 'up to' : 'حتى'} ${r.cap}`]);
  if (src === 'events') return S.content.events.filter(e => e.status === 'published').map(e => [e.id, `${L(e.title)} — ${fmtDate(e.date)}`]);
  if (src === 'opportunities') return S.content.opportunities.filter(o => o.status === 'published').map(o => [o.id, L(o.name)]);
  return [];
}
function fieldHTML(fd, fid, preset) {
  const id = `${fid}-${fd.k}`, lab = isEn() ? fd.en : fd.ar, val = preset[fd.k] ?? '';
  const req = fd.req ? `<span class="req" aria-hidden="true">*</span>` : (fd.opt ? ` <span class="muted" style="font-weight:400">(${esc(t('optional'))})</span>` : '');
  let ctrl;
  if (fd.type === 'select') ctrl = `<select class="input" id="${id}" name="${fd.k}" ${fd.req ? 'required' : ''}><option value="">—</option>${optList(fd.opts).map(([v, l]) => `<option value="${esc(v)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  else if (fd.type === 'textarea') ctrl = `<textarea class="input" id="${id}" name="${fd.k}" ${fd.req ? 'required' : ''}>${esc(val)}</textarea>`;
  else if (fd.type === 'checks') ctrl = `<div class="checks" id="${id}">${optList(fd.opts).map(([v, l]) => `<label><input type="checkbox" name="${fd.k}" value="${esc(v)}">${esc(l)}</label>`).join('')}</div>`;
  else if (fd.type === 'file') ctrl = `<input class="input" type="file" id="${id}" name="${fd.k}" accept=".pdf,.ppt,.pptx,.doc,.docx"><span class="hint">${esc(t('file_hint'))}</span>`;
  else ctrl = `<input class="input" id="${id}" name="${fd.k}" type="${fd.type}" value="${esc(val)}" ${fd.req ? 'required' : ''} ${fd.min != null ? `min="${fd.min}"` : ''} ${fd.max != null ? `max="${fd.max}"` : ''}
     ${fd.type === 'tel' ? 'inputmode="tel" autocomplete="tel" dir="ltr" placeholder="05XXXXXXXX"' : ''} ${fd.type === 'email' ? 'autocomplete="email" dir="ltr"' : ''} ${fd.k === 'name' ? 'autocomplete="name"' : ''} ${fd.type === 'date' ? `min="${today()}"` : ''}>`;
  return `<div class="field" data-k="${fd.k}" ${fd.unitOnly ? `data-unit-only="${fd.unitOnly}"` : ''}><label for="${id}">${esc(lab)}${req}</label>${ctrl}<span class="msg" id="${id}-msg" aria-live="polite"></span></div>`;
}
function formHTML(type, {preset = {}, compact = false} = {}) {
  const def = FORMS[type]; const fid = 'f-' + type + (compact ? '-c' : '');
  let fields = def.fields; if (compact) fields = fields.filter(f => !['source'].includes(f.k));
  const out = []; let half = [];
  fields.forEach(fd => {
    if (fd.half) { half.push(fieldHTML(fd, fid, preset)); if (half.length === 2) { out.push(`<div class="row">${half.join('')}</div>`); half = []; } }
    else { if (half.length) { out.push(`<div class="row">${half.join('')}</div>`); half = []; } out.push(fieldHTML(fd, fid, preset)); }
  });
  if (half.length) out.push(`<div class="row">${half.join('')}</div>`);
  const extra = type === 'booking' ? `<div class="notice" id="${fid}-quote">${ic('tag')}<div>${esc(t('est_price'))}: <b class="num" data-quote>—</b> <span class="muted">· ${esc(t('cancel_policy'))}</span></div></div>` : '';
  return `<form class="form" data-form="${type}" id="${fid}" novalidate>${out.join('')}${extra}
    <div class="hp" aria-hidden="true"><label for="${fid}-hp">Website</label><input id="${fid}-hp" name="website_hp" tabindex="-1" autocomplete="off"></div>
    <label class="check"><input type="checkbox" name="consent" id="${fid}-consent"><span>${esc(t('consent'))} <a href="#" data-act="policy" data-k="privacy">${esc(t('privacy'))}</a></span></label>
    <span class="msg" id="${fid}-consent-msg" style="color:var(--bad);font-size:12.5px"></span>
    <div class="notice bad hidden" data-err>${ic('alert')}<div data-err-text></div></div>
    <button class="btn btn-gold" type="submit" style="justify-self:start">${esc(t('send'))} ${ic('arrow')}</button></form>`;
}
ACT['open-form'] = (el) => {
  $('#drawer')?.classList.remove('open');
  const type = el.dataset.form; const def = FORMS[type]; if (!def) return;
  const preset = {};
  if (el.dataset.res) preset.resource = el.dataset.res;
  if (el.dataset.unit) preset.unit = el.dataset.unit;
  if (el.dataset.event) preset.event = el.dataset.event;
  if (el.dataset.opp) preset.opp = el.dataset.opp;
  if (el.dataset.topic) preset.topic = el.dataset.topic;
  if (type === 'booking') { preset.unit = preset.unit || 'hour'; preset.people = preset.people || 1; const d = new Date(); d.setDate(d.getDate() + 1); preset.date = d.toISOString().slice(0, 10); preset.start = '10:00'; preset.end = '11:00'; preset.months = 1; }
  if (S.portal) { const c = S.customers.find(x => x.id === S.portal); if (c) Object.assign(preset, {name:c.name, phone:c.phone, email:c.email}); }
  openModal({title:esc(def[curLang()]), sub:esc(L(def.sub)), body:formHTML(type, {preset}), onMount:(m) => bindForm(m.querySelector('form'))});
};
function formValues(form) {
  const v = {};
  $$('input,select,textarea', form).forEach(i => {
    if (!i.name) return;
    if (i.type === 'checkbox' && i.name !== 'consent') { if (i.checked) (v[i.name] = v[i.name] || []).push(i.value); }
    else if (i.type === 'checkbox') v[i.name] = i.checked;
    else if (i.type === 'file') v[i.name] = i.files[0]?.name || '';
    else v[i.name] = i.value.trim();
  });
  return v;
}
function bindForm(form) {
  if (!form) return;
  form.dataset.t0 = Date.now();
  const type = form.dataset.form;
  const sync = () => {
    if (type !== 'booking') return;
    const v = formValues(form);
    $$('[data-unit-only]', form).forEach(f => f.closest('.field').classList.toggle('hidden', f.dataset.unitOnly !== v.unit));
    $$('.row', form).forEach(r => { const vis = $$('.field', r).filter(f => !f.classList.contains('hidden')); r.style.gridTemplateColumns = vis.length === 1 ? '1fr' : ''; });
    const q = $('[data-quote]', form); if (!q) return;
    const ok = v.resource && v.date && (v.unit !== 'hour' || (v.start && v.end && v.end > v.start));
    q.textContent = ok ? `${money(bookingPrice(v))} ${t('sar')}` : '—';
    const code = S.codes.find(c => c.active && c.code.toUpperCase() === (v.code || '').toUpperCase());
    q.title = code ? `${t('code_ok')} (${code.pct}%)` : '';
  };
  form.addEventListener('input', sync); form.addEventListener('change', sync); sync();
  form.addEventListener('submit', (e) => { e.preventDefault(); submitForm(form); });
}
function setErr(form, k, msg) {
  const f = form.querySelector(`.field[data-k="${k}"]`); if (!f) return;
  const ctl = f.querySelector('.input'); const m = f.querySelector('.msg');
  if (ctl) { ctl.classList.toggle('err', !!msg); ctl.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (msg) ctl.setAttribute('aria-describedby', m.id); }
  if (m) m.textContent = msg || '';
}
function submitForm(form) {
  const type = form.dataset.form, def = FORMS[type], v = formValues(form);
  const errBox = $('[data-err]', form); errBox.classList.add('hidden');
  let firstBad = null; const bad = (k, msg) => { setErr(form, k, msg); if (!firstBad) firstBad = k; };
  def.fields.forEach(fd => {
    setErr(form, fd.k, '');
    const hidden = form.querySelector(`.field[data-k="${fd.k}"]`)?.classList.contains('hidden');
    if (!form.querySelector(`.field[data-k="${fd.k}"]`) || hidden) return;
    if (fd.req && !v[fd.k]) bad(fd.k, t('required'));
  });
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) bad('email', t('invalid_email'));
  if (v.phone && !/^(05\d{8}|\+?9665\d{8})$/.test(v.phone.replace(/[\s-]/g, ''))) bad('phone', t('invalid_phone'));
  if (type === 'booking' && v.resource && v.date) {
    const r = resById(v.resource); const {start, end} = bookingRange(v);
    if (v.unit === 'hour' && !(v.end > v.start)) bad('end', t('end_after_start'));
    else if (start < new Date()) bad('date', t('past_date'));
    else if (r && +v.people > r.cap) bad('people', t('capacity'));
    else if (bookingConflict(v.resource, start, end, v.people)) { bad('start', t('conflict')); $('[data-err-text]', form).textContent = t('conflict'); errBox.classList.remove('hidden'); }
    if (v.code && !S.codes.find(c => c.active && c.code.toUpperCase() === v.code.toUpperCase())) bad('code', t('code_bad'));
  }
  const cm = $('#' + form.id + '-consent-msg'); cm.textContent = '';
  if (!v.consent) { cm.textContent = t('consent_required'); if (!firstBad) firstBad = 'consent'; }
  if (firstBad) { const el = firstBad === 'consent' ? $('#' + form.id + '-consent') : form.querySelector(`.field[data-k="${firstBad}"] .input, .field[data-k="${firstBad}"] input`); el?.focus(); return; }
  if (VIEW_ONLY) { $('[data-err-text]', form).textContent = t('view_submit'); errBox.classList.remove('hidden'); errBox.classList.replace('bad', 'warn'); return; }
  // anti-spam: honeypot + minimum fill time (real build adds reCAPTCHA/Turnstile + rate limiting)
  if (v.website_hp || Date.now() - (+form.dataset.t0) < 1500) { $('[data-err-text]', form).textContent = t('spam'); errBox.classList.remove('hidden'); return; }
  const btn = form.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = t('sending');
  setTimeout(() => {
    v.phone = v.phone.replace(/[\s-]/g, '');
    const files = v.deck ? [v.deck] : [];
    const r = createRequest(type, v, files);
    const inModal = !!form.closest('.modal');
    const html = `<div class="success"><div class="tick">${ic('check')}</div><h3 style="font-size:24px">${esc(t('success_title'))}</h3><p class="muted">${esc(t('success_body'))}</p>
      <div class="ref">${r.id}</div>${r.data.waitlist ? `<span class="chip warn">${esc(t('waitlist'))}</span>` : ''}<p class="muted" style="font-size:13.5px">${esc(t('success_mail'))}</p>
      <div class="toolbar" style="justify-content:center"><a class="btn btn-ghost btn-sm" href="#portal" data-act="go" data-to="portal">${esc(t('track'))}</a>${inModal ? `<button class="btn btn-gold btn-sm" data-act="close-modal">${esc(t('done'))}</button>` : ''}</div></div>`;
    if (inModal) { $('.modal-body').innerHTML = html; $('.modal-head h3').textContent = t('success_title'); $('.modal-head p')?.remove(); }
    else { form.outerHTML = html; }
    if (type === 'event' && UI.view === 'site') { const evs = $('#events'); if (evs) evs.outerHTML = eventsHTML(); }
  }, 450);
}
