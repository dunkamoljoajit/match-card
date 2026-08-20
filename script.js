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
// 💡 สร้างรายชื่อรูปภาพ 1-90 อัตโนมัติ
// ==========================================
const allImages = [];
for (let i = 1; i <= 90; i++) {
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
let isGameCleared = false; // เอาไว้เช็คตอนแชร์ X ว่าชนะเกมหรือแพ้
const totalPairs = 6; 
const finalLevel = 8; 

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

// 💡 เพิ่มระบบกดแชร์ลง X (Twitter)
shareXBtn.addEventListener('click', () => {
    playSound(clickSound);
    let shareText = "";
    
    // ใช้ URL ปัจจุบันของเว็บเรา (ถ้าเอาขึ้น GitHub มันจะใช้ลิงก์นั้นอัตโนมัติเลยครับ)
    let gameUrl = window.location.href; 

    if (isGameCleared) {
        shareText = `ฉันเล่นเกมจับคู่พี่ธีร์น้องโซ่เคลียร์ครบ ${finalLevel} ด่านรวด! ตาแตกมาก ใครแน่จริงมาลองแข่งกัน 💖✨`;
    } else {
        shareText = `ฉันเล่นเกมจับคู่พี่ธีร์น้องโซ่ไปถึงด่าน ${currentLevel} แล้วเวลาหมดก่อน! มาช่วยกันเล่นหน่อยยย 😭💖`;
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(gameUrl)}`;
    window.open(twitterUrl, '_blank');
});

// ==========================================
// 🚀 ฟังก์ชันเริ่มเกม (พร้อมระบบจำภาพ 3 วิ)
// ==========================================
function startRound() {
    if (timerInterval) clearInterval(timerInterval);
    
    timeLeft = Math.max(20, 60 - ((currentLevel - 1) * 5)); 
    matchedPairs = 0;
    
    // 💡 ล็อกบอร์ดไว้ก่อนตอนจำภาพ
    isLocked = true; 
    isTimerPaused = false; 
    flippedCards = [];

    progressBar.style.width = '0%';
    progressText.innerText = '0%';

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    levelDisplay.innerText = `ด่านที่: ${currentLevel}/${finalLevel} 🌟`;
    
    loadCards(); // โหลดและหงายไพ่โชว์ทันที

    // 💡 ระบบ Peek 3 วินาที
    let peekTime = 3;
    timeDisplay.classList.remove('time-alert');
    timeDisplay.innerText = `👀 จำภาพ! ${peekTime}s`;
    
    let peekInterval = setInterval(() => {
        peekTime--;
        if (peekTime > 0) {
            timeDisplay.innerText = `👀 จำภาพ! ${peekTime}s`;
        } else {
            clearInterval(peekInterval);
            
            // หมดเวลาจำ คว่ำการ์ดทั้งหมด!
            document.querySelectorAll('.card').forEach(card => {
                card.classList.remove('flipped');
            });
            playSound(flipSound); // เสียงคว่ำการ์ดรวดเดียว
            
            isLocked = false; // ปลดล็อกให้ผู้เล่นกดได้
            startTimer(); // เริ่มนับเวลาเกมจริงๆ
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
        
        // 💡 ใส่คลาส flipped ตั้งแต่เกิดเลย เพื่อให้หงายหน้าโชว์ภาพ
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
    shareXBtn.style.display = "none"; // ซ่อนปุ่มแชร์ตอนแค่ผ่านด่าน
}

function winGameComplete() {
    if (timerInterval) clearInterval(timerInterval);
    playSound(winSound); 
    isGameCleared = true; // 💡 กำหนดว่าชนะรวดแล้วนะ

    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    document.getElementById('result-title').innerText = "👑 เคลียร์เกมสำเร็จ! 👑";
    document.getElementById('result-title').style.color = "#FFD700"; 
    document.getElementById('result-title').style.textShadow = "0 0 10px #FFD700, 0 0 20px #FF8C00";
    
    document.getElementById('result-desc').innerHTML = `สุดยอดมาก! คุณเคลียร์ทั้ง ${finalLevel} ด่านได้สำเร็จ!<br>ยกนิ้วให้เลยคนเก่ง 💖✨`;
    
    nextLevelBtn.style.display = "none"; 
    
    retryBtn.innerText = "เล่นใหม่อีกครั้ง 🔁"; 
    retryBtn.style.display = "block";
    shareXBtn.style.display = "block"; // 💡 โชว์ปุ่มแชร์รัวๆ
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
    shareXBtn.style.display = "block"; // 💡 โชว์ปุ่มแชร์ให้เพื่อนมาช่วยแก้แค้น
}
// ==========================================