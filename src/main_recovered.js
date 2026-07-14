import './style.css';

// --- Confetti Logic (Simple implementation) ---
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#f368e0'];

function createConfetti() {
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2 + 100,
      r: Math.random() * 6 + 2,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * -10 - 5,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function drawConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p, index) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    p.x += p.dx;
    p.y += p.dy;
    p.dy += 0.2; // gravity
    
    if (p.y > canvas.height) {
      particles.splice(index, 1);
    }
  });
  if (particles.length > 0) {
    requestAnimationFrame(drawConfetti);
  }
}

function triggerConfetti() {
  createConfetti();
  drawConfetti();
}

// --- Game Logic ---
let currentScore = 0;
const scoreElement = document.getElementById('score');

// DOM Elements
const mapScreen = document.getElementById('map-screen');
const catCharacter = document.getElementById('cat-character');
const stations = document.querySelectorAll('.station');
const backBtns = document.querySelectorAll('.back-btn');

// Lắng nghe sự kiện click vào các trạm
stations.forEach(station => {
  station.addEventListener('click', (e) => {
    // 1. Lấy vị trí của trạm
    const top = station.style.top;
    const left = station.style.left;
    const subject = station.dataset.subject;

    // 2. Di chuyển mèo máy
    catCharacter.style.top = top;
    catCharacter.style.left = left;
    catCharacter.classList.add('moving');

    // 3. Đợi hoạt ảnh kết thúc rồi chuyển màn hình
    setTimeout(() => {
      catCharacter.classList.remove('moving');
      openScreen(`${subject}-game-screen`);
    }, 1500); // Khớp với transition time trong CSS
  });
});

// Lắng nghe nút quay lại
backBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    openScreen('map-screen');
    // Trả mèo máy về vị trí cũ một chút
    catCharacter.style.top = '80%';
    catCharacter.style.left = '50%';
    
    // Reset feedback
    document.querySelectorAll('.feedback').forEach(el => el.textContent = '');
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.classList.remove('correct', 'wrong');
    });
  });
});

function openScreen(screenId) {
  // Ẩn tất cả
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  // Hiện màn hình đích
  const target = document.getElementById(screenId);
  if(target) {
    target.classList.add('active');
  }
}

// --- Math Game Logic ---
const mathOptions = document.getElementById('math-options');
const mathFeedback = document.getElementById('math-feedback');

mathOptions.addEventListener('click', (e) => {
  if(e.target.classList.contains('option-btn')) {
    const isCorrect = e.target.dataset.correct === 'true';
    
    if(isCorrect) {
      e.target.classList.add('correct');
      mathFeedback.textContent = 'Chính xác! Bạn đã cứu được vệ tinh!';
      mathFeedback.className = 'feedback success';
      updateScore(10);
      triggerConfetti();
    } else {
      e.target.classList.add('wrong');
      mathFeedback.textContent = 'Chưa đúng rồi, thử lại nhé!';
      mathFeedback.className = 'feedback error';
      setTimeout(() => e.target.classList.remove('wrong'), 500);
    }
  }
});

// --- Vietnamese Game Logic ---
const vnOptions = document.getElementById('vietnamese-options');
const vnFeedback = document.getElementById('vietnamese-feedback');

vnOptions.addEventListener('click', (e) => {
  if(e.target.classList.contains('option-btn')) {
    const isCorrect = e.target.dataset.correct === 'true';
    
    if(isCorrect) {
      e.target.classList.add('correct');
      vnFeedback.textContent = 'Hoan hô! Từ "Mênh mông" đồng nghĩa với "Bao la"';
      vnFeedback.className = 'feedback success';
      updateScore(10);
      triggerConfetti();
    } else {
      e.target.classList.add('wrong');
      vnFeedback.textContent = 'Ồ không, hãy suy nghĩ thêm nhé!';
      vnFeedback.className = 'feedback error';
      setTimeout(() => e.target.classList.remove('wrong'), 500);
    }
  }
});

function updateScore(points) {
  currentScore += points;
  scoreElement.textContent = currentScore;
  // Hiệu ứng nảy điểm
  scoreElement.style.transform = 'scale(1.5)';
  setTimeout(() => scoreElement.style.transform = 'scale(1)', 200);
}
