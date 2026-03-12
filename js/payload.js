let studyPayload = createEmptyPayload();

function createEmptyPayload() {
  return {
    version: "1.0",
    source: {
      origin: "",
      title: "",
      authors: [],
      citation: "",
      year: "",
      source_files: []
    },
    summary: {
      plain: "",
      key_points: []
    },
    quiz: {
      title: "",
      description: "",
      questions: []
    },
    mind_map: {
      title: "",
      nodes: [
        {
          id: "root",
          label: "Main topic",
          parent: null,
          source_ref: "Title"
        }
      ]
    }
  };
}

function createEmptyQuestion() {
  return {
    question: "",
    options: ["", "", "", ""],
    correct_index: 0,
    explanation: "",
    source_ref: ""
  };
}

function normaliseStudyPayload(input) {
  const payload = createEmptyPayload();

  if (typeof input !== "object" || input === null) {
    return payload;
  }

  payload.version = input.version || "1.0";

  payload.source.origin = input.source?.origin || "";
  payload.source.title = input.source?.title || "";
  payload.source.authors = Array.isArray(input.source?.authors) ? input.source.authors : [];
  payload.source.citation = input.source?.citation || "";
  payload.source.year = input.source?.year || "";
  payload.source.source_files = Array.isArray(input.source?.source_files) ? input.source.source_files : [];

  payload.summary.plain = input.summary?.plain || "";
  payload.summary.key_points = Array.isArray(input.summary?.key_points) ? input.summary.key_points : [];

  payload.quiz.title = input.quiz?.title || "";
  payload.quiz.description = input.quiz?.description || "";
  payload.quiz.questions = Array.isArray(input.quiz?.questions)
    ? input.quiz.questions.map((q) => ({
        question: q.question || "",
        options: Array.isArray(q.options) ? normaliseOptions(q.options) : ["", "", "", ""],
        correct_index: Number.isInteger(q.correct_index) ? q.correct_index : 0,
        explanation: q.explanation || "",
        source_ref: q.source_ref || ""
      }))
    : [];

  payload.mind_map.title = input.mind_map?.title || payload.source.title || "Mind map";
  payload.mind_map.nodes = Array.isArray(input.mind_map?.nodes) && input.mind_map.nodes.length
    ? input.mind_map.nodes.map((node, index) => ({
        id: node.id || `node_${index + 1}`,
        label: node.label || "Untitled node",
        parent: node.parent === undefined ? null : node.parent,
        source_ref: node.source_ref || ""
      }))
    : [
        {
          id: "root",
          label: payload.source.title || "Main topic",
          parent: null,
          source_ref: "Title"
        }
      ];

  ensureRootNode(payload.mind_map);

  if (!payload.quiz.title && payload.source.title) {
    payload.quiz.title = `${payload.source.title} quiz`;
  }

  return payload;
}

function normaliseOptions(options) {
  const clean = options.slice(0, 4).map((x) => String(x ?? ""));
  while (clean.length < 4) clean.push("");
  return clean;
}

function ensureRootNode(mindMap) {
  const hasRoot = mindMap.nodes.some((node) => node.id === "root");
  if (!hasRoot) {
    mindMap.nodes.unshift({
      id: "root",
      label: mindMap.title || "Main topic",
      parent: null,
      source_ref: "Title"
    });
  }
}

function renderSource() {
  document.getElementById("sourceTitle").textContent = studyPayload.source.title || "No payload loaded";
  document.getElementById("sourceAuthors").textContent =
    studyPayload.source.authors.length ? studyPayload.source.authors.join(", ") : "—";
  document.getElementById("sourceYear").textContent = studyPayload.source.year || "—";
  document.getElementById("sourceOrigin").textContent = studyPayload.source.origin || "—";
  document.getElementById("sourceCitation").textContent = studyPayload.source.citation || "—";
  document.getElementById("sourceSummary").textContent = studyPayload.summary.plain || "—";

  const keyPointsEl = document.getElementById("summaryKeyPoints");
  keyPointsEl.innerHTML = "";

  const points = studyPayload.summary.key_points || [];
  if (!points.length) {
    const li = document.createElement("li");
    li.textContent = "No key points loaded.";
    keyPointsEl.appendChild(li);
    return;
  }

  points.forEach((point) => {
    const li = document.createElement("li");
    li.textContent = point;
    keyPointsEl.appendChild(li);
  });
}

function updatePayloadPreview() {
  const preview = document.getElementById("payloadPreview");
  preview.textContent = JSON.stringify(studyPayload, null, 2);
}
