function bindExportEvents() {
  document.getElementById("exportPayloadBtn").addEventListener("click", () => downloadJson("study-payload.json", studyPayload));
  document.getElementById("exportQuizBtn").addEventListener("click", () => downloadJson("quiz.json", studyPayload.quiz));
  document.getElementById("exportMindMapBtn").addEventListener("click", () => downloadJson("mind-map.json", studyPayload.mind_map));
  document.getElementById("exportOpmlBtn").addEventListener("click", () => downloadText("mind-map.opml", mindMapToOpml(studyPayload.mind_map), "text/xml"));
  document.getElementById("exportCsvBtn").addEventListener("click", exportCSV);
  document.getElementById("exportAikenBtn").addEventListener("click", exportAiken);
  document.getElementById("exportGiftBtn").addEventListener("click", exportGIFT);
  document.getElementById("exportMoodleXmlBtn").addEventListener("click", exportMoodleXML);
  document.getElementById("exportStandaloneQuizBtn").addEventListener("click", exportStandaloneHTMLQuiz);
  document.getElementById("exportWorksheetBtn").addEventListener("click", exportWorksheet);
  document.getElementById("exportStandaloneMindMapBtn").addEventListener("click", exportStandaloneHTMLMindMap);
}

function ensureQuestions() { if (!studyPayload.quiz.questions.length) { showStatus("No questions to export.", "error"); return false; } return true; }
function downloadJson(filename, obj) { downloadText(filename, JSON.stringify(obj, null, 2), "application/json"); }
function downloadText(filename, text, mimeType = "text/plain") { const blob = new Blob([text], { type: mimeType }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
function csvEscape(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function xmlEscape(value) { return String(value ?? "").replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;'); }

function exportCSV() {
  if (!ensureQuestions()) return;
  const header = ["Question", "Option A", "Option B", "Option C", "Option D", "Correct", "Explanation", "Source ref"];
  const rows = studyPayload.quiz.questions.map(q => [q.question, q.options[0], q.options[1], q.options[2], q.options[3], String.fromCharCode(65 + q.correct_index), q.explanation, q.source_ref]);
  downloadText("quiz.csv", [header, ...rows].map(row => row.map(csvEscape).join(",")).join("\n"), "text/csv");
}
function exportAiken() {
  if (!ensureQuestions()) return;
  const text = studyPayload.quiz.questions.map(q => `${q.question}\nA. ${q.options[0]}\nB. ${q.options[1]}\nC. ${q.options[2]}\nD. ${q.options[3]}\nANSWER: ${String.fromCharCode(65 + q.correct_index)}\n`).join("\n");
  downloadText("quiz-aiken.txt", text);
}
function exportGIFT() {
  if (!ensureQuestions()) return;
  const text = studyPayload.quiz.questions.map(q => {
    const options = q.options.map((opt, idx) => `${idx === q.correct_index ? '=' : '~'}${opt}`).join(" ");
    return `::${q.source_ref || 'Question'}::${q.question} { ${options} }${q.explanation ? `\n//// ${q.explanation}` : ''}`;
  }).join("\n\n");
  downloadText("quiz-gift.txt", text);
}
function exportMoodleXML() {
  if (!ensureQuestions()) return;
  const body = studyPayload.quiz.questions.map(q => `  <question type="multichoice">\n    <name><text>${xmlEscape(q.question.slice(0, 100))}</text></name>\n    <questiontext format="html"><text><![CDATA[<p>${xmlEscape(q.question)}</p>]]></text></questiontext>\n    <generalfeedback format="html"><text><![CDATA[<p>${xmlEscape(q.explanation || '')}</p>]]></text></generalfeedback>\n    <single>true</single>\n    <shuffleanswers>true</shuffleanswers>\n${q.options.map((opt, idx) => `    <answer fraction="${idx === q.correct_index ? 100 : 0}" format="html"><text><![CDATA[<p>${xmlEscape(opt)}</p>]]></text></answer>`).join("\n")}\n  </question>`).join("\n");
  downloadText("quiz-moodle.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n${body}\n</quiz>`, "application/xml");
}
function exportStandaloneHTMLQuiz() {
  if (!ensureQuestions()) return;
  const meta = JSON.stringify({ title: studyPayload.quiz.title, description: studyPayload.quiz.description, questions: studyPayload.quiz.questions });
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${escapeHtml(studyPayload.quiz.title || 'Quiz')}</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:30px auto;padding:20px;background:#f8fafc;color:#1f2937} .card{background:#fff;border:1px solid #d1d5db;border-radius:12px;padding:20px;margin-bottom:20px} button{background:#2563eb;color:#fff;border:none;border-radius:8px;padding:10px 16px;cursor:pointer} .opt{margin:.5rem 0;padding:.6rem;border:1px solid #d1d5db;border-radius:8px}.correct{background:#dcfce7}.wrong{background:#fee2e2}.muted{color:#6b7280}</style></head><body><div class="card"><h1></h1><p class="muted"></p><div id="quiz"></div><button id="submitBtn">Check answers</button><div id="score"></div></div><script>const data=${meta}; document.querySelector('h1').textContent=data.title||'Quiz'; document.querySelector('.muted').textContent=data.description||''; const root=document.getElementById('quiz'); data.questions.forEach((q,i)=>{ const card=document.createElement('div'); card.className='card'; card.innerHTML='<h3>Question '+(i+1)+'</h3><p>'+esc(q.question)+'</p>'; q.options.forEach((opt,j)=>{ const id='q'+i+'_'+j; const div=document.createElement('div'); div.className='opt'; div.innerHTML='<label><input type="radio" name="q'+i+'" value="'+j+'"> '+esc(opt)+'</label>'; card.appendChild(div); }); if(q.explanation){ const p=document.createElement('p'); p.className='muted'; p.textContent='Explanation available after marking.'; card.appendChild(p);} root.appendChild(card); }); document.getElementById('submitBtn').onclick=()=>{ let correct=0; [...root.children].forEach((card,i)=>{ const selected=card.querySelector('input:checked'); const q=data.questions[i]; [...card.querySelectorAll('.opt')].forEach((div,j)=>{ div.classList.remove('correct','wrong'); if(j===q.correct_index) div.classList.add('correct'); if(selected && Number(selected.value)===j && j!==q.correct_index) div.classList.add('wrong'); }); if(selected && Number(selected.value)===q.correct_index) correct++; if(q.explanation){ let ex=card.querySelector('.explain'); if(!ex){ ex=document.createElement('p'); ex.className='explain'; card.appendChild(ex);} ex.textContent='Explanation: '+q.explanation; } }); document.getElementById('score').textContent='Score: '+correct+' / '+data.questions.length; }; function esc(s){const d=document.createElement('div'); d.textContent=s ?? ''; return d.innerHTML;}</script></body></html>`;
  downloadText("standalone-quiz.html", html, "text/html");
}
function exportWorksheet() {
  if (!ensureQuestions()) return;
  const body = studyPayload.quiz.questions.map((q, i) => `${i + 1}. ${q.question}\n   A. ${q.options[0]}\n   B. ${q.options[1]}\n   C. ${q.options[2]}\n   D. ${q.options[3]}\n`).join("\n");
  const key = studyPayload.quiz.questions.map((q, i) => `${i + 1}. ${String.fromCharCode(65 + q.correct_index)}${q.explanation ? ` — ${q.explanation}` : ''}`).join("\n");
  downloadText("quiz-worksheet.txt", `${studyPayload.quiz.title || 'Quiz'}\n\n${body}\nAnswer key\n${key}`);
}
function exportStandaloneHTMLMindMap() {
  const mindMap = JSON.stringify(studyPayload.mind_map);
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${escapeHtml(studyPayload.mind_map.title || 'Mind Map')}</title><style>body{font-family:Arial,sans-serif;margin:0;background:#f8fafc;color:#1f2937}header{padding:20px;background:#fff;border-bottom:1px solid #d1d5db;position:sticky;top:0}main{padding:20px;max-width:1200px;margin:0 auto}.controls{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.controls select{padding:8px}.node{background:#fff;border:1px solid #d1d5db;border-radius:12px;padding:10px 12px;margin:10px 0;box-shadow:0 2px 8px rgba(0,0,0,.04)}.node .meta{color:#6b7280;font-size:.9rem}.children{margin-left:30px}.layout-left-to-right .children{margin-left:45px}.layout-radial .tree-root{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}.layout-radial .tree-root>.node-wrap{flex:1 1 320px}.badge{display:inline-block;background:#e0e7ff;color:#3730a3;border-radius:999px;padding:2px 8px;font-size:.8rem;margin-right:6px}a{color:#1d4ed8;text-decoration:none}a:hover{text-decoration:underline}.thumb{max-width:180px;display:block;margin-top:8px;border:1px solid #d1d5db;border-radius:8px}</style></head><body><header><h1 id="title"></h1><div class="controls"><label>Layout <select id="layoutSel"><option value="top-to-bottom">Top-to-bottom</option><option value="left-to-right">Left-to-right</option><option value="radial">Radial</option></select></label></div></header><main id="app"></main><script>const mindMap=${mindMap};document.getElementById('title').textContent=mindMap.title||'Mind Map';const sel=document.getElementById('layoutSel');sel.value=mindMap.layout||'top-to-bottom';sel.onchange=()=>render();function render(){document.body.className='layout-'+sel.value; const app=document.getElementById('app'); app.innerHTML=''; const roots=mindMap.nodes.filter(n=>n.parent===null); const wrap=document.createElement('div'); wrap.className='tree-root'; roots.forEach(r=>wrap.appendChild(nodeWrap(r))); app.appendChild(wrap);} function nodeWrap(node){ const outer=document.createElement('div'); outer.className='node-wrap'; outer.appendChild(renderNode(node)); return outer;} function renderNode(node){ const div=document.createElement('div'); div.className='node'; let html='<div><strong>'+esc(node.label || 'Untitled node')+'</strong></div>'; if(node.source_ref) html+='<div class="meta">Source: '+esc(node.source_ref)+'</div>'; if(node.note) html+='<div class="meta">'+esc(node.note)+'</div>'; if(node.url) html+='<div><span class="badge">Link</span><a target="_blank" rel="noopener" href="'+attr(node.url)+'">'+esc(node.url)+'</a></div>'; if(Array.isArray(node.attachedLinks)&&node.attachedLinks.length){ html+='<div class="meta"><strong>Attached links</strong><ul>'+node.attachedLinks.map(l=>'<li><a target="_blank" rel="noopener" href="'+attr(l.url||'')+'">'+esc(l.label||l.url||'Link')+'</a></li>').join('')+'</ul></div>'; } if(Array.isArray(node.attachedDocs)&&node.attachedDocs.length){ html+='<div class="meta"><strong>Documents</strong><ul>'+node.attachedDocs.map(d=>'<li>'+(d.url?'<a target="_blank" rel="noopener" href="'+attr(d.url)+'">'+esc(d.name||d.url)+'</a>':esc(d.name||'Document'))+'</li>').join('')+'</ul></div>'; } if(node.attachedImage){ html+='<img class="thumb" src="'+attr(node.attachedImage)+'" alt="Attached image">'; } div.innerHTML=html; const children=mindMap.nodes.filter(n=>n.parent===node.id); if(children.length){ const child=document.createElement('div'); child.className='children'; children.forEach(c=>child.appendChild(renderNode(c))); div.appendChild(child);} return div;} function esc(s){const d=document.createElement('div'); d.textContent=s ?? ''; return d.innerHTML;} function attr(s){return String(s ?? '').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');} render();</script></body></html>`;
  downloadText("standalone-mind-map.html", html, "text/html");
}
