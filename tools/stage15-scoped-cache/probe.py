#!/usr/bin/env python3
"""Normal HTTP full builds A/C: exact graph + focused structural cache counts only."""
import argparse, base64, hashlib, json, re
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

HERE=Path(__file__).resolve().parent
READ=lambda p:json.loads(p.read_bytes())
SHA=lambda b:hashlib.sha256(b).hexdigest()
FACT=lambda b: {'bytes':len(b),'sha256':SHA(b)}
SAFE=('ordinary','roof-detail','ground-detail','south')
ARM_LIMIT=32
RUNTIME='web/runtime/ordered-common-15.370f1fb43d3a212f.js'
TRUTH={'A': {'runtime':'3dd35880565c92f2fc1d67342b26fc16951c2d04294cbf695df2a5cdae58075e',
             'compact':'6ea7d13a1e196c9635002cf5ff81aa49f231dcacba68598d7468a37cf6d30c9e'},
       'C': {'runtime':'370f1fb43d3a212f035eabb93ea935aff41d6146fb8c9103c77a1f9c1f07d737',
             'compact':'bac32f73371958fb4bbd6d78269694b2359ad80fa558292c1df1eaad37d28cef'}}
R3_REF='3e47074465f71874228a66cbfaf9cdb51fda4c6b5239a87fea3f5091e1378bcd'

def local_graph(root, arm):
    raw=(root/'web/manifest.json').read_bytes()
    m=json.loads(raw)
    a={it['path']:{x:it[x] for x in ('bytes','sha256')} for it in m['files']}
    assert len(a)==len(m['files'])==809
    def check(p):
        content=(root/p).read_bytes();assert FACT(content)==a[p],p
        return content
    def find(q):
        (p,)=tuple(n for n in a if re.fullmatch(q,n));return p
    runtime=find(r'web/runtime/ordered-common-15\.[a-f0-9]{16}\.js')
    assert (runtime==RUNTIME)==(arm=='C')
    desc=find(r'web/data/HONRO_ACT2_COMPACT_PACKAGES-parts\.[a-f0-9]{16}\.json')
    loader=find(r'web/runtime/HONRO_ACT2_COMPACT_PACKAGES\.[a-f0-9]{16}\.js')
    dat=json.loads(check(desc));assert dat['$honroJsonParts']==1 and len(dat['parts'])==2
    parts=[]
    for it in dat['parts']:
        p=it['path'];rawp=check(p);assert FACT(rawp)=={k:it[k]for k in ('bytes','sha256')};parts.append(rawp)
    joined=b''.join(parts);assert FACT(joined)=={k:dat[k]for k in ('bytes','sha256')}
    assert SHA(joined)==TRUTH[arm]['compact'] and a[runtime]['sha256']==TRUTH[arm]['runtime']
    pack=json.loads(joined);assert sorted(map(int,pack))==list(range(12,21))
    assert pack['15']['mapRevision']==615
    assert runtime in m['common']; assert desc.encode() in check(loader)
    must=[m['gameEntry'],m['project'],runtime,loader,desc,*[x['path']for x in dat['parts']]]
    docs={'HONRO.html':FACT((root/'HONRO.html').read_bytes()),'web/manifest.json':FACT(raw)}
    expected={**docs,**{p:FACT(check(p)) for p in must}}
    return pack,expected,set(must)|{'HONRO.html'},runtime,FACT(joined)

def run(browser,base,root,arm,reference):
    pack,expected,must,runtime,aggregate=local_graph(root,arm)
    allrows=[]
    receipt={'arm':arm,'runtime':{'path':runtime,**expected[runtime]},'activeCompactAggregate':aggregate,'visits':[]}
    for w,h in ((1440,900),(390,844)):
        ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
        page=ctx.new_page(); seen={}; failures=[]
        def obs(resp):
            p=urlsplit(resp.url)
            if f'{p.scheme}://{p.netloc}'!=base.rstrip('/') or p.query or p.fragment: return
            rel=p.path.removeprefix('/')
            if rel in expected:
                try:
                    assert resp.status==200 and FACT(resp.body())==expected[rel],rel
                    seen[rel]={'status':resp.status,**expected[rel]}
                except Exception as err: failures.append(str(err) or rel)
        page.on('response',obs);page.on('pageerror',lambda e:failures.append(str(e)))
        # HTTP graph verification is direct and independently normal; no route interception.
        req=ctx.request.get(base+'web/manifest.json',headers={'Cache-Control':'no-cache','Accept-Encoding':'identity'},max_redirects=0)
        assert req.status==200 and FACT(req.body())==expected['web/manifest.json']
        page.goto(base+'HONRO.html',wait_until='domcontentloaded',timeout=60_000)
        page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&!!window.HonroCampaignLoader",timeout=90_000)
        frames=[]
        for view in SAFE:
            f=next(x for x in reference if x['viewportCSS']==[w,h] and x['view']==view)
            frames.append({k:f[k] for k in ('key','actual','css','backing','DPR','tileKeys','physicsSHA256')})
        out=page.evaluate((HERE/'probe.js').read_text(),{'compact':pack['15'],'frames':frames,'iterations':ARM_LIMIT})
        assert not failures and must<=seen.keys(),(arm,w,failures,sorted(must-seen.keys()))
        state=SHA(out.pop('physicsSignature').encode())
        for row in out['rows']:
            row['frozenPhysicsSHA256']=state
            assert state==row.pop('comparePhysicsSHA256'),(arm,row['key'],'frozen state differs')
            row['warmRawSHA256']=SHA(base64.b64decode(row.pop('rawPNG'),validate=True))
            # Session-bearing key is diagnostic only, not a cross-arm semantic pin.
            for rf in ('cold','stable','last'):row[rf].pop('worldCacheKey')
        receipt['visits'].append({'viewportCSS':[w,h],'observed':seen,'rows':out['rows']})
        allrows.extend(out['rows']);ctx.close()
    return pack,receipt,allrows

def main():
    ps=argparse.ArgumentParser(description=__doc__)
    for arm in ('a','c'):
        ps.add_argument('--'+arm+'-root',required=True,type=Path)
        ps.add_argument('--'+arm+'-url',required=True,help='full-build root HTTP URL, localhost, including optional final slash')
    ps.add_argument('--reference',type=Path,required=True,help='verified R3 compact receipt for exact poses/phase')
    ps.add_argument('--out',type=Path,required=True)
    x=ps.parse_args()
    url=lambda s:s.rstrip('/')+'/'
    assert SHA(x.reference.read_bytes())==R3_REF,'unrecognized exact R3 reference'
    ref=READ(x.reference);assert ref['release']=='2939958cc87407ef60b58720bb6e086b8559031b' and ref['complete'] and ref['stage']==15
    for u in (x.a_url,x.c_url):
        b=urlsplit(url(u));assert b.scheme=='http' and b.hostname in ('127.0.0.1','localhost') and b.path=='/' and b.port and not(b.username or b.password or b.query or b.fragment)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        assert browser.version==ref['browser']=='151.0.7922.34',(browser.version,ref['browser'])
        packA,A,a=run(browser,url(x.a_url),x.a_root,'A',ref['frames'])
        packC,C,c=run(browser,url(x.c_url),x.c_root,'C',ref['frames'])
        browser.close()
    assert len(a)==len(c)==8
    assert {i:v for i,v in packA.items()if i!='15'}=={i:v for i,v in packC.items()if i!='15'}
    assert packA['15']['stage']==packC['15']['stage']
    crit=('key','actual','css','backing','DPR','cold','stable','last','frozenPhysicsSHA256')
    count=('worldBuilds','domainCanvasAllocations','domainTileBuilds')
    comparisons=[]
    for ta,tc in zip(a,c):
        assert all(ta[k]==tc[k] for k in crit),ta['key']
        assert all(ta[phase][k]==tc[phase][k] for phase in ('coldDelta','settleDelta','warmDelta') for k in count),ta['key']
        comparisons.append({'key':ta['key'],'sameCacheDimensionsKeysCountsAndBytes':True,'sameFrozenGameState':True,
                           'bothWarmCacheIdentitiesStable':True,'speedClaim':False})
    x.out.write_text(json.dumps({'scope':'native browser A/C structural cache observation, no performance timing','complete':True,
      'referenceSHA256':SHA(x.reference.read_bytes()),'rawWarmRepeatsPerPose':ARM_LIMIT,'arms':[A,C],'comparison':comparisons},ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':
    try:
        main()
    except Exception as err:
        import sys
        # Preserve previous proofs: do not replace an already existing success.
        if '--out' in sys.argv:
            result=Path(sys.argv[sys.argv.index('--out')+1])
            if not result.exists():result.write_text(json.dumps({'complete':False,'error':str(err),'scope':'structural cache only; no timing'},indent=2)+'\n')
        raise
