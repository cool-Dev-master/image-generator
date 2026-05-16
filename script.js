// DOM Elements
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const cursor = document.getElementById('brush-cursor');

// State
let imageLoaded = false;
let isDrawingCard = false;
let isDragging = false;
let brushSize = 40;

// Offscreen canvases for processing
const imgCanvas = document.createElement('canvas');
const imgCtx = imgCanvas.getContext('2d', { willReadFrequently: true });
const originalImgCanvas = document.createElement('canvas');
const originalImgCtx = originalImgCanvas.getContext('2d');
const noiseCanvas = document.createElement('canvas');
let noiseGenerated = false;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // 1. Loading Screen Animation
    const tips = [
        "Tip: Don't forget to pack heat.",
        "Tip: Cops in Los Santos don't play around.",
        "Tip: Steal a fast car, ask questions later.",
        "Tip: Invest in Ammu-Nation stock.",
        "Tip: Respect the hustle."
    ];
    document.getElementById('loading-tip').innerText = tips[Math.floor(Math.random() * tips.length)];

    gsap.to('.progress-fill', {
        width: '100%',
        duration: 2.5,
        ease: 'power1.inOut',
        onComplete: () => {
            gsap.to('#loading-screen', {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    document.getElementById('loading-screen').style.display = 'none';
                    document.querySelector('.app-container').style.display = 'flex';
                    
                    // Intro Animations
                    gsap.from('.app-header', { y: -50, opacity: 0, duration: 0.8, ease: 'back.out(1.7)' });
                    gsap.from('.canvas-container', { scale: 0.9, opacity: 0, duration: 0.8, delay: 0.2 });
                    gsap.from('.controls-section', { x: 50, opacity: 0, duration: 0.8, delay: 0.4 });
                }
            });
        }
    });

    // 2. Setup Event Listeners
    document.querySelectorAll('#char-name, #wanted-level, #char-weapon, #char-cash').forEach(el => {
        el.addEventListener('input', requestDraw);
    });

    document.getElementById('image-upload').addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
            // Reset value so the same file can be selected again
            e.target.value = '';
        }
    });

    document.getElementById('brush-size').addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value);
    });

    document.getElementById('btn-reset-mask').addEventListener('click', () => {
        if (!imageLoaded) return;
        imgCtx.clearRect(0, 0, imgCanvas.width, imgCanvas.height);
        imgCtx.drawImage(originalImgCanvas, 0, 0);
        requestDraw();
    });

    document.getElementById('btn-download').addEventListener('click', downloadCard);

    // 3. Setup Eraser Tool Events
    setupEraserTool();

    // 4. Initial Render
    requestDraw();
});

// Canvas Drawing Cycle
function requestDraw() {
    if (!isDrawingCard) {
        isDrawingCard = true;
        requestAnimationFrame(() => {
            drawCard();
            isDrawingCard = false;
        });
    }
}

function drawCard() {
    const w = canvas.width;
    const h = canvas.height;

    // Clear main canvas
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Cinematic Background
    drawBackground(ctx, w, h);

    // 2. Draw Character
    if (imageLoaded) {
        ctx.save();
        // Apply Comic/Cel-shaded filters
        ctx.filter = 'contrast(125%) saturate(135%) brightness(95%) drop-shadow(10px 10px 0px rgba(0,0,0,0.85))';
        ctx.drawImage(imgCanvas, 0, 0);
        ctx.restore();
    } else {
        drawPlaceholderCharacter(ctx, w, h);
    }

    // 3. Draw Grain / Halftone Overlay
    drawOverlay(ctx, w, h);

    // 4. Draw Typography & UI Elements
    drawUI(ctx, w, h);
}

// Visual Generators
function drawBackground(ctx, w, h) {
    // Vibrant Sunset Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a0b2e'); // Deep night purple
    grad.addColorStop(0.35, '#78244c'); // Magenta
    grad.addColorStop(0.65, '#d14b43'); // Red-Orange
    grad.addColorStop(0.85, '#e87b2b'); // Sunset Orange
    grad.addColorStop(1, '#f2ca5c'); // Gold
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Glowing Sun
    ctx.save();
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.65, 200, 0, Math.PI * 2);
    ctx.fillStyle = '#ffef96';
    ctx.shadowColor = '#ffb347';
    ctx.shadowBlur = 120;
    ctx.fill();
    ctx.restore();

    // Distant City Skyline
    ctx.fillStyle = '#140c1c';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h - 250);
    
    // Generate pseudo-random buildings based on fixed seed so it doesn't flicker
    let curX = 0;
    let seed = 42;
    function random() {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }
    
    while(curX < w) {
        let bW = 40 + random() * 100;
        let bH = 150 + random() * 400;
        ctx.lineTo(curX, h - bH);
        ctx.lineTo(curX + bW, h - bH);
        curX += bW;
    }
    ctx.lineTo(curX, h);
    ctx.fill();
    
    // Silhouetted Palm Trees
    drawPalmTree(ctx, 120, h, 0.9);
    drawPalmTree(ctx, 300, h, 0.6);
    drawPalmTree(ctx, w - 180, h, 1.3);
}

function drawPalmTree(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#0a0510';
    
    // Trunk
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.quadraticCurveTo(20, -150, 10, -350);
    ctx.lineTo(-5, -350);
    ctx.quadraticCurveTo(5, -150, -30, 0);
    ctx.fill();

    // Leaves
    ctx.translate(5, -350);
    for(let i=0; i<7; i++) {
        ctx.rotate(Math.PI * 2 / 7);
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.quadraticCurveTo(60, -60, 120, -20);
        ctx.quadraticCurveTo(60, 15, 0, 0);
        ctx.fill();
        
        // Leaf fronds
        for(let j=0; j<6; j++) {
            ctx.beginPath();
            ctx.moveTo(15 + j*15, -10 + j*2);
            ctx.lineTo(30 + j*15, 25 + j*6);
            ctx.lineTo(20 + j*15, 0);
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawPlaceholderCharacter(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 20;
    
    // Head
    ctx.beginPath();
    ctx.arc(w/2, h - 550, 160, 0, Math.PI*2);
    ctx.fill();
    
    // Body
    ctx.beginPath();
    ctx.moveTo(w/2 - 280, h);
    ctx.quadraticCurveTo(w/2 - 220, h - 350, w/2, h - 400);
    ctx.quadraticCurveTo(w/2 + 220, h - 350, w/2 + 280, h);
    ctx.fill();
    ctx.restore();
}

function drawOverlay(ctx, w, h) {
    if (!noiseGenerated) {
        noiseCanvas.width = w;
        noiseCanvas.height = h;
        const nCtx = noiseCanvas.getContext('2d');
        
        // Static Grain
        nCtx.fillStyle = 'rgba(255,255,255,0.04)';
        for(let i=0; i<w; i+=3) {
            for(let j=0; j<h; j+=3) {
                if(Math.random() > 0.5) nCtx.fillRect(i, j, 2, 2);
            }
        }
        // Scanlines
        nCtx.fillStyle = 'rgba(0,0,0,0.15)';
        for(let j=0; j<h; j+=6) {
            nCtx.fillRect(0, j, w, 2);
        }
        noiseGenerated = true;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(noiseCanvas, 0, 0);
    ctx.restore();
}

function drawUI(ctx, w, h) {
    const name = document.getElementById('char-name').value.toUpperCase() || 'UNKNOWN';
    const wanted = parseInt(document.getElementById('wanted-level').value);
    const weapon = document.getElementById('char-weapon').value.toUpperCase();
    const cash = document.getElementById('char-cash').value || '$0';

    // Wanted Stars (Top Right)
    ctx.font = '70px Arial';
    let startX = w - 420;
    let startY = 100;
    for(let i=0; i<5; i++) {
        ctx.fillStyle = i < wanted ? '#ffffff' : 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.strokeText('★', startX + i*75, startY);
        ctx.fillText('★', startX + i*75, startY);
    }

    // Bottom Stats Banner
    ctx.save();
    
    // Black background panel
    ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, h - 280);
    ctx.lineTo(w * 0.65, h - 280);
    ctx.lineTo(w * 0.6, h - 200);
    ctx.lineTo(0, h - 200);
    ctx.fill();

    // Orange accent panel
    ctx.beginPath();
    ctx.moveTo(w, h - 160);
    ctx.lineTo(w * 0.35, h - 160);
    ctx.lineTo(w * 0.4, h - 80);
    ctx.lineTo(w, h - 80);
    ctx.fillStyle = 'rgba(255, 170, 0, 0.9)'; 
    ctx.fill();

    // Typography Setup
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    // Character Name
    ctx.font = '90px "Bebas Neue"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(name, 50, h - 210);

    // Cash & Weapon
    ctx.font = '60px "Bebas Neue"';
    ctx.fillStyle = '#0a0c10';
    ctx.textAlign = 'right';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(`${cash}   //   ${weapon}`, w - 50, h - 105);

    ctx.restore();
}

// Image Handling & Remove.bg API
function showLoader(msg) {
    const loader = document.getElementById('processing-loader');
    loader.querySelector('span').innerText = msg;
    loader.style.display = 'flex';
}

function hideLoader() {
    document.getElementById('processing-loader').style.display = 'none';
}

async function handleUpload(file) {
    const useAutoRemove = document.getElementById('auto-bg-remove').checked;

    try {
        let imageUrl;
        if (useAutoRemove) {
            showLoader("Loading AI Model & Removing Background...");
            // Dynamically import imgly from CDN as ESM module using esm.sh (fixes lodash dependency issues)
            const imglyModule = await import('https://esm.sh/@imgly/background-removal@1.4.3');
            const imglyRemoveBackground = imglyModule.default;
            
            // Configure public path to fetch the AI model files (WASM/ONNX) from unpkg
            const config = {
                publicPath: "https://unpkg.com/@imgly/background-removal@1.4.3/bin/"
            };
            
            const blob = await imglyRemoveBackground(file, config);
            imageUrl = URL.createObjectURL(blob);
        } else {
            showLoader("Processing Image...");
            imageUrl = URL.createObjectURL(file);
        }

        const img = new Image();
        img.onload = () => {
            initImageCanvas(img);
            imageLoaded = true;
            document.getElementById('masking-controls').style.display = 'block';
            document.getElementById('canvas-overlay').style.display = 'none';
            document.getElementById('btn-download').disabled = false;
            
            // Auto scroll to canvas on mobile
            if(window.innerWidth <= 900) {
                document.querySelector('.preview-section').scrollIntoView({behavior: 'smooth'});
            }
            
            hideLoader();
            requestDraw();
        };
        img.src = imageUrl;
    } catch(e) {
        alert("Error: " + e.message);
        hideLoader();
    }
}

function initImageCanvas(img) {
    imgCanvas.width = canvas.width;
    imgCanvas.height = canvas.height;
    
    // Cover/Contain scale calculation
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (canvas.width - w) / 2;
    const y = canvas.height - h; // Align to bottom
    
    imgCtx.clearRect(0, 0, imgCanvas.width, imgCanvas.height);
    imgCtx.drawImage(img, x, y, w, h);
    
    // Backup for reset
    originalImgCanvas.width = canvas.width;
    originalImgCanvas.height = canvas.height;
    originalImgCtx.clearRect(0, 0, canvas.width, canvas.height);
    originalImgCtx.drawImage(imgCanvas, 0, 0);
}

// Eraser Tool Logic
function setupEraserTool() {
    canvas.addEventListener('mousedown', startErase);
    canvas.addEventListener('mousemove', erase);
    canvas.addEventListener('mouseup', stopErase);
    canvas.addEventListener('mouseout', stopErase);

    // Touch support
    canvas.addEventListener('touchstart', (e) => { 
        if(imageLoaded) e.preventDefault(); // Prevent scrolling only if masking
        startErase(e.touches[0]); 
    }, {passive: false});
    canvas.addEventListener('touchmove', (e) => { 
        if(imageLoaded) e.preventDefault(); 
        erase(e.touches[0]); 
    }, {passive: false});
    canvas.addEventListener('touchend', stopErase);

    // Custom Cursor tracking
    canvas.addEventListener('mousemove', updateCursorPos);
    canvas.addEventListener('touchmove', updateCursorPos);
    canvas.addEventListener('mouseout', () => cursor.style.display = 'none');
    canvas.addEventListener('touchend', () => cursor.style.display = 'none');
}

function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function updateCursorPos(e) {
    if (!imageLoaded || document.getElementById('masking-controls').style.display === 'none') {
        cursor.style.display = 'none';
        return;
    }
    
    // For touch events, we use the first touch point, for mouse we use e
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if(!clientX || !clientY) return;

    cursor.style.display = 'block';
    cursor.style.left = clientX + 'px';
    cursor.style.top = clientY + 'px';
    
    // Size relative to screen
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const screenBrushSize = brushSize * scaleX * 2; 
    
    cursor.style.width = screenBrushSize + 'px';
    cursor.style.height = screenBrushSize + 'px';
}

function startErase(e) {
    if(!imageLoaded) return;
    isDragging = true;
    erase(e);
}

function erase(e) {
    if (!isDragging || !imageLoaded) return;
    const pos = getPointerPos(e);
    
    // Erase on the offscreen image canvas
    imgCtx.globalCompositeOperation = 'destination-out';
    imgCtx.beginPath();
    imgCtx.arc(pos.x, pos.y, brushSize, 0, Math.PI * 2);
    imgCtx.fill();
    
    requestDraw();
}

function stopErase() {
    isDragging = false;
}

// Download functionality
function downloadCard() {
    // Generate a temporary link to download the canvas content
    const link = document.createElement('a');
    link.download = `GTA_CARD_${document.getElementById('char-name').value.trim() || 'PLAYER'}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
}
