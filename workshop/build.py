from pathlib import Path
root=Path(__file__).parent
html=(root/'src/index.html').read_text()
html=html.replace('/*STYLE*/',(root/'src/style.css').read_text())
html=html.replace('/*SCRIPT*/',(root/'src/app.js').read_text())
(root/'HONRO_MAP_WORKSHOP.html').write_text(html)
print(root/'HONRO_MAP_WORKSHOP.html')
