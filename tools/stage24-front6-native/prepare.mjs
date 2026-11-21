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
function lexicalReplaceAsset(raw,old,candidate){
 const anchor='"id": "'+ID+'"';
 assert(raw.split(anchor).length===2);
 const middle=raw.indexOf(anchor);
 const match=/\n([ ]+)\{\s*$/.exec(raw.slice(Math.max(0,middle-80),middle));
 assert(match&&match[1].length>=2&&match[1].length<=20);
 const lead='\n'+match[1];
 const format=o=>JSON.stringify(o,null,2).replace(/\n/g,lead);
 const oldString=format(old),newString=format(candidate);
 const out=one(raw,oldString,newString);
 assert.equal(one(out,newString,oldString),raw);
 return out;
}
export function mutateCampaign(raw,compileSVG){
 const project=JSON.parse(raw), entries=project.library.filter(v=>v.id===ID);
 assert.equal(entries.length,1);const old=entries[0],donor=project.library.find(x=>x.id==='family24:terrain-material');
 assert.equal(donor.vector.root.children[7].fill,FILL);assert.equal(old.collision.length,0);
 const refs=project.stages.filter(s=>s.elements.some(e=>e.assetId===ID));
 assert.equal(refs.length,1);assert.equal(refs[0].metadata.stageId,24);
 const built={...old,vector:mutateVector(old.vector,compileSVG)};
 const next=lexicalReplaceAsset(raw,old,built), check=JSON.parse(next);
 equal(check.stages,project.stages);check.library[project.library.indexOf(old)]=old;
 equal(check,project);
 return {next,built};
}
async function main(){
 const work=resolve(process.argv[2]), dir=join(work,'B');
 assert(work.startsWith(resolve(process.env.RUNNER_TEMP)+sep));
 const git=(...cmd)=>execFileSync('git',['-C',dir,...cmd],{encoding:'utf8'}).trim();
 assert.equal(git('rev-parse','HEAD'),BASE);assert.equal(git('branch','--show-current'),'');
 assert.equal(git('status','--porcelain=v1','-uno'),'');
 for(const [p,blob] of Object.entries(gitIDs))assert.equal(git('hash-object',p),blob);
 const compileSVG=(await import(pathToFileURL(join(dir,COMPILER)))).compileSVG;
 const next=mutateCampaign(await readFile(join(dir,CAMPAIGN),'utf8'),compileSVG);
 const a=mutateAuthor(await readFile(join(dir,AUTHOR),'utf8'));
 await writeFile(join(dir,CAMPAIGN),next.next);await writeFile(join(dir,AUTHOR),a);
 const status=git('diff','--name-only').split('\n').sort();equal(status,[CAMPAIGN,AUTHOR].sort());
 await writeFile(join(work,'out','CANDIDATE-SOURCE.json'),JSON.stringify({scope:'scratch product authors bytes, no remote and original source immutable',old:gitIDs,after:Object.fromEntries(status.map(p=>[p,git('hash-object',p)])),registeredVectorHash:sha(JSON.stringify(next.built.vector)),registeredVector:next.built.vector,facet:{id:SLOT,d:EDGE,stock:STOCK,fill:FILL}},null,2)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e);process.exitCode=1;});
