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
