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
- Fonctionne aussi hors ligne : ouvrir `index.html` dans un navigateur suffit (polices incluses dans `assets/fonts/`).
- La progression et le thème clair/sombre sont enregistrés dans le navigateur (`localStorage`), sur chaque appareil.

## Organisation

```
index.html            accueil général
<matière>/index.html  accueil d'une matière, avec une carte par chapitre
<matière>/*.html      un fichier par chapitre (application complète)
maths/app.js          code commun aux 5 pages de maths
assets/               styles (base.css + un fichier par matière), icône, polices
```

## Ajouter un chapitre

1. Déposer le fichier `.html` du chapitre dans le dossier de la matière.
2. Ajouter sa carte dans le `index.html` de la matière.
3. Dans le `index.html` racine, ajouter le chapitre à l'attribut `data-prog` de la carte de la matière et mettre à jour le nombre de chapitres.

Les polices sont sous licence SIL Open Font License 1.1 (voir `assets/fonts/OFL.txt`).
