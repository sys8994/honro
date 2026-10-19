import{imageSpace,sourceSteps}from'./sop-image-space.mjs';
const profiles={
 'gate-basin':[[0,788],[240,784],[500,783],[760,784],[980,775],[1180,760],[1320,729],[1480,690],[1659,673]],
 'gate-terrace':[[120,342],[240,350],[360,365],[460,366],[520,378]],
 'gate-threshold':[[185,337],[235,339],[282,341]],
 'west-shoulder':[[0,227],[85,236],[130,247]],
 'gate-roof':[[50,205],[87,185],[118,139],[150,164],[200,182],[290,196],[328,217]],
 'gate-middle-approach':[[440,475],[530,507],[640,546],[740,572],[830,604],[900,644],[990,650]],
 'gate-lower-toe':[[1000,718],[1090,742],[1160,746]],
 'burned-gallery':[[1000,506],[1070,518],[1160,533],[1260,524],[1310,510]],
 'east-rock-low':[[1450,646],[1530,623],[1600,641],[1659,650]],
 'east-rock-high':[[1350,397],[1430,418],[1530,451],[1659,462]],
 'east-step-1':[[1440,384],[1470,365],[1500,350],[1580,347],[1625,354]],
 'east-rail':[[1500,319],[1560,316],[1600,307],[1620,310]],
 'east-watch':[[1435,279],[1480,260],[1540,220],[1570,246],[1630,272]],
 'sop4-wall-step':[], 'sop4-approach-low':[], 'sop4-approach-high':[], 'sop4-valley-step':[],
 'sop4-east-low':[], 'sop4-east-middle':[], 'sop4-east-upper':[]
};
const rocks=[{ref:[254,822],top:4,polygon:[[230,827],[254,822],[285,831],[310,844],[325,870],[320,899],[290,906],[256,900],[225,883],[218,850]]},{ref:[545,829],top:4,polygon:[[521,838],[545,829],[570,832],[594,846],[607,866],[595,885],[567,894],[537,886],[516,864]]}];
const steps=sourceSteps(profiles,rocks,[['sop4-wall-step',0,.65,[125,295]],['sop4-approach-low',1,.8,[430,430]],['sop4-approach-high',0,.62,[410,390]],['sop4-valley-step',0,.65,[990,684]],['sop4-east-low',1,.72,[1550,585]],['sop4-east-middle',0,.7,[1590,531]],['sop4-east-upper',1,.7,[1625,484]]]);
export function applyStage4ImageFirst(project){const s=project.stages.find(s=>s.metadata?.stageId===4);if(!s)return project;const q=imageSpace(s,{width:1659,height:948,worldWidth:5600,profiles,floor:'gate-basin',wood:['gate-roof','burned-gallery','east-rail','east-watch'],breakable:{'burned-gallery':280}}),{scale:S,contact:c,air}=q;steps.apply(s,q);
 q.poses({'p-archer':c(340,'gate-terrace'),'p-mage':c(385,'gate-terrace'),objective:c(230,'gate-threshold'),'npc-hwigyeom':c(430,'gate-terrace'),'npc-chunrye':c(290,'gate-terrace'),'foe-0':c(500,'gate-middle-approach'),'foe-3':c(680,'gate-middle-approach'),'foe-6':c(790,'gate-middle-approach'),'foe-1':c(1180),'foe-4':c(1470),'foe-2':c(1120,'burned-gallery'),'foe-5':air(1430,170)});
 const gate=s.units.find(u=>u.id==='objective');gate.h=113*S;gate.r=44*S;
 s.anchors={...s.anchors,start:c(340,'gate-terrace'),gate:c(230,'gate-threshold'),leftLane:c(500,'gate-middle-approach'),cartChoke:c(1090),rightLane:c(1470),exit:c(1620),watch:c(1560,'east-step-1'),westVantage:c(100,'west-shoulder')};
 const marks=[s.anchors.gate,c(680,'gate-middle-approach'),c(550,'gate-middle-approach'),c(1100),c(1020),c(1550,'east-step-1'),c(1575,'east-step-1')];for(const[i,m]of s.markers.entries()){if(i<marks.length)Object.assign(m,marks[i]);if(m.id==='habitat-4-0')Object.assign(m,c(1030));if(m.id==='habitat-4-1')Object.assign(m,c(1580));}
 for(const e of s.events){if(e.id==='siege-0')Object.assign(e.action,{...c(1110),spacing:170,maxDistance:320});if(e.id==='siege-1')Object.assign(e.action,{...air(1300,220),requireFlightClearance:true,maxDistance:640});}
 s.materials=[];const yard=[c(50),c(500),c(1050),c(1450),c(1620)];q.finish(yard);delete s.design.stage4Gate;delete s.design.forestChoice;
 s.design.stage4ImageFirst={...q.meta('stage4SopNear',800),revision:2,storyThread:{from:air(180,230),at:air(205,232),to:air(320,292)},stepSprites:steps.sprites,galleryFracture:[[1184,516],[1190,516],[1188,521],[1194,524],[1189,529],[1184,526]],runtimeRoster:{'foe-0-cluster':c(940,'gate-middle-approach'),'foe-3-cluster':c(1080),'foe-6-cluster':c(1280),'foe-1-cluster':c(1370),'foe-4-cluster':c(1600),'foe-2-cluster':c(1590,'east-step-1'),'foe-5-cluster':air(1200,300)},routes:{yard,gateApproach:[c(1050),c(1050,'gate-lower-toe'),c(990,'sop4-valley-step'),c(975,'gate-middle-approach'),c(450,'gate-middle-approach'),c(430,'sop4-approach-low'),c(410,'sop4-approach-high'),c(400,'gate-terrace'),s.anchors.gate],west:[c(125,'gate-terrace'),c(125,'sop4-wall-step'),c(100,'west-shoulder'),c(95,'gate-roof')],east:[c(1600),c(1580,'east-rock-low'),c(1550,'sop4-east-low'),c(1590,'sop4-east-middle'),c(1625,'sop4-east-upper'),c(1630,'east-rock-high'),c(1440,'east-rock-high'),c(1460,'east-step-1'),c(1560,'east-rail'),c(1580,'east-watch')]}};delete s.initialState.honroStage4GateRevision;return project;
}
