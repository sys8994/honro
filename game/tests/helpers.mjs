import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {buildCore} from '../engine/build.mjs';
export const gameRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function runtime(){
  const context=vm.createContext({console,performance,structuredClone});
  const {runtimeParts}=await import('../../shared/build.mjs');
  for(const source of await runtimeParts({vector:false,render:false}))vm.runInContext(source,context);
  // Frozen source specs remain available solely to the historical map audits.
  vm.runInContext(await readFile(path.join(gameRoot,'../migration/legacy/rc21-stage-maps.js'),'utf8'),context);

  return context;
}
export function battlefield(g,id,{profile=null,entry=true}={}){
  const C=g.HONRO_CORE,st=g.HONRO_CONTENT.stages[id-1],p=profile||C.defaults();p.recruited=g.HonroStageRules.stageParty(id);p.honroGrowth??={version:2,stages:{}};
  if(entry&&!profile)for(const cls of p.recruited)p.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(id).entryLevel);
  const b=g.HonroWorld.build(st,p,false,'archer','A01');g.HonroStageRules.sanitizeStageBattle(b);
  const events=[],e=new C.Engine(b,ev=>events.push(ev),true);
  const app={engine:e,stage:st,profile:p,training:false,done:false,dirty:false,speeches:[],notices:[],event(text){this.notices.push(text);},sayLines(lines){this.speeches.push(...lines);},checkMission(){return false;}};
  return {b,e,app,p,st,events};
}
