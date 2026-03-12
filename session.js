const SESSION_API_BASE = "https://YOUR-BACKEND-URL.example.com";
async function loadSessionById(sessionId) {
  try {
    const response = await fetch(`${SESSION_API_BASE}/sessions/${encodeURIComponent(sessionId)}`);
    if (!response.ok) throw new Error(`Session request failed: ${response.status}`);
    const data = await response.json();
    setStudyPayload(normaliseStudyPayload(data));
    showStatus(`Loaded session ${sessionId}.`, "success");
  } catch (error) {
    console.error(error);
    showStatus("Could not load session from backend.", "error");
  }
}
