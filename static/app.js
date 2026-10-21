const PROFILE_KEY = 'personalStrokeProfile';
const PREFERENCES_KEY = 'preferenceLog';
const PRIORITY_CATEGORIES_KEY = 'priorityRecognitionCategories';
const TRAINING_IMAGES_KEY = 'trainingSampleImages';
const TRAINING_SKIPPED_KEY = 'onboardingSkipped';
const FORMULA_LIBRARY_KEY = 'formulaLibrary';
const FORMULA_LIBRARY_PROFILES_KEY = 'formulaLibraryStrokeProfiles';
const RECOGNITION_DB = 'FormulaInkRecognition';
const RECOGNITION_DB_VERSION = 3;
const TRAINING_REPETITIONS = 10;
const MAX_PREFERENCES = 500;
const MAX_TRAINING_IMAGE_CHARS = 750 * 1024;

const genericStrokeProfile = {
  '=': [2, 2], '+': [2, 2], '-': [1, 1], '\\times': [2, 2], '\\div': [2, 2],
  '4': [1, 2], A: [2, 3], B: [2, 3], '8': [1, 2], '\\beta': [1, 1], '\\theta': [1, 1],
  '0': [1, 1], '1': [1, 1], l: [1, 1], I: [1, 2], '2': [1, 1], Z: [1, 2],
  '5': [1, 2], S: [1, 1], '6': [1, 1], b: [1, 2], '9': [1, 1], q: [1, 2],
  '\\int': [1, 1], '\\sum': [1, 1], '\\sqrt': [1, 2], '(': [1, 1], ')': [1, 1],
};

const trainingSymbols = [
  ['4', '4/A/beta'], ['A', '4/A/beta'], ['B', 'B/8'], ['8', 'B/8'],
  ['\\beta', '4/A/beta'], ['\\theta', '0/theta'], ['0', '0/theta'], ['1', '1/l/I'],
  ['l', '1/l/I'], ['I', '1/l/I'], ['2', '2/Z'], ['Z', '2/Z'], ['5', '5/S'],
  ['S', '5/S'], ['6', '6/b'], ['b', '6/b'], ['9', '9/q'], ['q', '9/q'],
  ['\\phi', 'phi/theta'], ['\\partial', 'partial/d'], ['\\hbar', 'hbar/h'], ['\\Psi', 'Psi/psi'], ['\\hat{H}', 'H/hat'],
].map(([latex, confusionGroup]) => ({ latex, confusionGroup }));

const tierSymbols = {
  1: ['\\alpha','\\beta','\\gamma','\\delta','\\epsilon','\\theta','\\lambda','\\mu','\\nu','\\xi','\\pi','\\rho','\\sigma','\\tau','\\phi','\\chi','\\psi','\\omega','\\Gamma','\\Delta','\\Theta','\\Lambda','\\Xi','\\Pi','\\Sigma','\\Phi','\\Psi','\\Omega','B','D','O','Q','I','l','S','Z','q','b','d','G', ...'0123456789', '+','-','\\times','\\div','=','\\neq','\\le','\\ge','\\pm','\\cdot','\\oplus','\\int','\\sum','\\sqrt{}','\\partial','\\nabla','\\infty','\\hbar','\\hat{x}','\\vec{x}','\\dot{x}','\\ddot{x}'],
  2: ['\\zeta','\\eta','\\iota','\\kappa','o','\\upsilon','\\Upsilon','\\approx','\\equiv','\\sim','\\propto','\\in','\\notin','\\subset','\\cup','\\cap','\\emptyset','\\forall','\\exists','\\rightarrow','\\leftarrow','\\leftrightarrow','\\Rightarrow','\\Leftrightarrow','\\iint','\\oint','\\prod','\\lim'],
  3: [],
};
const trainingCatalog = Object.entries(tierSymbols).flatMap(([priority, symbols]) => [...new Set(symbols)].map((latex) => ({ latex, priority: Number(priority), category: priority === '1' ? '必訓' : priority === '2' ? '應訓' : '選訓' })));
const customTrainingSymbols = readStorage('customTrainingSymbols', []);
customTrainingSymbols.forEach((latex) => trainingCatalog.push({ latex, priority: 3, category: '選訓' }));

const symbolCatalog = [
  ...['alpha','beta','gamma','delta','epsilon','zeta','eta','theta','iota','kappa','lambda','mu','nu','xi','omicron','pi','rho','sigma','tau','upsilon','phi','chi','psi','omega'].map((name) => ['希臘字母', name, name === 'omicron' ? 'o' : `\\${name}`]),
  ...['Gamma','Delta','Theta','Lambda','Xi','Pi','Sigma','Phi','Psi','Omega'].map((name) => ['希臘字母', name, `\\${name}`]),
  ...[['加號','+'],['減號','-'],['乘號','\\times'],['除號','\\div'],['正負','\\pm'],['點積','\\cdot'],['積分','\\int'],['求和','\\sum'],['乘積','\\prod'],['極限','\\lim'],['根號','\\sqrt{}'],['分數','\\frac{}{}'],['上標','^{}'],['下標','_{}']].map(([name, latex]) => ['運算子', name, latex]),
  ...[['等於','='],['不等於','\\ne'],['約等於','\\approx'],['大於等於','\\ge'],['小於等於','\\le'],['相似','\\sim'],['全等','\\cong'],['正比','\\propto']].map(([name, latex]) => ['關係符', name, latex]),
  ...[['右箭頭','\\rightarrow'],['左箭頭','\\leftarrow'],['上箭頭','\\uparrow'],['下箭頭','\\downarrow'],['雙向箭頭','\\leftrightarrow'],['映射','\\mapsto'],['推出','\\Rightarrow'],['等價','\\Leftrightarrow']].map(([name, latex]) => ['箭頭', name, latex]),
  ...[['屬於','\\in'],['不屬於','\\notin'],['子集','\\subset'],['子集等於','\\subseteq'],['聯集','\\cup'],['交集','\\cap'],['空集','\\emptyset'],['任意','\\forall'],['存在','\\exists'],['邏輯與','\\land'],['邏輯或','\\lor'],['邏輯非','\\neg']].map(([name, latex]) => ['集合與邏輯', name, latex]),
  ...[['偏微分','\\partial'],['梯度','\\nabla'],['散度','\\nabla\\cdot'],['旋度','\\nabla\\times'],['無窮','\\infty'],['極限','\\lim'],['單積分','\\int'],['雙積分','\\iint'],['三重積分','\\iiint'],['閉合積分','\\oint']].map(([name, latex]) => ['微積分', name, latex]),
  ...[['上標','^{}'],['下標','_{}'],['上下標','_{}^{}']].map(([name, latex]) => ['上下標', name, latex]),
  ...[['圓括號','()'],['方括號','[]'],['大括號','\\{\\}'],['絕對值','| |'],['範數','\\lVert \\rVert'],['矩陣','\\begin{matrix}a&b\\\\c&d\\end{matrix}'],['行列式','\\begin{vmatrix}a&b\\\\c&d\\end{vmatrix}']].map(([name, latex]) => ['括號與矩陣', name, latex]),
  ...[['hbar','\\hbar'],['Psi','\\Psi'],['phi','\\phi'],['partial','\\partial'],['hat','\\hat{}'],['vec','\\vec{}'],['dot','\\dot{}'],['ddot','\\ddot{}']].map(([name, latex]) => ['物理常用', name, latex]),
].map(([category, name, latex]) => ({ category, name, latex }));

const seedFormulas = [
  ['尤拉公式', 'e^{i\\pi}+1=0', '複數分析常用'],
  ['牛頓第二定律', 'F=ma', '經典力學'],
  ['薛丁格方程', 'i\\hbar\\frac{\\partial}{\\partial t}\\Psi=\\hat{H}\\Psi', '量子力學'],
  ['馬克士威方程組', '\\begin{aligned}\\nabla\\cdot\\mathbf{E}&=\\frac{\\rho}{\\varepsilon_0}\\\\\\nabla\\cdot\\mathbf{B}&=0\\\\\\nabla\\times\\mathbf{E}&=-\\frac{\\partial\\mathbf{B}}{\\partial t}\\\\\\nabla\\times\\mathbf{B}&=\\mu_0\\mathbf{J}+\\mu_0\\varepsilon_0\\frac{\\partial\\mathbf{E}}{\\partial t}\\end{aligned}', '電磁學'],
  ['高斯散度定理', '\\iiint_V \\nabla\\cdot\\mathbf{F}\\,dV=\\iint_{\\partial V}\\mathbf{F}\\cdot d\\mathbf{S}', '向量微積分'],
  ['傅立葉轉換', '\\mathcal{F}\\{f(t)\\}(\\omega)=\\int_{-\\infty}^{\\infty}f(t)e^{-i\\omega t}dt', '訊號處理'],
  ['泰勒展開', 'f(x)=\\sum_{n=0}^{\\infty}\\frac{f^{(n)}(a)}{n!}(x-a)^n', '微積分'],
  ['矩陣乘法', '(AB)_{ij}=\\sum_{k=1}^{n}A_{ik}B_{kj}', '線性代數'],
  ['二次方程公式', 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}', '代數'],
  ['畢氏定理', 'a^2+b^2=c^2', '幾何'],
  ['分部積分', '\\int u\\,dv=uv-\\int v\\,du', '微積分'],
  ['導數定義', 'f\'(x)=\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}', '微積分'],
  ['二項式定理', '(x+y)^n=\\sum_{k=0}^{n}\\binom{n}{k}x^{n-k}y^k', '代數'],
];

const mainCanvas = document.querySelector('#canvas');
const trainingCanvas = document.querySelector('#trainingCanvas');
const undoButton = document.querySelector('#undoButton');
const trainingUndoButton = document.querySelector('#trainingUndoButton');
const clearButton = document.querySelector('#clearButton');
const trainingClearButton = document.querySelector('#trainingClearButton');
const recognizeButton = document.querySelector('#recognizeButton');
const moreCandidatesButton = document.querySelector('#moreCandidatesButton');
const copyButton = document.querySelector('#copyButton');
const latexField = document.querySelector('#latex');
const preview = document.querySelector('#preview');
const candidatesElement = document.querySelector('#candidates');
const candidateNotice = document.querySelector('#candidateNotice');
const status = document.querySelector('#status');
const strokeCount = document.querySelector('#strokeCount');
const onboarding = document.querySelector('#onboarding');
const recognitionApp = document.querySelector('#recognitionApp');
const trainingSymbol = document.querySelector('#trainingSymbol');
const trainingProgress = document.querySelector('#trainingProgress');
const trainingProgressBar = document.querySelector('#trainingProgressBar');
const finishSampleButton = document.querySelector('#finishSampleButton');
const saveTrainingImages = document.querySelector('#saveTrainingImages');
const settings = document.querySelector('#settings');
const profileView = document.querySelector('#profileView');
const useEditedLatexButton = document.querySelector('#useEditedLatexButton');
const saveFormulaButton = document.querySelector('#saveFormulaButton');
const formulaRecommendations = document.querySelector('#formulaRecommendations');
const sampleRecommendations = document.querySelector('#sampleRecommendations');
const symbolPanel = document.querySelector('#symbolPanel');
const symbolSearch = document.querySelector('#symbolSearch');
const symbolCategories = document.querySelector('#symbolCategories');
const formulaSearch = document.querySelector('#formulaSearch');
const formulaLibraryItems = document.querySelector('#formulaLibraryItems');
const formulaForm = document.querySelector('#formulaForm');
const formulaFormTitle = document.querySelector('#formulaFormTitle');
const formulaId = document.querySelector('#formulaId');
const formulaName = document.querySelector('#formulaName');
const formulaLatex = document.querySelector('#formulaLatex');
const formulaNote = document.querySelector('#formulaNote');
const formulaMemoryManager = document.querySelector('#formulaMemoryManager');
const trainingGeometry = document.querySelector('#trainingGeometry');
const trainingTierButtons = document.querySelector('#trainingTierButtons');
const customTrainingSymbolsPanel = document.querySelector('#customTrainingSymbols');
const sampleStoreStats = document.querySelector('#sampleStoreStats');
const priorityCategories = document.querySelector('#priorityCategories');
const developerNavButton = document.querySelector('#developerNavButton');
const pages = { home: document.querySelector('#homePage'), library: document.querySelector('#libraryPage'), settings: document.querySelector('#settingsPage'), training: document.querySelector('#trainingPage'), developer: document.querySelector('#developerPage') };

let recognitionMode = 'formula';
let lastRecognition = null;
let trainingState = { tier: 1, symbolIndex: 0, sampleIndex: 0, skipped: [], completed: [] };
let showAllCandidates = false;
let editorSelection = { start: 0, end: 0 };
let expandedSymbolCategories = new Set();
const priorityCategoryDefinitions = [
  ['greek', '希臘字母', /^\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|Upsilon)$/],
  ['basic', '一般算術符號', /^(\+|-|\\times|\\div|=)$/],
  ['large', '大型算術符號', /^(\\int|\\sum|\\prod|\\sqrt\{?\}?)$/],
  ['special', '特殊算術符號', /^(\\oplus|\\otimes|\\le|\\ge|\\neq)$/],
  ['latin', '英文與數字', /^[A-Za-z0-9]$/],
];
function prioritySelection() { return readStorage(PRIORITY_CATEGORIES_KEY, []); }
function categoryForSymbol(value) { const normalized = normalizeLatex(value); return priorityCategoryDefinitions.find(([, , test]) => test.test(normalized))?.[0] ?? null; }

function createCanvasState(canvas, onChange) {
  const context = canvas.getContext('2d');
  const state = { strokes: [], activeStroke: null };

  function drawStroke(stroke) {
    if (!stroke.points.length) return;
    context.strokeStyle = '#101820';
    context.fillStyle = '#101820';
    context.lineWidth = 5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    if (stroke.points.length === 1) {
      context.beginPath();
      context.arc(stroke.points[0].x, stroke.points[0].y, 2.5, 0, Math.PI * 2);
      context.fill();
      return;
    }
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.stroke();
  }

  function redraw() {
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    state.strokes.forEach(drawStroke);
  }

  function point(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * canvas.width / bounds.width,
      y: (event.clientY - bounds.top) * canvas.height / bounds.height,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const stroke = { points: [point(event)] };
    state.strokes.push(stroke);
    state.activeStroke = stroke;
    canvas.setPointerCapture(event.pointerId);
    redraw();
    onChange(state);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!state.activeStroke) return;
    state.activeStroke.points.push(point(event));
    redraw();
  });
  function endStroke() {
    if (!state.activeStroke) return;
    state.activeStroke = null;
    redraw();
    onChange(state);
  }
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  redraw();

  return {
    state,
    redraw,
    clear() { state.strokes = []; state.activeStroke = null; redraw(); onChange(state); },
    undo() { if (state.strokes.length) { state.strokes.pop(); redraw(); onChange(state); } },
    image() { return canvas.toDataURL('image/png'); },
  };
}

const mainDrawing = createCanvasState(mainCanvas, () => {
  undoButton.disabled = !mainDrawing.state.strokes.length;
  strokeCount.textContent = `${mainDrawing.state.strokes.length} 筆`;
  if (lastRecognition) {
    lastRecognition = null;
    moreCandidatesButton.disabled = true;
  }
});
const trainingDrawing = createCanvasState(trainingCanvas, () => {
  trainingUndoButton.disabled = !trainingDrawing.state.strokes.length;
  if (trainingDrawing.state.strokes.length) trainingGeometry.textContent = geometryLabel(featuresFor(trainingDrawing, trainingCanvas).geometry);
});
const developerCanvas = document.querySelector('#developerCanvas');
const developerSymbol = document.querySelector('#developerSymbol');
const developerVariant = document.querySelector('#developerVariant');
const developerProgress = document.querySelector('#developerProgress');
const developerStats = document.querySelector('#developerStats');
const rewriteSymbolList = document.querySelector('#rewriteSymbolList');
const rewriteManualSymbols = document.querySelector('#rewriteManualSymbols');
const rewriteStatus = document.querySelector('#rewriteStatus');
const rewriteSummary = document.querySelector('#rewriteSummary');
const resumeRewriteButton = document.querySelector('#resumeRewriteButton');
const cleanupPreview = document.querySelector('#cleanupPreview');
const cleanupStatus = document.querySelector('#cleanupStatus');
const confirmCleanupButton = document.querySelector('#confirmCleanupButton');
const undoCleanupButton = document.querySelector('#undoCleanupButton');
const rewriteDefaults = ['\\delta', '\\mu', '\\pi', '\\sigma', '\\tau', '\\phi', '\\Pi', '\\Sigma', '\\Psi', 'G'];
let rewriteState = null;
const developerDrawing = createCanvasState(developerCanvas, () => {
  document.querySelector('#developerUndoButton').disabled = !developerDrawing.state.strokes.length;
});

function gridFor(point, canvas) {
  const column = Math.min(2, Math.floor(point.x / (canvas.width / 3)));
  const row = Math.min(2, Math.floor(point.y / (canvas.height / 3)));
  return row * 3 + column;
}

function featuresFor(drawing, canvas) {
  const hints = drawing.state.strokes.map((stroke) => {
    const start = stroke.points[0];
    const end = stroke.points.at(-1);
    return `${gridFor(start, canvas)}>${gridFor(end, canvas)}`;
  });
  return {
    strokeCount: drawing.state.strokes.length,
    startEndHints: hints,
    inputSignature: `${drawing.state.strokes.length}|${hints.join(',')}`,
    geometry: geometryFeatures(drawing.state.strokes, canvas),
  };
}

function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }

function resamplePoints(points, count = 32) {
  if (points.length < 2) return points;
  const distances = [0];
  for (let index = 1; index < points.length; index += 1) distances.push(distances[index - 1] + Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y));
  const length = distances.at(-1);
  if (!length) return points;
  return Array.from({ length: count }, (_, index) => {
    const target = length * index / (count - 1);
    let right = distances.findIndex((distance) => distance >= target);
    if (right < 1) right = 1;
    const left = right - 1; const span = distances[right] - distances[left] || 1;
    const ratio = (target - distances[left]) / span;
    return { x: points[left].x + (points[right].x - points[left].x) * ratio, y: points[left].y + (points[right].y - points[left].y) * ratio };
  });
}

function geometryFeatures(strokes, canvas) {
  const scale = Math.hypot(canvas.width, canvas.height) || 1;
  const turnHistogram = Array(12).fill(0); let turnCount = 0; let maxTurningAngle = 0; const curvatures = [];
  let closedLoops = 0; let nearLoops = 0; let tailLength = 0; let totalLength = 0; const endpoints = [];
  strokes.forEach((stroke) => {
    const points = resamplePoints(stroke.points); if (!points.length) return;
    const first = points[0]; const last = points.at(-1);
    endpoints.push({ start: gridFor(first, canvas), end: gridFor(last, canvas), direction: Math.round(((Math.atan2(last.y - first.y, last.x - first.x) + Math.PI) / (2 * Math.PI)) * 8) % 8 });
    let length = 0;
    for (let index = 1; index < points.length; index += 1) length += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
    totalLength += length; tailLength += points.slice(-7).reduce((sum, point, index, array) => index ? sum + Math.hypot(point.x - array[index - 1].x, point.y - array[index - 1].y) : sum, 0);
    const endpointDistance = Math.hypot(last.x - first.x, last.y - first.y);
    if (length > scale * .08 && endpointDistance < Math.max(12, length * .16)) closedLoops += 1;
    else if (length > scale * .08 && endpointDistance < Math.max(20, length * .31)) nearLoops += 1;
    for (let index = 1; index < points.length - 1; index += 1) {
      const a = Math.atan2(points[index].y - points[index - 1].y, points[index].x - points[index - 1].x);
      const b = Math.atan2(points[index + 1].y - points[index].y, points[index + 1].x - points[index].x);
      const change = Math.atan2(Math.sin(b - a), Math.cos(b - a)); const absolute = Math.abs(change);
      turnHistogram[Math.min(11, Math.floor((change + Math.PI) / (2 * Math.PI) * 12))] += 1;
      if (absolute > Math.PI / 7) turnCount += 1;
      maxTurningAngle = Math.max(maxTurningAngle, absolute);
      const step = Math.hypot(points[index + 1].x - points[index].x, points[index + 1].y - points[index].y) || 1;
      curvatures.push(absolute / step * scale);
    }
  });
  const meanCurvature = curvatures.reduce((sum, value) => sum + value, 0) / Math.max(curvatures.length, 1);
  const curvatureVariance = curvatures.reduce((sum, value) => sum + (value - meanCurvature) ** 2, 0) / Math.max(curvatures.length, 1);
  const lastEndpoint = endpoints.at(-1); const tailRatio = tailLength / Math.max(totalLength, 1);
  return { turnHistogram, turnCount, maxTurningAngle, meanCurvature, curvatureVariance, closedLoops, nearLoops, hasTail: tailRatio > .14, tailDirection: lastEndpoint?.direction ?? 0, tailRatio, endpoints };
}

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let recognitionDbPromise;
function recognitionDb() {
  if (recognitionDbPromise) return recognitionDbPromise;
  recognitionDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(RECOGNITION_DB, RECOGNITION_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('samples')) { const samples = db.createObjectStore('samples', { keyPath: 'id', autoIncrement: true }); samples.createIndex('symbol', 'symbol'); samples.createIndex('strokeCount', 'strokeCount'); }
      if (!db.objectStoreNames.contains('symbolProfiles')) db.createObjectStore('symbolProfiles', { keyPath: 'symbol' });
      if (!db.objectStoreNames.contains('trainingState')) db.createObjectStore('trainingState', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('rewriteDrafts')) db.createObjectStore('rewriteDrafts', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('cleanupBackups')) db.createObjectStore('cleanupBackups', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  return recognitionDbPromise;
}
async function dbPut(storeName, value) { const db = await recognitionDb(); return new Promise((resolve, reject) => { const request = db.transaction(storeName, 'readwrite').objectStore(storeName).put(value); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
async function dbDelete(storeName, key) { const db = await recognitionDb(); return new Promise((resolve, reject) => { const request = db.transaction(storeName, 'readwrite').objectStore(storeName).delete(key); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); }
async function dbGet(storeName, key) { const db = await recognitionDb(); return new Promise((resolve, reject) => { const request = db.transaction(storeName).objectStore(storeName).get(key); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
async function dbAll(storeName) { const db = await recognitionDb(); return new Promise((resolve, reject) => { const request = db.transaction(storeName).objectStore(storeName).getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }

function normalizedRaster(canvas, size = 96) {
  const source = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height); const pixels = source.data;
  let left = canvas.width; let top = canvas.height; let right = -1; let bottom = -1;
  for (let y = 0; y < canvas.height; y += 1) for (let x = 0; x < canvas.width; x += 1) if (pixels[(y * canvas.width + x) * 4] < 220) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
  const output = document.createElement('canvas'); output.width = size; output.height = size; const context = output.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, size, size);
  if (right < left) return { gray: new Uint8Array(size * size).fill(255), edges: new Uint8Array(size * size), image: output.toDataURL('image/png') };
  const padding = 8; const width = right - left + 1; const height = bottom - top + 1; const ratio = Math.min((size - padding * 2) / width, (size - padding * 2) / height);
  context.drawImage(canvas, left, top, width, height, (size - width * ratio) / 2, (size - height * ratio) / 2, width * ratio, height * ratio);
  const data = context.getImageData(0, 0, size, size).data; const gray = new Uint8Array(size * size); const edges = new Uint8Array(size * size);
  for (let index = 0; index < gray.length; index += 1) gray[index] = Math.round(.299 * data[index * 4] + .587 * data[index * 4 + 1] + .114 * data[index * 4 + 2]);
  for (let y = 1; y < size - 1; y += 1) for (let x = 1; x < size - 1; x += 1) { const i = y * size + x; const gx = gray[i + 1] - gray[i - 1]; const gy = gray[i + size] - gray[i - size]; edges[i] = clamp(Math.hypot(gx, gy), 0, 255); }
  return { gray, edges, image: output.toDataURL('image/png') };
}

function geometrySimilarity(first, second) {
  const closeness = (a, b, scale = 1) => Math.exp(-Math.abs(a - b) / Math.max(scale, .001));
  const histogram = first.turnHistogram.reduce((sum, value, index) => sum + Math.min(value, second.turnHistogram[index] || 0), 0) / Math.max(first.turnHistogram.reduce((sum, value) => sum + value, 0), second.turnHistogram.reduce((sum, value) => sum + value, 0), 1);
  const turns = closeness(first.turnCount, second.turnCount, 4) * .5 + closeness(first.maxTurningAngle, second.maxTurningAngle, .7) * .5;
  const curvature = closeness(first.meanCurvature, second.meanCurvature, 2) * .6 + closeness(first.curvatureVariance, second.curvatureVariance, 5) * .4;
  const loops = (first.closedLoops === second.closedLoops ? .7 : 0) + (first.nearLoops === second.nearLoops ? .3 : 0);
  const tail = (first.hasTail === second.hasTail ? .6 : 0) + closeness(first.tailRatio, second.tailRatio, .12) * .4;
  const endpoints = first.endpoints.length === second.endpoints.length ? first.endpoints.reduce((sum, point, index) => sum + ((point.start === second.endpoints[index]?.start ? .4 : 0) + (point.end === second.endpoints[index]?.end ? .4 : 0) + (point.direction === second.endpoints[index]?.direction ? .2 : 0)), 0) / Math.max(first.endpoints.length, 1) : 0;
  return .30 * (.5 * histogram + .5 * turns) + .20 * curvature + .20 * loops + .15 * tail + .15 * endpoints;
}

function normalizeLatex(value) {
  return value.trim().replace(/^\$+|\$+$/g, '').replace(/\s+/g, '');
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureFormulaLibrary() {
  if (localStorage.getItem(FORMULA_LIBRARY_KEY)) return;
  writeStorage(FORMULA_LIBRARY_KEY, seedFormulas.map(([name, latex, note]) => ({
    id: makeId(), name, latex, note, createdAt: Date.now(), updatedAt: Date.now(),
  })));
}

function formulaLibrary() {
  ensureFormulaLibrary();
  return readStorage(FORMULA_LIBRARY_KEY, []);
}

function formulaProfiles() {
  return readStorage(FORMULA_LIBRARY_PROFILES_KEY, {});
}

function rememberEditorSelection() {
  editorSelection = { start: latexField.selectionStart, end: latexField.selectionEnd };
}

function insertAtCursor(value) {
  const start = document.activeElement === latexField ? latexField.selectionStart : editorSelection.start;
  const end = document.activeElement === latexField ? latexField.selectionEnd : editorSelection.end;
  latexField.setRangeText(value, start, end, 'end');
  const cursor = start + value.length;
  latexField.focus();
  latexField.setSelectionRange(cursor, cursor);
  rememberEditorSelection();
  updatePreview();
  status.textContent = '已插入 LaTeX，可繼續編輯。';
}

function insertLibraryFormula(value) {
  insertAtCursor(value);
  showPage('home');
}

function renderLatex(value, target) {
  target.textContent = '';
  if (!value) { target.textContent = '尚未辨識'; return; }
  katex.render(value, target, { displayMode: true, throwOnError: false });
}

function updatePreview() {
  renderLatex(latexField.value, preview);
  const usable = Boolean(latexField.value.trim());
  copyButton.disabled = !usable;
  useEditedLatexButton.disabled = !usable;
  saveFormulaButton.disabled = !usable;
}

function currentProfile() {
  return readStorage(PROFILE_KEY, {});
}

function candidateRange(candidate) {
  const key = normalizeLatex(candidate);
  const personal = currentProfile()[key];
  if (personal?.strokeRange) return personal.strokeRange;
  if (personal?.strokeCounts?.length) {
    return { min: Math.min(...personal.strokeCounts), max: Math.max(...personal.strokeCounts) };
  }
  const generic = genericStrokeProfile[key];
  return generic ? { min: generic[0], max: generic[1] } : null;
}

function lcsLength(first, second) {
  const table = Array.from({ length: first.length + 1 }, () => Array(second.length + 1).fill(0));
  for (let row = 1; row <= first.length; row += 1) {
    for (let column = 1; column <= second.length; column += 1) {
      table[row][column] = first[row - 1] === second[column - 1]
        ? table[row - 1][column - 1] + 1
        : Math.max(table[row - 1][column], table[row][column - 1]);
    }
  }
  return table[first.length][second.length];
}

function featureSimilarity(current, stored) {
  const difference = Math.abs(current.strokeCount - stored.strokeCount);
  if (difference > 1) return 0;
  const largest = Math.max(current.strokeCount, stored.strokeCount, 1);
  const strokeScore = 1 - difference / largest;
  const overlap = lcsLength(current.startEndHints, stored.startEndHints);
  const hintScore = (2 * overlap) / Math.max(current.startEndHints.length + stored.startEndHints.length, 1);
  const score = 0.4 * strokeScore + 0.6 * hintScore;
  return score >= 0.55 ? score : 0;
}

function preferenceScore(candidate, features, mode = recognitionMode) {
  const normalized = normalizeLatex(candidate);
  const now = Date.now();
  return readStorage(PREFERENCES_KEY, []).reduce((score, entry) => {
    if (entry.mode !== mode || normalizeLatex(entry.chosenLatex) !== normalized) return score;
    const similarity = featureSimilarity(features, entry);
    const ageDays = Math.max(0, now - entry.timestamp) / 86_400_000;
    return score + similarity ** 2 * Math.exp(-ageDays / 90);
  }, 0);
}

function sortedFormulaCandidates(candidates, features) {
  return candidates
    .map((candidate, index) => ({ candidate, index, score: preferenceScore(candidate, features) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ candidate }) => candidate);
}

function sortedSymbolCandidates(candidates, features) {
  const total = Math.max(candidates.length, 1);
  return candidates
    .map((candidate, index) => {
      const modelScore = (total - index) / total;
      const preference = 1 - Math.exp(-preferenceScore(candidate, features, 'symbol'));
      return { candidate, index, score: 0.8 * modelScore + 0.2 * preference };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ candidate }) => candidate);
}

function profileGeometryScore(features, profile) {
  const samples = profile?.geometry ?? []; if (samples.length < 4) return { score: 0, reliability: 0 };
  const best = Math.max(...samples.map((sample) => geometrySimilarity(features.geometry, sample)));
  const base = clamp((samples.length - 3) / 7, 0, 1);
  return { score: best, reliability: samples.length < 10 ? base : samples.length < 20 ? .5 : 1 };
}

function rasterSimilarity(current, sample) {
  let pixelDifference = 0; let edgeDifference = 0;
  for (let index = 0; index < current.gray.length; index += 1) { pixelDifference += Math.abs(current.gray[index] - sample.gray[index]); edgeDifference += Math.abs(current.edges[index] - sample.edges[index]); }
  return .7 * (1 - pixelDifference / (255 * current.gray.length)) + .3 * (1 - edgeDifference / (255 * current.edges.length));
}

async function retrieveSampleMatches(canvas, features) {
  const current = normalizedRaster(canvas); const samples = await dbAll('samples');
  return samples.filter((sample) => Math.abs(sample.strokeCount - features.strokeCount) <= 1).map((sample) => ({ sample, score: rasterSimilarity(current, sample) * .7 + geometrySimilarity(features.geometry, sample.geometry) * .3 })).sort((left, right) => right.score - left.score).slice(0, 5);
}

function displaySampleRecommendation(matches) {
  sampleRecommendations.innerHTML = ''; if (!matches?.length) return;
  const counts = matches.reduce((all, { sample }) => ({ ...all, [sample.symbol]: (all[sample.symbol] ?? 0) + 1 }), {});
  const [symbol, count] = Object.entries(counts).sort((left, right) => right[1] - left[1])[0]; if (count < 3) return;
  const block = document.createElement('button'); block.type = 'button'; block.className = 'recommendation-card';
  block.textContent = `樣本推薦：${symbol}（前 5 名中 ${count} 筆相符）`;
  block.addEventListener('click', () => chooseCandidate(symbol)); sampleRecommendations.append(block);
}

async function enhanceSymbolCandidates(candidates, features) {
  const profiles = await dbAll('symbolProfiles'); const profileBySymbol = Object.fromEntries(profiles.map((profile) => [normalizeLatex(profile.symbol), profile]));
  const priorities = prioritySelection();
  return candidates.map((candidate, index) => {
    const geometry = profileGeometryScore(features, profileBySymbol[normalizeLatex(candidate)]);
    const model = (candidates.length - index) / Math.max(candidates.length, 1); const preference = 1 - Math.exp(-preferenceScore(candidate, features, 'symbol'));
    const rank = priorities.indexOf(categoryForSymbol(candidate)); const priorityBoost = rank < 0 ? 0 : .7 * (priorities.length - rank) / priorities.length;
    const supplemental = lastRecognition?.supplemental?.[normalizeLatex(candidate)] ?? 0;
    return { candidate, index, score: .8 * model + .2 * preference + .45 * geometry.reliability * geometry.score + priorityBoost + supplemental, geometry };
  }).sort((left, right) => right.score - left.score || left.index - right.index).map(({ candidate }) => candidate);
}

function candidateStrokeHint(candidate, features) {
  const range = candidateRange(candidate);
  if (!range) return `你寫了 ${features.strokeCount} 筆；尚無筆畫參考資料。`;
  const typical = range.min === range.max ? `${range.min}` : `${range.min}–${range.max}`;
  const differs = features.strokeCount < range.min || features.strokeCount > range.max;
  return { text: `你寫了 ${features.strokeCount} 筆；典型為 ${typical} 筆${differs ? '（不同）' : ''}。`, differs };
}

function addFormulaProfile(formulaIdValue, features) {
  if (!features?.strokeCount) return;
  const profiles = formulaProfiles();
  const samples = profiles[formulaIdValue] ?? [];
  const sample = { strokeCount: features.strokeCount, startEndHints: features.startEndHints, timestamp: Date.now() };
  samples.push(sample);
  profiles[formulaIdValue] = samples.slice(-50);
  writeStorage(FORMULA_LIBRARY_PROFILES_KEY, profiles);
  const updatedLibrary = formulaLibrary().map((formula) => formula.id === formulaIdValue
    ? { ...formula, strokeSamples: [...(formula.strokeSamples ?? []), sample].slice(-50) }
    : formula);
  writeStorage(FORMULA_LIBRARY_KEY, updatedLibrary);
}

function recordLibraryProfiles(chosenLatex, features) {
  formulaLibrary()
    .filter((formula) => normalizeLatex(formula.latex) === normalizeLatex(chosenLatex))
    .forEach((formula) => addFormulaProfile(formula.id, features));
}

function librarySuggestions(features) {
  const profiles = formulaProfiles();
  return formulaLibrary()
    .map((formula) => ({
      formula,
      score: (profiles[formula.id] ?? formula.strokeSamples ?? []).reduce((sum, sample) => sum + featureSimilarity(features, sample), 0),
    }))
    .filter(({ score }) => score >= 0.55)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

function displayLibrarySuggestions(features) {
  formulaRecommendations.innerHTML = '';
  if (recognitionMode !== 'formula') return;
  const suggestions = librarySuggestions(features);
  if (!suggestions.length) return;
  const heading = document.createElement('p');
  heading.className = 'recommendation-heading';
  heading.textContent = '常用公式庫推薦（筆跡特徵相近）';
  formulaRecommendations.append(heading);
  suggestions.forEach(({ formula }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'recommendation-card';
    const title = document.createElement('strong');
    title.textContent = formula.name;
    const rendered = document.createElement('span');
    rendered.className = 'candidate-preview';
    renderLatex(formula.latex, rendered);
    button.append(title, rendered);
    button.addEventListener('click', () => insertLibraryFormula(formula.latex));
    formulaRecommendations.append(button);
  });
}

function displayCandidates(candidates, notice, selected) {
  candidatesElement.innerHTML = '';
  candidateNotice.textContent = notice;
  const displayedCandidates = showAllCandidates ? candidates : candidates.slice(0, 5);
  displayedCandidates.forEach((candidate) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `candidate${normalizeLatex(candidate) === normalizeLatex(selected) ? ' selected' : ''}`;
    const formula = document.createElement('span');
    formula.className = 'candidate-preview';
    renderLatex(candidate, formula);
    button.title = candidate;
    button.append(formula);
    if (lastRecognition?.supplemental?.[normalizeLatex(candidate)]) { const source = document.createElement('span'); source.className = 'candidate-meta'; source.textContent = '根據你的樣本補充'; button.append(source); }
    if (recognitionMode === 'symbol' && lastRecognition?.features) {
      const hint = candidateStrokeHint(candidate, lastRecognition.features);
      const meta = document.createElement('span');
      meta.className = `candidate-meta${hint.differs ? ' mismatch' : ''}`;
      meta.textContent = typeof hint === 'string' ? hint : hint.text;
      button.append(meta);
    }
    button.addEventListener('click', () => chooseCandidate(candidate));
    candidatesElement.append(button);
  });
  if (!showAllCandidates && candidates.length > 5) {
    const showMore = document.createElement('button');
    showMore.type = 'button';
    showMore.className = 'secondary';
    showMore.textContent = `顯示其餘 ${candidates.length - 5} 個候選`;
    showMore.addEventListener('click', () => {
      showAllCandidates = true;
      displayCandidates(candidates, notice, selected);
    });
    candidatesElement.append(showMore);
  }
}

function recordPreference(chosenLatex) {
  const features = lastRecognition?.features ?? featuresFor(mainDrawing, mainCanvas);
  if (!features.strokeCount) return;
  const log = readStorage(PREFERENCES_KEY, []);
  log.push({
    mode: recognitionMode,
    strokeCount: features.strokeCount,
    startEndHints: features.startEndHints,
    inputSignature: features.inputSignature,
    chosenLatex,
    timestamp: Date.now(),
  });
  writeStorage(PREFERENCES_KEY, log.slice(-MAX_PREFERENCES));
  if (recognitionMode === 'formula') recordLibraryProfiles(chosenLatex, features);
}

function chooseCandidate(candidate) {
  latexField.value = candidate;
  updatePreview();
  recordPreference(candidate);
  if (lastRecognition) displayCandidates(lastRecognition.visibleCandidates, '已記住你的選擇。', candidate);
  status.textContent = '已更新結果並儲存本機偏好。';
}

async function applyCandidates(rawCandidates, response, extra = false) {
  const features = lastRecognition?.features ?? featuresFor(mainDrawing, mainCanvas);
  const merged = [...new Set([...(lastRecognition?.rawCandidates ?? []), ...rawCandidates])];
  let visible = merged;
  let notice = '選擇正確的辨識結果。';
  if (recognitionMode === 'symbol') {
    const profiles = await dbAll('symbolProfiles');
    const compatible = merged.filter((candidate) => {
      const profile = profiles.find((entry) => normalizeLatex(entry.symbol) === normalizeLatex(candidate));
      if (!profile) return true;
      const strokeCompatible = !profile.strokeRange || (features.strokeCount >= profile.strokeRange.min && features.strokeCount <= profile.strokeRange.max);
      const endpointCompatible = !(profile.startEndHints ?? []).length || profile.startEndHints.some((hints) => {
        if (hints.length !== features.startEndHints.length) return false;
        const matching = hints.filter((hint, index) => hint === features.startEndHints[index]).length;
        return matching >= Math.ceil(hints.length * .6);
      });
      return strokeCompatible && endpointCompatible;
    });
    const matches = await retrieveSampleMatches(mainCanvas, features);
    const counts = matches.reduce((all, item) => ({ ...all, [item.sample.symbol]: (all[item.sample.symbol] ?? { count: 0, score: 0 }), [item.sample.symbol]: { count: (all[item.sample.symbol]?.count ?? 0) + 1, score: (all[item.sample.symbol]?.score ?? 0) + item.score } }), {});
    const priorities = prioritySelection(); const modelHasPriority = merged.some((candidate) => priorities.includes(categoryForSymbol(candidate)));
    const supplemental = {};
    Object.entries(counts).forEach(([symbol, value]) => { const required = priorities.length ? 2 : 3; if (value.count >= required && !merged.some((candidate) => normalizeLatex(candidate) === normalizeLatex(symbol)) && (!priorities.length || !modelHasPriority)) supplemental[normalizeLatex(symbol)] = .25 + value.score / Math.max(value.count, 1) * .35; });
    const expanded = [...new Set([...(compatible.length ? compatible : merged), ...Object.keys(supplemental)])];
    lastRecognition = { ...(lastRecognition ?? {}), features, supplemental };
    visible = await enhanceSymbolCandidates(expanded, features);
    notice = compatible.length ? '已依筆畫規則與可信幾何特徵重排候選。' : '筆畫規則未找到相符候選，已保留模型結果並以幾何特徵排序。';
    displaySampleRecommendation(matches);
  } else {
    visible = sortedFormulaCandidates(merged, features);
    notice = '已依相近筆跡的本機偏好排序候選。';
  }
  lastRecognition = { ...lastRecognition, image: lastRecognition?.image, features, rawCandidates: merged, visibleCandidates: visible };
  if (!extra) showAllCandidates = false;
  const chosen = visible[0] ?? '';
  latexField.value = chosen;
  updatePreview();
  displayCandidates(visible, notice, chosen);
  displayLibrarySuggestions(features);
  moreCandidatesButton.disabled = !lastRecognition.image || extra && rawCandidates.length < 2;
  const time = response ? `本次 ${response.timingsMs.length} 次採樣共 ${(response.totalMs / 1000).toFixed(2)} 秒。` : '';
  status.textContent = `${notice} ${time}`.trim();
}

async function requestRecognition(samples, extra = false) {
  const features = featuresFor(mainDrawing, mainCanvas);
  if (!features.strokeCount) { status.textContent = '請先手寫公式或符號。'; return; }
  const image = lastRecognition?.image ?? mainDrawing.image();
  lastRecognition = { ...(lastRecognition ?? {}), image, features, rawCandidates: lastRecognition?.rawCandidates ?? [] };
  recognizeButton.disabled = true;
  moreCandidatesButton.disabled = true;
  status.textContent = extra ? '正在取得更多候選…' : '辨識中…';
  try {
    const response = await fetch('/api/recognize', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image, samples }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || '辨識失敗');
    await applyCandidates(result.candidates, result, extra);
  } catch (error) {
    status.textContent = error.message;
  } finally {
    recognizeButton.disabled = false;
    moreCandidatesButton.disabled = !lastRecognition?.image;
  }
}

function resetRecognition() {
  mainDrawing.clear();
  lastRecognition = null;
  showAllCandidates = false;
  latexField.value = '';
  updatePreview();
  candidatesElement.innerHTML = '';
  formulaRecommendations.innerHTML = '';
  sampleRecommendations.innerHTML = '';
  candidateNotice.textContent = '辨識後可在這裡切換結果。';
  status.textContent = '';
  moreCandidatesButton.disabled = true;
}

function geometryLabel(geometry) { return `轉折 ${geometry.turnCount}、最大轉角 ${(geometry.maxTurningAngle * 180 / Math.PI).toFixed(0)}°、曲率 ${geometry.meanCurvature.toFixed(2)}、封閉 ${geometry.closedLoops}/${geometry.nearLoops}、尾端 ${geometry.hasTail ? '有' : '無'}。`; }

function profileFromSamples(symbol, samples) {
  if (!samples.length) return;
  const counts = samples.map((sample) => sample.strokeCount); const geometry = samples.map((sample) => sample.geometry);
  return { symbol, sampleCount: samples.length, strokeCounts: [...new Set(counts)].sort((a, b) => a - b), strokeRange: { min: Math.min(...counts), max: Math.max(...counts) }, startEndHints: samples.map((sample) => sample.startEndHints), geometry, updatedAt: Date.now() };
}

async function updateSymbolProfile(symbol) {
  const samples = (await dbAll('samples')).filter((sample) => sample.symbol === symbol);
  const profile = profileFromSamples(symbol, samples);
  if (profile) await dbPut('symbolProfiles', profile);
}

async function trainingSampleCount() { return (await dbAll('samples')).length; }

async function trainingModelCheck(image) {
  try {
    const response = await fetch('/api/recognize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image, samples: 1 }) });
    if (!response.ok) return '';
    return (await response.json()).primary || '';
  } catch { return ''; }
}

async function updateTrainingScreen() {
  const catalog = trainingCatalog.filter((item) => item.priority === trainingState.tier && !trainingState.skipped.includes(item.latex));
  const target = catalog[trainingState.symbolIndex];
  if (!target) { onboarding.hidden = true; showPage('home'); return; }
  renderLatex(target.latex, trainingSymbol);
  const total = catalog.length * TRAINING_REPETITIONS;
  const tierStats = await Promise.all([1, 2, 3].map(async (tier) => { const symbols = trainingCatalog.filter((item) => item.priority === tier); const samples = await dbAll('samples'); return `第${tier}級 ${symbols.filter((item) => samples.some((sample) => sample.symbol === item.latex)).length}/${symbols.length}`; }));
  trainingProgress.textContent = `第${trainingState.tier}級｜第 ${trainingState.symbolIndex + 1} / ${catalog.length} 個符號，第 ${trainingState.sampleIndex + 1} / ${TRAINING_REPETITIONS} 筆；${tierStats.join('，')}`;
  trainingProgressBar.style.width = `${((trainingState.symbolIndex * TRAINING_REPETITIONS + trainingState.sampleIndex) / total) * 100}%`;
  trainingGeometry.textContent = '寫完後會在這裡顯示幾何特徵。'; trainingDrawing.clear();
  trainingTierButtons.querySelectorAll('button').forEach((button) => { button.classList.toggle('secondary', Number(button.dataset.tier) !== trainingState.tier); });
  customTrainingSymbolsPanel.hidden = trainingState.tier !== 3;
}

async function finishTrainingSample() {
  const features = featuresFor(trainingDrawing, trainingCanvas);
  if (!features.strokeCount) { trainingGeometry.textContent = '請先寫下目前的符號。'; return; }
  const catalog = trainingCatalog.filter((item) => item.priority === trainingState.tier && !trainingState.skipped.includes(item.latex)); const target = catalog[trainingState.symbolIndex]; const raster = normalizedRaster(trainingCanvas);
  trainingGeometry.textContent = '正在儲存特徵並檢查模型候選…';
  const modelCandidate = await trainingModelCheck(trainingDrawing.image());
  await dbPut('samples', { symbol: target.latex, category: target.category, modelCandidate, strokeCount: features.strokeCount, startEndHints: features.startEndHints, geometry: features.geometry, gray: raster.gray, edges: raster.edges, thumbnail: raster.image, createdAt: Date.now() });
  await updateSymbolProfile(target.latex);
  const correct = modelCandidate ? normalizeLatex(modelCandidate) === normalizeLatex(target.latex) : null;
  trainingGeometry.textContent = `已儲存 ${target.latex}：${geometryLabel(features.geometry)}${correct === null ? ' 模型檢查暫不可用。' : ` 模型首選 ${modelCandidate}（${correct ? '正確' : '與目標不同'}）。`}`;
  trainingState.sampleIndex += 1;
  if (trainingState.sampleIndex >= TRAINING_REPETITIONS) { trainingState.completed.push(target.latex); trainingState.symbolIndex += 1; trainingState.sampleIndex = 0; }
  await dbPut('trainingState', { id: 'default', ...trainingState, updatedAt: Date.now() });
  window.setTimeout(() => updateTrainingScreen(), 700);
}

async function startTraining() {
  const saved = await dbGet('trainingState', 'default');
  trainingState = saved ? { tier: saved.tier ?? 1, symbolIndex: saved.symbolIndex, sampleIndex: saved.sampleIndex, skipped: saved.skipped ?? [], completed: saved.completed ?? [] } : { tier: 1, symbolIndex: 0, sampleIndex: 0, skipped: [], completed: [] };
  onboarding.hidden = false; showPage('training'); await updateTrainingScreen();
}

function updateProfileView() {
  const profile = currentProfile();
  profileView.innerHTML = '';
  if (!Object.keys(profile).length) { profileView.textContent = '尚未完成個人化訓練；目前使用通用筆畫表。'; return; }
  Object.entries(profile).forEach(([latex, entry]) => {
    const item = document.createElement('article'); item.className = 'profile-item';
    const rendered = document.createElement('span'); rendered.className = 'candidate-preview'; renderLatex(latex, rendered);
    const range = entry.strokeRange ?? { min: Math.min(...entry.strokeCounts), max: Math.max(...entry.strokeCounts) };
    const label = document.createElement('p'); label.textContent = range.min === range.max ? `${range.min} 筆` : `${range.min}–${range.max} 筆`;
    item.append(rendered, label); profileView.append(item);
  });
}

function showPage(pageName) {
  Object.entries(pages).forEach(([name, page]) => { page.hidden = name !== pageName; });
  document.querySelectorAll('.nav-button').forEach((button) => button.classList.toggle('active', button.dataset.page === pageName));
  if (pageName === 'library') renderFormulaLibrary();
  if (pageName === 'settings') { updateProfileView(); renderFormulaMemoryManager(); updateSampleStoreStats(); renderPriorityCategories(); }
  if (pageName === 'developer') { updateDeveloperStats(); renderRewriteSymbols(); }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderFormulaMemoryManager() {
  const remembered = readStorage('formulaMemory', []);
  formulaMemoryManager.innerHTML = '<h2 class="section-title">已記住的公式</h2>';
  if (!remembered.length) { formulaMemoryManager.insertAdjacentHTML('beforeend', '<p>尚未儲存公式記憶。</p>'); return; }
  remembered.forEach((memory, index) => {
    const row = document.createElement('article'); row.className = 'memory-entry';
    const content = document.createElement('div'); content.className = 'memory-entry-preview';
    const name = document.createElement('strong'); name.textContent = memory.name || `公式 ${index + 1}`;
    const formula = document.createElement('div'); renderLatex(memory.latex, formula);
    content.append(name, formula);
    const actions = document.createElement('div'); actions.className = 'memory-entry-actions';
    const load = document.createElement('button'); load.type = 'button'; load.className = 'secondary'; load.textContent = '載入'; load.addEventListener('click', () => { latexField.value = memory.latex; updatePreview(); showPage('home'); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'secondary'; remove.textContent = '刪除'; remove.addEventListener('click', () => { remembered.splice(index, 1); writeStorage('formulaMemory', remembered); renderFormulaMemoryManager(); });
    actions.append(load, remove); row.append(content, actions); formulaMemoryManager.append(row);
  });
}

async function updateDeveloperStats() {
  const samples = await dbAll('samples'); const selected = developerSymbol.value;
  developerProgress.textContent = selected ? `目前 ${selected}：${samples.filter((sample) => sample.symbol === selected).length} 筆` : '';
  developerStats.textContent = `樣本庫共 ${samples.length} 筆；估計使用 ${(samples.reduce((sum, sample) => sum + (sample.gray?.byteLength ?? 0) + (sample.edges?.byteLength ?? 0), 0) / 1024).toFixed(1)} KB。`;
}

async function updateSampleStoreStats() {
  const samples = await dbAll('samples');
  const bytes = samples.reduce((sum, sample) => sum + (sample.gray?.byteLength ?? 0) + (sample.edges?.byteLength ?? 0), 0);
  const coverage = [1, 2, 3].map((tier) => { const symbols = trainingCatalog.filter((item) => item.priority === tier); const counts = symbols.map((item) => samples.filter((sample) => sample.symbol === item.latex).length); const none = symbols.filter((_, index) => counts[index] === 0).map((item) => item.latex); const low = symbols.filter((_, index) => counts[index] > 0 && counts[index] < 5).map((item) => item.latex); return `第${tier}級 ${symbols.length - none.length}/${symbols.length}；無樣本：${none.join('、') || '無'}；不足5筆：${low.join('、') || '無'}`; });
  const coefficients = trainingCatalog.map((item) => { const count = samples.filter((sample) => sample.symbol === item.latex).length; const weight = count < 4 ? 0 : count < 10 ? clamp((count - 3) / 7, 0, 1) : count < 20 ? .5 : 1; return `${item.latex}：${count}筆／${weight.toFixed(2)}`; });
  sampleStoreStats.textContent = `IndexedDB 樣本庫：${samples.length} 筆，約 ${(bytes / 1024).toFixed(1)} KB。${coverage.join('。')} 幾何權重：${coefficients.join('、')}`;
}

function renderPriorityCategories() {
  const selected = prioritySelection(); priorityCategories.innerHTML = '';
  priorityCategoryDefinitions.sort((left, right) => (selected.indexOf(left[0]) + 99) % 99 - (selected.indexOf(right[0]) + 99) % 99).forEach(([id, name]) => {
    const row = document.createElement('label'); row.className = 'priority-category'; row.draggable = true; row.dataset.id = id;
    const check = document.createElement('input'); check.type = 'checkbox'; check.checked = selected.includes(id); check.addEventListener('change', () => { const next = prioritySelection().filter((item) => item !== id); if (check.checked) next.push(id); writeStorage(PRIORITY_CATEGORIES_KEY, next); renderPriorityCategories(); });
    row.append(check, document.createTextNode(name)); row.addEventListener('dragstart', () => row.classList.add('dragging')); row.addEventListener('dragend', () => row.classList.remove('dragging')); row.addEventListener('dragover', (event) => { event.preventDefault(); const dragging = priorityCategories.querySelector('.dragging'); if (dragging && dragging !== row) priorityCategories.insertBefore(dragging, row); }); row.addEventListener('drop', () => { writeStorage(PRIORITY_CATEGORIES_KEY, [...priorityCategories.querySelectorAll('.priority-category input:checked')].map((input) => input.closest('.priority-category').dataset.id)); }); priorityCategories.append(row);
  });
}

async function exportSamples(filename = 'seed_samples.json') {
  const samples = await dbAll('samples');
  const payload = { version: 1, exportedAt: new Date().toISOString(), samples: samples.map(({ id, ...sample }) => ({ ...sample, gray: Array.from(sample.gray), edges: Array.from(sample.edges) })) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); return filename;
}

function manualRewriteSymbols() { return rewriteManualSymbols.value.split(/[\s,，]+/).map((value) => value.trim()).filter(Boolean); }

async function renderRewriteSymbols() {
  const samples = await dbAll('samples'); const symbols = [...new Set([...samples.map((sample) => sample.symbol), ...rewriteDefaults])].sort();
  rewriteSymbolList.innerHTML = '';
  symbols.forEach((symbol) => {
    const matching = samples.filter((sample) => sample.symbol === symbol); const last = matching.reduce((latest, sample) => Math.max(latest, sample.createdAt ?? 0), 0);
    const label = document.createElement('label'); label.className = 'rewrite-symbol-item';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.value = symbol; checkbox.checked = rewriteDefaults.includes(symbol);
    const text = document.createElement('span'); text.textContent = symbol;
    const meta = document.createElement('small'); meta.textContent = `${matching.length} 筆${last ? `｜最後更新 ${new Date(last).toLocaleString()}` : '｜尚無樣本'}`;
    text.append(meta); label.append(checkbox, text); rewriteSymbolList.append(label);
  });
}

function selectedRewriteSymbols() { return [...new Set([...rewriteSymbolList.querySelectorAll('input:checked')].map((input) => input.value).concat(manualRewriteSymbols()))]; }

async function activateRewrite() {
  if (!rewriteState) return;
  const symbol = rewriteState.symbols[rewriteState.symbolIndex];
  if (!symbol) { await completeRewrite(); return; }
  developerSymbol.value = symbol; developerVariant.value = ''; developerDrawing.clear();
  developerProgress.textContent = `重寫模式｜${symbol}（${rewriteState.symbolIndex + 1}/${rewriteState.symbols.length}），第 ${rewriteState.sampleIndex + 1}/${TRAINING_REPETITIONS} 筆。`;
  rewriteStatus.textContent = `進行中：${rewriteState.mode === 'append' ? '追加舊樣本' : '完成符號後取代舊樣本'}。`; resumeRewriteButton.hidden = true;
}

async function finishRewriteSample() {
  const features = featuresFor(developerDrawing, developerCanvas); if (!features.strokeCount) { developerProgress.textContent = '請先手寫一筆樣本。'; return; }
  const symbol = rewriteState.symbols[rewriteState.symbolIndex]; const raster = normalizedRaster(developerCanvas); const modelCandidate = await trainingModelCheck(developerDrawing.image());
  await dbPut('rewriteDrafts', { sessionId: rewriteState.id, symbol, category: 'rewrite', source: 'rewrite', rewriteMode: rewriteState.mode, modelCandidate, strokeCount: features.strokeCount, startEndHints: features.startEndHints, geometry: features.geometry, gray: raster.gray, edges: raster.edges, thumbnail: raster.image, createdAt: Date.now() });
  rewriteState.newCounts[symbol] = (rewriteState.newCounts[symbol] ?? 0) + 1; rewriteState.sampleIndex += 1;
  if (rewriteState.sampleIndex >= TRAINING_REPETITIONS) {
    const drafts = (await dbAll('rewriteDrafts')).filter((draft) => draft.sessionId === rewriteState.id && draft.symbol === symbol);
    if (rewriteState.mode === 'replace') {
      const all = await dbAll('samples');
      for (const sample of all.filter((entry) => entry.symbol === symbol && entry.rewriteSessionId !== rewriteState.id)) await dbDelete('samples', sample.id);
    }
    for (const draft of drafts) { const { id, sessionId, ...sample } = draft; await dbPut('samples', { ...sample, rewriteSessionId: sessionId }); await dbDelete('rewriteDrafts', id); }
    await updateSymbolProfile(symbol); rewriteState.completed.push({ symbol, count: rewriteState.newCounts[symbol], mode: rewriteState.mode });
    rewriteState.symbolIndex += 1; rewriteState.sampleIndex = 0;
  }
  await dbPut('trainingState', { id: 'rewrite', ...rewriteState, updatedAt: Date.now() });
  developerDrawing.clear(); await activateRewrite();
}

async function completeRewrite() {
  const summary = rewriteState.completed.map((item) => `${item.symbol}：新增 ${item.count} 筆（${item.mode === 'append' ? '保留舊樣本' : '已取代舊樣本'}）`).join('；');
  rewriteSummary.textContent = `重寫完成：${summary}`; rewriteStatus.textContent = '僅已選符號的規則庫與幾何分布已重新統計。';
  await dbDelete('trainingState', 'rewrite'); rewriteState = null; await renderRewriteSymbols(); await updateDeveloperStats();
}

async function startRewrite() {
  if (await dbGet('trainingState', 'rewrite')) { rewriteStatus.textContent = '已有未完成的重寫工作階段，請先按「繼續未完成重寫」。'; resumeRewriteButton.hidden = false; return; }
  const symbols = selectedRewriteSymbols(); if (!symbols.length) { rewriteStatus.textContent = '請至少勾選或輸入一個符號。'; return; }
  const samples = await dbAll('samples'); const otherCount = new Set(samples.map((sample) => sample.symbol).filter((symbol) => !symbols.includes(symbol))).size;
  if (!window.confirm(`即將重寫 ${symbols.length} 個符號，其他 ${otherCount} 個符號的資料不會變動。是否繼續？`)) return;
  rewriteState = { id: makeId(), symbols, mode: document.querySelector('input[name="rewriteMode"]:checked').value, symbolIndex: 0, sampleIndex: 0, completed: [], newCounts: {}, startedAt: Date.now() };
  rewriteSummary.textContent = ''; await dbPut('trainingState', { id: 'rewrite', ...rewriteState }); await activateRewrite();
}

let cleanupPlan = null;
function makeCleanupPlan(samples) {
  const entries = rewriteDefaults.map((symbol) => {
    const all = samples.filter((sample) => sample.symbol === symbol).sort((left, right) => (right.createdAt ?? 0) - (left.createdAt ?? 0));
    return { symbol, keep: all.slice(0, 10), remove: all.slice(10), total: all.length };
  });
  return { entries, remove: entries.flatMap((entry) => entry.remove), targets: entries.flatMap((entry) => entry.keep.concat(entry.remove)) };
}

function renderCleanupPlan(plan) {
  cleanupPreview.innerHTML = '';
  plan.entries.forEach((entry) => { const row = document.createElement('div'); row.textContent = `${entry.symbol}：刪除 ${entry.remove.length} 筆，保留 ${entry.keep.length} / ${entry.total} 筆`; cleanupPreview.append(row); });
  const total = plan.remove.length; const note = document.createElement('strong'); note.textContent = total ? `即將刪除共 ${total} 筆樣本。` : '沒有需要刪除的樣本。'; cleanupPreview.append(note);
}

async function previewCleanup() {
  cleanupPlan = makeCleanupPlan(await dbAll('samples')); renderCleanupPlan(cleanupPlan);
  confirmCleanupButton.hidden = cleanupPlan.remove.length === 0;
  cleanupStatus.textContent = cleanupPlan.remove.length ? '請確認預覽後按「確認並清理」。' : '所有指定符號都不超過 10 筆，未進行任何變動。';
}

async function runCleanup() {
  if (!cleanupPlan) { await previewCleanup(); return; }
  const symbols = cleanupPlan.entries.filter((entry) => entry.remove.length).map((entry) => entry.symbol);
  if (!symbols.length) return;
  if (!window.confirm(`即將刪除 ${cleanupPlan.remove.length} 筆樣本，涉及以下符號：${symbols.join('、')}。其他符號資料不會變動。是否繼續？`)) return;
  const backupName = `formula-ink-backup-before-cleanup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  await exportSamples(backupName);
  const profiles = await dbAll('symbolProfiles'); const oldProfiles = profiles.filter((profile) => rewriteDefaults.includes(profile.symbol));
  const nextProfiles = cleanupPlan.entries.map((entry) => profileFromSamples(entry.symbol, entry.keep)).filter(Boolean);
  const db = await recognitionDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(['samples', 'symbolProfiles', 'cleanupBackups'], 'readwrite');
    const sampleStore = transaction.objectStore('samples'); const profileStore = transaction.objectStore('symbolProfiles');
    transaction.objectStore('cleanupBackups').put({ id: 'last-cleanup', createdAt: Date.now(), backupName, samples: cleanupPlan.targets, profiles: oldProfiles, symbols: rewriteDefaults, summary: cleanupPlan.entries.map((entry) => ({ symbol: entry.symbol, removed: entry.remove.length, kept: entry.keep.length })) });
    cleanupPlan.remove.forEach((sample) => sampleStore.delete(sample.id));
    rewriteDefaults.forEach((symbol) => profileStore.delete(symbol));
    nextProfiles.forEach((profile) => profileStore.put(profile));
    transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error);
  });
  const remaining = (await dbAll('samples')).length;
  cleanupStatus.textContent = `清理完成。備份已下載為「${backupName}」（位置由瀏覽器下載設定決定）；目前樣本總數 ${remaining}。`;
  cleanupPreview.innerHTML = ''; cleanupPlan.entries.forEach((entry) => { const row = document.createElement('div'); row.textContent = `${entry.symbol}：刪除 ${entry.remove.length} 筆，保留 ${entry.keep.length} 筆`; cleanupPreview.append(row); });
  confirmCleanupButton.hidden = true; undoCleanupButton.hidden = false; cleanupPlan = null; await renderRewriteSymbols(); await updateDeveloperStats();
}

async function undoCleanup() {
  const backup = await dbGet('cleanupBackups', 'last-cleanup');
  if (!backup) { cleanupStatus.textContent = '找不到可復原的清理快照。'; undoCleanupButton.hidden = true; return; }
  if (!window.confirm('將還原這次清理前的指定符號樣本與規則庫。是否繼續？')) return;
  const db = await recognitionDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(['samples', 'symbolProfiles', 'cleanupBackups'], 'readwrite'); const samples = transaction.objectStore('samples'); const profiles = transaction.objectStore('symbolProfiles');
    const request = samples.getAll();
    request.onsuccess = () => {
      request.result.filter((sample) => backup.symbols.includes(sample.symbol)).forEach((sample) => samples.delete(sample.id));
      backup.samples.forEach((sample) => samples.put(sample)); backup.symbols.forEach((symbol) => profiles.delete(symbol)); backup.profiles.forEach((profile) => profiles.put(profile)); transaction.objectStore('cleanupBackups').delete('last-cleanup');
    };
    request.onerror = () => transaction.abort(); transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error);
  });
  cleanupStatus.textContent = '已從清理前快照復原指定符號；其他符號未變動。'; undoCleanupButton.hidden = true; await renderRewriteSymbols(); await updateDeveloperStats();
}

function setupDeveloperPage() {
  trainingCatalog.forEach((item) => { const option = document.createElement('option'); option.value = item.latex; option.textContent = `${item.category}：${item.latex}`; developerSymbol.append(option); });
  developerSymbol.addEventListener('change', updateDeveloperStats);
  document.querySelector('#developerUndoButton').addEventListener('click', () => developerDrawing.undo());
  document.querySelector('#developerClearButton').addEventListener('click', () => developerDrawing.clear());
  document.querySelector('#saveDeveloperSampleButton').addEventListener('click', async () => {
    if (rewriteState) { await finishRewriteSample(); return; }
    const features = featuresFor(developerDrawing, developerCanvas); if (!features.strokeCount) { developerProgress.textContent = '請先手寫一筆樣本。'; return; }
    const raster = normalizedRaster(developerCanvas);
    await dbPut('samples', { symbol: developerSymbol.value, variant: developerVariant.value.trim(), category: 'developer-seed', strokeCount: features.strokeCount, startEndHints: features.startEndHints, geometry: features.geometry, gray: raster.gray, edges: raster.edges, thumbnail: raster.image, createdAt: Date.now() });
    await updateSymbolProfile(developerSymbol.value); developerDrawing.clear(); developerProgress.textContent = `已儲存：${geometryLabel(features.geometry)}`; await updateDeveloperStats();
  });
  document.querySelector('#exportSeedButton').addEventListener('click', exportSamples);
  document.querySelector('#backupSamplesButton').addEventListener('click', exportSamples);
  document.querySelector('#startRewriteButton').addEventListener('click', startRewrite);
  document.querySelector('#cleanupBackupButton').addEventListener('click', async () => { const name = `formula-ink-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`; await exportSamples(name); cleanupStatus.textContent = `備份已下載為「${name}」；位置由瀏覽器下載設定決定。`; });
  document.querySelector('#previewCleanupButton').addEventListener('click', previewCleanup);
  confirmCleanupButton.addEventListener('click', runCleanup);
  undoCleanupButton.addEventListener('click', undoCleanup);
  resumeRewriteButton.addEventListener('click', async () => { const saved = await dbGet('trainingState', 'rewrite'); if (saved) { rewriteState = saved; await activateRewrite(); } });
  renderRewriteSymbols();
  dbGet('trainingState', 'rewrite').then((saved) => { if (saved) { rewriteStatus.textContent = `發現未完成的重寫工作階段（${saved.symbols.length} 個符號）。`; resumeRewriteButton.hidden = false; } });
  dbGet('cleanupBackups', 'last-cleanup').then((backup) => { undoCleanupButton.hidden = !backup; });
}

function renderSymbolPanel() {
  const query = symbolSearch.value.trim().toLowerCase();
  const matching = symbolCatalog.filter((symbol) => `${symbol.category} ${symbol.name} ${symbol.latex}`.toLowerCase().includes(query));
  const categories = new Map();
  matching.forEach((symbol) => categories.set(symbol.category, [...(categories.get(symbol.category) ?? []), symbol]));
  symbolCategories.innerHTML = '';
  categories.forEach((symbols, category) => {
    const section = document.createElement('section');
    section.className = 'symbol-category';
    const header = document.createElement('div'); header.className = 'symbol-category-header';
    const heading = document.createElement('h3');
    heading.textContent = category;
    const expanded = query.length > 0 || expandedSymbolCategories.has(category);
    const visibleSymbols = expanded ? symbols : symbols.slice(0, 8);
    if (symbols.length > 8 && !query) {
      const expand = document.createElement('button'); expand.type = 'button'; expand.className = 'expand-symbols';
      expand.textContent = expanded ? '收合' : '展開更多';
      expand.addEventListener('click', () => { if (expanded) expandedSymbolCategories.delete(category); else expandedSymbolCategories.add(category); renderSymbolPanel(); });
      header.append(heading, expand);
    } else header.append(heading);
    const grid = document.createElement('div');
    grid.className = 'symbol-grid';
    visibleSymbols.forEach((symbol) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'symbol-button';
      button.title = `${symbol.name}: ${symbol.latex}`;
      const rendered = document.createElement('span');
      rendered.className = 'candidate-preview';
      renderLatex(symbol.latex, rendered);
      button.append(rendered);
      button.addEventListener('click', () => insertAtCursor(symbol.latex));
      grid.append(button);
    });
    section.append(header, grid);
    symbolCategories.append(section);
  });
  if (!matching.length) symbolCategories.textContent = '找不到符合的符號。';
}

function resetFormulaForm() {
  formulaForm.reset();
  formulaId.value = '';
  formulaFormTitle.textContent = '新增常用公式';
  formulaForm.hidden = true;
}

function openFormulaForm(formula = null) {
  formulaId.value = formula?.id ?? '';
  formulaName.value = formula?.name ?? '';
  formulaLatex.value = formula?.latex ?? latexField.value.trim();
  formulaNote.value = formula?.note ?? '';
  formulaFormTitle.textContent = formula ? '編輯常用公式' : '新增常用公式';
  showPage('library');
  formulaForm.hidden = false;
  formulaName.focus();
}

function renderFormulaLibrary() {
  const query = formulaSearch.value.trim().toLowerCase();
  const formulas = formulaLibrary().filter((formula) => `${formula.name} ${formula.latex} ${formula.note}`.toLowerCase().includes(query));
  formulaLibraryItems.innerHTML = '';
  formulas.forEach((formula) => {
    const item = document.createElement('article');
    item.className = 'library-item';
    item.tabIndex = 0;
    item.title = '點擊插入到首頁的辨識結果欄位';
    item.addEventListener('click', () => insertLibraryFormula(formula.latex));
    item.addEventListener('keydown', (event) => { if (event.key === 'Enter') insertLibraryFormula(formula.latex); });
    const details = document.createElement('div');
    const name = document.createElement('h3');
    name.textContent = formula.name;
    const rendered = document.createElement('div');
    rendered.className = 'library-render';
    renderLatex(formula.latex, rendered);
    const note = document.createElement('p');
    note.textContent = formula.note || '沒有備註';
    details.append(name, rendered, note);
    const actions = document.createElement('div');
    actions.className = 'library-actions';
    const insert = document.createElement('button');
    insert.type = 'button'; insert.textContent = '插入';
    insert.addEventListener('click', (event) => { event.stopPropagation(); insertLibraryFormula(formula.latex); });
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'secondary'; edit.textContent = '編輯';
    edit.addEventListener('click', (event) => { event.stopPropagation(); openFormulaForm(formula); });
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'secondary'; remove.textContent = '刪除';
    remove.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!window.confirm(`刪除「${formula.name}」？`)) return;
      writeStorage(FORMULA_LIBRARY_KEY, formulaLibrary().filter((entry) => entry.id !== formula.id));
      const profiles = formulaProfiles(); delete profiles[formula.id]; writeStorage(FORMULA_LIBRARY_PROFILES_KEY, profiles);
      renderFormulaLibrary();
    });
    actions.append(insert, edit, remove);
    item.append(details, actions);
    formulaLibraryItems.append(item);
  });
  if (!formulas.length) formulaLibraryItems.textContent = '找不到符合的公式。';
}

document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => {
  recognitionMode = button.dataset.mode;
  document.querySelectorAll('.mode-button').forEach((item) => item.classList.toggle('active', item === button));
  document.querySelector('#modeDescription').textContent = recognitionMode === 'symbol'
    ? '單一符號以模型形狀辨識為主；筆畫數只會顯示為參考提示。'
    : '完整公式只依個人偏好排序，不會因筆畫數剔除結果。';
  resetRecognition();
}));

undoButton.addEventListener('click', () => mainDrawing.undo());
trainingUndoButton.addEventListener('click', () => trainingDrawing.undo());
clearButton.addEventListener('click', resetRecognition);
trainingClearButton.addEventListener('click', () => trainingDrawing.clear());
recognizeButton.addEventListener('click', () => requestRecognition(recognitionMode === 'symbol' ? 3 : 1));
moreCandidatesButton.addEventListener('click', () => requestRecognition(recognitionMode === 'symbol' ? 5 : 4, true));
finishSampleButton.addEventListener('click', finishTrainingSample);
document.querySelector('#skipTrainingButton').addEventListener('click', () => {
  onboarding.hidden = true;
  showPage('home');
  status.textContent = '訓練已暫停；下次可從訓練模式繼續。';
});
trainingTierButtons.addEventListener('click', async (event) => {
  const tier = Number(event.target.dataset.tier); if (!tier) return;
  trainingState = { tier, symbolIndex: 0, sampleIndex: 0, skipped: trainingState.skipped ?? [], completed: trainingState.completed ?? [] };
  await dbPut('trainingState', { id: 'default', ...trainingState, updatedAt: Date.now() }); await updateTrainingScreen();
});
document.querySelector('#skipSymbolButton').addEventListener('click', async () => {
  const catalog = trainingCatalog.filter((item) => item.priority === trainingState.tier && !trainingState.skipped.includes(item.latex)); const target = catalog[trainingState.symbolIndex]; if (!target) return;
  trainingState.skipped = [...new Set([...trainingState.skipped, target.latex])];
  await dbPut('trainingState', { id: 'default', ...trainingState, updatedAt: Date.now() }); await updateTrainingScreen();
});
document.querySelector('#addCustomTrainingButton').addEventListener('click', async () => {
  const input = document.querySelector('#customTrainingInput'); const latex = input.value.trim(); if (!latex || trainingCatalog.some((item) => item.latex === latex)) return;
  trainingCatalog.push({ latex, priority: 3, category: '選訓' }); writeStorage('customTrainingSymbols', [...readStorage('customTrainingSymbols', []), latex]); input.value = ''; await updateTrainingScreen();
});

copyButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(latexField.value);
  status.textContent = 'LaTeX 已複製。';
});
latexField.addEventListener('input', updatePreview);
['select', 'click', 'keyup', 'focus'].forEach((eventName) => latexField.addEventListener(eventName, rememberEditorSelection));
useEditedLatexButton.addEventListener('click', () => {
  if (!latexField.value.trim()) return;
  recordPreference(latexField.value);
  status.textContent = '已儲存手動輸入的本機偏好。';
});

document.querySelector('#symbolsButton').addEventListener('click', () => {
  rememberEditorSelection();
  symbolPanel.hidden = false;
  renderSymbolPanel();
  symbolSearch.focus();
});
document.querySelector('#closeSymbolsButton').addEventListener('click', () => { symbolPanel.hidden = true; latexField.focus(); });
symbolSearch.addEventListener('input', renderSymbolPanel);

formulaSearch.addEventListener('input', renderFormulaLibrary);
saveFormulaButton.addEventListener('click', () => openFormulaForm());
document.querySelector('#newFormulaButton').addEventListener('click', () => openFormulaForm());
document.querySelector('#cancelFormulaEdit').addEventListener('click', resetFormulaForm);
formulaForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const entries = formulaLibrary();
  const now = Date.now();
  const id = formulaId.value || makeId();
  const existing = entries.find((formula) => formula.id === id);
  const formula = {
    id,
    name: formulaName.value.trim(),
    latex: formulaLatex.value.trim(),
    note: formulaNote.value.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    strokeSamples: existing?.strokeSamples ?? [],
  };
  const updated = existing ? entries.map((entry) => entry.id === id ? formula : entry) : [...entries, formula];
  writeStorage(FORMULA_LIBRARY_KEY, updated);
  const features = lastRecognition?.features;
  if (features && normalizeLatex(formula.latex) === normalizeLatex(latexField.value)) {
    addFormulaProfile(id, features);
    const memory = readStorage('formulaMemory', []);
    memory.push({ name: formula.name, latex: formula.latex, strokeCount: features.strokeCount, startEndHints: features.startEndHints, timestamp: Date.now() });
    writeStorage('formulaMemory', memory);
  }
  renderFormulaLibrary();
  resetFormulaForm();
  status.textContent = readStorage('formulaMemory', []).length > 100
    ? `已儲存「${formula.name}」。已記住超過 100 個公式，建議至個人化設定整理。`
    : `已儲存「${formula.name}」到常用公式庫。`;
});

document.querySelector('#retrainButton').addEventListener('click', startTraining);
document.querySelector('#clearPreferencesButton').addEventListener('click', () => {
  localStorage.removeItem(PREFERENCES_KEY);
  status.textContent = '偏好記憶已清除。';
});
document.querySelector('#clearPriorityCategories').addEventListener('click', () => { writeStorage(PRIORITY_CATEGORIES_KEY, []); renderPriorityCategories(); });

document.querySelectorAll('.nav-button').forEach((button) => button.addEventListener('click', () => showPage(button.dataset.page)));
document.querySelectorAll('[data-page-link]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); showPage(link.dataset.pageLink); }));

window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && document.activeElement !== latexField) {
    event.preventDefault();
    if (!onboarding.hidden) trainingDrawing.undo(); else mainDrawing.undo();
  }
});

updatePreview();
ensureFormulaLibrary();
renderSymbolPanel();
renderFormulaLibrary();
setupDeveloperPage();
const developerParams = new URLSearchParams(window.location.search);
const developerEnabled = developerParams.get('developer') === '1' || developerParams.get('dev') === '1';
developerNavButton.hidden = !developerEnabled;
onboarding.hidden = true;
if (developerEnabled && window.location.hash === '#developer') showPage('developer'); else showPage('home');
