/** Presentation-only precision; battle regeneration remains unrounded. */
import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;let cases=0;
for(const level of [1,13,17,30])for(const rank of [0,1,2,8]){
 const p=C.defaults();p.heroes.mage.xp=C.xpAtLevel(level);p.heroes.mage.ranks.MP02=rank;
 const before=JSON.stringify(p),stats=C.heroStats(p.heroes.mage,'mage'),raw=stats.regen;
 const html=C.campView(p,'mage',{},'',0),match=html.match(/<small>MP 회복<\/small><strong>([^<]+)<\/strong>/);assert(match);
 assert.equal(match[1],String(Math.round(raw*100)/100));assert(/^\d+(?:\.\d{1,2})?$/.test(match[1]));
 assert.equal(C.heroStats(p.heroes.mage,'mage').regen,raw);assert.equal(JSON.stringify(p),before);
 if(level===1&&rank===1)assert.equal(match[1],'15.12');
 if(level===17&&rank===1){assert.equal(match[1],'24.78');assert.equal(raw,24.775);}
 cases++;
}
console.log(`PASS ${cases} camp regeneration display cases, with unchanged profile and gameplay precision`);
