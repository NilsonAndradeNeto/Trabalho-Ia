// Anima o passeio do cavalo sem alterar o App.tsx (DOM-driven)

type StepCell = { step: number; el: HTMLElement };

let isAnimating = false;
let cancelCurrent: (() => void) | null = null;

function ensureAnimateButton() {
  const controls = document.querySelector('.controls');
  if (!controls || document.getElementById('animateTourBtn')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'animateTourBtn';
  btn.textContent = 'Animação';
  btn.style.marginLeft = '8px';
  btn.addEventListener('click', () => startAnimation());

  controls.appendChild(btn);
}

function getStepsFromBoard(): StepCell[] {
  const board = document.querySelector('.board') as HTMLElement | null;
  if (!board) return [];
  const cells = Array.from(board.querySelectorAll('.cell')) as HTMLElement[];

  const steps: StepCell[] = [];
  for (const el of cells) {
    const t = (el.textContent || '').trim();
    if (!t) continue;
    const n = Number(t);
    if (!Number.isNaN(n) && n > 0) steps.push({ step: n, el });
  }
  steps.sort((a, b) => a.step - b.step);
  return steps;
}

function ensureMarker(board: HTMLElement): HTMLElement {
  let m = document.getElementById('knightMarker') as HTMLElement | null;
  if (!m) {
    m = document.createElement('div');
    m.id = 'knightMarker';
    m.className = 'knight-marker';
    m.textContent = '♞';
    board.appendChild(m);
  }
  return m;
}

function centerOf(el: HTMLElement, relativeTo: HTMLElement) {
  const a = el.getBoundingClientRect();
  const b = relativeTo.getBoundingClientRect();
  const x = a.left - b.left + a.width / 2 + relativeTo.scrollLeft;
  const y = a.top - b.top + a.height / 2 + relativeTo.scrollTop;
  return { x, y };
}

async function animateAlong(
  marker: HTMLElement,
  container: HTMLElement,
  steps: StepCell[],
  msPerStep = 350
) {
  // Cancela animação anterior, se houver
  if (cancelCurrent) cancelCurrent();
  let cancelled = false;
  cancelCurrent = () => (cancelled = true);

  isAnimating = true;

  // limpa marcas "visited"
  container.querySelectorAll('.cell.visited').forEach((c) => c.classList.remove('visited'));

  // posiciona no passo 1
  if (steps.length === 0) {
    isAnimating = false;
    return;
  }
  let pos = centerOf(steps[0].el, container);
  marker.style.left = `${pos.x}px`;
  marker.style.top = `${pos.y}px`;
  steps[0].el.classList.add('visited');

  const stepsList = document.querySelector('.steps ol');

  for (let i = 1; i < steps.length; i++) {
    if (cancelled) break;

    const target = centerOf(steps[i].el, container);

    // Move em formato de L (duas pernas ortogonais)
    await moveL(marker, pos, target, msPerStep, () => cancelled);
    if (cancelled) break;
    steps[i].el.classList.add('visited');
    pos = target;

    // scroll opcional da lista de passos
    const li = stepsList?.querySelector(`li:nth-child(${i + 1})`) as HTMLElement | null;
    if (li) li.scrollIntoView({ block: 'nearest' });
  }

  isAnimating = false;
}

function moveLinear(
  el: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  duration: number,
  isCancelled: () => boolean
) {
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const step = (t: number) => {
      if (isCancelled()) return resolve();
      const p = Math.min(1, (t - start) / duration);
      const x = from.x + (to.x - from.x) * p;
      const y = from.y + (to.y - from.y) * p;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

// Move em "L": primeiro no eixo de maior distância, depois no outro eixo
function moveL(
  el: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  totalDuration: number,
  isCancelled: () => boolean
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  // Define ponto intermediário para compor o "L"
  // Escolhe mover primeiro no eixo com maior distância
  let mid: { x: number; y: number };
  if (adx >= ady) {
    mid = { x: to.x, y: from.y }; // horizontal primeiro
  } else {
    mid = { x: from.x, y: to.y }; // vertical primeiro
  }

  // Distribui duração proporcional às distâncias (ex.: 2/3 e 1/3)
  const sum = adx + ady || 1;
  const dur1 = Math.round((Math.max(adx, ady) / sum) * totalDuration);
  const dur2 = Math.max(0, totalDuration - dur1);

  return moveLinear(el, from, mid, dur1, isCancelled).then(() =>
    moveLinear(el, mid, to, dur2, isCancelled)
  );
}

export function startAnimation() {
  const board = document.querySelector('.board') as HTMLElement | null;
  if (!board) {
    alert('Monte o tabuleiro primeiro (Calcular).');
    return;
  }
  const steps = getStepsFromBoard();
  if (steps.length === 0) {
    alert('Nenhum passeio encontrado. Clique em "Calcular" antes de animar.');
    return;
  }
  const marker = ensureMarker(board);
  animateAlong(marker, board, steps).catch(() => (isAnimating = false));
}

export function cancelAnimation() {
  if (cancelCurrent) cancelCurrent();
  isAnimating = false;
}

export function resetAnimationArtifacts() {
  const board = document.querySelector('.board') as HTMLElement | null;
  if (!board) return;
  // Remove destaques de casas visitadas
  board.querySelectorAll('.cell.visited').forEach((c) => c.classList.remove('visited'));
  // Remove marcador do cavalo, se existir
  const m = document.getElementById('knightMarker');
  if (m && m.parentElement) m.parentElement.removeChild(m);
}

// Inicializa quando o app sobe ou sempre que o DOM mudar
function boot() {
  ensureAnimateButton();

  // Re-assegura o botão caso React re-renderize o formulário
  const obs = new MutationObserver(() => ensureAnimateButton());
  obs.observe(document.body, { childList: true, subtree: true });

  // Garante .board relativa para posicionamento do marcador
  const style = document.createElement('style');
  style.innerHTML = `
    .board { position: relative; }
  `;
  document.head.appendChild(style);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
