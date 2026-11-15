/* Vérifie le cours de maths (maths/*.html), lancé par la GitHub Action :
     node outils/tester-maths.js        (depuis la racine du site ; Playwright et Chromium nécessaires)
   Pour chaque page (logique, arithmétique, récurrence, second degré, révisions), dans un navigateur :
   - aucune erreur JavaScript ;
   - chaque chapitre s'affiche, avec toutes ses parties, sans formule mal écrite (reste de « $ », « frac{ »…) ;
   - chaque démo interactive se monte ;
   - chaque mini-exercice « À toi » accepte sa bonne réponse et refuse une mauvaise ;
   - chaque exercice a un énoncé, une correction et un niveau ; identifiants uniques ;
   - chaque QCM a au moins 3 options distinctes et une explication ; questions de QCM et de cartes sans doublon.
   Le contenu s'écrit dans maths/cours-*.js (voir le README, « Ajouter ou modifier un chapitre de maths »). */
const { chromium } = require('playwright');
const path = require('path');
const RACINE = path.resolve(__dirname, '..');
const PAGES = ['logique', 'arithmetique', 'recurrence', 'second-degre', 'revision'];

(async () => {
  const navigateur = await chromium.launch();
  let echecs = 0;
  const cartes = {}, questions = {};
  for (const pg of PAGES) {
    const page = await navigateur.newPage({ viewport: { width: 1200, height: 900 } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push('erreur JavaScript : ' + String(e).slice(0, 200)));
    page.on('console', m => { if (m.type() === 'error') erreurs.push('console : ' + m.text().slice(0, 200)); });
    await page.goto('file://' + path.join(RACINE, 'maths', pg + '.html'));
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const M = window.MATHS, pb = [], suspect = (txt, ou) => {
        const i = txt.search(/\$/);
        if (i >= 0) pb.push(ou + ' : reste un « $ » près de « ' + txt.slice(Math.max(0, i - 25), i + 25).replace(/\s+/g, ' ') + ' »');
        const m = txt.match(/.{0,20}((frac|sqrt|text|bar)\{|undefined|\[object|NaN).{0,20}/);
        if (m) pb.push(ou + ' : texte parasite « ' + m[0] + ' »');
      };
      for (const c of M.OWN) {
        M.show(c.id);
        const v = document.getElementById('v-cours');
        suspect(v.textContent, 'chapitre ' + c.id);
        if (v.querySelectorAll('section.sec').length !== c.sections.length) pb.push('chapitre ' + c.id + ' : parties manquantes');
        v.querySelectorAll('figure.demo').forEach(f => { if (!f.querySelector('.demo-body').children.length) pb.push('chapitre ' + c.id + ' : démo vide « ' + f.dataset.demo + ' »'); });
        let k = 0;
        v.querySelectorAll('.try').forEach(t => {
          k++;
          const bonne = t.dataset.a.split('|')[0];
          t.querySelector('input').value = bonne; t.querySelector('[data-try]').click();
          if (!t.querySelector('.tfb').classList.contains('good')) pb.push('chapitre ' + c.id + ', « À toi » n°' + k + ' : la réponse « ' + bonne + ' » n’est pas acceptée');
          t.querySelector('input').value = '@@faux@@'; t._n = 0; t.querySelector('[data-try]').click();
          if (t.querySelector('.tfb').classList.contains('good')) pb.push('chapitre ' + c.id + ', « À toi » n°' + k + ' : une mauvaise réponse est acceptée');
        });
        if (c.quiz.length && !document.querySelector('#quizhost .qz')) pb.push('chapitre ' + c.id + ' : auto-test absent');
      }
      for (const vue of ['accueil', 'qcm', 'cartes', 'exos', 'outils', 'memo', 'notes']) {
        const el = document.getElementById('v-' + vue); if (!el) continue;
        M.show(vue); suspect(el.textContent, 'vue ' + vue);
        if (!el.textContent.trim()) pb.push('vue ' + vue + ' : vide');
      }
      const ids = {};
      M.EXOS.forEach(x => {
        if (ids[x.id]) pb.push('exercice ' + x.id + ' : identifiant en double'); ids[x.id] = 1;
        if (!x.q || !x.s) pb.push('exercice ' + x.id + ' : énoncé ou correction vide');
        if (![1, 2, 3].includes(x.niv)) pb.push('exercice ' + x.id + ' : niveau invalide');
      });
      const fronts = [], qtxt = [];
      M.CARDS.forEach(c => { fronts.push(c.f); if (!c.v) pb.push('carte « ' + c.f + ' » : réponse vide'); });
      M.QCM.forEach(q => {
        if (!q.o || q.o.length < 3) pb.push('QCM « ' + q.q.slice(0, 40) + ' » : moins de 3 options');
        else if (new Set(q.o).size !== q.o.length) pb.push('QCM « ' + q.q.slice(0, 40) + ' » : options en double');
        if (!q.e || q.e.length < 10) pb.push('QCM « ' + q.q.slice(0, 40) + ' » : explication trop courte');
        qtxt.push(q.q);
      });
      return { pb, fronts, qtxt, n: [M.OWN.length, M.EXOS.length, M.QCM.length, M.CARDS.length] };
    });
    const vus = {}, doublons = [];
    r.fronts.forEach(f => { if (vus[f]) doublons.push('carte en double sur la page : ' + f); vus[f] = 1; (cartes[f] = cartes[f] || []).push(pg); });
    const vq = {}; r.qtxt.forEach(q => { if (vq[q]) doublons.push('QCM en double sur la page : ' + q.slice(0, 50)); vq[q] = 1; (questions[q] = questions[q] || []).push(pg); });
    const tout = [...new Set(r.pb.concat(erreurs, doublons))];
    console.log(`${pg} : ${r.n[0]} chapitres, ${r.n[1]} exercices, ${r.n[2]} QCM, ${r.n[3]} cartes`);
    tout.slice(0, 30).forEach(x => console.log('  ✗ ' + x));
    echecs += tout.length;
    await page.close();
  }
  // Une même carte ou question ne doit pas figurer dans deux chapitres (la page « révisions » les rassemble toutes)
  const reps = Object.entries(cartes).filter(([, v]) => v.filter(p => p !== 'revision').length > 1);
  reps.slice(0, 10).forEach(([f, v]) => console.log('  ✗ carte présente dans plusieurs pages : ' + f + ' (' + v.join(', ') + ')'));
  echecs += reps.length;
  await navigateur.close();
  console.log(echecs ? '\n' + echecs + ' problème(s)' : '\nTout est bon.');
  process.exit(echecs ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
