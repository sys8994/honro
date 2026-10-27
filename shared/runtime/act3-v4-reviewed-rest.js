(function(G){'use strict';
// Actual pre-entry field observation for Act3 providers that need visible props.
// Runs in the existing rest lifecycle; no second animation loop or battle save.
function mount(app,ready){const id=app.debugRestStage||app.profile.honroJourney?.restStageId||G.HonroJourneyContent.next(app.profile)?.stageId,R=G.HonroAct3V4ReviewedCore.providers.get(id),p=app.profile;
 if(!R?.enabled()||!R.config.restTarget||app.screen!=='rest'||p.honroBattle||p.cleared?.[id])return false;
 const token={};app.honroAct3ReviewedRestRequest=token;const root=app.root,buttons=[...root.querySelectorAll('[data-action="rest-talk"]')];for(const button of buttons)button.disabled=true;
 Promise.resolve(G.HonroCampaignLoader.ensureStage(id)).then(()=>{if(app.honroAct3ReviewedRestRequest!==token||app.screen!=='rest'||app.root!==root||app.profile!==p||p.honroBattle||(app.debugRestStage||p.honroJourney?.restStageId||G.HonroJourneyContent.next(p)?.stageId)!==id)return;
  const host=root.querySelector('.rest-background');if(!host)return;const cv=document.createElement('canvas');cv.style.cssText='width:100%;height:100%;display:block;pointer-events:none';host.replaceChildren(cv);
  const profile=JSON.parse(JSON.stringify(p)),b=G.HonroWorld.build(G.HONRO_CONTENT.stages[id-1],profile,false,'archer','A01');G.HonroAct23V4.prepare(b,profile);const engine=new G.HONRO_CORE.Engine(b,()=>{},true),scene=new G.HonroScene(cv),target=R.config.restTarget(b),box=cv.getBoundingClientRect();scene.manual=true;scene.scale=Math.max(.3,box.width/1800);scene.x=target.x;scene.y=target.y-140;scene.render(engine,0,null,0,false,0,true);scene.x=target.x;scene.y=target.y-140;scene.render(engine,0,null,0,false,0,true);
  const x=(target.x-scene.x)*scene.scale+box.width/2,y=(target.y-scene.y)*scene.scale+box.height/2;if(x<30||x>box.width-30||y<30||y>box.height-30)return;
  R.config.restObservation(p,b);app.honroAct3ReviewedRestPreview={id,scene,engine,canvas:cv};for(const button of buttons){const available=R.optional(p,id,button.dataset.class).length>0;button.disabled=!available;if(available)button.removeAttribute('aria-disabled');}app.persist();ready();
 }).catch(error=>{app.honroAct3ReviewedRestError=String(error);});return true;
}
G.HonroAct3V4ReviewedRest={mount};
})(globalThis);
