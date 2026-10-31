// Rendu 3D de Voie libre (Three.js, WebGL) : ciel, lumières, brouillard, voies, décor des quartiers,
// obstacles, pièces, bonus, personnages, effets et caméra. Le monde est dessiné autour du coureur
// (origine flottante) : un point de la course à la distance z se trouve en z3D = -(z - coureur.z).
import * as THREE from '../../lib/three.module.min.js';
import * as TX from './textures.js';
import * as M from './modeles.js';
import { Personnage, ChienRobot } from './personnage.js';
import { construireTroncon, detruire, TRONCON } from './decor.js';
import { QUARTIERS, BONUS } from '../donnees.js';
import { lx, quartierA, RAMPE } from '../parcours.js';
import { bruit } from '../hasard.js';

const VUE = 200;
const tmpC = new THREE.Color(),
  tmpM = new THREE.Matrix4(),
  tmpQ = new THREE.Quaternion(),
  tmpE = new THREE.Euler(),
  tmpV = new THREE.Vector3(),
  UN = new THREE.Vector3(1, 1, 1);
const lisse = (a, b, k) => a + (b - a) * k;
const melangeC = (a, b, t) => tmpC.set(a).lerp(new THREE.Color(b), t).clone();

export class Rendu {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    TX.reglerAnisotropie(Math.min(4, this.renderer.capabilities.getMaxAnisotropy()));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 520);
    this.scene.fog = new THREE.Fog(0xd8ecff, 70, VUE);
    this.qualite = { dpr: Math.min(2, devicePixelRatio || 1), ombres: true, detail: 2 };
    this.monde = new THREE.Group();
    this.scene.add(this.monde);
    this.creerCiel();
    this.creerLumieres();
    this.creerVoies();
    this.creerEffets();
    this.troncons = new Map();
    this.objets = new Map();
    this.bonusM = new Map();
    this.tunnelsM = new Map();
    this.coureur = null;
    this.camEtat = { x: 0, y: 3.2, base: 0, fov: 60, transition: 1, secousse: 0, decalage: 0 };
    // vitrine du menu : planche sous les pieds (boutique) et coureur remonté en haut de l'écran (decalage 0 → 1)
    this.vitrine = { planche: false, decalage: 0 };
    this.t = 0;
    this.taille();
    addEventListener('resize', () => this.taille());
  }

  // ---------- réglages ----------
  reglerQualite(q) {
    Object.assign(this.qualite, q);
    this.renderer.shadowMap.enabled = this.qualite.ombres;
    this.soleil.castShadow = this.qualite.ombres;
    this.taille();
  }
  taille() {
    const l = innerWidth,
      h = innerHeight;
    this.renderer.setPixelRatio(this.qualite.dpr);
    this.renderer.setSize(l, h, false);
    this.camera.aspect = l / h;
    // en portrait, champ de vision plus large pour voir les trois voies
    this.fovBase = l / h < 0.8 ? 68 : 58;
    this.camera.updateProjectionMatrix();
  }

  // ---------- ciel, lumières ----------
  creerCiel() {
    this.cielU = { haut: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, soleilDir: { value: new THREE.Vector3(0.4, 0.25, -1).normalize() }, soleilC: { value: new THREE.Color() }, nuit: { value: 0 } };
    const ciel = new THREE.Mesh(
      new THREE.SphereGeometry(480, 32, 16),
      new THREE.ShaderMaterial({
        uniforms: this.cielU,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `uniform vec3 haut; uniform vec3 horizon; uniform vec3 soleilDir; uniform vec3 soleilC; uniform float nuit; varying vec3 vD;
          void main(){ float h = clamp(vD.y, 0.0, 1.0); vec3 c = mix(horizon, haut, pow(h, 0.55));
            float s = max(dot(vD, soleilDir), 0.0); c += soleilC * (pow(s, 900.0) * 2.0 + pow(s, 12.0) * 0.25 * (1.0 - nuit * 0.5));
            gl_FragColor = vec4(c, 1.0); }`
      })
    );
    ciel.renderOrder = -10;
    this.ciel = ciel;
    this.scene.add(ciel);
    // étoiles
    const n = 500,
      p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = bruit(i) * Math.PI * 2,
        h = 0.08 + bruit(i + 999) * 0.9,
        r = 450;
      p.set([Math.cos(a) * Math.cos(h) * r, Math.sin(h) * r, Math.sin(a) * Math.cos(h) * r], i * 3);
    }
    const ge = new THREE.BufferGeometry();
    ge.setAttribute('position', new THREE.BufferAttribute(p, 3));
    this.etoiles = new THREE.Points(ge, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    this.scene.add(this.etoiles);
    // nuages
    this.nuages = [];
    const mn = new THREE.SpriteMaterial({ map: TX.nuage(), transparent: true, depthWrite: false, fog: false });
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Sprite(mn);
      s.scale.set(70 + bruit(i) * 60, 30 + bruit(i + 5) * 20, 1);
      s.userData = { x: (bruit(i + 2) - 0.5) * 600, y: 70 + bruit(i + 3) * 60, z: -260 - bruit(i + 4) * 120 };
      this.scene.add(s);
      this.nuages.push(s);
    }
  }
  creerLumieres() {
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1.2);
    this.scene.add(this.hemi);
    this.soleil = new THREE.DirectionalLight(0xffffff, 2.2);
    this.soleil.castShadow = true;
    this.soleil.shadow.mapSize.set(1024, 1024);
    const c = this.soleil.shadow.camera;
    c.left = -16;
    c.right = 16;
    c.top = 30;
    c.bottom = -14;
    c.near = 1;
    c.far = 80;
    this.soleil.shadow.bias = -0.0008;
    this.soleil.shadow.normalBias = 0.03;
    this.scene.add(this.soleil, this.soleil.target);
    this.lumiereTunnel = new THREE.PointLight(0xffd9a0, 0, 18, 1.5);
    this.scene.add(this.lumiereTunnel);
    // lumière d'appoint sur le coureur (de face au menu, de dos en course), pour bien le voir même la nuit
    this.appoint = new THREE.DirectionalLight(0xffffff, 0.5);
    this.scene.add(this.appoint, this.appoint.target);
  }

  // ---------- voies ----------
  creerVoies() {
    this.sol = new THREE.Mesh(new THREE.PlaneGeometry(600, 320).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xc9d3df }));
    this.sol.position.set(0, -0.03, -100);
    this.sol.receiveShadow = true;
    this.scene.add(this.sol);
    const tb = TX.ballast().clone();
    tb.needsUpdate = true;
    tb.wrapS = tb.wrapT = THREE.RepeatWrapping;
    tb.repeat.set(1.5, 225);
    this.texBallast = tb;
    this.matBallast = new THREE.MeshLambertMaterial({ map: tb, color: 0xffffff });
    for (let l = 0; l < 3; l++) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 300).rotateX(-Math.PI / 2), this.matBallast);
      b.position.set(lx(l), 0, -90);
      b.receiveShadow = true;
      this.scene.add(b);
    }
    // traverses (instances recalées à chaque image)
    this.nbTraverses = 3 * 170;
    this.traverses = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 0.09, 0.42), new THREE.MeshLambertMaterial({ color: 0x8a7a6a }), this.nbTraverses);
    this.traverses.receiveShadow = true;
    this.scene.add(this.traverses);
    const rail = new THREE.MeshPhongMaterial({ color: 0xb8c2d2, shininess: 80, specular: 0x666666 });
    for (let l = 0; l < 3; l++)
      for (const s of [-0.55, 0.55]) {
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 300), rail);
        r.position.set(lx(l) + s, 0.12, -90);
        r.receiveShadow = true;
        this.scene.add(r);
      }
  }

  // ---------- effets ----------
  creerEffets() {
    // pièces (instances)
    this.nbPieces = 500;
    const gp = new THREE.CylinderGeometry(0.34, 0.34, 0.09, 22).rotateX(Math.PI / 2);
    this.pieces = new THREE.InstancedMesh(gp, new THREE.MeshPhongMaterial({ color: 0xffc83d, emissive: 0x7a4a00, emissiveIntensity: 0.55, shininess: 90, specular: 0xffffff }), this.nbPieces);
    this.pieces.castShadow = true;
    this.scene.add(this.pieces);
    // particules
    this.nbParts = 400;
    this.parts = [];
    const gpa = new THREE.BufferGeometry();
    gpa.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.nbParts * 3), 3));
    gpa.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.nbParts * 3), 3));
    this.points = new THREE.Points(gpa, new THREE.PointsMaterial({ size: 0.35, vertexColors: true, map: TX.halo('#ffffff'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.points.frustumCulled = false;
    this.scene.add(this.points);
    // pluie (traits) et neige (points), autour de la caméra
    const nb = 400,
      gpl = new THREE.BufferGeometry();
    gpl.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nb * 6), 3));
    this.gouttes = Array.from({ length: nb }, (_, i) => [(bruit(i) - 0.5) * 30, bruit(i + 7) * 16, -bruit(i + 13) * 50 + 6, 0.7 + bruit(i + 3) * 0.6]);
    this.pluie = new THREE.LineSegments(gpl, new THREE.LineBasicMaterial({ color: 0xdde6f5, transparent: true, opacity: 0.5, depthWrite: false }));
    this.pluie.frustumCulled = false;
    this.scene.add(this.pluie);
    const gn = new THREE.BufferGeometry();
    gn.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nb * 3), 3));
    this.neige = new THREE.Points(gn, new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, map: TX.halo('#ffffff'), transparent: true, depthWrite: false }));
    this.neige.frustumCulled = false;
    this.scene.add(this.neige);
    // traits de vitesse
    const gv = new THREE.BufferGeometry();
    gv.setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 6), 3));
    this.traits = new THREE.LineSegments(gv, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }));
    this.traits.frustumCulled = false;
    this.scene.add(this.traits);
    // chauves-souris d'Halloween
    this.chauves = [];
    const mc = new THREE.SpriteMaterial({ map: TX.chauveSouris(), transparent: true, fog: false, depthWrite: false });
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Sprite(mc);
      s.scale.set(6, 3, 1);
      s.visible = false;
      this.scene.add(s);
      this.chauves.push(s);
    }
  }
  particules(x, y, z, n, c, { v = 4, haut = 3, duree = 0.6, taille = 1 } = {}) {
    const col = new THREE.Color(c);
    for (let i = 0; i < n; i++) {
      if (this.parts.length >= this.nbParts) this.parts.shift();
      this.parts.push({ x, y, z, vx: (Math.random() - 0.5) * v, vy: haut * (0.5 + Math.random()), vz: (Math.random() - 0.5) * v, v: duree * (0.6 + Math.random() * 0.6), c: col, taille });
    }
  }

  // ---------- nouvelle course ----------
  // vue : { perso, planche, evenement }
  preparer(course, vue) {
    for (const g of this.troncons.values()) {
      this.monde.remove(g);
      detruire(g);
    }
    this.troncons.clear();
    for (const m of this.objets.values()) this.monde.remove(m);
    this.objets.clear();
    for (const m of this.bonusM.values()) this.monde.remove(m);
    this.bonusM.clear();
    for (const m of this.tunnelsM.values()) {
      this.monde.remove(m);
      detruire(m);
    }
    this.tunnelsM.clear();
    this.parts.length = 0;
    this.course = course;
    this.vue = vue;
    if (!this.coureur || this.coureurId != vue.perso.id) {
      if (this.coureur) this.scene.remove(this.coureur.racine);
      this.coureur = new Personnage(vue.perso);
      this.coureurId = vue.perso.id;
      this.scene.add(this.coureur.racine);
    }
    this.coureur.equiperPlanche(vue.planche);
    if (!this.agent) {
      this.agent = new Personnage({ sweat: '#25304d', pantalon: '#25304d', peau: '#d8a47f', cheveux: '#2b1d14', coiffure: 'aucune', accessoire: '#25304d', chaussures: '#1d1d1d' }, { agent: true });
      this.chien = new ChienRobot();
      this.scene.add(this.agent.racine, this.chien.racine);
    }
    this.camEtat.x = course.P.x * 0.7;
    this.camEtat.base = 0;
  }
  // change le personnage ou la planche affichés (boutique)
  habiller(perso, planche) {
    if (!this.course) return;
    this.preparerPerso(perso, planche);
  }
  preparerPerso(perso, planche) {
    if (this.coureurId != perso.id) {
      if (this.coureur) this.scene.remove(this.coureur.racine);
      this.coureur = new Personnage(perso);
      this.coureurId = perso.id;
      this.scene.add(this.coureur.racine);
    }
    this.coureur.equiperPlanche(planche);
    this.vue = { ...this.vue, perso, planche };
  }

  // ---------- palette (quartiers, événements, pluie, tunnels) ----------
  palette(c, z) {
    const q = quartierA(z, c.qFixe >= 0 ? c.qFixe : c.demo ? this.vue.qDemo || 0 : -1),
      A = QUARTIERS[q.a],
      B = QUARTIERS[q.b],
      t = q.t,
      P = {};
    for (const k of ['ciel', 'horizon', 'soleil', 'sol', 'ballast', 'mur']) P[k] = melangeC(A[k], B[k], t);
    P.nuit = A.nuit + (B.nuit - A.nuit) * t;
    // pluie sur certains passages des quartiers qui s'y prêtent (même tirage pour une même course)
    const pl = (i, qi) => (QUARTIERS[qi].pluie && bruit(i * 7.3 + c.graine * 0.001) < 0.4 ? 1 : 0);
    P.pluie = c.demo ? 0 : pl(c.type == 'niveau' ? c.niveau : q.i, q.a) * (1 - t) + pl(c.type == 'niveau' ? c.niveau : q.i + 1, q.b) * t;
    const ev = this.vue.evenement;
    if (ev == 'halloween') {
      P.ciel.lerp(tmpC.set('#3c1a54'), 0.8);
      P.horizon.lerp(tmpC.set('#a8607a'), 0.6);
      P.nuit = Math.max(P.nuit, 0.65);
    } else if (ev == 'hiver') {
      P.horizon.lerp(tmpC.set('#eef3fa'), 0.5);
      P.sol.lerp(tmpC.set('#eef3fa'), 0.6);
      P.mur.set('#fafcff');
    }
    if (P.pluie > 0) {
      P.ciel.lerp(tmpC.set('#7e8a9c'), 0.55 * P.pluie);
      P.horizon.lerp(tmpC.set('#b0b8c6'), 0.5 * P.pluie);
    }
    return P;
  }

  // ---------- image ----------
  // mode : 'menu' (vitrine, caméra de face), 'jeu', 'fin' ; transition : 0 → 1 au départ d'une course
  dessiner(c, dt, mode = 'jeu') {
    this.t += dt;
    const P = c.P,
      ombre = this.ombreTunnel(c, dt);
    // décor : tronçons visibles
    const k0 = Math.floor((P.z - (mode == 'menu' ? 80 : 20)) / TRONCON),
      k1 = Math.floor((P.z + VUE) / TRONCON);
    for (const [k, g] of this.troncons)
      if (k < k0 || k > k1) {
        this.monde.remove(g);
        detruire(g);
        this.troncons.delete(k);
      }
    for (let k = k0; k <= k1; k++)
      if (!this.troncons.has(k)) {
        const g = construireTroncon(k, { graine: c.graine, qFixe: c.qFixe >= 0 ? c.qFixe : c.demo ? this.vue.qDemo || 0 : -1, enTunnel: (z, m) => c.enTunnel(z, m), evenement: this.vue.evenement });
        this.troncons.set(k, g);
        this.monde.add(g);
      }
    for (const g of this.troncons.values()) g.position.z = -(g.userData.z0 - P.z);
    this.majTunnels(c);
    this.majObjets(c);
    this.majPieces(c);
    this.majBonus(c);
    this.majPersonnages(c, dt, mode);
    this.majVoies(P);
    const pal = this.palette(c, P.z + 25);
    this.majAmbiance(pal, ombre, c);
    this.majEffets(c, dt, pal, ombre);
    this.majCamera(c, dt, mode);
    this.renderer.render(this.scene, this.camera);
  }

  ombreTunnel(c, dt) {
    const dedans = c.enTunnel(c.P.z + 2) ? 1 : 0;
    this.ombre = lisse(this.ombre || 0, dedans, 1 - Math.exp(-dt * 5));
    return this.ombre;
  }

  majTunnels(c) {
    const vus = new Set();
    for (const t of c.tunnels) {
      if (t.z0 > c.P.z + VUE + 20) continue;
      vus.add(t);
      if (!this.tunnelsM.has(t)) {
        const q = QUARTIERS[c.quartier(t.z0).a],
          m = M.tunnel(t.z1 - t.z0, q.mur);
        this.tunnelsM.set(t, m);
        this.monde.add(m);
      }
      this.tunnelsM.get(t).position.z = -(t.z0 - c.P.z);
    }
    for (const [t, m] of this.tunnelsM)
      if (!vus.has(t)) {
        this.monde.remove(m);
        detruire(m);
        this.tunnelsM.delete(t);
      }
  }

  majObjets(c) {
    const P = c.P,
      vus = new Set();
    for (const o of c.objs) {
      if (o.z0 > P.z + VUE || o.z1 < P.z - 15) continue;
      let m = this.objets.get(o);
      if (!m) {
        m = this.creerObjet(o);
        this.objets.set(o, m);
        this.monde.add(m);
      }
      vus.add(o);
      if (o.casse) {
        if (m.visible) {
          m.visible = false;
          this.eclats(o, c);
        }
        continue;
      }
      m.position.set(o.t == 'drone' ? c.droneX(o) : lx(o.l), o.y0 || 0, -(o.z0 - P.z));
      if (o.t == 'drone') {
        const u = m.userData.corps;
        u.position.y = 1.38 + Math.sin(this.t * 6 + o.ph) * 0.05;
        u.rotation.z = Math.sin(this.t * 1.6 + o.ph) * 0.18;
      } else if (o.t == 'pad') m.userData.texture.offset.y = -this.t * 2;
    }
    for (const [o, m] of this.objets)
      if (!vus.has(o)) {
        this.monde.remove(m);
        this.objets.delete(o);
      }
  }
  creerObjet(o) {
    if (o.t == 'train') {
      if (o.plat) return M.plat(o);
      const g = new THREE.Group(),
        w = M.wagon(o);
      if (o.ramp) {
        g.add(M.rampe());
        w.position.z = -RAMPE;
      }
      g.add(w);
      return g;
    }
    if (o.t == 'bas' || o.t == 'haut') return M.barriere(o.t);
    if (o.t == 'caisse') return M.caisse();
    if (o.t == 'drone') return M.drone();
    if (o.t == 'pad') return M.accelerateur();
    if (o.t == 'arrivee') return M.arrivee();
    return new THREE.Group();
  }
  eclats(o, c) {
    const x = o.t == 'drone' ? c.droneX(o) : lx(o.l),
      z = -(Math.max(o.z0, c.P.z + 0.5) - c.P.z),
      couleurs = { train: M.COULEURS_TRAIN[o.c] || '#ff5a5f', caisse: '#c98a4a', drone: '#4a5068', bas: '#ff3b4a', haut: '#4361ee' };
    this.particules(x, (o.y0 || 0) + 0.8, z, 26, couleurs[o.t] || '#ffffff', { v: 9, haut: 6, duree: 0.8, taille: 1.6 });
  }

  majPieces(c) {
    const P = c.P;
    let n = 0;
    for (const p of c.listePieces) {
      if (p.pris || p.z > P.z + VUE - 20 || p.z < P.z - 8 || n >= this.nbPieces) continue;
      tmpQ.setFromEuler(tmpE.set(0, this.t * 3 + p.z * 0.4, 0));
      tmpM.compose(tmpV.set(p.x, p.y, -(p.z - P.z)), tmpQ, UN);
      this.pieces.setMatrixAt(n++, tmpM);
    }
    this.pieces.count = n;
    this.pieces.instanceMatrix.needsUpdate = true;
  }

  majBonus(c) {
    const P = c.P,
      vus = new Set();
    for (const b of c.listeBonus) {
      if (b.pris || b.z > P.z + VUE - 20 || b.z < P.z - 8) continue;
      let m = this.bonusM.get(b);
      if (!m) {
        const ev = c.profil.evenement;
        m =
          b.k == 'lettre'
            ? M.bonus('lettre', '#ffb703', c.profil.lettreAttendue() || '?')
            : b.k == 'jeton'
              ? M.bonus('jeton', ev ? ev.couleur : '#ff8c2e', ev ? ev.jeton : 'citrouille')
              : M.bonus(b.k, BONUS[b.k].c);
        this.bonusM.set(b, m);
        this.monde.add(m);
      }
      vus.add(b);
      m.position.set(b.x, b.y + Math.sin(this.t * 3 + b.z) * 0.15, -(b.z - P.z));
      m.rotation.y = this.t * 1.5;
    }
    for (const [b, m] of this.bonusM)
      if (!vus.has(b)) {
        this.monde.remove(m);
        this.bonusM.delete(b);
      }
  }

  majPersonnages(c, dt, mode) {
    const P = c.P,
      C = this.coureur;
    C.racine.position.set(P.x, P.y, 0);
    C.animer({
      dt,
      t: this.t,
      phase: P.course,
      sol: P.sol || mode == 'menu',
      vy: P.vy,
      glisse: P.glisse > 0 ? 0.62 - P.glisse : 0,
      figure: P.figure,
      planche: c.planche > 0 || (mode == 'menu' && this.vitrine.planche),
      vol: c.vole(),
      bulle: !!c.bonus.bulle,
      chute: c.mode == 'fin' && c.raison == 'choc' ? Math.min(1, c.fin * 3) : 0,
      trebuche: c.alerte > 3 ? (c.alerte - 3) * 2 : 0,
      inclinaison: lx(P.voie) - P.x,
      menu: mode == 'menu'
    });
    C.racine.visible = !(c.invu > 0 && c.mode == 'jeu' && Math.floor(this.t * 14) % 2);
    // l'agent et son chien, derrière le coureur, décalés pour ne pas le cacher
    const vis = c.poursuite > 0.02 && mode != 'menu' && !c.demo;
    this.agent.racine.visible = this.chien.racine.visible = vis;
    if (vis) {
      const z = 2.6 + (1 - c.poursuite) * 6,
        cote = P.x > 0.5 ? -1 : 1;
      this.agent.racine.position.set(P.x + cote * 1.1, 0, z);
      this.agent.animer({ dt, t: this.t, phase: P.course * 1.05, sol: true, vy: 0, glisse: 0, figure: 0, inclinaison: 0 });
      this.chien.racine.position.set(P.x - cote * 1.1, 0, z + 0.4);
      this.chien.animer(this.t, 16);
    }
  }

  majVoies(P) {
    const pas = 1.6,
      base = Math.floor((P.z - 60) / pas) * pas;
    let i = 0;
    for (let n = 0; n < this.nbTraverses / 3; n++) {
      const z = -(base + n * pas - P.z);
      for (let l = 0; l < 3; l++) {
        tmpM.makeTranslation(lx(l), 0.04, z);
        this.traverses.setMatrixAt(i++, tmpM);
      }
    }
    this.traverses.instanceMatrix.needsUpdate = true;
    this.texBallast.offset.y = ((P.z * 225) / 300) % 1;
  }

  majAmbiance(pal, ombre, c) {
    const nuit = pal.nuit;
    this.cielU.haut.value.copy(pal.ciel);
    this.cielU.horizon.value.copy(pal.horizon);
    this.cielU.soleilC.value.copy(pal.soleil);
    this.cielU.nuit.value = nuit;
    const brume = pal.horizon.clone().lerp(tmpC.set('#14161f'), 0.85 * ombre);
    this.scene.fog.color.copy(brume);
    this.scene.fog.near = lisse(70, 25, ombre);
    this.scene.fog.far = lisse(VUE, 110, ombre);
    this.hemi.color.copy(pal.ciel).lerp(tmpC.set('#ffffff'), 0.55);
    this.hemi.groundColor.copy(pal.sol);
    this.hemi.intensity = (1.25 - 0.55 * nuit) * (1 - 0.55 * ombre);
    this.soleil.color.copy(pal.soleil);
    this.soleil.intensity = (2.4 - 1.9 * nuit) * (1 - 0.85 * ombre) * (1 - 0.45 * pal.pluie);
    this.lumiereTunnel.intensity = 30 * ombre;
    this.etoiles.material.opacity = Math.max(0, nuit - 0.4) * 1.6 * (1 - ombre);
    this.sol.material.color.copy(pal.sol);
    this.matBallast.color.copy(pal.ballast).lerp(tmpC.set('#ffffff'), 0.25);
    for (const n of this.nuages) n.material.opacity = 0.9 * (1 - nuit * 0.75);
    this.renderer.toneMappingExposure = 1.05 - 0.15 * nuit;
    this.palCourante = pal;
  }

  majEffets(c, dt, pal, ombre) {
    const P = c.P;
    // particules
    const pos = this.points.geometry.attributes.position,
      col = this.points.geometry.attributes.color;
    let n = 0;
    for (const q of this.parts) {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.z += q.vz * dt + c.v * dt; // le monde défile vers la caméra
      q.vy -= 12 * dt;
      q.v -= dt;
    }
    this.parts = this.parts.filter(q => q.v > 0);
    for (const q of this.parts) {
      pos.setXYZ(n, q.x, q.y, q.z);
      col.setXYZ(n, q.c.r * Math.min(1, q.v * 3), q.c.g * Math.min(1, q.v * 3), q.c.b * Math.min(1, q.v * 3));
      n++;
    }
    this.points.geometry.setDrawRange(0, n);
    pos.needsUpdate = col.needsUpdate = true;
    // pluie et neige autour de la caméra, pas dans les tunnels
    const ev = this.vue.evenement,
      kp = pal.pluie * (1 - ombre),
      cx = this.camera.position.x;
    this.pluie.visible = kp > 0.05 && this.qualite.detail > 0;
    if (this.pluie.visible) {
      const a = this.pluie.geometry.attributes.position;
      this.gouttes.forEach((g, i) => {
        const y = (((g[1] - this.t * 22 * g[3]) % 16) + 16) % 16,
          z = (((g[2] + this.t * c.v * 0.3) % 50) + 50) % 50 - 44;
        a.setXYZ(i * 2, cx + g[0], y, z);
        a.setXYZ(i * 2 + 1, cx + g[0] - 0.08, y + 0.7, z + 0.25);
      });
      a.needsUpdate = true;
      this.pluie.material.opacity = 0.45 * kp;
    }
    this.neige.visible = ev == 'hiver' && ombre < 0.9;
    if (this.neige.visible) {
      const a = this.neige.geometry.attributes.position;
      this.gouttes.forEach((g, i) => {
        const y = (((g[1] - this.t * 1.6 * g[3]) % 16) + 16) % 16;
        a.setXYZ(i, cx + g[0] + Math.sin(this.t * g[3] + i) * 0.6, y, (((g[2] + this.t * c.v * 0.6) % 50) + 50) % 50 - 44);
      });
      a.needsUpdate = true;
    }
    // traits de vitesse (turbo, élan, jetpack)
    const kv = c.turbo > 0 || c.elan > 0 ? 1 : c.bonus.jetpack ? 0.6 : 0;
    this.traits.visible = kv > 0;
    if (kv) {
      const a = this.traits.geometry.attributes.position;
      for (let i = 0; i < 60; i++) {
        const an = bruit(i) * Math.PI * 2,
          r = 3 + bruit(i + 9) * 6,
          z = (((bruit(i + 3) * 40 + this.t * 90) % 40) + 40) % 40 - 36;
        const x = cx + Math.cos(an) * r,
          y = P.y + 1.5 + Math.sin(an) * r * 0.7;
        a.setXYZ(i * 2, x, y, z);
        a.setXYZ(i * 2 + 1, x, y, z + 3);
      }
      a.needsUpdate = true;
      this.traits.material.opacity = 0.35 * kv;
    }
    // chauves-souris
    this.chauves.forEach((s, i) => {
      s.visible = ev == 'halloween';
      if (!s.visible) return;
      s.position.set(cx + Math.sin(this.t * 0.3 + i * 2) * 40, 45 + Math.sin(this.t * 0.7 + i) * 8 + i * 4, -120 - i * 15);
      s.scale.x = 6 * (0.35 + Math.abs(Math.sin(this.t * 10 + i)));
    });
    // nuages qui suivent la caméra de loin
    for (const s of this.nuages) {
      const u = s.userData;
      s.position.set(((((u.x - this.t * 2 + 300) % 600) + 600) % 600) - 300 + cx * 0.5, u.y + P.y, u.z);
    }
    this.ciel.position.set(this.camera.position.x, 0, this.camera.position.z);
    this.etoiles.position.copy(this.ciel.position);
    this.lumiereTunnel.position.set(P.x, 4.5, -3);
  }

  majCamera(c, dt, mode) {
    const P = c.P,
      E = this.camEtat,
      k = 1 - Math.exp(-dt * 7);
    if (P.sol || P.y < E.base || c.vole()) E.base = P.y;
    E.x = lisse(E.x, P.x * 0.7, k);
    const sousTunnel = c.enTunnel(P.z + 1) || c.enTunnel(P.z, 4);
    E.y = lisse(E.y, Math.min(E.base + 3.9, sousTunnel ? 5.0 : 99), 1 - Math.exp(-dt * (sousTunnel ? 8 : 4)));
    const vit = Math.min(1, Math.max(0, (c.v - 15) / 17));
    E.fov = lisse(E.fov, this.fovBase + vit * 7 + (c.turbo > 0 || c.elan > 0 ? 6 : 0), k);
    // caméra de jeu (de dos) et de vitrine (de face), mélangées pendant la transition du départ
    const jeu = { p: [E.x, E.y, 7.4], v: [E.x * 0.85, E.base + 0.4, -14] },
      d = (E.decalage = lisse(E.decalage, this.vitrine.decalage, k)),
      menu = { p: [P.x + 1.2 - d * 0.5, 2.0 + d * 0.4, -6.4 - d * 1.6], v: [P.x + 0.25 - d * 0.2, 1.25 - d * 1.75, 0] };
    if (mode == 'menu') E.transition = 0;
    else E.transition = Math.min(1, E.transition + dt / 1.1);
    const lisseT = x => (x = Math.min(1, Math.max(0, x))) * x * (3 - 2 * x),
      s = lisseT(E.transition),
      // la caméra tourne d'abord autour du coureur (par sa droite) en le regardant, puis le regard file vers l'horizon
      u = lisseT(E.transition / 0.7),
      w = lisseT((E.transition - 0.55) / 0.45),
      aM = Math.atan2(menu.p[0] - P.x, menu.p[2]),
      aJ = Math.atan2(jeu.p[0] - P.x, jeu.p[2]),
      a = lisse(aM, aJ, u),
      milieu = Math.sin(u * Math.PI),
      r = lisse(Math.hypot(menu.p[0] - P.x, menu.p[2]), Math.hypot(jeu.p[0] - P.x, jeu.p[2]), u) * (1 - 0.3 * milieu);
    const p = [P.x + Math.sin(a) * r, lisse(menu.p[1], jeu.p[1], u) + milieu * 1.8, Math.cos(a) * r],
      v = menu.v.map((x, i) => lisse(x, jeu.v[i], w));
    if (mode == 'fin' && c.raison == 'choc') {
      p[2] += Math.min(1, c.fin) * 2.5;
      p[1] += Math.min(1, c.fin) * 1.2;
    }
    E.secousse = Math.max(0, E.secousse - dt);
    const sec = E.secousse * 0.6;
    this.camera.position.set(p[0] + (Math.random() - 0.5) * sec, p[1] + (Math.random() - 0.5) * sec, p[2]);
    this.camera.lookAt(v[0], v[1], v[2]);
    this.camera.fov = mode == 'menu' ? 42 : lisse(42, E.fov, s);
    this.camera.updateProjectionMatrix();
    // le soleil (et ses ombres) suit le coureur
    this.soleil.position.set(P.x + 9, P.y + 22, 8);
    this.soleil.target.position.set(P.x, P.y, -10);
    const enMenu = 1 - s;
    this.appoint.position.set(P.x + 1, P.y + 3, lisse(4, -6, enMenu));
    this.appoint.target.position.set(P.x, P.y + 1, 0);
    this.appoint.intensity = lisse(0.35 + 0.5 * (this.palCourante ? this.palCourante.nuit : 0), 1.3, enMenu);
  }

  secouer(f = 0.4) {
    this.camEtat.secousse = Math.max(this.camEtat.secousse, f);
  }
  depart() {
    this.camEtat.transition = 0;
  }

  // position à l'écran d'un point de la course (textes flottants)
  projeter(x, y, z) {
    tmpV.set(x, y, -(z - this.course.P.z)).project(this.camera);
    return { x: ((tmpV.x + 1) / 2) * innerWidth, y: ((1 - tmpV.y) / 2) * innerHeight, devant: tmpV.z < 1 };
  }
}

