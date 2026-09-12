import re

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Extract JavaScript content inside <script> tags to check syntax sanity
scripts = re.findall(r'<script.*?>(.*?)</script>', html, re.DOTALL)
full_js = "\n".join(scripts)

# Save temporary JS file to run Node syntax check
with open("temp_check.js", "w", encoding="utf-8") as f:
    f.write(full_js)

