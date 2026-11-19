const UPPER='new-stage42-upper-west-palisade',EAST='new-stage42-upper-route';
const ROOT='stage-42-whole-native-blockout',KIND='honro.stage42.native-upper-west';
const PINS=Object.freeze(['a9f3200d572681ad29a0e80449f916f49565faf90d9bd8506e6d274d7eaf37e5','3d742fd6c0eee6d72225c8da52d75bac185e0cad18702de4c42d1c2bebdc8ead','7bccd505aa75875344914567f689d56a4f29f21de49ca1f98549dcca4ff6a103']);
const upperGuide=Object.freeze([[0,1326.66],[983.89,1669.43],[1358.4,1955.08],[1567.87,1955.08],[2215.33,1428.22],[3548.34,1428.22],[3999.02,1345.7],[4817.87,1180.66]]);
const LO=2075.68;
const ptEq=(a,b)=>a?.[0]===b?.[0]&&a?.[1]===b?.[1];
const stable=o=>JSON.stringify(o,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const h=async x=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)))].map(a=>a.toString(16).padStart(2,'0')).join('');
const must=(b,m)=>{if(!b)throw Error(m)};
const idFields=['id','points','role'];
const yAt=(p,x)=>{for(let i=1;i<p.length;i++){const [a,b]=[p[i-1],p[i]];if(a[0]<=x&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return NaN;};
export function strictUpperOutline(base,records,{complete=true}={}){
 must(Array.isArray(records)&&records.length<2&&(!complete||records.length===1),'One independently editable west upper front allowed');
 if(records.length===0)return null;
 const r=records[0],p=r.points;
 must(stable(Object.keys(r).sort())===stable(idFields)&&r.role==='upper-west-palisade'&&r.id==='f-1','Only the named west upper fascia role');
 must(Array.isArray(p)&&p.length>=12&&p.length<=32&&p.every(v=>v.length===2&&v.every(Number.isSafeInteger)&&v[0]>=0&&v[0]<=4030&&v[1]>=1300&&v[1]<=1980),'Native point outside known west upper viewport scope');
 const i=p.findIndex(q=>q[0]===4030),top=p.slice(0,i+1),bottom=p.slice(i+1).reverse();
 must(top.length>=5&&bottom.length>=5&&[top,bottom].every(s=>s[0][0]===0&&s.at(-1)[0]===4030&&s.every((v,j)=>!j||v[0]>s[j-1][0])),'Independently authored ordered top / underside, not a line or crossed cap');
 must(ptEq(top.at(-1),base.upper.top[0])&&ptEq(bottom.at(-1),base.upper.bottom[0]),'Must reuse the exact existing deck join at both shared endpoints');
 const xs=new Set([0,4030,1149,1734,...[top,bottom,upperGuide].flat().map(q=>q[0]).filter(x=>x<4030)]);
 let minDepth=Infinity,maxDepth=0,minAir=Infinity,maxError=0;
 for(const x of xs){
  const t=yAt(top,x),b=yAt(bottom,x),delta=Math.abs(t-yAt(upperGuide,x)),depth=b-t,air=LO-b;
  must(delta<=.80,'Upper lip misses original walkable support');must(air>=96,'Visual roof crowds lower actor');
  must(depth>=21&&depth<=77&&((x>=1149&&x<=1734)||depth>=38),'Thin art override only near sight-constrained neck');
  minDepth=Math.min(minDepth,depth);maxDepth=Math.max(maxDepth,depth);minAir=Math.min(minAir,air);maxError=Math.max(maxError,delta);
 }
 return {path:{tag:'path',id:'upper-west-owned-fascia',d:'M'+p.map(String).join('L')+'Z',fill:'#49433d'},metrics:{minDepth,maxDepth,minAir,maxError,breakpoints:xs.size}};
}
export async function westParents(maps,b,d,g,pinnedGateParents,gateOpen){
 must([b,d,g].every(x=>typeof x==='string')&&stable(await Promise.all([b,d,g].map(h)))===stable(PINS),'Wrong verified three Slate visual receipts');
 const q=await pinnedGateParents(maps,b,d),opened=gateOpen(q,g);
 must(opened.records.length===27&&opened.project.activeStageId===ROOT&&opened.project.stages.length===1&&opened.project.library.length===15,'Wrong immutable Slate native baseline');
 return {base:q.base,project:opened.project};
}
export function westProject(q,records){
 const out=strictUpperOutline(q.base,records),project=structuredClone(q.project),s=project.stages[0];
 const deck=project.library.find(a=>a.id===EAST),spot=s.elements.find(a=>a.assetId===EAST);
 must(deck&&spot&&!project.library.some(a=>a.id===UPPER)&&!s.terrains.length&&project.library.every(a=>!a.collision.length),'Wrong west fascia logical owner state');
 const a=structuredClone(deck),p=structuredClone(spot);
 a.id=UPPER;a.name='Native west upper support';a.params={nativeAuthoring:'west-upper-authored-support'};a.visual=[];
 a.vector.root={tag:'g',children:[out.path]};a.vector.clips={};a.collision=[];
 p.id=UPPER+'-at';p.assetId=UPPER;p.layer='structural-back';p.opacity=1;p.order=spot.order-.125;
 project.library.push(a);s.elements.push(p);
 must(stable(project.library.slice(0,-1))===stable(q.project.library)&&stable(s.elements.slice(0,-1))===stable(q.project.stages[0].elements)&&!s.terrains.length&&stable(s.terrainBounds)===stable(q.project.stages[0].terrainBounds),'Unrelated owner or frame changed');
 return {project,metrics:out.metrics};
}
export function westSave(q,records){
 strictUpperOutline(q.base,records);
 const raw=stable({kind:KIND,version:1,baseSha256:PINS[0],detailSha256:PINS[1],gateSha256:PINS[2],records});
 must(raw.length<=2600,'West draft size exceeded');
 return raw;
}
export function westOpen(q,raw){
 must(typeof raw==='string'&&raw.length<=2600,'Wrong scoped West draft');
 const r=JSON.parse(raw);
 must(raw===stable(r)&&Object.keys(r).sort().join() ==='baseSha256,detailSha256,gateSha256,kind,records,version'&&r.kind===KIND&&r.version===1&&
  stable([r.baseSha256,r.detailSha256,r.gateSha256])===stable(PINS),'West draft source pin mismatch or noncanonical');
 return {...westProject(q,r.records),records:structuredClone(r.records)};
}
