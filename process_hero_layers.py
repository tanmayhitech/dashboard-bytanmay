import os
from PIL import Image, ImageFilter

src_path = r"src\assets\images\hero-cropped-ref.png"
out_dir = r"src\assets\images"

img = Image.open(src_path).convert("RGBA")
w, h = img.size

# We can also extract the girl central region (from x: 33% to x: 67%)
girl_box = (int(w * 0.32), int(h * 0.0), int(w * 0.68), int(h * 1.0))
girl_crop = img.crop(girl_box)
girl_crop.save(os.path.join(out_dir, "hero-girl-cutout.png"))
print("Saved hero-girl-cutout.png:", girl_crop.size)

# Let's also create a cracked stone / grunge texture for the text fill
# We can take samples from the L and S letters
tex_box = (int(w * 0.03), int(h * 0.05), int(w * 0.28), int(h * 0.95))
tex_crop = img.crop(tex_box)
tex_crop.save(os.path.join(out_dir, "distressed-text-texture.png"))
print("Saved distressed-text-texture.png:", tex_crop.size)

print("Layer assets ready!")
