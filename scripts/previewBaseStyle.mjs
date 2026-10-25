import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const profile = await mkdtemp(path.join(tmpdir(), 'heptagramas-base-style-'));
const browser = spawn(process.env.PROGRESS_TEST_BROWSER ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
const integrated = process.argv.includes('--integrated');
const timeout = setTimeout(() => { browser.kill(); process.exitCode = 1; }, 60000);
try {
  const endpoint = await new Promise((resolve, reject) => {
    let stderr = '';
    browser.on('error', reject);
    browser.on('exit', (code) => reject(new Error(`Browser exited (${code}): ${stderr}`)));
    browser.stderr.on('data', (data) => { stderr += data; const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) resolve(match[1]); });
  });
  const pages = await (await fetch(`http://${new URL(endpoint).host}/json/list`)).json();
  socket = new WebSocket(pages.find((page) => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let nextId = 0;
  const pending = new Map(), events = new Map(), errors = [];
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) { const handler = pending.get(message.id); pending.delete(message.id); if (message.error) handler?.reject(new Error(JSON.stringify(message.error))); else handler?.resolve(message.result); }
    else events.get(message.method)?.(message.params);
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => {
    const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const navigate = async (url) => {
    const loaded = new Promise((resolve) => events.set('Page.loadEventFired', resolve));
    await cdp('Page.navigate', { url }); await loaded;
  };
  const screenshot = async (file, extra = {}) => {
    const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, ...extra });
    await writeFile(path.join('design/base', file), Buffer.from(result.data, 'base64'));
  };
  events.set('Runtime.exceptionThrown', (event) => errors.push(event.exceptionDetails.exception?.description ?? event.exceptionDetails.text));
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  // Use local fallback fonts for a reproducible preview without external requests.
  await cdp('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] });
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 1000, deviceScaleFactor: 1, mobile: true });
  await navigate('http://127.0.0.1:5174/heptagramas/');
  await evaluate(`(async()=>{ for(let i=0;i<150&&!document.querySelector('.home-screen');i++)await new Promise(r=>setTimeout(r,50)); if(!document.querySelector('.home-screen'))throw new Error('Current Home did not load'); return true; })()`);
  await screenshot(integrated ? 'integrado-inicio.png' : 'actual-inicio.png');
  await evaluate(`(async()=>{
    document.querySelector('.menu-btn-classic').click();
    for(let i=0;i<150&&!document.querySelector('.classic-section-card');i++)await new Promise(r=>setTimeout(r,50));
    if(!document.querySelector('.classic-section-card'))throw new Error('Current Classics did not load');
    return true;
  })()`);
  if (integrated) await screenshot('integrado-clasicos.png');
  await evaluate(`(async()=>{
    document.querySelector('.classic-section-card').click();
    await new Promise(r=>setTimeout(r,50));
    document.querySelector('.puzzle-card .btn-play').click();
    for(let i=0;i<100&&!document.querySelector('.word-input');i++)await new Promise(r=>setTimeout(r,50));
    if(!document.querySelector('.word-input'))throw new Error('Current Game did not load'); return true;
  })()`);
  await screenshot(integrated ? 'integrado-partida.png' : 'actual-partida.png', { captureBeyondViewport: false });

  if (integrated) {
    await evaluate(`(()=>{
      const details=document.querySelector('.base-stats');
      if(!details)throw new Error('Foldable statistics missing');
      details.open=true;
      if(getComputedStyle(details.querySelector('.stats-section')).display==='none')throw new Error('Statistics did not open');
      details.open=false;
      return true;
    })()`);
    const layouts = [];
    for (const width of [390, 320, 768]) {
      await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 600 });
      const layout = await evaluate('({width:innerWidth,content:document.documentElement.scrollWidth})');
      if (layout.content > width) throw new Error(`Game horizontal overflow: ${JSON.stringify(layout)}`);
      layouts.push(layout);
    }
    await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 1000, deviceScaleFactor: 1, mobile: true });
    await navigate('http://127.0.0.1:5174/heptagramas/');
    await evaluate(`(async()=>{for(let i=0;i<100&&!document.querySelector('.home-screen');i++)await new Promise(r=>setTimeout(r,50));document.querySelector('.menu-btn-settings').click();for(let i=0;i<100&&!document.querySelector('.settings-container');i++)await new Promise(r=>setTimeout(r,50));if(!document.querySelector('.settings-container'))throw new Error('Settings navigation failed');return true;})()`);
    await screenshot('integrado-ajustes.png');
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1360, height: 1350, deviceScaleFactor: 1, mobile: false });
    await navigate('http://127.0.0.1:5174/heptagramas/design/base/integrado.html');
    await evaluate(`(async()=>{await Promise.all([...document.images].map(img=>img.decode()));return true;})()`);
    await screenshot('integrado.png');
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(JSON.stringify({ integrated: true, layouts, captures: 'design/base/integrado*.png' }, null, 2));
    process.exitCode = 0;
  } else {

  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1500, deviceScaleFactor: 1, mobile: false });
  await navigate('http://127.0.0.1:5174/heptagramas/design/base/index.html');
  const checks = await evaluate(`(async()=>{
    for(let i=0;i<100&&!window.baseStylePreview;i++)await new Promise(r=>setTimeout(r,50));
    if(!window.baseStylePreview?.ready)throw new Error(JSON.stringify(window.baseStylePreview));
    if(document.querySelectorAll('#board .letter-cell').length!==7)throw new Error('Board missing letters');
    for(const letter of window.baseStylePreview.practiceWord){
      [...document.querySelectorAll('#board .letter-cell')].find(g=>g.querySelector('text').textContent===letter.toUpperCase()).dispatchEvent(new MouseEvent('click',{bubbles:true}));
    }
    document.getElementById('submit').click();
    if(!document.querySelector('.feedback.success'))throw new Error('Valid word was rejected');
    document.querySelector('.found-word').click();
    if(!document.getElementById('definition-dialog').open)throw new Error('Definition did not open');
    document.getElementById('close-definition').click();
    document.getElementById('font-typewriter').click();
    if(!document.body.classList.contains('typewriter'))throw new Error('Font option failed');
    document.getElementById('font-serif').click();
    document.getElementById('tab-long').click();
    if(document.getElementById('tab-long').getAttribute('aria-selected')!=='true')throw new Error('Long tab failed');
    document.getElementById('tab-sections').click();
    document.querySelector('.settings-trigger').click();
    if(!document.getElementById('settings-dialog').open)throw new Error('Settings did not open');
    document.getElementById('sound-toggle').click();
    if(document.getElementById('sound-toggle').getAttribute('aria-checked')!=='true')throw new Error('Switch failed');
    document.getElementById('demo-import').click();
    if(!document.getElementById('settings-feedback').textContent.includes('no se ha importado'))throw new Error('Data controls must stay disconnected');
    document.getElementById('close-settings').click();
    document.getElementById('stats').open=true;
    if(document.querySelectorAll('.stat-item').length!==7)throw new Error('Statistics missing');
    document.getElementById('stats').open=false;
    return {preview:window.baseStylePreview,interaction:'letters, definitions, title fonts, classic tabs, settings, statistics'};
  })()`);
  if (errors.length) throw new Error(errors.join('\n'));
  // Reload the proposal to capture its initial state after interaction checks.
  await navigate('http://127.0.0.1:5174/heptagramas/design/base/index.html');
  await evaluate(`(async()=>{while(!window.baseStylePreview)await new Promise(r=>setTimeout(r,20));return true;})()`);
  await screenshot('propuesta.png');
  const bounds = await evaluate(`(()=>{const r=document.querySelector('.screens').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()`);
  await screenshot('propuesta-pantallas.png', { clip: bounds });
  await evaluate(`document.querySelector('.settings-trigger').click()`);
  await screenshot('propuesta-ajustes.png', { captureBeyondViewport: false });
  await evaluate(`document.getElementById('close-settings').click()`);
  await evaluate(`document.getElementById('font-typewriter').click()`);
  await screenshot('propuesta-typewriter.png', { clip: bounds });
  await evaluate(`document.getElementById('font-serif').click()`);
  const mobileLayouts = [];
  for (const width of [390, 320]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    const layout = await evaluate('({width:innerWidth,content:document.documentElement.scrollWidth})');
    if (layout.content > width || layout.width !== width) throw new Error(`Horizontal overflow: ${JSON.stringify(layout)}`);
    mobileLayouts.push(layout);
    if (width === 390) await screenshot('propuesta-movil.png');
  }
  console.log(JSON.stringify({ checks, mobileLayouts, captures: 'design/base/*.png' }, null, 2));
  }
} finally {
  clearTimeout(timeout);
  if (socket?.readyState === WebSocket.OPEN) { socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' })); socket.close(); }
  else browser.kill();
  const relative = path.relative(path.resolve(tmpdir()), path.resolve(profile));
  if (relative.startsWith('heptagramas-base-style-') && !relative.includes(path.sep)) await rm(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
}
