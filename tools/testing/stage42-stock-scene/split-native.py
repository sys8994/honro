from pathlib import Path
import xml.etree.ElementTree as E,concurrent.futures,subprocess,os,copy,json,hashlib
D=Path('stage42-continuity-study');O=D/'native-split';O.mkdir(exist_ok=True);N='http://www.w3.org/2000/svg';E.register_namespace('',N)
r=E.parse(D/'continuity-native.svg').getroot();ns={'s':N};paths=r.findall('./s:g/s:g/s:path',ns)
def run(arg):
 i,p,side=arg;root=E.Element('{%s}svg'%N,viewBox='0 0 1403 1121',width='1403',height='1121');q=copy.deepcopy(p);q.set('id','art');root.append(q)
 x1,x2=(0,702.5)if side==0 else(700.5,1403)
 E.SubElement(root,'{%s}path'%N,id='cut',d=f'M{x1},0H{x2}V1121H{x1}Z')
 src=O/f'{i}-{side}.svg';out=O/f'{i}-{side}-cut.svg';E.ElementTree(root).write(src,encoding='utf-8',xml_declaration=True)
 env=dict(os.environ,LD_PRELOAD=str((D/'init-wrappers.so').resolve()),XDG_CACHE_HOME=str((D/'cache').resolve()))
 cmd=['inkscape',str(src),'--batch-process',f'--actions=select-by-id:art,cut;path-intersection;export-filename:{out};export-text-to-path;export-do;file-close']
 rr=subprocess.run(cmd,env=env,capture_output=True,text=True);(O/f'{i}-{side}.log').write_text(rr.stdout+rr.stderr);assert rr.returncode==0 and out.exists(),rr.stderr
 result=E.parse(out).getroot();ps=list(result.iter('{%s}path'%N));assert len(ps)==1
 ps[0].set('style',p.get('style'));ps[0].set('id',f'color{i}-{side}');return ps[0]
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as ex:split=list(ex.map(run,[(i,paths[i],s)for i in (6,9)for s in range(2)]))
out=[]
for i,p in enumerate(paths):
 out.extend([q for q in split if q.get('id').startswith(f'color{i}-')] if i in (6,9)else[copy.deepcopy(p)])
root=E.Element('{%s}svg'%N,viewBox='0 0 1403 1121',width='1403',height='1121');root.append(copy.deepcopy(r.find('./s:defs',ns)));g=E.SubElement(root,'{%s}g'%N,{'clip-path':'url(#source-alpha)'});g=E.SubElement(g,'{%s}g'%N)
for p in out:g.append(p)
E.ElementTree(root).write(D/'continuity-native-split.svg',encoding='utf-8',xml_declaration=True)
print(hashlib.sha256((D/'continuity-native-split.svg').read_bytes()).hexdigest())
