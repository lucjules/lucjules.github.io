/* Assemble jeux/filon-infini/index.html (un seul fichier) à partir de template.html, style.css, data.js, core.js et ui.js.
   Pour régénérer les arbres et leurs coûts (simulation d'un joueur type) :  node gen.js   (écrit data.js)
   Pour vérifier la durée avec un autre style de jeu :                       node sim.js clicks=1 gap=20 react=10
   Puis :                                                                    node build.js */
const fs=require('fs'), path=require('path');
const rd=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const core=rd('core.js').replace(/if\(typeof module!=='undefined'[^\n]*\n?/,'');
const data=rd('data.js').replace(/if\(typeof module!=='undefined'[^\n]*\n?/,'');
const html=rd('template.html').replace('/*__CSS__*/',()=>rd('style.css')).replace('/*__DATA__*/',()=>data).replace('/*__CORE__*/',()=>core).replace('/*__UI__*/',()=>rd('ui.js'));
const out=path.join(__dirname,'../../jeux/filon-infini/index.html');
fs.writeFileSync(out,html);
console.log(path.relative(process.cwd(),out),(html.length/1024).toFixed(0)+' Ko');
