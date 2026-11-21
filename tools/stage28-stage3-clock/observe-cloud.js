q=>{
 const a=HonroApp,b=a.engine?.b,s=a.scene,td=HonroTimeOfDay;
 if(!b||b.honroStage!==3||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||
    b.honroCanonical!==true||b.honroAuthoredId!=='stage-3'||b.phase!=='aim'||b.round!==1)
   throw Error('wrong Stage 3 exact attribution control');
 const {phase,ms,sameStandardTimers}=__honroStage3Clock.law(), cloud=s._honroClouds, e=td.entry(b);
 if(!e||e.start!=='18:50'||e.sky===false||e.clock===false||(e.clouds??.7)<=0||
    !cloud||![cloud.x,cloud.v,cloud.at].every(Number.isFinite)||cloud.at!==ms||q.ms!==ms)
   throw Error('native exact clock, timeline and cloud not established');
 return {phase,ms,sameStandardTimers,sceneTime:s.time,
   view:[s.x,s.y,s.scale],canvas:[s.canvas.width,s.canvas.height],wind:Number.isFinite(b.wind)?b.wind:0,
   cloud:{x:cloud.x,v:cloud.v,at:cloud.at},grade:{at:s._honroTime?.at,value:s._honroTime?.value},
   metadata:{profile:e.profile??'default',start:e.start,end:e.end,cloudDensity:e.clouds??.7,moon:e.moon??null}};
}
