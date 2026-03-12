
const STORAGE_KEY = 'copilotStudyPayload';

function emptyPayload(){
  return {version:'1.0',source:{origin:'',title:'',authors:[],citation:'',year:'',source_files:[]},summary:{plain:'',key_points:[]},quiz:{title:'',description:'',questions:[]},mind_map:{title:'',layout:'radial',nodes:[{id:'root',label:'Main topic',parent:null,source_ref:'Title',note:'',url:'',attachedLinks:[],attachedDocs:[],attachedImage:null}]}}
}
let payload = loadStoredPayload();

function loadStoredPayload(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : emptyPayload();
  }catch(e){ return emptyPayload(); }
}

function savePayload(obj){
  payload = obj;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  render();
}

function showStatus(msg, ok=true){
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status show ' + (ok ? 'ok' : 'err');
}

function render(){
  document.getElementById('title').textContent = payload.source?.title || 'No payload loaded';
  document.getElementById('authors').textContent = Array.isArray(payload.source?.authors) && payload.source.authors.length ? payload.source.authors.join(', ') : '—';
  document.getElementById('year').textContent = payload.source?.year || '—';
  document.getElementById('origin').textContent = payload.source?.origin || '—';
  document.getElementById('citation').textContent = payload.source?.citation || '—';
  document.getElementById('summary').textContent = payload.summary?.plain || '—';
  const kp = document.getElementById('keyPoints');
  kp.innerHTML = '';
  (payload.summary?.key_points || []).forEach(p => {
    const li = document.createElement('li'); li.textContent = p; kp.appendChild(li);
  });
  if (!(payload.summary?.key_points || []).length){
    const li = document.createElement('li'); li.textContent = 'No key points loaded.'; kp.appendChild(li);
  }
  document.getElementById('preview').textContent = JSON.stringify(payload, null, 2);
}

function normalise(obj){
  const out = emptyPayload();
  if (!obj || typeof obj !== 'object') return out;
  out.version = obj.version || '1.0';
  out.source = {...out.source, ...(obj.source||{})};
  out.source.authors = Array.isArray(out.source.authors) ? out.source.authors : [];
  out.source.source_files = Array.isArray(out.source.source_files) ? out.source.source_files : [];
  out.summary = {...out.summary, ...(obj.summary||{})};
  out.summary.key_points = Array.isArray(out.summary.key_points) ? out.summary.key_points : [];
  out.quiz.title = obj.quiz?.title || ((out.source.title || 'Study') + ' quiz');
  out.quiz.description = obj.quiz?.description || '';
  out.quiz.questions = Array.isArray(obj.quiz?.questions) ? obj.quiz.questions.map(q => ({
    question: q.question || '',
    options: Array.isArray(q.options) ? q.options.slice(0,6).map(String) : ['', '', '', ''],
    correct_index: Number.isInteger(q.correct_index) ? q.correct_index : (Number.isInteger(q.correctIndex) ? q.correctIndex : 0),
    explanation: q.explanation || '',
    source_ref: q.source_ref || ''
  })) : [];
  out.mind_map.title = obj.mind_map?.title || out.source.title || 'Mind map';
  out.mind_map.layout = obj.mind_map?.layout || 'radial';
  out.mind_map.nodes = Array.isArray(obj.mind_map?.nodes) && obj.mind_map.nodes.length ? obj.mind_map.nodes.map((n, i) => ({
    id: n.id || ('node_' + (i+1)),
    label: n.label || 'Untitled node',
    parent: n.parent === undefined ? null : n.parent,
    source_ref: n.source_ref || '',
    note: n.note || '',
    url: n.url || '',
    attachedLinks: Array.isArray(n.attachedLinks) ? n.attachedLinks : [],
    attachedDocs: Array.isArray(n.attachedDocs) ? n.attachedDocs : [],
    attachedImage: n.attachedImage || null
  })) : out.mind_map.nodes;
  if (!out.mind_map.nodes.some(n => n.id === 'root')) out.mind_map.nodes.unshift({id:'root',label:out.mind_map.title,parent:null,source_ref:'Title',note:'',url:'',attachedLinks:[],attachedDocs:[],attachedImage:null});
  return out;
}

document.getElementById('loadBtn').addEventListener('click', () => {
  const raw = document.getElementById('payloadInput').value.trim();
  if (!raw) return showStatus('Paste a JSON payload first.', false);
  try{
    savePayload(normalise(JSON.parse(raw)));
    showStatus('Payload loaded.');
  }catch(e){
    showStatus('Invalid JSON payload.', false);
  }
});
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('payloadInput').value = '';
  savePayload(emptyPayload());
  showStatus('Payload cleared.');
});
document.getElementById('fileInput').addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  try{
    const text = await file.text();
    savePayload(normalise(JSON.parse(text)));
    showStatus('Payload loaded from file.');
  }catch(err){
    showStatus('Could not read JSON file.', false);
  }
});
document.getElementById('openQuiz').addEventListener('click', () => window.open('quiz-tool.html', '_blank'));
document.getElementById('openMind').addEventListener('click', () => window.open('mindmap-tool.html', '_blank'));
document.getElementById('downloadPayload').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'study-payload.json'; a.click(); URL.revokeObjectURL(a.href);
});
render();
