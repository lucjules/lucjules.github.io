/* Contenu du cours — revision. Écrit avec les outils de lib.js (formules $…$, boîtes bDef/bThm/…, quick, demo, Q, C, X). */
COURS.revision = {
id: 'revision', nom: 'Révisions', page: 'revision.html', partie: 'Révisions et interro', titre: 'Révisions générales',
hero: 'Tout le programme, mélangé : méthodes, synthèse et interro blanche',
lead: 'Une fiche « que faire quand… », les exercices de synthèse de logique et d’arithmétique, et le sujet d’interrogation avec un chronomètre. Les QCM, cartes, exercices et calculateurs couvrent ici tous les chapitres.',
outils: ['tv', 'adder', 'div', 'fact', 'sieve', 'pgcd', 'dio', 'clock', 'cong', 'quad'],
pieges: [
  ['Réciproque ≠ contraposée', '$P ⇒ Q$ est équivalente à $¬Q ⇒ ¬P$, pas à $Q ⇒ P$.'],
  ['Le reste en C et en Java', '<code>-113 % 8</code> vaut −1 en C, 7 en Python. La division euclidienne exige $0 ≤ r < b$.'],
  ['1 n’est pas premier', 'Un premier a exactement deux diviseurs positifs ; 2 est le seul premier pair.'],
  ['∀∃ n’est pas ∃∀', '« Pour tout $x$ il existe $y$ » n’est pas « il existe $y$ valable pour tout $x$ ».'],
  ['Congruence sans PGCD', '$ax ≡ b (n)$ n’a de solution que si $PGCD(a, n)$ divise $b$.'],
  ['Hérédité sans initialisation', 'Sans le premier rang vérifié, la preuve par récurrence ne démarre pas.']
],
chapitres: [
{
id: 'v1', court: 'Que faire quand… (méthodes)', titre: 'Les méthodes-types : que faire quand… ?', duree: '30 min',
resume: 'Une carte de réflexes : à chaque type d’énoncé, l’outil du cours à sortir.',
intro: 'Réviser, ce n’est pas relire : c’est <b>reconnaître le type d’exercice</b> et savoir quel outil sortir. Cette fiche relie chaque énoncé typique à la méthode du cours — et au chapitre où la retrouver.',
objectifs: [
  'associer un <b>type d’énoncé</b> à l’<b>outil</b> adapté ;',
  'retrouver rapidement le <b>chapitre</b> où la méthode est détaillée ;',
  'éviter les <b>erreurs les plus fréquentes</b> en interro.'
],
prerequis: ['Avoir vu au moins une fois les chapitres de logique et d’arithmétique.'],
sections: [
{ t: 'Logique : que faire quand…', h: `
${tt(['L’énoncé demande de…', 'Pense à…', 'Chapitre'], [
  ['nier une phrase avec ∀ / ∃', 'changer chaque quantificateur sans changer l’ordre, puis nier le prédicat', 'Logique 1'],
  ['nier une implication P ⇒ Q', 'P ∧ ¬Q (jamais P ⇒ ¬Q)', 'Logique 3'],
  ['nier « A et B » / « A ou B »', 'De Morgan : ¬A ∨ ¬B / ¬A ∧ ¬B', 'Logique 2'],
  ['dire si une expression est toujours vraie', 'table de vérité (que des 1 → tautologie)', 'Logique 2'],
  ['simplifier une expression', 'éliminer ⇒, descendre les ¬, factoriser, complémentarité, absorption', 'Logique 2'],
  ['prouver P ⇒ Q difficile', 'démontrer la contraposée ¬Q ⇒ ¬P', 'Logique 3'],
  ['réfuter « pour tout n… »', 'un contre-exemple suffit', 'Logique 3'],
  ['passer d’une table de vérité à un circuit', 'un ET par ligne à 1, des OU entre eux, puis simplifier', 'Logique 4'],
  ['construire un additionneur', 'S = A ⊕ B ⊕ Cin ; Cout = (A ∧ B) ∨ (Cin ∧ (A ⊕ B))', 'Logique 4']], { raw: true, plain: true })}` },

{ t: 'Arithmétique : que faire quand…', h: `
${tt(['L’énoncé demande de…', 'Pense à…', 'Chapitre'], [
  ['diviser (même un négatif)', 'a = bq + r avec 0 ≤ r < b ; q = ⌊a/b⌋', 'Arith. 1'],
  ['montrer qu’un entier divise une expression', 'combinaison linéaire, congruences ou récurrence', 'Arith. 1, 6'],
  ['tester si n est premier', 'diviser par les premiers ≤ √n', 'Arith. 2'],
  ['décomposer, compter les diviseurs, carré parfait', 'décomposition en facteurs premiers : (α+1)…, exposants pairs', 'Arith. 3'],
  ['calculer PGCD / PPCM', 'algorithme d’Euclide, ou min / max des exposants ; PGCD × PPCM = ab', 'Arith. 3, 4'],
  ['trouver u, v avec au + bv = d', 'remontée de l’algorithme d’Euclide', 'Arith. 4'],
  ['prouver qu’une fraction est irréductible', 'combinaison linéaire des deux termes égale à ±1', 'Arith. 4'],
  ['résoudre ax + by = c', 'PGCD(a, b) | c ? simplifier, solution particulière, forme générale avec k', 'Arith. 5'],
  ['problème concret avec des quantités', 'équation diophantienne puis encadrer k (x ≥ 0, y ≥ 0)', 'Arith. 5'],
  ['reste de aᵏ modulo n', 'chercher la période des puissances', 'Arith. 6'],
  ['résoudre ax ≡ b (n)', 'PGCD(a, n) | b ? inverse modulaire, simplifier le module', 'Arith. 7'],
  ['résoudre un système de congruences', 'restes chinois (modules premiers entre eux) ou substitution x = a + mt', 'Arith. 7']], { raw: true, plain: true })}` },

{ t: 'Récurrence et second degré : que faire quand…', h: `
${tt(['L’énoncé demande de…', 'Pense à…', 'Chapitre'], [
  ['démontrer une formule pour tout n', 'récurrence : initialisation, hérédité (hypothèse de récurrence), conclusion', 'Récurrence 1'],
  ['calculer 1 + 2 + … + n, ∑k², ∑k³', 'n(n+1)/2, n(n+1)(2n+1)/6, (n(n+1)/2)²', 'Récurrence 2'],
  ['résoudre ax² + bx + c = 0', 'd’abord facteur commun / identité remarquable, sinon Δ = b² − 4ac', 'Second degré 1'],
  ['résoudre une inéquation du second degré', 'racines, signe de a à l’extérieur, tableau de signes', 'Second degré 2'],
  ['trouver un maximum ou un minimum', 'sommet S(α ; β), α = −b/2a, β = f(α)', 'Second degré 3']], { raw: true, plain: true })}
${bTrap('Avant de rendre ta copie', '<ul><li>As-tu <b>nommé la loi</b> utilisée à chaque ligne de simplification ?</li><li>As-tu <b>vérifié</b> ta solution en la remplaçant dans l’énoncé ?</li><li>As-tu écrit <b>l’ensemble des solutions</b> avec le paramètre $k ∈ ℤ$ ?</li><li>Pour une récurrence : $P(n)$ est-elle <b>énoncée</b> ? L’initialisation est-elle faite ?</li></ul>')}` }
],
retenir: [
  'Reconnaître le <b>type d’énoncé</b> est la moitié du travail : consulte les tableaux « que faire quand… » avant de te lancer.',
  'Logique : nier (changer ∀/∃, De Morgan, $P ∧ ¬Q$), simplifier (lois de Boole), contraposée, contre-exemple.',
  'Arithmétique : Euclide → Bézout → Gauss → diophantien → congruences → restes chinois : chaque outil sert au suivant.',
  'Toujours <b>vérifier</b> un résultat numérique en le remplaçant dans l’énoncé.'
],
pieges: [
  ['Foncer sans lire l’énoncé', 'Repère d’abord les mots-clés (« montrer que », « déterminer tous », « résoudre dans ℤ »).'],
  ['Oublier la vérification', 'Une solution trouvée se contrôle : $ax + by = c$ remplacé, reste recalculé.']
],
quiz: [], cartes: [], exos: []
},
{
id: 'v2', court: 'TD de synthèse', titre: 'Exercices de synthèse (logique et arithmétique)', duree: '2 h',
resume: 'Dix exercices qui mélangent logique, divisibilité, congruences, diophantien, restes chinois, PGCD et récurrence.',
intro: 'Ce TD regroupe des exercices de <b>synthèse</b> : aucune notion nouvelle, mais il faut choisir soi-même le bon outil. Fais-les <b>sur papier</b> en conditions réelles, puis compare avec la correction détaillée.',
objectifs: [
  'mobiliser plusieurs chapitres dans un même exercice ;',
  'choisir seul la <b>méthode</b> adaptée à chaque énoncé ;',
  'rédiger des <b>solutions complètes et vérifiées</b>.'
],
prerequis: ['Les chapitres de logique (1 à 4) et d’arithmétique (1 à 7).', 'Le raisonnement par récurrence (compléments).'],
sections: [
{ t: 'Comment travailler ce TD', h: `
${bMeth('Un bon protocole', `${steps(['Chronomètre-toi : environ <b>15 minutes</b> par exercice.', 'Cherche seul sur papier. Si tu bloques plus de 5 minutes, ouvre l’<b>indice</b>, puis la <b>méthode</b>.', 'Ne regarde la <b>correction détaillée</b> qu’après avoir écrit ta propre réponse.', 'Corrige-toi avec une autre couleur et note l’outil qui t’a manqué : va le revoir dans le chapitre.'])}`)}
${demo('timer', null, 'Chronomètre d’entraînement')}
<p>Les exercices 1 à 7 mélangent logique et arithmétique ; les exercices 8 à 10 sont à traiter en <b>travail personnel</b>.</p>` }
],
retenir: ['Voir la fiche « Que faire quand… » : elle indique, pour chaque type d’énoncé, la méthode à utiliser.'],
pieges: [],
quiz: [], cartes: [],
exos: [
X('Exercice 1', { id: 'v2-1', niv: 2, src: 'Synthèse', q: `<p>On considère les propositions suivantes : $P$ : « L’utilisateur est connecté. » $Q$ : « L’utilisateur est administrateur. » $R$ : « L’accès est autorisé. »</p><ol><li>Traduire en français l’expression logique : $(P ∧ Q) ⇒ R$.</li><li>Traduire en expression logique : « L’accès est autorisé si l’utilisateur est connecté et administrateur, ou s’il est connecté et qu’une exception de sécurité est levée. »</li><li>Donner la table de vérité de $(P ∧ Q) ∨ (P ∧ ¬R)$.</li></ol>`,
indice: 'Pour la question 2, introduis une proposition $E$ : « une exception de sécurité est levée ». « R si … » se traduit par « … ⇒ R ».',
meth: 'Q1 : traduire mot à mot. Q2 : condition $⇒ R$. Q3 : table à 8 lignes avec colonnes intermédiaires.',
s: `<ol><li>« <b>Si</b> l’utilisateur est connecté <b>et</b> administrateur, <b>alors</b> l’accès est autorisé. »</li>
<li>Soit $E$ : « une exception de sécurité est levée ». La condition d’accès est « connecté et administrateur, ou connecté et exception » : $(P ∧ Q) ∨ (P ∧ E)$, qu’on factorise en $P ∧ (Q ∨ E)$. L’expression est <b>$(P ∧ (Q ∨ E)) ⇒ R$</b>. (Si on voulait aussi dire que l’accès n’est autorisé que dans ces cas, on écrirait l’équivalence $⇔$.)</li>
<li>${tt(['P', 'Q', 'R', 'P ∧ Q', '¬R', 'P ∧ ¬R', '(P ∧ Q) ∨ (P ∧ ¬R)'], [[1, 1, 1, 1, 0, 0, 1], [1, 1, 0, 1, 1, 1, 1], [1, 0, 1, 0, 0, 0, 0], [1, 0, 0, 0, 1, 1, 1], [0, 1, 1, 0, 0, 0, 0], [0, 1, 0, 0, 1, 0, 0], [0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0]])}<p>La dernière colonne vaut $1, 1, 0, 1, 0, 0, 0, 0$ : c’est $P ∧ (Q ∨ ¬R)$ par factorisation.</p></li></ol>` }),

X('Exercice 2', { id: 'v2-2', niv: 2, src: 'Synthèse', q: `<ol><li>Montrer à l’aide d’une table de vérité que $(P ⇒ Q) ⇔ (¬P ∨ Q)$ est une tautologie.</li><li>Simplifier l’expression $¬(P ⇒ Q) ∨ (¬P ∧ Q)$.</li></ol>`,
indice: 'Pour la 2, remplace $¬(P ⇒ Q)$ par $P ∧ ¬Q$. Le résultat porte un nom connu.',
meth: 'Q1 : comparer deux colonnes. Q2 : négation de l’implication puis reconnaître le XOR.',
s: `<ol><li>${tt(['P', 'Q', 'P ⇒ Q', '¬P ∨ Q', '(P ⇒ Q) ⇔ (¬P ∨ Q)'], [[1, 1, 1, 1, 1], [1, 0, 0, 0, 1], [0, 1, 1, 1, 1], [0, 0, 1, 1, 1]])}<p>Les colonnes 3 et 4 sont identiques : la dernière ne contient que des 1, c’est une <b>tautologie</b>.</p></li>
<li>$$¬(P ⇒ Q) ∨ (¬P ∧ Q) = (P ∧ ¬Q) ∨ (¬P ∧ Q) ;; négation d’une implication
 = P ⊕ Q ;; définition du ou exclusif$$<p>L’expression vaut 1 exactement quand $P$ et $Q$ ont des valeurs <b>différentes</b>.</p></li></ol>` }),

X('Exercice 3', { id: 'v2-3', niv: 2, src: 'Synthèse', q: `<p>Donner la négation des propositions suivantes :</p><ol><li>$∀n ∈ ℕ, n^2 ≥ n$.</li><li>$∃x ∈ ℤ, x^2 = 2$.</li><li>$∀a ∈ ℤ, ∃b ∈ ℤ, a + b = 0$.</li><li>$∃!n ∈ ℕ, n^2 = n$.</li></ol>`,
indice: 'Pour la 4, « il existe un unique » se nie par « il n’en existe aucun, ou il en existe au moins deux ». Combien de solutions a $n^2 = n$ dans $ℕ$ ?',
meth: 'Change chaque quantificateur sans changer l’ordre et nie le prédicat.',
s: `<ol><li>$∃n ∈ ℕ | n^2 < n$. (L’énoncé de départ est vrai — $n = 0$ : $0 ≥ 0$, $n ≥ 1$ : $n^2 ≥ n$ — donc la négation est fausse.)</li>
<li>$∀x ∈ ℤ, x^2 ≠ 2$. (Vrai : $sqrt{2}$ n’est pas entier ; l’énoncé de départ est faux.)</li>
<li>$∃a ∈ ℤ | ∀b ∈ ℤ, a + b ≠ 0$. (L’énoncé de départ est vrai avec $b = -a$ ; la négation est fausse.)</li>
<li>La négation de « il existe un unique $n$ » est « il n’existe aucun $n$ <b>ou</b> il en existe au moins deux » : $(∀n ∈ ℕ, n^2 ≠ n) ∨ (∃n, m ∈ ℕ, n ≠ m ∧ n^2 = n ∧ m^2 = m)$. Ici $n^2 = n$ a deux solutions, $0$ et $1$ : l’énoncé de départ est <b>faux</b> et sa négation est <b>vraie</b> (prendre $n = 0$ et $m = 1$).</li></ol>` }),

X('Exercice 4', { id: 'v2-4', niv: 2, src: 'Synthèse', q: `<ol><li>Montrer que pour tout entier $n ∈ ℕ$, $7^n - 3^n$ est divisible par $4$.</li><li>Montrer que pour tout entier $n ≥ 1$ : $1 + 3 + 5 + … + (2n - 1) = n^2$.</li></ol>`,
indice: '1 : deux méthodes possibles, congruences ($7 ≡ 3$ modulo 4) ou récurrence. 2 : récurrence, le terme ajouté au rang $n + 1$ est $2n + 1$.',
meth: '1 : compatibilité des congruences avec les puissances. 2 : initialisation, hérédité, conclusion.',
s: `<ol><li><b>Par les congruences.</b> $7 ≡ 3 (4)$ car $7 - 3 = 4$. Par compatibilité avec les puissances, $7^n ≡ 3^n (4)$, donc $7^n - 3^n ≡ 0 (4)$. ∎<br><b>Par récurrence.</b> $n = 0$ : $1 - 1 = 0$ ✓. Hérédité : $7^{n+1} - 3^{n+1} = 7(7^n - 3^n) + 4 × 3^n$, divisible par 4 si $7^n - 3^n$ l’est. ∎</li>
<li><b>Initialisation</b> ($n = 1$) : $1 = 1^2$ ✓. <b>Hérédité</b> : si $1 + 3 + … + (2n - 1) = n^2$, alors $1 + 3 + … + (2n - 1) + (2n + 1) = n^2 + 2n + 1 = (n + 1)^2$ ✓. <b>Conclusion</b> : vrai pour tout $n ≥ 1$. ∎</li></ol>` }),

X('Exercice 5', { id: 'v2-5', niv: 1, src: 'Synthèse', q: `<ol><li>Déterminer le quotient et le reste de la division euclidienne de $-123$ par $7$.</li><li>Déterminer le reste de $2^{100}$ dans la division par $7$.</li></ol>`,
indice: '1 : le reste doit être entre 0 et 6. 2 : cherche la période des puissances de 2 modulo 7.',
meth: '1 : $q = ⌊-123/7⌋$. 2 : $2^3 ≡ 1 (7)$.',
s: `<ol><li>$frac{-123}{7} = -17{,}57…$ et $⌊-17{,}57⌋ = -18$. Donc $q = -18$ et $r = -123 - 7 × (-18) = -123 + 126 = 3$ : <b>$-123 = 7 × (-18) + 3$</b>.</li>
<li>$2^3 = 8 ≡ 1 (7)$ et $100 = 3 × 33 + 1$, donc $2^{100} = (2^3)^{33} × 2 ≡ 2$ : le reste est <b>2</b>.</li></ol>` }),

X('Exercice 6', { id: 'v2-6', niv: 2, src: 'Synthèse', q: `<ol><li>Résoudre dans $ℤ$ l’équation $5x - 8y = 31$.</li><li>Résoudre dans $ℤ$ la congruence $9x ≡ 6 (15)$.</li></ol>`,
indice: '1 : $PGCD(5, 8) = 1$ ; cherche une solution particulière avec de petites valeurs. 2 : $PGCD(9, 15) = 3$ divise 6, donc on simplifie.',
meth: '1 : méthode canonique des équations diophantiennes. 2 : congruence linéaire avec simplification du module.',
s: `<ol><li>$PGCD(5, 8) = 1$ divise 31. Solution particulière : $5 × 3 - 8 × (-2) = 15 + 16 = 31$, donc $(x_0, y_0) = (3, -2)$. Par soustraction : $5(x - 3) = 8(y + 2)$ ; comme $PGCD(5, 8) = 1$, Gauss donne $8 | x - 3$ : $x = 3 + 8k$ et $y = -2 + 5k$. <b>$S = \\{(3 + 8k, -2 + 5k), k ∈ ℤ\\}$</b>.</li>
<li>$PGCD(9, 15) = 3$ divise 6. On divise par 3 (et le module) : $3x ≡ 2 (5)$. L’inverse de 3 modulo 5 est 2 ($3 × 2 = 6 ≡ 1$) donc $x ≡ 4 (5)$. Modulo 15 : <b>$x ≡ 4, 9$ ou $14 (15)$</b>.</li></ol>` }),

X('Exercice 7', { id: 'v2-7', niv: 2, src: 'Synthèse', q: `<p>Un entier $n$ vérifie les conditions suivantes : $n ≡ 2 (5)$ et $n ≡ 3 (7)$.</p><ol><li>Déterminer tous les entiers $n$ satisfaisant ces deux congruences.</li><li>Parmi eux, déterminer le plus petit entier positif.</li></ol>`,
indice: '5 et 7 sont premiers entre eux : le théorème des restes chinois assure une solution unique modulo 35.',
meth: 'Substitution : $n = 2 + 5t$ dans la seconde congruence.',
s: `<ol><li>$n = 2 + 5t$. Alors $2 + 5t ≡ 3 (7)$, soit $5t ≡ 1 (7)$. L’inverse de 5 modulo 7 est 3 ($15 ≡ 1$), donc $t ≡ 3 (7)$, $t = 3 + 7s$ et $n = 2 + 15 + 35s = 17 + 35s$. <b>$n ≡ 17 (35)$</b>, c’est-à-dire $n = 17 + 35k$, $k ∈ ℤ$.</li>
<li>Le plus petit entier positif est <b>17</b> ($17 = 5 × 3 + 2 = 7 × 2 + 3$ ✓).</li></ol>` }),

X('Exercice 8', { id: 'v2-8', niv: 2, src: 'Travail perso', q: `<ol><li>Décomposer $756$ et $504$ en produits de facteurs premiers.</li><li>En déduire $PGCD(756, 504)$ et $PPCM(756, 504)$.</li><li>Vérifier que $PGCD(756, 504) × PPCM(756, 504) = 756 × 504$.</li></ol>`,
indice: 'Divise par 2, 3, 7 successivement. PGCD : min des exposants ; PPCM : max.',
meth: 'Décomposition puis min / max des exposants.',
s: `<ol><li>$756 = 2 × 378 = 2^2 × 189 = 2^2 × 3^3 × 7$ ; $504 = 2 × 252 = 2^2 × 126 = 2^3 × 63 = 2^3 × 3^2 × 7$.</li>
<li>$PGCD = 2^{min(2,3)} × 3^{min(3,2)} × 7^{min(1,1)} = 2^2 × 3^2 × 7 = 252$. $PPCM = 2^3 × 3^3 × 7 = 1512$.</li>
<li>$252 × 1512 = 381024$ et $756 × 504 = 381024$ ✓.</li></ol>` }),

X('Exercice 9', { id: 'v2-9', niv: 3, src: 'Travail perso', q: `<ol><li>Montrer par récurrence que pour tout $n ≥ 1$ : $1^2 + 2^2 + 3^2 + … + n^2 = frac{n(n + 1)(2n + 1)}{6}$.</li><li>Montrer que pour tout entier $n ≥ 0$, $4^n + 2$ est divisible par $3$.</li></ol>`,
indice: 'Dans les deux cas : initialisation, puis fais apparaître l’hypothèse de récurrence dans l’expression du rang $n + 1$.',
meth: '1 : ajoute $(n + 1)^2$ puis factorise $(n + 1)$. 2 : $4^{n+1} + 2 = 4(4^n + 2) - 6$.',
s: `<ol><li><b>Initialisation</b> ($n = 1$) : $1 = frac{1 × 2 × 3}{6}$ ✓. <b>Hérédité</b> : $$frac{n(n+1)(2n+1)}{6} + (n+1)^2 = frac{(n+1)[n(2n+1) + 6(n+1)]}{6} = frac{(n+1)(2n^2 + 7n + 6)}{6} = frac{(n+1)(n+2)(2n+3)}{6}$$ C’est la formule au rang $n + 1$. ∎</li>
<li>$n = 0$ : $4^0 + 2 = 3$ ✓. Hérédité : $4^{n+1} + 2 = 4(4^n + 2) - 6$, divisible par 3 si $4^n + 2$ l’est. ∎ (Avec les congruences : $4 ≡ 1 (3)$ donc $4^n + 2 ≡ 3 ≡ 0$.)</li></ol>` }),

X('Exercice 10', { id: 'v2-10', niv: 2, src: 'Travail perso', q: `<p>On souhaite répartir équitablement $360$ bonbons et $252$ jouets entre plusieurs enfants, sans qu’il reste de bonbon ni de jouet.</p><ol><li>Quel est le nombre maximal d’enfants possible ?</li><li>Si l’on souhaite que chaque enfant reçoive le même nombre de bonbons et le même nombre de jouets, quels sont tous les nombres possibles d’enfants ?</li></ol>`,
indice: 'Le nombre d’enfants doit diviser 360 ET 252 : c’est un diviseur commun.',
meth: 'Les diviseurs communs de deux nombres sont les diviseurs de leur PGCD.',
s: `<ol><li>$360 = 2^3 × 3^2 × 5$ et $252 = 2^2 × 3^2 × 7$. $PGCD(360, 252) = 2^2 × 3^2 = 36$. Le nombre maximal d’enfants est <b>36</b> (10 bonbons et 7 jouets chacun).</li>
<li>Le nombre d’enfants doit diviser 360 et 252 : c’est un diviseur commun, donc un diviseur de leur PGCD 36. Les nombres possibles sont <b>$1, 2, 3, 4, 6, 9, 12, 18, 36$</b>.</li></ol>` })
]
},
{
id: 'v3', court: 'Sujet d’interrogation', titre: 'Interrogation écrite R1.06 (sujet type)', duree: '30 min',
resume: 'Le sujet d’interrogation écrite R1.06 : quantificateurs, négations, De Morgan, division euclidienne.',
intro: 'Voici un <b>vrai sujet d’interrogation</b> de quatre exercices, tel qu’il est posé en R1.06. Fais-le en conditions réelles (sur papier, chronomètre lancé, sans le cours), puis compare avec la correction détaillée.',
objectifs: [
  'traduire une phrase à l’aide de <b>quantificateurs</b> ;',
  'donner la <b>valeur de vérité</b> et la <b>négation</b> d’une proposition quantifiée ;',
  'nier une expression avec <b>De Morgan</b> et la négation d’une implication ;',
  'utiliser le <b>vocabulaire</b> de la division euclidienne (dividende, diviseur, quotient, reste).'
],
prerequis: ['Logique, chapitres 1 à 3.', 'Arithmétique, chapitre 1.'],
sections: [
{ t: 'Conditions de l’épreuve', h: `
<p>Le sujet est constitué de <b>quatre exercices</b>. En vrai, on répond sur la feuille : <b>justifie</b> chaque réponse, une valeur de vérité sans explication ne rapporte presque rien.</p>
${demo('timer', null, 'Chronomètre : règle 30 minutes et lance-toi')}
${bMeth('Pendant l’épreuve', `${steps(['Lis <b>tout</b> le sujet avant de commencer et repère l’exercice le plus facile.', 'Pour chaque négation : évalue d’abord l’énoncé (vrai ou faux), puis écris la négation, qui doit avoir la valeur <b>contraire</b>.', 'Garde 5 minutes pour te relire.'])}`)}` }
],
retenir: ['Une négation doit avoir la <b>valeur de vérité contraire</b> : c’est un excellent contrôle.'],
pieges: [],
quiz: [], cartes: [],
exos: [
X('Exercice 1', { id: 'v3-1', niv: 1, src: 'Interro', q: `<p>Traduisez les phrases suivantes à l’aide de quantificateurs :</p><ul><li>Le carré de tout nombre réel est positif.</li><li>Entre deux nombres réels distincts, il existe un nombre rationnel.</li></ul>`,
indice: 'Repère « tout » ($∀$), « il existe » ($∃$). Pour la seconde, nomme $x$ le plus petit des deux réels.',
meth: 'Écris d’abord l’ensemble de référence de chaque variable.',
s: `<ul><li>$∀x ∈ ℝ, x^2 ≥ 0$ (« positif » au sens large : le carré de 0 est 0).</li><li>$∀x, y ∈ ℝ, x < y ⇒ ∃q ∈ ℚ | x < q < y$ (deux réels distincts : on nomme $x$ le plus petit).</li></ul>` }),

X('Exercice 2', { id: 'v3-2', niv: 2, src: 'Interro', q: `<p>Donner la valeur de vérité des propositions suivantes et écrire la négation :</p><ul><li>$∀n ∈ ℕ, n^2 > 7$</li><li>$∃x ∈ ℝ | x^2 - 1 = 0$</li><li>$∀x ∈ ℝ, ∃y ∈ ℝ | x + y = 0$</li></ul>`,
indice: 'Pour réfuter un $∀$, cherche un contre-exemple ; pour prouver un $∃$, exhibe un exemple.',
meth: 'Évalue, puis nie : $∀ ↔ ∃$ sans changer l’ordre, et nie le prédicat.',
s: `<ul><li>$∀n ∈ ℕ, n^2 > 7$ : <b>fausse</b> ($n = 0, 1, 2$ donnent $0, 1, 4$, pas supérieurs à 7). Négation : $∃n ∈ ℕ | n^2 ≤ 7$ (vraie).</li>
<li>$∃x ∈ ℝ | x^2 - 1 = 0$ : <b>vraie</b> ($x = 1$ ou $x = -1$). Négation : $∀x ∈ ℝ, x^2 - 1 ≠ 0$ (fausse).</li>
<li>$∀x ∈ ℝ, ∃y ∈ ℝ | x + y = 0$ : <b>vraie</b> ($y = -x$). Négation : $∃x ∈ ℝ | ∀y ∈ ℝ, x + y ≠ 0$ (fausse).</li></ul>` }),

X('Exercice 3', { id: 'v3-3', niv: 2, src: 'Interro', q: `<p>Soient $p$, $q$ et $r$ trois propositions. Donner la négation des expressions suivantes :</p><ul><li>$(¬q) ∨ (¬p)$</li><li>$(p ∧ r) ⇒ q$</li></ul>`,
indice: 'Le premier est un « ou » : utilise De Morgan. Le second est une implication : sa négation est $A ∧ ¬B$.',
meth: 'De Morgan : $¬(A ∨ B) = ¬A ∧ ¬B$ ; négation d’une implication : $¬(A ⇒ B) = A ∧ ¬B$.',
s: `<ul><li>$¬((¬q) ∨ (¬p)) = ¬(¬q) ∧ ¬(¬p) = q ∧ p$ (De Morgan puis double négation).</li><li>$¬((p ∧ r) ⇒ q) = (p ∧ r) ∧ ¬q = p ∧ r ∧ ¬q$.</li></ul>` }),

X('Exercice 4', { id: 'v3-4', niv: 2, src: 'Interro', q: `<p>Compléter avec un terme à prendre dans la liste suivante (un mot peut être utilisé plusieurs fois ou ne pas être utilisé du tout) : <i>multiple, diviseur, dividende, reste, quotient</i> ou une valeur numérique selon les cas.</p><ul><li>12 est un … de 24</li><li>0 est un … de 56</li><li>sachant que $1013 = 125 × 8 + 13$ : <br>• 125 est le … dans la division euclidienne de … par … <br>• … est le reste dans la division euclidienne de $-1013$ par $125$</li></ul>`,
indice: 'Pour $1013 = 125 × 8 + 13$, regarde si le « reste » 13 est plus petit que 125 et que 8 : cela te dit quelle division est écrite.',
meth: 'Un reste est toujours strictement plus petit que le diviseur. Pour un dividende négatif, ajoute des multiples du diviseur.',
s: `<ul><li>12 est un <b>diviseur</b> de 24 ($24 = 12 × 2$).</li><li>0 est un <b>multiple</b> de 56 ($0 = 56 × 0$).</li>
<li>Dans $1013 = 125 × 8 + 13$, le reste 13 est inférieur à 125 mais <b>pas</b> à 8 : c’est la division euclidienne de <b>1013</b> par <b>125</b>, de quotient 8 et de reste 13. Donc <b>125</b> est le <b>diviseur</b> dans la division euclidienne de <b>1013</b> par <b>125</b>. (Ce n’est pas la division par 8 : $13 ≥ 8$.)</li>
<li>$-1013 = 125 × (-9) + 112$, car $125 × 9 = 1125$ et $1125 - 1013 = 112$. Le reste est <b>112</b>.</li></ul>` })
]
},
]
};
