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
 const source='\nconst {createLateSuccessorBroker} = (()=>{'+broker+'\nreturn {createLateSuccessorBroker};})();\n'+
  'const {stage54Adapter}=(()=>{\n const {createStage54ChartOwner,chartPins,ids}=(()=>{'+inner+'})();\n'+adapter+'\nreturn {stage54Adapter};})();\n'+get('host-54.inc.js');
 let out=replace(qaMain,'      function eligible(app,id){',source+'\n      function eligible(app,id){');
 out=replace(out,'      function bind(app,e){\n        const s=active.get(app);if(!s||s.b!==e.b)return false;',
  '      function bind(app,e){\n        const s=active.get(app);if(!s||s.b!==e.b)return false;\n        if(e.b.honroStage===54){Object.defineProperty(e,"stage",{configurable:true,get:()=>({id:0,local:0,region:0,outro:app.stage.name,victoryRule:{kind:"scripted",target:"act6-test-complete"},eventScript:[],wind:[0]})});return late54.bind(app,e,s);}');
 out=replace(out,'function goalState(app,e){return active.get(app)?.b.honroStage===53?', 'function goalState(app,e){if(active.get(app)?.b.honroStage===54)return late54.goal(app,e);return active.get(app)?.b.honroStage===53?');
 out=replace(out,'        return active.get(app)?.b.honroStage===53&&e?.active===u&&actions53.aim(app,e)',
  '        if(active.get(app)?.b.honroStage===54&&e?.active===u)return late54.relay(app,e,"contextualSkill","available")&&!ids.includes("M09")&&ids.length<4?[...ids,"M09"]:ids;\n        return active.get(app)?.b.honroStage===53&&e?.active===u&&actions53.aim(app,e)');
 out=replace(out,"        if(active.get(app)?.b.honroStage!==53||app.selected!=='M09'||e?.active!==u)return false;",
  "        if(active.get(app)?.b.honroStage===54&&app.selected==='M09'&&e?.active===u){const q=late54.relay(app,e,'contextualSkill','M09',u.angle,app.power);if(q?.reason)app.notify(q.reason);app.updateHUD(true);return true;}\n        if(active.get(app)?.b.honroStage!==53||app.selected!=='M09'||e?.active!==u)return false;");
 out=replace(out,'        if(s.b.honroStage===53){\n          const q=actions53.usePassage',
  '        if(s.b.honroStage===54){const q=late54.relay(app,e,"interact");app.notify(q?.ok?"새 받침에 발을 디디십시오.":q?.reason??"지금은 처마를 건널 수 없습니다.");e.checkEnd();app.updateHUD(true);return true;}\n        if(s.b.honroStage===53){\n          const q=actions53.usePassage');
 out=replace(out,"        const terminal=s.b.honroStage===53?third.terminal(app,s.engine):owner.terminal(app,s.engine);",
  "        const terminal=s.b.honroStage===54?late54.finish(app,s.engine):(s.b.honroStage===53?third.terminal(app,s.engine):owner.terminal(app,s.engine));");
 out=replace(out,'        app.done=true;app.cancelInput();\n        if(terminal?.stage===51',
  '        app.done=true;app.cancelInput();\n        if(terminal?.stage===53)late54.arm(app,s,terminal);\n        if(terminal?.stage===51');
 out=replace(out,'return Object.freeze({offer,enter,active:', 'return Object.freeze({offer,enter,enterLate:late54.launch,tick:(app,dt)=>{const e=app.engine;if(late54.relay(app,e,"tick",dt))app.updateHUD(true);if(e?.b.honroStage===54&&e.b.phase==="aim"&&e.b.round>=2&&e.active?.x>=2308&&e.active.x<=2324&&late54.goal(app,e)?.complete===true)e.checkEnd();},active:');
 out=replace(out,'if(id>=51)return (id===51||id===52||id===53)&&!training?qa51.enter(this,id,permit):undefined;',
  'if(id===54)return !training?qa51.enterLate(this,id,permit):false;\n            if(id>=51)return (id===51||id===52||id===53)&&!training?qa51.enter(this,id,permit):undefined;');
 out=replace(out,'missionTick(dt){if(qa51.active(this))return;', 'missionTick(dt){if(qa51.active(this)){qa51.tick(this,dt);return;}');
 return out;
}
