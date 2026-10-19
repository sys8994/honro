import{imageSpace}from'./sop-image-space.mjs';
const profiles={
 'canyon-ground':[[0,936],[150,945],[300,962],[500,975],[700,981],[900,980],[1060,965],[1200,943],[1320,912],[1440,886]],
 'left-high-ground':[[0,184],[150,207],[310,225],[460,243],[580,257],[650,264]],
 'left-shoulder-high':[[435,392],[480,406],[525,423],[600,448]],
 'left-shoulder-low':[[490,530],[550,538],[610,557],[650,574]],
 'left-toe':[[575,646],[640,664],[710,687],[745,696]],
 'middle-shelf':[[700,742],[800,745],[895,756],[970,777],[1020,786]],
 'left-front-slope':[[0,679],[110,706],[210,734],[280,754],[310,798],[360,846],[432,875]]
};
export function applyStage2ImageFirst(project){const s=project.stages.find(s=>s.metadata?.stageId===2);if(!s)return project;const q=imageSpace(s,{width:1440,height:1092,worldWidth:6200,profiles,floor:'canyon-ground'}),{scale:S,contact:c,air,poses}=q;
 poses({'p-archer':c(644,'left-high-ground'),'foe-0':c(555),'foe-3':c(810),'foe-1':air(1010,390),'foe-4':air(1000,210),'foe-2':c(1110),'foe-5':c(1010),objective:c(300),'ally-bokman':c(245),'ally-baeksan':c(415),'npc-damheo':c(360),'npc-yeonsil':c(190)});
 const goal=c(1380);s.anchors={...s.anchors,archerPerch:c(644,'left-high-ground'),procession:c(300),leftBasin:c(660),rightBasin:c(1080),rightShelf:air(1080,470),exit:goal};const marks=[c(644,'left-high-ground'),c(300),c(550),c(950),c(1100),c(850,'middle-shelf'),c(970,'middle-shelf')];for(const[i,m]of s.markers.entries())Object.assign(m,marks[i]);
 const progress={'procession-seen':330,'road-pressure':620,'sniper-seen':770,'right-cliff':1040,'last-flight':1260};const rebase=(w,x)=>{if(!w)return;if(w.progress!==undefined)w.progress=x;if(w.any)w.any.forEach(v=>rebase(v,x));};for(const e of s.events){rebase(e.when,progress[e.id]*S);if(e.id==='road-pressure')Object.assign(e.action,{...c(760),spacing:175,maxDistance:260});if(e.action?.type==='sniperAmbush')Object.assign(e.action,{...air(1060,430),requireFlightClearance:true,maxDistance:420});}
 const waters=s.materials.filter(m=>m.conductive&&/water/.test(m.kind));s.materials=waters.map((m,i)=>({...m,kind:'shallow-water',terrainId:'canyon-ground',support:'canyon-ground',x1:[1060,1240][i]*S,x2:[1120,1300][i]*S,reference:q.at([1090,1270][i]),depth:7,alpha:.13,points:undefined,surface:undefined,bottom:undefined}));
 const road=[c(300),c(660),c(950),c(1200),goal];q.finish(road);s.design.stage2ImageFirst={...q.meta('stage2SopNear',1010),revision:5,highCliffs:1,overwatchView:{x:720*S,y:560*S,spanY:825*S,maxX:660*S,maxY:330*S},airborneAlertX:590*S,walkRibbon:q.points(profiles['canyon-ground']),runtimeRoster:{'foe-0-cluster':c(690),'foe-3-cluster':{...c(1200),group:3,honroCluster:'exit-core'},'foe-1-cluster':air(900,505),'foe-4-cluster':air(745,545),'foe-2-cluster':{...c(930),group:1,honroCluster:'procession-screen'},'foe-5-cluster':c(1320)},routes:{road,left:[c(644,'left-high-ground'),c(590,'left-high-ground'),c(550,'left-shoulder-high'),c(610,'left-shoulder-low'),c(710,'left-toe'),c(850,'middle-shelf'),c(1050)]}};

 Object.assign(s.initialState,{honroEscortGoalX:goal.x,honroStage2AirborneRevision:1});return project;
}
