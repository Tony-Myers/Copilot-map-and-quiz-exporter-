document.addEventListener("DOMContentLoaded", () => {
  bindCoreEvents();
  bindTabEvents();
  initialiseFromUrl();
  refreshAllViews();
});

function bindCoreEvents() {
  document.getElementById("loadPayloadBtn").addEventListener("click", loadPayloadFromTextarea);
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
      setStudyPayload(normaliseStudyPayload(JSON.parse(text)));
      showStatus("Loaded payload from file.", "success");
    } catch (error) {
      console.error(error);
      showStatus("Could not read JSON file.", "error");
    }
  });
  document.getElementById("loadSessionBtn").addEventListener("click", async () => {
    const id = document.getElementById("sessionIdInput").value.trim();
    if (!id) return showStatus("Enter a session ID first.", "error");
    await loadSessionById(id);
  });
  document.getElementById("addQuestionBtn").addEventListener("click", () => {
    studyPayload.quiz.questions.push(createEmptyQuestion());
    renderQuiz(); updatePayloadPreview();
  });
  document.getElementById("addRootChildBtn").addEventListener("click", () => {
    addChildNodeTo("root");
    renderMindMap(); updatePayloadPreview();
  });
  document.getElementById("quizTitleInput").addEventListener("input", e => { studyPayload.quiz.title = e.target.value; updatePayloadPreview(); });
  document.getElementById("quizDescriptionInput").addEventListener("input", e => { studyPayload.quiz.description = e.target.value; updatePayloadPreview(); });
  document.getElementById("mindMapTitleInput").addEventListener("input", e => { studyPayload.mind_map.title = e.target.value; const root=findNodeById("root"); if(root) root.label = e.target.value || root.label; renderMindMap(); updatePayloadPreview(); });
  document.getElementById("mindMapLayoutInput").addEventListener("change", e => { studyPayload.mind_map.layout = e.target.value; updatePayloadPreview(); });
  bindExportEvents();
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
  if (!raw) return showStatus("Paste a JSON payload first.", "error");
  try {
    setStudyPayload(normaliseStudyPayload(JSON.parse(raw)));
    showStatus("Loaded pasted JSON payload.", "success");
  } catch (error) {
    console.error(error);
    showStatus("Invalid JSON payload.", "error");
  }
}

function setStudyPayload(payload) { studyPayload = payload; refreshAllViews(); }
function refreshAllViews() { renderSource(); renderQuiz(); renderMindMap(); updatePayloadPreview(); }
function showStatus(message, type = "success") { const el = document.getElementById("statusMessage"); el.textContent = message; el.className = `status show ${type}`; }
