/* Application du cours de maths : parcours, chapitres, auto-tests, exercices, QCM, cartes, calculateurs, mémo, notes.
   Chaque page définit avant ce fichier : CH ('logique', 'arith', 'recurrence', 'second' ou 'all' pour les révisions)
   et HUBID (clé de progression pour les pages d'accueil). Le contenu vient des fichiers cours-*.js (objet COURS)
   et les outils de outils.js. Voir lib.js pour l'écriture des formules et des boîtes de cours. */
(function () {
'use strict';

/* ---------- données de la page ---------- */
const TOUT = CH === 'all';
const PARTS = (TOUT ? ['logique', 'arith', 'recurrence', 'second', 'revision'] : [CH]).map(k => COURS[k]).filter(Boolean);
const PAGE = TOUT ? COURS.revision : COURS[CH];
const CHAPS = [];
PARTS.forEach(p => p.chapitres.forEach((c, i) => {
  c.part = p; c.idx = i; c.quiz = c.quiz || []; c.cartes = c.cartes || []; c.exos = c.exos || []; c.sections = c.sections || []; c.retenir = c.retenir || [];
  c.exos.forEach(x => { x.c = c.id; });
  CHAPS.push(c);
}));
const OWN = PAGE.chapitres;                                       // chapitres affichés dans « Cours »
const QCM = [], CARDS = [], EXOS = [];
CHAPS.forEach(c => {
  c.quiz.forEach(q => { q.c = c.id; q.p = c.part.id; QCM.push(q); });
  c.cartes.forEach(k => { k.c = c.id; k.p = c.part.id; CARDS.push(k); });
  c.exos.forEach(x => { x.p = c.part.id; EXOS.push(x); });
});
const BYID = {}; CHAPS.forEach(c => { BYID[c.id] = c; });
const POOLS = PARTS.filter(p => p.id !== 'revision');              // parties qui ont des questions
const OUTILS_IDS = (function () { const s = {}; PARTS.forEach(p => (p.outils || []).forEach(i => { s[i] = 1; })); return Object.keys(s); })();
const TOOLS_ON = TOOLS.filter(t => OUTILS_IDS.indexOf(t.id) >= 0);
const QUIZ_OK = 70;
const VIEWS = ['accueil', 'cours', 'qcm', 'cartes', 'exos', 'outils', 'memo', 'notes'];
if (!TOOLS_ON.length) VIEWS.splice(VIEWS.indexOf('outils'), 1);

/* ---------- sauvegarde ---------- */
let store = { qcm: {}, cards: {}, theme: null, notes: [], plan: {}, read: {}, quiz: {}, done: {}, last: null, fiche: null };
try { const ct = localStorage.getItem('cours-theme'); if (ct) store.theme = ct; } catch (e) {}
try { const s = localStorage.getItem('mdb1-v2'); if (s) { const o = JSON.parse(s); if (o && typeof o === 'object') store = Object.assign(store, o); } } catch (e) {}
['qcm', 'cards', 'read', 'quiz', 'done'].forEach(k => { if (!store[k] || typeof store[k] !== 'object') store[k] = {}; });
function save() { try { localStorage.setItem('mdb1-v2', JSON.stringify(store)); } catch (e) {} hubSave(); }
function chSteps(c) {
  const q = c.quiz.length ? 1 : 0;
  const d = (store.read[c.id] ? 1 : 0) + (q && store.quiz[c.id] && store.quiz[c.id].best >= QUIZ_OK ? 1 : 0) + c.exos.filter(x => store.done[x.id]).length;
  return { done: d, total: 1 + q + c.exos.length };
}
function hubSave() {
  try {
    let v;
    if (TOUT) { const b = (store.qcm.all && store.qcm.all.best) || 0; v = { done: b, total: 100, text: store.qcm.all ? 'Meilleure interro blanche : ' + b + ' %' : 'Pas encore commencé' }; }
    else { let d = 0, t = 0; OWN.forEach(c => { const s = chSteps(c); d += s.done; t += s.total; }); v = { done: d, total: t, unit: 'étapes validées' }; }
    localStorage.setItem('hub:maths/' + HUBID, JSON.stringify(v));
  } catch (e) {}
}
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const lienChap = c => OWN.indexOf(c) >= 0 ? { data: ' data-go="' + c.id + '"', href: '#' + c.id } : { data: '', href: c.part.page + '#' + c.id };

/* ---------- squelette de la page ---------- */
const THEME_LAB = { dark: 'sombre', light: 'clair' };
function squelette() {
  const nav = [];
  const lien = (v, ic, t, cls) => '<a href="#' + v + '" data-view="' + v + '"' + (cls ? ' class="' + cls + '"' : '') + '><span class="ic">' + ic + '</span><span class="nav-t">' + t + '</span></a>';
  nav.push('<span class="nav-g">Parcours</span>', lien('accueil', '⌂', 'Accueil'));
  nav.push('<span class="nav-g">Cours</span>');
  OWN.forEach(c => nav.push('<a class="ch" href="#' + c.id + '" data-view="' + c.id + '"><span class="ic">' + (c.idx + 1) + '</span><span class="nav-t">' + R(c.court || c.titre) + '</span><span class="chk" aria-hidden="true">✓</span></a>'));
  nav.push('<span class="nav-g">S’entraîner</span>', lien('qcm', '?', 'QCM'), lien('cartes', '↻', 'Cartes mémoire'), lien('exos', '✓', 'Exercices corrigés'));
  if (TOOLS_ON.length) nav.push(lien('outils', 'ƒ', 'Calculateurs'));
  nav.push('<span class="nav-g">Réviser</span>', lien('memo', '★', 'Mémo : l’essentiel'), lien('notes', '✎', 'Notes et plan'));
  const pages = [['logique.html', 'Logique'], ['arithmetique.html', 'Arithmétique dans ℤ'], ['recurrence.html', 'Récurrence et suites'], ['second-degre.html', 'Second degré'], ['revision.html', 'Révisions et interro']];
  const cur = location.pathname.split('/').pop();
  $('#app').innerHTML =
    '<div class="readbar" id="readbar"></div><div class="app"><aside class="side">' +
    '<div class="toprow"><a class="homebtn" href="index.html" aria-label="Retour au hub Mathématiques" title="Retour au hub Mathématiques">⌂</a>' +
    '<a class="brand" href="#accueil" data-view="accueil"><span class="brand-mark">∀∃</span><span><b>Maths · ' + esc(PAGE.nom) + '</b><small>BUT1 Informatique · IUT de Bordeaux</small></span></a>' +
    '<button class="ghost mob-theme" id="themeBtn2" type="button" aria-label="Changer de thème">◐</button></div>' +
    '<nav class="nav" id="nav" aria-label="Sections">' + nav.join('') + '</nav>' +
    '<div class="side-foot"><div class="chlinks"><b>Les cours de maths</b>' + pages.map(p => '<a href="' + p[0] + '"' + (p[0] === cur ? ' aria-current="page"' : '') + '>' + p[1] + '</a>').join('') + '</div>' +
    '<button class="ghost" id="themeBtn" type="button">Thème : automatique</button><span>Ta progression est gardée dans ce navigateur.</span></div></aside>' +
    '<main class="main" id="main">' + VIEWS.map(v => '<section class="view" id="v-' + v + '" hidden></section>').join('') + '</main></div>';
}

function applyTheme() {
  const r = document.documentElement;
  if (store.theme === 'dark' || store.theme === 'light') r.setAttribute('data-theme', store.theme); else r.removeAttribute('data-theme');
  const b = $('#themeBtn'); if (b) b.textContent = 'Thème : ' + (THEME_LAB[store.theme] || 'automatique');
}
function cycleTheme() {
  store.theme = store.theme === null ? 'dark' : store.theme === 'dark' ? 'light' : null; save();
  try { if (store.theme) localStorage.setItem('cours-theme', store.theme); else localStorage.removeItem('cours-theme'); } catch (e) {}
  applyTheme();
}

/* ---------- navigation ---------- */
let current = 'accueil';
const MAJ = { fiches: 'memo' };
function marquerNav() {
  $$('#nav a').forEach(a => {
    const c = BYID[a.dataset.view];
    if (a.dataset.view === current) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    if (c) a.classList.toggle('fini', chSteps(c).done === chSteps(c).total);
  });
}
// mode : 'push' (défaut : une entrée d'historique, le bouton Retour fonctionne), 'replace' (démarrage), 'none' (retour/avance du navigateur)
function show(route, mode) {
  route = MAJ[route] || route;
  let view = route, chap = null;
  if (OWN.some(c => c.id === route)) { view = 'cours'; chap = BYID[route]; }
  else if (VIEWS.indexOf(route) < 0) { route = 'accueil'; view = 'accueil'; }
  current = route;
  VIEWS.forEach(v => { $('#v-' + v).hidden = v !== view; });
  marquerNav();
  if (view === 'accueil') renderHome();
  else if (view === 'cours') renderChapter(chap);
  else if (view === 'qcm') renderQcm();
  else if (view === 'cartes') renderCards();
  else if (view === 'exos') renderExos();
  else if (view === 'outils') renderTools();
  else if (view === 'memo') renderMemo();
  else if (view === 'notes') renderNotes();
  window.scrollTo(0, 0);
  try {
    if (mode === 'replace') history.replaceState(null, '', '#' + route);
    else if (mode !== 'none' && location.hash !== '#' + route) history.pushState(null, '', '#' + route);
  } catch (e) {}
  majBarre();
}
// Retour / avance du navigateur et changement manuel du lien (#l3, #qcm…)
window.addEventListener('popstate', () => { let h = ''; try { h = location.hash.replace('#', ''); } catch (e) {} show(h || 'accueil', 'none'); });
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-view]');
  if (a) { e.preventDefault(); show(a.dataset.view); return; }
  const g = e.target.closest('[data-go]');
  if (g) {
    const k = g.dataset.go;
    if (k === 'exam') { cfg.scope = TOUT ? 'all' : CH; show('qcm'); startQcm({ scope: cfg.scope, count: 15, mode: 'exam' }); }
    else if (k === 'cartes') { cs.filter = 'todo'; cs.built = false; show('cartes'); }
    else show(k);
    return;
  }
  const sc = e.target.closest('[data-scroll]');
  if (sc) { e.preventDefault(); const t = document.getElementById(sc.dataset.scroll); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});
function majBarre() {
  const b = $('#readbar'); if (!b) return;
  const h = document.documentElement, max = h.scrollHeight - h.clientHeight;
  b.style.width = (BYID[current] && max > 0 ? Math.min(100, 100 * window.scrollY / max) : 0) + '%';
}
window.addEventListener('scroll', majBarre, { passive: true });

/* ---------- accueil : le parcours ---------- */
function renderHome() {
  const first = OWN.find(c => { const s = chSteps(c); return s.done < s.total; }) || OWN[0];
  const started = OWN.some(c => chSteps(c).done > 0);
  const scopeAll = TOUT ? 'all' : CH;
  const nb = (n, s, p) => n + ' ' + (n > 1 ? (p || s + 's') : s);
  const road = OWN.map(c => {
    const s = chSteps(c), fin = s.done === s.total, cur = c === first && !fin;
    const q = store.quiz[c.id], nd = c.exos.filter(x => store.done[x.id]).length, lu = !!store.read[c.id];
    return '<div class="stop' + (fin ? ' fini' : cur ? ' cur' : '') + '"><div class="dot">' + (fin ? '✓' : c.idx + 1) + '</div>' +
      '<button type="button" class="stop-body" data-go="' + c.id + '"><span class="stop-t">' + R(c.titre) + '</span><span class="stop-d">' + R(c.resume || c.intro) + '</span>' +
      '<span class="stop-m"><span class="chk-i' + (lu ? ' on' : '') + '">' + (lu ? '✓' : '○') + ' Cours lu</span>' +
      (c.quiz.length ? '<span class="chk-i' + (q && q.best >= QUIZ_OK ? ' on' : '') + '">' + (q && q.best >= QUIZ_OK ? '✓' : '○') + ' Auto-test' + (q ? ' ' + q.best + ' %' : '') + '</span>' : '') +
      (c.exos.length ? '<span class="chk-i' + (nd === c.exos.length ? ' on' : '') + '">' + (nd === c.exos.length ? '✓' : '○') + ' Exercices ' + nd + '/' + c.exos.length + '</span>' : '') +
      '<span class="bar" aria-hidden="true"><i style="width:' + pct(s.done, s.total) + '%"></i></span></span></button></div>';
  }).join('');
  const st = (TOUT ? POOLS : POOLS).map(p => {
    const best = (store.qcm[p.id] && store.qcm[p.id].best) || 0, runs = (store.qcm[p.id] && store.qcm[p.id].runs) || 0;
    const cards = CARDS.filter(c => c.p === p.id), known = cards.filter(c => store.cards[c.f] === 'known').length;
    const ex = EXOS.filter(x => x.p === p.id), done = ex.filter(x => store.done[x.id]).length;
    return '<div class="stat"><b>' + esc(p.nom) + '</b><div class="n"><span>Meilleur QCM</span><span>' + (runs ? best + ' %' : '—') + '</span></div><div class="bar"><i style="width:' + best + '%"></i></div>' +
      '<div class="n"><span>Cartes sues</span><span>' + known + ' / ' + cards.length + '</span></div><div class="bar"><i style="width:' + pct(known, cards.length) + '%"></i></div>' +
      '<div class="n"><span>Exercices faits</span><span>' + done + ' / ' + ex.length + '</span></div><div class="bar"><i style="width:' + pct(done, ex.length) + '%"></i></div></div>';
  }).join('');
  let pieges = []; PARTS.forEach(p => { pieges = pieges.concat(p.pieges || []); });
  const autres = TOUT ? '<h3 class="sec2">Revoir un cours</h3><div class="actions">' + COURS_PAGES().map(p => '<a class="act" href="' + p.page + '" style="text-decoration:none;color:inherit"><b>' + esc(p.nom) + '</b><span>' + p.chapitres.length + ' chapitre' + (p.chapitres.length > 1 ? 's' : '') + ' · ' + esc(p.titre) + '</span></a>').join('') + '</div>' : '';
  $('#v-accueil').innerHTML =
    '<div class="hero"><span class="eyebrow">Mathématiques discrètes · ' + esc(PAGE.partie) + '</span><h1>' + R(PAGE.hero) + '</h1><p class="lead">' + R(PAGE.lead) + '</p>' +
    '<div class="hero-meta"><span class="pill">📚 ' + nb(OWN.length, 'chapitre') + '</span><span class="pill">📝 ' + nb(EXOS.length, 'exercice') + ' corrigés</span><span class="pill">❓ ' + nb(QCM.length, 'question') + '</span><span class="pill">🗂 ' + nb(CARDS.length, 'carte') + '</span></div>' +
    '<div class="cta">' + (TOUT ? '<button type="button" class="btn" data-go="exam">Interro blanche (15 questions)</button><button type="button" class="btn sec" data-go="' + first.id + '">' + (started ? 'Reprendre : ' : 'Commencer : ') + R(first.court || first.titre) + '</button>'
      : '<button type="button" class="btn" data-go="' + first.id + '">' + (started ? 'Reprendre au chapitre ' + (first.idx + 1) : 'Commencer le chapitre 1') + '</button><button type="button" class="btn sec" data-go="exam">Interro blanche</button>') + '</div></div>' +
    '<h3 class="sec2" style="margin-top:6px">' + (TOUT ? 'Au programme des révisions' : 'Ton parcours, chapitre par chapitre') + '</h3><div class="road">' + road + '</div>' + autres +
    '<h3 class="sec2">S’entraîner</h3><div class="actions">' +
    '<button class="act" data-go="exam"><b>Interro blanche</b><span>15 questions mélangées, correction à la fin.</span></button>' +
    '<button class="act" data-go="cartes"><b>Cartes à revoir</b><span>Retourne les cartes et trie ce que tu sais.</span></button>' +
    '<button class="act" data-go="exos"><b>Exercices corrigés</b><span>' + nb(EXOS.length, 'exercice') + ' avec indice, méthode et correction détaillée.</span></button>' +
    (TOOLS_ON.length ? '<button class="act" data-go="outils"><b>Calculateurs</b><span>Vérifie un résultat avec les étapes détaillées.</span></button>' : '') +
    '<button class="act" data-go="memo"><b>Mémo</b><span>Toutes les formules à connaître sur une page.</span></button></div>' +
    '<h3 class="sec2">Ta progression</h3><div class="stats">' + st + '</div>' +
    (pieges.length ? '<h3 class="sec2">' + (pieges.length > 1 ? pieges.length + ' pièges classiques' : 'Piège classique') + '</h3><div class="pieges">' + pieges.map(p => '<div class="piege"><b>' + R(p[0]) + '</b>' + R(p[1]) + '</div>').join('') + '</div>' : '');
}
function COURS_PAGES() { return ['logique', 'arith', 'recurrence', 'second'].map(k => COURS[k]).filter(Boolean); }

/* ---------- chapitre ---------- */
function renderChapter(c) {
  const p = c.part, n = p.chapitres.length, prev = p.chapitres[c.idx - 1], next = p.chapitres[c.idx + 1];
  const st = chSteps(c);
  store.last = c.id; save();
  const meta = [c.duree ? '⏱ ' + c.duree : '', c.sections.length ? '§ ' + c.sections.length + ' parties' : '', c.exos.length ? '📝 ' + c.exos.length + ' exercice' + (c.exos.length > 1 ? 's' : '') : '', c.quiz.length ? '❓ ' + c.quiz.length + ' questions' : '', c.cartes.length ? '🗂 ' + c.cartes.length + ' cartes' : ''].filter(Boolean);
  const toc = c.sections.map((s, k) => '<a href="#" data-scroll="' + c.id + '-s' + (k + 1) + '">' + (k + 1) + '. ' + R(s.t) + '</a>').join('') +
    (c.retenir.length ? '<a href="#" data-scroll="' + c.id + '-retenir">⭐ À retenir</a>' : '') + (c.quiz.length ? '<a href="#" data-scroll="' + c.id + '-quiz">❓ Auto-test</a>' : '') + (c.exos.length ? '<a href="#" data-scroll="' + c.id + '-exos">📝 Exercices</a>' : '');
  const pre = (c.prerequis || []).length ? '<section class="card2 prereq"><h3>↩ Avant de commencer</h3><ul>' + c.prerequis.map(x => '<li>' + R(x) + '</li>').join('') + '</ul></section>' : '';
  $('#v-cours').innerHTML =
    '<div class="crumbs"><a href="#accueil" data-view="accueil">' + esc(PAGE.nom) + '</a> › Chapitre ' + (c.idx + 1) + ' sur ' + n + '</div>' +
    '<header class="chhead"><div class="chnum" aria-hidden="true">' + (c.idx + 1) + '</div><div class="chtxt"><span class="eyebrow">' + esc(p.partie) + ' · ' + esc(p.nom) + '</span><h1>' + R(c.titre) + '</h1><p class="lead">' + R(c.intro) + '</p></div>' +
    '<div class="meta">' + meta.map(m => '<span class="pill">' + m + '</span>').join('') + '</div></header>' +
    '<div class="two">' + ((c.objectifs || []).length ? '<section class="card2 obj"><h3>🎯 À la fin du chapitre, tu sauras…</h3><ul>' + c.objectifs.map(x => '<li>' + R(x) + '</li>').join('') + '</ul></section>' : '') + pre + '</div>' +
    '<nav class="toc" aria-label="Dans ce chapitre"><b>Dans ce chapitre</b>' + toc + '</nav>' +
    c.sections.map((s, k) => '<section class="sec" id="' + c.id + '-s' + (k + 1) + '"><h2><span class="sn">' + (k + 1) + '</span>' + R(s.t) + '</h2>' + R(s.h) + '</section>').join('') +
    (c.retenir.length ? '<section class="retenir" id="' + c.id + '-retenir"><h2><span aria-hidden="true">⭐</span> À retenir</h2><ul>' + c.retenir.map(x => '<li>' + R(x) + '</li>').join('') + '</ul></section>' : '') +
    ((c.pieges || []).length ? '<div class="pgrid">' + c.pieges.map(x => bTrap(R(x[0]), R(x[1]))).join('') + '</div>' : '') +
    (c.quiz.length ? '<div class="blk-h" id="' + c.id + '-quiz"><h2>❓ Vérifie-toi</h2><span class="pill" id="quizpill"></span></div><div id="quizhost"></div>' : '') +
    (c.exos.length ? '<div class="blk-h" id="' + c.id + '-exos"><h2>📝 Exercices</h2><span class="pill">' + c.exos.filter(x => store.done[x.id]).length + ' / ' + c.exos.length + ' faits</span></div>' +
      '<p class="muted">Cherche d’abord sur papier. Si tu bloques : un <b>indice</b>, puis la <b>méthode</b>, et seulement ensuite la <b>correction détaillée</b>. Coche « Fait » quand tu as réussi seul.</p>' + c.exos.map(xoHtml).join('') : '') +
    '<div class="chnav">' + (prev ? '<button type="button" class="btn sec" data-go="' + prev.id + '">← ' + R(prev.court || prev.titre) + '</button>' : '<span></span>') +
    '<span class="mid"><button type="button" class="btn' + (store.read[c.id] ? ' sec' : '') + '" id="readBtn">' + (store.read[c.id] ? '✓ Chapitre lu (annuler)' : '✔ J’ai lu ce chapitre') + '</button></span>' +
    (next ? '<button type="button" class="btn" data-go="' + next.id + '" id="nextBtn">' + R(next.court || next.titre) + ' →</button>' : '<button type="button" class="btn" data-go="qcm">Passer aux QCM →</button>') + '</div>';
  nettoyer($('#v-cours'));
  mountDemos($('#v-cours'));
  if (c.quiz.length) renderQuiz($('#quizhost'), c);
  $('#readBtn').addEventListener('click', () => { store.read[c.id] = store.read[c.id] ? 0 : 1; if (!store.read[c.id]) delete store.read[c.id]; save(); marquerNav(); renderChapter(c); $('#readBtn').scrollIntoView({ block: 'center' }); });
  const nb = $('#nextBtn'); if (nb && !store.read[c.id]) nb.addEventListener('click', () => { store.read[c.id] = 1; save(); });
}

// Une formule en bloc écrite dans un <p> fait fermer le paragraphe par le navigateur : on retire les <p> vides qui en résultent
const nettoyer = root => $$('p:empty', root).forEach(e => e.parentNode.removeChild(e));

/* démos : outils intégrés à une leçon */
function mountDemos(root) {
  $$('figure.demo', root).forEach(f => {
    const nom = f.dataset.demo, body = $('.demo-body', f);
    let pre = {}; try { if (f.dataset.pre) pre = JSON.parse(f.dataset.pre); } catch (e) {}
    PRESET = pre;
    try {
      if (nom === 'demi' || nom === 'complet') wAdder(body, nom);
      else if (nom === 'circf') wFonc(body);
      else if (nom === 'timer') wTimer(body);
      else { const t = TOOLS.find(x => x.id === nom); if (t) t.fn(body); else body.textContent = 'Outil introuvable : ' + nom; }
    } finally { PRESET = {}; }
  });
}

/* « À toi » : réponse courte vérifiée sur place */
const norm = s => String(s).toLowerCase().replace(/[\s ]+/g, '').replace(/[−–]/g, '-').replace(/,/g, '.').replace(/^\((.*)\)$/, '$1');
const egal = (a, b) => { if (a === b) return true; const x = Number(a), y = Number(b); return a !== '' && b !== '' && isFinite(x) && isFinite(y) && x === y; };
function verifierTry(box) {
  const rep = norm($('input', box).value), fb = $('.tfb', box);
  if (!rep) { fb.className = 'tfb'; fb.textContent = 'Écris ta réponse, puis clique sur « Vérifier ».'; return; }
  const ok = box.dataset.a.split('|').some(a => egal(rep, norm(a)));
  const why = $('.twhy', box).innerHTML;
  box._n = (box._n || 0) + (ok ? 0 : 1);
  if (ok) { fb.className = 'tfb good'; fb.innerHTML = '<span class="ok-t">Exact.</span> ' + R(why); }
  else if (box._n >= 2) { fb.className = 'tfb bad'; fb.innerHTML = '<span class="err">Pas tout à fait.</span> Voici la réponse attendue : <b>' + esc(box.dataset.a.split('|')[0]) + '</b>. ' + R(why); }
  else { fb.className = 'tfb bad'; fb.innerHTML = '<span class="err">Pas encore.</span> Relis l’énoncé et réessaie' + ($('[data-tryhint]', box) ? ' (ou demande un indice)' : '') + '.'; }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-try]'); if (b) { verifierTry(b.closest('.try')); return; }
  const h = e.target.closest('[data-tryhint]'); if (h) { const t = $('.thint', h.closest('.try')); t.innerHTML = R(t.innerHTML); t.hidden = false; h.hidden = true; }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.try input')) { e.preventDefault(); verifierTry(e.target.closest('.try')); } });

/* auto-test d'un chapitre */
const qtxt = s => esc(s);
function renderQuiz(host, c) {
  const pool = shuffle(c.quiz).slice(0, 5);
  const items = pool.map(q => ({ q, opts: qOrder(q.o).map(i => ({ t: q.o[i], ok: i === 0 })), pick: -1 }));
  const best = store.quiz[c.id] ? store.quiz[c.id].best : null;
  $('#quizpill').textContent = best === null ? 'Pas encore tenté' : 'Meilleur score : ' + best + ' %';
  host.innerHTML = '<p class="muted">' + items.length + ' questions tirées au hasard. Réponds, la correction s’affiche tout de suite.</p>' +
    items.map((it, i) => '<div class="qz" data-i="' + i + '"><div class="qtext">' + (i + 1) + '. ' + qtxt(it.q.q) + '</div><div class="opts">' +
      it.opts.map((o, j) => '<button type="button" class="opt" data-j="' + j + '"><span class="k">' + (j + 1) + '</span><span class="t">' + qtxt(o.t) + '</span></button>').join('') + '</div><div class="fbq"></div></div>').join('') +
    '<div class="qz-res" id="qzres"></div>';
  host.onclick = e => {
    const b = e.target.closest('.opt'); if (!b) return;
    const z = b.closest('.qz'), it = items[+z.dataset.i]; if (it.pick >= 0) return;
    it.pick = +b.dataset.j;
    $$('.opt', z).forEach((x, j) => { x.disabled = true; if (it.opts[j].ok) x.classList.add('good'); else if (j === it.pick) x.classList.add('wrong'); });
    $('.fbq', z).innerHTML = '<div class="fb"><b class="' + (it.opts[it.pick].ok ? 'ok">Bonne réponse.' : 'ko">Pas tout à fait.') + '</b> ' + qtxt(it.q.e) + '</div>';
    if (items.every(x => x.pick >= 0)) {
      const ok = items.filter(x => x.opts[x.pick].ok).length, sc = Math.round(100 * ok / items.length);
      const rec = store.quiz[c.id] || { best: 0, runs: 0 }; rec.runs++; rec.best = Math.max(rec.best, sc); store.quiz[c.id] = rec; save(); marquerNav();
      $('#quizpill').textContent = 'Meilleur score : ' + rec.best + ' %';
      $('#qzres').innerHTML = '<b>' + ok + ' / ' + items.length + '</b> · ' + (sc >= QUIZ_OK ? '<span class="ok-t">Auto-test validé ✓</span>' : 'Il faut ' + QUIZ_OK + ' % pour valider : relis les parties concernées puis recommence.') + ' <button type="button" class="btn sm sec" id="qzagain">Nouveau tirage</button>';
      $('#qzagain').addEventListener('click', () => renderQuiz(host, c));
    }
  };
}

/* exercices : indice → méthode → correction */
const LV = n => '★'.repeat(n || 1) + '☆'.repeat(3 - (n || 1));
function xoHtml(x) {
  const h = [];
  if (x.indice) h.push(['indice', '💡 Indice']);
  if (x.meth) h.push(['meth', '🔧 Méthode']);
  h.push(['sol', '✅ Correction détaillée']);
  return '<article class="xo' + (store.done[x.id] ? ' fait' : '') + '" data-x="' + x.id + '"><header class="xh"><span class="xn">' + esc(x.n) + '</span><span class="lv" title="Difficulté">' + LV(x.niv) + '</span>' +
    (x.src ? '<span class="src">' + esc(x.src) + '</span>' : '') + '<label class="xdone"><input type="checkbox"' + (store.done[x.id] ? ' checked' : '') + '> Fait</label></header>' +
    '<div class="xq">' + R(x.q) + '</div><div class="xa">' + h.map(b => '<button type="button" class="ghost sm" data-help="' + b[0] + '" aria-expanded="false">' + b[1] + '</button>').join('') + '</div>' +
    (x.indice ? '<div class="xhelp" data-for="indice" hidden>' + R(x.indice) + '</div>' : '') + (x.meth ? '<div class="xhelp" data-for="meth" hidden>' + R(x.meth) + '</div>' : '') +
    '<div class="xhelp" data-for="sol" hidden>' + R(x.s) + '</div></article>';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-help]'); if (!b) return;
  const t = $('.xhelp[data-for="' + b.dataset.help + '"]', b.closest('.xo')); t.hidden = !t.hidden; b.setAttribute('aria-expanded', !t.hidden);
});
document.addEventListener('change', e => {
  if (!e.target.matches('.xdone input')) return;
  const a = e.target.closest('.xo'), id = a.dataset.x;
  if (e.target.checked) store.done[id] = 1; else delete store.done[id];
  a.classList.toggle('fait', e.target.checked); save(); marquerNav();
  const c = BYID[(EXOS.find(x => x.id === id) || {}).c], pill = $('.blk-h .pill', a.closest('#v-cours') || document.body);
  if (c && a.closest('#v-cours') && $('#' + c.id + '-exos .pill')) $('#' + c.id + '-exos .pill').textContent = c.exos.filter(x => store.done[x.id]).length + ' / ' + c.exos.length + ' faits';
});
const xoFiltres = { c: 'all', niv: 0, etat: 'tous' };
function renderExos() {
  const el = $('#v-exos');
  const liste = EXOS.filter(x => (xoFiltres.c === 'all' || x.c === xoFiltres.c || x.p === xoFiltres.c) && (!xoFiltres.niv || x.niv === xoFiltres.niv) && (xoFiltres.etat === 'tous' || (xoFiltres.etat === 'faits') === !!store.done[x.id]));
  const nd = EXOS.filter(x => store.done[x.id]).length;
  const chips = scopeChips('xc', xoFiltres.c);
  el.innerHTML = '<div class="head"><span class="eyebrow">Correction</span><h2>Exercices corrigés</h2><p class="lead">' + EXOS.length + ' exercices, ' + nd + ' faits. Cherche d’abord seul : indice, méthode, puis correction détaillée.</p></div>' +
    '<div class="fltbar"><div class="chips">' + chips + '</div></div>' +
    '<div class="fltbar"><div class="chips">' + [[0, 'Tous niveaux'], [1, '★ facile'], [2, '★★ moyen'], [3, '★★★ difficile']].map(o => '<button type="button" class="chip" data-xk="niv" data-v="' + o[0] + '" aria-pressed="' + (xoFiltres.niv === o[0]) + '">' + o[1] + '</button>').join('') + '</div>' +
    '<div class="chips">' + [['tous', 'Tous'], ['afaire', 'À faire'], ['faits', 'Faits']].map(o => '<button type="button" class="chip" data-xk="etat" data-v="' + o[0] + '" aria-pressed="' + (xoFiltres.etat === o[0]) + '">' + o[1] + '</button>').join('') + '</div></div>' +
    (liste.length ? liste.map(x => { const c = BYID[x.c], l = lienChap(c); return '<div class="crumbs" style="margin:18px 0 -6px">' + esc(c.part.nom) + ' · <a href="' + l.href + '"' + l.data + '>Chapitre ' + (c.idx + 1) + ' : ' + R(c.court || c.titre) + '</a></div>' + xoHtml(x); }).join('') : '<div class="panel"><b>Aucun exercice dans ce filtre.</b></div>');
  nettoyer(el);
  $$('[data-xk]', el).forEach(b => b.addEventListener('click', () => { xoFiltres[b.dataset.xk] = b.dataset.xk === 'niv' ? +b.dataset.v : b.dataset.v; renderExos(); }));
  $$('[data-xc]', el).forEach(b => b.addEventListener('click', () => { xoFiltres.c = b.dataset.xc; renderExos(); }));
}
// puces « tout / partie / chapitre » communes au QCM, aux cartes et aux exercices
function scopeChips(attr, val) {
  const o = [['all', TOUT ? 'Tout' : 'Tout le cours']];
  if (TOUT) POOLS.forEach(p => o.push([p.id, p.nom]));
  else CHAPS.forEach(c => { if (c.quiz.length || c.cartes.length || c.exos.length) o.push([c.id, 'Ch. ' + (c.idx + 1)]); });
  return o.map(x => '<button type="button" class="chip" data-' + attr + '="' + x[0] + '" aria-pressed="' + (x[0] === val) + '">' + esc(x[1]) + '</button>').join('');
}
const inScope = (x, s) => s === 'all' || x.c === s || x.p === s;

/* ---------- QCM ---------- */
let cfg = { scope: 'all', count: 15, mode: 'direct' }, qs = null;
function renderQcm() { const el = $('#v-qcm'); if (!qs) return qcmSetup(el); if (qs.done) return qcmResult(el); qcmQuestion(el); }
function chipRow(name, opts, val) { return '<div class="chips">' + opts.map(o => '<button type="button" class="chip" data-k="' + name + '" data-v="' + o[0] + '" aria-pressed="' + (String(o[0]) === String(val)) + '">' + esc(o[1]) + '</button>').join('') + '</div>'; }
function qcmSetup(el) {
  const n = QCM.filter(q => inScope(q, cfg.scope)).length;
  el.innerHTML = '<div class="head"><span class="eyebrow">Entraînement</span><h2>QCM</h2><p class="lead">Choisis un périmètre, puis réponds. Chaque réponse est expliquée.</p></div>' +
    '<div class="panel setup"><fieldset><legend>Périmètre (' + n + ' questions)</legend><div class="chips">' + scopeChips('qs', cfg.scope) + '</div></fieldset>' +
    '<fieldset><legend>Nombre de questions</legend>' + chipRow('count', [[10, '10'], [15, '15'], [25, '25'], [0, 'Toutes']], cfg.count) + '</fieldset>' +
    '<fieldset><legend>Correction</legend>' + chipRow('mode', [['direct', 'Après chaque question'], ['exam', 'À la fin (conditions d’interro)']], cfg.mode) + '</fieldset>' +
    '<div><button class="btn" id="qStart" type="button"' + (n ? '' : ' disabled') + '>Commencer</button></div></div>';
  $$('.chip[data-k]', el).forEach(b => b.addEventListener('click', () => { const k = b.dataset.k; cfg[k] = k === 'count' ? parseInt(b.dataset.v, 10) : b.dataset.v; qcmSetup(el); }));
  $$('.chip[data-qs]', el).forEach(b => b.addEventListener('click', () => { cfg.scope = b.dataset.qs; qcmSetup(el); }));
  $('#qStart', el).addEventListener('click', () => startQcm(cfg));
}
const prepQ = q => ({ q, opts: qOrder(q.o).map(i => ({ t: q.o[i], ok: i === 0 })), pick: -1 });
function startQcm(c) {
  let pool = shuffle(QCM.filter(q => inScope(q, c.scope)));
  if (c.count && c.count < pool.length) pool = pool.slice(0, c.count);
  qs = { cfg: { scope: c.scope, count: c.count, mode: c.mode }, items: pool.map(prepQ), i: 0, done: false, locked: false };
  renderQcm();
}
const chLab = q => { const c = BYID[q.c]; return c ? esc(c.part.nom) + ' · ch. ' + (c.idx + 1) : ''; };
function qcmQuestion(el) {
  const it = qs.items[qs.i], n = qs.items.length, direct = qs.cfg.mode === 'direct';
  el.innerHTML = '<div class="qhead"><span>Question ' + (qs.i + 1) + ' / ' + n + '</span><span>' + chLab(it.q) + (direct ? '' : ' · mode interro') + '</span></div>' +
    '<div class="qbar"><i style="width:' + (100 * qs.i / n) + '%"></i></div><div class="qtext">' + qtxt(it.q.q) + '</div>' +
    '<div class="opts">' + it.opts.map((o, i) => '<button type="button" class="opt' + (it.pick === i ? ' sel' : '') + '" data-i="' + i + '"><span class="k">' + (i + 1) + '</span><span class="t">' + qtxt(o.t) + '</span></button>').join('') + '</div><div id="fb"></div>' +
    '<div class="row" style="margin-top:18px"><button class="btn" id="qNext" type="button" disabled>' + (qs.i === n - 1 ? 'Voir le résultat' : 'Question suivante') + '</button><button class="btn sec" id="qQuit" type="button">Abandonner</button></div>';
  qs.locked = false;
  $$('.opt', el).forEach(b => b.addEventListener('click', () => qcmPick(parseInt(b.dataset.i, 10))));
  $('#qNext', el).addEventListener('click', qcmNext);
  $('#qQuit', el).addEventListener('click', () => { qs = null; renderQcm(); });
}
function qcmPick(i) {
  const el = $('#v-qcm'), it = qs.items[qs.i];
  if (qs.locked || !it.opts[i]) return;
  it.pick = i;
  if (qs.cfg.mode === 'direct') {
    qs.locked = true;
    $$('.opt', el).forEach((b, j) => { b.disabled = true; if (it.opts[j].ok) b.classList.add('good'); else if (j === i) b.classList.add('wrong'); });
    const ok = it.opts[i].ok;
    $('#fb', el).innerHTML = '<div class="fb"><b class="' + (ok ? 'ok">Bonne réponse.' : 'ko">Pas tout à fait.') + '</b> ' + qtxt(it.q.e) + '</div>';
  } else $$('.opt', el).forEach((b, j) => b.classList.toggle('sel', j === i));
  $('#qNext', el).disabled = false;
}
function qcmNext() {
  if (qs.items[qs.i].pick < 0) return;
  if (qs.i < qs.items.length - 1) { qs.i++; renderQcm(); window.scrollTo(0, 0); return; }
  qs.done = true;
  const ok = qs.items.filter(x => x.opts[x.pick] && x.opts[x.pick].ok).length, p = Math.round(100 * ok / qs.items.length), key = qs.cfg.scope;
  if (key !== 'retry') { const rec = store.qcm[key] || { best: 0, runs: 0 }; rec.runs++; rec.best = Math.max(rec.best, p); store.qcm[key] = rec; }
  save(); renderQcm(); window.scrollTo(0, 0);
}
function qcmResult(el) {
  const n = qs.items.length, wrong = qs.items.filter(x => !(x.opts[x.pick] && x.opts[x.pick].ok)), ok = n - wrong.length, p = Math.round(100 * ok / n);
  const msg = p >= 90 ? 'Très solide.' : p >= 70 ? 'Bien, quelques points à reprendre.' : p >= 50 ? 'Les bases sont là, reprends les chapitres concernés.' : 'À retravailler : relis le chapitre puis refais un QCM.';
  const chaps = {}; wrong.forEach(x => { chaps[x.q.c] = 1; });
  el.innerHTML = '<div class="head"><span class="eyebrow">Résultat</span><div class="score">' + ok + '<span class="muted" style="font-size:.45em"> / ' + n + '</span></div><p class="lead">' + p + ' %. ' + msg + '</p></div>' +
    '<div class="row"><button class="btn" id="qAgain" type="button">Nouveau QCM</button>' + (wrong.length ? '<button class="btn sec" id="qRetry" type="button">Refaire les ' + wrong.length + ' erreur' + (wrong.length > 1 ? 's' : '') + '</button>' : '') + '</div>' +
    (wrong.length ? '<h3 class="sec2">À revoir</h3>' + (Object.keys(chaps).length ? '<p class="muted">Chapitres concernés : ' + Object.keys(chaps).map(id => { const c = BYID[id], l = lienChap(c); return '<a href="' + l.href + '"' + l.data + '>' + esc(c.part.nom) + ' · ch. ' + (c.idx + 1) + '</a>'; }).join(', ') + '.</p>' : '') +
      '<div class="review">' + wrong.map(x => { const good = x.opts.filter(o => o.ok)[0]; return '<div class="rev"><b>' + qtxt(x.q.q) + '</b><div class="a"><span class="err">Ta réponse :</span> ' + (x.opts[x.pick] ? qtxt(x.opts[x.pick].t) : '—') + '</div><div class="a"><span class="ok-t">Bonne réponse :</span> ' + qtxt(good.t) + '</div><div class="a muted">' + qtxt(x.q.e) + '</div></div>'; }).join('') + '</div>' : '<p>Aucune erreur. Passe aux cartes ou à un autre chapitre.</p>');
  $('#qAgain', el).addEventListener('click', () => { qs = null; renderQcm(); });
  const r = $('#qRetry', el);
  if (r) r.addEventListener('click', () => { const l = wrong.map(x => x.q); qs = { cfg: { scope: 'retry', count: l.length, mode: 'direct' }, items: shuffle(l).map(prepQ), i: 0, done: false, locked: false }; renderQcm(); window.scrollTo(0, 0); });
}

/* ---------- cartes mémoire ---------- */
let cs = { scope: 'all', filter: 'all', list: [], i: 0, flip: false, built: false };
function buildCards(shuf) {
  let l = CARDS.filter(c => inScope(c, cs.scope));
  if (cs.filter === 'todo') l = l.filter(c => store.cards[c.f] !== 'known');
  if (cs.filter === 'again') l = l.filter(c => store.cards[c.f] === 'again');
  cs.list = shuf ? shuffle(l) : l; cs.i = 0; cs.flip = false; cs.built = true;
}
function renderCards(rebuild) {
  const el = $('#v-cartes');
  if (rebuild !== false && (!cs.built || rebuild === true)) buildCards(false);
  const known = CARDS.filter(c => store.cards[c.f] === 'known').length, c = cs.list[cs.i];
  el.innerHTML = '<div class="head"><span class="eyebrow">Mémorisation</span><h2>Cartes mémoire</h2><p class="lead">Réponds de tête, retourne la carte, puis dis si tu savais. ' + known + ' carte' + (known > 1 ? 's' : '') + ' sue' + (known > 1 ? 's' : '') + ' sur ' + CARDS.length + '.</p></div>' +
    '<div class="chips" style="margin-bottom:10px">' + scopeChips('cs', cs.scope) + '</div>' +
    '<div class="chips" style="margin-bottom:6px">' + chipRow('cfl', [['all', 'Toutes'], ['todo', 'Pas encore sues'], ['again', 'À revoir']], cs.filter).replace('<div class="chips">', '').replace(/<\/div>$/, '') + '<button class="ghost" id="cShuf" type="button">Mélanger</button></div>' +
    (c ? '<div class="qhead" style="margin-top:14px"><span>Carte ' + (cs.i + 1) + ' / ' + cs.list.length + '</span><span>' + chLab(c) + (store.cards[c.f] === 'known' ? ' · sue' : store.cards[c.f] === 'again' ? ' · à revoir' : '') + '</span></div>' +
      '<div class="cardwrap"><div role="button" tabindex="0" class="fcard' + (cs.flip ? ' flip' : '') + '" id="fc" aria-label="Retourner la carte"><div class="face front"><span class="lab">Question</span><div class="big">' + esc(c.f) + '</div><span class="muted" style="font-size:13px">Touche pour retourner</span></div><div class="face back"><span class="lab">Réponse</span><div class="ans">' + esc(c.v) + '</div></div></div></div>' +
      '<div class="fc-actions"><button class="btn sec" id="cAgain" type="button">À revoir</button><button class="btn" id="cKnown" type="button">Je savais</button></div><p class="muted" style="font-size:13px;margin-top:12px">Clavier : espace pour retourner, flèches pour changer de carte.</p>'
      : '<div class="panel" style="margin-top:14px"><b>Aucune carte dans ce filtre.</b><p class="muted">Change de chapitre ou de filtre. Si tu as tout su, bravo.</p></div>');
  $$('.chip[data-k]', el).forEach(b => b.addEventListener('click', () => { cs.filter = b.dataset.v; buildCards(false); renderCards(false); }));
  $$('.chip[data-cs]', el).forEach(b => b.addEventListener('click', () => { cs.scope = b.dataset.cs; buildCards(false); renderCards(false); }));
  $('#cShuf', el).addEventListener('click', () => { buildCards(true); renderCards(false); });
  if (c) {
    $('#fc', el).addEventListener('click', flipCard);
    $('#fc', el).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); flipCard(); } });
    $('#cKnown', el).addEventListener('click', () => { store.cards[c.f] = 'known'; save(); cardAdvance(); });
    $('#cAgain', el).addEventListener('click', () => { store.cards[c.f] = 'again'; save(); cardAdvance(); });
  }
}
function flipCard() { cs.flip = !cs.flip; const f = $('#fc'); if (f) f.classList.toggle('flip', cs.flip); }
function cardMove(d) { if (!cs.list.length) return; cs.i = (cs.i + d + cs.list.length) % cs.list.length; cs.flip = false; renderCards(false); }
function cardAdvance() { if (cs.i < cs.list.length - 1) { cs.i++; cs.flip = false; renderCards(false); } else { buildCards(false); renderCards(false); } }
document.addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (current === 'qcm' && qs && !qs.done) {
    if (/^[1-4]$/.test(e.key)) qcmPick(parseInt(e.key, 10) - 1);
    else if (e.key === 'Enter' && !$('#qNext').disabled && e.target.tagName !== 'BUTTON') qcmNext();
  }
  if (current === 'cartes' && cs.list.length) {
    if (e.key === 'ArrowRight') cardMove(1); else if (e.key === 'ArrowLeft') cardMove(-1);
    else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); flipCard(); }
  }
});

/* ---------- calculateurs ---------- */
function renderTools() {
  const el = $('#v-outils');
  if (el.dataset.ready) return;
  el.dataset.ready = '1';
  el.innerHTML = '<div class="head"><span class="eyebrow">Vérification</span><h2>Calculateurs</h2><p class="lead">Pour contrôler tes résultats : chaque outil montre les étapes, comme tu dois les écrire en copie.</p></div>' +
    '<div class="tabs" role="tablist">' + TOOLS_ON.map((t, i) => '<button class="chip" role="tab" data-t="' + t.id + '" aria-selected="' + (i === 0) + '">' + esc(t.name) + '</button>').join('') + '</div>' +
    TOOLS_ON.map((t, i) => '<div class="tpanel" id="tp-' + t.id + '"' + (i === 0 ? '' : ' hidden') + '><p class="muted">' + esc(t.desc) + '</p><div class="tbody"></div></div>').join('');
  TOOLS_ON.forEach(t => t.fn($('#tp-' + t.id + ' .tbody', el)));
  $$('.chip[data-t]', el).forEach(b => b.addEventListener('click', () => {
    $$('.chip[data-t]', el).forEach(x => x.setAttribute('aria-selected', x === b));
    TOOLS_ON.forEach(t => { $('#tp-' + t.id, el).hidden = t.id !== b.dataset.t; });
  }));
}

/* ---------- mémo ---------- */
function renderMemo() {
  const el = $('#v-memo');
  const groupes = PARTS.filter(p => p.chapitres.some(c => c.retenir.length));
  el.innerHTML = '<div class="head"><span class="eyebrow">Réviser</span><h2>Mémo : l’essentiel</h2><p class="lead">Tout ce qu’il faut savoir écrire sans regarder, chapitre par chapitre. Imprime cette page ou enregistre-la en PDF pour réviser hors ligne.</p>' +
    '<div class="row"><button type="button" class="btn sm sec" id="printMemo">🖨 Imprimer ou enregistrer en PDF</button></div></div>' +
    groupes.map(p => '<h3 class="sec2" style="font-size:24px">' + esc(p.nom) + '</h3>' + p.chapitres.filter(c => c.retenir.length).map(c => { const l = lienChap(c);
      return '<div class="memo-ch"><h3><span class="sn">' + (c.idx + 1) + '</span><a href="' + l.href + '"' + l.data + ' style="color:inherit;text-decoration:none">' + R(c.titre) + '</a></h3><ul>' + c.retenir.map(x => '<li>' + R(x) + '</li>').join('') + '</ul></div>'; }).join('')).join('');
  $('#printMemo', el).addEventListener('click', () => window.print());
}

/* ---------- notes et plan de révision ---------- */
const PLAN = [
  ['Jour 1', 'Logique : propositions, connecteurs, tables de vérité', 'Chapitres 1 et 2', 'QCM Logique'],
  ['Jour 2', 'Logique : implication, circuits', 'Chapitres 3 et 4', 'Cartes Logique'],
  ['Jour 3', 'Arithmétique : division, premiers, PGCD', 'Chapitres 1 à 3', 'QCM Arithmétique'],
  ['Jour 4', 'Arithmétique : Euclide, Bézout, Gauss', 'Chapitres 4 et 5', 'Exercices diophantiens'],
  ['Jour 5', 'Arithmétique : congruences, restes chinois', 'Chapitres 6 et 7', 'Cartes Arithmétique'],
  ['Jour 6', 'Récurrence et second degré', 'Compléments', 'QCM mélangé'],
  ['Jour 7', 'Interro blanche et révision des erreurs', 'Page « Révisions »', 'Refaire les QCM ratés']
];
function renderNotes() {
  const el = $('#v-notes'), notes = store.notes || [];
  const totalCards = CARDS.length, doneCards = CARDS.filter(c => store.cards[c.f] === 'known').length, nd = EXOS.filter(x => store.done[x.id]).length;
  el.innerHTML = '<div class="head"><span class="eyebrow">Personnel</span><h2>Notes et plan de révision</h2><p class="lead">Écris tes propres notes, organise ton planning. Tout est sauvegardé dans ce navigateur.</p></div>' +
    '<div class="panel"><h3>✍️ Nouvelle note</h3><div class="fields" style="flex-direction:column;align-items:stretch">' +
    '<label class="field"><span>Titre</span><input class="inp wide" id="noteTitle" style="width:100%" placeholder="Ex. : Méthode pour Bézout"></label>' +
    '<label class="field"><span>Contenu</span><textarea class="notes-ta" id="noteBody" placeholder="Écris ici ta méthode, un exemple, une erreur à ne plus faire…"></textarea></label>' +
    '<div class="row" style="margin-top:8px"><button class="btn" id="noteSave" type="button">💾 Enregistrer la note</button><button class="btn sec" id="noteClear" type="button">Effacer le champ</button></div></div></div>' +
    '<h3 class="sec2">📌 Mes notes (' + notes.length + ')</h3>' +
    (notes.length ? '<div class="notes-list">' + notes.map((n, i) => '<div class="note-card"><div class="h"><span class="t">' + esc(n.title || '(sans titre)') + '</span><button class="ghost" data-del="' + i + '" title="Supprimer" aria-label="Supprimer la note">✕</button></div><div class="b">' + esc(n.body || '').replace(/\n/g, '<br>') + '</div><div class="d">' + esc(n.date) + '</div></div>').join('') + '</div>' : '<p class="muted">Aucune note pour l’instant. Ajoute ta première note ci-dessus.</p>') +
    '<h3 class="sec2">📅 Plan de révision suggéré (7 jours)</h3><p class="muted">Un rythme simple pour couvrir tout le programme.</p>' +
    '<div class="plan-grid">' + PLAN.map(d => '<div class="day"><b>' + d[0] + '</b><ul><li>' + d[1] + '</li><li><em>' + d[2] + '</em></li><li>' + d[3] + '</li></ul></div>').join('') + '</div>' +
    '<h3 class="sec2">📊 Bilan</h3><div class="stats"><div class="stat"><b>Exercices faits</b><div class="n"><span>' + nd + ' / ' + EXOS.length + '</span><span>' + pct(nd, EXOS.length) + '%</span></div><div class="bar"><i style="width:' + pct(nd, EXOS.length) + '%"></i></div></div>' +
    '<div class="stat"><b>Cartes sues</b><div class="n"><span>' + doneCards + ' / ' + totalCards + '</span><span>' + pct(doneCards, totalCards) + '%</span></div><div class="bar"><i style="width:' + pct(doneCards, totalCards) + '%"></i></div></div>' +
    '<div class="stat"><b>Meilleure interro blanche</b><div class="n"><span>' + (TOUT ? 'Tout mélangé' : esc(PAGE.nom)) + '</span><span>' + ((store.qcm[TOUT ? 'all' : CH] && store.qcm[TOUT ? 'all' : CH].best) || 0) + '%</span></div><div class="bar"><i style="width:' + ((store.qcm[TOUT ? 'all' : CH] && store.qcm[TOUT ? 'all' : CH].best) || 0) + '%"></i></div></div></div>';
  $('#noteSave', el).addEventListener('click', () => {
    const t = $('#noteTitle', el).value.trim(), b = $('#noteBody', el).value.trim();
    if (!t && !b) { alert('Écris un titre ou un contenu.'); return; }
    const d = new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const l = store.notes || []; l.unshift({ title: t, body: b, date: d }); store.notes = l; save(); renderNotes();
  });
  $('#noteClear', el).addEventListener('click', () => { $('#noteTitle', el).value = ''; $('#noteBody', el).value = ''; });
  $$('[data-del]', el).forEach(b => b.addEventListener('click', () => { const l = store.notes || []; l.splice(+b.dataset.del, 1); store.notes = l; save(); renderNotes(); }));
}

/* ---------- démarrage ---------- */
squelette();
$('#themeBtn').addEventListener('click', cycleTheme);
$('#themeBtn2').addEventListener('click', cycleTheme);
applyTheme();
cfg.scope = 'all'; cs.scope = 'all';
let h = ''; try { h = (location.hash || '').replace('#', ''); } catch (e) {}
show(VIEWS.indexOf(h) >= 0 || OWN.some(c => c.id === h) || MAJ[h] ? h : 'accueil', 'replace');
hubSave();
window.MATHS = { PARTS, CHAPS, OWN, QCM, CARDS, EXOS, TOOLS, store: () => store, show, chSteps, renderQuiz };
})();
