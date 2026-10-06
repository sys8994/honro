/** Production Scene on Native Canvas, not browser/HUD or campaign evidence. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {guidanceRuntime,canvas} from '../../tests/act2-guidance-helpers.mjs';
const g=await guidanceRuntime(),tag=process.argv[2]||'after',out=path.resolve('_local/reports/terrain-domain',tag),sha=v=>createHash('sha256').update(v).digest('hex');await mkdir(out,{recursive:true});
const project=process.argv.find(v=>v.startsWith('--project='))?.slice(10);if(project)g.HONRO_PROJECT=JSON.parse(await readFile(project,'utf8'));
const results=[],ids=process.argv.slice(3).filter(v=>/^\d+$/.test(v)).map(Number);if(!ids.length)ids.push(...Array.from({length:20},(_,i)=>1+i));
for(const id of ids){const st=g.HONRO_PROJECT.stages[id-1],map=g.HonroMaps.compile(st,g.HONRO_PROJECT),floor=map.terrain.find(t=>t.honroSurfaceRole==='floor')||map.terrain[0],views=[
 {name:'left',width:1440,height:900,x:0,y:st.height*.62,scale:.30},
 {name:'right',width:1440,height:900,x:st.width,y:st.height*.62,scale:.30},
 {name:'bottom',width:1440,height:900,x:st.width/2,y:st.height,scale:g.HonroBounds.zoomLimits(1440).min},
 {name:'portrait-min',width:390,height:844,x:0,y:st.height/2,scale:g.HonroBounds.zoomLimits(390).min},
 {name:'chamber',width:1440,height:900,x:0,y:g.HONRO_CORE.topAt(floor,1,st.height)-700,scale:.30},
 {name:'top-min',width:1440,height:900,x:st.width/2,y:-1800,scale:g.HonroBounds.zoomLimits(1440).min}
 ];for(const v of views){const b=g.HonroMaps.createBattle(st,g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(b);const e=new g.HONRO_CORE.Engine(b,()=>{},true),cv=canvas(v.width,v.height),scene=new g.HonroScene(cv);Object.assign(scene,{...v,manual:true,time:2,skillPreview:true});const before=JSON.stringify(b);scene.render(e,0,'',.6,false,0);await new Promise(resolve=>setTimeout(resolve,20));scene.render(e,0,'',.6,false,0);if(JSON.stringify(b)!==before)throw Error('Render mutated stage '+id);const file=`stage-${id}-${v.name}.png`,bytes=cv.toBuffer('image/png');await writeFile(path.join(out,file),bytes);results.push({stage:id,file,sha256:sha(bytes),view:v,cache:scene.renderCacheStats()});console.log(tag,id,v.name);for(const t of scene._domainTiles?.tiles.values()||[])t.canvas.width=1;scene._domainTiles?.tiles.clear();scene._staticWorldCache=null;cv.width=1;}}
await writeFile(path.join(out,'manifest.json'),JSON.stringify({tag,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceTree:execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),workingTree:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}),projectSha256:sha(JSON.stringify(g.HONRO_PROJECT)),source:'Production compiler + Scene, Native Canvas, no browser/HUD/input claim',results},null,2)+'\n');
