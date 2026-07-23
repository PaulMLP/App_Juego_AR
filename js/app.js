// ============================================================
// LÓGICA DE COMBINACIÓN DE FICHAS AR
// El resultado flota en el punto medio entre las 2 fichas,
// con rotación lenta + flotación idle, y reproduce animaciones
// embebidas en el .glb si el modelo las trae.
// ============================================================

let combosData = null;
let currentCombo = null;          // combinación actualmente mostrada (o null)
const visibleTargets = new Set(); // índices de fichas actualmente visibles en cámara

const sceneEl = document.querySelector('a-scene');
const stageEl = document.getElementById('result-stage');
stageEl.object3D.rotation.x = Math.PI / 3;

stageEl.addEventListener('model-loaded', (e) => {
  console.log('✅ Modelo 3D cargado correctamente:', e.detail);
});

stageEl.addEventListener('model-error', (e) => {
  console.error('❌ ERROR cargando modelo 3D:', e.detail);
});

// Carga la tabla de combinaciones al iniciar
fetch('./combinations.json')
  .then((res) => res.json())
  .then((data) => {
    combosData = data;
    console.log('Combinaciones cargadas:', combosData);
  })
  .catch((err) => console.error('Error cargando combinations.json:', err));

// Oculta la pantalla de carga cuando MindAR está listo
sceneEl.addEventListener('renderstart', () => {
  document.getElementById('loading').style.display = 'none';
});

// Engancha los eventos targetFound / targetLost a cada ficha (0 a 3)
for (let i = 0; i <= 3; i++) {
  const targetEl = document.getElementById(`target-${i}`);
  if (!targetEl) continue;

  targetEl.addEventListener('targetFound', () => {
    visibleTargets.add(i);
    console.log(`✅ Ficha detectada: índice ${i}`);
    checkCombination();
  });

  targetEl.addEventListener('targetLost', () => {
    visibleTargets.delete(i);
    console.log(`❌ Ficha perdida: índice ${i}`);
    checkCombination();
  });
}

function checkCombination() {
  if (!combosData) return;

  if (visibleTargets.size !== 2) {
    hideResult();
    return;
  }

  const visibleIds = [...visibleTargets].map((i) => combosData.cards[i]);

  const match = combosData.combinations.find((combo) => {
    const [a, b] = combo.pair;
    return (
      (visibleIds[0] === a && visibleIds[1] === b) ||
      (visibleIds[0] === b && visibleIds[1] === a)
    );
  });

  if (match) {
    showResult(match);
  } else {
    hideResult();
  }
}

function showResult(combo) {
  const isNew = !currentCombo || currentCombo.id !== combo.id;
  currentCombo = combo;

  if (isNew) {
    // Limpia animation-mixer previo (si el modelo anterior tenía animación embebida)
    stageEl.removeAttribute('animation-mixer');

    stageEl.setAttribute('gltf-model', combo.model);
    stageEl.setAttribute('visible', 'true');

    // Efecto de "crecer" al aparecer
    growStartTime = Date.now();

    // Si el .glb trae animación propia (ej. hojas moviéndose, erupción, etc.),
    // esto la reproduce automáticamente en loop. Si el modelo no tiene
    // animaciones embebidas, este atributo simplemente no hace nada.
    stageEl.setAttribute('animation-mixer', 'clip: *; loop: repeat;');

    showBanner(combo.name, combo.description);
    // Si esta página corre dentro del WebView de la app Flutter, le avisa
    // qué combinación se detectó para que registre puntos/historial.
    // Si se abre en un navegador normal, este bloque simplemente no hace nada.
    if (window.FichasArBridge) {
      window.FichasArBridge.postMessage(JSON.stringify({ comboId: combo.id }));
    }
  }
}

function hideResult() {
  if (currentCombo) {
    stageEl.setAttribute('visible', 'false');
    stageEl.removeAttribute('gltf-model');
    stageEl.removeAttribute('animation-mixer');
    currentCombo = null;
  }
  hideBanner();
}

function showBanner(name, description) {
  document.getElementById('result-name').textContent = name;
  document.getElementById('result-desc').textContent = description;
  document.getElementById('result-banner').style.display = 'block';
}

function hideBanner() {
  document.getElementById('result-banner').style.display = 'none';
}

// ============================================================
// Loop de posición: calcula el punto medio entre las 2 fichas
// visibles cada frame, posiciona ahí el "stage" flotante,
// y le suma una flotación suave tipo "respirar".
// ============================================================

const THREE = AFRAME.THREE;
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
let growStartTime = 0;

function updateStagePosition() {
  if (currentCombo && visibleTargets.size === 2) {
    const [i1, i2] = [...visibleTargets];
    const ANCHOR_CARD_NAME = 'tierra'; // ficha común a todas las combinaciones
    const anchorCardIndex = Number(
      Object.keys(combosData.cards).find((k) => combosData.cards[k] === ANCHOR_CARD_NAME)
    );

    let anchorIndex, otherIndex;
    if (i1 === anchorCardIndex || i2 === anchorCardIndex) {
      anchorIndex = anchorCardIndex;
      otherIndex = i1 === anchorCardIndex ? i2 : i1;
    } else {
      anchorIndex = Math.min(i1, i2);
      otherIndex = Math.max(i1, i2);
    }
    const anchorObj = document.getElementById(`target-${anchorIndex}`).object3D;
    const otherObj = document.getElementById(`target-${otherIndex}`).object3D;

    // Engancha el stage como hijo de la ficha "ancla" si no lo está ya
    if (stageEl.object3D.parent !== anchorObj) {
      anchorObj.add(stageEl.object3D);
    }

    // Punto medio en espacio de mundo entre las 2 fichas
    anchorObj.getWorldPosition(tmpA);
    otherObj.getWorldPosition(tmpB);
    const midWorld = tmpA.lerp(tmpB, 0.5);

    // Convertido a espacio LOCAL de la ficha ancla (así hereda su escala/rotación)
    const localPos = anchorObj.worldToLocal(midWorld);
    localPos.y += 0.15;
    localPos.y += Math.sin(Date.now() * 0.002) * 0.03;
    stageEl.object3D.position.copy(localPos);

    // Efecto de "crecer" al aparecer
    const elapsed = Date.now() - growStartTime;
    const growProgress = Math.min(elapsed / 400, 1);
    const SIZE_MULTIPLIER = 0.3;
    stageEl.object3D.scale.setScalar(growProgress * SIZE_MULTIPLIER);
    if (!currentCombo.animated) {
      stageEl.object3D.rotation.y += 0.005; // giro lento continuo, solo si no tiene animación propia
    }
  }
  requestAnimationFrame(updateStagePosition);
}
requestAnimationFrame(updateStagePosition);