// ==========================================
// 🎵 ระบบเสียง (Audio)
// ==========================================
const bgm = new Audio('bgm.mp3');
bgm.loop = true; 
bgm.volume = 0.25; 

const clickSound = new Audio('click.mp3'); 
const flipSound = new Audio('flip.mp3'); 
const matchSound = new Audio('match.mp3'); 
const winSound = new Audio('win.mp3'); 
const loseSound = new Audio('lose.mp3'); 

function playSound(audioObj) {
    if (!audioObj) return;
    try {
        let soundClone = audioObj.cloneNode();
        soundClone.volume = audioObj.volume; 
        soundClone.play().catch(e => console.log("รอการคลิกหน้าจอ"));
    } catch (error) {
        console.log("Audio play error:", error);
    }
}

// ==========================================
// 🚪 ระบบหน้าด่านคำถาม (Gate Screen)
// ==========================================
const gateScreen = document.getElementById('gate-screen');
const btnNongSo = document.getElementById('btn-nong-so');
const pTeeWrapper = document.getElementById('p-tee-wrapper');
const btnPTee = document.getElementById('btn-p-tee');
let pTeeScale = 1; 

btnNongSo.addEventListener('click', () => {
    playSound(clickSound); 
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
    playSound(clickSound); 
    bgm.play().catch(e => console.log("รอการเล่นเสียง")); 
    gateScreen.style.opacity = '0'; 
    setTimeout(() => { gateScreen.style.display = 'none'; }, 500);
});

// ==========================================
// 💡 สร้างรายชื่อรูปภาพ 1-91 อัตโนมัติ
// ==========================================
const allImages = [];
for (let i = 1; i <= 91; i++) {
    allImages.push(`picture/${i}.jpg`);
}

function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function buildBackgroundCollage() {
    const collage = document.getElementById('bg-collage');
    if (!collage) return;
    
    collage.innerHTML = '';
    
    let duplicatedImages = [];
    while(duplicatedImages.length < 360) {
        let shuffled = shuffleArray([...allImages]);
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
let isGameCleared = false; 

// 💡 สร้างสูตร (Pattern) ของแต่ละด่าน
const levelConfigs = [
    { pairs: 6, cols: 3 },  // ด่าน 1: 12 ใบ (3x4)
    { pairs: 6, cols: 4 },  // ด่าน 2: 12 ใบ (4x3 แนวนอน)
    { pairs: 8, cols: 4 },  // ด่าน 3: 16 ใบ (4x4 จัตุรัส)
    { pairs: 8, cols: 4 },  // ด่าน 4: 16 ใบ (4x4 เวลาน้อยลง)
    { pairs: 10, cols: 4 }, // ด่าน 5: 20 ใบ (4x5)
    { pairs: 10, cols: 5 }, // ด่าน 6: 20 ใบ (5x4)
    { pairs: 12, cols: 4 }, // ด่าน 7: 24 ใบ (4x6 ตารางใหญ่)
    { pairs: 12, cols: 4 }  // ด่าน 8: 24 ใบ (บอสไฟต์!)
];

let totalPairs = levelConfigs[0].pairs; 
const finalLevel = levelConfigs.length;

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
const shareXBtn = document.getElementById('share-x-btn');

startBtn.addEventListener('click', () => { 
    playSound(clickSound);
    currentLevel = 1; 
    isGameCleared = false;
    availableImages = shuffleArray([...allImages]); 
    startRound(); 
});
retryBtn.addEventListener('click', () => { 
    playSound(clickSound);
    currentLevel = 1; 
    isGameCleared = false;
    availableImages = shuffleArray([...allImages]); 
    startRound(); 
});
nextLevelBtn.addEventListener('click', () => { 
    playSound(clickSound);
    currentLevel++; 
    startRound(); 
});

// 💡 ระบบกดแชร์ลง X (Twitter)
shareXBtn.addEventListener('click', () => {
    playSound(clickSound);
    let shareText = "";
    let gameUrl = window.location.href; 

    if (isGameCleared) {
        shareText = `ฉันเล่นเกมจับคู่พี่ธีร์น้องโซ่เคลียร์ครบ ${finalLevel} ด่านรวด! ตาแตกมาก ใครแน่จริงมาลองแข่งกัน 💖✨`;
    } else if (nextLevelBtn.style.display !== "none") {
        shareText = `เย้! เพิ่งผ่านด่านที่ ${currentLevel} ของเกมจับคู่พี่ธีร์น้องโซ่มาแล้ว เก่งป่ะล่ะ 💅✨ มาลองเล่นกัน:`;
    } else {
        shareText = `ฉันเล่นเกมจับคู่พี่ธีร์น้องโซ่มาถึงด่าน ${currentLevel} แล้วเวลาหมดก่อน! 😭 มาช่วยกันเล่นแก้แค้นหน่อยยย`;
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(gameUrl)}`;
    window.open(twitterUrl, '_blank');
});

// ==========================================
// 📸 ฟังก์ชันแปลงการ์ดผลลัพธ์ให้เด้งมาเป็นภาพ (Image Card)
// ==========================================
function generateResultImage() {
    const cardElement = document.getElementById('share-card-container');
    const outputArea = document.getElementById('image-output-area');
    
    outputArea.innerHTML = '<p style="font-size:0.85rem; color:#ffa6c9;">📸 กำลังสร้างการ์ดรูปภาพ...</p>';

    html2canvas(cardElement, {
        scale: 2, 
        useCORS: true,
        backgroundColor: null
    }).then(canvas => {
        const imageURL = canvas.toDataURL('image/png');
        outputArea.innerHTML = `<img id="generated-image-preview" src="${imageURL}" alt="Game Result Card">`;
    });
}

// ==========================================
// 🚀 ฟังก์ชันเริ่มเกม (พร้อมระบบจำภาพ 1 วิ และ Pattern)
// ==========================================
function startRound() {
    if (timerInterval) clearInterval(timerInterval);
    
    // ดึงค่า Config ด่าน
    const config = levelConfigs[currentLevel - 1];
    totalPairs = config.pairs; 
    
    // จัดรูปแบบตาราง
    matchingBoard.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;

    // คำนวณเวลา
    timeLeft = Math.max(20, 60 - ((currentLevel - 1) * 5)); 
    if (currentLevel >= 3) timeLeft += 10; 
    if (currentLevel >= 5) timeLeft += 10; 
    
    matchedPairs = 0;
    isLocked = true; 
    isTimerPaused = false; 
    flippedCards = [];

    progressBar.style.width = '0%';
    progressText.innerText = '0%';

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    levelDisplay.innerText = `ด่านที่: ${currentLevel}/${finalLevel} 🌟`;
    
    loadCards(); 

    // 💡 ระบบ Peek 1 วินาที (ปรับตามคำขอ โหดสุดๆ!)
    let peekTime = 1;
    timeDisplay.classList.remove('time-alert');
    timeDisplay.innerText = `👀 จำภาพ! ${peekTime}s`;
    
    let peekInterval = setInterval(() => {
        peekTime--;
        if (peekTime > 0) {
            timeDisplay.innerText = `👀 จำภาพ! ${peekTime}s`;
        } else {
            clearInterval(peekInterval);
            
            document.querySelectorAll('.card').forEach(card => {
                card.classList.remove('flipped');
            });
            playSound(flipSound); 
            
            isLocked = false; 
            startTimer(); 
        }
    }, 1000);
}

function loadCards() {
    matchingBoard.innerHTML = '';

    if (availableImages.length < totalPairs) {
        availableImages = shuffleArray([...allImages]); 
    }

    let selectedImages = availableImages.splice(0, totalPairs);
    let gameCards = shuffleArray([...selectedImages, ...selectedImages]);

    gameCards.forEach(imgUrl => {
        let card = document.createElement('div');
        card.classList.add('card');
        
        card.classList.add('flipped');
        card.dataset.image = imgUrl;

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

    playSound(flipSound); 

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        checkForMatch();
    }
}

function animateMatch(card1, card2) {
    isLocked = true; 
    isTimerPaused = true; 
    
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

        playSound(matchSound); 

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
                isTimerPaused = false; 

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
        if (isTimerPaused) return; 

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
    playSound(winSound); 

    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    document.getElementById('result-title').innerText = "🎉 ผ่านด่าน! 🏆";
    document.getElementById('result-title').style.color = "#2ecc71";
    document.getElementById('result-title').style.textShadow = "none";
    document.getElementById('result-desc').innerHTML = `เก่งมาก! ลุยต่อด่าน ${currentLevel + 1} เลยไหม? 💖`;
    
    nextLevelBtn.style.display = "block";
    retryBtn.style.display = "none";
    shareXBtn.style.display = "block"; 
    generateResultImage();
}

function winGameComplete() {
    if (timerInterval) clearInterval(timerInterval);
    playSound(winSound); 
    isGameCleared = true; 

    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    document.getElementById('result-title').innerText = "👑 เคลียร์เกมสำเร็จ! 👑";
    document.getElementById('result-title').style.color = "#FFD700"; 
    document.getElementById('result-title').style.textShadow = "0 0 10px #FFD700, 0 0 20px #FF8C00";
    
    document.getElementById('result-desc').innerHTML = `สุดยอดมาก! คุณเคลียร์ทั้ง ${finalLevel} ด่านได้สำเร็จ!<br>ยกนิ้วให้เลยคนเก่ง 💖✨`;
    
    nextLevelBtn.style.display = "none"; 
    retryBtn.innerText = "เล่นใหม่อีกครั้ง 🔁"; 
    retryBtn.style.display = "block";
    shareXBtn.style.display = "block"; 
    generateResultImage();
}

function loseGame() {
    if (timerInterval) clearInterval(timerInterval);
    playSound(loseSound); 

    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    document.getElementById('result-title').innerText = "หมดเวลา! ⏰";
    document.getElementById('result-title').style.color = "#ff6b81";
    document.getElementById('result-title').style.textShadow = "none";

    document.getElementById('result-desc').innerHTML = `คุณมาไกลถึงด่านที่ ${currentLevel}<br>ลองใหม่อีกรอบนะ! ✌️`;
    
    nextLevelBtn.style.display = "none";
    retryBtn.innerText = "เล่นใหม่ 🔁";
    retryBtn.style.display = "block";
    shareXBtn.style.display = "block"; 
    generateResultImage();
}