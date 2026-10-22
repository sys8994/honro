import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),R=g.HonroClearReport,copy=x=>JSON.parse(JSON.stringify(x));
for(const legacy of [false,true]){
 const q=battlefield(g,25),u=q.b.units.find(R.hero),origin={kind:'enemy',id:'prior-map:caster-7',skill:'O09',cls:null};
 Object.assign(u,{hp:1000,maxHp:1000,armor:0,shield:0,curseDamage:10,curseTurns:2,curseOwner:undefined,honroCarriedCurse:true,honroDotSkill:'O09'});
 if(!legacy)u.honroDotReport=origin;
 R.begin(q.b,{fresh:true});q.e.checkEnd=()=>false;g.HonroSplitCampaign.attach(q.app,q.e);
 const status=g.HonroSplitCampaign.snapshot(q.b,u).status;
 if(!legacy)assert.deepEqual(copy(status.honroDotReport),origin);
 const before=u.hp;q.e.newRound();const s=q.b.honroReport;assert(s.heroes[u.cls].received>0);assert.equal(s.heroes[u.cls].received,before-u.hp);
 assert(s.other[legacy?'unresolved':'enemy'].received>0);assert.equal(s.other.environment,undefined);
 console.log('PASS split carried curse '+(legacy?'legacy missing provenance stays unresolved':'original source survives map-boundary snapshot'));
}
