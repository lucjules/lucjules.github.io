/* Intro système : la fiche recto verso autorisée au contrôle (une feuille A4).
   Une commande s'écrit F('ls', '[RÉP…]', [['-l', 'format long'], …], 'ce qu'elle fait sans option', 'exemple facultatif').
   Elle s'affiche « ls [RÉP…] [-l : format long, …] : ce qu'elle fait sans option. ex : … ». */
const F = (cmd, syn, opts, desc, exemple) => `<p class="fc"><b>${esc(cmd)}</b>${syn ? ' <i>' + esc(syn) + '</i>' : ''}${opts.length ? ' <span class="fo">[' + opts.map(o => `<code>${esc(o[0])}</code> : ${o[1]}`).join(', ') + ']</span>' : ''} : ${desc}${exemple ? ` <span class="fx">ex : <code>${esc(exemple)}</code></span>` : ''}</p>`;
const FT = (head, rows) => `<table class="ft"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const FS = (titre, html) => `<section class="fs"><h3>${titre}</h3>${html}</section>`;
const k = s => `<code>${esc(s)}</code>`;

const FICHE = () => [
  FS('Le shell : bases', `
<p class="fc">Ligne = <b>commande -options arguments</b>, séparés par des espaces. Options combinables : ${k('ls -l -a')} = ${k('ls -la')}. Options longues : ${k('--all')}. Le shell : lit → analyse (jokers, variables) → exécute → recommence. Invite ${k('user@machine:rép$')} (${k('#')} = root).</p>
<p class="fc"><b>Clavier</b> : ${k('Tab')} compléter (2× = liste) · ${k('↑ ↓')} historique · ${k('Ctrl+C')} arrêter · ${k('Ctrl+Z')} suspendre · ${k('Ctrl+D')} quitter · ${k('Ctrl+L')} effacer · ${k('Ctrl+R')} chercher dans l'historique · ${k('Ctrl+A/E')} début/fin de ligne · ${k('Ctrl+U/K')} effacer avant/après · ${k('Ctrl+W')} effacer le mot · ${k('Ctrl+Maj+C/V')} copier/coller.</p>
<p class="fc"><b>Enchaîner</b> : ${k('a ; b')} l'un puis l'autre · ${k('a && b')} b si a réussit · ${k('a || b')} b si a échoue · ${k('a &')} arrière-plan · ${k('a | b')} tube.</p>
<p class="fc"><b>Variables</b> : ${k('$USER')} nom · ${k('$HOME')} accueil · ${k('$PWD')} rép. courant · ${k('$HOSTNAME')} machine · ${k('$?')} code de retour (0 = succès) · ${k('$PATH')} rép. où chercher les commandes · ${k('nom=val')} (sans espaces) puis ${k('$nom')}.</p>`),
  FS('Aide', `
${F('man', '[chapitre] SUJET', [['-k MOT', 'comme apropos']], 'manuel de SUJET (dans less : <code>/mot</code> chercher, <code>n</code> suivant, <code>q</code> quitter)', 'man ls')}
${F('apropos', 'MOT', [], 'cherche MOT dans les descriptions de toutes les pages de man')}
${F('help', 'CMD', [], 'aide des commandes <u>internes</u> du shell (cd, echo, exit, history, jobs, umask…), pas de ls')}
${F('type', 'CMD', [], 'dit si CMD est interne (builtin) ou un programme (/usr/bin/…)')}
${F('CMD --help', '', [], 'résumé rapide des options')}
<p class="fc"><b>Synopsis</b> : ${k('[ ]')} facultatif · MAJUSCULES = à remplacer · ${k('...')} répétable · ${k('a|b')} au choix · gras = tel quel.</p>`),
  FS('Chemins et répertoires', `
<p class="fc">Racine ${k('/')} · ${k('~')} = ${k('/home/user')} · ${k('.')} courant · ${k('..')} parent. <b>Absolu</b> = commence par / (depuis la racine) ; <b>relatif</b> = depuis le rép. courant. Majuscules ≠ minuscules. /bin /usr/bin programmes · /etc config · /tmp temporaire (tous) · /home comptes · /root admin.</p>
${F('pwd', '', [], 'affiche le chemin absolu du répertoire courant')}
${F('cd', '[RÉP]', [['-', 'rép. précédent'], ['..', 'remonter'], ['~', 'accueil']], 'sans argument : retour au rép. d\'accueil', 'cd ../Projets/tp1')}
${F('ls', '[RÉP|FICHIER…]', [['-l', 'format long : droits, liens, propriétaire, groupe, taille, date, nom'], ['-a', 'aussi les fichiers cachés (.nom)'], ['-t', 'tri par date, récent d\'abord'], ['-r', 'ordre inverse'], ['-R', 'récursif (sous-rép.)'], ['-d', 'le rép. lui-même, pas son contenu'], ['-h', 'tailles lisibles 4K, 2M'], ['-n', 'UID/GID en nombres']], 'liste les noms du rép. courant, triés, sans les cachés', 'ls -la ~')}
${F('tree', '[RÉP]', [['-a', 'cachés'], ['-d', 'rép. seulement']], 'affiche l\'arborescence récursivement')}
${F('du', '[RÉP]', [['-s', 'total seulement'], ['-h', 'lisible']], 'place occupée par chaque sous-rép.', 'du -sh Photos')}
${F('quota', '', [['-s', 'lisible']], 'utilisation de ton quota de compte')}
${F('mkdir', 'RÉP…', [['-p', 'crée aussi les parents, pas d\'erreur si existe'], ['-v', 'affiche']], 'crée des répertoires (le parent doit exister)', 'mkdir -p a/b/c')}
${F('rmdir', 'RÉP…', [], 'supprime des répertoires <u>vides</u> seulement')}`),
  FS('Fichiers', `
${F('touch', 'F…', [], 'crée un fichier vide s\'il n\'existe pas, sinon met sa date à jour')}
${F('cp', 'SRC… DEST', [['-r', 'copie récursive (rép.)'], ['-i', 'demande avant d\'écraser'], ['-v', 'affiche'], ['-p', 'garde droits, dates, ACL']], 'copie un fichier ; refuse un rép. sans -r', 'cp -r Documents Sauvegarde')}
${F('mv', 'SRC… DEST', [['-i', 'demande'], ['-v', 'affiche']], 'déplace OU renomme (rép. compris, pas besoin de -r)', 'mv a.txt b.txt')}
<p class="fc"><b>Règle de DEST</b> (cp, mv) : rép. existant → la source va dedans ; sinon → c'est le nouveau nom.</p>
${F('rm', 'F…', [['-r', 'récursif : rép. + contenu'], ['-i', 'demande confirmation'], ['-f', 'force, pas d\'erreur si absent'], ['-v', 'affiche']], 'supprime des fichiers, définitivement (pas de corbeille) ; refuse un rép. sans -r', 'rm -r tp1')}
${F('ln', '-s CIBLE NOM', [], 'crée un lien symbolique (type l, droits toujours rwxrwxrwx)')}
${F('file', 'F…', [], 'devine le type d\'après le contenu (pas l\'extension)')}`),
  FS('Afficher et lire', `
${F('cat', '[F…]', [['-n', 'numérote les lignes']], 'affiche tout le contenu (concatène si plusieurs) ; sans F lit l\'entrée standard')}
${F('less', 'F', [], 'page par page : Espace avance, b recule, /mot cherche, n suivant, q quitte')}
${F('more', 'F', [], 'comme less mais seulement vers l\'avant')}
${F('head', 'F', [['-n X', 'X premières lignes (aussi -X)']], 'les 10 premières lignes')}
${F('tail', 'F', [['-n X', 'X dernières'], ['-n +X', 'à partir de la ligne X']], 'les 10 dernières lignes')}
${F('wc', 'F…', [['-l', 'lignes'], ['-w', 'mots'], ['-c', 'octets']], 'affiche lignes, mots, octets')}
${F('echo', 'MOTS…', [['-n', 'pas de retour à la ligne'], ['-e', 'interprète \\n \\t']], 'affiche les mots séparés par un espace')}
${F('clear', '', [], 'efface l\'écran (= Ctrl+L)')}
${F('date', '', [['-d DESC', 'autre date : tomorrow, Sunday'], ['+FORMAT', '%d %m %Y %H %M %S %A']], 'date et heure actuelles')}
${F('cal', '[[MOIS] ANNÉE]', [], 'calendrier du mois courant', 'cal 9 2026')}
${F('history', '', [], 'commandes déjà tapées, numérotées')}
${F('exit', '', [], 'ferme le shell (après su : revient à l\'utilisateur d\'avant)')}`),
  FS('Éditer et ouvrir', `
<p class="fc"><b>code</b> F (IDE VS Code ; <code>code .</code> = rép. courant) · <b>gedit</b> F (simple, fenêtre) · <b>nano</b> F (terminal : ^O enregistrer, ^X quitter) · <b>vim</b> F (terminal : <code>i</code> écrire, Échap, <code>:wq</code> enregistrer+quitter, <code>:q!</code> quitter sans enregistrer) · <b>evince</b> F.pdf · <b>xdg-open</b> F (programme par défaut).</p>
<p class="fc"><b>VS Code</b> : Ctrl+S enregistrer · Ctrl+P ouvrir un fichier · Ctrl+Maj+P palette (encodage…) · Ctrl+/ commenter · Alt+↑↓ déplacer la ligne · Ctrl+Maj+Alt+↓ dupliquer · Ctrl+D occurrence suivante · Ctrl+F/H chercher/remplacer · Ctrl+\` terminal.</p>`),
  FS('Jokers (méta-caractères)', `
<p class="fc">Remplacés par le <b>shell</b> avant de lancer la commande (marchent avec toutes, même echo). Aucun résultat → motif laissé tel quel. Ne prennent pas les cachés (.nom) sauf motif ${k('.*')}.</p>
${FT(['Motif', 'Sens', 'Exemple'], [[k('*'), 'n\'importe quelle chaîne (même vide)', k('*.java')], [k('?'), 'exactement 1 caractère', k('tp?') + ' → tp1, pas tp10'], [k('[abc]'), '1 caractère parmi', k('[aeiouy]*') + ' voyelle'], [k('[a-e]'), '1 caractère de l\'intervalle', k('[0-9]*') + ' chiffre'], [k('[!abc]'), '1 caractère SAUF', k('[!a-m]*')]])}
<p class="fc"><b>Protéger</b> : ${k('"…"')} (garde $VAR) et ${k("'…'")} (rien n'est interprété) : espaces et jokers n'ont plus d'effet ; ${k('\\*')} protège 1 caractère. ${k('echo "*"')} → *. Avant ${k('rm *.x')}, tester ${k('ls *.x')}.</p>
<p class="fc">TD : ${k('echo /mnt/roost/users/x*')} commence par x · ${k('*x*')} contient x · ${k('*[xwz]*')} x, w ou z · ${k('?[a-e]*')} nom (après l'initiale) de a à e.</p>`),
  FS('Archiver et compresser', `
${F('gzip', 'F…', [['-k', 'garde l\'original'], ['-v', 'affiche le gain'], ['-1…-9', 'rapide…fort'], ['-d', 'décompresse']], 'remplace F par F.gz (sans perte)')}
${F('gunzip', 'F.gz', [], 'remplace F.gz par F')}
${F('zcat / zless', 'F.gz', [], 'affiche sans décompresser (cat montre du charabia)')}
${F('bzip2 / bunzip2 / bzcat', 'F', [], 'idem en .bz2 (Burrows-Wheeler, plus fort, plus lent ; gzip = Lempel-Ziv)')}
${F('tar', '-cvf A.tar RÉP…', [['-c', 'créer'], ['-t', 'lister'], ['-x', 'extraire'], ['-f A', 'nom de l\'archive (juste après)'], ['-v', 'verbeux'], ['-z', '+gzip (.tar.gz, .tgz)'], ['-j', '+bzip2'], ['-C RÉP', 'extraire dans RÉP']], 'regroupe des fichiers en 1 seul (ne compresse pas seul)', 'tar -czvf s.tgz Doc')}
<p class="fc">${k('tar -tvf A.tar')} lister · ${k('tar -xvf A.tar')} tout extraire · ${k('tar -xvf A.tar M1101/td1.txt')} un seul. Se placer <b>au-dessus</b> du rép. à archiver. Compression <b>sans perte</b> (texte, code) / <b>avec perte</b> (JPEG, MP3). Aussi zip/unzip, 7z.</p>`),
  FS('Redirections et tubes', `
${FT(['Écriture', 'Effet'], [[k('cmd > f'), 'stdout (1) dans f, <b>écrase</b> (f vidé AVANT de lancer cmd)'], [k('cmd >> f'), 'stdout ajouté à la fin de f'], [k('cmd < f'), 'stdin (0) lu dans f au lieu du clavier'], [k('cmd 2> f'), 'stderr (2, erreurs) dans f'], [k('cmd > f 2>&1'), 'stdout ET stderr dans f (cet ordre)'], [k('cmd 2> /dev/null'), 'jeter les erreurs'], [k('a | b'), 'tube : stdout de a → stdin de b'], [k('{ a; b; } > f'), 'grouper plusieurs commandes']])}
<p class="fc">0 stdin = clavier (Java System.in) · 1 stdout = écran (System.out) · 2 stderr = écran (System.err) : 2 canaux distincts. Les erreurs de javac sont sur stderr → <code>2&gt;</code>. Piège : ${k('sort f > f')} vide f.</p>`),
  FS('Filtres', `
${F('grep', 'MOTIF [F…]', [['-i', 'ignore la casse'], ['-v', 'lignes SANS le motif'], ['-c', 'compte'], ['-n', 'n° de ligne'], ['-w', 'mot entier'], ['-E', 'regex étendue (|, +)'], ['-r', 'récursif']], 'affiche les lignes qui contiennent MOTIF', 'grep -i erreur log')}
<p class="fc">Regex : ${k('^')} début de ligne · ${k('$')} fin · ${k('.')} 1 caractère · ${k('*')} 0 ou + fois le précédent · ${k('[0-9]')} un chiffre. ${k('grep "^M" f')}.</p>
${F('sort', '[F]', [['-n', 'numérique (sinon 10 < 9)'], ['-r', 'inverse'], ['-t:', 'séparateur :'], ['-k4', 'selon le champ 4'], ['-u', 'sans doublons']], 'trie les lignes par ordre alphabétique', 'sort -t: -k4 -n f')}
${F('uniq', '', [['-c', 'compte'], ['-d', 'seulement les répétées']], 'fusionne les lignes identiques <u>voisines</u> → toujours après sort')}
${F('cut', '[F]', [['-d SÉP', 'séparateur (tab par défaut)'], ['-f 1,3', 'champs 1 et 3 (2-4 = de 2 à 4)'], ['-c 1-3', 'caractères 1 à 3']], 'extrait des colonnes', 'cut -d: -f1,7 /etc/passwd')}
${F('join', 'F1 F2', [['-t SÉP', 'séparateur']], 'réunit les lignes de même 1er champ (fichiers triés), comme une jointure SQL')}
${F('tr', 'SET1 SET2', [['-d SET', 'supprime']], 'remplace caractère par caractère, lit SEULEMENT stdin', 'tr a-z A-Z < f')}
${F('diff', 'F1 F2', [], 'rien = identiques ; sinon < lignes de F1, > lignes de F2')}
<p class="fc">ex : ${k('ls | wc -l')} · ${k('cut -d: -f3 f | sort | uniq -c')} · ${k('sort -t: -k4 -nr f | head -n 3')}.</p>`),
  FS('Codage des caractères', `
<p class="fc">bit = 0/1 · octet = 8 bits = 0..255. <b>ASCII</b> (1967) : 7 bits, 128 car., sans accents (A=65 0x41, a=97 0x61, 0=48, espace=32, \\n=10 0x0A ; minuscule = majuscule + 32). <b>ISO-8859-1 / Latin-1</b> : 8 bits, 0-127 = ASCII, accents en 128-255 (é = E9 = 233). Autres : Windows-1252, CP850 (DOS), EBCDIC (IBM). <b>Unicode</b> : un n° par caractère, U+hexa (é U+00E9, € U+20AC). <b>UTF-32</b> 4 octets · <b>UTF-16</b> 2 ou 4 · <b>UTF-8</b> 1 à 4 :</p>
${FT(['Octets', 'Plage', 'Bits'], [['1', 'U+0000-007F (ASCII)', k('0xxxxxxx')], ['2', 'U+0080-07FF (é ç)', k('110xxxxx 10xxxxxx')], ['3', 'U+0800-FFFF (€)', k('1110xxxx 10xxxxxx 10xxxxxx')], ['4', 'U+10000-10FFFF', k('11110xxx 10xxxxxx ×3')]])}
<p class="fc">é UTF-8 = <b>C3 A9</b> (303 251 octal) ; Latin-1 = <b>E9</b> (351). UTF-8 lu en Latin-1 → « Ã© » ; Latin-1 lu en UTF-8 → « � ». + UTF-8 : ASCII inchangé, robuste ; − n-ième caractère = parcours.</p>
${F('od', 'F', [['-c', 'caractères, non-ASCII en octal'], ['-t x1', 'hexa'], ['-t u1', 'décimal non signé'], ['-t d1', 'signé']], 'octets du fichier (1re colonne = position en octal)')}
${F('iconv', '-f ANCIEN -t NOUVEAU F -o SORTIE', [['-l', 'liste des codages']], 'convertit l\'encodage', 'iconv -f ISO-8859-1 -t UTF-8 a -o b')}`),
  FS('Utilisateurs et groupes', `
${F('whoami', '', [], 'ton nom')}
${F('id', '[USER]', [], 'uid=…(nom) gid=…(groupe primaire) groups=… (tous)')}
${F('groups', '[USER]', [], 'tes groupes')}
<p class="fc"><b>/etc/passwd</b> ${k('nom:x:UID:GID:commentaire:/home/nom:/bin/bash')} (mdp chiffré dans /etc/shadow) · /etc/group. root = UID 0, tous les droits.</p>
${F('su', '[USER]', [['-', 'shell de connexion (va dans son accueil)']], 'devient USER (root par défaut) avec SON mot de passe ; exit pour revenir')}
${F('sudo', 'CMD', [], 'lance CMD en root avec TON mot de passe (si groupe sudo)', 'sudo apt install sshfs')}
${F('passwd', '', [], 'change ton mot de passe (rien ne s\'affiche en tapant)')}
${F('chown', 'USER[:GROUPE] F…', [['-R', 'récursif']], 'change le propriétaire : <b>root seulement</b>', 'sudo chown alice f')}
${F('chgrp', 'GROUPE F…', [['-R', 'récursif']], 'change le groupe : propriétaire, vers un de SES groupes')}`),
  FS('Droits rwx', `
${FT(['', 'Fichier', 'Répertoire'], [[k('r') + ' 4', 'lire le contenu', 'lister les noms'], [k('w') + ' 2', 'modifier le contenu', 'créer / renommer / <b>supprimer</b> dedans'], [k('x') + ' 1', 'exécuter', '<b>traverser</b> : cd, accès aux fichiers']])}
<p class="fc"><b>ls -l</b> : ${k('-rwxr-x---')} = type (${k('-')} fichier, ${k('d')} rép., ${k('l')} lien) + <b>u</b> propriétaire + <b>g</b> groupe + <b>o</b> autres. Puis : liens, propriétaire, groupe, taille, date, nom. On applique la <b>1re catégorie</b> qui te concerne (propriétaire → groupe → autres). Supprimer un fichier = <b>w du rép.</b> ./script = r+x ; ${k('bash script')} = r seul. ${k('t')} final (/tmp drwxrwxrwt) = sticky : on ne supprime que ses fichiers. Seul le propriétaire (ou root) fait chmod.</p>
${F('chmod', 'MODE F…', [['-R', 'récursif'], ['u g o a', 'qui (a = tous)'], ['+ - =', 'ajouter, retirer, mettre exactement'], ['r w x', 'droits'], ['X', 'x pour les rép. (et fichiers déjà x)']], 'change les droits ; plusieurs clauses : <code>u+x,go-w</code>', 'chmod go-rwx secret')}
${FT(['rwx', '---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'], [['octal', '0', '1', '2', '3', '4', '5', '6', '7']])}
<p class="fc">Octal = un chiffre par u, g, o : rwxr-xr-- = 7 5 4. <b>644</b> rw-r--r-- fichier · <b>600</b> rw------- privé (clé ssh) · <b>755</b> rwxr-xr-x programme/rép. · <b>700</b> rép. privé · <b>750</b> rwxr-x--- groupe · <b>444</b> lecture seule · 777 à éviter. Octal = fixe tout ; symbolique = change un droit. ${k('chmod +x f')} sans lettre ≈ a+x mais respecte umask.</p>`),
  FS('umask', `
<p class="fc">Droits <b>retirés</b> aux <b>futurs</b> fichiers. Base fichier <b>666</b> (jamais x), rép. <b>777</b>, on enlève les bits du masque (<b>pas une soustraction</b>) : 022 → 644 / 755 · 077 → 600 / 700 · 027 → 640 / 750 · 002 → 664 / 775 · <b>037 → 640</b> (pas 627) / 740. ${k('umask')} affiche (0022), ${k('umask 077')} règle (shell courant ; permanent dans ~/.bashrc), ${k('umask -S')} droits accordés en symbolique.</p>`),
  FS('ACL', `
<p class="fc">Droits pour des utilisateurs/groupes <b>nommés</b>. ${k('+')} après les droits dans ls -l ; le 2e bloc affiche alors le <b>masque</b>, pas le groupe.</p>
${F('getfacl', 'F', [], 'lignes : user:: (propriétaire), user:nom:, group:: (groupe du fichier), group:nom:, mask::, other::, default:… (rép.)')}
${F('setfacl', 'F', [['-m u:nom:rwx', 'ajoute/modifie un user'], ['-m g:grp:r', 'un groupe'], ['-m m::rx', 'le masque'], ['-x u:nom', 'retire'], ['-b', 'tout retirer'], ['-R', 'récursif'], ['-m d:u:nom:rx', 'ACL par défaut (rép.)']], 'modifie les ACL', 'setfacl -m u:alice:rw f')}
<p class="fc"><b>Effectif = entrée ∩ masque</b> (rw- et masque r-x → r--, « #effective:r-- »). Le masque limite user:nom, group:: et group:nom (pas le propriétaire ni other). ${k('chmod')} sur le groupe change le <b>masque</b>. ACL par défaut d'un rép. → héritées par ce qu'on crée dedans. mv garde les ACL, cp seulement avec -p.</p>`),
  FS('Travail à distance', `
${F('ssh', '[COMPTE@]MACHINE [CMD]', [['-p PORT', 'port'], ['-X', 'affichage graphique']], 'shell chiffré sur une autre machine ; exit pour quitter', 'ssh jdupont@info-ssh1.iut.u-bordeaux.fr')}
${F('ssh-keygen', '-t rsa', [], 'crée ~/.ssh/id_rsa (<b>privée, secrète, 600</b>) et id_rsa.pub (<b>publique</b>) ; passphrase facultative')}
${F('ssh-copy-id', 'COMPTE@MACHINE', [], 'ajoute ta clé publique dans ~/.ssh/authorized_keys distant → plus de mot de passe')}
${F('scp', 'SRC… DEST', [['-r', 'rép.']], 'cp par ssh ; côté distant <code>compte@machine:chemin</code> (oublier « : » = copie locale !)', 'scp -r jd@m:TP .')}
${F('sftp', 'COMPTE@MACHINE', [], 'transfert interactif chiffré : ls, cd, get, put, mget, mput, bye (FTP = même chose NON chiffré ; FileZilla)')}
${F('rsync', 'SRC DEST', [['-a', 'archive (récursif, dates, droits)'], ['-v', 'affiche'], ['-z', 'compresse'], ['--delete', 'supprime en DEST ce qui n\'est plus en SRC']], 'ne copie que ce qui a changé ; SRC/ = le contenu, SRC = le rép.')}
${F('sshfs', 'COMPTE@MACHINE:. RÉP', [], 'monte un rép. distant dans RÉP (point de montage)')}
<p class="fc"><b>tmux</b> garde la session si le réseau coupe : Ctrl+b c nouveau · n suivant · d se détacher · ${k('tmux a')} se rattacher · [ défiler. <b>rwho</b> utilisateurs du réseau local. SSH-1 obsolète, SSH-2 actuel. Windows : PuTTY.</p>`),
  FS('Chiffrement', `
<p class="fc"><b>Symétrique</b> : même clé/mot de passe pour chiffrer et déchiffrer (AES, ccrypt) ; problème : transmettre le secret. <b>Asymétrique</b> (RSA) : chiffrer avec la clé <b>publique du destinataire</b>, il déchiffre avec sa <b>privée</b> ; chiffrer avec SA privée = <b>signature</b> (vérifiable avec la publique).</p>
${F('ccrypt', 'F', [['-e', 'chiffre → F.cpt'], ['-d', 'déchiffre']], 'chiffre avec un mot de passe')}
<p class="fc">${k('openssl enc -aes-128-cbc -in clair -out chiffre')} (ajouter ${k('-d')} pour déchiffrer) · ${k('openssl rsa -in ~/.ssh/id_rsa -pubout -out pub.pem')} · ${k('openssl pkeyutl -encrypt -pubin -inkey pub.pem -in c -out x')} (rsautl en ancien) · ${k('… -decrypt -inkey ~/.ssh/id_rsa')}. Vérifier : ${k('diff clair dechiffre')}. Disque entier : cryptsetup (LUKS), ecryptfs.</p>`),
  FS('Compiler et exécuter', `
${F('javac', 'F.java', [], 'compile en F.class (bytecode) ; erreurs sur stderr avec ligne et ^ ; classe public X → fichier X.java')}
${F('java', 'CLASSE', [], 'lance main, <b>sans .class</b> ; <code>java F.java</code> compile+lance (Java 11+)', 'java Bonjour')}
${F('g++', 'F.cpp', [['-o NOM', 'nom de l\'exécutable'], ['-Wall', 'tous les avertissements'], ['-c', 'compile sans lier (.o)']], 'compile en <b>a.out</b>', 'g++ -Wall f.cpp -o prog')}
<p class="fc">Lancer : ${k('./prog')} car le rép. courant n'est pas dans <b>PATH</b> (sinon « command not found »). Script : 1re ligne ${k('#!/bin/bash')} (shebang), ${k('chmod u+x s.sh')} puis ${k('./s.sh')}. Installer : ${k('sudo apt install PAQUET')}.</p>`),
  FS('Processus', `
<p class="fc">Processus = programme en cours, n° <b>PID</b> (parent : PPID). Premier plan : le shell attend ; ${k('cmd &')} arrière-plan → affiche ${k('[1] 4242')} (n° de tâche, PID).</p>
${F('ps', '', [['-ef / aux', 'tous les processus du système']], 'processus du terminal (PID, TTY, TIME, CMD)')}
${F('jobs', '', [], 'tâches du terminal : Running / Stopped')}
${F('fg', '[%N]', [], 'tâche N au premier plan')}
${F('bg', '[%N]', [], 'relance en arrière-plan une tâche suspendue')}
${F('kill', 'PID | %N', [['-9', 'KILL : force'], ['-STOP / -CONT', 'pause / reprise'], ['-l', 'liste des signaux']], 'envoie TERM (15) = demande d\'arrêt ; seulement ses processus (sauf root)')}
<p class="fc">Ctrl+C = INT (arrête) · Ctrl+Z = TSTP (suspend) puis ${k('bg')}. ex : ${k('gedit f')} bloque → Ctrl+Z → ${k('bg')}. ${k('sleep N')} attend N s.</p>`),
  FS('Messages d\'erreur', `
${FT(['Message', 'Cause'], [[k('No such file or directory'), 'chemin faux (TAB !)'], [k('Permission denied'), 'il manque r, w ou x → ls -l'], [k('Is a directory'), 'rm/cat sur un rép. (-r ?)'], [k('omitting directory'), 'cp sans -r'], [k('Directory not empty'), 'rmdir d\'un rép. non vide'], [k('File exists'), 'mkdir d\'un rép. existant'], [k('command not found'), 'faute de frappe / pas dans PATH (./)'], [k('Not a directory'), 'fichier pris pour un rép.'], [k('Operation not permitted'), 'réservé au propriétaire / root'], [k("';' expected"), 'javac : point-virgule manquant']])}`)
];
