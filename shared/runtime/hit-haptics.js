(function(G){'use strict';
// Mobile hit haptics: a short pulse when a player-side attack really removes
// enemy HP or shield in the live battle. Presentation only; never battle state.
const C=G.HONRO_CORE,P=C?.Engine?.prototype;
if(!P||typeof P.hurt!=='function'||P.hurt.honroHaptics)return;
const PULSE_MS=12,INTERVAL_MS=100;let last=-Infinity;
function enabled(){
 const app=G.HonroApp;if(app?.profile?.settings?.haptics===false)return false;
 const nav=G.navigator,doc=G.document;
 if(typeof nav?.vibrate!=='function'||doc?.visibilityState==='hidden')return false;
 // Chromium rejects (and logs) vibrate() before the first user gesture.
 return nav.userActivation?.hasBeenActive!==false;
}
function pulse(){
 const now=G.performance?.now?.()??Date.now();if(now-last<INTERVAL_MS||!enabled())return;
 last=now;try{G.navigator.vibrate(PULSE_MS);}catch{}
}
const hurt=P.hurt;
P.hurt=function(u,amount,owner,direct,p,source,damageSource,...rest){
 // Skill previews and route probes run their own engines; only the live one buzzes.
 if(G.HonroApp?.engine!==this||!u||u.side!==1||(damageSource&&damageSource!=='normal'))return hurt.apply(this,arguments);
 const src=this.unit?.(owner),before=(u.hp||0)+(u.shield||0),out=hurt.apply(this,arguments);
 try{if(src?.side===0&&!src.enthrall&&!src.honroAlly&&(u.hp||0)+(u.shield||0)<before)pulse();}catch{}
 return out;
};
P.hurt.honroHaptics=true;
G.HonroHitHaptics={pulse,enabled,interval:INTERVAL_MS,duration:PULSE_MS};
})(globalThis);
