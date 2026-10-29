/* Pages d'accueil (générale et par matière) : bouton de thème, barres de progression des cartes [data-prog]
   et bouton d'installation de l'application. */
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
prog();window.addEventListener('pageshow',prog)})();
