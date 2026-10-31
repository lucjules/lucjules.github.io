/* Mine Clic : textures des blocs (16 × 16, tirées au hasard mais toujours identiques),
   dessins des icônes, fissures et cube en 3D isométrique. Tout est dessiné par le code. */
(function () {
  'use strict';
  var D = window.MC_DONNEES;

  function hasard(graine) {
    var g = graine % 2147483647;
    if (g <= 0) g += 2147483646;
    return function () { g = (g * 16807) % 2147483647; return (g - 1) / 2147483646; };
  }
  function graineDe(txt) { var h = 7; for (var i = 0; i < txt.length; i++) h = (h * 31 + txt.charCodeAt(i)) % 2147483647; return h + 1; }
  function toile(l, h) { var c = document.createElement('canvas'); c.width = l; c.height = h || l; return c; }

  // grille 16 × 16 de couleurs, puis canvas
  function grille(remplir) { var g = []; for (var y = 0; y < 16; y++) { g.push([]); for (var x = 0; x < 16; x++) g[y].push(remplir(x, y)); } return g; }
  function versToile(g) {
    var c = toile(16), cx = c.getContext('2d');
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) if (g[y][x]) { cx.fillStyle = g[y][x]; cx.fillRect(x, y, 1, 1); }
    return c;
  }
  function bruit(r, couleurs) { return grille(function () { return couleurs[Math.floor(r() * couleurs.length)]; }); }
  // taches plus grandes : quelques pixels de la deuxième palette, en petits groupes
  function taches(r, g, couleurs, n) {
    for (var i = 0; i < n; i++) {
      var x = Math.floor(r() * 16), y = Math.floor(r() * 16), c = couleurs[Math.floor(r() * couleurs.length)];
      g[y][x] = c; if (r() < 0.6) g[y][(x + 1) % 16] = c; if (r() < 0.4) g[(y + 1) % 16][x] = c;
    }
    return g;
  }
  // amas de minerai : 4 à 6 grappes, avec un reflet et une ombre
  function minerai(r, g, clair, fonce) {
    var n = 4 + Math.floor(r() * 3), pris = [];
    for (var i = 0; i < n; i++) {
      var x, y, essai = 0;
      do { x = 1 + Math.floor(r() * 12); y = 1 + Math.floor(r() * 12); essai++; }
      while (essai < 20 && pris.some(function (p) { return Math.abs(p[0] - x) < 4 && Math.abs(p[1] - y) < 4; }));
      pris.push([x, y]);
      var forme = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [1, 2]].filter(function (p, j) { return j < 3 || r() < 0.55; });
      forme.forEach(function (p) { g[y + p[1]][x + p[0]] = r() < 0.65 ? clair : fonce; });
      g[y][x] = clair;
      if (r() < 0.5) g[y + 2][x + 2] = fonce;
    }
    return g;
  }

  var PIERRE = ['#7f7f7f', '#8a8a8a', '#747474', '#6d6d6d', '#939393'];
  var TERRE = ['#866043', '#79553a', '#966c4a', '#6b4a30', '#8d6446'];
  var NETHER = ['#6f3535', '#843e3e', '#5c2a2a', '#9a4a4a', '#4e2222'];
  var HERBE = ['#5d9b37', '#6aab3e', '#4f8a2e', '#78b84a', '#5a9334'];

  // chaque bloc : une texture pour le dessus et une pour les côtés (souvent la même)
  var FABRIQUES = {
    terre: function (r) { return { tout: taches(r, bruit(r, TERRE), ['#5f4129', '#a07552'], 10) }; },
    herbe: function (r) {
      var dessus = bruit(r, HERBE);
      var cote = taches(r, bruit(r, TERRE), ['#5f4129'], 6);
      for (var x = 0; x < 16; x++) {
        var bas = 2 + Math.floor(r() * 2) + (r() < 0.25 ? 2 : 0);
        for (var y = 0; y < bas; y++) cote[y][x] = HERBE[Math.floor(r() * HERBE.length)];
      }
      return { dessus: dessus, cote: cote };
    },
    bois: function (r) {
      var cote = grille(function (x) { return ['#6b5130', '#5a4428', '#7a5d37', '#4f3b22'][(x * 7 + 3) % 4]; });
      for (var i = 0; i < 40; i++) { var x = Math.floor(r() * 16), y = Math.floor(r() * 16); cote[y][x] = r() < 0.5 ? '#3f2f1a' : '#86683f'; if (y < 15) cote[y + 1][x] = cote[y][x]; }
      var dessus = grille(function (x, y) {
        var d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
        if (d > 7) return '#5a4428';
        return Math.floor(d) % 2 ? '#b8945f' : '#9e7c4a';
      });
      return { dessus: dessus, cote: cote };
    },
    pierre: function (r) { return { tout: taches(r, bruit(r, PIERRE), ['#5f5f5f', '#a0a0a0'], 12) }; },
    ardoise: function (r) { return { tout: taches(r, bruit(r, ['#4a4a50', '#404046', '#55555c', '#38383d']), ['#2c2c30', '#606068'], 14) }; },
    charbon: function (r) { return { tout: minerai(r, bruit(r, PIERRE), '#2b2b2b', '#474747') }; },
    fer: function (r) { return { tout: minerai(r, bruit(r, PIERRE), '#e3c0a6', '#a8846b') }; },
    or: function (r) { return { tout: minerai(r, bruit(r, PIERRE), '#fcee4b', '#d99a0b') }; },
    redstone: function (r) { return { tout: minerai(r, bruit(r, PIERRE), '#ff2020', '#a10000') }; },
    lapis: function (r) { return { tout: minerai(r, bruit(r, PIERRE), '#3a6ee0', '#1a3d8f') }; },
    diamant: function (r) { return { tout: minerai(r, bruit(r, PIERRE), '#7ff4fa', '#1fb5c0') }; },
    emeraude: function (r) { return { tout: minerai(r, bruit(r, PIERRE), '#5cf796', '#17a34a') }; },
    obsidienne: function (r) {
      var g = bruit(r, ['#14101e', '#1b1529', '#100c18', '#1f1830']);
      for (var i = 0; i < 7; i++) { var x = Math.floor(r() * 14), y = Math.floor(r() * 16); g[y][x] = '#3b2a5c'; g[y][x + 1] = '#5a3f8c'; if (r() < 0.5) g[y][x + 2] = '#3b2a5c'; }
      return { tout: g };
    },
    netherrack: function (r) { return { tout: taches(r, bruit(r, NETHER), ['#3d1a1a', '#b05a5a'], 10) }; },
    quartz: function (r) { return { tout: minerai(r, bruit(r, NETHER), '#f2ede4', '#c9bfb1') }; },
    glowstone: function (r) { return { tout: taches(r, bruit(r, ['#b78a3c', '#dcb156', '#f2d272', '#8a5f2a']), ['#fff1a8', '#ffffff'], 14) }; },
    endstone: function (r) { return { tout: taches(r, bruit(r, ['#dbdea2', '#e6e8b1', '#cfd291', '#d5d89a']), ['#b8ba7a', '#c3c585'], 16) }; },
    sculk: function (r) {
      var g = bruit(r, ['#0b2a2e', '#0d3438', '#08201f', '#0f3c40']);
      for (var i = 0; i < 9; i++) { var x = Math.floor(r() * 15), y = Math.floor(r() * 15); g[y][x] = '#2de0d9'; if (r() < 0.6) g[y][x + 1] = '#1a9a95'; if (r() < 0.4) g[y + 1][x] = '#1a9a95'; }
      return { tout: g };
    }
  };

  var cacheTextures = {};
  // { dessus, cote } : deux canvas 16 × 16 ; couleurs : quelques couleurs pour les éclats
  function texture(id) {
    if (cacheTextures[id]) return cacheTextures[id];
    var r = hasard(graineDe(id)), f = FABRIQUES[id](r), dessus = f.dessus || f.tout, cote = f.cote || f.tout;
    var couleurs = [];
    for (var i = 0; i < 24; i++) couleurs.push(cote[Math.floor(r() * 16)][Math.floor(r() * 16)]);
    if (id == 'herbe') couleurs = couleurs.concat(HERBE);
    return (cacheTextures[id] = { dessus: versToile(dessus), cote: versToile(cote), couleurs: couleurs });
  }

  // fissures : 10 étapes, chacune ajoute des pixels sombres en partant du centre
  var fissures = (function () {
    var r = hasard(1234), pts = [], vus = {};
    function ajoute(x, y, rang) { var k = x + ',' + y; if (x < 0 || y < 0 || x > 15 || y > 15 || vus[k]) return; vus[k] = 1; pts.push({ x: x, y: y, rang: rang }); }
    for (var b = 0; b < 7; b++) {
      var x = 7 + Math.floor(r() * 3) - 1, y = 7 + Math.floor(r() * 3) - 1, a = (b / 7) * Math.PI * 2 + r() * 0.6;
      for (var pas = 0; pas < 11; pas++) {
        ajoute(Math.round(x), Math.round(y), pas + r() * 3);
        a += (r() - 0.5) * 0.9; x += Math.cos(a); y += Math.sin(a);
        if (r() < 0.2) ajoute(Math.round(x) + 1, Math.round(y), pas + 2 + r() * 3);
      }
    }
    pts.sort(function (p, q) { return p.rang - q.rang; });
    var etapes = [];
    for (var e = 1; e <= 10; e++) {
      var c = toile(16), cx = c.getContext('2d'), n = Math.round(pts.length * e / 10);
      for (var i = 0; i < n; i++) { cx.fillStyle = i % 3 ? 'rgba(0,0,0,.72)' : 'rgba(0,0,0,.5)'; cx.fillRect(pts[i].x, pts[i].y, 1, 1); }
      etapes.push(c);
    }
    return etapes;
  })();

  /* Cube isométrique : dessus, face gauche et face droite, chacune déformée par une transformation affine.
     t : taille d'une arête en pixels ; fissure : 0 (aucune) à 10 */
  function cube(cx, tex, centreX, centreY, t, fissure, eclat) {
    var co = 0.866 * t, faces = [
      { img: tex.dessus, m: [co / 16, 0.5 * t / 16, -co / 16, 0.5 * t / 16, centreX, centreY - t], ombre: 0 },
      { img: tex.cote, m: [co / 16, 0.5 * t / 16, 0, t / 16, centreX - co, centreY - 0.5 * t], ombre: 0.22 },
      { img: tex.cote, m: [co / 16, -0.5 * t / 16, 0, t / 16, centreX, centreY], ombre: 0.42 }
    ];
    cx.save();
    cx.imageSmoothingEnabled = false;
    faces.forEach(function (f) {
      cx.setTransform(f.m[0], f.m[1], f.m[2], f.m[3], f.m[4], f.m[5]);
      // déborde d'un rien pour éviter les fentes entre les faces
      cx.drawImage(f.img, -0.04, -0.04, 16.08, 16.08);
      if (fissure > 0) cx.drawImage(fissures[Math.min(9, fissure - 1)], 0, 0, 16, 16);
      if (f.ombre) { cx.fillStyle = 'rgba(0,0,0,' + f.ombre + ')'; cx.fillRect(0, 0, 16, 16); }
      if (eclat) { cx.fillStyle = 'rgba(255,255,255,' + eclat + ')'; cx.fillRect(0, 0, 16, 16); }
    });
    cx.restore();
  }

  /* Dessins 12 × 12 → adresse d'image (data: URL), gardée en cache */
  var cacheSprites = {};
  function sprite(icone) {
    var cle = icone.s + '|' + (icone.m || '') + '|' + (icone.palier == null ? '' : icone.palier);
    if (cacheSprites[cle]) return cacheSprites[cle];
    var lignes = D.SPRITES[icone.s], pal = Object.assign({}, D.PALETTE, D.MATIERES[icone.m] || (icone.s == 'pioche' ? D.MATIERES.bois : {}));
    var cadre = icone.palier != null, dec = cadre ? 2 : 0, c = toile(12 + 2 * dec), cx = c.getContext('2d');
    if (cadre) {
      cx.fillStyle = D.COULEURS_PALIERS[icone.palier]; cx.fillRect(0, 0, 16, 16);
      cx.fillStyle = 'rgba(0,0,0,.55)'; cx.fillRect(1, 1, 14, 14);
    }
    lignes.forEach(function (l, y) {
      for (var x = 0; x < 12; x++) { var ch = l[x]; if (ch && ch != '.' && pal[ch]) { cx.fillStyle = pal[ch]; cx.fillRect(x + dec, y + dec, 1, 1); } }
    });
    if (cadre) { // petit numéro du palier (points) en bas à droite
      cx.fillStyle = D.COULEURS_PALIERS[icone.palier];
      for (var i = 0; i <= Math.min(3, icone.palier); i++) cx.fillRect(14 - i * 2, 14, 1, 1);
    }
    return (cacheSprites[cle] = c.toDataURL());
  }

  // petite image plate d'un bloc (face de côté), pour les boutons de dimension
  var cachePlats = {};
  function plat(id) {
    if (!cachePlats[id]) cachePlats[id] = texture(id).cote.toDataURL();
    return cachePlats[id];
  }

  // fond tuilé d'une dimension, assombri, à grande échelle (adresse d'image)
  var cacheFonds = {};
  function fond(id) {
    if (cacheFonds[id]) return cacheFonds[id];
    var c = toile(64), cx = c.getContext('2d'), t = texture(id);
    cx.imageSmoothingEnabled = false;
    cx.drawImage(t.cote, 0, 0, 64, 64);
    cx.fillStyle = 'rgba(0,0,0,.45)'; cx.fillRect(0, 0, 64, 64);
    return (cacheFonds[id] = c.toDataURL());
  }

  // curseur en forme de pioche (32 × 32)
  function curseur(matiere) {
    var c = toile(32), cx = c.getContext('2d'), lignes = D.SPRITES.pioche, pal = Object.assign({}, D.PALETTE, D.MATIERES[matiere] || D.MATIERES.bois);
    lignes.forEach(function (l, y) { for (var x = 0; x < 12; x++) { var ch = l[11 - x]; if (ch != '.' && pal[ch]) { cx.fillStyle = pal[ch]; cx.fillRect(x * 2 + 4, y * 2 + 4, 2, 2); } } });
    return c.toDataURL();
  }

  window.MC_TEXTURES = { texture: texture, cube: cube, sprite: sprite, plat: plat, fond: fond, curseur: curseur, FABRIQUES: FABRIQUES };
})();
