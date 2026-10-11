/** Isolated geometry, not combat completion: remove other actors after spawn;
 * replenish movement through the repository's established traversal helper.
 * Every post-start coordinate is produced by ordinary walk/jump/body physics.
 */
import assert from'node:assert/strict';import{readFile,mkdir,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
import{runtime,battlefield}from'../game/tests/helpers.mjs';import{traverse}from'./stage16-temple-traverse-helper.mjs';
const g=await runtime({legacyMaps:false}),original=structuredClone(g.HONRO_PROJECT),rows=[],entries=[];
for(const id of[13,16,30])for(const[key,v]of Object.entries(original.stages[id-1].initialState.honroEntryVariants.variants)){
 g.HONRO_PROJECT=structuredClone(original);const s=g.HONRO_PROJECT.stages[id-1];for(const p of v.heroes)Object.assign(s.units.find(u=>u.id==='p-'+p.cls),{x:p.x,y:p.y});for(const p of v.units)Object.assign(s.units.find(u=>u.id===p.id),p);
 const q=battlefield(g,id);for(const p of v.heroes){const u=q.e.heroesAlive().find(u=>u.cls===p.cls),drift=Math.hypot(u.x-p.x,u.y-p.y);entries.push({id,route:key,cls:p.cls,wanted:p,actual:{x:u.x,y:u.y},drift});assert(drift<.01,`stage${id}/${key}/${p.cls}: sanitizer moved authored entry`);assert(g.HONRO_CORE.validTerrainContactPose(q.b.terrain,u));}
}
g.HONRO_PROJECT=original;
for(const id of[19]){const{b}=battlefield(g,id);for(const u of b.units){const input=original.stages[id-1].units.find(v=>v.id===u.id);if(input)assert(Math.hypot(u.x-input.x,u.y-input.y)<.01,'quiet funeral exact supported cast '+u.id);}}
for(const id of[15,29])for(const cls of['archer','mage','knight','occultist'])for(const[key,anchors]of Object.entries(original.stages[id-1].design.questRoutes.traversal)){
 const{b,e}=battlefield(g,id),u=e.heroesAlive().find(u=>u.cls===cls);b.units=[u];b.active=u.id;e.checkEnd=()=>false;
 if(id===15&&key==='A')for(const list of[b.terrain,b.honroWorldTerrain])list.find(t=>t.id==='fc15-drained-ledge').broken=false;
 if(id===15&&key==='B')assert(b.terrain.find(t=>t.id==='fc15-drained-ledge').broken,'high path stays un-drained');
 Object.assign(u,{x:anchors[0].x,y:anchors[0].y,vx:0,vy:0});assert(g.HONRO_CORE.validTerrainContactPose(b.terrain,u));
 const r=traverse(g,b,e,u,anchors);rows.push({id,route:key,cls,...r});console.log(id,key,cls,r.passed?'PASS':'FAIL','damage',r.damage,r.failed||'');assert(r.passed&&r.damage===0,JSON.stringify(rows.at(-1)));
}
await mkdir('_local/reports/act23-redesign',{recursive:true});const digest=createHash('sha256').update(await readFile('shared/data/campaign.json')).digest('hex');await writeFile('_local/reports/act23-redesign/route-geometry.json',JSON.stringify({source:'shared/data/campaign.json',sha256:digest,scope:'Isolated real collision/movement with movement replenishment, no enemy combat or browser claim. Entry tests keep every NPC/enemy through compiler and sanitizer.',entries,rows},null,2)+'\n');
console.log('Exact full-roster entries and Act15/29 ordinary traversal contracts passed.');
