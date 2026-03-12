let studyPayload = createEmptyPayload();

function createEmptyPayload() {
  return {
    version: "1.1",
    source: { origin: "", title: "", authors: [], citation: "", year: "", source_files: [] },
    summary: { plain: "", key_points: [] },
    quiz: { title: "", description: "", questions: [] },
    mind_map: {
      title: "",
      layout: "top-to-bottom",
      nodes: [{ id: "root", label: "Main topic", parent: null, source_ref: "Title", note: "", url: "", image: "", document: "", attachedDocs: [], attachedLinks: [], attachedImage: "", node_type: "concept" }]
    }
  };
}

function createEmptyQuestion() { return { question: "", options: ["", "", "", ""], correct_index: 0, explanation: "", source_ref: "" }; }

function createDefaultNode(index = 1, parent = "root") {
  return { id: `node_${index}`, label: "New node", parent, source_ref: "", note: "", url: "", image: "", document: "", attachedDocs: [], attachedLinks: [], attachedImage: "", node_type: "concept" };
}

function normaliseStudyPayload(input) {
  const payload = createEmptyPayload();
  if (typeof input !== "object" || input === null) return payload;
  payload.version = input.version || "1.1";
  Object.assign(payload.source, input.source || {});
  payload.source.authors = Array.isArray(payload.source.authors) ? payload.source.authors : [];
  payload.source.source_files = Array.isArray(payload.source.source_files) ? payload.source.source_files : [];
  payload.summary.plain = input.summary?.plain || "";
  payload.summary.key_points = Array.isArray(input.summary?.key_points) ? input.summary.key_points : [];
  payload.quiz.title = input.quiz?.title || (payload.source.title ? `${payload.source.title} quiz` : "");
  payload.quiz.description = input.quiz?.description || "";
  payload.quiz.questions = Array.isArray(input.quiz?.questions) ? input.quiz.questions.map(q => ({
    question: q.question || "",
    options: Array.isArray(q.options) ? normaliseOptions(q.options) : ["", "", "", ""],
    correct_index: Number.isInteger(q.correct_index) ? q.correct_index : 0,
    explanation: q.explanation || "",
    source_ref: q.source_ref || ""
  })) : [];
  payload.mind_map.title = input.mind_map?.title || payload.source.title || "Mind map";
  payload.mind_map.layout = input.mind_map?.layout || "top-to-bottom";
  payload.mind_map.nodes = Array.isArray(input.mind_map?.nodes) && input.mind_map.nodes.length ? input.mind_map.nodes.map((node, index) => ({
    ...createDefaultNode(index + 1, node.parent ?? null),
    id: node.id || `node_${index + 1}`,
    label: node.label || "Untitled node",
    parent: node.parent === undefined ? null : node.parent,
    source_ref: node.source_ref || "",
    note: node.note || "",
    url: node.url || "",
    image: node.image || "",
    document: node.document || "",
    attachedDocs: Array.isArray(node.attachedDocs) ? node.attachedDocs : [],
    attachedLinks: Array.isArray(node.attachedLinks) ? node.attachedLinks : [],
    attachedImage: node.attachedImage || "",
    node_type: node.node_type || (node.image || node.attachedImage ? "image" : "concept")
  })) : [createDefaultNode(1, null)];
  ensureRootNode(payload.mind_map);
  return payload;
}

function normaliseOptions(options) { const clean = options.slice(0, 4).map(x => String(x ?? "")); while (clean.length < 4) clean.push(""); return clean; }
function ensureRootNode(mindMap) {
  const hasRoot = mindMap.nodes.some(node => node.id === "root");
  if (!hasRoot) mindMap.nodes.unshift({ ...createDefaultNode(0, null), id: "root", label: mindMap.title || "Main topic", parent: null, source_ref: "Title" });
}
function renderSource() {
  document.getElementById("sourceTitle").textContent = studyPayload.source.title || "No payload loaded";
  document.getElementById("sourceAuthors").textContent = studyPayload.source.authors.length ? studyPayload.source.authors.join(", ") : "—";
  document.getElementById("sourceYear").textContent = studyPayload.source.year || "—";
  document.getElementById("sourceOrigin").textContent = studyPayload.source.origin || "—";
  document.getElementById("sourceCitation").textContent = studyPayload.source.citation || "—";
  document.getElementById("sourceSummary").textContent = studyPayload.summary.plain || "—";
  document.getElementById("quizTitleInput").value = studyPayload.quiz.title || "";
  document.getElementById("quizDescriptionInput").value = studyPayload.quiz.description || "";
  document.getElementById("mindMapTitleInput").value = studyPayload.mind_map.title || "";
  document.getElementById("mindMapLayoutInput").value = studyPayload.mind_map.layout || "top-to-bottom";
  const keyPointsEl = document.getElementById("summaryKeyPoints"); keyPointsEl.innerHTML = "";
  const points = studyPayload.summary.key_points || [];
  if (!points.length) { const li = document.createElement("li"); li.textContent = "No key points loaded."; keyPointsEl.appendChild(li); return; }
  points.forEach(point => { const li = document.createElement("li"); li.textContent = point; keyPointsEl.appendChild(li); });
}
function updatePayloadPreview() { document.getElementById("payloadPreview").textContent = JSON.stringify(studyPayload, null, 2); }
