// Interface (DOM) : menu, panneaux, boutique, affichage pendant la course, annonces et textes flottants.
// J : le contrôleur du jeu (main.js), qui donne accès à la progression, au rendu, au son et aux actions.
import { QUARTIERS, PERSONNAGES, PLANCHES, BONUS, TROPHEES, QUOTIDIEN, NIVEAUX, EVENEMENTS, PRIX_AMELIO, PRIX } from './donnees.js';

const $ = id => document.getElementById(id);
const fmt = n => Math.floor(n).toLocaleString('fr-FR');
const secondes = d => d.toLocaleString('fr-FR') + ' s';
const ICONES_BONUS = { aimant: 'U', saut: '⇈', x2: '×2', jetpack: '▲', bulle: '◯' };
const PANNEAUX = ['aide', 'missions', 'trophees', 'niveaux', 'defi', 'evenement', 'boutique', 'coffre', 'reglages', 'cadeau', 'pause', 'continuer', 'fin'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export class Interface {
  constructor(J) {
    this.J = J;
    this.courant = null;
    this.onglet = 'persos';
    this.cache = {};
    this.hudT = 0;
    this.annonces = [];
    this.brancher();
  }
  get D() {
    return this.J.prog.D;
  }

  // ---------- écrans ----------
  // id : 'menu', un panneau, 'jeu' (affichage de course seul) ou null
  montrer(id) {
    this.courant = id;
    // le menu reste derrière les panneaux, sauf la boutique qui laisse voir le personnage en 3D
    $('menu').hidden = id != 'menu' && !['aide', 'missions', 'trophees', 'niveaux', 'defi', 'evenement', 'coffre', 'reglages', 'cadeau'].includes(id);
    for (const p of PANNEAUX) $(p).hidden = p != id;
    $('hud').hidden = !['jeu', 'pause', 'continuer', 'fin'].includes(id);
    const v = this.J.rendu.vitrine;
    v.decalage = id == 'boutique' ? 1 : 0;
    if (id != 'boutique') v.planche = false;
    const b = id && id != 'jeu' && document.querySelector('#' + id + ' .gros:not(:disabled), #' + id + ' .jouer');
    if (b && id != 'menu') b.focus({ preventScroll: true });
  }

  afficherMenu() {
    const D = this.D,
      J = this.J;
    J.prog.majJour();
    J.prog.verifierTrophees();
    $('m-pieces').textContent = fmt(D.pieces);
    $('m-cles').textContent = fmt(D.cles);
    $('m-multi').textContent = '×' + (D.multi + 1);
    $('m-record').textContent = fmt(D.record);
    $('m-etoiles').textContent = '★ ' + D.niveaux.reduce((s, x) => s + (x || 0), 0) + ' / ' + NIVEAUX.length * 3;
    $('m-defi').textContent = D.defi.meilleur ? 'meilleur : ' + fmt(D.defi.meilleur) : '60 secondes';
    const nf = D.missions.filter(m => m.fait).length;
    $('p-missions').hidden = !nf;
    $('p-missions').textContent = nf + '/3';
    $('p-boutique').hidden = !D.coffres;
    $('p-boutique').textContent = D.coffres;
    const e = J.prog.evenementActif();
    $('b-evenement').hidden = !e;
    if (e) {
      const prochain = e.paliers.find(p => p.n > D.ev.n);
      $('b-evenement').style.setProperty('--c', e.couleur);
      $('b-evenement').innerHTML = '<span>' + e.emoji + ' ' + e.nom + '</span><small>' + D.ev.n + ' ' + e.jetons + (prochain ? ' · prochain cadeau à ' + prochain.n : ' · tout est gagné !') + '</small>';
    }
    if (J.prog.cadeauEnAttente()) return this.panneauCadeau();
    this.montrer('menu');
  }

  // ---------- panneaux ----------
  panneauAide() {
    this.montrer('aide');
  }
  listeMissions() {
    return this.D.missions
      .map(m => {
        const pc = Math.min(100, (100 * m.p) / m.n);
        return '<li class="' + (m.fait ? 'fait' : '') + '"><span>' + (m.fait ? '✓ ' : '') + this.J.prog.texteMission(m) + '</span><i><b style="width:' + pc + '%"></b></i><em>' + fmt(Math.min(m.p, m.n)) + ' / ' + fmt(m.n) + '</em></li>';
      })
      .join('');
  }
  panneauMissions() {
    const P = this.J.prog;
    P.majJour();
    $('mi-suivant').textContent = '×' + (this.D.multi + 2);
    $('mi-liste').innerHTML = this.listeMissions();
    const mot = P.motDuJour();
    $('mi-mot').innerHTML = [...mot].map((c, i) => '<span class="' + (i < this.D.mot.n ? 'on' : '') + '">' + (i < this.D.mot.n ? c : '') + '</span>').join('');
    $('mi-mot-txt').textContent = this.D.mot.n >= mot.length ? 'Mot trouvé aujourd\'hui, bravo ! Un nouveau demain.' : 'Ramasse les lettres pendant tes courses libres : le mot complet rapporte 1 clé et 300 pièces.';
    this.montrer('missions');
  }
  panneauTrophees() {
    const P = this.J.prog,
      D = this.D;
    P.verifierTrophees();
    $('tr-total').textContent = D.trophees.length + ' / ' + TROPHEES.length;
    $('tr-liste').innerHTML = TROPHEES.map(t => {
      const ok = D.trophees.includes(t.id),
        v = Math.min(t.n, P.valeurTrophee(t.type));
      return '<li class="' + (ok ? 'fait' : '') + '"><span>' + (ok ? '🏆 ' : '') + t.nom + '<small>' + t.txt + ' · +' + fmt(t.gain) + ' pièces</small></span><i><b style="width:' + (100 * v) / t.n + '%"></b></i><em>' + (ok ? '✓' : fmt(v) + ' / ' + fmt(t.n)) + '</em></li>';
    }).join('');
    const nom = id => (PERSONNAGES.find(x => x.id == id) || PERSONNAGES[0]).nom;
    $('tr-scores').innerHTML = D.scores.length
      ? D.scores.map((e, i) => '<li><b>' + (i + 1) + '</b><span>' + fmt(e.s) + '</span><small>' + fmt(e.d) + ' m · ' + nom(e.p) + (e.j ? ' · ' + e.j.split('-').reverse().join('/') : '') + '</small></li>').join('')
      : '<li class="vide">Pas encore de score : lance une course libre !</li>';
    $('tr-stats').innerHTML = [
      ['Courses', fmt(D.parties)],
      ['Pièces', fmt(D.st.pieces)],
      ['Meilleure distance', fmt(D.distance) + ' m'],
      ['Caisses', fmt(D.st.caisses)],
      ['Drones évités', fmt(D.st.drones)],
      ['Sur les toits', fmt(D.st.toits) + ' m']
    ].map(([k, v]) => '<div><span>' + k + '</span><b>' + v + '</b></div>').join('');
    this.montrer('trophees');
  }
  panneauNiveaux() {
    const D = this.D;
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
    this.montrer('niveaux');
  }
  panneauDefi() {
    this.J.prog.majJour();
    $('d-meilleur').textContent = fmt(this.D.defi.meilleur);
    $('d-cle').textContent = this.D.defi.cle ? 'Clé du jour déjà gagnée.' : 'Tiens 60 secondes pour gagner une clé.';
    this.montrer('defi');
  }
  panneauEvenement() {
    const e = this.J.prog.evenementActif(),
      D = this.D;
    if (!e) return this.afficherMenu();
    const [m, j] = e.fin.split('-').map(Number);
    $('t-evenement').textContent = e.emoji + ' ' + e.nom;
    $('ev-dates').textContent = 'Jusqu\'au ' + j + ' ' + MOIS[m - 1] + ' : ramasse les ' + e.jetons + ' pendant tes courses.';
    $('ev-barre').style.width = Math.min(100, (100 * D.ev.n) / e.paliers[e.paliers.length - 1].n) + '%';
    $('ev-n').textContent = D.ev.n + ' ' + e.jetons + ' ramassé(e)s';
    $('ev-paliers').innerHTML = e.paliers
      .map((p, i) => {
        const ok = D.ev.pris.includes(i),
          pl = p.planche && PLANCHES.find(x => x.id == p.planche),
          pe = p.perso && PERSONNAGES.find(x => x.id == p.perso);
        const ic = pe ? this.avatar(pe) : pl ? '<i class="mini-planche" style="--c1:' + pl.c1 + ';--c2:' + pl.c2 + '"></i>' : '<i class="bic" style="--c:' + e.couleur + '">' + (p.coffres ? '?' : '◉') + '</i>';
        return '<li class="' + (ok ? 'fait' : '') + '">' + ic + '<span><b>' + p.txt + '</b><small>' + p.n + ' ' + e.jetons + '</small></span><em>' + (ok ? '✓' : Math.max(0, p.n - D.ev.n) + ' de plus') + '</em></li>';
      })
      .join('');
    this.montrer('evenement');
  }
  panneauCadeau() {
    const Q = this.D.quotidien;
    $('ca-jours').innerHTML = QUOTIDIEN.map((c, i) => '<li class="' + (i + 1 < Q.serie ? 'pris' : i + 1 == Q.serie ? 'auj' : '') + '"><small>Jour ' + (i + 1) + '</small><b>' + c.txt + '</b></li>').join('');
    $('ca-serie').textContent = Q.serie > 1 ? Q.serie + ' jours d\'affilée !' : 'Reviens chaque jour pour de plus beaux cadeaux.';
    this.montrer('cadeau');
  }
  panneauReglages() {
    this.majReglages();
    this.montrer('reglages');
  }
  majReglages() {
    const D = this.D;
    const inter = (id, v) => $(id).setAttribute('aria-pressed', v ? 'true' : 'false');
    inter('b-son', D.son);
    inter('b-musique', D.musique);
    inter('b-vib', D.reglages.vib);
    for (const b of document.querySelectorAll('[data-sens]')) b.setAttribute('aria-pressed', +b.dataset.sens == D.reglages.sens ? 'true' : 'false');
    for (const b of document.querySelectorAll('[data-qualite]')) b.setAttribute('aria-pressed', b.dataset.qualite == D.reglages.qualite ? 'true' : 'false');
  }

  // ---------- boutique ----------
  avatar(p) {
    return '<i class="avatar" style="--s:' + p.sweat + ';--h:' + (p.coiffure == 'capuche' ? p.sweat : p.coiffure == 'casquette' || p.coiffure == 'bonnet' ? p.accessoire : p.cheveux) + ';--p:' + p.peau + '" aria-hidden="true"></i>';
  }
  panneauBoutique(o) {
    if (o) this.onglet = o;
    const D = this.D,
      P = this.J.prog;
    $('s-pieces').textContent = fmt(D.pieces);
    for (const b of document.querySelectorAll('.onglets button')) b.setAttribute('aria-selected', b.dataset.o == this.onglet ? 'true' : 'false');
    const acheter = (cle, prix, txt) => '<button type="button" class="acheter" data-a="' + cle + '"' + (D.pieces < prix ? ' disabled' : '') + '><i class="piece-ic" aria-hidden="true"></i>' + fmt(prix) + '<span class="sr-only"> pièces : ' + txt + '</span></button>';
    const evNom = id => (EVENEMENTS.find(e => e.id == id) || {}).nom;
    let h = '';
    if (this.onglet == 'persos')
      h = PERSONNAGES.map(p => {
        const a = D.persos.includes(p.id),
          choisi = D.perso == p.id;
        const action = choisi ? '<span class="etat">✓</span>' : a ? '<button type="button" class="choisir" data-a="perso:' + p.id + '">Choisir</button>' : p.evenement ? '<span class="etat">🔒</span>' : acheter('perso:' + p.id, p.prix, p.nom);
        return '<div class="article' + (choisi ? ' choisi' : '') + (p.evenement && !a ? ' verrou' : '') + '" data-essai="perso:' + p.id + '">' + this.avatar(p) + '<div><b>' + p.nom + '</b><small>' + (choisi ? 'Ton personnage' : a ? 'Débloqué · touche pour l\'essayer' : p.evenement ? 'Récompense de « ' + evNom(p.evenement) + ' »' : 'Touche pour l\'essayer') + '</small></div>' + action + '</div>';
      }).join('');
    else if (this.onglet == 'planches')
      h = PLANCHES.map(p => {
        const a = D.planchesDeb.includes(p.id),
          choisi = D.planche == p.id;
        const action = choisi ? '<span class="etat">✓</span>' : a ? '<button type="button" class="choisir" data-a="planche:' + p.id + '">Choisir</button>' : p.evenement ? '<span class="etat">🔒</span>' : acheter('planche:' + p.id, p.prix, p.nom);
        return '<div class="article' + (choisi ? ' choisi' : '') + (p.evenement && !a ? ' verrou' : '') + '" data-essai="planche:' + p.id + '"><i class="mini-planche" style="--c1:' + p.c1 + ';--c2:' + p.c2 + '" aria-hidden="true"></i><div><b>' + p.nom + '</b><small>' + p.txt + (p.evenement && !a ? ' · récompense de « ' + evNom(p.evenement) + ' »' : '') + '</small></div>' + action + '</div>';
      }).join('');
    else if (this.onglet == 'bonus')
      h = Object.keys(BONUS)
        .map(k => {
          const n = D.niv[k],
            max = n >= 5;
          return '<div class="article" style="--c:' + BONUS[k].c + '"><i class="bic" style="--c:' + BONUS[k].c + '" aria-hidden="true">' + ICONES_BONUS[k] + '</i><div><b>' + BONUS[k].nom + '</b><small>Durée : ' + secondes(P.dureeBonus(k)) + (max ? ' (maximum)' : ' → ' + secondes(P.dureeBonus(k, n + 1))) + '</small><span class="niv-barre" aria-label="Niveau ' + n + ' sur 5">' + [0, 1, 2, 3, 4].map(i => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</span></div>' + (max ? '<span class="etat">Max</span>' : acheter('niv:' + k, PRIX_AMELIO[n], BONUS[k].nom)) + '</div>';
        })
        .join('');
    else
      h =
        '<div class="article"><i class="bic" style="--c:#a85a2a" aria-hidden="true">?</i><div><b>Coffres mystère</b><small>Tu en as ' + D.coffres + '. Pièces, planches, clés… ou un personnage !</small></div>' + (D.coffres ? '<button type="button" class="choisir" data-a="ouvrir">Ouvrir</button>' : '') + acheter('coffre', PRIX.coffre, '1 coffre') + '</div>' +
        '<div class="article"><i class="mini-planche" aria-hidden="true"></i><div><b>3 planches</b><small>Tu en as ' + D.planches + '. Chacune encaisse un choc pendant 30 s.</small></div>' + acheter('planches', PRIX.planches, '3 planches') + '</div>' +
        '<div class="article"><i class="bic" style="--c:#14b88a" aria-hidden="true">»</i><div><b>3 élans de départ</b><small>Tu en as ' + D.elans + '. 6 s de vol à toute vitesse au départ.</small></div>' + acheter('elans', PRIX.elans, '3 élans') + '</div>' +
        '<div class="article"><i class="bic" style="--c:#ffb703" aria-hidden="true">🔑</i><div><b>1 clé</b><small>Tu en as ' + D.cles + '. Pour continuer après un choc.</small></div>' + acheter('cle', PRIX.cle, '1 clé') + '</div>';
    $('amelio').innerHTML = h;
    this.montrer('boutique');
    this.J.rendu.vitrine.planche = this.onglet == 'planches';
  }

  // ---------- coffre ----------
  panneauCoffre() {
    $('co-boite').className = 'coffre';
    $('co-res').textContent = '';
    $('co-res').className = 'co-res';
    this.majCoffre();
    this.montrer('coffre');
  }
  majCoffre() {
    $('co-n').textContent = this.D.coffres;
    $('b-ouvrir').disabled = this.D.coffres < 1;
    $('b-ouvrir').textContent = $('co-res').textContent ? (this.D.coffres ? 'Encore un !' : 'Plus de coffre') : 'Ouvrir';
  }
  ouvrirCoffre() {
    const boite = $('co-boite');
    if (this.D.coffres < 1 || boite.classList.contains('secoue')) return;
    boite.className = 'coffre';
    $('co-res').textContent = '';
    $('co-res').className = 'co-res';
    void boite.offsetWidth;
    boite.className = 'coffre secoue';
    $('b-ouvrir').disabled = true;
    const res = this.J.prog.ouvrirCoffre();
    setTimeout(() => {
      boite.className = 'coffre ouvert' + (res.rare ? ' rare' : '');
      $('co-res').textContent = res.icone + ' ' + res.txt;
      $('co-res').className = 'co-res on' + (res.rare ? ' rare' : '');
      this.J.audio.jouer('coffre');
      this.J.vibrer(res.rare ? 120 : 50);
      this.majCoffre();
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 900);
  }

  // ---------- course ----------
  debutCourse(c) {
    this.cache = {};
    $('h-prog').hidden = c.type != 'niveau';
    $('h-temps').hidden = c.type != 'defi';
    this.montrer('jeu');
  }
  majHUD(c) {
    const t = performance.now();
    if (t - this.hudT < 90) return; // 10 fois par seconde suffit
    this.hudT = t;
    const C = this.cache,
      D = this.D;
    const actifs = Object.keys(c.bonus).filter(k => BONUS[k]);
    if (c.planche > 0) actifs.push('planche');
    if (c.turbo > 0) actifs.push('turbo');
    const v = { s: fmt(c.score), p: fmt(c.pieces), m: c.mult, x2: !!c.bonus.x2, b: actifs.join(), pl: D.planches + (c.planche > 0 ? 'a' : ''), t: Math.ceil(c.temps) };
    if (v.s != C.s) $('h-score').textContent = v.s;
    if (v.p != C.p) $('h-pieces').textContent = v.p;
    if (v.m != C.m || v.x2 != C.x2) {
      $('h-mult').textContent = '×' + v.m;
      $('h-mult').classList.toggle('x2', v.x2);
    }
    if (v.b != C.b)
      $('h-bonus').innerHTML = actifs
        .map(k => {
          const nom = k == 'planche' ? 'Planche' : k == 'turbo' ? 'Turbo' : BONUS[k].nom,
            col = k == 'planche' ? this.J.prog.plancheChoisie.c1 : k == 'turbo' ? '#28e6c8' : BONUS[k].c,
            ic = k == 'planche' ? '▬' : k == 'turbo' ? '»' : ICONES_BONUS[k];
          return '<div class="pil" style="--c:' + col + '"><i class="bic" style="--c:' + col + '">' + ic + '</i><div>' + nom + '<i class="barre-b" data-b="' + k + '"></i></div></div>';
        })
        .join('');
    for (const i of $('h-bonus').querySelectorAll('[data-b]')) {
      const k = i.dataset.b,
        f = k == 'planche' ? c.planche / c.dureePlanche() : k == 'turbo' ? c.turbo / 2.4 : c.bonus[k] / this.J.prog.dureeBonus(k);
      i.style.width = Math.max(0, Math.min(1, f)) * 100 + '%';
    }
    if (v.pl != C.pl) {
      $('h-planches').textContent = D.planches;
      $('b-planche').disabled = D.planches < 1 || c.planche > 0;
    }
    const elan = c.elanPossible() && D.elans > 0;
    if (elan != C.elan) $('b-elan').hidden = !elan;
    v.elan = elan;
    if (elan) $('h-elans').textContent = D.elans;
    if (c.type == 'niveau') $('h-prog-barre').style.width = Math.min(100, (100 * c.P.z) / c.long) + '%';
    if (c.type == 'defi' && v.t != C.t) {
      $('h-temps').textContent = Math.max(0, v.t) + ' s';
      $('h-temps').classList.toggle('urgent', v.t <= 10);
    }
    this.cache = v;
  }

  message(t, genre = '', duree = 1400) {
    const m = $('h-msg');
    m.textContent = t;
    m.className = '';
    void m.offsetWidth;
    m.className = 'on ' + genre;
    m.style.animationDuration = duree + 'ms';
    clearTimeout(this.minMsg);
    this.minMsg = setTimeout(() => {
      m.className = '';
      m.textContent = '';
    }, duree);
  }
  // annonces importantes (missions, trophées), l'une après l'autre
  annoncer(t) {
    this.annonces.push(t);
    if (this.annonces.length == 1) this.suivante();
  }
  suivante() {
    if (!this.annonces.length) return;
    this.message(this.annonces[0], 'or', 2000);
    this.J.audio.jouer('mission');
    setTimeout(() => {
      this.annonces.shift();
      this.suivante();
    }, 2100);
  }
  // texte qui monte depuis un point de la course (+20, Figure…)
  flotte(txt, x, y, z, couleur = '#ffffff') {
    const p = this.J.rendu.projeter(x, y, z);
    if (!p.devant) return;
    const e = document.createElement('div');
    e.className = 'flotte';
    e.textContent = txt;
    e.style.left = p.x + 'px';
    e.style.top = p.y + 'px';
    e.style.color = couleur;
    $('flottants').appendChild(e);
    setTimeout(() => e.remove(), 950);
  }

  panneauPause(c) {
    $('pause-missions').innerHTML = this.listeMissions();
    this.montrer('pause');
  }
  panneauContinuer(cout) {
    $('c-cout').textContent = cout;
    $('c-cles').textContent = fmt(this.D.cles);
    $('b-continuer').textContent = 'Utiliser ' + cout + ' clé' + (cout > 1 ? 's' : '');
    this.montrer('continuer');
  }
  majContinuer(c) {
    $('c-barre').style.width = Math.max(0, (c.compte / 5) * 100) + '%';
  }
  panneauFin(c) {
    const v = c.raison == 'victoire',
      tps = c.raison == 'temps';
    $('t-fin').textContent = v ? 'Niveau terminé !' : tps ? 'Temps écoulé !' : c.type == 'niveau' ? 'Niveau raté' : 'Fin de la course';
    $('f-score').textContent = fmt(c.score);
    $('f-record').hidden = !c.nouveauRecord && !c.rang;
    $('f-record').textContent = c.nouveauRecord ? 'Nouveau record !' : c.rang ? c.rang + (c.rang == 1 ? 'er' : 'e') + ' meilleur score' : '';
    $('f-etoiles').hidden = !v;
    if (v) $('f-etoiles').innerHTML = [0, 1, 2].map(i => '<span class="' + (i < c.etoiles ? 'on' : '') + '">★</span>').join('') + '<small>Arrivée · ' + NIVEAUX[c.niveau].pieces + ' pièces · sans trébucher</small>';
    $('f-dist').textContent = fmt(c.dist) + ' m';
    $('f-pieces').textContent = fmt(c.pieces);
    $('f-recompense').hidden = !c.recompense;
    $('f-recompense').textContent = c.recompense || '';
    const faites = c.missionsFaites || [];
    $('f-missions').innerHTML = faites.map(t => '<li>✓ ' + t + '</li>').join('');
    $('f-missions').hidden = !faites.length;
    const suivant = c.type == 'niveau' && v && c.niveau + 1 < NIVEAUX.length;
    $('b-suivant').hidden = !suivant;
    $('b-rejouer').textContent = c.type == 'niveau' ? 'Recommencer le niveau' : 'Rejouer';
    this.montrer('fin');
    if (suivant) $('b-suivant').focus({ preventScroll: true });
  }

  // ---------- boutons ----------
  brancher() {
    const J = this.J,
      clic = (id, f) =>
        ($(id).onclick = () => {
          J.audio.jouer('clic');
          f();
        });
    clic('b-jouer', () => J.demarrer('libre'));
    clic('b-niveaux', () => this.panneauNiveaux());
    clic('b-defi', () => this.panneauDefi());
    clic('b-lancer-defi', () => J.demarrer('defi'));
    clic('b-missions', () => this.panneauMissions());
    clic('b-trophees', () => this.panneauTrophees());
    clic('b-boutique', () => this.panneauBoutique());
    clic('b-reglages', () => this.panneauReglages());
    clic('b-aide', () => this.panneauAide());
    clic('b-evenement', () => this.panneauEvenement());
    clic('b-cadeau', () => {
      J.prog.recupererCadeau();
      J.audio.jouer('bonus');
      this.afficherMenu();
    });
    clic('b-ouvrir', () => this.ouvrirCoffre());
    clic('b-pause', () => J.pause());
    clic('b-reprendre', () => J.reprendre());
    clic('b-recommencer', () => J.recommencer());
    clic('b-continuer', () => J.continuer());
    clic('b-non', () => J.refuser());
    clic('b-rejouer', () => J.recommencer());
    clic('b-suivant', () => J.demarrer('niveau', J.course.niveau + 1));
    clic('b-partager', () => J.partager());
    $('b-planche').onclick = () => J.planche();
    $('b-elan').onclick = () => J.elan();
    for (const b of document.querySelectorAll('[data-menu]')) b.onclick = () => J.menu();
    for (const b of document.querySelectorAll('[data-fermer]'))
      b.onclick = () => {
        J.audio.jouer('clic');
        if (this.courant == 'coffre') return this.panneauBoutique('objets');
        J.essayer(null);
        this.afficherMenu();
      };
    $('niv-liste').addEventListener('click', e => {
      const b = e.target.closest('[data-n]');
      if (b && !b.disabled) J.demarrer('niveau', +b.dataset.n);
    });
    document.querySelector('.onglets').addEventListener('click', e => {
      const b = e.target.closest('[data-o]');
      if (b) {
        this.panneauBoutique(b.dataset.o);
        J.essayer(null);
        b.focus();
      }
    });
    $('amelio').addEventListener('click', e => {
      const b = e.target.closest('[data-a]');
      if (b && !b.disabled) {
        if (b.dataset.a == 'ouvrir') return this.panneauCoffre();
        if (J.prog.acheter(b.dataset.a)) J.audio.jouer('bonus');
        J.essayer(null);
        return this.panneauBoutique();
      }
      // toucher une ligne : essayer le personnage ou la planche en 3D
      const l = e.target.closest('[data-essai]');
      if (l) {
        for (const x of $('amelio').querySelectorAll('.essai')) x.classList.remove('essai');
        l.classList.add('essai');
        J.essayer(l.dataset.essai);
      }
    });
    // réglages
    const bascule = (id, f) => ($(id).onclick = () => (f(), J.prog.ecrire(), this.majReglages(), J.appliquerReglages()));
    bascule('b-son', () => (this.D.son = this.D.son ? 0 : 1));
    bascule('b-musique', () => (this.D.musique = this.D.musique ? 0 : 1));
    bascule('b-vib', () => (this.D.reglages.vib = this.D.reglages.vib ? 0 : 1));
    for (const b of document.querySelectorAll('[data-sens]')) b.onclick = () => ((this.D.reglages.sens = +b.dataset.sens), J.prog.ecrire(), this.majReglages());
    for (const b of document.querySelectorAll('[data-qualite]')) b.onclick = () => ((this.D.reglages.qualite = b.dataset.qualite), J.prog.ecrire(), this.majReglages(), J.appliquerReglages());
    $('b-effacer').onclick = () => {
      if (!confirm('Effacer toute ta progression (record, pièces, personnages, trophées…) ? C\'est définitif.')) return;
      J.prog.effacer();
      location.reload();
    };
    addEventListener('keydown', e => {
      if (e.key != 'Escape') return;
      if (['aide', 'missions', 'trophees', 'niveaux', 'defi', 'evenement', 'boutique', 'reglages'].includes(this.courant)) {
        J.essayer(null);
        this.afficherMenu();
      } else if (this.courant == 'coffre') this.panneauBoutique('objets');
    });
  }
}

