/* Mine Clic : le moteur du jeu et l'interface.
   Clique sur le bloc pour le miner, achète des machines qui minent pour toi, ouvre les coffres,
   désamorce les creepers, utilise tes capacités, remplis les missions, débloque les dimensions
   et renais pour gagner des étoiles du Nether et des pouvoirs permanents. */
(function () {
  'use strict';
  var D = window.MC_DONNEES, T = window.MC_TEXTURES;
  var CLE = 'mine-clic';
  var SEUIL_ETOILE = 1e8; // étoiles = racine cubique (minés au total / 100 millions)
  var $ = function (id) { return document.getElementById(id); };
  var parId = function (liste) { var o = {}; liste.forEach(function (x) { o[x.id] = x; }); return o; };
  var MACHINE = parId(D.MACHINES), AMEL = parId(D.AMELIORATIONS), PROG = parId(D.PROGRES), DIM = parId(D.DIMENSIONS);
  var POUVOIR = parId(D.POUVOIRS), CAPA = parId(D.CAPACITES), MISSION = parId(D.MISSIONS);

  /* ================= Nombres et durées, à la française ================= */
  var GRANDS = ['million', 'milliard', 'billion', 'billiard', 'trillion', 'trilliard', 'quadrillion', 'quadrilliard', 'quintillion', 'quintilliard', 'sextillion', 'sextilliard'];
  var COURTS = ['M', 'Md', 'Bn', 'Bd', 'Tn', 'Td', 'Qn', 'Qd', 'Qt', 'Qtd', 'Sx', 'Sxd'];
  function nombre(n, decimales) {
    if (!isFinite(n)) return '∞';
    if (n < 1e6) {
      if (decimales && n < 100 && n % 1) return (Math.floor(n * 10) / 10).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
      return Math.floor(n).toLocaleString('fr-FR');
    }
    if (S.notation == 'sci') return n.toExponential(2).replace('.', ',').replace('e+', 'e');
    var p = Math.floor(Math.log10(n) / 3) - 2;
    if (p >= GRANDS.length) return n.toExponential(2).replace('.', ',').replace('e+', ' × 10^');
    var v = n / Math.pow(10, 6 + 3 * p);
    if (S.notation == 'court') return (Math.floor(v * 100) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' ' + COURTS[p];
    v = Math.floor(v * 1000) / 1000;
    return v.toLocaleString('fr-FR', { maximumFractionDigits: 3 }) + ' ' + GRANDS[p] + (v >= 2 ? 's' : '');
  }
  function unite(n) { return n >= 1e6 && S.notation == 'mots' ? 'de blocs' : n >= 2 ? 'blocs' : 'bloc'; }
  function blocs(n, decimales) { return nombre(n, decimales) + ' ' + unite(n); }
  function duree(s) {
    s = Math.max(0, Math.floor(s));
    if (s < 60) return s + ' s';
    if (s < 3600) return Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s';
    if (s < 86400) return Math.floor(s / 3600) + ' h ' + String(Math.floor(s / 60) % 60).padStart(2, '0') + ' min';
    if (s < 86400 * 365) return Math.floor(s / 86400) + ' j ' + Math.floor(s / 3600) % 24 + ' h';
    return 'plus d\'un an';
  }
  // « {1000} » dans un texte → nombre mis en forme
  function texte(t) { return t.replace(/\{(\d+(?:e\d+)?)\}/g, function (m, n) { return nombre(+n); }); }
  function echappe(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pluriel(n, mot, mots) { return n + ' ' + (n > 1 ? (mots || mot + 's') : mot); }
  function rond(n) { if (n < 100) return Math.ceil(n); var p = Math.pow(10, Math.floor(Math.log10(n)) - 1); return Math.ceil(n / p) * p; }

  /* ================= État de la partie ================= */
  var COMPTEURS = ['clics', 'casses', 'etoiles', 'fragments', 'renaissances', 'coffres', 'creepers', 'boums', 'coups', 'missionsFaites', 'brillants', 'capacites', 'comboMax', 'achats', 'amelsAchetees', 'maxAchat', 'citrouilles', 'cadeaux'];
  function neuf() {
    var t = Date.now();
    return {
      v: 2, blocs: 0, total: 0, totalAll: 0, machines: {}, amels: [], progres: [], pouvoirs: [], recharges: {}, missions: [],
      clics: 0, casses: 0, etoiles: 0, fragments: 0, renaissances: 0, coffres: 0, creepers: 0, boums: 0, coups: 0,
      missionsFaites: 0, brillants: 0, capacites: 0, comboMax: 0, achats: 0, amelsAchetees: 0, maxAchat: 0, citrouilles: 0, cadeaux: 0,
      dims: ['surface'], vues: ['surface'], dim: 'surface', bloc: 'herbe', brillant: false,
      debut: t, debutVie: t, derniere: t, tempsJeu: 0, son: true, musique: true, particules: true, notation: 'mots', qte: 1
    };
  }
  // une sauvegarde peut venir d'un code collé : on ne garde que ce qui a du sens
  function nettoyer(d) {
    var S = neuf();
    if (!d || typeof d != 'object') return S;
    var nb = function (x) { return typeof x == 'number' && isFinite(x) && x >= 0; };
    ['blocs', 'total', 'totalAll', 'debut', 'debutVie', 'derniere', 'tempsJeu'].concat(COMPTEURS).forEach(function (k) { if (nb(d[k])) S[k] = d[k]; });
    COMPTEURS.forEach(function (k) { S[k] = Math.floor(S[k]); });
    // avant les pouvoirs (version 1), les étoiles déjà gagnées donnent autant de fragments
    if (!nb(d.fragments) && S.etoiles > 0) S.fragments = S.etoiles;
    S.totalAll = Math.max(S.totalAll, S.total);
    if (d.machines && typeof d.machines == 'object') D.MACHINES.forEach(function (m) { if (nb(d.machines[m.id])) S.machines[m.id] = Math.min(100000, Math.floor(d.machines[m.id])); });
    var garder = function (liste, connus) { return Array.isArray(liste) ? liste.filter(function (x, i) { return connus[x] && liste.indexOf(x) == i; }) : []; };
    S.amels = garder(d.amels, AMEL); S.progres = garder(d.progres, PROG); S.pouvoirs = garder(d.pouvoirs, POUVOIR);
    S.dims = garder(d.dims, DIM); if (S.dims.indexOf('surface') < 0) S.dims.unshift('surface');
    S.vues = garder(d.vues, DIM); if (S.vues.indexOf('surface') < 0) S.vues.unshift('surface');
    if (S.dims.indexOf(d.dim) >= 0) S.dim = d.dim;
    if (d.recharges && typeof d.recharges == 'object') D.CAPACITES.forEach(function (c) { if (nb(d.recharges[c.id])) S.recharges[c.id] = Math.min(d.recharges[c.id], Date.now() + 3600e3); });
    if (Array.isArray(d.missions)) S.missions = d.missions.filter(function (m) { return m && MISSION[m.id] && nb(m.but) && m.but > 0 && nb(m.depart); })
      .slice(0, 4).map(function (m) { return { id: m.id, but: m.but, depart: m.depart, max: nb(m.max) ? m.max : 0 }; });
    ['son', 'musique', 'particules', 'brillant'].forEach(function (k) { if (typeof d[k] == 'boolean') S[k] = d[k]; });
    if (['mots', 'court', 'sci'].indexOf(d.notation) >= 0) S.notation = d.notation;
    if ([1, 10, 100, 'max'].indexOf(d.qte) >= 0) S.qte = d.qte;
    if (D.BLOCS[d.bloc] && DIM[S.dim].blocs.indexOf(d.bloc) >= 0) S.bloc = d.bloc; else S.bloc = DIM[S.dim].blocs[0];
    S.coups = Math.min(S.coups, D.BLOCS[S.bloc].durete - 1);
    return S;
  }

  var S = neuf();
  var J = {}; // valeurs calculées : production, valeur d'un clic, multiplicateurs…
  var effets = []; // effets en cours (coffres, capacités) : { id, desc, fin, duree }
  var combo = { n: 0, dernier: 0 };

  function a(id) { return S.pouvoirs.indexOf(id) >= 0; }
  function actif(id) { var t = Date.now(); return effets.some(function (e) { return e.id == id && e.fin > t; }); }
  function recalculer() {
    var m = { clic: 0, pct: 0, fortune: 0, chance: 0, duree: 0, global: 0, combo: 0, brillance: 0, recharge: 0, machine: {} };
    S.amels.forEach(function (id) {
      var u = AMEL[id];
      if (u.effet == 'machine') m.machine[u.machine] = (m.machine[u.machine] || 0) + 1;
      else if (u.effet == 'global') m.global += u.val;
      else m[u.effet]++;
    });
    J.mods = m;
    J.pctEtoile = a('constellation') ? 3 : 2;
    J.multProgres = S.progres.length; J.multEtoiles = S.etoiles * J.pctEtoile;
    J.mult = (1 + m.global / 100) * (1 + S.progres.length / 100) * (1 + J.multEtoiles / 100);
    J.remise = (a('marchand') ? 0.9 : 1) * (a('grand-marchand') ? 0.9 : 1);
    J.remiseAmel = a('bibliothecaire') ? 0.9 : 1;
    J.parMachine = {}; J.cpsBase = 0;
    D.MACHINES.forEach(function (x) {
      J.parMachine[x.id] = x.cps * Math.pow(2, m.machine[x.id] || 0) * J.mult;
      J.cpsBase += (S.machines[x.id] || 0) * J.parMachine[x.id];
    });
    J.frenesie = actif('frenesie'); J.ruee = actif('ruee'); J.eclair = actif('eclair'); J.hate = actif('hate'); J.cloche = actif('cloche'); J.pluie = actif('pluie');
    J.multFrenesie = a('dragon') ? 10 : 7;
    J.cps = J.cpsBase * (J.frenesie ? J.multFrenesie : 1) * (J.cloche ? 3 : 1);
    J.clicBase = (Math.pow(2, m.clic) * (a('gant') ? 2 : 1) * J.mult + J.cps * m.pct / 100) * (J.ruee ? 777 : 1) * (J.hate ? 10 : 1);
    J.pctCombo = 2 + m.combo;
    J.clic = J.clicBase * multCombo();
    J.fortune = Math.pow(2, m.fortune) * (a('soie') ? 3 : 1);
    J.multBrillant = 10 * Math.pow(2, m.brillance);
    J.multRecharge = (a('recharge') ? 0.5 : 1) * Math.pow(0.75, m.recharge);
    J.multDuree = a('sablier') ? 1.5 : 1;
  }
  function multCombo() { return 1 + Math.max(0, combo.n - 1) * (J.pctCombo || 2) / 100; }
  function gagner(n) { if (!(n > 0)) return; S.blocs += n; S.total += n; S.totalAll += n; }
  function prixMachine(m, n, q) { return Math.ceil(m.prix * Math.pow(1.15, n) * (Math.pow(1.15, q) - 1) / 0.15 * (J.remise || 1)); }
  function maxAchetable(m) {
    var n = S.machines[m.id] || 0, q = Math.floor(Math.log(1 + S.blocs * 0.15 / (m.prix * Math.pow(1.15, n) * J.remise)) / Math.log(1.15));
    q = Math.max(0, Math.min(10000, q));
    while (q > 0 && prixMachine(m, n, q) > S.blocs) q--;
    return q;
  }
  function qteVoulue(m) { return S.qte == 'max' ? Math.max(1, maxAchetable(m)) : S.qte; }
  function prixAmel(u) { return Math.ceil(u.prix * J.remiseAmel); }
  function matierePioche() { var m = 'bois'; ['pierre', 'fer', 'or', 'diamant', 'netherite'].forEach(function (x) { if (S.amels.indexOf('pioche-' + x) >= 0) m = x; }); return m; }
  function saison() {
    if (window.MC_SAISON !== undefined) return window.MC_SAISON;
    var d = new Date(), mo = d.getMonth() + 1, j = d.getDate();
    if ((mo == 10 && j >= 20) || (mo == 11 && j <= 3)) return 'halloween';
    if ((mo == 12 && j >= 15) || (mo == 1 && j <= 6)) return 'noel';
    return null;
  }
  var SAISONS = {
    halloween: { sprite: 'citrouille', nom: 'citrouille', chip: 'Halloween', long: ' : citrouilles plus fréquentes', annonce: 'Événement Halloween : des citrouilles remplacent les coffres au trésor !' },
    noel: { sprite: 'cadeau', nom: 'cadeau', chip: 'Noël', long: ' : cadeaux plus fréquents', annonce: 'Événement de Noël : des cadeaux remplacent les coffres au trésor !' }
  };

  /* ================= Sons et musique (synthétisés, aucun fichier) ================= */
  var sons = (function () {
    var ctx = null, buf = null, sortie = null;
    function audio() {
      if (!S.son) return null;
      if (!ctx) {
        var A = window.AudioContext || window.webkitAudioContext;
        if (!A) return null;
        try { ctx = new A(); } catch (e) { return null; }
        buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        sortie = ctx.createGain(); sortie.gain.value = 0.5; sortie.connect(ctx.destination);
      }
      if (ctx.state == 'suspended') ctx.resume();
      return ctx;
    }
    function bruit(dur, type, freq, q, vol, t0) {
      var a = audio(); if (!a) return null;
      var t = a.currentTime + (t0 || 0), s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = buf; f.type = type; f.frequency.value = freq; f.Q.value = q;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f); f.connect(g); g.connect(sortie);
      s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
      return { g: g, s: s, t: t };
    }
    function note(freq, dur, type, vol, t0, freq2, attaque) {
      var a = audio(); if (!a) return;
      var t = a.currentTime + (t0 || 0), o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t); if (freq2) o.frequency.exponentialRampToValueAtTime(freq2, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (attaque || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(sortie); o.start(t); o.stop(t + dur + 0.05);
    }
    var MAT = { terre: [650, 1.2], bois: [420, 3], pierre: [1700, 2.5], lourd: [1000, 2], verre: [3200, 4] };
    return {
      pret: function () { return !!ctx && ctx.state == 'running' && S.son; },
      coup: function (m, doux) { var p = MAT[m] || MAT.pierre; bruit(0.07, 'bandpass', p[0] * (0.85 + Math.random() * 0.3), p[1], doux ? 0.18 : 0.7); if (m == 'bois' && !doux) note(170, 0.07, 'triangle', 0.3); },
      casse: function (m) { var p = MAT[m] || MAT.pierre; bruit(0.3, 'lowpass', p[0] * 1.5, 1, 0.8); bruit(0.18, 'bandpass', p[0] * 0.7, 2, 0.5, 0.05); if (m == 'verre') note(1800, 0.2, 'triangle', 0.15, 0, 900); },
      brillant: function () { [1319, 1568, 2093, 2637].forEach(function (f, i) { note(f, 0.25, 'sine', 0.12, i * 0.06); }); },
      achat: function () { note(660, 0.07, 'square', 0.12); note(990, 0.1, 'square', 0.12, 0.07); },
      non: function () { note(140, 0.14, 'square', 0.1); },
      progres: function () { [523, 659, 784, 1047].forEach(function (f, i) { note(f, 0.2, 'triangle', 0.2, i * 0.09); }); },
      mission: function () { [784, 988, 1175].forEach(function (f, i) { note(f, 0.16, 'square', 0.08, i * 0.08); }); },
      coffre: function () { note(392, 0.1, 'triangle', 0.25); note(784, 0.3, 'triangle', 0.25, 0.1); bruit(0.25, 'highpass', 3000, 1, 0.2); },
      apparait: function () { note(1200, 0.08, 'sine', 0.12); note(1600, 0.12, 'sine', 0.12, 0.08); },
      capacite: function () { note(330, 0.25, 'sawtooth', 0.08, 0, 990); note(660, 0.3, 'triangle', 0.15, 0.1); },
      cloche: function () { [0, 0.35].forEach(function (t) { note(880, 1.2, 'sine', 0.25, t); note(1320, 0.9, 'sine', 0.1, t); }); },
      siffle: function (dur) {
        var a = audio(); if (!a) return null;
        var r = bruit(dur, 'highpass', 2600, 0.8, 0.02);
        if (r) { r.g.gain.cancelScheduledValues(r.t); r.g.gain.setValueAtTime(0.02, r.t); r.g.gain.linearRampToValueAtTime(0.4, r.t + dur); }
        return r;
      },
      boum: function () { bruit(1.2, 'lowpass', 360, 0.7, 1.4); note(80, 0.7, 'sine', 0.7, 0, 30); },
      couper: function (r) { try { if (r) r.s.stop(); } catch (e) {} },
      // musique : notes douces et lentes, gamme selon la dimension
      douce: function (f, vol) { note(f, 3.2, 'sine', vol, 0, null, 0.12); note(f * 2, 2.2, 'triangle', vol * 0.18, 0.02, null, 0.15); }
    };
  })();
  var GAMMES = {
    surface: [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3],
    grottes: [220, 261.6, 293.7, 329.6, 392, 440, 523.3],
    profondeurs: [196, 220, 261.6, 293.7, 329.6, 392],
    coeur: [174.6, 207.7, 233.1, 261.6, 311.1, 349.2],
    nether: [146.8, 155.6, 196, 207.7, 233.1, 293.7],
    end: [220, 246.9, 277.2, 311.1, 349.2, 392, 440],
    cite: [130.8, 155.6, 174.6, 196, 233.1]
  };
  var musique = { prochaine: 0, phrase: 0, pos: 3 };
  function jouerMusique(t) {
    if (!S.musique || !sons.pret() || document.hidden || t < musique.prochaine) return;
    var g = GAMMES[S.dim] || GAMMES.surface;
    musique.pos = Math.max(0, Math.min(g.length - 1, musique.pos + Math.floor(Math.random() * 5) - 2));
    sons.douce(g[musique.pos], 0.045);
    if (Math.random() < 0.3) sons.douce(g[Math.max(0, musique.pos - 2)] / 2, 0.03);
    musique.phrase++;
    musique.prochaine = t + (musique.phrase % 8 == 0 ? 7000 + Math.random() * 6000 : 900 + Math.random() * 1600);
  }

  /* ================= Le bloc à miner ================= */
  var cube = $('cube'), cxCube = cube.getContext('2d');
  var anim = { tape: 0, pop: 0, survol: 0, t: 0 };
  function nouveauBloc() {
    var choix = DIM[S.dim].blocs, id;
    do { id = choix[Math.floor(Math.random() * choix.length)]; } while (choix.length > 1 && id == S.bloc);
    S.bloc = id; S.coups = 0;
    S.brillant = actif('pluie') || Math.random() < 0.04 * (a('oeil') ? 2 : 1);
    if (S.brillant) sons.brillant();
    majNomBloc();
  }
  function majNomBloc() {
    var b = D.BLOCS[S.bloc];
    $('bloc-nom').textContent = (S.brillant ? '✦ ' : '') + b.nom + (S.brillant ? ' ✦' : '');
    $('bloc-nom').classList.toggle('brillant', S.brillant);
    $('bloc-coups').textContent = S.coups + ' / ' + b.durete;
    $('bloc').setAttribute('aria-label', 'Miner : ' + b.nom + (S.brillant ? ', brillant' : '') + ' (' + S.coups + ' coups sur ' + b.durete + ')');
  }
  function frapper(x, y) {
    var t = Date.now();
    combo.n = t - combo.dernier < 650 ? Math.min(50, combo.n + 1) : 1;
    combo.dernier = t;
    if (combo.n > S.comboMax) S.comboMax = combo.n;
    S.missions.forEach(function (m) { if (m.id == 'combo' && combo.n > m.max) m.max = combo.n; });
    S.clics++;
    var v = J.clicBase * multCombo(), b = D.BLOCS[S.bloc];
    J.clic = v;
    gagner(v);
    S.coups += J.eclair ? b.durete : 1;
    sons.coup(b.son);
    anim.tape = 1;
    flottant(x, y, '+' + nombre(v, true), '');
    eclats(x, y, 5, T.texture(S.bloc).couleurs, 1);
    if (S.coups >= b.durete) casser(x, y, 1); else majNomBloc();
    if (S.clics == 1) verifierProgres();
    majCombo();
    marquer();
  }
  // la pioche fantôme (pouvoir) frappe toute seule, sans combo
  function frapperFantome() {
    var b = D.BLOCS[S.bloc], r = cube.getBoundingClientRect();
    gagner(J.clicBase);
    S.coups++;
    anim.tape = Math.max(anim.tape, 0.5);
    if (!document.hidden) { sons.coup(b.son, true); eclats(r.left + r.width * (0.3 + Math.random() * 0.4), r.top + r.height * 0.45, 2, T.texture(S.bloc).couleurs, 0.7); }
    if (S.coups >= b.durete) casser(r.left + r.width / 2, r.top + r.height / 3, 1); else majNomBloc();
  }
  function casser(x, y, mult) {
    var b = D.BLOCS[S.bloc], brille = S.brillant, bonus = b.durete * J.clicBase * J.fortune * (mult || 1) * (brille ? J.multBrillant : 1), r = cube.getBoundingClientRect();
    gagner(bonus);
    S.casses++;
    sons.casse(b.son);
    eclats(r.left + r.width / 2, r.top + r.height / 2, brille ? 60 : 34, brille ? T.texture(S.bloc).couleurs.concat(['#fff6b0', '#ffe066', '#ffffff']) : T.texture(S.bloc).couleurs, 2.2);
    flottant(x, y - 30, (brille ? 'Brillant ! ' : '') + b.nom + ' : +' + nombre(bonus), 'gros');
    if (brille) { S.brillants++; annonce('Bloc brillant cassé ! +' + blocs(bonus)); }
    nouveauBloc();
    anim.pop = 1;
    verifierProgres();
    return bonus;
  }
  function majCombo() {
    var e = $('combo'), vu = combo.n >= 5;
    e.hidden = !vu;
    if (vu) { var t = 'Combo ' + combo.n + ' · ×' + multCombo().toLocaleString('fr-FR', { maximumFractionDigits: 2 }); if (e._t != t) { e._t = t; e.textContent = t; } }
    e.classList.toggle('max', combo.n >= 50);
  }
  function dessinerCube(dt) {
    var w = cube.width, h = cube.height;
    anim.t += dt;
    anim.tape = Math.max(0, anim.tape - dt * 9);
    anim.pop = Math.max(0, anim.pop - dt * 4);
    var cible = $('bloc').matches(':hover') ? 1 : 0;
    anim.survol += (cible - anim.survol) * Math.min(1, dt * 10);
    var echelle = (1 - 0.07 * anim.tape + 0.03 * anim.survol) * (1 - 0.35 * anim.pop * anim.pop);
    var t = w * 0.31 * echelle, cy = h * 0.5 + Math.sin(anim.t * 2) * w * 0.012;
    cxCube.setTransform(1, 0, 0, 1, 0, 0);
    cxCube.clearRect(0, 0, w, h);
    if (S.brillant) { // halo doré
      var g = cxCube.createRadialGradient(w / 2, cy, t * 0.3, w / 2, cy, t * 1.6);
      g.addColorStop(0, 'rgba(255,224,102,' + (0.35 + 0.15 * Math.sin(anim.t * 5)) + ')'); g.addColorStop(1, 'rgba(255,224,102,0)');
      cxCube.fillStyle = g; cxCube.fillRect(0, 0, w, h);
    }
    cxCube.fillStyle = 'rgba(0,0,0,.35)';
    cxCube.beginPath(); cxCube.ellipse(w / 2, h * 0.5 + w * 0.36, w * 0.24 * echelle, w * 0.06 * echelle, 0, 0, Math.PI * 2); cxCube.fill();
    var fiss = Math.floor(10 * S.coups / D.BLOCS[S.bloc].durete);
    T.cube(cxCube, T.texture(S.bloc), w / 2, cy, t, fiss, anim.pop * 0.6 + anim.tape * 0.12 + (S.brillant ? 0.08 + 0.08 * Math.sin(anim.t * 6) : 0));
    if (S.brillant) { // étincelles
      var px = Math.max(2, Math.round(w / 90));
      for (var i = 0; i < 7; i++) {
        var ph = anim.t * 1.3 + i * 0.9, f = ph % 1, sx = w / 2 + Math.sin(i * 12.9898 + Math.floor(ph) * 7.1) * t * 0.95, sy = cy + Math.cos(i * 78.233 + Math.floor(ph) * 3.7) * t * 0.95;
        cxCube.globalAlpha = Math.sin(f * Math.PI);
        cxCube.fillStyle = i % 2 ? '#ffffff' : '#ffe066';
        cxCube.fillRect(sx - px * 1.5, sy - px / 2, px * 3, px); cxCube.fillRect(sx - px / 2, sy - px * 1.5, px, px * 3);
      }
      cxCube.globalAlpha = 1;
    }
  }
  function tailleCube() {
    var r = cube.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), n = Math.max(64, Math.round(r.width * dpr));
    if (cube.width != n) { cube.width = n; cube.height = n; }
  }

  /* ================= Éclats et nombres qui s'envolent ================= */
  var mine = $('mine'), toileEclats = $('eclats'), cxE = toileEclats.getContext('2d'), parts = [];
  function tailleEclats() {
    var r = mine.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    toileEclats.width = Math.round(r.width * dpr); toileEclats.height = Math.round(r.height * dpr);
    toileEclats._dpr = dpr;
  }
  function eclats(x, y, n, couleurs, force) {
    if (!S.particules) return;
    var r = mine.getBoundingClientRect();
    for (var i = 0; i < n && parts.length < 400; i++) {
      var an = Math.random() * Math.PI * 2, v = (60 + Math.random() * 160) * force;
      parts.push({ x: x - r.left, y: y - r.top, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 120 * force, vie: 0.6 + Math.random() * 0.5, c: couleurs[Math.floor(Math.random() * couleurs.length)], t: 4 + Math.random() * 5 });
    }
  }
  function dessinerEclats(dt) {
    var dpr = toileEclats._dpr || 1;
    cxE.setTransform(dpr, 0, 0, dpr, 0, 0);
    cxE.clearRect(0, 0, toileEclats.width, toileEclats.height);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vie -= dt; if (p.vie <= 0) { parts.splice(i, 1); continue; }
      p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      cxE.globalAlpha = Math.min(1, p.vie * 3);
      cxE.fillStyle = p.c; cxE.fillRect(Math.round(p.x), Math.round(p.y), p.t, p.t);
    }
    cxE.globalAlpha = 1;
  }
  var nbFlottants = 0;
  function flottant(x, y, txt, cls) {
    if (nbFlottants > 25 || document.hidden) return;
    var r = mine.getBoundingClientRect(), e = document.createElement('span');
    e.className = 'flottant ' + (cls || ''); e.textContent = txt;
    e.style.left = (x - r.left + (Math.random() * 30 - 15)) + 'px'; e.style.top = (y - r.top - 10) + 'px';
    mine.appendChild(e); nbFlottants++;
    setTimeout(function () { e.remove(); nbFlottants--; }, cls == 'gros' ? 1600 : 1000);
  }

  /* ================= Dimensions ================= */
  function dimDebloquee(d) { return d.machine ? (S.machines[d.machine] || 0) > 0 : S.totalAll >= d.seuil; }
  function majDimensions() {
    var nouvelle = null;
    D.DIMENSIONS.forEach(function (d) { if (S.dims.indexOf(d.id) < 0 && dimDebloquee(d)) { S.dims.push(d.id); nouvelle = d; } });
    if (nouvelle) { choisirDim(nouvelle.id); annonce('Nouvelle dimension : ' + nouvelle.nom + ' !'); }
  }
  function choisirDim(id) {
    if (S.dims.indexOf(id) < 0) return;
    var change = S.dim != id;
    S.dim = id;
    if (S.vues.indexOf(id) < 0) S.vues.push(id);
    if (change || DIM[id].blocs.indexOf(S.bloc) < 0) { nouveauBloc(); anim.pop = 1; }
    appliquerFond(); afficherDims(); marquer();
  }
  function appliquerFond() {
    var d = DIM[S.dim], b = document.body;
    b.dataset.dim = d.id;
    var sol = 'url(' + T.fond(d.fond) + ') 0 0 / 64px 64px';
    b.style.background = d.id == 'surface'
      ? 'linear-gradient(180deg,' + d.ciel[0] + ' 0,' + d.ciel[1] + ' 30vh,#5d9b37 30vh,#4f8a2e calc(30vh + 12px),rgba(0,0,0,0) calc(30vh + 12px)),' + sol + ',#5d4029'
      : 'linear-gradient(180deg,' + d.ciel[0] + 'f0 0,' + d.ciel[1] + 'a0 40%,' + d.ciel[0] + '60 100%),' + sol + ',' + d.ciel[0];
    document.querySelector('meta[name="theme-color"]').content = d.ciel[0];
  }
  function afficherDims() {
    var el = $('dims'); el.innerHTML = '';
    D.DIMENSIONS.forEach(function (d) {
      var ok = S.dims.indexOf(d.id) >= 0, b = document.createElement('button');
      b.type = 'button'; b.className = 'dim' + (d.id == S.dim ? ' choisie' : '');
      if (ok) {
        b.innerHTML = '<img alt="" src="' + T.plat(d.blocs[0]) + '"><span>' + echappe(d.nom) + '</span>';
        b.setAttribute('aria-pressed', d.id == S.dim);
        b.title = d.nom; b.setAttribute('aria-label', 'Aller : ' + d.nom);
        b.onclick = function () { choisirDim(d.id); };
      } else {
        b.disabled = true; b.innerHTML = '<span class="cadenas" aria-hidden="true">?</span><span>???</span>';
        b.title = d.machine ? 'À débloquer : obtenir ' + MACHINE[d.machine].premier.replace(/^(ton|ta) (premier|première) /, function (m, x, p) { return p == 'premier' ? 'un ' : 'une '; }) : 'À débloquer : miner ' + blocs(d.seuil) + ' au total';
        b.setAttribute('aria-label', 'Dimension verrouillée. ' + b.title);
      }
      el.appendChild(b);
    });
  }

  /* ================= Capacités ================= */
  function capaDebloquee(c) { return c.cond.machine ? (S.machines[c.cond.machine] || 0) >= c.cond.n : S.clics >= c.cond.clics; }
  function capaPrete(c) { return (S.recharges[c.id] || 0) <= Date.now(); }
  function utiliserCapacite(id) {
    var c = CAPA[id];
    if (!c || !capaDebloquee(c) || !capaPrete(c)) { sons.non(); return false; }
    var r = cube.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 3;
    S.capacites++;
    S.recharges[id] = Date.now() + c.recharge * J.multRecharge * 1000;
    if (id == 'tnt') {
      var prod = J.cps * 60;
      gagner(prod);
      sons.boum();
      document.body.classList.remove('secousse'); void document.body.offsetWidth; document.body.classList.add('secousse');
      eclats(x, y, 40, ['#c62828', '#ff7a6b', '#ffffff', '#ff9a3c'], 2.6);
      var bonus = casser(x, y, 5);
      annonce('BOUM ! Le bloc explose : +' + blocs(bonus + prod));
    } else if (id == 'balise') {
      sons.capacite();
      apparaitre('coffre');
      annonce('La balise attire un coffre au trésor !');
    } else {
      if (id == 'cloche') sons.cloche(); else sons.capacite();
      ajouterEffet(id, id == 'hate' ? 'Clics ×10' : 'Machines ×3', c.duree * J.multDuree);
      annonce(c.nom + ' ! ' + c.desc);
    }
    majCapacites(true); verifierProgres(); marquer();
    return true;
  }
  function majCapacites(forcer) {
    var el = $('capas'), t = Date.now(), visibles = D.CAPACITES.filter(capaDebloquee);
    el.hidden = !visibles.length;
    var cle = visibles.map(function (c) { return c.id; }).join();
    if (forcer === 'construire' || el._cle != cle) {
      el._cle = cle; el.innerHTML = '';
      visibles.forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'capa'; b.dataset.id = c.id;
        b.innerHTML = '<img alt="" src="' + T.sprite(c.icone) + '"><span class="capa-t"></span><i class="capa-r"></i>';
        b.onclick = function () { utiliserCapacite(c.id); };
        el.appendChild(b);
      });
    }
    Array.prototype.forEach.call(el.children, function (b) {
      var c = CAPA[b.dataset.id], reste = Math.max(0, ((S.recharges[c.id] || 0) - t) / 1000), total = c.recharge * J.multRecharge;
      var pret = reste <= 0, txt = pret ? '' : (reste >= 60 ? Math.ceil(reste / 60) + ' min' : Math.ceil(reste) + ' s');
      b.classList.toggle('prete', pret);
      b.querySelector('.capa-t').textContent = txt;
      b.querySelector('.capa-r').style.height = pret ? '0' : Math.min(100, 100 * reste / total) + '%';
      var titre = c.nom + ' : ' + c.desc + (pret ? ' Prête !' : ' Recharge : ' + txt + '.');
      if (b.title != titre) { b.title = titre; b.setAttribute('aria-label', titre); }
    });
  }

  /* ================= Boutique ================= */
  function amelVisible(u) {
    if (S.amels.indexOf(u.id) >= 0) return false;
    var c = u.cond;
    if (c.total != null && S.total < c.total) return false;
    if (c.clics != null && S.clics < c.clics) return false;
    if (c.casses != null && S.casses < c.casses) return false;
    if (c.coffres != null && S.coffres < c.coffres) return false;
    if (c.comboMax != null && S.comboMax < c.comboMax) return false;
    if (c.brillants != null && S.brillants < c.brillants) return false;
    if (c.capacites != null && S.capacites < c.capacites) return false;
    if (c.machine && (S.machines[c.machine] || 0) < c.n) return false;
    return true;
  }
  function acheterMachine(id) {
    var m = MACHINE[id], n = S.machines[id] || 0, q = S.qte == 'max' ? maxAchetable(m) : S.qte, p = prixMachine(m, n, q);
    if (q < 1 || S.blocs < p) { sons.non(); return false; }
    S.blocs -= p; S.machines[id] = n + q; S.achats += q; S.maxAchat = Math.max(S.maxAchat, q);
    sons.achat(); recalculer(); majDimensions(); verifierProgres(); verifierMissions(); majBoutique(); majCapacites(); marquer();
    return true;
  }
  function acheterAmel(id, silence) {
    var u = AMEL[id];
    if (!u || !amelVisible(u) || S.blocs < prixAmel(u)) { if (!silence) sons.non(); return false; }
    S.blocs -= prixAmel(u); S.amels.push(id); S.amelsAchetees++;
    recalculer();
    if (!silence) { sons.achat(); verifierProgres(); verifierMissions(); amelChoisie = null; $('amel-info').hidden = true; majBoutique(); }
    if (u.effet == 'clic') appliquerCurseur();
    marquer();
    return true;
  }
  // « Tout acheter » : les améliorations abordables, de la moins chère à la plus chère
  function acheterTout() {
    var n = 0, encore = true;
    while (encore) {
      encore = false;
      var liste = D.AMELIORATIONS.filter(amelVisible).sort(function (x, y) { return x.prix - y.prix; });
      for (var i = 0; i < liste.length; i++) if (S.blocs >= prixAmel(liste[i]) && acheterAmel(liste[i].id, true)) { n++; encore = true; break; }
    }
    if (!n) { sons.non(); return 0; }
    sons.achat(); verifierProgres(); verifierMissions(); amelChoisie = null; $('amel-info').hidden = true; majBoutique();
    annonce(pluriel(n, 'amélioration achetée', 'améliorations achetées'));
    return n;
  }
  function appliquerCurseur() { $('bloc').style.cursor = 'url(' + T.curseur(matierePioche()) + ') 4 4, pointer'; }

  var lignesMachines = {};
  function construireMachines() {
    var el = $('machines'); el.innerHTML = '';
    D.MACHINES.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'machine'; b.dataset.id = m.id;
      b.innerHTML = '<img class="ic" alt="" src="' + T.sprite({ s: m.id }) + '"><span class="m-txt"><b class="m-nom"></b><small class="m-info"></small></span>' +
        '<span class="m-droite"><span class="prix"><small class="m-q"></small><i class="bloc-ic" aria-hidden="true"></i><span class="m-prix"></span></span><b class="m-n"></b></span>';
      b.onclick = function () { acheterMachine(m.id); };
      el.appendChild(b);
      lignesMachines[m.id] = { el: b, nom: b.querySelector('.m-nom'), info: b.querySelector('.m-info'), prix: b.querySelector('.m-prix'), q: b.querySelector('.m-q'), n: b.querySelector('.m-n'), cache: {} };
    });
  }
  function maj(l, cle, el, val, prop) { if (l.cache[cle] !== val) { l.cache[cle] = val; if (prop) el[prop] = val; else el.textContent = val; } }
  var cleAmels = '', amelChoisie = null;
  function majBoutique() {
    // machines : visibles une fois approchées ; la suivante reste mystérieuse
    var mystere = false;
    D.MACHINES.forEach(function (m, i) {
      var l = lignesMachines[m.id], n = S.machines[m.id] || 0, vue = n > 0 || i == 0 || S.total >= m.prix * 0.4, q = qteVoulue(m), p = prixMachine(m, n, q);
      var montrer = vue || !mystere;
      if (!vue) mystere = true;
      l.el.hidden = !montrer;
      if (!montrer) return;
      maj(l, 'cls', l.el, 'machine' + (vue ? '' : ' inconnue') + (S.blocs >= p ? ' ok' : ''), 'className');
      maj(l, 'nom', l.nom, vue ? m.nom : '???');
      maj(l, 'prix', l.prix, nombre(p));
      maj(l, 'q', l.q, q > 1 || S.qte != 1 ? '×' + q : '');
      maj(l, 'n', l.n, n ? String(n) : '');
      var part = J.cpsBase > 0 ? Math.round(100 * n * J.parMachine[m.id] / J.cpsBase) : 0;
      maj(l, 'info', l.info, vue ? nombre(J.parMachine[m.id], true) + '/s chacun' + (n ? ' · ' + part + ' % de ta production' : '') : 'Continue à miner pour la découvrir');
      maj(l, 'aria', l.el, (vue ? m.nom + '. ' + m.desc : 'Machine inconnue.') + ' Prix pour ' + q + ' : ' + blocs(p) + '. Tu en as ' + n + '.', 'title');
    });
    // améliorations : la grille n'est reconstruite que si la liste change
    var liste = D.AMELIORATIONS.filter(amelVisible).sort(function (x, y) { return x.prix - y.prix; });
    var cle = liste.map(function (u) { return u.id; }).join();
    if (cle != cleAmels) {
      cleAmels = cle;
      var g = $('amels'); g.innerHTML = '';
      liste.forEach(function (u) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'amel'; b.dataset.id = u.id;
        b.innerHTML = '<img alt="" src="' + T.sprite(u.icone) + '">';
        b.setAttribute('aria-label', u.nom + ' : ' + u.desc + ' Prix : ' + blocs(prixAmel(u)));
        b.addEventListener('pointerenter', function (e) { if (e.pointerType != 'touch') infoAmel(u.id); });
        b.addEventListener('focus', function () { infoAmel(u.id); });
        b.addEventListener('pointerleave', function (e) { if (e.pointerType != 'touch' && amelChoisie != u.id) $('amel-info').hidden = true; });
        b.addEventListener('click', function () {
          // au doigt : un premier appui montre la description, le second achète
          if (dernierPointeur == 'touch' && amelChoisie != u.id) { amelChoisie = u.id; infoAmel(u.id); return; }
          acheterAmel(u.id);
        });
        g.appendChild(b);
      });
      $('amels-vide').hidden = liste.length > 0;
      if (amelChoisie && cle.split(',').indexOf(amelChoisie) < 0) { amelChoisie = null; $('amel-info').hidden = true; }
    }
    var abordables = 0;
    Array.prototype.forEach.call($('amels').children, function (b) { var ok = S.blocs >= prixAmel(AMEL[b.dataset.id]); if (ok) abordables++; b.classList.toggle('ok', ok); b.classList.toggle('choisie', b.dataset.id == amelChoisie); });
    var bt = $('b-tout'); bt.hidden = abordables < 2;
    var tt = 'Tout acheter (' + abordables + ')'; if (bt.textContent != tt) bt.textContent = tt;
    if (!$('amel-info').hidden && $('amel-info').dataset.id) infoAmel($('amel-info').dataset.id);
  }
  function infoAmel(id) {
    var u = AMEL[id], el = $('amel-info');
    if (!u) return;
    var ok = S.blocs >= prixAmel(u), html = '<b class="i-nom">' + echappe(u.nom) + '</b><span class="i-prix' + (ok ? ' ok' : '') + '"><i class="bloc-ic" aria-hidden="true"></i>' + nombre(prixAmel(u)) + '</span><span class="i-desc">' + echappe(u.desc) + '</span>' +
      (dernierPointeur == 'touch' && amelChoisie == id ? '<span class="i-aide">' + (ok ? 'Touche encore pour acheter' : 'Pas encore assez de blocs') + '</span>' : '');
    if (el.dataset.id == id && el._html == html && !el.hidden) return;
    el.dataset.id = id; el._html = html; el.innerHTML = html; el.hidden = false;
  }

  /* ================= Progrès ================= */
  function verifierProgres() {
    var nouveaux = [];
    D.PROGRES.forEach(function (p) { if (S.progres.indexOf(p.id) < 0 && p.test(S, J)) { S.progres.push(p.id); nouveaux.push(p); } });
    if (!nouveaux.length) return;
    recalculer();
    sons.progres();
    nouveaux.forEach(function (p, i) { setTimeout(function () { toast(p.icone, 'Progrès réalisé !', p.nom); }, i * 700); });
    afficherProgres();
  }
  function toast(icone, titre, nom) {
    var box = $('toasts');
    while (box.children.length >= 3) box.firstChild.remove();
    var e = document.createElement('div');
    e.className = 'toast';
    e.innerHTML = '<img alt="" src="' + T.sprite(icone) + '"><span><b>' + echappe(titre) + '</b><span>' + echappe(nom) + '</span></span>';
    box.appendChild(e);
    setTimeout(function () { e.classList.add('part'); }, 4200);
    setTimeout(function () { e.remove(); }, 4700);
  }
  function afficherProgres() {
    var g = $('progres'); g.innerHTML = '';
    D.PROGRES.forEach(function (p) {
      var ok = S.progres.indexOf(p.id) >= 0, b = document.createElement('button');
      b.type = 'button'; b.className = 'trophee' + (ok ? ' ok' : '');
      b.innerHTML = '<img alt="" src="' + T.sprite(p.icone) + '">';
      b.setAttribute('aria-label', (ok ? 'Obtenu : ' : 'À obtenir : ') + p.nom + '. ' + texte(p.desc));
      var montre = function () { var i = $('prog-info'); i.hidden = false; i.innerHTML = '<b class="i-nom">' + echappe(p.nom) + '</b><span class="i-prix' + (ok ? ' ok' : '') + '">' + (ok ? 'Obtenu' : 'À obtenir') + '</span><span class="i-desc">' + echappe(texte(p.desc)) + '</span>'; };
      b.addEventListener('pointerenter', montre); b.addEventListener('focus', montre); b.addEventListener('click', montre);
      g.appendChild(b);
    });
    var n = S.progres.length;
    $('prog-resume').textContent = n + ' / ' + D.PROGRES.length + ' progrès · chacun ajoute 1 % de production (+' + n + ' %)';
    $('xp-niv').textContent = n;
    $('xp-i').style.width = (100 * n / D.PROGRES.length) + '%';
    $('xp').title = n + ' progrès sur ' + D.PROGRES.length + ' : +' + n + ' % de production';
  }

  /* ================= Missions ================= */
  function compteur(id) {
    return { clics: S.clics, casses: S.casses, miner: S.totalAll, achats: S.achats, amels: S.amelsAchetees, coffres: S.coffres, brillants: S.brillants, capacites: S.capacites }[id] || 0;
  }
  function avancement(m) { return m.id == 'combo' ? m.max : compteur(m.id) - m.depart; }
  function missionTxt(m) { return texte(MISSION[m.id].txt.replace('{n}', '{' + m.but + '}')).replace(/\(s\)/g, m.but > 1 ? 's' : ''); }
  function nbMissions() { return a('guilde') ? 4 : 3; }
  function nouvelleMission() {
    var pris = S.missions.map(function (m) { return m.id; });
    var choix = D.MISSIONS.filter(function (m) {
      if (pris.indexOf(m.id) >= 0) return false;
      if (m.id == 'capacites') return D.CAPACITES.some(capaDebloquee);
      if (m.id == 'amels') return D.AMELIORATIONS.some(amelVisible) || S.total > 1000;
      if (m.id == 'coffres' || m.id == 'brillants') return S.totalAll > 200;
      return true;
    });
    var t = choix[Math.floor(Math.random() * choix.length)];
    var but = t.buts ? t.buts[Math.floor(Math.random() * t.buts.length)] : rond(Math.max(300, J.cpsBase * 300 + J.clicBase * 150));
    S.missions.push({ id: t.id, but: but, depart: compteur(t.id), max: 0 });
  }
  function recompense() { return (Math.max(J.clicBase * 150, J.cpsBase * 600) + 50) * (a('guilde') ? 2 : 1); }
  function verifierMissions() {
    var fini = false;
    for (var i = S.missions.length - 1; i >= 0; i--) {
      var m = S.missions[i];
      if (avancement(m) >= m.but) {
        var g = recompense();
        gagner(g); S.missionsFaites++;
        S.missions.splice(i, 1);
        sons.mission();
        toast({ s: 'parchemin' }, 'Mission accomplie ! +' + nombre(g), missionTxt(m));
        fini = true;
      }
    }
    while (S.missions.length < nbMissions()) nouvelleMission();
    if (fini) { verifierProgres(); marquer(); }
    if (!$('p-progres').hidden) afficherMissions();
  }
  function afficherMissions() {
    var g = recompense(), html = S.missions.map(function (m) {
      var av = Math.min(m.but, Math.max(0, avancement(m)));
      return '<li class="mission"><img alt="" src="' + T.sprite({ s: 'parchemin' }) + '"><span class="mi-txt"><b>' + echappe(missionTxt(m)) + '</b>' +
        '<span class="mi-barre"><i style="width:' + (100 * av / m.but) + '%"></i></span><small>' + nombre(av) + ' / ' + nombre(m.but) + '</small></span></li>';
    }).join('');
    if ($('missions')._html != html) { $('missions')._html = html; $('missions').innerHTML = html; }
    $('missions-txt').textContent = 'Récompense : environ ' + blocs(g) + ' par mission · ' + pluriel(S.missionsFaites, 'mission terminée', 'missions terminées');
  }

  /* ================= Coffres au trésor et creepers ================= */
  var prochain = 0, evenement = null;
  function planifier(premier) {
    var b = premier ? [35, 90] : [70, 190];
    prochain = Date.now() + (b[0] + Math.random() * (b[1] - b[0])) * Math.pow(0.75, J.mods.chance) * (a('trefle') ? 0.8 : 1) * (saison() ? 0.75 : 1) * 1000;
  }
  function apparaitre(type) {
    if (evenement) finir(false);
    type = type || (S.total > 500 && Math.random() < 0.15 ? 'creeper' : 'coffre');
    var sa = type == 'coffre' && SAISONS[saison()];
    var e = document.createElement('button'), vie = type == 'creeper' ? (a('creeper') ? 6 : 4) : 13 * (J.mods.duree ? 1.5 : 1);
    e.type = 'button'; e.className = 'evenement ' + type;
    e.innerHTML = '<img alt="" src="' + T.sprite({ s: sa ? sa.sprite : type }) + '">';
    e.setAttribute('aria-label', type == 'creeper' ? 'Un creeper ! Clique vite pour le désamorcer' : sa ? 'Un ' + sa.nom + ' ! Clique pour l\'ouvrir' : 'Un coffre au trésor ! Clique pour l\'ouvrir');
    e.style.left = (8 + Math.random() * 78) + 'vw'; e.style.top = (14 + Math.random() * 66) + 'vh';
    e.style.setProperty('--vie', vie + 's');
    e.addEventListener('pointerdown', function (ev) { ev.preventDefault(); finir(true, ev.clientX, ev.clientY); });
    e.addEventListener('click', function (ev) { if (ev.detail === 0) { var r = e.getBoundingClientRect(); finir(true, r.left + r.width / 2, r.top + r.height / 2); } });
    $('evenements').appendChild(e);
    evenement = { type: type, saison: sa ? saison() : null, el: e, minuteur: setTimeout(function () { finir(false); }, vie * 1000), son: type == 'creeper' ? sons.siffle(vie) : (sons.apparait(), null) };
    return e;
  }
  function finir(clique, x, y) {
    var ev = evenement; if (!ev) return;
    evenement = null;
    clearTimeout(ev.minuteur); sons.couper(ev.son);
    var r = ev.el.getBoundingClientRect();
    if (x == null) { x = r.left + r.width / 2; y = r.top + r.height / 2; }
    ev.el.remove();
    planifier(false);
    if (ev.type == 'coffre' && clique) ouvrirCoffre(x, y, ev.saison);
    else if (ev.type == 'creeper' && clique) {
      var g = (Math.max(J.clicBase * 60, Math.min(S.blocs * 0.3, J.cpsBase * 1800)) + 13) * (a('creeper') ? 2 : 1);
      gagner(g); S.creepers++;
      sons.coffre();
      eclats(x, y, 24, ['#3fbf4a', '#1d7a2c', '#555', '#888'], 1.5);
      annonce('Creeper désamorcé ! Tu récupères sa poudre : +' + blocs(g));
    } else if (ev.type == 'creeper') {
      S.boums++;
      sons.boum();
      eclats(x, y, 50, ['#3fbf4a', '#1d7a2c', '#ffffff', '#888', '#ff9a3c'], 2.6);
      document.body.classList.remove('secousse'); void document.body.offsetWidth; document.body.classList.add('secousse');
      annonce('BOUM ! Le creeper a explosé… mais tu n\'as rien perdu, ouf !');
    }
    verifierProgres(); verifierMissions(); marquer();
  }
  function ajouterEffet(id, desc, d) {
    effets = effets.filter(function (e) { return e.id != id; });
    effets.push({ id: id, desc: desc, fin: Date.now() + d * 1000, duree: d });
    recalculer();
  }
  function ouvrirCoffre(x, y, sai) {
    S.coffres++;
    if (sai == 'halloween') S.citrouilles++;
    if (sai == 'noel') S.cadeaux++;
    sons.coffre();
    var possibles = D.EFFETS.filter(function (e) { return !e.duree || !actif(e.id); });
    var somme = possibles.reduce(function (s, e) { return s + e.poids; }, 0), r = Math.random() * somme, choix = possibles[0];
    for (var i = 0; i < possibles.length; i++) { r -= possibles[i].poids; if (r <= 0) { choix = possibles[i]; break; } }
    eclats(x, y, 24, sai == 'halloween' ? ['#d9822b', '#f0b45a', '#f5d042', '#1d1d1d'] : sai == 'noel' ? ['#c62828', '#3fbf4a', '#ffffff', '#f5d042'] : ['#f5d042', '#fff6b0', '#b8874a', '#3fd8e0'], 1.4);
    var quoi = sai == 'halloween' ? 'Citrouille ! ' : sai == 'noel' ? 'Cadeau ! ' : '';
    if (choix.id == 'fortune') {
      var g = Math.max(J.clicBase * 30, Math.min(S.blocs * 0.15, J.cpsBase * 900)) + 13;
      gagner(g);
      annonce(quoi + 'Trésor ! +' + blocs(g));
      flottant(x, y, '+' + nombre(g), 'gros');
    } else {
      var d = choix.duree * (J.mods.duree ? 2 : 1) * J.multDuree;
      var desc = choix.id == 'frenesie' ? 'Production ×' + J.multFrenesie : choix.desc;
      ajouterEffet(choix.id, desc, d);
      if (choix.id == 'pluie' && !S.brillant) { S.brillant = true; majNomBloc(); sons.brillant(); }
      annonce(quoi + choix.nom + ' ! ' + desc + ' pendant ' + Math.round(d) + ' secondes');
    }
  }
  function afficherEffets() {
    var t = Date.now(), el = $('effets'), sa = SAISONS[saison()], html = (sa ? '<span class="effet effet-saison"><b>' + echappe(sa.chip) + '<span class="long">' + echappe(sa.long) + '</span></b></span>' : '') + effets.map(function (e) {
      var reste = Math.max(0, (e.fin - t) / 1000);
      return '<span class="effet effet-' + e.id + '"><b>' + echappe(e.desc) + '</b> ' + Math.ceil(reste) + ' s<i style="width:' + (100 * reste / e.duree) + '%"></i></span>';
    }).join('');
    if (el._html != html) { el._html = html; el.innerHTML = html; }
  }

  /* ================= Renaissance, étoiles et pouvoirs ================= */
  function seuil(k) { return Math.pow(k, 3) * SEUIL_ETOILE; }
  function etoilesPossibles() { return Math.floor(Math.cbrt(S.totalAll / SEUIL_ETOILE) + 1e-9); }
  function gainEtoiles() { return Math.max(0, etoilesPossibles() - S.etoiles); }
  function prochaineEtoile() { return seuil(Math.max(etoilesPossibles(), S.etoiles) + 1); }
  function demanderRenaissance() {
    var g = gainEtoiles();
    if (g < 1) {
      dialogue('Renaître', '<p>Il faut avoir miné ' + blocs(prochaineEtoile()) + ' au total (toutes vies) pour gagner une étoile du Nether de plus.</p><p>Encore ' + blocs(prochaineEtoile() - S.totalAll) + ' à miner' + (J.cps > 0 ? ', soit environ ' + duree((prochaineEtoile() - S.totalAll) / J.cps) + ' à ta vitesse actuelle' : '') + '.</p><p>Toutes les explications sont dans l\'onglet <b>Étoiles</b>.</p>', [{ t: 'D\'accord' }]);
      return;
    }
    var apres = S.etoiles + g;
    dialogue('Renaître ?',
      '<p>Tu gagnes <b class="jaune">' + pluriel(g, 'étoile du Nether', 'étoiles du Nether') + '</b> et <b class="violet">' + pluriel(g, 'fragment d\'étoile', 'fragments d\'étoile') + '</b>.</p>' +
      '<ul class="liste-ren"><li>Production : <b>+' + S.etoiles * J.pctEtoile + ' % → +' + apres * J.pctEtoile + ' %</b>, pour toujours.</li>' +
      '<li>Fragments : <b>' + S.fragments + ' → ' + (S.fragments + g) + '</b>, à dépenser dans la boutique céleste.</li></ul>' +
      '<p class="perdu"><b>Tu perds :</b> tes ' + blocs(S.blocs) + ', tes ' + pluriel(D.MACHINES.reduce(function (s, m) { return s + (S.machines[m.id] || 0); }, 0), 'machine') + ' et tes ' + pluriel(S.amels.length, 'amélioration') + '.</p>' +
      '<p class="garde"><b>Tu gardes :</b> les progrès, les dimensions, les pouvoirs, les missions et les statistiques.</p>' +
      (a('depart') ? '<p>Ton sac de départ te redonne 10 pioches et 5 mineurs.</p>' : ''),
      [{ t: 'Annuler' }, { t: 'Renaître', cls: 'vert', f: renaitre }]);
  }
  function renaitre() {
    var g = gainEtoiles(); if (g < 1) return false;
    S.etoiles += g; S.fragments += g; S.renaissances++;
    S.blocs = 0; S.total = 0; S.machines = {}; S.amels = []; S.debutVie = Date.now(); S.coups = 0;
    if (a('depart')) { S.machines.pioche = 10; S.machines.mineur = 5; }
    effets = [];
    recalculer(); appliquerCurseur(); cleAmels = null; majBoutique(); verifierProgres(); afficherProgres(); afficherEtoiles(); majCapacites(); sauver();
    eclats(innerWidth / 2, innerHeight / 2, 60, ['#ffffff', '#f5d042', '#d18cff'], 2.5);
    annonce('Nouvelle vie ! ' + pluriel(S.etoiles, 'étoile du Nether', 'étoiles du Nether') + ' : +' + S.etoiles * J.pctEtoile + ' % de production. ' + pluriel(S.fragments, 'fragment', 'fragments') + ' à dépenser.');
    return true;
  }
  function acheterPouvoir(id) {
    var p = POUVOIR[id];
    if (!p || a(id) || S.fragments < p.prix) { sons.non(); return false; }
    S.fragments -= p.prix; S.pouvoirs.push(id);
    sons.progres(); recalculer(); verifierProgres();
    if (id == 'guilde') verifierMissions();
    toast(p.icone, 'Pouvoir obtenu !', p.nom);
    afficherEtoiles(); majBoutique(); marquer();
    return true;
  }
  function afficherEtoiles() {
    var g = gainEtoiles(), poss = etoilesPossibles(), suiv = Math.max(poss, S.etoiles) + 1, base = seuil(suiv - 1), fin = seuil(suiv);
    var av = Math.max(0, Math.min(1, (S.totalAll - base) / (fin - base))), reste = Math.max(0, fin - S.totalAll);
    $('et-nb').textContent = pluriel(S.etoiles, 'étoile du Nether', 'étoiles du Nether');
    $('et-bonus').textContent = '+' + S.etoiles * J.pctEtoile + ' % de production (' + J.pctEtoile + ' % par étoile)';
    $('et-frag').textContent = pluriel(S.fragments, 'fragment d\'étoile', 'fragments d\'étoile') + ' à dépenser';
    $('et-gain').innerHTML = g >= 1
      ? 'Si tu renais maintenant : <b class="jaune">+' + pluriel(g, 'étoile', 'étoiles') + '</b> et <b class="violet">+' + pluriel(g, 'fragment', 'fragments') + '</b>. Ta production passera de +' + S.etoiles * J.pctEtoile + ' % à <b>+' + (S.etoiles + g) * J.pctEtoile + ' %</b>.'
      : 'Pas encore d\'étoile à gagner : continue à miner !';
    $('o-renaitre').disabled = g < 1;
    $('o-renaitre').textContent = g >= 1 ? 'Renaître (+' + g + ' ★)' : 'Renaître';
    $('et-barre').style.width = (100 * av) + '%';
    $('et-prochaine').textContent = 'Étoile n° ' + suiv + ' à ' + blocs(fin) + ' minés au total. Encore ' + blocs(reste) +
      (J.cps > 0 ? ', environ ' + duree(reste / J.cps) + ' à ta vitesse actuelle.' : '.');
    $('et-total').textContent = 'Minés au total (toutes vies) : ' + blocs(S.totalAll);
    var paliers = [1, 2, 3, 5, 10, 25, 50, 100, 250, 1000], html = paliers.map(function (k) {
      var ok = poss >= k;
      return '<tr class="' + (ok ? 'ok' : '') + '"><td>' + k + ' ★</td><td>' + blocs(seuil(k)) + '</td><td>+' + k * J.pctEtoile + ' %</td><td>' + (ok ? '✓' : '') + '</td></tr>';
    }).join('');
    if ($('et-paliers')._html != html) { $('et-paliers')._html = html; $('et-paliers').innerHTML = html; }
    var box = $('pouvoirs'), cle = S.pouvoirs.join() + '|' + S.fragments;
    if (box._cle != cle) {
      box._cle = cle;
      box.innerHTML = '';
      D.POUVOIRS.forEach(function (p) {
        var eu = a(p.id), ok = !eu && S.fragments >= p.prix, el = document.createElement('div');
        el.className = 'pouvoir' + (eu ? ' eu' : ok ? ' ok' : '');
        el.innerHTML = '<img alt="" src="' + T.sprite(p.icone) + '"><span class="po-txt"><b>' + echappe(p.nom) + '</b><small>' + echappe(p.desc) + '</small></span>';
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'btn-mc po-btn';
        b.textContent = eu ? 'Obtenu' : p.prix + ' ✦';
        b.disabled = eu || !ok;
        b.setAttribute('aria-label', eu ? p.nom + ' : obtenu' : 'Acheter ' + p.nom + ' pour ' + pluriel(p.prix, 'fragment'));
        b.onclick = function () { acheterPouvoir(p.id); };
        el.appendChild(b);
        box.appendChild(el);
      });
      $('pouvoirs-txt').textContent = S.pouvoirs.length + ' / ' + D.POUVOIRS.length + ' pouvoirs · ' + pluriel(S.fragments, 'fragment disponible', 'fragments disponibles');
    }
  }

  /* ================= Statistiques et options ================= */
  function afficherStats() {
    var lignes = [
      ['Blocs en réserve', blocs(S.blocs)],
      ['Production', blocs(J.cps, true) + ' par seconde' + (J.frenesie ? ' (frénésie !)' : '')],
      ['Valeur d\'un clic', blocs(J.clicBase, true) + (combo.n > 1 ? ' (×' + multCombo().toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' avec le combo)' : '')],
      ['Bonus quand un bloc casse', '×' + nombre(J.fortune) + ' (' + blocs(D.BLOCS[S.bloc].durete * J.clicBase * J.fortune) + ' pour ce bloc, ×' + J.multBrillant + ' s\'il brille)'],
      ['Minés dans cette vie', blocs(S.total)],
      ['Minés au total', blocs(S.totalAll)],
      ['Clics sur le bloc', nombre(S.clics) + ' · meilleur combo : ' + S.comboMax],
      ['Blocs cassés', nombre(S.casses) + ' (dont ' + nombre(S.brillants) + ' brillant' + (S.brillants > 1 ? 's' : '') + ')'],
      ['Machines', nombre(D.MACHINES.reduce(function (s, m) { return s + (S.machines[m.id] || 0); }, 0)) + ' (' + nombre(S.achats) + ' achetées en tout)'],
      ['Améliorations', S.amels.length + ' / ' + D.AMELIORATIONS.length],
      ['Coffres ouverts', nombre(S.coffres) + (S.citrouilles ? ' · ' + S.citrouilles + ' citrouille' + (S.citrouilles > 1 ? 's' : '') : '') + (S.cadeaux ? ' · ' + S.cadeaux + ' cadeau' + (S.cadeaux > 1 ? 'x' : '') : '')],
      ['Creepers désamorcés', nombre(S.creepers) + (S.boums ? ' (et ' + pluriel(S.boums, 'explosion') + ')' : '')],
      ['Capacités utilisées', nombre(S.capacites)],
      ['Missions terminées', nombre(S.missionsFaites)],
      ['Multiplicateur de production', '×' + J.mult.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' (améliorations +' + J.mods.global + ' %, progrès +' + J.multProgres + ' %, étoiles +' + J.multEtoiles + ' %)'],
      ['Renaissances', nombre(S.renaissances) + ' · ' + pluriel(S.etoiles, 'étoile') + ' · ' + S.pouvoirs.length + ' pouvoir' + (S.pouvoirs.length > 1 ? 's' : '')],
      ['Temps de jeu', duree(S.tempsJeu) + ' (cette vie : ' + duree((Date.now() - S.debutVie) / 1000) + ')'],
      ['Partie commencée le', new Date(S.debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })]
    ];
    var html = lignes.map(function (l) { return '<dt>' + l[0] + '</dt><dd>' + echappe(l[1]) + '</dd>'; }).join('');
    if ($('stats')._html != html) { $('stats')._html = html; $('stats').innerHTML = html; }
  }
  var NOTATIONS = { mots: 'en mots (1,2 million)', court: 'courte (1,2 M)', sci: 'scientifique (1,2e6)' };
  function majOptions() {
    var bas = function (id, oui, txt) { $(id).setAttribute('aria-pressed', oui); $(id).textContent = txt; };
    bas('o-son', S.son, 'Son : ' + (S.son ? 'activé' : 'coupé'));
    bas('o-musique', S.musique, 'Musique : ' + (S.musique ? 'activée' : 'coupée'));
    bas('o-parts', S.particules, 'Éclats : ' + (S.particules ? 'activés' : 'désactivés'));
    $('o-notation').textContent = 'Nombres : ' + NOTATIONS[S.notation];
    $('b-son').setAttribute('aria-pressed', S.son); $('b-son').classList.toggle('coupe', !S.son);
    $('b-son').setAttribute('aria-label', S.son ? 'Couper le son' : 'Activer le son');
  }
  function codeSauvegarde() { sauver(); return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
  function lireCode(code) {
    try { var d = JSON.parse(decodeURIComponent(escape(atob(String(code).replace(/\s+/g, ''))))); return d && typeof d == 'object' ? d : null; } catch (e) { return null; }
  }

  /* ================= Fenêtres, annonces ================= */
  function dialogue(titre, html, boutons) {
    var dlg = $('dialogue');
    $('dlg-titre').textContent = titre; $('dlg-texte').innerHTML = html;
    var zone = $('dlg-boutons'); zone.innerHTML = '';
    boutons.forEach(function (b) {
      var e = document.createElement('button'); e.type = 'button'; e.className = 'btn-mc ' + (b.cls || ''); e.textContent = b.t;
      e.onclick = function () { fermer(); if (b.f) b.f(); };
      zone.appendChild(e);
    });
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
    var dernier = zone.lastChild; if (dernier) dernier.focus();
  }
  function fermer() { var dlg = $('dialogue'); if (dlg.close && dlg.open) dlg.close(); else dlg.removeAttribute('open'); }
  var minuteurAnnonce = 0;
  function annonce(t) {
    var e = $('annonce'); e.textContent = t; e.classList.add('vu');
    clearTimeout(minuteurAnnonce); minuteurAnnonce = setTimeout(function () { e.classList.remove('vu'); }, 3500);
  }

  /* ================= Sauvegarde ================= */
  function sauver() {
    S.derniere = Date.now(); S.cps = J.cpsBase; S.nbProgres = D.PROGRES.length;
    try { localStorage.setItem(CLE, JSON.stringify(S)); } catch (e) {}
  }
  function charger(d) {
    S = nettoyer(d);
    effets = []; combo.n = 0;
    recalculer();
    var absent = (Date.now() - S.derniere) / 1000, gain = 0, plein = a('absence');
    if (d && absent > 60 && J.cpsBase > 0) {
      gain = J.cpsBase * Math.min(absent, plein ? 172800 : 86400) * (plein ? 1 : 0.5);
      gagner(gain);
    }
    S.derniere = Date.now();
    while (S.missions.length < nbMissions()) nouvelleMission();
    return { absent: absent, gain: gain, plein: plein };
  }

  /* ================= Boucles : logique (10 fois par seconde) et affichage ================= */
  var derniereLogique = Date.now(), tic = 0, aSauver = false, fantome = 0;
  function marquer() { aSauver = true; }
  function logique() {
    var t = Date.now(), dt = (t - derniereLogique) / 1000;
    derniereLogique = t;
    if (dt <= 0) return;
    if (effets.length && effets.some(function (e) { return e.fin <= t; })) { effets = effets.filter(function (e) { return e.fin > t; }); recalculer(); }
    // onglet en arrière-plan longtemps : au-delà d'une minute, production à moitié (comme hors ligne)
    gagner(dt <= 60 ? J.cps * dt : J.cps * 60 + J.cpsBase * (dt - 60) * (a('absence') ? 1 : 0.5));
    S.tempsJeu += Math.min(dt, 60);
    if (a('fantome')) { fantome += Math.min(dt, 5); while (fantome >= 0.5) { fantome -= 0.5; frapperFantome(); } }
    if (combo.n && t - combo.dernier > 1000) { combo.n = 0; recalculer(); majCombo(); }
    if (!evenement && t >= prochain && !document.hidden) apparaitre();
    jouerMusique(t);
    tic++;
    if (tic % 2 == 0) { majBoutique(); majCapacites(); }
    if (tic % 10 == 0) {
      verifierProgres(); verifierMissions(); majDimensions();
      var g = gainEtoiles(), br = $('b-renaitre');
      br.hidden = g < 1; if (g >= 1) br.textContent = 'Renaître · +' + g + ' ★';
      if (!$('p-stats').hidden) afficherStats();
      if (!$('p-etoiles').hidden) afficherEtoiles();
    }
    if (tic % 50 == 0 || (aSauver && tic % 10 == 0)) { sauver(); aSauver = false; }
  }
  var avant = performance.now(), dernierTxt = '';
  function image(maintenant) {
    var dt = Math.min(0.1, (maintenant - avant) / 1000); avant = maintenant;
    var n = S.blocs, txt = nombre(n);
    if (txt != dernierTxt) {
      dernierTxt = txt;
      $('n-blocs').textContent = txt;
      $('n-unite').textContent = unite(n);
      document.title = txt + ' ' + unite(Math.max(2, n)) + ' · Mine Clic';
    }
    var c = nombre(J.cps, true);
    if ($('n-cps')._t != c) { $('n-cps')._t = c; $('n-cps').textContent = c; }
    $('n-cps').classList.toggle('frenesie', !!(J.frenesie || J.cloche));
    afficherEffets();
    dessinerCube(dt);
    dessinerEclats(dt);
    requestAnimationFrame(image);
  }

  /* ================= Branchements ================= */
  var dernierPointeur = 'mouse';
  document.addEventListener('pointerdown', function (e) { dernierPointeur = e.pointerType || 'mouse'; }, true);
  var bloc = $('bloc');
  bloc.addEventListener('pointerdown', function (e) {
    if (e.button && e.button !== 0) return;
    e.preventDefault();
    frapper(e.clientX, e.clientY);
  });
  // au clavier (Entrée ou Espace) : un coup par appui, sans répétition automatique
  bloc.addEventListener('click', function (e) { if (e.detail === 0) { var r = cube.getBoundingClientRect(); frapper(r.left + r.width / 2, r.top + r.height / 3); } });
  bloc.addEventListener('keydown', function (e) { if (e.repeat && (e.key == 'Enter' || e.key == ' ')) e.preventDefault(); });
  bloc.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function ouvrirOnglet(o) {
    document.querySelectorAll('.onglet').forEach(function (x) { var oui = x == o; x.setAttribute('aria-selected', oui); x.tabIndex = oui ? 0 : -1; $(x.getAttribute('aria-controls')).hidden = !oui; });
    if (o.id == 'o-stats') afficherStats();
    if (o.id == 'o-progres') { afficherProgres(); afficherMissions(); }
    if (o.id == 'o-etoiles') afficherEtoiles();
    $('panneau-defile').scrollTop = 0;
  }
  document.querySelectorAll('.onglet').forEach(function (o) {
    o.addEventListener('click', function () { ouvrirOnglet(o); });
    o.addEventListener('keydown', function (e) {
      var l = Array.prototype.slice.call(document.querySelectorAll('.onglet')), i = l.indexOf(o);
      if (e.key == 'ArrowRight' || e.key == 'ArrowLeft') { var s = l[(i + (e.key == 'ArrowRight' ? 1 : l.length - 1)) % l.length]; s.focus(); ouvrirOnglet(s); }
    });
  });
  document.querySelectorAll('.qte button').forEach(function (b) {
    b.addEventListener('click', function () { S.qte = b.dataset.q == 'max' ? 'max' : +b.dataset.q; majQte(); majBoutique(); marquer(); });
  });
  function majQte() { document.querySelectorAll('.qte button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.q == String(S.qte)); }); }
  $('b-tout').onclick = acheterTout;

  function basculerSon() { S.son = !S.son; majOptions(); marquer(); if (S.son) sons.achat(); }
  $('b-son').onclick = basculerSon; $('o-son').onclick = basculerSon;
  $('o-musique').onclick = function () { S.musique = !S.musique; musique.prochaine = 0; majOptions(); marquer(); };
  $('o-parts').onclick = function () { S.particules = !S.particules; majOptions(); marquer(); };
  $('o-notation').onclick = function () { S.notation = { mots: 'court', court: 'sci', sci: 'mots' }[S.notation]; majOptions(); dernierTxt = ''; cleAmels = null; Object.keys(lignesMachines).forEach(function (k) { lignesMachines[k].cache = {}; }); majBoutique(); marquer(); };
  $('o-sauver').onclick = function () { sauver(); annonce('Partie sauvegardée'); };
  $('o-exporter').onclick = function () {
    var z = $('o-code'); z.value = codeSauvegarde(); z.select();
    var fait = function () { annonce('Code copié : garde-le précieusement'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(z.value).then(fait, function () { annonce('Code affiché : copie-le à la main'); });
    else { try { document.execCommand('copy'); fait(); } catch (e) { annonce('Code affiché : copie-le à la main'); } }
  };
  $('o-importer').onclick = function () {
    var d = lireCode($('o-code').value);
    if (!d) { annonce('Ce code ne ressemble pas à une sauvegarde de Mine Clic'); return; }
    var n = nettoyer(d);
    dialogue('Charger cette partie ?', '<p>La partie du code contient ' + blocs(n.blocs) + ' en réserve et ' + blocs(n.totalAll) + ' minés au total.</p><p>Elle remplace la partie en cours sur cet appareil.</p>',
      [{ t: 'Annuler' }, { t: 'Charger', cls: 'vert', f: function () { d.derniere = Date.now(); charger(d); demarrerAffichage(); sauver(); annonce('Partie chargée !'); } }]);
  };
  $('o-reset').onclick = function () {
    dialogue('Tout recommencer ?', '<p>Ta partie sera <b>effacée pour de bon</b> : blocs, machines, progrès, étoiles, pouvoirs et statistiques.</p><p>Pense à exporter un code de sauvegarde avant, au cas où.</p>',
      [{ t: 'Annuler' }, { t: 'Tout effacer', cls: 'rouge', f: function () { var son = S.son, mu = S.musique; charger(null); S.son = son; S.musique = mu; demarrerAffichage(); sauver(); annonce('Nouvelle partie !'); } }]);
  };
  $('b-renaitre').onclick = demanderRenaissance; $('o-renaitre').onclick = demanderRenaissance;
  $('b-etoiles').onclick = function () { ouvrirOnglet($('o-etoiles')); };

  var resize = function () { tailleCube(); tailleEclats(); };
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(mine);
  document.addEventListener('visibilitychange', function () { if (document.hidden) sauver(); });
  window.addEventListener('pagehide', sauver);

  function demarrerAffichage() {
    recalculer(); majNomBloc(); appliquerFond(); afficherDims(); appliquerCurseur();
    document.documentElement.style.setProperty('--ic-bloc', 'url(' + T.plat('herbe') + ')');
    document.querySelectorAll('.ic-etoile').forEach(function (i) { i.src = T.sprite({ s: 'etoile' }); });
    document.querySelectorAll('.ic-fragment').forEach(function (i) { i.src = T.sprite({ s: 'etoile', m: 'fragment' }); });
    cleAmels = null; majBoutique(); afficherProgres(); afficherMissions(); majOptions(); majQte(); afficherStats(); afficherEtoiles(); majCapacites('construire'); majCombo();
    $('b-renaitre').hidden = gainEtoiles() < 1;
  }

  /* ================= Démarrage ================= */
  var lu = null;
  try { lu = JSON.parse(localStorage.getItem(CLE)); } catch (e) {}
  var retour = charger(lu);
  recalculer();
  construireMachines();
  demarrerAffichage();
  resize();
  planifier(true);
  majDimensions();
  verifierProgres();
  if (retour.gain > 0) {
    dialogue('Bon retour !', '<p>Pendant ton absence (' + duree(retour.absent) + (retour.absent > (retour.plein ? 172800 : 86400) ? ', compté jusqu\'à ' + (retour.plein ? 48 : 24) + ' h' : '') + '), tes machines ont continué à creuser ' + (retour.plein ? 'à pleine vitesse' : 'à moitié de leur vitesse') + '.</p><p class="gros-gain">+' + echappe(blocs(retour.gain)) + '</p>', [{ t: 'Super !', cls: 'vert' }]);
  } else if (SAISONS[saison()]) setTimeout(function () { annonce(SAISONS[saison()].annonce); }, 800);
  sauver();
  setInterval(logique, 100);
  requestAnimationFrame(image);
  document.body.classList.add('pret');
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('../../sw.js').catch(function () {});

  // pour les tests automatiques (outils/tester-mine-clic.js) et les curieux
  window.MC = {
    etat: function () { return S; }, calc: function () { return J; }, frapper: frapper, acheterMachine: acheterMachine, acheterAmel: acheterAmel, acheterTout: acheterTout,
    avancer: function (s) { gagner(J.cps * s); S.tempsJeu += s; verifierProgres(); majDimensions(); majBoutique(); majCapacites(); },
    apparaitre: apparaitre, finir: finir, renaitre: renaitre, gainEtoiles: gainEtoiles, seuil: seuil, sauver: sauver, choisirDim: choisirDim,
    acheterPouvoir: acheterPouvoir, utiliserCapacite: utiliserCapacite, verifierMissions: verifierMissions, maxAchetable: function (id) { return maxAchetable(MACHINE[id]); },
    recalculer: function () { recalculer(); majBoutique(); afficherProgres(); majCapacites(); }, nombre: nombre, blocs: blocs, prixMachine: prixMachine, lireCode: lireCode, codeSauvegarde: codeSauvegarde,
    nouveauBloc: nouveauBloc, combo: combo,
    charger: function (d) { var r = charger(d); demarrerAffichage(); return r; }
  };
})();
