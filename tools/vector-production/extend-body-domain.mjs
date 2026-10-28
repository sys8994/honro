/** Authoring-only continuation of an existing semantic BODY into an existing
 * terrain domain. No collision is generated or modified. Output uses vector v1.
 * World-space root is required (importer affine applied). Not a quality oracle. */
const clone=x=>JSON.parse(JSON.stringify(x));
export function extendBodyDomain(body,{terrainPoints,topPoints=terrainPoints.filter(p=>p.y<3000),left=-280,right=7480,leftBreaks=[-6000,-4500,-3000,-1800,-900,left],rightBreaks=[right,8200,9200,10200,11700,13200],baseColor,deepTop,deepBottom=4400,bottom=40000}={}){
 if(body.params?.semanticLayer!=='BODY'&&body.params?.artRole!=='BODY')throw Error('Expected semantic BODY');
 if(!terrainPoints?.length||!topPoints?.length)throw Error('Explicit existing terrain/top points required');
 const d=terrainPoints.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ')+'Z';
 const unique=[];for(const q of clone(topPoints).sort((a,b)=>a.x-b.x)){if(unique.at(-1)?.x===q.x)unique.at(-1).y=Math.min(unique.at(-1).y,q.y);else unique.push(q);}
 const floor=x=>{for(let i=1;i<unique.length;i++)if(x<=unique[i].x){const a=unique[i-1],b=unique[i];return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}return unique.at(-1).y;};
 let raw=body.vector.root;while(raw.clipPath){if(raw.children?.length!==1)throw Error('Cannot unwrap mixed clipped group');raw=raw.children[0];}
 // Optional matched dark substrate continuation only in a verified flat region.
 // It covers stacked-trace matte rims; never choose deepTop over visible detail.
 if(baseColor&&Number.isFinite(deepTop))raw={tag:'g',children:[raw,{tag:'path',d:`M${left-40} ${deepTop}H${right+40}V${deepBottom}H${left-40}Z`,fill:baseColor}]};
 const interior=clone(body);interior.vector.clips={...interior.vector.clips,ground:[d],interior:[`M${left} 0H${right}V${bottom}H${left}Z`]};interior.vector.root={tag:'g',clipPath:'interior',children:[{tag:'g',clipPath:'ground',children:[raw]}]};
 const extensions=[];
 for(const [side,edge,breaks]of [['left',left,leftBreaks],['right',right,rightBreaks]]){
  if(!Array.isArray(breaks)||breaks.length<2)continue;if(breaks.some((x,i)=>!Number.isFinite(x)||i&&x<=breaks[i-1]))throw Error('Monotonic finite breakpoints required');
  const ext={...clone(body),id:body.id+'-domain-'+side,collision:[]};ext.params={...ext.params,domainContinuation:{method:'reflected piecewise-affine height alignment',source:body.id,edge,breaks}};ext.vector.clips={domain:[d]};ext.vector.root={tag:'g',clipPath:'domain',children:[]};ext.bounds=ext.reference.bounds={x:breaks[0],y:0,w:breaks.at(-1)-breaks[0],h:deepBottom||7000};ext.vector.viewBox=[ext.bounds.x,0,ext.bounds.w,ext.bounds.h];
  for(let i=1;i<breaks.length;i++){const lo=breaks[i-1],hi=breaks[i],delta=x=>floor(x)-floor(2*edge-x),m=(delta(hi)-delta(lo))/(hi-lo),b=delta(lo)-m*lo,key='slice'+i;ext.vector.clips[key]=[`M${lo} 0H${hi}V${bottom}H${lo}Z`];ext.vector.root.children.push({tag:'g',clipPath:key,children:[{tag:'g',transform:[-1,-m,0,1,2*edge,2*edge*m+b],children:[raw]}]});}
  extensions.push(ext);
 }
 return{body:interior,extensions,scope:'Derived appearance only; inspect normal/zoom/domain edges and measure actual renderer. JSON repeats shared paths; keep section count economical.'};
}
