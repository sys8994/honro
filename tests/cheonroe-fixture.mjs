/** Declared diagnostic arena, shared by VM and real-browser captures. No campaign acceptance claim. */
export function cheonroeArena(C,{count=10,rank=8,ceiling=false,damageScale=1,natural=false}={}){
 const profile=C.defaults();profile.heroes.mage.xp=C.xpAtLevel(30);profile.heroes.mage.ranks.M05=rank;profile.loadouts.mage=['M05'];
 const b=C.createBattle(1,profile,'practice',{party:['mage'],wind:0,distance:700});
 const floor={id:'floor',x:0,y:1000,w:3000,h:500,mat:'rock',hp:99999,maxHp:99999,indestructible:true};
 Object.assign(b,{width:3000,height:1500,terrain:[floor],fields:[],drafts:[],waters:[],decor:[],rng:123456,wind:0,projectiles:[],zones:[],stakes:[]});
 b.units=b.units.filter(u=>u.side===0&&u.cls==='mage').slice(0,1);const u=b.units[0];
 Object.assign(u,{x:600,y:1000,vx:0,vy:0,attack:2,armor:0,maxHp:10000,hp:10000,maxFocus:10000,focus:10000,ranks:{M05:rank},loadout:['M05'],acted:false,airborne:false,jumping:false,angle:0,lastPower:.5,critChance:0});
 b.active=u.id;b.side=0;b.phase='aim';
 for(let i=0;i<count;i++)b.units.push(C.makeUnit('knight',1,1000+(i-(count-1)/2)*38,1000,{id:'lightning-target-'+i,name:'낙뢰 표적 '+(i+1),h:80,r:18,honroType:'beast',honroVariant:'hound',hp:2400,maxHp:2400,armor:0,shield:0,attack:.5,awake:true,fixed:true,loadout:['LA01'],focus:9999,maxFocus:9999,existenceDefense:{form:1,qi:1,soul:1}}));
 if(ceiling)b.terrain.push({id:'roof',x:700,y:700,w:600,h:120,mat:'rock',hp:99999,maxHp:99999,indestructible:true});
 const events=[],hits=[],e=new C.Engine(b,ev=>events.push(ev));e.checkEnd=()=>false;
 const hurt=e.hurt.bind(e);e.hurt=(v,amount,...args)=>{const hp=v.hp;hurt(v,amount,...args);if(v.hp<hp)hits.push({id:v.id,raw:amount,hp:hp-v.hp});};
 let aim={angle:0,power:.5};
 if(natural){let score=Infinity;for(let angle=42;angle<=84;angle+=3)for(let power=.3;power<=1;power+=.025){const pr=e.predict(u,C.SKILLS.M05,angle,power),d=Math.hypot(pr.x-1000,pr.y-940);if(d<score){score=d;aim={angle,power,prediction:{x:pr.x,y:pr.y}};}}}
 if(!e.fire('M05',aim.angle,aim.power))throw Error('M05 fire rejected');const p=b.projectiles[0];p.damage*=damageScale;
 const impact=(x=1000,y=1000)=>{p.x=x;p.y=y;e.impact(p,{x,y,t:0,n:{x:0,y:-1},terrain:floor});};
 const strike=()=>{p.age=.35;C.redesignStep(e,p,0);};
 return {C,b,e,u,p,floor,profile,events,hits,impact,strike,aim};
}
