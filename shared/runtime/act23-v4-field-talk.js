(function(G){'use strict';
// Field-only Act2 choices use the same approved rows and live guards as Story.
// Chapter24 alone additionally exposes its explicitly authored pre-intro choices.
const V=G.HonroAct23V4,P=G.HonroAct23V4ReviewedChapters,R=G.HonroAct23V4Reviewed;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function available(app){const b=app.engine?.b,n=b?.honroStage;if(app.screen!=='battle'||!V.active(b)||b.side!==0||b.phase!=='aim'||!V.safe(app))return[];
 if(n===24){const provider=R.provider(24);if(!provider?.active(b))return[];return V.heroes(b).flatMap(u=>{const lines=provider.fieldOptional(app,u.cls);return lines.length?[{cls:u.cls,name:G.HONRO_CONTENT.hero[u.cls].name,ids:lines.map(l=>l[2].rowId)}]:[];});}
 if(n<11||n>20||!(n===11?R.active(b):P.active(b)))return[];
 const q=n===11?R.memory(b):P.memory(b),read=new Set(Object.entries(q.events).filter(([key,e])=>key.startsWith('field-talk.')&&['done','skipped'].includes(e.status)).flatMap(([,e])=>e.ids));
 const profile={...app.profile,honroBattle:b};return V.heroes(b).filter(u=>app.profile.party?.includes(u.cls)).flatMap(u=>{const lines=(R.optional(profile,n,u.cls)||[]).filter(l=>!read.has(l[2].rowId)&&G.HonroStory.allowed(app,l[0],l[2]));return lines.length?[{cls:u.cls,name:G.HONRO_CONTENT.hero[u.cls].name,ids:lines.map(l=>l[2].rowId)}]:[];});
}
function render(app){const choices=available(app);return choices.length?`<section class="field-talk"><h3>현장 대화</h3><div class="actions">${choices.map(c=>`<button type="button" data-reviewed-field-talk="${esc(c.cls)}">${esc(c.name)}</button>`).join('')}</div></section>`:'';}
function use(app,cls){if(app.screen!=='battle'||app.dialogue||!['archer','mage','knight','occultist'].includes(cls))return false;app.close();const choice=available(app).find(c=>c.cls===cls);if(!choice)return false;const b=app.engine.b,key='field-talk.'+cls+'.'+choice.ids.join('|');return b.honroStage===24?R.provider(24).begin(app,key,choice.ids):b.honroStage===11?R.begin(app,key,choice.ids,{fieldTalk:true}):P.apiFor(b.honroStage).begin(app,key,choice.ids,{fieldTalk:true});}
G.document?.addEventListener('click',event=>{const button=event.target.closest?.('[data-reviewed-field-talk]');if(button&&G.HonroApp)use(G.HonroApp,button.dataset.reviewedFieldTalk);});
G.HonroAct23V4FieldTalk={available,render,use};
})(globalThis);
