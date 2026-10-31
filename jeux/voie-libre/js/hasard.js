// Hasard reproductible (même graine = même parcours) et petits outils de dates.

// générateur pseudo-aléatoire « mulberry32 » : renvoie une fonction qui donne des nombres entre 0 et 1
export function alea(graine) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function melange(r, t) {
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

// valeur pseudo-aléatoire stable pour un nombre donné (décor, pluie…)
export const bruit = n => (((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1) + 1) % 1;

// tirage pondéré dans une liste d'objets ayant un champ « poids »
export function tirer(r, liste) {
  let t = r() * liste.reduce((s, x) => s + x.poids, 0);
  for (const x of liste) if ((t -= x.poids) < 0) return x;
  return liste[0];
}

const deux = n => String(n).padStart(2, '0');
export const jourDe = d => d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate());
export const aujourdhui = () => jourDe(new Date());
export const hier = () => jourDe(new Date(Date.now() - 864e5));
