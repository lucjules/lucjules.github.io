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
// Jeux : partie en cours lue dans la sauvegarde du jeu (même adresse, donc même stockage du navigateur)
function jeux(){document.querySelectorAll('[data-jeu="aerelia"]').forEach(function(p){var g=null,bar=p.parentNode.querySelector('.hmeter i');
 try{var n=localStorage.getItem('aerelia_slot')||'1';g=JSON.parse(localStorage.getItem(n==='1'?'aerelia':'aerelia_'+n))}catch(e){}
 if(!g||!Array.isArray(g.party)||!g.party.length){p.textContent='Aérélia : pas encore commencé';if(bar)bar.style.width='0';return}
 var b=Math.min(19,Math.max(0,+g.badge||0)),t=Math.max(0,+(g.sx&&g.sx.time)||0),nv=Math.max.apply(null,g.party.map(function(c){return +c.lv||0}));
 p.textContent='Aérélia : '+b+' badge'+(b>1?'s':'')+' sur 19 · niveau '+nv+' · '+Math.floor(t/3600)+' h '+String(Math.floor(t/60)%60).padStart(2,'0')+' de jeu';
 if(bar)bar.style.width=Math.round(100*b/19)+'%'})}
function maj(){prog();reprendre();jeux()}
maj();window.addEventListener('pageshow',maj)})();
