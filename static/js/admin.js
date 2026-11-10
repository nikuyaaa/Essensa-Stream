let questions = [];
let activeQuestion = null;
let broadcastConfig = {};
let focusedIndex = 0;
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements - Master Control Deck
const monitorContentEl = document.getElementById('monitor-content');
const btnClearStream = document.getElementById('btn-clear-stream');
const btnTransportPrev = document.getElementById('btn-transport-prev');
const btnTransportNext = document.getElementById('btn-transport-next');
const btnTransportToggle = document.getElementById('btn-transport-toggle');
const btnTransportDone = document.getElementById('btn-transport-done');

// DOM Elements - Metrics
const metricUnansweredEl = document.getElementById('metric-unanswered');
const metricAnsweredEl = document.getElementById('metric-answered');
const metricTotalEl = document.getElementById('metric-total');
const tabBadgeQCountEl = document.getElementById('tab-badge-q-count');
const filteredCountEl = document.getElementById('filtered-count');

// DOM Elements - Queue
const qListEl = document.getElementById('questions-list');
const addDrawerEl = document.getElementById('add-drawer');
const addForm = document.getElementById('add-form');
const queueSearchEl = document.getElementById('queue-search');

// DOM Elements - Config Inputs
const cfgTitleEl = document.getElementById('cfg-episode-title');
const cfgSubEl = document.getElementById('cfg-episode-sub');
const cfgCtaEl = document.getElementById('cfg-cta-badge');
const cfgTickerEl = document.getElementById('cfg-ticker-text');

// DOM Elements - Top Banner & Speaker
const cfgLtNameEl = document.getElementById('cfg-lt-name');
const cfgLtTitleEl = document.getElementById('cfg-lt-title');
const cfgLtCredsEl = document.getElementById('cfg-lt-creds');
const cfgLtPositionEl = document.getElementById('cfg-lt-position');
const cfgSocialsEl = document.getElementById('cfg-socials');
const btnLtToggle = document.getElementById('btn-lt-toggle');
const btnLtToggleTxt = document.getElementById('btn-lt-toggle-txt');
const btnDeckLtToggle = document.getElementById('btn-deck-lt-toggle');
const btnDeckLtTxt = document.getElementById('btn-deck-lt-txt');
const prevTopTitleEl = document.getElementById('prev-top-title');
const prevTopSubEl = document.getElementById('prev-top-sub');
const prevLtBox = document.getElementById('prev-lt-box');
const prevLtName = document.getElementById('prev-lt-name');
const prevLtSub = document.getElementById('prev-lt-sub');
const prevLtStatus = document.getElementById('prev-lt-status');

// DOM Elements - Live Preview
const prevTitleEl = document.getElementById('prev-title');
const prevSubEl = document.getElementById('prev-sub');
const prevCtaEl = document.getElementById('prev-cta');
const prevTickerEl = document.getElementById('prev-ticker');

// DOM Elements - Modals
const hotkeysModal = document.getElementById('hotkeys-modal');
const btnOpenHotkeys = document.getElementById('btn-open-hotkeys');
const btnCloseHotkeys = document.getElementById('btn-close-hotkeys');

// WebSocket setup
function setupWS() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}/ws-v2?role=admin`);
  const statusEl = document.getElementById('txt-overlay-status');

  ws.onopen = () => {
    if (statusEl) statusEl.textContent = 'Engine Connected';
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'SHOW_QUESTION') {
        activeQuestion = msg.data;
        renderAll();
      } else if (msg.type === 'HIDE_QUESTION') {
        activeQuestion = null;
        renderAll();
      } else if (msg.type === 'QUESTIONS_UPDATED') {
        questions = msg.questions;
        renderAll();
      } else if (msg.type === 'CONFIG_UPDATED') {
        broadcastConfig = msg.config;
        populateConfigInputs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  ws.onclose = () => {
    if (statusEl) statusEl.textContent = 'Reconnecting...';
    setTimeout(setupWS, 2000);
  };
}

// Fetch Initial State
async function fetchState() {
  try {
    const res = await fetch('/api/questions');
    const data = await res.json();
    questions = data.questions || [];
    activeQuestion = data.active || null;
    broadcastConfig = data.config || {};
    populateConfigInputs();
    updateObsLinks();
    renderAll();
  } catch (err) {
    console.error('Failed fetching data:', err);
  }
}

function updateObsLinks() {
  const base = `${window.location.protocol}//${window.location.host}`;
  const elL = document.getElementById('url-obs-landscape');
  const elP = document.getElementById('url-obs-portrait');
  if (elL) elL.textContent = `${base}/overlay/landscape`;
  if (elP) elP.textContent = `${base}/overlay/portrait`;
}

function populateConfigInputs() {
  if (cfgTitleEl && broadcastConfig.episode_title) cfgTitleEl.value = broadcastConfig.episode_title;
  if (cfgSubEl && broadcastConfig.episode_subtitle) cfgSubEl.value = broadcastConfig.episode_subtitle;
  if (cfgCtaEl && broadcastConfig.call_to_action) cfgCtaEl.value = broadcastConfig.call_to_action;
  if (cfgTickerEl && broadcastConfig.ticker_text) cfgTickerEl.value = broadcastConfig.ticker_text;
  if (cfgSocialsEl && broadcastConfig.socials) cfgSocialsEl.value = broadcastConfig.socials;

  const speaker = broadcastConfig.speaker || broadcastConfig.lower_third;
  if (speaker) {
    if (cfgLtNameEl && speaker.name) cfgLtNameEl.value = speaker.name;
    if (cfgLtTitleEl && speaker.title) cfgLtTitleEl.value = speaker.title;
    if (cfgLtCredsEl && speaker.credentials) cfgLtCredsEl.value = speaker.credentials;
  }
  updateLivePreview();
}

function updateLivePreview() {
  if (prevTitleEl && cfgTitleEl) prevTitleEl.textContent = cfgTitleEl.value || 'Itanong Mo Kay Doc!';
  if (prevSubEl && cfgSubEl) prevSubEl.textContent = cfgSubEl.value || 'Live Q&A with Doc';
  if (prevCtaEl && cfgCtaEl) {
    const val = cfgCtaEl.value || 'Magtanong sa Comments!';
    prevCtaEl.innerHTML = `<i data-lucide="message-square" style="width:10px; height:10px;"></i> ${escapeHtml(val)}`;
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }
  if (prevTickerEl && cfgTickerEl) prevTickerEl.textContent = cfgTickerEl.value || 'Continuous news ticker...';

  if (prevTopTitleEl && cfgLtNameEl) {
    prevTopTitleEl.textContent = (cfgLtNameEl.value || 'Dr. Juan Dela Cruz, MD').toUpperCase();
  }
  if (prevTopSubEl && cfgLtTitleEl) {
    prevTopSubEl.textContent = (cfgLtTitleEl.value || 'Naturopath Doctor').toUpperCase();
  }
}

[cfgTitleEl, cfgSubEl, cfgCtaEl, cfgTickerEl, cfgLtNameEl, cfgLtTitleEl, cfgLtCredsEl, cfgSocialsEl].forEach(input => {
  if (input) {
    input.addEventListener('input', updateLivePreview);
    input.addEventListener('change', updateLivePreview);
  }
});

// Tab Navigation Logic (Modern Accessible Standards)
const tabButtons = document.querySelectorAll('[role="tab"]');
const tabPanels = document.querySelectorAll('[role="tabpanel"]');

function switchTab(targetTabId) {
  tabButtons.forEach(btn => {
    const isSelected = btn.id === targetTabId;
    btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    btn.toggleAttribute('focusgroupstart', isSelected);
  });

  tabPanels.forEach(panel => {
    const matches = panel.getAttribute('aria-labelledby') === targetTabId;
    if (matches) {
      panel.removeAttribute('hidden');
    } else {
      panel.setAttribute('hidden', '');
    }
  });
}

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.id));
  btn.addEventListener('keydown', (e) => {
    const tabsArr = Array.from(tabButtons);
    const currIdx = tabsArr.indexOf(btn);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const nextTab = tabsArr[(currIdx + 1) % tabsArr.length];
      nextTab.focus();
      switchTab(nextTab.id);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const prevTab = tabsArr[(currIdx - 1 + tabsArr.length) % tabsArr.length];
      prevTab.focus();
      switchTab(prevTab.id);
    }
  });
});

// Deck Collapsible Logic
function toggleDeckCollapse() {
  const deck = document.getElementById('broadcast-deck');
  const body = document.getElementById('deck-body');
  const compact = document.getElementById('deck-compact-bar');
  const header = document.getElementById('deck-header');
  if (!deck) return;

  const isCollapsed = deck.classList.toggle('is-collapsed');
  if (body) body.hidden = isCollapsed;
  if (header) header.hidden = isCollapsed;
  if (compact) compact.hidden = !isCollapsed;

  if (window.lucide && window.lucide.createIcons) {
    window.lucide.createIcons();
  }
  try {
    localStorage.setItem('operator_deck_collapsed', isCollapsed ? 'true' : 'false');
  } catch (e) {}
}

function initDeckCollapse() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('collapsed') === '1' || urlParams.get('collapsed') === 'true') {
      const deck = document.getElementById('broadcast-deck');
      if (deck && !deck.classList.contains('is-collapsed')) {
        toggleDeckCollapse();
      }
      return;
    }
    if (localStorage.getItem('operator_deck_collapsed') === 'true') {
      toggleDeckCollapse();
    }
  } catch (e) {}
}

// Initial Tab Routing from URL (?tab=frames or #panel-frames)
function initTabFromUrl() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab') || window.location.hash.replace('#', '');
    if (tabParam) {
      const matchBtn = document.getElementById(tabParam) || 
                       document.getElementById(`tab-${tabParam}`) || 
                       document.querySelector(`[aria-controls="${tabParam}"]`);
      if (matchBtn) {
        switchTab(matchBtn.id);
      }
    }
  } catch (e) {}
}

// Filtering & Search
function setQueueFilter(filterType, btnEl) {
  currentFilter = filterType;
  document.querySelectorAll('.btn-filter-chip').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderAll();
}

function handleSearch(val) {
  searchQuery = (val || '').trim().toLowerCase();
  renderAll();
}

function toggleAddDrawer() {
  if (!addDrawerEl) return;
  addDrawerEl.classList.toggle('open');
  if (addDrawerEl.classList.contains('open')) {
    document.getElementById('input-name')?.focus();
  }
}

function getFilteredQuestions() {
  return questions.filter(q => {
    if (currentFilter === 'pending' && q.is_answered) return false;
    if (currentFilter === 'answered' && !q.is_answered) return false;
    if (currentFilter === 'facebook' && q.platform !== 'facebook') return false;
    if (currentFilter === 'tiktok' && q.platform !== 'tiktok') return false;

    if (searchQuery) {
      const nameMatch = (q.submitter_name || '').toLowerCase().includes(searchQuery);
      const textMatch = (q.question_text || '').toLowerCase().includes(searchQuery);
      return nameMatch || textMatch;
    }
    return true;
  });
}

// Render Master UI
function renderAll() {
  // Update Metrics
  const answeredCount = questions.filter(q => q.is_answered).length;
  const unansweredCount = questions.length - answeredCount;

  if (metricUnansweredEl) metricUnansweredEl.textContent = unansweredCount;
  if (metricAnsweredEl) metricAnsweredEl.textContent = answeredCount;
  if (metricTotalEl) metricTotalEl.textContent = questions.length;
  if (tabBadgeQCountEl) tabBadgeQCountEl.textContent = questions.length;

  // Master On-Air Monitor & Compact Snippet
  const compactSnippet = document.getElementById('compact-snippet');
  const deckLivePill = document.getElementById('deck-live-pill');

  if (activeQuestion) {
    if (deckLivePill) deckLivePill.hidden = false;
    if (compactSnippet) {
      compactSnippet.innerHTML = `
        <span class="snippet-tag on-air">● ON AIR</span>
        <span class="platform-badge ${activeQuestion.platform}">${activeQuestion.platform}</span>
        <strong style="color:var(--text-main); margin-left:4px;">${escapeHtml(activeQuestion.submitter_name)}:</strong>
        <span class="snippet-text">${escapeHtml(activeQuestion.question_text)}</span>
      `;
    }

    if (monitorContentEl) {
      monitorContentEl.className = 'live-monitor-box is-live';
      monitorContentEl.innerHTML = `
        <div class="monitor-live-bar">
          <span class="monitor-live-badge"><span class="live-dot-pulse"></span> ON AIR NOW</span>
          <button type="button" onclick="hideFromStream()" class="btn-monitor-take-down" title="Hide from Stream [Esc]">Take Down</button>
        </div>
        <div class="monitor-meta-strip">
          <span class="platform-badge ${activeQuestion.platform}">${activeQuestion.platform}</span>
          <span class="monitor-author-name">${escapeHtml(activeQuestion.submitter_name)}</span>
          ${activeQuestion.is_answered ? `<span class="monitor-answered-indicator"><i data-lucide="check" class="icon-xs"></i> Answered</span>` : ''}
        </div>
        <div class="monitor-question-body">${escapeHtml(activeQuestion.question_text)}</div>
      `;
    }
  } else {
    if (deckLivePill) deckLivePill.hidden = true;
    if (compactSnippet) {
      compactSnippet.innerHTML = `
        <span class="snippet-tag">○ STREAM CLEAN</span>
        <span class="snippet-text">Ready to broadcast — Pick question below or press <kbd>Space</kbd></span>
      `;
    }

    if (monitorContentEl) {
      monitorContentEl.className = 'live-monitor-box is-empty';
      monitorContentEl.innerHTML = `
        <div class="monitor-empty-state">
          <span class="monitor-idle-tag">○ STREAM CLEAN</span>
          <p class="monitor-idle-text">No question currently on air. Choose a question from the queue below or press <kbd>Space</kbd> to broadcast.</p>
        </div>
      `;
    }
  }

  // Filtered Questions List
  const visibleList = getFilteredQuestions();
  if (filteredCountEl) filteredCountEl.textContent = visibleList.length;

  if (visibleList.length === 0) {
    qListEl.innerHTML = `
      <div class="queue-empty-box">
        <p>${searchQuery || currentFilter !== 'all' ? 'No matching questions found.' : 'No questions in queue. Click "+ Add Question" to get started!'}</p>
      </div>
    `;
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    return;
  }

  if (focusedIndex >= visibleList.length) {
    focusedIndex = Math.max(0, visibleList.length - 1);
  }

  qListEl.innerHTML = visibleList.map((q, idx) => {
    const isActive = activeQuestion && activeQuestion.id === q.id;
    const isFocused = idx === focusedIndex;

    return `
      <div class="q-item ${isActive ? 'is-active-on-stream' : ''} ${q.is_answered ? 'is-answered-tag' : ''} ${isFocused ? 'is-focused' : ''}"
           onclick="focusItemIndex(${idx})"
           id="q-row-${idx}">
        <div class="q-content">
          <div class="q-meta">
            <span class="platform-badge ${q.platform}">${q.platform}</span>
            <span class="q-author">${escapeHtml(q.submitter_name)}</span>
            ${isActive ? `<span class="q-badge-live">● ON AIR</span>` : ''}
            ${isFocused && !isActive ? `<span class="q-badge-focus">FOCUS</span>` : ''}
            ${q.is_answered ? `<span class="q-badge-answered"><i data-lucide="check" class="icon-xs"></i> Answered</span>` : ''}
          </div>
          <div class="q-text">${escapeHtml(q.question_text)}</div>
        </div>
        <div class="q-actions">
          ${isActive 
            ? `<button type="button" onclick="event.stopPropagation(); hideFromStream()" class="btn-q-hide" title="Hide Overlay [Esc]">Hide</button>`
            : `<button type="button" onclick="event.stopPropagation(); showOnStream('${q.id}')" class="btn-q-show" title="Show on Stream [Enter]">Show on Air</button>`
          }
          <button type="button" onclick="event.stopPropagation(); toggleAnswered('${q.id}')" class="btn-q-done" title="Mark Answered [D]">
            ${q.is_answered ? 'Undo' : 'Done'}
          </button>
          <button type="button" onclick="event.stopPropagation(); deleteQuestion('${q.id}')" class="btn-q-del" title="Delete Question"><i data-lucide="trash-2" class="icon-xs"></i></button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide && window.lucide.createIcons) {
    window.lucide.createIcons();
  }
}

function focusItemIndex(idx) {
  focusedIndex = idx;
  renderAll();
  const el = document.getElementById(`q-row-${idx}`);
  if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function moveCursor(delta) {
  const visible = getFilteredQuestions();
  if (!visible.length) return;
  const newIdx = Math.max(0, Math.min(visible.length - 1, focusedIndex + delta));
  if (newIdx !== focusedIndex) {
    focusItemIndex(newIdx);
  }
}

// User Actions
async function showOnStream(id) {
  await fetch('/api/stream/show', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
}

async function hideFromStream() {
  await fetch('/api/stream/hide', { method: 'POST' });
}

async function streamNext() {
  await fetch('/api/stream/next');
}

async function streamPrev() {
  await fetch('/api/stream/prev');
}

async function streamToggle() {
  await fetch('/api/stream/toggle');
}

async function streamDoneNext() {
  await fetch('/api/stream/done-next');
}

async function toggleAnswered(id) {
  await fetch(`/api/questions/${id}/toggle-answered`, { method: 'POST' });
}

async function deleteQuestion(id) {
  if (confirm('Delete this question from the queue?')) {
    await fetch(`/api/questions/${id}`, { method: 'DELETE' });
  }
}

// Global Keyboard Hotkeys
document.addEventListener('keydown', (e) => {
  const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable;

  if (isInput) {
    if (e.key === 'Escape') e.target.blur();
    return;
  }

  // Modal open handling
  if (hotkeysModal && !hotkeysModal.classList.contains('hidden')) {
    if (e.key === 'Escape' || e.key === '?') {
      hotkeysModal.classList.add('hidden');
      e.preventDefault();
    }
    return;
  }

  // Emergency Hide
  if (e.key === 'Escape') {
    e.preventDefault();
    hideFromStream();
    return;
  }

  // Toggle On-Air
  if (e.code === 'Space') {
    e.preventDefault();
    const visible = getFilteredQuestions();
    if (activeQuestion) {
      hideFromStream();
    } else if (visible[focusedIndex]) {
      showOnStream(visible[focusedIndex].id);
    } else {
      streamToggle();
    }
    return;
  }

  // Navigate Queue (Down / J)
  if (e.key === 'ArrowDown' || e.key === 'j') {
    e.preventDefault();
    moveCursor(1);
    return;
  }

  // Navigate Queue (Up / K)
  if (e.key === 'ArrowUp' || e.key === 'k') {
    e.preventDefault();
    moveCursor(-1);
    return;
  }

  // Show Selected on Air (Enter)
  if (e.key === 'Enter') {
    e.preventDefault();
    const visible = getFilteredQuestions();
    if (visible[focusedIndex]) {
      showOnStream(visible[focusedIndex].id);
    }
    return;
  }

  // Next Question (N)
  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    streamNext();
    return;
  }

  // Previous Question (P)
  if (e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    streamPrev();
    return;
  }

  // Mark Done & Advance (D)
  if (e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    streamDoneNext();
    return;
  }

  // Focus Speaker in Top Header Banner (L)
  if (e.key === 'l' || e.key === 'L') {
    e.preventDefault();
    focusSpeakerTop();
    return;
  }

  // Toggle Cheat Sheet (?)
  if (e.key === '?') {
    e.preventDefault();
    hotkeysModal.classList.toggle('hidden');
    return;
  }
});

// Wire Master Deck Controls
btnClearStream?.addEventListener('click', hideFromStream);
btnTransportPrev?.addEventListener('click', streamPrev);
btnTransportNext?.addEventListener('click', streamNext);
btnTransportToggle?.addEventListener('click', streamToggle);
btnTransportDone?.addEventListener('click', streamDoneNext);

// Modal Controls
btnOpenHotkeys?.addEventListener('click', () => hotkeysModal.classList.remove('hidden'));
btnCloseHotkeys?.addEventListener('click', () => hotkeysModal.classList.add('hidden'));
hotkeysModal?.addEventListener('click', (e) => {
  if (e.target === hotkeysModal) hotkeysModal.classList.add('hidden');
});

// Top Banner & Speaker Management
function applyLtPreset(name, title) {
  if (cfgLtNameEl) cfgLtNameEl.value = name;
  if (cfgLtTitleEl) cfgLtTitleEl.value = title;
  updateLivePreview();
}

async function focusSpeakerTop() {
  const name = cfgLtNameEl ? cfgLtNameEl.value.trim() : 'Dr. Juan Dela Cruz, MD';
  const title = cfgLtTitleEl ? cfgLtTitleEl.value.trim() : 'Naturopath Doctor';
  const socials = cfgSocialsEl ? cfgSocialsEl.value.trim() : 'FB & TikTok: @itanongmokaydoc';

  try {
    await fetch('/api/stream/top-banner/focus-speaker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, title, socials })
    });
    if (btnLtToggleTxt) btnLtToggleTxt.textContent = 'Speaker on Top';
    if (btnDeckLtTxt) btnDeckLtTxt.textContent = 'Speaker on Top';
  } catch (e) {
    console.error('Failed to focus speaker on top banner:', e);
  }
}

async function saveSpeakerAndTopBanner(andFocus) {
  const name = cfgLtNameEl ? cfgLtNameEl.value.trim() : 'Dr. Juan Dela Cruz, MD';
  const title = cfgLtTitleEl ? cfgLtTitleEl.value.trim() : 'Naturopath Doctor';
  const socials = cfgSocialsEl ? cfgSocialsEl.value.trim() : 'FB & TikTok: @itanongmokaydoc';

  const body = {
    speaker: { name, title },
    lower_third: { name, title, active: true },
    socials
  };

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.config) {
      broadcastConfig = data.config;
    }

    if (andFocus) {
      await fetch('/api/stream/top-banner/focus-speaker', { method: 'POST' });
      alert('Top banner updated and speaker now focused on stream!');
    } else {
      alert('Top banner data updated successfully.');
    }
  } catch (e) {
    console.error('Failed to save top banner data:', e);
    alert('Error saving top banner data.');
  }
}

// Backward-compatibility aliases
const toggleLowerThird = focusSpeakerTop;
const saveLowerThird = saveSpeakerAndTopBanner;


// Add Question Form Submit
addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('input-name').value;
  const platform = document.getElementById('input-platform').value;
  const text = document.getElementById('input-text').value;

  await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submitter_name: name,
      platform,
      question_text: text
    })
  });

  addForm.reset();
  if (addDrawerEl) addDrawerEl.classList.remove('open');
});

// Presets Helpers
function applyCtaPreset(text) {
  if (cfgCtaEl) {
    cfgCtaEl.value = text;
    updateLivePreview();
  }
}

function appendDisclaimerPreset(type) {
  if (!cfgTickerEl) return;
  let text = '';
  if (type === 'disclaimer') {
    text = ' • Medical Disclaimer: Ang programang ito ay para sa pangkalahatang kaalaman lamang at hindi kapalit ng pormal na medikal na konsultasyon.';
  } else if (type === 'socials') {
    text = ' • Social Follow: I-follow kami sa aming official social media pages @itanongmokaydoc sa Facebook at TikTok!';
  } else if (type === 'consult') {
    text = ' • Health Advisory: Para sa check-up o maintenance medication inquiry, komunsulta sa pinakamalapit na klinika o ospital.';
  }

  cfgTickerEl.value = (cfgTickerEl.value + text).trim();
  updateLivePreview();
}

async function saveBroadcastFrames() {
  const updatedCfg = {
    episode_title: cfgTitleEl.value,
    episode_subtitle: cfgSubEl.value,
    call_to_action: cfgCtaEl.value,
    ticker_text: cfgTickerEl.value
  };

  await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedCfg)
  });

  alert('Broadcast Frames & Ticker successfully updated in OBS!');
}

async function testAudioChime() {
  if (activeQuestion) {
    await showOnStream(activeQuestion.id);
  } else {
    await fetch('/api/stream/show');
  }
}

async function clearAnsweredQuestions() {
  if (confirm('Archive all answered questions from the active queue?')) {
    await fetch('/api/questions-answered', { method: 'DELETE' });
  }
}

async function copyObsUrl(elemId, btn) {
  const el = document.getElementById(elemId);
  if (!el) return;
  const url = el.textContent.trim();
  try {
    await navigator.clipboard.writeText(url);
    const orig = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="check" class="icon-xs"></i> Copied!';
    btn.style.background = '#16A34A';
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }, 1500);
  } catch (e) {
    prompt('Copy URL:', url);
  }
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initial Boot
fetchState();
setupWS();
initDeckCollapse();
initTabFromUrl();
