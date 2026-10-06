(function(G){'use strict';
// One shared authoring/migration recipe. This low exposed root is deliberately
// one-way like the existing branches: adding it cannot embed a saved body or
// change any old support. No world bounds, actor placement or mission reset.
const ID='root-reentry',REVISION=1;
const BASE={
 'root-floor':{mat:'rock',oneWay:false,points:[[0,4480],[3600,4480],[3600,5200],[0,5200]]},
 'tier-low':{mat:'wood',oneWay:true,points:[[180,4200],[1150,3850],[1900,3500],[1900,3595],[1150,3945],[180,4295]]}
};
function terrain(){return{id:ID,name:'아랫뿌리 발디딤',type:'solid',points:[[20,4480],[170,4300],[470,4300],[930,4480],[930,4520],[20,4520]].map(([x,y])=>({x,y})),baseMaterial:'wood',oneWay:true,breakable:false,properties:{hp:99999,maxHp:99999,route:true,surfaceKind:'wood',artSeed:1},layer:'terrain',detail:{spacing:18,roughness:0,seed:1,optimizeEpsilon:0}};}
function matches(items,compiled=false){return Object.entries(BASE).every(([id,base])=>{
 const t=items?.find(t=>t.id===id),ps=compiled?t?.vertices:t?.points;
 return t&&!t.broken&&(compiled?t.indestructible:!t.breakable)&&(compiled?t.mat:t.baseMaterial)===base.mat&&t.oneWay===base.oneWay&&ps?.length===base.points.length&&ps.every((p,i)=>p.x===base.points[i][0]&&p.y===base.points[i][1]);
});}
function applyProject(project){
 const st=project.stages?.find(s=>s.id==='stage-7'&&s.metadata?.stageId===7&&s.metadata?.campaign===true);
 if(st?.width===3600&&st.height===5000&&matches(st.terrains)&&!st.terrains.some(t=>t.id===ID))st.terrains.push(terrain());
 return project;
}
function upgradeBattle(b){
 // Historical/imported/custom layouts keep their saved map. Only the current
 // canonical scene with exact lower-ground signatures accepts this additive fix.
 if(b?.mode!=='campaign'||b.honroMapOrigin!=='campaign'||b.honroStage!==7||b.honroCanonical!==true||b.honroCustom!==false||b.honroAuthoredId!=='stage-7'||b.width!==3600||b.height!==5000||b.honroMap?.act1Scene?.version!==1||!matches(b.terrain,true)||b.terrain.some(t=>t.id===ID))return false;
 // Origin is positive, but require the full current canonical map fingerprint
 // as well. Unmarked historical exports are intentionally not auto-upgraded:
 // an old custom export can otherwise be indistinguishable from campaign.
 const st=G.HONRO_PROJECT?.stages?.find(s=>s.id==='stage-7'&&s.metadata?.campaign===true);
 if(!st||!G.HonroMaps?.compile)return false;
 const signature=ts=>JSON.stringify(ts.filter(t=>t.id!==ID).map(t=>({id:t.id,vertices:t.vertices,mat:t.mat,oneWay:!!t.oneWay,indestructible:!!t.indestructible})));
 if(signature(b.terrain)!==signature(G.HonroMaps.compile(st,G.HONRO_PROJECT).terrain)||JSON.stringify(b.honroMapAnchors)!==JSON.stringify(st.anchors)||JSON.stringify(b.honroMap)!==JSON.stringify(st.design))return false;
 b.terrain.push(G.HonroGeometry.terrain(terrain(),b.height));
 b.honroStage7ReentryRevision=REVISION;b.sceneVersion=(b.sceneVersion||0)+1;
 return true;
}
G.HonroStage7Reentry={id:ID,revision:REVISION,terrain,matches,applyProject,upgradeBattle};
})(globalThis);
