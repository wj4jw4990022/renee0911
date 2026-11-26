# 把拆開的檔案打包成單一 HTML（給 Drive 備份、離線分享用）。用法：python3 tools/bundle.py 輸出路徑
import re, sys, base64, os
R = os.path.dirname(os.path.abspath(__file__)) + '/../'
h = open(R + 'index.html', encoding='utf-8').read()
css = open(R + 'css/style.css', encoding='utf-8').read()
font = base64.b64encode(open(R + 'fonts/Cubic_11.woff2', 'rb').read()).decode()
css = css.replace("url('../fonts/Cubic_11.woff2')", "url(data:font/woff2;base64," + font + ")")
h = re.sub(r'<link rel="stylesheet" href="css/style.css[^"]*">', lambda m: '<style>\n' + css + '\n</style>', h)
h = re.sub(r'<link rel="(manifest|preload)"[^>]*>\n?', '', h)
ico = base64.b64encode(open(R + 'icons/favicon-64.png', 'rb').read()).decode()
h = re.sub(r'href="icons/favicon-64.png"', 'href="data:image/png;base64,' + ico + '"', h)
h = re.sub(r'<link rel="apple-touch-icon"[^>]*>\n?', '', h)
h = re.sub(r'<script src="(js/[^"?]+)[^"]*"></script>', lambda m: '<script>\n' + open(R + m.group(1), encoding='utf-8').read().replace('</script', '<\\/script') + '\n</script>', h)
h = re.sub(r"<script>\n// v17.28：App 模式.*?</script>\n", '', h, flags=re.S)
open(sys.argv[1], 'w', encoding='utf-8').write(h); print(len(h))
