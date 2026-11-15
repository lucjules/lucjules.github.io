/* Intro système : l'application (navigation, terminal interactif, exercices, ateliers, mémo, révision). */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const Store = {
  key: 'intro-systeme-v2',
  data: { done: {}, lessons: {} },
  load() { try { const s = localStorage.getItem(this.key); if (s) Object.assign(this.data, JSON.parse(s)); } catch (e) { /* indisponible */ } },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* indisponible */ } }
};
Store.load();
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const LESSON = id => LESSONS.find(l => l.id === id);
const ORDER = LESSONS.map(l => l.id);
const NAV = PARTS.map(p => ({ group: `${p.td} · ${p.title}`, items: LESSONS.filter(l => l.part === p.id).map(l => ({ id: l.id, label: l.title, n: ORDER.indexOf(l.id) + 1 })) }))
  .concat([{ group: 'Outils', items: [{ id: 'terminal', label: 'Terminal', n: '$' }, { id: 'memo', label: 'Aide-mémoire', n: '≡' }, { id: 'fiche', label: 'Fiche recto verso (contrôle)', n: '⎙' }, { id: 'revision', label: 'Interro blanche (TD 5)', n: '?' }] }]);
const ALL_IDS = ['accueil', ...NAV.flatMap(g => g.items.map(i => i.id))];

/* ================================================================== TERMINAL */
function mountTerm(host, shell, opts) {
  opts = opts || {};
  host.innerHTML = `<div class="term"><div class="term-out" aria-live="polite" tabindex="0" role="log" aria-label="Sortie du terminal"></div><form class="term-in"><label class="prompt"></label><input class="term-input" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="Commande"></form>
  <div class="keybar" role="group" aria-label="Touches spéciales"><button type="button" data-k="tab">Tab</button><button type="button" data-k="up" aria-label="Commande précédente">↑</button><button type="button" data-k="down" aria-label="Commande suivante">↓</button><button type="button" data-k="C">Ctrl+C</button><button type="button" data-k="Z">Ctrl+Z</button><button type="button" data-k="L">Ctrl+L</button></div></div>`;
  const out = $('.term-out', host), form = $('.term-in', host), input = $('.term-input', host), pr = $('.prompt', host);
  const T = { shell, out, input, hist: 0, lastTab: '' };
  const sync = () => { pr.textContent = shell.busy ? '' : shell.prompt() + ' '; input.placeholder = shell.busy ? 'occupé : Ctrl+C ou Ctrl+Z' : ''; };
  T.sync = sync;
  T.print = html => { out.insertAdjacentHTML('beforeend', html); out.scrollTop = out.scrollHeight; };
  const show = r => {
    r.chunks.forEach(k => {
      if (k.k === 'out') T.print(`<div class="t-out">${termHTML(k.s)}</div>`);
      else if (k.k === 'err') T.print(`<div class="t-err">${esc(k.s)}</div>`);
      else T.print(`<div class="t-out t-hint">ⓘ ${esc(k.s)}</div>`);
    });
  };
  T.exec = line => {
    T.print(`<div class="t-echo">${esc(shell.prompt())} ${esc(line)}</div>`);
    const r = shell.run(line);
    if (shell.cleared) { out.innerHTML = ''; shell.cleared = false; }
    show(r);
    if (shell.busy) T.print(`<div class="t-out t-hint">⏳ ${esc(shell.busy.cmd)} occupe le terminal : Ctrl+C pour l'arrêter, Ctrl+Z pour le suspendre.</div>`);
    sync();
    if (opts.onRun) opts.onRun(line, r);
    if (opts.save) opts.save(out.innerHTML);
  };
  T.key = k => {
    if (k === 'L') { out.innerHTML = ''; return; }
    if (shell.busy) { T.print(`<div class="t-out">${esc(shell.key(k))}</div>`); sync(); if (opts.onRun) opts.onRun('^' + k); if (opts.save) opts.save(out.innerHTML); return; }
    if (k === 'C') { T.print(`<div class="t-echo">${esc(shell.prompt())} ${esc(input.value)}^C</div>`); input.value = ''; }
  };
  T.runAll = async cmds => { for (const cmd of cmds) { if (/^\^[CZ]$/.test(cmd)) T.key(cmd[1]); else T.exec(cmd); await new Promise(r => setTimeout(r, 90)); } };
  const histMove = d => {
    const h = shell.history;
    if (!h.length) return;
    T.hist = Math.max(0, Math.min(T.hist + d, h.length));
    input.value = T.hist ? h[h.length - T.hist] : '';
  };
  const tab = () => {
    const r = shell.complete(input.value);
    if (r.options.length > 1 && T.lastTab === input.value) T.print(`<div class="t-out t-hint">${r.options.map(esc).join('  ')}</div>`);
    input.value = r.line; T.lastTab = input.value;
  };
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (shell.busy) { input.value = ''; return; }
    const v = input.value; input.value = ''; T.hist = 0;
    if (!v.trim()) { T.print(`<div class="t-echo">${esc(shell.prompt())}</div>`); return; }
    T.exec(v);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') { histMove(1); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { histMove(-1); e.preventDefault(); }
    else if (e.key === 'Tab') { tab(); e.preventDefault(); }
    else if (e.ctrlKey && !e.shiftKey && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === 'c') { T.key('C'); e.preventDefault(); }
      else if (k === 'z') { T.key('Z'); e.preventDefault(); }
      else if (k === 'l') { T.key('L'); e.preventDefault(); }
      else if (k === 'a') { input.setSelectionRange(0, 0); e.preventDefault(); }
      else if (k === 'e') { const n = input.value.length; input.setSelectionRange(n, n); e.preventDefault(); }
      else if (k === 'u') { input.value = input.value.slice(input.selectionStart); input.setSelectionRange(0, 0); e.preventDefault(); }
      else if (k === 'k') { input.value = input.value.slice(0, input.selectionStart); e.preventDefault(); }
      else if (k === 'w') { const p = input.selectionStart, b = input.value.slice(0, p).replace(/\S+\s*$/, ''); input.value = b + input.value.slice(p); input.setSelectionRange(b.length, b.length); e.preventDefault(); }
      else if (k === 'd' && !input.value) { T.exec('exit'); e.preventDefault(); }
    }
  });
  $('.keybar', host).addEventListener('click', e => {
    const b = e.target.closest('[data-k]'); if (!b) return;
    const k = b.dataset.k;
    if (k === 'tab') tab(); else if (k === 'up') histMove(1); else if (k === 'down') histMove(-1); else T.key(k);
    input.focus({ preventScroll: true });
  });
  host.addEventListener('click', e => { if (e.target.closest('.keybar')) return; if (!e.target.closest('.term-out') || !getSelection().toString()) input.focus({ preventScroll: true }); });
  sync();
  return T;
}
const newShell = o => {
  const s = new Sh.Shell(o.seed || 'standard');
  (o.pre || []).forEach(p => s.run(p, { inner: true }));
  if (o.cwd || o.start) s.run('cd ' + (o.cwd || o.start), { inner: true });
  return s;
};

/* Terminal de la page « Terminal » : son état est gardé quand on change de page */
const Main = { shell: new Sh.Shell('standard'), html: '', seed: 'standard', term: null };
function pageTerminal() {
  return `<article class="page wide">
  <p class="kicker">Outil</p>
  <h1>Terminal simulé</h1>
  <p class="lead">Un petit Linux dans ton navigateur, avec de vrais droits, des utilisateurs (alice, bob, root), des tubes, des archives… Tape <code>help</code> pour la liste des commandes et <code>man commande</code> pour le détail. Rien n'est risqué.</p>
  <div class="at-bar"><label>Dossier de départ <select id="seed-sel"><option value="standard">Standard</option><option value="perms">Droits à corriger</option><option value="empty">Vide</option></select></label>
  <button type="button" class="btn ghost" data-app="term-reset">Réinitialiser</button></div>
  <div id="main-term" class="term-box"></div>
  <p class="note-line">Les messages d'erreur sont en anglais, comme sur un vrai système : « Permission denied » = tu n'as pas le droit, « No such file or directory » = ce chemin n'existe pas.</p>
  <h2>Idées pour t'entraîner</h2>
  <ul><li><code>ls -la</code>, <code>tree</code>, <code>cat Documents/cours.txt | grep Semaine</code></li><li><code>su bob</code> puis <code>ls /home/alice</code> (et <code>exit</code>)</li><li><code>cd Projets/tp1 && javac Bonjour.java && java Bonjour</code></li><li><code>tar -czvf sauvegarde.tgz Documents</code>, puis <code>tar -tzf sauvegarde.tgz</code></li><li><code>sleep 100</code>, puis Ctrl+Z, <code>jobs</code>, <code>bg</code>, <code>kill %1</code></li></ul>
</article>`;
}
function mountTerminal() {
  const sel = $('#seed-sel'); sel.value = Main.seed;
  const start = reset => {
    if (reset) { Main.shell = new Sh.Shell(Main.seed); Main.html = ''; }
    Main.term = mountTerm($('#main-term'), Main.shell, { save: h => { Main.html = h; } });
    Main.term.out.innerHTML = Main.html || '<div class="t-out t-hint">Bienvenue ! Essaie : <b>ls -l</b>, puis <b>help</b>.</div>';
    Main.term.sync();
  };
  sel.addEventListener('change', () => { Main.seed = sel.value; start(true); });
  start(false);
  Main.term.input.focus({ preventScroll: true });
}

/* ================================================================== EXERCICES */
const TASKS = {};
function exHead(k, done) { return `<header class="ex-h"><span class="ex-kind">${k}</span><span class="ex-badge" ${done ? '' : 'hidden'}>✓ Réussi</span></header>`; }
function exercise(id) {
  const def = EX[id]; const done = !!Store.data.done[id];
  if (!def) return '';
  if (def.type === 'qcm') {
    return `<section class="ex ex-qcm${done ? ' is-done' : ''}" data-ex="${id}">${exHead('Question', done)}
  <p class="ex-q">${esc(def.q)}</p>
  <div class="choices" role="group" aria-label="Réponses">${qOrder(def.choices).map(i => `<button type="button" class="choice" data-act="qcm" data-i="${i}"><span class="mark" aria-hidden="true"></span><span class="ct">${def.codeChoices ? `<code>${esc(def.choices[i])}</code>` : esc(def.choices[i])}</span></button>`).join('')}</div>
  <p class="ex-fb" role="status"></p></section>`;
  }
  if (def.type === 'shell') {
    const sol = def.solution.map(s => (/^\^[CZ]$/.test(s) ? '(touche Ctrl+' + s[1] + ')' : '$ ' + s)).join('\n');
    return `<section class="ex ex-shell${done ? ' is-done' : ''}" data-ex="${id}">${exHead('À toi de taper', done)}
  <h4 class="ex-title">${esc(def.title)}</h4>
  <p class="ex-q">${esc(def.prompt)}</p>
  <div class="task-term"></div>
  <div class="ex-actions"><button type="button" class="btn" data-act="sh-check">Vérifier</button>
  <button type="button" class="btn ghost" data-act="hint">Indice</button>
  <button type="button" class="btn ghost" data-act="sol">Solution</button>
  <button type="button" class="btn ghost" data-act="sh-reset">Recommencer</button></div>
  <p class="hint" hidden>${esc(def.hint)}</p>
  <div class="sol" hidden><p>Une solution possible :</p>${sh(sol)}</div>
  <p class="ex-fb" role="status"></p></section>`;
  }
  if (def.type === 'cmd') {
    return `<section class="ex ex-cmd${done ? ' is-done' : ''}" data-ex="${id}">${exHead('Écris la commande', done)}
  <p class="ex-q">${esc(def.q)}</p>
  <form class="drill-form" data-act-form="cmd"><span class="cmd-pr" aria-hidden="true">$</span><input class="drill-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Ta commande"><button class="btn" type="submit">Vérifier</button></form>
  <div class="ex-actions"><button type="button" class="btn ghost" data-act="sol">Solution</button></div>
  <div class="sol" hidden>${sh('$ ' + def.sol)}<p>${esc(def.why)}</p></div>
  <div class="cmd-out"></div>
  <p class="ex-fb" role="status"></p></section>`;
  }
  if (def.type === 'drill') {
    return `<section class="ex ex-drill${done ? ' is-done' : ''}" data-ex="${id}" data-kind="${def.kind}" data-need="${def.need}">${exHead('Entraînement', done)}<div class="drill-host"></div></section>`;
  }
  return '';
}
function markDone(id) {
  if (!Store.data.done[id]) { Store.data.done[id] = 1; Store.save(); }
  const sec = $(`[data-ex="${id}"]`);
  if (sec) { sec.classList.add('is-done'); const b = $('.ex-badge', sec); if (b) b.hidden = false; }
  window.updateProgress();
}
function setFb(sec, text, cls) { const fb = $('.ex-fb', sec); if (fb) { fb.textContent = text; fb.className = 'ex-fb ' + (cls || ''); } }
function startTask(sec) {
  const id = sec.dataset.ex, def = EX[id];
  const shell = newShell(def);
  shell.log = []; shell.history = []; shell.outLog = []; shell.ranScript = new Set();
  const t = mountTerm($('.task-term', sec), shell);
  TASKS[id] = t;
  t.print(`<div class="t-out t-hint">${def.start ? 'Tu es dans ~/' + esc(def.start) + '. ' : ''}Tape tes commandes ici, puis clique sur Vérifier.</div>`);
}
/* Commande à écrire : on l'exécute dans un terminal neuf */
function checkCmd(sec, v) {
  const def = EX[sec.dataset.ex];
  const norm = s => s.trim().replace(/\s+/g, ' ');
  v = norm(v);
  const box = $('.cmd-out', sec);
  box.innerHTML = '';
  let ok;
  if (def.accept) ok = def.accept.some(re => re.test(v));
  else {
    const s = newShell(def);
    const r = s.run(v);
    box.innerHTML = `<pre class="cmd-res">${termHTML(r.out)}${r.err ? `<span class="t-err">${esc(r.err)}</span>` : ''}</pre>`;
    if (def.test) ok = !!def.test(s, r);
    else { const s2 = newShell(def); const r2 = s2.run(def.sol); ok = Sh.strip(r.out) === Sh.strip(r2.out) && !r.err; }
  }
  setFb(sec, ok ? 'Exact. ' + def.why : 'Pas encore. ' + (def.accept ? 'Relis la syntaxe dans la leçon.' : 'Compare le résultat avec ce qui est demandé.'), ok ? 'ok' : 'ko');
  if (ok) markDone(sec.dataset.ex);
}

/* ================================================================== ENTRAÎNEMENTS (séries) */
const MODES = ['rwx', 'rw-', 'r-x', 'r--', '-wx', '-w-', '--x', '---'];
const randStr = () => { let s = ''; for (let i = 0; i < 3; i++) s += pick(i === 0 ? ['rwx', 'rw-', 'r-x', 'r--'] : MODES); return s; };
const strToMode = s => { let m = 0; for (let i = 0; i < 9; i++) if (s[i] !== '-') m |= 1 << (8 - i); return m; };
const normStr = v => { v = v.trim(); return v.length === 10 && /^[-dl]/.test(v) ? v.slice(1) : v; };
const DRILLS = {
  who() {
    const s = randStr(), who = rnd(3), r = rnd(3);
    const names = ['le propriétaire', 'le groupe', 'les autres'], rights = ['lire', 'modifier', 'exécuter'];
    const truth = s[who * 3 + r] !== '-';
    return { q: `Avec les droits <code>-${s}</code> sur un fichier, ${names[who]} peut-il ${rights[r]} ce fichier ?`, bool: true, ok: v => (v === 'vrai') === truth, show: truth ? 'Oui' : 'Non', why: `Regarde le bloc de ${names[who]} : ${s.slice(who * 3, who * 3 + 3)}.` };
  },
  sym() {
    const start = pick([0o644, 0o755, 0o600, 0o640, 0o700, 0o444, 0o750]);
    const who = pick(['u', 'g', 'o', 'a', 'go', 'ug']), op = pick(['+', '-', '=']), rt = pick(['r', 'w', 'x', 'rw', 'rx', 'wx', 'rwx']);
    const spec = who + op + rt, res = Sh.applyMode(spec, start, false, 0o022);
    const rs = Sh.modeStr('-', res).slice(1);
    return { q: `Un fichier est en <code>${Sh.modeStr('-', start)}</code> (${Sh.octStr(start)}). Que devient-il après <code>chmod ${spec}</code> ?`, ph: 'ex : rw-r--r-- ou 644', ok: v => { v = normStr(v); return v === rs || v === Sh.octStr(res); }, show: `${rs} (${Sh.octStr(res)})`, why: 'Applique la lettre à chaque catégorie visée : + ajoute, - retire, = remplace tout.' };
  },
  str2oct() {
    const s = randStr(); const o = Sh.octStr(strToMode(s));
    return { q: `Convertis <code>${s}</code> en notation octale (3 chiffres).`, ph: 'ex : 754', ok: v => v.trim() === o, show: o, why: 'r=4, w=2, x=1 : additionne pour chaque bloc de trois.' };
  },
  oct2str() {
    const o = pick(['755', '644', '600', '640', '750', '700', '444', '666', '754', '711', '555', '620', '751', '604']);
    const s = Sh.modeStr('-', parseInt(o, 8)).slice(1);
    return { q: `Convertis <code>${o}</code> en chaîne de droits (rwx).`, ph: 'ex : rwxr-xr-x', ok: v => normStr(v) === s, show: s, why: 'Chaque chiffre donne un bloc : 7=rwx, 6=rw-, 5=r-x, 4=r--, 0=---.' };
  },
  umask() {
    const u = pick(['022', '027', '077', '002', '007', '037', '026', '033', '017']), um = parseInt(u, 8), dir = rnd(2) === 1;
    const o = Sh.octStr((dir ? 0o777 : 0o666) & ~um);
    return { q: `Avec <code>umask ${u}</code>, quels droits (en octal) reçoit un nouveau ${dir ? 'répertoire' : 'fichier'} ?`, ph: 'ex : 644', ok: v => v.trim() === o, show: o, why: `On part de ${dir ? '777 (rwxrwxrwx)' : '666 (rw-rw-rw-)'} et on retire les droits présents dans ${u} (${Sh.modeStr('-', um).slice(1)}), bloc par bloc : ce n'est pas une soustraction.` };
  },
  path() {
    const dirs = ['/home/etudiant', '/home/etudiant/Documents', '/home/etudiant/Projets/tp1', '/tmp', '/home'];
    const cwd = pick(dirs);
    const rels = ['..', '../..', '.', 'Documents', '../Documents', '~/Projets', '../../tmp', '/etc', './tp1', '~', '../alice'];
    const rel = pick(rels);
    const s = new Sh.Shell('standard');
    const parts = rel === '~' || rel.startsWith('~/') ? s.normalize(rel) : s.normalize(rel, cwd.split('/').filter(Boolean));
    const res = '/' + parts.join('/');
    return { q: `Tu es dans <code>${cwd}</code>. Après <code>cd ${rel}</code>, où es-tu ? (chemin absolu)`, ph: 'ex : /home/etudiant', ok: v => v.trim().replace(/(.)\/$/, '$1') === res, show: res, why: '.. remonte d\'un niveau, ~ est /home/etudiant, un chemin qui commence par / part de la racine. (On ne vérifie pas ici que le répertoire existe.)' };
  },
  glob() {
    const cases = [['*.txt', ['notes.txt', 'notes.txt.bak', '.cache.txt', 'txt']], ['?.java', ['A.java', 'AB.java', '.java', 'a.java']], ['[A-Z]*', ['Bonjour.java', 'bonjour.java', 'Zebre', '1A']], ['*[0-9]', ['tp1', 'tp10', 'tp', 'tp1.c']], ['[!a-m]*', ['notes', 'cours', 'Zoo', 'zoo']], ['tp?', ['tp1', 'tp', 'tp12', 'TP1']], ['*x*', ['xdupont', 'bxavier', 'max', 'dupont']], ['?[a-e]*', ['amartin', 'cdubois', 'xmartin', 'abernard']], ['*.[ch]', ['main.c', 'main.h', 'main.cpp', 'main.ch']], ['[0-9]*', ['2to3', '7z', 'a7', 'x2']]];
    const [pat, names] = pick(cases), name = pick(names);
    const truth = Sh.globMatch(pat, name);
    return { q: `Le nom <code>${esc(name)}</code> correspond-il au motif <code>${esc(pat)}</code> ?`, bool: true, ok: v => (v === 'vrai') === truth, show: truth ? 'Oui' : 'Non', why: '* = n\'importe quelle chaîne, ? = exactement un caractère, [..] = un caractère de l\'ensemble, [!..] = sauf ; un nom caché (.xxx) n\'est pris que si le motif commence par un point.' };
  },
  utf8() {
    const ch = pick(['a', 'Z', '7', ' ', 'é', 'ç', 'ñ', 'ß', '€', '→', 'ø', 'π', '中', '😀', '@', 'Ω', '♥']);
    const n = Sh.utf8(ch).length, cp = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
    return { q: `Combien d'octets occupe <code>${esc(ch === ' ' ? '(espace)' : ch)}</code> (U+${cp}) en UTF-8 ?`, ph: '1, 2, 3 ou 4', ok: v => v.trim() === String(n), show: String(n), why: 'U+0000-007F : 1 octet ; U+0080-07FF : 2 ; U+0800-FFFF : 3 ; au-delà : 4.' };
  },
  acl() {
    const e = pick(['rwx', 'rw-', 'r-x', 'r--', '-wx']), m = pick(['rwx', 'r-x', 'rw-', 'r--', '---', '-w-']);
    const res = Sh.rwx(strToMode('------' + e) & strToMode('------' + m));
    return { q: `Une ACL donne <code>user:alice:${e}</code> et le masque vaut <code>mask::${m}</code>. Quel est le droit effectif d'alice ?`, ph: 'ex : r--', ok: v => v.trim() === res, show: res, why: 'Effectif = les droits présents à la fois dans l\'entrée et dans le masque.' };
  }
};
function mountDrill(host, kind, need, onDone, title) {
  let streak = 0, cur = null, answered = false;
  const render = () => {
    cur = DRILLS[kind](); answered = false;
    host.innerHTML = `${title ? `<h4 class="ex-title">${esc(title)}</h4>` : ''}<p class="ex-q">${cur.q}</p>
    ${cur.bool ? `<div class="bool-btns" role="group"><button type="button" class="choice" data-d="vrai"><span class="mark"></span>Oui</button><button type="button" class="choice" data-d="faux"><span class="mark"></span>Non</button></div>`
      : `<form class="drill-form"><input class="drill-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(cur.ph)}" aria-label="Ta réponse"><button class="btn" type="submit">Valider</button></form>`}
    <p class="ex-fb" role="status"></p>
    <p class="streak" aria-live="polite">Série : <strong>${streak}</strong> / ${need}</p>`;
  };
  const answer = v => {
    if (answered) return; answered = true;
    const ok = cur.ok(v);
    streak = ok ? streak + 1 : 0;
    const fb = $('.ex-fb', host);
    fb.className = 'ex-fb ' + (ok ? 'ok' : 'ko');
    fb.textContent = ok ? 'Juste !' : `Pas tout à fait : ${cur.show}. ${cur.why}`;
    $('.streak', host).innerHTML = `Série : <strong>${streak}</strong> / ${need}`;
    if (streak >= need) { fb.textContent = 'Série complète, bravo !'; if (onDone) onDone(); }
    const nxt = document.createElement('button'); nxt.type = 'button'; nxt.className = 'btn ghost'; nxt.textContent = 'Question suivante'; nxt.onclick = render; fb.after(nxt); nxt.focus();
    $$('.choice, .drill-in', host).forEach(x => { x.disabled = true; });
    const sb = $('.drill-form .btn', host); if (sb) sb.disabled = true;
  };
  host.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) answer(b.dataset.d); });
  host.addEventListener('submit', e => { e.preventDefault(); const i = $('.drill-in', host); if (i && i.value.trim()) answer(i.value); });
  render();
}

/* ================================================================== ATELIERS */
function mountPermLab(host) {
  let isDir = false, m = 0o754;
  const rows = ['Propriétaire (u)', 'Groupe (g)', 'Autres (o)'], cols = ['r lire', 'w écrire', 'x exécuter'];
  const explain = () => {
    const names = ['Le propriétaire', 'Le groupe', 'Les autres'];
    const vr = isDir ? ['lister le contenu', 'créer, renommer ou supprimer dedans', 'entrer dedans (cd)'] : ['lire le fichier', 'le modifier', "l'exécuter"];
    return names.map((n, i) => { const b = (m >> ((2 - i) * 3)) & 7; const l = vr.filter((_, j) => b & (4 >> j)); return `${n} : ${l.length ? 'peut ' + l.join(', ') : 'aucun droit'}.`; }).join(' ');
  };
  const draw = () => {
    host.innerHTML = `<h4 class="ex-title">Laboratoire de permissions</h4>
    <div class="seg" role="group" aria-label="Type"><button type="button" data-t="f" aria-pressed="${!isDir}">Fichier</button><button type="button" data-t="d" aria-pressed="${isDir}">Répertoire</button></div>
    <div class="pl-grid" role="group" aria-label="Droits"><span></span>${cols.map(x => `<strong class="pl-h">${x}</strong>`).join('')}
    ${rows.map((r, i) => `<span class="pl-r">${r}</span>${[0, 1, 2].map(j => { const bit = 1 << (8 - i * 3 - j); return `<label class="pl-c"><input type="checkbox" data-b="${bit}" ${m & bit ? 'checked' : ''} aria-label="${r} ${cols[j]}"><i></i></label>`; }).join('')}`).join('')}</div>
    <div class="pl-out">
      <div><span>ls -l</span><code>${Sh.modeStr(isDir ? 'd' : '-', m)}</code></div>
      <div><span>Octal</span><code>${Sh.octStr(m)}</code></div>
      <div><span>Commande</span><code>chmod ${Sh.octStr(m)} ${isDir ? 'dossier' : 'fichier.txt'}</code></div>
      <div><span>Symbolique</span><code>chmod ${Sh.symStr(m)} ${isDir ? 'dossier' : 'fichier.txt'}</code></div>
    </div><p class="pl-fr">${explain()}</p>`;
  };
  host.addEventListener('change', e => { const cb = e.target.closest('[data-b]'); if (!cb) return; m = cb.checked ? m | +cb.dataset.b : m & ~+cb.dataset.b; draw(); const f = $(`[data-b="${cb.dataset.b}"]`, host); if (f) f.focus(); });
  host.addEventListener('click', e => { const t = e.target.closest('[data-t]'); if (!t) return; isDir = t.dataset.t === 'd'; draw(); });
  draw();
}
function mountGlobLab(host) {
  const NAMES = ['notes.txt', 'rapport.txt', 'notes.txt.bak', '.bashrc', 'Bonjour.java', 'Erreur.java', 'Main.class', 'hello.cpp', 'a.out', 'tp1', 'tp2', 'tp10', 'vacances1.jpg', 'vacances10.jpg', 'IMG_2024.jpg', 'plage.png', 'Makefile', 'script.sh', '2to3', 'xdupont', 'amartin', 'bxavier'];
  host.innerHTML = `<h4 class="ex-title">Laboratoire des jokers</h4>
  <form class="drill-form glob-form"><span class="cmd-pr" aria-hidden="true">echo</span><input class="drill-in" type="text" value="*.java" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Motif"></form>
  <p class="glob-sum" aria-live="polite"></p><ul class="glob-list">${NAMES.map(n => `<li data-n="${esc(n)}"><code>${esc(n)}</code></li>`).join('')}</ul>
  <p class="muted">Idées : <code>*.txt</code>, <code>tp?</code>, <code>tp*</code>, <code>[A-Z]*</code>, <code>*[0-9]*</code>, <code>[!a-m]*</code>, <code>.*</code>, <code>?[a-e]*</code></p>`;
  const inp = $('.drill-in', host);
  const upd = () => {
    const p = inp.value.trim();
    let n = 0;
    $$('li', host).forEach(li => { const hit = !!p && Sh.globMatch(p, li.dataset.n); li.classList.toggle('hit', hit); if (hit) n++; });
    $('.glob-sum', host).innerHTML = p ? (n ? `<strong>${n}</strong> nom${n > 1 ? 's' : ''} correspond${n > 1 ? 'ent' : ''} : le shell remplace <code>${esc(p)}</code> par ${n > 1 ? 'ces noms' : 'ce nom'}.` : `Aucun nom ne correspond : le shell laisse <code>${esc(p)}</code> tel quel.`) : '';
  };
  inp.addEventListener('input', upd);
  host.addEventListener('submit', e => e.preventDefault());
  upd();
}
function mountEncLab(host) {
  host.innerHTML = `<h4 class="ex-title">Laboratoire d'encodage</h4>
  <form class="drill-form enc-form"><input class="drill-in" type="text" value="été €" aria-label="Texte à encoder" autocomplete="off" spellcheck="false"></form>
  <div class="enc-out"></div>`;
  const inp = $('.drill-in', host);
  const hex = a => a.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  const bin = a => a.map(b => b.toString(2).padStart(8, '0')).join(' ');
  const upd = () => {
    const chars = [...inp.value].slice(0, 12);
    const u8 = Sh.utf8(inp.value);
    const latin = [...inp.value].every(ch => ch.codePointAt(0) < 256);
    const asLatin1 = u8.map(b => String.fromCharCode(b)).join('');
    host.querySelector('.enc-out').innerHTML = chars.length ? tbl(['Caractère', 'Unicode', 'UTF-8 (hexa)', 'UTF-8 (binaire)', 'Latin-1'],
      chars.map(ch => { const cp = ch.codePointAt(0), b = Sh.utf8(ch); return [`<code>${esc(ch === ' ' ? '␠' : ch)}</code>`, 'U+' + cp.toString(16).toUpperCase().padStart(4, '0'), `<code>${hex(b)}</code> <small>(${b.length} octet${b.length > 1 ? 's' : ''})</small>`, `<code class="bits">${bin(b)}</code>`, cp < 256 ? `<code>${hex([cp])}</code>` : '<em>impossible</em>']; })) +
      `<p><strong>${[...inp.value].length}</strong> caractère(s) = <strong>${u8.length}</strong> octet(s) en UTF-8${latin ? `, <strong>${[...inp.value].length}</strong> en Latin-1` : ' (pas codable en Latin-1)'}.</p>` +
      (u8.some(b => b > 127) ? `<p>Lu par erreur comme du Latin-1, ce texte UTF-8 s'afficherait : <code class="moj">${esc(asLatin1.replace(/[\x80-\x9f]/g, '·'))}</code></p>` : '') : '';
  };
  inp.addEventListener('input', upd);
  host.addEventListener('submit', e => e.preventDefault());
  upd();
}
/* « Essayer ici » : un terminal sous l'exemple, avec les mêmes commandes rejouées */
function tryHere(btn) {
  const fig = btn.closest('figure');
  const o = JSON.parse(btn.dataset.try);
  let box = fig.nextElementSibling;
  if (!box || !box.classList.contains('try-box')) {
    box = document.createElement('div'); box.className = 'term-box try-box'; fig.after(box);
  }
  const shell = newShell(o);
  const t = mountTerm(box, shell);
  t.print('<div class="t-out t-hint">Terminal neuf : les commandes de l\'exemple sont rejouées, puis à toi.</div>');
  t.runAll(o.cmds).then(() => t.input.focus({ preventScroll: true }));
  btn.textContent = '↻ Rejouer';
}
function mountWidgets(root) {
  $$('[data-widget]', root).forEach(w => {
    const k = w.dataset.widget;
    if (k === 'permlab') mountPermLab(w);
    else if (k === 'globlab') mountGlobLab(w);
    else if (k === 'enclab') mountEncLab(w);
    else if (k === 'drill') mountDrill(w, w.dataset.kind, 99, null, w.dataset.title);
  });
  $$('.ex-shell', root).forEach(startTask);
  $$('.ex-drill', root).forEach(sec => mountDrill($('.drill-host', sec), sec.dataset.kind, +sec.dataset.need, () => markDone(sec.dataset.ex)));
}

/* ================================================================== PAGES */
function progress() {
  const done = EX_IDS.filter(id => Store.data.done[id]).length;
  const lessons = LESSONS.filter(l => Store.data.lessons[l.id]).length;
  return { done, total: EX_IDS.length, lessons, nl: LESSONS.length };
}
function homeSummary() {
  const p = progress();
  const nx = LESSONS.find(l => !Store.data.lessons[l.id]);
  return `<p class="sum-line"><strong>${p.lessons}</strong> leçon${p.lessons > 1 ? 's' : ''} sur ${p.nl} terminée${p.lessons > 1 ? 's' : ''} · <strong>${p.done}</strong> exercice${p.done > 1 ? 's' : ''} réussi${p.done > 1 ? 's' : ''} sur ${p.total}</p>` +
    (nx ? `<a class="btn" href="#${nx.id}">${p.done || p.lessons ? 'Continuer' : 'Commencer'} : ${esc(nx.title)}</a>` : '<p class="sum-line">Tout est fait. Passe à l\'interro blanche, au terminal et à l\'aide-mémoire.</p>');
}
window.updateProgress = function () {
  const p = progress(), pct = Math.round(100 * p.done / p.total);
  const bar = $('#prog-bar'), txt = $('#prog-txt');
  if (bar) { bar.style.width = pct + '%'; bar.parentElement.setAttribute('aria-valuenow', String(pct)); }
  if (txt) txt.textContent = `${p.done}/${p.total}`;
  $$('.nav a').forEach(a => a.classList.toggle('is-done', !!Store.data.lessons[a.dataset.id]));
  $$('.skill[data-l]').forEach(s => s.classList.toggle('is-done', !!Store.data.lessons[s.dataset.l]));
  const sum = $('#home-sum'); if (sum) sum.innerHTML = homeSummary();
  try { localStorage.setItem('hub:systeme/intro-systeme', JSON.stringify(p)); } catch (e) { /* indisponible */ }
};
function navHTML() {
  return NAV.map(g => `<div class="nav-g"><div class="nav-h">${esc(g.group)}</div>${g.items.map(i => `<a href="#${i.id}" data-id="${i.id}"><span class="nav-n">${i.n}</span><span class="nav-t">${esc(i.label)}</span></a>`).join('')}</div>`).join('');
}
function pageAccueil() {
  return `<div class="home">
  <section class="hero"><p class="kicker">R1.04 · Utilisation des systèmes informatiques</p>
  <h1>Le terminal Linux, de la première commande aux droits d'accès.</h1>
  <p class="lead">Tout le programme des TD 1 à 4 et de l'aide-mémoire : fichiers, jokers, archives, travail à distance, redirections et filtres, codage des caractères, utilisateurs, droits, ACL, chiffrement, compilation et processus. Chaque exemple s'exécute dans un vrai terminal simulé, et chaque exercice est corrigé automatiquement.</p>
  <div id="home-sum" class="home-sum">${homeSummary()}</div></section>
  <h2>Comment travailler</h2>
  <ol class="numbered"><li>Lis la leçon et clique sur <strong>▶ Essayer ici</strong> sous les exemples : un terminal s'ouvre, tu peux modifier les commandes.</li><li>Fais les exercices <strong>S'entraîner</strong> : questions, commandes à taper dans un terminal (avec Vérifier, Indice, Solution) et séries sans fin.</li><li>Marque la leçon comme terminée : sa compétence se coche ci-dessous.</li><li>Avant l'évaluation : l'<a href="#revision">interro blanche</a> et l'<a href="#memo">aide-mémoire</a>.</li></ol>
  ${PARTS.map(p => `<h2>${esc(p.td)} · ${esc(p.title)}</h2><ul class="skills">${LESSONS.filter(l => l.part === p.id).map(l => `<li class="skill${Store.data.lessons[l.id] ? ' is-done' : ''}" data-l="${l.id}"><a href="#${l.id}"><span class="sk-n">${ORDER.indexOf(l.id) + 1}</span><span class="sk-t">${esc(l.skill)}</span><span class="sk-l">${esc(l.title)}</span></a></li>`).join('')}</ul>`).join('')}
  <p><a class="btn ghost" href="#terminal">Ouvrir le terminal</a> <a class="btn ghost" href="#memo">Aide-mémoire</a> <a class="btn ghost" href="#revision">Interro blanche</a> <a class="btn ghost" href="#fiche">Fiche recto verso pour le contrôle</a></p>
  <p class="note-line muted">Sources : supports de TD M1101 (R. Giot, IUT de Bordeaux) et aide-mémoire des commandes Unix R1.04.</p></div>`;
}
function pageLesson(l, idx) {
  const done = !!Store.data.lessons[l.id];
  const prev = ORDER[idx - 1], next = ORDER[idx + 1];
  const part = PARTS.find(p => p.id === l.part);
  return `<article class="page"><p class="kicker">Leçon ${idx + 1} sur ${LESSONS.length} · ${esc(part.td)}</p><h1>${esc(l.title)}</h1><p class="lead">${esc(l.lead)}</p>
  <aside class="note convention obj"><div class="note-h">Objectifs</div><div class="note-b">${ul(l.obj.map(esc))}</div></aside>
  <div class="body">${l.body()}</div>
  ${note('retenir', 'À retenir', ul(l.retenir.map(esc)))}
  <section class="practice"><h2>S'entraîner</h2>${l.ex.map(exercise).join('')}</section>
  <div class="finish"><button type="button" class="btn${done ? ' ghost' : ''}" data-app="finish" data-l="${l.id}" aria-pressed="${done}">${done ? '✓ Leçon terminée' : 'Marquer la leçon comme terminée'}</button></div>
  <nav class="pager" aria-label="Navigation">${prev ? `<a href="#${prev}"><span>Précédent</span>${esc(LESSON(prev).title)}</a>` : '<span></span>'}${next ? `<a class="next" href="#${next}"><span>Suivant</span>${esc(LESSON(next).title)}</a>` : '<a class="next" href="#revision"><span>Pour finir</span>Interro blanche</a>'}</nav></article>`;
}
function pageMemo() {
  const link = id => `<a href="#${id}">${ORDER.indexOf(id) + 1}</a>`;
  const bits = tbl(['Chiffre', 'Droits', 'Calcul'], [['7', c('rwx'), '4+2+1'], ['6', c('rw-'), '4+2'], ['5', c('r-x'), '4+1'], ['4', c('r--'), '4'], ['3', c('-wx'), '2+1'], ['2', c('-w-'), '2'], ['1', c('--x'), '1'], ['0', c('---'), '0']]);
  return `<article class="page"><p class="kicker">Aide-mémoire</p><h1>Aide-mémoire R1.04</h1><p class="lead">Les commandes de l'aide-mémoire Unix, dans le même ordre, plus celles vues en TD. Le numéro renvoie à la leçon.</p>
  ${MEMO.map(g => `<h2>${esc(g.t)}</h2>${tbl(['Commande', 'Paramètres', 'Effet', 'Leçon'], g.rows.map(r => [c(r[0]), r[1] ? c(r[1]) : '', esc(r[2]), link(r[3])]), 'memo-tbl')}`).join('')}
  <h2>Le shell</h2>${tbl(['Écriture', 'Sens', 'Leçon'], MEMO_SHELL.map(r => [c(r[0]), esc(r[1]), link(r[2])]))}
  <h2>Les droits</h2>${tbl(['', 'Fichier', 'Répertoire'], [[c('r'), 'lire le contenu', 'lister les noms'], [c('w'), 'modifier le contenu', 'créer, renommer, supprimer dedans'], [c('x'), 'exécuter', 'traverser (cd)']])}
  ${tbl(['Qui', '', 'Opérateur', ''], [[c('u'), 'propriétaire', c('+'), 'ajouter'], [c('g'), 'groupe', c('-'), 'retirer'], [c('o'), 'autres', c('='), 'mettre exactement'], [c('a'), 'tous', '', '']])}
  ${bits}
  <p>umask : fichiers = 666 sans les bits du masque, répertoires = 777 sans les bits du masque. 022 → 644 / 755 ; 077 → 600 / 700.</p>
  <h2>Codage</h2><p>ASCII : 7 bits. Latin-1 (ISO-8859-1) : 8 bits. UTF-8 : 1 octet (ASCII), 2 (é, ç), 3 (€), 4 (émojis). é = C3 A9 en UTF-8, E9 en Latin-1.</p>
  <h2>Messages d'erreur</h2>${tbl(['Message', 'Signification'], [[c('No such file or directory'), 'le chemin n\'existe pas (vérifie avec ls, utilise TAB)'], [c('Permission denied'), 'il manque un droit r, w ou x : regarde ls -l'], [c('Is a directory'), 'rm ou cat sur un répertoire (rm -r ?)'], [c('omitting directory'), 'cp d\'un répertoire sans -r'], [c('Directory not empty'), 'rmdir sur un répertoire non vide'], [c('File exists'), 'mkdir d\'un répertoire qui existe'], [c('command not found'), 'faute de frappe, ou programme hors du PATH (./prog)'], [c('Not a directory'), 'un fichier utilisé comme un répertoire'], [c('Operation not permitted'), 'action réservée au propriétaire ou à root']])}
  <h2>Les pièges classiques</h2><ul class="pieges">${PIEGES.map(p => `<li><strong>${p[0]}</strong><span>${p[1]}</span></li>`).join('')}</ul></article>`;
}
/* Fiche recto verso : une feuille A4 très dense, à imprimer pour le contrôle */
const FICHE_TAILLES = [10, 11, 12, 13, 14];
const ficheTaille = () => { let t = 13; try { t = +localStorage.getItem('intro-systeme-fiche') || 13; } catch (e) { /* indisponible */ } return FICHE_TAILLES.includes(t) ? t : 13; };
function pageFiche() {
  return `<article class="page wide fiche-page"><div class="fiche-tools"><p class="kicker">Pour le contrôle</p><h1>Fiche recto verso</h1>
  <p class="lead">L'essentiel du cours, une commande par ligne : <code>cmd [-option : effet, …] : ce qu'elle fait</code>. Recto : les fichiers (se déplacer, créer, copier, déplacer, lire, modifier, rediriger). Verso : les permissions. Imprimée, elle tient sur <strong>une feuille A4 recto verso</strong>.</p>
  <div class="at-bar"><button type="button" class="btn" data-app="fiche-print">⎙ Imprimer / PDF</button>
  <span class="fiche-size">Taille du texte : <button type="button" class="btn ghost mini" data-app="fiche-size" data-d="-1" aria-label="Texte plus petit">A−</button> <strong id="fiche-pt">${String(ficheTaille()).replace('.', ',')} pt</strong> <button type="button" class="btn ghost mini" data-app="fiche-size" data-d="1" aria-label="Texte plus grand">A+</button></span></div>
  <p class="note-line">Réglages d'impression : papier A4, recto verso (bord long), échelle 100 %, marges « Aucune » ou « Minimales », cocher « Graphiques d'arrière-plan ». Le recto et le verso tiennent chacun sur une page jusqu'à 14 pt ; si l'aperçu en annonce plus de 2, baisse d'un cran. Vérifie dans l'aperçu avant d'imprimer, et que ton enseignant accepte une fiche imprimée.</p></div>
  <div class="fiche-wrap" id="fiche-feuille" style="--fiche-pt:${ficheTaille()}pt">
  <div class="fiche"><header class="fiche-h"><strong>R1.04 · Aide-mémoire Linux · recto</strong><span>Nom : ……………………………</span></header>${FICHE().slice(0, FICHE_RECTO).join('')}</div>
  <div class="fiche fiche-verso"><header class="fiche-h"><strong>R1.04 · Aide-mémoire Linux · verso</strong></header>${FICHE().slice(FICHE_RECTO).join('')}</div></div></article>`;
}

/* Interro blanche : 20 questions tirées au hasard dans tout le cours */
const Rev = { qs: [], i: 0, score: 0, answers: [] };
function newRevision() {
  const pool = EX_IDS.filter(id => EX[id].type === 'qcm');
  const ids = pool.slice().sort(() => Math.random() - 0.5).slice(0, 20);
  Rev.qs = ids.map(id => ({ id, order: qOrder(EX[id].choices) })); Rev.i = 0; Rev.score = 0; Rev.answers = [];
}
function pageRevision() {
  return `<article class="page"><p class="kicker">TD 5 · Révisions</p><h1>Interro blanche</h1><p class="lead">20 questions tirées au hasard dans tout le cours. Une seule réponse par question, la correction s'affiche à la fin.</p><div id="rev"></div></article>`;
}
function drawRevision() {
  const host = $('#rev'); if (!host) return;
  if (!Rev.qs.length) newRevision();
  if (Rev.i >= Rev.qs.length) {
    const wrong = Rev.answers.filter(a => !a.ok);
    const lessons = [...new Set(wrong.map(a => a.id.split('-')[0]))];
    host.innerHTML = `<div class="home-sum"><p class="sum-line">Score : <strong>${Rev.score} / ${Rev.qs.length}</strong> (${Math.round(20 * Rev.score / Rev.qs.length)}/20)</p><button type="button" class="btn" data-app="rev-new">Nouvelle interro</button></div>
    ${lessons.length ? `<p>À revoir : ${lessons.map(l => `<a href="#${l}">${esc(LESSON(l).title)}</a>`).join(', ')}.</p>` : '<p>Aucune erreur : bravo !</p>'}
    <h2>Correction</h2><ol class="rev-list">${Rev.answers.map(a => { const d = EX[a.id]; return `<li class="${a.ok ? 'ok' : 'ko'}"><strong>${esc(d.q)}</strong><br>${a.ok ? '✓' : '✗ Ta réponse : ' + esc(d.choices[a.got]) + '<br>'} Bonne réponse : <code>${esc(d.choices[0])}</code>. <span class="muted">${esc(d.why)}</span></li>`; }).join('')}</ol>`;
    return;
  }
  const q = Rev.qs[Rev.i], d = EX[q.id];
  host.innerHTML = `<section class="ex ex-qcm"><header class="ex-h"><span class="ex-kind">Question ${Rev.i + 1} / ${Rev.qs.length}</span><span class="muted">${esc(LESSON(q.id.split('-')[0]).title)}</span></header>
  <p class="ex-q">${esc(d.q)}</p><div class="choices">${q.order.map(i => `<button type="button" class="choice" data-app="rev-ans" data-i="${i}"><span class="mark"></span><span class="ct">${d.codeChoices ? `<code>${esc(d.choices[i])}</code>` : esc(d.choices[i])}</span></button>`).join('')}</div>
  <div class="meter rev-meter" aria-hidden="true"><i style="width:${Math.round(100 * Rev.i / Rev.qs.length)}%"></i></div></section>`;
}

/* ================================================================== ROUTAGE */
const main = () => $('#main');
function route() {
  let id = (location.hash || '').replace('#', '');
  if (!ALL_IDS.includes(id)) id = 'accueil';
  const li = ORDER.indexOf(id);
  let html;
  if (id === 'accueil') html = pageAccueil();
  else if (li >= 0) html = pageLesson(LESSONS[li], li);
  else if (id === 'terminal') html = pageTerminal();
  else if (id === 'revision') html = pageRevision();
  else if (id === 'fiche') html = pageFiche();
  else html = pageMemo();
  const m = main(); m.innerHTML = html;
  $$('.nav a').forEach(a => a.setAttribute('aria-current', a.dataset.id === id ? 'page' : 'false'));
  const label = li >= 0 ? LESSONS[li].title : { terminal: 'Terminal', memo: 'Aide-mémoire', revision: 'Interro blanche', fiche: 'Fiche recto verso' }[id];
  document.title = id === 'accueil' ? 'Intro Système' : label + ' · Intro Système';
  document.body.classList.toggle('fiche-mode', id === 'fiche');
  mountWidgets(m);
  if (id === 'terminal') mountTerminal();
  if (id === 'revision') drawRevision();
  window.updateProgress(); closeDrawer(); window.scrollTo(0, 0); m.focus({ preventScroll: true });
}
function closeDrawer() { document.body.classList.remove('drawer-open'); const b = $('#menu-btn'); if (b) b.setAttribute('aria-expanded', 'false'); }
function setTheme(t) { try { localStorage.setItem('cours-theme', t || ''); } catch (e) { /* indisponible */ } if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }

function act(b) {
  const k = b.dataset.act, sec = b.closest('.ex');
  if (k === 'try') tryHere(b);
  else if (k === 'qcm') {
    if ($('.choice.ok', sec)) return;
    const def = EX[sec.dataset.ex], i = +b.dataset.i;
    if (i === def.answer) { b.classList.add('ok'); $$('.choice', sec).forEach(x => { x.disabled = true; }); setFb(sec, 'Exact. ' + def.why, 'ok'); markDone(sec.dataset.ex); }
    else { b.classList.add('ko'); b.disabled = true; setFb(sec, "Ce n'est pas celle-là. Relis le cours et essaie une autre réponse.", 'ko'); }
  } else if (k === 'sh-check') {
    const id = sec.dataset.ex, def = EX[id], t = TASKS[id];
    const [ok, msg] = def.check(t.shell);
    setFb(sec, ok ? 'Réussi. ' + msg : msg, ok ? 'ok' : 'ko');
    if (ok) markDone(id);
  } else if (k === 'hint') { $('.hint', sec).hidden = false; }
  else if (k === 'sol') { $('.sol', sec).hidden = false; }
  else if (k === 'sh-reset') { startTask(sec); setFb(sec, '', ''); }
}
function init() {
  document.getElementById('app').innerHTML = `
<a class="skip" href="#main">Aller au contenu</a>
<header class="top">
  <button type="button" id="menu-btn" class="icon-btn" aria-label="Menu" aria-expanded="false" aria-controls="side">☰</button>
  <a class="back" href="index.html" title="Retour à la matière" aria-label="Retour à la matière">⌂</a><a class="brand" href="#accueil"><span class="brand-mark">$</span>Intro <small>système</small></a>
  <div class="meter" role="progressbar" aria-label="Progression" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="prog-bar"></i></div>
  <span id="prog-txt" class="prog-txt"></span>
  <div class="tools"><button type="button" id="theme-btn" class="icon-btn" aria-label="Changer le thème" title="Thème clair / sombre">◐</button></div>
</header>
<div class="shell"><nav id="side" class="side nav" aria-label="Sommaire">${navHTML()}</nav><div class="scrim" data-app="scrim"></div><main id="main" tabindex="-1"></main></div>`;
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-act]');
    if (a) act(a);
    const b = e.target.closest('[data-app]');
    if (!b) return;
    const k = b.dataset.app;
    if (k === 'finish') {
      const id = b.dataset.l; Store.data.lessons[id] = !Store.data.lessons[id]; Store.save();
      const on = !!Store.data.lessons[id];
      b.textContent = on ? '✓ Leçon terminée' : 'Marquer la leçon comme terminée';
      b.classList.toggle('ghost', on); b.setAttribute('aria-pressed', String(on)); window.updateProgress();
    } else if (k === 'scrim') closeDrawer();
    else if (k === 'term-reset') { Main.shell = new Sh.Shell(Main.seed); Main.html = ''; mountTerminal(); }
    else if (k === 'rev-ans') {
      const q = Rev.qs[Rev.i], i = +b.dataset.i, ok = i === EX[q.id].answer;
      Rev.answers.push({ id: q.id, got: i, ok }); if (ok) Rev.score++; Rev.i++; drawRevision();
    } else if (k === 'rev-new') { newRevision(); drawRevision(); }
    else if (k === 'fiche-print') window.print();
    else if (k === 'fiche-size') {
      const i = Math.max(0, Math.min(FICHE_TAILLES.length - 1, FICHE_TAILLES.indexOf(ficheTaille()) + +b.dataset.d)), t = FICHE_TAILLES[i];
      try { localStorage.setItem('intro-systeme-fiche', String(t)); } catch (e) { /* indisponible */ }
      $('#fiche-feuille').style.setProperty('--fiche-pt', t + 'pt'); $('#fiche-pt').textContent = String(t).replace('.', ',') + ' pt';
    }
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-act-form="cmd"]');
    if (!f) return;
    e.preventDefault();
    const v = $('.drill-in', f).value;
    if (v.trim()) checkCmd(f.closest('.ex'), v);
  });
  $('#menu-btn').addEventListener('click', () => { const o = document.body.classList.toggle('drawer-open'); $('#menu-btn').setAttribute('aria-expanded', String(o)); });
  $('#theme-btn').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    setTheme(dark ? 'light' : 'dark');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  window.addEventListener('hashchange', route);
  route();
}
init();
