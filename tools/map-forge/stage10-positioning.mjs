/** Accessible side galleries for the existing guardian-tree confrontation.
 * Story, original actors, branch climb, binding and finale anchors are preserved. */
export function applyStage10Positioning(project){
 const s=project.stages.find(s=>s.metadata?.stageId===10);if(!s)return project;
 const profiles={
  'west-step':[[1050,2670],[1290,2610]],
  'gallery-link-west':[[1190,2450],[1420,2420]],
  'west-gallery':[[1150,2320],[1450,2210],[1720,2230]],
  'east-gallery':[[3550,2180],[3850,2070],[4150,2110]]
 };
 for(const[id,top]of Object.entries(profiles)){const t=s.terrains.find(t=>t.id===id),depth=id.endsWith('gallery')?26:38;t.points=[...top,...top.toReversed().map(([x,y])=>[x,y+depth])].map(([x,y])=>({x,y}));t.oneWay=true;t.detail={...t.detail,roughness:0,optimizeEpsilon:0};}
 s.design.positioning={version:1,question:'낮은 길에서 접근하며 전위를 상대할까, 서쪽 회랑을 올라 주박으로 이어지는 높은 사선을 잡을까? 협력 뒤에는 나무 가지와 양쪽 회랑에서 소단으로 향하는 습격을 차단한다.',preserved:['sodan-binding','boss','receiver-west','receiver-east','altar-step-1','altar-step-2','altar-step-3','altar-platform'],scope:'Reachable western stair spacing and thin one-way gallery roofs; unchanged boss/ritual and waves.',clusterPositions:{}};
 const top=(id,x)=>{const ps=s.terrains.find(t=>t.id===id).points;for(let i=1;i<ps.length;i++){const a=ps[i-1],z=ps[i];if(z.x>a.x&&x>=a.x&&x<=z.x)return a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);}};
 const sites={'foe-0-cluster':[1180,'west-step'],'foe-3-cluster':[1862,'outer-yard'],'foe-6-cluster':[1690,'west-gallery'],'foe-1-cluster':[2075,'altar-step-3'],'foe-4-cluster':[2680,'altar-step-2'],'foe-7-cluster':[3290,'outer-yard'],'foe-2-cluster':[3500,'east-step'],'foe-5-cluster':[4310,'outer-yard']};
 for(const[id,[x,support]]of Object.entries(sites))s.design.positioning.clusterPositions[id]={x,y:top(support,x)};
 s.design.positioning.roles=['서쪽 계단 전위/회랑 측면 경비','중앙 비탈의 중갑 차단과 가지 끝 혼령 견제','주박 아래 전위와 두 번째 가지 수비','동쪽 복귀길/계단 차단과 바깥 후위'];
 return project;
}
