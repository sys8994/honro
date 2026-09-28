from pathlib import Path
import os
import shutil

ROOT = Path(__file__).resolve().parents[1]
(ROOT / '_local/reports').mkdir(parents=True, exist_ok=True)
(ROOT / '_local/game-reports').mkdir(parents=True, exist_ok=True)

def browser_path():
    candidates = [os.environ.get('HONRO_BROWSER'), shutil.which('chromium'), shutil.which('google-chrome'),
                  r'C:\Program Files\Google\Chrome\Application\chrome.exe',
                  r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe']
    return next((p for p in candidates if p and Path(p).exists()), None)

def launch(playwright):
    return playwright.chromium.launch(executable_path=browser_path(), headless=True,
        args=['--no-sandbox', '--disable-dev-shm-usage', '--enable-precise-memory-info'])
