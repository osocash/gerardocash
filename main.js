const TOTAL_FRAMES = 60;
const getFramePath = (index) => {
  const padded = String(index).padStart(4, '0');
  return `frames/${padded}.png`;
};

const canvas = document.getElementById('logo-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

const images = [];
let loadedCount = 0;
let lastRenderedFrame = -1;

// --- Configuración de Física y Suavizado ---
let targetProgress = 0; // Posición deseada impuesta por el usuario
let currentProgress = 0; // Posición suavizada calculada por LERP

// Sensibilidad: qué tan rápido avanza por pixel de scroll/touch
const SENSITIVITY_WHEEL = 0.0006;
const SENSITIVITY_TOUCH = 0.0018;

// Factor de amortiguación (0.05 = muy flotante/cinemático, 0.15 = más reactivo)
const EASING = 0.075;

// Interpolación Lineal
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

// Precarga de frames
function preloadFrames() {
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFramePath(i);

    img.onload = () => {
      loadedCount++;

      // En cuanto la primera imagen esté lista, ajustamos resolución y pintamos de inmediato
      if (i === 0 || loadedCount === 1) {
        if (!canvas.width || canvas.width === 300) {
          canvas.width = img.naturalWidth || 1080;
          canvas.height = img.naturalHeight || 1080;
        }
        drawFrame(0);
      }
    };

    images.push(img);
  }
}

function drawFrame(frameIndex) {
  const img = images[frameIndex];
  // Verificamos que la imagen exista y haya completado su carga
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
}

// Bucle continuo
function animate() {
  currentProgress = lerp(currentProgress, targetProgress, EASING);

  let rawFrame = Math.floor(currentProgress * TOTAL_FRAMES) % TOTAL_FRAMES;
  const frameIndex = (rawFrame + TOTAL_FRAMES) % TOTAL_FRAMES;

  // Renderiza si cambió de frame O si aún no se ha pintado el frame inicial
  if (frameIndex !== lastRenderedFrame || lastRenderedFrame === -1) {
    if (images[frameIndex] && images[frameIndex].complete) {
      drawFrame(frameIndex);
      lastRenderedFrame = frameIndex;
    }
  }

  requestAnimationFrame(animate);
}

// --- Captura de Interacciones ---

// 1. Mouse Wheel / Trackpad
window.addEventListener('wheel', (e) => {
  targetProgress += e.deltaY * SENSITIVITY_WHEEL;
}, { passive: true });

// 2. Touch (Mobile)
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  const currentY = e.touches[0].clientY;
  const deltaY = touchStartY - currentY; // Invertido: deslizar arriba avanza
  touchStartY = currentY;

  targetProgress += deltaY * SENSITIVITY_TOUCH;
}, { passive: true });

// --- Overlay "Próximamente" ---
const INTERVAL_TIME = 15 *1000; // 5 minutos
const DISPLAY_DURATION = 3000;       // Se queda visible 6 segundos

function showUpcomingOverlay() {
  overlay.classList.remove('hidden');

  setTimeout(() => {
    overlay.classList.add('hidden');
  }, DISPLAY_DURATION);
}

// Iniciar precarga y animación
preloadFrames();
requestAnimationFrame(animate);

// 1. Mostrar una primera vez a los 2 segundos de entrar (para verificar visualmente)
setTimeout(showUpcomingOverlay, 10000);

// 2. Repetir cíclicamente cada 5 minutos
setInterval(showUpcomingOverlay, INTERVAL_TIME);

// 3. Atajo manual para pruebas: pulsa Mayús + P para forzar la aparición
window.addEventListener('keydown', (e) => {
  if (e.shiftKey && e.key.toLowerCase() === 'p') {
    showUpcomingOverlay();
  }
});