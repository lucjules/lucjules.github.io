# Cours et jeux

Mon site, en deux espaces choisis depuis l'accueil (`index.html`) :

- **Mes cours** (`cours.html`) : site de révision pour le BUT1 Informatique, avec leçons, exercices corrigés automatiquement et outils pour s'entraîner ;
- **Mes jeux** (`jeux.html`) : les jeux faits maison :
  - [Aérélia](https://lucjules.github.io/LunaPoke/), aventure rétro de capture de créatures, dans son propre dépôt (`LunaPoke`) ;
  - [Voie libre](https://lucjules.github.io/jeux/voie-libre/), course à travers les quartiers d'une ville sur trois voies (course libre, Tour de la ville en 15 niveaux, Défi du jour, événements saisonniers), dans ce dépôt (`jeux/voie-libre/`) ; il s'installe aussi comme une appli à part (son propre manifeste et ses icônes dans `jeux/voie-libre/icones/`).

**En ligne :** https://lucjules.github.io/

## Cours

| Matière | Chapitres |
| --- | --- |
| [Algorithmique](algo/index.html) (ExAlgo · Java) | Cycle 1, Cycle 2 |
| [Système](systeme/index.html) (Linux) | Le terminal et les permissions |
| [Bases de données](sql/index.html) (R1.05 · SQL) | Modèle relationnel et requêtes simples |
| [Management](management/index.html) (R1.08) | Introduction à la gestion, Stratégie |
| [Mathématiques](maths/index.html) (maths discrètes) | Logique, Arithmétique dans ℤ, Récurrence, Second degré, Révision générale |

## Fonctionnement

- Site 100 % statique : HTML, CSS et JavaScript, sans dépendance ni étape de compilation. Il est publié tel quel par GitHub Pages.
- **Installable et hors ligne** : sur téléphone ou ordinateur, le site peut s'installer comme une application (bouton « Installer l'app », ou sur iPhone : Partager → « Sur l'écran d'accueil »). Après la première visite, tous les cours restent disponibles sans connexion (`sw.js`).
- **Recherche** : l'accueil des cours cherche une notion dans tous les cours (sans tenir compte des accents) et mène directement à la bonne leçon.
- **Progression** : enregistrée dans le navigateur (`localStorage`), sur chaque appareil. Le panneau « Sauvegarder ou transférer ma progression » de l'accueil des cours permet de l'exporter (fichier ou code à copier) et de l'importer sur un autre appareil.
- **Reprendre** : l'accueil, l'accueil des cours et chaque page de matière propose de revenir directement à la dernière leçon ouverte.
- **Impression** : imprimer une leçon ou l'enregistrer en PDF donne une version propre, sur fond blanc, sans menus ni boutons, avec les corrigés et les fiches dépliés.
- Ouvrir `index.html` directement depuis le dossier fonctionne aussi (polices incluses dans `assets/fonts/`), sauf l'installation en application.

## Organisation

```
index.html             accueil général : choix entre les cours et les jeux
cours.html             accueil des cours (recherche, sauvegarde de la progression)
jeux.html              accueil des jeux (partie en cours ou record de chaque jeu)
jeux/voie-libre/       jeu Voie libre : index.html, style.css, donnees.js (quartiers, personnages, planches,
                       missions, niveaux), jeu.js (moteur : rendu 3D sur canvas, sons et musique synthétisés)
<matière>/index.html   accueil d'une matière, avec une carte par chapitre
<matière>/*.html       un fichier par chapitre (application complète)
maths/app.js           code commun aux 5 pages de maths
assets/common.js       code commun à toutes les pages (thème, QCM, hors ligne)
assets/hub.js          pages d'accueil : thème, barres de progression, partie en cours, installation
assets/recherche*.js   recherche (recherche-index.js est généré)
assets/sauvegarde.js   export / import de la progression
assets/                styles (base.css + un fichier par matière), icônes, polices
sw.js, manifest.webmanifest   application installable et hors ligne
404.html               page « introuvable »
outils/construire.js   régénère l'index de recherche et la liste hors ligne
outils/tester-voie-libre.js   tests du jeu Voie libre (parcours franchissable, mécanismes, sauvegardes)
.github/workflows/     lance outils/construire.js automatiquement sur GitHub
```

## Ajouter un chapitre

1. Déposer le fichier `.html` du chapitre dans le dossier de la matière.
2. Ajouter sa carte dans le `index.html` de la matière.
3. Dans `cours.html`, ajouter le chapitre à l'attribut `data-prog` de la carte de la matière et mettre à jour le nombre de chapitres.
4. C'est tout : à chaque modification de `main`, une GitHub Action (`.github/workflows/construire.yml`) régénère l'index de recherche et la liste hors ligne, puis enregistre le résultat. Elle lance aussi les tests du jeu Voie libre (`outils/tester-voie-libre.js`), sur `main` comme sur chaque demande de fusion. L'onglet **Actions** du dépôt montre son déroulement.

## Ajouter un jeu

Deux possibilités :

- **Dans ce dépôt**, dans un dossier `jeux/<nom>/` (comme Voie libre) : il est publié avec le site et fonctionne hors ligne sans rien faire de plus, puisque `outils/construire.js` ajoute ses fichiers à la liste hors ligne. Sa page enregistre le service worker du site (`../../sw.js`).
- **Dans un dépôt à part** publié par GitHub Pages (comme Aérélia, à l'adresse `https://lucjules.github.io/<dépôt>/`) : il gère alors son propre mode hors ligne, et le service worker du site laisse ses adresses de côté.

Dans les deux cas, ajouter sa carte dans `jeux.html` et son nom dans les étiquettes de la carte « Mes jeux » de `index.html`. Pour afficher sa progression sur ces cartes (`<p class="hprog" data-jeu="<nom>">`), ajouter une fonction dans `JEUX` (`assets/hub.js`) qui lit sa sauvegarde.

## Régénérer à la main

Pour régénérer l'index et la liste hors ligne à la main (Node.js nécessaire) :

```
cd outils && npm install && npx playwright install chromium   # la première fois
cd .. && node outils/construire.js
```

Les polices sont sous licence SIL Open Font License 1.1 (voir `assets/fonts/OFL.txt`).
