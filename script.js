// Game Configuration
const config = {
  boxSize: 20,
  initialSpeed: 150,
  speedIncrease: 5,
  maxSpeed: 50
};

// Game Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');

// Set canvas size based on device
function resizeCanvas() {
  const size = Math.min(window.innerWidth - 40, 400);
  canvas.width = size;
  canvas.height = size;
  
  // Adjust box size to fit canvas
  config.boxSize = Math.floor(size / 20);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game State
let snake = [];
let food = {};
let direction = null;
let nextDirection = null;
let gameStarted = false;
let isPaused = false;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let speed = config.initialSpeed;
let gameInterval;

// Audio Elements
const sounds = {
  bgMusic: document.getElementById('bgMusic'),
  move: document.getElementById('moveSound'),
  food: document.getElementById('foodSound'),
  gameOver: document.getElementById('gameOverSound')
};

// Initialize Game
function initGame() {
  const centerX = Math.floor(canvas.width / config.boxSize / 2) * config.boxSize;
  const centerY = Math.floor(canvas.height / config.boxSize / 2) * config.boxSize;
  
  snake = [
      { x: centerX, y: centerY }
  ];
  
  generateFood();
  direction = null;
  nextDirection = null;
  score = 0;
  speed = config.initialSpeed;
  updateScore();
}

// Generate Food
function generateFood() {
  const maxPos = canvas.width / config.boxSize - 1;
  
  food = {
      x: Math.floor(Math.random() * maxPos) * config.boxSize,
      y: Math.floor(Math.random() * maxPos) * config.boxSize
  };
  
  // Make sure food doesn't spawn on snake
  for (let segment of snake) {
      if (segment.x === food.x && segment.y === food.y) {
          return generateFood();
      }
  }
}

// Game Loop
function gameLoop() {
  if (isPaused) return;
  
  // Update direction at the start of each frame to prevent instant reverse
  if (nextDirection) {
      direction = nextDirection;
      nextDirection = null;
  }
  
  // Move snake
  const head = { ...snake[0] };
  
  switch (direction) {
      case 'UP': head.y -= config.boxSize; break;
      case 'DOWN': head.y += config.boxSize; break;
      case 'LEFT': head.x -= config.boxSize; break;
      case 'RIGHT': head.x += config.boxSize; break;
      default: return; // No direction set
  }
  
  // Check collisions
  if (
      head.x < 0 || head.x >= canvas.width ||
      head.y < 0 || head.y >= canvas.height ||
      snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
      gameOver();
      return;
  }
  
  // Add new head
  snake.unshift(head);
  
  // Check if food eaten
  if (head.x === food.x && head.y === food.y) {
      score++;
      playSound('food');
      
      // Increase speed slightly (capped)
      if (speed > config.maxSpeed) {
          speed -= config.speedIncrease;
          clearInterval(gameInterval);
          gameInterval = setInterval(gameLoop, speed);
      }
      
      generateFood();
      updateScore();
  } else {
      // Remove tail if no food eaten
      snake.pop();
  }
  
  // Draw everything
  draw();
}

// Draw Game
function draw() {
  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw snake
  snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#4CAF50' : '#388E3C';
      ctx.fillRect(segment.x, segment.y, config.boxSize, config.boxSize);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(segment.x, segment.y, config.boxSize, config.boxSize);
  });
  
  // Draw food
  ctx.fillStyle = '#F44336';
  ctx.beginPath();
  ctx.arc(
      food.x + config.boxSize / 2,
      food.y + config.boxSize / 2,
      config.boxSize / 2,
      0,
      Math.PI * 2
  );
  ctx.fill();
}

// Update Score Display
function updateScore() {
  scoreDisplay.textContent = score;
  highScoreDisplay.textContent = highScore;
}

// Game Controls
function startGame() {
  if (gameStarted && !isPaused) return;
  
  if (!gameStarted) {
      initGame();
      gameStarted = true;
  }
  
  isPaused = false;
  document.getElementById('pauseBtn').textContent = 'Pause';
  
  // Start game loop
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, speed);
  
  // Play background music
  playSound('bgMusic');
}

function pauseGame() {
  isPaused = true;
  document.getElementById('pauseBtn').textContent = 'Resume';
  clearInterval(gameInterval);
  sounds.bgMusic.pause();
}

function togglePause() {
  if (!gameStarted) return startGame();
  
  if (isPaused) {
      startGame();
  } else {
      pauseGame();
  }
}

function restartGame() {
  clearInterval(gameInterval);
  gameStarted = false;
  isPaused = false;
  initGame();
  document.getElementById('pauseBtn').textContent = 'Pause';
  sounds.bgMusic.pause();
  draw();
}

function gameOver() {
  clearInterval(gameInterval);
  gameStarted = false;
  playSound('gameOver');
  sounds.bgMusic.pause();
  
  // Update high score
  if (score > highScore) {
      highScore = score;
      localStorage.setItem('snakeHighScore', highScore);
      updateScore();
  }
  
  setTimeout(() => {
      alert(`Game Over!\nScore: ${score}\nHigh Score: ${highScore}`);
      restartGame();
  }, 100);
}

// Input Handling
function setDirection(newDirection) {
  if (!gameStarted) {
      startGame();
  }
  
  // Prevent reversing direction
  if (
      (direction === 'UP' && newDirection === 'DOWN') ||
      (direction === 'DOWN' && newDirection === 'UP') ||
      (direction === 'LEFT' && newDirection === 'RIGHT') ||
      (direction === 'RIGHT' && newDirection === 'LEFT')
  ) {
      return;
  }
  
  // Queue the direction change for next frame
  nextDirection = newDirection;
  
  // Play move sound
  playSound('move');
}

// Touch Controls
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  const touch = e.changedTouches[0];
  const touchEndX = touch.clientX;
  const touchEndY = touch.clientY;
  
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  
  // Determine swipe direction
  if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? 'RIGHT' : 'LEFT');
  } else {
      setDirection(dy > 0 ? 'DOWN' : 'UP');
  }
}, { passive: false });

// Keyboard Controls
document.addEventListener('keydown', (e) => {
  switch (e.key) {
      case 'ArrowUp': setDirection('UP'); break;
      case 'ArrowDown': setDirection('DOWN'); break;
      case 'ArrowLeft': setDirection('LEFT'); break;
      case 'ArrowRight': setDirection('RIGHT'); break;
      case ' ': togglePause(); break;
      case 'Enter': startGame(); break;
      case 'r': restartGame(); break;
  }
});

// Button Controls
document.querySelectorAll('.dir-btn').forEach(btn => {
  btn.addEventListener('click', () => {
      setDirection(btn.dataset.dir);
  });
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('restartBtn').addEventListener('click', restartGame);

// Sound Management
function playSound(sound) {
  try {
      sounds[sound].currentTime = 0;
      sounds[sound].play().catch(e => console.log('Audio error:', e));
  } catch (e) {
      console.log('Sound error:', e);
  }
}

// Prevent context menu on mobile
document.addEventListener('contextmenu', e => e.preventDefault()); 