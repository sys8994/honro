"""Deterministic fail-closed metric gates; never accepts a model's verdict text."""
import math

def numeric_gate(value,bounds,*,n=0,eligible=False,scope=None):
 base={'value':value,'target':bounds,'n':n,'scope':scope}
 if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or n<1:
  return {**base,'status':'FAIL_MISSING_MEASUREMENT'}
 if value<bounds[0] or value>bounds[1]:return {**base,'status':'FAIL_OUT_OF_RANGE'}
 if not eligible:return {**base,'status':'FAIL_UNVALIDATED_SCOPE'}
 return {**base,'status':'PASS'}

def overall(gates):
 return 'PASS' if gates and all(g.get('status')=='PASS'for g in gates) else 'FAIL_INCOMPLETE_OR_OUT_OF_RANGE'

if __name__=='__main__':
 import unittest
 class Contract(unittest.TestCase):
  def test_absent(self):self.assertEqual(numeric_gate(None,[1,2],n=1,eligible=True)['status'],'FAIL_MISSING_MEASUREMENT')
  def test_no_samples(self):self.assertEqual(numeric_gate(1,[1,2],eligible=True)['status'],'FAIL_MISSING_MEASUREMENT')
  def test_no_rubber_stamp(self):self.assertEqual(numeric_gate(True,[0,1],n=1,eligible=True)['status'],'FAIL_MISSING_MEASUREMENT')
  def test_nan(self):self.assertEqual(numeric_gate(float('nan'),[0,1],n=1,eligible=True)['status'],'FAIL_MISSING_MEASUREMENT')
  def test_low_high(self):
   for v in [0,3]:self.assertEqual(numeric_gate(v,[1,2],n=1,eligible=True)['status'],'FAIL_OUT_OF_RANGE')
  def test_proxy_scope(self):self.assertEqual(numeric_gate(1,[1,2],n=4,eligible=False)['status'],'FAIL_UNVALIDATED_SCOPE')
  def test_boundaries(self):
   for v in [1,2]:self.assertEqual(numeric_gate(v,[1,2],n=1,eligible=True)['status'],'PASS')
  def test_aggregate_missing(self):self.assertNotEqual(overall([]),'PASS');self.assertNotEqual(overall([{'status':'PASS'},{'status':'missing'}]),'PASS')
 unittest.main()
