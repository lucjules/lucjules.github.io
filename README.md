# Cours et jeux

Mon site, en deux espaces choisis depuis l'accueil (`index.html`) :

- **Mes cours** (`cours.html`) : site de révision pour le BUT1 Informatique, avec leçons, exercices corrigés automatiquement et outils pour s'entraîner ;
- **Mes jeux** (`jeux.html`) : les jeux faits maison :
  - [Aérélia](https://lucjules.github.io/LunaPoke/), aventure rétro de capture de créatures, dans son propre dépôt (`LunaPoke`) ;
  - [Voie libre](https://lucjules.github.io/jeux/voie-libre/) 1.0, course en 3D (WebGL) à travers les quartiers d'une ville sur trois voies (course libre, Tour de la ville en 15 niveaux, Défi du jour, événements saisonniers), dans ce dépôt (`jeux/voie-libre/`) ; il s'installe aussi comme une appli à part (son propre manifeste et ses icônes dans `jeux/voie-libre/icones/`) ;
  - [Mine Clic](https://lucjules.github.io/jeux/mine-clic/), jeu de clic dans un monde de blocs : miner (combos, blocs brillants), acheter des machines (×1, ×10, ×100 ou Max) et des centaines d'améliorations, capacités à recharge, missions, coffres et creepers, événement de Noël, un boss par dimension, des familiers, collection de blocs à maîtriser, cycle jour et nuit, voyager de la surface jusqu'aux confins du monde, des progrès (dont des secrets), renaissances avec étoiles du Nether dont les paliers ne s'arrêtent jamais, boutique céleste sans fond, musique d'ambiance ; une partie complète se compte en centaines d'heures (voir `outils/simuler-mine-clic.js`). Dans ce dépôt (`jeux/mine-clic/`), installable lui aussi comme une appli à part.
  - [Filon Infini](https://lucjules.github.io/jeux/filon-infini/), jeu incrémental : un clicker, puis un arbre de compétences immense (un seul chemin, quelques voies annexes) à chacun des cinq paliers (Pièces, Renaissance, Ascension, Transcendance, Divinité), avec automatisations, nœuds « garder » et Apothéose finale, dans ce dépôt (`jeux/filon-infini/`, un seul fichier) ;

**En ligne :** https://lucjules.github.io/

## Cours

| Matière | Chapitres |
| --- | --- |
| [Algorithmique](algo/index.html) (ExAlgo · Java) | Cycle 1 (les bases), Cycle 2 (les boucles), Cycle 3 (les tableaux : cours, mémo Java du TP, ExosTP, entraînement chronométré, projet de gestion de notes, un outil « Vérifier mon projet » qui teste ton code phase par phase, et un outil « Comparer avec un code » qui montre les différences fonction par fonction ; le mémo propose le projet Java en 3 fichiers avec leurs tests JUnit) |
| [Système](systeme/index.html) (R1.04 · Linux) | **Intro système** (23 leçons alignées sur les TD 1 à 5 et l'aide-mémoire R1.04 : terminal et manuel, chemins, fichiers, jokers, archives, ssh et transferts, redirections et filtres, codage des caractères, utilisateurs, droits, chmod, umask, ACL, chiffrement, compilation, processus ; terminal simulé, 161 exercices, aide-mémoire, interro blanche, fiche recto verso imprimable pour le contrôle) ; **SAE 1.03** : guide complet pour installer la VM BUTGAMES (Debian ou Xubuntu, XFCE, Go, VS Code, comptes alice et bob), avec scripts, vérifications, rapport et soutenance |
| [Bases de données](sql/index.html) (R1.05 · SQL) | Modèle relationnel et requêtes simples, 1 bis : exercices de requêtes simples, ACSI : le modèle conceptuel des données (MCD) |
| [Management](management/index.html) (R1.08) | Introduction à la gestion, Stratégie |
| [Mathématiques](maths/index.html) (maths discrètes) | **Logique** (4 chapitres : propositions et quantificateurs, algèbre de Boole, implication et contraposée, circuits et additionneurs), **Arithmétique dans ℤ** (7 chapitres : division euclidienne, premiers, PGCD et PPCM, Euclide et Bézout, diophantien, congruences, restes chinois), **Récurrence et suites**, **Second degré**, **Révisions** (méthodes, TD de synthèse, sujet d'interro). Chaque chapitre : objectifs, leçon avec définitions, méthodes et démonstrations, démos interactives (crible, horloge, circuits, calculateurs), « À retenir », auto-test, exercices avec indice, méthode et correction détaillée |

## Fonctionnement

- Site 100 % statique : HTML, CSS et JavaScript, sans dépendance ni étape de compilation. Il est publié tel quel par GitHub Pages.
- **Installable et hors ligne** : sur téléphone ou ordinateur, le site peut s'installer comme une application (bouton « Installer l'app », ou sur iPhone : Partager → « Sur l'écran d'accueil »). Après la première visite, tous les cours restent disponibles sans connexion (`sw.js`).
- **Recherche** : l'accueil des cours cherche une notion dans tous les cours (sans tenir compte des accents) et mène directement à la bonne leçon.
- **Progression** : enregistrée dans le navigateur (`localStorage`), sur chaque appareil. Le panneau « Sauvegarder ou transférer ma progression » de l'accueil des cours permet de l'exporter (fichier ou code à copier) et de l'importer sur un autre appareil.
- **Reprendre** : l'accueil, l'accueil des cours et chaque page de matière propose de revenir directement à la dernière leçon ouverte.
- **Impression** : imprimer une leçon ou l'enregistrer en PDF donne une version propre, sur fond blanc, sans menus ni boutons, avec les corrigés et les fiches dépliés.
- Ouvrir `index.html` directement depuis le dossier fonctionne aussi (polices incluses dans `assets/fonts/`, jeu Mine Clic compris), sauf l'installation en application et le jeu Voie libre, dont les modules JavaScript demandent un serveur : en local, `python3 -m http.server` dans le dossier du site puis `http://localhost:8000/`.

## Organisation

```
index.html             accueil général : choix entre les cours et les jeux
cours.html             accueil des cours (recherche, sauvegarde de la progression)
jeux.html              accueil des jeux (partie en cours ou record de chaque jeu)
jeux/voie-libre/       jeu Voie libre 1.0 : index.html, style.css, et dans js/ des modules ES :
                       donnees.js (quartiers, personnages, planches, missions, niveaux, événements),
                       parcours.js et course.js (génération et simulation, sans affichage),
                       progression.js (sauvegarde, missions, trophées, boutique), rendu/ (3D avec Three.js),
                       audio.js (sons et musique synthétisés), interface.js, controles.js, main.js
jeux/voie-libre/lib/   Three.js (licence MIT), copié dans le dépôt pour fonctionner hors ligne
jeux/filon-infini/     jeu Filon Infini : un seul index.html (les arbres sont générés et calibrés par simulation)
jeux/mine-clic/        jeu Mine Clic : index.html, style.css, et dans js/ trois scripts classiques (sans module,
                       il s'ouvre donc aussi en double-cliquant) : donnees.js (blocs, dimensions, machines,
                       améliorations, progrès, pouvoirs, capacités, missions, dessins en pixels), textures.js (textures, icônes et cube 3D
                       dessinés par le code), jeu.js (moteur, interface, sons et musique synthétisés, sauvegarde) ;
                       polices/ (Pixelify Sans, licence SIL OFL 1.1) et icones/
<matière>/index.html   accueil d'une matière, avec une carte par chapitre
<matière>/*.html       un fichier par chapitre (application complète)
systeme/intro-systeme.html  cours Intro système : une coquille qui charge les scripts de systeme/intro/ (voir « Le cours Intro système »)
systeme/intro/         shell.js (terminal simulé), lecons.js (leçons), exercices.js (exercices, aide-mémoire, pièges), app.js (application)
systeme/sae-103.html   guide de la SAE 1.03 (une page-application : étapes, cases à cocher, scripts bash intégrés, générateur de rapport, minuteur) ; son style est dans assets/sae103.css
maths/*.html           une page par partie (logique, arithmetique, recurrence, second-degre, revision) : une coquille qui charge les scripts ci-dessous
maths/cours-*.js       le CONTENU des chapitres, un fichier par partie (voir « Ajouter ou modifier un chapitre de maths »)
maths/lib.js           outils d'écriture du cours : formules ($x^2$), boîtes (définition, théorème, méthode…), tableaux, « À toi », démos
maths/outils.js        calculateurs et démos interactives (table de vérité, additionneurs, crible, horloge, PGCD, congruences, second degré…)
maths/app.js           l'application : parcours, chapitres, auto-tests, exercices, QCM, cartes, mémo, notes (la progression est dans le navigateur)
sql/exercices-requetes.js   bases et exercices du chapitre 1 bis (voir « Ajouter un exercice SQL »)
assets/sql-moteur.js   moteur SQL commun aux pages de la matière Bases de données
assets/common.js       code commun à toutes les pages (thème, QCM, hors ligne)
assets/hub.js          pages d'accueil : thème, barres de progression, partie en cours, installation
assets/recherche*.js   recherche (recherche-index.js est généré)
assets/sauvegarde.js   export / import de la progression
assets/                styles (base.css + un fichier par matière), icônes, polices
sw.js, manifest.webmanifest   application installable et hors ligne
404.html               page « introuvable »
outils/construire.js   régénère l'index de recherche et la liste hors ligne
outils/tester-voie-libre.js   tests du jeu Voie libre (parcours franchissable, mécanismes, progression, rendu 3D)
outils/tester-exercices-sql.js  vérifie les bases et les exercices du chapitre 1 bis
outils/tester-systeme.js      vérifie le cours Intro système : chaque exercice (sa solution passe dans le terminal simulé), le terminal lui-même, chaque page dans un navigateur
outils/tester-maths.js        vérifie le cours de maths : chaque chapitre, démo et mini-exercice, formules, exercices, QCM et cartes
outils/filon-infini/         sources de Filon Infini : moteur, interface, générateur d'arbres calibré par simulation (gen.js) et build.js
outils/tester-mine-clic.js    tests du jeu Mine Clic (clics, achats, Max, capacités, missions, coffres, dimensions, renaissance, pouvoirs, sauvegarde, téléphone)
outils/simuler-mine-clic.js   simulateur d'économie de Mine Clic : mesure la durée d'une partie complète d'un joueur « glouton » (et compare deux versions du jeu)
.github/workflows/     lance outils/construire.js automatiquement sur GitHub
```

## Ajouter un chapitre

1. Déposer le fichier `.html` du chapitre dans le dossier de la matière.
2. Ajouter sa carte dans le `index.html` de la matière.
3. Dans `cours.html`, ajouter le chapitre à l'attribut `data-prog` de la carte de la matière et mettre à jour le nombre de chapitres.
4. C'est tout : à chaque modification de `main`, une GitHub Action (`.github/workflows/construire.yml`) régénère l'index de recherche et la liste hors ligne, puis enregistre le résultat. Elle lance aussi les tests des jeux Voie libre et Mine Clic (`outils/tester-voie-libre.js`, `outils/tester-mine-clic.js`), la vérification du cours de maths (`outils/tester-maths.js`) et celle du cours Intro système (`outils/tester-systeme.js`), sur `main` comme sur chaque demande de fusion. L'onglet **Actions** du dépôt montre son déroulement.

## Ajouter ou modifier un chapitre de maths

Le contenu des maths est dans `maths/cours-<partie>.js` (logique, arith, recurrence, second, revision) ; les pages et l'application n'ont pas à être touchées. Un chapitre est un objet de la liste `chapitres` :

```js
{ id: 'a8', court: 'Titre court', titre: 'Titre complet', duree: '1 h', resume: 'Une phrase pour le parcours.',
  intro: 'Accroche.', objectifs: ['…'], prerequis: ['…'],
  sections: [ { t: 'Titre de la partie', h: `…HTML…` } ],      // le cours
  retenir: ['…'], pieges: [['Titre', 'Texte']],               // « À retenir » et pièges
  quiz: [ Q('Question ?', ['bonne réponse', 'faux', 'faux', 'faux'], 'Explication') ],   // la bonne réponse est la 1re
  cartes: [ C('Recto', 'Verso') ],
  exos: [ X('Exercice 1', { id: 'a8-1', niv: 1, src: 'TD', q: `énoncé`, indice: '…', meth: '…', s: `correction` }) ] }
```

Dans le texte : `$x^2 + 1$` (formule dans une phrase), `$$ … $$` (formule en bloc, `;; commentaire` en fin de ligne), `frac{a}{b}`, `sqrt{n}`, `x_{n+1}`, `\\{ \\}` pour des accolades ; boîtes `bDef`, `bProp`, `bThm`, `bMeth`, `bEx`, `bRem`, `bTrap`, `bAlgo`, `bProof` ; tableaux `tt(...)`, étapes `steps([...])`, systèmes `sys([...])` ; mini-exercice vérifié sur place `quick('Question', 'réponse', 'explication')` ; outil intégré `demo('pgcd', { pgA: '8820', pgB: '3150' })` (outils : `tv`, `adder`, `demi`, `complet`, `circf`, `div`, `fact`, `sieve`, `pgcd`, `dio`, `clock`, `cong`, `quad`, `timer`). Les détails sont en tête de `maths/lib.js`.

Pour ajouter un chapitre à une page existante, l'ajouter à la liste `chapitres` du bon fichier, puis mettre à jour la carte de la partie dans `maths/index.html` (liste des chapitres). `node outils/tester-maths.js` vérifie le résultat ; la GitHub Action régénère la recherche et la liste hors ligne.

## Le cours Intro système

Le terminal simulé (`systeme/intro/shell.js`) est un petit Linux en mémoire : système de fichiers, utilisateurs (etudiant, alice, bob, root) et groupes, droits rwx, umask, ACL, tubes et redirections, variables, jokers, filtres, tar et gzip, od et iconv, javac/java/g++, tâches de fond. Il marche dans le navigateur et dans Node.

- Une leçon est un objet de la liste `LESSONS` (`systeme/intro/lecons.js`) : `id`, `part` (la partie, liée à un TD), `title`, `skill`, `lead`, `obj` (objectifs), `body` (le HTML), `retenir`, `ex` (identifiants d'exercices). Dans `body`, ``ex(`commande\nautre commande`, { seed, cwd })`` affiche un exemple **réellement exécuté** dans un terminal neuf, avec un bouton « Essayer ici » ; `sh()` affiche un exemple statique (réseau, chiffrement).
- Les exercices sont dans `EX` (`systeme/intro/exercices.js`) : `Q(...)` (QCM, bonne réponse en premier), `T({...})` (à taper dans un terminal, avec `solution` et `check`), `W({...})` (une commande à écrire, vérifiée en l'exécutant ou par motif), `D(type)` (série sans fin). L'aide-mémoire (`MEMO`) suit l'ordre de l'aide-mémoire R1.04.
- La fiche recto verso du contrôle (onglet « Fiche recto verso ») est dans `systeme/intro/fiche.js` : `F(commande, syntaxe, [[option, effet]…], effet sans option, exemple)` donne une ligne « cmd [-o : effet, …] : effet sans option ». Elle s'imprime en A4 sur 3 colonnes ; le test vérifie qu'elle tient sur 2 pages de 6 à 8 pt.
- `node outils/tester-systeme.js` vérifie que chaque solution passe sa vérification, que le terminal se comporte comme prévu et que chaque page s'affiche sans erreur.

## Ajouter un exercice SQL

Les exercices du chapitre 1 bis (`sql/exercices-requetes.html`) sont tous dans `sql/exercices-requetes.js` : ajouter un bloc dans `EXERCICES` (identifiant, titre, niveau, base, énoncé, requête solution, indice) suffit. L'exercice apparaît dans le sommaire, sur l'accueil du chapitre, dans la progression, la recherche et le mode hors ligne, avec le modèle de sa base. Une nouvelle base s'ajoute de la même façon dans `BASES`. La GitHub Action vérifie le fichier (`outils/tester-exercices-sql.js`) : base existante, clés cohérentes, solution qui s'exécute.

## Ajouter un jeu

Deux possibilités :

- **Dans ce dépôt**, dans un dossier `jeux/<nom>/` (comme Voie libre et Mine Clic) : il est publié avec le site et fonctionne hors ligne sans rien faire de plus, puisque `outils/construire.js` ajoute ses fichiers à la liste hors ligne. Sa page enregistre le service worker du site (`../../sw.js`).
- **Dans un dépôt à part** publié par GitHub Pages (comme Aérélia, à l'adresse `https://lucjules.github.io/<dépôt>/`) : il gère alors son propre mode hors ligne, et le service worker du site laisse ses adresses de côté.

Dans les deux cas, ajouter sa carte dans `jeux.html` et son nom dans les étiquettes de la carte « Mes jeux » de `index.html`. Pour afficher sa progression sur ces cartes (`<p class="hprog" data-jeu="<nom>">`), ajouter une fonction dans `JEUX` (`assets/hub.js`) qui lit sa sauvegarde.

## Régénérer à la main

Pour régénérer l'index et la liste hors ligne à la main (Node.js nécessaire) :

```
cd outils && npm install && npx playwright install chromium   # la première fois
cd .. && node outils/construire.js
```

Les polices sont sous licence SIL Open Font License 1.1 (voir `assets/fonts/OFL.txt`).
