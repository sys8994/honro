"""Byte-preserving excision of exactly two Stage22 visual rows."""
import argparse,hashlib,json,re
from pathlib import Path

W=re.compile(r'[ \r\n\t]*')
TOK=json.JSONDecoder()
EXPECTED={
 'v22-art-built-buried-west-foundation':{'fill':'#354d48','points':[[0,5660],[1590,5660],[1590,6600],[0,6600]]},
 'v22-art-built-buried-east-foundation':{'fill':'#304a47','points':[[1610,4940],[4810,4940],[4810,6620],[1610,6620]]},
}
def sha256(data):return hashlib.sha256(data).hexdigest()
def git_blob(data):return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
def ws(s,i):return W.match(s,i).end()
def child(s,i,key):
 i=ws(s,i);assert s[i]=='{';i=ws(s,i+1)
 while s[i]!='}':
  k,e=TOK.raw_decode(s,i);assert isinstance(k,str)
  colon=ws(s,e);assert s[colon]==':'
  j=ws(s,colon+1)
  if k==key:return j
  _,e=TOK.raw_decode(s,j);i=ws(s,e)
  if s[i]=='}':break
  assert s[i]==',';i=ws(s,i+1)
 raise KeyError(key)
def array(s,i):
 assert s[i]=='[';i+=1
 while True:
  start=ws(s,i)
  if s[start]==']':return
  value,end=TOK.raw_decode(s,start)
  sep=ws(s,end);assert s[sep] in [',',']']
  yield(value,i,start,end,sep,s[sep])
  if s[sep]==']':return
  i=sep+1

def produce(raw,mode):
 s=raw.decode('utf-8');doc=json.loads(s)
 if mode=='canonical':
  stages=child(s,0,'stages')
  ixs=[(i,j) for i,(st,_,j,_,_,_) in enumerate(array(s,stages)) if st.get('metadata',{}).get('stageId')==22]
  assert len(ixs)==1 and ixs[0][0]==21
  idx,start=ixs[0]; stage=doc['stages'][idx];stage_count=len(doc['stages'])
 else:
  assert doc['metadata']['stageId']==22
  idx,start=None,0;stage=doc;stage_count=1
 i=start
 for k in ('design','space','terrainPlanes'):i=child(s,i,k)
 arr=list(array(s,i)); found=[];spans=[];rows=[]
 for row,lead,start,end,separator,stop in arr:
  name=row['id']
  if name not in EXPECTED:continue
  assert name not in found and row['terrainId']=='v22-lower-court' and row['stage22VerticalArt'] is True
  assert {k:row[k] for k in ('fill','points')}==EXPECTED[name],row
  assert stop==',','Exact source expectation: target must not be the final row'
  found.append(name);spans.append((lead,separator+1));rows.append(row)
 assert set(found)==set(EXPECTED) and not stage['materials']
 pieces=[];a=0
 for x,z in spans:
  assert x>=a
  pieces.append(s[a:x]);a=z
 pieces.append(s[a:]);output=''.join(pieces).encode('utf-8')
 new=json.loads(output);dst=new['stages'][idx] if mode=='canonical' else new
 old_rows=stage['design']['space']['terrainPlanes'];new_rows=dst['design']['space']['terrainPlanes']
 assert new_rows==[row for row in old_rows if row['id'] not in EXPECTED]
 dst['design']['space']['terrainPlanes']=old_rows
 assert new==doc,'Difference outside exact Stage22 row removals'
 byte_spans=[[len(s[:x].encode()),len(s[:y].encode())] for x,y in spans]
 assert output==b''.join(raw[x:y] for x,y in zip([0]+[z for _,z in byte_spans],[a for a,_ in byte_spans]+[len(raw)])),'Any retained raw byte drift'
 removed=[{'id':r['id'],'startByte':x,'endByteExclusive':y,'bytes':y-x,'sha256':sha256(raw[x:y])} for r,(x,y) in zip(rows,byte_spans)]
 return output,dict(mode=mode,stages=stage_count,otherStages=stage_count-1,oldRawBytes=len(raw),newRawBytes=len(output),oldRawSHA256=sha256(raw),newRawSHA256=sha256(output),oldGitBlob=git_blob(raw),newGitBlob=git_blob(output),oldPlaneCount=len(old_rows),newPlaneCount=len(new_rows),removed=removed,retainedBytesExact=True,nonTargetJsonExact=True)

if __name__=='__main__':
 p=argparse.ArgumentParser()
 p.add_argument('input',type=Path);p.add_argument('output',type=Path);p.add_argument('report',type=Path)
 p.add_argument('--mode',choices=['canonical','compiled-fixture'],default='canonical')
 p.add_argument('--expected-old-git-blob');p.add_argument('--author',type=Path)
 a=p.parse_args();old=a.input.read_bytes()
 if a.expected_old_git_blob:assert git_blob(old)==a.expected_old_git_blob
 out,m=produce(old,a.mode)
 if a.author:
  source=a.author.read_bytes()
  assert all(name.encode() not in source and name.removeprefix('v22-art-built-').encode() not in source for name in EXPECTED)
  m['selectedAuthorSHA256']=sha256(source)
  m['selectedAuthorGitBlob']=git_blob(source)
 a.output.write_bytes(out);a.report.write_text(json.dumps(m,indent=2)+'\n')
