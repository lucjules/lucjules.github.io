/* Contenu du cours — arith. Écrit avec les outils de lib.js (formules $…$, boîtes bDef/bThm/…, quick, demo, Q, C, X). */
COURS.arith = {
id: 'arith', nom: 'Arithmétique dans ℤ', page: 'arithmetique.html', partie: 'Partie II', titre: 'Arithmétique dans ℤ',
hero: 'Dividendes, premiers, PGCD et congruences : l’arithmétique de l’informaticien',
lead: 'Sept chapitres, de la division euclidienne aux restes chinois : tu y retrouves ce qui se cache derrière le modulo, le hachage et la cryptographie.',
outils: ['div', 'fact', 'sieve', 'pgcd', 'dio', 'clock', 'cong'],
pieges: [
  ['Le reste en C et en Java', '<code>-113 % 8</code> vaut −1 en C, 7 en Python. La division euclidienne exige $0 ≤ r < b$.'],
  ['1 n’est pas premier', 'Un premier a <b>exactement deux</b> diviseurs positifs. 1 n’en a qu’un, et 2 est le seul premier pair.'],
  ['0 n’est jamais un diviseur', '0 est multiple de tout entier, mais on ne divise jamais par 0.'],
  ['PGCD et PPCM par les exposants', 'PGCD : le <b>min</b> des exposants ; PPCM : le <b>max</b>. Ne les échange pas.'],
  ['Gauss sans PGCD = 1', 'Le lemme de Gauss exige $PGCD(a, b) = 1$ : $6 | 4 × 3$ mais $6 ∤ 3$.'],
  ['Congruence sans PGCD', '$ax ≡ b (n)$ n’a de solution que si $PGCD(a, n)$ divise $b$.']
],
chapitres: [
{
id: 'a1', court: 'Division et divisibilité', titre: 'Division euclidienne et divisibilité', duree: '1 h 30',
resume: 'Quotient et reste, diviseurs et multiples, propriétés de la divisibilité, critères usuels, parité.',
intro: 'Diviser, c’est la première opération de l’arithmétique… et celle que les langages de programmation traitent <b>différemment</b> pour les nombres négatifs. On pose ici le vocabulaire et les propriétés sur lesquels tout le reste du cours repose.',
objectifs: [
  'effectuer une <b>division euclidienne</b> dans $ℤ$, y compris pour un dividende négatif ;',
  'connaître la différence entre Python et C/Java pour <code>/</code> et <code>%</code> ;',
  'utiliser la définition de « $b$ divise $a$ » et ses propriétés (transitivité, combinaison linéaire) ;',
  'appliquer les <b>critères de divisibilité</b> par 2, 3, 4, 5, 9 et 11 ;',
  'raisonner sur la <b>parité</b> par disjonction de cas.'
],
prerequis: ['Les quantificateurs $∀$, $∃$, $∃!$ (logique, chapitre 1).', 'Les ensembles de nombres $ℕ$ et $ℤ$.'],
sections: [
{ t: 'Division euclidienne dans ℤ', h: `
<p>Quand tu divises 185 par 31, tu obtiens un quotient entier (5) <b>et un reste</b> (30). La division euclidienne rend cela précis, y compris pour les nombres négatifs.</p>
${bDef('Division euclidienne', `<p>Soient $a ∈ ℤ$ et $b ∈ ℕ^*$. Il existe un <b>unique</b> couple $(q, r) ∈ ℤ × ℕ$ tel que :</p>$$a = bq + r avec 0 ≤ r < b$$
<p>Avec les quantificateurs : $∃!(q, r) ∈ ℤ × ℕ, (a = bq + r ∧ 0 ≤ r < b)$. On appelle $a$ le <b>dividende</b>, $b$ le <b>diviseur</b>, $q$ le <b>quotient</b> et $r$ le <b>reste</b>.</p>`)}
${bProp('Calcul avec la partie entière', `<p>Pour $b > 0$ : $q = ⌊frac{a}{b}⌋$ et $r = a - b⌊frac{a}{b}⌋$ (la partie entière $⌊x⌋$ est le plus grand entier $≤ x$).</p>
${bEx('a = −113 et b = 8', `<p>$frac{-113}{8} = -14{,}125$ et $⌊-14{,}125⌋ = -15$ (le plus grand entier inférieur ou égal à $-14{,}125$, <b>pas</b> $-14$). Donc $q = -15$ et</p>$$r = -113 - 8 × (-15) = 7 ;; donc −113 = 8 × (−15) + 7$$<p>Le reste est <b>toujours positif</b>, et $0 ≤ 7 < 8$ ✓.</p>`)}`)}
${bInfo('Python, C et Java ne font pas pareil !', `<ul><li><b>Python</b> (<code>//</code> et <code>%</code>) respecte la définition mathématique : <code>-113 // 8</code> vaut <code>-15</code> et <code>-113 % 8</code> vaut <code>7</code>.</li>
<li><b>C, C++, Java</b> (<code>/</code> et <code>%</code>) <b>tronquent vers zéro</b> : <code>-113 / 8</code> vaut <code>-14</code> et <code>-113 % 8</code> vaut <code>-1</code>, un reste négatif.</li></ul><p>Pour un dividende positif, les deux conventions coïncident. Retiens : en maths, le reste vérifie toujours $0 ≤ r < b$.</p>`)}
${demo('div', { dvA: '-113', dvB: '8' }, 'Division euclidienne : essaie d’autres valeurs')}
${quick('Quel est le reste de la division euclidienne de $-17$ par $5$ ?', '3', '$-17 = 5 × (-4) + 3$ avec $0 ≤ 3 < 5$ : le quotient est $-4$ et le reste $3$.', 'Cherche le plus grand multiple de 5 qui soit inférieur ou égal à $-17$.')}` },

{ t: 'Divisibilité : définition et premières remarques', h: `
${bDef('Divisibilité', `<p>Un entier $b ∈ ℤ^*$ est un <b>diviseur</b> d’un entier $a ∈ ℤ$ (ou $a$ est un <b>multiple</b> de $b$) s’il existe un entier $q ∈ ℤ$ tel que $a = bq$. On écrit :</p>$$b | a ⇔ ∃q ∈ ℤ, a = bq$$`)}
${bRem('Remarques fondamentales', `<ul><li>$0$ est multiple de tout entier $a$, car $0 = 0 × a$. Mais $0$ n’est <b>jamais</b> un diviseur (on ne divise pas par 0).</li>
<li>$1$ et $-1$ divisent tout entier $a$, car $a = a × 1$.</li><li>Si $b | a$ et $a ≠ 0$, alors $|a| ≥ |b|$ : un diviseur ne peut pas être plus grand que le nombre qu’il divise.</li></ul>`)}
${bEx('Diviseurs de 30', `<p>Dans $ℕ$ : $1, 2, 3, 5, 6, 10, 15, 30$ (8 diviseurs). Dans $ℤ$ : ces huit nombres et leurs opposés, soit <b>16 diviseurs</b>.</p>`)}
${bMeth('Trouver tous les diviseurs positifs de n', '<p>Teste les entiers de 1 jusqu’à $sqrt{n}$ : chaque diviseur $d$ trouvé donne aussi le diviseur « jumeau » $frac{n}{d}$. Pour 30, $sqrt{30} ≈ 5{,}5$ : $1 ↔ 30$, $2 ↔ 15$, $3 ↔ 10$, $5 ↔ 6$.</p>')}
${quick('Le nombre $0$ divise-t-il $84$ ? (oui ou non)', 'non', 'Un diviseur est toujours non nul : $84 = 0 × q$ est impossible. On ne divise jamais par 0.')}` },

{ t: 'Propriétés de la divisibilité', h: `
${bProp('Propriétés algébriques', `<p>Soient $a$, $b$, $c$ des entiers relatifs.</p><ol>
<li><b>Transitivité</b> : si $a | b$ et $b | c$, alors $a | c$.</li>
<li><b>Combinaison linéaire</b> : si $a | b$ et $a | c$, alors $a | ub + vc$ pour tous entiers $u, v ∈ ℤ$.</li>
<li><b>Divisibilité mutuelle</b> : si $a | b$ et $b | a$, alors $a = b$ ou $a = -b$.</li></ol>`)}
${bProof('les trois propriétés', `<ol><li>$b = ak$ et $c = bl$ donnent $c = a(kl)$ : $a | c$.</li>
<li>$b = ak$ et $c = al$ donnent $ub + vc = a(uk + vl)$ : $a | ub + vc$.</li>
<li>$b = ak$ et $a = bl$ donnent $a = a·kl$. Si $a ≠ 0$ on simplifie : $kl = 1$, donc $k = l = 1$ ou $k = l = -1$, c’est-à-dire $b = a$ ou $b = -a$. (Si $a = 0$, alors $b = 0$ aussi.)</li></ol>`)}
${bMeth('La combinaison linéaire, ton outil n°1', `<p>Pour montrer qu’un entier $d$ divise un nombre « compliqué », <b>fabrique</b> une combinaison de deux nombres que $d$ divise, qui donne un résultat simple. Exemple : si $d | 12n + 7$ et $d | 3n + 1$, alors $d | (12n + 7) - 4(3n + 1) = 3$.</p>`)}
${bEx('Une conséquence immédiate', `<p>Si $a | b$ et $a | c$, alors $a$ divise la somme $b + c$ et la différence $b - c$ (prendre $u = v = 1$, puis $u = 1, v = -1$).</p>`)}` },

{ t: 'Critères de divisibilité usuels', h: `
<p>Pour savoir si un grand nombre est divisible par 2, 3, 4, 5, 9 ou 11 <b>sans calculatrice</b>, on regarde ses chiffres :</p>
${tt(['Diviseur', 'Critère'], [['2', 'le dernier chiffre est pair'], ['3', 'la somme de ses chiffres est divisible par 3'], ['4', 'le nombre formé par ses deux derniers chiffres l’est'], ['5', 'le dernier chiffre est 0 ou 5'], ['9', 'la somme de ses chiffres est divisible par 9'], ['11', 'la différence entre la somme des chiffres de rangs pairs et celle des chiffres de rangs impairs est divisible par 11']], { raw: true, plain: true })}
${bProof('les critères par 3 et par 9', `<p>Pour tout $m ≥ 1$ : $10^m - 1 = 99…9$ ($m$ chiffres) $= 9 × 11…1$. Chaque puissance de 10 privée de 1 est donc un multiple de 9.</p>
<p>Soit $N = a_n 10^n + … + a_1 10 + a_0$ et $S = a_n + … + a_1 + a_0$ la somme de ses chiffres. Alors</p>$$N - S = a_n(10^n - 1) + … + a_1(10 - 1) = 9K$$
<p>Donc $N = 9K + S$ : $N$ a le <b>même reste</b> que $S$ dans la division par 9, et aussi par 3 (car $3 | 9$). ∎</p>`)}
${bEx('4685368545', `<ul><li>Somme des chiffres : $4+6+8+5+3+6+8+5+4+5 = 54$, divisible par 3 et par 9 ✓.</li><li>Dernier chiffre 5 : divisible par 5 ✓.</li>
<li>Par 11 : en lisant de droite à gauche, la somme alternée $5 - 4 + 5 - 8 + 6 - 3 + 5 - 8 + 6 - 4 = 0$ est divisible par 11 ✓.</li></ul>`)}
${quick('Le nombre $729$ est-il divisible par $9$ ? (oui ou non)', 'oui', '$7 + 2 + 9 = 18$, qui est divisible par 9 : donc 729 l’est (et $729 = 9 × 81$).')}` },

{ t: 'Parité et applications', h: `
<p>Un entier est <b>pair</b> s’il s’écrit $2k$, <b>impair</b> s’il s’écrit $2k + 1$ ($k ∈ ℤ$). Beaucoup de preuves se font par <b>disjonction de cas</b> : on traite à part le cas pair et le cas impair.</p>
${bMeth('Discuter selon la parité', `${steps(['Écris : « soit $n$ pair, $n = 2k$ » puis « soit $n$ impair, $n = 2k + 1$ ».', 'Développe l’expression dans chaque cas et <b>factorise</b> un 2 (ou un 4, un 8…).', 'Conclus dans chaque cas, puis pour tous les $n$.'])}`)}
${bEx('Le produit n(n + 1) est pair', `<p>$n$ et $n + 1$ sont deux entiers <b>consécutifs</b> : l’un des deux est pair, donc leur produit est pair. Par cas : si $n = 2k$, $n(n+1) = 2k(2k+1)$ est pair ; si $n = 2k+1$, $n(n+1) = (2k+1)(2k+2) = 2(2k+1)(k+1)$ est pair.</p>`)}
${bEx('Reste de n² dans la division par 4', `<ul><li>$n = 2k$ : $n^2 = 4k^2$, reste <b>0</b>.</li><li>$n = 2k + 1$ : $n^2 = 4k^2 + 4k + 1 = 4k(k+1) + 1$, reste <b>1</b>.</li></ul><p>Un carré parfait est donc toujours de la forme $4m$ ou $4m + 1$ : jamais $4m + 2$ ni $4m + 3$.</p>`)}
${bEx('n² − 1', `<p>Pour $n$ pair, $n^2 - 1$ est « pair moins 1 » donc <b>impair</b>. Pour $n$ impair, $n = 2k + 1$ : $n^2 - 1 = 4k(k + 1)$ ; comme $k(k+1)$ est pair, $n^2 - 1$ est divisible par <b>8</b>.</p>`)}` }
],
retenir: [
  '<b>Division euclidienne</b> : $a = bq + r$ avec $0 ≤ r < b$ ; le couple $(q, r)$ est unique ; $q = ⌊frac{a}{b}⌋$.',
  'Pour $a < 0$ : $-113 = 8 × (-15) + 7$ en maths et en Python ; C et Java donnent un quotient tronqué ($-14$) et un reste négatif ($-1$).',
  '$b | a ⇔ ∃q ∈ ℤ, a = bq$ ; $0$ est multiple de tout entier mais jamais diviseur ; $1$ et $-1$ divisent tout.',
  'Transitivité ; si $a | b$ et $a | c$, alors $a | ub + vc$ ; si $a | b$ et $b | a$, alors $a = ±b$.',
  'Critères : 2 (dernier chiffre pair), 3 et 9 (somme des chiffres), 4 (deux derniers chiffres), 5 (finit par 0 ou 5), 11 (somme alternée).',
  'Parité : $n = 2k$ ou $n = 2k + 1$ ; $n(n+1)$ est pair ; $n^2$ a pour reste 0 ou 1 modulo 4.'
],
pieges: [
  ['Le reste en C et en Java', '<code>-113 % 8</code> vaut −1 en C et en Java, 7 en Python. La division euclidienne exige $0 ≤ r < b$.'],
  ['0 n’est jamais un diviseur', '0 est multiple de tout entier, mais on ne divise jamais par 0.'],
  ['Partie entière d’un négatif', '$⌊-14{,}125⌋ = -15$, pas $-14$ : on prend le plus grand entier <b>inférieur ou égal</b>.']
],
quiz: [
  Q('La division euclidienne de −113 par 8 donne…', ['q = −15 et r = 7', 'q = −14 et r = −1', 'q = −14 et r = 7', 'q = −15 et r = −7'], 'Le reste doit vérifier 0 ≤ r < 8 : −113 = 8 × (−15) + 7.'),
  Q('En C ou Java, que renvoie -113 % 8 ?', ['−1', '7', '1', '−7'], 'C et Java tronquent le quotient vers zéro (−14) : −113 = 8 × (−14) + (−1).'),
  Q('Quel est le reste de 12n + 7 dans la division par 3 (n ∈ ℤ) ?', ['1', '0', '2', 'cela dépend de n'], '12n + 7 = 3(4n + 2) + 1, avec 0 ≤ 1 < 3.'),
  Q('Combien 30 a-t-il de diviseurs dans ℤ ?', ['16', '8', '15', '30'], 'Dans ℕ : 1, 2, 3, 5, 6, 10, 15, 30 (8). Dans ℤ, on ajoute leurs opposés : 16.'),
  Q('Parmi 0, 1, −7 et 13, lesquels divisent 84 ?', ['1 et −7', '0, 1 et −7', '1, −7 et 13', 'tous'], '0 n’est jamais un diviseur ; 84 = (−7) × (−12) ; 84 = 13 × 6 + 6 donc 13 ne divise pas 84.'),
  Q('4685368545 est divisible par…', ['3, 5, 9 et 11', 'seulement 3 et 5', '3, 5 et 9 mais pas 11', '2, 3 et 5'], 'Somme des chiffres 54 (3 et 9), finit par 5, somme alternée 0 (11).'),
  Q('On divise n par 137 et par 143 : mêmes quotients, restes 131 et 5. Que vaut n ?', ['3008', '2877', '3003', '2882'], '137q + 131 = 143q + 5 donne 6q = 126, q = 21 et n = 137 × 21 + 131 = 3008.'),
  Q('Si a | b et a | c, alors a divise toujours…', ['3b − 2c', 'b × c + 1', 'b + c + 1', 'b / c'], 'Combinaison linéaire : a | ub + vc pour tous entiers u et v (ici u = 3, v = −2).'),
  Q('Que vaut le reste de n² dans la division par 4 ?', ['0 ou 1', '0, 1 ou 2', '1 ou 3', 'toujours 0'], 'n = 2k donne 4k² (reste 0) ; n = 2k + 1 donne 4k(k + 1) + 1 (reste 1).'),
  Q('Pour n impair, n² − 1 est toujours divisible par…', ['8', '16', '3', '5'], 'n = 2k + 1 donne n² − 1 = 4k(k + 1), et k(k + 1) est pair : 8 divise n² − 1.')
],
cartes: [
  C('Division euclidienne de a par b', 'a = bq + r avec 0 ≤ r < b (b > 0)\nLe couple (q, r) est unique.\nq = ⌊a/b⌋'),
  C('Division euclidienne de −113 par 8', '−113 = 8 × (−15) + 7\nq = −15, r = 7 (le reste est positif).'),
  C('Python vs C pour −113 % 8', 'Python : 7 (définition mathématique)\nC / Java : −1 (troncature vers zéro).'),
  C('Définition : b divise a', 'Il existe q ∈ ℤ tel que a = bq.\n0 n’est jamais diviseur ; 0 est multiple de tout entier.'),
  C('Trois propriétés de la divisibilité', 'Transitivité ; combinaison linéaire (a | b et a | c ⇒ a | ub + vc) ; a | b et b | a ⇒ a = ±b.'),
  C('Critères par 3 et par 9', 'Somme des chiffres divisible par 3 (resp. 9).'),
  C('Critère par 11', '(somme des chiffres de rang pair) − (somme de rang impair) divisible par 11.'),
  C('Critère par 4', 'Les deux derniers chiffres forment un multiple de 4.'),
  C('Reste de n² modulo 4', '0 si n pair, 1 si n impair.'),
  C('n(n + 1) est toujours…', 'pair : deux entiers consécutifs dont l’un est pair.')
],
exos: [
X('Exercice 1', { id: 'a1-1', niv: 1, src: 'TD', q: `<ol><li>Écrire la division euclidienne de $185$ par $31$ en posant la division.</li><li>Écrire la division euclidienne de $-113$ par $8$. (Attention au signe du reste !)</li><li>Sachant que $12079233 = 75968 × 159 + 321$, déterminer le reste de la division euclidienne de $12079233$ par $75968$, puis par $159$.</li><li>Soit $n ∈ ℤ$. Quel est le reste de la division euclidienne de $12n + 7$ par $3$ ?</li><li>On effectue la division euclidienne d’un entier $n$ par $137$ et $143$. Les quotients sont égaux et les restes respectifs sont $131$ et $5$. Quel est cet entier $n$ ?</li></ol>`,
indice: 'Pour la question 3, il faut que le « reste » annoncé soit strictement plus petit que le diviseur choisi. Pour la 5, appelle $q$ le quotient commun et écris deux égalités.',
meth: '1–2 : $a = bq + r$ avec $0 ≤ r < b$. 3 : vérifie $r < b$ ; sinon, divise encore le reste. 4 : factorise un 3. 5 : égalise $137q + 131 = 143q + 5$.',
s: `<ol><li>$31 × 5 = 155$ et $185 - 155 = 30 < 31$ : <b>$185 = 31 × 5 + 30$</b> (quotient 5, reste 30).</li>
<li>$⌊-113/8⌋ = ⌊-14{,}125⌋ = -15$, donc $r = -113 - 8 × (-15) = 7$ : <b>$-113 = 8 × (-15) + 7$</b>.</li>
<li><b>Par 75968</b> : l’égalité $12079233 = 75968 × 159 + 321$ est déjà une division euclidienne puisque $0 ≤ 321 < 75968$ : le reste est <b>321</b>.<br><b>Par 159</b> : comme $159 | 75968 × 159$, il reste à diviser 321 par 159 : $321 = 159 × 2 + 3$. Donc $12079233 = 159 × (75968 + 2) + 3 = 159 × 75970 + 3$, avec $0 ≤ 3 < 159$ : le reste est <b>3</b>.</li>
<li>$12n + 7 = 3(4n + 2) + 1$ avec $0 ≤ 1 < 3$ : le reste est <b>1</b>, quel que soit $n ∈ ℤ$.</li>
<li>$n = 137q + 131 = 143q + 5$ donne $6q = 126$, soit $q = 21$. Alors $n = 137 × 21 + 131 = 3008$. <b>Contrôle</b> : $143 × 21 + 5 = 3003 + 5 = 3008$ ✓, et $131 < 137$, $5 < 143$.</li></ol>` }),

X('Exercice 2', { id: 'a1-2', niv: 1, src: 'TD', q: `<ol><li>Faire la liste de tous les diviseurs de $30$ dans $ℕ$, puis dans $ℤ$.</li><li>Donner un multiple de $11$ composé de $5$ chiffres.</li><li>Les entiers $0$, $1$, $-7$ et $13$ sont-ils des diviseurs de $84$ ? Justifier.</li></ol>`,
indice: 'Teste les entiers de 1 à 5 (car $sqrt{30} ≈ 5{,}5$) et note les « jumeaux ». Pour la question 3, applique la définition : existe-t-il $q ∈ ℤ$ avec $84 = bq$ ?',
meth: 'Définition : $b | a ⇔ ∃q ∈ ℤ, a = bq$ (avec $b ≠ 0$).',
s: `<ol><li>Dans $ℕ$ : $1, 2, 3, 5, 6, 10, 15, 30$ (paires $1·30$, $2·15$, $3·10$, $5·6$). Dans $ℤ$ : les mêmes et leurs opposés : $±1, ±2, ±3, ±5, ±6, ±10, ±15, ±30$ (16 diviseurs).</li>
<li>Par exemple $11 × 1000 = 11000$, ou $11 × 910 = 10010$ : tous deux ont 5 chiffres.</li>
<li>• $0$ : <b>non</b>, un diviseur est toujours non nul.<br>• $1$ : <b>oui</b>, $84 = 1 × 84$.<br>• $-7$ : <b>oui</b>, $84 = (-7) × (-12)$.<br>• $13$ : <b>non</b>, $84 = 13 × 6 + 6$ avec un reste non nul.</li></ol>` }),

X('Exercice 3', { id: 'a1-3', niv: 2, src: 'TD', q: `<p>Soient $a, b, c ∈ ℤ$. Démontrer les trois propriétés algébriques du cours : transitivité, combinaison linéaire, divisibilité mutuelle.</p>`,
indice: 'Traduis chaque hypothèse « $x | y$ » en une égalité avec un entier : $y = x × k$.',
meth: 'Introduis des entiers $k$, $l$ pour chaque hypothèse, substitue, puis exhibe un entier qui prouve la conclusion.',
s: `<ol><li><b>Transitivité.</b> $a | b$ et $b | c$ : il existe $k, l ∈ ℤ$ avec $b = ak$ et $c = bl$. Alors $c = (ak)l = a(kl)$ avec $kl ∈ ℤ$ : $a | c$.</li>
<li><b>Combinaison linéaire.</b> $a | b$ et $a | c$ : $b = ak$, $c = al$. Pour $u, v ∈ ℤ$ : $ub + vc = uak + val = a(uk + vl)$ avec $uk + vl ∈ ℤ$ : $a | ub + vc$.</li>
<li><b>Divisibilité mutuelle.</b> $a | b$ et $b | a$ : $b = ak$ et $a = bl$. Alors $a = akl$. Si $a ≠ 0$, on simplifie : $kl = 1$ avec $k, l$ entiers, donc $k = l = 1$ ou $k = l = -1$. Ainsi $b = a$ ou $b = -a$. (Si $a = 0$, alors $b = ak = 0 = a$.)</li></ol>` }),

X('Exercice 4', { id: 'a1-4', niv: 2, src: 'TD', q: `<ol><li>Déterminer sans calculatrice si $4685368545$ est divisible par $3$, par $5$, par $9$ et par $11$.</li><li>Soit $bar{xyz}$ un nombre de trois chiffres en base 10 ($100x + 10y + z$). Démontrer que la somme $bar{xyz} + bar{zxy} + bar{yzx}$ des trois nombres obtenus par permutation circulaire des chiffres est toujours un multiple de $111$.</li></ol>`,
indice: 'Question 2 : écris chacun des trois nombres en base 10 ($100 × text{chiffre} + …$), additionne, puis regarde le coefficient de $x$, de $y$ et de $z$.',
meth: 'Q1 : somme des chiffres pour 3 et 9, dernier chiffre pour 5, somme alternée pour 11. Q2 : développe et factorise 111.',
s: `<ol><li><b>Par 3 et 9</b> : somme des chiffres $4+6+8+5+3+6+8+5+4+5 = 54$, divisible par 3 <b>et</b> par 9. <b>Par 5</b> : le dernier chiffre est 5, oui. <b>Par 11</b> : en lisant de droite à gauche, la somme alternée $5 - 4 + 5 - 8 + 6 - 3 + 5 - 8 + 6 - 4 = 0$ est divisible par 11 : oui. Le nombre est divisible par 3, 5, 9 et 11.</li>
<li>$bar{xyz} = 100x + 10y + z$, $bar{zxy} = 100z + 10x + y$, $bar{yzx} = 100y + 10z + x$. La somme vaut $$(100 + 10 + 1)x + (10 + 1 + 100)y + (1 + 100 + 10)z = 111x + 111y + 111z = 111(x + y + z)$$ <p>C’est un multiple de 111, quels que soient les chiffres.</p></li></ol>` }),

X('Exercice 5', { id: 'a1-5', niv: 2, src: 'TD', q: `<ol><li>On considère l’expression $B = n^2 - 1$ pour $n ∈ ℕ^*$. <br>• Démontrer que pour $n$ pair, $B$ est impair. <br>• Démontrer que pour $n$ impair strictement supérieur à 1, $B$ est pair et divisible par 8.</li><li>Montrer que pour tout entier $n ∈ ℤ$, $n(n+1)$ est pair.</li><li>Soit $n ∈ ℤ$. Quel est le reste de la division euclidienne de $n^2$ par $4$ ? Discuter selon la parité de $n$.</li></ol>`,
indice: 'Distingue toujours deux cas : $n = 2k$ et $n = 2k + 1$. Pour la divisibilité par 8, factorise $4k(k+1)$ et regarde la parité de $k(k+1)$.',
meth: 'Disjonction de cas sur la parité, développement, factorisation d’une puissance de 2.',
s: `<ol><li>• $n$ pair, $n = 2k$ : $B = 4k^2 - 1 = 2(2k^2 - 1) + 1$, <b>impair</b>.<br>• $n$ impair, $n = 2k + 1$ (avec $k ≥ 1$) : $B = 4k^2 + 4k = 4k(k + 1)$. Comme $k(k+1)$ est un produit de deux entiers consécutifs, il est pair : $k(k+1) = 2m$ et $B = 8m$. Donc $B$ est pair et <b>divisible par 8</b>.</li>
<li>Deux entiers consécutifs : l’un est pair. Par cas : si $n = 2k$, $n(n+1) = 2k(2k+1)$ ; si $n = 2k+1$, $n(n+1) = (2k+1)(2k+2) = 2(2k+1)(k+1)$. Dans les deux cas, c’est un multiple de 2.</li>
<li>• $n = 2k$ : $n^2 = 4k^2$, le reste est <b>0</b>.<br>• $n = 2k+1$ : $n^2 = 4k^2 + 4k + 1 = 4(k^2 + k) + 1$, le reste est <b>1</b>.<br>Ainsi $n^2$ a pour reste 0 (n pair) ou 1 (n impair).</li></ol>` }),

X('Exercice 6', { id: 'a1-6', niv: 3, src: 'Travail perso', q: `<ol><li>Déterminer les entiers naturels $a$ et $b$ tels que $a^2 - b^2 = 25$.</li><li>Lorsqu’on divise $a$ par $b$, le reste est $8$ et lorsqu’on divise $2a$ par $b$, le reste est $5$. Déterminer le diviseur $b$.</li><li>Soit l’équation diophantienne $(E) : xy - 5x - 5y - 7 = 0$. Montrer que $(E) ⇔ (x - 5)(y - 5) = 32$. Déterminer les couples d’entiers naturels $(x, y)$ vérifiant $(E)$.</li><li>Soient $m, n ∈ ℤ$ tels que $m$ divise à la fois $8n + 7$ et $6n + 5$. Montrer que $m = 1$ ou $m = -1$.</li><li>Montrer que si un entier naturel $d$ divise $12n + 7$ et $3n + 1$, alors $d$ divise $3$. En déduire que la fraction $frac{12n + 7}{3n + 1}$ est irréductible pour tout $n ∈ ℕ$.</li></ol>`,
indice: '1 et 3 : factorise ($a^2 - b^2 = (a - b)(a + b)$, et $(x-5)(y-5)$) puis liste les diviseurs. 4 et 5 : fabrique une combinaison linéaire qui donne un résultat constant.',
meth: 'Produit de facteurs entiers = constante : on énumère les diviseurs. Divisibilité de deux expressions : combinaison linéaire qui élimine $n$.',
s: `<ol><li>$(a - b)(a + b) = 25$ avec $a + b ≥ a - b ≥ 0$. Les décompositions de 25 en deux facteurs ordonnés sont $1 × 25$ et $5 × 5$. <br>• $a - b = 1$, $a + b = 25$ : $a = 13$, $b = 12$. <br>• $a - b = 5$, $a + b = 5$ : $a = 5$, $b = 0$. <br>Solutions : <b>$(13, 12)$ et $(5, 0)$</b>.</li>
<li>$a = bq + 8$ avec $b > 8$ (un reste est plus petit que le diviseur). Alors $2a = 2bq + 16$. Comme $2a = bq' + 5$, on obtient $b(q' - 2q) = 11$ : $b$ divise 11, donc $b = 11$ (car $b > 8$). <b>Contrôle</b> : $a = 11q + 8$, $2a = 11(2q + 1) + 5$ ✓. Donc <b>$b = 11$</b>.</li>
<li>$(x - 5)(y - 5) = xy - 5x - 5y + 25$, donc $(x-5)(y-5) = 32 ⇔ xy - 5x - 5y - 7 = 0$ ✓. Pour $x, y ∈ ℕ$, le facteur $x - 5 ≥ -5$. Les facteurs négatifs possibles ($-1, -2, -4$) donneraient un autre facteur $-32, -16, -8 < -5$ : impossible. Donc les deux facteurs sont des diviseurs positifs de 32 : $(1, 32), (2, 16), (4, 8), (8, 4), (16, 2), (32, 1)$, soit <b>$(x, y) ∈ \\{(6, 37), (7, 21), (9, 13), (13, 9), (21, 7), (37, 6)\\}$</b>.</li>
<li>$3(8n + 7) - 4(6n + 5) = 24n + 21 - 24n - 20 = 1$. Si $m$ divise $8n + 7$ et $6n + 5$, il divise cette combinaison linéaire, donc $m | 1$ : $m = ±1$.</li>
<li>$(12n + 7) - 4(3n + 1) = 3$. Si $d | 12n + 7$ et $d | 3n + 1$, alors $d | 3$ : $d = 1$ ou $d = 3$. Or $3 ∤ 3n + 1$ (car $3n + 1 = 3n + 1$ a pour reste 1 dans la division par 3), donc $d = 1$. Le PGCD de $12n + 7$ et $3n + 1$ est 1 : la fraction est <b>irréductible</b>.</li></ol>` })
]
},
{
id: 'a2', court: 'Nombres premiers', titre: 'Nombres premiers et test de primalité', duree: '1 h',
resume: 'Définition, test de primalité par la racine, crible d’Ératosthène, infinité des nombres premiers.',
intro: 'Les nombres premiers sont les « atomes » de l’arithmétique : tout entier se fabrique en les multipliant. Ils protègent aussi tes mots de passe (cryptographie RSA, HTTPS). Savoir <b>reconnaître</b> un nombre premier est la première compétence.',
objectifs: [
  'donner la <b>définition</b> d’un nombre premier et citer les cas particuliers (0, 1, 2) ;',
  'appliquer le <b>test de primalité</b> : il suffit de tester les premiers $≤ sqrt{n}$ ;',
  'utiliser le <b>crible d’Ératosthène</b> et comprendre pourquoi il s’arrête à $sqrt{N}$ ;',
  'démontrer qu’il existe une <b>infinité</b> de nombres premiers ;',
  'montrer qu’un premier $p ≥ 5$ s’écrit $6k ± 1$.'
],
prerequis: ['Divisibilité et critères de divisibilité (chapitre 1).', 'Le raisonnement par l’absurde (logique, chapitre 3).'],
sections: [
{ t: 'Définition et premiers exemples', h: `
${bDef('Nombre premier', `<p>Un entier naturel $n ≥ 2$ est <b>premier</b> s’il possède <b>exactement deux diviseurs positifs</b> : $1$ et $n$. Un entier $n ≥ 2$ qui n’est pas premier est dit <b>composé</b>.</p>`)}
${bRem('Remarques fondamentales', `<ul><li><b>1 n’est pas premier</b> : il n’a qu’un seul diviseur positif.</li><li><b>0 n’est pas premier</b> : tout entier non nul le divise.</li><li>Le plus petit nombre premier est 2, et c’est <b>le seul premier pair</b>.</li></ul>`)}
${bEx('Les premiers premiers', `<p>$2, 3, 5, 7, 11, 13, 17, 19, 23, 29$ sont premiers. Le nombre $9 = 3 × 3$ est composé.</p>`)}
${bProp('Plus petit diviseur premier', '<p>Tout entier $n ≥ 2$ admet au moins un <b>diviseur premier</b>. Plus précisément, son plus petit diviseur strictement supérieur à 1 est un nombre premier.</p>')}
${quick('Le nombre $1$ est-il premier ? (oui ou non)', 'non', 'Un nombre premier a <b>exactement deux</b> diviseurs positifs distincts. Le nombre 1 n’en a qu’un seul : il n’est pas premier.')}` },

{ t: 'Le test de primalité', h: `
<p>Comment savoir si 127 est premier sans tester tous les entiers jusqu’à 126 ? On n’a pas besoin d’aller si loin.</p>
${bThm('Test de primalité', `<p>Soit $n ≥ 2$. Si $n$ n’est divisible par <b>aucun nombre premier $p ≤ sqrt{n}$</b>, alors $n$ est premier.</p>`)}
${bProof('pourquoi la racine carrée suffit', '<p>Si $n$ est composé, $n = ab$ avec $1 < a ≤ b < n$. Alors $a^2 ≤ ab = n$, donc $a ≤ sqrt{n}$ : un composé a toujours un diviseur $≤ sqrt{n}$ (et son plus petit diviseur $>1$ est premier). Contraposée : aucun diviseur premier $≤ sqrt{n}$ ⇒ $n$ premier.</p>')}
${bMeth('Tester si n est premier', `${steps(['Calcule $sqrt{n}$ (ou un encadrement) et liste les <b>nombres premiers $≤ sqrt{n}$</b>.', 'Teste chacun : critères de divisibilité (2, 3, 5), ou division euclidienne.', 'Si l’un divise $n$ : composé (et tu as un facteur). Si aucun ne divise : premier.'])}`)}
${bEx('127 est-il premier ?', `<p>$sqrt{127} ≈ 11{,}26$ : on teste les premiers $2, 3, 5, 7, 11$.</p><ul>
<li>127 est impair : non divisible par 2.</li><li>$1 + 2 + 7 = 10$ : non divisible par 3.</li><li>Il ne finit ni par 0 ni par 5 : non divisible par 5.</li>
<li>$127 = 7 × 18 + 1$ : non divisible par 7.</li><li>$127 = 11 × 11 + 6$ : non divisible par 11.</li></ul><p>Donc <b>127 est premier</b>.</p>`)}
${demo('fact', { ftN: '127' }, 'Décompose un entier et teste sa primalité')}
${bAlgo('En Python', `<pre class="f">def est_premier(n):
    if n &lt; 2: return False
    d = 2
    while d * d &lt;= n:
        if n % d == 0: return False
        d += 1
    return True</pre><p>Complexité : environ $sqrt{n}$ divisions au pire. Pour des entiers de plusieurs centaines de chiffres (RSA, HTTPS), c’est beaucoup trop lent : on utilise des tests <b>probabilistes</b> comme Miller-Rabin.</p>`)}
${quick('Le nombre $391$ est-il premier ? (oui ou non)', 'non', '$sqrt{391} ≈ 19{,}8$ : en testant les premiers $≤ 19$, on trouve $391 = 17 × 23$. Il est composé.', 'Teste 17 et 19.')}` },

{ t: 'Le crible d’Ératosthène', h: `
<p>Pour <b>lister</b> tous les nombres premiers jusqu’à $N$, on utilise une méthode vieille de 2 200 ans : le <b>crible d’Ératosthène</b>.</p>
${bAlgo('Crible d’Ératosthène', `${steps(['Écris tous les entiers de 2 à $N$.', 'Prends le plus petit nombre non barré : il est <b>premier</b>. Barre tous ses multiples (en partant de son carré).', 'Recommence avec le plus petit nombre non barré, jusqu’à ce que son carré dépasse $N$ : <b>tous les nombres non barrés sont premiers</b>.'])}`)}
${demo('sieve', null, 'Le crible jusqu’à 100 : clique sur « Étape suivante »')}
<p>Pourquoi s’arrêter à $sqrt{N}$ ? Par le test de la section précédente : un composé $≤ N$ a un diviseur premier $≤ sqrt{N}$, donc il a déjà été barré à ce stade. Pour $N = 100$, il suffit de traiter $2, 3, 5, 7$.</p>
${bRem('', '<p>Il y a 25 nombres premiers jusqu’à 100 et 168 jusqu’à 1000. Plus on avance, plus ils se raréfient — mais il y en a toujours : c’est le sujet de la section suivante.</p>')}` },

{ t: 'Infinité des nombres premiers', h: `
${bThm('Théorème d’Euclide', '<p>Il existe une <b>infinité</b> de nombres premiers.</p>')}
${bProof('Euclide, par l’absurde', `<p>Supposons qu’il n’y ait qu’un nombre <b>fini</b> de nombres premiers : $p_1, p_2, …, p_k$. Posons</p>$$N = p_1 p_2 … p_k + 1$$
<p>Comme $N > 1$, $N$ admet un diviseur premier $p$. Ce $p$ fait partie de la liste $\\{p_1, …, p_k\\}$, donc $p$ divise le produit $p_1 p_2 … p_k$. Puisque $p$ divise $N$ et $p_1 … p_k$, il divise leur différence :</p>$$p | N - p_1 p_2 … p_k = 1$$
<p>Impossible : un nombre premier est $≥ 2$. Donc l’ensemble des nombres premiers est <b>infini</b>. ∎</p>`)}
${bMeth('Le schéma de la preuve', '<p>On suppose le contraire, on <b>construit un nombre</b> qui contredit l’hypothèse, puis on obtient une impossibilité. C’est le raisonnement par l’absurde, vu en logique.</p>')}
${bInfo('Une seconde preuve', '<p>L’exercice 3 propose une autre démonstration avec $n! + 1$ : ce nombre n’est divisible par aucun entier $k$ tel que $2 ≤ k ≤ n$, donc il a un diviseur premier $> n$.</p>')}` },

{ t: 'Les nombres premiers et le modulo 6', h: `
<p>Tous les nombres premiers $p ≥ 5$ ont la même « allure » modulo 6.</p>
${bProp('Forme d’un premier ≥ 5', `<p>Si $p ≥ 5$ est premier, alors $p = 6k + 1$ ou $p = 6k - 1$ avec $k ∈ ℕ^*$.</p>`)}
${bProof('6k ± 1', '<p>Dans la division par 6, le reste de $p$ est 0, 1, 2, 3, 4 ou 5. Si le reste est 0, 2 ou 4, alors $p$ est pair ; si c’est 3, alors $3 | p$. Comme $p ≥ 5$ est premier, il n’est divisible ni par 2 ni par 3 : le reste est 1 ou 5, c’est-à-dire $p = 6k + 1$ ou $p = 6k + 5 = 6(k+1) - 1$.</p>')}
${bEx('Une application', `<p>Si $p ≥ 5$ est premier, alors $p^2 + 11$ est divisible par 12. En effet, avec $p = 6k ± 1$ :</p>$$p^2 + 11 = 36k^2 ± 12k + 1 + 11 = 12(3k^2 ± k + 1)$$`)}
${bTrap('', 'La réciproque est <b>fausse</b> : tout nombre de la forme $6k ± 1$ n’est pas premier ($25 = 6 × 4 + 1$ et $35 = 6 × 6 - 1$ sont composés).')}` }
],
retenir: [
  '<b>Premier</b> : $n ≥ 2$ avec exactement deux diviseurs positifs ($1$ et $n$). Ni 0 ni 1 ne sont premiers ; 2 est le seul premier pair.',
  '<b>Test de primalité</b> : si aucun premier $p ≤ sqrt{n}$ ne divise $n$, alors $n$ est premier.',
  '<b>Crible d’Ératosthène</b> : on barre les multiples de chaque premier jusqu’à $sqrt{N}$ ; les nombres restants sont premiers.',
  '<b>Infinité</b> : si $p_1, …, p_k$ étaient tous les premiers, $p_1 … p_k + 1$ aurait un diviseur premier qui divise 1 : absurde.',
  'Un premier $p ≥ 5$ s’écrit <b>$6k + 1$ ou $6k - 1$</b> ; la réciproque est fausse.',
  'Les algorithmes naïfs coûtent $O(sqrt{n})$ ; pour la cryptographie, on utilise des tests probabilistes.'
],
pieges: [
  ['1 n’est pas premier', 'Un premier a exactement <b>deux</b> diviseurs positifs. 1 n’en a qu’un.'],
  ['Tester jusqu’à n−1', 'Inutile : il suffit de tester les premiers jusqu’à $sqrt{n}$.'],
  ['6k ± 1 ⇒ premier', 'Faux : $25 = 6 × 4 + 1$ est composé. Seule l’implication inverse est vraie.']
],
quiz: [
  Q('391 est-il premier ?', ['Non : 391 = 17 × 23', 'Oui', 'Non : 391 est pair', 'Non : 391 = 7 × 56'], '√391 ≈ 19,8. Le test de 17 donne 391 = 17 × 23 : composé.'),
  Q('503 est-il premier ?', ['Oui', 'Non : 503 = 7 × 72', 'Non : 503 = 11 × 46', 'Non : 503 est divisible par 3'], '√503 ≈ 22,4 : aucun des premiers 2, 3, 5, 7, 11, 13, 17, 19 ne divise 503, donc il est premier.'),
  Q('Quel est le seul nombre premier pair ?', ['2', '0', '4', '1'], 'Tout entier pair > 2 est divisible par 2 (et différent de 2) : il n’est pas premier.'),
  Q('Pourquoi 1 n’est-il pas premier ?', ['il n’a qu’un seul diviseur positif', 'il est impair', 'il divise tout', 'il est trop petit'], 'Un premier a exactement deux diviseurs positifs distincts ; 1 n’en a qu’un.'),
  Q('Pour savoir si n est premier, il suffit de tester les premiers…', ['jusqu’à √n', 'jusqu’à n/2', 'jusqu’à n − 1', 'jusqu’à log n'], 'Un composé a un diviseur premier ≤ √n.'),
  Q('Quelle est la forme de tout nombre premier p ≥ 5 ?', ['6k + 1 ou 6k − 1', '4k + 1 ou 4k + 3', '2k + 1', '6k + 3'], 'p n’est divisible ni par 2 ni par 3 : son reste modulo 6 est 1 ou 5.'),
  Q('Si p ≥ 5 est premier, alors p² + 11 est divisible par…', ['12', '6', '5', '24'], 'p = 6k ± 1 donne p² + 11 = 36k² ± 12k + 12 = 12(3k² ± k + 1).'),
  Q('Si p est premier et p > 3, alors p² − 1 est divisible par…', ['24', '12', '6', '48'], 'p = 6k ± 1 donne p² − 1 = 12k(3k ± 1), et k(3k ± 1) est pair : 24 divise p² − 1.'),
  Q('Dans la preuve d’Euclide, que montre-t-on pour N = p₁p₂…pₖ + 1 ?', ['qu’un diviseur premier de N divise 1 : absurde', 'que N est premier', 'que N est pair', 'que N est un carré'], 'Le diviseur premier p de N serait dans la liste, donc diviserait p₁…pₖ, puis N − p₁…pₖ = 1.'),
  Q('Pour n ≥ 2, n! + 1 n’est divisible par aucun entier k tel que…', ['2 ≤ k ≤ n', 'k > n', 'k = n + 1', 'k = 1'], 'Pour 2 ≤ k ≤ n, k divise n! donc n! + 1 a pour reste 1 modulo k.')
],
cartes: [
  C('Qu’est-ce qu’un nombre premier ?', 'n ≥ 2 avec exactement deux diviseurs positifs : 1 et n.\n1 n’est pas premier ; 2 est le seul premier pair.'),
  C('Test de primalité', 'Si aucun premier p ≤ √n ne divise n, alors n est premier.'),
  C('Les nombres premiers ≤ 30', '2, 3, 5, 7, 11, 13, 17, 19, 23, 29'),
  C('Crible d’Ératosthène', 'Barrer les multiples de chaque premier (à partir de son carré) jusqu’à √N ; les non-barrés sont premiers.'),
  C('Preuve de l’infinité des premiers', 'N = p₁…pₖ + 1 a un diviseur premier p de la liste.\nAlors p | N − p₁…pₖ = 1 : impossible.'),
  C('Forme d’un premier p ≥ 5', '6k + 1 ou 6k − 1 (avec k ≥ 1).\nLa réciproque est fausse (25 = 6 × 4 + 1).'),
  C('Plus petit diviseur > 1 d’un entier ≥ 2', 'C’est toujours un nombre premier.'),
  C('Que fait le test de Miller-Rabin ?', 'Un test de primalité probabiliste, utilisé pour les très grands nombres (RSA, HTTPS).')
],
exos: [
X('Exercice 1', { id: 'a2-1', niv: 1, src: 'TD', q: `<p>Les nombres suivants sont-ils premiers ? Justifier à l’aide du test de primalité.</p><ol><li>$259$</li><li>$127$</li><li>$391$</li><li>$503$</li></ol>`,
indice: 'Pour chaque nombre, calcule d’abord $sqrt{n}$ et liste les premiers à tester. Dès qu’un premier divise $n$, tu peux t’arrêter.',
meth: 'Test de primalité : divise $n$ par les premiers $p ≤ sqrt{n}$ ; un seul diviseur suffit pour conclure « composé ».',
s: `<ol><li><b>259</b> : $sqrt{259} ≈ 16{,}1$. Premiers à tester : $2, 3, 5, 7, 11, 13$. Ni 2, ni 3 ($2+5+9 = 16$), ni 5 ; mais $259 = 7 × 37$. <b>Composé</b>.</li>
<li><b>127</b> : $sqrt{127} ≈ 11{,}3$. Premiers : $2, 3, 5, 7, 11$. Restes : $1, 1, 2, 1, 6$ (non divisible par 2, 3, 5 ; $127 = 7 × 18 + 1$ ; $127 = 11 × 11 + 6$). <b>Premier</b>.</li>
<li><b>391</b> : $sqrt{391} ≈ 19{,}8$. Premiers : $2, 3, 5, 7, 11, 13, 17, 19$. Les petits ne divisent pas ; mais $391 = 17 × 23$. <b>Composé</b>.</li>
<li><b>503</b> : $sqrt{503} ≈ 22{,}4$. Premiers : $2, 3, 5, 7, 11, 13, 17, 19$. Restes : $503$ est impair, $5+0+3 = 8$ (pas 3), finit par 3 (pas 5) ; $503 = 7 × 71 + 6$ ; $= 11 × 45 + 8$ ; $= 13 × 38 + 9$ ; $= 17 × 29 + 10$ ; $= 19 × 26 + 9$. Aucun reste nul : <b>premier</b>.</li></ol>` }),

X('Exercice 2', { id: 'a2-2', niv: 2, src: 'TD', q: `<ol><li>Montrer que tout nombre premier $p ≥ 5$ peut s’écrire sous la forme $6k + 1$ ou $6k - 1$ avec $k ∈ ℕ^*$.</li><li>En déduire que si $p ≥ 5$ est premier, alors $p^2 + 11$ est impérativement divisible par $12$.</li></ol>`,
indice: 'Regarde le reste de $p$ dans la division par 6 : six cas possibles. Lesquels sont éliminés parce que $p$ est premier ?',
meth: 'Reste 0, 2, 4 : $p$ pair. Reste 3 : divisible par 3. Il reste 1 et 5. Ensuite, développe $(6k ± 1)^2$.',
s: `<ol><li>Division de $p$ par 6 : $p = 6k + r$ avec $r ∈ \\{0, 1, 2, 3, 4, 5\\}$. <br>• $r = 0, 2, 4$ : $p$ est pair, donc $p = 2$ car il est premier — exclu puisque $p ≥ 5$. <br>• $r = 3$ : $3 | p$, donc $p = 3$ — exclu. <br>Il reste $r = 1$ ($p = 6k + 1$) ou $r = 5$ ($p = 6k + 5 = 6(k + 1) - 1$), c’est-à-dire de la forme $6k' - 1$.</li>
<li>$p = 6k + 1$ : $p^2 + 11 = 36k^2 + 12k + 1 + 11 = 12(3k^2 + k + 1)$.<br>$p = 6k - 1$ : $p^2 + 11 = 36k^2 - 12k + 1 + 11 = 12(3k^2 - k + 1)$.<br>Dans les deux cas, $12 | p^2 + 11$.</li></ol>` }),

X('Exercice 3', { id: 'a2-3', niv: 2, src: 'TD', q: `<ol><li>Montrer que pour tout entier $n ≥ 2$, l’entier $n! + 1$ n’est divisible par aucun entier $k$ tel que $2 ≤ k ≤ n$.</li><li>En déduire qu’il possède un diviseur premier strictement supérieur à $n$.</li><li>Retrouver ainsi une autre démonstration de l’infinité des nombres premiers.</li></ol>`,
indice: 'Si $2 ≤ k ≤ n$, le nombre $k$ apparaît dans le produit $n! = 1 × 2 × … × n$ : donc $k | n!$.',
meth: 'Combinaison linéaire : si $k | n!$ et $k | n! + 1$, alors $k | 1$.',
s: `<ol><li>Soit $2 ≤ k ≤ n$. Alors $k$ est l’un des facteurs de $n! = 1 × 2 × … × n$, donc $k | n!$. Si $k$ divisait aussi $n! + 1$, il diviserait la différence $(n! + 1) - n! = 1$, ce qui est impossible car $k ≥ 2$. Donc $n! + 1$ n’est divisible par aucun $k ∈ [2 ; n]$.</li>
<li>L’entier $n! + 1 ≥ 3$ admet un diviseur premier $p$. D’après 1, $p$ n’est pas dans $[2 ; n]$, donc $p > n$.</li>
<li>Pour tout $n ≥ 2$, il existe un nombre premier supérieur à $n$ : l’ensemble des nombres premiers n’est pas borné, donc <b>infini</b>. (Autre preuve que celle d’Euclide, qui prend $p_1 … p_k + 1$.)</li></ol>` }),

X('Exercice 4', { id: 'a2-4', niv: 3, src: 'Travail perso', q: `<ol><li>Soit $p$ un nombre premier strictement supérieur à $3$. Montrer que $p^2 - 1$ est divisible par $24$.</li><li>Déterminer tous les entiers $n ≥ 1$ tels que $n^2 - 3n + 2$ soit un nombre premier.</li><li>On considère la suite $(u_n)$ définie par $u_0 = 2$ et $u_{n+1} = u_n^2 - u_n + 1$ pour tout $n ≥ 0$. <br>• Calculer $u_1$, $u_2$ et $u_3$. <br>• Montrer que pour tout $n ≥ 0$, $u_{n+1} = 1 + u_0 u_1 … u_n$. <br>• En déduire que les termes de la suite sont deux à deux premiers entre eux.</li></ol>`,
indice: '1 : utilise $p = 6k ± 1$. 2 : factorise $n^2 - 3n + 2 = (n-1)(n-2)$. 3 : la formule se démontre par récurrence (écris $u_{n+1} - 1 = u_n(u_n - 1)$).',
meth: '1 : factorise $p^2 - 1 = (p-1)(p+1)$ avec $p = 6k ± 1$. 3 : pour deux termes $u_k$ et $u_m$ ($k < m$), un diviseur commun divise $u_m - u_0…u_{m-1} = 1$.',
s: `<ol><li>$p = 6k ± 1$, donc $p^2 - 1 = 36k^2 ± 12k = 12k(3k ± 1)$. Or $k(3k ± 1)$ est pair : si $k$ est pair c’est évident ; si $k$ est impair, $3k ± 1$ est pair. Donc $24 | p^2 - 1$.</li>
<li>$n^2 - 3n + 2 = (n - 1)(n - 2)$. Pour $n = 1$ ou $2$, le résultat est 0 ; pour $n = 3$, il vaut $2 × 1 = 2$, <b>premier</b> ; pour $n ≥ 4$, les deux facteurs sont $≥ 2$ : le produit est composé. Réponse : <b>$n = 3$</b>.</li>
<li>• $u_1 = 4 - 2 + 1 = 3$, $u_2 = 9 - 3 + 1 = 7$, $u_3 = 49 - 7 + 1 = 43$.<br>• <b>Récurrence.</b> Initialisation : $u_1 = 3 = 1 + u_0$. Hérédité : si $u_n = 1 + u_0 … u_{n-1}$, alors $u_{n+1} - 1 = u_n(u_n - 1) = u_n × u_0 … u_{n-1}$, soit $u_{n+1} = 1 + u_0 … u_n$.<br>• Soient $k < m$ et $d$ un diviseur commun de $u_k$ et $u_m$. Comme $u_k$ est un facteur de $u_0 … u_{m-1}$, $d | u_0 … u_{m-1}$. Donc $d | u_m - u_0 … u_{m-1} = 1$ : $d = 1$. Les termes sont <b>deux à deux premiers entre eux</b>.</li></ol>` })
]
},
{
id: 'a3', court: 'Décomposition, PGCD, PPCM', titre: 'Décomposition en facteurs premiers, PGCD et PPCM', duree: '1 h 15',
resume: 'Théorème fondamental de l’arithmétique, valuations, PGCD et PPCM par les exposants, nombre de diviseurs, carrés parfaits.',
intro: 'Tout entier se décompose <b>de façon unique</b> en produit de nombres premiers. Cette « carte d’identité » permet de lire d’un coup d’œil ses diviseurs, son PGCD et son PPCM avec un autre nombre, et de savoir s’il est un carré.',
objectifs: [
  'décomposer un entier en <b>produit de facteurs premiers</b> et lire ses <b>valuations</b> $v_p(n)$ ;',
  'calculer un <b>PGCD</b> et un <b>PPCM</b> avec les exposants (min et max) ;',
  'utiliser la relation $PGCD(a, b) × PPCM(a, b) = ab$ ;',
  'compter les <b>diviseurs</b> d’un entier avec $(α_1 + 1)(α_2 + 1)…$ ;',
  'reconnaître un <b>carré parfait</b> et trouver le plus petit $k$ qui en fait un.'
],
prerequis: ['Nombres premiers et test de primalité (chapitre 2).', 'Divisibilité (chapitre 1).'],
sections: [
{ t: 'Décomposition en produit de facteurs premiers', h: `
${bThm('Théorème fondamental de l’arithmétique', `<p>Tout entier naturel $n ≥ 2$ se décompose <b>de manière unique</b> (à l’ordre des facteurs près) en produit de nombres premiers :</p>$$n = p_1^{α_1} p_2^{α_2} … p_k^{α_k}$$<p>où $p_1 < p_2 < … < p_k$ sont des nombres premiers distincts et $α_1, α_2, …, α_k ∈ ℕ^*$.</p>`)}
${bDef('Valuation p-adique', `<p>Pour un nombre premier $p$, le plus grand entier $k$ tel que $p^k$ divise $n$ est l’<b>exposant de $p$</b> dans la décomposition de $n$ ; on le note $v_p(n)$. (Il vaut 0 si $p$ ne divise pas $n$.)</p>`)}
${bEx('Deux décompositions', `<ul><li>$180 = 2^2 × 3^2 × 5$, donc $v_2(180) = 2$, $v_3(180) = 2$, $v_5(180) = 1$.</li><li>$2520 = 2^3 × 3^2 × 5 × 7$.</li></ul>`)}
${bMeth('Décomposer un entier', `${steps(['Divise par <b>2</b> tant que c’est possible, puis par <b>3</b>, puis par <b>5</b>, puis par les premiers suivants.', 'Chaque fois que tu divises, <b>note le facteur</b> et continue avec le quotient.', 'Arrête-toi quand le quotient vaut 1 (ou est un premier plus petit que le carré du diviseur testé).'])}
<p>Pour $2520$ : $2520 = 2 × 1260 = 2^2 × 630 = 2^3 × 315$ ; $315 = 3 × 105 = 3^2 × 35 = 3^2 × 5 × 7$.</p>`)}
${demo('fact', { ftN: '2520' }, 'La décomposition de n’importe quel entier')}
${quick('Que vaut $v_2(180)$ ? (l’exposant de 2 dans $180 = 2^2 × 3^2 × 5$)', '2', '$180 = 4 × 45 = 2^2 × 3^2 × 5$ : l’exposant de 2 est <b>2</b>.')}` },

{ t: 'Divisibilité et décomposition', h: `
${bProp('Caractérisation de la divisibilité', `<p>Soient $a, b ∈ ℕ^*$. $a$ divise $b$ si, et seulement si, <b>pour tout nombre premier $p$</b> :</p>$$v_p(a) ≤ v_p(b)$$`)}
${bEx('18 divise-t-il 540 ?', `<p>$18 = 2 × 3^2$ et $540 = 2^2 × 3^3 × 5$. Pour chaque premier : $v_2$ : $1 ≤ 2$ ✓ ; $v_3$ : $2 ≤ 3$ ✓ ; $v_5$ : $0 ≤ 1$ ✓. Donc $18 | 540$ (et $540 = 18 × 30$).</p>`)}
<p>Lire la divisibilité sur les exposants transforme un problème de division en une simple <b>comparaison d’entiers</b>.</p>` },

{ t: 'PGCD et PPCM par la décomposition', h: `
<p>On écrit $a$ et $b$ avec <b>les mêmes</b> facteurs premiers $p_i$ (avec des exposants éventuellement nuls) : $a = ∏ p_i^{α_i}$ et $b = ∏ p_i^{β_i}$.</p>
${bThm('PGCD et PPCM par les exposants', `$$PGCD(a, b) = ∏ p_i^{min(α_i, β_i)}
PPCM(a, b) = ∏ p_i^{max(α_i, β_i)}$$<p>Le PGCD prend le <b>plus petit</b> exposant de chaque premier, le PPCM le <b>plus grand</b>.</p>`)}
${bProp('Relation fondamentale', `$$PGCD(a, b) × PPCM(a, b) = ab$$<p>(Car $min(α, β) + max(α, β) = α + β$.)</p>`)}
${bEx('A = 588 et B = 616', `<p>$A = 588 = 2^2 × 3 × 7^2$ et $B = 616 = 2^3 × 7 × 11$. On écrit tous les premiers : $A = 2^2 · 3^1 · 7^2 · 11^0$ et $B = 2^3 · 3^0 · 7^1 · 11^1$.</p>
$$PGCD(A, B) = 2^{min(2, 3)} × 3^{min(1, 0)} × 7^{min(2, 1)} × 11^{min(0, 1)} = 2^2 × 7 = 28$$
$$PPCM(A, B) = 2^3 × 3 × 7^2 × 11 = 12936$$
<p>Contrôle : $28 × 12936 = 362208 = 588 × 616$ ✓.</p>`)}
${bMeth('À retenir pour ne pas se tromper', '<p>« <b>G</b>CD = <b>m</b>in » et « P<b>P</b>CM = <b>m</b>a<b>x</b> » : le plus <i>grand</i> commun diviseur utilise… le plus <i>petit</i> exposant (on ne peut pas diviser par plus de ce que les deux nombres contiennent).</p>')}
${quick('Que vaut $PGCD(12, 18)$ ? ($12 = 2^2 × 3$ et $18 = 2 × 3^2$)', '6', 'Minimum des exposants : $2^{min(2,1)} × 3^{min(1,2)} = 2 × 3 = 6$.')}` },

{ t: 'Nombre de diviseurs et carrés parfaits', h: `
${bProp('Nombre de diviseurs positifs', `<p>Si $n = p_1^{α_1} p_2^{α_2} … p_k^{α_k}$, le nombre de diviseurs positifs de $n$ est</p>$$N_d(n) = (α_1 + 1)(α_2 + 1)…(α_k + 1)$$<p>Un diviseur est de la forme $p_1^{β_1} … p_k^{β_k}$ avec $0 ≤ β_i ≤ α_i$ : il y a $α_i + 1$ choix pour chaque exposant.</p>`)}
${bEx('Diviseurs de 340', `<p>$340 = 2^2 × 5 × 17$ : $(2+1)(1+1)(1+1) = 12$ diviseurs positifs : $1, 2, 4, 5, 10, 17, 20, 34, 68, 85, 170, 340$.</p>`)}
${bProp('Carré parfait', `<p>Un entier est un <b>carré parfait</b> si, et seulement si, <b>tous les exposants</b> de sa décomposition sont <b>pairs</b>.</p>`)}
${bMeth('Plus petit k tel que k × n soit un carré parfait', `<p>Repère les premiers dont l’exposant est <b>impair</b> : $k$ est le produit de ces premiers (chacun une seule fois). Exemple : $7425 = 3^3 × 5^2 × 11$ ; exposants impairs pour 3 et 11 : $k = 3 × 11 = 33$ et $7425 × 33 = 3^4 × 5^2 × 11^2 = 495^2$.</p>`)}
${quick('Combien $360 = 2^3 × 3^2 × 5$ possède-t-il de diviseurs positifs ?', '24', '$(3+1)(2+1)(1+1) = 4 × 3 × 2 = 24$.', 'Ajoute 1 à chaque exposant, puis multiplie.')}` },

{ t: 'Deux belles applications', h: `
<h3>5.1 L’irrationalité de √2</h3>
<p>Supposons $sqrt{2} = frac{a}{b}$ avec $a, b ∈ ℕ^*$. En élevant au carré : $a^2 = 2b^2$. Regardons l’exposant de 2 de chaque côté :</p>
$$v_2(a^2) = 2v_2(a) ;; toujours pair
v_2(2b^2) = 1 + 2v_2(b) ;; toujours impair$$
<p>Un nombre ne peut pas avoir à la fois un exposant de 2 pair et impair (unicité de la décomposition). <b>Contradiction</b> : $sqrt{2}$ est irrationnel. ∎</p>
<h3>5.2 Un partage équitable</h3>
${bEx('756 bonbons et 504 jouets', `<p>On veut les répartir <b>sans reste</b> entre le plus d’enfants possible : le nombre d’enfants doit diviser 756 <b>et</b> 504, et on le veut maximal : c’est le <b>PGCD</b>. $756 = 2^2 × 3^3 × 7$ et $504 = 2^3 × 3^2 × 7$, donc $PGCD = 2^2 × 3^2 × 7 = 252$ enfants (chacun reçoit 3 bonbons et 2 jouets).</p>`)}` }
],
retenir: [
  '<b>Décomposition unique</b> : $n = p_1^{α_1} … p_k^{α_k}$ ; $v_p(n)$ est l’exposant de $p$ dans $n$.',
  '$a | b ⇔ v_p(a) ≤ v_p(b)$ pour tout premier $p$.',
  '<b>PGCD</b> : exposants <b>min</b> ; <b>PPCM</b> : exposants <b>max</b> ; $PGCD × PPCM = ab$.',
  'Nombre de diviseurs positifs : $(α_1 + 1)(α_2 + 1)…(α_k + 1)$.',
  '$n$ est un carré parfait ⇔ tous les exposants sont pairs ; le plus petit $k$ rendant $kn$ carré est le produit des premiers d’exposant impair.',
  '$sqrt{2}$ est irrationnel : $a^2 = 2b^2$ donne une parité contradictoire pour $v_2$.'
],
pieges: [
  ['PGCD et PPCM par les exposants', 'PGCD : le <b>min</b> des exposants ; PPCM : le <b>max</b>. Ne les échange pas.'],
  ['Oublier le « +1 »', 'Le nombre de diviseurs est $(α + 1)$ par facteur, pas $α$ : $2^3$ a <b>4</b> diviseurs, pas 3.'],
  ['Premiers absents', 'Pour comparer deux décompositions, écris les <b>mêmes</b> premiers dans les deux, avec exposant 0 si un premier est absent.']
],
quiz: [
  Q('Combien 340 a-t-il de diviseurs positifs ?', ['12', '8', '10', '6'], '340 = 2² × 5 × 17 : (2 + 1)(1 + 1)(1 + 1) = 12.'),
  Q('PGCD(588, 616) et PPCM(588, 616) valent…', ['28 et 12 936', '14 et 25 872', '56 et 6 468', '28 et 362 208'], '588 = 2² × 3 × 7² et 616 = 2³ × 7 × 11 : PGCD = 2² × 7 = 28 ; PPCM = 2³ × 3 × 7² × 11 = 12 936.'),
  Q('Quel est le plus petit entier k > 0 tel que 7425 × k soit un carré parfait ?', ['33', '3', '11', '15'], '7425 = 3³ × 5² × 11 : les exposants impairs sont ceux de 3 et de 11, donc k = 3 × 11 = 33.'),
  Q('A = 2⁴ × 3³ × 7 × 11⁷ possède combien de diviseurs positifs ?', ['320', '15', '160', '240'], '(4 + 1)(3 + 1)(1 + 1)(7 + 1) = 5 × 4 × 2 × 8 = 320.'),
  Q('Dans PGCD(a, b), pour chaque nombre premier on prend…', ['le plus petit exposant', 'le plus grand exposant', 'la somme des exposants', 'le produit des exposants'], 'Un diviseur commun ne peut pas contenir plus de p que le moins riche des deux nombres : min des exposants.'),
  Q('Quelle relation a-t-on toujours entre PGCD et PPCM ?', ['PGCD(a, b) × PPCM(a, b) = ab', 'PGCD(a, b) + PPCM(a, b) = a + b', 'PGCD(a, b) = PPCM(a, b)', 'PPCM(a, b) divise PGCD(a, b)'], 'min(α, β) + max(α, β) = α + β pour chaque exposant.'),
  Q('Un entier est un carré parfait si et seulement si…', ['tous ses exposants premiers sont pairs', 'il est pair', 'il a un nombre pair de diviseurs', 'sa racine est un nombre premier'], 'n = m² ⇔ tous les exposants de la décomposition sont pairs.'),
  Q('Preuve de l’irrationalité de √2 : si a² = 2b², alors…', ['l’exposant de 2 est pair à gauche et impair à droite', 'a et b sont pairs', 'a est premier', 'b divise a'], 'v₂(a²) = 2v₂(a) est pair ; v₂(2b²) = 1 + 2v₂(b) est impair : contradiction.'),
  Q('Quel est le nombre maximal d’enfants pour partager 756 bonbons et 504 jouets sans reste ?', ['252', '126', '504', '36'], 'C’est PGCD(756, 504) = 2² × 3² × 7 = 252.'),
  Q('Combien l’entier 2ⁿ possède-t-il de diviseurs positifs ?', ['n + 1', 'n', '2n', '2ⁿ'], 'Les diviseurs sont 1, 2, 4, …, 2ⁿ : n + 1 diviseurs.')
],
cartes: [
  C('Théorème fondamental de l’arithmétique', 'Tout n ≥ 2 s’écrit de façon unique n = p₁^α₁ … pₖ^αₖ (à l’ordre près).'),
  C('Valuation p-adique v_p(n)', 'Exposant de p dans la décomposition de n.\nEx. : 180 = 2² × 3² × 5 donne v₂ = 2, v₃ = 2, v₅ = 1.'),
  C('Divisibilité et exposants', 'a | b ⇔ v_p(a) ≤ v_p(b) pour tout premier p.'),
  C('PGCD et PPCM avec les exposants', 'PGCD : min des exposants.\nPPCM : max des exposants.'),
  C('Relation PGCD × PPCM', 'PGCD(a, b) × PPCM(a, b) = ab'),
  C('Nombre de diviseurs positifs de n', '(α₁ + 1)(α₂ + 1)…(αₖ + 1)'),
  C('Quand n est-il un carré parfait ?', 'Quand tous les exposants de sa décomposition sont pairs.'),
  C('Plus petit k tel que kn soit un carré', 'Le produit des premiers dont l’exposant est impair.'),
  C('Combien 2ⁿ a-t-il de diviseurs ?', 'n + 1 (1, 2, 4, …, 2ⁿ).'),
  C('Comment partager sans reste le plus loin possible ?', 'Le nombre maximal de parts est le PGCD des quantités.')
],
exos: [
X('Exercice 1', { id: 'a3-1', niv: 1, src: 'TD', q: `<p>Décomposer les entiers suivants en produit de facteurs premiers :</p><ol><li>$2520$</li><li>$7425$</li><li>$588$ et $616$</li></ol>`,
indice: 'Divise par 2 tant que possible, puis par 3, 5, 7… Garde le compte de chaque facteur.',
meth: 'Divisions successives par les premiers dans l’ordre croissant.',
s: `<ol><li>$2520 = 2 × 1260 = 2^2 × 630 = 2^3 × 315$ ; $315 = 3 × 105 = 3^2 × 35 = 3^2 × 5 × 7$. Donc <b>$2520 = 2^3 × 3^2 × 5 × 7$</b>.</li>
<li>$7425$ est impair ; $7 + 4 + 2 + 5 = 18$ donc divisible par 3 et 9 : $7425 = 3 × 2475 = 3^2 × 825 = 3^3 × 275$ ; $275 = 5 × 55 = 5^2 × 11$. Donc <b>$7425 = 3^3 × 5^2 × 11$</b>.</li>
<li>$588 = 2 × 294 = 2^2 × 147 = 2^2 × 3 × 49$, donc <b>$588 = 2^2 × 3 × 7^2$</b>. $616 = 2 × 308 = 2^2 × 154 = 2^3 × 77$, donc <b>$616 = 2^3 × 7 × 11$</b>.</li></ol>` }),

X('Exercice 2', { id: 'a3-2', niv: 1, src: 'TD', q: `<p>On considère $a = 588$ et $b = 616$.</p><ol><li>Calculer $PGCD(a, b)$ et $PPCM(a, b)$ à l’aide de leurs décompositions en facteurs premiers.</li><li>Vérifier la relation $PGCD(a, b) × PPCM(a, b) = ab$.</li></ol>`,
indice: 'Utilise les décompositions de l’exercice 1 et écris les mêmes premiers ($2, 3, 7, 11$) dans les deux nombres.',
meth: 'PGCD : min des exposants ; PPCM : max des exposants.',
s: `<ol><li>$588 = 2^2 · 3^1 · 7^2 · 11^0$ et $616 = 2^3 · 3^0 · 7^1 · 11^1$. <br>$PGCD = 2^{min(2,3)} × 3^{min(1,0)} × 7^{min(2,1)} × 11^{min(0,1)} = 2^2 × 7 = 28$. <br>$PPCM = 2^{max(2,3)} × 3^{max(1,0)} × 7^{max(2,1)} × 11^{max(0,1)} = 2^3 × 3 × 7^2 × 11 = 12936$.</li>
<li>$28 × 12936 = 362208$ et $588 × 616 = 362208$ ✓ : la relation est bien vérifiée.</li></ol>` }),

X('Exercice 3', { id: 'a3-3', niv: 2, src: 'TD', q: `<ol><li>Montrer que $7425$ n’est pas un carré parfait.</li><li>Déterminer le plus petit entier $k ∈ ℕ^*$ tel que $k × 7425$ soit un carré parfait.</li><li>Combien l’entier $340$ possède-t-il de diviseurs positifs ? Les lister tous.</li></ol>`,
indice: 'Un carré parfait n’a que des exposants pairs. Utilise la décomposition $7425 = 3^3 × 5^2 × 11$.',
meth: 'Repère les exposants impairs ; pour la question 3, formule $(α + 1)$ puis liste en combinant les puissances.',
s: `<ol><li>$7425 = 3^3 × 5^2 × 11$ : les exposants de 3 (égal à 3) et de 11 (égal à 1) sont <b>impairs</b>. Donc $7425$ n’est pas un carré parfait.</li>
<li>Il faut rendre pairs les exposants de 3 et de 11 : on multiplie par $3 × 11$. $k = 33$ et $7425 × 33 = 3^4 × 5^2 × 11^2 = (3^2 × 5 × 11)^2 = 495^2 = 245025$. Aucun $k < 33$ ne convient.</li>
<li>$340 = 2^2 × 5 × 17$ : $(2 + 1)(1 + 1)(1 + 1) = 12$ diviseurs : <b>$1, 2, 4, 5, 10, 17, 20, 34, 68, 85, 170, 340$</b>.</li></ol>` }),

X('Exercice 4', { id: 'a3-4', niv: 2, src: 'TD', q: `<p>On donne $A = 2^4 × 3^3 × 7^1 × 11^7$.</p><ol><li>Quel est le nombre exact de diviseurs positifs de $A$ ?</li><li>Quel est le plus petit entier $k ∈ ℕ^*$ tel que $kA$ soit un carré parfait ?</li></ol>`,
indice: 'Le nombre de diviseurs est le produit des $(α_i + 1)$. Pour le carré parfait : quels exposants sont impairs ?',
meth: '$(4+1)(3+1)(1+1)(7+1)$ ; $k$ = produit des premiers d’exposant impair.',
s: `<ol><li>$(4 + 1)(3 + 1)(1 + 1)(7 + 1) = 5 × 4 × 2 × 8 = $ <b>320 diviseurs positifs</b>.</li>
<li>Les exposants de 3 (égal à 3), de 7 (égal à 1) et de 11 (égal à 7) sont impairs, celui de 2 est pair. Donc $k = 3 × 7 × 11 = $ <b>231</b>, et $kA = 2^4 × 3^4 × 7^2 × 11^8$ est un carré parfait.</li></ol>` }),

X('Exercice 5', { id: 'a3-5', niv: 3, src: 'Travail perso', q: `<ol><li>Déterminer les couples $(a, b) ∈ (ℕ^*)^2$ tels que $PGCD(a, b) = 12$ et $PPCM(a, b) = 360$.</li><li>Soit $n ∈ ℕ^*$. Montrer que si $n^2$ est divisible par $p$ (où $p$ est premier), alors $n^2$ est divisible par $p^2$.</li><li>En déduire une démonstration de l’irrationalité de $sqrt{2}$ basée sur la décomposition en facteurs premiers.</li><li>On souhaite partager équitablement 756 bonbons et 504 jouets entre plusieurs enfants. Quel est le nombre maximal d’enfants possible ?</li></ol>`,
indice: '1 : pose $a = 12a\'$ et $b = 12b\'$ avec $PGCD(a\', b\') = 1$, et utilise $PGCD × PPCM = ab$. 2 : regarde $v_p(n^2)$.',
meth: '1 : $ab = 12 × 360$ donne $a\'b\' = 30$ avec $a\'$ et $b\'$ premiers entre eux. 2 et 3 : travaille avec les valuations.',
s: `<ol><li>$a = 12a'$, $b = 12b'$ avec $PGCD(a', b') = 1$. Comme $ab = PGCD × PPCM = 12 × 360 = 4320$, on a $144a'b' = 4320$ : <b>$a'b' = 30$</b>. Les décompositions de 30 en deux facteurs <b>premiers entre eux</b> : $(1, 30), (2, 15), (3, 10), (5, 6)$ et leurs symétriques. D’où les couples $(a, b)$ :$$(12, 360), (24, 180), (36, 120), (60, 72), (72, 60), (120, 36), (180, 24), (360, 12)$$<p>(8 couples ; si on ne tient pas compte de l’ordre, 4.) Contrôle : $PGCD(24, 180) = 12$ et $PPCM(24, 180) = 360$ ✓.</p></li>
<li>Si $p | n^2$, alors $v_p(n^2) ≥ 1$. Or $v_p(n^2) = 2v_p(n)$, donc $v_p(n) ≥ 1$ (car $2v_p(n) ≥ 1$ impose $v_p(n) ≥ 1$ entier). Alors $v_p(n^2) = 2v_p(n) ≥ 2$ : $p^2 | n^2$.</li>
<li>Supposons $sqrt{2} = frac{a}{b}$, d’où $a^2 = 2b^2$. $v_2(a^2) = 2v_2(a)$ est <b>pair</b> alors que $v_2(2b^2) = 1 + 2v_2(b)$ est <b>impair</b>. Par unicité de la décomposition, c’est contradictoire : $sqrt{2}$ est irrationnel.</li>
<li>Le nombre d’enfants doit diviser $756$ et $504$, et il est maximal : c’est $PGCD(756, 504)$. $756 = 2^2 × 3^3 × 7$ et $504 = 2^3 × 3^2 × 7$, donc $PGCD = 2^2 × 3^2 × 7 = $ <b>252 enfants</b> (3 bonbons et 2 jouets chacun).</li></ol>` })
]
},
{
id: 'a4', court: 'Euclide, Bézout, Gauss', titre: 'Algorithme d’Euclide et théorème de Bézout', duree: '1 h 30',
resume: 'PGCD par divisions successives, nombres premiers entre eux, identité de Bézout par remontée, lemme de Gauss.',
intro: 'Décomposer un grand nombre en facteurs premiers est lent. L’<b>algorithme d’Euclide</b> calcule le PGCD de deux nombres en quelques divisions, sans rien factoriser — et sa « remontée » fournit la relation de <b>Bézout</b>, clé des équations et des inverses modulaires.',
objectifs: [
  'calculer un <b>PGCD</b> avec l’algorithme d’Euclide ;',
  'montrer que deux entiers sont <b>premiers entre eux</b> avec une relation de Bézout ;',
  'trouver des <b>coefficients de Bézout</b> par la remontée de l’algorithme ;',
  'énoncer et utiliser le <b>lemme de Gauss</b> et son corollaire ;',
  'prouver qu’une <b>fraction est irréductible</b>.'
],
prerequis: ['La division euclidienne et la divisibilité (chapitre 1).', 'Les propriétés de combinaison linéaire.'],
sections: [
{ t: 'Le PGCD', h: `
${bDef('Plus grand commun diviseur', `<p>Soient $a, b ∈ ℤ$ non tous deux nuls. Le plus grand entier qui divise à la fois $a$ et $b$ s’appelle le <b>plus grand commun diviseur</b>, noté $PGCD(a, b)$.</p>`)}
${bRem('Premières remarques', `<ul><li>$PGCD(a, b) = PGCD(|a|, |b|)$ : le signe ne compte pas.</li><li>Si $a | b$, alors $PGCD(a, b) = |a|$.</li></ul>`)}
${bEx('Par la définition', `<p>$PGCD(12, 36) = 12$ (car $12 | 36$). $PGCD(13, 43) = 1$ (deux premiers distincts). $PGCD(57, 9) = 3$ (diviseurs de 9 : 1, 3, 9 ; seuls 1 et 3 divisent 57).</p>`)}
<p>La méthode « tous les diviseurs » devient vite impraticable. On a mieux : l’algorithme d’Euclide.</p>` },

{ t: 'L’algorithme d’Euclide', h: `
${bProp('Principe', `<p>Si $a = bq + r$ (division euclidienne de $a$ par $b$), alors les diviseurs communs à $a$ et $b$ sont <b>exactement</b> les diviseurs communs à $b$ et $r$. Par conséquent :</p>$$PGCD(a, b) = PGCD(b, r)$$`)}
${bProof('PGCD(a, b) = PGCD(b, r)', '<p>Si $d | a$ et $d | b$, alors $d | a - bq = r$ : $d$ divise $b$ et $r$. Réciproquement, si $d | b$ et $d | r$, alors $d | bq + r = a$. Les deux ensembles de diviseurs communs coïncident, donc ils ont le même plus grand élément.</p>')}
${bAlgo('Algorithme d’Euclide', `<p>On enchaîne les divisions euclidiennes :</p>$$a = bq_1 + r_1 ;; 0 < r_1 < b
b = r_1 q_2 + r_2 ;; 0 < r_2 < r_1
r_1 = r_2 q_3 + r_3 ;; 0 < r_3 < r_2
⋮
r_{k-1} = r_k q_{k+1} + 0$$<p>Les restes <b>décroissent strictement</b> : l’algorithme s’arrête. Le $PGCD(a, b)$ est le <b>dernier reste non nul</b> $r_k$.</p>`)}
${bEx('PGCD(8820, 3150)', `$$8820 = 3150 × 2 + 2520
3150 = 2520 × 1 + 630
2520 = 630 × 4 + 0$$<p>Le dernier reste non nul est 630 : $PGCD(8820, 3150) = 630$.</p>`)}
${demo('pgcd', { pgA: '8820', pgB: '3150' }, 'Euclide pas à pas : change a et b')}
${quick('Calcule $PGCD(152, 184)$ avec l’algorithme d’Euclide.', '8', '$184 = 152 × 1 + 32$ ; $152 = 32 × 4 + 24$ ; $32 = 24 × 1 + 8$ ; $24 = 8 × 3 + 0$. Le dernier reste non nul est <b>8</b>.', 'Divise 184 par 152, puis 152 par le reste, etc.')}` },

{ t: 'Nombres premiers entre eux et théorème de Bézout', h: `
${bDef('Nombres premiers entre eux', '<p>Deux entiers non nuls $a$ et $b$ sont <b>premiers entre eux</b> si $PGCD(a, b) = 1$ : ils n’ont aucun diviseur commun autre que $±1$.</p>')}
${bThm('Identité et théorème de Bézout', `<ul><li><b>Identité de Bézout</b> : pour tous entiers non nuls $a$ et $b$, il existe $u, v ∈ ℤ$ tels que $$au + bv = PGCD(a, b)$$</li>
<li><b>Théorème de Bézout</b> : $a$ et $b$ sont premiers entre eux <b>si, et seulement si</b>, il existe $u, v ∈ ℤ$ tels que $$au + bv = 1$$</li></ul>`)}
${bMeth('Remontée de l’algorithme d’Euclide', `<p>Pour trouver les coefficients $(u, v)$ :</p>${steps(['Déroule l’algorithme d’Euclide jusqu’au PGCD.', 'Réécris chaque reste : $r_i = r_{i-2} - r_{i-1}q_i$.', '<b>Remonte</b> en substituant, de la dernière égalité vers la première, jusqu’à exprimer $d = PGCD(a, b)$ sous la forme $au + bv$.'])}`)}
${bEx('Bézout pour a = 116 et b = 10', `<p>Euclide : $116 = 10 × 11 + 6$ ; $10 = 6 × 1 + 4$ ; $6 = 4 × 1 + 2$ (le dernier reste non nul est 2 : $PGCD = 2$). On réécrit chaque reste : $6 = 116 - 10 × 11$ ; $4 = 10 - 6$ ; $2 = 6 - 4$. On remonte :</p>
$$2 = 6 - 4 = 6 - (10 - 6) = 2 × 6 - 10 ;; on remplace 4 par 10 − 6
 = 2(116 - 10 × 11) - 10 ;; on remplace 6
 = 2 × 116 - 23 × 10 ;; on regroupe$$
<p>D’où $u = 2$ et $v = -23$ : $116 × 2 + 10 × (-23) = 232 - 230 = 2$ ✓.</p>`)}
${bMeth('Pour montrer que a et b sont premiers entre eux', '<p>Il suffit d’exhiber une <b>relation de Bézout</b> $au + bv = 1$. Souvent, une combinaison linéaire bien choisie élimine $n$ : $3(2n + 1) - 2(3n + 2) = -1$ prouve que $2n + 1$ et $3n + 2$ sont premiers entre eux.</p>')}
${bTrap('', 'Dans $au + bv = d$, les coefficients $u$ et $v$ <b>ne sont pas uniques</b> (et souvent l’un est négatif). Vérifie toujours ta relation en recalculant $au + bv$.')}` },

{ t: 'Le lemme de Gauss', h: `
${bThm('Lemme de Gauss', '<p>Soient $a, b, c ∈ ℤ$. Si $a | bc$ et si $PGCD(a, b) = 1$, alors $a | c$.</p>')}
${bProof('Gauss, par Bézout', '<p>Comme $PGCD(a, b) = 1$, il existe $u, v$ avec $au + bv = 1$. On multiplie par $c$ : $acu + bcv = c$. Or $a | acu$ et $a | bc$ (donc $a | bcv$) : $a$ divise la somme, c’est-à-dire $c$. ∎</p>')}
${bProp('Corollaire', '<p>Si $a$ et $b$ sont premiers entre eux, et si $a | n$ et $b | n$, alors $ab | n$.</p>')}
${bProof('le corollaire', '<p>$n = ak$. Comme $b | n = ak$ et $PGCD(a, b) = 1$, le lemme de Gauss donne $b | k$, donc $k = bk\'$ et $n = abk\'$ : $ab | n$. ∎</p>')}
${bTrap('L’hypothèse est indispensable', '<p>Sans $PGCD(a, b) = 1$, c’est faux : $6 | 4 × 3 = 12$ mais $6 ∤ 3$ (ici $PGCD(6, 4) = 2 ≠ 1$).</p>')}
${bEx('Critère de divisibilité par 45', '<p>$45 = 5 × 9$ avec $PGCD(5, 9) = 1$. D’après le corollaire : $45 | n ⇔ 5 | n$ <b>et</b> $9 | n$. Un entier est donc divisible par 45 s’il se termine par 0 ou 5 <b>et</b> si la somme de ses chiffres est un multiple de 9.</p>')}` },

{ t: 'Fractions irréductibles', h: `
<p>Une fraction $frac{a}{b}$ est <b>irréductible</b> si $PGCD(a, b) = 1$. Pour le prouver pour tout $n$, on cherche une combinaison linéaire qui donne $±1$.</p>
${bEx('(2n + 1) / (5n + 3) est irréductible', `<p>$5(2n + 1) - 2(5n + 3) = 10n + 5 - 10n - 6 = -1$. Tout diviseur commun de $2n + 1$ et $5n + 3$ divise $-1$ : le PGCD vaut 1.</p>`)}
${bEx('PGCD de 14a + 3 et 21a + 4', `<p>$3(14a + 3) - 2(21a + 4) = 42a + 9 - 42a - 8 = 1$ : le PGCD vaut 1 et on a même une relation de Bézout : $3m - 2n = 1$ avec $m = 14a + 3$ et $n = 21a + 4$.</p>`)}
${bMeth('Le réflexe', '<p>Pour montrer que $d | (αn + β)$ et $d | (γn + δ)$ impose $d | c$ (constante), forme $γ(αn + β) - α(γn + δ)$ : la variable $n$ disparaît.</p>')}` }
],
retenir: [
  '$a = bq + r ⇒ PGCD(a, b) = PGCD(b, r)$ ; le PGCD est le <b>dernier reste non nul</b> de l’algorithme d’Euclide.',
  '<b>Bézout</b> : $PGCD(a, b) = d ⇒ ∃u, v ∈ ℤ, au + bv = d$ ; et $PGCD(a, b) = 1 ⇔ ∃u, v ∈ ℤ, au + bv = 1$.',
  'Les coefficients de Bézout se trouvent par la <b>remontée</b> de l’algorithme d’Euclide ; ils ne sont pas uniques.',
  '<b>Gauss</b> : $a | bc$ et $PGCD(a, b) = 1 ⇒ a | c$ (l’hypothèse est indispensable).',
  'Corollaire : $a | n$, $b | n$ et $PGCD(a, b) = 1 ⇒ ab | n$ ; ex. : $45 | n ⇔ 5 | n$ et $9 | n$.',
  'Pour montrer que deux expressions en $n$ sont premières entre elles : une <b>combinaison linéaire</b> valant $±1$.'
],
pieges: [
  ['Gauss sans PGCD = 1', 'Le lemme de Gauss exige $PGCD(a, b) = 1$ : $6 | 4 × 3$ mais $6 ∤ 3$.'],
  ['Bézout unique ?', 'Non : $(u, v)$ n’est pas unique ; $2 × 116 - 23 × 10 = 2$ mais $(12, -139)$ marche aussi.'],
  ['Un reste nul trop tôt', 'Le PGCD est le dernier reste <b>non nul</b>, pas le dernier reste (qui vaut 0).']
],
quiz: [
  Q('PGCD(152, 184) par l’algorithme d’Euclide vaut…', ['8', '4', '16', '24'], '184 = 152 + 32 ; 152 = 32 × 4 + 24 ; 32 = 24 + 8 ; 24 = 8 × 3 : dernier reste non nul 8.'),
  Q('PGCD(8820, 3150) = ?', ['630', '315', '1260', '210'], '8820 = 3150 × 2 + 2520 ; 3150 = 2520 + 630 ; 2520 = 630 × 4 : PGCD = 630.'),
  Q('D’après Bézout, PGCD(a, b) = 1 équivaut à…', ['il existe u, v ∈ ℤ tels que au + bv = 1', 'a et b sont premiers', 'a divise b', 'a + b = 1'], 'Théorème de Bézout : a et b sont premiers entre eux ssi ∃u, v ∈ ℤ, au + bv = 1.'),
  Q('Lemme de Gauss : si a | bc et PGCD(a, b) = 1, alors…', ['a | c', 'a | b', 'a = 1', 'b | c'], 'On « simplifie » b, premier avec a : a divise c.'),
  Q('Pour tout n, 2n + 1 et 3n + 2 sont premiers entre eux car…', ['3(2n + 1) − 2(3n + 2) = −1', 'ils sont consécutifs', 'ils sont tous deux impairs', '2n + 1 divise 3n + 2'], 'Un diviseur commun divise la combinaison −1 : le PGCD vaut 1.'),
  Q('Si d divise 12n + 7 et 3n + 1, alors d divise…', ['3', '1', '7', '12'], '(12n + 7) − 4(3n + 1) = 3.'),
  Q('Coefficients de Bézout pour 420 et 637 : 7 = ?', ['44 × 420 − 29 × 637', '29 × 420 − 44 × 637', '15 × 420 − 29 × 637', '44 × 420 + 29 × 637'], '18 480 − 18 473 = 7. On obtient (44, −29) en remontant l’algorithme d’Euclide.'),
  Q('Un entier est divisible par 45 si et seulement s’il est divisible par…', ['5 et par 9', '5 et par 3', '15 et par 3', '9 et par 15'], '45 = 5 × 9 avec 5 et 9 premiers entre eux : corollaire de Gauss.'),
  Q('Que vaut PGCD(a, b) quand a | b ?', ['|a|', '|b|', '1', 'ab'], 'Tous les diviseurs de a divisent b : le plus grand est |a|.'),
  Q('Dans l’algorithme d’Euclide, le PGCD est…', ['le dernier reste non nul', 'le premier quotient', 'le dernier quotient', 'le premier reste'], 'On s’arrête quand le reste est nul ; le PGCD est le reste non nul précédent.')
],
cartes: [
  C('Algorithme d’Euclide', 'PGCD(a, b) = PGCD(b, r), r reste de a par b.\nLe dernier reste non nul est le PGCD.'),
  C('Nombres premiers entre eux', 'a et b tels que PGCD(a, b) = 1.'),
  C('Théorème de Bézout', 'PGCD(a, b) = d ⇒ il existe u, v ∈ ℤ, au + bv = d.\nPGCD(a, b) = 1 ⇔ ∃u, v ∈ ℤ, au + bv = 1.'),
  C('Comment trouver (u, v) ?', 'Remonter l’algorithme d’Euclide : exprimer chaque reste comme r = r₋₂ − r₋₁q, puis substituer jusqu’au PGCD.'),
  C('Lemme de Gauss', 'a | bc et PGCD(a, b) = 1 ⇒ a | c.'),
  C('Corollaire de Gauss', 'a | n, b | n et PGCD(a, b) = 1 ⇒ ab | n.'),
  C('Contre-exemple pour Gauss sans PGCD = 1', '6 | 4 × 3 mais 6 ne divise ni 4 ni 3 (PGCD(6, 4) = 2).'),
  C('Critère de divisibilité par 45', 'Divisible par 5 et par 9 (premiers entre eux).'),
  C('Prouver qu’une fraction est irréductible', 'Trouver une combinaison linéaire du numérateur et du dénominateur égale à ±1 (Bézout).')
],
exos: [
X('Exercice 1', { id: 'a4-1', niv: 1, src: 'TD', q: `<ol><li>Calculer à l’aide de la définition : $PGCD(12, 36)$, $PGCD(13, 43)$, $PGCD(57, 9)$.</li><li>Calculer $PGCD(8820, 3150)$ et $PGCD(152, 184)$ à l’aide de l’algorithme d’Euclide.</li></ol>`,
indice: 'Pour la définition, liste les diviseurs du plus petit des deux nombres. Pour Euclide, divise toujours le plus grand par le plus petit, puis le diviseur par le reste.',
meth: 'Euclide : $a = bq + r$, puis $b = r_1 q_2 + r_2$… jusqu’à un reste nul ; le PGCD est le dernier reste non nul.',
s: `<ol><li>• $12 | 36$ donc $PGCD(12, 36) = 12$.<br>• $13$ et $43$ sont premiers distincts : $PGCD(13, 43) = 1$.<br>• Diviseurs de 9 : $1, 3, 9$ ; $57 = 3 × 19$ est divisible par 3 mais pas par 9 : $PGCD(57, 9) = 3$.</li>
<li>• $8820 = 3150 × 2 + 2520$ ; $3150 = 2520 × 1 + 630$ ; $2520 = 630 × 4 + 0$ : <b>$PGCD(8820, 3150) = 630$</b>.<br>• $184 = 152 × 1 + 32$ ; $152 = 32 × 4 + 24$ ; $32 = 24 × 1 + 8$ ; $24 = 8 × 3 + 0$ : <b>$PGCD(152, 184) = 8$</b>.</li></ol>` }),

X('Exercice 2', { id: 'a4-2', niv: 2, src: 'TD', q: `<ol><li>Montrer que pour tout $n ∈ ℕ$, $2n + 1$ et $3n + 2$ sont premiers entre eux.</li><li>Déterminer le PGCD de $420$ et $637$, puis exprimer ce PGCD comme combinaison linéaire de ces deux nombres (Bézout).</li></ol>`,
indice: '1 : cherche deux entiers $u$ et $v$ tels que $u(2n+1) + v(3n+2)$ ne dépende plus de $n$. 2 : fais Euclide, puis remonte.',
meth: '1 : $3(2n+1) - 2(3n+2)$. 2 : Euclide jusqu’au dernier reste non nul, puis substitue de la fin vers le début.',
s: `<ol><li>$3(2n + 1) - 2(3n + 2) = 6n + 3 - 6n - 4 = -1$. Un diviseur commun de $2n + 1$ et $3n + 2$ divise $-1$ : il vaut $±1$. Donc $PGCD(2n + 1, 3n + 2) = 1$, ou encore, par Bézout, ils sont premiers entre eux.</li>
<li><b>Euclide :</b> $637 = 420 × 1 + 217$ ; $420 = 217 × 1 + 203$ ; $217 = 203 × 1 + 14$ ; $203 = 14 × 14 + 7$ ; $14 = 7 × 2 + 0$. Donc <b>$PGCD(420, 637) = 7$</b>.<br><b>Remontée :</b>$$7 = 203 - 14 × 14
 = 203 - 14(217 - 203) = 15 × 203 - 14 × 217 ;; 14 = 217 − 203
 = 15(420 - 217) - 14 × 217 = 15 × 420 - 29 × 217 ;; 203 = 420 − 217
 = 15 × 420 - 29(637 - 420) = 44 × 420 - 29 × 637 ;; 217 = 637 − 420$$<p>Contrôle : $44 × 420 = 18480$ et $29 × 637 = 18473$, d’où $18480 - 18473 = 7$ ✓.</p></li></ol>` }),

X('Exercice 3', { id: 'a4-3', niv: 2, src: 'TD', q: `<ol><li>Donner un contre-exemple montrant que l’hypothèse $PGCD(a, b) = 1$ est indispensable dans le lemme de Gauss.</li><li>Soient $a$ et $b$ deux entiers premiers entre eux. Montrer que si $a$ divise $n$ et $b$ divise $n$, alors le produit $ab$ divise $n$.</li><li>En déduire un critère de divisibilité simple par $45$.</li></ol>`,
indice: '1 : cherche $a, b, c$ avec $a | bc$ sans que $a$ divise $c$ ; ils ne seront pas premiers entre eux. 2 : écris $n = ak$ et applique Gauss à $b | ak$.',
meth: 'Lemme de Gauss : $a | bc$ et $PGCD(a, b) = 1 ⇒ a | c$. Pour 3, remarque que $45 = 5 × 9$.',
s: `<ol><li>Prenons $a = 6$, $b = 4$, $c = 3$ : $a | bc$ car $6 | 12$, mais $a ∤ c$ car $6 ∤ 3$. Ici $PGCD(6, 4) = 2 ≠ 1$ : sans l’hypothèse, la conclusion est fausse.</li>
<li>$a | n$ : $n = ak$ avec $k ∈ ℤ$. $b | n = ak$ et $PGCD(a, b) = 1$ (donc $PGCD(b, a) = 1$) : par le lemme de Gauss, $b | k$, soit $k = bk'$. Alors $n = abk'$ : $ab | n$.</li>
<li>$45 = 5 × 9$ et $PGCD(5, 9) = 1$. Par la question 2 : $45 | n ⇔ (5 | n$ et $9 | n)$. Un entier est divisible par 45 <b>si et seulement si</b> son dernier chiffre est 0 ou 5 <b>et</b> la somme de ses chiffres est divisible par 9.</li></ol>` }),

X('Exercice 4', { id: 'a4-4', niv: 3, src: 'Travail perso', q: `<ol><li>Déterminer un couple de coefficients de Bézout $(u, v)$ pour $a = 152$ et $b = 184$.</li><li>Démontrer que pour tout $n ∈ ℕ$, la fraction $frac{2n + 1}{5n + 3}$ est irréductible.</li><li>Soit $a ∈ ℤ$. Déterminer le PGCD $d$ de $m = 14a + 3$ et $n = 21a + 4$, puis trouver une relation de Bézout.</li></ol>`,
indice: '1 : tu as déjà l’algorithme d’Euclide de 152 et 184 (exercice 1). 2 et 3 : cherche une combinaison linéaire qui supprime $n$ (ou $a$).',
meth: '1 : remontée. 2 : $5(2n+1) - 2(5n+3)$. 3 : $3m - 2n$.',
s: `<ol><li>Euclide (exercice 1) : $184 = 152 + 32$, $152 = 32 × 4 + 24$, $32 = 24 + 8$. Remontée :$$8 = 32 - 24 = 32 - (152 - 4 × 32) = 5 × 32 - 152
 = 5(184 - 152) - 152 = 5 × 184 - 6 × 152$$<p>Donc $152 × (-6) + 184 × 5 = -912 + 920 = 8$ : <b>$(u, v) = (-6, 5)$</b>.</p></li>
<li>$5(2n + 1) - 2(5n + 3) = 10n + 5 - 10n - 6 = -1$. Donc $PGCD(2n + 1, 5n + 3)$ divise $-1$ : il vaut 1. La fraction est <b>irréductible</b>.</li>
<li>$3m - 2n = 3(14a + 3) - 2(21a + 4) = 42a + 9 - 42a - 8 = 1$. Donc $d | 1$ : <b>$d = 1$</b>, et la relation de Bézout est <b>$3m - 2n = 1$</b> (c’est-à-dire $u = 3$, $v = -2$).</li></ol>` })
]
},
{
id: 'a5', court: 'Équations diophantiennes', titre: 'Équations diophantiennes et applications', duree: '1 h 15',
resume: 'L’équation ax + by = c dans ℤ² : condition d’existence, méthode canonique, solutions générales et problèmes concrets.',
intro: 'Combien de billets à 14 € et à 21 € pour encaisser 287 € ? Quand on cherche des solutions <b>entières</b>, les équations changent de nature : parfois aucune solution, parfois une infinité. Bézout et Gauss donnent la méthode complète.',
objectifs: [
  'dire si $ax + by = c$ possède des solutions entières (<b>condition sur le PGCD</b>) ;',
  'résoudre l’équation avec la <b>méthode canonique</b> en 5 étapes ;',
  'écrire la <b>forme générale</b> des solutions avec un paramètre $k ∈ ℤ$ ;',
  '<b>modéliser</b> un problème concret et sélectionner les solutions positives.'
],
prerequis: ['Algorithme d’Euclide et théorème de Bézout (chapitre 4).', 'Le lemme de Gauss (chapitre 4).'],
sections: [
{ t: 'Définition et existence des solutions', h: `
${bDef('Équation diophantienne', `<p>Une <b>équation diophantienne</b> est une équation à coefficients entiers dont on cherche <b>exclusivement les solutions entières</b>. Du premier degré à deux inconnues, elle s’écrit</p>$$ax + by = c$$<p>où $a, b, c ∈ ℤ$ et où le couple d’inconnues $(x, y)$ est cherché dans $ℤ^2$.</p>`)}
${bThm('Existence de solutions entières', `<p>L’équation $ax + by = c$ admet des solutions dans $ℤ^2$ <b>si, et seulement si</b>, $d = PGCD(a, b)$ divise $c$ :</p>$$∃(x, y) ∈ ℤ^2, ax + by = c ⇔ PGCD(a, b) | c$$`)}
${bProof('pourquoi', '<p>Si $(x, y)$ est solution, $d$ divise $a$ et $b$ donc divise $ax + by = c$. Réciproquement, si $d | c$, on écrit $c = dc\'$ ; Bézout donne $au + bv = d$ et alors $a(uc\') + b(vc\') = c$.</p>')}
${bEx('Deux exemples', `<ul><li>$17x - 33y = 1$ admet des solutions car $PGCD(17, 33) = 1$ divise 1.</li><li>$8x - 4y = 3$ n’en admet <b>aucune</b> car $PGCD(8, 4) = 4$ ne divise pas 3 (le membre de gauche est toujours un multiple de 4).</li></ul>`)}
${quick('L’équation $6x + 9y = 5$ admet-elle des solutions entières ? (oui ou non)', 'non', '$PGCD(6, 9) = 3$ ne divise pas 5 : pas de solution. (Le membre de gauche est toujours multiple de 3.)')}` },

{ t: 'Méthode canonique de résolution', h: `
${bMeth('Résoudre ax + by = c dans ℤ²', `${steps([
  '<b>Condition d’existence</b> : calcule $d = PGCD(a, b)$ et vérifie que $d | c$. Sinon : aucune solution.',
  '<b>Simplification</b> : divise l’équation par $d$ pour obtenir $a′x + b′y = c′$ avec $PGCD(a′, b′) = 1$.',
  '<b>Solution particulière</b> $(x_0, y_0)$ : par Bézout/Euclide, ou « à l’œil » pour de petits nombres.',
  '<b>Soustraction et Gauss</b> : soustrais $a′x_0 + b′y_0 = c′$ pour obtenir $a′(x - x_0) = -b′(y - y_0)$, puis applique le lemme de Gauss.',
  '<b>Forme générale</b> : exprime toutes les solutions avec un paramètre $k ∈ ℤ$.'])}`)}
${bEx('Résoudre 17x − 33y = 1', `${steps([
  '$PGCD(17, 33) = 1$ divise 1 : il y a des solutions.',
  'Solution particulière évidente : $17 × 2 - 33 × 1 = 1$, donc $(x_0, y_0) = (2, 1)$.',
  'Par soustraction : $17(x - 2) = 33(y - 1)$.',
  '$33 | 17(x - 2)$ et $PGCD(17, 33) = 1$ : par Gauss, $33 | x - 2$, donc $x = 2 + 33k$, $k ∈ ℤ$.',
  'En réinjectant : $17 × 33k = 33(y - 1)$, donc $y = 1 + 17k$.'])}
<p>Ensemble des solutions : $S = \\{(2 + 33k, 1 + 17k), k ∈ ℤ\\}$.</p>`)}
${bThm('Forme générale (à connaître)', `<p>Si $d = PGCD(a, b)$ divise $c$ et si $(x_0, y_0)$ est une solution particulière, toutes les solutions sont</p>$$x = x_0 + frac{b}{d}k ;; k ∈ ℤ
y = y_0 - frac{a}{d}k$$`)}
${demo('dio', { dA: '17', dB: '5', dC: '3' }, 'Résous ax + by = c et vérifie ton paramètre')}
${bMeth('Si le PGCD n’est pas 1', `<p>On commence par <b>simplifier</b>. Exemple : $4x + 6y = 10$. $PGCD(4, 6) = 2$ divise 10 : on divise par 2 et on obtient $2x + 3y = 5$ ; solution particulière $(1, 1)$ ; solutions $x = 1 + 3k$, $y = 1 - 2k$.</p>`)}
${quick('Pour l’équation $17x + 5y = 3$, que vaut $y$ quand $x = -1$ ?', '4', '$17 × (-1) + 5y = 3$ donne $5y = 20$, soit $y = 4$ : le couple $(-1, 4)$ est une solution particulière.', 'Remplace $x$ par $-1$ puis isole $y$.')}` },

{ t: 'Applications concrètes et modélisation', h: `
<p>Dans un problème concret, les inconnues sont des <b>quantités</b> : elles doivent être des entiers <b>positifs</b>. On résout donc dans $ℤ$, puis on garde les solutions avec $x ≥ 0$ et $y ≥ 0$ en encadrant $k$.</p>
${bMeth('Résoudre un problème par une équation diophantienne', `${steps(['Choisis les <b>inconnues</b> et écris l’équation $ax + by = c$.', 'Résous dans $ℤ^2$ (méthode canonique).', 'Impose les <b>contraintes</b> ($x ≥ 0$, $y ≥ 0$) : cela donne un encadrement de $k$.', 'Liste les solutions <b>entières</b> $k$ qui conviennent et conclus par une phrase.'])}`)}
${bEx('Le cinéma', `<p>Deux tarifs : 14 € pour les abonnés, 21 € pour les non-abonnés. La recette d’une séance est de 287 €. Soient $a$ le nombre d’abonnés et $b$ celui de non-abonnés : $14a + 21b = 287$, soit $2a + 3b = 41$ (division par 7).</p>
<p>Solution particulière $(a, b) = (19, 1)$ ; solutions $a = 19 - 3k$, $b = 1 + 2k$. Contraintes : $b ≥ 0 ⇒ k ≥ 0$ ; $a ≥ 0 ⇒ k ≤ 6$. D’où <b>7 répartitions</b> pour $k = 0, …, 6$ :</p>
${tt(['k', '0', '1', '2', '3', '4', '5', '6'], [['abonnés a', 19, 16, 13, 10, 7, 4, 1], ['non-abonnés b', 1, 3, 5, 7, 9, 11, 13]], { num: true })}`)}
${bEx('Les stylos et les cahiers', `<p>Un client paie exactement 31 € des stylos à 5 € et des cahiers à 8 €. $5s + 8c = 31$ : $PGCD(5, 8) = 1$ ; solution particulière $(s, c) = (3, 2)$ ; solutions $s = 3 + 8k$, $c = 2 - 5k$. Positivité : $s ≥ 0 ⇒ k ≥ 0$ et $c ≥ 0 ⇒ k ≤ 0$ : seule $k = 0$ convient. Le client a acheté <b>3 stylos et 2 cahiers</b>.</p>`)}` }
],
retenir: [
  '$ax + by = c$ admet des solutions dans $ℤ^2$ <b>ssi $PGCD(a, b) | c$</b>.',
  'Méthode : (1) existence ; (2) simplifier par $d$ ; (3) solution particulière ; (4) soustraire et appliquer Gauss ; (5) forme générale.',
  'Solutions générales : $x = x_0 + frac{b}{d}k$ et $y = y_0 - frac{a}{d}k$, avec $k ∈ ℤ$.',
  'Pour un problème concret : résoudre dans $ℤ$, puis imposer $x ≥ 0$ et $y ≥ 0$ pour encadrer $k$.',
  'On vérifie toujours une solution particulière en la remplaçant dans l’équation.'
],
pieges: [
  ['Oublier la condition d’existence', 'Avant de chercher quoi que ce soit, vérifie que $PGCD(a, b)$ divise $c$.'],
  ['Mauvais signe dans la forme générale', '$x = x_0 + frac{b}{d}k$ mais $y = y_0 - frac{a}{d}k$ : un « + » et un « − ». Vérifie avec $k = 1$.'],
  ['Négliger les contraintes', 'Dans un problème concret, il faut encadrer $k$ pour garder des quantités positives.']
],
quiz: [
  Q('L’équation 6x + 9y = 5 admet-elle des solutions entières ?', ['Non, car PGCD(6, 9) = 3 ne divise pas 5', 'Oui, une infinité', 'Oui, une seule', 'Non, car 5 est impair'], 'Le membre de gauche est toujours multiple de 3, pas 5.'),
  Q('Une solution particulière de 17x + 5y = 3 est…', ['(−1 ; 4)', '(1 ; 3)', '(3 ; −1)', '(2 ; −7)'], '17 × (−1) + 5 × 4 = −17 + 20 = 3.'),
  Q('Cinéma : 14 € (abonnés), 21 € (non-abonnés), recette 287 €. Combien de répartitions (a, b) ∈ ℕ² ?', ['7', '6', '13', '1'], '2a + 3b = 41 : b impair de 1 à 13, soit 7 couples de (19 ; 1) à (1 ; 13).'),
  Q('Combien de couples d’entiers naturels (x, y) vérifient xy − 5x − 5y − 7 = 0 ?', ['6', '4', '8', '1'], '(x − 5)(y − 5) = 32 avec deux facteurs positifs : (1, 32), (2, 16), (4, 8) et les symétriques.'),
  Q('L’équation 221x + 247y = 15 admet-elle des solutions ?', ['Non, car PGCD(221, 247) = 13 ne divise pas 15', 'Oui', 'Seulement dans ℕ', 'Non, car 15 est impair'], '221 = 13 × 17 et 247 = 13 × 19 : le PGCD est 13, qui ne divise pas 15.'),
  Q('Si (x₀, y₀) est solution de ax + by = c avec d = PGCD(a, b), les solutions générales sont…', ['x = x₀ + (b/d)k, y = y₀ − (a/d)k', 'x = x₀ + ak, y = y₀ + bk', 'x = x₀ + bk, y = y₀ + ak', 'x = x₀ − (b/d)k, y = y₀ − (a/d)k'], 'On vérifie : a(b/d)k − b(a/d)k = 0, donc la combinaison reste égale à c.'),
  Q('Dans la méthode canonique, quel théorème permet de passer de a′(x − x₀) = −b′(y − y₀) à x − x₀ = b′k ?', ['le lemme de Gauss', 'le théorème de Bézout', 'le test de primalité', 'la division euclidienne'], 'a′ divise b′(y − y₀) avec PGCD(a′, b′) = 1 : Gauss donne a′ | y − y₀, etc.'),
  Q('Un client paie 31 € avec des stylos à 5 € et des cahiers à 8 €. Combien de solutions (s, c) ∈ ℕ² ?', ['1 : 3 stylos et 2 cahiers', '2', '0', 'une infinité'], '5s + 8c = 31 : s = 3 + 8k, c = 2 − 5k, seule k = 0 donne deux entiers positifs.')
],
cartes: [
  C('Quand ax + by = c a-t-elle des solutions entières ?', 'Si et seulement si PGCD(a, b) divise c.'),
  C('Solutions générales de ax + by = c', 'Avec d = PGCD(a, b) et (x₀, y₀) particulière :\nx = x₀ + (b/d)k, y = y₀ − (a/d)k, k ∈ ℤ.'),
  C('Méthode de résolution de ax + by = c', '1. d | c ?\n2. Simplifier par d.\n3. Solution particulière (Bézout).\n4. Soustraire + Gauss.\n5. Forme générale avec k.'),
  C('Problème concret : que faire après avoir résolu dans ℤ ?', 'Imposer x ≥ 0 et y ≥ 0 pour encadrer k, puis lister les solutions entières de k.'),
  C('Que faire si PGCD(a, b) ≠ 1 ?', 'Diviser toute l’équation par d (si d | c) pour se ramener à des coefficients premiers entre eux.')
],
exos: [
X('Exercice 1', { id: 'a5-1', niv: 1, src: 'TD', q: `<p>Déterminer, si elles existent, les solutions entières des équations diophantiennes suivantes :</p><ol><li>$17x + 5y = 3$</li><li>$6x + 9y = 5$</li><li>$221x + 247y = 15$</li></ol>`,
indice: 'Commence toujours par calculer le PGCD des deux coefficients et vérifie qu’il divise le second membre.',
meth: 'Méthode canonique : existence, solution particulière (à l’œil ou par Bézout), forme générale.',
s: `<ol><li>$PGCD(17, 5) = 1$ divise 3 : il y a des solutions. Solution particulière : $(x_0, y_0) = (-1, 4)$ car $17 × (-1) + 5 × 4 = 3$. On soustrait : $17(x + 1) + 5(y - 4) = 0$, soit $17(x + 1) = -5(y - 4)$. $5 | 17(x + 1)$ avec $PGCD(5, 17) = 1$ : par Gauss, $5 | x + 1$, donc $x = -1 + 5k$ ; puis $y = 4 - 17k$. <b>$S = \\{(-1 + 5k, 4 - 17k), k ∈ ℤ\\}$</b> (contrôle $k = 1$ : $17 × 4 + 5 × (-13) = 68 - 65 = 3$ ✓).</li>
<li>$PGCD(6, 9) = 3$ ne divise pas 5 : <b>aucune solution</b>.</li>
<li>$221 = 13 × 17$ et $247 = 13 × 19$, donc $PGCD(221, 247) = 13$. $13 ∤ 15$ : <b>aucune solution</b>.</li></ol>` }),

X('Exercice 2', { id: 'a5-2', niv: 2, src: 'TD', q: `<p>Un cinéma propose deux tarifs : $14$ euros pour les abonnés et $21$ euros pour les non-abonnés. La recette totale d’une séance s’élève à $287$ euros.</p><ol><li>Modéliser le problème par une équation diophantienne.</li><li>Déterminer toutes les répartitions possibles du nombre de spectateurs.</li></ol>`,
indice: 'Appelle $a$ le nombre d’abonnés et $b$ celui de non-abonnés. Tu peux simplifier l’équation par 7.',
meth: 'Résous dans $ℤ$, puis impose $a ≥ 0$ et $b ≥ 0$ pour encadrer le paramètre $k$.',
s: `<ol><li>$a$ abonnés, $b$ non-abonnés (entiers positifs) : <b>$14a + 21b = 287$</b>. Comme $PGCD(14, 21) = 7$ divise 287 ($287 = 7 × 41$), on simplifie : $2a + 3b = 41$.</li>
<li>Solution particulière : $(a_0, b_0) = (19, 1)$ car $38 + 3 = 41$. Solutions : $a = 19 - 3k$, $b = 1 + 2k$, $k ∈ ℤ$ (contrôle : $2(19 - 3k) + 3(1 + 2k) = 41$ ✓).<br>Contraintes : $b ≥ 0 ⇒ k ≥ 0$ ; $a ≥ 0 ⇒ 19 - 3k ≥ 0 ⇒ k ≤ 6$. Donc $k ∈ \\{0, …, 6\\}$ : <b>7 répartitions</b> $(a, b)$ : $(19, 1), (16, 3), (13, 5), (10, 7), (7, 9), (4, 11), (1, 13)$.</li></ol>` }),

X('Exercice 3', { id: 'a5-3', niv: 2, src: 'TD', q: `<p>Un marchand vend des stylos à $5$ euros et des cahiers à $8$ euros. Un client paie exactement $31$ euros. Quelles sont les quantités d’articles achetés possibles ?</p>`,
indice: 'Pose $5s + 8c = 31$ avec $s$ et $c$ positifs. Une solution particulière se trouve en essayant $c = 0, 1, 2, …$',
meth: 'Forme générale puis encadrement de $k$ par les deux contraintes de positivité.',
s: `<p>$5s + 8c = 31$ avec $(s, c) ∈ ℕ^2$. $PGCD(5, 8) = 1$ divise 31. Solution particulière : $c = 2$ donne $5s = 15$, $s = 3$ : $(3, 2)$. Solutions : $s = 3 + 8k$, $c = 2 - 5k$. <br>Contraintes : $s ≥ 0 ⇒ k ≥ 0$ (car $3 + 8k ≥ 0 ⇒ k ≥ -0{,}375$) ; $c ≥ 0 ⇒ 2 - 5k ≥ 0 ⇒ k ≤ 0{,}4$. Donc $k = 0$.<br><b>Conclusion :</b> le client achète <b>3 stylos et 2 cahiers</b>, et c’est la seule possibilité ($15 + 16 = 31$ ✓).</p>` }),

X('Exercice 4', { id: 'a5-4', niv: 3, src: 'Travail perso', q: `<ol><li>Déterminer toutes les solutions entières de l’équation : $4235x + 42y = 14$.</li><li>Un entier $n$ est tel que $n$ divisé par $7$ donne un reste de $1$, et $n$ divisé par $11$ donne un reste de $3$. Déterminer les deux plus petits entiers $n > 0$ vérifiant ces conditions.</li></ol>`,
indice: '1 : calcule le PGCD de 4235 et 42, puis simplifie. 2 : écris $n = 7a + 1 = 11b + 3$ : tu obtiens une équation diophantienne en $a$ et $b$.',
meth: '1 : Euclide, simplifier, Bézout, forme générale. 2 : $7a - 11b = 2$ ; une solution particulière donne $n$ modulo 77.',
s: `<ol><li>Euclide : $4235 = 42 × 100 + 35$ ; $42 = 35 + 7$ ; $35 = 7 × 5$. $PGCD = 7$ divise 14 : on simplifie par 7 : $605x + 6y = 2$. Bézout pour $605$ et $6$ : $605 = 6 × 100 + 5$ ; $6 = 5 + 1$, donc $1 = 6 - 5 = 6 - (605 - 6 × 100) = 6 × 101 - 605$, soit $605 × (-1) + 6 × 101 = 1$. En multipliant par 2 : solution particulière $(x_0, y_0) = (-2, 202)$ ($605 × (-2) + 6 × 202 = -1210 + 1212 = 2$ ✓). Solutions : <b>$x = -2 + 6k$, $y = 202 - 605k$, $k ∈ ℤ$</b>.</li>
<li>$n = 7a + 1 = 11b + 3$ donne $7a - 11b = 2$. Bézout : $11 = 7 + 4$, $7 = 4 + 3$, $4 = 3 + 1$, donc $1 = 4 - 3 = 4 - (7 - 4) = 2 × 4 - 7 = 2(11 - 7) - 7 = 2 × 11 - 3 × 7$, soit $7 × (-3) - 11 × (-2) = 1$. En multipliant par 2 : $7 × (-6) - 11 × (-4) = 2$ : $a_0 = -6$. Solutions : $a = -6 + 11k$, donc $n = 7a + 1 = -41 + 77k$. Les entiers $n > 0$ sont ceux de la forme $-41 + 77k$ avec $k ≥ 1$ : $n = 36$ (pour $k = 1$) et $n = 113$ (pour $k = 2$). <b>Réponse : 36 et 113</b> (contrôle : $36 = 7 × 5 + 1 = 11 × 3 + 3$ ✓ ; $113 = 7 × 16 + 1 = 11 × 10 + 3$ ✓).</li></ol>` })
]
},
{
id: 'a6', court: 'Congruences', titre: 'Congruences modulo n et calcul modulaire', duree: '1 h 30',
resume: 'Congruences, compatibilité avec + et ×, restes de puissances, tableaux de congruence, preuves de divisibilité.',
intro: 'L’opérateur <code>%</code> que tu utilises en programmation a une théorie : les <b>congruences</b>. Elle permet de calculer le reste de $2^{100}$ par 7 en trois lignes, de vérifier un numéro de sécu, de comprendre un hachage ou un chiffrement.',
objectifs: [
  'calculer la <b>classe</b> d’un entier modulo $n$ (reste dans $\\{0, …, n-1\\}$) ;',
  'passer de $a ≡ b (n)$ à « $n$ divise $a - b$ » et inversement ;',
  'utiliser la <b>compatibilité</b> avec l’addition, la multiplication et les puissances ;',
  'déterminer le <b>reste d’une puissance</b> en cherchant une période ;',
  'dresser un <b>tableau de congruence</b> et démontrer une divisibilité.'
],
prerequis: ['La division euclidienne (chapitre 1).', 'La divisibilité et les combinaisons linéaires.'],
sections: [
{ t: 'Congruence modulo n', h: `
${bDef('Congruence modulo n', `<p>Soit $n ≥ 2$ un entier naturel. Deux entiers relatifs $a$ et $b$ sont <b>congrus modulo $n$</b> si, et seulement si, $a$ et $b$ ont <b>le même reste</b> dans la division euclidienne par $n$. On note</p>$$a ≡ b (n) ou a ≡ b mod n$$`)}
${bEx('Deux congruences', `<ul><li>$57 ≡ 15 (7)$ car $57 = 7 × 8 + 1$ et $15 = 7 × 2 + 1$ (même reste 1).</li><li>$41 ≡ -4 (9)$ car $41 = 9 × 4 + 5$ et $-4 = 9 × (-1) + 5$ (même reste 5).</li></ul>`)}
<p>Imagine une <b>horloge</b> à $n$ cases numérotées de $0$ à $n - 1$ : $a ≡ r (n)$ signifie qu’après avoir avancé de $a$ crans, tu te retrouves sur la case $r$. Pour les nombres négatifs, tu recules.</p>
${demo('clock', { ckA: '41', ckN: '9' }, 'L’horloge modulaire : essaie a = −4, n = 9')}
${bMeth('Trouver la classe de a modulo n', `<p>Divise $a$ par $n$ et garde le <b>reste</b> $r$ avec $0 ≤ r < n$. Pour $a < 0$, ajoute des multiples de $n$ jusqu’à tomber dans $\\{0, …, n-1\\}$ : $-12 ≡ 3 (5)$ car $-12 + 15 = 3$.</p>`)}
${quick('Dans quelle case tombe $-12$ sur une horloge à 5 cases ? (reste de $-12$ modulo 5)', '3', '$-12 + 15 = 3$ avec $0 ≤ 3 < 5$ : donc $-12 ≡ 3 (5)$.', 'Ajoute un multiple de 5 pour revenir entre 0 et 4.')}` },

{ t: 'Propriétés fondamentales', h: `
${bProp('Lien avec la divisibilité', `<p>Soient $n ≥ 2$ et $a, b ∈ ℤ$. Deux entiers sont congrus modulo $n$ si et seulement si leur <b>différence est un multiple de $n$</b> :</p>$$a ≡ b (n) ⇔ n | a - b ⇔ a - b ≡ 0 (n)$$`)}
${bEx('124 ≡ 1 (3)', '<p>$124 - 1 = 123 = 3 × 41$, donc $3 | 123$ et $124 ≡ 1 (3)$.</p>')}
${bProp('Relation d’équivalence', `<p>La congruence modulo $n$ est une <b>relation d’équivalence</b> sur $ℤ$ :</p><ol><li><b>Réflexivité</b> : $a ≡ a (n)$.</li><li><b>Symétrie</b> : si $a ≡ b (n)$ alors $b ≡ a (n)$.</li><li><b>Transitivité</b> : si $a ≡ b (n)$ et $b ≡ c (n)$, alors $a ≡ c (n)$.</li></ol><p>Elle partage $ℤ$ en $n$ <b>classes</b> : celles des restes $0, 1, …, n-1$.</p>`)}
${bRem('Pourquoi c’est puissant', '<p>Comme un entier est congru à son reste, on peut remplacer n’importe quel nombre par un <b>petit représentant</b> de sa classe (même négatif : $-1 ≡ 6 (7)$) et calculer avec celui-ci.</p>')}` },

{ t: 'Compatibilité avec les opérations', h: `
${bThm('Compatibilité algébrique', `<p>Soit $n ≥ 2$. Si $a ≡ b (n)$ et $c ≡ d (n)$, alors :</p><ul>
<li><b>Addition</b> : $a + c ≡ b + d (n)$</li><li><b>Multiplication</b> : $ac ≡ bd (n)$</li><li><b>Puissance</b> : pour tout $k ∈ ℕ$, $a^k ≡ b^k (n)$</li></ul>`)}
${bProof('addition et multiplication', '<p>Écris $a = b + nu$ et $c = d + nv$. Alors $a + c = b + d + n(u + v)$ et $ac = bd + n(bv + du + nuv)$ : dans les deux cas, la différence est un multiple de $n$. La puissance se déduit de la multiplication par récurrence.</p>')}
${bEx('Calculer sans calculatrice', `<p>Reste de $15 × 6^{43} - 48$ par 7. On a $15 ≡ 1$, $6 ≡ -1$ et $48 ≡ 6 (7)$. Donc $6^{43} ≡ (-1)^{43} = -1$ et</p>$$15 × 6^{43} - 48 ≡ 1 × (-1) - 6 = -7 ≡ 0 (7)$$<p>Le nombre est divisible par 7.</p>`)}
${bTrap('On ne simplifie pas n’importe comment', `<p>On peut ajouter, soustraire, multiplier, élever à une puissance. En revanche, <b>on ne divise pas</b> librement : $2 × 3 ≡ 2 × 6 (6)$ (les deux valent 0) mais $3 ≢ 6 (6)$. On ne peut simplifier par 2 que si 2 est <b>premier avec le module</b> (voir le chapitre 7).</p>`)}
${quick('Que vaut le reste de $50^{100}$ modulo 7 ? ($50 = 49 + 1$)', '1', '$50 ≡ 1 (7)$ donc $50^{100} ≡ 1^{100} = 1 (7)$.')}` },

{ t: 'Reste d’une puissance : chercher la période', h: `
<p>Pour calculer $a^k$ modulo $n$ avec un grand $k$, on calcule les premières puissances jusqu’à retrouver une valeur <b>déjà vue</b> : les restes se répètent avec une <b>période</b>.</p>
${bMeth('Reste de a^k modulo n', `${steps(['Calcule $a^0, a^1, a^2, …$ modulo $n$ jusqu’à retomber sur 1 (ou sur une valeur déjà rencontrée) : tu obtiens la <b>période</b> $T$.', 'Écris la division de l’exposant : $k = Tq + s$.', 'Alors $a^k = (a^T)^q a^s ≡ a^s (n)$ si $a^T ≡ 1$.'])}`)}
${bEx('Le reste de 2¹⁰⁰ modulo 7', `<p>$2^0 = 1$, $2^1 = 2$, $2^2 = 4$, $2^3 = 8 ≡ 1 (7)$ : la période est <b>3</b>. $100 = 3 × 33 + 1$, donc</p>$$2^{100} = (2^3)^{33} × 2 ≡ 1^{33} × 2 = 2 (7)$$`)}
${tt(['n', '0', '1', '2', '3', '4', '5'], [['2ⁿ mod 7', 1, 2, 4, 1, 2, 4]], { num: true })}
${demo('cong', null, 'Congruences : testez des puissances (section « Reste de aᵏ »)')}
${quick('Reste de $2^{100}$ modulo 7 ?', '2', 'Période 3 ($2^3 ≡ 1$) et $100 = 3 × 33 + 1$ : $2^{100} ≡ 2^1 = 2$.', 'Cherche d’abord la plus petite puissance de 2 congrue à 1 modulo 7.')}` },

{ t: 'Tableaux de congruence', h: `
<p>Un <b>tableau de congruence</b> analyse <b>tous les cas</b> selon le reste possible modulo $n$. Comme il n’y a que $n$ restes, on peut les passer tous en revue.</p>
${bEx('Les carrés modulo 7', `<p>Déterminer, suivant les valeurs de l’entier $n$, le reste de $n^2$ modulo 7 :</p>${tt(['Reste de n (7)', '0', '1', '2', '3', '4', '5', '6'], [['Reste de n² (7)', 0, 1, 4, 2, 2, 4, 1]], { num: true })}
<p>Par exemple $3^2 = 9 ≡ 2$ et $5^2 = 25 ≡ 4 (7)$. Les carrés ont pour reste $0, 1, 2$ ou $4$ — jamais $3, 5$ ou $6$. En particulier $x^2 ≡ 2 (7) ⇔ x ≡ 3$ ou $x ≡ 4 (7)$.</p>`)}
${bMeth('Résoudre une équation avec un tableau', '<p>Quand $n$ est petit, on calcule la valeur de l’expression pour <b>chaque</b> reste $0, …, n-1$ et on lit les restes qui conviennent. Pour $4x ≡ 5 (9)$ : $4x$ modulo 9 vaut $0, 4, 8, 3, 7, 2, 6, 1, 5$ pour $x = 0, …, 8$ : seul $x = 8$ convient.</p>')}
<h3>Démontrer une divisibilité</h3>
${bEx('7 divise 3²ⁿ⁺¹ + 2ⁿ⁺²', `<p>$3^{2n+1} = 3 × 9^n ≡ 3 × 2^n (7)$ car $9 ≡ 2$. Et $2^{n+2} = 4 × 2^n$. Donc $3^{2n+1} + 2^{n+2} ≡ 3 × 2^n + 4 × 2^n = 7 × 2^n ≡ 0 (7)$ pour tout $n ∈ ℕ$. ∎</p>`)}
${bMeth('Prouver « d divise A(n) » avec les congruences', '<p>Réduis chaque terme modulo $d$ avec des puissances de $n$ (ou d’un autre paramètre), regroupe les termes semblables : si le total est congru à 0, c’est gagné.</p>')}` }
],
retenir: [
  '$a ≡ b (n)$ : $a$ et $b$ ont <b>le même reste</b> par $n$ ; équivalent à « $n$ divise $a - b$ ».',
  '<b>Relation d’équivalence</b> : réflexive, symétrique, transitive ; $n$ classes, de représentants $0, …, n-1$.',
  '<b>Compatibilité</b> : on peut additionner, multiplier et élever à une puissance deux congruences de même module.',
  'Reste de $a^k$ : on cherche la <b>période</b> des puissances ($a^T ≡ 1$) et on réduit l’exposant.',
  'Les carrés modulo 7 valent $0, 1, 2, 4$ ; $x^2 ≡ 2 (7) ⇔ x ≡ 3$ ou $4 (7)$.',
  'Pour résoudre ou démontrer avec un petit module : le <b>tableau de congruence</b> passe en revue tous les restes.'
],
pieges: [
  ['Le signe du reste', 'Le reste est dans $\\{0, …, n-1\\}$ : $-12 ≡ 3 (5)$, pas $-2$ (même si $-2$ est un autre représentant de la même classe).'],
  ['Diviser une congruence', 'On ne simplifie pas librement : $2a ≡ 2b (n)$ n’entraîne $a ≡ b (n)$ que si $PGCD(2, n) = 1$.'],
  ['Confondre ≡ et =', '$a ≡ b (n)$ ne veut pas dire $a = b$ : ils ont le même reste, pas la même valeur.']
],
quiz: [
  Q('Quel est le reste de 2¹⁰⁰ dans la division par 7 ?', ['2', '1', '4', '6'], '2³ ≡ 1 (7) et 100 = 3 × 33 + 1, donc 2¹⁰⁰ ≡ 2.'),
  Q('Les restes possibles de n² dans la division par 7 sont…', ['0, 1, 2, 4', '0, 1, 4', '0, 1, 2, 3, 4, 5, 6', '1, 2, 4'], 'n ≡ 0, 1, …, 6 donne n² ≡ 0, 1, 4, 2, 2, 4, 1.'),
  Q('Le nombre 3 divise-t-il toujours 4ⁿ + 2 ?', ['Oui, car 4 ≡ 1 (3) donc 4ⁿ + 2 ≡ 1 + 2 ≡ 0', 'Non', 'Seulement si n est pair', 'Seulement si n est impair'], '4 ≡ 1 (3) donne 4ⁿ ≡ 1, donc 4ⁿ + 2 ≡ 3 ≡ 0 (3).'),
  Q('Restes de 2ⁿ modulo 7 pour n = 0, 1, 2, 3, 4 :', ['1, 2, 4, 1, 2', '1, 2, 4, 8, 16', '1, 2, 3, 4, 5', '2, 4, 1, 2, 4'], '2³ = 8 ≡ 1 : la suite des restes est 1, 2, 4, 1, 2, 4, …'),
  Q('Les solutions de 4x ≡ 5 (mod 9) sont…', ['x ≡ 8 (mod 9)', 'x ≡ 5 (mod 9)', 'x ≡ 4 (mod 9)', 'aucune'], '4 × 8 = 32 = 9 × 3 + 5 : x = 8 convient, et c’est la seule classe.'),
  Q('Les solutions de 5x ≡ 3 (mod 11) sont…', ['x ≡ 5 (mod 11)', 'x ≡ 3 (mod 11)', 'x ≡ 9 (mod 11)', 'aucune'], '5 × 5 = 25 = 11 × 2 + 3 : x ≡ 5.'),
  Q('Si a ≡ b (n) et c ≡ d (n), laquelle est vraie ?', ['ac ≡ bd (n)', 'a/c ≡ b/d (n)', 'a − c ≡ 0 (n)', 'a ≡ d (n)'], 'La compatibilité permet +, −, × et les puissances. Pas la division en général.'),
  Q('Quel est le reste de −85 dans la division par 7 ?', ['6', '1', '−1', '5'], '−85 + 91 = 6 avec 0 ≤ 6 < 7.'),
  Q('124 ≡ 1 (3) car…', ['3 divise 124 − 1 = 123', '124 est pair', '3 divise 124', '124 = 3 × 41 + 2'], 'a ≡ b (n) équivaut à n | a − b.'),
  Q('Tout entier est congru modulo 6 à l’un des entiers 0, 1, 2, 3, −1, −2 :', ['vrai (−1 ≡ 5 et −2 ≡ 4)', 'faux', 'vrai seulement pour les pairs', 'vrai seulement pour les impairs'], 'Les restes possibles sont 0 à 5 ; 4 ≡ −2 et 5 ≡ −1 (mod 6).')
],
cartes: [
  C('Définition de a ≡ b (mod n)', 'n divise a − b, ou a et b ont le même reste par n.'),
  C('Relation d’équivalence', 'Réflexive (a ≡ a), symétrique (a ≡ b ⇒ b ≡ a), transitive (a ≡ b et b ≡ c ⇒ a ≡ c).'),
  C('Compatibilité des congruences', 'a ≡ b et c ≡ d (mod n) ⇒ a + c ≡ b + d, ac ≡ bd, aᵏ ≡ bᵏ.'),
  C('Calculer aᵏ mod n', 'Chercher la période des puissances.\nEx. : 2³ ≡ 1 (mod 7), donc 2¹⁰⁰ = (2³)³³ × 2 ≡ 2.'),
  C('Restes de n² modulo 7', '0, 1, 4, 2, 2, 4, 1 pour n ≡ 0, …, 6.\nDonc x² ≡ 2 (mod 7) ⇔ x ≡ 3 ou 4.'),
  C('Reste d’un entier négatif', 'On ajoute un multiple de n pour retomber dans {0, …, n−1}.\nEx. : −12 ≡ 3 (mod 5).'),
  C('Peut-on diviser une congruence ?', 'Pas librement : on ne peut simplifier par c que si PGCD(c, n) = 1 (voir congruences linéaires).'),
  C('Comment prouver n | A(k) avec les congruences ?', 'Réduire chaque terme modulo n, regrouper, vérifier que le total est ≡ 0.')
],
exos: [
X('Exercice 1', { id: 'a6-1', niv: 1, src: 'TD', q: `<p>Déterminer la congruence modulo $n$ (reste dans $\\{0, …, n - 1\\}$) pour :</p><ol><li>Modulo $5$ des nombres : $12$, $45$, $87$, $-12$, $104$.</li><li>Modulo $7$ des nombres : $-14$, $-85$, $24$, $46$.</li><li>Quels sont les restes possibles dans une division euclidienne par $9$ ?</li></ol>`,
indice: 'Pour un nombre négatif, ajoute des multiples de $n$ jusqu’à obtenir un entier entre 0 et $n - 1$.',
meth: 'Division euclidienne par $n$, ou ajout/retrait de multiples de $n$.',
s: `<ol><li>Modulo 5 : $12 = 5 × 2 + 2$ → <b>2</b> ; $45 = 5 × 9$ → <b>0</b> ; $87 = 5 × 17 + 2$ → <b>2</b> ; $-12 = 5 × (-3) + 3$ → <b>3</b> ; $104 = 5 × 20 + 4$ → <b>4</b>.</li>
<li>Modulo 7 : $-14 = 7 × (-2)$ → <b>0</b> ; $-85 = 7 × (-13) + 6$ → <b>6</b> ; $24 = 7 × 3 + 3$ → <b>3</b> ; $46 = 7 × 6 + 4$ → <b>4</b>.</li>
<li>Les restes possibles par 9 sont <b>$0, 1, 2, 3, 4, 5, 6, 7, 8$</b> (tous les entiers $r$ tels que $0 ≤ r < 9$) : 9 valeurs.</li></ol>` }),

X('Exercice 2', { id: 'a6-2', niv: 2, src: 'TD', q: `<ol><li>Déterminer le reste dans la division euclidienne par $7$ des nombres : $50^{100}$ ; $100^3$ ; $50^{100} + 100^{100}$ ; $15 × 6^{43} - 48$.</li><li>Résoudre dans $ℤ$ l’équation de congruence : $4x ≡ 5 (9)$.</li><li>Résoudre dans $ℤ$ l’équation de congruence : $5x ≡ 3 (11)$.</li></ol>`,
indice: 'Remplace chaque base par un petit représentant de sa classe modulo 7 ($50 ≡ 1$, $100 ≡ 2$, $6 ≡ -1$). Pour les équations, calcule $4x$ (resp. $5x$) pour chaque valeur de $x$.',
meth: 'Compatibilité avec les puissances ; période de $2^n$ modulo 7 ; tableau de congruence pour les équations.',
s: `<ol><li>$50 = 49 + 1 ≡ 1$ et $100 = 98 + 2 ≡ 2 (7)$. <br>• $50^{100} ≡ 1^{100} = 1$ : reste <b>1</b>.<br>• $100^3 ≡ 2^3 = 8 ≡ 1$ : reste <b>1</b>.<br>• $100^{100} ≡ 2^{100} = (2^3)^{33} × 2 ≡ 2$, donc $50^{100} + 100^{100} ≡ 1 + 2 = 3$ : reste <b>3</b>.<br>• $15 ≡ 1$, $6 ≡ -1$, $48 ≡ 6 (7)$ : $15 × 6^{43} - 48 ≡ 1 × (-1) - 6 = -7 ≡ 0$ : reste <b>0</b>.<p class="muted">(Les écritures du livret perdent leurs exposants à l’impression ; on les lit comme des puissances.)</p></li>
<li>$4x$ modulo 9 pour $x = 0, 1, …, 8$ : $0, 4, 8, 3, 7, 2, 6, 1, 5$. La valeur 5 est atteinte pour $x = 8$. <b>$x ≡ 8 (9)$</b>, c’est-à-dire $x = 8 + 9k$, $k ∈ ℤ$. (Autre méthode : l’inverse de 4 modulo 9 est 7 car $4 × 7 = 28 ≡ 1$ ; donc $x ≡ 7 × 5 = 35 ≡ 8$.)</li>
<li>$5x$ modulo 11 pour $x = 0, …, 10$ : $0, 5, 10, 4, 9, 3, 8, 2, 7, 1, 6$. La valeur 3 est atteinte pour $x = 5$. <b>$x ≡ 5 (11)$</b>. (Inverse de 5 modulo 11 : 9, car $5 × 9 = 45 ≡ 1$ ; $x ≡ 9 × 3 = 27 ≡ 5$.)</li></ol>` }),

X('Exercice 3', { id: 'a6-3', niv: 2, src: 'TD', q: `<p>Déterminer, suivant les valeurs de l’entier relatif $n$, le reste de la division de $n^2$ par $7$ :</p>${tt(['Reste de n (7)', '0', '1', '2', '3', '4', '5', '6'], [['Reste de n² (7)', '', '', '', '', '', '', '']], { num: true, raw: true })}<p>En déduire toutes les solutions entières de l’équation : $x^2 ≡ 2 (7)$.</p>`,
indice: 'Élève au carré chaque reste $r$ de 0 à 6, puis réduis modulo 7 ($3^2 = 9 ≡ 2$, $4^2 = 16 ≡ 2$…).',
meth: '$n ≡ r (7) ⇒ n^2 ≡ r^2 (7)$ : il suffit de traiter les 7 restes.',
s: `${tt(['Reste de n (7)', '0', '1', '2', '3', '4', '5', '6'], [['Reste de n² (7)', 0, 1, 4, 2, 2, 4, 1]], { num: true })}<p>($0^2 = 0$ ; $1$ ; $2^2 = 4$ ; $3^2 = 9 ≡ 2$ ; $4^2 = 16 ≡ 2$ ; $5^2 = 25 ≡ 4$ ; $6^2 = 36 ≡ 1$.)</p><p>Le reste 2 apparaît pour $n ≡ 3$ et $n ≡ 4 (7)$. Donc <b>$x^2 ≡ 2 (7) ⇔ x ≡ 3 (7)$ ou $x ≡ 4 (7)$</b>, soit $x = 3 + 7k$ ou $x = 4 + 7k$, $k ∈ ℤ$.</p>` }),

X('Exercice 4', { id: 'a6-4', niv: 3, src: 'TD', q: `<p>Démonstrations de divisibilité :</p><ol><li>Démontrer que pour tout entier $n ∈ ℕ$, $3^{n+3} - 4^{4n+2}$ est divisible par $11$.</li><li>Démontrer que pour tout entier $n ∈ ℕ$, $3^{2n+1} + 2^{n+2}$ est divisible par $7$.</li></ol>`,
indice: 'Écris chaque puissance sous la forme (constante) × (puissance de $n$ avec une base simple) et réduis les constantes modulo 11 (resp. 7).',
meth: 'Compatibilité : $3^{n+3} = 27 × 3^n$ ; $4^{4n+2} = 16 × 256^n$. Réduis $27$, $16$, $256$ modulo 11.',
s: `<ol><li>$3^{n+3} = 27 × 3^n ≡ 5 × 3^n (11)$ (car $27 = 22 + 5$). $4^{4n+2} = 16 × (4^4)^n = 16 × 256^n$, avec $16 ≡ 5$ et $256 = 253 + 3 ≡ 3 (11)$, donc $4^{4n+2} ≡ 5 × 3^n$. Alors $3^{n+3} - 4^{4n+2} ≡ 5 × 3^n - 5 × 3^n = 0 (11)$. ∎ (Contrôle : $n = 0$ : $27 - 16 = 11$ ✓.)</li>
<li>$3^{2n+1} = 3 × 9^n ≡ 3 × 2^n (7)$ car $9 ≡ 2$. $2^{n+2} = 4 × 2^n$. Donc $3^{2n+1} + 2^{n+2} ≡ (3 + 4) × 2^n = 7 × 2^n ≡ 0 (7)$. ∎ (Contrôle : $n = 0$ : $3 + 4 = 7$ ✓.)</li></ol>` }),

X('Exercice 5', { id: 'a6-5', niv: 3, src: 'Travail perso', q: `<ol><li>La proposition suivante est-elle vraie ou fausse ? « Tout entier est congru modulo 6 à l’un des entiers $0, 1, 2, 3, -1$ ou $-2$. » Justifier.</li><li>Déterminer le reste dans la division euclidienne par $7$ du nombre $247^{349}$.</li><li>Déterminer le reste dans la division euclidienne par $11$ du nombre $57383^{2015}$.</li></ol>`,
indice: '1 : liste les restes possibles modulo 6 et cherche des représentants négatifs. 2 et 3 : réduis la base, trouve la période, réduis l’exposant.',
meth: 'Période des puissances modulo $n$, division de l’exposant par la période.',
s: `<ol><li><b>Vrai.</b> Les restes possibles modulo 6 sont $0, 1, 2, 3, 4, 5$. Or $4 ≡ -2$ et $5 ≡ -1 (6)$. Tout entier est donc congru à l’un des entiers $0, 1, 2, 3, -2, -1$.</li>
<li>$247 = 7 × 35 + 2$, donc $247 ≡ 2 (7)$. Les puissances de 2 modulo 7 ont pour période 3 ($2^3 ≡ 1$). $349 = 3 × 116 + 1$, donc $247^{349} ≡ 2^{349} = (2^3)^{116} × 2 ≡ 2$ : reste <b>2</b>.</li>
<li>$57383 = 11 × 5216 + 7$, donc $57383 ≡ 7 (11)$. Puissances de 7 : $7^1 ≡ 7$, $7^2 = 49 ≡ 5$, $7^3 ≡ 35 ≡ 2$, $7^4 ≡ 14 ≡ 3$, $7^5 ≡ 21 ≡ 10 ≡ -1$. Donc $7^{10} ≡ 1$ (période 10). $2015 = 10 × 201 + 5$, d’où $57383^{2015} ≡ (7^{10})^{201} × 7^5 ≡ 7^5 ≡ 10 (11)$ : reste <b>10</b>.<p class="muted">(L’énoncé du livret, aplati à l’impression, se lit « $57383^{2015}$ ».)</p></li></ol>` })
]
},
{
id: 'a7', court: 'Congruences linéaires, restes chinois', titre: 'Congruences linéaires et restes chinois', duree: '1 h 30',
resume: 'Résoudre ax ≡ b (n), inverse modulaire, nombre de solutions, systèmes de congruences et théorème des restes chinois.',
intro: 'Dernier chapitre du cours : on <b>résout</b> des équations modulo $n$. L’inverse modulaire est l’outil clé de la cryptographie (RSA), et le théorème des restes chinois permet de reconstituer un grand nombre à partir de plusieurs petits restes.',
objectifs: [
  'savoir si $ax ≡ b (n)$ a des solutions et <b>combien</b> ;',
  'calculer un <b>inverse modulaire</b> avec Bézout ;',
  'résoudre $ax ≡ b (n)$ avec la méthode en 4 étapes, y compris quand $PGCD(a, n) ≠ 1$ ;',
  'énoncer et appliquer le <b>théorème des restes chinois</b> pour un système de deux congruences ;',
  'modéliser un problème par une congruence ou un système.'
],
prerequis: ['Congruences et compatibilité (chapitre 6).', 'Bézout et algorithme d’Euclide (chapitre 4).', 'Équations diophantiennes (chapitre 5).'],
sections: [
{ t: 'Congruences linéaires', h: `
${bDef('Congruence linéaire', `<p>Une <b>congruence linéaire</b> à une inconnue est une équation de la forme</p>$$ax ≡ b (n)$$<p>où $a, b, n ∈ ℤ$ avec $n ≥ 2$, et où l’inconnue $x$ est cherchée dans $ℤ$.</p>`)}
${bThm('Existence et nombre de solutions', `<p>La congruence $ax ≡ b (n)$ admet des solutions dans $ℤ$ <b>si, et seulement si</b>, $d = PGCD(a, n)$ divise $b$.</p><ul>
<li>Si $d | b$ : il y a <b>exactement $d$ solutions</b> distinctes modulo $n$.</li><li>Si $d ∤ b$ : <b>aucune</b> solution.</li></ul>`)}
${bProof('lien avec les équations diophantiennes', '<p>$ax ≡ b (n)$ signifie qu’il existe $y ∈ ℤ$ tel que $ax - b = ny$, soit $ax - ny = b$ : une équation diophantienne, qui a des solutions si et seulement si $PGCD(a, n) | b$.</p>')}
${bEx('Trois cas', `<ul><li>$7x ≡ 3 (10)$ : $PGCD(7, 10) = 1$ : <b>une</b> solution modulo 10.</li><li>$12x ≡ 8 (20)$ : $PGCD(12, 20) = 4$ divise 8 : <b>4 solutions</b> modulo 20.</li><li>$6x ≡ 4 (9)$ : $PGCD(6, 9) = 3$ ne divise pas 4 : <b>aucune</b> solution.</li></ul>`)}
${quick('Combien de solutions distinctes modulo 15 a la congruence $9x ≡ 6 (15)$ ?', '3', '$PGCD(9, 15) = 3$ divise 6 : il y a exactement 3 solutions modulo 15 (ce sont $x ≡ 4, 9, 14$).')}` },

{ t: 'Inverse modulaire et méthode de résolution', h: `
${bDef('Inverse modulaire', `<p>Si $PGCD(a, n) = 1$, l’entier $a$ est dit <b>inversible modulo $n$</b>. Il existe alors $u ∈ ℤ$ (un <b>inverse</b> de $a$ modulo $n$) tel que</p>$$au ≡ 1 (n)$$<p>L’équation $ax ≡ b (n)$ possède alors une <b>unique</b> solution modulo $n$ : $x ≡ ub (n)$.</p>`)}
${bProof('où vient l’inverse ?', '<p>Si $PGCD(a, n) = 1$, Bézout donne $au + nv = 1$. Modulo $n$ : $au ≡ 1$. En multipliant $ax ≡ b$ par $u$ : $x ≡ ub$.</p>')}
${bMeth('Résoudre ax ≡ b (n)', `${steps([
  'Calcule $d = PGCD(a, n)$. S’il ne divise pas $b$ : <b>aucune solution</b>, on s’arrête.',
  '<b>Simplifie</b> par $d$ pour obtenir $a′x ≡ b′ (n′)$ avec $PGCD(a′, n′) = 1$.',
  'Trouve l’<b>inverse</b> $u$ de $a′$ modulo $n′$ (Euclide étendu : $a′u + n′v = 1$).',
  'La solution générale est <b>$x ≡ ub′ (n′)$</b> ; modulo $n$, il y a $d$ classes $x_0 + kn′$ ($k = 0, …, d - 1$).'])}`)}
${bEx('Résoudre 11x ≡ 4 (50)', `<ul><li>$PGCD(11, 50) = 1$ divise 4.</li><li>Bézout : $2 × 50 - 9 × 11 = 1$, donc $-9 × 11 ≡ 1 (50)$.</li><li>L’inverse de 11 modulo 50 est $-9 ≡ 41 (50)$.</li><li>$x ≡ 41 × 4 = 164 ≡ 14 (50)$.</li></ul><p>Solutions : $x = 14 + 50k$, $k ∈ ℤ$. (Contrôle : $11 × 14 = 154 = 3 × 50 + 4$ ✓.)</p>`)}
${demo('cong', null, 'Congruences : l’outil « Résoudre ax ≡ b (mod n) » donne l’inverse et la solution')}
${quick('Quel est l’inverse de $5$ modulo $12$ ? (entier entre 0 et 11)', '5', '$5 × 5 = 25 = 2 × 12 + 1 ≡ 1 (12)$ : l’inverse de 5 modulo 12 est 5 lui-même.', 'Cherche $u$ tel que $5u ≡ 1 (12)$ : essaie 1, 2, 3, …')}` },

{ t: 'Quand le PGCD n’est pas 1', h: `
<p>Si $d = PGCD(a, n) > 1$ et $d | b$, on <b>simplifie</b> toute la congruence par $d$ : on divise $a$, $b$ <b>et le module</b> $n$.</p>
${bEx('12x ≡ 8 (20)', `<p>$PGCD(12, 20) = 4$ divise 8. On divise par 4 : $3x ≡ 2 (5)$. L’inverse de 3 modulo 5 est 2 ($3 × 2 = 6 ≡ 1$), donc $x ≡ 2 × 2 = 4 (5)$.</p>
<p>Modulo 20, cela fait $d = 4$ classes : $x ≡ 4, 9, 14$ ou $19 (20)$. (Contrôle : $12 × 9 = 108 = 5 × 20 + 8$ ✓.)</p>`)}
${bEx('9x ≡ 6 (15)', `<p>$PGCD(9, 15) = 3$ divise 6 : $3x ≡ 2 (5)$, donc $x ≡ 4 (5)$. Modulo 15 : $x ≡ 4, 9$ ou $14$ ($3$ solutions).</p>`)}
${bTrap('', 'Quand on divise par $d$, <b>le module change aussi</b> : $12x ≡ 8 (20)$ devient $3x ≡ 2 (5)$, pas $3x ≡ 2 (20)$. C’est ce qui produit plusieurs solutions modulo $n$.')}` },

{ t: 'Le théorème des restes chinois', h: `
<p>Un général chinois comptait ses soldats en les rangeant par 7, puis par 15 : en ne retenant que les <b>restes</b>, il retrouvait leur nombre (modulo $7 × 15$). C’est l’idée du théorème des restes chinois.</p>
${bThm('Théorème des restes chinois (TRC)', `<p>Soient $m, n ≥ 2$ deux entiers <b>premiers entre eux</b> ($PGCD(m, n) = 1$). Pour tous entiers $a, b ∈ ℤ$, le système</p>${sys(['x ≡ a (m)', 'x ≡ b (n)'])}
<p>admet une <b>unique solution modulo $mn$</b>.</p>`)}
${bMeth('Formule constructive', `${steps(['Obtiens une relation de Bézout : $mu + nv = 1$.', 'Une solution particulière est $x_0 = anv + bmu$.', 'La solution générale est $x ≡ x_0 (mn)$.'])}`)}
${bProof('pourquoi x₀ convient', '<p>Modulo $m$ : $bmu ≡ 0$ et $nv = 1 - mu ≡ 1$, donc $x_0 ≡ a × 1 = a$. Modulo $n$ : $anv ≡ 0$ et $mu = 1 - nv ≡ 1$, donc $x_0 ≡ b$.</p>')}
${bEx('Résoudre x ≡ 1 (7) et x ≡ 9 (15)', `<p>$PGCD(7, 15) = 1$. Bézout : $7 × (-2) + 15 × 1 = 1$ ($u = -2$, $v = 1$). Alors</p>$$x_0 = 1 × (15 × 1) + 9 × (7 × (-2)) = 15 - 126 = -111$$
<p>Modulo $7 × 15 = 105$ : $-111 + 2 × 105 = 99$. Solution générale : $x = 99 + 105k$, $k ∈ ℤ$. (Contrôle : $99 = 7 × 14 + 1$ et $99 = 15 × 6 + 9$ ✓.)</p>`)}
${bMeth('Sans formule : par substitution', '<p>Écris $x = a + mt$ (première congruence), reporte dans la seconde : $a + mt ≡ b (n)$, c’est une congruence linéaire en $t$, que tu sais résoudre (inverse de $m$ modulo $n$). Pour $x ≡ 2 (3)$, $x ≡ 3 (5)$ : $x = 2 + 3t$, $2 + 3t ≡ 3 (5)$, $3t ≡ 1$, $t ≡ 2$, $x = 8$.</p>')}
${quick('Quelle est la plus petite solution positive de $x ≡ 2 (3)$ et $x ≡ 3 (5)$ ?', '8', '$8 = 3 × 2 + 2 = 5 × 1 + 3$ ✓. La solution est unique modulo 15 : $x ≡ 8 (15)$.', 'Liste les entiers qui valent 3 modulo 5 : 3, 8, 13… et regarde leur reste par 3.')}` }
],
retenir: [
  '$ax ≡ b (n)$ a des solutions ⇔ $d = PGCD(a, n) | b$ ; il y en a alors <b>$d$ modulo $n$</b>.',
  '<b>Inverse modulaire</b> : si $PGCD(a, n) = 1$, $au ≡ 1 (n)$ (Bézout) et $ax ≡ b (n) ⇔ x ≡ ub (n)$.',
  'Si $d > 1$ et $d | b$ : on divise $a$, $b$ <b>et $n$</b> par $d$, puis on résout.',
  '<b>TRC</b> : $PGCD(m, n) = 1$ ⇒ $x ≡ a (m)$ et $x ≡ b (n)$ ont une unique solution modulo $mn$.',
  'Formule : $mu + nv = 1$, $x_0 = anv + bmu$ ; ou par substitution $x = a + mt$.',
  'On vérifie toujours la solution en la remplaçant dans les congruences de départ.'
],
pieges: [
  ['Congruence sans PGCD', '$ax ≡ b (n)$ n’a de solution que si $PGCD(a, n)$ divise $b$.'],
  ['Diviser sans changer le module', 'Si on divise par $d$, il faut aussi diviser $n$ : $12x ≡ 8 (20)$ devient $3x ≡ 2 (5)$.'],
  ['Modules non premiers entre eux', 'Le TRC exige $PGCD(m, n) = 1$ ; sinon il peut n’y avoir aucune solution ou plusieurs.']
],
quiz: [
  Q('Le système x ≡ 2 (mod 3) et x ≡ 3 (mod 5) a pour solution…', ['x ≡ 8 (mod 15)', 'x ≡ 5 (mod 15)', 'x ≡ 11 (mod 15)', 'x ≡ 8 (mod 8)'], '8 = 3 × 2 + 2 = 5 + 3 ; la solution est unique modulo 15.'),
  Q('Plus petit entier n > 0 tel que n ≡ 2 (mod 5) et n ≡ 3 (mod 7) ?', ['17', '12', '23', '7'], 'La solution est unique modulo 35 : 17 = 5 × 3 + 2 = 7 × 2 + 3.'),
  Q('12x ≡ 8 (mod 20) a pour solutions…', ['x ≡ 4 (mod 5)', 'x ≡ 4 (mod 20)', 'x ≡ 8 (mod 20)', 'aucune'], 'PGCD(12, 20) = 4 divise 8 : 3x ≡ 2 (5), x ≡ 4 (5), soit 4 classes modulo 20.'),
  Q('Les solutions de 7x ≡ 3 (mod 10) :', ['x ≡ 9 (mod 10)', 'x ≡ 3 (mod 10)', 'x ≡ 7 (mod 10)', 'aucune'], '7 × 3 = 21 ≡ 1 : l’inverse de 7 est 3, donc x ≡ 3 × 3 = 9.'),
  Q('Combien de solutions modulo 15 a 9x ≡ 6 (15) ?', ['3', '1', '9', '0'], 'PGCD(9, 15) = 3 divise 6 : exactement 3 solutions modulo 15.'),
  Q('6x ≡ 4 (mod 9) a-t-elle des solutions ?', ['Non : PGCD(6, 9) = 3 ne divise pas 4', 'Oui, x ≡ 4', 'Oui, x ≡ 6', 'Oui, trois'], '3 ∤ 4 : aucune solution.'),
  Q('Quel est l’inverse de 5 modulo 12 ?', ['5', '7', '1', '2'], '5 × 5 = 25 = 2 × 12 + 1 ≡ 1 (12).'),
  Q('Quelle hypothèse faut-il pour le théorème des restes chinois ?', ['PGCD(m, n) = 1', 'm et n premiers', 'a = b', 'm = n'], 'Les modules doivent être premiers entre eux pour garantir existence et unicité modulo mn.'),
  Q('Dans le TRC avec mu + nv = 1, une solution particulière est…', ['x₀ = anv + bmu', 'x₀ = amu + bnv', 'x₀ = a + b', 'x₀ = mu + nv'], 'Modulo m : nv ≡ 1 donc x₀ ≡ a ; modulo n : mu ≡ 1 donc x₀ ≡ b.'),
  Q('Si PGCD(a, n) = 1, l’unique solution de ax ≡ b (n) est…', ['x ≡ ub (n) avec u inverse de a', 'x ≡ b/a (n)', 'x ≡ a·b (n)', 'x ≡ b − a (n)'], 'On multiplie ax ≡ b par l’inverse u de a : x ≡ ub.')
],
cartes: [
  C('Quand ax ≡ b (n) a-t-elle des solutions ?', 'Si et seulement si PGCD(a, n) divise b.\nIl y en a alors exactement PGCD(a, n) modulo n.'),
  C('Inverse modulaire', 'Si PGCD(a, n) = 1, il existe u tel que au ≡ 1 (n) (Bézout : au + nv = 1).\nAlors ax ≡ b ⇔ x ≡ ub (n).'),
  C('Méthode pour ax ≡ b (n)', '1. d = PGCD(a, n) divise b ?\n2. Diviser par d (a, b ET n).\n3. Inverse de a′ modulo n′ (Euclide).\n4. x ≡ ub′ (n′).'),
  C('Théorème des restes chinois', 'Si PGCD(m, n) = 1, x ≡ a (m) et x ≡ b (n) ont une unique solution modulo mn.'),
  C('Formule constructive du TRC', 'mu + nv = 1 (Bézout)\nx₀ = anv + bmu\nx ≡ x₀ (mn)'),
  C('Autre méthode pour un système', 'Écrire x = a + mt, reporter dans la 2ᵉ congruence et résoudre en t.'),
  C('À quoi servent les inverses modulaires ?', 'Au chiffrement RSA, aux codes correcteurs, au hachage : on « divise » modulo n en multipliant par l’inverse.')
],
exos: [
X('Exercice 1', { id: 'a7-1', niv: 1, src: 'TD', q: `<p>Résoudre dans $ℤ$ les congruences linéaires suivantes :</p><ol><li>$7x ≡ 3 (10)$</li><li>$12x ≡ 8 (20)$</li><li>$9x ≡ 6 (15)$</li></ol>`,
indice: 'Calcule d’abord $PGCD(a, n)$. S’il est supérieur à 1, divise la congruence ET le module.',
meth: 'Existence ($d | b$), simplification par $d$, inverse modulaire de $a′$ modulo $n′$, solution modulo $n′$, puis les $d$ classes modulo $n$.',
s: `<ol><li>$PGCD(7, 10) = 1$. Inverse de 7 modulo 10 : $7 × 3 = 21 ≡ 1$, donc $u = 3$. $x ≡ 3 × 3 = 9$ : <b>$x ≡ 9 (10)$</b>. (Contrôle : $7 × 9 = 63 ≡ 3$ ✓.)</li>
<li>$PGCD(12, 20) = 4$ divise 8. On divise par 4 : $3x ≡ 2 (5)$. L’inverse de 3 modulo 5 est 2 : $x ≡ 4 (5)$. Modulo 20 : <b>$x ≡ 4, 9, 14$ ou $19 (20)$</b> (4 solutions).</li>
<li>$PGCD(9, 15) = 3$ divise 6. On divise par 3 : $3x ≡ 2 (5)$, donc $x ≡ 4 (5)$. Modulo 15 : <b>$x ≡ 4, 9$ ou $14 (15)$</b> (3 solutions ; contrôle : $9 × 4 = 36 = 2 × 15 + 6$ ✓).</li></ol>` }),

X('Exercice 2', { id: 'a7-2', niv: 1, src: 'TD', q: `<ol><li>Donner la table de multiplication de $5$ modulo $12$. En déduire que $5$ est inversible modulo $12$ et déterminer son inverse.</li><li>Résoudre dans $ℤ$ la congruence : $5x ≡ 7 (12)$.</li></ol>`,
indice: 'Calcule $5 × k$ pour $k = 0, …, 11$ et réduis modulo 12. L’inverse est le $k$ qui donne 1.',
meth: 'Un entier est inversible modulo $n$ ssi il est premier avec $n$ ; l’inverse se lit dans la table (valeur 1).',
s: `<ol><li>${tt(['k', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'], [['5k mod 12', 0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7]], { num: true })}<p>La valeur 1 apparaît pour $k = 5$ : $5 × 5 = 25 ≡ 1 (12)$. Donc 5 est inversible modulo 12 (et $PGCD(5, 12) = 1$), d’inverse <b>5</b>.</p></li>
<li>On multiplie par l’inverse : $x ≡ 5 × 7 = 35 ≡ 11 (12)$. <b>$x ≡ 11 (12)$</b>. (Dans la table, 7 est atteint pour $k = 11$ ✓. Contrôle : $5 × 11 = 55 = 4 × 12 + 7$ ✓.)</li></ol>` }),

X('Exercice 3', { id: 'a7-3', niv: 2, src: 'TD', q: `<p>Résoudre dans $ℤ$ les systèmes de congruences suivants :</p><ol><li>${sys(['x ≡ 2 (3)', 'x ≡ 3 (5)'])}</li><li>${sys(['x ≡ 1 (4)', 'x ≡ 2 (9)'])}</li></ol>`,
indice: 'Les modules sont premiers entre eux : le théorème des restes chinois s’applique. Essaie la substitution $x = a + mt$.',
meth: 'Bézout $mu + nv = 1$ puis $x_0 = anv + bmu$ ; ou substitution.',
s: `<ol><li>$PGCD(3, 5) = 1$. Bézout : $3 × 2 + 5 × (-1) = 1$ ($u = 2$, $v = -1$). $x_0 = 2 × 5 × (-1) + 3 × 3 × 2 = -10 + 18 = 8$. <b>$x ≡ 8 (15)$</b>. (Contrôle : $8 = 3 × 2 + 2 = 5 × 1 + 3$ ✓. Par substitution : $x = 2 + 3t$, $2 + 3t ≡ 3 (5)$, $t ≡ 2 (5)$, $x = 8 + 15k$.)</li>
<li>$PGCD(4, 9) = 1$. Bézout : $4 × (-2) + 9 × 1 = 1$ ($u = -2$, $v = 1$). $x_0 = 1 × 9 × 1 + 2 × 4 × (-2) = 9 - 16 = -7$. Modulo $36$ : <b>$x ≡ 29 (36)$</b>. (Contrôle : $29 = 4 × 7 + 1 = 9 × 3 + 2$ ✓.)</li></ol>` }),

X('Exercice 4', { id: 'a7-4', niv: 3, src: 'Travail perso', q: `<ol><li>Déterminer tous les entiers $x ∈ ℤ$ tels que $8x ≡ 5 (13)$.</li><li>Déterminer tous les entiers $x ∈ ℤ$ tels que $6x ≡ 4 (9)$.</li><li>Un théâtre pratique les tarifs suivants : $19$ euros l’entrée pour les abonnés et $29$ euros pour les non-abonnés. La recette totale s’élève à $818$ euros. Sachant qu’il y a environ deux fois moins d’abonnés que de non-abonnés, retrouver la répartition exacte des spectateurs.</li></ol>`,
indice: '1 : cherche l’inverse de 8 modulo 13 ($8 × 5 = 40$). 2 : le PGCD divise-t-il le second membre ? 3 : $19a + 29n = 818$ est une équation diophantienne ; réduis-la modulo 19.',
meth: '3 : $29n ≡ 818 (19)$ donne $n$ modulo 19, puis $a$ s’en déduit ; garde la solution qui vérifie $n ≈ 2a$.',
s: `<ol><li>$PGCD(8, 13) = 1$. Inverse de 8 modulo 13 : $8 × 5 = 40 = 3 × 13 + 1$, donc $u = 5$. $x ≡ 5 × 5 = 25 ≡ 12 (13)$ : <b>$x ≡ 12 (13)$</b>. (Contrôle : $8 × 12 = 96 = 7 × 13 + 5$ ✓.)</li>
<li>$PGCD(6, 9) = 3$ ne divise pas 4 : <b>aucune solution</b>.</li>
<li>Soient $a$ abonnés et $n$ non-abonnés : $19a + 29n = 818$. Modulo 19 : $29 ≡ 10$ et $818 = 19 × 43 + 1 ≡ 1$, donc $10n ≡ 1 (19)$. L’inverse de 10 modulo 19 est 2 ($10 × 2 = 20 ≡ 1$) : $n ≡ 2 (19)$, soit $n = 2 + 19t$. Alors $a = frac{818 - 29n}{19} = 40 - 29t$. Solutions positives : $t = 0$ : $(a, n) = (40, 2)$ ; $t = 1$ : $(a, n) = (11, 21)$ ; $t ≥ 2$ donne $a < 0$. <br>La condition « environ deux fois moins d’abonnés que de non-abonnés » ($n ≈ 2a$) écarte $(40, 2)$ et retient <b>$(11, 21)$ : 11 abonnés et 21 non-abonnés</b>. Contrôle : $19 × 11 + 29 × 21 = 209 + 609 = 818$ ✓.</li></ol>` })
]
},
]
};
