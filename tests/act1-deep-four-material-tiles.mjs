// Source dispatch regression; not a browser screenshot or a waterfall playtest.
// Bounds/pose literals come from the approved campaign bindings and camera
// observations. The miniature Path2D/canvas and vector path are testing doubles.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';

const renderer=readFileSync(new URL('../shared/runtime/renderer.js',import.meta.url),'utf8');
const world=(left,top,right,bottom)=>({left,top,right,bottom});
const revisions=['honroStage5FoundationRevision','honroStage5DynamicRevision','honroStage5LakeRevision','honroStage5WaterfallRevision'];
const stockWaterRevision=Object.fromEntries(revisions.map(key=>[key,1]));
const configs=[
    {stage:4,method:'_stage4DeepBodyTileLandmark',id:'act1-stage04-traced-body',assetId:'act1-traced:stage04-body-v2',
        stageSize:[4600,3500],bodyBounds:[-4000,0,12600,6000],edge:[10600,27500],clips:['sourceSolid','sourceInset'],
        fill:'#3b2e26',ground:'gate-basin',sameRowThreshold:8191,south:[-1100,1520,-1905.8253205128203,9385.82532051282]},
    {stage:5,method:'_stage5DeepBankTileLandmark',id:'stage5-art-lower-bank',assetId:'act1-traced:stage05-floor-v4',
        stageSize:[6400,4300],bodyBounds:[-4000,1600,14400,5200],edge:[12400,28300],clips:['canonicalSolid','contactInset'],
        fill:'#263c3d',ground:'valley-floor',sameRowThreshold:8191,south:[-200,3320,-1105.8253205128203,10185.82532051282]},
    {stage:6,method:'_stage6DeepRoadBodyTileLandmark',id:'stage06-prototype-body',assetId:'stage06-prototype:continuous-body-v1',
        stageSize:[6600,3800],bodyBounds:[-4000,1500,14600,5500],edge:[12600,27800],clips:['road'],
        fill:'#364441',ground:'lower-road',sameRowThreshold:8191,south:[-100,3520,-1605.8253205128203,9685.82532051282]},
    {stage:10,method:'_stage10DeepFloorTileLandmark',id:'act1-stage10-traced-floor-v4',assetId:'act1-traced:stage10-floor-v4',
        stageSize:[5000,3900],bodyBounds:[-4000,1300,13000,5500],edge:[11000,27900],clips:['canonicalSolid','contactInset'],
        fill:'#263630',ground:'outer-yard',sameRowThreshold:6840,clipTop:2184,south:[-900,1920,-1505.8253205128203,9785.82532051282]},
];
const roadHash='1c3f1f1825e39cabf653688ed779dcc42d80ce448e4e582173a8eb53cbb80870';
const outline='M-6000,2000 H12500 V27500 H-6000 Z';
const view=(k,left)=>world(left,k.south[2],left+6800,k.south[3]);
const south=k=>view(k,k.south[0]);

function inputs(k){
    const b={honroStage:k.stage,honroCustom:false,width:k.stageSize[0],height:k.stageSize[1],
        honroTerrainBounds:world(-6000,-24000,...k.edge),sceneVersion:0,...(k.stage===5?stockWaterRevision:{})};
    const [x,y,w,h]=k.bodyBounds;
    const bounds={x,y,w,h};
    const prototype=k.stage===6;
    const params={semanticLayer:'BODY',previewOnly:prototype,
        ...(prototype?{collisionSource:k.ground,prototypeGeometrySha256:roadHash}:{bodyTerrainIds:[k.ground],bodyBaseColor:k.fill})};
    const face={tag:'path',fill:k.fill,d:outline};
    const vector={viewBox:[...k.bodyBounds],clips:Object.fromEntries(k.clips.map(clip=>[clip,[outline]])),root:{
        tag:'g',clipPath:k.clips[0],children:prototype?[face]:[{tag:'g',clipPath:k.clips[1],children:[face]}]
    }};
    const asset={id:k.assetId,anchor:{x:0,y:0},bounds,reference:{bounds:{...bounds}},params,vector,collision:[]};
    const owner={id:k.id,kind:'canonical-element',visualRole:'scenery',layer:'prop',depthLayer:'L1',asset,
        x:0,y:0,scale:1,rotation:0,collisionIds:[]};
    return {b,owner};
}
class Clip {
    boxes=[];
    rect(...box){this.boxes.push(box);}
}
function context(){
    return {matrix:{a:1,d:1,e:0,f:0},saved:[],materialClip:null,
        setTransform(a,b,c,d,e,f){this.matrix={a,d,e,f};},
        getTransform(){return this.matrix;},
        save(){this.saved.push([this.matrix,this.materialClip]);},
        restore(){[this.matrix,this.materialClip]=this.saved.pop();},
        beginPath(){},rect(){},clip(path){this.materialClip=path;},drawImage(){}};
}
function fixture(b,placements){
    const allocated=[],paints=[],zones=[];
    const r={HONRO_CONTENT:{},performance:{now:()=>0},Path2D:Clip,
        HonroTerrainDomain:{active:()=>true,materialLandmarks:()=>placements,render:()=>[]},
        HonroBounds:{viewport:s=>s.view},
        HonroGeometry:{transformPoint:({x,y},a,l)=>({
            x:(x-(a.anchor?.x||0))*(l.scale??1)+l.x,
            y:(y-(a.anchor?.y||0))*(l.scale??1)+l.y
        })},
        document:{createElement(tag){
            assert.equal(tag,'canvas');const c=context(),cv={getContext:()=>c};allocated.push(cv);return cv;
        }}
    };
    runInNewContext(renderer,r);
    const s=Object.assign(Object.create(r.HonroScene.prototype),{
        battle:b,scale:390/6800,_cacheStats:{worldBuilds:0,worldHits:0,worldBuildMs:0}});
    const tile=c=>{const m=c.getTransform();return [(2-m.e)/m.a,(2-m.f)/m.d];};
    s.landmark=(c,l)=>paints.push({tile:tile(c),l,original:placements.includes(l),clip:c.materialClip});
    s.surfaceZones=(c,observed)=>zones.push({tile:tile(c),observed,water:observed.honroSurfaceZones});
    return {s,allocated,paints,zones,render(v){s.view=v;s._drawTerrainDomainTiles(context(),b,390,648);}};
}
const extras=f=>f.paints.filter(q=>!q.original);
const clipBox=k=>[-6000,k.clipTop??-24000,k.edge[0]+6000,k.edge[1]-(k.clipTop??-24000)];

for(const k of configs){
    const name='Stage'+String(k.stage).padStart(2,'0');

    test(name+' restores two source-native deep BODY tiles at each signed mobile southern pose',()=>{
        const {b,owner}=inputs(k), before=JSON.stringify({b,owner});
        for(const [left,xs] of [[k.south[0],[-8192,0]],[-3720,[-8192,0]],[k.south[1],[0,8192]]]){
            const f=fixture(b,[owner]);
            assert.equal(f.s._worldRasterScale(b,390),.0625);
            assert.equal(f.s._landmarkVisible(owner,world(0,0,8192,8192)),true);
            assert.equal(f.s._landmarkVisible(owner,world(0,8192,8192,16384)),false);
            const pose=view(k,left);
            f.render(pose);
            assert.deepEqual(extras(f).map(p=>[p.tile,p.l.id,p.clip?.boxes]),
                xs.map(x=>[[x,8192],k.id,[clipBox(k)]]));
            assert(extras(f).every(p=>p.l.asset===owner.asset&&!p.l.honroElementCollision));
            assert.equal(f.allocated.length,6);
            assert(f.allocated.every(c=>c.width===516&&c.height===516));
            const cold=[f.paints.length,f.allocated.length,f.s._cacheStats.worldHits];
            f.render(pose);
            assert.deepEqual([f.paints.length,f.allocated.length],cold.slice(0,2));
            assert.equal(f.s._cacheStats.worldHits-cold[2],f.allocated.length);
        }
        assert.equal(JSON.stringify({b,owner}),before);
        assert.equal(owner.honroTerrainMaterialClip,undefined);
    });

    test(name+' keeps legacy draw order and upper tiles, clipping partial edge tiles to the signed bounds',()=>{
        const {b,owner}=inputs(k);
        const sibling={...owner,id:'ordinary-deep-prop',asset:{...owner.asset,id:'deep-decoration',
            bounds:{x:125,y:8400,w:450,h:625}}};
        const upper=fixture(b,[owner,sibling]);
        upper.render(world(-1600,-7300,5200,4000));
        assert(!extras(upper).length);
        assert(upper.paints.some(p=>p.l===owner&&p.clip===null));
        const f=fixture(b,[owner,sibling]);
        f.render(south(k));
        assert.deepEqual(f.paints.filter(p=>p.tile[0]===0&&p.tile[1]===8192).map(p=>[p.l.id,p.original]),
            [[owner.id,false],[sibling.id,true]]);
        const edge=fixture(b,[owner]);
        edge.render(world(-7000,26000,19000,30000));
        assert.deepEqual(extras(edge).map(p=>[p.tile,p.clip?.boxes]),[-8192,0,8192].map(x=>[[x,24576],[clipBox(k)]]));
        const d=b.honroTerrainBounds;
        for(const v of [
            world(-8192,8192,d.left,16384),world(d.right,8192,24576,16384),
            world(0,d.bottom,8192,32768),world(0,k.sameRowThreshold,1024,9000),world(0,-8192,8192,0),
        ]) assert.equal(edge.s[k.method](b,d,owner,v),null);
    });

    test(name+' refuses a custom/stale/foreign stage or a drifted asset, transform, role or clip',()=>{
        const {b,owner}=inputs(k);
        const {asset}=owner;
        for(const bad of [
            {honroCustom:true},{honroCustom:undefined},{honroCustom:0},{honroStage:3},{honroStage:7},
            {honroStage:String(k.stage)},{width:b.width+1},{height:b.height+1},
            {honroTerrainBounds:{...b.honroTerrainBounds,bottom:k.edge[1]+1}},
        ]){
            const f=fixture({...b,...bad},[owner]);
            f.render(south(k));assert.equal(extras(f).length,0,JSON.stringify(bad));
        }
        const ownerBad=[
            {id:'other-body'},{kind:'landmark'},{layer:'back'},{depthLayer:'L2'},
            {x:1},{y:-1},{scale:1.1},{rotation:.01},{collisionIds:['not-art']},
            {collisionIds:undefined},{honroElementCollision:true},{honroTerrainMaterialClip:new Clip()}
        ];
        const assetBad=[
            {id:'not-the-registered-paint'},{anchor:{x:1,y:0}},{collision:['body']},{bounds:{...asset.bounds,w:asset.bounds.w+1}},
            {vector:{...asset.vector,viewBox:[...k.bodyBounds.slice(0,3),k.bodyBounds[3]+1]}},
            {vector:{...asset.vector,root:{...asset.vector.root,clipPath:'foreign'}}},
            {params:{...asset.params,previewOnly:k.stage!==6}},
            k.stage===6?{params:{...asset.params,collisionSource:'not-lower-road'}}:
                {params:{...asset.params,bodyTerrainIds:[k.ground,'decoy']}},
        ];
        if(k.stage!==10){
            ownerBad.push({visualRole:'decorative-play'});
            assetBad.push({reference:{bounds:{...asset.bounds,y:asset.bounds.y+1}}});
        }
        if(k.stage===6){
            assetBad.push({params:{...asset.params,prototypeGeometrySha256:'0'.repeat(64)}});
            assetBad.push({vector:{...asset.vector,clips:{...asset.vector.clips,decoy:[outline]}}});
        }
        for(const bad of [...ownerBad,...assetBad.map(v=>({asset:{...asset,...v}}))]){
            const f=fixture(b,[{...owner,...bad}]);
            f.render(south(k));assert.equal(extras(f).length,0,JSON.stringify(bad));
        }
    });
}

test('Stage05 strict waterfall revision flags isolate the lower bank without changing the existing water pass',()=>{
    const k=configs.find(c=>c.stage===5),{b,owner}=inputs(k);
    // Frozen water fixtures stand in for runtime-authored water references.
    // The test observes the renderer passing the same state to surfaceZones;
    // actual waterfall draw, capture and water state proof are separate QA.
    const zones=Object.freeze(['stage5-plunge-pool','stage5-shallow-water','stage5-headwater'].map(id=>Object.freeze({id})));
    const water=Object.freeze({waterfallSight:false});
    const waterBattle=Object.freeze({...b,honroSurfaceZones:zones,honroState:water});
    const neighbor={...owner,id:'stage5-art-water-decoy',asset:{...owner.asset,id:'stage5-dynamic:waterfall-decoy'}};
    const f=fixture(waterBattle,[owner,neighbor]);
    f.render(south(k));
    assert.equal(extras(f).length,2);
    assert(extras(f).every(p=>p.l.id===owner.id));
    assert.equal(f.zones.length,6,'legacy surfaceZones called once per built tile');
    assert(f.zones.every(q=>q.observed===waterBattle&&q.water===zones&&q.observed.honroState===water));
    for(const revision of revisions){
        for(const invalid of [undefined,0,2,true,'1']){
            const altered=Object.freeze({...waterBattle,[revision]:invalid});
            const negative=fixture(altered,[owner,neighbor]);
            negative.render(south(k));
            assert.equal(extras(negative).length,0,revision+': '+String(invalid));
            assert.deepEqual(negative.zones.map(q=>q.tile),f.zones.map(q=>q.tile));
            assert(negative.zones.every(q=>q.observed===altered&&q.water===zones&&q.observed.honroState===water));
        }
    }
});
