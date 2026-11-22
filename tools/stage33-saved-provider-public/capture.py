"""Real canonical 'save old art -> cold load -> continue' with disposable browser storage only."""
import base64,hashlib,json,math,sys,urllib.request
from pathlib import Path
from guard import P,need,rd,fact,sha,sv
D=Path(__file__).resolve().parent;O=json.loads(rd(D,'observer.json'))
A='http://127.0.0.1:18844/'; B='https://sys8994.github.io/honro/'; CUR=B
KEY='honro-first-act-profile-1'
SIG="""a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16)}"""
READ_SAVE="""arg=>{
 const a=HonroApp,b=a.engine?.b;
 if(!b||b.honroStage!==33||b.honroAct4Official!==1||b.honroCustom||b.mode!=='campaign'||a.profileStore.locked)throw Error('not actual saved canonical battle');
 if(a.persist()!==true)throw Error('legitimate native save failed');
 const text=localStorage.getItem(arg.key),p=JSON.parse(text),s=p.honroBattle;
 if(!s||s.honroStage!==33||s.honroAct4Official!==1||s.honroCustom||s.mode!=='campaign'||HonroCampaignMapRevision.obsolete(s))
  throw Error('actual profile revision not valid for canonical resume');
 const refs={};
 for(const x of [s.honroLandmarks,s.honroElements,s.honroEnvironment?.placements]){
  for(const v of x||[]){const a=v.asset;if(arg.ids.includes(a?.id)&&a.honroStaticAssetRef===1){if(refs[a.id]&&refs[a.id]!==a.signature)throw Error('mixed save refs');refs[a.id]=a.signature;}}
 }
 if(arg.ids.some(id=>!refs[id]))throw Error('normal profile writer did not emit both exact static refs');
 return {text,refs,revision:s.honroCampaignMapRevision,terrain:JSON.stringify(s.terrain),units:JSON.stringify(s.units),phase:s.phase,round:s.round};
}"""
NEG="""arg=>{
 const old=JSON.parse(arg.text).honroBattle,rows=arg.rows;
 const test=(f)=>{const b=structuredClone(old);f(b);const snap=JSON.stringify(b);return !HonroProfileStore.restoreBattleArt(b)&&JSON.stringify(b)===snap;};
 const own=b=>[...b.honroLandmarks||[],...b.honroElements||[],...b.honroEnvironment?.placements||[]].find(x=>x.asset?.id===arg.ids[0]&&x.asset.honroStaticAssetRef===1);
 return {wrongStage:test(b=>b.honroStage=34),wrongPrevious:test(b=>own(b).asset.signature='862760:4666d3c9'),
 custom:test(b=>b.honroCustom=true),workshop:test(b=>b.honroMapOrigin='workshop'),unofficial:test(b=>b.honroAct4Official=0)};
}"""
BATTLE="""arg=>{
 const a=HonroApp,b=a.engine.b,lib=HONRO_PROJECT.library;
 const sig=a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16)};
 const out={};for(const id of arg.ids){const provider=lib.find(a=>a.id===id),items=[...b.honroLandmarks||[],...b.honroElements||[],...b.honroEnvironment?.placements||[]].filter(k=>k.asset?.id===id);
 if(!provider||!items.length)throw Error('missing real imported stage owner '+id);out[id]={current:sig(provider),runtime:items.map(x=>sig(x.asset))};}
 return {stage:b.honroStage,mapId:HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===33)?.id,revision:b.honroCampaignMapRevision,
  expectedRevision:HonroCampaignMapRevision.current(33),terrain:JSON.stringify(b.terrain),units:JSON.stringify(b.units),phase:b.phase,round:b.round,official:b.honroAct4Official,refs:out,locked:a.profileStore.locked,rows:Object.fromEntries(arg.ids.map(id=>[id,HONRO_PREVIOUS_TERRAIN_ART[id]]))};
}"""
def request(url,p):
 req=urllib.request.Request(url,headers={'Accept-Encoding':'identity','User-Agent':'Mozilla/5.0 HONRO no-deploy observer'})
 with urllib.request.urlopen(req,timeout=45)as r:
  need(r.status==200 and r.geturl()==url and fact(r.read(p['bytes']+1))==p,('wrong direct served body',url))
 return p
def main(w):
 from playwright.sync_api import sync_playwright
 out=w/'out';S=json.loads(rd(out,'SOURCE.json'));G=json.loads(rd(out,'GRAPH.json'))
 q={'status':'HOLD','old':{},'runs':{},'peerHTTP':{}}
 def save():sv(w,'BROWSER.json',q)
 save()
 try:
  q['exactPublicRelease']=request(CUR+'web/manifest.json',{k:P['release']['manifest'][k]for k in ('bytes','sha256')});q['release']=P['release'];q['normal']=P['normal']
  q['publicActiveAlias']= {k:request(CUR+k,v)for k,v in G['publishedChangedSlots'].items()}
  q['publicRetainedPrior']= {k:request(CUR+k,v)for k,v in G['retainedPriorSlots'].items()}
  for id,rr in G['peers'].items():
   q['peerHTTP'][id]={k:request(CUR+k,v)for k,v in rr.items()}
  save()
  ids=list(P['rows'])
  def state(app):
   a={k:app[k]for k in ('stage','mapId','revision','expectedRevision','phase','round','official','refs','locked','rows')}
   a['terrainSha']=sha(app['terrain'].encode());a['unitsSha']=sha(app['units'].encode());return a
  with sync_playwright() as k:
   br=k.chromium.launch(headless=True);q['browser']=br.version;need(br.version=='151.0.7922.34','wrong browser fixture')
   def open(url,text=None,device='PC'):
    W,H=(1440,900)if device=='PC' else (390,844)
    c=br.new_context(viewport={'width':W,'height':H},device_scale_factor=1,service_workers='block')
    c.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
    if text is not None:c.add_init_script('localStorage.setItem('+json.dumps(KEY)+','+json.dumps(text)+');')
    p=c.new_page(); rs={}; errors=[]
    p.on('response',lambda r:rs.setdefault(r.url,r));p.on('pageerror',lambda e:errors.append(str(e)))
    nav=p.goto(url+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
    need(nav and nav.status==200 and nav.url==url+'HONRO.html' and not nav.from_service_worker,'actual shell not loaded')
    p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
    return c,p,rs,errors,nav
   def proof(rs,url,expected):
    data={}
    for path,k in expected.items():
     z=rs.get(url+path);need(z and z.status==200 and not z.from_service_worker,('native URL not loaded',path));data[path]=fact(z.body());need(data[path]==k,('native body mismatch',path))
    return data
   def shot(p,label):
    args={'id':33,'mapId':'stage-33','name':'east','dx':1,'dy':0,'readback':False,'fixedNow':O['PHASE']}
    pose=p.evaluate(O['FROZEN'],args)['meta']; p.evaluate(O['DECODE']); p.evaluate(O['FROZEN'],{**args,'readback':True})
    raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True);name=f'{label}-raw.png';(out/name).write_bytes(raw)
    return dict(raw=fact(raw),png=name,pose={k:pose[k]for k in ('actual','viewport','backing')})
   def paused(page):
    page.evaluate("()=>{const a=HonroApp;a.frame=()=>{};a.close();HonroStoryFraming.clear(a.scene);}")
   c,p,net,err,nav=open(A)
   try:
    p.evaluate(O['LAUNCH'],33)
    old=p.evaluate(READ_SAVE,{'key':KEY,'ids':ids})
    need(old['refs']=={i:r['previous']for i,r in P['rows'].items()},'not witnessed old compacted static signatures')
    q['old']={'save':fact(old['text'].encode()),'refs':old['refs'],'revision':old['revision'],'terrainSha':sha(old['terrain'].encode()),'unitsSha':sha(old['units'].encode()),'routes':proof(net,A,S['oldRoutes']),'shell':fact(nav.body()),'errors':err}
    need(q['old']['shell']=={k:P['oldShell'][k]for k in ('bytes','sha256')} and not err,'old genuine App had errors')
    q['old']['capture']=shot(p,'old-c60-generated-save');save()
   finally:c.close()
   # Fresh real installed package validates current saves separately from the old replay.
   c,p,net,err,nav=open(B)
   try:
    p.evaluate(O['LAUNCH'],33)
    cur=p.evaluate(READ_SAVE,{'key':KEY,'ids':ids})
    need(cur['refs']=={i:r['current']for i,r in P['rows'].items()},'fresh current art signatures changed')
    q['fresh']={'save':fact(cur['text'].encode()),'refs':cur['refs'],'revision':cur['revision'],'capture':shot(p,'candidate-fresh33'),'errors':err};need(not err,'fresh normal app errors');save()
   finally:c.close()
   for device,source,u,snapshot in [(v,k,B,s)for v in ('PC','M')for k,s in [('candidateOld',old),('candidateFresh',cur)]]:
    name=device+'-'+source
    c,p,net,err,nav=open(u,snapshot['text'],device)
    try:
     need(p.evaluate("()=>!HonroApp.profileStore.locked&&HonroApp.profile.honroBattle?.honroStage===33"),'cold normal storage could not read legitimate saved battle')
     p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}")
     p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===33&&HonroApp.engine.b.honroAct4Official===1",timeout=12000)
     paused(p);b=p.evaluate(BATTLE,{'ids':ids})
     status=state(b); q['runs'][name]={'status':'CAPTURED','battle':status,'errors':err,'capture':shot(p,name)}
     save()
     need(b['mapId']=='stage-33' and b['revision']==b['expectedRevision']==snapshot['revision'] and b['official']==1 and not b['locked'] and b['rows']==P['rows'],'actual revision or exact registry runtime mismatch')
     need(b['terrain']==snapshot['terrain'] and b['units']==snapshot['units'] and b['phase']==snapshot['phase'] and b['round']==snapshot['round'],'restored physical battle or actors changed, not a true resume')
     need(all(b['refs'][i]['current']==row['current'] and all(x==row['current']for x in b['refs'][i]['runtime'])for i,row in P['rows'].items()),'restored native field did not resolve to exact current provider')
     ex=P['normalReference'];t=q['runs'][name]['capture']
     need(status['revision']==ex['revision'] and status['terrainSha']==ex['terrain'] and status['unitsSha']==ex['units'],'public resume not same as qualified actual battle')
     need(t['raw']==ex['rawPC' if device=='PC' else 'rawM'] and t['pose']==ex['posePC' if device=='PC' else 'poseM'],'public frame not byte-exact qualified Stage33 art reference; preserve raw')
     expected={P['map']:G['peers']['33'][P['map']],P['newPacket']:G['peers']['33'][P['newPacket']],G['newCommon']:G['sha'],**G['currentShellRoutes']}
     q['runs'][name]['routes']=proof(net,u,expected);need(not err and fact(nav.body())==G['currentShell'],'normal restored App shell differed or errored')
     if name=='PC-candidateOld':
      neg=p.evaluate(NEG,{'text':old['text'],'ids':ids,'rows':P['rows']});q['negativeControls']=neg;need(all(neg.values()),'wrong prior token or owner state accepted')
     q['runs'][name]['status']='PASS';save()
    finally:c.close()
   br.close()
  q['status']='PASS_PUBLIC_STAGE33_OLD_NEW_RESUME_EXACT_NORMAL_GEOMETRY'
 finally:save()
if __name__=='__main__':main(Path(sys.argv[1]))
