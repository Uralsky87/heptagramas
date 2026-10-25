import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const profile = await mkdtemp(path.join(tmpdir(), 'heptagramas-halloween-preview-'));
const browser = spawn(process.env.PROGRESS_TEST_BROWSER ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
const timeout = setTimeout(() => { browser.kill(); process.exitCode = 1; }, 45000);
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
  events.set('Runtime.exceptionThrown', (event) => errors.push(event.exceptionDetails.text));
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1550, deviceScaleFactor: 1, mobile: false });
  const loaded = new Promise((resolve) => events.set('Page.loadEventFired', resolve));
  await cdp('Page.navigate', { url: 'http://127.0.0.1:5174/heptagramas/design/halloween/index.html' }); await loaded;
  const checked = await cdp('Runtime.evaluate', { expression: `(async () => {
    for (let i=0; i<100 && !window.halloweenPreview; i++) await new Promise(r=>setTimeout(r,50));
    if (!window.halloweenPreview?.ready) throw new Error(JSON.stringify(window.halloweenPreview));
    if (document.querySelectorAll('.candidate').length !== 4) throw new Error('Missing candidates');
    if (document.querySelectorAll('.letter-cell').length !== 7) throw new Error('Incorrect initial board');
    document.getElementById('unlock').click();
    if (document.querySelectorAll('.letter-cell').length !== 8 || !document.getElementById('counter').textContent.includes('482')) throw new Error('Gift did not update the board/count');
    for (const letter of 'escoba') {
      [...document.querySelectorAll('.letter-cell')].find(g=>g.querySelector('text').textContent===letter.toUpperCase()).dispatchEvent(new MouseEvent('click',{bubbles:true}));
    }
    document.getElementById('submit').click();
    if (!document.querySelector('.feedback.success')) throw new Error('Thematic submission failed');
    for (const button of document.querySelectorAll('.candidate')) {
      button.click();
      if (document.querySelectorAll('.letter-cell').length!==7) throw new Error('Candidate did not reset board');
    }
    document.querySelector('.candidate').click();
    return { candidates:4, interaction:'letters, reward, thematic submission, candidate switching' };
  })()`, awaitPromise: true, returnByValue: true });
  if (checked.exceptionDetails || errors.length) throw new Error(JSON.stringify({ checked, errors }));
  let screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile('design/halloween/propuesta.png', Buffer.from(screenshot.data, 'base64'));
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const mobileCheck = await cdp('Runtime.evaluate', { expression: '({ width:innerWidth, content:document.documentElement.scrollWidth, height:document.documentElement.scrollHeight })', returnByValue: true });
  if (mobileCheck.result.value.content > mobileCheck.result.value.width) throw new Error(`Mobile overflow: ${JSON.stringify(mobileCheck.result.value)}`);
  screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile('design/halloween/propuesta-movil.png', Buffer.from(screenshot.data, 'base64'));
  console.log(JSON.stringify({ desktop: 'design/halloween/propuesta.png', mobile: 'design/halloween/propuesta-movil.png', checked: checked.result.value, mobileSize: mobileCheck.result.value }, null, 2));
} finally {
  clearTimeout(timeout);
  if (socket?.readyState === WebSocket.OPEN) { socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' })); socket.close(); }
  else browser.kill();
  const relative = path.relative(path.resolve(tmpdir()), path.resolve(profile));
  if (relative.startsWith('heptagramas-halloween-preview-') && !relative.includes(path.sep)) await rm(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
}
