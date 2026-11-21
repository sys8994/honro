"""R2 disposable optimizer recipe re-anchor: exact source optimizer, no skip."""
from copy import deepcopy
import hashlib,json,re,sys,subprocess
from pathlib import Path
from patch import gitsha
from floor_asset import PACKAGE,PACK_BLOB,OUT_BLOB,outer,verify as verify_author
OPTIMIZER='shared/terrain-path-optimization.mjs'
OPT_BLOB='784e574d21cfa668326215fd16dcc0fb6ffcc832'
LEDGER='shared/data/terrain-path-optimization.json'
OLD_LEDGER_BLOB='70399325e30279f10a853835981913c635ba3386'
ASSET_ID='act2-compact:stage15-act2-stage15-traced-outer-v1-1'
OLD='a8fbcefb50966a67dbc026d538102928afdd977ba125ac796ef4a87db70b4af4'
NEW='e43dbde1ac1fde41fc8660609e7f053cbd5a6efee5c566f43a69d002f8e9eb89'
COMPILED_B='840793f15f937b2bbc0114b171163f760a46a5e64d03c06124114947fe3356c8'
COMPILED_NEW='610adfeee72637076be511883551fc545fe7e87f192d3762c14f379e6007c60a'
prefix=['symbols','compact15-source-world','children',0,'children',0,'children']
OLD_PATHS=[prefix+[0],*[prefix+[1,'children',0,'children',i,'children',0] for i in range(3)]]
NEW_PATHS=[*OLD_PATHS[:2],OLD_PATHS[3],prefix+[1,'children',0,'children',3,'children',0]]
VALUE_SHA=[
 '018c47a499fe9684c35cfe564e64cfd15dcb3925798fdae637e6cd234fc468ea',
 'a79c3a32f725672b6d23ebba359efaf1447e31806a0fabe7d7fa7d9c6756bf20',
 'be9a5a81cb8dae13341eecff696fda0483295e191502588a2a590817d8367494',
 '7064adba2d138746b866058edc38a9842116dd1f9fb031784a5654f3a69ca9a9',
]
def sha(data):return hashlib.sha256(data).hexdigest()
def ids_path(rows,path):
    for k in path:rows=rows[k]
    return rows
def floor_kids(v):return ids_path(v,prefix+[1,'children',0,'children'])

def rewrite_recipe(raw):
    # Run the same scanner on the signed JSON input. Find only one top-level
    # row; other ledger bytes and target decoration fields must remain exact.
    text=raw.decode()
    dec=json.JSONDecoder()
    match=re.match(r'\s*\[\s*',text); assert match
    at=match.end(); targets=[]; seen=[]
    while text[at]!=']':
        row,end=dec.raw_decode(text,at)
        assert type(row) is dict and type(row.get('id')) is str
        if row['id']==ASSET_ID:targets.append((at,end,row))
        assert row['id'] not in seen
        seen.append(row['id'])
        at=end
        sep=re.match(r'\s*(,\s*)?',text[at:]);assert sep
        at+=sep.end()
    assert not text[at+1:].strip()
    assert len(targets)==1
    start,end,row=targets[0]
    assert row['original']==OLD and len(row['paths'])==4
    assert {tuple(p) for p,k,v in row['paths']}=={tuple(p)for p in OLD_PATHS}
    for p,k,v in row['paths']:
        want=p; digest=VALUE_SHA[OLD_PATHS.index(p)]
        assert p==want and k=='d' and sha(v.encode())==digest
    token=text[start:end]
    edits=[]
    sig=list(re.finditer(r'"original"\s*:\s*"('+OLD+r')"',token))
    assert len(sig)==1
    edits.append((*sig[0].span(1),NEW))
    for old,new in zip(OLD_PATHS[2:],NEW_PATHS[2:]):
        path_re=r'\[\s*'+r'\s*,\s*'.join(re.escape(json.dumps(k))for k in old)+r'\s*\]'
        m=list(re.finditer(path_re,token))
        assert len(m)==1
        # Third field from the end is the old face index. Preserve the token's
        # whitespace and all other characters instead of re-emitting the row.
        word=list(re.finditer(r'"(?:[^"\\]|\\.)*"|\d+',m[0][0]))
        assert len(word)==len(old) and int(word[-3][0])==old[-3]
        z=word[-3]; at=m[0].start()
        edits.append((at+z.start(),at+z.end(),str(new[-3])))
    replacements=sorted(edits)
    last=0; out=''; undo=[]
    for l,r,new in replacements:
        assert last<=l<r and r-l==len(new)
        out+=token[last:l]+new;undo.append((l,r,token[l:r]));last=r
    out+=token[last:]
    replay=out
    for l,r,x in reversed(undo):replay=replay[:l]+x+replay[r:]
    assert replay==token
    expected=deepcopy(row);expected['original']=NEW
    for r in expected['paths']:r[0]=NEW_PATHS[OLD_PATHS.index(r[0])]
    assert json.loads(out)==expected
    entire=text[:start]+out+text[end:]
    before,after=json.loads(text),json.loads(entire)
    assert len(before)==len(after) and [x if x['id']!=ASSET_ID else expected for x in before]==after
    return entire.encode()

def compiled(root,arm):
    p=(root/OPTIMIZER).read_bytes()
    assert gitsha(p)==OPT_BLOB
    js=r"""
    import fs from 'node:fs';
    import path from 'node:path';
    import {pathToFileURL} from 'node:url';
    import {createHash} from 'node:crypto';
    const [root,optimizer,packagePath,assetId]=process.argv.slice(1);
    const {terrainPathOptimization}=await import(pathToFileURL(path.join(root,optimizer)));
    const pack=JSON.parse(fs.readFileSync(path.join(root,packagePath)));
    const get=()=>pack.assets.find(x=>x.id===assetId).vector;
    const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
    const before=sha(get());
    (await terrainPathOptimization()).apply(pack.assets);
    process.stdout.write(JSON.stringify({before,after:sha(get()),pack}));
    """
    r=json.loads(subprocess.check_output(['node','--input-type=module','-e',js,str(root),OPTIMIZER,PACKAGE,ASSET_ID]))
    assert arm in ('B','V')
    want=(OLD,COMPILED_B) if arm=='B' else (NEW,COMPILED_NEW)
    assert (r['before'],r['after'])==want,(arm,r['before'],r['after'])
    return r

def verify_compiled(B,V,rawV):
    old,v=deepcopy(B),deepcopy(V)
    oot=outer(v)['vector']; ap=outer(rawV)['vector']
    assert floor_kids(oot).pop(1)==floor_kids(ap)[1]
    assert oot['clips'].pop('stage15-local-flooring-paper')==ap['clips']['stage15-local-flooring-paper']
    assert old==v

def check_ledgers(A,B,V):
    raw=(A/LEDGER).read_bytes()
    assert gitsha(raw)==OLD_LEDGER_BLOB and (B/LEDGER).read_bytes()==raw
    target=rewrite_recipe(raw)
    assert (V/LEDGER).read_bytes()==target
    assert (A/OPTIMIZER).read_bytes()==(B/OPTIMIZER).read_bytes()==(V/OPTIMIZER).read_bytes()
    assert gitsha((A/OPTIMIZER).read_bytes())==OPT_BLOB
    return gitsha(target)

if __name__=='__main__':
    A,B,V=map(lambda x:Path(x).resolve(),sys.argv[1:])
    assert len({A,B,V})==3
    raw=(A/LEDGER).read_bytes()
    assert gitsha(raw)==OLD_LEDGER_BLOB and (V/LEDGER).read_bytes()==raw
    assert gitsha((A/PACKAGE).read_bytes())==PACK_BLOB and gitsha((V/PACKAGE).read_bytes())==OUT_BLOB
    auth=json.loads((V/PACKAGE).read_bytes())
    verify_author(json.loads((A/PACKAGE).read_bytes()),auth)
    (V/LEDGER).write_bytes(rewrite_recipe(raw))
    blob=check_ledgers(A,B,V)
    a,b=compiled(B,'B'),compiled(V,'V')
    verify_compiled(a['pack'],b['pack'],auth)
    print(json.dumps({'ledgerBefore':OLD_LEDGER_BLOB,'ledgerAfter':blob,'compilerUnmodified':OPT_BLOB,
      'B_outerCompiledVectorSHA':a['after'],'V4_outerCompiledVectorSHA':b['after'],
      'sameAllFourHistoricalDrawChanges':True,'sameEverySiblingLedgerByte':True,'compiledV4RevertsToExactB':True}))
