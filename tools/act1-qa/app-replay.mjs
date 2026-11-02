/** Accepted command intent replay through the one actual-App adapter.
 * Native DOM/render/clock doubles; no browser or continuous-history claim.
 */
import assert from'node:assert/strict';import{readFile,writeFile,mkdir}from'node:fs/promises';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
import{appHarness,plain}from'../../tests/app-regression-helpers.mjs';import{createPlayerOperations}from'./player-operations.mjs';
const stage=Number(process.argv[2]||5),label=process.argv[3]||'app-accepted-replay',out=`_local/reports/act1-gameplay-20261103/stage${stage}-${label}`;assert([5,10].includes(stage));await mkdir(out,{recursive:true});
const entryPath=`tools/act1-qa/fixtures/stage${stage}-entry.json`,entry=JSON.parse(await readFile(entryPath)),source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDirtyAtStart=execFileSync('git',['status','--short'],{encoding:'utf8'}).trim();
const h=await appHarness({productionStory:true,productionInputActions:true}),{g,C}=h,app=h.load(entry.profile||entry);app.launch(stage);const e=app.engine,b=e.b,initial=plain(b),actions=[],damage=[],damageFx=[];
const ops=createPlayerOperations({app,g,C,record:r=>actions.push(r)}),hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const hp=u.hp,r=hurt(u,...args);if(hp>u.hp)damage.push({frame:ops.frames,round:b.round,target:u.id,owner:args[1],amount:hp-u.hp});return r;};
const emit=e.emit.bind(e);e.emit=(type,data)=>{if(type==='fx'&&Number.isFinite(data?.damage)&&data.targetId)damageFx.push({frame:ops.frames,round:b.round,...plain(data)});return emit(type,data);};
const done=()=>['won','lost'].includes(b.phase),commands=JSON.parse(await readFile(`tools/act1-qa/stage${stage}-ui-commands.json`)).commands;let failure=null,index=-1;
function plan(command){const u=e.active,t=e.unit(command.target),s=C.SKILLS[command.skill];if(!u.loadout.includes(command.skill)||e.cooldownLeft(u,s.id)>0)return null;if(s.id==='S08')return e.canAfford(s,u,.3)?{angle:u.angle,power:.3}:null;if(!t||t.dead)return null;
 if(s.martial&&s.branch==='sword'){let angle=Math.atan2(u.y-u.h*.58-(t.y-t.h*.5),t.x-u.x)*180/Math.PI;if(angle< -90)angle+=360;for(const power of [1,.7,.2])if(e.canAfford(s,u,power)&&C.meleeContains(e,u,t,C.meleeRange(u,s,power),-angle*Math.PI/180,C.meleeSpan(u,s,power)))return{angle,power};return null;}
 const candidates=[...e.shotSeeds(u,s,t),...(stage===5?[-25,0,15,30,45,60,75].flatMap(angle=>[.25,.5,.75,1].map(power=>({angle:t.x>=u.x?angle:180-angle,power}))):[])];let best=null;
 for(const q of candidates){if(!e.canAfford(s,u,q.power))continue;const v=C.shotViable(e,u,s,t,q.angle,q.power),p=e.predict(u,s,q.angle,q.power,undefined,false);if(stage===10?v.ok&&v.risk<1&&v.enemyDamage>0:t.honroObjectiveTarget?p.unit===t.id||p.terrain===t.id:v.ok&&v.risk<.5&&v.enemyDamage>0){if(stage===5)return q;const score=v.net||v.enemyDamage||1;if(!best||score>best.score)best={...q,score};}}return best;
}
function move(command){const u=e.active,from={x:u.x,y:u.y};if(command.op==='jump')assert(ops.jump(),'Normal jump rejected');let still=0;
 for(let n=0;n<2800&&app.canInput()&&u.moveLeft>3;n++){const dx=command.x-u.x,support=e.contactSurface(u.x,u.y-3,u.y+4)?.t.id;
  if(command.op==='climb'&&e.grounded(u)&&Math.abs(dx)<45&&u.y-command.y>35)ops.jump();
  if(Math.abs(dx)<5&&e.grounded(u)&&(command.op!=='climb'||support===command.support))break;
  const old=u.x;if(Math.abs(dx)>3)ops.move(Math.sign(dx)*(Math.abs(dx)<18?.35:command.input??1),C.STEP);ops.frame();still=Math.abs(u.x-old)<.03&&e.grounded(u)?still+1:0;if(still>30)break;
 }
 for(let n=0;n<400&&app.canInput()&&!e.grounded(u);n++)ops.frame();actions.push({op:'intent-move',command,round:b.round,actor:u.id,from,to:{x:u.x,y:u.y},support:e.contactSurface(u.x,u.y-3,u.y+4)?.t.id});
}
try{for(index=0;index<commands.length&&!done();index++){assert(ops.ready(),'No actionable boundary');if(done())break;const c=commands[index],u=e.active;if(c.hero)assert.equal(u.cls,c.hero,'Replay actor mismatch');actions.push({op:'intent',index,command:c,round:b.round,actor:u.id});
 if(['walk','jump','climb'].includes(c.op))move(c);else if(c.op==='shoot'){let q=plan(c);if(label.includes('reposition'))for(let attempt=0;!q&&attempt<3;attempt++){const target=e.unit(c.target);if(!target||target.dead||!app.canInput()||u.moveLeft<8)break;const dx=target.x-u.x,axis=Math.sign(dx||1)*(Math.abs(dx)>120?1:-1),from={x:u.x,y:u.y};for(let f=0;f<Math.ceil(.12/C.STEP)&&app.canInput();f++){ops.move(axis,C.STEP);ops.frame();}for(let f=0;f<Math.ceil(.18/C.STEP);f++)ops.frame();actions.push({op:'bounded-shot-reposition',attempt:attempt+1,round:b.round,actor:u.id,target:c.target,from,to:{x:u.x,y:u.y}});if(e.active!==u)break;q=plan(c);}assert(q,'No safe current predicted shot');assert(ops.fire(c.skill,q.angle,q.power),'Actual App charge/launch rejected');}
 else if(c.op==='defend')assert(ops.defend(),'Actual App defend rejected');else if(c.op==='interact')assert(ops.interact(b.honroMarkers.find(m=>m.id===(c.id||'receiver-5'))),'Visible nearest interaction rejected');else throw Error('Unsupported replay intent '+c.op);
 }ops.ready();}catch(error){failure=error.stack;}
const final=plain(b);await writeFile(out+'/trace.json',JSON.stringify({schema:'honro-app-operation-replay/v1',stage,policy:label,source,sourceDirtyAtStart,operationMode:'NATIVE_APP_ACTION_SIMULATION',scope:ops.scope,entryPath,entrySha256:createHash('sha256').update(await readFile(entryPath)).digest('hex'),initial,final,actions,damage,damageFx,index,failure}));
console.log(JSON.stringify({stage,label,phase:b.phase,round:b.round,index,failure,frames:ops.frames,alive:e.heroesAlive().length}));if(failure||b.phase!=='won')process.exitCode=1;
