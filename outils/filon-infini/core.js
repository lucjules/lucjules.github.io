/* Filon Infini · moteur du jeu (sans interface). Les arbres viennent de DATA (calibrés par simulation). */
const G=(function(){
'use strict';
const KEY='filon-infini-v2';
const TICK=0.25;                 // pas de temps fixe (identique en simulation et en jeu)
const REVEAL=0.5, PASSIVE=0.1;
const OFFLINE_MAX=3*3600;

/* ---------- formatage ---------- */
const SUF=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','Ud','Dd','Td','Qad','Qid','Sxd','Spd','Ocd','Nod','Vg'];
function fmt(n){
  if(n===Infinity) return '∞';
  if(!(n>0)) return n<0?'-'+fmt(-n):'0';
  if(n<1000){
    if(n<10) return String(Math.round(n*100)/100);
    if(n<100) return String(Math.round(n*10)/10);
    return String(Math.floor(n));
  }
  let e=Math.floor(Math.log10(n)/3), m=n/Math.pow(10,e*3);
  if(m>=999.5){m/=1000;e++;}
  if(e>=SUF.length) return n.toExponential(2).replace('e+','e').replace(/\.?0+e/,'e');
  let s=m<10?m.toFixed(2):m<100?m.toFixed(1):m.toFixed(0);
  if(s.indexOf('.')>=0) s=s.replace(/\.?0+$/,'');
  return s+SUF[e];
}
function fmtTime(s){
  s=Math.max(0,Math.floor(s));
  const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60;
  if(h>0) return h+'h '+String(m).padStart(2,'0')+'m';
  if(m>0) return m+'m '+String(x).padStart(2,'0')+'s';
  return x+'s';
}

/* ---------- paliers ---------- */
const TIERS=[
  {key:'pieces',name:'Pièces',cur:'pièces',css:'c0',icon:'🪙'},
  {key:'ren',name:'Renaissance',cur:'RP',css:'c1',icon:'🌱',earnLabel:'pièces gagnées'},
  {key:'asc',name:'Ascension',cur:'AP',css:'c2',icon:'🚀',earnLabel:'RP gagnés'},
  {key:'tra',name:'Transcendance',cur:'TP',css:'c3',icon:'🌌',earnLabel:'AP gagnés'},
  {key:'div',name:'Divinité',cur:'DP',css:'c4',icon:'👑',earnLabel:'TP gagnés'},
];
const THR=[]; for(let e=0;e<=60;e++){[1,2,5].forEach(m=>THR.push(m*Math.pow(10,e)));}
function thrIndex(v){ for(let i=0;i<THR.length;i++) if(THR[i]>=v) return i; return THR.length-1; }

/* ---------- données ---------- */
let D=null, NODES=[], NODE={}, TREE=[[],[],[],[],[]], KEEP=[null,null,null,null,null], AUTO={}, GOALS=[], SEUIL=[0,1,1,1,1], BASE=[0,1,1,1,1];
let S=null, A=null, EV=[];

function init(data){
  D=data; SEUIL=data.seuil.slice(); BASE=data.base.slice();
  NODES=[]; NODE={}; TREE=[[],[],[],[],[]]; KEEP=[null,null,null,null,null]; AUTO={};
  data.trees.forEach(function(list,t){
    let lastMain=null;
    list.forEach(function(d,k){
      const n={id:t+'.'+k,t:t,k:k,n:d.n,ic:d.ic,cost:d.c,fx:d.f||{},a:d.a||null,rate:d.r||0,keep:!!d.h,branch:!!d.b,final:!!d.e,desc:d.d||'',par:null};
      n.par=lastMain; if(!n.branch) lastMain=n.id;
      NODES.push(n); NODE[n.id]=n; TREE[t].push(n);
      if(n.keep) KEEP[t]=n.id;
      if(n.a) AUTO[n.a+t]=n;
    });
  });
  buildGoals();
  S=newState(); recalc(); discover(true);
}
function buildGoals(){
  GOALS=[];
  const g=function(kind,t,v,txt){GOALS.push({kind:kind,t:t,v:v,txt:txt});};
  for(let e=3;e<Math.log10(SEUIL[1]);e+=3) g('tot',0,Math.pow(10,e),'Gagne '+fmt(Math.pow(10,e))+' pièces');
  g('earn',0,SEUIL[1],'Gagne '+fmt(SEUIL[1])+' pièces en un seul run');
  for(let t=2;t<=4;t++) g('earn',t-1,SEUIL[t],'Gagne '+fmt(SEUIL[t])+' '+TIERS[t-1].cur+' en un seul run');
}
function newState(){
  return {v:2,res:[0,0,0,0,0],earn:[0,0,0,0,0],tot:[0,0,0,0,0],nodes:{},disc:{},stash:{},goal:0,
    auto:{},thr:[0,0,0,0,0],n:[0,0,0,0,0],last:[0,0,0,0,0],runT:[0,0,0,0,0],
    clicks:0,played:0,ended:false,endAt:0,saved:Date.now(),acc:0,ui:{}};
}

/* ---------- effets ---------- */
function recalc(){
  const a={pass:0,c:0,k:1,q:0,mul:1,gain:BASE.slice()};
  for(const n of NODES){
    if(!S.nodes[n.id]) continue; const f=n.fx;
    if(f.p) a.pass+=f.p; if(f.c) a.c+=f.c; if(f.k) a.k*=f.k; if(f.q) a.q+=f.q; if(f.m) a.mul*=f.m;
    for(let t=1;t<=4;t++) if(f['g'+t]) a.gain[t]*=f['g'+t];
  }
  A=a;
}
function cps(){ return A.pass*A.mul; }
function clickValue(){ return (1+A.c)*A.k*A.mul+A.q*cps(); }
function addCur(k,x){ S.res[k]+=x; S.earn[k]+=x; S.tot[k]+=x; }
function click(){ S.clicks++; const v=clickValue(); addCur(0,v); return v; }

/* ---------- description des effets ---------- */
function describe(n){
  if(n.desc) return n.desc;
  const f=n.fx||{}, o=[];
  if(f.p) o.push('+'+fmt(f.p)+' pièces /s');
  if(f.c) o.push('+'+fmt(f.c)+' par clic');
  if(f.k) o.push('Clic ×'+fmt(f.k));
  if(f.q) o.push('Chaque clic rapporte +'+(Math.round(f.q*1000)/10)+' % de la production /s');
  if(f.m) o.push('Pièces ×'+fmt(f.m));
  for(let t=1;t<=4;t++) if(f['g'+t]) o.push('Gain de '+TIERS[t].cur+' ×'+fmt(f['g'+t]));
  return o.join(' · ');
}
function setSeuil(t,v){ SEUIL[t]=v; buildGoals(); }

/* ---------- nœuds ---------- */
function nodeInfo(n){
  const owned=!!S.nodes[n.id], locked=!!n.par&&!S.nodes[n.par], afford=S.res[n.t]>=n.cost;
  return {owned:owned,locked:locked,afford:afford,can:!owned&&!locked&&afford};
}
function nodeVisible(n){ return !!S.disc[n.id]; }
function visibleNodes(t){ return TREE[t].filter(nodeVisible); }
function ownedCount(t){ let c=0; for(const n of TREE[t]) if(S.nodes[n.id]) c++; return c; }
function buyNode(id){
  const n=NODE[id]; if(!n||!nodeVisible(n)) return false;
  const i=nodeInfo(n); if(!i.can) return false;
  S.res[n.t]-=n.cost; S.nodes[id]=1;
  if(n.a==='pres'||n.a==='self') S.thr[n.a==='self'?n.t:n.t-1]=0;
  if(n.keep) restoreStash();
  recalc();
  if(n.final){S.ended=true;S.endAt=S.played;EV.push({kind:'win'});}
  discover(); return true;
}
function buyAll(t){            // achète en chaîne tout ce qui est abordable dans un arbre
  let c=0;
  for(let g=0;g<400;g++){
    let pick=null;
    for(const n of TREE[t]){ if(!nodeVisible(n)||S.nodes[n.id]) continue; if(!nodeInfo(n).can) continue; if(!pick||n.k<pick.k) pick=n; }
    if(!pick) break; buyNode(pick.id); c++;
  }
  return c;
}

/* ---------- automatisations ---------- */
function autoOwned(type,tier){ const n=AUTO[type+tier]; return !!(n&&S.nodes[n.id]); }
function autoOn(type,tier){ const n=AUTO[type+tier]; return !!(n&&S.nodes[n.id]&&S.auto[n.id]!==false); }
function toggleAuto(id){ if(S.nodes[id]) S.auto[id]=S.auto[id]===false; }
function setThr(t,idx){ S.thr[t]=Math.max(0,Math.min(THR.length-1,idx)); }
function thrValue(t){ return THR[S.thr[t]]; }
function autoClickRate(){ const n=AUTO.click1; return n&&S.nodes[n.id]&&S.auto[n.id]!==false?n.rate:0; }

/* ---------- prestige ---------- */
function rawPending(t){
  const e=S.earn[t-1], s=SEUIL[t]; if(e<s) return 0;
  return Math.sqrt(e/s)*A.gain[t];
}
function pending(t){ return Math.floor(rawPending(t)); }
function canPrestige(t){ return S.earn[t-1]>=SEUIL[t]&&pending(t)>=1; }
function keepTree(k,t){ for(let j=k+1;j<=t;j++) if(!(KEEP[j]&&S.nodes[KEEP[j]])) return false; return true; }
function nextAt(t){ return SEUIL[t]*Math.pow((pending(t)+1)/A.gain[t],2); }
function prestige(t){
  if(!canPrestige(t)) return 0;
  const gain=pending(t), keep=[];
  for(let k=0;k<t;k++) keep[k]=keepTree(k,t);
  addCur(t,gain); S.last[t]=gain; S.n[t]++;
  for(let k=0;k<t;k++){
    S.res[k]=0; S.earn[k]=0; S.runT[k]=0;
    if(keep[k]){ delete S.stash[k]; continue; }
    const ids=[]; for(const n of TREE[k]) if(S.nodes[n.id]){ ids.push(n.id); delete S.nodes[n.id]; }
    if(ids.length) S.stash[k]={ids:ids,t:t};
  }
  S.runT[t]=0; recalc();
  EV.push({kind:'prestige',t:t,gain:gain});
  discover(); return gain;
}
/* Acheter un nœud « garder » rend aussitôt ce qui vient d'être perdu au dernier reset (si la chaîne est complète). */
function restoreStash(){
  let again=true, any=false;
  while(again){
    again=false;
    for(const k in S.stash){
      const e=S.stash[k];
      if(keepTree(+k,e.t)){ for(const id of e.ids) S.nodes[id]=1; delete S.stash[k]; again=true; any=true; }
    }
  }
  if(any){ recalc(); EV.push({kind:'restore'}); }
}

/* ---------- découverte ---------- */
function discover(silent){
  const found=[];
  const add=function(id,kind,label){ if(!S.disc[id]){S.disc[id]=1; if(!silent) found.push({id:id,kind:kind,label:label});} };
  for(let t=1;t<=4;t++) if(!S.disc['T'+t]&&(S.earn[t-1]>=REVEAL*SEUIL[t]||S.tot[t]>0)) add('T'+t,'tier',TIERS[t].name);
  for(const n of NODES){
    if(S.disc[n.id]) continue;
    if(n.t>0&&!S.disc['T'+n.t]) continue;
    if(!n.par||S.nodes[n.par]) add(n.id,'node',n.n);
  }
  if(found.length) EV.push({kind:'found',items:found});
}
function goalInfo(){
  const g=GOALS[S.goal]; if(!g) return null;
  const cur=g.kind==='earn'?S.earn[g.t]:S.tot[g.t];
  return {g:g,cur:cur,frac:Math.max(0,Math.min(1,cur/g.v))};
}
function checkGoals(){
  let g;
  while((g=GOALS[S.goal])){
    const cur=g.kind==='earn'?S.earn[g.t]:S.tot[g.t];
    if(cur<g.v) break; S.goal++; EV.push({kind:'goal',txt:g.txt});
  }
}

/* ---------- boucle ---------- */
function autoBuyTree(t){
  for(let g=0;g<60;g++){
    let pick=null;
    for(const n of TREE[t]){ if(!nodeVisible(n)||S.nodes[n.id]) continue; if(!nodeInfo(n).can) continue; if(!pick||n.cost<pick.cost) pick=n; }
    if(!pick) break; buyNode(pick.id);
  }
}
function tick(dt){
  S.played+=dt; for(let k=0;k<5;k++) S.runT[k]+=dt;
  const c=cps(); if(c>0) addCur(0,c*dt);
  const ac=autoClickRate(); if(ac>0) addCur(0,clickValue()*ac*dt);
  for(let h=2;h<=4;h++) if(autoOn('pass',h)){ const r=rawPending(h-1); if(r>0) addCur(h-1,r*PASSIVE*dt); }
  for(let h=1;h<=4;h++) if(autoOn('tree',h)) autoBuyTree(h-1);
  for(let t=4;t>=1;t--){
    const auto=(t<4&&autoOn('pres',t+1))||(t===4&&autoOn('self',4));
    if(auto&&canPrestige(t)&&pending(t)>=THR[S.thr[t]]) prestige(t);
  }
  discover(); checkGoals();
}
function advance(dt){ S.acc+=dt; let n=0; while(S.acc>=TICK-1e-9&&n<4000){ tick(TICK); S.acc-=TICK; n++; } if(n>=4000) S.acc=0; }
function catchUp(sec){ sec=Math.min(sec,OFFLINE_MAX); const d=sec>1800?1:TICK, n=Math.floor(sec/d); for(let i=0;i<n;i++) tick(d); }

/* ---------- sauvegarde ---------- */
function save(){ try{S.saved=Date.now();S.nt=NODES.length;localStorage.setItem(KEY,JSON.stringify(S));return true;}catch(e){return false;} }
function load(){
  try{
    const raw=localStorage.getItem(KEY); if(!raw) return false;
    const o=JSON.parse(raw), b=newState();
    for(const k in b) if(o[k]!==undefined) b[k]=o[k];
    ['res','earn','tot','n','last','runT','thr'].forEach(k=>{ while(b[k].length<5) b[k].push(0); });
    S=b; recalc(); discover(true); return true;
  }catch(e){return false;}
}
function wipe(){ try{localStorage.removeItem(KEY);}catch(e){} S=newState(); EV=[]; recalc(); discover(true); }
function getState(){ return JSON.stringify(S); }
function setState(j){ S=JSON.parse(j); recalc(); }

return {
  init:init,TIERS:TIERS,THR:THR,
  get S(){return S;}, get A(){return A;}, get NODES(){return NODES;}, get TREE(){return TREE;}, get GOALS(){return GOALS;}, get SEUIL(){return SEUIL;}, get KEEP(){return KEEP;}, get AUTO(){return AUTO;},
  NODE:function(id){return NODE[id];},
  fmt:fmt,fmtTime:fmtTime,thrIndex:thrIndex,describe:describe,setSeuil:setSeuil,
  recalc:recalc,cps:cps,clickValue:clickValue,click:click,addCur:addCur,
  nodeInfo:nodeInfo,nodeVisible:nodeVisible,visibleNodes:visibleNodes,ownedCount:ownedCount,buyNode:buyNode,buyAll:buyAll,
  autoOwned:autoOwned,autoOn:autoOn,toggleAuto:toggleAuto,setThr:setThr,thrValue:thrValue,autoClickRate:autoClickRate,
  rawPending:rawPending,pending:pending,canPrestige:canPrestige,keepTree:keepTree,nextAt:nextAt,prestige:prestige,
  goalInfo:goalInfo,discover:discover,tick:tick,advance:advance,catchUp:catchUp,TICK:TICK,
  popEvents:function(){const e=EV;EV=[];return e;},
  save:save,load:load,wipe:wipe,getState:getState,setState:setState,newState:newState,
  setCost:function(id,c){NODE[id].cost=c;},
};
})();
if(typeof module!=='undefined'&&module.exports) module.exports=G;
