"""Gera o index.html do app Órbita IA a partir de app.src.html.

Uso: python3 build.py

- app.src.html  -> telas, visual e regras do app (é aqui que se edita)
- assistente.js -> o "cérebro" que entende as frases e responde
- index.html    -> arquivo final publicado (gerado, não edite à mão)
"""
from pathlib import Path

raiz = Path(__file__).parent
VERSAO = "20261113e"  # mude a cada publicação para os celulares baixarem a novidade

src = (raiz / "app.src.html").read_text(encoding="utf-8")
fim_head = src.index("</style>") + len("</style>")
cabeca, corpo = src[:fim_head], src[fim_head:]
splash = (raiz / "assets" / "app" / "splash" / "links.html").read_text(encoding="utf-8").strip()

head = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<meta name="description" content="Órbita IA: anote gastos, recebimentos, compromissos, tarefas e metas conversando. Funciona sem internet e guarda tudo só no seu celular.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="64x64" href="assets/app/favicon-64.png">
<link rel="apple-touch-icon" href="assets/app/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Órbita IA">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
{splash}
<script src="base-conhecimento.js?v={VERSAO}"></script>
<script src="assistente.js?v={VERSAO}"></script>
"""

extra = """
<script>
/* teclado no celular: esconde as abas de baixo enquanto digita */
(function(){
  var campo=function(el){return el&&(el.tagName==="INPUT"||el.tagName==="TEXTAREA"||el.tagName==="SELECT")&&el.type!=="checkbox"&&el.type!=="radio"&&el.type!=="file"};
  document.addEventListener("focusin",function(e){if(campo(e.target))document.body.classList.add("kb")});
  document.addEventListener("focusout",function(){setTimeout(function(){if(!campo(document.activeElement))document.body.classList.remove("kb")},120)});
  if(window.visualViewport){var vv=window.visualViewport;vv.addEventListener("resize",function(){if(document.body.classList.contains("kb")&&document.activeElement&&document.activeElement.id==="chatIn"){window.scrollTo(0,document.body.scrollHeight)}})}
})();
/* app instalável + funciona sem internet */
if("serviceWorker" in navigator)addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})});
</script>
"""

html = head + cabeca + "\n</head>\n<body>\n" + corpo.replace("assistente.js", "assistente.js") + extra + "</body>\n</html>\n"
(raiz / "index.html").write_text(html, encoding="utf-8")

sw = (raiz / "sw.js").read_text(encoding="utf-8")
import re
sw = re.sub(r"const VERSION = '[^']*';", f"const VERSION = 'orbita-ia-{VERSAO}';", sw)
sw = re.sub(r"assistente\.js\?v=[^']*'", f"assistente.js?v={VERSAO}'", sw)
(raiz / "sw.js").write_text(sw, encoding="utf-8")
print("index.html gerado · versão", VERSAO)


sw = (raiz / "sw.js").read_text()
sw = re.sub(r"base-conhecimento\.js\?v=[^' ]*", f"base-conhecimento.js?v={VERSAO}", sw)
(raiz / "sw.js").write_text(sw)
