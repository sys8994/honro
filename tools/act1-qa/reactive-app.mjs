/** Accepted command intent replay through the one actual-App adapter.
 * Native DOM/render/clock doubles; no browser or continuous-history claim.
 */
import vm from'node:vm';import assert from'node:assert/strict';import{readFile,writeFile,mkdir}from'node:fs/promises';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
import{appHarness,plain}from'../../tests/app-regression-helpers.mjs';import{createPlayerOperations}from'./player-operations.mjs';
const stage=Number(process.argv[2]||5),label=process.argv[3]||'reactive-browser-policy-native',out=`_local/reports/act1-gameplay-20261103/stage${stage}-${label}`;assert([5,10].includes(stage));await mkdir(out,{recursive:true});
const entryPath=`tools/act1-qa/fixtures/stage${stage}-entry.json`,entry=JSON.parse(await readFile(entryPath)),source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDirtyAtStart=execFileSync('git',['status','--short'],{encoding:'utf8'}).trim();
const h=await appHarness({productionStory:true,productionInputActions:true}),{g,C}=h,app=h.load(entry.profile||entry);app.launch(stage);const e=app.engine,b=e.b,initial=plain(b),actions=[],damage=[],damageFx=[];
const ops=createPlayerOperations({app,g,C,record:r=>actions.push(r)}),hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const hp=u.hp,r=hurt(u,...args);if(hp>u.hp)damage.push({frame:ops.frames,round:b.round,target:u.id,owner:args[1],amount:hp-u.hp});return r;};
const emit=e.emit.bind(e);e.emit=(type,data)=>{if(type==='fx'&&Number.isFinite(data?.damage)&&data.targetId)damageFx.push({frame:ops.frames,round:b.round,...plain(data)});return emit(type,data);};
const done=()=>['won','lost'].includes(b.phase),commands=JSON.parse(await readFile(`tools/act1-qa/stage${stage}-ui-commands.json`)).commands;let failure=null,index=-1,memory={};g.HonroApp=app;const reactive=vm.runInContext('('+await readFile('tools/act1-qa/browser-reactive-plan.js','utf8')+')',g);
function move(command){const u=e.active,from={x:u.x,y:u.y};if(command.op==='jump')assert(ops.jump(),'Normal jump rejected');let still=0;
 for(let n=0;n<2800&&app.canInput()&&u.moveLeft>3;n++){const dx=command.x-u.x,support=e.contactSurface(u.x,u.y-3,u.y+4)?.t.id;
  if(command.op==='climb'&&e.grounded(u)&&Math.abs(dx)<45&&u.y-command.y>35)ops.jump();
  if(Math.abs(dx)<5&&e.grounded(u)&&(command.op!=='climb'||support===command.support))break;
  const old=u.x;if(Math.abs(dx)>3)ops.move(Math.sign(dx)*(Math.abs(dx)<18?.35:command.input??1),C.STEP);ops.frame();still=Math.abs(u.x-old)<.03&&e.grounded(u)?still+1:0;if(still>30)break;
 }
 for(let n=0;n<400&&app.canInput()&&!e.grounded(u);n++)ops.frame();actions.push({op:'intent-move',command,round:b.round,actor:u.id,from,to:{x:u.x,y:u.y},support:e.contactSurface(u.x,u.y-3,u.y+4)?.t.id});
}
try{for(index=0;index<240&&!done();index++){if(!ops.ready())break;let c;if(stage===5&&index<45){c=commands[index];if(c.op==='shoot'){const p=reactive({stage,memory,preferred:c});c=p.command;memory=p.memory;}}else{const p=reactive({stage,memory});c=p.command;memory=p.memory;}assert(c,'Reactive policy must return input');const u=e.active;if(c.hero)assert.equal(u.cls,c.hero,'Reactive actor mismatch');actions.push({op:'intent',index,command:c,round:b.round,actor:u.id});
 if(['walk','jump','climb'].includes(c.op))move(c);else if(c.op==='shoot'){assert(c.choice,'Reactive shot requires legal plan');assert(ops.fire(c.skill,c.choice.angle,c.choice.power),'Normal App launch rejected');}
 else if(c.op==='defend')assert(ops.defend(),'Normal defend rejected');else if(c.op==='interact')assert(ops.interact(b.honroMarkers.find(m=>m.id===c.id)),'Visible nearest interaction rejected');else throw Error('Unsupported reactive input '+c.op);
 }ops.ready();}catch(error){failure=error.stack;}
const final=plain(b);await writeFile(out+'/trace.json',JSON.stringify({schema:'honro-app-operation-replay/v1',stage,policy:label,source,sourceDirtyAtStart,operationMode:'NATIVE_APP_ACTION_SIMULATION',scope:ops.scope,entryPath,entrySha256:createHash('sha256').update(await readFile(entryPath)).digest('hex'),initial,final,actions,damage,damageFx,index,failure}));
console.log(JSON.stringify({stage,label,phase:b.phase,round:b.round,index,failure,frames:ops.frames,alive:e.heroesAlive().length}));if(failure||b.phase!=='won')process.exitCode=1;
