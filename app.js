import { HandLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0';

const viewer = $3Dmol.createViewer('viewer', { backgroundColor: 'black' });
$3Dmol.download('pdb:1BNA', viewer, {}, () => {
  viewer.setStyle({}, { stick: {} });
  viewer.zoomTo();
  viewer.render();
});
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
const handSize = (h) => dist(h[0], h[9]);                  // مچ تا شروع انگشت میانی
const pinchRatio = (h) => dist(h[4], h[8]) / handSize(h);  // نسبت فاصله‌ی شست و اشاره به اندازه‌ی دست

let pinching = false;                // با دو آستانه، تا قطع و وصل نشود
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

  // زوم: دو دست در تصویر، بدون نیاز به pinch
  if (hands.length === 2) {
    pinching = false; prev = null; sx = null; sy = null;
    const d = dist(hands[0][9], hands[1][9]);               // فاصله‌ی مرکز کف دو دست
    smoothD = smoothD === null ? d : smoothD + 0.3 * (d - smoothD);
    if (prevDist === null) prevDist = smoothD;
    let f = smoothD / prevDist;
    if (Math.abs(f - 1) > 0.01) {                           // تغییرهای ریز نادیده گرفته می‌شوند
      f = Math.min(1.1, Math.max(0.9, f));
      viewer.zoom(f, 0);
      viewer.render();
      prevDist = smoothD;
    }
    return;
  }
  prevDist = null; smoothD = null;

  // چرخش: یک دست با pinch
  if (hands.length === 1 && updatePinch(hands[0])) {
    const h = hands[0];
    const mx = (h[4].x + h[8].x) / 2, my = (h[4].y + h[8].y) / 2;  // وسط شست و اشاره
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