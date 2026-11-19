"""Exact per-view and isolated native BODY gates; no epsilon or corner waiver."""
import hashlib

def transparent_body(old_a,old_a2,body_b,bounds,clip_alpha):
 from pixel_gate import exact_stock,exact_protected
 stock=exact_stock(old_a,old_a2)
 if not stock['pass']:return {'pass':False,'stock_aa':stock}
 if len(clip_alpha)!=len(bounds):raise ValueError('Wrong native alpha size')
 allowed=bytes(bool(a) and c>0 for a,c in zip(bounds,clip_alpha,strict=True))
 gate=exact_protected(old_a,body_b,allowed,old_a[3::4])
 new=sum(a==0 and b>0 for a,b in zip(old_a[3::4],body_b[3::4],strict=True))
 lost=sum(a>0 and b==0 for a,b in zip(old_a[3::4],body_b[3::4],strict=True))
 return {**gate,'pass':gate['pass'] and new>0 and lost==0,'new_alpha_support':new,'lost_alpha_support':lost,'stock_aa':stock}

def full_scene_exact(controls,scopes,required):
 return set(controls)==required and set(scopes)==required and all(controls[n]['pass'] and scopes[n]['pass'] for n in required)

def sha(data):return hashlib.sha256(data).hexdigest()
