"""Clean factory product photos for the K Plus site: remove the factory logo, label
boxes, code tags and gold frame, then export web-ready WebP.

usage: python3 clean.py RAW_DIR OUT_DIR
Boxes are fractions of the image (x0, y0, x1, y1). Doors: a tall crop around the door.
Wall cladding: crop the frame, logo and code line away (patterns crop cleanly).
"""
import sys, os, json
import cv2
from PIL import Image

DOORS = {  # file -> (slug, ar, en, crop that keeps the door and leaves logo/labels/codes/frame out)
    "door-face_207_1.jpg":   ("door-207", "وش باب 2 قائم — كود 207", "2-stile door face — code 207", (0.284, 0.04, 0.724, 0.955)),
    "door-face_608_1.jpg":   ("door-608", "وش باب 4 خط — كود 608", "4-line door face — code 608", (0.286, 0.04, 0.704, 0.955)),
    "door-face_cnc_1.jpg":   ("door-508", "وش باب تصميم CNC — كود 508", "CNC design door face — code 508", (0.286, 0.04, 0.80, 0.955)),
    "door-face_5016_1.jpg":  ("door-5016", "وش باب ميلامين استانلس — كود 5016", "Melamine door face with steel inlay — code 5016", (0.17, 0.04, 0.652, 0.955)),
    "door-face_910_1.jpg":   ("door-910", "وش باب أوكراني — كود 910", "Ukrainian-style door face — code 910", (0.279, 0.04, 0.714, 0.955)),
    "door-face_2189S_1.jpg": ("door-2189s", "وش باب تصميم إيطالي — كود 2189S", "Italian-design door face — code 2189S", (0.286, 0.04, 0.694, 0.955)),
}
# Model codes printed on the factory cladding photos.
CLAD_CODES = {"a1": "A64", "a2": "A84", "b1": "B10", "b2": "B59", "l1": "L10", "l2": "L64", "m1": "M10", "m2": "M64",
              "o1": "O10", "o2": "O84", "u1": "U84", "u2": "U10", "v1": "V10", "w1": "W10", "x1": "X10", "x2": "X64",
              "y1": "Y64", "z1": "Z64"}
CLAD_CROP = (0.13, 0.03, 0.975, 0.93)
CLAD_CROP_OVERRIDE = {"z1": (0.13, 0.03, 0.975, 0.86)}  # code tag sits higher on this one

def box(b, w, h):
    return int(b[0] * w), int(b[1] * h), int(b[2] * w), int(b[3] * h)

def save(img_bgr, path, size):
    im = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
    im.thumbnail((size, size * 2), Image.LANCZOS)
    im.save(path, "WEBP", quality=80, method=6)
    return im.size

def main(raw, out):
    os.makedirs(out, exist_ok=True)
    meta = {}
    for f in sorted(os.listdir(raw)):
        if not f.endswith(".jpg"):
            continue
        img = cv2.imread(os.path.join(raw, f)); h, w = img.shape[:2]
        if f in DOORS:
            slug, ar, en, crop = DOORS[f]
        else:  # wall-cladding_<letter>_<n>.jpg
            key = f[len("wall-cladding_"):-4].replace("_", "")
            code = CLAD_CODES[key]
            slug, ar, en, crop = f"cladding-{code.lower()}", f"تجليد حوائط — كود {code}", f"Wall cladding — code {code}", CLAD_CROP_OVERRIDE.get(key, CLAD_CROP)
        x0, y0, x1, y1 = box(crop, w, h)
        img = img[y0:y1, x0:x1]
        size = save(img, os.path.join(out, slug + ".webp"), 1000)
        meta[slug] = {"file": f, "ar": ar, "en": en, "w": size[0], "h": size[1]}
    json.dump(meta, open(os.path.join(out, "meta.json"), "w"), ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
