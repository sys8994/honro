"""Draft typed Stage21 defaults only; no source checkout writes."""
import json,argparse,sys
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'ci'))
from parser import child,array,git_blob,sha256
raw_joint_blob='1d8875982b1f0d5de2796bdd7bb7c594b1b172fa'
compiled_blob='8fe811c291cef9a912a464ef77975cb1d3338ece'
rows='a3-foundation eup21-west-wall-step eup21-west-wall-stair eup21-east-wall-return eup21-gate-roof eup21-gate-roof-step eup21-market-west-step eup21-market-east-step eup21-office-roof-step eup21-office-west-step eup21-office-east-step eup21-market-entry-awning eup21-market-alley-eave eup21-market-potter-awning eup21-office-west-awning eup21-office-return-eave eup21-outside-stall-roof eup21-cloth-shelter-roof eup21-inner-home-roof eup21-potter-home-roof eup21-stable-roof eup21-office-store-roof eup21-office-hall-roof'.split()
defaults={'spacing':18,'roughness':0,'seed':1,'optimizeEpsilon':0}
default_data=json.dumps(defaults,separators=(',',':')).encode()
insert=b',"detail":'+default_data
assert sha256(default_data)=='4c9d671298e1c3a4bee9e814842705d2f5e9a56770bb18775838f8bbe42ddeaf'
def plan(raw,mode):
 assert mode in {'joint-canonical','published-compiled-fixture'}
 canonical=mode=='joint-canonical'
 assert git_blob(raw)==(raw_joint_blob if canonical else compiled_blob)
 s=raw.decode();doc=json.loads(s)
 if canonical:
  records=list(array(s,child(s,0,'stages')))
  matches=[i for i,(st,*_) in enumerate(records) if st['metadata']['stageId']==21]
  assert matches==[20] and len(records)==30
  st,_,loc,*_=records[20]
 else:st,loc=doc,0
 assert [st['metadata']['stageId'],st['width'],st['height']]==[21,6400,3200]
 t=list(array(s,child(s,loc,'terrains')))
 assert [o['id'] for o,*_ in t]==rows
 offsets=[]; receipts=[]
 for i,(o,_,start,end,*_) in enumerate(t):
  assert o['type']=='solid' and len(o['points'])>=3 and 'detail' not in o
  assert not o['breakable'] and (o['oneWay'] is (i!=0))
  assert bool(o.get('playProjection')) is (i==0)
  pos=end-1;assert s[pos]=='}'
  while s[pos-1] in ' \r\n\t':pos-=1
  offsets.append(len(s[:pos].encode()))
  receipts.append({'path':f'/stages/20/terrains/{i}/detail' if canonical else f'/terrains/{i}/detail','id':o['id'],'beforeType':'missing','afterType':'object','objectSHA256':sha256(default_data)})
 assert offsets==sorted(set(offsets))
 segs=[];last=0
 for offset in offsets:segs.append(raw[last:offset]);last=offset
 segs.append(raw[last:])
 out=insert.join(segs);check=json.loads(out)
 work=check['stages'][20] if canonical else check
 assert [(j['id'],j.pop('detail')) for j in work['terrains']]==[(id,defaults) for id in rows]
 assert check==doc and len(out)==len(raw)+23*len(insert)
 return out,{'mode':mode,'sourceSize':len(raw),'candidateSize':len(out),'oldGitBlob':git_blob(raw),'newGitBlob':git_blob(out),'oldSHA256':sha256(raw),'newSHA256':sha256(out),'untouchedBytes':len(raw),'insertedBytesCount':len(out)-len(raw),'fieldCount':23,'insertionOffsets':offsets,'exactPaths':receipts}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('mode');p.add_argument('source',type=Path);p.add_argument('candidate',type=Path);p.add_argument('receipt',type=Path)
 a=p.parse_args();assert a.source.resolve()!=a.candidate.resolve()
 out,j=plan(a.source.read_bytes(),a.mode);a.candidate.write_bytes(out);a.receipt.write_text(json.dumps(j,indent=2)+'\n')
