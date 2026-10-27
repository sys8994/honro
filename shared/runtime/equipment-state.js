(function(G){'use strict';
const C=G.HONRO_CORE,classes=['archer','mage','knight','occultist'],clone=x=>structuredClone(x),events=new Map(C.EQUIPMENT_EVENTS.map(e=>[e.eventId,e]));
const publicEvent=e=>!!e&&(e.normalEnabled&&e.releaseGate==='publicAct1to3'||G.HONRO_ACT4_RELEASE===true&&e.act===4&&e.releaseGate==='officialAct4');
const empty=()=>({schema:1,definitionRevision:1,runId:'eq-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),ownedItemIds:[],eligibleEventIds:[],equippedByClass:Object.fromEntries(classes.map(c=>[c,{personal:null,common:null}])),rewardLedger:{}});
function validate(eq){
 if(!eq||eq.schema!==1||eq.definitionRevision!==1||typeof eq.runId!=='string'||eq.runId.length>100||!Array.isArray(eq.ownedItemIds)||eq.ownedItemIds.length>52||new Set(eq.ownedItemIds).size!==eq.ownedItemIds.length||eq.ownedItemIds.some(id=>!C.EQUIPMENT_MAP[id])||!eq.equippedByClass||!eq.rewardLedger||Array.isArray(eq.rewardLedger))throw Error('장비 기록 버전을 읽을 수 없습니다.');
 if(eq.initialAutoEquip!==undefined&&typeof eq.initialAutoEquip!=='boolean'||eq.basicPrepared!==undefined&&(!Array.isArray(eq.basicPrepared)||eq.basicPrepared.some(c=>!classes.includes(c))))throw Error('초기 장비 기록 오류');
 if(eq.eligibleEventIds!==undefined&&(!Array.isArray(eq.eligibleEventIds)||eq.eligibleEventIds.length>36||new Set(eq.eligibleEventIds).size!==eq.eligibleEventIds.length||eq.eligibleEventIds.some(id=>!publicEvent(events.get(id)))))throw Error('장비 사건 근거 오류');
 const worn=new Set();for(const cls of classes){const slots=eq.equippedByClass[cls];if(!slots||Object.keys(slots).some(k=>!['personal','common'].includes(k)))throw Error('장비 칸 오류');for(const slot of ['personal','common']){const id=slots[slot];if(id===null)continue;const item=C.EQUIPMENT_MAP[id];if(!item||item.slot!==slot||item.characterClass&&item.characterClass!==cls||!eq.ownedItemIds.includes(id)||worn.has(id))throw Error('장비 착용 오류');worn.add(id);}}
 const justified=new Set();for(const [id,row]of Object.entries(eq.rewardLedger)){const e=events.get(id);if(!e||!eq.debug&&!publicEvent(e)||!['eligible','pending','committed'].includes(row?.state)||row.choiceGroup!==(e.choiceGroup||null)||row.selectedItemId!==null&&!e.itemIds.includes(row.selectedItemId)||row.state==='committed'&&!e.itemIds.includes(row.selectedItemId)||row.state!=='committed'&&row.selectedItemId!==null||typeof row.notified!=='boolean')throw Error('장비 선택 기록 오류');if(row.state==='committed'){if(!eq.ownedItemIds.includes(row.selectedItemId))throw Error('장비 소유 누락');justified.add(row.selectedItemId);}}
 if(!eq.debug&&eq.ownedItemIds.some(id=>!justified.has(id)))throw Error('장비 소유 기록 오류');
 if(!eq.debug&&eq.ownedItemIds.length>36)throw Error('회차 소유 한도 오류');return eq;
}
function ids(p,cls){const s=p.equipment.equippedByClass[cls];return [s.personal,s.common].filter(Boolean);}
function sync(p){for(const cls of classes){const list=ids(p,cls);if(list.length)p.heroes[cls].equipmentIds=list;else delete p.heroes[cls].equipmentIds;}}
function grant(p,eventId){const e=events.get(eventId),eq=p.equipment;if(!publicEvent(e)||eq.rewardLedger[eventId])return false;const choice=!!e.choiceGroup;eq.rewardLedger[eventId]={state:choice?'pending':'committed',choiceGroup:e.choiceGroup||null,selectedItemId:choice?null:e.itemIds[0],notified:false};if(!choice)eq.ownedItemIds.push(e.itemIds[0]);return true;}
const clears={eq_se_ledger:3,eq_da_gate:4,eq_hw_bier:8,eq_co_01:1,eq_co_02:3,eq_co_t1_choice:7};
// Only mandatory chapter facts are retroactive. Optional elite/sluice/reach facts
// require this run's actual receipts, never the chapter clear flag alone.
const mandatory={eq_so_resident:13,eq_se_t2_choice:12,eq_da_t2_choice:16,eq_hw_t2_choice:17,eq_so_t2_choice:18,eq_se_t3a:22,eq_da_t3a:29,eq_hw_t3a:24,eq_so_t3a:19,eq_co_t2_choice:20,eq_co_11:26};
function recruitFacts(p){let changed=false;for(const [cls,id]of Object.entries({archer:'eq_se_start',mage:'eq_da_join',knight:'eq_hw_join',occultist:'eq_so_join'}))if(p.recruited.includes(cls))changed=grant(p,id)||changed;return changed;}
function migrate(p){
 const legacy=!p.equipment;if(legacy){p.equipment=empty();recruitFacts(p);for(const [id,stage]of Object.entries({...clears,...mandatory}))if(p.cleared[stage])grant(p,id);}else validate(p.equipment);
 for(const b of [p.saved,p.honroBattle].filter(Boolean)){const seen=new Set();for(const cls of classes)if(b.heroes?.[cls]?.equipmentIds)C.validateEquipmentIds(b.heroes[cls].equipmentIds,cls);for(const u of b.units||[])if(u.equipmentIds){C.validateEquipmentIds(u.equipmentIds,u.cls);if(u.equipmentIds.length&&!C.equipmentActor(u))throw Error('NPC 장비 오류');for(const id of u.equipmentIds){if(seen.has(id))throw Error('중복 장비 오류');seen.add(id);}}}
 if(p.equipment.debug)throw Error('디버그 장비는 정상 기록으로 불러올 수 없습니다.');sync(p);return p;
}
function fresh(p){p.equipment=empty();p.equipment.initialAutoEquip=true;p.equipment.basicPrepared=[];return p;}
function debug(p){const equipped=clone(p.equipment.equippedByClass);p.equipment=empty();p.equipment.equippedByClass=equipped;p.equipment.debug=true;p.equipment.ownedItemIds=C.EQUIPMENT_ITEMS.map(i=>i.itemId);sync(p);return p;}
function transaction(app,change){
 if(app.equipmentBusy||app.customMap||app.training||G.HONRO_EMBEDDED||app.profileStore?.locked)return false;
 app.equipmentBusy=true;try{const candidate=clone(app.profile),b=app.engine?.b;if(b&&!app.done){G.HonroProgression.syncRoster(candidate,b);candidate.honroBattle=clone(b);}
 const changed=change(candidate);if(!changed)return false;sync(candidate);validate(candidate.equipment);
 if(!app.debugMode&&!app.profileStore.save(candidate)){app.equipmentSaveFailed=true;app.notify?.('장비 기록을 저장하지 못했습니다. 다시 시도해 주세요.');return false;}
 app.profile=candidate;if(!app.debugMode)app.normalProfile=candidate;if(app.equipmentSaveFailed){app.equipmentSaveFailed=false;app.notify?.('장비 기록을 저장했습니다.');}return true;
 }finally{app.equipmentBusy=false;}
}
function stepDone(b,id){const m=b?.honroState;return !!(m?.act23v4?.done?.[id]||m?.act2?.done?.[id]||m?.act3?.done?.[id]);}
const stepRewards={12:['sign','eq_se_t2_choice'],13:['13.release','eq_so_resident'],16:['16.testimony','eq_da_t2_choice'],17:['17.hoist','eq_hw_t2_choice'],18:['18.keeper','eq_so_t2_choice'],19:['old-soul','eq_so_t3a'],20:['escape','eq_co_t2_choice'],22:['v4.record-bundle','eq_se_t3a'],24:['family-crest','eq_hw_t3a'],26:['artisan-resident','eq_co_11'],29:['stage29-echo','eq_da_t3a']};
function collect(p,b,{won=false,initial=false}={}){let changed=recruitFacts(p);const stage=b?.honroStage;
 if(G.HONRO_ACT4_RELEASE===true&&p.honroAct4?.runId===p.equipment.runId)for(const [id,f]of Object.entries(p.honroAct4.factEvents||{})){const e=events.get(id),source=p.honroAct4.completed?.[e?.stage]?.sourceRun,live=b?.honroAct4Official===1&&b.honroStage===e?.stage&&b.session===f.sourceRun;const proof=f.proof;const verified=id==='eq_se_t3b'?proof?.boarded&&Array.isArray(proof.party)&&proof.party.length>0:id==='eq_co_12'?proof?.tag==='eq-co-31'&&!!proof.reachedBy:id==='eq_da_t3b'?proof?.itemId==='itm_da_06'&&proof.receiver==='mage'&&proof.giver!==proof.receiver&&Number.isFinite(proof.receivedAt)&&proof.positions?.length===2:id==='eq_co_t3_choice'?proof?.tag==='rooted-third-clearing'&&proof.reached===true:id==='eq_hw_t3b'?proof?.elite===true&&typeof proof.target==='string':id==='eq_so_t3b'?proof?.roster?.total===13&&proof.roster.living===11&&proof.roster.priorDeaths===2&&proof.rescued?.ids?.length===4:false;if(e?.act===4&&f.officialAct4===true&&f.stage===e.stage&&f.campaignRunId===p.equipment.runId&&(live||source===f.sourceRun)&&verified)changed=grant(p,id)||changed;}
 for(const id of p.equipment.eligibleEventIds||[])changed=grant(p,id)||changed;
 for(const [id,n]of Object.entries({...clears,...mandatory}))if(p.cleared[n])changed=grant(p,id)||changed;
 if(won)for(const [id,n]of Object.entries(clears))if(stage===n)changed=grant(p,id)||changed;
 const pair=stepRewards[stage];if(pair&&(stepDone(b,pair[0])||stepDone(b,({13:'resident',16:'witness',17:'hoist',18:'keeper',22:'upper-register',29:'hyeonmuk-letter'})[stage])))changed=grant(p,pair[1])||changed;
 // V4 replaced the old finite quarry carts with this recorded two-spirit wave.
 // Use its actual admitted IDs/source, never initial enemies or chapter clears.
 const wave=stage===12&&b.honroAct23V4Revision===1?b.honroState?.act23v4?.reviewedChapter?.wave:null;
 const gapDefeated=wave?.admitted&&Array.isArray(wave.ids)&&wave.ids.length===2&&wave.ids.some(id=>b.units.some(u=>u.id===id&&u.honroSpawnSource==='reviewed.12.gap'&&u.side===1&&u.dead&&u.hp<=0));
 if(stage===12&&(gapDefeated||b.units.some(u=>u.side===1&&u.dead&&u.hp<=0&&u.honroAct2Elite===true&&u.honroQuarryEntry)))changed=grant(p,'eq_co_06')||changed;
 // This receipt is set by the successful interaction, not projectile completion.
 if(stage===15&&b.honroEquipmentFacts?.sluiceInteraction)changed=grant(p,'eq_co_07')||changed;
 if(initial&&p.equipment.initialAutoEquip)for(const cls of p.recruited){if(p.equipment.basicPrepared.includes(cls))continue;p.equipment.basicPrepared.push(cls);changed=true;const basic={archer:'itm_se_01',mage:'itm_da_01',knight:'itm_hw_01',occultist:'itm_so_01'}[cls],slot=p.equipment.equippedByClass[cls];if(!slot.personal&&p.equipment.ownedItemIds.includes(basic)){slot.personal=basic;changed=true;}}
 return changed;
}
// Preserve eligibility only before a completed battle is discarded. A later
// ordinary persist may succeed after the ownership transaction failed. These
// run-local facts never select alternatives or apply equipment effects.
function capture(app,options={}){
 const b=app.engine?.b;if(app.debugMode||app.training||app.customMap||G.HONRO_EMBEDDED||!b||b.mode!=='campaign'||b.honroCustom)return false;
 const p=app.profile,probe={...p,equipment:clone(p.equipment)};collect(probe,b,options);let changed=false;
 for(const id of Object.keys(probe.equipment.rewardLedger))if(!p.equipment.rewardLedger[id]){p.equipment.eligibleEventIds??=[];if(!p.equipment.eligibleEventIds.includes(id)){p.equipment.eligibleEventIds.push(id);changed=true;}}
 return changed;
}
function observe(app,options={}){if(app.debugMode||app.customMap||app.training||G.HONRO_EMBEDDED)return false;const b=app.engine?.b||options.battle;if(b?.honroCustom||b&&b.mode!=='campaign')return false;return transaction(app,p=>collect(p,b,options));}
function choose(app,eventId,itemId){return transaction(app,p=>{const eq=p.equipment,e=events.get(eventId),r=eq.rewardLedger[eventId];if(!publicEvent(e)||!e.choiceGroup||r?.state!=='pending'||!e.itemIds.includes(itemId))return false;r.state='committed';r.selectedItemId=itemId;r.notified=false;eq.ownedItemIds.push(itemId);return true;});}
function canEquip(app){const b=app.engine?.b||app.profile.honroBattle;return !app.training&&!app.customMap&&!G.HONRO_EMBEDDED&&['camp','rest'].includes(app.screen)&&(app.debugMode||!!G.HonroRestJourney?.state(app.profile).restStageId)&&!G.HonroSplitCampaign?.locked(app.profile)&&!(b&&!['won','lost'].includes(b.phase));}
function wearer(p,id){return classes.find(cls=>ids(p,cls).includes(id));}
function equip(app,cls,itemId,transfer=false,slot){if(!canEquip(app)||!app.profile.recruited.includes(cls))return false;return transaction(app,p=>{const eq=p.equipment,item=itemId&&C.EQUIPMENT_MAP[itemId];slot=item?.slot||slot;if(!['personal','common'].includes(slot)||itemId&&(!item||!eq.ownedItemIds.includes(itemId)||item.characterClass&&item.characterClass!==cls))return false;const from=itemId&&wearer(p,itemId);if(from&&from!==cls&&!transfer)return false;if(eq.equippedByClass[cls][slot]===itemId)return false;if(from&&from!==cls)eq.equippedByClass[from][slot]=null;eq.equippedByClass[cls][slot]=itemId;return true;});}
function notices(app){const out=[];for(const [eventId,r]of Object.entries(app.profile.equipment.rewardLedger))if(r.state==='committed'&&!r.notified)out.push({eventId,itemId:r.selectedItemId});out.splice(3);if(!out.length)return[];return transaction(app,p=>{for(const row of out)p.equipment.rewardLedger[row.eventId].notified=true;return true;})?out:[];}
G.HonroEquipment={empty,validate,migrate,fresh,debug,ids,sync,grant,recruitFacts,collect,capture,transaction,observe,choose,canEquip,wearer,equip,notices,stepDone,publicEvent};
})(globalThis);
