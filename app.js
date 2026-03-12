const KEY = 'copilotStudyPayload';

function showStatus(message, type = 'success') {
  const el = document.getElementById('statusMessage');
  if (!el) return;
  el.textContent = message;
  el.className = `status show ${type}`;
}

function render(payload) {
  document.getElementById('sourceTitle').textContent =
    payload?.source?.title || 'No payload saved';

  document.getElementById('sourceAuthors').textContent =
    (payload?.source?.authors || []).join(', ') || '—';

  document.getElementById('sourceYear').textContent =
    payload?.source?.year || '—';

  document.getElementById('sourceOrigin').textContent =
    payload?.source?.origin || '—';

  document.getElementById('sourceCitation').textContent =
    payload?.source?.citation || '—';

  document.getElementById('sourceSummary').textContent =
    payload?.summary?.plain || '—';

  document.getElementById('payloadInput').value =
    payload && Object.keys(payload).length
      ? JSON.stringify(payload, null, 2)
      : '';
}

function extractJsonObject(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;

      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function savePayloadFromInput() {
  try {
    const raw = document.getElementById('payloadInput').value.trim();

    if (!raw) {
      showStatus('Paste a Copilot response or JSON first.', 'error');
      return;
    }

    let jsonText = raw;

    try {
      JSON.parse(jsonText);
    } catch {
      const extracted = extractJsonObject(raw);
      if (!extracted) {
        throw new Error('No valid JSON object found.');
      }
      jsonText = extracted;
    }

    const payload = JSON.parse(jsonText);
    localStorage.setItem(KEY, JSON.stringify(payload));
    render(payload);
    showStatus('Payload saved in browser storage.', 'success');
  } catch (e) {
    console.error(e);
    showStatus('Could not parse a valid JSON payload.', 'error');
  }
}

function enablePasteModeFromUrl() {
  const params = new URLSearchParams(window.location.search);

  if (params.has('paste')) {
    const box = document.getElementById('payloadInput');

    if (box) {
      box.focus();
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      box.classList.add('paste-highlight');

      setTimeout(() => {
        box.classList.remove('paste-highlight');
      }, 5000);
    }

    showStatus(
      'Paste the full Copilot response here. The tool will try to extract the JSON automatically.',
      'success'
    );
  }
}

document.getElementById('saveBtn').addEventListener('click', savePayloadFromInput);

document.getElementById('clearBtn').addEventListener('click', () => {
  localStorage.removeItem(KEY);
  render({});
  showStatus('Saved payload cleared.', 'success');
});

document.getElementById('payloadInput').addEventListener('paste', () => {
  setTimeout(() => {
    const raw = document.getElementById('payloadInput').value.trim();
    if (!raw) return;
    savePayloadFromInput();
  }, 120);
});

try {
  const stored = localStorage.getItem(KEY);
  render(stored ? JSON.parse(stored) : {});
} catch (e) {
  console.error(e);
  render({});
}

enablePasteModeFromUrl();
