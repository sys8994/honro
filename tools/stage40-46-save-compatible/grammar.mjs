export function normalizeLibrary(stock){
const decoded=structuredClone(stock);
const ids=new Set(['approved40:body','approved40:coastal-foundation','approved40:terrain-left-join','approved40:terrain-right-join']);
const data=[];
const protectedStrings=new Set();
function protect(n,isTarget,where='') {
  if (typeof n==='string') {
    if(!isTarget || !/\.(d|dParts\.\d+)$/.test(where) || where.includes('.clips.'))protectedStrings.add(n);
    return;
  }
  if(n && typeof n==='object')for(const [k,v] of Object.entries(n))protect(v,isTarget,where+'.'+k);
}
for(const a of stock)protect(a,ids.has(a.id));

const N='[-+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][-+]?\\d+)?', C='[MmLlHhVvCcSsQqTtZz]';
const lex=new RegExp(C+'|'+N,'gy'), num=new RegExp('^'+N), argv={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,Z:0};
const cmd=/^[MmLlHhVvCcSsQqTtZz]$/;
function parse(s) {
  let i=0,cur='', records=[];
  function tok(){
    while(/[\t\r\n ,]/.test(s[i]??''))i++;
    if(i===s.length)return null;
    lex.lastIndex=i;const t=lex.exec(s);
    if(!t)throw Error('Unexpected path token @'+i+': '+s.slice(i,i+20));
    i=lex.lastIndex;return t[0];
  }
  let t;
  while((t=tok())!==null){
    if(cmd.test(t)){cur=t;if(cur.toUpperCase()==='Z'){records.push([cur]);cur='';continue;}t=tok();}
    const up=cur.toUpperCase();
    if(!up||t===null||cmd.test(t))throw Error('Unexpected command arity '+cur+' @'+i);
    const arr=Array.from({length:argv[up]},(_,k)=>k===0?t:tok());
    if(arr.some(x=>x===null||cmd.test(x)||!Number.isFinite(Number(x))))throw Error('Invalid numeric token @'+i);
    records.push([cur,...arr]);
    if(cur==='M'||cur==='m')cur=cur==='M'?'L':'l';
  }
  return records;
}
function numLex(s) {
  if(/[eE]/.test(s))return s; // No changes to exponents.
  const q=s.replace(/^([+-]?)0\.(?=\d)/,'$1.').replace(/\.(\d*?)0+$/,(m,d)=>d?'.'+d:'').replace(/^([-+]?)\.$/,'$10').replace(/\.$/,'');
  const z = q==='-'||q==='+'||q==='' ? q+'0' : q;
  if(!Object.is(Number(s),Number(z)))throw Error('Numeric token value changed: '+s+'=>'+z);
  return z;
}
const perStr=new Map();
function normalize(d) {
  const known=perStr.get(d); if(known)return known;
  const a=parse(d);
  let lastCmd='', prev='', text='';
  for(const [c,...xs] of a){
    if(c!==lastCmd || /^[MmZz]$/.test(c)){
      text+=c;prev='';
    }
    lastCmd=c==='M'?'L':c==='m'?'l':c;
    for(const q of xs){
      const t=numLex(q);
      if(prev){
        const u=(prev+t).match(num)?.[0];
        if(u!==prev)text+=' ';
      }
      text+=t;prev=t;
    }
  }
  if(text.length>d.length||protectedStrings.has(d))text=d;
  const b=parse(text);
  if(a.length!==b.length||a.some((x,i)=>x[0]!==b[i][0]||x.length!==b[i].length||x.slice(1).some((t,j)=>!Object.is(Number(t),Number(b[i][j+1])))))throw Error('Exact numeric/command identity failed');
  const out={text,ep:a.filter(x=>!/^[Zz]$/.test(x[0])).length,n:a.length,c:a.filter(x=>/^[CcSs]$/.test(x[0])).length,closed:a.filter(x=>/^[Zz]$/.test(x[0])).length};
  perStr.set(d,out);return out;
}
let geometryRefs=0;
for(const a of decoded){
  if(!ids.has(a.id))continue;
  const seen=new Set, ownerStock=Buffer.byteLength(JSON.stringify(a)), o={endpoints:0,commands:0,cubicSegments:0,closedContours:0,changedStrings:0,drawUniqueStrings:0,drawRefTextSaved:0};
  const visit=n=>{
    if(n.tag==='path'){
      for(const key of ['d','dParts']){
        const old=n[key];if(old===undefined)continue;
        if(n.stroke!=='none')throw Error('unexpected stroke');
        const parts=Array.isArray(old)?old:[old];
        const result=parts.map(d=>{
          const q=normalize(d);geometryRefs++;o.drawRefTextSaved+=d.length-q.text.length;
          if(!seen.has(d)) { seen.add(d);o.endpoints+=q.ep;o.commands+=q.n;o.cubicSegments+=q.c;o.closedContours+=q.closed;o.changedStrings+=q.text!==d?1:0; }
          return q.text;
        });
        n[key]=Array.isArray(old)?result:result[0];
      }
    } else if(n.tag==='g')for(const node of n.children??[])visit(node);
    else if (n.tag!=='use')throw Error('unknown vector tag');
  };
  visit(a.vector.root);for(const symbol of Object.values(a.vector.symbols??{}))visit(symbol);
  o.drawUniqueStrings=seen.size;
  data.push({id:a.id,before:ownerStock,after:Buffer.byteLength(JSON.stringify(a)),...o});
}
function assertSynch(a,b,p='') {
  if(typeof a==='string' && /\.(d|dParts\.\d+)$/.test(p) && !p.includes('.clips.')) {
    if(normalize(a).text!==b)throw Error('unauthorized paint grammar output: '+p);
    return;
  }
  if(a===null||typeof a!=='object'){if(!Object.is(a,b))throw Error('not same '+p);return;}
  if(JSON.stringify(Object.keys(a))!==JSON.stringify(Object.keys(b)))throw Error('not same object shape '+p);
  for(const [k,v] of Object.entries(a))assertSynch(v,b[k],p+'.'+k);
}
if(decoded.length!==15||data.length!==4)throw Error('active owner count');
for(let i=0;i<decoded.length;i++){
  if (ids.has(stock[i].id))assertSynch(stock[i],decoded[i],stock[i].id);
  else if(JSON.stringify(stock[i])!==JSON.stringify(decoded[i]))throw Error('non-target payload');
}

return {decoded,data,ids,sharedProtectedUniqueDrawPaths:[...perStr].filter(([d])=>protectedStrings.has(d)).length};
}
