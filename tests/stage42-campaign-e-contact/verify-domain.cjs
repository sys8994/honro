const fs=require('fs'),vm=require('vm'),assert=require('assert');
const [root,file]=process.argv.slice(2),d=JSON.parse(fs.readFileSync(file));
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'/shared/map/terrain-domain.js','utf8'),ctx);
const projected=ctx.HonroTerrainDomain.projection({points:d.world,playProjection:{bounds:d.play,start:d.original[0]}}).points;
assert.equal(d.original.length,64);assert.equal(d.world.length,88);
assert.deepStrictEqual(JSON.parse(JSON.stringify(projected)),d.original);
console.log('stock projection: actual world88 -> exact projected64 == original64; no reconstruction');
