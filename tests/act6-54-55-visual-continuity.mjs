import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read=file=>readFile(new URL(file,import.meta.url),'utf8');
const entry=await read('../shared/runtime/stage54-entry.inc.js');
const from=entry.indexOf('      function withWestFoothill54(');
const to=entry.indexOf('      function mountFrom53(',from);
assert(from>=0&&to>from,'Missing 54 scenery owner');
const withFoot=vm.runInNewContext(entry.slice(from,to)+';withWestFoothill54');
const host={id:'art-g00-foothill',asset:{id:'g00-foothill'},x:0,y:0,scale:1,rotation:0,collisionIds:[]};
const landmarks=[host],unchanged=JSON.stringify(landmarks);
const [joint,continued,inset]=withFoot(landmarks);
assert.equal(continued,host);
assert.equal(JSON.stringify(landmarks),unchanged);
assert.equal(joint.collisionIds.length,0);
assert.equal(joint.asset.collision.length,0);
assert.equal(joint.layer,'back');
assert.equal(joint.asset.params.paintBeyondTerrainDomain,true);
assert.equal(inset.layer,'prop');
assert.equal(inset.asset.layer,'prop');
for(const item of [joint,inset]){
const {x,y,w,h}=item.asset.bounds;
for(const face of item.asset.visual){
 assert(face.points.every(p=>p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+h));
 assert(face.points.every(p=>p.x<0),'The deep continuation cannot enter the route');
}
}
assert(joint.asset.visual[0].points.some(p=>p.x<-250)&&joint.asset.visual[0].points.some(p=>p.x>-250));
for(const wrong of [{...host,collisionIds:['solid']},{...host,rotation:90},{...host,id:'art-broken-rail'}]){
 const other=[wrong];assert.equal(withFoot(other),other);
}

const source=await read('../shared/runtime/terrain-readability.js');
class Scene {constructor(){this.scale=.6;}}
class Path {
 constructor(){this.edges=[];}
 moveTo(x,y){this.pending=[x,y];}
 lineTo(x,y){this.edges.push([...this.pending,x,y]);}
}
const C={poly:t=>t.vertices};
const ctx=vm.createContext({HONRO_CORE:C,HonroScene:Scene,Path2D:Path});
vm.runInContext(source,ctx);
const visible=[];
const canvas={save(){},restore(){},stroke(p){visible.push(p);}};
const siteArt={id:'ch05-v2-local-native-art',asset:{id:'ch05-v2-local-native-art',visual:[{}]},x:0,y:0,scale:1,rotation:0,collisionIds:[]};
const face=(id,x)=>({id,x,y:0,w:80,h:80,vertices:[{x,y:0},{x:x+80,y:0},{x:x+80,y:80},{x,y:80}]});
const b={mode:'campaign',honroCanonical:true,honroCustom:false,honroMapOrigin:'campaign',honroStage:55,honroAuthoredId:'stage-55',
 terrain:[face('west-ring-descent',0),face('other',400)],honroLandmarks:[siteArt]};
const scene=new Scene();
scene.terrainReadability(canvas,b);
assert.equal(visible.length,3,'Only the unrelated group should reach synthetic strokes');
assert(visible.every(p=>p.edges.flat().some(x=>x>=400)));
assert.equal(ctx.HonroTerrainReadability.prepare(b).groups.length,2,'Diagnostic geometry remains available');
visible.length=0;scene.terrainReadability(canvas,{...b,honroLandmarks:[]});
assert.equal(visible.length,6,'Detached fallback art must keep stock behavior');
visible.length=0;scene.terrainReadability(canvas,{...b,honroCustom:true});
assert.equal(visible.length,6,'Custom map must keep stock behavior');
const stage54={...b,honroStage:54,honroAuthoredId:'stage-54'};
assert.equal(ctx.HonroTerrainReadability.paintPieces(stage54,'foothill',{x:-250,y:2920},{x:-250,y:3230}).length,0);
const baseEdge=ctx.HonroTerrainReadability.paintPieces(stage54,'foothill',{x:-250,y:3230},{x:475,y:3340});
assert.equal(baseEdge.length,1);assert(baseEdge[0][0].x>=-128&&baseEdge[0][1].x===475);
assert.equal(ctx.HonroTerrainReadability.paintPieces(stage54,'foothill',{x:250,y:2660},{x:400,y:2632}).length,1);
console.log('Act 6: west scenery stays outside play; painted bell lips retain separate geometry and diagnostic paths.');
