/* Intro système : exercices, aide-mémoire et pièges.
   Types d'exercices :
   - qcm   : Q(question, [bonne réponse, faux, faux…], explication, choixEnCode) ; la bonne réponse est toujours la 1re (mélangée à l'affichage) ;
   - shell : T({ seed, start, pre, title, prompt, hint, solution: [...], check: sh => [ok, message] }) ; « ^Z » / « ^C » dans la solution = touche ;
   - cmd   : W({ q, sol, why, hint, accept: [regex] }) ou W({ …, test: (sh, res) => bool }) : la commande tapée est exécutée dans un terminal neuf ;
   - drill : D(type, nombre de bonnes réponses d'affilée). */
const Q = (q, choices, why, code) => ({ type: 'qcm', q, choices, answer: 0, why, codeChoices: !!code });
const T = o => Object.assign({ type: 'shell', seed: 'standard' }, o);
const W = o => Object.assign({ type: 'cmd', seed: 'standard' }, o);
const D = (kind, need) => ({ type: 'drill', kind, need: need || 6 });
const ran = (sh, re) => sh.log.some(l => re.test(l));
const said = (sh, s) => sh.outLog.some(o => (s instanceof RegExp ? s.test(o.out) : o.out.includes(s)));
const at = (sh, p) => sh.pathOf(sh.cwd) === p;
const HOME = '/home/etudiant';

const EX = {
  /* ---------------------------------------------------------- l1 terminal */
  'l1-q1': Q('Que fait le shell quand tu appuies sur Entrée ?', ['Il analyse la ligne (mots, jokers, variables) puis exécute la commande', 'Il enregistre la ligne dans un fichier', 'Il envoie la ligne sur Internet', 'Rien tant que tu n\'as pas tapé exit'], 'Le shell boucle : lire, analyser, exécuter, recommencer.'),
  'l1-q2': Q('Dans « ls -l -t Documents », quel est l\'argument ?', ['Documents', 'ls', '-l', '-t'], 'ls est la commande, -l et -t sont des options, Documents est l\'argument (ce sur quoi la commande agit).', true),
  'l1-q3': Q('À quoi équivaut « ls -ltr » ?', ['ls -l -t -r', 'ls -ltr est une erreur', 'ls --ltr', 'ls -l puis ls -t puis ls -r'], 'Les options courtes se combinent derrière un seul tiret.', true),
  'l1-q4': Q('Une commande ne rend pas la main. Quel raccourci l\'arrête ?', ['Ctrl+C', 'Ctrl+S', 'Ctrl+Z', 'Échap'], 'Ctrl+C interrompt la commande. Ctrl+Z la suspend seulement (elle reste en mémoire).'),
  'l1-t1': T({ title: 'Premières commandes', prompt: 'Affiche la date, puis affiche le texte Bonjour R1.04 avec echo.', hint: 'date, puis echo "Bonjour R1.04"', solution: ['date', 'echo "Bonjour R1.04"'],
    check: sh => ran(sh, /^\s*date\b/) && said(sh, 'Bonjour R1.04') ? [true, 'Deux commandes, deux résultats.'] : [false, 'Il faut lancer date, puis echo avec le texte Bonjour R1.04.'] }),
  'l1-t2': T({ title: 'Un calendrier', prompt: 'Affiche le calendrier de septembre 2026 (le mois avant l\'année).', hint: 'cal 9 2026', solution: ['cal 9 2026'],
    check: sh => said(sh, 'September 2026') ? [true, 'cal MOIS ANNÉE.'] : [false, 'Le calendrier de September 2026 doit s\'afficher.'] }),

  /* ---------------------------------------------------------- l2 manuel */
  'l2-q1': Q('Dans une page de man, quelle touche permet de quitter ?', ['q', 'Échap', 'Ctrl+X', 'exit'], 'man affiche la page avec less : q pour quitter, /mot pour chercher.', true),
  'l2-q2': Q('Dans le synopsis « cp [OPTION]... SOURCE DEST », que signifient les crochets ?', ['Ce qui est entre crochets est facultatif', 'Il faut taper les crochets', 'C\'est obligatoire', 'C\'est un commentaire'], 'Les crochets indiquent un élément facultatif ; les points de suspension, qu\'on peut le répéter.'),
  'l2-q3': Q('Comment obtenir l\'aide de cd, commande interne du shell ?', ['help cd', 'man -k cd', 'cd --manual', 'apropos cd'], 'cd est une commande interne (builtin) : son aide est dans help.', true),
  'l2-q4': Q('Tu cherches une commande qui « compresse » mais tu ne connais pas son nom. Que tapes-tu ?', ['apropos compresser', 'man compresser', 'help compresser', 'compresser --help'], 'apropos (ou man -k) cherche un mot dans les descriptions de toutes les pages.', true),
  'l2-t1': T({ title: 'Chercher une option', prompt: 'Ouvre le manuel de ls, trouve l\'option qui trie par date de modification, puis utilise-la pour lister Documents.', hint: 'man ls, cherche « date ». C\'est -t.', solution: ['man ls', 'ls -t Documents'],
    check: sh => ran(sh, /^\s*man\s+ls\s*$/) && ran(sh, /^\s*ls\s+(-\w*t\w*\s+)+Documents\/?\s*$/) ? [true, 'Tu as trouvé -t toi-même dans le manuel.'] : [false, 'Lance man ls, puis ls avec l\'option de tri par date sur Documents.'] }),
  'l2-w1': W({ q: 'Écris la commande qui liste toutes les pages du manuel dont la description parle de « copier ».', sol: 'apropos copier', accept: [/^apropos copier$/, /^man -k copier$/], why: 'apropos MOT, ou man -k MOT.' }),

  /* ---------------------------------------------------------- l3 chemins */
  'l3-q1': Q('Que fait la commande pwd ?', ['Elle affiche le chemin absolu du répertoire courant', 'Elle change de répertoire', 'Elle liste les fichiers', 'Elle affiche le mot de passe'], 'pwd = Print Working Directory.'),
  'l3-q2': Q('Depuis /home/etudiant/Documents, où mène « cd .. » ?', ['/home/etudiant', '/home', '/', 'Nulle part : erreur'], '.. désigne le répertoire parent : on remonte d\'un niveau.', true),
  'l3-q3': Q('Lequel de ces chemins est absolu ?', ['/home/etudiant/Projets', 'Projets/tp1', '../Documents', './script.sh'], 'Un chemin absolu commence par / (la racine).', true),
  'l3-q4': Q('Que fait « cd » tout seul ?', ['Il ramène dans le répertoire personnel', 'Il affiche le répertoire courant', 'Il remonte à la racine', 'Il ne fait rien'], 'Sans argument, cd va dans $HOME, comme cd ~.'),
  'l3-t1': T({ title: 'Aller dans Documents', prompt: 'Va dans le répertoire Documents, puis affiche son chemin absolu.', hint: 'cd Documents puis pwd.', solution: ['cd Documents', 'pwd'],
    check: sh => at(sh, HOME + '/Documents') && ran(sh, /^\s*pwd\s*$/) ? [true, 'Tu es dans Documents et tu as vérifié.'] : [false, 'Il faut être dans /home/etudiant/Documents et avoir lancé pwd.'] }),
  'l3-t2': T({ start: 'Documents', title: 'Un chemin relatif qui remonte', prompt: 'Tu es dans Documents. Rends-toi dans Projets/tp1 en une seule commande cd, avec un chemin relatif.', hint: 'cd ../Projets/tp1', solution: ['cd ../Projets/tp1'],
    check: sh => at(sh, HOME + '/Projets/tp1') && sh.log.filter(l => /^\s*cd\b/.test(l)).length === 1 && !ran(sh, /^\s*cd\s+[\/~]/) ? [true, '.. pour remonter, puis on redescend.'] : [false, 'Un seul cd, avec un chemin relatif (qui commence par ..).'] }),
  'l3-t3': T({ start: 'Projets/tp1', title: 'Rentrer à la maison', prompt: 'Reviens dans ton répertoire personnel sans écrire son chemin.', hint: 'cd tout seul, ou cd ~', solution: ['cd'],
    check: sh => at(sh, HOME) && !ran(sh, /home|\.\./) ? [true, 'cd sans argument ramène au répertoire personnel.'] : [false, 'Va dans /home/etudiant sans taper « home » ni « .. ».'] }),
  'l3-d1': D('path'),

  /* ---------------------------------------------------------- l4 ls mkdir */
  'l4-q1': Q('Que montre l\'option -l de ls ?', ['Une vue détaillée : droits, propriétaire, taille, date', 'Seulement les fichiers cachés', 'Le contenu des fichiers', 'Les répertoires seulement'], 'ls -l = format long.'),
  'l4-q2': Q('À quoi sert mkdir -p a/b/c ?', ['Créer toute l\'arborescence a/b/c d\'un coup', 'Protéger le répertoire par un mot de passe', 'Afficher a/b/c', 'Créer un fichier c'], '-p crée aussi les parents manquants.'),
  'l4-q3': Q('rmdir Projets répond « Directory not empty ». Pourquoi ?', ['rmdir ne supprime que les répertoires vides', 'Projets n\'existe pas', 'Il manque sudo', 'Il faut écrire rmdir -p'], 'Pour un répertoire non vide, c\'est rm -r (leçon suivante).'),
  'l4-q4': Q('Quelle commande affiche aussi les fichiers cachés, avec les détails ?', ['ls -la', 'ls -p', 'ls -d', 'ls --hidden'], '-a montre les noms qui commencent par un point, -l les détails.', true),
  'l4-t1': T({ seed: 'empty', title: 'Fichiers dans un répertoire', prompt: 'Crée le répertoire cours, puis dedans les fichiers td1.txt et td2.txt, sans changer de répertoire courant.', hint: 'mkdir cours puis touch cours/td1.txt cours/td2.txt', solution: ['mkdir cours', 'touch cours/td1.txt cours/td2.txt'],
    check: sh => { const d = sh.peek('~/cours'); return d && d.t === 'd' && sh.exists('~/cours/td1.txt') && sh.exists('~/cours/td2.txt') && at(sh, HOME) ? [true, 'Arborescence créée.'] : [false, 'Il manque cours/, cours/td1.txt ou cours/td2.txt (et reste dans ton répertoire personnel).']; } }),
  'l4-t2': T({ seed: 'empty', title: 'Toute une arborescence', prompt: 'Crée en une seule commande l\'arborescence projet/src/utils.', hint: 'mkdir -p projet/src/utils', solution: ['mkdir -p projet/src/utils'],
    check: sh => sh.exists('~/projet/src/utils') && sh.log.filter(l => /^\s*mkdir/.test(l)).length === 1 ? [true, 'Une seule commande grâce à -p.'] : [false, 'Utilise mkdir -p, en une seule commande mkdir.'] }),
  'l4-t3': T({ title: 'Les fichiers cachés', prompt: 'Affiche le contenu de ton répertoire personnel avec les détails ET les fichiers cachés.', hint: 'ls -la', solution: ['ls -la'],
    check: sh => sh.outLog.some(o => /^\s*ls\s+(-[a-zA-Z]+\s*)+$/.test(o.line) && o.out.includes('.bashrc') && o.out.includes('drwx')) ? [true, 'Tu vois .bashrc, le fichier de configuration du shell.'] : [false, 'Lance ls avec les options -l et -a.'] }),

  /* ---------------------------------------------------------- l5 cp mv rm */
  'l5-q1': Q('Quelle option de cp faut-il pour copier un répertoire entier ?', ['-r (ou -R)', '-p', '-l', 'Aucune'], 'Sans -r, cp refuse : « omitting directory ».'),
  'l5-q2': Q('Comment renomme-t-on un fichier ?', ['mv ancien nouveau', 'cp ancien nouveau', 'rm ancien nouveau', 'rename ancien'], 'Renommer, c\'est déplacer vers un autre nom.', true),
  'l5-q3': Q('Quelle commande supprime le répertoire tp1 et tout son contenu ?', ['rm -r tp1', 'rmdir tp1', 'rm tp1', 'del tp1'], 'rmdir refuse un répertoire non vide, rm sans -r refuse un répertoire.', true),
  'l5-q4': Q('Après rm fichier.txt, comment le récupérer ?', ['On ne peut pas : il n\'y a pas de corbeille', 'cd ~/.Trash', 'rm --undo', 'Ctrl+Z'], 'rm est définitif.'),
  'l5-q5': Q('Que fait « mv script.sh Projets » si Projets est un répertoire existant ?', ['Il déplace script.sh dans Projets', 'Il renomme script.sh en Projets', 'Il copie script.sh', 'Il écrase Projets'], 'Destination = répertoire existant : la source va dedans.'),
  'l5-t1': T({ title: 'Copier un fichier', prompt: 'Fais une copie de README.txt nommée README.bak, dans le même répertoire.', hint: 'cp README.txt README.bak', solution: ['cp README.txt README.bak'],
    check: sh => sh.exists('~/README.bak') && sh.exists('~/README.txt') && sh.textOf('~/README.bak') === sh.textOf('~/README.txt') ? [true, 'La copie existe, l\'original aussi.'] : [false, 'README.bak doit exister avec le même contenu, et README.txt aussi.'] }),
  'l5-t2': T({ title: 'Copier un répertoire', prompt: 'Sauvegarde le répertoire Documents dans un nouveau répertoire Sauvegarde, avec son contenu.', hint: 'cp -r Documents Sauvegarde', solution: ['cp -r Documents Sauvegarde'],
    check: sh => sh.exists('~/Sauvegarde/notes.txt') && sh.exists('~/Sauvegarde/cours.txt') && sh.exists('~/Documents/notes.txt') && !sh.exists('~/Sauvegarde/Documents') ? [true, 'Copie récursive réussie.'] : [false, 'Sauvegarde doit contenir directement notes.txt, cours.txt… ; Documents reste en place.'] }),
  'l5-t3': T({ title: 'Déplacer et renommer', prompt: 'Déplace script.sh dans Projets/tp1 en le renommant run.sh, en une seule commande.', hint: 'mv script.sh Projets/tp1/run.sh', solution: ['mv script.sh Projets/tp1/run.sh'],
    check: sh => sh.exists('~/Projets/tp1/run.sh') && !sh.exists('~/script.sh') ? [true, 'mv a fait les deux.'] : [false, 'Il faut Projets/tp1/run.sh, et plus de script.sh ici.'] }),
  'l5-t4': T({ title: 'Supprimer un répertoire', prompt: 'Supprime le répertoire Projets/tp1 et tout son contenu, mais garde Projets.', hint: 'rm -r Projets/tp1', solution: ['rm -r Projets/tp1'],
    check: sh => !sh.exists('~/Projets/tp1') && sh.exists('~/Projets') ? [true, 'tp1 a disparu, Projets est resté.'] : [false, 'Supprime tp1 sans toucher à Projets.'] }),

  /* ---------------------------------------------------------- l6 lire */
  'l6-q1': Q('Comment quitter less ?', ['q', 'Ctrl+C', 'exit', 'Échap'], 'q pour quitter, Espace pour avancer, /mot pour chercher.', true),
  'l6-q2': Q('Quelle commande affiche les 5 premières lignes de f.txt ?', ['head -n 5 f.txt', 'tail -n 5 f.txt', 'cat -n 5 f.txt', 'less 5 f.txt'], 'head = tête (début), tail = queue (fin).', true),
  'l6-q3': Q('Que fait wc -l f.txt ?', ['Il compte les lignes de f.txt', 'Il supprime f.txt', 'Il affiche f.txt en couleur', 'Il compte les mots'], 'wc compte lignes, mots, octets ; -l : seulement les lignes.'),
  'l6-q4': Q('Comment file devine-t-il le type d\'un fichier ?', ['En examinant le début de son contenu', 'En lisant son extension', 'En demandant à l\'utilisateur', 'En regardant sa taille'], 'L\'extension n\'est qu\'une convention de nommage : file lit le contenu.'),
  'l6-t1': T({ title: 'La fin d\'un fichier', prompt: 'Affiche seulement les 3 dernières lignes de Documents/cours.txt.', hint: 'tail -n 3 Documents/cours.txt', solution: ['tail -n 3 Documents/cours.txt'],
    check: sh => sh.outLog.some(o => o.out.includes('Fin du programme') && o.out.includes('touche TAB') && !o.out.includes('lis le manuel')) ? [true, 'tail -n 3 : les 3 dernières lignes.'] : [false, 'Affiche exactement les 3 dernières lignes (tail).'] }),
  'l6-t2': T({ title: 'Compter', prompt: 'Affiche le nombre de lignes de Documents/cours.txt avec wc.', hint: 'wc -l Documents/cours.txt', solution: ['wc -l Documents/cours.txt'],
    check: sh => ran(sh, /\bwc\b/) && said(sh, /\b21\b/) ? [true, '21 lignes.'] : [false, 'Utilise wc -l sur Documents/cours.txt.'] }),
  'l6-w1': W({ q: 'Écris la commande qui affiche Documents/cours.txt page par page.', sol: 'less Documents/cours.txt', accept: [/^(less|more) (\.\/)?Documents\/cours\.txt$/], why: 'less (ou more) affiche page par page.' }),

  /* ---------------------------------------------------------- l7 jokers */
  'l7-q1': Q('Dans « ls *.java », qui remplace *.java par la liste des fichiers ?', ['Le shell, avant de lancer ls', 'La commande ls', 'Le système de fichiers', 'Personne : ls cherche un fichier nommé *.java'], 'L\'expansion est faite par le shell : ls reçoit directement les noms.'),
  'l7-q2': Q('Aucun fichier ne finit par .xyz. Qu\'affiche « echo *.xyz » ?', ['*.xyz', 'rien', 'une erreur', 'tous les fichiers'], 'Sans correspondance, le motif est laissé tel quel.', true),
  'l7-q3': Q('Lequel de ces noms correspond à « vacances?.jpg » ?', ['vacances1.jpg', 'vacances10.jpg', 'vacances.jpg', 'Vacances1.jpg'], '? = exactement un caractère ; et les majuscules comptent.', true),
  'l7-q4': Q('Qu\'affiche echo "*" ?', ['*', 'la liste des fichiers', 'une erreur', '"*"'], 'Entre guillemets, l\'étoile perd son rôle spécial.', true),
  'l7-w1': W({ q: 'Avec echo et un motif, affiche tous les identifiants de /mnt/roost/users qui contiennent un x.', sol: 'echo /mnt/roost/users/*x*', same: true, why: '*x* : n\'importe quoi, un x, n\'importe quoi.' }),
  'l7-w2': W({ q: 'Même chose pour les identifiants qui contiennent un x, un w ou un z.', sol: 'echo /mnt/roost/users/*[xwz]*', same: true, why: '[xwz] : un caractère parmi x, w, z.' }),
  'l7-w3': W({ q: 'Les identifiants sont l\'initiale du prénom suivie du nom. Affiche ceux dont le nom commence par une lettre de a à e.', sol: 'echo /mnt/roost/users/?[a-e]*', same: true, why: '? pour l\'initiale (n\'importe laquelle), puis [a-e] pour la 1re lettre du nom.' }),
  'l7-t1': T({ title: 'Trier ses photos', prompt: 'Dans Photos, crée un répertoire jpg, puis copies-y toutes les photos .jpg en UNE commande cp avec un joker.', hint: 'cd Photos ; mkdir jpg ; cp *.jpg jpg', solution: ['cd Photos', 'mkdir jpg', 'cp *.jpg jpg'],
    check: sh => ['vacances1.jpg', 'vacances10.jpg', 'IMG_2024.jpg'].every(f => sh.exists('~/Photos/jpg/' + f)) && !sh.exists('~/Photos/jpg/plage.png') && ran(sh, /^\s*cp\s.*\*/) ? [true, 'Les 4 .jpg sont copiées, pas les .png.'] : [false, 'Photos/jpg doit contenir toutes les .jpg (et aucune .png), copiées avec un joker.'] }),
  'l7-d1': D('glob'),

  /* ---------------------------------------------------------- l8 archives */
  'l8-q1': Q('Après « gzip rapport.txt », que contient le répertoire ?', ['rapport.txt.gz seulement', 'rapport.txt et rapport.txt.gz', 'rapport.gz', 'rapport.tar'], 'gzip remplace le fichier par sa version compressée (sauf avec -k).'),
  'l8-q2': Q('Quelle commande liste le contenu d\'une archive sans l\'extraire ?', ['tar -tvf archive.tar', 'tar -xvf archive.tar', 'tar -cvf archive.tar', 'cat archive.tar'], 't = table des matières ; x extrait, c crée.', true),
  'l8-q3': Q('Comment lire un fichier .gz sans le décompresser ?', ['zcat fichier.gz', 'cat fichier.gz', 'gunzip -l fichier.gz', 'less -z fichier.gz'], 'cat montre des octets compressés illisibles ; zcat (ou zless) décompresse à la volée.', true),
  'l8-q4': Q('Que fait l\'option -z de tar ?', ['Elle compresse (ou décompresse) avec gzip', 'Elle crée une archive zip', 'Elle supprime les fichiers d\'origine', 'Elle affiche les détails'], 'tar -czf a.tar.gz rep : archive + compression gzip.'),
  'l8-t1': T({ title: 'Archiver un répertoire', prompt: 'Depuis ton répertoire personnel, crée l\'archive M1101.tar qui contient le répertoire M1101.', hint: 'tar -cvf M1101.tar M1101', solution: ['tar -cvf M1101.tar M1101'],
    check: sh => { const a = sh.peek('~/M1101.tar'); return a && a.tar && a.tar.some(e => e.path === 'M1101/td1.txt') ? [true, 'L\'archive contient M1101/ et ses fichiers.'] : [false, 'M1101.tar doit exister et contenir M1101/td1.txt.']; } }),
  'l8-t2': T({ title: 'Compresser et lire', prompt: 'Compresse Documents/cours.txt avec gzip, puis affiche son contenu sans le décompresser.', hint: 'gzip Documents/cours.txt puis zcat Documents/cours.txt.gz', solution: ['gzip Documents/cours.txt', 'zcat Documents/cours.txt.gz'],
    check: sh => sh.exists('~/Documents/cours.txt.gz') && !sh.exists('~/Documents/cours.txt') && said(sh, 'Fin du programme') ? [true, 'Compressé, et lu avec zcat.'] : [false, 'cours.txt.gz doit exister (et plus cours.txt), puis affiche-le avec zcat.'] }),
  'l8-t3': T({ pre: ['tar -cf /tmp/M1101.tar M1101'], title: 'Extraire un seul fichier', prompt: 'L\'archive /tmp/M1101.tar existe. Va dans /tmp et extrais-en seulement M1101/td2.txt.', hint: 'cd /tmp puis tar -xvf M1101.tar M1101/td2.txt', solution: ['cd /tmp', 'tar -xvf M1101.tar M1101/td2.txt'],
    check: sh => sh.exists('/tmp/M1101/td2.txt') && !sh.exists('/tmp/M1101/td1.txt') ? [true, 'Seul td2.txt est sorti de l\'archive.'] : [false, 'Il faut /tmp/M1101/td2.txt, et pas les autres fichiers.'] }),
  'l8-w1': W({ q: 'Écris la commande qui crée l\'archive compressée projet.tar.gz contenant le répertoire Projets.', sol: 'tar -czvf projet.tar.gz Projets', why: 'c créer, z gzip, f nom de l\'archive (v facultatif).',
    test: sh => { const a = sh.peek('~/projet.tar.gz'); return !!(a && a.gz && a.gz.node.tar && a.gz.node.tar.some(e => e.path.startsWith('Projets/'))); } }),

  /* ---------------------------------------------------------- l9 ssh */
  'l9-q1': Q('Que garantit SSH ?', ['Une connexion à distance chiffrée', 'Une connexion plus rapide', 'Un accès sans compte', 'Une copie de sauvegarde'], 'SSH chiffre tout ce qui passe, mot de passe compris.'),
  'l9-q2': Q('Quelle clé ne doit JAMAIS quitter ton ordinateur ?', ['~/.ssh/id_rsa (la clé privée)', '~/.ssh/id_rsa.pub (la clé publique)', 'Les deux', 'Aucune'], 'La clé publique se diffuse ; la clé privée reste secrète, en 600.', true),
  'l9-q3': Q('Où doit se trouver ta clé publique pour te connecter sans mot de passe à un serveur ?', ['Dans ~/.ssh/authorized_keys du serveur', 'Dans /etc/passwd du serveur', 'Dans ton ~/.bashrc', 'Dans le mail de l\'enseignant'], 'ssh-copy-id l\'y ajoute automatiquement.', true),
  'l9-q4': Q('À quoi sert tmux sur un serveur ?', ['Garder la session et ses programmes vivants si la connexion coupe', 'Chiffrer la connexion', 'Copier des fichiers', 'Changer de mot de passe'], 'On se détache (Ctrl+b d) et on se rattache plus tard (tmux a).'),
  'l9-w1': W({ q: 'Ouvre une session sur la machine info-ssh1.iut.u-bordeaux.fr avec le compte jdupont.', sol: 'ssh jdupont@info-ssh1.iut.u-bordeaux.fr', accept: [/^ssh jdupont@info-ssh1\.iut\.u-bordeaux\.fr$/], why: 'ssh compte@machine.' }),
  'l9-w2': W({ q: 'Écris la commande qui installe ta clé publique sur info-ssh1.iut.u-bordeaux.fr pour le compte jdupont.', sol: 'ssh-copy-id jdupont@info-ssh1.iut.u-bordeaux.fr', accept: [/^ssh-copy-id (-i \S+ )?jdupont@info-ssh1\.iut\.u-bordeaux\.fr$/], why: 'ssh-copy-id ajoute la clé dans ~/.ssh/authorized_keys de la machine distante.' }),
  'l9-t1': T({ title: 'Créer ses clés', prompt: 'Génère une paire de clés RSA, puis vérifie avec ls -l que la clé privée est bien en rw------- (600).', hint: 'ssh-keygen -t rsa puis ls -l ~/.ssh', solution: ['ssh-keygen -t rsa', 'ls -l ~/.ssh'],
    check: sh => sh.exists('~/.ssh/id_rsa') && sh.outLog.some(o => o.out.includes('-rw------- ') && o.out.includes('id_rsa')) ? [true, 'id_rsa en 600, id_rsa.pub en 644.'] : [false, 'Génère les clés puis affiche ls -l du répertoire ~/.ssh.'] }),

  /* ---------------------------------------------------------- l10 transferts */
  'l10-q1': Q('Que fait « scp notes.txt jdupont@info-ssh1 » (sans les deux-points) ?', ['Une copie locale nommée « jdupont@info-ssh1 »', 'Une copie sur la machine info-ssh1', 'Une erreur de connexion', 'Un déplacement'], 'Sans « : », scp ne voit pas de machine distante : c\'est un simple nom de fichier.'),
  'l10-q2': Q('Quel avantage a rsync sur scp pour une sauvegarde régulière ?', ['Il ne transfère que ce qui a changé', 'Il chiffre mieux', 'Il ne demande jamais de mot de passe', 'Il compresse les images'], 'rsync compare source et destination et n\'envoie que les différences.'),
  'l10-q3': Q('Avec « rsync -a COURS/ ARCHIVES », qu\'obtient-on ?', ['Le contenu de COURS directement dans ARCHIVES', 'ARCHIVES/COURS/…', 'Une erreur', 'COURS est vidé'], 'Avec le / final, c\'est le contenu qui est copié ; sans /, le répertoire lui-même.'),
  'l10-q4': Q('Pourquoi préférer sftp à ftp ?', ['ftp n\'est pas chiffré', 'sftp est plus ancien', 'ftp ne marche pas sous Linux', 'sftp ne demande pas de compte'], 'sftp passe par ssh ; FTP envoie tout en clair, mot de passe compris.'),
  'l10-w1': W({ q: 'Récupère le fichier TP/tp3.java du compte jdupont sur info-ssh1.iut.u-bordeaux.fr, dans le répertoire courant.', sol: 'scp jdupont@info-ssh1.iut.u-bordeaux.fr:TP/tp3.java .', accept: [/^scp jdupont@info-ssh1\.iut\.u-bordeaux\.fr:(~\/)?TP\/tp3\.java \.\/?$/], why: 'compte@machine:chemin pour la source, . pour « ici ».' }),
  'l10-w2': W({ q: 'Envoie le répertoire Projet (avec son contenu) dans le répertoire personnel de jdupont sur info-ssh1.iut.u-bordeaux.fr.', sol: 'scp -r Projet jdupont@info-ssh1.iut.u-bordeaux.fr:', accept: [/^scp -r Projet\/? jdupont@info-ssh1\.iut\.u-bordeaux\.fr:(~\/?|\.\/?)?$/], why: '-r pour un répertoire ; rien après les deux-points = répertoire personnel.' }),

  /* ---------------------------------------------------------- l11 redirections */
  'l11-q1': Q('Quelle différence entre « > f » et « >> f » ?', ['> remplace le contenu de f, >> ajoute à la fin', '>> remplace, > ajoute', 'Aucune', '>> redirige les erreurs'], '>> conserve le contenu existant.'),
  'l11-q2': Q('« javac Erreur.java > err.txt » laisse err.txt vide et affiche les erreurs. Pourquoi ?', ['Les erreurs partent sur stderr, pas sur stdout', 'javac ne sait pas écrire dans un fichier', 'Il faut sudo', 'err.txt est protégé'], 'Il faut 2> err.txt pour la sortie d\'erreur.'),
  'l11-q3': Q('Comment envoyer stdout ET stderr dans tout.txt ?', ['cmd > tout.txt 2>&1', 'cmd 2>&1 tout.txt', 'cmd >> tout.txt', 'cmd | tout.txt'], '2>&1 : « stderr va au même endroit que stdout », après avoir redirigé stdout.', true),
  'l11-q4': Q('À quoi sert « 2> /dev/null » ?', ['Jeter les messages d\'erreur', 'Supprimer le fichier null', 'Afficher les erreurs deux fois', 'Créer un fichier vide'], '/dev/null avale tout ce qu\'on y écrit.'),
  'l11-q5': Q('Que contient f après « sort f > f » ?', ['Rien : f a été vidé avant que sort le lise', 'f trié', 'f en double', 'Une erreur'], 'Le shell prépare la redirection (et vide f) avant de lancer sort.'),
  'l11-t1': T({ title: 'Garder une liste', prompt: 'Enregistre la liste détaillée (ls -l) de ton répertoire personnel dans le fichier liste.txt.', hint: 'ls -l > liste.txt', solution: ['ls -l > liste.txt'],
    check: sh => (sh.textOf('~/liste.txt') || '').includes('Documents') && (sh.textOf('~/liste.txt') || '').includes('drwx') ? [true, 'liste.txt contient la liste détaillée.'] : [false, 'liste.txt doit contenir la sortie de ls -l.'] }),
  'l11-t2': T({ title: 'Ajouter sans effacer', prompt: 'Ajoute la ligne « fin » à la fin de Documents/notes.txt, sans effacer ce qu\'il contient.', hint: 'echo fin >> Documents/notes.txt', solution: ['echo fin >> Documents/notes.txt'],
    check: sh => { const t = sh.textOf('~/Documents/notes.txt') || ''; return t.startsWith('Cours d\'intro') && t.endsWith('fin\n') ? [true, '>> a ajouté la ligne.'] : [false, 'notes.txt doit commencer comme avant et finir par « fin ».']; } }),
  'l11-t3': T({ start: 'Projets/tp1', title: 'Garder les erreurs du compilateur', prompt: 'Compile Erreur.java en enregistrant les messages d\'erreur dans erreurs.txt.', hint: 'javac Erreur.java 2> erreurs.txt', solution: ['javac Erreur.java 2> erreurs.txt'],
    check: sh => (sh.textOf('~/Projets/tp1/erreurs.txt') || '').includes("';' expected") ? [true, 'Les erreurs (stderr) sont dans le fichier.'] : [false, 'erreurs.txt doit contenir le message de javac.'] }),

  /* ---------------------------------------------------------- l12 filtres */
  'l12-q1': Q('Que fait « ls | wc -l » ?', ['Elle compte les noms affichés par ls', 'Elle liste puis supprime', 'Elle écrit dans un fichier wc', 'C\'est une erreur'], 'La sortie de ls devient l\'entrée de wc -l.', true),
  'l12-q2': Q('Quelle commande affiche les lignes qui ne contiennent PAS « G1 » ?', ['grep -v G1 f', 'grep -c G1 f', 'grep !G1 f', 'grep -i G1 f'], '-v inverse la sélection.', true),
  'l12-q3': Q('Pourquoi écrit-on « sort | uniq -c » et pas « uniq -c » seul ?', ['uniq ne fusionne que les lignes identiques voisines', 'uniq ne sait pas lire un fichier', 'sort compte les lignes', 'Par habitude, sans raison'], 'Le tri rapproche les lignes identiques.'),
  'l12-q4': Q('Sans option, comment sort classe-t-il 9 et 10 ?', ['10 avant 9 (tri alphabétique)', '9 avant 10', 'Au hasard', 'Il refuse les nombres'], 'Il compare les caractères : « 1 » < « 9 ». sort -n trie numériquement.'),
  'l12-t1': T({ title: 'Combien de programmes ?', prompt: 'Affiche le nombre de fichiers du répertoire /usr/bin, avec ls, un tube et wc.', hint: 'ls /usr/bin | wc -l', solution: ['ls /usr/bin | wc -l'],
    check: sh => sh.outLog.some(o => /\|/.test(o.line) && /wc/.test(o.line) && o.out.trim() === String(sh.peek('/usr/bin').kids.size)) ? [true, 'ls | wc -l compte les noms.'] : [false, 'Combine ls /usr/bin et wc -l avec un tube.'] }),
  'l12-t2': T({ title: 'Un groupe', prompt: 'Affiche seulement les lignes des étudiants du groupe G2 de Documents/etudiants.txt.', hint: 'grep G2 Documents/etudiants.txt', solution: ['grep G2 Documents/etudiants.txt'],
    check: sh => sh.outLog.some(o => ['Bernard', 'Robert', 'Leroy'].every(n => o.out.includes(n)) && !o.out.includes('Martin')) ? [true, '3 étudiants en G2.'] : [false, 'Garde seulement les lignes qui contiennent G2.'] }),
  'l12-t3': T({ title: 'Les noms, triés', prompt: 'Affiche les noms (1er champ) des étudiants de Documents/etudiants.txt, par ordre alphabétique.', hint: 'cut -d: -f1 Documents/etudiants.txt | sort', solution: ['cut -d: -f1 Documents/etudiants.txt | sort'],
    check: sh => said(sh, 'Bernard\nDubois\nDurand\nLeroy\nMartin\nMoreau\nPetit\nRobert\nSimon\nThomas\n') ? [true, 'cut puis sort.'] : [false, 'Il faut les 10 noms seuls, de Bernard à Thomas.'] }),
  'l12-t4': T({ title: 'Un petit rapport', prompt: 'Enregistre dans g1.txt le nom et la note (champs 1 et 4) des étudiants du groupe G1, dans l\'ordre du fichier.', hint: 'grep G1 Documents/etudiants.txt | cut -d: -f1,4 > g1.txt', solution: ['grep G1 Documents/etudiants.txt | cut -d: -f1,4 > g1.txt'],
    check: sh => sh.textOf('~/g1.txt') === 'Martin:15\nDubois:18\nPetit:7\nMoreau:13\n' ? [true, 'grep, cut et une redirection.'] : [false, 'g1.txt doit contenir 4 lignes nom:note (Martin:15 en premier).'] }),

  /* ---------------------------------------------------------- l13 codage */
  'l13-q1': Q('Sur combien de bits le code ASCII est-il défini ?', ['7 bits (128 caractères)', '8 bits (256 caractères)', '16 bits', '1 octet par mot'], 'ASCII : codes 0 à 127, sans lettres accentuées.'),
  'l13-q2': Q('Combien d\'octets faut-il pour « é » en UTF-8 ?', ['2', '1', '3', '4'], 'é = U+00E9 > U+007F : 2 octets, C3 A9.'),
  'l13-q3': Q('Un fichier affiche « Ã© » au lieu de « é ». Que s\'est-il passé ?', ['Du texte UTF-8 a été lu comme du Latin-1', 'Du Latin-1 a été lu comme de l\'UTF-8', 'Le fichier est compressé', 'Le disque est abîmé'], 'Les 2 octets C3 A9 d\'UTF-8, lus un par un en Latin-1, donnent Ã et ©.'),
  'l13-q4': Q('Un texte en pur ASCII est converti en UTF-8. Que se passe-t-il ?', ['Rien : les octets sont identiques', 'Il double de taille', 'Il quadruple de taille', 'Les majuscules changent'], 'UTF-8 code l\'ASCII sur 1 octet, avec les mêmes valeurs.'),
  'l13-q5': Q('Quelle commande montre les octets d\'un fichier ?', ['od -c fichier', 'cat -b fichier', 'iconv fichier', 'wc -c fichier'], 'od (octal dump). wc -c compte les octets mais ne les montre pas.', true),
  'l13-t1': T({ title: 'Les octets en hexadécimal', prompt: 'Affiche les octets de Codage/utf8.txt en hexadécimal, avec od.', hint: 'od -t x1 Codage/utf8.txt', solution: ['od -t x1 Codage/utf8.txt'],
    check: sh => said(sh, ' c3 a9') ? [true, 'é = c3 a9 en UTF-8.'] : [false, 'Utilise od avec -t x1.'] }),
  'l13-t2': T({ title: 'Convertir', prompt: 'Convertis Codage/latin1.txt (ISO-8859-1) en UTF-8 dans le fichier Codage/ok.txt, puis affiche ok.txt.', hint: 'iconv -f ISO-8859-1 -t UTF-8 Codage/latin1.txt -o Codage/ok.txt', solution: ['iconv -f ISO-8859-1 -t UTF-8 Codage/latin1.txt -o Codage/ok.txt', 'cat Codage/ok.txt'],
    check: sh => { const n = sh.peek('~/Codage/ok.txt'); return n && n.data === 'été à Noël\n' && n.enc !== 'latin1' && said(sh, 'été à Noël') ? [true, 'Les accents s\'affichent correctement.'] : [false, 'ok.txt doit contenir « été à Noël » en UTF-8, puis affiche-le.']; } }),
  'l13-d1': D('utf8'),

  /* ---------------------------------------------------------- l14 utilisateurs */
  'l14-q1': Q('Que montre la commande id ?', ['Ton UID, ton groupe primaire et tous tes groupes', 'Ton mot de passe', 'L\'adresse de la machine', 'Les processus'], 'uid=…, gid=…, groups=…'),
  'l14-q2': Q('Quel est l\'UID de root ?', ['0', '1', '1000', '65535'], 'root, l\'administrateur, a l\'UID 0.'),
  'l14-q3': Q('Qui peut changer le propriétaire d\'un fichier avec chown ?', ['root seulement (d\'où sudo chown)', 'Le propriétaire du fichier', 'Tout le monde', 'Les membres du groupe'], 'Sinon, on pourrait « donner » des fichiers aux autres pour contourner les quotas.'),
  'l14-q4': Q('Dans /etc/passwd, « etudiant:x:1000:1000::/home/etudiant:/bin/bash », que vaut le 6e champ ?', ['Le répertoire personnel', 'Le shell', 'Le mot de passe', 'Le groupe'], 'nom:mdp:UID:GID:commentaire:répertoire:shell.'),
  'l14-t1': T({ title: 'Changer de groupe', prompt: 'Change le groupe de Documents/rapport.txt pour le groupe info (tu en fais partie).', hint: 'chgrp info Documents/rapport.txt', solution: ['chgrp info Documents/rapport.txt'],
    check: sh => sh.peek('~/Documents/rapport.txt').group === 'info' ? [true, 'Le propriétaire peut choisir un de ses groupes.'] : [false, 'Le groupe de rapport.txt doit être info.'] }),
  'l14-t2': T({ title: 'Donner un fichier', prompt: 'Donne le fichier Documents/rapport.txt à alice (il faut les droits de root).', hint: 'sudo chown alice Documents/rapport.txt', solution: ['sudo chown alice Documents/rapport.txt'],
    check: sh => sh.peek('~/Documents/rapport.txt').owner === 'alice' ? [true, 'Avec sudo, chown fonctionne.'] : [false, 'Le propriétaire de rapport.txt doit être alice.'] }),

  /* ---------------------------------------------------------- l15 rwx */
  'l15-q1': Q('Que permet le droit r sur un répertoire ?', ['Lister son contenu (les noms)', 'Y créer des fichiers', 'Y entrer avec cd', 'Le supprimer'], 'r = lister ; w = créer/supprimer dedans ; x = traverser.'),
  'l15-q2': Q('Quel droit faut-il sur un répertoire pour y entrer avec cd ?', ['x', 'r', 'w', 'Aucun'], 'x sur un répertoire = le traverser.', true),
  'l15-q3': Q('Que désigne la catégorie « o » ?', ['Others : tous les autres', 'Owner : le propriétaire', 'Organisation', 'Output'], 'u = user (propriétaire), g = group, o = others.'),
  'l15-q4': Q('Pour supprimer un fichier, quel droit est nécessaire ?', ['w sur le répertoire qui le contient', 'w sur le fichier', 'x sur le fichier', 'r sur le fichier'], 'Supprimer, c\'est modifier la liste des noms du répertoire.'),
  'l15-q5': Q('Le propriétaire a r-- et les autres rw- sur un fichier. Le propriétaire peut-il le modifier ?', ['Non : ce sont ses droits à lui (u) qui comptent', 'Oui, grâce aux droits des autres', 'Oui, le propriétaire peut toujours tout', 'Seulement avec cd'], 'On prend la première catégorie qui correspond. (Il peut cependant se redonner w avec chmod.)'),
  'l15-t1': T({ title: 'Lancer sans x', prompt: 'script.sh n\'a pas le droit x. Lance-le quand même, SANS modifier ses droits.', hint: 'bash script.sh : bash n\'a besoin que de lire le fichier.', solution: ['bash script.sh'],
    check: sh => sh.ranScript.has(HOME + '/script.sh') && !(sh.modeOf('~/script.sh') & 0o111) ? [true, 'bash lit le script : seul r est nécessaire.'] : [false, 'Lance le script sans chmod (indice : donne-le à bash).'] }),
  'l15-t2': T({ seed: 'perms', title: 'Ouvrir un répertoire', prompt: 'Projets est en 700. Fais en sorte que le groupe et les autres puissent lister son contenu et y entrer, sans pouvoir y écrire.', hint: 'chmod go+rx Projets', solution: ['chmod go+rx Projets'],
    check: sh => sh.modeOf('~/Projets') === 0o755 ? [true, 'rwxr-xr-x : lister (r) et entrer (x).'] : [false, 'Projets doit finir en rwxr-xr-x.'] }),

  /* ---------------------------------------------------------- l16 ls -l */
  'l16-q1': Q('Dans -rwxr-xr--, que représente le premier caractère « - » ?', ['Un fichier ordinaire', 'Un répertoire', 'Un droit refusé', 'Un lien'], 'Le 1er caractère donne le type.'),
  'l16-q2': Q('Que peut faire le groupe sur -rwxr-xr-- ?', ['Lire et exécuter', 'Lire seulement', 'Tout faire', 'Rien'], 'Le 2e bloc est r-x.'),
  'l16-q3': Q('Que peuvent faire les autres sur -rwxr-xr-- ?', ['Lire seulement', 'Lire et exécuter', 'Rien', 'Lire et écrire'], 'Le dernier bloc est r--.'),
  'l16-q4': Q('Que signifie drwx------ ?', ['Un répertoire accessible seulement par son propriétaire', 'Un fichier privé', 'Un répertoire public', 'Un répertoire vide'], 'd = répertoire ; rwx pour u ; rien pour g et o.'),
  'l16-d1': D('who'),

  /* ---------------------------------------------------------- l17 chmod symbolique */
  'l17-q1': Q('Que fait chmod u+x script.sh ?', ['Ajoute l\'exécution au propriétaire', 'Retire l\'exécution à tous', 'Exécute le script', 'Donne tous les droits'], 'u = propriétaire, + = ajouter, x = exécuter. Le script n\'est pas lancé.'),
  'l17-q2': Q('Que fait chmod go-rw fichier.txt ?', ['Retire lecture et écriture au groupe et aux autres', 'Les leur donne', 'Retire tout au propriétaire', 'Rien'], 'g et o visés, - retire, rw retirés.'),
  'l17-q3': Q('Que fait chmod a=r fichier.txt ?', ['Lecture seule pour tout le monde', 'Ajoute la lecture sans toucher au reste', 'Retire la lecture', 'Rend exécutable'], '= remplace : tout le monde a r-- et rien d\'autre.'),
  'l17-q4': Q('Différence entre « + » et « = » ?', ['+ ajoute ; = remplace tous les droits de la catégorie', 'Aucune', '+ remplace ; = ajoute', '= retire'], 'g+w garde le reste ; g=w ne laisse que w.'),
  'l17-t1': T({ seed: 'perms', title: 'Rendre un script exécutable', prompt: './script.sh échoue. Ajoute le droit x au propriétaire, puis lance le script.', hint: 'chmod u+x script.sh puis ./script.sh', solution: ['chmod u+x script.sh', './script.sh'],
    check: sh => (sh.modeOf('~/script.sh') & 0o100) && sh.ranScript.has(HOME + '/script.sh') ? [true, 'Le script s\'est exécuté.'] : [false, 'Ajoute x au propriétaire, puis lance ./script.sh.'] }),
  'l17-t2': T({ seed: 'perms', title: 'Fichier privé', prompt: 'Retire à secret.txt tous les droits du groupe et des autres (garde ceux du propriétaire).', hint: 'chmod go-rwx secret.txt', solution: ['chmod go-rwx secret.txt'],
    check: sh => sh.modeOf('~/secret.txt') === 0o600 ? [true, 'secret.txt est en rw-------.'] : [false, 'Le résultat attendu est rw------- (600).'] }),
  'l17-t3': T({ seed: 'perms', title: 'Entrer dans un répertoire', prompt: 'cd prive échoue : le répertoire est en 600. Ajoute le seul droit qui manque au propriétaire, puis entre dedans.', hint: 'chmod u+x prive puis cd prive', solution: ['chmod u+x prive', 'cd prive'],
    check: sh => at(sh, HOME + '/prive') ? [true, 'x sur un répertoire permet d\'y entrer.'] : [false, 'Il faut être dans /home/etudiant/prive.'] }),
  'l17-d1': D('sym'),

  /* ---------------------------------------------------------- l18 octal */
  'l18-q1': Q('Quelle valeur octale correspond à rwx ?', ['7', '6', '5', '4'], '4 + 2 + 1 = 7.'),
  'l18-q2': Q('Que signifie chmod 644 fichier.txt ?', ['rw- pour le propriétaire, r-- pour le groupe et les autres', 'Tout pour tous', 'Lecture seule pour tous', 'rw- pour tous'], '6 = rw-, 4 = r--.'),
  'l18-q3': Q('Quelle valeur octale pour -rwxr-x--- ?', ['750', '755', '740', '570'], 'rwx = 7, r-x = 5, --- = 0.'),
  'l18-q4': Q('Pour obtenir -rw------- en octal, on écrit :', ['chmod 600', 'chmod 700', 'chmod 006', 'chmod 660'], 'rw- = 6 pour u, puis 0 et 0.', true),
  'l18-t1': T({ seed: 'perms', title: 'Deux chmod octaux', prompt: 'Donne les droits 755 au répertoire Projets (il est en 700) et 644 au fichier notes.txt (il est en 600).', hint: 'chmod 755 Projets puis chmod 644 notes.txt', solution: ['chmod 755 Projets', 'chmod 644 notes.txt'],
    check: sh => sh.modeOf('~/Projets') === 0o755 && sh.modeOf('~/notes.txt') === 0o644 ? [true, 'Projets en 755, notes.txt en 644.'] : [false, 'Projets doit être en 755 et notes.txt en 644.'] }),
  'l18-t2': T({ seed: 'perms', title: 'Partager avec le groupe', prompt: 'Mets le répertoire Documents en rwxr-x--- avec la méthode octale.', hint: '7, 5, 0 : chmod 750 Documents', solution: ['chmod 750 Documents'],
    check: sh => sh.modeOf('~/Documents') === 0o750 && ran(sh, /chmod\s+0?750/) ? [true, 'rwxr-x--- = 750.'] : [false, 'Le résultat attendu est 750, écrit en octal.'] }),
  'l18-d1': D('str2oct'),
  'l18-d2': D('oct2str'),

  /* ---------------------------------------------------------- l19 umask */
  'l19-q1': Q('Avec umask 022, quels droits ont les nouveaux fichiers ?', ['644', '755', '666', '600'], 'On retire w au groupe et aux autres de 666.'),
  'l19-q2': Q('Avec umask 022, quels droits ont les nouveaux répertoires ?', ['755', '644', '777', '700'], 'On retire w au groupe et aux autres de 777.'),
  'l19-q3': Q('Que fait umask 077 ?', ['Les futurs fichiers seront en 600 et les répertoires en 700', 'Il rend privés les fichiers existants', 'Il donne tout aux autres', 'Il supprime les droits du propriétaire'], 'umask n\'agit que sur les futures créations.'),
  'l19-q4': Q('Avec umask 037, quels droits reçoit un nouveau fichier ?', ['640', '627', '637', '600'], 'On retire des bits : 666 sans --- -wx rwx = rw- r-- --- = 640. La soustraction (627) est fausse.'),
  'l19-t1': T({ seed: 'empty', title: 'Créer en privé', prompt: 'Règle umask à 077, puis crée le fichier prive.txt et le répertoire prive2. Ils doivent être en 600 et 700.', hint: 'umask 077, touch prive.txt, mkdir prive2', solution: ['umask 077', 'touch prive.txt', 'mkdir prive2'],
    check: sh => sh.modeOf('~/prive.txt') === 0o600 && sh.modeOf('~/prive2') === 0o700 ? [true, 'Le masque 077 a tout retiré au groupe et aux autres.'] : [false, 'prive.txt en 600 et prive2 en 700 : règle d\'abord umask.'] }),
  'l19-d1': D('umask'),

  /* ---------------------------------------------------------- l20 ACL */
  'l20-q1': Q('Que signale le « + » dans -rw-rw-r--+ ?', ['Le fichier a des ACL', 'Le fichier est exécutable', 'Le fichier est compressé', 'Le fichier est caché'], 'Et le 2e bloc affiche alors le masque.'),
  'l20-q2': Q('Une ACL donne rw- à alice, le masque vaut r-x. Quel est le droit effectif d\'alice ?', ['r--', 'rw-', 'r-x', 'rwx'], 'Effectif = entrée ∩ masque : seul r est dans les deux.'),
  'l20-q3': Q('Quelle commande donne à bob le droit de lire et écrire f.txt ?', ['setfacl -m u:bob:rw f.txt', 'getfacl -m u:bob:rw f.txt', 'chmod bob+rw f.txt', 'chown bob:rw f.txt'], 'setfacl -m (modify) u:NOM:DROITS.', true),
  'l20-q4': Q('À quoi sert une ACL par défaut sur un répertoire ?', ['Les fichiers créés dedans en héritent', 'Elle s\'applique au répertoire lui-même', 'Elle remplace le umask de tout le système', 'Elle bloque chmod'], 'Préfixe d: ou option -d ; seuls les répertoires en ont.'),
  'l20-t1': T({ title: 'Partager avec son binôme', prompt: 'Donne à alice la lecture et l\'écriture sur Documents/rapport.txt avec une ACL, sans changer les droits des autres.', hint: 'setfacl -m u:alice:rw Documents/rapport.txt', solution: ['setfacl -m u:alice:rw Documents/rapport.txt'],
    check: sh => { const n = sh.peek('~/Documents/rapport.txt'); return n.acl && n.acl.u.alice === 6 && (n.acl.mask & 6) === 6 && (n.mode & 7) === 4 ? [true, 'alice a rw-, les autres gardent r--.'] : [false, 'Il faut une entrée user:alice:rw- (et les autres inchangés).']; } }),
  'l20-d1': D('acl'),

  /* ---------------------------------------------------------- l21 chiffrement */
  'l21-q1': Q('Dans le chiffrement symétrique…', ['la même clé chiffre et déchiffre', 'on chiffre avec une clé publique', 'il n\'y a pas de clé', 'chaque fichier a deux clés'], 'Un seul secret partagé (un mot de passe, par exemple).'),
  'l21-q2': Q('Pour envoyer un message que seule Alice pourra lire, on le chiffre avec…', ['la clé publique d\'Alice', 'la clé privée d\'Alice', 'sa propre clé publique', 'la clé privée de l\'expéditeur'], 'Seule la clé privée d\'Alice pourra déchiffrer.'),
  'l21-q3': Q('Chiffrer avec SA clé privée sert à…', ['signer : prouver qu\'on est l\'auteur', 'cacher le message à tout le monde', 'compresser', 'rien'], 'Tout le monde peut vérifier avec la clé publique.'),
  'l21-q4': Q('diff clair.txt dechiffre.txt n\'affiche rien. Que conclure ?', ['Les deux fichiers sont identiques', 'diff a échoué', 'Les fichiers sont vides', 'Le déchiffrement a échoué'], 'diff ne montre que les différences.'),
  'l21-t1': T({ title: 'Vérifier une copie', prompt: 'Copie Documents/notes.txt en copie.txt, puis vérifie avec diff que les deux fichiers sont identiques.', hint: 'cp Documents/notes.txt copie.txt puis diff Documents/notes.txt copie.txt', solution: ['cp Documents/notes.txt copie.txt', 'diff Documents/notes.txt copie.txt'],
    check: sh => sh.exists('~/copie.txt') && sh.outLog.some(o => /^\s*diff\s/.test(o.line) && !o.out && !o.err) ? [true, 'diff silencieux : fichiers identiques.'] : [false, 'Fais la copie puis un diff qui n\'affiche rien.'] }),

  /* ---------------------------------------------------------- l22 compiler */
  'l22-q1': Q('Que produit « javac Bonjour.java » ?', ['Le fichier Bonjour.class (bytecode)', 'Un exécutable a.out', 'L\'affichage du programme', 'Bonjour.jar'], 'javac compile ; java lance.'),
  'l22-q2': Q('Comment lancer la classe compilée Bonjour.class ?', ['java Bonjour', 'java Bonjour.class', './Bonjour.class', 'javac Bonjour'], 'On donne le nom de la classe, sans .class.', true),
  'l22-q3': Q('Quel est le nom de l\'exécutable produit par « g++ prog.cpp » ?', ['a.out', 'prog', 'prog.exe', 'prog.o'], 'Pour choisir le nom : -o prog.', true),
  'l22-q4': Q('Pourquoi tape-t-on ./hello et pas hello ?', ['Le répertoire courant n\'est pas dans le PATH', 'Pour le lancer en root', 'Pour le compiler', 'C\'est une faute de frappe'], 'Le shell cherche les commandes dans les répertoires du PATH (/usr/bin…).'),
  'l22-t1': T({ start: 'Projets/tp1', title: 'Compiler et lancer du Java', prompt: 'Compile Bonjour.java, puis lance le programme.', hint: 'javac Bonjour.java puis java Bonjour', solution: ['javac Bonjour.java', 'java Bonjour'],
    check: sh => sh.exists('~/Projets/tp1/Bonjour.class') && said(sh, 'Bonjour depuis Java') ? [true, 'javac puis java.'] : [false, 'Bonjour.class doit exister et le programme doit s\'afficher.'] }),
  'l22-t2': T({ start: 'Projets/tp1', title: 'Compiler du C++', prompt: 'Compile hello.cpp en un exécutable nommé salut, puis lance-le.', hint: 'g++ hello.cpp -o salut puis ./salut', solution: ['g++ hello.cpp -o salut', './salut'],
    check: sh => sh.exists('~/Projets/tp1/salut') && sh.ranScript.has(HOME + '/Projets/tp1/salut') ? [true, 'Exécutable salut créé et lancé.'] : [false, 'Crée salut avec g++ -o, puis lance ./salut.'] }),
  'l22-t3': T({ start: 'Projets/tp1', title: 'Seulement la sortie normale', prompt: 'Lance Sorties.java (java Sorties.java) en jetant les messages d\'erreur dans /dev/null.', hint: 'java Sorties.java 2> /dev/null', solution: ['java Sorties.java 2> /dev/null'],
    check: sh => sh.outLog.some(o => o.out.includes('stdout') && !o.err && /2>/.test(o.line)) ? [true, 'Seule la ligne de stdout reste.'] : [false, 'Lance Sorties.java avec 2> /dev/null.'] }),

  /* ---------------------------------------------------------- l23 processus */
  'l23-q1': Q('Que fait le & à la fin de « gedit notes.txt & » ?', ['Il lance la commande en arrière-plan : le terminal reste disponible', 'Il lance la commande deux fois', 'Il la lance en root', 'Il enchaîne avec la suivante si elle réussit'], 'L\'invite revient tout de suite. (&& est différent : « si ça a marché, alors… ».)'),
  'l23-q2': Q('Que fait Ctrl+Z sur une commande au premier plan ?', ['Il la suspend (pause) ; bg ou fg la reprennent', 'Il l\'arrête définitivement', 'Il annule la dernière action', 'Il ferme le terminal'], 'Ctrl+C l\'arrêterait.'),
  'l23-q3': Q('Comment ramener la tâche [2] au premier plan ?', ['fg %2', 'bg %2', 'jobs 2', 'kill %2'], 'fg = foreground.', true),
  'l23-q4': Q('Un programme ne répond plus à kill PID. Que faire ?', ['kill -9 PID', 'Ctrl+Z', 'rm PID', 'sudo PID'], '-9 (KILL) ne peut pas être ignoré.', true),
  'l23-t1': T({ title: 'Une tâche de fond', prompt: 'Lance sleep 500 en arrière-plan, vérifie qu\'il apparaît avec jobs, puis arrête-le avec kill.', hint: 'sleep 500 &, jobs, kill %1', solution: ['sleep 500 &', 'jobs', 'kill %1'],
    check: sh => ran(sh, /sleep\s+500\s*&/) && said(sh, 'sleep 500') && ran(sh, /^\s*kill\b/) && !sh.jobs.length ? [true, 'Lancée, vue, arrêtée.'] : [false, 'Lance sleep 500 &, regarde jobs, puis kill la tâche.'] }),
  'l23-t2': T({ title: 'Suspendre puis relancer', prompt: 'Lance sleep 100 au premier plan, suspends-le avec Ctrl+Z, puis relance-le en arrière-plan.', hint: 'sleep 100, puis Ctrl+Z (bouton sous le terminal), puis bg', solution: ['sleep 100', '^Z', 'bg'],
    check: sh => sh.jobs.some(j => j.state === 'Running' && j.cmd === 'sleep 100') && ran(sh, /^\s*bg\b/) ? [true, 'Tâche suspendue puis relancée en arrière-plan.'] : [false, 'sleep 100, Ctrl+Z, puis bg : la tâche doit être Running.'] })
};
const EX_IDS = Object.keys(EX);

/* ================================================================== AIDE-MÉMOIRE (ordre de l'aide-mémoire R1.04) */
const MEMO = [
  { t: 'Aide', rows: [['man', '[chapitre] sujet', 'consulter une page de manuel', 'l2'], ['apropos', 'sujet', 'rechercher dans le manuel', 'l2'], ['help', 'commande interne', 'aide d\'une commande interne du shell', 'l2'], ['type', 'commande', 'commande interne ou programme ?', 'l2']] },
  { t: 'Répertoires', rows: [['mkdir', '[-p] répertoire...', 'créer un ou des répertoires', 'l4'], ['rmdir', 'répertoire...', 'supprimer des répertoires vides', 'l4'], ['ls', '[-latrRdh] [répertoire...]', 'voir le contenu ; -l format long, -a tout', 'l4'], ['tree', '[répertoire]', 'contenu récursif sous forme d\'arbre', 'l4'], ['du', '-sh répertoire', 'place occupée', 'l4'], ['pwd', '', 'chemin du répertoire courant', 'l3'], ['cd', '[répertoire]', 'changer de répertoire (par défaut : accueil)', 'l3']] },
  { t: 'Fichiers', rows: [['cp', '[-rv] fichier... destination', 'copier (-r : récursif)', 'l5'], ['mv', 'fichier... destination', 'déplacer ou renommer', 'l5'], ['rm', '[-rif] fichier...', 'supprimer (-r : récursif)', 'l5'], ['touch', 'fichier...', 'créer un fichier vide / changer sa date', 'l4'], ['file', 'fichier...', 'deviner le type d\'après le contenu', 'l6'], ['ln', '-s cible nom', 'créer un lien symbolique', 'l15']] },
  { t: 'Droits', rows: [['chmod', '[-R] mode fichier...', 'changer les droits (u+x, 755…)', 'l17'], ['chown', '[-R] user[:groupe] fichier...', 'changer le propriétaire (root)', 'l14'], ['chgrp', 'groupe fichier...', 'changer le groupe', 'l14'], ['umask', '[masque]', 'droits retirés aux nouveaux fichiers', 'l19'], ['getfacl', 'fichier', 'voir les ACL', 'l20'], ['setfacl', '-m u:nom:rwx fichier', 'modifier les ACL', 'l20'], ['id', '[utilisateur]', 'UID, groupes', 'l14'], ['su', '[utilisateur]', 'changer d\'utilisateur', 'l14'], ['sudo', 'commande', 'exécuter en root', 'l14'], ['passwd', '', 'changer le mot de passe', 'l14']] },
  { t: 'Éditer', rows: [['code', 'fichier', 'éditer avec un IDE (VS Code)', 'l6'], ['gedit', 'fichier', 'éditeur simple (fenêtre)', 'l6'], ['vim', 'fichier', 'éditeur puissant dans le terminal', 'l6'], ['nano', 'fichier', 'éditeur simple dans le terminal', 'l6']] },
  { t: 'Afficher', rows: [['echo', '[-n] mots...', 'afficher les mots', 'l1'], ['clear', '', 'effacer le terminal', 'l1'], ['cat', '[-n] fichier...', 'afficher le contenu', 'l6'], ['head', '-n x fichier', 'les x premières lignes', 'l6'], ['tail', '-n x fichier', 'les x dernières lignes', 'l6'], ['less', 'fichier...', 'page par page (q pour quitter)', 'l6'], ['more', 'fichier...', 'comme less', 'l6'], ['wc', '[-lwc] fichier...', 'compter lignes, mots, octets', 'l6'], ['od', '-c | -t x1 fichier', 'voir les octets', 'l13'], ['evince', 'fichier', 'afficher un PDF', 'l6'], ['xdg-open', 'fichier', 'ouvrir avec le visualiseur par défaut', 'l6']] },
  { t: 'Archiver et compresser', rows: [['gzip', '[-v19k] fichier...', 'compresser (→ .gz)', 'l8'], ['gunzip', 'fichier.gz', 'décompresser', 'l8'], ['zcat', 'fichier.gz', 'afficher sans décompresser', 'l8'], ['bzip2 / bunzip2', 'fichier', 'idem avec bzip2 (.bz2)', 'l8'], ['tar', '-cvf archive.tar rep', 'créer une archive (-z : gzip)', 'l8'], ['tar', '-tvf archive.tar', 'lister', 'l8'], ['tar', '-xvf archive.tar [f]', 'extraire', 'l8']] },
  { t: 'Compiler', rows: [['g++', '[-Wall] fichier... [-o exécutable]', 'compiler du C++ (a.out par défaut)', 'l22'], ['javac', 'fichier.java...', 'compiler du Java', 'l22'], ['java', 'Classe', 'exécuter une classe Java', 'l22']] },
  { t: 'Divers et réseau', rows: [['date', '[-d desc] [+format]', 'afficher la date', 'l1'], ['cal', '[[mois] année]', 'afficher le calendrier', 'l1'], ['history', '', 'commandes déjà tapées', 'l1'], ['rwho', '', 'utilisateurs présents sur le réseau local', 'l9'], ['ssh', '[compte@]machine', 'session sur une autre machine', 'l9'], ['ssh-keygen', '-t rsa', 'créer une paire de clés', 'l9'], ['scp', '[-r] source destination', 'copier par ssh (compte@machine:chemin)', 'l10'], ['rsync', '-avz source destination', 'synchroniser', 'l10'], ['exit', '', 'fermer le shell courant', 'l1']] },
  { t: 'Processus', rows: [['jobs', '', 'liste des tâches du terminal', 'l23'], ['fg', '[%n]', 'tâche au premier plan', 'l23'], ['bg', '[%n]', 'tâche en arrière-plan', 'l23'], ['ps', '[-ef]', 'informations sur les processus', 'l23'], ['kill', '[-9] pid | %n', 'envoyer un signal (arrêter)', 'l23']] },
  { t: 'Filtres', rows: [['grep', '[-vicn] motif fichier', 'lignes qui contiennent le motif', 'l12'], ['cut', '-d: -f1,3 fichier', 'découper en colonnes', 'l12'], ['join', 'f1 f2', 'jointure de deux fichiers triés', 'l12'], ['sort', '[-nrtku] fichier', 'trier', 'l12'], ['uniq', '[-c]', 'fusionner les lignes voisines identiques', 'l12'], ['tr', 'set1 set2', 'remplacer des caractères', 'l12'], ['diff', 'f1 f2', 'différences entre deux fichiers', 'l21'], ['iconv', '-f code -t code f -o g', 'convertir l\'encodage', 'l13']] }
];
const MEMO_SHELL = [
  ['cmd1 | cmd2', 'tube : sortie de cmd1 → entrée de cmd2', 'l12'], ['> f', 'stdout dans f (écrase)', 'l11'], ['>> f', 'stdout à la fin de f', 'l11'], ['< f', 'stdin depuis f', 'l11'], ['2> f', 'stderr dans f', 'l11'], ['> f 2>&1', 'stdout et stderr dans f', 'l11'],
  ['cmd &', 'lancer en arrière-plan', 'l23'], ['cmd1 ; cmd2', 'l\'une après l\'autre', 'l1'], ['cmd1 && cmd2', 'cmd2 seulement si cmd1 a réussi', 'l1'], ['cmd1 || cmd2', 'cmd2 seulement si cmd1 a échoué', 'l1'],
  ['* ? [abc] [a-z] [!a]', 'jokers', 'l7'], ['"…"  \'…\'  \\', 'protéger (pas d\'expansion)', 'l7'], ['~  .  ..', 'accueil, courant, parent', 'l3'], ['$USER $HOME $?', 'variables (nom, accueil, code de retour)', 'l11']
];
const PIEGES = [
  ['Oublier l\'espace', c('cd..') + ', ' + c('ls-l') + ' : commande inconnue. Il faut ' + c('cd ..') + ', ' + c('ls -l') + '.'],
  ['Confondre / et rien', c('cd /Documents') + ' cherche à la racine ; ' + c('cd Documents') + ' cherche ici.'],
  ['rm sans réfléchir', 'Pas de corbeille. Avant ' + c('rm *.txt') + ', fais ' + c('ls *.txt') + '.'],
  ['cp d\'un répertoire sans -r', '« omitting directory » : ajoute ' + c('-r') + '.'],
  ['Redirection qui écrase', c('sort f > f') + ' vide f. Et ' + c('>') + ' remplace, ' + c('>>') + ' ajoute.'],
  ['Erreurs dans un fichier vide', 'Les messages d\'erreur sont sur stderr : ' + c('2>') + ', pas ' + c('>') + '.'],
  ['uniq sans sort', 'uniq ne fusionne que les lignes voisines : ' + c('sort | uniq -c') + '.'],
  ['Droit de supprimer', 'Il dépend du w du <strong>répertoire</strong>, pas du fichier.'],
  ['x sur un répertoire', 'Sans x, impossible d\'y entrer, même avec r.'],
  ['umask comme une soustraction', '037 sur 666 donne 640, pas 627 : on retire des bits.'],
  ['chmod sur un fichier avec ACL', 'Les droits du groupe deviennent le masque : les ACL peuvent être neutralisées.'],
  ['java Bonjour.class', 'On lance la classe : ' + c('java Bonjour') + '.'],
  ['Programme introuvable', c('hello') + ' : command not found. Le répertoire courant n\'est pas dans le PATH : ' + c('./hello') + '.'],
  ['scp sans deux-points', c('scp f compte@machine') + ' crée une copie locale ; il faut ' + c('compte@machine:') + '.'],
  ['Partager sa clé privée', 'Seule id_rsa.pub se diffuse. id_rsa reste secrète, en 600.'],
  ['Ctrl+C pour copier', 'Dans le terminal, Ctrl+C arrête la commande : copier = Ctrl+Maj+C.']
];
