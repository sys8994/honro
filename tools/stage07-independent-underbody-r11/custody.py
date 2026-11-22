"""Already visually verified chapter 7 source, one normal rebuild and byte custody. No writer."""
from guard import P,D,fact,stamp,need,read,save
from pathlib import Path
import hashlib,sys,json,subprocess,stat,io,zipfile
w=Path(sys.argv[1]); A,B=w/'A',w/'B';out=w/'out';q=P['approvedStage7R2']
api=lambda x:subprocess.check_output(['gh','api','repos/sys8994/honro/'+x],timeout=180)
a=json.loads(api('actions/runs/'+str(q['run'])));j=json.loads(api('actions/jobs/'+str(q['job'])));c=json.loads(api('git/commits/'+q['head']))
need(a['head_sha']==j['head_sha']==q['head'] and a['head_branch']==q['branch'] and a['conclusion']==j['conclusion']=='success' and j['run_id']==q['run'] and c['tree']['sha']==q['tree'] and [x['sha']for x in c['parents']]==[P['base']],'unverified standing actual B authority')
a=json.loads(api('actions/artifacts/'+str(q['artifact'])));need(a['workflow_run']['head_sha']==q['head'] and a['workflow_run']['id']==q['run'] and not a['expired'] and a['digest']=='sha256:'+q['zipped']['sha256'],'wrong final actual B archive')
data=api('actions/artifacts/'+str(q['artifact'])+'/zip');need(fact(data)==q['zipped'],'wrong outer A/B artifact bytes')
with zipfile.ZipFile(io.BytesIO(data)) as z:
 need(z.testzip() is None and sum(x.file_size for x in z.infolist())<80_000_000,'bad authoritative ZIP')
 for k,v in q['receipts'].items():need(fact(z.read(k))==v,'native/saves proof hash differed '+k)
 approved=json.loads(z.read('BROWSER.json')); src=json.loads(z.read('SOURCE.json'))
 need(approved['status']=='PASS_ACTUAL_STAGE07_R7_CHAPTER_CONTAINED_PENDING_ROOT' and all(x['priorNativeR7BExact'] and x['delta']['outside']==x['delta']['alpha']==0 for x in approved['views'].values())and
      approved['packageSave']['status']=='PASS_REAL_OLD_AND_FRESH_UI_CONTINUE_RESAVE' and approved['packetsCold']['status']=='PASS_COLD_PEERS_ZERO_STAGE7_NEW_DATA_WITH_STOCK_PREWARM' and
      approved['stage33Legacy']['status']=='ACTUAL_C60_STAGE33_RESTORE_EXACT' and src['head']==q['head'],'nonpassing actual A/B')
 for k in ('GRAPH.json','ORDERED-ROUTES-UNADJUDICATED.json'):
  need(read(out,k)==z.read(k),'rebuild not byte-identical to observed normal output graph '+k)
old=json.loads(read(A,'web/manifest.json')); new=json.loads(read(B,'web/manifest.json'))
mi={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in new['files']};oi={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in old['files']}
need(stamp(read(B,'web/manifest.json'))==P['expectedNormalManifest'],'full normal compiled manifest changed')
active=set(mi)-set(oi);need(active==set(P['exactNewActive']) and len(active)==9 and len(oi)==len(mi)==811,'unexpected active output inventory')
for k in active:
 item=mi[k];need(fact(read(B,k))==item and ('.'+item['sha256'][:16]+'.') in k,'invalid hashed new media '+k)
 expected=P['exactNewActive'][k]
 if expected:need(item==expected,'observed/predicted output body mismatch '+k)
need(all(mi[k]==oi[k] and fact(read(B,k))==mi[k] for k in set(oi)&set(mi)),'other active compiled bytes diverged')
need(all(k not in json.dumps(oi) for k in active),'duplicate output address')
shell={'HONRO.html','HONRO_WORKSHOP.html','index.html','web/manifest.json'}
sources=set(P['candidateSource'])
parts={k:read(B,k) for k in sources|shell|active}
need(len(parts)==16 and all(stamp(parts[k])==v['new'] for k,v in P['candidateSource'].items()),'candidate source mismatch')
p=out/'STAGE07-REVIEWED-NORMAL.zip'
with zipfile.ZipFile(p,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for k in sorted(parts):
  i=zipfile.ZipInfo(k);i.compress_type=zipfile.ZIP_DEFLATED;i.external_attr=0o100644<<16
  z.writestr(i,parts[k])
save(w,'CUSTODY.json',{'status':'REVIEWED_EXACT_NORMAL_BYTES_SEALED_NO_DEPLOY','originatingScope':q['head'],'normalRun':q['run'],'normalArchive':q['artifact'],'normalReceiptSHA':q['zipped']['sha256'],'base':P['base'],'producerHead':__import__('os').environ['GITHUB_SHA'],'parts':{k:stamp(v) for k,v in parts.items()},'oldActive':len(oi),'newActive':len(mi),'addsActive':sorted(active),'retiredActive':sorted(set(oi)-set(mi)),'protected':sorted(sources),'normalManifest':P['expectedNormalManifest'],'inner':stamp(p.read_bytes()),'noDeploy':True})
