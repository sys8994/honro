// Semantic, hand-authored native visual geometry. Coordinates are never generated
// from old collision, screenshots or SVG. Shape inputs are actual click points.
const need=(ok,msg)=>{if(!ok)throw Error(msg)};
const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isSafeInteger)&&p[0]>=-2200&&p[0]<=8700&&p[1]>=-2300&&p[1]<=5200;
const at=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const key=p=>p.join(',');
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const bounds=(a,b,p)=>p.every((z,i)=>z>=Math.min(a[i],b[i])&&z<=Math.max(a[i],b[i]));
const on=(a,b,p)=>cross(a,b,p)===0&&bounds(a,b,p);
const hit=(a,b,c,d)=>on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b)||cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0;
const edges=ps=>ps.map((p,i)=>[p,ps[(i+1)%ps.length]]);
const contains=(ring,q)=>edges(ring).some(([a,b])=>on(a,b,q))||edges(ring).filter(([a,b])=>(a[1]>q[1])!==(b[1]>q[1])&&q[0]<a[0]+(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])).length%2===1;
const area=ps=>edges(ps).reduce((n,[a,b])=>n+a[0]*b[1]-a[1]*b[0],0);
const is=(o,keys)=>o&&Object.keys(o).sort().join()===keys.slice().sort().join();
const path=(ps,id,fill)=>({tag:'path',id,d:'M'+ps.map(key).join('L')+'Z',fill});
function simple(ps){
 need(ps.length>=4&&ps.length<=38&&ps.every(valid)&&new Set(ps.map(key)).size===ps.length&&Math.abs(area(ps))>=500,'Native structural ring invalid');
 const es=edges(ps);
 need(es.every(([a,b],i)=>es.every(([c,d],j)=>i===j||i===(j+1)%es.length||j===(i+1)%es.length||!hit(a,b,c,d))),'Structural ring crosses itself');
}
const value=(ps,x)=>{
 for(let i=1;i<ps.length;i++){const [a,b]=[ps[i-1],ps[i]];if(a[0]<=x&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}
 return null;
};
function distinctSeam(role){
 need(is(role,['top','underside'])&&Array.isArray(role.top)&&Array.isArray(role.underside),'Hand-drawn top and underside required');
 const {top,underside}=role;
 need([top,underside].every(seq=>seq.length>=2&&seq.length<=19&&seq.every((p,i)=>valid(p)&&(!i||p[0]-seq[i-1][0]>=12))),'Edges must be individually ordered, spaced, hand-authored series');
 need(top[0][0]===underside[0][0]&&top.at(-1)[0]===underside.at(-1)[0],'Each visible shape needs closed ends on shared X coordinates');
 return [...new Set([...top,...underside].map(p=>p[0]))].sort((a,b)=>a-b);
}
function shelf(role,limits,label){
 const xs=distinctSeam(role),span=xs.at(-1)-xs[0],range=[];
 need(span>=limits.width,'Structural shelf too short');
 for(const x of xs){
  const thick=value(role.underside,x)-value(role.top,x);range.push(thick);
  need(thick>=limits.min&&thick<=limits.max,'Thin line or oversized opaque slab at '+label);
 }
 const polygon=[...role.top,...role.underside.slice().reverse()];simple(polygon);
 return {polygon,x0:xs[0],x1:xs.at(-1),min:Math.min(...range),max:Math.max(...range),span};
}
function overlap(p,q){
 return p.some(v=>contains(q,v))||q.some(v=>contains(p,v))||edges(p).some(([a,b])=>edges(q).some(([c,d])=>hit(a,b,c,d)));
}
function anchors(p,poly){return p.every(q=>contains(poly,q))&&!edges(poly).some(([a,b])=>hit(p[0],p[1],a,b)&&!p.some(x=>on(a,b,x)));}
const join=(lo,hi,h)=>[...lo.map(([x,y])=>[x,y-h]),...hi.slice().reverse()];
export function compileStructure(design,{clearance=105}={}){
 need(Number.isSafeInteger(clearance)&&clearance>=85&&clearance<=160,'Character-clearance certificate required');
 need(is(design,['background','road','deck','supports'])&&Array.isArray(design.background)&&Array.isArray(design.supports)&&design.supports.length===2,'Missing two grounded supports and a distinct backing rock');
 const road=shelf(design.road,{width:1100,min:75,max:340},'road');
 const deck=shelf(design.deck,{width:550,min:48,max:125},'deck');
 const b=design.background;simple(b);
 need(b.some(([x,y])=>{const top=value(design.road.top,x);return top!==null&&top-y>=clearance*2;}),'Separate high backing rock absent');
 const roadBand=join(design.road.top,design.road.top,clearance);
 // The deck must not swallow the lower actor passage as an opaque shape.
 need(!overlap(roadBand,deck.polygon),'Deck underside overlaps protected lower actor corridor');
 const bearings=design.supports.map((r,i)=>{
  need(is(r,['head','toe','sides'])&&r.head?.length===2&&r.toe?.length===2&&r.sides?.length===2&&r.sides.every(side=>Array.isArray(side)&&side.length<=4),'Missing individually drawn head/toe/sides for bearing');
  const points=[...r.head,...r.sides[0],...r.toe.slice().reverse(),...r.sides[1]];
  simple(points);
  need(r.head[0][0]<r.head[1][0]&&r.toe[0][0]<r.toe[1][0],'Bearing endpoints must be left to right');
  const headWidth=r.head[1][0]-r.head[0][0],toeWidth=r.toe[1][0]-r.toe[0][0];
  need(headWidth>=55&&headWidth<=220&&toeWidth>=1.18*headWidth&&toeWidth<=420,'Bearing must taper above its grounded foot');
  need(r.head.every(([x,y])=>{const bottom=value(design.deck.underside,x);return bottom!==null&&y>=bottom-35&&y<=bottom;}),'Deck bottom is unsupported / bearing head detached');
  need(anchors(r.toe,road.polygon),'Bearing foot lacks real shelf support');
  const x=(r.head[0][0]+r.head[1][0])/2,t=(x-deck.x0)/deck.span;
  need(i===0?t>=.035&&t<=.30:t>=.70&&t<=.965,'Bearings must support separate ends');
  return {polygon:points,x,headWidth,toeWidth,behindLowerActor:true,crossesLowerCorridor:overlap(points,roadBand)};
 });
 need(!overlap(bearings[0].polygon,bearings[1].polygon)&&bearings[1].x-bearings[0].x>=deck.span*.43,'Raised deck lacks a readable central void');
 return {role:'hand-authored structural visual only',collision:[],diagnostic:{roadThickness:[road.min,road.max],deckThickness:[deck.min,deck.max],unsupportedVoidBetween:bearings[1].x-bearings[0].x,lowerActorCorridorClearOfDeck:true,supports:bearings.map(({polygon,...r})=>r)},
  layerOrder:[{owner:'back-rock',layer:'back',vector:path(b,'back-rock-native','#293740')},
   ...bearings.map(({polygon},i)=>({owner:'support-'+i,layer:'structural-back',vector:path(polygon,'bearing-'+i,'#374349')})),
   {owner:'road-shelf',layer:'structural-back',vector:path(road.polygon,'shelf-native','#465059')},
   {owner:'raised-deck',layer:'structural-back',vector:path(deck.polygon,'deck-native','#4c5359')}],
  contact:{road:design.road.top,deck:design.deck.top}};
}
