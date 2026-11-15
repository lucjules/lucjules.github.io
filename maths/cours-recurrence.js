/* Contenu du cours — recurrence. Écrit avec les outils de lib.js (formules $…$, boîtes bDef/bThm/…, quick, demo, Q, C, X). */
COURS.recurrence = {
id: 'recurrence', nom: 'Récurrence et suites', page: 'recurrence.html', partie: 'Compléments', titre: 'Récurrence et suites',
hero: 'Prouver une infinité de cas… en deux étapes',
lead: 'Le raisonnement par récurrence démontre une propriété pour tous les entiers à la fois. Deux chapitres : la méthode, puis ses applications aux sommes classiques et aux suites.',
outils: [],
pieges: [
  ['Hérédité sans initialisation', 'Sans le premier rang vérifié, la preuve ne démarre pas : « $n = n + 1$ » est héréditaire mais fausse.'],
  ['Supposer P(n + 1)', 'Dans l’hérédité, on suppose $P(n)$ et on démontre $P(n + 1)$ : jamais l’inverse.'],
  ['Quelques valeurs ≠ preuve', 'Vérifier $P(n)$ pour $n = 1, 2, 3$ ne démontre rien pour tous les entiers.']
],
chapitres: [
{
id: 'r1', court: 'Le raisonnement par récurrence', titre: 'Le raisonnement par récurrence', duree: '1 h',
resume: 'Initialisation, hérédité, conclusion : rédiger une preuve par récurrence, l’appliquer à une somme, une divisibilité, une inégalité.',
intro: 'Comment démontrer qu’une propriété est vraie pour <b>tous</b> les entiers, alors qu’il y en a une infinité ? Avec l’image des <b>dominos</b> : si le premier tombe, et si chaque domino fait tomber le suivant, alors ils tombent tous.',
objectifs: [
  'énoncer les <b>trois étapes</b> d’une récurrence : initialisation, hérédité, conclusion ;',
  '<b>rédiger</b> une preuve complète en nommant $P(n)$ ;',
  'appliquer la méthode à une <b>somme</b>, une <b>divisibilité</b> et une <b>inégalité</b> ;',
  'repérer les <b>erreurs classiques</b> (hérédité sans initialisation, supposer $P(n+1)$).'
],
prerequis: ['Les quantificateurs et les implications (logique, chapitres 1 et 3).', 'La divisibilité (arithmétique, chapitre 1).'],
sections: [
{ t: 'Le principe', h: `
<p>Imagine une file infinie de dominos numérotés $n_0, n_0 + 1, n_0 + 2, …$ Tous tombent si (1) le premier tombe et (2) chaque domino qui tombe fait tomber le suivant.</p>
${bThm('Principe de récurrence', `<p>Pour montrer qu’une propriété $P(n)$ est vraie pour tout entier $n ≥ n_0$ :</p>${steps([
  '<b>Initialisation</b> : vérifier que $P(n_0)$ est vraie.',
  '<b>Hérédité</b> : soit $n ≥ n_0$ <b>fixé</b>. On suppose $P(n)$ vraie (c’est l’<b>hypothèse de récurrence</b>) et on démontre que $P(n + 1)$ est vraie.',
  '<b>Conclusion</b> : d’après le principe de récurrence, $P(n)$ est vraie pour tout $n ≥ n_0$.'])}`)}
${bMeth('La règle d’or', '<p><b>Énonce clairement $P(n)$ avant de commencer</b> : « Soit $P(n)$ la propriété : … ». Sans cela, on ne sait plus ce qu’on suppose ni ce qu’il faut démontrer.</p>')}
${bTrap('Les deux erreurs mortelles', `<ul><li>Sans <b>initialisation</b>, l’hérédité ne prouve rien : « $n = n + 1$ » est héréditaire (si $n = n + 1$ alors $n + 1 = n + 2$) mais elle est fausse pour tout $n$.</li>
<li>Dans l’hérédité, on <b>suppose $P(n)$</b> et on démontre $P(n + 1)$. Ne suppose pas $P(n + 1)$, et ne vérifie pas pour quelques valeurs de $n$ en croyant avoir terminé.</li></ul>`)}` },

{ t: 'Rédiger une récurrence : l’exemple de la somme des entiers', h: `
${bEx('Montrer que 1 + 2 + … + n = n(n + 1)/2 pour tout n ≥ 1', `<p><b>Énoncé de la propriété.</b> $P(n)$ : « $1 + 2 + … + n = frac{n(n+1)}{2}$ ».</p>
<p><b>Initialisation.</b> Pour $n = 1$ : le membre de gauche vaut $1$ ; le membre de droite vaut $frac{1 × 2}{2} = 1$. $P(1)$ est vraie.</p>
<p><b>Hérédité.</b> Soit $n ≥ 1$ tel que $P(n)$ est vraie. Alors</p>
$$1 + 2 + … + n + (n + 1) = frac{n(n+1)}{2} + (n + 1) ;; hypothèse de récurrence
 = frac{n(n+1) + 2(n+1)}{2} ;; même dénominateur
 = frac{(n+1)(n+2)}{2} ;; on factorise (n + 1)$$
<p>C’est exactement $P(n + 1)$ (remplacer $n$ par $n + 1$ dans $frac{n(n+1)}{2}$).</p>
<p><b>Conclusion.</b> $P(1)$ est vraie et $P(n) ⇒ P(n + 1)$ pour tout $n ≥ 1$ : par récurrence, $P(n)$ est vraie pour tout $n ≥ 1$. ∎</p>`)}
${bMeth('Le schéma type pour une somme', '<p>Écris la somme au rang $n + 1$ comme la <b>somme au rang $n$ plus le dernier terme</b>, remplace la somme au rang $n$ par l’hypothèse de récurrence, puis mets au même dénominateur et <b>factorise</b> pour retrouver la formule au rang $n + 1$.</p>')}
${quick('Dans l’hérédité de la preuve ci-dessus, par quoi remplace-t-on $1 + 2 + … + n$ ? (écris la formule de $P(n)$ avec une fraction, ex. n(n+1)/2)', 'n(n+1)/2|(n(n+1))/2', 'On utilise l’<b>hypothèse de récurrence</b> $P(n)$ : $1 + 2 + … + n = frac{n(n+1)}{2}$.')}` },

{ t: 'Récurrence et divisibilité', h: `
${bEx('Pour tout n ∈ ℕ, 3 divise 4ⁿ + 2', `<p>$P(n)$ : « $3 | 4^n + 2$ ».</p>
<p><b>Initialisation.</b> $n = 0$ : $4^0 + 2 = 3$, divisible par 3.</p>
<p><b>Hérédité.</b> Supposons $3 | 4^n + 2$. On fait apparaître l’hypothèse :</p>$$4^{n+1} + 2 = 4(4^n + 2) - 6$$
<p>Par hypothèse, $3 | 4(4^n + 2)$ ; et $3 | 6$. Donc 3 divise la différence $4^{n+1} + 2$ : $P(n + 1)$ est vraie.</p>
<p><b>Conclusion.</b> $3 | 4^n + 2$ pour tout $n ∈ ℕ$. ∎</p>`)}
${bMeth('Divisibilité par récurrence', '<p>Écris le terme au rang $n + 1$ comme une <b>combinaison</b> du terme au rang $n$ et d’une constante divisible par le même nombre : $u_{n+1} = k·u_n + (text{multiple de } d)$.</p>')}
${bInfo('Avec les congruences', '<p>Autre preuve : $4 ≡ 1 (3)$ donc $4^n ≡ 1$ et $4^n + 2 ≡ 3 ≡ 0 (3)$. La récurrence reste utile quand les congruences ne s’appliquent pas directement.</p>')}` },

{ t: 'Récurrence et inégalités', h: `
${bEx('Pour tout n ∈ ℕ, 2ⁿ ≥ n + 1', `<p>$P(n)$ : « $2^n ≥ n + 1$ ».</p>
<p><b>Initialisation.</b> $n = 0$ : $2^0 = 1 ≥ 1$ ✓.</p>
<p><b>Hérédité.</b> Supposons $2^n ≥ n + 1$. Alors</p>$$2^{n+1} = 2 × 2^n ≥ 2(n + 1) = 2n + 2 ≥ n + 2 ;; car n ≥ 0$$
<p>On a bien $2^{n+1} ≥ (n + 1) + 1$ : $P(n + 1)$ est vraie.</p>
<p><b>Conclusion.</b> $2^n ≥ n + 1$ pour tout $n ∈ ℕ$. ∎</p>`)}
${bMeth('Une inégalité par récurrence', '<p>Multiplie ou ajoute des deux côtés de l’hypothèse de récurrence, puis <b>minore</b> pour retrouver exactement le membre de droite du rang $n + 1$.</p>')}
${bRem('Commencer plus loin', '<p>Si la propriété n’est vraie qu’à partir d’un rang $n_0$ (par exemple $n ≥ 3$), l’initialisation se fait avec $n = n_0$ et l’hérédité est menée pour $n ≥ n_0$.</p>')}` }
],
retenir: [
  '<b>Récurrence</b> : initialisation $P(n_0)$ ; hérédité ($P(n) ⇒ P(n + 1)$ pour $n ≥ n_0$ fixé) ; conclusion.',
  'Énonce clairement $P(n)$ avant de commencer.',
  '<b>Somme</b> : somme au rang $n + 1$ = somme au rang $n$ + dernier terme, puis hypothèse de récurrence, puis factorisation.',
  '<b>Divisibilité</b> : $u_{n+1} = k·u_n + (text{multiple de } d)$.',
  '<b>Inégalité</b> : encadrer à partir de l’hypothèse de récurrence en retrouvant la forme du rang $n + 1$.',
  'Sans initialisation, l’hérédité ne prouve rien ; ne jamais supposer $P(n + 1)$.'
],
pieges: [
  ['Hérédité sans initialisation', 'Sans le premier rang vérifié, la preuve ne démarre pas.'],
  ['Supposer P(n + 1)', 'On suppose $P(n)$, on démontre $P(n + 1)$.'],
  ['Quelques valeurs ≠ preuve', 'Vérifier pour $n = 1, 2, 3$ ne prouve rien pour tout $n$.']
],
quiz: [
  Q('Les trois étapes d’une démonstration par récurrence sont…', ['initialisation, hérédité, conclusion', 'hypothèse, calcul, vérification', 'initialisation, calcul, test', 'hérédité, contradiction, conclusion'], 'On vérifie le premier rang, on prouve que la propriété se transmet de n à n + 1, puis on conclut.'),
  Q('Dans l’hérédité, on suppose…', ['P(n) vraie pour un n fixé et on démontre P(n + 1)', 'P(n + 1) vraie et on démontre P(n)', 'P(n) vraie pour tout n', 'P(0) fausse'], 'L’hypothèse de récurrence est P(n) pour un entier n ≥ n₀ fixé.'),
  Q('Si on oublie l’initialisation…', ['l’hérédité seule ne prouve rien', 'la preuve reste valable', 'il suffit de tester n = 2', 'la conclusion est automatique'], 'Sans premier domino qui tombe, la chute ne démarre pas. Exemple : « n = n + 1 » est héréditaire mais fausse.'),
  Q('Pour démontrer par récurrence que P(n) est vraie pour tout n ≥ 3, l’initialisation se fait avec…', ['n = 3', 'n = 0', 'n = 1', 'n = 4'], 'On commence au premier rang de la propriété : n₀ = 3.'),
  Q('Pour prouver 3 | 4ⁿ + 2 par récurrence, l’hérédité écrit 4ⁿ⁺¹ + 2 = ?', ['4(4ⁿ + 2) − 6', '4ⁿ + 2 + 4', '(4ⁿ + 2)²', '3(4ⁿ + 2)'], '4(4ⁿ + 2) − 6 = 4ⁿ⁺¹ + 8 − 6 : 3 divise 4(4ⁿ + 2) et 6, donc leur différence.'),
  Q('Dans la preuve de 1 + 2 + … + n = n(n + 1)/2, l’hypothèse de récurrence sert à remplacer…', ['la somme 1 + … + n par n(n + 1)/2', 'n par n + 1', 'le terme n + 1 par 0', 'la formule par une inégalité'], 'On écrit la somme au rang n + 1 comme somme au rang n plus (n + 1), puis on utilise l’hypothèse sur la somme au rang n.'),
  Q('Quel est le défaut d’un raisonnement « on a vérifié pour n = 1, 2, 3, 4, donc c’est vrai pour tout n » ?', ['ce n’est pas une démonstration', 'il faut vérifier jusqu’à n = 10', 'il manque la conclusion', 'il est correct'], 'Un nombre fini de vérifications ne prouve rien sur une infinité d’entiers.')
],
cartes: [
  C('Principe de récurrence', '1. Initialisation : P(n₀) vraie.\n2. Hérédité : P(n) ⇒ P(n + 1) pour n ≥ n₀ fixé.\n3. Conclusion : P(n) vraie pour tout n ≥ n₀.'),
  C('La règle d’or de la récurrence', 'Énoncer clairement P(n) avant de commencer.'),
  C('Schéma pour une somme', 'Somme au rang n + 1 = somme au rang n + dernier terme ; remplacer par l’hypothèse ; même dénominateur ; factoriser.'),
  C('Divisibilité par récurrence', 'Écrire le rang n + 1 comme k × (rang n) + multiple de d.\nEx. : 4ⁿ⁺¹ + 2 = 4(4ⁿ + 2) − 6.'),
  C('Pourquoi l’initialisation est-elle indispensable ?', '« n = n + 1 » est héréditaire mais fausse : sans premier rang, l’hérédité ne prouve rien.')
],
exos: [
X('Exercice 1', { id: 'r1-1', niv: 1, src: 'TD', q: `<p>Montrer par récurrence que pour tout entier $n ≥ 1$ : $1 + 2 + … + n = frac{n(n + 1)}{2}$.</p>`,
indice: 'Écris la propriété $P(n)$, vérifie $n = 1$, puis ajoute $(n + 1)$ des deux côtés de $P(n)$.',
meth: 'Initialisation, hérédité (hypothèse de récurrence, mise au même dénominateur, factorisation), conclusion.',
s: `<p><b>Propriété.</b> $P(n)$ : $1 + 2 + … + n = frac{n(n+1)}{2}$.</p><p><b>Initialisation</b> ($n = 1$). $1 = frac{1 × 2}{2}$ ✓.</p><p><b>Hérédité.</b> Soit $n ≥ 1$ avec $P(n)$. Alors $$1 + … + n + (n + 1) = frac{n(n+1)}{2} + (n+1) = frac{n(n+1) + 2(n+1)}{2} = frac{(n+1)(n+2)}{2}$$ c’est $P(n + 1)$.</p><p><b>Conclusion.</b> $P(n)$ est vraie pour tout $n ≥ 1$. ∎</p>` }),

X('Exercice 2', { id: 'r1-2', niv: 1, src: 'TD', q: `<p>Conjecturer puis démontrer par récurrence la somme des $n$ premiers entiers impairs : $1 + 3 + 5 + … + (2n - 1)$.</p>`,
indice: 'Calcule les premières valeurs : $n = 1, 2, 3, 4$. Que remarques-tu ? Le $(n+1)$-ième impair est $2n + 1$.',
meth: 'Conjecture avec les premières sommes, puis récurrence : le terme ajouté au rang $n + 1$ est $2(n + 1) - 1 = 2n + 1$.',
s: `<p><b>Conjecture.</b> $1 = 1$ ; $1 + 3 = 4$ ; $1 + 3 + 5 = 9$ ; $1 + 3 + 5 + 7 = 16$ : on conjecture $1 + 3 + … + (2n - 1) = n^2$.</p><p><b>Initialisation</b> ($n = 1$). $1 = 1^2$ ✓.</p><p><b>Hérédité.</b> Si $1 + 3 + … + (2n - 1) = n^2$, alors $$1 + 3 + … + (2n-1) + (2n+1) = n^2 + (2n + 1) = (n + 1)^2$$ <b>Conclusion.</b> La formule est vraie pour tout $n ≥ 1$. ∎</p>` }),

X('Exercice 3', { id: 'r1-3', niv: 2, src: 'Synthèse', q: `<p>Montrer par récurrence que pour tout entier $n ≥ 0$, $4^n + 2$ est divisible par $3$.</p>`,
indice: 'Au rang $n + 1$ : essaie d’écrire $4^{n+1} + 2$ avec le terme $4^n + 2$ que tu connais.',
meth: '$4^{n+1} + 2 = 4(4^n + 2) - 6$.',
s: `<p>$P(n)$ : « $3 | 4^n + 2$ ». <b>Initialisation</b> : $4^0 + 2 = 3$ ✓. <b>Hérédité</b> : si $3 | 4^n + 2$, alors $4^{n+1} + 2 = 4(4^n + 2) - 6$ ; 3 divise $4(4^n + 2)$ (hypothèse) et 3 divise 6 : 3 divise leur différence. <b>Conclusion</b> : $3 | 4^n + 2$ pour tout $n ∈ ℕ$. ∎</p>` }),

X('Exercice 4', { id: 'r1-4', niv: 2, src: 'Travail perso', q: `<ol><li>Montrer par récurrence que pour tout entier $n ∈ ℕ$, $2^n ≥ n + 1$.</li><li>Montrer par récurrence que pour tout entier $n ∈ ℕ$, $7^n - 3^n$ est divisible par $4$.</li></ol>`,
indice: '1 : minore $2 × 2^n$ en partant de $2^n ≥ n + 1$. 2 : écris $7^{n+1} - 3^{n+1} = 7(7^n - 3^n) + 4 × 3^n$.',
meth: '1 : $2^{n+1} ≥ 2(n+1) ≥ n + 2$. 2 : fais apparaître $7^n - 3^n$ avec un reste multiple de 4.',
s: `<ol><li><b>Initialisation</b> ($n = 0$) : $2^0 = 1 ≥ 1$ ✓. <b>Hérédité</b> : si $2^n ≥ n + 1$, alors $2^{n+1} = 2 × 2^n ≥ 2(n+1) = 2n + 2 ≥ n + 2$ (car $n ≥ 0$), soit $2^{n+1} ≥ (n + 1) + 1$. <b>Conclusion</b> : vrai pour tout $n ∈ ℕ$. ∎</li>
<li>$P(n)$ : « $4 | 7^n - 3^n$ ». <b>Initialisation</b> : $7^0 - 3^0 = 0$, divisible par 4 ✓. <b>Hérédité</b> : $$7^{n+1} - 3^{n+1} = 7 × 7^n - 3 × 3^n = 7(7^n - 3^n) + 4 × 3^n$$ 4 divise $7(7^n - 3^n)$ (hypothèse) et $4 × 3^n$ : donc la somme. <b>Conclusion</b> : $4 | 7^n - 3^n$ pour tout $n ∈ ℕ$. ∎</li></ol>` })
]
},
{
id: 'r2', court: 'Sommes classiques et suites', titre: 'Sommes classiques et suites', duree: '1 h 15',
resume: 'Les sommes $∑k$, $∑k^2$, $∑k^3$, $∑(2k-1)$ ; suites arithmétiques et géométriques ; démontrer une forme explicite par récurrence.',
intro: 'Additionner les $n$ premiers entiers, carrés ou cubes, calculer le terme d’une suite sans calculer tous les précédents : voilà deux grands usages de la récurrence. Tu apprends les <b>formules</b> et comment les <b>démontrer</b>.',
objectifs: [
  'lire et écrire une somme avec le symbole $∑$ ;',
  'connaître les <b>quatre sommes classiques</b> et les démontrer par récurrence ;',
  'distinguer une suite <b>arithmétique</b> d’une suite <b>géométrique</b> et écrire leur forme explicite ;',
  'démontrer une <b>forme explicite</b> ou un <b>encadrement</b> d’une suite définie par récurrence.'
],
prerequis: ['Le raisonnement par récurrence (chapitre précédent).'],
sections: [
{ t: 'Le symbole ∑ et les sommes à connaître', h: `
<p>Le symbole $∑$ (sigma) résume une addition : $∑_{k=1}^{n} u_k = u_1 + u_2 + … + u_n$. Quatre formules sont à connaître <b>par cœur</b>.</p>
${tt(['Somme', 'Formule'], [['1 + 2 + … + n', 'n(n + 1) / 2'], ['1² + 2² + … + n²', 'n(n + 1)(2n + 1) / 6'], ['1³ + 2³ + … + n³', '(n(n + 1) / 2)²'], ['1 + 3 + 5 + … + (2n − 1)', 'n²']], { raw: true, plain: true })}
${bRem('L’astuce de Gauss', '<p>Pour $1 + 2 + … + n$, on écrit la somme dans les deux sens et on additionne terme à terme : chaque paire fait $n + 1$, et il y a $n$ paires, donc $2S = n(n + 1)$. C’est la forme $frac{n(n+1)}{2}$.</p>')}
${bEx('Valeurs utiles pour vérifier', `<ul><li>$1^3 + 2^3 + 3^3 + 4^3 = 100 = (frac{4 × 5}{2})^2$.</li><li>$1^2 + 2^2 + 3^2 + 4^2 + 5^2 = 55 = frac{5 × 6 × 11}{6}$.</li><li>Les six premiers impairs : $1 + 3 + 5 + 7 + 9 + 11 = 36 = 6^2$.</li></ul>`)}
${quick('Que vaut $1 + 2 + 3 + … + 10$ ?', '55', 'Formule : $frac{10 × 11}{2} = 55$.')}` },

{ t: 'Démontrer les sommes par récurrence', h: `
<p>Les formules ci-dessus se démontrent avec le schéma de somme du chapitre précédent : on <b>ajoute le terme suivant</b> et on factorise.</p>
${bEx('Les impairs : somme = n²', `<p>$P(n)$ : $1 + 3 + … + (2n - 1) = n^2$. Initialisation : $1 = 1^2$. Hérédité : $n^2 + (2n + 1) = (n + 1)^2$ ✓.</p>`)}
${bEx('Les carrés : n(n + 1)(2n + 1) / 6', `<p>Initialisation ($n = 1$) : $1 = frac{1 × 2 × 3}{6}$ ✓. Hérédité : on ajoute $(n + 1)^2$ :</p>$$frac{n(n+1)(2n+1)}{6} + (n+1)^2 = frac{(n+1)[n(2n+1) + 6(n+1)]}{6} ;; on factorise (n + 1)
 = frac{(n+1)(2n^2 + 7n + 6)}{6} ;; n(2n + 1) + 6(n + 1) = 2n² + 7n + 6
 = frac{(n+1)(n+2)(2n+3)}{6} ;; 2n² + 7n + 6 = (n + 2)(2n + 3)$$
<p>C’est la formule au rang $n + 1$ ($(n+1)+1 = n+2$ et $2(n+1)+1 = 2n+3$). ∎</p>`)}
${bEx('Les cubes : (n(n + 1)/2)²', `<p>Initialisation : $1 = (frac{1 × 2}{2})^2$. Hérédité : on ajoute $(n + 1)^3$ :</p>$$(frac{n(n+1)}{2})^2 + (n+1)^3 = (n+1)^2[frac{n^2}{4} + (n+1)] = (n+1)^2 × frac{n^2 + 4n + 4}{4} = (n+1)^2 × frac{(n+2)^2}{4} = (frac{(n+1)(n+2)}{2})^2$$<p>∎</p>`)}` },

{ t: 'Suites arithmétiques et géométriques', h: `
<p>Une <b>suite</b> $(u_n)$ associe un réel $u_n$ à chaque entier $n$. Souvent elle est définie <b>par récurrence</b> : $u_{n+1}$ en fonction de $u_n$. Deux familles ont une <b>forme explicite</b> simple.</p>
${tt(['Type', 'Par récurrence', 'Forme explicite'], [['Arithmétique (raison r)', 'uₙ₊₁ = uₙ + r', 'uₙ = u₀ + n·r'], ['Géométrique (raison q)', 'uₙ₊₁ = q × uₙ', 'uₙ = u₀ × qⁿ']], { raw: true, plain: true })}
${bEx('Deux exemples', `<ul><li>$u_0 = 2$ et $u_{n+1} = u_n + 3$ (arithmétique de raison 3) : $u_n = 3n + 2$, donc $u_5 = 17$ (suite : $2, 5, 8, 11, 14, 17$).</li><li>$u_0 = 3$ et $u_{n+1} = 2u_n$ (géométrique de raison 2) : $u_n = 3 × 2^n$, donc $u_4 = 48$ (suite : $3, 6, 12, 24, 48$).</li></ul>`)}
${bMeth('Démontrer une forme explicite', `<p>Par récurrence : on vérifie la formule pour $n = 0$ ; pour l’hérédité, on part de $u_{n+1}$ <b>défini par la récurrence</b>, on remplace $u_n$ par la formule (hypothèse), et on retrouve la formule au rang $n + 1$.</p>`)}
${bEx('u₀ = 2 et uₙ₊₁ = uₙ + 3 ⇒ uₙ = 3n + 2', `<p>Initialisation : $3 × 0 + 2 = 2 = u_0$ ✓. Hérédité : $u_{n+1} = u_n + 3 = 3n + 2 + 3 = 3(n + 1) + 2$ ✓.</p>`)}
${quick('Pour $u_0 = 5$ et $u_{n+1} = u_n - 2$, que vaut $u_4$ ?', '-3', 'Suite arithmétique de raison $-2$ : $u_n = 5 - 2n$, donc $u_4 = 5 - 8 = -3$.')}` },

{ t: 'Des suites moins faciles', h: `
${bEx('uₙ₊₁ = uₙ + 2n + 2 avec u₀ = 0', `<p>Les premiers termes : $u_1 = 0 + 0 + 2 = 2$, $u_2 = 2 + 2 + 2 = 6$, $u_3 = 6 + 4 + 2 = 12$. On conjecture $u_n = n(n + 1)$.</p>
<p>Initialisation : $u_0 = 0 = 0 × 1$ ✓. Hérédité : $u_{n+1} = n(n+1) + 2n + 2 = n^2 + 3n + 2 = (n + 1)(n + 2)$ ✓.</p>`)}
${bEx('u₀ = −2 et uₙ₊₁ = ½uₙ + 3', `<p>$u_1 = -1 + 3 = 2$, $u_2 = 1 + 3 = 4$, … La suite semble croître sans dépasser 6. Deux propriétés se démontrent par récurrence :</p>
<ul><li><b>Encadrement $u_n < 6$.</b> Initialisation : $u_0 = -2 < 6$. Hérédité : si $u_n < 6$ alors $frac{1}{2}u_n < 3$, donc $u_{n+1} = frac{1}{2}u_n + 3 < 6$ ✓.</li>
<li><b>Forme explicite $u_n = 6 - 8(frac{1}{2})^n$.</b> Initialisation : $6 - 8 = -2$ ✓. Hérédité : $u_{n+1} = frac{1}{2}(6 - 8(frac{1}{2})^n) + 3 = 3 - 4(frac{1}{2})^n + 3 = 6 - 8(frac{1}{2})^{n+1}$ ✓.</li></ul>
<p>Comme $(frac{1}{2})^n$ tend vers 0, la suite se rapproche de 6 sans l’atteindre.</p>`)}` }
],
retenir: [
  '$∑_{k=1}^{n} k = frac{n(n+1)}{2}$ ; $∑ k^2 = frac{n(n+1)(2n+1)}{6}$ ; $∑ k^3 = (frac{n(n+1)}{2})^2$ ; $∑ (2k-1) = n^2$.',
  'Hérédité d’une somme : on ajoute le terme du rang $n + 1$ à la formule du rang $n$, puis on factorise.',
  '<b>Arithmétique</b> : $u_{n+1} = u_n + r ⇒ u_n = u_0 + nr$ ; <b>géométrique</b> : $u_{n+1} = q·u_n ⇒ u_n = u_0 q^n$.',
  'Forme explicite : par récurrence, en partant de la relation $u_{n+1} = f(u_n)$ et de l’hypothèse sur $u_n$.',
  'Encadrement d’une suite : $u_n < 6 ⇒ frac{1}{2}u_n + 3 < 6$ transmet l’inégalité.'
],
pieges: [
  ['Oublier le dernier terme', 'Au rang $n + 1$ on ajoute le terme d’indice $n + 1$ ($2(n+1) - 1 = 2n + 1$ pour les impairs), pas celui d’indice $n$.'],
  ['Confondre u₀ et u₁', 'Vérifie dans quel ordre démarre la suite : $u_n = u_0 + nr$ part du rang 0.']
],
quiz: [
  Q('1 + 2 + 3 + … + n est égal à…', ['n(n + 1)/2', 'n²/2', 'n(n − 1)/2', 'n(n + 1)'], 'Formule de Gauss : n(n + 1)/2.'),
  Q('1³ + 2³ + 3³ + 4³ est égal à…', ['100', '30', '64', '55'], '(4 × 5 / 2)² = 10² = 100.'),
  Q('Quelle est la somme des 6 premiers nombres impairs ?', ['36', '21', '30', '49'], '1 + 3 + 5 + 7 + 9 + 11 = 36 = 6².'),
  Q('1² + 2² + 3² + 4² + 5² est égal à…', ['55', '15', '225', '45'], '5 × 6 × 11 / 6 = 55.'),
  Q('u₀ = 2 et uₙ₊₁ = uₙ + 3. Que vaut u₅ ?', ['17', '15', '20', '14'], 'Suite arithmétique : uₙ = 2 + 3n, donc u₅ = 17.'),
  Q('u₀ = 3 et uₙ₊₁ = 2uₙ. Que vaut u₄ ?', ['48', '24', '96', '12'], 'Suite géométrique : uₙ = 3 × 2ⁿ, donc u₄ = 48.'),
  Q('u₀ = 0 et uₙ₊₁ = uₙ + 2n + 2. Que vaut u₃ ?', ['12', '6', '9', '10'], 'u₁ = 2, u₂ = 6, u₃ = 12 : on retrouve n(n + 1).'),
  Q('u₀ = −2 et uₙ₊₁ = ½uₙ + 3. Que vaut u₂ ?', ['4', '2', '3', '6'], 'u₁ = −1 + 3 = 2 puis u₂ = 1 + 3 = 4.'),
  Q('Hérédité de « uₙ < 6 » pour uₙ₊₁ = ½uₙ + 3 : on écrit…', ['uₙ < 6 ⇒ ½uₙ < 3 ⇒ uₙ₊₁ < 6', 'uₙ₊₁ < 6 ⇒ uₙ < 6', 'uₙ = 6 ⇒ uₙ₊₁ = 6', 'uₙ > 6 ⇒ uₙ₊₁ > 6'], 'On part de l’hypothèse sur uₙ et on la transforme en une hypothèse sur uₙ₊₁.'),
  Q('Σ_{k=1}^{4} k² = ?', ['30', '10', '16', '24'], '1 + 4 + 9 + 16 = 30.'),
  Q('Si u₀ = 5 et uₙ₊₁ = uₙ − 2, alors u₄ = ?', ['−3', '3', '−1', '1'], 'uₙ = 5 − 2n, donc u₄ = 5 − 8 = −3.')
],
cartes: [
  C('Somme 1 + 2 + … + n', 'n(n + 1)/2'),
  C('Somme 1² + 2² + … + n²', 'n(n + 1)(2n + 1)/6'),
  C('Somme 1³ + 2³ + … + n³', '(n(n + 1)/2)²'),
  C('Somme 1 + 3 + 5 + … + (2n − 1)', 'n²'),
  C('Suite arithmétique de raison r', 'uₙ₊₁ = uₙ + r\nuₙ = u₀ + n·r'),
  C('Suite géométrique de raison q', 'uₙ₊₁ = q·uₙ\nuₙ = u₀ × qⁿ'),
  C('Comment démontrer une forme explicite ?', 'Récurrence : on vérifie n = 0 ; hérédité : u(n+1) défini par la relation, on remplace uₙ par la formule.'),
  C('Somme 1 + 2 + … + 10', '55 (formule n(n + 1)/2 avec n = 10).')
],
exos: [
X('Exercice 1', { id: 'r2-1', niv: 2, src: 'TD', q: `<p>Montrer par récurrence que pour tout $n ≥ 1$ : $1^3 + 2^3 + … + n^3 = (frac{n(n + 1)}{2})^2$.</p>`,
indice: 'Au rang $n + 1$, on ajoute $(n + 1)^3$. Factorise $(n + 1)^2$ dans la somme.',
meth: 'Hérédité : $(frac{n(n+1)}{2})^2 + (n+1)^3 = (n+1)^2[frac{n^2}{4} + (n+1)]$ ; remarque que $n^2 + 4n + 4 = (n + 2)^2$.',
s: `<p><b>Initialisation</b> ($n = 1$). $1 = (frac{1 × 2}{2})^2 = 1$ ✓.</p><p><b>Hérédité.</b> Supposons $P(n)$. Alors $$(frac{n(n+1)}{2})^2 + (n+1)^3 = (n+1)^2[frac{n^2}{4} + (n+1)] = (n+1)^2 × frac{n^2 + 4n + 4}{4} = (n+1)^2 × frac{(n+2)^2}{4} = (frac{(n+1)(n+2)}{2})^2$$ C’est $P(n + 1)$.</p><p><b>Conclusion.</b> La formule est vraie pour tout $n ≥ 1$. ∎</p>` }),

X('Exercice 2', { id: 'r2-2', niv: 2, src: 'Synthèse', q: `<p>Montrer par récurrence que pour tout $n ≥ 1$ : $1^2 + 2^2 + 3^2 + … + n^2 = frac{n(n + 1)(2n + 1)}{6}$.</p>`,
indice: 'Au rang $n + 1$, on ajoute $(n + 1)^2$. Mets au même dénominateur 6 et factorise $(n + 1)$.',
meth: 'Hérédité : $frac{n(n+1)(2n+1)}{6} + (n+1)^2 = frac{(n+1)[n(2n+1) + 6(n+1)]}{6}$, puis $2n^2 + 7n + 6 = (n+2)(2n+3)$.',
s: `<p><b>Initialisation</b> ($n = 1$). $1 = frac{1 × 2 × 3}{6}$ ✓.</p><p><b>Hérédité.</b> Si $P(n)$ est vraie, $$frac{n(n+1)(2n+1)}{6} + (n+1)^2 = frac{(n+1)[n(2n+1) + 6(n+1)]}{6} = frac{(n+1)(2n^2 + 7n + 6)}{6} = frac{(n+1)(n+2)(2n+3)}{6}$$ car $2n^2 + 7n + 6 = (n + 2)(2n + 3)$. C’est la formule au rang $n + 1$.</p><p><b>Conclusion.</b> Vraie pour tout $n ≥ 1$. ∎</p>` }),

X('Exercice 3', { id: 'r2-3', niv: 1, src: 'TD', q: `<ol><li>Soit $(u_n)$ définie par $u_0 = 2$ et $u_{n+1} = u_n + 3$. Calculer $u_1, …, u_5$ et démontrer par récurrence que $u_n = 3n + 2$.</li><li>Soit $(v_n)$ définie par $v_0 = 3$ et $v_{n+1} = 2v_n$. Calculer $v_1, …, v_4$ et démontrer par récurrence que $v_n = 3 × 2^n$.</li></ol>`,
indice: 'Pour l’hérédité, pars de la définition $u_{n+1} = u_n + 3$ et remplace $u_n$ par $3n + 2$.',
meth: 'Initialisation à $n = 0$ ; hérédité en utilisant la relation de récurrence puis l’hypothèse.',
s: `<ol><li>$u_1 = 5$, $u_2 = 8$, $u_3 = 11$, $u_4 = 14$, $u_5 = 17$. <b>Initialisation</b> : $3 × 0 + 2 = 2 = u_0$ ✓. <b>Hérédité</b> : si $u_n = 3n + 2$, alors $u_{n+1} = u_n + 3 = 3n + 2 + 3 = 3(n + 1) + 2$ ✓. <b>Conclusion</b> : $u_n = 3n + 2$ pour tout $n$.</li>
<li>$v_1 = 6$, $v_2 = 12$, $v_3 = 24$, $v_4 = 48$. <b>Initialisation</b> : $3 × 2^0 = 3 = v_0$ ✓. <b>Hérédité</b> : si $v_n = 3 × 2^n$, alors $v_{n+1} = 2v_n = 2 × 3 × 2^n = 3 × 2^{n+1}$ ✓. <b>Conclusion</b> : $v_n = 3 × 2^n$ pour tout $n$.</li></ol>` }),

X('Exercice 4', { id: 'r2-4', niv: 3, src: 'TD', q: `<p>Soit $(u_n)$ définie par $u_0 = -2$ et $u_{n+1} = frac{1}{2}u_n + 3$.</p><ol><li>Calculer $u_1$ et $u_2$.</li><li>Démontrer par récurrence que $u_n < 6$ pour tout $n$.</li><li>Démontrer par récurrence que $u_n = 6 - 8(frac{1}{2})^n$.</li></ol>`,
indice: '2 : de $u_n < 6$ déduis une inégalité sur $frac{1}{2}u_n$ puis sur $u_{n+1}$. 3 : remplace $u_n$ par la formule dans $u_{n+1} = frac{1}{2}u_n + 3$.',
meth: 'Deux récurrences indépendantes, chacune avec initialisation à $n = 0$.',
s: `<ol><li>$u_1 = frac{1}{2} × (-2) + 3 = 2$ et $u_2 = frac{1}{2} × 2 + 3 = 4$.</li>
<li>$P(n)$ : $u_n < 6$. <b>Initialisation</b> : $u_0 = -2 < 6$ ✓. <b>Hérédité</b> : si $u_n < 6$ alors $frac{1}{2}u_n < 3$, donc $u_{n+1} = frac{1}{2}u_n + 3 < 6$ ✓.</li>
<li><b>Initialisation</b> : $6 - 8 × 1 = -2 = u_0$ ✓. <b>Hérédité</b> : si $u_n = 6 - 8(frac{1}{2})^n$, alors $$u_{n+1} = frac{1}{2}(6 - 8(frac{1}{2})^n) + 3 = 3 - 4(frac{1}{2})^n + 3 = 6 - 8(frac{1}{2})^{n+1}$$ ✓. Contrôle : $u_2 = 6 - 8/4 = 4$ ✓.</li></ol>` }),

X('Exercice 5', { id: 'r2-5', niv: 2, src: 'TD', q: `<p>Soit $(u_n)$ définie par $u_0 = 0$ et $u_{n+1} = u_n + 2n + 2$. Calculer les premiers termes, conjecturer une formule pour $u_n$ et la démontrer par récurrence.</p>`,
indice: 'Calcule $u_1, u_2, u_3, u_4$ : cherche un lien avec $n(n + 1)$.',
meth: 'Récurrence : $u_{n+1} = n(n+1) + 2n + 2$, puis factorise.',
s: `<p>$u_1 = 2$, $u_2 = 6$, $u_3 = 12$, $u_4 = 20$ : ce sont $1 × 2$, $2 × 3$, $3 × 4$, $4 × 5$. On conjecture $u_n = n(n + 1)$.</p><p><b>Initialisation</b> : $u_0 = 0 = 0 × 1$ ✓. <b>Hérédité</b> : si $u_n = n(n+1)$, alors $u_{n+1} = n(n+1) + 2n + 2 = n^2 + 3n + 2 = (n + 1)(n + 2)$ ✓. <b>Conclusion</b> : $u_n = n(n + 1)$ pour tout $n ∈ ℕ$. ∎</p>` })
]
},
]
};
