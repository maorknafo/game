const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 480;
canvas.height = 640;

const bird = {
  x: 80,
  y: 300,
  width: 34,
  height: 24,
  gravity: 0.7,
  lift: -11,
  velocity: 0,
  hue: 0,
};

const pipeWidth = 60;
const pipeGap = 180;
const pipes = [];
let frameCount = 0;
let score = 0;
let gameOver = false;

const fireworks = [];
const particles = [];

// תוספת: הגדרת תמונה מותאמת אישית
let customBirdImage = null;
const customBird = new Image();

function setCustomBirdImage() {
  const url = document.getElementById('imageUrl').value;
  if (url) {
    customBird.src = url;
    customBird.onload = () => {
      customBirdImage = customBird;
    };
  }
}

function resetGame() {
  bird.y = 300;
  bird.velocity = 0;
  pipes.length = 0;
  frameCount = 0;
  score = 0;
  gameOver = false;
  fireworks.length = 0;
  particles.length = 0;
}

function randomColor(hueShift = 0) {
  const h = (bird.hue + hueShift) % 360;
  return `hsl(${h}, 100%, 60%)`;
}

function drawBird() {
  bird.hue = (bird.hue + 4) % 360;
  ctx.save();
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
  ctx.rotate(Math.min(Math.max(bird.velocity / 10, -1), 1));

  if (customBirdImage) {
    ctx.drawImage(customBirdImage, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
  } else {
    const gradient = ctx.createRadialGradient(0, 0, bird.width / 4, 0, 0, bird.width / 2);
    gradient.addColorStop(0, randomColor(0));
    gradient.addColorStop(1, randomColor(120));
    ctx.fillStyle = gradient;
    ctx.fillRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
  }

  ctx.restore();
}

function drawPipes() {
  pipes.forEach(pipe => {
    const hue = (frameCount * 3 + pipe.x) % 360;
    const gradientTop = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, pipe.top);
    gradientTop.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
    gradientTop.addColorStop(1, `hsl(${(hue + 60) % 360}, 100%, 60%)`);

    const gradientBottom = ctx.createLinearGradient(pipe.x, pipe.top + pipeGap, pipe.x + pipeWidth, canvas.height);
    gradientBottom.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
    gradientBottom.addColorStop(1, `hsl(${(hue + 60) % 360}, 100%, 60%)`);

    ctx.fillStyle = gradientTop;
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);

    ctx.fillStyle = gradientBottom;
    ctx.fillRect(pipe.x, pipe.top + pipeGap, pipeWidth, canvas.height - pipe.top - pipeGap);

    ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
    ctx.shadowBlur = 15;
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
    ctx.fillRect(pipe.x, pipe.top + pipeGap, pipeWidth, canvas.height - pipe.top - pipeGap);
    ctx.shadowBlur = 0;
  });
}

function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '28px Arial';
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 5;
  ctx.fillText(`ניקוד: ${score}`, 15, 40);
  ctx.shadowBlur = 0;
}

function drawFireworks() {
  fireworks.forEach((fw, i) => {
    fw.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      p.radius *= 0.96;

      if (p.alpha <= 0 || p.radius <= 0) {
        fw.particles.splice(fw.particles.indexOf(p), 1);
      }
    });

    if (fw.particles.length === 0) {
      fireworks.splice(i, 1);
    }
  });
}

function createFirework(x, y) {
  const fw = { particles: [] };
  const count = 20 + Math.floor(Math.random() * 20);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const speed = 2 + Math.random() * 3;
    fw.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 3 + Math.random() * 2,
      alpha: 1,
      hue: Math.random() * 360
    });
  }
  fireworks.push(fw);
}

function createParticleExplosion(x, y) {
  const count = 30;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4 + Math.random() * 3,
      alpha: 1,
      hue: Math.random() * 360,
      decay: 0.03 + Math.random() * 0.02
    });
  }
}

function drawParticles() {
  particles.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`;
    ctx.fill();

    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    p.radius *= 0.95;

    if (p.alpha <= 0 || p.radius <= 0) {
      particles.splice(i, 1);
    }
  });
}

function applySpeedBlur() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function update() {
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('המשחק נגמר!', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '24px Arial';
    ctx.fillText(`ניקוד: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('לחץ רווח או הקלק כדי להתחיל מחדש', canvas.width / 2, canvas.height / 2 + 50);
    drawFireworks();
    drawParticles();

    requestAnimationFrame(update);
    return;
  }

  const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  const bgHue1 = (frameCount * 2) % 360;
  const bgHue2 = (bgHue1 + 120) % 360;
  bgGradient.addColorStop(0, `hsl(${bgHue1}, 80%, 40%)`);
  bgGradient.addColorStop(1, `hsl(${bgHue2}, 80%, 50%)`);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  bird.velocity += bird.gravity;
  bird.velocity = Math.min(bird.velocity, 15);
  bird.y += bird.velocity;

  if (frameCount % 90 === 0) {
    let topHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 120)) + 60;
    pipes.push({ x: canvas.width, top: topHeight });
  }

  pipes.forEach(pipe => {
    pipe.x -= 4 + score * 0.05;
  });

  if (pipes.length && pipes[0].x + pipeWidth < 0) {
    pipes.shift();
    score++;
    createFirework(bird.x + bird.width, bird.y + bird.height / 2);
  }

  pipes.forEach(pipe => {
    if (
      bird.x + bird.width > pipe.x &&
      bird.x < pipe.x + pipeWidth &&
      (bird.y < pipe.top || bird.y + bird.height > pipe.top + pipeGap)
    ) {
      gameOver = true;
      createParticleExplosion(bird.x + bird.width / 2, bird.y + bird.height / 2);
    }
  });

  if (bird.y + bird.height > canvas.height || bird.y < 0) {
    gameOver = true;
    createParticleExplosion(bird.x + bird.width / 2, bird.y + bird.height / 2);
  }

  drawBird();
  drawPipes();
  drawScore();
  drawFireworks();
  drawParticles();

  applySpeedBlur();

  frameCount++;
  requestAnimationFrame(update);
}

function flap() {
  if (gameOver) {
    resetGame();
  }
  bird.velocity = bird.lift;
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space') flap();
});
canvas.addEventListener('mousedown', flap);
canvas.addEventListener('touchstart', flap);

resetGame();
update();
