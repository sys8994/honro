import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,join,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

export const ID='family24:retaining-earth-faces', SLOT='family24-front6-east-return';
const BASE='b79ea7fd87fda5586d78eae0a7052996b8e71fb5';
const CAMPAIGN='shared/data/campaign.json';
const AUTHOR='tools/map-forge/stage24-family-compound.mjs';
const COMPILER='tools/environment/build-act2-art.mjs';
const gitIDs={[CAMPAIGN]:'edaf31a5fda2b7db0202bc0efb52dd83e54f6b9e',[AUTHOR]:'514274cdcdaf2968bfe9371272a6f56e273b9c72',[COMPILER]:'0cc5c5bb0c19fa5b1885e947f7063b7e595122c9'};
const FACE='M6410 2452 L7000 2452 L6977 2590 L6453 2572 Z';
const EDGE='M6996.333333333333 2474 L7030 2471 L7030 2610 L6917 2610 L6929 2588 L6945 2570 L6952 2552 L6965 2540 L6958 2521 L6975 2506 L6976 2492 Z';
const FILL='#485b4a', STOCK='#5b6756';
const svg=(d,c)=>'<path d="'+d+'" fill="'+c+'"/>';
const defs='<defs><clipPath id="'+SLOT+'">'+svg(EDGE,'#ffffff')+'</clipPath></defs>';
const fac=(a,b)=>'<g>'+a+'<g clip-path="url(#'+SLOT+')">'+b+'</g></g>';
const oldAuthor=" let faces='';for(const [x,y,w,h]of [[1720,2460,950,155],[4700,2260,520,210],[6410,2440,590,150]]){\n faces+=P([[x,y+12],[x+w,y+12],[x+w-23,y+h],[x+43,y+h-18]],'#5b6756')+";
const newAuthor=" let faces="+JSON.stringify(defs)+";for(const [x,y,w,h]of [[1720,2460,950,155],[4700,2260,520,210],[6410,2440,590,150]]){\n const body=[[x,y+12],[x+w,y+12],[x+w-23,y+h],[x+43,y+h-18]],stock=P(body,'#5b6756');\n faces+=(x===6410?"+JSON.stringify('<g>')+"+stock+"+JSON.stringify('<g clip-path="url(#'+SLOT+')">')+"+P(body,'"+FILL+"')+"+JSON.stringify('</g></g>')+":stock)+";
const sha=x=>createHash('sha256').update(x).digest('hex');
const equal=(x,y)=>assert.equal(JSON.stringify(x),JSON.stringify(y));
const one=(s,p,v)=>{assert(s.split(p).length===2,('expected only one literal patch site '+p.slice(0,85)));return s.replace(p,v);};

export function mutateAuthor(raw){return one(raw,oldAuthor,newAuthor);}
export function mutateVector(old,compileSVG){
  assert.equal(sha(JSON.stringify(old)),'098b7fdac911fc6aa5de83c943ee47234bddcbb28bf48ab3514ef2cbd0a39a72');
  equal(compileSVG(old.source),old);
  assert.equal(old.root.children.length,9);
  equal(old.root.children[6],{tag:'path',fill:STOCK,d:FACE});
  assert.equal(old.root.children[8].d,'M6410 2444 L7000 2444');
  assert(!old.clips&&old.source.indexOf(SLOT)<0);
  const source=one(old.source,svg(FACE,STOCK),fac(svg(FACE,STOCK),svg(FACE,FILL)))
    .replace(/^(<svg[^>]+>)/,(_,head)=>head+defs);
  const candidate=compileSVG(source);
  const check=structuredClone(candidate);
  equal(check.root.children.splice(6,1,{...old.root.children[6]})[0],{tag:'g',children:[old.root.children[6],{tag:'g',clipPath:SLOT,children:[{tag:'path',fill:FILL,d:FACE}]}]});
  equal(check.clips,{[SLOT]:[EDGE]});delete check.clips;
  assert.equal(check.source,source);check.source=old.source;
  equal(check,old);
  return candidate;
}
const ws=(s,i)=>{while(i<s.length&&(s[i]===' '||s[i]==='\n'||s[i]==='\r'||s[i]==='\t'))i++;return i;};
function stringEnd(s,i){
 assert.equal(s[i],'"');
 for(let j=i+1;j<s.length;j++){
  if(s[j]==='"')return j+1;
  if(s[j]==='\\')j++;
 }
 throw Error('unterminated JSON string');
}
function valueEnd(s,i){
 const c=s[i];assert(c!==undefined);
 if(c==='"')return stringEnd(s,i);
 if(c==='{'||c==='['){
  const open=[c==='{'?'}':']'];
  for(let j=i+1;j<s.length;j++){
   const q=s[j];
   if(q==='"'){j=stringEnd(s,j)-1;continue;}
   if(q==='{'||q==='['){open.push(q==='{'?'}':']');continue;}
   if(q==='}'||q===']'){assert.equal(open.pop(),q,'unbalanced JSON value');if(!open.length)return j+1;}
  }
  throw Error('unterminated compound JSON value');
 }
 let j=i;
 for(;j<s.length;j++){const q=s[j];if(q===','||q==='}'||q===']'||q===' '||q==='\t'||q==='\r'||q==='\n')break;}
 assert(j>i,'expected scalar value');
 return j;
}
function members(s,start,end){
 assert.equal(s[start],'{');assert.equal(s[end-1],'}');
 const rows=[];let i=ws(s,start+1);
 while(i<end-1){
  const j=stringEnd(s,i),key=JSON.parse(s.slice(i,j)),colon=ws(s,j);
  assert.equal(s[colon],':');const from=ws(s,colon+1),to=valueEnd(s,from);
  rows.push({key,keyAt:i,from,to});
  i=ws(s,to);if(i===end-1)break;
  assert.equal(s[i],',');i=ws(s,i+1);assert(i<end-1,'trailing comma in object');
 }
 assert.equal(i,end-1);
 return rows;
}
function unique(rows,key){
 const filtered=rows.filter(row=>row.key===key);
 assert.equal(filtered.length,1,'expected one decoded member '+key);
 return filtered[0];
}
function arrayOwner(s,{from,to},target,length){
 assert.equal(s[from],'[');assert.equal(s[to-1],']');
 let start=ws(s,from+1),i=0,range;
 while(start<to-1){
  const end=valueEnd(s,start);
  if(i===target)range={start,end};
  i++;start=ws(s,end);if(start===to-1)break;
  assert.equal(s[start],',');start=ws(s,start+1);assert(start<to-1,'trailing comma in library');
 }
 assert.equal(start,to-1);assert.equal(i,length);assert(range);
 return range;
}
function formatSlice(raw,span,candidate){
 const token=raw.slice(span.from,span.to);
 const localIndent=/(\r?\n)([ \t]+)"/.exec(token);
 const lineAt=raw.lastIndexOf('\n',span.keyAt-1)+1, base=raw.slice(lineAt,span.keyAt);
 if(localIndent&&/^[ \t]*$/.test(base)&&localIndent[2].startsWith(base)){
  const indent=localIndent[2].slice(base.length);
  if(indent.length>=1&&indent.length<=10)return JSON.stringify(candidate,null,indent).replace(/\n/g,localIndent[1]+base);
 }
 return JSON.stringify(candidate);
}
function scopedVectorSplice(raw,project,index,old,compiled){
 const head=ws(raw,0),tail=valueEnd(raw,head);assert.equal(ws(raw,tail),raw.length);
 const lib=unique(members(raw,head,tail),'library'), row=arrayOwner(raw,lib,index,project.library.length);
 const fields=members(raw,row.start,row.end),id=unique(fields,'id'),v=unique(fields,'vector');
 assert.equal(JSON.parse(raw.slice(id.from,id.to)),ID);
 assert.deepEqual(JSON.parse(raw.slice(row.start,row.end)),old);
 const prior=raw.slice(v.from,v.to);
 assert.deepEqual(JSON.parse(prior),old.vector);
 const replacement=formatSlice(raw,v,compiled),next=raw.slice(0,v.from)+replacement+raw.slice(v.to);
 const midEnd=v.from+replacement.length;
 assert.equal(next.slice(v.from,midEnd),replacement);
 assert(Buffer.from(next.slice(0,v.from)+prior+next.slice(midEnd),'utf8').equals(Buffer.from(raw,'utf8')),'reverse vector splice must restore exact campaign bytes');
 return {next,splice:{index,oldBytes:Buffer.byteLength(prior),newBytes:Buffer.byteLength(replacement),offsetBytes:Buffer.byteLength(raw.slice(0,v.from)),oldSliceSHA256:sha(prior),newSliceSHA256:sha(replacement),reverseRestoresOriginalBytes:true}};
}
export function mutateCampaign(raw,compileSVG){
 const project=JSON.parse(raw);assert(Array.isArray(project.library)&&Array.isArray(project.stages));
 const indices=project.library.map((v,i)=>v?.id===ID?i:-1).filter(i=>i>=0);
 assert.equal(indices.length,1,'expected one decoded Stage24 library owner');
 const index=indices[0],old=project.library[index],donor=project.library.find(x=>x.id==='family24:terrain-material');
 assert.equal(donor.vector.root.children[7].fill,FILL);assert.equal(old.collision.length,0);
 const refs=project.stages.filter(s=>s.elements.some(e=>e.assetId===ID));
 assert.equal(refs.length,1);assert.equal(refs[0].metadata.stageId,24);
 const built={...old,vector:mutateVector(old.vector,compileSVG)};
 const {next,splice}=scopedVectorSplice(raw,project,index,old,built.vector),check=JSON.parse(next);
 equal(check.library[index],built);check.library[index]=old;
 assert.deepEqual(check,project,'only the uniquely selected art vector may change');
 return {next,built,splice};
}
async function main(){
 const work=resolve(process.argv[2]), dir=join(work,'B');
 assert(work.startsWith(resolve(process.env.RUNNER_TEMP)+sep));
 const git=(...cmd)=>execFileSync('git',['-C',dir,...cmd],{encoding:'utf8'}).trim();
 assert.equal(git('rev-parse','HEAD'),BASE);assert.equal(git('branch','--show-current'),'');
 assert.equal(git('status','--porcelain=v1','-uno'),'');
 for(const [p,blob] of Object.entries(gitIDs))assert.equal(git('hash-object',p),blob);
 const compileSVG=(await import(pathToFileURL(join(dir,COMPILER)))).compileSVG;
 const raw=await readFile(join(dir,CAMPAIGN));
 const decoded=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(raw);
 assert(Buffer.from(decoded,'utf8').equals(raw));
 const next=mutateCampaign(decoded,compileSVG);
 const a=mutateAuthor(await readFile(join(dir,AUTHOR),'utf8'));
 await writeFile(join(dir,CAMPAIGN),next.next);await writeFile(join(dir,AUTHOR),a);
 const status=git('diff','--name-only').split('\n').sort();equal(status,[CAMPAIGN,AUTHOR].sort());
 await writeFile(join(work,'out','CANDIDATE-SOURCE.json'),JSON.stringify({scope:'scratch product authors bytes, no remote and original source immutable',old:gitIDs,after:Object.fromEntries(status.map(p=>[p,git('hash-object',p)])),canonicalVectorSplice:next.splice,registeredVectorHash:sha(JSON.stringify(next.built.vector)),registeredVector:next.built.vector,facet:{id:SLOT,d:EDGE,stock:STOCK,fill:FILL}},null,2)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e);process.exitCode=1;});
