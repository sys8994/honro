import test from 'node:test';
import assert from 'node:assert/strict';
import {groundProjection,cameraView,preciseTurnRate,defaultZoom, sweepBox, sweepDisc, slide, steerHeading} from '../src/space.mjs';
import {actorBody,bowPlane,strikeVolume,sweptTorso} from '../src/body.mjs';
import {directions,spriteFrame} from '../src/actors.mjs';

test('screen ground vectors round trip at different aspect and tile sizes', () => {
  for (const sizes of [[96, 92, 46], [60, 64, 32]]) {
    const projection = groundProjection(...sizes);
    for (const [x, y] of [[0, 0], [-491, 1845], [312.17, 140.68]]) {
      const p = projection.forward(x, y), q = projection.inverse(p.x, p.y);
      assert.ok(Math.hypot(q.x - x, q.y - y) < 1e-9);
    }
  }
});
test('camera covers the authored rectangle at each corner and after resizing',()=>{
  for(const [w,h] of [[1180,760],[844,480],[390,844],[2560,1080],[420,1480]]){
    for(const x of [-1e5,0,1920,1e5])for(const y of [-1e5,0,1056,1e5]){
      const camera=cameraView(1920,1056,w,h,.01,x,y);
      assert.equal(camera.min,Math.max(.7*defaultZoom,w/1920,h/1056));
      assert.equal(camera.max,Math.max(1.5*defaultZoom,camera.min));
      assert.ok(camera.x-w/(2*camera.zoom)>=-1e-8 && camera.y-h/(2*camera.zoom)>=-1e-8);
      assert.ok(camera.x+w/(2*camera.zoom)<=1920+1e-8 && camera.y+h/(2*camera.zoom)<=1056+1e-8);
    }
  }
});
test('a fast arrow selects a real first contact and can leave a touched surface', () => {
  const rock = {x: 100, y: 100}, a = {x: 0, y: 100}, z = {x: 1000, y: 100};
  assert.equal(sweepDisc(a, z, rock, 20).x, 80);
  assert.equal(sweepDisc({x: 80, y: 100}, a, rock, 20), null);
  const wall = {x: 140, y: 90, w: 30, h: 30};
  assert.equal(sweepBox(a, z, wall, 3).x, 137);
});
test('diagonal movement keeps its tangent along a bank', () => {
  const wall = {x: 60, y: 0, w: 40, h: 200};
  const result = slide({x: 10, y: 10}, 100, 80, (a,z) => sweepBox(a,z,wall,10));
  assert.ok(Math.abs(result.x-50) < .02 && Math.abs(result.y-90) < .02);
});


test('precision turns cover the same intermediate screen angles at 60 and 120 Hz', () => {
  const projection=groundProjection(180,64,44);
  for(const rate of [60,120]){
    let aim={x:1,y:0};
    for(let t=0;t<rate/4;t++)aim=steerHeading(aim,{x:0,y:-1},projection,preciseTurnRate/rate);
    const v=projection.forward(aim.x,aim.y);
    assert.ok(Math.abs(Math.atan2(-v.y,v.x)-Math.PI*.055)<1e-8);
  }
});

test('painted chests and flying bodies intercept shots independently of foot contacts', () => {
  const projection=groundProjection(180,64,44);
  const foe={id:'bird',side:1,honroType:'bat',x:200,y:500,h:40};
  for(const u of [foe,{...foe,side:0,id:'p-archer'},{...foe,honroType:'boar'}]){
    const body=actorBody(u),q=strikeVolume(u,projection);
    const mapped=projection.forward(0,q.y-(u.y-u.h*.5));
    assert.ok(Math.abs(mapped.y-bowPlane+body.chest)<1e-8);
    assert.ok(Math.abs(projection.forward(q.rx,q.ry).x-body.rx)<1e-8);
    const sweep=y=>sweptTorso({x:q.x-q.rx-10,y},{x:q.x+q.rx+10,y},q,0);
    assert.ok(sweep(q.y));
    assert.equal(sweep(q.y+q.ry+.2),null);
    const footRay=u.y-u.h*.5+projection.inverse(0,bowPlane).y;
    assert.equal(sweep(footRay),null);
  }
});

test('only northeast draw and release use the corrected left bow hand', () => {
  for(const [row,dir] of directions.entries())for(const pose of ['prepare','attack']){
    const f=spriteFrame('seolo',pose,row,0);
    assert.equal(f.flip,false);
    if(dir==='NE'){
      assert.equal(f.image,'seolo-bow-ne');assert.equal(f.col,pose==='attack'?1:0);assert.equal(f.row,0);
    }else {
      assert.equal(f.image,'seolo-bow');assert.equal(f.col,row%4);
      assert.equal(f.row,Math.floor(row/4)+(pose==='attack'?2:0));
    }
  }
});
