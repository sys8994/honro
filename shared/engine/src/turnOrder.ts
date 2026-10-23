import type {Battle,ClassId,Profile,Unit} from './types';
/** Display/default campaign card order. An absent setting retains legacy saves. */
export const DEFAULT_PLAYER_TURN_ORDER:readonly ClassId[]=['archer','mage','knight','occultist'];
export function normalizePlayerTurnOrder(raw:unknown):ClassId[]{
 const out:ClassId[]=[];for(const id of Array.isArray(raw)?raw.slice(0,16):[])if(DEFAULT_PLAYER_TURN_ORDER.includes(id)&&!out.includes(id))out.push(id);
 return [...out,...DEFAULT_PLAYER_TURN_ORDER.filter(id=>!out.includes(id))];
}
function playerHero(u:Unit){return u.side===0&&!u.summoned&&!u.enthrall&&!(u as any).honroAlly&&!(u as any).honroCivilian;}
/** Sort a candidate copy, never units/party/queues. Non-player slots stay put. */
export function prioritizePlayerActors(b:Battle,actors:Unit[]):Unit[]{
 if(!Array.isArray(b.playerTurnOrder))return actors;
 const order=normalizePlayerTurnOrder(b.playerTurnOrder),heroes=actors.filter(playerHero).sort((a,z)=>order.indexOf(a.cls)-order.indexOf(z.cls));let i=0;
 return actors.map(u=>playerHero(u)?heroes[i++]:u);
}
/** Fresh factories choose an initial owner; mounting Continue only syncs policy. */
export function initializePlayerTurnOrder(b:Battle,p:Pick<Profile,'playerTurnOrder'>,fresh=true){
 if(!Array.isArray(p.playerTurnOrder))return;
 b.playerTurnOrder=normalizePlayerTurnOrder(p.playerTurnOrder);
 if(fresh){const ready=b.units.filter(u=>playerHero(u)&&!u.dead&&u.hp>0&&!u.eaterCapturedBy&&!u.acted&&u.stunnedRound!==b.round);b.active=prioritizePlayerActors(b,ready)[0]?.id||b.active;}
}
