function renderMindMap() {
  const container = document.getElementById("mindMapContainer");
  container.innerHTML = "";

  const title = document.createElement("div");
  title.className = "meta-block";
  title.innerHTML = `
    <label class="label">Mind map title</label>
    <input type="text" id="mindMapTitleInput" value="${escapeHtml(studyPayload.mind_map.title || "")}">
  `;
  container.appendChild(title);

  document.getElementById("mindMapTitleInput").addEventListener("input", (e) => {
    studyPayload.mind_map.title = e.target.value;
    const root = studyPayload.mind_map.nodes.find((n) => n.id === "root");
    if (root && (!root.label || root.label === "Main topic" || root.label === studyPayload.source.title)) {
      root.label = e.target.value || "Main topic";
    }
    updatePayloadPreview();
    renderMindMap();
  });

  const editorSection = document.createElement("div");
  editorSection.innerHTML = `<h3>Node editor</h3>`;
  container.appendChild(editorSection);

  studyPayload.mind_map.nodes.forEach((node, index) => {
    const card = document.createElement("div");
    card.className = "node-card";

    const parentOptions = studyPayload.mind_map.nodes
      .filter((n) => n.id !== node.id)
      .map((n) => `<option value="${escapeAttr(n.id)}" ${node.parent === n.id ? "selected" : ""}>${escapeHtml(n.label)}</option>`)
      .join("");

    card.innerHTML = `
      <div class="node-header">
        <div class="node-title">${node.id === "root" ? "Root node" : `Node ${index + 1}`}</div>
        <div class="button-row">
          <button data-action="add-child" data-node-id="${escapeAttr(node.id)}">Add child</button>
          ${node.id !== "root" ? `<button class="delete-btn" data-action="delete-node" data-node-id="${escapeAttr(node.id)}">Delete</button>` : ""}
        </div>
      </div>
      <div class="node-fields">
        <div>
          <label class="label">Label</label>
          <input type="text" data-field="label" data-node-id="${escapeAttr(node.id)}" value="${escapeAttr(node.label)}">
        </div>
        <div>
          <label class="label">Source reference</label>
          <input type="text" data-field="source_ref" data-node-id="${escapeAttr(node.id)}" value="${escapeAttr(node.source_ref || "")}">
        </div>
        <div>
          <label class="label">Parent</label>
          ${
            node.id === "root"
              ? `<div class="small-note">Root has no parent.</div>`
              : `<select data-field="parent" data-node-id="${escapeAttr(node.id)}">
                  <option value="">(none)</option>
                  ${parentOptions}
                </select>`
          }
        </div>
      </div>
    `;

    editorSection.appendChild(card);
  });

  bindMindMapEvents();

  const treeSection = document.createElement("div");
  treeSection.innerHTML = `<h3>Tree preview</h3>`;
  treeSection.appendChild(buildMindMapTree());
  container.appendChild(treeSection);
}

function bindMindMapEvents() {
  document.querySelectorAll('[data-field="label"]').forEach((input) => {
    input.addEventListener("input", (e) => {
      const node = findNodeById(e.target.dataset.nodeId);
      if (!node) return;
      node.label = e.target.value;
      updatePayloadPreview();
      renderMindMap();
    });
  });

  document.querySelectorAll('[data-field="source_ref"]').forEach((input) => {
    input.addEventListener("input", (e) => {
      const node = findNodeById(e.target.dataset.nodeId);
      if (!node) return;
      node.source_ref = e.target.value;
      updatePayloadPreview();
    });
  });

  document.querySelectorAll('[data-field="parent"]').forEach((select) => {
    select.addEventListener("change", (e) => {
      const node = findNodeById(e.target.dataset.nodeId);
      if (!node) return;

      const newParent = e.target.value || null;
      if (wouldCreateCycle(node.id, newParent)) {
        showStatus("That parent choice would create a cycle.", "error");
        renderMindMap();
        return;
      }

      node.parent = newParent;
      updatePayloadPreview();
      renderMindMap();
    });
  });

  document.querySelectorAll('[data-action="add-child"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      addChildNodeTo(btn.dataset.nodeId);
      renderMindMap();
      updatePayloadPreview();
    });
  });

  document.querySelectorAll('[data-action="delete-node"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteNodeAndDescendants(btn.dataset.nodeId);
      renderMindMap();
      updatePayloadPreview();
    });
  });
}

function addChildNodeTo(parentId) {
  const nextId = generateNodeId();
  studyPayload.mind_map.nodes.push({
    id: nextId,
    label: "New node",
    parent: parentId,
    source_ref: ""
  });
}

function deleteNodeAndDescendants(nodeId) {
  const idsToDelete = new Set();
  collectDescendants(nodeId, idsToDelete);

  studyPayload.mind_map.nodes = studyPayload.mind_map.nodes.filter((node) => !idsToDelete.has(node.id));
}

function collectDescendants(nodeId, set) {
  set.add(nodeId);
  studyPayload.mind_map.nodes
    .filter((node) => node.parent === nodeId)
    .forEach((child) => collectDescendants(child.id, set));
}

function generateNodeId() {
  let counter = 1;
  while (studyPayload.mind_map.nodes.some((n) => n.id === `node_${counter}`)) {
    counter += 1;
  }
  return `node_${counter}`;
}

function findNodeById(id) {
  return studyPayload.mind_map.nodes.find((node) => node.id === id);
}

function wouldCreateCycle(nodeId, newParentId) {
  if (!newParentId) return false;
  if (nodeId === newParentId) return true;

  let current = findNodeById(newParentId);
  while (current) {
    if (current.parent === nodeId) return true;
    current = current.parent ? findNodeById(current.parent) : null;
  }
  return false;
}

function buildMindMapTree() {
  const rootUl = document.createElement("ul");
  rootUl.className = "mindmap-tree";

  const rootNodes = studyPayload.mind_map.nodes.filter((node) => node.parent === null);

  rootNodes.forEach((node) => {
    rootUl.appendChild(buildMindMapTreeNode(node));
  });

  return rootUl;
}

function buildMindMapTreeNode(node) {
  const li = document.createElement("li");

  const label = document.createElement("span");
  label.className = "tree-label";
  label.textContent = node.label || "Untitled node";
  li.appendChild(label);

  if (node.source_ref) {
    const ref = document.createElement("span");
    ref.className = "tree-source-ref";
    ref.textContent = `(${node.source_ref})`;
    li.appendChild(ref);
  }

  const children = studyPayload.mind_map.nodes.filter((n) => n.parent === node.id);
  if (children.length) {
    const ul = document.createElement("ul");
    ul.className = "mindmap-tree";
    children.forEach((child) => ul.appendChild(buildMindMapTreeNode(child)));
    li.appendChild(ul);
  }

  return li;
}

function mindMapToOpml(mindMap) {
  const safeTitle = escapeXml(mindMap.title || "Mind map");
  const roots = mindMap.nodes.filter((node) => node.parent === null);

  const body = roots.map((node) => nodeToOpml(node, mindMap.nodes)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${safeTitle}</title>
  </head>
  <body>
${body}
  </body>
</opml>`;
}

function nodeToOpml(node, allNodes, indent = "    ") {
  const children = allNodes.filter((n) => n.parent === node.id);
  const text = escapeXml(node.label || "Untitled node");
  const sourceRefAttr = node.source_ref ? ` _note="${escapeXml(node.source_ref)}"` : "";

  if (!children.length) {
    return `${indent}<outline text="${text}"${sourceRefAttr} />`;
  }

  const childXml = children.map((child) => nodeToOpml(child, allNodes, indent + "  ")).join("\n");
  return `${indent}<outline text="${text}"${sourceRefAttr}>
${childXml}
${indent}</outline>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
