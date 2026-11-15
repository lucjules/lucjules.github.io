/* Intro système : la fiche recto verso autorisée au contrôle (une feuille A4).
   Une commande = une ligne : F('ls', [['-l', 'détails'], ['-a', 'cachés']], 'liste le dossier')
   s'affiche « ls [-l : détails, -a : cachés] : liste le dossier ». Seulement les options vues en TD, pas d'exemples.
   Les FICHE_RECTO premières parties vont au recto, les autres au verso (chaque face a ses propres colonnes). */
const FICHE_RECTO = 10;
const F = (cmd, opts, desc) => `<p class="fc"><b>${esc(cmd)}</b>${opts.length ? ' <span class="fo">[' + opts.map(o => `<code>${esc(o[0])}</code> : ${o[1]}`).join(', ') + ']</span>' : ''} : ${desc}</p>`;
const FT = (head, rows, w) => `<table class="ft">${w ? '<colgroup>' + w.map(x => `<col style="width:${x}%">`).join('') + '</colgroup>' : ''}<thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const FS = (titre, html) => `<section class="fs"><h3>${titre}</h3>${html}</section>`;
const FP = html => `<p class="fc">${html}</p>`;
const k = s => `<code>${esc(s)}</code>`;

const FICHE = () => [
  FS('Le shell', `
${FP(`<b>commande -options arguments</b> · ${k('-l -a')} = ${k('-la')}`)}
${FP(`${k('Tab')} compléter · ${k('↑')} historique · ${k('Ctrl+C')} arrêter · ${k('Ctrl+Z')} suspendre · ${k('Ctrl+D')} quitter · ${k('Ctrl+L')} effacer · ${k('Ctrl+R')} chercher`)}
${FP(`${k('a ; b')} l'un puis l'autre · ${k('a && b')} b si a réussit · ${k('a || b')} b si a échoue`)}
${FP(`${k('$USER')} · ${k('$HOME')} · ${k('$?')} code retour, 0 = ok · ${k('$PATH')}`)}`),
  FS('Aide', `
${F('man', [['-k', 'chercher']], 'manuel ; /mot chercher, q quitter')}
${F('apropos', [], 'chercher une commande par mot-clé')}
${F('help', [], 'aide des commandes internes : cd, echo…')}
${F('type', [], 'interne ou programme ?')}
${FP(`Synopsis : ${k('[ ]')} facultatif · MAJUSCULE à remplacer · ${k('...')} répétable · ${k('|')} au choix`)}`),
  FS('Se déplacer', `
${FP(`${k('/')} racine · ${k('~')} accueil · ${k('.')} ici · ${k('..')} parent · absolu = commence par /`)}
${F('pwd', [], 'affiche où je suis')}
${F('cd', [['-', 'précédent'], ['..', 'parent']], 'change de dossier ; seul : accueil')}
${F('ls', [['-l', 'détails'], ['-a', 'cachés'], ['-t', 'par date'], ['-r', 'inverse'], ['-R', 'récursif'], ['-d', 'le dossier lui-même']], 'liste le dossier')}
${F('tree', [], 'arborescence')}
${F('du', [['-s', 'total'], ['-h', 'lisible']], 'taille d\'un dossier')}
${F('quota', [['-s', 'lisible']], 'espace utilisé du compte')}`),
  FS('Fichiers et dossiers', `
${F('mkdir', [['-p', 'avec les parents']], 'crée un dossier')}
${F('rmdir', [], 'supprime un dossier vide')}
${F('touch', [], 'crée un fichier vide / met à jour la date')}
${F('cp', [['-r', 'dossier'], ['-i', 'demander'], ['-v', 'afficher']], 'copie')}
${F('mv', [['-i', 'demander']], 'déplace ou renomme')}
${F('rm', [['-r', 'dossier'], ['-i', 'demander'], ['-f', 'forcer']], 'supprime, définitif')}
${F('ln', [['-s', 'symbolique']], 'crée un lien')}
${F('file', [], 'type d\'après le contenu')}
${FP('cp, mv : destination = dossier existant → dedans, sinon → nouveau nom')}`),
  FS('Afficher', `
${F('cat', [['-n', 'numéroter']], 'affiche tout')}
${F('less / more', [], 'page par page ; q quitter')}
${F('head', [['-n X', 'X lignes']], 'début, 10 lignes')}
${F('tail', [['-n X', 'X lignes']], 'fin, 10 lignes')}
${F('wc', [['-l', 'lignes'], ['-w', 'mots'], ['-c', 'octets']], 'compte')}
${F('echo', [['-n', 'sans retour ligne']], 'affiche le texte')}
${F('clear', [], 'efface l\'écran')}
${F('date', [['-d', 'autre date']], 'date et heure')}
${F('cal', [], 'calendrier ; cal mois année')}
${F('history', [], 'commandes tapées')}
${F('exit', [], 'ferme le shell')}`),
  FS('Éditer et ouvrir', `
${F('code', [], 'VS Code ; code . = dossier courant')}
${F('gedit', [], 'éditeur simple, fenêtre')}
${F('nano', [], 'éditeur terminal ; ^O enregistrer, ^X quitter')}
${F('vim', [], 'éditeur terminal ; i écrire, Échap :wq enregistrer et quitter')}
${F('evince', [], 'ouvre un PDF')}
${F('xdg-open', [], 'ouvre avec le programme par défaut')}`),
  FS('Jokers', `
${FT(['Motif', 'Sens'], [[k('*'), 'n\'importe quelle suite'], [k('?'), '1 caractère'], [k('[abc]'), '1 parmi a, b, c'], [k('[a-e]'), '1 de a à e'], [k('[!abc]'), '1 sauf a, b, c']], [30, 70])}
${FP(`Remplacés par le shell · ${k('"…"')} ${k("'…'")} ${k('\\')} protègent · aucun résultat → motif inchangé`)}`),
  FS('Archiver, compresser', `
${F('gzip', [['-k', 'garder l\'original'], ['-v', 'gain'], ['-9', 'fort']], 'compresse en .gz')}
${F('gunzip', [], 'décompresse un .gz')}
${F('zcat / zless', [], 'lit un .gz sans décompresser')}
${F('bzip2 / bunzip2', [], 'idem en .bz2')}
${F('tar', [['-c', 'créer'], ['-t', 'lister'], ['-x', 'extraire'], ['-f', 'nom archive'], ['-v', 'afficher'], ['-z', 'gzip'], ['-j', 'bzip2']], 'archive ; tar -cvf a.tar dossier')}`),
  FS('Redirections', `
${FT(['', 'Effet'], [[k('> f'), 'sortie dans f, écrase'], [k('>> f'), 'sortie à la fin de f'], [k('< f'), 'entrée depuis f'], [k('2> f'), 'erreurs dans f'], [k('> f 2>&1'), 'sortie + erreurs dans f'], [k('2> /dev/null'), 'jeter les erreurs'], [k('a | b'), 'sortie de a → entrée de b'], [k('a &'), 'arrière-plan']], [38, 62])}
${FP('0 stdin clavier · 1 stdout écran · 2 stderr écran')}`),
  FS('Filtres', `
${F('grep', [['-i', 'sans casse'], ['-v', 'inverse'], ['-c', 'compter'], ['-n', 'n° ligne']], 'garde les lignes avec le motif')}
${F('sort', [['-n', 'numérique'], ['-r', 'inverse'], ['-t:', 'séparateur'], ['-k N', 'champ N'], ['-u', 'sans doublon']], 'trie')}
${F('uniq', [['-c', 'compter']], 'fusionne les lignes voisines, après sort')}
${F('cut', [['-d:', 'séparateur'], ['-f N', 'champ N'], ['-c N-M', 'caractères']], 'extrait des colonnes')}
${F('join', [], 'joint 2 fichiers triés sur le 1er champ')}
${F('tr', [['-d', 'supprimer']], 'remplace des caractères, lit l\'entrée')}
${F('diff', [], 'différences, rien = identiques')}
${FP(`Regex : ${k('^')} début · ${k('$')} fin · ${k('.')} 1 caractère · ${k('*')} répété`)}`),
  FS('Codage', `
${FP('ASCII 7 bits, 128 car. · Latin-1 8 bits, é = E9 · Unicode U+xxxx · UTF-8 1 à 4 octets, é = C3 A9')}
${FT(['n', 'Jusqu\'à', 'Bits'], [['1', 'U+7F', k('0xxxxxxx')], ['2', 'U+7FF', k('110xxxxx 10xxxxxx')], ['3', 'U+FFFF', k('1110xxxx') + ' + 2 × ' + k('10xxxxxx')], ['4', 'U+10FFFF', k('11110xxx') + ' + 3 × ' + k('10xxxxxx')]], [11, 25, 64])}
${FP('UTF-8 lu en Latin-1 → Ã© · Latin-1 lu en UTF-8 → �')}
${F('od', [['-c', 'caractères'], ['-t x1', 'hexa'], ['-t u1', 'décimal']], 'affiche les octets')}
${F('iconv', [['-f', 'codage source'], ['-t', 'codage cible'], ['-o', 'fichier sortie']], 'convertit l\'encodage')}`),
  FS('Utilisateurs', `
${F('whoami', [], 'mon nom')}
${F('id', [], 'UID, groupes')}
${F('groups', [], 'mes groupes')}
${F('su', [], 'devenir un autre utilisateur ; exit revient')}
${F('sudo', [], 'lancer en root')}
${F('passwd', [], 'changer de mot de passe')}
${F('chown', [['-R', 'récursif']], 'change le propriétaire, root seulement')}
${F('chgrp', [['-R', 'récursif']], 'change le groupe')}
${FP(`/etc/passwd ${k('nom:x:UID:GID:info:accueil:shell')} · root = UID 0`)}`),
  FS('Droits', `
${FT(['', 'Fichier', 'Dossier'], [[k('r') + ' 4', 'lire', 'lister'], [k('w') + ' 2', 'modifier', 'créer, supprimer dedans'], [k('x') + ' 1', 'exécuter', 'entrer, cd']], [17, 33, 50])}
${FP(`${k('-rwxr-x---')} = type + u propriétaire + g groupe + o autres · d dossier, l lien`)}
${F('chmod', [['-R', 'récursif']], 'change les droits ; u g o a, + - =, r w x')}
${FP(['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'].map((s, i) => `${k(s)} ${i}`).join(' · '))}
${FP('644 fichier · 600 privé · 755 programme/dossier · 700 dossier privé · 750 groupe')}`),
  FS('umask', `
${F('umask', [['-S', 'symbolique']], 'droits retirés aux nouveaux fichiers')}
${FP('Fichier 666, dossier 777, moins les bits du masque : 022 → 644 / 755 · 077 → 600 / 700 · 027 → 640 / 750 · 037 → 640 / 740')}`),
  FS('ACL', `
${F('getfacl', [], 'affiche les ACL')}
${F('setfacl', [['-m u:nom:rwx', 'ajouter'], ['-x u:nom', 'retirer'], ['-b', 'tout retirer'], ['-R', 'récursif'], ['-m d:…', 'par défaut']], 'modifie les ACL')}
${FP(`${k('+')} dans ls -l = ACL · 2e bloc = masque · effectif = entrée ∩ masque`)}`),
  FS('À distance', `
${F('ssh', [], 'session sur une autre machine ; ssh compte@machine')}
${F('ssh-keygen', [['-t rsa', 'type']], 'crée id_rsa privée + id_rsa.pub publique')}
${F('ssh-copy-id', [], 'installe ma clé publique sur la machine')}
${F('scp', [['-r', 'dossier']], 'copie par ssh ; compte@machine:chemin')}
${F('sftp', [], 'transfert interactif ; get, put')}
${F('rsync', [['-a', 'archive'], ['-v', 'afficher'], ['-z', 'compresser'], ['--delete', 'supprimer en trop']], 'synchronise ; src/ = contenu')}
${F('sshfs', [], 'monte un dossier distant')}
${F('rwho', [], 'utilisateurs du réseau')}
${FP('tmux : Ctrl+b d détacher · tmux a rattacher')}`),
  FS('Chiffrement', `
${FP('Symétrique : une clé · Asymétrique : chiffrer avec la publique du destinataire, déchiffrer avec sa privée · signer = avec sa privée')}
${F('ccrypt', [['-e', 'chiffrer'], ['-d', 'déchiffrer']], 'chiffre avec un mot de passe')}
${F('openssl enc', [['-aes-128-cbc', 'algo'], ['-d', 'déchiffrer'], ['-in', 'entrée'], ['-out', 'sortie']], 'chiffre avec un mot de passe')}`),
  FS('Compiler', `
${F('javac', [], 'compile F.java en F.class')}
${F('java', [], 'lance une classe, sans .class')}
${F('g++', [['-o nom', 'nom exécutable'], ['-Wall', 'avertissements']], 'compile du C++ en a.out')}
${FP(`Lancer : ${k('./prog')} · script : ${k('#!/bin/bash')} + ${k('chmod u+x')}`)}`),
  FS('Processus', `
${F('ps', [['-ef', 'tous']], 'liste les processus')}
${F('jobs', [], 'tâches du terminal')}
${F('fg', [], 'tâche au premier plan')}
${F('bg', [], 'tâche en arrière-plan')}
${F('kill', [['-9', 'forcer']], 'arrête un processus ; PID ou %N')}
${F('sleep', [], 'attend N secondes')}`),
  FS('Erreurs', `
${FT(['Message', 'Cause'], [[k('No such file or directory'), 'chemin faux'], [k('Permission denied'), 'droit manquant'], [k('Is a directory'), 'il faut -r'], [k('omitting directory'), 'cp sans -r'], [k('Directory not empty'), 'rmdir non vide'], [k('command not found'), 'faute ou ./ oublié'], [k('Operation not permitted'), 'réservé au propriétaire ou root']], [55, 45])}`)
];
