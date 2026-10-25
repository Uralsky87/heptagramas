import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const browserPath = process.env.PROGRESS_TEST_BROWSER ?? [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium', '/usr/bin/google-chrome',
].find(existsSync);
if (!browserPath) throw new Error('Set PROGRESS_TEST_BROWSER to a Chrome/Chromium/Edge executable.');

const profile = await mkdtemp(path.join(tmpdir(), 'heptagramas-progress-test-'));
let vite;
let browser;
let socket;
let cdp;
const timeout = setTimeout(() => {
  console.error('Progress safety tests timed out');
  browser?.kill();
  vite?.kill();
  process.exit(1);
}, 60000);
try {
  let serverOutput = '';
  vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5175', '--strictPort'], {
    cwd: projectRoot, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  vite.stdout.on('data', (data) => { serverOutput += data; });
  vite.stderr.on('data', (data) => { serverOutput += data; });
  let serverError;
  vite.on('error', (error) => { serverError = error; });
  const testUrl = 'http://127.0.0.1:5175/heptagramas/scripts/progress-safety.html';
  for (let attempt = 0; ; attempt++) {
    if (serverError) throw serverError;
    if (vite.exitCode !== null) throw new Error(`Vite exited: ${serverOutput}`);
    try {
      if ((await fetch(testUrl)).ok) break;
    } catch { /* Wait for the dev server. */ }
    if (attempt > 100) throw new Error(`Vite did not start: ${serverOutput}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  browser = spawn(browserPath, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  const endpoint = await new Promise((resolve, reject) => {
    let stderr = '';
    browser.on('error', reject);
    browser.on('exit', (code) => reject(new Error(`Browser exited (${code}): ${stderr}`)));
    browser.stderr.on('data', (data) => {
      stderr += data;
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) resolve(match[1]);
    });
  });
  const { host } = new URL(endpoint);
  const pages = await (await fetch(`http://${host}/json/list`)).json();
  socket = new WebSocket(pages.find((page) => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  const events = new Map();
  const browserErrors = [];
  events.set('Runtime.exceptionThrown', (event) => browserErrors.push(event.exceptionDetails.exception?.description ?? event.exceptionDetails.text));
  events.set('Runtime.consoleAPICalled', (event) => {
    if (event.type === 'error') browserErrors.push(event.args.map((arg) => arg.value ?? arg.description).join(' '));
  });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const handlers = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) handlers?.reject(new Error(JSON.stringify(message.error)));
      else handlers?.resolve(message.result);
    } else {
      events.get(message.method)?.(message.params);
    }
  });
  cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  const loaded = new Promise((resolve) => events.set('Page.loadEventFired', resolve));
  await cdp('Page.navigate', { url: testUrl });
  await loaded;
  const result = await cdp('Runtime.evaluate', {
    expression: 'window.progressSafetyResult', awaitPromise: true, returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  const report = result.result.value;
  if (!report) throw new Error('Test page did not expose its result');
  if (report.error) {
    const dom = await cdp('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true });
    throw new Error(`${report.error}\nBrowser errors: ${browserErrors.slice(-6).join('\n')}\nPage: ${dom.result.value}`);
  }
  for (const test of report.passed) console.log(`PASS ${test}`);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 1100, deviceScaleFactor: 1, mobile: true });
  const layout = await cdp('Runtime.evaluate', { expression: '({ width:innerWidth, content:document.documentElement.scrollWidth, halloween:!!document.querySelector(".game-screen.special-game-theme-halloween") })', returnByValue: true });
  if (layout.result.value.content > layout.result.value.width) throw new Error(`Mobile horizontal overflow: ${JSON.stringify(layout.result.value)}`);
  if (layout.result.value.halloween) {
    const screenshot = await cdp('Page.captureScreenshot', { format: 'png' });
    await writeFile(path.join(projectRoot, 'design/halloween/juego-integrado.png'), Buffer.from(screenshot.data, 'base64'));
  }
  const reloaded = new Promise((resolve) => events.set('Page.loadEventFired', resolve));
  await cdp('Page.reload');
  await reloaded;
  const reloadResult = await cdp('Runtime.evaluate', {
    expression: 'window.progressSafetyResult', awaitPromise: true, returnByValue: true,
  });
  const reloadReport = reloadResult.result?.value;
  if (reloadResult.exceptionDetails || !reloadReport || reloadReport.error) {
    throw new Error(JSON.stringify(reloadReport ?? reloadResult));
  }
  for (const test of reloadReport.passed) console.log(`PASS ${test}`);
  console.log(`${report.passed.length + reloadReport.passed.length} browser regression scenarios passed (React StrictMode + IndexedDB).`);
} finally {
  clearTimeout(timeout);
  if (socket?.readyState === WebSocket.OPEN) {
    // Close the entire disposable browser, including child processes.
    socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' }));
    socket.close();
  } else {
    browser?.kill();
  }
  vite?.kill();
  // Validate the absolute target before recursively removing the temporary profile.
  const relativeProfile = path.relative(path.resolve(tmpdir()), path.resolve(profile));
  if (relativeProfile.startsWith('heptagramas-progress-test-') && !relativeProfile.includes(path.sep)) {
    await rm(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
  }
}
