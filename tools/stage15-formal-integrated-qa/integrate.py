"""Render-only authored candidate on an official detached test worktree."""
import hashlib,json,re,sys
from pathlib import Path
from patch import gitsha
from floor_asset import PACKAGE,PACK_BLOB,OUT_BLOB,make as make_floor,verify as verify_floor
from ledger import LEDGER,OPTIMIZER,check_ledgers,compiled,verify_compiled
D=Path(__file__).resolve().parent
WEST='act2-compact:stage15-act2-stage15-traced-west-flat-v2-1'
COMBINED='def9ee43b1ac654bb15c0bfd61e46febc7b80d2c'
HSHARED='bd9ecf177491642abadc3c8971042d401abf08bc'
COMBINED_SHA='380c4f94ead7f23b96fc70db464267403585b7627f1c05f4cd6d63c85dc644f0'
LEDGER_AFTER='1baa483bec04bc905d419cd36dbe803335a7e037'
sha=lambda b:hashlib.sha256(b).hexdigest()
fmt=lambda x:json.dumps(x,ensure_ascii=False,separators=(',',':'))
def west(pack):
 found=[a for a in pack['assets'] if a.get('id')==WEST]
 assert len(found)==1
 return found[0]
def token_span(s):
 key='"id":'+json.dumps(WEST)
 assert s.count(key)==1
 start=s.index(key)
 v=re.search(r'"vector":\s*',s[start:])
 off=start+v.end()
 value,end=json.JSONDecoder().raw_decode(s,off)
 assert type(value) is dict
 return off,end,value
def splice(raw,new):
 s=raw.decode()
 off,end,pre=token_span(s)
 assert west(json.loads(s))['vector']==pre
 out=s[:off]+fmt(new)+s[end:]
 assert west(json.loads(out))['vector']==new
 return out.encode()
def make(raw):
 assert gitsha(raw)==PACK_BLOB
 v4=make_floor(raw)
 assert gitsha(v4)==OUT_BLOB
 westvec=json.loads((D/'west-vector.json').read_bytes())
 h=splice(raw,westvec)
 both=splice(v4,westvec)
 assert gitsha(h)==HSHARED
 assert gitsha(both)==COMBINED and sha(both)==COMBINED_SHA
 raw_text=raw.decode()
 orig=token_span(raw_text);boff,bend,_=token_span(both.decode())
 assert both.decode()[:boff]+raw_text[orig[0]:orig[1]]+both.decode()[bend:]==v4.decode()
 before,hj,vj,x=map(json.loads,(raw,h,v4,both))
 assert west(vj)==west(before) and west(x)==west(hj)
 others=lambda q:[v for v in q['assets']if v['id']!=WEST]
 assert others(x)==others(vj) and others(hj)==others(before)
 assert before['stage']==x['stage']==hj['stage']==vj['stage']
 verify_floor(before,vj)
 return both,v4
def check_combined(live,B,C):
 raw=(live/PACKAGE).read_bytes()
 both,only_v=make(raw)
 assert (B/PACKAGE).read_bytes()==raw and (C/PACKAGE).read_bytes()==both
 assert check_ledgers(live,B,C)==LEDGER_AFTER
 a,b=compiled(B,'B'),compiled(C,'V')
 assert west(a['pack'])==west(json.loads(raw))
 assert west(b['pack'])==west(json.loads(both))
 rv=json.loads(fmt(b['pack']))
 west(rv)['vector']=west(a['pack'])['vector']
 verify_compiled(a['pack'],rv,json.loads(only_v))
 return a,b,{'scope':'only approved H and V4 art vectors; strict historical ledger replay unchanged',
             'authoredCombinedGitBlob':COMBINED,'ledgerGitBlob':LEDGER_AFTER,
             'compileOld':a['after'],'compileCandidate':b['after'],
             'bothVectorsRestoreExactCompiledStock':True}
if __name__=='__main__':
 A,B,C=map(lambda x:Path(x).resolve(),sys.argv[1:])
 assert len({A,B,C})==3
 old=(A/PACKAGE).read_bytes()
 both,v4=make(old)
 assert (C/PACKAGE).read_bytes()==v4  # the prior official ledger step was V4-only
 (C/PACKAGE).write_bytes(both)
 a,b,proof=check_combined(A,B,C)
 print(json.dumps(proof))
