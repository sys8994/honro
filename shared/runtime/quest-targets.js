(function(G){'use strict';
const C=G.HONRO_CORE;
// A descriptor is retained only as quest/save state and original artwork. It is
// never placed in either collision terrain list after conversion.
const records=b=>[...(b?.terrain||[]),...(b?.honroQuestTargets||[])];
const steps=b=>G.HonroAct2?.active(b)?G.HonroAct2.steps(b):G.HonroAct3?.active(b)?G.HonroAct3.steps(b):[];
function candidates(b){const ids=new Set(steps(b).filter(s=>s.kind==='destroy').map(s=>s.id));
 for(const o of b.honroObjectives||[])if(o.type==='destroy'){ids.add(o.targetId);const e=b.honroElements?.find(e=>e.id===o.targetId);for(const id of e?.collisionIds||[])ids.add(id);}
 return records(b).filter(t=>(!t.indestructible||ids.has(t.id))&&Number.isFinite(t.hp)&&Number.isFinite(t.maxHp)&&t.maxHp>0&&(ids.has(t.id)||t.honroSeal||t.honroBinding||t.honroBellRelease));
}
function label(b,t){return (t.id==='cliff-cleat'?(G.HonroStage5Waterfall?.active(b)?'주박목':'고리쇠'):t.id==='sodan-binding'?'바깥 주박':t.id.startsWith('bier-knot-')?'상여 결박 '+(Number(t.id.split('-').at(-1))+1):t.id==='upper-chain'?'장력 고정구':null)||steps(b).find(s=>s.id===t.id)?.label||(b.honroObjectives||[]).find(o=>o.targetId===t.id||o.targetId===t.honroElementId)?.label||(t.honroSeal?'봉인':t.name||t.id);}
function migrate(b){if(!b?.honroStage)return false;const targets=candidates(b);if(!targets.length)return false;let changed=false;b.honroQuestTargets??=[];
 for(const t of targets){if(!b.honroQuestTargets.some(q=>q.id===t.id)){b.honroQuestTargets.push(t);changed=true;}t.honroQuestTarget=true;
  let u=b.units.find(u=>u.id===t.id&&u.honroObjectiveTarget);
  if(!u){if(b.units.some(u=>u.id===t.id))throw Error('Quest target ID collides with actor: '+t.id);
   u=C.makeUnit('archer',1,t.x+t.w/2,t.y+t.h,{id:t.id,name:label(b,t),role:'objective',honroObjectiveTarget:true,honroType:'questTarget',fixed:true,group:-100,loadout:[],attack:0,armor:0,shield:0,existenceDefense:{form:1,qi:1,soul:1},hp:Math.max(0,t.hp),maxHp:t.maxHp,h:t.h,r:t.w/2,maxMove:0,moveLeft:0,walkSpeed:0,xpBudget:0,xpGranted:0,awake:false,aggroUntil:0});b.units.push(u);changed=true;
  }
  // A saved broken flag wins over stale positive HP. Never revive a completed
  // target or rebase a damaged old battle onto today's authored health.
  u.hp=t.broken?0:Math.max(0,t.hp);u.maxHp=t.maxHp;u.dead=!!t.broken||u.hp<=0;t.broken=u.dead;
  Object.assign(u,{side:1,role:'objective',fixed:true,honroObjectiveTarget:true,attack:0,loadout:[],maxMove:0,moveLeft:0,walkSpeed:0,vx:0,vy:0});
 }
 const ids=new Set(b.honroQuestTargets.map(t=>t.id));b.terrain=b.terrain.filter(t=>!ids.has(t.id));if(b.honroWorldTerrain)b.honroWorldTerrain=b.honroWorldTerrain.filter(t=>!ids.has(t.id));b.queue=b.queue?.filter(id=>!ids.has(id))||[];
 if(changed)b.sceneVersion=(b.sceneVersion||0)+1;return changed;
}
function blocker(b,u){const descriptor=b.honroQuestTargets?.find(t=>t.id===u.id);if(descriptor?.indestructible)return '아직 보호된 목표입니다. 먼저 표시된 의식을 진행하세요.';const s=steps(b).find(s=>s.id===u.id),actor=b.units.find(v=>v.id===b.active);
 if(u.id==='upper-chain'&&G.HonroAct2?.active(b)&&!b.honroState?.act2?.silenced)return '담허로 공명 억제를 먼저 시작하세요.';
 if(s?.requiredClass&&actor?.cls!==s.requiredClass)return (G.HONRO_CONTENT.hero[s.requiredClass]?.name||'지정 동행')+'의 공격이 필요합니다.';
 if(b.honroStage===5&&u.id==='cliff-cleat'&&!b.honroState?.ritual?.active)return G.HonroStage5Waterfall?.active(b)?'낙수가 화살을 밀어냅니다. 담허의 물길진으로 사격할 틈을 여세요.':'물틈이 닫혀 있습니다. 담허의 받이진을 먼저 시작하세요.';
 return '';
}
function sync(b,t){const u=b.units?.find(u=>u.honroObjectiveTarget&&u.id===t.id);if(u){u.hp=t.broken?0:Math.max(0,t.hp);u.maxHp=t.maxHp;u.dead=!!t.broken||u.hp<=0;}}
function damage(e,u,amount,owner,attack){const t=e.b.honroQuestTargets?.find(t=>t.id===u.id);if(!t)return 0;const before=t.hp;e.damageTerrain(t,amount,0,owner,attack);u.hp=t.broken?0:Math.max(0,t.hp);return Math.max(0,before-u.hp);}
G.HonroQuestTargets={records,steps,candidates,label,migrate,damage,sync,blocker};
})(globalThis);
