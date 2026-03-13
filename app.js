document.addEventListener('DOMContentLoaded', () => {
  const KEY = 'copilotStudyPayload';

  const payloadInput = document.getElementById('payloadInput');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const pasteClipboardBtn = document.getElementById('pasteClipboardBtn');
  const statusMessage = document.getElementById('statusMessage');
  const pasteHelpPanel = document.getElementById('pasteHelpPanel');

  const sourceTitle = document.getElementById('sourceTitle');
  const sourceAuthors = document.getElementById('sourceAuthors');
  const sourceYear = document.getElementById('sourceYear');
  const sourceOrigin = document.getElementById('sourceOrigin');
  const sourceCitation = document.getElementById('sourceCitation');
  const sourceSummary = document.getElementById('sourceSummary');

  function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.className = `status show ${type}`;
  }

  function render(payload) {
    const source = payload?.source || {};

    sourceTitle.textContent = source.title || 'No payload saved';
    sourceAuthors.textContent =
      Array.isArray(source.authors) && source.authors.length
        ? source.authors.join(', ')
        : '—';
    sourceYear.textContent = source.year || '—';
    sourceOrigin.textContent = source.origin || '—';
    sourceCitation.textContent = source.citation || '—';
    sourceSummary.textContent = payload?.summary?.plain || '—';
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

  function cleanPotentialJson(text) {
    let cleaned = text.trim();

    cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    cleaned = cleaned.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
    cleaned = cleaned.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

    return cleaned;
  }

  function normalisePayload(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload is not an object.');
    }

    if (payload.type === 'quiz' && payload.quiz) {
      return {
        version: '1.0',
        source: {
          origin: payload.source?.origin || 'copilot',
          title: payload.source?.title || '',
          authors: Array.isArray(payload.source?.authors) ? payload.source.authors : [],
          citation: payload.source?.citation || '',
          year: payload.source?.year || '',
          source_files: Array.isArray(payload.source?.source_files) ? payload.source.source_files : []
        },
        summary: {
          plain: payload.summary?.plain || '',
          key_points: Array.isArray(payload.summary?.key_points) ? payload.summary.key_points : []
        },
        quiz: {
          title: payload.quiz?.title || '',
          description: payload.quiz?.description || '',
          questions: Array.isArray(payload.quiz?.questions) ? payload.quiz.questions : []
        },
        mind_map: {
          title: '',
          layout: 'radial',
          nodes: []
        }
      };
    }

    if (payload.type === 'mind_map' && payload.mind_map) {
      return {
        version: '1.0',
        source: {
          origin: payload.source?.origin || 'copilot',
          title: payload.source?.title || '',
          authors: Array.isArray(payload.source?.authors) ? payload.source.authors : [],
          citation: payload.source?.citation || '',
          year: payload.source?.year || '',
          source_files: Array.isArray(payload.source?.source_files) ? payload.source.source_files : []
        },
        summary: {
          plain: payload.summary?.plain || '',
          key_points: Array.isArray(payload.summary?.key_points) ? payload.summary.key_points : []
        },
        quiz: {
          title: '',
          description: '',
          questions: []
        },
        mind_map: {
          title: payload.mind_map?.title || payload.source?.title || 'Mind map',
          layout: payload.mind_map?.layout || 'radial',
          nodes: Array.isArray(payload.mind_map?.nodes) ? payload.mind_map.nodes : []
        }
      };
    }

    if (payload.source || payload.quiz || payload.mind_map) {
      return {
        version: payload.version || '1.0',
        source: {
          origin: payload.source?.origin || 'copilot',
          title: payload.source?.title || '',
          authors: Array.isArray(payload.source?.authors) ? payload.source.authors : [],
          citation: payload.source?.citation || '',
          year: payload.source?.year || '',
          source_files: Array.isArray(payload.source?.source_files) ? payload.source.source_files : []
        },
        summary: {
          plain: payload.summary?.plain || '',
          key_points: Array.isArray(payload.summary?.key_points) ? payload.summary.key_points : []
        },
        quiz: {
          title: payload.quiz?.title || '',
          description: payload.quiz?.description || '',
          questions: Array.isArray(payload.quiz?.questions) ? payload.quiz.questions : []
        },
        mind_map: {
          title: payload.mind_map?.title || payload.source?.title || 'Mind map',
          layout: payload.mind_map?.layout || 'radial',
          nodes: Array.isArray(payload.mind_map?.nodes) ? payload.mind_map.nodes : []
        }
      };
    }

    throw new Error('JSON did not match quiz, mind_map, or combined format.');
  }

  function savePayloadFromInput() {
    try {
      const raw = payloadInput.value.trim();

      if (!raw) {
        showStatus('Paste a Copilot response or JSON first.', 'error');
        return;
      }

      let jsonText = cleanPotentialJson(raw);

      try {
        JSON.parse(jsonText);
      } catch {
        const extracted = extractJsonObject(raw);
        if (!extracted) {
          throw new Error('No valid JSON object found in pasted text.');
        }
        jsonText = cleanPotentialJson(extracted);
      }

      const parsed = JSON.parse(jsonText);
      const payload = normalisePayload(parsed);

      localStorage.setItem(KEY, JSON.stringify(payload));
      render(payload);

      const hasQuiz = Array.isArray(payload.quiz?.questions) && payload.quiz.questions.length > 0;
      const hasMap = Array.isArray(payload.mind_map?.nodes) && payload.mind_map.nodes.length > 0;

      if (hasQuiz && hasMap) {
        showStatus('Saved quiz and mind map payload.', 'success');
      } else if (hasQuiz) {
        showStatus('Saved quiz payload.', 'success');
      } else if (hasMap) {
        showStatus('Saved mind map payload.', 'success');
      } else {
        showStatus('Saved payload, but no quiz questions or mind map nodes were found.', 'error');
      }
    } catch (error) {
      console.error(error);
      showStatus(`Could not parse a valid JSON payload. ${error.message}`, 'error');
    }
  }

  async function pasteFromClipboard() {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error('Clipboard access is not available in this browser.');
      }

      const text = await navigator.clipboard.readText();

      if (!text || !text.trim()) {
        showStatus('Clipboard is empty.', 'error');
        return;
      }

      payloadInput.value = text;
      savePayloadFromInput();
    } catch (error) {
      console.error(error);
      showStatus('Could not read from clipboard. You may need to paste manually.', 'error');
    }
  }

  function enablePasteModeFromUrl() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('paste')) {
      pasteHelpPanel.style.display = 'block';
      payloadInput.focus();
      payloadInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      payloadInput.classList.add('paste-highlight');

      setTimeout(() => {
        payloadInput.classList.remove('paste-highlight');
      }, 5000);

      showStatus(
        'Paste the full Copilot response here, or use Paste from Clipboard.',
        'success'
      );
    }
  }

  saveBtn.addEventListener('click', savePayloadFromInput);

  clearBtn.addEventListener('click', () => {
    localStorage.removeItem(KEY);
    payloadInput.value = '';
    render({});
    showStatus('Saved payload cleared.', 'success');
  });

  pasteClipboardBtn.addEventListener('click', pasteFromClipboard);

  payloadInput.addEventListener('paste', () => {
    setTimeout(() => {
      if (payloadInput.value.trim()) {
        savePayloadFromInput();
      }
    }, 150);
  });

  try {
    const stored = localStorage.getItem(KEY);
    render(stored ? JSON.parse(stored) : {});
  } catch (error) {
    console.error(error);
    render({});
  }

  enablePasteModeFromUrl();
});  return null;
}

function cleanPotentialJson(text) {
  let cleaned = text.trim();

  // remove code fences
  cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

  // repair doubled braces
  cleaned = cleaned.replace(/\{\{/g, '{').replace(/\}\}/g, '}');

  // normalise smart quotes
  cleaned = cleaned.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  return cleaned;
}

function normalisePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload is not an object.');
  }

  // Quiz-only
  if (payload.type === 'quiz' && payload.quiz) {
    return {
      version: '1.0',
      source: {
        origin: payload.source?.origin || 'copilot',
        title: payload.source?.title || '',
        authors: Array.isArray(payload.source?.authors) ? payload.source.authors : [],
        citation: payload.source?.citation || '',
        year: payload.source?.year || '',
        source_files: Array.isArray(payload.source?.source_files) ? payload.source.source_files : []
      },
      summary: {
        plain: payload.summary?.plain || '',
        key_points: Array.isArray(payload.summary?.key_points) ? payload.summary.key_points : []
      },
      quiz: {
        title: payload.quiz?.title || (payload.source?.title ? `${payload.source.title} quiz` : 'Quiz'),
        description: payload.quiz?.description || '',
        questions: Array.isArray(payload.quiz?.questions) ? payload.quiz.questions : []
      },
      mind_map: {
        title: '',
        layout: 'radial',
        nodes: []
      }
    };
  }

  // Mind-map-only
  if (payload.type === 'mind_map' && payload.mind_map) {
    return {
      version: '1.0',
      source: {
        origin: payload.source?.origin || 'copilot',
        title: payload.source?.title || '',
        authors: Array.isArray(payload.source?.authors) ? payload.source.authors : [],
        citation: payload.source?.citation || '',
        year: payload.source?.year || '',
        source_files: Array.isArray(payload.source?.source_files) ? payload.source.source_files : []
      },
      summary: {
        plain: payload.summary?.plain || '',
        key_points: Array.isArray(payload.summary?.key_points) ? payload.summary.key_points : []
      },
      quiz: {
        title: '',
        description: '',
        questions: []
      },
      mind_map: {
        title: payload.mind_map?.title || payload.source?.title || 'Mind map',
        layout: payload.mind_map?.layout || 'radial',
        nodes: Array.isArray(payload.mind_map?.nodes) ? payload.mind_map.nodes : []
      }
    };
  }

  // Combined
  if (payload.source || payload.quiz || payload.mind_map) {
    return {
      version: payload.version || '1.0',
      source: {
        origin: payload.source?.origin || 'copilot',
        title: payload.source?.title || '',
        authors: Array.isArray(payload.source?.authors) ? payload.source.authors : [],
        citation: payload.source?.citation || '',
        year: payload.source?.year || '',
        source_files: Array.isArray(payload.source?.source_files) ? payload.source.source_files : []
      },
      summary: {
        plain: payload.summary?.plain || '',
        key_points: Array.isArray(payload.summary?.key_points) ? payload.summary.key_points : []
      },
      quiz: {
        title: payload.quiz?.title || '',
        description: payload.quiz?.description || '',
        questions: Array.isArray(payload.quiz?.questions) ? payload.quiz.questions : []
      },
      mind_map: {
        title: payload.mind_map?.title || payload.source?.title || 'Mind map',
        layout: payload.mind_map?.layout || 'radial',
        nodes: Array.isArray(payload.mind_map?.nodes) ? payload.mind_map.nodes : []
      }
    };
  }

  throw new Error('JSON did not match quiz, mind_map, or combined study format.');
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
      jsonText = cleanPotentialJson(jsonText);
      JSON.parse(jsonText);
    } catch {
      const extracted = extractJsonObject(raw);
      if (!extracted) {
        throw new Error('No valid JSON object found in pasted text.');
      }
      jsonText = cleanPotentialJson(extracted);
    }

    const parsed = JSON.parse(jsonText);
    const payload = normalisePayload(parsed);

    localStorage.setItem(KEY, JSON.stringify(payload));
    render(payload);

    const hasQuiz = Array.isArray(payload.quiz?.questions) && payload.quiz.questions.length > 0;
    const hasMap = Array.isArray(payload.mind_map?.nodes) && payload.mind_map.nodes.length > 0;

    if (hasQuiz && hasMap) {
      showStatus('Saved quiz and mind map payload.', 'success');
    } else if (hasQuiz) {
      showStatus('Saved quiz payload.', 'success');
    } else if (hasMap) {
      showStatus('Saved mind map payload.', 'success');
    } else {
      showStatus('Saved payload, but no quiz questions or mind map nodes were found.', 'error');
    }
  } catch (e) {
    console.error(e);
    showStatus(`Could not parse a valid JSON payload. ${e.message}`, 'error');
  }
}

function enablePasteModeFromUrl() {
  const params = new URLSearchParams(window.location.search);

  if (params.has('paste')) {
    const box = document.getElementById('payloadInput');
    const status = document.getElementById('statusMessage');
    const helpPanel = document.getElementById('pasteHelpPanel');

    if (helpPanel) {
      helpPanel.style.display = 'block';
    }

    if (box) {
      box.focus();
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      box.classList.add('paste-highlight');

      setTimeout(() => {
        box.classList.remove('paste-highlight');
      }, 5000);
    }

    if (status) {
      status.textContent =
        'Paste the full Copilot response here. Quiz-only, mind-map-only, and combined payloads are supported.';
      status.className = 'status show success';
    }
  }
}

document.getElementById('saveBtn')?.addEventListener('click', savePayloadFromInput);

document.getElementById('clearBtn')?.addEventListener('click', () => {
  localStorage.removeItem(KEY);
  render({});
  showStatus('Saved payload cleared.', 'success');
});

document.getElementById('payloadInput')?.addEventListener('paste', () => {
  setTimeout(() => {
    const raw = document.getElementById('payloadInput').value.trim();
    if (!raw) return;
    savePayloadFromInput();
  }, 150);
});

try {
  const stored = localStorage.getItem(KEY);
  render(stored ? JSON.parse(stored) : {});
} catch (e) {
  console.error(e);
  render({});
}

enablePasteModeFromUrl();
