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
    sculk: { nom: 'Bloc de sculk', durete: 12, son: 'terre' },
    bedrock: { nom: 'Bedrock', durete: 26, son: 'lourd' },
    debris: { nom: 'Débris antique', durete: 22, son: 'lourd' },
    amethyste: { nom: "Amas d'améthyste", durete: 18, son: 'verre' },
    meteorite: { nom: 'Météorite', durete: 28, son: 'lourd' },
    solaire: { nom: 'Bloc de soleil', durete: 20, son: 'verre' },
    vide: { nom: 'Pierre du vide', durete: 32, son: 'lourd' }
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
    { id: 'cite', nom: 'La cité antique', blocs: ['sculk', 'obsidienne', 'diamant'], fond: 'sculk', ciel: ['#03100f', '#0b2a2c'], machine: 'sculk' },
    { id: 'bedrock', nom: 'La roche-mère', blocs: ['bedrock', 'debris', 'amethyste'], fond: 'bedrock', ciel: ['#0a0a0c', '#1c1c22'], machine: 'bedrock' },
    { id: 'cosmos', nom: 'Le cosmos', blocs: ['meteorite', 'solaire', 'amethyste'], fond: 'meteorite', ciel: ['#05060f', '#141a3a'], machine: 'soleil' },
    { id: 'infini', nom: "L'infini", blocs: ['vide', 'solaire', 'diamant'], fond: 'vide', ciel: ['#000000', '#120828'], machine: 'boucle' }
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
    { id: 'monde', nom: 'Générateur de mondes', pl: 'générateurs de mondes', prix: 2.6e15, cps: 2.9e9, premier: "ton premier générateur de mondes", desc: 'Crée de nouveaux mondes remplis de minerai, prêts à être minés.' },
    { id: 'commande', nom: 'Bloc de commande', pl: 'blocs de commande', prix: 3.6e16, cps: 1e10, premier: "ton premier bloc de commande", desc: 'Une seule commande /fill et des montagnes entières disparaissent.' },
    { id: 'bedrock', nom: 'Briseur de bedrock', pl: 'briseurs de bedrock', prix: 5.1e17, cps: 3.5e10, premier: "ton premier briseur de bedrock", desc: 'Même la roche-mère finit par céder.' },
    { id: 'ordi', nom: 'Super-ordinateur', pl: 'super-ordinateurs', prix: 7.1e18, cps: 1.2e11, premier: "ton premier super-ordinateur", desc: 'Des milliards de calculs par tick pour trouver le meilleur filon.' },
    { id: 'soleil', nom: 'Soleil cubique', pl: 'soleils cubiques', prix: 1e20, cps: 4.3e11, premier: "ton premier soleil cubique", desc: 'Un astre carré qui fait fondre la roche à des années-lumière.' },
    { id: 'univers', nom: "Forge d'univers", pl: "forges d'univers", prix: 1.4e21, cps: 1.5e12, premier: "ta première forge d'univers", desc: 'On y forge des univers entiers, déjà remplis de minerai.' },
    { id: 'singularite', nom: 'Singularité', pl: 'singularités', prix: 2e22, cps: 5.3e12, premier: "ta première singularité", desc: 'Un point minuscule qui avale des galaxies de blocs.' },
    { id: 'boucle', nom: 'Boucle temporelle', pl: 'boucles temporelles', prix: 2.8e23, cps: 1.8e13, premier: "ta première boucle temporelle", desc: 'Le même bloc miné encore et encore, à travers tous les temps.' }
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
    ['netherite', 'Pioche en netherite', 2.5e7, 1e7],
    ['amethyste', "Pioche en améthyste", 2.5e12, 1e12],
    ['cosmique', 'Pioche cosmique', 2.5e18, 1e18]
  ];
  PIOCHES.forEach(function (p) {
    amel({ id: 'pioche-' + p[0], nom: p[1], prix: p[2], effet: 'clic', icone: { s: 'pioche', m: p[0] },
      desc: 'Chaque clic rapporte 2 fois plus.', cond: { total: p[3] } });
  });
  ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].forEach(function (r, i) {
    amel({ id: 'efficacite-' + (i + 1), nom: 'Efficacité ' + r, prix: 5e4 * Math.pow(100, i), effet: 'pct', icone: { s: 'livre' },
      desc: 'Chaque clic rapporte en plus 1 % de ta production par seconde.', cond: { clics: [100, 500, 1000, 2000, 4000, 7000, 10000, 14000, 20000, 30000][i], total: 2e4 * Math.pow(100, i) } });
  });
  ['I', 'II', 'III'].forEach(function (r, i) {
    amel({ id: 'fortune-' + (i + 1), nom: 'Fortune ' + r, prix: [1000, 2e5, 4e7][i], effet: 'fortune', icone: { s: 'gemme' },
      desc: 'Le bonus reçu quand un bloc casse est doublé.', cond: { casses: [5, 50, 250][i] } });
  });
  amel({ id: 'fortune-4', nom: 'Fortune IV', prix: 8e9, effet: 'fortune', icone: { s: 'gemme' }, desc: 'Le bonus reçu quand un bloc casse est doublé.', cond: { casses: 1000 } });
  amel({ id: 'fortune-5', nom: 'Fortune V', prix: 4e13, effet: 'fortune', icone: { s: 'gemme' }, desc: 'Le bonus reçu quand un bloc casse est doublé.', cond: { casses: 2500 } });
  amel({ id: 'fortune-6', nom: 'Fortune VI', prix: 6e17, effet: 'fortune', icone: { s: 'gemme' }, desc: 'Le bonus reçu quand un bloc casse est doublé.', cond: { casses: 6000 } });
  amel({ id: 'combo-3', nom: 'Rythme infernal', prix: 5e12, effet: 'combo', icone: { s: 'horloge' }, desc: 'Chaque niveau de combo ajoute 5 % au clic.', cond: { comboMax: 50 } });
  amel({ id: 'combo-1', nom: 'Métronome', prix: 5e5, effet: 'combo', icone: { s: 'horloge' }, desc: 'Chaque niveau de combo ajoute 3 % au clic au lieu de 2 %.', cond: { comboMax: 20 } });
  amel({ id: 'combo-2', nom: 'Rythme du forgeron', prix: 5e8, effet: 'combo', icone: { s: 'horloge' }, desc: 'Chaque niveau de combo ajoute 4 % au clic.', cond: { comboMax: 40 } });
  amel({ id: 'brillance-1', nom: 'Loupe de mineur', prix: 2e6, effet: 'brillance', icone: { s: 'gemme', m: 'or' }, desc: 'Les blocs brillants donnent 20 fois le bonus au lieu de 10.', cond: { brillants: 3 } });
  amel({ id: 'brillance-2', nom: 'Toucher doré', prix: 2e10, effet: 'brillance', icone: { s: 'gemme', m: 'or' }, desc: 'Les blocs brillants donnent 40 fois le bonus.', cond: { brillants: 15 } });
  amel({ id: 'brillance-3', nom: 'Éclat de météorite', prix: 2e14, effet: 'brillance', icone: { s: 'gemme', m: 'or' }, desc: 'Les blocs brillants donnent 80 fois le bonus.', cond: { brillants: 60 } });
  amel({ id: 'recharge-2', nom: 'Circuit de redstone', prix: 4e15, effet: 'recharge', icone: { s: 'foreuse' }, desc: 'Les capacités se rechargent encore 25 % plus vite.', cond: { capacites: 20 } });
  amel({ id: 'recharge-1', nom: 'Redstone accélérée', prix: 1e7, effet: 'recharge', icone: { s: 'foreuse' }, desc: 'Les capacités se rechargent 25 % plus vite.', cond: { capacites: 5 } });
  amel({ id: 'epee-1', nom: 'Épée en diamant', prix: 5e7, effet: 'epee', icone: { s: 'epee', m: 'diamant' }, desc: 'Tes coups font 2 fois plus de dégâts aux boss.', cond: { boss: 2 } });
  amel({ id: 'epee-2', nom: 'Épée en netherite', prix: 5e11, effet: 'epee', icone: { s: 'epee', m: 'netherite' }, desc: 'Tes coups font encore 2 fois plus de dégâts aux boss.', cond: { boss: 8 } });
  amel({ id: 'epee-3', nom: "Épée d'améthyste", prix: 5e15, effet: 'epee', icone: { s: 'epee', m: 'amethyste' }, desc: 'Tes coups font encore 2 fois plus de dégâts aux boss.', cond: { boss: 20 } });
  amel({ id: 'epee-4', nom: "Lame du cosmos", prix: 5e20, effet: 'epee', icone: { s: 'epee', m: 'cosmique' }, desc: 'Tes coups font encore 2 fois plus de dégâts aux boss.', cond: { boss: 45 } });
  amel({ id: 'chance-1', nom: 'Chance de la mer I', prix: 7777, effet: 'chance', icone: { s: 'coffre' }, desc: 'Les coffres et les creepers apparaissent plus souvent.', cond: { coffres: 3 } });
  amel({ id: 'chance-2', nom: 'Chance de la mer II', prix: 7.77e6, effet: 'chance', icone: { s: 'coffre' }, desc: 'Les coffres et les creepers apparaissent encore plus souvent.', cond: { coffres: 10 } });
  amel({ id: 'chance-3', nom: 'Chance de la mer III', prix: 7.77e12, effet: 'chance', icone: { s: 'coffre' }, desc: 'Les coffres et les creepers apparaissent encore plus souvent.', cond: { coffres: 60 } });
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
    ['regeneration', 'Potion de régénération', 5e17, 30, { s: 'potion', m: 'rose' }],
    ['saut', 'Potion de saut', 5e18, 35, { s: 'potion', m: 'vert' }],
    ['vision', 'Potion de vision nocturne', 5e19, 35, { s: 'potion', m: 'jaune' }],
    ['resistance', 'Potion de résistance', 5e20, 40, { s: 'potion', m: 'orange' }],
    ['chance', 'Potion de chance', 5e21, 40, { s: 'potion', m: 'cyan' }],
    ['totem', "Totem d'immortalité", 5e22, 50, { s: 'totem' }]
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
  function prog(id, nom, desc, icone, test, secret) { PROGRES.push({ id: id, nom: nom, desc: desc, icone: icone, test: test, secret: !!secret }); }
  [
    [1, 'Premier coup de pioche'], [1000, 'Un bel établi'], [1e5, "L'âge de pierre"], [1e6, 'Ça brille, là-dedans !'],
    [1e8, 'Toujours plus profond'], [1e10, 'Fièvre du diamant'], [1e12, 'Le cœur du monde'], [1e14, 'Au-delà de la roche-mère'],
    [1e16, 'Mineur de légende'], [1e18, 'Le monde entier y est passé'], [1e21, 'Plus rien à miner ?'],
    [1e24, 'Plus loin que les étoiles'], [1e30, 'Cosmos en poche'], [1e36, 'Hors du temps'], [1e45, 'Mineur éternel']
  ].forEach(function (t, i) {
    prog('total-' + i, t[1], 'Miner ' + (t[0] == 1 ? 'ton premier bloc' : '{' + t[0] + '} blocs au total') + '.', { s: 'pioche', m: ['bois', 'pierre', 'fer', 'or', 'diamant', 'netherite'][Math.min(5, Math.floor(i / 2))] },
      function (S) { return S.totalAll >= t[0]; });
  });
  [[1, 'Ça tourne tout seul'], [100, 'Petite entreprise'], [1e4, 'Chantier à plein régime'], [1e6, 'Usine à blocs'], [1e8, 'Machine de redstone géante'], [1e10, "L'industrie de l'End"], [1e13, 'Production galactique'], [1e16, 'Boucle sans fin'], [1e20, 'Au rythme des étoiles']]
    .forEach(function (t, i) {
      prog('cps-' + i, t[1], 'Produire {' + t[0] + '} bloc' + (t[0] > 1 ? 's' : '') + ' par seconde.', { s: 'foreuse' }, function (S, J) { return J.cpsBase >= t[0]; });
    });
  [[100, 'Doigts agiles'], [1000, 'Tendinite du mineur'], [10000, 'Clic-clac infini'], [50000, 'Poignet de titane'], [250000, 'Clic éternel']].forEach(function (t, i) {
    prog('clics-' + i, t[1], 'Cliquer {' + t[0] + '} fois sur le bloc.', { s: 'pioche', m: 'fer' }, function (S) { return S.clics >= t[0]; });
  });
  [[10, 'Casseur de blocs'], [100, 'Démolisseur'], [1000, 'Rien ne me résiste'], [10000, 'Tremblement de terre'], [100000, 'Érosion à grande vitesse']].forEach(function (t, i) {
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
    monde: ['Créateur', 'Multivers', "Architecte de l'infini"],
    commande: ['/give moi tout', 'Opérateur du serveur', 'Maître des commandes'],
    bedrock: ['Casseur de roche-mère', 'Les fondations tremblent', 'Il ne reste que le vide'],
    ordi: ['Premier programme', 'Salle des serveurs', 'Superordinateur'],
    soleil: ['Lever de soleil', 'Système solaire', 'Constellation de soleils'],
    univers: ['Forgeron cosmique', 'Atelier des mondes', 'Big Bang quotidien'],
    singularite: ['Trou noir de poche', "Horizon des événements", 'Au bord de la singularité'],
    boucle: ['Déjà vu', 'Éternel recommencement', 'Maître du temps']
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
  prog('noel', 'Joyeux Noël !', "Ouvrir un cadeau pendant l'événement de Noël.", { s: 'cadeau' }, function (S) { return S.cadeaux >= 1; });
  prog('boss-1', 'Chasseur de monstres', 'Vaincre un boss.', { s: 'zombie' }, function (S) { return S.bossTotal >= 1; });
  prog('boss-10', 'Tueur de géants', 'Vaincre 10 boss.', { s: 'araignee' }, function (S) { return S.bossTotal >= 10; });
  prog('boss-dragon', 'Libérer la fin', "Vaincre le dragon de l'End.", { s: 'dragon' }, function (S) { return S.bossVaincus.indexOf('end') >= 0; });
  prog('boss-warden', 'Silence absolu', 'Vaincre le Warden de la cité antique.', { s: 'warden' }, function (S) { return S.bossVaincus.indexOf('cite') >= 0; });
  prog('boss-tous', 'Bestiaire complet', 'Vaincre le boss de chaque dimension.', { s: 'blaze' }, function (S) { return S.bossVaincus.length >= DIMENSIONS.length; });
  prog('familier-1', 'Meilleur ami', 'Adopter un familier.', { s: 'loup' }, function (S) { return S.familiers.length >= 1; });
  prog('familiers-tous', 'Ménagerie', 'Adopter tous les familiers.', { s: 'chat' }, function (S) { return S.familiers.length >= FAMILIERS.length; });
  prog('collection-1', 'Apprenti géologue', 'Atteindre la maîtrise 1 sur un bloc de la collection.', { s: 'pierre-ic' }, function (S, J) { return J.maitrise >= 1; });
  prog('collection-tous', 'Géologue', 'Atteindre la maîtrise 1 sur tous les blocs de la collection.', { s: 'pierre-ic' }, function (S, J) { return J.blocsMaitrises >= Object.keys(BLOCS).length; });
  prog('collection-max', 'Maître géologue', 'Atteindre la maîtrise 3 sur tous les blocs de la collection.', { s: 'gemme' }, function (S, J) { return J.maitrise >= Object.keys(BLOCS).length * 3; });
  prog('amel-200', 'Encyclopédie', 'Acheter 200 améliorations.', { s: 'livre' }, function (S) { return S.amels.length >= 200; });
  prog('renaitre-25', 'Cycle éternel', 'Renaître 25 fois.', { s: 'etoile' }, function (S) { return S.renaissances >= 25; });
  prog('renaitre-100', 'Roue du temps', 'Renaître 100 fois.', { s: 'etoile' }, function (S) { return S.renaissances >= 100; });
  prog('temps-100', 'Colocataire de la mine', 'Jouer pendant 100 heures.', { s: 'horloge' }, function (S) { return S.tempsJeu >= 360000; });
  prog('temps-500', 'Légende vivante', 'Jouer pendant 500 heures.', { s: 'horloge' }, function (S) { return S.tempsJeu >= 1800000; });
  prog('etoiles-1000', 'Voie lactée', 'Posséder 1 000 étoiles du Nether.', { s: 'etoile' }, function (S) { return S.etoiles >= 1000; });
  prog('etoiles-10000', "L'Univers observable", 'Posséder 10 000 étoiles du Nether.', { s: 'etoile' }, function (S) { return S.etoiles >= 10000; });
  prog('etoiles-100000', 'Ciel sans fin', 'Posséder 100 000 étoiles du Nether.', { s: 'etoile' }, function (S) { return S.etoiles >= 100000; });
  prog('eclat-1', 'Premier éclat', 'Acheter un éclat stellaire.', { s: 'etoile', m: 'fragment' }, function (S) { return S.eclats >= 1; });
  prog('eclat-10', 'Poussière d\'étoile', 'Acheter 10 éclats stellaires.', { s: 'etoile', m: 'fragment' }, function (S) { return S.eclats >= 10; });
  prog('eclat-50', 'Aurore stellaire', 'Acheter 50 éclats stellaires.', { s: 'etoile', m: 'fragment' }, function (S) { return S.eclats >= 50; });
  prog('eclat-200', 'Soleil intérieur', 'Acheter 200 éclats stellaires.', { s: 'etoile', m: 'fragment' }, function (S) { return S.eclats >= 200; });
  prog('brillant-100', "Mine d'or", 'Casser 100 blocs brillants.', { s: 'gemme', m: 'or' }, function (S) { return S.brillants >= 100; });
  prog('combo-75', 'Doigts de fée', 'Atteindre un combo de 75.', { s: 'horloge' }, function (S) { return S.comboMax >= 75; });
  prog('missions-200', 'Employé du siècle', 'Terminer 200 missions.', { s: 'parchemin' }, function (S) { return S.missionsFaites >= 200; });
  prog('coffres-200', 'Roi des trésors', 'Ouvrir 200 coffres au trésor.', { s: 'coffre' }, function (S) { return S.coffres >= 200; });
  prog('creeper-100', 'Chuchoteur de creepers', 'Désamorcer 100 creepers.', { s: 'creeper' }, function (S) { return S.creepers >= 100; });
  prog('boss-bedrock', 'Brise-roche', 'Vaincre le Golem de bedrock.', { s: 'gbedrock' }, function (S) { return S.bossVaincus.indexOf('bedrock') >= 0; });
  prog('boss-cosmos', 'Poussière de météorite', 'Vaincre le Colosse de météorite.', { s: 'colosse' }, function (S) { return S.bossVaincus.indexOf('cosmos') >= 0; });
  prog('boss-infini', 'Le dernier mot', 'Vaincre le Dernier Ender.', { s: 'ender' }, function (S) { return S.bossVaincus.indexOf('infini') >= 0; });
  prog('boss-50', 'Exterminateur', 'Vaincre 50 boss.', { s: 'dragon' }, function (S) { return S.bossTotal >= 50; });
  prog('curieux', 'Curieux', 'Progrès secret.', { s: 'livre' }, function (S) { return S.secrets.indexOf('titre') >= 0; }, true);
  prog('minuit', 'Mineur de minuit', 'Progrès secret.', { s: 'horloge' }, function (S) { return S.secrets.indexOf('minuit') >= 0; }, true);
  prog('nuit', 'Gardien de la nuit', 'Progrès secret.', { s: 'creeper' }, function (S) { return S.creepersNuit >= 1; }, true);

  var SECRETS = { curieux: 'Cliquer 10 fois sur le titre du jeu.', minuit: 'Jouer entre minuit et 5 heures du matin.', nuit: 'Désamorcer un creeper pendant la nuit, à la surface.' };
  PROGRES.forEach(function (p) { if (p.secret) p.vraieDesc = SECRETS[p.id]; });

  /* ---------- Boss : un par dimension ; clique dessus avant la fin du temps ---------- */
  var BOSS = {
    surface: { nom: 'Zombie géant', icone: { s: 'zombie' }, pv: 40, couleurs: ['#3fbf4a', '#1d7a2c', '#1f8a8f'] },
    grottes: { nom: 'Araignée des cavernes', icone: { s: 'araignee' }, pv: 55, couleurs: ['#1d1d1d', '#3a3a3a', '#c62828'] },
    profondeurs: { nom: 'Gardien des profondeurs', icone: { s: 'gardien' }, pv: 70, couleurs: ['#1f8a8f', '#0b3a3e', '#d9822b'] },
    coeur: { nom: 'Golem de diamant', icone: { s: 'golem', m: 'golem-diamant' }, pv: 85, couleurs: ['#2fd3c6', '#b0fff7', '#1a9a95'] },
    nether: { nom: 'Blaze ardent', icone: { s: 'blaze' }, pv: 100, couleurs: ['#f5d042', '#d9822b', '#f0b45a'] },
    end: { nom: "Dragon de l'End", icone: { s: 'dragon' }, pv: 130, couleurs: ['#1d1d1d', '#3a3a3a', '#d18cff'] },
    cite: { nom: 'Le Warden', icone: { s: 'warden' }, pv: 160, couleurs: ['#0b3a3e', '#1f8a8f', '#c4fcff'] },
    bedrock: { nom: 'Golem de bedrock', icone: { s: 'gbedrock' }, pv: 190, couleurs: ['#1e1e1e', '#454545', '#2fd3c6'] },
    cosmos: { nom: 'Colosse de météorite', icone: { s: 'colosse' }, pv: 230, couleurs: ['#3a3f4a', '#ff9a3c', '#ffcf6b'] },
    infini: { nom: 'Le Dernier Ender', icone: { s: 'ender' }, pv: 280, couleurs: ['#05030a', '#b98ae6', '#ffffff'] }
  };

  /* ---------- Familiers : un seul accompagne le mineur, chacun donne un bonus ---------- */
  var FAMILIERS = [
    { id: 'loup', nom: 'Loup', desc: 'Tes clics rapportent 50 % de plus.', aide: 'Cliquer 1 000 fois sur le bloc', test: function (S) { return S.clics >= 1000; } },
    { id: 'abeille', nom: 'Abeille', desc: 'Toute la production augmente de 10 %.', aide: 'Acheter 100 machines', test: function (S) { return S.achats >= 100; } },
    { id: 'chat', nom: 'Chat', desc: "Les creepers ont peur des chats : il n'y a plus que des coffres.", aide: 'Désamorcer 5 creepers', test: function (S) { return S.creepers >= 5; } },
    { id: 'axolotl', nom: 'Axolotl', desc: 'Le bonus quand un bloc casse est doublé.', aide: 'Casser 500 blocs', test: function (S) { return S.casses >= 500; } },
    { id: 'perroquet', nom: 'Perroquet', desc: "Le combo te laisse plus de temps entre deux clics et monte jusqu'à 75.", aide: 'Atteindre un combo de 40', test: function (S) { return S.comboMax >= 40; } },
    { id: 'renard', nom: 'Renard', desc: 'Les missions rapportent 50 % de plus.', aide: 'Terminer 10 missions', test: function (S) { return S.missionsFaites >= 10; } },
    { id: 'allay', nom: 'Allay', desc: "Ramasse les coffres pour toi : ils s'ouvrent tout seuls au bout de 3 secondes.", aide: 'Ouvrir 25 coffres', test: function (S) { return S.coffres >= 25; } },
    { id: 'dragonnet', nom: 'Bébé dragon', desc: 'Tes coups font 2 fois plus de dégâts aux boss.', aide: "Vaincre le dragon de l'End", test: function (S) { return S.bossVaincus.indexOf('end') >= 0; } },
    { id: 'panda', nom: 'Panda', desc: 'Les trésors des coffres et des creepers sont 3 fois plus gros.', aide: 'Ouvrir 100 coffres', test: function (S) { return S.coffres >= 100; } },
    { id: 'tortue', nom: 'Tortue', desc: 'Les machines coûtent 10 % moins cher.', aide: 'Acheter 1 000 machines', test: function (S) { return S.achats >= 1000; } },
    { id: 'phenix', nom: 'Phénix', desc: 'Toute la production augmente de 25 %.', aide: 'Vaincre le Golem de bedrock', test: function (S) { return S.bossVaincus.indexOf('bedrock') >= 0; } }
  ];
  FAMILIERS.forEach(function (f) { f.icone = { s: f.id }; });

  /* ---------- Collection : chaque bloc cassé compte ; maîtrise 1, 2, 3 = +1 % de production chacune ---------- */
  var MAITRISE = [25, 250, 2500];

  /* ---------- Phrases d'accueil, à côté du titre ---------- */
  var PHRASES = ['Aussi en pixels !', '100 % fait maison !', 'Ne creuse jamais tout droit vers le bas !', 'Attention aux creepers !', 'Cubique !', 'Toujours plus de blocs !',
    'Hmm !', 'Ssssss…', 'Clic clic clic !', "Pas de dragon sans œuf !", 'Maintenant avec des boss !', 'Fait avec de la redstone !', 'Le pain, ça se mange !',
    'Garanti sans lave !', 'Ton chat te protège !', 'Une pioche par jour !', 'Écoute le silence de la cité…', 'Brille, petit bloc !', 'Combo !', 'Il fait nuit ? Prudence !'];

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
    { id: 'dragon', nom: 'Souffle du dragon', prix: 200, icone: { s: 'oeuf' }, desc: 'La frénésie multiplie la production par 10 au lieu de 7.' },
    { id: 'forge1', nom: 'Forge céleste I', prix: 30, forge: 1.5, icone: { s: 'foreuse' }, desc: 'Toute la production ×1,5.' },
    { id: 'gant2', nom: 'Gant de netherite', prix: 35, icone: { s: 'golem', m: 'golem-diamant' }, desc: 'Tes clics rapportent encore 3 fois plus.' },
    { id: 'geologue', nom: 'Géologue céleste', prix: 45, icone: { s: 'pierre-ic' }, desc: 'Chaque niveau de maîtrise de la collection ajoute 2 % de production au lieu de 1 %.' },
    { id: 'depart2', nom: 'Sac de départ II', prix: 50, icone: { s: 'coffre' }, desc: 'Chaque nouvelle vie commence avec 50 pioches, 25 mineurs, 10 golems et 5 wagonnets.' },
    { id: 'primes', nom: 'Chasseur de primes', prix: 60, icone: { s: 'epee', m: 'netherite' }, desc: 'Les boss rapportent 3 fois plus de blocs.' },
    { id: 'forge2', nom: 'Forge céleste II', prix: 80, forge: 2, icone: { s: 'foreuse' }, desc: 'Toute la production ×2.' },
    { id: 'soie2', nom: 'Toucher de soie II', prix: 120, icone: { s: 'gemme' }, desc: 'Le bonus quand un bloc casse est encore multiplié par 3.' },
    { id: 'fantome2', nom: 'Pioche fantôme II', prix: 150, icone: { s: 'pioche', m: 'netherite' }, desc: 'La pioche fantôme frappe 5 fois par seconde au lieu de 2.' },
    { id: 'gant3', nom: "Gant de l'End", prix: 200, icone: { s: 'golem', m: 'golem-diamant' }, desc: 'Tes clics rapportent encore 5 fois plus.' },
    { id: 'forge3', nom: 'Forge céleste III', prix: 200, forge: 3, icone: { s: 'foreuse' }, desc: 'Toute la production ×3.' },
    { id: 'maitre-marchand', nom: 'Maître marchand', prix: 250, icone: { s: 'mineur' }, desc: 'Les machines coûtent encore 10 % moins cher.' },
    { id: 'bibliothecaire2', nom: 'Grande bibliothèque', prix: 250, icone: { s: 'livre' }, desc: 'Les améliorations coûtent encore 10 % moins cher.' },
    { id: 'constellation2', nom: 'Voie lactée', prix: 400, icone: { s: 'etoile', m: 'fragment' }, desc: 'Chaque étoile du Nether ajoute 5 % de production (au lieu de 2 ou 3 %).' },
    { id: 'forge4', nom: 'Forge céleste IV', prix: 500, forge: 5, icone: { s: 'foreuse' }, desc: 'Toute la production ×5.' },
    { id: 'forge5', nom: 'Forge céleste V', prix: 1000, forge: 10, icone: { s: 'foreuse' }, desc: 'Toute la production ×10.' },
    { id: 'depart3', nom: 'Sac de départ III', prix: 385, icone: { s: 'coffre' }, desc: 'Chaque nouvelle vie commence avec 250 pioches, 150 mineurs, 75 golems, 40 wagonnets et 20 TNT.' },
    { id: 'forge6', nom: 'Forge céleste VI', prix: 570, forge: 3, icone: { s: 'foreuse' }, desc: 'Toute la production ×3.' },
    { id: 'sablier2', nom: 'Sablier éternel', prix: 660, icone: { s: 'sablier' }, desc: 'Les effets des coffres et des capacités durent encore 50 % plus longtemps.' },
    { id: 'geologue2', nom: 'Géologue stellaire', prix: 740, icone: { s: 'pierre-ic' }, desc: 'Chaque niveau de maîtrise de la collection ajoute 3 % de production.' },
    { id: 'constellation3', nom: 'Galaxie', prix: 850, icone: { s: 'etoile', m: 'fragment' }, desc: 'Chaque étoile du Nether ajoute 8 % de production.' },
    { id: 'absence2', nom: 'Horloge éternelle', prix: 970, icone: { s: 'horloge' }, desc: "Pendant ton absence, les machines travaillent à pleine vitesse jusqu'à 7 jours." },
    { id: 'marchand4', nom: "Marchand de l'infini", prix: 1100, icone: { s: 'mineur' }, desc: 'Les machines coûtent encore 10 % moins cher.' },
    { id: 'bibliothecaire3', nom: 'Bibliothèque infinie', prix: 1100, icone: { s: 'livre' }, desc: 'Les améliorations coûtent encore 10 % moins cher.' },
    { id: 'gant4', nom: 'Gant du Vide', prix: 1320, icone: { s: 'golem', m: 'golem-diamant' }, desc: 'Tes clics rapportent encore 10 fois plus.' },
    { id: 'fantome3', nom: 'Pioche fantôme III', prix: 1490, icone: { s: 'pioche', m: 'cosmique' }, desc: 'La pioche fantôme frappe 10 fois par seconde.' }
  ];
  POUVOIRS.sort(function (x, y) { return x.prix - y.prix; });

  /* ---------- Paliers d'étoiles : à chaque palier atteint, toute la production est multipliée ---------- */
  var JALONS = [[1, 1.1], [5, 1.25], [10, 1.5], [25, 2], [50, 3], [100, 5], [250, 2], [500, 2], [1000, 3]];
  // …et ils ne s'arrêtent jamais : ensuite, un palier tous les ×2,5, ×2 puis ×2 étoiles (2 500, 5 000, 10 000, 25 000, 50 000, 100 000…)
  var JALONS_SUITE = [[2.5, 2], [2, 1.6], [2, 1.6]];
  // produit de tous les paliers atteints avec n étoiles
  function multJalons(n) {
    var x = 1, i;
    for (i = 0; i < JALONS.length; i++) { if (n < JALONS[i][0]) return x; x *= JALONS[i][1]; }
    var e = JALONS[JALONS.length - 1][0], k = 0;
    for (;;) { var f = JALONS_SUITE[k % JALONS_SUITE.length]; e = Math.round(e * f[0]); if (!(n >= e)) return x; x *= f[1]; k++; }
  }
  // les nb prochains paliers au-delà de n étoiles : [[étoiles, multiplicateur], …]
  function prochainsJalons(n, nb) {
    var res = [], i;
    for (i = 0; i < JALONS.length && res.length < nb; i++) if (JALONS[i][0] > n) res.push(JALONS[i]);
    var e = JALONS[JALONS.length - 1][0], k = 0;
    while (res.length < nb) { var f = JALONS_SUITE[k % JALONS_SUITE.length]; e = Math.round(e * f[0]); k++; if (e > n) res.push([e, f[1]]); }
    return res;
  }
  /* Règles de la renaissance.
     Étoiles : la 1re à 100 millions de blocs minés (au total), racine cubique jusqu'à 10 étoiles ; au-delà, chaque étoile
     coûte de plus en plus cher (racine sixième), ce qui rend la suite de la partie bien plus longue.
     Effet des étoiles : au-delà de ×100, il continue de croître sans jamais s'arrêter, mais plus doucement (puissance 0,5).
     Éclats stellaires : une boutique sans fond, chaque éclat coûte plus cher que le précédent et multiplie l'effet des étoiles. */
  var REGLES = {
    seuilEtoile: 1e8, palier: 10, racine: 6.15, plafondEffet: 100, douceur: 0.5,
    seuil: function (k) { return k <= 10 ? 1e8 * k * k * k : 1e8 * Math.pow(k, REGLES.racine) / Math.pow(10, REGLES.racine - 3); },
    etoiles: function (total) {
      if (!(total > 0)) return 0;
      var r = REGLES.racine;
      return Math.floor((total <= 1e11 ? Math.cbrt(total / 1e8) : Math.pow(total * Math.pow(10, r - 3) / 1e8, 1 / r)) + 1e-9);
    },
    prixEclat: function (n) { return Math.ceil(400 * Math.pow(1.15, n)); },
    multEclat: function (n) { return Math.pow(1.06, n); },
    // effet des étoiles : identique jusqu'à ×100, puis 100 × (x / 100)^0,5, sans plafond
    doux: function (x) { return x <= 100 ? x : 100 * Math.pow(x / 100, 0.5); },
    multJalons: multJalons, prochainsJalons: prochainsJalons
  };


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
    { id: 'capacites', txt: 'Utiliser {n} capacité(s)', buts: [1, 2, 3] },
    { id: 'boss', txt: 'Vaincre {n} boss', buts: [1] }
  ];

  /* ---------- Dessins en pixels (12 × 12) ----------
     Une lettre = une couleur de la palette ; « . » = transparent.
     Les lettres x et X (tête de pioche) et q et Q (liquide) changent selon le matériau. */
  var PALETTE = {
    k: '#1d1d1d', K: '#3a3a3a', g: '#8f8f8f', G: '#c8c8c8', W: '#ffffff', s: '#6e6e6e',
    w: '#b8874a', b: '#8b5a2b', d: '#5e3b1c', r: '#c62828', R: '#ff7a6b', m: '#d9822b', M: '#f0b45a',
    o: '#1f1430', O: '#4b2b75', p: '#8a2be2', P: '#d18cff', c: '#3fd8e0', C: '#c4fcff',
    u: '#3b6fd8', U: '#8fb6ff', z: '#ff9fd0', Z: '#d65aa0', y: '#dcdca0', Y: '#f5d042', e: '#3fbf4a', E: '#1d7a2c', f: '#d9a074', n: '#a8704a', h: '#4a2e1a',
    t: '#0b3a3e', T: '#1f8a8f', l: 'rgba(205,240,255,.45)', x: '#9c6b30', X: '#c79a5a', q: '#c62828', Q: '#ff8a80', v: '#6b3fa0', V: '#b98ae6'
  };
  var MATIERES = {
    bois: { x: '#9c6b30', X: '#c79a5a' }, pierre: { x: '#7a7a7a', X: '#adadad' }, fer: { x: '#c9c9c9', X: '#f4f4f4' },
    or: { x: '#e8b923', X: '#fff27a' }, diamant: { x: '#2fd3c6', X: '#b0fff7' }, netherite: { x: '#3d3438', X: '#776a6f' },
    amethyste: { x: '#7a3fc4', X: '#d7b4ff' }, cosmique: { x: '#2a3a8f', X: '#8fb6ff' },
    vert: { q: '#3fbf4a', Q: '#b8f5bd' }, jaune: { q: '#f5d042', Q: '#fff6b0' }, orange: { q: '#e8821a', Q: '#ffd199' }, cyan: { q: '#2fd3c6', Q: '#c4fcff' },
    rouge: { q: '#c62828', Q: '#ff8a80' }, bleu: { q: '#4f7cff', Q: '#b3c8ff' }, violet: { q: '#8a2be2', Q: '#d6a8ff' }, rose: { q: '#e055c0', Q: '#ffb3ec' },
    enchantee: { r: '#f5d042', R: '#fff6b0' }, fragment: { W: '#e2b8ff', G: '#9b4de0' }, 'golem-diamant': { g: '#2fd3c6', G: '#b0fff7', s: '#1a9a95' }
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
    zombie: ['..EEEEEEEE..', '..EeeeeeeE..', '..eeeeeeee..', '..ekkeekke..', '..eeeeeeee..', '..eeeEEeee..', '..eeEeeEee..', '..eeeeeeee..', '.TTTTTTTTTT.', 'TTTtTTTTtTTT', 'TTTTTTTTTTTT', 'TTTTTTTTTTTT'],
    araignee: ['k..........k', '.k........k.', '..k.kkkk.k..', '...kKKKKk...', 'kkkKrKKrKkkk', '...KrKKrK...', 'kkkKKKKKKkkk', '...kKKKKk...', '..k.kkkk.k..', '.k........k.', 'k..........k', '............'],
    gardien: ['..m..mm..m..', '.TTTTTTTTTT.', 'mTtTTTTTTtTm', '.TTTWWWWTTT.', '.TTWWkkWWTT.', 'mTTWWkkWWTTm', '.TTTWWWWTTT.', '.TtTTTTTTtT.', 'mTTTTTTTTTTm', '.TTTTTTTTTT.', '..m..mm..m..', '............'],
    blaze: ['Y..........Y', '.m...YY...m.', '...YYYYYY...', 'Y.YMMMMMMY.Y', '..YkkMMkkY..', '..YMMMMMMY..', 'm.YMkkkkMY.m', '..YYYYYYYY..', '.m...mm...m.', 'Y...m..m...Y', '..Y......Y..', '............'],
    dragon: ['.kk......kk.', '.kKk....kKk.', '..kKkkkkKk..', '.kKKKKKKKKk.', 'kKpPKKKKpPKk', 'kKKKKKKKKKKk', 'kKKKKKKKKKKk', '.kKKKKKKKKk.', '..kKKKKKKk..', '..kKkKKkKk..', '...kkkkkk...', '............'],
    warden: ['T..........T', 'Tt..tttt..tT', '.tttttttttt.', '.ttkkttkktt.', '.tttttttttt.', '..tttttttt..', '.tTttCCttTt.', 'tttCCCCCCttt', 'tttTCCCCTttt', 'tt.tttttt.tt', 'tt.tt..tt.tt', '............'],
    loup: ['.GG......GG.', '.GgG....GgG.', '.GGGGGGGGGG.', 'GGGGGGGGGGGG', 'GGkGGGGGGkGG', 'GGGGGGGGGGGG', 'GGGGWWWWGGGG', '.GGWWkkWWGG.', '..GWWWWWWG..', '...GWrrWG...', '....GGGG....', '............'],
    chat: ['.m........m.', '.mm......mm.', '.mmmmmmmmmm.', 'mmMmMmmMmMmm', 'mmeemmmmeemm', 'mmekmmmmekmm', 'mmmmmMMmmmmm', 'mmmmMffMmmmm', 'WmmmmmmmmmmW', '.mmmmmmmmmm.', '..mmmmmmmm..', '............'],
    perroquet: ['....rrrr....', '...rRRRRr...', '..rRRRRRRr..', '..rRkWRRRr..', '..rRRRRRYYk.', '..rRRRRRYk..', '...rRRRRr...', '...ruuRRr...', '...ruuuRr...', '....ruuur...', '.....YY.....', '............'],
    axolotl: ['Z..........Z', 'ZZ.zzzzzz.ZZ', '.ZzzzzzzzzZ.', 'Z.zkzzzzkz.Z', '..zzzzzzzz..', '..zzzZZzzz..', '..zzzzzzzz..', '...zzzzzz...', '..zz....zz..', '............', '............', '............'],
    abeille: ['..WW....WW..', '..WlW..WlW..', '...WW..WW...', '.YYkkYYkkYY.', 'YYYkkYYkkYYY', 'YkYkkYYkkYYY', 'YkYkkYYkkYYk', 'YYYkkYYkkYYY', '.YYkkYYkkYY.', '............', '............', '............'],
    renard: ['.m........m.', '.mk......km.', '.mmmmmmmmmm.', 'mmmmmmmmmmmm', 'mmkkmmmmkkmm', 'WWmmmmmmmmWW', 'WWWWmmmmWWWW', '.WWWWkkWWWW.', '..WWWWWWWW..', '............', '............', '............'],
    allay: ['............', '....CCCC....', '...CccccC...', '...CckckC...', '...CccccC...', '.CC.CccC.CC.', 'CCCCccccCCCC', '.C..cccc..C.', '....cccc....', '.....cc.....', '............', '............'],
    dragonnet: ['............', '.p........p.', '.pk......kp.', '..kkkkkkkk..', '.kKKKKKKKKk.', '.kKpKKKKpKk.', '.kKKKKKKKKk.', '..kKKKKKKk..', '..kKkKKkKk..', '...kkkkkk...', '............', '............'],
    epee: ['..........XX', '.........XxX', '........XxX.', '.......XxX..', '......XxX...', '.....XxX....', '.d..XxX.....', '..dXxX......', '..ddX.......', '.bdd........', 'bb..d.......', 'b...........'],
    'pierre-ic': ['gggggggggggg', 'gGggsggggGgg', 'ggggggGggggg', 'gsgggggggsgg', 'ggggGggggggg', 'ggsgggggGggg', 'gggggggsgggg', 'gGgggggggggs', 'gggggsgGgggg', 'gggGgggggggg', 'gsgggggggGgg', 'gggggggggggg'],
    etoile: ['.....WW.....', '.....WW.....', '....WWWW....', 'WWWWWGGWWWWW', '.WWWGGGGWWW.', '..WWGGGGWW..', '...WWGGWW...', '..WWW..WWW..', '.WWW....WWW.', 'WW........WW', '............', '............'],
    commande: ['dddddddddddd', 'dmmmmmmmmmmd', 'dmMMMMMMMMmd', 'dmMkMMMMMMmd', 'dmMMkMMMMMmd', 'dmMMMkMMMMmd', 'dmMMkMMMMMmd', 'dmMkMMYYYMmd', 'dmMMMMMMMMmd', 'dmmmmmmmmmmd', 'dddddddddddd', '............'],
    bedrock: ['kKkKKkKkKKkK', 'KkKkkKkKkkKk', 'kKKkKkKKkKKk', 'KkkKkKkkKkkK', 'kKkKcCcKkKkK', 'KkKcCCCcKkKk', 'kKkKcCcKkKKk', 'KkKkKcKkKkkK', 'kKKkKkKKkKKk', 'KkKkkKkKkkKk', 'kKkKKkKkKKkK', 'KkKkKkKkKkKk'],
    ordi: ['GGGGGGGGGGGG', 'GkkkkkkkkkkG', 'GkrRrkkkkrkG', 'GkkkrkrRrrkG', 'GkrrrkrkkkkG', 'GkkkkkrkrrkG', 'GkrRrrrkrkkG', 'GkkkkkkkkkkG', 'GGGGGGGGGGGG', '....GGGG....', '..GGGGGGGG..', '..gggggggg..'],
    soleil: ['.Y...YY...Y.', '..Y.YYYY.Y..', '...YMMMMY...', 'Y.YMMYYMMY.Y', '.YMMYWWYMMY.', 'YYMYWWWWYMYY', 'YYMYWWWWYMYY', '.YMMYWWYMMY.', 'Y.YMMYYMMY.Y', '...YMMMMY...', '..Y.YYYY.Y..', '.Y...YY...Y.'],
    univers: ['oooooooooooo', 'oWoooooOOooo', 'oooOOOOPPPoo', 'ooOPPPPPPPPo', 'oOPPuuuuPPPo', 'oOPuUUWUuPPo', 'oPPuUWWUuPOo', 'oPPuuUUuuPOo', 'oPPPuuuuPPOo', 'ooPPPPPPPOoo', 'oooPPPOOOooo', 'oooooooWoooo'],
    singularite: ['............', '...mmMMmm...', '..mMYYYYMm..', '.mMYooooYMm.', '.mYooookoYm.', 'mMYookkkoYMm', 'mMYookkkoYMm', '.mYooookoYm.', '.mMYooooYMm.', '..mMYYYYMm..', '...mmMMmm...', '............'],
    boucle: ['............', '............', '..ccc..ccc..', '.cCCCccCCCc.', 'cCc.cCCc.cCc', 'cC..cWWc..Cc', 'cCc.cCCc.cCc', '.cCCCccCCCc.', '..ccc..ccc..', '............', '............', '............'],
    gbedrock: ['..kkkkkkkk..', '.kKKKKKKKKk.', '.kKcCKKcCKk.', '.kKKKKKKKKk.', '.kKKkKKkKKk.', '..kKKKKKKk..', '.kkKKKKKKkk.', 'kKKkKKKKkKKk', 'kKKkKccKkKKk', 'kKKkKKKKkKKk', '.kk.kKKk.kk.', '.kk..kk..kk.'],
    colosse: ['...kKKKKk...', '..kKgKKKKk..', '.kKKKKKgKKk.', 'kKrrKKKKrrKk', 'kKKKKmKKKKKk', 'kKgKKmYKKgKk', 'kKKKmYmKKKKk', 'kKKKKmKKKKgk', '.kKgKKKKKKk.', '.kKKKKgKKKk.', '..kkKKKKkk..', '...kkkkkk...'],
    ender: ['...kkkkkk...', '..kKKKKKKk..', '..kPPkkPPk..', '..kKKKKKKk..', '...kkkkkk...', '..kKKKKKKk..', '.kKkKKKKkKk.', '.kK.kKKk.Kk.', '.kK.kKKk.Kk.', '.kK.kKKk.Kk.', '.kk.kKKk.kk.', '....kkkk....'],
    panda: ['kk........kk', 'kkk......kkk', '.WWWWWWWWWW.', 'WWWWWWWWWWWW', 'WWkkWWWWkkWW', 'WWkWkWWkWkWW', 'WWWWWWWWWWWW', 'WWWWWkkWWWWW', 'WWWWkkkkWWWW', '.WWWWWWWWWW.', '..WWWWWWWW..', '............'],
    tortue: ['....eeee....', '....ekke....', '....eeee....', '..EEEEEEEE..', '.EeeEeeEeeE.', 'EeeeEeeEeeeE', 'EEEEEEEEEEEE', 'EeeeEeeEeeeE', '.EeeEeeEeeE.', '..EEEEEEEE..', 'ee..e..e..ee', 'ee........ee'],
    phenix: ['.....rr.....', '....rRRr....', '...rRYYRr...', '.r.rRYYRr.r.', 'rRrrRRRRrrRr', '.rRrRRRRrRr.', '..rRRYYRRr..', '...rRYYRr...', '....rRRr....', '...m.rr.m...', '..mM.mm.Mm..', '.mM......Mm.'],
    totem: ['....YYYY....', '...YkYYkY...', '...YYYYYY...', '..eeYmmYee..', '.YeeYYYYeeY.', '.YYYYYYYYYY.', '..YYYmmYYY..', '...YYYYYY...', '....YYYY....', '....YeeY....', '....YYYY....', '............']
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
    POUVOIRS: POUVOIRS, JALONS: JALONS, REGLES: REGLES, CAPACITES: CAPACITES, MISSIONS: MISSIONS, BOSS: BOSS, FAMILIERS: FAMILIERS, MAITRISE: MAITRISE, PHRASES: PHRASES
  };
})();
