import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const spec=JSON.parse(fs.readFileSync(new URL('./RECIPE.json',import.meta.url),'utf8'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const blob=x=>crypto.createHash('sha1').update('blob '+x.length+'\0').update(x).digest('hex');
const js=JSON.stringify, clone=structuredClone;
const leaf=['vector','root','children',0,'children',0,'children'];
const ownerP=['assets',spec.sourceSlot],rootP=[...ownerP,...leaf];
function lexicalSpans(input, wanted) {
  let i=0;const loc=new Map();
  function white(){while(i<input.length&&/[\n\r\t ]/.test(input[i]))i++;}
  function string(){const l=i;assert.equal(input[i++],'"');while(i<input.length){
    const c=input[i++];if(c==='"')return input.slice(l,i);if(c==='\\')i++;
  }throw Error('Unterminated JSON string');}
  function node(path) {
    white();const l=i,c=input[i];let ending;
    if(c==='"')string();
    else if(c==='{'||c==='['){const obj=c==='{';ending=obj?'}':']';let n=0;i++;white();
     while(input[i]!==ending){let sub;
      if(obj){sub=JSON.parse(string());white();assert.equal(input[i++],':');}else sub=n++;
      node([...path,sub]);white();if(input[i]===ending)break;assert.equal(input[i++],',');white();
     }assert.equal(input[i++],ending);
    }else {const m=/^(?:true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(input.slice(i,i+60));assert(m);i+=m[0].length;}
    const k=js(path);if(wanted.has(k)){assert(!loc.has(k));loc.set(k,[l,i]);}
  }
  node([]);white();assert.equal(i,input.length);assert.equal(loc.size,wanted.size);return loc;
}
const pick=(x,path)=>path.reduce((v,k)=>v[k],x);
function onlyOnce(x,[old,v]){
 assert.equal(x.split(old).length,2,'edited tuple is not unique');
 return x.replace(old,v);
}
function splitCompound(value,newSizes) {
 const all=[];for(const n of newSizes){all.push(value.slice(0,n));value=value.slice(n);
  if(all.length<newSizes.length){assert.equal(value[0],' ');value=value.slice(1);}
 }
 assert.equal(value,'');return all;
}
export function applySignedStage33(input) {
 assert.equal(input.length,spec.source.bytes,'wrong authored provider bytes');
 assert.equal(sha(input),spec.source.sha256,'wrong authored provider SHA');
 assert.equal(blob(input),spec.source.git,'wrong authored provider Git blob');
 const raw=input.toString('utf8'), old=JSON.parse(raw), idx=spec.sourceSlot,x=old.assets[idx];
 assert.equal(x.id,spec.owner);assert.equal(sha(js(x)),spec.ownerStock,'compiled owner lineage missing');
 assert.deepEqual(old.worldSize,[6912,4608]);assert.equal(old.assets.length,5);
 assert.deepEqual(x.anchor,{x:0,y:0});assert.deepEqual(x.collision,[]);assert(!x.interactionType);
 assert.deepEqual(x.bounds,{x:-3300,y:-300,w:14000,h:5600});
 assert.deepEqual(x.vector.viewBox,[-3300,-300,14000,5600]);
 assert.equal(x.vector.root.clipPath,'native-source-alpha');
 assert.equal(Object.keys(x.vector.clips).length,1);assert.equal(x.vector.clips['native-source-alpha'].length,1);
 const y=clone(old),next=y.assets[idx],p=pick(next,leaf);
 assert.equal(p.length,12);
 assert.deepEqual([0,1,10,11].map(j=>p[j].fill),['#62594c','#b6a390','#413e3a','#393a3b']);
 assert([0,1,10,11].every(j=>p[j].stroke==='none'));
 const edits=[];
 const set=(path,value)=>{const at=path.slice(0,-1);pick(y,at)[path.at(-1)]=value;edits.push({path,replace:js(value)});};
 set([...ownerP,'bounds','h'],spec.hBeforeAfter[1]);
 set([...ownerP,'vector','viewBox',3],spec.hBeforeAfter[1]);
 const cp=[...ownerP,'vector','clips','native-source-alpha',0];
 set(cp,onlyOnce(pick(old,cp),spec.clipDiff));
 for(const j of [0,1])set([...rootP,j,'d'],onlyOnce(p[j].d,spec.twoFillDiff));
 for(const [k,j] of [10,11].entries()){
   assert.deepEqual(p[j].dParts.map(x=>x.length),spec.compoundOldLengths[k]);
   const s=onlyOnce(p[j].dParts.join(' '),spec.twoCompoundFillDiff);
   const q=splitCompound(s,spec.compoundNewLengths[k]);
   assert.equal(q.join(' '),s);
   set([...rootP,j,'dParts'],q);
 }
 assert.equal(spec.appendFacets.length,14);p.push(...spec.appendFacets);
 edits.push({path:rootP,append:','+spec.appendFacets.map(js).join(',')});
 assert.equal(sha(js(next)),spec.ownerTarget,'candidate does not equal reviewed local native owner');
 const loc=lexicalSpans(raw,new Set(edits.map(e=>js(e.path))));
 const ops=edits.map(e=>{const [a,b]=loc.get(js(e.path));if(e.append){assert.equal(raw[b-1],']');return [b-1,b-1,e.append]};return [a,b,e.replace];}).sort((a,b)=>a[0]-b[0]);
 let cur=0,newSource='',unmodifiedBytes=0;
 for(const [s,t,n] of ops){assert(s>=cur);newSource+=raw.slice(cur,s)+n;unmodifiedBytes+=Buffer.byteLength(raw.slice(cur,s));cur=t;}
 newSource+=raw.slice(cur);unmodifiedBytes+=Buffer.byteLength(raw.slice(cur));assert.deepEqual(JSON.parse(newSource),y);
 const rev=clone(y);rev.assets[idx]=x;assert.deepEqual(rev,old,'provider other than sole expected lowland affected');
 const result=Buffer.from(newSource);
 return {result,receipt:{source:spec.source,target:{sha256:sha(result),git:blob(result),bytes:result.length,ownerHash:spec.ownerTarget},originalLiteralBytesPreserved:unmodifiedBytes,edits:edits.map(x=>x.path),noRuntimeChanges:true}};
}
if(import.meta.url===new URL('file:'+fs.realpathSync(process.argv[1])).href){
 assert.equal(process.argv.length,4,'Usage: node signed-apply.mjs EXACT_INPUT ABSENT_OUTPUT');
 const q=applySignedStage33(fs.readFileSync(process.argv[2]));
 fs.writeFileSync(process.argv[3],q.result,{flag:'wx'});console.log(js(q.receipt));
}
