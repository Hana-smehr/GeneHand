import { HandLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0';

const viewer = $3Dmol.createViewer('viewer', { backgroundColor: 'black' });
const qBox = document.getElementById('q');
const resultsBox = document.getElementById('results');

function loadMolecule(pdbId) {
  viewer.clear();
  $3Dmol.download('pdb:' + pdbId, viewer, {}, () => {
    viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
    viewer.zoomTo();
    viewer.render();
  });
}

async function searchPDB(text) {
  const request = {
    query: { type: 'terminal', service: 'full_text', parameters: { value: text } },
    return_type: 'entry',
    request_options: { paginate: { start: 0, rows: 10 } }
  };
  const r = await fetch('https://search.rcsb.org/rcsbsearch/v2/query?json=' +
                        encodeURIComponent(JSON.stringify(request)));
  if (r.status === 204) return [];                 // no results
  if (!r.ok) throw new Error('Search failed: ' + r.status + ' ' + (await r.text()));
  const data = await r.json();
  return data.result_set.map(x => x.identifier);
}

async function getTitle(id) {
  const r = await fetch('https://data.rcsb.org/rest/v1/core/entry/' + id);
  const d = await r.json();
  return d.struct.title;
}

async function runSearch() {
  const text = qBox.value.trim();
  if (!text) return;
  resultsBox.textContent = 'Searching...';
  try {
    const ids = await searchPDB(text);
    if (!ids.length) { resultsBox.textContent = 'No results'; return; }
    const titles = await Promise.all(ids.map(id => getTitle(id).catch(() => '')));
    resultsBox.innerHTML = '';
    ids.forEach((id, i) => {
      const item = document.createElement('div');
      item.textContent = id + ' - ' + titles[i];
      item.style.cssText = 'padding:6px 8px; cursor:pointer; border-bottom:1px solid #444';
      item.onclick = () => { loadMolecule(id); resultsBox.innerHTML = ''; };
      resultsBox.appendChild(item);
    });
  } catch (e) {
    resultsBox.textContent = 'Error: ' + e.message;
  }
}

qBox.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });

loadMolecule('1BNA');   // default molecule
const video = document.getElementById('cam');
video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });

const fileset = await FilesetResolver.forVisionTasks(
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm');
const handLandmarker = await HandLandmarker.createFromOptions(fileset, {
  baseOptions: { modelAssetPath:
    'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' },
  runningMode: 'VIDEO',
  numHands: 2
});

function loop() {
  if (video.readyState >= 2) {
    const result = handLandmarker.detectForVideo(video, performance.now());
    handleHands(result.landmarks);   // تعداد دست‌های دیده‌شده
  }
  requestAnimationFrame(loop);
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const handSize = (h) => dist(h[0], h[9]);               
const pinchRatio = (h) => dist(h[4], h[8]) / handSize(h); 

let pinching = false;               
let prev = null, sx = null, sy = null;
let prevDist = null, smoothD = null;

function updatePinch(h) {
  const r = pinchRatio(h);
  if (!pinching && r < 0.3) pinching = true;
  else if (pinching && r > 0.5) pinching = false;
  return pinching;
}

function handleHands(hands) {
  document.getElementById('dbg').textContent = hands.length
    ? 'hands=' + hands.length + '  pinch=' + pinchRatio(hands[0]).toFixed(2)
    : 'no hand';

  
  if (hands.length === 2) {
    pinching = false; prev = null; sx = null; sy = null;
    const d = dist(hands[0][9], hands[1][9]);               
    smoothD = smoothD === null ? d : smoothD + 0.3 * (d - smoothD);
    if (prevDist === null) prevDist = smoothD;
    let f = smoothD / prevDist;
    if (Math.abs(f - 1) > 0.01) {                           
      f = Math.min(1.1, Math.max(0.9, f));
      viewer.zoom(f, 0);
      viewer.render();
      prevDist = smoothD;
    }
    return;
  }
  prevDist = null; smoothD = null;

  
  if (hands.length === 1 && updatePinch(hands[0])) {
    const h = hands[0];
    const mx = (h[4].x + h[8].x) / 2, my = (h[4].y + h[8].y) / 2;  
    sx = sx === null ? mx : sx + 0.35 * (mx - sx);
    sy = sy === null ? my : sy + 0.35 * (my - sy);
    if (prev) {
      const dx = sx - prev.x, dy = sy - prev.y;
      if (Math.hypot(dx, dy) > 0.002) {
        viewer.rotate(-dx * 250, 'y', 0);
        viewer.rotate(dy * 250, 'x', 0);
        viewer.render();
      }
    }
    prev = { x: sx, y: sy };
  } else {
    pinching = false; prev = null; sx = null; sy = null;
  }
}
loop();