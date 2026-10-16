/** Fresh-map, one-way roofs and short loading stairs; no solid building interiors. */
const yAt=(q,x)=>{for(let i=1;i<q.length;i++)if(x>=q[i-1][0]&&x<=q[i][0]){const a=q[i-1],b=q[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}throw Error('roof support '+x);};
export function applyStage23Roofs(s){
 s.terrains=s.terrains.filter(t=>!t.id.startsWith('sy-roof-'));
 const defs=s.design.escortYardRoofProfiles,names=['granary','west-wing','east-wing','upper-store','sorting-west','sorting-east','west-gate','east-gate'];
 const put=(name,q,roof=true)=>{const id='sy-roof-'+name;s.terrains.push({id,name:roof?'밟을 수 있는 기와지붕':'창고 점검 목재계단',type:'solid',points:[...q,...q.slice().reverse().map(([x,y])=>[x,y+18])].map(([x,y])=>({x,y})),oneWay:true,baseMaterial:roof?'rock':'wood',breakable:false,layer:'terrain',properties:{honroEscortYard:true,honroRoof:roof,honroRoofAccess:!roof,honroSurfaceRole:roof?'walkable-roof':'roof-access',honroWalkEdges:q.slice(1).map((_,i)=>i),surfaceKind:roof?'granite':'wood',hp:99999,maxHp:99999},detail:{roughness:0,optimizeEpsilon:0}});return id;};
 defs.forEach((r,i)=>put(names[i],r.top));
 const high=id=>s.terrains.find(t=>t.id===id).points.slice(0,s.terrains.find(t=>t.id===id).properties.honroWalkEdges.length+1).map(p=>[p.x,p.y]);
 const west=high('sy-west-upper'),east=high('sy-east-upper'),main=s.design.act3.primaryContour;
 const ramps=[
 ['west-gate-stair',[[100,yAt(main,100)-110],defs[6].top[0]]],
 ['east-wing-stair',[[2480,yAt(main,2480)-110],defs[2].top[0]]],
 ['upper-store-stair',[[2900,yAt(west,2900)],defs[3].top[0]]],
 ['sorting-step-1',[[6810,3420],[6970,3420]]],
 ['sorting-step-2',[[6920,3250],[7080,3250]]],
 ['sorting-step-3',[[6980,3090],[7140,3090]]],
 ['sorting-link',[defs[4].top.at(-1),defs[5].top[0]]],
 ['east-gate-stair',[[8580,yAt(east,8580)],defs[7].top[0]]]
 ];
 for(const [id,q]of ramps)put(id,q.slice().sort((a,b)=>a[0]-b[0]),false);
 s.design.escortYardRoofs={revision:1,ids:names.map(n=>'sy-roof-'+n),access:ramps.map(([id,q])=>({id:'sy-roof-'+id,points:q})),rule:'Existing oneWay collision, drop and projectile policy; lower escort road and cargo unchanged.'};
}
