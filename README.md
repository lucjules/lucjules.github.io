# Mes cours IUT

Site de révision pour le BUT1 Informatique : leçons, exercices corrigés automatiquement et outils pour s'entraîner.

**En ligne :** https://lucjules.github.io/

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
- **Recherche** : la page d'accueil cherche une notion dans tous les cours (sans tenir compte des accents) et mène directement à la bonne leçon.
- **Progression** : enregistrée dans le navigateur (`localStorage`), sur chaque appareil. Le panneau « Sauvegarder ou transférer ma progression » de l'accueil permet de l'exporter (fichier ou code à copier) et de l'importer sur un autre appareil.
- Ouvrir `index.html` directement depuis le dossier fonctionne aussi (polices incluses dans `assets/fonts/`), sauf l'installation en application.

## Organisation

```
index.html             accueil général (recherche, sauvegarde de la progression)
<matière>/index.html   accueil d'une matière, avec une carte par chapitre
<matière>/*.html       un fichier par chapitre (application complète)
maths/app.js           code commun aux 5 pages de maths
assets/common.js       code commun à toutes les pages (thème, QCM, hors ligne)
assets/hub.js          pages d'accueil : thème, barres de progression, installation
assets/recherche*.js   recherche (recherche-index.js est généré)
assets/sauvegarde.js   export / import de la progression
assets/                styles (base.css + un fichier par matière), icônes, polices
sw.js, manifest.webmanifest   application installable et hors ligne
404.html               page « introuvable »
outils/construire.js   régénère l'index de recherche et la liste hors ligne
```

## Ajouter un chapitre

1. Déposer le fichier `.html` du chapitre dans le dossier de la matière.
2. Ajouter sa carte dans le `index.html` de la matière.
3. Dans le `index.html` racine, ajouter le chapitre à l'attribut `data-prog` de la carte de la matière et mettre à jour le nombre de chapitres.
4. Régénérer l'index de recherche et la liste hors ligne (Node.js nécessaire) :

   ```
   cd outils && npm install && npx playwright install chromium   # la première fois
   cd .. && node outils/construire.js
   ```

   Sans cette étape, le nouveau chapitre fonctionne quand même en ligne (et hors ligne une fois visité), mais la recherche ne le trouve pas encore.

Les polices sont sous licence SIL Open Font License 1.1 (voir `assets/fonts/OFL.txt`).
