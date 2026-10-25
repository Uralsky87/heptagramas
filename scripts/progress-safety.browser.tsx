import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import Game from '../src/components/Game';
import App from '../src/App';
import { LanguageContext } from '../src/contexts/languageContextStore';
import { loadDictionary } from '../src/lib/dictionary';
import { clearRuntimeCaches, flushPendingWrites } from '../src/lib/storageAdapter';
import { openDatabase } from '../src/storage/db';
import type { Puzzle } from '../src/types';
import { CHRISTMAS_PUZZLE, EVENT_PUZZLES, getEventProgressId, isEventActive, MOTHERS_DAY_PROGRESS_ID, HALLOWEEN_EVENT_ID } from '../src/lib/specialPuzzles';
import type { EventPuzzle } from '../src/lib/specialPuzzles';
import { prepareEventEntry } from '../src/lib/eventEntry';
import { createClassicProgressIfMissing } from '../src/storage/api';
import { solvePuzzle } from '../src/lib/solvePuzzle';

// Served only by the development test runner, in a disposable browser profile.
// The application and IndexedDB are real; only definitions and failures are stubbed.
const originalFetch = window.fetch.bind(window);
let useFullDictionary = false;
window.fetch = (input, init) => {
  if (String(input).includes('definiciones_normalizado.txt')) return Promise.resolve(new Response('ala Parte de un ave.\nlata Recipiente.'));
  if (!useFullDictionary && String(input).includes('wordlist_normalizado.txt')) return Promise.resolve(new Response('ala\nlata\nrata\noro\nloro\nsol\ntela\npilar'));
  return originalFetch(input, init);
};

const A: Puzzle = { id: 'classic-test-a', title: 'Test A', center: 'a', outer: ['r', 't', 'e', 'l', 's', 'o'], mode: 'classic' };
const B: Puzzle = { id: 'classic-test-b', title: 'Test B', center: 'o', outer: ['r', 't', 'e', 'l', 's', 'a'], mode: 'classic' };
const C: Puzzle = { id: 'classic-test-c', title: 'Test C', center: 'e', outer: ['r', 't', 'i', 'l', 's', 'a'], mode: 'classic' };
const root = createRoot(document.getElementById('root')!);
let translations: Record<string, string> = {};
const languageContext = { language: 'es' as const, setLanguage() {}, t: (key: string) => translations[key] ?? key };
const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
const realNow = Date.now.bind(Date);
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function equal(actual: unknown, expected: unknown, message: string) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}\nActual: ${JSON.stringify(actual)}\nExpected: ${JSON.stringify(expected)}`);
}
async function until(check: () => unknown, message: string) {
  const deadline = realNow() + 5000;
  while (!check()) {
    assert(realNow() < deadline, message);
    await sleep(10);
  }
}
function click(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  assert(element, `Missing ${selector}`);
  element.click();
}
function words() {
  return Array.from(document.querySelectorAll('.found-list li'), (li) => li.childNodes[0].textContent);
}
async function select(puzzle: Puzzle) {
  click('.btn-change-puzzle');
  await until(() => document.querySelector('.puzzle-selector-modal'), 'Selector did not open');
  const card = Array.from(document.querySelectorAll<HTMLButtonElement>('.puzzle-card'))
    .find((button) => button.querySelector('.center-letter')?.textContent === puzzle.center.toUpperCase());
  assert(card, `Missing puzzle ${puzzle.title}`);
  card.click();
  await sleep();
}
async function ready(title: string) {
  await until(() => document.querySelector('.word-input') && document.querySelector('.puzzle-title')?.textContent === title, `${title} did not load`);
  await sleep(25);
}
async function enter(word: string) {
  for (const letter of word) {
    const label = Array.from(document.querySelectorAll<SVGTextElement>('.heptagram-svg text, svg text'))
      .find((text) => text.textContent === letter.toUpperCase());
    assert(label, `Missing letter ${letter}`);
    label.parentElement!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await sleep();
  }
  click('.btn-submit');
  await sleep(25);
}

async function run() {
  const passed: string[] = [];
  translations = await (await originalFetch(`${import.meta.env.BASE_URL}i18n/es.json`)).json();
  const dictionary = await loadDictionary('ala\nlata\nrata\noro\nloro\nsol\ntela');
  const db = await openDatabase();
  const nativeGet = db.get.bind(db);
  const nativePut = db.put.bind(db);
  const expectedAfterReload = sessionStorage.getItem('progress-safety-reload');
  if (expectedAfterReload) {
    const snapshot = JSON.parse(expectedAfterReload);
    equal(await db.getAll('progress_classic'), snapshot.classic, 'Classic records changed after a full page reload');
    equal(await db.getAll('progress_daily'), snapshot.daily, 'Daily records changed after a full page reload');
    equal(await db.getAll('kv'), snapshot.kv, 'Player/other records changed after a full page reload');
    sessionStorage.removeItem('progress-safety-reload');
    return { passed: ['All IndexedDB records survive a full page reload unchanged'] };
  }
  const seedA = { id: A.id, foundWords: ['ala'], score: 17, superHeptaWords: ['ala'], completed: true, totalWords: 123, startedAt: 1700000000000, lastPlayedAt: 1700000001000 };
  const seedB = { id: B.id, foundWords: ['oro'], score: 93, superHeptaWords: [], completed: false, startedAt: 1701000000000, lastPlayedAt: 1701000001000 };
  await db.put('progress_classic', seedA);
  await db.put('progress_classic', seedB);
  await db.put('kv', { key: 'unrelated', value: { untouched: true }, updatedAt: 123 });

  function mount(puzzle = A, progressId?: string, eventConfig?: EventPuzzle) {
    root.render(<StrictMode><LanguageContext.Provider value={languageContext}>
      <Game initialPuzzle={puzzle} allPuzzles={[A, B, C]} dictionary={dictionary} mode={eventConfig ? 'special' : progressId ? 'daily' : 'classic'} dailyProgressId={progressId} eventConfig={eventConfig}
        onBack={() => root.render(<p>Outside game</p>)} />
    </LanguageContext.Provider></StrictMode>);
  }

  // Hydration and leaving must not rewrite even metadata the adapter does not expose.
  mount();
  await ready(A.title);
  equal(words(), ['ala'], 'Existing words were not restored');
  await flushPendingWrites();
  equal(await db.get('progress_classic', A.id), seedA, 'Opening changed an existing save');
  await select(B);
  await ready(B.title);
  equal(words(), ['oro'], 'A words leaked into B');
  await flushPendingWrites();
  equal(await db.get('progress_classic', A.id), seedA, 'Leaving untouched A rewrote its save');
  equal(await db.get('progress_classic', B.id), seedB, 'Switching overwrote B');
  passed.push('Existing saves survive opening and A → B without any rewrite');

  await select(A);
  await ready(A.title);
  await enter('lata');
  await flushPendingWrites();
  const editedA = await db.get('progress_classic', A.id);
  equal(editedA?.foundWords, ['ala', 'lata'], 'New word did not persist');
  equal(editedA?.startedAt, seedA.startedAt, 'Original start date changed');
  equal(editedA?.score, seedA.score, 'Existing score changed');
  equal(editedA?.superHeptaWords, seedA.superHeptaWords, 'Existing achievements changed');
  await select(B);
  await ready(B.title);
  equal(await db.get('progress_classic', B.id), seedB, 'Editing A contaminated B');
  await select(A);
  await ready(A.title);
  equal(words(), ['ala', 'lata'], 'Returning lost new progress');
  passed.push('Editing A, switching to B and returning preserves each save');

  await select(C);
  await ready(C.title);
  equal(words(), [], 'New puzzle inherited old words');
  equal(await db.get('progress_classic', C.id), undefined, 'Opening an empty puzzle wrote a record');
  passed.push('An unopened puzzle starts empty without writing on hydration');

  // Simulate a slow B read, then leave before it resolves and reopen A.
  let releaseRead!: () => void;
  const readGate = new Promise<void>((resolve) => { releaseRead = resolve; });
  let readStarted = false;
  db.get = (async (store: string, key: string) => {
    if (store === 'progress_classic' && key === B.id) {
      readStarted = true;
      await readGate;
    }
    return nativeGet(store as 'progress_classic', key);
  }) as typeof db.get;
  await select(B);
  await until(() => readStarted, 'Delayed read did not start');
  assert(!document.querySelector('.word-input'), 'Game accepts input while loading');
  Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Volver')!.click();
  await sleep();
  db.get = nativeGet;
  mount();
  await ready(A.title);
  releaseRead();
  await sleep(50);
  equal(words(), ['ala', 'lata'], 'A late B load replaced A');
  equal(await db.get('progress_classic', B.id), seedB, 'Leaving while loading overwrote B');
  passed.push('A delayed load cannot update another or unmounted game');

  // Block the real A write, then switch back before that write completes.
  let releaseWrite!: () => void;
  const writeGate = new Promise<void>((resolve) => { releaseWrite = resolve; });
  let writeStarted = false;
  db.put = (async (store: string, value: { id?: string }) => {
    if (store === 'progress_classic' && value.id === A.id) {
      writeStarted = true;
      await writeGate;
    }
    return nativePut(store as 'progress_classic', value as typeof seedA);
  }) as typeof db.put;
  await enter('rata');
  await until(() => writeStarted, 'Delayed write did not start');
  await select(B);
  Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Volver')!.click();
  await sleep();
  // Keep the queue intact: the reopened game must wait for it.
  mount();
  await sleep(30);
  assert(!document.querySelector('.word-input'), 'Game read stale data before the pending save finished');
  releaseWrite();
  await ready(A.title);
  equal(words(), ['ala', 'lata', 'rata'], 'Reopening lost a pending word');
  await flushPendingWrites();
  db.put = nativePut;
  passed.push('A → B → reopen A waits for pending writes');

  const preservedB = await db.get('progress_classic', B.id);
  let failRead = true;
  db.get = (async (store: string, key: string) => {
    if (failRead && store === 'progress_classic' && key === B.id) throw new Error('Simulated read failure');
    return nativeGet(store as 'progress_classic', key);
  }) as typeof db.get;
  // Changing props exercises the same Game instance, without a selector preload.
  mount(A, B.id);
  await until(() => document.querySelector('[role="alert"]'), 'Read failure was not shown');
  assert(!document.querySelector('.word-input'), 'Read failure enabled an empty game');
  equal(await nativeGet('progress_classic', B.id), preservedB, 'Read failure overwrote existing data');
  failRead = false;
  Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Reintentar')!.click();
  await ready(A.title);
  equal(words(), ['oro'], 'Retry failed to restore saved words');
  equal(await db.get('progress_classic', B.id), preservedB, 'Retry rewrote the save');
  db.get = nativeGet;
  passed.push('Read failure blocks saving; retry restores the original save');

  // Legacy daily IDs still resolve without changing the stored record.
  root.render(<p>Outside game</p>);
  await sleep();
  const legacyDaily = { date: '2026-10-24', foundWords: ['ala'], completed: true, lastPlayedAt: 1700000000000, totalWords: 150 };
  await db.put('progress_daily', legacyDaily);
  clearRuntimeCaches();
  mount(A, 'daily-es-2026-10-24');
  await ready(A.title);
  equal(words(), ['ala'], 'Legacy Spanish daily progress was not restored');
  await flushPendingWrites();
  equal(await db.get('progress_daily', legacyDaily.date), legacyDaily, 'Legacy daily record was rewritten');
  equal(await db.get('progress_daily', 'es-2026-10-24'), undefined, 'Opening migrated the daily record');
  equal((await db.get('kv', 'unrelated'))?.value, { untouched: true }, 'Unrelated data changed');
  passed.push('Legacy daily progress and unrelated records remain intact');

  root.render(<p>Outside game</p>);
  await sleep();
  const christmas = EVENT_PUZZLES.find((event) => event.theme === 'christmas')!;
  const eventSave = { ...seedB, id: `${christmas.id}-2026`, foundWords: ['belen', 'arbol'], exoticLetter: 'r' };
  await db.put('progress_classic', eventSave);
  mount(CHRISTMAS_PUZZLE, eventSave.id, christmas);
  await ready(CHRISTMAS_PUZZLE.title!);
  equal(words(), ['belen', 'arbol'], 'Event words were not restored');
  assert(document.querySelector('.event-gift-panel-open'), 'Unlocked event letter was lost');
  await flushPendingWrites();
  equal(await db.get('progress_classic', eventSave.id), eventSave, 'Opening an event rewrote its save');
  passed.push('An existing event retains words and its unlocked letter without rewriting');

  const mothersDay = EVENT_PUZZLES.find((event) => event.theme === 'mothers-day')!;
  assert(EVENT_PUZZLES.every((event) => event.schedule.kind === 'annual'), 'An event is still fixed to one year');
  for (const year of [2026, 2027, 2030]) {
    assert(!isEventActive(mothersDay, `${year}-04-30`), 'Mother event started early');
    assert(isEventActive(mothersDay, `${year}-05-01`), 'Mother event missed its first day');
    assert(isEventActive(mothersDay, `${year}-05-31`), 'Mother event missed its last day');
    assert(!isEventActive(mothersDay, `${year}-06-01`), 'Mother event ended late');
  }
  equal(getEventProgressId(mothersDay, '2026-10-25'), MOTHERS_DAY_PROGRESS_ID, '2026 legacy event ID changed');
  equal(getEventProgressId(mothersDay, '2027-05-01'), 'special-mothers-day-2027', 'New season has wrong ID');
  equal(getEventProgressId(christmas, '2027-01-15'), getEventProgressId(christmas, '2026-12-15'), 'Christmas split into two years');
  assert(isEventActive(christmas, '2027-01-15') && !isEventActive(christmas, '2027-01-16'), 'Christmas boundary changed');
  const summer = EVENT_PUZZLES.find((event) => event.theme === 'summer')!;
  equal(getEventProgressId(summer, '2026-06-21'), 'special-summer-2026', 'Existing summer ID changed');
  assert(isEventActive(summer, '2027-06-21') && isEventActive(summer, '2027-07-21') && !isEventActive(summer, '2027-07-22'), 'Summer annual dates changed');
  passed.push('Annual dates repeat; 2026 IDs and Christmas cross-year season remain compatible');

  root.render(<p>Outside game</p>);
  await sleep();
  await flushPendingWrites();
  const motherSave = { ...seedA, id: MOTHERS_DAY_PROGRESS_ID, foundWords: ['pilar', 'pili'] };
  await db.put('progress_classic', motherSave);
  await createClassicProgressIfMissing({ ...motherSave, foundWords: [] });
  equal(await db.get('progress_classic', motherSave.id), motherSave, 'Create-if-missing replaced existing words');
  const futureId = getEventProgressId(mothersDay, '2028-05-15');
  await Promise.all(Array.from({ length: 3 }, () => prepareEventEntry(mothersDay, { startNew: true, dateKey: '2028-05-15' })));
  assert(await db.get('progress_classic', futureId), 'Concurrent starts did not create a record');
  equal((await db.getAllKeys('progress_classic')).filter((key) => key === futureId).length, 1, 'Concurrent starts duplicated the event');
  equal(await db.get('progress_classic', motherSave.id), motherSave, 'A new season changed the old record');
  passed.push('Atomic start preserves existing records and isolates concurrent/new-year starts');

  assert(await prepareEventEntry(mothersDay, { startNew: true, dateKey: '2026-10-25' }), 'An expired started event cannot continue');
  equal(await db.get('progress_classic', motherSave.id), motherSave, 'Continuing an expired event rewrote it');
  equal(await prepareEventEntry(mothersDay, { startNew: true, dateKey: '2029-06-01' }), false, 'An expired unstarted event was allowed');
  equal(await db.get('progress_classic', 'special-mothers-day-2029'), undefined, 'An inactive event created a save');
  passed.push('Outside the annual window only already-started events can open');

  const nativeTransaction = db.transaction.bind(db);
  let rejectedStart = false;
  db.transaction = ((...args: Parameters<typeof db.transaction>) => {
    if (args[0] === 'progress_classic' && args[1] === 'readwrite') throw new DOMException('Simulated write failure', 'QuotaExceededError');
    return nativeTransaction(...args);
  }) as typeof db.transaction;
  try {
    await prepareEventEntry(mothersDay, { startNew: true, dateKey: '2029-05-15' });
  } catch { rejectedStart = true; }
  finally { db.transaction = nativeTransaction; }
  assert(rejectedStart, 'A failed event creation reported success');
  equal(await db.get('progress_classic', 'special-mothers-day-2029'), undefined, 'A failed creation left a record');
  equal(await db.get('progress_classic', motherSave.id), motherSave, 'A failed creation changed the 2026 save');
  passed.push('A failed event creation propagates the error and preserves older seasons');

  const RealDate = window.Date;
  let fixedNow = new RealDate('2026-05-15T12:00:00').getTime();
  class EventTestDate extends RealDate {
    constructor(value?: string | number | Date) { super(value === undefined ? fixedNow : value instanceof RealDate ? value.getTime() : value); }
    static now() { return fixedNow; }
  }
  window.Date = EventTestDate as unknown as DateConstructor;
  const mountApp = async () => {
    flushSync(() => root.render(<p>Outside app</p>));
    await flushPendingWrites();
    clearRuntimeCaches();
    window.history.replaceState(null, '');
    root.render(<StrictMode><LanguageContext.Provider value={languageContext}><App /></LanguageContext.Provider></StrictMode>);
    await until(() => document.querySelector('.home-menu'), 'App did not open Home');
  };
  try {
    await mountApp();
    click('.menu-btn-special-mothers-day');
    await until(() => document.querySelector('.btn-play-today'), 'Event detail did not load from Home');
    equal(await db.get('progress_classic', motherSave.id), motherSave, 'Opening the event detail modified the save');
    const playButton = document.querySelector<HTMLButtonElement>('.btn-play-today')!;
    playButton.click();
    playButton.click();
    await ready(mothersDay.puzzle.title!);
    equal(words(), ['pilar', 'pili'], 'Home → event → play lost existing words');
    await flushPendingWrites();
    equal(await db.get('progress_classic', motherSave.id), motherSave, 'Home entry or double-click rewrote existing progress');
    passed.push('Real App: Home → event → play preserves a cold-cache 2026 save, even with double-click');

    await mountApp();
    click('.menu-btn-special-mothers-day');
    await until(() => document.querySelector('.btn-play-today'), 'Event detail did not load');
    let failEventRead = true;
    db.get = (async (store: string, key: string) => {
      if (failEventRead && store === 'progress_classic' && key === motherSave.id) throw new Error('Simulated event-entry read failure');
      return nativeGet(store as 'progress_classic', key);
    }) as typeof db.get;
    click('.btn-play-today');
    await until(() => document.querySelector('[role="alert"]'), 'Entry read failure did not block Play');
    assert(!document.querySelector('.word-input'), 'Entry failure enabled the game');
    equal(await nativeGet('progress_classic', motherSave.id), motherSave, 'Failed entry destroyed the save');
    failEventRead = false;
    Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Reintentar')!.click();
    await ready(mothersDay.puzzle.title!);
    equal(words(), ['pilar', 'pili'], 'Entry retry did not restore saved words');
    db.get = nativeGet;
    passed.push('Real App: a read failure while starting blocks writes and retry restores progress');

    await mountApp();
    let releaseEntry!: () => void;
    const entryGate = new Promise<void>((resolve) => { releaseEntry = resolve; });
    let entryReadStarted = false;
    db.get = (async (store: string, key: string) => {
      if (store === 'progress_classic' && key === motherSave.id) {
        entryReadStarted = true;
        await entryGate;
      }
      return nativeGet(store as 'progress_classic', key);
    }) as typeof db.get;
    click('.menu-btn-special-mothers-day');
    await until(() => entryReadStarted, 'Delayed entry did not read disk');
    Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Volver')!.click();
    releaseEntry();
    await sleep(50);
    assert(document.querySelector('.home-menu') && !document.querySelector('.btn-play-today'), 'Cancelled entry navigated after resolving');
    db.get = nativeGet;
    equal(await db.get('progress_classic', motherSave.id), motherSave, 'Cancelling entry changed the save');
    passed.push('Real App: cancelling a slow entry prevents late navigation');

    fixedNow = new RealDate('2027-05-15T12:00:00').getTime();
    await mountApp();
    const nextYearId = getEventProgressId(mothersDay, '2027-05-15');
    click('.menu-btn-special-mothers-day');
    await until(() => document.querySelector('.btn-play-today'), 'Next-year event did not recur');
    equal(await db.get('progress_classic', nextYearId), undefined, 'Viewing next season prematurely created a save');
    click('.btn-play-today');
    await ready(mothersDay.puzzle.title!);
    equal(words(), [], 'New season inherited the previous year');
    assert(await db.get('progress_classic', nextYearId), 'Starting an empty event did not mark it started');
    equal(await db.get('progress_classic', motherSave.id), motherSave, 'Next-year event overwrote the 2026 save');
    passed.push('Real App: annual event creates an independent 2027 save and retains 2026');

    const halloween = EVENT_PUZZLES.find((event) => event.id === HALLOWEEN_EVENT_ID)!;
    assert(halloween, 'Halloween is missing');
    for (const year of [2026, 2027]) {
      assert(!isEventActive(halloween, `${year}-10-30`), 'Halloween starts too early');
      assert(isEventActive(halloween, `${year}-10-31`), 'Halloween misses October 31');
      assert(isEventActive(halloween, `${year}-11-30`), 'Halloween misses November 30');
      assert(!isEventActive(halloween, `${year}-12-01`), 'Halloween ends too late');
      equal(getEventProgressId(halloween, `${year}-10-31`), `special-halloween-${year}`, 'Halloween season ID is unstable');
    }
    passed.push('Halloween repeats October 31–November 30 with independent annual IDs');

    useFullDictionary = true;
    const fullDictionary = await loadDictionary(await (await originalFetch(`${import.meta.env.BASE_URL}wordlist_normalizado.txt`)).text());
    const initialSolutions = solvePuzzle(halloween.puzzle.center, halloween.puzzle.outer, fullDictionary, 3, true);
    const expandedSolutions = solvePuzzle(halloween.puzzle.center, halloween.puzzle.outer, fullDictionary, 3, true, halloween.unlockedExtraLetter);
    equal(initialSolutions.length, halloween.puzzle.solutionCount, 'Halloween initial count differs from the real solver');
    equal(expandedSolutions.length, halloween.unlockedSolutionCount, 'Halloween gift count differs from the real solver');
    assert(initialSolutions.includes('calabaza') && initialSolutions.includes('calabozo'), 'Initial Halloween words are missing');
    assert(!initialSolutions.includes('escoba') && expandedSolutions.includes('escoba'), 'Escoba does not unlock with E');
    passed.push('Halloween solver validates 280 → 482 and the three thematic words');

    fixedNow = new RealDate('2026-10-30T12:00:00').getTime();
    await mountApp();
    assert(!document.querySelector('.menu-btn-special-halloween'), 'Halloween is visible before October 31');
    fixedNow = new RealDate('2026-10-31T12:00:00').getTime();
    await mountApp();
    click('.menu-btn-special-halloween');
    await until(() => document.querySelector('.special-detail-halloween .btn-play-today'), 'Halloween detail did not open');
    assert(document.querySelector<HTMLImageElement>('.halloween-artwork')?.getAttribute('src')?.endsWith('halloween-scene.svg'), 'Halloween artwork is missing');
    click('.btn-play-today');
    await ready(halloween.puzzle.title!);
    assert(document.querySelector('.counter')?.textContent?.includes('0 / 280'), 'Halloween opened with the wrong total');
    assert(!document.querySelector('.event-gift-button'), 'Gift can open below 50 words');
    assert(!Array.from(document.querySelectorAll('.trap-letter')).some((letter) => letter.textContent === 'E'), 'E is available before the gift');
    await enter('calabaza');
    equal(words(), ['calabaza'], 'Calabaza was not accepted');
    assert(document.querySelector('.found-list .special-word'), 'Halloween word was not highlighted');
    const halloweenProgressId = 'special-halloween-2026';
    await flushPendingWrites();
    flushSync(() => root.render(<p>Outside app</p>));
    const almostGift = initialSolutions.filter((word) => word !== 'calabaza').slice(0, 49);
    await db.put('progress_classic', { id: halloweenProgressId, foundWords: almostGift, completed: false, score: 0, superHeptaWords: [], startedAt: 1700000000000, lastPlayedAt: fixedNow });
    await mountApp();
    click('.menu-btn-special-halloween');
    await until(() => document.querySelector('.btn-play-today'), 'Saved Halloween did not open');
    click('.btn-play-today');
    await ready(halloween.puzzle.title!);
    assert(!document.querySelector('.event-gift-button'), 'Gift can open at 49 words');
    await enter('calabaza');
    await until(() => document.querySelector('.event-gift-button'), 'Gift did not become available at 50 words');
    click('.event-gift-button');
    await until(() => document.querySelector('.event-gift-panel-open'), 'Halloween gift did not open');
    await until(() => document.querySelectorAll('.trap-letter').length === 7, 'Extra E was not added to the board');
    assert(document.querySelector('.counter')?.textContent?.includes('/ 482'), 'Gift did not update total solutions');
    await enter('escoba');
    assert(words().includes('escoba'), 'Escoba was rejected after opening the gift');
    assert(Array.from(document.querySelectorAll('.found-list .special-word')).some((word) => word.textContent?.includes('escoba')), 'Escoba is not highlighted');
    await flushPendingWrites();
    const halloweenSave = await db.get('progress_classic', halloweenProgressId);
    equal(halloweenSave?.exoticLetter, 'e', 'Gift letter was not saved');
    equal(halloweenSave?.foundWords.length, 51, 'Halloween words were lost when unlocking');
    equal(halloweenSave?.startedAt, 1700000000000, 'Halloween start date changed');
    equal(await db.get('progress_classic', motherSave.id), motherSave, 'Halloween modified another event');
    passed.push('Real App: Halloween preserves words and unlocks/saves E at 50, including escoba');

    fixedNow = new RealDate('2026-12-01T12:00:00').getTime();
    await mountApp();
    assert(!document.querySelector('.menu-btn-special-halloween'), 'Expired Halloween still appears on Home');
    click('.menu-btn-events');
    await until(() => Array.from(document.querySelectorAll('.event-card')).some((card) => card.textContent?.includes(halloween.title)), 'Expired started Halloween is missing from Events');
    click('.event-card-halloween');
    await until(() => document.querySelector('.btn-play-today'), 'Expired Halloween detail did not open');
    click('.btn-play-today');
    await ready(halloween.puzzle.title!);
    assert(words().includes('escoba') && document.querySelector('.event-gift-panel-open'), 'Expired Halloween lost its gift or words');
    equal(await db.get('progress_classic', halloweenProgressId), halloweenSave, 'Continuing expired Halloween rewrote the save');
    passed.push('Real App: started Halloween continues after November 30 with its saved reward');

    // Styling must not migrate an existing font preference or recreate daily sessions.
    const playerRecord = await db.get('kv', 'playerState');
    assert(playerRecord, 'Player record missing before preference compatibility check');
    const styledPlayer = { ...playerRecord, value: { ...(playerRecord.value as object), settings: { soundEnabled: false, activeTheme: 'default', activeFont: 'system' } } };
    await db.put('kv', styledPlayer);
    const originalSessions = await db.get('kv', 'dailySessions');
    const pinnedPuzzle = ((await import('../src/data/puzzles.json')).default as Puzzle[]).find((puzzle) => puzzle.id === 'daily-001')!;
    const pinnedSessions = { key: 'dailySessions', value: { 'es-2026-12-01': { dateKey: '2026-12-01', puzzleId: pinnedPuzzle.id, progressId: 'daily-es-2026-12-01' } }, updatedAt: 12345 };
    await db.put('kv', pinnedSessions);
    await mountApp();
    assert(getComputedStyle(document.querySelector('.base-page')!).fontFamily.includes('system-ui'), 'Stored body font was overridden by the new style');
    assert(getComputedStyle(document.querySelector('.top-bar-title')!).fontFamily.includes('Georgia'), 'Approved serif headings are not active');
    equal(await db.get('kv', 'playerState'), styledPlayer, 'Opening the new style rewrote player preferences');
    passed.push('Serif headings preserve the stored body font and player record');
    equal(document.querySelector('.daily-miniature>text')?.textContent, pinnedPuzzle.center.toUpperCase(), 'Home ignores the puzzle pinned in the daily session');
    equal(await db.get('kv', 'dailySessions'), pinnedSessions, 'Home rewrote the existing daily session');
    passed.push('Home miniature follows the saved daily session without writing it');
    await db.put('kv', playerRecord);
    if (originalSessions) await db.put('kv', originalSessions);
    else await db.delete('kv', 'dailySessions');
  } finally {
    window.Date = RealDate;
    db.get = nativeGet;
    db.put = nativePut;
  }

  sessionStorage.setItem('progress-safety-reload', JSON.stringify({
    classic: await db.getAll('progress_classic'), daily: await db.getAll('progress_daily'), kv: await db.getAll('kv'),
  }));
  return { passed };
}

(window as unknown as { progressSafetyResult: Promise<unknown> }).progressSafetyResult = run()
  .catch((error: Error) => ({ error: error.stack ?? error.message }));
