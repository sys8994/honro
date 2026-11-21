qArm => {
 const b=HonroApp.engine.b,D=HonroTerrainDomain, id='act3-handoff:29:west-bank', B='stage29:record-actual-stone-faces';
 if(!b.honroCanonical||b.honroCustom!==false||b.honroStage!==29||b.honroAuthoredId!=='stage-29'||!D.active(b))throw Error('wrong actual visual owner domain');
 const atlas=D.materialLandmarks(b), L=atlas.filter(x=>x.asset?.id===id), R=atlas.find(x=>x.asset?.id===B), src=HONRO_PROJECT.library.filter(x=>x.id===id);
 if(L.length!==1||src.length!==1||JSON.stringify(src[0])!==JSON.stringify(L[0].asset)||L[0].layer!=='front'||L[0].asset.collision.length!==0||
    !R?.honroTerrainMaterialClip||JSON.stringify(L[0].asset.params.contactMapping.slice(qArm==='B'?1:0,qArm==='B'?3:2))!=='[[0,687,0,2700],[205,687,1150,2700]]')throw Error('wrong real F/B ownership');
 if(qArm==='B'&&JSON.stringify(L[0].asset.params.contactMapping[0])!=='[-89.1304347826087,661.609375,-500,2611.1328125]')throw Error('wrong extended visual contact');
 const q=D.render(b).find(x=>x.id==='a3-foundation');
 if(!q||![[-500,2611.1328125],[0,2700],[1150,2700]].every(([x,y])=>q.vertices.some(p=>p.x===x&&p.y===y)))throw Error('wrong original F contact');
 return {atlas:[L[0].asset.id,R.asset.id],F:L[0].asset.params.contactMapping,role:L[0].layer,collision:L[0].asset.collision,
  preservedWater:(b.water??null),terrainContacts:q.vertices, stageParameters:[b.honroStage,b.phase,b.round]};
}
