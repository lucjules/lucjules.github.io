// Modèles 3D construits par le code (aucun fichier) : wagons, rampes, barrières, caisses, drones,
// accélérateurs, tunnels, passerelles, caténaires, immeubles et éléments de décor des quartiers.
// Repère Three.js : x à droite, y en haut, la course avance vers -z. Chaque objet du parcours est
// construit avec son extrémité avant (côté coureur) en z = 0, et s'étend vers -z.
import * as THREE from '../../lib/three.module.min.js';
import * as TX from './textures.js';
import { H_TRAIN, H_PLAT, H_CAISSE, RAMPE } from '../parcours.js';

export const COULEURS_TRAIN = ['#ff5a5f', '#2ec4b6', '#5b6cff', '#ffb703', '#9b5de5'];

// ---------- matériaux et géométries partagés ----------
const mats = new Map(),
  geos = new Map();
export function mat(cle, fabrique) {
  if (!mats.has(cle)) mats.set(cle, fabrique());
  return mats.get(cle);
}
export function geo(cle, fabrique) {
  if (!geos.has(cle)) {
    const g = fabrique();
    g.userData.partagee = true; // ne pas libérer : réutilisée par d'autres objets
    geos.set(cle, g);
  }
  return geos.get(cle);
}
export const couleur = c => mat('c' + c, () => new THREE.MeshLambertMaterial({ color: c }));
const brillant = c => mat('b' + c, () => new THREE.MeshPhongMaterial({ color: c, shininess: 60, specular: 0x444444 }));
const lumineux = c => mat('l' + c, () => new THREE.MeshBasicMaterial({ color: c }));
const avecTexture = (cle, t, opts = {}) => mat('t' + cle, () => new THREE.MeshLambertMaterial({ map: t, ...opts }));

function ombre(o, porte = true, recoit = true) {
  o.traverse(m => {
    if (m.isMesh) {
      m.castShadow = porte;
      m.receiveShadow = recoit;
    }
  });
  return o;
}

// boîte dont les coordonnées de texture sont en mètres (motif de mL × mH mètres) : la texture se répète
export function boiteUV(l, h, p, mL = 4, mH = 3) {
  const g = new THREE.BoxGeometry(l, h, p),
    uv = g.attributes.uv;
  const taille = [
    [p, h], [p, h], [l, p], [l, p], [l, h], [l, h]
  ];
  for (let i = 0; i < uv.count; i++) {
    const [a, b] = taille[Math.floor(i / 4)];
    uv.setXY(i, (uv.getX(i) * a) / mL, (uv.getY(i) * b) / mH);
  }
  return g;
}

// fusion de géométries simples (positions, normales, coordonnées de texture)
export function fusionner(liste) {
  const pos = [],
    nor = [],
    uvs = [];
  for (const g0 of liste) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    pos.push(...g.attributes.position.array);
    nor.push(...g.attributes.normal.array);
    if (g.attributes.uv) uvs.push(...g.attributes.uv.array);
    else uvs.push(...new Array((g.attributes.position.count * 2) | 0).fill(0));
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  r.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  r.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return r;
}
const place = (g, x, y, z, rx = 0, ry = 0, rz = 0) => {
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  if (rz) g.rotateZ(rz);
  return g.translate(x, y, z);
};

// ---------- wagons ----------
function materiauxWagon(c, v) {
  const flanc = TX.flancWagon(COULEURS_TRAIN[c], v);
  flanc.wrapS = THREE.RepeatWrapping;
  const sombre = couleur('#2a2f3c');
  return [
    avecTexture('flanc' + c + v, flanc),
    avecTexture('flanc' + c + v, flanc),
    sombre,
    sombre,
    avecTexture('face' + c, TX.faceWagon(COULEURS_TRAIN[c])),
    avecTexture('face' + c, TX.faceWagon(COULEURS_TRAIN[c]))
  ];
}
function chassis(L) {
  return geo('chassis' + L, () => {
    const g = [place(new THREE.BoxGeometry(1.5, 0.4, L - 0.6), 0, 0.3, -L / 2)];
    for (const z of [-1.4, -L + 1.4])
      for (const dz of [-0.55, 0.55])
        for (const x of [-0.78, 0.78]) g.push(place(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 12), x, 0.3, z + dz, 0, 0, Math.PI / 2));
    return fusionner(g);
  });
}
export function wagon(o) {
  const L = +(o.z1 - o.z0 - (o.ramp ? RAMPE : 0)).toFixed(2),
    v = (Math.abs(Math.floor(o.z0)) % 2) | 0,
    g = new THREE.Group();
  const corps = new THREE.Mesh(
    geo('corps' + L, () => {
      const b = new THREE.BoxGeometry(2, H_TRAIN - 0.55, L),
        uv = b.attributes.uv;
      for (let i = 0; i < 8; i++) uv.setX(i, (uv.getX(i) * L) / 6); // flancs : un motif tous les 6 m
      return b.translate(0, (H_TRAIN - 0.55) / 2 + 0.2, -L / 2);
    }),
    materiauxWagon(o.c, v)
  );
  const toit = new THREE.Mesh(
    geo('toit' + L, () => {
      const c = new THREE.CylinderGeometry(1, 1, L, 18, 1, false, Math.PI / 2, Math.PI);
      c.rotateX(Math.PI / 2);
      c.scale(1, 0.38, 1);
      return c.translate(0, H_TRAIN - 0.35, -L / 2);
    }),
    brillant('#d4dae4')
  );
  const ch = new THREE.Mesh(chassis(L), couleur('#2a2f3c'));
  g.add(corps, toit, ch);
  if (o.vit) {
    // phares allumés du wagon qui arrive en face
    const h = new THREE.Sprite(mat('phare', () => new THREE.SpriteMaterial({ map: TX.halo('#fff2b0'), blending: THREE.AdditiveBlending, depthWrite: false })));
    h.scale.set(3.6, 2.2, 1);
    h.position.set(0, 0.7, 0.15);
    g.add(h);
  }
  return ombre(g);
}

export function rampe() {
  const g = new THREE.Group();
  const forme = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(RAMPE, 0), new THREE.Vector2(RAMPE, H_TRAIN)]);
  const r = new THREE.Mesh(
    geo('rampe', () => {
      const e = new THREE.ExtrudeGeometry(forme, { depth: 2, bevelEnabled: false });
      e.rotateY(Math.PI / 2);
      return e.translate(-1, 0, 0);
    }),
    [couleur('#8e9ab0'), avecTexture('rampe', TX.rayures('#ffd60a', '#2b2b33', 8))]
  );
  g.add(r);
  return ombre(g);
}

export function plat(o) {
  const L = +(o.z1 - o.z0).toFixed(2),
    g = new THREE.Group();
  g.add(new THREE.Mesh(chassis(L), couleur('#2a2f3c')));
  g.add(new THREE.Mesh(geo('plateau' + L, () => new THREE.BoxGeometry(2, 0.5, L).translate(0, H_PLAT - 0.25, -L / 2)), couleur('#8796b2')));
  for (const x of [-0.98, 0.98]) g.add(new THREE.Mesh(geo('bord' + L, () => new THREE.BoxGeometry(0.06, 0.12, L).translate(0, H_PLAT - 0.12, -L / 2)), couleur('#ffc400')).translateX(x));
  return ombre(g);
}

// ---------- barrières, caisses, drones, accélérateurs ----------
export function barriere(type) {
  const bas = type == 'bas',
    g = new THREE.Group(),
    haut = bas ? 0.65 : 1.75,
    y0 = bas ? 0.3 : 1.05,
    y1 = bas ? 0.65 : 1.6;
  for (const x of [-0.92, 0.92]) g.add(new THREE.Mesh(geo('poteau' + type, () => new THREE.BoxGeometry(0.14, haut, 0.14).translate(0, haut / 2, -0.15)), couleur('#d6dbe6')).translateX(x));
  const tex = TX.rayures(bas ? '#ff3b4a' : '#4361ee');
  g.add(new THREE.Mesh(geo('planche' + type, () => new THREE.BoxGeometry(2, y1 - y0, 0.18).translate(0, (y0 + y1) / 2, -0.15)), avecTexture('barr' + type, tex)));
  if (!bas) {
    const s = new THREE.Mesh(geo('flecheBas', () => new THREE.PlaneGeometry(0.5, 0.5)), mat('flecheBas', () => new THREE.MeshBasicMaterial({ map: TX.icone('fleche', '#ffd60a', '↓'), transparent: true })));
    s.position.set(0, 1.33, -0.05);
    g.add(s);
  }
  return ombre(g);
}

export function caisse() {
  return ombre(new THREE.Mesh(geo('caisse', () => new THREE.BoxGeometry(1.1, H_CAISSE, H_CAISSE).translate(0, H_CAISSE / 2, -H_CAISSE / 2)), avecTexture('caisse', TX.caisse())));
}

export function drone() {
  const g = new THREE.Group(),
    corps = new THREE.Group();
  corps.position.y = 1.38;
  corps.add(new THREE.Mesh(geo('droneCorps', () => new THREE.SphereGeometry(0.42, 18, 12).scale(1.3, 0.55, 1)), brillant('#2c3348')));
  corps.add(new THREE.Mesh(geo('droneBras', () => fusionner([new THREE.BoxGeometry(1.7, 0.06, 0.1), new THREE.BoxGeometry(0.1, 0.06, 1.2)])), couleur('#454d66')));
  const oeil = new THREE.Mesh(geo('droneOeil', () => new THREE.SphereGeometry(0.12, 12, 8)), lumineux('#ff3b5c'));
  oeil.position.set(0, -0.04, 0.42);
  corps.add(oeil);
  const helices = [];
  for (const [x, z] of [[-0.85, 0], [0.85, 0], [0, 0.6], [0, -0.6]]) {
    const h = new THREE.Mesh(geo('helice', () => new THREE.CylinderGeometry(0.34, 0.34, 0.02, 16)), mat('helice', () => new THREE.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.45, depthWrite: false })));
    h.position.set(x, 0.12, z);
    corps.add(h);
    helices.push(h);
  }
  g.add(corps);
  g.userData = { corps, oeil };
  return ombre(g);
}

export function accelerateur() {
  const t = TX.fleches().clone();
  t.needsUpdate = true;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 2);
  const m = new THREE.Mesh(geo('pad', () => new THREE.PlaneGeometry(1.8, 2.6).rotateX(-Math.PI / 2).translate(0, 0.07, -1.3)), new THREE.MeshBasicMaterial({ map: t }));
  m.userData.texture = t;
  return m;
}

export function arrivee() {
  const g = new THREE.Group();
  for (const x of [-3.9, 3.9]) g.add(new THREE.Mesh(geo('arcPot', () => new THREE.BoxGeometry(0.4, 5, 0.4).translate(0, 2.5, 0)), couleur('#ffffff')).translateX(x));
  g.add(new THREE.Mesh(geo('arcBan', () => new THREE.BoxGeometry(8.2, 1, 0.3).translate(0, 4.5, 0)), avecTexture('damier', TX.damier())));
  g.add(new THREE.Mesh(geo('arcSol', () => new THREE.PlaneGeometry(6.6, 0.6).rotateX(-Math.PI / 2).translate(0, 0.08, 0)), couleur('#ffffff')));
  return ombre(g);
}

// bonus au sol : une bulle transparente avec l'icône dedans
export function bonus(k, c, lettre = '') {
  const g = new THREE.Group();
  const bulle = new THREE.Mesh(geo('bulleBonus', () => new THREE.SphereGeometry(0.55, 20, 14)), mat('bulleBonus', () => new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, shininess: 90, depthWrite: false })));
  const ic = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.icone(k, c, lettre), depthWrite: false }));
  ic.scale.set(0.8, 0.8, 1);
  g.add(ic, bulle);
  return g;
}

// ---------- structures ----------
export function catenaire() {
  return ombre(
    new THREE.Mesh(
      geo('catenaire', () => fusionner([place(new THREE.BoxGeometry(0.24, 5.4, 0.24), -4.45, 2.7, 0), place(new THREE.BoxGeometry(0.24, 5.4, 0.24), 4.45, 2.7, 0), place(new THREE.BoxGeometry(9.2, 0.24, 0.24), 0, 5.2, 0), place(new THREE.BoxGeometry(9.2, 0.04, 0.04), 0, 4.75, 0)])),
      couleur('#7c8597')
    ),
    true,
    false
  );
}

export function passerelle(c) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo('pontTablier', () => boiteUV(30, 0.8, 4, 4, 4).translate(0, 6.1, -2)), new THREE.MeshLambertMaterial({ color: c, map: TX.beton() })));
  for (const x of [-5.8, 5.8]) g.add(new THREE.Mesh(geo('pontPile', () => new THREE.BoxGeometry(0.8, 5.7, 0.8).translate(0, 2.85, -2)), couleur('#9aa2b2')).translateX(x));
  for (const z of [-0.1, -3.9]) g.add(new THREE.Mesh(geo('pontGarde', () => new THREE.BoxGeometry(30, 0.6, 0.08).translate(0, 6.8, 0)), couleur('#5b6478')).translateZ(z));
  return ombre(g);
}

// tunnel de longueur L : façade percée, parois et plafond avec bandeaux et plafonniers lumineux
export function tunnel(L, c) {
  const g = new THREE.Group(),
    murs = new THREE.MeshLambertMaterial({ color: c, map: TX.beton() });
  g.add(new THREE.Mesh(boiteUV(18, 12, 1.5, 4, 4).translate(-13.1, 6, -0.75), murs));
  g.add(new THREE.Mesh(boiteUV(18, 12, 1.5, 4, 4).translate(13.1, 6, -0.75), murs));
  g.add(new THREE.Mesh(boiteUV(8.2, 6, 1.5, 4, 4).translate(0, 9, -0.75), murs));
  // cadre sombre autour de l'entrée
  const cadre = couleur('#3a3e4c');
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.6, 0.2).translate(-4.35, 3.3, 0.05), cadre), new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.6, 0.2).translate(4.35, 3.3, 0.05), cadre), new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.5, 0.2).translate(0, 6.35, 0.05), cadre));
  const paroi = couleur('#5d6274'),
    plafond = couleur('#464b5c'),
    bandeau = lumineux('#ffd58c');
  for (const x of [-4.4, 4.4]) {
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, L).translate(x, 3, -L / 2), paroi));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, L).translate(x * 0.93, 3.1, -L / 2), bandeau));
  }
  g.add(new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.6, L).translate(0, 6.3, -L / 2), plafond));
  const plafonniers = [];
  for (let z = -4; z > -L + 2; z -= 7) plafonniers.push(place(new THREE.BoxGeometry(0.8, 0.06, 1.6), 0, 5.98, z));
  if (plafonniers.length) g.add(new THREE.Mesh(fusionner(plafonniers), lumineux('#fff3d0')));
  g.traverse(m => m.isMesh && (m.receiveShadow = true));
  return g;
}

// ---------- décor des quartiers ----------
// immeuble avec façades à fenêtres (allumées la nuit) ; s = côté (-1 gauche, 1 droite)
export function immeuble(l, h, p, c, style, nuit) {
  const m = mat('imm' + c + style + (nuit > 0.5 ? 'n' : ''), () =>
    new THREE.MeshLambertMaterial({ color: c, map: TX.facade(style), emissiveMap: nuit > 0.5 ? TX.facadeNuit(style) : null, emissive: nuit > 0.5 ? 0xffffff : 0x000000, emissiveIntensity: nuit > 0.5 ? 0.9 : 0 })
  );
  [TX.facade(style), TX.facadeNuit(style)].forEach(t => (t.wrapS = t.wrapT = THREE.RepeatWrapping));
  const g = new THREE.Group();
  g.add(new THREE.Mesh(boiteUV(l, h, p).translate(0, h / 2, -p / 2), m));
  // corniche et toit
  g.add(new THREE.Mesh(new THREE.BoxGeometry(l + 0.3, 0.35, p + 0.3).translate(0, h + 0.17, -p / 2), couleur('#e9e3d8')));
  return ombre(g, false, true);
}

export function reservoir() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo('resCuve', () => new THREE.CylinderGeometry(1, 1, 1.8, 14).translate(0, 2.3, 0)), couleur('#9b6b48')));
  g.add(new THREE.Mesh(geo('resToit', () => new THREE.ConeGeometry(1.1, 0.7, 14).translate(0, 3.55, 0)), couleur('#7a5236')));
  for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) g.add(new THREE.Mesh(geo('resPied', () => new THREE.BoxGeometry(0.12, 1.4, 0.12).translate(0, 0.7, 0)), couleur('#4a4f5c')).translateX(x).translateZ(z));
  return g;
}

export function conteneur(c) {
  const m = mat('cont' + c, () => new THREE.MeshLambertMaterial({ color: c, map: TX.rayures('#00000022', '#ffffff', 14) }));
  return ombre(new THREE.Mesh(geo('conteneur', () => new THREE.BoxGeometry(2.5, 2.5, 6).translate(0, 1.25, -3)), m), true, true);
}

export function grue(s) {
  const g = new THREE.Group(),
    jaune = couleur('#f5b82e');
  for (const z of [0, -3.4]) g.add(new THREE.Mesh(geo('grueJambe', () => new THREE.BoxGeometry(0.5, 16, 0.5).translate(0, 8, 0)), jaune).translateZ(z));
  g.add(new THREE.Mesh(geo('grueFleche', () => new THREE.BoxGeometry(18, 0.8, 1.2).translate(-6, 16.4, -1.7)), jaune).rotateY(s > 0 ? 0 : Math.PI));
  g.add(new THREE.Mesh(geo('grueCabine', () => new THREE.BoxGeometry(1.6, 1.4, 1.6).translate(0, 15, -1.7)), couleur('#d9dde6')));
  return ombre(g, false, false);
}

export function palmier(h) {
  const g = new THREE.Group();
  const tronc = new THREE.Mesh(geo('palmTronc', () => new THREE.CylinderGeometry(0.16, 0.26, 1, 8).translate(0, 0.5, 0)), couleur('#9b7650'));
  tronc.scale.y = h;
  tronc.rotation.z = 0.08;
  g.add(tronc);
  const feuilles = new THREE.Mesh(
    geo('palmFeuilles', () => {
      const f = [];
      for (let i = 0; i < 7; i++) {
        const p = new THREE.ConeGeometry(0.42, 2.6, 4);
        p.scale(1, 1, 0.18);
        p.rotateZ(-Math.PI / 2 + 0.35);
        p.translate(1.2, -0.3, 0);
        p.rotateY((i / 7) * Math.PI * 2);
        f.push(p);
      }
      return fusionner(f);
    }),
    couleur('#2f9e57')
  );
  feuilles.position.set(h * 0.08, h, 0);
  g.add(feuilles);
  return ombre(g, true, false);
}

export function arbre(h, c) {
  const g = new THREE.Group();
  const tronc = new THREE.Mesh(geo('arbreTronc', () => new THREE.CylinderGeometry(0.16, 0.22, 1, 7).translate(0, 0.5, 0)), couleur('#6e4f3a'));
  tronc.scale.y = h;
  g.add(tronc);
  const feuillage = new THREE.Mesh(geo('arbreBoule', () => new THREE.IcosahedronGeometry(1.4, 1)), couleur(c));
  feuillage.position.y = h + 0.8;
  feuillage.scale.set(1, 0.9, 1);
  g.add(feuillage);
  return ombre(g, true, false);
}

export function lampadaire(s, allume) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo('lampMat', () => fusionner([place(new THREE.CylinderGeometry(0.08, 0.1, 4.6, 6), 0, 2.3, 0), place(new THREE.BoxGeometry(0.9, 0.08, 0.08), -0.45, 4.6, 0)])), couleur('#3c4256')).rotateY(s > 0 ? 0 : Math.PI));
  const tete = new THREE.Mesh(geo('lampTete', () => new THREE.SphereGeometry(0.2, 10, 6).scale(1.4, 0.6, 1.4)), allume ? lumineux('#ffe9a8') : couleur('#e6e6dc'));
  tete.position.set(-0.85 * s, 4.5, 0);
  g.add(tete);
  if (allume) {
    const h = new THREE.Sprite(mat('halo', () => new THREE.SpriteMaterial({ map: TX.halo('#ffd27a'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })));
    h.scale.set(3.2, 3.2, 1);
    h.position.copy(tete.position);
    g.add(h);
  }
  return g;
}

// tronçon de quai couvert (gare) : 20 m, de x0 (bord des voies) vers l'extérieur selon le côté s
export function quai(s, panneau) {
  const g = new THREE.Group();
  const q = new THREE.Mesh(geo('quai', () => boiteUV(5.4, 1.1, 20, 2, 2).translate(0, 0.55, -10)), new THREE.MeshLambertMaterial({ color: '#cfd2da', map: TX.beton() }));
  q.position.x = s * (4.15 + 2.7);
  g.add(q);
  g.add(new THREE.Mesh(geo('quaiBord', () => new THREE.BoxGeometry(0.35, 0.02, 20).translate(0, 1.11, -10)), couleur('#ffcc00')).translateX(s * 4.35));
  for (const z of [-4, -14]) g.add(new THREE.Mesh(geo('pilier', () => new THREE.CylinderGeometry(0.16, 0.16, 3.6, 8).translate(0, 2.9, 0)), couleur('#79839a')).translateX(s * 9.6).translateZ(z));
  const auvent = new THREE.Mesh(geo('auvent', () => new THREE.BoxGeometry(5.8, 0.25, 20).translate(0, 4.75, -10)), couleur('#9fb2c8'));
  auvent.position.x = s * (4.6 + 2.9);
  auvent.rotation.z = s * 0.08;
  g.add(auvent);
  if (panneau) {
    const p = new THREE.Mesh(geo('panneauGare', () => new THREE.PlaneGeometry(2.6, 0.65)), mat('panneauGare', () => new THREE.MeshBasicMaterial({ map: TX.panneau('GARE CENTRALE'), side: THREE.DoubleSide })));
    p.position.set(s * 6, 3.9, -6);
    g.add(p);
  }
  return ombre(g, true, true);
}

// murs bas le long des voies (avec fresques), un tronçon de 20 m d'un côté
export function muret(s, couleurMur, fresque) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo('muret', () => boiteUV(0.4, 0.8, 20, 2, 2).translate(0, 0.4, -10)), new THREE.MeshLambertMaterial({ color: couleurMur, map: TX.beton() })).translateX(s * 3.9));
  if (fresque >= 0) {
    const f = new THREE.Mesh(geo('fresque', () => new THREE.PlaneGeometry(12, 0.65)), mat('fresque' + fresque, () => new THREE.MeshLambertMaterial({ map: TX.fresque(fresque) })));
    f.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    f.position.set(s * 3.69, 0.4, -10);
    g.add(f);
  }
  return g;
}

export function citrouille() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo('citrouille', () => new THREE.SphereGeometry(0.42, 14, 10).scale(1.2, 0.85, 1.2)), mat('citrouilleM', () => new THREE.MeshLambertMaterial({ color: '#ff8c2e', emissive: '#ff6a00', emissiveIntensity: 0.35 }))));
  g.add(new THREE.Mesh(geo('queue', () => new THREE.CylinderGeometry(0.05, 0.07, 0.25, 6).translate(0, 0.42, 0)), couleur('#4a7a2a')));
  return g;
}
