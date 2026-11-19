// Full-width, blank-origin, editable native geometry. Explicit Stage42 design
// envelopes ONLY; never import stock art, auto-sample routes, or generate points.
export const FRAME=Object.freeze({left:-1800,right:8300,top:-2400,bottom:5061,width:6500,height:2861});
export const ZONES=Object.freeze(['west','center','east-rise','gate']);
export const JOINS=Object.freeze([[1420,1640],[3760,4020],[5370,5630]]);
const paint=Object.freeze({'west':'#414950','center':'#414950','east-rise':'#414950','gate':'#414950',upper:'#49433d',support:'#353c41',back:'#28353d',margin:'#374147'});
const require=(b,msg)=>{if(!b)throw Error(msg)};
const eq=(a,b)=>a[0]===b[0]&&a[1]===b[1],tag=p=>p.join(',');
const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isSafeInteger)&&p[0]>=FRAME.left&&p[0]<=FRAME.right&&p[1]>=FRAME.top&&p[1]<=FRAME.bottom;
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const on=(p,q,r)=>cross(p,q,r)===0&&r.every((n,i)=>n>=Math.min(p[i],q[i])&&n<=Math.max(p[i],q[i]));
const hit=(p,q,r,s)=>on(p,q,r)||on(p,q,s)||on(r,s,p)||on(r,s,q)||cross(p,q,r)*cross(p,q,s)<0&&cross(r,s,p)*cross(r,s,q)<0;
const edges=p=>p.map((a,i)=>[a,p[(i+1)%p.length]]);
const area=p=>Math.abs(edges(p).reduce((s,[a,b])=>s+a[0]*b[1]-a[1]*b[0],0))/2;
const contains=(p,r)=>edges(p).some(([a,b])=>on(a,b,r))||edges(p).filter(([a,b])=>(a[1]>r[1])!==(b[1]>r[1])&&r[0]<a[0]+(b[0]-a[0])*(r[1]-a[1])/(b[1]-a[1])).length%2===1;
const conflict=(p,q)=>p.some(x=>contains(q,x)&&!edges(q).some(([a,b])=>on(a,b,x)))||q.some(x=>contains(p,x)&&!edges(p).some(([a,b])=>on(a,b,x)))||edges(p).some(([a,b])=>edges(q).some(([c,d])=>cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0));
const xOf=(seq,x)=>{
 for(let i=1;i<seq.length;i++){const [a,b]=[seq[i-1],seq[i]];if(a[0]<=x&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}
 return null;
};
const shape=(p,id,fill)=>({tag:'path',id,d:'M'+p.map(tag).join('L')+'Z',fill});
const names=(o,ks)=>o&&Object.keys(o).sort().join()===ks.slice().sort().join();
function ring(p,minArea=3400){
 require(Array.isArray(p)&&p.length>=4&&p.length<=55&&p.every(valid)&&new Set(p.map(tag)).size===p.length&&area(p)>=minArea,'Invalid closed native shape');
 const e=edges(p);require(e.every(([a,b],i)=>e.every(([c,d],j)=>i===j||i===(j+1)%e.length||j===(i+1)%e.length||!hit(a,b,c,d))),'Native shape self-intersects');
}
function strip(top,bottom,{min,max}){
 require([top,bottom].every(ps=>Array.isArray(ps)&&ps.length>=2&&ps.length<=24&&ps.every((p,i)=>valid(p)&&(!i||p[0]>ps[i-1][0]))),'Explicit separate ordered top and lower faces required');
 require(top[0][0]===bottom[0][0]&&top.at(-1)[0]===bottom.at(-1)[0],'Top and underside must close together at matching side bounds');
 for(const x of new Set([...top,...bottom].map(a=>a[0]))){const d=xOf(bottom,x)-xOf(top,x);require(d>=min&&d<=max,'Face thickness invalid or lower support disappears')}
 const p=[...top,...bottom.slice().reverse()];ring(p);return p;
}
export function emptyDesign(){
 return {version:1,joins:[],sections:ZONES.map(zone=>({zone,top:[],bottom:[]})),upper:{top:[],bottom:[]},bearings:[],back:[],margins:[]};
}
// Joins are entered only once via canvas. The two neighbor sections share those
// exact same end pairs. A later drag updates both; no separate resnap per owner.
export function compileFullShape(design,{complete=true,useMargins=true}={}){
 require(names(design,['version','joins','sections','upper','bearings','back','margins'])&&design.version===1,'Wrong full-stage draft');
 const {joins,sections,upper,bearings,back,margins}=design;
 require(Array.isArray(joins)&&joins.length===3&&joins.every((j,i)=>names(j,['top','bottom'])&&valid(j.top)&&valid(j.bottom)&&j.top[0]===j.bottom[0]&&j.top[0]>=JOINS[i][0]&&j.top[0]<=JOINS[i][1]&&j.bottom[1]-j.top[1]>=150),'Three bounded shared joins required');
 require(Array.isArray(sections)&&sections.length===4,'Four contiguous authored section roles required');
 const roads=sections.map((r,i)=>{
  require(names(r,['zone','top','bottom'])&&r.zone===ZONES[i]&&Array.isArray(r.top)&&Array.isArray(r.bottom)&&r.top.length>=2&&r.bottom.length>=2,'Missing editable road section');
  const ends=i<3?[joins[i].top,joins[i].bottom]:[];
  const starts=i>0?[joins[i-1].top,joins[i-1].bottom]:[];
  const top=[...(starts.length?[starts[0]]:[]),...r.top,...(ends.length?[ends[0]]:[])],bottom=[...(starts.length?[starts[1]]:[]),...r.bottom,...(ends.length?[ends[1]]:[])];
  const polygon=strip(top,bottom,{min:150,max:920});
  require(i>0||top[0][0]<=0,'West entry not covered');
  require(i<3||top.at(-1)[0]>=6500,'Gate side not covered');
  return {zone:r.zone,polygon,top,bottom};
 });
 // These are visual contact roles ONLY. Presence does not alter stock collision.
 require(names(upper,['top','bottom']),'Separate raised route');
 const deck=strip(upper.top,upper.bottom,{min:38,max:180});
 const below=roads.map(r=>[...r.top.map(([x,y])=>[x,y-96]),...r.top.slice().reverse()]);
 require(!below.some(p=>conflict(deck,p)),'Raised deck obscures lower actor space');
 require(Array.isArray(bearings)&&bearings.length>=2&&bearings.length<=4,'Need multiple physical visual bearings');
 const bx=bearings.map(b=>{
  require(names(b,['head','sides','toe'])&&b.head?.length===2&&b.toe?.length===2&&b.sides?.length===2&&b.sides.every(x=>Array.isArray(x)&&x.length<=4),'Need independently authored bearing sides and heads');
  const p=[...b.head,...b.sides[0],...b.toe.slice().reverse(),...b.sides[1]];ring(p);
  require(b.head[0][0]<b.head[1][0]&&b.toe[1][0]-b.toe[0][0]>(b.head[1][0]-b.head[0][0])*1.15,'Taper must carry weight');
  require(b.head.every(([x,y])=>{const z=xOf(upper.bottom,x);return z!==null&&y<=z&&y>=z-43;}),'Bearing does not seat in upper deck');
  require(b.toe.every(q=>roads.some(r=>contains(r.polygon,q))),'Bearing foot floats outside all underlying sections');
  return p;
 });
 require(bx.every((b,i)=>bx.every((p,j)=>i===j||!conflict(b,p))),'Bearing corridor unreadable');
 require(Array.isArray(back)&&back.length>=1&&back.length<=4&&back.every(p=>{ring(p);return true}),'No separate backdrop rock mass');
 const md=new Set();
 require(Array.isArray(margins)&&margins.length<=4,'Exterior requires distinct limited owners');
 const rawMargins=margins.map(m=>{
  require(names(m,['side','owner','points'])&&['left','right','top','bottom'].includes(m.side)&&!md.has(m.side)&&(m.side==='top'?/^back-[0-3]$/.test(m.owner):ZONES.includes(m.owner)),'Invalid exterior ownership');
  md.add(m.side);ring(m.points);
  const owned=m.side==='top'?{polygon:back[Number(m.owner.at(-1))],top:back[Number(m.owner.at(-1))]}:roads.find(p=>p.zone===m.owner);
  require(owned?.polygon,'Exterior parent does not exist');
  const a=edges(m.points).some(([x,y])=>edges(owned.polygon).some(([q,z])=>(eq(x,q)&&eq(y,z))||(eq(y,q)&&eq(x,z))));
  require(a,'Exterior must share an exact real owned face edge');
  require(m.side==='left'?m.points.some(p=>p[0]<0):m.side==='right'?m.points.some(p=>p[0]>6500):m.side==='top'?m.points.some(p=>p[1]<Math.min(...owned.top.map(x=>x[1]))-200):m.points.some(p=>p[1]>2861),'Exterior role lacks directional reach');
  require(roads.every(r=>!conflict(m.points,r.polygon))&&!conflict(m.points,deck)&&!below.some(q=>conflict(m.points,q)),'Exterior intrudes on another owner or actor/deck air');
  return m;
 });
 require(rawMargins.every((m,i)=>rawMargins.every((q,j)=>i===j||!conflict(m.points,q.points))),'Independent margins overlap');
 if(complete&&useMargins)require(md.size===4,'All four directional exterior roles must be explicit');
 const continuousTop=roads.flatMap((r,i)=>i?r.top.slice(1):r.top),continuousBottom=roads.flatMap((r,i)=>i?r.bottom.slice(1):r.bottom);
 return {seamUnderpaint:shape([...continuousTop,...continuousBottom.slice().reverse()],'joint-underpaint',paint.west),collision:[],sections:roads,upper:{polygon:deck,top:upper.top},joins:joins.map(x=>structuredClone(x)),roles:[
  ...back.map((p,i)=>({owner:'back-'+i,layer:'back',vector:shape(p,'back-'+i,paint.back)})),
  ...rawMargins.map(m=>({owner:'margin-'+m.side,layer:'structural-back',vector:shape(m.points,'margin-'+m.side,paint.margin)})),
  ...bx.map((p,i)=>({owner:'bearing-'+i,layer:'structural-back',vector:shape(p,'bearing-'+i,paint.support)})),
  ...roads.map(r=>({owner:'lower-'+r.zone,layer:'structural-back',vector:shape(r.polygon,'lower-'+r.zone,paint[r.zone])})),
  {owner:'upper-route',layer:'structural-back',vector:shape(deck,'upper-route',paint.upper)}
 ]};
}
