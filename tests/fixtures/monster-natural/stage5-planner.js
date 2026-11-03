(q)=>{
 // Predictions may populate caches; never lend them the live battle or actors.
 const app=HonroApp,C=HONRO_CORE,live=app.engine.b,before=JSON.stringify(live),e=new C.Engine(JSON.parse(before)),b=e.b,u=e.active,memory=q.memory||{},key=b.round+':'+u.id;
 function finish(command){if(JSON.stringify(live)!==before)throw Error('Reactive planning mutated live battle');return{command:command&&{hero:u.cls,...command},memory};}
 const defend=reason=>({op:'defend',reason});
 function attack(target,only=null){if(!target||target.dead)return null;let best=null;
  for(const id of only||u.loadout){const s=C.SKILLS[id];if(!s||s.passive||id==='S08'||!u.loadout.includes(id)||e.cooldownLeft(u,id)>0)continue;
   let seeds=e.shotSeeds(u,s,target);if(s.martial&&s.branch==='sword'){let angle=Math.atan2(u.y-u.h*.58-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;angle=((angle+85)%360+360)%360-85;seeds=[1,.7,.2].map(power=>({angle,power}));}
   else if(q.stage===5)seeds=[...seeds,...[-25,0,15,30,45,60,75].flatMap(angle=>[.25,.5,.75,1].map(power=>({angle:target.x>=u.x?angle:180-angle,power})))];
   for(const seed of seeds){const angle=((seed.angle+85)%360+360)%360-85,power=seed.power;if(angle>265||!e.canAfford(s,u,power))continue;let score=0;
    if(s.martial&&s.branch==='sword'){if(C.meleeContains(e,u,target,C.meleeRange(u,s,power),-angle*Math.PI/180,C.meleeSpan(u,s,power)))score=s.damage;}
    else{const v=C.shotViable(e,u,s,target,angle,power),p=e.predict(u,s,angle,power,undefined,false);if(q.stage===5&&target.honroObjectiveTarget){if(p.unit===target.id||p.terrain===target.id)score=v.enemyDamage||s.damage;}else if(v.ok&&v.risk<.5&&v.enemyDamage>0)score=v.net||v.enemyDamage;if(b.honroState.sodanCoop&&['M04','M06'].includes(id)&&e.alive(1).filter(v=>Math.hypot(v.x-target.x,v.y-target.y)<450).length>=2)score*=1.7;}
    if(score>0&&(!best||score>best.score))best={op:'shoot',target:target.id,skill:id,score,choice:{id,target:target.id,idx:u.loadout.indexOf(id),angle,power},reason:'Current legal viable target/skill; prediction is ranking, actual settlement authoritative'};
   }
  }return best;
 }
 const foes=e.alive(1).filter(v=>v.id!=='boss'&&!v.honroObjectiveTarget).sort((a,z)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(z.x-u.x,z.y-u.y));
 if(q.stage===5){
  if(q.preferred){const preferred=e.unit(q.preferred.target),targets=[preferred,...foes].filter(Boolean);for(const t of targets){const hit=attack(t);if(hit)return finish(hit);}return finish(defend('No safe tactical shot; keep declared route position'));}
  const marker=b.honroMarkers.find(m=>m.id==='receiver-5'),cleat=e.unit('cliff-cleat'),broken=HonroQuestTargets.records(b).find(t=>t.id==='cliff-cleat')?.broken;
  if(broken){const x=u.cls==='archer'?3630:3540;if(Math.abs(u.x-x)>18&&u.moveLeft>15&&!memory['exit:'+key]){memory['exit:'+key]=true;return finish({op:'walk',x,reason:'Authored tablet/hold completion route after actual cleat break'});}return finish(defend('Actual objective enemy-end hold, not invented quota'));}
  if(u.cls==='mage'){if(Math.abs(u.x-marker.x)>60&&u.moveLeft>15&&!memory['ritual:'+key]){memory['ritual:'+key]=true;return finish({op:'walk',x:marker.x,reason:'Keep mage in ritual support radius'});}if(!b.honroState.ritual?.active&&HonroInteractions.nearest(app)?.id===marker.id)return finish({op:'interact',id:marker.id});if(u.hp<u.maxHp*.55)return finish(defend('Protect ritual holder; normal defend recovery'));for(const t of foes.filter(t=>Math.hypot(t.x-u.x,t.y-u.y)<1000)){const hit=attack(t);if(hit)return finish(hit);}return finish(defend('Keep ritual position; no unsafe shot'));}
  if(b.honroState.ritual?.active){const hit=attack(cleat);if(hit)return finish(hit);}return finish(defend('Maintain high launch support; await viable wind/ritual instead of walking off ledge'));
 }
 const binding=e.unit('sodan-binding'),coop=!!b.honroState.sodanCoop,exitReady=HonroSodanWithdrawal.ready(b);
 if(!exitReady&&u.cls==='knight'&&u.hp<u.maxHp*(coop?.65:.45)&&(!binding||binding.dead||binding.hp>500)&&u.loadout.includes('S08')&&e.cooldownLeft(u,'S08')===0&&e.canAfford(C.SKILLS.S08,u,.3))return finish({op:'shoot',skill:'S08',choice:{id:'S08',idx:u.loadout.indexOf('S08'),angle:u.angle,power:.3},reason:'Counterstance before pursuit/guard damage'});
 if(!coop){const hit=attack(binding);if(hit)return finish(hit);const paths={archer:[[1150,'outer-yard'],[1250,'west-step'],[1300,'gallery-link-west'],[1300,'west-gallery'],[1600,'west-gallery']],mage:[[1150,'outer-yard'],[1250,'west-step'],[1300,'gallery-link-west'],[1300,'west-gallery'],[1660,'west-gallery']],knight:[[2110,'outer-yard'],[2280,'altar-step-1']]},path=paths[u.cls];let index=memory['path:'+u.cls]||0;
  while(index<path.length){const[x,support]=path[index],surface=e.contactSurface(u.x,u.y-3,u.y+4)?.t.id;if(Math.abs(u.x-x)<15&&surface===support&&e.grounded(u)){memory['path:'+u.cls]=++index;continue;}if(u.moveLeft>100&&(memory['climb:'+key]||0)<3){memory['climb:'+key]=(memory['climb:'+key]||0)+1;return finish({op:'climb',x,y:C.topAt(b.terrain.find(t=>t.id===support),x),support});}break;}
  for(const t of foes.filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<700)){const hit=attack(t);if(hit)return finish(hit);}
 }
 const goal=exitReady||coop&&u.cls==='archer'&&b.honroState.coopHold>=4?HonroSodanWithdrawal.exit(b).x:coop?({knight:2580,mage:2340,archer:2200}[u.cls]):u.x;
 if(Math.abs(goal-u.x)>18&&u.moveLeft>15&&!memory['guard:'+key]){memory['guard:'+key]=true;return finish({op:'walk',x:goal,reason:exitReady?'Secure actual east exit':coop&&u.cls==='archer'&&b.honroState.coopHold>=4?'Scout exit while others guard':'Intercept near protected Sodan'});}
 if(coop&&!exitReady&&u.cls!=='knight'&&u.hp<u.maxHp*.4)return finish(defend('Ordinary recover after intercept movement'));
 if(coop){const ward=e.unit('boss');foes.sort((a,z)=>(a.honroTargetId==='boss'?-1500:0)+Math.hypot(a.x-ward.x,a.y-ward.y)-(z.honroTargetId==='boss'?-1500:0)-Math.hypot(z.x-ward.x,z.y-ward.y));}
 for(const t of foes){const hit=attack(t);if(hit)return finish(hit);}return finish(defend('No safe shot after authored objective movement'));
}
