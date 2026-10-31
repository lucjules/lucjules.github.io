/* Tests du jeu Voie libre (jeux/voie-libre), lancés par la GitHub Action à chaque modification :
     node outils/tester-voie-libre.js            (depuis la racine du site, Playwright installé dans outils/)
   1. Logique, directement dans Node (les modules du jeu n'ont pas besoin du navigateur) :
      - le parcours généré est toujours franchissable ;
      - chaque mécanisme se comporte comme prévu (scénarios joués image par image) ;
      - progression : niveaux, défi, coffres, trophées, événements, ancienne sauvegarde reprise sans perte.
   2. Dans Chromium, servi par un petit serveur local (les modules ES ne se chargent pas en file://) :
      le jeu démarre en 3D, chaque quartier se dessine, les écrans s'ouvrent, aucune erreur JavaScript. */
const path = require('path');
const fs = require('fs');
const http = require('http');
const { pathToFileURL } = require('url');

const RACINE = path.resolve(__dirname, '..');
const JEU = path.join(RACINE, 'jeux/voie-libre');
let echecs = 0;
const verifier = (nom, ok, detail) => {
  console.log((ok ? '  ✓ ' : '  ✗ ') + nom + (ok ? '' : ' : ' + JSON.stringify(detail)));
  if (!ok) echecs++;
};
const egal = (nom, v, attendu) => verifier(nom, JSON.stringify(v) == JSON.stringify(attendu), { obtenu: v, attendu });
const module_ = f => import(pathToFileURL(path.join(JEU, 'js', f)).href);

// stockage en mémoire à la place de localStorage
const stockage = (depart = null) => {
  let d = depart;
  return { lire: () => (d ? JSON.parse(JSON.stringify(d)) : null), ecrire: x => (d = JSON.parse(JSON.stringify(x))), effacer: () => (d = null), voir: () => d };
};

async function logique() {
  const { alea } = await module_('hasard.js');
  const { troncon, RAMPE } = await module_('parcours.js');
  const { Course } = await module_('course.js');
  const { Progression } = await module_('progression.js');

  console.log('Parcours franchissable');
  const impasses = [];
  for (let g = 1; g <= 60; g++) {
    const r = alea(g);
    let z = 45;
    const objs = [];
    while (z < 5000) {
      const t = troncon(r, z, z);
      objs.push(...t.o.filter(o => o.t == 'train'));
      z = t.fin;
    }
    // une rampe se monte sur ses premiers mètres ; un wagon plat se saute par l'avant (1,5 m)
    const entree = o => (o.ramp ? RAMPE : o.plat ? 1.5 : 0);
    const mur = (l, z) => objs.some(o => o.l == l && (o.vit ? z >= o.z0 - 70 && z <= o.z1 : z >= o.z0 + entree(o) && z <= o.z1));
    const rampe = (l, z) => objs.some(o => o.l == l && entree(o) && z >= o.z0 && z < o.z0 + entree(o));
    const toit = (l, z) => objs.some(o => !o.vit && o.l == l && z >= o.z0 && z <= o.z1);
    let sol = [1, 1, 1],
      haut = [0, 0, 0];
    for (let zz = 45; zz < z - 1; zz += 0.5) {
      const S2 = [0, 0, 0],
        H2 = [0, 0, 0];
      for (let l = 0; l < 3; l++) {
        if (sol[l]) {
          if (rampe(l, zz)) H2[l] = 1;
          else if (!mur(l, zz)) S2[l] = 1;
        }
        if (haut[l]) {
          if (toit(l, zz)) H2[l] = 1;
          else if (!mur(l, zz)) S2[l] = 1;
        }
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
      if (!sol.some(Boolean) && !haut.some(Boolean)) {
        impasses.push({ graine: g, z: zz });
        break;
      }
    }
  }
  verifier('60 parcours de 5 km sans impasse', impasses.length == 0, impasses);

  console.log('Mécanismes');
  // scénario : une course libre vidée, avec seulement les obstacles donnés (z relatif au départ)
  function scen({ objs = [], bonus = {}, actions = [], duree = 2.2, profil = {}, avant }) {
    const c = new Course({ graine: 1, profil });
    c.objs.length = c.listePieces.length = c.listeBonus.length = c.tunnels.length = 0;
    c.genZ = c.tunZ = 1e9; // plus rien n'est généré
    for (const o of objs) c.objs.push({ y0: 0, ...o });
    Object.assign(c.bonus, bonus);
    if (avant) avant(c);
    const faits = new Set();
    let yMax = 0;
    for (let i = 0; i < duree * 60 && c.mode == 'jeu'; i++) {
      actions.forEach(([az, a], k) => {
        if (!faits.has(k) && c.P.z >= az) {
          faits.add(k);
          c[a]();
        }
      });
      c.maj(1 / 60);
      yMax = Math.max(yMax, c.P.y);
    }
    return { c, mode: c.mode, y: +c.P.y.toFixed(2), yMax: +yMax.toFixed(2), voie: c.P.voie, pieces: c.pieces, compteurs: { ...c.compteurs } };
  }
  const avecPlanche = { prendrePlanche: () => true },
    avecCle = { cles: () => 1, payerCles: n => n <= 1 };
  const bas = { t: 'bas', l: 1, z0: 15, z1: 15.5 },
    haut = { t: 'haut', l: 1, z0: 15, z1: 15.5 },
    mur = { t: 'train', l: 1, z0: 15, z1: 30, ramp: false, c: 0 },
    caisse = { t: 'caisse', l: 1, z0: 15, z1: 15.8 },
    drone = { t: 'drone', la: 1, lb: 2, l: 1, z0: 15, z1: 15.6, ph: Math.PI };
  const ligne = l => [0, 1, 2, 3, 4].map(i => ({ x: (l - 1) * 2.2, y: 0.5, z: 10 + i * 2.5 }));
  egal('barrière : heurtée, sautée', [scen({ objs: [bas] }).mode, scen({ objs: [bas], actions: [[12, 'sauter']] }).mode], ['fin', 'jeu']);
  egal('portique : glissé, sauté', [scen({ objs: [haut], actions: [[11, 'glisser']] }).mode, scen({ objs: [haut], actions: [[12, 'sauter']] }).mode], ['jeu', 'fin']);
  egal('wagon : de face, esquivé', [scen({ objs: [mur] }).mode, scen({ objs: [mur], actions: [[5, 'gauche']] }).mode], ['fin', 'jeu']);
  egal('rampe jusqu\'au toit', scen({ objs: [{ t: 'train', l: 1, z0: 10, z1: 40, ramp: true, c: 1 }], duree: 1.9 }).y, 2.3);
  egal('deux faux pas de suite', scen({ objs: [{ t: 'train', l: 0, z0: -5, z1: 60, ramp: false, c: 0 }], actions: [[3, 'gauche'], [12, 'gauche']] }).mode, 'fin');
  egal('super baskets sur un wagon', scen({ objs: [mur], bonus: { saut: 20 }, actions: [[8, 'sauter']], duree: 1.6 }).y, 2.3);
  egal('aimant (10 pièces des autres voies)', scen({ bonus: { aimant: 20 }, duree: 1.5, avant: c => c.listePieces.push(...ligne(0), ...ligne(2)) }).pieces, 10);
  egal('wagon en face esquivé', scen({ objs: [{ t: 'train', l: 1, z0: 60, z1: 72, ramp: false, c: 3, vit: 12 }], actions: [[10, 'droite']], duree: 4 }).mode, 'jeu');
  egal('caisse : heurtée, écrasée', [scen({ objs: [caisse] }).mode, scen({ objs: [caisse], actions: [[11, 'sauter'], [14.2, 'glisser']] }).compteurs.caisses], ['fin', 1]);
  egal('drone : heurté, glissé dessous', [scen({ objs: [drone] }).mode, scen({ objs: [drone], actions: [[11, 'glisser']], duree: 1.6 }).compteurs.drones], ['fin', 1]);
  egal('accélérateur : traverse le wagon', scen({ objs: [{ t: 'pad', l: 1, z0: 6, z1: 8.6 }, mur] }).mode, 'jeu');
  egal('planche encaisse un choc', scen({ objs: [mur], profil: avecPlanche, actions: [[2, 'sortirPlanche']] }).mode, 'jeu');
  egal('bulle encaisse un choc', scen({ objs: [mur], bonus: { bulle: 10 } }).mode, 'jeu');
  egal('jetpack au-dessus de tout', scen({ objs: [mur, bas, haut], bonus: { jetpack: 3 }, duree: 2.5 }).yMax, 8);
  const jt = scen({ bonus: { jetpack: 4 }, duree: 2.5, avant: c => c.tunnels.push({ z0: 20, z1: 200 }) }).y;
  verifier('jetpack plus bas sous un tunnel', jt <= 4.3, jt);
  const st = scen({ objs: [{ t: 'train', l: 1, z0: 5, z1: 80, ramp: true, c: 1 }], bonus: { saut: 20 }, actions: [[20, 'sauter']], duree: 1.4, avant: c => c.tunnels.push({ z0: 15, z1: 200 }) }).yMax;
  verifier('plafond des tunnels', st <= 4.3, st);
  egal('élan de départ', scen({ objs: [mur], profil: { prendreElan: () => true }, avant: c => c.prendreElan() }).mode, 'jeu');
  const sc = scen({ objs: [mur], profil: avecCle });
  const continuer = [sc.mode, sc.c.continuer()];
  sc.c.avancer(1);
  egal('continuer avec une clé', [...continuer, sc.c.mode], ['continuer', true, 'jeu']);
  egal('wagon plat : heurté, sauté dessus', [scen({ objs: [{ t: 'train', l: 1, z0: 15, z1: 40, ramp: false, plat: true, c: 0 }] }).mode, scen({ objs: [{ t: 'train', l: 1, z0: 15, z1: 60, ramp: false, plat: true, c: 0 }], actions: [[11, 'sauter']], duree: 1.6 }).y], ['fin', 1.1]);
  egal('figures sur la planche', scen({ profil: avecPlanche, actions: [[2, 'sortirPlanche'], [6, 'sauter'], [22, 'sauter']] }).compteurs.figures, 2);
  egal('esquive de justesse : au dernier moment oui, trop tôt non', [scen({ objs: [mur], actions: [[11, 'gauche']], duree: 1.5 }).compteurs.esquives, scen({ objs: [mur], actions: [[2, 'gauche']], duree: 1.5 }).compteurs.esquives], [1, undefined]);
  const pf = scen({ duree: 25, avant: c => { c.invu = 1e9; } });
  verifier('20 s de course : le coureur accélère et avance', pf.mode == 'jeu' && pf.c.dist > 300 && pf.c.v > 15, { dist: pf.c.dist, v: pf.c.v });

  console.log('Progression');
  const P = new Progression(stockage(), { evenementForce: 'aucun' });
  P.D.tuto = 1;
  // course invulnérable jusqu'à sa fin (ou arrêtée par un choc au bout de « duree » secondes)
  const courir = (type, niveau, duree = 200) => {
    const c = new Course({ type, niveau, profil: P.profilCourse() });
    P.suivre(c);
    let i = 0;
    while (c.mode == 'jeu' && i++ < 60 * duree) {
      c.invu = 1e9;
      c.maj(1 / 60);
    }
    c.terminer('choc');
    return c;
  };
  const n0 = courir('niveau', 0);
  egal('niveau terminé et enregistré', [n0.raison, P.D.niveaux[0] > 0, !!n0.recompense], ['victoire', true, true]);
  const d0 = courir('defi');
  egal('défi : fin au bout de 60 s, clé du jour', [d0.raison, P.D.defi.cle, P.D.defi.meilleur > 0], ['temps', 1, true]);
  P.D.coffres = 3;
  const avant = P.D.st.coffres,
    res = [P.ouvrirCoffre(), P.ouvrirCoffre(), P.ouvrirCoffre()];
  egal('coffres mystère', [res.every(x => x && x.txt), P.D.coffres, P.D.st.coffres - avant, P.ouvrirCoffre()], [true, 0, 3, null]);
  const l0 = courir('libre', -1, 10);
  egal('course libre : trophée « premier départ » et meilleurs scores', [P.D.trophees.includes('depart'), P.D.scores.length > 0, P.D.parties, l0.mode], [true, true, 3, 'fin']);
  P.D.pieces = 2000;
  egal('boutique : acheter et choisir', [P.acheter('niv:aimant'), P.D.niv.aimant, P.acheter('perso:malo'), P.D.perso, P.acheter('perso:spectre')], [true, 1, true, 'malo', false]);
  egal('missions : trois en cours', P.D.missions.length, 3);

  console.log('Événements saisonniers');
  for (const id of ['halloween', 'hiver', 'ete']) {
    const E = new Progression(stockage(), { evenementForce: id });
    const e = E.evenementActif(),
      p0 = E.D.pieces;
    const c = new Course({ profil: E.profilCourse() });
    E.suivre(c);
    c.objs.length = c.listeBonus.length = 0;
    c.genZ = c.tunZ = 1e9;
    for (let i = 0; i < 30; i++) c.listeBonus.push({ k: 'jeton', x: 0, y: 1, z: 6 + i * 3 });
    c.invu = 1e9;
    c.avancer(8);
    const pl = e.paliers.find(x => x.planche);
    egal('événement « ' + id + ' » : 30 jetons, 500 pièces, planche exclusive', [e.id, E.D.ev.n, E.D.pieces - p0 >= 500, E.D.planchesDeb.includes(pl.planche)], [id, 30, true, true]);
  }

  console.log('Sauvegardes');
  const S = stockage({ record: 12840, pieces: 300, parties: 14, distance: 900, niv: { aimant: 2, saut: 1, x2: 0 }, son: 1 });
  const A = new Progression(S, { evenementForce: 'aucun' });
  A.verifierTrophees();
  // les trophées déjà mérités sont accordés tout de suite : premier départ (+100) et score de 10 000 (+200)
  egal('ancienne sauvegarde reprise, trophées déjà mérités accordés', [A.D.record, A.D.pieces, A.D.niv.aimant, A.D.missions.length, A.D.trophees.sort()], [12840, 600, 2, 3, ['depart', 's10k']]);
  const abime = new Progression(stockage({ record: 'abc', pieces: -5, persos: ['inconnu'], perso: 'inconnu', niveaux: [9, 2], reglages: { qualite: 'ultra' } }), { evenementForce: 'aucun' });
  egal('sauvegarde abîmée nettoyée', [abime.D.record, abime.D.pieces, abime.D.perso, abime.D.niveaux, abime.D.reglages.qualite], [0, 0, 'lune', [3, 2], 'auto']);
  // la page des jeux lit la même clé pour afficher le record et les étoiles
  const hub = fs.readFileSync(path.join(RACINE, 'assets/hub.js'), 'utf8');
  verifier('la page des jeux lit la sauvegarde « voie-libre »', hub.includes("'voie-libre'") && ['record', 'niveaux'].every(k => hub.includes(k)), null);
}

// petit serveur de fichiers pour le navigateur
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain' };
function serveur() {
  const s = http.createServer((req, res) => {
    const f = path.join(RACINE, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!f.startsWith(RACINE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => s.listen(0, '127.0.0.1', () => ok(s)));
}

async function navigateur() {
  const { chromium } = require('playwright');
  const srv = await serveur();
  const PAGE = 'http://127.0.0.1:' + srv.address().port + '/jeux/voie-libre/index.html';
  const nav = await chromium.launch();
  const page = await nav.newPage({ viewport: { width: 390, height: 844 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  page.on('console', m => m.type() == 'error' && erreurs.push(m.text()));
  page.on('requestfailed', r => erreurs.push('échec du chargement : ' + r.url()));
  try {
    console.log('Dans le navigateur');
    await page.goto(PAGE + '?graine=5');
    await page.waitForFunction(() => window.VL, null, { timeout: 30000 });
    const depart = await page.evaluate(() => [!!document.getElementById('scene').getContext('webgl2'), document.getElementById('chargement').hidden, VL.etat]);
    egal('le jeu démarre en 3D sur le menu', depart, [true, true, 'menu']);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('voie-libre', JSON.stringify({ record: 12840, pieces: 300, parties: 14, tuto: 1 }));
    });
    await page.reload();
    await page.waitForFunction(() => window.VL);
    egal('sauvegarde lue au chargement', await page.evaluate(() => [VL.D.record, VL.D.trophees.includes('s10k')]), [12840, true]);
    // un niveau dans chaque quartier, et une longue course libre qui les traverse tous
    const quartiers = await page.evaluate(() => {
      const vus = [];
      for (let q = 0; q < 5; q++) {
        VL.demarrer('niveau', q * 3);
        for (let i = 0; i < 5; i++) {
          VL.course.invu = 1e9;
          VL.avancer(1);
        }
        vus.push(VL.course.qVu);
      }
      return vus;
    });
    egal('chaque quartier se dessine', quartiers, [0, 1, 2, 3, 4]);
    const libre = await page.evaluate(async () => {
      VL.demarrer('libre');
      while (VL.course.dist < 6200) {
        VL.course.invu = 1e9;
        VL.avancer(4);
        await new Promise(r => setTimeout(r, 0));
      }
      VL.course.invu = 0;
      return [VL.etat, VL.jeu.rendu.troncons.size > 3, VL.jeu.rendu.renderer.info.render.calls > 0];
    });
    egal('6 km de course libre dessinés', libre, ['jeu', true, true]);
    const pause = await page.evaluate(() => {
      VL.jeu.pause();
      const p = [VL.etat, !document.getElementById('pause').hidden];
      VL.jeu.reprendre();
      VL.avancer(3.2);
      return [...p, VL.etat, VL.course.mode];
    });
    egal('pause puis reprise après le compte à rebours', pause, ['pause', true, 'jeu', 'jeu']);
    const fin = await page.evaluate(async () => {
      VL.course.terminer('choc');
      await new Promise(r => setTimeout(r, 1500));
      return [VL.etat, !document.getElementById('fin').hidden, document.getElementById('f-score').textContent != '0'];
    });
    egal('écran de fin', fin, ['fin', true, true]);
    for (const id of ['b-missions', 'b-trophees', 'b-niveaux', 'b-defi', 'b-boutique', 'b-reglages', 'b-aide']) {
      const ok = await page.evaluate(id => {
        VL.menu();
        if (!document.getElementById('cadeau').hidden) document.getElementById('b-cadeau').click();
        document.getElementById(id).click();
        return VL.jeu.ui.courant;
      }, id);
      verifier('écran ' + id.slice(2), ok && ok != 'menu', ok);
      await page.waitForTimeout(150);
    }
    for (const id of ['halloween', 'hiver', 'ete']) {
      await page.goto(PAGE + '?evenement=' + id);
      await page.waitForFunction(() => window.VL);
      const ev = await page.evaluate(() => {
        VL.demarrer('libre');
        VL.course.invu = 1e9;
        VL.avancer(4);
        return [VL.jeu.rendu.vue.evenement, VL.course.listeBonus.some(b => b.k == 'jeton')];
      });
      egal('événement « ' + id + ' » dessiné, avec ses jetons', ev, [id, true]);
    }
    await page.waitForTimeout(300);
    verifier('aucune erreur JavaScript', erreurs.length == 0, erreurs.slice(0, 5));
  } finally {
    await nav.close();
    srv.close();
  }
}

(async () => {
  await logique();
  console.log('Appli installable');
  const manifeste = JSON.parse(fs.readFileSync(path.join(JEU, 'manifest.webmanifest'), 'utf8'));
  verifier('manifeste du jeu et ses icônes', manifeste.icons.every(i => fs.existsSync(path.join(JEU, i.src))) && manifeste.start_url && manifeste.name == 'Voie libre', manifeste);
  await navigateur();
  console.log(echecs ? echecs + ' test(s) en échec.' : 'Tous les tests de Voie libre passent.');
  process.exit(echecs ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
