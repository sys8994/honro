"""Read headless browser GPU/Canvas backend; not a hardware phone measurement."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(__file__).resolve().parents[2]/'_local/act4-perf';out.mkdir(parents=True,exist_ok=True);tag=sys.argv[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);cdp=b.new_browser_cdp_session();j=cdp.send('SystemInfo.getInfo');g=j.get('gpu',{});r={'browserVersion':b.version,'devices':g.get('devices'),'featureStatus':g.get('featureStatus'),'glRenderer':g.get('auxAttributes',{}).get('glRenderer'),'displayType':g.get('auxAttributes',{}).get('displayType'),'hardwareSupportsVulkan':g.get('auxAttributes',{}).get('hardwareSupportsVulkan')};(out/f'stage40-backend-{tag}.json').write_text(json.dumps(r,indent=2));print(json.dumps(r));b.close()
