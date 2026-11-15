/* Contenu du cours — logique. Écrit avec les outils de lib.js (formules $…$, boîtes bDef/bThm/…, quick, demo, Q, C, X). */
COURS.logique = {
id: 'logique', nom: 'Logique', page: 'logique.html', partie: 'Partie I', titre: 'Logique mathématique',
hero: 'Raisonner sans se tromper : de la proposition au circuit',
lead: 'Quatre chapitres pour passer des tables de vérité aux additionneurs : propositions et quantificateurs, algèbre de Boole, implication et contraposée, circuits logiques.',
outils: ['tv', 'adder'],
pieges: [
  ['Réciproque ≠ contraposée', '$P ⇒ Q$ est équivalente à $¬Q ⇒ ¬P$ (contraposée), <b>pas</b> à $Q ⇒ P$ (réciproque).'],
  ['∀∃ n’est pas ∃∀', '« Pour tout $x$ il existe $y$ » n’est pas « il existe $y$ valable pour tout $x$ ».'],
  ['La négation d’une implication', '$¬(P ⇒ Q)$ n’est pas $P ⇒ ¬Q$ : c’est $P ∧ ¬Q$.'],
  ['De Morgan', '$¬(P ∧ Q) = ¬P ∨ ¬Q$ : on change le connecteur <b>et</b> on nie chaque terme.']
],
chapitres: [
{
id: 'l1', court: 'Propositions et connecteurs', titre: 'Propositions, prédicats et connecteurs', duree: '1 h 30',
resume: 'Proposition, prédicat, connecteurs ¬ ∧ ∨ ⊕, implication, équivalence et quantificateurs ∀ ∃.',
intro: 'La logique est le langage de toutes les mathématiques… et de tous les programmes : un <code>if</code>, une clause <code>WHERE</code> ou un circuit sont des énoncés logiques. Ce chapitre pose le vocabulaire.',
objectifs: [
  'distinguer une <b>proposition</b> d’un <b>prédicat</b> et toujours préciser son ensemble de référence ;',
  'construire la <b>table de vérité</b> d’une expression à $n$ variables (elle a $2^n$ lignes) ;',
  'manipuler $¬$, $∧$, $∨$, $⊕$, $⇒$, $⇔$ et connaître <b>le seul cas</b> où $P ⇒ Q$ est fausse ;',
  'lire et écrire des énoncés avec $∀$, $∃$ et $∃!$, en respectant l’<b>ordre des quantificateurs</b> ;',
  'écrire la <b>négation</b> d’une proposition quantifiée.'
],
prerequis: ['Les ensembles de nombres $ℕ ⊂ ℤ ⊂ 𝔻 ⊂ ℚ ⊂ ℝ$ : un rappel est donné à la partie 2.'],
sections: [
{ t: 'Qu’est-ce que la logique ?', h: `
<p>La <b>logique</b> étudie les règles de raisonnement qui permettent de décider si un énoncé est valide. C’est le langage commun de toutes les mathématiques : elle sert à distinguer, sans ambiguïté, une <mark>démonstration correcte</mark> d’un raisonnement fallacieux.</p>
${bDef('Logique mathématique', '<p>Science qui étudie la <b>structure des propositions</b>, les <b>lois de la déduction</b> et la <b>valeur de vérité</b> des énoncés.</p>')}
${bInfo('Tu en fais déjà, sans le savoir', `<ul>
<li>La condition <code>if (age &gt;= 18 &amp;&amp; permis)</code> est une expression logique : <code>&amp;&amp;</code> est le « et » ($∧$).</li>
<li>La clause <code>WHERE</code> d’une requête SQL garde les lignes pour lesquelles un prédicat est vrai.</li>
<li>Un processeur est fabriqué avec des <b>portes logiques</b> : au chapitre 4, tu construiras un additionneur.</li></ul>`)}
<p>Dans ce chapitre : les <b>propositions</b> et les <b>prédicats</b>, les <b>connecteurs</b> ($¬$, $∧$, $∨$, $⊕$), l’<b>implication</b> et l’<b>équivalence</b>, puis les <b>quantificateurs</b> ($∀$, $∃$).</p>` },

{ t: 'Proposition et prédicat', h: `
<h3>2.1 Proposition</h3>
${bDef('Proposition', '<p>Une <b>proposition</b> (ou assertion) est un énoncé mathématique qui a <b>une et une seule</b> valeur de vérité : vrai ou faux.</p><p>On note $v(P) = 1$ si $P$ est vraie, $v(P) = 0$ si $P$ est fausse.</p>')}
${bEx('Propositions… et contre-exemples', `<ul>
<li>« 18 est divisible par 3 » : proposition <b>vraie</b> ($v = 1$) ;</li>
<li>« $π ∈ ℚ$ » : proposition <b>fausse</b> ($v = 0$) ;</li>
<li>« $x + 2 = 5$ » : <b>pas</b> une proposition tant qu’on ne sait pas qui est $x$ ;</li>
<li>« Cette phrase est fausse » : ni vraie ni fausse (paradoxe du menteur) — ce n’est pas une proposition.</li></ul>`)}
${quick('« 7 est un nombre pair » : quelle est sa valeur de vérité (0 ou 1) ?', '0', 'Le nombre 7 est impair, donc la proposition est fausse : $v = 0$.')}
<h3>2.2 Prédicat et ensemble de référence</h3>
${bDef('Prédicat', '<p>Un <b>prédicat</b> est un énoncé qui dépend d’une ou plusieurs variables prises dans des ensembles donnés, et qui <b>devient une proposition</b> dès qu’on fixe ces variables. Il se note $P(x)$, ou $P(x_1, x_2, …, x_n)$.</p><p>Il faut toujours préciser son <b>ensemble de référence</b> (son domaine).</p>')}
${bEx('Deux prédicats', `<ul>
<li>$P(x)$ : « $x + 2 = 5$ » pour $x ∈ ℝ$. Alors $P(3)$ est vraie ($v = 1$) et $P(1)$ est fausse ($v = 0$).</li>
<li>$Q(n)$ : « $n$ est pair » pour $n ∈ ℕ$. $Q(4)$ est vraie, $Q(7)$ est fausse. Sur $ℝ$, la parité de $3{,}14$ ou de $sqrt{2}$ n’aurait aucun sens : voilà pourquoi on fixe le domaine.</li>
<li>À deux variables, sur $ℝ × ℝ$ : $Q(x, y)$ : « $x + y = 0$ ». $Q(2, -2)$ est vraie, $Q(1, 3)$ est fausse.</li></ul>`)}
${bRem('Rappel : les ensembles de nombres', `<p>$ℕ$ entiers naturels ($0, 1, 2, …$) · $ℤ$ entiers relatifs · $𝔻$ décimaux (de la forme $frac{a}{10^n}$) · $ℚ$ rationnels (fractions $frac{p}{q}$, $q ≠ 0$) · $ℝ$ réels (la droite numérique entière, avec $sqrt{2}$ et $π$).</p>
$$ℕ ⊂ ℤ ⊂ 𝔻 ⊂ ℚ ⊂ ℝ$$
<p>L’étoile retire zéro : $ℝ^* = ℝ ∖ \\{0\\}$. Le signe $+$ garde les positifs : $ℝ_+ = [0 ; +∞[$.</p>`)}
${bTrap('', 'Un prédicat n’a de sens que sur un domaine précis. Avant de dire « vrai » ou « faux », demande-toi toujours : <b>x vit dans quel ensemble ?</b>')}` },

{ t: 'Connecteurs logiques et tables de vérité', h: `
<p>On construit des propositions complexes à partir de propositions simples grâce aux <b>connecteurs logiques</b>. Chacun est défini par sa <b>table de vérité</b> : on y liste tous les cas possibles et la valeur obtenue.</p>
<h3>3.1 Les quatre connecteurs de base</h3>
${tt(['Connecteur', 'Se lit', 'Vrai quand…', 'En programmation'], [['¬P', 'non P', 'P est fausse', '!p'], ['P ∧ Q', 'P et Q', 'les deux sont vraies', 'p && q'], ['P ∨ Q', 'P ou Q (inclusif)', 'au moins une est vraie', 'p || q'], ['P ⊕ Q', 'ou exclusif (XOR)', 'exactement une est vraie', 'p ^ q']], { raw: true, plain: true })}
${tt(['P', 'Q', 'P ∧ Q', 'P ∨ Q', 'P ⊕ Q'], [[1, 1, 1, 1, 0], [1, 0, 0, 1, 1], [0, 1, 0, 1, 1], [0, 0, 0, 0, 0]])}
${bRem('« Ou » inclusif ou exclusif ?', '<p>En français, « fromage <b>ou</b> dessert » est exclusif : on ne prend pas les deux. En logique, $∨$ est <b>inclusif</b> : $P ∨ Q$ est vraie si $P$, ou $Q$, ou les deux. Le « ou » qui exclut le cas « les deux » s’appelle le <b>ou exclusif</b> $⊕$.</p>')}
<h3>3.2 Méthode : construire une table de vérité</h3>
${bMeth('Table de vérité', `${steps([
  'Liste les variables ($P$, $Q$, $R$…). Avec $n$ variables, la table a <b>exactement $2^n$ lignes</b> : 4 pour 2 variables, 8 pour 3, 16 pour 4.',
  'Écris toutes les combinaisons de 0 et de 1. Dans le cours, on commence par la ligne où <b>toutes les variables valent 1</b> et on termine par celle où elles valent toutes 0.',
  'Ajoute <b>une colonne par sous-expression</b>, de l’intérieur vers l’extérieur (parenthèses d’abord, puis les connecteurs).',
  'La dernière colonne est la valeur de l’expression complète.'])}`)}
${bEx('Table à 3 variables : (P ∧ Q) ∨ ¬R', `<p>Il y a $2^3 = 8$ lignes.</p>${tt(['P', 'Q', 'R', 'P ∧ Q', '¬R', '(P ∧ Q) ∨ ¬R'], [[1, 1, 1, 1, 0, 1], [1, 1, 0, 1, 1, 1], [1, 0, 1, 0, 0, 0], [1, 0, 0, 0, 1, 1], [0, 1, 1, 0, 0, 0], [0, 1, 0, 0, 1, 1], [0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 1, 1]])}`)}
${demo('tv', { tvExpr: '(P ∧ Q) ∨ ¬R' }, 'Table de vérité : modifie l’expression')}
${quick('Combien de lignes comporte la table de vérité de $(P ∧ Q) ∨ (R ⇒ S)$ ?', '16', 'Il y a 4 variables ($P$, $Q$, $R$, $S$) donc $2^4 = 16$ lignes.')}` },

{ t: 'L’implication et l’équivalence', h: `
<h3>4.1 L’implication ⇒</h3>
${bDef('Implication', `<p>$P ⇒ Q$ se lit « $P$ implique $Q$ » ou « si $P$ alors $Q$ ». Elle est <b>définie</b> par :</p>$$(P ⇒ Q) ⇔ (¬P ∨ Q)$$`)}
${tt(['P', 'Q', '¬P ∨ Q', 'P ⇒ Q'], [[1, 1, 1, 1], [1, 0, 0, 0], [0, 1, 1, 1], [0, 0, 1, 1]])}
${bThm('', '<p>L’implication $P ⇒ Q$ n’est <b>fausse que dans un seul cas</b> : quand l’hypothèse $P$ est <b>vraie</b> et la conclusion $Q$ <b>fausse</b>.</p>')}
<p><b>Et si $P$ est fausse ?</b> Alors l’implication est toujours <b>vraie</b> : on dit qu’elle est « vraie par vacuité ». Pense à une promesse : « si tu réussis, je t’offre une glace ». Je ne <em>trahis</em> ma promesse que si tu réussis et que je ne t’offre rien. Si tu échoues, je n’ai rien promis : la promesse reste tenue, que j’offre une glace ou non.</p>
${bEx('« Si n est divisible par 4, alors n est pair »', `<p>Soit $A(n)$ cette implication, pour $n ∈ ℕ$.</p><ul>
<li>$n = 4$ : $P$ vraie, $Q$ vraie, donc $1 ⇒ 1$ est <b>vrai</b>.</li>
<li>$n = 6$ : 6 n’est pas divisible par 4 ($P$ fausse) mais 6 est pair ($Q$ vraie) : $0 ⇒ 1$ est <b>vrai</b>.</li>
<li>$n = 3$ : $P$ fausse et $Q$ fausse : $0 ⇒ 0$ est <b>vrai</b>.</li></ul><p>L’énoncé général reste vrai pour tous ces entiers.</p>`)}
${quick('Quelle est la valeur de vérité (0 ou 1) de « Si 5 est pair, alors 5² est pair » ?', '1', 'L’hypothèse « 5 est pair » est fausse : l’implication est vraie par vacuité.', 'Regarde d’abord la valeur de l’hypothèse.')}
<h3>4.2 Contraposée, réciproque, négation (aperçu)</h3>
<p>À partir de $P ⇒ Q$, on fabrique trois énoncés qu’il ne faut <b>jamais confondre</b> (le chapitre 3 les étudie en détail) :</p>
${tt(['Nom', 'Énoncé', 'Équivalent à P ⇒ Q ?'], [['Contraposée', '¬Q ⇒ ¬P', 'Oui, toujours'], ['Réciproque', 'Q ⇒ P', 'Non, en général'], ['Négation', 'P ∧ ¬Q', 'Non : c’est le contraire']], { raw: true, plain: true })}
<h3>4.3 L’équivalence ⇔</h3>
${bDef('Équivalence', '<p>$P ⇔ Q$ (« $P$ si et seulement si $Q$ ») est vraie exactement quand $P$ et $Q$ ont la <b>même valeur de vérité</b>.</p>$$(P ⇔ Q) ⇔ ((P ⇒ Q) ∧ (Q ⇒ P))$$')}
${tt(['P', 'Q', 'P ⇔ Q'], [[1, 1, 1], [1, 0, 0], [0, 1, 0], [0, 0, 1]])}
${bTrap('Implication n’est pas causalité', '« $P ⇒ Q$ » ne dit pas que $P$ <em>cause</em> $Q$, seulement qu’on n’a jamais $P$ vraie avec $Q$ fausse. Et $⇒$ n’est pas $⇔$ : l’implication ne marche que dans un sens.')}` },

{ t: 'Les quantificateurs', h: `
<p>Un prédicat devient une proposition quand on fixe sa variable… ou quand on <b>quantifie</b> cette variable : on dit pour combien de valeurs le prédicat est vrai.</p>
${bDef('Quantificateur universel ∀', '<p>$∀$ se lit « pour tout » ou « quel que soit ». $∀x ∈ E, P(x)$ affirme que $P(x)$ est vrai pour <b>tous</b> les éléments de $E$.</p><p>Exemple : $∀n ∈ ℕ, n + 1 > n$.</p>')}
${bDef('Quantificateur existentiel ∃', '<p>$∃$ se lit « il existe (au moins un) ». $∃x ∈ E | P(x)$ affirme qu’<b>au moins un</b> élément de $E$ vérifie $P$. La barre $|$ se lit « tel que ».</p><p>Exemple : $∃n ∈ ℕ | n$ est divisible par 7.</p>')}
${bDef('Unicité ∃!', '<p>$∃! x ∈ E | P(x)$ affirme qu’il existe <b>un et un seul</b> élément de $E$ vérifiant $P$.</p>')}
${bMeth('Comment démontrer ?', `<ul><li>Pour <b>prouver</b> un énoncé $∀$ : on prend $x$ quelconque et on montre $P(x)$ ; pour le <b>réfuter</b>, il suffit d’<b>un contre-exemple</b>.</li>
<li>Pour <b>prouver</b> un énoncé $∃$ : il suffit d’<b>exhiber</b> un exemple ; pour le <b>réfuter</b>, il faut montrer que <b>tous</b> les éléments échouent.</li></ul>`)}
${bEx('Quatre énoncés sur ℝ', `<ul>
<li>$∀x ∈ ℝ, x^2 ≥ 0$ : <b>vrai</b> (un carré n’est jamais négatif).</li>
<li>$∃x ∈ ℝ | x^2 - 1 = 0$ : <b>vrai</b> ($x = 1$ ou $x = -1$ conviennent).</li>
<li>$∀n ∈ ℕ, n^2 > 7$ : <b>faux</b> (contre-exemple : $n = 2$ donne $4$).</li>
<li>$∃x ∈ ℝ | x^2 + 1 = 0$ : <b>faux</b> (on a toujours $x^2 + 1 ≥ 1$).</li></ul>`)}
${quick('L’énoncé « $∃n ∈ ℕ | n$ est divisible par 7 » est-il vrai (1) ou faux (0) ?', '1', 'Il suffit d’exhiber un exemple : $n = 7$ (ou $n = 0$, ou $n = 14$…).')}` },

{ t: 'L’ordre des quantificateurs', h: `
<p>Quand deux quantificateurs <b>de natures différentes</b> se suivent, l’ordre change complètement le sens.</p>
${bEx('∀∃ n’est pas ∃∀', `<p>Sur $ℝ × ℝ$ :</p><ol>
<li>$∀x ∈ ℝ, ∃y ∈ ℝ | x + y = 0$ — <b>Vrai</b> : pour chaque réel $x$, on choisit $y = -x$. Le choix de $y$ <em>dépend</em> de $x$.</li>
<li>$∃y ∈ ℝ | ∀x ∈ ℝ, x + y = 0$ — <b>Faux</b> : il faudrait un unique réel $y$ qui, ajouté à n’importe quel $x$, donne toujours 0.</li></ol>`)}
<p>Une image : « <i>pour chaque</i> étudiant il existe un enseignant qui le suit » (chacun a le sien) est bien plus faible que « il existe un enseignant qui suit <i>tous</i> les étudiants » (le même pour tous).</p>
${bProp('Règle de permutation', '<ul><li>On <b>peut</b> intervertir deux quantificateurs de <b>même nature</b> : $∀x ∀y ⇔ ∀y ∀x$ et $∃x ∃y ⇔ ∃y ∃x$.</li><li>On <b>ne peut pas</b> intervertir $∀$ et $∃$.</li></ul>')}
${quick('L’énoncé « $∃y ∈ ℝ | ∀x ∈ ℝ, x + y > 0$ » est-il vrai (1) ou faux (0) ?', '0', 'Si $y$ est fixé, on peut prendre $x = -y - 1$ : alors $x + y = -1$, qui n’est pas $> 0$. Le même $y$ ne peut pas marcher pour tous les $x$.', 'Fixe $y$, puis cherche un $x$ qui fait échouer l’inégalité.')}` },

{ t: 'Distributivité et négation des quantificateurs', h: `
<h3>6.1 Distributivité</h3>
<p>Soient $P(x)$ et $Q(x)$ deux prédicats sur un ensemble $E$.</p>
${bProp('Ce qui se distribue', `$$(∀x ∈ E, P(x) ∧ Q(x)) ⇔ (∀x ∈ E, P(x)) ∧ (∀x ∈ E, Q(x))$$
$$(∃x ∈ E | P(x) ∨ Q(x)) ⇔ (∃x ∈ E | P(x)) ∨ (∃x ∈ E | Q(x))$$
<p>Donc $∀$ se distribue sur $∧$ et $∃$ se distribue sur $∨$.</p>`)}
${bTrap('∀ ne se distribue pas sur ∨', `<p>On a seulement $(∀x, P(x)) ∨ (∀x, Q(x)) ⇒ (∀x, P(x) ∨ Q(x))$ ; la réciproque est <b>fausse</b> en général.</p><p>Contre-exemple sur $ℕ$ avec $P(n)$ : « $n$ est pair » et $Q(n)$ : « $n$ est impair ». Tout entier est pair ou impair, donc $∀n, (P(n) ∨ Q(n))$ est vrai. Mais $(∀n, P(n)) ∨ (∀n, Q(n))$ est faux : tous les entiers ne sont ni tous pairs, ni tous impairs.</p>`)}
<h3>6.2 Négation</h3>
${bThm('Lois de passage à la négation', `<p>Pour nier une proposition quantifiée, on <b>change le quantificateur</b> ($∀ ↔ ∃$) et on <b>nie le prédicat</b> :</p>
$$¬(∀x ∈ E, P(x)) ⇔ ∃x ∈ E | ¬P(x)$$
$$¬(∃x ∈ E | P(x)) ⇔ ∀x ∈ E, ¬P(x)$$`)}
${bMeth('Nier une phrase à plusieurs quantificateurs', `${steps(['Lis l’énoncé <b>de gauche à droite</b>.', 'Remplace chaque $∀$ par $∃$ et chaque $∃$ par $∀$, <b>sans changer l’ordre</b>.', 'Nie le prédicat final (ici $=$ devient $≠$, $>$ devient $≤$, $⇒$ se nie en $∧$…).'])}`)}
${bEx('Négation de A : ∀x ∈ ℝ, ∃y ∈ ℝ* | x·y = 1', `<p>$A$ : « tout réel $x$ possède un inverse $y$ non nul ». Sa négation est :</p>$$¬A : ∃x ∈ ℝ | ∀y ∈ ℝ^*, x·y ≠ 1$$<p>$A$ est <b>fausse</b> : pour $x = 0$, aucun $y$ ne convient ($0 × y = 0 ≠ 1$). Donc $¬A$ est <b>vraie</b>.</p>`)}
${quick('Écris la négation de « $∀x ∈ E, P(x)$ » : commence-t-elle par $∀$ ou par $∃$ ? (écris le symbole)', '∃', 'On change le quantificateur : $¬(∀x, P(x)) ⇔ ∃x | ¬P(x)$.')}` }
],
retenir: [
  'Une <b>proposition</b> est vraie ou fausse ($v = 1$ ou $v = 0$) ; un <b>prédicat</b> $P(x)$ devient une proposition quand on fixe $x$ <em>dans un ensemble de référence</em>.',
  'Une table de vérité à $n$ variables a $2^n$ lignes ; on construit une colonne par sous-expression.',
  '$P ∧ Q$ : les deux ; $P ∨ Q$ : au moins une (inclusif) ; $P ⊕ Q$ : exactement une.',
  '$(P ⇒ Q) ⇔ (¬P ∨ Q)$ : <b>fausse seulement</b> si $P$ vraie et $Q$ fausse ; vraie par vacuité si $P$ est fausse.',
  '$P ⇔ Q$ est vraie quand $P$ et $Q$ ont la même valeur de vérité ; $(P ⇔ Q) ⇔ ((P ⇒ Q) ∧ (Q ⇒ P))$.',
  '$∀x ∃y$ n’est <b>pas</b> $∃y ∀x$ ; on peut permuter $∀∀$ ou $∃∃$, jamais $∀∃$.',
  '$∀$ se distribue sur $∧$, $∃$ sur $∨$ ; <b>pas</b> $∀$ sur $∨$.',
  '$¬(∀x, P) ⇔ ∃x | ¬P$ et $¬(∃x | P) ⇔ ∀x, ¬P$ : on change le quantificateur et on nie le prédicat.'
],
pieges: [
  ['« x + 2 = 5 » est une proposition', 'Faux : tant que $x$ n’est pas fixé, c’est un <b>prédicat</b>.'],
  ['Implication fausse = hypothèse fausse ?', 'Non : si $P$ est fausse, $P ⇒ Q$ est <b>vraie</b>. Elle n’est fausse que pour $P = 1$ et $Q = 0$.'],
  ['Intervertir ∀ et ∃', '« Pour tout $x$ il existe $y$ » n’est pas « il existe $y$ valable pour tout $x$ ».']
],
quiz: [
  Q('« x + 2 = 5 », avec x réel non précisé, est…', ['un prédicat sur ℝ', 'une proposition vraie', 'une proposition fausse', 'une tautologie'], 'Sa valeur de vérité dépend de x : c’est un prédicat. Il devient une proposition quand on fixe x (vrai pour x = 3, faux pour x = 1).'),
  Q('La valeur de vérité de « 18 est divisible par 3 » est :', ['vraie (v = 1)', 'fausse (v = 0)', 'impossible à connaître', 'ni vraie ni fausse'], '18 = 3 × 6 : la proposition est vraie.'),
  Q('Combien de lignes comporte la table de vérité d’une expression à 4 variables ?', ['16', '8', '4', '12'], 'Avec n variables, il y a 2ⁿ lignes : 2⁴ = 16.'),
  Q('P ⊕ Q (XOR) vaut 1 quand…', ['exactement une des deux vaut 1', 'au moins une des deux vaut 1', 'les deux valent 1', 'les deux valent 0'], 'Le ou exclusif est vrai quand une seule des deux propositions est vraie (pas les deux).'),
  Q('L’implication P ⇒ Q est fausse dans quel cas ?', ['P vraie et Q fausse', 'P fausse et Q vraie', 'P fausse et Q fausse', 'P vraie et Q vraie'], 'Un seul cas : hypothèse vraie, conclusion fausse. Si P est fausse, l’implication est vraie par vacuité.'),
  Q('P ⇒ Q est équivalente à…', ['¬P ∨ Q', 'P ∨ ¬Q', '¬P ∧ Q', 'Q ⇒ P'], 'Définition algébrique : (P ⇒ Q) ⇔ (¬P ∨ Q).'),
  Q('L’implication « si 5 est pair alors 5² est pair » est…', ['vraie', 'fausse', 'ni vraie ni fausse', 'impossible à décider'], 'L’hypothèse « 5 est pair » est fausse : une implication à hypothèse fausse est vraie (par vacuité).'),
  Q('La négation de « ∀x ∈ E, P(x) » est…', ['∃x ∈ E | ¬P(x)', '∀x ∈ E, ¬P(x)', '∃x ∈ E | P(x)', '∀x ∈ E, P(x) est fausse pour tout x'], 'On change le quantificateur et on nie le prédicat.'),
  Q('Parmi ces énoncés sur ℝ, lequel est vrai ?', ['∀x ∃y, x + y = 0', '∃y ∀x, x + y = 0', '∀x ∃y, x × y = 1', '∃x ∀y, x × y = 1'], 'Pour chaque x, y = −x convient. Dans les autres, il faudrait un même y valable pour tous les x, ou un inverse pour x = 0.'),
  Q('¬(∀x ∃y P(x, y)) équivaut à :', ['∃x ∀y ¬P(x, y)', '∀x ∃y ¬P(x, y)', '∃x ∃y ¬P(x, y)', '∀x ∀y ¬P(x, y)'], 'On échange chaque quantificateur sans changer l’ordre, puis on nie le prédicat.'),
  Q('Que signifie « ∃! x ∈ E | P(x) » ?', ['il existe un unique x vérifiant P', 'il existe au moins un x vérifiant P', 'P(x) est faux pour tout x', 'P(x) est vrai pour tout x'], '∃! signifie « il existe un et un seul ».')
],
cartes: [
  C('Qu’est-ce qu’une proposition ?', 'Un énoncé qui a une et une seule valeur de vérité : vrai (v = 1) ou faux (v = 0).'),
  C('Qu’est-ce qu’un prédicat ?', 'Un énoncé P(x) qui dépend de variables d’un ensemble de référence et devient une proposition quand on fixe les variables.'),
  C('Nombre de lignes d’une table de vérité à n variables', '2ⁿ'),
  C('Le XOR (P ⊕ Q) vaut 1 quand…', 'Exactement une des deux propositions est vraie.'),
  C('Quand P ⇒ Q est-elle fausse ?', 'Seulement si P est vraie et Q fausse.\nSi P est fausse, l’implication est vraie (par vacuité).'),
  C('P ⇒ Q avec ¬ et ∨', '¬P ∨ Q'),
  C('P ⇔ Q, c’est…', '(P ⇒ Q) ∧ (Q ⇒ P)\nVraie quand P et Q ont la même valeur de vérité.'),
  C('Les trois quantificateurs', '∀ : pour tout\n∃ : il existe au moins un\n∃! : il existe un unique'),
  C('Peut-on permuter ∀ et ∃ ?', 'Non.\n∀x ∃y x + y = 0 est vrai (y = −x)\n∃y ∀x x + y = 0 est faux.'),
  C('Négation de ∀x ∈ E, P(x)', '∃x ∈ E | ¬P(x)'),
  C('Négation de ∃x ∈ E | P(x)', '∀x ∈ E, ¬P(x)'),
  C('Négation de ∀x ∃y P(x, y)', '∃x ∀y ¬P(x, y)'),
  C('Chaîne des ensembles de nombres', 'ℕ ⊂ ℤ ⊂ 𝔻 ⊂ ℚ ⊂ ℝ')
],
exos: [
X('Exercice 1', { id: 'l1-1', niv: 1, src: 'TD', q: `<p>Déterminer la valeur de vérité des propositions suivantes (sur $ℝ$) et écrire leur négation :</p>
<ol><li>$∀x ∈ ℝ, x^2 ≥ 0$</li><li>$∃x ∈ ℝ | x^2 + 1 = 0$</li><li>$∀x ∈ ℝ, ∃y ∈ ℝ | x + y > 0$</li><li>$∃y ∈ ℝ | ∀x ∈ ℝ, x + y > 0$</li></ol>`,
indice: 'Pour un énoncé $∀$, cherche un contre-exemple ; pour un $∃$, cherche un exemple. Dans les deux derniers, regarde si $y$ peut dépendre de $x$.',
meth: 'Évalue d’abord l’énoncé, puis nie-le : change chaque quantificateur ($∀ ↔ ∃$) sans changer l’ordre, et nie le prédicat ($>$ devient $≤$).',
s: `<ol>
<li><b>Vraie</b> : un carré n’est jamais négatif.<br>Négation : $∃x ∈ ℝ | x^2 < 0$ (fausse).</li>
<li><b>Fausse</b> : $x^2 + 1 ≥ 1 > 0$ pour tout $x$, donc l’équation n’a jamais de solution réelle.<br>Négation : $∀x ∈ ℝ, x^2 + 1 ≠ 0$ (vraie).</li>
<li><b>Vraie</b> : à chaque $x$ on associe $y = -x + 1$, qui dépend de $x$ ; alors $x + y = 1 > 0$.<br>Négation : $∃x ∈ ℝ | ∀y ∈ ℝ, x + y ≤ 0$ (fausse).</li>
<li><b>Fausse</b> : si $y$ est fixé, prenons $x = -y - 1$ ; alors $x + y = -1$, qui n’est pas $> 0$. Aucun $y$ ne marche pour tous les $x$.<br>Négation : $∀y ∈ ℝ, ∃x ∈ ℝ | x + y ≤ 0$ (vraie).</li></ol>
<p><b>À retenir :</b> les énoncés 3 et 4 ne diffèrent que par l’<b>ordre</b> des quantificateurs, et l’un est vrai, l’autre faux.</p>` }),

X('Exercice 2', { id: 'l1-2', niv: 1, src: 'TD', q: `<p>Soient $P$, $Q$, $R$ trois propositions. Établir la table de vérité des expressions suivantes :</p><ol><li>$(P ⇒ Q) ∧ (Q ⇒ R)$</li><li>$(P ∧ ¬Q) ⇔ ¬(P ⇒ Q)$</li></ol>`,
indice: 'Une table à 3 variables a 8 lignes. Ajoute une colonne pour chaque sous-expression : $P ⇒ Q$, puis $Q ⇒ R$, puis le « et ».',
meth: 'Rappelle-toi : $P ⇒ Q$ ne vaut 0 que pour $(P, Q) = (1, 0)$. Remplis les colonnes de l’intérieur vers l’extérieur.',
s: `<ol><li><p>Colonnes intermédiaires $P ⇒ Q$ et $Q ⇒ R$ :</p>${tt(['P', 'Q', 'R', 'P ⇒ Q', 'Q ⇒ R', '(P ⇒ Q) ∧ (Q ⇒ R)'], [[1, 1, 1, 1, 1, 1], [1, 1, 0, 1, 0, 0], [1, 0, 1, 0, 1, 0], [1, 0, 0, 0, 1, 0], [0, 1, 1, 1, 1, 1], [0, 1, 0, 1, 0, 0], [0, 0, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1]])}<p>L’expression est vraie sur 4 lignes : c’est la propriété de « transitivité » de l’implication.</p></li>
<li><p>Seules $P$ et $Q$ interviennent (4 lignes) :</p>${tt(['P', 'Q', 'P ∧ ¬Q', 'P ⇒ Q', '¬(P ⇒ Q)', 'P ∧ ¬Q ⇔ ¬(P ⇒ Q)'], [[1, 1, 0, 1, 0, 1], [1, 0, 1, 0, 1, 1], [0, 1, 0, 1, 0, 1], [0, 0, 0, 1, 0, 1]])}<p>La dernière colonne ne contient que des 1 : c’est une <b>tautologie</b>, c’est-à-dire $¬(P ⇒ Q) ⇔ P ∧ ¬Q$ (négation d’une implication).</p></li></ol>` }),

X('Exercice 3', { id: 'l1-3', niv: 2, src: 'TD', q: `<p>Soit $n ∈ ℕ$. Démontrer l’équivalence entre l’implication « Si $n^2$ est pair, alors $n$ est pair » et sa contraposée.</p>`,
indice: 'Écris d’abord la contraposée : si l’énoncé est $P ⇒ Q$, la contraposée est $¬Q ⇒ ¬P$. Ici $P$ : « $n^2$ est pair » et $Q$ : « $n$ est pair ».',
meth: 'Deux étapes : (1) montrer, avec une table de vérité, que $(P ⇒ Q) ⇔ (¬Q ⇒ ¬P)$ est une tautologie ; (2) vérifier la contraposée avec $n = 2k + 1$.',
s: `<p><b>1. La contraposée.</b> $P$ : « $n^2$ est pair », $Q$ : « $n$ est pair ». La contraposée $¬Q ⇒ ¬P$ s’énonce : « si $n$ est impair, alors $n^2$ est impair ».</p>
<p><b>2. Équivalence en général</b> (table de vérité) :</p>${tt(['P', 'Q', 'P ⇒ Q', '¬Q', '¬P', '¬Q ⇒ ¬P'], [[1, 1, 1, 0, 0, 1], [1, 0, 0, 1, 0, 0], [0, 1, 1, 0, 1, 1], [0, 0, 1, 1, 1, 1]])}<p>Les colonnes $P ⇒ Q$ et $¬Q ⇒ ¬P$ sont identiques ($1, 0, 1, 1$) : les deux implications sont <b>équivalentes</b>.</p>
<p><b>3. La contraposée est vraie.</b> Si $n$ est impair, $n = 2k + 1$ avec $k ∈ ℕ$, donc</p>$$n^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1$$<p>qui est impair. Comme la contraposée est vraie et équivalente à l’énoncé initial, « si $n^2$ est pair alors $n$ est pair » est <b>vraie</b>.</p>` }),

X('Exercice 4', { id: 'l1-4', niv: 3, src: 'Travail perso', q: `<ol>
<li>Donner la négation formelle des assertions suivantes : <br>• $∀x ∈ ℝ, (x > 0 ⇒ x^2 > 0)$ <br>• $∃x ∈ ℝ | ∀ε > 0, |x| < ε$</li>
<li>Montrer, à l’aide de tables de vérité, les lois de De Morgan : $¬(P ∧ Q) ⇔ (¬P ∨ ¬Q)$ et $¬(P ∨ Q) ⇔ (¬P ∧ ¬Q)$.</li>
<li>Simplifier $(P ⇒ Q) ∧ (P ⇒ ¬Q)$. Que peut-on en conclure sur $P$ ?</li>
<li>Simplifier à l’aide des tables de vérité : $P ∧ (P ∨ Q)$, $P ∨ (P ∧ Q)$, $¬(¬P)$.</li></ol>`,
indice: 'Pour la question 1, la négation d’une implication est $P ∧ ¬Q$. Pour la 3, remplace chaque implication par « $¬P ∨ …$ » puis factorise.',
meth: 'Négation : change les quantificateurs, puis nie le prédicat. Simplification : remplace $⇒$ par $¬P ∨ Q$ et utilise la factorisation $¬P ∨ (Q ∧ ¬Q)$.',
s: `<ol>
<li><p>• $¬(∀x ∈ ℝ, (x > 0 ⇒ x^2 > 0)) ⇔ ∃x ∈ ℝ | ¬(x > 0 ⇒ x^2 > 0)$, soit :</p>$$∃x ∈ ℝ | (x > 0 ∧ x^2 ≤ 0)$$<p>(L’assertion de départ est vraie, sa négation est fausse.)</p>
<p>• $¬(∃x ∈ ℝ | ∀ε > 0, |x| < ε) ⇔ ∀x ∈ ℝ, ∃ε > 0 | |x| ≥ ε$.</p><p>Ici l’assertion de départ est <b>vraie</b> ($x = 0$ vérifie $0 < ε$ pour tout $ε > 0$), donc sa négation est fausse.</p></li>
<li><p>Il suffit de comparer les colonnes :</p>${tt(['P', 'Q', '¬(P ∧ Q)', '¬P ∨ ¬Q', '¬(P ∨ Q)', '¬P ∧ ¬Q'], [[1, 1, 0, 0, 0, 0], [1, 0, 1, 1, 0, 0], [0, 1, 1, 1, 0, 0], [0, 0, 1, 1, 1, 1]])}<p>Colonnes 3 et 4 identiques ; colonnes 5 et 6 identiques : les deux lois de De Morgan sont démontrées.</p></li>
<li>$$(P ⇒ Q) ∧ (P ⇒ ¬Q) = (¬P ∨ Q) ∧ (¬P ∨ ¬Q) ;; définition de ⇒
 = ¬P ∨ (Q ∧ ¬Q) ;; distributivité
 = ¬P ∨ 0 = ¬P ;; Q ∧ ¬Q est toujours faux$$<p>Si $P$ impliquait à la fois $Q$ et $¬Q$, alors $P$ serait <b>fausse</b> : c’est le raisonnement par l’absurde.</p></li>
<li>${tt(['P', 'Q', 'P ∨ Q', 'P ∧ (P ∨ Q)', 'P ∧ Q', 'P ∨ (P ∧ Q)'], [[1, 1, 1, 1, 1, 1], [1, 0, 1, 1, 0, 1], [0, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0]])}<p>Les colonnes 4 et 6 sont identiques à la colonne de $P$ ($1, 1, 0, 0$) : <b>$P ∧ (P ∨ Q) = P$</b> et <b>$P ∨ (P ∧ Q) = P$</b> (lois d’absorption). Enfin, $¬(¬P) = P$ : nier deux fois, c’est ne rien changer.</p></li></ol>` })
]
},
{
id: 'l2', court: 'Tautologies et simplification', titre: 'Composition, tautologies et simplifications', duree: '1 h 15',
resume: 'Propositions composées, tautologie et antilogie, lois de l’algèbre de Boole, spécification d’un système et portes NAND.',
intro: 'Une expression logique compliquée peut presque toujours s’écrire plus simplement. Ce chapitre t’apprend à reconnaître ce qui est <b>toujours vrai</b>, et à <b>simplifier</b> sans table de vérité grâce aux lois de l’algèbre de Boole.',
objectifs: [
  'lire et construire une <b>proposition composée</b> à partir de propositions simples ;',
  'reconnaître une <b>tautologie</b> et une <b>antilogie</b> ;',
  'connaître les <b>lois de l’algèbre de Boole</b> (idempotence, absorption, De Morgan…) ;',
  '<b>simplifier</b> une expression pas à pas en citant la loi utilisée ;',
  'traduire une spécification en français en expression logique, et exprimer $¬$, $∧$, $∨$ avec le seul connecteur <b>NAND</b>.'
],
prerequis: ['Les connecteurs $¬$, $∧$, $∨$, $⊕$, $⇒$, $⇔$ et leurs tables de vérité (chapitre 1).'],
sections: [
{ t: 'Rappels', h: `
<p>Les quatre tables de base du chapitre 1, à connaître par cœur :</p>
${tt(['P', 'Q', 'P ∧ Q', 'P ∨ Q', 'P ⊕ Q'], [[1, 1, 1, 1, 0], [1, 0, 0, 1, 1], [0, 1, 0, 1, 1], [0, 0, 0, 0, 0]])}
${bRem('', '<p>$∧$ ne vaut 1 que si <b>les deux</b> valent 1 ; $∨$ ne vaut 0 que si <b>les deux</b> valent 0 ; $⊕$ vaut 1 si les deux sont <b>différents</b>.</p>')}` },

{ t: 'Composition des propositions', h: `
<p>À partir de propositions simples, on construit des propositions <b>composées</b> en combinant les connecteurs. Pour connaître la valeur d’une proposition composée, on dresse sa table de vérité en passant en revue <b>tous les cas</b> possibles des propositions simples.</p>
${bEx('Lire une proposition composée', `<p>Soient $p$ : « $x$ est pair », $q$ : « $y$ est pair », $r$ : « $xy$ est impair ».</p>
<p>La proposition $¬r ⇒ (p ∨ q)$ se lit : « Si le produit $xy$ n’est pas impair, alors $x$ est pair <b>ou</b> $y$ est pair. »</p>`)}
<p>Table de vérité de $¬r ⇒ (p ∨ q)$ (8 lignes, avec les colonnes intermédiaires) :</p>
${tt(['p', 'q', 'r', '¬r', 'p ∨ q', '¬r ⇒ (p ∨ q)'], [[1, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 1], [1, 0, 1, 0, 1, 1], [1, 0, 0, 1, 1, 1], [0, 1, 1, 0, 1, 1], [0, 1, 0, 1, 1, 1], [0, 0, 1, 0, 0, 1], [0, 0, 0, 1, 0, 0]])}
<p>Elle est fausse <b>une seule fois</b> : pour $p = q = r = 0$ (la ligne où $¬r = 1$ et $p ∨ q = 0$, seul cas où une implication échoue).</p>
${bRem('Logique pure et entiers', '<p>Cette situation ($x$ impair, $y$ impair, mais $xy$ pair) est <b>impossible</b> avec de vrais entiers. L’énoncé est donc vrai pour tous les entiers : c’est un théorème d’arithmétique, même s’il n’est pas une tautologie de logique pure.</p>')}
${demo('tv', { tvExpr: '¬r ⇒ (p ∨ q)' }, 'Vérifie la table ci-dessus')}` },

{ t: 'Tautologies et antilogies', h: `
${bDef('Tautologie', '<p>Une <b>tautologie</b> est une proposition composée <b>vraie quelles que soient</b> les valeurs de vérité des propositions simples qui la composent : sa table de vérité ne contient que des 1.</p>')}
${bDef('Antilogie', '<p>Une <b>antilogie</b> est une proposition composée <b>fausse quelles que soient</b> les valeurs de vérité des propositions simples : sa table ne contient que des 0.</p>')}
${bEx('Exemples', `<ul><li>Tautologies : $¬(¬P) ⇔ P$ ; $P ∨ ¬P$ ; $(P ∧ Q) ⇔ (Q ∧ P)$.</li><li>Antilogie : $P ∧ ¬P$.</li></ul>`)}
${bProp('Deux tautologies à connaître', `$$(P ⇒ Q) ⇔ (¬P ∨ Q)$$
$$(P ∧ (P ⇒ Q)) ⇒ Q$$ <p>La seconde est le <b>modus ponens</b> : si $P$ est vrai et que $P$ implique $Q$, alors $Q$ est vrai.</p>`)}
${bMeth('Reconnaître une tautologie', '<p>Dresse la table de vérité et regarde <b>la dernière colonne</b> : que des 1 → tautologie ; que des 0 → antilogie ; un mélange → ni l’une ni l’autre (il suffit de deux lignes qui diffèrent pour l’affirmer).</p>')}
${demo('tv', { tvExpr: '(P ∧ (P ⇒ Q)) ⇒ Q' }, 'Le modus ponens est-il une tautologie ?')}
${quick('$P ∨ ¬P$ est-elle une tautologie (T), une antilogie (A) ou ni l’une ni l’autre (N) ? (écris T, A ou N)', 'T', '$P$ et $¬P$ ont toujours des valeurs opposées : l’une des deux est vraie, donc le « ou » est toujours vrai.')}` },

{ t: 'Les lois de simplification (algèbre de Boole)', h: `
<p>On peut <b>simplifier</b> une expression sans dresser de table, en appliquant des lois. Soient $P$, $Q$, $R$ trois propositions.</p>
${bProp('Lois essentielles de l’algèbre de Boole', `${tt(['Loi', 'Version avec ∨', 'Version avec ∧'], [
  ['Idempotence', 'P ∨ P ⇔ P', 'P ∧ P ⇔ P'],
  ['Absorption', 'P ∨ (P ∧ Q) ⇔ P', 'P ∧ (P ∨ Q) ⇔ P'],
  ['Complémentarité', 'P ∨ ¬P ⇔ 1', 'P ∧ ¬P ⇔ 0'],
  ['Élément neutre', 'P ∨ 0 ⇔ P', 'P ∧ 1 ⇔ P'],
  ['Commutativité', 'P ∨ Q ⇔ Q ∨ P', 'P ∧ Q ⇔ Q ∧ P'],
  ['Associativité', '(P ∨ Q) ∨ R ⇔ P ∨ (Q ∨ R)', '(P ∧ Q) ∧ R ⇔ P ∧ (Q ∧ R)'],
  ['Distributivité', 'P ∨ (Q ∧ R) ⇔ (P ∨ Q) ∧ (P ∨ R)', 'P ∧ (Q ∨ R) ⇔ (P ∧ Q) ∨ (P ∧ R)'],
  ['De Morgan', '¬(P ∨ Q) ⇔ ¬P ∧ ¬Q', '¬(P ∧ Q) ⇔ ¬P ∨ ¬Q']], { plain: true })}`)}
${bRem('Astuce', '<p>Chaque loi a un « jumeau » : on l’obtient en échangeant $∨ ↔ ∧$ et $0 ↔ 1$. Ce principe de <b>dualité</b> divise par deux ce qu’il faut apprendre.</p>')}
${bMeth('Simplifier pas à pas', `${steps([
  'Remplace d’abord les $⇒$ et $⇔$ : $P ⇒ Q$ devient $¬P ∨ Q$.',
  'Fais descendre les négations avec <b>De Morgan</b>, et supprime les doubles négations.',
  'Cherche un <b>facteur commun</b> pour factoriser (distributivité) ou une paire $Q ∧ ¬Q$, $Q ∨ ¬Q$ (complémentarité).',
  'Termine avec l’<b>absorption</b>, l’idempotence ou l’élément neutre.',
  '<b>Note la loi utilisée</b> à chaque ligne : c’est ce que le correcteur attend.'])}`)}
${bEx('Simplifier E = (P ∨ Q) ∧ (P ∨ ¬Q)', `$$E = (P ∨ Q) ∧ (P ∨ ¬Q)
 = P ∨ (Q ∧ ¬Q) ;; distributivité de ∨ sur ∧
 = P ∨ 0 ;; complémentarité : Q ∧ ¬Q ⇔ 0
 = P ;; élément neutre : P ∨ 0 ⇔ P$$`)}
${quick('Simplifie $P ∨ (P ∧ Q)$ (écris le résultat).', 'P|p', 'C’est la loi d’<b>absorption</b> : $P ∨ (P ∧ Q) ⇔ P$.')}
${bTrap('', 'De Morgan change le connecteur <b>et</b> nie chaque terme : $¬(P ∧ Q) = ¬P ∨ ¬Q$. Oublier de changer le connecteur ($¬P ∧ ¬Q$) est l’erreur la plus fréquente.')}` },

{ t: 'Application : spécifier un système', h: `
<p>Traduire un énoncé en français en expression logique est une compétence clé du développeur : c’est exactement ce qu’on fait pour écrire la condition d’un <code>if</code>.</p>
${bEx('Une alarme', `<p>Un système de sécurité déclenche une alarme selon les conditions suivantes : il est <b>sous tension</b> ($T$), un capteur détecte une <b>présence</b> ($P$), l’utilisateur a <b>désactivé</b> l’alarme ($D$).</p>
<p>L’alarme se déclenche lorsque le système est sous tension, qu’une présence est détectée et que l’utilisateur <b>n’a pas</b> désactivé l’alarme :</p>$$A = T ∧ P ∧ ¬D$$`)}
<p>En programmation : <code>alarme = tension &amp;&amp; presence &amp;&amp; !desactivee;</code>. Sa table de vérité (8 lignes) ne contient qu’<b>un seul 1</b>, pour $T = 1$, $P = 1$, $D = 0$.</p>
${demo('tv', { tvExpr: 'T ∧ P ∧ ¬D' }, 'La table de l’alarme')}` },

{ t: 'Portes universelles : NAND et NOR', h: `
<p>En architecture des ordinateurs, les portes <b>NAND</b> (NON-ET) et <b>NOR</b> (NON-OU) sont dites <b>universelles</b> : avec une seule d’entre elles, on peut fabriquer tous les autres connecteurs.</p>
${bDef('NAND (barre de Sheffer)', '$$P | Q ⇔ ¬(P ∧ Q)$$<p>$P | Q$ est faux uniquement quand $P$ et $Q$ sont tous les deux vrais. Le <b>NOR</b> (flèche de Peirce, noté $P ↓ Q$) est défini par $¬(P ∨ Q)$.</p>')}
${bProp('Universalité du NAND', `$$¬P ⇔ P | P
P ∧ Q ⇔ (P | Q) | (P | Q)
P ∨ Q ⇔ (P | P) | (Q | Q)$$`)}
${bProof('¬P ⇔ P | P', '<p>$P | P = ¬(P ∧ P) = ¬P$ car $P ∧ P = P$ (idempotence).</p>')}
<p>Comme $¬$, $∧$ et $∨$ permettent d’écrire n’importe quelle fonction logique, <b>tout circuit</b> peut être construit uniquement avec des NAND. C’est pourquoi les fabricants de puces aiment ce composant : un seul type de porte à produire en masse.</p>` }
],
retenir: [
  'Tautologie : toujours vraie (que des 1) ; antilogie : toujours fausse (que des 0) ; sinon, on a un mélange.',
  'Tautologies utiles : $P ∨ ¬P$, $(P ⇒ Q) ⇔ (¬P ∨ Q)$, $(P ∧ (P ⇒ Q)) ⇒ Q$ (modus ponens) ; antilogie : $P ∧ ¬P$.',
  'Lois : idempotence, <b>absorption</b> ($P ∨ (P ∧ Q) = P$), complémentarité, élément neutre, commutativité, associativité, distributivité, <b>De Morgan</b>.',
  'De Morgan : $¬(P ∧ Q) = ¬P ∨ ¬Q$ et $¬(P ∨ Q) = ¬P ∧ ¬Q$.',
  'Simplifier : éliminer $⇒$, descendre les $¬$, factoriser, appliquer complémentarité et absorption — en <b>nommant</b> chaque loi.',
  '$P | Q = ¬(P ∧ Q)$ ; $¬P = P | P$ ; $P ∧ Q = (P | Q) | (P | Q)$ ; $P ∨ Q = (P | P) | (Q | Q)$.'
],
pieges: [
  ['Oublier de changer ∧ en ∨', '$¬(P ∧ Q)$ vaut $¬P ∨ ¬Q$, pas $¬P ∧ ¬Q$.'],
  ['Citer une loi sans la nommer', 'À chaque étape de simplification, écris la loi utilisée ; sinon l’étape ne vaut pas de points.']
],
quiz: [
  Q('¬(P ∨ Q) est équivalent à…', ['¬P ∧ ¬Q', '¬P ∨ ¬Q', '¬P ∧ Q', 'P ∧ Q'], 'Loi de De Morgan : la négation d’un « ou » est le « et » des négations.'),
  Q('P ∨ ¬P est…', ['une tautologie', 'une antilogie', 'ni l’une ni l’autre', 'équivalente à P'], 'L’une des deux propositions est toujours vraie : le « ou » vaut toujours 1.'),
  Q('P ∧ ¬P est…', ['une antilogie', 'une tautologie', 'équivalente à P', 'équivalente à ¬P'], 'P et ¬P ne peuvent jamais être vraies en même temps : le « et » vaut toujours 0.'),
  Q('P ∨ (P ∧ Q) se simplifie en…', ['P', 'Q', 'P ∧ Q', 'P ∨ Q'], 'Loi d’absorption : P ∨ (P ∧ Q) ⇔ P.'),
  Q('(P ⇒ Q) ∧ (P ⇒ ¬Q) est équivalente à…', ['¬P', 'P', 'Q', '¬Q'], '(¬P ∨ Q) ∧ (¬P ∨ ¬Q) = ¬P ∨ (Q ∧ ¬Q) = ¬P ∨ 0 = ¬P.'),
  Q('L’expression (P ⇒ Q) ⇔ (¬P ∨ Q) est :', ['une tautologie', 'une antilogie', 'ni l’une ni l’autre', 'fausse pour P = 1, Q = 0'], 'C’est la définition de l’implication : les deux côtés ont toujours la même valeur.'),
  Q('P ⊕ 0 vaut…', ['P', '0', '1', '¬P'], '0 est l’élément neutre du XOR : P ⊕ 0 = P (alors que P ⊕ 1 = ¬P).'),
  Q('Avec le NAND (P | Q ⇔ ¬(P ∧ Q)), que vaut P | P ?', ['¬P', 'P', '0', '1'], 'P | P = ¬(P ∧ P) = ¬P (idempotence).'),
  Q('Comment s’appelle la loi P ∧ (P ∨ Q) ⇔ P ?', ['absorption', 'distributivité', 'idempotence', 'complémentarité'], 'On « absorbe » le terme P ∨ Q : c’est la loi d’absorption.'),
  Q('Pour une expression à 3 variables, pour montrer qu’elle n’est pas une tautologie, il suffit de…', ['trouver une ligne où elle vaut 0', 'vérifier les 8 lignes', 'la simplifier', 'trouver une ligne où elle vaut 1'], 'Une tautologie vaut 1 partout : une seule ligne à 0 suffit à la réfuter.')
],
cartes: [
  C('Tautologie, antilogie', 'Tautologie : toujours vraie (P ∨ ¬P).\nAntilogie : toujours fausse (P ∧ ¬P).'),
  C('Lois d’absorption', 'P ∨ (P ∧ Q) ⇔ P\nP ∧ (P ∨ Q) ⇔ P'),
  C('Complémentarité', 'P ∨ ¬P ⇔ 1\nP ∧ ¬P ⇔ 0'),
  C('Lois de De Morgan', '¬(P ∧ Q) ⇔ ¬P ∨ ¬Q\n¬(P ∨ Q) ⇔ ¬P ∧ ¬Q'),
  C('Distributivité', 'P ∨ (Q ∧ R) ⇔ (P ∨ Q) ∧ (P ∨ R)\nP ∧ (Q ∨ R) ⇔ (P ∧ Q) ∨ (P ∧ R)'),
  C('Éléments neutres', 'P ∨ 0 ⇔ P\nP ∧ 1 ⇔ P'),
  C('Méthode de simplification', '1. Éliminer ⇒ (¬P ∨ Q).\n2. Appliquer De Morgan.\n3. Factoriser.\n4. Complémentarité / absorption.\nNommer chaque loi.'),
  C('Le modus ponens', '(P ∧ (P ⇒ Q)) ⇒ Q est une tautologie : si P et P ⇒ Q, alors Q.'),
  C('Propriétés du XOR', 'Commutatif, associatif, élément neutre 0.\nP ⊕ P = 0 ; P ⊕ 1 = ¬P.'),
  C('NAND : définition', 'P | Q ⇔ ¬(P ∧ Q)\nFaux seulement si P et Q sont vrais.'),
  C('NAND : exprimer ¬, ∧, ∨', '¬P ⇔ P | P\nP ∧ Q ⇔ (P | Q) | (P | Q)\nP ∨ Q ⇔ (P | P) | (Q | Q)')
],
exos: [
X('Exercice 1', { id: 'l2-1', niv: 1, src: 'TD', q: `<p>Établir la table de vérité de la proposition $P : ¬r ⇒ (p ∨ q)$ (en faisant figurer les colonnes intermédiaires $¬r$ et $p ∨ q$). Quelles sont les valeurs de $p$, $q$, $r$ pour lesquelles $P$ est fausse ?</p>`,
indice: 'Une implication n’est fausse que si son hypothèse est vraie et sa conclusion fausse. Cherche quand $¬r$ vaut 1 et $p ∨ q$ vaut 0.',
meth: 'Construis la table à 8 lignes avec les colonnes $¬r$, $p ∨ q$, puis $¬r ⇒ (p ∨ q)$.',
s: `<p>La table (8 lignes) :</p>${tt(['p', 'q', 'r', '¬r', 'p ∨ q', '¬r ⇒ (p ∨ q)'], [[1, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 1], [1, 0, 1, 0, 1, 1], [1, 0, 0, 1, 1, 1], [0, 1, 1, 0, 1, 1], [0, 1, 0, 1, 1, 1], [0, 0, 1, 0, 0, 1], [0, 0, 0, 1, 0, 0]])}
<p>L’implication est fausse seulement si $¬r = 1$ <b>et</b> $p ∨ q = 0$, c’est-à-dire $r = 0$, $p = 0$ et $q = 0$. Elle vaut 1 sur les 7 autres lignes.</p>` }),

X('Exercice 2', { id: 'l2-2', niv: 2, src: 'TD', q: `<p>Discuter, suivant les valeurs de vérité de $p$, $q$ et $r$, les valeurs des propositions suivantes :</p><ol><li>$q ∨ (¬q ∧ p)$</li><li>$p ⇒ (p ⇒ q)$</li><li>$p ∨ (q ⇒ r)$</li></ol>`,
indice: 'Simplifie d’abord chaque expression avec les lois, puis dis quand elle vaut 0.',
meth: '1. Distributivité puis complémentarité. 2. Remplace $⇒$ par $¬ ∨$ et utilise l’idempotence. 3. Remplace $q ⇒ r$ par $¬q ∨ r$.',
s: `<ol><li>$$q ∨ (¬q ∧ p) = (q ∨ ¬q) ∧ (q ∨ p) ;; distributivité de ∨ sur ∧
 = 1 ∧ (q ∨ p) ;; complémentarité
 = q ∨ p ;; élément neutre$$<p>Elle vaut 0 <b>uniquement</b> pour $p = q = 0$ (quel que soit $r$), et 1 sinon.</p></li>
<li>$$p ⇒ (p ⇒ q) = ¬p ∨ (¬p ∨ q) ;; définition de ⇒ (deux fois)
 = ¬p ∨ q ;; idempotence : ¬p ∨ ¬p = ¬p
 = p ⇒ q$$<p>Elle vaut 0 <b>uniquement</b> pour $p = 1$ et $q = 0$ (quel que soit $r$).</p></li>
<li>$$p ∨ (q ⇒ r) = p ∨ ¬q ∨ r$$<p>Une disjonction vaut 0 quand tous ses termes valent 0 : $p = 0$, $¬q = 0$ (donc $q = 1$) et $r = 0$. Elle vaut 0 <b>uniquement</b> pour $(p, q, r) = (0, 1, 0)$.</p></li></ol>` }),

X('Exercice 3', { id: 'l2-3', niv: 2, src: 'TD', q: `<p>Les propositions suivantes sont-elles des tautologies, des antilogies, ou ni l’une ni l’autre ? Justifier à l’aide d’une table de vérité.</p><ol><li>$((P ∧ Q) ∨ R) ⇔ (P ∧ (Q ∨ R))$</li><li>$(P ∧ (P ⇒ Q)) ⇒ Q$</li><li>$(P ∨ Q) ∧ (¬P ∧ ¬Q)$</li></ol>`,
indice: 'Pour montrer « ni l’une ni l’autre », il suffit de donner deux lignes dont les résultats diffèrent (un 1 et un 0).',
meth: 'Tables de vérité. Pour le 1, cherche un cas où $R$ vaut 1 et $P$ vaut 0 ; pour le 3, factorise $¬P ∧ ¬Q = ¬(P ∨ Q)$.',
s: `<ol><li><b>Ni l’une ni l’autre.</b> Pour $P = Q = R = 1$ : les deux côtés valent 1, donc l’équivalence est vraie. Pour $P = 0$, $R = 1$ : à gauche $(0 ∧ Q) ∨ 1 = 1$, à droite $0 ∧ (Q ∨ 1) = 0$, donc l’équivalence est <b>fausse</b>. Un 1 et un 0 apparaissent.</li>
<li><b>Tautologie</b> (modus ponens) :${tt(['P', 'Q', 'P ⇒ Q', 'P ∧ (P ⇒ Q)', '(P ∧ (P ⇒ Q)) ⇒ Q'], [[1, 1, 1, 1, 1], [1, 0, 0, 0, 1], [0, 1, 1, 0, 1], [0, 0, 1, 0, 1]])}<p>La dernière colonne ne contient que des 1.</p></li>
<li><b>Antilogie.</b> $¬P ∧ ¬Q = ¬(P ∨ Q)$ (De Morgan), donc l’expression est $(P ∨ Q) ∧ ¬(P ∨ Q)$, de la forme $A ∧ ¬A$ : toujours fausse.</li></ol>` }),

X('Exercice 4', { id: 'l2-4', niv: 2, src: 'TD', q: `<p>À l’aide des propriétés du cours, simplifier les expressions suivantes :</p><ol><li>$¬(¬P ∧ Q)$</li><li>$(P ∧ Q) ∨ (P ∧ ¬Q)$</li><li>$P ∨ (¬P ∧ Q)$</li><li>$¬(P ∨ Q) ∨ (¬P ∧ Q)$</li></ol>`,
indice: 'Pour le 1, pense à De Morgan. Pour le 2, cherche un facteur commun. Pour le 4, descends d’abord la négation.',
meth: 'Cite à chaque ligne la loi utilisée : De Morgan, distributivité (factorisation), complémentarité, élément neutre.',
s: `<ol><li>$$¬(¬P ∧ Q) = ¬(¬P) ∨ ¬Q ;; De Morgan
 = P ∨ ¬Q ;; double négation$$</li>
<li>$$(P ∧ Q) ∨ (P ∧ ¬Q) = P ∧ (Q ∨ ¬Q) ;; distributivité (factorisation de P)
 = P ∧ 1 ;; complémentarité
 = P ;; élément neutre$$</li>
<li>$$P ∨ (¬P ∧ Q) = (P ∨ ¬P) ∧ (P ∨ Q) ;; distributivité de ∨ sur ∧
 = 1 ∧ (P ∨ Q) ;; complémentarité
 = P ∨ Q ;; élément neutre$$</li>
<li>$$¬(P ∨ Q) ∨ (¬P ∧ Q) = (¬P ∧ ¬Q) ∨ (¬P ∧ Q) ;; De Morgan
 = ¬P ∧ (¬Q ∨ Q) ;; factorisation de ¬P
 = ¬P ∧ 1 = ¬P ;; complémentarité, élément neutre$$</li></ol>` }),

X('Exercice 5', { id: 'l2-5', niv: 1, src: 'TD', q: `<p>Un système de sécurité déclenche une alarme lorsqu’il est sous tension ($T$), qu’une présence est détectée ($P$) et que l’utilisateur n’a <b>pas</b> désactivé l’alarme ($D$).</p><ol><li>Traduire la condition de déclenchement de l’alarme en une expression logique.</li><li>Donner la table de vérité de cette expression.</li><li>Quel cas correspond à une antilogie ? À une tautologie ? Expliquer en français.</li></ol>`,
indice: '« Pas désactivé » se traduit par $¬D$. Le mot « et » se traduit par $∧$.',
meth: 'Traduis mot à mot, puis dresse la table à 8 lignes : repère les lignes où l’alarme sonne.',
s: `<ol><li>$A = T ∧ P ∧ ¬D$.</li>
<li>${tt(['T', 'P', 'D', '¬D', 'T ∧ P ∧ ¬D'], [[1, 1, 1, 0, 0], [1, 1, 0, 1, 1], [1, 0, 1, 0, 0], [1, 0, 0, 1, 0], [0, 1, 1, 0, 0], [0, 1, 0, 1, 0], [0, 0, 1, 0, 0], [0, 0, 0, 1, 0]])}<p>L’alarme se déclenche dans <b>un seul cas sur 8</b> : système sous tension, présence détectée, alarme non désactivée.</p></li>
<li>L’expression $A$ n’est <b>ni une tautologie ni une antilogie</b> : elle vaut 1 dans un cas et 0 dans les sept autres.<br>• Une <b>antilogie</b> correspondrait à une alarme qui ne se déclenche <b>jamais</b> (par exemple $T ∧ ¬T$ : un système à la fois sous tension et hors tension).<br>• Une <b>tautologie</b> correspondrait à une alarme qui se déclenche <b>toujours</b>, quoi qu’il arrive (par exemple $D ∨ ¬D$).</li></ol>` }),

X('Exercice 6', { id: 'l2-6', niv: 3, src: 'Travail perso', q: `<ol>
<li>On définit l’opérateur XOR ($⊕$) par sa table de vérité. L’opérateur XOR est-il commutatif ? associatif ? Admet-il un élément neutre ?</li>
<li>Démontrer à l’aide d’une table de vérité une loi de De Morgan et une propriété de distributivité.</li>
<li>Simplifier $S = (a ∧ b ∧ c) ∨ (¬a ∧ b ∧ ¬c) ∨ (¬a ∧ b ∧ c) ∨ (a ∧ b ∧ ¬c)$.</li>
<li>L’opérateur NAND est défini par $P | Q ⇔ ¬(P ∧ Q)$. Montrer que $¬P$ peut s’exprimer uniquement à l’aide de NAND.</li></ol>`,
indice: 'Question 1 : $P ⊕ Q$ vaut 1 quand le nombre de 1 est impair. Question 3 : tous les termes contiennent $b$ — factorise-le.',
meth: 'Q1 : compare les tables. Q3 : $S = b ∧ [ … ]$ où le crochet énumère les 4 combinaisons de $(a, c)$.',
s: `<ol><li><p><b>Commutatif :</b> la table est symétrique ($P ⊕ Q = Q ⊕ P$ : lignes $(1,0)$ et $(0,1)$ donnent toutes deux 1).</p><p><b>Associatif :</b> $(P ⊕ Q) ⊕ R$ et $P ⊕ (Q ⊕ R)$ valent tous deux 1 quand le nombre de 1 parmi $P, Q, R$ est <b>impair</b> :</p>${tt(['P', 'Q', 'R', 'P ⊕ Q', '(P ⊕ Q) ⊕ R', 'Q ⊕ R', 'P ⊕ (Q ⊕ R)'], [[1, 1, 1, 0, 1, 0, 1], [1, 1, 0, 0, 0, 1, 0], [1, 0, 1, 1, 0, 1, 0], [1, 0, 0, 1, 1, 0, 1], [0, 1, 1, 1, 0, 0, 0], [0, 1, 0, 1, 1, 1, 1], [0, 0, 1, 0, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0]])}<p>Les colonnes 5 et 7 sont identiques. <b>Élément neutre :</b> oui, $0$, car $P ⊕ 0 = P$. (On a aussi $P ⊕ P = 0$ et $P ⊕ 1 = ¬P$.)</p></li>
<li><p>De Morgan : voir l’exercice 4 du chapitre 1. <b>Distributivité</b> $P ∧ (Q ∨ R) ⇔ (P ∧ Q) ∨ (P ∧ R)$ :</p>${tt(['P', 'Q', 'R', 'Q ∨ R', 'P ∧ (Q ∨ R)', 'P ∧ Q', 'P ∧ R', '(P ∧ Q) ∨ (P ∧ R)'], [[1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 0, 1, 1, 1, 0, 1], [1, 0, 1, 1, 1, 0, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 1, 1, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0], [0, 0, 1, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]])}<p>Les colonnes 5 et 8 coïncident ($1,1,1,0,0,0,0,0$).</p></li>
<li>Tous les termes contiennent $b$ : $S = b ∧ [(a ∧ c) ∨ (¬a ∧ ¬c) ∨ (¬a ∧ c) ∨ (a ∧ ¬c)]$. Le crochet contient les <b>quatre</b> combinaisons possibles de $(a, c)$ : $(1,1)$, $(0,0)$, $(0,1)$, $(1,0)$. Il est donc toujours vrai, et $S = b ∧ 1 = b$.</li>
<li>$P | P = ¬(P ∧ P) = ¬P$, car $P ∧ P = P$ (idempotence). Donc $¬P = P | P$.</li></ol>` })
]
},
{
id: 'l3', court: 'Implication et contraposée', titre: 'Implication, contraposée et réciproque', duree: '1 h 15',
resume: 'Théorème, négation d’une implication, contraposée, réciproque et raisonnements valides (modus ponens, modus tollens).',
intro: 'Presque tous les théorèmes ont la forme « si… alors… ». Ce chapitre t’apprend à <b>nier</b> une implication, à écrire sa <b>contraposée</b> (pour démontrer plus facilement) et à ne jamais la confondre avec sa <b>réciproque</b>.',
objectifs: [
  'dire si un énoncé est un <b>théorème</b>, ou trouver un <b>contre-exemple</b> ;',
  'écrire la <b>négation</b> d’une implication : $¬(P ⇒ Q) ⇔ P ∧ ¬Q$ ;',
  'écrire la <b>contraposée</b> et la <b>réciproque</b>, et savoir laquelle est équivalente à l’énoncé ;',
  'faire une <b>démonstration par contraposée</b> ;',
  'reconnaître un <b>raisonnement valide</b> (modus ponens, modus tollens, syllogisme disjonctif).'
],
prerequis: ['L’implication et sa table de vérité (chapitre 1).', 'Les lois de De Morgan (chapitre 2).'],
sections: [
{ t: 'Théorème', h: `
<p>La notion de <b>théorème</b> s’applique aux <b>prédicats</b>.</p>
${bDef('Théorème', '<p>Soit $P(x)$ un prédicat sur un domaine $E$. $P(x)$ est un <b>théorème</b> s’il prend la valeur de vérité $1$ pour <b>toutes</b> les valeurs possibles de $x$ dans $E$.</p>')}
${bRem('Lien avec les tautologies', '<p>Un théorème est, pour un prédicat, l’équivalent d’une tautologie pour une proposition composée : une assertion <b>universellement vraie</b>.</p>')}
${bEx('Théorème ou pas ?', `<ul>
<li>« Pour tout $n ∈ ℕ$, si $n$ est pair alors $n^2$ est pair » est un <b>théorème</b> (l’implication est vraie pour tout entier $n$).</li>
<li>« Pour tout $n ∈ ℕ$, si $n$ est divisible par 4 alors $n$ est divisible par 2 » est un <b>théorème</b>.</li>
<li>« Pour tout $n ∈ ℕ$, si $n$ est pair alors $n$ est divisible par 4 » n’est <b>pas</b> un théorème : $n = 6$ est un <b>contre-exemple</b> (6 est pair, pas divisible par 4).</li></ul>`)}
${bMeth('Montrer qu’un énoncé n’est pas un théorème', '<p>Un <b>seul contre-exemple</b> suffit : une valeur de $n$ pour laquelle l’hypothèse est vraie et la conclusion fausse.</p>')}
${quick('« Si $n$ est divisible par 4 et par 6, alors $n$ est divisible par 24 » : donne un entier $n > 0$ qui est un contre-exemple.', '12|36|60|84|108', '$n = 12$ est divisible par 4 (12 = 4 × 3) et par 6 (12 = 6 × 2) mais pas par 24. (Les multiples impairs de 12 conviennent aussi : 36, 60…) La bonne conclusion serait : $n$ est divisible par 12.', 'Cherche le plus petit nombre divisible à la fois par 4 et par 6.')}` },

{ t: 'Négation d’une implication', h: `
${bThm('Négation d’une implication', '$$¬(P ⇒ Q) ⇔ P ∧ ¬Q$$<p>Pour <b>contredire</b> une implication, il faut exhiber un cas où l’hypothèse est vraie <b>et</b> la conclusion fausse.</p>')}
${bProof('¬(P ⇒ Q) ⇔ P ∧ ¬Q', `$$¬(P ⇒ Q) = ¬(¬P ∨ Q) ;; définition de ⇒
 = ¬(¬P) ∧ ¬Q ;; De Morgan
 = P ∧ ¬Q ;; double négation$$`)}
${bTrap('Le piège classique', '<p>$P ⇒ Q$ n’est <b>absolument pas</b> équivalente à $¬P ⇒ ¬Q$. Et la négation de $P ⇒ Q$ n’est <b>pas</b> « $P ⇒ ¬Q$ » : c’est « $P ∧ ¬Q$ ».</p>')}
<p>Pour les propositions quantifiées, on combine avec les lois du chapitre 1 :</p>
${bProp('Négation des propositions quantifiées', '$$¬(∀x ∈ E, P(x)) ⇔ ∃x ∈ E | ¬P(x)$$ $$¬(∃x ∈ E | P(x)) ⇔ ∀x ∈ E, ¬P(x)$$')}
${bEx('Nier une phrase', `<p>« Si un entier est divisible par 4, alors il est divisible par 2 » a pour négation : « <b>Il existe</b> un entier divisible par 4 <b>et non divisible</b> par 2. » (Cette négation est fausse, donc la phrase initiale est vraie.)</p>`)}
${quick('Quelle est la négation de $P ⇒ Q$ ? (écris-la, par exemple avec ∧ et ¬)', 'P∧¬Q|P et ¬Q|P et non Q|P^¬Q|P&¬Q', 'La négation d’une implication est $P ∧ ¬Q$ : l’hypothèse est vraie et la conclusion fausse.')}` },

{ t: 'Contraposée et démonstration par contraposée', h: `
${bThm('Contraposée', '<p>La proposition $P ⇒ Q$ a pour <b>contraposée</b> $¬Q ⇒ ¬P$. Une implication et sa contraposée sont <b>strictement équivalentes</b> :</p>$$(P ⇒ Q) ⇔ (¬Q ⇒ ¬P)$$')}
${bEx('Une contraposée', '<p>L’implication « Si un entier est divisible par 4 alors il est pair » a pour contraposée : « Si un entier n’est pas pair alors il n’est pas divisible par 4. »</p>')}
${bMeth('Démonstration par contraposée', `<p>Pour démontrer qu’une implication $P ⇒ Q$ est vraie, il suffit de démontrer que sa contraposée $¬Q ⇒ ¬P$ est vraie. C’est souvent <b>beaucoup plus simple</b> : on part de « $Q$ est faux » pour atteindre « $P$ est faux ».</p>
<p>À essayer quand la conclusion est une négation, ou quand l’hypothèse $P$ est difficile à manipuler.</p>`)}
${bEx('Si n² est divisible par 3, alors n est divisible par 3', `<p>Direct, c’est difficile : que sait-on de $n$ à partir de $n^2$ ? Par contraposée, on démontre : « si $n$ n’est pas divisible par 3, alors $n^2$ ne l’est pas ». Si $3 ∤ n$, alors $n = 3k + 1$ ou $n = 3k + 2$ :</p>
$$(3k + 1)^2 = 9k^2 + 6k + 1 = 3(3k^2 + 2k) + 1$$
$$(3k + 2)^2 = 9k^2 + 12k + 4 = 3(3k^2 + 4k + 1) + 1$$
<p>Dans les deux cas $n^2$ a pour reste 1 dans la division par 3 : il n’est pas divisible par 3. ∎</p>`)}
${quick('Contraposée de « si $n$ est pair, alors $n^2$ est pair » : « si $n^2$ est ___, alors $n$ est ___ ». Quel mot complète les deux blancs (pair ou impair) ?', 'impair', 'La contraposée de $P ⇒ Q$ est $¬Q ⇒ ¬P$ : « si $n^2$ est <b>impair</b>, alors $n$ est <b>impair</b> ». Le contraire de « pair » est « impair ».', 'On nie la conclusion, on l’utilise comme hypothèse, puis on nie l’hypothèse pour en faire la conclusion.')}
${bTrap('', 'Ne confonds pas contraposée ($¬Q ⇒ ¬P$) et <b>réciproque</b> ($Q ⇒ P$). Seule la contraposée est équivalente à l’énoncé de départ.')}` },

{ t: 'Réciproque d’une implication', h: `
${bThm('Réciproque', '<p>La proposition $P ⇒ Q$ a pour <b>réciproque</b> $Q ⇒ P$. Une implication et sa réciproque <b>n’ont pas nécessairement la même valeur de vérité</b>.</p>')}
${bEx('Une réciproque fausse', `<ul>
<li>Implication directe : « Si $n$ est divisible par 4 alors $n$ est divisible par 2 » : <b>vraie</b>.</li>
<li>Réciproque : « Si $n$ est divisible par 2 alors $n$ est divisible par 4 » : <b>fausse</b> ($n = 6$).</li></ul>`)}
${tt(['À partir de P ⇒ Q', 'Énoncé', 'Même valeur de vérité ?'], [['Contraposée', '¬Q ⇒ ¬P', 'Toujours'], ['Réciproque', 'Q ⇒ P', 'Pas toujours'], ['Négation', 'P ∧ ¬Q', 'Toujours le contraire'], ['Contraposée de la réciproque', '¬P ⇒ ¬Q', 'Comme la réciproque']], { raw: true, plain: true })}
${bMeth('Quand une équivalence est vraie', '<p>Pour montrer $P ⇔ Q$, on démontre <b>les deux sens</b> : $P ⇒ Q$ <i>et</i> sa réciproque $Q ⇒ P$.</p>')}
${bEx('Pluie et nuages', `<p>$p$ : « il pleut », $q$ : « il y a des nuages ».</p>${tt(['Énoncé', 'Formulation', 'Valeur'], [['p ⇒ q', 'S’il pleut, il y a des nuages', 'vraie'], ['Contraposée ¬q ⇒ ¬p', 'S’il n’y a pas de nuages, il ne pleut pas', 'vraie'], ['Réciproque q ⇒ p', 'S’il y a des nuages, il pleut', 'fausse'], ['Négation p ∧ ¬q', 'Il pleut et il n’y a pas de nuages', 'fausse']], { raw: true, plain: true })}`)}` },

{ t: 'Raisonner juste : application à l’informatique', h: `
<p>Les implications sont partout en informatique : <b>pré-conditions et post-conditions</b>, règles de sécurité, diagnostic de pannes.</p>
${bEx('Une règle de sécurité', `<p>$A$ : « le système est authentifié », $D$ : « l’utilisateur a les droits », $E$ : « l’accès est autorisé ». La règle est $(A ∧ D) ⇒ E$.</p>
<ul><li><b>Contraposée</b> : $¬E ⇒ (¬A ∨ ¬D)$ — « si l’accès est refusé, alors le système n’est pas authentifié ou l’utilisateur n’a pas les droits » (utile pour <b>diagnostiquer</b> un refus).</li>
<li><b>Négation</b> : $A ∧ D ∧ ¬E$ — « authentifié, avec les droits, et pourtant accès refusé » : un <b>bug</b>.</li>
<li><b>Réciproque</b> : $E ⇒ (A ∧ D)$ — « si l’accès est autorisé, alors il y a eu authentification et droits » : en sécurité, c’est même la propriété <b>essentielle</b> (elle interdit les accès sauvages).</li></ul>`)}
${bEx('Spécification d’un programme', `<p>Précondition : les données sont des entiers positifs. Postcondition : le programme retourne leur somme. Contrat : $P ⇒ Q$.</p>
<p>La <b>réciproque</b> « s’il retourne leur somme, alors les données sont des entiers positifs » n’est <b>pas</b> souhaitable : la précondition est une condition <i>suffisante</i>, pas <i>nécessaire</i> ; le programme a le droit de marcher aussi pour d’autres données.</p>`)}
<h3>Les raisonnements valides</h3>
<p>Un raisonnement est <b>valide</b> si la conclusion est vraie chaque fois que les hypothèses le sont. Trois schémas à reconnaître :</p>
${tt(['Nom', 'Hypothèses', 'Conclusion'], [['Modus ponens', 'P ⇒ Q  et  P', 'Q'], ['Modus tollens', 'P ⇒ Q  et  ¬Q', '¬P'], ['Syllogisme disjonctif', 'P ∨ S  et  ¬P', 'S']], { raw: true, plain: true })}
${bEx('Un serveur capricieux', `<p>Le serveur est en panne ($P$) ou surchargé ($S$). S’il est en panne, le voyant est rouge ($R$). Le voyant n’est pas rouge ($¬R$). Peut-on conclure que le serveur est surchargé ?</p>
<p>De $P ⇒ R$ et $¬R$, le <b>modus tollens</b> donne $¬P$. Puis, de $P ∨ S$ et $¬P$, le <b>syllogisme disjonctif</b> donne $S$. Le raisonnement est <b>valide</b>.</p>`)}
${bTrap('Raisonnements invalides', '<p>« $P ⇒ Q$ et $Q$, donc $P$ » est <b>faux</b> (c’est confondre avec la réciproque) : il peut y avoir des nuages sans pluie. « $P ⇒ Q$ et $¬P$, donc $¬Q$ » est faux aussi.</p>')}` }
],
retenir: [
  'Un <b>théorème</b> est un prédicat vrai pour <b>toutes</b> les valeurs du domaine ; un <b>contre-exemple</b> suffit à le réfuter.',
  '$¬(P ⇒ Q) ⇔ P ∧ ¬Q$ — jamais « $P ⇒ ¬Q$ ».',
  '$(P ⇒ Q) ⇔ (¬Q ⇒ ¬P)$ : l’implication et sa <b>contraposée</b> sont équivalentes.',
  'La <b>réciproque</b> $Q ⇒ P$ n’est pas équivalente à $P ⇒ Q$ ; pour une équivalence $P ⇔ Q$, on démontre les deux sens.',
  'Démonstration par contraposée : partir de $¬Q$ pour atteindre $¬P$ ; utile quand la conclusion est une négation.',
  'Modus ponens ($P ⇒ Q$, $P$ ⊢ $Q$) et modus tollens ($P ⇒ Q$, $¬Q$ ⊢ $¬P$) sont valides ; affirmer la conclusion pour en déduire l’hypothèse ne l’est pas.'
],
pieges: [
  ['Réciproque ≠ contraposée', 'La contraposée $¬Q ⇒ ¬P$ est équivalente ; la réciproque $Q ⇒ P$ ne l’est pas.'],
  ['Nier P ⇒ Q', 'La négation est $P ∧ ¬Q$, pas $¬P ⇒ ¬Q$.'],
  ['« Donc P » à cause de Q', '$P ⇒ Q$ et $Q$ ne permettent pas de conclure $P$.']
],
quiz: [
  Q('La négation de P ⇒ Q est…', ['P ∧ ¬Q', 'P ⇒ ¬Q', '¬P ⇒ ¬Q', '¬P ∧ Q'], 'Une implication n’est fausse que si P est vraie et Q fausse : P ∧ ¬Q.'),
  Q('La contraposée de « si n est divisible par 4 alors n est pair » est…', ['si n n’est pas pair alors n n’est pas divisible par 4', 'si n est pair alors n est divisible par 4', 'si n n’est pas divisible par 4 alors n n’est pas pair', 'n est divisible par 4 et n’est pas pair'], 'Contraposée de P ⇒ Q : ¬Q ⇒ ¬P. Ici : non pair ⇒ non divisible par 4.'),
  Q('La réciproque de « si 4 | n alors n est pair » est…', ['fausse : n = 6 est un contre-exemple', 'vraie', 'équivalente à la contraposée', 'la négation de l’énoncé'], 'Réciproque : « si n est pair alors 4 | n », fausse pour n = 6.'),
  Q('Quel énoncé est un théorème (vrai pour tout n ∈ ℕ) ?', ['n pair ⇒ n² pair', 'n² pair ⇒ n divisible par 4', 'n pair ⇒ n divisible par 4', 'n impair ⇒ n premier'], 'Si n = 2k alors n² = 2(2k²) est pair. Les autres ont des contre-exemples (n = 6, n = 9).'),
  Q('La contraposée de « si un entier est divisible par 6 alors il est divisible par 2 et 3 » est :', ['si un entier n’est pas divisible par 2 ou pas par 3, alors il n’est pas divisible par 6', 'si un entier n’est pas divisible par 2 et pas par 3, alors il n’est pas divisible par 6', 'si un entier est divisible par 2 et 3, alors il est divisible par 6', 'si un entier n’est pas divisible par 6, alors il n’est pas divisible par 2 et 3'], 'On nie la conclusion « 2 et 3 » : par De Morgan, « pas 2 ou pas 3 », puis on la met en hypothèse.'),
  Q('On sait (P ∨ S), (P ⇒ R) et ¬R. Que peut-on conclure ?', ['S', 'P', 'R', 'on ne peut rien conclure'], 'De P ⇒ R et ¬R on déduit ¬P (modus tollens), puis avec P ∨ S on obtient S.'),
  Q('Pour démontrer « si n² est pair alors n est pair », on peut démontrer par contraposée que…', ['si n est impair alors n² est impair', 'si n est pair alors n² est pair', 'si n² est impair alors n est pair', 'n est impair et n² est pair'], 'Contraposée : ¬Q ⇒ ¬P, soit « n impair ⇒ n² impair ».'),
  Q('« P ⇒ Q » et « Q » : que peut-on conclure sur P ?', ['rien', 'P est vraie', 'P est fausse', 'P ⇒ Q est fausse'], 'On ne peut rien dire : Q peut être vraie alors que P est fausse (confusion avec la réciproque).'),
  Q('Pour montrer qu’un énoncé « ∀n, P(n) ⇒ Q(n) » n’est pas un théorème, il suffit de…', ['trouver un contre-exemple', 'vérifier 10 valeurs de n', 'montrer sa réciproque', 'démontrer sa contraposée'], 'Un seul n pour lequel P(n) est vraie et Q(n) fausse réfute l’énoncé.')
],
cartes: [
  C('Qu’est-ce qu’un théorème (pour un prédicat) ?', 'Un prédicat vrai pour toutes les valeurs de la variable dans l’ensemble de référence.'),
  C('Négation de P ⇒ Q', 'P ∧ ¬Q'),
  C('Contraposée de P ⇒ Q', '¬Q ⇒ ¬P\nToujours équivalente à P ⇒ Q.'),
  C('Réciproque de P ⇒ Q', 'Q ⇒ P\nPas équivalente à P ⇒ Q en général.'),
  C('Comment démontrer par contraposée ?', 'Pour prouver P ⇒ Q, on prouve ¬Q ⇒ ¬P.\nEx. : n² pair ⇒ n pair devient n impair ⇒ n² impair.'),
  C('Comment réfuter un théorème ?', 'Avec un contre-exemple : une valeur pour laquelle l’hypothèse est vraie et la conclusion fausse.'),
  C('Modus ponens', 'P ⇒ Q et P donnent Q.'),
  C('Modus tollens', 'P ⇒ Q et ¬Q donnent ¬P.'),
  C('Syllogisme disjonctif', 'P ∨ S et ¬P donnent S.'),
  C('P ⇒ Q et Q : peut-on conclure P ?', 'Non : c’est confondre l’implication avec sa réciproque.')
],
exos: [
X('Exercice 1', { id: 'l3-1', niv: 1, src: 'TD', q: `<p>Les énoncés suivants sont-ils des théorèmes ? Justifier.</p><ol><li>Pour tout $n ∈ ℕ$, si $n$ est divisible par 6 alors $n$ est divisible par 2 et par 3.</li><li>Pour tout $n ∈ ℕ$, si $n$ est pair alors $n^2$ est pair.</li><li>Pour tout $n ∈ ℕ$, si $n$ est impair alors $n^2$ est impair.</li><li>Pour tout entier $n ≥ 2$, si $n$ est premier et $n > 2$ alors $n$ est impair.</li></ol>`,
indice: 'Pour un théorème, il faut une preuve valable pour <b>tout</b> $n$ : écris $n$ sous la forme $6k$, $2k$ ou $2k + 1$.',
meth: 'Pour chaque énoncé : soit une preuve avec $n = …k$, soit un contre-exemple.',
s: `<p>Les quatre énoncés sont des <b>théorèmes</b>.</p><ol>
<li>Si $6 | n$, alors $n = 6k = 2(3k) = 3(2k)$ : $n$ est divisible par 2 et par 3.</li>
<li>Si $n = 2k$, alors $n^2 = 4k^2 = 2(2k^2)$ est pair.</li>
<li>Si $n = 2k + 1$, alors $n^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1$ est impair.</li>
<li>Par contraposée : si $n > 2$ est pair, alors $2$ est un diviseur de $n$ différent de $1$ et de $n$, donc $n$ n’est pas premier. Ainsi, un premier $n > 2$ est impair.</li></ol>` }),

X('Exercice 2', { id: 'l3-2', niv: 2, src: 'TD', q: `<ol><li>Démontrer par une table de vérité l’équivalence $¬(P ⇒ Q) ⇔ P ∧ ¬Q$.</li><li>Donner la négation formelle des énoncés suivants : <br>• « Si un entier est divisible par 4 alors il est divisible par 2. » <br>• « Si le système est sous tension et qu’une présence est détectée, alors l’alarme se déclenche. »</li><li>L’énoncé suivant est-il un théorème ? « Pour tout $n ∈ ℕ$, si $n$ est divisible par 4 et par 6, alors $n$ est divisible par 24. »</li></ol>`,
indice: 'Pour la question 2, l’énoncé a la forme $P ⇒ Q$ : sa négation est $P ∧ ¬Q$. Pour la 3, cherche le plus petit entier divisible par 4 et par 6.',
meth: 'Q1 : table à 4 lignes. Q2 : « Hypothèse <b>et</b> non conclusion ». Q3 : contre-exemple.',
s: `<ol><li>${tt(['P', 'Q', 'P ⇒ Q', '¬(P ⇒ Q)', '¬Q', 'P ∧ ¬Q'], [[1, 1, 1, 0, 0, 0], [1, 0, 0, 1, 1, 1], [0, 1, 1, 0, 0, 0], [0, 0, 1, 0, 1, 0]])}<p>Les colonnes 4 et 6 sont identiques ($0, 1, 0, 0$) : l’équivalence est démontrée.</p></li>
<li>• « Il existe un entier divisible par 4 <b>et</b> non divisible par 2. » (Cette négation est fausse : un multiple de 4 est toujours pair.)<br>• « Le système est sous tension, une présence est détectée <b>et</b> l’alarme ne se déclenche pas. »</li>
<li><b>Non</b>, ce n’est pas un théorème : $n = 12$ est divisible par 4 ($12 = 4 × 3$) et par 6 ($12 = 6 × 2$) mais pas par 24. La bonne conclusion est « divisible par 12 » (le PPCM de 4 et 6).</li></ol>` }),

X('Exercice 3', { id: 'l3-3', niv: 2, src: 'TD', q: `<ol><li>Écrire la contraposée des énoncés suivants : <br>• « Si un entier est divisible par 6, alors il est divisible par 2 et par 3. » <br>• « Si $n$ est un nombre premier, alors $n = 2$ ou $n$ est impair. » <br>• « Si le fichier n’est pas vide et que l’utilisateur a les droits, alors l’écriture est autorisée. »</li>
<li>Démontrer par contraposée que pour tout $n ∈ ℕ$, si $n^2$ est pair alors $n$ est pair.</li>
<li>Démontrer par contraposée que pour tout $m, n ∈ ℕ$, si $mn$ est impair alors $m$ et $n$ sont impairs.</li>
<li>Soit $n ∈ ℕ$. Démontrer par contraposée que si $n^2$ est divisible par 3, alors $n$ est divisible par 3.</li></ol>`,
indice: 'La contraposée de $P ⇒ Q$ est $¬Q ⇒ ¬P$. Pour nier « A et B », utilise De Morgan : « non A ou non B ».',
meth: 'Écris $P$ et $Q$, forme $¬Q ⇒ ¬P$, puis simplifie les négations avec De Morgan. Pour les preuves, démontre la contraposée en écrivant $n = 2k + 1$ ou $n = 3k ± 1$.',
s: `<ol><li><p>• « Si un entier n’est pas divisible par 2 <b>ou</b> n’est pas divisible par 3, alors il n’est pas divisible par 6. » (la négation de « 2 <i>et</i> 3 » est « pas 2 <i>ou</i> pas 3 »)</p><p>• « Si $n ≠ 2$ <b>et</b> $n$ est pair, alors $n$ n’est pas premier. » (la négation de « 2 <i>ou</i> impair » est « pas 2 <i>et</i> pair »)</p><p>• « Si l’écriture n’est pas autorisée, alors le fichier est vide <b>ou</b> l’utilisateur n’a pas les droits. »</p></li>
<li>Contraposée : « si $n$ est impair, alors $n^2$ est impair ». Avec $n = 2k + 1$ : $n^2 = 2(2k^2 + 2k) + 1$ est impair. ∎</li>
<li>Contraposée : « si $m$ est pair <b>ou</b> $n$ est pair, alors $mn$ est pair ». Si $m = 2k$, alors $mn = 2(kn)$ est pair ; de même si $n$ est pair. ∎</li>
<li>Contraposée : « si $3 ∤ n$, alors $3 ∤ n^2$ ». Si $n = 3k + 1$ : $n^2 = 3(3k^2 + 2k) + 1$. Si $n = 3k + 2$ : $n^2 = 3(3k^2 + 4k + 1) + 1$. Dans les deux cas le reste est 1 : $n^2$ n’est pas divisible par 3. ∎</li></ol>` }),

X('Exercice 4', { id: 'l3-4', niv: 1, src: 'TD', q: `<p>On considère les propositions $p$ : « Il pleut » et $q$ : « Il y a des nuages ». Écrire l’implication $p ⇒ q$, sa contraposée, sa réciproque et sa négation. Lesquelles sont vraies ?</p>`,
indice: 'Contraposée : on inverse et on nie. Réciproque : on inverse seulement. Négation : hypothèse vraie et conclusion fausse.',
meth: 'Utilise les formes $¬q ⇒ ¬p$, $q ⇒ p$ et $p ∧ ¬q$.',
s: `${tt(['Énoncé', 'Formulation', 'Valeur'], [['p ⇒ q', 'S’il pleut, alors il y a des nuages.', 'vraie'], ['Contraposée ¬q ⇒ ¬p', 'S’il n’y a pas de nuages, alors il ne pleut pas.', 'vraie'], ['Réciproque q ⇒ p', 'S’il y a des nuages, alors il pleut.', 'fausse'], ['Négation p ∧ ¬q', 'Il pleut et il n’y a pas de nuages.', 'fausse']], { raw: true, plain: true })}<p>Une implication et sa contraposée ont toujours la même valeur (ici <b>vraie</b>) ; la réciproque peut différer (il peut y avoir des nuages sans pluie) ; la négation a toujours la valeur contraire.</p>` }),

X('Exercice 5', { id: 'l3-5', niv: 2, src: 'TD', q: `<p>Soit $S$ un système informatique. On considère : $A$ : « Le système est authentifié », $D$ : « L’utilisateur dispose des droits d’accès », $E$ : « L’accès à la ressource est autorisé ». L’accès est modélisé par la règle : $(A ∧ D) ⇒ E$.</p><ol><li>Écrire la contraposée de cette règle en français.</li><li>Écrire la négation de cette règle en français.</li><li>La réciproque est-elle souhaitable dans un système de sécurité réel ? Expliquer.</li></ol>`,
indice: 'Contraposée : $¬E ⇒ ¬(A ∧ D)$ — n’oublie pas De Morgan pour $¬(A ∧ D)$.',
meth: 'Contraposée : on nie la conclusion et on la met en hypothèse. Négation : $P ∧ ¬Q$. Réciproque : $E ⇒ (A ∧ D)$.',
s: `<ol><li><b>Contraposée</b> $¬E ⇒ (¬A ∨ ¬D)$ : « Si l’accès n’est pas autorisé, alors le système n’est pas authentifié <b>ou</b> l’utilisateur n’a pas les droits. »</li>
<li><b>Négation</b> $A ∧ D ∧ ¬E$ : « Le système est authentifié, l’utilisateur a les droits, et pourtant l’accès est refusé. » (c’est un dysfonctionnement)</li>
<li><b>Réciproque</b> $E ⇒ (A ∧ D)$ : « Si l’accès est autorisé, alors le système est authentifié et l’utilisateur a les droits. » Elle est <b>souhaitable</b>, et même essentielle en sécurité : la règle de départ garantit seulement que les ayants droit <i>entrent</i> ; la réciproque garantit que <i>seuls</i> les ayants droit entrent. Sans elle, rien n’interdirait d’autoriser un utilisateur non authentifié. Dans un vrai système on veut donc l’<b>équivalence</b> $E ⇔ (A ∧ D)$.</li></ol>` }),

X('Exercice 6', { id: 'l3-6', niv: 3, src: 'Travail perso', q: `<ol><li>Pour chacune des implications suivantes, donner la contraposée, la réciproque et la négation. Indiquer lesquelles sont des théorèmes. <br>• Pour tout $n ∈ ℕ$ : $n$ est divisible par 9 ⇒ $n$ est divisible par 3. <br>• Pour tout $n ∈ ℕ$ : $n$ est divisible par 3 ⇒ $n$ est divisible par 9.</li>
<li>Un programme a pour spécification : précondition « les données fournies sont des entiers positifs », postcondition « le programme retourne leur somme ». On modélise par $P ⇒ Q$. Écrire la contraposée, la négation et la réciproque. La réciproque est-elle souhaitable ?</li>
<li>Nier les propositions quantifiées suivantes et dire si la négation est vraie ou fausse : <br>• $∀n ∈ ℕ, n^2 ≥ n$ <br>• $∃n ∈ ℕ, n$ est divisible par 12 et par 18 <br>• $∀n ∈ ℤ, n$ est pair ou $n$ est impair</li></ol>`,
indice: 'Pour la question 3, ne te contente pas de nier : évalue aussi l’énoncé de départ ; la négation a la valeur contraire.',
meth: 'Q1 : $P ⇒ Q$ → contraposée $¬Q ⇒ ¬P$, réciproque $Q ⇒ P$, négation $P ∧ ¬Q$. Q3 : change les quantificateurs, applique De Morgan.',
s: `<ol><li><p><b>Énoncé A : « 9 | n ⇒ 3 | n ».</b></p><ul><li>Contraposée : « si $n$ n’est pas divisible par 3, alors il n’est pas divisible par 9 ».</li><li>Réciproque : « 3 | n ⇒ 9 | n » (fausse : $n = 3$).</li><li>Négation : « $n$ est divisible par 9 et non par 3 » (impossible).</li><li><b>A est un théorème</b> : $n = 9k = 3(3k)$.</li></ul>
<p><b>Énoncé B : « 3 | n ⇒ 9 | n ».</b></p><ul><li>Contraposée : « si $n$ n’est pas divisible par 9, alors il n’est pas divisible par 3 ».</li><li>Réciproque : « 9 | n ⇒ 3 | n » (c’est A, vraie).</li><li>Négation : « $n$ est divisible par 3 et non par 9 » (réalisée par $n = 3$).</li><li><b>B n’est pas un théorème</b> : $n = 3$ est un contre-exemple.</li></ul></li>
<li>$P$ : « les données sont des entiers positifs », $Q$ : « le programme retourne leur somme ».<br>• Contraposée : « Si le programme ne retourne pas leur somme, alors les données ne sont pas (toutes) des entiers positifs. » (utile pour diagnostiquer)<br>• Négation : « Les données sont des entiers positifs <b>et</b> le programme ne retourne pas leur somme » : c’est un <b>bug</b>.<br>• Réciproque : « Si le programme retourne leur somme, alors les données sont des entiers positifs. » <b>Non souhaitable</b> : elle interdirait au programme de fonctionner pour d’autres données ; la précondition est une condition suffisante, pas nécessaire.</li>
<li><p>• $∀n ∈ ℕ, n^2 ≥ n$ est <b>vraie</b> ($n = 0$ : $0 ≥ 0$ ; $n ≥ 1$ : $n^2 = n·n ≥ n$). Négation : $∃n ∈ ℕ | n^2 < n$, <b>fausse</b>.</p><p>• $∃n ∈ ℕ$, $12 | n$ et $18 | n$ est <b>vraie</b> ($n = 36$). Négation : $∀n ∈ ℕ$, $n$ n’est pas divisible par 12 <b>ou</b> n’est pas divisible par 18, <b>fausse</b> (36 est un contre-exemple).</p><p>• $∀n ∈ ℤ$, $n$ pair ou $n$ impair est <b>vraie</b>. Négation : $∃n ∈ ℤ | n$ n’est <b>ni</b> pair <b>ni</b> impair, <b>fausse</b>.</p></li></ol>` })
]
},
{
id: 'l4', court: 'Circuits et additionneurs', titre: 'Synthèse de circuits logiques et additionneurs', duree: '1 h 30',
resume: 'De la table de vérité au circuit, portes NAND universelles, demi-additionneur et additionneur complet.',
intro: 'Comment un processeur additionne-t-il deux nombres ? Avec des <b>portes logiques</b> : de simples ET, OU, XOR. Dans ce chapitre tu passes d’une table de vérité à un circuit, puis tu construis un <b>additionneur</b> pièce par pièce.',
objectifs: [
  'écrire l’expression logique d’une fonction à partir de sa <b>table de vérité</b> et la simplifier ;',
  'dessiner (lire) le <b>circuit</b> correspondant à une expression ;',
  'exprimer $¬$, $∧$, $∨$, $⇒$ avec le seul connecteur <b>NAND</b> ;',
  'construire et expliquer le <b>demi-additionneur</b> et l’<b>additionneur complet</b> ;',
  'chaîner des additionneurs pour additionner des nombres de <b>plusieurs bits</b>.'
],
prerequis: ['Les lois de l’algèbre de Boole et la simplification (chapitre 2).', 'Les connecteurs $⊕$ (XOR) et NAND (chapitres 1 et 2).'],
sections: [
{ t: 'Synthèse d’une fonction booléenne', h: `
<p>On veut fabriquer un circuit à trois entrées $p$, $q$, $r$ dont le comportement est donné par une table de vérité : c’est la <b>synthèse</b> d’un circuit.</p>
${tt(['p', 'q', 'r', 'f(p, q, r)'], [[1, 1, 1, 1], [1, 1, 0, 0], [1, 0, 1, 0], [1, 0, 0, 0], [0, 1, 1, 1], [0, 1, 0, 0], [0, 0, 1, 1], [0, 0, 0, 0]])}
${bMeth('De la table de vérité à l’expression', `${steps([
  'Repère toutes les lignes où la sortie vaut <b>1</b>.',
  'Pour chaque ligne à 1, écris une <b>conjonction</b> (ET) de toutes les entrées : la variable telle quelle si elle vaut 1, <b>niée</b> si elle vaut 0.',
  'Relie ces conjonctions par des <b>disjonctions</b> (OU).'])}`)}
${bEx('Application à f', `<p>Les lignes à 1 sont $(1,1,1)$, $(0,1,1)$ et $(0,0,1)$ :</p>$$f = (p ∧ q ∧ r) ∨ (¬p ∧ q ∧ r) ∨ (¬p ∧ ¬q ∧ r)$$
<p>C’est une expression correcte, mais <b>trop grosse</b> (9 portes). On la simplifie :</p>$$f = r ∧ [(p ∧ q) ∨ (¬p ∧ q) ∨ (¬p ∧ ¬q)] ;; factorisation de r
 = r ∧ [q ∨ (¬p ∧ ¬q)] ;; (p ∧ q) ∨ (¬p ∧ q) = q ∧ (p ∨ ¬p) = q
 = r ∧ [(q ∨ ¬p) ∧ (q ∨ ¬q)] ;; distributivité
 = r ∧ (¬p ∨ q) ;; q ∨ ¬q = 1$$
<p>Soit $f = r ∧ (¬p ∨ q) = r ∧ (p ⇒ q)$ : <b>3 portes</b> au lieu de 9.</p>`)}
${demo('circf', null, 'Le circuit f = r ∧ (¬p ∨ q)')}` },

{ t: 'Simplification d’expressions booléennes', h: `
<p>Un circuit coûte cher (surface, énergie) : moins il a de portes, mieux c’est. On simplifie donc les expressions avec les lois du chapitre 2.</p>
${bEx('Quatre simplifications', `<ul>
<li>$(p ⇒ p) ⇒ q$ : $p ⇒ p = ¬p ∨ p = 1$, donc l’expression vaut $1 ⇒ q = ¬1 ∨ q = q$.</li>
<li>$(p ∧ q) ⇒ (p ∨ q) = ¬(p ∧ q) ∨ p ∨ q = ¬p ∨ ¬q ∨ p ∨ q = 1$ : une <b>tautologie</b>.</li>
<li>$p ∨ (¬p ∧ q) = (p ∨ ¬p) ∧ (p ∨ q) = p ∨ q$.</li>
<li>$¬(p ∨ (q ∧ r)) = ¬p ∧ ¬(q ∧ r) = ¬p ∧ (¬q ∨ ¬r)$.</li></ul>`)}
${bRem('Simplifier n’est pas toujours obligatoire', '<p>Le résultat n’est pas toujours plus court, mais il est souvent plus <b>lisible</b> : $¬p ∧ (¬q ∨ ¬r)$ se lit directement, alors que $¬(p ∨ (q ∧ r))$ demande de réfléchir.</p>')}
${quick('Simplifie $p ∨ (¬p ∧ q)$ : écris le résultat (avec ∨).', 'p∨q|q∨p|p ou q', 'Par distributivité : $(p ∨ ¬p) ∧ (p ∨ q) = 1 ∧ (p ∨ q) = p ∨ q$.')}` },

{ t: 'Le connecteur de Sheffer (NAND) et l’universalité', h: `
<p>Le connecteur <b>NAND</b> (NON-ET), noté $p | q$, est défini par l’équivalence $p | q ⇔ ¬(p ∧ q)$.</p>
${tt(['p', 'q', 'p ∧ q', 'p | q'], [[1, 1, 1, 0], [1, 0, 0, 1], [0, 1, 0, 1], [0, 0, 0, 1]])}
${bProp('Tout s’écrit avec NAND', `$$p | p = ¬(p ∧ p) = ¬p
¬(p | q) = p ∧ q
¬p | ¬q = ¬(¬p ∧ ¬q) = p ∨ q$$`)}
${bMeth('Exprimer les connecteurs avec le seul NAND', `$$¬p = p | p
p ∧ q = (p | q) | (p | q) ;; on nie p | q en le « NANDant » avec lui-même
p ∨ q = (p | p) | (q | q) ;; De Morgan : ¬(¬p ∧ ¬q)
p ⇒ q = p | (q | q) ;; p ⇒ q = ¬(p ∧ ¬q)$$`)}
${bInfo('Pourquoi « universelle » ?', '<p>Toute fonction logique s’écrit avec $¬$, $∧$ et $∨$ (c’est ce que fait la synthèse de la partie 1). Comme ces trois opérations s’expriment avec NAND seul, <b>tout circuit</b> peut être fabriqué avec une seule sorte de porte. En pratique, un NAND se réalise avec très peu de transistors : c’est la brique des processeurs.</p>')}` },

{ t: 'Le demi-additionneur', h: `
<p>Un <b>additionneur</b> est le circuit qui effectue les calculs arithmétiques au cœur de l’unité arithmétique et logique (<b>ALU</b>) d’un processeur. Il additionne des nombres en <b>binaire</b>.</p>
${bDef('Addition de deux bits', `<p>En binaire : $0+0 = 0$ ; $0+1 = 1$ ; $1+0 = 1$ ; et $1 + 1 = 10_2$ (on écrit $0$ et on <b>retient 1</b>).</p>`)}
<p>Un <b>demi-additionneur</b> (Half Adder) additionne deux bits $A$ et $B$ <b>sans</b> retenue entrante. Il produit deux sorties : la <b>somme</b> $S$ et la <b>retenue sortante</b> $C$.</p>
${tt(['A', 'B', 'S (somme)', 'C (retenue)'], [[1, 1, 0, 1], [1, 0, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]])}
${bThm('Expressions du demi-additionneur', '$$S = A ⊕ B$$ $$C = A ∧ B$$<p>La somme vaut 1 quand les bits sont <b>différents</b> (XOR) ; la retenue vaut 1 quand les <b>deux</b> bits valent 1 (ET).</p>')}
<p>Le circuit : une porte <b>XOR</b> et une porte <b>ET</b> qui reçoivent toutes deux $A$ et $B$.</p>
${demo('demi', null, 'Demi-additionneur : clique sur A et B')}
${quick('Dans un demi-additionneur, que valent $S$ et $C$ pour $A = 1$ et $B = 1$ ? (écris S puis C, par exemple 10)', '01', '$1 + 1 = 10_2$ : la somme est $S = 0$ et la retenue $C = 1$, donc <b>01</b> pour (S, C).', 'Pense à $1 + 1 = 10$ en binaire : le chiffre de droite est S, celui de gauche est la retenue C.')}` },

{ t: 'L’additionneur complet 1 bit', h: `
<p>Pour additionner les bits de <b>rang supérieur</b> $A_i$ et $B_i$, il faut aussi tenir compte de la retenue $C_{in}$ venue du rang précédent. On utilise un <b>additionneur complet</b> (Full Adder) : 3 entrées ($A$, $B$, $C_{in}$) et 2 sorties ($S$, $C_{out}$).</p>
${tt(['A', 'B', 'Cin', 'S (somme)', 'Cout (retenue)'], [[1, 1, 1, 1, 1], [1, 1, 0, 0, 1], [1, 0, 1, 0, 1], [1, 0, 0, 1, 0], [0, 1, 1, 0, 1], [0, 1, 0, 1, 0], [0, 0, 1, 1, 0], [0, 0, 0, 0, 0]])}
<p>On lit $A + B + C_{in}$ en binaire : par exemple $1 + 1 + 1 = 3 = 11_2$ donne $S = 1$ et $C_{out} = 1$.</p>
${bThm('Expressions de l’additionneur complet', '$$S = A ⊕ B ⊕ C_{in}$$ $$C_{out} = (A ∧ B) ∨ (C_{in} ∧ (A ⊕ B))$$<p>Le schéma : <b>deux demi-additionneurs</b> et une <b>porte OU</b>.</p>')}
${bProof('Pourquoi cette construction marche', `<p>Un premier demi-additionneur additionne $A$ et $B$ : $A + B = 2C_1 + S_1$ avec $S_1 = A ⊕ B$ et $C_1 = A ∧ B$. Un second additionne $S_1$ et $C_{in}$ : $S_1 + C_{in} = 2C_2 + S$ avec $S = S_1 ⊕ C_{in}$ et $C_2 = S_1 ∧ C_{in}$. Alors</p>
$$A + B + C_{in} = 2C_1 + S_1 + C_{in} = 2(C_1 + C_2) + S$$
<p>Le chiffre des unités est $S = (A ⊕ B) ⊕ C_{in}$. Les retenues $C_1$ et $C_2$ ne peuvent pas être toutes deux égales à 1 : si $C_1 = 1$ alors $A = B = 1$, donc $S_1 = 0$ et $C_2 = 0$. Donc $C_1 + C_2 = C_1 ∨ C_2$ et</p>$$C_{out} = C_1 ∨ C_2 = (A ∧ B) ∨ (C_{in} ∧ (A ⊕ B))$$`)}
${demo('complet', null, 'Additionneur complet : clique sur A, B et Cin')}` },

{ t: 'Additionner sur plusieurs bits', h: `
<p>Pour additionner deux nombres de $n$ bits, on <b>chaîne</b> $n$ additionneurs complets : la retenue sortante $C_{out}$ de chacun alimente la retenue entrante $C_{in}$ du suivant (« additionneur à propagation de retenue »). Le premier reçoit $C_{in} = 0$.</p>
${bEx('11₂ + 01₂ (3 + 1)', `<p>On additionne rang par rang, de droite à gauche. $A = 11_2$ ($A_1 = 1$, $A_0 = 1$) et $B = 01_2$ ($B_1 = 0$, $B_0 = 1$).</p>${steps([
  '<b>Rang 0</b> : $A_0 + B_0 + C_{in} = 1 + 1 + 0 = 2 = 10_2$, donc $S_0 = 0$ et la retenue $C_0 = 1$.',
  '<b>Rang 1</b> : $A_1 + B_1 + C_0 = 1 + 0 + 1 = 2 = 10_2$, donc $S_1 = 0$ et la retenue sortante vaut 1.',
  '<b>Résultat</b> : la dernière retenue devient le bit de poids 2 : $1 0 0_2 = 4 = 3 + 1$ ✓.'])}`)}
${bRem('Dépassement', '<p>Si le résultat ne tient pas sur $n$ bits, la dernière retenue est « perdue » dans une machine à $n$ bits : c’est le <b>dépassement</b> (<i>overflow</i>), cause de bugs célèbres.</p>')}
${quick('Que vaut $11_2 + 01_2$ en binaire ? (écris le nombre en binaire sur 3 chiffres)', '100', 'On obtient $S_1S_0 = 00$ avec une retenue finale de 1 : le résultat est $100_2 = 4$.', 'Fais l’addition en colonnes, en propageant la retenue.')}` }
],
retenir: [
  '<b>Table → expression</b> : pour chaque ligne à 1, un ET des entrées (niées si elles valent 0) ; on relie par des OU ; puis on simplifie.',
  '$p | q = ¬(p ∧ q)$. Avec NAND seul : $¬p = p | p$ ; $p ∧ q = (p | q) | (p | q)$ ; $p ∨ q = (p | p) | (q | q)$ ; $p ⇒ q = p | (q | q)$.',
  '<b>Demi-additionneur</b> : $S = A ⊕ B$, $C = A ∧ B$ (XOR + ET).',
  '<b>Additionneur complet</b> : $S = A ⊕ B ⊕ C_{in}$, $C_{out} = (A ∧ B) ∨ (C_{in} ∧ (A ⊕ B))$ : deux demi-additionneurs + une porte OU.',
  '$A ⊕ B ⊕ C_{in}$ vaut 1 quand un nombre <b>impair</b> d’entrées valent 1 ; $C_{out}$ vaut 1 quand au moins <b>deux</b> entrées valent 1.',
  'On additionne sur $n$ bits en chaînant $n$ additionneurs complets : la retenue de l’un entre dans le suivant.'
],
pieges: [
  ['Oublier la retenue entrante', 'Un demi-additionneur ne sait pas gérer $C_{in}$ : dès le deuxième bit, il faut un additionneur complet.'],
  ['Écrire la mauvaise forme', 'Dans la synthèse, un ET par ligne <b>à 1</b> (pas à 0), puis des OU entre ces ET.']
],
quiz: [
  Q('Dans un demi-additionneur, la retenue C vaut…', ['A ∧ B', 'A ⊕ B', 'A ∨ B', '¬A'], 'La retenue vaut 1 seulement si A = B = 1 : c’est un ET.'),
  Q('Dans un demi-additionneur, la somme S vaut…', ['A ⊕ B', 'A ∧ B', 'A ∨ B', 'A ⇒ B'], 'La somme vaut 1 quand les deux bits sont différents : XOR.'),
  Q('En binaire, 1 + 1 donne…', ['10 (somme 0, retenue 1)', '2', '11', '01 (somme 1, retenue 0)'], '1 + 1 = 10 en binaire : on écrit 0 et on retient 1.'),
  Q('L’expression p ⇔ (p ⊕ r) est équivalente à…', ['¬r', 'r', 'p', 'p ∧ r'], 'Table : (p, r) = (1,1) → 0 ; (1,0) → 1 ; (0,1) → 0 ; (0,0) → 1. C’est ¬r.'),
  Q('Un additionneur complet est constitué de…', ['deux demi-additionneurs et une porte OU', 'deux portes ET et une porte XOR', 'un demi-additionneur et une porte NAND', 'trois demi-additionneurs'], 'Les deux retenues des demi-additionneurs sont réunies par un OU.'),
  Q('La retenue sortante d’un additionneur complet est…', ['(A ∧ B) ∨ (Cin ∧ (A ⊕ B))', 'A ⊕ B ⊕ Cin', '(A ∨ B) ∧ Cin', 'A ∧ B ∧ Cin'], 'Cout = 1 dès qu’au moins deux entrées valent 1 : (A ∧ B) ∨ (Cin ∧ (A ⊕ B)).'),
  Q('Pour A = 1, B = 1, Cin = 1, un additionneur complet donne…', ['S = 1 et Cout = 1', 'S = 0 et Cout = 1', 'S = 1 et Cout = 0', 'S = 0 et Cout = 0'], '1 + 1 + 1 = 3 = 11 en binaire : S = 1 et Cout = 1.'),
  Q('Que vaut 11₂ + 01₂ ?', ['100₂', '10₂', '110₂', '101₂'], '3 + 1 = 4 = 100₂.'),
  Q('Pourquoi dit-on que le NAND est une porte universelle ?', ['tout connecteur logique peut s’écrire avec NAND seul', 'c’est la porte la plus rapide', 'elle a une seule entrée', 'elle vaut toujours 1'], 'Avec NAND on obtient ¬, ∧ et ∨, donc toute fonction logique.'),
  Q('Pour passer d’une table de vérité à une expression, on utilise les lignes…', ['où la sortie vaut 1', 'où la sortie vaut 0', 'où toutes les entrées valent 1', 'où une seule entrée vaut 1'], 'On écrit un ET par ligne à 1, puis on relie ces ET par des OU.')
],
cartes: [
  C('Table de vérité → expression', 'Pour chaque ligne à 1 : un ET des entrées (niées si elles valent 0). Puis un OU entre ces ET. Puis on simplifie.'),
  C('Demi-additionneur', 'S = A ⊕ B (somme)\nC = A ∧ B (retenue)'),
  C('Additionneur complet', 'S = A ⊕ B ⊕ Cin\nCout = (A ∧ B) ∨ (Cin ∧ (A ⊕ B))\nDeux demi-additionneurs + une porte OU.'),
  C('1 + 1 en binaire', '10 : somme S = 0, retenue C = 1.'),
  C('Quand S = A ⊕ B ⊕ Cin vaut-elle 1 ?', 'Quand un nombre impair d’entrées valent 1.'),
  C('Quand Cout vaut-il 1 ?', 'Quand au moins deux des trois entrées valent 1.'),
  C('Chaîner des additionneurs', 'Le Cout de chaque rang entre dans le Cin du rang suivant ; le premier a Cin = 0.'),
  C('NAND : ¬, ∧, ∨, ⇒', '¬p ⇔ p | p\np ∧ q ⇔ (p | q) | (p | q)\np ∨ q ⇔ (p | p) | (q | q)\np ⇒ q ⇔ p | (q | q)')
],
exos: [
X('Exercice 1', { id: 'l4-1', niv: 2, src: 'TD', q: `<p>On donne la table de vérité de $f(p, q, r)$ : $f$ vaut 1 pour $(p, q, r) = (1,1,1)$, $(0,1,1)$ et $(0,0,1)$, et 0 sinon.</p>${tt(['p', 'q', 'r', 'f'], [[1, 1, 1, 1], [1, 1, 0, 0], [1, 0, 1, 0], [1, 0, 0, 0], [0, 1, 1, 1], [0, 1, 0, 0], [0, 0, 1, 1], [0, 0, 0, 0]])}<ol><li>Écrire l’expression logique brute de $f(p, q, r)$ à partir de la table de vérité.</li><li>Simplifier cette expression à l’aide des lois de l’algèbre de Boole.</li><li>Dessiner le schéma du circuit logique correspondant à l’expression simplifiée.</li></ol>`,
indice: 'Il y a trois lignes à 1, donc trois termes reliés par des OU. Dans l’expression brute, $r$ apparaît dans les trois termes : factorise-le.',
meth: 'Un ET par ligne à 1 (variables niées si elles valent 0), reliés par des OU. Puis factorise $r$ et simplifie $(p ∧ q) ∨ (¬p ∧ q) = q$.',
s: `<ol><li>Trois lignes à 1 : $$f = (p ∧ q ∧ r) ∨ (¬p ∧ q ∧ r) ∨ (¬p ∧ ¬q ∧ r)$$</li>
<li>$$f = r ∧ [(p ∧ q) ∨ (¬p ∧ q) ∨ (¬p ∧ ¬q)] ;; factorisation de r
 = r ∧ [q ∨ (¬p ∧ ¬q)] ;; (p ∧ q) ∨ (¬p ∧ q) = q ∧ (p ∨ ¬p) = q
 = r ∧ [(q ∨ ¬p) ∧ (q ∨ ¬q)] ;; distributivité de ∨ sur ∧
 = r ∧ (¬p ∨ q) ;; q ∨ ¬q = 1$$<p>On peut aussi l’écrire $r ∧ (p ⇒ q)$. <b>Contrôle</b> : pour $(p, q, r) = (1, 0, 1)$, $¬p ∨ q = 0 ∨ 0 = 0$ donc $f = 0$ ✓ (la table donne 0).</p></li>
<li>Circuit : on envoie $p$ dans une porte <b>NON</b> ; la sortie ($¬p$) et $q$ entrent dans une porte <b>OU</b> ; la sortie du OU et $r$ entrent dans une porte <b>ET</b> dont la sortie est $f$. Soit 3 portes (voir le schéma interactif de la partie 1).</p></li></ol>` }),

X('Exercice 2', { id: 'l4-2', niv: 2, src: 'TD', q: `<p>Simplifier les expressions booléennes suivantes. Indiquer les éventuelles tautologies.</p><ol><li>$(p ⇒ p) ⇒ q$</li><li>$(p ∧ q) ⇒ (p ∨ q)$</li><li>$p ∨ (¬p ∧ q)$</li><li>$¬(p ∨ (q ∧ r))$</li></ol>`,
indice: 'Commence par remplacer chaque $⇒$ par « $¬ ∨$ » : $A ⇒ B = ¬A ∨ B$.',
meth: 'Élimine $⇒$, applique De Morgan, puis complémentarité ($x ∨ ¬x = 1$) et éléments neutres.',
s: `<ol><li>$p ⇒ p = ¬p ∨ p = 1$, donc $(p ⇒ p) ⇒ q = 1 ⇒ q = ¬1 ∨ q = 0 ∨ q = q$. <b>Résultat : $q$</b> (pas une tautologie).</li>
<li>$$(p ∧ q) ⇒ (p ∨ q) = ¬(p ∧ q) ∨ (p ∨ q) ;; définition de ⇒
 = ¬p ∨ ¬q ∨ p ∨ q ;; De Morgan
 = (¬p ∨ p) ∨ (¬q ∨ q) = 1 ∨ 1 = 1 ;; complémentarité$$<p><b>Tautologie.</b></p></li>
<li>$$p ∨ (¬p ∧ q) = (p ∨ ¬p) ∧ (p ∨ q) = 1 ∧ (p ∨ q) = p ∨ q$$</li>
<li>$$¬(p ∨ (q ∧ r)) = ¬p ∧ ¬(q ∧ r) ;; De Morgan sur ∨
 = ¬p ∧ (¬q ∨ ¬r) ;; De Morgan sur ∧$$</li></ol>` }),

X('Exercice 3', { id: 'l4-3', niv: 2, src: 'TD', q: `<p>Le connecteur NAND, noté $p | q$, est défini par $p | q ⇔ ¬(p ∧ q)$.</p><ol><li>Construire la table de vérité de $p | q$.</li><li>Calculer $p | p$, $¬(p | q)$ et $¬p | ¬q$.</li><li>En déduire que l’on peut exprimer $¬p$, $p ∧ q$, $p ∨ q$ et $p ⇒ q$ uniquement à l’aide de la porte NAND.</li><li>Expliquer pourquoi le NAND est qualifié de <b>porte universelle</b> en architecture matérielle.</li></ol>`,
indice: 'Pour la question 3, utilise les résultats de la question 2 : $p | p = ¬p$ te permet de « fabriquer » la négation.',
meth: '$¬x = x | x$ ; $x ∧ y = ¬(x | y)$ ; pour $∨$ applique De Morgan puis ces deux résultats ; $p ⇒ q = ¬(p ∧ ¬q) = p | ¬q$.',
s: `<ol><li>${tt(['p', 'q', 'p ∧ q', 'p | q'], [[1, 1, 1, 0], [1, 0, 0, 1], [0, 1, 0, 1], [0, 0, 0, 1]])}</li>
<li>• $p | p = ¬(p ∧ p) = ¬p$.<br>• $¬(p | q) = ¬¬(p ∧ q) = p ∧ q$.<br>• $¬p | ¬q = ¬(¬p ∧ ¬q) = p ∨ q$ (De Morgan).</li>
<li>$$¬p = p | p ;; question 2
p ∧ q = ¬(p | q) = (p | q) | (p | q) ;; on nie avec x | x
p ∨ q = ¬p | ¬q = (p | p) | (q | q) ;; question 2
p ⇒ q = ¬(p ∧ ¬q) = p | ¬q = p | (q | q) ;; définition de ⇒ puis De Morgan$$</li>
<li>Toute fonction logique s’écrit avec $¬$, $∧$, $∨$ (synthèse par table de vérité). Comme ces trois opérations s’expriment avec NAND seul, <b>tout circuit</b> peut être construit avec une seule sorte de porte : un seul composant à fabriquer et à optimiser, d’où son intérêt industriel. (Le NOR possède la même propriété.)</li></ol>` }),

X('Exercice 4', { id: 'l4-4', niv: 1, src: 'TD', q: `<p>Un demi-additionneur additionne deux bits $A$ et $B$ et produit la somme $S$ et la retenue $C$.</p><ol><li>Établir et compléter la table de vérité du demi-additionneur $A + B$.</li><li>Exprimer les sorties $S$ et $C$ en fonction des entrées $A$ et $B$.</li><li>Analyser le schéma logique (une porte XOR et une porte ET reliées aux entrées $A$ et $B$) et vérifier la correspondance.</li></ol>`,
indice: 'Additionne en binaire : $1 + 1 = 10_2$. La somme $S$ est le chiffre de droite, la retenue $C$ celui de gauche.',
meth: 'Compare tes colonnes $S$ et $C$ aux tables de $⊕$ et de $∧$.',
s: `<ol><li>${tt(['A', 'B', 'S (somme)', 'C (retenue)'], [[1, 1, 0, 1], [1, 0, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]])}</li>
<li>La colonne $S$ est $0, 1, 1, 0$ : c’est la table du <b>XOR</b>, donc $S = A ⊕ B$. La colonne $C$ est $1, 0, 0, 0$ : c’est la table du <b>ET</b>, donc $C = A ∧ B$.</li>
<li>Le schéma comporte une porte XOR dont la sortie est $S$ et une porte ET dont la sortie est $C$, toutes deux alimentées par $A$ et $B$ : c’est exactement $S = A ⊕ B$ et $C = A ∧ B$. ✓</li></ol>` }),

X('Exercice 5', { id: 'l4-5', niv: 3, src: 'TD', q: `<p>Un additionneur complet additionne $A$, $B$ et la retenue entrante $C_{in}$.</p><ol><li>Compléter la table de vérité de l’additionneur complet $A + B + C_{in}$.</li><li>Démontrer algébriquement que $S = A ⊕ B ⊕ C_{in}$.</li><li>Démontrer que $C_{out} = (A ∧ B) ∨ (C_{in} ∧ (A ⊕ B))$.</li><li>Analyser le schéma composé de deux demi-additionneurs et d’une porte OU.</li><li>Expliquer comment chaîner deux additionneurs complets 1 bit pour réaliser l’addition binaire sur 2 bits : $11_2 + 01_2$.</li></ol>`,
indice: 'Pour les questions 2 et 3, additionne en deux temps : d’abord $A + B$ avec un demi-additionneur, puis ajoute $C_{in}$ au résultat avec un second.',
meth: 'Écris $A + B = 2C_1 + S_1$ puis $S_1 + C_{in} = 2C_2 + S$, et regroupe. Remarque que $C_1$ et $C_2$ ne peuvent pas valoir 1 en même temps.',
s: `<ol><li>${tt(['A', 'B', 'Cin', 'S', 'Cout'], [[1, 1, 1, 1, 1], [1, 1, 0, 0, 1], [1, 0, 1, 0, 1], [1, 0, 0, 1, 0], [0, 1, 1, 0, 1], [0, 1, 0, 1, 0], [0, 0, 1, 1, 0], [0, 0, 0, 0, 0]])}<p>On lit $A + B + C_{in}$ en binaire : $3 = 11_2$ donne $S = 1, C_{out} = 1$ ; $2 = 10_2$ donne $S = 0, C_{out} = 1$ ; $1 = 01_2$ donne $S = 1, C_{out} = 0$.</p></li>
<li>Un premier demi-additionneur fournit $S_1 = A ⊕ B$ et $C_1 = A ∧ B$ avec $A + B = 2C_1 + S_1$. Un second fournit $S = S_1 ⊕ C_{in}$ et $C_2 = S_1 ∧ C_{in}$ avec $S_1 + C_{in} = 2C_2 + S$. Alors $A + B + C_{in} = 2(C_1 + C_2) + S$ : le chiffre des unités est $S = S_1 ⊕ C_{in} = (A ⊕ B) ⊕ C_{in} = A ⊕ B ⊕ C_{in}$ (associativité du XOR). (Vérification : $S$ vaut 1 exactement quand un nombre impair d’entrées valent 1, ce que montre la table.)</li>
<li>$C_1$ et $C_2$ ne peuvent pas valoir 1 ensemble : $C_1 = 1$ impose $A = B = 1$, donc $S_1 = 0$ et $C_2 = S_1 ∧ C_{in} = 0$. Donc $C_1 + C_2 = C_1 ∨ C_2$, et $$C_{out} = C_1 ∨ C_2 = (A ∧ B) ∨ (C_{in} ∧ (A ⊕ B))$$</li>
<li>Schéma : $A$ et $B$ entrent dans le demi-additionneur n°1 → $(S_1, C_1)$. $S_1$ et $C_{in}$ entrent dans le demi-additionneur n°2 → $(S, C_2)$. La porte OU réunit $C_1$ et $C_2$ pour donner $C_{out}$. Cela correspond exactement aux formules des questions 2 et 3.</li>
<li>Rang 0 : $A_0 = 1$, $B_0 = 1$, $C_{in} = 0$ → $S_0 = 0$, $C_{out} = 1$. Ce $C_{out}$ est relié au $C_{in}$ du rang 1 : $A_1 = 1$, $B_1 = 0$, $C_{in} = 1$ → $S_1 = 0$, $C_{out} = 1$. Résultat : $C_{out} S_1 S_0 = 100_2 = 4 = 3 + 1$ ✓.</li></ol>` }),

X('Exercice 6', { id: 'l4-6', niv: 3, src: 'Travail perso', q: `<ol><li>Construire la table de vérité de l’expression booléenne $p ⇔ (p ⊕ r)$.</li><li>Écrire la négation, la réciproque et la contraposée de la règle d’accès : « Si l’utilisateur est authentifié et que son compte est actif, alors il peut accéder à la ressource. »</li><li>Décider si le raisonnement suivant est valide : le serveur est en panne ($P$) ou surchargé ($S$) ; s’il est en panne, alors le voyant est rouge ($R$) ; le voyant n’est pas rouge ($¬R$). Conclusion proposée : donc le serveur est surchargé ($S$).</li><li>Synthétiser un circuit à deux entrées $a$ et $b$ retournant 1 si et seulement si exactement une des deux entrées vaut 1. Donner son expression, sa table de vérité et son schéma logique.</li></ol>`,
indice: 'Question 3 : applique le modus tollens, puis le syllogisme disjonctif. Question 4 : le résultat porte un nom que tu connais déjà.',
meth: 'Q1 : table à 4 lignes, colonnes $p ⊕ r$ puis $⇔$. Q2 : $A ∧ C ⇒ X$. Q4 : table → un ET par ligne à 1 → un OU.',
s: `<ol><li>${tt(['p', 'r', 'p ⊕ r', 'p ⇔ (p ⊕ r)'], [[1, 1, 0, 0], [1, 0, 1, 1], [0, 1, 1, 0], [0, 0, 0, 1]])}<p>La dernière colonne est $0, 1, 0, 1$ : c’est exactement $¬r$. Donc $p ⇔ (p ⊕ r) = ¬r$.</p></li>
<li>$A$ : authentifié, $C$ : compte actif, $X$ : accès. La règle est $(A ∧ C) ⇒ X$.<br>• <b>Négation</b> : $A ∧ C ∧ ¬X$ — authentifié, compte actif et pourtant pas d’accès.<br>• <b>Réciproque</b> : $X ⇒ (A ∧ C)$ — si l’utilisateur accède à la ressource, il est authentifié et son compte est actif.<br>• <b>Contraposée</b> : $¬X ⇒ (¬A ∨ ¬C)$ — s’il ne peut pas accéder, alors il n’est pas authentifié ou son compte n’est pas actif.</li>
<li><b>Valide.</b> De $P ⇒ R$ et $¬R$, le <b>modus tollens</b> donne $¬P$ : le serveur n’est pas en panne. Puis de $P ∨ S$ et $¬P$, le <b>syllogisme disjonctif</b> donne $S$. (Vérification : si les trois hypothèses sont vraies, $R = 0$ donc $P = 0$ ; alors $P ∨ S$ vraie impose $S = 1$.)</li>
<li>Table (1 si exactement une entrée vaut 1) : $(1,1) → 0$ ; $(1,0) → 1$ ; $(0,1) → 1$ ; $(0,0) → 0$. Lignes à 1 : $(1,0)$ et $(0,1)$ :$$f = (a ∧ ¬b) ∨ (¬a ∧ b) = a ⊕ b$$<p>Schéma : deux portes NON (pour $¬a$ et $¬b$), deux portes ET ($a ∧ ¬b$ et $¬a ∧ b$) et une porte OU ; ou simplement une porte <b>XOR</b>.</p></li></ol>` })
]
},
]
};
