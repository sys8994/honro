"""Shared disposable-profile browser fixtures, never imported by the game."""
SETUP='''async id=>{
 const a=HonroApp;a.frame=()=>{};a.stopBattle();a.close();a.profile=HonroProfileStore.fresh();a.normalProfile=a.profile;
 a.profile.recruited=[...HONRO_CORE.CLASS_IDS];a.profile.party=[...a.profile.recruited];
 for(let i=1;i<id;i++)a.profile.cleared[i]={visits:1,rounds:18};
 await HonroCampaignLoader.ensureStage(id);a.launch(id);
 for(let i=0;i<30&&a.dialogue;i++)HonroStory.finish(a,true);
 a.turnNotice=null;a.banterCurrent=null;a.modal.classList.remove('open');
 document.getElementById('turn-banner')?.remove();
 Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,time:2});
 return {x:a.engine.active.x,y:a.engine.active.y};
}'''
PAINT='''v=>{const a=HonroApp,s=a.scene;Object.assign(s,{x:v.x,y:v.y,scale:v.scale,manual:true,storyTween:null,goalFocus:null,cinematic:null,time:2});s.render(a.engine,0);a.updateHUD(true);}'''
OVERLAY='''()=>{const a=HonroApp,s=a.scene,b=a.engine.b,cv=s.canvas,c=cv.getContext('2d'),r=cv.getBoundingClientRect();c.save();c.setTransform(cv.width/r.width,0,0,cv.height/r.height,0,0);c.translate(r.width/2,r.height/2);c.scale(s.scale,s.scale);c.translate(-s.x,-s.y);c.lineWidth=1.5/s.scale;c.strokeStyle='#00ffff';
 for(const t of b.terrain){if(t.broken||t.honroCeiling)continue;const ps=HONRO_CORE.poly(t);for(const i of t.honroWalkEdges||[]){const u=ps[i],v=ps[(i+1)%ps.length];c.beginPath();c.moveTo(u.x,u.y);c.lineTo(v.x,v.y);c.stroke();}}
 c.fillStyle='#ff42ed';for(const u of b.units.filter(u=>u.side===0)){c.beginPath();c.arc(u.x,u.y,4/s.scale,0,7);c.fill();}c.restore();}'''
