// Commandes : clavier (flèches, ZQSD ou WASD), glissements tactiles ou à la souris, deux tapes = planche.
// a : { gauche, droite, sauter, glisser, planche, elan, pause, actif() } ; sensibilite() : 0,7 / 1 / 1,4
export function brancherControles(cible, a, sensibilite) {
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || !a.actif()) return;
    const k = e.key.length == 1 ? e.key.toLowerCase() : e.key;
    const f = {
      ArrowLeft: a.gauche, q: a.gauche, a: a.gauche,
      ArrowRight: a.droite, d: a.droite,
      ArrowUp: a.sauter, ' ': a.sauter, z: a.sauter, w: a.sauter,
      ArrowDown: a.glisser, s: a.glisser,
      b: a.planche, Shift: a.planche, e: a.elan,
      Escape: a.pause, p: a.pause
    }[k];
    if (f) {
      e.preventDefault();
      if (!e.repeat) f();
    }
  });
  let o = null,
    derniereTape = 0;
  cible.addEventListener('pointerdown', e => {
    o = { x: e.clientX, y: e.clientY, fait: false };
    try {
      cible.setPointerCapture(e.pointerId);
    } catch (er) {}
  });
  cible.addEventListener('pointermove', e => {
    if (!o || o.fait || !a.actif()) return;
    const dx = e.clientX - o.x,
      dy = e.clientY - o.y,
      seuil = Math.max(16, Math.min(innerWidth, innerHeight) * 0.04) / sensibilite();
    if (Math.hypot(dx, dy) < seuil) return;
    o.fait = true;
    if (Math.abs(dx) > Math.abs(dy)) (dx < 0 ? a.gauche : a.droite)();
    else (dy < 0 ? a.sauter : a.glisser)();
  });
  cible.addEventListener('pointerup', () => {
    if (o && !o.fait && a.actif()) {
      const t = performance.now();
      if (t - derniereTape < 320) {
        a.planche();
        derniereTape = 0;
      } else derniereTape = t;
    }
    o = null;
  });
  cible.addEventListener('pointercancel', () => (o = null));
}
