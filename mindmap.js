function renderMindMap() {
  const container = document.getElementById("mindMapContainer");
  container.innerHTML = "";
  const editorSection = document.createElement("div");
  editorSection.innerHTML = `<h3>Node editor</h3>`;
  studyPayload.mind_map.nodes.forEach((node, index) => {
    const card = document.createElement("div"); card.className = "node-card";
    const parentOptions = studyPayload.mind_map.nodes.filter(n => n.id !== node.id).map(n => `<option value="${escapeAttr(n.id)}" ${node.parent === n.id ? "selected" : ""}>${escapeHtml(n.label)}</option>`).join("");
    card.innerHTML = `
      <div class="node-header">
        <div class="node-title">${node.id === "root" ? "Root node" : `Node ${index + 1}`}</div>
        <div class="button-row">
          <button data-action="add-child" data-node-id="${escapeAttr(node.id)}">Add child</button>
          ${node.id !== "root" ? `<button class="delete-btn" data-action="delete-node" data-node-id="${escapeAttr(node.id)}">Delete</button>` : ""}
        </div>
      </div>
      <div class="node-fields">
        <div><label class="label">Label</label><input type="text" data-field="label" data-node-id="${escapeAttr(node.id)}" value="${escapeAttr(node.label)}"></div>
        <div><label class="label">Source reference</label><input type="text" data-field="source_ref" data-node-id="${escapeAttr(node.id)}" value="${escapeAttr(node.source_ref || "")}"></div>
        <div><label class="label">Note</label><textarea rows="2" data-field="note" data-node-id="${escapeAttr(node.id)}">${escapeHtml(node.note || "")}</textarea></div>
        <div><label class="label">Primary URL</label><input type="text" data-field="url" data-node-id="${escapeAttr(node.id)}" value="${escapeAttr(node.url || "")}" placeholder="https://..."></div>
        <div><label class="label">Attached image URL / data URI</label><input type="text" data-field="attachedImage" data-node-id="${escapeAttr(node.id)}" value="${escapeAttr(node.attachedImage || "")}" placeholder="Optional"></div>
        <div><label class="label">Parent</label>${node.id === "root" ? `<div class="small-note">Root has no parent.</div>` : `<select data-field="parent" data-node-id="${escapeAttr(node.id)}"><option value="">(none)</option>${parentOptions}</select>`}</div>
        <div class="attachment-grid">
          <div class="attachment-box">
            <label class="label">Attached links (JSON array)</label>
            <textarea rows="3" data-field="attachedLinks" data-node-id="${escapeAttr(node.id)}" placeholder='[{"label":"Paper","url":"https://..."}]'>${escapeHtml(JSON.stringify(node.attachedLinks || [], null, 2))}</textarea>
          </div>
          <div class="attachment-box">
            <label class="label">Attached documents (JSON array)</label>
            <textarea rows="3" data-field="attachedDocs" data-node-id="${escapeAttr(node.id)}" placeholder='[{"name":"article.pdf","url":"https://..."}]'>${escapeHtml(JSON.stringify(node.attachedDocs || [], null, 2))}</textarea>
          </div>
        </div>
      </div>`;
    editorSection.appendChild(card);
  });
  container.appendChild(editorSection);
  const treeSection = document.createElement("div");
  treeSection.innerHTML = `<h3>Tree preview</h3>`;
  treeSection.appendChild(buildMindMapTree());
  container.appendChild(treeSection);
  bindMindMapEvents();
}

function bindMindMapEvents() {
  document.querySelectorAll('[data-field="label"]').forEach(input => input.addEventListener("input", e => { const node=findNodeById(e.target.dataset.nodeId); if(node){ node.label=e.target.value; updatePayloadPreview(); renderMindMap(); } }));
  document.querySelectorAll('[data-field="source_ref"]').forEach(input => input.addEventListener("input", e => { const node=findNodeById(e.target.dataset.nodeId); if(node){ node.source_ref=e.target.value; updatePayloadPreview(); } }));
  document.querySelectorAll('[data-field="note"]').forEach(input => input.addEventListener("input", e => { const node=findNodeById(e.target.dataset.nodeId); if(node){ node.note=e.target.value; updatePayloadPreview(); } }));
  document.querySelectorAll('[data-field="url"]').forEach(input => input.addEventListener("input", e => { const node=findNodeById(e.target.dataset.nodeId); if(node){ node.url=e.target.value; updatePayloadPreview(); } }));
  document.querySelectorAll('[data-field="attachedImage"]').forEach(input => input.addEventListener("input", e => { const node=findNodeById(e.target.dataset.nodeId); if(node){ node.attachedImage=e.target.value; updatePayloadPreview(); renderMindMap(); } }));
  document.querySelectorAll('[data-field="parent"]').forEach(select => select.addEventListener("change", e => { const node=findNodeById(e.target.dataset.nodeId); if(!node) return; const newParent=e.target.value || null; if(wouldCreateCycle(node.id, newParent)){ showStatus("That parent choice would create a cycle.", "error"); return renderMindMap(); } node.parent=newParent; updatePayloadPreview(); renderMindMap(); }));
  document.querySelectorAll('[data-field="attachedLinks"]').forEach(area => area.addEventListener("input", e => parseJsonFieldToNode(e.target.dataset.nodeId, 'attachedLinks', e.target.value)));
  document.querySelectorAll('[data-field="attachedDocs"]').forEach(area => area.addEventListener("input", e => parseJsonFieldToNode(e.target.dataset.nodeId, 'attachedDocs', e.target.value)));
  document.querySelectorAll('[data-action="add-child"]').forEach(btn => btn.addEventListener("click", () => { addChildNodeTo(btn.dataset.nodeId); renderMindMap(); updatePayloadPreview(); }));
  document.querySelectorAll('[data-action="delete-node"]').forEach(btn => btn.addEventListener("click", () => { deleteNodeAndDescendants(btn.dataset.nodeId); renderMindMap(); updatePayloadPreview(); }));
}

function parseJsonFieldToNode(nodeId, field, text) {
  const node = findNodeById(nodeId); if (!node) return;
  try { node[field] = JSON.parse(text || '[]'); updatePayloadPreview(); }
  catch { /* ignore partial invalid typing */ }
}
function addChildNodeTo(parentId) { studyPayload.mind_map.nodes.push(createDefaultNode(generateNodeNumericId(), parentId)); }
function deleteNodeAndDescendants(nodeId) { const idsToDelete = new Set(); collectDescendants(nodeId, idsToDelete); studyPayload.mind_map.nodes = studyPayload.mind_map.nodes.filter(node => !idsToDelete.has(node.id)); }
function collectDescendants(nodeId, set) { set.add(nodeId); studyPayload.mind_map.nodes.filter(node => node.parent === nodeId).forEach(child => collectDescendants(child.id, set)); }
function generateNodeNumericId() { let counter=1; while (studyPayload.mind_map.nodes.some(n => n.id === `node_${counter}`)) counter += 1; return counter; }
function findNodeById(id) { return studyPayload.mind_map.nodes.find(node => node.id === id); }
function wouldCreateCycle(nodeId, newParentId) { if (!newParentId) return false; if (nodeId === newParentId) return true; let current = findNodeById(newParentId); while (current) { if (current.parent === nodeId) return true; current = current.parent ? findNodeById(current.parent) : null; } return false; }
function buildMindMapTree() { const rootUl = document.createElement("ul"); rootUl.className = "mindmap-tree"; studyPayload.mind_map.nodes.filter(node => node.parent === null).forEach(node => rootUl.appendChild(buildMindMapTreeNode(node))); return rootUl; }
function buildMindMapTreeNode(node) {
  const li = document.createElement("li");
  const label = document.createElement("span"); label.className = "tree-label"; label.textContent = node.label || "Untitled node"; li.appendChild(label);
  if (node.source_ref) { const ref = document.createElement("span"); ref.className = "tree-source-ref"; ref.textContent = `(${node.source_ref})`; li.appendChild(ref); }
  const extras = [];
  if (node.url) extras.push(`link`);
  if (node.attachedDocs?.length) extras.push(`${node.attachedDocs.length} doc` + (node.attachedDocs.length > 1 ? 's' : ''));
  if (node.attachedLinks?.length) extras.push(`${node.attachedLinks.length} extra link` + (node.attachedLinks.length > 1 ? 's' : ''));
  if (node.attachedImage) extras.push(`image`);
  if (extras.length) { const ex = document.createElement("span"); ex.className = "tree-source-ref"; ex.textContent = ` [${extras.join(', ')}]`; li.appendChild(ex); }
  const children = studyPayload.mind_map.nodes.filter(n => n.parent === node.id);
  if (children.length) { const ul = document.createElement("ul"); ul.className = "mindmap-tree"; children.forEach(child => ul.appendChild(buildMindMapTreeNode(child))); li.appendChild(ul); }
  return li;
}
function mindMapToOpml(mindMap) {
  const safeTitle = escapeXml(mindMap.title || "Mind map");
  const roots = mindMap.nodes.filter(node => node.parent === null);
  const body = roots.map(node => nodeToOpml(node, mindMap.nodes)).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0">\n  <head>\n    <title>${safeTitle}</title>\n  </head>\n  <body>\n${body}\n  </body>\n</opml>`;
}
function nodeToOpml(node, allNodes, indent = "    ") {
  const children = allNodes.filter(n => n.parent === node.id); const text = escapeXml(node.label || "Untitled node");
  let attrs = '';
  if (node.source_ref) attrs += ` _note="${escapeXml(node.source_ref)}"`;
  if (node.attachedImage) attrs += ` _image="${escapeXml(node.attachedImage)}"`;
  if (node.url) attrs += ` _url="${escapeXml(node.url)}"`;
  if (node.attachedDocs?.length) attrs += ` _docs="${escapeXml(JSON.stringify(node.attachedDocs))}"`;
  if (node.attachedLinks?.length) attrs += ` _links="${escapeXml(JSON.stringify(node.attachedLinks))}"`;
  if (!children.length) return `${indent}<outline text="${text}"${attrs} />`;
  const childXml = children.map(child => nodeToOpml(child, allNodes, indent + "  ")).join("\n");
  return `${indent}<outline text="${text}"${attrs}>\n${childXml}\n${indent}</outline>`;
}
function escapeXml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;"); }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
function escapeAttr(value) { return escapeHtml(value); }
