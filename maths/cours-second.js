/* Contenu du cours — second. Écrit avec les outils de lib.js (formules $…$, boîtes bDef/bThm/…, quick, demo, Q, C, X). */
COURS.second = {
id: 'second', nom: 'Second degré', page: 'second-degre.html', partie: 'Compléments', titre: 'Fonctions du second degré',
hero: 'Le trinôme sous toutes ses coutures : racines, signe, sommet',
lead: 'Trois chapitres : résoudre une équation du second degré, étudier le signe d’un trinôme et résoudre des inéquations, puis trouver le sommet d’une parabole pour optimiser.',
outils: ['quad'],
pieges: [
  ['Racine double, Δ = 0', 'La parabole touche l’axe en un seul point : $f(x) = a(x - x_0)^2$, qui garde le signe de $a$.'],
  ['Signe de a', 'Pour $Δ > 0$ : signe de $a$ à l’<b>extérieur</b> des racines, signe de $-a$ <b>entre</b> les racines.'],
  ['Maximum ou minimum ?', '$a > 0$ : minimum au sommet ; $a < 0$ : maximum au sommet.']
],
chapitres: [
{
id: 's1', court: 'Trinôme, discriminant, racines', titre: 'Le trinôme : discriminant et racines', duree: '1 h 15',
resume: 'Forme du trinôme, parabole, discriminant, racines, factorisation, équations qu’on résout sans discriminant.',
intro: 'Une équation du second degré $ax^2 + bx + c = 0$ se résout avec <b>une seule formule</b>, celle du discriminant. Mais avant de la sortir, certaines équations se résolvent bien plus vite : produit nul, différence de carrés, carré parfait.',
objectifs: [
  'reconnaître une <b>fonction polynôme du second degré</b> et sa parabole ;',
  'calculer le <b>discriminant</b> $Δ$ et en déduire le nombre de racines ;',
  'donner les <b>racines</b> et la <b>forme factorisée</b> selon le signe de $Δ$ ;',
  'résoudre sans discriminant : <b>produit nul</b>, <b>différence de carrés</b>, <b>carré parfait</b>.'
],
prerequis: ['Développer et factoriser (identités remarquables).', 'Résoudre une équation du premier degré.'],
sections: [
{ t: 'Fonction du second degré et parabole', h: `
${bDef('Fonction polynôme du second degré', `<p>C’est une fonction définie sur $ℝ$ par $$f(x) = ax^2 + bx + c avec a ≠ 0$$ Sa courbe représentative est une <b>parabole</b>.</p>`)}
${bRem('Le rôle de a', '<p>Si $a > 0$, la parabole est tournée vers le <b>haut</b> (elle a un minimum) ; si $a < 0$, vers le <b>bas</b> (elle a un maximum). Plus $|a|$ est grand, plus la parabole est « serrée ».</p>')}
${demo('quad', { qA: '1', qB: '-3', qC: '2' }, 'Explore : change a, b, c et observe la parabole')}` },

{ t: 'Le discriminant et les racines', h: `
${bDef('Discriminant', '<p>Pour $f(x) = ax^2 + bx + c$, le <b>discriminant</b> est $$Δ = b^2 - 4ac$$</p>')}
${bThm('Racines et factorisation', `<p>Selon le signe de $Δ$ :</p>${tt(['Δ', 'Racines', 'Forme factorisée'], [['Δ > 0', 'x₁ = (−b − √Δ) / 2a et x₂ = (−b + √Δ) / 2a', 'a(x − x₁)(x − x₂)'], ['Δ = 0', 'une racine double x₀ = −b / 2a', 'a(x − x₀)²'], ['Δ < 0', 'aucune racine réelle', 'non factorisable dans ℝ']], { raw: true, plain: true })}`)}
${bProof('d’où viennent les formules', '<p>On écrit $ax^2 + bx + c = a[(x + frac{b}{2a})^2 - frac{Δ}{4a^2}]$ (forme canonique, voir le chapitre 3). Cette expression s’annule quand $(x + frac{b}{2a})^2 = frac{Δ}{4a^2}$ : deux solutions si $Δ > 0$, une si $Δ = 0$, aucune si $Δ < 0$ (un carré ne peut pas être négatif).</p>')}
${bMeth('Résoudre ax² + bx + c = 0', `${steps(['Calcule $Δ = b^2 - 4ac$ (écris les valeurs de $a$, $b$, $c$ <b>avec leurs signes</b>).', 'Selon le signe de $Δ$, applique la formule des racines (ou « aucune solution »).', 'Vérifie une racine en la remplaçant dans l’équation.'])}`)}
${bEx('−x² + 3x − 2 = 0', `<p>$a = -1$, $b = 3$, $c = -2$ : $Δ = 9 - 4 × (-1) × (-2) = 9 - 8 = 1 > 0$. Racines : $x = frac{-3 ± 1}{-2}$, soit $x = 1$ ou $x = 2$.</p>`)}
${bEx('2x² − 4x + 1 = 0', `<p>$Δ = 16 - 8 = 8 > 0$, $sqrt{8} = 2sqrt{2}$. Racines : $x = frac{4 ± 2sqrt{2}}{4} = 1 ± frac{sqrt{2}}{2}$.</p>`)}
${bEx('3x² + 5x + 7 = 0', `<p>$Δ = 25 - 84 = -59 < 0$ : <b>aucune solution réelle</b>.</p>`)}
${bEx('x² − √2·x − 3 = 0', `<p>$Δ = (sqrt{2})^2 + 12 = 14 > 0$. Racines : $x = frac{sqrt{2} ± sqrt{14}}{2}$.</p>`)}
${quick('Quel est le discriminant de $2x^2 - 4x + 1$ ?', '8', '$Δ = b^2 - 4ac = (-4)^2 - 4 × 2 × 1 = 16 - 8 = 8$.')}
${bTrap('', 'Dans $b^2 - 4ac$, fais attention aux <b>signes</b> : si $b = -4$, alors $b^2 = 16$ (et non $-16$) ; si $a$ ou $c$ est négatif, $-4ac$ change de signe.')}` },

{ t: 'Résoudre sans le discriminant', h: `
<p>Avant d’appliquer la formule, regarde si l’équation est plus simple qu’il n’y paraît. L’outil magique : un <b>produit est nul si, et seulement si, l’un de ses facteurs est nul</b> ($A × B = 0 ⇔ A = 0$ ou $B = 0$).</p>
${tt(['Situation', 'Idée', 'Exemple'], [['pas de terme constant (c = 0)', 'factoriser x', '6x² + 9x = 3x(2x + 3) = 0'], ['différence de deux carrés', 'A² − B² = (A − B)(A + B)', '4x² − 9 = (2x − 3)(2x + 3)'], ['carré parfait', 'A² ± 2AB + B²', 'x² − 4x + 4 = (x − 2)²'], ['A² = B²', '(A − B)(A + B) = 0', '(2x + 3)² = (3x − 2)²']], { raw: true, plain: true })}
${bEx('Quatre résolutions', `<ul>
<li>$6x^2 + 9x = 0 ⇔ 3x(2x + 3) = 0 ⇔ x = 0$ ou $x = -frac{3}{2}$.</li>
<li>$4x^2 - 9 = 0 ⇔ (2x - 3)(2x + 3) = 0 ⇔ x = ±frac{3}{2}$.</li>
<li>$x^2 - 4x + 4 = 0 ⇔ (x - 2)^2 = 0 ⇔ x = 2$ (racine double).</li>
<li>$(2x + 3)^2 = (3x - 2)^2 ⇔ (2x + 3 - 3x + 2)(2x + 3 + 3x - 2) = 0 ⇔ (5 - x)(5x + 1) = 0 ⇔ x = 5$ ou $x = -frac{1}{5}$.</li></ul>`)}
${bMeth('Quand un facteur commun apparaît', '<p>Dans $(x + 1)(6x + 4) + (x + 1)^2 = 0$, $(x + 1)$ est un facteur commun : $(x + 1)[(6x + 4) + (x + 1)] = (x + 1)(7x + 5) = 0$, donc $x = -1$ ou $x = -frac{5}{7}$. <b>Ne développe pas</b> : factorise !</p>')}
${quick('Résous $x^2 - 4x + 4 = 0$ : quelle est la solution ?', '2', '$x^2 - 4x + 4 = (x - 2)^2$ : l’équation a pour seule solution (racine double) $x = 2$.', 'Reconnais l’identité remarquable $(a - b)^2$.')}` }
],
retenir: [
  '$f(x) = ax^2 + bx + c$ avec $a ≠ 0$ : sa courbe est une <b>parabole</b> (vers le haut si $a > 0$, vers le bas si $a < 0$).',
  '<b>Discriminant</b> : $Δ = b^2 - 4ac$.',
  '$Δ > 0$ : deux racines $x_{1,2} = frac{-b ∓ sqrt{Δ}}{2a}$ et $f(x) = a(x - x_1)(x - x_2)$ ; $Δ = 0$ : racine double $x_0 = -frac{b}{2a}$ et $f(x) = a(x - x_0)^2$ ; $Δ < 0$ : aucune racine réelle.',
  'Avant le discriminant : <b>produit nul</b>, facteur commun, différence de carrés, carré parfait.',
  '$A × B = 0 ⇔ A = 0$ ou $B = 0$.'
],
pieges: [
  ['Racine double, Δ = 0', 'La parabole touche l’axe en un seul point : $f(x) = a(x - x_0)^2$.'],
  ['Signes dans Δ', '$b^2$ est toujours positif ; $-4ac$ change de signe si $a$ ou $c$ est négatif.'],
  ['Développer au lieu de factoriser', 'Un facteur commun se met en facteur : ne développe pas $(x + 1)(6x + 4) + (x + 1)^2$.']
],
quiz: [
  Q('Le discriminant de ax² + bx + c est…', ['b² − 4ac', 'b² + 4ac', '4ac − b²', '−b / 2a'], 'Δ = b² − 4ac. Son signe donne le nombre de racines réelles.'),
  Q('Si Δ < 0…', ['il n’y a pas de racine réelle', 'il y a deux racines', 'il y a une racine double', 'f est nulle'], 'La fonction n’est pas factorisable dans ℝ et garde le signe de a.'),
  Q('x² − 4x + 4 = 0 a pour solution…', ['x = 2 (racine double)', 'x = −2', 'x = 4', 'x = 2 et x = −2'], 'x² − 4x + 4 = (x − 2)², Δ = 0.'),
  Q('Les solutions de −x² + 3x − 2 = 0 sont…', ['1 et 2', '−1 et −2', '1 et −2', '3 et 2'], 'Δ = 1 ; x = (−3 ± 1)/(−2) donne 2 et 1.'),
  Q('Les solutions de 2x² − 4x + 1 = 0 sont…', ['1 ± √2/2', '1 ± √2', '2 ± √2', 'aucune'], 'Δ = 8 ; x = (4 ± 2√2)/4 = 1 ± √2/2.'),
  Q('3x² + 5x + 7 = 0 a…', ['aucune solution réelle (Δ = −59)', 'deux solutions', 'une solution double', 'une solution'], 'Δ = 25 − 84 = −59 < 0.'),
  Q('Pour x² − √2·x − 3 = 0, le discriminant vaut…', ['14', '10', '−10', '2 − 12'], 'Δ = (√2)² − 4 × 1 × (−3) = 2 + 12 = 14.'),
  Q('Si Δ = 0, alors f(x) = ax² + bx + c s’écrit…', ['a(x − x₀)²', 'a(x − x₁)(x − x₂)', 'a(x + x₀)', 'x₀(x − a)'], 'Racine double x₀ = −b/2a : f(x) = a(x − x₀)².'),
  Q('Les solutions de 6x² + 9x = 0 sont…', ['0 et −3/2', '0 et 3/2', '−3/2 seulement', '−2/3'], '6x² + 9x = 3x(2x + 3) : produit nul.'),
  Q('Les solutions de (2x + 3)² = (3x − 2)² sont…', ['5 et −1/5', '5 et 1/5', '−5 et 1/5', '1'], '(A − B)(A + B) = (5 − x)(5x + 1) = 0.')
],
cartes: [
  C('Discriminant et nombre de racines', 'Δ = b² − 4ac\nΔ > 0 : deux racines ; Δ = 0 : une double ; Δ < 0 : aucune.'),
  C('Racines quand Δ > 0', 'x₁ = (−b − √Δ)/2a\nx₂ = (−b + √Δ)/2a\nf(x) = a(x − x₁)(x − x₂)'),
  C('Racine double quand Δ = 0', 'x₀ = −b/2a\nf(x) = a(x − x₀)²'),
  C('Équation produit nul', 'A × B = 0 ⇔ A = 0 ou B = 0.'),
  C('Différence de carrés', 'A² − B² = (A − B)(A + B)'),
  C('Discriminant de x² − 5x + 6', 'Δ = 25 − 24 = 1. Deux racines : 2 et 3.')
],
exos: [
X('Exercice 1', { id: 's1-1', niv: 1, src: 'TD', q: `<p>Résoudre dans $ℝ$ les équations du premier degré suivantes :</p><ol><li>$2x + 3 = 0$</li><li>$frac{2}{3}x - frac{1}{4} = 0$</li><li>$15x + 5 - 1 - 2x = -9x + 6$</li></ol>`,
indice: 'Isole $x$ : regroupe les termes en $x$ d’un côté et les nombres de l’autre.',
meth: 'Équation du premier degré : $ax + b = 0 ⇔ x = -frac{b}{a}$.',
s: `<ol><li>$2x = -3$, donc <b>$x = -frac{3}{2}$</b>.</li><li>$frac{2}{3}x = frac{1}{4}$, donc $x = frac{1}{4} × frac{3}{2} = $ <b>$frac{3}{8}$</b>.</li><li>$15x + 4 - 2x = -9x + 6 ⇔ 13x + 4 = -9x + 6 ⇔ 22x = 2$, donc <b>$x = frac{1}{11}$</b>.</li></ol>` }),

X('Exercice 2', { id: 's1-2', niv: 1, src: 'TD', q: `<p>On considère la fonction $A(x) = 3(x + 3)(x - 1)$.</p><ol><li>Quel est le degré de $A$ ? Quelle est la nature de sa courbe ?</li><li>Quelles sont ses racines ?</li><li>Développer et réduire $A(x)$.</li><li>Calculer $A(x)$ pour $x = -4, -3, -2, -1, 0, 1, 2$.</li><li>Résoudre $A(x) = -9$.</li></ol>`,
indice: 'Une expression déjà factorisée donne ses racines sans calcul : un facteur nul suffit.',
meth: 'Racines : $x + 3 = 0$ ou $x - 1 = 0$. Développement : $(x + 3)(x - 1) = x^2 + 2x - 3$.',
s: `<ol><li>En développant, le terme de plus haut degré est $3x^2$ : $A$ est du <b>second degré</b>, sa courbe est une <b>parabole</b> tournée vers le haut ($a = 3 > 0$).</li>
<li>$A(x) = 0 ⇔ x + 3 = 0$ ou $x - 1 = 0$ : racines <b>$-3$ et $1$</b>.</li>
<li>$A(x) = 3(x^2 + 2x - 3) = $ <b>$3x^2 + 6x - 9$</b>.</li>
<li>${tt(['x', '−4', '−3', '−2', '−1', '0', '1', '2'], [['A(x)', 15, 0, -9, -12, -9, 0, 15]], { num: true })}<p>(Exemple : $A(-4) = 3 × (-1) × (-5) = 15$.)</p></li>
<li>$A(x) = -9 ⇔ 3x^2 + 6x - 9 = -9 ⇔ 3x^2 + 6x = 0 ⇔ 3x(x + 2) = 0$ : <b>$x = 0$ ou $x = -2$</b> (on le lit aussi dans le tableau).</li></ol>` }),

X('Exercice 3', { id: 's1-3', niv: 2, src: 'TD', q: `<p>Résoudre dans $ℝ$, sans utiliser le discriminant :</p><ol><li>$6x^2 + 9x = 0$</li><li>$4x^2 - 9 = 0$</li><li>$x^2 - 4x + 4 = 0$</li><li>$(x + 1)(6x + 4) + (x + 1)^2 = 0$</li><li>$(2x + 3)^2 = (3x - 2)^2$</li></ol>`,
indice: 'Cherche un facteur commun, une identité remarquable, ou une différence de carrés. Pour la dernière, ramène tout à droite : $A^2 - B^2 = 0$.',
meth: 'Factorise, puis utilise « produit nul ».',
s: `<ol><li>$3x(2x + 3) = 0$ : <b>$x = 0$ ou $x = -frac{3}{2}$</b>.</li><li>$(2x - 3)(2x + 3) = 0$ : <b>$x = frac{3}{2}$ ou $x = -frac{3}{2}$</b>.</li><li>$(x - 2)^2 = 0$ : <b>$x = 2$</b> (racine double).</li><li>$(x + 1)[(6x + 4) + (x + 1)] = (x + 1)(7x + 5) = 0$ : <b>$x = -1$ ou $x = -frac{5}{7}$</b>.</li><li>$(2x + 3)^2 - (3x - 2)^2 = 0 ⇔ [(2x + 3) - (3x - 2)][(2x + 3) + (3x - 2)] = 0 ⇔ (5 - x)(5x + 1) = 0$ : <b>$x = 5$ ou $x = -frac{1}{5}$</b>.</li></ol>` }),

X('Exercice 4', { id: 's1-4', niv: 2, src: 'TD', q: `<p>Résoudre dans $ℝ$, avec le discriminant :</p><ol><li>$-x^2 + 3x - 2 = 0$</li><li>$2x^2 - 4x + 1 = 0$</li><li>$3x^2 + 5x + 7 = 0$</li><li>$x^2 - sqrt{2}x - 3 = 0$</li></ol>`,
indice: 'Identifie $a$, $b$, $c$ avec leurs signes, calcule $Δ$ puis regarde son signe.',
meth: '$Δ = b^2 - 4ac$ ; si $Δ > 0$, $x = frac{-b ± sqrt{Δ}}{2a}$.',
s: `<ol><li>$a = -1$, $b = 3$, $c = -2$ : $Δ = 9 - 8 = 1$. $x = frac{-3 ± 1}{-2}$ : <b>$x = 1$ ou $x = 2$</b>.</li>
<li>$Δ = 16 - 8 = 8$. $x = frac{4 ± 2sqrt{2}}{4}$ : <b>$x = 1 ± frac{sqrt{2}}{2}$</b>.</li>
<li>$Δ = 25 - 84 = -59 < 0$ : <b>aucune solution réelle</b>.</li>
<li>$Δ = 2 + 12 = 14$. <b>$x = frac{sqrt{2} ± sqrt{14}}{2}$</b>.</li></ol>` })
]
},
{
id: 's2', court: 'Signe et inéquations', titre: 'Signe d’un trinôme et inéquations', duree: '1 h 15',
resume: 'Signe de ax² + bx + c selon Δ, résolution d’inéquations, position relative de deux courbes, polynôme de degré 3 à racine évidente.',
intro: 'Savoir <b>quand</b> un trinôme est positif ou négatif permet de résoudre des inéquations, de comparer une parabole et une droite, ou de dire si un programme dépasse un seuil. Tout repose sur un tableau de signes en trois lignes.',
objectifs: [
  'donner le <b>signe</b> de $ax^2 + bx + c$ selon la valeur de $Δ$ et le signe de $a$ ;',
  'résoudre une <b>inéquation</b> du second degré et écrire l’ensemble des solutions en intervalles ;',
  'déterminer la <b>position relative</b> d’une parabole et d’une droite ;',
  'factoriser un polynôme de <b>degré 3</b> dont on connaît une racine évidente.'
],
prerequis: ['Discriminant, racines et factorisation (chapitre précédent).', 'Intervalles et union d’intervalles.'],
sections: [
{ t: 'Le signe d’un trinôme', h: `
${bThm('Signe de f(x) = ax² + bx + c', `${tt(['Δ', 'Signe de f(x)'], [['Δ > 0', 'signe de a à l’extérieur des racines, signe de −a entre les racines'], ['Δ = 0', 'signe de a partout, sauf 0 en x₀'], ['Δ < 0', 'signe de a partout']], { raw: true, plain: true })}`)}
${bMeth('Faire un tableau de signes', `${steps(['Calcule $Δ$ et les racines.', 'Place les racines sur une droite et note le <b>signe de $a$</b> aux extrémités (à l’extérieur).', 'Entre les deux racines, le signe est opposé.', 'Lis l’ensemble des $x$ qui correspondent à l’inégalité demandée.'])}`)}
${bRem('Pour retenir', '<p>« Le trinôme est du signe de $a$ <b>sauf entre les racines</b> » : sa parabole est au-dessus de l’axe (si $a > 0$) partout, sauf dans la « vallée » entre les deux racines.</p>')}
${demo('quad', { qA: '1', qB: '-5', qC: '6' }, 'x² − 5x + 6 : repère les racines et le signe')}` },

{ t: 'Résoudre une inéquation', h: `
${bMeth('Inéquation du second degré', `${steps(['<b>Ramène tout dans un membre</b> pour comparer à 0 : $f(x) > 0$, $f(x) ≤ 0$…', 'Cherche les racines de $f$ et le signe de $a$.', 'Dresse le tableau de signes.', 'Écris les solutions sous forme d’intervalle(s). Attention aux <b>crochets</b> : ouverts pour $<$ et $>$, fermés pour $≤$ et $≥$.'])}`)}
${bEx('x² − 5x + 6 > 0', `<p>Racines : $Δ = 25 - 24 = 1$, $x = frac{5 ± 1}{2}$, soit $2$ et $3$. $a = 1 > 0$ : positif à l’extérieur.</p>${tt(['x', '−∞', '', '2', '', '3', '', '+∞'], [['signe de f(x)', '', '+', 0, '−', 0, '+', '']], { raw: true, num: true })}<p>Solutions : $S = ]-∞ ; 2[ ∪ ]3 ; +∞[$.</p>`)}
${bEx('−8x² + 7x − 4 ≤ 0', `<p>$Δ = 49 - 128 = -79 < 0$ : pas de racine. Le trinôme a le signe de $a = -8 < 0$ <b>partout</b> : il est toujours négatif. Donc $-8x^2 + 7x - 4 ≤ 0$ pour tout réel : $S = ℝ$.</p>`)}
${bEx('Avec une racine double', `<p>$x^2 - 2x + 1 = (x - 1)^2 ≥ 0$ pour tout $x$ : $S = ℝ$. Mais $(x - 1)^2 > 0$ pour tout $x$ <b>sauf</b> $x = 1$ : $S = ℝ ∖ \\{1\\}$.</p>`)}
${quick('Combien le trinôme $x^2 - 5x + 6$ a-t-il de racines ? (écris le nombre)', '2', '$Δ = 25 - 24 = 1 > 0$ : deux racines, $x = 2$ et $x = 3$.')}` },

{ t: 'Parabole et droite : position relative', h: `
<p>Pour comparer deux fonctions $f$ et $g$, on étudie le <b>signe de $f(x) - g(x)$</b>.</p>
${bEx('f(x) = x² − x − 2 et g(x) = 2x + 2', `<ul><li><b>Intersections</b> : $f(x) = g(x) ⇔ x^2 - 3x - 4 = 0$, $Δ = 9 + 16 = 25$, $x = frac{3 ± 5}{2}$ : $x = -1$ ou $x = 4$. Points d’intersection : $(-1 ; 0)$ et $(4 ; 10)$.</li>
<li><b>Position relative</b> : $f(x) - g(x) = x^2 - 3x - 4 = (x + 1)(x - 4)$. C’est positif pour $x < -1$ ou $x > 4$ : la parabole est <b>au-dessus</b> de la droite à l’extérieur de $[-1 ; 4]$, <b>au-dessous</b> entre $-1$ et $4$.</li>
<li><b>f(x) = −3</b> : $x^2 - x + 1 = 0$, $Δ = -3 < 0$ : aucune solution (le minimum de $f$ est $-frac{9}{4} > -3$).</li></ul>`)}` },

{ t: 'Un polynôme de degré 3 avec une racine évidente', h: `
<p>Un polynôme de degré 3 se factorise facilement si on connaît <b>une racine</b> : on le divise par $(x - r)$ et il reste un trinôme.</p>
${bMeth('Factoriser avec une racine évidente', `${steps(['Teste de petites valeurs ($0, ±1, ±2, ±frac{1}{2}…$) jusqu’à trouver $r$ tel que $f(r) = 0$.', 'Écris $f(x) = (x - r)(ax^2 + bx + c)$ et <b>identifie</b> les coefficients.', 'Factorise ou résous le trinôme restant.'])}`)}
${bEx('f(x) = 8x³ − 14x² − 7x + 6', `<p>$f(2) = 64 - 56 - 14 + 6 = 0$ : 2 est racine. On écrit $f(x) = (x - 2)(ax^2 + bx + c)$ et on développe : $ax^3 + (b - 2a)x^2 + (c - 2b)x - 2c$. En identifiant : $a = 8$ ; $b - 2a = -14 ⇒ b = 2$ ; $c - 2b = -7 ⇒ c = -3$ ; $-2c = 6$ ✓.</p>
<p>Donc $f(x) = (x - 2)(8x^2 + 2x - 3)$. Pour $8x^2 + 2x - 3$ : $Δ = 4 + 96 = 100$, $x = frac{-2 ± 10}{16}$ : $x = frac{1}{2}$ ou $x = -frac{3}{4}$. Les racines de $f$ sont <b>$2$, $frac{1}{2}$ et $-frac{3}{4}$</b>, et $f(x) = 8(x - 2)(x - frac{1}{2})(x + frac{3}{4})$.</p>`)}
${bEx('Deux factorisations de trinômes', `<ul><li>$3t^2 + 8t + 4$ : $Δ = 64 - 48 = 16$, racines $-2$ et $-frac{2}{3}$, donc $3(t + 2)(t + frac{2}{3}) = (3t + 2)(t + 2)$.</li><li>$-2x^2 - 4x - 2 = -2(x^2 + 2x + 1) = -2(x + 1)^2$ (racine double $-1$).</li></ul>`)}` }
],
retenir: [
  '<b>Signe de $ax^2 + bx + c$</b> : $Δ > 0$ : signe de $a$ à l’extérieur des racines, de $-a$ entre ; $Δ = 0$ : signe de $a$ partout sauf 0 en $x_0$ ; $Δ < 0$ : signe de $a$ partout.',
  'Inéquation : tout à gauche, racines, signe de $a$, tableau, intervalles (crochets selon $<$ / $≤$).',
  'Position relative de deux courbes : signe de $f(x) - g(x)$.',
  'Racine évidente $r$ : $f(x) = (x - r) × (text{trinôme})$, trouvé par identification.'
],
pieges: [
  ['Signe entre les racines', 'Pour $Δ > 0$, le signe est celui de $-a$ <b>entre</b> les racines : ne l’oublie pas.'],
  ['Crochets des intervalles', '$>$ et $<$ donnent des crochets ouverts, $≥$ et $≤$ des crochets fermés ; une racine double est exclue pour $>$ ou $<$.']
],
quiz: [
  Q('L’ensemble des solutions de x² − 5x + 6 > 0 est…', [']−∞ ; 2[ ∪ ]3 ; +∞[', ']2 ; 3[', '[2 ; 3]', 'ℝ'], 'Racines 2 et 3, a > 0 : positif à l’extérieur des racines.'),
  Q('L’ensemble des solutions de −8x² + 7x − 4 ≤ 0 est…', ['ℝ tout entier', 'l’ensemble vide', ']−∞ ; 0]', '[0 ; +∞['], 'Δ = −79 < 0 et a < 0 : le trinôme est toujours négatif.'),
  Q('Les racines de f(x) = 8x³ − 14x² − 7x + 6 sont…', ['2, 1/2 et −3/4', '2, −1/2 et 3/4', '1, 2 et −3', '−2, 1/2 et 3/4'], 'f(2) = 0 puis f(x) = (x − 2)(8x² + 2x − 3), de racines 1/2 et −3/4.'),
  Q('Si a > 0 et Δ > 0, f(x) est…', ['négative entre les racines, positive à l’extérieur', 'positive entre les racines, négative à l’extérieur', 'toujours positive', 'toujours négative'], 'Signe de a à l’extérieur, signe de −a entre les racines.'),
  Q('La forme factorisée de 3t² + 8t + 4 est…', ['(3t + 2)(t + 2)', '(3t − 2)(t − 2)', '3(t + 2)²', '(3t + 4)(t + 1)'], 'Δ = 16, racines −2 et −2/3 : 3(t + 2)(t + 2/3) = (3t + 2)(t + 2).'),
  Q('Pour que x² − 4x + m = 0 ait deux solutions distinctes, il faut…', ['m < 4', 'm > 4', 'm = 4', 'm ≤ 4'], 'Δ = 16 − 4m > 0 ⇔ m < 4.'),
  Q('Le trinôme x² − 6x + 9 peut s’écrire :', ['(x − 3)²', '(x + 3)²', '(x − 3)(x + 3)', 'x(x − 6) + 9'], 'C’est un carré parfait : (x − 3)².'),
  Q('Pour f(x) = x² − x − 2 et g(x) = 2x + 2, f(x) = g(x) a pour solutions…', ['x = −1 et x = 4', 'x = 1 et x = 4', 'x = −1 et x = −4', 'x = 2 et x = −1'], 'f(x) − g(x) = x² − 3x − 4 = (x + 1)(x − 4).'),
  Q('La parabole de f est au-dessus de la droite de g quand…', ['f(x) − g(x) > 0', 'f(x) + g(x) > 0', 'f(x) × g(x) > 0', 'f(x) > 0'], 'On compare en étudiant le signe de la différence f(x) − g(x).')
],
cartes: [
  C('Signe de ax² + bx + c quand Δ > 0', 'Signe de a à l’extérieur des racines, signe de −a entre les racines.'),
  C('Signe quand Δ = 0 ou Δ < 0', 'Δ = 0 : signe de a partout, 0 en x₀.\nΔ < 0 : signe de a partout.'),
  C('Méthode d’une inéquation du second degré', '1. Tout dans un membre.\n2. Racines et signe de a.\n3. Tableau de signes.\n4. Intervalles (crochets !).'),
  C('Signe de −x² + 3x − 2 pour x = 1,5', 'a = −1 < 0, entre les racines 1 et 2 : le signe est celui de −a, donc positif.'),
  C('Position relative de deux courbes', 'Étudier le signe de f(x) − g(x).'),
  C('Factoriser un polynôme de degré 3', 'Trouver une racine évidente r, écrire f(x) = (x − r)(ax² + bx + c) et identifier.')
],
exos: [
X('Exercice 1', { id: 's2-1', niv: 2, src: 'TD', q: `<p>Soient $f(x) = x^2 - x - 2$ et $g(x) = 2x + 2$ (parabole et droite).</p><ol><li>Résoudre $f(x) = 0$.</li><li>Résoudre $f(x) = -3$.</li><li>Résoudre $g(x) = -3$.</li><li>Résoudre $f(x) = g(x)$ et donner les points d’intersection.</li><li>(Pour aller plus loin) Étudier la position relative de la parabole et de la droite.</li></ol>`,
indice: 'Pour chaque équation, ramène tout dans un membre : $f(x) - (text{nombre}) = 0$. Pour la question 5, étudie le signe de $f(x) - g(x)$.',
meth: 'Discriminant pour chaque équation du second degré ; la droite donne une équation du premier degré.',
s: `<ol><li>$Δ = 1 + 8 = 9$, $x = frac{1 ± 3}{2}$ : <b>$x = -1$ ou $x = 2$</b>.</li>
<li>$x^2 - x - 2 = -3 ⇔ x^2 - x + 1 = 0$, $Δ = 1 - 4 = -3 < 0$ : <b>aucune solution</b> (le minimum de $f$, atteint en $x = frac{1}{2}$, est $-frac{9}{4} > -3$).</li>
<li>$2x + 2 = -3 ⇔ x = -frac{5}{2}$ : <b>une solution</b>.</li>
<li>$x^2 - x - 2 = 2x + 2 ⇔ x^2 - 3x - 4 = 0$, $Δ = 9 + 16 = 25$, $x = frac{3 ± 5}{2}$ : $x = -1$ ou $x = 4$. Points d’intersection : <b>$(-1 ; 0)$</b> et <b>$(4 ; 10)$</b> (car $g(-1) = 0$ et $g(4) = 10$).</li>
<li>$f(x) - g(x) = x^2 - 3x - 4 = (x + 1)(x - 4)$, du signe de $a = 1 > 0$ à l’extérieur des racines : la parabole est <b>au-dessus</b> de la droite sur $]-∞ ; -1[ ∪ ]4 ; +∞[$ et <b>au-dessous</b> sur $]-1 ; 4[$.</li></ol>` }),

X('Exercice 2', { id: 's2-2', niv: 2, src: 'TD', q: `<p>Factoriser, si possible, les expressions suivantes :</p><ol><li>$3t^2 + 8t + 4$</li><li>$-2x^2 - 4x - 2$</li></ol>`,
indice: 'Calcule le discriminant pour trouver les racines. Dans la 2ᵉ, pense à mettre un facteur en évidence d’abord.',
meth: 'Si $Δ > 0$ : $a(x - x_1)(x - x_2)$ ; si $Δ = 0$ : $a(x - x_0)^2$.',
s: `<ol><li>$Δ = 64 - 48 = 16$, racines $t = frac{-8 ± 4}{6}$ : $-frac{2}{3}$ et $-2$. Donc $3t^2 + 8t + 4 = 3(t + frac{2}{3})(t + 2) = $ <b>$(3t + 2)(t + 2)$</b>.</li>
<li>$-2x^2 - 4x - 2 = -2(x^2 + 2x + 1) = $ <b>$-2(x + 1)^2$</b> (racine double $-1$ ; vérifie : $Δ = 16 - 16 = 0$).</li></ol>` }),

X('Exercice 3', { id: 's2-3', niv: 2, src: 'TD', q: `<p>Résoudre dans $ℝ$ les inéquations suivantes :</p><ol><li>$x^2 - 5x + 6 > 0$</li><li>$-8x^2 + 7x - 4 ≤ 0$</li></ol>`,
indice: 'Calcule $Δ$ et les racines, puis fais un tableau de signes en n’oubliant pas le signe de $a$.',
meth: 'Racines, signe de $a$ à l’extérieur, intervalle(s) avec les bons crochets.',
s: `<ol><li>$Δ = 25 - 24 = 1$, racines $2$ et $3$, $a = 1 > 0$ : positif à l’extérieur. <b>$S = ]-∞ ; 2[ ∪ ]3 ; +∞[$</b> (crochets ouverts car l’inégalité est stricte).</li>
<li>$Δ = 49 - 128 = -79 < 0$ : pas de racine, et $a = -8 < 0$ : le trinôme est toujours négatif. <b>$S = ℝ$</b>.</li></ol>` }),

X('Exercice 4', { id: 's2-4', niv: 3, src: 'TD', q: `<p>Soit $f(x) = 8x^3 - 14x^2 - 7x + 6$.</p><ol><li>Calculer $f(2)$.</li><li>Déterminer trois réels $a, b, c$ tels que $f(x) = (x - 2)(ax^2 + bx + c)$.</li><li>En déduire les racines de $f$ et factoriser $f(x)$.</li></ol>`,
indice: 'Développe $(x - 2)(ax^2 + bx + c)$ puis compare terme à terme avec $8x^3 - 14x^2 - 7x + 6$.',
meth: 'Identification des coefficients ; le trinôme restant se traite avec le discriminant.',
s: `<ol><li>$f(2) = 8 × 8 - 14 × 4 - 14 + 6 = 64 - 56 - 14 + 6 = 0$.</li>
<li>$(x - 2)(ax^2 + bx + c) = ax^3 + (b - 2a)x^2 + (c - 2b)x - 2c$. Par identification : $a = 8$ ; $b - 2a = -14 ⇒ b = 2$ ; $c - 2b = -7 ⇒ c = -3$ ; $-2c = 6$ ✓. Donc <b>$a = 8$, $b = 2$, $c = -3$</b>.</li>
<li>$8x^2 + 2x - 3 = 0$ : $Δ = 4 + 96 = 100$, $x = frac{-2 ± 10}{16}$ : $frac{1}{2}$ ou $-frac{3}{4}$. Les racines de $f$ sont <b>$2$, $frac{1}{2}$ et $-frac{3}{4}$</b>, et $f(x) = 8(x - 2)(x - frac{1}{2})(x + frac{3}{4})$.</li></ol>` })
]
},
{
id: 's3', court: 'Sommet et optimisation', titre: 'Forme canonique, sommet et optimisation', duree: '1 h 15',
resume: 'Forme canonique, sommet de la parabole, variations, extremum et problèmes d’optimisation sans dérivée.',
intro: 'Quel est le plus grand enclos qu’on peut fabriquer avec 40 m de grillage ? Quelle recette maximale ? Ces problèmes se ramènent à trouver le <b>sommet</b> d’une parabole : son point le plus haut ou le plus bas, sans avoir besoin de dérivée.',
objectifs: [
  'écrire la <b>forme canonique</b> $a(x - α)^2 + β$ d’un trinôme ;',
  'calculer les coordonnées du <b>sommet</b> $S(α ; β)$ ;',
  'dresser le tableau de <b>variations</b> et donner l’<b>extremum</b> ;',
  'résoudre un problème d’<b>optimisation</b> par une fonction du second degré.'
],
prerequis: ['Discriminant, racines et signe d’un trinôme (chapitres 1 et 2).', 'Notion de fonction croissante ou décroissante.'],
sections: [
{ t: 'La forme canonique et le sommet', h: `
${bThm('Forme canonique', `<p>Tout trinôme $f(x) = ax^2 + bx + c$ s’écrit $$f(x) = a(x - α)^2 + β avec α = -frac{b}{2a} et β = f(α)$$ La parabole a pour <b>sommet</b> le point $S(α ; β)$, et la droite $x = α$ est son <b>axe de symétrie</b>.</p>`)}
${bProof('où vient la forme canonique ?', '<p>On met $a$ en facteur : $ax^2 + bx + c = a(x^2 + frac{b}{a}x + frac{c}{a})$, puis on complète le carré : $x^2 + frac{b}{a}x = (x + frac{b}{2a})^2 - frac{b^2}{4a^2}$. D’où $f(x) = a(x + frac{b}{2a})^2 + c - frac{b^2}{4a} = a(x - α)^2 - frac{Δ}{4a}$ : donc $β = -frac{Δ}{4a}$.</p>')}
${bEx('f(x) = 2x² − 8x + 5', `<p>$α = -frac{-8}{2 × 2} = 2$ et $β = f(2) = 8 - 16 + 5 = -3$. Sommet $S(2 ; -3)$ et $f(x) = 2(x - 2)^2 - 3$. (Contrôle : $2(x^2 - 4x + 4) - 3 = 2x^2 - 8x + 5$ ✓.)</p>`)}
${bEx('g(x) = −x² + 6x − 4', `<p>$α = -frac{6}{-2} = 3$ et $β = g(3) = -9 + 18 - 4 = 5$. Sommet $S(3 ; 5)$ et $g(x) = -(x - 3)^2 + 5$.</p>`)}
${demo('quad', { qA: '2', qB: '-8', qC: '5' }, 'Le sommet de 2x² − 8x + 5')}
${quick('Quelle est l’abscisse $α$ du sommet de $2x^2 - 8x + 5$ ?', '2', '$α = -frac{b}{2a} = -frac{-8}{4} = 2$.', 'Utilise $α = -b/(2a)$.')}` },

{ t: 'Variations et extremum', h: `
${bThm('Variations d’un trinôme', `${tt(['Signe de a', 'Parabole', 'Variations', 'Extremum'], [['a > 0', 'tournée vers le haut', 'décroît sur ]−∞ ; α], croît sur [α ; +∞[', 'minimum β en x = α'], ['a < 0', 'tournée vers le bas', 'croît sur ]−∞ ; α], décroît sur [α ; +∞[', 'maximum β en x = α']], { raw: true, plain: true })}`)}
${bEx('Les deux exemples précédents', `<ul><li>$f(x) = 2x^2 - 8x + 5$ : $a = 2 > 0$, <b>minimum $-3$</b> atteint en $x = 2$ ; $f$ décroît sur $]-∞ ; 2]$ puis croît sur $[2 ; +∞[$.</li><li>$g(x) = -x^2 + 6x - 4$ : $a = -1 < 0$, <b>maximum $5$</b> atteint en $x = 3$ ; $g$ croît sur $]-∞ ; 3]$ puis décroît sur $[3 ; +∞[$.</li></ul>`)}
${bRem('Pourquoi ça marche', '<p>Dans $a(x - α)^2 + β$, le terme $(x - α)^2$ est toujours $≥ 0$ et vaut 0 en $x = α$. Si $a > 0$, la valeur la plus petite possible est donc $β$ ; si $a < 0$, la plus grande.</p>')}` },

{ t: 'Modéliser et optimiser', h: `
<p>Beaucoup de problèmes demandent « le plus grand » ou « le plus petit » : surface, bénéfice, recette. Si la quantité à optimiser s’écrit comme un trinôme, <b>l’extremum se lit au sommet</b>.</p>
${bMeth('Recette générale', `${steps(['<b>Choisis l’inconnue</b> $x$ et exprime tout le reste en fonction de $x$.', 'Trouve le <b>domaine</b> de $x$ (longueurs positives, etc.).', 'Écris la quantité à optimiser comme un <b>trinôme</b> $A(x)$.', 'Lis $α$ et $β$ : l’extremum vaut $β$, atteint en $x = α$.', '<b>Vérifie</b> que $α$ est dans le domaine, puis rédige la réponse avec les unités.'])}`)}
${bEx('L’enclos contre un mur (40 m de grillage)', `<p>On clôture un rectangle contre un mur avec 40 m de grillage : deux côtés de longueur $x$ et un côté parallèle au mur de longueur $y$.</p>
<ul><li>Grillage : $2x + y = 40$, donc $y = 40 - 2x$. $y > 0$ donne $x < 20$ et $x > 0$ : $x ∈ ]0 ; 20[$.</li>
<li>Aire : $A(x) = x(40 - 2x) = -2x^2 + 40x$.</li>
<li>$a = -2 < 0$ : $A$ admet un <b>maximum</b>, au sommet : $α = -frac{40}{2 × (-2)} = 10$ et $A(10) = -200 + 400 = 200$.</li></ul>
<p>Dimensions : $x = 10$ m et $y = 40 - 20 = 20$ m. <b>Aire maximale : 200 m²</b>, avec $y = 2x$ (la longueur est le double de la largeur).</p>`)}
${quick('Dans l’enclos, pour quelle valeur de $x$ (en mètres) l’aire est-elle maximale ?', '10', '$A(x) = -2x^2 + 40x$ a son sommet en $α = -frac{40}{-4} = 10$ : l’aire est maximale pour $x = 10$ m (elle vaut alors 200 m²).', '$α = -b/(2a)$ avec $a = -2$ et $b = 40$.')}` }
],
retenir: [
  '<b>Forme canonique</b> : $f(x) = a(x - α)^2 + β$ avec $α = -frac{b}{2a}$ et $β = f(α)$ ; sommet $S(α ; β)$, axe de symétrie $x = α$.',
  '$a > 0$ : <b>minimum</b> $β$ en $x = α$ ; $a < 0$ : <b>maximum</b> $β$ en $x = α$.',
  'Variations : le trinôme change de sens en $α$.',
  '<b>Optimisation</b> : inconnue, domaine, trinôme à optimiser, sommet, vérification que $α$ est dans le domaine.'
],
pieges: [
  ['Le signe de α', '$α = -frac{b}{2a}$ : si $b = -8$ et $a = 2$, $α = +2$ (et pas $-2$).'],
  ['Hors du domaine', 'Le sommet doit appartenir au domaine de $x$ : sinon l’extremum est atteint à une extrémité.']
],
quiz: [
  Q('Le sommet de f(x) = 2x² − 8x + 5 est…', ['S(2 ; −3)', 'S(−2 ; −3)', 'S(2 ; 5)', 'S(4 ; −3)'], 'α = 8/4 = 2 et β = f(2) = 8 − 16 + 5 = −3.'),
  Q('g(x) = −x² + 6x − 4 admet…', ['un maximum de 5 en x = 3', 'un minimum de 5 en x = 3', 'un maximum de 3 en x = 5', 'un minimum de −4'], 'a = −1 < 0 : maximum au sommet S(3 ; 5).'),
  Q('La forme canonique de f(x) = ax² + bx + c est…', ['a(x − α)² + β', 'a(x + α)² − β', '(x − α)(x − β)', 'ax² + α'], 'Avec α = −b/2a et β = f(α).'),
  Q('Pour f(x) = −x² + 6x − 4, le maximum vaut…', ['5 atteint en x = 3', '3 atteint en x = 5', '−4 atteint en x = 0', '9 atteint en x = 3'], 'β = g(3) = −9 + 18 − 4 = 5.'),
  Q('Enclos contre un mur avec 40 m de grillage : A(x) = −2x² + 40x. Aire maximale ?', ['200 m² pour x = 10', '400 m² pour x = 20', '100 m² pour x = 5', '200 m² pour x = 20'], 'Sommet : α = 10, A(10) = 200.'),
  Q('Quand a > 0, le trinôme admet…', ['un minimum', 'un maximum', 'ni l’un ni l’autre', 'les deux'], 'La parabole est tournée vers le haut : le sommet est son point le plus bas.'),
  Q('Quelle droite est l’axe de symétrie de la parabole d’équation y = ax² + bx + c ?', ['x = −b/(2a)', 'x = b/(2a)', 'y = −b/(2a)', 'x = c/a'], 'L’axe de symétrie passe par le sommet : x = α = −b/(2a).'),
  Q('Dans une optimisation, que faut-il toujours vérifier à la fin ?', ['que α est dans le domaine de x', 'que a est positif', 'que Δ est positif', 'que β est entier'], 'Si α sort du domaine, l’extremum n’est plus atteint au sommet.')
],
cartes: [
  C('Sommet de la parabole', 'S(α ; β) avec α = −b/2a et β = f(α).'),
  C('Forme canonique', 'f(x) = a(x − α)² + β'),
  C('Extremum d’un trinôme', 'a > 0 : minimum β en x = α.\na < 0 : maximum β en x = α.'),
  C('Rôle de α = −b/2a', 'C’est l’abscisse du sommet et l’axe de symétrie de la parabole.'),
  C('Enclos contre un mur, 40 m de grillage', 'A(x) = −2x² + 40x, maximum 200 m² pour x = 10 (et y = 20).'),
  C('Recette d’une optimisation', 'Inconnue x → domaine → trinôme à optimiser → sommet → vérifier α dans le domaine → rédiger avec unités.')
],
exos: [
X('Exercice 1', { id: 's3-1', niv: 2, src: 'TD', q: `<p>Soient $f(x) = 2x^2 - 8x + 5$ et $g(x) = -x^2 + 6x - 4$.</p><ol><li>Dire pour chacune si elle admet un minimum ou un maximum.</li><li>Calculer les coordonnées du sommet de chaque parabole.</li><li>Dresser le tableau de variations de $f$ et de $g$.</li><li>Étudier le signe de $f$ et de $g$.</li></ol>`,
indice: '$α = -b/(2a)$ puis $β = f(α)$. Pour le signe, calcule le discriminant.',
meth: 'Signe de $a$ ⇒ minimum ou maximum ; sommet ⇒ variations ; $Δ$ ⇒ signe.',
s: `<ol><li>$f$ : $a = 2 > 0$, donc un <b>minimum</b>. $g$ : $a = -1 < 0$, donc un <b>maximum</b>.</li>
<li>$f$ : $α = frac{8}{4} = 2$ et $β = f(2) = 8 - 16 + 5 = -3$ : <b>$S_1(2 ; -3)$</b>. $g$ : $α = frac{-6}{-2} = 3$ et $β = g(3) = -9 + 18 - 4 = 5$ : <b>$S_2(3 ; 5)$</b>.</li>
<li>${tt(['x', '−∞', '2', '+∞'], [['f(x)', 'décroît', 'min −3', 'croît']], { raw: true, num: true })}${tt(['x', '−∞', '3', '+∞'], [['g(x)', 'croît', 'max 5', 'décroît']], { raw: true, num: true })}</li>
<li>$f$ : $Δ = 64 - 40 = 24 > 0$, racines $x = frac{8 ± 2sqrt{6}}{4} = 2 ± frac{sqrt{6}}{2}$ (environ $0{,}78$ et $3{,}22$), $a > 0$ : <b>positive à l’extérieur</b> des racines, négative entre. $g$ : $Δ = 36 - 16 = 20 > 0$, racines $3 ± sqrt{5}$ (environ $0{,}76$ et $5{,}24$), $a < 0$ : <b>positive entre</b> les racines, négative à l’extérieur.</li></ol>` }),

X('Exercice 2', { id: 's3-2', niv: 3, src: 'TD', q: `<p>On dispose de 40 m de grillage pour clôturer un enclos rectangulaire adossé à un mur : seuls trois côtés sont à clôturer. Quelles dimensions donnent l’aire maximale ?</p>`,
indice: 'Appelle $x$ la longueur des côtés perpendiculaires au mur. Exprime l’autre côté avec $x$, puis l’aire.',
meth: 'Recette : inconnue, domaine, trinôme $A(x)$, sommet, vérification.',
s: `<p><b>Inconnue.</b> $x$ : longueur de chacun des deux côtés perpendiculaires au mur ; $y$ : côté parallèle au mur.</p><p><b>Contrainte.</b> $2x + y = 40$, donc $y = 40 - 2x$. $x > 0$ et $y > 0$ donnent $x ∈ ]0 ; 20[$.</p><p><b>Aire.</b> $A(x) = x(40 - 2x) = -2x^2 + 40x$ : trinôme avec $a = -2 < 0$, donc un <b>maximum</b> sans dérivée.</p><p><b>Sommet.</b> $α = -frac{40}{2 × (-2)} = 10 ∈ ]0 ; 20[$ ✓ et $A(10) = -200 + 400 = 200$.</p><p><b>Réponse.</b> $x = 10$ m et $y = 20$ m : l’aire maximale est <b>200 m²</b> (et $y = 2x$).</p>` }),

X('Exercice 3', { id: 's3-3', niv: 2, src: 'Travail perso', q: `<ol><li>Mettre $f(x) = x^2 - 6x + 5$ sous forme canonique. En déduire son minimum.</li><li>Parmi tous les rectangles de périmètre 40 m, lequel a l’aire maximale ?</li></ol>`,
indice: '1 : $α = -b/(2a)$ et $β = f(α)$. 2 : si un côté vaut $x$, l’autre vaut $20 - x$.',
meth: 'Forme canonique puis sommet ; pour 2, domaine $x ∈ ]0 ; 20[$ et aire $A(x) = x(20 - x)$.',
s: `<ol><li>$α = 3$ et $β = f(3) = 9 - 18 + 5 = -4$. Donc $f(x) = (x - 3)^2 - 4$ (contrôle : $x^2 - 6x + 9 - 4 = x^2 - 6x + 5$ ✓). Comme $a = 1 > 0$, le minimum de $f$ est <b>$-4$</b>, atteint en $x = 3$.</li>
<li>Périmètre $2(x + y) = 40$ donc $y = 20 - x$, avec $x ∈ ]0 ; 20[$. Aire $A(x) = x(20 - x) = -x^2 + 20x$, $a = -1 < 0$ : maximum en $α = 10$ ($∈ ]0 ; 20[$ ✓), $A(10) = 100$. Le rectangle d’aire maximale est le <b>carré de côté 10 m</b> (aire 100 m²).</li></ol>` })
]
},
]
};
