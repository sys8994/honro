import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {compileSVG} from './build-act2-art.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
// ACT1 outdoor landmarks. Author at 60 world units / metre and attach the single
// ground datum to an L1-back terrain surface, or a finite scenery support.
// The compiler is shared with ACT2; no ACT2 source or existing asset is changed.
export const ACT1_VECTOR_ART=Object.freeze({
 'act1-scene:rooted-sacred':{file:'act1-scene-rooted-sacred.svg',name:'경사지에 접지된 당산나무',category:'tree',heightM:11.2,tags:['forest','ritual','outdoor','single-root'],stages:[1,5,8,9,10]},
 'act1-scene:rooted-pine':{file:'act1-scene-rooted-pine.svg',name:'경사지에 접지된 한 그루 소나무',category:'tree',heightM:12.8,tags:['forest','pine','outdoor','single-root'],stages:[1,2,3,4,5,6,8]},
 'act1-scene:pine-grove':{file:'act1-scene-pine-grove.svg',name:'고갯길의 비대칭 솔숲',category:'tree',heightM:12.8,tags:['forest','pine','outdoor'],stages:[1,2,5,6]},
 'act1-scene:ritual-grove':{file:'act1-scene-ritual-grove.svg',name:'붉은 실이 남은 당산 숲',category:'tree',heightM:11.2,tags:['forest','ritual','outdoor'],stages:[7,8,9,10]},
 'act1-scene:valley-granite':{file:'act1-scene-valley-granite.svg',name:'넓은 명암면의 계곡 화강암',category:'rock',heightM:9.8,tags:['granite','valley','outdoor'],stages:[2,5,6,7]},
 'act1-scene:ferry-house':{file:'act1-scene-ferry-house.svg',name:'연목 나루 움막과 작업 처마',category:'architecture',heightM:5.5,tags:['ferry','shelter','outdoor'],stages:[3]},
 'act1-scene:refuge-gate':{file:'act1-scene-refuge-gate.svg',name:'피란문과 이어진 마을 담장',category:'architecture',heightM:7.5,tags:['village','gate','outdoor'],stages:[4]},
 'act1-scene:refuge-courtyard':{file:'act1-scene-refuge-courtyard.svg',name:'사람을 기다리는 피란 쉼터',category:'architecture',heightM:5.6,tags:['village','shelter','outdoor'],stages:[4,6,7]},
 'act1-scene:bridge-abutment':{file:'act1-scene-bridge-abutment.svg',name:'끊어진 다리의 목조 교대',category:'architecture',heightM:5.8,tags:['bridge','ruin','outdoor'],stages:[6]},
 'act1-scene:ruined-court':{file:'act1-scene-ruined-court.svg',name:'무너진 제례문과 빈 회랑',category:'architecture',heightM:6.8,tags:['ritual','court','ruin','outdoor'],stages:[8,9,10]},
 'act1-scene:root-sanctuary':{file:'act1-scene-root-sanctuary.svg',name:'세 쉼터를 품은 거대한 당산나무',category:'tree',heightM:45.6,tags:['forest','root-village','shelter','outdoor'],stages:[7]},
 'act1-scene:ritual-hall':{file:'act1-scene-ritual-hall.svg',name:'받이진 뒤의 열린 제당',category:'architecture',heightM:8,tags:['ritual','hall','altar','outdoor'],stages:[9,10]}
});
export const ACT1_VECTOR_FILES=Object.freeze(Object.fromEntries(Object.entries(ACT1_VECTOR_ART).map(([id,spec])=>[id,spec.file])));

export async function applyAct1VectorArt(project){
 if(!project||!Array.isArray(project.library))throw new TypeError('ACT1 art requires a project with a library');
 if(project.version>=4)project.version=Math.max(5,project.version);
 for(const [id,spec]of Object.entries(ACT1_VECTOR_ART)){
  const source=await readFile(path.join(root,'shared/assets/environment',spec.file),'utf8');
  const vector=compileSVG(source),[x,y,w,h]=vector.viewBox,bounds={x,y,w,h};
  let asset=project.library.find(a=>a.id===id);
  if(!asset){asset={id,visual:[],collision:[],anchor:{x:0,y:0},sockets:[],params:{}};project.library.push(asset);}
  Object.assign(asset,{name:spec.name,category:spec.category,vector,bounds,tags:['act1','scene-scale','pure-svg',...spec.tags],reference:{heightM:spec.heightM,bounds,foot:{x:0,y:0},scaleRange:spec.tags.includes('single-root')?[.3,2.4]:[.5,2.4],backgroundRange:[.75,1.3]}});
  // Art is decorative: gameplay surfaces, collisions, targets and movement are
  // authored in the stage, not inferred from a roof, stair or broken bridge.
 }
 return project;
}
