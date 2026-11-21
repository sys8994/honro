"""Create/reverse exact prototype only in the disposable B worktree."""
import argparse,hashlib,json,sys
from pathlib import Path
HOME=Path(__file__).resolve().parent
OLD='25c34f4a8c246c543389a472eb1746e6e226da88'
TAG=b'STAGE15_NORTH_QA_PROTOTYPE'
SOURCE='shared/runtime/renderer.js'
def gitsha(content):return hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest()
def patch(old):
 assert gitsha(old)==OLD and TAG not in old
 src=old.decode()
 cut='        _drawTerrainDomainTiles(c,b,w,h){'
 h='                    const landmarks=b.honroStage===5&&top>=8192?material.flatMap(l=>{'
 call="                    this._landmarkLayer(cc,landmarks,'back');this._landmarkLayer(cc,landmarks,'structural-back');"
 assert all(src.count(needle)==1 for needle in (cut,h,call))
 method=(HOME/'method.txt').read_text().replace('__SIGNED_NATIVE_MASK__',json.dumps(json.loads((HOME/'mask.json').read_bytes()),separators=(',',':')))
 assert method.count(TAG.decode())==1
 return src.replace(cut,method+cut).replace(h,h.replace('const landmarks','let landmarks')).replace(
  call,'                    landmarks=this._stage15NorthQaTiles(b,domain,landmarks,view,rs);\n'+call).encode()
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('reference',type=Path);p.add_argument('freshB',type=Path)
 a=p.parse_args()
 old=(a.reference/SOURCE).read_bytes();out=a.freshB/SOURCE
 assert a.reference!=a.freshB and out.read_bytes()==old
 newer=patch(old);out.write_bytes(newer)
 print(json.dumps({'source':SOURCE,'beforeGitBlob':gitsha(old),'disposableQATargetGitBlob':gitsha(newer),'notRelease':True}))
