"""Regression checks for opt-in use of existing bounded native dParts."""
import importlib.util,json,re,unittest
from pathlib import Path
H=Path(__file__).resolve().parent;s=importlib.util.spec_from_file_location('imp',H/'import-svg.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class Tests(unittest.TestCase):
 def test_exact_order(self):
  small='M0 0H80V80H0Z m10 10v30h30v-30z';self.assertEqual(m.preserve_compound(small),{'d':small})
  loop='M0 0'+'L1 0 '*5000+'L1 1L0 1Z';d=' \n'+loop+' '+loop+' '+loop;r=m.preserve_compound(d);self.assertEqual(''.join(r['dParts']),d);self.assertTrue(all(len(p)<=60000 and p.lstrip()[0] in 'Mm' for p in r['dParts']))
 def test_rejections(self):
  for d in ['M0 0'+('L1 1 '*12001),'M0 0L1e309 2','M0 0L1000000001 0','M0 0<script>','L0 0Z','M0 0A1 1 0','M0 0'+('L0 0 '*50000)]:
   with self.assertRaises(ValueError,msg=d[:40]):m.preserve_compound(d)
 def test_compiler_opt_in(self):
  loop='M0 0'+'L1 0 '*5000+'L1 1L0 1Z';d=loop+' '+loop+' '+loop;src=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><g transform="translate(2 3)"><path d="{d}" fill="#88aacc" fill-rule="evenodd"/></g></svg>';cfg={'id':'test:compound','bounds':{'x':0,'y':0,'w':80,'h':80},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':80},'semanticLayer':'REAR','preserveCompounds':True};a=m.compile_svg(src,cfg)
  def walk(n):
   yield n
   for c in n.get('children',[]):yield from walk(c)
  paths=[n for n in walk(a['vector']['root']) if n['tag']=='path'];self.assertEqual(len(paths),1);self.assertEqual(''.join(paths[0]['dParts']),d);self.assertEqual(paths[0]['fillRule'],'evenodd');self.assertEqual(a['collision'],[])
  with self.assertRaises(ValueError):m.compile_svg(src,{**cfg,'preserveCompounds':'true'})
 def test_native_limit_parity(self):
  source=(H.parents[1]/'shared/map/vector-art.js').read_text();match=re.search(r'COMPOUND_LIMITS=Object.freeze\(\{([^}]+)\}',source);caps={k:int(v) for k,v in re.findall(r'(\w+):(\d+)',match.group(1))};self.assertEqual(caps,{'parts':32,'partChars':60000,'totalChars':240000,'numberTokens':120000,'assetChars':4000000});self.assertEqual(m.LIMIT,caps['partChars'])
if __name__=='__main__':unittest.main()
