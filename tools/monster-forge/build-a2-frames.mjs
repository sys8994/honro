import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {FRAME_HASHES,POSE_MAPS} from './a2-frame-policy.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sha=b=>createHash('sha256').update(b).digest('hex');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const assert=(ok,message)=>{if(!ok)throw Error('A2 frame validation: '+message);};
export function countPath(d){
 assert(typeof d==='string'&&d.length>0&&!/[^MLCQZ\d.,\s+-]/.test(d),'unsupported path command');
 let anchors=0,controls=0,subpaths=0;const parts=[...d.matchAll(/([MLCQZ])([^MLCQZ]*)/g)];
 assert(parts[0]?.[1]==='M','path must start with M');
 for(const [,cmd,args] of parts){const nums=args.match(/[-+]?(?:\d*\.)?\d+/g)||[];assert(args.replace(/[-+]?(?:\d*\.)?\d+/g,'').match(/^[,\s]*$/),'bad numeric syntax');assert(nums.every(n=>Number.isFinite(+n)&&Math.abs(+n)<1000),'nonfinite/unbounded coordinate');const n=nums.length,arity={M:2,L:2,Q:4,C:6,Z:0}[cmd];assert(arity?n>0&&n%arity===0:n===0,'bad path arity');if(cmd==='M')subpaths++;if(arity)anchors+=n/arity;if(cmd==='Q')controls+=n/4;if(cmd==='C')controls+=n/3;}
 return {anchors,controls,subpaths};
}
export function parseCanonicalSvg(text){
 // The selected Inkscape-normalized files deliberately use a tiny, closed XML grammar.
 // Reject everything else rather than silently dropping scripts/styles/images/transforms.
 assert(text.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-85 -150 230 160">')&&text.endsWith('</svg>'),'noncanonical SVG root');
 let body=text.slice(text.indexOf('>')+1,-6);const paths=[];
 while(body.length){const m=body.match(/^<path id="([\w-]+)" d="([MLCQZ\d.,\s+-]+)" fill="(#[a-fA-F0-9]{6})"\s*\/>/);assert(m,'unsupported SVG content');paths.push({id:m[1],d:m[2],fill:m[3],...countPath(m[2])});body=body.slice(m[0].length);}
 assert(new Set(paths.map(p=>p.id)).size===paths.length,'duplicate path id');return paths;
}
export async function validateA2Frames(dir=path.join(ROOT,'shared/assets/monsters/a2-selected')){
 const manifest=JSON.parse(await readFile(path.join(dir,'manifest.json'),'utf8'));
 assert(manifest.version===1&&manifest.baseHeight===128&&same(manifest.viewBox,[-85,-150,230,160])&&same(manifest.footPivot,[0,0]),'common coordinate contract changed');
 assert(same(manifest.poseMaps,POSE_MAPS),'pose map changed');
 const expected=Object.keys(FRAME_HASHES).sort(),actual=manifest.assets.map(r=>r.id).sort();assert(same(expected,actual),'exact16 allowlist mismatch');
 const disk=(await readdir(dir)).filter(f=>f.endsWith('.svg')).sort();assert(same(disk,expected.map(id=>id+'.svg').sort()),'unexpected/missing SVG on disk');
 const assets={},rows=[];let totalBytes=0;
 for(const row of manifest.assets){
  assert(row.file===row.id+'.svg'&&row.sha256===FRAME_HASHES[row.id],'unapproved file/hash metadata');
  assert(same(row.footPivot,[0,0])&&row.damageGeometry===null,'foot origin or damage geometry contract changed');
  assert(Array.isArray(row.bounds)&&row.bounds.length===4&&row.bounds.every(Number.isFinite)&&Math.abs(row.bounds[3])<.002,'invalid ground bounds');
  const data=await readFile(path.join(dir,row.file));assert(sha(data)===FRAME_HASHES[row.id],row.id+' source hash changed; explicit review required');
  const paths=parseCanonicalSvg(data.toString('utf8'));const counts={anchors:paths.reduce((s,p)=>s+p.anchors,0),controls:paths.reduce((s,p)=>s+p.controls,0),subpaths:paths.reduce((s,p)=>s+p.subpaths,0),paths:paths.length,colors:new Set(paths.map(p=>p.fill)).size,bytes:data.length};
  for(const k of Object.keys(counts))assert(counts[k]===row[k],row.id+' stale '+k);
  const shadow=row.id.startsWith('eoduksini-'),cap=shadow?{anchors:750,paths:6,colors:6,bytes:30000}:{anchors:2000,paths:9,colors:9,bytes:75000};
  for(const k of Object.keys(cap))assert(counts[k]<=cap[k],row.id+' exceeds selected '+k+' cap');
  const palette=Object.fromEntries(paths.map((p,i)=>['c'+i,p.fill]));
  assets[row.id]={id:row.id,baseHeight:128,viewBox:[-85,-150,230,160],frameProfile:'a2-selected-v1',sourceSha256:row.sha256,visualBounds:row.bounds,footPivot:[0,0],palette,parts:[{id:'root',parent:null,pivot:[0,0],paths:paths.map((p,i)=>({d:p.d,fill:'c'+i,stroke:null,width:0,lod:0}))}],clips:Object.fromEntries(['idle','move','attack','hit','jump_fall'].map(k=>[k,{duration:1,loop:false,tracks:[]}]))};
  totalBytes+=data.length;rows.push({id:row.id,...counts,sha256:row.sha256});
 }
 assert(totalBytes<=500000,'selected total SVG bytes exceeds500000');
 return {manifest,assets,report:{profile:'a2-selected-v1',frames:rows,totalSvgBytes:totalBytes,global350AnchorGateUnchanged:true,liveIntegrationAccepted:false}};
}
export async function buildA2Frames({dir=path.join(ROOT,'shared/assets/monsters/a2-selected'),write=true}={}){
 const {manifest,assets,report}=await validateA2Frames(dir);
 const sourceSha256=sha(JSON.stringify(report.frames.map(({id,sha256})=>[id,sha256])));
 const payload={version:1,assetRevision:manifest.assetRevision,sourceSha256,baseHeight:128,viewBox:manifest.viewBox,footPivot:[0,0],poseMaps:POSE_MAPS,assets};
 const runtime='// Generated by tools/monster-forge/build-a2-frames.mjs. Selected16 only; NOT skeletal animation.\nglobalThis.HONRO_MONSTER_FRAMES='+JSON.stringify(payload)+';\n';
 if(write){const file=path.join(dir,'frames.runtime.js');let current;try{current=await readFile(file,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}if(current!==runtime)await writeFile(file,runtime);}
 return {...report,runtimeBytes:Buffer.byteLength(runtime),sourceSha256,runtime};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const {runtime,...report}=await buildA2Frames({write:!process.argv.includes('--check')});console.log(JSON.stringify(report,null,2));}
