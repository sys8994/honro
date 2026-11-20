// Source regression only, no browser, assets/physics writes or full Scene equivalence.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const approvedBody=JSON.parse(read('../shared/data/act1/stage02-body-candidate.json'));
const approvedRear=JSON.parse(read('../shared/data/act1/stage02-rear-candidate.json'));
const domain=Object.freeze({left:-6000,top:-24000,right:10300,bottom:27300});
const pose=(asset,id,layer)=>({kind:'canonical-element',id,asset,layer,x:0,y:0,scale:1,rotation:0,collisionIds:[]});
const body=pose(approvedBody,'act1-stage02-traced-body','front');
const rear=pose(approvedRear,'act1-stage02-traced-rear','back');
const world=(left,top,right,bottom)=>({left,top,right,bottom});
const battle={honroStage:2,honroCustom:false,width:4300,height:3300,honroTerrainBounds:domain,sceneVersion:0};
const stockUpper=world(-1250,0,5550,8180);
const stockSouth=world(-1250,-2106,5550,9186); // official mobile south intersects two x-columns.

class Clip {
    constructor(){this.boxes=[];}
    rect(...box){this.boxes.push(box);}
}
function context(){
    return {matrix:{a:1,d:1,e:0,f:0},saved:[],clipPath:null,draws:0,
        setTransform(a,b,c,d,e,f){this.matrix={a,d,e,f};},
        getTransform(){return this.matrix;},
        save(){this.saved.push([this.matrix,this.clipPath]);},
        restore(){[this.matrix,this.clipPath]=this.saved.pop();},
        beginPath(){},rect(){},
        clip(path){this.clipPath=path;},
        drawImage(){this.draws++;}
    };
}
function fixture(b=battle,placements=[rear,body]){
    const sizes=[],paints=[];
    const r={
        HONRO_CONTENT:{},performance:{now:()=>0},Path2D:Clip,
        HonroTerrainDomain:{active:()=>true,materialLandmarks:()=>placements,render:()=>[]},
        HonroBounds:{viewport:s=>s.view},
        HonroGeometry:{transformPoint:({x,y},a,l)=>({x:x-(a.anchor?.x||0)+l.x,y:y-(a.anchor?.y||0)+l.y})},
        document:{createElement(tag){
            assert.equal(tag,'canvas');
            const c=context(), cv={getContext:()=>c};
            sizes.push(cv);
            return cv;
        }}
    };
    runInNewContext(read('../shared/runtime/renderer.js'),r);
    const s=Object.assign(Object.create(r.HonroScene.prototype),{battle:b,scale:390/6800,_cacheStats:{worldBuilds:0,worldHits:0,worldBuildMs:0}});
    s.landmark=(c,l)=>paints.push({id:l.id,original:placements.includes(l),top:(2-c.getTransform().f)/c.getTransform().d,clip:c.clipPath||null});
    const render=view=>{s.view=view;s._drawTerrainDomainTiles(context(),b,390,648);};
    return {s,b,sizes,paints,render};
}
const clips=(f)=>f.paints.filter(p=>!p.original);
const expectedClip=[-6000,-207.25,16300,27507.25];

test('registered canyon BODY underfill supplements only the two formerly missing southern tiles',()=>{
    const f=fixture(),assetBefore=JSON.stringify(approvedBody),bBefore=JSON.stringify(battle);
    assert.equal(f.s._landmarkVisible(body,world(0,0,8192,8192)),true);
    assert.equal(f.s._landmarkVisible(body,world(0,8192,8192,16384)),false);
    assert.equal(f.s._worldRasterScale(battle,390),.0625);
    f.render(stockUpper);
    assert.equal(clips(f).length,0);
    assert.deepEqual(f.paints.map(p=>[p.id,p.top]),[ [rear.id,0],[body.id,0],[rear.id,0],[body.id,0] ]);
    const original=f.paints.slice();
    f.render(stockSouth);
    assert.deepEqual(f.paints.slice(0,original.length),original);
    assert.equal(f.paints.filter(p=>p.top===8192).length,2);
    assert.deepEqual(clips(f).map(p=>[p.id,p.top,p.clip.boxes]),Array.from({length:2},()=>[body.id,8192,[expectedClip]]));
    assert.equal(f.s._domainTiles.tiles.size,6);
    assert(f.sizes.every(c=>c.width===516&&c.height===516));
    const cold=[f.paints.length,f.sizes.length];
    f.render(stockSouth);f.render(stockSouth);
    assert.deepEqual([f.paints.length,f.sizes.length],cold,'warm tile hits do not repaint or allocate');
    assert.equal(JSON.stringify(approvedBody),assetBefore);assert.equal(JSON.stringify(battle),bBefore);
    assert.equal(body.honroTerrainMaterialClip,undefined);
});

test('last partial row is strictly clipped to unchanged signed domain',()=>{
    const f=fixture();
    f.render(world(-6500,26000,2000,29600));
    const impacts=clips(f);
    assert(impacts.length>0);
    for(const p of impacts)assert.deepEqual([p.id,p.top,p.clip.boxes],[body.id,24576,[expectedClip]]);
    for(const bad of [world(-8192,8192,-6000,16384),world(10300,8192,16384,16384),world(0,27300,8192,32768),world(0,-8192,8192,0)]){
        assert.equal(f.s._stage2DeepBodyTileLandmark(battle,domain,body,bad),null);
    }
});

test('custom, missing type, unrelated stages and stale placements fail closed',()=>{
    for(const change of [{honroCustom:true},{honroCustom:undefined},{honroStage:1},{honroStage:3},{width:4301},{honroTerrainBounds:{...domain,bottom:27301}}]){
        const f=fixture({...battle,...change});f.render(stockSouth);assert.equal(clips(f).length,0,JSON.stringify(change));
    }
    for(const change of [
        {id:'stale'}, {kind:'landmark'}, {layer:'prop'}, {x:1}, {rotation:.01},
        {collisionIds:['test-only']}, {honroTerrainMaterialClip:new Clip()},
        {asset:{...approvedBody,bounds:{...approvedBody.bounds,h:4501}}},
        {asset:{...approvedBody,vector:{...approvedBody.vector,viewBox:[0,0,12300,4500]}}},
        {asset:{...approvedBody,anchor:{x:1,y:0}}},
        {asset:{...approvedBody,params:{...approvedBody.params,previewOnly:true}}}
    ]){
        const f=fixture(battle,[rear,{...body,...change}]);f.render(stockSouth);assert.equal(clips(f).length,0,Object.keys(change).join());
    }
});
