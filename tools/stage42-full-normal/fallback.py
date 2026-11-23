"""Exact 3032 fallback, one Stage42 prior-provider signature only. No deployment."""
import normal as n
from pathlib import Path
import sys
P=n.P
def splice(raw,mode):
 a,b,tail,key={
  'source':(b"['1864834:f80cec75','1858841:5ce4a412']",b"current==='1382117:dec691ec';",b'\n function restoreBattleArt(',b"'"),
  'compiled':(b'["1864834:f80cec75","1858841:5ce4a412"]',b'current==="1382117:dec691ec"',b'function restoreBattleArt(',b'"'),
 }[mode]
 start=raw.index(b'function mayRestoreStage42CompactedArt(')
 end=raw.index(tail,start);block=raw[start:end]
 n.need(block.count(a)==block.count(b)==1,'fallback canonical signature code drift')
 insert=a[:-1]+b','+key+P['full']['signature'].encode()+key+b']'
 new=block.replace(a,insert)
 n.need(new.replace(insert,a)==block,'fallback scope not reversible')
 return raw[:start]+new+raw[end:]
def apply(repo,out):
 f='shared/runtime/profile-store.js';old=(repo/f).read_bytes()
 x=P['arms']['B']
 n.need(n.git(repo,'rev-parse','HEAD')==x['head'] and n.git(repo,'rev-parse','HEAD^{tree}')==x['tree'] and not n.git(repo,'status','--porcelain'),'fallback parent changed')
 n.need(n.blob(old)==P['profilePatch']['beforeGit'] and n.sha(old)==P['profilePatch']['beforeSHA256'],'fallback stock source changed')
 new=splice(old,'source');n.need(n.rich(new)==P['fallback']['source'],'fallback source not exact approved local VM')
 (repo/f).write_bytes(new)
 n.need(n.git(repo,'diff','--name-status','--no-renames','HEAD')=='M\t'+f,'fallback not isolated single source')
 n.receipt(out/'FALLBACK-SOURCE.json',{'base':x['head'],'source':f,'before':n.rich(old),'after':n.rich(new),'currentProvider':P['fallback']['owner']})
def graph(base,cand,out):
 a=n.rd(base/'web/manifest.json'); b=n.rd(cand/'web/manifest.json')
 n.need(n.blob((base/'web/manifest.json').read_bytes())==P['arms']['B']['manifestGit'],'fallback base manifest identity')
 c=n.rd(base/a['project']); n.need(a['project']==b['project'] and len(c['stages'])==50 and len(c['stageLibraries'])==50 and c['stageLibraries'][41]==P['arms']['B']['provider'] and c['stages'][41]==P['arms']['B']['map'],'fallback campaign/provider changed')
 aF={i['path']:i for i in a['files']};bF={i['path']:i for i in b['files']}
 current=P['beforeCommon5']['path']; changes=[(x,y) for x,y in zip(a['common'],b['common']) if x!=y]
 n.need(len(a['common'])==len(b['common']) and len(changes)==1 and changes[0][0]==current and a['gameOnly']==b['gameOnly'],'fallback compiled modules changed outside common5')
 new=changes[0][1];old=(base/current).read_bytes();now=(cand/new).read_bytes()
 n.need(n.blob(old)==P['beforeCommon5']['git'] and now==splice(old,'compiled') and n.rich(now)==P['fallback']['compiled'],'fallback common5 differs from pinned exact splice')
 oa,nb=a['playtest'].split('?')[0],b['playtest'].split('?')[0]
 oldA={current,a['gameEntry'],a['workshopEntry'],oa};newA={new,b['gameEntry'],b['workshopEntry'],nb}
 n.need(len(oldA)==len(newA)==4 and set(aF)-set(bF)==oldA and set(bF)-set(aF)==newA,'fallback active graph not exact ±4')
 for k in set(aF)&set(bF):n.need(aF[k]==bF[k] and (base/k).read_bytes()==(cand/k).read_bytes(),'other fallback wire changes '+k)
 for k in (*c['stages'],*c['stageLibraries'],a['project']):n.need((base/k).read_bytes()==(cand/k).read_bytes(),'fallback changed maps/providers '+k)
 pruned=set(n.git(cand,'diff','--name-status','--no-renames','HEAD').splitlines())
 required={'M\t'+k for k in ('HONRO.html','index.html','HONRO_WORKSHOP.html','web/manifest.json','shared/runtime/profile-store.js')}
 n.need(required<=pruned and all(k.startswith('D\t') and k[2:] in n.registry(a) for k in pruned-required),'fallback unauthorized tracked changes')
 n.need(set(n.git(cand,'ls-files','--others','--exclude-standard').splitlines())==newA,'fallback unauthorized outputs')
 keys={'gameEntry','workshopEntry','playtest','common','files','previousFiles','previousGenerations','publishedGenerations'}
 n.need({k:v for k,v in a.items() if k not in keys}=={k:v for k,v in b.items() if k not in keys},'fallback manifest runtime changes')
 n.assert_alias_diff(base,cand,a['gameEntry'],b['gameEntry'],[(current,new)])
 n.workshop_alias(base,cand,a,b,aF,bF,[(current,new)],oa,nb,out)
 for x in ('index.html','HONRO.html','HONRO_WORKSHOP.html'):n.assert_alias_diff(base,cand,x,x,[(a['gameEntry'],b['gameEntry']),(a['workshopEntry'],b['workshopEntry'])])
 n.assert_alias_diff(base,cand,oa,nb,[(a['gameEntry'],b['gameEntry'])])
 e=(cand/b['gameEntry']).read_bytes()
 loaders=[k for k in b['common'] if k.startswith('web/runtime/campaign.') and k.split('/')[-1].encode() in e]
 n.need(len(loaders)==1 and b['project'].encode() in (cand/loaders[0]).read_bytes(),'fallback browser campaign adapter disconnected')
 active=[b['game'],b['gameEntry'],b['project'],c['stages'][41],c['stageLibraries'][41],P['stageFar']['path'],P['stageFar']['config'],loaders[0],new]
 n.need(active[0]=='HONRO.html' and len(set(active))==len(active) and all(k in bF for k in active[1:]),'fallback missing required network authority')
 n.receipt(out/'FALLBACK-GRAPH.json',{'status':'PASS_EXACT_FALLBACK_GRAPH','activeAdded':sorted(newA),'activeReplaced':sorted(oldA),
   'all50MapsAndProvidersExact':True,'manifestSHA256':n.sha((cand/'web/manifest.json').read_bytes()),
   'routeSHA256':{k:n.sha(n.exact_route(cand,k,bF)) for k in active},'currentProvider':P['fallback']['owner']})
if __name__=='__main__':
 mode=sys.argv[1]
 op=apply if mode=='apply' else graph if mode=='graph' else None
 n.need(op is not None,'unsupported fallback argument')
 op(*(Path(x).resolve() for x in sys.argv[2:]))
