/* Voie libre : course sur trois voies à travers les quartiers d'une ville.
   Changer de voie, sauter, glisser, monter sur les wagons, écraser les caisses, planche, jetpack…
   Trois modes : course libre (sans fin), Tour de la ville (niveaux à étoiles) et Défi du jour (60 s).
   Rendu en fausse 3D sur un canvas 2D, sans bibliothèque ; sons et musique synthétisés.
   Contenu (quartiers, personnages, missions, niveaux) : donnees.js. Sauvegarde : localStorage « voie-libre ».
   Pour les tests : ?graine=123 rend le parcours reproductible, et window.VL donne accès au jeu. */
(() => {
  'use strict';
  const DON = window.VL_DONNEES;
  const QUARTIERS = DON.quartiers,
    PERSOS = DON.personnages,
    PLANCHES = DON.planches,
    BONUS = DON.bonus,
    MISSIONS = DON.missions,
    NIVEAUX = DON.niveaux,
    TROPHEES = DON.trophees,
    QUOTIDIEN = DON.quotidien,
    COFFRES = DON.coffres,
    EVENEMENTS = DON.evenements;

  // ---------- Réglages ----------
  const VOIE = 2.2; // distance entre les centres de deux voies
  const DEMI = 1; // demi-largeur d'un obstacle
  const LARG = 0.35; // demi-largeur du coureur
  const H_TRAIN = 2.3;
  const H_PLAT = 1.1; // wagon plat : on saute dessus
  const RAMPE = 6; // longueur de la rampe qui monte sur un wagon
  const H_DEBOUT = 1.5;
  const H_GLISSE = 0.7;
  const H_CAISSE = 0.8;
  const GRAVITE = 40;
  const SAUT = 10.4; // hauteur atteinte ≈ 1,35
  const SUPER_SAUT = 16.7; // ≈ 3,5 : assez pour monter sur les wagons
  const H_JETPACK = 8;
  const DUREE_GLISSE = 0.62;
  const DUREE_PLANCHE = 30;
  const VUE = 170; // distance d'affichage
  const BRUME = 45; // début du brouillard
  const LQ = 1200; // longueur d'un quartier en course libre
  const DUREE_DEFI = 60;
  const vitesse = dist => 15 + 17 * (1 - Math.exp(-dist / 1800));
  const difficulte = dist => 1 - Math.exp(-dist / 2200);
  const lx = l => (l - 1) * VOIE; // abscisse du centre d'une voie (0, 1, 2)
  const TRAINS = [
    [255, 107, 107],
    [46, 196, 182],
    [91, 108, 255],
    [255, 183, 3],
    [155, 93, 229]
  ];
  const CONTENEURS = [
    [235, 110, 60],
    [52, 120, 190],
    [60, 160, 110],
    [200, 60, 70],
    [240, 190, 60]
  ];
  const TRAVERSE = [196, 188, 180];
  const RAIL = [132, 145, 165];

  // ---------- Sauvegarde ----------
  const CLE = 'voie-libre';
  const D = {
    record: 0,
    pieces: 0,
    parties: 0,
    distance: 0,
    cles: 1,
    planches: 2,
    niv: {},
    son: 1,
    musique: 1,
    perso: 'lune',
    persos: ['lune'],
    planche: 'classique',
    planchesDeb: ['classique'],
    multi: 0,
    missions: null,
    niveaux: [],
    defi: { jour: '', meilleur: 0, cle: 0 },
    mot: { jour: '', n: 0 },
    tuto: 0,
    elans: 0,
    coffres: 0,
    st: { pieces: 0, piecesCourse: 0, scoreMax: 0, caisses: 0, drones: 0, toits: 0, planches: 0, defis: 0, mots: 0, figures: 0, coffres: 0, esquives: 0 },
    ev: { id: '', edition: 0, n: 0, pris: [] },
    trophees: [],
    scores: [],
    quotidien: { jour: '', serie: 0, pris: true },
    reglages: { vib: 1, sens: 1, qualite: 'auto' }
  };
  for (const k in BONUS) D.niv[k] = 0;
  (() => {
    let d = null;
    try {
      d = JSON.parse(localStorage.getItem(CLE));
    } catch (e) {}
    if (!d || typeof d != 'object') return;
    const n = (v, max = 1e12) => (Number.isFinite(+v) && +v > 0 ? Math.min(max, Math.floor(+v)) : 0);
    for (const k of ['record', 'pieces', 'parties', 'distance', 'cles', 'planches', 'elans', 'coffres']) if (d[k] != null) D[k] = n(d[k]);
    if (d.st && typeof d.st == 'object') for (const k in D.st) D.st[k] = n(d.st[k]);
    if (Array.isArray(d.trophees)) D.trophees = d.trophees.filter(x => TROPHEES.some(t => t.id === x));
    if (Array.isArray(d.scores))
      D.scores = d.scores
        .filter(x => x && n(x.s) > 0)
        .slice(0, 5)
        .map(x => ({ s: n(x.s), d: n(x.d), j: /^\d{4}-\d\d-\d\d$/.test(x.j) ? x.j : '', p: PERSOS.some(o => o.id === x.p) ? x.p : 'lune' }));
    if (d.quotidien && typeof d.quotidien == 'object') D.quotidien = { jour: String(d.quotidien.jour || ''), serie: n(d.quotidien.serie, 7), pris: d.quotidien.pris !== false };
    if (d.reglages && typeof d.reglages == 'object')
      D.reglages = { vib: d.reglages.vib === 0 ? 0 : 1, sens: [0.7, 1, 1.4].includes(d.reglages.sens) ? d.reglages.sens : 1, qualite: ['auto', 'basse', 'haute'].includes(d.reglages.qualite) ? d.reglages.qualite : 'auto' };
    D.multi = n(d.multi, 29);
    D.tuto = d.tuto ? 1 : 0;
    if (d.niv && typeof d.niv == 'object') for (const k in D.niv) D.niv[k] = n(d.niv[k], 5);
    D.son = d.son === 0 ? 0 : 1;
    D.musique = d.musique === 0 ? 0 : 1;
    const ids = (t, liste) => (Array.isArray(t) ? t.filter(x => liste.some(o => o.id === x)) : []);
    D.persos = [...new Set(['lune', ...ids(d.persos, PERSOS)])];
    D.planchesDeb = [...new Set(['classique', ...ids(d.planchesDeb, PLANCHES)])];
    if (D.persos.includes(d.perso)) D.perso = d.perso;
    if (D.planchesDeb.includes(d.planche)) D.planche = d.planche;
    if (Array.isArray(d.niveaux)) D.niveaux = d.niveaux.slice(0, NIVEAUX.length).map(x => n(x, 3));
    if (Array.isArray(d.missions) && d.missions.length == 3 && d.missions.every(m => m && MISSIONS[m.i] && n(m.n) > 0))
      D.missions = d.missions.map(m => ({ i: m.i, n: n(m.n), p: Math.max(0, +m.p || 0), fait: !!m.fait }));
    if (d.defi && typeof d.defi == 'object') D.defi = { jour: String(d.defi.jour || ''), meilleur: n(d.defi.meilleur), cle: d.defi.cle ? 1 : 0 };
    if (d.mot && typeof d.mot == 'object') D.mot = { jour: String(d.mot.jour || ''), n: n(d.mot.n, 20) };
    if (d.ev && typeof d.ev == 'object' && EVENEMENTS.some(e => e.id === d.ev.id))
      D.ev = { id: d.ev.id, edition: n(d.ev.edition), n: n(d.ev.n), pris: Array.isArray(d.ev.pris) ? d.ev.pris.filter(i => Number.isInteger(i) && i >= 0 && i < 10) : [] };
  })();
  function ecrire() {
    try {
      localStorage.setItem(CLE, JSON.stringify(D));
    } catch (e) {}
  }
  const dureeBonus = (k, niv = D.niv[k]) => BONUS[k].base + BONUS[k].pas * niv;
  const plancheChoisie = () => PLANCHES.find(x => x.id == D.planche) || PLANCHES[0];
  const dureePlanche = () => (plancheChoisie().pouvoir == 'duree' ? 45 : DUREE_PLANCHE);

  // ---------- Hasard reproductible, jour ----------
  function alea(graine) {
    let a = graine >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const graineURL = (() => {
    const g = new URLSearchParams(location.search).get('graine');
    return g != null && /^\d+$/.test(g) ? +g : null;
  })();
  const melange = (r, t) => {
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    return t;
  };
  const jour = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const nombreJour = () => +jour().replace(/-/g, '');
  const hier = () => {
    const d = new Date(Date.now() - 864e5);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const motDuJour = () => DON.mots[nombreJour() % DON.mots.length];
  // événement saisonnier en cours (ou forcé par ?evenement=… pour essayer) ; son édition est l'année de son début
  const evForce = new URLSearchParams(location.search).get('evenement');
  function evenementActif() {
    const d = new Date(),
      md = String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    for (const e of EVENTS_LISTE()) {
      const dedans = evForce ? evForce == e.id : e.debut <= e.fin ? md >= e.debut && md <= e.fin : md >= e.debut || md <= e.fin;
      if (!dedans) continue;
      const edition = d.getFullYear() - (e.debut > e.fin && md <= e.fin ? 1 : 0);
      if (D.ev.id != e.id || D.ev.edition != edition) D.ev = { id: e.id, edition, n: 0, pris: [] };
      return e;
    }
    return null;
  }
  const EVENTS_LISTE = () => EVENEMENTS;
  let EV = null; // événement de la course en cours (fixé au départ)

  function majJour() {
    const j = jour();
    if (D.mot.jour != j) D.mot = { jour: j, n: 0 };
    if (D.defi.jour != j) D.defi = { jour: j, meilleur: 0, cle: 0 };
  }

  // ---------- Missions ----------
  function nouvellesMissions() {
    const r = alea(1000 + D.multi * 7919),
      pris = [],
      t = new Set();
    for (const i of melange(r, MISSIONS.map((_, i) => i))) {
      if (t.has(MISSIONS[i].t) || ((MISSIONS[i].t == 'planches' || MISSIONS[i].t == 'figures') && D.planches < 1 && D.multi < 3)) continue;
      t.add(MISSIONS[i].t);
      pris.push({ i, n: MISSIONS[i].n(D.multi), p: 0, fait: false });
      if (pris.length == 3) break;
    }
    D.missions = pris;
  }
  if (!D.missions) nouvellesMissions();
  const texteMission = m => MISSIONS[m.i].txt(m.n);

  // une action compte pour les missions ; absolu : valeur de la course en cours (distance, score…)
  function evenement(t, v = 1, absolu) {
    if (S.demo) return;
    S.compteurs[t] = absolu ? v : (S.compteurs[t] || 0) + v;
    let fini = false;
    for (const m of D.missions) {
      const tpl = MISSIONS[m.i];
      if (m.fait || tpl.t != t) continue;
      if (tpl.course) m.p = Math.max(m.p, S.compteurs[t]);
      else if (!absolu) m.p += v;
      if (m.p >= m.n) {
        m.fait = true;
        fini = true;
        S.missionsFaites.push(texteMission(m));
        annonce('Mission accomplie !');
        son('mission');
      }
    }
    if (fini && D.missions.every(m => m.fait)) {
      D.multi = Math.min(29, D.multi + 1);
      D.coffres++;
      nouvellesMissions();
      annonce('Multiplicateur ×' + (D.multi + 1) + ' ! + 1 coffre mystère');
    }
    if (fini) ecrire();
  }

  // ---------- Génération du parcours ----------
  // Le parcours est une suite de tronçons. Chacun est toujours franchissable : les barrières et les caisses
  // se sautent, les portiques et les drones se passent en glissant, les wagons d'un tronçon partent
  // ensemble et laissent au moins une voie libre ou une rampe, et le tronçon suivant ne commence qu'une
  // fois tous les wagons passés.
  const piece = (l, y, z) => ({ x: lx(l), y, z, a: z * 0.7 });

  // une rangée d'obstacles dans les voies données, avec une ligne de pièces dans l'une d'elles
  function rangee(r, zz, voies, o, p, d) {
    const t = voies.map(() => (r() < 0.45 ? null : r() < 0.55 ? (d > 0.08 && r() < 0.28 ? 'caisse' : 'bas') : 'haut'));
    if (t.every(x => !x)) t[Math.floor(r() * t.length)] = r() < 0.55 ? 'bas' : 'haut';
    voies.forEach((l, i) => t[i] && o.push({ t: t[i], l, z0: zz, z1: zz + (t[i] == 'caisse' ? H_CAISSE : 0.5), y0: 0 }));
    if (r() < 0.75) {
      const i = Math.floor(r() * voies.length);
      for (let j = -3; j <= 3; j++) {
        // en arc au-dessus d'une barrière basse ou d'une caisse, au ras du sol ailleurs
        const y = t[i] == 'bas' || t[i] == 'caisse' ? 0.6 + 1.1 * (1 - (j / 3.6) ** 2) : 0.5;
        p.push(piece(voies[i], y, zz + 0.25 + j * 2));
      }
    }
  }

  function trains(r, z, d, pas, o, p) {
    const n = d < 0.12 ? 1 : d < 0.35 ? 1 + (r() < 0.6 ? 1 : 0) : 1 + Math.floor(r() * 3);
    const voies = melange(r, [0, 1, 2]);
    const pris = voies.slice(0, n),
      libres = voies.slice(n);
    const ts = pris.map((l, i) => ({
      t: 'train',
      l,
      z0: z + (i ? Math.floor(r() * 3) * 3 : 0),
      L: 10 + Math.floor(r() * (2 + d * 3)) * 6,
      ramp: r() < 0.4,
      c: Math.floor(r() * TRAINS.length)
    }));
    // quelques wagons plats, bas : on saute dessus (jamais sur une rampe)
    for (const t of ts) if (!t.ramp && d > 0.1 && r() < 0.2) t.plat = true;
    if (n == 3 && !ts.some(t => t.ramp || t.plat)) ts[Math.floor(r() * 3)].ramp = true;
    let fin = z;
    for (const t of ts) {
      t.z1 = t.z0 + t.L + (t.ramp ? RAMPE : 0);
      delete t.L;
      o.push(t);
      fin = Math.max(fin, t.z1);
      if (t.plat) for (let zc = t.z0 + 3; zc < t.z1 - 1; zc += 2.5) p.push(piece(t.l, H_PLAT + 0.5, zc));
    }
    for (const t of ts.filter(t => !t.plat)) {
      // une caisse sur le toit des longs wagons à rampe
      let caisse = null;
      if (t.ramp && t.z1 - t.z0 > RAMPE + 14 && r() < 0.4) {
        const zc = t.z0 + RAMPE + Math.floor((t.z1 - t.z0 - RAMPE) / 2);
        caisse = { t: 'caisse', l: t.l, z0: zc, z1: zc + H_CAISSE, y0: H_TRAIN };
        o.push(caisse);
      }
      // pièces sur la rampe et le toit des wagons accessibles (à rampe, ou voisins d'un wagon à rampe)
      const acces = t.ramp || ts.some(u => u.ramp && !u.plat && Math.abs(u.l - t.l) == 1);
      if (!acces || r() < 0.3) continue;
      for (let zc = t.z0 + 1.5; zc < t.z1 - 1; zc += 2.5) {
        if (caisse && Math.abs(zc - caisse.z0) < 2.5) continue;
        const y = t.ramp && zc < t.z0 + RAMPE ? (H_TRAIN * (zc - t.z0)) / RAMPE + 0.5 : H_TRAIN + 0.5;
        p.push(piece(t.l, y, zc));
      }
    }
    if (libres.length) for (let zz = z + pas * 0.6; zz < fin - 4; zz += pas) rangee(r, zz, libres, o, p, d);
    return { fin, libres };
  }

  // un wagon qui arrive en sens inverse : rien d'autre dans sa voie pendant tout le tronçon
  function approche(r, z, d, pas, o, p) {
    const l = Math.floor(r() * 3),
      L = 12 + Math.floor(r() * 3) * 4;
    const t = { t: 'train', l, z0: z + 60, z1: z + 60 + L, ramp: false, c: Math.floor(r() * TRAINS.length), vit: 9 + 6 * d };
    o.push(t);
    const libres = [0, 1, 2].filter(x => x != l);
    for (let zz = z + pas * 0.6; zz < t.z1; zz += pas) rangee(r, zz, libres, o, p, d);
    return { fin: t.z1, libres };
  }

  // drones qui balaient deux voies voisines à hauteur de tête : on passe dessous en glissant
  function drones(r, z, d, pas, o, p) {
    const n = 2 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const zz = z + i * pas,
        a = Math.floor(r() * 2),
        autre = a == 0 ? 2 : 0;
      o.push({ t: 'drone', la: a, lb: a + 1, l: a, z0: zz, z1: zz + 0.6, y0: 0, ph: r() * 6.28 });
      if (r() < 0.5) o.push({ t: r() < 0.5 ? 'bas' : 'haut', l: autre, z0: zz, z1: zz + 0.5, y0: 0 });
      else for (let j = -2; j <= 2; j++) p.push(piece(autre, 0.5, zz + j * 2.2));
    }
    return { fin: z + (n - 1) * pas + 1, libres: [0, 1, 2] };
  }

  const tirerBonus = r => {
    let t = r() * Object.values(BONUS).reduce((s, b) => s + b.poids, 0);
    for (const k in BONUS) if ((t -= BONUS[k].poids) < 0) return k;
    return 'aimant';
  };

  // un tronçon à partir de z ; dist sert à doser la difficulté
  function troncon(r, z, dist) {
    const d = difficulte(dist),
      v = vitesse(dist),
      pas = Math.max(14, v * 0.62),
      o = [],
      p = [],
      b = [];
    const k = r();
    let res;
    if (k < 0.3 || d < 0.05) {
      const n = 3 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) rangee(r, z + i * pas, [0, 1, 2], o, p, d);
      res = { fin: z + (n - 1) * pas + 1, libres: [0, 1, 2] };
    } else if (k < 0.42 && d > 0.25) res = drones(r, z, d, pas, o, p);
    else if (k < 0.86 || d < 0.2) res = trains(r, z, d, pas, o, p);
    else res = approche(r, z, d, pas, o, p);
    if (res.libres.length && d > 0.15 && r() < 0.16) {
      const l = res.libres[Math.floor(r() * res.libres.length)];
      o.push({ t: 'pad', l, z0: z + pas * 0.22, z1: z + pas * 0.22 + 2.6, y0: 0 });
    }
    if (res.libres.length && r() < 0.3) b.push({ k: tirerBonus(r), x: lx(res.libres[Math.floor(r() * res.libres.length)]), y: 1, z: z + pas * 0.5 });
    return { o, p, b, fin: res.fin + 16 + v * 0.5, z, pas, libres: res.libres };
  }

  // ---------- État ----------
  const S = {
    mode: 'menu', // menu, jeu, pause, continuer, fin
    type: 'libre', // libre, niveau, defi
    demo: true,
    t: 0,
    dist: 0,
    v: 0,
    score: 0,
    pieces: 0,
    mult: 1,
    alerte: 0,
    invu: 0,
    turbo: 0,
    planche: 0,
    poursuite: 0,
    fin: 0,
    finVue: false,
    bonus: {},
    graine: 0,
    secousse: 0,
    revives: 0,
    trebuches: 0,
    compteurs: {},
    missionsFaites: [],
    niveau: -1,
    long: 0,
    depart: 0,
    temps: 0,
    q: 0,
    raison: '',
    elan: 0,
    elanUtilise: false,
    ombre: 0
  };
  const P = { voie: 1, voieAvant: 1, x: 0, y: 0, z: 0, vy: 0, gy: 0, sol: true, glisse: 0, tampon: 0, coyote: 0, course: 0, chute: 0, ecrase: false, figure: 0 };
  const cam = { x: 0, y: 3.4, z: -6, base: 0, sp: Math.sin(0.2), cp: Math.cos(0.2) };
  let objs = [],
    pieces = [],
    bonus = [],
    decor = [],
    ponts = [],
    tunnels = [],
    parts = [];
  let r = Math.random,
    rDecor = Math.random,
    genZ = 0,
    decZ = [0, 0],
    propZ = [0, 0],
    pontZ = 0,
    tunZ = 0,
    zLettre = 0,
    zJeton = 0,
    nettoyage = 0,
    tutoT = -1;

  // quartier à la position z : en niveau, toujours le même ; sinon un tous les LQ mètres
  function quartierA(z) {
    if (S.type == 'niveau') return { a: S.q, b: S.q, t: 0 };
    const d = Math.max(0, z),
      i = Math.floor(d / LQ),
      f = d - i * LQ;
    return { a: i % QUARTIERS.length, b: (i + 1) % QUARTIERS.length, t: f > LQ - 120 ? (f - (LQ - 120)) / 120 : 0 };
  }
  const quartierIndex = z => {
    const q = quartierA(z);
    return q.t < 0.5 ? q.a : q.b;
  };

  function nouveauMonde(demo, type = 'libre', niveau = -1) {
    Object.assign(S, {
      demo,
      type,
      t: 0,
      dist: 0,
      score: 0,
      pieces: 0,
      alerte: 0,
      invu: 0,
      turbo: 0,
      planche: 0,
      poursuite: demo ? 0 : 1,
      fin: 0,
      finVue: false,
      bonus: {},
      secousse: 0,
      revives: 0,
      trebuches: 0,
      compteurs: {},
      missionsFaites: [],
      niveau,
      long: 0,
      depart: 0,
      temps: 0,
      raison: '',
      nouveau: false,
      elan: 0,
      elanUtilise: false,
      ombre: 0,
      rang: 0
    });
    Object.assign(P, { voie: 1, voieAvant: 1, x: 0, y: 0, z: 0, vy: 0, gy: 0, sol: true, glisse: 0, tampon: 0, coyote: 0, chute: 0, ecrase: false, figure: 0 });
    S.combo = 0;
    S.derniereFigure = -9;
    Object.assign(cam, { x: 0, y: 3.4, z: -6, base: 0 });
    objs = [];
    pieces = [];
    bonus = [];
    decor = [];
    ponts = [];
    tunnels = [];
    parts = [];
    if (type == 'niveau') {
      const n = NIVEAUX[niveau];
      S.graine = n.graine;
      S.long = n.long;
      S.depart = n.depart;
      S.q = n.q;
    } else if (type == 'defi') {
      S.graine = nombreJour();
      S.depart = 600;
      S.temps = DUREE_DEFI;
    } else S.graine = graineURL != null ? graineURL : (Math.random() * 2 ** 32) >>> 0;
    if (demo && type == 'libre') S.q = Math.floor(Math.random() * QUARTIERS.length);
    r = alea(S.graine);
    rDecor = alea(S.graine ^ 0x9e3779b9);
    genZ = 45;
    decZ = [-12, -12];
    propZ = [-12, -12];
    pontZ = 120;
    tunZ = 260;
    zLettre = 300 + r() * 400;
    zJeton = 80;
    EV = evenementActif(); // aussi pour le décor du menu ; les jetons n'apparaissent qu'en course
    S.qVu = quartierIndex(0);
    generer();
  }

  function generer() {
    while (!S.demo && genZ < P.z + VUE + 30) {
      if (S.type == 'niveau' && genZ > S.long - 40) {
        if (!objs.some(o => o.t == 'arrivee')) objs.push({ t: 'arrivee', l: 1, z0: S.long, z1: S.long + 1, y0: 0 });
        genZ = 1e9;
        break;
      }
      const t = troncon(r, genZ, genZ + S.depart);
      objs.push(...t.o);
      pieces.push(...t.p);
      bonus.push(...t.b);
      // chasse aux lettres : une lettre du mot du jour de temps en temps (course libre)
      if (S.type == 'libre' && genZ > zLettre && t.libres.length && D.mot.n < motDuJour().length) {
        bonus.push({ k: 'lettre', x: lx(t.libres[Math.floor(r() * t.libres.length)]), y: 1, z: t.z + t.pas * 0.78 });
        zLettre = genZ + 700 + r() * 500;
      }
      // événement saisonnier : un jeton à ramasser de temps en temps
      if (EV && genZ > zJeton && t.libres.length) {
        bonus.push({ k: 'jeton', x: lx(t.libres[Math.floor(r() * t.libres.length)]), y: 1, z: t.z + t.pas * 0.86 });
        zJeton = genZ + 140 + r() * 120;
      }
      genZ = t.fin;
    }
    // décor des deux côtés, selon le quartier
    const fin = P.z + VUE + 30;
    for (const c of [0, 1]) {
      const s = c ? 1 : -1;
      while (decZ[c] < fin) {
        const q = QUARTIERS[S.demo && S.type == 'libre' ? S.q : quartierIndex(decZ[c])],
          coul = () => q.immeubles[Math.floor(rDecor() * q.immeubles.length)];
        const z0 = decZ[c];
        let a, e, h, z1;
        if (q.id == 'port' && rDecor() < 0.55) {
          // piles de conteneurs
          a = 5.4 + rDecor() * 1.5;
          e = a + 2.6;
          z1 = z0 + 6.2;
          const n = 1 + Math.floor(rDecor() * 3);
          for (let i = 0; i < n; i++) decor.push({ k: 'conteneur', x0: s > 0 ? a : -e, x1: s > 0 ? e : -a, y0: i * 2.6, h: (i + 1) * 2.6, z0, z1, c: CONTENEURS[Math.floor(rDecor() * CONTENEURS.length)] });
          if (rDecor() < 0.15) decor.push({ k: 'grue', x: s * (11 + rDecor() * 3), z: z0 + 3, h: 15 + rDecor() * 5, s });
          decZ[c] = z1 + 0.6 + rDecor() * 2;
          continue;
        }
        if (q.decor.includes('quais')) {
          // un tronçon de quai couvert, et un bâtiment de la gare derrière
          z1 = z0 + 20;
          const qx = (u, v) => (s > 0 ? [u, v] : [-v, -u]);
          const [q0, q1] = qx(4.15, 9.6);
          decor.push({ k: 'quai', x0: q0, x1: q1, z0, z1, s });
          for (const zp of [z0 + 4, z0 + 14]) {
            const [p0, p1] = qx(9.6, 9.95);
            decor.push({ k: 'pilier', x0: p0, x1: p1, z0: zp, z1: zp + 0.35 });
          }
          const [a0, a1] = qx(4.7, 10.3);
          decor.push({ k: 'auvent', x0: a0, x1: a1, z0, z1, s, panneau: rDecor() < 0.35 });
          const [b0, b1] = qx(11 + rDecor() * 2, 18 + rDecor() * 3);
          decor.push({ k: 'immeuble', x0: b0, x1: b1, y0: 0, h: 7 + rDecor() * 8, z0: z0 + 1, z1: z1 - 1, c: coul(), nuit: q.nuit });
          decZ[c] = z1;
          continue;
        }
        if (q.id == 'couchant') {
          a = 8.5 + rDecor() * 2;
          h = 3 + rDecor() * 4;
        } else if (q.id == 'parc') {
          a = 11 + rDecor() * 4;
          h = 6 + rDecor() * 10;
        } else if (q.id == 'briques') {
          a = 6.4 + rDecor() * 1.5;
          h = 5 + rDecor() * 8;
        } else {
          a = 6.4 + rDecor() * 1.6;
          h = 3.5 + rDecor() * 6;
        }
        e = a + 4 + rDecor() * 5;
        z1 = z0 + 7 + rDecor() * 14;
        decor.push({ k: 'immeuble', x0: s > 0 ? a : -e, x1: s > 0 ? e : -a, y0: 0, h, z0, z1, c: coul(), res: q.id == 'briques' && rDecor() < 0.45, nuit: q.nuit });
        decZ[c] = z1 + 1 + rDecor() * 5;
      }
      // éléments au bord des voies : palmiers, arbres, lampadaires
      while (propZ[c] < fin) {
        const q = QUARTIERS[S.demo && S.type == 'libre' ? S.q : quartierIndex(propZ[c])],
          z = propZ[c];
        if (q.decor.includes('palmier')) {
          decor.push({ k: 'palmier', x: s * (5.3 + rDecor() * 1.5), z, z0: z, z1: z + 0.5, h: 5 + rDecor() * 2.5, s });
          propZ[c] = z + 7 + rDecor() * 6;
        } else if (q.decor.includes('arbre')) {
          if (rDecor() < 0.35) decor.push({ k: 'lampadaire', x: s * 4.7, z, z0: z, z1: z + 0.3, h: 4.6, s });
          else decor.push({ k: 'arbre', x: s * (5.6 + rDecor() * 2.5), z, z0: z, z1: z + 0.5, h: 3 + rDecor() * 2, s, c: rDecor() });
          propZ[c] = z + 5 + rDecor() * 6;
        } else propZ[c] = z + 20;
      }
    }
    // tunnels, puis passerelles au-dessus des voies (jamais dans un tunnel)
    while (tunZ < fin) {
      const q = QUARTIERS[quartierIndex(tunZ)];
      if (!S.demo && q.decor.includes('tunnel') && rDecor() < 0.55) {
        const L = 50 + rDecor() * 50;
        tunnels.push({ z0: tunZ, z1: tunZ + L, c: q.mur });
        tunZ += L + 300 + rDecor() * 300;
      } else tunZ += 200 + rDecor() * 200;
    }
    while (pontZ < fin) {
      const q = QUARTIERS[quartierIndex(pontZ)];
      if (!S.demo && q.decor.includes('passerelle') && rDecor() < 0.6 && !enTunnel(pontZ, 8) && !enTunnel(pontZ + 4)) ponts.push({ z0: pontZ, z1: pontZ + 4, c: q.mur });
      pontZ += 160 + rDecor() * 140;
    }
  }

  function nettoyer() {
    const z = cam.z - 3;
    objs = objs.filter(o => o.z1 > z && !o.efface);
    pieces = pieces.filter(c => !c.pris && c.z > z);
    bonus = bonus.filter(b => !b.pris && b.z > z);
    decor = decor.filter(b => b.z1 > z);
    ponts = ponts.filter(b => b.z1 > z);
    tunnels = tunnels.filter(b => b.z1 > z);
  }

  // dans un tunnel à la position z (marge : un peu avant l'entrée)
  const enTunnel = (z, marge = 0) => tunnels.some(t => z >= t.z0 - marge && z <= t.z1);
  // hauteur de vol en jetpack : plus bas sous les tunnels
  const hauteurVol = z => (enTunnel(z, 18) ? 3.6 : H_JETPACK);
  const vole = () => !!S.bonus.jetpack || S.elan > 0;
  // une traînée de pièces dans le ciel, qui change de voie de temps en temps
  function traineePieces(duree, v) {
    let l = P.voie;
    const fin = P.z + 12 + v * duree;
    for (let z = P.z + 14; z < fin; z += 2.4) {
      if (Math.random() < 0.06) l = Math.max(0, Math.min(2, l + (Math.random() < 0.5 ? -1 : 1)));
      pieces.push({ x: lx(l), y: hauteurVol(z) + 0.6, z, a: z });
    }
  }

  // ---------- Physique ----------
  const droneX = o => lx(o.la) + (lx(o.lb) - lx(o.la)) * (0.5 - 0.5 * Math.cos(S.t * 1.6 + o.ph));
  const centre = o => (o.t == 'drone' ? droneX(o) : lx(o.l));

  // hauteur du sol sous le coureur : 0, une rampe ou le toit d'un wagon (seulement si on arrive d'en haut)
  function sol(x, z, y0) {
    let g = 0;
    for (const o of objs) {
      if (o.t != 'train' || o.casse || z < o.z0 || z > o.z1 || Math.abs(x - lx(o.l)) > DEMI) continue;
      const rampe = o.ramp && z < o.z0 + RAMPE,
        h = rampe ? (H_TRAIN * (z - o.z0)) / RAMPE : o.plat ? H_PLAT : H_TRAIN;
      if (y0 >= h - (rampe ? 0.7 : 0.45)) g = Math.max(g, h);
    }
    return g;
  }

  function pas(h) {
    const x0 = P.x,
      y0 = P.y,
      sol0 = P.sol;
    P.z += S.v * h;
    P.course += S.v * h;
    if (!S.demo) {
      S.dist += S.v * h;
      S.score += S.v * h * S.mult;
    }
    const tx = lx(P.voie),
      m = 15 * h,
      dx = tx - P.x;
    P.x += Math.abs(dx) <= m ? dx : Math.sign(dx) * m;
    for (const o of objs)
      if (o.vit) {
        if (!o.actif && o.z0 - P.z < 110) o.actif = true;
        if (o.actif) {
          o.z0 -= o.vit * h;
          o.z1 -= o.vit * h;
        }
      }
    if (vole()) {
      // en vol : on monte en douceur à la hauteur du jetpack (plus bas sous les tunnels)
      P.vy = (hauteurVol(P.z) - P.y) * 5;
      P.y += P.vy * h;
      P.sol = false;
      P.gy = sol(P.x, P.z, 99);
    } else {
      P.vy -= GRAVITE * h;
      P.y += P.vy * h;
      const g = sol(P.x, P.z, y0);
      P.gy = g;
      if (P.y <= g) {
        if (!P.sol) atterrir();
        P.y = g;
        P.vy = 0;
        P.sol = true;
        P.coyote = 0.1;
      } else if (P.y > g + 0.05) P.sol = false;
      // plafond des tunnels
      if (P.y > 4.3 && enTunnel(P.z)) {
        P.y = 4.3;
        P.vy = Math.min(P.vy, 0);
      }
    }
    if (P.sol && P.tampon > 0) sauter();
    if (S.demo) return;
    if (P.sol && sol0 && P.y > 2.2) evenement('toits', S.v * h);
    if (!vole()) collisions(x0);
    if (S.mode == 'jeu') {
      ramasser(h);
      accelerateurs();
    }
  }

  function atterrir() {
    if (P.vy < -8) poussiere();
    if (P.figure > 0) {
      // figure réussie sur la planche ; enchaînées, elles rapportent de plus en plus
      P.figure = 0;
      S.combo = S.t - S.derniereFigure < 3 ? Math.min(10, S.combo + 1) : 1;
      S.derniereFigure = S.t;
      const g = 50 * S.combo * S.mult;
      S.score += g;
      flotte((S.combo > 1 ? 'Figure ×' + S.combo : 'Figure') + ' +' + g, P.x, P.y + 2.2, P.z + 1.5, [255, 214, 90]);
      evenement('figures');
      son('figure');
    }
    if (P.ecrase) {
      // écrasement : onde de choc, et les caisses juste dessous se brisent
      P.ecrase = false;
      S.secousse = Math.max(S.secousse, 0.15);
      son('ecrase');
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * 6.28;
        parts.push({ x: P.x, y: P.y + 0.05, z: P.z, vx: Math.cos(a) * 6, vy: 0.5, vz: S.v + Math.sin(a) * 6, v: 0.35, c: [255, 255, 255], r: 0.09 });
      }
      for (const o of objs) if (o.t == 'caisse' && !o.casse && Math.abs(lx(o.l) - P.x) < 1.2 && o.z0 < P.z + 2 && o.z1 > P.z - 1 && Math.abs(o.y0 - P.y) < 0.9) casserCaisse(o);
    }
  }

  function collisions(x0) {
    const hp = P.glisse > 0 ? H_GLISSE : H_DEBOUT;
    for (const o of objs) {
      if (o.casse || o.t == 'pad' || o.t == 'arrivee' || P.z + 0.3 < o.z0 || P.z - 0.3 > o.z1) continue;
      const c = centre(o),
        demi = o.t == 'drone' ? 0.75 : DEMI;
      if (Math.abs(P.x - c) >= demi + LARG) continue;
      let bas = o.y0 || 0,
        haut = o.plat ? H_PLAT : H_TRAIN;
      if (o.t == 'bas') haut = bas + 0.65;
      else if (o.t == 'caisse') haut = bas + H_CAISSE;
      else if (o.t == 'haut' || o.t == 'drone') {
        bas = 1.0;
        haut = 1.75;
      } else if (o.ramp && P.z < o.z0 + RAMPE) haut = (H_TRAIN * Math.max(0, P.z - o.z0)) / RAMPE;
      if (P.y >= haut - 0.05 || P.y + hp <= bas) continue;
      if (S.turbo > 0) {
        casser(o);
        continue;
      }
      if (o.t == 'caisse' && P.ecrase) {
        casserCaisse(o);
        continue;
      }
      // de côté si, juste avant, le coureur n'était pas dans la largeur de l'obstacle
      if (o.t != 'drone' && Math.abs(x0 - c) >= demi + LARG - 1e-6) trebucher(x0);
      else choc(o);
      return;
    }
    // drones passés en glissant dessous
    for (const o of objs) if (o.t == 'drone' && !o.passe && !o.casse && o.z1 < P.z - 0.3 && o.z1 > P.z - 3 && Math.abs(droneX(o) - P.x) < 1.1) {
      o.passe = true;
      evenement('drones');
    }
  }

  function casser(o) {
    o.casse = true;
    eclats(o);
    S.score += 20 * S.mult;
    flotte('+' + 20 * S.mult, centre(o), 1.6, Math.max(o.z0, P.z + 1));
    son('casse');
  }

  function casserCaisse(o) {
    o.casse = true;
    eclats(o);
    evenement('caisses');
    son('caisse');
    const t = Math.random();
    if (t < 0.05) {
      D.coffres++;
      ecrire();
      message('Coffre mystère !', 'or');
    } else if (t < 0.15) {
      D.cles++;
      ecrire();
      message('+1 clé !', 'or');
    } else if (t < 0.42) activerBonus(tirerBonus(Math.random));
    else {
      const n = 10 + Math.floor(Math.random() * 16);
      S.pieces += n;
      S.score += 5 * n * S.mult;
      evenement('pieces', n);
      flotte('+' + n, lx(o.l), o.y0 + 1.4, o.z0, [255, 207, 64]);
      for (let i = 0; i < 10; i++) parts.push({ x: lx(o.l), y: o.y0 + 0.6, z: o.z0, vx: (Math.random() - 0.5) * 5, vy: 4 + Math.random() * 3, vz: S.v, v: 0.6, c: [255, 207, 64], r: 0.12 });
    }
  }

  function trebucher(x0) {
    P.voie = P.voieAvant;
    P.x = x0;
    if (S.invu > 0) return;
    vibrer(60);
    S.secousse = 0.25;
    S.flash = 0.35;
    S.trebuches++;
    if (S.alerte > 0) {
      if (proteger()) return;
      return perdu();
    }
    S.alerte = 3.5;
    S.poursuite = 1;
    son('alerte');
    message('Attention !', 'alerte');
  }

  // bulle puis planche : chacune encaisse un choc à la place du coureur
  function proteger(o) {
    if (S.bonus.bulle) {
      delete S.bonus.bulle;
      message('Bulle éclatée');
    } else if (S.planche > 0) {
      S.planche = 0;
      message('Planche cassée');
    } else return false;
    if (o) {
      o.casse = true;
      eclats(o);
    }
    S.invu = 1;
    S.alerte = 0;
    S.secousse = 0.4;
    S.flash = 0.3;
    son('bouclier');
    return true;
  }

  function choc(o) {
    if (S.invu > 0) return;
    if (proteger(o)) return;
    perdu();
  }

  // course perdue : on peut continuer avec des clés (sauf au défi du jour)
  function perdu() {
    if (S.mode != 'jeu') return;
    S.secousse = 0.6;
    S.flash = 0.5;
    son('choc');
    vibrer(220);
    const cout = 2 ** S.revives;
    if (S.type != 'defi' && D.cles >= cout) {
      S.mode = 'continuer';
      S.compte = 5;
      musique(false);
      afficherContinuer(cout);
      return;
    }
    finPartie('choc');
  }

  function continuer() {
    const cout = 2 ** S.revives;
    if (S.mode != 'continuer' || D.cles < cout) return;
    D.cles -= cout;
    S.revives++;
    ecrire();
    // on dégage la voie devant le coureur et il repart protégé quelques instants
    for (const o of objs) if (o.t != 'pad' && o.t != 'arrivee' && o.z1 > P.z - 3 && o.z0 < P.z + 35) o.efface = true;
    objs = objs.filter(o => !o.efface);
    Object.assign(S, { invu: 2, alerte: 0, poursuite: 0, mode: 'jeu' });
    P.y = sol(P.x, P.z, 99);
    P.vy = 0;
    P.voieAvant = P.voie;
    derniere = 0;
    ecran(null);
    musique(true);
    message('C\'est reparti !');
  }

  function ramasser(h) {
    const hp = P.glisse > 0 ? H_GLISSE : H_DEBOUT,
      aimant = !!S.bonus.aimant || (S.planche > 0 && plancheChoisie().pouvoir == 'aimant'),
      vol = vole(),
      k = Math.min(1, 16 * h);
    for (const c of pieces) {
      if (c.pris) continue;
      const dz = c.z - P.z;
      if (dz < -2 || dz > 30) continue;
      if (aimant && dz < 18 && Math.abs(c.y - P.y) < 4) c.vol = true;
      if (c.vol) {
        c.x += (P.x - c.x) * k;
        c.y += (P.y + 0.8 - c.y) * k;
        c.z += (P.z - c.z) * k + S.v * h; // suit aussi l'avancée du coureur, sinon elle reste à la traîne
        if (Math.hypot(c.x - P.x, c.y - P.y - 0.8, c.z - P.z) < 0.8) prendre(c);
      } else if (Math.abs(c.x - P.x) < (vol ? 1.3 : 0.9) && Math.abs(dz) < 0.9 && c.y > P.y - 0.4 && c.y < P.y + hp + 0.4) prendre(c);
    }
    for (const b of bonus)
      if (!b.pris && Math.abs(b.x - P.x) < 1.1 && Math.abs(b.z - P.z) < 1.1 && b.y > P.y - 0.6 && b.y < P.y + hp + 0.6) {
        b.pris = true;
        if (b.k == 'lettre') lettre();
        else if (b.k == 'jeton') jeton();
        else {
          activerBonus(b.k);
          evenement('bonus');
        }
      }
  }

  function activerBonus(k) {
    S.bonus[k] = dureeBonus(k);
    son('bonus');
    message(BONUS[k].nom + ' !');
    if (k == 'jetpack') traineePieces(dureeBonus(k), S.v);
  }

  function lettre() {
    const mot = motDuJour();
    if (D.mot.n >= mot.length) return;
    message('Lettre « ' + mot[D.mot.n] + ' » !', 'or');
    D.mot.n++;
    son('lettre');
    if (D.mot.n >= mot.length) {
      D.cles++;
      D.pieces += 300;
      D.st.mots++;
      annonce('Mot « ' + mot + ' » trouvé : +1 clé, +300 pièces');
    }
    ecrire();
  }

  // jeton d'événement : chaque palier atteint donne sa récompense
  function jeton() {
    if (!EV) return;
    D.ev.n++;
    son('lettre');
    flotte('+1', P.x, P.y + 2, P.z + 1.5, [255, 214, 140]);
    EV.paliers.forEach((pa, i) => {
      if (D.ev.n < pa.n || D.ev.pris.includes(i)) return;
      D.ev.pris.push(i);
      D.pieces += pa.pieces || 0;
      D.coffres += pa.coffres || 0;
      if (pa.perso && !D.persos.includes(pa.perso)) D.persos.push(pa.perso);
      if (pa.planche && !D.planchesDeb.includes(pa.planche)) D.planchesDeb.push(pa.planche);
      annonce(EV.nom + ' : ' + pa.txt + ' !');
    });
    ecrire();
  }

  // esquive de justesse : changer de voie juste avant un obstacle qui aurait touché
  function justesse(l) {
    if (S.demo || vole()) return;
    const hp = P.glisse > 0 ? H_GLISSE : H_DEBOUT;
    for (const o of objs) {
      if (o.casse || o.frole || o.l != l || o.ramp || !['train', 'bas', 'haut', 'caisse'].includes(o.t)) continue;
      const dz = o.z0 - P.z;
      if (dz < 0.4 || dz > (S.v + (o.vit || 0)) * 0.3) continue;
      let bas = o.y0 || 0,
        haut = o.t == 'train' ? (o.plat ? H_PLAT : H_TRAIN) : o.t == 'bas' ? bas + 0.65 : o.t == 'caisse' ? bas + H_CAISSE : 1.75;
      if (o.t == 'haut') bas = 1.0;
      if (P.y >= haut - 0.05 || P.y + hp <= bas) continue;
      o.frole = true;
      const g = 25 * S.mult;
      S.score += g;
      flotte('Justesse ! +' + g, lx(l), P.y + 2.2, P.z + 2.5, [140, 230, 255]);
      evenement('esquives');
      son('justesse');
      return;
    }
  }

  function prendre(c) {
    c.pris = true;
    S.pieces++;
    S.score += 5 * S.mult;
    evenement('pieces');
    son('piece');
    if (parts.length < 140)
      for (let i = 0; i < 4; i++)
        parts.push({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 2, vz: S.v * 0.9, v: 0.35, c: [255, 210, 60], r: 0.07 });
  }

  // accélérateurs au sol : élan de vitesse, et les obstacles traversés se brisent
  function accelerateurs() {
    if (!P.sol || P.y > 0.1) return;
    for (const o of objs)
      if (o.t == 'pad' && !o.pris && P.z >= o.z0 && P.z <= o.z1 && Math.abs(P.x - lx(o.l)) < 1) {
        o.pris = true;
        if (S.turbo <= 0) evenement('pads');
        S.turbo = 2.4;
        son('turbo');
        message('Turbo !');
        vibrer(40);
      }
  }

  // texte qui monte dans la scène (+20, +12…)
  function flotte(txt, x, y, z, c = [255, 255, 255]) {
    parts.push({ x, y, z, vx: 0, vy: 2.2, vz: S.v * 0.95, v: 0.9, c, r: 0.45, txt });
  }

  function poussiere() {
    for (let i = 0; i < 6; i++)
      parts.push({ x: P.x + (Math.random() - 0.5) * 0.6, y: P.y + 0.05, z: P.z, vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random(), vz: S.v * 0.6, v: 0.4, c: [210, 215, 228], r: 0.1 });
  }

  function eclats(o) {
    const c = o.t == 'train' ? TRAINS[o.c] : o.t == 'caisse' ? [196, 140, 80] : o.t == 'drone' ? [60, 66, 90] : [255, 255, 255];
    for (let i = 0; i < 16; i++)
      parts.push({ x: centre(o) + (Math.random() - 0.5) * 2, y: (o.y0 || 0) + Math.random() * (o.t == 'train' ? 2.3 : 1.2), z: Math.max(o.z0, P.z + 0.5), vx: (Math.random() - 0.5) * 8, vy: 3 + Math.random() * 5, vz: S.v + Math.random() * 6, v: 0.7, c, r: 0.16 });
  }

  // ---------- Actions ----------
  function gauche() {
    if (S.mode != 'jeu' || P.voie == 0) return;
    P.voieAvant = P.voie;
    P.voie--;
    justesse(P.voieAvant);
    evenement('voies');
    son('voie');
  }
  function droite() {
    if (S.mode != 'jeu' || P.voie == 2) return;
    P.voieAvant = P.voie;
    P.voie++;
    justesse(P.voieAvant);
    evenement('voies');
    son('voie');
  }
  function sauter() {
    if (S.mode != 'jeu' || vole()) return;
    if (P.sol || P.coyote > 0) {
      P.vy = S.bonus.saut ? SUPER_SAUT : S.bonus.bulle ? SAUT * 1.2 : S.planche > 0 && plancheChoisie().pouvoir == 'saut' ? SAUT * 1.25 : SAUT;
      P.sol = false;
      P.coyote = 0;
      P.glisse = 0;
      P.tampon = 0;
      P.ecrase = false;
      if (S.planche > 0) P.figure = 0.001; // sur la planche, chaque saut est une figure
      evenement('sauts');
      son('saut');
    } else P.tampon = 0.15; // appui un peu trop tôt : on saute dès l'atterrissage
  }
  function glisser() {
    if (S.mode != 'jeu' || vole()) return;
    P.glisse = DUREE_GLISSE;
    P.tampon = 0;
    if (!P.sol) {
      P.vy = Math.min(P.vy, -26); // en l'air : redescente immédiate, qui écrase ce qu'il y a dessous
      P.ecrase = true;
    }
    evenement('glisses');
    son('glisse');
  }
  function utiliserPlanche() {
    if (S.mode != 'jeu' || S.planche > 0 || D.planches < 1) return;
    D.planches--;
    S.planche = dureePlanche();
    ecrire();
    evenement('planches');
    son('planche');
    message('Planche !');
  }
  // élan de départ : quelques secondes de vol à toute vitesse, au tout début d'une course libre
  function utiliserElan() {
    if (S.mode != 'jeu' || S.type != 'libre' || S.elanUtilise || D.elans < 1 || S.dist > 150) return;
    D.elans--;
    S.elanUtilise = true;
    S.elan = 6;
    ecrire();
    traineePieces(6, vitesse(S.dist) * 2);
    son('turbo');
    message('Élan de départ !');
  }

  function finPartie(raison) {
    if (S.mode != 'jeu' && S.mode != 'continuer') return;
    S.mode = 'fin';
    S.raison = raison;
    S.fin = 0;
    musique(false);
    if (raison == 'victoire' || raison == 'temps') son('victoire');
    const score = Math.floor(S.score);
    evenement('score', score, true);
    evenement('distance', Math.floor(S.dist), true);
    S.nouveau = S.type == 'libre' && score > D.record && score > 0;
    D.parties++;
    D.pieces += S.pieces;
    D.distance = Math.max(D.distance, Math.floor(S.dist));
    if (S.nouveau) D.record = score;
    for (const k of ['caisses', 'drones', 'toits', 'planches', 'figures', 'esquives']) D.st[k] += Math.floor(S.compteurs[k] || 0);
    D.st.pieces += S.pieces;
    D.st.piecesCourse = Math.max(D.st.piecesCourse, S.pieces);
    D.st.scoreMax = Math.max(D.st.scoreMax, score);
    S.rang = 0;
    if (S.type == 'libre' && score > 0) {
      const e = { s: score, d: Math.floor(S.dist), j: jour(), p: D.perso };
      D.scores.push(e);
      D.scores.sort((a, b) => b.s - a.s);
      D.scores = D.scores.slice(0, 5);
      S.rang = D.scores.indexOf(e) + 1;
    }
    S.recompense = '';
    if (S.type == 'niveau' && raison == 'victoire') {
      const n = NIVEAUX[S.niveau],
        avant = D.niveaux[S.niveau] || 0,
        etoiles = 1 + (S.pieces >= n.pieces ? 1 : 0) + (S.trebuches == 0 ? 1 : 0);
      S.etoiles = etoiles;
      if (!avant) {
        const g = 100 + 50 * S.niveau;
        D.pieces += g;
        S.recompense = '+' + g + ' pièces';
      }
      if (etoiles == 3 && avant < 3) {
        D.cles++;
        S.recompense += (S.recompense ? ' · ' : '') + '+1 clé';
      }
      D.niveaux[S.niveau] = Math.max(avant, etoiles);
    }
    if (S.type == 'defi') {
      majJour();
      D.defi.meilleur = Math.max(D.defi.meilleur, score);
      if (raison == 'temps' && !D.defi.cle) {
        D.defi.cle = 1;
        D.cles++;
        D.st.defis++;
        S.recompense = 'Défi réussi : +1 clé';
      }
    }
    ecrire();
    verifierTrophees();
  }

  // ---------- Trophées ----------
  function valeurTrophee(type) {
    const enCourse = !S.demo && (S.mode == 'jeu' || S.mode == 'pause' || S.mode == 'continuer');
    switch (type) {
      case 'parties':
        return D.parties;
      case 'distance':
        return Math.max(D.distance, enCourse ? S.dist : 0);
      case 'score':
        return Math.max(D.record, D.st.scoreMax, enCourse ? S.score : 0);
      case 'piecesCourse':
        return Math.max(D.st.piecesCourse, enCourse ? S.pieces : 0);
      case 'piecesTotal':
        return D.st.pieces + (enCourse ? S.pieces : 0);
      case 'niveauxPort':
        return [0, 1, 2].filter(i => D.niveaux[i] > 0).length;
      case 'etoiles':
        return D.niveaux.reduce((s, x) => s + (x || 0), 0);
      case 'multi':
        return D.multi + 1;
      case 'persos':
        return D.persos.length;
      case 'coffres':
        return D.st.coffres;
      default:
        return (D.st[type] || 0) + (enCourse ? Math.floor(S.compteurs[type] || 0) : 0); // caisses, drones, toits, planches, défis, mots
    }
  }
  function verifierTrophees() {
    let gagne = false;
    for (const t of TROPHEES)
      if (!D.trophees.includes(t.id) && valeurTrophee(t.type) >= t.n) {
        D.trophees.push(t.id);
        D.pieces += t.gain;
        gagne = true;
        annonce('Trophée : ' + t.nom + ' (+' + t.gain + ' pièces)');
      }
    if (gagne) {
      son('mission');
      ecrire();
    }
  }

  // ---------- Récompense quotidienne ----------
  function verifierQuotidien() {
    const j = jour();
    if (D.quotidien.jour != j) {
      D.quotidien = { jour: j, serie: D.quotidien.jour == hier() ? (D.quotidien.serie % 7) + 1 : 1, pris: false };
      ecrire();
    }
    return !D.quotidien.pris;
  }
  function recupererQuotidien() {
    if (D.quotidien.pris) return;
    const c = QUOTIDIEN[D.quotidien.serie - 1] || QUOTIDIEN[0];
    D.pieces += c.pieces || 0;
    D.planches += c.planches || 0;
    D.cles += c.cles || 0;
    D.elans += c.elans || 0;
    D.coffres += c.coffres || 0;
    D.quotidien.pris = true;
    ecrire();
    son('bonus');
  }

  // ---------- Coffres mystère ----------
  // ouvre un coffre : tirage pondéré, récompense appliquée tout de suite ; renvoie le texte à afficher
  function ouvrirCoffre() {
    if (D.coffres < 1) return null;
    D.coffres--;
    D.st.coffres++;
    let t = Math.random() * COFFRES.reduce((s, c) => s + c.poids, 0),
      c = COFFRES[0];
    for (const x of COFFRES)
      if ((t -= x.poids) < 0) {
        c = x;
        break;
      }
    const entre = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));
    let res;
    const bloques = PERSOS.filter(p => !D.persos.includes(p.id) && !p.evenement);
    if (c.perso && bloques.length) {
      const p = bloques[Math.floor(Math.random() * bloques.length)];
      D.persos.push(p.id);
      res = { txt: p.nom + ' te rejoint !', icone: '★', rare: true };
    } else if (c.pieces || c.perso) {
      const n = c.pieces ? entre(c.pieces) : 3000;
      D.pieces += n;
      res = { txt: fmt(n) + ' pièces', icone: '◉', rare: n >= 1500 };
    } else if (c.planches) {
      const n = entre(c.planches);
      D.planches += n;
      res = { txt: n + ' planche' + (n > 1 ? 's' : ''), icone: '▬' };
    } else if (c.cles) {
      D.cles += 1;
      res = { txt: '1 clé', icone: '🔑' };
    } else {
      const n = entre(c.elans);
      D.elans += n;
      res = { txt: n + ' élan' + (n > 1 ? 's' : '') + ' de départ', icone: '»' };
    }
    ecrire();
    verifierTrophees();
    return res;
  }

  // ---------- Boucle ----------
  function maj(dt) {
    S.t += dt;
    if (S.mode == 'continuer') {
      S.compte -= dt;
      majContinuer();
      if (S.compte <= 0) {
        finPartie('choc');
        ecran(null);
      }
      return;
    }
    if (S.mode == 'fin') {
      S.fin += dt;
      if (S.raison == 'choc') {
        P.chute = Math.min(1, P.chute + dt * 3);
        P.vy -= GRAVITE * dt;
        P.y = Math.max(P.gy, P.y + P.vy * dt);
      } else {
        // arrivée ou fin du temps : le coureur ralentit et continue sur sa lancée
        S.v = Math.max(0, S.v - 20 * dt);
        P.z += S.v * dt;
        P.course += S.v * dt;
      }
      S.poursuite = S.raison == 'choc' ? Math.min(1, S.poursuite + dt * 2) : Math.max(0, S.poursuite - dt);
      if (S.fin > 0.9 && !S.finVue) {
        S.finVue = true;
        afficherFin();
      }
    } else {
      S.v = S.demo ? 9 : vitesse(S.dist + S.depart) * (S.turbo > 0 ? 1.5 : 1) * (S.elan > 0 ? 2 : 1);
      const jet = vole();
      for (const k in S.bonus) if ((S.bonus[k] -= dt) <= 0) delete S.bonus[k];
      if (S.elan > 0) S.elan = Math.max(0, S.elan - dt);
      if (jet && !vole()) S.invu = Math.max(S.invu, 1.4); // atterrissage protégé
      if (S.turbo > 0 && (S.turbo -= dt) <= 0) S.invu = Math.max(S.invu, 0.8);
      if (S.planche > 0) S.planche = Math.max(0, S.planche - dt);
      S.mult = (1 + D.multi) * (S.bonus.x2 ? 2 : 1);
      S.alerte = Math.max(0, S.alerte - dt);
      S.invu = Math.max(0, S.invu - dt);
      if (S.alerte <= 0) S.poursuite = Math.max(0, S.poursuite - dt * 0.35);
      P.glisse = Math.max(0, P.glisse - dt);
      if (P.figure > 0) P.figure += dt;
      P.tampon = Math.max(0, P.tampon - dt);
      P.coyote = Math.max(0, P.coyote - dt);
      const n = Math.max(1, Math.ceil((S.v * dt) / 0.3));
      for (let i = 0; i < n && S.mode == 'jeu'; i++) pas(dt / n);
      if (S.mode == 'jeu' && !S.demo) {
        if (S.type == 'defi' && (S.temps -= dt) <= 0) finPartie('temps');
        else if (S.type == 'niveau' && P.z >= S.long) finPartie('victoire');
        const q = quartierIndex(P.z);
        if (q != S.qVu) {
          S.qVu = q;
          message(QUARTIERS[q].nom, 'quartier');
        }
        tutoriel();
        if (Math.floor(S.t) != Math.floor(S.t - dt)) verifierTrophees();
      }
    }
    // caméra : suit le coureur, et la hauteur des toits seulement quand il s'y pose (ou en jetpack)
    if (P.sol || P.y < cam.base || vole()) cam.base = P.y;
    cam.x += (P.x * 0.75 - cam.x) * (1 - Math.exp(-dt * 7));
    const sousTunnel = enTunnel(cam.z + 1) || enTunnel(P.z, 4);
    cam.y += (Math.min(cam.base + 3.4, sousTunnel ? 5.2 : 99) - cam.y) * (1 - Math.exp(-dt * (sousTunnel ? 8 : 4)));
    cam.z = P.z - 6;
    S.ombre += ((enTunnel(cam.z + 3) ? 1 : 0) - S.ombre) * (1 - Math.exp(-dt * 5));
    S.secousse = Math.max(0, S.secousse - dt);
    S.flash = Math.max(0, (S.flash || 0) - dt);
    for (const q of parts) {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.z += q.vz * dt;
      q.vy -= 12 * dt;
      q.v -= dt;
    }
    parts = parts.filter(q => q.v > 0);
    generer();
    if ((nettoyage += dt) > 0.5) {
      nettoyage = 0;
      nettoyer();
    }
  }

  // première course : quelques conseils
  function tutoriel() {
    if (D.tuto || S.type != 'libre') return;
    const tactile = matchMedia('(pointer: coarse)').matches;
    const etapes = tactile
      ? [[0.6, 'Glisse ← ou → pour changer de voie'], [4.5, 'Glisse ↑ pour sauter'], [8.5, 'Glisse ↓ pour passer sous les portiques'], [12.5, 'Tape deux fois pour sortir ta planche']]
      : [[0.6, '← → pour changer de voie'], [4.5, '↑ ou Espace pour sauter'], [8.5, '↓ pour glisser sous les portiques'], [12.5, 'B pour sortir ta planche']];
    for (const [t, m] of etapes)
      if (tutoT < t && S.t >= t) {
        message(m, 'conseil', 2600);
        tutoT = S.t;
      }
    if (S.t > 16) {
      D.tuto = 1;
      ecrire();
    }
  }

  // ---------- Rendu ----------
  const cv = document.getElementById('scene');
  let ctx = cv.getContext('2d'); // remplacé un instant par celui de l'image en cache du ciel
  let W = 0,
    H = 0,
    F = 0,
    F0 = 0,
    CX = 0,
    CY = 0,
    HORIZON = 0,
    DPR = 1,
    maxDPR = 2,
    DETAIL = 2; // 2 : tout ; 1 : sans fresques, halos ni fenêtres lointaines ; 0 : décor simplifié
  const PAL = { ciel: [0, 0, 0], brume: [0, 0, 0], sol: [0, 0, 0], ballast: [0, 0, 0], mur: [0, 0, 0], nuit: 0, lum: 1 };
  const nuages = Array.from({ length: 7 }, (_, i) => ({ a: i * 0.9 + Math.random() * 0.5, h: 0.25 + Math.random() * 0.5, s: 0.6 + Math.random() * 0.7 }));
  const etoiles = Array.from({ length: 70 }, () => [Math.random(), Math.random() * 0.9, Math.random() * 1.4 + 0.4]);

  function taille() {
    W = innerWidth;
    H = innerHeight;
    DPR = Math.min(maxDPR, window.devicePixelRatio || 1);
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    F0 = Math.min(W, H * 0.72);
    CX = W / 2;
    CY = H * 0.47;
  }
  addEventListener('resize', taille);

  const mixer = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rgb = c => 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
  const brume = d => Math.min(1, Math.max(0, (d - BRUME) / (VUE - BRUME)));

  // couleurs du quartier courant, fondues pendant le passage d'un quartier à l'autre
  // pluie : certains passages dans les quartiers qui s'y prêtent (même tirage pour une même course)
  function pluieA(z) {
    if (S.demo) return 0;
    const i = S.type == 'niveau' ? S.niveau : Math.floor(Math.max(0, z) / LQ),
      q = quartierA(z),
      h = (k, qi) => (QUARTIERS[qi].pluie && ((Math.sin((k + 1) * 91.7 + S.graine * 0.013) * 43758.5) % 1 + 1) % 1 < 0.4 ? 1 : 0);
    return h(i, q.a) * (1 - q.t) + h(i + 1, q.b) * q.t;
  }
  function majPalette() {
    const q = S.demo && S.type == 'libre' ? { a: S.q, b: S.q, t: 0 } : quartierA(cam.z + 25),
      A = QUARTIERS[q.a],
      B = QUARTIERS[q.b];
    for (const k of ['ciel', 'brume', 'sol', 'ballast', 'mur']) PAL[k] = mixer(A[k], B[k], q.t);
    PAL.pluie = pluieA(cam.z + 25);
    if (EV && EV.id == 'halloween') {
      // crépuscule violet et orangé, lumières allumées
      PAL.ciel = mixer(PAL.ciel, [60, 26, 84], 0.82);
      PAL.brume = mixer(PAL.brume, [170, 96, 112], 0.6);
      PAL.mur = mixer(PAL.mur, [90, 70, 100], 0.4);
    } else if (EV && EV.id == 'hiver') {
      PAL.brume = mixer(PAL.brume, [236, 242, 250], 0.5);
      PAL.mur = [250, 252, 255];
      PAL.sol = mixer(PAL.sol, [240, 244, 250], 0.6);
    }
    if (PAL.pluie > 0) {
      // ciel couvert
      PAL.ciel = mixer(PAL.ciel, [128, 138, 156], 0.55 * PAL.pluie);
      PAL.brume = mixer(PAL.brume, [176, 184, 198], 0.5 * PAL.pluie);
    }
    PAL.nuit = A.nuit + (B.nuit - A.nuit) * q.t;
    if (EV && EV.id == 'halloween') PAL.nuit = Math.max(PAL.nuit, 0.65);
    PAL.lum = (1 - 0.32 * PAL.nuit) * (1 - 0.4 * S.ombre);
    PAL.brumeCiel = PAL.brume;
    PAL.brume = mixer(PAL.brume, [18, 20, 30], 0.85 * S.ombre); // au fond d'un tunnel, tout se fond dans le noir
  }

  // couleur c éclaircie ou assombrie par s, assombrie la nuit, puis noyée dans le brouillard selon t
  function teinte(c, t, s = 1, lumiere) {
    const k = s * (lumiere ? 1 : PAL.lum),
      b = PAL.brume;
    let o = 'rgb(';
    for (let i = 0; i < 3; i++) {
      const v = Math.min(255, c[i] * k);
      o += (i ? ',' : '') + ((v + (b[i] - v) * t) | 0);
    }
    return o + ')';
  }

  // projection : caméra derrière le coureur, inclinée de 0,2 rad vers le bas
  function proj(x, y, z) {
    const rx = x - cam.x,
      ry = y - cam.y,
      rz = z - cam.z,
      d = rz * cam.cp - ry * cam.sp,
      k = F / d;
    return { x: CX + rx * k, y: CY - (ry * cam.cp + rz * cam.sp) * k, d };
  }
  const PRES = 1.2; // plan de coupe devant la caméra

  function poly(pts, c) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
  }
  const quadX = (x, y0, y1, z0, z1) => [proj(x, y0, z0), proj(x, y0, z1), proj(x, y1, z1), proj(x, y1, z0)];
  const quadZ = (x0, x1, y0, y1, z) => [proj(x0, y0, z), proj(x1, y0, z), proj(x1, y1, z), proj(x0, y1, z)];
  const quadY = (x0, x1, y, z0, z1) => [proj(x0, y, z0), proj(x1, y, z0), proj(x1, y, z1), proj(x0, y, z1)];

  // pavé : seules les faces tournées vers la caméra sont dessinées ; la face avant seulement si elle n'est pas coupée
  function pave(x0, x1, y0, y1, z0, z1, c, avant = true, deco) {
    const n = cam.z + PRES;
    if (z1 <= n) return;
    const coupe = z0 < n;
    if (coupe) z0 = n;
    const t = brume(z0 - cam.z);
    const A = proj(x0, y0, z0),
      B = proj(x1, y0, z0),
      C = proj(x1, y1, z0),
      E = proj(x0, y1, z0),
      A2 = proj(x0, y0, z1),
      B2 = proj(x1, y0, z1),
      C2 = proj(x1, y1, z1),
      E2 = proj(x0, y1, z1);
    if (cam.x < x0) poly([A, A2, E2, E], teinte(c, t, 0.82));
    if (cam.x > x1) poly([B, B2, C2, C], teinte(c, t, 0.82));
    if (cam.y > y1) poly([E, C, C2, E2], teinte(c, t, 1.1));
    else if (cam.y < y0) poly([A, B, B2, A2], teinte(c, t, 0.7));
    if (avant && !coupe) poly([A, B, C, E], teinte(c, t, 0.95));
    if (deco) deco(t, z0, coupe);
  }

  // bande sur les côtés visibles d'un volume (fenêtres, rayures)
  function bandeCotes(x0, x1, y0, y1, z0, z1, c, t, lumiere) {
    if (cam.x < x0) poly(quadX(x0, y0, y1, z0, z1), teinte(c, t, 1, lumiere));
    if (cam.x > x1) poly(quadX(x1, y0, y1, z0, z1), teinte(c, t, 1, lumiere));
  }

  // ciel et sol : dessinés dans une image en cache, refaite seulement quand les couleurs ou l'horizon changent
  const fond = document.createElement('canvas'),
    fctx = fond.getContext('2d');
  let cleFond = '';
  function ciel() {
    const cf = [W, H, DPR, Math.round(HORIZON), PAL.ciel.map(Math.round), PAL.brumeCiel.map(Math.round), PAL.sol, Math.round(PAL.nuit * 20)].join();
    if (cf != cleFond) {
      cleFond = cf;
      fond.width = cv.width;
      fond.height = cv.height;
      const vrai = ctx;
      ctx = fctx;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cielFixe();
      ctx = vrai;
    }
    ctx.drawImage(fond, 0, 0, W, H);
    const m = Math.min(W, H);
    ctx.fillStyle = 'rgba(255,255,255,' + 0.85 * (1 - PAL.nuit * 0.8) + ')';
    for (const n of DETAIL ? nuages : []) {
      const x = ((((n.a * W * 0.37 - S.t * 6 * n.s - cam.x * 4) % (W * 1.4)) + W * 1.4) % (W * 1.4)) - W * 0.2,
        y = HORIZON * n.h,
        s = m * 0.05 * n.s;
      ctx.beginPath();
      ctx.ellipse(x, y, s * 2.2, s * 0.8, 0, 0, 7);
      ctx.ellipse(x + s, y - s * 0.4, s * 1.3, s * 0.9, 0, 0, 7);
      ctx.ellipse(x - s * 1.1, y - s * 0.2, s, s * 0.7, 0, 0, 7);
      ctx.fill();
    }
  }
  function cielFixe() {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, rgb(PAL.ciel));
    g.addColorStop(1, rgb(PAL.brumeCiel));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, HORIZON + 1);
    const m = Math.min(W, H);
    if (PAL.nuit > 0.5) {
      ctx.fillStyle = 'rgba(255,255,255,' + (PAL.nuit - 0.5) * 1.6 + ')';
      for (const [x, y, s] of etoiles) ctx.fillRect(x * W, y * HORIZON, s, s);
      ctx.fillStyle = 'rgba(255,250,230,.95)';
      ctx.beginPath();
      ctx.arc(W * 0.78, HORIZON * 0.35, m * 0.045, 0, 7);
      ctx.fill();
    } else {
      const bas = PAL.nuit > 0.15; // soleil couchant, plus gros et plus bas
      ctx.fillStyle = bas ? 'rgba(255,236,170,.95)' : 'rgba(255,250,225,.9)';
      ctx.beginPath();
      ctx.arc(W * 0.78, bas ? HORIZON - m * 0.05 : HORIZON - H * 0.18, m * (bas ? 0.1 : 0.06), 0, 7);
      ctx.fill();
    }
    const gs = ctx.createLinearGradient(0, HORIZON, 0, H);
    const sol = rgb(PAL.sol.map(v => v * (1 - 0.32 * PAL.nuit)));
    gs.addColorStop(0, rgb(PAL.brumeCiel));
    gs.addColorStop(0.3, sol);
    gs.addColorStop(1, sol);
    ctx.fillStyle = gs;
    ctx.fillRect(0, HORIZON, W, H - HORIZON);
  }

  // immeubles, conteneurs, grues, palmiers, arbres et lampadaires, du plus loin au plus proche
  function dessinerDecor() {
    const n = cam.z + PRES,
      loin = cam.z + (DETAIL ? VUE : 110),
      lat = b => (b.x0 != null ? Math.min(Math.abs(b.x0), Math.abs(b.x1)) : Math.abs(b.x)),
      vis = decor.filter(b => b.z0 < loin && b.z1 > n && (DETAIL || b.k == 'immeuble' || b.k == 'conteneur' || b.k == 'quai' || b.z0 < cam.z + 60)).sort((a, b) => b.z0 - a.z0 || lat(b) - lat(a));
    const fen = [92, 112, 150],
      lumineux = [255, 214, 120];
    for (const b of vis) {
      if (b.k == 'immeuble')
        pave(b.x0, b.x1, 0, b.h, b.z0, b.z1, b.c, true, (t, z0, coupe) => {
          // pas de fenêtres trop près de la caméra : elles s'étirent en grandes traînées
          if (z0 - cam.z > (DETAIL > 1 ? 85 : DETAIL ? 45 : 0) || z0 - cam.z < 7) return;
          const allume = PAL.nuit > 0.6,
            cf = allume ? lumineux : mixer(b.c, fen, 0.45);
          for (let y = 1.6; y < b.h - 0.8; y += 2.2) {
            bandeCotes(b.x0, b.x1, y, y + 0.8, z0 + 0.6, b.z1 - 0.6, cf, t, allume);
            if (!coupe) poly(quadZ(b.x0 + 0.6, b.x1 - 0.6, y, y + 0.8, z0), teinte(allume ? lumineux : mixer(b.c, fen, 0.4), t, 1, allume));
          }
          if (b.res && cam.y < b.h + 30) {
            // réservoir d'eau sur le toit
            const xm = (b.x0 + b.x1) / 2,
              zm = (z0 + b.z1) / 2;
            pave(xm - 0.12, xm + 0.12, b.h, b.h + 1.2, zm - 0.12, zm + 0.12, [90, 70, 60]);
            pave(xm - 0.9, xm + 0.9, b.h + 1.2, b.h + 2.8, zm - 0.9, zm + 0.9, [150, 110, 80]);
          }
        });
      else if (b.k == 'conteneur')
        pave(b.x0, b.x1, b.y0, b.h, b.z0, b.z1, b.c, true, (t, z0, coupe) => {
          if (z0 - cam.z > 70) return;
          const f = mixer(b.c, [0, 0, 0], 0.25);
          for (let y = b.y0 + 0.5; y < b.h - 0.3; y += 0.7) bandeCotes(b.x0, b.x1, y, y + 0.12, z0, b.z1, f, t);
          if (!coupe) for (const x of [0.3, 0.75]) poly(quadZ(b.x0 + (b.x1 - b.x0) * x - 0.05, b.x0 + (b.x1 - b.x0) * x + 0.05, b.y0 + 0.2, b.h - 0.2, z0), teinte(f, t));
        });
      else if (b.k == 'grue') {
        const c = [245, 190, 40],
          x = b.x,
          z = b.z;
        for (const dz of [0, 3]) pave(x - 0.3, x + 0.3, 0, b.h, z + dz, z + dz + 0.5, c);
        pave(Math.min(x, x - b.s * 14), Math.max(x, x - b.s * 14), b.h, b.h + 0.9, z, z + 3.5, c);
        pave(Math.min(x, x + b.s * 5), Math.max(x, x + b.s * 5), b.h + 0.9, b.h + 1.4, z + 1.2, z + 2.3, [90, 90, 100]);
      } else if (b.k == 'quai')
        pave(b.x0, b.x1, 0, 1.1, b.z0, b.z1, [206, 208, 214], true, t => {
          // bande jaune au bord du quai
          const xb = b.s > 0 ? b.x0 : b.x1 - 0.35;
          if (cam.y > 1.1) poly(quadY(xb, xb + 0.35, 1.11, Math.max(b.z0, n), b.z1), teinte([255, 204, 0], t));
        });
      else if (b.k == 'pilier') pave(b.x0, b.x1, 1.1, 4.7, b.z0, b.z1, [120, 128, 146]);
      else if (b.k == 'auvent')
        pave(b.x0, b.x1, 4.6, 4.95, b.z0, b.z1, [150, 168, 190], true, (t, z0, coupe) => {
          if (!b.panneau || coupe) return;
          // panneau suspendu « Gare Centrale »
          const xm = b.s > 0 ? b.x0 + 1.4 : b.x1 - 1.4,
            zm = z0 + 6;
          if (zm > b.z1) return;
          poly(quadZ(xm - 1.2, xm + 1.2, 3.7, 4.3, zm), teinte([28, 52, 110], t));
          const p = proj(xm, 4, zm);
          ctx.fillStyle = teinte([255, 255, 255], t, 1, true);
          ctx.font = '700 ' + Math.max(6, (0.32 * F) / p.d).toFixed(1) + 'px "Bricolage Grotesque", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('GARE CENTRALE', p.x, p.y);
        });
      else accessoire(b);
    }
  }

  // palmiers, arbres et lampadaires : dessinés à plat à partir de leur pied et de leur sommet projetés
  function accessoire(b) {
    const p = proj(b.x, 0, b.z),
      q = proj(b.x + (b.k == 'palmier' ? b.s * 0.7 : 0), b.h, b.z);
    if (p.d < PRES) return;
    const s = F / p.d,
      t = brume(p.d);
    ctx.lineCap = 'round';
    if (b.k == 'palmier') {
      ctx.strokeStyle = teinte([150, 110, 70], t);
      ctx.lineWidth = 0.32 * s;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.quadraticCurveTo(p.x + (q.x - p.x) * 0.2, (p.y + q.y) / 2, q.x, q.y);
      ctx.stroke();
      ctx.fillStyle = teinte([60, 160, 90], t);
      const np = DETAIL > 1 ? 7 : 4;
      for (let i = 0; i < np; i++) {
        const a = -Math.PI / 2 + (i - (np - 1) / 2) * (3.3 / np) + Math.sin(S.t * 1.5 + b.z) * 0.05,
          L = 2.1 * s;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.quadraticCurveTo(q.x + Math.cos(a) * L * 0.6, q.y + Math.sin(a) * L * 0.6 - 0.4 * s, q.x + Math.cos(a) * L, q.y + Math.sin(a) * L * 0.5 + 0.8 * s);
        ctx.quadraticCurveTo(q.x + Math.cos(a) * L * 0.5, q.y + Math.sin(a) * L * 0.4, q.x, q.y);
        ctx.fill();
      }
    } else if (b.k == 'arbre') {
      ctx.strokeStyle = teinte([110, 80, 60], t);
      ctx.lineWidth = 0.3 * s;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
      const vert = b.c < 0.5 ? [52, 120, 82] : [70, 140, 90];
      ctx.fillStyle = teinte(vert, t);
      for (const [dx, dy, rr] of [[0, -0.3, 1.3], [-0.7, 0.3, 0.9], [0.7, 0.2, 1]]) {
        ctx.beginPath();
        ctx.arc(q.x + dx * s, q.y + dy * s, rr * s, 0, 7);
        ctx.fill();
      }
    } else if (b.k == 'lampadaire') {
      ctx.strokeStyle = teinte([70, 76, 96], t);
      ctx.lineWidth = 0.14 * s;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.lineTo(q.x - b.s * 0.7 * s, q.y);
      ctx.stroke();
      const lx2 = q.x - b.s * 0.7 * s;
      if (PAL.nuit > 0.4 && DETAIL > 1) {
        const g = ctx.createRadialGradient(lx2, q.y, 0, lx2, q.y, 2.2 * s);
        g.addColorStop(0, 'rgba(255,220,140,.55)');
        g.addColorStop(1, 'rgba(255,220,140,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(lx2, q.y, 2.2 * s, 0, 7);
        ctx.fill();
      }
      ctx.fillStyle = PAL.nuit > 0.4 ? '#ffe9a8' : teinte([230, 230, 220], t);
      ctx.beginPath();
      ctx.ellipse(lx2, q.y + 0.08 * s, 0.25 * s, 0.12 * s, 0, 0, 7);
      ctx.fill();
    }
  }

  // intérieur d'un tunnel : parois, plafond, bandeaux et plafonniers lumineux (dessiné avant les voies)
  function tunnelInterieur(t) {
    const a = Math.max(t.z0, cam.z + PRES),
      b = Math.min(t.z1, cam.z + VUE);
    if (a >= b) return;
    const paroi = [96, 100, 116],
      plafond = [70, 74, 90],
      bandeau = [255, 214, 140];
    for (let z = a; z < b; z += 10) {
      const z2 = Math.min(b, z + 10),
        tt = brume(z - cam.z);
      for (const x of [-4.1, 4.1]) {
        poly(quadX(x, 0, 6, z, z2), teinte(paroi, tt, 0.9));
        poly(quadX(x * 0.998, 3, 3.15, z, z2), teinte(bandeau, tt, 1, true));
      }
      if (cam.y < 6) poly(quadY(-4.1, 4.1, 6, z, z2), teinte(plafond, tt));
    }
    if (cam.y < 6) for (let z = Math.ceil(a / 7) * 7; z < b - 1.4; z += 7) poly(quadY(-0.35, 0.35, 5.98, z, z + 1.4), teinte([255, 240, 200], brume(z - cam.z), 1, true));
  }

  // entrée d'un tunnel : un grand mur percé d'une ouverture au-dessus des voies
  function tunnelFacade(t) {
    const z = t.z0,
      c = mixer(t.c, [130, 120, 112], 0.55);
    pave(-22, -4.1, 0, 12, z, z + 1.5, c);
    pave(4.1, 22, 0, 12, z, z + 1.5, c);
    pave(-4.1, 4.1, 6, 12, z, z + 1.5, c);
    if (z < cam.z + PRES) return;
    const f = teinte([58, 62, 78], brume(z - cam.z));
    poly(quadZ(-4.7, -4.1, 0, 6.6, z - 0.02), f);
    poly(quadZ(4.1, 4.7, 0, 6.6, z - 0.02), f);
    poly(quadZ(-4.7, 4.7, 6, 6.6, z - 0.02), f);
  }

  // murs, voies, traverses, rails ; fresques colorées sur les murs
  function dessinerVoies() {
    const z0 = cam.z + PRES,
      zf = cam.z + VUE;
    for (const t of tunnels) tunnelInterieur(t);
    for (let z = Math.floor(z0 / 15) * 15; z < zf; z += 15) {
      const za = Math.max(z, z0),
        z2 = Math.min(zf, z + 15),
        t = brume(za - cam.z);
      for (const s of [-1, 1]) {
        pave(s < 0 ? -4.1 : 3.7, s < 0 ? -3.7 : 4.1, 0, 0.7, za, z2, PAL.mur, false);
        // fresque sur la face intérieure, une tranche sur trois environ
        const h = Math.abs(Math.sin(z * 12.9898 + s * 78.233) * 43758.5453) % 1;
        if (EV && EV.id == 'halloween' && h > 0.55 && z2 - za > 4) {
          // citrouille posée sur le mur, visage allumé
          const p = proj(s * 3.9, 1.05, za + 2);
          if (p.d > PRES) {
            const rr = (0.42 * F) / p.d;
            ctx.fillStyle = teinte([255, 140, 46], t, 1, true);
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, rr * 1.2, rr, 0, 0, 7);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,236,150,' + (1 - t) + ')';
            ctx.beginPath();
            ctx.moveTo(p.x - rr * 0.5, p.y - rr * 0.2);
            ctx.lineTo(p.x - rr * 0.25, p.y - rr * 0.45);
            ctx.lineTo(p.x - rr * 0.05, p.y - rr * 0.2);
            ctx.moveTo(p.x + rr * 0.05, p.y - rr * 0.2);
            ctx.lineTo(p.x + rr * 0.25, p.y - rr * 0.45);
            ctx.lineTo(p.x + rr * 0.5, p.y - rr * 0.2);
            ctx.moveTo(p.x - rr * 0.55, p.y + rr * 0.15);
            ctx.quadraticCurveTo(p.x, p.y + rr * 0.6, p.x + rr * 0.55, p.y + rr * 0.15);
            ctx.fill();
          }
        }
        if (DETAIL > 1 && h < 0.4 && z2 - za > 6) {
          const xf = s < 0 ? -3.69 : 3.69,
            c1 = TRAINS[Math.floor(h * 100) % TRAINS.length],
            c2 = TRAINS[Math.floor(h * 1000) % TRAINS.length];
          poly(quadX(xf, 0.08, 0.62, za + 1, z2 - 1), teinte(c1, t));
          poly(quadX(xf, 0.18, 0.45, za + 3, z2 - 4), teinte(c2, t));
        }
      }
      for (let l = 0; l < 3; l++) {
        const x = lx(l);
        poly(quadY(x - 1.05, x + 1.05, 0, za, z2), teinte(PAL.ballast, t));
      }
    }
    const pasT = 1.6;
    for (let z = Math.ceil(z0 / pasT) * pasT; z < cam.z + (DETAIL ? 75 : 50); z += pasT) {
      const c = teinte(TRAVERSE, brume(z - cam.z));
      for (let l = 0; l < 3; l++) poly(quadY(lx(l) - 0.9, lx(l) + 0.9, 0.03, z, z + 0.42), c);
    }
    for (let z = z0; z < zf; z += 15) {
      const z2 = Math.min(zf, z + 15),
        c = teinte(RAIL, brume(z - cam.z), 1);
      for (let l = 0; l < 3; l++) for (const s of [-0.55, 0.55]) poly(quadY(lx(l) + s - 0.06, lx(l) + s + 0.06, 0.12, z, z2), c);
    }
  }

  // éléments du parcours triés de l'arrière vers l'avant ; les wagons sont découpés en morceaux
  // pour que l'ordre de dessin reste juste à côté des autres obstacles
  function dessinerParcours() {
    const L = [],
      n = cam.z + PRES,
      f = cam.z + VUE;
    // un morceau de wagon, une rampe ou une caisse sous les pieds du coureur se dessine avant lui
    const dessous = (o, a, b, haut) => Math.abs(P.x - lx(o.l)) < DEMI + LARG && a <= P.z + 0.3 && b >= P.z - 0.3 && P.y >= haut - 0.1;
    const cle = (o, a, b, haut) => (dessous(o, a, b, haut) ? P.z : Math.max(a, n));
    for (const o of objs) {
      if (o.casse || o.z1 <= n || o.z0 >= f - 4) continue;
      const lat = Math.abs(centre(o) - cam.x);
      if (o.t == 'pad') L.push({ k: o.z1 + 1000, l: lat, f: () => accelerateur(o) });
      else if (o.t == 'arrivee') L.push({ k: o.z0, l: 0, f: () => arrivee(o) });
      else if (o.t == 'drone') L.push({ k: o.z0, l: lat, f: () => drone(o) });
      else if (o.t == 'caisse') L.push({ k: cle(o, o.z0, o.z1, o.y0 + H_CAISSE), l: lat, f: () => caisse(o) });
      else if (o.t != 'train') L.push({ k: o.z0, l: lat, f: () => barriere(o) });
      else {
        let z = o.z0;
        if (o.ramp) {
          const hr = (H_TRAIN * Math.min(RAMPE, Math.max(0, P.z - o.z0))) / RAMPE;
          L.push({ k: cle(o, z, z + RAMPE, hr), l: lat, f: () => rampe(o) });
          z += RAMPE;
        }
        for (let i = 0; z < o.z1; i++, z += 5) {
          const a = z,
            b = Math.min(o.z1, z + 5),
            premier = i == 0;
          if (b <= n || a >= f) continue;
          L.push({ k: cle(o, a, b, o.plat ? H_PLAT : H_TRAIN), l: lat, f: () => (o.plat ? plat(o, a, b, premier) : wagon(o, a, b, premier)) });
        }
      }
    }
    // portiques de caténaires tous les 32 m, passerelles
    const pc = DETAIL > 1 ? 32 : 64;
    for (let z = Math.ceil(n / pc) * pc; z < (DETAIL ? f : cam.z + 90); z += pc) if (!enTunnel(z, 1)) L.push({ k: z, l: 9, f: () => catenaire(z) });
    for (const t of tunnels) if (t.z0 > n && t.z0 < f) L.push({ k: t.z0, l: 0, f: () => tunnelFacade(t) });
    for (const p of ponts) if (p.z1 > n && p.z0 < f) L.push({ k: Math.max(p.z0, n), l: 0, f: () => passerelle(p) });
    for (const c of pieces) if (!c.pris && c.z > n && c.z < f) L.push({ k: c.z, l: 0, f: () => dessinPiece(c) });
    for (const b of bonus) if (!b.pris && b.z > n && b.z < f) L.push({ k: b.z, l: 0, f: () => dessinBonus(b) });
    L.push({ k: P.z - 0.3, l: 0, f: dessinCoureur });
    if (S.poursuite > 0.02 && !S.demo) {
      const zc = P.z - 2.7 - (1 - S.poursuite) * 5;
      if (zc > n) L.push({ k: zc - 0.3, l: 0, f: () => poursuivant(zc) });
    }
    L.sort((a, b) => b.k - a.k || b.l - a.l);
    for (const e of L) e.f();
    for (const q of parts) {
      const p = proj(q.x, q.y, q.z);
      if (p.d < PRES) continue;
      ctx.globalAlpha = Math.min(1, q.v * 3);
      ctx.fillStyle = rgb(q.c);
      if (q.txt) {
        ctx.font = '700 ' + Math.max(10, (q.r * F) / p.d).toFixed(1) + 'px "Bricolage Grotesque", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(22,33,58,.55)';
        ctx.lineWidth = 3;
        ctx.strokeText(q.txt, p.x, p.y);
        ctx.fillText(q.txt, p.x, p.y);
        ctx.globalAlpha = 1;
        continue;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, (q.r * F) / p.d), 0, 7);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function wagon(o, a, b, premier) {
    const x = lx(o.l),
      c = TRAINS[o.c],
      x0 = x - DEMI,
      x1 = x + DEMI;
    pave(x0, x1, 0, H_TRAIN, a, b, c, premier, (t, z0, coupe) => {
      const vitres = PAL.nuit > 0.6 ? [255, 226, 150] : [44, 54, 78];
      bandeCotes(x0, x1, 0, 0.35, z0, b, [60, 66, 84], t);
      bandeCotes(x0, x1, 0.5, 0.62, z0, b, [255, 255, 255], t);
      // fenêtres séparées par les portes
      if (DETAIL > 1 && z0 - cam.z < 70) for (let zw = Math.ceil(z0 / 2.5) * 2.5; zw < b - 0.4; zw += 2.5) bandeCotes(x0, x1, 1.25, 1.85, Math.max(z0, zw + 0.3), Math.min(b, zw + 2.1), vitres, t, PAL.nuit > 0.6);
      else bandeCotes(x0, x1, 1.25, 1.85, z0, b, vitres, t, PAL.nuit > 0.6);
      if (cam.y > H_TRAIN) poly(quadY(x - 0.45, x + 0.45, H_TRAIN, z0, b), teinte(c, t, 1.22));
      if (premier && !coupe) {
        poly(quadZ(x - 0.72, x + 0.72, 1.2, 1.95, z0), teinte([40, 52, 80], t));
        poly(quadZ(x0, x1, 0, 0.35, z0), teinte([60, 66, 84], t));
        poly(quadZ(x0, x1, 0.5, 0.62, z0), teinte([255, 255, 255], t));
        for (const s of [-0.62, 0.62]) {
          const p = proj(x + s, 0.82, z0),
            rr = (0.14 * F) / p.d;
          if (o.vit || PAL.nuit > 0.5) {
            ctx.fillStyle = 'rgba(255,240,170,.35)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, rr * 2.6, 0, 7);
            ctx.fill();
          }
          ctx.fillStyle = o.vit || PAL.nuit > 0.5 ? '#fff6c8' : teinte([255, 236, 190], t);
          ctx.beginPath();
          ctx.arc(p.x, p.y, rr, 0, 7);
          ctx.fill();
        }
      }
    });
  }

  // wagon plat : plateau bas à rayures jaunes, ridelles aux coins
  function plat(o, a, b, premier) {
    const x = lx(o.l),
      x0 = x - DEMI,
      x1 = x + DEMI,
      c = [132, 146, 176];
    pave(x - 0.7, x + 0.7, 0, 0.35, Math.max(a, cam.z + PRES), b, [50, 54, 66], false); // châssis, sous le plateau
    pave(x0, x1, 0.35, H_PLAT, a, b, c, premier, (t, z0, coupe) => {
      bandeCotes(x0, x1, H_PLAT - 0.18, H_PLAT - 0.06, z0, b, [255, 196, 0], t);
      if (premier && !coupe) poly(quadZ(x0, x1, H_PLAT - 0.18, H_PLAT - 0.06, z0), teinte([255, 196, 0], t));
      if (cam.y > H_PLAT) for (const s of [-0.55, 0.55]) poly(quadY(x + s - 0.05, x + s + 0.05, H_PLAT + 0.01, z0, b), teinte([120, 130, 150], t));
    });
  }

  function rampe(o) {
    const x = lx(o.l),
      x0 = x - DEMI,
      x1 = x + DEMI,
      n = cam.z + PRES;
    let a = o.z0;
    const b = o.z0 + RAMPE;
    if (b <= n) return;
    const ha = a < n ? (H_TRAIN * (n - o.z0)) / RAMPE : 0;
    if (a < n) a = n;
    const t = brume(a - cam.z),
      c = [150, 164, 190];
    if (cam.x < x0) poly([proj(x0, 0, a), proj(x0, 0, b), proj(x0, H_TRAIN, b), proj(x0, ha, a)], teinte(c, t, 0.78));
    if (cam.x > x1) poly([proj(x1, 0, a), proj(x1, 0, b), proj(x1, H_TRAIN, b), proj(x1, ha, a)], teinte(c, t, 0.78));
    poly([proj(x0, ha, a), proj(x1, ha, a), proj(x1, H_TRAIN, b), proj(x0, H_TRAIN, b)], teinte(c, t, 1.05));
    ctx.strokeStyle = teinte([120, 132, 156], t);
    for (let i = 1; i < 6; i++) {
      const z = o.z0 + i,
        y = (H_TRAIN * i) / RAMPE;
      if (z <= a) continue;
      const p = proj(x0 + 0.1, y, z),
        q = proj(x1 - 0.1, y, z);
      ctx.lineWidth = Math.max(1, (0.05 * F) / p.d);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }
  }

  // barrière basse (à sauter) ou portique (à passer en glissant), rayée pour bien se voir
  function barriere(o) {
    const x = lx(o.l),
      z0 = o.z0,
      z1 = o.z0 + 0.3,
      bas = o.t == 'bas',
      c1 = bas ? [255, 107, 107] : [91, 108, 255],
      y0 = bas ? 0.3 : 1.05,
      y1 = bas ? 0.65 : 1.6,
      hp = bas ? 0.65 : 1.75;
    for (const s of [-1, 1]) pave(x + s * 0.92 - 0.07, x + s * 0.92 + 0.07, 0, hp, z0 + 0.08, z1 - 0.08, [210, 216, 228]);
    pave(x - DEMI, x + DEMI, y0, y1, z0, z1, [255, 255, 255], true, (t, zz, coupe) => {
      if (coupe) return;
      for (let i = 0; i < 6; i += 2) {
        const a = x - DEMI + (i * 2 * DEMI) / 6,
          b = a + (2 * DEMI) / 6;
        poly(quadZ(a, b, y0, y1, zz), teinte(c1, t));
      }
    });
  }

  // caisse en bois, marquée d'un point d'interrogation : s'écrase en glissant depuis un saut
  function caisse(o) {
    const x = lx(o.l),
      y0 = o.y0,
      y1 = y0 + H_CAISSE;
    pave(x - 0.55, x + 0.55, y0, y1, o.z0, o.z1, [214, 160, 92], true, (t, zz, coupe) => {
      const f = [150, 100, 52];
      bandeCotes(x - 0.55, x + 0.55, y0 + 0.06, y0 + 0.14, zz, o.z1, f, t);
      bandeCotes(x - 0.55, x + 0.55, y1 - 0.14, y1 - 0.06, zz, o.z1, f, t);
      if (coupe) return;
      poly(quadZ(x - 0.5, x + 0.5, y0 + 0.06, y0 + 0.14, zz), teinte(f, t));
      poly(quadZ(x - 0.5, x + 0.5, y1 - 0.14, y1 - 0.06, zz), teinte(f, t));
      const p = proj(x, (y0 + y1) / 2, zz);
      ctx.fillStyle = teinte([255, 240, 200], t);
      ctx.font = '700 ' + ((0.55 * F) / p.d).toFixed(1) + 'px "Bricolage Grotesque", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', p.x, p.y);
    });
  }

  // drone à hélices, œil rouge, qui balaie deux voies
  function drone(o) {
    const x = droneX(o),
      y = 1.38 + Math.sin(S.t * 6 + o.ph) * 0.04,
      p = proj(x, y, o.z0);
    if (p.d < PRES) return;
    const s = F / p.d,
      t = brume(p.d);
    ctx.fillStyle = teinte([40, 46, 66], t);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 0.55 * s, 0.22 * s, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = teinte([70, 78, 104], t);
    ctx.fillRect(p.x - 0.75 * s, p.y - 0.28 * s, 1.5 * s, 0.07 * s);
    ctx.fillStyle = 'rgba(220,230,255,' + 0.5 * (1 - t) + ')';
    for (const sx of [-0.72, 0.72]) {
      ctx.beginPath();
      ctx.ellipse(p.x + sx * s, p.y - 0.32 * s, 0.32 * s, 0.05 * s, 0, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = Math.floor(S.t * 4) % 2 ? '#ff3b5c' : '#ff8fa3';
    ctx.beginPath();
    ctx.arc(p.x, p.y + 0.02 * s, 0.1 * s, 0, 7);
    ctx.fill();
  }

  // accélérateur : flèches lumineuses au sol
  function accelerateur(o) {
    if (o.pris && P.z > o.z1) return;
    const x = lx(o.l),
      t = brume(o.z0 - cam.z),
      z0 = Math.max(o.z0, cam.z + PRES);
    if (z0 >= o.z1) return;
    poly(quadY(x - 0.85, x + 0.85, 0.06, z0, o.z1), teinte([40, 230, 200], t, 1, true));
    const k = (S.t * 3) % 1;
    for (let i = 0; i < 3; i++) {
      const zc = o.z0 + 0.3 + (i + k) * 0.75;
      if (zc < z0 || zc > o.z1 - 0.3) continue;
      poly([proj(x - 0.6, 0.08, zc), proj(x, 0.08, zc + 0.5), proj(x + 0.6, 0.08, zc), proj(x, 0.08, zc + 0.2)], teinte([255, 255, 255], t, 1, true));
    }
  }

  // arche d'arrivée des niveaux
  function arrivee(o) {
    const z = o.z0;
    for (const s of [-1, 1]) pave(s * 3.9 - 0.2, s * 3.9 + 0.2, 0, 5, z, z + 0.4, [255, 255, 255]);
    pave(-4.1, 4.1, 4, 5, z, z + 0.4, [255, 255, 255], true, (t, zz, coupe) => {
      if (coupe) return;
      for (let i = 0; i < 16; i++)
        for (let j = 0; j < 2; j++) if ((i + j) % 2) poly(quadZ(-4.1 + (i * 8.2) / 16, -4.1 + ((i + 1) * 8.2) / 16, 4 + j * 0.5, 4.5 + j * 0.5, zz), teinte([30, 30, 40], t));
    });
    for (let l = 0; l < 3; l++) poly(quadY(lx(l) - 1, lx(l) + 1, 0.07, Math.max(z, cam.z + PRES), z + 0.6), teinte([255, 255, 255], brume(z - cam.z)));
  }

  function catenaire(z) {
    const c = [120, 130, 150];
    for (const s of [-1, 1]) pave(s * 4.45 - 0.12, s * 4.45 + 0.12, 0, 5.3, z, z + 0.24, c);
    pave(-4.6, 4.6, 5.05, 5.3, z, z + 0.24, c);
  }

  function passerelle(p) {
    pave(-14, 14, 5.7, 6.5, p.z0, p.z1, p.c);
    for (const s of [-1, 1]) pave(s * 5.8 - 0.4, s * 5.8 + 0.4, 0, 5.7, p.z0 + 1.6, p.z0 + 2.4, mixer(p.c, [0, 0, 0], 0.15));
  }

  function dessinPiece(c) {
    const p = proj(c.x, c.y, c.z);
    if (p.d < PRES) return;
    const rr = (0.32 * F) / p.d;
    if (rr < 0.7) return;
    const w = Math.max(rr * 0.18, Math.abs(Math.cos(S.t * 4 + c.a)) * rr),
      t = brume(p.d);
    ctx.fillStyle = teinte([230, 154, 0], t, 1, true);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, w, rr, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = teinte([255, 207, 64], t, 1, true);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, w * 0.78, rr * 0.78, 0, 0, 7);
    ctx.fill();
  }

  function dessinBonus(b) {
    const p = proj(b.x, b.y + Math.sin(S.t * 3 + b.z) * 0.15, b.z);
    if (p.d < PRES) return;
    const rr = (0.48 * F) / p.d;
    if (rr < 1) return;
    ctx.save();
    ctx.globalAlpha = 1 - brume(p.d) * 0.7;
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, rr * 1.35, 0, 7);
    ctx.fill();
    ctx.fillStyle = b.k == 'lettre' ? '#ffb703' : b.k == 'jeton' ? (EV ? EV.couleur : '#ff8c2e') : BONUS[b.k].c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rr, 0, 7);
    ctx.fill();
    ctx.translate(p.x, p.y);
    ctx.scale(rr, rr);
    icone(b.k);
    ctx.restore();
  }

  // icône d'un bonus dans un cercle de rayon 1
  function icone(k) {
    ctx.strokeStyle = ctx.fillStyle = '#fff';
    ctx.lineWidth = 0.2;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.beginPath();
    if (k == 'aimant') {
      ctx.arc(0, -0.05, 0.38, Math.PI, 0, true);
      ctx.moveTo(-0.38, -0.05);
      ctx.lineTo(-0.38, -0.45);
      ctx.moveTo(0.38, -0.05);
      ctx.lineTo(0.38, -0.45);
      ctx.stroke();
    } else if (k == 'saut') {
      for (const y of [0.05, 0.4]) {
        ctx.moveTo(-0.38, y);
        ctx.lineTo(0, y - 0.38);
        ctx.lineTo(0.38, y);
      }
      ctx.stroke();
    } else if (k == 'jetpack') {
      ctx.fillRect(-0.4, -0.45, 0.32, 0.6);
      ctx.fillRect(0.08, -0.45, 0.32, 0.6);
      ctx.fillStyle = '#ffd166';
      ctx.moveTo(-0.38, 0.22);
      ctx.lineTo(-0.24, 0.6);
      ctx.lineTo(-0.1, 0.22);
      ctx.moveTo(0.1, 0.22);
      ctx.lineTo(0.24, 0.6);
      ctx.lineTo(0.38, 0.22);
      ctx.fill();
    } else if (k == 'jeton') {
      const j = EV ? EV.jeton : 'citrouille';
      if (j == 'citrouille') {
        ctx.fillStyle = '#ffd9a8';
        ctx.moveTo(-0.35, -0.1);
        ctx.lineTo(-0.18, -0.32);
        ctx.lineTo(-0.02, -0.1);
        ctx.moveTo(0.02, -0.1);
        ctx.lineTo(0.18, -0.32);
        ctx.lineTo(0.35, -0.1);
        ctx.moveTo(-0.4, 0.1);
        ctx.quadraticCurveTo(0, 0.55, 0.4, 0.1);
        ctx.fill();
      } else if (j == 'cadeau') {
        ctx.fillRect(-0.4, -0.25, 0.8, 0.65);
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(-0.08, -0.25, 0.16, 0.65);
        ctx.fillRect(-0.4, -0.02, 0.8, 0.14);
        ctx.beginPath();
        ctx.ellipse(-0.14, -0.35, 0.14, 0.09, -0.4, 0, 7);
        ctx.ellipse(0.14, -0.35, 0.14, 0.09, 0.4, 0, 7);
        ctx.fill();
      } else {
        ctx.fillStyle = '#ffd6a5';
        ctx.moveTo(-0.25, -0.05);
        ctx.lineTo(0, 0.55);
        ctx.lineTo(0.25, -0.05);
        ctx.fill();
        ctx.fillStyle = '#ff8fab';
        ctx.beginPath();
        ctx.arc(0, -0.15, 0.3, 0, 7);
        ctx.fill();
      }
    } else if (k == 'bulle') {
      ctx.arc(0, 0, 0.45, 0, 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-0.15, -0.15, 0.1, 0, 7);
      ctx.fill();
    } else {
      ctx.font = '700 ' + (k == 'x2' ? 0.9 : 1.1) + 'px "Bricolage Grotesque", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(k == 'x2' ? '×2' : motDuJour()[Math.min(D.mot.n, motDuJour().length - 1)], 0, 0.06);
    }
  }

  // rectangle arrondi (sans ctx.roundRect, absent des anciens Safari)
  function arrondi(c, x, y, w, h, r) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }
  const ligne = (c, w, pts) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.stroke();
  };
  const ovale = (c, x, y, rx, ry) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, 7);
    ctx.fill();
  };

  // tête vue de dos, selon la coiffure du personnage
  function tete(pr, y) {
    ovale(pr.peau, -0.2, y + 0.03, 0.05, 0.07);
    ovale(pr.peau, 0.2, y + 0.03, 0.05, 0.07);
    if (pr.coiffure == 'couettes') {
      ovale(pr.cheveux, -0.27, y + 0.08, 0.1, 0.16);
      ovale(pr.cheveux, 0.27, y + 0.08, 0.1, 0.16);
      ovale(pr.accessoire, -0.22, y - 0.03, 0.05, 0.04);
      ovale(pr.accessoire, 0.22, y - 0.03, 0.05, 0.04);
    }
    ovale(pr.cheveux, 0, y, 0.2, 0.2);
    ctx.fillStyle = pr.accessoire;
    if (pr.coiffure == 'casquette') {
      ctx.beginPath();
      ctx.arc(0, y - 0.03, 0.21, Math.PI, 0);
      ctx.fill();
      ovale('#ffffff', 0, y - 0.22, 0.04, 0.03);
    } else if (pr.coiffure == 'bonnet') {
      ctx.beginPath();
      ctx.arc(0, y - 0.02, 0.22, Math.PI, 0);
      ctx.fill();
      ovale('#ffffff', 0, y - 0.27, 0.07, 0.07);
      arrondi(mixer3(pr.accessoire), -0.22, y - 0.06, 0.44, 0.07, 0.03);
    } else if (pr.coiffure == 'crete') ovale(pr.cheveux, 0, y - 0.2, 0.06, 0.16);
    else if (pr.coiffure == 'capuche') {
      ovale(pr.sweat, 0, y + 0.02, 0.26, 0.25);
      ovale(pr.accessoire, 0, y - 0.24, 0.05, 0.04);
    }
    else if (pr.coiffure == 'chignon') {
      ovale(pr.cheveux, 0, y - 0.22, 0.11, 0.1);
      arrondi(pr.accessoire, -0.09, y - 0.15, 0.18, 0.04, 0.02);
    }
  }
  const mixer3 = hex => {
    const n = parseInt(hex.slice(1), 16);
    return 'rgb(' + (((n >> 16) & 255) * 0.8) + ',' + (((n >> 8) & 255) * 0.8) + ',' + ((n & 255) * 0.8) + ')';
  };

  // aperçu d'un personnage vu de face, dans un petit canvas (boutique)
  function dessinFace(cvs, pr) {
    const vrai = ctx;
    ctx = cvs.getContext('2d');
    const w = cvs.width,
      h = cvs.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w / 2, h * 0.97);
    ctx.scale(h / 1.95, h / 1.95);
    ctx.lineCap = ctx.lineJoin = 'round';
    ligne(pr.pantalon, 0.18, [-0.14, -0.78, -0.16, -0.08]);
    ligne(pr.pantalon, 0.18, [0.14, -0.78, 0.16, -0.08]);
    ovale('#ffffff', -0.18, -0.05, 0.12, 0.07);
    ovale('#ffffff', 0.18, -0.05, 0.12, 0.07);
    ligne(pr.bras, 0.15, [-0.28, -1.2, -0.42, -0.98, -0.42, -0.8]);
    ligne(pr.bras, 0.15, [0.28, -1.2, 0.42, -0.98, 0.42, -0.8]);
    ovale(pr.peau, -0.42, -0.75, 0.07, 0.07);
    ovale(pr.peau, 0.42, -0.75, 0.07, 0.07);
    arrondi(pr.sweat, -0.3, -1.34, 0.6, 0.62, 0.16);
    ligne(pr.sac, 0.06, [-0.17, -1.3, -0.15, -0.98]);
    ligne(pr.sac, 0.06, [0.17, -1.3, 0.15, -0.98]);
    const y = -1.52;
    if (pr.coiffure == 'couettes') {
      ovale(pr.cheveux, -0.27, y + 0.08, 0.1, 0.16);
      ovale(pr.cheveux, 0.27, y + 0.08, 0.1, 0.16);
    }
    if (pr.coiffure == 'capuche') ovale(pr.sweat, 0, y - 0.01, 0.27, 0.26);
    ovale(pr.cheveux, 0, y - 0.03, 0.22, 0.21);
    ovale(pr.peau, 0, y + 0.03, 0.18, 0.18);
    ovale('#1d1d2b', -0.07, y + 0.02, 0.025, 0.035);
    ovale('#1d1d2b', 0.07, y + 0.02, 0.025, 0.035);
    ctx.strokeStyle = '#1d1d2b';
    ctx.lineWidth = 0.025;
    ctx.beginPath();
    ctx.arc(0, y + 0.07, 0.06, 0.25, Math.PI - 0.25);
    ctx.stroke();
    ctx.fillStyle = pr.cheveux;
    ctx.beginPath();
    ctx.arc(0, y - 0.02, 0.19, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
    ctx.fillStyle = pr.accessoire;
    if (pr.coiffure == 'casquette') {
      ctx.beginPath();
      ctx.arc(0, y - 0.06, 0.21, Math.PI, 0);
      ctx.fill();
      ovale(mixer3(pr.accessoire), 0, y - 0.07, 0.25, 0.05);
    } else if (pr.coiffure == 'bonnet') {
      ctx.beginPath();
      ctx.arc(0, y - 0.05, 0.22, Math.PI, 0);
      ctx.fill();
      arrondi(mixer3(pr.accessoire), -0.23, y - 0.1, 0.46, 0.08, 0.03);
      ovale('#ffffff', 0, y - 0.3, 0.07, 0.07);
    } else if (pr.coiffure == 'crete') ovale(pr.cheveux, 0, y - 0.23, 0.06, 0.15);
    else if (pr.coiffure == 'chignon') {
      ovale(pr.cheveux, 0, y - 0.25, 0.11, 0.1);
      arrondi(pr.accessoire, -0.09, y - 0.18, 0.18, 0.04, 0.02);
    } else if (pr.coiffure == 'couettes') {
      ovale(pr.accessoire, -0.22, y - 0.02, 0.05, 0.04);
      ovale(pr.accessoire, 0.22, y - 0.02, 0.05, 0.04);
    }
    ctx = vrai;
  }

  // le coureur, vu de dos ; sur sa planche, avec son jetpack, dans sa bulle
  function dessinCoureur() {
    const p = proj(P.x, P.y, P.z);
    if (p.d < PRES) return;
    const s = F / p.d,
      o = proj(P.x, P.gy, P.z),
      ht = P.y - P.gy,
      pr = PERSOS.find(x => x.id == D.perso) || PERSOS[0],
      pl = PLANCHES.find(x => x.id == D.planche) || PLANCHES[0],
      surPlanche = S.planche > 0 && !vole();
    ctx.fillStyle = 'rgba(20,28,50,' + 0.22 * Math.max(0.25, 1 - ht / 4) + ')';
    ctx.beginPath();
    ctx.ellipse(o.x, o.y, 0.5 * s * (1 - Math.min(0.5, ht / 10)), 0.15 * s, 0, 0, 7);
    ctx.fill();
    if (surPlanche) {
      // planche en perspective sous les pieds, avec une lueur de flottement
      const y = P.y + 0.12;
      const g = proj(P.x, P.y + 0.02, P.z);
      ctx.fillStyle = pl.lueur + '55';
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, 0.5 * s, 0.14 * s, 0, 0, 7);
      ctx.fill();
      poly([proj(P.x - 0.4, y, P.z - 0.85), proj(P.x + 0.4, y, P.z - 0.85), proj(P.x + 0.34, y, P.z + 1), proj(P.x, y, P.z + 1.15), proj(P.x - 0.34, y, P.z + 1)], pl.c1);
      poly([proj(P.x - 0.11, y + 0.01, P.z - 0.75), proj(P.x + 0.11, y + 0.01, P.z - 0.75), proj(P.x + 0.11, y + 0.01, P.z + 0.95), proj(P.x - 0.11, y + 0.01, P.z + 0.95)], pl.c2);
      poly(quadZ(P.x - 0.4, P.x + 0.4, y - 0.1, y, P.z - 0.85), mixer3(pl.c1));
    }
    ctx.save();
    if (S.invu > 0 && Math.floor(S.t * 16) % 2) ctx.globalAlpha = 0.45;
    ctx.translate(p.x, p.y);
    ctx.scale(s, s);
    if (P.figure > 0) {
      // tour complet sur soi-même pendant le saut
      const c = Math.cos(Math.min(1, P.figure / 0.5) * Math.PI * 2);
      ctx.scale(Math.sign(c || 1) * Math.max(0.12, Math.abs(c)), 1);
    }
    ctx.rotate((lx(P.voie) - P.x) * -0.1 + (S.mode == 'fin' && S.raison == 'choc' ? P.chute * 1.25 : 0));
    ctx.lineCap = ctx.lineJoin = 'round';
    const ph = P.course * 0.55,
      sw = S.mode == 'fin' && S.raison == 'choc' ? 0 : surPlanche ? 0 : Math.sin(ph),
      air = !P.sol,
      jet = vole(),
      chaussure = S.bonus.saut ? '#06d6a0' : '#ffffff';
    if (surPlanche) ctx.translate(0, -0.18);
    if (P.glisse > 0 && P.sol) {
      // glissade : tout le corps ramassé près du sol
      ligne(pr.pantalon, 0.17, [-0.2, -0.3, -0.26, -0.06]);
      ligne(pr.pantalon, 0.17, [0.2, -0.3, 0.26, -0.06]);
      ovale(chaussure, -0.27, -0.04, 0.11, 0.06);
      ovale(chaussure, 0.27, -0.04, 0.11, 0.06);
      ovale(pr.sweat, 0, -0.42, 0.42, 0.3);
      ovale(pr.sac, 0, -0.45, 0.25, 0.18);
      tete(pr, -0.72);
    } else {
      ctx.translate(0, air || surPlanche ? 0 : -Math.abs(sw) * 0.05); // petit rebond de la course
      const pied = v => (jet ? 0.25 : air ? 0.38 : 0.04 + 0.34 * Math.max(0, v));
      const ec = surPlanche ? 0.24 : 0.17;
      ligne(pr.pantalon, 0.18, [-0.14, -0.78, -0.16, -0.4 - pied(sw) * 0.4, -ec, -0.06 - pied(sw)]);
      ligne(pr.pantalon, 0.18, [0.14, -0.78, 0.16, -0.4 - pied(-sw) * 0.4, ec, -0.06 - pied(-sw)]);
      ovale(chaussure, -ec, -0.04 - pied(sw), 0.11, 0.07);
      ovale(chaussure, ec, -0.04 - pied(-sw), 0.11, 0.07);
      const main = v => (jet ? -1.0 : air ? -1.55 : surPlanche ? -1.05 : -0.86 + 0.14 * v),
        ecart = surPlanche ? 0.62 : 0.38;
      ligne(pr.bras, 0.15, [-0.28, -1.2, -0.4, -1.0, -ecart, main(-sw)]);
      ligne(pr.bras, 0.15, [0.28, -1.2, 0.4, -1.0, ecart, main(sw)]);
      arrondi(pr.sweat, -0.3, -1.34, 0.6, 0.62, 0.16);
      if (jet) {
        // jetpack à deux réservoirs, flammes vacillantes
        for (const x of [-0.22, 0.04]) arrondi('#9aa3b8', x, -1.3, 0.18, 0.5, 0.08);
        const fl = 0.3 + Math.random() * 0.2;
        ctx.fillStyle = '#ffb703';
        for (const x of [-0.13, 0.13]) {
          ctx.beginPath();
          ctx.moveTo(x - 0.08, -0.8);
          ctx.lineTo(x, -0.8 + fl);
          ctx.lineTo(x + 0.08, -0.8);
          ctx.fill();
        }
      } else {
        arrondi(pr.sac, -0.2, -1.26, 0.4, 0.4, 0.1);
        arrondi('rgba(255,255,255,.45)', -0.12, -1.04, 0.24, 0.1, 0.04);
      }
      tete(pr, -1.5);
    }
    ctx.restore();
    if (S.bonus.bulle) {
      ctx.fillStyle = 'rgba(255,112,166,.18)';
      ctx.strokeStyle = 'rgba(255,112,166,.8)';
      ctx.lineWidth = Math.max(1.5, 0.05 * s);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 0.8 * s, 0.78 * s, 1.02 * s, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ovale('rgba(255,255,255,.6)', p.x - 0.35 * s, p.y - 1.35 * s, 0.12 * s, 0.08 * s);
    }
  }

  // le poursuivant (un agent en gilet orange) et son chien robot, derrière le coureur
  function poursuivant(zc) {
    // décalé vers le centre des voies pour ne pas masquer le coureur
    const x = P.x + (P.x > 0.5 ? -1 : 1) * 1.05,
      p = proj(x, 0, zc);
    if (p.d < PRES) return;
    const s = F / p.d,
      sw = Math.sin(S.t * 14);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(s, s);
    ctx.lineCap = ctx.lineJoin = 'round';
    ligne('#25304d', 0.19, [-0.14, -0.78, -0.17, -0.06 - Math.max(0, sw) * 0.3]);
    ligne('#25304d', 0.19, [0.14, -0.78, 0.17, -0.06 - Math.max(0, -sw) * 0.3]);
    ligne('#25304d', 0.16, [-0.3, -1.2, -0.45, -0.95 - sw * 0.15]);
    ligne('#25304d', 0.16, [0.3, -1.2, 0.45, -0.95 + sw * 0.15]);
    arrondi('#ff8c2e', -0.32, -1.36, 0.64, 0.64, 0.14);
    arrondi('#e8eaf0', -0.32, -1.08, 0.64, 0.07, 0.02);
    ovale('#3b2a20', 0, -1.52, 0.2, 0.2);
    ctx.fillStyle = '#25304d';
    ctx.beginPath();
    ctx.arc(0, -1.55, 0.22, Math.PI, 0);
    ctx.fill();
    // chien robot, de l'autre côté
    ctx.translate((P.x > 0.5 ? -1 : 1) * -2.1, 0);
    arrondi('#c9d1e3', -0.28, -0.62, 0.56, 0.32, 0.12);
    arrondi('#c9d1e3', -0.15, -0.86, 0.3, 0.26, 0.1);
    for (const x of [-0.2, 0.2]) ligne('#7a849c', 0.08, [x, -0.32, x, -0.04 - (x > 0 ? Math.max(0, sw) : Math.max(0, -sw)) * 0.15]);
    ligne('#7a849c', 0.04, [0, -0.86, 0, -1.02]);
    ovale(Math.floor(S.t * 6) % 2 ? '#4cc9f0' : '#bde8ff', 0, -1.05, 0.05, 0.05);
    ctx.restore();
  }

  // pluie : traits obliques qui tombent, sauf sous les tunnels
  const gouttes = Array.from({ length: 90 }, () => [Math.random(), Math.random(), 0.6 + Math.random() * 0.8]);
  function pluie() {
    const k = PAL.pluie * (1 - S.ombre);
    if (k < 0.05) return;
    ctx.strokeStyle = 'rgba(220,230,245,' + 0.4 * k + ')';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const n = DETAIL > 1 ? gouttes.length : 45;
    for (let i = 0; i < n; i++) {
      const [gx, gy, v] = gouttes[i],
        y = ((gy + S.t * 1.6 * v) % 1) * H,
        x = ((gx - S.t * 0.15 - cam.x * 0.01) % 1 + 1) % 1 * W,
        L = 16 + 14 * v;
      ctx.moveTo(x, y);
      ctx.lineTo(x - L * 0.25, y + L);
    }
    ctx.stroke();
  }

  // traits de vitesse pendant le turbo et le jetpack
  function vitesseTraits() {
    const k = S.turbo > 0 || S.elan > 0 ? 1 : S.bonus.jetpack ? 0.6 : 0;
    if (!k || reduit) return;
    ctx.strokeStyle = 'rgba(255,255,255,' + 0.35 * k + ')';
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * 6.28 + ((S.t * 7) % 1) * 0.3,
        r0 = Math.min(W, H) * (0.35 + ((S.t * 3 + i * 0.37) % 1) * 0.4);
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a) * r0, HORIZON + Math.sin(a) * r0);
      ctx.lineTo(CX + Math.cos(a) * (r0 + 60), HORIZON + Math.sin(a) * (r0 + 60));
      ctx.stroke();
    }
  }

  function dessiner() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // champ de vision un peu plus large à grande vitesse
    F = F0 * (1 - Math.min(0.12, Math.max(0, S.v - 15) * 0.003) - (S.turbo > 0 ? 0.05 : 0));
    HORIZON = CY - F * Math.tan(0.2);
    if (S.secousse > 0 && !reduit) {
      const a = S.secousse * 14;
      ctx.translate((Math.random() - 0.5) * a, (Math.random() - 0.5) * a);
    }
    majPalette();
    ciel();
    dessinerDecor();
    dessinerVoies();
    dessinerParcours();
    pluie();
    if (EV && EV.id == 'hiver') neige();
    if (EV && EV.id == 'halloween') chauvesSouris();
    vitesseTraits();
    if (S.flash > 0) {
      // bords de l'écran rougis quand on se fait toucher
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(255,40,60,0)');
      g.addColorStop(1, 'rgba(255,40,60,' + Math.min(0.55, S.flash * 1.4) + ')');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // neige des fêtes d'hiver : flocons qui tombent en se balançant
  function neige() {
    if (S.ombre > 0.9) return;
    ctx.fillStyle = 'rgba(255,255,255,' + 0.85 * (1 - S.ombre) + ')';
    const n = DETAIL > 1 ? gouttes.length : 45;
    for (let i = 0; i < n; i++) {
      const [gx, gy, v] = gouttes[i],
        y = ((gy + S.t * 0.12 * v) % 1) * H,
        x = ((gx + Math.sin(S.t * v + i) * 0.02 - cam.x * 0.01) % 1 + 1) % 1 * W;
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + v * 1.5, 0, 7);
      ctx.fill();
    }
  }

  // chauves-souris d'Halloween dans le ciel
  function chauvesSouris() {
    ctx.fillStyle = 'rgba(30,16,40,.85)';
    for (let i = 0; i < 6; i++) {
      const x = ((i * 0.37 + S.t * 0.03 * (1 + i * 0.2)) % 1.2 - 0.1) * W,
        y = HORIZON * (0.2 + 0.12 * Math.sin(S.t * 0.7 + i * 2)),
        a = Math.sin(S.t * 14 + i) * 0.6,
        s = Math.min(W, H) * (0.018 + (i % 3) * 0.006);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - s, y - s * a - s * 0.3, x - s * 2, y - s * a * 1.4);
      ctx.quadraticCurveTo(x - s * 1.2, y + s * 0.2, x, y + s * 0.35);
      ctx.quadraticCurveTo(x + s * 1.2, y + s * 0.2, x + s * 2, y - s * a * 1.4);
      ctx.quadraticCurveTo(x + s, y - s * a - s * 0.3, x, y);
      ctx.fill();
    }
  }

  // ---------- Interface ----------
  const $ = id => document.getElementById(id);
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => Math.floor(n).toLocaleString('fr-FR');
  const secondes = d => d.toLocaleString('fr-FR') + ' s';
  const ECRANS = ['menu', 'aide', 'boutique', 'missions', 'niveaux', 'defi', 'trophees', 'reglages', 'cadeau', 'coffre', 'evenement', 'pause', 'continuer', 'fin'],
    SECONDAIRES = ['aide', 'boutique', 'missions', 'niveaux', 'defi', 'trophees', 'reglages', 'cadeau', 'coffre', 'evenement'];
  let ecranActuel = 'menu';

  function ecran(id) {
    ecranActuel = id;
    for (const e of ECRANS) $(e).hidden = e != id;
    $('hud').hidden = !(S.mode == 'jeu' || S.mode == 'fin' || S.mode == 'continuer' || S.mode == 'pause') || id == 'menu' || SECONDAIRES.includes(id);
    if (id) {
      const b = [...$(id).querySelectorAll('.btn:not(:disabled)')].find(x => !x.hidden);
      if (b) b.focus({ preventScroll: true });
    }
  }

  function menu() {
    abandonner();
    S.mode = 'menu';
    musique(false);
    nouveauMonde(true);
    afficherMenu();
  }
  // retour au menu depuis un écran secondaire : le décor continue de défiler
  function afficherMenu() {
    majJour();
    $('m-record').textContent = fmt(D.record);
    $('m-pieces').textContent = fmt(D.pieces);
    $('m-cles').textContent = fmt(D.cles);
    $('m-multi').textContent = '×' + (D.multi + 1);
    const nf = D.missions.filter(m => m.fait).length;
    $('b-missions').querySelector('small').textContent = nf + ' / 3';
    $('b-niveaux').querySelector('small').textContent = '★ ' + D.niveaux.reduce((s, x) => s + (x || 0), 0) + ' / ' + NIVEAUX.length * 3;
    $('b-defi').querySelector('small').textContent = D.defi.meilleur ? 'meilleur : ' + fmt(D.defi.meilleur) : '60 secondes';
    verifierTrophees();
    $('b-trophees').querySelector('small').textContent = D.trophees.length + ' / ' + TROPHEES.length;
    $('b-boutique').querySelector('small').textContent = D.coffres ? D.coffres + ' coffre' + (D.coffres > 1 ? 's' : '') + ' à ouvrir' : 'persos, planches';
    $('b-boutique').classList.toggle('alerte', D.coffres > 0);
    const e = evenementActif();
    $('b-evenement').hidden = !e;
    if (e) {
      const prochain = e.paliers.find(p => p.n > D.ev.n);
      $('b-evenement').style.setProperty('--c', e.couleur);
      $('b-evenement').innerHTML = '<span aria-hidden="true">' + EMOJI[e.jeton] + '</span> ' + e.nom + '<small>' + D.ev.n + ' ' + e.jetons + (prochain ? ' · prochain cadeau à ' + prochain.n : ' · tout est gagné !') + '</small>';
    }
    if (verifierQuotidien()) return ecranCadeau();
    ecran('menu');
  }

  // ----- cadeau du jour -----
  function ecranCadeau() {
    $('ca-jours').innerHTML = QUOTIDIEN.map((c, i) => '<li class="' + (i + 1 < D.quotidien.serie ? 'pris' : i + 1 == D.quotidien.serie ? 'auj' : '') + '"><small>Jour ' + (i + 1) + '</small><b>' + c.txt + '</b></li>').join('');
    $('ca-serie').textContent = D.quotidien.serie > 1 ? D.quotidien.serie + ' jours d\'affilée !' : 'Reviens chaque jour pour de plus beaux cadeaux.';
    ecran('cadeau');
  }

  // ----- événement saisonnier -----
  const EMOJI = { citrouille: '🎃', cadeau: '🎁', glace: '🍦' };
  const dateFin = e => {
    const [m, j] = e.fin.split('-').map(Number);
    return j + ' ' + ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][m - 1];
  };
  function ecranEvenement() {
    const e = evenementActif();
    if (!e) return afficherMenu();
    $('t-evenement').textContent = EMOJI[e.jeton] + ' ' + e.nom;
    $('ev-dates').textContent = 'Jusqu\'au ' + dateFin(e) + ' : ramasse les ' + e.jetons + ' pendant tes courses.';
    const max = e.paliers[e.paliers.length - 1].n;
    $('ev-barre').style.width = Math.min(100, (100 * D.ev.n) / max) + '%';
    $('ev-barre').style.background = e.couleur;
    $('ev-n').textContent = D.ev.n + ' ' + e.jetons;
    $('ev-paliers').innerHTML = e.paliers
      .map((p, i) => {
        const ok = D.ev.pris.includes(i);
        return '<li class="' + (ok ? 'fait' : '') + '">' + (p.perso ? '<canvas class="apercu" data-perso="' + p.perso + '" width="96" height="120" aria-hidden="true"></canvas>' : p.planche ? '<span class="mini-planche" style="--c1:' + PLANCHES.find(x => x.id == p.planche).c1 + ';--c2:' + PLANCHES.find(x => x.id == p.planche).c2 + '" aria-hidden="true"></span>' : '<span class="bic" style="--c:' + e.couleur + '" aria-hidden="true">' + (p.coffres ? '?' : '◉') + '</span>') + '<span><b>' + p.txt + '</b><small>' + p.n + ' ' + e.jetons + '</small></span><em>' + (ok ? '✓' : Math.max(0, p.n - D.ev.n) + ' de plus') + '</em></li>';
      })
      .join('');
    for (const c of $('ev-paliers').querySelectorAll('[data-perso]')) dessinFace(c, PERSOS.find(x => x.id == c.dataset.perso));
    ecran('evenement');
  }

  // ----- coffre mystère -----
  function ecranCoffre() {
    $('co-boite').className = 'coffre';
    $('co-res').textContent = '';
    $('co-res').className = 'co-res';
    majCoffre();
    ecran('coffre');
  }
  function majCoffre() {
    $('co-n').textContent = D.coffres;
    $('b-ouvrir').disabled = D.coffres < 1;
    $('b-ouvrir').textContent = $('co-res').textContent ? (D.coffres ? 'Encore un !' : 'Plus de coffre') : 'Ouvrir';
  }
  $('b-ouvrir').onclick = () => {
    if (D.coffres < 1 || $('co-boite').classList.contains('secoue')) return;
    const boite = $('co-boite');
    boite.className = 'coffre';
    $('co-res').textContent = '';
    $('co-res').className = 'co-res';
    void boite.offsetWidth;
    boite.className = 'coffre secoue';
    $('b-ouvrir').disabled = true;
    const res = ouvrirCoffre();
    setTimeout(
      () => {
        boite.className = 'coffre ouvert' + (res.rare ? ' rare' : '');
        $('co-res').innerHTML = '<span aria-hidden="true">' + res.icone + '</span> ' + res.txt;
        $('co-res').className = 'co-res on' + (res.rare ? ' rare' : '');
        son('coffre');
        vibrer(res.rare ? 120 : 50);
        majCoffre();
      },
      reduit ? 50 : 900
    );
  };

  // ----- partager son score -----
  async function partager() {
    const b = $('b-partager'),
      quoi = S.type == 'niveau' ? 'le niveau ' + (S.niveau + 1) + ' du Tour de la ville' : S.type == 'defi' ? 'le Défi du jour' : 'Voie libre';
    const texte = 'J\'ai fait ' + fmt(S.score) + ' points sur ' + quoi + ' (' + fmt(S.dist) + ' m) ! Viens battre mon score :';
    const url = location.href.split(/[?#]/)[0];
    try {
      if (navigator.share) await navigator.share({ title: 'Voie libre', text: texte, url });
      else {
        await navigator.clipboard.writeText(texte + ' ' + url);
        b.textContent = 'Copié !';
        setTimeout(() => (b.textContent = 'Partager mon score'), 1800);
      }
    } catch (e) {}
  }

  // ----- trophées et records -----
  function ecranTrophees() {
    verifierTrophees();
    $('tr-total').textContent = D.trophees.length + ' / ' + TROPHEES.length;
    $('tr-liste').innerHTML = TROPHEES.map(t => {
      const ok = D.trophees.includes(t.id),
        v = Math.min(t.n, valeurTrophee(t.type));
      return '<li class="' + (ok ? 'fait' : '') + '"><span>' + (ok ? '🏆 ' : '') + t.nom + '<small>' + t.txt + ' · +' + fmt(t.gain) + ' pièces</small></span><i><b style="width:' + (100 * v) / t.n + '%"></b></i><small>' + (ok ? '✓' : fmt(v) + ' / ' + fmt(t.n)) + '</small></li>';
    }).join('');
    const nomPerso = id => (PERSOS.find(x => x.id == id) || PERSOS[0]).nom;
    $('tr-scores').innerHTML = D.scores.length
      ? D.scores.map((e, i) => '<li><b>' + (i + 1) + '</b><span>' + fmt(e.s) + '</span><small>' + fmt(e.d) + ' m · ' + nomPerso(e.p) + (e.j ? ' · ' + e.j.split('-').reverse().join('/') : '') + '</small></li>').join('')
      : '<li class="vide">Pas encore de score : lance une course libre !</li>';
    $('tr-stats').innerHTML = [
      ['Courses', D.parties],
      ['Pièces ramassées', D.st.pieces],
      ['Meilleure distance', fmt(D.distance) + ' m'],
      ['Caisses écrasées', D.st.caisses],
      ['Drones évités', D.st.drones],
      ['Sur les toits', fmt(D.st.toits) + ' m']
    ].map(([k, v]) => '<div><span>' + k + '</span><b>' + (typeof v == 'number' ? fmt(v) : v) + '</b></div>').join('');
    ecran('trophees');
  }

  // ----- réglages -----
  function ecranReglages() {
    majReglages();
    ecran('reglages');
  }
  function majReglages() {
    majSon();
    $('b-vib').textContent = 'Vibrations : ' + (D.reglages.vib ? 'oui' : 'non');
    $('b-vib').setAttribute('aria-pressed', D.reglages.vib ? 'true' : 'false');
    for (const b of document.querySelectorAll('[data-sens]')) b.setAttribute('aria-pressed', +b.dataset.sens == D.reglages.sens ? 'true' : 'false');
    for (const b of document.querySelectorAll('[data-qualite]')) b.setAttribute('aria-pressed', b.dataset.qualite == D.reglages.qualite ? 'true' : 'false');
  }
  function appliquerQualite() {
    const q = D.reglages.qualite;
    DETAIL = q == 'basse' ? 0 : 2;
    maxDPR = q == 'basse' ? 1 : 2;
    lent = 0;
    taille();
  }

  // course abandonnée (Recommencer ou Menu pendant la pause) : les pièces ramassées sont gardées
  function abandonner() {
    if (S.mode == 'pause' && !S.demo && S.pieces) {
      D.pieces += S.pieces;
      ecrire();
    }
  }

  function demarrer(type = 'libre', niveau = -1) {
    abandonner();
    majJour();
    tutoT = -1;
    nouveauMonde(false, type, niveau);
    S.mode = 'jeu';
    hudCache = {};
    ecran(null);
    $('hud').hidden = false;
    $('h-prog').hidden = type != 'niveau';
    $('h-temps').hidden = type != 'defi';
    if (type == 'niveau') message(QUARTIERS[S.q].nom + ' · niveau ' + ((niveau % 3) + 1), 'quartier');
    else if (type == 'defi') message('Défi du jour : 60 secondes !', 'quartier');
    else message(QUARTIERS[S.qVu].nom, 'quartier');
    musique(true);
  }
  const rejouer = () => demarrer(S.type, S.niveau);

  function pause() {
    if (S.mode != 'jeu') return;
    S.mode = 'pause';
    musique(false);
    $('p-missions').innerHTML = listeMissions();
    ecran('pause');
  }
  function reprendre() {
    if (S.mode != 'pause') return;
    S.mode = 'jeu';
    derniere = 0;
    ecran(null);
    $('hud').hidden = false;
    musique(true);
  }

  function afficherContinuer(cout) {
    $('c-cout').textContent = cout;
    $('c-cles').textContent = fmt(D.cles);
    $('b-continuer').innerHTML = 'Utiliser ' + cout + ' clé' + (cout > 1 ? 's' : '') + ' <span aria-hidden="true">🔑</span>';
    ecran('continuer');
  }
  function majContinuer() {
    $('c-barre').style.width = Math.max(0, (S.compte / 5) * 100) + '%';
  }

  function afficherFin() {
    const v = S.raison == 'victoire',
      tps = S.raison == 'temps';
    $('t-fin').textContent = v ? 'Niveau terminé !' : tps ? 'Temps écoulé !' : S.type == 'niveau' ? 'Niveau raté' : 'Fin de la course';
    $('f-score').textContent = fmt(S.score);
    $('f-record').hidden = !S.nouveau && !S.rang;
    $('f-record').textContent = S.nouveau ? 'Nouveau record !' : S.rang ? S.rang + (S.rang == 1 ? 'er' : 'e') + ' meilleur score' : '';
    $('f-etoiles').hidden = !v;
    if (v) $('f-etoiles').innerHTML = [0, 1, 2].map(i => '<span class="' + (i < S.etoiles ? 'on' : '') + '">★</span>').join('') + '<small>Arrivée · ' + NIVEAUX[S.niveau].pieces + ' pièces · sans trébucher</small>';
    $('f-dist').textContent = fmt(S.dist) + ' m';
    $('f-pieces').textContent = fmt(S.pieces);
    $('f-recompense').hidden = !S.recompense;
    $('f-recompense').textContent = S.recompense;
    $('f-missions').innerHTML = S.missionsFaites.map(t => '<li>✓ ' + t + '</li>').join('');
    $('f-missions').hidden = !S.missionsFaites.length;
    const suivant = S.type == 'niveau' && v && S.niveau + 1 < NIVEAUX.length;
    $('b-suivant').hidden = !suivant;
    $('b-rejouer').textContent = S.type == 'niveau' ? 'Recommencer le niveau' : 'Rejouer';
    ecran('fin');
    if (suivant) $('b-suivant').focus({ preventScroll: true });
  }

  // ----- missions -----
  function listeMissions() {
    return D.missions
      .map(m => {
        const pc = Math.min(100, (100 * m.p) / m.n);
        return '<li class="' + (m.fait ? 'fait' : '') + '"><span>' + (m.fait ? '✓ ' : '') + texteMission(m) + '</span><i><b style="width:' + pc + '%"></b></i><small>' + fmt(Math.min(m.p, m.n)) + ' / ' + fmt(m.n) + '</small></li>';
      })
      .join('');
  }
  function ecranMissions() {
    majJour();
    $('mi-multi').textContent = '×' + (D.multi + 1);
    $('mi-liste').innerHTML = listeMissions();
    const mot = motDuJour();
    $('mi-mot').innerHTML = [...mot].map((c, i) => '<span class="' + (i < D.mot.n ? 'on' : '') + '">' + (i < D.mot.n ? c : '') + '</span>').join('');
    $('mi-mot-txt').textContent = D.mot.n >= mot.length ? 'Mot trouvé aujourd\'hui, bravo ! Un nouveau demain.' : 'Ramasse les lettres pendant tes courses libres : le mot complet rapporte 1 clé et 300 pièces.';
    ecran('missions');
  }

  // ----- niveaux -----
  function ecranNiveaux() {
    $('niv-total').textContent = D.niveaux.reduce((s, x) => s + (x || 0), 0) + ' / ' + NIVEAUX.length * 3;
    $('niv-liste').innerHTML = QUARTIERS.map(
      (q, qi) =>
        '<div class="niv-q"><h3>' + q.nom + '</h3><div>' +
        [0, 1, 2]
          .map(i => {
            const k = qi * 3 + i,
              ouvert = k == 0 || (D.niveaux[k - 1] || 0) > 0,
              e = D.niveaux[k] || 0;
            return '<button type="button" class="niv" data-n="' + k + '"' + (ouvert ? '' : ' disabled') + ' aria-label="Niveau ' + (k + 1) + (ouvert ? ', ' + e + ' étoile' + (e > 1 ? 's' : '') + ' sur 3' : ', verrouillé') + '"><b>' + (ouvert ? k + 1 : '🔒') + '</b><span>' + [0, 1, 2].map(j => (j < e ? '★' : '☆')).join('') + '</span><small>' + fmt(NIVEAUX[k].long) + ' m</small></button>';
          })
          .join('') +
        '</div></div>'
    ).join('');
    ecran('niveaux');
  }
  $('niv-liste').addEventListener('click', e => {
    const b = e.target.closest('[data-n]');
    if (b && !b.disabled) demarrer('niveau', +b.dataset.n);
  });

  function ecranDefi() {
    majJour();
    $('d-meilleur').textContent = fmt(D.defi.meilleur);
    $('d-cle').textContent = D.defi.cle ? 'Clé du jour déjà gagnée.' : 'Tiens 60 secondes pour gagner une clé.';
    ecran('defi');
  }

  // ----- boutique -----
  let onglet = 'bonus';
  function boutique(o) {
    if (o) onglet = o;
    $('s-pieces').textContent = fmt(D.pieces);
    for (const b of document.querySelectorAll('.onglets button')) b.setAttribute('aria-selected', b.dataset.o == onglet ? 'true' : 'false');
    const acheter = (cle, prix, txt, ok = true) => '<button type="button" class="acheter" data-a="' + cle + '"' + (!ok || D.pieces < prix ? ' disabled' : '') + '><span class="piece-ic" aria-hidden="true"></span>' + fmt(prix) + '<span class="sr-only"> pièces : ' + txt + '</span></button>';
    let h = '';
    if (onglet == 'bonus')
      h = Object.keys(BONUS)
        .map(k => {
          const n = D.niv[k],
            max = n >= 5,
            prix = DON.prixAmelio[n];
          return '<div class="amelio" style="--c:' + BONUS[k].c + '"><span class="bic" aria-hidden="true">' + { aimant: 'U', saut: '⇈', x2: '×2', jetpack: '▲', bulle: '◯' }[k] + '</span><div><b>' + BONUS[k].nom + '</b><small>Durée : ' + secondes(dureeBonus(k)) + (max ? ' (maximum)' : ' → ' + secondes(dureeBonus(k, n + 1))) + '</small><span class="niv-barre" aria-label="Niveau ' + n + ' sur 5">' + [0, 1, 2, 3, 4].map(i => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</span></div>' + (max ? '<span class="max">Max</span>' : acheter('niv:' + k, prix, BONUS[k].nom)) + '</div>';
        })
        .join('');
    else if (onglet == 'persos')
      h = PERSOS.map(p => {
        const a = D.persos.includes(p.id),
          choisi = D.perso == p.id;
        if (p.evenement && !a) return '<div class="amelio verrou"><canvas class="apercu" data-perso="' + p.id + '" width="96" height="120" aria-hidden="true"></canvas><div><b>' + p.nom + '</b><small>Récompense de l\'événement « ' + EVENEMENTS.find(e => e.id == p.evenement).nom + ' »</small></div><span class="max">🔒</span></div>';
        return '<div class="amelio"><canvas class="apercu" data-perso="' + p.id + '" width="96" height="120" aria-hidden="true"></canvas><div><b>' + p.nom + '</b><small>' + (choisi ? 'Ton personnage' : a ? 'Débloqué' : 'À débloquer') + '</small></div>' + (choisi ? '<span class="max">✓</span>' : a ? '<button type="button" class="choisir" data-a="perso:' + p.id + '">Choisir</button>' : acheter('perso:' + p.id, p.prix, p.nom)) + '</div>';
      }).join('');
    else if (onglet == 'planches')
      h = PLANCHES.map(p => {
        const a = D.planchesDeb.includes(p.id),
          choisi = D.planche == p.id;
        if (p.evenement && !a) return '<div class="amelio verrou"><span class="mini-planche" style="--c1:' + p.c1 + ';--c2:' + p.c2 + '" aria-hidden="true"></span><div><b>' + p.nom + '</b><small>Récompense de l\'événement « ' + EVENEMENTS.find(e => e.id == p.evenement).nom + ' »</small></div><span class="max">🔒</span></div>';
        return '<div class="amelio"><span class="mini-planche" style="--c1:' + p.c1 + ';--c2:' + p.c2 + '" aria-hidden="true"></span><div><b>' + p.nom + '</b><small>' + p.txt + (choisi ? ' · ta planche' : '') + '</small></div>' + (choisi ? '<span class="max">✓</span>' : a ? '<button type="button" class="choisir" data-a="planche:' + p.id + '">Choisir</button>' : acheter('planche:' + p.id, p.prix, p.nom)) + '</div>';
      }).join('');
    else
      h =
        '<div class="amelio"><span class="mini-planche" style="--c1:#ff6b6b;--c2:#fff" aria-hidden="true"></span><div><b>3 planches</b><small>Tu en as ' + D.planches + '. Elles encaissent un choc pendant 30 s.</small></div>' + acheter('planches', 300, '3 planches') + '</div>' +
        '<div class="amelio"><span class="bic" style="--c:#28c2a0" aria-hidden="true">»</span><div><b>3 élans de départ</b><small>Tu en as ' + D.elans + '. Au départ d\'une course libre : 6 s de vol à toute vitesse.</small></div>' + acheter('elans', 600, '3 élans de départ') + '</div>' +
        '<div class="amelio"><span class="mini-coffre" aria-hidden="true"></span><div><b>Coffres mystère</b><small>Tu en as ' + D.coffres + '. Pièces, planches, clés… ou un personnage !</small></div>' + (D.coffres ? '<button type="button" class="choisir" data-a="ouvrir">Ouvrir</button>' : '') + acheter('coffre', 400, '1 coffre mystère') + '</div>' +
        '<div class="amelio"><span class="bic" style="--c:#ffb703" aria-hidden="true">🔑</span><div><b>1 clé</b><small>Tu en as ' + D.cles + '. Pour continuer après un choc.</small></div>' + acheter('cle', 1500, '1 clé') + '</div>';
    $('amelio').innerHTML = h;
    for (const c of $('amelio').querySelectorAll('[data-perso]')) dessinFace(c, PERSOS.find(x => x.id == c.dataset.perso));
    ecran('boutique');
  }
  document.querySelector('.onglets').addEventListener('click', e => {
    const b = e.target.closest('[data-o]');
    if (b) {
      boutique(b.dataset.o);
      b.focus();
    }
  });
  $('amelio').addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (!b || b.disabled) return;
    const [a, id] = b.dataset.a.split(':');
    const payer = prix => {
      if (D.pieces < prix) return false;
      D.pieces -= prix;
      return true;
    };
    if (a == 'niv' && D.niv[id] < 5 && payer(DON.prixAmelio[D.niv[id]])) D.niv[id]++;
    else if (a == 'perso') {
      const p = PERSOS.find(x => x.id == id);
      if (D.persos.includes(id) || (!p.evenement && payer(p.prix))) {
        if (!D.persos.includes(id)) D.persos.push(id);
        D.perso = id;
      }
    } else if (a == 'planche') {
      const p = PLANCHES.find(x => x.id == id);
      if (D.planchesDeb.includes(id) || (!p.evenement && payer(p.prix))) {
        if (!D.planchesDeb.includes(id)) D.planchesDeb.push(id);
        D.planche = id;
      }
    } else if (a == 'planches' && payer(300)) D.planches += 3;
    else if (a == 'elans' && payer(600)) D.elans += 3;
    else if (a == 'coffre' && payer(400)) D.coffres++;
    else if (a == 'ouvrir') return ecranCoffre();
    else if (a == 'cle' && payer(1500)) D.cles++;
    ecrire();
    son('bonus');
    verifierTrophees();
    boutique();
    const nb = $('amelio').querySelector('[data-a="' + b.dataset.a + '"]');
    if (nb && !nb.disabled) nb.focus();
  });

  // ----- affichage pendant la course -----
  let hudCache = {},
    hudT = 0,
    msgMinuterie = 0;
  // mis à jour 10 fois par seconde : redessiner le texte du score à chaque image coûte cher
  function majHUD() {
    if (S.mode != 'jeu' && S.mode != 'fin' && S.mode != 'continuer') return;
    const maintenant = performance.now();
    if (maintenant - hudT < 100) return;
    hudT = maintenant;
    const actifs = Object.keys(S.bonus).filter(k => BONUS[k]);
    if (S.planche > 0) actifs.push('planche');
    if (S.turbo > 0) actifs.push('turbo');
    const v = { s: fmt(S.score), p: fmt(S.pieces), m: S.mult, x2: !!S.bonus.x2, b: actifs.join(), pl: D.planches + (S.planche > 0 ? 'a' : ''), t: Math.ceil(S.temps) };
    if (v.s != hudCache.s) $('h-score').textContent = v.s;
    if (v.p != hudCache.p) $('h-pieces').textContent = v.p;
    if (v.m != hudCache.m || v.x2 != hudCache.x2) {
      $('h-mult').textContent = '×' + v.m;
      $('h-mult').classList.toggle('x2', v.x2);
    }
    if (v.b != hudCache.b)
      $('h-bonus').innerHTML = actifs
        .map(k => {
          const nom = k == 'planche' ? 'Planche' : k == 'turbo' ? 'Turbo' : BONUS[k].nom,
            c = k == 'planche' ? (PLANCHES.find(x => x.id == D.planche) || PLANCHES[0]).c1 : k == 'turbo' ? '#28e6c8' : BONUS[k].c;
          return '<div class="pil" style="--c:' + c + '">' + nom + '<i data-b="' + k + '"></i></div>';
        })
        .join('');
    for (const i of $('h-bonus').querySelectorAll('i')) {
      const k = i.dataset.b,
        f = k == 'planche' ? S.planche / dureePlanche() : k == 'turbo' ? S.turbo / 2.4 : S.bonus[k] / dureeBonus(k);
      i.style.width = Math.max(0, Math.min(1, f)) * 100 + '%';
    }
    const elan = S.mode == 'jeu' && S.type == 'libre' && !S.elanUtilise && D.elans > 0 && S.dist < 150;
    if (elan != hudCache.elan) $('b-elan').hidden = !elan;
    v.elan = elan;
    if (elan) $('h-elans').textContent = D.elans;
    if (v.pl != hudCache.pl) {
      $('h-planches').textContent = D.planches;
      $('b-planche').disabled = D.planches < 1 || S.planche > 0;
    }
    if (S.type == 'niveau') $('h-prog-barre').style.width = Math.min(100, (100 * P.z) / S.long) + '%';
    if (S.type == 'defi' && v.t != hudCache.t) {
      $('h-temps').textContent = Math.max(0, v.t) + ' s';
      $('h-temps').classList.toggle('urgent', v.t <= 10);
    }
    hudCache = v;
  }

  function message(t, genre = '', duree = 1300) {
    const m = $('h-msg');
    m.textContent = t;
    m.className = '';
    void m.offsetWidth;
    m.className = 'on ' + genre;
    m.style.animationDuration = duree + 'ms';
    clearTimeout(msgMinuterie);
    msgMinuterie = setTimeout(() => {
      m.className = '';
      m.textContent = '';
    }, duree);
  }

  // annonces importantes (missions, trophées), affichées l'une après l'autre
  const annonces = [];
  function annonce(t) {
    annonces.push(t);
    if (annonces.length == 1) suivante();
  }
  function suivante() {
    if (!annonces.length) return;
    message(annonces[0], 'or', 2000);
    setTimeout(() => {
      annonces.shift();
      suivante();
    }, 2100);
  }

  function vibrer(ms) {
    if (!D.reglages.vib) return;
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }

  // ---------- Sons et musique (synthétisés, aucun fichier) ----------
  let AC = null,
    dernierePiece = 0,
    suitePieces = 0,
    bruit = null;
  function audio() {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state == 'suspended') AC.resume();
      if (!bruit) {
        bruit = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate);
        const d = bruit.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      return AC;
    } catch (e) {
      return null;
    }
  }
  function note(f, f2, d, type = 'sine', vol = 0.08, debut = 0, dest) {
    const t = AC.currentTime + debut,
      o = AC.createOscillator(),
      g = AC.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(dest || AC.destination);
    o.start(t);
    o.stop(t + d + 0.02);
  }
  function souffle(d, vol, filtre, debut = 0, dest) {
    const t = AC.currentTime + debut,
      s = AC.createBufferSource(),
      f = AC.createBiquadFilter(),
      g = AC.createGain();
    s.buffer = bruit;
    f.type = 'highpass';
    f.frequency.value = filtre;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f).connect(g).connect(dest || AC.destination);
    s.start(t);
    s.stop(t + d);
  }
  function son(k) {
    if (!D.son || !audio()) return;
    const t = AC.currentTime;
    if (k == 'piece') {
      if (t - dernierePiece < 0.05) return;
      suitePieces = t - dernierePiece < 0.4 ? Math.min(8, suitePieces + 1) : 0; // les pièces à la suite montent d'une note
      dernierePiece = t;
      const f = 988 * 2 ** (suitePieces / 12);
      note(f, 0, 0.07, 'sine', 0.06);
      note(f * 1.335, 0, 0.12, 'sine', 0.06, 0.06);
    } else if (k == 'saut') note(330, 660, 0.16, 'triangle', 0.1);
    else if (k == 'glisse') note(520, 200, 0.18, 'triangle', 0.08);
    else if (k == 'voie') souffle(0.06, 0.05, 3000);
    else if (k == 'bonus') [523, 659, 784, 1047].forEach((f, i) => note(f, 0, 0.12, 'triangle', 0.08, i * 0.06));
    else if (k == 'mission') [784, 988, 1175, 1568].forEach((f, i) => note(f, 0, 0.16, 'square', 0.05, i * 0.08));
    else if (k == 'lettre') [880, 1320].forEach((f, i) => note(f, 0, 0.15, 'triangle', 0.08, i * 0.08));
    else if (k == 'victoire') [523, 659, 784, 1047, 1319].forEach((f, i) => note(f, 0, 0.25, 'triangle', 0.09, i * 0.1));
    else if (k == 'alerte') [440, 330].forEach((f, i) => note(f, 0, 0.12, 'square', 0.05, i * 0.13));
    else if (k == 'bouclier') note(900, 300, 0.3, 'sawtooth', 0.06);
    else if (k == 'justesse') note(880, 1760, 0.12, 'sine', 0.06);
    else if (k == 'figure') [660, 880, 1320].forEach((f, i) => note(f, 0, 0.1, 'triangle', 0.07, i * 0.05));
    else if (k == 'coffre') {
      souffle(0.4, 0.08, 1500);
      [523, 784, 1047, 1568].forEach((f, i) => note(f, 0, 0.3, 'triangle', 0.08, 0.15 + i * 0.07));
    } else if (k == 'caisse' || k == 'casse') {
      souffle(0.18, 0.2, 800);
      note(160, 80, 0.15, 'square', 0.06);
    } else if (k == 'ecrase') {
      note(120, 40, 0.25, 'sine', 0.2);
      souffle(0.15, 0.12, 400);
    } else if (k == 'turbo') note(300, 1200, 0.35, 'sawtooth', 0.05);
    else if (k == 'planche') {
      note(200, 800, 0.25, 'sine', 0.08);
      souffle(0.3, 0.06, 2000);
    } else if (k == 'choc') {
      note(180, 50, 0.45, 'sawtooth', 0.12);
      note(90, 40, 0.5, 'square', 0.06);
    }
  }

  // musique : boucle de 4 mesures (grosse caisse, caisse claire, charleston, basse, accords) selon le quartier
  let musiqueMinuterie = 0,
    musiqueGain = null,
    prochain = 0,
    pasMusique = 0;
  const TEMPO = 112,
    freq = m => 440 * 2 ** ((m - 69) / 12);
  function musique(on) {
    if (!on || !D.musique) {
      clearInterval(musiqueMinuterie);
      musiqueMinuterie = 0;
      if (musiqueGain && AC) musiqueGain.gain.setTargetAtTime(0, AC.currentTime, 0.1);
      return;
    }
    if (musiqueMinuterie || !audio()) return;
    if (!musiqueGain) {
      musiqueGain = AC.createGain();
      musiqueGain.connect(AC.destination);
    }
    musiqueGain.gain.setTargetAtTime(0.55, AC.currentTime, 0.1);
    prochain = AC.currentTime + 0.05;
    musiqueMinuterie = setInterval(() => {
      while (prochain < AC.currentTime + 0.25) {
        jouerPas(pasMusique, prochain - AC.currentTime);
        prochain += 60 / TEMPO / 4;
        pasMusique = (pasMusique + 1) % 64;
      }
    }, 60);
  }
  function jouerPas(s, debut) {
    const g = musiqueGain,
      q = QUARTIERS[S.qVu || 0],
      racine = q.musique[Math.floor(s / 16)],
      b = s % 16;
    if (b % 4 == 0) note(140, 45, 0.18, 'sine', 0.35, debut, g);
    if (b == 4 || b == 12) souffle(0.12, 0.18, 1500, debut, g);
    if (b % 2 == 0) souffle(0.03, 0.05, 7000, debut, g);
    if ([0, 3, 6, 8, 10, 14].includes(b)) note(freq(racine + (b == 10 ? 7 : b == 14 ? 12 : 0)), 0, 0.16, 'triangle', 0.16, debut, g);
    if (b == 0 || b == 8)
      for (const i of [12, 16, 19]) note(freq(racine + i + (q.nuit > 0.5 ? -1 : 0) * (i == 16 ? 1 : 0)), 0, 0.5, 'sine', 0.025, debut, g);
    const m = q.melodie && q.melodie[b];
    if (m != null && Math.floor(s / 16) % 2 == 1) note(freq(racine + 12 + m), 0, 0.14, 'square', 0.022, debut, g); // la mélodie revient une mesure sur deux
  }

  function majSon() {
    $('b-son').textContent = 'Sons : ' + (D.son ? 'oui' : 'non');
    $('b-son').setAttribute('aria-pressed', D.son ? 'true' : 'false');
    $('b-musique').textContent = 'Musique : ' + (D.musique ? 'oui' : 'non');
    $('b-musique').setAttribute('aria-pressed', D.musique ? 'true' : 'false');
  }

  // ---------- Commandes ----------
  $('b-jouer').onclick = () => demarrer('libre');
  $('b-rejouer').onclick = rejouer;
  $('b-suivant').onclick = () => demarrer('niveau', S.niveau + 1);
  $('b-recommencer').onclick = rejouer;
  $('b-reprendre').onclick = reprendre;
  $('b-pause').onclick = pause;
  $('b-planche').onclick = utiliserPlanche;
  $('b-elan').onclick = utiliserElan;
  $('b-partager').onclick = partager;
  $('b-evenement').onclick = ecranEvenement;
  $('b-coffre-retour').onclick = () => boutique('objets');
  $('b-trophees').onclick = ecranTrophees;
  $('b-reglages').onclick = ecranReglages;
  $('b-cadeau').onclick = () => {
    recupererQuotidien();
    afficherMenu();
  };
  $('b-vib').onclick = () => {
    D.reglages.vib = D.reglages.vib ? 0 : 1;
    ecrire();
    majReglages();
    vibrer(40);
  };
  for (const b of document.querySelectorAll('[data-sens]'))
    b.onclick = () => {
      D.reglages.sens = +b.dataset.sens;
      ecrire();
      majReglages();
    };
  for (const b of document.querySelectorAll('[data-qualite]'))
    b.onclick = () => {
      D.reglages.qualite = b.dataset.qualite;
      ecrire();
      appliquerQualite();
      majReglages();
    };
  $('b-effacer').onclick = () => {
    if (!confirm('Effacer toute ta progression (record, pièces, personnages, trophées…) ? C\'est définitif.')) return;
    try {
      localStorage.removeItem(CLE);
    } catch (e) {}
    location.reload();
  };
  $('b-continuer').onclick = continuer;
  $('b-non').onclick = () => {
    finPartie('choc');
    ecran(null);
    S.fin = 0.5;
  };
  $('b-aide').onclick = () => ecran('aide');
  $('b-boutique').onclick = () => boutique();
  $('b-missions').onclick = ecranMissions;
  $('b-niveaux').onclick = ecranNiveaux;
  $('b-defi').onclick = ecranDefi;
  $('b-lancer-defi').onclick = () => demarrer('defi');
  $('b-son').onclick = () => {
    D.son = D.son ? 0 : 1;
    ecrire();
    majSon();
    son('voie');
  };
  $('b-musique').onclick = () => {
    D.musique = D.musique ? 0 : 1;
    ecrire();
    majSon();
  };
  for (const b of document.querySelectorAll('[data-retour]')) b.onclick = afficherMenu;
  for (const b of document.querySelectorAll('[data-menu]')) b.onclick = menu;

  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.length == 1 ? e.key.toLowerCase() : e.key;
    if (S.mode == 'jeu') {
      const a = {
        ArrowLeft: gauche,
        q: gauche,
        a: gauche,
        ArrowRight: droite,
        d: droite,
        ArrowUp: sauter,
        ' ': sauter,
        z: sauter,
        w: sauter,
        ArrowDown: glisser,
        s: glisser,
        b: utiliserPlanche,
        Shift: utiliserPlanche,
        e: utiliserElan,
        Escape: pause,
        p: pause
      }[k];
      if (a) {
        e.preventDefault();
        if (!e.repeat) a();
      }
    } else if (S.mode == 'pause' && (k == 'Escape' || k == 'p')) {
      e.preventDefault();
      reprendre();
    } else if (k == 'Escape' && ecranActuel == 'coffre') boutique('objets');
    else if (k == 'Escape' && SECONDAIRES.includes(ecranActuel) && ecranActuel != 'cadeau') afficherMenu();
  });

  // gestes tactiles (et souris) : un glissement = une action ; deux tapes rapides = la planche
  (() => {
    let o = null,
      derniereTape = 0;
    cv.addEventListener('pointerdown', e => {
      o = { x: e.clientX, y: e.clientY, fait: false };
      audio();
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (er) {}
    });
    cv.addEventListener('pointermove', e => {
      if (!o || o.fait) return;
      const dx = e.clientX - o.x,
        dy = e.clientY - o.y,
        seuil = Math.max(16, Math.min(W, H) * 0.04) / D.reglages.sens;
      if (Math.hypot(dx, dy) < seuil) return;
      o.fait = true;
      if (Math.abs(dx) > Math.abs(dy)) (dx < 0 ? gauche : droite)();
      else (dy < 0 ? sauter : glisser)();
    });
    cv.addEventListener('pointerup', () => {
      if (o && !o.fait) {
        const t = performance.now();
        if (t - derniereTape < 320) {
          utiliserPlanche();
          derniereTape = 0;
        } else derniereTape = t;
      }
      o = null;
    });
    cv.addEventListener('pointercancel', () => (o = null));
  })();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });
  addEventListener('blur', pause);

  // ---------- Boucle d'affichage, avec baisse de la résolution si l'appareil peine ----------
  let derniere = 0,
    lent = 0;
  function boucle(t) {
    requestAnimationFrame(boucle);
    const dt = derniere ? Math.min(0.05, (t - derniere) / 1000) : 1 / 60;
    derniere = t;
    if (S.mode != 'pause') maj(dt);
    dessiner();
    majHUD();
    lent = dt > 0.024 ? lent + 1 : Math.max(0, lent - 1);
    if (lent > 45 && D.reglages.qualite == 'auto') {
      // d'abord la résolution, puis le niveau de détail, et en dernier recours une image un peu plus floue
      if (maxDPR > 1) {
        maxDPR = Math.max(1, Math.min(maxDPR, DPR) - 0.5);
        taille();
      } else if (DETAIL > 0) DETAIL--;
      else if (maxDPR > 0.75) {
        maxDPR = 0.75;
        taille();
      }
      lent = 0;
    }
  }

  // hors ligne : le service worker du site met aussi le jeu en cache
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol))
    addEventListener('load', () => navigator.serviceWorker.register('../../sw.js').catch(() => {}));

  // pour les tests : état du jeu, génération du parcours, et avance image par image (60 images par seconde)
  window.VL = {
    S, P, D, troncon, alea, vitesse, demarrer, menu, continuer, ouvrirCoffre, evenementActif,
    ev: () => EV, gauche, droite, sauter, glisser, utiliserPlanche, utiliserElan, activerBonus, verifierTrophees,
    tunnels: () => tunnels,
    objs: () => objs,
    pieces: () => pieces,
    bonus: () => bonus,
    detail: n => (n == null ? DETAIL : (DETAIL = n)),
    avancer: s => {
      for (let i = 0; i < Math.round(s * 60); i++) maj(1 / 60);
    }
  };

  appliquerQualite();
  majSon();
  menu();
  requestAnimationFrame(boucle);
})();
