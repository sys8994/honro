/** Gate defense keeps both slopes and the eight-round refugee evacuation. */
export function applyStage4Positioning(project){
 const s=project.stages.find(s=>s.metadata?.stageId===4);if(!s)return project;
 const terrain=id=>s.terrains.find(t=>t.id===id),top=(id,x)=>{const ps=terrain(id).points;for(let i=0;i<ps.length-1;i++){const a=ps[i],b=ps[i+1];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}};
 // These supported defense galleries already have timber trestles. Preserve
 // every landing height, but replace stone-thick slabs with timber decks.
 for(const id of ['west-step-1','west-step-2','west-shoulder','east-step-1','east-step-2','east-watch']){
  const t=terrain(id),rim=t.points.slice(0,t.points.length/2);t.baseMaterial='wood';t.properties.surfaceKind='defenseDeck';
  t.points=[...rim,...rim.slice().reverse().map((p,i)=>({x:p.x,y:p.y+(id.includes('step')?28:40)}))];
 }
 s.design.positioning={version:1,question:'문 앞에서 휘겸과 돌진을 막을까, 서쪽 회랑을 올라 배수로로 내려쏜 뒤 문으로 복귀할까?',preserved:['gate-basin','objective','npc-hwigyeom','npc-chunrye','burned-gallery','siege-0','siege-1'],clusterPositions:{
 'foe-0-cluster':{x:1476,y:top('gate-basin',1476)},
 'foe-1-cluster':{x:2218,y:top('burned-gallery',2218)},
 'foe-2-cluster':{x:3370,y:top('east-step-2',3370)},
 'foe-3-cluster':{x:2580,y:top('gate-basin',2580)},
 'foe-4-cluster':{x:2390,y:top('gate-basin',2390)},
 'foe-5-cluster':{x:3850,y:1590},
 'foe-6-cluster':{x:2820,y:top('gate-basin',2820)}
 },roles:['문 앞 전위4','불탄 회랑1/수레 분지3','동쪽 비탈 예비2','감시대 사수2/공중2']};
 return project;
}
