// Stage42 authored visual-only east end-cap. Native vector nodes; no renderer patch.
import {facePath} from './curve.mjs';
import {maskContainsStrict} from './guard.mjs';
export const SCHEMA='honro.stage42.east-cap', CAP_KEY='authoredEastCapV1';
export const TARGET=Object.freeze({stageId:'stage-42',assetId:'act5:near:42',placementId:'a5-near',slot:'edgeWall',bodyId:'act5:stage42:registered-body',scale:3.2146389713155292});
export const SCOPE=Object.freeze({seamX:2298.5,cutoffX:2300,maxX:2324.2701,topY:685,bottomY:825});
export const PALETTE=Object.freeze({upper:'#2f3944',transition:'#222c36',basal:'#1e2a35'});
const C='native-source-alpha', marker='authored-stage42-east-cap-v1', maxBytes=4096;
const approvedRawBody='4a413feb79ba5cabb75a8a3e204bce816548db1c80857e11a9538391625756a8';
const approvedRawClips='6784931b63ee57114f0c90810a16b886eba91d45f868a319178a4ccf4f11cedb';
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const keys=(v,list)=>plain(v)&&Object.keys(v).length===list.length&&list.every(k=>Object.hasOwn(v,k));
const canonical=x=>JSON.stringify(x,(_,v)=>plain(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const bytes=s=>new TextEncoder().encode(s);
const sha=async s=>Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const die=(v,e)=>{if(!v)throw Error(e)};
const copy=structuredClone;
const eq=(a,b)=>canonical(a)===canonical(b);
const id=s=>typeof s==='string'&&/^[a-z][a-z0-9_-]{0,31}$/.test(s);
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
function source(project,attached=false){
 const [asset,stage]=[project?.library?.filter(a=>a.id===TARGET.assetId),project?.stages?.filter(s=>s.id===TARGET.stageId)];
 die(asset?.length===1&&stage?.length===1,'Invalid east-cap owner or stage');
 const owner=asset[0],s=stage[0],users=project.stages.flatMap(q=>q.elements.filter(e=>e.assetId===TARGET.assetId).map(e=>({stage:q.id,e})));
 die(users.length===1&&users[0].stage===TARGET.stageId&&s.metadata?.stageId===42,'East cap requires one exact placement');
 const p=users[0].e,body=owner.edgeWall,v=body?.vector;
 die(p.id===TARGET.placementId&&p.x===0&&p.y===0&&p.scale===TARGET.scale&&p.rotation===0&&p.layer==='structural-back'&&p.depthLayer==='L1'&&p.visualRole==='scenery','East-cap placement or style drift');
 die(body?.id===TARGET.bodyId&&body.params?.semanticLayer==='BODY'&&owner.edgeSurface?.vector&&eq(body.anchor,{x:0,y:0})&&eq(v.viewBox,[-400,0,2700,1175])&&Array.isArray(v.clips?.[C]),'Wrong Stage42 BODY/clip/original surface');
 die(!['authoredBodyReplacementV1','workshopVisibleJoint42','bodyEditorFaces','editorBodyRegions42'].some(k=>Object.hasOwn(body.params,k)),'Other authored BODY mode is not accepted with an east cap');
 die(Object.hasOwn(body.params,CAP_KEY)===attached,'Unexpected east cap state');
 return {owner,stage:s,body,placement:p};
}
async function pin(project,{owner,stage,body}){
 die(await sha(JSON.stringify([body.vector.root,body.vector.clips[C]]))===approvedRawBody&&await sha(JSON.stringify(body.vector.clips))===approvedRawClips,'Pinned original Stage42 vector source changed');
 const {activeStageId:_,...base}=project;
 const [projectSha256,stageSha256,ownerSha256]=await Promise.all([base,stage,owner].map(x=>sha(canonical(x))));
 return {projectSha256,stageSha256,ownerSha256,bodySourceSha256:approvedRawBody,clipsSha256:approvedRawClips};
}
function compile(design){
 die(keys(design,['outline','seams','bands']),'Invalid east cap designer schema');
 const {outline,seams,bands}=design;
 const {seamX,cutoffX,maxX,topY,bottomY}=SCOPE, point=q=>Array.isArray(q)&&q.length===2&&Array.from(q).every(Number.isFinite);
 const outer=(o,i)=>keys(o,['id','at'])&&id(o.id)&&point(o.at)&&o.at[1]>=topY&&o.at[1]<=bottomY&&((i===0||i===outline.length-1)?o.at[0]===seamX:o.at[0]>=cutoffX&&o.at[0]<=maxX);
 die(Array.isArray(outline)&&outline.length>=5&&outline.length<=24&&Array.from(outline).every(outer),'East cap outside approved rail');
 const ids=outline.map(o=>o.id);
 die(new Set(ids).size===ids.length&&outline.every((o,i)=>!i||o.at[1]-outline[i-1].at[1]>=.5),'Unstable or non-monotonic outline');
 die(Array.isArray(seams)&&seams.length===2&&Array.from(seams).every(s=>keys(s,['outerId','atY','knots'])&&id(s.outerId)&&Number.isFinite(s.atY)&&Array.isArray(s.knots)&&s.knots.length<=6&&Array.from(s.knots).every(point)),'Invalid east-cap shared joints');
 const [a,b]=seams.map(s=>ids.indexOf(s.outerId));
 die(a>0&&b>a&&b<outline.length-1,'Invalid east-cap band topology');
 const ys=[outline[0].at[1],seams[0].atY,seams[1].atY,outline.at(-1).at[1]];
 die(ys.every((y,i)=>!i||y-ys[i-1]>=1),'East-cap inner rail crossed');
 const chains=seams.map((s,i)=>[[seamX,s.atY],...s.knots,outline[[a,b][i]].at]);
 die(chains.every(c=>c.every(([x,y],i)=>y>=topY&&y<=bottomY&&Math.abs(y-c[0][1])<=12&&(!i||x-c[i-1][0]>.05))),'Shared east seam exceeds authorized contour');
 const orientation=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
 const crossing=(a,b,c,d)=>[0,1].every(i=>Math.min(a[i],b[i])<=Math.max(c[i],d[i])&&Math.min(c[i],d[i])<=Math.max(a[i],b[i]))&&orientation(a,b,c)*orientation(a,b,d)<=0&&orientation(c,d,a)*orientation(c,d,b)<=0;
 die(!chains[0].slice(1).some((q,i)=>chains[1].slice(1).some((r,j)=>crossing(chains[0][i],q,chains[1][j],r))),'East-cap seams cross or touch');
 die(Array.isArray(bands)&&bands.length===3&&Array.from(bands).every((f,i)=>keys(f,['id','material'])&&id(f.id)&&f.material===Object.keys(PALETTE)[i]),'Unapproved ordered material bands');
 die(new Set([...ids,...bands.map(b=>b.id)]).size===ids.length+bands.length,'Duplicate vertex or band name');
 const capBox=[seamX,topY,maxX-seamX,bottomY-topY], cuts=[0,a,b,outline.length-1];
 const rings=bands.map((_,i)=>{
  const top=i?chains[i-1]:[];
  const bottom=i<2?[...chains[i]].reverse():[];
  // First/last path share exact seam endpoints; remove those duplicate entries.
  return [...top.slice(0,-1),...outline.slice(cuts[i],cuts[i+1]+1).map(o=>o.at),...bottom.slice(1)];
 });
 const area=ps=>ps.reduce((s,a,i)=>s+a[0]*ps[(i+1)%ps.length][1]-a[1]*ps[(i+1)%ps.length][0],0)/2;
 const areas=rings.map(area), total=area(outline.map(o=>o.at));
 die(total>0&&total<=2706&&areas.every(v=>v>0)&&Math.abs(areas.reduce((a,b)=>a+b,0)-total)<1e-6,'East-cap face ownership/area changed');
 const paths=bands.map((band,i)=>({tag:'path',id:band.id,fill:PALETTE[band.material],d:facePath(rings[i].map(point=>({point})),capBox)}));
 return {cap:{tag:'g',id:marker,clipPath:C,children:paths},rings,area:total};
}
export function compileEastCap(design){return compile(design).cap;}
function checkedCap(body,design){
 const x=compile(design), native=body.vector.clips[C];
 // Check whole faces, not just clicked nodes: no winding holes, crossings, or
 // unknown curve sections. Also retain this exact stock native clip at draw.
 const sample=document.createElement('canvas').getContext('2d'), p=new Path2D(native.join(' '));
 die(x.rings.every(q=>maskContainsStrict(native,q,(a,b)=>sample.isPointInPath(p,a,b,'nonzero'))),'East cap crosses or encloses source-alpha boundary/hole');
 return x.cap;
}
function read(raw){
 const str=typeof raw==='string'?raw:canonical(raw);
 die(typeof str==='string'&&bytes(str).length<=maxBytes,'East-cap draft too large');
 const d=JSON.parse(str),pinKeys=['projectSha256','stageSha256','ownerSha256','bodySourceSha256','clipsSha256'];
 die(keys(d,['schema','version','target','pins','design'])&&d.schema===SCHEMA&&d.version===1&&eq(d.target,TARGET)&&keys(d.pins,pinKeys)&&pinKeys.every(k=>hex(d.pins[k])),'Wrong east-cap draft type, version, pins or slot');
 return d;
}
async function validate(project,raw){
 const d=read(raw), s=source(project);
 die(eq(d.pins,await pin(project,s)),'East-cap base fingerprint drift');
 return {d,s,cap:checkedCap(s.body,d.design)};
}
export async function exportEastCapDraft(project,design){
 const p=copy(project),d=copy(design),s=source(p);
 checkedCap(s.body,d);
 const out=canonical({schema:SCHEMA,version:1,target:TARGET,pins:await pin(p,s),design:d});
 read(out);
 return out;
}
export async function attachEastCapDraft(project,raw){
 const p=copy(project),{s,d,cap}=await validate(p,raw);
 // Both native Stage42 landmark routes already draw this one asset. The cap is
 // behind original; its clip is the unchanged original nonzero source mask.
 const root=s.body.vector.root;
 s.body.vector.root={tag:'g',children:[cap,root]};
 s.body.params[CAP_KEY]=d;
 return p;
}
export async function removeEastCapDraft(project){
 const p=copy(project),{body}=source(p,true),d=body.params[CAP_KEY],v=body.vector;
 const [cap,original]=v.root.children??[];
 die(keys(v.root,['tag','children'])&&v.root.tag==='g'&&v.root.children.length===2&&eq(cap,compileEastCap(d.design))&&original.clipPath===C,'Edited cap structure drift');
 v.root=original;
 delete body.params[CAP_KEY];
 await validate(p,d);
 return p;
}
// Map trusted Workshop pointer through its settled CSS camera transform. No
// permanent scene mutation here; caller owns toolbar state/preview/undo.
export function pointFromWorkshopPointer(e,canvas,camera){
 die(e.isTrusted===true&&e.isPrimary===true&&e.button===0&&e.target===canvas,'Expected actual primary canvas pointer');
 const b=canvas.getBoundingClientRect();
 const x=e.clientX-b.left,y=e.clientY-b.top;
 die(Number.isFinite(x+y+camera.x+camera.y+camera.zoom)&&camera.zoom>0&&x>=0&&y>=0&&x<=b.width&&y<=b.height,'Invalid Workshop pointer position');
 return [(camera.x+(x-b.width/2)/camera.zoom)/TARGET.scale,(camera.y+(y-b.height/2)/camera.zoom)/TARGET.scale];
}
export function eastCapPointerSession(canvas,getCamera,onPoint,onRejected){
 const handle=e=>{try{const at=pointFromWorkshopPointer(e,canvas,getCamera());die(at[0]>=SCOPE.seamX&&at[0]<=SCOPE.maxX&&at[1]>=SCOPE.topY&&at[1]<=SCOPE.bottomY,'Click outside Stage42 approved east rail');onPoint(at);}
 catch(error){onRejected?.(error);}};
 canvas.addEventListener('pointerdown',handle);
 return ()=>canvas.removeEventListener('pointerdown',handle);
}
