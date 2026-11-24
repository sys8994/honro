function bindNativeSpoken(app,s){
 const e=app.engine,scene=app.scene,b=e?.b,id=b?.honroStage;
 if(!s||b!==s.b||e!==s.engine||!scene||id<51||id>57||s.spoken)return;
 const lease=()=>active.get(app)===s&&s.engine===e&&s.b===b&&app.stageId===id&&app.screen==='battle'&&!app.training&&!app.debugMode&&!app.customMap;
 s.spoken=bindEarlySpoken({app,engine:e,scene,session:s,authorize:lease,captions:earlyLines});
 if(id===53&&s.previous?.stage===52&&s.previous.flags?.['act6.darmheoInTemple']===true&&s.previous.flags?.['act6.outerSitesPrepared']===true&&
    ['archer','knight','occultist'].every(k=>s.previousExternal?.[k]?.cls===k)&&
    b.units.filter(u=>u.side===0&&!u.summoned).length===1&&e.active?.cls==='mage'&&e.grounded(e.active)&&
    s.previous.actors?.some(u=>u.cls==='mage'&&u.id===e.active.id))s.spoken?.emit('darmheoSplitCommitted');
}
function observeNativeSpoken(s,before,result,e){
 const id=e.b.honroStage;
 if(!s?.spoken||result?.ok!==true)return;
 if(id===55&&before?.targets?.[0]?.id==='reach-bell'&&e.active?.cls==='knight'&&e.grounded(e.active))s.spoken.emit('hwigyeomBellTerraceReached');
 if(id===56&&before?.appActions?.mission==='open')s.spoken.emit('temporaryPassageOpen');
 if(id===57&&['keeperClaimed','ownBodyAndBridgeOpened'].includes(result.storyCue))s.spoken.emit(result.storyCue);
}
