import json,sys
from pathlib import Path
from parser import array,child,git_blob,sha256
assetid='stage12:quarry-carrier-rubble'
oldmin,newmin=.35,.22
def change(raw,match_body=True):
 s=raw.decode(); d=json.loads(s)
 key='library' if isinstance(d,dict) else None
 entries=list(array(s,child(s,0,key) if key else 0))
 found=[a for a in entries if a[0]['id']==assetid]
 assert len(found)==1
 asset,_,j,*_=found[0]
 ref=asset['reference']
 assert ref=={'heightM':4.866666666666666,'bounds':{'x':-352,'y':-269,'w':712,'h':292},'foot':{'x':0,'y':0},'scaleRange':[.35,4],'backgroundRange':[.35,4]}
 assert asset['collision']==[] and asset['vector']['viewBox']==[-352,-269,712,292]
 i=child(s,child(s,j,'reference'),'scaleRange')
 vals=list(array(s,i));assert [r[0] for r in vals]==[.35,4]
 a,b=vals[0][2:4];assert s[a:b]=='0.35'
 fork=(s[:a]+'0.22'+s[b:]).encode()
 z=json.loads(fork)
 target=(z[key] if key else z)[entries.index(found[0])]
 assert target['reference']['scaleRange']==[.22,4]
 target['reference']['scaleRange'][0]=.35
 assert z==d
 off=len(s[:a].encode());assert fork[:off]==raw[:off] and fork[off+4:]==raw[off+4:]
 if match_body:
  assert key=='library'
  st=d['stages'][12]
  uses=[(e['id'],e['scale']) for e in st['elements'] if e['assetId']==assetid]
  assert uses==[('stage13-finish-rubble-mason',.22),('stage13-finish-rubble-threshold',.24)],uses
 return fork,{'oldGitBlob':git_blob(raw),'newGitBlob':git_blob(fork),'oldSHA256':sha256(raw),'newSHA256':sha256(fork),'rawSizeBytes':len(raw),'onlyByteOffset':off,'from':'0.35','to':'0.22','asset':assetid,'field':'reference.scaleRange[0]'}
if __name__=='__main__':
 p,receipt=map(Path,sys.argv[1:])
 raw=p.read_bytes()
 assert git_blob(raw)=='93cde49bc09b85a1e93d555e7d55cab7bf4fb28d'
 out,row=change(raw)
 p.write_bytes(out)
 receipt.write_text(json.dumps(row,indent=2))
