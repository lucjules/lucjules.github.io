// Simulation d'une course : coureur, obstacles, pièces, bonus, physique et score. Aucun affichage ici :
// la course signale ce qui se passe (course.ecouter(f) reçoit f(type, données)) et le rendu, le son,
// l'interface et la progression réagissent. Le profil du joueur (améliorations, planches, clés…) est
// passé à la création, ce qui permet de tester la course seule (outils/tester-voie-libre.js).
import { alea } from './hasard.js';
import { BONUS, QUARTIERS, NIVEAUX } from './donnees.js';
import { troncon, vitesse, quartierA, quartierIndex, lx, DEMI, H_TRAIN, H_PLAT, H_CAISSE, RAMPE } from './parcours.js';

const LARG = 0.35; // demi-largeur du coureur
const H_DEBOUT = 1.5;
const H_GLISSE = 0.7;
const GRAVITE = 40;
const SAUT = 10.4; // hauteur atteinte ≈ 1,35
const SUPER_SAUT = 16.7; // ≈ 3,5 : assez pour monter sur les wagons
const H_VOL = 8; // hauteur de vol en jetpack
const DUREE_GLISSE = 0.62;
const DUREE_DEFI = 60;
export const VUE = 200; // le parcours est généré jusque-là devant le coureur

// profil neutre (tests, démonstration) : aucune amélioration, rien en réserve
const PROFIL_VIDE = {
  multi: 0,
  dureeBonus: k => BONUS[k].base,
  planche: { pouvoir: null },
  prendrePlanche: () => false,
  prendreElan: () => false,
  payerCles: () => false,
  cles: () => 0,
  gagner: () => {},
  lettreAttendue: () => null,
  evenement: null
};

export class Course {
  constructor({ type = 'libre', niveau = -1, graine = (Math.random() * 2 ** 32) >>> 0, profil = {}, demo = false } = {}) {
    this.profil = { ...PROFIL_VIDE, ...profil };
    this.type = type;
    this.niveau = niveau;
    this.demo = demo;
    this.graine = graine;
    this.ecouteurs = [];
    this.mode = demo ? 'demo' : 'jeu'; // jeu, continuer, fin, demo
    Object.assign(this, { t: 0, dist: 0, v: 0, score: 0, pieces: 0, mult: 1, bonus: {}, planche: 0, turbo: 0, elan: 0, elanUtilise: false });
    Object.assign(this, { invu: 0, alerte: 0, poursuite: demo ? 0 : 1, trebuches: 0, revives: 0, compteurs: {}, raison: '', fin: 0, combo: 0, derniereFigure: -9 });
    this.P = { voie: 1, voieAvant: 1, x: 0, y: 0, z: 0, vy: 0, gy: 0, sol: true, glisse: 0, tampon: 0, coyote: 0, course: 0, ecrase: false, figure: 0 };
    this.objs = [];
    this.listePieces = [];
    this.listeBonus = [];
    this.tunnels = [];
    this.qFixe = -1;
    this.depart = 0;
    this.long = 0;
    this.temps = 0;
    if (type == 'niveau') {
      const n = NIVEAUX[niveau];
      this.graine = n.graine;
      this.long = n.long;
      this.depart = n.depart;
      this.qFixe = n.q;
    } else if (type == 'defi') {
      this.depart = 600;
      this.temps = DUREE_DEFI;
    }
    this.r = alea(this.graine);
    this.rStruct = alea(this.graine ^ 0x51ed27);
    this.genZ = 45;
    this.tunZ = 260;
    this.zLettre = 300 + this.r() * 400;
    this.zJeton = 80;
    this.qVu = quartierIndex(0, this.qFixe);
    this.generer();
  }

  ecouter(f) {
    this.ecouteurs.push(f);
    return this;
  }
  signal(type, d = {}) {
    for (const f of this.ecouteurs) f(type, d);
  }
  // compteur d'une action pour les missions et les trophées ; absolu : valeur de la course (distance, score)
  compter(t, v = 1, absolu) {
    if (this.demo) return;
    this.compteurs[t] = absolu ? v : (this.compteurs[t] || 0) + v;
    this.signal('compteur', { t, v, absolu, total: this.compteurs[t] });
  }

  // ---------- génération ----------
  generer() {
    const P = this.P;
    while (!this.demo && this.genZ < P.z + VUE) {
      if (this.type == 'niveau' && this.genZ > this.long - 40) {
        this.objs.push({ t: 'arrivee', l: 1, z0: this.long, z1: this.long + 1, y0: 0 });
        this.genZ = 1e9;
        break;
      }
      const t = troncon(this.r, this.genZ, this.genZ + this.depart);
      this.objs.push(...t.o);
      this.listePieces.push(...t.p);
      this.listeBonus.push(...t.b);
      const voie = () => lx(t.libres[Math.floor(this.r() * t.libres.length)]);
      // chasse aux lettres (course libre) et jetons d'événement
      if (this.type == 'libre' && this.genZ > this.zLettre && t.libres.length && this.profil.lettreAttendue()) {
        this.listeBonus.push({ k: 'lettre', x: voie(), y: 1, z: t.z + t.pas * 0.78 });
        this.zLettre = this.genZ + 700 + this.r() * 500;
      }
      if (this.profil.evenement && this.genZ > this.zJeton && t.libres.length) {
        this.listeBonus.push({ k: 'jeton', x: voie(), y: 1, z: t.z + t.pas * 0.86 });
        this.zJeton = this.genZ + 140 + this.r() * 120;
      }
      this.genZ = t.fin;
    }
    // tunnels (ils comptent pour le jeu : leur plafond arrête les sauts et le jetpack)
    while (!this.demo && this.tunZ < P.z + VUE + 40) {
      const q = QUARTIERS[quartierIndex(this.tunZ, this.qFixe)];
      if (q.decor.includes('tunnel') && this.rStruct() < 0.55) {
        const L = 50 + this.rStruct() * 50;
        this.tunnels.push({ z0: this.tunZ, z1: this.tunZ + L });
        this.tunZ += L + 300 + this.rStruct() * 300;
      } else this.tunZ += 200 + this.rStruct() * 200;
    }
  }
  nettoyer() {
    const z = this.P.z - 12;
    this.objs = this.objs.filter(o => o.z1 > z && !o.efface);
    this.listePieces = this.listePieces.filter(c => !c.pris && c.z > z);
    this.listeBonus = this.listeBonus.filter(b => !b.pris && b.z > z);
    this.tunnels = this.tunnels.filter(b => b.z1 > z);
  }

  // ---------- outils ----------
  enTunnel(z, marge = 0) {
    return this.tunnels.some(t => z >= t.z0 - marge && z <= t.z1);
  }
  hauteurVol(z) {
    return this.enTunnel(z, 18) ? 3.6 : H_VOL;
  }
  vole() {
    return !!this.bonus.jetpack || this.elan > 0;
  }
  droneX(o) {
    return lx(o.la) + (lx(o.lb) - lx(o.la)) * (0.5 - 0.5 * Math.cos(this.t * 1.6 + o.ph));
  }
  centre(o) {
    return o.t == 'drone' ? this.droneX(o) : lx(o.l);
  }
  quartier(z = this.P.z) {
    return quartierA(z, this.qFixe);
  }
  dureePlanche() {
    return this.profil.planche.pouvoir == 'duree' ? 45 : 30;
  }

  // hauteur du sol sous le coureur : 0, une rampe ou un toit (seulement si on arrive d'en haut)
  sol(x, z, y0) {
    let g = 0;
    for (const o of this.objs) {
      if (o.t != 'train' || o.casse || z < o.z0 || z > o.z1 || Math.abs(x - lx(o.l)) > DEMI) continue;
      const rampe = o.ramp && z < o.z0 + RAMPE,
        h = rampe ? (H_TRAIN * (z - o.z0)) / RAMPE : o.plat ? H_PLAT : H_TRAIN;
      if (y0 >= h - (rampe ? 0.7 : 0.45)) g = Math.max(g, h);
    }
    return g;
  }

  // ---------- un pas de simulation ----------
  pas(h) {
    const P = this.P,
      x0 = P.x,
      y0 = P.y,
      sol0 = P.sol;
    P.z += this.v * h;
    P.course += this.v * h;
    if (!this.demo) {
      this.dist += this.v * h;
      this.score += this.v * h * this.mult;
    }
    const tx = lx(P.voie),
      m = 15 * h,
      dx = tx - P.x;
    P.x += Math.abs(dx) <= m ? dx : Math.sign(dx) * m;
    for (const o of this.objs)
      if (o.vit) {
        if (!o.actif && o.z0 - P.z < 110) o.actif = true;
        if (o.actif) {
          o.z0 -= o.vit * h;
          o.z1 -= o.vit * h;
        }
      }
    if (this.vole()) {
      // en vol : on monte en douceur à la hauteur du jetpack (plus bas sous les tunnels)
      P.vy = (this.hauteurVol(P.z) - P.y) * 5;
      P.y += P.vy * h;
      P.sol = false;
      P.gy = this.sol(P.x, P.z, 99);
    } else {
      P.vy -= GRAVITE * h;
      P.y += P.vy * h;
      const g = this.sol(P.x, P.z, y0);
      P.gy = g;
      if (P.y <= g) {
        if (!P.sol) this.atterrir();
        P.y = g;
        P.vy = 0;
        P.sol = true;
        P.coyote = 0.1;
      } else if (P.y > g + 0.05) P.sol = false;
      if (P.y > 4.3 && this.enTunnel(P.z)) {
        P.y = 4.3; // plafond du tunnel
        P.vy = Math.min(P.vy, 0);
      }
    }
    if (P.sol && P.tampon > 0) this.sauter();
    if (this.demo) return;
    if (P.sol && sol0 && P.y > 2.2) this.compter('toits', this.v * h);
    if (!this.vole()) this.collisions(x0);
    if (this.mode == 'jeu') {
      this.ramasser(h);
      this.accelerateurs();
    }
  }

  atterrir() {
    const P = this.P;
    this.signal('atterrissage', { fort: P.vy < -8 });
    if (P.figure > 0) {
      // figure réussie sur la planche ; enchaînées, elles rapportent de plus en plus
      P.figure = 0;
      this.combo = this.t - this.derniereFigure < 3 ? Math.min(10, this.combo + 1) : 1;
      this.derniereFigure = this.t;
      const g = 50 * this.combo * this.mult;
      this.score += g;
      this.compter('figures');
      this.signal('figure', { combo: this.combo, gain: g });
    }
    if (P.ecrase) {
      // écrasement : onde de choc, et les caisses juste dessous se brisent
      P.ecrase = false;
      this.signal('ecrase');
      for (const o of this.objs)
        if (o.t == 'caisse' && !o.casse && Math.abs(lx(o.l) - P.x) < 1.2 && o.z0 < P.z + 2 && o.z1 > P.z - 1 && Math.abs(o.y0 - P.y) < 0.9) this.casserCaisse(o);
    }
  }

  collisions(x0) {
    const P = this.P,
      hp = P.glisse > 0 ? H_GLISSE : H_DEBOUT;
    for (const o of this.objs) {
      if (o.casse || o.t == 'pad' || o.t == 'arrivee' || P.z + 0.3 < o.z0 || P.z - 0.3 > o.z1) continue;
      const c = this.centre(o),
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
      if (this.turbo > 0) {
        this.casser(o);
        continue;
      }
      if (o.t == 'caisse' && P.ecrase) {
        this.casserCaisse(o);
        continue;
      }
      // de côté si, juste avant, le coureur n'était pas dans la largeur de l'obstacle
      if (o.t != 'drone' && Math.abs(x0 - c) >= demi + LARG - 1e-6) this.trebucher(x0);
      else this.choc(o);
      return;
    }
    // drones passés en glissant dessous
    for (const o of this.objs)
      if (o.t == 'drone' && !o.passe && !o.casse && o.z1 < P.z - 0.3 && o.z1 > P.z - 3 && Math.abs(this.droneX(o) - P.x) < 1.1) {
        o.passe = true;
        this.compter('drones');
      }
  }

  casser(o) {
    o.casse = true;
    const g = 20 * this.mult;
    this.score += g;
    this.signal('casse', { o, gain: g });
  }

  casserCaisse(o) {
    o.casse = true;
    this.compter('caisses');
    const t = Math.random();
    let recompense;
    if (t < 0.05) {
      this.profil.gagner({ coffres: 1 });
      recompense = { coffre: 1 };
    } else if (t < 0.15) {
      this.profil.gagner({ cles: 1 });
      recompense = { cle: 1 };
    } else if (t < 0.42) {
      const k = Object.keys(BONUS)[Math.floor(Math.random() * Object.keys(BONUS).length)];
      this.activerBonus(k);
      recompense = { bonus: k };
    } else {
      const n = 10 + Math.floor(Math.random() * 16);
      this.pieces += n;
      this.score += 5 * n * this.mult;
      this.compter('pieces', n);
      recompense = { pieces: n };
    }
    this.signal('caisse', { o, recompense });
  }

  trebucher(x0) {
    const P = this.P;
    P.voie = P.voieAvant;
    P.x = x0;
    if (this.invu > 0) return;
    this.trebuches++;
    this.signal('trebuche');
    if (this.alerte > 0) {
      if (this.proteger()) return;
      return this.perdu();
    }
    this.alerte = 3.5;
    this.poursuite = 1;
    this.signal('alerte');
  }

  // bulle puis planche : chacune encaisse un choc à la place du coureur
  proteger(o) {
    let quoi;
    if (this.bonus.bulle) {
      delete this.bonus.bulle;
      quoi = 'bulle';
    } else if (this.planche > 0) {
      this.planche = 0;
      quoi = 'planche';
    } else return false;
    if (o) o.casse = true;
    this.invu = 1;
    this.alerte = 0;
    this.signal('protection', { quoi, o });
    return true;
  }

  choc(o) {
    if (this.invu > 0) return;
    if (this.proteger(o)) return;
    this.perdu();
  }

  // course perdue : on peut continuer avec des clés (sauf au défi du jour)
  perdu() {
    if (this.mode != 'jeu') return;
    this.signal('choc');
    const cout = 2 ** this.revives;
    if (this.type != 'defi' && this.profil.cles() >= cout) {
      this.mode = 'continuer';
      this.compte = 5;
      this.signal('continuer', { cout });
      return;
    }
    this.terminer('choc');
  }

  continuer() {
    const cout = 2 ** this.revives,
      P = this.P;
    if (this.mode != 'continuer' || !this.profil.payerCles(cout)) return false;
    this.revives++;
    // on dégage la voie devant le coureur et il repart protégé quelques instants
    this.objs = this.objs.filter(o => o.t == 'pad' || o.t == 'arrivee' || o.z1 <= P.z - 3 || o.z0 >= P.z + 35);
    Object.assign(this, { invu: 2, alerte: 0, poursuite: 0, mode: 'jeu' });
    P.y = this.sol(P.x, P.z, 99);
    P.vy = 0;
    P.voieAvant = P.voie;
    this.signal('repart');
    return true;
  }

  ramasser(h) {
    const P = this.P,
      hp = P.glisse > 0 ? H_GLISSE : H_DEBOUT,
      aimant = !!this.bonus.aimant || (this.planche > 0 && this.profil.planche.pouvoir == 'aimant'),
      vol = this.vole(),
      k = Math.min(1, 16 * h);
    for (const c of this.listePieces) {
      if (c.pris) continue;
      const dz = c.z - P.z;
      if (dz < -2 || dz > 30) continue;
      if (aimant && dz < 18 && Math.abs(c.y - P.y) < 4) c.vol = true;
      if (c.vol) {
        // attirée : elle suit aussi l'avancée du coureur, sinon elle resterait à la traîne
        c.x += (P.x - c.x) * k;
        c.y += (P.y + 0.8 - c.y) * k;
        c.z += (P.z - c.z) * k + this.v * h;
        if (Math.hypot(c.x - P.x, c.y - P.y - 0.8, c.z - P.z) < 0.8) this.prendre(c);
      } else if (Math.abs(c.x - P.x) < (vol ? 1.3 : 0.9) && Math.abs(dz) < 0.9 && c.y > P.y - 0.4 && c.y < P.y + hp + 0.4) this.prendre(c);
    }
    for (const b of this.listeBonus)
      if (!b.pris && Math.abs(b.x - P.x) < 1.1 && Math.abs(b.z - P.z) < 1.1 && b.y > P.y - 0.6 && b.y < P.y + hp + 0.6) {
        b.pris = true;
        if (b.k == 'lettre') this.signal('lettre');
        else if (b.k == 'jeton') this.signal('jeton');
        else {
          this.activerBonus(b.k);
          this.compter('bonus');
        }
      }
  }

  prendre(c) {
    c.pris = true;
    this.pieces++;
    this.score += 5 * this.mult;
    this.compter('pieces');
    this.signal('piece', { c });
  }

  activerBonus(k) {
    this.bonus[k] = this.profil.dureeBonus(k);
    this.signal('bonus', { k });
    if (k == 'jetpack') this.traineePieces(this.bonus[k], this.v);
  }

  // traînée de pièces dans le ciel (jetpack, élan), qui change de voie de temps en temps
  traineePieces(duree, v) {
    const P = this.P;
    let l = P.voie;
    for (let z = P.z + 14; z < P.z + 12 + v * duree; z += 2.4) {
      if (Math.random() < 0.06) l = Math.max(0, Math.min(2, l + (Math.random() < 0.5 ? -1 : 1)));
      this.listePieces.push({ x: lx(l), y: this.hauteurVol(z) + 0.6, z });
    }
  }

  // accélérateurs au sol : élan de vitesse, et les obstacles traversés se brisent
  accelerateurs() {
    const P = this.P;
    if (!P.sol || P.y > 0.1) return;
    for (const o of this.objs)
      if (o.t == 'pad' && !o.pris && P.z >= o.z0 && P.z <= o.z1 && Math.abs(P.x - lx(o.l)) < 1) {
        o.pris = true;
        if (this.turbo <= 0) this.compter('pads');
        this.turbo = 2.4;
        this.signal('turbo');
      }
  }

  // esquive de justesse : changer de voie juste avant un obstacle qui aurait touché
  justesse(l) {
    if (this.demo || this.vole()) return;
    const P = this.P,
      hp = P.glisse > 0 ? H_GLISSE : H_DEBOUT;
    for (const o of this.objs) {
      if (o.casse || o.frole || o.l != l || o.ramp || !['train', 'bas', 'haut', 'caisse'].includes(o.t)) continue;
      const dz = o.z0 - P.z;
      if (dz < 0.4 || dz > (this.v + (o.vit || 0)) * 0.3) continue;
      let bas = o.y0 || 0;
      const haut = o.t == 'train' ? (o.plat ? H_PLAT : H_TRAIN) : o.t == 'bas' ? bas + 0.65 : o.t == 'caisse' ? bas + H_CAISSE : 1.75;
      if (o.t == 'haut') bas = 1.0;
      if (P.y >= haut - 0.05 || P.y + hp <= bas) continue;
      o.frole = true;
      const g = 25 * this.mult;
      this.score += g;
      this.compter('esquives');
      this.signal('justesse', { gain: g, x: lx(l) });
      return;
    }
  }

  // ---------- commandes ----------
  gauche() {
    const P = this.P;
    if (this.mode != 'jeu' || P.voie == 0) return;
    P.voieAvant = P.voie;
    P.voie--;
    this.justesse(P.voieAvant);
    this.compter('voies');
    this.signal('voie', { sens: -1 });
  }
  droite() {
    const P = this.P;
    if (this.mode != 'jeu' || P.voie == 2) return;
    P.voieAvant = P.voie;
    P.voie++;
    this.justesse(P.voieAvant);
    this.compter('voies');
    this.signal('voie', { sens: 1 });
  }
  sauter() {
    const P = this.P;
    if (this.mode != 'jeu' || this.vole()) return;
    if (P.sol || P.coyote > 0) {
      P.vy = this.bonus.saut ? SUPER_SAUT : this.bonus.bulle ? SAUT * 1.2 : this.planche > 0 && this.profil.planche.pouvoir == 'saut' ? SAUT * 1.25 : SAUT;
      P.sol = false;
      P.coyote = 0;
      P.glisse = 0;
      P.tampon = 0;
      P.ecrase = false;
      if (this.planche > 0) P.figure = 0.001; // sur la planche, chaque saut est une figure
      this.compter('sauts');
      this.signal('saut');
    } else P.tampon = 0.15; // appui un peu trop tôt : on saute dès l'atterrissage
  }
  glisser() {
    const P = this.P;
    if (this.mode != 'jeu' || this.vole()) return;
    P.glisse = DUREE_GLISSE;
    P.tampon = 0;
    if (!P.sol) {
      P.vy = Math.min(P.vy, -26); // en l'air : redescente immédiate, qui écrase ce qu'il y a dessous
      P.ecrase = true;
    }
    this.compter('glisses');
    this.signal('glisse');
  }
  sortirPlanche() {
    if (this.mode != 'jeu' || this.planche > 0 || !this.profil.prendrePlanche()) return false;
    this.planche = this.dureePlanche();
    this.compter('planches');
    this.signal('planche');
    return true;
  }
  // élan de départ : quelques secondes de vol à toute vitesse, au tout début d'une course libre
  elanPossible() {
    return this.mode == 'jeu' && this.type == 'libre' && !this.elanUtilise && this.dist < 150;
  }
  prendreElan() {
    if (!this.elanPossible() || !this.profil.prendreElan()) return false;
    this.elanUtilise = true;
    this.elan = 6;
    this.traineePieces(6, vitesse(this.dist) * 2);
    this.signal('elan');
    return true;
  }

  terminer(raison) {
    if (this.mode != 'jeu' && this.mode != 'continuer') return;
    this.mode = 'fin';
    this.raison = raison;
    this.fin = 0;
    this.compter('score', Math.floor(this.score), true);
    this.compter('distance', Math.floor(this.dist), true);
    if (this.type == 'niveau' && raison == 'victoire') {
      const n = NIVEAUX[this.niveau];
      this.etoiles = 1 + (this.pieces >= n.pieces ? 1 : 0) + (this.trebuches == 0 ? 1 : 0);
    }
    this.signal('fin', { raison });
  }

  // ---------- boucle ----------
  maj(dt) {
    const P = this.P;
    this.t += dt;
    if (this.mode == 'continuer') {
      this.compte -= dt;
      if (this.compte <= 0) this.terminer('choc');
      return;
    }
    if (this.mode == 'fin') {
      this.fin += dt;
      if (this.raison == 'choc') {
        P.vy -= GRAVITE * dt;
        P.y = Math.max(P.gy, P.y + P.vy * dt);
        this.poursuite = Math.min(1, this.poursuite + dt * 2);
      } else {
        // arrivée ou fin du temps : le coureur ralentit sur sa lancée
        this.v = Math.max(0, this.v - 20 * dt);
        P.z += this.v * dt;
        P.course += this.v * dt;
        this.poursuite = Math.max(0, this.poursuite - dt);
      }
      return;
    }
    this.v = this.demo ? 10 : vitesse(this.dist + this.depart) * (this.turbo > 0 ? 1.5 : 1) * (this.elan > 0 ? 2 : 1);
    const vol = this.vole();
    for (const k in this.bonus) if ((this.bonus[k] -= dt) <= 0) delete this.bonus[k];
    if (this.elan > 0) this.elan = Math.max(0, this.elan - dt);
    if (vol && !this.vole()) this.invu = Math.max(this.invu, 1.4); // atterrissage protégé
    if (this.turbo > 0 && (this.turbo -= dt) <= 0) this.invu = Math.max(this.invu, 0.8);
    if (this.planche > 0) this.planche = Math.max(0, this.planche - dt);
    this.mult = (1 + this.profil.multi) * (this.bonus.x2 ? 2 : 1);
    this.alerte = Math.max(0, this.alerte - dt);
    this.invu = Math.max(0, this.invu - dt);
    if (this.alerte <= 0) this.poursuite = Math.max(0, this.poursuite - dt * 0.35);
    P.glisse = Math.max(0, P.glisse - dt);
    if (P.figure > 0) P.figure += dt;
    P.tampon = Math.max(0, P.tampon - dt);
    P.coyote = Math.max(0, P.coyote - dt);
    const n = Math.max(1, Math.ceil((this.v * dt) / 0.3));
    for (let i = 0; i < n && (this.mode == 'jeu' || this.mode == 'demo'); i++) this.pas(dt / n);
    if (this.mode == 'jeu') {
      if (this.type == 'defi' && (this.temps -= dt) <= 0) this.terminer('temps');
      else if (this.type == 'niveau' && P.z >= this.long) this.terminer('victoire');
      const q = quartierIndex(P.z, this.qFixe);
      if (q != this.qVu) {
        this.qVu = q;
        this.signal('quartier', { q });
      }
    }
    this.generer();
    if (Math.floor(this.t * 2) != Math.floor((this.t - dt) * 2)) this.nettoyer();
  }

  // pour les tests : avance de s secondes, image par image
  avancer(s) {
    for (let i = 0; i < Math.round(s * 60); i++) this.maj(1 / 60);
  }
}

