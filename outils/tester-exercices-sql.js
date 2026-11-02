/* Vérifie le fichier de données du chapitre 1 bis (sql/exercices-requetes.js), lancé par la GitHub Action :
     node outils/tester-exercices-sql.js        (depuis la racine du site, sans navigateur)
   Pour chaque base : colonnes et lignes cohérentes, clés primaires uniques, clés étrangères qui
   référencent bien une ligne existante. Pour chaque exercice : champs remplis, identifiant unique,
   base existante, solution qui s'exécute avec le moteur du site et donne au moins une ligne. */
const path = require('path');
const RACINE = path.resolve(__dirname, '..');
const SQLE = require(path.join(RACINE, 'assets/sql-moteur.js'));
const { BASES, EXERCICES } = require(path.join(RACINE, 'sql/exercices-requetes.js'));

let echecs = 0;
const verifier = (nom, ok, detail) => {
  if (!ok) { console.log('  ✗ ' + nom + (detail ? ' : ' + detail : '')); echecs++; }
  return ok;
};

console.log('Bases');
for (const [id, b] of Object.entries(BASES)) {
  verifier(`${id} : nom`, typeof b.nom === 'string' && b.nom.trim());
  verifier(`${id} : liste de contraintes`, Array.isArray(b.contraintes));
  for (const t of b.tables) {
    const ou = `${id}.${t.name}`;
    verifier(`${ou} : clé primaire parmi les colonnes`, t.key.length && t.key.every(k => t.cols.includes(k)), t.key.join(', '));
    t.rows.forEach((r, i) => verifier(`${ou} : ligne ${i + 1} de ${t.cols.length} valeurs`, r.length === t.cols.length, JSON.stringify(r)));
    const cles = t.rows.map(r => JSON.stringify(t.key.map(k => r[t.cols.indexOf(k)])));
    verifier(`${ou} : clé primaire unique`, new Set(cles).size === cles.length);
    for (const [col, cible] of Object.entries(t.fk)) {
      const tc = b.tables.find(x => x.name === cible);
      if (!verifier(`${ou}.${col} : table référencée ${cible}`, tc && t.cols.includes(col) && tc.key.length === 1)) continue;
      const existantes = new Set(tc.rows.map(r => r[tc.cols.indexOf(tc.key[0])]));
      t.rows.forEach(r => {
        const v = r[t.cols.indexOf(col)];
        verifier(`${ou}.${col} = ${v} référence une ligne de ${cible}`, v === null || existantes.has(v));
      });
    }
  }
  console.log(`  ${id} (${b.nom}) : ${b.tables.length} tables`);
}

console.log('Exercices');
const vus = new Set();
for (const x of EXERCICES) {
  const nom = x.id || '(sans id)';
  verifier(`${nom} : identifiant sans espace`, /^[\w-]+$/.test(x.id || ''));
  verifier(`${nom} : identifiant unique`, !vus.has(x.id)); vus.add(x.id);
  for (const champ of ['titre', 'enonce', 'solution']) verifier(`${nom} : champ ${champ}`, typeof x[champ] === 'string' && x[champ].trim());
  verifier(`${nom} : niveau facile, moyen ou difficile`, ['facile', 'moyen', 'difficile'].includes(x.niveau), x.niveau);
  if (!verifier(`${nom} : base « ${x.base} » existante`, !!BASES[x.base])) continue;
  try {
    const r = SQLE.run(BASES[x.base], x.solution);
    verifier(`${nom} : la solution donne au moins une ligne`, r.rows.length > 0);
    console.log(`  ${nom} : ${r.rows.length} ligne${r.rows.length > 1 ? 's' : ''}${r.ordered ? ', ordonnées' : ''}`);
  } catch (e) {
    verifier(`${nom} : la solution s'exécute`, false, e.message);
  }
}

console.log(echecs ? `\n${echecs} problème${echecs > 1 ? 's' : ''}.` : `\nTout est bon : ${Object.keys(BASES).length} base${Object.keys(BASES).length > 1 ? 's' : ''}, ${EXERCICES.length} exercices.`);
process.exit(echecs ? 1 : 0);
