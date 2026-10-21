/** Preserve the ferry's existing upper/lower routes; give their defenders distinct jobs. */
export function applyStage3Positioning(project){
 const s=project.stages.find(s=>s.metadata?.stageId===3);if(!s)return project;
 const terrain=id=>s.terrains.find(t=>t.id===id),top=(id,x)=>{const ps=terrain(id).points;for(let i=0;i<ps.length-1;i++){const a=ps[i],b=ps[i+1];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}};
 // Keep every walkable roof point; a shallow timber eave replaces the rock-thick fascia.
 const roof=terrain('warehouse-roof'),rim=roof.points.slice(0,roof.points.length/2);
 roof.points=[...rim,...rim.slice().reverse().map(p=>({x:p.x,y:p.y+34}))];
 const high=s.units.find(u=>u.id==='foe-5');high.y=top('cargo-step-2',high.x);
 s.design.positioning={version:1,question:'잔교 위에서 장승을 내려다보며 쏠까, 물가에서 기예를 쓰며 지나갈까? 창고 아래를 압박할까, 화물 적재대에서 지붕을 먼저 확보할까?',preserved:['ferry-ground','dock-west','dock-mid','dock-east','ferry-side-gangway','cargo-step-1','cargo-step-2','warehouse-roof','ledger','midboss-stage3-seen','dock-beasts','transfer'],clusterPositions:{
  'foe-0-cluster':{x:2210,y:top('ferry-side-gangway',2210)},
  'foe-3-cluster':{x:2920,y:top('ferry-ground',2920)},
  'foe-2-cluster':{x:5080,y:top('ferry-ground',5080)},
  'foe-5-cluster':{x:5490,y:top('warehouse-roof',5490)}
 },roles:['서측 잔교 혼합 전위2','하부 선착장 추격1','장승 옆 저지대 압박1','기존 공중4','창고 비탈2/적재대1/지붕1']};
 return project;
}
