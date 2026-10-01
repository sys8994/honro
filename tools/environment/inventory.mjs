import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const project=JSON.parse(await readFile(path.join(root,'shared/data/campaign.json'),'utf8'));
const countBy=(items,key)=>items.reduce((out,item)=>(out[item[key]]=(out[item[key]]||0)+1,out),{});
const rows=['# 배경 공간 분류 목록','',`자동 생성: \`node tools/environment/inventory.mjs\` · 스키마 ${project.version} · environment ${project.environmentVersion}`,'',
 '기준 수치와 프리셋은 `shared/map/environment.js`의 `HonroEnvironment`를 참조한다. 아래 크기·사용처는 `shared/data/campaign.json`에서 생성했다.','',
 '| Asset | 기준 높이(m) | 벡터 경계(x,y,w,h) | 부착점(x,y) | 사용 깊이 / 스테이지 |','| --- | ---: | --- | --- | --- |'];
for(const a of project.library){const r=a.reference,uses=[];for(const st of project.stages){for(const e of st.elements)if(e.assetId===a.id)uses.push(`L1:${st.id}`);for(const e of st.environment.placements)if(e.assetId===a.id)uses.push(`${e.depthLayer}:${st.id}`);}const b=r.bounds,point=p=>`${+p.x.toFixed(1)},${+p.y.toFixed(1)}`;rows.push(`| ${a.id} | ${r.heightM} | ${point(b)},${+b.w.toFixed(1)},${+b.h.toFixed(1)} | ${point(r.foot)} | ${[...new Set(uses)].join(', ')||'미사용'} |`);}
rows.push('','## 맵별 분류','', '| 맵 | 프리셋 | L1 요소 | L1 지형 | L1 재질 | L1 유닛/마커/이벤트 | L2 | L3 | L4 | L5 |','| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |');
for(const st of project.stages){const n=countBy(st.environment.placements,'depthLayer');rows.push(`| ${st.id} | ${st.environment.preset} | ${st.elements.length} | ${st.terrains.length} | ${st.materials.length} | ${st.units.length+st.markers.length+st.events.length} | ${n.L2||0} | ${n.L3||0} | ${n.L4||0} | ${st.environment.preset==='enclosed'?'없음':'하늘·달·날씨'} |`);}
rows.push('','L1 요소의 `back`/`prop`/`front`는 그리기 순서이며 공간 깊이가 아니다. 충돌, 경로, 지면 부착 장식은 모두 L1이다. L5 하늘·달은 `shared/runtime/environment-renderer.js`, 날씨는 `shared/runtime/renderer.js`에서 화면 고정으로 그린다.','');
const output=rows.join('\n');const file=path.join(root,'game/docs/ENVIRONMENT_INVENTORY.md');if(process.argv.includes('--check')){const current=await readFile(file,'utf8');if(current!==output)throw Error('Environment inventory is stale');}else await writeFile(file,output);
console.log(`Environment inventory: ${project.library.length} assets, ${project.stages.length} maps, ${project.stages.reduce((n,s)=>n+s.environment.placements.length,0)} finite placements`);
