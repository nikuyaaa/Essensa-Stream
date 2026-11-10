// Screenshot -> pre-filled question form. Offline OCR (Tesseract.js), no AI, nothing is queued automatically.

const NOISE_LINE = /^(like|reply|share|edit|hide|report|translate|see translation|see more|view \d+ repl(y|ies)|top fan|author|follow|following|pinned|liked by author|most relevant|newest|write a (public )?comment.*)$/i;
const TIME_LINE = /^(\d+\s*(s|m|h|d|w|y|min|mins|hr|hrs|sec|secs|day|days|week|weeks)\b( ago)?|just now|yesterday)$/i;
const ACTION_ROW = /\b(like|reply|share)\b/i;

// Timestamps as OCR reads them: 1h, 2H, 45m, 3 hrs, lh / Ih (misread "1h"), 2 weeks ago, 11-5
const TIME_TOKEN = /^(?:(?:\d{1,2}|[lI1])\s?(?:h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks)|\d{1,3}\s?(?:s|m|min|mins|sec|secs|y|yr|yrs)|\d{1,2}[-/]\d{1,2}|just now|ago)$/i;
const ACTION_TOKEN = /^(?:like|reply|share|edited|translate)$/i;
const SEPARATOR_TOKEN = /^[·•.\-–—|]+$/;
// Tesseract cannot read emojis: it turns them into stray symbols such as & @ © ® « » ~ ^ *
const GARBAGE_TOKEN = /^[&@©®™°§¢£¥€¿¡«»~^*<>{}[\]\\=+_#%$|`]+$/;

function stripTail(tokens) {
  let i = tokens.length;
  let hasTime = false;
  let actions = 0;
  while (i > 0) {
    const t = tokens[i - 1];
    if (TIME_TOKEN.test(t)) hasTime = true;
    else if (ACTION_TOKEN.test(t)) actions++;
    else if (!SEPARATOR_TOKEN.test(t)) break;
    i--;
  }
  // Only cut when it really looks like a "2h Like Reply" row, never a sentence ending in "reply"
  return hasTime || actions >= 2 ? tokens.slice(0, i) : tokens;
}

function stripHead(tokens) {
  let i = 0;
  while (i < tokens.length && (TIME_TOKEN.test(tokens[i]) || SEPARATOR_TOKEN.test(tokens[i]))) i++;
  return i && i < tokens.length ? tokens.slice(i) : tokens;
}

function cleanLine(line) {
  let tokens = line.replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  // "2 hrs" -> "2hrs" so the timestamp is one token
  tokens = tokens.reduce((acc, t) => {
    if (acc.length && /^\d{1,3}$/.test(acc[acc.length - 1]) && TIME_TOKEN.test(acc[acc.length - 1] + t)) acc[acc.length - 1] += t;
    else acc.push(t);
    return acc;
  }, []);
  // Unreadable emoji -> drop stray symbols, but keep a real "Q & A" (short words on both sides)
  tokens = tokens.filter((t, i) => !GARBAGE_TOKEN.test(t) ||
    (t === '&' && i > 0 && i < tokens.length - 1 && tokens[i - 1].length <= 2 && tokens[i + 1].length <= 2));
  tokens = tokens.map((t) => (/^[A-Za-z0-9]/.test(t) ? t.replace(/[&@©®™~^*]+$/, '') : t)); // emoji glued to a word
  tokens = stripHead(stripTail(tokens));
  return tokens.join(' ').trim();
}

function isNoise(line) {
  if (!line) return true;
  if (NOISE_LINE.test(line) || TIME_LINE.test(line)) return true;
  // "Like Reply 2h" style action rows: every token is an action or a time
  const tokens = line.split(' ');
  return tokens.length <= 6 && tokens.every((t) => ACTION_ROW.test(t) || TIME_LINE.test(t) || /^[·•\d]+[smhdw]?$/i.test(t));
}

/** Pure parser: raw OCR text -> { name, platform, question }. platform is null when undetectable. */
function parseCommentText(raw) {
  const lines = (raw || '').split(/\r?\n/).map(cleanLine).filter((l) => l && !isNoise(l));
  if (!lines.length) return { name: '', platform: null, question: '' };

  const looksLikeName = (l) =>
    l.length <= 40 && !/[?!.]$/.test(l) && l.split(' ').length <= 5;

  let name = '';
  let body = lines;
  if (lines.length > 1 && looksLikeName(lines[0])) {
    name = lines[0].replace(/\s*[·•].*$/, '').trim();
    body = lines.slice(1);
  }

  let platform = null;
  if (/^@/.test(name) || /^[a-z0-9._]+$/.test(name) && /[._\d]/.test(name)) platform = 'tiktok';
  else if (/\s/.test(name)) platform = 'facebook';
  if (/tiktok/i.test(raw)) platform = 'tiktok';
  else if (/facebook/i.test(raw)) platform = 'facebook';

  return { name, platform, question: body.join(' ').trim() };
}

// --- OCR engine: lazy-loaded, torn down when idle to free memory ---
const OCR_IDLE_MS = 60000;
let ocrWorker = null;
let ocrIdleTimer = null;
let onOcrProgress = () => {};

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load local OCR engine'));
    document.head.appendChild(s);
  });
}

async function getOcrWorker() {
  clearTimeout(ocrIdleTimer);
  if (!ocrWorker) {
    await loadScriptOnce('/vendor/tesseract/tesseract.min.js');
    ocrWorker = await Tesseract.createWorker('eng', 1, {
      workerPath: '/vendor/tesseract/worker.min.js',
      corePath: '/vendor/tesseract-core',
      langPath: '/vendor/tesseract-lang',
      gzip: true,
      logger: (m) => {
        if (m.status === 'recognizing text') onOcrProgress(m.progress);
      },
    });
  }
  return ocrWorker;
}

function scheduleOcrTeardown() {
  clearTimeout(ocrIdleTimer);
  ocrIdleTimer = setTimeout(async () => {
    const w = ocrWorker;
    ocrWorker = null;
    if (w) await w.terminate();
  }, OCR_IDLE_MS);
}

/** Upscale small screenshots (OCR is much more accurate above ~1000px wide) and flatten dark mode to light. */
async function prepareImage(blob) {
  const bmp = await createImageBitmap(blob);
  const scale = bmp.width < 1000 ? Math.min(3, 1000 / bmp.width) : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);

  // Dark-mode comments (white text on dark): invert so Tesseract sees dark-on-light.
  const sample = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let sum = 0;
  for (let i = 0; i < sample.data.length; i += 16) sum += sample.data[i] + sample.data[i + 1] + sample.data[i + 2];
  const avg = sum / (sample.data.length / 16) / 3;
  if (avg < 110) {
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

// --- UI wiring ---
const pasteZoneEl = document.getElementById('paste-zone');
const pasteIdleEl = document.getElementById('paste-idle');
const pasteResultEl = document.getElementById('paste-result');
const pasteThumbEl = document.getElementById('paste-thumb');
const pasteStatusEl = document.getElementById('paste-status');
const ocrProgressEl = document.getElementById('ocr-progress');
const ocrBarEl = document.getElementById('ocr-progress-bar');
const nameInputEl = document.getElementById('input-name');
const platformInputEl = document.getElementById('input-platform');
const textInputEl = document.getElementById('input-text');
let thumbUrl = null;
let pasteJob = 0;

function setPasteStatus(msg, warn = false) {
  pasteStatusEl.textContent = msg;
  pasteStatusEl.classList.toggle('warn', warn);
}

function markPrefilled(...els) {
  els.forEach((el) => {
    el.classList.add('prefilled');
    el.addEventListener('input', () => el.classList.remove('prefilled'), { once: true });
  });
}

function resetPasteZone() {
  pasteJob++;
  if (thumbUrl) URL.revokeObjectURL(thumbUrl);
  thumbUrl = null;
  pasteResultEl.hidden = true;
  pasteIdleEl.hidden = false;
  pasteZoneEl.classList.remove('ready');
  ocrProgressEl.hidden = true;
  [nameInputEl, platformInputEl, textInputEl].forEach((el) => el.classList.remove('prefilled'));
}

async function handleScreenshot(blob) {
  const job = ++pasteJob;
  if (typeof switchTab === 'function') switchTab('tab-questions');
  addDrawerEl.classList.add('open');

  if (thumbUrl) URL.revokeObjectURL(thumbUrl);
  thumbUrl = URL.createObjectURL(blob);
  pasteThumbEl.src = thumbUrl;
  pasteIdleEl.hidden = true;
  pasteResultEl.hidden = false;
  pasteZoneEl.classList.add('ready');
  ocrProgressEl.hidden = false;
  ocrBarEl.style.width = '0%';
  setPasteStatus('Reading screenshot…');
  onOcrProgress = (p) => { ocrBarEl.style.width = `${Math.round(p * 100)}%`; };

  try {
    const worker = await getOcrWorker();
    if (job !== pasteJob) return;
    const canvas = await prepareImage(blob);
    const { data } = await worker.recognize(canvas);
    if (job !== pasteJob) return;

    const parsed = parseCommentText(data.text);
    ocrProgressEl.hidden = true;

    if (!parsed.question) {
      setPasteStatus('Could not read any text. Type the question manually.', true);
      textInputEl.focus();
      return;
    }

    nameInputEl.value = parsed.name;
    textInputEl.value = parsed.question;
    if (parsed.platform) platformInputEl.value = parsed.platform;
    markPrefilled(nameInputEl, textInputEl);

    const lowConf = data.confidence < 70 || !parsed.name;
    setPasteStatus(
      lowConf
        ? 'Pre-filled, but please double-check name and text (low confidence).'
        : 'Pre-filled. Review, then press Add to Queue. Emojis can’t be read, so add any back by hand.',
      lowConf
    );
    (parsed.name ? textInputEl : nameInputEl).focus();
  } catch (err) {
    console.error(err);
    ocrProgressEl.hidden = true;
    setPasteStatus('OCR failed. Type the question manually.', true);
  } finally {
    scheduleOcrTeardown();
  }
}

document.addEventListener('paste', (e) => {
  const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith('image/'));
  if (!item) return; // plain-text paste keeps default behaviour
  e.preventDefault();
  const blob = item.getAsFile();
  if (blob) handleScreenshot(blob);
});

document.getElementById('btn-clear-paste')?.addEventListener('click', resetPasteZone);
addForm.addEventListener('submit', () => setTimeout(resetPasteZone, 0));
