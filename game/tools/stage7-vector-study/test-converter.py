import copy,importlib.util,json,os,xml.etree.ElementTree as E
from pathlib import Path
P=Path(__file__).parent;repo=Path(os.environ.get('HONRO_REPOSITORY',str(P.resolve().parents[2])));inputs=Path(os.environ.get('HONRO_SVG_INPUTS',str(repo/'game/tools/stage7-svg-study')))
spec=importlib.util.spec_from_file_location('convert',P/'convert.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
source=m.source_node(json.loads((repo/'shared/assets/environment/act1-sites/stage07.json').read_text())['art']['body']['vector']['root']);base=E.fromstring((inputs/'candidate.svg').read_text());N='{http://www.w3.org/2000/svg}'
def firstclip(s):return next(e for e in s.iter() if e.get('id')=='source-side-aa-complement')
def sourceuse(s):return next(e for e in s if e.tag==N+'use')
def nested(s):return next(e for e in s.iter() if e.tag==N+'svg' and e is not s)
def mutate(case,s):
 if case=='multiple-clip-children':c=firstclip(s);c.append(copy.deepcopy(c[0]))
 elif case=='clip-evenodd':firstclip(s).set('clip-rule','evenodd')
 elif case=='clip-transform':firstclip(s).set('transform','translate(1 1)')
 elif case=='child-clip-transform':firstclip(s)[0].set('transform','translate(1 1)')
 elif case=='external-use':sourceuse(s).set('href','https://invalid.example/asset.svg')
 elif case=='reachable-filter':sourceuse(s).set('filter','url(#visible-protection-halo)')
 elif case=='reachable-mask':sourceuse(s).set('mask','url(#semantic-interior)')
 elif case=='unknown-attr':sourceuse(s).set('vector-effect','non-scaling-stroke')
 elif case=='unknown-style':sourceuse(s).set('style','mix-blend-mode:multiply')
 elif case=='nested-default-aspect':nested(s).set('preserveAspectRatio','xMidYMid meet')
 elif case=='source-path-change':next(e for e in s.iter() if e.get('id')=='original-body-source').find('.//'+N+'path').set('d','M0 0H1V1Z')
 elif case=='use-cycle':next(e for e in s.iter() if e.get('id')=='vector-material').append(E.Element(N+'use',href='#vector-material'))
cases=['multiple-clip-children','clip-evenodd','clip-transform','child-clip-transform','external-use','reachable-filter','reachable-mask','unknown-attr','unknown-style','nested-default-aspect','source-path-change','use-cycle'];result={}
for case in cases:
 s=copy.deepcopy(base);mutate(case,s)
 try:m.compile_svg(E.tostring(s,encoding='unicode'),source)
 except (AssertionError,KeyError,ValueError) as e:result[case]={'rejected':True,'reason':str(e)}
 else:raise AssertionError('Unsupported mutation accepted: '+case)
valid=m.compile_svg(E.tostring(base,encoding='unicode'),source);result['unchanged-candidate']={'accepted':True,'nativeSourceCopiedExactly':valid['symbols']['original-body-source']==source}
(P/'generated/converter-negative-tests.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
