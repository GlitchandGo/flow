// Game state variables
let score = 0;
let notes = [];
let isPaused = false;
let gameInterval;
let gameStarted = false;
let currentLevel = 1;
let multiplier = 1;
let perfectCount = 0;
let consecutiveGoodOkay = 0;

// Game mechanics
function spawnNote() {
  if (isPaused || !gameStarted) return;
  
  let laneIndex;
  if (currentLevel === 1) {
    laneIndex = 1; // Only middle lane
  } else {
    laneIndex = Math.floor(Math.random() * 3); // Random lane
  }
  
  const note = document.createElement("div");
  note.classList.add("note");
  note.style.top = "-40px";
  document.getElementById(`lane${laneIndex + 1}`).appendChild(note);

  const noteObj = {
    el: note,
    y: -40,
    speed: currentLevel === 1 ? 2.2 : 3.5, // Made both levels a bit easier
    hit: false,
    lane: laneIndex
  };

  notes.push(noteObj);
}

function updateNotes() {
  if (isPaused || !gameStarted) return;
  
  for (let i = notes.length - 1; i >= 0; i--) {
    const note = notes[i];
    note.y += note.speed;
    note.el.style.top = note.y + "px";

    if (note.y > window.innerHeight) {
      if (!note.hit) {
        handleMiss(note.lane);
      }
      note.el.remove();
      notes.splice(i, 1);
    }
  }
}

function checkHit(laneIndex) {
  if (isPaused || !gameStarted) return;
  
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    
    if (note.lane !== laneIndex) continue;
    
    const noteCenter = note.y + 20;
    const hitZones = [
      document.getElementById("hitZone1"),
      document.getElementById("hitZone2"),
      document.getElementById("hitZone3")
    ];
    const zoneTop = hitZones[laneIndex].offsetTop;
    const zoneBottom = zoneTop + hitZones[laneIndex].offsetHeight;
    const zoneCenter = zoneTop + (hitZones[laneIndex].offsetHeight / 2);

    if (!note.hit && noteCenter >= zoneTop - 80 && noteCenter <= zoneBottom + 80) {
      note.hit = true;
      note.el.remove();
      notes.splice(i, 1);

      const distance = Math.abs(noteCenter - zoneCenter);

      if (distance < 50) {
        // Perfect
        perfectCount++;
        showFeedback("Perfect 💯");
        flashHitZone(laneIndex, 'perfect');
        consecutiveGoodOkay = 0;
        score += 100 * multiplier;

        if (perfectCount >= 20) {
          if (multiplier < 5) {
            multiplier++;
            updateMultiplierDisplay();
            showFeedback("Multiplier Up 🔥");
          }
          resetBeam();
        } else {
          updateBeam();
        }
      } else if (distance < 85) {
        // Good
        showFeedback("Good 👍");
        flashHitZone(laneIndex, 'good');
        score += 50 * multiplier;
        resetBeam();

        consecutiveGoodOkay++;
        if (consecutiveGoodOkay >= 3) {
          decreaseMultiplier();
          resetConsecutiveGoodOkay();
        }
      } else {
        // Okay
        showFeedback("Okay 👌");
        flashHitZone(laneIndex, 'okay');
        score += 20 * multiplier;
        resetBeam();

        consecutiveGoodOkay++;
        if (consecutiveGoodOkay >= 3) {
          decreaseMultiplier();
          resetConsecutiveGoodOkay();
        }
      }

      updateScoreDisplay();
      return;
    }
  }
}

function handleMiss(laneIndex) {
  showFeedback("Miss ❌");
  flashHitZone(laneIndex, 'miss');
  resetConsecutiveGoodOkay();
  endGame();
}

function resetConsecutiveGoodOkay() {
  consecutiveGoodOkay = 0;
}

function resetBeam() {
  perfectCount = 0;
  updateBeam();
}

function updateBeam() {
  const percent = (perfectCount / 20) * 100;
  document.getElementById("beamFill").style.width = percent + "%";
}

function decreaseMultiplier() {
  if (multiplier > 1) {
    multiplier--;
    updateMultiplierDisplay();
    showFeedback("Multiplier Down ⬇️");
    resetBeam();
  }
}

function startGame() {
  document.getElementById("gameArea").style.display = 'block';
  gameStarted = true;
  
  // All lanes are always visible, but only middle lane spawns notes in Level 1
  document.getElementById("lane1").style.display = 'block';
  document.getElementById("lane2").style.display = 'block';
  document.getElementById("lane3").style.display = 'block';
  
  // Start spawning notes
  const spawnRate = currentLevel === 1 ? 1800 : 1200;
  gameInterval = setInterval(spawnNote, spawnRate);
  gameLoop();
}

function endGame() {
  gameStarted = false;
  isPaused = true;
  
  if (gameInterval) {
    clearInterval(gameInterval);
  }
  
  document.getElementById("finalScore").textContent = `Final Score: ${score}`;
  document.getElementById("gameOverScreen").style.display = 'flex';
}

function pauseGame() {
  isPaused = true;
  document.getElementById("pauseScreen").style.display = 'flex';
}

function resumeGame() {
  isPaused = false;
  document.getElementById("pauseScreen").style.display = 'none';
}

function resetGame() {
  isPaused = false;
  gameStarted = false;
  score = 0;
  multiplier = 1;
  perfectCount = 0;
  consecutiveGoodOkay = 0;
  
  // Clear notes
  notes.forEach(note => note.el.remove());
  notes = [];
  
  // Clear interval
  if (gameInterval) {
    clearInterval(gameInterval);
  }
  
  // Reset displays
  updateScoreDisplay();
  updateMultiplierDisplay();
  document.getElementById("beamFill").style.width = "0%";

  // Hide all screens
  document.getElementById("pauseScreen").style.display = 'none';
  document.getElementById("gameOverScreen").style.display = 'none';
  document.getElementById("gameArea").style.display = 'none';
  document.getElementById("levelScreen").style.display = 'none';
  document.getElementById("countdown").style.display = 'none';
}

function gameLoop() {
  if (gameStarted) {
    updateNotes();
    requestAnimationFrame(gameLoop);
  }
}

// Keyboard controls
document.addEventListener("keydown", (e) => {
  if (!gameStarted || isPaused) return;
  
  switch(e.key) {
    case 'a':
    case 'A':
      if (currentLevel === 2) checkHit(0);
      break;
    case 's':
    case 'S':
    case ' ':
      checkHit(1);
      break;
    case 'd':
    case 'D':
      if (currentLevel === 2) checkHit(2);
      break;
  }
});
