import sys
from pathlib import Path
p=Path(sys.argv[1])/'smoke.py'
s=p.read_text()
key="    ctx=context=browser.new_context("
# hook the witness-only route setup; not in game source
point="        route_only_local_release(ctx)"
assert s.count(point)==1
s=s.replace(point,point+"""
        ctx.add_init_script('''(() => {
          if(location.hostname!=='sys8994.github.io')return;
          const original=Storage.prototype.setItem;
          window.__act6FixtureTrace={};
          Storage.prototype.setItem=function(k,v){
            const result=original.call(this,k,v);
            if(k.startsWith('honro-campaign-act6-boundary-v2:')){
              const obj=JSON.parse(v), body=obj.honroAct6ChapterBoundary?.body;
              if(body&&body.to>=52&&body.to<=60&&!window.__act6FixtureTrace[body.to]){
               const base=this.getItem('honro-first-act-profile-1');
               window.__act6FixtureTrace[body.to]={body,profile:JSON.parse(base)};
              }
            }
            return result;
          };
        })();''')
""",1)
point="        state['status']='PASS'"
assert s.count(point)==1
s=s.replace(point,"""        if arm=='ON' and kind=='fresh-pending':
            trace=page.evaluate("()=>window.__act6FixtureTrace")
            assert sorted(int(x) for x in trace)==list(range(52,61)),list(trace)
            (out/f'{label}-DEBUG-FIXTURES.json').write_text(json.dumps(trace,ensure_ascii=False,separators=(',',':')))
        state['status']='PASS'""",1)
s=s.replace("        viewports=[('PC',1440,900,False)] if audio_only else [('PC',1440,900,False),('M',390,844,True)]","        viewports=[('PC',1440,900,False)]")
s=s.replace("            arms=[('ON','fresh-pending')] if audio_only else [('OFF','fresh-pending'),('ON','fresh-pending'),('ON','legacy-format')]","            arms=[('ON','fresh-pending')]")
p.write_text(s)
