document.addEventListener("DOMContentLoaded", () => {
  bindCoreEvents();
  bindTabEvents();
  initialiseFromUrl();
  refreshAllViews();
});

function bindCoreEvents() {
  document.getElementById("loadPayloadBtn").addEventListener("click", () => {
    loadPayloadFromTextarea();
  });

  document.getElementById("clearPayloadBtn").addEventListener("click", () => {
    document.getElementById("payloadInput").value = "";
    setStudyPayload(createEmptyPayload());
    showStatus("Cleared payload.", "success");
  });

  document.getElementById("fileInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setStudyPayload(normaliseStudyPayload(parsed));
      showStatus("Loaded payload from file.", "success");
    } catch (error) {
      console.error(error);
      showStatus("Could not read JSON file.", "error");
    }
  });

  document.getElementById("loadSessionBtn").addEventListener("click", async () => {
    const id = document.getElementById("sessionIdInput").value.trim();
    if (!id) {
      showStatus("Enter a session ID first.", "error");
      return;
    }
    await loadSessionById(id);
  });

  document.getElementById("addQuestionBtn").addEventListener("click", () => {
    studyPayload.quiz.questions.push(createEmptyQuestion());
    renderQuiz();
    updatePayloadPreview();
  });

  document.getElementById("addRootChildBtn").addEventListener("click", () => {
    addChildNodeTo("root");
    renderMindMap();
    updatePayloadPreview();
  });

  document.getElementById("exportPayloadBtn").addEventListener("click", () => {
    downloadJson("study-payload.json", studyPayload);
  });

  document.getElementById("exportQuizBtn").addEventListener("click", () => {
    downloadJson("quiz.json", studyPayload.quiz);
  });

  document.getElementById("exportMindMapBtn").addEventListener("click", () => {
    downloadJson("mind-map.json", studyPayload.mind_map);
  });

  document.getElementById("exportOpmlBtn").addEventListener("click", () => {
    const opml = mindMapToOpml(studyPayload.mind_map);
    downloadText("mind-map.opml", opml, "text/xml");
  });
}

function bindTabEvents() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.add("active");
    });
  });
}

function initialiseFromUrl() {
  const params = new URLSearchParams(window.location.search);

  if (params.has("session")) {
    const sessionId = params.get("session");
    document.getElementById("sessionIdInput").value = sessionId;
    loadSessionById(sessionId);
  }
}

function loadPayloadFromTextarea() {
  const raw = document.getElementById("payloadInput").value.trim();

  if (!raw) {
    showStatus("Paste a JSON payload first.", "error");
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    setStudyPayload(normaliseStudyPayload(parsed));
    showStatus("Loaded pasted JSON payload.", "success");
  } catch (error) {
    console.error(error);
    showStatus("Invalid JSON payload.", "error");
  }
}

function setStudyPayload(payload) {
  studyPayload = payload;
  refreshAllViews();
}

function refreshAllViews() {
  renderSource();
  renderQuiz();
  renderMindMap();
  updatePayloadPreview();
}

function showStatus(message, type = "success") {
  const el = document.getElementById("statusMessage");
  el.textContent = message;
  el.className = `status show ${type}`;
}
