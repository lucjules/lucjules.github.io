/* Mine Clic : toutes les données du jeu (blocs, dimensions, machines, améliorations, progrès, dessins).
   Script classique (pas de module) : le jeu s'ouvre aussi en double-cliquant le fichier. */
(function () {
  'use strict';

  /* ---------- Blocs à miner ----------
     durete : nombre de coups pour casser le bloc ; son : bruit du coup de pioche */
  var BLOCS = {
    herbe: { nom: "Bloc d'herbe", durete: 5, son: 'terre' },
    terre: { nom: 'Terre', durete: 4, son: 'terre' },
    bois: { nom: 'Bûche de chêne', durete: 6, son: 'bois' },
    pierre: { nom: 'Pierre', durete: 8, son: 'pierre' },
    charbon: { nom: 'Minerai de charbon', durete: 9, son: 'pierre' },
    fer: { nom: 'Minerai de fer', durete: 10, son: 'pierre' },
    or: { nom: "Minerai d'or", durete: 11, son: 'pierre' },
    redstone: { nom: 'Minerai de redstone', durete: 11, son: 'pierre' },
    lapis: { nom: 'Minerai de lapis-lazuli', durete: 11, son: 'pierre' },
    diamant: { nom: 'Minerai de diamant', durete: 14, son: 'pierre' },
    emeraude: { nom: "Minerai d'émeraude", durete: 14, son: 'pierre' },
    obsidienne: { nom: 'Obsidienne', durete: 20, son: 'lourd' },
    netherrack: { nom: 'Netherrack', durete: 6, son: 'pierre' },
    quartz: { nom: 'Minerai de quartz', durete: 9, son: 'pierre' },
    glowstone: { nom: 'Pierre lumineuse', durete: 7, son: 'verre' },
    endstone: { nom: "Pierre de l'End", durete: 10, son: 'pierre' },
    sculk: { nom: 'Bloc de sculk', durete: 12, son: 'terre' }
  };

  /* ---------- Dimensions : changent le décor et les blocs ----------
     seuil : blocs minés au total (toutes vies) ; machine : en posséder une suffit */
  var DIMENSIONS = [
    { id: 'surface', nom: 'La surface', blocs: ['herbe', 'bois', 'terre'], fond: 'terre', ciel: ['#5b8fd8', '#9cc4f0'], seuil: 0 },
    { id: 'grottes', nom: 'Les grottes', blocs: ['pierre', 'charbon', 'fer'], fond: 'pierre', ciel: ['#2a2a2e', '#45454b'], seuil: 1000 },
    { id: 'profondeurs', nom: 'Les profondeurs', blocs: ['fer', 'or', 'redstone', 'lapis'], fond: 'ardoise', ciel: ['#17171d', '#30303a'], seuil: 1e5 },
    { id: 'coeur', nom: 'Le cœur de la mine', blocs: ['diamant', 'emeraude', 'obsidienne'], fond: 'obsidienne', ciel: ['#0d0a16', '#241a38'], seuil: 1e7 },
    { id: 'nether', nom: 'Le Nether', blocs: ['netherrack', 'quartz', 'glowstone'], fond: 'netherrack', ciel: ['#3a0d0d', '#6e1f12'], machine: 'nether' },
    { id: 'end', nom: "L'End", blocs: ['endstone', 'obsidienne'], fond: 'endstone', ciel: ['#0b0614', '#22123a'], machine: 'end' },
    { id: 'cite', nom: 'La cité antique', blocs: ['sculk', 'obsidienne', 'diamant'], fond: 'sculk', ciel: ['#03100f', '#0b2a2c'], machine: 'sculk' }
  ];

  /* ---------- Machines (bâtiments) : produisent des blocs toutes seules ---------- */
  var MACHINES = [
    { id: 'pioche', nom: 'Pioche en bois', pl: 'pioches en bois', prix: 15, cps: 0.1, premier: "ta première pioche en bois", desc: 'Une pioche enchantée qui mine toute seule, tranquillement.' },
    { id: 'mineur', nom: 'Mineur villageois', pl: 'mineurs villageois', prix: 100, cps: 1, premier: "ton premier mineur villageois", desc: 'Hmm ! Un villageois qui creuse pour toi contre quelques émeraudes.' },
    { id: 'golem', nom: 'Golem de fer', pl: 'golems de fer', prix: 1100, cps: 8, premier: "ton premier golem de fer", desc: 'Fort, patient et infatigable : il casse la roche à mains nues.' },
    { id: 'wagonnet', nom: 'Wagonnet', pl: 'wagonnets', prix: 12000, cps: 47, premier: "ton premier wagonnet", desc: 'Des rails dans toutes les galeries pour remonter les blocs sans effort.' },
    { id: 'tnt', nom: 'TNT', pl: 'blocs de TNT', prix: 130000, cps: 260, premier: "ta première TNT", desc: 'Boum ! Une galerie entière dégagée en une seconde.' },
    { id: 'foreuse', nom: 'Foreuse à pistons', pl: 'foreuses à pistons', prix: 1.4e6, cps: 1400, premier: "ta première foreuse à pistons", desc: 'Une machine de redstone qui avance toute seule dans la roche.' },
    { id: 'nether', nom: 'Portail du Nether', pl: 'portails du Nether', prix: 2e7, cps: 7800, premier: "ton premier portail du Nether", desc: 'Ouvre la route du Nether et de ses montagnes de netherrack.' },
    { id: 'enchant', nom: "Table d'enchantement", pl: "tables d'enchantement", prix: 3.3e8, cps: 44000, premier: "ta première table d'enchantement", desc: 'Des pioches enchantées par milliers, sorties tout droit des livres anciens.' },
    { id: 'balise', nom: 'Balise', pl: 'balises', prix: 5.1e9, cps: 260000, premier: "ta première balise", desc: 'Son rayon donne Célérité à tous les mineurs du monde.' },
    { id: 'end', nom: "Portail de l'End", pl: "portails de l'End", prix: 7.5e10, cps: 1.6e6, premier: "ton premier portail de l'End", desc: "Des îles flottantes entières à miner, de l'autre côté du vide." },
    { id: 'oeuf', nom: 'Œuf de dragon', pl: 'œufs de dragon', prix: 1e12, cps: 1e7, premier: "ton premier œuf de dragon", desc: 'Les dragons éclos creusent des cavernes grandes comme des montagnes.' },
    { id: 'sculk', nom: 'Cœur de sculk', pl: 'cœurs de sculk', prix: 1.4e13, cps: 6.5e7, premier: "ton premier cœur de sculk", desc: "La cité antique s'éveille et dévore la roche dans un silence total." },
    { id: 'wither', nom: 'Wither apprivoisé', pl: 'withers apprivoisés', prix: 2.1e14, cps: 4.3e8, premier: "ton premier wither apprivoisé", desc: 'Ses trois têtes crachent des crânes qui pulvérisent des montagnes entières.' },
    { id: 'monde', nom: 'Générateur de mondes', pl: 'générateurs de mondes', prix: 2.6e15, cps: 2.9e9, premier: "ton premier générateur de mondes", desc: 'Crée de nouveaux mondes remplis de minerai, prêts à être minés.' }
  ];

  /* ---------- Améliorations ----------
     effet : clic (×2 au clic), pct (+1 % de la production ajouté à chaque clic), machine (×2 pour une machine),
     global (+x % de production), fortune (×2 au bonus quand un bloc casse), chance (coffres plus fréquents),
     duree (effets des coffres plus longs) */
  var AMELIORATIONS = [];
  function amel(o) { AMELIORATIONS.push(o); }

  var PIOCHES = [
    ['pierre', 'Pioche en pierre', 100, 50],
    ['fer', 'Pioche en fer', 600, 400],
    ['or', 'Pioche en or', 12000, 6000],
    ['diamant', 'Pioche en diamant', 250000, 100000],
    ['netherite', 'Pioche en netherite', 2.5e7, 1e7]
  ];
  PIOCHES.forEach(function (p) {
    amel({ id: 'pioche-' + p[0], nom: p[1], prix: p[2], effet: 'clic', icone: { s: 'pioche', m: p[0] },
      desc: 'Chaque clic rapporte 2 fois plus.', cond: { total: p[3] } });
  });
  ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].forEach(function (r, i) {
    amel({ id: 'efficacite-' + (i + 1), nom: 'Efficacité ' + r, prix: 5e4 * Math.pow(100, i), effet: 'pct', icone: { s: 'livre' },
      desc: 'Chaque clic rapporte en plus 1 % de ta production par seconde.', cond: { clics: [100, 500, 1000, 2000, 4000, 7000, 10000][i], total: 2e4 * Math.pow(100, i) } });
  });
  ['I', 'II', 'III'].forEach(function (r, i) {
    amel({ id: 'fortune-' + (i + 1), nom: 'Fortune ' + r, prix: [1000, 2e5, 4e7][i], effet: 'fortune', icone: { s: 'gemme' },
      desc: 'Le bonus reçu quand un bloc casse est doublé.', cond: { casses: [5, 50, 250][i] } });
  });
  amel({ id: 'fortune-4', nom: 'Fortune IV', prix: 8e9, effet: 'fortune', icone: { s: 'gemme' }, desc: 'Le bonus reçu quand un bloc casse est doublé.', cond: { casses: 1000 } });
  amel({ id: 'combo-1', nom: 'Métronome', prix: 5e5, effet: 'combo', icone: { s: 'horloge' }, desc: 'Chaque niveau de combo ajoute 3 % au clic au lieu de 2 %.', cond: { comboMax: 20 } });
  amel({ id: 'combo-2', nom: 'Rythme du forgeron', prix: 5e8, effet: 'combo', icone: { s: 'horloge' }, desc: 'Chaque niveau de combo ajoute 4 % au clic.', cond: { comboMax: 40 } });
  amel({ id: 'brillance-1', nom: 'Loupe de mineur', prix: 2e6, effet: 'brillance', icone: { s: 'gemme', m: 'or' }, desc: 'Les blocs brillants donnent 20 fois le bonus au lieu de 10.', cond: { brillants: 3 } });
  amel({ id: 'brillance-2', nom: 'Toucher doré', prix: 2e10, effet: 'brillance', icone: { s: 'gemme', m: 'or' }, desc: 'Les blocs brillants donnent 40 fois le bonus.', cond: { brillants: 15 } });
  amel({ id: 'recharge-1', nom: 'Redstone accélérée', prix: 1e7, effet: 'recharge', icone: { s: 'foreuse' }, desc: 'Les capacités se rechargent 25 % plus vite.', cond: { capacites: 5 } });
  amel({ id: 'chance-1', nom: 'Chance de la mer I', prix: 7777, effet: 'chance', icone: { s: 'coffre' }, desc: 'Les coffres et les creepers apparaissent plus souvent.', cond: { coffres: 3 } });
  amel({ id: 'chance-2', nom: 'Chance de la mer II', prix: 7.77e6, effet: 'chance', icone: { s: 'coffre' }, desc: 'Les coffres et les creepers apparaissent encore plus souvent.', cond: { coffres: 10 } });
  amel({ id: 'duree-1', nom: 'Potion de longue durée', prix: 7.77e8, effet: 'duree', icone: { s: 'potion', m: 'violet' }, desc: 'Les effets des coffres durent 2 fois plus longtemps, et les coffres restent plus longtemps.', cond: { coffres: 25 } });

  // nourriture et potions : bonus pour toute la production
  [
    ['pain', 'Pain', 5e4, 2, { s: 'pain' }],
    ['tarte', 'Tarte à la citrouille', 5e5, 3, { s: 'tarte' }],
    ['gateau', 'Gâteau', 5e6, 4, { s: 'gateau' }],
    ['ragout', 'Ragoût de champignons', 5e7, 5, { s: 'ragout' }],
    ['carotte', 'Carotte dorée', 5e8, 5, { s: 'carotte' }],
    ['pomme', 'Pomme dorée', 5e9, 10, { s: 'pomme', m: 'or' }],
    ['force', 'Potion de force', 5e10, 10, { s: 'potion', m: 'rouge' }],
    ['celerite', 'Potion de célérité', 5e11, 15, { s: 'potion', m: 'bleu' }],
    ['enchantee', 'Pomme dorée enchantée', 5e12, 20, { s: 'pomme', m: 'enchantee' }],
    ['chorus', 'Fruit de chorus', 5e13, 20, { s: 'chorus' }],
    ['souffle', 'Souffle du dragon', 5e14, 25, { s: 'potion', m: 'rose' }],
    ['steak', 'Steak grillé', 5e15, 25, { s: 'steak' }],
    ['citrouille', 'Tarte de la fête', 5e16, 30, { s: 'citrouille' }],
    ['regeneration', 'Potion de régénération', 5e17, 30, { s: 'potion', m: 'rose' }]
  ].forEach(function (f) {
    amel({ id: 'mange-' + f[0], nom: f[1], prix: f[2], effet: 'global', val: f[3], icone: f[4],
      desc: 'Toute la production augmente de ' + f[3] + ' %.', cond: { total: f[2] / 5 } });
  });

  // 8 paliers par machine : la machine produit 2 fois plus
  var PALIERS = [
    { n: 1, x: 10, nom: 'Outils affûtés' },
    { n: 5, x: 50, nom: 'Bonne nourriture' },
    { n: 25, x: 500, nom: 'Enchantement Efficacité' },
    { n: 50, x: 5e4, nom: 'Potion de célérité' },
    { n: 100, x: 5e6, nom: 'Balise de hâte' },
    { n: 150, x: 5e8, nom: 'Renfort de netherite' },
    { n: 200, x: 5e10, nom: "Bénédiction de l'End" },
    { n: 250, x: 5e12, nom: 'Écho des profondeurs' }
  ];
  MACHINES.forEach(function (m) {
    PALIERS.forEach(function (p, i) {
      amel({ id: m.id + '-' + (i + 1), nom: p.nom + ' · ' + m.nom, prix: m.prix * p.x, effet: 'machine', machine: m.id, palier: i,
        icone: { s: m.id, palier: i }, desc: 'Les ' + m.pl + ' produisent 2 fois plus.', cond: { machine: m.id, n: p.n } });
    });
  });

  /* ---------- Progrès (succès) : chacun ajoute 1 % de production ---------- */
  var PROGRES = [];
  function prog(id, nom, desc, icone, test) { PROGRES.push({ id: id, nom: nom, desc: desc, icone: icone, test: test }); }
  [
    [1, 'Premier coup de pioche'], [1000, 'Un bel établi'], [1e5, "L'âge de pierre"], [1e6, 'Ça brille, là-dedans !'],
    [1e8, 'Toujours plus profond'], [1e10, 'Fièvre du diamant'], [1e12, 'Le cœur du monde'], [1e14, 'Au-delà de la roche-mère'],
    [1e16, 'Mineur de légende'], [1e18, 'Le monde entier y est passé'], [1e21, 'Plus rien à miner ?']
  ].forEach(function (t, i) {
    prog('total-' + i, t[1], 'Miner ' + (t[0] == 1 ? 'ton premier bloc' : '{' + t[0] + '} blocs au total') + '.', { s: 'pioche', m: ['bois', 'pierre', 'fer', 'or', 'diamant', 'netherite'][Math.min(5, Math.floor(i / 2))] },
      function (S) { return S.totalAll >= t[0]; });
  });
  [[1, 'Ça tourne tout seul'], [100, 'Petite entreprise'], [1e4, 'Chantier à plein régime'], [1e6, 'Usine à blocs'], [1e8, 'Machine de redstone géante'], [1e10, "L'industrie de l'End"]]
    .forEach(function (t, i) {
      prog('cps-' + i, t[1], 'Produire {' + t[0] + '} bloc' + (t[0] > 1 ? 's' : '') + ' par seconde.', { s: 'foreuse' }, function (S, J) { return J.cpsBase >= t[0]; });
    });
  [[100, 'Doigts agiles'], [1000, 'Tendinite du mineur'], [10000, 'Clic-clac infini']].forEach(function (t, i) {
    prog('clics-' + i, t[1], 'Cliquer {' + t[0] + '} fois sur le bloc.', { s: 'pioche', m: 'fer' }, function (S) { return S.clics >= t[0]; });
  });
  [[10, 'Casseur de blocs'], [100, 'Démolisseur'], [1000, 'Rien ne me résiste']].forEach(function (t, i) {
    prog('casses-' + i, t[1], 'Casser {' + t[0] + '} blocs à la pioche.', { s: 'gemme' }, function (S) { return S.casses >= t[0]; });
  });
  var NOMS_MACHINES = {
    pioche: ['Ça pique !', 'Forêt de pioches', 'Armurerie complète'],
    mineur: ['Hmm ?', 'Village de mineurs', 'La guilde des mineurs'],
    golem: ['Gardien de fer', 'Armée de fer', 'Mur de métal'],
    wagonnet: ['En voiture !', 'Réseau ferré', 'Grand huit souterrain'],
    tnt: ['Ça va faire boum', "Feu d'artifice", 'Cratère géant'],
    foreuse: ['Ingénieur en herbe', 'Usine à pistons', 'Génie de la redstone'],
    nether: ['Il fait chaud, ici', 'Autoroute du Nether', 'Seigneur des flammes'],
    enchant: ['Savoir ancestral', 'Grimoire épais', 'Archimage'],
    balise: ['Rayon de lumière', 'Phare du monde', "Pyramide d'émeraude"],
    end: ['La fin du voyage ?', "Voyageur de l'End", "Maître de l'Ender"],
    oeuf: ["L'œuf ou le dragon ?", 'Nid de dragons', 'Couveuse légendaire'],
    sculk: ['Chut…', 'Écho des profondeurs', 'La cité se réveille'],
    wither: ["Trois têtes valent mieux qu'une", 'Armée de withers', 'Fin du monde'],
    monde: ['Créateur', 'Multivers', "Architecte de l'infini"]
  };
  MACHINES.forEach(function (m) {
    [1, 50, 100].forEach(function (n, i) {
      prog(m.id + '-n' + n, NOMS_MACHINES[m.id][i], n == 1 ? 'Obtenir ' + m.premier + '.' : 'Posséder ' + n + ' ' + m.pl + '.',
        { s: m.id }, function (S) { return (S.machines[m.id] || 0) >= n; });
    });
  });
  [[1, 'Coffre au trésor'], [10, 'Chasseur de trésors'], [50, 'Pirate des grottes']].forEach(function (t, i) {
    prog('coffres-' + i, t[1], t[0] == 1 ? 'Ouvrir un coffre au trésor.' : 'Ouvrir {' + t[0] + '} coffres au trésor.', { s: 'coffre' }, function (S) { return S.coffres >= t[0]; });
  });
  prog('creeper-1', 'Pas de panique', 'Désamorcer un creeper avant qu\'il explose.', { s: 'creeper' }, function (S) { return S.creepers >= 1; });
  prog('creeper-10', 'Démineur', 'Désamorcer 10 creepers.', { s: 'creeper' }, function (S) { return S.creepers >= 10; });
  prog('boum', 'Ssssss… BOUM', 'Laisser un creeper exploser (rien n\'est perdu, promis).', { s: 'tnt' }, function (S) { return S.boums >= 1; });
  prog('amel-10', 'Bien équipé', 'Acheter 10 améliorations.', { s: 'livre' }, function (S) { return S.amels.length >= 10; });
  prog('amel-50', 'Tout le confort', 'Acheter 50 améliorations.', { s: 'livre' }, function (S) { return S.amels.length >= 50; });
  prog('tour', 'Le tour du monde', 'Visiter toutes les dimensions.', { s: 'end' }, function (S) { return S.vues.length >= DIMENSIONS.length; });
  prog('renaitre-1', 'Une nouvelle vie', 'Renaître une première fois.', { s: 'etoile' }, function (S) { return S.renaissances >= 1; });
  prog('renaitre-5', 'Encore et encore', 'Renaître 5 fois.', { s: 'etoile' }, function (S) { return S.renaissances >= 5; });
  prog('amel-100', 'Collectionneur', 'Acheter 100 améliorations.', { s: 'livre' }, function (S) { return S.amels.length >= 100; });
  prog('brillant-1', 'Ça brille !', 'Casser un bloc brillant.', { s: 'gemme', m: 'or' }, function (S) { return S.brillants >= 1; });
  prog('brillant-25', "Chercheur d'or", 'Casser 25 blocs brillants.', { s: 'gemme', m: 'or' }, function (S) { return S.brillants >= 25; });
  prog('combo-25', 'En rythme', 'Atteindre un combo de 25.', { s: 'horloge' }, function (S) { return S.comboMax >= 25; });
  prog('combo-50', 'Poignet en feu', 'Atteindre un combo de 50.', { s: 'horloge' }, function (S) { return S.comboMax >= 50; });
  prog('missions-1', 'Au travail !', 'Terminer une mission.', { s: 'parchemin' }, function (S) { return S.missionsFaites >= 1; });
  prog('missions-10', 'Mineur de confiance', 'Terminer 10 missions.', { s: 'parchemin' }, function (S) { return S.missionsFaites >= 10; });
  prog('missions-50', 'Héros du village', 'Terminer 50 missions.', { s: 'parchemin' }, function (S) { return S.missionsFaites >= 50; });
  prog('capacite-1', 'Pouvoir activé', 'Utiliser une capacité.', { s: 'tnt' }, function (S) { return S.capacites >= 1; });
  prog('capacite-25', 'Expert en capacités', 'Utiliser 25 capacités.', { s: 'cloche' }, function (S) { return S.capacites >= 25; });
  prog('max', 'Je prends tout !', 'Acheter 100 machines du même coup.', { s: 'wagonnet' }, function (S) { return S.maxAchat >= 100; });
  prog('temps-1', 'Une heure sous terre', 'Jouer pendant une heure.', { s: 'horloge' }, function (S) { return S.tempsJeu >= 3600; });
  prog('temps-10', 'Vraie taupe', 'Jouer pendant 10 heures.', { s: 'horloge' }, function (S) { return S.tempsJeu >= 36000; });
  prog('pouvoir-1', 'Savoir céleste', 'Acheter un pouvoir dans la boutique céleste.', { s: 'etoile', m: 'fragment' }, function (S) { return S.pouvoirs.length >= 1; });
  prog('pouvoir-tous', 'Être céleste', 'Acheter tous les pouvoirs de la boutique céleste.', { s: 'etoile', m: 'fragment' }, function (S) { return S.pouvoirs.length >= POUVOIRS.length; });
  prog('etoiles-10', 'Constellation naissante', 'Posséder 10 étoiles du Nether.', { s: 'etoile' }, function (S) { return S.etoiles >= 10; });
  prog('etoiles-100', 'Une galaxie entière', 'Posséder 100 étoiles du Nether.', { s: 'etoile' }, function (S) { return S.etoiles >= 100; });
  prog('halloween', 'Joyeux Halloween !', "Ouvrir une citrouille pendant l'événement d'Halloween.", { s: 'citrouille' }, function (S) { return S.citrouilles >= 1; });
  prog('noel', 'Joyeux Noël !', "Ouvrir un cadeau pendant l'événement de Noël.", { s: 'cadeau' }, function (S) { return S.cadeaux >= 1; });

  /* ---------- Boutique céleste : pouvoirs permanents, payés en fragments d'étoile ---------- */
  var POUVOIRS = [
    { id: 'depart', nom: 'Sac de départ', prix: 1, icone: { s: 'coffre' }, desc: 'Chaque nouvelle vie commence avec 10 pioches en bois et 5 mineurs villageois.' },
    { id: 'gant', nom: 'Gant de golem', prix: 2, icone: { s: 'golem' }, desc: 'Tes clics rapportent 2 fois plus, pour toujours.' },
    { id: 'soie', nom: 'Toucher de soie', prix: 3, icone: { s: 'gemme' }, desc: 'Le bonus quand un bloc casse est multiplié par 3.' },
    { id: 'absence', nom: 'Mémoire du mineur', prix: 5, icone: { s: 'horloge' }, desc: "Pendant ton absence, les machines travaillent à pleine vitesse, jusqu'à 48 h (au lieu de la moitié, 24 h)." },
    { id: 'trefle', nom: "Chance de l'End", prix: 5, icone: { s: 'coffre' }, desc: 'Les coffres au trésor apparaissent 25 % plus souvent.' },
    { id: 'creeper', nom: 'Ami des creepers', prix: 8, icone: { s: 'creeper' }, desc: 'Les creepers mettent 2 secondes de plus à exploser, et désamorcés ils donnent 2 fois plus.' },
    { id: 'sablier', nom: 'Sablier ancien', prix: 10, icone: { s: 'sablier' }, desc: 'Les effets des coffres et des capacités durent 50 % plus longtemps.' },
    { id: 'recharge', nom: 'Horloge de redstone', prix: 12, icone: { s: 'horloge' }, desc: 'Les capacités se rechargent 2 fois plus vite.' },
    { id: 'marchand', nom: 'Marchand villageois', prix: 15, icone: { s: 'mineur' }, desc: 'Les machines coûtent 10 % moins cher.' },
    { id: 'fantome', nom: 'Pioche fantôme', prix: 20, icone: { s: 'pioche', m: 'diamant' }, desc: 'Une pioche invisible frappe le bloc 2 fois par seconde, même quand tu ne cliques pas.' },
    { id: 'bibliothecaire', nom: 'Bibliothécaire', prix: 25, icone: { s: 'livre' }, desc: 'Les améliorations coûtent 10 % moins cher.' },
    { id: 'oeil', nom: "Œil de l'Ender", prix: 30, icone: { s: 'end' }, desc: 'Les blocs brillants apparaissent 2 fois plus souvent.' },
    { id: 'guilde', nom: 'Contrat de guilde', prix: 40, icone: { s: 'parchemin' }, desc: 'Les missions rapportent 2 fois plus, et une quatrième mission s\'ajoute.' },
    { id: 'grand-marchand', nom: 'Grand marchand', prix: 60, icone: { s: 'mineur' }, desc: 'Les machines coûtent encore 10 % moins cher.' },
    { id: 'constellation', nom: 'Constellation', prix: 100, icone: { s: 'etoile', m: 'fragment' }, desc: 'Chaque étoile du Nether ajoute 3 % de production au lieu de 2 %.' },
    { id: 'dragon', nom: 'Souffle du dragon', prix: 200, icone: { s: 'oeuf' }, desc: 'La frénésie multiplie la production par 10 au lieu de 7.' }
  ];

  /* ---------- Capacités : boutons à recharge sous le bloc ---------- */
  var CAPACITES = [
    { id: 'tnt', nom: 'Explosion de TNT', icone: { s: 'tnt' }, recharge: 180, cond: { machine: 'tnt', n: 1 }, aide: 'Avoir 1 TNT', desc: 'Le bloc explose tout de suite avec un bonus ×5, et tu gagnes une minute de production.' },
    { id: 'hate', nom: 'Potion de hâte', icone: { s: 'potion', m: 'bleu' }, recharge: 240, duree: 15, cond: { clics: 300 }, aide: 'Cliquer 300 fois', desc: 'Pendant 15 secondes, chaque clic rapporte 10 fois plus.' },
    { id: 'cloche', nom: 'Cloche du village', icone: { s: 'cloche' }, recharge: 420, duree: 30, cond: { machine: 'mineur', n: 10 }, aide: 'Avoir 10 mineurs villageois', desc: 'Pendant 30 secondes, toutes les machines produisent 3 fois plus.' },
    { id: 'balise', nom: 'Balise de chance', icone: { s: 'balise' }, recharge: 600, cond: { machine: 'balise', n: 1 }, aide: 'Avoir 1 balise', desc: 'Fait apparaître tout de suite un coffre au trésor.' }
  ];

  /* ---------- Missions : trois à la fois, renouvelées dès qu'elles sont finies ---------- */
  var MISSIONS = [
    { id: 'clics', txt: 'Cliquer {n} fois sur le bloc', buts: [100, 200, 300, 500] },
    { id: 'casses', txt: 'Casser {n} blocs', buts: [10, 20, 40, 60] },
    { id: 'miner', txt: 'Miner {n} blocs', buts: null },
    { id: 'achats', txt: 'Acheter {n} machines', buts: [5, 10, 25, 50] },
    { id: 'amels', txt: 'Acheter {n} améliorations', buts: [1, 2, 3] },
    { id: 'coffres', txt: 'Ouvrir {n} coffre(s) au trésor', buts: [1, 2, 3] },
    { id: 'brillants', txt: 'Casser {n} bloc(s) brillant(s)', buts: [1, 2] },
    { id: 'combo', txt: 'Atteindre un combo de {n}', buts: [15, 25, 35, 50] },
    { id: 'capacites', txt: 'Utiliser {n} capacité(s)', buts: [1, 2, 3] }
  ];

  /* ---------- Dessins en pixels (12 × 12) ----------
     Une lettre = une couleur de la palette ; « . » = transparent.
     Les lettres x et X (tête de pioche) et q et Q (liquide) changent selon le matériau. */
  var PALETTE = {
    k: '#1d1d1d', K: '#3a3a3a', g: '#8f8f8f', G: '#c8c8c8', W: '#ffffff', s: '#6e6e6e',
    w: '#b8874a', b: '#8b5a2b', d: '#5e3b1c', r: '#c62828', R: '#ff7a6b', m: '#d9822b', M: '#f0b45a',
    o: '#1f1430', O: '#4b2b75', p: '#8a2be2', P: '#d18cff', c: '#3fd8e0', C: '#c4fcff',
    u: '#3b6fd8', U: '#8fb6ff', y: '#dcdca0', Y: '#f5d042', e: '#3fbf4a', E: '#1d7a2c', f: '#d9a074', n: '#a8704a', h: '#4a2e1a',
    t: '#0b3a3e', T: '#1f8a8f', l: 'rgba(205,240,255,.45)', x: '#9c6b30', X: '#c79a5a', q: '#c62828', Q: '#ff8a80', v: '#6b3fa0', V: '#b98ae6'
  };
  var MATIERES = {
    bois: { x: '#9c6b30', X: '#c79a5a' }, pierre: { x: '#7a7a7a', X: '#adadad' }, fer: { x: '#c9c9c9', X: '#f4f4f4' },
    or: { x: '#e8b923', X: '#fff27a' }, diamant: { x: '#2fd3c6', X: '#b0fff7' }, netherite: { x: '#3d3438', X: '#776a6f' },
    rouge: { q: '#c62828', Q: '#ff8a80' }, bleu: { q: '#4f7cff', Q: '#b3c8ff' }, violet: { q: '#8a2be2', Q: '#d6a8ff' }, rose: { q: '#e055c0', Q: '#ffb3ec' },
    enchantee: { r: '#f5d042', R: '#fff6b0' }, fragment: { W: '#e2b8ff', G: '#9b4de0' }
  };
  MATIERES.or.r = '#f5c518'; MATIERES.or.R = '#fff6b0'; MATIERES.or.c = '#f5c518'; MATIERES.or.C = '#fff6b0';
  var SPRITES = {
    pioche: ['..XXXXXXXX..', '.Xxxxxxxxxx.', '.x.......bxX', '.......db.xX', '......db..xX', '.....db...xX', '....db....xX', '...db.....xX', '..db......xX', '.db.......xX', 'db.......xX.', 'b...........'],
    mineur: ['..hhhhhhhh..', '..hhhhhhhh..', '..ffffffff..', '..ffffffff..', '..fEEffEEf..', '..ffffffff..', '..fffnnfff..', '..ffnnnnff..', '..fffnnfff..', '.bbbbnnbbbb.', 'bbbbbbbbbbbb', 'bbbbbbbbbbbb'],
    golem: ['..gggggggg..', '.gGGGGGGGGg.', '.gkkggggkkg.', '.gkrggggrkg.', '.ggggssgggg.', '.ggggssgggg.', '.ggggssgggg.', '.gggessegg..', '.ggegggggeg.', '..gggggggg..', '.gGgggggggG.', 'gggg....gggg'],
    wagonnet: ['............', '...Ym..mY...', '..mYYmmYYm..', 'gggggggggggg', 'gkkkkkkkkkkg', 'gkGGGGGGGGkg', 'gkGGGGGGGGkg', 'gkkkkkkkkkkg', '.gggggggggg.', '..kk....kk..', '.kKKk..kKKk.', '..kk....kk..'],
    tnt: ['rrrrrrrrrrrr', 'rRrrRrrRrrRr', 'rRrrRrrRrrRr', 'WWWWWWWWWWWW', 'WkkkWkkWWkkk', 'WWkWWkWkWWkW', 'WWkWWkWkWWkW', 'WWWWWWWWWWWW', 'rRrrRrrRrrRr', 'rRrrRrrRrrRr', 'rrrrrrrrrrrr', 'rrrrrrrrrrrr'],
    foreuse: ['wwwwwwwwwwww', 'wXXwwwXXwwwX', 'wwwwwwwwwwww', 'kkkkkkkkkkkk', 'gggggkkggggg', 'gGgggkkggGgg', 'gggggkkggggg', 'ggGggkkgggGg', 'gggggggggggg', 'ggggggggggGg', '.r.r..rr..r.', 'rrrrrrrrrrrr'],
    nether: ['oooooooooooo', 'oOooooooooOo', 'oopPppPpppoo', 'oppPpppPpPoo', 'opppPppppPoo', 'oPpppPpPpppo', 'opPpppppPppo', 'oppPpPpppPpo', 'opppppPpppPo', 'oPppPpppPppo', 'oOooooooooOo', 'oooooooooooo'],
    enchant: ['...dddddd...', '..dWWWWWWd..', '...dddddd...', '............', 'rrrrrrrrrrrr', 'rcrrrrrrrrcr', 'oooooooooooo', 'oOooooooooOo', 'oooooooooooo', 'oooOooooOooo', 'oooooooooooo', 'oOooooooooOo'],
    balise: ['.....CC.....', '.....CC.....', '.....CC.....', 'GGGGGGGGGGGG', 'GllllllllllG', 'GlllcccclllG', 'GlllcCCclllG', 'GlllcccclllG', 'GllllllllllG', 'GGGGGGGGGGGG', 'oooooooooooo', 'oOooooooooOo'],
    end: ['yyyyyyyyyyyy', 'yeyEyyyyEyey', 'yykkkkkkkkyy', 'yEkkCkkkkkEy', 'yykkkkkTkkyy', 'yykkTkkkkkyy', 'yykkkkkkCkyy', 'yEkkkCkkkkEy', 'yykkkkkkkkyy', 'yykkkkkkkkyy', 'yeyEyyyyEyey', 'yyyyyyyyyyyy'],
    oeuf: ['....kkkk....', '...kkkkkk...', '..kkPkkkkk..', '..kkkkkpkk..', '.kkpkkkkkkk.', '.kPkkkpkkkk.', '.kkkkkkkkpk.', '.kpkkkkkkkk.', '.kkkkpkkkkk.', '..kkkkkkpk..', '...kkkkkk...', '....kkkk....'],
    sculk: ['tttttttttttt', 'tTttCttttTtt', 'ttttttTttttt', 'tCttTtttttCt', 'ttttttttTttt', 'ttTttCtttttt', 'ttttttttttTt', 'tCtttTttCttt', 'ttttttttttTt', 'ttTtCttttttt', 'tttttttTtCtt', 'tTtttttttttt'],
    livre: ['............', '..pppppppp..', '.pPPPPPPPPp.', '.pPppppppPp.', '.pPpYYYYpPp.', '.pPpYppYpPp.', '.pPpYYYYpPp.', '.pPppppppPp.', '.pPPPPPPPPp.', '.pWWWWWWWWW.', '..pppppppp..', '............'],
    gemme: ['............', '............', '...cccccc...', '..cCCccCCc..', '.cCCccccCCc.', 'cccccccccccc', '.cccccccccc.', '..cccccccc..', '...cccccc...', '....cccc....', '.....cc.....', '............'],
    coffre: ['............', '.kkkkkkkkkk.', '.kbbbbbbbbk.', '.kwwwwwwwwk.', '.kwwwwwwwwk.', '.kkkkGGkkkk.', '.kbbbGGbbbk.', '.kwwwkkwwwk.', '.kwwwwwwwwk.', '.kwwwwwwwwk.', '.kkkkkkkkkk.', '............'],
    potion: ['....dddd....', '....dwwd....', '.....GG.....', '.....GG.....', '....GqqG....', '...GqqqqG...', '..GqQqqqqG..', '..GQqqqqqG..', '..GqqqqqqG..', '..GqqqqqqG..', '...GqqqqG...', '....GGGG....'],
    pomme: ['......d.....', '.....d.ee...', '..rrrrdrr...', '.rRRrrrrrr..', 'rRRrrrrrrrr.', 'rRrrrrrrrrr.', 'rrrrrrrrrrr.', 'rrrrrrrrrrr.', '.rrrrrrrrr..', '.rrrrrrrrr..', '..rrr.rrr...', '............'],
    pain: ['............', '............', '............', '...mmmmmm...', '.mmMmMmMmm..', 'mmmmmmmmmmm.', 'mMmmMmmMmmm.', 'mmmmmmmmmmm.', '.mmmmmmmmm..', '............', '............', '............'],
    tarte: ['............', '............', '...mmmmmm...', '.mmMMMMMMmm.', 'mMmmmmmmmmMm', 'mmMmmmmmmMmm', 'mmmmmmmmmmmm', 'MmMmMmMmMmMm', '.MMMMMMMMMM.', '............', '............', '............'],
    gateau: ['............', '...r..r..r..', '.WWWWWWWWWW.', 'WWWrWWWWrWWW', 'WWWWWWrWWWWW', 'GWWWWWWWWWWG', 'wwwwwwwwwwww', 'wXwwwwwXwwww', 'bbbbbbbbbbbb', 'wwwwwXwwwwww', 'wwwwwwwwwwXw', '............'],
    ragout: ['............', '............', '..r.....r...', '.rWr...rWr..', '.rrr.r.rrr..', '..f..rr.f...', 'bbbbbbbbbbbb', 'bnnnfnnnfnnb', '.bnnnnnnnnb.', '..bbbbbbbb..', '...dddddd...', '............'],
    carotte: ['.......eYe..', '........eY..', '.......YYe..', '......YYY...', '.....YWY....', '....YYY.....', '...YYW......', '..YYY.......', '..YY........', '.YY.........', '.Y..........', '............'],
    chorus: ['............', '...vvvv.....', '..vVVvvv....', '.vVvvvvvv...', '.vvvvVvvvv..', '.vvVvvvvVv..', '.vvvvvvvvv..', '..vvvVvvv...', '...vvvvv....', '............', '............', '............'],
    creeper: ['eEeeeeeeeEee', 'eeeeEeeeeeee', 'eekkkeekkkee', 'eekkkeekkkeE', 'eekkkeekkkee', 'eeeeekkeeeee', 'eEeeekkeeeee', 'eeeekkkkeeEe', 'eeeekkkkeeee', 'eeeekeekeeee', 'eEeeeeeeeeee', 'eeeeeeeEeeee'],
    wither: ['KKK......KKK', 'WKW.KKKK.WKW', 'KKK.KKKK.KKK', '...KWKKWK...', '...KKKKKK...', '...KkKKkK...', '....KKKK....', 'KKKKKKKKKKKK', '....KgK.....', '..KKKKKKK...', '....KgK.....', '....KKK.....'],
    monde: ['....uuuu....', '..uueeuuuu..', '.uueeeeuuUu.', '.ueeeeuuuuu.', 'uueeeuuuueeu', 'uuueeuuueeeu', 'uuuuuuueeeeu', 'uUuuuuuueeuu', '.uuueeuuuuu.', '.uueeeeuuuu.', '..uuueuuuu..', '....uuuu....'],
    citrouille: ['.....dd.....', '....dd......', '.mmmmmmmmmm.', 'mmMmmMMmmMmm', 'mYYMmmmmYYMm', 'mYYmmMmmYYmm', 'mmmmmYYmmmMm', 'mMYmmmmmmYmm', 'mmYYYYYYYYmm', 'mmmYYmYYYmMm', '.mmmmmmmmmm.', '............'],
    cadeau: ['...rr..rr...', '....rrrr....', 'eeeeerreeeee', 'eEeeerreeEee', 'rrrrrrrrrrrr', 'eeeeerreeeee', 'eEeeerreeeEe', 'eeeeerreeeee', 'eeEeerreeeee', 'eeeeerreeEee', 'eeeeerreeeee', '............'],
    cloche: ['.....dd.....', '....YYYY....', '...YWYYYY...', '...YWYYYY...', '..YWYYYYYY..', '..YWYYYYYY..', '..YYYYYYYY..', '.YYYYYYYYYY.', 'mmmmmmmmmmmm', '.....dd.....', '............', '............'],
    sablier: ['dddddddddddd', '.GllllllllG.', '..GYYYYYYG..', '...GYYYYG...', '....GYYG....', '.....GG.....', '.....GG.....', '....GlYG....', '...GllYlG...', '..GlYYYYlG..', '.GYYYYYYYYG.', 'dddddddddddd'],
    horloge: ['...YYYYYY...', '..YddddddY..', '.YdyyyyyydY.', 'YdyyykyyyydY', 'YdyyykyyyydY', 'YdyyykkkyydY', 'YdyyyyyyyydY', 'YdyyyyyyyydY', '.YdyyyyyydY.', '..YddddddY..', '...YYYYYY...', '............'],
    parchemin: ['.bbbbbbbbbb.', 'bwwwwwwwwwwb', '.yyyyyyyyyy.', '.ykkkkkyyyy.', '.yyyyyyyyyy.', '.ykkkkkkkky.', '.yyyyyyyyyy.', '.ykkkkyyyyy.', '.yyyyyyyyyy.', '.yyyyyyyrry.', 'bwwwwwwwwwwb', '.bbbbbbbbbb.'],
    steak: ['............', '...rrrrr....', '..rRrrrrrr..', '.rrrRRrrrrr.', '.rrrrrrRrrr.', 'rrWWrrrrrrr.', 'rWWrrrRrrrr.', 'rrrrrrrrrrr.', '.rrrrrrrrr..', '..rrrrrr....', '............', '............'],
    etoile: ['.....WW.....', '.....WW.....', '....WWWW....', 'WWWWWGGWWWWW', '.WWWGGGGWWW.', '..WWGGGGWW..', '...WWGGWW...', '..WWW..WWW..', '.WWW....WWW.', 'WW........WW', '............', '............']
  };
  // couleur du cadre des améliorations de machine, palier par palier
  var COULEURS_PALIERS = ['#b87333', '#c0c0c0', '#f5c518', '#3fd8e0', '#b469ff', '#ff5252', '#4caf50', '#222222'];

  /* ---------- Effets des coffres au trésor ---------- */
  var EFFETS = [
    { id: 'fortune', nom: 'Trésor !', poids: 45 },
    { id: 'frenesie', nom: 'Frénésie', poids: 35, duree: 77, desc: 'Production ×7' },
    { id: 'ruee', nom: 'Ruée vers le diamant', poids: 12, duree: 13, desc: 'Clics ×777' },
    { id: 'eclair', nom: 'Minage éclair', poids: 8, duree: 20, desc: 'Chaque clic casse le bloc' },
    { id: 'pluie', nom: 'Pluie de blocs brillants', poids: 5, duree: 30, desc: 'Tous les blocs sont brillants' }
  ];

  window.MC_DONNEES = {
    BLOCS: BLOCS, DIMENSIONS: DIMENSIONS, MACHINES: MACHINES, AMELIORATIONS: AMELIORATIONS, PROGRES: PROGRES,
    PALETTE: PALETTE, MATIERES: MATIERES, SPRITES: SPRITES, COULEURS_PALIERS: COULEURS_PALIERS, EFFETS: EFFETS, PALIERS: PALIERS,
    POUVOIRS: POUVOIRS, CAPACITES: CAPACITES, MISSIONS: MISSIONS
  };
})();
