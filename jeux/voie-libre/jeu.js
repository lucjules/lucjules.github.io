/* Voie libre : course sans fin sur trois voies (changer de voie, sauter, glisser, monter sur les wagons).
   Rendu en fausse 3D sur un canvas 2D, sans bibliothèque. Sauvegarde dans localStorage, clé « voie-libre »
   (record, pièces, améliorations), lue aussi par la page des jeux pour afficher le record.
   Pour les tests : ?graine=123 rend le parcours reproductible, et window.VL donne accès à l'état du jeu. */
(() => {
  'use strict';

  // ---------- Réglages ----------
  const VOIE = 2.2; // distance entre les centres de deux voies
  const DEMI = 1; // demi-largeur d'un obstacle
  const LARG = 0.35; // demi-largeur du coureur
  const H_TRAIN = 2.3;
  const RAMPE = 6; // longueur de la rampe qui monte sur un wagon
  const H_DEBOUT = 1.5;
  const H_GLISSE = 0.7;
  const GRAVITE = 40;
  const SAUT = 10.4; // hauteur atteinte ≈ 1,35
  const SUPER_SAUT = 16.7; // ≈ 3,5 : assez pour monter sur les wagons
  const DUREE_GLISSE = 0.62;
  const VUE = 170; // distance d'affichage
  const BRUME = 45; // début du brouillard
  const COUT = [150, 400, 900, 1800]; // prix des niveaux 1 à 4 des améliorations
  const BONUS = {
    aimant: { nom: 'Aimant', c: '#ef476f' },
    saut: { nom: 'Super saut', c: '#06d6a0' },
    x2: { nom: 'Score ×2', c: '#ffb703' },
    bouclier: { nom: 'Bouclier', c: '#4cc9f0' }
  };
  const vitesse = dist => 15 + 17 * (1 - Math.exp(-dist / 1800));
  const difficulte = dist => 1 - Math.exp(-dist / 2200);
  const lx = l => (l - 1) * VOIE; // abscisse du centre d'une voie (0, 1, 2)

  // Couleurs
  const CIEL_HAUT = [150, 200, 255];
  const BROUILLARD = [236, 244, 255];
  const SOL = [226, 232, 241];
  const BALLAST = [200, 208, 221];
  const TRAVERSE = [196, 188, 180];
  const RAIL = [132, 145, 165];
  const MUR = [244, 246, 250];
  const TRAINS = [
    [255, 107, 107],
    [46, 196, 182],
    [91, 108, 255],
    [255, 183, 3],
    [155, 93, 229]
  ];
  const PASTELS = [
    [255, 214, 165],
    [202, 240, 191],
    [189, 224, 254],
    [255, 205, 240],
    [255, 245, 186],
    [216, 204, 255],
    [178, 236, 229]
  ];

  // ---------- Sauvegarde ----------
  const CLE = 'voie-libre';
  const D = { record: 0, pieces: 0, parties: 0, distance: 0, niv: { aimant: 0, saut: 0, x2: 0 }, son: 1 };
  (() => {
    let d = null;
    try {
      d = JSON.parse(localStorage.getItem(CLE));
    } catch (e) {}
    if (!d || typeof d != 'object') return;
    const n = v => (Number.isFinite(+v) && +v > 0 ? Math.floor(+v) : 0);
    for (const k of ['record', 'pieces', 'parties', 'distance']) D[k] = n(d[k]);
    if (d.niv && typeof d.niv == 'object') for (const k in D.niv) D.niv[k] = Math.min(4, n(d.niv[k]));
    D.son = d.son === 0 ? 0 : 1;
  })();
  function ecrire() {
    try {
      localStorage.setItem(CLE, JSON.stringify(D));
    } catch (e) {}
  }
  const dureeBonus = (k, niv = D.niv[k]) => (k == 'bouclier' ? 30 : 8 + 2.5 * niv);
  const secondes = d => d.toLocaleString('fr-FR') + ' s';

  // ---------- Hasard reproductible ----------
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

  // ---------- Génération du parcours ----------
  // Le parcours est une suite de tronçons. Chacun est toujours franchissable : les barrières se sautent
  // ou se passent en glissant, les wagons d'un tronçon partent ensemble et laissent au moins une voie
  // libre ou une rampe, et le tronçon suivant ne commence qu'une fois tous les wagons passés.
  const piece = (l, y, z) => ({ x: lx(l), y, z, a: z * 0.7 });

  // une rangée de barrières dans les voies données, avec une ligne de pièces dans l'une d'elles
  function rangee(r, zz, voies, o, p) {
    const t = voies.map(() => (r() < 0.45 ? null : r() < 0.55 ? 'bas' : 'haut'));
    if (t.every(x => !x)) t[Math.floor(r() * t.length)] = r() < 0.55 ? 'bas' : 'haut';
    voies.forEach((l, i) => t[i] && o.push({ t: t[i], l, z0: zz, z1: zz + 0.5 }));
    if (r() < 0.75) {
      const i = Math.floor(r() * voies.length);
      for (let j = -3; j <= 3; j++) {
        // en arc au-dessus d'une barrière basse (on les prend en sautant), au ras du sol ailleurs
        const y = t[i] == 'bas' ? 0.6 + 1.0 * (1 - (j / 3.6) ** 2) : 0.5;
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
    if (n == 3 && !ts.some(t => t.ramp)) ts[Math.floor(r() * 3)].ramp = true;
    let fin = z;
    for (const t of ts) {
      t.z1 = t.z0 + t.L + (t.ramp ? RAMPE : 0);
      delete t.L;
      o.push(t);
      fin = Math.max(fin, t.z1);
    }
    // pièces sur la rampe et le toit des wagons accessibles (à rampe, ou voisins d'un wagon à rampe)
    for (const t of ts) {
      const acces = t.ramp || ts.some(u => u.ramp && Math.abs(u.l - t.l) == 1);
      if (!acces || r() < 0.3) continue;
      for (let zc = t.z0 + 1.5; zc < t.z1 - 1; zc += 2.5) {
        const y = t.ramp && zc < t.z0 + RAMPE ? (H_TRAIN * (zc - t.z0)) / RAMPE + 0.5 : H_TRAIN + 0.5;
        p.push(piece(t.l, y, zc));
      }
    }
    if (libres.length) for (let zz = z + pas * 0.6; zz < fin - 4; zz += pas) rangee(r, zz, libres, o, p);
    return { fin, libres };
  }

  // un wagon qui arrive en sens inverse : rien d'autre dans sa voie pendant tout le tronçon
  function approche(r, z, d, pas, o, p) {
    const l = Math.floor(r() * 3),
      L = 12 + Math.floor(r() * 3) * 4;
    const t = { t: 'train', l, z0: z + 60, z1: z + 60 + L, ramp: false, c: Math.floor(r() * TRAINS.length), vit: 9 + 6 * d };
    o.push(t);
    const libres = [0, 1, 2].filter(x => x != l);
    for (let zz = z + pas * 0.6; zz < t.z1; zz += pas) rangee(r, zz, libres, o, p);
    return { fin: t.z1, libres };
  }

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
    if (k < 0.34 || d < 0.05) {
      const n = 3 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) rangee(r, z + i * pas, [0, 1, 2], o, p);
      res = { fin: z + (n - 1) * pas + 1, libres: [0, 1, 2] };
    } else if (k < 0.84 || d < 0.2) res = trains(r, z, d, pas, o, p);
    else res = approche(r, z, d, pas, o, p);
    if (res.libres.length && r() < 0.3) {
      const types = ['aimant', 'saut', 'x2', 'bouclier'];
      b.push({ k: types[Math.floor(r() * types.length)], x: lx(res.libres[Math.floor(r() * res.libres.length)]), y: 1, z: z + pas * 0.5 });
    }
    return { o, p, b, fin: res.fin + 16 + v * 0.5 };
  }

  // ---------- État ----------
  const S = { mode: 'menu', demo: true, t: 0, dist: 0, v: 0, score: 0, pieces: 0, mult: 1, alerte: 0, invu: 0, fin: 0, finVue: false, bonus: {}, graine: 0, secousse: 0 };
  const P = { voie: 1, voieAvant: 1, x: 0, y: 0, z: 0, vy: 0, gy: 0, sol: true, glisse: 0, tampon: 0, coyote: 0, course: 0, chute: 0 };
  const cam = { x: 0, y: 3.4, z: -6, base: 0, sp: Math.sin(0.2), cp: Math.cos(0.2) };
  let objs = [],
    pieces = [],
    bonus = [],
    decor = [],
    parts = [];
  let r = Math.random,
    rDecor = Math.random,
    genZ = 0,
    decZ = [0, 0],
    nettoyage = 0;

  function nouveauMonde(demo) {
    Object.assign(S, { demo, t: 0, dist: 0, score: 0, pieces: 0, alerte: 0, invu: 0, fin: 0, finVue: false, bonus: {}, secousse: 0 });
    Object.assign(P, { voie: 1, voieAvant: 1, x: 0, y: 0, z: 0, vy: 0, gy: 0, sol: true, glisse: 0, tampon: 0, coyote: 0, chute: 0 });
    Object.assign(cam, { x: 0, y: 3.4, z: -6, base: 0 });
    objs = [];
    pieces = [];
    bonus = [];
    decor = [];
    parts = [];
    S.graine = graineURL != null ? graineURL : (Math.random() * 2 ** 32) >>> 0;
    r = alea(S.graine);
    rDecor = alea(S.graine ^ 0x9e3779b9);
    genZ = 45;
    decZ = [-12, -12];
    generer();
  }

  function generer() {
    while (!S.demo && genZ < P.z + VUE + 30) {
      const t = troncon(r, genZ, genZ);
      objs.push(...t.o);
      pieces.push(...t.p);
      bonus.push(...t.b);
      genZ = t.fin;
    }
    // immeubles des deux côtés
    for (const c of [0, 1])
      while (decZ[c] < P.z + VUE + 30) {
        const s = c ? 1 : -1,
          a = 6.4 + rDecor() * 1.6,
          e = a + 4 + rDecor() * 5,
          z0 = decZ[c],
          z1 = z0 + 7 + rDecor() * 14;
        decor.push({ x0: s > 0 ? a : -e, x1: s > 0 ? e : -a, h: 3.5 + rDecor() * 8, z0, z1, c: PASTELS[Math.floor(rDecor() * PASTELS.length)] });
        decZ[c] = z1 + 1 + rDecor() * 5;
      }
  }

  function nettoyer() {
    const z = cam.z - 3;
    objs = objs.filter(o => o.z1 > z && !o.efface);
    pieces = pieces.filter(c => !c.pris && c.z > z);
    bonus = bonus.filter(b => !b.pris && b.z > z);
    decor = decor.filter(b => b.z1 > z);
  }

  // ---------- Physique ----------
  // hauteur du sol sous le coureur : 0, une rampe ou le toit d'un wagon (seulement si on arrive d'en haut)
  function sol(x, z, y0) {
    let g = 0;
    for (const o of objs) {
      if (o.t != 'train' || o.casse || z < o.z0 || z > o.z1 || Math.abs(x - lx(o.l)) > DEMI) continue;
      const rampe = o.ramp && z < o.z0 + RAMPE,
        h = rampe ? (H_TRAIN * (z - o.z0)) / RAMPE : H_TRAIN;
      if (y0 >= h - (rampe ? 0.7 : 0.45)) g = Math.max(g, h);
    }
    return g;
  }

  function pas(h) {
    const x0 = P.x,
      y0 = P.y;
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
    P.vy -= GRAVITE * h;
    P.y += P.vy * h;
    const g = sol(P.x, P.z, y0);
    P.gy = g;
    if (P.y <= g) {
      if (!P.sol && P.vy < -8) poussiere();
      P.y = g;
      P.vy = 0;
      P.sol = true;
      P.coyote = 0.1;
    } else if (P.y > g + 0.05) P.sol = false;
    if (P.sol && P.tampon > 0) sauter();
    if (!S.demo) {
      collisions(x0);
      if (S.mode == 'jeu') ramasser(h);
    }
  }

  function collisions(x0) {
    const hp = P.glisse > 0 ? H_GLISSE : H_DEBOUT;
    for (const o of objs) {
      if (o.casse || P.z + 0.3 < o.z0 || P.z - 0.3 > o.z1) continue;
      const c = lx(o.l);
      if (Math.abs(P.x - c) >= DEMI + LARG) continue;
      let bas = 0,
        haut = H_TRAIN;
      if (o.t == 'bas') haut = 0.65;
      else if (o.t == 'haut') {
        bas = 1.0;
        haut = 1.75;
      } else if (o.ramp && P.z < o.z0 + RAMPE) haut = (H_TRAIN * Math.max(0, P.z - o.z0)) / RAMPE;
      if (P.y >= haut - 0.05 || P.y + hp <= bas) continue;
      // de côté si, juste avant, le coureur n'était pas dans la largeur de l'obstacle
      if (Math.abs(x0 - c) >= DEMI + LARG - 1e-6) trebucher(x0);
      else choc(o);
      return;
    }
  }

  function trebucher(x0) {
    P.voie = P.voieAvant;
    P.x = x0;
    if (S.invu > 0) return;
    vibrer(60);
    S.secousse = 0.25;
    if (S.alerte > 0) {
      if (S.bonus.bouclier) {
        delete S.bonus.bouclier;
        S.invu = 1;
        S.alerte = 0;
        son('bouclier');
        message('Bouclier perdu');
        return;
      }
      return finPartie();
    }
    S.alerte = 3.5;
    son('alerte');
    message('Attention !', true);
  }

  function choc(o) {
    if (S.invu > 0) return;
    if (S.bonus.bouclier) {
      delete S.bonus.bouclier;
      o.casse = true;
      S.invu = 1;
      S.secousse = 0.4;
      son('bouclier');
      eclats(o);
      message('Bouclier perdu');
      return;
    }
    finPartie();
  }

  function ramasser(h) {
    const hp = P.glisse > 0 ? H_GLISSE : H_DEBOUT,
      aimant = !!S.bonus.aimant,
      k = Math.min(1, 16 * h);
    for (const c of pieces) {
      if (c.pris) continue;
      const dz = c.z - P.z;
      if (dz < -2 || dz > 30) continue;
      if (aimant && dz < 18) c.vol = true;
      if (c.vol) {
        c.x += (P.x - c.x) * k;
        c.y += (P.y + 0.8 - c.y) * k;
        c.z += (P.z - c.z) * k;
        if (Math.hypot(c.x - P.x, c.y - P.y - 0.8, c.z - P.z) < 0.8) prendre(c);
      } else if (Math.abs(c.x - P.x) < 0.9 && Math.abs(dz) < 0.9 && c.y > P.y - 0.4 && c.y < P.y + hp + 0.4) prendre(c);
    }
    for (const b of bonus)
      if (!b.pris && Math.abs(b.x - P.x) < 1.1 && Math.abs(b.z - P.z) < 1.1 && b.y > P.y - 0.6 && b.y < P.y + hp + 0.6) {
        b.pris = true;
        S.bonus[b.k] = dureeBonus(b.k);
        son('bonus');
        message(BONUS[b.k].nom + ' !');
      }
  }

  function prendre(c) {
    c.pris = true;
    S.pieces++;
    S.score += 5 * S.mult;
    son('piece');
    if (parts.length < 120)
      for (let i = 0; i < 4; i++)
        parts.push({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 2, vz: S.v * 0.9, v: 0.35, c: [255, 210, 60], r: 0.07 });
  }

  function poussiere() {
    for (let i = 0; i < 6; i++)
      parts.push({ x: P.x + (Math.random() - 0.5) * 0.6, y: P.y + 0.05, z: P.z, vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random(), vz: S.v * 0.6, v: 0.4, c: [210, 215, 228], r: 0.1 });
  }

  function eclats(o) {
    const c = TRAINS[o.c] || [255, 107, 107];
    for (let i = 0; i < 18; i++)
      parts.push({ x: lx(o.l) + (Math.random() - 0.5) * 2, y: Math.random() * (o.t == 'train' ? 2.3 : 1.5), z: Math.max(o.z0, P.z + 0.5), vx: (Math.random() - 0.5) * 8, vy: 3 + Math.random() * 5, vz: S.v + Math.random() * 6, v: 0.7, c: o.t == 'train' ? c : [255, 255, 255], r: 0.16 });
  }

  // ---------- Actions ----------
  function gauche() {
    if (S.mode != 'jeu' || P.voie == 0) return;
    P.voieAvant = P.voie;
    P.voie--;
    son('voie');
  }
  function droite() {
    if (S.mode != 'jeu' || P.voie == 2) return;
    P.voieAvant = P.voie;
    P.voie++;
    son('voie');
  }
  function sauter() {
    if (S.mode != 'jeu') return;
    if (P.sol || P.coyote > 0) {
      P.vy = S.bonus.saut ? SUPER_SAUT : SAUT;
      P.sol = false;
      P.coyote = 0;
      P.glisse = 0;
      P.tampon = 0;
      son('saut');
    } else P.tampon = 0.15; // appui un peu trop tôt : on saute dès l'atterrissage
  }
  function glisser() {
    if (S.mode != 'jeu') return;
    P.glisse = DUREE_GLISSE;
    P.tampon = 0;
    if (!P.sol) P.vy = Math.min(P.vy, -24); // en l'air : redescente immédiate
    son('glisse');
  }

  function finPartie() {
    if (S.mode != 'jeu') return;
    S.mode = 'fin';
    S.fin = 0;
    S.secousse = 0.6;
    son('choc');
    vibrer(220);
    const score = Math.floor(S.score);
    S.nouveau = score > D.record && score > 0;
    D.parties++;
    D.pieces += S.pieces;
    D.distance = Math.max(D.distance, Math.floor(S.dist));
    if (S.nouveau) D.record = score;
    ecrire();
  }

  // ---------- Boucle ----------
  function maj(dt) {
    S.t += dt;
    if (S.mode == 'fin') {
      S.fin += dt;
      P.chute = Math.min(1, P.chute + dt * 3);
      P.vy -= GRAVITE * dt;
      P.y = Math.max(P.gy, P.y + P.vy * dt);
      if (S.fin > 0.9 && !S.finVue) {
        S.finVue = true;
        afficherFin();
      }
    } else {
      S.v = S.demo ? 9 : vitesse(S.dist);
      for (const k in S.bonus) if ((S.bonus[k] -= dt) <= 0) delete S.bonus[k];
      S.mult = S.bonus.x2 ? 2 : 1;
      S.alerte = Math.max(0, S.alerte - dt);
      S.invu = Math.max(0, S.invu - dt);
      P.glisse = Math.max(0, P.glisse - dt);
      P.tampon = Math.max(0, P.tampon - dt);
      P.coyote = Math.max(0, P.coyote - dt);
      const n = Math.max(1, Math.ceil((S.v * dt) / 0.3));
      for (let i = 0; i < n && S.mode != 'fin'; i++) pas(dt / n);
    }
    // caméra : suit le coureur, et la hauteur des toits seulement quand il s'y pose
    if (P.sol || P.y < cam.base) cam.base = P.y;
    cam.x += (P.x * 0.75 - cam.x) * (1 - Math.exp(-dt * 7));
    cam.y += (cam.base + 3.4 - cam.y) * (1 - Math.exp(-dt * 4));
    cam.z = P.z - 6;
    S.secousse = Math.max(0, S.secousse - dt);
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

  // ---------- Rendu ----------
  const cv = document.getElementById('scene'),
    ctx = cv.getContext('2d');
  let W = 0,
    H = 0,
    F = 0,
    CX = 0,
    CY = 0,
    HORIZON = 0,
    DPR = 1,
    maxDPR = 2,
    degCiel = null,
    degSol = null;
  const nuages = Array.from({ length: 7 }, (_, i) => ({ a: i * 0.9 + Math.random() * 0.5, h: 0.25 + Math.random() * 0.5, s: 0.6 + Math.random() * 0.7 }));

  function taille() {
    W = innerWidth;
    H = innerHeight;
    DPR = Math.min(maxDPR, window.devicePixelRatio || 1);
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    F = Math.min(W, H * 0.72);
    CX = W / 2;
    CY = H * 0.47;
    HORIZON = CY - F * Math.tan(0.2);
    degCiel = ctx.createLinearGradient(0, 0, 0, HORIZON);
    degCiel.addColorStop(0, rgb(CIEL_HAUT));
    degCiel.addColorStop(1, rgb(BROUILLARD));
    degSol = ctx.createLinearGradient(0, HORIZON, 0, H);
    degSol.addColorStop(0, rgb(BROUILLARD));
    degSol.addColorStop(0.35, rgb(SOL));
    degSol.addColorStop(1, rgb(SOL));
  }
  addEventListener('resize', taille);

  const rgb = c => 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
  const brume = d => Math.min(1, Math.max(0, (d - BRUME) / (VUE - BRUME)));
  // couleur c éclaircie ou assombrie par s, puis noyée dans le brouillard selon t (0 à 1)
  function teinte(c, t, s = 1) {
    let o = '';
    for (let i = 0; i < 3; i++) {
      const v = Math.min(255, c[i] * s);
      o += (i ? ',' : '') + ((v + (BROUILLARD[i] - v) * t) | 0);
    }
    return 'rgb(' + o + ')';
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
    if (avant && !coupe) poly([A, B, C, E], teinte(c, t, 0.95));
    if (deco) deco(t, z0, coupe);
  }

  // bande sur les côtés visibles d'un volume (fenêtres des wagons et des immeubles)
  function bandeCotes(x0, x1, y0, y1, z0, z1, c, t) {
    if (cam.x < x0) poly([proj(x0, y0, z0), proj(x0, y0, z1), proj(x0, y1, z1), proj(x0, y1, z0)], teinte(c, t));
    if (cam.x > x1) poly([proj(x1, y0, z0), proj(x1, y0, z1), proj(x1, y1, z1), proj(x1, y1, z0)], teinte(c, t));
  }

  function dessinerDecor() {
    // ciel, soleil, nuages
    ctx.fillStyle = degCiel;
    ctx.fillRect(0, 0, W, HORIZON + 1);
    ctx.fillStyle = 'rgba(255,250,225,.9)';
    ctx.beginPath();
    ctx.arc(W * 0.78 - cam.x * 3, HORIZON - H * 0.18, Math.min(W, H) * 0.06, 0, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (const n of nuages) {
      const x = ((((n.a * W * 0.37 - S.t * 6 * n.s - cam.x * 4) % (W * 1.4)) + W * 1.4) % (W * 1.4)) - W * 0.2,
        y = HORIZON * n.h,
        s = Math.min(W, H) * 0.05 * n.s;
      ctx.beginPath();
      ctx.ellipse(x, y, s * 2.2, s * 0.8, 0, 0, 7);
      ctx.ellipse(x + s, y - s * 0.4, s * 1.3, s * 0.9, 0, 0, 7);
      ctx.ellipse(x - s * 1.1, y - s * 0.2, s, s * 0.7, 0, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = degSol;
    ctx.fillRect(0, HORIZON, W, H - HORIZON);
    // immeubles, du plus loin au plus proche
    const vis = decor.filter(b => b.z0 < cam.z + VUE && b.z1 > cam.z + PRES).sort((a, b) => b.z0 - a.z0);
    for (const b of vis)
      pave(b.x0, b.x1, 0, b.h, b.z0, b.z1, b.c, true, (t, z0, coupe) => {
        if (z0 - cam.z > 80) return;
        const f = [92, 112, 150];
        for (let y = 1.6; y < b.h - 0.8; y += 2.2) {
          bandeCotes(b.x0, b.x1, y, y + 0.8, z0 + 0.6, b.z1 - 0.6, mixer(b.c, f, 0.45), t);
          if (!coupe) poly([proj(b.x0 + 0.6, y, z0), proj(b.x1 - 0.6, y, z0), proj(b.x1 - 0.6, y + 0.8, z0), proj(b.x0 + 0.6, y + 0.8, z0)], teinte(mixer(b.c, f, 0.4), t));
        }
      });
    // voies, par tranches pour le brouillard
    const z0 = cam.z + PRES,
      zf = cam.z + VUE;
    for (let z = z0; z < zf; z += 15) {
      const z2 = Math.min(zf, z + 15),
        t = brume(z - cam.z);
      for (const s of [-1, 1]) pave(s < 0 ? -4.1 : 3.7, s < 0 ? -3.7 : 4.1, 0, 0.7, z, z2, MUR, false);
      for (let l = 0; l < 3; l++) {
        const x = lx(l);
        poly([proj(x - 1.05, 0, z), proj(x + 1.05, 0, z), proj(x + 1.05, 0, z2), proj(x - 1.05, 0, z2)], teinte(BALLAST, t));
      }
    }
    const pasT = 1.6;
    for (let z = Math.ceil(z0 / pasT) * pasT; z < cam.z + 75; z += pasT) {
      const t = brume(z - cam.z),
        c = teinte(TRAVERSE, t);
      for (let l = 0; l < 3; l++) {
        const x = lx(l);
        poly([proj(x - 0.9, 0.03, z), proj(x + 0.9, 0.03, z), proj(x + 0.9, 0.03, z + 0.42), proj(x - 0.9, 0.03, z + 0.42)], c);
      }
    }
    for (let z = z0; z < zf; z += 15) {
      const z2 = Math.min(zf, z + 15),
        c = teinte(RAIL, brume(z - cam.z));
      for (let l = 0; l < 3; l++)
        for (const s of [-0.55, 0.55]) {
          const x = lx(l) + s;
          poly([proj(x - 0.06, 0.12, z), proj(x + 0.06, 0.12, z), proj(x + 0.06, 0.12, z2), proj(x - 0.06, 0.12, z2)], c);
        }
    }
  }

  const mixer = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  // éléments du parcours triés de l'arrière vers l'avant ; les wagons sont découpés en morceaux
  // pour que l'ordre de dessin reste juste à côté des autres obstacles
  function dessinerParcours() {
    const L = [],
      n = cam.z + PRES,
      f = cam.z + VUE;
    // un morceau de wagon ou une rampe sous les pieds du coureur se dessine avant lui, pas par-dessus
    const dessous = (o, a, b, haut) => Math.abs(P.x - lx(o.l)) < DEMI + LARG && a <= P.z + 0.3 && b >= P.z - 0.3 && P.y >= haut - 0.1;
    const cle = (o, a, b, haut) => (dessous(o, a, b, haut) ? P.z : Math.max(a, n));
    for (const o of objs) {
      if (o.casse || o.z1 <= n || o.z0 >= f) continue;
      if (o.t != 'train') {
        L.push({ k: o.z0, l: Math.abs(lx(o.l) - cam.x), f: () => barriere(o) });
        continue;
      }
      let z = o.z0;
      if (o.ramp) {
        const hr = (H_TRAIN * Math.min(RAMPE, Math.max(0, P.z - o.z0))) / RAMPE;
        L.push({ k: cle(o, z, z + RAMPE, hr), l: Math.abs(lx(o.l) - cam.x), f: () => rampe(o) });
        z += RAMPE;
      }
      for (let i = 0; z < o.z1; i++, z += 5) {
        const a = z,
          b = Math.min(o.z1, z + 5),
          premier = i == 0;
        if (b <= n || a >= f) continue;
        L.push({ k: cle(o, a, b, H_TRAIN), l: Math.abs(lx(o.l) - cam.x), f: () => wagon(o, a, b, premier) });
      }
    }
    for (const c of pieces) if (!c.pris && c.z > n && c.z < f) L.push({ k: c.z, l: 0, f: () => dessinPiece(c) });
    for (const b of bonus) if (!b.pris && b.z > n && b.z < f) L.push({ k: b.z, l: 0, f: () => dessinBonus(b) });
    L.push({ k: P.z - 0.3, l: 0, f: dessinCoureur });
    L.sort((a, b) => b.k - a.k || b.l - a.l);
    for (const e of L) e.f();
    for (const q of parts) {
      const p = proj(q.x, q.y, q.z);
      if (p.d < PRES) continue;
      ctx.globalAlpha = Math.min(1, q.v * 3);
      ctx.fillStyle = rgb(q.c);
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
      bandeCotes(x0, x1, 0, 0.35, z0, b, [60, 66, 84], t);
      bandeCotes(x0, x1, 1.25, 1.85, z0 + 0.5, b - 0.5, [44, 54, 78], t);
      if (cam.y > H_TRAIN) poly([proj(x - 0.45, H_TRAIN, z0), proj(x + 0.45, H_TRAIN, z0), proj(x + 0.45, H_TRAIN, b), proj(x - 0.45, H_TRAIN, b)], teinte(c, t, 1.22));
      if (premier && !coupe) {
        poly([proj(x - 0.72, 1.2, z0), proj(x + 0.72, 1.2, z0), proj(x + 0.62, 1.95, z0), proj(x - 0.62, 1.95, z0)], teinte([40, 52, 80], t));
        poly([proj(x0, 0, z0), proj(x1, 0, z0), proj(x1, 0.35, z0), proj(x0, 0.35, z0)], teinte([60, 66, 84], t));
        for (const s of [-0.62, 0.62]) {
          const p = proj(x + s, 0.7, z0),
            rr = (0.14 * F) / p.d;
          if (o.vit) {
            ctx.fillStyle = 'rgba(255,240,170,.35)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, rr * 2.6, 0, 7);
            ctx.fill();
          }
          ctx.fillStyle = o.vit ? '#fff6c8' : teinte([255, 236, 190], t);
          ctx.beginPath();
          ctx.arc(p.x, p.y, rr, 0, 7);
          ctx.fill();
        }
      }
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
    // marches
    for (let i = 1; i < 6; i++) {
      const z = o.z0 + i,
        y = (H_TRAIN * i) / RAMPE;
      if (z <= a) continue;
      const p = proj(x0 + 0.1, y, z),
        q = proj(x1 - 0.1, y, z);
      ctx.strokeStyle = teinte([120, 132, 156], t);
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
        poly([proj(a, y0, zz), proj(b, y0, zz), proj(b, y1, zz), proj(a, y1, zz)], teinte(c1, t));
      }
    });
  }

  function dessinPiece(c) {
    const p = proj(c.x, c.y, c.z);
    if (p.d < PRES) return;
    const rr = (0.32 * F) / p.d;
    if (rr < 0.7) return;
    const w = Math.max(rr * 0.18, Math.abs(Math.cos(S.t * 4 + c.a)) * rr),
      t = brume(p.d);
    ctx.fillStyle = teinte([230, 154, 0], t);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, w, rr, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = teinte([255, 207, 64], t);
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
    ctx.fillStyle = BONUS[b.k].c;
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
    } else if (k == 'x2') {
      ctx.font = '700 0.9px "Bricolage Grotesque", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('×2', 0, 0.05);
    } else {
      ctx.moveTo(0, -0.5);
      ctx.lineTo(0.42, -0.3);
      ctx.quadraticCurveTo(0.4, 0.3, 0, 0.55);
      ctx.quadraticCurveTo(-0.4, 0.3, -0.42, -0.3);
      ctx.closePath();
      ctx.fill();
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

  // le coureur, vu de dos : sweat violet, sac à dos, casquette
  function dessinCoureur() {
    const p = proj(P.x, P.y, P.z);
    if (p.d < PRES) return;
    const s = F / p.d,
      o = proj(P.x, P.gy, P.z),
      ht = P.y - P.gy;
    ctx.fillStyle = 'rgba(30,40,70,' + 0.22 * Math.max(0.3, 1 - ht / 3) + ')';
    ctx.beginPath();
    ctx.ellipse(o.x, o.y, 0.5 * s * (1 - Math.min(0.4, ht / 6)), 0.15 * s, 0, 0, 7);
    ctx.fill();
    ctx.save();
    if (S.invu > 0 && Math.floor(S.t * 16) % 2) ctx.globalAlpha = 0.45;
    ctx.translate(p.x, p.y);
    ctx.scale(s, s);
    ctx.rotate((lx(P.voie) - P.x) * -0.1 + (S.mode == 'fin' ? P.chute * 1.25 : 0));
    ctx.lineCap = ctx.lineJoin = 'round';
    const ph = P.course * 0.55,
      sw = S.mode == 'fin' ? 0 : Math.sin(ph),
      air = !P.sol,
      chaussure = S.bonus.saut ? '#06d6a0' : '#ffffff',
      sweat = '#7c5cff',
      pantalon = '#2c3e6e';
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
    if (P.glisse > 0 && P.sol) {
      // glissade : tout le corps ramassé près du sol
      ligne(pantalon, 0.17, [-0.2, -0.3, -0.26, -0.06]);
      ligne(pantalon, 0.17, [0.2, -0.3, 0.26, -0.06]);
      ovale(chaussure, -0.27, -0.04, 0.11, 0.06);
      ovale(chaussure, 0.27, -0.04, 0.11, 0.06);
      ovale(sweat, 0, -0.42, 0.42, 0.3);
      ovale('#ff8fab', 0, -0.45, 0.25, 0.18);
      ovale('#4a3426', 0, -0.72, 0.19, 0.17);
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(0, -0.74, 0.2, Math.PI, 0);
      ctx.fill();
    } else {
      ctx.translate(0, air ? 0 : -Math.abs(sw) * 0.05); // petit rebond de la course
      // jambes
      const pied = v => (air ? 0.38 : 0.04 + 0.34 * Math.max(0, v));
      ligne(pantalon, 0.18, [-0.14, -0.78, -0.16, -0.4 - pied(sw) * 0.4, -0.17, -0.06 - pied(sw)]);
      ligne(pantalon, 0.18, [0.14, -0.78, 0.16, -0.4 - pied(-sw) * 0.4, 0.17, -0.06 - pied(-sw)]);
      ovale(chaussure, -0.17, -0.04 - pied(sw), 0.11, 0.07);
      ovale(chaussure, 0.17, -0.04 - pied(-sw), 0.11, 0.07);
      // bras
      const main = v => (air ? -1.55 : -0.86 + 0.14 * v);
      ligne('#6a4be8', 0.15, [-0.28, -1.2, -0.4, -1.0, -0.38, main(-sw)]);
      ligne('#6a4be8', 0.15, [0.28, -1.2, 0.4, -1.0, 0.38, main(sw)]);
      // torse et sac à dos
      arrondi(sweat, -0.3, -1.34, 0.6, 0.62, 0.16);
      arrondi('#ff8fab', -0.2, -1.26, 0.4, 0.4, 0.1);
      arrondi('#ffd1dc', -0.12, -1.04, 0.24, 0.1, 0.04);
      // tête et casquette
      ovale('#f2c6a0', -0.2, -1.47, 0.05, 0.07);
      ovale('#f2c6a0', 0.2, -1.47, 0.05, 0.07);
      ovale('#4a3426', 0, -1.5, 0.2, 0.2);
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(0, -1.53, 0.21, Math.PI, 0);
      ctx.fill();
      ovale('#ffffff', 0, -1.72, 0.04, 0.03);
    }
    ctx.restore();
    if (S.bonus.bouclier) {
      ctx.fillStyle = 'rgba(76,201,240,.16)';
      ctx.strokeStyle = 'rgba(76,201,240,.75)';
      ctx.lineWidth = Math.max(1.5, 0.05 * s);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 0.8 * s, 0.75 * s, 1.0 * s, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
    }
  }

  function dessiner() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (S.secousse > 0 && !reduit) {
      const a = S.secousse * 14;
      ctx.translate((Math.random() - 0.5) * a, (Math.random() - 0.5) * a);
    }
    dessinerDecor();
    dessinerParcours();
  }

  // ---------- Interface ----------
  const $ = id => document.getElementById(id);
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => Math.floor(n).toLocaleString('fr-FR');
  const ECRANS = ['menu', 'aide', 'boutique', 'pause', 'fin'];
  let ecranActuel = 'menu',
    retourVers = 'menu';

  function ecran(id) {
    ecranActuel = id;
    for (const e of ECRANS) $(e).hidden = e != id;
    $('hud').hidden = !(S.mode == 'jeu' || S.mode == 'fin') || id == 'menu' || id == 'aide' || id == 'boutique';
    if (id) {
      const b = $(id).querySelector('.btn:not(:disabled)');
      if (b) b.focus({ preventScroll: true });
    }
  }

  // course abandonnée (Recommencer ou Menu pendant la pause) : les pièces ramassées sont gardées
  function abandonner() {
    if (S.mode == 'pause' && !S.demo && S.pieces) {
      D.pieces += S.pieces;
      ecrire();
    }
  }

  function menu() {
    abandonner();
    S.mode = 'menu';
    nouveauMonde(true);
    $('m-record').textContent = fmt(D.record);
    $('m-pieces').textContent = fmt(D.pieces);
    ecran('menu');
  }

  function demarrer() {
    abandonner();
    nouveauMonde(false);
    S.mode = 'jeu';
    hudCache = {};
    ecran(null);
    $('hud').hidden = false;
  }

  function pause() {
    if (S.mode != 'jeu') return;
    S.mode = 'pause';
    ecran('pause');
  }
  function reprendre() {
    if (S.mode != 'pause') return;
    S.mode = 'jeu';
    derniere = 0;
    ecran(null);
    $('hud').hidden = false;
  }

  function afficherFin() {
    $('f-score').textContent = fmt(S.score);
    $('f-record').hidden = !S.nouveau;
    $('f-dist').textContent = fmt(S.dist) + ' m';
    $('f-pieces').textContent = fmt(S.pieces);
    ecran('fin');
  }

  function boutique() {
    $('s-pieces').textContent = fmt(D.pieces);
    $('amelio').innerHTML = ['aimant', 'saut', 'x2']
      .map(k => {
        const n = D.niv[k],
          prix = COUT[n],
          max = n >= 4;
        return (
          '<div class="amelio" style="--c:' + BONUS[k].c + '"><span class="bic" aria-hidden="true">' + { aimant: 'U', saut: '⇈', x2: '×2' }[k] + '</span><div><b>' + BONUS[k].nom + '</b><small>Durée : ' + secondes(dureeBonus(k)) + (max ? ' (maximum)' : ' → ' + secondes(dureeBonus(k, n + 1))) + '</small><span class="niv" aria-label="Niveau ' + n + ' sur 4">' + [0, 1, 2, 3].map(i => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</span></div>' +
          '<button type="button" class="acheter" data-k="' + k + '"' + (max || D.pieces < prix ? ' disabled' : '') + '>' + (max ? 'Max' : '<span class="piece-ic" aria-hidden="true"></span>' + fmt(prix)) + (max ? '' : '<span class="sr-only"> pièces</span>') + '</button></div>'
        );
      })
      .join('');
    ecran('boutique');
  }
  $('amelio').addEventListener('click', e => {
    const b = e.target.closest('[data-k]');
    if (!b || b.disabled) return;
    const k = b.dataset.k,
      prix = COUT[D.niv[k]];
    if (D.niv[k] >= 4 || D.pieces < prix) return;
    D.pieces -= prix;
    D.niv[k]++;
    ecrire();
    son('bonus');
    boutique();
    const nb = $('amelio').querySelector('[data-k="' + k + '"]');
    if (nb && !nb.disabled) nb.focus();
  });

  let hudCache = {},
    msgMinuterie = 0;
  function majHUD() {
    if (S.mode != 'jeu' && S.mode != 'fin') return;
    const v = { s: fmt(S.score), p: fmt(S.pieces), m: S.mult > 1, b: Object.keys(S.bonus).sort().join() };
    if (v.s != hudCache.s) $('h-score').textContent = v.s;
    if (v.p != hudCache.p) $('h-pieces').textContent = v.p;
    if (v.m != hudCache.m) $('h-mult').hidden = !v.m;
    if (v.b != hudCache.b) $('h-bonus').innerHTML = Object.keys(S.bonus).map(k => '<div class="pil" style="--c:' + BONUS[k].c + '">' + BONUS[k].nom + '<i data-b="' + k + '"></i></div>').join('');
    for (const i of $('h-bonus').querySelectorAll('i')) i.style.width = Math.max(0, (100 * S.bonus[i.dataset.b]) / dureeBonus(i.dataset.b)) + '%';
    hudCache = v;
  }

  function message(t, alerte) {
    const m = $('h-msg');
    m.textContent = t;
    m.className = '';
    void m.offsetWidth;
    m.className = 'on' + (alerte ? ' alerte' : '');
    clearTimeout(msgMinuterie);
    msgMinuterie = setTimeout(() => {
      m.className = '';
      m.textContent = '';
    }, 1200);
  }

  function vibrer(ms) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }

  // ---------- Sons (synthétisés, aucun fichier) ----------
  let AC = null,
    dernierePiece = 0;
  function son(k) {
    if (!D.son) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state == 'suspended') AC.resume();
    } catch (e) {
      return;
    }
    const t = AC.currentTime;
    const note = (f, f2, d, type = 'sine', vol = 0.08, debut = 0) => {
      const o = AC.createOscillator(),
        g = AC.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t + debut);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + debut + d);
      g.gain.setValueAtTime(0.0001, t + debut);
      g.gain.exponentialRampToValueAtTime(vol, t + debut + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + debut + d);
      o.connect(g).connect(AC.destination);
      o.start(t + debut);
      o.stop(t + debut + d + 0.02);
    };
    if (k == 'piece') {
      if (t - dernierePiece < 0.05) return;
      dernierePiece = t;
      note(988, 0, 0.07, 'sine', 0.06);
      note(1319, 0, 0.12, 'sine', 0.06, 0.06);
    } else if (k == 'saut') note(330, 660, 0.16, 'triangle', 0.1);
    else if (k == 'glisse') note(520, 200, 0.18, 'triangle', 0.08);
    else if (k == 'voie') note(700, 820, 0.05, 'sine', 0.04);
    else if (k == 'bonus') [523, 659, 784, 1047].forEach((f, i) => note(f, 0, 0.12, 'triangle', 0.08, i * 0.06));
    else if (k == 'alerte') [440, 330].forEach((f, i) => note(f, 0, 0.12, 'square', 0.05, i * 0.13));
    else if (k == 'bouclier') note(900, 300, 0.3, 'sawtooth', 0.06);
    else if (k == 'choc') {
      note(180, 50, 0.45, 'sawtooth', 0.12);
      note(90, 40, 0.5, 'square', 0.06);
    }
  }
  function majSon() {
    $('b-son').textContent = 'Son : ' + (D.son ? 'oui' : 'non');
    $('b-son').setAttribute('aria-pressed', D.son ? 'true' : 'false');
  }

  // ---------- Commandes ----------
  $('b-jouer').onclick = demarrer;
  $('b-rejouer').onclick = demarrer;
  $('b-recommencer').onclick = demarrer;
  $('b-reprendre').onclick = reprendre;
  $('b-pause').onclick = pause;
  $('b-aide').onclick = () => ecran('aide');
  $('b-boutique').onclick = boutique;
  $('b-son').onclick = () => {
    D.son = D.son ? 0 : 1;
    ecrire();
    majSon();
    son('voie');
  };
  for (const b of document.querySelectorAll('[data-retour]')) b.onclick = () => ecran(retourVers);
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
    } else if (k == 'Escape' && (ecranActuel == 'aide' || ecranActuel == 'boutique')) ecran(retourVers);
  });

  // gestes tactiles (et souris) : un glissement = une action
  (() => {
    let o = null;
    cv.addEventListener('pointerdown', e => {
      o = { x: e.clientX, y: e.clientY, fait: false };
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (er) {}
    });
    cv.addEventListener('pointermove', e => {
      if (!o || o.fait) return;
      const dx = e.clientX - o.x,
        dy = e.clientY - o.y,
        seuil = Math.max(22, Math.min(W, H) * 0.04);
      if (Math.hypot(dx, dy) < seuil) return;
      o.fait = true;
      if (Math.abs(dx) > Math.abs(dy)) (dx < 0 ? gauche : droite)();
      else (dy < 0 ? sauter : glisser)();
    });
    for (const t of ['pointerup', 'pointercancel']) cv.addEventListener(t, () => (o = null));
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
    if (lent > 45 && maxDPR > 1) {
      maxDPR = Math.max(1, Math.min(maxDPR, DPR) - 0.5);
      lent = 0;
      taille();
    }
  }

  // hors ligne : le service worker du site met aussi le jeu en cache
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol))
    addEventListener('load', () => navigator.serviceWorker.register('../../sw.js').catch(() => {}));

  // pour les tests : état du jeu, génération du parcours, et avance image par image (60 images par seconde)
  window.VL = {
    S, P, D, troncon, alea, vitesse, demarrer, menu, gauche, droite, sauter, glisser,
    objs: () => objs,
    pieces: () => pieces,
    bonus: () => bonus,
    avancer: s => {
      for (let i = 0; i < Math.round(s * 60); i++) maj(1 / 60);
    }
  };

  taille();
  majSon();
  menu();
  requestAnimationFrame(boucle);
})();
