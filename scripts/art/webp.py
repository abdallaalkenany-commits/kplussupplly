import json, os
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__))
for j in json.load(open(os.path.join(D, "out/jobs.json"))):
    png = j["out"][:-5] + ".png"
    Image.open(png).convert("RGB").save(j["out"], "WEBP", quality=80, method=6)
    os.remove(png)
