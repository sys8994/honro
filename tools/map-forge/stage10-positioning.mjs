/** Accessible side galleries for the existing guardian-tree confrontation.
 * No story, units, branch climb, binding target or finale anchors are moved. */
export function applyStage10Positioning(project){
 const s=project.stages.find(s=>s.metadata?.stageId===10);if(!s)return project;
 const profiles={
  'west-step':[[1050,2670],[1290,2610]],
  'gallery-link-west':[[1190,2450],[1420,2420]],
  'west-gallery':[[1150,2320],[1450,2210],[1720,2230]],
  'east-gallery':[[3550,2180],[3850,2070],[4150,2110]]
 };
 for(const[id,top]of Object.entries(profiles)){const t=s.terrains.find(t=>t.id===id),depth=id.endsWith('gallery')?26:38;t.points=[...top,...top.toReversed().map(([x,y])=>[x,y+depth])].map(([x,y])=>({x,y}));t.oneWay=true;t.detail={...t.detail,roughness:0,optimizeEpsilon:0};}
 s.design.positioning={version:1,question:'낮은 길에서 접근하며 전위를 상대할까, 서쪽 회랑을 올라 주박으로 이어지는 높은 사선을 잡을까? 협력 뒤에는 나무 가지와 양쪽 회랑에서 소단으로 향하는 습격을 차단한다.',preserved:['sodan-binding','boss','receiver-west','receiver-east','altar-step-1','altar-step-2','altar-step-3','altar-platform'],scope:'Reachable western stair spacing and thin one-way gallery roofs; unchanged boss/ritual and waves.'};
 return project;
}
