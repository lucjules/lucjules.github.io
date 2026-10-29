/* Sauvegarde de la progression (page d'accueil générale) : exporter tout ce que le site garde
   dans ce navigateur (fichier ou code à copier), puis l'importer sur un autre appareil. */
(function(){
var $=function(id){return document.getElementById(id)};
if(!$('bk-dl'))return;
var FORMAT='mes-cours-iut',PREFIXE='MCIUT1.';

function message(t,ok){var m=$('bk-msg');m.textContent=t;m.className='bk-msg '+(ok?'ok':'ko')}
function donnees(){var d={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);d[k]=localStorage.getItem(k)}return d}
function sauvegarde(){return JSON.stringify({format:FORMAT,version:1,date:new Date().toISOString(),donnees:donnees()})}
// base64 d'un texte UTF-8 (accents, symboles) et inverse
function enCode(s){return PREFIXE+btoa(unescape(encodeURIComponent(s)))}
function deCode(c){return decodeURIComponent(escape(atob(c.replace(/\s+/g,'').slice(PREFIXE.length))))}
function dateFr(iso){try{return new Date(iso).toLocaleString('fr-FR',{dateStyle:'long',timeStyle:'short'})}catch(e){return iso}}

$('bk-dl').addEventListener('click',function(){
  try{
    var url=URL.createObjectURL(new Blob([sauvegarde()],{type:'application/json'})),a=document.createElement('a');
    a.href=url;a.download='progression-cours-iut-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000);
    message('Fichier de sauvegarde téléchargé. Ouvre-le depuis cette page sur ton autre appareil.',true);
  }catch(e){message('Impossible de créer la sauvegarde dans ce navigateur.',false)}
});

$('bk-copy').addEventListener('click',function(){
  var code;try{code=enCode(sauvegarde())}catch(e){message('Impossible de créer la sauvegarde dans ce navigateur.',false);return}
  var zone=$('bk-code'),ok=function(){message('Code copié. Colle-le dans cette même zone sur ton autre appareil (par message ou e-mail à toi-même).',true)};
  function secours(){zone.value=code;zone.select();var r=false;try{r=document.execCommand('copy')}catch(e){}
    if(r)ok();else message('Copie automatique impossible : le code est dans la zone ci-dessous, copie-le à la main.',true)}
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(code).then(ok,secours);else secours();
});

function importer(texte){
  var s;
  try{
    texte=String(texte||'').trim();
    if(!texte)throw 0;
    s=JSON.parse(texte.charAt(0)==='{'?texte:deCode(texte));
    if(!s||s.format!==FORMAT||typeof s.donnees!=='object')throw 0;
  }catch(e){message('Ce code ou ce fichier n\'est pas une sauvegarde de ce site.',false);return}
  var cles=Object.keys(s.donnees);
  if(!confirm('Importer la sauvegarde du '+dateFr(s.date)+' ?\nLa progression de cet appareil sera remplacée pour tous les chapitres qu\'elle contient.'))return;
  try{cles.forEach(function(k){localStorage.setItem(k,String(s.donnees[k]))})}
  catch(e){message('L\'import a échoué : le navigateur refuse d\'enregistrer les données.',false);return}
  try{var t=localStorage.getItem('cours-theme');if(t)document.documentElement.dataset.theme=t;else delete document.documentElement.dataset.theme}catch(e){}
  $('bk-code').value='';
  if(window.hubProgress)window.hubProgress();
  message('Progression importée ('+cles.length+' élément'+(cles.length>1?'s':'')+').',true);
}

$('bk-import').addEventListener('click',function(){importer($('bk-code').value)});
$('bk-file-btn').addEventListener('click',function(){$('bk-file').click()});
$('bk-file').addEventListener('change',function(){
  var f=this.files&&this.files[0];if(!f)return;var r=new FileReader();
  r.onload=function(){importer(r.result)};r.onerror=function(){message('Lecture du fichier impossible.',false)};
  r.readAsText(f);this.value='';
});
})();
