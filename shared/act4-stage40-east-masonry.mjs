/* Stage 40 east arrival, three native masonry courses. Apply only after the
 * canonical optimized body has been assembled, before campaign packaging. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const assetId='approved40:body', elementId='approved40-body';
const beforeSHA='a0664a8e0cd99928a1eb83a34829dd2a8ff041a2acd8ff2978b2289fece0705e';
const afterSHA='66fd057b03754601c0be187fda50a8042f13863a754bafecab77b13d70985440';
const beforeVectorSHA='fe904d65c4de4aa199787372fd706f9dd33f66a3911eedaecacc2adcd8a2ddca';
const raw='4724416:12a0c1d5', archived='4471109:d3f5a835', parent='1644042:df21ebc3', next='1647277:af3b90a3';
const sha=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const sig=o=>{
 const s=JSON.stringify(o);let h=2166136261;
 for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);
 return s.length+':'+(h>>>0).toString(16);
};
const courses=[{"tag":"path","fill":"#324759","stroke":"none","fillRule":"nonzero","d":"M1075.7143 525.1395L1074.2857 521.5681L1074.2857 503.7824L1079.2857 502.2824L1087.8571 501.5681L1094.2857 500.1395L1101.4286 500.8538L1108.5714 497.9967L1114.1964 496.7467L1115 497.2824L1115 507.2824L1112.1429 513.7109L1108.5714 517.9967L1107.8397 518.2754L1102.8571 519.4252L1096.5714 522.5681L1093.5714 523.7109Z"},{"tag":"path","fill":"#243757","stroke":"none","fillRule":"nonzero","d":"M1074.2857 507.2824L1081.4286 505.8538L1090 505.8538L1095 504.4252L1099.2857 504.4252L1106.4286 501.5681L1112.1429 500.1395L1115 499.1872L1115 507.2824L1113.882 509.7979L1110.7143 510.8538L1107.8571 515.8538L1103.5714 516.5681L1097.8571 517.2824L1093.5714 520.1395L1085.7143 522.9967L1077.8151 524.9714L1076.9458 525.041L1075.3571 524.2467L1074.2857 521.5681L1074.2857 517.2824Z"},{"tag":"path","fill":"#4c6591","stroke":"none","fillRule":"nonzero","d":"M1074.2857 496.7467L1074.5834 496.5234L1083.9067 495.1249L1085 495.8538L1084.2857 499.4252L1081.4286 502.2824L1075 502.9967L1074.2857 502.2824ZM1087.1429 495.8538L1089.5238 494.4252L1097.8571 494.4252L1099.2857 495.1395L1098.5714 498.7109L1095.7143 501.5681L1089.2857 502.2824L1086.4286 500.1395ZM1101.8571 494.4252L1110.7143 494.4252L1112.406 495.553L1111.4286 497.9967L1106.4286 500.1395L1102.1429 499.4252L1100.7143 497.2824ZM1113.9286 496.5681L1115 497.2824L1115 499.4252L1113.5714 497.9967ZM1074.2857 507.2824L1080.7143 505.1395L1086.4286 505.1395L1089.2857 507.2824L1088.5714 510.8538L1085.7143 513.7109L1080 515.1395L1075.7143 514.4252L1074.2857 512.5204ZM1091.4286 506.5681L1094.2857 504.4252L1097.8571 503.7109L1100.7143 505.1395L1101.4286 509.4252L1098.5714 512.2824L1094.2857 512.2824L1091.4286 510.1395ZM1103.5714 505.1395L1106.4286 502.2824L1110 501.5681L1113.5714 502.2824L1115 505.8538L1112.1429 509.4252L1108.5714 510.8538L1104.2857 509.4252ZM1075 523.3538L1075 519.4252L1078.5714 517.2824L1084.2857 516.5681L1087.1429 518.7109L1086.4286 521.5681L1082.1429 524.4252L1079.8351 524.8099L1077.5616 524.9917L1075.1786 523.8002ZM1088.5714 518.7109L1091.4286 515.1395L1096.4286 513.7109L1100.7143 513.7109L1104.2857 515.1395L1103.5714 517.9967L1099.2857 520.8538L1094.2857 522.9967L1090 522.2824ZM1105.7143 513.7109L1108.5714 511.5681L1113.6607 510.2958L1112.1429 513.7109L1109.3779 517.0289L1107.8571 517.2824Z"},{"tag":"path","fill":"#5b74a2","stroke":"none","fillRule":"nonzero","d":"M1075 497.2824L1077.3469 496.1089L1079.0476 495.8538L1082.8571 495.8538L1082.1429 497.2824L1079.2857 498.7109L1075 498.7109ZM1087.8571 496.5681L1090 495.1395L1095.7143 495.1395L1097.8571 495.8538L1095 496.5681L1090.7143 497.2824ZM1103.5714 494.4252L1110 494.4252L1109.2857 495.1395L1104.2857 495.8538ZM1075.7143 507.9967L1080 506.5681L1085.7143 506.5681L1086.4286 507.2824L1082.8571 508.7109L1077.1429 509.4252ZM1092.1429 507.2824L1095 505.1395L1097.8571 505.1395L1099.2857 506.5681L1095.7143 507.2824ZM1105.7143 505.1395L1107.8571 503.7109L1111.4286 502.9967L1112.8571 504.4252L1110 505.1395ZM1089.2857 518.7109L1092.8571 516.5681L1097.8571 515.1395L1100 515.1395L1098.5714 516.5681L1093.5714 518.7109ZM1075.7143 520.1395L1078.5714 518.7109L1082.8571 517.9967L1084.2857 519.4252L1081.4286 520.8538L1076.4286 521.5681Z"}];

export function applyStage40EastMasonry(project,previousAct4Signatures){
 const stages=project.stages.filter(s=>s.id==='stage-40'||s.metadata?.stageId===40),s=stages[0];
 assert(stages.length===1&&s.id==='stage-40'&&s.metadata.stageId===40&&s.metadata.campaign===true&&
  s.metadata.act4Stage===40&&s.width===6656&&s.height===4096,'Stage40 masonry: unexpected canonical stage');
 const placements=project.stages.flatMap(stage=>(stage.elements??[]).filter(e=>e.assetId===assetId||e.id===elementId).map(e=>[stage,e]));
 const [owner,e]=placements[0]??[];
 assert(placements.length===1&&owner===s&&e.id===elementId&&e.assetId===assetId&&e.x===0&&e.y===0&&
  e.scale===1&&e.rotation===0&&e.snap===false&&e.layer==='mid'&&e.depthLayer==='L1'&&
  e.nativeArtLayer==='body','Stage40 masonry: unexpected body registration');
 const assets=project.library.filter(a=>a.id===assetId),stock=assets[0];
 assert(assets.length===1&&Array.isArray(stock.collision)&&stock.collision.length===0&&!stock.interactionType&&
  sha(stock)===beforeSHA&&sha(stock.vector)===beforeVectorSHA&&sig(stock)===parent,
  'Stage40 masonry: upstream body changed; re-verify instead of repinning');
 assert.deepEqual(previousAct4Signatures[assetId],{stage:40,previous:raw,previousOptimized:[archived],current:parent},
  'Stage40 masonry: upstream save provider registry differs');
 const painted=structuredClone(stock),v=painted.vector,r=v.root.children[0];
 assert.deepEqual(v.root.transform,[4,0,0,4,0,0],'Stage40 masonry: unexpected native body transform');
 assert(r.clipPath==='sourceAlpha'&&r.children.length===24&&
  sha(v.clips.sourceAlpha)==='ca6197f3a9230ce602d1f8431e6f88979a958a694b2d509271af2d3879800cdf',
  'Stage40 masonry: unexpected native leaf slot');
 r.children.push(...structuredClone(courses));
 assert(sha(painted)===afterSHA&&sig(painted)===next,'Stage40 masonry: exact verified C2 result differs');
 return {project:{...project,library:project.library.map(a=>a===stock?painted:a)},
  previousAct4Signatures:{...previousAct4Signatures,[assetId]:{
   stage:40,previous:raw,previousOptimized:[archived,parent],current:next,
  }}};
}
