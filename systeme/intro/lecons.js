/* Intro système : outils d'écriture et contenu des leçons.
   Une leçon = { id, part, title, skill, lead, obj: [...], body: () => HTML, retenir: [...], ex: [identifiants d'exercices] }.
   ex(`commandes`, { seed, cwd, pre }) exécute vraiment les commandes dans un terminal simulé neuf :
   la sortie affichée est toujours exacte, et le bouton « Essayer » rejoue les mêmes commandes. */
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const c = s => `<code>${esc(s)}</code>`;
const tbl = (head, rows, cls) => `<div class="tbl-wrap"><table class="tbl ${cls || ''}"><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const note = (kind, title, html) => `<aside class="note ${kind}"><div class="note-h">${title}</div><div class="note-b">${html}</div></aside>`;
const ul = items => `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
/* Sortie du terminal (texte avec marqueurs de couleur) vers HTML */
function termHTML(s) {
  const M = Sh.M;
  return esc(s).replace(new RegExp(M.D + '([^' + M.END + ']*)' + M.END, 'g'), '<span class="ls-d">$1</span>')
    .replace(new RegExp(M.X + '([^' + M.END + ']*)' + M.END, 'g'), '<span class="ls-x">$1</span>')
    .replace(new RegExp(M.H + '([^' + M.END + ']*)' + M.END, 'g'), '<span class="t-hit">$1</span>');
}
/* Exemple exécuté */
function ex(block, o) {
  o = o || {};
  const cmds = block.split('\n').map(l => l.replace(/^\$ /, '')).filter(l => l.trim());
  const shl = new Sh.Shell(o.seed || 'standard');
  if (o.cwd) shl.run('cd ' + o.cwd, { inner: true });
  (o.pre || []).forEach(p => shl.run(p, { inner: true }));
  const html = cmds.map(cmd => {
    const pr = o.long ? esc(shl.prompt()) : '$';
    const r = shl.run(cmd, { inner: true });
    let s = `<span class="sh-p">${pr}</span> <span class="sh-c">${esc(cmd)}</span>`;
    r.chunks.forEach(k => { if (k.k === 'out') s += '\n<span class="sh-o">' + termHTML(k.s.replace(/\n$/, '')) + '</span>'; else if (k.k === 'err') s += '\n<span class="t-err">' + esc(k.s.replace(/\n$/, '')) + '</span>'; });
    if (shl.busy) { s += '\n<span class="t-hint">(le terminal est occupé : Ctrl+C pour arrêter, Ctrl+Z pour suspendre)</span>'; shl.key('C'); }
    return s;
  }).join('\n');
  const data = esc(JSON.stringify({ cmds, seed: o.seed || 'standard', cwd: o.cwd || '', pre: o.pre || [] }));
  return `<figure class="cb sh"><pre class="cb-code"><code>${html}</code></pre>${o.noTry ? '' : `<div class="cb-bar"><span class="cb-lang">terminal</span><div class="cb-actions"><button type="button" class="btn mini" data-act="try" data-try="${data}">▶ Essayer ici</button></div></div>`}</figure>`;
}
/* Exemple statique (commandes non simulées : réseau, chiffrement…) */
function sh(block, cap) {
  const html = block.split('\n').map(l => l.startsWith('$ ')
    ? `<span class="sh-p">$</span> <span class="sh-c">${esc(l.slice(2))}</span>`
    : `<span class="sh-o">${esc(l)}</span>`).join('\n');
  return `<figure class="cb sh"><pre class="cb-code"><code>${html}</code></pre>${cap ? `<figcaption class="cb-cap">${cap}</figcaption>` : ''}</figure>`;
}
/* Anatomie d'une chaîne ls -l */
function lsFig(str) {
  const t = str[0], u = str.slice(1, 4), g = str.slice(4, 7), o = str.slice(7, 10);
  return `<figure class="lsfig" aria-label="Anatomie de ${esc(str)}">
  <div class="ls-str" aria-hidden="true"><span class="seg-t">${esc(t)}</span><span class="seg-u">${esc(u)}</span><span class="seg-g">${esc(g)}</span><span class="seg-o">${esc(o)}</span></div>
  <ul class="ls-leg">
    <li><i class="seg-t"></i><strong>type</strong> : <code>-</code> fichier, <code>d</code> répertoire, <code>l</code> lien</li>
    <li><i class="seg-u"></i><strong>u</strong> (user) : le propriétaire</li>
    <li><i class="seg-g"></i><strong>g</strong> (group) : le groupe</li>
    <li><i class="seg-o"></i><strong>o</strong> (others) : tous les autres</li>
  </ul></figure>`;
}
/* Anatomie d'une ligne de commande */
function cmdFig(parts) {
  const cls = { c: 'seg-t', o: 'seg-u', a: 'seg-g', r: 'seg-o' };
  return `<figure class="lsfig cmdfig"><div class="ls-str" aria-hidden="true">${parts.map(([k, s]) => `<span class="${cls[k]}">${esc(s)}</span>`).join('')}</div>
  <ul class="ls-leg"><li><i class="seg-t"></i><strong>commande</strong> : le programme à lancer</li><li><i class="seg-u"></i><strong>options</strong> : modifient son comportement, commencent par <code>-</code></li><li><i class="seg-g"></i><strong>arguments</strong> : ce sur quoi elle agit (fichiers, texte…)</li>${parts.some(p => p[0] === 'r') ? '<li><i class="seg-o"></i><strong>redirection</strong> : où va le résultat</li>' : ''}</ul></figure>`;
}
/* Schéma des flux d'une commande */
const flowFig = () => `<figure class="flow" aria-label="Les trois flux d'une commande">
  <div class="fl-src">clavier<br><small>ou &lt; fichier<br>ou tube</small></div><div class="fl-arr">0 stdin →</div>
  <div class="fl-cmd">commande</div>
  <div class="fl-outs"><div><span class="fl-arr">1 stdout →</span><span class="fl-dst">écran<br><small>ou &gt; fichier, ou | commande</small></span></div><div><span class="fl-arr err">2 stderr →</span><span class="fl-dst">écran<br><small>ou 2&gt; fichier</small></span></div></div>
</figure>`;
const pipeFig = steps => `<figure class="pipefig">${steps.map((s, i) => `${i ? '<span class="pf-pipe" aria-hidden="true">|</span>' : ''}<div class="pf-step"><code>${esc(s[0])}</code><small>${s[1]}</small></div>`).join('')}</figure>`;
const permLab = () => '<div class="widget permlab" data-widget="permlab"></div>';
const globLab = () => '<div class="widget permlab" data-widget="globlab"></div>';
const encLab = () => '<div class="widget permlab" data-widget="enclab"></div>';
const drillW = (kind, title) => `<div class="widget drill" data-widget="drill" data-kind="${kind}" data-title="${esc(title)}"></div>`;

const PARTS = [
  { id: 'p0', title: 'Démarrer', td: 'Prélude' },
  { id: 'p1', title: 'Fichiers et commandes', td: 'TD 1' },
  { id: 'p2', title: 'Éditer et travailler à distance', td: 'TD 2' },
  { id: 'p3', title: 'Redirections, filtres, codage', td: 'TD 3' },
  { id: 'p4', title: 'Utilisateurs et droits', td: 'TD 4' },
  { id: 'p5', title: 'Programmes et processus', td: 'Aide-mémoire' }
];

const LESSONS = [
  /* =================================================================== PARTIE 0 */
  {
    id: 'l1', part: 'p0', title: 'Le terminal et le shell', skill: 'Lancer une commande avec des options et des arguments',
    lead: "Le terminal est une fenêtre où l'on tape des commandes au lieu de cliquer. Le programme qui les lit et les exécute s'appelle le shell (ici : bash).",
    obj: ['Comprendre la boucle lire → analyser → exécuter du shell', 'Repérer la commande, les options et les arguments', 'Utiliser l\'historique, la complétion (TAB) et les raccourcis clavier'],
    body: () => `
<h2>Pourquoi un terminal ?</h2>
<p>Avec la souris, on ne peut faire que ce que l'interface a prévu. Avec des commandes, on peut tout faire, l'automatiser (scripts), le faire à distance (ssh) et le refaire à l'identique. C'est l'outil de base de l'informaticien, et le sujet de toute la ressource <strong>R1.04</strong>.</p>
<h2>Ce que fait le shell</h2>
<p>Dans la fenêtre du terminal tourne un programme, l'<strong>interpréteur de commandes</strong> (le <em>shell</em>). Il fait une boucle :</p>
<ol class="numbered"><li><strong>lire</strong> une ligne de commande (il affiche une invite, le <em>prompt</em>, et attend Entrée) ;</li><li><strong>l'analyser</strong> : la découper en mots, remplacer les jokers et les variables ;</li><li><strong>l'exécuter</strong>, puis afficher le résultat ;</li><li><strong>recommencer</strong>, sauf si la commande était ${c('exit')} : le shell s'arrête et la fenêtre se ferme.</li></ol>
<p>L'invite ${c('etudiant@intro:~$')} se lit : <em>utilisateur</em> @ <em>machine</em> : <em>répertoire courant</em> (${c('~')} = ton répertoire personnel), puis ${c('$')} (ou ${c('#')} si tu es l'administrateur root).</p>
${ex(`date
echo "hello, world"
whoami`)}
<p>Le bouton <em>Essayer ici</em> ouvre un terminal simulé juste en dessous : tu peux tout tester sans rien risquer.</p>
<h2>La forme d'une commande</h2>
${cmdFig([['c', 'ls'], ['o', '-l'], ['o', '-t'], ['a', 'Documents']])}
<p>Une ligne de commande commence par le <strong>nom de la commande</strong>, suivi éventuellement d'<strong>options</strong> et d'<strong>arguments</strong>, séparés par des espaces.</p>
${ul([`Les options commencent en général par un tiret : ${c('-l')}. Les options « longues » ont deux tirets : ${c('--all')}.`, `Les options courtes se combinent derrière un seul tiret : ${c('ls -l -t -r')} s'écrit aussi ${c('ls -ltr')}.`, `Certaines options attendent une valeur : ${c('head -n 5 fichier')}.`])}
${ex(`echo -n "pas de retour à la ligne"; echo " ... suite"
date -d "Sunday"
ls -l -t Documents
ls -lt Documents`)}
${note('attention', 'Les espaces comptent', `<p>${c('ls-l')} est une commande inconnue, ${c('ls -l')} est la commande ls avec l'option -l. Et les majuscules aussi : ${c('LS')} n'existe pas.</p>`)}
<h2>Historique et complétion</h2>
${tbl(['Touche', 'Effet'], [['<kbd>↑</kbd> / <kbd>↓</kbd>', 'reprendre les commandes précédentes (puis ← → pour corriger)'], ['<kbd>Tab</kbd>', 'compléter le nom d\'une commande ou d\'un fichier'], ['<kbd>Tab</kbd> <kbd>Tab</kbd>', 's\'il y a plusieurs possibilités : les afficher'], [c('history'), 'afficher la liste des commandes déjà tapées']])}
${note('convention', 'Le bon réflexe', `<p><strong>Ne tape jamais un nom de fichier en entier</strong> : tape le début puis <kbd>Tab</kbd>. Plus rapide, et zéro faute de frappe. Essaie dans le terminal : ${c('cat Doc')} puis <kbd>Tab</kbd>, puis ${c('no')} et <kbd>Tab</kbd>.</p>`)}
<h3>Raccourcis clavier utiles</h3>
${tbl(['Raccourci', 'Effet'], [['<kbd>Ctrl</kbd>+<kbd>C</kbd>', 'arrêter la commande en cours'], ['<kbd>Ctrl</kbd>+<kbd>L</kbd>', 'effacer l\'écran (comme ' + c('clear') + ')'], ['<kbd>Ctrl</kbd>+<kbd>D</kbd>', 'quitter le shell (comme ' + c('exit') + ')'], ['<kbd>Ctrl</kbd>+<kbd>R</kbd>', 'chercher une commande dans l\'historique'], ['<kbd>Ctrl</kbd>+<kbd>A</kbd> / <kbd>Ctrl</kbd>+<kbd>E</kbd>', 'aller au début / à la fin de la ligne'], ['<kbd>Ctrl</kbd>+<kbd>U</kbd> / <kbd>Ctrl</kbd>+<kbd>K</kbd>', 'effacer jusqu\'au début / jusqu\'à la fin de la ligne'], ['<kbd>Ctrl</kbd>+<kbd>W</kbd>', 'effacer le mot avant le curseur'], ['<kbd>Ctrl</kbd>+<kbd>Maj</kbd>+<kbd>C</kbd> / <kbd>V</kbd>', 'copier / coller dans le terminal (Ctrl+C seul arrête la commande !)']])}
<h3>Quelques commandes pour commencer</h3>
${tbl(['Commande', 'Effet'], [[c('echo mots…'), 'afficher les mots'], [c('date'), 'afficher la date'], [c('cal [[mois] année]'), 'afficher un calendrier'], [c('clear'), 'effacer le terminal'], [c('whoami'), 'afficher ton nom d\'utilisateur'], [c('exit'), 'fermer le shell']])}
${ex(`cal 9 2026`)}
`,
    retenir: ['Le shell lit une ligne, l\'analyse, l\'exécute, et recommence.', 'commande -options arguments, séparés par des espaces ; ls -l -a = ls -la.', 'TAB complète, ↑ reprend la commande précédente, Ctrl+C arrête.'],
    ex: ['l1-q1', 'l1-q2', 'l1-q3', 'l1-q4', 'l1-t1', 'l1-t2']
  },
  {
    id: 'l2', part: 'p0', title: 'Lire le manuel : man et help', skill: 'Trouver seul une option dans le manuel',
    lead: "Personne ne connaît toutes les options par cœur. Les informaticiens les cherchent dans le manuel : c'est un réflexe à prendre dès maintenant.",
    obj: ['Ouvrir une page de manuel et y naviguer', 'Lire un synopsis : gras, MAJUSCULES, [crochets], |, ...', 'Distinguer man (programmes) et help (commandes internes)'],
    body: () => `
<h2>La commande man</h2>
<p>${c('man commande')} affiche le <strong>manuel</strong> de la commande : ce qu'elle fait et toutes ses options. Dans un vrai terminal, la page s'ouvre dans ${c('less')} :</p>
${tbl(['Touche', 'Effet'], [['flèches, <kbd>Espace</kbd>', 'défiler'], [c('/mot'), 'chercher « mot » (puis <kbd>n</kbd> pour l\'occurrence suivante)'], [c('q'), 'quitter']])}
${ex(`man date`)}
<h2>Lire un synopsis</h2>
<p>La partie <strong>SYNOPSIS</strong> résume comment écrire la commande, avec des conventions :</p>
${tbl(['Notation', 'Signification', 'Exemple'], [['<strong>gras</strong> ou texte normal', 'à taper tel quel', c('ls')], ['MAJUSCULES', 'une catégorie à remplacer par une vraie valeur', c('FICHIER') + ' → ' + c('notes.txt')], ['[ ]', 'facultatif : on peut l\'omettre', c('ls [FICHIER]') + ' : ' + c('ls') + ' marche seul'], ['...', 'peut être répété', c('mkdir RÉPERTOIRE...') + ' : un ou plusieurs'], ['a | b', 'au choix : a ou b', c('-u | --utc')]])}
<p>Exemple : ${c('cal [[mois] année]')} veut dire : ${c('cal')}, ou ${c('cal 2026')}, ou ${c('cal 9 2026')}. Mais pas ${c('cal 9')} seul (le mois ne va pas sans l\'année).</p>
<h2>Chercher une commande : apropos</h2>
<p>Tu sais ce que tu veux faire mais pas le nom de la commande ? ${c('apropos mot')} (ou ${c('man -k mot')}) cherche dans les descriptions de toutes les pages.</p>
${ex(`apropos compresser
apropos droits`)}
<h2>help et --help</h2>
<p>Certaines commandes, comme ${c('cd')}, ${c('echo')}, ${c('exit')}, ${c('history')} ou ${c('umask')}, sont <strong>internes</strong> au shell (des <em>builtins</em>) : elles ne sont pas des programmes séparés. Leur aide s'obtient avec ${c('help')}. La commande ${c('type')} te dit de quel genre est une commande.</p>
${ex(`type cd
type ls
help cd
help ls`)}
<p>Enfin, la plupart des programmes acceptent l'option ${c('--help')}, qui affiche un résumé rapide sans ouvrir le manuel.</p>
${ex(`head --help`)}
${note('convention', 'Le bon réflexe', '<p>Il est important de ne pas avoir peur de lire le manuel. Une option inconnue dans un sujet de TP ? <strong>man</strong>, puis <strong>/option</strong>.</p>')}
`,
    retenir: ['man COMMANDE ouvre le manuel ; /mot cherche, q quitte.', 'Synopsis : [ ] facultatif, MAJUSCULES à remplacer, ... répétable, | au choix.', 'apropos MOT cherche une commande ; help sert pour les commandes internes (cd, echo…).'],
    ex: ['l2-q1', 'l2-q2', 'l2-q3', 'l2-q4', 'l2-t1', 'l2-w1']
  },

  /* =================================================================== PARTIE 1 : TD 1 */
  {
    id: 'l3', part: 'p1', title: 'Se repérer : pwd, cd et les chemins', skill: 'Savoir où je suis et me déplacer avec des chemins absolus ou relatifs',
    lead: "Les fichiers sont rangés dans un arbre de répertoires. Le terminal est toujours « quelque part » dans cet arbre : c'est le répertoire courant.",
    obj: ['Lire l\'arborescence Linux à partir de la racine /', 'Utiliser pwd et cd', 'Écrire un chemin absolu ou relatif, avec . .. et ~'],
    body: () => `
<h2>L'arborescence</h2>
<p>Sous Linux, il n'y a pas de « C: » : tout part d'une seule <strong>racine</strong>, notée ${c('/')}. Les répertoires (on dit aussi dossiers) contiennent des fichiers et d'autres répertoires.</p>
<figure class="treefig"><pre>
<b>/</b>                       la racine
├── bin  usr/bin          les programmes (ls, cp…)
├── etc                   la configuration (passwd…)
├── tmp                   fichiers temporaires, ouverts à tous
└── home                  les répertoires personnels
    ├── alice
    ├── bob
    └── <b>etudiant</b>          ← ton répertoire personnel : ~
        ├── Documents
        │   └── notes.txt
        └── Projets
            └── tp1</pre></figure>
${tbl(['Commande', 'Rôle'], [[c('pwd'), '<strong>P</strong>rint <strong>W</strong>orking <strong>D</strong>irectory : affiche le chemin <strong>absolu</strong> du répertoire courant.'], [c('cd [RÉPERTOIRE]'), '<strong>C</strong>hange <strong>D</strong>irectory : change de répertoire courant. Sans argument : retour au répertoire personnel.']])}
${ex(`pwd
cd Documents
pwd`)}
<h2>Chemin absolu, chemin relatif</h2>
${tbl(['Type', 'Commence par', 'Se lit depuis', 'Exemple'], [['absolu', c('/'), 'la racine : marche de n\'importe où', c('/home/etudiant/Documents')], ['relatif', 'un nom, . ou ..', 'le répertoire courant', c('Documents') + ', ' + c('../Projets')]])}
<p>Comme une adresse : « 12 rue de la Paix, Paris » (absolu) contre « la deuxième rue à gauche » (relatif : dépend d'où l'on est).</p>
<h3>Les raccourcis</h3>
${tbl(['Écriture', 'Signification'], [[c('.'), 'le répertoire courant'], [c('..'), 'le répertoire parent (on remonte d\'un niveau)'], [c('~'), 'ton répertoire personnel (ici /home/etudiant)'], [c('cd'), 'sans argument : retour au répertoire personnel'], [c('cd -'), 'retour au répertoire précédent']])}
${ex(`cd Projets/tp1
pwd
cd ../..
pwd
cd /tmp
cd -
cd ~/Documents
pwd
cd
pwd`, { long: true })}
<p>Regarde l'invite : elle change à chaque ${c('cd')}. ${c('~/Documents')} veut dire « Documents dans mon répertoire personnel ».</p>
${note('attention', 'Pièges', ul([`${c('cd /Documents')} cherche Documents <strong>à la racine</strong> : erreur. Un chemin qui commence par / part toujours de la racine.`, `${c('cd..')} (sans espace) est une commande inconnue : il faut ${c('cd ..')}.`, 'Linux distingue majuscules et minuscules : ' + c('documents') + ' ≠ ' + c('Documents') + '.']))}
<h2>Entraîne-toi</h2>
${drillW('path', 'Où arrive-t-on ?')}
`,
    retenir: ['pwd = où suis-je ? (chemin absolu). cd CHEMIN = aller ailleurs.', 'Absolu = commence par / ; relatif = part du répertoire courant.', '. courant, .. parent, ~ personnel, cd seul = maison, cd - = précédent.'],
    ex: ['l3-q1', 'l3-q2', 'l3-q3', 'l3-q4', 'l3-t1', 'l3-t2', 'l3-t3', 'l3-d1']
  },
  {
    id: 'l4', part: 'p1', title: 'Lister et créer : ls, mkdir, touch', skill: 'Lister un répertoire et créer fichiers et répertoires',
    lead: "Voir ce qu'il y a dans un répertoire, puis organiser son espace de travail en créant des répertoires et des fichiers.",
    obj: ['Utiliser ls et ses options -l, -a, -t, -R, -d', 'Créer des répertoires (mkdir, mkdir -p) et les supprimer vides (rmdir)', 'Créer un fichier vide (touch), voir une arborescence (tree), mesurer (du)'],
    body: () => `
<h2>ls : lister</h2>
${ex(`ls
ls Documents
ls -a`)}
${tbl(['Option', 'Effet'], [[c('-l'), 'format <strong>long</strong> : droits, propriétaire, taille, date…'], [c('-a'), '<strong>all</strong> : montre aussi les fichiers <strong>cachés</strong>, dont le nom commence par un point (' + c('.bashrc') + ')'], [c('-t'), 'trie par date, le plus récent d\'abord'], [c('-r'), 'inverse l\'ordre'], [c('-R'), 'liste aussi les sous-répertoires (récursif)'], [c('-d'), 'montre le répertoire lui-même, pas son contenu'], [c('-h'), 'avec -l : tailles lisibles (12K, 3M)']])}
${ex(`ls -l
ls -la Documents
ls -ld Documents`)}
<p>Dans le terminal, les répertoires sont en <span class="ls-d">bleu</span> et les fichiers exécutables en <span class="ls-x">vert</span>. La ligne ${c('total')} donne la place occupée (en blocs).</p>
<h2>tree et du</h2>
<p>${c('tree')} dessine l'arborescence ; ${c('du -sh')} (<em>disk usage</em>) donne la taille totale d'un répertoire. Pour surveiller ton espace sur le compte de l'IUT : ${c('quota -s')}.</p>
${ex(`tree Projets
du -sh Photos Documents`)}
<h2>mkdir et rmdir</h2>
${ex(`mkdir cours
mkdir tp1 tp2
mkdir projet/src
mkdir -p projet/src/utils
tree projet
rmdir tp2
rmdir projet`)}
${ul([`${c('mkdir REP...')} crée un ou plusieurs répertoires. Sans ${c('-p')}, le parent doit déjà exister.`, `${c('mkdir -p a/b/c')} crée toute la chaîne d'un coup (et ne dit rien si elle existe déjà).`, `${c('rmdir REP')} ne supprime qu'un répertoire <strong>vide</strong> (sinon : « Directory not empty »).`])}
<h2>touch</h2>
<p>${c('touch')} sert normalement à changer la date d'un fichier, mais on l'utilise surtout pour <strong>créer un fichier vide</strong>.</p>
${ex(`touch notes.txt
ls -l notes.txt
touch notes.txt Documents/notes.txt`)}
`,
    retenir: ['ls -l détails, -a cachés (.nom), -t par date, -R récursif ; options combinables : ls -lat.', 'mkdir -p a/b/c crée toute la chaîne ; rmdir ne supprime que les répertoires vides.', 'touch crée un fichier vide (ou met à jour sa date).'],
    ex: ['l4-q1', 'l4-q2', 'l4-q3', 'l4-q4', 'l4-t1', 'l4-t2', 'l4-t3']
  },
  {
    id: 'l5', part: 'p1', title: 'Copier, déplacer, supprimer', skill: 'Copier, déplacer, renommer et supprimer fichiers et répertoires',
    lead: "Trois commandes pour organiser ses fichiers : cp, mv et rm. Attention à la troisième : il n'y a pas de corbeille.",
    obj: ['Copier un fichier ou un répertoire (cp, cp -r)', 'Déplacer et renommer (mv)', 'Supprimer (rm, rm -r) sans faire de dégâts'],
    body: () => `
${tbl(['Commande', 'Rôle'], [[c('cp [-rv] SRC... DST'), '<strong>copy</strong> : copier. ' + c('-r') + ' (ou ' + c('-R') + ') pour un répertoire entier.'], [c('mv SRC... DST'), '<strong>move</strong> : déplacer ou renommer.'], [c('rm [-ri] F...'), '<strong>remove</strong> : supprimer. ' + c('-r') + ' pour un répertoire et tout son contenu.']])}
<h2>cp : copier</h2>
<p>La règle de la <strong>destination</strong> vaut pour cp et mv :</p>
${ul(['si la destination est un <strong>répertoire existant</strong>, la source est placée <strong>dedans</strong> (avec son nom) ;', 'sinon, la destination est le <strong>nouveau nom</strong>.'])}
${ex(`cp README.txt copie.txt
cp Documents Sauvegarde
cp -r Documents Sauvegarde
cp -v secret.txt README.txt Sauvegarde
ls Sauvegarde`)}
<h2>mv : déplacer et renommer</h2>
<p>Pour le système, renommer, c'est déplacer vers un autre nom : une seule commande fait les deux.</p>
${ex(`mv README.txt LISEZMOI.txt
mv LISEZMOI.txt Documents
mv script.sh Projets/tp1/run.sh
mv Photos Images
ls`)}
<p>${c('mv')} n'a pas besoin de ${c('-r')} : déplacer un répertoire déplace tout son contenu.</p>
<h2>rm : supprimer</h2>
${ex(`rm secret.txt
rm Projets
rm -r Projets
rm fantome.txt
rm -f fantome.txt`)}
${note('attention', 'Pas de corbeille', `<p>En ligne de commande, ${c('rm')} supprime <strong>pour de bon</strong>. Relis toujours la commande avant Entrée, surtout avec ${c('-r')} et les jokers. ${c('rm -i')} demande une confirmation pour chaque fichier ; ${c('rm -f')} (force) ne dit rien si le fichier n'existe pas.</p>`)}
<h2>Synthèse : déplacer, copier, supprimer un répertoire</h2>
${tbl(['Je veux…', 'Commande'], [['déplacer (ou renommer) un répertoire', c('mv rep destination')], ['copier un répertoire', c('cp -r rep destination')], ['supprimer un répertoire vide', c('rmdir rep')], ['supprimer un répertoire et son contenu', c('rm -r rep')]])}
`,
    retenir: ['cp -r pour copier un répertoire, rm -r pour en supprimer un ; mv n\'a pas besoin de -r.', 'Destination = répertoire existant → dedans ; sinon → nouveau nom.', 'rm est définitif : pas de corbeille.'],
    ex: ['l5-q1', 'l5-q2', 'l5-q3', 'l5-q4', 'l5-q5', 'l5-t1', 'l5-t2', 'l5-t3', 'l5-t4']
  },
  {
    id: 'l6', part: 'p1', title: 'Lire et éditer un fichier', skill: 'Afficher tout ou partie d\'un fichier et choisir un éditeur',
    lead: "Jusqu'ici, on déplaçait les fichiers comme des cartons fermés. Maintenant, on regarde dedans, et on choisit un éditeur pour les modifier.",
    obj: ['Afficher un fichier : cat, less, more, head, tail', 'Compter avec wc, identifier avec file', 'Connaître les éditeurs (code, gedit, nano, vim) et l\'intérêt des raccourcis'],
    body: () => `
<h2>Afficher</h2>
${tbl(['Commande', 'Effet'], [[c('cat [-n] FICHIER...'), 'affiche tout le fichier d\'un coup (' + c('-n') + ' numérote les lignes)'], [c('less FICHIER'), 'affiche page par page : Espace avance, b recule, /mot cherche, q quitte'], [c('more FICHIER'), 'comme less, en plus simple (on ne peut qu\'avancer)'], [c('head -n X FICHIER'), 'les X premières lignes (10 par défaut)'], [c('tail -n X FICHIER'), 'les X dernières lignes (10 par défaut)']])}
${ex(`cat Documents/notes.txt
cat -n Documents/notes.txt
head -n 3 Documents/cours.txt
tail -n 2 Documents/cours.txt`)}
<p>${c('cat')} convient aux petits fichiers. Pour un fichier de cent lignes, ${c('cat')} fait tout défiler : on utilise ${c('less')}. Et ${c('cat')} veut dire con<strong>cat</strong>éner : ${c('cat a b')} affiche a puis b.</p>
<h2>Compter et identifier</h2>
${ex(`wc Documents/cours.txt
wc -l Documents/cours.txt
file Documents/cours.txt Photos/plage.png script.sh Projets`)}
<p>${c('wc')} (<em>word count</em>) affiche lignes, mots, octets ; ${c('-l')} seulement les lignes. ${c('file')} regarde le <strong>contenu</strong> pour deviner la nature d'un fichier : sous Linux, l'extension (.txt, .png) n'est qu'une convention de nommage.</p>
<h2>Ouvrir avec un programme</h2>
${tbl(['Commande', 'Effet'], [[c('code fichier'), 'éditer avec Visual Studio Code (un IDE) ; ' + c('code .') + ' ouvre le répertoire courant'], [c('gedit fichier'), 'éditer avec un éditeur simple, dans une fenêtre'], [c('nano fichier'), 'éditeur simple <strong>dans le terminal</strong> : ^O enregistre, ^X quitte'], [c('vim fichier'), 'éditeur puissant dans le terminal : i pour écrire, Échap puis :wq pour enregistrer et quitter'], [c('evince fichier.pdf'), 'afficher un PDF'], [c('xdg-open fichier'), 'ouvrir avec le programme par défaut (image, PDF, page web…)']])}
${note('convention', 'Maîtriser son éditeur (TD 2)', `<p>Pour dupliquer une ligne dans VS Code, l'amateur sélectionne à la souris, copie, clique, colle ; l'expert tape <kbd>Ctrl</kbd>+<kbd>Maj</kbd>+<kbd>Alt</kbd>+<kbd>↓</kbd>. Apprendre les raccourcis demande un effort, puis fait gagner énormément de temps. Les indispensables de VS Code :</p>
${tbl(['Raccourci', 'Effet'], [['<kbd>Ctrl</kbd>+<kbd>S</kbd>', 'enregistrer'], ['<kbd>Ctrl</kbd>+<kbd>P</kbd>', 'ouvrir un fichier par son nom'], ['<kbd>Ctrl</kbd>+<kbd>Maj</kbd>+<kbd>P</kbd>', 'palette de commandes (encodage, formatage…)'], ['<kbd>Ctrl</kbd>+<kbd>/</kbd>', 'commenter / décommenter'], ['<kbd>Alt</kbd>+<kbd>↑</kbd> / <kbd>↓</kbd>', 'déplacer la ligne'], ['<kbd>Ctrl</kbd>+<kbd>D</kbd>', 'sélectionner l\'occurrence suivante du mot'], ['<kbd>Ctrl</kbd>+<kbd>F</kbd> / <kbd>H</kbd>', 'chercher / remplacer'], ['<kbd>Ctrl</kbd>+<kbd>\`</kbd>', 'ouvrir le terminal intégré']])}`)}
<p>Le terminal simulé n'a pas d'éditeur. Pour écrire dans un fichier, on utilise ${c('echo')} et une redirection (expliquée dans la partie TD 3) :</p>
${ex(`echo "première ligne" > memo.txt
echo "deuxième ligne" >> memo.txt
cat memo.txt`)}
`,
    retenir: ['cat affiche tout, less page par page (q pour quitter), head/tail -n X le début/la fin.', 'wc -l compte les lignes ; file devine le type d\'après le contenu.', 'code/gedit dans une fenêtre, nano/vim dans le terminal ; apprends les raccourcis de ton éditeur.'],
    ex: ['l6-q1', 'l6-q2', 'l6-q3', 'l6-q4', 'l6-t1', 'l6-t2', 'l6-w1']
  },
  {
    id: 'l7', part: 'p1', title: 'Les jokers (méta-caractères)', skill: 'Désigner plusieurs fichiers avec * ? [ ] et protéger avec des guillemets',
    lead: "Dans cp *.java /tmp, l'étoile ne désigne pas un fichier nommé « *.java » : c'est un méta-caractère que le shell remplace par la liste des noms qui correspondent.",
    obj: ['Comprendre l\'expansion : c\'est le shell qui remplace le motif, avant la commande', 'Utiliser * ? [abc] [a-z] [!a]', 'Empêcher l\'expansion avec des guillemets'],
    body: () => `
<h2>Le mécanisme d'expansion</h2>
<p>L'exécution de ${c('ls -l *.txt')} se fait en deux temps :</p>
<ol class="numbered"><li>le <strong>shell</strong> cherche dans le répertoire courant les noms qui se terminent par .txt, et <strong>remplace</strong> le motif par ces noms : la ligne devient ${c('ls -l README.txt secret.txt')} ;</li><li>il lance ${c('ls')}, qui reçoit ses arguments et ne voit jamais l'étoile.</li></ol>
<p>Conséquence : l'étoile marche avec <strong>toutes</strong> les commandes, même ${c('echo')}. Et si aucun nom ne correspond, le motif est laissé tel quel.</p>
${ex(`echo *.txt
echo sources = *
echo *.xyz
ls -l *.txt`)}
<h2>Les méta-caractères</h2>
${tbl(['Motif', 'Signification', 'Exemple', 'Correspond à'], [[c('*'), 'n\'importe quelle chaîne (même vide)', c('*.jpg'), 'tous les noms finissant par .jpg'], [c('?'), 'exactement un caractère', c('vacances?.jpg'), 'vacances1.jpg, mais pas vacances10.jpg'], [c('[abc]'), 'un caractère parmi a, b, c', c('[aeiouy]*'), 'les noms qui commencent par une voyelle'], [c('[a-e]'), 'un caractère de l\'intervalle', c('[0-9]*'), 'les noms qui commencent par un chiffre'], [c('[!abc]'), 'un caractère qui n\'est PAS a, b ou c', c('[!aeiouy]*'), 'les noms qui ne commencent pas par une voyelle']])}
${ex(`ls Photos/*.jpg
ls Photos/vacances?.jpg
ls Photos/[A-Z]*
echo /bin/[aeiouy]*
echo /usr/bin/[0-9]*
echo /bin/[!a-r]*`)}
<p>Les fichiers cachés (nom qui commence par un point) ne sont pas pris par ${c('*')} : il faut écrire ${c('.*')} explicitement.</p>
<h3>L'exercice du TD</h3>
<p>Le répertoire ${c('/mnt/roost/users')} contient un répertoire par utilisateur. Avec ${c('echo')} et un motif, on trouve par exemple les identifiants qui commencent par x :</p>
${ex(`echo /mnt/roost/users/x*`)}
<p>Un identifiant est formé de l'initiale du prénom suivie du nom (amartin = A. Martin). À toi de trouver ceux qui <em>contiennent</em> un x, ceux qui contiennent un x, un w ou un z, et ceux dont le <strong>nom</strong> commence par une lettre de a à e (indice : la 1re lettre est l'initiale du prénom, n'importe laquelle) : c'est dans les exercices ci-dessous.</p>
<h2>Protéger avec des guillemets</h2>
<p>Les guillemets (simples ${c("'...'")} ou doubles ${c('"..."')}) encadrent une chaîne : les espaces qu'elle contient ne la coupent plus en plusieurs mots, et ${c('*')} perd son rôle spécial. La barre oblique inverse ${c('\\')} protège un seul caractère.</p>
${ex(`echo "*"
echo '*.txt' vaut *.txt
echo "  hello,   world"
echo   hello,   world`)}
${note('attention', 'Les jokers et rm', `<p>${c('rm *')} supprime tout le répertoire courant. Avant un ${c('rm')} avec joker, fais d'abord ${c('echo')} ou ${c('ls')} avec le même motif pour voir ce qui serait supprimé.</p>`)}
<h2>Laboratoire des jokers</h2>
<p>Tape un motif : les noms qui correspondent s'allument.</p>
${globLab()}
<h2>Entraîne-toi</h2>
${drillW('glob', 'Le nom correspond-il au motif ?')}
`,
    retenir: ['C\'est le shell qui remplace le motif par les noms trouvés, avant de lancer la commande.', '* = n\'importe quelle chaîne, ? = un caractère, [ae] = un parmi, [a-e] intervalle, [!a] sauf.', 'Entre guillemets, les jokers et les espaces perdent leur rôle spécial.'],
    ex: ['l7-q1', 'l7-q2', 'l7-q3', 'l7-q4', 'l7-w1', 'l7-w2', 'l7-w3', 'l7-t1', 'l7-d1']
  },
  {
    id: 'l8', part: 'p1', title: 'Archiver et compresser', skill: 'Créer, lister et extraire une archive tar, compresser avec gzip',
    lead: "Compresser, c'est recoder un fichier pour qu'il prenne moins de place. Archiver, c'est regrouper plusieurs fichiers en un seul. Sous Linux, ce sont deux outils distincts, souvent combinés : tar et gzip.",
    obj: ['Compresser et décompresser (gzip, gunzip, bzip2, bunzip2)', 'Lire un fichier compressé sans le décompresser (zcat)', 'Créer, lister et extraire une archive avec tar -c, -t, -x'],
    body: () => `
<h2>La compression</h2>
<p>Deux familles :</p>
${ul(['<strong>sans perte</strong> : après compression puis décompression, on retrouve les données <strong>à l\'identique</strong>. Obligatoire pour du texte, du code, des données ;', '<strong>avec perte</strong> : pour les images, sons, vidéos (JPEG, MP3…), on supprime des « détails » que l\'œil ou l\'oreille ne remarquent presque pas.'])}
<p>Sous Unix, les compresseurs sans perte les plus courants sont ${c('gzip')} (algorithme de Lempel-Ziv) et ${c('bzip2')} (Burrows-Wheeler, en général plus efficace mais plus lent).</p>
${ex(`ls -R /usr/bin > /tmp/gros.txt
ls -l /tmp/gros.txt
gzip -v /tmp/gros.txt
ls -l /tmp/gros.txt.gz
zcat /tmp/gros.txt.gz | head -n 3
gunzip /tmp/gros.txt.gz
ls /tmp`)}
${tbl(['Commande', 'Effet'], [[c('gzip [-v19] F...'), 'remplace F par F.gz ; ' + c('-9') + ' compresse plus (plus lent), ' + c('-1') + ' plus vite ; ' + c('-v') + ' affiche le gain'], [c('gunzip F.gz'), 'remplace F.gz par F'], [c('zcat F.gz') + ', ' + c('zless F.gz'), 'afficher sans décompresser (cat et less ne montrent que du charabia)'], [c('bzip2 F') + ', ' + c('bunzip2 F.bz2') + ', ' + c('bzcat'), 'la même chose avec bzip2, suffixe .bz2']])}
${note('attention', 'gzip remplace le fichier', `<p>Après ${c('gzip f')}, il n'y a plus de ${c('f')}, seulement ${c('f.gz')}. Pour garder l'original : ${c('gzip -k f')}. Et gzip ne compresse que des fichiers, un par un : pour un répertoire, il faut d'abord une archive.</p>`)}
<h2>L'archivage avec tar</h2>
<p><strong>tar</strong> (<em>tape archiver</em>, autrefois pour les bandes magnétiques) regroupe un ensemble de fichiers et de répertoires en un seul fichier, par exemple pour l'envoyer en pièce jointe.</p>
${tbl(['Action', 'Commande', 'Moyen mnémotechnique'], [['créer', c('tar -cvf ARCHIVE.tar RÉPERTOIRE...'), '<strong>c</strong>reate'], ['lister le contenu', c('tar -tvf ARCHIVE.tar'), '<strong>t</strong>able (des matières)'], ['extraire', c('tar -xvf ARCHIVE.tar [FICHIER]...'), 'e<strong>x</strong>tract']])}
<p>${c('-f')} (<em>file</em>) est suivi du nom de l'archive ; ${c('-v')} (<em>verbose</em>) affiche ce qui se passe. On ajoute ${c('-z')} pour compresser avec gzip (${c('.tar.gz')} ou ${c('.tgz')}) ou ${c('-j')} pour bzip2 (${c('.tar.bz2')}).</p>
${ex(`tar -cvf M1101.tar M1101
tar -tf M1101.tar
mv M1101.tar /tmp
cd /tmp
tar -xvf M1101.tar
tar -xf M1101.tar M1101/td1.txt
cd
tar -czvf sauvegarde.tar.gz Documents
ls -l sauvegarde.tar.gz`)}
${note('convention', 'Bonne pratique', `<p>Place-toi <strong>au-dessus</strong> du répertoire à archiver (${c('tar -cf M1101.tar M1101')}, pas depuis l'intérieur). L'archive contiendra alors le répertoire M1101 lui-même, et son extraction n'éparpillera pas les fichiers partout. Avant d'extraire une archive reçue, liste-la avec ${c('-t')}.</p>`)}
<p>Il existe d'autres formats d'archive : ${c('zip')} / ${c('unzip')} (archive et compression en un, courant sous Windows), ${c('7z')}, ${c('cpio')}.</p>
`,
    retenir: ['gzip F → F.gz (F disparaît) ; gunzip pour revenir ; zcat pour lire sans décompresser.', 'tar -cvf créer, -tvf lister, -xvf extraire ; -f est suivi du nom de l\'archive.', 'tar -czvf archive.tar.gz rep : archive + compression gzip en une commande.'],
    ex: ['l8-q1', 'l8-q2', 'l8-q3', 'l8-q4', 'l8-t1', 'l8-t2', 'l8-t3', 'l8-w1']
  },

  /* =================================================================== PARTIE 2 : TD 2 */
  {
    id: 'l9', part: 'p2', title: 'Travailler à distance : ssh', skill: 'Ouvrir une session à distance et se connecter avec une clé',
    lead: "ssh permet d'ouvrir un terminal sur une autre machine, à travers le réseau, de façon chiffrée. Avec une paire de clés, plus besoin de taper son mot de passe.",
    obj: ['Se connecter avec ssh compte@machine', 'Comprendre clé publique et clé privée', 'Générer une paire de clés (ssh-keygen) et l\'installer (ssh-copy-id)', 'Ne pas perdre son travail si la connexion coupe (tmux)'],
    body: () => `
<h2>SSH, un tunnel sécurisé</h2>
<p><strong>SSH</strong> (<em>Secure Shell</em>) est un protocole qui établit un canal de communication sûr à travers un réseau qui ne l'est pas : tout ce qui passe (mot de passe compris) est <strong>chiffré</strong>. La version SSH-1 (1995) est obsolète ; on utilise SSH-2.</p>
<figure class="netfig"><div class="nf-box">ton poste<br><code>ssh</code> (client)</div><div class="nf-link">canal chiffré<br>⇄</div><div class="nf-box">info-ssh1.iut…<br><code>sshd</code> (serveur)</div></figure>
${sh(`$ ssh etudiant@info-ssh1.iut.u-bordeaux.fr
etudiant@info-ssh1.iut.u-bordeaux.fr's password:
etudiant@info-ssh1:~$ hostname
info-ssh1
etudiant@info-ssh1:~$ exit
logout
Connection to info-ssh1.iut.u-bordeaux.fr closed.`, 'Une session à distance : l\'invite montre le nom de la machine distante. exit la ferme.')}
${ul([`${c('ssh compte@machine')} : ouvre un shell sur la machine. Sans ${c('compte@')}, ssh utilise ton nom local.`, `${c('ssh compte@machine commande')} : lance une seule commande là-bas et affiche le résultat ici.`, 'Depuis chez toi, les machines du département sont accessibles par info-ssh1 ou info-ssh2.iut.u-bordeaux.fr. Sous Windows sans terminal Linux, on utilise PuTTY.'])}
<h2>Clé publique, clé privée</h2>
<p>SSH repose sur la <strong>cryptographie asymétrique</strong> : une paire de clés liées mathématiquement.</p>
${tbl(['', 'Clé privée', 'Clé publique'], [['fichier', c('~/.ssh/id_rsa'), c('~/.ssh/id_rsa.pub')], ['on la…', '<strong>garde secrète</strong> (droits 600, jamais envoyée)', '<strong>diffuse</strong> librement'], ['rôle', 'prouver « c\'est bien moi » / déchiffrer', 'vérifier cette preuve / chiffrer pour moi']])}
<p>Image : la clé publique est un <strong>cadenas ouvert</strong> que tu distribues ; seule ta clé privée ouvre ce cadenas. Si ta clé publique est dans le fichier ${c('~/.ssh/authorized_keys')} d'un serveur, il peut vérifier que tu possèdes la clé privée correspondante : il te laisse entrer sans mot de passe (ou avec seulement la <em>passphrase</em> qui protège ta clé privée).</p>
${ex(`ssh-keygen -t rsa
ls -la ~/.ssh
cat ~/.ssh/id_rsa.pub`)}
${sh(`$ ssh-copy-id etudiant@info-ssh1.iut.u-bordeaux.fr
$ ssh etudiant@info-ssh1.iut.u-bordeaux.fr
etudiant@info-ssh1:~$`, 'ssh-copy-id ajoute ta clé publique dans ~/.ssh/authorized_keys de la machine distante. Ensuite, plus de mot de passe.')}
${note('attention', 'Sécurité', ul(['Ne donne <strong>jamais</strong> ta clé privée (id_rsa sans .pub), ne la mets pas sur GitHub ni sur Moodle.', 'ssh refuse une clé privée lisible par d\'autres : elle doit rester en 600 (rw-------).']))}
<h2>Ne pas perdre son travail : tmux</h2>
<p>Si la connexion réseau coupe, la session ssh se termine, et avec elle les programmes qu'elle avait lancés. Un <strong>multiplexeur de terminaux</strong> comme ${c('tmux')} (ou ${c('screen')}) garde la session vivante sur le serveur : on s'y rattache plus tard.</p>
${tbl(['tmux', 'Effet'], [[c('tmux'), 'démarrer une session'], ['<kbd>Ctrl</kbd>+<kbd>b</kbd> puis <kbd>c</kbd>', 'nouveau terminal dans la session'], ['<kbd>Ctrl</kbd>+<kbd>b</kbd> puis <kbd>n</kbd>', 'terminal suivant'], ['<kbd>Ctrl</kbd>+<kbd>b</kbd> puis <kbd>d</kbd>', 'se détacher (la session continue sans toi)'], [c('tmux a'), 'se rattacher à la session'], ['<kbd>Ctrl</kbd>+<kbd>b</kbd> puis <kbd>[</kbd>', 'faire défiler (q pour sortir)']])}
<p>Enfin, ${c('rwho')} liste les utilisateurs connectés sur le réseau local.</p>
`,
    retenir: ['ssh compte@machine ouvre un shell distant chiffré ; exit le ferme.', 'Clé privée (id_rsa) secrète, en 600 ; clé publique (id_rsa.pub) à diffuser.', 'ssh-keygen crée la paire, ssh-copy-id installe la clé publique sur le serveur.'],
    ex: ['l9-q1', 'l9-q2', 'l9-q3', 'l9-q4', 'l9-w1', 'l9-w2', 'l9-t1']
  },
  {
    id: 'l10', part: 'p2', title: 'Transférer des fichiers : scp, sftp, rsync', skill: 'Copier et synchroniser des fichiers entre deux machines',
    lead: "Récupérer son TP de l'IUT chez soi, envoyer un projet sur un serveur : plusieurs outils, tous basés sur ssh (sauf le vieux FTP).",
    obj: ['Copier avec scp compte@machine:chemin', 'Connaître sftp, FTP et sshfs', 'Synchroniser avec rsync -avz et comprendre le / final'],
    body: () => `
<h2>scp : cp à travers le réseau</h2>
<p>${c('scp')} (<em>secure copy</em>) s'utilise comme ${c('cp')}, mais la source ou la destination peut être sur une autre machine, écrite ${c('compte@machine:chemin')}. Le chemin après les deux-points part du répertoire personnel distant.</p>
${sh(`$ scp rapport.pdf etudiant@info-ssh1.iut.u-bordeaux.fr:Documents/
$ scp etudiant@info-ssh1.iut.u-bordeaux.fr:TP/tp3.java .
$ scp -r etudiant@info-ssh1.iut.u-bordeaux.fr:COURS/R1.04 ~/COURS`, '1 : envoyer ; 2 : récupérer dans le répertoire courant (.) ; 3 : récupérer un répertoire entier (-r).')}
${note('attention', 'Les deux-points', `<p>${c('scp f etudiant@machine')} (sans les deux-points) crée simplement une copie <strong>locale</strong> nommée « etudiant@machine » ! C'est le ${c(':')} qui indique une machine distante.</p>`)}
<h2>sftp et FTP</h2>
${ul([`<strong>FTP</strong> (<em>File Transfer Protocol</em>) : protocole ancien, <strong>non chiffré</strong>. Clients : ${c('ftp')} (commandes ${c('put')}, ${c('get')}, ${c('ls')}, ${c('cd')}, ${c('mput')}, ${c('mget')}), FileZilla, les navigateurs (ftp://…).`, `<strong>sftp</strong> (<em>SSH File Transfer Protocol</em>) : les mêmes commandes interactives que ftp, mais à travers ssh. FileZilla sait aussi faire du SFTP.`])}
${sh(`$ sftp etudiant@info-ssh1.iut.u-bordeaux.fr
sftp> ls
sftp> get TP/tp3.java
sftp> put rapport.pdf
sftp> bye`)}
<h2>rsync : synchroniser</h2>
<p>${c('rsync')} copie un répertoire vers un autre (local ou distant, par ssh) en ne transférant <strong>que ce qui a changé</strong>. Idéal pour les sauvegardes.</p>
${sh(`$ rsync -avz --delete COURS etudiant@info-ssh1.iut.u-bordeaux.fr:ARCHIVES`)}
${tbl(['Option', 'Effet'], [[c('-a'), 'mode archive : récursif, conserve dates et droits'], [c('-v'), 'affiche les fichiers transférés'], [c('-z'), 'compresse pendant le transfert'], [c('--delete'), 'supprime dans la destination ce qui n\'existe plus dans la source']])}
${tbl(['Commande', 'Résultat dans ARCHIVES'], [[c('rsync -a COURS ARCHIVES'), 'ARCHIVES/COURS/… (le répertoire lui-même est copié)'], [c('rsync -a COURS/ ARCHIVES'), 'ARCHIVES/… (le <strong>contenu</strong> de COURS est copié directement)']])}
<h2>sshfs : monter ses fichiers distants</h2>
<p>${c('sshfs')} fait apparaître un répertoire distant comme un répertoire local (un <em>point de montage</em>) :</p>
${sh(`$ sudo apt install sshfs
$ mkdir fichiers_iut
$ sshfs etudiant@info-ssh1.iut.u-bordeaux.fr:. fichiers_iut
$ ls fichiers_iut`)}
`,
    retenir: ['scp [-r] SOURCE DEST, avec compte@machine:chemin pour le côté distant (ne pas oublier les :).', 'sftp = ftp chiffré (get, put) ; FTP n\'est pas chiffré.', 'rsync -avz ne copie que ce qui a changé ; SOURCE/ copie le contenu, SOURCE copie le répertoire.'],
    ex: ['l10-q1', 'l10-q2', 'l10-q3', 'l10-q4', 'l10-w1', 'l10-w2']
  },

  /* =================================================================== PARTIE 3 : TD 3 */
  {
    id: 'l11', part: 'p3', title: 'Redirections', skill: 'Envoyer la sortie d\'une commande dans un fichier et lire une entrée depuis un fichier',
    lead: "Une commande lit une entrée et produit deux sorties : les résultats et les erreurs. Les redirections permettent de choisir d'où vient l'une et où vont les autres.",
    obj: ['Connaître stdin (0), stdout (1), stderr (2)', 'Rediriger avec >, >>, <', 'Séparer les erreurs avec 2> et les réunir avec 2>&1'],
    body: () => `
<h2>Les trois flux</h2>
${flowFig()}
${tbl(['Numéro', 'Nom', 'Par défaut', 'En Java'], [['0', 'entrée standard (stdin)', 'le clavier', c('System.in')], ['1', 'sortie standard (stdout)', 'l\'écran', c('System.out')], ['2', 'sortie d\'erreur (stderr)', 'l\'écran', c('System.err')]])}
<p>Les deux sorties s'affichent dans la même fenêtre, mais ce sont deux canaux <strong>distincts</strong>.</p>
<h2>Vers un fichier : &gt; et &gt;&gt;</h2>
${ex(`ls -l > liste.txt
cat liste.txt
echo je suis $USER sur $HOSTNAME > message
echo "ligne 2" >> message
cat message
echo "écrasé" > message
cat message`)}
${ul([`${c('commande > fichier')} : la sortie va dans le fichier, qui est <strong>vidé d'abord</strong> (ou créé).`, `${c('commande >> fichier')} : la sortie est <strong>ajoutée à la fin</strong> du fichier.`, `Le fichier est créé avant que la commande démarre : c'est pour cela que ${c('liste.txt')} apparaît dans sa propre liste.`, `La redirection peut se placer n'importe où : ${c('>liste.txt ls -l')} marche aussi.`])}
${note('attention', 'Piège', `<p>${c('sort f > f')} ne trie pas f : le shell vide f <strong>avant</strong> de lancer sort, qui lit donc un fichier vide. Écris dans un autre fichier, puis renomme.</p>`)}
<h2>Depuis un fichier : &lt;</h2>
<p>Inversement, ${c('commande < fichier')} donne le fichier comme entrée standard, à la place du clavier. Exemple avec ${c('tr')}, qui ne lit que l'entrée standard :</p>
${ex(`tr a-z A-Z < Documents/notes.txt
wc -l < Documents/cours.txt`)}
<h2>La sortie d'erreur : 2&gt;</h2>
<p>Un compilateur écrit ses messages d'erreur sur <strong>stderr</strong>. Avec ${c('>')}, ils s'affichent quand même et le fichier reste vide. Il faut ${c('2>')} :</p>
${ex(`javac Erreur.java > erreurs.txt
cat erreurs.txt
javac Erreur.java 2> erreurs.txt
cat erreurs.txt`, { cwd: 'Projets/tp1' })}
<p>Le programme ${c('Sorties.java')} écrit une ligne avec ${c('System.out.println')} et une avec ${c('System.err.println')}. Observe où va chacune :</p>
${ex(`java Sorties.java
java Sorties.java > sortie.txt
java Sorties.java 2> erreur.txt
java Sorties.java > tout.txt 2>&1
cat tout.txt
ls fantome 2> /dev/null`, { cwd: 'Projets/tp1' })}
${tbl(['Écriture', 'Effet'], [[c('> f'), 'stdout dans f (écrase)'], [c('>> f'), 'stdout à la fin de f'], [c('< f'), 'stdin lu depuis f'], [c('2> f'), 'stderr dans f'], [c('2>> f'), 'stderr à la fin de f'], [c('> f 2>&1'), 'stdout ET stderr dans f (dans cet ordre !)'], [c('2> /dev/null'), 'jeter les erreurs (/dev/null est une « poubelle »)']])}
<h3>Grouper des commandes</h3>
<p>Pour envoyer la sortie de plusieurs commandes dans un seul fichier, on les met entre accolades :</p>
${sh(`$ {
    echo -n "contenu sauvegardé du "
    date
    tar -tf sauvegarde.tar
} > contenu.txt`)}
`,
    retenir: ['0 stdin (clavier), 1 stdout (écran), 2 stderr (écran) : deux sorties distinctes.', '> écrase, >> ajoute, < lit depuis un fichier, 2> redirige les erreurs.', '> f 2>&1 met tout dans f ; 2> /dev/null jette les erreurs.'],
    ex: ['l11-q1', 'l11-q2', 'l11-q3', 'l11-q4', 'l11-q5', 'l11-t1', 'l11-t2', 'l11-t3']
  },
  {
    id: 'l12', part: 'p3', title: 'Tubes et filtres : grep, sort, cut…', skill: 'Enchaîner des commandes avec | et filtrer un fichier de données',
    lead: "Le tube | branche la sortie d'une commande sur l'entrée de la suivante. Avec de petits filtres spécialisés, on construit des traitements puissants, comme des briques.",
    obj: ['Construire un tube (pipeline) avec |', 'Filtrer avec grep, trier avec sort, découper avec cut', 'Compter (wc, uniq -c), transformer (tr), joindre (join)'],
    body: () => `
<h2>Le tube</h2>
<p>Au lieu de passer par un fichier intermédiaire :</p>
${sh(`$ ls -l /usr/bin > liste.txt
$ less liste.txt`)}
<p>on écrit directement ${c('ls -l /usr/bin | less')}. ${c('less')} lit son entrée standard quand on ne lui donne pas de fichier : la sortie de ls y arrive par le tube. On peut enchaîner autant de commandes que l'on veut, et rediriger le résultat final.</p>
${ex(`ls /usr/bin | head -n 5
ls /usr/bin | wc -l
cat Documents/cours.txt | grep Semaine | tail -n 3 > fin.txt
cat fin.txt`)}
<h2>Les filtres</h2>
<p>Un <strong>filtre</strong> lit des lignes (dans un fichier ou sur son entrée standard), les transforme et les écrit sur sa sortie. Exemples avec ${c('Documents/etudiants.txt')} (nom:prénom:groupe:note) :</p>
${ex(`cat Documents/etudiants.txt`, { noTry: true })}
<h3>grep : garder les lignes qui contiennent un motif</h3>
${ex(`grep G1 Documents/etudiants.txt
grep -c G1 Documents/etudiants.txt
grep -v G1 Documents/etudiants.txt
grep -i semaine Documents/cours.txt | head -n 2
grep -n Conseil Documents/cours.txt`)}
${tbl(['Option', 'Effet'], [[c('-i'), 'ignorer majuscules/minuscules'], [c('-v'), 'inverser : lignes qui ne contiennent PAS le motif'], [c('-c'), 'compter les lignes trouvées'], [c('-n'), 'numéros de ligne'], [c('-w'), 'mot entier seulement']])}
<p>Le motif est une <strong>expression régulière</strong> : ${c('^')} début de ligne, ${c('$')} fin de ligne, ${c('.')} un caractère quelconque, ${c('[0-9]')} un chiffre. Exemple : ${c('grep "^M" fichier')} garde les lignes qui commencent par M.</p>
<h3>sort et uniq : trier et compter</h3>
${ex(`sort Documents/etudiants.txt | head -n 3
sort -t: -k4 -n Documents/etudiants.txt | tail -n 3
cut -d: -f3 Documents/etudiants.txt | sort | uniq -c`)}
${tbl(['Option de sort', 'Effet'], [[c('-n'), 'tri numérique (sinon « 10 » vient avant « 9 »)'], [c('-r'), 'ordre inverse'], [c('-t:'), 'le séparateur de champs est :'], [c('-k4'), 'trier selon le 4e champ'], [c('-u'), 'supprimer les doublons']])}
<p>${c('uniq')} ne fusionne que les lignes identiques <strong>voisines</strong> : on trie toujours avant. ${c('uniq -c')} compte les occurrences.</p>
<h3>cut : extraire des colonnes</h3>
${ex(`cut -d: -f1 Documents/etudiants.txt | head -n 3
cut -d: -f1,4 Documents/etudiants.txt | head -n 3
cut -c1-3 Documents/etudiants.txt | head -n 3
cut -d: -f1,7 /etc/passwd`)}
<h3>tr et join</h3>
<p>${c('tr a-z A-Z')} remplace chaque minuscule par la majuscule correspondante ; ${c('tr -d')} supprime des caractères. ${c('join f1 f2')} réunit les lignes de deux fichiers <strong>triés</strong> qui ont le même premier champ (comme une jointure en SQL).</p>
${ex(`echo "bonjour le monde" | tr a-z A-Z
echo "1 Martin" > noms.txt; echo "2 Dubois" >> noms.txt
echo "1 15" > notes.txt; echo "2 18" >> notes.txt
join noms.txt notes.txt`)}
<h2>Construire un tube, étape par étape</h2>
<p>Question : « quels sont les 3 meilleurs étudiants ? ». On ajoute une brique à la fois et on regarde le résultat à chaque étape :</p>
${pipeFig([['sort -t: -k4 -n -r etudiants.txt', 'trier par note décroissante'], ['head -n 3', 'garder les 3 premières lignes'], ['cut -d: -f1,4', 'garder nom et note']])}
${ex(`sort -t: -k4 -n -r Documents/etudiants.txt | head -n 3 | cut -d: -f1,4`)}
`,
    retenir: ['cmd1 | cmd2 : la sortie de cmd1 devient l\'entrée de cmd2.', 'grep motif (-v -i -c -n), sort (-n -r -t -k), cut -d: -f1,3, uniq -c (après sort), wc -l, tr, join.', 'On construit un tube brique par brique en vérifiant chaque étape.'],
    ex: ['l12-q1', 'l12-q2', 'l12-q3', 'l12-q4', 'l12-t1', 'l12-t2', 'l12-t3', 'l12-t4']
  },
  {
    id: 'l13', part: 'p3', title: 'Le codage des caractères', skill: 'Expliquer ASCII, Latin-1 et UTF-8 et convertir un fichier',
    lead: "Un fichier texte n'est qu'une suite d'octets. Un codage dit quel octet (ou quelle suite d'octets) représente quel caractère. Se tromper de codage donne des « Ã© » à la place des « é ».",
    obj: ['Rappeler bit, octet et ASCII', 'Comprendre Latin-1 (ISO-8859-1), Unicode et UTF-8', 'Observer les octets avec od et convertir avec iconv'],
    body: () => `
<h2>Bits, octets, codes</h2>
${ul(['Un <strong>bit</strong> vaut 0 ou 1 : la plus petite information représentable.', 'Un <strong>octet</strong> = 8 bits : 2<sup>8</sup> = 256 valeurs, de 0 à 255. Pour plus grand, il faut plusieurs octets.', 'Un <strong>codage de caractères</strong> associe une suite de bits à chaque lettre, chiffre ou symbole.'])}
<h2>ASCII (1967)</h2>
<p>L'<strong>ASCII</strong> code sur <strong>7 bits</strong> : 128 caractères (0 à 127) : lettres anglaises sans accent, chiffres, ponctuation, et des caractères de contrôle comme le saut de ligne (10, noté ${c('\\n')}).</p>
${tbl(['Caractère', 'A', 'Z', 'a', 'z', '0', '9', 'espace', '\\n'], [['Code décimal', '65', '90', '97', '122', '48', '57', '32', '10'], ['Hexadécimal', '41', '5A', '61', '7A', '30', '39', '20', '0A']])}
<p>Astuces : minuscule = majuscule + 32 ; le chiffre n s'écrit 48 + n.</p>
<h2>Les codages 8 bits : ISO-8859-1 (Latin-1)</h2>
<p>Pour les accents, l'ISO a défini des codages sur 8 bits : les codes 0 à 127 restent ceux de l'ASCII, et les codes 128 à 255 servent aux caractères en plus. Le plus utilisé en Europe de l'Ouest est l'<strong>ISO-8859-1</strong>, ou <strong>Latin-1</strong> (é = 233). Mais d'autres codages utilisent les mêmes codes 128-255 pour d'autres lettres (cyrillique, grec, turc… ; Windows-1252 ; la page de code 850 de DOS ; et EBCDIC chez IBM, qui n'est même pas compatible ASCII).</p>
${note('attention', 'D\'où viennent les caractères bizarres', '<p>Un même octet peut donc représenter des caractères différents selon le codage. Si on lit un texte avec le mauvais codage, les lettres accentuées sont remplacées par d\'autres caractères. D\'où la règle : <strong>toujours préciser le codage</strong> d\'un texte que l\'on échange.</p>')}
<h2>Unicode et UTF-8</h2>
<p><strong>Unicode</strong> donne un numéro unique (un <em>point de code</em>, noté U+ en hexadécimal) à chaque caractère de toutes les langues : é = U+00E9, Ç = U+00C7, € = U+20AC, 😀 = U+1F600. Reste à écrire ces numéros en octets :</p>
${ul(['<strong>UTF-32</strong> : 4 octets par caractère. Simple, mais 4 fois plus gros pour un texte occidental.', '<strong>UTF-16</strong> : 2 octets pour la plupart, 4 pour les autres.', '<strong>UTF-8</strong> : de <strong>1 à 4 octets</strong> selon le caractère. C\'est le codage du web et de Linux.'])}
<h3>Le principe d'UTF-8</h3>
<p>Les bits de poids fort du premier octet indiquent combien d'octets compte le caractère ; les octets suivants commencent tous par ${c('10')}.</p>
${tbl(['Octets', 'Points de code', 'Octet 1', 'Octet 2', 'Octet 3', 'Octet 4'], [['1', 'U+0000 à U+007F (ASCII)', c('0xxxxxxx'), '', '', ''], ['2', 'U+0080 à U+07FF (é, ç, ñ…)', c('110xxxxx'), c('10xxxxxx'), '', ''], ['3', 'U+0800 à U+FFFF (€, chinois…)', c('1110xxxx'), c('10xxxxxx'), c('10xxxxxx'), ''], ['4', 'U+10000 à U+10FFFF (émojis…)', c('11110xxx'), c('10xxxxxx'), c('10xxxxxx'), c('10xxxxxx')]])}
<p>Exemple : é = U+00E9 = 1110 1001 en binaire (11 bits : 000 1110 1001). On remplit ${c('110xxxxx 10xxxxxx')} : <strong>11000011 10101001</strong> = C3 A9 en hexadécimal (195 169 en décimal, 303 251 en octal).</p>
${ul(['<strong>Avantages</strong> : un texte ASCII reste identique ; un texte français ne grossit que de quelques pour cent ; si un octet est perdu, on se resynchronise au caractère suivant (codage robuste).', '<strong>Inconvénient</strong> : pour trouver le n-ième caractère, il faut parcourir le texte depuis le début (les tailles varient).'])}
<h3>Laboratoire d'encodage</h3>
<p>Tape un texte : tu vois chaque caractère, son point de code, ses octets en UTF-8 et en Latin-1, et ce que donnerait une mauvaise lecture.</p>
${encLab()}
<h2>Voir les octets : od</h2>
<p>${c('od -c fichier')} (<em>octal dump</em>) affiche un fichier octet par octet : caractères ASCII lisibles, ${c('\\n')} pour le saut de ligne, et les autres octets en octal. La première colonne est la position (en octal).</p>
${ex(`cat Codage/utf8.txt
od -c Codage/utf8.txt
od -t x1 Codage/utf8.txt
od -c Codage/latin1.txt
cat Codage/latin1.txt`)}
<p>En UTF-8, « é » occupe deux octets (303 251 en octal = C3 A9) ; en Latin-1, un seul (351 = E9). Le terminal attend de l'UTF-8 : il ne sait pas afficher l'octet E9 seul et montre ${c('�')}.</p>
${tbl(['Option de od', 'Affichage'], [[c('-c'), 'caractères (octets non ASCII en octal)'], [c('-t x1'), 'chaque octet en hexadécimal'], [c('-t u1'), 'chaque octet en décimal non signé'], [c('-t d1'), 'en décimal signé']])}
<h2>Convertir : iconv</h2>
<p>${c('iconv -f ANCIEN -t NOUVEAU entrée -o sortie')} (<em>from</em>, <em>to</em>, <em>output</em>).</p>
${ex(`iconv -f ISO-8859-1 -t UTF-8 Codage/latin1.txt -o converti.txt
cat converti.txt
file Codage/latin1.txt converti.txt
iconv -f ISO-8859-1 -t UTF-8 Codage/utf8.txt
iconv -f UTF-8 -t ASCII Codage/utf8.txt`)}
<p>La 4e commande se trompe de codage d'origine : chaque octet de « é » (C3 et A9) est lu comme un caractère Latin-1, d'où « Ã© ». La dernière échoue : l'ASCII n'a pas d'accents. Dans VS Code, on choisit l'encodage d'un fichier par la palette (<kbd>Ctrl</kbd>+<kbd>Maj</kbd>+<kbd>P</kbd> → « encodage »). La commande ${c('recode')} fait des conversions similaires, et aussi les fins de ligne Windows (${c('\\r\\n')}).</p>
<h2>Entraîne-toi</h2>
${drillW('utf8', 'Combien d\'octets en UTF-8 ?')}
`,
    retenir: ['ASCII : 7 bits, 128 caractères, sans accents. Latin-1 : 8 bits, accents sur 128-255.', 'Unicode numérote les caractères ; UTF-8 les écrit sur 1 à 4 octets (ASCII = 1 octet, é = 2 octets C3 A9).', 'od -c montre les octets ; iconv -f ANCIEN -t NOUVEAU convertit ; mauvais codage = « Ã© ».'],
    ex: ['l13-q1', 'l13-q2', 'l13-q3', 'l13-q4', 'l13-q5', 'l13-t1', 'l13-t2', 'l13-d1']
  },

  /* =================================================================== PARTIE 4 : TD 4 */
  {
    id: 'l14', part: 'p4', title: 'Utilisateurs et groupes', skill: 'Savoir qui je suis, à quels groupes j\'appartiens, et changer de propriétaire',
    lead: "Linux est multi-utilisateur : chaque fichier appartient à un utilisateur et à un groupe. Avant de parler de droits, il faut savoir qui est qui.",
    obj: ['Lire id, groups et /etc/passwd', 'Distinguer utilisateur, groupe primaire et groupes supplémentaires', 'Changer d\'utilisateur (su), agir en administrateur (sudo), changer de propriétaire (chown, chgrp)'],
    body: () => `
<h2>Utilisateurs et groupes</h2>
<p>Chaque utilisateur a un nom et un numéro (<strong>UID</strong>). Il est rattaché à au moins un groupe, son <strong>groupe primaire</strong> (GID), et éventuellement à des groupes supplémentaires. L'utilisateur <strong>root</strong> (UID 0) est l'administrateur : il a tous les droits.</p>
${ex(`whoami
id
groups
id alice`)}
<p>Ici, etudiant est dans les groupes etudiant (primaire), info et sudo. Les comptes sont décrits dans ${c('/etc/passwd')}, un par ligne, champs séparés par ${c(':')} :</p>
${ex(`cat /etc/passwd
grep etudiant /etc/group`)}
${tbl(['Champ', 'Exemple', 'Sens'], [['1', 'etudiant', 'nom'], ['2', 'x', 'mot de passe (en réalité stocké, chiffré, dans /etc/shadow)'], ['3', '1000', 'UID'], ['4', '1000', 'GID du groupe primaire'], ['5', 'etudiant', 'commentaire (nom complet)'], ['6', '/home/etudiant', 'répertoire personnel'], ['7', '/bin/bash', 'shell de connexion']])}
<h2>Propriétaire et groupe d'un fichier</h2>
<p>${c('ls -l')} montre le propriétaire (3e colonne) et le groupe (4e). ${c('ls -n')} donne les numéros à la place des noms.</p>
${ex(`ls -l /home
ls -ln /home`)}
<h2>Changer d'utilisateur : su et sudo</h2>
${ul([`${c('su alice')} ouvre un shell au nom d'alice (avec <em>son</em> mot de passe) ; ${c('exit')} revient. Pratique ici pour tester ce qu'un autre utilisateur peut faire.`, `${c('sudo commande')} exécute une seule commande en tant que root, après <em>ton</em> mot de passe, si tu fais partie du groupe sudo.`, `${c('passwd')} change ton mot de passe.`])}
${ex(`su alice
whoami
cat /home/bob/prive.txt
exit
whoami`)}
<h2>chown et chgrp</h2>
${tbl(['Commande', 'Effet', 'Qui peut ?'], [[c('chown user fichier'), 'change le propriétaire', 'root seulement (donc ' + c('sudo chown') + ')'], [c('chown user:groupe fichier'), 'change propriétaire et groupe', 'root'], [c('chgrp groupe fichier'), 'change le groupe', 'le propriétaire, vers un groupe dont il est membre']])}
${ex(`chgrp info Documents/notes.txt
ls -l Documents/notes.txt
chown alice Documents/notes.txt
sudo chown alice Documents/notes.txt
ls -l Documents/notes.txt`)}
<p>Avec ${c('-R')}, chown et chgrp agissent sur tout le contenu d'un répertoire.</p>
${note('attention', 'Avec sudo, prudence', '<p>root n\'a aucune limite : une erreur avec sudo (un rm de trop) peut casser le système. Ne l\'utilise que quand c\'est nécessaire (installer un logiciel : ' + c('sudo apt install paquet') + ').</p>')}
`,
    retenir: ['id affiche UID, groupe primaire et groupes ; /etc/passwd décrit les comptes.', 'Chaque fichier a un propriétaire et un groupe (colonnes 3 et 4 de ls -l).', 'su change d\'utilisateur (exit pour revenir) ; sudo exécute en root ; chown réservé à root, chgrp vers un de ses groupes.'],
    ex: ['l14-q1', 'l14-q2', 'l14-q3', 'l14-q4', 'l14-t1', 'l14-t2']
  },
  {
    id: 'l15', part: 'p4', title: 'Les droits : le système rwx', skill: 'Expliquer qui peut faire quoi (u, g, o ; r, w, x)',
    lead: "Chaque fichier et répertoire porte des droits qui disent qui peut le lire, le modifier ou l'exécuter. Ils protègent ton travail des autres, et le système de tes erreurs.",
    obj: ['Les 3 catégories : u, g, o', 'Les 3 droits r, w, x et leur sens sur un fichier et sur un répertoire', 'Savoir quelle catégorie s\'applique à quel utilisateur'],
    body: () => `
<h2>Les 3 catégories</h2>
${tbl(['Lettre', 'Nom', 'Qui ?'], [[c('u'), 'User', 'le propriétaire du fichier'], [c('g'), 'Group', 'les membres du groupe du fichier'], [c('o'), 'Others', 'tous les autres']])}
<p>Le système prend la <strong>première</strong> catégorie qui te correspond : si tu es le propriétaire, ce sont les droits u qui comptent (même si g ou o sont plus larges) ; sinon, si tu es dans le groupe, les droits g ; sinon, les droits o.</p>
<h2>Les 3 droits</h2>
${tbl(['Droit', 'Sur un fichier', 'Sur un répertoire'], [[c('r') + ' read', 'lire son contenu', 'lister les noms qu\'il contient'], [c('w') + ' write', 'modifier son contenu', 'créer, renommer ou supprimer des fichiers dedans'], [c('x') + ' execute', 'le lancer comme un programme ou un script', 'le <strong>traverser</strong> : y entrer (cd) et accéder à ses fichiers']])}
${note('attention', 'Pièges classiques', ul([`Pour <strong>supprimer</strong> ou renommer un fichier, c'est le droit ${c('w')} du <strong>répertoire</strong> qui compte, pas celui du fichier.`, `Sans ${c('x')} sur un répertoire, impossible d'y entrer ou d'accéder à ses fichiers, même si on peut lister leurs noms avec r.`, `Pour lancer un script avec ${c('./script.sh')}, il faut ${c('x')} (et r, car bash doit le lire). ${c('bash script.sh')} n'a besoin que de r.`]))}
<h3>Laboratoire de permissions</h3>
<p>Coche des cases : le laboratoire écrit la chaîne ${c('ls -l')}, la valeur octale et les commandes ${c('chmod')} correspondantes, et explique en français ce que chacun peut faire.</p>
${permLab()}
<h2>Les droits en action</h2>
${ex(`./script.sh
chmod u+x script.sh
./script.sh
chmod o-r secret.txt
su bob
cat /home/etudiant/secret.txt
cat /home/etudiant/README.txt
exit`)}
<p>Le TD pose la question : <em>peut-on exécuter un programme sans avoir le droit de le lire ?</em> Pour un programme compilé, oui (le système le charge lui-même). Pour un script, non : l'interpréteur bash doit le lire.</p>
<h3>Et les liens symboliques ?</h3>
<p>Un lien symbolique (créé par ${c('ln -s cible nom')}, type ${c('l')} dans ls -l) affiche toujours ${c('rwxrwxrwx')} : ce sont les droits de la <strong>cible</strong> qui s'appliquent.</p>
`,
    retenir: ['u propriétaire, g groupe, o autres ; on prend la première catégorie qui te correspond.', 'Fichier : r lire, w modifier, x exécuter. Répertoire : r lister, w créer/supprimer dedans, x traverser.', 'Supprimer un fichier dépend du w du répertoire.'],
    ex: ['l15-q1', 'l15-q2', 'l15-q3', 'l15-q4', 'l15-q5', 'l15-t1', 'l15-t2']
  },
  {
    id: 'l16', part: 'p4', title: 'Lire les droits avec ls -l', skill: 'Lire une chaîne comme -rwxr-xr--',
    lead: "La commande ls -l affiche les droits sous la forme d'une chaîne de 10 caractères. Il suffit de savoir la découper.",
    obj: ['Découper type / u / g / o', 'Lire les autres colonnes de ls -l', 'Déduire ce qu\'un utilisateur donné peut faire'],
    body: () => `
<h2>Une chaîne de 10 caractères</h2>
${lsFig('-rwxr-xr--')}
${ul(['Le <strong>1er caractère</strong> : le type (' + c('-') + ' fichier, ' + c('d') + ' répertoire, ' + c('l') + ' lien symbolique).', 'Les <strong>9 suivants</strong> : 3 groupes de 3 pour <strong>u</strong>, <strong>g</strong>, <strong>o</strong>, toujours dans l\'ordre r, w, x.', 'Un tiret ' + c('-') + ' : le droit n\'est pas accordé.'])}
${tbl(['Catégorie', 'Droits', 'Ce que ça autorise'], [['u (propriétaire)', c('rwx'), 'lire, écrire, exécuter'], ['g (groupe)', c('r-x'), 'lire et exécuter'], ['o (autres)', c('r--'), 'lire seulement']])}
<h2>Les colonnes de ls -l</h2>
${ex(`ls -l script.sh Documents`)}
${tbl(['Colonne', 'Exemple', 'Sens'], [['1', c('-rw-r--r--'), 'type et droits'], ['2', '1', 'nombre de liens'], ['3', 'etudiant', 'propriétaire'], ['4', 'etudiant', 'groupe'], ['5', '52', 'taille en octets (4096 pour un répertoire)'], ['6', 'Sep 28 14:02', 'date de dernière modification'], ['7', 'script.sh', 'nom']])}
<h2>Des exemples réels</h2>
${ex(`ls -ld / /tmp /root /home/alice
ls -l /etc/passwd /etc/shadow`)}
${ul([c('drwxrwxrwt') + ' sur /tmp : tout le monde peut y créer des fichiers. Le ' + c('t') + ' final (<em>sticky bit</em>) empêche de supprimer les fichiers des autres.', c('drwx------') + ' sur /root : seul root peut entrer.', c('-rw-r-----') + ' sur /etc/shadow : les autres ne peuvent pas lire les mots de passe chiffrés.'])}
${lsFig('drwxr-x---')}
<p>${c('drwxr-x---')} : un répertoire ; son propriétaire peut lister, modifier et entrer ; le groupe peut lister et entrer (mais ni créer ni supprimer) ; les autres n'ont aucun droit.</p>
<h2>Entraîne-toi</h2>
${drillW('who', 'Qui peut faire quoi ?')}
`,
    retenir: ['Type + 3 blocs rwx : propriétaire, groupe, autres.', 'ls -l : droits, liens, propriétaire, groupe, taille, date, nom.', 'Un tiret = droit refusé.'],
    ex: ['l16-q1', 'l16-q2', 'l16-q3', 'l16-q4', 'l16-d1']
  },
  {
    id: 'l17', part: 'p4', title: 'chmod : la méthode symbolique', skill: 'Modifier des droits avec chmod u+x, go-rw, a=r',
    lead: "La commande chmod (change mode) modifie les droits. La méthode symbolique décrit le changement avec des lettres : qui, opération, quels droits.",
    obj: ['Écrire qui (u g o a), opérateur (+ - =) et droits (r w x)', 'Combiner plusieurs clauses avec des virgules', 'Utiliser -R et X'],
    body: () => `
<h2>Qui, quoi, comment</h2>
<p>Syntaxe : ${c('chmod [qui][opérateur][droits] fichier...')}</p>
${tbl(['Qui', '', 'Opérateur', '', 'Droits', ''], [[c('u'), 'propriétaire', c('+'), 'ajouter', c('r'), 'lire'], [c('g'), 'groupe', c('-'), 'retirer', c('w'), 'écrire'], [c('o'), 'autres', c('='), 'mettre exactement (remplace)', c('x'), 'exécuter / traverser'], [c('a'), 'tous (u+g+o)', '', '', c('X'), 'x seulement pour les répertoires (et fichiers déjà exécutables)']])}
${ex(`ls -l script.sh secret.txt
chmod u+x script.sh
chmod go-rw secret.txt
ls -l script.sh secret.txt
chmod a=r secret.txt
ls -l secret.txt`)}
${tbl(['Commande', 'Effet'], [[c('chmod u+x script.sh'), "ajoute l'exécution au propriétaire"], [c('chmod go-rw fichier.txt'), 'retire lecture et écriture au groupe et aux autres'], [c('chmod a=r fichier.txt'), 'lecture seule pour tout le monde (le reste est retiré)'], [c('chmod u+w,go-rw fichier'), 'deux clauses séparées par une virgule, sans espace'], [c('chmod -R go-rwx dossier'), 'retire tout aux autres, récursivement'], [c('chmod -R a+X dossier'), 'rend tous les sous-répertoires traversables, sans rendre les fichiers exécutables']])}
${note('convention', 'Sans lettre devant', `<p>${c('chmod +x fichier')} sans préciser qui ressemble à ${c('a+x')}, mais en respectant le umask (leçon suivante) : avec le umask habituel 022, tout le monde reçoit x.</p>`)}
<h2>Le + n'est pas le =</h2>
<p>${c('chmod g+w')} ajoute w au groupe en gardant ses autres droits ; ${c('chmod g=w')} ne lui laisse <strong>que</strong> w. Pour enlever tous les droits d'une catégorie : ${c('chmod o= fichier')}.</p>
<p>Seul le <strong>propriétaire</strong> d'un fichier (ou root) peut changer ses droits.</p>
<h2>Entraîne-toi</h2>
${drillW('sym', 'Résultat d\'un chmod symbolique')}
`,
    retenir: ['chmod [ugoa][+-=][rwx] fichier ; plusieurs clauses : u+x,go-w.', '+ ajoute, - retire, = remplace tous les droits de la catégorie.', '-R pour tout un répertoire ; X = x pour les répertoires seulement.'],
    ex: ['l17-q1', 'l17-q2', 'l17-q3', 'l17-q4', 'l17-t1', 'l17-t2', 'l17-t3', 'l17-d1']
  },
  {
    id: 'l18', part: 'p4', title: 'chmod : la méthode octale', skill: 'Convertir des droits en octal et utiliser chmod 755',
    lead: "Chaque droit vaut un nombre : r = 4, w = 2, x = 1. En additionnant, on obtient un chiffre de 0 à 7 par catégorie, et trois chiffres décrivent tous les droits.",
    obj: ['Convertir rwx ↔ chiffre octal', 'Utiliser chmod 755, 644, 600, 700', 'Choisir entre octal et symbolique'],
    body: () => `
<h2>Un chiffre par catégorie</h2>
<p>Chaque bloc de trois droits est un nombre binaire de 3 bits : r vaut 4, w vaut 2, x vaut 1. On additionne.</p>
${tbl(['Droits', 'r = 4', 'w = 2', 'x = 1', 'Chiffre'], [[c('---'), '0', '0', '0', '<strong>0</strong>'], [c('--x'), '0', '0', '1', '<strong>1</strong>'], [c('-w-'), '0', '1', '0', '<strong>2</strong>'], [c('-wx'), '0', '1', '1', '<strong>3</strong>'], [c('r--'), '1', '0', '0', '<strong>4</strong>'], [c('r-x'), '1', '0', '1', '<strong>5</strong>'], [c('rw-'), '1', '1', '0', '<strong>6</strong>'], [c('rwx'), '1', '1', '1', '<strong>7</strong>']])}
<p>On forme un nombre à trois chiffres, dans l'ordre u, g, o :</p>
<figure class="lsfig"><div class="ls-str"><span class="seg-u">rwx</span><span class="seg-g">r-x</span><span class="seg-o">r--</span></div><div class="ls-str"><span class="seg-u">4+2+1</span><span class="seg-g">4+0+1</span><span class="seg-o">4+0+0</span></div><div class="ls-str"><span class="seg-u">7</span><span class="seg-g">5</span><span class="seg-o">4</span></div></figure>
${ex(`ls -l /tmp
cp README.txt calcul
ls -l calcul
chmod 740 calcul
ls -l calcul
chmod 754 script.sh
ls -l script.sh`)}
<h3>Valeurs courantes</h3>
${tbl(['Octal', 'Chaîne', 'Usage typique'], [[c('644'), c('-rw-r--r--'), 'fichier ordinaire, lisible par tous'], [c('600'), c('-rw-------'), 'fichier privé (clé ssh privée)'], [c('755'), c('-rwxr-xr-x'), 'programme ou répertoire public'], [c('700'), c('-rwx------'), 'répertoire privé'], [c('750'), c('-rwxr-x---'), 'partagé avec le groupe seulement'], [c('444'), c('-r--r--r--'), 'lecture seule pour tous'], [c('777'), c('-rwxrwxrwx'), 'tout pour tout le monde : presque toujours une mauvaise idée']])}
<h2>Symbolique ou octal ?</h2>
<p>L'octal fixe <strong>tous</strong> les droits d'un coup (comme ${c('=')} sur les trois catégories). Le symbolique change <strong>un seul</strong> droit sans toucher aux autres. Exemple : rendre un script exécutable sans connaître ses droits actuels → ${c('chmod u+x')} ; mettre un répertoire en privé → ${c('chmod 700')}.</p>
<h2>Entraîne-toi</h2>
${drillW('str2oct', 'De rwx vers l\'octal')}
${drillW('oct2str', 'De l\'octal vers rwx')}
`,
    retenir: ['r = 4, w = 2, x = 1 ; on additionne par catégorie, dans l\'ordre u g o.', '644 fichier ordinaire, 600 privé, 755 programme/répertoire, 700 répertoire privé.', 'L\'octal fixe tout ; le symbolique modifie un droit précis.'],
    ex: ['l18-q1', 'l18-q2', 'l18-q3', 'l18-q4', 'l18-t1', 'l18-t2', 'l18-d1', 'l18-d2']
  },
  {
    id: 'l19', part: 'p4', title: 'Les droits par défaut : umask', skill: 'Prévoir les droits d\'un nouveau fichier grâce à umask',
    lead: "Pourquoi un nouveau fichier est-il en 644 et un nouveau répertoire en 755 ? À cause d'un masque, le umask, qui retire des droits à tout ce qu'on crée.",
    obj: ['Comprendre le masque : les bits présents dans umask sont retirés', 'Calculer les droits d\'un nouveau fichier (base 666) et d\'un répertoire (base 777)', 'Régler son umask'],
    body: () => `
<h2>Le masque</h2>
<p>Les programmes créent les fichiers avec des droits de départ maximaux : <strong>666</strong> (rw-rw-rw-) pour un fichier, car on n'accorde jamais x par défaut, et <strong>777</strong> pour un répertoire. Le <strong>umask</strong> indique les droits à <strong>retirer</strong>.</p>
${tbl(['', 'Fichier', 'Répertoire'], [['Départ', '666 rw-rw-rw-', '777 rwxrwxrwx'], ['umask 022 (habituel)', '<strong>644</strong> rw-r--r--', '<strong>755</strong> rwxr-xr-x'], ['umask 077 (privé)', '600 rw-------', '700 rwx------'], ['umask 027', '640 rw-r-----', '750 rwxr-x---'], ['umask 002 (travail en groupe)', '664 rw-rw-r--', '775 rwxrwxr-x']])}
<h2>Le calcul exact : retirer des bits</h2>
<p>Le umask n'est pas une soustraction : on <strong>enlève les droits présents dans le masque</strong>, chiffre par chiffre et droit par droit. Un droit déjà absent reste absent.</p>
${tbl(['', 'u', 'g', 'o'], [['départ fichier 666', c('rw-'), c('rw-'), c('rw-')], ['umask 037', c('---') + ' (0)', c('-wx') + ' (3)', c('rwx') + ' (7)'], ['on retire', c('rw-'), c('r--'), c('---')], ['résultat', '<strong>6</strong>', '<strong>4</strong>', '<strong>0</strong>']])}
${note('attention', 'Piège de calcul', `<p>Avec umask 037, la soustraction 666 − 037 donnerait 627, ce qui est <strong>faux</strong> : le x à retirer pour le groupe n'existait pas. Le bon résultat est <strong>640</strong>. Quand tous les chiffres du masque sont 0, 2 ou 6, la soustraction donne le même résultat, mais ne compte pas dessus.</p>`)}
${ex(`umask
umask -S
touch a.txt
mkdir d
ls -ld a.txt d
umask 077
touch b.txt
mkdir e
ls -ld b.txt e`)}
${ul([`${c('umask')} affiche le masque (0022), ${c('umask -S')} les droits <em>accordés</em> en symbolique.`, `${c('umask 077')} règle le masque pour le shell courant, et pour les <strong>futurs</strong> fichiers seulement.`, 'Pour le garder à chaque connexion, on écrit la commande dans ' + c('~/.bashrc') + '.'])}
<h2>Entraîne-toi</h2>
${drillW('umask', 'Droits par défaut avec umask')}
`,
    retenir: ['umask retire des droits aux nouveaux fichiers (base 666) et répertoires (base 777).', '022 → 644 et 755 ; 077 → 600 et 700.', 'Ce n\'est pas une soustraction : on retire les bits du masque (037 → 640 pour un fichier).'],
    ex: ['l19-q1', 'l19-q2', 'l19-q3', 'l19-q4', 'l19-t1', 'l19-d1']
  },
  {
    id: 'l20', part: 'p4', title: 'Les ACL : des droits à la carte', skill: 'Donner un droit à un utilisateur précis avec setfacl et lire getfacl',
    lead: "Avec u, g et o, impossible de dire « mon binôme peut modifier, les enseignants peuvent lire, les autres rien ». Les listes de contrôle d'accès (ACL) le permettent.",
    obj: ['Lire getfacl et repérer le + de ls -l', 'Ajouter et retirer des entrées avec setfacl -m / -x', 'Comprendre le masque et les droits effectifs', 'Connaître les ACL par défaut des répertoires'],
    body: () => `
<h2>Pourquoi des ACL ?</h2>
<p>Le système historique d'Unix ne connaît que trois catégories. Les <strong>ACL</strong> (<em>Access Control Lists</em>) ajoutent des droits pour des utilisateurs ou des groupes <strong>nommés</strong>. Exemple : permettre à mon binôme alice de modifier les fichiers de mon projet et au groupe info de les lire, sans rien donner aux autres.</p>
<h2>Lire les ACL : getfacl</h2>
${ex(`getfacl Documents/notes.txt
setfacl -m u:alice:rw Documents/notes.txt
setfacl -m g:info:r Documents/notes.txt
getfacl Documents/notes.txt
ls -l Documents/notes.txt`)}
${tbl(['Ligne', 'Sens'], [[c('user::rw-'), 'droits du propriétaire'], [c('user:alice:rw-'), 'droits de l\'utilisateur nommé alice'], [c('group::r--'), 'droits du groupe du fichier'], [c('group:info:r--'), 'droits du groupe nommé info'], [c('mask::rw-'), 'le <strong>masque</strong> : la limite des droits accordés par les ACL'], [c('other::r--'), 'droits des autres']])}
<p>Dans ${c('ls -l')}, un ${c('+')} après les droits signale des ACL. <strong>Attention</strong> : le 2e bloc affiche alors le <strong>masque</strong>, et non plus les droits du groupe.</p>
<h2>Le masque et les droits effectifs</h2>
<p>Le masque limite tout ce qui est accordé par les ACL (utilisateurs nommés, groupe, groupes nommés). Le droit <strong>effectif</strong> est l'intersection : un droit doit être à la fois dans l'entrée ET dans le masque. Par exemple, une entrée rw- avec un masque r-x donne r-- ; getfacl l'indique par ${c('#effective:r--')}.</p>
${ex(`setfacl -m u:alice:rw,g:info:rwx Documents/notes.txt
getfacl Documents/notes.txt
chmod 640 Documents/notes.txt
getfacl Documents/notes.txt`)}
${note('attention', 'chmod et les ACL', `<p>Sur un fichier avec ACL, ${c('chmod')} sur le groupe modifie le <strong>masque</strong> : ${c('chmod 640')} a réduit alice et info à r--. Leurs entrées existent toujours, mais elles sont neutralisées. Une fois des ACL en place, modifie les droits avec ${c('setfacl')}.</p>`)}
<h2>Modifier les ACL : setfacl</h2>
${tbl(['Commande', 'Effet'], [[c('setfacl -m u:alice:rwx f'), 'donner (ou remplacer) des droits à l\'utilisateur alice'], [c('setfacl -m g:info:r f'), 'à un groupe'], [c('setfacl -m m::rx f'), 'fixer le masque'], [c('setfacl -x u:alice f'), 'retirer l\'entrée d\'alice'], [c('setfacl -b f'), 'retirer toutes les ACL'], [c('setfacl -R -m …'), 'récursivement']])}
<h2>Les ACL par défaut</h2>
<p>Un <strong>répertoire</strong> peut porter des ACL <strong>par défaut</strong> (préfixe ${c('d:')} ou option ${c('-d')}) : tout fichier créé dedans en hérite. Un enseignant crée ainsi un répertoire où tout ce qu'il dépose est automatiquement lisible par les étudiants.</p>
${ex(`mkdir projet
setfacl -m d:u:alice:rwx projet
touch projet/rapport.txt
getfacl projet/rapport.txt`)}
<p>Côté commandes : ${c('mv')} conserve les ACL, ${c('cp')} seulement avec ${c('-p')}.</p>
<h2>Entraîne-toi</h2>
${drillW('acl', 'Droit effectif avec le masque')}
`,
    retenir: ['getfacl lit, setfacl -m u:nom:rwx ajoute, -x retire, -b efface tout.', 'Un + dans ls -l = ACL ; le 2e bloc est alors le masque.', 'Droit effectif = entrée ∩ masque ; chmod sur le groupe change le masque.'],
    ex: ['l20-q1', 'l20-q2', 'l20-q3', 'l20-q4', 'l20-t1', 'l20-d1']
  },
  {
    id: 'l21', part: 'p4', title: 'Chiffrer ses données', skill: 'Distinguer chiffrement symétrique et asymétrique et chiffrer un fichier',
    lead: "Les droits protègent un fichier tant que le système est respecté. Si le disque est volé ou l'administrateur indiscret, seul le chiffrement protège vraiment le contenu.",
    obj: ['Comprendre symétrique (un secret) et asymétrique (clé publique / clé privée)', 'Chiffrer avec ccrypt ou openssl enc', 'Vérifier avec diff'],
    body: () => `
<h2>Deux familles</h2>
${tbl(['', 'Symétrique', 'Asymétrique'], [['clés', 'une seule, partagée (un mot de passe)', 'une paire : publique + privée'], ['chiffrer avec', 'la clé', 'la clé <strong>publique</strong> du destinataire'], ['déchiffrer avec', 'la même clé', 'la clé <strong>privée</strong> du destinataire'], ['exemples', 'AES, ccrypt', 'RSA (comme les clés ssh)'], ['problème', 'transmettre le secret sans qu\'il soit intercepté', 'plus lent ; il faut être sûr de la clé publique']])}
<p>Inversement, si l'on chiffre avec sa clé <strong>privée</strong>, tout le monde peut déchiffrer avec la clé publique, ce qui prouve qui est l'auteur : c'est la <strong>signature numérique</strong>. Les mathématiques derrière (arithmétique modulaire, RSA) sont vues en cours de maths.</p>
<h2>Chiffrer avec un mot de passe</h2>
<p>${c('ccrypt')} chiffre un fichier avec un mot de passe (il devient ${c('fichier.cpt')}), et ${c('ccrypt -d')} le déchiffre. ${c('openssl enc')} fait de même avec l'algorithme de son choix :</p>
${sh(`$ echo "Je suis clair" > clair.txt
$ openssl enc -aes-128-cbc -in clair.txt -out chiffre.txt
enter aes-128-cbc encryption password:
Verifying - enter aes-128-cbc encryption password:
$ openssl enc -aes-128-cbc -d -in chiffre.txt -out dechiffre.txt
enter aes-128-cbc decryption password:
$ diff clair.txt dechiffre.txt
$`, 'diff n\'affiche rien : les deux fichiers sont identiques, le déchiffrement a réussi.')}
<h2>Chiffrer avec une clé</h2>
${sh(`$ # une seule fois : extraire la partie publique de la clé, au format PEM
$ openssl rsa -in ~/.ssh/id_rsa -pubout -out ~/.ssh/id_rsa.pub.pem
$ # l'expéditeur chiffre avec la clé PUBLIQUE du destinataire
$ openssl pkeyutl -encrypt -pubin -inkey id_rsa.pub.pem -in clair.txt -out chiffre2.txt
$ # le destinataire déchiffre avec sa clé PRIVÉE
$ openssl pkeyutl -decrypt -inkey ~/.ssh/id_rsa -in chiffre2.txt -out dechiffre2.txt
$ diff clair.txt dechiffre2.txt`, 'Les anciennes versions d\'OpenSSL (et le sujet de TD) écrivent rsautl au lieu de pkeyutl.')}
<h2>Comparer deux fichiers : diff</h2>
<p>${c('diff f1 f2')} n'affiche rien si les fichiers sont identiques ; sinon, il montre les lignes différentes (${c('<')} pour f1, ${c('>')} pour f2).</p>
${ex(`echo "Je suis clair" > clair.txt
cp clair.txt copie.txt
diff clair.txt copie.txt
echo "modifié" >> copie.txt
diff clair.txt copie.txt`)}
<h2>Chiffrer tout un disque</h2>
<p>Pour ne pas y penser fichier par fichier : chiffrement du disque entier (${c('cryptsetup')}, LUKS, proposé à l'installation de Debian ou Ubuntu) ou d'un système de fichiers (${c('ecryptfs')}).</p>
`,
    retenir: ['Symétrique : un même secret chiffre et déchiffre (ccrypt, openssl enc -aes…).', 'Asymétrique : on chiffre avec la clé publique du destinataire, il déchiffre avec sa clé privée.', 'diff f1 f2 : rien affiché = fichiers identiques.'],
    ex: ['l21-q1', 'l21-q2', 'l21-q3', 'l21-q4', 'l21-t1']
  },

  /* =================================================================== PARTIE 5 */
  {
    id: 'l22', part: 'p5', title: 'Compiler et exécuter un programme', skill: 'Compiler et lancer un programme Java ou C++ depuis le terminal',
    lead: "Les IDE cachent deux étapes : compiler le code source, puis lancer le programme obtenu. Dans le terminal, on les fait soi-même, et on comprend mieux les erreurs.",
    obj: ['Compiler et lancer du Java : javac puis java', 'Compiler du C++ avec g++ -o et lancer ./programme', 'Comprendre pourquoi il faut ./ et le droit x (PATH)'],
    body: () => `
<h2>Java : javac puis java</h2>
<p>${c('javac Fichier.java')} compile le code source en <strong>bytecode</strong> (${c('Fichier.class')}) ; ${c('java Fichier')} lance la méthode ${c('main')} de cette classe. On donne le nom de la <strong>classe</strong>, sans ${c('.class')}.</p>
${ex(`ls
javac Bonjour.java
ls
java Bonjour
java Bonjour.class`, { cwd: 'Projets/tp1' })}
<p>Les erreurs de compilation partent sur la sortie d'erreur ; ${c('javac')} indique le fichier, la ligne et un ${c('^')} sous l'endroit fautif :</p>
${ex(`javac Erreur.java`, { cwd: 'Projets/tp1' })}
<p>Depuis Java 11, ${c('java Fichier.java')} compile et lance en une seule commande (pratique pour un petit programme).</p>
${note('convention', 'Lien avec le cours d\'algo', `<p>C'est exactement ce que fait NetBeans quand tu cliques sur <em>Run</em>. Et une classe ${c('public class Bonjour')} doit être dans un fichier nommé exactement ${c('Bonjour.java')}.</p>`)}
<h2>C++ : g++</h2>
<p>${c('g++ prog.cpp')} compile et produit un exécutable nommé ${c('a.out')} par défaut ; ${c('-o nom')} choisit son nom, ${c('-Wall')} active tous les avertissements.</p>
${ex(`g++ -Wall hello.cpp -o hello
ls -l hello
./hello
g++ hello.cpp
./a.out`, { cwd: 'Projets/tp1' })}
<h2>Pourquoi ./ ?</h2>
<p>Quand on tape ${c('ls')}, le shell cherche un programme nommé ls dans une liste de répertoires, la variable ${c('PATH')} (/usr/bin, /bin…). Le répertoire courant n'en fait pas partie, par sécurité. Pour lancer un programme qui est ici, on donne son chemin : ${c('./hello')} (« hello, dans le répertoire courant »).</p>
${ex(`hello
./hello`, { cwd: 'Projets/tp1', pre: ['g++ hello.cpp -o hello'] })}
<h2>Les scripts</h2>
<p>Un script est un fichier texte qui contient des commandes. La première ligne ${c('#!/bin/bash')} (le <em>shebang</em>) indique quel interpréteur doit le lire. Pour le lancer avec ${c('./')}, il faut le droit x.</p>
${ex(`cat script.sh
./script.sh
bash script.sh
chmod u+x script.sh
./script.sh`)}
<p>La programmation de scripts shell (variables, conditions, boucles) est le programme de la période 2.</p>
`,
    retenir: ['javac F.java → F.class ; java F (sans .class) lance main.', 'g++ -Wall f.cpp -o prog puis ./prog (a.out par défaut).', './ car le répertoire courant n\'est pas dans PATH ; un script lancé par ./ doit avoir x.'],
    ex: ['l22-q1', 'l22-q2', 'l22-q3', 'l22-q4', 'l22-t1', 'l22-t2', 'l22-t3']
  },
  {
    id: 'l23', part: 'p5', title: 'Processus et tâches', skill: 'Lancer, suspendre, reprendre et arrêter des programmes',
    lead: "Chaque programme qui tourne est un processus, avec un numéro (PID). Le shell sait lancer une commande en arrière-plan, la suspendre, la reprendre ou l'arrêter.",
    obj: ['Lister les processus avec ps', 'Lancer en arrière-plan avec &, suspendre avec Ctrl+Z', 'Gérer les tâches : jobs, fg, bg', 'Arrêter : Ctrl+C, kill, kill -9'],
    body: () => `
<h2>Processus et PID</h2>
<p>Un <strong>processus</strong> est un programme en cours d'exécution. Le système lui donne un numéro unique, le <strong>PID</strong>. Ton shell lui-même est un processus (bash) ; chaque commande que tu lances en crée un nouveau.</p>
${ex(`ps
ps -ef`)}
<p>${c('ps')} montre les processus de ton terminal ; ${c('ps -ef')} (ou ${c('ps aux')}) tous ceux du système, avec leur propriétaire (UID) et leur parent (PPID).</p>
<h2>Premier plan, arrière-plan</h2>
<p>Normalement, une commande s'exécute au <strong>premier plan</strong> : le shell attend qu'elle finisse avant d'afficher l'invite. Un ${c('&')} à la fin la lance en <strong>arrière-plan</strong> : l'invite revient tout de suite. Le shell affiche le numéro de tâche [1] et le PID.</p>
${ex(`sleep 100 &
sleep 200 &
jobs
ps`)}
<h2>Suspendre, reprendre, arrêter</h2>
${tbl(['Action', 'Commande'], [['arrêter la commande au premier plan', '<kbd>Ctrl</kbd>+<kbd>C</kbd>'], ['la suspendre (pause)', '<kbd>Ctrl</kbd>+<kbd>Z</kbd>'], ['lister les tâches du terminal', c('jobs')], ['remettre une tâche au premier plan', c('fg') + ' ou ' + c('fg %2')], ['relancer une tâche suspendue en arrière-plan', c('bg') + ' ou ' + c('bg %1')], ['demander l\'arrêt d\'un processus', c('kill PID') + ' ou ' + c('kill %1')], ['forcer l\'arrêt', c('kill -9 PID')]])}
<p>Scénario typique : tu lances ${c('gedit notes.txt')} sans ${c('&')} ; le terminal est bloqué. <kbd>Ctrl</kbd>+<kbd>Z</kbd> le suspend (gedit ne répond plus), puis ${c('bg')} le relance en arrière-plan : gedit et le terminal fonctionnent tous les deux.</p>
<p>Essaie dans le terminal simulé : tape ${c('sleep 100')}, puis <kbd>Ctrl</kbd>+<kbd>Z</kbd> (ou le bouton Ctrl+Z sous le terminal), ${c('jobs')}, ${c('bg')}, ${c('jobs')}, ${c('kill %1')}.</p>
<h2>Les signaux</h2>
<p>${c('kill')} envoie un <strong>signal</strong> à un processus. Par défaut ${c('TERM')} (15), une demande polie d'arrêt ; ${c('-9')} (KILL) le tue sans lui laisser le choix, à réserver aux programmes bloqués. <kbd>Ctrl</kbd>+<kbd>C</kbd> envoie INT, <kbd>Ctrl</kbd>+<kbd>Z</kbd> envoie TSTP. On ne peut envoyer de signal qu'à ses propres processus (sauf root).</p>
${ex(`sleep 300 &
jobs
kill %1
jobs
kill 1`)}
`,
    retenir: ['Processus = programme qui tourne, identifié par son PID ; ps, ps -ef.', 'commande & = arrière-plan ; Ctrl+Z suspend, bg relance derrière, fg ramène devant, jobs liste.', 'Ctrl+C arrête ; kill PID (ou %N) demande l\'arrêt, kill -9 force.'],
    ex: ['l23-q1', 'l23-q2', 'l23-q3', 'l23-q4', 'l23-t1', 'l23-t2']
  }
];
