// Personnages articulés (coureur, agent poursuivant) et chien robot, animés par le code.
// Le personnage regarde vers -z (le sens de la course) : la caméra de jeu le voit de dos, celle du menu de face.
// Les membres pendent vers -y depuis leur articulation ; une rotation x positive les porte vers l'avant.
import * as THREE from '../../lib/three.module.min.js';
import { couleur, geo, mat, fusionner } from './modeles.js';
import * as TX from './textures.js';

const membre = (L, r) => geo('membre' + L + r, () => new THREE.CapsuleGeometry(r, L - 2 * r, 4, 10).translate(0, -L / 2, 0));
const boule = r => geo('boule' + r, () => new THREE.SphereGeometry(r, 16, 12));

function articulation(parent, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

// tête : visage vers -z, cheveux et coiffure
function tete(p) {
  const g = new THREE.Group(),
    peau = couleur(p.peau),
    cheveux = couleur(p.cheveux),
    acc = couleur(p.accessoire);
  g.add(new THREE.Mesh(boule(0.27), peau));
  for (const s of [-1, 1]) {
    g.add(new THREE.Mesh(boule(0.07), peau).translateX(s * 0.27).translateY(-0.01));
    const oeil = new THREE.Mesh(boule(0.055), couleur('#ffffff'));
    oeil.position.set(s * 0.095, 0.03, -0.235);
    oeil.scale.set(1, 1.15, 0.6);
    const pupille = new THREE.Mesh(boule(0.032), couleur('#1d1d2b'));
    pupille.position.set(s * 0.095, 0.03, -0.268);
    g.add(oeil, pupille);
  }
  const bouche = new THREE.Mesh(geo('bouche', () => new THREE.TorusGeometry(0.06, 0.014, 6, 12, Math.PI)), couleur('#7a2e2e'));
  bouche.position.set(0, -0.085, -0.252);
  bouche.rotation.set(0, 0, Math.PI);
  g.add(bouche);
  // nez, joues roses, sourcils
  g.add(new THREE.Mesh(boule(0.035), peau).translateY(-0.02).translateZ(-0.27));
  for (const s of [-1, 1]) {
    const joue = new THREE.Mesh(boule(0.045), couleur('#ff9e9e'));
    joue.position.set(s * 0.15, -0.05, -0.215);
    joue.scale.set(1, 0.6, 0.4);
    const sourcil = new THREE.Mesh(geo('sourcil', () => new THREE.CapsuleGeometry(0.014, 0.06, 2, 6).rotateZ(Math.PI / 2)), cheveux);
    sourcil.position.set(s * 0.095, 0.115, -0.245);
    sourcil.rotation.z = s * -0.12;
    g.add(joue, sourcil);
  }
  // cheveux : le dessus et l'arrière de la tête
  const coupe = geo('cheveux', () =>
    fusionner([new THREE.SphereGeometry(0.29, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), new THREE.SphereGeometry(0.288, 16, 10, 0, Math.PI, 0, Math.PI * 0.72)])
  );
  if (p.coiffure != 'capuche') {
    g.add(new THREE.Mesh(coupe, cheveux));
    // frange sur le front
    const frange = new THREE.Mesh(geo('frange', () => new THREE.SphereGeometry(0.292, 16, 6, Math.PI * 1.15, Math.PI * 0.7, Math.PI * 0.18, Math.PI * 0.2)), cheveux);
    g.add(frange);
  }
  if (p.coiffure == 'casquette') {
    // casquette portée à l'envers : la visière est derrière
    g.add(new THREE.Mesh(geo('calotte', () => new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.45)), acc).translateY(0.02));
    const visiere = new THREE.Mesh(geo('visiere', () => new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16, 1, false, 0, Math.PI).scale(1, 1, 1.3)), acc);
    visiere.position.set(0, 0.08, 0.22);
    visiere.rotation.x = -0.15;
    g.add(visiere);
  } else if (p.coiffure == 'bonnet') {
    g.add(new THREE.Mesh(geo('bonnet', () => new THREE.SphereGeometry(0.305, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5)), acc).translateY(0.04));
    g.add(new THREE.Mesh(geo('revers', () => new THREE.TorusGeometry(0.29, 0.05, 8, 20).rotateX(Math.PI / 2)), couleur('#ffffff')).translateY(0.06));
    g.add(new THREE.Mesh(boule(0.09), couleur('#ffffff')).translateY(0.36));
  } else if (p.coiffure == 'couettes') {
    for (const s of [-1, 1]) {
      g.add(new THREE.Mesh(boule(0.13), cheveux).translateX(s * 0.3).translateY(0.08).translateZ(0.08));
      g.add(new THREE.Mesh(boule(0.045), acc).translateX(s * 0.24).translateY(0.12).translateZ(0.06));
    }
  } else if (p.coiffure == 'crete') {
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(geo('pic', () => new THREE.ConeGeometry(0.06, 0.24, 6)), cheveux);
      c.position.set(0, 0.3 - Math.abs(i - 2) * 0.03, -0.16 + i * 0.09);
      c.rotation.x = (i - 2) * 0.35;
      g.add(c);
    }
  } else if (p.coiffure == 'chignon') {
    g.add(new THREE.Mesh(boule(0.13), cheveux).translateY(0.24).translateZ(0.16));
    g.add(new THREE.Mesh(geo('lien', () => new THREE.TorusGeometry(0.1, 0.025, 6, 14)), acc).translateY(0.2).translateZ(0.12).rotateX(0.9));
  } else if (p.coiffure == 'capuche') {
    const cap = new THREE.Mesh(geo('capuche', () => new THREE.SphereGeometry(0.34, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62)), couleur(p.sweat));
    cap.position.set(0, 0.02, 0.05);
    cap.rotation.x = -0.35;
    g.add(cap);
    g.add(new THREE.Mesh(boule(0.05), acc).translateY(0.34).translateZ(0.12));
  }
  return g;
}

export class Personnage {
  // p : couleurs (sweat, pantalon, peau, cheveux, coiffure, accessoire, sac, chaussures) ; agent : gilet et casquette
  constructor(p, { agent = false } = {}) {
    this.racine = new THREE.Group();
    this.pivot = articulation(this.racine, 0, 0.55, 0); // pivot des roulades et des figures
    this.bassin = articulation(this.pivot, 0, 0.25, 0);
    const sweat = couleur(p.sweat),
      pantalon = couleur(p.pantalon),
      peau = couleur(p.peau);
    // torse
    this.torse = articulation(this.bassin, 0, 0, 0);
    const corps = new THREE.Mesh(geo('torse', () => new THREE.CapsuleGeometry(0.24, 0.22, 6, 14).scale(1.12, 1, 0.82).translate(0, 0.22, 0)), sweat);
    this.torse.add(corps);
    this.torse.add(new THREE.Mesh(geo('ceinture', () => new THREE.CylinderGeometry(0.25, 0.24, 0.12, 14).scale(1.08, 1, 0.82).translate(0, -0.02, 0)), pantalon));
    // cou, bas du sweat, fermeture éclair
    this.torse.add(new THREE.Mesh(geo('cou', () => new THREE.CylinderGeometry(0.09, 0.1, 0.16, 10).translate(0, 0.58, 0)), peau));
    this.torse.add(new THREE.Mesh(geo('basSweat', () => new THREE.TorusGeometry(0.235, 0.04, 6, 18).rotateX(Math.PI / 2).scale(1.12, 1, 0.82).translate(0, 0.04, 0)), couleur(p.sweat)));
    if (!agent) this.torse.add(new THREE.Mesh(geo('zip', () => new THREE.BoxGeometry(0.03, 0.42, 0.02).translate(0, 0.27, -0.205)), couleur('#ffffff')));
    if (agent) {
      this.torse.add(new THREE.Mesh(geo('gilet', () => new THREE.CapsuleGeometry(0.255, 0.18, 6, 14).scale(1.12, 1, 0.84).translate(0, 0.24, 0)), couleur('#ff8c2e')));
      this.torse.add(new THREE.Mesh(geo('bandeGilet', () => new THREE.CylinderGeometry(0.29, 0.29, 0.05, 14).scale(1.1, 1, 0.84).translate(0, 0.2, 0)), couleur('#e9edf5')));
    } else {
      // sac à dos
      const sac = new THREE.Mesh(geo('sac', () => new THREE.BoxGeometry(0.36, 0.4, 0.18)), couleur(p.sac));
      sac.position.set(0, 0.24, 0.25);
      this.torse.add(sac);
      this.sac = sac;
      // capuche du sweat, repliée dans le dos
      if (p.coiffure != 'capuche') this.torse.add(new THREE.Mesh(geo('capRepliee', () => new THREE.TorusGeometry(0.15, 0.06, 6, 14).rotateX(Math.PI / 2.4).translate(0, 0.52, 0.14)), couleur(p.sweat)));
      this.torse.add(new THREE.Mesh(geo('poche', () => new THREE.BoxGeometry(0.26, 0.14, 0.06)), couleur('#ffffff')).translateY(0.15).translateZ(0.35));
    }
    // tête
    this.tete = articulation(this.torse, 0, 0.72, 0);
    this.tete.add(tete(agent ? { ...p, coiffure: 'aucune' } : p));
    if (agent) {
      const c = couleur('#25304d');
      this.tete.add(new THREE.Mesh(geo('calotteAgent', () => new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.45)), c).translateY(0.03));
      this.tete.add(new THREE.Mesh(geo('visiereAgent', () => new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16, 1, false, Math.PI, Math.PI).scale(1, 1, 1.3)), c).translateY(0.08).translateZ(-0.22));
    }
    // bras
    this.epaules = [];
    this.coudes = [];
    for (const s of [-1, 1]) {
      const e = articulation(this.torse, s * 0.33, 0.38, 0);
      e.add(new THREE.Mesh(membre(0.28, 0.08), sweat));
      const c = articulation(e, 0, -0.26, 0);
      c.add(new THREE.Mesh(membre(0.25, 0.072), sweat));
      c.add(new THREE.Mesh(boule(0.085), peau).translateY(-0.27));
      this.epaules.push(e);
      this.coudes.push(c);
    }
    // jambes
    this.hanches = [];
    this.genoux = [];
    const chaussure = couleur(p.chaussures || '#ffffff');
    for (const s of [-1, 1]) {
      const h = articulation(this.bassin, s * 0.13, -0.06, 0);
      h.add(new THREE.Mesh(membre(0.38, 0.105), pantalon));
      const g = articulation(h, 0, -0.36, 0);
      g.add(new THREE.Mesh(membre(0.36, 0.09), pantalon));
      const pied = new THREE.Mesh(geo('chaussure', () => new THREE.CapsuleGeometry(0.09, 0.17, 4, 10).rotateX(Math.PI / 2).scale(1.2, 0.85, 1)), chaussure);
      pied.position.set(0, -0.38, -0.07);
      const semelle = new THREE.Mesh(geo('semelle', () => new THREE.BoxGeometry(0.2, 0.05, 0.36)), couleur('#f4f4f4'));
      semelle.position.set(0, -0.445, -0.07);
      g.add(pied, semelle);
      this.hanches.push(h);
      this.genoux.push(g);
    }
    // accessoires : planche, jetpack, bulle
    this.planche = new THREE.Group();
    this.racine.add(this.planche);
    this.jetpack = new THREE.Group();
    for (const s of [-1, 1]) {
      this.jetpack.add(new THREE.Mesh(geo('reservoir', () => new THREE.CapsuleGeometry(0.1, 0.3, 4, 10)), couleur('#aab3c5')).translateX(s * 0.12));
      const f = new THREE.Mesh(geo('flamme', () => new THREE.ConeGeometry(0.08, 0.5, 10).rotateX(Math.PI).translate(0, -0.45, 0)), mat('flamme', () => new THREE.MeshBasicMaterial({ color: 0xffb703, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })));
      f.position.x = s * 0.12;
      this.jetpack.add(f);
      (this.flammes = this.flammes || []).push(f);
    }
    this.jetpack.position.set(0, 0.25, 0.32);
    this.jetpack.visible = false;
    this.torse.add(this.jetpack);
    this.bulle = new THREE.Mesh(geo('bulle', () => new THREE.SphereGeometry(1.05, 24, 16)), mat('bulleM', () => new THREE.MeshPhongMaterial({ color: 0xff70a6, transparent: true, opacity: 0.22, shininess: 100, depthWrite: false })));
    this.bulle.position.y = 0.85;
    this.bulle.scale.y = 1.15;
    this.bulle.visible = false;
    this.racine.add(this.bulle);
    // seules les grandes pièces portent une ombre (les yeux, la bouche… n'y changent rien et coûtent un dessin chacun)
    this.racine.traverse(m => {
      if (!m.isMesh) return;
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      m.castShadow = m.geometry.boundingSphere.radius > 0.09;
    });
    this.bulle.castShadow = false;
    this.anglesCourant = new Map();
  }

  // planche choisie (couleurs c1, c2, lueur)
  equiperPlanche(pl) {
    this.planche.clear();
    if (!pl) return;
    const plateau = new THREE.Mesh(geo('plateau', () => new THREE.CapsuleGeometry(0.28, 1.0, 4, 12).rotateX(Math.PI / 2).scale(1, 0.18, 1)), couleur(pl.c1));
    const bande = new THREE.Mesh(geo('bande', () => new THREE.BoxGeometry(0.12, 0.02, 1.2)), couleur(pl.c2));
    bande.position.y = 0.05;
    const lueur = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.halo(pl.lueur), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    lueur.scale.set(1.6, 0.8, 1);
    lueur.position.y = -0.12;
    this.planche.add(plateau, bande, lueur);
    this.planche.position.y = 0.12;
    this.planche.visible = false;
  }

  // une articulation glisse en douceur vers l'angle voulu
  vers(objet, axe, cible, k) {
    objet.rotation[axe] += (cible - objet.rotation[axe]) * k;
  }

  // e : { dt, t, phase, sol, vy, glisse (0 à 1, avancement de la roulade), figure (0 à 1), planche, vol,
  //       chute (0 à 1), trebuche (0 à 1), inclinaison, menu, bulle }
  animer(e) {
    const k = 1 - Math.exp(-e.dt * 16),
      [hG, hD] = this.hanches,
      [gG, gD] = this.genoux,
      [eG, eD] = this.epaules,
      [cG, cD] = this.coudes,
      R = this.racine;
    let cible;
    const phi = e.phase * ((Math.PI * 2) / 2.7),
      s = Math.sin(phi);
    this.planche.visible = !!e.planche && !e.vol;
    this.jetpack.visible = !!e.vol;
    if (this.sac) this.sac.visible = !e.vol;
    this.bulle.visible = !!e.bulle;
    if (e.vol) for (const f of this.flammes) f.scale.set(1, 0.8 + Math.random() * 0.5, 1);
    let y = 0,
      roule = 0,
      tourne = 0;
    if (e.menu) {
      // pose de vitrine : debout, respiration, petit balancement
      const b = Math.sin(e.t * 2);
      cible = { hG: 0.05, hD: -0.05, gG: -0.08, gD: -0.08, eG: 0.15 + b * 0.04, eD: -0.1 - b * 0.04, cG: 0.4, cD: 0.5, ezG: -0.2, ezD: 0.2, torse: 0.02, torseY: Math.sin(e.t * 0.7) * 0.15 };
      y = b * 0.01 + (e.planche ? 0.18 : 0);
    } else if (e.chute > 0) {
      cible = { hG: 0.9, hD: 0.5, gG: -0.3, gD: -0.6, eG: -2.4, eD: -2.2, cG: 0.3, cD: 0.4, ezG: -0.9, ezD: 0.9, torse: 0.4, torseY: 0 };
    } else if (e.vol) {
      cible = { hG: -0.25, hD: -0.45, gG: -0.6, gD: -0.9, eG: 0.9, eD: 0.9, cG: 0.9, cD: 0.9, ezG: -0.25, ezD: 0.25, torse: -0.35, torseY: 0 };
      y = Math.sin(e.t * 3) * 0.08;
    } else if (e.glisse > 0 && e.sol) {
      // roulade vers l'avant, corps en boule
      cible = { hG: 1.7, hD: 1.7, gG: -2.3, gD: -2.3, eG: 1.2, eD: 1.2, cG: 1.6, cD: 1.6, ezG: -0.2, ezD: 0.2, torse: -1.1, torseY: 0 };
      roule = -Math.PI * 2 * Math.min(1, e.glisse / 0.7);
      y = -0.3;
    } else if (e.planche) {
      // sur la planche : pieds décalés, genoux fléchis, bras écartés
      cible = { hG: 0.35, hD: -0.3, gG: -0.55, gD: -0.45, eG: 0.2, eD: -0.2, cG: 0.4, cD: 0.4, ezG: -1.1, ezD: 1.1, torse: -0.2, torseY: 0.35 };
      y = 0.18 + Math.sin(e.t * 4) * 0.03;
      if (!e.sol) Object.assign(cible, { hG: 0.9, hD: 0.7, gG: -1.2, gD: -1.1 });
    } else if (!e.sol) {
      // saut : genoux remontés, bras en l'air
      const monte = e.vy > 0;
      cible = { hG: 1.0, hD: 0.4, gG: -1.5, gD: -0.9, eG: monte ? -2.5 : -1.6, eD: monte ? -2.2 : -1.3, cG: 0.3, cD: 0.3, ezG: -0.45, ezD: 0.45, torse: -0.1, torseY: 0 };
    } else {
      // course : jambes et bras en opposition, léger rebond, buste penché
      const c = Math.cos(phi);
      cible = {
        hG: 0.85 * s,
        hD: -0.85 * s,
        gG: -0.25 - 1.15 * Math.max(0, -c * 0.6 + s * 0.8),
        gD: -0.25 - 1.15 * Math.max(0, c * 0.6 - s * 0.8),
        eG: -0.9 * s,
        eD: 0.9 * s,
        cG: 1.2 - 0.3 * s,
        cD: 1.2 + 0.3 * s,
        ezG: -0.12,
        ezD: 0.12,
        torse: -0.22,
        torseY: -0.12 * s
      };
      y = Math.abs(Math.cos(phi)) * 0.07;
    }
    if (e.figure > 0) tourne = Math.PI * 2 * Math.min(1, e.figure / 0.5);
    this.vers(hG, 'x', cible.hG, k);
    this.vers(hD, 'x', cible.hD, k);
    this.vers(gG, 'x', cible.gG, k);
    this.vers(gD, 'x', cible.gD, k);
    this.vers(eG, 'x', cible.eG, k);
    this.vers(eD, 'x', cible.eD, k);
    this.vers(eG, 'z', cible.ezG, k);
    this.vers(eD, 'z', cible.ezD, k);
    this.vers(cG, 'x', cible.cG, k);
    this.vers(cD, 'x', cible.cD, k);
    this.vers(this.torse, 'x', cible.torse, k);
    this.vers(this.torse, 'y', cible.torseY, k);
    this.bassin.position.y += (0.25 + y - this.bassin.position.y) * k;
    this.pivot.rotation.x = roule;
    this.pivot.rotation.y = tourne;
    // penché dans les virages, renversé en arrière en cas de chute, secoué quand on trébuche
    R.rotation.z += (-(e.inclinaison || 0) * 0.14 - R.rotation.z) * k;
    R.rotation.x = (e.chute || 0) * 1.35 + (e.trebuche > 0 ? Math.sin(e.t * 40) * 0.12 * e.trebuche : 0);
    this.planche.rotation.y = tourne;
  }
}

// chien robot de l'agent
export class ChienRobot {
  constructor() {
    this.racine = new THREE.Group();
    const metal = couleur('#c9d1e3'),
      sombre = couleur('#6c7690');
    const corps = new THREE.Mesh(geo('chienCorps', () => new THREE.CapsuleGeometry(0.2, 0.45, 4, 10).rotateX(Math.PI / 2)), metal);
    corps.position.y = 0.55;
    const tete = new THREE.Mesh(geo('chienTete', () => new THREE.BoxGeometry(0.3, 0.26, 0.34)), metal);
    tete.position.set(0, 0.78, -0.4);
    const antenne = new THREE.Mesh(geo('antenne', () => new THREE.CylinderGeometry(0.015, 0.015, 0.25)), sombre);
    antenne.position.set(0, 1.0, -0.36);
    this.lampe = new THREE.Mesh(boule(0.05), mat('lampeChien', () => new THREE.MeshBasicMaterial({ color: 0x4cc9f0 })));
    this.lampe.position.set(0, 1.14, -0.36);
    this.pattes = [];
    for (const [x, z] of [[-0.14, -0.28], [0.14, -0.28], [-0.14, 0.28], [0.14, 0.28]]) {
      const p = articulation(this.racine, x, 0.5, z);
      p.add(new THREE.Mesh(membre(0.45, 0.05), sombre));
      this.pattes.push(p);
    }
    this.racine.add(corps, tete, antenne, this.lampe);
    this.racine.traverse(m => m.isMesh && (m.castShadow = true));
  }
  animer(t, vitesse) {
    this.pattes.forEach((p, i) => (p.rotation.x = Math.sin(t * vitesse + (i % 2 ? Math.PI : 0) + (i > 1 ? 0.5 : 0)) * 0.7));
    this.lampe.material.color.set(Math.floor(t * 6) % 2 ? 0x4cc9f0 : 0xbde8ff);
  }
}
