/** Inactive material evidence only. No project, scene, registry or build mutation. */
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {compileSVG} from './build-act2-art.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(import.meta.url),native=require('@napi-rs/canvas');
native.GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','HonroEvidence');
const g=vm.createContext({Path2D:native.Path2D});
vm.runInContext(await readFile(path.join(root,'shared/map/vector-art.js'),'utf8'),g);
const draft=path.join(root,'workshop/drafts/act3-town-assets'),manifest=JSON.parse(await readFile(path.join(draft,'dense-extension-manifest.json'),'utf8'));
const out=path.join(root,'_local/reports/act3-dense-assets');await mkdir(out,{recursive:true});
const clean=process.argv.includes('--clean');
const cv=native.createCanvas(1800,1100),c=cv.getContext('2d');
c.fillStyle='#10262e';c.fillRect(0,0,1800,1100);
const text=(s,x,y,size,color='#d2d4bd')=>{c.fillStyle=color;c.font=`${size}px HonroEvidence`;c.fillText(s,x,y);};
text(clean?'3막 읍성 · 회랑과 기록고, 돌다리':'3막 읍성 · 추가 건축 재료 3종',38,56,32);
text(clean?'맵 배치 미확정인 공통 건축 재료 시안':'INACTIVE DRAFT  |  맵 선택 전 재료 시안  |  실제 UI·맵 검증 화면 아님',40,89,19,'#94b1b3');
if(!clean)text('순수 SVG → 기존 HonroVectorArt → Native Canvas / 외부 이미지·새 렌더러 없음',40,120,17,'#92a6a4');
for(const [i,a] of manifest.assets.entries()){
 const x=30+i*590,w=560;
 c.fillStyle='#172f37';c.fillRect(x,152,w,890);
 text(String(i+1).padStart(2,'0')+'  '+a.name,x+20,191,24);
 const source=await readFile(path.join(draft,a.file),'utf8'),asset={vector:compileSVG(source),anchor:a.reference.foot};
 const draw=(scale,px,py)=>g.HonroVectorArt.draw(c,asset,{x:px,y:py,scale});
 const line=(px,py,len)=>{c.strokeStyle='#516a63';c.lineWidth=1;c.beginPath();c.moveTo(px,py);c.lineTo(px+len,py);c.stroke();};
 line(x+16,566,w-32);draw(.355,x+w/2,565);
 if(!clean)text('공통 접지선  y = 0',x+20,594,15,'#98aa98');
 text(['두 층의 열린 통로 / 긴 처마 / 목조 기둥','앞벽 없는 내부 / 세 칸 서가 / 계단 여백','평평한 상판 / 세 개의 열린 홍예 / 석재 받침'][i],x+20,628,17,'#b2b7a0');
 text(clean?'작게 본 모습':'모바일 폭 390px · 검토 배율 0.24',x+20,681,18);
 const mx=x+85,my=710,mw=390,mh=245;
 c.fillStyle='#294249';c.fillRect(mx,my,mw,mh);line(mx+10,my+215,mw-20);draw(.24,mx+195,my+214);
 // A calibration ruler uses the existing hero body height (92 world units).
 if(!clean){c.strokeStyle='#ddbe76';c.lineWidth=2;c.beginPath();c.moveTo(mx+18,my+214);c.lineTo(mx+18,my+214-92*.24);c.moveTo(mx+13,my+214);c.lineTo(mx+23,my+214);c.moveTo(mx+13,my+214-92*.24);c.lineTo(mx+23,my+214-92*.24);c.stroke();
 text('92wu',mx+28,my+207,13,'#ddbe76');}
 text(clean?['건물 사이를 잇는 열린 회랑','여러 층이 보이는 대형 기록고','물길 위를 잇는 세 홍예 돌다리'][i]:'통로·빈칸은 투명 / 충돌·배치 미등록',x+20,989,17,'#a5b4ab');
 if(!clean)text(`${Buffer.byteLength(source).toLocaleString()} bytes  ·  ${g.HonroVectorArt.prepare(asset.vector).pathCount} paths`,x+20,1019,15,'#7f9fa4');
}
text(clean?'개별 미술 재료를 비교한 그림입니다. 실제 게임 화면이 아니며, 맵 구조·동선·기믹은 아직 정하지 않았습니다.':'건축·재료 방향을 검토하기 위한 시안입니다. 맵 구조, 이동 동선, 탄도 차단, 이야기·기믹은 확정하지 않았습니다.',38,1075,18,'#b9c2ae');
const filename=clean?'HONRO-Act3-dense-architecture-draft.png':'contact-sheet.png';
await writeFile(path.join(out,filename),cv.toBuffer('image/png'));
console.log(path.join(out,filename));
