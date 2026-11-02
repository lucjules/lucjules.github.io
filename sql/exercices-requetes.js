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
  },
  club: {
    nom: 'Club de sport',
    description: "Les adhérents d'un club, les activités proposées, leurs coachs et les inscriptions.",
    tables: [
      { name: 'Coach', cols: ['numCoach', 'nom', 'prénom'], key: ['numCoach'], fk: {}, rows: [
        [1, 'Martin', 'Léa'], [2, 'Diallo', 'Moussa'], [3, 'Nguyen', 'Linh'], [4, 'Rossi', 'Marco']] },
      { name: 'Activite', cols: ['codeAct', 'libellé', 'jour', 'heure', 'tarif', 'numCoach'], key: ['codeAct'], fk: { numCoach: 'Coach' }, rows: [
        ['YOG', 'Yoga', 'lundi', '18:30', 120, 1], ['ESC', 'Escalade', 'mercredi', '17:00', 180, 2], ['NAT', 'Natation', 'mardi', '12:15', 150, 3],
        ['BOX', 'Boxe', 'jeudi', '19:00', 200, 4], ['DAN', 'Danse', 'samedi', '10:00', 90, 1], ['TEN', 'Tennis', 'vendredi', '18:00', 220, 4],
        ['PIL', 'Pilates', 'mardi', '18:30', 110, 3], ['BAD', 'Badminton', 'mercredi', '20:00', 100, 2], ['RUN', 'Course à pied', 'dimanche', '09:00', 60, 2],
        ['AQU', 'Aquagym', 'jeudi', '12:15', 130, 3]] },
      { name: 'Adherent', cols: ['numAdh', 'nom', 'prénom', 'dateNaissance', 'ville', 'email'], key: ['numAdh'], fk: {}, rows: [
        [1, 'Martin', 'Chloé', '2001-03-14', 'Bordeaux', 'chloe.martin@mail.fr'], [2, 'Durand', 'Luc', '1996-07-02', 'Pessac', null],
        [3, 'Bernard', 'Zoé', '1988-11-23', 'Bordeaux', 'zoe.b@mail.fr'], [4, 'Petit', 'Hugo', '2008-05-30', 'Talence', null],
        [5, 'Lefèvre', 'Inès', '2005-09-01', 'Mérignac', 'ines.lefevre@mail.fr'], [6, 'Moreau', 'Lucas', '1979-02-17', 'Bordeaux', 'lucas.moreau@mail.fr'],
        [7, 'Garcia', 'Emma', '1999-12-08', 'Pessac', 'emma.garcia@mail.fr'], [8, 'Roux', 'Nathan', '2003-06-21', 'Talence', null],
        [9, 'Fournier', 'Léa', '1992-04-30', 'Bègles', 'lea.f@mail.fr'], [10, 'Girard', 'Adam', '2010-01-15', 'Bordeaux', null],
        [11, 'Mercier', 'Jade', '1985-08-09', 'Mérignac', 'jade.mercier@mail.fr'], [12, 'Blanc', 'Louis', '1968-10-03', 'Bordeaux', 'louis.blanc@mail.fr'],
        [13, 'Faure', 'Manon', '2002-02-28', 'Talence', 'manon.faure@mail.fr'], [14, 'Martin', 'Paul', '1990-07-19', 'Pessac', null],
        [15, 'Lambert', 'Sarah', '1997-05-11', 'Bordeaux', 'sarah.l@mail.fr']] },
      { name: 'Inscription', cols: ['numAdh', 'codeAct', 'dateInscription'], key: ['numAdh', 'codeAct'], fk: { numAdh: 'Adherent', codeAct: 'Activite' }, rows: [
        [1, 'YOG', '2025-09-03'], [1, 'DAN', '2025-09-03'], [2, 'ESC', '2025-09-10'], [2, 'BAD', '2025-09-10'], [3, 'NAT', '2025-09-05'],
        [3, 'PIL', '2025-10-01'], [4, 'BOX', '2025-09-12'], [4, 'BAD', '2025-09-12'], [5, 'DAN', '2025-09-08'], [5, 'YOG', '2025-11-04'],
        [6, 'TEN', '2025-09-15'], [6, 'RUN', '2025-09-15'], [7, 'ESC', '2025-09-20'], [7, 'YOG', '2025-09-20'], [8, 'BOX', '2025-10-02'],
        [9, 'NAT', '2025-09-06'], [9, 'AQU', '2026-01-08'], [10, 'ESC', '2025-09-03'], [11, 'PIL', '2025-09-09'], [11, 'YOG', '2025-09-09'],
        [13, 'DAN', '2025-10-15'], [13, 'RUN', '2025-10-15'], [15, 'BAD', '2025-09-22'], [15, 'TEN', '2026-01-12']] }
    ],
    contraintes: [
      'Activite.numCoach référence Coach.numCoach',
      'Inscription.numAdh référence Adherent.numAdh',
      'Inscription.codeAct référence Activite.codeAct',
      'Tous les attributs sont obligatoires, sauf Adherent.email',
      'Unicité de Adherent.email',
      'Activite.tarif est en euros, pour l\'année ; les dates s\'écrivent \'AAAA-MM-JJ\''
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
  },
  /* ------------------------------------------------------------ faciles (suite) */
  {
    id: 'cine-6', titre: 'Les films sortis avant 1960', niveau: 'facile', base: 'cinema', notions: ['WHERE', '<'],
    enonce: "Afficher le titre et l'année de sortie des films sortis avant 1960 (1960 exclu).",
    solution: 'SELECT titre, annéeSortie\nFROM Film\nWHERE annéeSortie < 1960',
    indice: "« Avant 1960, 1960 exclu » : l'opérateur strictement inférieur.",
    explication: "Avec <=, un film de 1960 (La Dolce Vita) serait aussi apparu."
  },
  {
    id: 'club-1', titre: 'Toute la table Coach', niveau: 'facile', base: 'club', notions: ['SELECT *'],
    enonce: "Afficher toutes les colonnes et toutes les lignes de la table Coach.",
    solution: 'SELECT *\nFROM Coach',
    indice: "L'étoile * remplace la liste de toutes les colonnes.",
    explication: "SELECT * est pratique pour découvrir une table, mais dans une vraie requête on préfère nommer les colonnes utiles."
  },
  {
    id: 'club-2', titre: 'Les activités, de la moins chère à la plus chère', niveau: 'facile', base: 'club', notions: ['SELECT', 'ORDER BY'],
    enonce: "Afficher le libellé et le tarif de chaque activité, de la moins chère à la plus chère.",
    solution: 'SELECT libellé, tarif\nFROM Activite\nORDER BY tarif',
    indice: "ORDER BY trie par ordre croissant par défaut.",
    explication: "ORDER BY tarif ASC donne le même résultat : ASC est la valeur par défaut."
  },
  {
    id: 'club-3', titre: 'Les villes des adhérents', niveau: 'facile', base: 'club', notions: ['DISTINCT', 'ORDER BY'],
    enonce: "Afficher les villes où habitent les adhérents, chacune une seule fois, par ordre alphabétique.",
    solution: 'SELECT DISTINCT ville\nFROM Adherent\nORDER BY ville',
    indice: "Plusieurs adhérents habitent la même ville : il faut supprimer les doublons.",
    explication: "15 adhérents, mais seulement 5 villes différentes grâce à DISTINCT."
  },
  {
    id: 'club-4', titre: 'Les adhérents de Pessac', niveau: 'facile', base: 'club', notions: ['WHERE', '='],
    enonce: "Afficher le nom et le prénom des adhérents qui habitent à Pessac.",
    solution: "SELECT nom, prénom\nFROM Adherent\nWHERE ville = 'Pessac'",
    indice: "Une chaîne de caractères s'écrit entre apostrophes : 'Pessac'.",
    explication: "Sans les apostrophes, Pessac serait pris pour un nom de colonne, et la requête échouerait."
  },
  /* ------------------------------------------------------------ moyens */
  {
    id: 'cine-m1', titre: 'Les films des années 2000', niveau: 'moyen', base: 'cinema', notions: ['WHERE', 'AND', 'ORDER BY'],
    enonce: "Afficher le titre et l'année des films sortis de 2000 à 2010 (bornes incluses), du plus ancien au plus récent, puis par titre pour une même année.",
    solution: 'SELECT titre, annéeSortie\nFROM Film\nWHERE annéeSortie >= 2000 AND annéeSortie <= 2010\nORDER BY annéeSortie, titre',
    indice: "Deux conditions reliées par AND ; deux colonnes dans ORDER BY, séparées par une virgule.",
    explication: "Le second critère de tri (titre) ne sert que pour départager les films de la même année."
  },
  {
    id: 'cine-m2', titre: 'Entre 1 h 30 et 2 h', niveau: 'moyen', base: 'cinema', notions: ['WHERE', 'AND', 'ORDER BY'],
    enonce: "Afficher le titre et la durée des films qui durent de 1 h 30 à 2 h (bornes incluses), du plus court au plus long.",
    solution: 'SELECT titre, durée\nFROM Film\nWHERE durée >= 90 AND durée <= 120\nORDER BY durée',
    indice: "Convertis d'abord en minutes : 1 h 30 = 90 et 2 h = 120. Bornes incluses : >= et <=.",
    explication: "Cléo de 5 à 7 dure exactement 90 minutes : avec > au lieu de >=, il disparaîtrait."
  },
  {
    id: 'cine-m3', titre: 'Sans prénom', niveau: 'moyen', base: 'cinema', notions: ['WHERE', 'IS NULL'],
    enonce: "Afficher le nom des réalisateurs dont le prénom n'est pas renseigné.",
    solution: 'SELECT nom\nFROM Realisateur\nWHERE prénom IS NULL',
    indice: "Une valeur non renseignée ne se compare pas avec = : il existe un test spécial.",
    explication: "prénom = NULL ne renvoie jamais aucune ligne : on écrit IS NULL."
  },
  {
    id: 'cine-m4', titre: 'Un « a » en deuxième lettre', niveau: 'moyen', base: 'cinema', notions: ['LIKE', '_'],
    enonce: "Afficher le titre des films dont la deuxième lettre du titre est un « a ».",
    solution: "SELECT titre\nFROM Film\nWHERE titre LIKE '_a%'",
    indice: "Dans un motif LIKE, _ remplace exactement un caractère, % n'importe quelle suite.",
    explication: "'_a%' : un caractère quelconque, puis « a », puis n'importe quoi."
  },
  {
    id: 'cine-m5', titre: 'Les très longs films, en heures', niveau: 'moyen', base: 'cinema', notions: ['calcul', 'WHERE', 'ORDER BY DESC'],
    enonce: "Pour les films de plus de 170 minutes (strictement), afficher le titre et la durée en heures pleines (la durée divisée par 60, division entière), du plus long au plus court, puis par titre.",
    solution: 'SELECT titre, durée / 60\nFROM Film\nWHERE durée > 170\nORDER BY durée DESC, titre',
    indice: "On peut calculer dans SELECT : durée / 60. Le tri se fait sur la durée en minutes.",
    explication: "Entre deux entiers, / est une division entière : 207 / 60 vaut 3. Trier sur durée (et non sur durée / 60) garde l'ordre exact des films."
  },
  {
    id: 'club-m1', titre: 'Bordeaux ou Talence', niveau: 'moyen', base: 'club', notions: ['WHERE', 'OR', 'ORDER BY'],
    enonce: "Afficher le nom, le prénom et la ville des adhérents qui habitent à Bordeaux ou à Talence, triés par nom puis par prénom.",
    solution: "SELECT nom, prénom, ville\nFROM Adherent\nWHERE ville = 'Bordeaux' OR ville = 'Talence'\nORDER BY nom, prénom",
    indice: "Une même colonne comparée à deux valeurs : deux conditions complètes reliées par OR.",
    explication: "ville = 'Bordeaux' OR 'Talence' ne fonctionne pas : il faut répéter « ville = » des deux côtés."
  },
  {
    id: 'club-m2', titre: 'Sans adresse e-mail', niveau: 'moyen', base: 'club', notions: ['WHERE', 'IS NULL'],
    enonce: "Afficher le nom et le prénom des adhérents qui n'ont pas donné d'adresse e-mail.",
    solution: 'SELECT nom, prénom\nFROM Adherent\nWHERE email IS NULL',
    indice: "Le modèle dit que l'e-mail est le seul attribut facultatif : il peut être NULL.",
    explication: "Comme pour le prénom au cinéma : IS NULL, jamais = NULL."
  },
  {
    id: 'club-m3', titre: 'Mardi ou jeudi, moins de 140 €', niveau: 'moyen', base: 'club', notions: ['AND', 'OR', 'parenthèses'],
    enonce: "Afficher le libellé, le jour et le tarif des activités du mardi ou du jeudi qui coûtent moins de 140 € par an.",
    solution: "SELECT libellé, jour, tarif\nFROM Activite\nWHERE (jour = 'mardi' OR jour = 'jeudi') AND tarif < 140",
    indice: "AND est prioritaire sur OR : mets des parenthèses autour du choix du jour.",
    explication: "Sans parenthèses, jour = 'mardi' OR (jour = 'jeudi' AND tarif < 140) : la Natation du mardi (150 €) apparaîtrait à tort."
  },
  {
    id: 'club-m4', titre: 'Nés en 2000 ou après', niveau: 'moyen', base: 'club', notions: ['WHERE', 'date', 'ORDER BY DESC'],
    enonce: "Afficher le nom, le prénom et la date de naissance des adhérents nés en 2000 ou après, du plus jeune au plus âgé.",
    solution: "SELECT nom, prénom, dateNaissance\nFROM Adherent\nWHERE dateNaissance >= '2000-01-01'\nORDER BY dateNaissance DESC",
    indice: "Une date s'écrit entre apostrophes, au format 'AAAA-MM-JJ'. Le plus jeune est né le plus tard.",
    explication: "Né en 2000 ou après : à partir du 1er janvier 2000. Le plus jeune a la date de naissance la plus récente, d'où DESC."
  },
  {
    id: 'club-m5', titre: 'Bordelais dont le nom ne commence pas par M', niveau: 'moyen', base: 'club', notions: ['NOT LIKE', 'AND'],
    enonce: "Afficher le nom et le prénom des adhérents qui habitent à Bordeaux et dont le nom ne commence pas par « M ».",
    solution: "SELECT nom, prénom\nFROM Adherent\nWHERE ville = 'Bordeaux' AND nom NOT LIKE 'M%'",
    indice: "NOT LIKE garde les lignes qui ne correspondent pas au motif.",
    explication: "Martin Chloé et Moreau Lucas habitent Bordeaux, mais leur nom commence par M : ils sont exclus."
  },
  /* ------------------------------------------------------------ difficiles */
  {
    id: 'cine-d1', titre: 'Les films de Miyazaki', niveau: 'difficile', base: 'cinema', notions: ['INNER JOIN', 'WHERE', 'ORDER BY'],
    enonce: "Afficher le titre des films réalisés par Hayao Miyazaki, par ordre alphabétique.",
    solution: "SELECT titre\nFROM Film\n  INNER JOIN Realisateur ON Film.codeReal = Realisateur.codeReal\nWHERE nom = 'Miyazaki'\nORDER BY titre",
    indice: "Le nom du réalisateur est dans Realisateur, le titre dans Film : il faut une jointure sur codeReal.",
    explication: "On pourrait aussi écrire WHERE Film.codeReal = 3, mais cela suppose de connaître le code : la jointure part du nom, comme le demande l'énoncé."
  },
  {
    id: 'cine-d2', titre: 'Chaque film et son réalisateur', niveau: 'difficile', base: 'cinema', notions: ['INNER JOIN', 'ORDER BY'],
    enonce: "Afficher le titre de chaque film avec le nom de son réalisateur ou de sa réalisatrice, triés par nom, puis par titre.",
    solution: 'SELECT titre, nom\nFROM Film\n  INNER JOIN Realisateur ON Film.codeReal = Realisateur.codeReal\nORDER BY nom, titre',
    indice: "La condition de jointure relie la clé étrangère Film.codeReal à la clé primaire Realisateur.codeReal.",
    explication: "Chaque film a exactement un réalisateur (codeReal est obligatoire) : la jointure donne 20 lignes, une par film."
  },
  {
    id: 'cine-d3', titre: 'Les réalisateurs japonais', niveau: 'difficile', base: 'cinema', notions: ['INNER JOIN', 'WHERE'],
    enonce: "Afficher le nom et le prénom des réalisateurs dont le pays est le Japon, par ordre alphabétique de nom.",
    solution: "SELECT nom, prénom\nFROM Realisateur\n  INNER JOIN Pays ON Realisateur.codePays = Pays.codePays\nWHERE nomPays = 'Japon'\nORDER BY nom",
    indice: "Le nom du pays est dans la table Pays : relie Realisateur.codePays à Pays.codePays.",
    explication: "Grâce à l'unicité de Pays.nomPays, 'Japon' désigne un seul pays."
  },
  {
    id: 'cine-d4', titre: 'Films récents et leur pays', niveau: 'difficile', base: 'cinema', notions: ['2 jointures', 'WHERE', 'ORDER BY'],
    enonce: "Afficher le titre, l'année de sortie et le nom du pays du réalisateur des films sortis après 2015 (2015 exclu), triés par année puis par titre.",
    solution: 'SELECT titre, annéeSortie, nomPays\nFROM Film\n  INNER JOIN Realisateur ON Film.codeReal = Realisateur.codeReal\n  INNER JOIN Pays ON Realisateur.codePays = Pays.codePays\nWHERE annéeSortie > 2015\nORDER BY annéeSortie, titre',
    indice: "Film ne connaît pas le pays directement : on passe par Realisateur, puis par Pays (deux INNER JOIN à la suite).",
    explication: "Le chemin Film → Realisateur → Pays suit les clés étrangères du modèle."
  },
  {
    id: 'cine-d5', titre: 'Une apostrophe dans le titre', niveau: 'difficile', base: 'cinema', notions: ['LIKE', "''"],
    enonce: "Afficher le titre des films dont le titre contient une apostrophe (').",
    solution: "SELECT titre\nFROM Film\nWHERE titre LIKE '%''%'",
    indice: "Dans une chaîne SQL, une apostrophe s'écrit en la doublant : ''.",
    explication: "'%''%' : n'importe quoi, une apostrophe (écrite '' ), puis n'importe quoi. Avec une seule apostrophe, la chaîne se fermerait trop tôt."
  },
  {
    id: 'club-d1', titre: "Les inscrits à l'escalade", niveau: 'difficile', base: 'club', notions: ['2 jointures', 'WHERE', 'ORDER BY'],
    enonce: "Afficher le nom et le prénom des adhérents inscrits à l'activité « Escalade », par ordre alphabétique de nom.",
    solution: "SELECT nom, prénom\nFROM Inscription\n  INNER JOIN Adherent ON Inscription.numAdh = Adherent.numAdh\n  INNER JOIN Activite ON Inscription.codeAct = Activite.codeAct\nWHERE libellé = 'Escalade'\nORDER BY nom",
    indice: "Inscription relie un adhérent à une activité : elle a deux clés étrangères, donc deux jointures.",
    explication: "On aurait pu tester codeAct = 'ESC' sans joindre Activite, mais l'énoncé donne le libellé."
  },
  {
    id: 'club-d2', titre: 'Les activités de Moussa Diallo', niveau: 'difficile', base: 'club', notions: ['INNER JOIN', 'AND'],
    enonce: "Afficher le libellé et le jour des activités encadrées par le coach Moussa Diallo.",
    solution: "SELECT libellé, jour\nFROM Activite\n  INNER JOIN Coach ON Activite.numCoach = Coach.numCoach\nWHERE nom = 'Diallo' AND prénom = 'Moussa'",
    indice: "Relie Activite.numCoach à Coach.numCoach, puis filtre sur le nom et le prénom du coach.",
    explication: "Tester aussi le prénom évite de mélanger deux coachs qui porteraient le même nom."
  },
  {
    id: 'club-d3', titre: 'Les villes des sportifs du jeudi', niveau: 'difficile', base: 'club', notions: ['2 jointures', 'DISTINCT'],
    enonce: "Afficher les villes des adhérents inscrits à au moins une activité du jeudi, chaque ville une seule fois.",
    solution: "SELECT DISTINCT ville\nFROM Inscription\n  INNER JOIN Adherent ON Inscription.numAdh = Adherent.numAdh\n  INNER JOIN Activite ON Inscription.codeAct = Activite.codeAct\nWHERE jour = 'jeudi'",
    indice: "Pars des inscriptions, joins l'adhérent (pour la ville) et l'activité (pour le jour), puis supprime les doublons.",
    explication: "Deux adhérents de Talence font de la boxe le jeudi : sans DISTINCT, Talence apparaîtrait deux fois."
  },
  {
    id: 'club-d4', titre: 'Les inscriptions de 2026', niveau: 'difficile', base: 'club', notions: ['2 jointures', 'date', 'ORDER BY'],
    enonce: "Pour les inscriptions faites à partir du 1er janvier 2026, afficher le nom et le prénom de l'adhérent, le libellé de l'activité et la date d'inscription, de la plus ancienne à la plus récente.",
    solution: "SELECT nom, prénom, libellé, dateInscription\nFROM Inscription\n  INNER JOIN Adherent ON Inscription.numAdh = Adherent.numAdh\n  INNER JOIN Activite ON Inscription.codeAct = Activite.codeAct\nWHERE dateInscription >= '2026-01-01'\nORDER BY dateInscription",
    indice: "Les trois tables sont nécessaires : nom (Adherent), libellé (Activite), date (Inscription).",
    explication: "La date d'inscription est un attribut de l'inscription elle-même : elle dépend du couple (adhérent, activité)."
  },
  {
    id: 'club-d5', titre: 'Les coachs des activités chères', niveau: 'difficile', base: 'club', notions: ['INNER JOIN', 'DISTINCT', 'ORDER BY'],
    enonce: "Afficher le nom et le prénom des coachs qui encadrent au moins une activité de plus de 150 € (150 exclu), chacun une seule fois, par ordre alphabétique de nom.",
    solution: 'SELECT DISTINCT nom, prénom\nFROM Coach\n  INNER JOIN Activite ON Coach.numCoach = Activite.numCoach\nWHERE tarif > 150\nORDER BY nom',
    indice: "Marco Rossi encadre deux activités de plus de 150 € : pense aux doublons.",
    explication: "La jointure donne une ligne par activité ; DISTINCT ne garde qu'une ligne par coach."
  }
];

if (typeof module !== 'undefined' && module.exports) module.exports = { BASES, EXERCICES };
