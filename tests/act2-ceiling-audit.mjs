/** Production factory/collision audit. Vertical probes are geometry fixtures,
 * not normal combat, completion timing, or human art approval. */
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const g=await runtime({legacyMaps:false}),rows=[];
for(let id=11;id<=20;id++){
 const st=g.HONRO_PROJECT.stages[id-1],q=battlefield(g,id),roofs=q.b.terrain.filter(t=>t.honroCeiling),skip=q.b.terrain.filter(t=>!t.honroCeiling).map(t=>t.id);
 const markers=st.markers||[],samples=[...q.b.units.filter(u=>u.side===0).slice(0,1).map(u=>({id:'entry',x:u.x,y:u.y})),...markers.filter(m=>!/^wave/.test(m.id))];
 const probes=samples.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>{const origin={x:p.x,y:p.y-90},hit=q.e.projectileCollision(origin,{x:p.x,y:0},2,'audit',[],false,skip);return{id:p.id,x:p.x,y:p.y,ceiling:hit?.terrain?.id||null,undersideY:hit?.y??null,headroomFromFeet:hit?p.y-hit.y:null};});
 rows.push({id,title:st.name||st.title,width:st.width,height:st.height,skyVisible:st.environment?.skyVisible,solidRoofs:roofs.map(t=>({id:t.id,oneWay:t.oneWay,vertices:t.vertices})),renderRoofIds:g.HonroTerrainDomain.render(q.b).filter(t=>t.honroCeiling).map(t=>t.id),camera:st.camera||null,playBounds:st.playBounds,terrainBounds:st.terrainBounds,probes});
}
const out=process.env.HONRO_CEILING_OUT||'_local/reports/act2-ceiling-20261023';await mkdir(out,{recursive:true});await writeFile(out+'/audit.json',JSON.stringify({source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Actual production factory and roof-only projectile collision probes; no gameplay writes. Camera minScale is width/6800 or actor66 at3.75px, focus extends1800 above play bounds. Full canonical terrain renders beyond clipped collision projection.',rows},null,2)+'\n');
for(const r of rows)console.log(r.id,'roofs='+r.solidRoofs.map(t=>t.id).join(','),'probes='+r.probes.map(p=>p.id+':'+(p.headroomFromFeet?.toFixed(0)||'open')).join(','));
