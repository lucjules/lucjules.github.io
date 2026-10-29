/* Régénère les fichiers dérivés du site. À relancer après l'ajout ou la modification d'un chapitre :
     cd outils && npm install && npx playwright install chromium   (la première fois)
     node outils/construire.js                                      (depuis la racine du site)
   - assets/recherche-index.js : index de la recherche de la page d'accueil, construit en ouvrant
     chaque chapitre dans un navigateur et en lisant le texte de chaque leçon ;
   - sw.js : liste des fichiers à garder hors ligne et numéro de version du cache. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

const RACINE = path.resolve(__dirname, '..');
const url = f => 'file://' + path.join(RACINE, f);
const propre = s => String(s || '').replace(/\s+/g, ' ').trim();

// Pages de maths : un chapitre par thème des données communes (maths/app.js)
const MATHS_PAGES = { logique: 'logique.html', arith: 'arithmetique.html', recurrence: 'recurrence.html', second: 'second-degre.html' };

async function indexer(page) {
  const entrees = [];
  await page.goto(url('cours.html')); // accueil des cours : une carte par matière
  const matieres = await page.$$eval('.grid a.card', as => as.map(a => ({ href: a.getAttribute('href'), nom: a.querySelector('h2').innerText })));
  for (const m of matieres) {
    const dir = path.dirname(m.href);
    await page.goto(url(m.href));
    const chapitres = await page.$$eval('.grid a.card', as => as.map(a => ({ href: a.getAttribute('href'), nom: a.querySelector('h3').innerText })));
    for (const ch of chapitres) {
      const f = dir + '/' + ch.href;
      await page.goto(url(f));
      await page.waitForTimeout(150);
      const base = { m: m.nom, c: ch.nom };
      const estMaths = await page.evaluate(() => typeof FICHES !== 'undefined' && typeof CH !== 'undefined');
      if (estMaths) {
        const d = await page.evaluate(() => {
          const txt = h => { const e = document.createElement('div'); e.innerHTML = h; const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), r = []; while (w.nextNode()) r.push(w.currentNode.nodeValue); return r.join(' '); };
          return { ch: CH, fiches: (FICHES[CH] || []).map(x => ({ t: x.t, x: txt(x.h) })),
            exos: EXOS.map(g => ({ g: g.g, x: g.items.map(i => i.n + ' ' + i.q + ' ' + txt(i.s)).join(' ') })),
            cartes: CARDS.map(c => c.f + ' ' + c.v).join(' '), outils: TOOLS.map(t => t.name || t.t || t.title || '').join(', ') };
        });
        if (d.ch === 'all') continue; // la révision reprend le contenu des autres chapitres
        for (const x of d.fiches) entrees.push({ ...base, s: 'Fiche · ' + x.t, u: f + '#fiches', t: propre(x.x) });
        for (const g of d.exos) entrees.push({ ...base, s: 'Exercices · ' + g.g, u: f + '#exos', t: propre(g.x) });
        entrees.push({ ...base, s: 'Cartes mémoire', u: f + '#cartes', t: propre(d.cartes) });
        if (d.outils) entrees.push({ ...base, s: 'Calculateurs', u: f + '#outils', t: propre(d.outils) });
        continue;
      }
      const sections = await page.$$eval('.nav a[href^="#"]', as => as.map(a => ({ id: a.getAttribute('href'), titre: a.querySelector('.nav-t') ? a.querySelector('.nav-t').innerText : a.innerText })));
      for (const s of sections) {
        await page.evaluate(h => { location.hash = h; }, s.id);
        await page.waitForTimeout(60);
        const t = await page.$eval('#main', e => { const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), r = []; while (w.nextNode()) if (!w.currentNode.parentElement.closest('script,style')) r.push(w.currentNode.nodeValue); return r.join(' '); });
        entrees.push({ ...base, s: propre(s.titre), u: f + s.id, t: propre(t) });
      }
    }
  }
  return entrees;
}

function fichiersDuSite() {
  const ignores = new Set(['.git', 'outils', 'node_modules']);
  const res = [];
  (function parcourir(dir) {
    for (const n of fs.readdirSync(path.join(RACINE, dir)).sort()) {
      const rel = dir ? dir + '/' + n : n;
      if (ignores.has(n) || n.startsWith('.')) continue;
      if (fs.statSync(path.join(RACINE, rel)).isDirectory()) parcourir(rel);
      else if (!/\.(md|txt)$/.test(n) && n !== 'sw.js') res.push(rel);
    }
  })('');
  return res;
}

(async () => {
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ locale: 'fr-FR', timezoneId: 'Europe/Paris' });
  // Hasard figé (ordre des réponses des QCM) : deux lancements donnent exactement le même index
  await page.addInitScript(() => { let g = 42; Math.random = () => ((g = (g * 16807) % 2147483647) - 1) / 2147483646; });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  const index = await indexer(page);
  await navigateur.close();
  if (erreurs.length) throw new Error('Erreurs JavaScript pendant l\'indexation :\n' + erreurs.join('\n'));

  fs.writeFileSync(path.join(RACINE, 'assets/recherche-index.js'),
    '/* Généré par outils/construire.js : ne pas modifier à la main. */\nwindow.RECHERCHE_INDEX=' + JSON.stringify(index) + ';\n');

  const fichiers = fichiersDuSite();
  const h = crypto.createHash('sha1');
  for (const f of fichiers) h.update(f).update(fs.readFileSync(path.join(RACINE, f)));
  const sw = path.join(RACINE, 'sw.js');
  const bloc = '// <généré>\nconst VERSION = \'' + h.digest('hex').slice(0, 10) + '\';\nconst FICHIERS = [\n  \'./\',\n' +
    fichiers.map(f => '  \'' + f + '\'').join(',\n') + '\n];\n// </généré>';
  fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/\/\/ <généré>[\s\S]*?\/\/ <\/généré>/, bloc));

  const taille = fs.statSync(path.join(RACINE, 'assets/recherche-index.js')).size;
  console.log(index.length + ' sections indexées (' + Math.round(taille / 1024) + ' Ko), ' + fichiers.length + ' fichiers pour le hors ligne.');
})().catch(e => { console.error(e.message || e); process.exit(1); });
