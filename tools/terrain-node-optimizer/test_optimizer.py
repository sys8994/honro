import unittest,math
from optimize_svg import simplify,dist
class SimplifierTests(unittest.TestCase):
 def test_collinear(self):
  d='M0 0L1 0 2 0 3 0 4 0 5 0';s,a,b=simplify(d,.1);self.assertLess(b,a)
 def test_move_boundaries(self):
  s,_,_=simplify('M0,0L1,0 2,0 3,0 M3,0L3,1 3,2 3,3',.1);self.assertEqual(s.count('M'),2)
 def test_open_return_not_closed(self):
  s,_,_=simplify('M0,0L1,0 2,0 3,0 3,1 3,2 3,3 2,3 1,3 0,3 0,2 0,1 0,0',.1);self.assertNotIn('Z',s)
 def test_internal_close_untouched(self):
  d='M0,0L1,0 2,0 3,0 3,1 3,2 3,3 2,3 1,3 0,3 0,2 0,1Z L-1,0 -2,0 -3,0'
  with self.assertRaises(ValueError):simplify(d,.1)
 def test_arc_skip(self):
  with self.assertRaises(ValueError):simplify('M0,0A10,10 0 0 0 20,0',.1)
 def test_ring_collapse_skip(self):
  with self.assertRaises(ValueError):simplify('M0,0L1,0L1,1L0,1Z',20)
 def test_rdp_bound(self):
  from optimize_svg import rdp
  p=[complex(i*.05,math.sin(i*.05)) for i in range(201)]
  q=rdp(p,.05)
  self.assertLess(len(q),len(p))
  self.assertLessEqual(max(min(dist(z,a,b) for a,b in zip(q,q[1:])) for z in p),.050000001)
class SymbolProtectionTests(unittest.TestCase):
 def test_inherited_stroke_use(self):
  from optimize_package import editable_nodes,unsafe_symbols
  v={'root':{'tag':'g','stroke':'red','children':[{'tag':'use','symbol':'foo'}]},'symbols':{'foo':{'tag':'path','d':'M0 0L1 0 2 0'}}}
  self.assertEqual(unsafe_symbols(v),{'foo'})
  self.assertTrue(list(editable_nodes(v))[0][2])
 def test_protected_and_safe_reuse(self):
  from optimize_package import unsafe_symbols
  v={'root':{'tag':'g','children':[{'tag':'use','symbol':'foo'},{'tag':'g','id':'contact','children':[{'tag':'use','symbol':'foo'}]}]},'symbols':{'foo':{'tag':'path','d':'M0 0L1 0 2 0'}}}
  self.assertEqual(unsafe_symbols(v),{'foo'})
 def test_nested_protection(self):
  from optimize_package import unsafe_symbols
  v={'root':{'tag':'use','symbol':'foo','stroke':'red'},'symbols':{'foo':{'tag':'use','symbol':'bar'},'bar':{'tag':'path','d':'M0 0L1 0'}}}
  self.assertEqual(unsafe_symbols(v),{'foo','bar'})
 def test_cycle_fails_closed(self):
  from optimize_package import unsafe_symbols
  v={'root':{'tag':'use','symbol':'foo'},'symbols':{'foo':{'tag':'use','symbol':'bar'},'bar':{'tag':'use','symbol':'foo'}}}
  self.assertEqual(unsafe_symbols(v),{'foo','bar'})

class RelativeMoveTests(unittest.TestCase):
 def assert_geometry(self,d):
  from optimize_svg import canonical_subpaths
  from svgpathtools import parse_path
  a=parse_path(d);b=parse_path(' '.join(canonical_subpaths(d)))
  self.assertEqual(len(a),len(b))
  for x,y in zip(a,b):
   for t in [0,.25,.5,.75,1]:self.assertAlmostEqual(abs(x.point(t)-y.point(t)),0)
 def test_relative_after_closed(self):self.assert_geometry('m10,20 l10,0 0,10 -10,0z m20,0l3,4 5,6z')
 def test_relative_after_open(self):self.assert_geometry('m10,20 l10,0 0,10 m20,0l3,4 5,6')
 def test_multiple_pairs(self):self.assert_geometry('m10,20 2,3 4,5 6,7 m2,3 4,5')
 def test_empty_move(self):self.assert_geometry('M10,20 m3,4 l5,6 7,8')
 def test_closed_and_open_semantics(self):
  from optimize_svg import canonical_subpaths
  d='m0,0l1,0 0,1 -1,0z m0,0l1,0 0,1 -1,0 0,-1'
  s=' '.join(canonical_subpaths(d));self.assertEqual(s.count('M'),2);self.assertEqual(s.count('Z'),1)
 def test_closing_curve_preserved(self):
  self.assert_geometry('m0,0 c1,1 3,4 5,6 c-1,-1 -3,-4 -5,-6z m1,1l2,3')
 def test_actual_simplify(self):
  d='m0,0l1,0 1,0 1,0 1,0 1,0 m2,0l1,0 1,0 1,0 1,0'
  s,a,b=simplify(d,.1);self.assertLess(b,a);self.assertEqual(s.count('M'),2)

if __name__=='__main__':unittest.main()
