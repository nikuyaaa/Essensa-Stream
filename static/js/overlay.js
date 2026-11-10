// Plays the synthesized /static/media/chime.wav for both Comment Intro and Next Comment Intro
class BroadcastAudio {
  constructor() {
    this.ctx = null;
    this.buffer = null;
    this.enabled = true;
    this.volume = 0.65;
    this.audioUrl = '/static/media/chime.wav?v=8';
    this.preloadBuffer();
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  async preloadBuffer() {
    try {
      this.init();
      const res = await fetch(this.audioUrl, { cache: 'no-store' });
      const arrayBuf = await res.arrayBuffer();
      if (this.ctx) {
        this.buffer = await this.ctx.decodeAudioData(arrayBuf);
      }
    } catch (e) {
      console.warn('[Overlay Audio] Preload buffer warning:', e);
    }
  }

  playChime() {
    if (!this.enabled) return;
    this.init();

    // 1. Play decoded chime.wav buffer via Web Audio API for zero-latency broadcast playback
    if (this.ctx && this.buffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffer;
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        source.start(0);
        return;
      } catch (e) {
        console.warn('[Overlay Audio] Buffer playback fallback:', e);
      }
    }

    // 2. Direct HTML5 Audio element playback of chime.wav
    try {
      const audio = new Audio(this.audioUrl);
      audio.volume = this.volume;
      audio.play().catch(() => {});
    } catch (e) {}
  }
}

const sfx = new BroadcastAudio();
window.addEventListener('click', () => sfx.init(), { once: true });

// DOM Elements
const card = document.getElementById('question-card');
const mainCardEl = card ? card.querySelector('.comment-card-main') : null;
const submitterEl = document.getElementById('submitter-name');
const questionEl = document.getElementById('question-text');
const platformBadgeEl = document.getElementById('platform-badge');

// Frame Elements
const frameTopEl = document.getElementById('top-frame');
const frameBottomEl = document.getElementById('bottom-frame');
const frameCtaBadgeEl = document.getElementById('frame-cta-badge');
const frameTickerTextEl = document.getElementById('frame-ticker-text');

// =========================================
// TOP BANNER CYCLING ENGINE
// =========================================
const ICONS = {
  mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/><line x1="8" x2="16" y1="22" y2="22"/></svg>`,
  stethoscope: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.8A2.5 2.5 0 0 0 2 5.3v2.4a7 7 0 0 0 14 0V5.3a2.5 2.5 0 0 0-2.8-2.5h-1.4A2.5 2.5 0 0 0 9 5.3v2.4a4 4 0 0 1-8 0V5.3a2.5 2.5 0 0 0-2.8-2.5Z"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="19" cy="11" r="3.5" stroke="currentColor"/><path d="M19 9.2v3.6M17.2 11h3.6" stroke="currentColor"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`,
  thumbsUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
  help: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
  leaf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`
};

class TopInfoCycle {
  constructor() {
    this.slideEl = document.getElementById('top-info-slide');
    this.titleEl = document.getElementById('top-info-title');
    this.subEl = document.getElementById('top-info-sub');
    this.wmLeft = document.getElementById('banner-wm-left');
    this.wmRight = document.getElementById('banner-wm-right');
    this.items = [];
    this.currentIndex = 0;
    this.timer = null;
    this.duration = 7000;
    this.isTransitioning = false;
    this.cachedConfig = null;

    // Initial default items before websocket sync
    this.items = [
      {
        type: 'speaker',
        title: 'DR. JUAN DELA CRUZ, MD',
        sub: 'NATUROPATH DOCTOR',
        leftIcon: 'mic',
        rightIcon: 'stethoscope'
      },
      {
        type: 'socials',
        title: 'FOLLOW OUR OFFICIAL PAGES',
        sub: 'FB & TIKTOK: @ITANONGMOKAYDOC',
        leftIcon: 'phone',
        rightIcon: 'thumbsUp'
      },
      {
        type: 'qa',
        title: 'LIVE HEALTH Q&A CONSULTATION',
        sub: 'I-COMMENT ANG INYONG MGA TANONG!',
        leftIcon: 'chat',
        rightIcon: 'help'
      },
      {
        type: 'topic',
        title: 'HOLISTIC HEALTH & NATURAL WELLNESS',
        sub: 'ESSENSA NATURALE • WAY OF LIVING',
        leftIcon: 'leaf',
        rightIcon: 'sparkle'
      }
    ];

    this.start();
  }

  buildPlaylist(cfg) {
    const speakerObj = cfg.speaker || cfg.lower_third || {};
    const speakerName = (speakerObj.name || 'Dr. Juan Dela Cruz, MD').trim();
    const speakerTitle = (speakerObj.title || 'Naturopath Doctor').trim();
    const socials = (cfg.socials || 'FB & TikTok: @itanongmokaydoc').trim();
    const topic = (cfg.episode_subtitle || 'Holistic Health & Natural Wellness').trim();

    const playlist = [
      {
        type: 'speaker',
        title: speakerName,
        sub: speakerTitle,
        leftIcon: 'mic',
        rightIcon: 'stethoscope'
      },
      {
        type: 'socials',
        title: 'FOLLOW OUR OFFICIAL PAGES',
        sub: socials,
        leftIcon: 'phone',
        rightIcon: 'thumbsUp'
      },
      {
        type: 'qa',
        title: 'LIVE HEALTH Q&A CONSULTATION',
        sub: 'I-COMMENT ANG INYONG MGA TANONG!',
        leftIcon: 'chat',
        rightIcon: 'help'
      },
      {
        type: 'topic',
        title: topic,
        sub: 'ESSENSA NATURALE • WAY OF LIVING',
        leftIcon: 'leaf',
        rightIcon: 'sparkle'
      }
    ];

    if (Array.isArray(cfg.custom_top_slides)) {
      for (const cs of cfg.custom_top_slides) {
        if (cs && cs.title) {
          playlist.push({
            type: 'custom',
            title: cs.title,
            sub: cs.sub || '',
            leftIcon: cs.leftIcon || 'leaf',
            rightIcon: cs.rightIcon || 'sparkle'
          });
        }
      }
    }

    return playlist;
  }

  updateConfig(cfg) {
    this.cachedConfig = cfg;
    if (cfg.top_cycle_duration && typeof cfg.top_cycle_duration === 'number') {
      this.duration = Math.max(3000, cfg.top_cycle_duration);
    }
    this.items = this.buildPlaylist(cfg);
    if (this.currentIndex >= this.items.length) {
      this.currentIndex = 0;
    }
    this.renderCurrent(false);
    this.start();
  }

  jumpToSpeaker() {
    const idx = this.items.findIndex(it => it.type === 'speaker');
    if (idx !== -1) {
      this.currentIndex = idx;
      this.renderCurrent(true);
      this.start(); // reset timer
    }
  }

  next() {
    if (this.items.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.renderCurrent(true);
  }

  renderCurrent(animate = true) {
    if (!this.titleEl || !this.subEl || !this.items[this.currentIndex]) return;
    const current = this.items[this.currentIndex];

    if (!animate || !this.slideEl) {
      this.applyItemData(current);
      return;
    }

    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.slideEl.classList.remove('active', 'slide-in-prep');
    this.slideEl.classList.add('slide-out');

    setTimeout(() => {
      this.applyItemData(current);
      this.slideEl.classList.remove('slide-out');
      this.slideEl.classList.add('slide-in-prep');

      void this.slideEl.offsetWidth; // force reflow

      this.slideEl.classList.remove('slide-in-prep');
      this.slideEl.classList.add('active');
      this.isTransitioning = false;
    }, 340);
  }

  applyItemData(item) {
    if (this.titleEl) this.titleEl.textContent = (item.title || '').toUpperCase();
    if (this.subEl) this.subEl.textContent = (item.sub || '').toUpperCase();

    if (this.wmLeft && ICONS[item.leftIcon]) {
      this.wmLeft.innerHTML = ICONS[item.leftIcon];
    }
    if (this.wmRight && ICONS[item.rightIcon]) {
      this.wmRight.innerHTML = ICONS[item.rightIcon];
    }
  }

  start() {
    this.stop();
    if (this.items.length > 1) {
      this.timer = setInterval(() => {
        this.next();
      }, this.duration);
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

const topBanner = new TopInfoCycle();

// Deck State
let isCardVisible = false;
let currentQuestionId = null;
let promoteCleanupTimer = null;

// WebSocket Connection
let ws = null;

function connectWS() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const role = window.location.pathname.includes('portrait') ? 'portrait' : 'landscape';
  const wsUrl = `${protocol}//${window.location.host}/ws-v2?role=${role}`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('[Overlay] Connected to broadcast server');
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    } catch (e) {
      console.error('[Overlay] Parse error:', e);
    }
  };

  ws.onclose = () => {
    setTimeout(connectWS, 2000);
  };
}

function populateCardText(q) {
  if (submitterEl) submitterEl.textContent = q.submitter_name || 'Anonymous';
  if (questionEl) questionEl.textContent = q.question_text || '';

  if (platformBadgeEl) {
    const platform = (q.platform || 'facebook').toLowerCase();
    platformBadgeEl.className = `platform-badge ${platform}`;
    platformBadgeEl.textContent = platform === 'facebook' ? 'Facebook' : (platform === 'tiktok' ? 'TikTok' : 'Question');
  }
}

function triggerDiscardAndPromote(q, shouldPlaySfx = true) {
  if (!card || !mainCardEl) {
    populateCardText(q);
    return;
  }

  card.querySelectorAll('.discarding-card').forEach(el => el.remove());

  // 1. Clone current top card to animate discard
  const discardClone = mainCardEl.cloneNode(true);
  discardClone.removeAttribute('id');
  discardClone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  discardClone.classList.add('discarding-card');
  card.appendChild(discardClone);

  discardClone.addEventListener('animationend', () => {
    discardClone.remove();
  }, { once: true });

  // 2. Populate underneath card with the new question
  populateCardText(q);

  // 3. Trigger promote animation
  card.classList.remove('promoting-deck');
  void card.offsetWidth;
  card.classList.add('promoting-deck');

  if (promoteCleanupTimer) clearTimeout(promoteCleanupTimer);
  promoteCleanupTimer = setTimeout(() => {
    card.classList.remove('promoting-deck');
  }, 850);

  // Play chime.wav on Next Comment Intro
  if (shouldPlaySfx) {
    sfx.playChime();
  }
}

function handleMessage(msg) {
  if (msg.type === 'RELOAD_OVERLAY') {
    window.location.reload();
    return;
  }

  if (msg.type === 'SHOW_QUESTION') {
    const q = msg.data;
    if (!q) return;
    const shouldPlaySfx = msg.play_sfx !== false;

    if (isCardVisible && currentQuestionId && currentQuestionId !== q.id) {
      // Next Comment Intro (Discard & Promote)
      currentQuestionId = q.id;
      triggerDiscardAndPromote(q, shouldPlaySfx);
    } else if (isCardVisible && currentQuestionId === q.id) {
      // Re-triggered while visible
      triggerDiscardAndPromote(q, shouldPlaySfx);
    } else {
      // Comment Intro (Deck entering from hidden)
      currentQuestionId = q.id;
      isCardVisible = true;
      if (card) {
        card.classList.remove('promoting-deck');
        card.querySelectorAll('.discarding-card').forEach(el => el.remove());
      }
      populateCardText(q);
      if (card) card.classList.add('active');
      // Play chime.wav on Comment Intro
      if (shouldPlaySfx) {
        sfx.playChime();
      }
    }

  } else if (msg.type === 'HIDE_QUESTION') {
    isCardVisible = false;
    currentQuestionId = null;
    if (card) {
      card.classList.remove('active', 'promoting-deck');
      card.querySelectorAll('.discarding-card').forEach(el => el.remove());
    }

  } else if (msg.type === 'CONFIG_UPDATED') {
    const cfg = msg.config;
    if (topBanner && cfg) {
      topBanner.updateConfig(cfg);
    }
    if (frameCtaBadgeEl && cfg.call_to_action) {
      frameCtaBadgeEl.innerHTML = `<span>${escapeHtml(cfg.call_to_action)}</span>`;
    }
    if (frameTickerTextEl && cfg.ticker_text) {
      setSeamlessTicker(cfg.ticker_text);
    }

    if (typeof cfg.show_frames === 'boolean') {
      const topWrap = document.querySelector('.top-header-wrap');
      if (topWrap) topWrap.style.display = cfg.show_frames ? 'block' : 'none';
      const bottomBar = document.querySelector('.bottom-bar-container');
      if (bottomBar) bottomBar.style.display = cfg.show_frames ? 'block' : 'none';
    }
  } else if (msg.type === 'TOP_BANNER_FOCUS' || msg.type === 'SPEAKER_FOCUS') {
    if (topBanner) {
      topBanner.jumpToSpeaker();
    }
  } else if (msg.type === 'TOP_BANNER_NEXT') {
    if (topBanner) {
      topBanner.next();
    }
  } else if (msg.type === 'LOWER_THIRD_UPDATE' || msg.type === 'SPEAKER_UPDATE') {
    const speakerData = msg.speaker || msg.lower_third;
    if (topBanner && speakerData) {
      const cfg = topBanner.cachedConfig || {};
      cfg.speaker = { ...(cfg.speaker || {}), ...speakerData };
      topBanner.updateConfig(cfg);
      topBanner.jumpToSpeaker();
    }
  }
}

// Initial fetch of config on page boot
fetch('/api/config')
  .then(res => res.json())
  .then(cfg => {
    if (topBanner && cfg) {
      topBanner.updateConfig(cfg);
    }
  })
  .catch(() => {});


function setSeamlessTicker(rawText) {
  if (!frameTickerTextEl) return;
  const cleaned = String(rawText || '').trim().replace(/[•·|]+\s*$/, '').trim();
  if (!cleaned) return;
  const unit = `${escapeHtml(cleaned)} &nbsp;&nbsp;•&nbsp;&nbsp; `;
  const repeatCount = Math.max(3, Math.ceil(180 / Math.max(cleaned.length, 12)));
  const halfHtml = unit.repeat(repeatCount);
  frameTickerTextEl.innerHTML = `<span class="ticker-half">${halfHtml}</span><span class="ticker-half" aria-hidden="true">${halfHtml}</span>`;
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize default ticker into a seamless loop immediately
if (frameTickerTextEl) {
  setSeamlessTicker(frameTickerTextEl.textContent);
}

connectWS();
