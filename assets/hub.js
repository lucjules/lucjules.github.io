/* Pages d'accueil (générale et par matière) : bouton de thème, barres de progression des cartes [data-prog],
   bouton « Reprendre » et bouton d'installation de l'application. */
(function(){
document.addEventListener('click',function(e){var b=e.target.closest('#theme-btn');if(!b)return;var r=document.documentElement,dark=r.dataset.theme==='dark'||(!r.dataset.theme&&matchMedia('(prefers-color-scheme: dark)').matches),n=dark?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('cours-theme',n)}catch(e){}});
function prog(){var cards=document.querySelectorAll('[data-prog]');cards.forEach(function(c){var keys=c.dataset.prog.split(','),d=0,t=0,any=false;var opened=0;keys.forEach(function(k){try{var v=localStorage.getItem('hub:'+k);if(v){v=JSON.parse(v);d+=v.done;t+=v.total;any=true;opened++}}catch(e){}});
 var bar=c.querySelector('.hmeter i'),txt=c.querySelector('.hprog');if(any&&t){bar.style.width=Math.round(100*d/t)+'%';var u=' exercices réussis',tx=null;if(keys.length===1){try{var w=JSON.parse(localStorage.getItem('hub:'+keys[0]));if(w.unit)u=' '+w.unit;if(w.text)tx=w.text}catch(e){}}else{try{if(JSON.parse(localStorage.getItem('hub:'+keys[0])).unit)u=' cartes sues'}catch(e){}}txt.textContent=tx||(d+' / '+t+u+(opened<keys.length?' (chapitres déjà ouverts)':''))}else{txt.textContent='Pas encore commencé'}})}
window.hubProgress=prog;
// Bouton « Installer l'app » (Chrome, Edge, Android) ; sur iPhone, une astuce pour l'écran d'accueil
var inst=document.getElementById('install-btn'),astuce=document.getElementById('install-ios'),invite=null;
if(inst){window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();invite=e;inst.hidden=false});
 inst.addEventListener('click',function(){if(!invite)return;invite.prompt();invite.userChoice.then(function(){invite=null;inst.hidden=true})});
 window.addEventListener('appinstalled',function(){inst.hidden=true})}
if(astuce&&/iphone|ipad|ipod/i.test(navigator.userAgent)&&!navigator.standalone&&/^https:$/.test(location.protocol))astuce.hidden=false;
// Bouton « Reprendre » : dernière leçon ouverte (notée par common.js), filtrée par matière sur les pages de matière
function reprendre(){var el=document.getElementById('resume');if(!el)return;var r=null;
 try{r=JSON.parse(localStorage.getItem('cours-reprendre'))}catch(e){}
 // seulement un chemin de leçon du site (« algo/cycle1.html#l1 ») : le lien peut venir d'une sauvegarde importée
 var dir=el.dataset.dir||'';if(!r||typeof r.u!=='string'||!/^[\w-]+\/[\w-]+\.html(#[\w-]*)?$/.test(r.u)||r.u.indexOf(dir)!==0){el.hidden=true;return}
 var carte=!dir&&document.querySelector('.grid a.card[href^="'+r.u.split('/')[0]+'/"] h2');
 el.href=(el.dataset.base||'')+r.u;
 el.querySelector('.resume-k').textContent='Reprendre'+(carte?' · '+carte.textContent:'');
 el.querySelector('.resume-t').textContent=r.chap+(r.sec?' › '+r.sec:'');el.hidden=false}
// Jeux : partie en cours ou record, lus dans la sauvegarde de chaque jeu (même adresse, donc même stockage du navigateur).
// Chaque fonction rend [texte, avancement de 0 à 1 ou null] ; la barre .hmeter juste avant le texte est remplie si elle existe.
function lire(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
// grands nombres à la française : « 1,2 million »
function nb(x){x=Math.max(0,+x||0);if(x<1e6)return Math.floor(x).toLocaleString('fr-FR');var u=['million','milliard','billion','billiard','trillion','trilliard'],p=Math.min(u.length-1,Math.floor(Math.log10(x)/3)-2),v=Math.floor(x/Math.pow(10,6+3*p)*10)/10;return v.toLocaleString('fr-FR')+' '+u[p]+(v>=2?'s':'')}
var JEUX={
 aerelia:function(){var n=null;try{n=localStorage.getItem('aerelia_slot')}catch(e){}var g=lire(!n||n==='1'?'aerelia':'aerelia_'+n);
  if(!g||!Array.isArray(g.party)||!g.party.length)return['Aérélia : pas encore commencé',0];
  var b=Math.min(19,Math.max(0,+g.badge||0)),t=Math.max(0,+(g.sx&&g.sx.time)||0),nv=Math.max.apply(null,g.party.map(function(c){return +c.lv||0}));
  return['Aérélia : '+b+' badge'+(b>1?'s':'')+' sur 19 · niveau '+nv+' · '+Math.floor(t/3600)+' h '+String(Math.floor(t/60)%60).padStart(2,'0')+' de jeu',b/19]},
 'voie-libre':function(){var d=lire('voie-libre'),n=d&&Math.floor(+d.parties)>0?Math.floor(+d.parties):0;
  if(!n)return['Voie libre : pas encore joué',null];
  var e=Array.isArray(d.niveaux)?d.niveaux.reduce(function(s,x){return s+Math.min(3,Math.max(0,Math.floor(+x)||0))},0):0;
  return['Voie libre : record '+Math.max(0,Math.floor(+d.record)||0).toLocaleString('fr-FR')+' · ★ '+e+' / 45 · '+n+' course'+(n>1?'s':''),null]},
 'mine-clic':function(){var d=lire('mine-clic'),t=d&&+d.totalAll>0?+d.totalAll:0;
  if(!t)return['Mine Clic : pas encore commencé',0];
  var n=Array.isArray(d.progres)?d.progres.length:0,tot=Math.max(n,Math.floor(+d.nbProgres)||108),e=Math.floor(+d.etoiles)||0;
  return['Mine Clic : '+nb(t)+(t>=1e6?' de':'')+' blocs minés · '+nb(d.cps)+' par seconde · '+n+' / '+tot+' progrès'+(e>0?' · '+e+' ★':''),n/tot]}};
function jeux(){document.querySelectorAll('[data-jeu]').forEach(function(p){var f=JEUX[p.dataset.jeu];if(!f)return;var r=f(),m=p.previousElementSibling,bar=m&&m.classList.contains('hmeter')?m.querySelector('i'):null;
 p.textContent=r[0];if(bar&&r[1]!=null)bar.style.width=Math.round(100*r[1])+'%'})}
function maj(){prog();reprendre();jeux()}
maj();window.addEventListener('pageshow',maj)})();
