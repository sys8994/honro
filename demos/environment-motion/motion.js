// Standalone study: no imports from, or writes to, the game runtime.
const scene = document.querySelector('#scene');
const image = document.querySelector('#landscape');
const playButton = document.querySelector('#play');
const windInput = document.querySelector('#wind');
const metrics = document.querySelector('#metrics');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const effects = Object.fromEntries(['water', 'fire', 'flag', 'fall', 'grass'].map(id => [id, { enabled: true, time: 0, paintWind: Number(windInput.value) }]));
const regions = [];
const samples = [];
let wind = Number(windInput.value);
let paintWind = wind;
let playing = !reducedMotion.matches;
let explicitPlayback = false;
let intersecting = true;
let ready = false;
let raf = 0;
let lastFrame = 0;
let renderedFrames = 0;
let lastMetric = 0;
let seed = 8994;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const TAU = Math.PI * 2;
const sharedWind = t => paintWind * (0.88 + 0.12 * Math.sin(t * 0.67));

function cache(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  if (paint) paint(canvas.getContext('2d'));
  return canvas;
}

function region(id, x, y, width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.dataset.effect = id;
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { left: `${x / 1672 * 100}%`, top: `${y / 941 * 100}%`, width: `${width / 1672 * 100}%`, height: `${height / 941 * 100}%` });
  scene.append(canvas);
  const item = { id, x, y, width, height, canvas, context: canvas.getContext('2d'), paint, draws: 0 };
  regions.push(item);
}

function prepareArt() {
  // Prepare only this reflection crop once. No pixel readback / image-data displacement.
  const water = { x: 610, y: 638, width: 1062, height: 182 };
  const reflection = cache(water.width, water.height, c => c.drawImage(image, water.x, water.y, water.width, water.height, 0, 0, water.width, water.height));
  const waterMask = new Path2D('M 85 32 Q 210 14 370 9 Q 500 0 657 12 L 729 27 L 848 39 L 944 57 L 1062 68 L 1062 120 L 994 131 L 907 151 L 802 162 L 690 151 L 637 165 L 560 143 L 479 141 L 408 131 L 347 125 L 285 115 L 241 111 L 195 98 L 120 97 L 100 80 L 55 71 Z');
  region('water', water.x, water.y, water.width, water.height, (c, t) => {
    c.save(); c.clip(waterMask);
    for (let y = 0; y < water.height; y += 3) {
      const shift = Math.sin(y * 0.13 + t * 1.5) * (0.65 + y / 150) + sharedWind(t) * 0.25;
      c.drawImage(reflection, 0, y, water.width, 3, shift, y, water.width, 3);
    }
    c.strokeStyle = '#bbc9c7'; c.lineWidth = 0.7;
    for (let i = 0; i < 8; i++) {
      const x = 155 + i * 105 + Math.sin(t * 0.6 + i) * 5;
      const y = 45 + (i * 31 % 102);
      c.globalAlpha = 0.035 + 0.05 * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 2));
      c.beginPath(); c.ellipse(x, y, 9 + i % 3 * 5, 0.65, 0, 0, TAU); c.stroke();
    }
    c.restore();
  });

  const ribbon = cache(64, 192, c => {
    for (let i = 0; i < 50; i++) {
      c.strokeStyle = `rgba(207,221,218,${0.025 + random() * 0.1})`;
      c.lineWidth = 0.5 + random() * 1.3;
      const x = random() * 64, y = random() * 192;
      c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x - 3, y + 10, x + 2, y + 22, x, y + 34); c.stroke();
    }
  });
  const fallMask = new Path2D('M 42 10 L 67 9 L 65 24 L 56 29 L 56 58 L 55 105 L 52 143 L 60 173 L 78 197 Q 47 204 16 198 L 31 176 L 38 142 L 41 98 L 41 56 L 46 31 L 39 29 Z');
  region('fall', 1138, 433, 104, 218, (c, t) => {
    c.save(); c.clip(fallMask);
    const offset = (t * 61) % 192;
    c.globalAlpha = 0.8;
    c.drawImage(ribbon, 20 + sharedWind(t) * 0.3, offset - 192, 64, 192);
    c.drawImage(ribbon, 20 + sharedWind(t) * 0.3, offset, 64, 192);
    c.restore();
    for (let i = 0; i < 7; i++) {
      const phase = (t * 0.65 + i / 7) % 1;
      c.strokeStyle = `rgba(178,198,199,${(1 - phase) * 0.09})`;
      c.beginPath(); c.ellipse(50 + Math.sin(i * 7) * 24, 205 - Math.sin(phase * Math.PI) * 8, 2 + phase * 7, 0.6 + phase * 1.4, 0, 0, TAU); c.stroke();
    }
  });

  const glow = cache(140, 140, c => {
    const gradient = c.createRadialGradient(70, 70, 0, 70, 70, 70);
    gradient.addColorStop(0, '#ef9b3655'); gradient.addColorStop(0.4, '#d6762525'); gradient.addColorStop(1, '#d6762500');
    c.fillStyle = gradient; c.fillRect(0, 0, 140, 140);
  });
  region('fire', 300, 515, 200, 146, (c, t) => {
    const breeze = sharedWind(t);
    c.globalAlpha = 0.72 + Math.sin(t * 5.2) * 0.09;
    c.drawImage(glow, 27, 5);
    c.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {
      const x = 75 + i * 20, base = 136 - Math.abs(i - 1) * 2;
      const height = 29 + (i === 1 ? 23 : 0) + Math.sin(t * 4.7 + i * 2) * 7;
      const lean = breeze * 14 + Math.sin(t * 5.3 + i) * 3;
      const gradient = c.createLinearGradient(0, base - height, 0, base);
      gradient.addColorStop(0, '#ab572500'); gradient.addColorStop(0.18, '#b7672e54'); gradient.addColorStop(0.55, '#da923ca6'); gradient.addColorStop(1, '#ecc27dd6');
      c.fillStyle = gradient;
      c.beginPath(); c.moveTo(x - 14, base);
      c.bezierCurveTo(x - 17, base - 20, x + lean + 11, base - height * 0.65, x + lean - 3, base - height);
      c.bezierCurveTo(x + lean + 13, base - height * 0.5, x + 18, base - 17, x + 13, base);
      c.closePath(); c.fill();
      c.globalAlpha = 0.18 + 0.05 * Math.sin(t * 6 + i);
      c.fillStyle = '#ffe0a5'; c.beginPath(); c.ellipse(x, base - 6, 6, 8, 0.1 * breeze, 0, TAU); c.fill(); c.globalAlpha = 1;
    }
    // Ten analytical embers, bounded to this patch, with a shared signed wind.
    for (let i = 0; i < 10; i++) {
      const age = (t * (0.25 + i % 3 * 0.045) + i / 10) % 1;
      c.globalAlpha = Math.sin(age * Math.PI) * 0.65;
      c.fillStyle = i % 3 ? '#cf8c43' : '#f4c16c';
      c.fillRect(91 + Math.sin(i * 9) * 20 + breeze * age * 51, 127 - age * 111, 0.8 + i % 2 * 0.6, 1.8);
    }
    c.globalAlpha = 1;
  });

  const cloth = cache(144, 164, c => {
    const outline = new Path2D('M 0 8 Q 45 15 82 20 L 142 15 L 135 47 L 142 75 L 127 103 L 136 139 L 114 131 L 107 149 L 91 138 L 82 154 L 68 140 Q 29 144 0 130 Z');
    c.save(); c.clip(outline);
    const shade = c.createLinearGradient(0, 0, 144, 160);
    shade.addColorStop(0, '#373b3a'); shade.addColorStop(0.45, '#242b2d'); shade.addColorStop(1, '#171e22');
    c.fillStyle = shade; c.fillRect(0, 0, 144, 164);
    // Baked, deterministic weave and folds; never regenerated in the animation loop.
    for (let i = 0; i < 100; i++) {
      c.strokeStyle = i % 2 ? '#82908b07' : '#050d1409'; c.lineWidth = 0.6;
      const y = random() * 164;
      c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(65, y + 9, 144, y + 3); c.stroke();
    }
    for (let i = 0; i < 9; i++) {
      c.strokeStyle = i % 2 ? '#8992890c' : '#00060a22'; c.lineWidth = 2 + i % 3;
      c.beginPath(); c.moveTo(i * 17, 0); c.quadraticCurveTo(i * 17 - 10, 80, i * 17 + 6, 164); c.stroke();
    }
    c.restore();
  });
  region('flag', 355, 387, 340, 220, (c, t) => {
    const breeze = sharedWind(t), strength = Math.abs(paintWind);
    const direction = paintWind < 0 ? -1 : 1;
    const extent = direction * (0.23 + strength * 0.77);
    c.save(); c.translate(164, 0); c.scale(extent, 1);
    for (let i = 0; i < 12; i++) {
      const x = i * 12, p = x / 144;
      const flutter = Math.sin(t * 3.1 - p * 5.5) * 6 * strength * p;
      const sag = (1 - strength) * p * 25;
      c.drawImage(cloth, x, 0, 12, 164, x, sag + flutter + breeze * p * 7, 12.5, 164);
    }
    c.restore();
    // Fixed attachment cords; the first strip displacement is exactly zero.
    c.strokeStyle = '#8b806452'; c.lineWidth = 1;
    for (const y of [14, 125]) { c.beginPath(); c.moveTo(158, y); c.lineTo(166, y); c.stroke(); }
  });

  const tufts = [[60, 679, 145, 105], [674, 777, 135, 105], [1410, 755, 145, 130], [1285, 819, 105, 90]];
  tufts.forEach(([x, y, w, h], cluster) => {
    const blades = Array.from({ length: 9 }, (_, i) => ({ root: w * 0.5 + (random() - 0.5) * 33, height: h * (0.3 + random() * 0.5), lean: (random() - 0.5) * 53, phase: random() * TAU, tone: i % 3 }));
    region('grass', x, y, w, h, (c, t) => {
      const breeze = sharedWind(t);
      blades.forEach(blade => {
        const bend = breeze * 22 + Math.abs(paintWind) * Math.sin(t * 1.9 + blade.phase + cluster) * 3;
        const rootY = h - 6;
        c.strokeStyle = ['#7c80615c', '#a5a1826a', '#535f5166'][blade.tone];
        c.lineWidth = 1.1;
        c.beginPath(); c.moveTo(blade.root, rootY);
        c.bezierCurveTo(blade.root + blade.lean * 0.1, rootY - blade.height * 0.4, blade.root + blade.lean * 0.5 + bend * 0.65, rootY - blade.height, blade.root + blade.lean + bend, rootY - blade.height);
        c.stroke();
      });
    });
  });
}

function paintRegion(item) {
  paintWind = effects[item.id].paintWind;
  const c = item.context;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, item.canvas.width, item.canvas.height);
  c.setTransform(item.canvas.width / item.width, 0, 0, item.canvas.height / item.height, 0, 0);
  item.paint(c, effects[item.id].time);
  item.draws++;
}

function resize() {
  if (!ready) return;
  const ratio = Math.min(devicePixelRatio || 1, 1.5) * scene.clientWidth / 1672;
  for (const item of regions) {
    const w = Math.max(1, Math.ceil(item.width * ratio));
    const h = Math.max(1, Math.ceil(item.height * ratio));
    if (item.canvas.width !== w || item.canvas.height !== h) {
      item.canvas.width = w; item.canvas.height = h;
      paintRegion(item); // A size change redraws the same phase, including frozen effects.
    }
  }
  updateMetrics();
}

const activeCount = () => Object.values(effects).filter(e => e.enabled).length;
const runnable = () => ready && playing && !document.hidden && intersecting && activeCount() > 0;

function syncLoop() {
  if (!runnable()) { cancelAnimationFrame(raf); raf = 0; lastFrame = 0; }
  else if (!raf) { lastFrame = 0; raf = requestAnimationFrame(frame); }
  playButton.textContent = playing ? '전체 정지' : '전체 재생';
  playButton.setAttribute('aria-pressed', String(playing));
  document.querySelector('#status').textContent = !playing && reducedMotion.matches && !explicitPlayback
    ? '동작 줄이기 설정으로 정지 중 · 전체 재생으로 시작할 수 있습니다.'
    : '작은 영역만 움직입니다 · 효과를 끄면 그 프레임에 멈춥니다.';
  updateMetrics();
}

function frame(now) {
  raf = 0;
  if (!runnable()) return;
  if (!lastFrame) lastFrame = now;
  const elapsed = now - lastFrame;
  // Schedule from the last rendered frame: never catch up with multiple renders.
  if (elapsed >= 1000 / 30) {
    const dt = Math.min(elapsed / 1000, 0.1);
    lastFrame = now;
    const start = performance.now();
    for (const effect of Object.values(effects)) if (effect.enabled) { effect.time += dt; effect.paintWind = wind; }
    for (const item of regions) if (effects[item.id].enabled) paintRegion(item);
    const cpu = performance.now() - start;
    samples.push(cpu); if (samples.length > 180) samples.shift();
    renderedFrames++;
    if (now - lastMetric > 700) { updateMetrics(); lastMetric = now; }
  }
  raf = requestAnimationFrame(frame);
}

function snapshot() {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    ready, playing, running: runnable() && !!raf, hidden: document.hidden, intersecting,
    wind, renderedFrames, activeEffects: activeCount(), samples: samples.length,
    cpuMeanMs: samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : null,
    cpuP95Ms: sorted.length ? sorted[Math.ceil(sorted.length * 0.95) - 1] : null,
    canvasPixels: regions.reduce((n, r) => n + r.canvas.width * r.canvas.height, 0),
    activeCanvasPixels: regions.filter(r => effects[r.id].enabled).reduce((n, r) => n + r.canvas.width * r.canvas.height, 0),
    dprCap: 1.5,
    regions: regions.map(r => ({ effect: r.id, x: r.x, y: r.y, width: r.width, height: r.height, pixels: r.canvas.width * r.canvas.height, draws: r.draws, time: effects[r.id].time }))
  };
}

function updateMetrics() {
  if (!ready) return;
  const s = snapshot();
  metrics.textContent = `${runnable() ? '재생' : '정지'} · 활성 ${s.activeEffects}/5 · 캔버스 ${s.canvasPixels.toLocaleString()} px · 갱신 ${runnable() ? s.activeCanvasPixels.toLocaleString() : 0} px · CPU 평균 ${s.cpuMeanMs === null ? '—' : s.cpuMeanMs.toFixed(2)} / p95 ${s.cpuP95Ms === null ? '—' : s.cpuP95Ms.toFixed(2)} ms (${s.samples}프레임)`;
}

playButton.addEventListener('click', () => { explicitPlayback = true; playing = !playing; syncLoop(); });
document.querySelectorAll('[data-effect]').forEach(button => button.addEventListener('click', () => {
  const effect = effects[button.dataset.effect];
  effect.enabled = !effect.enabled;
  button.setAttribute('aria-pressed', String(effect.enabled));
  syncLoop();
}));
windInput.addEventListener('input', () => {
  wind = Number(windInput.value);
  document.querySelector('#wind-value').textContent = wind === 0 ? '무풍 0' : `${wind < 0 ? '왼쪽' : '오른쪽'} ${Math.abs(wind).toFixed(2)}`;
});
document.addEventListener('visibilitychange', syncLoop);
new IntersectionObserver(entries => { intersecting = entries[0].isIntersecting; syncLoop(); }).observe(scene);
new ResizeObserver(resize).observe(scene);
reducedMotion.addEventListener('change', () => { if (!explicitPlayback) { playing = !reducedMotion.matches; syncLoop(); } });
// Read-only diagnostics for this demo's focused browser check.
window.environmentMotion = Object.freeze({ snapshot });

try {
  await image.decode();
  prepareArt(); ready = true; resize();
  for (const item of regions) if (!item.draws) paintRegion(item);
  syncLoop();
} catch (error) {
  document.querySelector('#status').textContent = '배경을 불러오지 못했습니다. 페이지를 새로 열어 주세요.';
  playButton.disabled = true;
  console.error(error);
}
