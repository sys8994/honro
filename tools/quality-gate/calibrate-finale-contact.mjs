/** Native successful-contact calibration, never normal-input play evidence.
 * Use the exact preserved profile; do not retune it from an observed outcome.
 * Flat fixture deliberately isolates damage from route/aim-policy errors.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {runtime} from '../../game/tests/helpers.mjs';import {loadPilotRuntime} from '../stage31/pilot-runtime.mjs';
process.env.HONRO_ACT4_RELEASE='1';const source='tools/act4-rc/fixtures/stage40-checkpoints/sailing-observation-local-storage.json.xz',raw=execFileSync('python',['-c','import lzma,sys;sys.stdout.buffer.write(lzma.decompress(open(sys.argv[1],"rb").read()))',source]);
const p=JSON.parse(raw),g=await runtime({legacyMaps:false,productionStory:true});await loadPilotRuntime(g);g.HonroEquipment.migrate(p);
const stage=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===40),base=g.HonroMaps.createBattle(stage,g.HONRO_PROJECT,p,{origin:'campaign'}),C=g.HONRO_CORE,copy=x=>JSON.parse(JSON.stringify(x));
const roles={guard:'final40-west-front-3',bow:'final40-west-front-4',close:'final40-west-front-1',miniboss:'final40-west-anchor-2',majorBoss:'final40-tide-keeper-1'},shots=[['archer','A01'],['mage','M01'],['archer','A02'],['mage','M02'],['knight','S01'],['occultist','O01'],['archer','A14'],['archer','A05'],['mage','M06'],['mage','M03'],['occultist','O02'],['occultist','O06']];const rows=[];
for(const [role,id]of Object.entries(roles))for(const [hero,skill]of shots)for(const seed of [7,19,43,101,223,401,607,809,1013,1237]){
 const attacker=copy(base.units.find(u=>u.id===hero)),target=copy(base.units.find(u=>u.id===id));Object.assign(attacker,{x:500,y:600,vx:0,vy:0,acted:false,facing:1});Object.assign(target,{x:1000,y:600,vx:0,vy:0,fixed:true,facing:-1,hp:100000,maxHp:100000});
 const b={...base,session:'contact-fixture',width:3000,height:1200,round:1,side:0,phase:'aim',active:attacker.id,queue:[attacker.id],units:[attacker,target],terrain:[{id:'calibration-ground',x:0,y:600,w:3000,h:300,mat:'stone',indestructible:true}],honroWorldTerrain:[],honroSurfaceZones:[],projectiles:[],fields:[],volley:null,seed,rng:seed,teamEnds:[0,0]};
 const hits=[],e=new C.Engine(b,(data)=>{if(data.type==='fx'&&data?.targetId===target.id&&typeof data.critical==='boolean')hits.push({loss:data.damage,critical:data.critical,attackId:data.attackId});},true);e.checkEnd=()=>false;e.enemyAction=()=>{};g.HonroAct4PilotCombat.attach({engine:e});
 // Freeze no enemy action: this fixture measures one declared player cast only.
 e.enemyAction=()=>{};
 const s=C.SKILLS[skill],seeds=e.shotSeeds(attacker,s,target),choices=seeds.map(v=>({...v,hit:e.predict(attacker,s,v.angle,v.power,target,false)})).filter(v=>v.hit.unit===target.id||Math.hypot(v.hit.x-target.x,v.hit.y-(target.y-target.h*.5))<(e.effective(s,attacker).radius||0)).sort((a,z)=>a.power-z.power),choice=choices[0];
 if(!choice){rows.push({role,hero,skill,seed,status:'no-contact-plan'});continue;}
 const accepted=e.fire(skill,choice.angle,choice.power,true);if(!accepted){rows.push({role,hero,skill,seed,status:'cast-rejected'});continue;}
 for(let i=0;i<720;i++){e.tick(C.STEP);if(i>60&&!b.projectiles.length&&!b.volley&&!attacker.meleeAction)break;}
 rows.push({role,hero,skill,seed,status:hits.length?'contact':'miss',angle:choice.angle,power:choice.power,damage:100000-target.hp,hits,currentEnemyHp:base.units.find(u=>u.id===id).maxHp});
}
if(!rows.some(r=>r.status==='contact'&&r.hits.some(h=>!h.critical)))throw Error('No observed noncritical contacts; calibration is invalid');
const output={scope:'Flat native contact fixture using exact preserved profile. No play, accuracy, clear-rate or balance acceptance claim.',profileSource:source,profileSha256:createHash('sha256').update(raw).digest('hex'),heroes:base.units.filter(u=>u.side===0).map(u=>({id:u.id,hp:u.maxHp,armor:u.armor,loadout:u.loadout})),rows};
await mkdir('_local/reports/act4-finale',{recursive:true});await writeFile('_local/reports/act4-finale/contact-calibration-expanded.json',JSON.stringify(output,null,2));for(const role of Object.keys(roles))for(const [hero,skill]of shots){const x=rows.filter(r=>r.role===role&&r.skill===skill&&r.status==='contact'&&r.hits.every(h=>!h.critical));console.log(JSON.stringify({role,skill,noncriticalSamples:x.length,mean:x.length?x.reduce((a,r)=>a+r.damage,0)/x.length:null,currentHp:x[0]?.currentEnemyHp}));}
