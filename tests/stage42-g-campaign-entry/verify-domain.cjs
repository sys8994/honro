const fs=require('fs'),vm=require('vm'),assert=require('assert');
const [root,file]=process.argv.slice(2),d=JSON.parse(fs.readFileSync(file));
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'/shared/map/terrain-domain.js','utf8'),ctx);
assert.equal(d.original.length,76);assert.equal(d.world.length,100);
const projected=ctx.HonroTerrainDomain.projection({points:d.world,playProjection:{bounds:d.play,start:d.original[0]}}).points;
assert.deepStrictEqual(JSON.parse(JSON.stringify(projected)),d.original);
console.log('G actual world100 projects to original76 via stock domain; no reconstructed geography');
