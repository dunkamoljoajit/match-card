// ==========================================
// 🎵 ระบบเสียง (Audio)
// ==========================================
// 💡 คุณต้องมีไฟล์เหล่านี้อยู่ในโฟลเดอร์เดียวกับเว็บ
// ==========================================
// 🎵 ระบบเสียง (Audio - ป้องกันเสียงซ้อนและตัดกัน)
// ==========================================
const bgm = new Audio('bgm.mp3');
bgm.loop = true; 
bgm.volume = 0.25; // 💡 ลดเสียง BGM ลงเหลือ 25% เพื่อให้เสียงเอฟเฟกต์เด่นชัดขึ้น ไม่ตีกับเพลง

// โหลดไฟล์เสียงเอฟเฟกต์
const clickSound = new Audio('click.mp3'); 
const flipSound = new Audio('flip.mp3'); 
const matchSound = new Audio('match.mp3'); 
const winSound = new Audio('win.mp3'); 
const loseSound = new Audio('lose.mp3'); 

// 💡 ฟังก์ชันเล่นเสียงแบบโคลนตัวโน้ต (แก้ปัญหาเสียงตัด และกดรัวๆ แล้วเสียงไม่มา)
function playSound(audioObj) {
    if (!audioObj) return;
    try {
        // สร้างร่างโคลนขึ้นมาเล่นเฉพาะกิจ เสียงจะซ้อนทับกันได้อิสระ ไม่แย่งกันเล่น
        let soundClone = audioObj.cloneNode();
        soundClone.volume = audioObj.volume; // คงระดับความดังเดิมไว้
        soundClone.play().catch(e => console.log("รอการคลิกหน้าจอเพื่อปลดล็อกเสียง"));
    } catch (error) {
        console.log("Audio play error:", error);
    }
}

// ==========================================
// 🚪 ระบบหน้าด่านคำถาม (Gate Screen) ใครชอบก่อน?
// ==========================================
const gateScreen = document.getElementById('gate-screen');
const btnNongSo = document.getElementById('btn-nong-so');
const pTeeWrapper = document.getElementById('p-tee-wrapper');
const btnPTee = document.getElementById('btn-p-tee');
let pTeeScale = 1; 

btnNongSo.addEventListener('click', () => {
    playSound(clickSound); // 🎵 เสียงกดปุ่ม

    pTeeScale += 0.2; 
    if(pTeeScale > 1.8) pTeeScale = 1.8; 
    
    pTeeWrapper.style.transform = `scale(${pTeeScale})`;
    
    const originalText = btnNongSo.innerText;
    btnNongSo.innerText = "แน่ใจเหรอ? 🤨";
    
    setTimeout(() => {
        if(btnNongSo.innerText === "แน่ใจเหรอ? 🤨") {
            btnNongSo.innerText = originalText;
        }
    }, 1200);
});

btnPTee.addEventListener('click', () => {
    playSound(clickSound); // 🎵 เสียงกดปุ่ม
    bgm.play().catch(e => console.log("เบราว์เซอร์บล็อกการเล่นเสียงอัตโนมัติ")); // 🎵 เริ่มเล่นเพลงพื้นหลัง
    
    gateScreen.style.opacity = '0'; 
    setTimeout(() => {
        gateScreen.style.display = 'none'; 
    }, 500);
});

// ==========================================
// 💡 สร้างรายชื่อรูปภาพ 1-68 อัตโนมัติ
// ==========================================
const allImages = [];
for (let i = 1; i <= 68; i++) {
    allImages.push(`picture/${i}.jpg`);
}

// ==========================================
// 🎨 สร้างภาพพื้นหลัง Photo Collage
// ==========================================
function buildBackgroundCollage() {
    const collage = document.getElementById('bg-collage');
    if (!collage) return;
    
    collage.innerHTML = '';
    
    let duplicatedImages = [];
    while(duplicatedImages.length < 360) {
        let shuffled = [...allImages].sort(() => 0.5 - Math.random());
        duplicatedImages = duplicatedImages.concat(shuffled);
    }
    
    duplicatedImages = duplicatedImages.slice(0, 360);

    duplicatedImages.forEach(imgUrl => {
        let tile = document.createElement('div');
        tile.classList.add('bg-tile');
        tile.style.backgroundImage = `url('${imgUrl}')`;
        collage.appendChild(tile);
    });
}
buildBackgroundCollage();

// ==========================================
// 🎮 ตัวแปรระบบเกม
// ==========================================
let currentLevel = 1;
let timeLeft = 60;
let timerInterval = null;
let flippedCards = [];
let matchedPairs = 0;
let isLocked = false;
let isTimerPaused = false; 
let availableImages = []; 
const totalPairs = 6; 
const finalLevel = 8; // ด่านสุดท้าย

// DOM Elements ของเกม
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const matchingBoard = document.getElementById('matching-board');
const timeDisplay = document.getElementById('time-display');
const levelDisplay = document.getElementById('level-display');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

const startBtn = document.getElementById('start-btn');
const nextLevelBtn = document.getElementById('next-level-btn');
const retryBtn = document.getElementById('retry-btn');

startBtn.addEventListener('click', () => { 
    playSound(clickSound);
    currentLevel = 1; 
    availableImages = [...allImages]; 
    startRound(); 
});
retryBtn.addEventListener('click', () => { 
    playSound(clickSound);
    currentLevel = 1; 
    availableImages = [...allImages]; 
    startRound(); 
});
nextLevelBtn.addEventListener('click', () => { 
    playSound(clickSound);
    currentLevel++; 
    startRound(); 
});

// ==========================================
// 🚀 ฟังก์ชันหลักของเกม
// ==========================================
function startRound() {
    if (timerInterval) clearInterval(timerInterval);
    
    timeLeft = Math.max(20, 60 - ((currentLevel - 1) * 5)); 
    matchedPairs = 0;
    isLocked = false;
    isTimerPaused = false; 
    flippedCards = [];

    progressBar.style.width = '0%';
    progressText.innerText = '0%';

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    levelDisplay.innerText = `ด่านที่: ${currentLevel}/${finalLevel} 🌟`;
    
    startTimer();
    loadCards();
}

function loadCards() {
    matchingBoard.innerHTML = '';

    if (availableImages.length < totalPairs) {
        availableImages = [...allImages];
    }

    availableImages.sort(() => 0.5 - Math.random());
    let selectedImages = availableImages.splice(0, totalPairs);
    let gameCards = [...selectedImages, ...selectedImages].sort(() => 0.5 - Math.random());

    gameCards.forEach(imgUrl => {
        let card = document.createElement('div');
        card.classList.add('card');
        card.dataset.image = imgUrl;

        // 💡 card-back อ้างอิงรูป logo จาก CSS
        card.innerHTML = `
            <div class="card-face card-back"></div>
            <div class="card-face card-front" style="background-image: url('${imgUrl}');"></div>
        `;

        card.addEventListener('click', () => flipCard(card));
        matchingBoard.appendChild(card);
    });
}

function flipCard(card) {
    if (isLocked) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    playSound(flipSound); // 🎵 เสียงพลิกการ์ด

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        checkForMatch();
    }
}

// 💥 แอนิเมชันภาพชนกันแล้วเข้าหลอด
function animateMatch(card1, card2) {
    isLocked = true; 
    isTimerPaused = true; // หยุดเวลาชั่วคราว
    
    const rect1 = card1.getBoundingClientRect();
    const rect2 = card2.getBoundingClientRect();
    const capsule = document.getElementById('progress-container');
    const capRect = capsule.getBoundingClientRect();

    function createClone(rect, imgUrl) {
        let clone = document.createElement('div');
        clone.style.position = 'fixed';
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        clone.style.backgroundImage = `url('${imgUrl}')`;
        clone.style.backgroundSize = 'cover';
        clone.style.backgroundPosition = 'center';
        clone.style.borderRadius = '10px';
        clone.style.border = '2px solid #FFA6C9';
        clone.style.zIndex = '9999';
        clone.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; 
        clone.style.pointerEvents = 'none';
        document.body.appendChild(clone);
        return clone;
    }

    const clone1 = createClone(rect1, card1.dataset.image);
    const clone2 = createClone(rect2, card2.dataset.image);

    card1.style.visibility = 'hidden';
    card2.style.visibility = 'hidden';

    const midX = (rect1.left + rect2.left) / 2;
    const midY = (rect1.top + rect2.top) / 2;

    setTimeout(() => {
        clone1.style.transform = `translate(${midX - rect1.left}px, ${midY - rect1.top}px) scale(1.1) rotate(10deg)`;
        clone2.style.transform = `translate(${midX - rect2.left}px, ${midY - rect2.top}px) scale(1.1) rotate(-10deg)`;

        playSound(matchSound); // 🎵 เสียงจับคู่ถูก

        setTimeout(() => {
            clone2.remove();
            clone1.style.transition = 'transform 0.5s ease-in-out, opacity 0.4s ease-in-out';
            
            const targetX = capRect.left + (capRect.width / 2) - (rect1.width / 2);
            const targetY = capRect.top + (capRect.height / 2) - (rect1.height / 2);

            clone1.style.transform = `translate(${targetX - rect1.left}px, ${targetY - rect1.top}px) scale(0.1)`;
            clone1.style.opacity = '0';

            setTimeout(() => {
                clone1.remove();

                matchedPairs++;
                let percent = Math.round((matchedPairs / totalPairs) * 100);
                progressBar.style.width = `${percent}%`;
                progressText.innerText = `${percent}%`;

                capsule.classList.remove('capsule-bump');
                void capsule.offsetWidth; 
                capsule.classList.add('capsule-bump');

                card1.classList.add('matched');
                card2.classList.add('matched');

                isLocked = false;
                flippedCards = [];
                isTimerPaused = false; // กลับมาเดินเวลาต่อ

                if (matchedPairs === totalPairs) {
                    if (currentLevel >= finalLevel) {
                        setTimeout(winGameComplete, 400); 
                    } else {
                        setTimeout(winLevel, 400); 
                    }
                }
            }, 500); 
        }, 300); 
    }, 50);
}

function checkForMatch() {
    let [card1, card2] = flippedCards;
    let isMatch = card1.dataset.image === card2.dataset.image;

    if (isMatch) {
        animateMatch(card1, card2);
    } else {
        isLocked = true;
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            isLocked = false;
        }, 800);
    }
}

function startTimer() {
    timeDisplay.classList.remove('time-alert');
    timeDisplay.innerText = `⏱ ${timeLeft}s`;

    timerInterval = setInterval(() => {
        if (isTimerPaused) return; // ข้ามการหักเวลาถ้าแอนิเมชันกำลังเล่นอยู่

        timeLeft--;
        timeDisplay.innerText = `⏱ ${timeLeft}s`;

        if (timeLeft <= 10 && timeLeft > 0) {
            timeDisplay.classList.add('time-alert');
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            loseGame();
        }
    }, 1000);
}

function winLevel() {
    if (timerInterval) clearInterval(timerInterval);
    playSound(winSound); // 🎵 เสียงชนะผ่านด่าน

    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    document.getElementById('result-title').innerText = "🎉 ผ่านด่าน! 🏆";
    document.getElementById('result-title').style.color = "#2ecc71";
    document.getElementById('result-title').style.textShadow = "none";
    document.getElementById('result-desc').innerHTML = `เก่งมาก! ลุยต่อด่าน ${currentLevel + 1} เลยไหม? 💖`;
    
    nextLevelBtn.style.display = "block";
    retryBtn.style.display = "none";
}

function winGameComplete() {
    if (timerInterval) clearInterval(timerInterval);
    playSound(winSound); // 🎵 เสียงชนะเคลียร์เกม

    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    document.getElementById('result-title').innerText = "👑 เคลียร์เกมสำเร็จ! 👑";
    document.getElementById('result-title').style.color = "#FFD700"; 
    document.getElementById('result-title').style.textShadow = "0 0 10px #FFD700, 0 0 20px #FF8C00";
    
    document.getElementById('result-desc').innerHTML = `สุดยอดมาก! คุณเคลียร์ทั้ง ${finalLevel} ด่านได้สำเร็จ!<br>ยกนิ้วให้เลยคนเก่ง 💖✨`;
    
    nextLevelBtn.style.display = "none"; 
    
    retryBtn.innerText = "เล่นใหม่อีกครั้ง 🔁"; 
    retryBtn.style.display = "block";
}

function loseGame() {
    if (timerInterval) clearInterval(timerInterval);
    playSound(loseSound); // 🎵 เสียงแพ้หมดเวลา

    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    document.getElementById('result-title').innerText = "หมดเวลา! ⏰";
    document.getElementById('result-title').style.color = "#ff6b81";
    document.getElementById('result-title').style.textShadow = "none";

    document.getElementById('result-desc').innerHTML = `คุณมาไกลถึงด่านที่ ${currentLevel}<br>ลองใหม่อีกรอบนะ! ✌️`;
    
    nextLevelBtn.style.display = "none";
    retryBtn.innerText = "เล่นใหม่ 🔁";
    retryBtn.style.display = "block";
}