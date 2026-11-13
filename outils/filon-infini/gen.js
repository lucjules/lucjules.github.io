/* Génère data.js : arbres (noms, effets) et coûts calibrés par simulation d'un joueur type.
   Principe : le coût de chaque nœud = ce que le joueur gagne en `wait` secondes au moment où il l'atteint. */
const fs=require('fs'), path=require('path');
const G=require('./core.js');
const CFG=Object.assign({
  clicks:2, gap:8,
  N:[72,84,84,92,100],            // nœuds principaux par arbre
  w0:[5,0.34],                    // attente (s) = a + b*i, arbre des pièces
  wt:{1:[10,0.22],2:[13,0.28],3:[15,0.30],4:[16,0.34]},
  branchEvery:[22,14,14,15,16],
  baseGain:1,
},process.env.CFG?JSON.parse(process.env.CFG):{});

/* ---------- noms ---------- */
const TOOLS=[['Pioche en bois','⛏️'],['Gants renforcés','🧤'],['Pioche de fer','⛏️'],['Marteau-piqueur','🔨'],['Pioche en acier','⛏️'],['Gantelet mécanique','🦾'],['Pioche en diamant','💎'],['Marteau pneumatique','🔨'],['Pioche de mithril','⛏️'],['Poing d’adamantium','👊'],['Pioche stellaire','🌟'],['Main du destin','🖐️']];
const SOURCES=[['Mineur novice','👷'],['Brouette','🛒'],['Foreuse manuelle','🔩'],['Chariot minier','🛤️'],['Mineur expert','⛑️'],['Foreuse électrique','🔌'],['Wagonnet','🚃'],['Tapis roulant','➡️'],['Excavatrice','🚜'],['Camion benne','🚚'],['Foreuse géante','🕳️'],['Usine de broyage','🏭'],['Fonderie','🔥'],['Raffinerie','⚗️'],['Centrale à charbon','🏗️'],['Laser de coupe','⚡'],['Drone mineur','🛸'],['Réacteur compact','☢️'],['Robot foreur','🤖'],['Forge orbitale','🛰️'],['Station minière','🚀'],['Portail minier','🌀'],['Réacteur à fusion','⚛️'],['Collecteur d’astéroïdes','☄️'],['Moissonneuse stellaire','🌠'],['Mine d’antimatière','🧪'],['Faille dimensionnelle','🌌'],['Cœur de géante rouge','🔴'],['Sphère de Dyson','🪐'],['Trou noir domestique','⚫'],['Atelier du temps','⏳'],['Usine à univers','🌍']];
const MULTS=[['Prime de rendement','💰'],['Assurance mineurs','📜'],['Contrat municipal','🏛️'],['Subvention d’État','🏦'],['Monopole minier','👑'],['Cartel des métaux','🕴️'],['Bourse des minerais','📈'],['Brevet industriel','📑'],['Fusion d’entreprises','🤝'],['Empire minier','🏰']];
const NAMES={
 1:{n:[['Graine','f','🌱'],['Racine','f','🌿'],['Braise','f','🔥'],['Aube','f','🌅'],['Sève','f','🍯'],['Forge','f','⚒️'],['Cendre','f','🌫️'],['Étincelle','f','✨'],['Pousse','f','🌱'],['Source','f','💧'],['Phénix','m','🐦'],['Souffle','m','🍃'],['Brasier','m','🔥'],['Cycle','m','♻️'],['Renouveau','m','🌸'],['Germe','m','🌰'],['Feuillage','m','🍃'],['Printemps','m','🌷'],['Écho','m','🔔'],['Éveil','m','🌄']],
    a:[['ancien','ancienne'],['doré','dorée'],['vif','vive'],['profond','profonde'],['éternel','éternelle'],['sacré','sacrée'],['brûlant','brûlante'],['lumineux','lumineuse'],['fertile','fertile'],['puissant','puissante'],['pur','pure'],['radieux','radieuse']]},
 2:{n:[['Cime','f','🏔️'],['Brise','f','🌬️'],['Nuée','f','☁️'],['Aile','f','🪽'],['Falaise','f','⛰️'],['Montée','f','📈'],['Lumière','f','💡'],['Hauteur','f','🗻'],['Plume','f','🪶'],['Échelle','f','🪜'],['Sommet','m','🏔️'],['Vent','m','💨'],['Nuage','m','☁️'],['Aigle','m','🦅'],['Envol','m','🕊️'],['Zénith','m','☀️'],['Horizon','m','🌄'],['Ciel','m','🌤️'],['Orage','m','⛈️'],['Cairn','m','🪨']],
    a:[['céleste','céleste'],['vertigineux','vertigineuse'],['glacé','glacée'],['limpide','limpide'],['infini','infinie'],['haut','haute'],['radieux','radieuse'],['souverain','souveraine'],['léger','légère'],['pur','pure'],['majestueux','majestueuse'],['éclatant','éclatante']]},
 3:{n:[['Étoile','f','⭐'],['Nébuleuse','f','🌌'],['Comète','f','☄️'],['Orbite','f','🪐'],['Singularité','f','⚫'],['Aurore','f','🌈'],['Galaxie','f','🌀'],['Constellation','f','✨'],['Dimension','f','🧿'],['Lune','f','🌙'],['Cosmos','m','🌌'],['Vide','m','⚫'],['Quasar','m','💫'],['Horizon d’événements','m','🕳️'],['Pulsar','m','📡'],['Éclat','m','💠'],['Spectre','m','👻'],['Trou de ver','m','🌀'],['Néant','m','🕳️'],['Infini','m','♾️']],
    a:[['cosmique','cosmique'],['quantique','quantique'],['stellaire','stellaire'],['obscur','obscure'],['transcendant','transcendante'],['spectral','spectrale'],['absolu','absolue'],['impalpable','impalpable'],['sidéral','sidérale'],['fractal','fractale'],['liminal','liminale'],['résonant','résonante']]},
 4:{n:[['Prière','f','🙏'],['Offrande','f','🕯️'],['Aura','f','😇'],['Éternité','f','♾️'],['Révélation','f','👁️'],['Couronne','f','👑'],['Bénédiction','f','✝️'],['Harpe','f','🎼'],['Flamme','f','🔥'],['Splendeur','f','🌟'],['Autel','m','🏛️'],['Oracle','m','🔮'],['Halo','m','😇'],['Miracle','m','✨'],['Temple','m','⛩️'],['Chant','m','🎶'],['Trône','m','🪑'],['Panthéon','m','🏛️'],['Sceptre','m','🔱'],['Destin','m','🧭']],
    a:[['divin','divine'],['sacré','sacrée'],['immortel','immortelle'],['glorieux','glorieuse'],['suprême','suprême'],['béni','bénie'],['rayonnant','rayonnante'],['originel','originelle'],['omniscient','omnisciente'],['saint','sainte'],['souverain','souveraine'],['éternel','éternelle']]},
};
function fillerName(t,j){
  const L=NAMES[t], nn=L.n.length, na=L.a.length;
  const noun=L.n[j%nn], adj=L.a[(Math.floor(j/nn)*5+j*3)%na];
  return [noun[0]+' '+(noun[1]==='f'?adj[1]:adj[0]),noun[2]];
}

/* ---------- recettes ---------- */
const ENTRIES=[[],[],[],[],[]];       // par arbre : {n,ic,type,...}
function recipe0(){
  const N=CFG.N[0], list=[]; let ti=0,si=0,mi=0, cv=0;
  const clickSlots=new Set([4,7,12,16,21,26,32,38,45,52,60,66]);
  const mf=[2,2,3,3,4,5,6,8];
  let mk=0;
  for(let i=0;i<N;i++){
    let type='p';
    if(i<2) type='c'; else if(i%9===8) type='m'; else if(clickSlots.has(i)) type=(i<30?['k','c','q'][cv++%3]:'q');
    let name,ic;
    if(type==='m'){ [name,ic]=MULTS[mk%MULTS.length]; mk++; }
    else if(type==='p'){ [name,ic]=SOURCES[si%SOURCES.length]; si++; }
    else { [name,ic]=TOOLS[ti%TOOLS.length]; ti++; }
    const f=type==='m'?mf[(mk-1)%mf.length]:(1.15+0.5*Math.exp(-i/14));
    list.push({n:name,ic:ic,type:type,f:f,i:i,w:CFG.w0[0]+CFG.w0[1]*i});
    if(i>0&&i%CFG.branchEvery[0]===CFG.branchEvery[0]-1&&i<N-4){
      const b=SOURCES[(si+7)%SOURCES.length]; si++;
      list.push({n:b[0]+' (voie annexe)',ic:b[1],type:'p',f:1.18,branch:true,i:i,w:CFG.w0[0]+CFG.w0[1]*i});
    }
  }
  return list;
}
const CYC=[['m',1.3],['g',1.8],['m',1.25],['g',1.4],['m',1.6],['g',1.3],['m',2.5],['g',1.5],['m',1.8],['g',4]];
const KEEPD={1:['Coffre de la mine','Garde l’arbre des pièces après une Renaissance, et rend celui que tu viens de perdre.'],
 2:['Mémoire des cimes','Garde l’arbre Renaissance après une Ascension, et rend celui que tu viens de perdre.'],
 3:['Écho des sommets','Garde l’arbre Ascension après une Transcendance, et rend celui que tu viens de perdre.'],
 4:['Mémoire éternelle','Garde l’arbre Transcendance après une Divinité, et rend celui que tu viens de perdre.']};
const AUTOD={
 click:['Apprentis','🧒','Clique tout seul, 5 fois par seconde.'],
 tree1:['Contremaître','🧑‍💼','Achète tout seul les compétences de l’arbre des pièces.'],
 pres2:['Ascenseur automatique','🛗','Lance la Renaissance tout seul, selon ta condition.'],
 pass2:['Source céleste','⛲','Gagne chaque seconde 10 % des RP en attente.'],
 tree2:['Maître des arbres','🧙','Achète tout seul l’arbre Renaissance.'],
 pres3:['Portail automatique','🌀','Lance l’Ascension toute seule, selon ta condition.'],
 pass3:['Pluie d’étoiles','🌠','Gagne chaque seconde 10 % des AP en attente.'],
 tree3:['Cartographe du vide','🗺️','Achète tout seul l’arbre Ascension.'],
 pres4:['Rituel automatique','🕯️','Lance la Transcendance toute seule, selon ta condition.'],
 pass4:['Fontaine d’éternité','⛲','Gagne chaque seconde 10 % des TP en attente.'],
 tree4:['Grand architecte','📐','Achète tout seul l’arbre Transcendance.'],
 self4:['Cycle éternel','♾️','Lance la Divinité toute seule, selon ta condition.'],
};
function recipeT(t){
  const N=CFG.N[t], list=[]; let fj=0, c=0;
  // positions spéciales (indice principal) : [type, détail]
  const sp={};
  if(t===1){ sp[0]=['keep']; sp[1]=['m',10]; sp[2]=['g',2,1]; sp[3]=['auto','click']; sp[4]=['m',10]; sp[5]=['g',3,1]; sp[6]=['auto','tree']; sp[7]=['m',5]; }
  else { sp[0]=['keep']; sp[1]=['g',10,t-1]; sp[2]=['auto','pres']; sp[3]=['m',10]; sp[4]=['g',3,t]; sp[5]=['auto','pass']; sp[6]=['m',10]; sp[7]=['auto','tree']; sp[8]=t===4?['auto','self']:['g',3,t]; }
  const big={}; big[Math.round(N*0.30)]=['g',1000,t]; big[Math.round(N*0.62)]=['m',1e6,0]; big[Math.round(N*0.82)]=['g',1e6,t];
  for(let i=0;i<N;i++){
    const w=CFG.wt[t][0]+CFG.wt[t][1]*i;
    let e;
    const s=sp[i]||big[i];
    if(i===N-1){
      e=t===4?{n:'Apothéose',ic:'🌟',type:'final',f:1,i:i,w:Math.max(300,w*8)}:{n:'Sommet de '+G.TIERS[t].name,ic:'🏔️',type:'g',gk:t,f:100,i:i,w:w};
      if(t<4) e.n=fillerName(t,fj++)[0]+' ultime';
    } else if(s&&s[0]==='keep'){ e={n:KEEPD[t][0],ic:'🔒',type:'keep',d:KEEPD[t][1],f:1,i:i,w:w}; }
    else if(s&&s[0]==='auto'){ const key=s[1]+(s[1]==='click'?'':(s[1]==='tree'?t:t)); const ad=AUTOD[s[1]==='click'?'click':(s[1]+t)]; e={n:ad[0],ic:ad[1],type:'auto',a:s[1],d:ad[2],f:1,i:i,w:w}; if(s[1]==='click') e.r=5; }
    else {
      let type,f,gk=t,id;
      if(s){ type=s[0]; f=s[1]; gk=s[2]||t; }
      else { const cy=CYC[c%CYC.length]; c++; type=cy[0]; f=cy[1]; gk=(Math.floor(c/10)%3===2&&t>1)?t-1:t; }
      const [nm,ic]=fillerName(t,fj++);
      e={n:nm,ic:ic,type:type,gk:gk,f:f,i:i,w:w};
    }
    list.push(e);
    if(i>0&&i%CFG.branchEvery[t]===CFG.branchEvery[t]-1&&i<N-4&&!(sp[i])){
      const [nm,ic]=fillerName(t,fj++);
      list.push({n:nm+' (voie annexe)',ic:ic,type:'m',f:1.3,branch:true,i:i,w:w});
    }
  }
  return list;
}

/* ---------- bot ---------- */
const TICK=G.TICK;
function makeBot(o){
  let acc=0; const CL=o.clicks, GAP=o.gap;
  return function step(){
    G.tick(TICK);
    if(!G.autoClickRate()){ acc+=CL*TICK; while(acc>=1){G.click();acc-=1;} }
    const S=G.S;
    for(let t=4;t>=1;t--){
      const auto=(t<4&&G.autoOn('pres',t+1))||(t===4&&G.autoOn('self',4));
      if(!auto&&G.canPrestige(t)&&S.runT[t]>=GAP){ G.prestige(t); break; }
    }
  };
}
module.exports={CFG,makeBot,recipe0,recipeT,TIERS:G.TIERS};

if(require.main===module){
  const sig=(x,d)=>Number(x.toPrecision(d));
  const floorSig=(c,d)=>{ if(c<Math.pow(10,d)) return Math.floor(c); const e=Math.floor(Math.log10(c))-d+1, p=Math.pow(10,e); return Math.floor(c/p)*p; };
  // 1. squelette
  const recs=[recipe0(),recipeT(1),recipeT(2),recipeT(3),recipeT(4)];
  const data={seuil:[0,1e300,1e300,1e300,1e300],base:[0,CFG.baseGain,CFG.baseGain,CFG.baseGain,CFG.baseGain],trees:recs.map(list=>list.map(e=>{
    const d={n:e.n,ic:e.ic,c:1e300,f:{}};
    if(e.type==='keep') d.h=1; if(e.type==='auto'){ d.a=e.a; if(e.r) d.r=e.r; } if(e.type==='final') d.e=1; if(e.branch) d.b=1; if(e.d) d.d=e.d;
    return d; })) };
  G.init(data);
  const bot=makeBot(CFG);
  const log=[]; const T0={}; const TIMES=[];  // instants de fin d'arbre
  let time=0;
  const run=()=>{ bot(); time+=TICK; };
  const sigfig=(x,d)=>Number(x.toPrecision(d));
  for(let t=0;t<=4;t++){
    const list=recs[t];
    if(t>0){
      // seuil du palier t = total gagné pendant la phase précédente
      const prev=recs[t-1].map((e,k)=>G.NODE((t-1)+'.'+k).cost).reduce((a,b)=>a+b,0);
      const S=t===1?G.S.earn[0]:prev*0.97;
      G.setSeuil(t,sig(S,2)); log.push('seuil '+t+' = '+G.fmt(sig(S,2)));
    }
    for(let k=0;k<list.length;k++){
      const e=list[k], n=G.NODE(t+'.'+k);
      // effet
      const inc=()=>G.cps()+(G.autoClickRate()||CFG.clicks)*G.clickValue();
      const A=G.A;
      const fx={};
      if(t===0){
        const i0=inc(), CL=CFG.clicks, f=e.f;
        if(e.type==='p'){ fx.p=sig(Math.max(0.1,(f-1)*i0/A.mul),2); }
        else if(e.type==='m'){ fx.m=f; }
        else if(e.type==='c'){ fx.c=Math.max(1,Math.round(((f-1)*i0)/(CL*A.k*A.mul))); }
        else if(e.type==='k'){ fx.k=Math.min(6,Math.max(2,Math.round(1+((f-1)*i0)/(CL*(1+A.c)*A.k*A.mul)))); }
        else if(e.type==='q'){ fx.q=sig(Math.max(0.01,Math.min(0.5,((f-1)*i0)/(CL*Math.max(G.cps(),1e-9)))),2); }
      } else {
        if(e.type==='m'){ fx.m=e.f; }
        else if(e.type==='g'){ fx['g'+e.gk]=e.f; }
      }
      n.fx=fx;
      // coût par sonde
      const snap=G.getState(); const r0=G.S.res[t]; let tt=0;
      for(;;){ run(); tt+=TICK; if(tt>=e.w&&G.S.res[t]>r0+1e-9) break; if(tt>40000){ throw new Error('sonde trop longue '+t+'.'+k); } }
      let cost=Math.max(1,floorSig(G.S.res[t],3));
      G.setState(snap); time-=tt;
      G.setCost(n.id,cost);
      // avancer réellement jusqu'à l'achat
      let guard=0;
      while(G.S.res[t]<cost){ run(); if(++guard>400000) throw new Error('achat impossible '+n.id); }
      G.buyNode(n.id); G.popEvents(); TIMES.push([t,k,e.w,time,cost]);
      data.trees[t][k].c=cost; data.trees[t][k].f=fx;
      if(e.type==='final'){ log.push('FIN '+(time/60).toFixed(1)+' min'); }
    }
    T0[t]=time; log.push('arbre '+t+' terminé à '+(time/60).toFixed(1)+' min ('+list.length+' nœuds, dernier coût '+G.fmt(data.trees[t][list.length-1].c)+')');
    console.log(log[log.length-1]);
  }
  fs.writeFileSync(path.join(__dirname,'timing.json'),JSON.stringify(TIMES));
  data.seuil=[0,1,2,3,4].map(t=>t?G.SEUIL[t]:0);
  const out='/* généré par gen.js : arbres et coûts calibrés */\nconst DATA='+JSON.stringify(data)+';\nif(typeof module!==\'undefined\'&&module.exports) module.exports=DATA;\n';
  fs.writeFileSync(path.join(__dirname,'data.js'),out);
  console.log(log.join('\n'));
  console.log('data.js',(out.length/1024).toFixed(0),'Ko');
}
