import unittest,json
from growth_guard import *

class GrowthGuardTests(unittest.TestCase):
    def svg(self,d,pad=0):return ('<svg><path d="'+d+'"/>'+(' '*pad)+'</svg>').encode()
    def test_bytes_growth_reverts_exact_original(self):
        original=self.svg('M0 0L1 0Z');candidate=original+b' '
        output,r=guarded_output(original,candidate,svg_metrics)
        self.assertEqual(output,original);self.assertIn('bytes increased',r['reasons'])
    def test_segment_growth_even_when_bytes_shrink(self):
        original=self.svg('M0 0L2 0Z',100);candidate=self.svg('M0 0L1 0 2 0Z')
        output,r=guarded_output(original,candidate,svg_metrics)
        self.assertEqual(output,original);self.assertIn('segments increased',r['reasons'])
    def test_subpath_growth_even_with_fewer_segments(self):
        original=self.svg('M0 0L1 0 2 0 3 0 4 0Z',100)
        candidate=self.svg('M0 0L1 0 M2 0L3 0')
        output,r=guarded_output(original,candidate,svg_metrics)
        self.assertEqual(output,original);self.assertIn('subpaths increased',r['reasons'])
    def test_new_shape_element_rejected(self):
        o=b'<svg>                            </svg>';c=b'<svg><rect/></svg>'
        self.assertFalse(non_growth(o,c,svg_metrics)['accepted'])
    def test_invalid_path_fail_closed(self):
        o=self.svg('M0 0L1 0');c=self.svg('M0 junk')
        self.assertEqual(guarded_output(o,c,svg_metrics)[0],o)
    def test_dparts_compound_count(self):
        raw=json.dumps({'assets':[{'vector':{'root':{'tag':'path','dParts':['M0 0L1 0','M2 0L3 0']}}}]}).encode()
        self.assertEqual(package_metrics(raw),{'segments':2,'subpaths':2,'paths':1})
    def test_equal_or_reduced_all_metrics_allowed(self):
        o=self.svg('M0 0L1 0 2 0Z',100);c=self.svg('M0 0L2 0Z')
        self.assertTrue(non_growth(o,c,svg_metrics)['accepted'])
    def test_package_guards_bytes_and_segments(self):
        def pack(d):return json.dumps({'assets':[{'vector':{'root':{'tag':'path','d':d}}}]}).encode()
        o=pack('M0 0L2 0Z')+b' '*100;c=pack('M0 0L1 0 2 0Z')
        self.assertEqual(guarded_output(o,c,package_metrics)[0],o)
