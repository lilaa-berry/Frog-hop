const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const pts = document.getElementById('pts');
const bestEl = document.getElementById('best');
const msg = document.getElementById('msg');
const btn = document.getElementById('btn');

const W = 480, H = 300;
canvas.width = W; canvas.height = H;

let state = 'idle';
let score = 0, best = 0;
let raf;

const GND = H - 54;
const frog = { x: 72, y: GND, vy: 0, onGround: true, jumpPow: -13, squat: 0 };
let obstacles = [];
let clouds = [];
let frame = 0;
let speed = 3.5;
let lastObs = 0;

const LILY_COLS = ['#74c69d','#52b788','#40916c','#2d6a4f'];

function spawnCloud() {
  clouds.push({
    x: W + 30,
    y: 20 + Math.random() * 60,
    w: 50 + Math.random() * 40,
    h: 18 + Math.random() * 12,
    sp: 0.4 + Math.random() * 0.3
  });
}

function spawnObstacle() {
  const types = ['log', 'tall', 'wide'];
  const t = types[Math.floor(Math.random() * types.length)];
  let w, h;
  if (t === 'log')  { w = 22; h = 30; }
  if (t === 'tall') { w = 18; h = 48; }
  if (t === 'wide') { w = 38; h = 22; }
  obstacles.push({ x: W + 10, w, h, type: t });
}

function reset() {
  score = 0; frame = 0; speed = 3.5;
  frog.y = GND; frog.vy = 0; frog.onGround = true; frog.squat = 0;
  obstacles = []; clouds = [];
  lastObs = 0;
  for (let i = 0; i < 3; i++) {
    clouds.push({
      x: 60 + i * 160,
      y: 20 + Math.random() * 50,
      w: 55 + Math.random() * 30,
      h: 18 + Math.random() * 10,
      sp: 0.4 + Math.random() * 0.3
    });
  }
}

function jump() {
  if (state === 'play' && frog.onGround) {
    frog.vy = frog.jumpPow;
    frog.onGround = false;
  }
}

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, H * 0.7);
  grad.addColorStop(0, '#b7e4c7');
  grad.addColorStop(1, '#d8f3dc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawGround() {
  ctx.fillStyle = '#95d5b2';
  ctx.fillRect(0, GND + 38, W, H - (GND + 38));
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = LILY_COLS[i % LILY_COLS.length];
    ctx.beginPath();
    ctx.ellipse(30 + i * 60, GND + 42, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#52b788';
  ctx.fillRect(0, GND + 34, W, 8);
}

function drawCloud(c) {
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, c.w, c.h, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(c.x - c.w * 0.35, c.y + c.h * 0.3, c.w * 0.6, c.h * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(c.x + c.w * 0.35, c.y + c.h * 0.3, c.w * 0.55, c.h * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrog() {
  const x = frog.x, y = frog.y;
  const sq = frog.onGround && frog.squat > 0 ? frog.squat : 0;
  const squish = frog.onGround ? 1 + sq * 0.08 : 0.92 + Math.abs(frog.vy) * 0.01;
  const stretch = 1 / squish;

  ctx.save();
  ctx.translate(x, y + 18);
  ctx.scale(squish, stretch);

  // Sombra
  ctx.fillStyle = 'rgba(0,80,30,0.13)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 18 * squish, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Patas traseras
  ctx.fillStyle = '#52b788';
  ctx.save(); ctx.translate(-13, 10);
  if (!frog.onGround) ctx.rotate(-0.6);
  ctx.beginPath(); ctx.ellipse(0, 0, 6, 14, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(13, 10);
  if (!frog.onGround) ctx.rotate(0.6);
  ctx.beginPath(); ctx.ellipse(0, 0, 6, 14, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();

  // Cuerpo
  ctx.fillStyle = '#74c69d';
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Panza
  ctx.fillStyle = '#d8f3dc';
  ctx.beginPath();
  ctx.ellipse(0, 4, 10, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cabeza
  ctx.fillStyle = '#74c69d';
  ctx.beginPath();
  ctx.ellipse(0, -16, 15, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ojos
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-7, -22, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -22, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1b4332';
  ctx.beginPath(); ctx.arc(-6.5, -22, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7.5, -22, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-5.5, -23, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8.5, -23, 1, 0, Math.PI * 2); ctx.fill();

  // Sonrisa
  ctx.strokeStyle = '#1b4332'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, -13, 5, 0.2, Math.PI - 0.2); ctx.stroke();

  // Brazos
  ctx.fillStyle = '#52b788';
  ctx.beginPath(); ctx.ellipse(-18, -2, 5, 10, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(18, -2, 5, 10, 0.4, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawObstacle(o) {
  const bx = o.x, by = GND + 38 - o.h;
  if (o.type === 'log') {
    ctx.fillStyle = '#b08968';
    ctx.beginPath(); roundRect(ctx, bx - o.w/2, by, o.w, o.h, 5); ctx.fill();
    ctx.fillStyle = '#9c6644';
    ctx.fillRect(bx - o.w/2 + 3, by + 4, o.w - 6, 4);
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.ellipse(bx, by, o.w * 0.8, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.arc(bx + i * 8, by - 2, 3, 0, Math.PI * 2); ctx.fill();
    }
  } else if (o.type === 'tall') {
    ctx.fillStyle = '#95d5b2';
    ctx.beginPath(); roundRect(ctx, bx - o.w/2, by, o.w, o.h, 5); ctx.fill();
    ctx.fillStyle = '#52b788';
    ctx.fillRect(bx - o.w/2 + 2, by + 5, o.w - 4, 5);
    ctx.fillRect(bx - o.w/2 + 2, by + 18, o.w - 4, 5);
    ctx.fillStyle = '#ffe66d';
    ctx.beginPath(); ctx.arc(bx, by - 4, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6b6b';
    for (let a = 0; a < 6; a++) {
      ctx.beginPath();
      ctx.ellipse(bx + Math.cos(a * Math.PI/3) * 7, by - 4 + Math.sin(a * Math.PI/3) * 7, 4, 6, a * Math.PI/3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffe66d';
    ctx.beginPath(); ctx.arc(bx, by - 4, 4, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#adb5bd';
    ctx.beginPath(); roundRect(ctx, bx - o.w/2, by, o.w, o.h, 8); ctx.fill();
    ctx.fillStyle = '#ced4da';
    ctx.beginPath(); roundRect(ctx, bx - o.w/2 + 4, by + 3, o.w - 8, 5, 3); ctx.fill();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawScore() {
  ctx.font = 'bold 17px Nunito, sans-serif';
  ctx.fillStyle = '#2d6a4f';
  ctx.fillText('🐸 ' + score, 14, 24);
}

function checkCollision() {
  const fx = frog.x, fy = frog.y + 18;
  for (let o of obstacles) {
    const bx = o.x, by = GND + 38 - o.h;
    if (fx + 13 > bx - o.w/2 + 4 && fx - 13 < bx + o.w/2 - 4 && fy + 2 > by && fy - 28 < by + o.h)
      return true;
  }
  return false;
}

function gameOver() {
  state = 'over';
  if (score > best) { best = score; bestEl.textContent = best; }
  msg.textContent = score > 0 ? `¡Saltaste ${score} obstáculos! 🎉` : '¡Ups! Intenta de nuevo 🐸';
  btn.textContent = '¡Otra vez!';
  btn.style.display = 'inline-block';
  cancelAnimationFrame(raf);
  ctx.fillStyle = 'rgba(45,106,79,0.35)';
  ctx.fillRect(0, 0, W, H);
  ctx.font = 'bold 36px Fredoka One, cursive';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('¡Game Over!', W/2, H/2 - 10);
  ctx.font = '20px Nunito, sans-serif';
  ctx.fillText('Puntos: ' + score, W/2, H/2 + 22);
  ctx.textAlign = 'left';
}

function loop() {
  frame++;
  speed = 3.5 + Math.floor(score / 5) * 0.35;

  if (frame - lastObs > Math.max(38, 75 - score * 2)) {
    spawnObstacle(); lastObs = frame;
  }
  if (frame % 120 === 0) spawnCloud();

  if (!frog.onGround) {
    frog.vy += 0.7;
    frog.y += frog.vy;
    if (frog.y >= GND) { frog.y = GND; frog.vy = 0; frog.onGround = true; frog.squat = 0; }
  }
  if (frog.onGround && frog.squat > 0) frog.squat = Math.max(0, frog.squat - 0.15);

  for (let o of obstacles) o.x -= speed;
  obstacles = obstacles.filter(o => {
    if (o.x < -50) { score++; pts.textContent = score; return false; }
    return true;
  });
  for (let c of clouds) c.x -= c.sp;
  clouds = clouds.filter(c => c.x > -80);

  drawSky(); clouds.forEach(drawCloud); drawGround();
  obstacles.forEach(drawObstacle); drawFrog(); drawScore();

  if (checkCollision()) { gameOver(); return; }
  raf = requestAnimationFrame(loop);
}

btn.addEventListener('click', () => {
  reset();
  state = 'play';
  msg.textContent = 'Toca o presiona espacio para saltar';
  btn.style.display = 'none';
  loop();
});

document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); jump(); } });
canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });

// Pantalla inicial
drawSky(); clouds.forEach(drawCloud); drawGround(); drawFrog();
ctx.textAlign = 'center';
ctx.font = 'bold 22px Fredoka One, cursive';
ctx.fillStyle = '#2d6a4f';
ctx.fillText('¡Presiona Jugar!', W/2, H/2 + 8);
ctx.textAlign = 'left';