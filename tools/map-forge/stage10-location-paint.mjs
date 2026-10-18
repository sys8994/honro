/** Stage10 only: image-authored boughs and open shrine galleries. */
const pts=a=>a.map(([x,y])=>({x,y}));
const top=(t,x)=>{for(let i=1;i<t.points.length;i++){const a=t.points[i-1],z=t.points[i];if(z.x>a.x&&x>=a.x-.001&&x<=z.x+.001)return a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);}throw Error('Stage10 support '+t.id+' '+x);};
function round(knots){const out=[knots[0]];for(let i=1;i<knots.length-1;i++){const a=knots[i-1],b=knots[i],z=knots[i+1],r=Math.min(65,(b[0]-a[0])*.21,(z[0]-b[0])*.21),p=[b[0]-r,b[1]-(b[1]-a[1])*r/(b[0]-a[0])],q=[b[0]+r,b[1]+(z[1]-b[1])*r/(z[0]-b[0])];out.push(p);for(let j=1;j<=5;j++){const t=j/5;out.push([(1-t)**2*p[0]+2*(1-t)*t*b[0]+t*t*q[0],(1-t)**2*p[1]+2*(1-t)*t*b[1]+t*t*q[1]]);}}out.push(knots.at(-1));return out;}
export function applyStage10LocationPaint(project){const s=project.stages.find(s=>s.metadata?.stageId===10);if(!s)return project;const find=id=>s.terrains.find(t=>t.id===id),floor=find('outer-yard'),last=floor.points.findIndex(p=>p.x===5000&&p.y<3900),ground=round([[0,2940],[600,2870],[1000,2700],[1100,2670],[1450,2670],[1750,2670],[1940,2435],[2000,2390],[2200,2335],[2400,2300],[2700,2300],[2920,2350],[3100,2430],[3350,2670],[3550,2670],[4000,2670],[4200,2670],[4550,2840],[5000,2860]]);floor.points=[...pts(ground),...floor.points.slice(last+1)];floor.properties={...floor.properties,honroWalkEdges:ground.slice(1).map((_,i)=>i)};floor.detail={...floor.detail,roughness:0,optimizeEpsilon:0};const at=x=>top(floor,x);
 const tree={image:'guardianTree10',x:1920,y:1090,height:1400,width:1400*1074/1436,sourceCrop:[6,5],sourceScale:1400/1436};
 // Coordinates read from the original tree, before alpha-trim. The entire
 // tree is rendered at this same transform; no branch texture cards exist.
 const source={
 'altar-step-1':[[90,1077],[155,1101],[240,1117],[345,1119],[430,1102],[500,1104]],
 'altar-step-2':[[602,957],[660,969],[760,971],[870,958],[980,909],[1030,913]],
 'altar-step-3':[[95,765],[150,784],[240,808],[350,813],[465,801],[530,813]],
 'altar-platform':[[585,644],[670,644],[770,649],[875,620],[940,590],[1000,593]]};
 const branchPoint=([x,y])=>[tree.x+(x-6)*tree.sourceScale,tree.y+(y-5)*tree.sourceScale];
 const halls=[{image:'guardianHall10',terrain:'west-gallery',x:1000,width:760,height:760*536/1536,foot:2685,roof:[[0,.22],[.125,0],[.19,.085],[.4,.105],[.6,.105],[.82,.07],[.87,0],[.94,.17],[1,.23]]},{image:'ritualCorridor9',terrain:'east-gallery',x:3420,width:850,height:850*486/1536,foot:2685,roof:[[0,.23],[.043,0],[.08,.065],[.25,.1],[.47,.105],[.5,.045],[.53,.1],[.76,.105],[.80,.18],[.9,.24],[1,.45]]}];for(const h of halls)h.y=h.foot-h.height;
 const profiles=Object.fromEntries(Object.entries(source).map(([id,ps])=>[id,ps.map(branchPoint)]));for(const h of halls)profiles[h.terrain]=h.roof.map(([u,v])=>[h.x+u*h.width,h.y+v*h.height]);
 profiles['west-step']=round([[810,at(810)-155],[1020,2550],[1210,2525]]);profiles['gallery-link-west']=[1190,1260,1340,1420].map(x=>[x,top({id:'west roof',points:pts(profiles['west-gallery'])},x)]);
 profiles['east-step']=round([[3340,at(3340)-155],[3520,2460],[3760,2450]]);profiles['gallery-link-east']=[3510,3600,3690,3790].map(x=>[x,top({id:'east roof',points:pts(profiles['east-gallery'])},x)]);
 for(const [id,upper]of Object.entries(profiles)){const t=find(id),depth=source[id]?48:id.endsWith('gallery')?14:28;t.points=pts([...upper,...upper.toReversed().map(([x,y],i)=>[x,y+depth+(source[id]?Math.sin(Math.PI*i/(upper.length-1))*16:0)])]);t.oneWay=true;t.properties={...t.properties,honroWalkEdges:upper.slice(1).map((_,i)=>i)};t.detail={...t.detail,roughness:0,optimizeEpsilon:0};}
 for(const u of s.units){u.y=at(u.x);if(Object.hasOwn(u,'spawnY'))u.spawnY=u.y;}
 // The original nonlethal target keeps its template and fresh 58% durability.
 // Raise it within the newly wider ritual space so the lower path stays open.
 s.terrains=s.terrains.filter(t=>t.id!=='sodan-binding');const boss=s.units.find(u=>u.id==='boss'),bx=boss.x-285,by=boss.y-240;
 s.terrains.push({id:'sodan-binding',name:'바깥 주박',type:'solid',points:pts([[bx,by],[bx+96,by],[bx+96,by+126],[bx,by+126]]),baseMaterial:'wood',oneWay:false,breakable:true,layer:'terrain',detail:{spacing:18,roughness:0,seed:1,optimizeEpsilon:0},properties:{device:'ward',honroBinding:true,hp:800,maxHp:800}});
 for(const m of s.markers)m.y=at(m.x);
 for(const [key,a]of Object.entries(s.anchors)){a.support='outer-yard';if(key==='altar'){a.support='altar-platform';a.x=2550;}a.y=top(find(a.support),a.x);}
 for(const e of s.elements){const a=e.anchor&&s.anchors[e.anchor];if(a)Object.assign(e,{x:a.x,y:a.y});}
 const legacy=s.design.act1Scene;for(const v of legacy?.scenery||[]){v.y=at(v.x)+(v.footOffset||0);for(const c of v.rootContacts||[])c.y=at(c.x);const e=s.elements.find(e=>e.id===v.id);if(e)e.y=v.y;}for(const r of legacy?.rocks||[])r.y=at(r.x);
 for(const ev of s.events)if(ev.action?.type==='spawn'){ev.action.support='outer-yard';ev.action.y=at(ev.action.x);}
 const p=(x,id='outer-yard')=>({x,y:top(find(id),x),surfaceId:id});
 s.design.stage10LocationPaint={revision:1,tree,halls,branches:Object.keys(source),materials:{stonePads:[[910,1190],[2370,2690],[3980,4230]],grassBanks:[[350,730],[1880,2150],[2870,3140],[4380,4700]]},routes:[{id:'ritual-approach',defaultJump:false,anchors:[p(330),p(1050),p(1650),p(2500),p(3550),p(4100),p(4860)]},{id:'west-gallery',anchors:[p(800),p(880,'west-step'),p(1160,'west-step'),p(1250,'gallery-link-west'),p(1420,'gallery-link-west'),p(1450,'west-gallery')]},{id:'east-gallery',anchors:[p(3280),p(3430,'east-step'),p(3700,'east-step'),p(3700,'gallery-link-east'),p(3850,'east-gallery')]},{id:'guardian-ascent',anchors:[p(2580),p(2380,'altar-step-1'),p(2580,'altar-step-2'),p(2400,'altar-step-3'),p(2560,'altar-platform')]}]};
 const wr=s.design.stage10LocationPaint.routes.find(r=>r.id==='west-gallery');wr.anchors[2].jumpTo={x:wr.anchors[3].x,support:'west-gallery',speed:1};const er=s.design.stage10LocationPaint.routes.find(r=>r.id==='east-gallery');er.anchors[2].jumpTo={x:er.anchors[3].x,support:'east-gallery',speed:1};
 const climb=s.design.stage10LocationPaint.routes.find(r=>r.id==='guardian-ascent');for(let i=0;i<climb.anchors.length-1;i++){const z=climb.anchors[i+1];climb.anchors[i].jumpTo={x:z.x,support:z.surfaceId,speed:1};}
 return project;
}
