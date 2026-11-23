"""Two exact author paths plus one precise Stage42 save guard. No deployment."""
import ast, hashlib, json, os, shutil, subprocess, sys
from pathlib import Path
D=Path(__file__).resolve().parent; P=json.loads((D/'PINS.json').read_bytes())
def need(t,x):
 if not t:raise RuntimeError(x)
def sha(raw):return hashlib.sha256(raw).hexdigest()
def blob(raw):return hashlib.sha1(f'blob {len(raw)}\0'.encode()+raw).hexdigest()
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],text=True).strip()
def rd(p):return json.loads(p.read_bytes())
def receipt(path,data):path.write_text(json.dumps(data,indent=2)+'\n')
def apply(root,derived,out):
 orig=P['arms']['B'];p=P['profilePatch']; signed=P['full']['files']
 need(git(root,'rev-parse','HEAD')==orig['head'] and git(root,'rev-parse','HEAD^{tree}')==orig['tree'] and not git(root,'status','--porcelain'),'unsigned worktree')
 recipe=rd(derived/'DERIVATION.json')['candidates']['full']
 need(recipe['signature']==P['full']['signature'] and recipe['files']==signed,'art derivation mismatch')
 fixed='shared/runtime/profile-store.js';target=root/fixed; old=target.read_bytes()
 need(blob(old)==p['beforeGit'],'wrong current profile-store')
 s=old.decode();start=s.index('function mayRestoreStage42CompactedArt(');end=s.index('\n function restoreBattleArt(',start)
 a="['1864834:f80cec75','1858841:5ce4a412']";b="current==='1382117:dec691ec';"
 cut=s[start:end];need(cut.count(a)==cut.count(b)==1,'ambiguous guard scope')
 patched=s[:start]+cut.replace(a,"['1864834:f80cec75','1858841:5ce4a412','1382117:dec691ec']").replace(b,"current==="+repr(P['full']['signature'])+";")+s[end:]
 raw=patched.encode();need(blob(raw)==p['afterGit'] and sha(raw)==p['afterSHA256'],'candidate guard differs')
 source={k:s for k,s in signed.items() if k!='packet.qa.json'}
 need(set(source)=={'shared/assets/environment/act5/stage42-near-simplified.json','shared/assets/environment/act5/stage42-surface.json'},'bad author paths')
 for k,v in source.items():
  rawArt=(derived/'full'/k).read_bytes();need(blob(rawArt)==v['git'] and len(rawArt)==v['bytes'] and sha(rawArt)==v['sha256'],'exact author mismatch '+k)
  (root/k).write_bytes(rawArt)
 target.write_bytes(raw)
 need(set(git(root,'diff','--name-status','--no-renames','HEAD').splitlines())=={'M\t'+i for i in [*source,fixed]},'unsigned source changes')
 receipt(out/'SOURCE.json',{'base':orig['head'],'modified':{**source,fixed:p},'rollbackStatus':'UNVERIFIED_BARE_BF6_REJECTS_SUCCESSOR_SAVE'})
def graph(base,candidate,out):
 old=rd(base/'web/manifest.json'); cand=rd(candidate/'web/manifest.json')
 a=rd(base/old['project']);b=rd(candidate/cand['project'])
 need(len(a['stages'])==len(b['stages'])==50 and a['stages']==b['stages'],'physical stage map aliases changed')
 need(all((base/x).read_bytes()==(candidate/x).read_bytes() for x in a['stages']),'physical stage wire maps changed')
 need(len(a['stageLibraries'])==len(b['stageLibraries'])==50 and all(x==y for k,(x,y) in enumerate(zip(a['stageLibraries'],b['stageLibraries'])) if k!=41),'other stage provider aliases changed')
 for k in ('base','shared','editorExtras','libraryOrder','assetEncodings','compatibility32','compatibility33','compatibility34'):
  need(a.get(k)==b.get(k),'out of scope campaign graph field '+k)
 fo={x['path']:x for x in old['files']};fn={x['path']:x for x in cand['files']}
 pe=set(fo)&set(fn)
 need(all(fo[k]['sha256']==fn[k]['sha256'] for k in pe),'same URI changed content')
 for i in ('common','gameOnly'):
  need(len(old[i])==len(cand[i]),'runtime module partition length changed '+i)
 oldset=list(a['stageLibraries']);oldset.pop(41)
 need(all((base/x).read_bytes()==(candidate/x).read_bytes() for x in oldset),'other 49 provider descriptors changed')
 expected=P['full']['files']['packet.qa.json'];packet='web/data/chapter-42-assets.'+expected['sha256'][:16]+'.json'
 need(b['stageLibraries'][41]==packet and b['assetEncodings']['stageLibraries'][41]=='json','wrong new native packet')
 r=(candidate/packet).read_bytes()
 need(len(r)==expected['bytes'] and sha(r)==expected['sha256'] and blob(r)==expected['git'],'normal wire not equal to frozen full arm')
 pin=P['arms']['B']; actual={x:(candidate/x).read_bytes() for x in [cand['game'],cand['gameEntry'],cand['project'],packet,pin['map'],P['stageFar']['path'],P['stageFar']['config']]}
 loader=next((x for x in fn if x.startswith('web/runtime/campaign.') and x.rsplit('.',1)[-1]=='js' and x.split('/')[-1] in actual[cand['gameEntry']].decode()),None)
 need(loader,'candidate entry missing current campaign adapter');actual[loader]=(candidate/loader).read_bytes()
 need(cand['project'] in actual[loader].decode(),'normal campaign adapter does not select active content')
 receipt(out/'NORMAL-GRAPH.json',{'packet':packet,'map':pin['map'],'current':P['full']['signature'],'routeSHA256':{k:sha(v) for k,v in actual.items()},'commonChanged':[[x,y] for x,y in zip(old['common'],cand['common']) if x!=y],'gameOnlyChanged':[[x,y] for x,y in zip(old['gameOnly'],cand['gameOnly']) if x!=y],'other49providerAliasesAnd50MapBytesExact':True,'manifestSHA256':sha((candidate/'web/manifest.json').read_bytes())})
if __name__=='__main__':
 need(P['enabled'] is True,'disabled; no write or build')
 op,*args=sys.argv[1:]
 need(op in ('apply','graph') and len(args)==3,'normal apply/graph exact inputs')
 {'apply':apply,'graph':graph}[op](*[Path(x).resolve()for x in args])
