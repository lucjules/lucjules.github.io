/* Simulateur d'économie de Mine Clic : mesure combien de temps dure la partie.
     node outils/simuler-mine-clic.js [dossier-des-scripts] [heures-maximum]   (les deux arguments sont facultatifs)
   Un joueur « glouton » est simulé sur les vraies données du jeu (jeux/mine-clic/js/donnees.js, ou un autre
   dossier donné en argument : utile pour comparer avec une ancienne version obtenue par
   `git show <commit>:jeux/mine-clic/js/donnees.js > ancien/donnees.js`) :
   il achète ce qui se rembourse le plus vite, renaît quand le nombre d'étoiles grimpe de 50 %, puis dépense ses
   fragments (toujours le moins cher entre le prochain pouvoir et le prochain éclat stellaire). Les variables d'environnement règlent le joueur :
     CLICS=1    clics par seconde (1 par défaut ; 0 ne démarre jamais)
     K=1.5      il renaît quand le gain d'étoiles fait ×K
   Le simulateur est un modèle (il reprend les formules de jeu.js, sans les événements aléatoires) : il sert à
   comparer deux versions entre elles et à vérifier que la partie ne s'effondre pas, pas à prédire à l'heure près. */
const path = require('path');

const args = process.argv.slice(2), nombreArg = args.find(x => /^\d+(\.\d+)?$/.test(x)), dossierArg = args.find(x => !/^\d+(\.\d+)?$/.test(x));
const dossier = path.resolve(dossierArg || path.join(__dirname, '..', 'jeux', 'mine-clic', 'js'));
const MAX_H = +(nombreArg || 3000);
global.window = {};
require(path.join(dossier, 'donnees.js'));
const D = window.MC_DONNEES;
const R = Object.assign({ seuilEtoile: 1e8 }, D.REGLES || {});

const CLICS = +(process.env.CLICS || 1); // clics par seconde
const COMBO = 1.6;                        // multiplicateur moyen du combo
const EVT = 1.4;                          // coffres, frénésie, capacités : multiplicateur moyen de la production
const K_RENAITRE = +(process.env.K || 1.5);
const parId = l => { const o = {}; l.forEach(x => (o[x.id] = x)); return o; };
const AMEL = parId(D.AMELIORATIONS);

const S = { totalAll: 0, total: 0, blocs: 0, machines: {}, amels: new Set(), pouvoirs: new Set(), etoiles: 0, fragments: 0, eclats: 0, renaissances: 0, t: 0, maxM: {} };
const hasP = id => S.pouvoirs.has(id);
const jalons = n => {
  if (R.multJalons) return R.multJalons(n);
  let x = 1; D.JALONS.forEach(j => { if (n >= j[0]) x *= j[1]; }); return x;
};
const seuil = k => (R.seuil ? R.seuil(k) : Math.pow(k, 3) * R.seuilEtoile);
const etoilesPossibles = () => (R.etoiles ? R.etoiles(S.totalAll) : Math.floor(Math.cbrt(S.totalAll / R.seuilEtoile) + 1e-9));

// statistiques fictives, proportionnelles au temps, pour les conditions des améliorations et des progrès
function stats() {
  const t = S.t, clics = CLICS * t;
  const dims = D.DIMENSIONS.filter(d => (d.machine ? (S.maxM[d.machine] || 0) > 0 : S.totalAll >= d.seuil)).map(d => d.id);
  return {
    totalAll: S.totalAll, total: S.total, clics, casses: clics / 9, brillants: clics / 9 * 0.04, comboMax: Math.min(75, clics / 5),
    coffres: t / 110, creepers: t / 110 * 0.15, boums: t / 500, missionsFaites: t / 100, capacites: t / 250, maxAchat: S.totalAll > 1e6 ? 100 : 10,
    tempsJeu: t, bossTotal: S.totalAll >= 1e5 ? Math.floor(t / 600) : 0, bossVaincus: dims.slice(0, Math.floor(t / 1800)), cadeaux: 0, creepersNuit: t > 3600 ? 1 : 0,
    machines: S.machines, amels: [...S.amels], vues: dims, renaissances: S.renaissances, etoiles: S.etoiles, pouvoirs: [...S.pouvoirs], eclats: S.eclats,
    familiers: [], secrets: t > 7200 ? ['titre', 'minuit'] : [], achats: 200
  };
}
let nProg = 0, derniereMajProg = -1e9;
function progres(J) {
  if (S.t - derniereMajProg < 30 && S.t > 0) return nProg;
  derniereMajProg = S.t;
  const st = stats(), Jf = { cpsBase: J.cpsBase, maitrise: 3, blocsMaitrises: 6 };
  nProg = D.PROGRES.filter(p => { try { return p.test(st, Jf); } catch (e) { return false; } }).length;
  return nProg;
}
function calcul() {
  const m = { clic: 0, pct: 0, fortune: 0, global: 0, brillance: 0, machine: {} };
  S.amels.forEach(id => { const u = AMEL[id]; if (u.effet == 'machine') m.machine[u.machine] = (m.machine[u.machine] || 0) + 1; else if (u.effet == 'global') m.global += u.val; else m[u.effet] = (m[u.effet] || 0) + 1; });
  const J = {};
  const pct = hasP('constellation3') ? 8 : hasP('constellation2') ? 5 : hasP('constellation') ? 3 : 2;
  let forge = 1; D.POUVOIRS.forEach(p => { if (p.forge && hasP(p.id)) forge *= p.forge; });
  const eclat = R.multEclat ? R.multEclat(S.eclats) : 1;
  let mult = (1 + m.global / 100) * (1 + nProg / 100) * (1 + S.etoiles * pct / 100) * jalons(S.etoiles) * eclat * forge * 1.1 /* maîtrise */ * 1.1 /* abeille */;
  if (R.doux) mult = R.doux(mult);
  J.mult = mult;
  J.remise = (hasP('marchand') ? 0.9 : 1) * (hasP('grand-marchand') ? 0.9 : 1) * (hasP('maitre-marchand') ? 0.9 : 1) * (hasP('marchand4') ? 0.9 : 1);
  J.remiseAmel = (hasP('bibliothecaire') ? 0.9 : 1) * (hasP('bibliothecaire2') ? 0.9 : 1) * (hasP('bibliothecaire3') ? 0.9 : 1);
  J.cpsBase = 0;
  D.MACHINES.forEach(x => { J.cpsBase += (S.machines[x.id] || 0) * x.cps * Math.pow(2, m.machine[x.id] || 0) * mult; });
  const clicFixe = Math.pow(2, m.clic) * (hasP('gant') ? 2 : 1) * (hasP('gant2') ? 3 : 1) * (hasP('gant3') ? 5 : 1) * (hasP('gant4') ? 10 : 1) * 1.5 * mult;
  J.clicBase = clicFixe + J.cpsBase * m.pct / 100;
  const fortune = Math.pow(2, m.fortune) * (hasP('soie') ? 3 : 1) * (hasP('soie2') ? 3 : 1), multBrillant = 10 * Math.pow(2, m.brillance);
  const fantome = hasP('fantome') ? (hasP('fantome3') ? 10 : hasP('fantome2') ? 5 : 2) / COMBO : 0;
  J.revenu = J.cpsBase * EVT + (CLICS + fantome) * J.clicBase * COMBO * 0.5 + CLICS * J.clicBase * fortune * (0.96 + 0.04 * multBrillant);
  return J;
}
const prixMachine = (m, n, J) => Math.ceil(m.prix * Math.pow(1.15, n) * J.remise);
function visible(u) {
  if (S.amels.has(u.id)) return false;
  const c = u.cond, st = stats();
  return !((c.total != null && S.total < c.total) || (c.clics != null && st.clics < c.clics) || (c.casses != null && st.casses < c.casses) ||
    (c.coffres != null && st.coffres < c.coffres) || (c.comboMax != null && st.comboMax < c.comboMax) || (c.brillants != null && st.brillants < c.brillants) ||
    (c.capacites != null && st.capacites < c.capacites) || (c.boss != null && st.bossTotal < c.boss) || (c.machine && (S.machines[c.machine] || 0) < c.n));
}
function avancer(s, J) { const g = J.revenu * s; S.blocs += g; S.total += g; S.totalAll += g; S.t += s; }
function viderPouvoirs() {
  // à chaque fois, le moins cher entre le prochain pouvoir et le prochain éclat stellaire
  for (let achete = true; achete;) {
    achete = false;
    const prochain = D.POUVOIRS.find(p => !hasP(p.id));
    const pe = R.prixEclat ? R.prixEclat(S.eclats) : Infinity;
    if (prochain && S.fragments >= prochain.prix && prochain.prix <= pe) { S.fragments -= prochain.prix; S.pouvoirs.add(prochain.id); achete = true; }
    else if (S.fragments >= pe && (!prochain || pe < prochain.prix)) { S.fragments -= pe; S.eclats++; achete = true; }
  }
}
function nouvelleVie() {
  S.blocs = 0; S.total = 0; S.machines = {}; S.amels = new Set();
  if (hasP('depart')) { S.machines.pioche = 10; S.machines.mineur = 5; }
  if (hasP('depart2')) { S.machines.pioche = 50; S.machines.mineur = 25; S.machines.golem = 10; S.machines.wagonnet = 5; }
  if (hasP('depart3')) { S.machines.pioche = 250; S.machines.mineur = 150; S.machines.golem = 75; S.machines.wagonnet = 40; S.machines.tnt = 20; }
}

const reperes = [], faits = new Set(), vies = [];
const marque = nom => reperes.push([nom, S.t / 3600]);
let finPouvoirs = false;
for (let tours = 0; S.t < MAX_H * 3600 && tours < 3e7; tours++) {
  const J = calcul(); progres(J);
  D.MACHINES.forEach(m => { S.maxM[m.id] = Math.max(S.maxM[m.id] || 0, S.machines[m.id] || 0); });
  [1, 10, 100, 1000, 10000, 100000].forEach(k => { if (!faits.has('e' + k) && S.etoiles >= k) { faits.add('e' + k); marque(k + ' étoile' + (k > 1 ? 's' : '')); } });
  viderPouvoirs();
  if (!finPouvoirs && S.pouvoirs.size >= D.POUVOIRS.length) { finPouvoirs = true; marque('tous les pouvoirs (' + D.POUVOIRS.length + ')'); break; }
  const poss = etoilesPossibles();
  if (poss > S.etoiles && poss >= Math.max(S.etoiles + 1, Math.ceil(S.etoiles * K_RENAITRE))) {
    const g = poss - S.etoiles; S.etoiles += g; S.fragments += g; S.renaissances++;
    vies.push([S.etoiles, (S.t - (S.debutVie || 0)) / 3600, S.t / 3600]); S.debutVie = S.t;
    nouvelleVie(); continue;
  }
  // meilleur achat : le plus court « attente + remboursement »
  let meilleur = null;
  const candidats = [];
  D.MACHINES.forEach(m => { const n = S.machines[m.id] || 0; if (n > 0 || S.total >= m.prix * 0.4 || S.maxM[m.id] > 0 || m.id == 'pioche') candidats.push({ m, n }); });
  D.AMELIORATIONS.forEach(u => { if (visible(u)) candidats.push({ u }); });
  for (const c of candidats) {
    let cout, apres;
    if (c.m) { cout = prixMachine(c.m, c.n, J); S.machines[c.m.id] = c.n + 1; apres = calcul().revenu; S.machines[c.m.id] = c.n; }
    else { cout = Math.ceil(c.u.prix * J.remiseAmel); S.amels.add(c.u.id); apres = calcul().revenu; S.amels.delete(c.u.id); }
    const gain = apres - J.revenu; if (gain <= 0) continue;
    const attente = Math.max(0, cout - S.blocs) / J.revenu, score = attente + cout / gain;
    if (!meilleur || score < meilleur.score) meilleur = { c, cout, score, attente };
  }
  if (!meilleur) { avancer(Math.min(3600, Math.max(1, (seuil(Math.max(poss, S.etoiles) + 1) - S.totalAll) / J.revenu)), J); continue; }
  if (meilleur.attente > 0) avancer(meilleur.attente, J);
  S.blocs -= meilleur.cout;
  if (meilleur.c.m) S.machines[meilleur.c.m.id] = meilleur.c.n + 1; else S.amels.add(meilleur.c.u.id);
}

console.log('Dossier simulé : ' + dossier + '\nJoueur : ' + CLICS + ' clic(s) par seconde, renaissance à ×' + K_RENAITRE + ' d\'étoiles\n');
let dernier = 0;
vies.forEach(v => { if (v[0] >= dernier * 1.8) { console.log('  vie terminée à ' + String(v[0]).padStart(7) + ' ★   après ' + v[2].toFixed(1).padStart(7) + ' h   (cette vie : ' + v[1].toFixed(2) + ' h)'); dernier = v[0]; } });
console.log('');
reperes.forEach(([n, h]) => console.log('  ' + h.toFixed(1).padStart(8) + ' h   ' + n));
console.log('\nSimulation arrêtée à ' + (S.t / 3600).toFixed(1) + ' h : ' + S.etoiles + ' étoiles, ' + S.pouvoirs.size + ' / ' + D.POUVOIRS.length + ' pouvoirs, ' + S.eclats + ' éclats, ' + S.renaissances + ' renaissances.');
