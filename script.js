/* ===================================================
   FOR MY SPECIAL ONE - SUSU BABA BIRTHDAY JAVASCRIPT
   Interactive features matching the 7-Page Design Mockup
   =================================================== */

// ================= 1. AUDIO ENGINE =================
class BirthdayAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.timerId = null;
    this.melodyNoteIndex = 0;
    this.currentTimeSeconds = 0;
    this.totalDurationSeconds = 252; // 4:12
    this.progressInterval = null;
    
    this.bgAudio = document.getElementById('bgAudio');
    this.useHtmlAudio = false;

    // Frequencies for Happy Birthday
    this.notes = {
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
      'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
      'G5': 783.99, 'A5': 880.00, 'B5': 987.77
    };

    this.melody = [
      ['G4', 0.75], ['G4', 0.25], ['A4', 1.0], ['G4', 1.0], ['C5', 1.0], ['B4', 2.0],
      ['G4', 0.75], ['G4', 0.25], ['A4', 1.0], ['G4', 1.0], ['D5', 1.0], ['C5', 2.0],
      ['G4', 0.75], ['G4', 0.25], ['G5', 1.0], ['E5', 1.0], ['C5', 1.0], ['B4', 1.0], ['A4', 2.0],
      ['F5', 0.75], ['F5', 0.25], ['E5', 1.0], ['C5', 1.0], ['D5', 1.0], ['C5', 2.5]
    ];

    this.tempo = 125;
    this.setupAudioEvents();
  }

  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration, type = 'triangle') {
    if (!this.ctx || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq * 2, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.28, now + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

      osc.connect(gainNode);
      subOsc.connect(subGain);
      gainNode.connect(this.ctx.destination);
      subGain.connect(this.ctx.destination);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + duration);
      subOsc.stop(now + duration);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  playChimeChord() {
    this.initContext();
    const chord = [523.25, 659.25, 783.99, 1046.50];
    chord.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 1.5, 'sine');
      }, i * 85);
    });
  }

  playNextMelodyNote() {
    if (!this.isPlaying || this.useHtmlAudio) return;

    const [noteName, beats] = this.melody[this.melodyNoteIndex];
    const freq = this.notes[noteName];
    const beatDuration = 60 / this.tempo;
    const duration = beats * beatDuration;

    if (freq) {
      this.playTone(freq, duration * 0.95);
    }

    this.melodyNoteIndex = (this.melodyNoteIndex + 1) % this.melody.length;
    const delay = (this.melodyNoteIndex === 0) ? (duration + 1.2) * 1000 : duration * 1000;
    this.timerId = setTimeout(() => this.playNextMelodyNote(), delay);
  }

  setupAudioEvents() {
    if (this.bgAudio) {
      this.bgAudio.addEventListener('loadedmetadata', () => {
        const timeTotal = document.getElementById('timeTotal');
        if (timeTotal && this.bgAudio.duration) {
          timeTotal.innerText = formatTime(this.bgAudio.duration);
        }
      });

      this.bgAudio.addEventListener('timeupdate', () => {
        if (this.useHtmlAudio && this.bgAudio.duration) {
          updateProgressBar(this.bgAudio.currentTime, this.bgAudio.duration);
        }
      });

      this.bgAudio.addEventListener('ended', () => {
        this.bgAudio.currentTime = 0;
        this.bgAudio.play().catch(() => {});
      });
    }
  }

  start() {
    this.initContext();

    if (this.bgAudio) {
      const playPromise = this.bgAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isPlaying = true;
          this.useHtmlAudio = true;
          const timeTotal = document.getElementById('timeTotal');
          if (timeTotal && this.bgAudio.duration) {
            timeTotal.innerText = formatTime(this.bgAudio.duration);
          }
          updateAllAudioUI(true);
        }).catch((err) => {
          console.log('HTML Audio autoplay blocked or failed, falling back to Web Audio:', err);
          this.useHtmlAudio = false;
          this.startWebAudio();
        });
        return;
      }
    }

    this.startWebAudio();
  }

  startWebAudio() {
    if (this.isPlaying && !this.useHtmlAudio) return;
    this.isPlaying = true;
    this.melodyNoteIndex = 0;
    this.playNextMelodyNote();
    this.startProgressTracking();
    updateAllAudioUI(true);
  }

  startHappyBirthday() {
    this.initContext();
    if (this.bgAudio) {
      this.bgAudio.pause();
    }
    this.useHtmlAudio = false;
    this.isPlaying = true;
    this.melodyNoteIndex = 0;
    if (this.timerId) clearTimeout(this.timerId);
    this.playNextMelodyNote();
    this.startProgressTracking();
    updateAllAudioUI(true);
  }

  stop() {
    this.isPlaying = false;
    if (this.bgAudio) {
      this.bgAudio.pause();
    }
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    updateAllAudioUI(false);
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  startProgressTracking() {
    if (this.progressInterval) clearInterval(this.progressInterval);
    this.progressInterval = setInterval(() => {
      this.currentTimeSeconds = (this.currentTimeSeconds + 1) % this.totalDurationSeconds;
      updateProgressBar(this.currentTimeSeconds, this.totalDurationSeconds);
    }, 1000);
  }

  seek(percentage) {
    if (this.useHtmlAudio && this.bgAudio && this.bgAudio.duration) {
      this.bgAudio.currentTime = percentage * this.bgAudio.duration;
      updateProgressBar(this.bgAudio.currentTime, this.bgAudio.duration);
    } else {
      this.currentTimeSeconds = Math.floor(percentage * this.totalDurationSeconds);
      updateProgressBar(this.currentTimeSeconds, this.totalDurationSeconds);
    }
  }
}

const audioEngine = new BirthdayAudioEngine();

// UI Elements for Audio
const musicToggle = document.getElementById('musicToggle');
const soundWave = document.getElementById('soundWave');
const musicLabel = document.getElementById('musicLabel');
const bigPlayBtn = document.getElementById('bigPlayBtn');
const bigPlayIcon = document.getElementById('bigPlayIcon');
const equalizerBars = document.getElementById('equalizerBars');
const progressFill = document.getElementById('progressFill');
const progressThumb = document.getElementById('progressThumb');
const timeElapsed = document.getElementById('timeElapsed');
const progressBarContainer = document.getElementById('progressBarContainer');

function updateAllAudioUI(playing) {
  if (playing) {
    soundWave.classList.remove('paused');
    equalizerBars.classList.remove('paused');
    musicLabel.innerText = 'Pause Song 🎵';
    bigPlayIcon.innerText = '⏸';
  } else {
    soundWave.classList.add('paused');
    equalizerBars.classList.add('paused');
    musicLabel.innerText = 'Play Our Song 🎵';
    bigPlayIcon.innerText = '▶';
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function updateProgressBar(cur, total) {
  const pct = (cur / total) * 100;
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressThumb) progressThumb.style.left = `${pct}%`;
  if (timeElapsed) timeElapsed.innerText = formatTime(cur);
}

if (musicToggle) {
  musicToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    audioEngine.toggle();
  });
}

if (bigPlayBtn) {
  bigPlayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioEngine.toggle();
  });
}

if (progressBarContainer) {
  progressBarContainer.addEventListener('click', (e) => {
    const rect = progressBarContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    audioEngine.seek(ratio);
  });
}

// User first interaction auto-start celebration
let userHasInteracted = false;
function onUserGesture() {
  if (!userHasInteracted) {
    userHasInteracted = true;
    audioEngine.start();
  }
}
window.addEventListener('click', onUserGesture, { once: true });
window.addEventListener('touchstart', onUserGesture, { once: true });

// ================= 2. NAVBAR SCROLL SPY & MOBILE MENU =================
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navMenu = document.getElementById('navMenu');

if (hamburgerBtn && navMenu) {
  hamburgerBtn.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
    });
  });
}

window.addEventListener('scroll', () => {
  let currentSec = '';
  sections.forEach(sec => {
    const secTop = sec.offsetTop - 120;
    const secHeight = sec.clientHeight;
    if (window.scrollY >= secTop && window.scrollY < secTop + secHeight) {
      currentSec = sec.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${currentSec}`) {
      link.classList.add('active');
    }
  });
});

// ================= 3. FILTER SYSTEM (Memories & Gallery) =================
function setupFilter(filterRowId, gridId, itemSelector, dataAttr) {
  const filterRow = document.getElementById(filterRowId);
  const grid = document.getElementById(gridId);
  if (!filterRow || !grid) return;

  const buttons = filterRow.querySelectorAll('.filter-pill');
  const items = grid.querySelectorAll(itemSelector);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');

      items.forEach(item => {
        const cat = item.getAttribute(dataAttr) || '';
        if (filterVal === 'all' || cat.includes(filterVal)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

setupFilter('memoriesFilterRow', 'memoriesGrid', '.dream-polaroid-card, .dream-sticky-note, .memory-card', 'data-category');
setupFilter('galleryFilterRow', 'galleryGrid', '.gallery-tile', 'data-cat');

// ================= 4. INTERACTIVE BIRTHDAY CAKE =================
const cakeContainer = document.getElementById('cakeContainer');
const candleFlame = document.getElementById('candleFlame');
const candleSmoke = document.getElementById('candleSmoke');
const cakeInstruction = document.getElementById('cakeInstruction');
let isCandleLit = true;

if (cakeContainer) {
  cakeContainer.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isCandleLit) {
      // Blow out candle
      isCandleLit = false;
      if (candleFlame) candleFlame.classList.add('extinguished');
      if (candleSmoke) candleSmoke.classList.remove('hidden');

      audioEngine.playChimeChord();
      burstConfettiFrom(window.innerWidth / 2, window.innerHeight * 0.45);

      if (cakeInstruction) {
        cakeInstruction.innerHTML = '🎉 Wish Made! Happy Birthday Susu Baba! 💖✨';
        cakeInstruction.parentElement.style.background = 'rgba(255, 64, 129, 0.3)';
        cakeInstruction.parentElement.style.borderColor = 'rgba(255, 215, 0, 0.6)';
      }

      setTimeout(() => {
        if (candleSmoke) candleSmoke.classList.add('hidden');
      }, 1600);
    } else {
      // Relight candle
      isCandleLit = true;
      if (candleFlame) candleFlame.classList.remove('extinguished');
      if (cakeInstruction) {
        cakeInstruction.innerHTML = 'Tap candle to blow it out & make a wish! 🕯️';
        cakeInstruction.parentElement.style.background = 'rgba(255, 215, 0, 0.12)';
        cakeInstruction.parentElement.style.borderColor = 'rgba(255, 215, 0, 0.35)';
      }
    }
  });
}

// ================= 5. KEEP SMILING & LOVE COUNTER BUTTONS =================
const keepSmilingBtn = document.getElementById('keepSmilingBtn');
const smileCount = document.getElementById('smileCount');
let smiles = 0;

if (keepSmilingBtn) {
  keepSmilingBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    smiles++;
    smileCount.innerText = `${smiles} 💖`;
    burstConfettiFrom(e.clientX, e.clientY);
    audioEngine.playTone(659.25, 0.3, 'sine');
  });
}

const sendLoveBtn = document.getElementById('sendLoveBtn');
const loveCount = document.getElementById('loveCount');
let loves = 0;
const heartEmojis = ['💖', '❤️', '💕', '🥰', '💗', '✨', '💐', '👑', '🌸', '🎂'];

if (sendLoveBtn) {
  sendLoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    loves++;
    loveCount.innerText = `${loves} ❤️`;

    const rect = sendLoveBtn.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    for (let i = 0; i < 7; i++) {
      createFlyingHeart(originX, originY);
    }

    audioEngine.playTone(523.25 + (loves % 8) * 65, 0.35, 'sine');
  });
}

function createFlyingHeart(x, y) {
  const heart = document.createElement('div');
  heart.className = 'flying-heart';
  heart.innerText = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
  
  const tx = (Math.random() - 0.5) * 280 + 'px';
  const ty = -(Math.random() * 200 + 100) + 'px';
  const rot = (Math.random() - 0.5) * 90 + 'deg';

  heart.style.setProperty('--tx', tx);
  heart.style.setProperty('--ty', ty);
  heart.style.setProperty('--rot', rot);
  heart.style.left = `${x}px`;
  heart.style.top = `${y}px`;

  document.body.appendChild(heart);

  setTimeout(() => {
    heart.remove();
  }, 1600);
}

// Celebration Confetti Cannon Button
const celebrateBtn = document.getElementById('celebrateBtn');
if (celebrateBtn) {
  celebrateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    launchCelebrationConfetti();
    audioEngine.playChimeChord();
  });
}

// Load more button
const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    launchCelebrationConfetti();
    audioEngine.playChimeChord();
    loadMoreBtn.innerHTML = '<span>💖 All Our Beautiful Moments are Cherished Forever 💖</span>';
  });
}

// ================= 6. LIGHTBOX MODAL =================
const lightboxModal = document.getElementById('lightboxModal');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');

function openLightbox(imgUrl, caption) {
  if (lightboxImg && lightboxCaption && lightboxModal) {
    lightboxImg.src = imgUrl;
    lightboxCaption.innerText = caption || '';
    lightboxModal.classList.add('active');
    audioEngine.playTone(659.25, 0.3, 'sine');
  }
}

function closeLightbox() {
  if (lightboxModal) lightboxModal.classList.remove('active');
}

document.querySelectorAll('[data-img]').forEach(el => {
  el.addEventListener('click', () => {
    const imgUrl = el.getAttribute('data-img');
    const caption = el.getAttribute('data-caption');
    if (imgUrl) openLightbox(imgUrl, caption);
  });
});

if (lightboxClose) {
  lightboxClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
  });
}

if (lightboxModal) {
  lightboxModal.addEventListener('click', (e) => {
    if (e.target !== lightboxImg) closeLightbox();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// ================= 7. STARFIELD AMBIENT CANVAS =================
const starCanvas = document.getElementById('starCanvas');
const starCtx = starCanvas ? starCanvas.getContext('2d') : null;
let stars = [];

function resizeStarCanvas() {
  if (!starCanvas) return;
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
  initStars();
}

function initStars() {
  stars = [];
  const numStars = Math.min(window.innerWidth / 12, 110);
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * starCanvas.width,
      y: Math.random() * starCanvas.height,
      radius: Math.random() * 1.8 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.008,
      color: Math.random() > 0.4 ? '#ffffff' : (Math.random() > 0.5 ? '#ff80ab' : '#ffd700')
    });
  }
}

function animateStars() {
  if (!starCtx) return;
  starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  stars.forEach(star => {
    star.alpha += star.speed;
    const currentAlpha = Math.abs(Math.sin(star.alpha));
    starCtx.beginPath();
    starCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    starCtx.fillStyle = star.color;
    starCtx.globalAlpha = currentAlpha * 0.85;
    starCtx.fill();
  });
  requestAnimationFrame(animateStars);
}

if (starCanvas) {
  window.addEventListener('resize', resizeStarCanvas);
  resizeStarCanvas();
  animateStars();
}

// ================= 8. CONFETTI & FIREWORKS SYSTEM =================
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
let confettiPieces = [];

function resizeConfettiCanvas() {
  if (!confettiCanvas) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
if (confettiCanvas) {
  window.addEventListener('resize', resizeConfettiCanvas);
  resizeConfettiCanvas();
}

const confettiPalette = ['#ff4081', '#ff1493', '#ffd700', '#00e5ff', '#ffeb3b', '#e040fb', '#ffffff', '#ff80ab'];

class ConfettiPiece {
  constructor(x, y, isBurst = false) {
    this.x = x !== undefined ? x : Math.random() * confettiCanvas.width;
    this.y = y !== undefined ? y : -20;
    this.size = Math.random() * 8 + 6;
    this.color = confettiPalette[Math.floor(Math.random() * confettiPalette.length)];
    this.shape = Math.random() > 0.35 ? 'rect' : 'circle';
    
    if (isBurst) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 13 + 4;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 5;
    } else {
      this.vx = Math.random() * 4 - 2;
      this.vy = Math.random() * 3 + 2;
    }

    this.gravity = 0.22;
    this.rotation = Math.random() * 360;
    this.rotSpeed = Math.random() * 8 - 4;
    this.opacity = 1;
    this.life = 0;
    this.maxLife = Math.random() * 100 + 120;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.rotation += this.rotSpeed;
    this.life++;

    if (this.life > this.maxLife * 0.7) {
      this.opacity -= 0.03;
    }
  }

  draw(ctx) {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.globalAlpha = Math.max(this.opacity, 0);
    ctx.fillStyle = this.color;

    if (this.shape === 'rect') {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function launchCelebrationConfetti() {
  if (!confettiCanvas) return;
  for (let i = 0; i < 90; i++) {
    confettiPieces.push(new ConfettiPiece(window.innerWidth * 0.2, window.innerHeight * 0.8, true));
    confettiPieces.push(new ConfettiPiece(window.innerWidth * 0.8, window.innerHeight * 0.8, true));
    confettiPieces.push(new ConfettiPiece(window.innerWidth * 0.5, window.innerHeight * 0.5, true));
  }
}

function burstConfettiFrom(x, y) {
  if (!confettiCanvas) return;
  for (let i = 0; i < 75; i++) {
    confettiPieces.push(new ConfettiPiece(x, y, true));
  }
}

function animateConfetti() {
  if (!confettiCtx) return;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  
  for (let i = confettiPieces.length - 1; i >= 0; i--) {
    const p = confettiPieces[i];
    p.update();
    p.draw(confettiCtx);

    if (p.opacity <= 0 || p.y > confettiCanvas.height + 50) {
      confettiPieces.splice(i, 1);
    }
  }

  requestAnimationFrame(animateConfetti);
}

if (confettiCanvas) {
  animateConfetti();
}

// ================= 9. PLAYFUL SURPRISE MODAL LOGIC =================
const openSurpriseBtn = document.getElementById('openSurpriseBtn');
const surpriseModal = document.getElementById('surpriseInteractiveModal');
const modalDismissBtn = document.getElementById('modalDismissBtn');
const modalBackdrop = document.getElementById('modalBackdrop');

const modalStep1 = document.getElementById('modalStep1');
const modalStep2 = document.getElementById('modalStep2');
const modalStep3 = document.getElementById('modalStep3');

const loveYesBtn = document.getElementById('loveYesBtn');
const loveNoBtn = document.getElementById('loveNoBtn');
const babyYesBtn = document.getElementById('babyYesBtn');
const babyNoBtn = document.getElementById('babyNoBtn');
const modalFinishBtn = document.getElementById('modalFinishBtn');

const babyVideo = document.getElementById('babyDancingVideo');
const babyGif = document.getElementById('babyDancingGif');

function openSurpriseModal() {
  if (!surpriseModal) return;
  surpriseModal.classList.add('active');
  showStep(1);
  resetNoButton(loveNoBtn);
  resetNoButton(babyNoBtn);
}

function closeSurpriseModal() {
  if (!surpriseModal) return;
  surpriseModal.classList.remove('active');
  if (babyVideo) {
    babyVideo.pause();
  }
}

function showStep(stepNum) {
  [modalStep1, modalStep2, modalStep3].forEach((step, idx) => {
    if (step) {
      if (idx + 1 === stepNum) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    }
  });
}

function resetNoButton(btn) {
  if (!btn) return;
  btn.classList.remove('fleeing');
  btn.style.position = '';
  btn.style.left = '';
  btn.style.top = '';
}

function dodgeButton(btn, container) {
  if (!btn || !container) return;
  btn.classList.add('fleeing');

  const containerRect = container.getBoundingClientRect();
  const btnWidth = btn.offsetWidth || 100;
  const btnHeight = btn.offsetHeight || 44;

  const maxLeft = Math.max(10, containerRect.width - btnWidth - 20);
  const maxTop = Math.max(10, containerRect.height - btnHeight - 20);

  const randX = Math.floor(Math.random() * maxLeft) + 10;
  const randY = Math.floor(Math.random() * maxTop) + 10;

  btn.style.left = `${randX}px`;
  btn.style.top = `${randY}px`;
}

// Hook up dodging behavior
function setupRunawayButton(btn, container) {
  if (!btn || !container) return;
  ['mouseenter', 'mouseover', 'touchstart', 'pointerdown', 'click'].forEach(evtType => {
    btn.addEventListener(evtType, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dodgeButton(btn, container);
    });
  });
}

const actionsArea1 = document.getElementById('actionsArea1');
const actionsArea2 = document.getElementById('actionsArea2');

setupRunawayButton(loveNoBtn, actionsArea1);
setupRunawayButton(babyNoBtn, actionsArea2);

if (openSurpriseBtn) {
  openSurpriseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openSurpriseModal();
    audioEngine.playChimeChord();
  });
}

if (modalDismissBtn) {
  modalDismissBtn.addEventListener('click', closeSurpriseModal);
}

if (modalBackdrop) {
  modalBackdrop.addEventListener('click', closeSurpriseModal);
}

if (loveYesBtn) {
  loveYesBtn.addEventListener('click', () => {
    burstConfettiFrom(window.innerWidth / 2, window.innerHeight / 2);
    audioEngine.playChimeChord();
    showStep(2);
  });
}

if (babyYesBtn) {
  babyYesBtn.addEventListener('click', () => {
    launchCelebrationConfetti();
    burstConfettiFrom(window.innerWidth / 2, window.innerHeight * 0.4);
    audioEngine.playChimeChord();
    showStep(3);

    if (babyVideo) {
      babyVideo.style.display = 'block';
      if (babyGif) babyGif.style.display = 'none';
      try {
        babyVideo.load();
      } catch (e) {}
      babyVideo.currentTime = 0;
      babyVideo.muted = false;
      const playPromise = babyVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          babyVideo.muted = true;
          babyVideo.play().catch(() => {
            babyVideo.style.display = 'none';
            if (babyGif) babyGif.style.display = 'block';
          });
        });
      }
    }
  });
}

if (modalFinishBtn) {
  modalFinishBtn.addEventListener('click', () => {
    closeSurpriseModal();
    launchCelebrationConfetti();
    const specialDaySec = document.getElementById('special-day');
    if (specialDaySec) {
      specialDaySec.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// ================= 10. GRAND INTRO BIRTHDAY WISH POPUP & HAPPY BIRTHDAY SONG =================
const introWishModal = document.getElementById('introWishModal');
const introCloseBtn = document.getElementById('introCloseBtn');
const btnEnterMainPage = document.getElementById('btnEnterMainPage');
const introBackdrop = document.getElementById('introBackdrop');
const introMusicStatus = document.getElementById('introMusicStatus');
const introMusicText = document.getElementById('introMusicText');
let introAudioStarted = false;

function tryStartIntroAudio() {
  if (introAudioStarted) return;
  audioEngine.initContext();
  audioEngine.startHappyBirthday();
  introAudioStarted = true;
  if (introMusicText) {
    introMusicText.innerText = 'Playing Happy Birthday Song for Susu Baba ♡';
  }
}

function openIntroWishModal() {
  if (!introWishModal) return;
  introWishModal.classList.add('active');
  launchCelebrationConfetti();
  burstConfettiFrom(window.innerWidth / 2, window.innerHeight * 0.35);

  // Attempt to play Happy Birthday song
  tryStartIntroAudio();
}

function closeIntroWishModalAndGoMain() {
  if (!introWishModal) return;
  introWishModal.classList.remove('active');
  launchCelebrationConfetti();
  burstConfettiFrom(window.innerWidth / 2, window.innerHeight * 0.4);

  // Stop Happy Birthday song & transition to romantic background song
  audioEngine.stop();
  setTimeout(() => {
    audioEngine.start();
  }, 450);

  const homeSec = document.getElementById('home');
  if (homeSec) {
    homeSec.scrollIntoView({ behavior: 'smooth' });
  }
}

if (btnEnterMainPage) {
  btnEnterMainPage.addEventListener('click', (e) => {
    e.preventDefault();
    closeIntroWishModalAndGoMain();
  });
}

if (introCloseBtn) {
  introCloseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeIntroWishModalAndGoMain();
  });
}

if (introBackdrop) {
  introBackdrop.addEventListener('click', () => {
    closeIntroWishModalAndGoMain();
  });
}

if (introMusicStatus) {
  introMusicStatus.addEventListener('click', (e) => {
    e.stopPropagation();
    audioEngine.initContext();
    if (audioEngine.isPlaying && !audioEngine.useHtmlAudio) {
      audioEngine.stop();
      if (introMusicText) introMusicText.innerText = 'Paused • Tap to Play Happy Birthday 🎵';
    } else {
      audioEngine.startHappyBirthday();
      if (introMusicText) introMusicText.innerText = 'Playing Happy Birthday Song for Susu Baba ♡';
    }
  });
}

// User interaction fallback to start audio if browser blocked initial autoplay
['click', 'touchstart', 'keydown'].forEach(evtType => {
  window.addEventListener(evtType, () => {
    if (introWishModal && introWishModal.classList.contains('active') && !introAudioStarted) {
      tryStartIntroAudio();
    }
  }, { once: true });
});

// Auto show intro popup immediately on load
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', openIntroWishModal);
} else {
  openIntroWishModal();
}

