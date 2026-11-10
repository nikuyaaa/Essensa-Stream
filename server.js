const http = require('http');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws-v2' });

app.use(express.json());

// Disable browser/OBS caching so updates to JS/CSS take effect immediately
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Serve static assets
app.use('/static', express.static(path.join(__dirname, 'static'), { etag: false, lastModified: false }));

// Local OCR assets (Tesseract.js runs fully offline in the browser)
const nm = (...p) => path.join(__dirname, 'node_modules', ...p);
app.use('/vendor/tesseract', express.static(nm('tesseract.js', 'dist')));
app.use('/vendor/tesseract-core', express.static(nm('tesseract.js-core')));
app.use('/vendor/tesseract-lang', express.static(nm('@tesseract.js-data', 'eng', '4.0.0_best_int')));

// Database File (JSON-based persistence)
const DATA_FILE = path.join(__dirname, 'questions.json');
const CONFIG_FILE = path.join(__dirname, 'broadcast_config.json');

function loadQuestions() {
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData = [
      {
        id: "q-1",
        submitter_name: "Maria Santos",
        platform: "facebook",
        question_text: "Doc, totoo po ba na nakakagaling ng ubo ang pag-inom ng maligamgam na tubig na may kalamansi at honey?",
        category: "General Health",
        is_answered: false,
        created_at: new Date().toISOString()
      },
      {
        id: "q-2",
        submitter_name: "@nurse_anne_tiktok",
        platform: "tiktok",
        question_text: "Ano po ang mabisang first-aid kapag biglang tumaas ang blood pressure habang nasa bahay?",
        category: "Hypertension",
        is_answered: false,
        created_at: new Date().toISOString()
      },
      {
        id: "q-3",
        submitter_name: "Ramon Bautista",
        platform: "facebook",
        question_text: "Doc, safe po bang uminom ng maintenance medicine sa high blood kahit normal na ang reading ko?",
        category: "Maintenance",
        is_answered: true,
        created_at: new Date().toISOString()
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed reading data file:', err);
    return [];
  }
}

function saveQuestions(questions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(questions, null, 2));
}

function loadConfig() {
  const defaultConfig = {
    episode_title: "Itanong Mo Kay Doc!",
    episode_subtitle: "Holistic Health & Natural Wellness",
    ticker_text: "I-comment ang iyong tanong! • Like & Share our Livestream • Follow us on FB & TikTok @itanongmokaydoc • Disclaimer: For health education only, not a replacement for clinical consultation.",
    call_to_action: "Follow @itanongmokaydoc",
    socials: "FB & TikTok: @itanongmokaydoc",
    show_frames: true,
    speaker: {
      name: "Dr. Juan Dela Cruz, MD",
      title: "Naturopath Doctor",
      credentials: "Internal Medicine Specialist"
    },
    lower_third: {
      active: true,
      name: "Dr. Juan Dela Cruz, MD",
      title: "Naturopath Doctor",
      credentials: "Internal Medicine Specialist"
    },
    top_cycle_duration: 7000,
    top_cycle_items: []
  };

  let cfg = defaultConfig;
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      cfg = { ...defaultConfig, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
    } catch (err) {
      cfg = defaultConfig;
    }
  } else {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  }

  if (!cfg.speaker && cfg.lower_third) {
    cfg.speaker = { ...cfg.lower_third };
  } else if (cfg.speaker && !cfg.lower_third) {
    cfg.lower_third = { ...cfg.speaker, active: true };
  }
  return cfg;
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

let broadcastConfig = loadConfig();
let currentActiveQuestion = null;

function broadcast(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// REST API Endpoints
app.get('/api/questions', (req, res) => {
  const questions = loadQuestions();
  res.json({ questions, active: currentActiveQuestion, config: broadcastConfig });
});

app.post('/api/questions', (req, res) => {
  const { submitter_name, platform, question_text, category } = req.body;
  if (!question_text || !submitter_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const questions = loadQuestions();
  const newQ = {
    id: 'q-' + Date.now(),
    submitter_name: String(submitter_name).trim(),
    platform: (platform || 'facebook').toLowerCase(),
    question_text: String(question_text).trim(),
    category: String(category || '').trim(),
    is_answered: false,
    created_at: new Date().toISOString()
  };

  questions.unshift(newQ);
  saveQuestions(questions);

  broadcast({ type: 'QUESTIONS_UPDATED', questions });
  res.status(201).json(newQ);
});

app.post('/api/questions/:id/toggle-answered', (req, res) => {
  const { id } = req.params;
  const questions = loadQuestions();
  const q = questions.find(item => item.id === id);
  if (!q) return res.status(404).json({ error: 'Not found' });

  q.is_answered = !q.is_answered;
  saveQuestions(questions);

  broadcast({ type: 'QUESTIONS_UPDATED', questions });
  res.json(q);
});

app.delete('/api/questions/:id', (req, res) => {
  const { id } = req.params;
  let questions = loadQuestions();
  questions = questions.filter(item => item.id !== id);
  saveQuestions(questions);

  if (currentActiveQuestion && currentActiveQuestion.id === id) {
    currentActiveQuestion = null;
    broadcast({ type: 'HIDE_QUESTION' });
  }

  broadcast({ type: 'QUESTIONS_UPDATED', questions });
  res.json({ success: true });
});

app.delete('/api/questions-answered', (req, res) => {
  let questions = loadQuestions();
  questions = questions.filter(item => !item.is_answered);
  saveQuestions(questions);
  broadcast({ type: 'QUESTIONS_UPDATED', questions });
  res.json({ success: true, count: questions.length });
});

// Broadcast Triggers & Stream Deck / Hotkey Endpoints
function setStreamActive(q) {
  currentActiveQuestion = q;
  if (q) {
    const openClients = Array.from(wss.clients).filter(c => c.readyState === WebSocket.OPEN);
    const overlays = openClients.filter(c => c.role === 'landscape' || c.role === 'portrait' || c.role === 'overlay');
    const audioTarget = overlays.find(c => c.role === 'landscape') || overlays[0] || null;

    openClients.forEach((client) => {
      client.send(JSON.stringify({
        type: 'SHOW_QUESTION',
        data: q,
        play_sfx: client === audioTarget
      }));
    });
  } else {
    broadcast({ type: 'HIDE_QUESTION' });
  }
}

// Show Question (GET / POST)
const handleShow = (req, res) => {
  const id = req.body?.id || req.query?.id;
  const questions = loadQuestions();

  let target = null;
  if (id) {
    target = questions.find(item => item.id === id);
    if (!target) return res.status(404).json({ error: 'Question not found' });
  } else {
    // Default to first unanswered, or first item
    target = questions.find(q => !q.is_answered) || questions[0];
    if (!target) return res.status(404).json({ error: 'No questions available' });
  }

  setStreamActive(target);
  res.json({ success: true, active: target });
};
app.get('/api/stream/show', handleShow);
app.post('/api/stream/show', handleShow);

// Hide Question (GET / POST)
const handleHide = (req, res) => {
  setStreamActive(null);
  res.json({ success: true, message: 'Overlay cleared' });
};
app.get('/api/stream/hide', handleHide);
app.post('/api/stream/hide', handleHide);

// Toggle Question On-Air (GET / POST)
const handleToggle = (req, res) => {
  if (currentActiveQuestion) {
    setStreamActive(null);
    return res.json({ success: true, active: null, onAir: false });
  }
  const questions = loadQuestions();
  const target = questions.find(q => !q.is_answered) || questions[0];
  if (!target) return res.status(404).json({ error: 'No questions available' });
  setStreamActive(target);
  res.json({ success: true, active: target, onAir: true });
};
app.get('/api/stream/toggle', handleToggle);
app.post('/api/stream/toggle', handleToggle);

// Advance to Next Question (GET / POST)
const handleNext = (req, res) => {
  const questions = loadQuestions();
  if (!questions.length) return res.status(404).json({ error: 'No questions in queue' });

  let nextQ = null;
  if (!currentActiveQuestion) {
    // Pick first unanswered, or first item
    nextQ = questions.find(q => !q.is_answered) || questions[0];
  } else {
    const currentIndex = questions.findIndex(q => q.id === currentActiveQuestion.id);
    if (currentIndex >= 0 && currentIndex < questions.length - 1) {
      // Find next question after current
      nextQ = questions.slice(currentIndex + 1).find(q => !q.is_answered) || questions[currentIndex + 1];
    } else {
      // Loop or pick first unanswered
      nextQ = questions.find(q => !q.is_answered) || questions[0];
    }
  }

  setStreamActive(nextQ);
  res.json({ success: true, active: nextQ });
};
app.get('/api/stream/next', handleNext);
app.post('/api/stream/next', handleNext);

// Previous Question (GET / POST)
const handlePrev = (req, res) => {
  const questions = loadQuestions();
  if (!questions.length) return res.status(404).json({ error: 'No questions in queue' });

  let prevQ = null;
  if (!currentActiveQuestion) {
    prevQ = questions[questions.length - 1];
  } else {
    const currentIndex = questions.findIndex(q => q.id === currentActiveQuestion.id);
    if (currentIndex > 0) {
      prevQ = questions[currentIndex - 1];
    } else {
      prevQ = questions[questions.length - 1];
    }
  }

  setStreamActive(prevQ);
  res.json({ success: true, active: prevQ });
};
app.get('/api/stream/prev', handlePrev);
app.post('/api/stream/prev', handlePrev);

// Mark Current Answered (GET / POST)
const handleDone = (req, res) => {
  if (!currentActiveQuestion) {
    return res.status(400).json({ error: 'No active question currently on stream' });
  }
  const questions = loadQuestions();
  const q = questions.find(item => item.id === currentActiveQuestion.id);
  if (q) {
    q.is_answered = true;
    currentActiveQuestion.is_answered = true;
    saveQuestions(questions);
    broadcast({ type: 'QUESTIONS_UPDATED', questions });
  }
  res.json({ success: true, answered: q });
};
app.get('/api/stream/done', handleDone);
app.post('/api/stream/done', handleDone);

// Mark Done AND Advance to Next (GET / POST)
const handleDoneNext = (req, res) => {
  const questions = loadQuestions();
  if (currentActiveQuestion) {
    const q = questions.find(item => item.id === currentActiveQuestion.id);
    if (q) {
      q.is_answered = true;
      saveQuestions(questions);
      broadcast({ type: 'QUESTIONS_UPDATED', questions });
    }
  }

  // Find next unanswered
  const remaining = questions.find(q => !q.is_answered);
  if (remaining) {
    setStreamActive(remaining);
    return res.json({ success: true, active: remaining });
  } else {
    setStreamActive(null);
    return res.json({ success: true, active: null, message: 'All questions answered!' });
  }
};
app.get('/api/stream/done-next', handleDoneNext);
app.post('/api/stream/done-next', handleDoneNext);

// Stream & Queue Status (GET)
app.get('/api/stream/status', (req, res) => {
  const questions = loadQuestions();
  const answered = questions.filter(q => q.is_answered).length;
  const unanswered = questions.length - answered;
  res.json({
    onAir: !!currentActiveQuestion,
    active: currentActiveQuestion,
    total: questions.length,
    answered,
    unanswered
  });
});

// Config Endpoints
app.get('/api/config', (req, res) => {
  res.json(broadcastConfig);
});

app.post('/api/config', (req, res) => {
  broadcastConfig = { ...broadcastConfig, ...req.body };
  if (req.body.speaker) {
    broadcastConfig.lower_third = { ...(broadcastConfig.lower_third || {}), ...req.body.speaker };
  } else if (req.body.lower_third) {
    broadcastConfig.speaker = { ...(broadcastConfig.speaker || {}), ...req.body.lower_third };
  }
  saveConfig(broadcastConfig);
  broadcast({ type: 'CONFIG_UPDATED', config: broadcastConfig });
  res.json({ success: true, config: broadcastConfig });
});

// Top Banner & Speaker Live Controls
const handleSpeakerFocus = (req, res) => {
  const data = req.body || req.query || {};
  if (!broadcastConfig.speaker) broadcastConfig.speaker = {};
  if (data.name) broadcastConfig.speaker.name = String(data.name).trim();
  if (data.title) broadcastConfig.speaker.title = String(data.title).trim();
  if (data.credentials) broadcastConfig.speaker.credentials = String(data.credentials).trim();
  broadcastConfig.lower_third = { ...(broadcastConfig.lower_third || {}), ...broadcastConfig.speaker, active: true };
  saveConfig(broadcastConfig);
  broadcast({ type: 'CONFIG_UPDATED', config: broadcastConfig });
  broadcast({ type: 'TOP_BANNER_FOCUS', target: 'speaker' });
  broadcast({ type: 'SPEAKER_UPDATE', speaker: broadcastConfig.speaker });
  res.json({ success: true, speaker: broadcastConfig.speaker });
};
app.get('/api/stream/speaker/focus', handleSpeakerFocus);
app.post('/api/stream/speaker/focus', handleSpeakerFocus);
app.get('/api/stream/top-banner/focus-speaker', handleSpeakerFocus);
app.post('/api/stream/top-banner/focus-speaker', handleSpeakerFocus);

const handleTopBannerNext = (req, res) => {
  broadcast({ type: 'TOP_BANNER_NEXT' });
  res.json({ success: true, action: 'next' });
};
app.get('/api/stream/top-banner/next', handleTopBannerNext);
app.post('/api/stream/top-banner/next', handleTopBannerNext);

// Lower Third Live Toggle & Update Endpoints (kept for backward compatibility & Stream Deck)
const handleLowerThirdShow = (req, res) => {
  const ltData = req.body || req.query || {};
  if (!broadcastConfig.lower_third) broadcastConfig.lower_third = {};
  broadcastConfig.lower_third.active = true;
  if (ltData.name) broadcastConfig.lower_third.name = String(ltData.name).trim();
  if (ltData.title) broadcastConfig.lower_third.title = String(ltData.title).trim();
  if (ltData.credentials) broadcastConfig.lower_third.credentials = String(ltData.credentials).trim();
  if (ltData.position) broadcastConfig.lower_third.position = String(ltData.position).trim();
  broadcastConfig.speaker = { ...(broadcastConfig.speaker || {}), ...broadcastConfig.lower_third };
  saveConfig(broadcastConfig);
  broadcast({ type: 'CONFIG_UPDATED', config: broadcastConfig });
  broadcast({ type: 'TOP_BANNER_FOCUS', target: 'speaker' });
  broadcast({ type: 'SPEAKER_UPDATE', speaker: broadcastConfig.speaker });
  res.json({ success: true, lower_third: broadcastConfig.lower_third, speaker: broadcastConfig.speaker });
};
app.get('/api/stream/lower-third/show', handleLowerThirdShow);
app.post('/api/stream/lower-third/show', handleLowerThirdShow);

const handleLowerThirdHide = (req, res) => {
  if (!broadcastConfig.lower_third) broadcastConfig.lower_third = {};
  broadcastConfig.lower_third.active = false;
  saveConfig(broadcastConfig);
  broadcast({ type: 'TOP_BANNER_NEXT' });
  res.json({ success: true, lower_third: broadcastConfig.lower_third });
};
app.get('/api/stream/lower-third/hide', handleLowerThirdHide);
app.post('/api/stream/lower-third/hide', handleLowerThirdHide);

const handleLowerThirdToggle = (req, res) => {
  if (!broadcastConfig.lower_third) broadcastConfig.lower_third = {};
  broadcastConfig.lower_third.active = !broadcastConfig.lower_third.active;
  saveConfig(broadcastConfig);
  broadcast({ type: 'TOP_BANNER_NEXT' });
  res.json({ success: true, lower_third: broadcastConfig.lower_third });
};
app.get('/api/stream/lower-third/toggle', handleLowerThirdToggle);
app.post('/api/stream/lower-third/toggle', handleLowerThirdToggle);

// System network information for Stream Deck Mobile / local devices
app.get('/api/system-info', (req, res) => {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ interface: name, address: net.address });
      }
    }
  }
  const port = process.env.PORT || 3000;
  res.json({ ips, port });
});

// Serve HTML Pages
app.get('/overlay/landscape', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'landscape.html'));
});

app.get('/overlay/portrait', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'portrait.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'admin.html'));
});

app.get('/streamdeck', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'streamdeck.html'));
});

app.get('/stream-deck', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'streamdeck.html'));
});

app.get('/', (req, res) => {
  res.redirect('/admin');
});

// WebSocket Handling
wss.on('connection', (ws, req) => {
  try {
    const parsedUrl = new URL(req.url, 'http://localhost');
    ws.role = parsedUrl.searchParams.get('role') || 'overlay';
  } catch (e) {
    ws.role = 'overlay';
  }

  // Send current state without triggering intro SFX on page load
  ws.send(JSON.stringify({ type: 'CONFIG_UPDATED', config: broadcastConfig }));
  if (currentActiveQuestion) {
    ws.send(JSON.stringify({ type: 'SHOW_QUESTION', data: currentActiveQuestion, play_sfx: false }));
  } else {
    ws.send(JSON.stringify({ type: 'HIDE_QUESTION' }));
  }

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch (e) {}
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` ITANONG MO KAY DOC! Stream Overlay System`);
  console.log(`-------------------------------------------------------`);
  console.log(` Operator Panel:      http://localhost:${PORT}/admin`);
  console.log(` OBS Landscape (16:9): http://localhost:${PORT}/overlay/landscape`);
  console.log(` OBS Portrait (9:16):  http://localhost:${PORT}/overlay/portrait`);
  console.log(`=======================================================`);
});
