import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {terrainSpace} from '../src/terrain.mjs';
const map=JSON.parse(fs.readFileSync(new URL('../data/yeonmok.json',import.meta.url)));
const space=terrainSpace(map),cell=map.cell,to=(x,y)=>({x:x*cell,y:y*cell});

test('both authored crossings connect the native opening to the exit',()=>{
  const start=space.point('p-archer'),end=space.point('marker-7');
  for(const bridge of map.objects.filter(o=>o.deck)){
    const endpoints=bridge.deck.points.map(([x,y])=>({x:x*cell/map.tileWidth,y:y*cell/map.tileHeight}));
    const mid=to(bridge.x,bridge.y);
    assert.ok(space.route(start,mid,22).length);
    assert.ok(space.route(mid,end,22).length);
    assert.equal(space.nearest(endpoints[0],endpoints[1],18),null);
    const off={x:mid.x,y:mid.y+bridge.deck.width*cell/map.tileHeight};
    assert.equal(space.legal(off,12),false);assert.equal(space.legal(off,3,true),true);
  }

});
test('water stops feet while arrows cross, and a visible stone stops both',()=>{
  const water=to(15.5,12.5);
  assert.equal(space.legal(water,8),false);assert.equal(space.legal(water,3,true),true);
  const rock=map.objects.find(o=>o.blocksProjectile&&o.blocksMovement&&o.asset==='rock_large'),p=to(rock.x,rock.y);
  const a={x:p.x-rock.radius*cell-8,y:p.y},z={x:p.x+rock.radius*cell+8,y:p.y};
  assert.equal(space.nearest(a,z,3,true).terrain.id,rock.id);
  assert.equal(space.nearest(a,z,8,false).terrain.id,rock.id);
});

test('rendered bridge contacts and span agree with both physical decks', () => {
  const points=JSON.parse(fs.readFileSync(new URL('../editable/structure-landmarks.json',import.meta.url)));
  for(const deck of map.objects.filter(o=>o.deck)){
    const p=points[deck.asset+'/deck'].map(([x,y])=>[
      deck.x*map.tileWidth+x-deck.width*deck.anchor[0],
      deck.y*map.tileHeight+y-deck.height*deck.anchor[1]
    ]);
    for(let i=0;i<2;i++){
      const [x,y]=deck.deck.points[i];
      assert.ok(Math.hypot(x-p[i][0],y-p[i][1])<.02);
    }
    const dx=p[1][0]-p[0][0],dy=p[1][1]-p[0][1];
    const span=Math.abs((p[3][0]-p[2][0])*dy-(p[3][1]-p[2][1])*dx)/Math.hypot(dx,dy);
    assert.ok(Math.abs(span-deck.deck.width)<.02);
  }
  const gate=map.objects.find(o=>o.asset==='ruin_gate');
  const mid=to(gate.x,gate.y);
  assert.ok(space.legal(mid,20));
  for(const polygon of gate.foundations){
    const v=polygon.reduce((p,q)=>[p[0]+q[0]/polygon.length,p[1]+q[1]/polygon.length],[0,0]);
    assert.equal(space.legal({x:v[0]*cell/map.tileWidth,y:v[1]*cell/map.tileHeight},3),false);
  }
});
