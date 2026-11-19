"""Run two independent experiments. No render patch, imported project, or external site."""
import argparse,base64,hashlib,json,os,shutil,traceback
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from gameplay import play

here=Path(__file__).resolve().parent
p=argparse.ArgumentParser()
p.add_argument('--base',required=True)
p.add_argument('--out',type=Path,required=True)
a=p.parse_args()
assert urlparse(a.base).hostname=='127.0.0.1' and urlparse(a.base).scheme=='http', 'Loopback build only'
a.out.mkdir(parents=True,exist_ok=True)
out={'play':{'pass':False},'pan_diagnostics':{'pass':False},'overall_execution_pass':False,'physical_defect_judgment':'human-reviewed screenshots required','sha':os.environ.get('GITHUB_SHA')}
def save():
    (a.out/'result.json').write_text(json.dumps(out,indent=2,ensure_ascii=False))
def diagnostic(browser,result):
    context=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
    page=context.new_page()
    result['page_errors']=[]
    result['frames']=[]
    page.on('pageerror',lambda e:result['page_errors'].append(str(e)))
    try:
        page.goto(a.base+'/HONRO_WORKSHOP.html',wait_until='domcontentloaded')
        page.wait_for_function('window.HonroWorkshopAPI?.getEditorState()',timeout=90000)
        page.evaluate("HonroWorkshopAPI.selectStage('stage-42')")
        page.wait_for_function("HonroWorkshopAPI.getProject().activeStageId==='stage-42'",timeout=20000)
        code=(here/'diagnostic.js').read_text()
        for band,xy,zoom in (
            ('minimum-overview',[(3250,1430.5)],.16),
            ('landscape-pan',[(x,1850) for x in [-1000,-400,150,850,1550,2250,2950,3650,4350,5050,5750,6350,6950,7600]],.5),
            ('vertical-pan',[(3250,y) for y in [-1000,0,500,1000,1500,2000,2500,3000,3500,4400]],.35),
            ('corners',[(x,y) for y in (1050,3125) for x in (-550,7050)],.30)):
            # Smaller per-call payloads; all individual frames retained, no screenshot stitching.
            for i in range(0,len(xy),4):
                views=[{'label':f'{band}-{j:02d}','x':x,'y':y,'zoom':zoom} for j,(x,y) in enumerate(xy[i:i+4],i)]
                r=page.evaluate(code,{'views':views,'w':1280,'h':800,'seed':3910})
                for k in ('physics','units'):
                    assert result.get(k,r[k])==r[k],r[k]
                    result[k]=r[k]
                for frame in r['frames']:
                    data=frame.pop('png')
                    assert data.startswith('data:image/png;base64,')
                    png=base64.b64decode(data.split(',',1)[1],validate=True)
                    assert png.startswith(b'\x89PNG\r\n\x1a\n')
                    name='diagnostic-'+frame['label']+'.png'
                    (a.out/name).write_bytes(png)
                    frame.update({'file':name,'png_sha256':hashlib.sha256(png).hexdigest(),
                                  'clamped':any(abs(x-y)>1e-7 for x,y in zip(frame['requested'],frame['actual']))})
                    result['frames'].append(frame)
                save()
        if result['page_errors']:raise RuntimeError('Diagnostic page errors: '+str(result['page_errors']))
        assert len(result['frames'])==29
        result['scope']='29 normalized static original Scene frames along pan axes/corners. Not continuous play, not all positions.'
        result['pass']=True
    except Exception:
        if not page.is_closed():
            try:page.screenshot(path=str(a.out/'diagnostic-FAILED.png'))
            except Exception:pass
        raise
    finally:context.close()
executable=os.environ.get('HONRO_CHROME') or shutil.which('google-chrome') or shutil.which('chromium')
try:
    if not executable:raise RuntimeError('Existing Chrome required')
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=executable)
        out['chrome']=browser.version
        try:
            for key,fn in (('play',lambda:play(browser,a.base,a.out,out['play'])),
                           ('pan_diagnostics',lambda:diagnostic(browser,out['pan_diagnostics']))):
                try:fn()
                except Exception:out[key]['failure']=traceback.format_exc()
                save()
            out['overall_execution_pass']=all(out[k]['pass'] for k in ('play','pan_diagnostics'))
        finally:browser.close()
except Exception:
    out['launch_failure']=traceback.format_exc()
finally:save()
print(json.dumps({k:out[k]['pass'] for k in ('play','pan_diagnostics')}))
raise SystemExit(0 if out['overall_execution_pass'] else 1)
