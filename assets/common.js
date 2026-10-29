/* Code commun à toutes les pages, chargé dans <head> :
   thème enregistré, ordre des réponses de QCM et mode hors ligne (service worker). */
try{var __t=localStorage.getItem('cours-theme');if(__t)document.documentElement.dataset.theme=__t}catch(e){}
function qOrder(ch){var idx=ch.map(function(_,i){return i}),n=idx.length;
  if(ch.every(function(x){return /^(vrai|faux|oui|non)$/i.test(String(x))}))return idx;
  for(var i=n-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=idx[i];idx[i]=idx[j];idx[j]=t}
  var pin=idx.filter(function(i){return /^Aucune?$/i.test(String(ch[i]))}),rest=idx.filter(function(i){return pin.indexOf(i)<0});
  return rest.concat(pin)}
(function(){var s=document.currentScript;if(!s||!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
  var url=new URL('../sw.js',s.src);window.addEventListener('load',function(){navigator.serviceWorker.register(url).catch(function(){})})})();
