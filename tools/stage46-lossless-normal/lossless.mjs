import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const [sourceFolder,outFolder]=process.argv.slice(2);if(!sourceFolder||!outFolder||resolve(sourceFolder)===resolve(outFolder))throw Error('separate source and output directories required');
const dir=pathToFileURL(resolve(outFolder)+'/'),source=pathToFileURL(resolve(sourceFolder)+'/'),stage=['body',...[1,2,3,4,5].map(i=>'part-'+i)].map(i=>'stage46-exterior-'+i+'.json'),r=f=>readFileSync(new URL(f,source),'utf8'),h=x=>createHash('sha256').update(x).digest('hex');
mkdirSync(dir,{recursive:true});
const NUM=/[-+]?(?:\d*\.?\d+)(?:[eE][-+]?\d+)?/g;
const c=/([MLCZ])([^MLCZ]*)/g;
const t=/[MLCZ]|[-+]?(?:\d*\.?\d+)(?:[eE][-+]?\d+)?/y;
function parse(s){
 let out=[],cmd='',last=0,arity={M:2,L:2,C:6,Z:0};t.lastIndex=0;
 function tok(){
  while(/[\x20\t\r\n,]/.test(s[t.lastIndex]??''))t.lastIndex++;
  last=t.lastIndex;if(t.lastIndex===s.length)return null;
  let m=t.exec(s);if(!m)throw Error('parse '+last);return m[0];
 }
 let x;
 while((x=tok())!==null){
  if(x in arity){cmd=x;if(cmd==='Z'){out.push(['Z']);cmd='';continue;}x=tok();}
  if(!(cmd in arity)||x===null||x in arity)throw Error('arity '+last);
  let a=Array.from({length:arity[cmd]},(_,i)=>i===0?x:tok());
  if(a.some(q=>q===null||q in arity||!Number.isFinite(Number(q))))throw Error('number '+last);
  out.push([cmd,...a.map(Number)]);
  if(cmd==='M')cmd='L';
 }
 return out;
}
function norm(s){
 let prev='', o=[];
 for(let m of s.matchAll(c)){
  const g=m[1],ns=(m[2].match(NUM)??[]).map(n=>n.replace(/^(-?)0\./,'$1.')); 
  if(g==='Z'){o.push('Z');prev=g;continue;}
  const letter=g===prev&&['L','C'].includes(g)?'':g;
  if(letter)o.push(letter);
  for(let i=0;i<ns.length;i++)o.push(((!i&&letter)||ns[i].startsWith('-')||ns[i].startsWith('+')?'':' ')+ns[i]);
  prev=g;
 }
 const d=o.join(''),A=parse(s),B=parse(d);
 if(A.length!==B.length||A.some((a,i)=>a.length!==B[i].length||a.some((z,j)=>!Object.is(z,B[i][j]))))throw Error('negative zero or geometry drift');
 return [d,A.length,A.filter(r=>r[0]!=='Z').length];
}
const receipt=[];
for(let file of stage){
 const old=r(file), a=JSON.parse(old),n=[], bytes=[]; let slots=0;
 const v=x=>{if(x.tag==='path'){slots++;for(let key of ['d','dParts']){
  if(x[key]===undefined)continue;
  let list=Array.isArray(x[key])?x[key]:[x[key]];
  let arr=list.map(d=>{let [z,k,y]=norm(d);n.push(y);bytes.push(d.length-z.length);return z;});
  x[key]=Array.isArray(x[key])?arr:arr[0];
 }}for(const y of x.children??[])v(y);};
 v(a.vector.root);
 const after=JSON.stringify(a)+'\n';writeFileSync(new URL(file,dir),after);
 receipt.push({file,oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(after),textSaved:bytes.reduce((x,y)=>x+y,0),preservedEndpoints:n.reduce((x,y)=>x+y,0),slots,unchangedNonGeometry:'Only d/dParts strings (including unchanged leaves/slots) visited; same expanded numeric/command stream including signed zero and closures',sha256:h(after)});
}
console.log(JSON.stringify(receipt,null,2));
