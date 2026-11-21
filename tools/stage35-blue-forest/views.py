"""Normal compiled localized proof. No route fulfillment, JS mutation or payload override."""
import base64,hashlib,io,json,math,statistics,sys,time
from pathlib import Path
from PIL import Image
from guard import P
H=Path(__file__).resolve().parent
ENTRY=json.loads((H/'entry.json').read_bytes())
OUT=Path(sys.argv[1])/'out';BASE='';HTML='HONRO.html'
proof={'status':'INIT','frames':{},'scope':'Two normal new browser contexts and native art. No payload injection. Art judgment remains separate.'}
def sha(d):return hashlib.sha256(d).hexdigest()
def facts(d):return {'bytes':len(d),'sha256':sha(d)}
def save():(OUT/'BROWSER.json').write_text(json.dumps(proof,indent=2,ensure_ascii=False)+'\n')
def rel(u):return u[len(BASE):] if u.startswith(BASE) and '?' not in u and '#' not in u else None
def decode(b):return Image.open(io.BytesIO(b)).convert('RGBA')
def read_png(p,z):
 b=base64.b64decode(p.evaluate(z),validate=True);return b,decode(b)
CANVAS="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
DECODE="""async ()=>{
 const chosen=[...new Set([...window.__honroObserver.images,...document.images])].filter(i=>i.currentSrc||i.src);
 const tasks=Promise.allSettled(chosen.map(i=>i.decode()));
 const [images]=await Promise.race([Promise.all([tasks,document.fonts.ready]),new Promise((_,rej)=>setTimeout(()=>rej(Error('image/font decode deadline')),30000))]);
 const bad=[],ready=[];
 for(let i=0;i<chosen.length;i++){
  const x=chosen[i],url=x.currentSrc||x.src,kind=url.startsWith('data:')?'inline':url.startsWith('blob:')?'browser-blob':'immutable-HTTP';
  const item={kind,url:kind==='immutable-HTTP'?url:kind,w:x.naturalWidth,h:x.naturalHeight,inDOM:x.isConnected};
  if(images[i].status!=='fulfilled'||!x.complete||!x.naturalWidth||!x.naturalHeight)bad.push({...item,reason:images[i].reason?.message??null});
  else ready.push(item);
 }
 return{registered:chosen.length,fontStatus:document.fonts.status,ready,failed:bad};
}"""
PEER="""async q=>{
 const app=HonroApp,b=app.engine.b,s=app.scene,st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===35);
 if(st.design.nativeArt.far!==q.key||b.honroMap?.nativeArt?.far!==q.key)throw Error('wrong compiled Stage35 far selection');
 const f=HonroAuthoredFarArt.frames(s,q.css.w,q.css.h,b);
 if(f.length!==1||f[0].key!==q.key||f[0].alpha!==1||!f[0].frame||s.environmentStats?.authoredFar?.[0]!==q.key)throw Error('normal native active far not ready');
 const src=[...window.__honroObserver.images].findLast(i=>(i.currentSrc||i.src)===q.far&&i.complete&&i.naturalWidth);
 if(src?.naturalWidth!==q.dim[0]||src?.naturalHeight!==q.dim[1])throw Error('wrong actual far resource decode dimensions');
 const mat=HonroTerrainDomain.materialLandmarks(b), ids=st.elements.map(v=>v.id);
 if(JSON.stringify(ids)!==JSON.stringify(q.ids))throw Error('wrong normal material instance order');
 const sig=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(a)))),n=>n.toString(16).padStart(2,'0')).join('');
 const shapes={},actualAssets={};
 for(const p of st.elements){
  const a=HONRO_PROJECT.library.filter(x=>x.id===p.assetId),land=mat.filter(l=>l.id===p.id);
  if(a.length!==1||land.length!==1||land[0].asset?.id!==a[0].id||land[0].kind!=='canonical-element'||
     JSON.stringify(land[0].asset.vector)!==JSON.stringify(a[0].vector))
   throw Error('unregistered actual authored owner '+p.id);
  actualAssets[p.assetId]=await sig(a[0]); shapes[p.id]={placement:p,a:a[0]};
 }
 const c=document.createElement('canvas');[c.width,c.height]=q.backing;const g=c.getContext('2d'),z=f[0].frame;
 g.drawImage(src,z.x,z.y,z.w,z.h);
 const farPng=c.toDataURL('image/png').split(',')[1];
 const oldBody=shapes['approved35-body'],scl=q.actual.scale;
 const draw=({a,placement})=>HonroVectorArt.draw(g,a,placement);
 function fresh(){g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);g.setTransform(scl,0,0,scl,-q.viewport.left*scl,-q.viewport.top*scl);}
 fresh();if(!draw(oldBody))throw Error('actual named BODY draw failed');
 const actualBody=g.getImageData(0,0,c.width,c.height).data;
 const alpha=Uint8Array.from({length:c.width*c.height},(_,i)=>actualBody[i*4+3]);
 const bytesHash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),n=>n.toString(16).padStart(2,'0')).join('');
 const bodySHA256=await bytesHash(actualBody),bodyAlpha=await bytesHash(alpha);
 const sides={};
 for(const [k,v] of Object.entries(shapes)){
  if(!k.startsWith('act4-handoff:35:bamboo-thicket-'))continue;
  fresh();if(!draw(v))throw Error('native side vector draw failed '+k);
  let outer=0,inside=0;const pixels=g.getImageData(0,0,c.width,c.height).data;
  for(let x=0;x<c.width;x++){
   const world=q.viewport.left+(x+.5)/scl;for(let y=0;y<c.height;y++)if(pixels[4*(y*c.width+x)+3]){
     if(world>=0&&world<=4608)inside++;else outer++;
   }
  }
  sides[k]={outside:outer,inside};
 }
 return{farKey:q.key,nativeFrame:z,natural:q.dim,activeOwnerOrder:ids,actualAssets,bodyRGBA:bodySHA256,bodyAlpha:bodyAlpha,sideAlpha:sides,farPng};
}"""
def framing(f,iw,ih):
 w,h=f['css']['w'],f['css']['h'];x,y=f['actual']['x'],f['actual']['y']
 mx,my=w*.022,h*.007;s=max((w+2*mx)/iw,(h+2*my)/ih);dw,dh=iw*s,ih*s
 ox=-mx*math.tanh((x-2304)*.025/mx);oy=-my*math.tanh((y-1536)*.0035/my)
 X=-mx-(dw-w-2*mx)*(.98 if w/h>=.9 else .5)+ox;Y=-my-(dh-h-2*my)*.28+oy
 return dict(x=X,y=Y,w=dw,h=dh,offsetX=ox,offsetY=oy),[-X/s,-Y/s,(w-X)/s,(h-Y)/s]
def far_luma(img):
 q={}
 for n,i in [('top',0),('middle',1),('bottom',2)]:
  h=img.height;s=img.crop((0,round(h*i/3),img.width,round(h*(i+1)/3))).convert('L')
  q[n]={'median':statistics.median(s.getdata()),'mean':round(statistics.mean(s.getdata()),2)}
 return q

def capture(browser,graph,wh,mode,shots):
    evidence,expected=graph["files"],graph["mustObserve"]
    w,h=wh;ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    assert ctx.storage_state()=={'cookies':[],'origins':[]}
    page=ctx.new_page();page.set_default_timeout(25000)
    errors=[];hits=[];blobs=[];media=[];pending=set()
    def route(r):
        q=r.request; k=rel(q.url)
        if (q.method=='GET' and (k in evidence or k in P['media'] and q.resource_type=='media')) or q.url.startswith(('blob:'+BASE,'data:')):
            return r.continue_()
        errors.append(['unexpected request',q.url]);return r.abort()
    def response(res):
        k=rel(res.url);q=res.request
        if res.url.startswith('blob:'+BASE) and res.status==200:blobs.append(res.url)
        elif k in P['media'] and q.resource_type=='media' and res.status in (200,206):media.append(k)
        elif k in evidence and res.status==200 and q.method=='GET':hits.append((k,res))
        else: errors.append(['unexpected response',res.url,res.status])
    def abnormal(q):
        if not (rel(q.url) in P['media'] and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):
            errors.append(['unexpected request failure',q.url,q.failure])
    ctx.route('**/*',route)
    page.on('request',lambda q:pending.add(q) if rel(q.url) in evidence else None)
    page.on('requestfinished',lambda q:pending.discard(q))
    page.on('requestfailed',lambda q:pending.discard(q))
    page.on('requestfailed',abnormal);page.on('response',response)
    page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
    page.add_init_script('('+ENTRY['INIT']+')()')
    rows={}
    try:
        shell=page.goto(BASE+HTML,wait_until='domcontentloaded')
        assert shell and shell.url==BASE+HTML and shell.status==200 and facts(shell.body())==evidence[HTML]
        page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'")
        page.evaluate(ENTRY['LAUNCH'],35); canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
        page.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}",timeout=12000)
        page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
        for f in shots:

            k=f['key'];view=f['view']
            q={'id':35,'mapId':'stage-35','name':'ordinary' if view in ('start','exit') else view,
              'dx':1 if 'east' in view else -1 if 'west' in view else 0,
              'dy':1 if 'south' in view else -1 if 'north' in view else 0,
              'ordinary':f['anchor'],'readback':False}
            staged={'k':k,'AorB':mode}
            proof['activeProbe']=staged.copy();save()
            g=page.evaluate(ENTRY['PARK'],q)
            dd=page.evaluate(DECODE)
            staged['imageDecode']=dd
            proof['activeProbe']=staged.copy();save()
            assert not dd['failed'] and dd['fontStatus']=='loaded',('real image/font decode failure',k,mode,dd['failed'],dd['fontStatus'])
            assert g==page.evaluate(ENTRY['PARK'],{**q,'readback':True})
            assert sha(g['signature'].encode())==f['physicsSHA256'] and all(f[n]==g[n] for n in (
              'actual','viewport','css','backing','focus','actorCount','tide','sceneTime','phase','round')),('play/state/camera drift',k,mode)
            rb,raw=read_png(page,CANVAS);db=canvas.screenshot(animations='disabled');dom=decode(db)
            assert list(raw.size)==f['backing'] and list(dom.size)==f['pixels']
            domH=sha(dom.tobytes());rawH=sha(raw.tobytes())
            for name,value in [('raw',rb),('dom',db)]: (OUT/f'{k}-{mode}-{name}.png').write_bytes(value)
            if mode=='A':
                assert f.get('expectedStockDOMPixels',domH)==domH,('stock archived visual drift',k,domH)
                assert f.get('expectedStockRAWPixels',rawH)==rawH,('stock archived RAW drift',k,rawH)
            far=P['far']['old' if mode=='A' else 'new'];side=list(P['sides']) if mode=='B' else []
            ids=['approved35-forest-foundation','approved35-near-geology','approved35-body',
                 'act4-handoff:35:bedrock','act4-handoff:35:bamboo','act4-handoff:35:walls']
            target_url=BASE+graph['farFile']
            far_decodes=[i for i in dd['ready'] if i['url']==target_url]
            assert far_decodes and all([x['w'],x['h']]==far['size'] for x in far_decodes),('not decoded exact signed native FAR URL',k,mode,far_decodes)
            peer=page.evaluate(PEER,{'backing':g['backing'],'viewport':g['viewport'],'actual':g['actual'],
                       'css':g['css'],'far':target_url,'key':far['key'],'dim':far['size'],'ids':side+ids})
            assert all(graph['stageAssets'][p]==hash for p,hash in peer['actualAssets'].items()) and len(peer['actualAssets'])==len(side+ids)
            assert set(peer['sideAlpha'])==set(side) and all(v['inside']==0 for v in peer['sideAlpha'].values()),('side visual leaked into play',k,mode)
            if mode=='B':
                for direction in ('west','east'):
                    if direction in view and view==direction:
                        assert peer['sideAlpha']['act4-handoff:35:bamboo-thicket-'+direction]['outside']>0,'signed near side canopy not visible in target view'
            op,crop=framing(g,*far['size'])
            assert all(abs(peer['nativeFrame'][j]-v)<1e-6 for j,v in op.items())
            rgba=decode(base64.b64decode(peer.pop('farPng'),validate=True))
            assert rgba.getchannel('A').getextrema()==(255,255),('background crop leaves transparent screen area',k,mode)
            rows[k]={'rawRGBA':rawH,'domRGBA':domH,'rawPNG':sha(rb),'domPNG':sha(db),
                     'rawAlpha':sha(raw.getchannel('A').tobytes()),'domAlpha':sha(dom.getchannel('A').tobytes()),
                     'registeredVisibleFarImage':graph['farFile'],'registeredDecodedOnlyInformational':dd['registered'],
                     'nativeFarLuma':far_luma(rgba),'crop':crop,'normalizedLegacyPhysicalSHA256':f['physicsSHA256'],**peer}
            proof['frames'].setdefault(k,{})[mode]=rows[k]
            save()
        seen={};i=quiet=0;deadline=time.monotonic()+12
        while time.monotonic()<deadline:
            assert not errors,errors
            while i<len(hits) and hits[i][1].request not in pending:
                k,res=hits[i]; want=evidence[k]
                seen[k]=facts(res.body()); assert seen[k]==want,('observed HTTP body differs',k)
                i+=1
            generated=set(page.evaluate("()=>[...window.__honroObserver.blobs]"))
            before=(i,len(blobs));page.wait_for_timeout(100)
            idle=before==(len(hits),len(blobs)) and not pending and set(blobs)<=generated
            quiet=quiet+1 if idle else 0
            if quiet==3:break
        proof['lastHttpDrain']={'arm':mode,'view':wh,'requests':len(hits),'pending':[q.url for q in pending],'errors':errors,'missing':sorted(set(expected)-seen.keys())};save()
        assert quiet==3 and not errors and set(expected)<=seen.keys(), ('missed normal compiled loader/split body observations',sorted(set(expected)-seen.keys()),errors)
        proof.setdefault('HTTP',{}).setdefault(f'{w}x{h}',{})[mode]={'verified':seen,'media':sorted(set(media))}
        save();return seen
    finally:ctx.close()
def main():
    from playwright.sync_api import sync_playwright
    global BASE
    save()
    try:
        g=json.loads((OUT/'GRAPH.json').read_bytes())
        assert g['49OtherMapsAndAssetsAndActualLeavesExact'] and g['Stage35ReverseOnlyTwoPlacementsAndFarSelectorRestoredMap'] and g['signedOwnerTable'] and g['Stage35FourSignedPaintOnlyOwnersAndPier']
        with sync_playwright() as w:
            b=w.chromium.launch();assert b.version==P['browser']
            for wh in ((1440,900),(390,844)):
                selected=[f for f in P['frames'].values() if tuple(f['viewportCSS'])==wh];assert len(selected)==11
                seen={}
                for mode,port in (('A',18841),('B',18842)):
                    BASE=f'http://127.0.0.1:{port}/'
                    seen[mode]=capture(b,g[mode],wh,mode,selected)
                normalizer={j:i for i,j in g['authorizedRenamedPaths']}
                normalizer[g['B']['farFile']]=g['A']['farFile']
                assert set(seen['A'])=={normalizer.get(k,k) for k in seen['B']}, ('normal A/B HTTP scope differs beyond mapped immutable names',wh)
                for s in selected:
                    k=s['key'];x,z=proof['frames'][k]['A'],proof['frames'][k]['B']
                    assert all(x[p]==z[p] for p in ('rawAlpha','domAlpha','bodyAlpha','normalizedLegacyPhysicalSHA256')),('physical model or BODY/overall canvas opacity drift',k)
                    assert x['rawRGBA']!=z['rawRGBA'] and x['domRGBA']!=z['domRGBA'],('native new raster/terrain not visible',k)
                    if k.endswith('-ordinary') or k.endswith('-overview'):
                        assert x['bodyRGBA']!=z['bodyRGBA'],('approved new BODY paint not visible in intended matched frame',k)
                    proof['frames'][k]['physicalBodyAndCanvasAlphaExact']='yes';save()
            b.close()
        assert len(proof['frames'])==22 and all(x.get('physicalBodyAndCanvasAlphaExact')=='yes' for x in proof['frames'].values())
        proof['status']='PASS_COMBINED_NORMAL_SOURCE_AND_NATIVE_CAMERAS_ART_JUDGMENT_PENDING'
        proof.pop('activeProbe',None)
    except Exception as e:proof.update(status='HOLD',reason=repr(e));raise
    finally:save()
if __name__=='__main__':main()
