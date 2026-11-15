// Face tracking + Filter Engine + AI Expression Effects (runs fully in the browser)
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export async function loadTracker() {
  const fs = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
  return FaceLandmarker.createFromOptions(fs, {
    baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', delegate: 'GPU' },
    runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true
  });
}

// color grading = [blend mode, color 1, color 2, strength]
const GRADES = { neon: ['overlay', '#ff00d4', '#00e5ff', 0.6], cyber: ['color', '#00e5ff', '#ff2ea6', 0.7], vintage: ['multiply', '#e3c58f', '#e3c58f', 0.65], bw: ['saturation', '#808080', '#808080', 1] };
const THRESHOLD = { smile: 0.5, brow: 0.5, mouth: 0.6 };   // tuned during testing (Chapter 5)
const score = (bs, n) => bs?.find(c => c.categoryName === n)?.score || 0;
export const expressions = bs => ({ smile: (score(bs, 'mouthSmileLeft') + score(bs, 'mouthSmileRight')) / 2, brow: score(bs, 'browInnerUp'), mouth: score(bs, 'jawOpen') });
let parts = [];

export function render(ctx, video, res, { color, overlay, ai }) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, W, H); ctx.restore();   // mirrored selfie view
  if (color && GRADES[color.grade]) {
    const [op, c1, c2, a] = GRADES[color.grade], g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.globalCompositeOperation = op; ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  const lm = res?.faceLandmarks?.[0];
  if (!lm) return false;
  const P = i => ({ x: (1 - lm[i].x) * W, y: lm[i].y * H }), mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const A = P(454), B = P(234), fw = Math.hypot(B.x - A.x, B.y - A.y), roll = Math.atan2(B.y - A.y, B.x - A.x);
  const top = P(10), cen = mid(top, P(152)), mouth = P(13);
  const anchors = { eyes: mid(P(33), P(263)), forehead: { x: top.x, y: top.y - fw * 0.15 }, nose: P(1), mouth, chin: P(152) };

  if (overlay?.emoji) {                                  // overlay filter: emoji glued to a face landmark
    const p = anchors[overlay.anchor] || cen;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(roll); ctx.font = `${fw * (overlay.scale || 1)}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(overlay.emoji, 0, 0); ctx.restore();
  }
  if (ai) {                                              // AI expression filter: blendshape score above threshold
    const e = expressions(res.faceBlendshapes?.[0]?.categories);
    if (e[ai.trigger] > THRESHOLD[ai.trigger]) {
      if (ai.effect === 'rainbow') {
        ctx.save(); ctx.lineWidth = fw * 0.07; ctx.shadowBlur = 25;
        for (let i = 0; i < 3; i++) { const c = `hsl(${(performance.now() / 8 + i * 50) % 360},100%,60%)`; ctx.strokeStyle = ctx.shadowColor = c; ctx.beginPath(); ctx.ellipse(cen.x, cen.y, fw * (0.62 + i * 0.09), fw * (0.78 + i * 0.09), roll, 0, 7); ctx.stroke(); }
        ctx.restore();
      } else for (let i = 0; i < 4; i++) {
        const fire = ai.effect === 'fire';
        parts.push({ x: fire ? mouth.x : cen.x + (Math.random() - 0.5) * fw, y: fire ? mouth.y : top.y, vx: (Math.random() - 0.5) * 4, vy: fire ? -2 - Math.random() * 3 : 1 + Math.random() * 3, l: 1, c: `hsl(${Math.random() * 360},100%,60%)`, fire });
      }
    }
  }
  parts = parts.filter(p => p.l > 0);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.l -= 0.02; ctx.globalAlpha = Math.max(p.l, 0);
    if (p.fire) { ctx.font = '28px serif'; ctx.fillText('🔥', p.x, p.y); } else { ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 8, 8); }
  }
  ctx.globalAlpha = 1;
  return true;
}
