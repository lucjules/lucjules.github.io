/* Outils de rédaction du cours de maths : formules, boîtes de cours, tableaux, questions, cartes, exercices.
   Chargé avant les fichiers de contenu (cours-*.js) et avant app.js. Tout est exposé en variables globales.

   FORMULES (dans le texte des chapitres) :
     $a = bq + r$          formule dans une phrase (les lettres isolées passent en italique)
     $$ ... $$             formule en bloc, centrée ; une ligne par ligne du bloc ;
                           « ;; texte » à la fin d'une ligne = commentaire grisé à droite
     x^2  x^{n+1}  u_n  u_{n+1}      exposants et indices (un chiffre, une lettre, ou {...})
     frac{a}{b}            fraction            sqrt{n}   racine carrée
     text{pair}            texte droit dans une formule      bar{xyz}   trait au-dessus (nombre écrit avec ses chiffres)
     \{ et \}              accolades affichées (ensembles) ; les accolades seules servent à grouper
     PGCD PPCM mod min max  restent droits (liste MOTS_DROITS) ; les autres suites de lettres sont des produits
   Les symboles ∀ ∃ ∧ ∨ ¬ ⇒ ⇔ ≡ ℤ ℕ ≤ ≥ ≠ ∈ ⊕ se tapent tels quels. « - » devient le vrai signe moins « − ». */
(function (G) {
  'use strict';

  var MOTS_DROITS = { PGCD: 1, PPCM: 1, mod: 1, min: 1, max: 1, div: 1, ent: 1, vrai: 1, faux: 1, NAND: 1, NOR: 1, XOR: 1, ET: 1, OU: 1, NON: 1, in: 1, out: 1, card: 1, sin: 1, cos: 1, ln: 1, exp: 1, Re: 1, ssi: 1 };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- formules ---------- */
  function mj(s) {
    var i = 0;
    function groupe() { // s[i] === '{' : renvoie le contenu et place i après l'accolade fermante
      var d = 0, debut = i + 1;
      for (; i < s.length; i++) {
        if (s[i] === '\\') { i++; continue; }            // accolade échappée : ne compte pas
        if (s[i] === '{') d++;
        else if (s[i] === '}') { d--; if (!d) { var r = s.slice(debut, i); i++; return r; } }
      }
      throw new Error('Accolade non fermée dans la formule : ' + s);
    }
    function argument() { // après ^ ou _
      if (s[i] === '{') return mj(groupe());
      var m = /^(\d+|[A-Za-zα-ωΔ])/.exec(s.slice(i));
      if (m) { i += m[0].length; return mj(m[0]); }
      if (/^[*+\-]/.test(s.slice(i))) { var sg = s[i]; i++; return sg === '-' ? '−' : sg; }   // ℝ^*, ℝ^+, ℝ^-
      return '';
    }
    var out = '', m;
    while (i < s.length) {
      var c = s[i];
      if (c === '^') { i++; out += '<sup>' + argument() + '</sup>'; continue; }
      if (c === '_') { i++; out += '<sub>' + argument() + '</sub>'; continue; }
      if (c === '{') { out += mj(groupe()); continue; }
      if (c === '\\' && (s[i + 1] === '{' || s[i + 1] === '}')) { out += s[i + 1]; i += 2; continue; }   // \{ et \} : accolades affichées
      m = /^(frac|sqrt|text|bar)\{/.exec(s.slice(i));
      if (m) {
        i += m[1].length;
        if (m[1] === 'frac') { var a = groupe(), b = groupe(); out += '<span class="fr"><span class="nu">' + mj(a) + '</span><span class="de">' + mj(b) + '</span></span>'; }
        else if (m[1] === 'sqrt') { out += '<span class="rad">√<span class="rv">' + mj(groupe()) + '</span></span>'; }
        else if (m[1] === 'bar') out += '<span class="ov">' + mj(groupe()) + '</span>';
        else out += '<span class="up">' + esc(groupe()) + '</span>';
        continue;
      }
      m = /^[A-Za-zα-ωϕ]+/.exec(s.slice(i));
      if (m) {
        i += m[0].length;
        out += MOTS_DROITS[m[0]] ? '<span class="up">' + m[0] + '</span>' : m[0].replace(/./g, '<i>$&</i>');
        continue;
      }
      i++;
      out += c === '-' ? '−' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c;
    }
    return out;
  }

  // Typographie française : espace insécable avant : ; ! ? » et après « (sans toucher aux balises)
  function typo(h) {
    return ('>' + h + '<').replace(/>([^<>]+)</g, function (m, t) {
      return '>' + t.replace(/ ([:;!?»])/g, ' $1').replace(/« /g, '« ') + '<';
    }).slice(1, -1);
  }
  // Remplace $…$ et $$…$$ dans un texte HTML
  function R(h) {
    if (h == null) return '';
    return typo(String(h)
      .replace(/\$\$([\s\S]+?)\$\$/g, function (_, m) {
        var lignes = m.trim().split(/\n/);
        return '<div class="eq' + (lignes.length > 1 ? ' multi' : '') + '">' + lignes.map(function (l) {
          var p = l.trim().split(/\s;;\s/);
          return '<div class="eql"><span class="el">' + mj(p[0]) + '</span>' + (p[1] ? '<span class="why">' + esc(p[1]) + '</span>' : '') + '</div>';
        }).join('') + '</div>';
      })
      .replace(/\$([^$]+?)\$/g, function (_, m) { return '<span class="m">' + mj(m) + '</span>'; }))
      .replace(/<p>\s*<\/p>/g, '');   // une formule en bloc dans un <p> laisse un paragraphe vide
  }
  // Texte brut (sans balises) d'un contenu : pour la recherche et les aperçus
  function brut(h) {
    var d = document.createElement('div'); d.innerHTML = R(h);
    return d.textContent.replace(/\s+/g, ' ').trim();
  }

  /* ---------- boîtes de cours (mêmes couleurs que les PDF du cours) ---------- */
  var KIND = {
    def: ['📝', 'Définition'], prop: ['📐', 'Propriété'], thm: ['⭐', 'Théorème'], meth: ['🔧', 'Méthode'],
    ex: ['💡', 'Exemple'], rem: ['ℹ️', 'Remarque'], trap: ['⚠️', 'Attention'], algo: ['⚙️', 'Algorithme'], info: ['🧭', 'À quoi ça sert']
  };
  function box(k, a, b) {
    var titre = b === undefined ? '' : a, corps = b === undefined ? a : b;
    return '<aside class="box ' + k + '"><div class="bh"><span class="bi" aria-hidden="true">' + KIND[k][0] + '</span><span class="bk">' + KIND[k][1] + '</span>' +
      (titre ? '<span class="bt">' + titre + '</span>' : '') + '</div><div class="bb">' + corps + '</div></aside>';
  }
  Object.keys(KIND).forEach(function (k) { G['b' + k[0].toUpperCase() + k.slice(1)] = function (a, b) { return box(k, a, b); }; });
  // bDef bProp bThm bMeth bEx bRem bTrap bAlgo bInfo
  G.bProof = function (titre, h) { return '<details class="proof"><summary><span class="bi" aria-hidden="true">✍️</span> Démonstration' + (titre ? ' : ' + titre : '') + '</summary><div class="bb">' + h + '</div></details>'; };

  /* ---------- tableaux ---------- */
  // tt(['P','Q','P ∧ Q'], [[1,1,1],[1,0,0]], {raw:false, cap:'…', plain:false, num:false})
  // num:true → les 0 et 1 ne sont pas colorés (tableau de nombres)
  G.tt = function (heads, rows, o) {
    o = o || {};
    var cell = function (c) {
      if (!o.num && (c === 1 || c === '1')) return '<td class="v1">1</td>';   // o.num : tableau de nombres, pas de valeurs de vérité
      if (!o.num && (c === 0 || c === '0')) return '<td class="v0">0</td>';
      return '<td>' + (o.raw ? c : mj(String(c))) + '</td>';
    };
    return '<div class="scroll"><table class="tt' + (o.plain ? ' plain' : '') + '">' + (o.cap ? '<caption>' + o.cap + '</caption>' : '') +
      '<thead><tr>' + heads.map(function (h) { return '<th>' + (o.raw ? h : mj(String(h))) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(cell).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  };
  // sys(['x ≡ 2 (3)', 'x ≡ 3 (5)']) : système d'équations ou de congruences, avec accolade
  G.sys = function (l) { return '<div class="sys"><div class="sysr">' + l.map(function (x) { return '<div>' + R('$' + x + '$') + '</div>'; }).join('') + '</div></div>'; };
  G.steps = function (l) { return '<ol class="steps">' + l.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>'; };

  /* ---------- « À toi » : mini-exercice avec réponse courte vérifiée sur place ----------
     quick('Reste de −113 par 8 ?', '7', 'Explication affichée après la réponse.', 'Indice facultatif')
     Plusieurs réponses acceptées : '7|7.0'. Espaces, virgule décimale et « − » sont tolérés. */
  G.quick = function (q, rep, why, indice) {
    return '<div class="try" data-a="' + esc(rep) + '"><div class="tq"><span class="tl">À toi</span><div class="tt2">' + q + '</div></div>' +
      '<div class="tr"><input class="inp" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Ta réponse">' +
      '<button type="button" class="btn sm" data-try>Vérifier</button>' + (indice ? '<button type="button" class="ghost sm" data-tryhint>Indice</button>' : '') + '</div>' +
      (indice ? '<p class="thint" hidden>' + indice + '</p>' : '') +
      '<div class="tfb" role="status" aria-live="polite"></div><template class="twhy">' + (why || '') + '</template></div>';
  };
  // Emplacement d'un outil interactif dans une leçon (rempli par app.js) : demo('sieve'), demo('pgcd', {pgA:'8820', pgB:'3150'})
  G.demo = function (nom, pre, legende) {
    return '<figure class="demo" data-demo="' + nom + '"' + (pre ? ' data-pre="' + esc(JSON.stringify(pre)) + '"' : '') + '><figcaption>' + (legende || '') + '</figcaption><div class="demo-body"></div></figure>';
  };

  /* ---------- données ---------- */
  G.Q = function (q, o, e) { return { q: q, o: o, e: e }; };   // la bonne réponse est toujours la première (mélangée à l'affichage)
  G.C = function (f, v) { return { f: f, v: v }; };
  // Exercice : X('Exercice 1', { id:'l1-1', niv:1, src:'TD', q:'énoncé', indice:'…', meth:'…', s:'correction' })
  G.X = function (n, o) { o.n = n; return o; };

  G.R = R; G.mj = mj; G.brut = brut; G.esc = esc;
  G.$ = function (s, r) { return (r || document).querySelector(s); };
  G.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  G.shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  G.COURS = G.COURS || {};
})(window);
