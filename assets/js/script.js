// =============================
// Rapid Poste - Frontend Logic
// =============================

function $(id){ return document.getElementById(id); }
const RP_BASE = window.location.pathname.replace(/\\/g, '/').includes('/pages/') ? '..' : '.';
const apiUrl = (path) => `${RP_BASE}/api/${path}`;
const USE_STATIC_DATA = true;
const dataUrl = (file) => `${RP_BASE}/assets/data/${file}`;
const staticCache = {};
const IS_FILE_PROTOCOL = window.location.protocol === 'file:';

// Inline fallback data for file:// usage (no fetch allowed)
const INLINE_DATA = {
  news: {
    success: true,
    data: [
      { category: 'INFO', title: 'Ouverture de nouveaux points relais', body: 'De nouveaux points relais Rapid Poste sont disponibles dans plusieurs gouvernorats.', published_at: '2026-01-20' },
      { category: 'SERVICE', title: 'ARSIL 1-2-3 : parcours simplifie', body: 'Une interface plus rapide pour creer et payer vos envois en ligne.', published_at: '2026-01-10' },
      { category: 'INFO', title: 'Mise a jour des delais express', body: 'Les delais express ont ete optimises pour plusieurs destinations.', published_at: '2026-01-05' }
    ]
  },
  agencies: {
    success: true,
    data: [
      { name: 'Bureau de poste Tunis Centre', address: 'Avenue Habib Bourguiba', city: 'Tunis', governorate: 'Tunis', phone: '+216 71 000 111', hours: '08:00 - 17:00', type: 'Bureau' },
      { name: 'Bureau de poste Sousse Ville', address: 'Rue de France', city: 'Sousse', governorate: 'Sousse', phone: '+216 73 000 222', hours: '08:00 - 16:30', type: 'Bureau' },
      { name: 'Centre de tri Ariana', address: 'Zone Industrielle Ariana', city: 'Ariana', governorate: 'Ariana', phone: '+216 71 000 333', hours: '07:30 - 18:00', type: 'Centre' },
      { name: 'Bureau de distribution Sfax Sud', address: 'Route de Gabes', city: 'Sfax', governorate: 'Sfax', phone: '+216 74 000 444', hours: '08:00 - 15:30', type: 'Distribution' },
      { name: 'Bureau de poste Monastir', address: 'Avenue Bourguiba', city: 'Monastir', governorate: 'Monastir', phone: '+216 73 000 555', hours: '08:00 - 16:00', type: 'Bureau' },
      { name: 'Centre de tri Ben Arous', address: 'Zone Industrielle Ben Arous', city: 'Ben Arous', governorate: 'Ben Arous', phone: '+216 71 000 666', hours: '07:30 - 18:30', type: 'Centre' }
    ]
  },
  delais: {
    success: true,
    rules: [
      { origin: 'Tunisie', destination: 'Tunisie', service: 'Standard', min_days: 2, max_days: 4, note: 'Service national standard.' },
      { origin: 'Tunisie', destination: 'Tunisie', service: 'Express', min_days: 1, max_days: 2, note: 'Service express national.' },
      { origin: 'Tunisie', destination: 'Maghreb', service: 'Standard', min_days: 4, max_days: 7, note: 'Maghreb - standard.' },
      { origin: 'Tunisie', destination: 'Maghreb', service: 'Express', min_days: 2, max_days: 4, note: 'Maghreb - express.' },
      { origin: 'Tunisie', destination: 'Europe', service: 'Standard', min_days: 6, max_days: 10, note: 'Europe - standard.' },
      { origin: 'Tunisie', destination: 'Europe', service: 'Express', min_days: 3, max_days: 5, note: 'Europe - express.' },
      { origin: 'Tunisie', destination: 'USA/Canada/Asie', service: 'Standard', min_days: 8, max_days: 14, note: 'International long courrier - standard.' },
      { origin: 'Tunisie', destination: 'USA/Canada/Asie', service: 'Express', min_days: 4, max_days: 7, note: 'International long courrier - express.' },
      { origin: 'Tunisie', destination: 'Reste du monde', service: 'Standard', min_days: 9, max_days: 16, note: 'Reste du monde - standard.' },
      { origin: 'Tunisie', destination: 'Reste du monde', service: 'Express', min_days: 5, max_days: 9, note: 'Reste du monde - express.' }
    ],
    default: { min_days: 6, max_days: 12, note: 'Estimation moyenne.' }
  },
  tracking: {
    success: true,
    data: [
      {
        tracking_number: 'EE995454657TN',
        status: 'En transit',
        client: 'Sami Ben Ali',
        location: 'Tunis Centre',
        final_note: 'En attente',
        update: '2026-02-01 10:35',
        history: [
          { status: 'Expedition', office: 'Bureau Rapid Poste - Sousse', event_time: '2026-01-30 09:10' },
          { status: 'En transit', office: 'Centre de tri - Tunis', event_time: '2026-01-31 18:45' }
        ]
      },
      {
        tracking_number: 'EE123456789TN',
        status: 'Livre',
        client: 'Leila Saidi',
        location: 'Sfax Sud',
        final_note: 'Livre',
        update: '2026-01-29 15:20',
        history: [
          { status: 'Expedition', office: 'Bureau Rapid Poste - Tunis', event_time: '2026-01-27 08:50' },
          { status: 'En transit', office: 'Centre de tri - Sfax', event_time: '2026-01-28 12:30' },
          { status: 'Livre', office: 'Bureau de distribution - Sfax', event_time: '2026-01-29 15:20' }
        ]
      }
    ]
  }
};
function hideMsg(el){ if(el){ el.style.display = 'none'; el.textContent = ''; } }
function showMsg(el, text, color){
  if(!el) return;
  el.textContent = text;
  el.style.display = 'block';
  if(color) el.style.color = color;
}
function t(key){ return (typeof rpT === 'function') ? rpT(key) : key; }
function tf(key, vars){ return (typeof rpTf === 'function') ? rpTf(key, vars) : t(key); }

function normalizeText(str){
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

let lastTrackingData = null;

const STATUS_KEYWORDS = {
  inTransit: [
    'en transit','en cours de transport','transport','transit','traitement','centre',
    'processing','in transit','arrived'
  ],
  shipped: [
    'expedition','expedie','colis accepte',
    'accepted','shipment received'
  ],
  delivered: [
    'livre','succes','distribue','remis',
    'delivered','completed','received'
  ],
  pending: ['en attente','pending']
};

function translateStatus(raw){
  if(!raw) return '--';
  const s = normalizeText(raw);
  if(STATUS_KEYWORDS.delivered.some(k => s.includes(k))) return t('status_delivered');
  if(STATUS_KEYWORDS.inTransit.some(k => s.includes(k))) return t('status_in_transit');
  if(STATUS_KEYWORDS.shipped.some(k => s.includes(k))) return t('status_shipped');
  if(STATUS_KEYWORDS.pending.some(k => s.includes(k))) return t('status_pending');
  return raw;
}

function translateFinalNote(raw){
  if(!raw) return t('final_waiting');
  const s = normalizeText(raw);
  if(STATUS_KEYWORDS.pending.some(k => s.includes(k))) return t('final_waiting');
  return raw;
}

function renderTracking(data){
  if(!data) return;
  const resultDiv = $('track_result');
  if(resultDiv){ resultDiv.style.display = 'block'; }

  $('res_status').textContent   = translateStatus(data.status);
  $('res_client').textContent   = data.client ? (t('label_recipient') + ': ' + data.client) : '';
  $('res_location').textContent = data.location || '--';
  $('res_final').textContent    = translateFinalNote(data.final_note);
  $('res_date').textContent     = data.update ? (t('label_update') + ': ' + data.update) : '';

  updateTimelineSteps(normalizeText(data.status || ''));

  renderHistory(data.history || []);
}

// -----------------------------
// 1) Tracking (AJAX -> PHP)
// -----------------------------
async function trackColis(){
  const input = $('track_input');
  const num = (input?.value || '').trim();

  const resultDiv = $('track_result');
  const errorMsg  = $('error_msg');

  if(!num){
    showError(t('err_empty_tracking'));
    input?.focus();
    return;
  }

  // Optional: basic format hint (you can relax it)
  // Common examples: EE123456789TN
  const looksValid = /^[A-Z]{2}\d{9}[A-Z]{2}$/i.test(num);
  if(!looksValid){
    showError(t('err_invalid_format'));
    input?.focus();
    return;
  }

  // UI: reset
  hideMsg(errorMsg);
  if(resultDiv){ resultDiv.style.display = 'none'; }

  try{
    let data = null;
    if(USE_STATIC_DATA){
      const payload = await getStaticJson('tracking.json');
      const items = Array.isArray(payload?.data) ? payload.data
        : Array.isArray(payload?.items) ? payload.items
        : Array.isArray(payload) ? payload
        : [];
      const match = items.find(it => (it.tracking_number || '').toUpperCase() === num.toUpperCase());
      if(!match){
        showError(t('err_not_found'));
        return;
      }
      data = match;
    }else{
      const res = await fetch(apiUrl('track_process.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'tracking_number=' + encodeURIComponent(num)
      });

      const rawText = await res.text();
      try{
        data = JSON.parse(rawText);
      }catch(e){
        console.error('Non-JSON response:', rawText);
        throw new Error('JSON_PARSE');
      }

      if(!data.success){
        showError(data.message || t('err_not_found'));
        return;
      }
    }

    lastTrackingData = data;
    renderTracking(data);

  }catch(err){
    console.error(err);
    showError(t('err_server'));
  }

  function showError(msg){
    if(resultDiv){ resultDiv.style.display='none'; }
    if(errorMsg){
      errorMsg.textContent = msg;
      errorMsg.style.display = 'block';
    }else{
      alert(msg);
    }
  }
}

function updateTimelineSteps(status){
  const step1 = $('step1');
  const step2 = $('step2');
  const step3 = $('step3');
  if(!step1 || !step2 || !step3) return;

  // Reset
  step1.classList.add('active');
  step2.classList.remove('active');
  step3.classList.remove('active');
  step1.classList.remove('current');
  step2.classList.remove('current');
  step3.classList.remove('current');

  const inTransit = STATUS_KEYWORDS.inTransit;
  const delivered = STATUS_KEYWORDS.delivered;

  if(inTransit.some(k => status.includes(k))) {
    step2.classList.add('active');
    step2.classList.add('current');
  }
  if(delivered.some(k => status.includes(k))) {
    step2.classList.add('active');
    step3.classList.add('active');
    step3.classList.add('current');
  }
}

function renderHistory(history){
  const box = $('history_box');
  const list = $('history_list');
  if(!box || !list) return;

  list.innerHTML = '';

  if(!Array.isArray(history) || history.length === 0){
    box.style.display = 'none';
    return;
  }

  history.forEach(item => {
    const li = document.createElement('li');
    li.className = 'history-item';

    const left = document.createElement('div');
    left.className = 'history-left';
    left.innerHTML = `<div class="history-status">${escapeHtml(translateStatus(item.status || '--'))}</div>
                      <div class="history-office">${escapeHtml(item.office || '--')}</div>`;

    const right = document.createElement('div');
    right.className = 'history-right';
    right.textContent = item.event_time || '--';

    li.appendChild(left);
    li.appendChild(right);
    list.appendChild(li);
  });

  box.style.display = 'block';
}

function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

async function getStaticJson(file){
  if(staticCache[file]) return staticCache[file];
  if(IS_FILE_PROTOCOL){
    const inline = file === 'news.json' ? INLINE_DATA.news
      : file === 'agencies.json' ? INLINE_DATA.agencies
      : file === 'delais.json' ? INLINE_DATA.delais
      : file === 'tracking.json' ? INLINE_DATA.tracking
      : null;
    staticCache[file] = inline;
    return inline;
  }
  const res = await fetch(dataUrl(file));
  const data = await res.json();
  staticCache[file] = data;
  return data;
}

function initHeroSlider(){
  const slider = document.querySelector('.hero-slider');
  if(!slider) return;

  const slides = Array.from(slider.querySelectorAll('.hero-slide'));
  const dots = Array.from(slider.querySelectorAll('.hero-dot'));
  const prevBtn = slider.querySelector('.hero-nav.prev');
  const nextBtn = slider.querySelector('.hero-nav.next');
  if(slides.length === 0) return;

  let index = slides.findIndex(s => s.classList.contains('active'));
  if(index < 0) index = 0;
  let timer = null;

  const setActive = (nextIndex) => {
    slides[index]?.classList.remove('active');
    dots[index]?.classList.remove('active');
    index = (nextIndex + slides.length) % slides.length;
    slides[index]?.classList.add('active');
    dots[index]?.classList.add('active');
  };

  const next = () => setActive(index + 1);
  const prev = () => setActive(index - 1);
  const stop = () => { if(timer){ clearInterval(timer); timer = null; } };
  const start = () => { stop(); timer = setInterval(next, 5000); };

  prevBtn?.addEventListener('click', () => { prev(); start(); });
  nextBtn?.addEventListener('click', () => { next(); start(); });
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { setActive(i); start(); });
  });

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  document.addEventListener('visibilitychange', () => {
    if(document.hidden){ stop(); } else { start(); }
  });

  start();
}

// Enter key submits tracking
document.addEventListener('DOMContentLoaded', () => {
  const input = $('track_input');
  if(input){
    input.addEventListener('keydown', (e) => {
      if(e.key === 'Enter') trackColis();
    });
  }

  const loadingPage = document.querySelector('.loading-page');
  if(loadingPage && window.gsap){
    gsap.fromTo(
      loadingPage,
      { opacity: 1 },
      { opacity: 0, display: "none", duration: 0.9, delay: 1.3, ease: "power1.inOut" }
    );
    gsap.fromTo(
      ".logo-name",
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, delay: 0.15, ease: "power2.out" }
    );
    gsap.fromTo(
      ".loading-logo",
      { scale: 0.85, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, delay: 0.05, ease: "power2.out" }
    );
  }

  const header = document.querySelector('header');
  if(header){
    let lastY = window.scrollY;
    let acc = 0;
    let ticking = false;
    const delta = 8;
    const minY = 80;

    const updateHeader = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastY;
      acc += diff;

      if(currentY <= minY){
        header.classList.remove('header-hidden');
        acc = 0;
      }else if(acc > delta){
        header.classList.add('header-hidden');
        acc = 0;
      }else if(acc < -delta){
        header.classList.remove('header-hidden');
        acc = 0;
      }

      lastY = currentY;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if(!ticking){
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive:true });
  }

  initHeroSlider();

  // Load news on home if available
  if($('news_grid')) {
    loadNews();
  }

  // Auto-load agencies list on agencies page
  if($('agency_list')) {
    loadAgencies();
  }

  // -----------------------------
  // 2) Tarifs calculator (if page)
  // -----------------------------
  const zone = $('zone');
  const poids = $('poids');
  const vitesse = $('vitesse');
  const packing = $('packing');

  if(zone && poids && vitesse && packing){
    const totalPrice = $('total-price');
    const details = $('details');
    const resultBox = $('result-box');

    const updatePrice = () => {
      const base = parseFloat(zone.value);
      const w = parseFloat(poids.value) || 0;
      const speed = parseFloat(vitesse.value);
      const pack = parseFloat(packing.value);
      const speedLabel = vitesse.options[vitesse.selectedIndex]?.text || '';

      if(w <= 0){
        if(totalPrice) totalPrice.textContent = '-- DT';
        return;
      }

      const total = (base * w * speed) + pack;
      if(totalPrice) totalPrice.textContent = total.toFixed(3) + ' DT';
      if(details) details.textContent = tf('tf_calc_details', { weight: w, speed: speedLabel });

      if(resultBox){
        resultBox.style.transform = 'scale(1.02)';
        setTimeout(()=>{ resultBox.style.transform = 'scale(1)'; }, 150);
      }
    };

    [zone, poids, vitesse, packing].forEach(el => el.addEventListener('input', updatePrice));
    updatePrice();
  }
});

// -----------------------------
// 3) News (DB -> cards)
// -----------------------------
async function loadNews(){
  const grid = $('news_grid');
  if(!grid) return;

  try{
    let payload;
    if(USE_STATIC_DATA){
      payload = await getStaticJson('news.json');
    }else{
      const res = await fetch(apiUrl('news_api.php'));
      payload = await res.json();
    }
    if(payload && payload.success === false){ throw new Error('NEWS_FAIL'); }

    const items = Array.isArray(payload?.data) ? payload.data
      : Array.isArray(payload?.items) ? payload.items
      : Array.isArray(payload) ? payload
      : [];
    grid.innerHTML = '';
    if(items.length === 0){
      grid.innerHTML = `<div class="news-card">
        <span class="tag">${escapeHtml(t('news_tag_info'))}</span>
        <h3>${escapeHtml(t('news_empty_title'))}</h3>
        <p>${escapeHtml(t('news_empty_body'))}</p>
        <div class="date">--</div>
      </div>`;
      return;
    }

    items.forEach(n => {
      const card = document.createElement('div');
      card.className = 'news-card';
      card.innerHTML = `
        <span class="tag">${escapeHtml(n.category || t('news_tag_info'))}</span>
        <h3>${escapeHtml(n.title || '--')}</h3>
        <p>${escapeHtml(n.body || '')}</p>
        <div class="date">${escapeHtml(n.published_at || '--')}</div>
      `;
      grid.appendChild(card);
    });
  }catch(e){
    console.error(e);
    grid.innerHTML = `<div class="news-card">
      <span class="tag">${escapeHtml(t('news_tag_error'))}</span>
      <h3>${escapeHtml(t('news_error_title'))}</h3>
      <p>${escapeHtml(t('news_error_body'))}</p>
      <div class="date">--</div>
    </div>`;
  }
}

// -----------------------------
// 4) Agencies search (DB)
// -----------------------------
async function loadAgencies(){
  const list = $('agency_list');
  const msg = $('agency_msg');
  if(!list) return;

  const q = ($('agency_q')?.value || '').trim();
  const type = ($('agency_type')?.value || '').trim();

  list.innerHTML = '';
  hideMsg(msg);

  try{
    let payload;
    if(USE_STATIC_DATA){
      payload = await getStaticJson('agencies.json');
    }else{
      const url = `${apiUrl('agencies_api.php')}?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`;
      const res = await fetch(url);
      payload = await res.json();
    }
    if(payload && payload.success === false) throw new Error('AG_FAIL');

    const rawItems = Array.isArray(payload?.data) ? payload.data
      : Array.isArray(payload?.items) ? payload.items
      : Array.isArray(payload) ? payload
      : [];

    const qn = normalizeText(q);
    const items = rawItems.filter(a => {
      if(type && normalizeText(a.type || '') !== normalizeText(type)) return false;
      if(!qn) return true;
      const hay = normalizeText(`${a.name || ''} ${a.address || ''} ${a.city || ''} ${a.governorate || ''}`);
      return hay.includes(qn);
    });
    if(items.length === 0){
      if(msg){ msg.textContent = t('agencies_none'); msg.style.display='block'; }
      return;
    }

    items.forEach(a => {
      const div = document.createElement('div');
      div.className = 'list-item';
      const phone = a.phone ? `${t('ag_label_phone')}: ${a.phone}` : '';
      const hours = a.hours ? `${t('ag_label_hours')}: ${a.hours}` : '';
      div.innerHTML = `
        <div>
          <h4>${escapeHtml(a.name || '--')}</h4>
          <p>${escapeHtml(a.address || '--')}</p>
          <p>${escapeHtml((a.city || '--') + ' - ' + (a.governorate || '--'))}</p>
          <p>${escapeHtml(phone)}</p>
          <p>${escapeHtml(hours)}</p>
        </div>
        <span class="badge">${escapeHtml(a.type || t('ag_type_bureau'))}</span>
      `;
      list.appendChild(div);
    });
  }catch(e){
    console.error(e);
    if(msg){ msg.textContent = t('agencies_error'); msg.style.display='block'; }
  }
}

// -----------------------------
// 5) Delays estimator (DB + fallback)
// -----------------------------
async function estimateDelais(){
  const box = $('delais_box');
  const msg = $('delais_msg');
  const value = $('delais_value');
  const details = $('delais_details');

  const origin = ($('origin')?.value || '').trim();
  const destination = ($('destination')?.value || '').trim();
  const service = ($('service')?.value || '').trim();

  const originLabel = $('origin')?.selectedOptions?.[0]?.textContent || origin;
  const destLabel = $('destination')?.selectedOptions?.[0]?.textContent || destination;
  const serviceLabel = $('service')?.selectedOptions?.[0]?.textContent || service;

  hideMsg(msg);
  if(box){ box.style.display='none'; }

  try{
    let payload;
    if(USE_STATIC_DATA){
      payload = await getStaticJson('delais.json');
    }else{
      const res = await fetch(apiUrl('delais_process.php'), {
        method: 'POST',
        headers: { 'Content-Type':'application/x-www-form-urlencoded' },
        body: `origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&service=${encodeURIComponent(service)}`
      });
      payload = await res.json();
    }

    if(payload && payload.success === false){
      if(msg){ msg.textContent = payload.message || t('dl_msg_error'); msg.style.display='block'; }
      return;
    }

    let rule = null;
    if(USE_STATIC_DATA){
      const rules = Array.isArray(payload?.rules) ? payload.rules : [];
      rule = rules.find(r =>
        normalizeText(r.origin || '') === normalizeText(origin)
        && normalizeText(r.destination || '') === normalizeText(destination)
        && normalizeText(r.service || '') === normalizeText(service)
      ) || payload?.default || null;
    }else{
      rule = payload;
    }

    const min = rule?.min_days;
    const max = rule?.max_days;
    const unit = t('dl_days_unit');
    if(value) value.textContent = `${min} - ${max} ${unit}`;
    if(details) details.textContent = tf('dl_details_template', {
      service: serviceLabel,
      origin: originLabel,
      destination: destLabel,
      note: rule?.note || ''
    }).trim();
    if(box) box.style.display='block';

  }catch(e){
    console.error(e);
    if(msg){ msg.textContent = t('dl_msg_comm_error'); msg.style.display='block'; }
  }
}

// -----------------------------
// 6) Contact form (DB)
// -----------------------------
async function sendContact(){
  const out = $('contact_msg');
  const name = ($('c_name')?.value || '').trim();
  const email = ($('c_email')?.value || '').trim();
  const message = ($('c_msg')?.value || '').trim();

  hideMsg(out);

  if(!name || !email || !message){
    if(out){
      out.textContent = t('ct_msg_required');
      out.style.display = 'block';
      out.style.color = '#e74c3c';
    }
    return;
  }

  try{
    if(USE_STATIC_DATA){
      const existing = JSON.parse(localStorage.getItem('rp_contacts') || '[]');
      existing.push({ name, email, message, sent_at: new Date().toISOString() });
      localStorage.setItem('rp_contacts', JSON.stringify(existing));
      if(out){ out.textContent = t('ct_msg_success'); out.style.display='block'; out.style.color='#27ae60'; }
      if($('c_msg')) $('c_msg').value='';
      return;
    }

    const res = await fetch(apiUrl('contact_process.php'), {
      method: 'POST',
      headers: { 'Content-Type':'application/x-www-form-urlencoded' },
      body: `name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&message=${encodeURIComponent(message)}`
    });
    const data = await res.json();
    if(!data.success){
      if(out){ out.textContent = data.message || t('ct_msg_error'); out.style.display='block'; out.style.color='#e74c3c'; }
      return;
    }
    if(out){ out.textContent = data.message || t('ct_msg_success'); out.style.display='block'; out.style.color='#27ae60'; }
    if($('c_msg')) $('c_msg').value='';
  }catch(e){
    console.error(e);
    if(out){ out.textContent = t('ct_msg_comm_error'); out.style.display='block'; out.style.color='#e74c3c'; }
  }
}

document.addEventListener('rp:lang', () => {
  if(lastTrackingData) renderTracking(lastTrackingData);
});
