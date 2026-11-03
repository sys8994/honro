/** Focused exact saved-state boundary regression and normal east-coast recovery.
 * DOM/clock doubles: not browser or whole-stage acceptance. */
import assert from 'node:assert/strict';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {createFinale} from './bootstrap.mjs';import {coastFlankGoal} from './coast-flank-route.mjs';
const input=process.argv[2],out='/tmp/stage40-coast-boundary';await mkdir(out,{recursive:true});const rows=[];
const oldSource=execFileSync('git',['show','2ac7cc2a:tools/stage40-qa/coast-flank-route.mjs'],{encoding:'utf8'});const oldGoal=new Function(oldSource.replace('export function','function')+';return coastFlankGoal;')();
for(const [kind,turn]of [['boundary','017'],['recovery','022']]){
 const profilePath=out+'/'+kind+'-input.json';await writeFile(profilePath,execFileSync('xz',['-dc',input+'/browser/turn-profile-'+turn+'.json.xz']));const{C,e,b,ops,app,g}=await createFinale({profilePath,entryRound:kind==='recovery'?6:5});
 function ready(){ops.ready();ops.frame();for(let i=0;i<360&&(g.HonroStory.turnPaused(app,ops.now)||!e.grounded(e.active));i++)ops.frame();assert(!g.HonroStory.turnPaused(app,ops.now)&&e.grounded(e.active));}
 ready();if(e.active.id!=='mage')ops.select('mage');ready();const u=e.active;assert.equal(u.id,'mage');const surface=v=>e.contactSurface(v.x,v.y-4,v.y+5)?.t.id,pose=()=>({round:b.round,hp:u.hp,x:u.x,y:u.y,move:u.moveLeft,support:surface(u)}),before=pose();
 if(kind==='boundary'){
  // Explicit read-only fixture from actual logged positions, not a live save injection.
  const report=JSON.parse(await readFile(input+'/browser/result.json','utf8')),index=report.events.findIndex(v=>v.label==='observed-coast-flank'&&v.state.round===5&&v.state.active==='mage'),observed=report.events[index-1].state;
  const fixtureHero=observed.health.map(v=>({...b.units.find(w=>w.id===v.id),...v})),fixtureFoes=observed.foes.map(v=>({...b.units.find(w=>w.id===v.id),...v})),fixtureMage=fixtureHero.find(v=>v.id==='mage');
  const ctx={support:surface(fixtureMage),foes:fixtureFoes,heroes:fixtureHero,surface,topAt:C.topAt,terrains:b.terrain},old=oldGoal(fixtureMage,ctx),corrected=coastFlankGoal(fixtureMage,ctx);assert(old&&old.x>3600);assert.equal(corrected,null);rows.push({kind:'read-only-observed-state-fixture',before,fixtureSourceEvent:index-1,fixtureMage:{x:fixtureMage.x,y:fixtureMage.y},old,corrected,after:pose()});
 }else{
  assert.equal(surface(u),'approved40-coast-east');const goal=3000;
  for(let i=0;i<320&&e.active===u&&u.moveLeft>100&&Math.abs(u.x-goal)>15;i++){ops.move(Math.sign(goal-u.x),C.STEP);ops.frame();}ready();assert.equal(b.round,6);assert.equal(u.hp,before.hp);rows.push({kind,before,normalWalkGoal:goal,after:pose(),reachedWest:surface(u)==='approved40-coast-west'});
 }
 await writeFile(out+'/result.json',JSON.stringify({scope:'Focused native clock/DOM fixture, not browser or whole-stage acceptance',rows},null,2));console.log(JSON.stringify(rows.at(-1)));
}
