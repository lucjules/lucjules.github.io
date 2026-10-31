// Textures dessinées au chargement sur des canvas (aucun fichier image) et mises en cache.
import * as THREE from '../../lib/three.module.min.js';
import { alea } from '../hasard.js';

const cache = new Map();
let anisotropie = 1;
export function reglerAnisotropie(n) {
  anisotropie = n;
}

function texture(cle, l, h, dessin, { repete = false, srgb = true } = {}) {
  if (cache.has(cle)) return cache.get(cle);
  const c = document.createElement('canvas');
  c.width = l;
  c.height = h;
  dessin(c.getContext('2d'), l, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repete) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = anisotropie;
  cache.set(cle, t);
  return t;
}

function arrondi(x, X, Y, L, H, r) {
  x.beginPath();
  x.moveTo(X + r, Y);
  x.arcTo(X + L, Y, X + L, Y + H, r);
  x.arcTo(X + L, Y + H, X, Y + H, r);
  x.arcTo(X, Y + H, X, Y, r);
  x.arcTo(X, Y, X + L, Y, r);
  x.closePath();
}

// façade : fenêtres sur fond blanc (la couleur de l'immeuble vient du matériau) ; un motif = 4 m × 3 m
export function facade(style = 0) {
  return texture('facade' + style, 256, 192, (x, L, H) => {
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, L, H);
    x.fillStyle = 'rgba(0,0,0,.08)';
    x.fillRect(0, H - 14, L, 14);
    for (let i = 0; i < 2; i++) {
      const X = 28 + i * 128,
        Y = 34,
        w = style == 1 ? 72 : 60,
        h = style == 1 ? 96 : 110;
      x.fillStyle = 'rgba(255,255,255,.9)';
      x.fillRect(X - 6, Y - 6, w + 12, h + 12);
      const g = x.createLinearGradient(X, Y, X + w, Y + h);
      g.addColorStop(0, '#5f7894');
      g.addColorStop(0.5, '#8fa8c2');
      g.addColorStop(1, '#4c6178');
      x.fillStyle = g;
      x.fillRect(X, Y, w, h);
      x.fillStyle = 'rgba(255,255,255,.35)';
      x.beginPath();
      x.moveTo(X + 6, Y + h - 10);
      x.lineTo(X + w * 0.45, Y + 8);
      x.lineTo(X + w * 0.6, Y + 8);
      x.lineTo(X + 16, Y + h - 10);
      x.fill();
      x.fillStyle = 'rgba(255,255,255,.9)';
      x.fillRect(X + w / 2 - 2, Y, 4, h);
    }
  });
}
// fenêtres allumées la nuit (carte d'émission) : certaines seulement
export function facadeNuit(style = 0) {
  return texture('facadeNuit' + style, 256, 192, (x, L, H) => {
    x.fillStyle = '#000';
    x.fillRect(0, 0, L, H);
    for (let i = 0; i < 2; i++) {
      const X = 28 + i * 128,
        w = style == 1 ? 72 : 60,
        h = style == 1 ? 96 : 110;
      if ((i + style) % 3 == 2) continue;
      const g = x.createLinearGradient(0, 34, 0, 34 + h);
      g.addColorStop(0, '#ffe7a8');
      g.addColorStop(1, '#ffb347');
      x.fillStyle = g;
      x.fillRect(X, 34, w, h);
    }
  });
}

// flanc de wagon : bande blanche, vitres, portes, numéro et graffitis ; un motif = 6 m
export function flancWagon(couleur, variante = 0) {
  return texture('flanc' + couleur + variante, 512, 192, (x, L, H) => {
    const r = alea(variante * 977 + couleur.length);
    x.fillStyle = couleur;
    x.fillRect(0, 0, L, H);
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,255,255,.18)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(0,0,0,.18)');
    x.fillStyle = g;
    x.fillRect(0, 0, L, H);
    x.fillStyle = '#ffffff';
    x.fillRect(0, 128, L, 10);
    x.fillStyle = 'rgba(0,0,0,.25)';
    x.fillRect(0, 170, L, 22);
    // vitres
    for (const X of [40, 300]) {
      arrondi(x, X, 34, 170, 64, 10);
      x.fillStyle = '#1e2a40';
      x.fill();
      x.fillStyle = 'rgba(160,200,255,.35)';
      x.beginPath();
      x.moveTo(X + 20, 92);
      x.lineTo(X + 70, 40);
      x.lineTo(X + 100, 40);
      x.lineTo(X + 50, 92);
      x.fill();
    }
    // porte
    x.strokeStyle = 'rgba(0,0,0,.35)';
    x.lineWidth = 4;
    x.strokeRect(236, 28, 50, 136);
    x.beginPath();
    x.moveTo(261, 28);
    x.lineTo(261, 164);
    x.stroke();
    x.fillStyle = '#1e2a40';
    x.fillRect(242, 40, 16, 50);
    x.fillRect(264, 40, 16, 50);
    // graffiti
    if (variante % 2) {
      const cs = ['#ffd166', '#06d6a0', '#ef476f', '#118ab2', '#ffffff'];
      x.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        x.strokeStyle = cs[Math.floor(r() * cs.length)];
        x.lineWidth = 9 + r() * 6;
        x.beginPath();
        let X = 40 + r() * 400,
          Y = 110 + r() * 50;
        x.moveTo(X, Y);
        for (let s = 0; s < 4; s++) {
          X += 20 + r() * 30;
          x.quadraticCurveTo(X - 10, Y - 40 * r(), X, Y + (r() - 0.5) * 30);
        }
        x.stroke();
      }
    }
    x.fillStyle = 'rgba(255,255,255,.85)';
    x.font = '700 22px sans-serif';
    x.fillText(String(100 + Math.floor(r() * 899)), 450, 160);
  });
}
// face avant : pare-brise, phares, bande
export function faceWagon(couleur) {
  return texture('face' + couleur, 256, 256, (x, L, H) => {
    x.fillStyle = couleur;
    x.fillRect(0, 0, L, H);
    arrondi(x, 30, 40, 196, 100, 18);
    x.fillStyle = '#1b2438';
    x.fill();
    x.fillStyle = 'rgba(160,200,255,.3)';
    x.beginPath();
    x.moveTo(50, 130);
    x.lineTo(120, 48);
    x.lineTo(150, 48);
    x.lineTo(80, 130);
    x.fill();
    x.fillStyle = '#ffffff';
    x.fillRect(0, 170, L, 12);
    for (const X of [52, 204]) {
      x.fillStyle = '#fff6d0';
      x.beginPath();
      x.arc(X, 206, 16, 0, 7);
      x.fill();
    }
    x.fillStyle = 'rgba(0,0,0,.3)';
    x.fillRect(0, 236, L, 20);
  });
}
// toit : gris métal avec aérateurs
export function toitWagon() {
  return texture('toit', 128, 256, (x, L, H) => {
    x.fillStyle = '#c8ced8';
    x.fillRect(0, 0, L, H);
    x.fillStyle = '#9aa3b2';
    for (let y = 30; y < H; y += 120) {
      x.fillRect(34, y, 60, 40);
      x.fillStyle = '#7d8696';
      for (let k = 0; k < 4; k++) x.fillRect(38, y + 6 + k * 9, 52, 4);
      x.fillStyle = '#9aa3b2';
    }
  }, { repete: true });
}

export function rayures(c1, c2 = '#ffffff', n = 6) {
  return texture('rayures' + c1 + c2 + n, 256, 64, (x, L, H) => {
    x.fillStyle = c2;
    x.fillRect(0, 0, L, H);
    x.fillStyle = c1;
    const w = L / n;
    for (let i = -1; i < n + 1; i += 2) {
      x.beginPath();
      x.moveTo(i * w, H);
      x.lineTo(i * w + w, H);
      x.lineTo(i * w + w * 1.6, 0);
      x.lineTo(i * w + w * 0.6, 0);
      x.fill();
    }
  });
}

export function caisse() {
  return texture('caisse', 256, 256, (x, L, H) => {
    x.fillStyle = '#d29a58';
    x.fillRect(0, 0, L, H);
    x.fillStyle = 'rgba(120,70,30,.35)';
    for (let y = 0; y < H; y += 32) x.fillRect(0, y, L, 3);
    x.fillStyle = '#9a5f2a';
    x.fillRect(0, 0, L, 22);
    x.fillRect(0, H - 22, L, 22);
    x.fillRect(0, 0, 22, H);
    x.fillRect(L - 22, 0, 22, H);
    x.fillStyle = '#fff3d6';
    x.font = '900 150px sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('?', L / 2, H / 2 + 8);
  });
}

export function fleches() {
  return texture('fleches', 128, 256, (x, L, H) => {
    x.fillStyle = '#0f6f66';
    x.fillRect(0, 0, L, H);
    x.fillStyle = '#7dfff0';
    for (let y = 0; y < H; y += 85) {
      x.beginPath();
      x.moveTo(14, y + 70);
      x.lineTo(L / 2, y + 16);
      x.lineTo(L - 14, y + 70);
      x.lineTo(L - 34, y + 70);
      x.lineTo(L / 2, y + 42);
      x.lineTo(34, y + 70);
      x.fill();
    }
  }, { repete: true });
}

export function damier() {
  return texture('damier', 256, 32, (x, L, H) => {
    for (let i = 0; i < 16; i++)
      for (let j = 0; j < 2; j++) {
        x.fillStyle = (i + j) % 2 ? '#1d1d24' : '#ffffff';
        x.fillRect(i * 16, j * 16, 16, 16);
      }
  });
}

// fresque murale (graffiti) : une couleur de fond et des tags
export function fresque(n) {
  return texture('fresque' + n, 512, 64, (x, L, H) => {
    const r = alea(n * 31 + 7),
      cs = ['#ff5a5f', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5', '#f15bb5', '#00bbf9'];
    x.fillStyle = cs[Math.floor(r() * cs.length)];
    x.fillRect(0, 0, L, H);
    x.lineCap = 'round';
    for (let k = 0; k < 6; k++) {
      x.strokeStyle = cs[Math.floor(r() * cs.length)];
      x.lineWidth = 6 + r() * 8;
      x.beginPath();
      let X = r() * L,
        Y = 10 + r() * 44;
      x.moveTo(X, Y);
      for (let s = 0; s < 3; s++) {
        X += 20 + r() * 40;
        x.quadraticCurveTo(X - 15, 4 + r() * 56, X, 10 + r() * 44);
      }
      x.stroke();
    }
    x.fillStyle = 'rgba(255,255,255,.9)';
    x.font = '900 34px sans-serif';
    x.fillText(['VOIE', 'LIBRE', 'CITY', 'GO!', 'RUN'][Math.floor(r() * 5)], 30 + r() * 300, 46);
  });
}

export function ballast() {
  return texture('ballast', 128, 128, (x, L, H) => {
    x.fillStyle = '#b8c0cc';
    x.fillRect(0, 0, L, H);
    const r = alea(42);
    for (let i = 0; i < 1400; i++) {
      const v = 160 + r() * 60;
      x.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 8) + ',.8)';
      x.beginPath();
      x.arc(r() * L, r() * H, 1 + r() * 1.6, 0, 7);
      x.fill();
    }
  }, { repete: true });
}

export function beton() {
  return texture('beton', 128, 128, (x, L, H) => {
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, L, H);
    const r = alea(9);
    for (let i = 0; i < 400; i++) {
      x.fillStyle = 'rgba(0,0,0,' + r() * 0.06 + ')';
      x.fillRect(r() * L, r() * H, 3, 3);
    }
    x.fillStyle = 'rgba(0,0,0,.1)';
    x.fillRect(0, 0, L, 2);
    x.fillRect(0, 0, 2, H);
  }, { repete: true });
}

export function panneau(texte, fond = '#1c3470') {
  return texture('panneau' + texte + fond, 512, 128, (x, L, H) => {
    arrondi(x, 4, 4, L - 8, H - 8, 16);
    x.fillStyle = fond;
    x.fill();
    x.lineWidth = 6;
    x.strokeStyle = '#ffffff';
    x.stroke();
    x.fillStyle = '#ffffff';
    x.font = '800 60px sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(texte, L / 2, H / 2 + 4);
  });
}

export function nuage() {
  return texture('nuage', 256, 128, (x, L, H) => {
    for (const [cx, cy, r] of [[80, 80, 44], [130, 62, 56], [180, 82, 40], [110, 92, 40], [160, 96, 36]]) {
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.7, 'rgba(255,255,255,.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.beginPath();
      x.arc(cx, cy, r, 0, 7);
      x.fill();
    }
  });
}

export function halo(couleur = '#ffffff') {
  return texture('halo' + couleur, 128, 128, (x, L, H) => {
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, couleur);
    g.addColorStop(0.25, couleur + 'aa');
    g.addColorStop(1, couleur + '00');
    x.fillStyle = g;
    x.fillRect(0, 0, L, H);
  });
}

// icône d'un bonus (ou d'une lettre, d'un jeton) sur un disque coloré
export function icone(k, couleur, lettre = '') {
  return texture('icone' + k + couleur + lettre, 128, 128, (x, L, H) => {
    x.fillStyle = couleur;
    x.beginPath();
    x.arc(64, 64, 58, 0, 7);
    x.fill();
    x.lineWidth = 6;
    x.strokeStyle = 'rgba(255,255,255,.9)';
    x.stroke();
    x.fillStyle = x.strokeStyle = '#ffffff';
    x.lineWidth = 12;
    x.lineCap = x.lineJoin = 'round';
    x.beginPath();
    if (k == 'aimant') {
      x.arc(64, 60, 24, Math.PI, 0, true);
      x.moveTo(40, 60);
      x.lineTo(40, 34);
      x.moveTo(88, 60);
      x.lineTo(88, 34);
      x.stroke();
    } else if (k == 'saut') {
      for (const y of [62, 88]) {
        x.moveTo(38, y);
        x.lineTo(64, y - 26);
        x.lineTo(90, y);
      }
      x.stroke();
    } else if (k == 'jetpack') {
      x.fillRect(38, 30, 20, 46);
      x.fillRect(70, 30, 20, 46);
      x.fillStyle = '#ffd166';
      x.moveTo(40, 80);
      x.lineTo(48, 104);
      x.lineTo(56, 80);
      x.moveTo(72, 80);
      x.lineTo(80, 104);
      x.lineTo(88, 80);
      x.fill();
    } else if (k == 'bulle') {
      x.lineWidth = 8;
      x.arc(64, 64, 30, 0, 7);
      x.stroke();
      x.beginPath();
      x.arc(54, 54, 7, 0, 7);
      x.fill();
    } else if (k == 'jeton' && lettre == 'citrouille') {
      x.fillStyle = '#ffe2b8';
      x.beginPath();
      x.moveTo(34, 56);
      x.lineTo(46, 38);
      x.lineTo(58, 56);
      x.moveTo(70, 56);
      x.lineTo(82, 38);
      x.lineTo(94, 56);
      x.moveTo(32, 72);
      x.quadraticCurveTo(64, 108, 96, 72);
      x.quadraticCurveTo(64, 86, 32, 72);
      x.fill();
    } else if (k == 'jeton' && lettre == 'cadeau') {
      x.fillRect(34, 50, 60, 46);
      x.fillStyle = '#ffd166';
      x.fillRect(58, 50, 12, 46);
      x.fillRect(34, 66, 60, 10);
      x.beginPath();
      x.ellipse(52, 44, 12, 8, -0.5, 0, 7);
      x.ellipse(76, 44, 12, 8, 0.5, 0, 7);
      x.fill();
    } else if (k == 'jeton') {
      x.fillStyle = '#ffd6a5';
      x.beginPath();
      x.moveTo(46, 62);
      x.lineTo(64, 106);
      x.lineTo(82, 62);
      x.fill();
      x.fillStyle = '#ff8fab';
      x.beginPath();
      x.arc(64, 52, 22, 0, 7);
      x.fill();
    } else {
      x.font = '900 ' + (k == 'x2' ? 54 : 70) + 'px sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(k == 'x2' ? '×2' : lettre, 64, 68);
    }
  });
}

// silhouette de chauve-souris (Halloween)
export function chauveSouris() {
  return texture('chauve', 128, 64, (x, L, H) => {
    x.fillStyle = '#1c1024';
    x.beginPath();
    x.moveTo(64, 26);
    x.quadraticCurveTo(40, 4, 6, 18);
    x.quadraticCurveTo(22, 26, 18, 40);
    x.quadraticCurveTo(34, 30, 44, 42);
    x.quadraticCurveTo(52, 34, 64, 46);
    x.quadraticCurveTo(76, 34, 84, 42);
    x.quadraticCurveTo(94, 30, 110, 40);
    x.quadraticCurveTo(106, 26, 122, 18);
    x.quadraticCurveTo(88, 4, 64, 26);
    x.fill();
    x.beginPath();
    x.arc(64, 30, 8, 0, 7);
    x.fill();
  });
}
