/** Preserve the broken upper bridge, lower rescue road, actors and story. */
export function applyStage6Positioning(project){
 const s=project.stages.find(s=>s.metadata?.stageId===6);if(!s)return project;
 const terrain=id=>s.terrains.find(t=>t.id===id),top=(id,x)=>{const ps=terrain(id).points;for(let i=0;i<ps.length-1;i++){const a=ps[i],b=ps[i+1];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}};
 for(const id of ['debris-step-1','debris-step-2','debris-step-3','bridge-west','bridge-mid','bridge-east','lower-lookout']){
  const t=terrain(id),rim=t.points.slice(0,t.points.length/2);t.properties.surfaceKind='bridgeDeck';t.baseMaterial='wood';
  t.points=[...rim,...rim.slice().reverse().map(p=>({x:p.x,y:p.y+(id.startsWith('bridge')?42:28)}))];
 }
 // The old small abutment illustrations suggested a second walkable bridge
 // below the real decks. Keep the actual piers, supports and rescue shelter.
 const removed=['a1-scene-6-west-bridge-bank','a1-scene-6-east-bridge-bank'];
 s.design.act1Scene.scenery=s.design.act1Scene.scenery.filter(l=>!removed.includes(l.id));
 s.elements=s.elements.filter(l=>!removed.includes(l.id));
 s.design.positioning={version:1,question:'서쪽 잔교에서 공중 무리를 끊고 내려갈까, 아래 길로 장승에 접근해 운반대를 먼저 확보할까? 귀환 때 동쪽 망대를 쓸까, 운반대 곁을 지킬까?',preserved:['lower-road','pier-west','pier-east','bridge-west','bridge-mid','bridge-east','lower-lookout','objective','midboss-stage6','ally-ropeguard'],clusterPositions:{
  'foe-0-cluster':{x:2220,y:1740},
  'foe-4-cluster':{x:3060,y:1600},
  'foe-8-cluster':{x:3400,y:1705},
  'foe-1-cluster':{x:2640,y:top('lower-road',2640)},
  'foe-5-cluster':{x:3650,y:top('lower-road',3650)},
  'foe-9-cluster':{x:5350,y:top('lower-road',5350)},
  'foe-2-cluster':{x:4870,y:top('lower-lookout',4870)},
  'foe-6-cluster':{x:4800,y:top('lower-road',4800)},
  'foe-3-cluster':{x:4610,y:2290},
  'foe-7-cluster':{x:5470,y:2075}
 },roles:['서쪽 잔교 공중4','중앙 끊어진 교량 공중2','교각 전위3/동측 차단2','운반대 앞2','동쪽 망대1/아래길2/공중4']};
 // "Following from behind" must enter the road behind the rescued carrier,
 // not the eastern exit in front of it. Existing trigger/count are preserved.
 const crows=s.events.find(e=>e.id==='bridge-crows');Object.assign(crows.action,{x:3150,y:1600,requireFlightClearance:true,maxDistance:550,spacing:145});
 const boars=s.events.find(e=>e.id==='bridge-boars');Object.assign(boars.action,{x:5100,y:top('lower-road',5100),support:'lower-road',spacing:145,maxDistance:550});
 const pursuit=s.events.find(e=>e.id==='pursuit');Object.assign(pursuit.action,{x:3540,y:top('lower-road',3540),support:'lower-road',spacing:145,maxDistance:500});
 return project;
}
