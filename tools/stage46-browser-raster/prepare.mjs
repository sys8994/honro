import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const hash=x=>createHash('sha256').update(x).digest('hex');
const blob=x=>createHash('sha1').update(`blob ${x.length}\0`).update(x).digest('hex');
const json=x=>JSON.stringify(x);
const read=p=>JSON.parse(readFileSync(p));
const pathHere=dirname(fileURLToPath(import.meta.url));
export function variants(provider,recipe){
  assert.equal(hash(json(provider)),recipe.originalProviderSHA256);
  const stock=[provider.shaftExterior,...provider.shaftExteriorParts];
  assert.equal(stock.length,6);
  const idx=new Map(recipe.rings.map(a=>[a.slice(0,4).join(':'),a]));
  assert.equal(idx.size,153);
  const keep=new Set(recipe.keep.map(a=>a.join(':')));
  assert.equal(keep.size,17);
  const auth=new Map();
  for(const p of recipe.planes){if(!auth.has(p.leaf))auth.set(p.leaf,[]);auth.get(p.leaf).push(p.path);}
  assert.equal(recipe.planes.length,27);
  const opts={};
  for(const arm of ['A0','E0','E','B']){
    const hits=new Set(),ps=stock.map((orig,k)=>{
      if(k!==3)return orig;
      let j=-1;
      const walk=c=>{
        if(c.tag!=='path')return {...c,children:c.children.map(walk)};
        j++;
        const dk=c.dParts?'dParts':'d',ds=c.dParts??[c.d];
        const out=ds.map((d,i)=>(d.startsWith('M')?['',...d.split(/(?=M)/)]:d.split(/(?=M)/)).map((x,l)=>{
          const id=[k,j,i,l].join(':'),s=idx.get(id);
          if(!s)return x;
          assert(!hits.has(id));hits.add(id);
          assert.equal(hash(x),s[5]); assert.equal(c.fill,s[6]);
          return arm==='A0'||arm==='E0'||(arm==='B'&&keep.has(id))?x:'';
        }).join(''));
        if(arm==='B'&&auth.has(j))out[out.length-1]+=auth.get(j).join('');
        if(arm==='E0'&&recipe.neutralLeaves.includes(j)){
          assert.equal(dk,'d');assert.equal(out[0],c.d);
          const positions=[...c.d.matchAll(/Z\s*(?=M)/g)].map(q=>q.index+q[0].length);
          assert(positions.length>0);
          const i=positions.reduce((a,b)=>Math.abs(b-c.d.length/2)<Math.abs(a-c.d.length/2)?b:a);
          const {d,...props}=c;const dParts=[d.slice(0,i),d.slice(i)];
          assert.equal(dParts.join(''),d);assert(dParts[0].trimEnd().endsWith('Z')&&dParts[1].startsWith('M'));
          return {...props,dParts};
        }
        assert(out.some(s=>s.trim()),'unexpected emptied compound color');
        return {...c,[dk]:dk==='d'?out[0]:out};
      };
      return {...orig,vector:{...orig.vector,root:walk(orig.vector.root)}};
    });
    assert.equal(hits.size,idx.size);
    opts[arm]={...provider,shaftExterior:ps[0],shaftExteriorParts:ps.slice(1)};
    assert.equal(hash(json(opts[arm])),recipe.variantSHA256[arm]);
  }
  assert.equal(json(opts.A0),json(provider));
  return {A:provider,...opts};
}
async function main(){
  const [rootArg,tmpArg]=process.argv.slice(2);
  assert(rootArg&&tmpArg);const root=resolve(rootArg),tmp=resolve(tmpArg),p=read(join(pathHere,'PINS.json')),r=read(join(pathHere,'RECIPE.json'));
  assert.equal(p.enabled,true,'local disabled carrier: review and arm separately');
  const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
  const real=git('rev-list','--parents','-n','1','HEAD').split(' ');
  assert.deepEqual(real,[process.env.GITHUB_SHA,p.head]);
  assert.equal(git('rev-parse',p.head+'^{tree}'),p.tree);
  const delta=execFileSync('git',['-C',root,'diff-tree','--no-renames','--no-commit-id','-r','--name-status','-z','HEAD']).toString('utf8').split('\0');
  assert.equal(delta.pop(),''); const actual=[];
  assert(delta.length>0&&delta.length%2===0);
  for(let i=0;i<delta.length;i+=2){assert.equal(delta[i],'A');actual.push(delta[i+1]);}
  assert.deepEqual(actual.sort(),p.adds.slice().sort());
  assert.equal(git('status','--porcelain=v1','--untracked-files=all'),'');
  const verify=(name,ev)=>{
    const bytes=readFileSync(join(root,name));
    if(ev.bytes!==undefined)assert.equal(bytes.length,ev.bytes,name);
    if(ev.sha256!==undefined)assert.equal(hash(bytes),ev.sha256,name);
    if(ev.git!==undefined)assert.equal(blob(bytes),ev.git,name);
    assert.equal(blob(bytes),git('rev-parse',p.head+':'+name),name);
    return bytes;
  };
  for(const [name,ev] of Object.entries(p.stock))verify(name,ev);
  assert.equal(hash(readFileSync(join(pathHere,'RECIPE.json'))),p.recipeSHA256);
  const desc=read(join(root,p.descriptor)); const contains=(x,y)=>JSON.stringify(x).includes(y);
  for(const q of p.parts)assert(contains(desc,q.path.split('/').pop()),'descriptor missing expected part');
  const packet=Buffer.concat(p.parts.map(q=>verify(q.path,q)));
  assert.equal(packet.length,15250870);assert.equal(hash(packet),p.packetSHA256);
  const {unpackJson}=await import(pathToFileURL(join(root,'shared/json-pool.mjs')).href);
  const lib=unpackJson(JSON.parse(packet));assert.equal(lib.length,1);assert.equal(lib[0].id,'act5:near:46');assert.equal(json(lib[0]).length,16328502);
  const out=variants(lib[0],r);
  const edge=readFileSync(join(root,'shared/runtime/act5-edge-art.js'),'utf8');
  const slice=(a,b)=>edge.slice(edge.indexOf(a),edge.indexOf(b,edge.indexOf(a)+a.length));
  assert.equal(hash(slice('function stage45Body(','// Stage43 contact')),p.painterFunctionSHA256);
  assert.equal(hash(slice(" if(l.asset?.id==='act5:near:46'"," if(l.asset?.id==='act5:near:43'")),p.landmarkBranchSHA256);
  mkdirSync(tmp,{recursive:true});
  writeFileSync(join(tmp,'private-provider.json'),json(lib[0]));
  for(const arm of ['A0','E0','E','B'])writeFileSync(join(tmp,'private-'+arm+'-part3.json'),json(out[arm].shaftExteriorParts[2]));
  // Store only small evidence receipt; provider and variant data are never uploaded.
  const audit={head:p.head,tree:p.tree,scope:'same exact painter and Stage46 provider only, not a full game build',bootPins:Object.keys(p.stock),provider:hash(json(out.A)),variants:r.variantSHA256,packet:p.packetSHA256};
  writeFileSync(join(tmp,'out','SOURCE-IDENTITY.json'),json(audit)+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
