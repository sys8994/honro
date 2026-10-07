import {beforeObjectiveContent} from './objective-delta-helpers.mjs';
// Test-only semantic projection: world placement may change, gameplay may not.
import {createHash} from 'node:crypto';
export const plain=value=>JSON.parse(JSON.stringify(value));
export const hash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
export function semanticContent(stage){
 stage=beforeObjectiveContent(stage);
 const {w,h,map,act2Plan,...content}=stage;
 const {size,sites,lamps,...plan}=act2Plan;
 return plain({...content,act2Plan:{...plan,lamps:lamps.length}});
}
export function unitContract(unit){
 const fields=['id','name','role','cls','side','hp','maxHp','r','h','focus','maxFocus','regen','level','attack','armor','maxMove','walkSpeed','loadout','ranks','xpBudget','honroType','elite','honroVariant','honroDifficulty','combatBaseHp','combatBaseAttack','honroXpWeight','honroAct2','existenceDefense','honroAlly','honroCivilian','honroBehavior','honroCohort','honroAct2Elite','honroAct2Revision','honroAct2Tuned','honroAct2LateTuned','honroProtected','honroAct2Boss'];
 return plain(Object.fromEntries(fields.filter(k=>unit[k]!==undefined).map(k=>[k,unit[k]])));
}
