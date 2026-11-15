/* Intro système : terminal Linux simulé.
   Système de fichiers en mémoire, utilisateurs et groupes, droits rwx, umask, ACL,
   tubes et redirections, variables, jokers, filtres, archives, codage, compilation, processus.
   Utilisable dans le navigateur (window.Sh) et dans Node (outils/tester-systeme.js). */
const Sh = (() => {
  'use strict';
  const HOST = 'intro';
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const SEED_DATE = new Date(2026, 8, 28, 14, 2);
  const pad2 = n => String(n).padStart(2, '0');
  const fmtDate = d => `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, ' ')} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  /* Marqueurs de couleur dans la sortie (retirés quand la sortie part dans un fichier ou un tube) */
  const M = { D: '\u0001', X: '\u0005', H: '\u0003', END: '\u0002' };
  const strip = s => String(s).replace(/[\u0001\u0002\u0003\u0005]/g, '');
  const noAcc = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* ---------- Utilisateurs et groupes ---------- */
  const USERS = {
    root: { uid: 0, gid: 'root', home: '/root', groups: ['root'] },
    etudiant: { uid: 1000, gid: 'etudiant', home: '/home/etudiant', groups: ['etudiant', 'info', 'sudo'] },
    alice: { uid: 1001, gid: 'alice', home: '/home/alice', groups: ['alice', 'info'] },
    bob: { uid: 1002, gid: 'bob', home: '/home/bob', groups: ['bob'] }
  };
  const GROUPS = { root: 0, sudo: 27, etudiant: 1000, alice: 1001, bob: 1002, info: 2000 };
  const PASSWD = Object.entries(USERS).map(([n, u]) => `${n}:x:${u.uid}:${GROUPS[u.gid]}:${n === 'root' ? 'root' : n}:${u.home}:/bin/bash`).join('\n') + '\n';
  const GROUPFILE = Object.entries(GROUPS).map(([g, id]) => `${g}:x:${id}:${Object.keys(USERS).filter(u => u !== g && USERS[u].groups.includes(g)).join(',')}`).join('\n') + '\n';

  /* ---------- Octets et codages ---------- */
  function utf8(str) {
    const out = [];
    for (const ch of str) {
      const c = ch.codePointAt(0);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | c >> 6, 0x80 | c & 63);
      else if (c < 0x10000) out.push(0xe0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63);
      else out.push(0xf0 | c >> 18, 0x80 | c >> 12 & 63, 0x80 | c >> 6 & 63, 0x80 | c & 63);
    }
    return out;
  }
  function encode(str, enc) {
    if (enc === 'latin1') return [...str].map(ch => { const c = ch.codePointAt(0); return c < 256 ? c : 63; });
    return utf8(str);
  }
  /* Décode des octets ; renvoie { text } ou { bad: position } */
  function decode(bytes, enc) {
    if (enc === 'latin1') return { text: bytes.map(b => String.fromCharCode(b)).join('') };
    if (enc === 'ascii') { const i = bytes.findIndex(b => b > 127); return i >= 0 ? { bad: i } : { text: bytes.map(b => String.fromCharCode(b)).join('') }; }
    let s = '';
    for (let i = 0; i < bytes.length;) {
      const b = bytes[i];
      let n = 0, c = 0;
      if (b < 0x80) { s += String.fromCharCode(b); i++; continue; }
      if ((b & 0xe0) === 0xc0) { n = 1; c = b & 31; } else if ((b & 0xf0) === 0xe0) { n = 2; c = b & 15; } else if ((b & 0xf8) === 0xf0) { n = 3; c = b & 7; } else return { bad: i };
      for (let k = 1; k <= n; k++) { const x = bytes[i + k]; if (x === undefined || (x & 0xc0) !== 0x80) return { bad: i }; c = c << 6 | x & 63; }
      s += String.fromCodePoint(c); i += n + 1;
    }
    return { text: s };
  }
  /* Ce que montre un terminal UTF-8 quand on lui envoie un texte codé autrement */
  const asTerminal = (text, enc) => (enc === 'latin1' ? (decode(encode(text, 'latin1'), 'utf8').text || [...text].map(ch => ch.codePointAt(0) > 127 ? '�' : ch).join('')) : text);
  const ENC_NAMES = { 'utf-8': 'utf8', utf8: 'utf8', 'iso-8859-1': 'latin1', 'iso8859-1': 'latin1', latin1: 'latin1', 'latin-1': 'latin1', 'iso-8859-15': 'latin1', 'windows-1252': 'latin1', cp1252: 'latin1', ascii: 'ascii', 'us-ascii': 'ascii' };

  /* ---------- Nœuds ---------- */
  const mkDir = (mode, owner, group) => ({ t: 'd', mode, owner, group, mtime: SEED_DATE, kids: new Map() });
  const mkFile = (mode, data, owner, group, extra) => Object.assign({ t: 'f', mode, owner, group, mtime: SEED_DATE, data: data || '' }, extra || {});
  const sizeOf = n => (n.t === 'd' ? 4096 : n.t === 'l' ? n.target.length : n.size != null ? n.size : encode(n.data, n.enc).length);
  function clone(n) {
    const c = Object.assign({}, n);
    if (n.acl) c.acl = JSON.parse(JSON.stringify(n.acl));
    if (n.t === 'd') { c.kids = new Map(); n.kids.forEach((k, name) => c.kids.set(name, clone(k))); }
    if (n.gz) c.gz = { name: n.gz.name, node: clone(n.gz.node) };
    if (n.tar) c.tar = n.tar.map(e => ({ path: e.path, node: clone(e.node) }));
    return c;
  }
  /* Contenu illisible (fichier binaire ou compressé) : toujours le même pour un même nom */
  function garble(seed, len) {
    let h = 7; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    let s = '';
    for (let i = 0; i < len; i++) { h = (h * 1103515245 + 12345) >>> 0; const v = h >>> 16 & 255; s += v < 32 || v > 126 ? '�' : String.fromCharCode(v); }
    return s;
  }

  /* ---------- Contenu des dossiers de départ ---------- */
  const COURS_TXT = ['R1.04 - Utilisation des systèmes informatiques', '', 'Semaine 1 : le terminal et les commandes de base',
    'Semaine 2 : fichiers et répertoires', 'Semaine 3 : les méta-caractères (jokers)', 'Semaine 4 : archiver et compresser',
    'Semaine 5 : éditeur et travail à distance (ssh, scp, rsync)', 'Semaine 6 : redirections et tubes', 'Semaine 7 : les filtres (grep, sort, cut)',
    'Semaine 8 : codage des caractères (ASCII, UTF-8)', 'Semaine 9 : utilisateurs et groupes', 'Semaine 10 : les droits rwx et chmod',
    'Semaine 11 : umask et ACL', 'Semaine 12 : chiffrement', 'Semaine 13 : processus et tâches', 'Semaine 14 : révisions',
    '', 'Conseil : lis le manuel (man) dès que tu découvres une commande.', 'Conseil : utilise la touche TAB pour compléter les noms.',
    'Conseil : relis toujours une commande rm avant de valider.', 'Fin du programme.'].join('\n') + '\n';
  const ETUDIANTS = ['Martin:Lea:G1:15', 'Bernard:Hugo:G2:9', 'Dubois:Ines:G1:18', 'Thomas:Lucas:G3:12', 'Robert:Emma:G2:14',
    'Petit:Nathan:G1:7', 'Durand:Chloe:G3:16', 'Leroy:Tom:G2:11', 'Moreau:Jade:G1:13', 'Simon:Louis:G3:10'].join('\n') + '\n';
  const BONJOUR_JAVA = 'public class Bonjour {\n    public static void main(String[] args) {\n        System.out.println("Bonjour depuis Java !");\n        System.out.println("Compilé avec javac, lancé avec java.");\n    }\n}\n';
  const ERREUR_JAVA = 'public class Erreur {\n    public static void main(String[] args) {\n        System.out.println("Il manque un point-virgule")\n    }\n}\n';
  const SORTIES_JAVA = 'public class Sorties {\n    public static void main(String[] args) {\n        System.out.println("texte qui sort par stdout");\n        System.err.println("texte qui sort par stderr");\n    }\n}\n';
  const HELLO_CPP = '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello depuis C++ !" << endl;\n    return 0;\n}\n';
  const ROOST = ['xdupont', 'amartin', 'bxavier', 'cwang', 'dzola', 'ejules', 'flopez', 'wbernard', 'zkim', 'mdurand', 'tvaxelaire', 'hmaxence', 'cdubois', 'nwu'];
  const BIN = ['awk', 'bash', 'cat', 'chmod', 'chown', 'cp', 'cut', 'date', 'du', 'echo', 'egrep', 'grep', 'gzip', 'head', 'id', 'kill', 'less', 'ln', 'ls', 'mkdir', 'more', 'mv', 'od', 'ps', 'pwd', 'rm', 'rmdir', 'sed', 'sleep', 'sort', 'tail', 'tar', 'touch', 'tr', 'uname', 'wc', 'zcat'];
  const USRBIN = ['2to3', '7z', 'apropos', 'bzip2', 'cal', 'code', 'diff', 'evince', 'file', 'g++', 'gcc', 'gedit', 'getfacl', 'iconv', 'java', 'javac', 'join', 'make', 'man', 'nano', 'openssl', 'python3', 'rsync', 'scp', 'setfacl', 'sftp', 'ssh', 'ssh-keygen', 'tree', 'uniq', 'vim', 'xdg-open', 'zip'];

  function buildFS(spec) {
    const root = mkDir(0o755, 'root', 'root');
    Object.entries(spec).forEach(([path, v]) => {
      const parts = path.split('/').filter(Boolean);
      let cur = root;
      parts.slice(0, -1).forEach(p => { if (!cur.kids.has(p)) cur.kids.set(p, mkDir(0o755, 'root', 'root')); cur = cur.kids.get(p); });
      const [t, mode, data, owner, extra] = v;
      const o = owner || 'etudiant', g = USERS[o] ? USERS[o].gid : o;
      const node = t === 'd' ? mkDir(mode, o, g) : t === 'l' ? { t: 'l', mode: 0o777, owner: o, group: g, mtime: SEED_DATE, target: data } : mkFile(mode, data, o, g, extra);
      const old = cur.kids.get(parts[parts.length - 1]);
      if (old && old.t === 'd' && node.t === 'd') { old.mode = node.mode; old.owner = node.owner; old.group = node.group; } else cur.kids.set(parts[parts.length - 1], node);
    });
    return root;
  }
  function systemSpec() {
    const s = {
      'bin': ['d', 0o755, '', 'root'], 'usr/bin': ['d', 0o755, '', 'root'], 'root': ['d', 0o700, '', 'root'],
      'tmp': ['d', 0o1777, '', 'root'], 'etc': ['d', 0o755, '', 'root'],
      'etc/passwd': ['f', 0o644, PASSWD, 'root'], 'etc/group': ['f', 0o644, GROUPFILE, 'root'], 'etc/hostname': ['f', 0o644, HOST + '\n', 'root'],
      'etc/shadow': ['f', 0o640, 'root:$6$...:19000:0:99999:7:::\n', 'root'],
      'home': ['d', 0o755, '', 'root'],
      'home/alice': ['d', 0o750, '', 'alice'], 'home/alice/projet.txt': ['f', 0o640, 'Le projet d\'Alice\n', 'alice'],
      'home/bob': ['d', 0o755, '', 'bob'], 'home/bob/public.txt': ['f', 0o644, 'Fichier public de Bob\n', 'bob'], 'home/bob/prive.txt': ['f', 0o600, 'Journal intime de Bob\n', 'bob'],
      'home/etudiant': ['d', 0o755], 'home/etudiant/.bashrc': ['f', 0o644, '# configuration du shell bash\nalias ll=\'ls -l\'\n']
    };
    BIN.forEach(n => { s['bin/' + n] = ['f', 0o755, '', 'root', { bin: { kind: 'elf' }, size: 35000 + n.length * 4100 }]; });
    USRBIN.forEach(n => { s['usr/bin/' + n] = ['f', 0o755, '', 'root', { bin: { kind: 'elf' }, size: 52000 + n.length * 3300 }]; });
    return s;
  }
  const H = 'home/etudiant/';
  const img = (n, kind) => ['f', 0o644, '', null, { bin: { kind }, size: 180000 + n * 7311 }];
  const SEEDS = {
    standard: () => buildFS(Object.assign(systemSpec(), {
      [H + 'README.txt']: ['f', 0o644, 'Bienvenue dans le terminal simulé.\nTape help pour la liste des commandes.\n'],
      [H + 'script.sh']: ['f', 0o644, '#!/bin/bash\necho "Le script a bien été exécuté"\n'],
      [H + 'secret.txt']: ['f', 0o644, 'mot de passe du wifi : ***\n'],
      [H + 'Documents']: ['d', 0o755],
      [H + 'Documents/notes.txt']: ['f', 0o644, "Cours d'intro système\nCommandes de base et permissions\n"],
      [H + 'Documents/rapport.txt']: ['f', 0o644, 'Brouillon du rapport\n'],
      [H + 'Documents/cours.txt']: ['f', 0o644, COURS_TXT],
      [H + 'Documents/etudiants.txt']: ['f', 0o644, ETUDIANTS],
      [H + 'Projets']: ['d', 0o755],
      [H + 'Projets/tp1']: ['d', 0o755],
      [H + 'Projets/tp1/Bonjour.java']: ['f', 0o644, BONJOUR_JAVA],
      [H + 'Projets/tp1/Erreur.java']: ['f', 0o644, ERREUR_JAVA],
      [H + 'Projets/tp1/Sorties.java']: ['f', 0o644, SORTIES_JAVA],
      [H + 'Projets/tp1/hello.cpp']: ['f', 0o644, HELLO_CPP],
      [H + 'Photos']: ['d', 0o755],
      [H + 'Photos/vacances1.jpg']: img(1, 'jpeg'), [H + 'Photos/vacances2.jpg']: img(2, 'jpeg'), [H + 'Photos/vacances10.jpg']: img(3, 'jpeg'),
      [H + 'Photos/plage.png']: img(4, 'png'), [H + 'Photos/IMG_2024.jpg']: img(5, 'jpeg'), [H + 'Photos/Anniversaire.png']: img(6, 'png'),
      [H + 'M1101']: ['d', 0o755],
      [H + 'M1101/td1.txt']: ['f', 0o644, 'TD 1 : ligne de commandes, méta-caractères, compression\n'],
      [H + 'M1101/td2.txt']: ['f', 0o644, 'TD 2 : éditeur, transfert de fichiers\n'],
      [H + 'M1101/td3.txt']: ['f', 0o644, 'TD 3 : redirections, codage\n'],
      [H + 'M1101/exos']: ['d', 0o755],
      [H + 'M1101/exos/ex1.sh']: ['f', 0o755, '#!/bin/bash\necho "Exercice 1"\n'],
      [H + 'Codage']: ['d', 0o755],
      [H + 'Codage/ascii.txt']: ['f', 0o644, 'hello\n'],
      [H + 'Codage/utf8.txt']: ['f', 0o644, 'été à Noël\n'],
      [H + 'Codage/latin1.txt']: ['f', 0o644, 'été à Noël\n', null, { enc: 'latin1' }],
      'mnt/roost/users': ['d', 0o755, '', 'root']
    }, Object.fromEntries(ROOST.map(u => ['mnt/roost/users/' + u, ['d', 0o755, '', 'root']]))))
  };
  SEEDS.perms = () => buildFS(Object.assign(systemSpec(), {
    [H + 'script.sh']: ['f', 0o644, '#!/bin/bash\necho "Le script a bien été exécuté"\n'],
    [H + 'secret.txt']: ['f', 0o644, 'mot de passe du wifi : ***\n'],
    [H + 'Projets']: ['d', 0o700], [H + 'Projets/idee.txt']: ['f', 0o644, 'idée de projet\n'],
    [H + 'Documents']: ['d', 0o755], [H + 'Documents/notes.txt']: ['f', 0o644, 'notes\n'],
    [H + 'prive']: ['d', 0o600], [H + 'prive/lettre.txt']: ['f', 0o644, 'chère lettre\n'],
    [H + 'notes.txt']: ['f', 0o600, 'notes personnelles\n'],
    [H + 'partage']: ['d', 0o755], [H + 'partage/compte-rendu.txt']: ['f', 0o644, 'Compte rendu du projet\n'],
    [H + 'lecture-seule.txt']: ['f', 0o444, 'Ne pas modifier\n']
  }));
  SEEDS.empty = () => buildFS(systemSpec());

  /* ---------- Droits ---------- */
  const modeStr = (t, m, acl) => {
    let s = t === 'd' ? 'd' : t === 'l' ? 'l' : '-';
    for (let i = 2; i >= 0; i--) {
      const b = (m >> (i * 3)) & 7;
      s += (b & 4 ? 'r' : '-') + (b & 2 ? 'w' : '-') + (b & 1 ? 'x' : '-');
    }
    if (m & 0o1000) s = s.slice(0, 9) + (m & 1 ? 't' : 'T');
    return s + (acl ? '+' : '');
  };
  const rwx = b => (b & 4 ? 'r' : '-') + (b & 2 ? 'w' : '-') + (b & 1 ? 'x' : '-');
  const parseRwx = s => (s.includes('r') ? 4 : 0) | (s.includes('w') ? 2 : 0) | (/[xX]/.test(s) ? 1 : 0);
  const symStr = m => ['u', 'g', 'o'].map((w, i) => { const b = (m >> ((2 - i) * 3)) & 7; return `${w}=${b & 4 ? 'r' : ''}${b & 2 ? 'w' : ''}${b & 1 ? 'x' : ''}`; }).join(',');
  const octStr = m => (m & 0o777).toString(8).padStart(3, '0');
  function validMode(m) {
    return /^[0-7]{1,4}$/.test(m) || (/^[ugoa]*([-+=][rwxXt]*)+(,[ugoa]*([-+=][rwxXt]*)+)*$/.test(m) && /[-+=]/.test(m));
  }
  /* Applique un mode chmod (octal ou symbolique). Sans lettre (chmod +x), le umask s'applique, comme dans bash. */
  function applyMode(m, cur, isDir, umask) {
    if (/^[0-7]{1,4}$/.test(m)) { const v = parseInt(m, 8); return m.length === 4 ? v & 0o1777 : (v & 0o777) | (cur & 0o1000); }
    let mode = cur & 0o1777;
    m.split(',').forEach(clause => {
      const mm = clause.match(/^([ugoa]*)((?:[-+=][rwxXt]*)+)$/);
      let who = mm[1];
      const noWho = !who;
      if (!who || who.includes('a')) who = 'ugo';
      mm[2].match(/[-+=][rwxXt]*/g).forEach(op => {
        const sign = op[0];
        let bits = 0;
        for (const ch of op.slice(1)) {
          if (ch === 'r') bits |= 4; else if (ch === 'w') bits |= 2; else if (ch === 'x') bits |= 1;
          else if (ch === 'X' && (isDir || (cur & 0o111))) bits |= 1;
        }
        let mask = 0, val = 0;
        'ugo'.split('').forEach((w, i) => { if (!who.includes(w)) return; const sh = (2 - i) * 3; mask |= 7 << sh; val |= bits << sh; });
        if (noWho) val &= ~umask;
        if (sign === '+') mode |= val;
        else if (sign === '-') mode &= ~val;
        else mode = (mode & ~mask) | val;
        if (op.includes('t')) { if (sign === '-') mode &= ~0o1000; else mode |= 0o1000; }
      });
    });
    return mode & 0o1777;
  }

  /* ---------- Jokers ---------- */
  function globRe(pat) {
    let re = '^';
    for (let i = 0; i < pat.length; i++) {
      const ch = pat[i];
      if (ch === '\\' && i + 1 < pat.length) { re += pat[i + 1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); i++; }
      else if (ch === '*') re += '.*';
      else if (ch === '?') re += '.';
      else if (ch === '[') {
        const j = pat.indexOf(']', i + 2);
        if (j < 0) { re += '\\['; continue; }
        let set = pat.slice(i + 1, j);
        let neg = false;
        if (set[0] === '!' || set[0] === '^') { neg = true; set = set.slice(1); }
        re += '[' + (neg ? '^' : '') + set.replace(/[\\\]^]/g, '\\$&') + ']';
        i = j;
      } else re += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    return new RegExp(re + '$');
  }
  const hasGlob = s => /[*?[]/.test(s);
  /* Le nom correspond-il au motif ? (utilisé aussi par l'entraînement sur les jokers) */
  const globMatch = (pat, name) => globRe(pat).test(name) && (!name.startsWith('.') || pat.startsWith('.'));

  /* ---------- Analyse d'une ligne ---------- */
  /* Renvoie une liste d'éléments { cmds: [ { words, redirs } ], next: ';' | '&&' | '||', bg } */
  function parseLine(line, vars) {
    const items = [];
    let cmds = [], words = [], redirs = [], w = null, q = null;
    const startWord = () => { if (!w) w = { s: '', pat: '', glob: false, quoted: false, tilde: false }; };
    const add = (ch, quoted) => {
      startWord();
      w.s += ch;
      if (quoted) { w.quoted = true; w.pat += /[*?[\]\\]/.test(ch) ? '\\' + ch : ch; } else { w.pat += ch; if ('*?['.includes(ch)) w.glob = true; }
    };
    const endWord = () => {
      if (!w) return;
      if (pendingRedir) { redirs.push({ op: pendingRedir, target: w.s }); pendingRedir = null; } else words.push(w);
      w = null;
    };
    let pendingRedir = null;
    const endCmd = () => {
      endWord();
      if (pendingRedir) throw new Error('bash: syntax error near unexpected token `newline\'');
      if (words.length || redirs.length) cmds.push({ words, redirs });
      words = []; redirs = [];
    };
    const endItem = (next, bg, final) => {
      const hadCmd = words.length || redirs.length || w;
      endCmd();
      if (!cmds.length) { if (final || (next === ';' && !bg)) return; throw new Error(`bash: syntax error near unexpected token \`${bg ? '&' : next}'`); }
      if (!hadCmd && cmds.length) throw new Error('bash: syntax error near unexpected token `|\'');
      items.push({ cmds, next: next || ';', bg: !!bg });
      cmds = [];
    };
    const expandVar = (i, quoted) => {
      let j = i + 1, name;
      if (line[j] === '{') { const k = line.indexOf('}', j); name = line.slice(j + 1, k); j = k + 1; }
      else if (line[j] === '?' || line[j] === '$') { name = line[j]; j++; }
      else { const m = line.slice(j).match(/^[A-Za-z_][A-Za-z0-9_]*/); if (!m) { add('$', quoted); return i + 1; } name = m[0]; j += name.length; }
      const val = name === '$' ? '2041' : (vars[name] != null ? String(vars[name]) : '');
      startWord();
      for (const ch of val) add(ch, true);
      if (!quoted && !val && !w.s) w.empty = true;
      return j;
    };
    for (let i = 0; i < line.length;) {
      const ch = line[i];
      if (q === "'") { if (ch === "'") q = null; else add(ch, true); i++; continue; }
      if (q === '"') {
        if (ch === '"') { q = null; i++; continue; }
        if (ch === '$') { i = expandVar(i, true); continue; }
        if (ch === '\\' && '"$\\`'.includes(line[i + 1])) { add(line[i + 1], true); i += 2; continue; }
        add(ch, true); i++; continue;
      }
      if (ch === "'" || ch === '"') { q = ch; startWord(); w.quoted = true; i++; continue; }
      if (ch === '\\' && i + 1 < line.length) { add(line[i + 1], true); i += 2; continue; }
      if (ch === '$') { i = expandVar(i, false); continue; }
      if (ch === '#' && !w) break;
      if (ch === ' ' || ch === '\t') { endWord(); i++; continue; }
      if (ch === '~' && !w && (i + 1 === line.length || /[\s/]/.test(line[i + 1]))) { startWord(); w.tilde = true; add('~', false); i++; continue; }
      if (ch === ';') { endItem(';'); i++; continue; }
      if (ch === '&' && line[i + 1] === '&') { endItem('&&'); i += 2; continue; }
      if (ch === '|' && line[i + 1] === '|') { endItem('||'); i += 2; continue; }
      if (ch === '|') { const had = words.length || redirs.length || w; endCmd(); if (!had) throw new Error('bash: syntax error near unexpected token `|\''); i++; continue; }
      if (ch === '&' && line[i + 1] === '>') { endWord(); pendingRedir = '&>'; i += 2; continue; }
      if (ch === '&') { endItem(';', true); i++; continue; }
      if (ch === '2' && !w && line[i + 1] === '>') {
        if (line.slice(i, i + 4) === '2>&1') { redirs.push({ op: '2>&1' }); i += 4; continue; }
        if (line[i + 2] === '>') { pendingRedir = '2>>'; i += 3; } else { pendingRedir = '2>'; i += 2; }
        continue;
      }
      if (ch === '>' || ch === '<') {
        endWord();
        if (pendingRedir) throw new Error(`bash: syntax error near unexpected token \`${ch}'`);
        if (ch === '>' && line[i + 1] === '>') { pendingRedir = '>>'; i += 2; } else { pendingRedir = ch; i++; }
        continue;
      }
      add(ch, false); i++;
    }
    if (q) throw new Error('bash: unexpected EOF while looking for matching `' + q + '\'');
    endItem(';', false, true);
    return items;
  }

  /* ---------- Pages de manuel (résumé en français) ---------- */
  const MAN = {
    man: ['man - consulter les pages de manuel', 'man [CHAPITRE] SUJET\nman -k MOT', 'Affiche la page de manuel de SUJET. Dans un vrai terminal, on se déplace avec les flèches, on cherche avec /mot et on quitte avec q.', [['-k MOT', 'cherche MOT dans les descriptions (comme apropos)']]],
    apropos: ['apropos - chercher une commande dans le manuel', 'apropos MOT', 'Liste les pages de manuel dont la description contient MOT.', []],
    help: ['help - aide des commandes internes du shell', 'help [COMMANDE_INTERNE]', 'Affiche l\'aide des commandes internes de bash (cd, echo, exit, help, history, jobs, fg, bg, kill, umask, type...). Pour les autres commandes, utilise man.', []],
    type: ['type - nature d\'une commande', 'type NOM...', 'Indique si NOM est une commande interne du shell (builtin) ou un programme, et où il se trouve.', []],
    pwd: ['pwd - afficher le répertoire courant', 'pwd', 'Affiche le chemin absolu du répertoire de travail (Print Working Directory).', []],
    cd: ['cd - changer de répertoire courant (commande interne)', 'cd [RÉPERTOIRE]', 'Sans argument, retourne dans le répertoire d\'accueil ($HOME). cd - retourne au répertoire précédent.', []],
    ls: ['ls - lister le contenu des répertoires', 'ls [OPTION]... [FICHIER]...', 'Affiche les informations sur les FICHIERs (le répertoire courant par défaut). Les entrées sont triées par ordre alphabétique.',
      [['-a, --all', 'ne pas cacher les entrées commençant par .'], ['-d, --directory', 'afficher le répertoire lui-même, pas son contenu'], ['-h', 'tailles lisibles (avec -l) : 1K, 234M, 2G'], ['-l', 'format long : droits, liens, propriétaire, groupe, taille, date, nom'], ['-n', 'comme -l, avec les numéros (UID, GID) au lieu des noms'], ['-r, --reverse', 'inverser l\'ordre du tri'], ['-R, --recursive', 'lister aussi les sous-répertoires, récursivement'], ['-t', 'trier par date de modification, le plus récent d\'abord']]],
    tree: ['tree - afficher une arborescence', 'tree [RÉPERTOIRE]', 'Affiche le contenu d\'un répertoire récursivement, sous forme d\'arbre.', [['-a', 'afficher aussi les fichiers cachés'], ['-d', 'n\'afficher que les répertoires']]],
    mkdir: ['mkdir - créer des répertoires', 'mkdir [OPTION]... RÉPERTOIRE...', 'Crée le ou les RÉPERTOIREs s\'ils n\'existent pas déjà.', [['-p, --parents', 'créer aussi les répertoires parents manquants ; pas d\'erreur s\'il existe'], ['-v, --verbose', 'afficher un message pour chaque répertoire créé']]],
    rmdir: ['rmdir - supprimer des répertoires vides', 'rmdir RÉPERTOIRE...', 'Supprime chaque RÉPERTOIRE, s\'il est vide.', []],
    touch: ['touch - changer la date d\'un fichier', 'touch FICHIER...', 'Met la date de modification de chaque FICHIER à l\'heure actuelle. Un FICHIER qui n\'existe pas est créé vide.', []],
    cp: ['cp - copier des fichiers et des répertoires', 'cp [OPTION]... SOURCE DEST\ncp [OPTION]... SOURCE... RÉPERTOIRE', 'Copie SOURCE vers DEST, ou plusieurs SOURCEs dans RÉPERTOIRE.', [['-i, --interactive', 'demander avant d\'écraser'], ['-p', 'conserver les droits, le propriétaire et les dates (et les ACL)'], ['-r, -R, --recursive', 'copier les répertoires récursivement'], ['-v, --verbose', 'expliquer ce qui est fait']]],
    mv: ['mv - déplacer ou renommer des fichiers', 'mv [OPTION]... SOURCE DEST\nmv [OPTION]... SOURCE... RÉPERTOIRE', 'Renomme SOURCE en DEST, ou déplace les SOURCEs dans RÉPERTOIRE.', [['-i, --interactive', 'demander avant d\'écraser'], ['-v, --verbose', 'expliquer ce qui est fait']]],
    rm: ['rm - supprimer des fichiers ou des répertoires', 'rm [OPTION]... FICHIER...', 'Supprime chaque FICHIER. Par défaut, ne supprime pas les répertoires. Il n\'y a pas de corbeille : la suppression est définitive.', [['-f, --force', 'ignorer les fichiers inexistants, ne jamais demander'], ['-i', 'demander avant chaque suppression'], ['-r, -R, --recursive', 'supprimer les répertoires et leur contenu récursivement'], ['-v, --verbose', 'expliquer ce qui est fait']]],
    cat: ['cat - concaténer et afficher des fichiers', 'cat [OPTION]... [FICHIER]...', 'Affiche les FICHIERs les uns après les autres sur la sortie standard. Sans FICHIER, lit l\'entrée standard.', [['-n, --number', 'numéroter toutes les lignes']]],
    less: ['less - afficher un fichier page par page', 'less FICHIER...', 'Affiche page par page. Espace : page suivante ; b : page précédente ; /mot : chercher ; q : quitter.', []],
    more: ['more - afficher un fichier page par page', 'more FICHIER...', 'Ancêtre de less : avance page par page avec Espace, quitte avec q.', []],
    head: ['head - afficher le début des fichiers', 'head [-n N] [FICHIER]...', 'Affiche les 10 premières lignes de chaque FICHIER (ou de l\'entrée standard).', [['-n N', 'afficher les N premières lignes (aussi : -N)']]],
    tail: ['tail - afficher la fin des fichiers', 'tail [-n N] [FICHIER]...', 'Affiche les 10 dernières lignes de chaque FICHIER (ou de l\'entrée standard).', [['-n N', 'afficher les N dernières lignes (aussi : -N)'], ['-n +N', 'afficher à partir de la ligne N']]],
    wc: ['wc - compter les lignes, les mots et les octets', 'wc [OPTION]... [FICHIER]...', 'Affiche le nombre de lignes, de mots et d\'octets de chaque FICHIER.', [['-c', 'nombre d\'octets'], ['-l', 'nombre de lignes'], ['-w', 'nombre de mots']]],
    file: ['file - déterminer le type d\'un fichier', 'file FICHIER...', 'Examine le début du contenu de chaque FICHIER pour deviner sa nature (texte, image, archive, programme...). L\'extension du nom ne compte pas.', []],
    du: ['du - estimer l\'espace disque occupé', 'du [OPTION]... [FICHIER]...', 'Affiche la place occupée par chaque FICHIER et, récursivement, par les répertoires.', [['-h', 'tailles lisibles (K, M, G)'], ['-s', 'afficher seulement un total pour chaque argument']]],
    echo: ['echo - afficher une ligne de texte (commande interne)', 'echo [-n] [-e] [CHAÎNE]...', 'Affiche les CHAÎNEs séparées par des espaces, suivies d\'un passage à la ligne.', [['-n', 'ne pas passer à la ligne à la fin'], ['-e', 'interpréter \\n (passage à la ligne) et \\t (tabulation)']]],
    clear: ['clear - effacer l\'écran du terminal', 'clear', 'Efface le terminal (raccourci : Ctrl+L).', []],
    date: ['date - afficher ou régler la date', 'date [-d DESCRIPTION] [+FORMAT]', 'Affiche la date et l\'heure actuelles.', [['-d CHAÎNE', 'afficher la date décrite par CHAÎNE (tomorrow, yesterday, Sunday...)'], ['+FORMAT', 'format libre : %d jour, %m mois, %Y année, %H heure, %M minute, %S seconde, %A jour de la semaine']]],
    cal: ['cal - afficher un calendrier', 'cal [[MOIS] ANNÉE]', 'Affiche le calendrier du mois courant, d\'un MOIS donné ou d\'une ANNÉE entière.', []],
    history: ['history - historique des commandes (commande interne)', 'history', 'Affiche les commandes déjà tapées, numérotées. Flèche haut : reprendre la précédente ; Ctrl+R : chercher dans l\'historique.', []],
    whoami: ['whoami - afficher le nom de l\'utilisateur', 'whoami', 'Affiche le nom de l\'utilisateur courant.', []],
    id: ['id - afficher les identifiants d\'un utilisateur', 'id [UTILISATEUR]', 'Affiche l\'UID, le GID (groupe primaire) et tous les groupes de l\'utilisateur.', []],
    groups: ['groups - afficher les groupes d\'un utilisateur', 'groups [UTILISATEUR]', 'Affiche les groupes dont l\'utilisateur est membre.', []],
    su: ['su - changer d\'utilisateur', 'su [UTILISATEUR]', 'Ouvre un shell au nom d\'UTILISATEUR (root par défaut), après son mot de passe. exit revient à l\'utilisateur précédent.', []],
    sudo: ['sudo - exécuter une commande en tant que root', 'sudo COMMANDE [ARGUMENT]...', 'Exécute COMMANDE avec les droits de l\'administrateur (root), si l\'utilisateur y est autorisé (groupe sudo). Demande TON mot de passe.', []],
    passwd: ['passwd - changer le mot de passe', 'passwd [UTILISATEUR]', 'Change le mot de passe de l\'utilisateur courant.', []],
    chmod: ['chmod - changer les droits d\'accès', 'chmod [OPTION]... MODE[,MODE]... FICHIER...\nchmod [OPTION]... MODE-OCTAL FICHIER...', 'MODE symbolique : [ugoa][+-=][rwxX] ; u propriétaire, g groupe, o autres, a tous. MODE octal : un chiffre par catégorie, r=4, w=2, x=1. Seul le propriétaire (ou root) peut changer les droits.', [['-R, --recursive', 'modifier aussi le contenu des répertoires, récursivement'], ['X', 'x seulement pour les répertoires et les fichiers déjà exécutables par quelqu\'un']]],
    chown: ['chown - changer le propriétaire et le groupe', 'chown [OPTION]... [PROPRIÉTAIRE][:[GROUPE]] FICHIER...', 'Change le propriétaire (et éventuellement le groupe) de chaque FICHIER. Réservé à root : utilise sudo.', [['-R', 'récursivement']]],
    chgrp: ['chgrp - changer le groupe', 'chgrp [OPTION]... GROUPE FICHIER...', 'Change le groupe de chaque FICHIER. Le propriétaire peut choisir un groupe dont il est membre.', [['-R', 'récursivement']]],
    umask: ['umask - masque des droits par défaut (commande interne)', 'umask [-S] [MODE]', 'Affiche ou règle le masque : les bits présents dans le masque sont RETIRÉS des droits des nouveaux fichiers (base 666) et répertoires (base 777).', [['-S', 'afficher sous forme symbolique (u=rwx,g=rx,o=rx)']]],
    getfacl: ['getfacl - afficher les listes de contrôle d\'accès', 'getfacl FICHIER...', 'Affiche le propriétaire, le groupe et les ACL de chaque FICHIER : user::, user:nom:, group::, group:nom:, mask::, other::.', []],
    setfacl: ['setfacl - modifier les listes de contrôle d\'accès', 'setfacl [-m|-x] ENTRÉES FICHIER...\nsetfacl -b FICHIER...', 'Entrées : u:NOM:DROITS, g:NOM:DROITS, m::DROITS, o::DROITS (d: devant pour une ACL par défaut).', [['-m', 'ajouter ou modifier des entrées'], ['-x', 'retirer des entrées (u:NOM, g:NOM)'], ['-b', 'retirer toutes les entrées ACL'], ['-R', 'récursivement']]],
    grep: ['grep - afficher les lignes qui correspondent à un motif', 'grep [OPTION]... MOTIF [FICHIER]...', 'Cherche MOTIF (une expression régulière) dans chaque FICHIER, ou dans l\'entrée standard, et affiche les lignes qui le contiennent.', [['-c', 'afficher seulement le nombre de lignes trouvées'], ['-E', 'expressions régulières étendues (|, +, ?)'], ['-i', 'ignorer la casse (majuscules et minuscules)'], ['-n', 'afficher le numéro de chaque ligne'], ['-v', 'inverser : lignes qui NE contiennent PAS le motif'], ['-w', 'le motif doit être un mot entier']]],
    sort: ['sort - trier les lignes', 'sort [OPTION]... [FICHIER]...', 'Affiche les lignes triées (ordre alphabétique par défaut).', [['-k N', 'trier selon le champ N'], ['-n', 'tri numérique (2 avant 10)'], ['-r', 'ordre inverse'], ['-t SÉP', 'utiliser SÉP comme séparateur de champs'], ['-u', 'supprimer les doublons']]],
    uniq: ['uniq - supprimer les lignes répétées consécutives', 'uniq [-c] [FICHIER]', 'Fusionne les lignes identiques ADJACENTES (on trie donc d\'abord avec sort).', [['-c', 'préfixer chaque ligne par son nombre d\'occurrences']]],
    cut: ['cut - extraire des colonnes', 'cut -d SÉP -f CHAMPS [FICHIER]...\ncut -c POSITIONS [FICHIER]...', 'Affiche une partie de chaque ligne.', [['-c LISTE', 'garder les caractères aux positions LISTE (ex : 1-3)'], ['-d SÉP', 'séparateur de champs (tabulation par défaut)'], ['-f LISTE', 'garder les champs LISTE (ex : 1,3 ou 2-4)']]],
    join: ['join - joindre les lignes de deux fichiers sur un champ commun', 'join [-t SÉP] FICHIER1 FICHIER2', 'Pour chaque paire de lignes ayant le même premier champ (la clé), affiche la clé suivie des autres champs des deux lignes. Les deux fichiers doivent être triés sur la clé.', [['-t SÉP', 'séparateur de champs']]],
    tr: ['tr - transposer ou supprimer des caractères', 'tr [-d] ENSEMBLE1 [ENSEMBLE2]', 'Lit l\'entrée standard et remplace chaque caractère d\'ENSEMBLE1 par le caractère correspondant d\'ENSEMBLE2. Exemple : tr a-z A-Z met en majuscules.', [['-d', 'supprimer les caractères d\'ENSEMBLE1']]],
    diff: ['diff - comparer deux fichiers ligne par ligne', 'diff FICHIER1 FICHIER2', 'N\'affiche rien si les fichiers sont identiques. Sinon : < lignes du premier, > lignes du second.', []],
    gzip: ['gzip - compresser des fichiers', 'gzip [-dkv19] FICHIER...', 'Remplace chaque FICHIER par une version compressée FICHIER.gz (sans perte d\'information).', [['-1 ... -9', 'du plus rapide au plus efficace'], ['-d', 'décompresser (comme gunzip)'], ['-k', 'garder le fichier d\'origine'], ['-v', 'afficher le taux de compression']]],
    gunzip: ['gunzip - décompresser des fichiers .gz', 'gunzip FICHIER.gz...', 'Remplace FICHIER.gz par le fichier d\'origine.', []],
    zcat: ['zcat - afficher un fichier compressé', 'zcat FICHIER.gz...', 'Affiche le contenu décompressé sans toucher au fichier (voir aussi zless).', []],
    bzip2: ['bzip2 - compresser avec l\'algorithme de Burrows-Wheeler', 'bzip2 [-dkv] FICHIER...', 'Comme gzip, en général plus efficace et plus lent. Suffixe .bz2 ; bunzip2 décompresse, bzcat affiche.', []],
    tar: ['tar - archiver des fichiers', 'tar -c[vzj]f ARCHIVE FICHIER...\ntar -t[v]f ARCHIVE\ntar -x[v]f ARCHIVE [FICHIER]...', 'Regroupe plusieurs fichiers et répertoires dans un seul fichier (archive), en liste le contenu ou les extrait.', [['-c', 'créer une archive (create)'], ['-t', 'lister le contenu (table)'], ['-x', 'extraire (extract)'], ['-f ARCHIVE', 'nom du fichier archive (file)'], ['-v', 'afficher les fichiers traités (verbose)'], ['-z', 'compresser / décompresser avec gzip (.tar.gz, .tgz)'], ['-j', 'avec bzip2 (.tar.bz2)'], ['-C RÉP', 'extraire dans RÉP']]],
    od: ['od - afficher les octets d\'un fichier', 'od [-c] [-t TYPE] [FICHIER]', 'Affiche le contenu octet par octet. La 1re colonne est la position (en octal).', [['-c', 'caractères ASCII ou séquences \\n, \\t ; octets non ASCII en octal'], ['-t x1', 'chaque octet en hexadécimal'], ['-t u1', 'chaque octet en décimal non signé'], ['-t d1', 'chaque octet en décimal signé']]],
    iconv: ['iconv - convertir l\'encodage d\'un texte', 'iconv -f ANCIEN -t NOUVEAU [FICHIER] [-o SORTIE]', 'Convertit FICHIER de l\'encodage ANCIEN vers NOUVEAU (UTF-8, ISO-8859-1, ASCII...).', [['-f CODE', 'encodage d\'origine (from)'], ['-t CODE', 'encodage voulu (to)'], ['-o FICHIER', 'écrire le résultat dans FICHIER']]],
    javac: ['javac - compiler un programme Java', 'javac FICHIER.java...', 'Compile chaque FICHIER.java en FICHIER.class (bytecode). Les erreurs sont écrites sur la sortie d\'erreur.', []],
    java: ['java - exécuter une classe Java', 'java CLASSE [ARGUMENTS]', 'Lance la méthode main de CLASSE (sans .class). java FICHIER.java compile et lance en une fois.', []],
    'g++': ['g++ - compiler un programme C++', 'g++ [-Wall] [-o EXÉCUTABLE] FICHIER.cpp...', 'Compile et produit un exécutable (a.out par défaut).', [['-o NOM', 'nom de l\'exécutable produit'], ['-Wall', 'afficher tous les avertissements']]],
    ps: ['ps - afficher les processus', 'ps [-ef] [aux]', 'Sans option : les processus du terminal courant. -ef ou aux : tous les processus du système.', []],
    jobs: ['jobs - lister les tâches du shell (commande interne)', 'jobs', 'Liste les tâches lancées depuis ce terminal (en arrière-plan ou suspendues).', []],
    fg: ['fg - reprendre une tâche au premier plan (commande interne)', 'fg [%N]', 'Remet la tâche N (la dernière par défaut) au premier plan.', []],
    bg: ['bg - reprendre une tâche en arrière-plan (commande interne)', 'bg [%N]', 'Relance en arrière-plan une tâche suspendue (Ctrl+Z).', []],
    kill: ['kill - envoyer un signal à un processus', 'kill [-SIGNAL] PID | %N', 'Envoie un signal (TERM par défaut, qui demande l\'arrêt) au processus PID ou à la tâche %N. kill -9 force l\'arrêt (KILL).', [['-9, -KILL', 'tuer sans laisser le choix'], ['-l', 'lister les signaux']]],
    sleep: ['sleep - attendre', 'sleep NOMBRE', 'Attend NOMBRE secondes. Pratique pour s\'entraîner avec &, Ctrl+Z, jobs, fg, bg et kill.', []],
    ssh: ['ssh - ouvrir une session sur une autre machine', 'ssh [COMPTE@]MACHINE [COMMANDE]', 'Se connecte de façon chiffrée à MACHINE. Avec une clé publique installée sur MACHINE, aucun mot de passe n\'est demandé.', [['-p PORT', 'port du serveur'], ['-X', 'transférer l\'affichage graphique']]],
    'ssh-keygen': ['ssh-keygen - créer une paire de clés', 'ssh-keygen -t rsa', 'Crée une clé privée (~/.ssh/id_rsa, à garder secrète) et une clé publique (~/.ssh/id_rsa.pub, à diffuser).', []],
    scp: ['scp - copier des fichiers par ssh', 'scp [-r] SOURCE... DESTINATION', 'Comme cp, mais SOURCE ou DESTINATION peut être sur une autre machine : compte@machine:chemin.', [['-r', 'copier les répertoires récursivement']]],
    rsync: ['rsync - synchroniser des répertoires', 'rsync [-avz] [--delete] SOURCE DESTINATION', 'Copie seulement ce qui a changé. Avec / à la fin de SOURCE, c\'est le CONTENU du répertoire qui est copié.', [['-a', 'mode archive : récursif, conserve dates et droits'], ['-v', 'afficher les fichiers transférés'], ['-z', 'compresser pendant le transfert'], ['--delete', 'supprimer dans DESTINATION ce qui n\'est plus dans SOURCE']]],
    nano: ['nano - éditeur de texte simple dans le terminal', 'nano FICHIER', 'Les raccourcis sont affichés en bas : ^O enregistrer, ^X quitter (^ = Ctrl).', []],
    vim: ['vim - éditeur de texte puissant dans le terminal', 'vim FICHIER', 'i pour écrire, Échap pour revenir en mode commande, :wq pour enregistrer et quitter, :q! pour quitter sans enregistrer.', []],
    code: ['code - Visual Studio Code', 'code [FICHIER | RÉPERTOIRE]', 'Ouvre l\'éditeur VS Code. code . ouvre le répertoire courant.', []],
    exit: ['exit - quitter le shell (commande interne)', 'exit [CODE]', 'Ferme le shell courant (et la fenêtre du terminal). Après su, revient à l\'utilisateur précédent. Raccourci : Ctrl+D.', []]
  };
  const BUILTINS = new Set(['cd', 'echo', 'pwd', 'exit', 'help', 'history', 'jobs', 'fg', 'bg', 'kill', 'umask', 'type', 'alias']);
  const KNOWN = ['pwd', 'cd', 'ls', 'tree', 'mkdir', 'rmdir', 'touch', 'cp', 'mv', 'rm', 'cat', 'less', 'more', 'head', 'tail', 'wc', 'file', 'du', 'echo', 'clear', 'date', 'cal', 'history', 'man', 'apropos', 'whatis', 'help', 'type',
    'whoami', 'id', 'groups', 'hostname', 'uname', 'su', 'sudo', 'passwd', 'chmod', 'chown', 'chgrp', 'umask', 'getfacl', 'setfacl', 'grep', 'sort', 'uniq', 'cut', 'join', 'tr', 'diff', 'gzip', 'gunzip', 'zcat', 'zless', 'bzip2', 'bunzip2', 'bzcat', 'tar',
    'od', 'iconv', 'javac', 'java', 'g++', 'gcc', 'bash', 'sh', 'ps', 'jobs', 'fg', 'bg', 'kill', 'sleep', 'ssh', 'ssh-keygen', 'ssh-copy-id', 'scp', 'sftp', 'rsync', 'sshfs', 'tmux', 'rwho', 'ftp',
    'nano', 'vim', 'vi', 'code', 'gedit', 'geany', 'evince', 'xdg-open', 'ccrypt', 'openssl', 'zip', 'unzip', 'apt', 'apt-get', 'quota', 'exit', 'logout', 'true', 'false', 'alias', 'astyle', 'ln'];
  const HELP = `Commandes du terminal simulé (man COMMANDE pour le détail) :
  se repérer   pwd cd ls tree du file
  fichiers     mkdir rmdir touch cp mv rm
  lire         cat less more head tail wc od
  texte        echo grep sort uniq cut join tr diff iconv
  archives     tar gzip gunzip zcat bzip2 bunzip2
  droits       whoami id groups chmod chown chgrp umask getfacl setfacl su sudo
  programmes   javac java g++ bash ./script
  processus    ps sleep jobs fg bg kill
  divers       man apropos help type history date cal clear ssh-keygen exit
Le shell : | (tube)  > >> < 2> 2>&1 (redirections)  ; && || (enchaîner)  & (arrière-plan)
           * ? [abc] [a-z] [!a] (jokers)  "…" '…' \\ (protéger)  $USER $HOME $? (variables)
Clavier : TAB complète, ↑ ↓ historique, Ctrl+C interrompt, Ctrl+Z suspend, Ctrl+L efface.
`;
  /* Distance d'édition très simple, pour « vouliez-vous dire » */
  function near(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    if (a.length === b.length) { const d = [...a].map((c, i) => c !== b[i] ? i : -1).filter(i => i >= 0); return d.length === 1 || (d.length === 2 && d[1] === d[0] + 1 && a[d[0]] === b[d[1]] && a[d[1]] === b[d[0]]); }
    const [s, l] = a.length < b.length ? [a, b] : [b, a];
    for (let i = 0; i < l.length; i++) if (l.slice(0, i) + l.slice(i + 1) === s) return true;
    return false;
  }

  /* ---------- Diff (algorithme de la plus longue sous-suite commune) ---------- */
  function diffLines(a, b) {
    const n = a.length, m = b.length, L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = [];
    let i = 0, j = 0;
    const range = (s, e) => (e - s === 1 ? String(s + 1) : e === s ? String(s) : `${s + 1},${e}`);
    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) { i++; j++; continue; }
      const i0 = i, j0 = j;
      while ((i < n || j < m) && !(i < n && j < m && a[i] === b[j])) {
        if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) j++; else i++;
      }
      const del = a.slice(i0, i), ins = b.slice(j0, j);
      if (del.length && ins.length) out.push(`${range(i0, i)}c${range(j0, j)}`, ...del.map(x => '< ' + x), '---', ...ins.map(x => '> ' + x));
      else if (del.length) out.push(`${range(i0, i)}d${j0}`, ...del.map(x => '< ' + x));
      else out.push(`${i0}a${range(j0, j)}`, ...ins.map(x => '> ' + x));
    }
    return out;
  }

  const lines = s => { const l = s.split('\n'); if (l[l.length - 1] === '') l.pop(); return l; };
  const human = n => (n < 1024 ? String(n) : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0).replace('.0', '') + 'K' : (n / 1048576).toFixed(1).replace('.0', '') + 'M');

  class Shell {
    constructor(seed) {
      this.root = (SEEDS[seed || 'standard'] || SEEDS.standard)();
      this.user = 'etudiant';
      this.userStack = [];
      this.asRoot = false;
      this.cwd = ['home', 'etudiant'];
      this.prev = null;
      this.umask = 0o022;
      this.history = [];
      this.log = [];          // lignes saisies
      this.outLog = [];       // { line, out, err } pour les vérifications
      this.ranScript = new Set();
      this.cleared = false;
      this.vars = { HOSTNAME: HOST, SHELL: '/bin/bash', '?': 0 };
      this.jobs = [];
      this.nextPid = 4200;
      this.busy = null;
      this.sudoAsked = false;
      this.now = () => new Date();
      this.syncVars();
    }
    syncVars() {
      const u = this.eff();
      Object.assign(this.vars, { USER: u, LOGNAME: u, HOME: USERS[u].home, PWD: this.pathOf(this.cwd) });
    }
    eff() { return this.asRoot ? 'root' : this.user; }
    get home() { return USERS[this.user].home.split('/').filter(Boolean); }

    /* ----- chemins ----- */
    normalize(path, base) {
      let parts;
      if (path === '~' || path.startsWith('~/')) parts = this.home.concat(path.slice(2).split('/'));
      else if (path.startsWith('/')) parts = path.split('/');
      else parts = (base || this.cwd).concat(path.split('/'));
      const out = [];
      parts.forEach(p => { if (p === '' || p === '.') return; if (p === '..') out.pop(); else out.push(p); });
      return out;
    }
    /* Droit effectif (4, 2 ou 1) de l'utilisateur courant sur un nœud, en tenant compte des ACL */
    bits(node, who) {
      const u = who || this.eff();
      if (u === 'root') return 7;
      if (node.owner === u) return (node.mode >> 6) & 7;
      const acl = node.acl;
      if (acl && acl.u[u] != null) return acl.u[u] & acl.mask;
      const gs = USERS[u] ? USERS[u].groups : [];
      let g = null;
      if (gs.includes(node.group)) g = acl ? acl.g0 : (node.mode >> 3) & 7;
      if (acl) Object.entries(acl.g).forEach(([name, b]) => { if (gs.includes(name)) g = (g || 0) | b; });
      if (g !== null) return acl ? g & acl.mask : g;
      return node.mode & 7;
    }
    can(node, bit) {
      if (this.eff() === 'root') return bit !== 1 || node.t === 'd' || !!(node.mode & 0o111);
      return !!(this.bits(node) & bit);
    }
    lookup(parts, follow) {
      let cur = this.root;
      for (let i = 0; i < parts.length; i++) {
        if (cur.t === 'l') { const r = this.lookup(this.normalize(cur.target, parts.slice(0, i - 1)), true); if (r.err) return r; cur = r.node; }
        if (cur.t !== 'd') return { err: 'Not a directory' };
        if (!this.can(cur, 1)) return { err: 'Permission denied' };
        const nx = cur.kids.get(parts[i]);
        if (!nx) return { err: 'No such file or directory', missingAt: i };
        cur = nx;
      }
      if (cur.t === 'l' && follow !== false) { const r = this.lookup(this.normalize(cur.target, parts.slice(0, -1)), true); if (r.err) return r; cur = r.node; }
      return { node: cur };
    }
    parentOf(parts) {
      if (!parts.length) return { err: 'Invalid argument' };
      const r = this.lookup(parts.slice(0, -1));
      if (r.err) return { err: r.err };
      if (r.node.t !== 'd') return { err: 'Not a directory' };
      return { parent: r.node, name: parts[parts.length - 1] };
    }
    pathOf(parts) { return '/' + parts.join('/'); }
    prettyCwd() {
      const h = this.home.join('/'), c = this.cwd.join('/');
      if (c === h) return '~';
      if (c.startsWith(h + '/')) return '~/' + c.slice(h.length + 1);
      return '/' + c;
    }
    prompt() { return `${this.eff()}@${HOST}:${this.prettyCwd()}${this.eff() === 'root' ? '#' : '$'}`; }
    get(path) { const r = this.lookup(this.normalize(path)); return r.node || null; }
    /* Accès sans contrôle des droits (pour les vérifications des exercices) */
    peek(path) {
      let cur = this.root;
      for (const p of this.normalize(path)) { if (!cur || cur.t !== 'd') return null; cur = cur.kids.get(p); }
      return cur || null;
    }
    exists(path) { return !!this.peek(path); }
    modeOf(path) { const n = this.peek(path); return n ? n.mode & 0o777 : null; }
    textOf(path) { const n = this.peek(path); return n && n.t === 'f' ? n.data : null; }
    newNode(parent, t, data) {
      const base = t === 'd' ? 0o777 : 0o666;
      const u = this.eff();
      const n = t === 'd' ? mkDir(base & ~this.umask, u, USERS[u].gid) : mkFile(base & ~this.umask, data || '', u, USERS[u].gid);
      n.mtime = this.now();
      const def = parent && parent.acl && parent.acl.def;
      if (def) {
        n.acl = { u: Object.assign({}, def.u), g: Object.assign({}, def.g), g0: def.g0, mask: def.mask, def: t === 'd' ? JSON.parse(JSON.stringify(def)) : null };
        n.mode = ((def.user << 6) | (def.mask << 3) | def.other) & base;
      }
      return n;
    }

    /* ----- jokers ----- */
    glob(pat) {
      const abs = pat.startsWith('/');
      const comps = pat.split('/').filter(Boolean);
      let paths = [abs ? '/' : ''];
      comps.forEach((c, idx) => {
        const next = [];
        paths.forEach(p => {
          if (!hasGlob(c.replace(/\\./g, ''))) { next.push(p + (p && !p.endsWith('/') ? '/' : '') + c.replace(/\\(.)/g, '$1')); return; }
          const r = this.lookup(this.normalize(p || '.'));
          if (!r.node || r.node.t !== 'd' || !this.can(r.node, 4)) return;
          [...r.node.kids.keys()].filter(k => globMatch(c, k)).sort((a, b) => a.localeCompare(b, 'fr')).forEach(k => {
            if (idx < comps.length - 1 && r.node.kids.get(k).t !== 'd') return;
            next.push(p + (p && !p.endsWith('/') ? '/' : '') + k);
          });
        });
        paths = next;
      });
      return paths.filter(p => p && this.lookup(this.normalize(p), false).node);
    }
    expandWords(words) {
      const out = [];
      words.forEach(w => {
        let s = w.s;
        if (w.tilde) s = USERS[this.user].home + s.slice(1);
        if (w.empty && !w.quoted && s === '') return;
        if (w.glob) { const hit = this.glob(w.tilde ? USERS[this.user].home + w.pat.slice(1) : w.pat); if (hit.length) { out.push(...hit); return; } }
        out.push(s);
      });
      return out;
    }

    /* ----- exécution d'une ligne ----- */
    run(line, opts) {
      opts = opts || {};
      const res = { out: '', err: '', chunks: [] };
      if (this.busy) return res;
      if (!opts.inner) { this.log.push(line); if (line.trim()) this.history.push(line); }
      const push = (k, s) => { if (!s) return; res.chunks.push({ k, s }); if (k === 'out') res.out += s; else if (k === 'err') res.err += s; };
      let items;
      try { items = parseLine(line, this.vars); } catch (e) { push('err', e.message + '\n'); this.vars['?'] = 2; this.record(line, res, opts); return res; }
      let last = 0, prevNext = ';';
      for (const it of items) {
        const go = prevNext === ';' || (prevNext === '&&' && last === 0) || (prevNext === '||' && last !== 0);
        if (go) {
          last = it.bg ? this.runBackground(it, push) : this.runPipeline(it.cmds, push);
          this.vars['?'] = last;
          if (this.busy) break;
        }
        prevNext = it.next;
      }
      this.syncVars();
      this.record(line, res, opts);
      return res;
    }
    record(line, res, opts) { if (!opts.inner) this.outLog.push({ line, out: strip(res.out), err: res.err }); }

    runBackground(it, push) {
      const text = it.cmds.map(c => c.words.map(w => w.s).join(' ')).join(' | ');
      const pid = this.nextPid++;
      const n = this.jobs.length ? Math.max(...this.jobs.map(j => j.n)) + 1 : 1;
      const first = it.cmds[0].words[0] && it.cmds[0].words[0].s;
      push('out', `[${n}] ${pid}\n`);
      if (first === 'sleep' && it.cmds.length === 1) { this.jobs.push({ n, pid, cmd: text, state: 'Running' }); return 0; }
      const code = this.runPipeline(it.cmds, push);
      push('out', `[${n}]+  Done                    ${text}\n`);
      return code;
    }

    runPipeline(cmds, push) {
      let input = null, code = 0;
      for (let i = 0; i < cmds.length; i++) {
        const c = cmds[i], isLast = i === cmds.length - 1;
        const words = this.expandWords(c.words);
        if (words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0]) && words.length === 1) {
          const k = words[0].indexOf('=');
          this.vars[words[0].slice(0, k)] = words[0].slice(k + 1);
          code = 0; continue;
        }
        /* préparation des redirections : les fichiers sont créés AVANT de lancer la commande */
        let outTarget = null, errTarget = null, errToOut = false, bad = false;
        for (const r of c.redirs) {
          if (r.op === '2>&1') { errToOut = true; continue; }
          const target = this.expandWords([{ s: r.target, pat: r.target, glob: false, tilde: r.target === '~' || r.target.startsWith('~/') }])[0];
          if (r.op === '<') {
            const rr = this.lookup(this.normalize(target));
            if (rr.err || rr.node.t === 'd' || !this.can(rr.node, 4)) { push('err', `bash: ${target}: ${rr.err || (rr.node.t === 'd' ? 'Is a directory' : 'Permission denied')}\n`); bad = true; break; }
            input = rr.node.data; continue;
          }
          const append = r.op === '>>' || r.op === '2>>';
          const e = this.writeFile(target, append ? 'append' : 'write', '');
          if (e) { push('err', `bash: ${target}: ${e}\n`); bad = true; break; }
          const t = { path: target, append: true };
          if (r.op === '&>') { outTarget = t; errToOut = true; } else if (r.op[0] === '2') errTarget = t; else outTarget = t;
        }
        if (bad) { code = 1; input = ''; continue; }
        if (!words.length) { code = 0; continue; }
        this.tty = isLast && !outTarget;   // ls écrit un nom par ligne quand sa sortie part dans un tube ou un fichier
        const r = this.exec(words[0], words.slice(1), input);
        this.tty = true;
        if (r.busy) { if (r.out) push('out', r.out); this.busy = r.busy; return 0; }
        const outText = r.out || '', errText = r.err || '';
        input = null;
        const toOut = (txt, enc) => {
          if (!txt) return;
          if (outTarget) this.writeFile(outTarget.path, 'append', strip(txt), enc);
          else if (!isLast) input = (input || '') + strip(txt);
          else push('out', enc === 'latin1' ? asTerminal(txt, 'latin1') : txt);
        };
        toOut(outText, r.outEnc);
        if (errText) {
          if (errToOut) toOut(errText);
          else if (errTarget) this.writeFile(errTarget.path, 'append', errText);
          else push('err', errText);
        }
        if (r.hint) push('hint', r.hint);
        if (!isLast && input === null) input = '';
        code = r.code || 0;
      }
      return code;
    }

    writeFile(path, mode, text, enc) {
      if (path === '/dev/null') return null;
      const parts = this.normalize(path);
      const r = this.lookup(parts);
      if (r.node) {
        if (r.node.t === 'd') return 'Is a directory';
        if (!this.can(r.node, 2)) return 'Permission denied';
        r.node.data = mode === 'append' ? r.node.data + text : text;
        if (enc) r.node.enc = enc; else if (mode !== 'append') delete r.node.enc;
        delete r.node.bin; delete r.node.size; delete r.node.gz; delete r.node.tar;
        r.node.mtime = this.now();
        return null;
      }
      if (r.err !== 'No such file or directory' || r.missingAt !== parts.length - 1) return r.err;
      const pp = this.parentOf(parts);
      if (pp.err) return pp.err;
      if (!this.can(pp.parent, 2)) return 'Permission denied';
      const f = this.newNode(pp.parent, 'f', text);
      if (enc) f.enc = enc;
      pp.parent.kids.set(pp.name, f);
      return null;
    }

    /* Ctrl+C ou Ctrl+Z pendant qu'une commande occupe le terminal */
    key(k) {
      if (!this.busy) return '';
      const b = this.busy; this.busy = null;
      if (k === 'C') { this.vars['?'] = 130; return '^C\n'; }
      const n = this.jobs.length ? Math.max(...this.jobs.map(j => j.n)) + 1 : 1;
      this.jobs.push({ n, pid: b.pid, cmd: b.cmd, state: 'Stopped' });
      this.vars['?'] = 148;
      return `^Z\n[${n}]+  Stopped                 ${b.cmd}\n`;
    }

    findJob(spec) {
      if (!this.jobs.length) return null;
      if (spec === undefined || spec === '%' || spec === '%+') return this.jobs[this.jobs.length - 1];
      const n = +String(spec).replace('%', '');
      return this.jobs.find(j => j.n === n) || null;
    }

    /* ----- les commandes ----- */
    exec(name, args, stdin) {
      let out = '', err = '', code = 0, hint = '', outEnc = null;
      const E = (msg, c) => { err += msg + '\n'; code = c || 1; };
      const S = (a, withVal) => {   // options : { flags: Set, vals: {}, rest: [] }
        const flags = new Set(), vals = {}, rest = [];
        let done = false;
        for (let i = 0; i < a.length; i++) {
          const x = a[i];
          if (done || x === '-' || !x.startsWith('-')) { rest.push(x); continue; }
          if (x === '--') { done = true; continue; }
          if (x.startsWith('--')) { flags.add(x); continue; }
          if (/^-\d+$/.test(x) && withVal && withVal.includes('#')) { vals.n = x.slice(1); continue; }
          for (let k = 1; k < x.length; k++) {
            const f = x[k];
            if (withVal && withVal.includes(f)) { vals[f] = x.slice(k + 1) || a[++i]; break; }
            flags.add(f);
          }
        }
        return { flags, vals, rest };
      };
      const readIn = (files, cmd) => {   // contenu des fichiers ou de l'entrée standard
        if (!files.length) return [{ name: null, data: stdin || '' }];
        const res = [];
        files.forEach(f => {
          if (f === '-') { res.push({ name: '-', data: stdin || '' }); return; }
          const r = this.lookup(this.normalize(f));
          if (r.err) { E(`${cmd}: ${f}: ${r.err}`); return; }
          if (r.node.t === 'd') { E(`${cmd}: ${f}: Is a directory`); return; }
          if (!this.can(r.node, 4)) { E(`${cmd}: ${f}: Permission denied`); return; }
          res.push({ name: f, data: r.node.gz || r.node.bin || r.node.tar ? garble(f, Math.min(300, sizeOf(r.node))) : r.node.data, enc: r.node.enc });
        });
        return res;
      };
      if (args.includes('--help') && MAN[name]) { const m = MAN[name]; return { out: `Usage: ${m[1].split('\n').join('\n   ou: ')}\n${m[2]}\n${m[3].map(o => `  ${o[0].padEnd(22)} ${o[1]}`).join('\n')}${m[3].length ? '\n' : ''}` }; }
      if (args.includes('--version')) return { out: `${name} (simulé) 1.0\n` };

      switch (name) {
        case 'pwd': out = this.pathOf(this.cwd) + '\n'; break;
        case 'whoami': out = this.eff() + '\n'; break;
        case 'hostname': out = HOST + '\n'; break;
        case 'uname': out = args.includes('-a') ? `Linux ${HOST} 6.1.0-simule #1 SMP Debian x86_64 GNU/Linux\n` : 'Linux\n'; break;
        case 'true': break;
        case 'false': code = 1; break;
        case 'id': case 'groups': {
          const u = args[0] || this.eff();
          if (!USERS[u]) { E(`${name}: '${u}': no such user`); break; }
          const U = USERS[u];
          if (name === 'groups') out = (args[0] ? u + ' : ' : '') + U.groups.join(' ') + '\n';
          else out = `uid=${U.uid}(${u}) gid=${GROUPS[U.gid]}(${U.gid}) groups=${U.groups.map(g => `${GROUPS[g]}(${g})`).join(',')}\n`;
          break;
        }
        case 'clear': this.cleared = true; break;
        case 'help': {
          if (!args.length) { out = HELP; break; }
          const t = args[0];
          if (BUILTINS.has(t) && MAN[t]) out = `${t}: ${MAN[t][1].split('\n')[0]}\n    ${MAN[t][2]}\n`;
          else E(`bash: help: no help topics match \`${t}'.  Try \`help help' or \`man -k ${t}' or \`info ${t}'.`);
          break;
        }
        case 'type': args.forEach(a => {
          if (BUILTINS.has(a)) out += `${a} is a shell builtin\n`;
          else if (a === 'll') out += `ll is aliased to \`ls -l'\n`;
          else if (BIN.includes(a)) out += `${a} is /usr/bin/${a}\n`;
          else if (KNOWN.includes(a) || USRBIN.includes(a)) out += `${a} is /usr/bin/${a}\n`;
          else E(`bash: type: ${a}: not found`);
        }); break;
        case 'alias': out = "alias ll='ls -l'\n"; break;
        case 'll': return this.exec('ls', ['-l', ...args], stdin);
        case 'man': case 'whatis': case 'apropos': {
          if (name === 'apropos' || args[0] === '-k') {
            const w = noAcc(name === 'apropos' ? args[0] || '' : args[1] || '');
            if (!w) { E(`${name}: what?`); break; }
            const hits = Object.entries(MAN).filter(([k, m]) => noAcc(k + ' ' + m[0]).includes(w));
            if (!hits.length) { E(`${w}: nothing appropriate.`); break; }
            out = hits.map(([k, m]) => `${k.padEnd(12)} (1) - ${m[0].split(' - ')[1]}`).join('\n') + '\n';
            break;
          }
          const t = args.filter(a => !/^\d$/.test(a))[0];
          if (!t) { E('What manual page do you want?\nFor example, try \'man man\'.'); break; }
          const m = MAN[t];
          if (!m) { E(`No manual entry for ${t}`, 16); break; }
          if (name === 'whatis') { out = `${t.padEnd(12)} (1) - ${m[0].split(' - ')[1]}\n`; break; }
          const T = t.toUpperCase() + '(1)';
          out = `${T.padEnd(30)}Manuel (résumé)${T.padStart(30)}\n\nNOM\n       ${m[0]}\n\nSYNOPSIS\n${m[1].split('\n').map(l => '       ' + l).join('\n')}\n\nDESCRIPTION\n       ${m[2]}\n` +
            (m[3].length ? '\nOPTIONS\n' + m[3].map(o => `       ${o[0]}\n              ${o[1]}\n`).join('') : '') + '\n';
          hint = 'Dans un vrai terminal, la page s\'ouvre dans less : flèches pour défiler, /mot pour chercher, q pour quitter.';
          break;
        }
        case 'history': out = this.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`).join('\n') + '\n'; break;
        case 'echo': {
          let i = 0, nl = true, esc = false;
          while (i < args.length && /^-[neE]+$/.test(args[i])) { if (args[i].includes('n')) nl = false; if (args[i].includes('e')) esc = true; i++; }
          let t = args.slice(i).join(' ');
          if (esc) t = t.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
          out = t + (nl ? '\n' : '');
          break;
        }
        case 'date': {
          let d = this.now();
          const { vals, rest } = S(args, 'd');
          if (vals.d) {
            const w = noAcc(vals.d);
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            d = new Date(d);
            if (w === 'tomorrow') d.setDate(d.getDate() + 1);
            else if (w === 'yesterday') d.setDate(d.getDate() - 1);
            else if (w === 'now' || w === 'today') { /* rien */ }
            else if (days.some(x => w.includes(x))) { const k = days.findIndex(x => w.includes(x)); let diff = (k - d.getDay() + 7) % 7; if (!diff) diff = 7; d.setDate(d.getDate() + diff); d.setHours(0, 0, 0, 0); }
            else if (/^\d{4}-\d{2}-\d{2}$/.test(w)) { d = new Date(w + 'T00:00:00'); }
            else { E(`date: invalid date '${vals.d}'`); break; }
          }
          const f = rest.find(x => x.startsWith('+'));
          if (f) {
            const JOURS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            out = f.slice(1).replace(/%([dmYyHMSAaBbjF%])/g, (_, k) => ({ d: pad2(d.getDate()), m: pad2(d.getMonth() + 1), Y: d.getFullYear(), y: pad2(d.getFullYear() % 100), H: pad2(d.getHours()), M: pad2(d.getMinutes()), S: pad2(d.getSeconds()), A: JOURS[d.getDay()], a: DAYS[d.getDay()], b: MONTHS[d.getMonth()], B: MONTHS[d.getMonth()], j: '', F: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`, '%': '%' }[k])) + '\n';
          } else out = `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} CET ${d.getFullYear()}\n`;
          break;
        }
        case 'cal': {
          const NOMS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const month = (y, m) => {
            const head = `${NOMS[m]} ${y}`;
            let s = head.padStart(Math.floor((20 + head.length) / 2)).padEnd(20) + '\nSu Mo Tu We Th Fr Sa\n';
            const first = new Date(y, m, 1).getDay(), nd = new Date(y, m + 1, 0).getDate();
            let row = '   '.repeat(first);
            for (let dd = 1; dd <= nd; dd++) { row += String(dd).padStart(2) + ' '; if ((first + dd) % 7 === 0) { s += row.trimEnd() + '\n'; row = ''; } }
            if (row) s += row.trimEnd() + '\n';
            return s;
          };
          const now = this.now();
          if (args.length === 0) out = month(now.getFullYear(), now.getMonth());
          else if (args.length === 1 && /^\d+$/.test(args[0])) { const y = +args[0]; for (let m = 0; m < 12; m++) out += month(y, m) + '\n'; }
          else if (args.length === 2 && /^\d+$/.test(args[0]) && /^\d+$/.test(args[1]) && +args[0] >= 1 && +args[0] <= 12) out = month(+args[1], +args[0] - 1);
          else E('cal: invalid argument');
          break;
        }
        case 'cd': {
          const t = args[0];
          let target;
          if (args.length > 1) { E('bash: cd: too many arguments'); break; }
          if (t === undefined || t === '~') target = this.home.slice();
          else if (t === '-') { if (!this.prev) { E('bash: cd: OLDPWD not set'); break; } target = this.prev.slice(); out = this.pathOf(target) + '\n'; }
          else target = this.normalize(t);
          const r = this.lookup(target);
          if (r.err) { E(`bash: cd: ${t}: ${r.err}`); break; }
          if (r.node.t !== 'd') { E(`bash: cd: ${t}: Not a directory`); break; }
          if (!this.can(r.node, 1)) { E(`bash: cd: ${t}: Permission denied`); break; }
          this.prev = this.cwd; this.cwd = target;
          break;
        }
        case 'ls': {
          const { flags, rest } = S(args);
          const L = flags.has('l') || flags.has('n'), A = flags.has('a'), D = flags.has('d'), R = flags.has('R'), T = flags.has('t'), REV = flags.has('r'), HU = flags.has('h'), N = flags.has('n');
          for (const f of flags) if (!f.startsWith('--') && !'laAdRtrhn1'.includes(f)) { E(`ls: invalid option -- '${f}'\nTry 'ls --help' for more information.`, 2); return { err, code }; }
          const targets = rest.length ? rest : ['.'];
          const files = [], dirs = [];
          targets.forEach(t => {
            const parts = this.normalize(t);
            const r = this.lookup(parts, false);
            if (r.err) { E(`ls: cannot access '${t}': ${r.err}`, 2); return; }
            let n = r.node;
            if (n.t === 'l' && !L) { const rr = this.lookup(parts); if (rr.node) n = rr.node; }
            if (n.t !== 'd' || D) files.push([t, n]); else dirs.push([t, n, parts]);
          });
          const sorter = (a, b) => (T ? b[1].mtime - a[1].mtime || a[0].localeCompare(b[0], 'fr') : a[0].replace(/^\./, '').localeCompare(b[0].replace(/^\./, ''), 'fr', { sensitivity: 'base' }) || a[0].localeCompare(b[0]));
          const order = arr => { arr.sort(sorter); if (REV) arr.reverse(); return arr; };
          const color = (n, node) => (node.t === 'd' ? M.D + n + M.END : node.t === 'l' ? M.X + n + M.END : (node.mode & 0o111 ? M.X + n + M.END : n));
          const fmt = (entries, isDirListing) => {
            if (!L) return entries.length ? entries.map(([n, node]) => color(n, node)).join(this.tty === false || flags.has('1') ? '\n' : '  ') + '\n' : '';
            const links = node => (node.t === 'd' ? String(2 + [...node.kids.values()].filter(k => k.t === 'd').length) : '1');
            const rows = entries.map(([n, node]) => [modeStr(node.t, node.mode, !!node.acl), links(node), N ? String(USERS[node.owner] ? USERS[node.owner].uid : 0) : node.owner, N ? String(GROUPS[node.group] || 0) : node.group, HU ? human(sizeOf(node)) : String(sizeOf(node)), fmtDate(node.mtime), color(n, node) + (node.t === 'l' ? ' -> ' + node.target : '')]);
            const w = [1, 2, 3, 4].map(i => Math.max(...rows.map(r => r[i].length), 0));
            const total = entries.reduce((a, [, node]) => a + (node.t === 'd' ? 4 : Math.ceil(sizeOf(node) / 4096) * 4), 0);
            return (isDirListing ? `total ${HU ? human(total * 1024) : total}\n` : '') + rows.map(r => `${r[0]} ${r[1].padStart(w[0])} ${r[2].padEnd(w[1])} ${r[3].padEnd(w[2])} ${r[4].padStart(w[3])} ${r[5]} ${r[6]}`).join('\n') + (rows.length ? '\n' : '');
          };
          const blocks = [];
          if (files.length) blocks.push(fmt(order(files), false));
          const listDir = (label, n, parts, head) => {
            if (!this.can(n, 4)) { E(`ls: cannot open directory '${label}': Permission denied`, 2); return; }
            let entries = order([...n.kids.entries()].filter(([k]) => A || !k.startsWith('.')));
            if (A) entries = [['.', n], ['..', n]].concat(entries);
            if (L && !this.can(n, 1)) { entries.forEach(([k]) => { if (k !== '.' && k !== '..') E(`ls: cannot access '${(label === '.' ? '' : label + '/') + k}': Permission denied`); }); blocks.push((head ? label + ':\n' : '') + 'total 0\n'); return; }
            blocks.push((head ? label + ':\n' : '') + fmt(entries, true));
            if (R) entries.filter(([k, c]) => c.t === 'd' && k !== '.' && k !== '..').forEach(([k, c]) => listDir((label === '.' ? '.' : label) + '/' + k, c, parts.concat(k), true));
          };
          order(dirs).forEach(([t, n, parts]) => listDir(t, n, parts, targets.length > 1 || files.length > 0 || R));
          out = blocks.join('\n');
          break;
        }
        case 'tree': {
          const { flags, rest } = S(args);
          const start = rest[0] || '.';
          const r = this.lookup(this.normalize(start));
          if (r.err) { out = `${start}  [error opening dir]\n\n0 directories, 0 files\n`; code = 2; break; }
          const lns = [M.D + start + M.END];
          let nd = 0, nf = 0;
          const walk = (n, pre) => {
            if (n.t !== 'd' || !this.can(n, 4)) return;
            const ks = [...n.kids.keys()].filter(k => (flags.has('a') || !k.startsWith('.')) && (!flags.has('d') || n.kids.get(k).t === 'd')).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
            ks.forEach((k, i) => {
              const lastK = i === ks.length - 1, c = n.kids.get(k);
              if (c.t === 'd') nd++; else nf++;
              lns.push(pre + (lastK ? '└── ' : '├── ') + (c.t === 'd' ? M.D + k + M.END : c.mode & 0o111 ? M.X + k + M.END : k));
              walk(c, pre + (lastK ? '    ' : '│   '));
            });
          };
          walk(r.node, '');
          out = lns.join('\n') + `\n\n${nd} director${nd === 1 ? 'y' : 'ies'}${flags.has('d') ? '' : `, ${nf} file${nf === 1 ? '' : 's'}`}\n`;
          break;
        }
        case 'du': {
          const { flags, rest } = S(args);
          const tot = n => (n.t === 'd' ? 4096 + [...n.kids.values()].reduce((a, k) => a + tot(k), 0) : sizeOf(n));
          const show = v => (flags.has('h') ? human(Math.ceil(v / 4096) * 4096) : String(Math.ceil(v / 1024)));
          (rest.length ? rest : ['.']).forEach(t => {
            const r = this.lookup(this.normalize(t));
            if (r.err) { E(`du: cannot access '${t}': ${r.err}`); return; }
            if (!flags.has('s') && r.node.t === 'd') {
              const walk = (n, p) => { n.kids.forEach((k, kn) => { if (k.t === 'd') walk(k, p + '/' + kn); }); out += `${show(tot(n))}\t${p}\n`; };
              walk(r.node, t);
            } else out += `${show(tot(r.node))}\t${t}\n`;
          });
          break;
        }
        case 'quota': out = 'Disk quotas for user ' + this.eff() + ' (simulé) :\n     Filesystem   space   quota   limit\n   /home          124M   1900M   2000M\n'; break;
        case 'mkdir': {
          const { flags, rest } = S(args);
          if (!rest.length) { E('mkdir: missing operand\nTry \'mkdir --help\' for more information.'); break; }
          const P = flags.has('p'), V = flags.has('v');
          rest.forEach(t => {
            const parts = this.normalize(t);
            if (P) {
              let cur = this.root;
              for (let i = 0; i < parts.length; i++) {
                let nx = cur.kids.get(parts[i]);
                if (!nx) {
                  if (!this.can(cur, 2) || !this.can(cur, 1)) { E(`mkdir: cannot create directory '${t}': Permission denied`); return; }
                  nx = this.newNode(cur, 'd'); cur.kids.set(parts[i], nx);
                  if (V) out += `mkdir: created directory '${this.pathOf(parts.slice(0, i + 1))}'\n`;
                } else if (nx.t !== 'd') { E(`mkdir: cannot create directory '${t}': Not a directory`); return; }
                else if (!this.can(nx, 1) && i < parts.length - 1) { E(`mkdir: cannot create directory '${t}': Permission denied`); return; }
                cur = nx;
              }
              return;
            }
            const pp = this.parentOf(parts);
            if (pp.err) { E(`mkdir: cannot create directory '${t}': ${pp.err}`); return; }
            if (pp.parent.kids.has(pp.name)) { E(`mkdir: cannot create directory '${t}': File exists`); return; }
            if (!this.can(pp.parent, 2)) { E(`mkdir: cannot create directory '${t}': Permission denied`); return; }
            pp.parent.kids.set(pp.name, this.newNode(pp.parent, 'd'));
            if (V) out += `mkdir: created directory '${t}'\n`;
          });
          break;
        }
        case 'rmdir': {
          if (!args.length) { E('rmdir: missing operand'); break; }
          args.forEach(t => {
            const parts = this.normalize(t);
            const pp = this.parentOf(parts);
            const n = pp.parent && pp.parent.kids.get(pp.name);
            if (pp.err || !n) { E(`rmdir: failed to remove '${t}': ${pp.err || 'No such file or directory'}`); return; }
            if (n.t !== 'd') { E(`rmdir: failed to remove '${t}': Not a directory`); return; }
            if (n.kids.size) { E(`rmdir: failed to remove '${t}': Directory not empty`); return; }
            if (!this.can(pp.parent, 2)) { E(`rmdir: failed to remove '${t}': Permission denied`); return; }
            pp.parent.kids.delete(pp.name);
          });
          break;
        }
        case 'touch': {
          if (!args.length) { E('touch: missing file operand'); break; }
          args.forEach(t => {
            const parts = this.normalize(t);
            const r = this.lookup(parts);
            if (r.node) { if (r.node.owner !== this.eff() && !this.can(r.node, 2)) { E(`touch: cannot touch '${t}': Permission denied`); return; } r.node.mtime = this.now(); return; }
            if (r.err !== 'No such file or directory' || r.missingAt !== parts.length - 1) { E(`touch: cannot touch '${t}': ${r.err}`); return; }
            const pp = this.parentOf(parts);
            if (pp.err) { E(`touch: cannot touch '${t}': ${pp.err}`); return; }
            if (!this.can(pp.parent, 2)) { E(`touch: cannot touch '${t}': Permission denied`); return; }
            pp.parent.kids.set(pp.name, this.newNode(pp.parent, 'f'));
          });
          break;
        }
        case 'cat': case 'less': case 'more': case 'zless': {
          const { flags, rest } = S(args);
          if (name !== 'cat' && !rest.length && stdin === null) { E(`Missing filename ("${name} --help" for help)`); break; }
          if (name === 'zless') return this.exec('zcat', rest, stdin);
          let k = 0;
          readIn(rest, name).forEach(f => {
            let d = f.data;
            if (flags.has('n')) d = lines(d).map(l => `${String(++k).padStart(6)}\t${l}`).join('\n') + (d ? '\n' : '');
            out += f.enc === 'latin1' ? d : d;
            if (f.enc === 'latin1') outEnc = 'latin1';
          });
          if (name === 'cat' && !rest.length && stdin === null) hint = 'cat sans fichier lit le clavier jusqu\'à Ctrl+D. Ici, donne-lui un nom de fichier ou utilise un tube.';
          if (name !== 'cat' && !err) hint = `${name} simulé : tout le fichier est affiché. Dans un vrai terminal : Espace = page suivante, b = page précédente, /mot = chercher, q = quitter.`;
          break;
        }
        case 'head': case 'tail': {
          const { vals, rest } = S(args, 'n#c');
          let n = vals.n != null ? vals.n : '10';
          const from = name === 'tail' && String(n).startsWith('+');
          n = parseInt(String(n).replace('+', ''), 10);
          if (isNaN(n)) { E(`${name}: invalid number of lines: '${vals.n}'`); break; }
          const fs = readIn(rest, name);
          fs.forEach((f, i) => {
            const l = lines(f.data);
            const sel = name === 'head' ? l.slice(0, n) : from ? l.slice(n - 1) : l.slice(Math.max(0, l.length - n));
            if (fs.length > 1) out += (i ? '\n' : '') + `==> ${f.name} <==\n`;
            out += sel.map(x => x + '\n').join('');
            if (f.enc) outEnc = f.enc;
          });
          break;
        }
        case 'wc': {
          const { flags, rest } = S(args);
          const sel = ['l', 'w', 'c'].filter(f => flags.has(f) || flags.has(f === 'c' ? 'm' : f));
          const which = sel.length ? sel : ['l', 'w', 'c'];
          const fs = readIn(rest, 'wc');
          const rows = fs.map(f => [(f.data.match(/\n/g) || []).length, f.data.split(/\s+/).filter(Boolean).length, encode(f.data, f.enc).length, f.name]);
          if (fs.length > 1) rows.push([rows.reduce((a, r) => a + r[0], 0), rows.reduce((a, r) => a + r[1], 0), rows.reduce((a, r) => a + r[2], 0), 'total']);
          const idx = { l: 0, w: 1, c: 2 };
          const width = which.length === 1 && rows.length === 1 ? 0 : Math.max(...rows.flatMap(r => which.map(k => String(r[idx[k]]).length)), rest.length ? 1 : 7);
          rows.forEach(r => { out += which.map(k => String(r[idx[k]]).padStart(width)).join(' ') + (r[3] ? ' ' + r[3] : '') + '\n'; });
          break;
        }
        case 'file': {
          if (!args.length) { E('Usage: file FICHIER...'); break; }
          args.forEach(t => {
            const r = this.lookup(this.normalize(t), false);
            if (r.err) { out += `${t}: cannot open \`${t}' (${r.err})\n`; return; }
            const n = r.node;
            let d;
            if (n.t === 'd') d = 'directory';
            else if (n.t === 'l') d = `symbolic link to ${n.target}`;
            else if (n.gz) d = `gzip compressed data, was "${n.gz.name}"`;
            else if (n.bz) d = 'bzip2 compressed data, block size = 900k';
            else if (n.tar) d = 'POSIX tar archive (GNU)';
            else if (n.bin) d = { elf: 'ELF 64-bit LSB pie executable, x86-64, dynamically linked', class: 'compiled Java class data, version 65.0', jpeg: 'JPEG image data, JFIF standard 1.01', png: 'PNG image data, 1920 x 1080, 8-bit/color RGBA' }[n.bin.kind];
            else if (!this.can(n, 4)) d = `regular file, no read permission`;
            else if (!n.data) d = 'empty';
            else {
              const asc = !/[^\x00-\x7f]/.test(n.data);
              const kind = n.data.startsWith('#!/bin/bash') ? 'Bourne-Again shell script, ' : /\.(cpp|cc|c)$/.test(t) ? 'C++ source, ' : /\.java$/.test(t) ? 'Java source, ' : '';
              d = kind + (n.enc === 'latin1' && !asc ? 'ISO-8859 text' : asc ? 'ASCII text' : 'Unicode text, UTF-8 text') + (kind.startsWith('Bourne') ? ' executable' : '');
            }
            out += `${t}: ${d}\n`;
          });
          break;
        }
        case 'cp': {
          const { flags, rest } = S(args);
          const R = flags.has('R') || flags.has('r') || flags.has('a'), V = flags.has('v'), P = flags.has('p') || flags.has('a');
          if (rest.length < 2) { E(rest.length ? `cp: missing destination file operand after '${rest[0]}'` : 'cp: missing file operand'); break; }
          const dst = rest[rest.length - 1], srcs = rest.slice(0, -1);
          const dparts = this.normalize(dst);
          const dr = this.lookup(dparts);
          const dstIsDir = dr.node && dr.node.t === 'd';
          if (srcs.length > 1 && !dstIsDir) { E(`cp: target '${dst}' is not a directory`); break; }
          srcs.forEach(s => {
            const sparts = this.normalize(s);
            const sr = this.lookup(sparts);
            if (sr.err) { E(`cp: cannot stat '${s}': ${sr.err}`); return; }
            if (sr.node.t === 'd' && !R) { E(`cp: -r not specified; omitting directory '${s}'`); return; }
            const target = dstIsDir ? dparts.concat(sparts[sparts.length - 1] || '') : dparts;
            if (sr.node.t === 'd' && target.slice(0, sparts.length).join('/') === sparts.join('/')) { E(`cp: cannot copy a directory, '${s}', into itself, '${dst}'`); return; }
            if (target.join('/') === sparts.join('/')) { E(`cp: '${s}' and '${dst}' are the same file`); return; }
            const pp = this.parentOf(target);
            if (pp.err) { E(`cp: cannot create regular file '${dst}': ${pp.err}`); return; }
            const ex = pp.parent.kids.get(pp.name);
            if (!ex && !this.can(pp.parent, 2)) { E(`cp: cannot create ${sr.node.t === 'd' ? 'directory' : 'regular file'} '${dst}': Permission denied`); return; }
            if (ex && ex.t === 'd' && sr.node.t !== 'd') { E(`cp: cannot overwrite directory '${dst}' with non-directory`); return; }
            const problem = this.copyNode(sr.node, pp.parent, pp.name, s, P);
            if (problem) err += problem, code = 1;
            if (V) out += `'${s}' -> '${dstIsDir ? dst.replace(/\/$/, '') + '/' + sparts[sparts.length - 1] : dst}'\n`;
          });
          break;
        }
        case 'mv': {
          const { flags, rest } = S(args);
          if (rest.length < 2) { E(rest.length ? `mv: missing destination file operand after '${rest[0]}'` : 'mv: missing file operand'); break; }
          const dst = rest[rest.length - 1], srcs = rest.slice(0, -1);
          const dparts = this.normalize(dst);
          const dr = this.lookup(dparts);
          const dstIsDir = dr.node && dr.node.t === 'd';
          if (srcs.length > 1 && !dstIsDir) { E(`mv: target '${dst}' is not a directory`); break; }
          srcs.forEach(s => {
            const sparts = this.normalize(s);
            const sp = this.parentOf(sparts);
            const sn = sp.parent && sp.parent.kids.get(sp.name);
            if (sp.err || !sn) { E(`mv: cannot stat '${s}': ${sp.err || 'No such file or directory'}`); return; }
            const target = dstIsDir ? dparts.concat(sparts[sparts.length - 1]) : dparts;
            if (sn.t === 'd' && target.length > sparts.length && target.slice(0, sparts.length).join('/') === sparts.join('/')) { E(`mv: cannot move '${s}' to a subdirectory of itself, '${dst}/${sparts[sparts.length - 1]}'`); return; }
            if (target.join('/') === sparts.join('/')) { E(`mv: '${s}' and '${dst}' are the same file`); return; }
            const tp = this.parentOf(target);
            if (tp.err) { E(`mv: cannot move '${s}' to '${dst}': ${tp.err}`); return; }
            if (!this.can(sp.parent, 2) || !this.can(tp.parent, 2)) { E(`mv: cannot move '${s}' to '${dst}': Permission denied`); return; }
            if (sp.parent.mode & 0o1000 && sn.owner !== this.eff() && sp.parent.owner !== this.eff() && this.eff() !== 'root') { E(`mv: cannot move '${s}' to '${dst}': Operation not permitted`); return; }
            const ex = tp.parent.kids.get(tp.name);
            if (ex && ex.t === 'd' && sn.t !== 'd') { E(`mv: cannot overwrite directory '${dst}' with non-directory`); return; }
            if (ex && ex.t === 'd' && ex.kids.size) { E(`mv: cannot move '${s}' to '${dst}': Directory not empty`); return; }
            sp.parent.kids.delete(sp.name);
            tp.parent.kids.set(tp.name, sn);
            if (flags.has('v')) out += `renamed '${s}' -> '${dstIsDir ? dst.replace(/\/$/, '') + '/' + sparts[sparts.length - 1] : dst}'\n`;
          });
          break;
        }
        case 'rm': {
          const { flags, rest } = S(args);
          const R = flags.has('r') || flags.has('R'), F = flags.has('f'), V = flags.has('v');
          if (!rest.length) { if (!F) E('rm: missing operand\nTry \'rm --help\' for more information.'); break; }
          rest.forEach(t => {
            const parts = this.normalize(t);
            if (['.', '..'].includes(t.replace(/\/+$/, '').split('/').pop())) { E(`rm: refusing to remove '.' or '..' directory: skipping '${t}'`); return; }
            if (!parts.length) { E(`rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe`); return; }
            const pp = this.parentOf(parts);
            const n = pp.parent && pp.parent.kids.get(pp.name);
            if (pp.err || !n) { if (!F) E(`rm: cannot remove '${t}': ${pp.err || 'No such file or directory'}`); return; }
            if (n.t === 'd' && !R) { E(`rm: cannot remove '${t}': Is a directory`); return; }
            if (!this.can(pp.parent, 2)) { E(`rm: cannot remove '${t}': Permission denied`); return; }
            if (pp.parent.mode & 0o1000 && n.owner !== this.eff() && pp.parent.owner !== this.eff() && this.eff() !== 'root') { E(`rm: cannot remove '${t}': Operation not permitted`); return; }
            if (n.t === 'd' && R) {
              const blocked = (d) => [...d.kids.values()].some(k => k.t === 'd' && (!this.can(k, 2) || !this.can(k, 1) || blocked(k)) && k.kids.size);
              if ((!this.can(n, 2) || !this.can(n, 1)) && n.kids.size) { E(`rm: cannot remove '${t}': Permission denied`); return; }
              if (blocked(n)) { E(`rm: cannot remove '${t}': Permission denied`); return; }
            }
            pp.parent.kids.delete(pp.name);
            if (V) out += n.t === 'd' ? `removed directory '${t}'\n` : `removed '${t}'\n`;
          });
          if (flags.has('i')) hint = 'rm -i demanderait une confirmation (y/n) pour chaque fichier. Ici, le terminal simulé ne pose pas de question.';
          break;
        }
        case 'ln': {
          const { flags, rest } = S(args);
          if (!flags.has('s') || rest.length !== 2) { E('ln : seul « ln -s CIBLE NOM » est disponible dans le terminal simulé'); break; }
          const pp = this.parentOf(this.normalize(rest[1]));
          if (pp.err) { E(`ln: failed to create symbolic link '${rest[1]}': ${pp.err}`); break; }
          if (pp.parent.kids.has(pp.name)) { E(`ln: failed to create symbolic link '${rest[1]}': File exists`); break; }
          pp.parent.kids.set(pp.name, { t: 'l', mode: 0o777, owner: this.eff(), group: USERS[this.eff()].gid, mtime: this.now(), target: rest[0] });
          break;
        }
        case 'chmod': {
          const R = args.some(a => /^-[A-Za-z]*R[A-Za-z]*$/.test(a));
          const rest = args.filter(a => !/^-R$|^-v$/.test(a));
          const modeArg = rest[0], files = rest.slice(1);
          if (modeArg === undefined) { E('chmod: missing operand'); break; }
          if (!files.length) { E(`chmod: missing operand after '${modeArg}'`); break; }
          if (!validMode(modeArg)) { E(`chmod: invalid mode: '${modeArg}'`); break; }
          files.forEach(t => {
            const r = this.lookup(this.normalize(t));
            if (r.err) { E(`chmod: cannot access '${t}': ${r.err}`); return; }
            const apply = (n, label) => {
              if (n.owner !== this.eff() && this.eff() !== 'root') { E(`chmod: changing permissions of '${label}': Operation not permitted`); return; }
              n.mode = applyMode(modeArg, n.mode, n.t === 'd', this.umask);
              if (n.acl) n.acl.mask = (n.mode >> 3) & 7;   // avec des ACL, les droits « groupe » de chmod sont le masque
              if (R && n.t === 'd') n.kids.forEach((k, kn) => apply(k, label + '/' + kn));
            };
            apply(r.node, t);
          });
          break;
        }
        case 'chown': case 'chgrp': {
          const R = args.includes('-R');
          const rest = args.filter(a => a !== '-R');
          if (rest.length < 2) { E(`${name}: missing operand`); break; }
          let owner = null, group = null;
          if (name === 'chgrp') group = rest[0];
          else { const [o, g] = rest[0].split(':'); owner = o || null; group = g || null; }
          if (owner && !USERS[owner]) { E(`chown: invalid user: '${rest[0]}'`); break; }
          if (group && GROUPS[group] == null) { E(`${name}: invalid group: '${rest[0]}'`); break; }
          rest.slice(1).forEach(t => {
            const r = this.lookup(this.normalize(t));
            if (r.err) { E(`${name}: cannot access '${t}': ${r.err}`); return; }
            const me = this.eff();
            const apply = n => {
              const ok = me === 'root' || (!owner && n.owner === me && USERS[me].groups.includes(group));
              if (!ok) { E(`${name}: changing ${owner ? 'ownership' : 'group'} of '${t}': Operation not permitted`); return false; }
              if (owner) n.owner = owner;
              if (group) n.group = group;
              if (R && n.t === 'd') n.kids.forEach(apply);
              return true;
            };
            apply(r.node);
          });
          break;
        }
        case 'umask': {
          const Sflag = args.includes('-S');
          const v = args.find(a => a !== '-S');
          if (v === undefined) { out = (Sflag ? symStr(0o777 & ~this.umask) : '0' + octStr(this.umask)) + '\n'; break; }
          if (!/^[0-7]{1,4}$/.test(v)) { E(`bash: umask: ${v}: octal number out of range`); break; }
          this.umask = parseInt(v, 8) & 0o777;
          break;
        }
        case 'getfacl': {
          const files = args.filter(a => !a.startsWith('-'));
          if (!files.length) { E('Usage: getfacl FICHIER...'); break; }
          files.forEach((t, i) => {
            const r = this.lookup(this.normalize(t));
            if (r.err) { E(`getfacl: ${t}: ${r.err}`); return; }
            const n = r.node, a = n.acl;
            let s = `# file: ${t.replace(/^\//, '')}\n# owner: ${n.owner}\n# group: ${n.group}\n`;
            if (n.mode & 0o1000) s += '# flags: --t\n';
            s += `user::${rwx((n.mode >> 6) & 7)}\n`;
            const eff = b => (a && (b & a.mask) !== b ? `\t#effective:${rwx(b & a.mask)}` : '');
            if (a) Object.entries(a.u).forEach(([u, b]) => { s += `user:${u}:${rwx(b)}${eff(b)}\n`; });
            const g0 = a ? a.g0 : (n.mode >> 3) & 7;
            s += `group::${rwx(g0)}${eff(g0)}\n`;
            if (a) { Object.entries(a.g).forEach(([g, b]) => { s += `group:${g}:${rwx(b)}${eff(b)}\n`; }); s += `mask::${rwx(a.mask)}\n`; }
            s += `other::${rwx(n.mode & 7)}\n`;
            if (a && a.def) {
              const d = a.def;
              s += `default:user::${rwx(d.user)}\n` + Object.entries(d.u).map(([u, b]) => `default:user:${u}:${rwx(b)}\n`).join('') + `default:group::${rwx(d.g0)}\n` + Object.entries(d.g).map(([g, b]) => `default:group:${g}:${rwx(b)}\n`).join('') + `default:mask::${rwx(d.mask)}\ndefault:other::${rwx(d.other)}\n`;
            }
            out += (i ? '\n' : '') + s;
          });
          if (out) out += '\n';
          break;
        }
        case 'setfacl': {
          const { flags, vals, rest } = S(args, 'mx');
          let spec = vals.m || vals.x;
          if (spec && flags.has('d')) spec = spec.split(',').map(e => (/^d(efault)?:/.test(e) ? e : 'd:' + e)).join(',');
          const files = rest;
          if ((!spec && !flags.has('b')) || !files.length) { E('Usage: setfacl [-m|-x] ENTRÉES FICHIER...   ou   setfacl -b FICHIER...'); break; }
          files.forEach(t => {
            const r = this.lookup(this.normalize(t));
            if (r.err) { E(`setfacl: ${t}: ${r.err}`); return; }
            const n = r.node;
            if (n.owner !== this.eff() && this.eff() !== 'root') { E(`setfacl: ${t}: Operation not permitted`); return; }
            if (flags.has('b')) { if (n.acl) { n.mode = (n.mode & ~0o070) | (n.acl.g0 << 3); delete n.acl; } return; }
            const ensure = () => { if (!n.acl) n.acl = { u: {}, g: {}, g0: (n.mode >> 3) & 7, mask: (n.mode >> 3) & 7, def: null }; return n.acl; };
            let explicitMask = false, okAll = true;
            spec.split(',').forEach(entry => {
              const def = entry.startsWith('d:') || entry.startsWith('default:');
              const e = entry.replace(/^(d|default):/, '');
              const m = e.match(/^(u|user|g|group|m|mask|o|other):([^:]*)(?::([rwxX-]*))?$/);
              if (!m) { E(`setfacl: Option -${vals.m ? 'm' : 'x'}: Invalid argument near character 1`); okAll = false; return; }
              const kind = m[1][0], who = m[2], b = m[3] != null ? parseRwx(m[3]) : null;
              if (who && kind === 'u' && !USERS[who]) { E(`setfacl: Option -m: Invalid argument near character 3`); okAll = false; return; }
              if (who && kind === 'g' && GROUPS[who] == null) { E(`setfacl: Option -m: Invalid argument near character 3`); okAll = false; return; }
              if (def) {
                if (n.t !== 'd') { E(`setfacl: ${t}: Only directories can have default ACLs`); okAll = false; return; }
                const a = ensure();
                if (!a.def) a.def = { user: (n.mode >> 6) & 7, g0: a.g0, other: n.mode & 7, mask: a.mask, u: {}, g: {} };
                const d = a.def;
                if (vals.x) { if (kind === 'u') delete d.u[who]; if (kind === 'g') delete d.g[who]; }
                else if (kind === 'u') { if (who) d.u[who] = b; else d.user = b; }
                else if (kind === 'g') { if (who) d.g[who] = b; else d.g0 = b; }
                else if (kind === 'm') d.mask = b; else d.other = b;
                d.mask = Math.max(0, [d.g0, ...Object.values(d.u), ...Object.values(d.g)].reduce((x, y) => x | y, 0));
                return;
              }
              if (vals.x) { if (!n.acl) return; if (kind === 'u') delete n.acl.u[who]; else if (kind === 'g') delete n.acl.g[who]; return; }
              if (kind === 'u' && !who) { n.mode = (n.mode & ~0o700) | (b << 6); return; }
              if (kind === 'o') { n.mode = (n.mode & ~0o007) | b; return; }
              const a = ensure();
              if (kind === 'u') a.u[who] = b;
              else if (kind === 'g') { if (who) a.g[who] = b; else a.g0 = b; }
              else if (kind === 'm') { a.mask = b; explicitMask = true; }
            });
            if (!okAll || !n.acl) return;
            const a = n.acl;
            if (!explicitMask) a.mask = [a.g0, ...Object.values(a.u), ...Object.values(a.g)].reduce((x, y) => x | y, 0);
            if (!Object.keys(a.u).length && !Object.keys(a.g).length && !a.def) { n.mode = (n.mode & ~0o070) | (a.g0 << 3); delete n.acl; return; }
            n.mode = (n.mode & ~0o070) | (a.mask << 3);
          });
          break;
        }
        case 'su': {
          const u = args.filter(a => a !== '-')[0] || 'root';
          if (!USERS[u]) { E(`su: user ${u} does not exist or the user entry does not contain all the required fields`); break; }
          this.userStack.push({ user: this.user, cwd: this.cwd, asRoot: this.asRoot });
          this.user = u; this.asRoot = false;
          if (args.includes('-') || args.includes('-l')) this.cwd = USERS[u].home.split('/').filter(Boolean);
          hint = this.userStack[this.userStack.length - 1].user === 'root' ? '' : `Password: (simulé : mot de passe accepté) — tu es maintenant ${u}. Tape exit pour revenir.`;
          break;
        }
        case 'exit': case 'logout': {
          if (this.userStack.length) { const p = this.userStack.pop(); this.user = p.user; this.asRoot = p.asRoot; out = 'exit\n'; break; }
          out = 'exit\n'; hint = 'Dans un vrai terminal, exit (ou Ctrl+D) fermerait le shell et la fenêtre. Ici, le terminal reste ouvert.';
          break;
        }
        case 'sudo': {
          if (!args.length) { E('usage: sudo COMMANDE'); break; }
          if (this.eff() !== 'root' && !USERS[this.user].groups.includes('sudo')) { E(`${this.user} is not in the sudoers file.  This incident will be reported.`); break; }
          if (args[0] === 'su' || args[0] === '-i' || args[0] === '-s') { this.userStack.push({ user: this.user, cwd: this.cwd, asRoot: this.asRoot }); this.user = 'root'; hint = 'Tu es root : prudence. Tape exit pour revenir.'; break; }
          const was = this.asRoot;
          this.asRoot = true;
          const r = this.exec(args[0], args.slice(1), stdin);
          this.asRoot = was;
          if (!this.sudoAsked && this.user !== 'root') { r.hint = (r.hint ? r.hint + ' ' : '') + `[sudo] password for ${this.user}: (simulé : accepté)`; this.sudoAsked = true; }
          return r;
        }
        case 'passwd': hint = 'Simulé : passwd demanderait l\'ancien mot de passe puis deux fois le nouveau (rien ne s\'affiche pendant la frappe, c\'est normal).'; break;
        case 'apt': case 'apt-get': {
          if (args[0] !== 'install' || !args[1]) { hint = `${name} simulé : utilise « sudo ${name} install PAQUET ».`; break; }
          if (this.eff() !== 'root') { E(`E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock, are you root?`, 100); break; }
          out = `Reading package lists... Done\nBuilding dependency tree... Done\nThe following NEW packages will be installed:\n  ${args.slice(1).join(' ')}\n`;
          hint = 'Simulé : le paquet n\'est pas vraiment installé.';
          break;
        }
        case 'grep': case 'egrep': {
          const { flags, rest } = S(args);
          if (!rest.length) { E('Usage: grep [OPTION]... MOTIF [FICHIER]...', 2); break; }
          const pat = rest[0];
          const ext = flags.has('E') || name === 'egrep';
          let src = pat;
          if (!ext) src = pat.replace(/\\([|+?(){}])/g, '\u0006$1').replace(/[+?(){}|]/g, '\\$&').replace(/\u0006([|+?(){}])/g, '$1');
          if (flags.has('w')) src = '\\b(?:' + src + ')\\b';
          let re;
          try { re = new RegExp(src, flags.has('i') ? 'gi' : 'g'); } catch (e) { E(`grep: Invalid regular expression`, 2); break; }
          const fs = readIn(rest.slice(1), 'grep');
          let total = 0;
          fs.forEach(f => {
            let cnt = 0;
            lines(f.data).forEach((l, i) => {
              re.lastIndex = 0;
              const hit = re.test(l);
              if (hit === flags.has('v')) return;
              cnt++;
              if (flags.has('c') || flags.has('l')) return;
              re.lastIndex = 0;
              const shown = flags.has('v') ? l : l.replace(re, x => (x ? M.H + x + M.END : x));
              out += (fs.length > 1 ? f.name + ':' : '') + (flags.has('n') ? (i + 1) + ':' : '') + shown + '\n';
            });
            if (flags.has('c')) out += (fs.length > 1 ? f.name + ':' : '') + cnt + '\n';
            if (flags.has('l') && cnt) out += f.name + '\n';
            total += cnt;
          });
          if (!total && !code) code = 1;
          break;
        }
        case 'sort': {
          const { flags, vals, rest } = S(args, 'kt');
          let ls = [];
          readIn(rest, 'sort').forEach(f => { ls = ls.concat(lines(f.data)); });
          const key = l => {
            if (!vals.k) return l;
            const k = parseInt(vals.k, 10) - 1;
            const parts = vals.t ? l.split(vals.t) : l.trim().split(/\s+/);
            return parts.slice(k).join(vals.t || ' ');
          };
          const num = s => { const m = String(s).trim().match(/^-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : 0; };
          ls.sort((a, b) => (flags.has('n') ? num(key(a)) - num(key(b)) : 0) || (flags.has('n') && vals.k ? 0 : key(a).localeCompare(key(b), 'fr')) || a.localeCompare(b, 'fr'));
          if (flags.has('r')) ls.reverse();
          if (flags.has('u')) ls = ls.filter((l, i) => i === 0 || l !== ls[i - 1]);
          out = ls.map(l => l + '\n').join('');
          break;
        }
        case 'uniq': {
          const { flags, rest } = S(args);
          const ls = lines(readIn(rest, 'uniq').map(f => f.data).join(''));
          const groups = [];
          ls.forEach(l => { if (groups.length && groups[groups.length - 1][0] === l) groups[groups.length - 1][1]++; else groups.push([l, 1]); });
          out = groups.filter(g => !flags.has('d') || g[1] > 1).map(g => (flags.has('c') ? String(g[1]).padStart(7) + ' ' : '') + g[0] + '\n').join('');
          break;
        }
        case 'cut': {
          const { vals, rest } = S(args, 'dfc');
          if (!vals.f && !vals.c) { E('cut: you must specify a list of bytes, characters, or fields'); break; }
          const sel = (spec, max) => {
            const set = new Set();
            spec.split(',').forEach(p => { const m = p.match(/^(\d*)(-?)(\d*)$/); if (!m) return; const a = m[1] ? +m[1] : 1, b = m[2] ? (m[3] ? +m[3] : max) : a; for (let i = a; i <= b; i++) set.add(i); });
            return [...set].sort((x, y) => x - y);
          };
          const d = vals.d != null ? vals.d : '\t';
          readIn(rest, 'cut').forEach(f => lines(f.data).forEach(l => {
            if (vals.c) { const ch = [...l]; out += sel(vals.c, ch.length).map(i => ch[i - 1] || '').join('') + '\n'; return; }
            const parts = l.split(d);
            if (parts.length === 1) { out += l + '\n'; return; }
            out += sel(vals.f, parts.length).filter(i => i <= parts.length).map(i => parts[i - 1]).join(d) + '\n';
          }));
          break;
        }
        case 'join': {
          const { vals, rest } = S(args, 't');
          if (rest.length !== 2) { E('join: missing operand'); break; }
          const fs = readIn(rest, 'join');
          if (fs.length < 2) break;
          const sep = vals.t, split = l => (sep ? l.split(sep) : l.trim().split(/\s+/));
          const b = lines(fs[1].data).map(split);
          lines(fs[0].data).map(split).forEach(a => { b.filter(x => x[0] === a[0]).forEach(x => { out += [a[0], ...a.slice(1), ...x.slice(1)].join(sep || ' ') + '\n'; }); });
          break;
        }
        case 'tr': {
          const { flags, rest } = S(args);
          const expand = s => { const r = []; for (let i = 0; i < s.length; i++) { if (s[i + 1] === '-' && i + 2 < s.length) { for (let c = s.charCodeAt(i); c <= s.charCodeAt(i + 2); c++) r.push(String.fromCharCode(c)); i += 2; } else if (s[i] === '\\' && s[i + 1] === 'n') { r.push('\n'); i++; } else r.push(s[i]); } return r; };
          if (!rest.length) { E('tr: missing operand'); break; }
          const a = expand(rest[0]), b = rest[1] ? expand(rest[1]) : [];
          const data = stdin || '';
          if (flags.has('d')) out = [...data].filter(c => !a.includes(c)).join('');
          else { if (!b.length) { E(`tr: missing operand after '${rest[0]}'`); break; } out = [...data].map(c => { const i = a.indexOf(c); return i < 0 ? c : b[Math.min(i, b.length - 1)]; }).join(''); }
          if (stdin === null) hint = 'tr lit seulement l\'entrée standard : utilise un tube (cat f | tr ...) ou une redirection (tr ... < f).';
          break;
        }
        case 'diff': {
          if (args.length !== 2) { E('diff: missing operand', 2); break; }
          const fs = readIn(args, 'diff');
          if (fs.length < 2) { code = 2; break; }
          const d = diffLines(lines(fs[0].data), lines(fs[1].data));
          out = d.length ? d.join('\n') + '\n' : '';
          code = d.length ? 1 : 0;
          break;
        }
        case 'gzip': case 'gunzip': case 'bzip2': case 'bunzip2': {
          const { flags, rest } = S(args);
          const bz = name.startsWith('b'), unz = name.includes('unzip') || flags.has('d');
          const ext = bz ? '.bz2' : '.gz';
          const level = [...flags].find(f => /\d/.test(f));
          if (!rest.length) { E(`${name}: compressed data not written to a terminal.`); break; }
          rest.forEach(t => {
            const parts = this.normalize(t);
            const pp = this.parentOf(parts);
            const n = pp.parent && pp.parent.kids.get(pp.name);
            if (!n) { E(`${name}: ${t}: No such file or directory`); return; }
            if (n.t === 'd') { E(`${name}: ${t} is a directory -- ignored`); return; }
            if (!this.can(n, 4)) { E(`${name}: ${t}: Permission denied`); return; }
            if (!this.can(pp.parent, 2)) { E(`${name}: ${t}${unz ? '' : ext}: Permission denied`); return; }
            if (unz) {
              if (!t.endsWith(ext) || !(bz ? n.bz : n.gz)) { E(`${name}: ${t}: ${t.endsWith(ext) ? 'not in ' + (bz ? 'bzip2' : 'gzip') + ' format' : 'unknown suffix -- ignored'}`); return; }
              const orig = clone((bz ? n.bz : n.gz).node);
              pp.parent.kids.set(pp.name.slice(0, -ext.length), orig);
              if (!flags.has('k')) pp.parent.kids.delete(pp.name);
              if (flags.has('v')) err += `${t}:\t${(100 - 100 * sizeOf(n) / Math.max(1, sizeOf(orig))).toFixed(1)}% -- replaced with ${t.slice(0, -ext.length)}\n`;
              return;
            }
            if (t.endsWith(ext)) { E(`${name}: ${t} already has ${ext} suffix -- unchanged`); return; }
            const orig = clone(n);
            const sz = sizeOf(orig);
            const ratio = orig.bin ? 0.97 : Math.max(0.15, (bz ? 0.38 : 0.45) - (level ? (+level - 6) * 0.02 : 0));
            const c = mkFile(n.mode, '', n.owner, n.group, { size: Math.max(bz ? 40 : 30, Math.round(sz * ratio) + (bz ? 40 : 30)) });
            c.mtime = n.mtime;
            if (bz) c.bz = { name: pp.name, node: orig }; else c.gz = { name: pp.name, node: orig };
            pp.parent.kids.set(pp.name + ext, c);
            if (!flags.has('k')) pp.parent.kids.delete(pp.name);
            if (flags.has('v')) err += `${t}:\t${(100 - 100 * sizeOf(c) / Math.max(1, sz)).toFixed(1)}% -- replaced with ${t}${ext}\n`;
          });
          break;
        }
        case 'zcat': case 'bzcat': {
          const bz = name === 'bzcat';
          args.forEach(t => {
            const r = this.lookup(this.normalize(t));
            if (r.err) { E(`${name}: ${t}: ${r.err}`); return; }
            const g = bz ? r.node.bz : r.node.gz;
            if (!g) { E(`${name}: ${t}: not in ${bz ? 'bzip2' : 'gzip'} format`); return; }
            out += g.node.tar ? garble(t, 200) : g.node.data;
          });
          break;
        }
        case 'tar': {
          let a = args.slice();
          if (a[0] && !a[0].startsWith('-') && /^[ctxvzjf]+$/.test(a[0])) a[0] = '-' + a[0];
          const { flags, vals, rest } = S(a, 'fC');
          const mode = ['c', 't', 'x'].filter(f => flags.has(f));
          if (mode.length !== 1) { E('tar: You must specify one of the \'-Acdtrux\', \'--delete\' or \'--test-label\' options\nTry \'tar --help\' for more information.', 2); break; }
          if (!vals.f) { E('tar: Refusing to read archive contents from terminal (missing -f option?)', 2); break; }
          const V = flags.has('v');
          if (mode[0] === 'c') {
            if (!rest.length) { E('tar: Cowardly refusing to create an empty archive', 2); break; }
            const entries = [];
            const add = (path, n) => {
              if (n.t === 'f' && !this.can(n, 4)) { E(`tar: ${path}: Cannot open: Permission denied`); return; }
              entries.push({ path: n.t === 'd' ? path.replace(/\/?$/, '/') : path, node: n.t === 'd' ? Object.assign(clone(n), { kids: new Map() }) : clone(n) });
              if (V) out += (n.t === 'd' ? path.replace(/\/?$/, '/') : path) + '\n';
              if (n.t === 'd') [...n.kids.entries()].sort((x, y) => x[0].localeCompare(y[0])).forEach(([k, c]) => add(path.replace(/\/$/, '') + '/' + k, c));
            };
            rest.forEach(t => { const r = this.lookup(this.normalize(t)); if (r.err) { E(`tar: ${t}: Cannot stat: ${r.err}`); return; } add(t.replace(/^\/+/, ''), r.node); });
            if (rest.some(t => t.startsWith('/'))) err = 'tar: Removing leading `/\' from member names\n' + err;
            const size = Math.ceil((entries.reduce((x, e) => x + 512 + Math.ceil(sizeOf(e.node.t === 'd' ? { t: 'f', data: '' } : e.node) / 512) * 512, 0) + 1024) / 10240) * 10240;
            let node = mkFile(0o666 & ~this.umask, '', this.eff(), USERS[this.eff()].gid, { tar: entries, size });
            node.mtime = this.now();
            if (flags.has('z') || flags.has('j')) {
              const inner = node;
              node = mkFile(inner.mode, '', inner.owner, inner.group, { size: Math.round(size * 0.12) + 60 });
              node.mtime = inner.mtime;
              if (flags.has('j')) node.bz = { name: vals.f.replace(/\.(bz2|tbz)$/, ''), node: inner }; else node.gz = { name: vals.f.replace(/\.(gz|tgz)$/, ''), node: inner };
            }
            const pp = this.parentOf(this.normalize(vals.f));
            if (pp.err) { E(`tar: ${vals.f}: Cannot open: ${pp.err}`, 2); break; }
            if (!this.can(pp.parent, 2)) { E(`tar: ${vals.f}: Cannot open: Permission denied`, 2); break; }
            pp.parent.kids.set(pp.name, node);
            break;
          }
          const r = this.lookup(this.normalize(vals.f));
          if (r.err) { E(`tar: ${vals.f}: Cannot open: ${r.err}\ntar: Error is not recoverable: exiting now`, 2); break; }
          let arch = r.node;
          if (arch.gz) arch = arch.gz.node; else if (arch.bz) arch = arch.bz.node;
          if (!arch.tar) { E('tar: This does not look like a tar archive\ntar: Exiting with failure status due to previous errors', 2); break; }
          const wanted = rest.map(x => x.replace(/\/$/, ''));
          const sel = arch.tar.filter(e => !wanted.length || wanted.some(w => e.path.replace(/\/$/, '') === w || e.path.startsWith(w + '/')));
          wanted.forEach(w => { if (!arch.tar.some(e => e.path.replace(/\/$/, '') === w || e.path.startsWith(w + '/'))) E(`tar: ${w}: Not found in archive`, 2); });
          if (mode[0] === 't') {
            sel.forEach(e => {
              out += V ? `${modeStr(e.node.t, e.node.mode)} ${e.node.owner}/${e.node.group} ${String(e.node.t === 'd' ? 0 : sizeOf(e.node)).padStart(6)} 2026-09-28 14:02 ${e.path}\n` : e.path + '\n';
            });
            break;
          }
          const base = vals.C ? this.normalize(vals.C) : this.cwd;
          if (vals.C) { const rc = this.lookup(base); if (rc.err || rc.node.t !== 'd') { E(`tar: ${vals.C}: Cannot open: No such file or directory`, 2); break; } }
          sel.forEach(e => {
            const parts = this.normalize(e.path.replace(/\/$/, ''), base);
            let cur = this.root;
            for (let i = 0; i < parts.length - 1; i++) {
              let nx = cur.kids.get(parts[i]);
              if (!nx) { if (!this.can(cur, 2)) { E(`tar: ${e.path}: Cannot open: Permission denied`); return; } nx = this.newNode(cur, 'd'); cur.kids.set(parts[i], nx); }
              cur = nx;
            }
            if (!this.can(cur, 2)) { E(`tar: ${e.path}: Cannot open: Permission denied`); return; }
            const name0 = parts[parts.length - 1];
            if (e.node.t === 'd') { if (!cur.kids.has(name0)) { const d = clone(e.node); d.kids = new Map(); d.owner = this.eff(); cur.kids.set(name0, d); } }
            else { const f = clone(e.node); f.owner = this.eff(); cur.kids.set(name0, f); }
            if (V) out += e.path + '\n';
          });
          break;
        }
        case 'zip': case 'unzip': hint = `${name} existe sur un vrai système (zip -r archive.zip dossier ; unzip archive.zip). Dans ce terminal simulé, entraîne-toi avec tar et gzip.`; break;
        case 'od': {
          let a = args.slice(), type = 'o2';
          const ti = a.indexOf('-t');
          if (ti >= 0) { type = a[ti + 1]; a.splice(ti, 2); }
          if (a.includes('-c')) { type = 'c'; a = a.filter(x => x !== '-c'); }
          if (a.includes('-b')) { type = 'o1'; a = a.filter(x => x !== '-b'); }
          if (a.includes('-x')) { type = 'x2'; a = a.filter(x => x !== '-x'); }
          let bytes = [];
          if (a.length) {
            const r = this.lookup(this.normalize(a[0]));
            if (r.err) { E(`od: ${a[0]}: ${r.err}`); break; }
            if (!this.can(r.node, 4)) { E(`od: ${a[0]}: Permission denied`); break; }
            bytes = r.node.gz || r.node.bin || r.node.tar ? encode(garble(a[0], 32), 'latin1') : encode(r.node.data, r.node.enc);
          } else bytes = utf8(stdin || '');
          const ESC = { 0: '\\0', 7: '\\a', 8: '\\b', 9: '\\t', 10: '\\n', 11: '\\v', 12: '\\f', 13: '\\r' };
          const cell = b => {
            if (type === 'c') return (ESC[b] || (b >= 32 && b < 127 ? String.fromCharCode(b) : b.toString(8).padStart(3, '0'))).padStart(4);
            if (type === 'x1') return ' ' + b.toString(16).padStart(2, '0');
            if (type === 'u1') return String(b).padStart(4);
            if (type === 'd1') return String(b > 127 ? b - 256 : b).padStart(5);
            if (type === 'o1') return ' ' + b.toString(8).padStart(3, '0');
            return null;
          };
          const off = i => i.toString(8).padStart(7, '0');
          if (!['c', 'x1', 'u1', 'd1', 'o1'].includes(type)) {   // par défaut : mots de 2 octets en octal
            for (let i = 0; i < bytes.length; i += 16) {
              let row = off(i);
              for (let k = i; k < Math.min(i + 16, bytes.length); k += 2) row += ' ' + ((bytes[k + 1] || 0) << 8 | bytes[k]).toString(type[0] === 'x' ? 16 : 8).padStart(type[0] === 'x' ? 4 : 6, '0');
              out += row + '\n';
            }
          } else for (let i = 0; i < bytes.length; i += 16) out += off(i) + bytes.slice(i, i + 16).map(cell).join('') + '\n';
          out += off(bytes.length) + '\n';
          break;
        }
        case 'iconv': {
          const { vals, rest } = S(args, 'fto');
          if (args.includes('-l')) { out = 'ASCII, ISO-8859-1 (LATIN1), ISO-8859-15, UTF-8, WINDOWS-1252 (et bien d\'autres sur un vrai système)\n'; break; }
          const from = ENC_NAMES[noAcc(vals.f || '').replace(/\/\/.*$/, '')], to = ENC_NAMES[noAcc(vals.t || '').replace(/\/\/.*$/, '')];
          if (!vals.f || !vals.t) { E('iconv: il faut -f ENCODAGE_ORIGINE et -t ENCODAGE_VOULU'); break; }
          if (!from) { E(`iconv: conversion from '${vals.f}' is not supported`); break; }
          if (!to) { E(`iconv: conversion to '${vals.t}' is not supported`); break; }
          let bytes;
          if (rest.length) {
            const r = this.lookup(this.normalize(rest[0]));
            if (r.err) { E(`iconv: cannot open input file \`${rest[0]}': ${r.err}`); break; }
            if (!this.can(r.node, 4)) { E(`iconv: cannot open input file \`${rest[0]}': Permission denied`); break; }
            bytes = encode(r.node.data, r.node.enc);
          } else bytes = utf8(stdin || '');
          const d = decode(bytes, from);
          if (d.bad != null) { E(`iconv: illegal input sequence at position ${d.bad}`); break; }
          if (to === 'ascii' && /[^\x00-\x7f]/.test(d.text) && !/translit/i.test(vals.t)) { const pos = utf8(d.text.slice(0, d.text.search(/[^\x00-\x7f]/))).length; E(`iconv: cannot convert\niconv: unable to convert at position ${pos}`); break; }
          let text = d.text;
          if (to === 'ascii') text = text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x00-\x7f]/g, '?');
          const enc = to === 'latin1' ? 'latin1' : null;
          if (vals.o) { const e = this.writeFile(vals.o, 'write', text, enc); if (e) E(`iconv: cannot open output file: ${e}`); }
          else { out = text; outEnc = enc; }
          break;
        }
        case 'javac': {
          const files = args.filter(a => !a.startsWith('-'));
          if (!files.length) { E('error: no source files'); code = 2; break; }
          files.forEach(t => {
            if (!t.endsWith('.java')) { E(`error: Class names, '${t}', are only accepted if annotation processing is explicitly requested\n1 error`, 2); return; }
            const r = this.lookup(this.normalize(t));
            if (r.err) { E(`error: file not found: ${t}\nUsage: javac <options> <source files>\nuse --help for a list of possible options`, 2); return; }
            if (!this.can(r.node, 4)) { E(`error: error reading ${t}; ${t} (Permission denied)`, 2); return; }
            const src = r.node.data, base = t.split('/').pop().slice(0, -5);
            const cls = (src.match(/public\s+class\s+(\w+)/) || src.match(/class\s+(\w+)/) || [])[1];
            if (!cls) { E(`${t}:1: error: class, interface, enum, or record expected\n1 error`); return; }
            if (/public\s+class/.test(src) && cls !== base) { E(`${t}:1: error: class ${cls} is public, should be declared in a file named ${cls}.java\npublic class ${cls} {\n       ^\n1 error`); return; }
            const ls = src.split('\n');
            const bad = ls.findIndex(l => /System\.(out|err)\.print(ln)?\(.*\)\s*$/.test(l.trim()) && !/;\s*$/.test(l.trim()));
            if (bad >= 0) { const col = ls[bad].trimEnd().length; E(`${t}:${bad + 1}: error: ';' expected\n${ls[bad].trimEnd()}\n${' '.repeat(col)}^\n1 error`); return; }
            const opens = (src.match(/\{/g) || []).length, closes = (src.match(/\}/g) || []).length;
            if (opens !== closes) { E(`${t}:${ls.length}: error: reached end of file while parsing\n1 error`); return; }
            const prints = [];
            src.replace(/System\.(out|err)\.(println|print)\("((?:[^"\\]|\\.)*)"\)/g, (_, fd, fn, s) => { prints.push({ fd: fd === 'err' ? 2 : 1, s: s.replace(/\\n/g, '\n').replace(/\\"/g, '"') + (fn === 'println' ? '\n' : '') }); });
            const pp = this.parentOf(this.normalize(t));
            if (!this.can(pp.parent, 2)) { E(`error: could not create ${cls}.class: Permission denied\n1 error`); return; }
            const n = this.newNode(pp.parent, 'f'); n.bin = { kind: 'class', prints, cls }; n.size = 420 + src.length;
            pp.parent.kids.set(cls + '.class', n);
          });
          break;
        }
        case 'java': {
          const t = args.filter(a => !a.startsWith('-'))[0];
          if (!t) { E('Usage: java [options] <mainclass> [args...]'); break; }
          if (t.endsWith('.class')) { E(`Error: Could not find or load main class ${t}\nCaused by: java.lang.ClassNotFoundException: ${t}`); hint = `Écris le nom de la classe sans .class : java ${t.slice(0, -6)}`; break; }
          let prints;
          if (t.endsWith('.java')) {
            const r = this.exec('javac', [t]);
            if (r.code) { err += r.err; code = 1; break; }
            const pp = this.parentOf(this.normalize(t));
            const cls = [...pp.parent.kids.entries()].find(([k, n]) => n.bin && n.bin.kind === 'class' && k === t.split('/').pop().replace('.java', '.class'));
            prints = cls ? cls[1].bin.prints : [];
            if (cls) pp.parent.kids.delete(cls[0]);
          } else {
            const r = this.lookup(this.normalize(t.replace(/\./g, '/') + '.class'));
            if (r.err || !r.node.bin || r.node.bin.kind !== 'class') { E(`Error: Could not find or load main class ${t}\nCaused by: java.lang.ClassNotFoundException: ${t}`); if (this.lookup(this.normalize(t + '.java')).node) hint = `Le fichier ${t}.java existe : compile-le d'abord avec javac ${t}.java`; break; }
            prints = r.node.bin.prints;
          }
          prints.forEach(p => { if (p.fd === 2) err += p.s; else out += p.s; });
          break;
        }
        case 'g++': case 'gcc': {
          const { vals, rest } = S(args.filter(a => !/^-W/.test(a) && a !== '-c' && a !== '-g'), 'o');
          if (!rest.length) { E(`${name}: fatal error: no input files\ncompilation terminated.`); break; }
          let prints = [];
          let ok = true;
          rest.forEach(t => {
            const r = this.lookup(this.normalize(t));
            if (r.err) { E(`${name}: error: ${t}: ${r.err}\n${name}: fatal error: no input files\ncompilation terminated.`); ok = false; return; }
            const src = r.node.data, ls = src.split('\n');
            const bad = ls.findIndex(l => /(cout|printf|return)\b.*[^;{}\s]\s*$/.test(l) && !l.trim().startsWith('//') && !l.trim().startsWith('#'));
            if (bad >= 0) { E(`${t}: In function 'int main()':\n${t}:${bad + 1}:${ls[bad].trimEnd().length + 1}: error: expected ';' before '${(ls[bad + 1] || '}').trim()[0] || '}'}' token\n${String(bad + 1).padStart(5)} | ${ls[bad]}`); ok = false; return; }
            src.replace(/cout\s*<<\s*"((?:[^"\\]|\\.)*)"(\s*<<\s*endl)?/g, (_, s, nl) => { prints.push({ fd: 1, s: s.replace(/\\n/g, '\n') + (nl ? '\n' : '') }); });
            src.replace(/printf\("((?:[^"\\]|\\.)*)"/g, (_, s) => { prints.push({ fd: 1, s: s.replace(/\\n/g, '\n') }); });
          });
          if (!ok) break;
          const outName = vals.o || 'a.out';
          const pp = this.parentOf(this.normalize(outName));
          if (pp.err || !this.can(pp.parent, 2)) { E(`/usr/bin/ld: cannot open output file ${outName}: Permission denied`); break; }
          const n = this.newNode(pp.parent, 'f'); n.mode = 0o777 & ~this.umask; n.bin = { kind: 'elf', prints }; n.size = 16400;
          pp.parent.kids.set(pp.name, n);
          break;
        }
        case 'astyle': hint = 'astyle (reformater un source) n\'est pas disponible ici. Sur la machine de TP : astyle --style=java Fichier.java'; break;
        case 'bash': case 'sh': {
          const t = args[0];
          if (!t) { hint = 'Simulé : bash sans argument ouvrirait un nouveau shell (exit pour en sortir).'; break; }
          const r = this.lookup(this.normalize(t));
          if (r.err) { E(`${name}: ${t}: ${r.err}`, 127); break; }
          if (!this.can(r.node, 4)) { E(`${name}: ${t}: Permission denied`, 126); break; }
          return this.runScript(r.node, this.normalize(t));
        }
        case 'ps': {
          const all = args.some(a => /e|aux|ax/.test(a));
          const mine = [{ pid: 2041, cmd: 'bash' }, ...this.jobs.map(j => ({ pid: j.pid, cmd: j.cmd.split(' ')[0], state: j.state }))];
          if (!all) {
            out = '    PID TTY          TIME CMD\n' + mine.concat([{ pid: this.nextPid++, cmd: 'ps' }]).map(p => `${String(p.pid).padStart(7)} pts/0    00:00:00 ${p.cmd}`).join('\n') + '\n';
            break;
          }
          const sys = [[1, 'root', '/sbin/init'], [312, 'root', '/lib/systemd/systemd-journald'], [598, 'root', '/usr/sbin/sshd -D'], [640, 'root', '/usr/sbin/cron -f'], [1873, 'etudiant', '/lib/systemd/systemd --user'], [1990, 'etudiant', 'xfce4-session'], [2040, 'etudiant', 'xfce4-terminal']];
          out = 'UID          PID    PPID  C STIME TTY          TIME CMD\n' + sys.map(([p, u, c]) => `${u.padEnd(8)} ${String(p).padStart(7)} ${String(p === 1 ? 0 : 1).padStart(7)}  0 14:02 ?        00:00:00 ${c}`).join('\n') + '\n' +
            mine.map(p => `etudiant ${String(p.pid).padStart(7)} ${String(p.pid === 2041 ? 2040 : 2041).padStart(7)}  0 14:05 pts/0    00:00:00 ${p.pid === 2041 ? 'bash' : this.jobs.find(j => j.pid === p.pid).cmd}`).join('\n') + '\n' +
            `etudiant ${String(this.nextPid++).padStart(7)}    2041  0 14:06 pts/0    00:00:00 ps ${args.join(' ')}\n`;
          break;
        }
        case 'sleep': {
          if (!args.length || !/^\d+(\.\d+)?$/.test(args[0])) { E('sleep: missing operand'); break; }
          if (+args[0] <= 2) break;
          return { busy: { cmd: 'sleep ' + args[0], pid: this.nextPid++ } };
        }
        case 'jobs': out = this.jobs.map((j, i) => `[${j.n}]${i === this.jobs.length - 1 ? '+' : i === this.jobs.length - 2 ? '-' : ' '}  ${j.state.padEnd(24)}${j.cmd}${j.state === 'Running' ? ' &' : ''}\n`).join(''); break;
        case 'fg': case 'bg': {
          const j = this.findJob(args[0]);
          if (!j) { E(`bash: ${name}: ${args[0] || 'current'}: no such job`); break; }
          if (name === 'bg') { if (j.state === 'Running') { E(`bash: bg: job ${j.n} already in background`); break; } j.state = 'Running'; out = `[${j.n}]+ ${j.cmd} &\n`; break; }
          this.jobs = this.jobs.filter(x => x !== j);
          out = j.cmd + '\n';
          return { out, busy: { cmd: j.cmd, pid: j.pid } };
        }
        case 'kill': {
          if (args[0] === '-l') { out = ' 1) SIGHUP\t 2) SIGINT\t 3) SIGQUIT\t 9) SIGKILL\n15) SIGTERM\t18) SIGCONT\t19) SIGSTOP\t20) SIGTSTP\n'; break; }
          const sig = args.find(a => /^-/.test(a));
          const targets = args.filter(a => !/^-/.test(a));
          if (!targets.length) { E('kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]'); break; }
          targets.forEach(t => {
            const j = t.startsWith('%') ? this.findJob(t) : this.jobs.find(x => String(x.pid) === t);
            if (!j) {
              if (/^\d+$/.test(t) && +t < 2041) { E(`bash: kill: (${t}) - Operation not permitted`); return; }
              if (t === '2041') { hint = 'Tu viens de demander à ton propre shell de s\'arrêter : dans un vrai terminal, bash ignore SIGTERM, mais kill -9 2041 fermerait le terminal.'; return; }
              E(t.startsWith('%') ? `bash: kill: ${t}: no such job` : `bash: kill: (${t}) - No such process`); return;
            }
            if (sig && /STOP|^-19$/.test(sig)) { j.state = 'Stopped'; out += `[${j.n}]+  Stopped                 ${j.cmd}\n`; return; }
            if (sig && /CONT|^-18$/.test(sig)) { j.state = 'Running'; return; }
            this.jobs = this.jobs.filter(x => x !== j);
            out += `[${j.n}]+  ${sig && /9|KILL/.test(sig) ? 'Killed' : 'Terminated'}              ${j.cmd}\n`;
          });
          break;
        }
        case 'ssh-keygen': {
          const sshDir = USERS[this.user].home + '/.ssh';
          if (!this.lookup(this.normalize(sshDir)).node) { this.exec('mkdir', [sshDir]); this.peek(sshDir).mode = 0o700; }
          const pub = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7' + garble(this.user, 40).replace(/[^A-Za-z0-9]/g, 'x') + ` ${this.user}@${HOST}\n`;
          this.writeFile(sshDir + '/id_rsa', 'write', '-----BEGIN OPENSSH PRIVATE KEY-----\n(clé privée simulée : ne jamais la partager)\n-----END OPENSSH PRIVATE KEY-----\n');
          this.peek(sshDir + '/id_rsa').mode = 0o600;
          this.writeFile(sshDir + '/id_rsa.pub', 'write', pub);
          this.peek(sshDir + '/id_rsa.pub').mode = 0o644;
          out = `Generating public/private rsa key pair.\nEnter file in which to save the key (${sshDir}/id_rsa): \nEnter passphrase (empty for no passphrase): \nEnter same passphrase again: \nYour identification has been saved in ${sshDir}/id_rsa\nYour public key has been saved in ${sshDir}/id_rsa.pub\n`;
          hint = 'Simulé : les questions ont reçu la réponse par défaut (Entrée). Regarde ls -l ~/.ssh : la clé privée est en 600.';
          break;
        }
        case 'ssh': case 'scp': case 'sftp': case 'rsync': case 'sshfs': case 'ssh-copy-id': case 'ftp': case 'rwho': case 'tmux': case 'screen':
          if (!args.length && name !== 'rwho' && name !== 'tmux') { E(`usage: ${MAN[name] ? MAN[name][1].split('\n')[0] : name + ' ...'}`); break; }
          hint = `${name} : ce terminal simulé n'a pas de réseau, la commande n'est pas exécutée. Sa syntaxe est expliquée dans la leçon « Travailler à distance » (et dans man ${MAN[name] ? name : 'ssh'}).`;
          break;
        case 'ccrypt': case 'openssl': case 'gpg':
          hint = `${name} n'est pas simulé (il demande un mot de passe de façon interactive). Sa syntaxe est expliquée dans la leçon « Chiffrer ses données ».`;
          break;
        case 'nano': case 'vim': case 'vi': case 'code': case 'gedit': case 'geany': case 'emacs':
          hint = `${name} ouvrirait un éditeur${['nano', 'vim', 'vi'].includes(name) ? ' dans le terminal' : ' dans une fenêtre'}. Ici, pas d'éditeur : écris dans un fichier avec echo "texte" > fichier (ou >> pour ajouter une ligne).`;
          break;
        case 'evince': case 'xdg-open': case 'firefox': case 'eog':
          if (!args.length) { E(`${name}: missing argument`); break; }
          if (!this.lookup(this.normalize(args[0])).node && !/^https?:/.test(args[0])) { E(`${name}: ${args[0]}: No such file or directory`); break; }
          hint = `${name} ouvrirait ${args[0]} dans une fenêtre graphique (visionneuse par défaut pour xdg-open, lecteur PDF pour evince).`;
          break;
        default: {
          if (name.includes('/')) {
            const parts = this.normalize(name);
            const r = this.lookup(parts);
            if (r.err) { E(`bash: ${name}: ${r.err}`, 127); break; }
            if (r.node.t === 'd') { E(`bash: ${name}: Is a directory`, 126); break; }
            if (!this.can(r.node, 1)) { E(`bash: ${name}: Permission denied`, 126); break; }
            if (r.node.bin && r.node.bin.kind === 'elf' && !r.node.bin.prints) return this.exec(parts[parts.length - 1], args, stdin);
            if (r.node.bin && r.node.bin.kind === 'elf') {
              this.ranScript.add(this.pathOf(parts));
              (r.node.bin.prints || []).forEach(p => { if (p.fd === 2) err += p.s; else out += p.s; });
              break;
            }
            if (r.node.bin) { E(`bash: ${name}: cannot execute binary file: Exec format error`, 126); break; }
            if (!this.can(r.node, 4)) { E(`bash: ${name}: Permission denied`, 126); break; }
            return this.runScript(r.node, parts);
          }
          const sugg = KNOWN.find(k => near(name, k));
          if (BIN.includes(name) || USRBIN.includes(name)) { hint = `${name} existe sur un vrai système mais n'est pas simulé ici. Tape help pour la liste.`; break; }
          E(`bash: ${name}: command not found`, 127);
          if (sugg) hint = `Faute de frappe ? Tu voulais peut-être taper « ${sugg} ».`;
        }
      }
      return { out, err, code, hint, outEnc };
    }

    runScript(node, parts) {
      this.ranScript.add(this.pathOf(parts));
      let out = '', err = '', code = 0;
      const saved = { cwd: this.cwd, prev: this.prev };   // un script tourne dans un sous-shell : son cd ne change pas le nôtre
      node.data.split('\n').forEach(l => {
        if (!l.trim() || l.trim().startsWith('#')) return;
        const r = this.run(l, { inner: true });
        out += r.out; err += r.err;
        code = this.vars['?'];
      });
      this.cwd = saved.cwd; this.prev = saved.prev;
      return { out, err, code };
    }

    copyNode(src, parent, name, label, keep) {
      const me = this.eff();
      if (src.t === 'f' || src.t === 'l') {
        if (!this.can(src, 4)) return `cp: cannot open '${label}' for reading: Permission denied\n`;
        const ex = parent.kids.get(name);
        const f = clone(src);
        if (!keep) { f.owner = me; f.group = USERS[me].gid; f.mode = src.mode & ~this.umask & 0o777; f.mtime = this.now(); delete f.acl; }
        if (ex && ex.t === 'f') { if (!this.can(ex, 2)) return `cp: cannot create regular file '${label}': Permission denied\n`; if (!keep) { f.mode = ex.mode; f.owner = ex.owner; f.group = ex.group; } }
        parent.kids.set(name, f);
        return '';
      }
      if (!this.can(src, 4) || !this.can(src, 1)) return `cp: cannot access '${label}': Permission denied\n`;
      let d = parent.kids.get(name);
      if (!d) { d = mkDir(keep ? src.mode : src.mode & ~this.umask & 0o777, keep ? src.owner : me, keep ? src.group : USERS[me].gid); d.mtime = keep ? src.mtime : this.now(); if (keep && src.acl) d.acl = JSON.parse(JSON.stringify(src.acl)); parent.kids.set(name, d); }
      let problem = '';
      src.kids.forEach((k, kn) => { problem += this.copyNode(k, d, kn, label + '/' + kn, keep); });
      return problem;
    }

    /* Complétion (touche TAB) : renvoie { line, options } */
    complete(line) {
      const m = line.match(/^(.*?)([^\s|;&<>]*)$/);
      const before = m[1], word = m[2];
      const isCmd = !before.trim() || /[|;&]\s*$/.test(before) || /^\s*sudo\s+$/.test(before);
      let cands;
      if (isCmd && !word.includes('/')) cands = [...new Set(KNOWN.concat(Object.keys(MAN)))].filter(k => k.startsWith(word)).sort();
      else {
        const i = word.lastIndexOf('/');
        const dirPart = i >= 0 ? word.slice(0, i + 1) : '', base = i >= 0 ? word.slice(i + 1) : word;
        const r = this.lookup(this.normalize(dirPart || '.'));
        if (!r.node || r.node.t !== 'd' || !this.can(r.node, 4)) return { line, options: [] };
        cands = [...r.node.kids.entries()].filter(([k]) => k.startsWith(base) && (base.startsWith('.') || !k.startsWith('.'))).map(([k, n]) => dirPart + k + (n.t === 'd' ? '/' : '')).sort();
      }
      if (!cands.length) return { line, options: [] };
      if (cands.length === 1) return { line: before + cands[0] + (cands[0].endsWith('/') ? '' : ' '), options: [] };
      let pre = cands[0];
      cands.forEach(c => { while (!c.startsWith(pre)) pre = pre.slice(0, -1); });
      return { line: before + pre, options: cands.map(c => c.replace(/^.*\/(?=.)/, '')) };
    }
  }

  return { Shell, modeStr, symStr, octStr, rwx, applyMode, validMode, globMatch, utf8, encode, decode, asTerminal, strip, M, MAN, USERS, GROUPS, ROOST };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Sh;
