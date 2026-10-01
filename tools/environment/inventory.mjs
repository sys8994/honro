import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),g=vm.createContext({});
vm.runInContext(await readFile(path.join(root,'shared/map/environment.js'),'utf8'),g);
const E=g.HonroEnvironment,project=JSON.parse(await readFile(path.join(root,'shared/data/campaign.json'),'utf8'));
const rows=['# 배경 공간 분류 목록','',
 '자동 생성: `node tools/environment/inventory.mjs`. 수치와 모드는 `shared/map/environment.js`의 registry를 참조한다.',
 '', '| Asset | 기준 높이(m) | 역할 | 접지 | 사용 깊이 | 묶음 / 수직 모드 / 구역 | 대기 표현 / 렌더링 |',
 '| --- | ---: | --- | --- | --- | --- | --- |'];
const inventory=[];
for(const a of project.library){
 const role=E.assetRole(a),uses=[];
 for(const st of project.stages){
  for(const e of st.elements)if(e.assetId===a.id)uses.push({stage:st.id,layer:'L1',support:e.snap?'terrain snap':'authored terrain/contact',group:null,mode:'WORLD',zone:'world',atmosphere:st.environment.atmosphere.preset});
  for(const e of st.environment.placements)if(e.assetId===a.id){const g=E.groupOf(st,e);uses.push({stage:st.id,layer:e.depthLayer,support:e.supportId||null,group:g?.id,mode:g?.verticalMode,zone:g?.zoneId,atmosphere:st.environment.atmosphere.preset});}
 }
 const distinct=key=>[...new Set(uses.map(u=>u[key]))].join(', ')||'미사용';
 rows.push('| '+[a.id,a.reference.heightM,role.role,role.rooted?'지형/지지면 필수':'풍경/하늘',distinct('layer'),[distinct('group'),distinct('mode'),distinct('zone')].join(' / '),role.animation+' / '+role.strategy].join(' | ')+' |');
 inventory.push({assetId:a.id,reference:a.reference,...role,uses});
}
rows.push('','## 현재 맵','',
 '| 맵 | 거리 preset / atmosphere | L1 장식 / 지형 / 물 | 구역 | 풍경 묶음 | 지지면 | 배경 개체 |',
 '| --- | --- | --- | --- | ---: | ---: | ---: |');
for(const st of project.stages){const e=st.environment;rows.push('| '+[st.id,e.preset+' / '+e.atmosphere.preset,st.elements.length+' / '+st.terrains.length+' / '+st.materials.filter(m=>/water/.test(m.kind)).length,e.zones.map(z=>z.id).join(', '),e.groups.length,e.surfaces.length,e.placements.length].join(' | ')+' |');}
rows.push('','## 코드가 생성하는 요소','',
 '| 요소 | 공간 / 지지 | 대기·애니메이션 | 실제 소스 |',
 '| --- | --- | --- | --- |',
 '| 능선·절벽·후면 지면 | L2–L4, surface와 group 공유 | 깊이별 큰 색면, 정적 Path2D | environment.js / environment-renderer.js |',
 '| 하늘·달·큰 구름 | L5, viewport | preset gradient / radial glow / 정적 fog card | environment-renderer.js |',
 '| 능선 안개 | L3 group / zone | 미리 그린 유기적 card, translate | environment-art.js |',
 '| 빛기둥·동굴 입구 빛 | zone / viewport | gradient, 낮은 opacity 변화 | environment-art.js |',
 '| 낙엽·날씨 | L5, viewport; enclosed 제외 | 기존 Scene.time | renderer.js |',
 '| 물웅덩이·강 | L1 실제 water material polygon | depth gradient, clip, 5개 재사용 곡선, 진입 파문 | environment-renderer.js / environment-art.js |',
 '| 전장 폭포 | L1 authored landmark의 절벽 | 캐시된 암면, clip 내부 흐름, 포말, 하단 mist | map-art-polish.js / environment-art.js |',
 '| 원경 폭포 | L2 group, 절벽 상단 support | 같은 흐름 primitive / group transform | environment-renderer.js |',
 '| 전장 장식·구조물 | L1, authored terrain/contact | WORLD, 기존 world raster cache | elements.js / map-art-polish.js / art-dark.js |',
 '',
 'L1의 back/prop/front는 깊이가 아닌 그리기 순서다. 캐릭터·탄·조준선은 WORLD이며 대기 효과 뒤에 그린다.',
 '미사용 에셋도 기준 크기와 미술 역할을 분류한다. 모든 인스턴스의 stage/support/group/zone/atmosphere 상세는 생성 JSON에 포함된다.',
 '');
const output=rows.join('\n'),file=path.join(root,'game/docs/ENVIRONMENT_INVENTORY.md');
if(process.argv.includes('--check')){if(await readFile(file,'utf8')!==output)throw Error('Environment inventory is stale');}
else{await writeFile(file,output);await mkdir(path.join(root,'_local/reports/environment-v3'),{recursive:true});await writeFile(path.join(root,'_local/reports/environment-v3/inventory.json'),JSON.stringify(inventory,null,2)+'\n');}
console.log('Environment inventory: '+project.library.length+' assets, '+project.stages.length+' maps; '+project.stages.reduce((n,s)=>n+s.environment.placements.length,0)+' supported placements');
