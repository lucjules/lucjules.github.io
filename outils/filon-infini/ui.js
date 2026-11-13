(function(){
'use strict';
const fmt=G.fmt, TIERS=G.TIERS;
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.prototype.slice.call((r||document).querySelectorAll(s));
const SV=()=>G.S;
const UI={sig:{},fresh:{},sec:{},manual:false,lastToast:{},savedFlash:0,wipeArmed:0,mi:{}};
const FRESH_MS=9000, KEEP_OWNED=7;
const TCOL=t=>'var(--c'+t+')';
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function setText(el,t){ if(el&&el._t!==t){el._t=t;el.textContent=t;} }
function setCls(el,c,on){ if(el&&el.classList.contains(c)!==!!on) el.classList.toggle(c,!!on); }
function isFresh(id){ return UI.fresh[id]&&UI.fresh[id]>Date.now(); }
function markFresh(id){ UI.fresh[id]=Date.now()+FRESH_MS; }
function uiState(){ const s=SV(); if(!s.ui) s.ui={}; if(!s.ui.shut) s.ui.shut={}; if(!s.ui.all) s.ui.all={}; return s.ui; }

/* ---------- notifications ---------- */
function toast(title,sub,icon,tier){
  const box=$('#toasts'); if(!box) return;
  const el=document.createElement('div'); el.className='toast'; el.style.setProperty('--tc',TCOL(tier||0));
  el.innerHTML='<span class="ti">'+(icon||'✨')+'</span><span><b>'+esc(title)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</span>';
  box.appendChild(el); while(box.children.length>3) box.removeChild(box.firstChild);
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); },3700);
}
function handleEvents(){
  for(const e of G.popEvents()){
    if(e.kind==='found'){
      for(const it of e.items) markFresh(it.id);
      const tiers=e.items.filter(i=>i.kind==='tier'), others=e.items.filter(i=>i.kind==='node');
      for(const t of tiers){ const ti=TIERS.findIndex(x=>x.name===t.label); toast('Nouveau palier découvert !',t.label,TIERS[ti].icon,ti); }
      if(others.length&&!tiers.length){
        const n0=G.NODE(others[0].id);
        toast('Nouvelle amélioration découverte !',others.slice(0,2).map(i=>i.label).join(', ')+(others.length>2?' +'+(others.length-2):''),'🔍',n0.t);
      }
    } else if(e.kind==='goal'){ toast('Objectif accompli !',e.txt,'🎯',0); }
    else if(e.kind==='restore'){ toast('Arbre récupéré','Le nœud « garder » te rend ce que tu avais perdu','🔒',0); }
    else if(e.kind==='prestige'){
      const now=Date.now();
      if(UI.manual||SV().n[e.t]===1||now-(UI.lastToast[e.t]||0)>20000){ toast(TIERS[e.t].name+' !','+'+fmt(e.gain)+' '+TIERS[e.t].cur,TIERS[e.t].icon,e.t); UI.lastToast[e.t]=now; }
      UI.manual=false;
    } else if(e.kind==='win'){ showWin(); }
  }
}

/* ---------- ressources ---------- */
function buildRes(){
  const s=SV(), list=[0,1,2,3,4].filter(t=>t===0||s.disc['T'+t]), key=list.join();
  if(UI.sig.res===key) return; UI.sig.res=key;
  const box=$('#res'); box.innerHTML=''; UI.res={};
  for(const t of list){
    const el=document.createElement('div'); el.className='chip'; el.style.setProperty('--tc',TCOL(t));
    el.innerHTML='<span class="ico">'+TIERS[t].icon+'</span><span><b class="mono v"></b><small class="mono r"></small></span>';
    box.appendChild(el); UI.res[t]={v:$('.v',el),r:$('.r',el)};
  }
}
function updateRes(){
  const s=SV();
  for(const k in UI.res){
    const t=+k, r=UI.res[t];
    if(t===0){ setText(r.v,fmt(s.res[0])); setText(r.r,'+'+fmt(G.cps())+' /s'); }
    else{
      setText(r.v,fmt(s.res[t])+' '+TIERS[t].cur);
      const p=G.pending(t);
      if(p>0){ r.r.innerHTML='<span class="pend">+'+fmt(p)+'</span> en attente'; r._p=1; }
      else if(r._p||!r.r._t){ r._p=0; setText(r.r,'gagné : '+fmt(s.tot[t])); }
    }
  }
}
function updateGoal(){
  const s=SV(), gi=G.goalInfo(), box=$('#goal');
  if(!gi){ box.classList.add('done'); setText($('.gt',box),'Tous les objectifs sont accomplis'); setText($('.gn span:first-child',box),''); setText($('.gn span:last-child',box),''); $('.bar i',box).style.width='100%'; return; }
  setText($('.gt',box),gi.g.txt);
  $('.bar i',box).style.width=(gi.frac*100).toFixed(1)+'%';
  setText($('.gn span:first-child',box),fmt(gi.cur)+' / '+fmt(gi.g.v));
  setText($('.gn span:last-child',box),(gi.frac*100).toFixed(gi.frac<0.1?1:0)+' %');
  setText($('.gl span:last-child',box),s.goal+' accompli'+(s.goal>1?'s':''));
}

/* ---------- sections ---------- */
function secList(){ const s=SV(), l=[0]; for(let t=1;t<=4;t++) if(s.disc['T'+t]) l.push(t); return l; }
function ensureSections(){
  const list=secList(), key=list.join(), host=$('#sections');
  if(UI.sig.secs===key) return; UI.sig.secs=key;
  for(const t of list){
    if(UI.sec[t]) continue;
    const el=document.createElement('section'); el.className='sec'+(isFresh('T'+t)?' fresh':''); el.style.setProperty('--tc',TCOL(t));
    el.innerHTML='<button class="sec-head" data-act="sec" data-t="'+t+'" aria-expanded="true"><span class="ico">'+TIERS[t].icon+'</span><span class="st"><b>'+(t===0?'Arbre des pièces':TIERS[t].name)+'</b><small class="cnt"></small></span><i class="dot"></i><span class="cur mono"></span><span class="chev">▾</span></button><div class="sec-body"></div>';
    host.appendChild(el);
    UI.sec[t]={el:el,body:$('.sec-body',el),cnt:$('.cnt',el),cur:$('.cur',el),head:$('.sec-head',el),sig:null};
  }
}
function sigSec(t){
  const s=SV(), u=uiState(); let k=(u.shut[t]?'S':'O')+(u.all[t]?'A':'a');
  for(const n of G.visibleNodes(t)) k+=n.id+(s.nodes[n.id]?'o':'')+(s.nodes[n.id]&&n.a&&s.auto[n.id]===false?'x':'')+(isFresh(n.id)?'f':'');
  return k;
}
function autoLabel(n){
  const low=TIERS[n.t-1];
  return ({click:'Auto-clic',tree:'Auto-achat de l’arbre '+(n.t===1?'des pièces':low.name),pres:'Auto-'+low.name,pass:'Gain passif de '+(low?low.cur:'')+' (10 %/s)',self:'Auto-'+TIERS[n.t].name})[n.a]||n.n;
}
function resetNote(t){
  const names=[]; for(let k=0;k<t;k++) names.push(k===0?'pièces':TIERS[k].cur);
  return 'Remet à zéro : '+names.join(', ')+' et les arbres inférieurs, sauf ce que tes nœuds 🔒 gardent (et ils te rendent aussitôt ce que tu viens de perdre).';
}
function mainIndex(n){ if(UI.mi[n.id]===undefined){ let c=0; for(const m of G.TREE[n.t]){ if(m.id===n.id) break; if(!m.branch) c++; } UI.mi[n.id]=c; } return UI.mi[n.id]; }
function nodeHTML(n,s){
  const own=!!s.nodes[n.id], inf=G.nodeInfo(n);
  let sgn=Math.sin(mainIndex(n)*0.78);
  if(n.branch){ const p=G.NODE(n.par); sgn=Math.sin(mainIndex(p)*0.78)>=0?-0.95:0.95; }
  const tag=n.final?'<span class="ntag">★ Final</span>':n.keep?'<span class="ntag">🔒 Garde</span>':n.a?'<span class="ntag">⚙ Automatisation</span>':n.branch?'<span class="ntag">Voie annexe</span>':'';
  const cur=n.t===0?'pièces':TIERS[n.t].cur;
  return '<button class="n'+(own?' own':'')+(inf.can?' can':'')+(inf.locked&&!own?' lock':'')+(n.final?' final':'')+(isFresh(n.id)?' fresh':'')+'" style="--s:'+sgn.toFixed(3)+';--tc:'+TCOL(n.t)+'" data-act="buy" data-id="'+n.id+'" id="nd-'+n.id+'">'+
    '<span class="nico">'+n.ic+'</span><span class="nname">'+esc(n.n)+'</span>'+(tag&&!own?tag:'')+'<span class="ndesc">'+esc(G.describe(n))+'</span><span class="ncost mono" data-cost="'+n.cost+'">'+fmt(n.cost)+' '+cur+'</span></button>';
}
function buildSec(t){
  const s=SV(), u=uiState(), rec=UI.sec[t], shut=!!u.shut[t];
  setCls(rec.el,'shut',shut); rec.head.setAttribute('aria-expanded',String(!shut));
  if(shut){ rec.body.innerHTML=''; return; }
  let h='';
  if(t>0){
    const T=TIERS[t];
    h+='<div class="pcard" data-t="'+t+'"><div class="pc-formula">Gain = ⌊ √( '+T.earnLabel+' ÷ <span class="mono">'+fmt(G.SEUIL[t])+'</span> ) × multiplicateurs ⌋<span class="f2 mono"></span></div>'+
      '<div><div class="bar" style="--tc:'+TCOL(t)+'"><i></i></div><div class="pc-sub mono"><span class="s1"></span><span class="s2"></span></div></div>'+
      '<button class="pbtn" data-act="prestige" data-t="'+t+'"><span class="pb-main">'+T.name+'</span><span class="pb-gain mono"></span><span class="pb-f mono"></span></button>'+
      '<div class="pc-note">'+esc(resetNote(t))+'</div></div>';
    const lowerAuto=t<4?G.TREE[t+1].filter(n=>n.a==='pres'&&s.nodes[n.id]):[];
    const own=G.TREE[t].filter(n=>n.a&&s.nodes[n.id]);
    const list=own.concat(lowerAuto);
    if(list.length){
      h+='<div class="autos" style="--tc:'+TCOL(t)+'"><h3>⚙ Automatisations</h3>';
      for(const n of list){
        const on=s.auto[n.id]!==false, target=n.a==='pres'?n.t-1:(n.a==='self'?n.t:-1);
        h+='<button class="tog'+(on?' on':'')+'" data-act="toggle" data-id="'+n.id+'"><span class="sw"></span><span>'+esc(autoLabel(n))+'</span><small>'+(on?'ACTIF':'PAUSE')+'</small></button>';
        if(target>=1) h+='<div class="thr"><span>Dès que le gain en attente ≥</span><span class="st"><button data-act="thr" data-t="'+target+'" data-d="-3" aria-label="Seuil beaucoup plus bas">«</button><button data-act="thr" data-t="'+target+'" data-d="-1" aria-label="Seuil plus bas">‹</button><b class="mono thrv" data-t="'+target+'"></b><button data-act="thr" data-t="'+target+'" data-d="1" aria-label="Seuil plus haut">›</button><button data-act="thr" data-t="'+target+'" data-d="3" aria-label="Seuil beaucoup plus haut">»</button></span><span>'+TIERS[target].cur+'</span></div>';
      }
      h+='</div>';
    }
  }
  const vis=G.visibleNodes(t), ownedAll=vis.filter(n=>s.nodes[n.id]);
  h+='<div class="tbar"><small>'+G.ownedCount(t)+' compétence'+(G.ownedCount(t)>1?'s':'')+' acquise'+(G.ownedCount(t)>1?'s':'')+'</small><button class="mini buyall" data-act="buyall" data-t="'+t+'" style="--tc:'+TCOL(t)+'">Tout acheter</button></div>';
  h+='<div class="tree" style="--tc:'+TCOL(t)+'"><svg aria-hidden="true"></svg>';
  // les nœuds achetés anciens sont repliés ; on garde les derniers, plus ce qui reste à acheter
  const ownedMain=ownedAll.filter(n=>!n.branch);
  const cut=ownedMain.length>KEEP_OWNED?ownedMain[ownedMain.length-KEEP_OWNED].k:-1;
  const hidden=u.all[t]?0:ownedAll.filter(n=>n.k<cut).length;
  if(hidden>0||(u.all[t]&&ownedMain.length>KEEP_OWNED)) h+='<button class="more" data-act="more" data-t="'+t+'">'+(u.all[t]?'▴ Replier les anciennes compétences':'▾ Afficher les '+hidden+' compétences précédentes')+'</button>';
  for(const n of vis){ if(!u.all[t]&&s.nodes[n.id]&&n.k<cut) continue; h+=nodeHTML(n,s); }
  h+='</div>';
  rec.body.innerHTML=h;
  fitTrees(); requestAnimationFrame(drawLines);
}
function fitTrees(){
  $$('.tree').forEach(function(tr){ const w=tr.clientWidth, cw=Math.min(330,w-8); tr.style.setProperty('--amp',Math.max(0,(w-cw)/2-4)+'px'); });
}
function drawLines(){
  const s=SV();
  for(const k in UI.sec){
    const t=+k, rec=UI.sec[t], tree=$('.tree',rec.body); if(!tree) continue;
    const svg=$('svg',tree), box=tree.getBoundingClientRect(); let h='';
    for(const n of G.visibleNodes(t)){
      if(!n.par) continue;
      const c=document.getElementById('nd-'+n.id), p=document.getElementById('nd-'+n.par); if(!c||!p) continue;
      const a=p.getBoundingClientRect(), b=c.getBoundingClientRect();
      const x1=a.left+a.width/2-box.left, y1=a.bottom-box.top-1, x2=b.left+b.width/2-box.left, y2=b.top-box.top+1, m=Math.max(14,(y2-y1)*0.5);
      const cls='ln'+(s.nodes[n.par]?(s.nodes[n.id]?' own':' act'):'');
      h+='<path class="'+cls+'" d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' C'+x1.toFixed(1)+' '+(y1+m).toFixed(1)+' '+x2.toFixed(1)+' '+(y2-m).toFixed(1)+' '+x2.toFixed(1)+' '+y2.toFixed(1)+'"/>';
    }
    svg.innerHTML=h;
  }
}
function updateSec(t){
  const s=SV(), rec=UI.sec[t], u=uiState();
  setText(rec.cur,t===0?'':fmt(s.res[t])+' '+TIERS[t].cur);
  setText(rec.cnt,G.ownedCount(t)+' compétence'+(G.ownedCount(t)>1?'s':'')+(t>0&&s.n[t]?' · '+fmt(s.n[t])+' prestige'+(s.n[t]>1?'s':''):''));
  let has=G.visibleNodes(t).some(n=>G.nodeInfo(n).can)||(t>0&&G.canPrestige(t));
  setCls(rec.el,'has',has&&!!u.shut[t]);
  if(u.shut[t]) return;
  const T=TIERS[t], body=rec.body;
  $$('.n',body).forEach(function(el){
    const n=G.NODE(el.dataset.id), inf=G.nodeInfo(n);
    setCls(el,'can',inf.can); setCls(el,'lock',inf.locked&&!inf.owned);
  });
  const ba=$('.buyall',body); if(ba) setCls(ba,'on',G.visibleNodes(t).some(n=>G.nodeInfo(n).can));
  if(t===0) return;
  const card=$('.pcard',body); if(!card) return;
  const e=s.earn[t-1], seuil=G.SEUIL[t], m=G.A.gain[t], g=G.pending(t), can=G.canPrestige(t);
  setText($('.f2',card),'⌊ √( '+fmt(e)+' ÷ '+fmt(seuil)+' ) × '+fmt(m)+' ⌋ = '+fmt(g));
  const bar=$('.bar i',card);
  if(e<seuil){ bar.style.width=(e/seuil*100).toFixed(1)+'%'; setText($('.s1',card),fmt(e)+' / '+fmt(seuil)); setText($('.s2',card),(e/seuil*100).toFixed(1)+' %'); }
  else{
    const lo=seuil*Math.pow(g/m,2), hi=G.nextAt(t);
    bar.style.width=Math.max(0,Math.min(100,(e-lo)/(hi-lo)*100)).toFixed(1)+'%';
    setText($('.s1',card),'Prochain +1 '+T.cur+' à '+fmt(hi)); setText($('.s2',card),'reste '+fmt(Math.max(0,hi-e)));
  }
  const btn=$('.pbtn',card); setCls(btn,'off',!can); setCls(btn,'ready',can);
  setText($('.pb-gain',btn),can?'+'+fmt(g)+' '+T.cur:(e<seuil?(e/seuil*100).toFixed(0)+' %':'—'));
  setText($('.pb-main',btn),can?T.name:'Objectif : '+fmt(seuil)+' '+T.earnLabel.split(' ')[0]);
  setText($('.pb-f',btn),'⌊ √( '+fmt(e)+' ÷ '+fmt(seuil)+' ) × '+fmt(m)+' ⌋ = '+fmt(g)+' '+T.cur);
  $$('.thrv',body).forEach(function(el){ setText(el,fmt(G.thrValue(+el.dataset.t))); });
}

/* ---------- chaîne d'automatisation ---------- */
function chipLabel(n){
  if(n.keep) return n.t===1?'Garde l’arbre des pièces':'Garde l’arbre '+TIERS[n.t-1].name;
  const low=TIERS[n.t-1];
  return ({click:'Auto-clic',tree:'Auto-achat de l’arbre',pres:'Auto-'+low.name,pass:low.cur+' passifs',self:'Auto-'+TIERS[n.t].name})[n.a];
}
function renderChain(){
  const s=SV(); let sig='';
  for(let t=0;t<5;t++) sig+=(t===0||s.disc['T'+t]?'1':'0');
  for(const n of G.NODES) if((n.a||n.keep)&&s.disc[n.id]) sig+=n.id+(s.nodes[n.id]?(n.a&&s.auto[n.id]===false?'x':'o'):'-');
  if(UI.sig.chain===sig) return; UI.sig.chain=sig;
  const shown=[0,1,2,3,4].filter(t=>t===0||s.disc['T'+t]); let h='', any=false;
  shown.forEach(function(t,idx){
    const nodes=G.NODES.filter(n=>n.t===t+1&&(n.a||n.keep)&&n.a!=='self'&&s.disc[n.id]);
    const self=t===4?G.NODES.filter(n=>n.t===4&&n.a==='self'&&s.disc[n.id]):[];
    const all=nodes.concat(self); let lit=false;
    h+='<div class="cbox" style="--tc:'+TCOL(t)+'"><div class="cnode"><span>'+TIERS[t].icon+'</span><span>'+TIERS[t].name+'</span></div>';
    if(all.length){
      h+='<div class="cchips"><small>'+(t<4?'géré par '+TIERS[t+1].name:'')+'</small>';
      for(const n of all){
        const own=!!s.nodes[n.id], on=own&&(!n.a||s.auto[n.id]!==false); if(on) lit=true; if(own) any=true;
        h+='<button class="cchip'+(own?' own':'')+(own&&!on?' off':'')+(own&&n.a?' tg':'')+'" '+(own&&n.a?'data-act="toggle" data-id="'+n.id+'" title="Activer / désactiver"':'tabindex="-1"')+'>'+(n.keep?'🔒':'⚙')+' '+esc(chipLabel(n))+'</button>';
      }
      h+='</div>';
    }
    h+='</div>';
    if(idx<shown.length-1) h+='<div class="carrow'+(lit?' lit':'')+'">➜</div>';
  });
  $('#chain').innerHTML=h; $('#chainnone').hidden=any;
}

/* ---------- victoire ---------- */
function showWin(){
  const s=SV();
  $('#winstats').innerHTML='<div>Temps de jeu<b class="mono">'+G.fmtTime(s.endAt)+'</b></div><div>Clics<b class="mono">'+fmt(s.clicks)+'</b></div>'+
    '<div>Renaissances<b class="mono">'+fmt(s.n[1])+'</b></div><div>Ascensions<b class="mono">'+fmt(s.n[2])+'</b></div>'+
    '<div>Transcendances<b class="mono">'+fmt(s.n[3])+'</b></div><div>Divinités<b class="mono">'+fmt(s.n[4])+'</b></div>';
  $('#win').hidden=false;
}

/* ---------- actions ---------- */
function floatText(x,y,txt){
  const fx=$('#fx'); if(!fx) return; if(fx.children.length>12) fx.removeChild(fx.firstChild);
  const el=document.createElement('span'); el.className='fl'; el.textContent=txt;
  const r=fx.getBoundingClientRect();
  el.style.left=Math.max(30,Math.min(r.width-30,x-r.left))+'px'; el.style.top=Math.max(20,Math.min(r.height-10,y-r.top))+'px';
  fx.appendChild(el); setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); },950);
}
function doClick(x,y){
  const v=G.click(); floatText(x,y,'+'+fmt(v));
  const ore=$('#ore'); ore.classList.add('hit'); clearTimeout(UI.hitT); UI.hitT=setTimeout(function(){ore.classList.remove('hit');},70);
}
function onAct(el){
  const a=el.dataset.act, s=SV(), u=uiState();
  if(a==='buy'){ G.buyNode(el.dataset.id); }
  else if(a==='buyall'){ G.buyAll(+el.dataset.t); }
  else if(a==='prestige'){ UI.manual=true; if(!G.prestige(+el.dataset.t)) UI.manual=false; UI.sig.secBody={}; }
  else if(a==='toggle'){ G.toggleAuto(el.dataset.id); UI.sig.chain=null; }
  else if(a==='thr'){ const t=+el.dataset.t; G.setThr(t,s.thr[t]+(+el.dataset.d)); }
  else if(a==='sec'){ const t=+el.dataset.t; u.shut[t]=!u.shut[t]; }
  else if(a==='more'){ const t=+el.dataset.t; u.all[t]=!u.all[t]; }
  else if(a==='save'){ doSave(true); }
  else if(a==='wipe'){ onWipe(); }
  else if(a==='closewin'){ $('#win').hidden=true; }
  refresh();
}
function doSave(manual){ const ok=G.save(); UI.savedFlash=Date.now()+2200; if(manual) toast(ok?'Partie sauvegardée':'Sauvegarde impossible',ok?'Dans ce navigateur':'Le stockage local est bloqué','💾',0); }
function onWipe(){
  const b=$('#wipe');
  if(!UI.wipeArmed||Date.now()>UI.wipeArmed){ UI.wipeArmed=Date.now()+4000; b.classList.add('armed'); b.textContent='Sûr ? Clique encore'; clearTimeout(UI.wipeT); UI.wipeT=setTimeout(disarm,4000); return; }
  disarm(); G.wipe(); UI.sig={}; UI.fresh={}; UI.sec={}; UI.mi={}; $('#sections').innerHTML=''; $('#toasts').innerHTML=''; $('#win').hidden=true;
  toast('Partie effacée','Tout repart de zéro','🗑️',0);
}
function disarm(){ const b=$('#wipe'); UI.wipeArmed=0; b.classList.remove('armed'); b.textContent='Tout effacer'; }

/* ---------- boucle ---------- */
function refresh(){
  buildRes(); ensureSections();
  UI.sig.secBody=UI.sig.secBody||{};
  for(const t of secList()){
    const sg=sigSec(t);
    if(UI.sig.secBody[t]!==sg){ UI.sig.secBody[t]=sg; buildSec(t); }
    updateSec(t);
  }
  renderChain(); updateRes(); updateGoal();
  setText($('#savestate'),UI.savedFlash>Date.now()?'sauvegardé':'');
  setText($('#clickval'),fmt(G.clickValue())); setText($('#psec'),fmt(G.cps()));
  $('#endbanner').hidden=!SV().ended;
}
function cleanFresh(){
  const now=Date.now(); let any=false;
  for(const k in UI.fresh) if(UI.fresh[k]<=now){ delete UI.fresh[k]; any=true; }
  if(any){ $$('.fresh').forEach(function(e){ e.classList.remove('fresh'); }); UI.sig.secBody={}; }
}
function init(){
  G.init(DATA);
  const had=G.load(), s=SV();
  if(had){
    const away=(Date.now()-s.saved)/1000;
    if(away>30){ const tb=s.tot[0]; G.catchUp(away); G.popEvents(); toast('Bon retour !','Absent '+G.fmtTime(Math.min(away,3*3600))+(away>3*3600?' (limité à 3 h)':'')+' · +'+fmt(SV().tot[0]-tb)+' pièces','👋',0); }
  }
  uiState(); refresh();
  document.addEventListener('click',function(ev){
    const el=ev.target.closest&&ev.target.closest('[data-act]'); if(!el) return;
    if(el.id==='ore'){ if(ev.detail===0){ const r=el.getBoundingClientRect(); doClick(r.left+r.width/2,r.top+r.height/2); refresh(); } return; }
    onAct(el);
  });
  const ore=$('#ore');
  ore.addEventListener('pointerdown',function(ev){ ev.preventDefault(); doClick(ev.clientX,ev.clientY); });
  ore.addEventListener('contextmenu',function(ev){ ev.preventDefault(); });
  window.addEventListener('resize',function(){ fitTrees(); drawLines(); });
  document.addEventListener('visibilitychange',function(){ if(document.hidden) G.save(); });
  window.addEventListener('pagehide',function(){ G.save(); });
  let last=performance.now(), acc=0;
  setInterval(function(){
    const now=performance.now(); let dt=(now-last)/1000; last=now;
    if(dt>3){ G.catchUp(dt); G.popEvents(); } else G.advance(dt);
    handleEvents(); refresh(); cleanFresh();
    acc+=dt; if(acc>12){ acc=0; doSave(false); }
  },100);
  window.__jeu=G;
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
