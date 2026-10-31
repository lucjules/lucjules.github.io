// Voie libre 1.0 : contenu du jeu (quartiers, personnages, planches, bonus, missions, trophées, niveaux, événements).
// Aucune logique ici : seulement des données, utilisées par la course, la progression, le rendu et l'interface.

// La ville est découpée en quartiers qui se suivent pendant la course libre (un tous les 1 200 m).
// Couleurs en hexadécimal. nuit : 0 = plein jour, 1 = nuit (fenêtres allumées, lampadaires, étoiles).
export const QUARTIERS = [
  {
    id: 'port',
    nom: 'Le Port',
    ciel: '#5aa9ff',
    horizon: '#d8ecff',
    soleil: '#fff4dc',
    sol: '#c9d3df',
    ballast: '#b9c2cf',
    mur: '#e9eef5',
    nuit: 0,
    immeubles: ['#9fb8cf', '#d5e2ee', '#86a7c4', '#e4d3b8', '#bcd1c5'],
    decor: ['conteneurs', 'grue', 'tunnel'],
    pluie: true,
    musique: [45, 45, 48, 43], // note de basse (MIDI) de chaque mesure
    melodie: [12, null, 15, null, 17, null, 15, 12, null, 10, 12, null, 15, null, null, null]
  },
  {
    id: 'briques',
    nom: 'Quartier des Briques',
    ciel: '#ff9f6b',
    horizon: '#ffe2c6',
    soleil: '#ffe0b0',
    sol: '#d8c4b2',
    ballast: '#c7b6a8',
    mur: '#f0e2d4',
    nuit: 0.1,
    immeubles: ['#b8533f', '#d27a50', '#a24a42', '#e0a16b', '#8f5d52'],
    decor: ['reservoir', 'passerelle', 'tunnel'],
    pluie: true,
    musique: [41, 41, 43, 36],
    melodie: [19, null, 17, 15, null, 12, null, 15, 17, null, null, 19, 22, null, 19, null]
  },
  {
    id: 'couchant',
    nom: 'Promenade du Couchant',
    ciel: '#ff5f95',
    horizon: '#ffd2a8',
    soleil: '#ffd27a',
    sol: '#ecd2a8',
    ballast: '#d6c1a8',
    mur: '#ffeadf',
    nuit: 0.3,
    immeubles: ['#ffb3c1', '#dc9ee0', '#ffd7b5', '#aee0e6', '#ffc58f'],
    decor: ['palmier'],
    musique: [43, 40, 36, 38],
    melodie: [16, null, null, 19, null, 21, 19, null, 16, null, 14, null, 12, null, null, null]
  },
  {
    id: 'parc',
    nom: 'Parc des Lumières',
    ciel: '#0b1238',
    horizon: '#3a3a72',
    soleil: '#dfe6ff',
    sol: '#2b4a3f',
    ballast: '#4e5468',
    mur: '#737a98',
    nuit: 1,
    immeubles: ['#3c4066', '#4c467a', '#32506a', '#5a426e'],
    decor: ['arbre', 'lampadaire', 'passerelle', 'tunnel'],
    musique: [38, 38, 41, 33],
    melodie: [15, null, 12, null, 10, null, 12, null, 15, null, 17, null, 15, null, 12, null]
  },
  {
    id: 'gare',
    nom: 'Gare Centrale',
    ciel: '#7eaee0',
    horizon: '#e2e9f2',
    soleil: '#fff6e6',
    sol: '#c3c8d2',
    ballast: '#b6bbc8',
    mur: '#e3e5ec',
    nuit: 0.05,
    immeubles: ['#d6c4aa', '#beb4a8', '#e2d6c4', '#afa496'],
    decor: ['quais'],
    pluie: true,
    musique: [40, 43, 45, 38],
    melodie: [12, 14, 16, null, 19, null, 16, null, 14, null, 12, null, 9, null, null, null]
  }
];

// Personnages : couleurs et coiffure. Ceux d'un événement ne sont pas en vente.
export const PERSONNAGES = [
  { id: 'lune', nom: 'Lune', prix: 0, sweat: '#7c5cff', pantalon: '#2c3e6e', sac: '#ff8fab', peau: '#f2c6a0', cheveux: '#4a3426', coiffure: 'casquette', accessoire: '#ff5a5f', chaussures: '#ffffff' },
  { id: 'malo', nom: 'Malo', prix: 1500, sweat: '#06d6a0', pantalon: '#3a3a4a', sac: '#ffd166', peau: '#d9a07a', cheveux: '#1d1a17', coiffure: 'bonnet', accessoire: '#ef476f', chaussures: '#ffd166' },
  { id: 'ines', nom: 'Inès', prix: 3000, sweat: '#ffd166', pantalon: '#264653', sac: '#118ab2', peau: '#8d5a3b', cheveux: '#2b1a12', coiffure: 'couettes', accessoire: '#ef476f', chaussures: '#ffffff' },
  { id: 'sacha', nom: 'Sacha', prix: 5000, sweat: '#2b2b44', pantalon: '#4a4e69', sac: '#00f5d4', peau: '#f0c8a8', cheveux: '#ff4d9d', coiffure: 'crete', accessoire: '#00f5d4', chaussures: '#00f5d4' },
  { id: 'yuna', nom: 'Yuna', prix: 8000, sweat: '#ef476f', pantalon: '#073b4c', sac: '#ffffff', peau: '#f5d0b0', cheveux: '#151515', coiffure: 'chignon', accessoire: '#ffd166', chaussures: '#ffffff' },
  { id: 'spectre', nom: 'Spectre', evenement: 'halloween', sweat: '#eef0f8', pantalon: '#c9ccda', sac: '#ff8c2e', peau: '#e8e9f2', cheveux: '#eef0f8', coiffure: 'capuche', accessoire: '#ff8c2e', chaussures: '#2b2b2b' },
  { id: 'lutin', nom: 'Lutin', evenement: 'hiver', sweat: '#2a9d5c', pantalon: '#c1272d', sac: '#ffffff', peau: '#f2c6a0', cheveux: '#8b4513', coiffure: 'bonnet', accessoire: '#c1272d', chaussures: '#5a3a1a' },
  { id: 'sol', nom: 'Sol', evenement: 'ete', sweat: '#00b4d8', pantalon: '#ffb703', sac: '#fb8500', peau: '#c68642', cheveux: '#1d1d1d', coiffure: 'couettes', accessoire: '#ffd166', chaussures: '#ffffff' }
];

// Planches : elles encaissent un choc pendant 30 s ; chacune a son pouvoir.
export const PLANCHES = [
  { id: 'classique', nom: 'Classique', prix: 0, c1: '#ff5a5f', c2: '#ffffff', lueur: '#7fdcff', pouvoir: null, txt: 'Encaisse un choc' },
  { id: 'eclair', nom: 'Éclair', prix: 2000, c1: '#ffd60a', c2: '#1d1d1d', lueur: '#ffe066', pouvoir: 'saut', txt: 'Sauts plus hauts sur la planche' },
  { id: 'ocean', nom: 'Océan', prix: 3500, c1: '#0096c7', c2: '#90e0ef', lueur: '#48cae4', pouvoir: 'aimant', txt: 'Attire les pièces tant qu\'elle dure' },
  { id: 'neon', nom: 'Néon', prix: 6000, c1: '#ff4d9d', c2: '#00f5d4', lueur: '#ff8fd8', pouvoir: 'duree', txt: 'Dure 45 s au lieu de 30' },
  { id: 'citrouille', nom: 'Citrouille', evenement: 'halloween', c1: '#ff8c2e', c2: '#1d1d1d', lueur: '#ffb15c', pouvoir: 'saut', txt: 'Sauts plus hauts sur la planche' },
  { id: 'flocon', nom: 'Flocon', evenement: 'hiver', c1: '#e8f4ff', c2: '#4cc9f0', lueur: '#bde8ff', pouvoir: 'duree', txt: 'Dure 45 s au lieu de 30' },
  { id: 'soleil', nom: 'Soleil', evenement: 'ete', c1: '#ffd60a', c2: '#fb8500', lueur: '#ffe066', pouvoir: 'aimant', txt: 'Attire les pièces tant qu\'elle dure' }
];

// Bonus ramassés pendant la course ; durée = base + pas × niveau d'amélioration (0 à 5)
export const BONUS = {
  aimant: { nom: 'Aimant', c: '#ef476f', base: 8, pas: 2.5, poids: 25 },
  saut: { nom: 'Super baskets', c: '#06d6a0', base: 8, pas: 2.5, poids: 20 },
  x2: { nom: 'Score ×2', c: '#ffb703', base: 8, pas: 2.5, poids: 20 },
  jetpack: { nom: 'Jetpack', c: '#8338ec', base: 6, pas: 1.5, poids: 12 },
  bulle: { nom: 'Bulle', c: '#ff70a6', base: 12, pas: 3, poids: 15 }
};
export const PRIX_AMELIO = [150, 400, 900, 1800, 3500];
export const PRIX = { planches: 300, elans: 600, coffre: 400, cle: 1500 };

// Missions : trois à la fois ; les trois réussies, le multiplicateur de score augmente (et un coffre est offert).
// k = numéro de la série (multiplicateur actuel - 1) ; course : à réussir en une seule course
export const MISSIONS = [
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
  { t: 'planches', planche: true, txt: n => 'Utilise ' + n + ' planche' + (n > 1 ? 's' : ''), n: k => 1 + Math.floor(k / 3) },
  { t: 'figures', planche: true, txt: n => 'Réussis ' + n + ' figures sur la planche (saute avec)', n: k => 3 + 2 * k },
  { t: 'esquives', txt: n => 'Esquive de justesse ' + n + ' obstacles', n: k => 5 + 3 * k }
];

// Trophées : chacun rapporte des pièces une fois pour toutes. type : la valeur suivie, n : le seuil.
export const TROPHEES = [
  { id: 'depart', nom: 'Premier départ', txt: 'Termine ta première course', type: 'parties', n: 1, gain: 100 },
  { id: 'd1000', nom: 'Bon pied', txt: 'Cours 1 000 m en une course', type: 'distance', n: 1000, gain: 200 },
  { id: 'd3000', nom: 'Marathonien', txt: 'Cours 3 000 m en une course', type: 'distance', n: 3000, gain: 500 },
  { id: 'quartiers', nom: 'Tour complet', txt: 'Traverse les 5 quartiers en une course (6 000 m)', type: 'distance', n: 6000, gain: 1500 },
  { id: 's10k', nom: 'Beau score', txt: 'Fais un score de 10 000', type: 'score', n: 10000, gain: 200 },
  { id: 's50k', nom: 'Grand score', txt: 'Fais un score de 50 000', type: 'score', n: 50000, gain: 600 },
  { id: 's200k', nom: 'Légende de la ville', txt: 'Fais un score de 200 000', type: 'score', n: 200000, gain: 2000 },
  { id: 'p100', nom: 'Tirelire', txt: 'Ramasse 100 pièces en une course', type: 'piecesCourse', n: 100, gain: 150 },
  { id: 'p5000', nom: 'Trésor', txt: 'Ramasse 5 000 pièces au total', type: 'piecesTotal', n: 5000, gain: 500 },
  { id: 'caisses', nom: 'Démolisseur', txt: 'Écrase 25 caisses', type: 'caisses', n: 25, gain: 300 },
  { id: 'drones', nom: 'Sous les radars', txt: 'Glisse sous 40 drones', type: 'drones', n: 40, gain: 300 },
  { id: 'toits', nom: 'Funambule', txt: 'Cours 2 000 m sur les toits', type: 'toits', n: 2000, gain: 400 },
  { id: 'planches', nom: 'Glisse urbaine', txt: 'Utilise 10 planches', type: 'planches', n: 10, gain: 300 },
  { id: 'figures', nom: 'Acrobate', txt: 'Réussis 25 figures sur la planche', type: 'figures', n: 25, gain: 400 },
  { id: 'justesse', nom: 'Sang-froid', txt: 'Esquive de justesse 50 obstacles', type: 'esquives', n: 50, gain: 500 },
  { id: 'port', nom: 'Capitaine du port', txt: 'Termine les 3 niveaux du Port', type: 'niveauxPort', n: 3, gain: 300 },
  { id: 'etoiles', nom: 'Toutes les étoiles', txt: 'Obtiens les 45 étoiles du Tour de la ville', type: 'etoiles', n: 45, gain: 3000 },
  { id: 'x5', nom: 'Multiplicateur ×5', txt: 'Atteins le multiplicateur ×5 avec les missions', type: 'multi', n: 5, gain: 500 },
  { id: 'x10', nom: 'Multiplicateur ×10', txt: 'Atteins le multiplicateur ×10', type: 'multi', n: 10, gain: 1500 },
  { id: 'defi', nom: 'Défi relevé', txt: 'Tiens les 60 s d\'un défi du jour', type: 'defis', n: 1, gain: 200 },
  { id: 'mot', nom: 'Chasseur de lettres', txt: 'Trouve un mot du jour', type: 'mots', n: 1, gain: 200 },
  { id: 'coffres', nom: 'Chasseur de trésors', txt: 'Ouvre 10 coffres mystère', type: 'coffres', n: 10, gain: 500 },
  { id: 'bande', nom: 'Toute la bande', txt: 'Débloque 5 personnages', type: 'persos', n: 5, gain: 1000 }
];

// Cadeau du jour, de plus en plus beau sur 7 jours d'affilée
export const QUOTIDIEN = [
  { txt: '100 pièces', pieces: 100 },
  { txt: '1 planche', planches: 1 },
  { txt: '250 pièces', pieces: 250 },
  { txt: '1 clé', cles: 1 },
  { txt: '500 pièces', pieces: 500 },
  { txt: '2 planches', planches: 2 },
  { txt: '1 coffre + 1 clé', coffres: 1, cles: 1 }
];

// Coffres mystère : tirage pondéré
export const COFFRES = [
  { poids: 46, pieces: [150, 600] },
  { poids: 16, planches: [1, 2] },
  { poids: 12, cles: [1, 1] },
  { poids: 10, elans: [1, 2] },
  { poids: 10, pieces: [1500, 2500], rare: true },
  { poids: 6, perso: true, rare: true }
];

// Mots de la chasse aux lettres (un par jour)
export const MOTS = ['VILLE', 'METRO', 'RAILS', 'TURBO', 'WAGON', 'QUAI', 'PLANCHE', 'TOITS', 'DRONE', 'SPRINT'];

// Tour de la ville : trois niveaux par quartier, de plus en plus longs et rapides.
// Étoiles : arriver au bout, ramasser assez de pièces, ne jamais trébucher.
export const NIVEAUX = QUARTIERS.flatMap((_, q) =>
  [0, 1, 2].map(i => ({ q, long: 700 + i * 350 + q * 150, depart: q * 500 + i * 250, pieces: 70 + 35 * i + 25 * q, graine: 7919 * (q * 3 + i + 1) }))
);

// Événements saisonniers (dates mois-jour ; la fin peut tomber l'année suivante)
export const EVENEMENTS = [
  {
    id: 'halloween', nom: 'Nuit des citrouilles', debut: '10-20', fin: '11-05', jeton: 'citrouille', jetons: 'citrouilles', emoji: '🎃', couleur: '#ff8c2e',
    paliers: [{ n: 10, txt: '500 pièces', pieces: 500 }, { n: 30, txt: 'Planche Citrouille', planche: 'citrouille' }, { n: 60, txt: 'Personnage Spectre', perso: 'spectre' }, { n: 100, txt: '2 coffres mystère', coffres: 2 }]
  },
  {
    id: 'hiver', nom: 'Fêtes d\'hiver', debut: '12-10', fin: '01-06', jeton: 'cadeau', jetons: 'cadeaux', emoji: '🎁', couleur: '#c1272d',
    paliers: [{ n: 10, txt: '500 pièces', pieces: 500 }, { n: 30, txt: 'Planche Flocon', planche: 'flocon' }, { n: 60, txt: 'Personnage Lutin', perso: 'lutin' }, { n: 100, txt: '2 coffres mystère', coffres: 2 }]
  },
  {
    id: 'ete', nom: 'Été en ville', debut: '07-01', fin: '08-15', jeton: 'glace', jetons: 'glaces', emoji: '🍦', couleur: '#00b4d8',
    paliers: [{ n: 10, txt: '500 pièces', pieces: 500 }, { n: 30, txt: 'Planche Soleil', planche: 'soleil' }, { n: 60, txt: 'Personnage Sol', perso: 'sol' }, { n: 100, txt: '2 coffres mystère', coffres: 2 }]
  }
];
