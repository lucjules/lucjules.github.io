/* Recherche dans tous les cours (page d'accueil générale).
   L'index (assets/recherche-index.js, généré par outils/construire.js) n'est chargé qu'au premier usage. */
(function(){
var champ=document.getElementById('q'),zone=document.getElementById('q-res');
if(!champ||!zone)return;
var INDEX=null,chargement=false,minuterie=null,MAX=10;

// Minuscules sans accents, en gardant la même longueur que le texte d'origine (pour surligner au bon endroit)
function norm(s){return s.toLowerCase().replace(/[^\x00-\x7f]/g,function(c){var n=c.normalize('NFD').replace(/[̀-ͯ]/g,'');return n.length===1?n:c})}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

function charger(){
  if(INDEX||chargement)return;chargement=true;
  var s=document.createElement('script');s.src='assets/recherche-index.js';
  s.onload=function(){INDEX=(window.RECHERCHE_INDEX||[]).map(function(e){return{e:e,s:norm(e.s),c:norm(e.m+' '+e.c),t:norm(e.t)}});chercher()};
  s.onerror=function(){chargement=false;zone.hidden=false;zone.innerHTML='<p class="q-vide">La recherche n\'a pas pu se charger. Réessaie avec une connexion.</p>'};
  document.head.appendChild(s);
}

function compter(h,m){var n=0,i=h.indexOf(m);while(i>=0&&n<5){n++;i=h.indexOf(m,i+m.length)}return n}

function extrait(e,mots,nt){
  var p=-1;mots.forEach(function(m){var i=nt.indexOf(m);if(i>=0&&(p<0||i<p))p=i});
  var debut=Math.max(0,p-60),fin=Math.min(e.t.length,debut+200);
  if(debut>0){var sp=e.t.indexOf(' ',debut);if(sp>0&&sp<debut+20)debut=sp+1}
  var brut=e.t.slice(debut,fin),nb=nt.slice(debut,fin),marques=[];
  mots.forEach(function(m){var i=nb.indexOf(m);while(i>=0){marques.push([i,i+m.length]);i=nb.indexOf(m,i+m.length)}});
  marques.sort(function(a,b){return a[0]-b[0]});
  var html='',pos=0;marques.forEach(function(r){if(r[0]<pos)return;html+=esc(brut.slice(pos,r[0]))+'<mark>'+esc(brut.slice(r[0],r[1]))+'</mark>';pos=r[1]});
  html+=esc(brut.slice(pos));
  return (debut>0?'… ':'')+html+(fin<e.t.length?' …':'');
}

function chercher(){
  var q=norm(champ.value.trim());
  if(!q){zone.hidden=true;zone.innerHTML='';return}
  if(!INDEX){charger();zone.hidden=false;zone.innerHTML='<p class="q-vide">Chargement…</p>';return}
  var mots=q.split(/\s+/).filter(Boolean),res=[];
  INDEX.forEach(function(x){
    var score=0;
    for(var i=0;i<mots.length;i++){var m=mots[i],a=x.s.indexOf(m)>=0,b=x.c.indexOf(m)>=0,n=compter(x.t,m);if(!a&&!b&&!n)return;score+=(a?10:0)+(b?4:0)+n}
    res.push({x:x,score:score});
  });
  res.sort(function(a,b){return b.score-a.score});
  if(!res.length){zone.hidden=false;zone.innerHTML='<p class="q-vide">Aucun résultat pour « '+esc(champ.value.trim())+' ».</p>';return}
  zone.hidden=false;
  zone.innerHTML='<p class="q-nb">'+res.length+' résultat'+(res.length>1?'s':'')+(res.length>MAX?' · les '+MAX+' plus pertinents':'')+'</p>'+
    res.slice(0,MAX).map(function(r){var e=r.x.e;return '<a class="hit" href="'+esc(e.u)+'"><span class="hit-where">'+esc(e.m)+' · '+esc(e.c)+'</span><b>'+esc(e.s)+'</b><span class="hit-snip">'+extrait(e,mots,r.x.t)+'</span></a>'}).join('');
}

champ.addEventListener('focus',charger);
champ.addEventListener('input',function(){clearTimeout(minuterie);minuterie=setTimeout(chercher,120)});
champ.addEventListener('keydown',function(e){
  if(e.key==='Enter'){var a=zone.querySelector('a.hit');if(a){e.preventDefault();location.href=a.getAttribute('href')}}
  else if(e.key==='Escape'){champ.value='';chercher()}
});
if(champ.value)chercher();
})();
