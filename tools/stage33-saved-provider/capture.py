"""Real canonical 'save old art -> cold load -> continue' with disposable browser storage only."""
import base64,hashlib,json,math,sys,urllib.request
from pathlib import Path
from guard import P,need,rd,fact,sha,sv
D=Path(__file__).resolve().parent;O=json.loads(rd(D,'observer.json'))
A='http://127.0.0.1:18844/'; B='http://127.0.0.1:18843/'; CUR='https://sys8994.github.io/honro/'
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
  q['exactPublic342']=request(CUR+'web/manifest.json',{k:P['manifest'][k]for k in ('bytes','sha256')})
  for id,rr in G['peers'].items():
   q['peerHTTP'][id]={k:{'current':request(CUR+k,v),'candidate':request(B+k,v)}for k,v in rr.items()}
  save()
  ids=list(P['rows'])
  def state(app):
   a={k:app[k]for k in ('stage','mapId','revision','expectedRevision','phase','round','official','refs','locked','rows')}
   a['terrainSha']=sha(app['terrain'].encode());a['unitsSha']=sha(app['units'].encode());return a
  with sync_playwright() as k:
   br=k.chromium.launch(headless=True);q['browser']=br.version;need(br.version=='151.0.7922.34','wrong browser fixture')
   def open(url,text=None,shell='HONRO.html'):
    c=br.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,service_workers='block')
    c.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
    if text is not None:c.add_init_script('localStorage.setItem('+json.dumps(KEY)+','+json.dumps(text)+');')
    p=c.new_page(); rs={}; errors=[]
    p.on('response',lambda r:rs.setdefault(r.url,r));p.on('pageerror',lambda e:errors.append(str(e)))
    nav=p.goto(url+shell,wait_until='domcontentloaded',timeout=50000)
    need(nav and nav.status==200 and nav.url==url+shell and not nav.from_service_worker,'actual shell not loaded')
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
   # Independently generate the 2c4 save in that original immutable app, not by token edit.
   c,p,net,err,nav=open(A,shell='OLD-2C4.html')
   try:
    p.evaluate(O['LAUNCH'],33)
    older=p.evaluate(READ_SAVE,{'key':KEY,'ids':ids})
    old_expect={i:r.get('previousOptimized',r['previous'])for i,r in P['rows'].items()}
    need(older['refs']==old_expect and older['revision']==5,'not 2c4 exact real compact save')
    q['old2c4']={'save':fact(older['text'].encode()),'refs':older['refs'],'revision':older['revision'],
      'terrainSha':sha(older['terrain'].encode()),'unitsSha':sha(older['units'].encode()),'routes':proof(net,A,S['2c4Routes']),
      'shell':fact(nav.body()),'errors':err,'capture':shot(p,'old-2c4-generated-save')}
    need(q['old2c4']['shell']=={k:S['2c4Shell'][k]for k in ('bytes','sha256')} and not err,'2c4 original app/shell differed')
    save()
   finally:c.close()
   # Public 342: show real existing app rejects 2c4, leaves legitimate prior saved progress untouched.
   c,p,net,err,nav=open(CUR,older['text'])
   try:
    p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}")
    p.wait_for_function("()=>document.getElementById('notice')?.textContent?.includes('저장된 장의 그림 자료를 불러오지 못했습니다.')",timeout=12000)
    rec=p.evaluate("""key=>({locked:HonroApp.profileStore.locked,notMounted:HonroApp.engine==null,
      bytesIntact:localStorage.getItem(key),notice:document.getElementById('notice').textContent})""",KEY)
    need(rec['notMounted'] and rec.pop('bytesIntact')==older['text'] and not err,'current official rejection or saved preservation not witnessed')
    rr=G['peers']['33'];q['public342Rejection']={**rec,'routes':proof(net,CUR,rr),'savedBytesUnchanged':True}
    p.screenshot(path=str(out/'public342-2c4-native-block.png'));save()
   finally:c.close()
   # Fresh real installed package validates current saves separately from the old replay.
   c,p,net,err,nav=open(B)
   try:
    p.evaluate(O['LAUNCH'],33)
    cur=p.evaluate(READ_SAVE,{'key':KEY,'ids':ids})
    need(cur['refs']=={i:r['current']for i,r in P['rows'].items()},'fresh current art signatures changed')
    q['fresh']={'save':fact(cur['text'].encode()),'refs':cur['refs'],'revision':cur['revision'],'capture':shot(p,'candidate-fresh33'),'errors':err};need(not err,'fresh normal app errors');save()
   finally:c.close()
   for name,u,snapshot in [('candidate2c4',B,older),('candidateC60',B,old),('candidateFresh',B,cur)]:
    c,p,net,err,nav=open(u,snapshot['text'])
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
     expected={P['map']:G['peers']['33'][P['map']],P['newPacket']:G['peers']['33'][P['newPacket']],G['newCommon']:G['sha']}
     q['runs'][name]['routes']=proof(net,u,expected);need(not err,'normal restored App errors')
     if name in ('candidate2c4','candidateC60'):
      neg=p.evaluate(NEG,{'text':snapshot['text'],'ids':ids,'rows':P['rows']});q.setdefault('negativeControls',{})[name]=neg;need(all(neg.values()),'wrong prior token or owner state accepted')
     if name!='candidate2c4':need(q['runs'][name]['capture']['raw']==P['knownCurrentPC'],'prior c60/current normal visual regression')
     q['runs'][name]['status']='PASS';save()
    finally:c.close()
   br.close()
  q['status']='PASS_STAGE33_2C4_REPRODUCED_AND_SCOPED_RECOVERY'
 finally:save()
if __name__=='__main__':main(Path(sys.argv[1]))
