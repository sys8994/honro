"""Stage42 HOLD diagnostic. Never writes the git repo, runs a server or contacts a remote."""
import argparse, base64, copy, hashlib, io, json, mimetypes, re, subprocess, traceback
from pathlib import Path
from urllib.parse import urlsplit

HERE=Path(__file__).resolve().parent
sha=lambda raw:hashlib.sha256(raw).hexdigest()
canon=lambda v:json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
PRAW=(HERE/'pins.json').read_bytes()
assert sha(PRAW)=='bcb5067ed39f60e0b9ed222b624745d3eb6465cb9f33368569d633f0927d9b7c'
P=json.loads(PRAW)
REV='2939958cc87407ef60b58720bb6e086b8559031b'
OWNER='web/data/chapter-42-assets.396ec98508d5b8c8.json'
MAP='web/data/chapter-42.0802015e8ba99d11.json'
CAMPAIGN='web/data/campaign.fa9a5e8d3cb0a7e5.json'
ENTRY='web/entries/game.3e9d3e271f161125.js'
MAN='web/manifest.json'
SHELL='HONRO.html'
BASE='http://127.0.0.1:49242/'
AID='act5:near:42'
K=6500/2022
BROWSER='151.0.7922.34'
PROTECTED=('edgeWall','edgeSurface','params','bounds','anchor')
MEDIA=re.compile(r'assets/bgm/(?:main|battle-[123])\.mp3')
def save(p,data):p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def blob(b):return hashlib.sha1(('blob %s\0'%len(b)).encode()+b).hexdigest()

def validate(path,raw):
    row=P['filePins'][path]
    assert len(raw)==row['bytes'] and sha(raw)==row['sha256'],path
    assert 'gitBlob' not in row or blob(raw)==row['gitBlob'],path
    return raw

def leaves(asset):return asset['vector']['root']['children'][0]['children']
def protected(a):
    return {**{k:a[k] for k in PROTECTED},'allVectorClips':a['vector']['clips'],
          'originalPropsB':a['vector']['root']['children'][1]}

def derive(raw):
    # Input is the exact pinned, unsplit plain JSON Stage42 library; NOT a manifest part.
    validate(OWNER,raw); stock=json.loads(raw)
    assert isinstance(stock,list) and [x['id'] for x in stock]==[AID]
    ar=stock[0]; ls=leaves(ar)
    assert len(ls)==16 and ar['params']['sourceSha256']==P['sourceOrigin']
    assert ar['vector']['root']['children'][0]['clipPath']=='a'
    assert sha(ar['vector']['clips']['a'][0].encode())==P['clipA']
    assert {k:sha(canon(v)) for k,v in protected(ar).items()}==P['protected']
    assert len(P['patch'])==14 and sum(len(x[3]) for x in P['patch'])==987 and sum(len(x[4]) for x in P['patch'])==432
    source=raw; expected=copy.deepcopy(stock)
    for i,old_hash,new_hash,drops,hooks in P['patch']:
        old=ls[i]['d']; assert sha(old.encode())==old_hash
        rings=re.findall(r'[Mm][^Mm]*',old); assert ''.join(rings)==old
        missing=dict(drops); markers=dict(hooks)
        assert len(missing)==len(drops) and len(markers)==len(hooks)
        assert all(0<=j<len(rings) and sha(rings[j].encode())==h for j,h in missing.items())
        assert all(0<j<len(rings) and j not in missing and j-1 in missing and rings[j][0]=='m' and
                   re.fullmatch(r'M-?[0-9]+(?:\.[0-9]+)? -?[0-9]+(?:\.[0-9]+)?',m) for j,m in markers.items())
        new=''.join(markers.get(j,'')+r for j,r in enumerate(rings) if j not in missing)
        assert sha(new.encode())==new_hash,(i,new_hash)
        before=canon(old);after=canon(new)
        assert source.count(before)==1
        source=source.replace(before,after,1)
        leaves(expected[0])[i]['d']=new
    assert (len(source),sha(source))==(P['derivedBytes'],P['derived'])
    assert json.loads(source)==expected
    undo=source
    for i,*_ in reversed(P['patch']):
        before=canon(leaves(expected[0])[i]['d'])
        after=canon(ls[i]['d'])
        assert undo.count(before)==1
        undo=undo.replace(before,after,1)
    assert undo==raw
    return source

def graph(man_raw, campaign_raw, stage_raw):
    validate(MAN,man_raw);validate(CAMPAIGN,campaign_raw);validate(MAP,stage_raw)
    m=json.loads(man_raw); c=json.loads(campaign_raw);s=json.loads(stage_raw)
    active={row['path']:row for row in m['files']}
    assert len(active)==len(m['files'])
    assert m['project']==CAMPAIGN and m['gameEntry']==ENTRY
    for key,row in P['filePins'].items():
        if key.startswith('web/') and key!=MAN:
            assert key in active and all(active[key][k]==row[k] for k in ('bytes','sha256')),key
    ix=[i for i,row in enumerate(c['catalog']) if row['metadata']['stageId']==42]
    assert ix==[41] and c['stages'][41]==MAP and c['stageLibraries'][41]==OWNER
    assert [i for i,rel in enumerate(c['stageLibraries']) if rel==OWNER]==[41]
    assert c['assetEncodings']['stageLibraries'][41]=='json' and c['assetPaths']['stageLibraries'][41]==[]
    assert [x for x in s['elements'] if x['id']=='a5-near']==[{'id':'a5-near','assetId':AID,'x':0,'y':0,
      'scale':K,'rotation':0,'layer':'structural-back','depthLayer':'L1','visualRole':'scenery'}]
    return active,c

def src(repo):
    def cmd(*args):return subprocess.check_output(['git','--no-replace-objects','-C',str(repo),*args])
    assert cmd('rev-parse',REV+'^{commit}').decode().strip()==REV
    cache={}
    def get(path):
        if path not in cache:
            assert re.fullmatch(r'[a-zA-Z0-9_.-]+(?:/[a-zA-Z0-9_.-]+)*',path) and not {'.','..'}.intersection(path.split('/'))
            cache[path]=cmd('show',REV+':'+path)
        return cache[path]
    for path in P['filePins']:validate(path,get(path))
    return get

ENTRY_JS="""async()=>{
 const a=HonroApp;
 if(a.engine?.b?.honroStage===42||HonroCampaignLoader.has(42))throw Error('Not an empty pre-entry context');
 a.frame=()=>{};
 a.profile.settings.music=false;a.profile.settings.sound=false;
 await HonroCampaignLoader.ensureStage(42);
 for(let n=1;n<42;n++)a.profile.cleared[n]=true;
 for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(42).entryLevel);
 a.launch(42);
 if(a.engine?.b?.honroStage!==42)throw Error('No canonical campaign launch');
 for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
 if(a.dialogue)throw Error('Entry dialogue did not close');
 a.close();HonroStoryFraming.clear(a.scene);
}"""
OWNER_JS="""async()=>{
 const b=HonroApp.engine.b,st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===42);
 const asset=HONRO_PROJECT.library.filter(x=>x.id==='act5:near:42');
 const land=HonroTerrainDomain.materialLandmarks(b).filter(x=>x.asset?.id==='act5:near:42');
 if(!st||st.id!=='stage-42'||b.honroStage!==42||b.honroCustom!==false||!b.honroCanonical||
    asset.length!==1||land.length!==1||land[0].asset!==asset[0])throw Error('Noncanonical painter owner');
 const l=land[0],a=asset[0];
 if(l.id!=='a5-near'||l.kind!=='canonical-element'||l.x!==0||l.y!==0||l.scale!==6500/2022||l.rotation||l.layer!=='structural-back')throw Error('Canonical placement changed');
 const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
 const fields={edgeWall:a.edgeWall,edgeSurface:a.edgeSurface,params:a.params,bounds:a.bounds,anchor:a.anchor,
  allVectorClips:a.vector.clips,originalPropsB:a.vector.root.children[1]};
 return {placement:{x:l.x,y:l.y,scale:l.scale,rotation:l.rotation??0,layer:l.layer},
    provenance:a.params.sourceSha256,clipA:await digest(a.vector.clips.a[0]),
    d:await Promise.all(a.vector.root.children[0].children.map(z=>digest(z.d))),
    protected:Object.fromEntries(await Promise.all(Object.entries(fields).map(async([k,v])=>[k,await digest(JSON.stringify(v))])))};
}"""
FRAME_JS="""q=>{
 const a=HonroApp,s=a.scene,b=a.engine.b;
 const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===42);
 if(!st||b.honroStage!==42||b.honroCustom!==false||!b.honroCanonical||b.round!==1||b.phase!=='aim')throw Error('Not first-turn canonical Stage42');
 const rect=s.canvas.getBoundingClientRect(),size={w:rect.width,h:rect.height};
 const min=HonroBounds.zoomLimits(rect.width).min;
 const requested={x:q.x??st.width/2,y:q.y??st.height/2,scale:q.z??min};
 HonroStoryFraming.clear(s);
 Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...requested});
 HonroBounds.constrain(s,b);
 const state=()=>JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,
   objectives:st.objectives,placements:st.elements,projectiles:b.projectiles,phase:b.phase,round:b.round,
   play:b.honroBounds,domain:b.honroTerrainBounds});
 const signature=state();
 s.render(a.engine,0,'',.6,false,0);
 s.render(a.engine,0,'',.6,false,0);
 if(state()!==signature||s.time!==2)throw Error('Scene changed parked physics or time');
 const actual={x:s.x,y:s.y,scale:s.scale},view=HonroBounds.viewport(s,size.w,size.h);
 const d=s._pixelRatio(size.w,size.h,b);
 const target=q.z==null?null:[5625,1318,5675,1330];
 if(target&&!(view.left<target[0]&&view.top<target[1]&&view.right>target[2]&&view.bottom>target[3]))throw Error('East diagnostic rectangle out of view');
 if(q.z!=null&&Math.abs(actual.scale-q.z)>1e-9)throw Error('East target zoom clamped');
 return {signature,requested,actual,viewport:view,css:size,backing:[s.canvas.width,s.canvas.height],
         stage:st.id,actorCount:b.units.length,round:b.round,phase:b.phase,t:2,d};
}"""
IMG_OBSERVER="""window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});"""
DECODE="""async()=>{await document.fonts.ready;const live=window.__qaImages.filter(i=>i.src);
 await Promise.all(live.map(i=>i.decode()));return live.filter(i=>!i.complete||!i.naturalWidth).length;}"""
RAW="""()=>document.getElementById('battlecanvas').toDataURL('image/png').split(',')[1]"""
SCOPES=[('max-centre',{}),('max-southwest',{'x':-1e6,'y':1e6}),
        ('max-southeast-skyway',{'x':1e6,'y':1e6})]
EAST=[('east-play',{'x':5650,'y':1321,'z':.55}),('east-near',{'x':5650,'y':1321,'z':.94})]

def capture(pw, get, active, campaign, stock, derived, out):
    from PIL import Image
    rebuilt=json.loads(derived)[0]
    packets={'A':stock,'B':derived}
    browser=pw.chromium.launch(headless=True,args=['--host-resolver-rules=MAP * ~NOTFOUND','--disable-background-networking'])
    assert browser.version==BROWSER,(browser.version,BROWSER)
    required={SHELL,ENTRY,MAP,OWNER,CAMPAIGN,campaign['base'],campaign['shared'],
      *(f for f in P['filePins'] if f.startswith('web/runtime/'))}
    results={}
    try:
      for w,h in [(1440,900),(390,844)]:
       for arm in (('A','B') if w==1440 else ('B','A')):
        target=out/arm/f'{w}x{h}';target.mkdir(parents=True)
        receipt={'scope':'Pinned checkout app, no upstream requests or user save; stationary synthetic campaign entry/camera only',
                 'arm':arm,'browser':browser.version,'release':REV,'frames':{},'responses':{},'errors':[],'complete':False}
        def flush():save(target/'proof.json',receipt)
        ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
        assert ctx.storage_state()=={'cookies':[],'origins':[]}
        page=ctx.new_page()
        actual={}
        def track(msg):
            u=urlsplit(msg.url)
            if (u.scheme,u.netloc)!=('http','127.0.0.1:49242'):return
            if msg.status==200 and msg.request.method=='GET':
                actual[u.path.lstrip('/')]=msg
            else:receipt['errors'].append(['response mismatch',msg.status,msg.request.method,msg.url])
        page.on('response',track)
        def body(path):
            b=get(path)
            if path in active:
                assert len(b)==active[path]['bytes'] and sha(b)==active[path]['sha256'],path
            if path in P['filePins']:validate(path,b)
            return b
        def pump(route):
            r=route.request
            try:
                u=urlsplit(r.url);path=u.path.lstrip('/')
                assert u.scheme=='http' and u.netloc=='127.0.0.1:49242' and not u.query and not u.fragment,r.url
                assert r.method in ('GET','HEAD') and (path in active or path in (SHELL,MAN) or MEDIA.fullmatch(path)),(r.method,path)
                original=body(path)
                payload=packets[arm] if path==OWNER else original
                if path==OWNER:assert original==stock and r.method=='GET'
                mime='text/javascript' if path.endswith('.js') else mimetypes.guess_type(path)[0]
                assert mime,path
                ent=receipt['responses'].setdefault(path,{'sha256':sha(payload),'bytes':len(payload),'methods':[]})
                ent['methods'].append(r.method)
                # No pass-through. A serves literal 2939958 blob; B differs only at the one Stage42 GET.
                route.fulfill(status=200,headers={'Content-Type':mime,'Content-Length':str(len(payload)),
                                                'Cache-Control':'no-store'},body=payload if r.method=='GET' else b'')
            except Exception as error:
                receipt['errors'].append(['fixture route denied',r.method,r.url,str(error)])
                route.abort()
        ctx.route('**/*',pump)
        page.on('pageerror',lambda error:receipt['errors'].append(['pageerror',str(error)]))
        page.add_init_script(IMG_OBSERVER)
        try:
            res=page.goto(BASE+SHELL,wait_until='domcontentloaded',timeout=50000)
            assert res and res.status==200 and res.body()==get(SHELL)
            page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader",timeout=90000)
            page.evaluate(ENTRY_JS)
            selector=page.locator('#battlecanvas');selector.wait_for(state='visible')
            page.wait_for_timeout(1500)
            page.evaluate("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);if(document.getElementById('turn-banner')?.hidden===false)throw Error('First-turn banner still visible');}")
            owner=page.evaluate(OWNER_JS);receipt['owner']=owner
            expect=json.loads(stock)[0] if arm=='A' else rebuilt
            assert owner['d']==[sha(z['d'].encode()) for z in leaves(expect)]
            # Python/JS JSON number spelling can differ. Check protected bytes structurally before delivery;
            # live JS hashes must also be identical between successfully captured arms.
            assert owner['clipA']==P['clipA'] and owner['provenance']==P['sourceOrigin']
            for name,q in SCOPES+(EAST if w==1440 else []):
                first=page.evaluate(FRAME_JS,q)
                assert page.evaluate(DECODE)==0
                frame=page.evaluate(FRAME_JS,q);assert frame==first,(name,'pose not stable after decode')
                raw=base64.b64decode(page.evaluate(RAW),validate=True)
                css=selector.screenshot(animations='disabled')
                assert page.evaluate(FRAME_JS,q)==frame
                repeated=base64.b64decode(page.evaluate(RAW),validate=True)
                def raster(by):
                    with Image.open(io.BytesIO(by)) as im:
                        return im.convert('RGBA').tobytes(),im.size
                raw_raster,raw_size=raster(raw)
                assert raw_size==tuple(frame['backing']) and frame['d']==1
                assert (raw_raster,raw_size)==raster(repeated),(arm,w,name,'repeat is not stable')
                (target/(name+'-raw.png')).write_bytes(raw);(target/(name+'-css.png')).write_bytes(css)
                frame.update(physicsSHA256=sha(frame.pop('signature').encode()),rawSHA=sha(raw),
                             cssSHA=sha(css),cssPNG=list(raster(css)[1]))
                receipt['frames'][name]=frame;flush()
            assert required<=set(receipt['responses']),(required-set(receipt['responses']))
            assert receipt['responses'][OWNER]['methods']==['GET']
            assert required<=set(actual),(required-set(actual))
            # Browser receipt verifies actual response bytes, not only the scheduled route payload.
            for path in sorted(required):
                got=actual[path].body(); req=receipt['responses'][path]
                assert (len(got),sha(got))==(req['bytes'],req['sha256']),path
            assert not receipt['errors'],receipt['errors']
            receipt['complete']=True
            results[(arm,w,h)]=receipt
        except Exception:
            receipt['errors'].append(['capture failure',traceback.format_exc()])
            results[(arm,w,h)]=receipt
        finally:
            flush();ctx.close()
    finally:browser.close()
    return results

def compare(out, results):
    import numpy as np
    from PIL import Image
    from itertools import islice
    result={'release':REV,'staticPriorWitness':P['staticWitness'],'frames':[],
            'gate':'0 differing RGBA pixels, whole canvas (raw + CSS); required pose, physics and asset graph parity.',
            'disposition':'HOLD regardless of diagnostic outcome'}
    receipt=out/'comparison.json'
    matched=True
    try:
      for w,h in [(1440,900),(390,844)]:
        a,b=(results[(arm,w,h)] for arm in ('A','B'))
        assert a['complete'] and b['complete']
        old_graph,new_graph=copy.deepcopy(a['responses']),copy.deepcopy(b['responses'])
        ao,bo=old_graph.pop(OWNER),new_graph.pop(OWNER)
        assert ao['sha256']==P['filePins'][OWNER]['sha256'] and bo['sha256']==P['derived']
        common=old_graph.keys()&new_graph.keys()
        identity_diff=any({k:old_graph[rel][k] for k in ('sha256','bytes')}!=
                          {k:new_graph[rel][k] for k in ('sha256','bytes')} for rel in common)
        keys_diff=sorted(old_graph.keys()^new_graph.keys())
        # Exact reachable resource closure on both sides, except the one Stage42 asset.
        if identity_diff or keys_diff:
            result.setdefault('graphMismatch',[]).append({'viewport':[w,h],'pathsOnlyOneArm':keys_diff,'bytesDiffer':identity_diff})
            matched=False
        assert {k:v for k,v in a['owner'].items() if k!='d'}=={k:v for k,v in b['owner'].items() if k!='d'}
        assert len({f['physicsSHA256'] for f in a['frames'].values()})==1
        assert len({f['physicsSHA256'] for f in b['frames'].values()})==1
        assert set(a['frames'])==set(b['frames'])=={n for n,_ in SCOPES+(EAST if w==1440 else [])}
        for name,af in a['frames'].items():
          bf=b['frames'][name]
          assert {k:v for k,v in af.items() if k not in ('rawSHA','cssSHA')}=={k:v for k,v in bf.items() if k not in ('rawSHA','cssSHA')},('pose/physics mismatch',w,name)
          for kind in ('raw','css'):
            path=f'{w}x{h}/{name}-{kind}.png'
            arrays=[]
            for arm,f in [('A',af),('B',bf)]:
              pic=(out/arm/path).read_bytes()
              assert sha(pic)==f[kind+'SHA']
              with Image.open(io.BytesIO(pic)) as image:arrays.append(np.array(image.convert('RGBA'),dtype=np.uint8))
            aa,bb=arrays
            assert aa.shape==bb.shape and aa.shape[2]==4,(name,kind,aa.shape,bb.shape)
            if kind=='raw':assert aa.shape[:2]==tuple(reversed(af['backing']))
            shifted=aa!=bb
            mask=shifted.any(axis=2); ys,xs=np.where(mask)
            row={'viewport':[w,h],'scene':name,'raster':kind,'wholePixels':int(mask.size),
                 'differingPixels':int(len(xs)),'differingAlpha':int(shifted[:,:,3].sum()),'bboxLTRBExclusive':None}
            if len(xs):
                matched=False
                row['bboxLTRBExclusive']=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
                namebase=f'{w}x{h}-{name}-{kind}'
                path=out/'diff'/namebase;path.parent.mkdir(exist_ok=True)
                Image.fromarray(mask.astype(np.uint8)*255).save(path.with_suffix('.png'))
                # Lossless full native difference witness: each exact xy and both RGBA values.
                np.savez_compressed(path.with_suffix('.npz'),x=xs,y=ys,before=aa[ys,xs],after=bb[ys,xs])
                row.update(mask='diff/'+path.name+'.png',losslessCells='diff/'+path.name+'.npz')
                if kind=='raw':
                    f=af; z=f['actual']['scale']; d=f['d']
                    wx=f['viewport']['left']+(xs+.5)/(d*z); wy=f['viewport']['top']+(ys+.5)/(d*z)
                    row['worldPixelCenterRanges']=[float(wx.min()),float(wy.min()),float(wx.max()),float(wy.max())]
                    row['sourcePixelCenterRanges']=[n/K for n in row['worldPixelCenterRanges']]
                examples=[]
                for j in islice(range(len(xs)),12):
                    x,y=int(xs[j]),int(ys[j])
                    ex={'xy':[x,y],'before':aa[y,x].tolist(),'after':bb[y,x].tolist()}
                    if kind=='raw':ex.update(world=[float(wx[j]),float(wy[j])],source=[float(wx[j]/K),float(wy[j]/K)])
                    examples.append(ex)
                row['firstDifferences']=examples
            result['frames'].append(row);save(receipt,result)
      assert len(result['frames'])==16
      result['diagnostic']='zero_pixel_differences_on_sampled_views_only' if matched else 'failed_strict_native_gate'
    except Exception:
      result['diagnostic']='invalid_capture_or_comparison'
      result['failure']=traceback.format_exc()
      raise
    finally:save(receipt,result)
    return matched

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--repo',type=Path,required=True,help='existing local object DB containing the exact public commit; read-only')
    p.add_argument('--output',type=Path,required=True,help='fresh evidence directory outside the repo')
    a=p.parse_args();repo=a.repo.resolve();out=a.output.resolve()
    assert not out.is_relative_to(repo) and not out.exists(),out
    from playwright.sync_api import sync_playwright
    get=src(repo)
    active,campaign=graph(get(MAN),get(CAMPAIGN),get(MAP))
    baseline=get(OWNER); derived=derive(baseline)
    out.mkdir(parents=True)
    save(out/'source.json',{'release':REV,'mode':'offline intercepted Git blobs; public URLs are not fetched',
       'files':P['filePins'],'pinnedSource':P['sourceOrigin'],'candidate':{'path':OWNER,'sha256':sha(derived),'bytes':len(derived)},
       'protected':P['protected'],'restoration':'exact packet reverse-patch asserted'})
    try:
      with sync_playwright() as pw:results=capture(pw,get,active,campaign,baseline,derived,out)
      return 0 if compare(out,results) else 1
    except Exception:
      save(out/'failed.json',{'release':REV,'status':'incomplete/invalid, HOLD','exception':traceback.format_exc()})
      return 2
if __name__=='__main__':raise SystemExit(main())
