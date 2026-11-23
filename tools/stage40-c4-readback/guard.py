"""Exact released predecessor/current graph; only official read-only Actions and local worktree."""
from pathlib import Path
import hashlib,io,json,os,re,subprocess as sp,sys
D=Path(__file__).resolve().parent; P=json.loads((D/'PINS.json').read_bytes())
R=P['refs']; M='web/manifest.json'
def need(q,m):
 if not q:raise RuntimeError(m)
def fact(b):return dict(bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def save(p,v):p.write_text(json.dumps(v,indent=2)+'\n')
def git(root,*args):return sp.check_output(['git','-C',str(root),*args],timeout=180,text=True).strip()
def api(k):return json.loads(sp.check_output(['gh','api','repos/'+P['repo']+'/'+k],timeout=90))
def read(root,k):
 p=root/k
 need(p.is_file() and not p.is_symlink() and p.resolve().is_relative_to(root.resolve()),'bad path '+k)
 return p.read_bytes()
def pages(release):
 r=api('actions/runs/'+str(release['run']));j=api('actions/jobs/'+str(release['job']))
 need(r['name']=='pages build and deployment'and r['head_branch']=='master'and r['head_sha']==j['head_sha']==release['head']and r['conclusion']==j['conclusion']=='success'and j['run_id']==r['id']and j['name']=='deploy','wrong exact Pages')
 return j['completed_at']
def authority(w):
 need(P['enabled'] is True,'DISABLED until exact QA reviewed and armed')
 need((os.environ.get('GITHUB_REPOSITORY'),os.environ.get('GITHUB_REF'),os.environ.get('GITHUB_EVENT_NAME'))==(P['repo'],'refs/heads/'+P['branch'],'push'),'unexpected QA scope')
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve();q=os.environ['GITHUB_SHA']
 need(w.name=='stage40-c4-readback'and w.parent==Path(os.environ['RUNNER_TEMP']).resolve(),'bad scratch')
 scope={'.github/workflows/stage40-c4-readback.yml',*('tools/stage40-c4-readback/'+x for x in ('guard.py','capture.py','PINS.json','observer.json'))}
 b=R['B']['head'];live=P['pubC'];need(git(root,'show','-s','--format=%P',q)==live['head'] and not git(root,'status','--porcelain') and set(git(root,'diff','--name-status','--no-renames',live['head'],q).splitlines())=={'A\t'+x for x in scope},'not exact 5 ADD QA')
 need(git(root,'rev-parse',live['head']+'^{tree}')==live['tree'],'wrong fixed C product tree')
 need(sp.run(['git','-C',str(root),'merge-base','--is-ancestor',b,live['head']],timeout=45).returncode==0,'C does not descend from B')
 liveStamp=pages(live)
 w.mkdir();(w/'out').mkdir()
 out={};projects={};memo={};payloads={}
 for k,p in R.items():
  stamp=pages(p);need(git(root,'rev-parse',p['head']+'^{tree}')==p['tree'],'wrong product tree')
  src=w/k;git(root,'worktree','add','--detach',str(src),p['head'])
  man=read(src,M);need(blob(man)==p['manifestGit']and len(man)==p['manifestBytes'],'wrong retained manifest')
  raw=json.loads(man);active={n['path']:{v:n[v]for v in ('bytes','sha256')}for n in raw['files']}
  shell=read(src,'HONRO.html')
  entry='web/entries/game.'+p['entry']+'.js'
  data='web/data/campaign.'+p['campaign']+'.json'
  rts=[f'web/runtime/{x}.{p[y]}.js'for x,y in (('ordered-game-24','owner'),('ordered-common-5','common5'),('ordered-common-12','common12'),('campaign','campaignOwner'))]
  eb=read(src,entry)
  need(shell.count(entry.encode())==1 and all(eb.count(x.removeprefix('web/').encode())==1 for x in rts),'wrong actively bound runtime')
  need(read(src,rts[-1]).count(data.encode())==1,'wrong actively bound campaign')
  c=projects[k]=json.loads(read(src,data))
  need(len(c['stages'])==len(c['stageLibraries'])==50 and c['stages'][39]==P['map']and c['stageLibraries'][39]==p['packet'],'wrong Stage40 map/library')
  packet=read(src,p['packet']);pack=json.loads(packet);chunks=[]
  if k=='A':
   need(pack['$honroJsonParts']==1 and len(pack['parts'])==3,'wrong old split shape')
   chunks=[x['path']for x in pack['parts']]
   need(len(set(chunks))==3,'duplicate packet parts')
   for x in pack['parts']:need(fact(read(src,x['path']))=={z:x[z]for z in ('bytes','sha256')},'wrong old part')
   joined=b''.join(read(src,n)for n in chunks)
   need(len(joined)==p['joinedBytes']==pack['bytes']and fact(joined)['sha256']==p['joinedSha']==pack['sha256'],'wrong old joined bytes')
  else:
   joined=packet
   need(pack['version']==1 and len(joined)==p['joinedBytes']and blob(joined)==p['packetGit'],'wrong current Stage40 compact single packet')
   native=read(src,rts[2]).decode()
   compiled={a:(old,json.loads(mid),new) for a,old,mid,new in re.findall(r'"(approved40:[^"]+)":\{stage:40,previous:"([^"]+)",previousOptimized:(\[[^\]]*\]),current:"([^"]+)"\}',native)}
   need(set(compiled)==set(P['registry']),'wrong new Stage40 signed registry scope')
   need(all(prev==current and a in [original,*opt] and o in [original,*opt]for k,(o,a,current)in P['registry'].items()for original,opt,prev in [compiled[k]]),'wrong exact Stage40 restore signature')
   memo['compiledStage40Registry']=compiled
  records={}
  for f in [entry,*rts,data,P['map'],p['packet'],*chunks]:
   kf=fact(read(src,f));need(active[f]==kf and kf['sha256'][:16]==f.split('.')[-2],'active token/source hash mismatch '+f);records[f]=kf
  f=w/(k+'-current-pool.json');f.write_bytes(joined);payloads[k]=str(f)
  out[k]={'shell':fact(shell),'manifest':fact(man),'files':records,'payload':fact(joined),'deployedAt':stamp}
 c0,c1=projects['A'],projects['B']
 need(c0['stages']==c1['stages']and [i+1 for i,(a,b)in enumerate(zip(c0['stageLibraries'],c1['stageLibraries']))if a!=b]==[40]and all(c0[k]==c1[k]for k in c0.keys() if k.startswith('compatibility')),'Stage40 release fixture scope differs')
 # 3c itself used precisely the bf6 assets and save rules; don't replay a redundant historical launch.
 h=P['sameOldBuild'];old40=[P['map'],R['A']['packet'],*filter(lambda k:'chapter-40-assets-part-'in k,out['A']['files']),*(f'web/runtime/{x}.{R["A"][y]}.js'for x,y in (('ordered-game-24','owner'),('ordered-common-5','common5'),('ordered-common-12','common12'),('campaign','campaignOwner')))]
 need(all(git(root,'rev-parse',h+':'+n)==git(root,'rev-parse',R['A']['head']+':'+n)for n in old40),'3c and bf6 old Stage40 providers are not identical')
 report=clip_consumers(w,payloads)
 save(w/'out'/'CLIP-CONSUMERS.json',report)
 need(report['changedAssets']==sorted(P['registry']) and not report['unsafeStructureChanges'],'unexpected changed ownership, palette, transforms or non-target file in payload')
 out['C']=live_scope(root,w,live,liveStamp,out['B'],projects['B'])
 save(w/'out'/'AUTHORITY.json',{'refs':R,'publicC':live,'actual':out,'source':memo,'threeCVerifiedOldAliasScope':old40,'noDeploy':True})
def live_scope(root,w,p,stamp,built,d0):
 # C has its own frozen entry and profile chunk. No current master or live shell read in this phase.
 man=read(root,M);need(len(man)==p['manifestBytes']and blob(man)==p['manifestGit'],'wrong C retained manifest')
 aa={z['path']:{x:z[x]for x in ('bytes','sha256')}for z in json.loads(man)['files']}
 s=read(root,'HONRO.html');e='web/entries/game.'+p['entry']+'.js';d='web/data/campaign.'+p['campaign']+'.json'
 rs=[f'web/runtime/{k}.{p[q]}.js'for k,q in (('ordered-game-24','owner'),('ordered-common-5','common5'),('ordered-common-12','common12'),('campaign','campaignOwner'))]
 entry=read(root,e)
 need(s.count(e.encode())==1 and all(entry.count(k.removeprefix('web/').encode())==1 for k in rs)and read(root,rs[-1]).count(d.encode())==1,'wrong C bound entry/runtime')
 c=json.loads(read(root,d))
 need(c['stages']==d0['stages']and [i+1 for i,(x,y)in enumerate(zip(c['stageLibraries'],d0['stageLibraries']))if x!=y]==[43,50] and c['stageLibraries'][39]==p['packet'],'C does not own exactly same Stage40 geometry bundle')
 frozen=[P['map'],p['packet'],rs[0],rs[2]]
 need(all(fact(read(root,k))==built['files'][k]for k in frozen),'C Stage40 installed provider, map, owner or registry differs')
 f='shared/runtime/profile-store.js'
 def restore(area):
  a=read(area,f).decode();return a[a.index('function restoreBattleArt('):a.index('function failure(',a.index('function restoreBattleArt('))]
 old,new=restore(w/'B'),restore(root)
 need(old==new and 'knownSignature=optimized?.previous===ref.signature' in new,'C Act4 restore body differs')
 keys=[e,d,*rs,P['map'],p['packet']];records={}
 for k in keys:
  v=fact(read(root,k));need(v==aa[k] and v['sha256'][:16]==k.split('.')[-2],'C active token hash mismatch '+k);records[k]=v
 return {'shell':fact(s),'manifest':fact(man),'files':records,'payload':built['payload'],'deployedAt':stamp,'sameStage40AsB':frozen,'sameRestoreBodySHA':fact(new.encode())['sha256']}
def clip_consumers(w,paths):
 js=r"""
 import fs from 'node:fs';
 import {pathToFileURL} from 'node:url';
 import {createHash} from 'node:crypto';
 const args=process.argv.slice(1);
 const {unpackJson}=await import(pathToFileURL(args[0]));
 const packet=f=>unpackJson(JSON.parse(fs.readFileSync(f,'utf8')));
 const map=JSON.parse(fs.readFileSync(args[3],'utf8'));
 const A=packet(args[1]),B=packet(args[2]);const enc=JSON.stringify;
 const hash=x=>createHash('sha256').update(enc(x)).digest('hex');
 const equal=(a,b)=>enc(a)===enc(b);
 const idx=a=>new Map(a.map(z=>[z.id,z]));
 const am=idx(A),bm=idx(B),equality=equal([...am.keys()],[...bm.keys()])&&am.size===A.length&&bm.size===B.length;
 const unsafeStructureChanges=equality?[]:['provider order/duplicate identity'];
 const vectorHdr=a=>{const {root,symbols,clips,...rest}=a.vector;return rest;};
 const hdr=a=>{const {vector,...z}=a;return z;};
 const mask=n=>{const {d,dParts,children,...z}=n;return children?{...z,children:children.map(mask)}:z;};
 const symbols=v=>Object.fromEntries(Object.entries(v.symbols??{}).map(([k,v])=>[k,mask(v)]));
 const mul=(a,b)=>!b?a:[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
 function consumers(o){
  const v=o.vector,rows=[],uses=[];
  const walk=(n,path,T,chain,symbolStack=[])=>{
    T=mul(T,n.transform);
    if(n.clipPath){
      const next={name:n.clipPath,node:path,tag:n.tag,affine:T,inheritedClips:chain.map(x=>x.name),symbolStack};
      rows.push(next);chain=[...chain,next];
    }
    if(n.tag==='use'){
      const s=v.symbols?.[n.symbol];
      if(!s||symbolStack.includes(n.symbol))throw Error('missing or cyclic active symbol '+o.id);
      const inheritedBeforeUse=n.clipPath?chain.length-1:chain.length;
      uses.push({node:path,symbol:n.symbol,ownClip:n.clipPath??null,symbolOwnClip:s.clipPath??null,inheritedClipCount:inheritedBeforeUse,
        inheritedClips:chain.slice(0,inheritedBeforeUse).map(x=>x.name),affine:T,nesting:symbolStack.length});
      walk(s,path+'@'+n.symbol,T,chain,[...symbolStack,n.symbol]);
    }
    for(const [i,c]of (n.children??[]).entries())walk(c,path+'.'+i,T,chain,symbolStack);
  };
  for(const loc of map.elements.filter(z=>z.assetId===o.id)){
   const s=loc.scale??1,t=loc.rotation??0;
   if(t!==0||o.anchor?.x!==0||o.anchor?.y!==0)throw Error('nontrivial placement cannot claim exact register '+o.id);
   walk(v.root,loc.id+':r',[s,0,0,s,loc.x,loc.y],[]);
  }
  return {rows,uses};
 }
 const changedAssets=[],clips={},assetBytes={};
 for(const [id,a]of am){
  const b=bm.get(id);if(!b||equal(a,b))continue;
  changedAssets.push(id);assetBytes[id]=[Buffer.byteLength(enc(a)),Buffer.byteLength(enc(b))];
  if(!a.vector||!b.vector){unsafeStructureChanges.push(id+':non-vector');continue;}
  const va=a.vector,vb=b.vector, ca=consumers(a),cb=consumers(b), old=va.clips??{}, now=vb.clips??{};
  if(!equal(hdr(a),hdr(b))||!equal(vectorHdr(a),vectorHdr(b))||!equal(mask(va.root),mask(vb.root))||!equal(symbols(va),symbols(vb))||
     !equal(ca,cb)||!equal(Object.keys(old),Object.keys(now)))unsafeStructureChanges.push(id);
  const changed=Object.keys(old).filter(n=>!equal(old[n],now[n])).map(n=>({
    name:n,oldSHA:hash(old[n]),newSHA:hash(now[n]),consumers:ca.rows.filter(x=>x.name===n),
    fromPotentiallyOmittedUses:ca.uses.filter(x=>x.symbolOwnClip===n&&(x.nesting>0||!x.inheritedClipCount||x.ownClip))
  }));
  clips[id]={changed,actualReachableUses:ca.uses};
 }
 console.log(enc({scope:'Exact active compiled A/B, all active use instances; cumulative raw world CTM, not shape-intersection or render equivalence',changedAssets:changedAssets.sort(),clips,unsafeStructureChanges,assetBytes,activeOwners:A.length}));
 """
 return json.loads(sp.check_output(['node','--input-type=module','-e',js,str(w/'A/shared/json-pool.mjs'),paths['A'],paths['B'],str(w/'A'/P['map'])],timeout=90))
if __name__=='__main__':authority(Path(sys.argv[1]).resolve())
