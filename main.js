// --- SONG DATA ---
const songs = [
    {
        id: 'moonlight',
        title: 'Moonlight',
        artist: 'Flow',
        difficulty: 1,
        highScore: 0,
        mastery: null,
        audio: 'assets/music/moonlight.mp3',
        beatmap: 'assets/beatmaps/moonlight.json',
        isTutorial: true
    },
    {
        id: 'royalty',
        title: 'Royalty',
        artist: 'Egzod + Maestro Chives',
        difficulty: 2,
        highScore: 0,
        mastery: null,
        audio: 'assets/music/royalty.mp3',
        beatmap: 'assets/beatmaps/royalty.json'
    },
    {
        id: 'ares',
        title: 'Ares',
        artist: 'ZAM + Reverse Prodigy + Flourier',
        difficulty: 5,
        highScore: 0,
        mastery: null,
        audio: 'assets/music/ares.mp3',
        beatmap: 'assets/beatmaps/ares.json',
        startTime: 45
    },
    {
        id: 'rush-e',
        title: 'Rush E',
        artist: 'Sheet Music Boss',
        difficulty: 5,
        highScore: 0,
        mastery: null,
        audio: 'assets/music/rush-e.mp3',
        beatmap: 'assets/beatmaps/rush-e.json'
        startTime: 15
    }
];

// --- UI ELEMENTS ---
const screens = {
    startup: document.getElementById('startup'),
    songSelect: document.getElementById('song-select'),
    countdown: document.getElementById('countdown'),
    gameplay: document.getElementById('gameplay'),
    endscreen: document.getElementById('endscreen')
};
const playBtn = document.getElementById('playBtn');
const settingsBtn = document.getElementById('settingsBtn');
const songListDiv = document.getElementById('song-list');
const backToStartup = document.getElementById('backToStartup');
const countdownNumber = document.getElementById('countdown-number');
const canvas = document.getElementById('game-canvas');
const scoreDiv = document.getElementById('score');
const songTitleDiv = document.getElementById('song-title');

// Endscreen
const endscreen = document.getElementById('endscreen');
const endscreenTitle = document.getElementById('endscreen-title');
const endscreenScore = document.getElementById('endscreen-score');
const endscreenBtn = document.getElementById('endscreen-btn');
const endscreenProgress = (() => {
    let el = document.getElementById('endscreen-progress');
    if (!el) {
        el = document.createElement('div');
        el.id = 'endscreen-progress';
        endscreen.insertBefore(el, endscreenScore.nextSibling);
    }
    return el;
})();

// --- GAME STATE ---
let selectedSong = null;
let gameState = 'startup';
let score = 0;
let tutorialTimeouts = [];

// --- GAMEPLAY STATE ---
let audio = null;
let beatmap = null;
let notes = [];
let currentNoteIndex = 0;
let laneCount = 3;
const noteSpeed = 0.7;
const hitBarHeight = 130;
const noteSize = 60;
const HIT_WINDOWS = { perfect: 0.15, good: 0.30, ok: 0.45 };
let perfectPerNote = 10;

// --- SCORE STARS & MASTERIES ---
const SCORE_STARS = [
    { threshold: 8000, emoji: '⭐️', count: 5 },
    { threshold: 7000, emoji: '⭐️', count: 4 },
    { threshold: 6000, emoji: '⭐️', count: 3 },
    { threshold: 5000, emoji: '⭐️', count: 2 },
    { threshold: 4000, emoji: '⭐️', count: 1 }
];
const SCORE_MASTERIES = [
    { threshold: 9900, emoji: '🏅', name: 'platinum' },
    { threshold: 9500, emoji: '🥇', name: 'gold' },
    { threshold: 9000, emoji: '🥈', name: 'silver' },
    { threshold: 8500, emoji: '🥉', name: 'bronze' }
];

// --- FIRST TIME LAUNCH, FORCE MOONLIGHT ---
(function firstTimeTutorial() {
    if (!localStorage.getItem('flowFirstLaunchDone')) {
        localStorage.setItem('flowFirstLaunchDone', 'true');
        localStorage.setItem('flowLastSong', 'moonlight');
        setTimeout(() => {
            startCountdown(songs.find(s => s.id === 'moonlight'));
        }, 250);
    } else {
        // If user was last playing a song, auto-select it (optional)
        const last = localStorage.getItem('flowLastSong');
        if (last && songs.some(s => s.id === last)) {
            selectedSong = songs.find(s => s.id === last);
        }
    }
})();

// --- HIGH SCORE STORAGE ---
function loadHighScores() {
    let local = {};
    try { local = JSON.parse(localStorage.getItem("flowHighScores") || "{}"); } catch {}
    songs.forEach(song => {
        if (typeof local[song.id] === "number") song.highScore = local[song.id];
    });
}
function saveHighScore(songId, score) {
    let local = {};
    try { local = JSON.parse(localStorage.getItem("flowHighScores") || "{}"); } catch {}
    local[songId] = score;
    localStorage.setItem("flowHighScores", JSON.stringify(local));
    localStorage.setItem('flowLastSong', songId);
}

// --- SCREEN NAVIGATION ---
function showScreen(name) {
    Object.keys(screens).forEach(scr => screens[scr].classList.remove('active'));
    screens[name].classList.add('active');
    gameState = name;
    if (name !== 'gameplay') clearTutorial();
}

// --- STARTUP SCREEN ---
playBtn.onclick = () => { showSongSelect(); };
backToStartup.onclick = () => { showScreen('startup'); };
settingsBtn.onclick = () => { alert('Settings coming soon!'); };

// --- SONG SELECT SCREEN ---
function showSongSelect() {
    renderSongList();
    showScreen('songSelect');
}
function renderSongList() {
    songListDiv.innerHTML = '';
    songs.forEach(song => {
        const entry = document.createElement('div');
        entry.className = 'song-entry';
        entry.innerHTML = `
            <div class="song-title">
                ${song.title} <span style="font-size:1rem;">- ${song.artist || ""}</span>
                ${song.isTutorial ? '<span style="color:#41c9ff;font-size:1rem;"> (Tutorial)</span>' : ''}
            </div>
            <div class="song-meta">Difficulty: <span style="font-size:1.2em">${'🔥'.repeat(song.difficulty)}</span></div>
            <div class="song-divider"></div>
            <div class="song-score">
                High Score: <span>${song.highScore}</span> ${renderScoreStars(song.highScore)} ${renderMasteryMedal(song.highScore)}
            </div>
        `;
        entry.onclick = () => startCountdown(song);
        songListDiv.appendChild(entry);
    });
}
function renderScoreStars(score) {
    let stars = '';
    for (let i = SCORE_STARS.length - 1; i >= 0; i--) {
        if (score >= SCORE_STARS[i].threshold) {
            stars = ' '.repeat(SCORE_STARS[i].count - 1) + '⭐️'.repeat(SCORE_STARS[i].count);
            break;
        }
    }
    return stars ? `<span style="color:gold;font-size:1.3em;margin-left:0.3em;">${stars}</span>` : '';
}
function renderMasteryMedal(score) {
    for (const m of SCORE_MASTERIES) {
        if (score >= m.threshold) return `<span style="font-size:1.3em;margin-left:0.2em;">${m.emoji}</span>`;
    }
    return '';
}

// --- COUNTDOWN ---
function startCountdown(song) {
    selectedSong = song;
    showScreen('countdown');
    let count = 3;
    countdownNumber.textContent = count;
    countdownNumber.style.animation = 'countdown-pop 0.8s';
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNumber.textContent = count;
            countdownNumber.style.animation = 'none';
            void countdownNumber.offsetWidth;
            countdownNumber.style.animation = 'countdown-pop 0.8s';
        } else if (count === 0) {
            countdownNumber.textContent = 'Flow!';
            countdownNumber.style.animation = 'none';
            void countdownNumber.offsetWidth;
            countdownNumber.style.animation = 'countdown-pop 0.8s';
        } else {
            clearInterval(interval);
            startGame(selectedSong);
        }
    }, 900);
}

// --- GAMEPLAY ---
let gameEnded = false;
let tutorialActive = false;

async function startGame(song) {
    showScreen('gameplay');
    score = 0;
    gameEnded = false;
    updateGameUI(song);
    setupCanvas();
    audio = new Audio(song.audio);
    let setTime = song.startTime || 0;
    let ready = false;

    audio.currentTime = setTime;
    audio.addEventListener('seeked', () => {
        if (ready) return;
        ready = true;
        audio.play();
        requestAnimationFrame(gameLoop);
    });
    setTimeout(() => { if (!ready) { audio.play(); requestAnimationFrame(gameLoop); } }, 700);

    const res = await fetch(song.beatmap);
    beatmap = await res.json();
    notes = beatmap.notes.map(n => ({...n, hit: false, result: null}));
    currentNoteIndex = 0;
    hitFeedbacks = [];
    songTitleDiv.textContent = song.title;
    perfectPerNote = 10000 / notes.length;

    // --- TUTORIAL FOR MOONLIGHT ---
    if (song.id === 'moonlight') {
        tutorialActive = true;
        runTutorial();
    }
}

function runTutorial() {
    clearTutorial();
    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '50';
    overlay.style.background = 'rgba(12,0,38,0.93)';
    overlay.style.fontFamily = 'Orbitron,Arial,sans-serif';
    overlay.style.fontSize = '2.1rem';
    overlay.style.color = '#41c9ff';
    overlay.style.textAlign = 'center';
    overlay.style.transition = 'opacity 0.5s';
    overlay.style.pointerEvents = 'none';

    overlay.textContent = "Welcome to Flow";
    document.body.appendChild(overlay);

    tutorialTimeouts.push(setTimeout(() => {
        overlay.textContent = "Tap when a note reaches the bar below!";
        overlay.style.fontSize = '1.5rem';
        overlay.style.color = '#fff';
    }, 2250));
    tutorialTimeouts.push(setTimeout(() => {
        overlay.textContent = "Get Flowing!";
        overlay.style.fontSize = '2.3rem';
        overlay.style.color = '#e94fff';
    }, 4500));
    tutorialTimeouts.push(setTimeout(() => {
        overlay.style.opacity = '0';
        tutorialActive = false;
        setTimeout(() => { overlay.remove(); }, 700);
    }, 6800));
}
function clearTutorial() {
    tutorialTimeouts.forEach(t => clearTimeout(t));
    tutorialTimeouts = [];
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.remove();
    tutorialActive = false;
}

let hitFeedbacks = [];

function endGameAndShowScreen() {
    if (gameEnded) return;
    gameEnded = true;
    if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
    }
    showEndscreen();
}

function gameLoop() {
    if (gameState !== 'gameplay' || gameEnded) return;
    const elapsed = audio.currentTime;
    drawNotes(elapsed);
    checkMissedNotes(elapsed);
    drawHitFeedbacks();
    const allNotesProcessed = currentNoteIndex >= notes.length;
    if (allNotesProcessed || audio.ended) {
        endGameAndShowScreen();
        return;
    }
    requestAnimationFrame(gameLoop);
}

function drawNotes(elapsed) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStaticLanes();
    const hitY = canvas.height - hitBarHeight / 2;
    notes.forEach(note => {
        if (note.hit) return;
        const appearTime = note.time - noteSpeed;
        if (elapsed < appearTime - 0.5) return;
        const t = (elapsed - appearTime) / noteSpeed;
        if (t < 0 || t > 1.2) return;
        const laneWidth = canvas.width / laneCount;
        const x = note.lane * laneWidth + laneWidth / 2 - noteSize / 2;
        const y = t * (hitY - (0 - noteSize/2)) + (0 - noteSize/2);
        ctx.save();
        ctx.fillStyle = "#41c9ff";
        ctx.strokeStyle = "#6ffcff";
        ctx.shadowColor = "#6ffcff";
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.95;
        ctx.fillRect(x, y, noteSize, noteSize);
        ctx.strokeRect(x, y, noteSize, noteSize);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
    });
}

function drawStaticLanes() {
    const ctx = canvas.getContext('2d');
    for (let i = 1; i < laneCount; i++) {
        ctx.strokeStyle = '#41c9ff44';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo((canvas.width / laneCount) * i, 0);
        ctx.lineTo((canvas.width / laneCount) * i, canvas.height);
        ctx.stroke();
    }
    ctx.fillStyle = 'rgba(105,220,255,0.18)';
    ctx.fillRect(0, canvas.height - hitBarHeight, canvas.width, hitBarHeight);
    ctx.strokeStyle = '#a066ff99';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, canvas.height - hitBarHeight, canvas.width, hitBarHeight);
}

window.addEventListener('keydown', e => {
    if (gameState !== 'gameplay' || gameEnded || tutorialActive) return;
    let lane = null;
    if (e.key === "ArrowLeft" || e.key === "a") lane = 0;
    if (e.key === "ArrowUp" || e.key === "s") lane = 1;
    if (e.key === "ArrowRight" || e.key === "d") lane = 2;
    if (lane !== null) hitNote(lane);
});
canvas.addEventListener('pointerdown', e => {
    if (gameState !== 'gameplay' || gameEnded || tutorialActive) return;
    const laneWidth = canvas.width / laneCount;
    const lane = Math.floor(e.offsetX / laneWidth);
    hitNote(lane);
});

function hitNote(lane) {
    if (!audio || gameEnded || tutorialActive) return;
    const now = audio.currentTime;
    let bestNoteIdx = -1, bestDt = 999;
    for (let i = currentNoteIndex; i < notes.length; i++) {
        const note = notes[i];
        if (note.hit) continue;
        if (note.lane !== lane) continue;
        const dt = Math.abs(note.time - now);
        if (dt < bestDt && dt <= HIT_WINDOWS.ok) {
            bestNoteIdx = i;
            bestDt = dt;
        }
        if (note.time - now > HIT_WINDOWS.ok) break;
    }
    if (bestNoteIdx !== -1) {
        const note = notes[bestNoteIdx];
        let rating = "";
        let pts = 0;
        if (bestDt <= HIT_WINDOWS.perfect) {
            rating = "Perfect";
            pts = perfectPerNote;
        } else if (bestDt <= HIT_WINDOWS.good) {
            rating = "Good";
            pts = perfectPerNote * 0.7;
        } else if (bestDt <= HIT_WINDOWS.ok) {
            rating = "OK";
            pts = perfectPerNote * 0.4;
        }
        note.hit = true;
        note.result = rating;
        score += pts;
        updateGameUI(selectedSong);
        showHitFeedback(lane, rating);
        if (bestNoteIdx === currentNoteIndex) {
            while (currentNoteIndex < notes.length && notes[currentNoteIndex].hit) currentNoteIndex++;
        }
    }
}

function checkMissedNotes(elapsed) {
    if (gameEnded) return;
    for (let i = currentNoteIndex; i < notes.length; i++) {
        const note = notes[i];
        if (note.hit) continue;
        if (elapsed > note.time + HIT_WINDOWS.ok) {
            note.hit = true;
            note.result = "Miss";
            showHitFeedback(note.lane, "Miss");
            currentNoteIndex = i + 1;
            updateGameUI(selectedSong);
            endGameAndShowScreen();
            break;
        } else {
            break;
        }
    }
}

function showHitFeedback(lane, text) {
    const laneWidth = canvas.width / laneCount;
    const x = lane * laneWidth + laneWidth / 2;
    const y = canvas.height - hitBarHeight / 2;
    hitFeedbacks.push({ x, y, text, time: performance.now() });
}
function drawHitFeedbacks() {
    const ctx = canvas.getContext('2d');
    const now = performance.now();
    hitFeedbacks = hitFeedbacks.filter(hf => {
        const elapsed = (now - hf.time) / 1000;
        if (elapsed > 0.8) return false;
        ctx.save();
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 1 - elapsed / 0.8;
        let color = "#fff";
        if (hf.text === "Perfect") color = "#6ffcff";
        else if (hf.text === "Good") color = "#41c9ff";
        else if (hf.text === "OK") color = "#a066ff";
        else if (hf.text === "Miss") color = "#e94fff";
        ctx.fillStyle = color;
        ctx.fillText(hf.text, hf.x, hf.y - 40 - 40 * elapsed);
        ctx.restore();
        return true;
    });
}

function getScoreStars(score) {
    for (let i = 0; i < SCORE_STARS.length; i++) {
        if (score >= SCORE_STARS[i].threshold) return SCORE_STARS[i].count;
    }
    return 0;
}
function getMastery(score) {
    for (const m of SCORE_MASTERIES) {
        if (score >= m.threshold) return m.name;
    }
    return null;
}
function getMedalEmoji(score) {
    for (const m of SCORE_MASTERIES) {
        if (score >= m.threshold) return m.emoji;
    }
    return '';
}
function getStarBar(score) {
    let stars = getScoreStars(score);
    let progress = Math.min(score / 10000, 1);
    let bar = '';
    let barLen = 220;
    // Draw progress bar and faded stars
    for (let i = 1; i <= 5; i++) {
        const starAt = i * 0.08 + 0.16 * (i - 1); // Even spread
        bar += `<span style="opacity:${progress > starAt ? 1 : 0.2};font-size:2rem;position:absolute;left:${20+barLen*starAt}px;top:-12px;pointer-events:none;">⭐️</span>`;
    }
    return `
      <div style="width:${barLen+40}px;height:36px;position:relative;margin:0.7em auto 0.3em auto;">
        <div style="background:#23234b;border-radius:30px;height:16px;width:${barLen}px;position:absolute;left:20px;top:16px;box-shadow:0 0 8px #8884;">
          <div style="background:linear-gradient(90deg,#41c9ff,#e94fff);width:${Math.round(progress*barLen)}px;height:100%;border-radius:30px;transition:width 0.8s;"></div>
        </div>
        ${bar}
      </div>
    `;
}

function showEndscreen() {
    let finalScore = Math.round(score);
    // Save best score
    if (finalScore > selectedSong.highScore) {
        selectedSong.highScore = finalScore;
        saveHighScore(selectedSong.id, finalScore);
    }

    // Mastery
    let mastery = getMastery(finalScore);
    selectedSong.mastery = mastery;

    // Level Complete text, score, medals, and progress bar
    endscreenTitle.textContent = "Level Complete!";
    endscreenScore.innerHTML = `Score: ${finalScore} ${getMedalEmoji(finalScore)}`;
    endscreenProgress.innerHTML = getStarBar(finalScore);

    endscreenBtn.textContent = "Back to Song Select";
    showScreen('endscreen');
}

endscreenBtn.onclick = () => { showSongSelect(); };

function updateGameUI(songObj) {
    scoreDiv.textContent = Math.round(score);
    if (songObj) songTitleDiv.textContent = songObj.title;
}

function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawStaticLanes();
}
window.addEventListener('resize', () => {
    if (gameState === 'gameplay') setupCanvas();
});

loadHighScores();
showScreen('startup');
