/* Mine Clic : le moteur du jeu et l'interface.
   Clique sur le bloc pour le miner, achète des machines qui minent pour toi, ouvre les coffres,
   désamorce les creepers, débloque les dimensions et renais pour gagner des étoiles du Nether. */
(function () {
  'use strict';
  var D = window.MC_DONNEES, T = window.MC_TEXTURES;
  var CLE = 'mine-clic';
  var $ = function (id) { return document.getElementById(id); };
  var parId = function (liste) { var o = {}; liste.forEach(function (x) { o[x.id] = x; }); return o; };
  var MACHINE = parId(D.MACHINES), AMEL = parId(D.AMELIORATIONS), PROG = parId(D.PROGRES), DIM = parId(D.DIMENSIONS);

  /* ================= Nombres et durées, à la française ================= */
  var GRANDS = ['million', 'milliard', 'billion', 'billiard', 'trillion', 'trilliard', 'quadrillion', 'quadrilliard', 'quintillion', 'quintilliard', 'sextillion', 'sextilliard'];
  function nombre(n, decimales) {
    if (!isFinite(n)) return '∞';
    if (n < 1e6) {
      if (decimales && n < 100 && n % 1) return (Math.floor(n * 10) / 10).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
      return Math.floor(n).toLocaleString('fr-FR');
    }
    var p = Math.floor(Math.log10(n) / 3) - 2;
    if (p >= GRANDS.length) return n.toExponential(2).replace('.', ',').replace('e+', ' × 10^');
    var v = Math.floor(n / Math.pow(10, 6 + 3 * p) * 1000) / 1000;
    return v.toLocaleString('fr-FR', { maximumFractionDigits: 3 }) + ' ' + GRANDS[p] + (v >= 2 ? 's' : '');
  }
  function blocs(n, decimales) { return nombre(n, decimales) + (n >= 1e6 ? ' de blocs' : n >= 2 ? ' blocs' : ' bloc'); }
  function duree(s) {
    s = Math.max(0, Math.floor(s));
    if (s < 60) return s + ' s';
    if (s < 3600) return Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s';
    if (s < 86400) return Math.floor(s / 3600) + ' h ' + String(Math.floor(s / 60) % 60).padStart(2, '0') + ' min';
    return Math.floor(s / 86400) + ' j ' + Math.floor(s / 3600) % 24 + ' h';
  }
  // « {1000} » dans un texte → nombre mis en forme
  function texte(t) { return t.replace(/\{(\d+(?:e\d+)?)\}/g, function (m, n) { return nombre(+n); }); }
  function echappe(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ================= État de la partie ================= */
  function neuf() {
    var t = Date.now();
    return {
      v: 1, blocs: 0, total: 0, totalAll: 0, clics: 0, casses: 0, machines: {}, amels: [], progres: [],
      etoiles: 0, renaissances: 0, coffres: 0, creepers: 0, boums: 0, dims: ['surface'], vues: ['surface'], dim: 'surface',
      debut: t, debutVie: t, derniere: t, tempsJeu: 0, son: true, particules: true, qte: 1, bloc: 'herbe', coups: 0
    };
  }
  // une sauvegarde peut venir d'un code collé : on ne garde que ce qui a du sens
  function nettoyer(d) {
    var S = neuf();
    if (!d || typeof d != 'object') return S;
    var nb = function (x) { return typeof x == 'number' && isFinite(x) && x >= 0; };
    ['blocs', 'total', 'totalAll', 'clics', 'casses', 'etoiles', 'renaissances', 'coffres', 'creepers', 'boums', 'debut', 'debutVie', 'derniere', 'tempsJeu', 'coups'].forEach(function (k) { if (nb(d[k])) S[k] = d[k]; });
    ['clics', 'casses', 'etoiles', 'renaissances', 'coffres', 'creepers', 'boums', 'coups'].forEach(function (k) { S[k] = Math.floor(S[k]); });
    S.totalAll = Math.max(S.totalAll, S.total);
    if (d.machines && typeof d.machines == 'object') D.MACHINES.forEach(function (m) { if (nb(d.machines[m.id])) S.machines[m.id] = Math.min(10000, Math.floor(d.machines[m.id])); });
    var garder = function (liste, connus) { return Array.isArray(liste) ? liste.filter(function (x, i) { return connus[x] && liste.indexOf(x) == i; }) : []; };
    S.amels = garder(d.amels, AMEL); S.progres = garder(d.progres, PROG);
    S.dims = garder(d.dims, DIM); if (S.dims.indexOf('surface') < 0) S.dims.unshift('surface');
    S.vues = garder(d.vues, DIM); if (S.vues.indexOf('surface') < 0) S.vues.unshift('surface');
    if (S.dims.indexOf(d.dim) >= 0) S.dim = d.dim;
    if (typeof d.son == 'boolean') S.son = d.son;
    if (typeof d.particules == 'boolean') S.particules = d.particules;
    if ([1, 10, 100].indexOf(d.qte) >= 0) S.qte = d.qte;
    if (D.BLOCS[d.bloc] && DIM[S.dim].blocs.indexOf(d.bloc) >= 0) S.bloc = d.bloc; else S.bloc = DIM[S.dim].blocs[0];
    S.coups = Math.min(S.coups, D.BLOCS[S.bloc].durete - 1);
    return S;
  }

  var S = neuf();
  var J = {}; // valeurs calculées : production, valeur d'un clic, multiplicateurs…
  var effets = []; // effets des coffres en cours : { id, fin, duree }

  function actif(id) { var t = Date.now(); return effets.some(function (e) { return e.id == id && e.fin > t; }); }
  function recalculer() {
    var a = { clic: 0, pct: 0, fortune: 0, chance: 0, duree: 0, global: 0, machine: {} };
    S.amels.forEach(function (id) {
      var u = AMEL[id];
      if (u.effet == 'machine') a.machine[u.machine] = (a.machine[u.machine] || 0) + 1;
      else if (u.effet == 'global') a.global += u.val;
      else a[u.effet]++;
    });
    J.mods = a;
    J.multProgres = S.progres.length; J.multEtoiles = S.etoiles * 2;
    J.mult = (1 + a.global / 100) * (1 + S.progres.length / 100) * (1 + S.etoiles * 0.02);
    J.parMachine = {}; J.cpsBase = 0;
    D.MACHINES.forEach(function (m) {
      J.parMachine[m.id] = m.cps * Math.pow(2, a.machine[m.id] || 0) * J.mult;
      J.cpsBase += (S.machines[m.id] || 0) * J.parMachine[m.id];
    });
    J.frenesie = actif('frenesie'); J.ruee = actif('ruee'); J.eclair = actif('eclair');
    J.cps = J.cpsBase * (J.frenesie ? 7 : 1);
    J.clic = (Math.pow(2, a.clic) * J.mult + J.cps * a.pct / 100) * (J.ruee ? 777 : 1);
    J.fortune = Math.pow(2, a.fortune);
  }
  function gagner(n) { if (!(n > 0)) return; S.blocs += n; S.total += n; S.totalAll += n; }
  function prixMachine(m, n, q) { return Math.ceil(m.prix * Math.pow(1.15, n) * (Math.pow(1.15, q) - 1) / 0.15); }
  function matierePioche() { var m = 'bois'; ['pierre', 'fer', 'or', 'diamant', 'netherite'].forEach(function (x) { if (S.amels.indexOf('pioche-' + x) >= 0) m = x; }); return m; }

  /* ================= Sons (synthétisés, aucun fichier) ================= */
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
    function note(freq, dur, type, vol, t0, freq2) {
      var a = audio(); if (!a) return;
      var t = a.currentTime + (t0 || 0), o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t); if (freq2) o.frequency.exponentialRampToValueAtTime(freq2, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(sortie); o.start(t); o.stop(t + dur + 0.05);
    }
    var MAT = { terre: [650, 1.2], bois: [420, 3], pierre: [1700, 2.5], lourd: [1000, 2], verre: [3200, 4] };
    return {
      coup: function (m) { var p = MAT[m] || MAT.pierre; bruit(0.07, 'bandpass', p[0] * (0.85 + Math.random() * 0.3), p[1], 0.7); if (m == 'bois') note(170, 0.07, 'triangle', 0.3); },
      casse: function (m) { var p = MAT[m] || MAT.pierre; bruit(0.3, 'lowpass', p[0] * 1.5, 1, 0.8); bruit(0.18, 'bandpass', p[0] * 0.7, 2, 0.5, 0.05); if (m == 'verre') note(1800, 0.2, 'triangle', 0.15, 0, 900); },
      achat: function () { note(660, 0.07, 'square', 0.12); note(990, 0.1, 'square', 0.12, 0.07); },
      non: function () { note(140, 0.14, 'square', 0.1); },
      progres: function () { [523, 659, 784, 1047].forEach(function (f, i) { note(f, 0.2, 'triangle', 0.2, i * 0.09); }); },
      coffre: function () { note(392, 0.1, 'triangle', 0.25); note(784, 0.3, 'triangle', 0.25, 0.1); bruit(0.25, 'highpass', 3000, 1, 0.2); },
      apparait: function () { note(1200, 0.08, 'sine', 0.12); note(1600, 0.12, 'sine', 0.12, 0.08); },
      siffle: function (dur) {
        var a = audio(); if (!a) return null;
        var r = bruit(dur, 'highpass', 2600, 0.8, 0.02);
        if (r) { r.g.gain.cancelScheduledValues(r.t); r.g.gain.setValueAtTime(0.02, r.t); r.g.gain.linearRampToValueAtTime(0.4, r.t + dur); }
        return r;
      },
      boum: function () { bruit(1.2, 'lowpass', 360, 0.7, 1.4); note(80, 0.7, 'sine', 0.7, 0, 30); },
      couper: function (r) { try { if (r) r.s.stop(); } catch (e) {} }
    };
  })();

  /* ================= Le bloc à miner ================= */
  var cube = $('cube'), cxCube = cube.getContext('2d');
  var anim = { tape: 0, pop: 0, survol: 0, t: 0 };
  function nouveauBloc() {
    var choix = DIM[S.dim].blocs, id;
    do { id = choix[Math.floor(Math.random() * choix.length)]; } while (choix.length > 1 && id == S.bloc);
    S.bloc = id; S.coups = 0; majNomBloc();
  }
  function majNomBloc() {
    var b = D.BLOCS[S.bloc];
    $('bloc-nom').textContent = b.nom;
    $('bloc-coups').textContent = S.coups + ' / ' + b.durete;
    $('bloc').setAttribute('aria-label', 'Miner : ' + b.nom + ' (' + S.coups + ' coups sur ' + b.durete + ')');
  }
  function frapper(x, y) {
    S.clics++;
    var v = J.clic, b = D.BLOCS[S.bloc];
    gagner(v);
    S.coups += J.eclair ? b.durete : 1;
    sons.coup(b.son);
    anim.tape = 1;
    flottant(x, y, '+' + nombre(v, true), '');
    eclats(x, y, 5, T.texture(S.bloc).couleurs, 1);
    if (S.coups >= b.durete) casser(x, y); else majNomBloc();
    if (S.clics == 1) verifierProgres();
    marquer();
  }
  function casser(x, y) {
    var b = D.BLOCS[S.bloc], bonus = b.durete * J.clic * J.fortune, r = cube.getBoundingClientRect();
    gagner(bonus);
    S.casses++;
    sons.casse(b.son);
    eclats(r.left + r.width / 2, r.top + r.height / 2, 34, T.texture(S.bloc).couleurs, 2.2);
    flottant(x, y - 30, b.nom + ' : +' + nombre(bonus), 'gros');
    nouveauBloc();
    anim.pop = 1;
    verifierProgres();
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
    // ombre au sol
    cxCube.fillStyle = 'rgba(0,0,0,.35)';
    cxCube.beginPath(); cxCube.ellipse(w / 2, h * 0.5 + w * 0.36, w * 0.24 * echelle, w * 0.06 * echelle, 0, 0, Math.PI * 2); cxCube.fill();
    var fiss = Math.floor(10 * S.coups / D.BLOCS[S.bloc].durete);
    T.cube(cxCube, T.texture(S.bloc), w / 2, cy, t, fiss, anim.pop * 0.6 + anim.tape * 0.12);
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
      var a = Math.random() * Math.PI * 2, v = (60 + Math.random() * 160) * force;
      parts.push({ x: x - r.left, y: y - r.top, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120 * force, vie: 0.6 + Math.random() * 0.5, c: couleurs[Math.floor(Math.random() * couleurs.length)], t: 4 + Math.random() * 5 });
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
    if (nbFlottants > 25) return;
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
        b.title = d.machine ? 'À débloquer : obtenir ' + MACHINE[d.machine].premier.replace(/^(ton|ta) (premier|première) /, function (m, a, p) { return p == 'premier' ? 'un ' : 'une '; }) : 'À débloquer : miner ' + blocs(d.seuil) + ' au total';
        b.setAttribute('aria-label', 'Dimension verrouillée. ' + b.title);
      }
      el.appendChild(b);
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
    if (c.machine && (S.machines[c.machine] || 0) < c.n) return false;
    return true;
  }
  function acheterMachine(id) {
    var m = MACHINE[id], n = S.machines[id] || 0, p = prixMachine(m, n, S.qte);
    if (S.blocs < p) { sons.non(); return false; }
    S.blocs -= p; S.machines[id] = n + S.qte;
    sons.achat(); recalculer(); majDimensions(); verifierProgres(); majBoutique(); marquer();
    return true;
  }
  function acheterAmel(id) {
    var u = AMEL[id];
    if (!u || !amelVisible(u) || S.blocs < u.prix) { sons.non(); return false; }
    S.blocs -= u.prix; S.amels.push(id);
    sons.achat(); recalculer(); verifierProgres(); amelChoisie = null; $('amel-info').hidden = true;
    if (u.effet == 'clic') appliquerCurseur();
    majBoutique(); marquer();
    return true;
  }
  function appliquerCurseur() { $('bloc').style.cursor = 'url(' + T.curseur(matierePioche()) + ') 4 4, pointer'; }

  var lignesMachines = {};
  function construireMachines() {
    var el = $('machines'); el.innerHTML = '';
    D.MACHINES.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'machine'; b.dataset.id = m.id;
      b.innerHTML = '<img class="ic" alt="" src="' + T.sprite({ s: m.id }) + '"><span class="m-txt"><b class="m-nom"></b><small class="m-info"></small></span>' +
        '<span class="m-droite"><span class="prix"><i class="bloc-ic" aria-hidden="true"></i><span class="m-prix"></span></span><b class="m-n"></b></span>';
      b.onclick = function () { acheterMachine(m.id); };
      el.appendChild(b);
      lignesMachines[m.id] = { el: b, nom: b.querySelector('.m-nom'), info: b.querySelector('.m-info'), prix: b.querySelector('.m-prix'), n: b.querySelector('.m-n'), cache: {} };
    });
  }
  function maj(l, cle, el, val, prop) { if (l.cache[cle] !== val) { l.cache[cle] = val; if (prop) el[prop] = val; else el.textContent = val; } }
  var cleAmels = '', amelChoisie = null;
  function majBoutique() {
    // machines : visibles une fois approchées ; la suivante reste mystérieuse
    var mystere = false;
    D.MACHINES.forEach(function (m, i) {
      var l = lignesMachines[m.id], n = S.machines[m.id] || 0, vue = n > 0 || i == 0 || S.total >= m.prix * 0.4, p = prixMachine(m, n, S.qte);
      var montrer = vue || !mystere;
      if (!vue) mystere = true;
      l.el.hidden = !montrer;
      if (!montrer) return;
      maj(l, 'cls', l.el, 'machine' + (vue ? '' : ' inconnue') + (S.blocs >= p ? ' ok' : ''), 'className');
      maj(l, 'nom', l.nom, vue ? m.nom : '???');
      maj(l, 'prix', l.prix, nombre(p));
      maj(l, 'n', l.n, n ? String(n) : '');
      var part = J.cpsBase > 0 ? Math.round(100 * n * J.parMachine[m.id] / J.cpsBase) : 0;
      maj(l, 'info', l.info, vue ? nombre(J.parMachine[m.id], true) + '/s chacun' + (n ? ' · ' + part + ' % de ta production' : '') : 'Continue à miner pour la découvrir');
      maj(l, 'aria', l.el, (vue ? m.nom + '. ' + m.desc : 'Machine inconnue.') + ' Prix pour ' + S.qte + ' : ' + blocs(p) + '. Tu en as ' + n + '.', 'title');
    });
    // améliorations : la grille n'est reconstruite que si la liste change
    var liste = D.AMELIORATIONS.filter(amelVisible).sort(function (a, b) { return a.prix - b.prix; });
    var cle = liste.map(function (u) { return u.id; }).join();
    if (cle != cleAmels) {
      cleAmels = cle;
      var g = $('amels'); g.innerHTML = '';
      liste.forEach(function (u) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'amel'; b.dataset.id = u.id;
        b.innerHTML = '<img alt="" src="' + T.sprite(u.icone) + '">';
        b.setAttribute('aria-label', u.nom + ' : ' + u.desc + ' Prix : ' + blocs(u.prix));
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
    Array.prototype.forEach.call($('amels').children, function (b) { b.classList.toggle('ok', S.blocs >= AMEL[b.dataset.id].prix); b.classList.toggle('choisie', b.dataset.id == amelChoisie); });
    if (!$('amel-info').hidden && $('amel-info').dataset.id) infoAmel($('amel-info').dataset.id, true);
  }
  function infoAmel(id, juste) {
    var u = AMEL[id], el = $('amel-info');
    if (!u) return;
    var ok = S.blocs >= u.prix, html = '<b class="i-nom">' + echappe(u.nom) + '</b><span class="i-prix' + (ok ? ' ok' : '') + '"><i class="bloc-ic" aria-hidden="true"></i>' + nombre(u.prix) + '</span><span class="i-desc">' + echappe(u.desc) + '</span>' +
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
    nouveaux.forEach(function (p, i) { setTimeout(function () { toast(p); }, i * 700); });
    afficherProgres();
  }
  function toast(p) {
    var box = $('toasts');
    while (box.children.length >= 3) box.firstChild.remove();
    var e = document.createElement('div');
    e.className = 'toast';
    e.innerHTML = '<img alt="" src="' + T.sprite(p.icone) + '"><span><b>Progrès réalisé !</b><span>' + echappe(p.nom) + '</span></span>';
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

  /* ================= Coffres au trésor et creepers ================= */
  var prochain = 0, evenement = null;
  function planifier(premier) {
    var b = premier ? [35, 90] : [70, 190];
    prochain = Date.now() + (b[0] + Math.random() * (b[1] - b[0])) * Math.pow(0.75, J.mods.chance) * 1000;
  }
  function apparaitre(type) {
    if (evenement) finir(false);
    type = type || (S.total > 500 && Math.random() < 0.15 ? 'creeper' : 'coffre');
    var e = document.createElement('button'), vie = type == 'creeper' ? 4 : 13 * (J.mods.duree ? 1.5 : 1);
    e.type = 'button'; e.className = 'evenement ' + type;
    e.innerHTML = '<img alt="" src="' + T.sprite({ s: type }) + '">';
    e.setAttribute('aria-label', type == 'creeper' ? 'Un creeper ! Clique vite pour le désamorcer' : 'Un coffre au trésor ! Clique pour l\'ouvrir');
    e.style.left = (8 + Math.random() * 78) + 'vw'; e.style.top = (14 + Math.random() * 66) + 'vh';
    e.style.setProperty('--vie', vie + 's');
    e.addEventListener('pointerdown', function (ev) { ev.preventDefault(); finir(true, ev.clientX, ev.clientY); });
    e.addEventListener('click', function (ev) { if (ev.detail === 0) { var r = e.getBoundingClientRect(); finir(true, r.left + r.width / 2, r.top + r.height / 2); } });
    $('evenements').appendChild(e);
    evenement = { type: type, el: e, minuteur: setTimeout(function () { finir(false); }, vie * 1000), son: type == 'creeper' ? sons.siffle(vie) : (sons.apparait(), null) };
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
    if (ev.type == 'coffre' && clique) ouvrirCoffre(x, y);
    else if (ev.type == 'creeper' && clique) {
      var g = Math.max(J.clic * 60, Math.min(S.blocs * 0.3, J.cpsBase * 1800)) + 13;
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
    verifierProgres(); marquer();
  }
  function ouvrirCoffre(x, y) {
    S.coffres++;
    sons.coffre();
    var possibles = D.EFFETS.filter(function (e) { return !e.duree || !actif(e.id); });
    var somme = possibles.reduce(function (s, e) { return s + e.poids; }, 0), r = Math.random() * somme, choix = possibles[0];
    for (var i = 0; i < possibles.length; i++) { r -= possibles[i].poids; if (r <= 0) { choix = possibles[i]; break; } }
    eclats(x, y, 24, ['#f5d042', '#fff6b0', '#b8874a', '#3fd8e0'], 1.4);
    if (choix.id == 'fortune') {
      var g = Math.max(J.clic * 30, Math.min(S.blocs * 0.15, J.cpsBase * 900)) + 13;
      gagner(g);
      annonce('Trésor ! +' + blocs(g));
      flottant(x, y, '+' + nombre(g), 'gros');
    } else {
      var d = choix.duree * (J.mods.duree ? 2 : 1);
      effets.push({ id: choix.id, nom: choix.nom, desc: choix.desc, fin: Date.now() + d * 1000, duree: d });
      recalculer();
      annonce(choix.nom + ' ! ' + choix.desc + ' pendant ' + d + ' secondes');
    }
  }
  function afficherEffets() {
    var t = Date.now(), el = $('effets'), html = effets.map(function (e) {
      var reste = Math.max(0, (e.fin - t) / 1000);
      return '<span class="effet effet-' + e.id + '"><b>' + echappe(e.desc) + '</b> ' + Math.ceil(reste) + ' s<i style="width:' + (100 * reste / e.duree) + '%"></i></span>';
    }).join('');
    if (el._html != html) { el._html = html; el.innerHTML = html; }
  }

  /* ================= Renaissance ================= */
  function etoilesPossibles() { return Math.floor(Math.cbrt(S.totalAll / 1e9)); }
  function gainEtoiles() { return Math.max(0, etoilesPossibles() - S.etoiles); }
  function prochaineEtoile() { return Math.pow(Math.max(etoilesPossibles(), S.etoiles) + 1, 3) * 1e9; }
  function demanderRenaissance() {
    var g = gainEtoiles();
    if (g < 1) {
      dialogue('Renaître', '<p>Il faut avoir miné ' + blocs(prochaineEtoile()) + ' au total (toutes vies) pour gagner une étoile du Nether de plus.</p><p>Encore ' + blocs(prochaineEtoile() - S.totalAll) + ' à miner.</p>', [{ t: 'D\'accord' }]);
      return;
    }
    dialogue('Renaître ?', '<p>Tu recommences avec 0 bloc, sans machine ni amélioration, mais tu gagnes <b class="jaune">' + g + ' étoile' + (g > 1 ? 's' : '') + ' du Nether</b>.</p>' +
      '<p>Chaque étoile ajoute 2 % de production, pour toujours : tu auras <b>' + (S.etoiles + g) + ' étoiles, soit +' + (2 * (S.etoiles + g)) + ' %</b>.</p><p>Tu gardes tes progrès, tes dimensions et tes statistiques.</p>',
    [{ t: 'Annuler' }, { t: 'Renaître', cls: 'vert', f: renaitre }]);
  }
  function renaitre() {
    var g = gainEtoiles(); if (g < 1) return false;
    S.etoiles += g; S.renaissances++;
    S.blocs = 0; S.total = 0; S.machines = {}; S.amels = []; S.debutVie = Date.now(); S.coups = 0;
    effets = [];
    recalculer(); appliquerCurseur(); cleAmels = null; majBoutique(); verifierProgres(); afficherProgres(); sauver();
    eclats(innerWidth / 2, innerHeight / 2, 60, ['#ffffff', '#f5d042', '#d18cff'], 2.5);
    annonce('Nouvelle vie ! ' + S.etoiles + ' étoile' + (S.etoiles > 1 ? 's' : '') + ' du Nether : +' + 2 * S.etoiles + ' % de production');
    return true;
  }

  /* ================= Statistiques et options ================= */
  function afficherStats() {
    var lignes = [
      ['Blocs en réserve', blocs(S.blocs)],
      ['Production', blocs(J.cps, true) + ' par seconde' + (J.frenesie ? ' (frénésie !)' : '')],
      ['Valeur d\'un clic', blocs(J.clic, true)],
      ['Bonus quand un bloc casse', '×' + nombre(J.fortune) + ' (' + blocs(D.BLOCS[S.bloc].durete * J.clic * J.fortune) + ' pour ce bloc)'],
      ['Minés dans cette vie', blocs(S.total)],
      ['Minés au total', blocs(S.totalAll)],
      ['Clics sur le bloc', nombre(S.clics)],
      ['Blocs cassés', nombre(S.casses)],
      ['Machines', nombre(D.MACHINES.reduce(function (s, m) { return s + (S.machines[m.id] || 0); }, 0))],
      ['Améliorations', S.amels.length + ' / ' + D.AMELIORATIONS.length],
      ['Coffres ouverts', nombre(S.coffres)],
      ['Creepers désamorcés', nombre(S.creepers) + (S.boums ? ' (et ' + S.boums + ' explosion' + (S.boums > 1 ? 's' : '') + ')' : '')],
      ['Multiplicateur de production', '×' + J.mult.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' (améliorations +' + J.mods.global + ' %, progrès +' + J.multProgres + ' %, étoiles +' + J.multEtoiles + ' %)'],
      ['Renaissances', nombre(S.renaissances) + ' · ' + S.etoiles + ' étoile' + (S.etoiles > 1 ? 's' : '') + ' du Nether'],
      ['Temps de jeu', duree(S.tempsJeu)],
      ['Partie commencée le', new Date(S.debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })]
    ];
    var html = lignes.map(function (l) { return '<dt>' + l[0] + '</dt><dd>' + echappe(l[1]) + '</dd>'; }).join('');
    if ($('stats')._html != html) { $('stats')._html = html; $('stats').innerHTML = html; }
    var g = gainEtoiles();
    $('ren-txt').innerHTML = g >= 1
      ? 'Tu peux renaître maintenant et gagner <b class="jaune">' + g + ' étoile' + (g > 1 ? 's' : '') + ' du Nether</b> (+2 % de production chacune, pour toujours).'
      : 'Prochaine étoile du Nether à ' + blocs(prochaineEtoile()) + ' minés au total (encore ' + blocs(prochaineEtoile() - S.totalAll) + ').';
  }
  function majOptions() {
    $('o-son').setAttribute('aria-pressed', S.son); $('o-son').textContent = 'Son : ' + (S.son ? 'activé' : 'coupé');
    $('o-parts').setAttribute('aria-pressed', S.particules); $('o-parts').textContent = 'Éclats : ' + (S.particules ? 'activés' : 'désactivés');
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
    effets = [];
    recalculer();
    var absent = (Date.now() - S.derniere) / 1000, gain = 0;
    if (d && absent > 60 && J.cpsBase > 0) {
      gain = J.cpsBase * Math.min(absent, 86400) * 0.5;
      gagner(gain);
    }
    S.derniere = Date.now();
    return { absent: absent, gain: gain };
  }

  /* ================= Boucles : logique (10 fois par seconde) et affichage ================= */
  var derniereLogique = Date.now(), tic = 0, aSauver = false;
  function marquer() { aSauver = true; }
  function logique() {
    var t = Date.now(), dt = (t - derniereLogique) / 1000;
    derniereLogique = t;
    if (dt <= 0) return;
    if (effets.length && effets.some(function (e) { return e.fin <= t; })) { effets = effets.filter(function (e) { return e.fin > t; }); recalculer(); }
    // onglet en arrière-plan longtemps : au-delà d'une minute, production à moitié (comme hors ligne)
    gagner(dt <= 60 ? J.cps * dt : J.cps * 60 + J.cpsBase * (dt - 60) * 0.5);
    S.tempsJeu += Math.min(dt, 60);
    if (!evenement && t >= prochain && !document.hidden) apparaitre();
    tic++;
    if (tic % 2 == 0) majBoutique();
    if (tic % 10 == 0) {
      verifierProgres(); majDimensions();
      var g = gainEtoiles(), br = $('b-renaitre');
      br.hidden = g < 1; if (g >= 1) br.textContent = 'Renaître · +' + g + ' ★';
      if (!$('p-stats').hidden) afficherStats();
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
      $('n-unite').textContent = n >= 1e6 ? 'de blocs' : n >= 2 ? 'blocs' : 'bloc';
      document.title = txt + (n >= 1e6 ? ' de blocs' : ' blocs') + ' · Mine Clic';
    }
    var c = nombre(J.cps, true);
    if ($('n-cps')._t != c) { $('n-cps')._t = c; $('n-cps').textContent = c; }
    $('n-cps').classList.toggle('frenesie', !!J.frenesie);
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

  document.querySelectorAll('.onglet').forEach(function (o) {
    o.addEventListener('click', function () {
      document.querySelectorAll('.onglet').forEach(function (x) { var oui = x == o; x.setAttribute('aria-selected', oui); x.tabIndex = oui ? 0 : -1; $(x.getAttribute('aria-controls')).hidden = !oui; });
      if (o.id == 'o-stats') afficherStats();
      if (o.id == 'o-progres') afficherProgres();
      $('panneau-defile').scrollTop = 0;
    });
    o.addEventListener('keydown', function (e) {
      var l = Array.prototype.slice.call(document.querySelectorAll('.onglet')), i = l.indexOf(o);
      if (e.key == 'ArrowRight' || e.key == 'ArrowLeft') { var s = l[(i + (e.key == 'ArrowRight' ? 1 : l.length - 1)) % l.length]; s.focus(); s.click(); }
    });
  });
  document.querySelectorAll('.qte button').forEach(function (b) {
    b.addEventListener('click', function () { S.qte = +b.dataset.q; majQte(); majBoutique(); marquer(); });
  });
  function majQte() { document.querySelectorAll('.qte button').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.q == S.qte); }); }

  function basculerSon() { S.son = !S.son; majOptions(); marquer(); if (S.son) sons.achat(); }
  $('b-son').onclick = basculerSon; $('o-son').onclick = basculerSon;
  $('o-parts').onclick = function () { S.particules = !S.particules; majOptions(); marquer(); };
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
    dialogue('Tout recommencer ?', '<p>Ta partie sera <b>effacée pour de bon</b> : blocs, machines, progrès, étoiles et statistiques.</p><p>Pense à exporter un code de sauvegarde avant, au cas où.</p>',
      [{ t: 'Annuler' }, { t: 'Tout effacer', cls: 'rouge', f: function () { var son = S.son; charger(null); S.son = son; demarrerAffichage(); sauver(); annonce('Nouvelle partie !'); } }]);
  };
  $('b-renaitre').onclick = demanderRenaissance; $('o-renaitre').onclick = demanderRenaissance;
  $('dialogue').addEventListener('cancel', function () {});

  var resize = function () { tailleCube(); tailleEclats(); };
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(mine);
  document.addEventListener('visibilitychange', function () { if (document.hidden) sauver(); });
  window.addEventListener('pagehide', sauver);

  function demarrerAffichage() {
    recalculer(); majNomBloc(); appliquerFond(); afficherDims(); appliquerCurseur();
    document.documentElement.style.setProperty('--ic-bloc', 'url(' + T.plat('herbe') + ')');
    $('ren-ic').src = T.sprite({ s: 'etoile' });
    cleAmels = null; majBoutique(); afficherProgres(); majOptions(); majQte(); afficherStats();
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
    dialogue('Bon retour !', '<p>Pendant ton absence (' + duree(retour.absent) + (retour.absent > 86400 ? ', compté jusqu\'à 24 h' : '') + '), tes machines ont continué à creuser à moitié de leur vitesse.</p><p class="gros-gain">+' + echappe(blocs(retour.gain)) + '</p>', [{ t: 'Super !', cls: 'vert' }]);
  }
  sauver();
  setInterval(logique, 100);
  requestAnimationFrame(image);
  document.body.classList.add('pret');
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('../../sw.js').catch(function () {});

  // pour les tests automatiques (outils/tester-mine-clic.js) et les curieux
  window.MC = {
    etat: function () { return S; }, calc: function () { return J; }, frapper: frapper, acheterMachine: acheterMachine, acheterAmel: acheterAmel,
    avancer: function (s) { gagner(J.cps * s); S.tempsJeu += s; verifierProgres(); majDimensions(); majBoutique(); },
    apparaitre: apparaitre, finir: finir, renaitre: renaitre, gainEtoiles: gainEtoiles, sauver: sauver, choisirDim: choisirDim,
    recalculer: function () { recalculer(); majBoutique(); afficherProgres(); }, nombre: nombre, blocs: blocs, prixMachine: prixMachine, lireCode: lireCode, codeSauvegarde: codeSauvegarde,
    charger: function (d) { var r = charger(d); demarrerAffichage(); return r; }
  };
})();
