import{imageSpace,sourceSteps}from'./sop-image-space.mjs';
const profiles={
 'ferry-ground':[[0,688],[180,688],[230,619],[350,619],[550,628],[700,618],[850,626],[1000,647],[1160,661],[1320,658],[1460,636],[1600,619],[1740,578],[1870,552],[1983,508]],
 'dock-west':[[0,598],[80,605],[150,608],[200,609]],
 'bank-middle':[[980,543],[1100,532],[1220,518],[1300,507],[1380,504]],
 'ridge-walk':[[820,396],[940,421],[1080,438],[1200,449],[1230,455],[1280,480],[1300,497]],
 'warehouse-yard':[[1365,420],[1450,418],[1560,419],[1710,425],[1810,428],[1845,430]],
 'cargo-step-1':[[1540,414],[1595,417]],
 'warehouse-roof':[[1435,337],[1470,329],[1510,297],[1590,286],[1680,267],[1720,248],[1750,286],[1775,326],[1790,337]],
 'sop3-bank-step':[], 'sop3-yard-step':[], 'cargo-step-2':[]
};
const rocks=[{ref:[1035,663],top:5,polygon:[[982,673],[1000,665],[1035,663],[1067,670],[1094,691],[1100,725],[1080,750],[1015,753],[975,742],[966,710]]},{ref:[290,623],top:4,polygon:[[265,630],[290,623],[310,625],[326,636],[334,649],[324,663],[307,678],[286,685],[261,682],[254,665],[254,645]]}];
const steps=sourceSteps(profiles,rocks,[['sop3-bank-step',0,.65,[1000,590]],['sop3-yard-step',1,.8,[1350,455]],['cargo-step-2',1,.9,[1435,365]]]);
export function applyStage3ImageFirst(project){const s=project.stages.find(s=>s.metadata?.stageId===3);if(!s)return project;const q=imageSpace(s,{width:1983,height:793,worldWidth:7000,profiles,floor:'ferry-ground',wood:['dock-west','warehouse-roof']}),{scale:S,contact:c,air}=q;steps.apply(s,q);
 q.poses({'p-archer':c(45,'dock-west'),'p-mage':c(120,'dock-west'),'npc-hwigyeom':c(390),'foe-0':c(650),'foe-3':c(930),'foe-1':air(600,330),'foe-4':air(900,240),'foe-2':c(1420,'warehouse-yard'),'foe-5':c(1630,'warehouse-roof'),'midboss-stage3':c(790)});
 s.anchors={...s.anchors,start:c(45,'dock-west'),ferry:c(150,'dock-west'),mudflat:c(650),cargo:c(1200,'bank-middle'),ledger:c(1560,'cargo-step-1'),roof:c(1590,'warehouse-roof'),exit:c(1930)};
 const marks=[c(100,'dock-west'),c(430),c(875),c(1000),c(1240),c(1670,'warehouse-yard'),c(1900)];for(const[i,m]of s.markers.entries()){if(i<marks.length&&m.id!=='ledger')Object.assign(m,marks[i]);if(m.id==='ledger')Object.assign(m,s.anchors.ledger);if(m.id==='habitat-3-0')Object.assign(m,c(1140));if(m.id==='habitat-3-1')Object.assign(m,air(1100,280));}
 const progress={'midboss-stage3-seen':530,'dock-beasts':570,transfer:1200};for(const e of s.events){if(e.when?.progress!==undefined)e.when.progress=progress[e.id]*S;if(e.id==='dock-beasts')Object.assign(e.action,{...c(1100),spacing:180,maxDistance:260});}
 const water=s.materials.find(m=>m.id==='ferry-water');s.materials=[{...water,id:'ferry-water',kind:'water',support:'ferry-ground',terrainId:'ferry-ground',conductive:true,x1:0,x2:210*S,surfaceY:646*S,depth:80*S,reference:646*S,step:24,alpha:.2,surface:undefined,bottom:undefined,points:undefined}];
 const main=[c(45,'dock-west'),c(180,'dock-west'),c(280),c(650),c(950),c(1000,'sop3-bank-step'),c(1010,'bank-middle'),c(1300,'bank-middle'),c(1350,'sop3-yard-step'),c(1410,'warehouse-yard'),s.anchors.ledger];q.finish(main);delete s.design.stage3Hanok;delete s.design.forestChoice;
 s.design.stage3ImageFirst={...q.meta('stage3SopNear',710),revision:3,storyThread:{from:air(1495,349),at:air(1540,350),to:air(1595,348),tail:air(1542,371)},stepSprites:steps.sprites,runtimeRoster:{'foe-0-cluster':c(1000),'foe-3-cluster':c(1250),'foe-1-cluster':air(1110,280),'foe-4-cluster':air(1730,95),'foe-2-cluster':c(1750,'warehouse-yard'),'foe-5-cluster':c(1930)},routes:{main,roof:[c(1410,'warehouse-yard'),c(1435,'cargo-step-2'),c(1470,'warehouse-roof'),c(1590,'warehouse-roof')]},waterClip:q.points([[0,645],[180,656],[220,672],[400,700],[750,729],[850,752],[785,793],[0,793]])};delete s.initialState.honroStage3HanokRevision;return project;
}
