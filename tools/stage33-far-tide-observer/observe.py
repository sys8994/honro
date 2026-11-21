"""Read-only normal public App observer; Stage33 only; no tide/runtime/source substitution."""
import base64, hashlib, json, os, re, subprocess, sys, time
from io import BytesIO
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler,Request,build_opener

REPO='sys8994/honro'
BASE='https://sys8994.github.io/honro/'
REF='refs/heads/qa/stage33-far-tide-b79-observer'
LIVE='f7704f08b7462cb10587b582d8a3a4feafe643d1'
MASTER='b79ea7fd87fda5586d78eae0a7052996b8e71fb5'
RUN, JOB = 44896684762, 136824052511
DOCS={f'game/docs/{f}.md' for f in ('HONRO_NEW_VERSION_SOP','STAGE_PRODUCTION_SOP','TERRAIN_EDGE_JOIN_AUDIT_SOP','TERRAIN_GENERATION_SOP','TERRAIN_PRODUCTION_REVIEW_SOP_20261120','VECTOR_AUTHORING_SOP')}
FILES={'.github/workflows/stage33-far-tide-observer.yml','tools/stage33-far-tide-observer/observe.py'}
OWNER='act4-sideview:33:coastal-v2:lowland'
MEDIA={f'assets/bgm/{n}.mp3' for n in ('main','battle-1','battle-2','battle-3')}
PATHS = {'map': 'web/data/chapter-33.a7ce91b7d78fb5f8.json', 'packet': 'web/data/chapter-33-assets.4b5df185aa59eb42.json', 'far': 'web/graphics/honro_authored_far-images-act4Estuary.1ba81aae5bebeebd.webp', 'farData': 'web/data/HONRO_AUTHORED_FAR.b014b75b5dd7973d.json', 'farRuntime': 'web/runtime/HONRO_AUTHORED_FAR.4cfa3ca0b38a2f24.js', 'entry': 'web/entries/game.16fa712378260ab7.js', 'campaign': 'web/data/campaign.324003dbe6483ac8.json'}
EXACT = {'web/data/chapter-33.a7ce91b7d78fb5f8.json': {'bytes': 34011, 'sha256': 'a7ce91b7d78fb5f8b0b27a4ea42ce6cf4f54d98556c43176beb87a0789573a5a'}, 'web/data/chapter-33-assets.4b5df185aa59eb42.json': {'bytes': 2836956, 'sha256': '4b5df185aa59eb42dbb2c46bd21b38ef2ab7134098bc31b3a0b96439dcc7ef73'}, 'web/graphics/honro_authored_far-images-act4Estuary.1ba81aae5bebeebd.webp': {'bytes': 130830, 'sha256': '1ba81aae5bebeebd46cc094be2519797d67ef49a887d7aade45cb61b39878fff'}, 'web/data/HONRO_AUTHORED_FAR.b014b75b5dd7973d.json': {'bytes': 5006, 'sha256': 'b014b75b5dd7973d864f372fa0c2b024aec302a175f5f1f99c0fc9dc839dbc82'}, 'web/runtime/HONRO_AUTHORED_FAR.4cfa3ca0b38a2f24.js': {'bytes': 905, 'sha256': '4cfa3ca0b38a2f24a10017fb6d61454760dae24279b6bae34b2d6be10e932a1f'}, 'web/entries/game.16fa712378260ab7.js': {'bytes': 20483, 'sha256': '16fa712378260ab755902f838024524e733b769c5cd540f95737b3eaff58f7b1'}, 'web/data/campaign.324003dbe6483ac8.json': {'bytes': 54961, 'sha256': '324003dbe6483ac8a778ba250d8aa8d1c63d9149f1cb5b580e6011256006f437'}, 'HONRO.html': {'bytes': 17379, 'sha256': 'c8d009ef643d2b24abd85400162b307a2e5a8e95100fe999b89a6afdd5faaecc'}, 'web/manifest.json': {'bytes': 6774523, 'sha256': '0bf1527b6aa52fa5f4f22eb1b90102df5f1c6ea0cb791d664b1b94081c1b65cf'}}
PATHS.update({'base': 'web/data/campaign-base.0c57dcfe7c08d421.json', 'shared': 'web/data/campaign-shared.8f8343b5c21518d4.json'})
EXACT.update({p:row for p,row in {'web/data/campaign-base.0c57dcfe7c08d421.json': {'bytes': 257, 'sha256': '0c57dcfe7c08d421901ffa8eeb437940b6b6d4779816207b51dca7be44c73e5e'}, 'web/data/campaign-shared.8f8343b5c21518d4.json': {'bytes': 577195, 'sha256': '8f8343b5c21518d4fdaa2314e58031fd137b8622d3a6c1ca2fdabafde3bb158f'}}.items()})

TIDE_CONTRACT = {'warningRound': 2, 'highRound': 5, 'lowRound': 7, 'low': 4095, 'high': 3532.5, 'floorTerrainIds': ['approved33-low-ground'], 'continuousSea': {'version': 1, 'stage33': True, 'depth': 2000}}
POSES = {'s33-1440x900-southeast': {'key': 's33-1440x900-southeast', 'view': 'southeast', 'viewportCSS': [1440, 900], 'pngSHA256': 'b9a955ae0f24582877e09c933ce388903781ea65dc954d6e66b29dc95300d8e2', 'actual': {'x': 7232, 'y': 4848, 'scale': 0.21176470588235294}, 'viewport': {'left': 3832, 'right': 10632, 'top': 3031.862847222222, 'bottom': 6664.137152777777}, 'focus': {'left': -320, 'top': -1800, 'right': 7232, 'bottom': 4848}, 'zoomLimits': {'min': 0.21176470588235294, 'max': 1.65, 'tactical': 0.21176470588235294, 'readability': 0.056818181818181816}, 'css': {'w': 1440, 'h': 769.1875}, 'backing': [1440, 769], 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'tide': None, 'actorCount': 34, 'physicsSHA256': '9cd682370b682d68ae2c8dc3ec586bb911088770c581b6ecb93a510535bc9279'}, 's33-390x844-east': {'key': 's33-390x844-east', 'view': 'east', 'viewportCSS': [390, 844], 'pngSHA256': 'b4c4f35e5c5d623722849b43e8802a873e54a43047b04066ea5ac6ee7be62261', 'actual': {'x': 7232, 'y': 2304, 'scale': 0.057352941176470586}, 'viewport': {'left': 3832, 'right': 10632, 'top': -3341.8253205128203, 'bottom': 7949.82532051282}, 'focus': {'left': -320, 'top': -1800, 'right': 7232, 'bottom': 4848}, 'zoomLimits': {'min': 0.057352941176470586, 'max': 1.65, 'tactical': 0.057352941176470586, 'readability': 0.056818181818181816}, 'css': {'w': 390, 'h': 647.609375}, 'backing': [390, 648], 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'tide': None, 'actorCount': 34, 'physicsSHA256': '9cd682370b682d68ae2c8dc3ec586bb911088770c581b6ecb93a510535bc9279'}, 's33-390x844-southeast': {'key': 's33-390x844-southeast', 'view': 'southeast', 'viewportCSS': [390, 844], 'pngSHA256': 'd9d549d2518f174d7937fcaade19298930400c5f96c946122084042fe0928768', 'actual': {'x': 7232, 'y': 4848, 'scale': 0.057352941176470586}, 'viewport': {'left': 3832, 'right': 10632, 'top': -797.8253205128203, 'bottom': 10493.82532051282}, 'focus': {'left': -320, 'top': -1800, 'right': 7232, 'bottom': 4848}, 'zoomLimits': {'min': 0.057352941176470586, 'max': 1.65, 'tactical': 0.057352941176470586, 'readability': 0.056818181818181816}, 'css': {'w': 390, 'h': 647.609375}, 'backing': [390, 648], 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'tide': None, 'actorCount': 34, 'physicsSHA256': '9cd682370b682d68ae2c8dc3ec586bb911088770c581b6ecb93a510535bc9279'}}
INIT=r"""()=>{
 const images=new Set(), blobs=new Set();
 const proto=HTMLImageElement.prototype, d=Object.getOwnPropertyDescriptor(proto,'src');
 Object.defineProperty(proto,'src',{...d,set(v){images.add(this);return d.set.call(this,v);}});
 const create=URL.createObjectURL;
 URL.createObjectURL=function(...args){const url=Reflect.apply(create,this,args);blobs.add(url);return url};
 Object.defineProperty(window,'__honroObserver',{value:{images,blobs},enumerable:false});
}"""
LAUNCH=r"""async id=>{
 const a=window.HonroApp;
 if(!a||typeof a.launch!=='function')throw Error('Normal app unavailable');
 a.frame=()=>{};
 a.profile.settings.music=false;a.profile.settings.sound=false;
 await HonroCampaignLoader.ensureStage(id);
 for(let n=1;n<id;n++)a.profile.cleared[n]=true;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(id).entryLevel);
 a.launch(id);
 if(a.engine?.b?.honroStage!==id)throw Error('Campaign wrong stage');
 for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
 if(a.dialogue)throw Error('Entry dialogue remains');
 a.close();HonroStoryFraming.clear(a.scene);
}"""
PARK=r"""q=>{
 const a=HonroApp,s=a.scene,e=a.engine,b=e.b;
 const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.id);
 if(!st||st.id!==q.mapId||b.honroStage!==q.id||b.honroCustom!==false||!b.honroCanonical)
   throw Error('Wrong canonical project stage');
 const r=s.canvas.getBoundingClientRect(), f=HonroBounds.focus(b), z=HonroBounds.zoomLimits(r.width);
 if(![z.min,z.max,f.left,f.top,f.right,f.bottom].every(Number.isFinite)||z.min>=z.max)throw Error('Missing real native zoom and focus bounds');
 const desired=q.name==='ordinary'?{x:q.ordinary[0],y:q.ordinary[1],scale:q.ordinary[2]}:
    {x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:z.min};
 const pos=()=>({x:s.x,y:s.y,scale:s.scale});
 if(!q.readback){
   HonroStoryFraming.clear(s);
   Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,
     focusUntil:0,speakerUntil:0,...desired});
   HonroBounds.constrain(s,b);
 }
 const constrained=pos();
 // First draw only stabilizes genuine runtime lazy caches. The observation draw must not mutate gameplay.
 if(!q.readback)s.render(e,0,'',.6,false,0);
 const signature=()=>JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,
    objectives:st.objectives,water:b.water??null,tide:b.honroAct4PreviewState?.tide??null,
    phase:b.phase??null,round:b.round??null});
 const initial=signature();
 s.render(e,0,'',.6,false,0);
 if(signature()!==initial)throw Error('Draw mutated campaign/physics/actors');
 const actual=pos(), viewport=HonroBounds.viewport(s,r.width,r.height);
 if(Object.keys(actual).some(k=>!Number.isFinite(actual[k])||Math.abs(actual[k]-constrained[k])>1e-6)||
   actual.x<f.left-1e-6||actual.x>f.right+1e-6||actual.y<f.top-1e-6||actual.y>f.bottom+1e-6)
   throw Error('Render after clamp changed camera');
 if(q.name==='ordinary'){
   const margin=1e-6, cx=(q.ordinary[0]-viewport.left)*actual.scale, cy=(q.ordinary[1]-viewport.top)*actual.scale;
   if(actual.scale<=z.min+margin||actual.scale>z.max+margin||cx<0||cx>r.width||cy<0||cy>r.height)
     throw Error('Ordinary target outside current camera or not at ordinary scale');
 }else if(Math.abs(actual.scale-z.min)>1e-6)throw Error('Not actual min zoom');
 if(q.name!=='ordinary'&&!q.readback){
   const edge=axis=>{const p=pos(), ext=axis==='x'?[f.left,f.right]:[f.top,f.bottom];return p[axis]>=ext[0]-1e-6&&p[axis]<=ext[1]+1e-6};
   if(!edge('x')||!edge('y'))throw Error('Extremes outside approved focus');
 }
 return {desired,actual,viewport,focus:f,zoomLimits:z,css:{w:r.width,h:r.height},backing:[s.canvas.width,s.canvas.height],
         actorCount:b.units.length,tide:b.honroAct4PreviewState?.tide??null,
         phase:b.phase??null,round:b.round??null,sceneTime:s.time,signature:initial};
}"""

# Scoped instrumentation wraps the exact native functions for one real draw.
# All calls delegate once with the same this/arguments/result and always restore.
OBSERVE=r"""async q=>{
 const {scene:s,engine:e}=HonroApp,b=e.b, fa=HonroAuthoredFarArt, wa=HonroAct4PilotArt;
 const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===33),cfg=b.honroAct4Design?.tide,sea=b.honroMap?.act4?.tide?.continuousSea;
 const p=st?.elements.filter(t=>t.id===q.owner),land=HonroTerrainDomain.materialLandmarks(b).filter(t=>t.id===q.owner);
 if(p?.length!==1||p[0].assetId!==q.owner||p[0].x!==0||p[0].y!==0||p[0].scale!==1||
    land.length!==1||land[0].asset?.id!==q.owner||
    JSON.stringify(land[0].asset.vector)!==JSON.stringify(HONRO_PROJECT.library.find(x=>x.id===q.owner)?.vector))
   throw Error('active registered lowland owner did not bind to canonical renderer');
 if(!wa?.config(b)||wa.config(b).far!==undefined||cfg?.floorTerrainIds?.length!==1||
    cfg.floorTerrainIds[0]!=='approved33-low-ground'||!b.terrain.some(t=>t.id===cfg.floorTerrainIds[0]&&!t.broken)||
    ['low','high','warningRound','highRound','lowRound'].some(k=>cfg[k]!==q.tide[k])||
    sea?.stage33!==true||sea?.version!==1||sea?.depth!==2000)
   throw Error('wrong authored native Act4 tide/source contract');
 const urls=i=>i.currentSrc||i.src;
 const found=[...__honroObserver.images].filter(i=>urls(i)===q.far);
 if(!found.length)throw Error('no native requested image object for exact observed estuary');
 await Promise.race([Promise.all([document.fonts.ready,...found.map(i=>i.decode())]),new Promise((_,bad)=>setTimeout(()=>bad(Error('far decode timeout')),10000))]);
 const src=found.at(-1);
 if(document.fonts.status!=='loaded'||!src.complete||!src.naturalWidth||!src.naturalHeight)throw Error('estuary not decoded');
 const frames=fa.frames(s,q.css.w,q.css.h,b),f=frames[0],size=[Math.min(2048,src.naturalWidth),Math.round(Math.min(2048,src.naturalWidth)*src.naturalHeight/src.naturalWidth)];
 if(frames.length!==1||f.key!=='act4Estuary'||f.mood!==''||f.alpha!==1||
    !f.frame||!fa.stats().keys.includes('act4Estuary:')||fa.stats().errors.length)
   throw Error('native estuary cache not effective');
 const pf=HonroEnvironment.act1BackdropFrame(s,q.css.w,q.css.h,b,...size);
 if(['x','y','w','h'].some(k=>!Number.isFinite(f.frame[k])||Math.abs(f.frame[k]-pf[k])>1e-6))
   throw Error('FAR provider is not using native parallax frame for decoded asset');
 const zones=()=>structuredClone(b.honroSurfaceZones??[]);
 const tide=()=>structuredClone(b.honroAct4PreviewState?.tide??null);
 const waterState=()=>JSON.stringify({tide:tide(),zones:zones(),water:b.water??null,
   phase:b.phase,round:b.round,units:b.units,terrain:b.terrain,camera:[s.x,s.y,s.scale,s.time]});
 const before=waterState(), t=tide(), z=zones(), eligible=wa.tidalSea(b);
 const far=[],water=[];let inside=0;
 const replacement=(obj,k,wrap)=>{
    const has=Object.hasOwn(obj,k),d=Object.getOwnPropertyDescriptor(obj,k),old=obj[k];
    if(typeof old!=='function')throw Error('missing instrumentation target '+k);
    obj[k]=wrap(old);return ()=>{if(has)Object.defineProperty(obj,k,d);else delete obj[k];};
 };
 const restores=[];
 try{
  restores.push(replacement(s,'_screenRaster',old=>function(...args){
   const result=Reflect.apply(old,this,args);
   if(typeof args[1]==='string'&&args[1].startsWith('authored-far:'))
    far.push({key:args[1],size:[args[2],args[3]],handledByScreenRaster:Boolean(result)});
   return result;
  }));
  restores.push(replacement(s,'liveWater',old=>function(c,arg,...rest){
   if(arg!==b||inside)throw Error('unexpected liveWater receiver or recursion');
   inside++;const draws=[],gradient=new WeakMap(),tmp=[];
   try{
    tmp.push(replacement(c,'createLinearGradient',op=>function(...args){const g=Reflect.apply(op,this,args);gradient.set(g,args);return g;}));
    tmp.push(replacement(c,'fillRect',op=>function(...args){
     const g=gradient.get(c.fillStyle);
     if(g)draws.push({gradient:g,rect:args,transform:[c.getTransform().a,c.getTransform().d,c.getTransform().e,c.getTransform().f]});
     return Reflect.apply(op,this,args);
    }));
    return Reflect.apply(old,this,[c,arg,...rest]);
   }finally{for(const fn of tmp.reverse())fn();inside--;water.push(draws);}
  }));
  s.render(e,0,'',.6,false,0);
 }finally{for(const fn of restores.reverse())fn();}
 if(waterState()!==before)throw Error('observed draw mutated actual water/camera/geometry/actors');
 if(far.length!==1||far[0].size.some((v,i)=>v!==[q.css.w,q.css.h][i])||
    !far[0].key.includes('act4Estuary,')||s.environmentStats?.authoredFar?.join(',')!=='act4Estuary')
   throw Error('no actual native estuary background dispatch');
 if(water.length!==1)throw Error('did not observe actual native Stage33 liveWater caller');
 const expected=t&&eligible?[0,t.surface,0,t.surface+sea.depth]:null;
 const visible=water[0].filter(r=>r.gradient[0]===0&&r.gradient[2]===0&&r.gradient[3]-r.gradient[1]===sea.depth);
 if(t===null&&(eligible!==null||visible.length))throw Error('null tide but observed continuous tidal paint');
 if(t!==null&&(!eligible||!expected||visible.length!==1||JSON.stringify(visible[0].gradient)!==JSON.stringify(expected)||
    visible[0].rect[1]!==t.surface||visible[0].rect[2]<=0||visible[0].rect[3]<=0||
    z.filter(zz=>String(zz.id).startsWith('a4-live-')).some(zz=>!Array.isArray(zz.surface)||zz.surface.some(p=>p[1]!==t.surface))))
   throw Error('actual tide surface/zone/continuous pass disagrees');
 return {owner:q.owner,stage:33,viewportCSS:q.css,dpr:devicePixelRatio,phase:b.phase,round:b.round,tide:t,zones:z,
  water:{eligible,continuousActualDraw:visible,nativeLiveWaterCalls:water.length,allObservedGradientDraws:water[0],
   status:t===null?'ABSENT_NO_CONTINUOUS_TIDAL_PASS':'PRESENT_REAL_STATE_AND_PAINT',otherRounds:'HOLD_NOT_REACHED'},
  far:{key:f.key,mode:'native Act4; no override; estuary default',mood:f.mood,opacity:f.alpha,url:urls(src),
   natural:[src.naturalWidth,src.naturalHeight],registeredCacheSize:size,frame:f.frame,dispatch:far[0],environmentStats:s.environmentStats},
  unmodifiedState:true};
}"""

def sha(data): return hashlib.sha256(data).hexdigest()
def facts(data): return {'bytes':len(data),'sha256':sha(data)}
def checked(path,data,expected):
    assert facts(data)==expected,(path,facts(data),expected)
    return data
def git(*args): return subprocess.check_output(['git',*args])
def src(rev,path): return git('show',rev+':'+path)
def save(path,obj):
    tmp=path.with_suffix('.tmp')
    tmp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n');tmp.replace(path)
def gh(endpoint):
    return json.loads(subprocess.check_output(['gh','api',f'repos/{REPO}/'+endpoint],timeout=25))
def authority(out):
    head=os.environ['GITHUB_SHA']
    assert os.environ['GITHUB_REPOSITORY']==REPO and os.environ['GITHUB_REF']==REF and os.environ['GITHUB_EVENT_NAME']=='push'
    assert git('rev-list','--parents','--max-count=1','HEAD').decode().split()==[head,MASTER]
    assert git('rev-list','--parents','--max-count=1',MASTER).decode().split()==[MASTER,LIVE]
    diff=lambda a,b:set(git('diff','--name-status','--no-renames',a,b).decode().splitlines())
    approved_added_sop='game/docs/TERRAIN_PRODUCTION_REVIEW_SOP_20261120.md'
    assert diff(LIVE,MASTER)=={('A\t' if p==approved_added_sop else 'M\t')+p for p in DOCS},'approved docs-only master ancestry mismatch'
    assert diff(MASTER,head)=={'A\t'+p for p in FILES},'carrier not strictly add-only'
    assert gh('git/ref/heads/master')['object']['sha']==MASTER,'master advanced, scope no longer pinned'
    r,j=gh(f'actions/runs/{RUN}'),gh(f'actions/jobs/{JOB}')
    assert r['repository']['full_name']==r['head_repository']['full_name']==REPO
    assert (r['id'],r['head_sha'],r['head_branch'],r['name'],r['status'],r['conclusion'])==(RUN,LIVE,'master','pages build and deployment','completed','success')
    assert (j['id'],j['run_id'],j['name'],j['status'],j['conclusion'])==(JOB,RUN,'deploy','completed','success')
    assert any(w['name']=='Deploy to GitHub Pages' and w['conclusion']=='success' for w in j['steps'])
    for p,w in EXACT.items(): checked(p,src(MASTER,p),w)
    save(out/'AUTHORITY.json',{'master':MASTER,'contentRelease':LIVE,'evidence':{'pagesRun':RUN,'deployJob':JOB},'onlyAdditions':sorted(FILES),'verified':True})

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*args,**kw): raise RuntimeError('unexpected public redirect')
def public(path):
    url=BASE+path
    with build_opener(NoRedirect).open(Request(url,headers={'Cache-Control':'no-cache','Accept-Encoding':'identity'}),timeout=25) as r:
        assert r.url==url and r.status==200
        return checked(path,r.read(EXACT[path]['bytes']+1),EXACT[path])
def pathof(uri):
    return uri[len(BASE):] if uri.startswith(BASE) and not ({'?','#'} & set(uri)) else None
def manifest(out):
    assert not os.environ.get('GH_TOKEN') and not os.environ.get('GITHUB_TOKEN')
    a=json.loads((out/'AUTHORITY.json').read_bytes())
    assert a['verified'] is True and (a['master'],a['contentRelease'])==(MASTER,LIVE)
    data=public('web/manifest.json')
    m=json.loads(data);rows=m['files']
    inv={r['path']:{k:r[k] for k in ('bytes','sha256')} for r in rows}
    assert len(inv)==len(rows) and m['gameEntry']==PATHS['entry'] and m['project']==PATHS['campaign']
    assert all(inv[p]==EXACT[p] for p in PATHS.values())
    campaign=json.loads(checked(PATHS['campaign'],src(MASTER,PATHS['campaign']),EXACT[PATHS['campaign']]))
    assert (campaign['stages'][32],campaign['stageLibraries'][32])==(PATHS['map'],PATHS['packet'])
    assert (campaign['base'],campaign['shared'])==(PATHS['base'],PATHS['shared'])
    assert campaign['assetEncodings']['stageLibraries'][32]=='json'
    stage=json.loads(checked(PATHS['map'],src(MASTER,PATHS['map']),EXACT[PATHS['map']]))
    assert stage['metadata']['stageId']==33 and stage['id']=='stage-33' and stage['design']['act4']['tide']==TIDE_CONTRACT
    return inv|{p:EXACT[p] for p in ('HONRO.html','web/manifest.json')}

PNG="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
BLOB=re.compile(r'blob:https://sys8994\.github\.io/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')
def capture(browser,out,known,w,h,report):
    from PIL import Image
    ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    assert ctx.storage_state()=={'cookies':[],'origins':[]}
    page=ctx.new_page();page.set_default_timeout(30000)
    errs=[];hits=[];pending=set();http={};blobs=set()
    visit={'css':[w,h],'errors':errs,'HTTP':http,'status':'INIT'}
    report['visits'].append(visit)
    emit=lambda:save(out/'RECEIPT.json',report)
    def allow(q):
        k=pathof(q.url)
        return q.method=='GET' and (k in known or k in MEDIA and q.resource_type=='media' or BLOB.fullmatch(q.url) or q.url.startswith('data:'))
    def route(r):
        if allow(r.request): r.continue_()
        else: errs.append(['blocked noncanonical request',r.request.method,r.request.url]);r.abort()
    def response(r):
        q=r.request;k=pathof(r.url)
        if q.method=='GET' and BLOB.fullmatch(r.url) and r.status==200: blobs.add(r.url)
        elif q.method=='GET' and k in MEDIA and q.resource_type=='media' and r.status in (200,206): pass
        elif q.method=='GET' and k in known and r.status==200: hits.append((k,r))
        else: errs.append(['unexpected response',r.status,r.url])
    def failed(q):
        pending.discard(q)
        if not (pathof(q.url) in MEDIA and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):
            errs.append(['request error',q.url,q.failure])
    ctx.route('**/*',route)
    page.on('pageerror',lambda e:errs.append(['pageerror',str(e)]))
    page.on('request',lambda q:pending.add(q) if pathof(q.url) in known else None)
    page.on('requestfailed',failed)
    page.on('requestfinished',lambda q:pending.discard(q))
    page.on('response',response)
    page.add_init_script('('+INIT+')()')
    i=0
    def drain(needs):
        nonlocal i
        quiet=0
        deadline=time.monotonic()+12
        while time.monotonic()<deadline:
            assert not errs,errs
            while i<len(hits) and hits[i][1].request not in pending:
                p,r=hits[i];http[p]=facts(checked(p,r.body(),known[p]));i+=1
            seen=(i,len(blobs))
            page.wait_for_timeout(100)
            if seen==(len(hits),len(blobs)) and not pending and needs<=http.keys(): quiet+=1
            else: quiet=0
            if quiet==3:
                assert not errs and blobs<=set(page.evaluate("()=>Array.from(__honroObserver.blobs)"))
                return
        raise RuntimeError(f'HTTP attestation timeout; missing={sorted(needs-http.keys())} pending={[q.url for q in pending]} errors={errs}')
    try:
        shell=page.goto(BASE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
        assert shell and shell.url==BASE+'HONRO.html' and shell.status==200
        html=checked('HONRO.html',shell.body(),EXACT['HONRO.html'])
        assert html.count(('src="'+PATHS['entry']+'"').encode())==1
        page.wait_for_function("""()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'""",timeout=90000)
        page.evaluate(LAUNCH,33)
        page.locator('#battlecanvas').wait_for(state='visible')
        page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
           return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
        page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
        needs={*PATHS.values(),'HONRO.html'}
        for key,pin in POSES.items():
            if pin['viewportCSS']!=[w,h]: continue
            q={'id':33,'mapId':'stage-33','name':pin['view'],'dx':1,'dy':int(pin['view']=='southeast'),'readback':False}
            f=page.evaluate(PARK,q)
            for k in ('actual','viewport','focus','zoomLimits','css','backing','phase','round','sceneTime','actorCount'):
                assert f[k]==pin[k],('archive camera/phase/actor drift',key,k,f[k],pin[k])
            # Original digest includes preview tide field. If the actual aim/1 has
            # nonnull tide, report the difference without attributing old geometry.
            physics=sha(f.pop('signature').encode())
            obs=page.evaluate(OBSERVE,{'css':f['css'],'owner':OWNER,'far':BASE+PATHS['far'],'tide':TIDE_CONTRACT})
            assert obs['dpr']==1 and (obs['phase'],obs['round'],obs['tide'])==(f['phase'],f['round'],f['tide'])
            drain(needs)
            assert http[PATHS['far']]==EXACT[PATHS['far']]
            visit.setdefault('measuredBeforeRaw',{})[key]={'actualAim1StateSHA256':physics,'archiveAim1StateSHA256':pin['physicsSHA256'],**obs}
            emit()
            assert physics==pin['physicsSHA256'],('actual aim/1 full geometry/actors/tide signature changed',key,physics,pin['physicsSHA256'],f['tide'])
            # No observer or render is called between this state check and raw read.
            assert page.evaluate("()=>{const a=HonroApp,r=a.scene.canvas.getBoundingClientRect();return [a.scene.x,a.scene.y,a.scene.scale,a.scene.time,a.engine.b.phase,a.engine.b.round,devicePixelRatio,r.width,r.height];}") == [
                *[f['actual'][k] for k in ('x','y','scale')],f['sceneTime'],f['phase'],f['round'],1,f['css']['w'],f['css']['h']]
            raw=base64.b64decode(page.evaluate(PNG),validate=True)
            with Image.open(BytesIO(raw)) as im:
                assert list(im.size)==f['backing']
                im.verify()
            (out/f'{key}-aim-1-raw.png').write_bytes(raw)
            report['frames'][key]={'rawSHA256':sha(raw),'sameCameraAsArchivePngSHA256':pin['pngSHA256'],
                'sameAim1PhysicalStateSHA256':physics,**f,**obs}
            emit()
        visit['status']='BOUND_NATIVE_FAR_AND_OBSERVED_AIM1'
    except Exception as exc:
        visit['status']='HOLD';errs.append(['failure',repr(exc)])
    finally:
        emit();ctx.close()

def run(out):
    from playwright.sync_api import sync_playwright
    known=manifest(out)
    report={'stage':33,'frames':{},'visits':[],'history':'Archive probes are true App aim/1; no comparison to synthetic legacy high fixture.',
            'rounds2_5_7':'HOLD_NO_APPROVED_CANONICAL_REPLAY','status':'INIT'}
    try:
        with sync_playwright() as pw:
            b=pw.chromium.launch(headless=True);report['browser']=b.version
            assert b.version=='151.0.7922.34',('unexpected archive browser binary',b.version)
            for w,h in ((1440,900),(390,844)): capture(b,out,known,w,h,report)
            b.close()
        assert set(report['frames'])==set(POSES) and all(v['status']=='BOUND_NATIVE_FAR_AND_OBSERVED_AIM1' for v in report['visits'])
        report['status']='PASS_ESTUARY_AIM1_ONLY_HIGH_LOW_TRANSITIONS_HOLD'
    except Exception as exc:
        report.update(status='HOLD',error=repr(exc));raise
    finally:save(out/'RECEIPT.json',report)

if __name__=='__main__':
    mode=sys.argv[1];out=Path(sys.argv[2]);assert out.is_dir()
    if mode=='authority': authority(out)
    elif mode=='app': run(out)
    else: raise SystemExit('authority or app required')
