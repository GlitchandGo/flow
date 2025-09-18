// --- SONG DATA ---
const songs = [
    {
        id: 'royalty',
        title: 'Royalty',
        artist: 'Your Artist',
        difficulty: 4,
        highScore: 0,
        mastery: null,
        audio: 'assets/music/royalty.mp3',
        beatmap: 'assets/beatmaps/royalty.json'
    }
];

// --- UI ELEMENTS ---
const screens = {
    startup: document.getElementById('startup'),
    songSelect: document.getElementById('song-select'),
    countdown: document.getElementById('countdown'),
    gameplay: document.getElementById('gameplay'),
};
const playBtn = document.getElementById('playBtn');
const settingsBtn = document.getElementById('settingsBtn');
const songListDiv = document.getElementById('song-list');
const backToStartup = document.getElementById('backToStartup');
const countdownNumber = document.getElementById('countdown-number');
const canvas = document.getElementById('game-canvas');
const scoreDiv = document.getElementById('score');
const comboDiv = document.getElementById('combo');

// --- GAME STATE ---
let selectedSong = null;
let gameState = 'startup'; // 'startup', 'songSelect', 'countdown', 'gameplay'
let score = 0;
let combo = 0;

// --- GAMEPLAY STATE ---
let audio = null;
let beatmap = null;
let notes = [];
let currentNoteIndex = 0;
let gameStartTime = 0;
let laneCount = 3;
const noteSpeed = 1.5; // seconds for note to fall from top to hit bar

// --- SCREEN NAVIGATION ---
function showScreen(name) {
    Object.keys(screens).forEach(scr => screens[scr].classList.remove('active'));
    screens[name].classList.add('active');
    gameState = name;
}

// --- STARTUP SCREEN ---
playBtn.onclick = () => {
    showSongSelect();
};
backToStartup.onclick = () => {
    showScreen('startup');
};
settingsBtn.onclick = () => {
    alert('Settings coming soon!');
};

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
            <div class="song-title">${song.title} - <span style="font-size:1rem;">${song.artist}</span></div>
            <div class="song-meta">Difficulty: ${'⭐'.repeat(song.difficulty)}</div>
            <div class="song-score">
                High Score: <span>${song.highScore}</span>
                ${song.mastery ? renderMedal(song.mastery) : ''}
            </div>
        `;
        entry.onclick = () => startCountdown(song);
        songListDiv.appendChild(entry);
    });
}
function renderMedal(type) {
    if (type === 'gold') return '<span class="mastery-medal">🥇</span>';
    if (type === 'silver') return '<span class="mastery-medal">🥈</span>';
    if (type === 'bronze') return '<span class="mastery-medal">🥉</span>';
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
async function startGame(song) {
    showScreen('gameplay');
    score = 0;
    combo = 0;
    updateGameUI();
    setupCanvas();
    // Load audio and beatmap
    audio = new Audio(song.audio);
    audio.currentTime = 0;
    const res = await fetch(song.beatmap);
    beatmap = await res.json();
    notes = beatmap.notes.map(n => ({...n, hit: false}));
    currentNoteIndex = 0;
    gameStartTime = null;

    // Start music after short delay for countdown
    setTimeout(() => {
        audio.play();
        gameStartTime = performance.now();
        requestAnimationFrame(gameLoop);
    }, 400);
}

function gameLoop(now) {
    if (!gameStartTime) return;
    const elapsed = (now - gameStartTime) / 1000;
    drawNotes(elapsed);
    checkMissedNotes(elapsed);

    // End condition
    if (audio.ended || (currentNoteIndex >= notes.length && elapsed > notes[notes.length - 1].time + 1)) {
        endGame(score);
        return;
    }
    requestAnimationFrame(gameLoop);
}

function drawNotes(elapsed) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStaticLanes();

    // Draw falling notes
    const hitY = canvas.height - 30;
    notes.forEach(note => {
        if (note.hit) return;
        const appearTime = note.time - noteSpeed;
        if (elapsed < appearTime - 0.5) return;
        const t = (elapsed - appearTime) / noteSpeed;
        if (t < 0 || t > 1.2) return;
        const laneWidth = canvas.width / laneCount;
        const x = note.lane * laneWidth + laneWidth / 2;
        const y = hitY * t;
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, 2 * Math.PI);
        ctx.fillStyle = "#41c9ff";
        ctx.shadowColor = "#6ffcff";
        ctx.shadowBlur = 20;
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    });
}

// --- STATIC LANE LINES AND HIT BAR ---
function drawStaticLanes() {
    const ctx = canvas.getContext('2d');
    // Lanes
    for (let i = 1; i < 3; i++) {
        ctx.strokeStyle = '#41c9ff44';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo((canvas.width / 3) * i, 0);
        ctx.lineTo((canvas.width / 3) * i, canvas.height);
        ctx.stroke();
    }
    // Translucent hit bar
    ctx.fillStyle = 'rgba(105,220,255,0.18)';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
    ctx.strokeStyle = '#a066ff99';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, canvas.height - 60, canvas.width, 60);
}

// --- GAMEPLAY INPUT ---
window.addEventListener('keydown', e => {
    if (gameState !== 'gameplay') return;
    let lane = null;
    if (e.key === "ArrowLeft" || e.key === "a") lane = 0;
    if (e.key === "ArrowUp" || e.key === "s") lane = 1;
    if (e.key === "ArrowRight" || e.key === "d") lane = 2;
    if (lane !== null) hitNote(lane);
});
canvas.addEventListener('pointerdown', e => {
    if (gameState !== 'gameplay') return;
    const laneWidth = canvas.width / laneCount;
    const lane = Math.floor(e.offsetX / laneWidth);
    hitNote(lane);
});

function hitNote(lane) {
    if (!gameStartTime) return;
    const now = (performance.now() - gameStartTime) / 1000;
    // Find closest unhit note in this lane within timing window
    let hit = false;
    for (let i = currentNoteIndex; i < notes.length; i++) {
        const note = notes[i];
        if (note.hit) continue;
        if (note.lane !== lane) continue;
        const dt = Math.abs(note.time - now);
        if (dt < 0.21) { // +/-210ms window
            note.hit = true;
            score += Math.max(100 - Math.floor(dt * 400), 50);
            combo++;
            updateGameUI();
            hit = true;
            if (i === currentNoteIndex) currentNoteIndex++;
            break;
        } else if (note.time - now > 0.3) {
            break; // Notes are sorted
        }
    }
    if (!hit) {
        combo = 0;
        updateGameUI();
    }
}

function checkMissedNotes(elapsed) {
    for (let i = currentNoteIndex; i < notes.length; i++) {
        const note = notes[i];
        if (note.hit) continue;
        if (elapsed > note.time + 0.18) {
            note.hit = true;
            combo = 0;
            currentNoteIndex = i + 1;
            updateGameUI();
        } else {
            break;
        }
    }
}

function endGame(newScore) {
    // Save score, update mastery
    if (newScore > selectedSong.highScore) {
        selectedSong.highScore = newScore;
    }
    // Mastery
    if (newScore > 45000) selectedSong.mastery = 'gold';
    else if (newScore > 20000) selectedSong.mastery = 'silver';
    else if (newScore > 10000) selectedSong.mastery = 'bronze';
    showSongSelect();
}

// --- UI HELPERS ---
function updateGameUI() {
    scoreDiv.textContent = `Score: ${score}`;
    comboDiv.textContent = `Combo: ${combo}`;
}

// --- CANVAS RESIZE ---
function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = Math.floor(window.innerHeight * 0.65);
    drawStaticLanes();
}
window.addEventListener('resize', () => {
    if (gameState === 'gameplay') setupCanvas();
});

// --- INIT ---
showScreen('startup');
