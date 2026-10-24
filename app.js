// One Next Step: turns a brain dump into one calm next action at a time.
// Everything runs in the browser. Nothing leaves the device.
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const STORE_KEY = 'one-next-step:v1';

  // Each recipe turns a kind of task into small, concrete first steps.
  // The first step is always something you can start in under two minutes.
  const RECIPES = [
    { match: /\b(essay|report|write|writing|draft|article|blog|thesis|paper|assignment|homework)\b/,
      steps: ['Open a blank document and type a title',
              'Write three rough bullet points of what you want to say',
              'Turn the first bullet into one paragraph. Messy is fine',
              'Draft the rest, one bullet at a time',
              'Read it once and fix the worst sentence'] },
    { match: /\b(email|e-mail|reply|respond|message|text|dm|write back)\b/,
      steps: ['Open your inbox and find the message',
              'Write one sentence that answers the main question',
              'Add a greeting and a sign-off, then press send'] },
    { match: /\b(call|phone|ring|book|booking|appointment|schedule|reserve|dentist|doctor|gp)\b/,
      steps: ['Find the phone number or booking link',
              'Write down, in one line, what you need to ask for',
              'Make the call or submit the booking'] },
    { match: /\b(clean|tidy|laundry|dishes|wash|vacuum|hoover|declutter|room|kitchen)\b/,
      steps: ['Set a timer and gather what you need',
              'Do the part you can see from where you are standing',
              'Put away ten things, then stop if you want'] },
    { match: /\b(study|revise|revision|read|reading|exam|test|quiz|learn|chapter|lecture|notes)\b/,
      steps: ['Open the material on the first page',
              'Read or work for ten minutes, nothing else open',
              'Close it and write down three things you remember'] },
    { match: /\b(pay|bill|tax|taxes|invoice|form|fill|renew|insurance|bank|rent)\b/,
      steps: ['Find the bill or form and open it',
              'Gather the one number or document it asks for',
              'Fill it in and submit. Save the confirmation'] },
    { match: /\b(apply|application|job|cv|resume|cover letter|interview)\b/,
      steps: ['Open the listing and copy the link somewhere safe',
              'Note the two requirements you match best',
              'Update one section of your CV to mention them',
              'Submit the application'] },
    { match: /\b(buy|shop|shopping|groceries|order|pick up|get)\b/,
      steps: ['Write a list of the must-haves',
              'Open the shop app or grab your bag and keys',
              'Get the list, nothing more'] },
    { match: /\b(code|bug|fix|deploy|build|project|presentation|slides|deck)\b/,
      steps: ['Open the project and find where you left off',
              'Write one sentence describing what "done" looks like today',
              'Do the smallest piece that moves it forward',
              'Save, commit or share what you have'] },
  ];
  const DEFAULT_STEPS = [
    'Write one sentence about what "done" looks like',
    'Do the smallest piece you can finish in five minutes',
    'Keep going, or call it done for today',
  ];

  const URGENT = /\b(today|tonight|now|urgent|asap|overdue|immediately)\b|!/;
  const SOON = /\b(tomorrow|due|deadline|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|this week)\b/;

  let state = load() || fresh();
  let timer = { left: 0, total: 0, id: null };

  function fresh() {
    return { tasks: [], currentId: null, energy: 'medium', minutes: 15, completed: [], screen: 'dump', dump: '' };
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* private mode: keep going in memory */ }
  }

  function tidyTitle(line) {
    const t = line.replace(/^[\s\-*•\d.)\]]+/, '').replace(/\[\s?\]/, '').trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function buildTask(line, i) {
    const title = tidyTitle(line);
    const lower = title.toLowerCase();
    const recipe = RECIPES.find((r) => r.match.test(lower));
    const short = title.length > 48 ? title.slice(0, 45) + '…' : title;
    const steps = (recipe ? recipe.steps : DEFAULT_STEPS).map((s) => ({ text: s.replace('{t}', short), depth: 0 }));
    const urgency = URGENT.test(lower) ? 2 : SOON.test(lower) ? 1 : 0;
    return { id: 't' + Date.now().toString(36) + i, title, steps, stepIndex: 0, done: false, skips: 0, urgency, order: i };
  }

  // Choose the one task to work on now, and say why in plain words.
  function pickTask() {
    const open = state.tasks.filter((t) => !t.done);
    if (!open.length) return null;
    const left = (t) => t.steps.length - t.stepIndex;
    const score = (t) => {
      let s = t.urgency * 10 - t.skips * 15 - t.order * 0.1;
      if (state.energy === 'low') s -= left(t) * 3;       // low energy: quick wins first
      if (state.energy === 'high') s += left(t) * 1.5;    // plenty of energy: tackle the big one
      return s;
    };
    return open.slice().sort((a, b) => score(b) - score(a))[0];
  }

  function reasonFor(task) {
    const left = task.steps.length - task.stepIndex;
    if (task.stepIndex > 0) return 'You already have momentum here. Keep it going.';
    if (task.urgency === 2) return 'This one sounds urgent, so it goes first.';
    if (task.urgency === 1) return 'This one has a deadline coming up.';
    if (state.energy === 'low') return `Low energy is fine. This is a quick win, about ${left} small steps.`;
    if (state.energy === 'high') return 'You have energy, so start with the biggest thing.';
    return 'A good place to start. The rest can wait.';
  }

  // ---------- rendering ----------
  function show(name) {
    state.screen = name;
    for (const s of ['dump', 'focus', 'done']) $('screen-' + s).hidden = s !== name;
    save();
  }

  function announce(msg) {
    const live = $('live');
    live.textContent = '';
    setTimeout(() => { live.textContent = msg; }, 50);
  }

  function renderFocus(focusHeading = true) {
    const task = state.tasks.find((t) => t.id === state.currentId && !t.done) || pickTask();
    if (!task) return renderDone();
    const isNewTask = task.id !== state.currentId;
    state.currentId = task.id;
    const step = task.steps[task.stepIndex];

    show('focus');
    $('task-name').textContent = task.title;
    $('step-text').textContent = step.text;
    $('why').textContent = step.depth > 0 ? 'Smaller is better. You only need to start.' : reasonFor(task);

    const total = state.tasks.reduce((n, t) => n + t.steps.length, 0);
    const done = state.completed.length;
    const doneTasks = state.tasks.filter((t) => t.done).length;
    $('progress-bar').style.width = Math.round((done / Math.max(total, 1)) * 100) + '%';
    $('progress-label').textContent = `${done} ${done === 1 ? 'step' : 'steps'} done · ${doneTasks} of ${state.tasks.length} tasks finished`;

    renderPeek();
    resetTimer();
    save();
    if (focusHeading) $('step-text').focus();
    announce(`${isNewTask ? 'Next task: ' + task.title + '. ' : ''}Next step: ${step.text}`);
  }

  function renderPeek() {
    const ol = $('peek-list');
    ol.innerHTML = '';
    for (const t of state.tasks) {
      const li = document.createElement('li');
      li.textContent = t.title + (t.done ? ' (done)' : '');
      if (t.done) li.className = 'done';
      if (t.id === state.currentId) { li.className = 'current'; li.setAttribute('aria-current', 'step'); }
      ol.appendChild(li);
    }
  }

  function renderDone() {
    stopTimer();
    show('done');
    const n = state.completed.length;
    $('done-summary').textContent = `You finished ${n} small ${n === 1 ? 'step' : 'steps'} across ${state.tasks.length} ${state.tasks.length === 1 ? 'task' : 'tasks'}. That counts.`;
    const ul = $('done-list');
    ul.innerHTML = '';
    for (const t of state.tasks) {
      const li = document.createElement('li');
      li.textContent = t.title;
      ul.appendChild(li);
    }
    $('done-title').focus();
    announce('All tasks finished. ' + $('done-summary').textContent);
  }

  // ---------- actions ----------
  function start() {
    const raw = $('dump').value;
    const lines = raw.split(/\n|;/).map((l) => l.trim()).filter((l) => l.replace(/[\W_]/g, '').length > 1);
    if (!lines.length) {
      $('dump-error').textContent = 'Add at least one thing first. Even one word is enough.';
      $('dump').focus();
      return;
    }
    $('dump-error').textContent = '';
    state.dump = raw;
    state.energy = document.querySelector('input[name=energy]:checked').value;
    state.minutes = Number(document.querySelector('input[name=minutes]:checked').value);
    state.tasks = lines.slice(0, 30).map(buildTask);
    state.completed = [];
    state.currentId = null;
    renderFocus();
  }

  function current() { return state.tasks.find((t) => t.id === state.currentId); }

  function done() {
    const task = current();
    if (!task) return;
    state.completed.push({ task: task.title, step: task.steps[task.stepIndex].text });
    task.stepIndex++;
    if (task.stepIndex >= task.steps.length) {
      task.done = true;
      state.currentId = null;
      chime(true);
      announce(`Finished: ${task.title}.`);
    } else {
      chime(false);
    }
    setTimeout(() => renderFocus(), 60);
  }

  function split() {
    const task = current();
    if (!task) return;
    const step = task.steps[task.stepIndex];
    const smaller = step.depth === 0
      ? [{ text: 'Just get set up. Open or grab what you need, nothing more', depth: 1 },
         { text: `Spend two minutes on it. You can stop after that`, depth: 1 },
         { ...step, depth: 1 }]
      : [{ text: 'Do only the first movement: sit where you need to be and look at it', depth: 2 },
         { ...step, depth: 2 }];
    task.steps.splice(task.stepIndex, 1, ...smaller);
    renderFocus();
  }

  function skip() {
    const task = current();
    if (!task) return;
    task.skips++;
    state.currentId = null;
    const open = state.tasks.filter((t) => !t.done);
    if (open.length > 1) {
      // Pick something else, and leave this one for later.
      const others = open.filter((t) => t.id !== task.id);
      const prevSkips = task.skips;
      task.skips = Math.max(prevSkips, ...others.map((t) => t.skips)) + 1;
    }
    announce(`Moved "${task.title}" to later.`);
    renderFocus();
  }

  // ---------- timer ----------
  const CIRC = 339.3;
  function resetTimer() {
    stopTimer();
    timer.total = timer.left = state.minutes * 60;
    paintTimer();
    $('btn-timer').firstChild.textContent = 'Start timer ';
  }
  function stopTimer() { clearInterval(timer.id); timer.id = null; }
  function toggleTimer() {
    if (timer.id) {
      stopTimer();
      $('btn-timer').firstChild.textContent = 'Resume timer ';
      announce('Timer paused.');
      return;
    }
    if (timer.left <= 0) timer.left = timer.total;
    timer.id = setInterval(() => {
      timer.left--;
      paintTimer();
      if (timer.left <= 0) {
        stopTimer();
        chime(true);
        $('btn-timer').firstChild.textContent = 'Start timer ';
        announce('Time is up. Mark it done, or keep going if you are in the flow.');
      }
    }, 1000);
    $('btn-timer').firstChild.textContent = 'Pause timer ';
    announce(`Timer started for ${state.minutes} minutes.`);
  }
  function paintTimer() {
    const m = Math.floor(timer.left / 60), s = timer.left % 60;
    $('timer-text').textContent = `${m}:${String(s).padStart(2, '0')}`;
    $('ring-bar').style.strokeDashoffset = String(CIRC * (1 - timer.left / Math.max(timer.total, 1)));
  }

  // A soft two-note chime. No audio files, and it stays quiet if audio is blocked.
  let audio;
  function chime(big) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const notes = big ? [523.25, 659.25, 783.99] : [659.25];
      notes.forEach((f, i) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = 'sine'; o.frequency.value = f;
        const t0 = audio.currentTime + i * 0.12;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
        o.connect(g).connect(audio.destination);
        o.start(t0); o.stop(t0 + 0.55);
      });
    } catch { /* no audio, no problem */ }
  }

  function speak() {
    if (!('speechSynthesis' in window)) { announce('Read aloud is not available in this browser.'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance($('step-text').textContent);
    u.rate = 0.95;
    speechSynthesis.speak(u);
  }

  function togglePeek() {
    const p = $('peek');
    p.hidden = !p.hidden;
    $('btn-list').setAttribute('aria-expanded', String(!p.hidden));
    $('btn-list').firstChild.textContent = p.hidden ? 'Peek at the list ' : 'Hide the list ';
  }

  function resetAll() {
    stopTimer();
    const keepDump = state.dump;
    state = fresh();
    $('dump').value = keepDump || '';
    $('peek').hidden = true;
    show('dump');
    $('dump').focus();
    announce('Back to the brain dump.');
  }

  // ---------- wiring ----------
  $('btn-start').addEventListener('click', start);
  $('btn-done').addEventListener('click', done);
  $('btn-split').addEventListener('click', split);
  $('btn-skip').addEventListener('click', skip);
  $('btn-timer').addEventListener('click', toggleTimer);
  $('btn-speak').addEventListener('click', speak);
  $('btn-list').addEventListener('click', togglePeek);
  $('btn-reset').addEventListener('click', resetAll);
  $('btn-again').addEventListener('click', () => { state.dump = ''; resetAll(); });
  $('btn-help').addEventListener('click', () => $('help').showModal());

  document.addEventListener('keydown', (e) => {
    const typing = e.target.matches('textarea, input[type=text]');
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && state.screen === 'dump') { e.preventDefault(); start(); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey || $('help').open) return;
    if (e.key === '?') { e.preventDefault(); $('help').showModal(); return; }
    if (state.screen !== 'focus') return;
    const map = { d: done, s: split, n: skip, t: toggleTimer, r: speak, l: togglePeek };
    const fn = map[e.key.toLowerCase()];
    if (fn) { e.preventDefault(); fn(); }
  });

  // Restore where the person left off.
  $('dump').value = state.dump || '';
  const setRadio = (name, v) => { const el = document.querySelector(`input[name=${name}][value="${v}"]`); if (el) el.checked = true; };
  setRadio('energy', state.energy);
  setRadio('minutes', state.minutes);
  if (state.screen === 'focus' && state.tasks.some((t) => !t.done)) renderFocus(false);
  else if (state.screen === 'done' && state.tasks.length) renderDone();
  else show('dump');
})();
