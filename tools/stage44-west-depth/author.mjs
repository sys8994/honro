import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const dir=path.dirname(new URL(import.meta.url).pathname), bytes=f=>fs.readFileSync(f),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),blob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const cfg=JSON.parse(bytes(path.join(dir,'PINS.json')));
const assetPath='shared/assets/environment/act5/stage44-west-depth-r9.json',p0='shared/build.mjs',p1='shared/runtime/act5-edge-art.js';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,a);const q=s.replace(a,b);assert.equal(q.replace(b,a),s);return q;};
const r=process.argv[2];const asset=bytes(path.join(dir,'asset.json')), helper=bytes(path.join(dir,'adapter.js'));
assert.equal(sha(asset),cfg.new.sourceAssetSHA256);assert.equal(sha(helper),cfg.new.helperSHA256);
const a=JSON.parse(asset);
assert(a.id==='act5:stage44:west-buttress-r9'&&!a.collision.length&&!a.sockets.length);
assert.equal(a.vector.root.children.length,14);assert.equal(a.vector.root.clipPath,'r9-shared-envelope');assert.equal(a.vector.clips['r9-shared-envelope'].length,1);
const src0=bytes(path.join(r,p0)),src1=bytes(path.join(r,p1));
assert.equal(blob(src0),cfg.stock.buildGit);assert.equal(blob(src1),cfg.stock.edgeGit);
assert(!fs.existsSync(path.join(r,assetPath)));
const out0=once(src0.toString(),"    await file('shared/runtime/act5-edge-art.js');",
String.raw`    // This is render-only artwork, not a campaign provider.  In-progress
    // battles reference the complete canonical Stage 44 provider by signature.
    const westDepth=JSON.parse(await read('shared/assets/environment/act5/stage44-west-depth-r9.json'));
    code('shared/runtime/act5-edge-art.js', '((stage44WestDepthVisual)=>{\n'+
      await read('shared/runtime/act5-edge-art.js')+'\n})('+JSON.stringify(westDepth)+');');`);
const j='const domainPaint=S._drawTerrainDomainTiles;\nS._drawTerrainDomainTiles=function(c,b,w,h){';
const out1=once(src1.toString(),j,helper.toString()+"\nconst westDepthR9=prepareR9(G,typeof stage44WestDepthVisual==='undefined'?null:stage44WestDepthVisual);\n"+j+'\n westDepthR9.underlay(this,c,b,w,h);');
const pins={[p0]:blob(Buffer.from(out0)),[p1]:blob(Buffer.from(out1)),[assetPath]:blob(asset)};
assert.deepEqual(pins,cfg.new.sourceGit);
for(const [f,v]of [[p0,out0],[p1,out1],[assetPath,asset]])fs.writeFileSync(path.join(r,f),v);
console.log(JSON.stringify({pureRenderSidecar:true,sourceChange:pins,noCanonicalProviderChanges:true}));
