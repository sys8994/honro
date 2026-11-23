"""Actual historical and canonical built localhost app; no intercepted assets."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from urllib.parse import urlsplit
from contextlib import ExitStack
import base64,json,os,sys,threading
from playwright.sync_api import sync_playwright
from guard import P,enabled,need,sha,fact,dump,read,idx,M
D=Path(__file__).resolve().parent; O=json.loads(read(D,'observer.json'))
KEY='honro-first-act-profile-1';BODY='approved40:body'
COMMON=r"""
 const collections=b=>[b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements];
 const own=(b,arg)=>collections(b).flatMap(q=>(q||[]).filter(x=>arg.ids.includes(x.asset?.id)));
 const valid=(b,n)=>Boolean(b&&b.honroStage===n&&b.honroCanonical===true&&b.honroCustom===false&&b.honroMapOrigin==='campaign'&&b.mode==='campaign'&&(n===40?b.honroAct4Official===1:b.honroAct5===1));
 const sig=a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16)};
 const content=b=>({terrain:JSON.stringify(b.terrain),units:JSON.stringify(b.units),objective:JSON.stringify([b.honroObjectives,b.objectives,b.honroQuestTargets,b.honroGoalState,b.honroEncounterState]),phase:b.phase,round:b.round,
   revision:b.honroCampaignMapRevision??null,handled:collections(b).map(a=>(a||[]).filter(x=>x.asset?.id).map(({asset,...keep})=>[asset.id,keep]))});
"""
PERSIST='arg=>{'+COMMON+r"""
 const a=HonroApp;let b=a.engine?.b;
 if(!valid(b,arg.stage)||a.profileStore.locked)throw Error('no legitimate exact native battle');
 if(a.persist()!==true)throw Error('normal save refused');
 const source=localStorage.getItem(arg.key),saved=JSON.parse(source),s=saved.honroBattle;
 if(!valid(s,arg.stage)||HonroCampaignMapRevision.obsolete(s))throw Error('actual persisted battle not saved/campaign obsolete');
 const list=own(s,arg);const rows={};for(const v of list){
   const a=v.asset;if(a.honroStaticAssetRef!==1)throw Error('target live owner did not compact into approved provider ref');
   if(rows[a.id]&&rows[a.id]!==a.signature)throw Error('one asset resolved multiple signatures');rows[a.id]=a.signature;
 }
 if(arg.ids.some(k=>!rows[k]))throw Error('missing actual old provider refs');
 return {text:source,refs:rows,state:content(s),placementOwners:list.length};
}"""
CHECK='arg=>{'+COMMON+r"""
 const a=HonroApp,b=a.engine?.b;
 if(!valid(b,arg.stage)||a.profileStore.locked)throw Error('actual app did not mount a canonical saved battle');
 const rows={};for(const k of arg.ids){const source=HONRO_PROJECT.library.filter(r=>r.id===k);if(source.length!==1)throw Error('nonunique live provider');
   const l=own(b,arg).filter(i=>i.asset.id===k);
   if(!l.length)throw Error('absent restored live provider');rows[k]={current:sig(source[0]),rendered:l.map(i=>sig(i.asset))};
 }
 const r33=Object.fromEntries(Object.keys(arg.rows33).map(k=>[k,HONRO_PREVIOUS_TERRAIN_ART[k]]));
 return {state:content(b),rows,r33};
}"""
TITLE_SAVE='arg=>{'+COMMON+r"""
 const a=HonroApp;const b=a.engine?.b;
 if(!valid(b,arg.stage)||a.profileStore.locked||a.screen!=='battle'||a.training||a.done)throw Error('stock title save unavailable in this state');
 const before=localStorage.getItem(arg.key);a.showTitle();
 const source=localStorage.getItem(arg.key),after=JSON.parse(source),s=after.honroBattle;
 const refs={};let entries=0;for(const v of own(s,arg)){
  if(v.asset.honroStaticAssetRef!==1)continue;
  entries++;if(refs[v.asset.id]&&refs[v.asset.id]!==v.asset.signature)throw Error('conflicting re-saved provider references');
  refs[v.asset.id]=v.asset.signature;
 }
 return {text:source,refs,state:content(s),placed:entries,path:{screen:a.screen,noMountedEngine:a.engine===null,storageChanged:source!==before,canonicalPersisted:valid(s,arg.stage),storeReady:a.profileStore.state.kind==='ready'&&!a.profileStore.state.lastWriteError}};
}"""

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,stock,allowed,**kw):
        self.allowed=allowed;super().__init__(*args,directory=str(stock),**kw)
    def send_head(self):
        u=urlsplit(self.path)
        if u.scheme or u.netloc or u.query or u.fragment or not u.path.startswith('/') or u.path[1:] not in self.allowed:self.send_error(404);return None
        return super().send_head()
    def log_message(self,*_):pass

def main(w):
    enabled();need(not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'anonymous native proof only')
    o=w/'out';norm=json.loads(read(o,'NORMAL-GRAPH.json'));files={}
    need(norm['status']=='PASS_EXACT_FORWARD_FALLBACK_NO_DEPLOY','no compiled authority')
    for a in 'HBCF':
        z=w/a;m=json.loads(read(z,M));entries=idx(m)
        campaign=m['project'];main=m['gameEntry'];stage=json.loads(read(z,campaign));packet=stage['stageLibraries'][39]
        src=next(x for x in m['common'] if x.startswith('web/runtime/campaign.'))
        reg=next(x for x in m['common'] if x.startswith('web/runtime/ordered-common-12.'))
        paths={main,campaign,src,reg,stage['stages'][39],packet}
        if a in 'BCF':
            peer=P['protectedStage42']['common5'];need(peer in m['common'],'missing protected live Stage42 save runtime');paths.add(peer)
        if '-parts.' in packet:paths.update(x['path']for x in json.loads(read(z,packet))['parts'])
        files[a]={'required':{k:entries[k]for k in paths},'all':entries,'shell':fact(read(z,'HONRO.html'))}
        for k,v in files[a]['required'].items():need(fact(read(z,k))==v,'before exact HTTP '+k)
    refs={'H':P['oldSigs'],'B':P['currentSigs'],'C':{**P['currentSigs'],BODY:P['candidateSig']},'F':P['currentSigs']}
    def opts(a):return {'key':KEY,'stage':40,'ids':list(refs[a]),'rows33':{}}
    result={'status':'HOLD','scope':'genuine bf6, df621, official archived C2 and built fallback disposable title saves, all cold into fallback','cases':{}}
    def flush():dump(o/'NATIVE-ACCEPTANCE.json',result)
    flush()
    try:
        with sync_playwright() as pw,ExitStack() as es:
            href={}
            for a in 'HBCF':
                z=w/a;allowed=set(files[a]['all'])|{'HONRO.html',M,'index.html','favicon.ico'}
                srv=es.enter_context(ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,stock=z,allowed=allowed)));srv.daemon_threads=True
                t=threading.Thread(target=srv.serve_forever,daemon=True);t.start();es.callback(srv.shutdown)
                href[a]=f'http://127.0.0.1:{srv.server_port}/'
            br=pw.chromium.launch(headless=True);es.callback(br.close)
            need(br.version==P['chromium'],'wrong authorized Chromium')
            def open_arm(a,wh,snap=None):
                c=br.new_context(viewport={'width':wh[0],'height':wh[1]},device_scale_factor=1,service_workers='block')
                try:
                    url=href[a];u=urlsplit(url);need(c.storage_state()=={'cookies':[],'origins':[]},'wrong pristine anonymous context')
                    c.route('**/*',lambda p:p.continue_()if p.request.url.startswith((url,'about:','data:','blob:'))else p.abort())
                    c.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
                    if snap is not None:
                        arg=[u.scheme+'://'+u.netloc,'/HONRO.html',KEY,snap]
                        c.add_init_script('((o,p,k,s)=>{if(location.origin===o&&location.pathname===p)localStorage.setItem(k,s);})(...'+json.dumps(arg)+');')
                    p=c.new_page();res={};errors=[];p.on('response',lambda v:res.setdefault(v.url,v));p.on('pageerror',lambda e:errors.append(str(e)))
                    nav=p.goto(url+'HONRO.html',wait_until='domcontentloaded',timeout=60000)
                    need(nav and nav.status==200 and nav.url==url+'HONRO.html' and not nav.from_service_worker and fact(nav.body())==files[a]['shell'],'wrong normal browser shell')
                    p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof globalThis.HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
                    p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
                    return c,p,res,errors
                except BaseException:c.close();raise
            def wait(p):p.wait_for_function("()=>globalThis.HonroApp?.engine?.b?.honroStage===40&&!HonroApp.profileStore.locked",timeout=45000)
            def routes(a,r,e):
                u=href[a];ret={}
                for k,v in files[a]['required'].items():
                    x=r.get(u+k);need(x and x.status==200 and not x.from_service_worker and fact(x.body())==v,'wrong actual active route '+a+' '+k);ret[k]=v
                need(not e,'current browser error '+a);return ret
            def export(p,a):
                out=p.evaluate(PERSIST,opts(a));need(out['refs']==refs[a],'wrong actual authored provider refs '+a)
                return out
            for dev,wh in [('PC',[1440,900]),('M',[390,844])]:
                acc={'fresh':{},'continue':{}};result['cases'][dev]=acc;saved={}
                for a in 'HBCF':
                    receipt=acc['fresh'][a]={'checkpoint':'open_native'};flush()
                    c,p,r,e=open_arm(a,wh)
                    try:
                        p.evaluate(O['LAUNCH'],40);wait(p);receipt['checkpoint']='stage40_native_ready';flush()
                        saved[a]=export(p,a)
                        receipt['save']={'digest':fact(saved[a]['text'].encode()),'refs':saved[a]['refs'],'placementOwners':saved[a]['placementOwners']}
                        receipt['routes']=routes(a,r,e);receipt['checkpoint']='complete';flush()
                    finally:c.close()
                need(saved['B']['state']==saved['C']['state']==saved['F']['state'],'fresh body changed durable game/placement state')
                for a in 'HBCF':
                    receipt=acc['continue'][a]={'checkpoint':'open_cold_title'};flush()
                    s=saved[a];c,p,r,e=open_arm('F',wh,s['text'])
                    try:
                        need(p.evaluate("(key)=>HonroApp.screen==='title'&&!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)&&localStorage.getItem(key)!==null",KEY) and p.evaluate("(key)=>localStorage.getItem(key)",KEY)==s['text'],'not exact genuine cold title input '+a)
                        receipt['checkpoint']='restore_exact_title';flush()
                        p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}");wait(p)
                        x=p.evaluate(CHECK,opts('F'))
                        need(x['state']==s['state'] and all(v['current']==refs['F'][k] and v['rendered'] and all(z==refs['F'][k]for z in v['rendered'])for k,v in x['rows'].items()),'genuine cold title C2 changed original state/provider '+a)
                        canon=p.evaluate(TITLE_SAVE,opts('F'))
                        z=canon['path']
                        need(z['screen']=='title' and z['noMountedEngine'] and z['canonicalPersisted'] and z['storeReady'] and canon['refs']==refs['F'] and canon['state']==s['state'],'canonical native title re-save changed exact battle '+a)
                        if a in 'HC':need(z['storageChanged'],'old/C2 profile not rewritten to exact fallback token')
                        receipt.update({'checkpoint':'complete','input':fact(s['text'].encode()),'reSaved':fact(canon['text'].encode()),'refs':canon['refs'],'routes':routes('F',r,e)})
                        flush()
                    finally:c.close()
        result['status']='PASS_EXACT_FALLBACK_ALL_DEVICE_SAVES_FROM_C2_AND_OLDER';flush()
    except BaseException as e:
        result['firstError']=repr(e);flush();raise

if __name__=='__main__':main(Path(sys.argv[1]).resolve(strict=True))
