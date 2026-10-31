// Progression du joueur : sauvegarde (localStorage, clé « voie-libre », compatible avec les versions
// précédentes et lue par la page des jeux), missions, trophées, cadeau du jour, coffres, boutique,
// chasse aux lettres et événements saisonniers. Aucun affichage ici : les annonces passent par onAnnonce.
import { alea, melange, tirer, aujourdhui, hier } from './hasard.js';
import { BONUS, PERSONNAGES, PLANCHES, MISSIONS, TROPHEES, QUOTIDIEN, COFFRES, MOTS, NIVEAUX, EVENEMENTS, PRIX_AMELIO, PRIX } from './donnees.js';

const CLE = 'voie-libre';

function defaut() {
  const niv = {};
  for (const k in BONUS) niv[k] = 0;
  return {
    record: 0, pieces: 0, parties: 0, distance: 0, cles: 1, planches: 2, elans: 0, coffres: 0, niv,
    son: 1, musique: 1, perso: 'lune', persos: ['lune'], planche: 'classique', planchesDeb: ['classique'],
    multi: 0, missions: null, niveaux: [], defi: { jour: '', meilleur: 0, cle: 0 }, mot: { jour: '', n: 0 }, tuto: 0,
    st: { pieces: 0, piecesCourse: 0, scoreMax: 0, caisses: 0, drones: 0, toits: 0, planches: 0, defis: 0, mots: 0, figures: 0, coffres: 0, esquives: 0 },
    trophees: [], scores: [], quotidien: { jour: '', serie: 0, pris: true }, reglages: { vib: 1, sens: 1, qualite: 'auto' }, ev: { id: '', edition: 0, n: 0, pris: [] }
  };
}

// reprend une sauvegarde (même abîmée ou d'une ancienne version) en ne gardant que des valeurs sûres
function nettoyer(d) {
  const D = defaut();
  if (!d || typeof d != 'object') return D;
  const n = (v, max = 1e12) => (Number.isFinite(+v) && +v > 0 ? Math.min(max, Math.floor(+v)) : 0);
  for (const k of ['record', 'pieces', 'parties', 'distance', 'cles', 'planches', 'elans', 'coffres']) if (d[k] != null) D[k] = n(d[k]);
  D.multi = n(d.multi, 29);
  D.tuto = d.tuto ? 1 : 0;
  D.son = d.son === 0 ? 0 : 1;
  D.musique = d.musique === 0 ? 0 : 1;
  if (d.niv && typeof d.niv == 'object') for (const k in D.niv) D.niv[k] = n(d.niv[k], 5);
  if (d.st && typeof d.st == 'object') for (const k in D.st) D.st[k] = n(d.st[k]);
  const ids = (t, liste) => (Array.isArray(t) ? t.filter(x => liste.some(o => o.id === x)) : []);
  D.persos = [...new Set(['lune', ...ids(d.persos, PERSONNAGES)])];
  D.planchesDeb = [...new Set(['classique', ...ids(d.planchesDeb, PLANCHES)])];
  if (D.persos.includes(d.perso)) D.perso = d.perso;
  if (D.planchesDeb.includes(d.planche)) D.planche = d.planche;
  if (Array.isArray(d.niveaux)) D.niveaux = d.niveaux.slice(0, NIVEAUX.length).map(x => n(x, 3));
  if (Array.isArray(d.missions) && d.missions.length == 3 && d.missions.every(m => m && MISSIONS[m.i] && n(m.n) > 0))
    D.missions = d.missions.map(m => ({ i: m.i, n: n(m.n), p: Math.max(0, +m.p || 0), fait: !!m.fait }));
  if (d.defi && typeof d.defi == 'object') D.defi = { jour: String(d.defi.jour || ''), meilleur: n(d.defi.meilleur), cle: d.defi.cle ? 1 : 0 };
  if (d.mot && typeof d.mot == 'object') D.mot = { jour: String(d.mot.jour || ''), n: n(d.mot.n, 20) };
  if (Array.isArray(d.trophees)) D.trophees = d.trophees.filter(x => TROPHEES.some(t => t.id === x));
  if (Array.isArray(d.scores))
    D.scores = d.scores
      .filter(x => x && n(x.s) > 0)
      .slice(0, 5)
      .map(x => ({ s: n(x.s), d: n(x.d), j: /^\d{4}-\d\d-\d\d$/.test(x.j) ? x.j : '', p: PERSONNAGES.some(o => o.id === x.p) ? x.p : 'lune' }));
  if (d.quotidien && typeof d.quotidien == 'object') D.quotidien = { jour: String(d.quotidien.jour || ''), serie: n(d.quotidien.serie, 7), pris: d.quotidien.pris !== false };
  if (d.reglages && typeof d.reglages == 'object')
    D.reglages = { vib: d.reglages.vib === 0 ? 0 : 1, sens: [0.7, 1, 1.4].includes(d.reglages.sens) ? d.reglages.sens : 1, qualite: ['auto', 'basse', 'haute'].includes(d.reglages.qualite) ? d.reglages.qualite : 'auto' };
  if (d.ev && typeof d.ev == 'object' && EVENEMENTS.some(e => e.id === d.ev.id))
    D.ev = { id: d.ev.id, edition: n(d.ev.edition), n: n(d.ev.n), pris: Array.isArray(d.ev.pris) ? d.ev.pris.filter(i => Number.isInteger(i) && i >= 0 && i < 10) : [] };
  return D;
}

// stockage du navigateur, protégé (navigation privée, stockage plein ou bloqué)
export const stockageNavigateur = {
  lire: () => {
    try {
      return JSON.parse(localStorage.getItem(CLE));
    } catch (e) {
      return null;
    }
  },
  ecrire: d => {
    try {
      localStorage.setItem(CLE, JSON.stringify(d));
    } catch (e) {}
  },
  effacer: () => {
    try {
      localStorage.removeItem(CLE);
    } catch (e) {}
  }
};

export class Progression {
  constructor(stockage = stockageNavigateur, { evenementForce = null } = {}) {
    this.stockage = stockage;
    this.evenementForce = evenementForce;
    this.D = nettoyer(stockage.lire());
    this.onAnnonce = () => {};
    if (!this.D.missions) this.nouvellesMissions();
    this.majJour();
  }
  ecrire() {
    this.stockage.ecrire(this.D);
  }
  annoncer(t) {
    this.onAnnonce(t);
  }

  // ---------- choix du joueur ----------
  dureeBonus(k, niv = this.D.niv[k]) {
    return BONUS[k].base + BONUS[k].pas * niv;
  }
  get perso() {
    return PERSONNAGES.find(p => p.id == this.D.perso) || PERSONNAGES[0];
  }
  get plancheChoisie() {
    return PLANCHES.find(p => p.id == this.D.planche) || PLANCHES[0];
  }

  // interface donnée à une course
  profilCourse() {
    const D = this.D;
    return {
      multi: D.multi,
      dureeBonus: k => this.dureeBonus(k),
      planche: this.plancheChoisie,
      prendrePlanche: () => (D.planches > 0 ? (D.planches--, this.ecrire(), true) : false),
      prendreElan: () => (D.elans > 0 ? (D.elans--, this.ecrire(), true) : false),
      cles: () => D.cles,
      payerCles: n => (D.cles >= n ? ((D.cles -= n), this.ecrire(), true) : false),
      gagner: g => {
        D.cles += g.cles || 0;
        D.coffres += g.coffres || 0;
        this.ecrire();
      },
      lettreAttendue: () => this.lettreAttendue(),
      evenement: this.evenementActif()
    };
  }

  // la progression suit une course : missions, lettres, jetons et bilan de fin
  suivre(course) {
    course.ecouter((type, d) => {
      if (type == 'compteur') this.compteurMission(d.t, d.v, d.absolu, d.total);
      else if (type == 'lettre') this.lettre();
      else if (type == 'jeton') this.jeton();
      else if (type == 'fin') this.bilan(course);
    });
    this.course = course;
  }

  // ---------- missions ----------
  nouvellesMissions() {
    const r = alea(1000 + this.D.multi * 7919),
      pris = [],
      t = new Set();
    for (const i of melange(r, MISSIONS.map((_, i) => i))) {
      const m = MISSIONS[i];
      if (t.has(m.t) || (m.planche && this.D.planches < 1 && this.D.multi < 3)) continue;
      t.add(m.t);
      pris.push({ i, n: m.n(this.D.multi), p: 0, fait: false });
      if (pris.length == 3) break;
    }
    this.D.missions = pris;
  }
  texteMission(m) {
    return MISSIONS[m.i].txt(m.n);
  }
  compteurMission(t, v, absolu, total) {
    let fini = false;
    for (const m of this.D.missions) {
      const tpl = MISSIONS[m.i];
      if (m.fait || tpl.t != t) continue;
      if (tpl.course) m.p = Math.max(m.p, total);
      else if (!absolu) m.p += v;
      if (m.p >= m.n) {
        m.fait = true;
        fini = true;
        if (this.course) (this.course.missionsFaites = this.course.missionsFaites || []).push(this.texteMission(m));
        this.annoncer('Mission accomplie !');
      }
    }
    if (fini && this.D.missions.every(m => m.fait)) {
      this.D.multi = Math.min(29, this.D.multi + 1);
      this.D.coffres++;
      this.nouvellesMissions();
      this.annoncer('Multiplicateur ×' + (this.D.multi + 1) + ' ! + 1 coffre mystère');
    }
    if (fini) this.ecrire();
  }

  // ---------- fin de course ----------
  bilan(c) {
    const D = this.D,
      score = Math.floor(c.score);
    c.nouveauRecord = c.type == 'libre' && score > D.record && score > 0;
    D.parties++;
    D.pieces += c.pieces;
    D.distance = Math.max(D.distance, Math.floor(c.dist));
    if (c.nouveauRecord) D.record = score;
    for (const k of ['caisses', 'drones', 'toits', 'planches', 'figures', 'esquives']) D.st[k] += Math.floor(c.compteurs[k] || 0);
    D.st.pieces += c.pieces;
    D.st.piecesCourse = Math.max(D.st.piecesCourse, c.pieces);
    D.st.scoreMax = Math.max(D.st.scoreMax, score);
    c.rang = 0;
    if (c.type == 'libre' && score > 0) {
      const e = { s: score, d: Math.floor(c.dist), j: aujourdhui(), p: D.perso };
      D.scores.push(e);
      D.scores.sort((a, b) => b.s - a.s);
      D.scores = D.scores.slice(0, 5);
      c.rang = D.scores.indexOf(e) + 1;
    }
    c.recompense = '';
    if (c.type == 'niveau' && c.raison == 'victoire') {
      const avant = D.niveaux[c.niveau] || 0;
      if (!avant) {
        const g = 100 + 50 * c.niveau;
        D.pieces += g;
        c.recompense = '+' + g + ' pièces';
      }
      if (c.etoiles == 3 && avant < 3) {
        D.cles++;
        c.recompense += (c.recompense ? ' · ' : '') + '+1 clé';
      }
      D.niveaux[c.niveau] = Math.max(avant, c.etoiles);
    }
    if (c.type == 'defi') {
      this.majJour();
      D.defi.meilleur = Math.max(D.defi.meilleur, score);
      if (c.raison == 'temps' && !D.defi.cle) {
        D.defi.cle = 1;
        D.cles++;
        D.st.defis++;
        c.recompense = 'Défi réussi : +1 clé';
      }
    }
    this.ecrire();
    this.verifierTrophees();
  }
  // course abandonnée (Recommencer ou Menu pendant la pause) : les pièces ramassées sont gardées
  abandon(c) {
    if (!c || c.demo || !c.pieces || c.mode == 'fin') return;
    this.D.pieces += c.pieces;
    this.D.st.pieces += c.pieces;
    this.ecrire();
  }

  // ---------- trophées ----------
  valeurTrophee(type) {
    const D = this.D,
      c = this.course && !this.course.demo && this.course.mode != 'fin' ? this.course : null;
    switch (type) {
      case 'parties':
        return D.parties;
      case 'distance':
        return Math.max(D.distance, c ? c.dist : 0);
      case 'score':
        return Math.max(D.record, D.st.scoreMax, c ? c.score : 0);
      case 'piecesCourse':
        return Math.max(D.st.piecesCourse, c ? c.pieces : 0);
      case 'piecesTotal':
        return D.st.pieces + (c ? c.pieces : 0);
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
        return (D.st[type] || 0) + (c ? Math.floor(c.compteurs[type] || 0) : 0);
    }
  }
  verifierTrophees() {
    let gagne = false;
    for (const t of TROPHEES)
      if (!this.D.trophees.includes(t.id) && this.valeurTrophee(t.type) >= t.n) {
        this.D.trophees.push(t.id);
        this.D.pieces += t.gain;
        gagne = true;
        this.annoncer('Trophée : ' + t.nom + ' (+' + t.gain + ' pièces)');
      }
    if (gagne) this.ecrire();
    return gagne;
  }

  // ---------- jour : défi, mot, cadeau ----------
  majJour() {
    const j = aujourdhui();
    if (this.D.mot.jour != j) this.D.mot = { jour: j, n: 0 };
    if (this.D.defi.jour != j) this.D.defi = { jour: j, meilleur: 0, cle: 0 };
  }
  motDuJour() {
    return MOTS[+aujourdhui().replace(/-/g, '') % MOTS.length];
  }
  lettreAttendue() {
    const m = this.motDuJour();
    return this.D.mot.n < m.length ? m[this.D.mot.n] : null;
  }
  lettre() {
    const mot = this.motDuJour();
    if (this.D.mot.n >= mot.length) return;
    this.annoncer('Lettre « ' + mot[this.D.mot.n] + ' » !');
    this.D.mot.n++;
    if (this.D.mot.n >= mot.length) {
      this.D.cles++;
      this.D.pieces += 300;
      this.D.st.mots++;
      this.annoncer('Mot « ' + mot + ' » trouvé : +1 clé, +300 pièces');
    }
    this.ecrire();
  }
  cadeauEnAttente() {
    const j = aujourdhui(),
      Q = this.D.quotidien;
    if (Q.jour != j) {
      this.D.quotidien = { jour: j, serie: Q.jour == hier() ? (Q.serie % 7) + 1 : 1, pris: false };
      this.ecrire();
    }
    return !this.D.quotidien.pris;
  }
  recupererCadeau() {
    const Q = this.D.quotidien;
    if (Q.pris) return null;
    const c = QUOTIDIEN[Q.serie - 1] || QUOTIDIEN[0];
    for (const k of ['pieces', 'planches', 'cles', 'elans', 'coffres']) this.D[k] += c[k] || 0;
    Q.pris = true;
    this.ecrire();
    return c;
  }

  // ---------- coffres mystère ----------
  ouvrirCoffre() {
    const D = this.D;
    if (D.coffres < 1) return null;
    D.coffres--;
    D.st.coffres++;
    const c = tirer(Math.random, COFFRES),
      entre = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1)),
      bloques = PERSONNAGES.filter(p => !D.persos.includes(p.id) && !p.evenement);
    let res;
    if (c.perso && bloques.length) {
      const p = bloques[Math.floor(Math.random() * bloques.length)];
      D.persos.push(p.id);
      res = { txt: p.nom + ' te rejoint !', icone: '★', rare: true };
    } else if (c.pieces || c.perso) {
      const n = c.pieces ? entre(c.pieces) : 3000;
      D.pieces += n;
      res = { txt: n.toLocaleString('fr-FR') + ' pièces', icone: '◉', rare: n >= 1500 };
    } else if (c.planches) {
      const n = entre(c.planches);
      D.planches += n;
      res = { txt: n + ' planche' + (n > 1 ? 's' : ''), icone: '▬' };
    } else if (c.cles) {
      D.cles++;
      res = { txt: '1 clé', icone: '🔑' };
    } else {
      const n = entre(c.elans);
      D.elans += n;
      res = { txt: n + ' élan' + (n > 1 ? 's' : '') + ' de départ', icone: '»' };
    }
    this.ecrire();
    this.verifierTrophees();
    return res;
  }

  // ---------- boutique ----------
  payer(prix) {
    if (!(prix > 0) || this.D.pieces < prix) return false;
    this.D.pieces -= prix;
    return true;
  }
  // action : 'niv:aimant', 'perso:malo', 'planche:neon', 'planches', 'elans', 'coffre', 'cle'
  acheter(action) {
    const [a, id] = action.split(':'),
      D = this.D;
    let ok = false;
    if (a == 'niv' && D.niv[id] < 5 && this.payer(PRIX_AMELIO[D.niv[id]])) {
      D.niv[id]++;
      ok = true;
    } else if (a == 'perso') {
      const p = PERSONNAGES.find(x => x.id == id);
      if (p && (D.persos.includes(id) || (!p.evenement && this.payer(p.prix)))) {
        if (!D.persos.includes(id)) D.persos.push(id);
        D.perso = id;
        ok = true;
      }
    } else if (a == 'planche') {
      const p = PLANCHES.find(x => x.id == id);
      if (p && (D.planchesDeb.includes(id) || (!p.evenement && this.payer(p.prix)))) {
        if (!D.planchesDeb.includes(id)) D.planchesDeb.push(id);
        D.planche = id;
        ok = true;
      }
    } else if (a == 'planches' && this.payer(PRIX.planches)) (D.planches += 3), (ok = true);
    else if (a == 'elans' && this.payer(PRIX.elans)) (D.elans += 3), (ok = true);
    else if (a == 'coffre' && this.payer(PRIX.coffre)) (D.coffres += 1), (ok = true);
    else if (a == 'cle' && this.payer(PRIX.cle)) (D.cles += 1), (ok = true);
    if (ok) {
      this.ecrire();
      this.verifierTrophees();
    }
    return ok;
  }

  // ---------- événements saisonniers ----------
  evenementActif() {
    const d = new Date(),
      md = String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    for (const e of EVENEMENTS) {
      const dedans = this.evenementForce ? this.evenementForce == e.id : e.debut <= e.fin ? md >= e.debut && md <= e.fin : md >= e.debut || md <= e.fin;
      if (!dedans) continue;
      const edition = d.getFullYear() - (e.debut > e.fin && md <= e.fin ? 1 : 0);
      if (this.D.ev.id != e.id || this.D.ev.edition != edition) this.D.ev = { id: e.id, edition, n: 0, pris: [] };
      return e;
    }
    return null;
  }
  jeton() {
    const e = this.evenementActif();
    if (!e) return;
    this.D.ev.n++;
    e.paliers.forEach((pa, i) => {
      if (this.D.ev.n < pa.n || this.D.ev.pris.includes(i)) return;
      this.D.ev.pris.push(i);
      this.D.pieces += pa.pieces || 0;
      this.D.coffres += pa.coffres || 0;
      if (pa.perso && !this.D.persos.includes(pa.perso)) this.D.persos.push(pa.perso);
      if (pa.planche && !this.D.planchesDeb.includes(pa.planche)) this.D.planchesDeb.push(pa.planche);
      this.annoncer(e.nom + ' : ' + pa.txt + ' !');
    });
    this.ecrire();
  }

  effacer() {
    this.stockage.effacer();
    this.D = nettoyer(null);
    this.nouvellesMissions();
  }
}
