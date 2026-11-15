/* Vérifie le cours Intro système (systeme/intro-systeme.html), lancé par la GitHub Action :
     node outils/tester-systeme.js        (depuis la racine du site ; Playwright et Chromium nécessaires)
   1. Sans navigateur, avec le vrai terminal simulé (systeme/intro/shell.js) :
      - chaque exercice « À toi de taper » : sa solution passe la vérification, et un terminal vide ne la passe pas ;
      - chaque « Écris la commande » : la solution donnée est acceptée ;
      - chaque QCM a au moins 3 choix distincts et une explication ; chaque leçon ne cite que des exercices qui existent ;
      - quelques comportements du terminal (tubes, redirections, jokers, droits, umask, ACL, archives, codage, javac).
   2. Dans Chromium : chaque page du cours s'affiche sans erreur JavaScript, chaque exemple exécuté
      ne contient pas de « command not found » inattendu, et la fiche recto verso tient sur 2 pages A4. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const RACINE = path.resolve(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, 'systeme/intro', f), 'utf8');

let echecs = 0;
const ko = msg => { echecs++; console.log('  ✗ ' + msg); };

/* ---------- 1. Contenu et terminal, sans navigateur ---------- */
const ctx = vm.createContext({ console });
vm.runInContext(lire('shell.js') + '\n' + lire('lecons.js') + '\n' + lire('exercices.js') + '\n;globalThis.R = { Sh, EX, LESSONS, PARTS, MEMO };', ctx);
const { Sh, EX, LESSONS, MEMO } = ctx.R;
const neuf = def => {
  const s = new Sh.Shell(def.seed || 'standard');
  (def.pre || []).forEach(p => s.run(p, { inner: true }));
  if (def.start || def.cwd) s.run('cd ' + (def.start || def.cwd), { inner: true });
  s.log = []; s.history = []; s.outLog = []; s.ranScript = new Set();
  return s;
};
let n = 0;
const ids = new Set();
LESSONS.forEach(l => {
  if (ids.has(l.id)) ko(`leçon ${l.id} en double`);
  ids.add(l.id);
  l.ex.forEach(id => { if (!EX[id]) ko(`${l.id} : exercice ${id} introuvable`); });
  ['title', 'skill', 'lead'].forEach(k => { if (!l[k]) ko(`${l.id} : ${k} manquant`); });
  if (!l.obj.length || !l.retenir.length) ko(`${l.id} : objectifs ou « à retenir » vides`);
});
const cites = new Set(LESSONS.flatMap(l => l.ex));
Object.entries(EX).forEach(([id, d]) => {
  n++;
  if (!cites.has(id)) ko(`${id} n'est cité par aucune leçon`);
  if (d.type === 'qcm') {
    if (d.choices.length < 3 || new Set(d.choices).size !== d.choices.length) ko(`${id} : choix insuffisants ou en double`);
    if (!d.why) ko(`${id} : explication manquante`);
  } else if (d.type === 'shell') {
    const s = neuf(d);
    if (d.check(s)[0]) ko(`${id} : réussi sans rien taper`);
    d.solution.forEach(cmd => { if (/^\^[CZ]$/.test(cmd)) s.key(cmd[1]); else s.run(cmd); });
    const [ok, msg] = d.check(s);
    if (!ok) ko(`${id} : la solution ne passe pas (${msg})`);
  } else if (d.type === 'cmd') {
    if (d.accept) { if (!d.accept.some(re => re.test(d.sol))) ko(`${id} : la solution n'est pas acceptée`); }
    else {
      const s = neuf(d), r = s.run(d.sol);
      if (r.err) ko(`${id} : la solution produit une erreur : ${r.err.trim()}`);
      if (d.test && !d.test(s, r)) ko(`${id} : la solution ne passe pas le test`);
      if (!d.test && !r.out.trim()) ko(`${id} : la solution n'affiche rien`);
    }
  } else if (d.type !== 'drill') ko(`${id} : type inconnu ${d.type}`);
});
MEMO.forEach(g => g.rows.forEach(r => { if (!LESSONS.some(l => l.id === r[3])) ko(`aide-mémoire : leçon ${r[3]} introuvable (${r[0]})`); }));

/* Comportements du terminal */
const T = (lignes, attendu, seed) => {
  const s = new Sh.Shell(seed || 'standard');
  let out = '';
  lignes.forEach(l => { const r = s.run(l); out = Sh.strip(r.out + r.err); });
  const ok = typeof attendu === 'function' ? attendu(out, s) : out === attendu;
  if (!ok) ko(`terminal : « ${lignes.join(' ; ')} » a donné ${JSON.stringify(out)}`);
};
T(['echo *.txt'], 'README.txt secret.txt\n');
T(['echo "*"'], '*\n');
T(['echo *.xyz'], '*.xyz\n');
T(['echo /usr/bin/[0-9]*'], '/usr/bin/2to3 /usr/bin/7z\n');
T(['echo /mnt/roost/users/?[a-e]*'], '/mnt/roost/users/cdubois /mnt/roost/users/mdurand /mnt/roost/users/wbernard /mnt/roost/users/xdupont\n');
T(['ls Documents | wc -l'], '4\n');
T(['ls > l.txt', 'grep -c l.txt l.txt'], '1\n');
T(['cut -d: -f3 Documents/etudiants.txt | sort | uniq -c'], '      4 G1\n      3 G2\n      3 G3\n');
T(['sort -t: -k4 -n -r Documents/etudiants.txt | head -n 1'], 'Dubois:Ines:G1:18\n');
T(['false && echo a || echo b'], 'b\n');
T(['umask 037', 'touch f', 'ls -l f'], o => o.startsWith('-rw-r----- '));
T(['umask 022', 'mkdir d', 'ls -ld d'], o => o.startsWith('drwxr-xr-x '));
T(['chmod 600 secret.txt', 'su bob', 'cat /home/etudiant/secret.txt'], o => o.includes('Permission denied'));
T(['chmod a+x script.sh', './script.sh'], 'Le script a bien été exécuté\n');
T(['./script.sh'], o => o.includes('Permission denied'));
T(['setfacl -m u:alice:rw,m::r Documents/notes.txt', 'getfacl Documents/notes.txt'], o => o.includes('user:alice:rw-\t#effective:r--') && o.includes('mask::r--'));
T(['tar -czf a.tgz M1101', 'rm -r M1101', 'tar -xzf a.tgz', 'cat M1101/td1.txt'], o => o.startsWith('TD 1'));
T(['gzip Documents/notes.txt', 'zcat Documents/notes.txt.gz'], "Cours d'intro système\nCommandes de base et permissions\n");
T(['od -t x1 Codage/utf8.txt'], o => o.startsWith('0000000 c3 a9 74'));
T(['iconv -f ISO-8859-1 -t UTF-8 Codage/utf8.txt'], 'Ã©tÃ© Ã\u00a0 NoÃ«l\n');
T(['cd Projets/tp1', 'javac Bonjour.java', 'java Bonjour'], o => o.startsWith('Bonjour depuis Java'));
T(['cd Projets/tp1', 'javac Erreur.java 2> e.txt', 'cat e.txt'], o => o.includes("Erreur.java:3: error: ';' expected"));
T(['rm -r /tmp/../home/etudiant/Documents', 'ls'], o => !o.includes('Documents'));
T(['sleep 50 &', 'jobs'], '[1]+  Running                 sleep 50 &\n');
T(['cd /tmp', 'cd -'], '/home/etudiant\n');

console.log(`${LESSONS.length} leçons, ${n} exercices vérifiés sans navigateur.`);

/* ---------- 2. Dans le navigateur ---------- */
(async () => {
  const { chromium } = require('playwright');
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ viewport: { width: 1200, height: 900 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push('erreur JavaScript : ' + String(e).slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') erreurs.push('console : ' + m.text().slice(0, 200)); });
  await page.goto('file://' + path.join(RACINE, 'systeme/intro-systeme.html'));
  await page.waitForTimeout(300);
  const hashes = await page.$$eval('.nav a', as => as.map(a => a.getAttribute('href')));
  for (const h of ['#accueil', ...hashes]) {
    await page.evaluate(x => { location.hash = x; }, h);
    await page.waitForTimeout(80);
    const pb = await page.evaluate(() => {
      const r = [];
      const t = document.getElementById('main').innerText;
      if (/undefined|\[object |NaN/.test(t)) r.push('texte parasite (undefined, NaN…)');
      document.querySelectorAll('figure.cb .t-err').forEach(e => { if (/command not found/.test(e.textContent) && !/hello: command/.test(e.textContent)) r.push('exemple : ' + e.textContent.trim()); });
      document.querySelectorAll('[data-widget], .ex-drill .drill-host, .ex-shell .task-term').forEach(w => { if (!w.children.length) r.push('widget vide : ' + (w.dataset.widget || w.className)); });
      return r;
    });
    pb.forEach(p => ko(`${h} : ${p}`));
  }
  /* Un essai de bout en bout : « Essayer ici », puis un exercice tapé dans le terminal */
  await page.evaluate(() => { location.hash = '#l3'; });
  await page.waitForTimeout(100);
  await page.click('[data-act="try"]');
  await page.waitForTimeout(500);
  if (!(await page.$('.try-box .t-echo'))) ko('« Essayer ici » n\'ouvre pas de terminal');
  const sec = page.locator('[data-ex="l3-t1"]');
  await sec.locator('.term-input').fill('cd Documents'); await sec.locator('.term-input').press('Enter');
  await sec.locator('.term-input').fill('pwd'); await sec.locator('.term-input').press('Enter');
  await sec.locator('[data-act="sh-check"]').click();
  if (!(await sec.locator('.ex-fb.ok').count())) ko('l3-t1 : la vérification dans la page échoue');
  /* La fiche recto verso doit tenir sur une feuille A4 (2 pages), de 6 à 8 pt */
  for (const t of [6, 7.5, 8]) {
    await page.evaluate(x => localStorage.setItem('intro-systeme-fiche', String(x)), t);
    await page.evaluate(() => { location.hash = '#accueil'; }); await page.waitForTimeout(50);
    await page.evaluate(() => { location.hash = '#fiche'; }); await page.waitForTimeout(150);
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    await page.emulateMedia({ media: 'screen' });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    if (pages !== 2) ko(`fiche à ${t} pt : ${pages} page(s) au lieu de 2`);
  }
  await page.setViewportSize({ width: 380, height: 800 });
  const deborde = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  if (deborde) ko('la page déborde horizontalement sur téléphone');
  erreurs.forEach(e => ko(e));
  await navigateur.close();
  console.log(echecs ? `${echecs} problème(s).` : 'Intro système : tout est correct.');
  process.exit(echecs ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
