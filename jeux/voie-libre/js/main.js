// Voie libre 1.0 : point d'entrée. Relie la progression (sauvegarde), la course (simulation), le rendu 3D,
// le son, l'interface et les commandes, et fait tourner la boucle d'affichage.
// Pour les tests : ?graine=123 rend le parcours reproductible, ?evenement=halloween force un événement,
// et window.VL donne accès au jeu.
import { Progression, stockageNavigateur } from './progression.js';
import { Course } from './course.js';
import { Audio } from './audio.js';
import { Interface } from './interface.js';
import { brancherControles } from './controles.js';
import { aujourdhui } from './hasard.js';
import { QUARTIERS, PERSONNAGES, PLANCHES, BONUS, NIVEAUX } from './donnees.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const graineURL = params.has('graine') ? +params.get('graine') >>> 0 : null;
const fmt = n => Math.floor(n).toLocaleString('fr-FR');
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
// même parcours pour tout le monde au défi du jour
const graineJour = () => [...aujourdhui()].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

// paliers de qualité en mode « Auto » : la résolution d'abord, puis les ombres, puis les détails
const DPR = Math.min(2, devicePixelRatio || 1);
const PALIERS = [
  { dpr: DPR, ombres: true, detail: 2 },
  { dpr: Math.min(DPR, 1.5), ombres: true, detail: 2 },
  { dpr: Math.min(DPR, 1.25), ombres: false, detail: 1 },
  { dpr: 1, ombres: false, detail: 0 },
  { dpr: 0.75, ombres: false, detail: 0 }
];

class Jeu {
  constructor(Rendu) {
    this.prog = new Progression(stockageNavigateur, { evenementForce: params.get('evenement') });
    this.audio = new Audio();
    this.rendu = new Rendu($('scene'));
    this.ui = new Interface(this);
    this.prog.onAnnonce = t => this.ui.annoncer(t);
    this.etat = 'menu'; // menu, jeu, pause, continuer, fin
    this.reprise = 0; // compte à rebours après une pause
    this.palier = 0;
    this.lent = 0;
    this.geste = false;
    this.minuteries = [];
    brancherControles($('scene'), {
      gauche: () => this.course.gauche(),
      droite: () => this.course.droite(),
      sauter: () => this.course.sauter(),
      glisser: () => this.course.glisser(),
      planche: () => this.planche(),
      elan: () => this.elan(),
      pause: () => this.pause(),
      actif: () => this.etat == 'jeu' && this.reprise <= 0
    }, () => this.prog.D.reglages.sens);
    // le son ne peut démarrer qu'après un geste du joueur
    const debloquer = () => {
      if (this.geste) return;
      this.geste = true;
      this.audio.pret();
      if (this.etat == 'menu' || this.etat == 'jeu') this.audio.musique(true);
    };
    addEventListener('pointerdown', debloquer);
    addEventListener('keydown', debloquer);
    addEventListener('keydown', e => {
      // (la touche qui vient de mettre en pause est déjà traitée par les commandes)
      if (!e.defaultPrevented && this.etat == 'pause' && (e.key == 'Escape' || e.key == 'p' || e.key == 'P')) this.reprendre();
    });
    document.addEventListener('visibilitychange', () => document.hidden && this.pause());
    addEventListener('blur', () => this.pause());
    this.appliquerReglages();
  }

  // ---------- réglages ----------
  appliquerReglages() {
    const D = this.prog.D;
    this.audio.sons = !!D.son;
    this.audio.musiqueOn = !!D.musique;
    this.audio.musique(this.geste && (this.etat == 'menu' || (this.etat == 'jeu' && this.reprise <= 0)));
    const q = D.reglages.qualite;
    this.rendu.reglerQualite(q == 'basse' ? { dpr: Math.min(DPR, 1), ombres: false, detail: 0 } : q == 'haute' ? PALIERS[0] : PALIERS[this.palier]);
  }
  // en « Auto », si trop d'images sont lentes, on descend d'un palier
  surveiller(dt) {
    if (this.prog.D.reglages.qualite != 'auto' || (this.etat != 'jeu' && this.etat != 'menu')) return;
    this.lent = dt > 0.024 ? this.lent + 1 : Math.max(0, this.lent - 1);
    if (this.lent > 45 && this.palier < PALIERS.length - 1) {
      this.palier++;
      this.lent = 0;
      this.rendu.reglerQualite(PALIERS[this.palier]);
    }
  }
  vibrer(ms) {
    if (this.prog.D.reglages.vib && navigator.vibrate) navigator.vibrate(ms);
  }
  attendre(ms, f) {
    this.minuteries.push(setTimeout(f, ms));
  }
  annulerMinuteries() {
    this.minuteries.forEach(clearTimeout);
    this.minuteries = [];
  }
  vue(qDemo) {
    return { perso: this.prog.perso, planche: this.prog.plancheChoisie, evenement: (this.prog.evenementActif() || {}).id, qDemo };
  }

  // ---------- menu ----------
  menu() {
    if (this.course && this.etat != 'menu') this.prog.abandon(this.course);
    this.annulerMinuteries();
    const q = Math.floor(Math.random() * QUARTIERS.length);
    this.course = new Course({ demo: true, graine: graineURL ?? (Math.random() * 2 ** 32) >>> 0 });
    this.prog.course = null;
    this.rendu.preparer(this.course, this.vue(q));
    this.rendu.vitrine.planche = false;
    this.rendu.vitrine.decalage = 0;
    this.etat = 'menu';
    this.reprise = 0;
    this.audio.quartier = q;
    this.audio.musique(this.geste);
    this.ui.afficherMenu();
  }
  // boutique : essayer un personnage ou une planche (id « perso:x » ou « planche:x », null pour revenir au choix)
  essayer(id) {
    let perso = this.prog.perso,
      planche = this.prog.plancheChoisie;
    const [k, v] = (id || '').split(':');
    if (k == 'perso') perso = PERSONNAGES.find(p => p.id == v) || perso;
    if (k == 'planche') planche = PLANCHES.find(p => p.id == v) || planche;
    this.rendu.preparerPerso(perso, planche);
    this.rendu.vitrine.planche = k == 'planche' || (id == null && this.ui.courant == 'boutique' && this.ui.onglet == 'planches');
  }

  // ---------- course ----------
  demarrer(type = 'libre', niveau = -1) {
    const depuisMenu = this.etat == 'menu';
    if (this.course && !depuisMenu) this.prog.abandon(this.course);
    this.annulerMinuteries();
    this.audio.pret();
    const c = new Course({ type, niveau, graine: type == 'defi' ? graineJour() : graineURL ?? undefined, profil: this.prog.profilCourse() });
    this.course = c;
    this.prog.suivre(c);
    c.ecouter((t, d) => this.reagir(c, t, d));
    this.rendu.preparer(c, this.vue());
    this.rendu.vitrine.planche = false;
    this.rendu.vitrine.decalage = 0;
    if (depuisMenu) this.rendu.depart();
    this.etat = 'jeu';
    this.reprise = 0;
    this.tutoT = -1;
    this.audio.quartier = c.qVu;
    this.audio.musique(true);
    this.ui.debutCourse(c);
    if (type == 'niveau') this.ui.message('Niveau ' + (niveau + 1) + ' · ' + QUARTIERS[NIVEAUX[niveau].q].nom, 'quartier', 1800);
    else if (type == 'defi') this.ui.message('Défi du jour : 60 s !', 'quartier', 1800);
    else this.ui.message(QUARTIERS[c.qVu].nom, 'quartier', 1600);
  }
  recommencer() {
    const c = this.course;
    this.demarrer(c.type, c.niveau);
  }
  pause() {
    if (this.etat != 'jeu') return;
    this.etat = 'pause';
    this.reprise = 0;
    this.audio.musique(false);
    this.ui.panneauPause(this.course);
  }
  // reprise après un compte à rebours de 3 secondes
  reprendre() {
    if (this.etat != 'pause') return;
    this.etat = 'jeu';
    this.reprise = reduit ? 0.01 : 3;
    this.ui.montrer('jeu');
    if (!reduit) this.ui.message('3', 'quartier', 900);
  }
  continuer() {
    if (this.course.continuer()) this.audio.jouer('bonus');
  }
  refuser() {
    this.course.terminer('choc');
  }
  planche() {
    if (this.etat == 'jeu' && this.reprise <= 0) this.course.sortirPlanche();
  }
  elan() {
    if (this.etat == 'jeu' && this.reprise <= 0) this.course.prendreElan();
  }
  async partager() {
    const c = this.course,
      b = $('b-partager'),
      quoi = c.type == 'niveau' ? 'le niveau ' + (c.niveau + 1) + ' du Tour de la ville' : c.type == 'defi' ? 'le Défi du jour' : 'Voie libre';
    const texte = 'J\'ai fait ' + fmt(c.score) + ' points sur ' + quoi + ' (' + fmt(c.dist) + ' m) ! Viens battre mon score :';
    const url = location.href.split(/[?#]/)[0];
    try {
      if (navigator.share) await navigator.share({ title: 'Voie libre', text: texte, url });
      else {
        await navigator.clipboard.writeText(texte + ' ' + url);
        b.textContent = 'Copié !';
        setTimeout(() => (b.textContent = 'Partager'), 1800);
      }
    } catch (e) {}
  }

  // première course : quelques conseils
  tutoriel(c) {
    const D = this.prog.D;
    if (D.tuto || c.type != 'libre') return;
    const tactile = matchMedia('(pointer: coarse)').matches;
    const etapes = tactile
      ? [[0.6, 'Glisse ← ou → pour changer de voie'], [4.5, 'Glisse ↑ pour sauter'], [8.5, 'Glisse ↓ pour rouler sous les portiques'], [12.5, 'Tape deux fois pour sortir ta planche']]
      : [[0.6, '← → pour changer de voie'], [4.5, '↑ ou Espace pour sauter'], [8.5, '↓ pour rouler sous les portiques'], [12.5, 'B pour sortir ta planche']];
    for (const [t, m] of etapes)
      if (this.tutoT < t && c.t >= t) {
        this.ui.message(m, 'conseil', 2600);
        this.tutoT = c.t;
      }
    if (c.t > 16) {
      D.tuto = 1;
      this.prog.ecrire();
    }
  }

  // ce qui se passe dans la course : sons, effets, messages
  reagir(c, t, d) {
    if (c != this.course) return;
    const R = this.rendu,
      A = this.audio,
      U = this.ui,
      P = c.P,
      z3 = z => -(z - P.z);
    switch (t) {
      case 'piece':
        A.jouer('piece');
        R.particules(d.c.x, d.c.y, z3(d.c.z), 3, '#ffd23f', { v: 2, haut: 2, duree: 0.35, taille: 0.6 });
        break;
      case 'saut':
      case 'glisse':
      case 'voie':
      case 'planche':
        A.jouer(t);
        break;
      case 'atterrissage':
        if (d.fort) {
          R.particules(P.x, P.y + 0.05, 0, 8, '#d9d2c4', { v: 5, haut: 1.5, duree: 0.4 });
          R.secouer(0.12);
        }
        break;
      case 'ecrase':
        A.jouer('ecrase');
        R.secouer(0.3);
        R.particules(P.x, P.y + 0.1, 0, 14, '#ffffff', { v: 8, haut: 2, duree: 0.45 });
        this.vibrer(30);
        break;
      case 'figure':
        A.jouer('figure');
        U.flotte((d.combo > 1 ? 'Figure ×' + d.combo : 'Figure !') + ' +' + fmt(d.gain), P.x, P.y + 2.4, P.z, '#28e6c8');
        break;
      case 'casse':
        A.jouer('casse');
        U.flotte('+' + fmt(d.gain), c.centre(d.o), (d.o.y0 || 0) + 1.6, d.o.z0, '#ffd23f');
        break;
      case 'caisse': {
        A.jouer('caisse');
        const r = d.recompense,
          txt = r.pieces ? '+' + r.pieces + ' pièces' : r.cle ? '+1 clé !' : r.coffre ? '+1 coffre !' : BONUS[r.bonus].nom;
        U.flotte(txt, c.centre(d.o), (d.o.y0 || 0) + 1.4, d.o.z0, r.cle || r.coffre ? '#ffb703' : '#ffffff');
        break;
      }
      case 'trebuche':
        A.jouer('alerte');
        R.secouer(0.35);
        this.vibrer(60);
        break;
      case 'alerte':
        U.message('Attention, l\'agent te suit !', 'alerte', 1400);
        break;
      case 'protection':
        A.jouer('protection');
        R.secouer(0.4);
        R.particules(P.x, P.y + 1, 0, 18, d.quoi == 'bulle' ? '#ff70a6' : c.profil.planche.c1 || '#ffffff', { v: 7, haut: 4, duree: 0.6 });
        U.message(d.quoi == 'bulle' ? 'Bulle éclatée !' : 'Planche cassée !', 'alerte', 1100);
        this.vibrer(80);
        break;
      case 'choc':
        A.jouer('choc');
        R.secouer(0.8);
        this.vibrer(200);
        break;
      case 'continuer':
        this.etat = 'continuer';
        A.musique(false);
        this.attendre(500, () => this.etat == 'continuer' && U.panneauContinuer(d.cout));
        break;
      case 'repart':
        this.etat = 'jeu';
        U.montrer('jeu');
        U.message('C\'est reparti !', 'or', 1200);
        A.musique(true);
        break;
      case 'lettre':
        A.jouer('lettre');
        break;
      case 'jeton':
        A.jouer('lettre');
        R.particules(P.x, P.y + 1, 0, 10, (c.profil.evenement || {}).couleur || '#ffffff', { v: 4, haut: 3 });
        break;
      case 'bonus':
        A.jouer('bonus');
        U.message(BONUS[d.k].nom, 'or', 1100);
        R.particules(P.x, P.y + 1, 0, 14, BONUS[d.k].c, { v: 5, haut: 3 });
        break;
      case 'turbo':
        A.jouer('turbo');
        R.secouer(0.15);
        break;
      case 'elan':
        A.jouer('turbo');
        U.message('Élan !', 'or', 1000);
        break;
      case 'justesse':
        A.jouer('justesse');
        U.flotte('Justesse +' + fmt(d.gain), d.x, 2.2, P.z + 2, '#9be7ff');
        break;
      case 'quartier':
        A.quartier = d.q;
        U.message(QUARTIERS[d.q].nom, 'quartier', 1800);
        break;
      case 'fin': {
        this.etat = 'fin';
        A.musique(false);
        if (d.raison != 'choc') A.jouer('victoire');
        this.attendre(d.raison == 'choc' ? 1100 : 1500, () => {
          if (this.course == c) this.ui.panneauFin(c);
        });
        break;
      }
    }
  }

  // ---------- boucle ----------
  // une image : simulation, puis dessin (sauf si dessin est faux : avance rapide des tests)
  image(dt, dessin = true) {
    const c = this.course;
    if (this.etat == 'jeu') {
      if (this.reprise > 0) {
        const avant = Math.ceil(this.reprise);
        this.reprise -= dt;
        if (this.reprise <= 0) {
          this.reprise = 0;
          this.audio.musique(true);
        } else if (Math.ceil(this.reprise) != avant) this.ui.message(String(Math.ceil(this.reprise)), 'quartier', 900);
      } else {
        c.maj(dt);
        this.tutoriel(c);
      }
      this.ui.majHUD(c);
    } else if (this.etat == 'continuer') {
      c.maj(dt);
      this.ui.majContinuer(c);
    } else if (this.etat == 'fin') c.maj(dt);
    if (!dessin) return;
    const mode = this.etat == 'menu' ? 'menu' : this.etat == 'fin' ? 'fin' : 'jeu';
    this.rendu.dessiner(c, this.etat == 'pause' ? 0 : dt, mode);
  }
}

// ---------- démarrage ----------
function erreur(txt) {
  $('chargement').hidden = false;
  $('charge-txt').innerHTML = txt;
}
let J;
try {
  const { Rendu } = await import('./rendu/scene.js');
  J = new Jeu(Rendu);
} catch (e) {
  console.error(e);
  erreur('Ton navigateur ne peut pas afficher la 3D (WebGL est désactivé ou non pris en charge).<br><a href="../../jeux.html">Retour aux jeux</a>');
}
if (J) {
  J.menu();
  $('chargement').hidden = true;
  let derniere = 0;
  const boucle = t => {
    requestAnimationFrame(boucle);
    const dt = derniere ? Math.min(0.05, (t - derniere) / 1000) : 1 / 60;
    derniere = t;
    if (document.hidden) return;
    J.image(dt);
    J.surveiller(dt);
  };
  requestAnimationFrame(boucle);
  // hors ligne : le service worker du site met aussi le jeu en cache
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('../../sw.js').catch(() => {});
  // pour les tests : accès au jeu, et avance de s secondes image par image (60 par seconde, seule la dernière est dessinée)
  window.VL = {
    jeu: J,
    get course() {
      return J.course;
    },
    get D() {
      return J.prog.D;
    },
    get etat() {
      return J.etat;
    },
    demarrer: (type, niveau) => J.demarrer(type, niveau),
    menu: () => J.menu(),
    avancer: s => {
      const n = Math.round(s * 60);
      for (let i = 0; i < n; i++) J.image(1 / 60, i == n - 1);
    }
  };
}
