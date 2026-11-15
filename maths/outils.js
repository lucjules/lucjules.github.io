/* Calculateurs et démos interactives du cours de maths.
   Chaque outil se monte dans un élément : outil(racine). Les champs sont repérés par data-k (pas par id),
   ce qui permet d'afficher le même outil dans une leçon ET dans l'onglet « Calculateurs ».
   PRESET : valeurs de départ imposées par une leçon (voir demo() dans lib.js). */
let PRESET={};
const K=(root,k)=>$('[data-k="'+k+'"]',root);
function fld(k,label,val,cls){const v=PRESET[k]!==undefined?PRESET[k]:val;return '<label class="field"><span>'+label+'</span><input class="inp '+(cls||'')+'" data-k="'+k+'" value="'+esc(v)+'" inputmode="text" autocomplete="off" spellcheck="false"></label>';}
function wire(root,ids,fn){
  const run=()=>{
    try{fn();}catch(e){const o=$('.out',root);if(o)o.innerHTML='<span class="err">'+esc(e.message||String(e))+'</span>';}
  };
  ids.forEach(i=>K(root,i).addEventListener('input',run));
  run();
}
/* ===== Calculateurs ===== */
const SUP={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const sup=n=>String(n).split('').map(c=>SUP[c]||c).join('');
const bmod=(a,n)=>((a%n)+n)%n;
const babs=a=>a<0n?-a:a;
function bint(v,label){
  v=String(v).trim().replace(/\s/g,'').replace('−','-');
  if(!/^-?\d+$/.test(v))throw new Error((label||'La valeur')+' doit être un entier.');
  if(v.replace('-','').length>40)throw new Error('Nombre trop grand (40 chiffres maximum).');
  return BigInt(v);
}
function bfloorDiv(a,b){let q=a/b;if((a%b!==0n)&&((a<0n)!==(b<0n)))q-=1n;return q;}
function egcd(a,b){
  const rows=[{q:null,r:a,u:1n,v:0n},{q:null,r:b,u:0n,v:1n}];
  let r0=a,r1=b,u0=1n,u1=0n,v0=0n,v1=1n;
  while(r1!==0n){
    const q=r0/r1;
    const r2=r0-q*r1,u2=u0-q*u1,v2=v0-q*v1;
    r0=r1;r1=r2;u0=u1;u1=u2;v0=v1;v1=v2;
    rows.push({q:q,r:r1,u:u1,v:v1});
  }
  return {g:r0,u:u0,v:v0,rows:rows};
}
function inv(a,n){const e=egcd(bmod(a,n),n);return e.g===1n?bmod(e.u,n):null;}
function bpow(a,k,n){let r=1n%n,b=bmod(a,n);while(k>0n){if(k&1n)r=r*b%n;b=b*b%n;k>>=1n;}return r;}
const fmtB=x=>x.toString().replace('-','−');

const OPS={'¬':'not','!':'not','~':'not','∧':'and','&':'and','∨':'or','|':'or','⊕':'xor','^':'xor','⇒':'imp','⇔':'eq','(':'lp',')':'rp'};
function tokBool(src){
  const s=src.replace(/\s+/g,'');const out=[];let i=0;
  while(i<s.length){
    const c=s[i],t3=s.substr(i,3),t2=s.substr(i,2);
    if(t3==='<->'||t3==='<=>'){out.push({t:'eq'});i+=3;}
    else if(t2==='->'||t2==='=>'){out.push({t:'imp'});i+=2;}
    else if(OPS[c]){out.push({t:OPS[c]});i++;}
    else if(/[A-Za-z]/.test(c)){out.push({t:'var',v:c});i++;}
    else if(c==='0'||c==='1'){out.push({t:'const',v:+c});i++;}
    else throw new Error('Symbole non reconnu : « '+c+' ».');
  }
  return out;
}
function parseBool(tokens){
  let p=0;const peek=()=>tokens[p],next=()=>tokens[p++];
  const is=k=>peek()&&peek().t===k;
  function eq(){let l=imp();while(is('eq')){next();l={k:'eq',l:l,r:imp()};}return l;}
  function imp(){const l=or();if(is('imp')){next();return {k:'imp',l:l,r:imp()};}return l;}
  function or(){let l=and();while(is('or')||is('xor')){const o=next().t;l={k:o,l:l,r:and()};}return l;}
  function and(){let l=not();while(is('and')){next();l={k:'and',l:l,r:not()};}return l;}
  function not(){if(is('not')){next();return {k:'not',a:not()};}return atom();}
  function atom(){
    const t=next();
    if(!t)throw new Error('Expression incomplète.');
    if(t.t==='var')return {k:'var',n:t.v};
    if(t.t==='const')return {k:'const',v:t.v};
    if(t.t==='lp'){const e=eq();const c=next();if(!c||c.t!=='rp')throw new Error('Il manque une parenthèse fermante.');return e;}
    throw new Error('Symbole inattendu dans l’expression.');
  }
  const e=eq();
  if(p<tokens.length)throw new Error('Symbole inattendu après la fin de l’expression.');
  return e;
}
const SYM={and:'∧',or:'∨',xor:'⊕',imp:'⇒',eq:'⇔'};
function bstr(n,top){
  if(n.k==='var')return n.n;
  if(n.k==='const')return String(n.v);
  if(n.k==='not')return '¬'+bstr(n.a);
  const s=bstr(n.l)+' '+SYM[n.k]+' '+bstr(n.r);
  return top?s:'('+s+')';
}
function bev(n,env){
  switch(n.k){
    case 'var':return env[n.n];
    case 'const':return n.v;
    case 'not':return 1-bev(n.a,env);
    case 'and':return bev(n.l,env)&bev(n.r,env);
    case 'or':return bev(n.l,env)|bev(n.r,env);
    case 'xor':return bev(n.l,env)^bev(n.r,env);
    case 'imp':return (1-bev(n.l,env))|bev(n.r,env);
    case 'eq':return bev(n.l,env)===bev(n.r,env)?1:0;
  }
}
function collect(n,vars,subs,seen){
  if(n.k==='var'){if(vars.indexOf(n.n)<0)vars.push(n.n);return;}
  if(n.k==='const')return;
  if(n.k==='not')collect(n.a,vars,subs,seen);else{collect(n.l,vars,subs,seen);collect(n.r,vars,subs,seen);}
  const k=bstr(n,true);
  if(!seen[k]){seen[k]=1;subs.push(n);}
}
function toolTV(root){
  root.innerHTML='<div class="tool"><p class="muted">Écris une expression avec des lettres (p, q, r…). Symboles : ¬ ∧ ∨ ⊕ ⇒ ⇔, ou au clavier <code>! &amp; | ^ -&gt; &lt;-&gt;</code>. Priorités : ¬, ∧, ∨ et ⊕, ⇒, ⇔.</p>'+
   '<div class="fields">'+fld('tvExpr','Expression','¬r ⇒ (p ∨ q)','wide')+'</div>'+
   '<div class="insert" aria-label="Symboles">'+['¬','∧','∨','⊕','⇒','⇔','(',')'].map(s=>'<button type="button" data-ins="'+s+'" aria-label="Insérer '+s+'">'+s+'</button>').join('')+'</div>'+
   '<div class="out"></div></div>';
  const inp=K(root,'tvExpr');
  $$('[data-ins]',root).forEach(b=>b.addEventListener('click',()=>{
    const s=inp.selectionStart==null?inp.value.length:inp.selectionStart,e=inp.selectionEnd==null?s:inp.selectionEnd;
    inp.value=inp.value.slice(0,s)+b.dataset.ins+inp.value.slice(e);
    inp.focus();const pos=s+b.dataset.ins.length;inp.setSelectionRange(pos,pos);
    inp.dispatchEvent(new Event('input'));
  }));
  wire(root,['tvExpr'],()=>{
    const src=inp.value;
    if(!src.trim()){$('.out',root).innerHTML='<span class="muted">Écris une expression pour voir sa table.</span>';return;}
    const tree=parseBool(tokBool(src));
    const vars=[],subs=[],seen={};
    collect(tree,vars,subs,seen);
    if(!subs.length){subs.push(tree);}
    if(vars.length>5)throw new Error('5 variables au maximum (32 lignes).');
    const n=vars.length,rows=[];let ones=0;
    for(let i=0;i<(1<<n);i++){
      const env={};vars.forEach((v,j)=>{env[v]=((i>>(n-1-j))&1)?0:1;});
      const vals=subs.map(s=>bev(s,env));
      const last=vals[vals.length-1];ones+=last;
      rows.push(vars.map(v=>env[v]).concat(vals));
    }
    const total=rows.length;
    const verdict=ones===total?'<span class="ok-t">Tautologie</span> : toujours vraie.':ones===0?'<span class="err">Antilogie</span> : toujours fausse.':'Ni tautologie ni antilogie : vraie dans '+ones+' cas sur '+total+'.';
    const heads=vars.concat(subs.map((s,i)=>i===subs.length-1?'<b>'+esc(bstr(s,true))+'</b>':esc(bstr(s,true))));
    $('.out',root).innerHTML='<p class="big-res" style="margin:0 0 10px">'+esc(bstr(tree,true))+'</p><p>'+verdict+'</p>'+tt(heads.map((h,i)=>i<vars.length?esc(h):h),rows,{raw:true})+'<p class="muted">'+total+' lignes (2<sup>'+n+'</sup>). Colonnes intermédiaires de l’intérieur vers l’extérieur.</p>';
  });
}

function toolDiv(root){
  root.innerHTML='<div class="tool"><div class="fields">'+fld('dvA','a (dividende)','-113')+fld('dvB','b (diviseur &gt; 0)','8')+'</div><div class="out"></div></div>';
  wire(root,['dvA','dvB'],()=>{
    const a=bint(K(root,'dvA').value,'a'),b=bint(K(root,'dvB').value,'b');
    if(b<=0n)throw new Error('Le diviseur b doit être un entier strictement positif.');
    const q=bfloorDiv(a,b),r=a-b*q;
    const qt=a/b,rt=a%b;
    $('.out',root).innerHTML='<p class="big-res" style="margin:0 0 8px">'+fmtB(a)+' = '+fmtB(b)+' × '+(q<0n?'('+fmtB(q)+')':fmtB(q))+' + '+fmtB(r)+'</p>'+
     '<p>Quotient <b>q = '+fmtB(q)+'</b>, reste <b>r = '+fmtB(r)+'</b>, avec 0 ≤ r &lt; '+fmtB(b)+'.</p>'+
     '<h4>Dans les langages</h4><div class="scroll"><table class="tt plain"><thead><tr><th>Langage</th><th>a / b</th><th>a % b</th></tr></thead><tbody>'+
     '<tr><td>Python (// et %)</td><td>'+fmtB(q)+'</td><td>'+fmtB(r)+'</td></tr>'+
     '<tr><td>C, C++, Java</td><td>'+fmtB(qt)+'</td><td>'+fmtB(rt)+'</td></tr></tbody></table></div>'+
     (q!==qt?'<p class="muted">Les résultats diffèrent car a est négatif : C et Java tronquent vers zéro, ce qui donne un reste négatif.</p>':'<p class="muted">Pour a positif, les deux conventions coïncident.</p>');
  });
}

function toolPGCD(root){
  root.innerHTML='<div class="tool"><div class="fields">'+fld('pgA','a','152')+fld('pgB','b','184')+'</div><div class="out"></div></div>';
  wire(root,['pgA','pgB'],()=>{
    const a=bint(K(root,'pgA').value,'a'),b=bint(K(root,'pgB').value,'b');
    if(a===0n&&b===0n)throw new Error('a et b ne peuvent pas être tous les deux nuls.');
    const A=babs(a),B=babs(b);
    const e=egcd(A,B);
    const u=a<0n?-e.u:e.u,v=b<0n?-e.v:e.v;
    const ppcm=(A===0n||B===0n)?0n:A*B/e.g;
    let lines='';
    for(let i=2;i<e.rows.length;i++){
      const p=e.rows[i-2],c=e.rows[i-1];
      lines+='<tr><td>'+fmtB(p.r)+' = '+fmtB(c.r)+' × '+fmtB(e.rows[i].q)+' + '+fmtB(e.rows[i].r)+'</td></tr>';
    }
    const tab='<div class="scroll"><table class="tt"><thead><tr><th>i</th><th>quotient</th><th>reste rᵢ</th><th>uᵢ</th><th>vᵢ</th></tr></thead><tbody>'+
      e.rows.map((r,i)=>'<tr><td>'+i+'</td><td>'+(r.q===null?'':fmtB(r.q))+'</td><td>'+fmtB(r.r)+'</td><td>'+fmtB(r.u)+'</td><td>'+fmtB(r.v)+'</td></tr>').join('')+'</tbody></table></div>';
    $('.out',root).innerHTML='<p class="big-res" style="margin:0 0 6px">PGCD('+fmtB(a)+', '+fmtB(b)+') = '+fmtB(e.g)+'</p>'+
     '<p>PPCM = '+fmtB(ppcm)+'. '+(e.g===1n?'<span class="ok-t">Premiers entre eux.</span>':'')+'</p>'+
     '<h4>Algorithme d’Euclide</h4><div class="scroll"><table class="tt plain"><tbody>'+lines+'</tbody></table></div>'+
     '<h4>Relation de Bézout</h4><div class="f">'+fmtB(a)+' × ('+fmtB(u)+') + '+fmtB(b)+' × ('+fmtB(v)+') = '+fmtB(a*u+b*v)+'</div>'+
     '<h4>Tableau de l’algorithme étendu</h4>'+tab+'<p class="muted">Chaque ligne vérifie a·uᵢ + b·vᵢ = rᵢ (calculé sur |a| et |b|, signes corrigés ensuite).</p>';
  });
}

function toolFact(root){
  root.innerHTML='<div class="tool"><div class="fields">'+fld('ftN','n (2 à 10¹⁴)','7425')+'</div><div class="out"></div></div>';
  wire(root,['ftN'],()=>{
    const raw=K(root,'ftN').value.trim().replace(/\s/g,'');
    if(!/^\d+$/.test(raw))throw new Error('n doit être un entier positif.');
    const n=Number(raw);
    if(n<2)throw new Error('Entre un entier supérieur ou égal à 2.');
    if(n>1e14)throw new Error('n est limité à 10¹⁴ ici.');
    let m=n;const f=[];
    for(let d=2;d*d<=m;d+=(d===2?1:2)){if(m%d===0){let e=0;while(m%d===0){m=m/d;e++;}f.push([d,e]);}}
    if(m>1)f.push([m,1]);
    const nd=f.reduce((s,x)=>s*(x[1]+1),1);
    const isP=f.length===1&&f[0][1]===1;
    const dec=f.map(x=>x[0]+(x[1]>1?'<sup>'+x[1]+'</sup>':'')).join(' × ');
    const k=f.reduce((s,x)=>x[1]%2?s*x[0]:s,1);
    let divs='';
    if(nd<=240){
      let ds=[1];
      f.forEach(x=>{const nx=[];ds.forEach(d=>{let p=1;for(let i=0;i<=x[1];i++){nx.push(d*p);p*=x[0];}});ds=nx;});
      ds.sort((a,b)=>a-b);
      divs='<h4>Diviseurs positifs</h4><div class="res">'+ds.join(', ')+'</div>';
    }
    let test='';
    const r=Math.floor(Math.sqrt(n));
    if(r<=3000){
      const pr=[];for(let i=2;i<=r;i++){let ok=true;for(let j=0;pr[j]*pr[j]<=i;j++){if(i%pr[j]===0){ok=false;break;}}if(ok)pr.push(i);}
      test='<h4>Test de primalité</h4><p>√'+n+' ≈ '+Math.sqrt(n).toFixed(2)+'. Premiers à tester (≤ '+r+') : <span class="res">'+pr.join(', ')+'</span>.</p>';
    }
    $('.out',root).innerHTML='<p class="big-res" style="margin:0 0 8px">'+n+' = '+(isP?'<span class="ok-t">'+n+' est premier</span>':dec)+'</p>'+
     '<ul><li>Nombre de diviseurs positifs : <b>'+nd+'</b>'+(isP?'':' = '+f.map(x=>'('+x[1]+'+1)').join(' × '))+'.</li>'+
     '<li>'+(k===1?'<b>Carré parfait</b> : tous les exposants sont pairs.':'Pas un carré parfait. Plus petit k tel que k × '+n+' soit un carré parfait : <b>'+k+'</b> (k × n = '+(n*k)+').')+'</li>'+
     '<li>Valuations : '+f.map(x=>'v<sub>'+x[0]+'</sub> = '+x[1]).join(', ')+'.</li></ul>'+test+divs;
  });
}

function toolCong(root){
  root.innerHTML='<div class="tool">'+
   '<div class="out" data-k="cgLin"></div><div class="out" data-k="cgPow"></div><div class="out" data-k="cgCrt"></div></div>';
  K(root,'cgLin').innerHTML='<h4>Résoudre ax ≡ b (mod n)</h4><div class="fields">'+fld('lA','a','4')+fld('lB','b','5')+fld('lN','n (&gt; 0)','9')+'</div><div class="res" data-k="lOut" style="margin-top:12px"></div>';
  K(root,'cgPow').innerHTML='<h4>Reste de aᵏ dans la division par n</h4><div class="fields">'+fld('pA','a','2')+fld('pK','k','100')+fld('pN','n (&gt; 0)','7')+'</div><div class="res" data-k="pOut" style="margin-top:12px"></div>';
  K(root,'cgCrt').innerHTML='<h4>Système x ≡ a₁ (mod n₁), x ≡ a₂ (mod n₂)</h4><div class="fields">'+fld('cA1','a₁','2')+fld('cN1','n₁','3')+fld('cA2','a₂','3')+fld('cN2','n₂','5')+'</div><div class="res" data-k="cOut" style="margin-top:12px"></div>';
  const safe=(id,fn)=>()=>{try{fn();}catch(e){K(root,id).innerHTML='<span class="err">'+esc(e.message||String(e))+'</span>';}};
  const lin=safe('lOut',()=>{
    const a=bint(K(root,'lA').value,'a'),b=bint(K(root,'lB').value,'b'),n=bint(K(root,'lN').value,'n');
    if(n<=0n)throw new Error('n doit être strictement positif.');
    const d=egcd(babs(bmod(a,n)),n).g;
    let h='PGCD(a, n) = <b>'+fmtB(d)+'</b>. ';
    if(bmod(b,d)!==0n){K(root,'lOut').innerHTML=h+'<span class="err">'+fmtB(d)+' ne divise pas '+fmtB(b)+' : aucune solution.</span>';return;}
    const a2=bmod(a,n)/d,b2=bmod(b,n)/d,n2=n/d;
    h+=fmtB(d)+' divise '+fmtB(b)+' : il y a des solutions.<br>';
    if(d>1n)h+='On divise par '+fmtB(d)+' : '+fmtB(a2)+'x ≡ '+fmtB(b2)+' (mod '+fmtB(n2)+').<br>';
    let x0;
    if(n2===1n){x0=0n;h+='Modulo 1, tout entier convient.';}
    else{
      const iv=inv(a2,n2);
      h+='Inverse de '+fmtB(a2)+' modulo '+fmtB(n2)+' : <b>'+fmtB(iv)+'</b> (car '+fmtB(a2)+' × '+fmtB(iv)+' ≡ 1).<br>';
      x0=bmod(iv*b2,n2);
      h+='<span class="big-res">x ≡ '+fmtB(x0)+' (mod '+fmtB(n2)+')</span>';
    }
    if(d>1n&&d<=12n){const l=[];for(let i=0n;i<d;i++)l.push(fmtB(x0+i*n2));h+='<br>Modulo '+fmtB(n)+' : x ∈ {'+l.join(', ')+'} ('+fmtB(d)+' classes).';}
    h+='<br><span class="muted">Vérification : '+fmtB(a)+' × '+fmtB(x0)+' mod '+fmtB(n)+' = '+fmtB(bmod(a*x0,n))+' et '+fmtB(b)+' mod '+fmtB(n)+' = '+fmtB(bmod(b,n))+'.</span>';
    K(root,'lOut').innerHTML=h;
  });
  const pw=safe('pOut',()=>{
    const a=bint(K(root,'pA').value,'a'),k=bint(K(root,'pK').value,'k'),n=bint(K(root,'pN').value,'n');
    if(n<=0n)throw new Error('n doit être strictement positif.');
    if(k<0n)throw new Error('k doit être positif ou nul.');
    const r=bpow(a,k,n);
    const seq=[];let cur=1n%n;const first={};let j=-1,per=0;
    for(let i=0;i<80;i++){
      const key=cur.toString();
      if(first[key]!==undefined){j=first[key];per=i-j;break;}
      first[key]=i;seq.push(cur);cur=cur*bmod(a,n)%n;
    }
    let h='<span class="big-res">'+fmtB(a)+sup(fmtB(k))+' ≡ '+fmtB(r)+' (mod '+fmtB(n)+')</span><br>';
    if(per>0){
      h+='Puissances de '+fmtB(a)+' modulo '+fmtB(n)+' : '+seq.slice(0,Math.min(seq.length,24)).map((x,i)=>fmtB(a)+sup(i)+'≡'+fmtB(x)).join(' ; ')+(seq.length>24?' …':'')+'<br>';
      h+='Les valeurs se répètent avec une période de <b>'+per+'</b>'+(j>0?' à partir du rang '+j:'')+'.';
      if(k>=BigInt(j)){const idx=BigInt(j)+((k-BigInt(j))%BigInt(per));h+=' Donc l’exposant '+fmtB(k)+' équivaut à l’exposant '+idx+'.';}
    }
    K(root,'pOut').innerHTML=h;
  });
  const crt=safe('cOut',()=>{
    const a1=bint(K(root,'cA1').value,'a₁'),n1=bint(K(root,'cN1').value,'n₁'),a2=bint(K(root,'cA2').value,'a₂'),n2=bint(K(root,'cN2').value,'n₂');
    if(n1<=0n||n2<=0n)throw new Error('n₁ et n₂ doivent être strictement positifs.');
    const e=egcd(n1,n2),g=e.g;
    let h='PGCD(n₁, n₂) = <b>'+fmtB(g)+'</b>. ';
    const diff=a2-a1;
    if(bmod(diff,g)!==0n){K(root,'cOut').innerHTML=h+'<span class="err">'+fmtB(g)+' ne divise pas a₂ − a₁ = '+fmtB(diff)+' : aucune solution.</span>';return;}
    const m2=n2/g,l=n1/g*n2;
    const t=m2===1n?0n:bmod((diff/g)*inv(n1/g,m2),m2);
    const x0=bmod(a1+n1*t,l);
    h+=(g===1n?'Modules premiers entre eux : solution unique modulo '+fmtB(l)+'.':'Solution unique modulo PPCM = '+fmtB(l)+'.')+'<br>';
    h+='On pose x = '+fmtB(a1)+' + '+fmtB(n1)+'t et on résout '+fmtB(n1)+'t ≡ '+fmtB(diff)+' (mod '+fmtB(n2)+') : t ≡ '+fmtB(t)+' (mod '+fmtB(m2)+').<br>';
    h+='<span class="big-res">x ≡ '+fmtB(x0)+' (mod '+fmtB(l)+')</span><br><span class="muted">Vérification : '+fmtB(x0)+' mod '+fmtB(n1)+' = '+fmtB(bmod(x0,n1))+', '+fmtB(x0)+' mod '+fmtB(n2)+' = '+fmtB(bmod(x0,n2))+'.</span>';
    K(root,'cOut').innerHTML=h;
  });
  ['lA','lB','lN'].forEach(i=>K(root,i).addEventListener('input',lin));
  ['pA','pK','pN'].forEach(i=>K(root,i).addEventListener('input',pw));
  ['cA1','cN1','cA2','cN2'].forEach(i=>K(root,i).addEventListener('input',crt));
  lin();pw();crt();
}

function toolDio(root){
  root.innerHTML='<div class="tool"><div class="fields">'+fld('dA','a','17')+fld('dB','b','5')+fld('dC','c','3')+'</div><div class="out"></div></div>';
  wire(root,['dA','dB','dC'],()=>{
    const a=bint(K(root,'dA').value,'a'),b=bint(K(root,'dB').value,'b'),c=bint(K(root,'dC').value,'c');
    if(a===0n&&b===0n)throw new Error('a et b ne peuvent pas être tous les deux nuls.');
    const e=egcd(babs(a),babs(b)),g=e.g;
    const eq='<b>'+fmtB(a)+'x + '+fmtB(b)+'y = '+fmtB(c)+'</b>';
    if(bmod(c,g)!==0n){$('.out',root).innerHTML='<p>'+eq+'</p><p>PGCD('+fmtB(a)+', '+fmtB(b)+') = '+fmtB(g)+', et '+fmtB(g)+' ne divise pas '+fmtB(c)+' : <span class="err">aucune solution entière.</span></p>';return;}
    const sa=a<0n?-1n:1n,sb=b<0n?-1n:1n;
    const k=c/g;
    let x0=e.u*sa*k,y0=e.v*sb*k;
    const bp=babs(b)/g,ap=babs(a)/g;
    if(bp>0n){const xr=bmod(x0,bp);y0=(c-a*xr)/b;x0=xr;}
    const sx=b>=0n?'+':'−',sy=a>=0n?'−':'+';
    let h='<p>'+eq+'</p><p>PGCD = <b>'+fmtB(g)+'</b> divise '+fmtB(c)+' : il y a des solutions.</p>'+
      '<p>Solution particulière : <b>('+fmtB(x0)+' ; '+fmtB(y0)+')</b>, car '+fmtB(a)+' × '+(x0<0n?'('+fmtB(x0)+')':fmtB(x0))+' + '+fmtB(b)+' × '+(y0<0n?'('+fmtB(y0)+')':fmtB(y0))+' = '+fmtB(a*x0+b*y0)+'.</p>'+
      '<div class="f">x = '+fmtB(x0)+' '+sx+' '+fmtB(bp)+'k\ny = '+fmtB(y0)+' '+sy+' '+fmtB(ap)+'k      (k ∈ ℤ)</div>';
    if(a>0n&&b>0n&&c>=0n){
      const kmax=y0>=0n?y0/ap:-1n;
      if(kmax>=0n){
        const cnt=kmax+1n;
        if(cnt<=40n){
          const rows=[];for(let i=0n;i<=kmax;i++)rows.push([i.toString(),fmtB(x0+bp*i),fmtB(y0-ap*i)]);
          h+='<h4>Solutions dans ℕ² ('+cnt+')</h4>'+tt(['k','x','y'],rows,{raw:true});
        }else h+='<p>'+cnt+' solutions dans ℕ² (k de 0 à '+kmax+').</p>';
      }else h+='<p><b>Aucune solution dans ℕ²</b> (x ≥ 0 impose y &lt; 0).</p>';
    }
    $('.out',root).innerHTML=h;
  });
}

function frac(x){
  if(Number.isInteger(x))return String(x).replace('-','−');
  for(let q=2;q<=120;q++){const p=Math.round(x*q);if(Math.abs(x-p/q)<1e-9)return (p<0?'−':'')+Math.abs(p)+'/'+q;}
  return String(Math.round(x*1e6)/1e6).replace('-','−');
}
const dec=x=>String(Math.round(x*1e6)/1e6).replace('-','−');
function niceStep(range){const raw=range/6,p=Math.pow(10,Math.floor(Math.log10(raw))),m=raw/p;return (m<1.5?1:m<3.5?2:m<7.5?5:10)*p;}
function plotQuad(a,b,c,al,be,roots){
  const W=560,H=320,pad=34;
  const pts=[al,0].concat(roots);
  let lo=Math.min.apply(null,pts),hi=Math.max.apply(null,pts);
  const span=Math.max(hi-lo,2);lo-=span*0.45;hi+=span*0.45;
  const f=x=>a*x*x+b*x+c;
  let ys=[0,be];for(let i=0;i<=120;i++)ys.push(f(lo+(hi-lo)*i/120));
  let ylo=Math.min.apply(null,ys),yhi=Math.max.apply(null,ys);
  const cap=Math.abs(be)*3+Math.max(1,Math.abs(c))*2+6;
  ylo=Math.max(ylo,-cap-Math.abs(be));yhi=Math.min(yhi,cap+Math.abs(be));
  if(yhi-ylo<1){yhi+=1;ylo-=1;}
  const yp=(yhi-ylo)*0.12;ylo-=yp;yhi+=yp;
  const X=x=>pad+(x-lo)/(hi-lo)*(W-2*pad),Y=y=>H-pad-(y-ylo)/(yhi-ylo)*(H-2*pad);
  let g='';
  const sx=niceStep(hi-lo),sy=niceStep(yhi-ylo);
  for(let x=Math.ceil(lo/sx)*sx;x<=hi;x+=sx){g+='<line class="g-grid" x1="'+X(x)+'" y1="'+pad/2+'" x2="'+X(x)+'" y2="'+(H-pad/2)+'"/>';if(Math.abs(x)>1e-9)g+='<text class="g-txt" x="'+X(x)+'" y="'+(Math.min(Math.max(Y(0),pad),H-pad)+14)+'" text-anchor="middle">'+dec(Math.round(x*1e6)/1e6)+'</text>';}
  for(let y=Math.ceil(ylo/sy)*sy;y<=yhi;y+=sy){g+='<line class="g-grid" x1="'+pad/2+'" y1="'+Y(y)+'" x2="'+(W-pad/2)+'" y2="'+Y(y)+'"/>';if(Math.abs(y)>1e-9)g+='<text class="g-txt" x="'+(Math.min(Math.max(X(0),pad),W-pad)-6)+'" y="'+(Y(y)+4)+'" text-anchor="end">'+dec(Math.round(y*1e6)/1e6)+'</text>';}
  const ax=Math.min(Math.max(X(0),pad/2),W-pad/2),ay=Math.min(Math.max(Y(0),pad/2),H-pad/2);
  g+='<line class="g-axis" x1="'+pad/2+'" y1="'+ay+'" x2="'+(W-pad/2)+'" y2="'+ay+'"/><line class="g-axis" x1="'+ax+'" y1="'+pad/2+'" x2="'+ax+'" y2="'+(H-pad/2)+'"/>';
  let d='';
  for(let i=0;i<=200;i++){const x=lo+(hi-lo)*i/200,y=f(x);if(y<ylo-1e3||y>yhi+1e3)continue;const yy=Math.max(Math.min(Y(y),H+40),-40);d+=(d?'L':'M')+X(x).toFixed(1)+' '+yy.toFixed(1);}
  g+='<path class="g-curve" d="'+d+'"/>';
  roots.forEach(r=>{g+='<circle class="g-pt" cx="'+X(r)+'" cy="'+Y(0)+'" r="4.5"/>';});
  g+='<circle class="g-pt" cx="'+X(al)+'" cy="'+Y(be)+'" r="5.5"/><text class="g-txt b" x="'+(X(al)+9)+'" y="'+(Y(be)+(a>0?16:-9))+'">S('+frac(al)+' ; '+frac(be)+')</text>';
  return '<svg class="plot" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Courbe de la fonction">'+g+'</svg>';
}
function toolQuad(root){
  root.innerHTML='<div class="tool"><p class="muted">Pour f(x) = ax² + bx + c. Les décimaux et fractions simples sont acceptés (par exemple 0.5).</p><div class="fields">'+fld('qA','a','2')+fld('qB','b','-8')+fld('qC','c','5')+'</div><div class="out"></div></div>';
  wire(root,['qA','qB','qC'],()=>{
    const P=id=>{const v=parseFloat(K(root,id).value.replace(',','.').replace('−','-'));if(!isFinite(v))throw new Error('Entre un nombre pour '+id.slice(1).toLowerCase()+'.');return v;};
    const a=P('qA'),b=P('qB'),c=P('qC');
    if(a===0)throw new Error('a doit être non nul (sinon ce n’est plus du second degré).');
    const D=b*b-4*a*c,al=-b/(2*a),be=a*al*al+b*al+c;
    const sg=(x)=>(x<0?'− ':'+ ')+frac(Math.abs(x));
    const poly=(a===1?'':a===-1?'−':frac(a))+'x² '+(b===0?'':sg(b)+'x ')+(c===0?'':sg(c));
    let roots=[],res='',fact='';
    if(D>0){
      const r1=(-b-Math.sqrt(D))/(2*a),r2=(-b+Math.sqrt(D))/(2*a);roots=[Math.min(r1,r2),Math.max(r1,r2)];
      res='Δ &gt; 0 : deux racines réelles<br><span class="big-res">x₁ = '+frac(roots[0])+'  et  x₂ = '+frac(roots[1])+'</span>';
      if(Number.isInteger(b)&&Number.isInteger(c)&&Number.isInteger(a)&&!Number.isInteger(Math.sqrt(D)))res+='<br>Valeurs exactes : x = (−b ± √Δ) / 2a = ('+fmtB(BigInt(-b))+' ± √'+D+') / '+(2*a);
      fact='f(x) = '+(a===1?'':frac(a))+'(x '+(roots[0]<0?'+ '+frac(-roots[0]):'− '+frac(roots[0]))+')(x '+(roots[1]<0?'+ '+frac(-roots[1]):'− '+frac(roots[1]))+')';
    }else if(Math.abs(D)<1e-12){
      roots=[al];res='Δ = 0 : une racine double<br><span class="big-res">x₀ = '+frac(al)+'</span>';
      fact='f(x) = '+(a===1?'':frac(a))+'(x '+(al<0?'+ '+frac(-al):'− '+frac(al))+')²';
    }else{res='Δ &lt; 0 : aucune racine réelle.';fact='Pas de factorisation dans ℝ.';}
    const sign=D>0?'f est du signe de '+(a>0?'a (positive)':'a (négative)')+' à l’extérieur des racines, et du signe opposé entre les racines.':D===0?'f est du signe de a partout, et s’annule en x₀.':'f est du signe de a ('+(a>0?'positive':'négative')+') sur tout ℝ.';
    $('.out',root).innerHTML='<p class="big-res" style="margin:0 0 6px">f(x) = '+esc(poly)+'</p>'+
     '<h4>Discriminant</h4><div class="f">Δ = b² − 4ac = '+frac(b)+'² − 4 × '+(a<0?'('+frac(a)+')':frac(a))+' × '+(c<0?'('+frac(c)+')':frac(c))+' = '+frac(D)+'</div><p>'+res+'</p>'+
     '<h4>Forme factorisée</h4><div class="f">'+esc(fact)+'</div>'+
     '<h4>Sommet et forme canonique</h4><div class="f">S('+frac(al)+' ; '+frac(be)+')\nf(x) = '+(a===1?'':frac(a))+'(x '+(al<0?'+ '+frac(-al):'− '+frac(al))+')² '+(be<0?'− '+frac(-be):'+ '+frac(be))+'</div>'+
     '<h4>Variations et signe</h4><p>'+(a>0?'Tournée vers le haut : f décroît sur ]−∞ ; '+frac(al)+'], croît sur ['+frac(al)+' ; +∞[. <b>Minimum '+frac(be)+'</b> en x = '+frac(al)+'.':'Tournée vers le bas : f croît sur ]−∞ ; '+frac(al)+'], décroît sur ['+frac(al)+' ; +∞[. <b>Maximum '+frac(be)+'</b> en x = '+frac(al)+'.')+'</p><p>'+sign+'</p>'+
     plotQuad(a,b,c,al,be,roots);
  });
}

/* ===== Démos interactives : crible d'Ératosthène, additionneurs, horloge des congruences ===== */
function wSieve(root){
  const N=100;let cut,prem,p,fin;
  root.innerHTML='<div class="tool"><div class="sv" role="group" aria-label="Les nombres de 1 à 100"></div><p class="sv-msg" aria-live="polite"></p>'+
   '<div class="row"><button type="button" class="btn sm" data-a="next">Étape suivante</button><button type="button" class="ghost" data-a="all">Tout terminer</button><button type="button" class="ghost" data-a="reset">Recommencer</button></div></div>';
  const grid=$('.sv',root),msg=$('.sv-msg',root),cells=[];
  for(let n=1;n<=N;n++){const b=document.createElement('button');b.type='button';b.tabIndex=-1;b.textContent=n;grid.appendChild(b);cells[n]=b;}
  const paint=()=>{for(let n=1;n<=N;n++){cells[n].className=n===1?'one':prem.has(n)?'prime':cut.has(n)?'cut':'';if(n===p&&!fin)cells[n].classList.add('cur');}};
  function reset(){cut=new Set();prem=new Set();p=2;fin=false;msg.innerHTML='1 n’est pas premier (un seul diviseur). On commence par <b>2</b> : clique sur « Étape suivante ».';paint();}
  function next(){
    if(fin)return;
    if(p*p>N){
      for(let n=2;n<=N;n++)if(!cut.has(n))prem.add(n);
      fin=true;msg.innerHTML='<b>Terminé.</b> '+p+'² = '+p*p+' dépasse '+N+' : il suffisait de barrer les multiples des premiers jusqu’à √'+N+' = '+Math.sqrt(N)+'. Tous les nombres non barrés sont premiers : il y en a <b>'+prem.size+'</b> jusqu’à '+N+'.';paint();return;
    }
    prem.add(p);const barres=[];
    for(let m=p*p;m<=N;m+=p)if(!cut.has(m)){cut.add(m);barres.push(m);}
    msg.innerHTML='<b>'+p+'</b> n’est pas barré : il est premier. On barre ses multiples à partir de '+p+'² = '+p*p+' (les plus petits l’ont déjà été par les premiers précédents)'+(barres.length?' : '+barres.slice(0,12).join(', ')+(barres.length>12?'…':''):'')+'.';
    let q=p+1;while(q<=N&&cut.has(q))q++;p=q;paint();
  }
  root.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;if(a==='reset')reset();else if(a==='next')next();else{let g=0;while(!fin&&g++<60)next();}});
  reset();
}

function gate(t,x,y){
  const lab={and:'∧',or:'∨',xor:'⊕'}[t];
  let d;
  if(t==='and')d='M'+x+' '+y+'H'+(x+36)+'A24 24 0 0 1 '+(x+36)+' '+(y+48)+'H'+x+'Z';
  else d='M'+(t==='xor'?x+8:x)+' '+y+'Q'+(x+24)+' '+(y+24)+' '+(t==='xor'?x+8:x)+' '+(y+48)+'C'+(x+34)+' '+(y+48)+' '+(x+52)+' '+(y+40)+' '+(x+60)+' '+(y+24)+'C'+(x+52)+' '+(y+8)+' '+(x+34)+' '+y+' '+(t==='xor'?x+8:x)+' '+y+'Z';
  return '<path class="g" d="'+d+'"/>'+(t==='xor'?'<path class="g" style="fill:none" d="M'+x+' '+y+'Q'+(x+24)+' '+(y+24)+' '+x+' '+(y+48)+'"/>':'')+
    '<text x="'+(x+30)+'" y="'+(y+29)+'" text-anchor="middle">'+lab+'</text>';
}
function wAdder(root,mode){
  const full=mode==='complet';
  const W=(s,pts)=>'<polyline class="w" data-s="'+s+'" points="'+pts.map(p=>p.join(',')).join(' ')+'" stroke-linejoin="round"/>';
  const IO=(k,x,y)=>'<g class="io" data-i="'+k+'" role="button" tabindex="0"><rect x="'+x+'" y="'+y+'" width="58" height="40"/><text x="'+(x+29)+'" y="'+(y+25)+'" text-anchor="middle">'+k+' = 0</text></g>';
  const OUT=(k,x,y,w)=>'<g class="out-l" data-o="'+k+'"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="40"/><text x="'+(x+w/2)+'" y="'+(y+25)+'" text-anchor="middle">'+k+' = 0</text></g>';
  const dot=(s,x,y)=>'<circle class="dot" data-s="'+s+'" cx="'+x+'" cy="'+y+'" r="4.5"/>';
  let svg;
  if(!full){
    svg='<svg class="circ" viewBox="0 0 540 230" role="img" aria-label="Demi-additionneur : une porte XOR et une porte ET">'+
      W('A',[[66,56],[150,56],[150,42],[250,42]])+W('A',[[150,56],[150,152],[250,152]])+
      W('B',[[66,172],[190,172],[190,62],[250,62]])+W('B',[[190,172],[250,172]])+
      W('S',[[310,52],[430,52]])+W('C',[[310,162],[430,162]])+dot('A',150,56)+dot('B',190,172)+
      gate('xor',250,28)+gate('and',250,138)+
      '<text x="280" y="96" text-anchor="middle" style="font-weight:400;font-size:12px">XOR</text><text x="280" y="206" text-anchor="middle" style="font-weight:400;font-size:12px">ET</text>'+
      IO('A',8,36)+IO('B',8,152)+OUT('S',430,32,72)+OUT('C',430,142,72)+'</svg>';
  }else{
    svg='<svg class="circ" viewBox="0 0 780 320" role="img" aria-label="Additionneur complet : deux demi-additionneurs et une porte OU">'+
      '<rect x="150" y="6" width="104" height="196" rx="10" fill="none" stroke="currentColor" stroke-dasharray="5 4" opacity=".4"/><text x="202" y="222" text-anchor="middle" style="font-weight:400;font-size:12px">demi-additionneur 1</text>'+
      '<rect x="360" y="6" width="104" height="226" rx="10" fill="none" stroke="currentColor" stroke-dasharray="5 4" opacity=".4"/><text x="412" y="252" text-anchor="middle" style="font-weight:400;font-size:12px">demi-additionneur 2</text>'+
      W('A',[[66,40],[110,40],[110,34],[170,34]])+W('A',[[110,40],[110,114],[170,114]])+
      W('B',[[66,100],[140,100],[140,54],[170,54]])+W('B',[[140,100],[140,134],[170,134]])+
      W('X1',[[230,44],[300,44],[300,34],[380,34]])+W('X1',[[300,44],[300,164],[380,164]])+
      W('Cin',[[66,290],[340,290],[340,54],[380,54]])+W('Cin',[[340,184],[380,184]])+
      W('G1',[[230,124],[500,124],[500,114],[540,114]])+W('G2',[[440,174],[500,174],[500,134],[540,134]])+
      W('S',[[440,44],[670,44]])+W('Cout',[[600,124],[670,124]])+
      dot('A',110,40)+dot('B',140,100)+dot('X1',300,44)+dot('Cin',340,184)+
      gate('xor',170,20)+gate('and',170,100)+gate('xor',380,20)+gate('and',380,150)+gate('or',540,100)+
      IO('A',8,20)+IO('B',8,80)+IO('Cin',8,270)+OUT('S',670,24,94)+OUT('Cout',670,104,94)+'</svg>';
  }
  root.innerHTML='<div class="tool">'+svg+'<p class="circ-msg res" aria-live="polite"></p><p class="muted">Clique sur une entrée (A, B'+(full?', Cin':'')+') pour la faire passer de 0 à 1 : les fils portant un 1 s’allument en vert.</p></div>';
  const st=full?{A:1,B:1,Cin:1}:{A:1,B:1};
  function calc(){
    const v=Object.assign({},st);
    if(full){v.X1=v.A^v.B;v.G1=v.A&v.B;v.S=v.X1^v.Cin;v.G2=v.X1&v.Cin;v.Cout=v.G1|v.G2;}
    else{v.S=v.A^v.B;v.C=v.A&v.B;}
    return v;
  }
  function draw(){
    const v=calc();
    $$('.w,.dot',root).forEach(e=>e.classList.toggle('on',!!v[e.dataset.s]));
    $$('.io',root).forEach(g=>{const k=g.dataset.i;g.classList.toggle('on',!!v[k]);$('text',g).textContent=k+' = '+v[k];g.setAttribute('aria-label','Entrée '+k+' valant '+v[k]+' : appuyer pour la changer');});
    $$('.out-l',root).forEach(g=>{const k=g.dataset.o;g.classList.toggle('on',!!v[k]);$('text',g).textContent=k+' = '+v[k];});
    const cout=full?v.Cout:v.C,tot=full?v.A+v.B+v.Cin:v.A+v.B;
    $('.circ-msg',root).innerHTML=(full?v.A+' + '+v.B+' + '+v.Cin:v.A+' + '+v.B)+' = '+tot+' en décimal, soit <b>'+cout+v.S+'</b> en binaire : somme S = '+v.S+', retenue '+(full?'C<sub>out</sub>':'C')+' = '+cout+'.';
  }
  const toggle=g=>{const k=g.dataset.i;st[k]=1-st[k];draw();};
  root.addEventListener('click',e=>{const g=e.target.closest('.io');if(g)toggle(g);});
  root.addEventListener('keydown',e=>{const g=e.target.closest&&e.target.closest('.io');if(g&&(e.key===' '||e.key==='Enter')){e.preventDefault();toggle(g);}});
  draw();
}
/* Circuit de la fonction f = r ∧ (¬p ∨ q) (chapitre 4, synthèse) */
function wFonc(root){
  const W=(s,pts)=>'<polyline class="w" data-s="'+s+'" points="'+pts.map(p=>p.join(',')).join(' ')+'" stroke-linejoin="round"/>';
  const IO=(k,x,y)=>'<g class="io" data-i="'+k+'" role="button" tabindex="0"><rect x="'+x+'" y="'+y+'" width="58" height="38"/><text x="'+(x+29)+'" y="'+(y+24)+'" text-anchor="middle">'+k+' = 0</text></g>';
  const inv=(x,y)=>'<path class="g" d="M'+x+' '+y+'L'+(x+34)+' '+(y+16)+'L'+x+' '+(y+32)+'Z"/><circle class="g" cx="'+(x+39)+'" cy="'+(y+16)+'" r="5"/>';
  const svg='<svg class="circ" viewBox="0 0 580 230" role="img" aria-label="Circuit : une porte NON sur p, une porte OU avec q, puis une porte ET avec r">'+
    W('p',[[66,40],[96,40]])+W('np',[[140,40],[190,40],[190,54],[230,54]])+W('q',[[66,100],[190,100],[190,74],[230,74]])+
    W('o',[[290,64],[340,64],[340,119],[380,119]])+W('r',[[66,180],[340,180],[340,139],[380,139]])+W('f',[[440,129],[500,129]])+
    inv(96,24)+gate('or',230,40)+gate('and',380,105)+
    '<text x="118" y="86" text-anchor="middle" style="font-weight:400;font-size:12px">NON</text><text x="260" y="116" text-anchor="middle" style="font-weight:400;font-size:12px">OU</text><text x="410" y="170" text-anchor="middle" style="font-weight:400;font-size:12px">ET</text>'+
    IO('p',8,21)+IO('q',8,81)+IO('r',8,161)+'<g class="out-l" data-o="f"><rect x="500" y="109" width="62" height="40"/><text x="531" y="134" text-anchor="middle">f = 0</text></g></svg>';
  root.innerHTML='<div class="tool">'+svg+'<p class="circ-msg res" aria-live="polite"></p><p class="muted">Clique sur p, q ou r : les fils portant un 1 s’allument. Compare avec la table de vérité du TD.</p></div>';
  const st={p:1,q:0,r:1};
  function draw(){
    const v=Object.assign({},st);v.np=1-v.p;v.o=v.np|v.q;v.f=v.o&v.r;
    $$('.w',root).forEach(e=>e.classList.toggle('on',!!v[e.dataset.s]));
    $$('.io',root).forEach(g=>{const k=g.dataset.i;g.classList.toggle('on',!!v[k]);$('text',g).textContent=k+' = '+v[k];g.setAttribute('aria-label','Entrée '+k+' valant '+v[k]+' : appuyer pour la changer');});
    $$('.out-l',root).forEach(g=>{g.classList.toggle('on',!!v.f);$('text',g).textContent='f = '+v.f;});
    $('.circ-msg',root).innerHTML='p = '+v.p+', q = '+v.q+', r = '+v.r+' : ¬p = '+v.np+', ¬p ∨ q = '+v.o+', donc <b>f = '+v.o+' ∧ '+v.r+' = '+v.f+'</b>.';
  }
  const toggle=g=>{const k=g.dataset.i;st[k]=1-st[k];draw();};
  root.addEventListener('click',e=>{const g=e.target.closest('.io');if(g)toggle(g);});
  root.addEventListener('keydown',e=>{const g=e.target.closest&&e.target.closest('.io');if(g&&(e.key===' '||e.key==='Enter')){e.preventDefault();toggle(g);}});
  draw();
}
/* Chronomètre d'entraînement (interro blanche) */
function wTimer(root){
  root.innerHTML='<div class="tool"><div class="fields">'+fld('tmMin','Durée (minutes)','30')+'</div><div class="big-res timer-d" style="font-size:44px;text-align:center">30:00</div>'+
    '<div class="row" style="justify-content:center"><button type="button" class="btn sm" data-a="go">Démarrer</button><button type="button" class="ghost" data-a="pause">Pause</button><button type="button" class="ghost" data-a="reset">Remettre à zéro</button></div><p class="muted timer-m" aria-live="polite" style="text-align:center"></p></div>';
  const d=$('.timer-d',root),m=$('.timer-m',root),inp=K(root,'tmMin');
  let reste=0,id=null;
  const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
  const duree=()=>{const v=parseInt(inp.value,10);return v>0&&v<=240?v*60:1800;};
  const arret=()=>{if(id){clearInterval(id);id=null;}};
  function reset(){arret();reste=duree();d.textContent=fmt(reste);m.textContent='Prêt : travaille sur papier, sans le cours.';}
  function go(){
    if(id)return;if(reste<=0)reste=duree();
    m.textContent='C’est parti : écris proprement et justifie chaque étape.';
    id=setInterval(()=>{
      if(!root.isConnected){arret();return;}
      reste--;d.textContent=fmt(Math.max(0,reste));
      if(reste===Math.floor(duree()/10)&&reste>0)m.textContent='Dernières minutes : relis tes réponses.';
      if(reste<=0){arret();m.textContent='Temps écoulé. Compare avec la correction, puis note tes erreurs.';}
    },1000);
  }
  root.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;if(a==='go')go();else if(a==='pause'){arret();m.textContent='En pause.';}else reset();});
  inp.addEventListener('input',()=>{if(!id)reset();});
  reset();
}
const toolAdder=root=>{
  root.innerHTML='<div class="tool"><div class="chips"><button type="button" class="chip" data-m="demi" aria-pressed="false">Demi-additionneur</button><button type="button" class="chip" data-m="complet" aria-pressed="true">Additionneur complet</button></div><div class="ad-body"></div></div>';
  const go=m=>{$$('.chip',root).forEach(c=>c.setAttribute('aria-pressed',c.dataset.m===m));wAdder($('.ad-body',root),m);};
  root.addEventListener('click',e=>{const c=e.target.closest('.chip[data-m]');if(c)go(c.dataset.m);});
  go('complet');
};

function wClock(root){
  root.innerHTML='<div class="tool"><div class="fields">'+fld('ckA','Entier a','38')+fld('ckN','Modulo n (2 à 24)','7')+'</div><div class="out"></div></div>';
  wire(root,['ckA','ckN'],()=>{
    const a=Number(K(root,'ckA').value.replace('−','-').trim()),n=Number(K(root,'ckN').value.trim());
    if(!Number.isInteger(a)||Math.abs(a)>1e9)throw new Error('a doit être un entier (au plus 10⁹ en valeur absolue).');
    if(!Number.isInteger(n)||n<2||n>24)throw new Error('n doit être un entier entre 2 et 24.');
    const q=Math.floor(a/n),r=a-n*q,R0=110,cx=150,cy=150;
    const pos=k=>{const t=-Math.PI/2+2*Math.PI*k/n;return [cx+R0*Math.cos(t),cy+R0*Math.sin(t)];};
    let s='<svg class="clock" viewBox="0 0 300 300" role="img" aria-label="Horloge à '+n+' cases : '+a+' tombe sur '+r+'"><circle class="face" cx="150" cy="150" r="136"/>';
    const [hx,hy]=pos(r);s+='<line class="hand" x1="150" y1="150" x2="'+hx.toFixed(1)+'" y2="'+hy.toFixed(1)+'"/><circle cx="150" cy="150" r="6" fill="currentColor"/>';
    for(let k=0;k<n;k++){const [x,y]=pos(k);if(k===r)s+='<circle class="sel" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="17"/>';s+='<text class="num" x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'">'+k+'</text>';}
    s+='</svg>';
    const mem=[];for(let i=-2;i<=3;i++)mem.push(r+i*n);
    $('.out',root).innerHTML=s+
      '<p class="big-res" style="text-align:center;margin:6px 0">'+fmtB(BigInt(a))+' = '+n+' × '+(q<0?'('+q+')':q)+' + '+r+'</p>'+
      '<p style="text-align:center">Donc <b>'+fmtB(BigInt(a))+' ≡ '+r+' (mod '+n+')</b> : on s’arrête sur la case <b>'+r+'</b>.<br><span class="muted">Mêmes cases que '+fmtB(BigInt(a))+' : … '+mem.map(x=>String(x).replace('-','−')).join(', ')+' …  (on ajoute ou retire des multiples de '+n+').</span></p>';
  });
}

/* ===== Registre des outils (onglet « Calculateurs » et démos dans les leçons) ===== */
const TOOLS=[
  {id:'tv',name:'Table de vérité',fn:toolTV,desc:'Tape une expression, obtiens sa table colonne par colonne.'},
  {id:'adder',name:'Additionneurs',fn:toolAdder,desc:'Fais varier les entrées d’un demi-additionneur ou d’un additionneur complet.'},
  {id:'div',name:'Division euclidienne',fn:toolDiv,desc:'Quotient et reste, y compris pour un dividende négatif.'},
  {id:'fact',name:'Facteurs premiers',fn:toolFact,desc:'Décomposition, diviseurs, carré parfait, test de primalité.'},
  {id:'sieve',name:'Crible d’Ératosthène',fn:wSieve,desc:'Les nombres premiers jusqu’à 100, étape par étape.'},
  {id:'pgcd',name:'PGCD et Bézout',fn:toolPGCD,desc:'Algorithme d’Euclide et coefficients de Bézout.'},
  {id:'dio',name:'ax + by = c',fn:toolDio,desc:'Équation diophantienne : existence et solutions générales.'},
  {id:'clock',name:'Horloge modulaire',fn:wClock,desc:'Visualise a modulo n sur un cadran.'},
  {id:'cong',name:'Congruences',fn:toolCong,desc:'ax ≡ b (n), puissances modulo n, restes chinois.'},
  {id:'quad',name:'Second degré',fn:toolQuad,desc:'Discriminant, racines, forme canonique, courbe.'}
];
