import urllib.request

# Write HTML favicon link explicitly in index.html
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

favicon_tags = '''  <link rel="icon" href="favicon.svg" type="image/svg+xml" />
  <link rel="alternate icon" href="favicon.ico" type="image/x-icon" />'''

if '<link rel="icon"' in html:
    html = html.replace('<link rel="icon" href="favicon.ico" type="image/x-icon" />', favicon_tags)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Favicon configuration injected into index.html")
