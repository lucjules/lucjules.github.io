// Validation : joue la version finale (data.js) avec un joueur de style réglable.
const G=require('./core.js'), DATA=require('./data.js');
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const [k,v]=a.split('=');return [k,v===undefined?true:+v];}));
const CL=args.clicks!==undefined?args.clicks:2, GAP=args.gap||8, REACT=args.react||3, MAXH=args.maxh||10;
G.init(JSON.parse(JSON.stringify(DATA)));
function snap(n){ const o=JSON.parse(G.getState()); o.saved=Date.now(); require('fs').writeFileSync('/tmp/snap_'+n+'.json',JSON.stringify(o)); }
const TICK=G.TICK; let T=0, acc=0, ra=0; const done={}; const S=()=>G.S;
function buy(){ for(let t=0;t<=4;t++){ if(t>0&&!S().disc['T'+t]) continue; for(const n of G.TREE[t]){ if(!G.nodeVisible(n)||S().nodes[n.id]) continue; if(G.nodeInfo(n).can){ G.buyNode(n.id); } } } }
while(T<MAXH*3600&&!S().ended){
  G.tick(TICK); T+=TICK; G.popEvents();
  if(!G.autoClickRate()){ acc+=CL*TICK; while(acc>=1){G.click();acc-=1;} }
  ra+=TICK; if(ra>=REACT){ ra=0; buy();
    for(let t=4;t>=1;t--){ const auto=(t<4&&G.autoOn('pres',t+1))||(t===4&&G.autoOn('self',4)); if(!auto&&G.canPrestige(t)&&S().runT[t]>=GAP){ G.prestige(t); break; } } }
  if(args.snap){ if(T>=240&&!global.s0){global.s0=1;snap('early');} for(let t=0;t<=4;t++){ if(G.ownedCount(t)>=Math.floor(G.TREE[t].length/2)&&!global['h'+t]){global['h'+t]=1;snap('h'+t);} } if(S().ended) snap('end'); }
  for(let t=0;t<=4;t++){ if(done[t]===undefined&&G.ownedCount(t)===G.TREE[t].filter(n=>!n.branch).length) done[t]=T; }
  if(args.rep&&Math.abs(T%args.rep)<TICK/2) console.log((T/60).toFixed(0)+'m',[0,1,2,3,4].map(t=>G.ownedCount(t)).join('/'),'P',G.fmt(G.cps()));
}
const f=[0,1,2,3,4].map(t=>done[t]===undefined?'—':(done[t]/60).toFixed(0)+'m');
console.log('arbres terminés :',f.join(' | '),'| fin du jeu :',S().ended?(S().endAt/60).toFixed(0)+'m ('+(S().endAt/3600).toFixed(1)+' h)':'NON ('+MAXH+'h)');
