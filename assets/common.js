/* Code commun à toutes les pages, chargé dans <head> :
   thème enregistré, ordre des réponses de QCM, mode hors ligne (service worker),
   dernière leçon ouverte (bouton « Reprendre ») et préparation à l'impression. */
try{var __t=localStorage.getItem('cours-theme');if(__t)document.documentElement.dataset.theme=__t}catch(e){}
function qOrder(ch){var idx=ch.map(function(_,i){return i}),n=idx.length;
  if(ch.every(function(x){return /^(vrai|faux|oui|non)$/i.test(String(x))}))return idx;
  for(var i=n-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=idx[i];idx[i]=idx[j];idx[j]=t}
  var pin=idx.filter(function(i){return /^Aucune?$/i.test(String(ch[i]))}),rest=idx.filter(function(i){return pin.indexOf(i)<0});
  return rest.concat(pin)}
(function(){var s=document.currentScript;if(!s||!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
  var url=new URL('../sw.js',s.src);window.addEventListener('load',function(){navigator.serviceWorker.register(url).catch(function(){})})})();
// Dernière leçon ouverte, pour le bouton « Reprendre » des pages d'accueil
(function(){var s=document.currentScript;if(!s)return;var racine=new URL('../',s.src).href,minuterie=null;
  function noter(){
    if(!document.body||document.querySelector('main.hub'))return;
    var u=location.href.split('#')[0];if(u.indexOf(racine)!==0)return;
    var a=document.querySelector('.nav a[aria-current="page"]'),sec='';
    if(a){var t=a.querySelector('.nav-t');if(t)sec=t.textContent;else{var c=a.cloneNode(true);c.querySelectorAll('.ic').forEach(function(x){x.remove()});sec=c.textContent}}
    sec=sec.replace(/\s+/g,' ').trim();if(/^accueil$/i.test(sec))sec='';
    var chap=document.title;if(sec&&chap.indexOf(sec+' · ')===0)chap=chap.slice(sec.length+3); // le titre de l'onglet reprend parfois la leçon
    try{localStorage.setItem('cours-reprendre',JSON.stringify({u:u.slice(racine.length)+(sec?location.hash:''),chap:chap,sec:sec,d:Date.now()}))}catch(e){}}
  function plusTard(){clearTimeout(minuterie);minuterie=setTimeout(noter,80)}
  document.addEventListener('DOMContentLoaded',plusTard);window.addEventListener('hashchange',plusTard);document.addEventListener('click',plusTard)})();
// Impression : thème clair, sections repliées et corrigés ouverts le temps d'imprimer, puis retour à l'état d'avant
(function(){var avant=null;
  window.addEventListener('beforeprint',function(){
    if(avant)return; // déjà préparé (certains navigateurs envoient l'événement deux fois)
    var r=document.documentElement;avant={theme:r.getAttribute('data-theme'),details:[],sols:[]};r.setAttribute('data-theme','light');
    document.querySelectorAll('details:not([open])').forEach(function(d){d.open=true;avant.details.push(d)});
    document.querySelectorAll('.sol[hidden],.trace-sol[hidden]').forEach(function(e){e.hidden=false;e.classList.add('sol-imprime');avant.sols.push(e)})});
  window.addEventListener('afterprint',function(){if(!avant)return;var r=document.documentElement;
    if(avant.theme===null)r.removeAttribute('data-theme');else r.setAttribute('data-theme',avant.theme);
    avant.details.forEach(function(d){d.open=false});avant.sols.forEach(function(e){e.hidden=true;e.classList.remove('sol-imprime')});avant=null})})();
