// THE LITTLE LIGHTHOUSE — a 50 s hand-inked cel film, drawn in code.
// Every drawing is a pure function of t (frame/time); boil = re-rolled seeds per drawing.
import {
  mulberry32, N3, GLOBAL, hs, hr, clamp, lerp, inv, sstep, E, K,
  spline, arclen, resample, xf, circlePts, boil, outline, polyPath, fillPoly,
  inkStroke, inkLoop, fillShape, hatch, Layers, blit,
} from './ink.js';

export const W = 1920, H = 1080, FPS = 24, DUR = 50;

// ---------------------------------------------------------------- palette
const C = {
  ink: '#241a15', ink2: '#33251c',
  paper: '#efe3c8', paper2: '#e2d2b1',
  night: '#1e3039', night2: '#2c4752', night3: '#152229', sky: '#12212a',
  wood: '#6d452c', woodDark: '#46291c', woodHi: '#8a5c3d',
  warm: '#ffc65c', warmCore: '#ffdd9a', ember: '#e2662c',
  moon: '#b9d4dc', moonCore: '#e8f2f4', glass: '#7fa6b0',
  enamel: '#33544f', enamelHi: '#4d7268', brass: '#c08a3e', brassDark: '#8f5f24',
  book1: '#8c3b2c', book2: '#3f5a4e', book3: '#b07a35', cream: '#f7ecd2',
  red: '#b8402a',
};

// ---------------------------------------------------------------- world geometry
const DESK = 800, DESK_FRONT = 866;
const WIN = { x0: 1288, y0: 96, x1: 1642, y1: 660 };
const MOONP = { x: 1552, y: 248, r: 84 };
const LX = 686, BASEY = DESK + 10;
const PIVH = 318;                            // shade socket height above the base
const PICT = { x0: 268, y0: 190, x1: 492, y1: 388 };
const BOOKS = { x: 1160, y: DESK + 8 };
const MUG = { x: 1018, y: DESK + 12 };
const SHADE_R = 84, SHADE_H = 112, SHADE_TOP = 30;

const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const mouthWorld = (L) => [L.px + Math.sin(L.shadeAng) * SHADE_H, L.py + Math.cos(L.shadeAng) * SHADE_H];

// ---------------------------------------------------------------- state: the acting
function lampState(t) {
  const hop = K(t, [
    [0, 0], [1.9, 0], [2.05, -3, 'out3'], [2.25, 0, 'outBack'],
    [3.0, 0], [3.12, -13, 'out3'], [3.5, 0, 'outBack'],
    [9.55, 0], [9.75, -9, 'out3'], [10.0, 0, 'outBack'],
    [13.3, 0], [13.45, -5, 'out3'], [13.65, 0, 'outBack'],
    [16.85, 0], [17.0, -10, 'out3'], [17.3, 0, 'outBack'],
    [19.35, 0], [19.45, -7, 'out3'], [19.7, 0, 'outBack'],
    [26.2, 0], [26.8, -16, 'out2'], [27.0, 2, 'in3'], [27.35, 0, 'out3'],
    [33.9, 0], [34.3, -4, 'out3'], [34.7, 0, 'outBack'],
    [36.6, 0], [36.9, -6, 'out3'], [37.3, 0, 'outBack'],
    [50, 0],
  ]);
  const shadeAng = K(t, [
    [0, -0.10], [0.35, -0.10],
    [1.55, 0.58, 'io2'], [2.15, 0.56], [2.75, -0.04, 'io3'],
    [3.4, 0.22, 'out3'], [4.1, -0.34, 'io3'], [4.9, 0.42, 'io3'],
    [5.7, -0.46, 'io3'], [6.5, 0.40, 'io3'], [7.3, -0.30, 'io3'], [8.1, 0.30, 'io3'],
    [8.9, -0.12, 'io2'], [9.5, 0.06, 'out2'],
    [9.6, 0.02],
    [10.1, -1.2, 'out3'], [11.15, -1.2],
    [12.35, 1.18, 'io3'], [12.8, 1.18],
    [13.3, -0.05, 'out3'],
    [13.7, -1.14, 'out3'], [15.25, 1.16, 'io3'], [15.9, 0.55, 'out3'],
    [16.85, 0.55], [17.15, -0.5, 'out3'], [17.7, -0.9, 'out3'], [19.05, -0.9],
    [19.4, 0.76, 'out3'], [20.25, 0.58],
    [20.95, -0.84, 'out3'], [21.5, -0.78],
    [23.5, -0.52],
    [24.2, 0.18, 'io2'], [24.9, 0.12],
    [25.45, 0.02, 'out2'], [26.05, 0.0],
    [26.35, -0.32, 'out2'], [26.85, -0.36],
    [27.06, 0.62, 'in3'], [28.1, 0.84], [30.0, 0.88], [33.3, 0.6],
    [29.85, 0.65], [30.05, 0.62, 'out3'],
    [31.6, 0.6], [33.3, 0.32, 'io2'], [34.2, 0.1],
    [35.3, 0.52, 'io2'], [36.5, 1.0, 'io3'],
    [37.7, 0.94], [38.8, -0.76, 'io3'], [39.9, 0.62, 'io3'],
    [41.4, -0.6, 'io3'], [43.2, 0.52, 'io3'], [45.0, -0.3, 'io3'], [47.0, 0.42, 'io3'], [48.6, 0.06, 'io3'],
    [50, 0.06],
  ]);
  const bright = K(t, [
    [0, 0], [2.99, 0],
    [3.05, 0.55, 'lin'], [3.12, 0.1, 'lin'], [3.22, 1.0, 'out3'], [3.4, 0.62], [3.62, 1.0, 'out3'],
    [9.5, 1.0], [9.66, 1.15], [10.4, 1.0],
    [24.0, 1.0], [25.4, 1.06],
    [26.25, 1.05], [26.8, 1.5, 'in2'], [26.99, 1.55],
    [27.02, 0, 'lin'], [28.6, 0],
    [50, 0],
  ]);
  const faceMix = K(t, [[0, 0], [24.92, 0], [25.22, 1, 'out3'], [25.84, 1], [25.99, 0, 'in2'], [50, 0]]);
  // the shake-off: a violent, decaying rattle with its own overshoot, not a quiver
  const shakeEnv = K(t, [[0, 0], [21.22, 0], [21.38, 1, 'lin'], [22.55, 0.9], [23.15, 0.28], [23.6, 0], [50, 0]]);
  const shake = Math.sin((t - 21.22) * 54) * shakeEnv * 27;
  const shakeY = Math.cos((t - 21.22) * 49) * shakeEnv * 8;
  const squash = K(t, [[0, 1], [3.0, 1], [3.2, 0.9], [3.5, 1.02], [3.8, 1], [26.9, 1], [27.05, 0.86], [27.5, 0.94], [28.2, 0.91], [33.6, 0.95], [36.2, 1], [50, 1]]);
  const lean = K(t, [[0, 0], [0.4, 0], [1.55, 7, 'io2'], [2.2, 6], [2.8, 0, 'io3'], [3.4, 0], [9.6, 2], [13.2, 0], [17.2, -7], [19.4, 5], [21.4, -3], [26.1, 0], [27.2, 8], [31.0, 10], [34.6, 2], [36.6, 1], [50, 0]]);
  const beatBounce = (t > 3.1 && t < 26.2) || t > 32 ? Math.max(0, Math.sin(t * Math.PI * 2)) * 2.6 : 0;
  const slump = K(t, [[0, 0], [26.2, 0], [27.35, 22, 'out2'], [28.7, 33], [31.4, 34], [34.4, 9, 'io2'], [36.4, 2], [50, 0]]);
  return {
    hop: hop - beatBounce - slump - Math.abs(shakeY) * 0.25,
    shadeAng: shadeAng + Math.sin((t - 21.22) * 66) * shakeEnv * 0.36
      + K(t, [[0, 0], [30.5, 0], [33.5, 0.075], [37.0, -0.055], [41.5, 0.045], [46.5, -0.01], [50, 0]]),
    bright, faceMix, shake, squash: squash * (1 + beatBounce * 0.004), lean,
    baseX: LX + shake * 0.5, px: LX + lean, py: BASEY + hop - PIVH,
    ember: K(t, [[0, 0], [26.99, 0], [27.03, 1], [28.5, 0.45], [29.2, 0], [50, 0]]),
    moonIn: K(t, [[0, 0], [35.9, 0], [37.1, 1, 'io2'], [38.6, 0.75], [41.0, 0.7], [43.5, 0.85], [50, 0.8]]),
  };
}

function mothState(t) {
  const fx = K(t, [
    [15.55, 1760], [16.45, 1010, 'out3'], [16.85, 806, 'io2'], [17.1, 906, 'out3'],
    [17.65, 556, 'io3'], [18.3, 606, 'io2'], [18.85, 622, 'io2'], [19.15, 512, 'out3'],
    [19.7, 908, 'io3'], [20.45, 770, 'io3'], [20.9, 642, 'io2'], [21.15, 566, 'io2'],
    [21.55, 872, 'out3'], [22.25, 1058, 'io3'], [22.8, 618, 'io3'], [23.45, 1012, 'io3'],
    [23.95, 848, 'io2'], [24.4, 762, 'io2'], [24.75, 744, 'out3'],
    [28.9, 800], [29.35, 742, 'io2'], [29.7, 700, 'io2'],
    [37.35, 712], [37.8, 1130, 'out3'], [38.5, 962, 'io2'], [39.1, 790, 'io2'], [39.55, 726, 'out3'],
    [50, 720],
  ]);
  const fy = K(t, [
    [15.55, 300], [16.45, 402, 'out3'], [16.85, 540, 'io2'], [17.1, 452, 'out3'],
    [17.65, 400, 'io3'], [18.3, 348, 'io2'], [18.85, 448, 'io2'], [19.15, 526, 'out3'],
    [19.7, 368, 'io3'], [20.45, 414, 'io3'], [20.9, 458, 'io2'], [21.15, 518, 'io2'],
    [21.55, 338, 'out3'], [22.25, 452, 'io3'], [22.8, 542, 'io3'], [23.45, 410, 'io3'],
    [23.95, 462, 'io2'], [24.4, 482, 'io2'], [24.75, 486, 'out3'],
    [28.9, 388], [29.35, 446, 'io2'], [29.7, 470, 'io2'],
    [37.35, 470], [37.8, 318, 'out3'], [38.5, 394, 'io2'], [39.1, 444, 'io2'], [39.55, 468, 'out3'],
    [50, 470],
  ]);
  const perch = K(t, [
    [0, 0], [24.45, 0], [24.85, 1, 'out3'], [29.0, 1], [29.28, 0, 'in2'],
    [29.9, 0], [30.15, 1, 'out3'], [37.3, 1], [37.5, 0, 'in2'],
    [39.4, 0], [39.7, 1, 'out3'], [50, 1],
  ]);
  const wing = K(t, [
    [0, 1], [24.6, 1], [24.9, 0.1], [29.0, 0.12], [29.3, 1],
    [30.1, 0.1], [37.3, 0.1], [37.55, 1], [39.5, 0.1], [50, 0.1],
  ]);
  const wob = Math.sin(t * 7.3) * 7 * (1 - perch);
  const wob2 = Math.cos(t * 5.1) * 5 * (1 - perch);
  return { fx: fx + wob, fy: fy + wob2, perch, wing, flap: t * 27.5, ang: Math.sin(t * 3.1) * 0.18 };
}

function camera(t) {
  const shots = [
    [0.0, 2.5, 1.24, 1150, 486, 1096, 500],
    [2.5, 8.5, 1.0, 944, 608, 950, 598],
    [8.5, 12.5, 1.92, 690, 568, 704, 556],
    [12.5, 14.0, 1.42, 900, 600, 884, 592],
    [14.0, 16.0, 3.20, 376, 288, 384, 296],
    [16.0, 17.5, 1.06, 1004, 602, 984, 596],
    [17.5, 19.0, 3.05, 700, 486, 690, 480],
    [19.0, 20.5, 1.28, 806, 664, 824, 652],
    [20.5, 22.0, 3.55, 700, 520, 706, 514],
    [22.0, 23.5, 2.75, 704, 526, 694, 518],
    [23.5, 26.0, 1.62, 720, 560, 712, 550],
    [26.0, 31.0, 1.7, 700, 598, 696, 588],
    [31.0, 36.0, 1.0, 956, 606, 962, 598],
    [36.0, 40.0, 1.84, 758, 536, 738, 526],
    [40.0, 47.0, 1.0, 936, 606, 976, 594],
    [47.0, 49.1, 1.36, 880, 566, 836, 550],
    [49.1, 50.0, 1.36, 836, 550, 830, 548],
  ];
  let s = null;
  for (const sh of shots) if (t >= sh[0] && t < sh[1]) s = sh;
  if (!s) s = shots[shots.length - 1];
  const u = E.io2(inv(s[0], s[1], t));
  let x = lerp(s[3], s[5], u), y = lerp(s[4], s[6], u), sc = s[2] * (0.985 + 0.085 * u);
  // a constant, living drift on top of the shot move
  const span = s[1] - s[0];
  x += Math.sin((t - s[0]) * 0.55) * span * 1.9 + Math.sin(t * 0.31) * 6;
  y += Math.cos((t - s[0]) * 0.44) * span * 1.1 + Math.sin(t * 0.27) * 5;
  x += (hs(Math.floor(t * 8), 3) - 0.5) * 3 / sc;
  y += (hs(Math.floor(t * 8), 5) - 0.5) * 3 / sc;
  const bump = (t0, amt, dur) => (t >= t0 && t < t0 + dur ? Math.cos((t - t0) / dur * Math.PI * 2) * amt * (1 - (t - t0) / dur) : 0);
  x += bump(27.0, 13, 0.34) + bump(16.88, 6, 0.22) + bump(19.4, 5, 0.2);
  y += bump(27.0, 9, 0.34) * 0.8;
  return { s: sc, x, y };
}

function state(t) {
  const L = lampState(t);
  const M = mothState(t);
  const cam = camera(t);
  const mouth = mouthWorld(L);
  const local = [62, -14];
  M.x = lerp(M.fx, mouth[0] + local[0], M.perch);
  M.y = lerp(M.fy, mouth[1] + local[1], M.perch);
  const moonAmt = K(t, [[0, 0.34], [3.6, 0.13], [26.9, 0.13], [29.4, 0.20], [31.2, 0.72], [34, 0.85], [36.5, 0.95], [50, 0.98]]);
  const refl = K(t, [[0, 0], [35.8, 0], [37.2, 0.85, 'io2'], [38.8, 0.55], [41.5, 0.5], [43.5, 0.62], [46, 0.55], [50, 0.5]]);
  const dim = K(t, [[0, 0], [44.4, 0], [45.6, 1, 'io2'], [50, 1]]);
  const fm = K(t, [[0, 0], [24.86, 0], [25.16, 1, 'out3'], [25.86, 1], [26.02, 0, 'in2'], [50, 0]]);
  return { t, L, M, cam, moonAmt, refl, dim, fm };
}

// ---------------------------------------------------------------- room
function drawSky(c, s, sd) {
  fillShape(c, rectPts(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), C.sky, { seed: sd + 11, amp: 2.4 });
  fillShape(c, [[WIN.x0, 566], [WIN.x0 + 86, 520], [WIN.x0 + 168, 548], [WIN.x0 + 246, 506], [WIN.x0 + 322, 542], [WIN.x1, 514], [WIN.x1, WIN.y1], [WIN.x0, WIN.y1]], '#0f1b22', { seed: sd + 12, amp: 3 });
  const mx = MOONP.x, my = MOONP.y, mr = MOONP.r;
  c.save();
  c.beginPath(); c.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0); c.clip();
  [[mr * 2.0, 0.04], [mr * 1.55, 0.06]].forEach(([r, a], i) => {
    c.save(); c.globalCompositeOperation = 'screen';
    fillShape(c, circlePts(mx, my, r), `rgba(190,220,228,${a})`, { seed: sd + 20 + i, amp: 2.6 });
    c.restore();
  });
  fillShape(c, circlePts(mx, my, mr * 2.0), 'rgba(214,236,242,0.03)', { seed: sd + 21, amp: 3 });
  c.restore();
  fillShape(c, circlePts(mx, my, mr), C.moonCore, { seed: sd + 30, amp: 1.2 });
  [[-24, -18, 14], [16, 12, 11], [-4, 28, 8], [28, -32, 6]].forEach(([dx, dy, r], i) => {
    fillShape(c, circlePts(mx + dx, my + dy, r), 'rgba(150,180,190,0.45)', { seed: sd + 40 + i, amp: 1.2 });
  });
  inkLoop(c, circlePts(mx, my, mr), { seed: sd + 50, w: 2.4, amp: 1.1, color: 'rgba(36,26,21,0.5)' });
}

function drawWindow(c, s, sd) {
  drawSky(c, s, sd);
  const w = WIN.x1 - WIN.x0, h = WIN.y1 - WIN.y0;
  const mx = WIN.x0 + w / 2, my = WIN.y0 + h * 0.44;
  fillShape(c, rectPts(mx - 6, WIN.y0, 12, h), C.night2, { seed: sd + 60, amp: 1.2, dx: 2, dy: 2 });
  fillShape(c, rectPts(WIN.x0, my - 6, w, 12), C.night2, { seed: sd + 61, amp: 1.2, dx: 2, dy: 2 });
  inkStroke(c, [[mx, WIN.y0], [mx, WIN.y1]], { seed: sd + 62, w: 5, amp: 1.1, t0: 30, t1: 30 });
  inkStroke(c, [[WIN.x0, my], [WIN.x1, my]], { seed: sd + 63, w: 5, amp: 1.1, t0: 30, t1: 30 });
  // frame
  const outer = rectPts(WIN.x0 - 20, WIN.y0 - 20, w + 40, h + 40);
  const inner = rectPts(WIN.x0, WIN.y0, w, h);
  c.save(); c.beginPath(); polyPath(c, outer); polyPath(c, inner);
  c.fillStyle = C.night3; c.fill('evenodd'); c.restore();
  inkLoop(c, outer, { seed: sd + 64, w: 6, amp: 1.4 });
  inkLoop(c, inner, { seed: sd + 65, w: 4.5, amp: 1.2 });
  // sill
  fillShape(c, rectPts(WIN.x0 - 44, WIN.y1 + 20, w + 88, 24), C.night2, { seed: sd + 66, amp: 1.4, dx: 2, dy: 3 });
  inkStroke(c, [[WIN.x0 - 48, WIN.y1 + 20], [WIN.x1 + 48, WIN.y1 + 20]], { seed: sd + 67, w: 5.5, amp: 1.2, t0: 30, t1: 30 });
  c.save(); c.globalCompositeOperation = 'screen';
  inkStroke(c, [[WIN.x0 - 7, WIN.y0 - 9], [WIN.x1 + 7, WIN.y0 - 9]], { seed: sd + 68, w: 3, amp: 1, t0: 8, t1: 8, color: 'rgba(186,220,232,0.34)' });
  fillShape(c, rectPts(WIN.x0 - 120, WIN.y0 - 120, (WIN.x1 - WIN.x0) + 240, (WIN.y1 - WIN.y0) + 260), 'rgba(150,196,214,0.09)', { seed: sd + 69, amp: 6 });
  c.restore();
}

function drawPicture(c, s, sd) {
  const { x0, y0, x1, y1 } = PICT;
  const b = 14;
  const inner = rectPts(x0 + b, y0 + b, x1 - x0 - 2 * b, y1 - y0 - 2 * b);
  fillShape(c, rectPts(x0 + 9, y0 + 13, x1 - x0, y1 - y0), 'rgba(10,18,24,0.42)', { seed: sd + 69, amp: 2.4 });
  fillShape(c, rectPts(x0, y0, x1 - x0, y1 - y0), '#453326', { seed: sd + 70, amp: 1.4, dx: 2, dy: 3 });
  fillShape(c, inner, '#c9b48a', { seed: sd + 71, amp: 1.6 });
  const ix0 = x0 + b, iy0 = y0 + b, iw = x1 - x0 - 2 * b, ih = y1 - y0 - 2 * b;
  fillShape(c, rectPts(ix0, iy0, iw, ih * 0.52), '#a3b6ae', { seed: sd + 72, amp: 1.8 });
  fillShape(c, rectPts(ix0, iy0 + ih * 0.52, iw, ih * 0.48), '#5d7d7c', { seed: sd + 73, amp: 1.8 });
  const tx = ix0 + iw * 0.5, ty = iy0 + ih * 0.3, tw = 30, th = ih * 0.52;
  const tower = [[tx - tw, ty + th], [tx + tw, ty + th], [tx + tw * 0.56, ty], [tx - tw * 0.56, ty]];
  fillShape(c, tower, C.cream, { seed: sd + 74, amp: 1.4 });
  for (let i = 0; i < 3; i++) {
    const yy = ty + 12 + i * 24, k = (yy - ty) / th, hw = tw * (1 - k * 0.44);
    fillShape(c, [[tx - hw, yy], [tx + hw, yy], [tx + hw, yy + 11], [tx - hw, yy + 11]], C.red, { seed: sd + 75 + i, amp: 1.2 });
  }
  fillShape(c, rectPts(tx - 15, ty - 18, 30, 18), '#2c3c3b', { seed: sd + 79, amp: 1 });
  fillShape(c, rectPts(tx - 10, ty - 14, 20, 10), C.warmCore, { seed: sd + 80, amp: 0.8 });
  // the painted lighthouse sweeps its own beam — the picture is the lamp's teacher
  const sw = 0.34 + 0.30 * Math.sin(s.t * 0.85);
  for (const dir of [1, -1]) {
    const L2 = 80, a = dir > 0 ? sw : Math.PI - sw;
    const ex = tx + Math.cos(a) * L2, ey = ty - 8 + Math.sin(a) * L2 * 0.42;
    const w0 = 4, w1 = 15;
    fillShape(c, [[tx + dir * 15, ty - 14], [tx + dir * 15, ty - 2], [ex, ey + w1 * 0.5], [ex, ey - w1 * 0.5]],
      'rgba(255,240,190,0.72)', { seed: sd + 81 + (dir > 0 ? 0 : 1), amp: 1.0 });
  }
  inkLoop(c, tower, { seed: sd + 83, w: 2.4, amp: 0.9, color: 'rgba(36,26,21,0.7)' });
  inkStroke(c, [[ix0, iy0 + ih * 0.52], [ix0 + iw, iy0 + ih * 0.52]], { seed: sd + 84, w: 2, amp: 0.9, color: 'rgba(36,26,21,0.45)', t0: 20, t1: 20 });
  inkLoop(c, inner, { seed: sd + 85, w: 2.6, amp: 1.1 });
  inkLoop(c, rectPts(x0, y0, x1 - x0, y1 - y0), { seed: sd + 86, w: 6, amp: 1.4 });
  inkLoop(c, rectPts(x0 + b, y0 + b, x1 - x0 - 2 * b, y1 - y0 - 2 * b), { seed: sd + 87, w: 2.2, amp: 1, color: 'rgba(36,26,21,0.5)' });
}

function drawRoom(c, s, sd) {
  fillShape(c, rectPts(-60, -60, W + 120, DESK + 60), C.night, { seed: sd + 1, amp: 2.6 });
  fillShape(c, rectPts(-60, 600, W + 120, DESK - 600 + 60), C.night2, { seed: sd + 2, amp: 2.2, dx: 2, dy: 2 });
  inkStroke(c, [[-60, 600], [W + 60, 600]], { seed: sd + 3, w: 4, amp: 1.4, t0: 24, t1: 24 });
  inkStroke(c, [[-60, 616], [W + 60, 616]], { seed: sd + 4, w: 2, amp: 1.2, color: 'rgba(36,26,21,0.3)', t0: 24, t1: 24 });
  for (let i = 0; i < 6; i++) {
    const x = 196 + i * 330;
    inkStroke(c, [[x, 624], [x, DESK - 10]], { seed: sd + 5 + i, w: 2.4, amp: 1.2, color: 'rgba(36,26,21,0.35)', t0: 20, t1: 20 });
  }
  drawWindow(c, s, sd);
  drawPicture(c, s, sd);
  // desk
  fillShape(c, rectPts(-60, DESK, W + 120, DESK_FRONT - DESK), C.wood, { seed: sd + 90, amp: 2.2 });
  fillShape(c, rectPts(-60, DESK_FRONT, W + 120, H - DESK_FRONT + 60), C.woodDark, { seed: sd + 91, amp: 2.6 });
  inkStroke(c, [[-60, DESK], [W + 60, DESK]], { seed: sd + 92, w: 6.5, amp: 1.4, t0: 30, t1: 30 });
  inkStroke(c, [[-60, DESK_FRONT], [W + 60, DESK_FRONT]], { seed: sd + 93, w: 2.4, amp: 1.2, color: 'rgba(36,26,21,0.45)', t0: 30, t1: 30 });
  for (let i = 0; i < 5; i++) {
    const y = DESK + 12 + i * 10;
    inkStroke(c, [[-20, y], [480, y + 3], [960, y - 2], [1440, y + 2], [W + 20, y]], { seed: sd + 94 + i, w: 1.5, amp: 1.1, color: 'rgba(36,26,21,0.2)', t0: 40, t1: 40 });
  }
}

function castShadow(c, poly, sd, a = 0.3) {
  fillShape(c, xf(poly, { x: 9, y: 7 }), `rgba(30,20,14,${a})`, { seed: sd, amp: 2.2 });
}

function drawProps(c, s, sd) {
  // sheet of paper on the desk under the lamp
  const sheet = [[544, 806], [906, 800], [922, 862], [532, 866]];
  castShadow(c, sheet, sd + 109, 0.22);
  fillShape(c, sheet, C.cream, { seed: sd + 110, amp: 2.2 });
  inkLoop(c, sheet, { seed: sd + 111, w: 2.2, amp: 1.2, color: 'rgba(36,26,21,0.5)' });
  for (let i = 0; i < 3; i++) {
    inkStroke(c, [[590, 824 + i * 12], [858, 820 + i * 12]], { seed: sd + 112 + i, w: 1.3, amp: 1, color: 'rgba(36,26,21,0.18)', t0: 20, t1: 20 });
  }
  // books
  const bx = BOOKS.x, by = BOOKS.y;
  [[196, 26, C.book1, 0], [172, 24, C.book2, -8], [146, 22, C.book3, 5]].forEach(([w, h, col, dx], i) => {
    const x = bx + dx, y = by - (i + 1) * 27;
    castShadow(c, rectPts(x, y, w, h), sd + 119 + i, 0.22);
    fillShape(c, rectPts(x, y, w, h), col, { seed: sd + 120 + i, amp: 1.8 });
    fillShape(c, rectPts(x + w - 12, y + 3, 12, h - 6), C.cream, { seed: sd + 124 + i, amp: 1.2 });
    inkLoop(c, rectPts(x, y, w, h), { seed: sd + 128 + i, w: 3, amp: 1.2 });
  });
  // mug
  const mx = MUG.x, my = MUG.y;
  castShadow(c, [[mx - 46, my - 4], [mx + 46, my - 4], [mx + 40, my + 4], [mx - 40, my + 4]], sd + 130, 0.26);
  fillShape(c, rectPts(mx - 42, my - 92, 84, 92), '#2f4a63', { seed: sd + 131, amp: 1.8 });
  fillShape(c, circlePts(mx, my - 92, 42), '#31506b', { seed: sd + 132, amp: 1.4 });
  fillShape(c, circlePts(mx, my - 93, 34), '#20323f', { seed: sd + 133, amp: 1.2 });
  fillShape(c, circlePts(mx, my - 95, 29), '#4a3524', { seed: sd + 134, amp: 1.2 });
  c.save();
  c.beginPath(); c.rect(mx - 42, my - 92, 84, 92); c.clip();
  fillShape(c, rectPts(mx - 42, my - 92, 15, 92), 'rgba(255,255,255,0.12)', { seed: sd + 135, amp: 1.4 });
  c.restore();
  inkLoop(c, [[mx - 42, my - 92], [mx + 42, my - 92], [mx + 42, my], [mx - 42, my]], { seed: sd + 136, w: 3.2, amp: 1.2 });
  inkStroke(c, [[mx + 42, my - 76], [mx + 72, my - 70], [mx + 74, my - 36], [mx + 42, my - 30]], { seed: sd + 137, w: 6, amp: 1.1, t0: 20, t1: 20 });
  inkLoop(c, circlePts(mx, my - 92, 42), { seed: sd + 138, w: 2.8, amp: 1 });
  // pencil (one, with a sharpened tip and a real point)
  castShadow(c, [[392, 846], [586, 848], [586, 856], [392, 854]], sd + 139, 0.24);
  const pen = [[420, 840], [586, 844], [586, 858], [420, 854]];
  fillShape(c, pen, '#d9a54a', { seed: sd + 140, amp: 1.1 });
  fillShape(c, [[420, 840], [586, 844], [586, 850], [420, 846]], '#e8bf6d', { seed: sd + 141, amp: 1.0 });
  fillShape(c, [[420, 840], [420, 854], [400, 850], [400, 845]], '#e6d3ab', { seed: sd + 143, amp: 0.8 });
  fillShape(c, [[400, 845], [404, 843], [404, 848], [400, 850]], C.ink, { seed: sd + 144, amp: 0.5 });
  inkStroke(c, [[420, 840], [586, 844]], { seed: sd + 145, w: 2.2, amp: 0.9, t0: 8, t1: 8 });
  inkStroke(c, [[420, 854], [586, 858]], { seed: sd + 146, w: 2.2, amp: 0.9, t0: 8, t1: 8 });
  inkStroke(c, [[420, 840], [420, 854]], { seed: sd + 147, w: 2, amp: 0.7, t0: 4, t1: 4 });
  // the lamp's cord, trailing off the desk edge
  inkStroke(c, [[LX + 20, BASEY + 6], [LX + 120, BASEY + 14], [LX + 240, BASEY + 8], [LX + 380, BASEY + 20], [LX + 520, BASEY + 14]], { seed: sd + 148, w: 4, amp: 1.4, t0: 10, t1: 30, color: 'rgba(26,18,14,0.85)' });
  // drawer line on the desk front
  inkStroke(c, [[300, DESK_FRONT + 44], [760, DESK_FRONT + 44]], { seed: sd + 149, w: 2.4, amp: 1.2, color: 'rgba(26,18,14,0.35)', t0: 30, t1: 30 });
  inkStroke(c, [[300, DESK_FRONT + 44], [300, DESK_FRONT + 150]], { seed: sd + 149.2, w: 2, amp: 1, color: 'rgba(26,18,14,0.25)', t0: 20, t1: 20 });
  // contact shadow under the lamp
  fillShape(c, circlePts(LX, BASEY + 4, 96, 0, 96), 'rgba(30,20,14,0.34)', { seed: sd + 143, amp: 2.4 });
}


function nightVeil(c, ex) {
  const a = 0.58 * (1 - clamp(ex, 0, 1));
  if (a <= 0.012) return;
  c.save();
  c.beginPath();
  polyPath(c, rectPts(-80, -80, W + 160, H + 160));
  polyPath(c, rectPts(WIN.x0 - 6, WIN.y0 - 6, WIN.x1 - WIN.x0 + 12, WIN.y1 - WIN.y0 + 12));
  c.fillStyle = `rgba(11,19,24,${a})`;
  c.fill('evenodd');
  c.restore();
}

// ---------------------------------------------------------------- the lamp
function drawLampShadow(c, s, sd) {
  const L = s.L, m = s.moonAmt;
  if (m < 0.2) return;
  const a = L.shadeAng;
  const cx = 336, cy = 704, k = 1.42;
  const T = (x, y) => [cx + (x - L.px) * -k, cy + (y - L.py) * -k];
  const mouth = [T(0, 108), T(66, 108 + 26), T(-66, 108 + 26)];
  const body = [T(-30, 0), T(30, 0), T(SHADE_R, 108), T(-SHADE_R, 108)];
  const neck = [T(-14, -8), T(14, -8), T(14, PIVH - 20), T(-14, PIVH - 20)];
  const base = [T(-70, PIVH + 4), T(70, PIVH + 4), T(70, PIVH + 34), T(-70, PIVH + 34)];
  const col = `rgba(8,14,18,${0.18 * Math.min(1, m)})`;
  for (const poly of [base, neck, body, mouth]) fillShape(c, poly, col, { seed: sd + 150, amp: 2 });
}

function drawLamp(c, s, sd) {
  const L = s.L, face = L.faceMix, a = L.shadeAng;
  const bs = L.squash;
  // ------------- base: dome with thickness, switch knob
  const bx = L.baseX, by = BASEY;
  const bottom = circlePts(bx, by, 80, 0, 80).map(([x, y]) => [x, by + (y - by) * bs]);
  const topY = by - 26 * bs;
  const top = circlePts(bx, topY, 64, 0, 64).map(([x, y]) => [x, topY + (y - topY) * bs]);
  fillShape(c, bottom, C.brassDark, { seed: sd + 160, amp: 1.8 });
  fillShape(c, [[bx - 80, by], [bx + 80, by], [bx + 64, topY], [bx - 64, topY]], C.brass, { seed: sd + 161, amp: 2 });
  fillShape(c, top, C.brassDark, { seed: sd + 162, amp: 1.6 });
  inkLoop(c, bottom, { seed: sd + 164, w: 4, amp: 1.4 });
  inkLoop(c, top, { seed: sd + 165, w: 3.6, amp: 1.2 });
  // switch: a small tumbler at the back of the base, not a bright badge
  fillShape(c, rectPts(bx + 26, topY + 6, 15, 9), '#7d5a30', { seed: sd + 166, amp: 0.7 });
  inkLoop(c, rectPts(bx + 26, topY + 6, 15, 9), { seed: sd + 167, w: 1.8, amp: 0.7 });
  // ------------- gooseneck: an S-curve tube from the base collar to the socket
  const x0 = bx, y0 = topY - 8, x1 = L.px, y1 = L.py + 16;
  const cpts = [[x0 + 4, y0 - 110 * bs], [x1 - 34, y1 + 120], [x1, y1]];
  const tube = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24, v = 1 - u;
    tube.push([
      v * v * v * x0 + 3 * v * v * u * cpts[0][0] + 3 * v * u * u * cpts[1][0] + u * u * u * cpts[2][0],
      v * v * v * y0 + 3 * v * v * u * cpts[0][1] + 3 * v * u * u * cpts[1][1] + u * u * u * cpts[2][1],
    ]);
  }
  inkStroke(c, tube, { seed: sd + 170, w: 15, amp: 1.2, t0: 6, t1: 6, heavy: 0.15, color: C.ink });
  inkStroke(c, tube, { seed: sd + 171, w: 8, amp: 1.2, t0: 6, t1: 6, heavy: 0, color: '#4a3a2e', dense: true });
  // coil rings across the tube
  for (let i = 2; i < 23; i += 2) {
    const p = tube[i], q = tube[i + 1];
    const tx = q[0] - p[0], ty = q[1] - p[1], tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl, ny = tx / tl;
    inkStroke(c, [[p[0] - nx * 7, p[1] - ny * 7], [p[0] + nx * 7, p[1] + ny * 7]], { seed: sd + 172 + i, w: 2.4, amp: 0.8, t0: 5, t1: 5, color: 'rgba(20,14,10,0.85)' });
  }
  // socket collar
  c.save();
  c.translate(L.px, L.py);
  c.rotate(-a);
  fillShape(c, rectPts(-20, -4, 40, 22), C.enamel, { seed: sd + 178, amp: 1.2 });
  inkLoop(c, rectPts(-20, -4, 40, 22), { seed: sd + 179, w: 3, amp: 1 });
  c.restore();
  // ------------- shade
  if (face < 0.98) drawShadeSide(c, L, sd, 1 - face);
  if (face > 0.02) drawShadeFront(c, L, sd, face);
  // filament ember after the click
  if (L.ember > 0.01) {
    const m = mouthWorld(L);
    c.save(); c.globalCompositeOperation = 'screen';
    fillShape(c, circlePts(m[0], m[1], 7 + 5 * L.ember), `rgba(255,120,50,${0.8 * L.ember})`, { seed: sd + 180, amp: 1.2 });
    c.restore();
  }
}

function drawShadeSide(c, L, sd, alpha) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(L.px, L.py);
  c.rotate(-L.shadeAng);
  const R = SHADE_R, RY = 27, Hh = SHADE_H;
  // mouth: back rim + inside reflector
  const backRim = [];
  for (let i = 0; i <= 20; i++) { const th = Math.PI + (i / 20) * Math.PI; backRim.push([Math.cos(th) * R, Hh + Math.sin(th) * RY]); }
  fillShape(c, [[-R, Hh], [0, Hh - RY], [R, Hh], [0, Hh + RY]], 'rgba(26,36,34,0.85)', { seed: sd + 190, amp: 1.6 });
  // outer cone body (above the mouth)
  fillShape(c, [[-SHADE_TOP, 0], [SHADE_TOP, 0], [R, Hh], [0, Hh - RY], [-R, Hh]], C.enamel, { seed: sd + 191, amp: 2 });
  // lit side of the enamel
  fillShape(c, [[-SHADE_TOP + 4, 2], [-SHADE_TOP + 20, 2], [-R * 0.55, Hh - 6], [-R, Hh - 4]], C.enamelHi, { seed: sd + 192, amp: 1.6 });
  inkLoop(c, [[-SHADE_TOP, 0], [SHADE_TOP, 0], [R, Hh], [0, Hh - RY], [-R, Hh]], { seed: sd + 193, w: 5.5, amp: 1.6, t0: 8, t1: 8 });
  // the white inside of the shade, seen through the mouth
  fillShape(c, [[-R, Hh], [0, Hh - RY], [R, Hh], [0, Hh + RY]], C.cream, { seed: sd + 194, amp: 1.4 });
  if (L.moonIn > 0.01) {
    c.save(); c.globalCompositeOperation = 'screen';
    fillShape(c, [[-R * 0.92, Hh], [0, Hh - RY * 0.86], [R * 0.92, Hh], [0, Hh + RY * 0.86]], `rgba(176,214,230,${0.55 * L.moonIn})`, { seed: sd + 194.5, amp: 1.2 });
    c.restore();
  }
  inkLoop(c, [[-R, Hh], [0, Hh - RY], [R, Hh], [0, Hh + RY]], { seed: sd + 195, w: 3, amp: 1.1, color: 'rgba(36,26,21,0.55)', splits: 2 });
  // bulb seated inside the mouth (clipped to the mouth ellipse)
  c.save();
  c.beginPath();
  for (let i = 0; i <= 40; i++) { const th = (i / 40) * Math.PI * 2; const px = Math.cos(th) * R, py = Hh + Math.sin(th) * RY; i ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.closePath(); c.clip();
  drawBulb(c, 0, Hh - 8, 29, L.bright, sd + 200, 0.88);
  c.restore();
  // front lip: the near edge of the shade, hid behind in the mouth
  const lip = [];
  for (let i = 0; i <= 20; i++) { const th = (i / 20) * Math.PI; lip.push([-Math.cos(th) * R, Hh + Math.sin(th) * RY]); }
  inkStroke(c, lip, { seed: sd + 205, w: 15, amp: 1.1, t0: 6, t1: 6, color: C.enamel, dense: true, heavy: 0.2 });
  inkStroke(c, lip, { seed: sd + 206, w: 3.2, amp: 1, t0: 6, t1: 6, color: C.ember, dense: true, heavy: 0 });
  inkStroke(c, lip.map(([x, y]) => [x, y + 8]), { seed: sd + 207, w: 3, amp: 1, t0: 6, t1: 6, color: C.ink, dense: true });
  // top cap
  fillShape(c, circlePts(0, 0, 12, 0, SHADE_TOP), C.enamel, { seed: sd + 208, amp: 1.2 });
  inkLoop(c, circlePts(0, 0, 12, 0, SHADE_TOP), { seed: sd + 209, w: 3.4, amp: 1.1 });
  c.restore();
}

function drawShadeFront(c, L, sd, alpha) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(L.px, L.py);
  c.rotate(-L.shadeAng * 0.15);
  const R = SHADE_R + 14;
  fillShape(c, circlePts(0, SHADE_H - 12, R), C.enamel, { seed: sd + 210, amp: 1.8 });
  fillShape(c, circlePts(0, SHADE_H - 12, R - 14), C.cream, { seed: sd + 211, amp: 1.6 });
  fillShape(c, circlePts(0, SHADE_H - 12, R - 30), 'rgba(226,102,44,0.22)', { seed: sd + 212, amp: 1.4 });
  inkLoop(c, circlePts(0, SHADE_H - 12, R), { seed: sd + 213, w: 5.5, amp: 1.6 });
  inkLoop(c, circlePts(0, SHADE_H - 12, R - 14), { seed: sd + 214, w: 3, amp: 1.2, color: 'rgba(36,26,21,0.6)' });
  drawBulb(c, 0, SHADE_H - 14, 34, L.bright, sd + 215);
  c.restore();
}

function drawBulb(c, x, y, r, bright, sd, sq = 1) {
  if (bright > 0.02) {
    c.save(); c.globalCompositeOperation = 'screen';
    [[2.9, 0.12], [1.9, 0.18]].forEach(([k, al], i) => {
      fillShape(c, circlePts(x, y, r * k * sq, 0, r * k), `rgba(255,196,96,${al * Math.min(1.4, bright)})`, { seed: sd + i, amp: 2.2 });
    });
    c.restore();
  }
  const col = bright > 0.02 ? C.warmCore : 'rgba(126,130,118,0.8)';
  fillShape(c, circlePts(x, y, r * sq, 0, r), col, { seed: sd + 10, amp: 1.2 });
  if (bright > 0.02) {
    fillShape(c, circlePts(x, y, r * 0.6 * sq, 0, r * 0.6), `rgba(255,246,214,${Math.min(1, bright)})`, { seed: sd + 11, amp: 0.8 });
  }
  inkLoop(c, circlePts(x, y, r * sq, 0, r), { seed: sd + 13, w: 3.2, amp: 1 });
  inkStroke(c, [[x - r * 0.38, y], [x - r * 0.1, y - r * 0.22], [x + r * 0.14, y + r * 0.2], [x + r * 0.38, y]], { seed: sd + 14, w: 1.8, amp: 0.7, color: bright > 0.02 ? 'rgba(226,102,44,0.75)' : 'rgba(60,60,56,0.7)', t0: 6, t1: 6 });
}

// ---------------------------------------------------------------- light
// A spotlight cone: narrow at the mouth, wider at the far end (a real shade cone).
function beamShape(x, y, ang, half, len, r0 = 0) {
  const nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
  const pts = [[x + nx * r0, y + ny * r0]];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const a = ang - half + (2 * half * i) / n;
    pts.push([x + Math.cos(a) * len, y + Math.sin(a) * len]);
  }
  pts.push([x - nx * r0, y - ny * r0]);
  return pts;
}

function drawLight(c, s, sd) {
  const t = s.t, L = s.L, b = Math.min(1.35, L.bright);
  const [mx, my] = mouthWorld(L);
  const dirA = Math.PI / 2 - L.shadeAng;   // +shadeAng tilts the shade clockwise (to the right)
  const dy = Math.cos(L.shadeAng);
  const m = s.moonAmt;

  // --- ambient night: a single cool wash (never black), the window's hard patches
  c.save(); c.globalCompositeOperation = 'screen';
  fillShape(c, circlePts(WIN.x0 + 160, 330, 940, 0, 800), `rgba(104,150,172,${0.11 * m})`, { seed: sd + 250, amp: 6 });
  // four panes of moonlight landing on the desk (a parallelogram grid, window shadow between)
  const pane = (i, j) => {
    const x = WIN.x0 + 30 + i * 168, y = WIN.y0 + 30 + j * 246;
    const w = 150, h = 220;
    return [[x - 120, 830], [x + w - 120, 838], [x + w - 210, 1010], [x - 210, 1000]];
  };
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    fillShape(c, pane(i, j), `rgba(170,208,224,${0.15 * m})`, { seed: sd + 251 + i + j * 2, amp: 3 });
  }
  c.restore();

  if (b > 0.05 && L.faceMix < 0.9) {
    const len = 1700, half = 0.44;
    c.save();
    c.beginPath(); c.rect(-400, -400, W + 800, DESK + 400); c.clip();
    c.globalCompositeOperation = 'screen';
    fillShape(c, beamShape(mx, my, dirA, half, len, SHADE_R * 0.82), `rgba(255,178,82,${0.24 * b})`, { seed: sd + 240, amp: 3.2 });
    fillShape(c, beamShape(mx, my, dirA, half * 0.5, len * 0.9, SHADE_R * 0.7), `rgba(255,222,152,${0.18 * b})`, { seed: sd + 241, amp: 2.4 });
    c.restore();
    if (dy > 0.12) {
      const dist = (DESK - my) / Math.max(0.001, dy);
      const hx = mx + Math.sin(L.shadeAng) * dist;
      const spread = clamp(1 - Math.abs(Math.sin(L.shadeAng)) * 1.2, 0.2, 1);
      const w = 150 + 300 * spread;
      c.save();
      c.beginPath(); c.rect(-200, -200, W + 400, DESK_FRONT + 200); c.clip();
      c.globalCompositeOperation = 'screen';
      fillShape(c, circlePts(clamp(hx, 60, W - 60), DESK + 14, (16 + 14 * spread) * (1 + 0.09 * Math.sin(t * 3.4)), 0, w * (1 + 0.05 * Math.sin(t * 2.7))), `rgba(255,188,90,${0.34 * b})`, { seed: sd + 242, amp: 2.6 });
      fillShape(c, circlePts(clamp(hx, 60, W - 60), DESK + 10, 10 + 9 * spread, 0, w * 0.58), `rgba(255,230,176,${0.26 * b})`, { seed: sd + 243, amp: 2.2 });
      c.restore();
    }
    if (dy < 0.55) {
      const wx = mx + Math.sin(L.shadeAng) * 470, wy = my + Math.cos(L.shadeAng) * 470;
      c.save(); c.globalCompositeOperation = 'screen';
      fillShape(c, circlePts(wx, wy, 300, 0, 250), `rgba(255,186,92,${0.17 * b})`, { seed: sd + 244, amp: 4 });
      c.restore();
    }
  }
  // the deadpan: the beam is fired straight down the lens (the blow-out happens over everything, later)
  if (s.fm > 0.02) {
    const k = s.fm * (0.6 + 0.4 * Math.min(1, b));
    fillShape(c, circlePts(mx, my, 190 * k, 0, 190 * k), `rgba(255,246,222,${0.55 * k})`, { seed: sd + 245, amp: 3 });
  }
  // borrowed silver beam from the white inside of the shade
  const rf = s.refl;
  if (rf > 0.01) {
    c.save(); c.globalCompositeOperation = 'screen';
    const half = 0.44, len = 1600;
    c.beginPath(); c.rect(-400, -400, W + 800, DESK + 400); c.clip();
    const bOuter = beamShape(mx, my, dirA, half, len, SHADE_R * 0.8);
    fillShape(c, bOuter, `rgba(176,216,232,${0.34 * rf})`, { seed: sd + 260, amp: 3.2 });
    inkLoop(c, bOuter, { seed: sd + 264, w: 3, amp: 2.4, color: `rgba(150,196,214,${0.55 * rf})`, t0: 60, t1: 60 });
    fillShape(c, beamShape(mx, my, dirA, half * 0.5, len * 0.9, SHADE_R * 0.66), `rgba(232,246,250,${0.26 * rf})`, { seed: sd + 261, amp: 2.4 });
    if (dy > 0.1) {
      const dist = (DESK - my) / Math.max(0.001, dy);
      const hx = mx + Math.sin(L.shadeAng) * dist;
      fillShape(c, circlePts(clamp(hx, 60, W - 60), DESK + 12, 22, 0, 200), `rgba(200,230,240,${0.30 * rf})`, { seed: sd + 262, amp: 2.4 });
    }
    for (let i = 0; i < 16; i++) {
      const ph = hs(i, 111);
      const d0 = 120 + ((t * (40 + ph * 55) + ph * 900) % 880);
      const ang2 = dirA + (hs(i, 113) - 0.5) * half * 1.5;
      const dx3 = mx + Math.sin(ang2) * d0, dy3 = my + Math.cos(ang2) * d0;
      if (dy3 > DESK - 10) continue;
      const a3 = clamp(1 - d0 / 950, 0, 1) * rf * (0.22 + ph * 0.4);
      fillShape(c, circlePts(dx3, dy3, 1.5 + ph * 2.8, 0, 8), `rgba(226,242,248,${a3})`, { seed: sd + 700 + i, amp: 1.6 });
    }
    const wx = mx + Math.sin(L.shadeAng) * 500, wy = my + Math.cos(L.shadeAng) * 500;
    fillShape(c, circlePts(wx, wy, 280, 0, 240), `rgba(180,214,226,${0.14 * rf})`, { seed: sd + 263, amp: 4 });
    c.restore();
  }
}


function drawSteam(c, s, sd) {
  const t = s.t, L = s.L;
  const [mx, my] = mouthWorld(L);
  for (let k = 0; k < 4; k++) {
    const ph = k * 1.7 + sd * 0.01;
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const y = MUG.y - 100 - u * (150 + k * 26);
      const sway = Math.sin(t * 1.5 + ph + u * 4.2) * (10 + u * 34) + Math.sin(t * 0.9 + ph * 2) * 6 * u;
      pts.push([MUG.x + sway + (k - 1.5) * 17 + u * 26, y]);
    }
    const d = Math.hypot(pts[8][0] - mx, pts[8][1] - my);
    const warm = clamp(1 - d / 420, 0, 1) * Math.min(1, L.bright);
    const a = 0.16 + 0.34 * warm;
    const col = warm > 0.25 ? `rgba(255,232,190,${a + 0.16})` : `rgba(190,214,222,${a * 0.85})`;
    // three tapered segments: thick at the rim, a thread at the top
    for (let seg = 0; seg < 3; seg++) {
      const i0 = Math.round(seg * 5.3), i1 = Math.round((seg + 1) * 5.3) + 1;
      inkStroke(c, pts.slice(i0, Math.min(pts.length, i1)), {
        seed: sd + 320 + k * 3 + seg, w: (8.5 - seg * 2.4) + 4 * warm, amp: 1.4, t0: 12, t1: 12,
        color: col, dense: true, heavy: 0.1 });
    }
  }
}

// ---------------------------------------------------------------- moth
function drawMoth(c, s, sd) {
  const M = s.M, t = s.t;
  const flap = M.wing;
  let mx = M.x, my = M.y, msc = 1;
  if (t <= 12.95) return;
  if (t < 15.55) {
    mx = 1352 + Math.sin(t * 2.6) * 42 + Math.sin(t * 6.3) * 9;
    my = 296 + Math.sin(t * 3.9) * 30 + Math.cos(t * 6.8) * 8;
    msc = 0.82;
  }
  if (t <= 12.95) return;
  if (t < 15.55) {
    // a shadow on the pane, so it reads as a moth ON the glass
    c.save();
    c.translate(mx + 5, my + 6);
    c.scale(msc, msc);
    for (const sgn of [-1, 1]) {
      const up = 26 + 30 * flap, out = 30 + 20 * flap;
      fillShape(c, [[sgn * 4, -2], [sgn * out, -up], [sgn * (out + 4), up * 0.1], [sgn * 12, 8]], 'rgba(10,16,20,0.34)', { seed: sd + 268, amp: 1.2 });
    }
    fillShape(c, [[-7, 12], [7, 12], [6, -9], [-6, -9]], 'rgba(10,16,20,0.3)', { seed: sd + 269, amp: 0.8 });
    c.restore();
  }
  c.save();
  c.translate(mx, my);
  c.scale(msc, msc);
  c.rotate(M.ang * 0.4);
  // wings
  const sil = s.fm > 0.25;
  const wingCol = sil ? 'rgba(32,24,18,0.92)' : 'rgba(243,234,208,0.95)';
  const inkCol = sil ? 'rgba(20,14,10,0.95)' : 'rgba(30,22,16,0.85)';
  const folded = 0.42 + 0.58 * Math.min(1, M.wing);
  for (const sgn of [-1, 1]) {
    const up = (26 + 30 * flap) * (0.5 + 0.5 * folded);   // how far the wing lifts
    const out = (30 + 20 * flap) * folded;
    const wing = [
      [sgn * 4, -2],
      [sgn * out * 0.7, -up * 0.55],
      [sgn * out, -up],
      [sgn * (out + 6), -up * 0.55],
      [sgn * (out * 0.85), up * 0.1],
      [sgn * 12, 8],
    ];
    const wp = spline(wing.map(([x, y]) => [x, y]), true, 6).filter((_, i) => i % 3 === 0);
    fillShape(c, wp, wingCol, { seed: sd + 270 + sgn, amp: 1.4 });
    inkLoop(c, wp.length > 8 ? wp : wing, { seed: sd + 274 + sgn, w: 2.2, amp: 1, color: inkCol });
    fillShape(c, circlePts(sgn * (out * 0.62), -up * 0.45, 4.6, 0, 3.6), 'rgba(120,96,64,0.5)', { seed: sd + 278 + sgn, amp: 0.7 });
  }
  // body + head
  fillShape(c, [[-7, 12], [7, 12], [6, -9], [-6, -9]], sil ? '#241a15' : '#5a4a38', { seed: sd + 282, amp: 0.9 });
  inkLoop(c, [[-7, 12], [7, 12], [6, -9], [-6, -9]], { seed: sd + 283, w: 1.8, amp: 0.8 });
  fillShape(c, circlePts(0, -12, 6), sil ? '#241a15' : '#6b5942', { seed: sd + 284, amp: 0.8 });
  inkLoop(c, circlePts(0, -12, 6), { seed: sd + 285, w: 1.6, amp: 0.7 });
  inkStroke(c, [[-3, -17], [-11, -30], [-18, -36]], { seed: sd + 286, w: 1.5, amp: 0.6, t0: 4, t1: 4 });
  inkStroke(c, [[3, -17], [11, -30], [18, -36]], { seed: sd + 287, w: 1.5, amp: 0.6, t0: 4, t1: 4 });
  if (M.perch < 0.5) {
    for (let i = 0; i < 4; i++) {
      const a = hs(sd, i) * 6.28, r = 16 + hs(sd, i, 2) * 22;
      fillShape(c, circlePts(Math.cos(a) * r, Math.sin(a) * r + 10, 1.3), 'rgba(250,240,214,0.65)', { seed: sd + 288 + i, amp: 0.5 });
    }
  }
  c.restore();
}

// ---------------------------------------------------------------- dust motes
const MOTES = (() => {
  const r = mulberry32(99173), out = [];
  for (let i = 0; i < 140; i++) out.push({ x: 340 + r() * 1180, y: 160 + r() * 680, r: 1.1 + r() * 2.6, sp: 4 + r() * 12, ph: r() * 6.28, dr: 6 + r() * 16 });
  return out;
})();

function drawDust(c, s, sd) {
  const t = s.t, L = s.L;
  const [mx, my] = mouthWorld(L);
  for (let i = 0; i < MOTES.length; i++) {
    const m = MOTES[i];
    const y = ((m.y - t * m.sp * 0.55 - m.dr * 2) % 820 + 820) % 820 + 120;
    const x = m.x + Math.sin(t * 0.7 + m.ph) * m.dr;
    const vx = x - mx, vy = y - my, d = Math.hypot(vx, vy) || 1;
    let ad = Math.atan2(vy, vx) - (Math.PI / 2 - L.shadeAng);
    ad = Math.abs(Math.atan2(Math.sin(ad), Math.cos(ad)));
    const inCone = ad < 0.46 ? clamp(1 - d / 1000, 0, 1) : 0;
    const warm = inCone * Math.min(1, L.bright);
    const inMoon = clamp(1 - Math.abs(x - 1330) / 380, 0, 1) * clamp((y - 130) / 460, 0, 1) * s.moonAmt;
    const a = clamp(0.03 + warm * 0.85 + inMoon * 0.42, 0, 0.95);
    if (a < 0.1) continue;
    const col = warm > inMoon ? `rgba(255,238,196,${a})` : `rgba(216,236,242,${a})`;
    const rr = m.r * (1 + warm * 0.5);
    const mot = [[x - rr, y], [x, y - rr * 0.8], [x + rr, y - rr * 0.1], [x, y + rr * 0.7]];
    fillShape(c, mot, col, { seed: sd + 300 + i, amp: 0.5 });
  }
}

// ---------------------------------------------------------------- paper / finish
let IMG = {}, TITLES = null, s0seed = 0;

function paperFinish(c) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.5;
  c.drawImage(IMG.paper, 0, 0, W, H);
  c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.26;
  c.drawImage(IMG.tooth, 0, 0, W, H);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  const g = c.createRadialGradient(W / 2, H * 0.46, H * 0.3, W / 2, H / 2, H * 1.0);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(26,18,14,0.40)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.restore();
}

function blowOut(c, s, sd) {
  const k = s.fm;
  if (k <= 0.02) return;
  const [mx, my] = mouthWorld(s.L);
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = `rgba(255,247,226,${0.72 * k})`;
  c.fillRect(0, 0, W, H);
  // veiling glare: a hot centre that falls off in flat cel steps
  const gl = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.72);
  gl.addColorStop(0, `rgba(255,252,242,${0.85 * k})`);
  gl.addColorStop(0.45, `rgba(255,244,214,${0.45 * k})`);
  gl.addColorStop(1, `rgba(240,214,170,${0.10 * k})`);
  c.fillStyle = gl; c.fillRect(0, 0, W, H);
  // crush the corners so the blast has an edge to push against
  const vg = c.createRadialGradient(W / 2, H / 2, W * 0.34, W / 2, H / 2, W * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, `rgba(58,34,14,${0.42 * k})`);
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
  const { s: z, x, y } = s.cam;
  c.setTransform(z, 0, 0, z, W / 2 - x * z, H / 2 - y * z);
  // hot core + a few radial ink ticks: the classic cel "light in the lens"
  fillShape(c, circlePts(mx, my, 120 * k, 0, 120 * k), `rgba(255,252,240,${0.9 * k})`, { seed: sd + 330, amp: 1.6 });
  inkLoop(c, circlePts(mx, my, 120 * k), { seed: sd + 331, w: 3, amp: 1.4, color: `rgba(226,102,44,${0.5 * k})` });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.28 + Math.sin(s.t * 9 + i) * 0.02;
    const r0 = 132, r1 = 132 + 70 + 40 * hs(sd, i);
    inkStroke(c, [[mx + Math.cos(a) * r0, my + Math.sin(a) * r0 * 0.7], [mx + Math.cos(a) * r1, my + Math.sin(a) * r1 * 0.7]],
      { seed: sd + 332 + i, w: 4, amp: 1.2, t0: 6, t1: 6, color: `rgba(226,102,44,${0.45 * k})` });
  }
  // three shockwave rings racing out from the shade, on ones with the ink
  const tb = Math.max(0, s.t - 24.94);
  for (let i = 0; i < 3; i++) {
    const r = 120 + (tb - i * 0.07) * 1500;
    if (tb - i * 0.07 <= 0) continue;
    const a = clamp(1 - (tb - i * 0.07) / 0.95, 0, 1);
    inkLoop(c, circlePts(mx, my, r, 0, 96), {
      seed: sd + 640 + i, w: 5 - i * 1.2, amp: 3.4, t0: 40, t1: 40,
      color: `rgba(255,248,232,${0.55 * a * k})` });
  }
  // dust blown off the desk, travelling outward and settling
  for (let i = 0; i < 26; i++) {
    const ph = hs(i, 33), sp = 240 + ph * 820;
    const dx = (hs(i, 37) - 0.5) * 2, dy2 = (hs(i, 39) - 0.6) * 1.3;
    const ax = mx + dx * sp * tb, ay = my + dy2 * sp * tb + 260 * tb * tb;
    const a2 = clamp(1 - tb / 0.95, 0, 1) * (0.25 + ph * 0.5);
    if (a2 <= 0) continue;
    fillShape(c, circlePts(ax, ay, 1.6 + ph * 3.4, 0, 8), `rgba(255,244,220,${a2 * k})`, { seed: sd + 660 + i, amp: 1.4 });
  }
  c.restore();
}

function drawTitle(c, s, sd) {
  const t = s.t;
  const dim = s.dim;
  if (dim <= 0.001 || !TITLES) return;
  c.save();
  // end-card: a paper night sky at the top, the story still visible below
  const g = c.createLinearGradient(0, 0, 0, 760);
  g.addColorStop(0, `rgba(14,22,27,${0.88 * dim})`);
  g.addColorStop(0.62, `rgba(14,22,27,${0.66 * dim})`);
  g.addColorStop(1, `rgba(14,22,27,${0.18 * dim})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const reveal = K(t, [[45.5, 0], [46.8, 1, 'io3'], [50, 1]]);
  const k = K(t, [[45.2, 0], [45.9, 1, 'io2'], [50, 1]]);
  const cx = W / 2, cy = 330;
  c.save();
  c.beginPath(); c.rect(0, 0, W * reveal, H); c.clip();
  c.globalAlpha = k;
  // inked letterforms, one path so the counters stay open
  c.beginPath();
  for (const sub of TITLES.subs) {
    const pts = boil(sub.map(([x, y]) => [cx + (x - TITLES.cx), cy + (y - TITLES.cy)]), sd + 400, 4.0, 90);
    polyPath(c, pts);
  }
  c.fillStyle = 'rgba(30,21,16,0.55)';
  c.save(); c.translate(3, 4); c.fill('nonzero'); c.restore();
  c.fillStyle = '#f4e9d0';
  c.fill('nonzero');
  c.strokeStyle = 'rgba(36,26,21,0.85)'; c.lineWidth = 3.4; c.stroke();
  c.restore();
  const ck = K(t, [[46.1, 0], [46.9, 1, 'io2'], [50, 1]]);
  c.globalAlpha = ck * k;
  c.font = '500 22px "Plex Mono"'; c.letterSpacing = '4px';
  c.fillStyle = 'rgba(250,242,224,0.94)'; c.textAlign = 'center';
  c.fillText('MUSIC · MUSIC FOR CREATORS · CC BY 4.0', cx + 3, cy + 112);
  // an underline drawn on with the same hand
  const ul = K(t, [[46.15, 0], [46.95, 1, 'io2'], [50, 1]]);
  if (ul > 0.01) {
    inkStroke(c, [[cx - 330, cy + 136], [cx - 330 + 660 * ul, cy + 136]], {
      seed: sd + 460, w: 3.4, amp: 1.2, color: 'rgba(244,233,208,0.55)', t0: 30, t1: 30 });
  }
  // paper motes drifting through the end card, on ones like everything else
  for (let i = 0; i < 12; i++) {
    const ph = hs(i, 91);
    const px2 = ((hs(i, 71) * W + t * (5 + ph * 14)) % (W + 80)) - 40;
    const py2 = 120 + ((hs(i, 73) * 760 + Math.sin(t * 0.6 + ph * 6) * 26 + t * 7 * ph) % 620);
    const r2 = 1.4 + ph * 2.6;
    fillShape(c, circlePts(px2, py2, r2, 0, r2), `rgba(248,238,214,${0.10 + ph * 0.22})`, { seed: sd + 470 + i, amp: 1.1 });
  }
  c.restore();
}

// ---------------------------------------------------------------- init / frame
let ctx = null;

function gp(font, text, size) {
  const path = font.getPath(text, 0, 0, size, { letterSpacing: 0.07 });
  const subs = []; let cur = [];
  for (const cmd of path.commands) {
    if (cmd.type === 'M') { if (cur.length > 1) subs.push(cur); cur = [[cmd.x, cmd.y]]; }
    else if (cmd.type === 'L') cur.push([cmd.x, cmd.y]);
    else if (cmd.type === 'C') {
      const p0 = cur[cur.length - 1] || [cmd.x1, cmd.y1];
      for (let i = 1; i <= 8; i++) {
        const u = i / 8, v = 1 - u;
        cur.push([
          v * v * v * p0[0] + 3 * v * v * u * cmd.x1 + 3 * v * u * u * cmd.x2 + u * u * u * cmd.x,
          v * v * v * p0[1] + 3 * v * v * u * cmd.y1 + 3 * v * u * u * cmd.y2 + u * u * u * cmd.y,
        ]);
      }
    } else if (cmd.type === 'Q') {
      const p0 = cur[cur.length - 1] || [cmd.x1, cmd.y1];
      for (let i = 1; i <= 8; i++) {
        const u = i / 8, v = 1 - u;
        cur.push([v * v * p0[0] + 2 * v * u * cmd.x1 + u * u * cmd.x, v * v * p0[1] + 2 * v * u * cmd.y1 + u * u * cmd.y]);
      }
    } else if (cmd.type === 'Z') { if (cur.length > 1) subs.push(cur); cur = []; }
  }
  if (cur.length > 1) subs.push(cur);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const sub of subs) for (const [x, y] of sub) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { subs, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

export async function init(canvas, dpr) {
  canvas.width = W; canvas.height = H;
  ctx = canvas.getContext('2d');
  const load = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('img ' + src)); im.src = src; });
  IMG.paper = await load('/assets/paper_base.jpg');
  IMG.tooth = await load('/assets/paper_tooth.png');
  try {
    const opentype = (await import('opentype')).default || (await import('opentype'));
    const buf = await (await fetch('/assets/fonts/CormorantGaramond-VF.ttf')).arrayBuffer();
    TITLES = gp(opentype.parse(buf), 'The Little Lighthouse', 132);
  } catch (e) { console.warn('title font failed', e && e.message); }
}

function drawFrame(t) {
  const f = Math.round(t * FPS);
  const di = f;
  const sd = (di % 3) * 977 + 3;
  s0seed = di * 37;
  const s = state(t);
  const { s: z, x, y } = s.cam;
  GLOBAL.ink = 1 / Math.pow(z, 0.92);
  GLOBAL.amp = clamp(3.05 / Math.pow(z, 0.7), 1.2, 3.3);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = C.night; ctx.fillRect(0, 0, W, H);
  const wv = (hs(di, 71) - 0.5) * 3.2, wv2 = (hs(di, 73) - 0.5) * 2.4;
  ctx.setTransform(z, 0, 0, z, W / 2 - (x + wv) * z, H / 2 - (y + wv2) * z);
  drawRoom(ctx, s, sd);
  drawProps(ctx, s, sd);
  drawSteam(ctx, s, sd);
  drawLamp(ctx, s, sd);
  nightVeil(ctx, Math.max(s.L.bright, s.moonAmt * 0.92));
  drawLight(ctx, s, sd);
  drawDust(ctx, s, sd);
  blowOut(ctx, s, sd);
  drawMoth(ctx, s, sd);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  paperFinish(ctx);
  if (s.t >= 49.1) { ctx.fillStyle = '#0d0a07'; ctx.fillRect(0, 0, W, H); }
  drawTitle(ctx, s, sd);
}

export function render(t) {
  drawFrame(clamp(t, 0, DUR - 1e-3));
}
