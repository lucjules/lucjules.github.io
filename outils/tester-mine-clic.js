/* Tests du jeu Mine Clic (jeux/mine-clic), lancés par la GitHub Action à chaque modification :
     node outils/tester-mine-clic.js            (depuis la racine du site, Playwright installé dans outils/)
   Le jeu est ouvert dans Chromium, servi par un petit serveur local, puis joué par le script :
   clics, blocs cassés, achats, production, coffres, creepers, dimensions, progrès, renaissance,
   sauvegarde (rechargement, absence, code à copier, sauvegarde abîmée), carte de l'accueil des jeux,
   affichage sur téléphone. Aucune erreur JavaScript n'est tolérée. */
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');

const RACINE = path.resolve(__dirname, '..');
let echecs = 0;
const verifier = (nom, ok, detail) => {
  console.log((ok ? '  ✓ ' : '  ✗ ') + nom + (ok ? '' : ' : ' + JSON.stringify(detail)));
  if (!ok) echecs++;
};
const egal = (nom, v, attendu) => verifier(nom, JSON.stringify(v) == JSON.stringify(attendu), { obtenu: v, attendu });
const proche = (nom, v, attendu, tol = 1e-6) => verifier(nom, Math.abs(v - attendu) <= tol * Math.max(1, Math.abs(attendu)), { obtenu: v, attendu });

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
function serveur() {
  return new Promise(ok => {
    const s = http.createServer((req, res) => {
      const f = path.join(RACINE, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!f.startsWith(RACINE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

(async () => {
  const srv = await serveur();
  const base = 'http://127.0.0.1:' + srv.address().port + '/';
  const navigateur = await chromium.launch();
  const ctx = await navigateur.newContext({ locale: 'fr-FR', viewport: { width: 1280, height: 800 } });
  const erreurs = [];
  const page = await ctx.newPage();
  page.on('pageerror', e => erreurs.push(e.message));
  page.on('console', m => { if (m.type() == 'error') erreurs.push(m.text()); });
  const ev = (f, a) => page.evaluate(f, a);
  const ouvrir = async () => { await page.goto(base + 'jeux/mine-clic/index.html'); await page.waitForFunction(() => window.MC); };

  console.log('Démarrage');
  await ouvrir();
  verifier('le jeu démarre', await ev(() => document.body.classList.contains('pret')));
  egal('partie neuve', await ev(() => [MC.etat().blocs, MC.etat().bloc, MC.etat().dim]), [0, 'herbe', 'surface']);
  verifier('12 machines dans la boutique', (await page.$$('#machines .machine')).length == 12);
  verifier('le cube est dessiné', await ev(() => { const c = document.getElementById('cube'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n > 1000; }));

  console.log('Nombres');
  egal('mise en forme des nombres', await ev(() => [MC.nombre(999), MC.nombre(1234567), MC.blocs(2.5e9), MC.blocs(1), MC.blocs(0), MC.nombre(0.15, true), MC.nombre(1e15)]),
    ['999', '1,234 million', '2,5 milliards de blocs', '1 bloc', '0 bloc', '0,1', '1 billiard']);

  console.log('Clics');
  for (let i = 0; i < 5; i++) await page.click('#bloc');
  const apres = await ev(() => ({ clics: MC.etat().clics, casses: MC.etat().casses, blocs: MC.etat().blocs, coups: MC.etat().coups }));
  egal('5 clics sur le bloc d\'herbe : il casse une fois', [apres.clics, apres.casses, apres.coups], [5, 1, 0]);
  proche('5 blocs minés + bonus de casse (5)', apres.blocs, 10 * (1 + 1 / 100) /* « Premier coup de pioche » ajoute 1 % dès le 2e clic */, 0.02);
  verifier('progrès « Premier coup de pioche » obtenu et annoncé', await ev(() => MC.etat().progres.includes('total-0')) && (await page.$$('.toast')).length >= 1);
  await page.focus('#bloc'); await page.keyboard.press('Enter');
  egal('au clavier aussi', await ev(() => MC.etat().clics), 6);

  console.log('Boutique');
  verifier('pas assez de blocs : achat refusé', !(await ev(() => { MC.etat().blocs = 10; return MC.acheterMachine('pioche'); })));
  const achat = await ev(() => { const S = MC.etat(); S.blocs = 1000; S.total = 1000; const ok = MC.acheterMachine('pioche'); return { ok, blocs: S.blocs, n: S.machines.pioche, prix: MC.prixMachine({ prix: 15 }, 1, 1) }; });
  egal('une pioche en bois achetée 15 blocs', [achat.ok, achat.blocs, achat.n, achat.prix], [true, 985, 1, 18]);
  egal('prix de 10 machines d\'un coup', await ev(() => MC.prixMachine({ prix: 100 }, 0, 10)), Math.ceil(100 * (Math.pow(1.15, 10) - 1) / 0.15));
  const amel = await ev(() => { const c0 = MC.calc().clic; MC.recalculer(); const vu = !!document.querySelector('.amel[data-id="pioche-pierre"]'); const ok = MC.acheterAmel('pioche-pierre'); return { vu, ok, rapport: MC.calc().clic / c0 }; });
  verifier('la pioche en pierre apparaît après 50 blocs', amel.vu, amel);
  verifier('et double la valeur d\'un clic', amel.ok && Math.abs(amel.rapport - 2) < 0.05, amel);
  verifier('une amélioration achetée ne peut pas l\'être deux fois', !(await ev(() => { MC.etat().blocs = 1e9; return MC.acheterAmel('pioche-pierre'); })));
  const prod = await ev(() => { const S = MC.etat(); S.blocs = 1e6; S.total = 1e6; for (let i = 0; i < 10; i++) MC.acheterMachine('mineur'); const b0 = S.blocs, cps = MC.calc().cps; MC.avancer(100); return { cps, gain: S.blocs - b0 }; });
  verifier('les machines produisent', prod.cps > 10, prod);
  proche('production sur 100 s', prod.gain, prod.cps * 100, 1e-3);
  egal('palier : 1 mineur débloque « Outils affûtés »', await ev(() => !!document.querySelector('.amel[data-id="mineur-1"]')), true);

  console.log('Coffres et creepers');
  const coffre = await ev(() => { const b0 = MC.etat().blocs; MC.apparaitre('coffre'); const vu = !!document.querySelector('.evenement.coffre'); MC.finir(true); return { vu, n: MC.etat().coffres, parti: !document.querySelector('.evenement'), gainOuEffet: MC.etat().blocs > b0 || document.querySelectorAll('.effet').length > 0 || MC.calc().frenesie || MC.calc().ruee || MC.calc().eclair }; });
  verifier('un coffre apparaît, s\'ouvre et donne quelque chose', coffre.vu && coffre.n == 1 && coffre.parti && coffre.gainOuEffet, coffre);
  await page.click('#bloc'); // laisse le temps à l'affichage
  const creeper = await ev(() => { MC.apparaitre('creeper'); MC.finir(true); MC.apparaitre('creeper'); MC.finir(false); return [MC.etat().creepers, MC.etat().boums, MC.etat().progres.includes('boum'), MC.etat().progres.includes('creeper-1')]; });
  egal('creeper désamorcé, puis creeper qui explose (et progrès)', creeper, [1, 1, true, true]);
  verifier('un coffre clic à la souris', await (async () => { await ev(() => MC.apparaitre('coffre')); await page.waitForTimeout(450); await page.click('.evenement', { force: true }); return ev(() => MC.etat().coffres == 2 && !document.querySelector('.evenement')); })());
  verifier('un coffre disparaît tout seul si on ne clique pas', await (async () => { await ev(() => MC.apparaitre('creeper')); await page.waitForTimeout(4300); return ev(() => !document.querySelector('.evenement') && MC.etat().boums == 2); })());

  console.log('Dimensions');
  const dims = await ev(() => { const S = MC.etat(); S.totalAll = 2e7; MC.avancer(0); return [S.dims.slice(), S.dim]; });
  egal('les grottes, les profondeurs et le cœur de la mine se débloquent', dims, [['surface', 'grottes', 'profondeurs', 'coeur'], 'coeur']);
  const nether = await ev(() => { const S = MC.etat(); S.blocs = 1e9; S.total = 1e9; MC.acheterMachine('nether'); return [S.dims.includes('nether'), S.dim, ['netherrack', 'quartz', 'glowstone'].includes(S.bloc)]; });
  egal('un portail du Nether ouvre le Nether', nether, [true, 'nether', true]);
  await page.click('.dim[aria-label="Aller : La surface"]');
  egal('retour à la surface par le bouton', await ev(() => MC.etat().dim), 'surface');
  verifier('chaque bloc se dessine', await ev(() => Object.keys(MC_DONNEES.BLOCS).every(b => { const t = MC_TEXTURES.texture(b); return t.dessus.width == 16 && t.couleurs.length > 5; })));

  console.log('Renaissance');
  const ren = await ev(() => { const S = MC.etat(); S.totalAll = 8e9; const g = MC.gainEtoiles(); const m0 = MC.calc().mult; const ok = MC.renaitre(); return { g, ok, etoiles: S.etoiles, blocs: S.blocs, machines: Object.keys(S.machines).length, amels: S.amels.length, garde: S.progres.length > 5, rapport: MC.calc().mult / m0 }; });
  egal('8 milliards minés : 2 étoiles du Nether', [ren.g, ren.ok, ren.etoiles], [2, true, 2]);
  egal('tout repart de zéro sauf les progrès', [ren.blocs, ren.machines, ren.amels, ren.garde], [0, 0, 0, true]);
  verifier('les étoiles augmentent la production', ren.rapport > 1.03, ren);
  verifier('pas de deuxième renaissance sans miner plus', !(await ev(() => MC.renaitre())));

  console.log('Sauvegarde');
  await ev(() => { const S = MC.etat(); S.blocs = 5e5; S.total = 5e5; MC.acheterMachine('golem'); MC.acheterMachine('golem'); MC.sauver(); });
  await ouvrir();
  egal('la partie revient après rechargement', await ev(() => [MC.etat().etoiles, MC.etat().machines.golem, MC.etat().coffres]), [2, 2, 2]);
  const cpsAvant = await ev(() => MC.calc().cpsBase);
  // en quittant, le jeu enregistre l'heure : la sauvegarde est modifiée depuis une autre page du site
  await page.goto(base + 'jeux.html');
  const blocsAvant = await ev(() => { const d = JSON.parse(localStorage.getItem('mine-clic')); d.derniere -= 3600e3; localStorage.setItem('mine-clic', JSON.stringify(d)); return d.blocs; });
  await ouvrir();
  const absence = await ev(() => ({ blocs: MC.etat().blocs, dlg: document.getElementById('dialogue').open, titre: document.getElementById('dlg-titre').textContent }));
  verifier('absence d\'une heure : fenêtre « Bon retour ! »', absence.dlg && absence.titre == 'Bon retour !', absence);
  proche('et la moitié de la production d\'une heure', absence.blocs - blocsAvant, cpsAvant * 3600 * 0.5, 0.01);
  await page.click('#dlg-boutons button');
  const code = await ev(() => { const c = MC.codeSauvegarde(); const d = MC.lireCode(c); return [typeof c, d && d.etoiles, d && d.machines.golem, MC.lireCode('pas un code')]; });
  egal('code de sauvegarde : aller-retour', code, ['string', 2, 2, null]);
  await page.goto(base + 'jeux.html');
  await ev(() => localStorage.setItem('mine-clic', '{"blocs":"beaucoup","machines":{"pioche":-4,"truc":3},"amels":["inconnue","pioche-fer","pioche-fer"],"dim":"lune","bloc":"diamant"}'));
  await ouvrir();
  egal('sauvegarde abîmée : nettoyée sans erreur', await ev(() => [MC.etat().blocs, MC.etat().machines, MC.etat().amels, MC.etat().dim, MC.etat().bloc]), [0, {}, ['pioche-fer'], 'surface', 'herbe']);
  await page.goto(base + 'jeux.html');
  await ev(() => localStorage.setItem('mine-clic', '{pas du json'));
  await ouvrir();
  egal('sauvegarde illisible : nouvelle partie', await ev(() => MC.etat().totalAll), 0);

  console.log('Écrans');
  await page.click('#o-progres');
  egal('onglet Progrès : un emplacement par progrès', await ev(() => document.querySelectorAll('#progres .trophee').length), await ev(() => MC_DONNEES.PROGRES.length));
  await page.click('#o-stats');
  verifier('onglet Stats rempli', await ev(() => document.querySelectorAll('#stats dt').length > 10));
  await page.click('#o-options');
  await page.click('#o-son');
  egal('le son se coupe', await ev(() => MC.etat().son), false);
  await page.click('#o-reset');
  await page.click('#dlg-boutons .rouge');
  egal('effacer la partie', await ev(() => [MC.etat().totalAll, MC.etat().son]), [0, false]);

  console.log('Accueil des jeux');
  await ev(() => { const S = MC.etat(); S.blocs = S.total = S.totalAll = 123456; MC.acheterMachine('pioche'); MC.sauver(); });
  await page.goto(base + 'jeux.html');
  const carte = await page.textContent('[data-jeu="mine-clic"]');
  verifier('la carte affiche la partie', /^Mine Clic : 123\s\d{3} blocs minés/.test(carte), carte);
  await page.goto(base + 'index.html');
  verifier('l\'accueil général aussi', /^Mine Clic/.test(await page.textContent('[data-jeu="mine-clic"]')));

  console.log('Téléphone');
  const ctxTel = await navigateur.newContext({ locale: 'fr-FR', viewport: { width: 360, height: 700 }, hasTouch: true, isMobile: true });
  const tel = await ctxTel.newPage();
  tel.on('pageerror', e => erreurs.push(e.message));
  await tel.goto(base + 'jeux/mine-clic/index.html');
  await tel.waitForFunction(() => window.MC);
  const t = await tel.evaluate(() => { const r = document.getElementById('bloc').getBoundingClientRect(), c = document.querySelector('.compteur').getBoundingClientRect(); return { large: document.documentElement.scrollWidth, haut: c.top, bas: r.bottom, ecran: innerHeight, mine: document.getElementById('mine').getBoundingClientRect().bottom }; });
  verifier('pas de défilement horizontal', t.large <= 360, t);
  verifier('compteur et bloc visibles dans la mine', t.haut >= 0 && t.bas <= t.mine, t);
  await tel.tap('#bloc');
  egal('toucher le bloc le mine', await tel.evaluate(() => MC.etat().clics), 1);

  await navigateur.close();
  srv.close();
  egal('aucune erreur JavaScript', erreurs, []);
  console.log(echecs ? '\n' + echecs + ' test(s) en échec' : '\nTous les tests passent.');
  process.exit(echecs ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
