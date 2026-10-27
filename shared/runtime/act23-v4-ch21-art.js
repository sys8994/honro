(function(G){'use strict';
// Reuse the existing guard's vector rig and clips; remove flesh from the old
// armour only. The current dead guard keeps its face and current insignia.
const V=G.HonroAct23V4,S=G.HonroAct23V4Chapter21,P=G.HonroScene.prototype,clone=x=>JSON.parse(JSON.stringify(x));
const original=G.HONRO_MONSTERS?.assets?.possessedGuard;if(!original)return;
const a=clone(original);a.id='v4.gate-empty-armor';a.palette={...a.palette,cloth:'#655948',clothLight:'#968265',bone:'#727b70',boneShade:'#3d4945'};
const head=a.parts.find(p=>p.id==='head');head.paths=[{d:'M-11 -108 Q0 -115 11 -107 L12 -94 5 -86 -6 -88 -12 -98Z',fill:'ink',stroke:'metal',width:1.6,lod:0}];
const torso=a.parts.find(p=>p.id==='torso');torso.paths.push({d:'M-9 -91 Q0 -95 10 -89 L7 -78 -7 -79Z',fill:'ink',width:0,lod:0});
// The same retained diamond is used by the later old banner. It is separate
// from the current guard's blue horizontal insignia and all village tags.
torso.paths.push({d:'M-4 -78 L3 -86 10 -78 3 -70Z M3 -82 L7 -78 3 -74 -1 -78Z',fill:'metalLight',stroke:'ink',width:1,lod:0});
const visual=G.HonroVectorParts.create({[a.id]:a}),body=P.unitBody;
P.unitBody=function(c,u,...args){if(!G.HonroAct23V4Chapter21Reviewed?.enabled())return body.call(this,c,u,...args);if(u.id==='v4.gate-cart')return;if(u.honroV4Injured){body.call(this,c,u,...args);c.save();c.strokeStyle='#c3b99a';c.lineWidth=6;c.beginPath();c.moveTo(u.x-17,u.y-u.h*.62);c.lineTo(u.x+18,u.y-u.h*.72);c.stroke();c.restore();return;}if(!u.honroV4ArmorIdentity)return body.call(this,c,u,...args);
 if(u.honroV4ArmorIdentity==='current-dead'){body.call(this,c,u,...args);c.save();c.translate(u.x,u.y-u.h*.7);c.fillStyle='#8aa6b3';c.fillRect(-8,-3,16,5);c.restore();return;}
 c.save();c.translate(u.x,u.y);const scale=u.h/a.baseHeight;c.scale(scale*(u.facing||1),scale);visual.draw(c,a.id,{time:this.time||0,state:u.dead?{}:visual.state(u),pixels:u.h*(this.scale||1)});c.restore();
};
const plugin=V.plugins.get(21);V.register(21,{...plugin,draw(scene,c,b,e){plugin.draw?.(scene,c,b,e);if(!S.active(b))return;const q=S.memory(b),cart=b.units.find(u=>u.id==='v4.gate-cart');if(cart){const stopped=S.cartStopped(b);c.save();c.translate(cart.x,cart.y);c.fillStyle='#6e5840';c.strokeStyle='#b09a73';c.lineWidth=3;c.fillRect(-84,-78,168,37);c.strokeRect(-84,-78,168,37);for(const x of[-58,58]){c.save();c.translate(x,-26);c.rotate(stopped?q.wheel:Math.sin(q.wheel)*.24);c.beginPath();c.arc(0,0,26,0,Math.PI*2);c.stroke();for(let i=0;i<4;i++){c.rotate(Math.PI/4);c.beginPath();c.moveTo(-25,0);c.lineTo(25,0);c.stroke();}c.restore();}c.restore();}
 if(q.wreck){c.save();scene.unitBody(c,{...b.units.find(u=>u.id===q.wreck.id),...q.wreck,dead:true,hp:0},0);c.restore();}

}});
// Render the actual unchanged gate battlefield behind the pre-entry camp.
// This supplies observation evidence without entering battle, moving any NPC,
// granting rewards or touching the player's serialized battle/resources.
function mountRest(app,ready){const R=G.HonroAct23V4Chapter21Reviewed,p=app.profile,id=app.debugRestStage||p.honroJourney?.restStageId||G.HonroJourneyContent.next(p)?.stageId;
 if(!R.enabled()||app.screen!=='rest'||id!==21||p.honroBattle||p.cleared?.[21])return false;
 const token={};app.honroReviewed21RestRequest=token;const root=app.root,buttons=[...root.querySelectorAll('[data-action="rest-talk"]')];for(const button of buttons)button.disabled=true;
 Promise.resolve(G.HonroCampaignLoader.ensureStage(21)).then(()=>{if(app.honroReviewed21RestRequest!==token||app.root!==root||app.screen!=='rest'||app.profile!==p||p.honroBattle||(app.debugRestStage||p.honroJourney?.restStageId||G.HonroJourneyContent.next(p)?.stageId)!==21)return;
  const backdrop=root.querySelector('.rest-background');if(!backdrop)return;const canvas=document.createElement('canvas');canvas.style.cssText='width:100%;height:100%;display:block;pointer-events:none';backdrop.replaceChildren(canvas);
  const profile=clone(p),b=G.HonroWorld.build(G.HONRO_CONTENT.stages[20],profile,false,'archer','A01');V.prepare(b,profile);const engine=new G.HONRO_CORE.Engine(b,()=>{},true),scene=new G.HonroScene(canvas);scene.manual=true;scene.x=2200;scene.y=2490;scene.scale=Math.max(.3,canvas.getBoundingClientRect().width/2000);scene.render(engine,0,null,0,false,0,true);scene.x=2200;scene.y=2490;scene.render(engine,0,null,0,false,0,true);
  if(!R.observeRest(app,{rendered:true,battle:b}))return;app.honroReviewed21RestPreview={scene,engine,canvas};
  for(const button of buttons){const available=R.optional(p,21,button.dataset.class).length>0;button.disabled=!available;if(available)button.removeAttribute('aria-disabled');}
  app.persist();ready();
 }).catch(error=>{app.honroReviewed21RestPreviewError=String(error);});return true;
}
G.HonroAct23V4Chapter21Art={asset:a,emblem:'old-sealed-diamond',mountRest};
})(globalThis);
