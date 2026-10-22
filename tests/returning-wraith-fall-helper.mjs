/** Isolated supported high ledge over a deep floor. Prepared geometry/actors,
 * then ordinary Engine fire/stepProjectile/tick only; no campaign play claim. */
export function wraithArena(C,{height=6500,floor=6200,start=3000,x=3000,width=12000,enemy=false}={}){
 const profile=C.defaults();profile.heroes.occultist.xp=C.xpAtLevel(15);profile.heroes.occultist.ranks.O05=1;profile.loadouts.occultist=['O01','O05'];
 const b=C.createBattle(1,profile,'practice',{party:['occultist'],wind:0}),u=b.units.find(u=>u.side===0);Object.assign(b,{width,height,wind:0,terrain:[{id:'deep-floor',x:0,y:floor,w:width,h:height-floor,mat:'rock',hp:99999,maxHp:99999},{id:'launch-ledge',x:x-180,y:start,w:180,h:25,mat:'rock',hp:99999,maxHp:99999}],fields:[],drafts:[],waters:[],units:[u],active:u.id,phase:'aim',side:0,practiceCombat:true});
 Object.assign(u,{x,y:start,spawnX:x,spawnY:start,vx:0,vy:0,acted:false,loadout:['O01','O05'],ranks:{O01:1,O05:1}});
 if(enemy)b.units.push(C.makeUnit('knight',1,x+620,floor,{id:'foe',fixed:true,awake:true,hp:5000,maxHp:5000,armor:0,loadout:['LS09']}));
 const events=[],e=new C.Engine(b,v=>events.push(v),true);return{profile,b,e,u,events};
}
