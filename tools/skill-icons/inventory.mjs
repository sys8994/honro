import vm from 'node:vm';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {buildCore} from '../../game/engine/build.mjs';

// Evaluate the production installers, HONRO name overrides, and actual main prologue.
// CLASSES.order is retained for audit only: the current UI uses TALENTS + baseSkill.
export async function skillInventory(){
 const g=vm.createContext({console,performance,structuredClone});
 vm.runInContext(await buildCore(),g);
 vm.runInContext(await readFile('shared/runtime/content.js','utf8'),g);
 const main=await readFile('shared/runtime/main.js','utf8'),end=main.indexOf('    for (const st of H.stages)');
 if(end<0)throw Error('HONRO initialization boundary changed; inspect inventory extractor');
 vm.runInContext(main.slice(0,end)+'})(globalThis);',g);
 const C=g.HONRO_CORE,H=g.HONRO_CONTENT,order=Object.keys(H.hero),exposed=order.flatMap(cls=>[C.baseSkill(cls),...C.TALENTS.filter(n=>n.cls===cls).map(n=>n.id)]);
 if(new Set(exposed).size!==exposed.length)throw Error('Duplicate exposed skill IDs');
 const record=id=>{
  const s=C.SKILLS[id],n=C.TALENT_MAP[id],svg=C.icon('skill:'+id),visible=exposed.includes(id);
  return {id,name:s.name,classId:s.cls,className:H.hero[s.cls].job,person:H.hero[s.cls].name,scope:visible?'current-player':'hidden-legacy',basic:!!s.basic,passive:!!s.passive,ultimate:!!s.ultimate,capstone:!!s.capstone,enemyOnly:!!s.enemyOnly,legacyId:s.legacyId||null,branch:n?{index:n.branch,row:n.row,name:H.hero[s.cls].branch[n.branch],color:C.BRANCHES[s.cls][n.branch].color}:null,tag:s.tag,effectSummary:C.skillPlayNotes(id)||s.desc,lore:s.desc,effectRowsRank1:C.skillEffectRows(id,1),effectRowsRank8:C.skillEffectRows(id,8),color:s.color,classColor:H.hero[s.cls].color,currentIcon:{source:'shared/engine/src/icons.ts',key:'skill:'+id,baseKey:s.icon,path:svg.match(/<path d="([^"]*)"/)?.[1],svg},plannedImage:visible?`shared/assets/skill-icons/v1/${id}.webp`:null,screenUses:visible?(s.passive?['camp-tree','camp-passive-summary','skill-detail','training-picker']:['camp-tree-or-basic-slot','camp-loadout','skill-detail','slot-library','loadout-comparison','training-picker','training-toolbar','combat-hud']):['legacy-projectile-or-enemy-compatibility-only']};
 };
 const skills=exposed.map(record),hidden=Object.keys(C.SKILLS).filter(id=>!exposed.includes(id)).map(record);
 return {schemaVersion:1,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceMaster:'be798268',extraction:'buildCore → data installers → content.js → actual main.js initialization prologue',classOrder:order,coreClassOrder:[...C.CLASS_IDS],historicalClassOrders:Object.fromEntries(order.map(cls=>[cls,[...C.CLASSES[cls].order]])),counts:{allFinalDefinitions:Object.keys(C.SKILLS).length,currentPlayer:skills.length,basic:skills.filter(s=>s.basic).length,learnableActive:skills.filter(s=>!s.basic&&!s.passive).length,passive:skills.filter(s=>s.passive).length,ultimate:skills.filter(s=>s.ultimate).length,capstone:skills.filter(s=>s.capstone).length,hiddenLegacy:hidden.length},perClass:Object.fromEntries(order.map(cls=>[cls,{person:H.hero[cls].name,ids:skills.filter(s=>s.classId===cls).map(s=>s.id)}])),skills,hiddenLegacy:hidden};
}
if(process.argv[1]?.endsWith('/inventory.mjs')){
 const data=await skillInventory();await writeFile('game/docs/skill-icons-v1/inventory.json',JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(data.counts));
}
