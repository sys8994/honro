import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(process.argv[2]??'');
if(root===process.cwd()||process.env.HONRO_BLANK_WORKSHOP_LOCAL!=='1')throw Error('Use disposable built Workshop only');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'web/manifest.json'),'utf8'));
if(!/^web\/entries\/workshop\.[a-f0-9]+\.js$/.test(manifest.workshopEntry))throw Error('Missing Workshop entry pin');
const html=fs.readFileSync(path.join(root,'HONRO_WORKSHOP.html'),'utf8');
if(!html.includes('src="'+manifest.workshopEntry+'"'))throw Error('Rendered Workshop and entry mismatch');
const entry=fs.readFileSync(path.join(root,manifest.workshopEntry),'utf8');
const names=[...new Set(entry.match(/workshop-app\.[a-f0-9]+\.js/g)??[])];
if(names.length!==1||names[0]!=='workshop-app.489f733634454986.js')throw Error('Unexpected active Workshop app');
const file=path.join(root,'web/runtime',names[0]),original=fs.readFileSync(file,'utf8');
if(createHash('sha256').update(original).digest('hex')!=='489f733634454986a5f4cd94468e7b7393a18508ee1e02e1ce0cad77ab8b324f')throw Error('Wrong active Workshop source');
const marker='window.HonroWorkshopAPI=';
if(original.split(marker).length!==2)throw Error('Missing Workshop connection seam');
const source=n=>fs.readFileSync(new URL(n,import.meta.url),'utf8').replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'');
const moduleNames=['./blank.mjs','./native-facets.mjs','./native-contact.mjs','./partition.mjs','./pack.mjs','./host.js'];
const payload=moduleNames.map(n=>n.endsWith('native-facets.mjs')?'const compileNativeFacets=(()=>{'+source(n)+';return compileNativeFacets})();':source(n)).join('\n');
let safe=original;
for(const [needle,replacement] of [
 ['const eh=$("#elementToolbar");if(eh)eh.innerHTML=', 'const eh=$("#elementToolbar");if(eh&&!activeAsset())eh.innerHTML="";else if(eh)eh.innerHTML='],
 ['function switchTab(t){if(currentTab===', 'function switchTab(t){if(t==="element"&&!activeAsset()){toast("먼저 신규 벡터 지형을 저장하세요.");return}if(currentTab==='],
 ['scene.render(engine,0,"",.6,false,0);Object.assign(stageView', 'if(document.documentElement.dataset.cleanNeutral==="1"&&stage().id==="stage-42-clean-sheet"){const bg=scene.background,read=scene.backgroundReadability,weather=scene.weatherParticles,env=engine.b?.honroEnvironment,sky=env?.skyVisible;try{if(env)env.skyVisible=false;scene.background=(c,w,h)=>{c.save();c.fillStyle="#20262a";c.fillRect(0,0,w,h);c.restore()};scene.backgroundReadability=scene.weatherParticles=()=>{};scene.render(engine,0,"",.6,false,0)}finally{scene.background=bg;scene.backgroundReadability=read;scene.weatherParticles=weather;if(env)env.skyVisible=sky}}else scene.render(engine,0,"",.6,false,0);Object.assign(stageView']
]){
 if(safe.split(needle).length!==2)throw Error('Missing exact blank UI seam: '+needle);
 safe=safe.replace(needle,replacement);
}
fs.writeFileSync(file,safe.replace(marker,'\n;{\n'+payload+'\n}\n'+marker));
