/* Chapitre 1 bis : exercices de requêtes simples (R1.05).
   ------------------------------------------------------------------------------------------
   Ce fichier ne contient que des DONNÉES : les bases et les exercices. La page
   exercices-requetes.html les affiche, exécute les requêtes et corrige toute seule.

   AJOUTER UN EXERCICE : copier un bloc de EXERCICES (en bas) et changer ses champs.
     id          identifiant unique, sans espace (il sert à enregistrer la progression)
     titre       titre court
     niveau      'facile', 'moyen' ou 'difficile'
     base        nom d'une base de BASES (son modèle s'affiche avec l'exercice)
     notions     mots-clés affichés en étiquettes (SELECT, WHERE, LIKE…)
     enonce      la consigne
     solution    la requête de référence : le résultat de l'élève est comparé au sien.
                 Avec ORDER BY dans la solution, l'ordre des lignes compte aussi.
     indice      (facultatif) une aide
     explication (facultatif) affichée avec la solution

   AJOUTER UNE BASE : ajouter une entrée dans BASES, avec pour chaque table son nom, ses
   colonnes, sa clé primaire (key), ses clés étrangères (fk : colonne -> table référencée)
   et ses lignes (null = valeur non renseignée), puis la liste de ses contraintes.
   ------------------------------------------------------------------------------------------ */

const BASES = {
  cinema: {
    nom: 'Cinéma',
    description: 'Des films, leurs réalisateurs et réalisatrices, et leur pays.',
    tables: [
      { name: 'Pays', cols: ['codePays', 'nomPays'], key: ['codePays'], fk: {}, rows: [
        [1, 'France'], [2, 'États-Unis'], [3, 'Japon'], [4, 'Royaume-Uni'], [5, 'Corée du Sud'], [6, 'Italie'], [7, 'Nouvelle-Zélande']] },
      { name: 'Realisateur', cols: ['codeReal', 'nom', 'prénom', 'codePays'], key: ['codeReal'], fk: { codePays: 'Pays' }, rows: [
        [1, 'Varda', 'Agnès', 1], [2, 'Kurosawa', 'Akira', 3], [3, 'Miyazaki', 'Hayao', 3], [4, 'Bong', 'Joon-ho', 5],
        [5, 'Jackson', 'Peter', 7], [6, 'Nolan', 'Christopher', 4], [7, 'Sciamma', 'Céline', 1], [8, 'Fellini', 'Federico', 6],
        [9, 'Spielberg', 'Steven', 2], [10, 'Gerwig', 'Greta', 2], [11, 'Tati', 'Jacques', 1], [12, 'Kore-eda', 'Hirokazu', 3],
        [13, 'Leone', 'Sergio', 6], [14, 'Coppola', 'Sofia', 2], [15, 'JR', null, 1]] },
      { name: 'Film', cols: ['codeFilm', 'titre', 'annéeSortie', 'durée', 'codeReal'], key: ['codeFilm'], fk: { codeReal: 'Realisateur' }, rows: [
        [1, 'Le Voyage de Chihiro', 2001, 125, 3], [2, 'Les Sept Samouraïs', 1954, 207, 2], [3, 'Parasite', 2019, 132, 4],
        [4, "La Communauté de l'anneau", 2001, 178, 5], [5, 'Interstellar', 2014, 169, 6], [6, 'Portrait de la jeune fille en feu', 2019, 122, 7],
        [7, 'La Dolce Vita', 1960, 174, 8], [8, 'Les Dents de la mer', 1975, 124, 9], [9, 'Lady Bird', 2017, 94, 10],
        [10, 'Mon oncle', 1958, 116, 11], [11, 'Une affaire de famille', 2018, 121, 12], [12, 'Le Bon, la Brute et le Truand', 1966, 178, 13],
        [13, 'Lost in Translation', 2003, 102, 14], [14, 'Cléo de 5 à 7', 1962, 90, 1], [15, 'Mon voisin Totoro', 1988, 86, 3],
        [16, 'Rashomon', 1950, 88, 2], [17, 'Barbie', 2023, 114, 10], [18, 'Les Glaneurs et la Glaneuse', 2000, 82, 1],
        [19, 'Oppenheimer', 2023, 180, 6], [20, 'Memento', 2000, 113, 6]] }
    ],
    contraintes: [
      'Realisateur.codePays référence Pays.codePays',
      'Film.codeReal référence Realisateur.codeReal',
      'Tous les attributs sont obligatoires, sauf Realisateur.prénom',
      'Unicité de Pays.nomPays',
      'Film.durée est en minutes'
    ]
  }
};

const EXERCICES = [
  {
    id: 'cine-1', titre: 'Les films et leur année', niveau: 'facile', base: 'cinema', notions: ['SELECT', 'FROM'],
    enonce: "Afficher le titre et l'année de sortie de tous les films.",
    solution: 'SELECT titre, annéeSortie\nFROM Film',
    indice: "Après SELECT, les deux colonnes voulues séparées par une virgule ; après FROM, la table.",
    explication: "C'est une projection : on garde toutes les lignes de Film, mais seulement deux de ses colonnes."
  },
  {
    id: 'cine-2', titre: 'Les réalisateurs par ordre alphabétique', niveau: 'facile', base: 'cinema', notions: ['SELECT', 'ORDER BY'],
    enonce: "Afficher le nom et le prénom de tous les réalisateurs et réalisatrices, triés par nom (ordre alphabétique).",
    solution: 'SELECT nom, prénom\nFROM Realisateur\nORDER BY nom',
    indice: "ORDER BY se place à la fin de la requête ; l'ordre croissant (ASC) est celui par défaut.",
    explication: "JR n'a pas de prénom : la case affiche NULL, mais la ligne fait bien partie du résultat."
  },
  {
    id: 'cine-3', titre: 'Les années de sortie, sans doublon', niveau: 'facile', base: 'cinema', notions: ['DISTINCT', 'ORDER BY', 'DESC'],
    enonce: "Afficher les différentes années de sortie des films (chaque année une seule fois), de la plus récente à la plus ancienne.",
    solution: 'SELECT DISTINCT annéeSortie\nFROM Film\nORDER BY annéeSortie DESC',
    indice: "DISTINCT juste après SELECT supprime les doublons ; DESC après la colonne du tri inverse l'ordre.",
    explication: "Plusieurs films sont sortis la même année (2000, 2001, 2019, 2023) : sans DISTINCT, ces années apparaîtraient plusieurs fois."
  },
  {
    id: 'cine-4', titre: 'Les films de plus de 2 h 30', niveau: 'facile', base: 'cinema', notions: ['WHERE', '>'],
    enonce: "Afficher le titre et la durée des films qui durent strictement plus de 2 h 30 (la durée est en minutes).",
    solution: 'SELECT titre, durée\nFROM Film\nWHERE durée > 150',
    indice: "2 h 30, c'est 150 minutes. La condition se met dans WHERE, après FROM.",
    explication: "WHERE garde seulement les lignes pour lesquelles la condition est vraie : c'est une sélection."
  },
  {
    id: 'cine-5', titre: 'Les titres qui commencent par « Mon »', niveau: 'facile', base: 'cinema', notions: ['WHERE', 'LIKE'],
    enonce: "Afficher le titre des films dont le titre commence par « Mon ».",
    solution: "SELECT titre\nFROM Film\nWHERE titre LIKE 'Mon%'",
    indice: "LIKE compare à un motif : % remplace n'importe quelle suite de caractères. Le motif s'écrit entre apostrophes.",
    explication: "'Mon%' : « Mon » puis n'importe quoi. Avec '%Mon%', on aurait aussi obtenu Rashomon, qui contient « mon » sans commencer par ce mot."
  }
];

if (typeof module !== 'undefined' && module.exports) module.exports = { BASES, EXERCICES };
