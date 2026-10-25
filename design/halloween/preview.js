const byId = (id) => document.getElementById(id);
const normalize = (word) => word.toLowerCase().replaceAll('ñ', '~').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('~', 'ñ');
let candidates = [], selected, outer = [], found = [], input = '', unlocked = false;
const names = [ ['calabaza', 'Calabazas y escobas', 'EL OTOÑO MÁS CÁLIDO'], ['bruja', 'El rincón de la bruja', 'UN POCO DE MAGIA'], ['calavera', 'Entre las telarañas', 'EL MISTERIO DEL DESVÁN'], ['misterio', 'La hora del misterio', 'MÁS PALABRAS TEMÁTICAS'] ];
const svgNS = 'http://www.w3.org/2000/svg';
function node(name, attributes = {}) { const element = document.createElementNS(svgNS, name); for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value); return element; }
function polygon(n, radius) { return Array.from({ length: n }, (_, i) => { const angle = -Math.PI / 2 + i * Math.PI * 2 / n; return [150 + radius * Math.cos(angle), 140 + radius * Math.sin(angle)]; }); }
function points(list) { return list.map((p) => p.join(',')).join(' '); }
function cell(svg, letters, positions, central = false, extra = false) {
  const group = node('g', { class: `letter-cell${central ? ' central' : ''}${extra ? ' extra' : ''}`, tabindex: '0', role: 'button', 'aria-label': `Letra ${letters}${central ? ', central' : ''}` });
  group.append(node('polygon', { points: points(positions), fill: central ? 'url(#center-fill)' : extra ? '#706c4c' : 'url(#outer-fill)' }));
  const label = node('text', { x: positions.reduce((s, p) => s + p[0], 0) / positions.length, y: positions.reduce((s, p) => s + p[1], 0) / positions.length + 8, 'text-anchor': 'middle' });
  label.textContent = letters.toUpperCase(); group.append(label);
  const choose = () => { input += letters; renderInput(); };
  group.addEventListener('click', choose);
  group.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); } });
  svg.append(group);
}
function renderBoard() {
  const svg = node('svg', { viewBox: '0 0 300 275', role: 'group', 'aria-label': 'Pulsa las letras para formar una palabra' });
  const defs = node('defs');
  for (const [id, start, end] of [['center-fill', '#ffb56e', '#e07a43'], ['outer-fill', '#7b5c87', '#63466e']]) {
    const gradient = node('linearGradient', { id, x2: '.8', y2: '1' }); gradient.append(node('stop', { 'stop-color': start }), node('stop', { offset: '1', 'stop-color': end })); defs.append(gradient);
  }
  svg.append(defs);
  const n = outer.length, inner = polygon(n, 62), rim = polygon(n, 123);
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const shape = [inner[i], rim[i], rim[next], inner[next]];
    const cx = shape.reduce((s, p) => s + p[0], 0) / 4, cy = shape.reduce((s, p) => s + p[1], 0) / 4;
    const inset = shape.map(([x, y]) => [cx + (x - cx) * .9, cy + (y - cy) * .9]);
    cell(svg, outer[i], inset, false, unlocked && outer[i] === selected.extraLetter);
  }
  cell(svg, selected.center, polygon(n, 55), true);
  byId('board').replaceChildren(svg);
}
function renderInput() { const output = byId('word-input'); output.textContent = input ? input.toUpperCase() : 'Forma una palabra…'; output.classList.toggle('placeholder', !input); }
function chips(id, words) { const container = byId(id); container.replaceChildren(...words.map((word) => { const chip = document.createElement('span'); chip.textContent = word; return chip; })); }
function update() {
  const count = unlocked ? selected.expandedCount : selected.baseCount;
  byId('counter').textContent = `${found.length} / ${count}`;
  byId('progress-fill').style.width = `${found.length / count * 100}%`;
  chips('found-words', found);
  byId('reward-title').textContent = unlocked ? `La ${selected.extraLetter.toUpperCase()} ya tiene su magia` : 'Un regalo entre las sombras';
  byId('reward-description').textContent = unlocked ? 'El tablero abre nuevas posibilidades.' : 'Una nueva letra guarda más sorpresas.';
  byId('unlock').innerHTML = unlocked ? 'Cerrar ↙' : 'Ver ↗';
  document.querySelector('.reward').classList.toggle('unlocked', unlocked);
  renderInput(); renderBoard();
}
function select(candidate, index) {
  selected = candidate; outer = [...candidate.outer]; found = candidate.baseThematic.slice(0, 2); input = ''; unlocked = false;
  document.querySelectorAll('.candidate').forEach((button, i) => { button.classList.toggle('selected', i === index); button.setAttribute('aria-pressed', String(i === index)); });
  chips('base-themes', candidate.baseThematic); chips('extra-themes', candidate.unlockedThematic);
  byId('count-note').textContent = `${candidate.baseCount} soluciones iniciales → ${candidate.expandedCount} con ${candidate.extraLetter.toUpperCase()}. Todas contienen la central ${candidate.center.toUpperCase()}.`;
  byId('feedback').textContent = 'La letra central siempre está invitada.'; byId('feedback').className = 'feedback'; update();
}
byId('erase').onclick = () => { input = input.slice(0, -1); renderInput(); };
byId('shuffle').onclick = () => { outer = [...outer]; for (let i = outer.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [outer[i], outer[j]] = [outer[j], outer[i]]; } renderBoard(); };
byId('unlock').onclick = () => { unlocked = !unlocked; outer = unlocked ? [...selected.outer, selected.extraLetter] : [...selected.outer]; input = ''; found = found.filter((word) => unlocked || selected.baseThematic.includes(word)); update(); };
byId('submit').onclick = () => {
  const allowed = [...selected.baseThematic, ...(unlocked ? selected.unlockedThematic : [])];
  const match = allowed.find((word) => normalize(word) === input);
  const feedback = byId('feedback'); feedback.className = 'feedback';
  if (!input) { feedback.textContent = 'Pulsa las letras del tablero para empezar.'; return; }
  if (!input.includes(selected.center)) feedback.textContent = `Invita también a la ${selected.center.toUpperCase()}, la letra central.`;
  else if (!match) feedback.textContent = 'Esta demo solo comprueba las palabras temáticas de abajo.';
  else if (found.includes(match)) feedback.textContent = 'Esta palabra ya tiene su sitio en la biblioteca.';
  else { found.push(match); feedback.textContent = '¡Una palabra con un poco de magia!'; feedback.classList.add('success'); }
  input = ''; update();
};
byId('show-game').onclick = () => { byId('partida').scrollIntoView({ behavior: 'smooth', block: 'center' }); byId('board').querySelector('[tabindex]')?.focus({ preventScroll: true }); };
byId('back-invitation').onclick = () => document.querySelector('.invitation').scrollIntoView({ behavior: 'smooth', block: 'center' });
try {
  const response = await fetch('./letter-research.json');
  if (!response.ok) throw new Error('No se pudo cargar el estudio de letras.');
  const report = await response.json();
  candidates = names.map(([anchor, name, caption]) => ({ ...(anchor === 'misterio' ? report.top[0] : report.proposals.find((proposal) => proposal.anchor === anchor)?.candidate), name, caption }));
  for (const [index, candidate] of candidates.entries()) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'candidate';
    button.innerHTML = `<div class="candidate-top"><span>0${index + 1}</span><span>+ ${candidate.extraLetter.toUpperCase()}</span></div><h3>${candidate.name}</h3><div class="letters"><strong>${candidate.center.toUpperCase()}</strong>${candidate.outer.join(' ').toUpperCase()}</div><p>${candidate.baseCount} → ${candidate.expandedCount} soluciones</p>`;
    button.onclick = () => select(candidate, index); byId('candidates').append(button);
  }
  select(candidates[0], 0);
  window.halloweenPreview = { ready: true, candidates: candidates.length };
} catch (error) {
  byId('feedback').textContent = error.message;
  window.halloweenPreview = { ready: false, error: error.message };
}
