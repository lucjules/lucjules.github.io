// Décor des quartiers, généré par tronçons de 40 m au fil de la course (toujours le même pour une même
// graine) : immeubles, conteneurs, grues, palmiers, arbres, lampadaires, quais de gare, murets à fresques,
// caténaires, passerelles, et citrouilles pendant Halloween.
import * as THREE from '../../lib/three.module.min.js';
import { alea } from '../hasard.js';
import { QUARTIERS } from '../donnees.js';
import { quartierIndex } from '../parcours.js';
import * as M from './modeles.js';

export const TRONCON = 40;
const CONTENEURS = ['#eb6e3c', '#3478be', '#3ca06e', '#c83c46', '#f0be3c'];

export function construireTroncon(k, { graine, qFixe, enTunnel, evenement }) {
  const r = alea((graine * 31 + k * 7919) >>> 0),
    z0 = k * TRONCON,
    q = QUARTIERS[quartierIndex(z0 + TRONCON / 2, qFixe)],
    g = new THREE.Group(),
    poser = (o, x, y, z) => {
      o.position.set(x, y, -(z - z0));
      g.add(o);
      return o;
    },
    couleurImm = () => q.immeubles[Math.floor(r() * q.immeubles.length)];
  g.userData.z0 = z0;

  for (const s of [-1, 1]) {
    // murets avec fresques (deux tronçons de 20 m)
    for (const dz of [0, 20]) {
      const f = r() < 0.4 ? Math.floor(r() * 12) : -1;
      poser(M.muret(s, q.mur, f), 0, 0, z0 + dz);
      if (evenement == 'halloween' && r() < 0.45) poser(M.citrouille(), s * 3.9, 0.95, z0 + dz + 4 + r() * 12);
    }
    if (q.decor.includes('quais')) {
      // gare : deux quais couverts, puis les bâtiments en retrait
      for (const dz of [0, 20]) poser(M.quai(s, r() < 0.3), 0, 0, z0 + dz);
      let z = z0 + r() * 3;
      while (z < z0 + TRONCON - 6) {
        const p = 6 + r() * 6,
          l = 6 + r() * 6,
          h = 8 + r() * 9;
        poser(M.immeuble(l, h, p, couleurImm(), Math.floor(r() * 2), q.nuit), s * (12 + r() * 2 + l / 2), 0, z);
        z += p + 1 + r() * 3;
      }
      continue;
    }
    let z = z0 + r() * 4;
    while (z < z0 + TRONCON - 3) {
      if (q.decor.includes('conteneurs') && r() < 0.5) {
        // piles de conteneurs, parfois une grue derrière
        const x = s * (6.8 + r() * 1.5),
          n = 1 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) poser(M.conteneur(CONTENEURS[Math.floor(r() * CONTENEURS.length)]), x, i * 2.5, z).rotation.y = (r() - 0.5) * 0.06;
        if (r() < 0.18) poser(M.grue(s), s * (14 + r() * 3), 0, z + 3);
        z += 6.6 + r() * 2;
        continue;
      }
      let ecart = 6.4 + r() * 1.6,
        h = 4 + r() * 7;
      if (q.id == 'couchant') {
        ecart = 9 + r() * 2;
        h = 3.5 + r() * 4;
      } else if (q.id == 'parc') {
        ecart = 12 + r() * 4;
        h = 9 + r() * 14;
      } else if (q.id == 'briques') h = 6 + r() * 10;
      const l = 5 + r() * 5,
        p = 7 + r() * 12;
      poser(M.immeuble(l, h, p, couleurImm(), Math.floor(r() * 2), q.nuit), s * (ecart + l / 2), 0, z);
      if (q.decor.includes('reservoir') && r() < 0.45) poser(M.reservoir(), s * (ecart + l / 2), h + 0.35, z + p / 2);
      z += p + 1 + r() * 4;
    }
    // palmiers, arbres et lampadaires au bord des voies
    if (q.decor.includes('palmier')) for (let zp = z0 + r() * 6; zp < z0 + TRONCON; zp += 7 + r() * 6) poser(M.palmier(5 + r() * 2.5), s * (5.3 + r() * 1.4), 0, zp);
    if (q.decor.includes('arbre'))
      for (let zp = z0 + r() * 5; zp < z0 + TRONCON; zp += 5 + r() * 6) {
        if (r() < 0.35) poser(M.lampadaire(s, q.nuit > 0.4), s * 4.7, 0, zp);
        else poser(M.arbre(2.4 + r() * 1.8, r() < 0.5 ? '#2f7a4f' : '#3b8f5a'), s * (5.6 + r() * 2.5), 0, zp);
      }
  }
  // caténaire au milieu du tronçon, passerelle de temps en temps (jamais dans un tunnel)
  const zc = z0 + TRONCON / 2;
  if (!enTunnel(zc, 1)) poser(M.catenaire(), 0, 0, zc);
  if (q.decor.includes('passerelle') && r() < 0.18 && !enTunnel(z0 + 8, 8) && !enTunnel(z0 + 14)) poser(M.passerelle(q.mur), 0, 0, z0 + 10);
  optimiser(g);
  return g;
}

// le décor ne bouge pas : on fusionne les maillages qui partagent un matériau (quelques appels de dessin
// par tronçon au lieu de plusieurs dizaines)
function optimiser(g) {
  g.updateMatrixWorld(true);
  const lots = new Map();
  g.traverse(m => {
    if (!m.isMesh || m.isInstancedMesh || Array.isArray(m.material)) return;
    const cle = m.material.uuid + (m.castShadow ? ':o' : '') + (m.receiveShadow ? ':r' : '');
    if (!lots.has(cle)) lots.set(cle, []);
    lots.get(cle).push(m);
  });
  for (const liste of lots.values()) {
    if (liste.length < 2) continue;
    let n = 0;
    const geos = liste.map(m => {
      const x = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrixWorld);
      n += x.attributes.position.count;
      return x;
    });
    const pos = new Float32Array(n * 3),
      nor = new Float32Array(n * 3),
      uv = new Float32Array(n * 2);
    let i = 0;
    for (const x of geos) {
      pos.set(x.attributes.position.array, i * 3);
      if (x.attributes.normal) nor.set(x.attributes.normal.array, i * 3);
      if (x.attributes.uv) uv.set(x.attributes.uv.array, i * 2);
      i += x.attributes.position.count;
      x.dispose();
    }
    const f = new THREE.BufferGeometry();
    f.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    f.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    f.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    f.computeBoundingSphere();
    const fm = new THREE.Mesh(f, liste[0].material);
    fm.castShadow = liste[0].castShadow;
    fm.receiveShadow = liste[0].receiveShadow;
    g.add(fm);
    for (const m of liste) {
      m.removeFromParent();
      if (!m.geometry.userData.partagee) m.geometry.dispose();
    }
  }
}

export function detruire(g) {
  // les géométries et matériaux sont partagés (cache de modeles.js), sauf ceux des immeubles et murets
  g.traverse(m => {
    if (m.isMesh && m.geometry && !m.geometry.userData.partagee) m.geometry.dispose();
  });
}
