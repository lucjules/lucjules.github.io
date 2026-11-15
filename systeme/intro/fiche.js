/* Intro système : la fiche recto verso autorisée au contrôle (une feuille A4).
   Volontairement basique : le recto pour les fichiers (se déplacer, créer, copier, lire, modifier, rediriger),
   le verso pour les permissions. Une commande = une ligne :
   F('ls', [['-l', 'détails'], ['-a', 'cachés']], 'liste le dossier') → « ls [-l : détails, -a : cachés] : liste le dossier ».
   Les FICHE_RECTO premières parties vont au recto, les autres au verso. */
const FICHE_RECTO = 7;
const F = (cmd, opts, desc) => `<p class="fc"><b>${esc(cmd)}</b>${opts.length ? ' <span class="fo">[' + opts.map(o => `<code>${esc(o[0])}</code> : ${o[1]}`).join(', ') + ']</span>' : ''} : ${desc}</p>`;
const FT = (head, rows, w) => `<table class="ft">${w ? '<colgroup>' + w.map(x => `<col style="width:${x}%">`).join('') + '</colgroup>' : ''}<thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const FS = (titre, html) => `<section class="fs"><h3>${titre}</h3>${html}</section>`;
const FP = html => `<p class="fc">${html}</p>`;
const k = s => `<code>${esc(s)}</code>`;

const FICHE = () => [
  /* ---------------------------------------------------------------- RECTO : les fichiers */
  FS('Se déplacer', `
${FP(`${k('/')} racine · ${k('~')} mon dossier perso · ${k('.')} ici · ${k('..')} dossier parent`)}
${FP('Chemin absolu = commence par / · relatif = depuis le dossier courant')}
${F('pwd', [], 'affiche où je suis')}
${F('cd', [['..', 'remonter'], ['-', 'dossier précédent']], 'va dans un dossier ; seul : retour au dossier perso')}
${F('ls', [['-l', 'détails et droits'], ['-a', 'fichiers cachés'], ['-R', 'sous-dossiers']], 'liste le dossier')}
${F('tree', [], 'affiche l\'arborescence')}`),
  FS('Créer et supprimer', `
${F('mkdir', [['-p', 'avec les dossiers parents']], 'crée un dossier')}
${F('touch', [], 'crée un fichier vide')}
${F('rmdir', [], 'supprime un dossier vide')}
${F('rm', [['-r', 'dossier et son contenu'], ['-i', 'demander avant'], ['-f', 'forcer']], 'supprime, définitif, pas de corbeille')}`),
  FS('Copier, déplacer, renommer', `
${F('cp', [['-r', 'copier un dossier']], 'copie')}
${F('mv', [], 'déplace ou renomme')}
${FP(`${k('mv a.txt b.txt')} renomme · ${k('mv a.txt Docs/')} déplace dans Docs`)}
${FP('Si la destination est un dossier existant, le fichier va dedans ; sinon, c\'est le nouveau nom')}`),
  FS('Lire et modifier un fichier', `
${F('cat', [['-n', 'numéroter les lignes']], 'affiche tout le fichier')}
${F('less', [], 'affiche page par page ; q pour quitter')}
${F('head', [['-n X', 'X lignes']], 'affiche le début, 10 lignes')}
${F('tail', [['-n X', 'X lignes']], 'affiche la fin, 10 lignes')}
${F('nano', [], 'modifie le fichier dans le terminal ; Ctrl+O enregistrer, Ctrl+X quitter')}
${F('echo', [], 'affiche un texte')}
${F('wc', [['-l', 'lignes'], ['-w', 'mots']], 'compte')}`),
  FS('Rediriger et joindre', `
${FT(['Écriture', 'Effet'], [[k('cmd > f'), 'écrit le résultat dans f, écrase'], [k('cmd >> f'), 'ajoute à la fin de f'], [k('cmd < f'), 'lit f au lieu du clavier'], [k('cmd 2> f'), 'erreurs dans f'], [k('cmd1 | cmd2'), 'résultat de cmd1 → cmd2']], [32, 68])}
${FP(`${k('echo "texte" > f')} écrit dans f · ${k('cat a b > c')} joint a et b dans c`)}
${F('grep', [['-i', 'sans majuscules'], ['-v', 'lignes sans le mot'], ['-c', 'compter']], 'garde les lignes qui contiennent un mot')}
${F('sort', [['-n', 'nombres'], ['-r', 'inverse']], 'trie les lignes')}`),
  FS('Jokers', `
${FT(['Joker', 'Remplace'], [[k('*'), 'n\'importe quoi'], [k('?'), 'un seul caractère'], [k('[abc]'), 'a, b ou c']], [30, 70])}
${FP(`${k('ls *.txt')} tous les .txt · ${k('rm tp?')} tp1, tp2…`)}`),
  FS('Aide et clavier', `
${F('man', [], 'manuel d\'une commande ; q pour quitter')}
${FP(`${k('Tab')} compléter un nom · ${k('↑')} commande précédente · ${k('Ctrl+C')} arrêter · ${k('clear')} effacer`)}`),

  /* ---------------------------------------------------------------- VERSO : les permissions */
  FS('Lire ls -l', `
${FP(`${k('-rwxr-x---')} : 1 caractère de type, puis 3 blocs de 3`)}
${FT(['Partie', 'Exemple', 'Sens'], [['type', k('-') + ' ' + k('d'), 'fichier, dossier'], [k('u'), k('rwx'), 'propriétaire'], [k('g'), k('r-x'), 'groupe'], [k('o'), k('---'), 'les autres']], [20, 30, 50])}
${FP('Colonnes : droits, liens, propriétaire, groupe, taille, date, nom · un tiret = droit refusé')}`),
  FS('Les droits r w x', `
${FT(['Droit', 'Sur un fichier', 'Sur un dossier'], [[k('r') + ' 4', 'lire', 'lister le contenu'], [k('w') + ' 2', 'modifier', 'créer, supprimer dedans'], [k('x') + ' 1', 'exécuter', 'entrer avec cd']], [18, 34, 48])}
${FP('Supprimer un fichier : il faut w sur le <b>dossier</b> · entrer dans un dossier : il faut x · lancer ./script : il faut x')}`),
  FS('chmod symbolique', `
${F('chmod', [['-R', 'dossier et contenu']], 'change les droits')}
${FP(`Qui : ${k('u')} propriétaire · ${k('g')} groupe · ${k('o')} autres · ${k('a')} tous`)}
${FP(`Opération : ${k('+')} ajoute · ${k('-')} retire · ${k('=')} remplace`)}
${FT(['Commande', 'Effet'], [[k('chmod u+x f'), 'propriétaire peut exécuter'], [k('chmod go-rw f'), 'groupe et autres ne lisent ni n\'écrivent'], [k('chmod a=r f'), 'lecture seule pour tous'], [k('chmod u+x,g-w f'), 'deux changements']], [42, 58])}`),
  FS('chmod octal', `
${FP('r = 4, w = 2, x = 1 : on additionne pour u, puis g, puis o')}
${FP(['rwx', 'rw-', 'r-x', 'r--', '-wx', '-w-', '--x', '---'].map((s, i) => `${k(s)} = ${7 - i}`).join(' · '))}
${FT(['Octal', 'Droits', 'Pour'], [[k('755'), k('rwxr-xr-x'), 'dossier, programme'], [k('644'), k('rw-r--r--'), 'fichier normal'], [k('700'), k('rwx------'), 'dossier privé'], [k('600'), k('rw-------'), 'fichier privé'], [k('750'), k('rwxr-x---'), 'partagé avec le groupe']], [18, 40, 42])}
${FP(`${k('chmod 754 f')} = rwx r-x r-- · octal = tout fixer d'un coup`)}`),
  FS('umask', `
${F('umask', [], 'affiche ou règle les droits retirés aux nouveaux fichiers')}
${FP('On part de 666 pour un fichier, de 777 pour un dossier, et on enlève les droits du masque')}
${FT(['umask', 'Nouveau fichier', 'Nouveau dossier'], [[k('022'), '644', '755'], [k('077'), '600', '700'], [k('027'), '640', '750'], [k('002'), '664', '775']], [26, 37, 37])}`),
  FS('Propriétaire', `
${F('whoami', [], 'mon nom d\'utilisateur')}
${F('id', [], 'mon numéro et mes groupes')}
${F('chown', [], 'change le propriétaire ; il faut sudo')}
${F('chgrp', [], 'change le groupe')}
${F('sudo', [], 'lance une commande en administrateur')}`),
  FS('Erreurs', `
${FT(['Message', 'Cause'], [[k('Permission denied'), 'il manque un droit : regarder ls -l'], [k('No such file or directory'), 'mauvais nom ou chemin'], [k('Is a directory'), 'il faut -r'], [k('Operation not permitted'), 'pas le propriétaire']], [52, 48])}`)
];
