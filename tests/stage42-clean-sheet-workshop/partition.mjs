// Native editor model. In user work the only producers of points are canvas
// clicks and drags; no image pixels, external SVG or legacy vector consulted.
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const at=(a,b)=>a[0]===b[0]&&a[1]===b[1],between=(a,b,p)=>cross(a,b,p)===0&&[0,1].every(i=>p[i]>=Math.min(a[i],b[i])&&p[i]<=Math.max(a[i],b[i]));
const intersects=(a,b,c,d)=>between(a,b,c)||between(a,b,d)||between(c,d,a)||between(c,d,b)||(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0);
const edges=ps=>ps.map((p,i)=>[p,ps[(i+1)%ps.length]]);
const area=ps=>edges(ps).reduce((s,[a,b])=>s+a[0]*b[1]-b[0]*a[1],0)/2;
const inside=(ps,p)=>{
 if(edges(ps).some(([a,b])=>between(a,b,p)))return false;
 let n=0;for(const [a,b] of edges(ps))if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<a[0]+(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1]))n++;
 return n%2===1;
};
const need=(v,e)=>{if(!v)throw Error(e)};
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isSafeInteger)&&p[0]>=-2200&&p[0]<=8700&&p[1]>=-2300&&p[1]<=5200;
const key=p=>p.join(',');
const checks=ps=>{
 need(ps.length>=3&&ps.length<=128&&ps.every(point)&&new Set(ps.map(key)).size===ps.length&&Math.abs(area(ps))>1,'Invalid native ring');
 const es=edges(ps);
 need(es.every(([a,b],i)=>es.every(([c,d],j)=>i===j||i===(j+1)%es.length||j===(i+1)%es.length||!intersects(a,b,c,d))),'Non-simple native ring');
};
function split(ring,a,b,knots){
 const i=ring.findIndex(v=>at(v,a)),j=ring.findIndex(v=>at(v,b));
 need(i>=0&&j>=0&&i!==j&&Array.isArray(knots)&&knots.length<=18&&knots.every(q=>point(q)&&inside(ring,q)),'Invalid shared seam endpoint or knot');
 const seam=[a,...knots,b], links=seam.slice(1).map((q,i)=>[seam[i],q]);
 need(new Set(seam.map(key)).size===seam.length,'Duplicate seam point');
 need(links.every(([q,z],i)=>links.every(([a,b],j)=>Math.abs(i-j)<2||!intersects(q,z,a,b))),'Self-intersecting seam');
 need(links.every(([q,z])=>inside(ring,[(q[0]+z[0])/2,(q[1]+z[1])/2])&&edges(ring).every(([x,y])=>{
  if(!intersects(q,z,x,y))return true;
  // Exactly shared endpoint is allowed, never a boundary overlap.
  return [q,z].some(k=>(at(k,a)||at(k,b))&&(at(k,x)||at(k,y)))&&!(cross(q,z,x)===0&&cross(q,z,y)===0);
 })),'Shared seam exits or overlaps ring');
 const route=(x,y)=>x<y?ring.slice(x,y+1):[...ring.slice(x),...ring.slice(0,y+1)];
 const left=[...route(i,j),...knots.slice().reverse()],right=[...route(j,i),...knots];
 checks(left);checks(right);
 need(Math.abs(area(left)+area(right)-area(ring))<.5&&Math.sign(area(left))===Math.sign(area(ring))&&Math.sign(area(right))===Math.sign(area(ring)),'Shared seam area conservation failed');
 return [left,right];
}
export const PAINT=Object.freeze({'cold-mid':'#414952','cold-dark':'#313a44','ash-shelf':'#4b5154','dummy-cold':'#343e47'});
const path=ps=>'M'+ps[0].join(',')+'L'+ps.slice(1).map(key).join(' ')+'Z';
export function compileNativeDraft(design){
 const {outline,seams,dummies}=design;checks(outline);
 let rings=[outline];
 need(seams.length===2,'Draw exactly two shared seams for the first vertical slice');
 for(const s of seams){
  need(Number.isSafeInteger(s.a)&&Number.isSafeInteger(s.b)&&s.a>=0&&s.b>=0&&s.a<outline.length&&s.b<outline.length,'Unknown shared boundary vertex');
  const index=rings.findIndex(r=>[outline[s.a],outline[s.b]].every(p=>r.some(q=>at(p,q)))&&inside(r,s.knots?.[0]??[(outline[s.a][0]+outline[s.b][0])/2,(outline[s.a][1]+outline[s.b][1])/2]));
  need(index>=0,'Seam not in one connected mass');
  rings.splice(index,1,...split(rings[index],outline[s.a],outline[s.b],s.knots??[]));
 }
 need(Array.isArray(dummies)&&dummies.length<=4,'Invalid dummy groups');
 const allDummy=dummies.map(ps=>{
  checks(ps);
  const oe=edges(outline);
  need(ps.every(p=>!inside(outline,p))&&edges(ps).some(([q,z])=>oe.some(([a,b])=>(at(q,a)&&at(z,b))||(at(q,b)&&at(z,a)))),'Dummy must share a whole outer edge');
  need(edges(ps).every(([q,z])=>!inside(outline,[(q[0]+z[0])/2,(q[1]+z[1])/2])&&oe.every(([a,b])=>!intersects(q,z,a,b)||[q,z].some(p=>[a,b].some(t=>at(p,t))))),'Dummy cuts through body');
  return ps;
 });
 const colors=['cold-mid','cold-dark','ash-shelf'];
 const assets=(ps,i,prefix,material)=>({tag:'path',id:prefix+'-'+i,d:path(ps),fill:PAINT[material]});
 return {role:'native-visual-only',collision:[],massCount:rings.length,
  root:{tag:'g',children:[...allDummy.map((ps,i)=>assets(ps,i,'dummy','dummy-cold')),...rings.map((ps,i)=>assets(ps,i,'mass',colors[i]))]},
  bounds:[-2200,-2300,10900,7500]};
}
