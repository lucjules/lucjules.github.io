/* Voie libre : contenu du jeu (quartiers, personnages, planches, bonus, missions, niveaux).
   Les couleurs sont en [rouge, vert, bleu]. Ce fichier est chargé avant jeu.js. */
window.VL_DONNEES = {
  // La ville est découpée en quartiers qui se suivent pendant la course (un tous les 1 200 m).
  // nuit : 0 = plein jour, 1 = nuit (fenêtres allumées, lampadaires, étoiles)
  quartiers: [
    {
      id: 'port',
      nom: 'Le Port',
      ciel: [96, 176, 255],
      brume: [214, 234, 252],
      sol: [204, 213, 224],
      ballast: [194, 202, 214],
      mur: [236, 241, 247],
      nuit: 0,
      immeubles: [[176, 196, 214], [214, 226, 238], [150, 180, 205], [230, 214, 190], [196, 210, 200]],
      decor: ['conteneurs', 'conteneurs', 'grue'],
      musique: [45, 45, 48, 43] // notes de basse (MIDI), une par mesure
    },
    {
      id: 'briques',
      nom: 'Quartier des Briques',
      ciel: [255, 168, 118],
      brume: [255, 228, 204],
      sol: [220, 204, 190],
      ballast: [204, 192, 182],
      mur: [242, 228, 216],
      nuit: 0.1,
      immeubles: [[196, 92, 72], [214, 122, 86], [172, 82, 74], [226, 162, 112], [150, 102, 92]],
      decor: ['reservoir', 'passerelle'],
      musique: [41, 41, 43, 36]
    },
    {
      id: 'couchant',
      nom: 'Promenade du Couchant',
      ciel: [255, 104, 146],
      brume: [255, 212, 178],
      sol: [240, 214, 176],
      ballast: [214, 196, 178],
      mur: [255, 236, 224],
      nuit: 0.25,
      immeubles: [[255, 182, 193], [221, 160, 221], [255, 218, 185], [176, 224, 230], [255, 200, 150]],
      decor: ['palmier', 'palmier'],
      musique: [43, 40, 36, 38]
    },
    {
      id: 'parc',
      nom: 'Parc des Lumières',
      ciel: [14, 20, 58],
      brume: [56, 56, 108],
      sol: [42, 66, 58],
      ballast: [78, 84, 104],
      mur: [116, 122, 150],
      nuit: 1,
      immeubles: [[60, 64, 102], [76, 70, 122], [50, 80, 102], [90, 66, 110]],
      decor: ['arbre', 'lampadaire', 'passerelle'],
      musique: [38, 38, 41, 33]
    }
  ],

  // Personnages : couleurs du sweat, du pantalon, du sac, de la peau, des cheveux et de la coiffure
  personnages: [
    { id: 'lune', nom: 'Lune', prix: 0, sweat: '#7c5cff', bras: '#6a4be8', pantalon: '#2c3e6e', sac: '#ff8fab', peau: '#f2c6a0', cheveux: '#4a3426', coiffure: 'casquette', accessoire: '#ff6b6b' },
    { id: 'malo', nom: 'Malo', prix: 1500, sweat: '#06d6a0', bras: '#05b386', pantalon: '#3a3a4a', sac: '#ffd166', peau: '#d9a07a', cheveux: '#1d1a17', coiffure: 'bonnet', accessoire: '#ef476f' },
    { id: 'ines', nom: 'Inès', prix: 3000, sweat: '#ffd166', bras: '#f2b93b', pantalon: '#264653', sac: '#118ab2', peau: '#8d5a3b', cheveux: '#2b1a12', coiffure: 'couettes', accessoire: '#ef476f' },
    { id: 'sacha', nom: 'Sacha', prix: 5000, sweat: '#22223b', bras: '#1a1a2e', pantalon: '#4a4e69', sac: '#00f5d4', peau: '#f0c8a8', cheveux: '#ff4d9d', coiffure: 'crete', accessoire: '#00f5d4' },
    { id: 'yuna', nom: 'Yuna', prix: 8000, sweat: '#ef476f', bras: '#d63c61', pantalon: '#073b4c', sac: '#ffffff', peau: '#f5d0b0', cheveux: '#0b0b0b', coiffure: 'chignon', accessoire: '#ffd166' }
  ],

  // Planches (protègent d'un choc pendant 30 s ; double-tape ou touche B)
  planches: [
    { id: 'classique', nom: 'Classique', prix: 0, c1: '#ff6b6b', c2: '#ffffff', lueur: '#7fdcff' },
    { id: 'eclair', nom: 'Éclair', prix: 2000, c1: '#ffd60a', c2: '#1d1d1d', lueur: '#ffe066' },
    { id: 'ocean', nom: 'Océan', prix: 3500, c1: '#0096c7', c2: '#90e0ef', lueur: '#48cae4' },
    { id: 'neon', nom: 'Néon', prix: 6000, c1: '#ff4d9d', c2: '#00f5d4', lueur: '#ff8fd8' }
  ],

  // Bonus ramassés pendant la course ; les durées augmentent avec les améliorations (5 niveaux)
  bonus: {
    aimant: { nom: 'Aimant', c: '#ef476f', base: 8, pas: 2.5, poids: 25 },
    saut: { nom: 'Super baskets', c: '#06d6a0', base: 8, pas: 2.5, poids: 20 },
    x2: { nom: 'Score ×2', c: '#ffb703', base: 8, pas: 2.5, poids: 20 },
    jetpack: { nom: 'Jetpack', c: '#8338ec', base: 6, pas: 1.5, poids: 12 },
    bulle: { nom: 'Bulle', c: '#ff70a6', base: 12, pas: 3, poids: 15 }
  },
  prixAmelio: [150, 400, 900, 1800, 3500],

  // Missions : trois à la fois ; les trois réussies, le multiplicateur de score augmente.
  // k = numéro de la série (le multiplicateur actuel), pour que les missions deviennent plus dures.
  // course : la mission doit être réussie en une seule course
  missions: [
    { t: 'pieces', txt: n => 'Ramasse ' + n + ' pièces', n: k => 250 + 100 * k },
    { t: 'pieces', course: true, txt: n => 'Ramasse ' + n + ' pièces en une course', n: k => 60 + 25 * k },
    { t: 'sauts', txt: n => 'Saute ' + n + ' fois', n: k => 25 + 10 * k },
    { t: 'glisses', txt: n => 'Glisse ' + n + ' fois', n: k => 20 + 8 * k },
    { t: 'distance', course: true, txt: n => 'Cours ' + n + ' m en une course', n: k => 500 + 250 * k },
    { t: 'score', course: true, txt: n => 'Fais un score de ' + n.toLocaleString('fr-FR') + ' en une course', n: k => 3000 + 3000 * k },
    { t: 'caisses', txt: n => 'Écrase ' + n + ' caisses (glisse en plein saut au-dessus)', n: k => 3 + 2 * k },
    { t: 'bonus', txt: n => 'Ramasse ' + n + ' bonus', n: k => 4 + 2 * k },
    { t: 'toits', txt: n => 'Cours ' + n + ' m sur les toits des wagons', n: k => 150 + 100 * k },
    { t: 'pads', txt: n => 'Passe sur ' + n + ' accélérateurs', n: k => 2 + k },
    { t: 'drones', txt: n => 'Glisse sous ' + n + ' drones', n: k => 3 + 2 * k },
    { t: 'voies', course: true, txt: n => 'Change de voie ' + n + ' fois en une course', n: k => 40 + 15 * k },
    { t: 'planches', txt: n => 'Utilise ' + n + ' planche' + (n > 1 ? 's' : ''), n: k => 1 + Math.floor(k / 3) }
  ],

  // Mots de la chasse aux lettres (un par jour)
  mots: ['VILLE', 'METRO', 'RAILS', 'TURBO', 'WAGON', 'QUAI', 'PLANCHE', 'TOITS', 'DRONE', 'SPRINT'],

  // Tour de la ville : trois niveaux par quartier, de plus en plus longs et rapides.
  // Étoiles : arriver au bout, ramasser assez de pièces, ne jamais trébucher.
  niveaux: (() => {
    const n = [];
    for (let q = 0; q < 4; q++)
      for (let i = 0; i < 3; i++)
        n.push({ q, long: 700 + i * 350 + q * 150, depart: q * 500 + i * 250, pieces: 70 + 35 * i + 25 * q, graine: 7919 * (q * 3 + i + 1) });
    return n;
  })()
};
