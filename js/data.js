/* وصل دائم — seed content, UI strings, form and permission definitions.
   Everything here is example content, editable from the dashboard. */
'use strict';

const ICONS = {
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  back:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.2c2 .7 3.5 2.6 3.5 5.8"/>',
  phone:'<path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
  pin:'<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  desk:'<path d="M3 10h18M5 10v9M19 10v9M5 14h6"/><rect x="8" y="4" width="8" height="6" rx="1"/>',
  office:'<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 21v-4h6v4M8 7h2M14 7h2M8 11h2M14 11h2"/>',
  meeting:'<rect x="4" y="9" width="16" height="6" rx="3"/><circle cx="7" cy="5.5" r="1.5"/><circle cx="12" cy="5.5" r="1.5"/><circle cx="17" cy="5.5" r="1.5"/><circle cx="7" cy="18.5" r="1.5"/><circle cx="12" cy="18.5" r="1.5"/><circle cx="17" cy="18.5" r="1.5"/>',
  rocket:'<path d="M12 15l-3-3c1.5-5 4.5-8 10-9-1 5.5-4 8.5-9 10z"/><path d="M9 12l-4-.5L7 8.5l4.5-.5M12 15l.5 4 3-2 .5-4.5"/><circle cx="15" cy="9" r="1.2"/>',
  sprout:'<path d="M12 21v-9"/><path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7z"/><path d="M12 14c0-3-2.5-5.5-7-5.5 0 3 2.5 5.5 7 5.5z"/>',
  chart:'<path d="M4 20h16"/><rect x="5" y="11" width="3" height="7"/><rect x="10.5" y="7" width="3" height="11"/><rect x="16" y="4" width="3" height="14"/>',
  bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  shield:'<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  doc:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  megaphone:'<path d="M4 10v4h3l7 4V6L7 10z"/><path d="M17.5 9a4 4 0 0 1 0 6"/><path d="M7 14l1 5h2.5l-1-5"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  coins:'<ellipse cx="9" cy="7" rx="6" ry="2.5"/><path d="M3 7v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V7"/><path d="M9 16.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4c0-1.2-2-2.2-4.6-2.4"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  whatsapp:'<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9.2 8.6c.2 2.4 2.6 5 5.4 5.6l1-1.3 1.9.9-.3 1.6c-3.8.6-8.6-3.7-8.7-8l1.6-.6.9 1.8z"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  inbox:'<path d="M3 13l2.5-8h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/>',
  contract:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8.5 16.5c1-1.5 2-1.5 2.5 0s1.5 1.5 2.5 0 1.5-1 2 0"/>',
  layout:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  ticket:'<path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M14 7v2M14 11v2M14 15v2"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
  logout:'<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  download:'<path d="M12 3v12M7 10l5 5 5-5M4 19h16"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  upload:'<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  external:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  alert:'<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4.5M12 17.5v.5"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4"/>',
  print:'<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  note:'<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/>',
  filter:'<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
  backup:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  brief:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
  headset:'<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  stamp:'<path d="M5 21h14M6 17h12l-1 4H7z"/><path d="M10 17v-3.5a4 4 0 1 1 4 0V17"/>',
  palette:'<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  idcard:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 16.5c.6-1.6 2-2.5 3.5-2.5s2.9.9 3.5 2.5M14 9h4M14 13h4"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  heart:'<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  ban:'<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  device:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  branch:'<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 8.5v7M18 10.5c0 4-6 3-11 5.5"/>'
};
const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------------- UI strings (public site + client portal) ---------------- */
const STR = {
  ar: {
    nav_home:'الرئيسية', nav_about:'من نحن', nav_incubator:'حاضنة الأعمال', nav_accelerator:'مسرّعة الأعمال', nav_spaces:'مساحات العمل',
    nav_services:'الخدمات', nav_opps:'الفرص الاستثمارية', nav_events:'الدورات والفعاليات', nav_contact:'تواصل معنا',
    login:'تسجيل الدخول', apply:'قدّم الآن', lang_switch:'EN', theme:'الوضع الليلي/النهاري', menu:'القائمة',
    demo_bar:'نموذج أولي تفاعلي — البيانات تجريبية وتُحفظ في متصفحك فقط.',
    view_bar:'نسخة عرض فقط — تصفّح الموقع ولوحة التحكم بالحسابات التجريبية، دون إمكانية التعديل.', view_submit:'هذه نسخة عرض فقط، لذلك الإرسال معطّل. في النظام الفعلي يُحفظ الطلب ويصل إشعار للفريق ورسالة تأكيد للعميل.',
    view_signup:'إنشاء الحسابات غير متاح في نسخة العرض. استخدم الحساب التجريبي.', demo_login:'دخول بالحساب التجريبي', demo_admin:'لوحة التحكم', demo_portal:'بوابة العملاء', demo_reset:'إعادة البيانات',
    prev:'السابق', next:'التالي', read_more:'تفاصيل البرنامج', apply_incubator:'قدّم على الحاضنة', apply_accelerator:'قدّم على المسرّعة',
    book_now:'احجز الآن', per:'/', sar:'ر.س', featured:'الأكثر طلبًا', request_service:'اطلب الخدمة',
    invest_interest:'أبدِ اهتمامك', submit_project:'قدّم مشروعك', sought:'التمويل المطلوب', stage:'المرحلة', sector:'القطاع', raised:'تم تأمين',
    nda_note:'التفاصيل الكاملة تظهر بعد موافقة الإدارة وتوقيع اتفاقية السرية.',
    register:'سجّل الآن', seats_left:'مقعد متبقٍ', full:'اكتمل العدد — سجّل في قائمة الانتظار', waitlist:'قائمة الانتظار', free:'مجاني',
    gallery_note:'رسوم توضيحية تُستبدل بصور المكان الفعلية من لوحة التحكم.',
    testimonials_note:'نصوص توضيحية — تُستبدل بآراء العملاء الحقيقية.',
    stats_note:'أرقام توضيحية تُحدَّث من لوحة التحكم.',
    phone:'الجوال', email:'البريد الإلكتروني', address:'العنوان', hours:'ساعات العمل', open_map:'افتح في الخرائط',
    quick_contact:'تواصل سريع', send:'إرسال', sending:'جارٍ الإرسال…',
    privacy:'سياسة الخصوصية', terms:'شروط الاستخدام', rights:'جميع الحقوق محفوظة', quick_links:'روابط سريعة', programs:'البرامج', follow:'تابعنا',
    choose_form:'بماذا نخدمك؟', choose_form_sub:'اختر نوع الطلب وسنوجّهه للفريق المختص.',
    consent:'أوافق على معالجة بياناتي وفق سياسة الخصوصية ونظام حماية البيانات الشخصية.',
    required:'هذا الحقل مطلوب', invalid_email:'أدخل بريدًا إلكترونيًا صحيحًا', invalid_phone:'أدخل رقم جوال صحيحًا يبدأ بـ 05',
    consent_required:'يلزم الموافقة على معالجة البيانات', spam:'تعذّر الإرسال. حاول مرة أخرى بعد لحظات.',
    success_title:'وصلنا طلبك', success_body:'سيتواصل معك فريقنا خلال يوم عمل. احتفظ برقم الطلب للمتابعة:', success_mail:'أرسلنا تأكيدًا إلى بريدك (محاكاة في النموذج الأولي).',
    track:'تابع طلبك من بوابة العملاء', close:'إغلاق', done:'تم',
    conflict:'هذا الوقت محجوز مسبقًا لهذه المساحة. اختر وقتًا آخر.', end_after_start:'وقت النهاية يجب أن يكون بعد وقت البداية',
    past_date:'لا يمكن الحجز في وقت مضى', capacity:'عدد الأشخاص أكبر من سعة المساحة', code_ok:'تم تطبيق الخصم', code_bad:'كود الخصم غير صالح',
    est_price:'السعر التقديري', optional:'اختياري', file_hint:'PDF أو PowerPoint حتى 10 ميجابايت', source_q:'كيف عرفت عنّا؟',
    portal:'بوابة العملاء', portal_sub:'تابع طلباتك وحجوزاتك ومستنداتك في مكان واحد.', my_requests:'طلباتي', my_bookings:'حجوزاتي', my_files:'مستنداتي',
    my_notifs:'الإشعارات', my_profile:'بياناتي', invoices:'الفواتير والمدفوعات', invoices_soon:'تتوفر في المرحلة الثانية مع الدفع الإلكتروني.',
    sign_in:'دخول', sign_up:'إنشاء حساب', sign_out:'خروج', password:'كلمة المرور', full_name:'الاسم الكامل', forgot:'نسيت كلمة المرور؟',
    reset_sent:'أرسلنا رابط إعادة التعيين إلى بريدك (محاكاة).', bad_login:'البريد أو كلمة المرور غير صحيحة', exists:'يوجد حساب بهذا البريد',
    weak_pw:'كلمة المرور 8 أحرف على الأقل وتحتوي حرفًا ورقمًا', save:'حفظ', saved:'تم الحفظ', upload:'رفع ملف', no_items:'لا يوجد شيء بعد',
    status:'الحالة', date:'التاريخ', ref:'رقم الطلب', type:'النوع', space:'المساحة', time:'الوقت', people:'الأشخاص',
    client_demo:'حساب تجريبي: client@example.com / Client@2026', admin_blocked:'حسابات العملاء لا تملك صلاحية دخول لوحة الإدارة.',
    login_as:'اختر نوع الدخول', login_client:'دخول العملاء', login_client_sub:'تابع طلباتك وحجوزاتك', login_admin:'دخول الإدارة والموظفين', login_admin_sub:'لوحة التحكم الداخلية',
    hour:'ساعة', day:'يوم', month:'شهر', from:'من', to:'إلى', cancel_booking:'إلغاء الحجز', cancel_policy:'يمكن الإلغاء مجانًا قبل 24 ساعة من الموعد.'
  },
  en: {
    nav_home:'Home', nav_about:'About', nav_incubator:'Incubator', nav_accelerator:'Accelerator', nav_spaces:'Workspaces',
    nav_services:'Services', nav_opps:'Investment', nav_events:'Courses & Events', nav_contact:'Contact',
    login:'Sign in', apply:'Apply now', lang_switch:'ع', theme:'Dark/light mode', menu:'Menu',
    demo_bar:'Interactive prototype — demo data, saved in your browser only.',
    view_bar:'View-only demo — browse the site and dashboard with the demo accounts; editing is disabled.', view_submit:'This is a view-only demo, so sending is disabled. In the live system the request is saved, the team is notified and the client gets a confirmation.',
    view_signup:'Account sign-up is disabled in the view-only demo. Use the demo account.', demo_login:'Sign in with the demo account', demo_admin:'Dashboard', demo_portal:'Client portal', demo_reset:'Reset data',
    prev:'Previous', next:'Next', read_more:'Program details', apply_incubator:'Apply to the incubator', apply_accelerator:'Apply to the accelerator',
    book_now:'Book now', per:'/', sar:'SAR', featured:'Most popular', request_service:'Request service',
    invest_interest:'Express interest', submit_project:'Submit your project', sought:'Funding sought', stage:'Stage', sector:'Sector', raised:'Secured',
    nda_note:'Full details are shared after approval and a signed NDA.',
    register:'Register', seats_left:'seats left', full:'Fully booked — join the waitlist', waitlist:'Waitlist', free:'Free',
    gallery_note:'Illustrations, to be replaced with real photos from the dashboard.',
    testimonials_note:'Placeholder quotes — to be replaced with real client feedback.',
    stats_note:'Illustrative figures, updated from the dashboard.',
    phone:'Mobile', email:'Email', address:'Address', hours:'Working hours', open_map:'Open in Maps',
    quick_contact:'Quick contact', send:'Send', sending:'Sending…',
    privacy:'Privacy policy', terms:'Terms of use', rights:'All rights reserved', quick_links:'Quick links', programs:'Programs', follow:'Follow us',
    choose_form:'How can we help?', choose_form_sub:'Pick a request type and we will route it to the right team.',
    consent:'I agree to the processing of my data under the privacy policy and the Saudi Personal Data Protection Law.',
    required:'This field is required', invalid_email:'Enter a valid email address', invalid_phone:'Enter a valid mobile number starting with 05',
    consent_required:'Consent to data processing is required', spam:'Could not send. Please try again in a moment.',
    success_title:'Request received', success_body:'Our team will contact you within one working day. Keep your reference number:', success_mail:'A confirmation was sent to your email (simulated in this prototype).',
    track:'Track it in the client portal', close:'Close', done:'Done',
    conflict:'This time is already booked for this space. Choose another time.', end_after_start:'End time must be after start time',
    past_date:'You cannot book a time in the past', capacity:'Number of people exceeds the space capacity', code_ok:'Discount applied', code_bad:'Invalid discount code',
    est_price:'Estimated price', optional:'optional', file_hint:'PDF or PowerPoint up to 10 MB', source_q:'How did you hear about us?',
    portal:'Client portal', portal_sub:'Follow your requests, bookings and documents in one place.', my_requests:'My requests', my_bookings:'My bookings', my_files:'My documents',
    my_notifs:'Notifications', my_profile:'My details', invoices:'Invoices & payments', invoices_soon:'Available in phase two with online payments.',
    sign_in:'Sign in', sign_up:'Create account', sign_out:'Sign out', password:'Password', full_name:'Full name', forgot:'Forgot password?',
    reset_sent:'We sent a reset link to your email (simulated).', bad_login:'Wrong email or password', exists:'An account with this email exists',
    weak_pw:'Password needs 8+ characters with a letter and a number', save:'Save', saved:'Saved', upload:'Upload file', no_items:'Nothing here yet',
    status:'Status', date:'Date', ref:'Reference', type:'Type', space:'Space', time:'Time', people:'People',
    client_demo:'Demo account: client@example.com / Client@2026', admin_blocked:'Client accounts cannot access the admin dashboard.',
    login_as:'Choose how to sign in', login_client:'Client sign-in', login_client_sub:'Follow your requests and bookings', login_admin:'Staff & admin sign-in', login_admin_sub:'Internal dashboard',
    hour:'hour', day:'day', month:'month', from:'From', to:'To', cancel_booking:'Cancel booking', cancel_policy:'Free cancellation up to 24 hours before the start.'
  }
};

/* ---------------- request types & statuses ---------------- */
const REQ_TYPES = {
  incubator:  {ar:'انضمام للحاضنة', en:'Incubator application', icon:'sprout'},
  accelerator:{ar:'التقديم على المسرّعة', en:'Accelerator application', icon:'rocket'},
  booking:    {ar:'حجز مساحة أو قاعة', en:'Space / room booking', icon:'calendar'},
  event:      {ar:'تسجيل في دورة/فعالية', en:'Course / event registration', icon:'ticket'},
  opportunity:{ar:'تقديم فرصة استثمارية', en:'Investment opportunity', icon:'brief'},
  investor:   {ar:'اهتمام مستثمر', en:'Investor interest', icon:'coins'},
  contact:    {ar:'تواصل واستفسار', en:'Contact & enquiry', icon:'mail'}
};
const REQ_STATUS = {
  new:{ar:'جديد', en:'New', cls:'info'},
  review:{ar:'قيد المراجعة', en:'In review', cls:'warn'},
  waiting:{ar:'بانتظار العميل', en:'Waiting for client', cls:'plain'},
  approved:{ar:'مقبول', en:'Approved', cls:'ok'},
  rejected:{ar:'مرفوض', en:'Rejected', cls:'bad'},
  done:{ar:'مكتمل', en:'Completed', cls:'ok'}
};
const CRM_STATUS = {
  new:{ar:'جديد', cls:'info'}, followed:{ar:'تمت متابعته', cls:'plain'}, interested:{ar:'مهتم', cls:'warn'},
  booked:{ar:'حجز', cls:'gold'}, contracted:{ar:'تعاقد', cls:'ok'}, lost:{ar:'غير مهتم', cls:'bad'}
};
const SOURCES = {
  ad:{ar:'إعلان', en:'Advertisement'}, whatsapp:{ar:'واتساب', en:'WhatsApp'}, visit:{ar:'زيارة', en:'Walk-in visit'},
  referral:{ar:'معرفة', en:'Referral'}, social:{ar:'منصة اجتماعية', en:'Social media'}, web:{ar:'الموقع', en:'Website'}
};
const SECTORS = {
  tech:{ar:'التقنية', en:'Technology'}, fintech:{ar:'التقنية المالية', en:'Fintech'}, retail:{ar:'التجزئة والتجارة الإلكترونية', en:'Retail & e-commerce'},
  logistics:{ar:'اللوجستيات', en:'Logistics'}, health:{ar:'الصحة', en:'Health'}, food:{ar:'الأغذية', en:'Food'},
  energy:{ar:'الطاقة والاستدامة', en:'Energy & sustainability'}, edu:{ar:'التعليم', en:'Education'}, other:{ar:'أخرى', en:'Other'}
};

/* ---------------- public forms ---------------- */
const F = (k, ar, en, type = 'text', o = {}) => Object.assign({k, ar, en, type}, o);
const COMMON_HEAD = [F('name','الاسم الكامل','Full name','text',{req:1}), F('phone','الجوال','Mobile','tel',{req:1, half:1}), F('email','البريد الإلكتروني','Email','email',{req:1, half:1})];
const SRC_FIELD = F('source','كيف عرفت عنّا؟','How did you hear about us?','select',{opts:'sources', half:1});
const FORMS = {
  incubator:{icon:'sprout', ar:'الانضمام إلى حاضنة الأعمال', en:'Join the business incubator', sub:{ar:'برنامج احتضان لمدة 6 أشهر للمشاريع في مرحلة الفكرة والنموذج الأولي.', en:'A 6-month incubation program for idea and prototype stage projects.'},
    fields:[...COMMON_HEAD, F('project','اسم المشروع','Project name','text',{req:1, half:1}), F('sector','القطاع','Sector','select',{req:1, opts:'sectors', half:1}),
      F('stage','مرحلة المشروع','Project stage','select',{req:1, half:1, opts:[['idea','فكرة','Idea'],['prototype','نموذج أولي','Prototype'],['launch','إطلاق مبكر','Early launch']]}),
      F('founders','عدد المؤسسين','Number of founders','number',{half:1, min:1, max:10}),
      F('summary','وصف مختصر للمشروع','Short project description','textarea',{req:1}), F('deck','العرض التقديمي','Pitch deck','file',{opt:1}), SRC_FIELD]},
  accelerator:{icon:'rocket', ar:'التقديم على مسرّعة الأعمال', en:'Apply to the accelerator', sub:{ar:'دفعة مكثّفة لمدة 12 أسبوعًا للشركات التي بدأت تحقق إيرادات.', en:'An intensive 12-week cohort for startups with early revenue.'},
    fields:[...COMMON_HEAD, F('company','اسم الشركة','Company name','text',{req:1, half:1}), F('sector','القطاع','Sector','select',{req:1, opts:'sectors', half:1}),
      F('revenue','الإيرادات الشهرية التقريبية','Approx. monthly revenue','select',{req:1, half:1, opts:[['r0','أقل من 10 آلاف ر.س','Under 10K SAR'],['r1','10 – 50 ألف ر.س','10K – 50K SAR'],['r2','50 – 200 ألف ر.س','50K – 200K SAR'],['r3','أكثر من 200 ألف ر.س','Over 200K SAR']]}),
      F('team','حجم الفريق','Team size','number',{half:1, min:1}), F('website','رابط الموقع أو التطبيق','Website or app link','url',{opt:1}),
      F('needs','ما الذي تحتاجه من المسرّعة؟','What do you need from the accelerator?','textarea',{req:1}), F('deck','العرض التقديمي','Pitch deck','file',{opt:1}), SRC_FIELD]},
  booking:{icon:'calendar', ar:'حجز مساحة عمل أو قاعة اجتماعات', en:'Book a workspace or meeting room', sub:{ar:'يتحقق النظام من توفّر الوقت مباشرة ويمنع الحجز المكرر.', en:'Availability is checked instantly; double bookings are blocked.'},
    fields:[...COMMON_HEAD, F('resource','المساحة','Space','select',{req:1, opts:'resources'}),
      F('unit','مدة الحجز','Booking by','select',{req:1, half:1, opts:[['hour','بالساعة','By the hour'],['day','باليوم','By the day'],['month','بالشهر','By the month']]}),
      F('people','عدد الأشخاص','Number of people','number',{req:1, half:1, min:1}),
      F('date','التاريخ','Date','date',{req:1, half:1}), F('start','من الساعة','From','time',{half:1, unitOnly:'hour'}), F('end','إلى الساعة','To','time',{half:1, unitOnly:'hour'}),
      F('months','عدد الأشهر','Number of months','number',{half:1, min:1, unitOnly:'month'}),
      F('code','كود الخصم','Discount code','text',{opt:1, half:1}), F('notes','ملاحظات','Notes','textarea',{opt:1}), SRC_FIELD]},
  event:{icon:'ticket', ar:'التسجيل في دورة أو فعالية', en:'Register for a course or event', sub:{ar:'يُحجز مقعدك فور التسجيل، وعند اكتمال العدد تنضم لقائمة الانتظار.', en:'Your seat is reserved on registration; full events go to a waitlist.'},
    fields:[...COMMON_HEAD, F('event','الدورة أو الفعالية','Course or event','select',{req:1, opts:'events'}), F('org','الجهة أو الشركة','Organisation','text',{opt:1, half:1}), SRC_FIELD]},
  opportunity:{icon:'brief', ar:'تقديم مشروع أو فرصة استثمارية', en:'Submit a project or investment opportunity', sub:{ar:'تُراجع الفرص قبل عرضها على المستثمرين، وتبقى البيانات الحساسة مخفية.', en:'Opportunities are reviewed before investors see them; sensitive data stays hidden.'},
    fields:[...COMMON_HEAD, F('project','اسم المشروع','Project name','text',{req:1, half:1}), F('sector','القطاع','Sector','select',{req:1, opts:'sectors', half:1}),
      F('stage','المرحلة','Stage','select',{req:1, half:1, opts:[['pre','ما قبل التأسيس','Pre-seed'],['seed','تأسيسية','Seed'],['a','الجولة أ','Series A']]}),
      F('amount','المبلغ المطلوب (ر.س)','Amount sought (SAR)','number',{req:1, half:1, min:0}),
      F('summary','ملخص الفرصة','Opportunity summary','textarea',{req:1}), F('deck','العرض الاستثماري أو دراسة الجدوى','Investment deck or feasibility study','file',{opt:1}), SRC_FIELD]},
  investor:{icon:'coins', ar:'تسجيل اهتمام مستثمر', en:'Investor interest', sub:{ar:'نرسل لك الفرص المعتمدة التي تطابق اهتماماتك.', en:'We will send you approved opportunities that match your interests.'},
    fields:[...COMMON_HEAD, F('itype','نوع المستثمر','Investor type','select',{req:1, half:1, opts:[['angel','مستثمر فرد (ملائكي)','Angel investor'],['firm','جهة أو شركة','Company'],['fund','صندوق استثماري','Fund']]}),
      F('ticket','حجم الاستثمار المتوقع','Expected ticket size','select',{req:1, half:1, opts:[['t0','حتى 250 ألف ر.س','Up to 250K SAR'],['t1','250 ألف – مليون ر.س','250K – 1M SAR'],['t2','أكثر من مليون ر.س','Over 1M SAR']]}),
      F('sectors','القطاعات المهتم بها','Sectors of interest','checks',{opts:'sectors'}), F('opp','فرصة محددة','A specific opportunity','select',{opt:1, opts:'opportunities'}), SRC_FIELD]},
  contact:{icon:'mail', ar:'التواصل والاستفسارات', en:'Contact & enquiries', sub:{ar:'نرد على الاستفسارات خلال يوم عمل.', en:'We reply within one working day.'},
    fields:[...COMMON_HEAD, F('topic','الموضوع','Topic','select',{req:1, opts:[['general','استفسار عام','General enquiry'],['spaces','مساحات العمل','Workspaces'],['programs','البرامج','Programs'],['partnership','شراكة','Partnership'],['complaint','شكوى أو ملاحظة','Complaint or feedback']]}),
      F('message','الرسالة','Message','textarea',{req:1}), SRC_FIELD]}
};

/* ---------------- permissions ---------------- */
const ACTS = [
  ['view','مشاهدة'],['add','إضافة'],['edit','تعديل'],['delete','حذف'],['approve','موافقة/رفض'],['publish','نشر'],['assign','إسناد'],
  ['export','تصدير'],['print','طباعة'],['finance','بيانات مالية'],['customers','بيانات العملاء'],['notify','إرسال إشعارات'],['files','الملفات']
];
const MODULES = [
  {k:'dashboard', ar:'لوحة المؤشرات', icon:'grid', acts:['view','finance']},
  {k:'requests', ar:'الطلبات', icon:'inbox', acts:['view','add','edit','delete','approve','assign','export','print','customers','files']},
  {k:'crm', ar:'العملاء (CRM)', icon:'users', acts:['view','add','edit','delete','assign','export','customers']},
  {k:'bookings', ar:'الحجوزات', icon:'calendar', acts:['view','add','edit','delete','approve','export']},
  {k:'contracts', ar:'العقود والاشتراكات', icon:'contract', acts:['view','add','edit','delete','finance','export','print','files']},
  {k:'events', ar:'الدورات والفعاليات', icon:'ticket', acts:['view','add','edit','delete','publish','export']},
  {k:'content', ar:'محتوى الموقع', icon:'layout', acts:['view','add','edit','delete','publish','files']},
  {k:'pricing', ar:'الباقات والأسعار', icon:'tag', acts:['view','edit']},
  {k:'reports', ar:'التقارير', icon:'chart', acts:['view','export','print','finance']},
  {k:'notifications', ar:'الإشعارات والقوالب', icon:'bell', acts:['view','edit','notify']},
  {k:'users', ar:'المستخدمون والأدوار', icon:'key', acts:['view','add','edit','delete']},
  {k:'audit', ar:'سجل العمليات', icon:'list', acts:['view']},
  {k:'settings', ar:'الإعدادات والأمان', icon:'gear', acts:['view','edit']}
];
const P = (mod, acts) => acts.split(' ').map(a => mod + '.' + a);
const ROLE_DEFAULTS = {
  ops:[...P('dashboard','view'), ...P('requests','view add edit approve assign export print customers files'), ...P('crm','view add edit assign export customers'),
       ...P('bookings','view add edit approve export'), ...P('contracts','view edit print files'), ...P('events','view add edit publish export'),
       ...P('content','view'), ...P('pricing','view'), ...P('reports','view export print'), ...P('notifications','view notify'), ...P('users','view')],
  staff:[...P('requests','view edit customers files'), ...P('crm','view edit customers'), ...P('bookings','view edit'), ...P('events','view'), ...P('notifications','view')],
  content:[...P('dashboard','view'), ...P('content','view add edit delete publish files'), ...P('events','view add edit publish'), ...P('pricing','view')],
  accountant:[...P('dashboard','view finance'), ...P('contracts','view edit finance export print files'), ...P('reports','view export print finance'), ...P('bookings','view')],
  bookings:[...P('bookings','view add edit'), ...P('requests','view edit customers'), ...P('crm','view'), ...P('notifications','view')],
  reception:[...P('requests','view add customers'), ...P('bookings','view add'), ...P('crm','view add customers'), ...P('events','view')]
};

/* ---------------- seed ---------------- */
function seedState() {
  const now = new Date();
  const day = (off, h = 9, m = 0) => { const d = new Date(now); d.setDate(d.getDate() + off); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const dOnly = (off) => day(off).slice(0, 10);
  const T = (ar, en) => ({ar, en});

  const content = {
    slides:[
      {id:'s1', art:'arches', eyebrow:T('حاضنة الأعمال','Business incubator'), title:T('من فكرة على الورق إلى شركة قائمة','From an idea on paper to a running company'),
       text:T('برنامج احتضان متكامل يجمع الإرشاد ومساحة العمل وشبكة العلاقات، ليختصر عليك سنوات من التجربة.','A complete incubation program — mentorship, workspace and a network that saves you years of trial and error.'),
       cta1:{label:T('قدّم على الحاضنة','Apply to the incubator'), form:'incubator'}, cta2:{label:T('تفاصيل البرنامج','Program details'), href:'#incubator'}, img:''},
      {id:'s2', art:'steps', eyebrow:T('مسرّعة الأعمال','Accelerator'), title:T('نموّ أسرع لشركتك الناشئة','Faster growth for your startup'),
       text:T('اثنا عشر أسبوعًا مكثّفة مع مرشدين ومستثمرين، تنتهي بيوم عرض أمام جهات التمويل.','Twelve intensive weeks with mentors and investors, ending with a demo day in front of funders.'),
       cta1:{label:T('قدّم على المسرّعة','Apply to the accelerator'), form:'accelerator'}, cta2:{label:T('تفاصيل الدفعة','Cohort details'), href:'#accelerator'}, img:''},
      {id:'s3', art:'plan', eyebrow:T('مساحات العمل','Workspaces'), title:T('مكتبك جاهز من اليوم الأول','Your office, ready on day one'),
       text:T('مكاتب خاصة ومقاعد مرنة وقاعات اجتماعات مجهّزة، بالساعة أو اليوم أو الشهر.','Private offices, flexible desks and equipped meeting rooms — by the hour, day or month.'),
       cta1:{label:T('احجز الآن','Book now'), form:'booking'}, cta2:{label:T('الباقات والأسعار','Plans & pricing'), href:'#spaces'}, img:''}
    ],
    sections:{
      about:{kicker:T('من نحن','About us'), title:T('بيئة واحدة تحتضن الفكرة حتى تصبح شركة','One place that carries an idea until it becomes a company'),
        lead:T('وصل دائم حاضنة ومسرّعة أعمال ومساحات عمل مشتركة، تجمع رواد الأعمال والمستثمرين والخبراء تحت سقف واحد.','Wasl Daim is a business incubator, accelerator and coworking space that brings founders, investors and experts under one roof.'),
        text:T('نعمل مع المشاريع من مرحلة الفكرة إلى الجاهزية للاستثمار: نقيّم، ونرشد، ونوفّر المكان والأدوات، ونفتح الأبواب للتمويل والشراكات.','We work with projects from the idea stage to investment readiness: we assess, mentor, provide the space and tools, and open doors to funding and partnerships.')},
      partners:{kicker:T('شركاؤنا','Partners'), title:T('جهات نفخر بالعمل معها','Organisations we are proud to work with')},
      incubator:{kicker:T('حاضنة الأعمال','Incubator'), title:T('ستة أشهر تبني فيها أساس شركتك','Six months to build your company’s foundation'),
        text:T('للمشاريع في مرحلة الفكرة أو النموذج الأولي. نرافقك في التحقق من الفكرة وبناء نموذج العمل حتى الإطلاق التجريبي.','For idea and prototype stage projects. We guide you through validation and business-model design up to a pilot launch.')},
      accelerator:{kicker:T('مسرّعة الأعمال','Accelerator'), title:T('دفعة مكثّفة تضاعف سرعة نموّك','An intensive cohort that multiplies your pace'),
        text:T('للشركات الناشئة التي بدأت تحقق إيرادات وتبحث عن التوسع والاستثمار. كل دفعة محدودة المقاعد.','For startups with early revenue that want to scale and raise. Each cohort has limited seats.')},
      spaces:{kicker:T('مساحات العمل','Workspaces'), title:T('اختر المساحة التي تناسب فريقك','Pick the space that fits your team'),
        text:T('الأسعار شاملة الإنترنت والقهوة والاستقبال، وغير شاملة ضريبة القيمة المضافة.','Prices include internet, coffee and reception, excluding VAT.')},
      services:{kicker:T('خدماتنا','Services'), title:T('كل ما يحتاجه مشروعك في مكان واحد','Everything your project needs, in one place')},
      opps:{kicker:T('الفرص الاستثمارية','Investment opportunities'), title:T('مشاريع معتمدة تبحث عن شريك','Vetted projects looking for a partner'),
        text:T('تُعرض الفرص بعد مراجعة فريقنا. تظهر التفاصيل الكاملة للمستثمر بعد الموافقة وتوقيع اتفاقية السرية.','Opportunities are listed after our review. Investors see full details after approval and a signed NDA.')},
      events:{kicker:T('الدورات والفعاليات','Courses & events'), title:T('القادم في وصل دائم','Coming up at Wasl Daim')},
      gallery:{kicker:T('المكان','The space'), title:T('جولة في مساحاتنا','A walk through our spaces')},
      testimonials:{kicker:T('قصص النجاح','Success stories'), title:T('ماذا يقول من عمل معنا','What people who worked with us say')},
      faq:{kicker:T('الأسئلة الشائعة','FAQ'), title:T('إجابات سريعة','Quick answers')},
      contact:{kicker:T('تواصل معنا','Contact'), title:T('يسعدنا استقبالك','We would love to hear from you'), text:T('زرنا أو راسلنا، ويرد عليك فريقنا خلال يوم عمل.','Visit or message us — our team replies within one working day.')}
    },
    values:[
      {icon:'target', title:T('رؤيتنا','Our vision'), text:T('أن نكون المحطة الأولى لكل رائد أعمال يبني شركته في المملكة.','To be the first stop for every founder building a company in the Kingdom.')},
      {icon:'compass', title:T('رسالتنا','Our mission'), text:T('نختصر الطريق بين الفكرة والسوق بالإرشاد والمكان والتمويل.','We shorten the road from idea to market with mentorship, space and funding.')},
      {icon:'heart', title:T('قيمنا','Our values'), text:T('الشفافية، والالتزام طويل المدى، ونجاح العميل قبل كل شيء.','Transparency, long-term commitment, and client success first.')}
    ],
    stats:[
      {v:1200, suf:'+', label:T('مستفيد من برامجنا','Program beneficiaries')},
      {v:85, suf:'', label:T('مشروعًا محتضنًا','Incubated projects')},
      {v:140, suf:'', label:T('مكتبًا ومقعد عمل','Offices & desks')},
      {v:18, suf:T('م ر.س','M SAR'), label:T('تمويلات حصلت عليها المشاريع','Funding raised by projects')}
    ],
    partners:[
      {id:'p1', name:T('شريك استراتيجي','Strategic partner'), mark:'ش', img:''},
      {id:'p2', name:T('جهة داعمة','Supporting body'), mark:'د', img:''},
      {id:'p3', name:T('شريك تمويل','Funding partner'), mark:'ت', img:''},
      {id:'p4', name:T('شريك تقني','Technology partner'), mark:'ق', img:''},
      {id:'p5', name:T('جامعة شريكة','Partner university'), mark:'ج', img:''},
      {id:'p6', name:T('غرفة تجارية','Chamber of commerce'), mark:'غ', img:''}
    ],
    incubator:{
      facts:[{v:T('6 أشهر','6 months'), l:T('مدة البرنامج','Duration')}, {v:T('مجانًا','Free'), l:T('للمقبولين','For accepted teams')}, {v:T('20','20'), l:T('مشروعًا في الدورة','Projects per round')}],
      stages:[
        {t:T('التقييم والقبول','Assessment & admission'), d:T('مقابلة مع لجنة التقييم ودراسة جاهزية الفريق والفكرة.','An interview with the panel to assess the team and idea.')},
        {t:T('التحقق من الفكرة','Idea validation'), d:T('اختبار الفكرة مع عملاء حقيقيين قبل صرف أي ميزانية كبيرة.','Testing with real customers before any major spend.')},
        {t:T('بناء نموذج العمل','Business model'), d:T('التسعير والقنوات والتكاليف، مع مرشد مخصص لكل مشروع.','Pricing, channels and costs, with a dedicated mentor.')},
        {t:T('الإطلاق التجريبي والتخرّج','Pilot launch & graduation'), d:T('إطلاق تجريبي وعرض نهائي، ثم شهادة إتمام البرنامج.','A pilot launch and final pitch, then a completion certificate.')}
      ],
      benefits:[T('مقعد عمل مجاني طوال البرنامج','A free desk for the whole program'), T('جلسات إرشاد أسبوعية مع خبراء','Weekly sessions with expert mentors'), T('دعم قانوني ومحاسبي للتأسيس','Legal and accounting support to incorporate'), T('أولوية في عرض المشروع على المستثمرين','Priority access to our investor network')]
    },
    accelerator:{
      facts:[{v:T('12 أسبوعًا','12 weeks'), l:T('مدة الدفعة','Cohort length')}, {v:T('10','10'), l:T('شركات في الدفعة','Startups per cohort')}, {v:T('يوم العرض','Demo day'), l:T('أمام المستثمرين','In front of investors')}],
      stages:[
        {t:T('التشخيص','Diagnosis'), d:T('تحديد أكبر عوائق النمو ووضع مؤشرات واضحة للدفعة.','Pinpoint the biggest growth blockers and set clear cohort KPIs.')},
        {t:T('النمو والمبيعات','Growth & sales'), d:T('تجارب نمو أسبوعية مع مرشدين متخصصين في القطاع.','Weekly growth experiments with sector mentors.')},
        {t:T('الجاهزية للاستثمار','Investment readiness'), d:T('النموذج المالي وغرفة البيانات والعرض الاستثماري.','Financial model, data room and investor deck.')},
        {t:T('يوم العرض','Demo day'), d:T('عرض الشركة أمام صناديق ومستثمرين ملائكيين.','Pitch to funds and angel investors.')}
      ],
      benefits:[T('مكتب خاص للفريق خلال الدفعة','A private office for your team during the cohort'), T('ساعات استشارية مع خبراء نمو وتمويل','Advisory hours with growth and finance experts'), T('أرصدة وخصومات من شركاء تقنيين','Credits and discounts from technology partners')]
    },
    packages:[
      {id:'pk1', icon:'desk', resource:'r3', name:T('مقعد مرن','Flexible desk'), desc:T('مقعد في المساحة المفتوحة، تحجزه متى احتجت.','A seat in the open area whenever you need it.'),
       price:75, unit:'day', alt:T('أو 1,200 ر.س شهريًا','or 1,200 SAR monthly'), feats:[T('إنترنت عالي السرعة','High-speed internet'), T('قهوة ومشروبات','Coffee & drinks'), T('ساعتان قاعة اجتماعات شهريًا','2 meeting-room hours a month')], featured:false},
      {id:'pk2', icon:'idcard', resource:'r3', name:T('مكتب مخصص','Dedicated desk'), desc:T('مقعدك الثابت مع خزانة خاصة وعنوان تجاري.','Your own fixed desk with a locker and business address.'),
       price:1800, unit:'month', alt:T('عقد 3 أشهر على الأقل','3-month minimum'), feats:[T('عنوان تجاري للسجل','Business address for registration'), T('خزانة خاصة','Private locker'), T('5 ساعات قاعة اجتماعات','5 meeting-room hours')], featured:false},
      {id:'pk3', icon:'office', resource:'r4', name:T('مكتب خاص','Private office'), desc:T('مكتب مغلق لفريق من 2 إلى 4 أشخاص، مؤثث بالكامل.','A furnished, lockable office for a team of 2–4.'),
       price:4500, unit:'month', alt:T('يشمل الخدمات والصيانة','Services and maintenance included'), feats:[T('دخول على مدار الساعة','24/7 access'), T('10 ساعات قاعة اجتماعات','10 meeting-room hours'), T('استقبال الزوار والبريد','Visitor and mail handling')], featured:true},
      {id:'pk4', icon:'meeting', resource:'r1', name:T('قاعة اجتماعات','Meeting room'), desc:T('قاعة مجهزة بشاشة عرض واتصال مرئي حتى 12 شخصًا.','Room with display and video conferencing for up to 12.'),
       price:150, unit:'hour', alt:T('أو 900 ر.س لليوم الكامل','or 900 SAR for a full day'), feats:[T('شاشة عرض واتصال مرئي','Display and video calls'), T('ضيافة عند الطلب','Catering on request'), T('حجز فوري من الموقع','Instant online booking')], featured:false}
    ],
    services:[
      {id:'sv1', icon:'compass', name:T('الإرشاد والتوجيه','Mentorship'), text:T('جلسات فردية مع خبراء في الإدارة والتقنية والتمويل.','One-to-one sessions with management, tech and finance experts.')},
      {id:'sv2', icon:'doc', name:T('دراسات الجدوى','Feasibility studies'), text:T('دراسات سوق ومالية معتمدة لدعم طلبات التمويل.','Market and financial studies that support funding applications.')},
      {id:'sv3', icon:'stamp', name:T('تأسيس الشركات','Company setup'), text:T('مساعدة في السجل التجاري والتراخيص والعقود الأساسية.','Help with commercial registration, licences and core contracts.')},
      {id:'sv4', icon:'palette', name:T('الهوية والتسويق','Branding & marketing'), text:T('هوية بصرية وخطة إطلاق تسويقي تناسب ميزانية البداية.','Visual identity and a launch plan sized for an early budget.')},
      {id:'sv5', icon:'coins', name:T('الربط بالتمويل','Funding access'), text:T('تجهيز ملف الاستثمار والتعريف بالمستثمرين وجهات الدعم.','Investment-file preparation and introductions to investors and funds.')},
      {id:'sv6', icon:'idcard', name:T('المكتب الافتراضي','Virtual office'), text:T('عنوان تجاري واستقبال بريد ومكالمات دون مكتب فعلي.','A business address with mail and call handling, no physical office.')}
    ],
    opportunities:[
      {id:'o1', name:T('منصة توصيل الميل الأخير للمتاجر','Last-mile delivery platform for retailers'), sector:'logistics', stage:T('تأسيسية','Seed'), amount:2500000, raised:40, status:'published'},
      {id:'o2', name:T('نظام سحابي لإدارة العيادات','Cloud clinic-management system'), sector:'health', stage:T('ما قبل التأسيس','Pre-seed'), amount:1200000, raised:15, status:'published'},
      {id:'o3', name:T('حلول طاقة شمسية للمزارع','Solar solutions for farms'), sector:'energy', stage:T('الجولة أ','Series A'), amount:4000000, raised:62, status:'published'}
    ],
    events:[
      {id:'e1', kind:T('ورشة عمل','Workshop'), title:T('من الفكرة إلى نموذج العمل','From idea to business model'), date:dOnly(9), time:'18:00', dur:T('3 ساعات','3 hours'), seats:30, taken:22, price:0, place:T('قاعة الفعاليات','Events hall'), status:'published'},
      {id:'e2', kind:T('لقاء','Meetup'), title:T('لقاء المستثمرين الشهري','Monthly investor meetup'), date:dOnly(17), time:'19:30', dur:T('ساعتان','2 hours'), seats:60, taken:60, price:0, place:T('الصالة الرئيسية','Main lounge'), status:'published'},
      {id:'e3', kind:T('دورة','Course'), title:T('أساسيات التسويق الرقمي للشركات الناشئة','Digital marketing basics for startups'), date:dOnly(23), time:'17:00', dur:T('3 أيام','3 days'), seats:25, taken:9, price:450, place:T('قاعة التدريب','Training room'), status:'published'},
      {id:'e4', kind:T('يوم العرض','Demo day'), title:T('يوم العرض — الدفعة الثالثة','Demo day — cohort three'), date:dOnly(36), time:'16:00', dur:T('4 ساعات','4 hours'), seats:120, taken:48, price:0, place:T('قاعة الفعاليات','Events hall'), status:'published'}
    ],
    gallery:[
      {id:'g1', art:'open', cap:T('مساحة العمل المفتوحة','Open workspace'), img:'', size:'big'},
      {id:'g2', art:'office', cap:T('المكاتب الخاصة','Private offices'), img:'', size:''},
      {id:'g3', art:'meeting', cap:T('قاعة الاجتماعات الكبرى','Main meeting room'), img:'', size:''},
      {id:'g4', art:'lounge', cap:T('ركن القهوة','Coffee corner'), img:'', size:''},
      {id:'g5', art:'hall', cap:T('قاعة الفعاليات','Events hall'), img:'', size:''},
      {id:'g6', art:'booth', cap:T('غرف المكالمات','Phone booths'), img:'', size:'wide'}
    ],
    testimonials:[
      {id:'t1', text:T('خلال ستة أشهر انتقلنا من فكرة إلى أول عشرين عميلًا يدفعون. الإرشاد الأسبوعي كان الفارق الحقيقي.','In six months we went from an idea to our first twenty paying customers. The weekly mentoring made the difference.'), who:T('مؤسس شركة ناشئة','Startup founder'), role:T('قطاع التقنية المالية','Fintech')},
      {id:'t2', text:T('نحجز قاعة الاجتماعات أسبوعيًا من الموقع مباشرة، والتأكيد يصل فورًا دون اتصالات.','We book the meeting room weekly straight from the site; confirmation arrives instantly.'), who:T('مديرة شركة استشارات','Consultancy director'), role:T('عميلة مكتب خاص','Private-office client')},
      {id:'t3', text:T('يوم العرض فتح لنا باب أول جولة استثمارية، والفريق رتّب لنا لقاءات مع ثلاثة صناديق.','Demo day opened our first funding round; the team set up meetings with three funds.'), who:T('شريك مؤسس','Co-founder'), role:T('خريج المسرّعة','Accelerator alumnus')}
    ],
    faq:[
      {id:'f1', q:T('من يمكنه التقديم على حاضنة الأعمال؟','Who can apply to the incubator?'), a:T('أي فريق لديه فكرة أو نموذج أولي، بشرط وجود مؤسس متفرغ واحد على الأقل.','Any team with an idea or prototype and at least one full-time founder.')},
      {id:'f2', q:T('ما الفرق بين الحاضنة والمسرّعة؟','What is the difference between the incubator and the accelerator?'), a:T('الحاضنة للمشاريع في بدايتها وتمتد ستة أشهر، والمسرّعة للشركات التي تحقق إيرادات وتمتد اثني عشر أسبوعًا.','The incubator is a six-month program for early projects; the accelerator is twelve weeks for startups with revenue.')},
      {id:'f3', q:T('هل يمكن حجز قاعة الاجتماعات بالساعة؟','Can I book the meeting room by the hour?'), a:T('نعم، من نموذج الحجز في الموقع، ويظهر لك التوفر مباشرة ويصلك التأكيد والتذكير.','Yes, through the booking form; availability shows instantly and you get a confirmation and reminder.')},
      {id:'f4', q:T('ما سياسة إلغاء الحجز؟','What is the cancellation policy?'), a:T('الإلغاء مجاني قبل 24 ساعة من الموعد، وبعدها يُحتسب نصف القيمة.','Free up to 24 hours before; after that, half the fee applies.')},
      {id:'f5', q:T('هل الأسعار شاملة الضريبة؟','Do prices include VAT?'), a:T('الأسعار المعروضة غير شاملة ضريبة القيمة المضافة، وتظهر الضريبة في الفاتورة.','Listed prices exclude VAT, which appears on the invoice.')},
      {id:'f6', q:T('كيف أتابع حالة طلبي؟','How do I follow my request?'), a:T('برقم الطلب الذي يصلك بعد الإرسال، أو من بوابة العملاء بعد إنشاء حساب.','With the reference number you receive, or from the client portal after creating an account.')}
    ]
  };

  const settings = {
    name:T('وصل دائم','Wasl Daim'), tagline:T('حاضنة ومسرّعة أعمال ومساحات عمل مشتركة','Business incubator, accelerator & coworking spaces'),
    phone:'+966 50 000 0000', whatsapp:'966500000000', email:'info@wasldaim.sa',
    address:T('المملكة العربية السعودية — العنوان التفصيلي يُعدَّل من لوحة التحكم','Saudi Arabia — full address editable from the dashboard'),
    hours:T('الأحد – الخميس، 8 ص – 10 م','Sun – Thu, 8 AM – 10 PM'), mapUrl:'https://maps.google.com',
    social:{x:'https://x.com', instagram:'https://instagram.com', linkedin:'https://linkedin.com', snapchat:'https://snapchat.com'},
    accent:'', notifyEmail:'requests@wasldaim.sa', ga:'G-XXXXXXX', seoTitle:T('وصل دائم | حاضنة ومسرّعة أعمال ومساحات عمل','Wasl Daim | Incubator, accelerator & coworking'),
    seoDesc:T('حاضنة ومسرّعة أعمال ومساحات عمل مشتركة لرواد الأعمال في المملكة.','An incubator, accelerator and coworking space for founders in Saudi Arabia.')
  };

  const resources = [
    {id:'r1', name:T('قاعة الاجتماعات الكبرى','Main meeting room'), kind:'room', cap:12, rate:{hour:150, day:900}, branch:'main'},
    {id:'r2', name:T('قاعة الاجتماعات الصغرى','Small meeting room'), kind:'room', cap:6, rate:{hour:90, day:550}, branch:'main'},
    {id:'r3', name:T('المساحة المفتوحة (مقاعد مرنة)','Open space (flexible desks)'), kind:'desk', cap:40, rate:{day:75, month:1200}, branch:'main'},
    {id:'r4', name:T('مكتب خاص 101','Private office 101'), kind:'office', cap:4, rate:{month:4500}, branch:'main'},
    {id:'r5', name:T('مكتب خاص 102','Private office 102'), kind:'office', cap:3, rate:{month:3800}, branch:'main'},
    {id:'r6', name:T('قاعة التدريب','Training room'), kind:'room', cap:25, rate:{hour:250, day:1600}, branch:'main'}
  ];

  const roles = [
    {id:'owner', name:'مالك النظام', en:'Owner', system:true, scope:'all', desc:'أعلى صلاحية. لا يمكن لأي مستخدم آخر تعديل صلاحياته أو حذف حسابه.', perms:[]},
    {id:'ops', name:'مدير العمليات', en:'Operations manager', system:true, scope:'all', desc:'يدير التشغيل اليومي: الطلبات والتوزيع والحجوزات والتقارير التشغيلية.', perms:[...ROLE_DEFAULTS.ops]},
    {id:'staff', name:'موظف', en:'Staff', system:true, scope:'assigned', desc:'يرى الطلبات المسندة إليه فقط ويحدّث حالتها ويضيف الملاحظات.', perms:[...ROLE_DEFAULTS.staff]},
    {id:'content', name:'مسؤول محتوى', en:'Content manager', system:true, scope:'all', desc:'يدير نصوص الموقع وصوره والفعاليات بالعربية والإنجليزية.', perms:[...ROLE_DEFAULTS.content]},
    {id:'accountant', name:'محاسب', en:'Accountant', system:true, scope:'all', desc:'يتابع العقود والدفعات والتقارير المالية.', perms:[...ROLE_DEFAULTS.accountant]},
    {id:'bookings', name:'موظف حجوزات', en:'Bookings officer', system:false, scope:'assigned', desc:'دور مخصص: يشاهد الحجوزات ويعدّل حالتها ويضيف الملاحظات، دون حذف أو بيانات مالية.', perms:[...ROLE_DEFAULTS.bookings]},
    {id:'reception', name:'موظف استقبال', en:'Receptionist', system:false, scope:'all', desc:'دور مخصص: يستقبل الزوار ويسجل الطلبات والحجوزات الجديدة.', perms:[...ROLE_DEFAULTS.reception]}
  ];

  const users = [
    {id:'u1', name:'نورة الراشد', email:'owner@wasldaim.sa', roleId:'owner', status:'active', twoFA:true, branch:'main', overrides:[], lastLogin:day(-1, 21, 10), sessions:[{device:'Chrome — macOS', ip:'85.154.12.40', at:day(-1,21,10)}, {device:'Safari — iPhone', ip:'51.36.88.12', at:day(-3,8,5)}]},
    {id:'u2', name:'خالد المالكي', email:'ops@wasldaim.sa', roleId:'ops', status:'active', twoFA:true, branch:'main', overrides:[], lastLogin:day(0, 8, 2), sessions:[{device:'Edge — Windows', ip:'85.154.12.41', at:day(0,8,2)}]},
    {id:'u3', name:'ريم السالم', email:'bookings@wasldaim.sa', roleId:'bookings', status:'active', twoFA:false, branch:'main', overrides:[{perm:'reports.view', grant:true, from:dOnly(-2), to:dOnly(21), by:'u1'}], lastLogin:day(0, 8, 40), sessions:[{device:'Chrome — Windows', ip:'85.154.12.44', at:day(0,8,40)}]},
    {id:'u4', name:'فهد العتيبي', email:'staff@wasldaim.sa', roleId:'staff', status:'active', twoFA:false, branch:'main', overrides:[], lastLogin:day(0, 9, 1), sessions:[{device:'Chrome — Windows', ip:'85.154.12.45', at:day(0,9,1)}]},
    {id:'u5', name:'لمى الفيصل', email:'content@wasldaim.sa', roleId:'content', status:'active', twoFA:false, branch:'main', overrides:[], lastLogin:day(-2, 11, 0), sessions:[]},
    {id:'u6', name:'ماجد الحربي', email:'finance@wasldaim.sa', roleId:'accountant', status:'active', twoFA:false, branch:'main', overrides:[], lastLogin:day(-1, 10, 30), sessions:[]},
    {id:'u7', name:'سعد القرني', email:'reception@wasldaim.sa', roleId:'reception', status:'suspended', twoFA:false, branch:'main', overrides:[], lastLogin:day(-12, 9, 0), sessions:[]}
  ];

  const people = [
    ['محمد القحطاني','0551234567','m.alqahtani@example.com','ad'], ['أمل الشهري','0559876543','amal.s@example.com','social'], ['عبدالرحمن الدوسري','0503344556','a.dosari@example.com','referral'],
    ['هيفاء المطيري','0567788990','haifa.m@example.com','whatsapp'], ['سلطان الغامدي','0541122334','sultan.g@example.com','visit'], ['جواهر الزهراني','0532233445','jawaher.z@example.com','social'],
    ['تركي العنزي','0578899001','turki.a@example.com','ad'], ['شهد الحربي','0596677889','shahad.h@example.com','referral'], ['يوسف الشمري','0584455667','yousef.sh@example.com','web'],
    ['دانة العمري','0509988776','dana.o@example.com','whatsapp'], ['بندر السبيعي','0545566778','bandar.s@example.com','visit'], ['ريان الأحمدي','0553322110','rayan.a@example.com','ad']
  ];
  const R = (i, type, status, assignee, off, data = {}, notes = []) => ({
    id:'WD-' + (1031 + i), type, status, assignee, createdAt:day(off, 9 + (i % 8), (i * 7) % 60), updatedAt:day(Math.min(0, off + 1), 12),
    name:people[i % 12][0], phone:people[i % 12][1], email:people[i % 12][2], source:people[i % 12][3], data, files:data.deck ? [data.deck] : [], notes, comms:[],
    history:[{at:day(off, 9 + (i % 8)), by:'system', text:'استُلم الطلب من الموقع'}]
  });
  const requests = [
    R(0,'incubator','review','u4',-6,{project:'سلة ذكية للمطاعم', sector:'food', stage:'prototype', founders:2, summary:'نظام طلبات ذكي يربط المطاعم بالموردين.', deck:'pitch-smart-basket.pdf'}, [{by:'u4', at:day(-5,11), text:'تم الاتصال بالعميل وتحديد مقابلة التقييم يوم الأحد.'}]),
    R(1,'booking','approved','u3',-4,{resource:'r1', unit:'hour', people:8, date:dOnly(1), start:'10:00', end:'12:00'}),
    R(2,'accelerator','new','u2',-1,{company:'مِنصّة تعليم', sector:'edu', revenue:'r1', team:6, needs:'توسّع في الخليج وبناء فريق مبيعات.'}),
    R(3,'investor','review','u2',-3,{itype:'angel', ticket:'t1', sectors:['health','tech'], opp:'o2'}),
    R(4,'contact','done','u4',-9,{topic:'spaces', message:'هل تتوفر مكاتب خاصة لفريق من خمسة أشخاص؟'}),
    R(5,'event','approved','u4',-2,{event:'e1', org:'جامعة الملك سعود'}),
    R(6,'booking','new','u3',0,{resource:'r2', unit:'hour', people:4, date:dOnly(2), start:'13:00', end:'14:00'}),
    R(7,'opportunity','review','u2',-7,{project:'تطبيق صيانة منزلية', sector:'tech', stage:'seed', amount:900000, summary:'منصة تربط الفنيين بأصحاب المنازل.', deck:'deck-home-fix.pdf'}),
    R(8,'incubator','new',null,0,{project:'متجر عطور محلية', sector:'retail', stage:'idea', founders:1, summary:'علامة عطور سعودية تبيع عبر الإنترنت.'}),
    R(9,'contact','waiting','u4',-5,{topic:'partnership', message:'نرغب في رعاية يوم العرض القادم.'}),
    R(10,'booking','rejected','u3',-8,{resource:'r6', unit:'day', people:30, date:dOnly(-1)}),
    R(11,'accelerator','review','u2',-10,{company:'وقود للحلول اللوجستية', sector:'logistics', revenue:'r2', team:11, needs:'جولة استثمارية أ.'}),
    R(12,'event','new',null,0,{event:'e3', org:''}),
    R(13,'investor','new',null,-1,{itype:'fund', ticket:'t2', sectors:['energy','logistics'], opp:'o3'})
  ];
  requests[0].history.push({at:day(-5,11), by:'u2', text:'أُسند الطلب إلى فهد العتيبي'}, {at:day(-5,11,30), by:'u4', text:'غيّر الحالة إلى «قيد المراجعة»'});

  const clients = people.map((p, i) => ({
    id:'c' + (i + 1), name:p[0], phone:p[1], email:p[2], company:['','مِنصّة تعليم','','','وقود للحلول اللوجستية','','','','','','',''][i] || '',
    service:['incubator','booking','accelerator','investor','contact','event','booking','opportunity','incubator','contact','booking','accelerator'][i],
    source:p[3], status:['interested','booked','new','interested','contracted','followed','new','interested','new','lost','contracted','followed'][i],
    owner:['u4','u3','u2','u2','u4','u4','u3','u2',null,'u4','u3','u2'][i],
    nextFollow:[dOnly(1), dOnly(3), dOnly(0), dOnly(-1), '', dOnly(5), dOnly(1), dOnly(2), dOnly(0), '', '', dOnly(-2)][i],
    createdAt:day(-[30,24,1,20,40,9,0,14,0,33,60,18][i], 10),
    log:[{at:day(-2, 10, 15), by:['u4','u3','u2','u2','u4','u4','u3','u2','u2','u4','u3','u2'][i], kind:'call', text:'مكالمة متابعة: العميل مهتم ويطلب عرض سعر.'}].slice(0, i % 3 === 2 ? 0 : 1),
    notes:i === 9 ? 'السعر أعلى من ميزانيته الحالية؛ يعاود التواصل بعد ستة أشهر.' : ''
  }));

  const B = (id, r, off, h1, h2, name, status = 'confirmed', people = 4, by = 'web') => ({id, resourceId:r, start:day(off, h1), end:day(off, h2), name, phone:'05xxxxxxxx', email:'', people, status, code:'', price:0, by, createdAt:day(off - 3, 10), notes:''});
  const bookings = [
    B('b1','r1',0,10,12,'شركة مِنصّة تعليم','confirmed',8), B('b2','r1',0,14,15,'أمل الشهري','confirmed',4), B('b3','r1',1,10,12,'أمل الشهري','confirmed',8),
    B('b4','r1',2,9,11,'وقود للحلول اللوجستية','confirmed',10), B('b5','r1',3,16,18,'ورشة داخلية','confirmed',12,'u2'), B('b6','r2',2,13,14,'تركي العنزي','pending',4),
    B('b7','r2',0,11,12,'سلطان الغامدي','confirmed',3), B('b8','r1',-1,13,15,'هيفاء المطيري','confirmed',6), B('b9','r6',4,17,20,'دورة التسويق الرقمي','confirmed',25,'u5'),
    B('b10','r1',4,9,10,'بندر السبيعي','pending',5)
  ];
  bookings.forEach(b => { const r = resources.find(x => x.id === b.resourceId); b.price = (r.rate.hour || 0) * ((new Date(b.end) - new Date(b.start)) / 36e5); });

  const C = (id, client, clientId, r, offStart, months, monthly, paid, deposit) => {
    const s = new Date(now); s.setDate(s.getDate() + offStart); const e = new Date(s); e.setMonth(e.getMonth() + months);
    return {id, client, clientId, resourceId:r, start:s.toISOString().slice(0,10), end:e.toISOString().slice(0,10), months, monthly, total:monthly * months, paid, deposit,
      payments:paid ? [{at:s.toISOString().slice(0,10), amount:paid, method:'تحويل بنكي'}] : [], file:'contract-' + id + '.pdf', status:'active', renewals:0};
  };
  const contracts = [
    C('K-201','سلطان الغامدي — وقود للحلول اللوجستية','c5','r4',-170,6,4500,22500,4500),
    C('K-202','بندر السبيعي','c11','r5',-80,12,3800,11400,3800),
    C('K-203','شركة مِنصّة تعليم','c2','r3',-25,3,1800,1800,0),
    C('K-204','أمل الشهري','c2','r3',-75,3,1200,3600,0),
    C('K-205','جواهر الزهراني','c6','r3',-40,6,1200,2400,1200)
  ];

  const audit = [
    {at:day(-5,11,0), by:'u2', ip:'85.154.12.41', act:'assign', target:'WD-1031', before:{assignee:null}, after:{assignee:'فهد العتيبي'}},
    {at:day(-5,11,30), by:'u4', ip:'85.154.12.45', act:'status', target:'WD-1031', before:{status:'جديد'}, after:{status:'قيد المراجعة'}},
    {at:day(-4,9,15), by:'u1', ip:'85.154.12.40', act:'perm', target:'ريم السالم', before:{'reports.view':false}, after:{'reports.view':'مؤقت حتى ' + dOnly(21)}},
    {at:day(-4,9,20), by:'u1', ip:'85.154.12.40', act:'user_suspend', target:'سعد القرني', before:{status:'نشط'}, after:{status:'موقوف'}},
    {at:day(-3,14,2), by:'u5', ip:'85.154.12.47', act:'content', target:'السلايدر — الشريحة 2', before:{title:'نمو أسرع'}, after:{title:'نموّ أسرع لشركتك الناشئة'}},
    {at:day(-2,10,0), by:'u6', ip:'85.154.12.48', act:'export', target:'العقود (Excel)', before:null, after:{rows:5}},
    {at:day(-1,23,41), by:'—', ip:'102.89.4.17', act:'login_fail', target:'ops@wasldaim.sa', before:null, after:{attempt:3}},
    {at:day(-1,21,10), by:'u1', ip:'85.154.12.40', act:'login', target:'لوحة التحكم', before:null, after:null},
    {at:day(0,8,2), by:'u2', ip:'85.154.12.41', act:'login', target:'لوحة التحكم', before:null, after:null}
  ];

  const notifs = [
    {id:'n1', to:'u2', at:day(0,9,5), read:false, title:'طلب جديد: التقديم على المسرّعة', body:'WD-1033 — عبدالرحمن الدوسري', link:'requests'},
    {id:'n2', to:'u3', at:day(0,9,40), read:false, title:'حجز جديد بانتظار الموافقة', body:'WD-1037 — قاعة الاجتماعات الصغرى', link:'bookings'},
    {id:'n3', to:'u1', at:day(-1,23,42), read:false, title:'محاولات دخول فاشلة', body:'3 محاولات على ops@wasldaim.sa من عنوان غير معتاد 102.89.4.17', link:'audit'},
    {id:'n4', to:'u6', at:day(0,7,0), read:false, title:'عقد يقترب من الانتهاء', body:'K-201 ينتهي خلال 10 أيام', link:'contracts'},
    {id:'n5', to:'u4', at:day(-2,9,0), read:true, title:'أُسند إليك طلب', body:'WD-1036 — تسجيل في ورشة', link:'requests'}
  ];

  const templates = [
    {key:'req_client', name:'تأكيد استلام الطلب (للعميل)', channels:['email','sms','whatsapp'], ar:'مرحبًا {name}، استلمنا طلبك رقم {ref} وسيتواصل معك فريق وصل دائم خلال يوم عمل.', en:'Hi {name}, we received your request {ref}. The Wasl Daim team will contact you within one working day.'},
    {key:'req_staff', name:'إسناد طلب جديد (للموظف)', channels:['email','inapp'], ar:'أُسند إليك الطلب {ref} ({type}). افتحه من لوحة التحكم.', en:'Request {ref} ({type}) was assigned to you.'},
    {key:'booking_reminder', name:'تذكير بموعد الحجز', channels:['sms','whatsapp'], ar:'تذكير: حجزك في {space} غدًا الساعة {time}. للإلغاء رد بكلمة «إلغاء».', en:'Reminder: your booking at {space} is tomorrow at {time}.'},
    {key:'contract_expiry', name:'تنبيه قبل انتهاء الاشتراك', channels:['email','whatsapp'], ar:'عميلنا العزيز {name}، ينتهي اشتراكك في {space} بتاريخ {date}. يسعدنا تجديده.', en:'Dear {name}, your subscription at {space} ends on {date}.'},
    {key:'payment_due', name:'تنبيه دفعة مستحقة', channels:['email','sms'], ar:'تذكير بدفعة مستحقة بقيمة {amount} ر.س على العقد {ref}.', en:'A payment of {amount} SAR is due on contract {ref}.'}
  ];

  const customers = [{id:'cu1', name:'محمد القحطاني', email:'client@example.com', phone:'0551234567', pw:'Client@2026', files:[{name:'السجل التجاري.pdf', at:day(-6,12)}], notifs:[{at:day(-5,11,30), text:'تم تحديث حالة طلبك WD-1031 إلى «قيد المراجعة».'}]}];
  // link the demo client to some requests
  requests[0].email = 'client@example.com'; requests[5].email = 'client@example.com'; requests[5].name = 'محمد القحطاني';
  bookings[1].email = 'client@example.com'; bookings[1].name = 'محمد القحطاني';

  const history = [ // last 6 full months, for the comparison chart
    {m:-6, revenue:61200, bookings:38, clients:14, leads:41, won:9}, {m:-5, revenue:64800, bookings:44, clients:17, leads:46, won:11},
    {m:-4, revenue:70300, bookings:41, clients:15, leads:39, won:10}, {m:-3, revenue:76900, bookings:52, clients:21, leads:55, won:13},
    {m:-2, revenue:74100, bookings:49, clients:19, leads:50, won:12}, {m:-1, revenue:83500, bookings:57, clients:24, leads:62, won:16}
  ];

  return {
    v:3, lang:'ar', theme:null, settings, content, resources, roles, users, requests, clients, bookings, contracts, audit, notifs, templates, customers, history,
    codes:[{code:'WASL10', pct:10, active:true}, {code:'STARTUP20', pct:20, active:true}],
    security:{require2FA:true, minPw:10, lockAfter:5, sessionMins:30, alertNewLogin:true},
    backups:[{id:'bk3', at:day(0,3,0), size:'48 MB', kind:'تلقائي'}, {id:'bk2', at:day(-1,3,0), size:'47 MB', kind:'تلقائي'}, {id:'bk1', at:day(-2,3,0), size:'47 MB', kind:'تلقائي'}],
    branches:[{id:'main', name:'الفرع الرئيسي'}],
    seq:1045, session:null, portal:null, loginFails:{}
  };
}
