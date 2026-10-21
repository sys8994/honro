()=>{
 const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,u=e.heroesAlive()[0],log=[],images={},snapshots=[],airTurns=[];
 const airClear=[];const initial=structuredClone(b),entryProfile=structuredClone(a.profile),start={hp:u.hp,maxHp:u.maxHp,focus:u.focus,level:u.level,items:structuredClone(b.items)};
 let ticks=0,index=0,firstShot=false,warned=false,lastAirRound=0,shots=0,waits=0;const points=[{x:1600,support:'left-tree-branch-upper'},{x:1100,support:'left-tree-branch-upper',drop:true},{x:1450,support:'left-tree-branch-middle'},{x:1050,support:'left-tree-branch-middle',drop:true},{x:1500,support:'left-tree-branch-lower'},{x:1350,support:'left-tree-branch-lower',drop:true},{x:1050,support:'left-descent-stone-low'},{x:1460,support:'canyon-ground'},{x:1830,support:'canyon-ground'}];
 const at=()=>({x:u.x,y:u.y,hp:u.hp,round:b.round,move:u.moveLeft,carX:e.unit('objective')?.x,carHp:e.unit('objective')?.hp});
 function capture(label,x=u.x,y=u.y-150,scale=.65){const s=a.scene;Object.assign(s,{x,y,scale,manual:true,storyTween:null,cinematic:null});s.render(e,0,'',.6,false,0);images[label]=document.querySelector('#battlecanvas').toDataURL('image/png');a.export();snapshots.push({label,profile:structuredClone(a.profile),battle:structuredClone(b)});}
 function step(){if(a.dialogue)HonroStory.finish(a);e.tick(C.STEP);if(!a.dialogue)a.missionTick(C.STEP);ticks++;if(b.side===1&&ticks%30===0)for(const v of e.alive(1).filter(C.flyingEnemy))if(!C.flightClear(e,v,v))throw Error('Air overlap '+v.id+' '+v.x+','+v.y);if(!warned&&b.honroState.stage2Airborne?.warning){warned=true;capture('airborne-warning',2700,1600,.35);}if(b.side===1&&b.round!==lastAirRound){lastAirRound=b.round;if([2,4,6].includes(b.round))capture('air-turn-'+b.round,2330,1120,.65);airTurns.push({round:b.round,queue:[...b.queue],air:e.alive(1).filter(v=>v.fixed).map(v=>({id:v.id,x:v.x,y:v.y,awake:v.awake,move:v.moveLeft,aiMove:structuredClone(v.aiMove)}))});}}
 function aim(){const targets=e.alive(1).sort((v,w)=>Number(w.awake)-Number(v.awake)||Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y));for(const v of targets)for(const p of e.shotSeeds(u,C.SKILLS.A01,v)){const pred=e.predict(u,C.SKILLS.A01,p.angle,p.power,v,false);if(pred.unit===v.id){const viability=C.shotViable(e,u,C.SKILLS.A01,v,p.angle,p.power);if(viability.risk<1&&viability.friendlyDamage===0)return{p,v};}}}
 function fireOrWait(){const s=aim();if(s&&e.fire('A01',s.p.angle,s.p.power)){shots++;log.push({op:'fire',...at(),target:s.v.id,...s.p});return true;}a.defend();waits++;log.push({op:'defend',...at()});return false;}
 // Raster the exact rear silhouette at world scale, not its collision polygon.
 const mask=document.createElement('canvas');mask.width=b.width;mask.height=b.height;const mc=mask.getContext('2d');HonroStage2LayeredRoadArt.rear.call(a.scene,mc,b);const r=b.honroMap.flightRegion,pixels=mc.getImageData(r.left,r.top,r.right-r.left,r.bottom-r.top).data;let opaque=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])opaque++;if(opaque)throw Error('Authored flight region overlaps rendered cliff: '+opaque+' pixels');airClear.push({scope:'entire world flight rectangle, actual common rear renderer at 1px/world unit',opaquePixels:opaque,region:r});mask.width=1;
 capture('entry-high',1000,850,.65);
 for(let n=0;n<160000&&!['won','lost'].includes(b.phase);n++){
  if(e.canAct()&&e.active?.id===u.id&&!a.dialogue){
   if(u.hp<u.maxHp*.32&&b.items.heal>0){e.item('heal');log.push({op:'item-heal',...at()});}
   else if(!firstShot){firstShot=true;fireOrWait();}
   else if(index<points.length){const p=points[index],surface=e.contactSurface(u.x,u.y-4,u.y+5)?.t.id;if(e.grounded(u)&&Math.abs(u.x-p.x)<7&&surface===p.support){log.push({op:'route',index,...at(),support:surface});capture('route-'+index);if([0,2].includes(index))fireOrWait();if(p.drop&&!e.drop(u))throw Error('Intended branch drop refused');index++;}else if(u.moveLeft>10){e.move(Math.sign(p.x-u.x),Math.min(C.STEP,Math.abs(p.x-u.x)/u.walkSpeed));}else fireOrWait();}
   else fireOrWait();
  }
  step();if(ticks%20000===0)log.push({op:'checkpoint',index,phase:b.phase,...at(),foes:e.alive(1).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp}))});
 }
 capture('convoy-arrival',3500,2780,.6);a.export();
 return{method:'Production browser Engine move/drop/fire/defend and missionTick. Legal chapter1 entry fixture. No position, HP, movement, item or objective writes. Not keyboard manual play.',normalResources:true,entryProfile,initial,start,end:{phase:b.phase,round:b.round,...at(),enemies:e.alive(1).length,flags:b.honroState.flags},routeIndex:index,ticks,shots,waits,log,airTurns,airClear,snapshots,final:structuredClone(b),images};
}
