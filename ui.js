// UI Elements
const startScreen = document.getElementById("startScreen");
const levelScreen = document.getElementById("levelScreen");
const levelTitle = document.getElementById("levelTitle");
const levelDescription = document.getElementById("levelDescription");
const countdown = document.getElementById("countdown");
const countdownText = document.getElementById("countdownText");
const gameArea = document.getElementById("gameArea");
const hitZones = [
  document.getElementById("hitZone1"),
  document.getElementById("hitZone2"),
  document.getElementById("hitZone3")
];
const scoreDisplay = document.getElementById("scoreDisplay");
const multiplierDisplay = document.getElementById("multiplierDisplay");
const feedback = document.getElementById("feedback");
const beamFill = document.getElementById("beamFill");
const pauseButton = document.getElementById("pauseButton");
const pauseScreen = document.getElementById("pauseScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScore = document.getElementById("finalScore");
const resumeButton = document.getElementById("resumeButton");
const level1Button = document.getElementById("level1Button");
const level2Button = document.getElementById("level2Button");
const restartButton = document.getElementById("restartButton");
const menuButton = document.getElementById("menuButton");
const hitZoneBar = document.getElementById("hitZoneBar");

// UI Functions
function startLevel(level) {
  currentLevel = level;
  
  // Update level screen content
  if (level === 1) {
    levelTitle.textContent = "Level 1";
    levelDescription.textContent = "Get ready to tap to the rhythm! Hit the notes when they reach the red zone for maximum points. Only the middle lane is active.";
  } else {
    levelTitle.textContent = "Level 2";
    levelDescription.textContent = "All three lanes are active! Notes fall much faster. Stay focused and hit every note perfectly!";
  }
  
  // Fade out start screen
  startScreen.classList.add('fade-out');
  
  setTimeout(() => {
    startScreen.style.display = 'none';
    levelScreen.style.display = 'flex';
    
    // Show level screen for 1 second
    setTimeout(() => {
      levelScreen.style.display = 'none';
      startCountdown();
    }, 1000);
  }, 500);
}

function startCountdown() {
  countdown.style.display = 'flex';
  let count = 3;
  
  function updateCountdown() {
    countdownText.textContent = count;
    countdownText.style.animation = 'none';
    countdownText.offsetHeight; // Trigger reflow
    countdownText.style.animation = 'countdownPulse 1s ease-in-out';
    
    if (count > 1) {
      count--;
      setTimeout(updateCountdown, 1000);
    } else {
      setTimeout(() => {
        countdown.style.display = 'none';
        startGame();
      }, 1000);
    }
  }
  
  updateCountdown();
}

function flashHitZone(laneIndex, type) {
  hitZoneBar.classList.add(`flash-${type}`);
  setTimeout(() => {
    hitZoneBar.classList.remove(`flash-${type}`);
  }, 200);
}

function showFeedback(text) {
  feedback.textContent = text;
  feedback.style.opacity = 1;
  setTimeout(() => {
    feedback.style.opacity = 0;
  }, 600);
}

function updateScoreDisplay() {
  scoreDisplay.textContent = "Score: " + score;
}

function updateMultiplierDisplay() {
  multiplierDisplay.textContent = `Multiplier: ${multiplier}x`;
}

function quitGame() {
  resetGame();
  startScreen.style.display = 'flex';
  startScreen.classList.remove('fade-out');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Level selection
  level1Button.addEventListener("click", () => startLevel(1));
  level2Button.addEventListener("click", () => startLevel(2));

  // Game controls
  pauseButton.addEventListener("click", pauseGame);
  resumeButton.addEventListener("click", resumeGame);
  document.getElementById("quitButton").addEventListener("click", quitGame);
  
  // Game over screen
  restartButton.addEventListener("click", () => {
    resetGame();
    startLevel(currentLevel);
  });
  menuButton.addEventListener("click", quitGame);

  // Lane click handlers
  hitZones.forEach((hitZone, index) => {
    hitZone.addEventListener("click", (e) => {
      e.stopPropagation();
      checkHit(index);
    });
  });
});
