/** Keep the inhabited tree's zigzag climb and three protected residents. */
export function applyStage7Positioning(project){
 const s=project.stages.find(s=>s.metadata?.stageId===7);if(!s)return project;
 const terrain=id=>s.terrains.find(t=>t.id===id),top=(id,x)=>{const ps=terrain(id).points;for(let i=0;i<ps.length;i++){const a=ps[i],b=ps[(i+1)%ps.length];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}};
 // The old fork crossed below ramp-1 and led walkers off its low tip.
 // Bring its tip back onto the climb instead of adding another platform.
 const fork=terrain('side-perch-low');fork.points=[{x:2050,y:3320},{x:2310,y:top('ramp-1',2310)},{x:2310,y:top('ramp-1',2310)+48},{x:2050,y:3368}];
 // Keep the roof's exposed top; a hollow arched root replaces its deep slab underside.
 const roof=terrain('hollow-roof');roof.points=[...roof.points.slice(0,4),{x:1740,y:3130},{x:1570,y:2910},{x:1240,y:2890},{x:1000,y:3030},{x:760,y:3188}];
 s.design.positioning={version:1,question:'주민과 같은 층을 따라 보호할까, 짧은 측면 가지를 선점해 다음 굽이를 견제할까? 오른쪽 중간 집에서 왼쪽 속빈 줄기를 거쳐 위 주민에게 돌아간다.',preserved:['tier-low','tier-mid','tier-upper','tier-crown','root-reentry','resident-1','resident-2','resident-3'],clusterPositions:{
 'foe-0-cluster':{x:1590,y:top('tier-low',1590)},
 'foe-3-cluster':{x:2630,y:top('tier-mid',2630)},
 'foe-6-cluster':{x:2100,y:top('ramp-1',2100)},
 'foe-9-cluster':{x:2730,y:top('tier-mid',2730)},
 'foe-10-cluster':{x:1740,y:top('side-perch-upper',1740)},
 'foe-8-cluster':{x:1050,y:top('tier-upper',1050)},
 'foe-2-cluster':{x:1870,y:top('tier-crown',1870)},
 'foe-5-cluster':{x:980,y:top('tier-upper',980)},
 'foe-1-cluster':{x:2250,y:2600},
 'foe-4-cluster':{x:1700,y:2450},
 'foe-7-cluster':{x:2860,y:2520}
 },roles:['아랫가지 사수1/주민 너머 전위3','첫 오름길 근접1/측면 사수1','중간집 좌측 차단2/위쪽 견제1','속빈 줄기 혼합2/측면 사수2','윗주민 전위1/끝가지2','중간 굽이 공중6']};
 const hounds=s.events.find(e=>e.id==='yard-hounds');Object.assign(hounds.action,{x:1650,y:top('tier-low',1650),support:'tier-low',spacing:110,maxDistance:240});
 const crows=s.events.find(e=>e.id==='upper-crows');Object.assign(crows.action,{x:1320,y:2200,support:'tier-upper',spacing:130,requireFlightClearance:true,maxDistance:450});
 return project;
}
