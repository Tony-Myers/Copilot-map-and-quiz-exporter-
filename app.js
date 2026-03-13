document.addEventListener("DOMContentLoaded", function () {
  var KEY = "copilotStudyPayload";

  var payloadInput = document.getElementById("payloadInput");
  var saveBtn = document.getElementById("saveBtn");
  var clearBtn = document.getElementById("clearBtn");
  var pasteClipboardBtn = document.getElementById("pasteClipboardBtn");
  var statusMessage = document.getElementById("statusMessage");
  var pasteHelpPanel = document.getElementById("pasteHelpPanel");

  var sourceTitle = document.getElementById("sourceTitle");
  var sourceAuthors = document.getElementById("sourceAuthors");
  var sourceYear = document.getElementById("sourceYear");
  var sourceOrigin = document.getElementById("sourceOrigin");
  var sourceCitation = document.getElementById("sourceCitation");
  var sourceSummary = document.getElementById("sourceSummary");

  function showStatus(message, type) {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = "status show " + (type || "success");
  }

  function render(payload) {
    payload = payload || {};
    var source = payload.source || {};

    if (sourceTitle) sourceTitle.textContent = source.title || "No study material loaded";
    if (sourceAuthors) {
      sourceAuthors.textContent =
        Array.isArray(source.authors) && source.authors.length
          ? source.authors.join(", ")
          : "—";
    }
    if (sourceYear) sourceYear.textContent = source.year || "—";
    if (sourceOrigin) sourceOrigin.textContent = source.origin || "—";
    if (sourceCitation) sourceCitation.textContent = source.citation || "—";
    if (sourceSummary) sourceSummary.textContent = (payload.summary && payload.summary.plain) || "—";
  }

  function cleanText(text) {
    var cleaned = (text || "").trim();

    cleaned = cleaned.replace(/^```(?:json)?/i, "");
    cleaned = cleaned.replace(/```$/i, "");
    cleaned = cleaned.trim();

    cleaned = cleaned.replace(/\{\{/g, "{").replace(/\}\}/g, "}");
    cleaned = cleaned.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

    return cleaned;
  }

  function extractJsonObject(text) {
    var start = text.indexOf("{");
    if (start === -1) return null;

    var depth = 0;
    var inString = false;
    var escaped = false;

    for (var i = start; i < text.length; i++) {
      var ch = text[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === "\\") {
        escaped = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (ch === "{") depth++;
        if (ch === "}") depth--;

        if (depth === 0) {
          return text.slice(start, i + 1);
        }
      }
    }

    return null;
  }

  function normalisePayload(payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("Payload is not a JSON object.");
    }

    // Quiz-only
    if (payload.type === "quiz" && payload.quiz) {
      return {
        version: "1.0",
        source: {
          origin: (payload.source && payload.source.origin) || "copilot",
          title: (payload.source && payload.source.title) || "",
          authors: (payload.source && Array.isArray(payload.source.authors)) ? payload.source.authors : [],
          citation: (payload.source && payload.source.citation) || "",
          year: (payload.source && payload.source.year) || "",
          source_files: (payload.source && Array.isArray(payload.source.source_files)) ? payload.source.source_files : []
        },
        summary: {
          plain: (payload.summary && payload.summary.plain) || "",
          key_points: (payload.summary && Array.isArray(payload.summary.key_points)) ? payload.summary.key_points : []
        },
        quiz: {
          title: (payload.quiz && payload.quiz.title) || "",
          description: (payload.quiz && payload.quiz.description) || "",
          questions: (payload.quiz && Array.isArray(payload.quiz.questions)) ? payload.quiz.questions : []
        },
        mind_map: {
          title: "",
          layout: "radial",
          nodes: []
        }
      };
    }

    // Mind-map-only
    if (payload.type === "mind_map" && payload.mind_map) {
      return {
        version: "1.0",
        source: {
          origin: (payload.source && payload.source.origin) || "copilot",
          title: (payload.source && payload.source.title) || "",
          authors: (payload.source && Array.isArray(payload.source.authors)) ? payload.source.authors : [],
          citation: (payload.source && payload.source.citation) || "",
          year: (payload.source && payload.source.year) || "",
          source_files: (payload.source && Array.isArray(payload.source.source_files)) ? payload.source.source_files : []
        },
        summary: {
          plain: (payload.summary && payload.summary.plain) || "",
          key_points: (payload.summary && Array.isArray(payload.summary.key_points)) ? payload.summary.key_points : []
        },
        quiz: {
          title: "",
          description: "",
          questions: []
        },
        mind_map: {
          title: (payload.mind_map && payload.mind_map.title) || ((payload.source && payload.source.title) || "Mind map"),
          layout: (payload.mind_map && payload.mind_map.layout) || "radial",
          nodes: (payload.mind_map && Array.isArray(payload.mind_map.nodes)) ? payload.mind_map.nodes : []
        }
      };
    }

    // Combined
    if (payload.source || payload.quiz || payload.mind_map) {
      return {
        version: payload.version || "1.0",
        source: {
          origin: (payload.source && payload.source.origin) || "copilot",
          title: (payload.source && payload.source.title) || "",
          authors: (payload.source && Array.isArray(payload.source.authors)) ? payload.source.authors : [],
          citation: (payload.source && payload.source.citation) || "",
          year: (payload.source && payload.source.year) || "",
          source_files: (payload.source && Array.isArray(payload.source.source_files)) ? payload.source.source_files : []
        },
        summary: {
          plain: (payload.summary && payload.summary.plain) || "",
          key_points: (payload.summary && Array.isArray(payload.summary.key_points)) ? payload.summary.key_points : []
        },
        quiz: {
          title: (payload.quiz && payload.quiz.title) || "",
          description: (payload.quiz && payload.quiz.description) || "",
          questions: (payload.quiz && Array.isArray(payload.quiz.questions)) ? payload.quiz.questions : []
        },
        mind_map: {
          title: (payload.mind_map && payload.mind_map.title) || ((payload.source && payload.source.title) || "Mind map"),
          layout: (payload.mind_map && payload.mind_map.layout) || "radial",
          nodes: (payload.mind_map && Array.isArray(payload.mind_map.nodes)) ? payload.mind_map.nodes : []
        }
      };
    }

    throw new Error("JSON did not match quiz, mind_map, or combined format.");
  }

  function savePayloadFromInput() {
    try {
      var raw = payloadInput.value.trim();

      if (!raw) {
        showStatus("Paste a Copilot response or JSON first.", "error");
        return;
      }

      var jsonText = cleanText(raw);

      try {
        JSON.parse(jsonText);
      } catch (e) {
        var extracted = extractJsonObject(raw);
        if (!extracted) {
          throw new Error("No valid JSON object found in the pasted text.");
        }
        jsonText = cleanText(extracted);
      }

      var parsed = JSON.parse(jsonText);
      var payload = normalisePayload(parsed);

      localStorage.setItem(KEY, JSON.stringify(payload));
      render(payload);

      var hasQuiz = payload.quiz && Array.isArray(payload.quiz.questions) && payload.quiz.questions.length > 0;
      var hasMap = payload.mind_map && Array.isArray(payload.mind_map.nodes) && payload.mind_map.nodes.length > 0;

      if (hasQuiz && hasMap) {
        showStatus("Saved quiz and mind map.", "success");
      } else if (hasQuiz) {
        showStatus("Saved quiz.", "success");
      } else if (hasMap) {
        showStatus("Saved mind map.", "success");
      } else {
        showStatus("Saved payload, but no quiz questions or mind map nodes were found.", "error");
      }
    } catch (err) {
      console.error(err);
      showStatus("Could not parse a valid JSON payload. " + err.message, "error");
    }
  }

  async function pasteFromClipboard() {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error("Clipboard access is not available.");
      }

      var text = await navigator.clipboard.readText();

      if (!text || !text.trim()) {
        showStatus("Clipboard is empty.", "error");
        return;
      }

      payloadInput.value = text;
      savePayloadFromInput();
    } catch (err) {
      console.error(err);
      showStatus("Could not read from clipboard. You may need to paste manually.", "error");
    }
  }

  function enablePasteModeFromUrl() {
    var params = new URLSearchParams(window.location.search);

    if (params.has("paste")) {
      if (pasteHelpPanel) {
        pasteHelpPanel.style.display = "block";
      }

      if (payloadInput) {
        payloadInput.focus();
        payloadInput.scrollIntoView({ behavior: "smooth", block: "center" });
        payloadInput.classList.add("paste-highlight");

        setTimeout(function () {
          payloadInput.classList.remove("paste-highlight");
        }, 5000);
      }

      showStatus("Paste the Copilot response here, or use Paste from Clipboard.", "success");
    }
  }

  if (saveBtn) saveBtn.addEventListener("click", savePayloadFromInput);

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      localStorage.removeItem(KEY);
      if (payloadInput) payloadInput.value = "";
      render({});
      showStatus("Saved payload cleared.", "success");
    });
  }

  if (pasteClipboardBtn) {
    pasteClipboardBtn.addEventListener("click", pasteFromClipboard);
  }

  if (payloadInput) {
    payloadInput.addEventListener("paste", function () {
      setTimeout(function () {
        if (payloadInput.value.trim()) {
          savePayloadFromInput();
        }
      }, 150);
    });
  }

  try {
    var stored = localStorage.getItem(KEY);
    render(stored ? JSON.parse(stored) : {});
  } catch (err) {
    console.error(err);
    render({});
  }

  enablePasteModeFromUrl();
});
