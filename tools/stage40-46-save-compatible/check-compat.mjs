import fs from 'node:fs';import vm from'node:vm';
import {resolve,join}from'node:path'; import{pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
const t=import.meta.dirname, pins=JSON.parse(fs.readFileSync(t+'/PINS.json','utf8'));
const args=process.argv.slice(2),mode=args.shift(),[A,B,output]=args.map(p=>resolve(p));
const text=(r,k)=>fs.readFileSync(join(r,k),'utf8'),h=s=>createHash('sha256').update(s).digest('hex'),n=(v,m)=>{if(!v)throw Error(m)};
if(mode==='author'){
 const p='shared/data/terrain-path-optimization.json',raw=text(B,p),rows=pins.saveRows40;
 n(h(raw)===pins.expectedStage40Source.newManifestSHA256,'exact geometric normal candidate required');
 let dep=0,s=-1,q=false,e=false,last=0,out='';const seen=new Set();
 for(let i=0;i<raw.length;i++){
  const c=raw[i];
  if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;continue}
  if(c==='"'){q=true;continue}
  if(c==='['||c==='{'){if(c==='{'&&dep===1)s=i;dep++}
  if(c===']'||c==='}'){dep--;
   if(c==='}'&&dep===1){const frag=raw.slice(s,i+1),row=JSON.parse(frag),x=rows[row.id];if(x){
    n(!seen.has(row.id)&&JSON.stringify(row.act4??null)===JSON.stringify(x.before),'unexpected old exact metadata '+row.id);
    out+=raw.slice(last,s)+JSON.stringify({...row,act4:x.act4});last=i+1;seen.add(row.id);
   }}
  }
 }
 n(!dep&&!q&&seen.size===4,'complete exactly four lineage records');out+=raw.slice(last);
 n(h(out)===pins.optimizerAfterAliasSHA256,'exact expected source register hash');
 fs.writeFileSync(join(B,p),out);
}else if(mode==='modules'){
 const m=['A','B'].map((_,i)=>JSON.parse(text(i?B:A,'web/manifest.json')));
 const [oa,ob]=m.map(x=>x.common.filter(k=>/ordered-common-(4|12)\./.test(k)));
 n(JSON.stringify(oa)===JSON.stringify(pins.stockBuiltCommon)&&ob.length===2,'ordered module identity');
 const unit=(raw,k)=>{const a=raw.split('await yieldIfNeeded();'),match=a.map((x,i)=>[x,i]).filter(([x])=>x.includes(k));n(match.length===1,'unique compiled module '+k);return {list:a,i:match[0][1],s:match[0][0]}};
 const min=await import(pathToFileURL(join(B,'node_modules/terser/main.js')));
 const p='shared/runtime/profile-store.js';
 const profile=async k=>{const source=text(k,p);const r=await min.minify("(()=>{\n'use strict';\n"+source+"\n})();\nawait yieldIfNeeded();",{module:true,compress:false,mangle:false,format:{comments:false}});return r.code.split("await yieldIfNeeded();")[0]};
 const a4=unit(text(A,oa[0]),'G.HonroProfileStore='),b4=unit(text(B,ob[0]),'G.HonroProfileStore=');
 const aa=await profile(A),bb=await profile(B);
 n(a4.s===aa&&b4.s===bb&&a4.i===b4.i,'exact stock/candidate compiled profile body mismatch');
 const mask=x=>x.list.map((s,j)=>j===x.i?'APPROVED-SECTION':s);
 n(JSON.stringify(mask(a4))===JSON.stringify(mask(b4)),'additional code moved in profile chunk');
 const token='globalThis.HONRO_PREVIOUS_TERRAIN_ART=';
 const cut=(r)=>{
  const v=unit(r,token),pos=v.s.indexOf(token)+token.length;
  const end=v.s.lastIndexOf('})();');n(end>pos,'missing registry boundary');
  const before=v.s.slice(0,pos),after=v.s.slice(end),record=v.s.slice(pos,end).replace(/;$/,'');
  return {v,before,after,record,value:vm.runInNewContext('('+record+')',{}, {timeout:1000})};
 };
 const a12=cut(text(A,oa[1])),b12=cut(text(B,ob[1]));
 n(a12.before===b12.before&&a12.after===b12.after&&a12.v.i===b12.v.i&&JSON.stringify(mask(a12.v))===JSON.stringify(mask(b12.v)),'outside registry compiled code changed');
 for(const [k,v]of Object.entries(pins.saveRows33))n(JSON.stringify(a12.value[k])===JSON.stringify(v)&&JSON.stringify(b12.value[k])===JSON.stringify(v),'Stage33 emergency registry drift '+k);
 const prior=Object.assign({},a12.value);
 for(const [k,v]of Object.entries(pins.saveRows40)){
  n(JSON.stringify(prior[k]??null)===JSON.stringify(v.before),'stock actual Stage40 alias previous drift');
  prior[k]=v.act4;
 }
 const canon=x=>JSON.stringify(Object.fromEntries(Object.entries(x).sort()));
 n(canon(prior)===canon(b12.value),'any unrelated provider aliases drift');
 fs.writeFileSync(output,JSON.stringify({status:'EXACT_COMPILED_PROFILE_AND_FOUR_ACT4_LINEAGES_ONLY',oldModules:oa,newModules:ob,oldProfile:h(aa),newProfile:h(bb),verifiedUnchangedStage33:pins.saveRows33},null,2)+'\n');
}else throw new Error('unused mode');
