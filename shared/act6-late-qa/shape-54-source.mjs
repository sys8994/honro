import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const get=x=>fs.readFileSync(new URL(x,import.meta.url),'utf8'),sha=x=>createHash('sha256').update(x).digest('hex');
const replace=(s,old,n)=>{assert.equal(s.split(old).length,2,'upstream App anchor '+old);return s.replace(old,()=>n);};
export function extendStage53QaMain(qaMain,enabled){
 if(!enabled)return qaMain;
 // Input is the canonical current compiler's QA-only generated App source,
 // not a deployed entry edit. Separate Stage54 lexical owner and descriptor.
 const broker=get('successor-broker.mjs').replace('export function createLateSuccessorBroker','function createLateSuccessorBroker');
 const o=get('stage54-owner.mjs');assert.equal(sha(o),'603c83d32b92e381c34449c401da2df6b4db52a594e36083e8d2a1cdb83bd947');
 const a=get('stage54-adapter.mjs');
 const c=get('chart-packet.mjs');assert.equal(sha(c),'4d1706c8cd7a4c3e35d3c38b5cfa9107d4aa77a5e9e0666fa358257be73f9c68');
 const chart=c.slice(0,c.indexOf('// Author-time.'));
 const inner=chart.replaceAll('export const ','const ')+'\n'+o.slice(o.indexOf('\n')+1).replace('export async function','async function')+
   '\nreturn {createStage54ChartOwner,chartPins,ids};';
 const adapter=a.split('\n').slice(2).join('\n').replaceAll('export const ','const ').replace('export function','function');
 const o55=get('stage55-owner.mjs'),a55=get('stage55-adapter.mjs');
 assert.equal(sha(o55),'cb9009674cc3848aff0e5d93877f55a2403ad60a46c6ef29c93f6eb3ccec6e62');
 const o56=get('stage56-owner.mjs'),p56=get('stage56-presentation.mjs'),a56=get('stage56-adapter.mjs');
 const sha56='ef0206760ca2251373ad2e2ae5622a1f3be0f21befb16f01a97cb292ca387f02';
 assert.equal(sha(o56),sha56);
 const code56='const {stage56Adapter}=(()=>{\nconst {createStage56Owner,D}=(()=>{'+o56.replaceAll('export ','')+'\nreturn {createStage56Owner,D:owner56};})();\n'+p56.replaceAll('export ','')+'\n'+a56.split('\n').slice(2).join('\n').replaceAll('export ','')+'\nreturn {stage56Adapter};})();\n';
 const o57=get('stage57-owner.mjs'),m57=get('stage57-mission.mjs'),e57=get('stage57-emergency.mjs'),b57=get('stage57-bridge.mjs'),a57=get('stage57-adapter.mjs');
 assert.equal(sha(o57),'2c38fcf9d7b9c9d171260e5ab7d015ef48a49383e012c09b8afedd3de06c7c1b');
 const box=(body,ret)=>'(()=>{'+body.replaceAll('export ','')+'\nreturn '+ret+';})()';
 const strip=(s,n)=>s.split('\n').slice(n).join('\n');
 const deps='const bindOwnedBridge='+box(b57,'bindOwnedBridge')+';\nconst createStage57Owner='+box(strip(o57,1),'createStage57Owner')+';\nconst mountEmergency57='+box(e57,'mountEmergency57')+';\nconst createStage57Mission='+box(strip(m57,2),'createStage57Mission')+';\n';
 const code57='const {stage57Adapter}=(()=>{'+deps+strip(a57,1).replaceAll('export ','')+'\nreturn {stage57Adapter};})();\n';
 const o58=get('stage58-owner.mjs'),a58=get('stage58-adapter.mjs');
 assert.equal(sha(o58),'eba509f70ad39813b0d3057ce6e16dcb1c04b38c13e6e2d2998f34c95d7921ed');
 const code58='const {stage58Adapter}=(()=>{\nconst createStage58Owner='+box(o58,'createStage58Owner')+';\n'+strip(a58,1).replaceAll('export ','')+'\nreturn {stage58Adapter};})();\n';
 const o59=get('stage59-owner.mjs'),a59=get('stage59-adapter.mjs');
 assert.equal(sha(o59),'01362a5a0cb9ecf889f7b95af4f57b7e6f1a55c15108258869e10579d69dcf77');
 const code59='const {stage59Adapter}=(()=>{\nconst {mountNativeObservation,nativeFacts}='+box(get('native-bind.mjs'),'{mountNativeObservation,nativeFacts}')+';\n'+
 'const {buildStrip,contacts}='+box(get('strip.mjs'),'{buildStrip,contacts}')+';\n'+
 'const {due,commit}='+box(get('wave.mjs'),'{due,commit}')+';\n'+
 'const createStage59RolePaint='+box(get('role-paint.mjs'),'createStage59RolePaint')+';\n'+
 'const {createStage59Owner,D}='+box(strip(o59,3),'{createStage59Owner,D:STAGE59}')+';\n'+strip(a59,2).replaceAll('export ','')+'\nreturn {stage59Adapter};})();\n';
 const source='\nconst {createLateSuccessorBroker} = (()=>{'+broker+'\nreturn {createLateSuccessorBroker};})();\n'+
  'const {stage54Adapter}=(()=>{\n const {createStage54ChartOwner,chartPins,ids}=(()=>{'+inner+'})();\n'+adapter+'\nreturn {stage54Adapter};})();\n'+'const {stage55Adapter}=(()=>{\n const {createStage55EmptyBell,D}=(()=>{'+o55.replace('export const STAGE55','const STAGE55').replace('export async function','async function')+'\nreturn {createStage55EmptyBell,D:STAGE55};})();\n'+a55.split('\n').slice(1).join('\n').replaceAll('export const ','const ').replace('export function','function')+'\nreturn {stage55Adapter};})();\n'+code56+code57+code58+code59+get('host-54.inc.js');
 let out=replace(qaMain,'      function eligible(app,id){',source+'\n      function eligible(app,id){');
 out=replace(out,'      function bind(app,e){\n        const s=active.get(app);if(!s||s.b!==e.b)return false;',
  '      function bind(app,e){\n        const s=active.get(app);if(!s||s.b!==e.b)return false;\n        if([54,55,56,57,58,59].includes(e.b.honroStage)){Object.defineProperty(e,"stage",{configurable:true,get:()=>({id:0,local:0,region:0,outro:app.stage.name,victoryRule:{kind:"scripted",target:"act6-test-complete"},eventScript:[],wind:[0]})});return late54.bind(app,e,s);}');
 out=replace(out,'function goalState(app,e){return active.get(app)?.b.honroStage===53?', 'function goalState(app,e){if([54,55,56,57,58,59].includes(active.get(app)?.b.honroStage))return late54.goal(app,e);return active.get(app)?.b.honroStage===53?');
 out=replace(out,'        return active.get(app)?.b.honroStage===53&&e?.active===u&&actions53.aim(app,e)',
  '        if(active.get(app)?.b.honroStage===54&&e?.active===u)return late54.relay(app,e,"contextualSkill","available")&&!ids.includes("M09")&&ids.length<4?[...ids,"M09"]:ids;\n        return active.get(app)?.b.honroStage===53&&e?.active===u&&actions53.aim(app,e)');
 out=replace(out,"        if(active.get(app)?.b.honroStage!==53||app.selected!=='M09'||e?.active!==u)return false;",
  "        if(active.get(app)?.b.honroStage===54&&app.selected==='M09'&&e?.active===u){const q=late54.relay(app,e,'contextualSkill','M09',u.angle,app.power);if(q?.reason)app.notify(q.reason);app.updateHUD(true);return true;}\n        if(active.get(app)?.b.honroStage!==53||app.selected!=='M09'||e?.active!==u)return false;");
 out=replace(out,'        if(s.b.honroStage===53){\n          const q=actions53.usePassage',
  '        if([54,55,56,57,58,59].includes(s.b.honroStage)){const q=late54.relay(app,e,"interact");if(q?.ok&&[55,56,57,58,59].includes(s.b.honroStage)&&s.button)s.button.textContent=late54.goal(app,e)?.summary??"종터 확인";app.notify(q?.ok?(s.b.honroStage===54?"새 받침에 발을 디디십시오.":s.b.honroStage===55?"종터의 상태를 확인했습니다.":"현장 작업을 확인했습니다."):q?.reason??"지금은 현장 조작이 어렵습니다.");e.checkEnd();app.updateHUD(true);return true;}\n        if(s.b.honroStage===53){\n          const q=actions53.usePassage');
 out=replace(out,"        const terminal=s.b.honroStage===53?third.terminal(app,s.engine):owner.terminal(app,s.engine);",
  "        const terminal=[54,55,56,57,58,59].includes(s.b.honroStage)?late54.finish(app,s.engine):(s.b.honroStage===53?third.terminal(app,s.engine):owner.terminal(app,s.engine));");
 out=replace(out,'        app.done=true;app.cancelInput();\n        if(terminal?.stage===51',
  '        app.done=true;app.cancelInput();\n        if(terminal?.stage===53)late54.arm(app,s,terminal);\n        if(terminal?.stage===54)late54.arm55(app,terminal);\n        if(terminal?.stage===55)late54.arm56(app,terminal);\n        if(terminal?.stage===56)late54.arm57(app,terminal);\n        if(terminal?.stage===57)late54.arm58(app,terminal);\n        if(terminal?.stage===58)late54.arm59(app,terminal);\n        if(terminal?.stage===51');
 out=replace(out,'return Object.freeze({offer,enter,active:', 'return Object.freeze({offer,enter,enterLate:late54.launch,tick:(app,dt)=>{const e=app.engine;if([56,57,58,59].includes(e?.b.honroStage)){late54.relay(app,e,"tick",dt);const q=late54.goal(app,e),session=active.get(app),btn=session?.button;if(session?.altButton)session.altButton.hidden=q?.appActions?.alt!=="splitRepair";if(session?.returnButton)session.returnButton.hidden=q?.skipReturn!==true;if(btn&&q){if(btn.textContent!==q.summary)btn.textContent=q.summary;const mark=e.b.honroStage===59?q.targets?.find(t=>t.kind==="interaction"&&Math.abs(t.x-e.active?.x)<96):e.b.honroStage===58?q.targets?.[0]:null;btn.disabled=[58,59].includes(e.b.honroStage)?!mark:!q.appActions?.mission;btn.dataset.act6Mission=[58,59].includes(e.b.honroStage)?mark?.id??"":q.appActions?.mission??"";}if((q?.failed||q?.complete)&&!["won","lost"].includes(e.b.phase))e.checkEnd();return;}if(e?.b.honroStage===55){const q=late54.goal(app,e),s=active.get(app),btn=s?.button;if(btn&&q&&btn.dataset.act6Binding!==q.binding){btn.dataset.act6Binding=q.binding;btn.textContent=q.summary;}if(q?.failed||q?.complete)e.checkEnd();return;}if(late54.relay(app,e,"tick",dt))app.updateHUD(true);if(e?.b.honroStage===54&&e.b.phase==="aim"&&e.b.round>=2&&e.active?.x>=2308&&e.active.x<=2324&&late54.goal(app,e)?.complete===true)e.checkEnd();},active:');
 out=replace(out,'if(id>=51)return (id===51||id===52||id===53)&&!training?qa51.enter(this,id,permit):undefined;',
  'if(id===54||id===55||id===56||id===57||id===58||id===59)return !training?qa51.enterLate(this,id,permit):false;\n            if(id>=51)return (id===51||id===52||id===53)&&!training?qa51.enter(this,id,permit):undefined;');
 out=replace(out,'missionTick(dt){if(qa51.active(this))return;', 'missionTick(dt){if(qa51.active(this)){qa51.tick(this,dt);return;}');
 out=replace(out,'||G.HonroObjectives.failure(b,this.stage);','||([55,56,57,58,59].includes(b.honroStage)&&qa51.active(this)?(qa51.goalState(this,e)?.failed?qa51.goalState(this,e).summary:false):G.HonroObjectives.failure(b,this.stage));');
 return out;
}
