/** The intact painted hanok is the architectural reference. Author geography
 * and one-way access to it, never warp the art onto the previous roof polygon. */
const copy=x=>structuredClone(x),points=ps=>ps.map(([x,y])=>({x,y}));
const W=1200,SCALE=W/1536,H=409*SCALE;
export const STAGE3_HANOK={version:1,house:{image:'ferryHall',x:4850,y:1688-H,width:W,height:H,sourceWidth:1536,sourceHeight:409},
 // Major ridge/eave turns measured in the source pixels. Fine tip horns are
 // decoration, not a dense jagged collision trace.
 roofSource:[[16,112],[80,108],[144,68],[176,20],[208,19],[320,37],[512,52],[768,54],[1024,52],[1216,42],[1328,25],[1376,18],[1392,31],[1456,101],[1520,118]],
 approach:{from:{x:4380,support:'ferry-ground'},steps:['cargo-step-1','cargo-step-2'],roof:'warehouse-roof',ledger:'ledger'}};
const top=(t,x)=>{for(let i=0;i<t.points.length;i++){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error('Stage3 missing floor at '+x);};
function monotone(nodes,x){let i=0;while(i<nodes.length-2&&x>nodes[i+1][0])i++;const sec=nodes.slice(1).map((p,j)=>(p[1]-nodes[j][1])/(p[0]-nodes[j][0])),slope=j=>{if(!j)return sec[0];if(j===nodes.length-1)return sec.at(-1);const a=sec[j-1],b=sec[j];return a*b<=0?0:Math.sign(a)*Math.min(Math.abs((a+b)/2),3*Math.abs(a),3*Math.abs(b));},a=nodes[i],b=nodes[i+1],d=b[0]-a[0],u=(x-a[0])/d;return(2*u**3-3*u*u+1)*a[1]+(u**3-2*u*u+u)*d*slope(i)+(-2*u**3+3*u*u)*b[1]+(u**3-u*u)*d*slope(i+1);}
export function applyStage3HanokTerrain(project){const st=project.stages.find(s=>s.metadata?.stageId===3);if(!st)return project;
 const floor=st.terrains.find(t=>t.id==='ferry-ground'),old=copy(floor),lo=4350,hi=6220;
 const nodes=[[lo,top(old,lo)],[4500,1905],[4660,1848],[4820,1740],[4920,1684],[5450,1684],[5800,1681],[6020,1678],[6100,1640],[6170,1585],[hi,top(old,hi)]];
 const xs=new Set(nodes.map(p=>p[0]));for(let x=lo;x<hi;x+=30)xs.add(x);
 const upper=[...xs].sort((a,b)=>a-b).map(x=>({x,y:+monotone(nodes,x).toFixed(3)})),first=floor.points.findIndex(p=>p.x>=lo&&p.x<=hi&&p.y<st.height);
 const kept=floor.points.filter(p=>!(p.x>=lo&&p.x<=hi&&p.y<st.height));floor.points=[...kept.slice(0,first),...upper,...kept.slice(first)];
 const at=x=>top(floor,x),delta=x=>x>=lo&&x<=hi?at(x)-top(old,x):0;
 const ribbon=(id,upper,thickness)=>{const t=st.terrains.find(t=>t.id===id);t.type='solid';t.points=points([...upper,...upper.toReversed().map(([x,y])=>[x,y+thickness])]);t.oneWay=true;t.breakable=false;t.detail={spacing:24,roughness:0,seed:3,optimizeEpsilon:0};};
 ribbon('cargo-step-1',[[4450,1807],[4500,1800],[4575,1796],[4640,1800],[4690,1807]],32);
 ribbon('cargo-step-2',[[4680,1635],[4730,1626],[4800,1620],[4870,1624],[4920,1632]],28);
 const house=STAGE3_HANOK.house,roof=STAGE3_HANOK.roofSource.map(([x,y])=>[house.x+x*SCALE,house.y+y*SCALE]);ribbon('warehouse-roof',roof,24);
 for(const u of st.units){if(u.x<lo||u.x>hi||u.honroFlying)continue;u.y=at(u.x);if(u.spawnY!==undefined)u.spawnY=u.y;}
 for(const e of st.elements){if(!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;e.y+=delta(e.x);if(e.id==='a1-scene-3-cargo-hall'){e.x=5450;e.y=at(5450);}if(e.id==='a1-scene-3-exit-court'){e.x=6320;e.y=at(6320);}}
 for(const m of st.markers){if(!Number.isFinite(m.x)||!Number.isFinite(m.y))continue;m.y+=delta(m.x);}
 for(const a of Object.values(st.anchors||{})){if(a.support==='ferry-ground')a.y=at(a.x);if(a.support==='warehouse-roof'){a.x=5450;a.y=house.y+54*SCALE;}}
 for(const m of st.materials){if((m.terrainId||m.support)!=='ferry-ground'||!m.surface||m.kind==='water-pool')continue;m.surface=m.surface.map(([x,y])=>[x,y+delta(x)]);if(m.bottom)m.bottom=m.bottom.map(([x,y])=>[x,y+delta(x)]);if(m.points)m.points=m.points.map(([x,y])=>[x,y+delta(x)]);}
 st.design??={};
 for(const e of st.design.act1Scene?.scenery||[]){if(e.supportId==='ferry-ground'){e.y=at(e.x)+(e.footOffset||0);for(const p of e.rootContacts||[])p.y=at(p.x);}if(e.id==='a1-scene-3-cargo-hall'){e.x=5450;e.y=at(5450);}if(e.id==='a1-scene-3-exit-court'){e.x=6320;e.y=at(6320);}}
 for(const r of st.design.act1Scene?.rocks||[])if(r.supportId==='ferry-ground')r.y=at(r.x);
 st.design.stage3Hanok=copy(STAGE3_HANOK);st.metadata.hanokTerrainRevision=1;st.initialState.honroStage3HanokRevision=1;
 st.detailStats.groundTop=floor.points.findIndex(p=>p.x===st.width)+1;
 return project;
}
