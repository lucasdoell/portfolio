"""Portfolio banners rendered with Polaris's own scene generator (night + dawn).

Imports ~/code/polaris/design/scripts/gen_textures.py read-only and writes PNGs to public/brand.
    uv run --with numpy --with pillow scripts/gen_banner.py 11      # 1440x420 banners
    uv run --with numpy --with pillow scripts/gen_banner.py 11 150  # 600px-tall case study covers
"""
import importlib.util, os, random, sys
sys.dont_write_bytecode = True
import numpy as np
from PIL import Image

SRC = os.path.expanduser("~/code/polaris/design/scripts/gen_textures.py")
spec = importlib.util.spec_from_file_location("gen_textures", SRC)
gt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gt)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "brand")
W, S = 360, 4
H = int(sys.argv[2]) if len(sys.argv) > 2 else 105  # 105 -> 1440 x 420 banner; 150 -> 600 cover
CABIN_RANGE = (int(W * 0.60), int(W * 0.72))  # under Polaris, like the X banner


def write(img, name):
    im = Image.fromarray(np.clip(img, 0, 255).astype("uint8"))
    gt.up(im, S).save(os.path.join(OUT, name))
    print(name)


def night(seed):
    img, ground, _ = gt.scene(W, H,
        ['#070912', '#0A0D1A', '#0E1325', '#141B33', '#1C2542', '#27304F'],
        [('#141A2C', 0.70, 0.18, 3), ('#10152A', 0.78, 0.14, 5), ('#0B0F1E', 0.86, 0.10, 9)],
        '#BCD3FF', True, seed)
    gt.place_cabin(img, ground, *CABIN_RANGE, gt.CABIN_NIGHT)
    return img


def dawn(seed):
    img, ground, _ = gt.scene(W, H,
        ['#C9D8F2', '#D8E1F4', '#E9E6F0', '#F6E4DA', '#FBE3CC', '#FCE9D2'],
        [('#B7C9A8', 0.70, 0.18, 3), ('#9DB78F', 0.78, 0.14, 5), ('#7FA074', 0.86, 0.10, 9)],
        '#FFFFFF', False, seed)
    r = random.Random(4)
    for _ in range(int(260 * W * H / (360 * 225))):
        x = r.randrange(W); y = r.randrange(int(H * 0.88), H)
        img[y, x] = gt.hexc(r.choice(['#F4D35E', '#FFFFFF', '#F2B5C4']))
    gt.place_cabin(img, ground, *CABIN_RANGE, gt.CABIN_DAWN)
    return img


if __name__ == "__main__":
    seed = int(sys.argv[1]) if len(sys.argv) > 1 else 11
    tag = "banner" if H == 105 else f"cover{H * S}"
    write(night(seed), f"{tag}-night.png")
    write(dawn(seed + 1), f"{tag}-dawn.png")
