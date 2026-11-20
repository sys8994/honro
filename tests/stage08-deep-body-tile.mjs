// Source dispatch regression only. Real Stage08 ownership/cameras were captured
// by official App QA; this unit test uses a small, independent signed fixture.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';

const renderer=readFileSync(new URL('../shared/runtime/renderer.js',import.meta.url),'utf8');
const placement='act1-stage08-traced-floor-v1', assetId='act1-traced:stage08-floor-v1';
const domain=Object.freeze({left:-6000,top:-24000,right:15600,bottom:29500});
const declared=Object.freeze({x:-4000,y:1800,w:17600,h:6000});
const viewBox=Object.freeze([-4000,1800,17600,6000]);
const outline=['M-6000,3861 L13600,2543.48 L15600,2740 V29500 H-6000 Z'];
const vector={viewBox,root:{tag:'g',clipPath:'canonicalSolid',children:[
    {tag:'g',clipPath:'contactInset',children:[{tag:'path',fill:'#26342b',d:outline[0]}]}
]},clips:{canonicalSolid:outline,contactInset:outline}};
// Registered properties signed by the original Stage08 map and asset leaves.
// The outline is a placeholder; this test never renders it or measures pixels.
const asset={id:assetId,anchor:{x:0,y:0},bounds:declared,reference:{bounds:declared},
    params:{semanticLayer:'BODY',bodyBaseColor:'#26342b',bodyTerrainIds:['s8-ground'],previewOnly:false},vector,collision:[]};
const floor={id:placement,kind:'canonical-element',visualRole:'scenery',layer:'prop',
    asset,x:0,y:0,scale:1,rotation:0,collisionIds:[]};
const sibling=(suffix,bounds)=>({...floor,id:'act1-stage08-traced-'+suffix+'-v1',
    asset:{...asset,id:'act1-traced:stage08-'+suffix+'-v1',bounds}});
const westRoot=sibling('west-root',{x:150,y:2900,w:2900,h:1450});
const shoulders=sibling('shoulders',{x:2950,y:2450,w:3400,h:2250});
const stage8=Object.freeze({honroStage:8,honroCustom:false,width:9600,height:5500,honroTerrainBounds:domain,sceneVersion:0});
const world=(left,top,right,bottom)=>({left,top,right,bottom});

class Clip {
    constructor(){this.boxes=[];}
    rect(...box){this.boxes.push(box);}
}
function context(){
    return {matrix:{a:1,d:1,e:0,f:0},saved:[],materialClip:null,
        setTransform(a,b,c,d,e,f){this.matrix={a,d,e,f};},
        getTransform(){return this.matrix;},
        save(){this.saved.push([this.matrix,this.materialClip]);},
        restore(){[this.matrix,this.materialClip]=this.saved.pop();},
        beginPath(){},rect(){},clip(path){this.materialClip=path;},drawImage(){}
    };
}
function fixture(b=stage8, placements=[westRoot,floor,shoulders], scale=390/6800){
    const allocated=[],paints=[];
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
    const s=Object.assign(Object.create(r.HonroScene.prototype),{battle:b,scale,_cacheStats:{worldBuilds:0,worldHits:0,worldBuildMs:0}});
    s.landmark=(c,l)=>{
        const m=c.getTransform();
        paints.push({id:l.id,original:placements.includes(l),asset:l.asset,left:(2-m.e)/m.a,top:(2-m.f)/m.d,clip:c.materialClip});
    };
    const render=(view,w=390,h=648)=>{s.view=view;s._drawTerrainDomainTiles(context(),b,w,h);};
    return {s,b,allocated,paints,render};
}
const extras=f=>f.paints.filter(p=>!p.original);
const clipBox=[-6000,-24000,21600,53500];
const columns={
    center:[1400,8200,[0,8192]],
    west:[-3720,3080,[-8192,0]],
    east:[6520,13320,[0,8192]],
};
const yPoses=[[-2895.8253205128203,8395.82532051282],[94.17467948717967,11385.82532051282]];

test('six actual Stage08 mobile poses add two signed BODY tile draws each without changing culling metadata or cache sizing',()=>{
    const assetBefore=JSON.stringify(asset),floorBefore=JSON.stringify(floor),bBefore=JSON.stringify(stage8);
    for(const [left,right,xs] of Object.values(columns))for(const [top,bottom] of yPoses){
        const f=fixture();
        assert.equal(f.s._worldRasterScale(stage8,390),.0625);
        assert.deepEqual({...f.s._landmarkPaintBounds(floor)},world(-4000,1800,13600,7800));
        assert.equal(f.s._landmarkVisible(floor,world(0,0,8192,8192)),true);
        assert.equal(f.s._landmarkVisible(floor,world(0,8192,8192,16384)),false);
        f.render(world(left,top,right,bottom));
        const signed=extras(f);
        assert.deepEqual(signed.map(q=>[q.left,q.top,q.id,q.clip?.boxes]),xs.map(x=>[x,8192,placement,[clipBox]]));
        assert(signed.every(q=>q.asset===asset),'supplement refers to the original asset');
        assert.equal(f.s._domainTiles.tiles.size,(Math.floor(bottom/8192)-Math.floor(top/8192)+1)*2);
        assert(f.allocated.every(c=>c.width===516&&c.height===516),'unchanged tile and gutter dimensions');
        const cold=[f.paints.length,f.allocated.length];
        f.render(world(left,top,right,bottom));f.render(world(left,top,right,bottom));
        assert.deepEqual([f.paints.length,f.allocated.length],cold,'warm tile hits do not repaint or allocate');
    }
    assert.equal(JSON.stringify(asset),assetBefore);assert.equal(JSON.stringify(floor),floorBefore);
    assert.equal(JSON.stringify(stage8),bBefore);assert.equal(floor.honroTerrainMaterialClip,undefined);
});

test('normal upper coverage, alternate owners, and normal legacy-first ordering are retained',()=>{
    const upper=fixture();
    upper.render(world(1400,-7445.82532051282,8200,3845.8253205128203));
    assert.equal(extras(upper).length,0);
    assert.deepEqual(upper.paints.filter(q=>q.top===0&&q.left===0).map(q=>[q.id,q.original,q.clip]),
        [[westRoot.id,true,null],[placement,true,null],[shoulders.id,true,null]]);
    const others=fixture(stage8,[westRoot,shoulders]);
    others.render(world(1400,94,8200,11386));
    assert.equal(extras(others).length,0);
    assert(others.paints.some(q=>q.id===westRoot.id));
});

test('already visible deep legacy props retain their original draw and list order',()=>{
    // A different already visible prop in the signed lane still draws normally
    // and remains in list order after the new floor supplement.
    const deepLegacy=sibling('not-floor',{x:0,y:8400,w:395,h:625});
    const sameTile=fixture(stage8,[westRoot,floor,deepLegacy]);
    sameTile.render(world(1400,94,8200,11386));
    assert.deepEqual(sameTile.paints.filter(q=>q.left===0&&q.top===8192).map(q=>[q.id,q.original]),
        [[placement,false],[deepLegacy.id,true]]);
});

test('partial outer tiles intersect unchanged domain; no supplement on upper or touching-outside tiles',()=>{
    const f=fixture();
    f.render(world(-7000,26000,20000,29600));
    assert.deepEqual(extras(f).map(p=>[p.left,p.top,p.clip?.boxes]),
        [-8192,0,8192].map(x=>[x,24576,[clipBox]]));
    for(const bad of [
        world(-8192,8192,-6000,16384),world(15600,8192,16384,16384),
        world(0,29500,8192,32768),world(0,7936,1024,8960),world(0,-8192,8192,0),
    ])assert.equal(f.s._stage8DeepBodyTileLandmark(stage8,domain,floor,bad),null);
});

test('custom, stale domain, neighbouring stages and differently declared owners fail closed',()=>{
    const south=world(1400,94,8200,11386);
    for(const v of [
        {honroCustom:true},{honroCustom:undefined},{honroStage:7},{honroStage:9},{honroStage:10},
        {width:9601},{height:5501},{honroTerrainBounds:{...domain,bottom:29501}},
    ]){
        const f=fixture({...stage8,...v});f.render(south);
        assert.equal(extras(f).length,0,Object.keys(v).join());
    }
    for(const v of [
        {id:westRoot.id},{kind:'landmark'},{layer:'front'},{visualRole:'gameplay'},
        {x:1},{scale:1.1},{rotation:.01},{collisionIds:['unexpected']},
        {honroElementCollision:true},{honroTerrainMaterialClip:new Clip()},
        {asset:{...asset,id:shoulders.asset.id}},{asset:{...asset,anchor:{x:0,y:1}}},
        {asset:{...asset,reference:{bounds:{...declared,w:17599}}}},
        {asset:{...asset,params:{...asset.params,bodyTerrainIds:['s8-ground','decoy']}}},
        {asset:{...asset,params:{...asset.params,previewOnly:true}}},
        {asset:{...asset,vector:{...vector,viewBox:[-4000,1800,17600,6001]}}},
        {asset:{...asset,vector:{...vector,root:{...vector.root,clipPath:'different'}}}},
    ]){
        const f=fixture(stage8,[{...floor,...v}]);f.render(south);
        assert.equal(extras(f).length,0,Object.keys(v).join());
    }
});
