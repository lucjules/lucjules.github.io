/* Moteur SQL partagé par les pages de la matière Bases de données (sql/*.html).
   Mini-moteur (sous-ensemble de T-SQL) qui exécute des requêtes SELECT sur des tables en mémoire :
   SQLE.run(base, requête) -> { cols, rows, ordered }, et SQLE.compare(résultat, attendu, ordonné). */
/* Mini-moteur SQL (sous-ensemble de T-SQL) : SELECT [DISTINCT] [TOP n] ... FROM ... [INNER JOIN ... ON ...] [WHERE ...] [ORDER BY ...] */
const SQLE = (() => {
  class F { constructor(v) { this.v = v; } }
  const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  class SqlError extends Error {}
  const KW = new Set(['select', 'distinct', 'top', 'from', 'where', 'order', 'by', 'asc', 'desc', 'inner', 'join', 'on', 'and', 'or', 'not', 'like', 'is', 'null', 'between', 'in', 'as', 'cross', 'left', 'right', 'group', 'having']);

  function tokenize(src) {
    const t = []; let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (src.startsWith('--', i)) { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (src.startsWith('/*', i)) { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
      if (ch === "'") {
        let s = ''; i++;
        for (;;) {
          if (i >= src.length) throw new SqlError("Chaîne de caractères non terminée : il manque une apostrophe fermante (').");
          if (src[i] === "'") { if (src[i + 1] === "'") { s += "'"; i += 2; continue; } i++; break; }
          s += src[i++];
        }
        t.push({ k: 'str', v: s }); continue;
      }
      if (ch === '"' || ch === '[') {
        const close = ch === '[' ? ']' : '"'; const e = src.indexOf(close, i + 1);
        if (e < 0) throw new SqlError('Identifiant non terminé.');
        t.push({ k: 'id', v: src.slice(i + 1, e) }); i = e + 1; continue;
      }
      if (/[0-9]/.test(ch)) {
        const m = /^[0-9]+(\.[0-9]+)?/.exec(src.slice(i));
        t.push({ k: 'num', v: m[1] ? new F(parseFloat(m[0])) : parseInt(m[0], 10) }); i += m[0].length; continue;
      }
      if (/[A-Za-zÀ-ÿ_@#]/.test(ch)) {
        const m = /^[A-Za-zÀ-ÿ_@#][A-Za-zÀ-ÿ0-9_@#$]*/.exec(src.slice(i));
        const low = norm(m[0]);
        t.push(KW.has(low) ? { k: 'kw', v: low } : { k: 'id', v: m[0], bare: true }); i += m[0].length; continue;
      }
      const two = src.slice(i, i + 2);
      if (['<=', '>=', '<>', '!='].includes(two)) { t.push({ k: 'op', v: two === '!=' ? '<>' : two }); i += 2; continue; }
      if ('=<>+-*/%(),.;'.includes(ch)) { t.push({ k: 'op', v: ch }); i++; continue; }
      throw new SqlError(`Caractère inattendu : « ${ch} ».`);
    }
    return t;
  }

  function parse(src) {
    const t = tokenize(src); let p = 0;
    const peek = () => t[p], next = () => t[p++];
    const isKw = v => t[p] && t[p].k === 'kw' && t[p].v === v;
    const isOp = v => t[p] && t[p].k === 'op' && t[p].v === v;
    const eatKw = v => isKw(v) ? (p++, true) : false;
    const eatOp = v => isOp(v) ? (p++, true) : false;
    const where = () => { const x = t[p]; return x ? `près de « ${x.k === 'str' ? "'" + x.v + "'" : x.k === 'num' ? (x.v instanceof F ? x.v.v : x.v) : x.v} »` : 'à la fin de la requête'; };
    const need = (v, what) => { if (!eatKw(v)) throw new SqlError(`Syntaxe incorrecte ${where()} : ${what || 'il manque ' + v.toUpperCase()}.`); };

    function primary() {
      const x = peek();
      if (!x) throw new SqlError('Syntaxe incorrecte : l\'expression est incomplète.');
      if (x.k === 'num') { p++; return { t: 'lit', v: x.v }; }
      if (x.k === 'str') { p++; return { t: 'lit', v: x.v }; }
      if (x.k === 'kw' && x.v === 'null') { p++; return { t: 'lit', v: null }; }
      if (isOp('(')) { p++; const e = expr(); if (!eatOp(')')) throw new SqlError('Il manque une parenthèse fermante « ) ».'); return e; }
      if (isOp('-')) { p++; return { t: 'neg', e: primary() }; }
      if (isOp('+')) { p++; return primary(); }
      if (x.k === 'id') {
        p++;
        if (isOp('(')) {
          p++; const args = [];
          if (!isOp(')')) { do { args.push(expr()); } while (eatOp(',')); }
          if (!eatOp(')')) throw new SqlError('Il manque une parenthèse fermante « ) ».');
          return { t: 'fn', n: norm(x.v), args };
        }
        if (isOp('.')) { p++; const y = next(); if (!y || y.k !== 'id') throw new SqlError('Nom de colonne attendu après le point.'); return { t: 'col', tbl: x.v, n: y.v }; }
        return { t: 'col', n: x.v };
      }
      throw new SqlError(`Syntaxe incorrecte ${where()}.`);
    }
    function mul() { let l = primary(); while (isOp('*') || isOp('/') || isOp('%')) { const o = next().v; l = { t: 'bin', o, l, r: primary() }; } return l; }
    function add() { let l = mul(); while (isOp('+') || isOp('-')) { const o = next().v; l = { t: 'bin', o, l, r: mul() }; } return l; }
    function cmp() {
      const l = add();
      if (t[p] && t[p].k === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(t[p].v)) { const o = next().v; return { t: 'cmp', o, l, r: add() }; }
      let neg = false; const save = p;
      if (isKw('not')) { p++; neg = true; }
      if (eatKw('like')) { return { t: 'like', neg, l, r: add() }; }
      if (eatKw('between')) { const a = add(); need('and', 'BETWEEN a AND b'); const b = add(); return { t: 'between', neg, l, a, b }; }
      if (eatKw('in')) {
        if (!eatOp('(')) throw new SqlError('IN doit être suivi d\'une liste entre parenthèses.');
        const list = []; do { list.push(add()); } while (eatOp(','));
        if (!eatOp(')')) throw new SqlError('Il manque une parenthèse fermante « ) ».');
        return { t: 'in', neg, l, list };
      }
      if (neg) p = save;
      if (eatKw('is')) { const n = eatKw('not'); need('null', 'IS [NOT] NULL'); return { t: 'isnull', neg: n, l }; }
      return l;
    }
    function not() { if (eatKw('not')) return { t: 'not', e: not() }; return cmp(); }
    function and() { let l = not(); while (eatKw('and')) l = { t: 'and', l, r: not() }; return l; }
    function expr() { let l = and(); while (eatKw('or')) l = { t: 'or', l, r: and() }; return l; }

    if (!isKw('select')) throw new SqlError('Cette version ne comprend que des requêtes SELECT : la requête doit commencer par SELECT.');
    p++;
    const q = { distinct: false, top: null, items: [], from: null, joins: [], where: null, order: [] };
    if (eatKw('distinct')) q.distinct = true;
    if (eatKw('top')) { const n = next(); if (!n || n.k !== 'num') throw new SqlError('TOP doit être suivi d\'un nombre.'); q.top = n.v; }
    do {
      if (isOp('*')) { p++; q.items.push({ star: true }); continue; }
      if (t[p] && t[p].k === 'id' && t[p + 1] && t[p + 1].v === '.' && t[p + 2] && t[p + 2].v === '*') { q.items.push({ star: true, tbl: t[p].v }); p += 3; continue; }
      const e = expr(); let alias = null;
      if (eatKw('as')) { const a = next(); if (!a || (a.k !== 'id' && a.k !== 'str')) throw new SqlError('Nom attendu après AS.'); alias = a.v; }
      else if (t[p] && t[p].k === 'id') alias = next().v;
      q.items.push({ e, alias });
    } while (eatOp(','));
    if (eatKw('from')) {
      const tbl = () => { const n = next(); if (!n || n.k !== 'id') throw new SqlError(`Nom de table attendu ${where()}.`); let a = null; if (eatKw('as')) a = next().v; else if (t[p] && t[p].k === 'id') a = next().v; return { name: n.v, alias: a || n.v }; };
      q.from = tbl();
      for (;;) {
        if (eatOp(',')) { q.joins.push({ ...tbl(), on: null }); continue; }
        if (isKw('inner') || isKw('join') || isKw('cross')) {
          const cross = isKw('cross'); if (!isKw('join')) p++; need('join', 'JOIN attendu');
          const tb = tbl(); let on = null;
          if (!cross) { need('on', 'une jointure INNER JOIN doit avoir une condition ON'); on = expr(); }
          q.joins.push({ ...tb, on }); continue;
        }
        break;
      }
    } else if (t[p] && t[p].k === 'id' && !t[p].bare === false && t[p + 1] === undefined) {
      /* ex. SELECT nom prénom : géré plus bas */
    }
    if (eatKw('where')) q.where = expr();
    if (isKw('group') || isKw('having')) throw new SqlError('GROUP BY et HAVING ne sont pas encore au programme de cette séquence.');
    if (eatKw('order')) { need('by', 'ORDER doit être suivi de BY'); do { const e = expr(); let d = false; if (eatKw('desc')) d = true; else eatKw('asc'); q.order.push({ e, d }); } while (eatOp(',')); }
    eatOp(';');
    if (p < t.length) {
      const h = (t[p].k === 'id' && q.items.length) ? ' Astuce : les attributs sont séparés par des virgules, et l\'ordre des clauses est SELECT, FROM, WHERE, ORDER BY.' : '';
      throw new SqlError(`Syntaxe incorrecte ${where()}.${h}`);
    }
    return q;
  }

  /* ---------- évaluation ---------- */
  const isF = x => x instanceof F, nv = x => isF(x) ? x.v : x;
  const isDateStr = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s);
  function cmpVals(a, b) {
    if (typeof a === 'string' && typeof b === 'string') { const x = norm(a), y = norm(b); return x < y ? -1 : x > y ? 1 : 0; }
    if (typeof a === 'string' || typeof b === 'string') {
      const n = typeof a === 'string' ? a : b;
      if (!isNaN(parseFloat(n)) && isFinite(n)) { const x = parseFloat(nv(a)), y = parseFloat(nv(b)); return x < y ? -1 : x > y ? 1 : 0; }
      throw new SqlError(`Impossible de comparer du texte et un nombre (« ${n} »).`);
    }
    const x = nv(a), y = nv(b); return x < y ? -1 : x > y ? 1 : 0;
  }
  function like(s, pat) {
    const re = '^' + norm(pat).replace(/[.*+?^${}()|\\]/g, '\\$&').replace(/%/g, '[\\s\\S]*').replace(/_/g, '[\\s\\S]') + '$';
    return new RegExp(re).test(norm(s));
  }
  function arith(o, a, b) {
    if (a === null || b === null) return null;
    if (typeof a === 'string' || typeof b === 'string') {
      if (o === '+' && typeof a === 'string' && typeof b === 'string') return a + b;
      throw new SqlError('Opération arithmétique impossible sur du texte.');
    }
    const fl = isF(a) || isF(b), x = nv(a), y = nv(b);
    if ((o === '/' || o === '%') && y === 0) throw new SqlError('Division par zéro.');
    let r;
    if (o === '+') r = x + y; else if (o === '-') r = x - y; else if (o === '*') r = x * y;
    else if (o === '/') r = fl ? x / y : Math.trunc(x / y); else r = x % y;
    return fl ? new F(r) : r;
  }
  const dparts = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); return m ? [+m[1], +m[2], +m[3]] : null; };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function callFn(n, a) {
    const need = k => { if (a.length !== k) throw new SqlError(`La fonction ${n.toUpperCase()} attend ${k} argument${k > 1 ? 's' : ''}.`); };
    if (n === 'getdate') { need(0); return today(); }
    if (n === 'datediff') {
      need(3); const part = norm(a[0] === null ? '' : String(a[0])); const x = dparts(a[1]), y = dparts(a[2]);
      if (!x || !y) return null;
      if (part === 'year' || part === 'yy' || part === 'yyyy') return y[0] - x[0];
      if (part === 'month' || part === 'mm') return (y[0] - x[0]) * 12 + y[1] - x[1];
      if (part === 'day' || part === 'dd') return Math.round((Date.UTC(...[y[0], y[1] - 1, y[2]]) - Date.UTC(x[0], x[1] - 1, x[2])) / 864e5);
      throw new SqlError('DATEDIFF : unité acceptée : year, month ou day.');
    }
    if (a.some(v => v === null)) return null;
    if (n === 'upper') { need(1); return String(a[0]).toUpperCase(); }
    if (n === 'lower') { need(1); return String(a[0]).toLowerCase(); }
    if (n === 'len') { need(1); return String(a[0]).length; }
    if (n === 'abs') { need(1); return isF(a[0]) ? new F(Math.abs(a[0].v)) : Math.abs(a[0]); }
    if (n === 'round') { const d = a.length > 1 ? nv(a[1]) : 0; const m = Math.pow(10, d); return new F(Math.round(nv(a[0]) * m) / m); }
    if (n === 'year' || n === 'month' || n === 'day') { need(1); const d = dparts(a[0]); return d ? d[n === 'year' ? 0 : n === 'month' ? 1 : 2] : null; }
    throw new SqlError(`Fonction inconnue : ${n.toUpperCase()}.`);
  }
  /* logique à trois valeurs : true / false / null (inconnu) */
  function ev(e, row, ctx) {
    switch (e.t) {
      case 'lit': return e.v;
      case 'neg': { const v = ev(e.e, row, ctx); return v === null ? null : isF(v) ? new F(-v.v) : -v; }
      case 'col': return ctx.lookup(row, e);
      case 'bin': return arith(e.o, ev(e.l, row, ctx), ev(e.r, row, ctx));
      case 'fn': return callFn(e.n, e.args.map((a, i) => (e.n === 'datediff' && i === 0 && a.t === 'col' && !a.tbl) ? a.n : ev(a, row, ctx)));
      case 'cmp': {
        const a = ev(e.l, row, ctx), b = ev(e.r, row, ctx); if (a === null || b === null) return null;
        const c = cmpVals(a, b);
        return { '=': c === 0, '<>': c !== 0, '<': c < 0, '>': c > 0, '<=': c <= 0, '>=': c >= 0 }[e.o];
      }
      case 'like': { const a = ev(e.l, row, ctx), b = ev(e.r, row, ctx); if (a === null || b === null) return null; const r = like(String(nv(a)), String(b)); return e.neg ? !r : r; }
      case 'between': { const a = ev(e.l, row, ctx), lo = ev(e.a, row, ctx), hi = ev(e.b, row, ctx); if (a === null || lo === null || hi === null) return null; const r = cmpVals(a, lo) >= 0 && cmpVals(a, hi) <= 0; return e.neg ? !r : r; }
      case 'in': { const a = ev(e.l, row, ctx); if (a === null) return null; let unk = false, found = false; for (const x of e.list) { const v = ev(x, row, ctx); if (v === null) unk = true; else if (cmpVals(a, v) === 0) { found = true; break; } } const r = found ? true : unk ? null : false; return r === null ? null : e.neg ? !r : r; }
      case 'isnull': { const a = ev(e.l, row, ctx); const r = a === null; return e.neg ? !r : r; }
      case 'not': { const v = ev(e.e, row, ctx); return v === null ? null : !v; }
      case 'and': { const a = ev(e.l, row, ctx); if (a === false) return false; const b = ev(e.r, row, ctx); if (b === false) return false; return a === null || b === null ? null : true; }
      case 'or': { const a = ev(e.l, row, ctx); if (a === true) return true; const b = ev(e.r, row, ctx); if (b === true) return true; return a === null || b === null ? null : false; }
    }
    throw new SqlError('Expression non gérée.');
  }
  const asBool = (v, what) => { if (v !== null && v !== true && v !== false) throw new SqlError(`Une condition ${what} doit être une expression booléenne (une comparaison, par exemple).`); return v === true; };

  function run(db, src) {
    const q = parse(src);
    const getTable = n => { const t = db.tables.find(x => norm(x.name) === norm(n)); if (!t) throw new SqlError(`Nom d'objet « ${n} » non valide : cette table n'existe pas dans la base.`); return t; };
    /* sources : liste de {alias, table} ; ligne = tableau de tableaux de valeurs */
    const srcs = [];
    let rows = [[]];
    if (q.from) {
      const t0 = getTable(q.from.name); srcs.push({ alias: q.from.alias, t: t0 });
      rows = t0.rows.map(r => [r]);
      for (const j of q.joins) {
        const tj = getTable(j.name); srcs.push({ alias: j.alias, t: tj });
        const out = [];
        for (const r of rows) for (const rr of tj.rows) {
          const nr = [...r, rr];
          if (j.on) { const ctx0 = mkctx(srcs); if (!asBool(ev(j.on, nr, ctx0), 'ON')) continue; }
          out.push(nr);
        }
        rows = out;
      }
    }
    function mkctx(ss) {
      return {
        lookup(row, e) {
          const hits = [];
          ss.forEach((s, si) => {
            if (e.tbl && norm(s.alias) !== norm(e.tbl) && norm(s.t.name) !== norm(e.tbl)) return;
            s.t.cols.forEach((c, ci) => { if (norm(c) === norm(e.n)) hits.push([si, ci]); });
          });
          if (!hits.length) {
            if (e.tbl && !ss.some(s => norm(s.alias) === norm(e.tbl) || norm(s.t.name) === norm(e.tbl))) throw new SqlError(`Le préfixe « ${e.tbl} » ne correspond à aucune table de la clause FROM.`);
            throw new SqlError(`Nom de colonne « ${e.n} » non valide.${ss.length ? ' Colonnes disponibles : ' + ss.flatMap(s => s.t.cols).join(', ') + '.' : ''}`);
          }
          if (hits.length > 1) throw new SqlError(`Nom de colonne « ${e.n} » ambigu : précise la table (par exemple ${ss[hits[0][0]].alias}.${e.n}).`);
          return row[hits[0][0]][hits[0][1]];
        }
      };
    }
    const ctx = mkctx(srcs);
    if (q.where) rows = rows.filter(r => asBool(ev(q.where, r, ctx), 'WHERE'));
    /* projection */
    const cols = [], projs = [];
    for (const it of q.items) {
      if (it.star) {
        if (!srcs.length) throw new SqlError('SELECT * n\'a pas de sens sans clause FROM.');
        srcs.forEach((s, si) => { if (it.tbl && norm(s.alias) !== norm(it.tbl) && norm(s.t.name) !== norm(it.tbl)) return; s.t.cols.forEach((c, ci) => { cols.push(c); projs.push(r => r[si][ci]); }); });
      } else {
        cols.push(it.alias || (it.e.t === 'col' ? it.e.n : '(Aucun nom de colonne)'));
        projs.push(r => ev(it.e, r, ctx));
      }
    }
    if (!q.from) rows = [[]];
    let out = rows.map(r => ({ src: r, vals: projs.map(f => f(r)) }));
    /* tri : alias de SELECT prioritaires, sinon colonnes des tables */
    if (q.order.length) {
      const keyOf = (o, rec) => {
        if (o.e.t === 'col' && !o.e.tbl) { const k = cols.findIndex(c => norm(c) === norm(o.e.n)); const isAlias = q.items.some(it => !it.star && it.alias && norm(it.alias) === norm(o.e.n)); if (isAlias) return rec.vals[k]; }
        if (o.e.t === 'lit' && typeof o.e.v === 'number') { if (o.e.v < 1 || o.e.v > cols.length) throw new SqlError('Position ORDER BY hors limites.'); return rec.vals[o.e.v - 1]; }
        return ev(o.e, rec.src, ctx);
      };
      const keyed = out.map((rec, i) => ({ rec, i, keys: q.order.map(o => keyOf(o, rec)) }));
      keyed.sort((a, b) => {
        for (let k = 0; k < q.order.length; k++) {
          const x = a.keys[k], y = b.keys[k]; let c;
          if (x === null && y === null) c = 0; else if (x === null) c = -1; else if (y === null) c = 1; else c = cmpVals(x, y);
          if (c) return q.order[k].d ? -c : c;
        }
        return a.i - b.i;
      });
      out = keyed.map(k => k.rec);
    }
    let res = out.map(r => r.vals);
    if (q.distinct) { const seen = new Set(); res = res.filter(r => { const k = JSON.stringify(r.map(v => v === null ? null : typeof v === 'string' ? norm(v) : nv(v))); if (seen.has(k)) return false; seen.add(k); return true; }); }
    if (q.top !== null) res = res.slice(0, q.top);
    return { cols, rows: res, ordered: q.order.length > 0 };
  }

  const fmt = v => v === null ? 'NULL' : isF(v) ? (Number.isInteger(v.v) ? v.v.toFixed(1) : String(+v.v.toFixed(6))) : String(v);
  const keyRow = r => JSON.stringify(r.map(v => v === null ? null : typeof v === 'string' ? norm(v) : nv(v)));

  /* compare le résultat d'un élève à celui de la requête de référence */
  function compare(got, exp, ordered) {
    if (got.cols.length !== exp.cols.length) return [false, `Ton résultat a ${got.cols.length} colonne${got.cols.length > 1 ? 's' : ''}, on en attend ${exp.cols.length}.`];
    const g = got.rows.map(keyRow), e = exp.rows.map(keyRow);
    if (g.length !== e.length) {
      const diff = g.length > e.length ? 'trop de lignes' : 'pas assez de lignes';
      return [false, `Ton résultat contient ${got.rows.length} ligne${got.rows.length > 1 ? 's' : ''} (${diff}) : on en attend ${exp.rows.length}.`];
    }
    const sg = [...g].sort(), se = [...e].sort();
    for (let i = 0; i < sg.length; i++) if (sg[i] !== se[i]) return [false, 'Le nombre de lignes est bon, mais le contenu ne correspond pas : vérifie les colonnes choisies et ta condition.'];
    if (ordered) for (let i = 0; i < g.length; i++) if (g[i] !== e[i]) return [false, 'Les bonnes lignes sont là, mais pas dans le bon ordre : vérifie ORDER BY (ASC ou DESC).'];
    return [true, 'Le résultat correspond exactement à celui attendu.'];
  }
  return { run, parse, fmt, compare, norm, SqlError, like, F };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = SQLE;
