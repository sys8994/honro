/** Isolated placement fixtures on actual authored geometry; NOT natural play. */
import assert from 'node:assert/strict';
import {createFinale} from './bootstrap.mjs';
const {C,g,b}=await createFinale();
function probe({deckAccess,x,y}){
 const z=JSON.parse(JSON.stringify(b));for(const h of z.units.filter(u=>u.side===0&&!u.honroAct4Resident)){if(h.id==='mage'){h.x=x;h.y=y;}else{h.dead=true;h.hp=0;}}
 for(const u of z.units.filter(u=>u.side===1)){u.awake=false;u.aggroUntil=0;}
 z.honroState.encounterDensity={version:1,alert:{},warnings:{},entries:{}};
 if(!deckAccess)delete z.honroEncounterDensityActivation['final40-departure-low'].extra;
 const e=new C.Engine(z,()=>{},true);g.HonroEncounterDensity.installActivation(e);e.refreshActivation();
 return {support:e.contactSurface(x,y-8,y+10)?.t.id,awake:z.units.filter(u=>u.id.startsWith('final40-departure-low')).map(u=>u.awake),eligible:[...e.honroDensityEligible]};
}
const before=probe({deckAccess:false,x:2243.0225,y:3600}),after=probe({deckAccess:true,x:2243.0225,y:3600});assert.equal(before.support,'a4-return-deck');assert(before.awake.every(v=>!v));assert(after.awake.every(Boolean));
const upper=probe({deckAccess:true,x:2480,y:2198.22});assert(upper.awake.every(v=>!v));console.log(JSON.stringify({scope:'Synthetic pose fixtures, actual activation/geometry; not stage acceptance',before,after,upper},null,2));
