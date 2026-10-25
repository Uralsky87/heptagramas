const $ = (id) => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';
let data, found = [], input = '', outer = [], longMode = false;
function svgNode(name, attributes = {}) { const element = document.createElementNS(svgNS, name); for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value); return element; }
function ring(n, radius) { return Array.from({ length: n }, (_, i) => { const angle = -Math.PI / 2 + i * Math.PI * 2 / n; return [150 + radius * Math.cos(angle), 140 + radius * Math.sin(angle)]; }); }
function addCell(svg, letter, corners, central, interactive) {
  const group = svgNode('g', { class: `letter-cell${central ? ' central' : ''}` });
  const id = interactive ? 'main' : 'mini';
  group.append(svgNode('polygon', { points: corners.map((point) => point.join(',')).join(' '), fill: `url(#${id}-${central ? 'center' : 'outer'})` }));
  const text = svgNode('text', { x: corners.reduce((sum, p) => sum + p[0], 0) / corners.length, y: corners.reduce((sum, p) => sum + p[1], 0) / corners.length + 9, 'text-anchor': 'middle' });
  text.textContent = letter.toUpperCase(); group.append(text);
  if (interactive) {
    group.setAttribute('tabindex', '0'); group.setAttribute('role', 'button'); group.setAttribute('aria-label', `Letra ${letter}${central ? ', central' : ''}`);
    const choose = () => { if (input.length < 30) input += letter; renderInput(); };
    group.addEventListener('click', choose);
    group.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); } });
  }
  svg.append(group);
}
function drawBoard(container, interactive) {
  const svg = svgNode('svg', { viewBox: '0 0 300 275', role: interactive ? 'group' : 'presentation', 'aria-label': interactive ? 'Pulsa las letras del heptagrama' : '' });
  const defs = svgNode('defs');
  for (const [name, start, end] of [['center', '#b45a37', '#d48852'], ['outer', '#566252', '#7c846f']]) {
    const gradient = svgNode('linearGradient', { id: `${interactive ? 'main' : 'mini'}-${name}`, x2: '1', y2: '1' });
    gradient.append(svgNode('stop', { 'stop-color': start }), svgNode('stop', { offset: '1', 'stop-color': end })); defs.append(gradient);
  }
  svg.append(defs);
  const inner = ring(6, 63), rim = ring(6, 123), sequence = interactive ? outer : data.puzzle.outer;
  for (let i = 0; i < 6; i++) {
    const next = (i + 1) % 6, shape = [inner[i], rim[i], rim[next], inner[next]];
    const cx = shape.reduce((sum, p) => sum + p[0], 0) / 4, cy = shape.reduce((sum, p) => sum + p[1], 0) / 4;
    addCell(svg, sequence[i], shape.map(([x, y]) => [cx + (x - cx) * .91, cy + (y - cy) * .91]), false, interactive);
  }
  addCell(svg, data.puzzle.center, ring(6, 55), true, interactive);
  container.replaceChildren(svg);
}
function renderInput() { $('word-input').textContent = input ? input.toUpperCase() : 'Toca las letras del tablero…'; $('word-input').classList.toggle('placeholder', !input); }
function openText(title, text, label = 'EL PLACER DE LAS PALABRAS') {
  $('definition-word').textContent = title; $('definition-text').textContent = text;
  $('definition-dialog').querySelector('.card-eyebrow').textContent = label;
  $('definition-dialog').showModal();
}
function refresh() {
  const percent = found.length / data.total * 100;
  $('counter').textContent = `${found.length} / ${data.total}`;
  $('home-progress-count').textContent = `${found.length} palabras encontradas`;
  $('daily-word-count').textContent = `${data.total} palabras`;
  $('game-progress').style.width = `${percent}%`; $('home-progress').style.width = `${percent}%`;
  $('rank').textContent = percent < 10 ? 'Principiante' : percent < 30 ? 'Aprendiz' : percent < 60 ? 'Avanzado' : 'Experto';
  const buttons = [...found].sort((a, b) => a.localeCompare(b, 'es')).map((word) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'found-word'; button.textContent = word;
    const superhepta = [data.puzzle.center, ...data.puzzle.outer].every((letter) => word.includes(letter));
    if (superhepta) { button.classList.add('special'); button.textContent += ' ✧'; }
    button.onclick = () => openText(word, data.definitions[word] ?? 'Esta palabra pertenece a las soluciones del puzzle. Su definición completa no está incluida en esta maqueta.');
    return button;
  });
  $('found-words').replaceChildren(...buttons);
  $('stats-content').replaceChildren(...[data.puzzle.center, ...data.puzzle.outer].map((letter) => {
    const item = document.createElement('div'); item.className = 'stat-item';
    const title = document.createElement('strong'); title.textContent = letter.toUpperCase();
    const count = document.createElement('span'); count.textContent = `${found.filter((word) => word.startsWith(letter)).length} / ${data.solutions.filter((word) => word.startsWith(letter)).length}`;
    item.append(title, count); return item;
  }));
  renderInput();
}
function chooseFont(typewriter) {
  document.body.classList.toggle('typewriter', typewriter);
  $('font-serif').classList.toggle('selected', !typewriter); $('font-typewriter').classList.toggle('selected', typewriter);
  $('font-serif').setAttribute('aria-pressed', String(!typewriter)); $('font-typewriter').setAttribute('aria-pressed', String(typewriter));
}
$('font-serif').onclick = () => chooseFont(false); $('font-typewriter').onclick = () => chooseFont(true);
$('erase').onclick = () => { input = input.slice(0, -1); renderInput(); };
$('shuffle').onclick = () => { outer = [...outer]; for (let i = outer.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [outer[i], outer[j]] = [outer[j], outer[i]]; } drawBoard($('board'), true); };
$('submit').onclick = () => {
  const feedback = $('feedback'); feedback.className = 'feedback';
  if (!input) { feedback.textContent = 'Toca las letras del tablero para formar una palabra.'; return; }
  if (input.length < 3) { feedback.textContent = 'Busca una palabra de al menos tres letras.'; feedback.classList.add('error'); }
  else if (!input.includes(data.puzzle.center)) { feedback.textContent = `Incluye también la ${data.puzzle.center.toUpperCase()}, la letra central.`; feedback.classList.add('error'); }
  else if (found.includes(input)) feedback.textContent = 'Esta palabra ya está en tu colección.';
  else if (!data.solutions.includes(input)) { feedback.textContent = 'Esa palabra no está en el diccionario del puzzle.'; feedback.classList.add('error'); }
  else { found.push(input); feedback.textContent = '¡Bien! Una palabra más en tu colección.'; feedback.classList.add('success'); }
  input = ''; refresh();
};
function scrollTo(id) { $(id).scrollIntoView({ behavior: 'smooth', block: 'start' }); }
$('continue-daily').onclick = () => { scrollTo('game-section'); $('board').querySelector('[tabindex]')?.focus({ preventScroll: true }); };
$('back-home').onclick = () => document.querySelector('.home-screen').scrollIntoView({ behavior: 'smooth', block: 'start' });
$('back-classics').onclick = () => document.querySelector('.home-screen').scrollIntoView({ behavior: 'smooth', block: 'start' });
$('show-classics').onclick = () => scrollTo('classics-section');
$('show-exotics').onclick = () => openText('Exóticos', 'Empieza con siete letras y amplía tus posibilidades con letras extra y habilidades. Una partida para explorar a tu ritmo.', 'NUEVAS LETRAS, NUEVOS CAMINOS');
$('show-events').onclick = () => openText('Palabras para cada ocasión', 'Halloween · del 31 de octubre al 30 de noviembre. Calabazas, escobas y un poco de magia en cada letra. Los eventos mantienen su estética propia.', 'EL CALENDARIO DE PALABRARIUM');
$('close-definition').onclick = () => $('definition-dialog').close();
document.querySelectorAll('.settings-trigger').forEach((button) => { button.onclick = () => $('settings-dialog').showModal(); });
$('close-settings').onclick = () => $('settings-dialog').close();
$('sound-toggle').onclick = () => $('sound-toggle').setAttribute('aria-checked', String($('sound-toggle').getAttribute('aria-checked') !== 'true'));
$('demo-export').onclick = () => { $('settings-feedback').textContent = 'Vista de estilo: no se ha exportado ningún dato.'; };
$('demo-import').onclick = () => { $('settings-feedback').textContent = 'Vista de estilo: no se ha importado ni modificado ningún dato.'; };
for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('click', (event) => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
function renderSections() {
  const sections = longMode ? data.longSections : data.sections;
  $('classic-sections').replaceChildren(...sections.slice(0, 4).map((section, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'section-card';
    const sampleStarted = index === 0 ? 3 : index === 1 ? 1 : 0;
    button.innerHTML = `<span class="section-number">${String(section.number).padStart(2, '0')}</span><span class="section-information"><h3>Sección ${section.number}</h3><p>Heptagramas ${section.start}–${section.end}</p><div class="section-progress">${sampleStarted ? `${sampleStarted} / ${section.end - section.start + 1} iniciados` : 'Por descubrir'}</div><div class="subtle-progress"><span style="width:${sampleStarted / (section.end - section.start + 1) * 100}%;min-width:0"></span></div></span><span class="row-arrow" aria-hidden="true">›</span>`;
    button.onclick = () => {
      $('classic-message').textContent = `Sección ${section.number}: ${section.end - section.start + 1} heptagramas. Vista de la selección, sin abrir una partida.`;
      document.querySelectorAll('.section-card').forEach((item) => item.classList.toggle('chosen', item === button));
    };
    return button;
  }));
  $('classic-message').textContent = `${sections.length} secciones · el progreso mostrado es de ejemplo.`;
}
function changeTab(long) { longMode = long; $('tab-sections').classList.toggle('active', !long); $('tab-long').classList.toggle('active', long); $('tab-sections').setAttribute('aria-selected', String(!long)); $('tab-long').setAttribute('aria-selected', String(long)); $('classic-sections').setAttribute('aria-labelledby', long ? 'tab-long' : 'tab-sections'); renderSections(); }
$('tab-sections').onclick = () => changeTab(false); $('tab-long').onclick = () => changeTab(true);
try {
  const response = await fetch('./preview-data.json');
  if (!response.ok) throw new Error('No se pudieron cargar los datos de la maqueta.');
  data = await response.json(); found = data.examples.slice(0, 6); outer = [...data.puzzle.outer];
  drawBoard($('board'), true); drawBoard($('mini-board'), false); refresh(); renderSections();
  window.baseStylePreview = { ready: true, practiceWord: data.examples.find((word) => !found.includes(word)), samplePuzzle: data.puzzle.id, total: data.total };
} catch (error) { $('feedback').textContent = error.message; window.baseStylePreview = { ready: false, error: error.message }; }
