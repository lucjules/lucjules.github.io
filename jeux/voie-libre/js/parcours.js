// Génération du parcours : une suite de tronçons, chacun toujours franchissable.
// - les barrières basses et les caisses se sautent, les portiques et les drones se passent en glissant ;
// - les wagons d'un tronçon partent ensemble et laissent au moins une voie libre, une rampe ou un wagon plat ;
// - le tronçon suivant ne commence qu'une fois tous les wagons passés.
// Coordonnées : x latéral (voies à -2,2 / 0 / 2,2), y vers le haut, z dans le sens de la course.
import { melange, tirer } from './hasard.js';
import { BONUS, QUARTIERS } from './donnees.js';

export const VOIE = 2.2; // distance entre les centres de deux voies
export const DEMI = 1; // demi-largeur d'un obstacle
export const H_TRAIN = 2.3;
export const H_PLAT = 1.1; // wagon plat : on saute dessus
export const H_CAISSE = 0.8;
export const RAMPE = 6; // longueur de la rampe qui monte sur un wagon
export const NB_COULEURS_TRAIN = 5;
export const LQ = 1200; // longueur d'un quartier en course libre

export const vitesse = dist => 15 + 17 * (1 - Math.exp(-dist / 1800));
export const difficulte = dist => 1 - Math.exp(-dist / 2200);
export const lx = l => (l - 1) * VOIE; // abscisse du centre d'une voie (0, 1, 2)

// quartier à la position z : fixe en niveau, sinon un tous les LQ mètres avec un fondu de 120 m
export function quartierA(z, qFixe = -1) {
  if (qFixe >= 0) return { a: qFixe, b: qFixe, t: 0, i: 0 };
  const d = Math.max(0, z),
    i = Math.floor(d / LQ),
    f = d - i * LQ;
  return { a: i % QUARTIERS.length, b: (i + 1) % QUARTIERS.length, t: f > LQ - 120 ? (f - (LQ - 120)) / 120 : 0, i };
}
export const quartierIndex = (z, qFixe = -1) => {
  const q = quartierA(z, qFixe);
  return q.t < 0.5 ? q.a : q.b;
};

const piece = (l, y, z) => ({ x: lx(l), y, z });
const tirerBonus = r => tirer(r, Object.entries(BONUS).map(([k, b]) => ({ k, poids: b.poids }))).k;

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
  const ts = voies.slice(0, n).map((l, i) => ({
    t: 'train',
    l,
    z0: z + (i ? Math.floor(r() * 3) * 3 : 0),
    L: 10 + Math.floor(r() * (2 + d * 3)) * 6,
    ramp: r() < 0.4,
    c: Math.floor(r() * NB_COULEURS_TRAIN)
  }));
  for (const t of ts) if (!t.ramp && d > 0.1 && r() < 0.2) t.plat = true;
  if (n == 3 && !ts.some(t => t.ramp || t.plat)) ts[Math.floor(r() * 3)].ramp = true;
  let fin = z;
  for (const t of ts) {
    t.z1 = t.z0 + t.L + (t.ramp ? RAMPE : 0);
    delete t.L;
    t.y0 = 0;
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
      p.push(piece(t.l, t.ramp && zc < t.z0 + RAMPE ? (H_TRAIN * (zc - t.z0)) / RAMPE + 0.5 : H_TRAIN + 0.5, zc));
    }
  }
  const libres = voies.slice(n);
  if (libres.length) for (let zz = z + pas * 0.6; zz < fin - 4; zz += pas) rangee(r, zz, libres, o, p, d);
  return { fin, libres };
}

// un wagon qui arrive en sens inverse : rien d'autre dans sa voie pendant tout le tronçon
function approche(r, z, d, pas, o, p) {
  const l = Math.floor(r() * 3),
    L = 12 + Math.floor(r() * 3) * 4;
  const t = { t: 'train', l, z0: z + 60, z1: z + 60 + L, y0: 0, ramp: false, c: Math.floor(r() * NB_COULEURS_TRAIN), vit: 9 + 6 * d };
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

// un tronçon à partir de z ; dist sert à doser la difficulté
export function troncon(r, z, dist) {
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
