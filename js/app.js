const state = {
  audioBuffer: null,
  file: null,
  calculator: null,
  equations: { partials: [], sum: null },
  showSum: true,
  showPartials: true,
  theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
};

const els = {
  fileInput: document.getElementById('audioFile'),
  dropzone: document.getElementById('dropzone'),
  fileCard: document.getElementById('fileCard'),
  fileName: document.getElementById('fileName'),
  fileMeta: document.getElementById('fileMeta'),
  clearFile: document.getElementById('clearFile'),
  clipLength: document.getElementById('clipLength'),
  clipLengthValue: document.getElementById('clipLengthValue'),
  harmonicCount: document.getElementById('harmonicCount'),
  harmonicCountValue: document.getElementById('harmonicCountValue'),
  waveFunction: document.getElementById('waveFunction'),
  analyzeBtn: document.getElementById('analyzeBtn'),
  copyBtn: document.getElementById('copyBtn'),
  statusBox: document.getElementById('statusBox'),
  waveform: document.getElementById('waveform'),
  durationStat: document.getElementById('durationStat'),
  sampleRateStat: document.getElementById('sampleRateStat'),
  peakStat: document.getElementById('peakStat'),
  termsStat: document.getElementById('termsStat'),
  equationOutput: document.getElementById('equationOutput'),
  toggleSum: document.getElementById('toggleSum'),
  togglePartials: document.getElementById('togglePartials'),
  resetGraph: document.getElementById('resetGraph'),
  themeToggle: document.querySelector('[data-theme-toggle]')
};

init();

function init() {
  document.documentElement.setAttribute('data-theme', state.theme);
  initCalculator();
  bindEvents();
  drawEmptyWaveform();
}

function initCalculator() {
  state.calculator = Desmos.GraphingCalculator(document.getElementById('calculator'), {
    expressionsCollapsed: false,
    settingsMenu: true,
    zoomButtons: true,
    border: false,
    invertedColors: state.theme === 'dark'
  });
  state.calculator.setMathBounds({ left: -8, right: 8, bottom: -2.2, top: 2.2 });
}

function bindEvents() {
  els.clipLength.addEventListener('input', () => els.clipLengthValue.textContent = `${Number(els.clipLength.value).toFixed(1)}s`);
  els.harmonicCount.addEventListener('input', () => els.harmonicCountValue.textContent = els.harmonicCount.value);
  els.fileInput.addEventListener('change', handleFileSelect);
  els.clearFile.addEventListener('click', clearFile);
  els.analyzeBtn.addEventListener('click', analyzeAudio);
  els.copyBtn.addEventListener('click', copyEquations);
  els.resetGraph.addEventListener('click', resetGraph);
  els.toggleSum.addEventListener('click', () => toggleVisibility('sum'));
  els.togglePartials.addEventListener('click', () => toggleVisibility('partials'));
  els.themeToggle.addEventListener('click', toggleTheme);

  ['dragenter','dragover'].forEach(type => els.dropzone.addEventListener(type, e => {
    e.preventDefault();
    els.dropzone.classList.add('dragover');
  }));
  ['dragleave','drop'].forEach(type => els.dropzone.addEventListener(type, e => {
    e.preventDefault();
    els.dropzone.classList.remove('dragover');
  }));
  els.dropzone.addEventListener('drop', e => {
    const file = e.dataTransfer.files?.[0];
    if (file) prepareFile(file);
  });
}

async function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (file) prepareFile(file);
}

async function prepareFile(file) {
  try {
    setStatus('Decoding audio…');
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    state.file = file;
    state.audioBuffer = decoded;
    els.fileName.textContent = file.name;
    els.fileMeta.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB · ${decoded.duration.toFixed(2)}s total`;
    els.fileCard.hidden = false;
    els.analyzeBtn.disabled = false;
    updateStats(decoded, null);
    drawWaveform(decoded);
    setStatus('File ready. Click Analyze clip.');
  } catch (error) {
    console.error(error);
    setStatus('Could not decode that file. Try another short clip.');
  }
}

function clearFile() {
  state.file = null;
  state.audioBuffer = null;
  els.fileInput.value = '';
  els.fileCard.hidden = true;
  els.analyzeBtn.disabled = true;
  els.copyBtn.disabled = true;
  els.equationOutput.textContent = 'No equations yet.';
  drawEmptyWaveform();
  updateStats(null, null);
  resetGraph();
  setStatus('Upload a file to begin.');
}

function drawEmptyWaveform() {
  const ctx = els.waveform.getContext('2d');
  ctx.clearRect(0, 0, els.waveform.width, els.waveform.height);
  ctx.fillStyle = getCss('--color-surface-2');
  ctx.fillRect(0, 0, els.waveform.width, els.waveform.height);
  ctx.fillStyle = getCss('--color-text-faint');
  ctx.font = '14px Satoshi';
  ctx.fillText('Waveform preview appears here', 16, 56);
}

function drawWaveform(audioBuffer) {
  if (!audioBuffer) {
    drawEmptyWaveform();
    return;
  }
  const ctx = els.waveform.getContext('2d');
  const width = els.waveform.width;
  const height = els.waveform.height;
  const data = audioBuffer.getChannelData(0);
  const step = Math.ceil(data.length / width);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = getCss('--color-surface-2');
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = getCss('--color-primary');
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < width; i++) {
    let min = 1;
    let max = -1;
    for (let j = 0; j < step; j++) {
      const sample = data[(i * step) + j] || 0;
      if (sample < min) min = sample;
      if (sample > max) max = sample;
    }
    ctx.moveTo(i, (1 + min) * height / 2);
    ctx.lineTo(i, (1 + max) * height / 2);
  }
  ctx.stroke();
}

async function analyzeAudio() {
  if (!state.audioBuffer) return;
  try {
    setStatus('Analyzing short clip…');
    const clipLength = Number(els.clipLength.value);
    const harmonicCount = Number(els.harmonicCount.value);
    const waveFn = els.waveFunction.value;
    const result = extractDominantFrequencies(state.audioBuffer, clipLength, harmonicCount);
    const equations = buildEquations(result, waveFn);
    state.equations = equations;
    renderGraph(equations);
    renderEquationText(equations);
    updateStats(state.audioBuffer, result);
    els.copyBtn.disabled = false;
    setStatus(`Built ${result.terms.length} partial terms from a ${clipLength.toFixed(1)}s clip.`);
  } catch (error) {
    console.error(error);
    setStatus('Analysis failed. Try a shorter clip or fewer harmonics.');
  }
}

function extractDominantFrequencies(audioBuffer, clipSeconds, harmonicCount) {
  const sampleRate = audioBuffer.sampleRate;
  const source = audioBuffer.getChannelData(0);
  const targetSamples = Math.min(source.length, Math.floor(sampleRate * clipSeconds));
  const stride = Math.max(1, Math.floor(targetSamples / 2048));
  const reduced = [];
  for (let i = 0; i < targetSamples; i += stride) reduced.push(source[i]);
  const normalized = reduced.map((value, idx, arr) => {
    const hann = 0.5 * (1 - Math.cos((2 * Math.PI * idx) / Math.max(1, arr.length - 1)));
    return value * hann;
  });
  const reducedRate = sampleRate / stride;
  const minHz = 40;
  const maxHz = 2200;
  const bins = [];
  for (let freq = minHz; freq <= maxHz; freq += 20) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < normalized.length; n++) {
      const angle = (2 * Math.PI * freq * n) / reducedRate;
      real += normalized[n] * Math.cos(angle);
      imag -= normalized[n] * Math.sin(angle);
    }
    const magnitude = Math.sqrt(real * real + imag * imag) / normalized.length;
    bins.push({ freq, magnitude, phase: Math.atan2(imag, real) });
  }
  bins.sort((a, b) => b.magnitude - a.magnitude);
  const selected = bins.slice(0, harmonicCount);
  const maxMag = selected[0]?.magnitude || 1;
  const terms = selected
    .map(term => ({ ...term, amplitude: Math.max(0.06, Math.min(1, term.magnitude / maxMag)) }))
    .sort((a, b) => a.freq - b.freq);
  return { terms, sampleRate, clipSeconds };
}

function buildEquations(result, waveFn) {
  const partials = result.terms.map((term, index) => {
    const omega = ((2 * Math.PI * term.freq) / 400).toFixed(4);
    const amplitude = term.amplitude.toFixed(4);
    const phase = term.phase.toFixed(4);
    return {
      id: `p${index + 1}`,
      latex: `p_{${index + 1}}(x)=${amplitude}\\${waveFn}(${omega}x+${phase})`,
      text: `p_${index + 1}(x) = ${amplitude}${waveFn}(${omega}x + ${phase})    // ${term.freq.toFixed(0)} Hz`,
      freq: term.freq
    };
  });
  const sum = {
    id: 'sum',
    latex: `f(x)=${partials.map((_, i) => `p_{${i + 1}}(x)`).join('+')}`,
    text: `f(x) = ${partials.map((_, i) => `p_${i + 1}(x)`).join(' + ')}`
  };
  return { partials, sum };
}

function renderGraph(equations) {
  state.calculator.setBlank();
  equations.partials.forEach((term, index) => {
    state.calculator.setExpression({
      id: term.id,
      latex: term.latex,
      color: partialColor(index),
      hidden: !state.showPartials,
      lineStyle: Desmos.Styles.DASHED
    });
  });
  state.calculator.setExpression({
    id: equations.sum.id,
    latex: equations.sum.latex,
    color: '#2d70b3',
    hidden: !state.showSum,
    lineWidth: 2.5
  });
  state.calculator.setMathBounds({ left: -8, right: 8, bottom: -2.2, top: 2.2 });
}

function renderEquationText(equations) {
  const parts = equations.partials.map(term => term.text);
  parts.push('', equations.sum.text);
  els.equationOutput.textContent = parts.join('\n');
}

function copyEquations() {
  navigator.clipboard.writeText(els.equationOutput.textContent)
    .then(() => setStatus('Equations copied to clipboard.'))
    .catch(() => setStatus('Could not copy automatically. Select and copy manually.'));
}

function resetGraph() {
  state.calculator.setBlank();
  state.calculator.setMathBounds({ left: -8, right: 8, bottom: -2.2, top: 2.2 });
  els.equationOutput.textContent = 'No equations yet.';
}

function toggleVisibility(kind) {
  if (kind === 'sum') {
    state.showSum = !state.showSum;
    els.toggleSum.classList.toggle('active', state.showSum);
    state.calculator.setExpression({ id: 'sum', hidden: !state.showSum });
  } else {
    state.showPartials = !state.showPartials;
    els.togglePartials.classList.toggle('active', state.showPartials);
    if (state.equations.partials) {
      state.equations.partials.forEach(term => state.calculator.setExpression({ id: term.id, hidden: !state.showPartials }));
    }
  }
}

function updateStats(audioBuffer, result) {
  els.durationStat.textContent = audioBuffer ? `${audioBuffer.duration.toFixed(2)}s` : '—';
  els.sampleRateStat.textContent = audioBuffer ? `${(audioBuffer.sampleRate / 1000).toFixed(1)} kHz` : '—';
  els.peakStat.textContent = result?.terms?.[0] ? `${result.terms[0].freq.toFixed(0)} Hz` : '—';
  els.termsStat.textContent = result?.terms?.length ? `${result.terms.length}` : '—';
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  state.calculator.updateSettings({ invertedColors: state.theme === 'dark' });
  if (state.audioBuffer) drawWaveform(state.audioBuffer);
  else drawEmptyWaveform();
}

function setStatus(message) { els.statusBox.textContent = message; }
function getCss(variable) { return getComputedStyle(document.documentElement).getPropertyValue(variable).trim(); }
function partialColor(index) {
  const palette = ['#388c84', '#8a63d2', '#d17a3f', '#4d8fd6', '#769f43', '#c85a8a', '#7d8b95'];
  return palette[index % palette.length];
}
