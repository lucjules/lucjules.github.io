/* Tests du jeu Voie libre (jeux/voie-libre), lancés par la GitHub Action à chaque modification :
     node outils/tester-voie-libre.js            (depuis la racine du site, Playwright installé dans outils/)
   - le parcours généré est toujours franchissable ;
   - chaque mécanisme se comporte comme prévu (scénarios joués image par image avec window.VL) ;
   - une ancienne sauvegarde se charge sans perte ;
   - aucune erreur JavaScript, y compris en dessinant chaque quartier. */
const path = require('path');
const { chromium } = require('playwright');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'jeux/voie-libre/index.html');
let echecs = 0;
const verifier = (nom, ok, detail) => {
  console.log((ok ? '  ✓ ' : '  ✗ ') + nom + (ok ? '' : ' : ' + JSON.stringify(detail)));
  if (!ok) echecs++;
};

(async () => {
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await page.goto(PAGE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  console.log('Parcours franchissable');
  const parcours = await page.evaluate(() => {
    const RAMPE = 6, echecs = [];
    for (let g = 1; g <= 60; g++) {
      const r = VL.alea(g);
      let z = 45;
      const objs = [];
      while (z < 5000) {
        const t = VL.troncon(r, z, z);
        objs.push(...t.o.filter(o => o.t == 'train'));
        z = t.fin;
      }
      // une rampe se monte sur ses 6 premiers mètres ; un wagon plat se saute par l'avant (1,5 m)
      const entree = o => (o.ramp ? RAMPE : o.plat ? 1.5 : 0);
      const mur = (l, z) => objs.some(o => o.l == l && (o.vit ? z >= o.z0 - 70 && z <= o.z1 : z >= o.z0 + entree(o) && z <= o.z1));
      const rampe = (l, z) => objs.some(o => o.l == l && entree(o) && z >= o.z0 && z < o.z0 + entree(o));
      const toit = (l, z) => objs.some(o => !o.vit && o.l == l && z >= o.z0 && z <= o.z1);
      let sol = [1, 1, 1], haut = [0, 0, 0];
      for (let zz = 45; zz < z - 1; zz += 0.5) {
        const S2 = [0, 0, 0], H2 = [0, 0, 0];
        for (let l = 0; l < 3; l++) {
          if (sol[l]) { if (rampe(l, zz)) H2[l] = 1; else if (!mur(l, zz)) S2[l] = 1; }
          if (haut[l]) { if (toit(l, zz)) H2[l] = 1; else if (!mur(l, zz)) S2[l] = 1; }
        }
        for (let k = 0; k < 3; k++)
          for (let l = 0; l < 3; l++)
            for (const m of [l - 1, l + 1]) {
              if (m < 0 || m > 2) continue;
              if (S2[l] && !mur(m, zz) && !rampe(m, zz)) S2[m] = 1;
              if (H2[l] && toit(m, zz)) H2[m] = 1;
              if (H2[l] && !mur(m, zz) && !rampe(m, zz)) S2[m] = 1;
            }
        sol = S2;
        haut = H2;
        if (!sol.some(Boolean) && !haut.some(Boolean)) { echecs.push({ graine: g, z: zz }); break; }
      }
    }
    return echecs;
  });
  verifier('60 parcours de 5 km sans impasse', parcours.length == 0, parcours);

  console.log('Mécanismes');
  const R = await page.evaluate(() => {
    VL.D.tuto = 1;
    function scen({ objs = [], bonus = {}, actions = [], duree = 2.2, cles = 0, planches = 0, avant }) {
      VL.D.cles = cles;
      VL.D.planches = planches;
      VL.demarrer('libre');
      const z = VL.P.z;
      VL.objs().length = 0;
      VL.pieces().length = 0;
      VL.bonus().length = 0;
      VL.tunnels().length = 0;
      for (const o of objs) VL.objs().push({ y0: 0, ...o, z0: o.z0 + z, z1: o.z1 + z });
      Object.assign(VL.S.bonus, bonus);
      if (avant) avant(z);
      const faits = new Set();
      let yMax = 0;
      for (let i = 0; i < duree * 60 && VL.S.mode == 'jeu'; i++) {
        actions.forEach(([az, a], k) => {
          if (!faits.has(k) && VL.P.z - z >= az) {
            faits.add(k);
            VL[a]();
          }
        });
        VL.avancer(1 / 60);
        yMax = Math.max(yMax, VL.P.y);
      }
      return { mode: VL.S.mode, y: +VL.P.y.toFixed(2), yMax: +yMax.toFixed(2), voie: VL.P.voie, pieces: VL.S.pieces, compteurs: { ...VL.S.compteurs } };
    }
    const bas = { t: 'bas', l: 1, z0: 15, z1: 15.5 }, haut = { t: 'haut', l: 1, z0: 15, z1: 15.5 };
    const mur = { t: 'train', l: 1, z0: 15, z1: 30, ramp: false, c: 0 };
    const caisse = { t: 'caisse', l: 1, z0: 15, z1: 15.8 };
    const drone = { t: 'drone', la: 1, lb: 2, l: 1, z0: 15, z1: 15.6, ph: Math.PI };
    const ligne = l => [0, 1, 2, 3, 4].map(i => ({ x: (l - 1) * 2.2, y: 0.5, z: 10 + i * 2.5, a: 0 }));
    const out = {};
    out.barriere = [scen({ objs: [bas] }).mode, scen({ objs: [bas], actions: [[12, 'sauter']] }).mode];
    out.portique = [scen({ objs: [haut], actions: [[11, 'glisser']] }).mode, scen({ objs: [haut], actions: [[12, 'sauter']] }).mode];
    out.wagon = [scen({ objs: [mur] }).mode, scen({ objs: [mur], actions: [[5, 'gauche']] }).mode];
    out.rampe = scen({ objs: [{ t: 'train', l: 1, z0: 10, z1: 40, ramp: true, c: 1 }], duree: 1.9 }).y;
    out.trebuche = scen({ objs: [{ t: 'train', l: 0, z0: -5, z1: 60, ramp: false, c: 0 }], actions: [[3, 'gauche'], [12, 'gauche']] }).mode;
    out.superSaut = scen({ objs: [mur], bonus: { saut: 20 }, actions: [[8, 'sauter']], duree: 1.6 }).y;
    out.aimant = scen({ bonus: { aimant: 20 }, duree: 1.5, avant: z => VL.pieces().push(...[...ligne(0), ...ligne(2)].map(c => ({ ...c, z: c.z + z }))) }).pieces;
    out.enFace = scen({ objs: [{ t: 'train', l: 1, z0: 60, z1: 72, ramp: false, c: 3, vit: 12 }], actions: [[10, 'droite']], duree: 4 }).mode;
    out.caisse = [scen({ objs: [caisse] }).mode, scen({ objs: [caisse], actions: [[11, 'sauter'], [14.2, 'glisser']] }).compteurs.caisses];
    out.drone = [scen({ objs: [drone] }).mode, scen({ objs: [drone], actions: [[11, 'glisser']], duree: 1.6 }).compteurs.drones];
    out.accelerateur = scen({ objs: [{ t: 'pad', l: 1, z0: 6, z1: 8.6 }, mur] }).mode;
    out.planche = scen({ objs: [mur], planches: 1, actions: [[2, 'utiliserPlanche']] }).mode;
    out.bulle = scen({ objs: [mur], bonus: { bulle: 10 } }).mode;
    out.jetpack = scen({ objs: [mur, bas, haut], bonus: { jetpack: 3 }, duree: 2.5 }).yMax;
    out.jetpackTunnel = scen({ bonus: { jetpack: 4 }, duree: 2.5, avant: z => VL.tunnels().push({ z0: z + 20, z1: z + 200, c: [200, 200, 200] }) }).y;
    out.superSautTunnel = scen({ objs: [{ t: 'train', l: 1, z0: 5, z1: 80, ramp: true, c: 1 }], bonus: { saut: 20 }, actions: [[20, 'sauter']], duree: 1.4, avant: z => VL.tunnels().push({ z0: z + 15, z1: z + 200, c: [200, 200, 200] }) }).yMax;
    out.elan = scen({ objs: [mur], avant: () => { VL.D.elans = 1; VL.utiliserElan(); } }).mode;
    out.continuer = (() => {
      const a = scen({ objs: [mur], cles: 1 }).mode;
      VL.continuer();
      VL.avancer(1);
      return [a, VL.S.mode];
    })();
    out.niveau = (() => {
      VL.demarrer('niveau', 0);
      let i = 0;
      while (VL.S.mode == 'jeu' && i++ < 7200) { VL.S.invu = 1e9; VL.avancer(1 / 60); }
      return [VL.S.raison, VL.D.niveaux[0] > 0];
    })();
    out.defi = (() => {
      VL.demarrer('defi');
      let i = 0;
      while (VL.S.mode == 'jeu' && i++ < 60 * 70) { VL.S.invu = 1e9; VL.avancer(1 / 60); }
      return VL.S.raison;
    })();
    out.plat = [scen({ objs: [{ t: 'train', l: 1, z0: 15, z1: 40, ramp: false, plat: true, c: 0 }] }).mode, scen({ objs: [{ t: 'train', l: 1, z0: 15, z1: 60, ramp: false, plat: true, c: 0 }], actions: [[11, 'sauter']], duree: 1.6 }).y];
    out.figures = scen({ planches: 1, actions: [[2, 'utiliserPlanche'], [6, 'sauter'], [22, 'sauter']], duree: 2.2 }).compteurs.figures;
    out.coffre = (() => {
      VL.D.coffres = 3;
      const avant = VL.D.st.coffres, res = [VL.ouvrirCoffre(), VL.ouvrirCoffre(), VL.ouvrirCoffre()];
      return [res.every(x => x && x.txt), VL.D.coffres, VL.D.st.coffres - avant, VL.ouvrirCoffre()];
    })();
    out.trophees = VL.D.trophees.includes('depart');
    out.scores = VL.D.scores.length > 0;
    return out;
  });
  const egal = (nom, v, attendu) => verifier(nom, JSON.stringify(v) == JSON.stringify(attendu), { obtenu: v, attendu });
  egal('barrière : heurtée, sautée', R.barriere, ['fin', 'jeu']);
  egal('portique : glissé, sauté', R.portique, ['jeu', 'fin']);
  egal('wagon : de face, esquivé', R.wagon, ['fin', 'jeu']);
  egal('rampe jusqu\'au toit', R.rampe, 2.3);
  egal('deux faux pas de suite', R.trebuche, 'fin');
  egal('super baskets sur un wagon', R.superSaut, 2.3);
  egal('aimant (10 pièces des autres voies)', R.aimant, 10);
  egal('wagon en face esquivé', R.enFace, 'jeu');
  egal('caisse : heurtée, écrasée', R.caisse, ['fin', 1]);
  egal('drone : heurté, glissé dessous', R.drone, ['fin', 1]);
  egal('accélérateur : traverse le wagon', R.accelerateur, 'jeu');
  egal('planche encaisse un choc', R.planche, 'jeu');
  egal('bulle encaisse un choc', R.bulle, 'jeu');
  egal('jetpack au-dessus de tout', R.jetpack, 8);
  verifier('jetpack plus bas sous un tunnel', R.jetpackTunnel <= 4.3, R.jetpackTunnel);
  verifier('plafond des tunnels', R.superSautTunnel <= 4.3, R.superSautTunnel);
  egal('élan de départ', R.elan, 'jeu');
  egal('continuer avec une clé', R.continuer, ['continuer', 'jeu']);
  egal('niveau terminé et enregistré', R.niveau, ['victoire', true]);
  egal('défi : fin au bout de 60 s', R.defi, 'temps');
  egal('wagon plat : heurté, sauté dessus', R.plat, ['fin', 1.1]);
  egal('figures sur la planche', R.figures, 2);
  egal('coffres mystère', R.coffre, [true, 0, 3, null]);
  egal('trophée et meilleurs scores enregistrés', [R.trophees, R.scores], [true, true]);

  console.log('Sauvegardes et rendu');
  await page.evaluate(() => localStorage.setItem('voie-libre', JSON.stringify({ record: 12840, pieces: 300, parties: 14, distance: 900, niv: { aimant: 2, saut: 1, x2: 0 }, son: 1 })));
  await page.reload();
  // les trophées déjà mérités sont accordés tout de suite : premier départ (+100) et score de 10 000 (+200)
  const ancienne = await page.evaluate(() => [VL.D.record, VL.D.pieces, VL.D.niv.aimant, VL.D.missions.length, VL.D.trophees.sort()]);
  egal('ancienne sauvegarde reprise, trophées déjà mérités accordés', ancienne, [12840, 600, 2, 3, ['depart', 's10k']]);
  for (const d of [200, 1400, 2600, 3800, 5000]) {
    await page.evaluate(d => {
      VL.D.tuto = 1;
      VL.demarrer('libre');
      while (VL.S.dist < d) { VL.S.invu = 1e9; VL.avancer(1); }
      VL.S.invu = 1e9;
    }, d);
    await page.waitForTimeout(300);
  }
  for (const id of ['b-missions', 'b-trophees', 'b-niveaux', 'b-boutique', 'b-reglages', 'b-aide']) {
    await page.evaluate(() => VL.menu());
    await page.evaluate(id => document.getElementById(id).click(), id);
    await page.waitForTimeout(100);
  }
  verifier('aucune erreur JavaScript', erreurs.length == 0, erreurs);

  await navigateur.close();
  console.log(echecs ? echecs + ' test(s) en échec.' : 'Tous les tests de Voie libre passent.');
  process.exit(echecs ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
