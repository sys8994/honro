import test from 'node:test';
import assert from 'node:assert/strict';
import {groundProjection,cameraView, sweepBox, sweepDisc, slide} from '../src/space.mjs';

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
