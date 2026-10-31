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
  await ctx.addInitScript(() => { window.MC_SAISON = null; }); // pas d'événement saisonnier, sauf quand le test le demande
  const page = await ctx.newPage();
  page.on('pageerror', e => erreurs.push(e.message));
  page.on('console', m => { if (m.type() == 'error') erreurs.push(m.text()); });
  const ev = (f, a) => page.evaluate(f, a);
  const ouvrir = async () => { await page.goto(base + 'jeux/mine-clic/index.html'); await page.waitForFunction(() => window.MC); };

  console.log('Démarrage');
  await ouvrir();
  verifier('le jeu démarre', await ev(() => document.body.classList.contains('pret')));
  egal('partie neuve', await ev(() => [MC.etat().blocs, MC.etat().bloc, MC.etat().dim]), [0, 'herbe', 'surface']);
  verifier('14 machines dans la boutique', (await page.$$('#machines .machine')).length == 14);
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
  const ren = await ev(() => { const S = MC.etat(); S.totalAll = 8e8; const g = MC.gainEtoiles(); const m0 = MC.calc().mult; const ok = MC.renaitre(); return { g, ok, etoiles: S.etoiles, fragments: S.fragments, blocs: S.blocs, machines: Object.keys(S.machines).length, amels: S.amels.length, garde: S.progres.length > 5, rapport: MC.calc().mult / m0 }; });
  egal('800 millions minés : 2 étoiles du Nether et 2 fragments', [ren.g, ren.ok, ren.etoiles, ren.fragments], [2, true, 2, 2]);
  egal('tout repart de zéro sauf les progrès', [ren.blocs, ren.machines, ren.amels, ren.garde], [0, 0, 0, true]);
  verifier('les étoiles augmentent la production', ren.rapport > 1.03, ren);
  verifier('pas de deuxième renaissance sans miner plus', !(await ev(() => MC.renaitre())));

  console.log('Onglet Étoiles et boutique céleste');
  await page.click('#o-etoiles');
  const et = await ev(() => ({ titre: document.getElementById('et-nb').textContent, paliers: document.querySelectorAll('#et-paliers tr').length, pouvoirs: document.querySelectorAll('#pouvoirs .pouvoir').length, barre: document.getElementById('et-prochaine').textContent }));
  verifier('l\'onglet Étoiles explique la renaissance', et.titre == '2 étoiles du Nether' && et.paliers >= 8 && et.pouvoirs == 16 && /Étoile n° 3/.test(et.barre), et);
  verifier('seuils : 1 étoile à 100 millions, 3 à 2,7 milliards', await ev(() => MC.seuil(1) == 1e8 && MC.seuil(3) == 2.7e9));
  await page.click('#pouvoirs .pouvoir:nth-child(2) button'); // Gant de golem (2 fragments)
  egal('acheter le Gant de golem avec 2 fragments', await ev(() => [MC.etat().pouvoirs, MC.etat().fragments]), [['gant'], 0]);
  verifier('pas assez de fragments : refusé', !(await ev(() => MC.acheterPouvoir('depart'))));
  const gant = await ev(() => { const c0 = MC.calc().clicBase; MC.etat().fragments = 1; MC.acheterPouvoir('depart'); return { pouvoirs: MC.etat().pouvoirs.length, clic: c0 }; });
  verifier('le gant double les clics (2 × 1,0x)', gant.clic >= 2 && gant.pouvoirs == 2, gant);
  const depart = await ev(() => { const S = MC.etat(); S.totalAll = 2.7e9; MC.renaitre(); return [S.etoiles, S.machines.pioche, S.machines.mineur]; });
  egal('le sac de départ redonne 10 pioches et 5 mineurs', depart, [3, 10, 5]);

  console.log('Max, tout acheter, capacités, combo, blocs brillants, missions');
  const max = await ev(() => { const S = MC.etat(); S.qte = 'max'; S.blocs = 1e5; const m = MC_DONNEES.MACHINES[1], n0 = S.machines.mineur, q = MC.maxAchetable('mineur'); MC.acheterMachine('mineur'); return { q, achete: S.machines.mineur - n0, juste: MC.prixMachine(m, n0, q) <= 1e5 && MC.prixMachine(m, n0, q + 1) > 1e5 }; });
  verifier('Max achète le plus possible', max.q > 10 && max.achete == max.q && max.juste, max);
  await page.click('#o-boutique');
  await page.click('.qte button[data-q="max"]');
  egal('bouton Max sélectionné', await ev(() => [MC.etat().qte, document.querySelector('.qte button[data-q="max"]').getAttribute('aria-pressed')]), ['max', 'true']);
  await page.click('.qte button[data-q="1"]');
  const tout = await ev(() => { const S = MC.etat(); S.blocs = 1e9; S.total = 1e9; MC.recalculer(); const n0 = S.amels.length; const n = MC.acheterTout(); return { n, gagne: S.amels.length - n0 }; });
  verifier('« Tout acheter » achète plusieurs améliorations', tout.n > 5 && tout.n == tout.gagne, tout);
  const capa = await ev(() => { const S = MC.etat(); S.blocs = 1e9; S.total = Math.max(S.total, 1e9); S.qte = 1; MC.acheterMachine('tnt'); MC.recalculer(); const vue = !!document.querySelector('.capa[data-id="tnt"]'); const c0 = S.casses, b0 = S.blocs; const ok = MC.utiliserCapacite('tnt'); return { vue, ok, casse: S.casses - c0, gain: S.blocs > b0, encore: MC.utiliserCapacite('tnt') }; });
  egal('la TNT se débloque, casse le bloc, puis se recharge', [capa.vue, capa.ok, capa.casse, capa.gain, capa.encore], [true, true, 1, true, false]);
  const hate = await ev(() => { const S = MC.etat(); S.clics = Math.max(S.clics, 300); const c0 = MC.calc().clicBase; MC.utiliserCapacite('hate'); return MC.calc().clicBase / c0; });
  verifier('la potion de hâte multiplie les clics par 10', hate >= 10 && hate < 10.3, hate); // + 1 % si le progrès « Pouvoir activé » tombe en même temps
  await page.waitForTimeout(1100);
  for (let i = 0; i < 12; i++) await page.click('#bloc');
  const co = await ev(() => ({ n: MC.combo.n, max: MC.etat().comboMax, vu: !document.getElementById('combo').hidden }));
  verifier('cliquer vite fait monter le combo', co.n >= 10 && co.max >= 10 && co.vu, co);
  const br = await ev(() => { const S = MC.etat(); S.brillant = true; const b0 = S.blocs, n0 = S.brillants; S.coups = MC_DONNEES.BLOCS[S.bloc].durete - 1; MC.frapper(400, 300); return { n: S.brillants - n0, gain: S.blocs - b0 }; });
  verifier('un bloc brillant compte et rapporte gros', br.n == 1 && br.gain > 0, br);
  const mi = await ev(() => { const S = MC.etat(); const m = S.missions.find(x => x.id != 'combo') || S.missions[0]; const n0 = S.missionsFaites, b0 = S.blocs; if (m.id == 'combo') m.max = m.but; else m.depart -= m.but; MC.verifierMissions(); return { nb: S.missions.length, faites: S.missionsFaites - n0, gain: S.blocs > b0 }; });
  verifier('3 missions ; en finir une rapporte et la remplace', mi.nb == 3 && mi.faites >= 1 && mi.gain, mi); // une autre peut finir en même temps
  await page.click('#o-progres');
  egal('missions affichées dans l\'onglet Progrès', await ev(() => document.querySelectorAll('#missions .mission').length), 3);
  const saison = await ev(() => { window.MC_SAISON = 'halloween'; MC.apparaitre('coffre'); const img = document.querySelector('.evenement img').src; MC.finir(true); window.MC_SAISON = null; return { citrouilles: MC.etat().citrouilles, progres: MC.etat().progres.includes('halloween'), img: img.length > 100 }; });
  egal('Halloween : une citrouille remplace le coffre', [saison.citrouilles, saison.progres, saison.img], [1, true, true]);
  await page.click('#o-options');
  await page.click('#o-notation');
  egal('notation courte', await ev(() => MC.nombre(1234567)), '1,23 M');
  await page.click('#o-notation'); await page.click('#o-notation');
  egal('retour à la notation en mots', await ev(() => MC.nombre(1234567)), '1,234 million');

  console.log('Boss, familiers, collection, nuit, secrets');
  const boss = await ev(() => { const S = MC.etat(); S.totalAll = Math.max(S.totalAll, 1e6); MC.choisirDim('surface'); const b = MC.lancerBoss(); const vu = !document.getElementById('boss').hidden; const f0 = S.fragments, b0 = S.blocs; while (MC.boss()) MC.blesserBoss(5, 400, 300); return { nom: b.def.nom, vu, total: S.bossTotal, vaincus: S.bossVaincus.slice(), fragment: S.fragments - f0, gain: S.blocs > b0, cache: document.getElementById('boss').hidden }; });
  egal('un boss apparaît, se bat et rapporte (1 fragment la première fois)', [boss.nom, boss.vu, boss.total, boss.vaincus, boss.fragment, boss.gain, boss.cache], ['Zombie géant', true, 1, ['surface'], 1, true, true]);
  const coups = await ev(() => { MC.lancerBoss(); const pv0 = MC.boss().pv; return pv0; });
  for (let i = 0; i < 5; i++) await page.click('#bloc');
  egal('cliquer sur le boss lui retire des PV', await ev(() => MC.boss().pvMax - MC.boss().pv), 5);
  await ev(() => { MC.boss().fin = Date.now() - 1; });
  await page.waitForTimeout(250);
  egal('le boss s\'enfuit à la fin du temps', await ev(() => [MC.boss(), MC.etat().bossTotal, document.getElementById('bloc-info').hidden]), [null, 1, false]);
  const fam = await ev(() => { const S = MC.etat(); S.clics = Math.max(S.clics, 1000); MC.verifierFamiliers(); const c0 = MC.calc().clicBase; const auto = S.familier; MC.choisirFamilier('loup'); return { eus: S.familiers.slice(), auto, vu: !document.getElementById('familier').hidden }; });
  verifier('le loup s\'adopte à 1 000 clics et accompagne le mineur', fam.eus.includes('loup') && fam.auto && fam.vu, fam);
  const loup = await ev(() => { MC.choisirFamilier('loup'); const avec = MC.calc().clicBase; MC.etat().familier = null; MC.recalculer(); const sans = MC.calc().clicBase; MC.choisirFamilier('loup'); return avec / sans; });
  proche('le loup donne +50 % aux clics', loup, 1.5, 1e-9);
  const chat = await ev(() => { const S = MC.etat(); S.creepers = Math.max(S.creepers, 5); MC.verifierFamiliers(); MC.choisirFamilier('chat'); S.total = Math.max(S.total, 1e4); let creepers = 0; for (let i = 0; i < 40; i++) { MC.apparaitre(); if (document.querySelector('.evenement.creeper')) creepers++; MC.finir(true); } MC.choisirFamilier('loup'); return creepers; });
  egal('avec le chat, aucun creeper', chat, 0);
  const col = await ev(() => { const S = MC.etat(); MC.choisirDim('surface'); S.bloc = 'terre'; S.coups = 0; S.collection.terre = 24; const m0 = MC.calc().maitrise; for (let i = 0; i < 4; i++) MC.frapper(400, 300); return { n: S.collection.terre, m: MC.calc().maitrise - m0 }; });
  verifier('collection : 25 terres cassées = maîtrise 1', col.n >= 25 && col.m == 1, col); // « minage éclair » d'un coffre peut casser à chaque coup
  await page.click('#o-progres');
  egal('onglet Progrès : familiers et collection', await ev(() => [document.querySelectorAll('#familiers .pouvoir').length, document.querySelectorAll('#collection .carte-bloc').length]), [8, 17]);
  const nuit = await ev(() => { window.MC_PHASE = 0.8; MC.choisirDim('surface'); MC.majJourNuit(); const r = [MC.estNuit(), document.body.classList.contains('nuit')]; window.MC_PHASE = 0.2; MC.majJourNuit(); r.push(document.body.classList.contains('nuit')); window.MC_PHASE = null; return r; });
  egal('cycle jour et nuit à la surface', nuit, [true, true, false]);
  for (let i = 0; i < 10; i++) await page.click('.titre', { position: { x: 5, y: 5 } });
  verifier('progrès secret : cliquer 10 fois sur le titre', await ev(() => MC.etat().progres.includes('curieux')));
  const c0 = await ev(() => MC.etat().clics);
  await page.click('.compteur'); await page.keyboard.press('Space');
  egal('raccourci Espace : un coup de pioche', await ev(() => MC.etat().clics), c0 + 1);
  await page.click('#o-stats');
  verifier('graphique de production dessiné', await ev(() => { const c = document.getElementById('graphe'); return c.width > 0 && c.height > 0; }));

  console.log('Sauvegarde');
  await ev(() => { const S = MC.etat(); S.blocs = 5e5; S.total = 5e5; MC.acheterMachine('golem'); MC.acheterMachine('golem'); MC.sauver(); });
  await ouvrir();
  egal('la partie revient après rechargement', await ev(() => [MC.etat().etoiles, MC.etat().machines.golem, MC.etat().pouvoirs.length, MC.etat().missions.length]), [3, 2, 2, 3]);
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
  egal('code de sauvegarde : aller-retour', code, ['string', 3, 2, null]);
  await page.goto(base + 'jeux.html');
  await ev(() => localStorage.setItem('mine-clic', '{"etoiles":4,"blocs":"beaucoup","machines":{"pioche":-4,"truc":3},"amels":["inconnue","pioche-fer","pioche-fer"],"dim":"lune","bloc":"diamant"}'));
  await ouvrir();
  egal('sauvegarde abîmée ou ancienne : nettoyée, fragments rendus', await ev(() => [MC.etat().blocs, MC.etat().machines, MC.etat().amels, MC.etat().dim, MC.etat().bloc, MC.etat().fragments]), [0, {}, ['pioche-fer'], 'surface', 'herbe', 4]);
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
