/** Explicit uniform placement adjustment; never edits source art or geography. */
import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='art/act2-ch1-compact-20261109/foundation/';
const packagePath='shared/data/act2/stage11-compact-package.json';
const bytes=await fs.readFile(packagePath),stage=JSON.parse(bytes).stage;
const boundsPath='shared/map/bounds.js',boundsBytes=await fs.readFile(boundsPath),g={};
vm.runInNewContext(boundsBytes.toString(),g);
const B=g.HonroBounds,config=JSON.parse(await fs.readFile(base+'asset-config.json','utf8'));
const floor=stage.terrains.find(t=>t.id==='compact-floor');
const canonical='M'+floor.points.map(p=>`${p.x},${p.y}`).join('L')+'Z';
assert.equal(config.bodyClip[0],canonical,'Canonical full floor must remain identical');
const source=[1536,1024],box=[-4500,1000,16500,11000],scale=box[2]/source[0];
assert.equal(scale,box[3]/source[1]);
const previous=JSON.parse(await fs.readFile(base+'placement-v1/exposure-contract.json','utf8'));
const sha=x=>createHash('sha256').update(x).digest('hex');
function floorY(x){
 const ys=[];
 for(let i=0;i<floor.points.length;i++){
  const a=floor.points[i],z=floor.points[(i+1)%floor.points.length];
  if(Math.abs(a.x-z.x)<1e-9)continue;
  if(x>=Math.min(a.x,z.x)&&x<=Math.max(a.x,z.x))ys.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));
 }
 assert(ys.length,'No canonical floor at '+x);
 return Math.min(...ys);
}
const screens=[[1440,900],[844,390],[390,844],[768,1024],[320,920]];
const rows=screens.map(([w,h])=>{
 const limits=B.zoomLimits(w),exposure=B.visual(stage,w,h);
 const samples=[exposure.left,exposure.right,...floor.points.map(p=>p.x).filter(x=>x>exposure.left&&x<exposure.right)];
 const minGroundY=Math.min(...samples.map(floorY));
 const margin={left:exposure.left-box[0],right:box[0]+box[2]-exposure.right,bottom:box[1]+box[3]-exposure.bottom,aboveFirstVisibleGround:minGroundY-box[1]};
 assert(Object.values(margin).every(v=>v>=0),'Placement misses actual ground exposure');
 return{w,h,focus:B.focus(stage),minimumZoom:limits.min,zoomLimits:limits,overscanned:exposure,minCanonicalGroundY:minGroundY,marginWorld:margin,groundCoveragePass:true};
});
const oldBox=[-4200,1200,15000,10000];
config.bounds={x:box[0],y:box[1],w:box[2],h:box[3]};
config.transform=[scale,0,0,scale,box[0],box[1]];
config.params.sourceWorldViewBox=box;
config.params.foundationPlacementRevision=2;
config.params.placementChange='Explicit uniform1.1x world placement to cover five actual viewport policy exposures; source art/native paths/colors/alpha/canonical floor unchanged. Not color optimization.';
await fs.writeFile(base+'asset-config.json',JSON.stringify(config,null,2)+'\n');
const report={...previous,scope:'Foundation placement revision2: exact common-policy exposure coverage only; scene joints/browser/play remain separate.',source:packagePath,sourceSha256:sha(bytes),boundsSource:boundsPath,boundsSourceSha256:sha(boundsBytes),focus:B.focus(stage),policy:B.POLICY,terrain:stage.terrainBounds,canonicalFloorClip:canonical,canonicalClipSha256:sha(canonical),screenCases:rows,previousWorldViewBox:oldBox,previousPlacementPreserved:'placement-v1/',proposedWorldViewBox:box,currentWorldViewBox:box,sourceSize:source,sourceToWorld:config.transform,uniformWorldUnitsPerSourcePixel:scale,uniformScale:1/scale,scaleRelativeToPrevious:1.1,placementRevision:2,coveragePass:rows.every(r=>r.groundCoveragePass),minimumBottomMarginWorld:Math.min(...rows.map(r=>r.marginWorld.bottom)),limits:'Only the five explicitly measured viewport sizes and current common focus/minimum-zoom/overscan policy. No claim for more extreme tall aspect/editor zoom or the entire canonical bottom27200. Root will review the changed geology alignment and joins in commonScene.',changeType:'Uniform world placement adjustment, no color/path optimization, no dummy/tile/camera/terrain change'};
await fs.writeFile(base+'exposure-contract.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({box,uniformWorldUnitsPerSourcePixel:scale,minimumBottomMarginWorld:report.minimumBottomMarginWorld,coveragePass:report.coveragePass,screenCases:rows}));
